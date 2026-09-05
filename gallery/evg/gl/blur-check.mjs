/**
 * The painter's backdrop blur, checked in a real GPU context against the
 * browser's own numbers.
 *
 *   node gallery/evg/gl/blur-check.mjs [--write-png out.png]
 *
 * `oracle/css_blur_oracle.mjs` measured what Chrome does with
 * `backdrop-filter: blur()`. This draws the same picture through the WebGL
 * painter and reads the same pixels back, so the two can be compared where it
 * counts — in the framebuffer, not in a comment.
 *
 * Three claims, and each one fails differently:
 *
 *   THE PROFILE. A hard black/white edge behind a blurred pane. The ramp
 *   across it is the kernel's step response, and it is compared sample by
 *   sample against what the browser produced. A true Gaussian instead of the
 *   three-box approximation is out by up to 14 luminance levels here — small
 *   enough to look fine and large enough to be the wrong filter.
 *
 *   THE EDGE. A flat grey behind the pane must come out flat: same value at
 *   the pane's border as at its centre. An implementation that blurs only the
 *   pixels inside the box gets a pale rim, because its samples fall off the
 *   edge of what it copied. This is the case that catches the mistake nobody
 *   notices until they put a scrim over a photograph.
 *
 *   THE CLIP. Outside a rounded corner, the backdrop is untouched.
 *
 * Exit code 0 when every probe is within tolerance.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { requireDom, findChromium, assertDomInstalled } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ORACLE = JSON.parse(fs.readFileSync(path.join(HERE, "..", "oracle", "css-blur.json"), "utf8"));

const W = 400;
const H = 200;
// The same geometry the oracle used: a 400x200 backdrop, a 200x120 pane at
// (100,40). Same numbers on both sides or the comparison is not one.
const PANE = { x: 100, y: 40, w: 200, h: 120 };

/** The three scenes, matching the oracle's cases. */
const SCENES = {
  // Black left of x=200, white right of it, under a pane that blurs and
  // paints nothing of its own.
  edge: (blur) => ({
    width: W, height: H,
    cmds: [
      { k: 0, x: 0, y: 0, w: 200, h: H, c: [0, 0, 0, 1] },
      { k: 0, x: 200, y: 0, w: 200, h: H, c: [255, 255, 255, 1] },
      { k: 0, ...PANE, c: [0, 0, 0, 0], bb: blur },
    ],
  }),
  // Flat mid grey everywhere behind.
  uniform: (blur) => ({
    width: W, height: H,
    cmds: [
      { k: 0, x: 0, y: 0, w: W, h: H, c: [128, 128, 128, 1] },
      { k: 0, ...PANE, c: [0, 0, 0, 0], bb: blur },
    ],
  }),
  // White page, a black stripe starting EXACTLY at the pane's left edge. This
  // is the case that decides whether the backdrop is the element's own region
  // or the page around it, and cases that do not straddle the border cannot
  // tell — which is how this implementation shipped the wrong rule for an
  // afternoon and passed every check it had.
  acrossTheEdge: (blur) => ({
    width: W, height: H,
    cmds: [
      { k: 0, x: 0, y: 0, w: W, h: H, c: [255, 255, 255, 1] },
      // From x=99, one pixel left of the pane, so this rectangle's own
      // antialiased edge falls OUTSIDE the region the blur samples. EVG
      // softens a rectangle's border by about a third of a pixel and a
      // browser's div does not; with the two edges on top of each other that
      // seam blurs inward and reads as a bleed this is meant to be measuring.
      { k: 0, x: 99, y: 0, w: 101, h: H, c: [0, 0, 0, 1] },
      { k: 0, ...PANE, r: 40, c: [0, 0, 0, 0], bb: blur },
    ],
  }),
  // A hard band across the top of a rounded pane, over white. This is the only
  // scene where the blur ITSELF can be caught being drawn square: everywhere
  // else the backdrop near the corner is uniform, and blurred uniform is
  // uniform, so a square clip and a rounded one are the same picture.
  banded: (blur) => ({
    width: W, height: H,
    cmds: [
      { k: 0, x: 0, y: 0, w: W, h: H, c: [255, 255, 255, 1] },
      { k: 0, x: 0, y: 39, w: W, h: 31, c: [0, 0, 0, 1] },
      { k: 0, ...PANE, r: 40, c: [0, 0, 0, 0], bb: blur },
    ],
  }),
  // A narrow black column down the pane's left side. The banded scene cannot
  // see a blur drawn square, because near the top-left corner everything in it
  // is black either way; turning the feature ninety degrees means the raw
  // backdrop outside the corner is black while the blurred one is nearly
  // white, and the two cannot be confused.
  verticalColumn: (blur) => ({
    width: W, height: H,
    cmds: [
      { k: 0, x: 0, y: 0, w: W, h: H, c: [255, 255, 255, 1] },
      { k: 0, x: 95, y: 0, w: 14, h: H, c: [0, 0, 0, 1] },
      { k: 0, ...PANE, r: 40, c: [0, 0, 0, 0], bb: blur },
    ],
  }),
  // The same column, moved fifty pixels clear of the nearest border. Two edges
  // close together is the case a kernel is easiest to get wrong on, and with
  // no border within reach it is the kernel alone being compared.
  innerColumn: (blur) => ({
    width: W, height: H,
    cmds: [
      { k: 0, x: 0, y: 0, w: W, h: H, c: [255, 255, 255, 1] },
      { k: 0, x: 150, y: 0, w: 14, h: H, c: [0, 0, 0, 1] },
      { k: 0, ...PANE, c: [0, 0, 0, 0], bb: blur },
    ],
  }),
  // The same small pane, alone and after a bigger one — the pair for case 6.
  //
  // The painter keeps its blur targets between draws and grows them without
  // shrinking, so a second, smaller pane reads out of a texture larger than
  // its own region, with whatever the first pane left in the rest of it right
  // there to be sampled. Every other scene here renders one pane into a fresh
  // context and cannot see that.
  //
  // The two panes must NOT overlap. The first version put a big pane over the
  // same band and compared the result with the small pane alone, and the
  // difference it found — 12 against 189 — was not a bug at all: the big pane
  // had already softened that backdrop, so the small one was blurring an
  // already-blurred band. Correct behaviour, wrong reference.
  smallAlone: (blur) => ({
    width: W, height: H,
    cmds: [
      { k: 0, x: 0, y: 0, w: W, h: H, c: [255, 255, 255, 1] },
      { k: 0, x: 0, y: 39, w: W, h: 31, c: [0, 0, 0, 1] },
      { k: 0, x: 200, y: 30, w: 150, h: 120, c: [0, 0, 0, 0], bb: blur },
    ],
  }),
  smallAfterBig: (blur) => ({
    width: W, height: H,
    cmds: [
      { k: 0, x: 0, y: 0, w: W, h: H, c: [255, 255, 255, 1] },
      { k: 0, x: 0, y: 39, w: W, h: 31, c: [0, 0, 0, 1] },
      // Its own dark patch, well clear of the small pane, so anything left
      // behind in the reused texture is distinctive rather than the same white
      // the small pane would see anyway.
      { k: 0, x: 10, y: 100, w: 170, h: 80, c: [20, 20, 20, 1] },
      // 180 wide by 90 tall: wider than the small pane and shorter, so the
      // shared texture ends up bigger than the small pane's region on one axis
      // and the leftovers are inside it.
      { k: 0, x: 5, y: 95, w: 180, h: 90, c: [0, 0, 0, 0], bb: blur },
      { k: 0, x: 200, y: 30, w: 150, h: 120, c: [0, 0, 0, 0], bb: blur },
    ],
  }),
  // A rounded pane with a translucent white fill over black.
  rounded: (blur) => ({
    width: W, height: H,
    cmds: [
      { k: 0, x: 0, y: 0, w: W, h: H, c: [0, 0, 0, 1] },
      { k: 0, ...PANE, r: 40, c: [255, 255, 255, 0.85], bb: blur },
    ],
  }),
};

const painter = fs.readFileSync(path.join(HERE, "evg-webgl.js"), "utf8").replace(/^export /gm, "");

const pageFor = (scene) => `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff">
<canvas id="c" width="${W}" height="${H}" style="width:${W}px;height:${H}px"></canvas>
<script>
${painter}
(async () => {
  try {
    const c = document.getElementById("c");
    const gl = c.getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
    const doc = ${JSON.stringify(scene)};
    window.__stats = renderDisplayList(gl, { list: { cmds: doc.cmds }, width: doc.width, height: doc.height }, { dpr: 1 });
  } catch (e) { window.__ERR__ = String(e && e.stack || e); }
  window.__DONE__ = true;
})();
</script></body>`;

assertDomInstalled();
const { chromium } = requireDom("playwright-core");
// SwiftShader, for the same reason the rotation check uses it: a check that
// only runs on a machine with a GPU is not a check.
const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e.message)));

const tmp = path.join(HERE, ".blur-check.html");

/** Render one scene and hand back a row of RGBA readings. */
async function rowOf(scene, y, xs) {
  fs.writeFileSync(tmp, pageFor(scene));
  await page.goto(pathToFileURL(tmp).href);
  await page.waitForFunction("window.__DONE__ === true", { timeout: 30000 });
  const err = await page.evaluate(() => window.__ERR__ || null);
  if (err) throw new Error("painter threw: " + err);
  const write = process.argv.indexOf("--write-png");
  if (write > -1 && process.argv[write + 1]) {
    await page.locator("#c").screenshot({ path: process.argv[write + 1] });
  }
  return page.evaluate(([yy, xxs, hh]) => {
    const gl = document.getElementById("c").getContext("webgl2");
    const px = new Uint8Array(4);
    return xxs.map((x) => {
      // GL reads from the bottom; the display list counts from the top.
      gl.readPixels(x, hh - 1 - yy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return [px[0], px[1], px[2], px[3]];
    });
  }, [y, xs, H]);
}

const lum = (p) => Math.round(0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]);
let bad = 0, checked = 0;
const say = (ok, name, detail) => {
  checked++;
  if (ok) { console.log("  PASS " + name); return; }
  bad++;
  console.log("  FAIL " + name + "\n        " + detail);
};

console.log("=== the painter's backdrop blur, against the browser's own numbers ===");

// --- 1. the profile, at each radius the oracle measured ---------------------
// Tolerance of 6 luminance levels out of 255. Wide enough for SwiftShader's
// rounding and a slightly different sample grid; far tighter than the 14 that
// separates the three-box kernel from a true Gaussian, which is the mistake
// this is here to catch.
const TOL = 6;
console.log("");
console.log("-- the ramp across a hard edge");
for (const [label, v] of Object.entries(ORACLE.stepResponse)) {
  const r = parseInt(label.match(/\d+/)[0], 10);
  // Sample inside the pane only: the pane spans x 100..300 and the edge is at
  // x=200, so +-40 is comfortably inside it.
  const xs = [];
  for (let x = v.xFrom; x < v.xTo; x++) xs.push(200 + x);
  const row = await rowOf(SCENES.edge(r), 100, xs);
  let worst = 0, worstAt = 0;
  for (let i = 0; i < xs.length; i++) {
    const d = Math.abs(lum(row[i]) - v.luma[i]);
    if (d > worst) { worst = d; worstAt = v.xFrom + i; }
  }
  say(worst <= TOL, `${label}: the ramp matches the browser's (worst ${worst})`,
    `worst error ${worst} luminance levels at x=${worstAt}, tolerance ${TOL}`);
}

// --- 2. the element's own edge over a flat backdrop --------------------------
console.log("");
console.log("-- a flat backdrop stays flat to the pane's edge");
{
  const want = ORACLE.uniformBackdrop.centre;
  const xs = ORACLE.uniformBackdrop.insideLeft.map((s) => 100 + s.dx);
  const row = await rowOf(SCENES.uniform(12), 100, xs);
  const got = row.map(lum);
  const worst = Math.max(...got.map((g) => Math.abs(g - want)));
  say(worst <= TOL, `no rim at the edge (worst ${worst})`,
    `wanted ${want} everywhere, got ${got.join(" ")} — a ramp here means the ` +
    `blur sampled only inside the box`);
}

// --- 3. the rounded corner ---------------------------------------------------
console.log("");
console.log("-- the blur is clipped to the rounded box");
{
  const row = await rowOf(SCENES.rounded(12), 44, [104, 140]);
  const outside = lum(row[0]);
  const inside = lum(row[1]);
  const wantOutside = lum(ORACLE.rounded.outsideTheCorner);
  say(Math.abs(outside - wantOutside) <= TOL,
    `outside the corner the backdrop is untouched (${outside})`,
    `wanted ${wantOutside}, got ${outside}`);
  const rowIn = await rowOf(SCENES.rounded(12), 80, [140]);
  const wantInside = lum(ORACLE.rounded.insideTheCorner);
  say(Math.abs(lum(rowIn[0]) - wantInside) <= TOL,
    `and inside it the fill is over the blur (${lum(rowIn[0])})`,
    `wanted ${wantInside}, got ${lum(rowIn[0])}`);
}

// --- 4. the case the others are blind to -------------------------------------
console.log("");
console.log("-- a feature that straddles the pane's own border");
{
  const want = ORACLE.acrossTheEdge;
  const xs = [102, 105, 110, 120];
  const row = await rowOf(SCENES.acrossTheEdge(12), 100, xs);
  const got = row.map(lum);
  const wantL = want.insideEdge.map(lum);
  const worst = Math.max(...got.map((g, i) => Math.abs(g - wantL[i])));
  say(worst <= TOL,
    `the white outside the pane does not bleed in (${got.join(" ")})`,
    `wanted ${wantL.join(" ")}, got ${got.join(" ")} — anything much above ` +
    `zero here means the copied region reached past the element, and the page ` +
    `behind it is showing through its own border`);

  // Outside the rounded corner the backdrop is untouched black. A blur drawn
  // as a square rather than a rounded box lightens this pixel, because it
  // carries the white from x < 100 across the corner.
  const corner = await rowOf(SCENES.acrossTheEdge(12), 43, [103]);
  const wantCorner = lum(want.outsideCorner);
  say(Math.abs(lum(corner[0]) - wantCorner) <= TOL,
    `and the corner outside the radius is untouched (${lum(corner[0])})`,
    `wanted ${wantCorner}, got ${lum(corner[0])} — a square clip shows here`);
}

// --- 5. the blur itself, clipped to the radius -------------------------------
console.log("");
console.log("-- the BLUR, not just the fill, respects the radius");
{
  const want = ORACLE.bandedCorner;
  const row = await rowOf(SCENES.banded(12), 43, [103]);
  const got = lum(row[0]);
  say(Math.abs(got - lum(want.outsideCorner)) <= TOL,
    `outside the corner the band is still hard (${got})`,
    `wanted ${lum(want.outsideCorner)}, got ${got} — grey here means the ` +
    `blurred backdrop was drawn as a rectangle and spilled past the radius`);
  const inBand = await rowOf(SCENES.banded(12), 50, [200]);
  say(Math.abs(lum(inBand[0]) - lum(want.insideBand)) <= TOL,
    `and inside the shape the band is softened (${lum(inBand[0])})`,
    `wanted ${lum(want.insideBand)}, got ${lum(inBand[0])}`);
}

// --- 5b. and the radius, where the two answers are far apart -----------------
console.log("");
console.log("-- outside the corner, the raw backdrop and the blurred one differ");
{
  const want = ORACLE.verticalCorner;
  const outside = lum((await rowOf(SCENES.verticalColumn(12), 43, [104]))[0]);
  const inside = lum((await rowOf(SCENES.verticalColumn(12), 100, [104]))[0]);
  say(Math.abs(outside - lum(want.outsideCorner)) <= TOL,
    `outside the radius the column is still hard (${outside})`,
    `wanted ${lum(want.outsideCorner)}, got ${outside} — the blurred value at ` +
    `this x is ${lum(want.wellInside)}, so anything near that means the blur ` +
    `was drawn as a rectangle`);
  // Deliberately NOT compared with the browser: this x is four pixels from the
  // pane's border, and inside a kernel's reach of it Chrome stops producing a
  // blur profile at all — see `borderBand` in the oracle. What is checked here
  // is only that the blur HAPPENED, which is what makes the probe above mean
  // something: raw black outside the corner, softened inside it.
  say(inside > 40,
    `and at the same x inside the shape it is softened (${inside})`,
    `expected the column to have blurred away from black here, got ${inside}`);
}

// --- 5c. the kernel again, on a narrow feature clear of every border ---------
// The step response is one edge. This is two, close together, which is where a
// kernel that is nearly right stops being right — and it is 50px from the
// nearest border, so nothing about the element's edge is mixed in.
console.log("");
console.log("-- a narrow column, well clear of the borders");
{
  const want = ORACLE.innerColumn;
  const row = (await rowOf(SCENES.innerColumn(12), 100, want.xs)).map(lum);
  let worst = 0, at = 0;
  for (let i = 0; i < row.length; i++) {
    const d = Math.abs(row[i] - want.luma[i]);
    if (d > worst) { worst = d; at = want.xs[i]; }
  }
  say(worst <= TOL, `the profile matches the browser's (worst ${worst})`,
    `worst ${worst} levels at x=${at}\n        browser ${want.luma.join(" ")}` +
    `\n        painter ${row.join(" ")}`);
}

// --- 6. a second pane must not read the first one's leftovers ----------------
// Not against the browser: against the SAME pane drawn alone. The claim is
// that a pane looks the same whether or not a bigger one was blurred before it
// in the frame, and the reference for that is the pane on its own.
console.log("");
console.log("-- a pane looks the same after a bigger one has been blurred");
{
  const xs = [205, 240, 275, 310, 345];
  const alone = (await rowOf(SCENES.smallAlone(12), 55, xs)).map(lum);
  const after = (await rowOf(SCENES.smallAfterBig(12), 55, xs)).map(lum);
  const worst = Math.max(...alone.map((a, i) => Math.abs(a - after[i])));
  say(worst <= TOL,
    `the second pane is unchanged by the first (worst ${worst})`,
    `alone ${alone.join(" ")} vs after ${after.join(" ")} — a difference here ` +
    `means the blur passes sampled outside their own region and found what the ` +
    `bigger pane left in the reused texture`);
}

await browser.close();
fs.rmSync(tmp, { force: true });
if (pageErrors.length) {
  console.log("");
  console.log("page errors:");
  for (const e of pageErrors) console.log("  " + e);
  bad += pageErrors.length;
}
console.log("");
console.log(`passed=${checked - bad} failed=${bad}`);
if (bad > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
