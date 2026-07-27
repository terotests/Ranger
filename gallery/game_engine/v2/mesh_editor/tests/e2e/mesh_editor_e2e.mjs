// ============================================================================
// mesh_editor_e2e.mjs — Playwright end-to-end suite for the spline mesh editor.
// ============================================================================
//
//   node gallery/game_engine/v2/mesh_editor/tests/e2e/mesh_editor_e2e.mjs
//   (normally driven by mesh_editor/tests/run.sh, which is registered in the
//    central v2/tests/run.sh)
//
// Boots the REAL editor: rebuilds the Ranger artifacts (spline_lathe.rgr →
// ESM, web_mesh_editor_host.rgr → bundle), starts the actual Vite dev server
// (so the /api/library filesystem "database" is live), and drives the Vue UI
// in headless Chromium. Assertions are on observable behaviour — rendered
// pixels, mesh changes, and a library save/load round-trip — not on module
// internals (the `app/scripts/smoke-*.mjs` scripts cover module-level logic).
//
// Prints the v2 driver's grep convention:
//   "  PASS <name>" / "  FAIL <name>", "passed=X failed=Y", "ALL PASS".
//
// Exit codes:  0 = ALL PASS   1 = failures   3 = SKIP (prerequisites absent)
//
// The library root is redirected to a temp dir via MESH_EDITOR_LIBRARY, so a
// run never touches the developer's own `library/projects/`.
// ============================================================================

import { createRequire } from "node:module";
import { spawn, execFileSync } from "node:child_process";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const MESH_EDITOR = path.resolve(HERE, "../..");
const APP = path.join(MESH_EDITOR, "app");
const REPO_ROOT = path.resolve(MESH_EDITOR, "../../../..");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const SHOT_DIR = path.join(MESH_EDITOR, "tests", "_shots");

const KEEP_SHOTS = process.argv.includes("--keep-shots");
const HEADED = process.argv.includes("--headed");

// ---------------------------------------------------------------------------
// Preflight — a missing browser or un-installed app is a SKIP, never a FAIL.
// The central gate must stay runnable on a machine that has no npm install.
// ---------------------------------------------------------------------------
function preflight() {
  if (!fs.existsSync(path.join(APP, "node_modules")))
    return "app deps not installed (cd gallery/game_engine/v2/mesh_editor/app && npm install)";
  if (!fs.existsSync(CHROME)) return `chromium not found at ${CHROME}`;
  try {
    createRequire("/opt/node22/lib/node_modules/x")("playwright");
  } catch {
    return "playwright module not resolvable";
  }
  return null;
}

const skipReason = preflight();
if (skipReason) {
  console.log(`  SKIP mesh_editor_e2e — ${skipReason}`);
  process.exit(3);
}

const require = createRequire("/opt/node22/lib/node_modules/x");
const { chromium } = require("playwright");

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;
function check(name, ok, detail) {
  if (ok) {
    passed += 1;
    console.log(`  PASS ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
  return ok;
}

// ---------------------------------------------------------------------------
// Build the Ranger halves the editor depends on, then serve the real app.
// ---------------------------------------------------------------------------
function buildRangerArtifacts() {
  // tessellate/build.mjs compiles spline_lathe.rgr; build-host.mjs compiles
  // web_mesh_editor_host.rgr. Both shell out to the Ranger compiler, so a
  // compile regression in either .rgr fails this suite.
  execFileSync("node", [path.join(MESH_EDITOR, "tessellate", "build.mjs")], {
    cwd: REPO_ROOT,
    stdio: "pipe",
  });
  execFileSync("node", [path.join(MESH_EDITOR, "build-host.mjs")], {
    cwd: REPO_ROOT,
    stdio: "pipe",
  });
  execFileSync("node", [path.join(APP, "scripts", "sync-public.mjs")], {
    cwd: APP,
    stdio: "pipe",
  });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function startVite(port, libRoot) {
  const child = spawn(
    "npx",
    ["vite", "--port", String(port), "--strictPort", "--host", "127.0.0.1"],
    {
      cwd: APP,
      env: { ...process.env, MESH_EDITOR_LIBRARY: libRoot },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  const ready = new Promise((resolve, reject) => {
    const t0 = Date.now();
    const poll = setInterval(() => {
      if (/ready in|Local:/i.test(log)) {
        clearInterval(poll);
        resolve();
      } else if (child.exitCode !== null) {
        clearInterval(poll);
        reject(new Error(`vite exited (${child.exitCode}):\n${log.slice(-800)}`));
      } else if (Date.now() - t0 > 60000) {
        clearInterval(poll);
        reject(new Error(`vite did not start in 60s:\n${log.slice(-800)}`));
      }
    }, 200);
  });
  return { child, ready, getLog: () => log };
}

// ---------------------------------------------------------------------------
// Pixel measurement.
//
// A WebGL canvas cannot be read with drawImage/getImageData after the frame is
// composited (no preserveDrawingBuffer) — it reads back blank. So: try the
// in-page 2D read first, and fall back to an element screenshot for GL
// canvases. Same strategy as web/tests/browser_smoke.mjs.
// ---------------------------------------------------------------------------
async function canvasStats(page, selector, tag) {
  const direct = await page.evaluate((sel) => {
    const c = document.querySelector(sel);
    if (!c) return { missing: true };
    try {
      const g = c.getContext("2d");
      if (!g) return { webgl: true };
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const seen = new Set();
      let lit = 0;
      for (let i = 0; i < d.length; i += 4) {
        seen.add(((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4));
        if (d[i] + d[i + 1] + d[i + 2] > 24) lit += 1;
      }
      return { colors: seen.size, coverage: lit / (c.width * c.height) };
    } catch {
      return { webgl: true };
    }
  }, selector);

  if (direct.missing) return { colors: 0, coverage: 0, signature: "missing" };
  if (!direct.webgl) {
    return { ...direct, signature: await signatureOf(page, selector, tag) };
  }

  // WebGL path: analyse an element screenshot.
  const shot = await screenshotOf(page, selector, tag);
  const stats = await page.evaluate(async (b64) => {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = "data:image/png;base64," + b64;
    });
    const cv = document.createElement("canvas");
    cv.width = img.width;
    cv.height = img.height;
    const g = cv.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
    const seen = new Set();
    let lit = 0;
    const buckets = new Array(64).fill(0);
    for (let i = 0; i < d.length; i += 4) {
      seen.add(((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4));
      if (d[i] + d[i + 1] + d[i + 2] > 24) lit += 1;
      buckets[((d[i] >> 6) << 4) | ((d[i + 1] >> 6) << 2) | (d[i + 2] >> 6)] += 1;
    }
    return {
      colors: seen.size,
      coverage: lit / (cv.width * cv.height),
      signature: buckets.join(","),
    };
  }, shot.toString("base64"));
  return stats;
}

async function screenshotOf(page, selector, tag) {
  const el = await page.$(selector);
  if (!el) throw new Error(`no element ${selector}`);
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const p = path.join(SHOT_DIR, `${tag}.png`);
  await el.screenshot({ path: p });
  return fs.readFileSync(p);
}

/** Coarse colour histogram — stable enough to detect "the mesh changed". */
async function signatureOf(page, selector, tag) {
  const shot = await screenshotOf(page, selector, tag);
  return page.evaluate(async (b64) => {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = "data:image/png;base64," + b64;
    });
    const cv = document.createElement("canvas");
    cv.width = img.width;
    cv.height = img.height;
    const g = cv.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
    const buckets = new Array(64).fill(0);
    for (let i = 0; i < d.length; i += 4)
      buckets[((d[i] >> 6) << 4) | ((d[i + 1] >> 6) << 2) | (d[i + 2] >> 6)] += 1;
    return buckets.join(",");
  }, shot.toString("base64"));
}

const PREVIEW = "#mesh-editor-preview";
const SPLINE = "canvas.spline-canvas";

/**
 * A numeric field addressed by its own label text, exactly. The editor has
 * several `input[type=number]` groups (toolbar density, placement normal
 * From/To, per-knot x/y/hx/hy), so positional selectors silently target the
 * wrong one — `x` must not match `hx`.
 */
function numberFieldLabelled(page, labelText) {
  return page
    .locator("label")
    .filter({ hasText: new RegExp(`^\\s*${labelText}\\s*$`) })
    .locator('input[type="number"]')
    .first();
}

/**
 * Set a numeric field the way a user does: focus, select-all, type, commit with
 * Enter.
 *
 * Do NOT use fill() + dispatchEvent("change") here. fill() commits the value
 * without clearing the input's native "dirty value" flag, so the browser fires
 * a SECOND, real `change` on the next blur — which lands as an extra
 * `updateKnot` and an extra undo entry. That is an artefact of the synthetic
 * event, not app behaviour, and it makes undo look broken when it is not.
 */
async function setNumber(locator, value) {
  await locator.click();
  await locator.page().keyboard.press("ControlOrMeta+a");
  await locator.page().keyboard.type(String(value));
  await locator.page().keyboard.press("Enter");
}

/** Rendered = enough distinct colours AND real coverage (not a cleared frame). */
function rendered(s, minColors = 8, minCoverage = 0.05) {
  return s.colors >= minColors && s.coverage > minCoverage;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
let vite = null;
let browser = null;
const libRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mesh-editor-e2e-lib-"));

try {
  buildRangerArtifacts();
  const port = await freePort();
  vite = startVite(port, libRoot);
  await vite.ready;
  const base = `http://127.0.0.1:${port}/`;

  const pageErrors = [];
  browser = await chromium.launch({
    executablePath: CHROME,
    headless: !HEADED,
    args: [
      "--use-gl=swiftshader",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--no-sandbox",
    ],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => {
    // Ignore the Google-Fonts stylesheet, which fails on an offline machine and
    // is cosmetic; anything else on the error channel is a real regression.
    const t = m.text();
    if (m.type() === "error" && !/fonts\.googleapis\.com|favicon|ERR_CONNECTION_RESET|404/.test(t))
      pageErrors.push(t);
  });

  await page.goto(base, { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(PREVIEW, { timeout: 30000 });
  await page.waitForSelector(SPLINE, { timeout: 30000 });
  await page.waitForTimeout(3500); // let the rAF preview loop settle

  // -- 1. boot ---------------------------------------------------------------
  check("editor boots with both canvases", true);
  check("no page errors during boot", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));

  // -- 2. the 2D profile editor draws --------------------------------------
  const spline0 = await canvasStats(page, SPLINE, "spline_profile");
  check(
    "profile spline canvas draws the silhouette",
    spline0.colors >= 8,
    `colors=${spline0.colors}`,
  );

  // -- 3. the Ranger Three preview draws real pixels ------------------------
  const prev0 = await canvasStats(page, PREVIEW, "preview_default");
  check(
    "3D preview renders the default lathe",
    rendered(prev0),
    `colors=${prev0.colors} coverage=${(prev0.coverage * 100).toFixed(1)}%`,
  );

  // -- 4. explicit tessellate keeps it rendering ----------------------------
  await page.click("text=Tessellate");
  await page.waitForTimeout(2000);
  const prevTess = await canvasStats(page, PREVIEW, "preview_tessellated");
  check(
    "Tessellate re-builds a rendered mesh",
    rendered(prevTess),
    `colors=${prevTess.colors} coverage=${(prevTess.coverage * 100).toFixed(1)}%`,
  );

  // -- 5. shading modes ------------------------------------------------------
  const shadeSigs = {};
  for (const mode of ["Wire", "Flat", "Smooth", "Glossy", "Reflective"]) {
    await page.click(`button:text-is("${mode}")`);
    await page.waitForTimeout(1200);
    const s = await canvasStats(page, PREVIEW, `preview_${mode.toLowerCase()}`);
    shadeSigs[mode] = s.signature;
    check(`shading mode ${mode} renders`, rendered(s, 4, 0.02), `colors=${s.colors}`);
  }
  check(
    "Wire and Smooth produce different images",
    shadeSigs.Wire !== shadeSigs.Smooth,
    "wireframe and smooth shading rendered identically",
  );
  await page.click('button:text-is("Smooth")');
  await page.waitForTimeout(1000);

  // -- 6. torus tessellation mode -------------------------------------------
  const beforeTorus = await canvasStats(page, PREVIEW, "preview_before_torus");
  const modeSelect = page.locator("select").filter({ hasText: "torus" }).first();
  await modeSelect.selectOption("torus");
  await page.waitForTimeout(2500);
  const torus = await canvasStats(page, PREVIEW, "preview_torus");
  check("torus mode renders a mesh", rendered(torus), `colors=${torus.colors}`);
  check(
    "torus mode differs from rotation lathe",
    torus.signature !== beforeTorus.signature,
    "torus sweep produced the same image as the rotation lathe",
  );
  await modeSelect.selectOption("rotation");
  await page.waitForTimeout(2000);

  // -- 7. view switching ----------------------------------------------------
  const profileSig = await signatureOf(page, SPLINE, "view_profile");
  await page.click('button:text-is("Orbit")');
  await page.waitForTimeout(900);
  const orbitSig = await signatureOf(page, SPLINE, "view_orbit");
  check("Orbit view draws a different 2D editor", orbitSig !== profileSig);
  await page.click('button:text-is("Spine")');
  await page.waitForTimeout(900);
  const spineSig = await signatureOf(page, SPLINE, "view_spine");
  check("Spine view draws a different 2D editor", spineSig !== orbitSig);
  await page.click('button:text-is("Profile")');
  await page.waitForTimeout(900);

  // -- 8. tessellation density changes the mesh -----------------------------
  // "Path segments" / "Orbit samples N" are toolbar fields (sampling density),
  // distinct from the per-knot shape fields below. Unlike a knot edit, they do
  // NOT auto-retessellate — the explicit Tessellate button applies them. This
  // asserts that documented behaviour in both directions.
  const beforeDensity = await canvasStats(page, PREVIEW, "preview_before_density");
  const orbitSamples = numberFieldLabelled(page, "Orbit samples N");
  await setNumber(orbitSamples, "6");
  await page.waitForTimeout(1800);
  const densityPending = await canvasStats(page, PREVIEW, "preview_density_pending");
  check(
    "changing Orbit samples N alone does not re-tessellate",
    densityPending.signature === beforeDensity.signature,
    "density field auto-applied — Tessellate is meant to be the apply step",
  );
  await page.click("text=Tessellate");
  await page.waitForTimeout(2200);
  const afterDensity = await canvasStats(page, PREVIEW, "preview_after_density");
  check(
    "Tessellate applies the lower orbit sample count",
    afterDensity.signature !== beforeDensity.signature,
    "mesh image unchanged after dropping orbit samples 24 -> 6 and tessellating",
  );
  check("coarse mesh still renders", rendered(afterDensity), `colors=${afterDensity.colors}`);
  await setNumber(orbitSamples, "24");
  await page.click("text=Tessellate");
  await page.waitForTimeout(2200);

  // -- 9. editing a knot changes the mesh -----------------------------------
  // Per-knot x/y/hx/hy live behind the segment "Details" toggle. They are the
  // deterministic edit path; canvas dragging is covered at module level by
  // app/scripts/smoke-mesh-pick.mjs.
  const beforeEdit = await canvasStats(page, PREVIEW, "preview_before_edit");
  await page.locator('button:text-is("Details")').first().click();
  await page.waitForTimeout(400);
  const knotX = numberFieldLabelled(page, "x");
  if (
    check("knot Details exposes an x field", (await knotX.count()) > 0, "no label>input[number] with text x")
  ) {
    await setNumber(knotX, "0.95");
    await page.waitForTimeout(2200);

    // Undo becoming enabled is direct proof the edit reached the history
    // buffer — without it a silently-rejected value looks like a passing test.
    const undo = page.locator('button:text-is("Undo")');
    const undoLive = !(await undo.isDisabled());
    check("the knot edit registered in the undo history", undoLive);

    const afterEdit = await canvasStats(page, PREVIEW, "preview_after_edit");
    check(
      "editing a knot radius changes the 3D mesh",
      afterEdit.signature !== beforeEdit.signature,
    );
    check("mesh still renders after the edit", rendered(afterEdit), `colors=${afterEdit.colors}`);

    // -- 10. undo restores --------------------------------------------------
    if (undoLive) {
      await undo.click();
      await page.waitForTimeout(2200);
      const afterUndo = await canvasStats(page, PREVIEW, "preview_after_undo");
      check("Undo restores the previous mesh", afterUndo.signature === beforeEdit.signature);
    }
  }

  // -- 9b. dragging a knot on the 2D canvas ---------------------------------
  // The numeric-field path above and this one reach the same state through very
  // different code (pointer capture + hit-test + a drag gesture vs a committed
  // input), so both need covering — a regression in the canvas drag controller
  // is invisible to the field test.
  const beforeDrag = await canvasStats(page, PREVIEW, "preview_before_drag");
  const box = await (await page.$(SPLINE)).boundingBox();
  // viewport is -1.1..1.1 with y up, so world (x,y) -> box-relative pixels.
  const toPx = (wx, wy) => ({
    x: box.x + ((wx + 1.1) / 2.2) * box.width,
    y: box.y + ((1.1 - wy) / 2.2) * box.height,
  });
  const midKnot = toPx(0.5, 0); // default profile mid knot
  const dragTo = toPx(0.9, 0);
  await page.mouse.move(midKnot.x, midKnot.y);
  await page.mouse.down();
  await page.mouse.move((midKnot.x + dragTo.x) / 2, midKnot.y, { steps: 4 });
  await page.mouse.move(dragTo.x, dragTo.y, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(2200);

  const afterDrag = await canvasStats(page, PREVIEW, "preview_after_drag");
  check(
    "dragging the mid profile knot re-tessellates the mesh",
    afterDrag.signature !== beforeDrag.signature,
    "preview unchanged after a canvas drag",
  );
  check("mesh still renders after the drag", rendered(afterDrag), `colors=${afterDrag.colors}`);
  check(
    "the drag reached the undo history",
    !(await page.locator('button:text-is("Undo")').isDisabled()),
  );

  // Negative control: the same gesture on empty canvas must hit nothing. Without
  // this, "the mesh changed after I moved the mouse" would pass even if the
  // hit-test were broken and every drag edited something.
  const beforeMiss = await canvasStats(page, PREVIEW, "preview_before_miss");
  const emptyA = toPx(-0.9, -0.95);
  const emptyB = toPx(-0.6, -0.95);
  await page.mouse.move(emptyA.x, emptyA.y);
  await page.mouse.down();
  await page.mouse.move(emptyB.x, emptyB.y, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(1600);
  const afterMiss = await canvasStats(page, PREVIEW, "preview_after_miss");
  check(
    "a drag that hits no handle leaves the mesh alone",
    afterMiss.signature === beforeMiss.signature,
    "empty-canvas drag changed the mesh — hit-test is not discriminating",
  );

  // -- 9c. 3D preview camera gestures ---------------------------------------
  // Orbit and zoom go through the preview session's own canvas listeners
  // (rangerPreview.wirePointer -> host.pointer*), gated by placeModeGetter.
  const prevBox = await (await page.$(PREVIEW)).boundingBox();
  const pc = { x: prevBox.x + prevBox.width / 2, y: prevBox.y + prevBox.height / 2 };
  const beforeOrbit = await canvasStats(page, PREVIEW, "preview_before_orbit");
  await page.mouse.move(pc.x, pc.y);
  await page.mouse.down();
  await page.mouse.move(pc.x + 70, pc.y + 25, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(1400);
  const afterOrbit = await canvasStats(page, PREVIEW, "preview_after_orbit");
  check(
    "left-drag on the preview orbits the camera",
    afterOrbit.signature !== beforeOrbit.signature,
    "view unchanged after an orbit drag",
  );

  await page.mouse.move(pc.x, pc.y);
  await page.mouse.wheel(0, -240);
  await page.waitForTimeout(1400);
  const afterZoom = await canvasStats(page, PREVIEW, "preview_after_zoom");
  check(
    "wheel zooms the preview",
    afterZoom.signature !== afterOrbit.signature,
    "view unchanged after a wheel event",
  );

  // -- 9d. assign-region mode: overlay handles + orbit suppression ----------
  // This is the mode whose state used to be five hand-maintained flags. The
  // orbit-suppression assert below is the important one: `blockHostOrbit` was a
  // mutable written from seven sites and read by exactly one predicate, so a
  // stale value silently killed camera orbit for the rest of the session.
  await page.click('button:text-is("Assign to mesh")');
  await page.waitForTimeout(1500);
  const regionBox = page.locator(".region-box");
  if (check("Assign to mesh opens the region overlay", (await regionBox.count()) > 0)) {
    const r0 = await regionBox.boundingBox();

    const centerHandle = page.locator(".region-box .handle.center");
    const ch = await centerHandle.boundingBox();
    await page.mouse.move(ch.x + ch.width / 2, ch.y + ch.height / 2);
    await page.mouse.down();
    await page.mouse.move(ch.x + ch.width / 2 + 40, ch.y + ch.height / 2 + 18, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(900);
    const r1 = await regionBox.boundingBox();
    check(
      "dragging the centre handle moves the region",
      Math.abs(r1.x - r0.x) > 4 || Math.abs(r1.y - r0.y) > 4,
      `before=${Math.round(r0.x)},${Math.round(r0.y)} after=${Math.round(r1.x)},${Math.round(r1.y)}`,
    );

    const corner = page.locator(".region-box .handle.corner.br");
    if ((await corner.count()) > 0) {
      const cb = await corner.boundingBox();
      await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
      await page.mouse.down();
      await page.mouse.move(cb.x + cb.width / 2 + 35, cb.y + cb.height / 2 + 35, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(900);
      const r2 = await regionBox.boundingBox();
      check(
        "dragging a corner handle resizes the region",
        Math.abs(r2.width - r1.width) > 4 || Math.abs(r2.height - r1.height) > 4,
        `w ${Math.round(r1.width)}->${Math.round(r2.width)} h ${Math.round(r1.height)}->${Math.round(r2.height)}`,
      );
    }

    // While a modal pick mode is active, a LEFT drag on the canvas must not
    // orbit — that suppression is the whole job of the blockHostOrbit policy.
    const beforeBlocked = await canvasStats(page, PREVIEW, "preview_region_before_block");
    const away = { x: prevBox.x + 24, y: prevBox.y + prevBox.height - 24 };
    await page.mouse.move(away.x, away.y);
    await page.mouse.down();
    await page.mouse.move(away.x + 60, away.y - 30, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(1200);
    const afterBlocked = await canvasStats(page, PREVIEW, "preview_region_after_block");
    check(
      "left-drag does NOT orbit while the region overlay is up",
      afterBlocked.signature === beforeBlocked.signature,
      "camera moved on left-drag in region mode — orbit suppression is broken",
    );

    await page.keyboard.press("Escape");
    await page.waitForTimeout(900);
    check("Escape leaves region mode", (await page.locator(".region-box").count()) === 0);

    // ...and orbit works again once the mode is gone (a stale suppression flag
    // would leave the camera dead here).
    const beforeAgain = await canvasStats(page, PREVIEW, "preview_orbit_again_before");
    await page.mouse.move(pc.x, pc.y);
    await page.mouse.down();
    await page.mouse.move(pc.x - 60, pc.y + 20, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(1400);
    const afterAgain = await canvasStats(page, PREVIEW, "preview_orbit_again_after");
    check(
      "orbit works again after leaving region mode",
      afterAgain.signature !== beforeAgain.signature,
      "camera stayed dead after region mode — suppression was not cleared",
    );
  }

  // -- 10. texture workspace ------------------------------------------------
  await page.click('button:text-is("Texture")');
  await page.waitForTimeout(2000);
  const texCanvases = await page.locator("canvas").count();
  check("Texture workspace opens with canvases", texCanvases > 0, `canvases=${texCanvases}`);
  const eyeLayer = await page
    .locator("text=/eyeball|iris|pupil/i")
    .count()
    .catch(() => 0);
  check("eye texture layers are listed", eyeLayer > 0, `matches=${eyeLayer}`);
  const texShot = await canvasStats(page, SPLINE, "texture_editor");
  check("texture path editor draws", texShot.colors >= 4, `colors=${texShot.colors}`);
  await page.click('button:text-is("Mesh")');
  await page.waitForTimeout(1500);

  // -- 11. library round-trip through the real /api/library -----------------
  const projName = "e2e vase";
  const nameInput = page.locator('input[placeholder*="vase"]').first();
  if (check("library name field present", (await nameInput.count()) > 0)) {
    await nameInput.fill(projName);
    await page.click('button:text-is("Save as")');
    await page.waitForTimeout(2500);

    const onDisk = fs.existsSync(libRoot)
      ? fs.readdirSync(libRoot).filter((d) => fs.existsSync(path.join(libRoot, d, "project.json")))
      : [];
    check("Save as writes a project.json to the library root", onDisk.length === 1, `dirs=${JSON.stringify(fs.existsSync(libRoot) ? fs.readdirSync(libRoot) : [])}`);

    if (onDisk.length === 1) {
      const doc = JSON.parse(
        fs.readFileSync(path.join(libRoot, onDisk[0], "project.json"), "utf8"),
      );
      check("saved document is a versioned ranger.splineProject", doc.kind === "ranger.splineProject" && typeof doc.schemaVersion === "number", `kind=${doc.kind} v=${doc.schemaVersion}`);
      check("saved document carries the edited profile", Array.isArray(doc.profile?.knots) && doc.profile.knots.length > 0);

      // API sees it, and loading it back renders.
      const listed = await page.evaluate(async () => {
        const r = await fetch("/api/library");
        return r.ok ? (await r.json()).projects.map((p) => p.slug) : null;
      });
      check("GET /api/library lists the saved project", Array.isArray(listed) && listed.includes(onDisk[0]), `listed=${JSON.stringify(listed)}`);

      await page.click('button:text-is("Refresh")');
      await page.waitForTimeout(1200);
      const openBtn = page.locator("ul.list button.open").first();
      if (check("saved project appears in the library list", (await openBtn.count()) > 0)) {
        await openBtn.click();
        await page.waitForTimeout(3000);
        const afterLoad = await canvasStats(page, PREVIEW, "preview_after_load");
        check("loading the saved project renders its mesh", rendered(afterLoad), `colors=${afterLoad.colors} coverage=${(afterLoad.coverage * 100).toFixed(1)}%`);
      }
    }
  }

  // -- 12. nothing blew up along the way ------------------------------------
  check(
    "no page errors across the whole session",
    pageErrors.length === 0,
    pageErrors.slice(0, 3).join(" | "),
  );
} catch (err) {
  failed += 1;
  console.log(`  FAIL mesh_editor_e2e harness — ${err.message}`);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (vite) {
    vite.child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 300));
    if (vite.child.exitCode === null) vite.child.kill("SIGKILL");
  }
  try {
    fs.rmSync(libRoot, { recursive: true, force: true });
  } catch {}
  if (!KEEP_SHOTS) {
    try {
      fs.rmSync(SHOT_DIR, { recursive: true, force: true });
    } catch {}
  }
}

console.log(`passed=${passed} failed=${failed}`);
console.log(failed === 0 ? "ALL PASS" : "SOME FAILED");
process.exit(failed === 0 ? 0 : 1);
