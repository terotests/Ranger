/**
 * Element-scoped surface effects, in a real GL context.
 *
 *   node lib/evg/gl/fx-check.mjs [--write-png out.png]
 *
 * `evg-surface-effect` used to mean one post-process over the whole page, fed
 * by hand from the application's `pointerdown`. It now means an effect on an
 * ELEMENT: the stylesheet says which box has it and what starts it, the
 * display list carries the box the layout worked out, and a registered plugin
 * turns that into pixels. This checks the half of that claim which only pixels
 * can settle.
 *
 * Four things, and each one fails differently:
 *
 *   IT IS INSIDE THE BOX. A starfield on a card must put stars on the card and
 *   nothing whatsoever outside it. The mask is in the shared `main`, not in
 *   the plugin, so this is really asking whether a plugin CAN leak — and the
 *   page around the box is left untouched at exactly its own colour, which is
 *   a pixel comparison and not an impression.
 *
 *   IT IS UNDER THE CONTENT. A source effect is drawn where the element's own
 *   background is drawn, so anything the element contains is painted over it.
 *   Get the paint order wrong and a starfield is a sticker over the text — and
 *   it still looks like a starfield in a screenshot, which is why this is
 *   checked with a rectangle whose colour is known exactly.
 *
 *   IT MOVES. The same scene at two clocks must differ. A shader whose time
 *   uniform never arrives draws a perfectly good still picture, and every
 *   other check here passes on it.
 *
 *   A FILTER BENDS WHAT IS ALREADY THERE, inside its box and nowhere else.
 *   The ripple is the filter, and the case that matters is the surface OUTSIDE
 *   the box: it has to come back identical to the same page drawn with no
 *   effect at all, or "scoped to an element" is decoration on a full-screen
 *   pass.
 *
 * And two that are about not breaking: an effect nobody registered draws the
 * page without it rather than nothing, and the whole-surface effect that
 * predates all of this still runs.
 *
 * Exit code 0 when every probe holds.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MissingDomDeps, requireHostTool, findChromium } from "../../../gallery/ui/conformance/dom-adapter.mjs";
import { createEffectDriver } from "./evg-fx.js";
import { listOf } from "./evg-list.js";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = 320;
const H = 220;
// The card, in page pixels. Everything below reads pixels relative to it.
const BOX = [60, 40, 200, 140];

const rect = (x, y, w, h, c, extra = {}) => ({ k: 0, x, y, w, h, c, ...extra });

/** The page under the card: white, so anything the effect leaks is visible. */
const PAGE_WHITE = rect(0, 0, W, H, [255, 255, 255, 1]);
/** The card itself: nearly black, because a starfield over white is a smudge. */
const SKY = [8, 10, 26, 1];

const starfield = (p, over) => ({
  width: W, height: H,
  cmds: [PAGE_WHITE, rect(BOX[0], BOX[1], BOX[2], BOX[3], SKY, { efx: "sky" })].concat(over || []),
  effects: [{ id: "sky", kind: "starfield", on: "always", box: BOX, p: { density: 2.2, nebula: 0.7, seed: 3, ...p }, time: p && p.__t || 0 }],
});

const SCENES = {
  // A sky on a card, at rest.
  sky: starfield({ speed: 0 }),
  // The same page with the effect taken out — the reference for "did anything
  // outside the box move". Comparing two renders rather than checking the
  // page against white on purpose: the painter antialiases the page rectangle
  // against the canvas edge, so the outermost column is not 255 in either
  // frame and never was the effect's doing.
  skyPlain: { width: W, height: H, cmds: [PAGE_WHITE, rect(BOX[0], BOX[1], BOX[2], BOX[3], SKY)] },
  // The same sky five seconds later, drifting.
  skyLater: starfield({ speed: 40, __t: 5 }),
  // The same sky with an opaque plate drawn AFTER the card — the element's
  // content, in effect.
  skyUnderPlate: starfield({ speed: 0 }, [rect(100, 70, 80, 60, [220, 30, 40, 1])]),
  // An effect name nothing has registered.
  unknown: {
    width: W, height: H,
    cmds: [PAGE_WHITE, rect(BOX[0], BOX[1], BOX[2], BOX[3], [30, 140, 70, 1], { efx: "nope" })],
    effects: [{ id: "nope", kind: "aurora-borealis", on: "always", box: BOX, p: {} }],
  },
};

/** A hard black/white edge down the page, with and without a ripple in a box
 *  around the middle of it. The edge is what a displacement is visible on. */
const edgeCmds = (efx) => [
  rect(0, 0, W / 2, H, [0, 0, 0, 1]),
  rect(W / 2, 0, W / 2, H, [255, 255, 255, 1]),
  rect(BOX[0], BOX[1], BOX[2], BOX[3], [0, 0, 0, 0], efx ? { efx: "wet" } : {}),
];
SCENES.edgePlain = { width: W, height: H, cmds: edgeCmds(false) };
SCENES.edgeRippled = {
  width: W, height: H,
  cmds: edgeCmds(true),
  effects: [{
    id: "wet", kind: "ripple", on: "press", box: BOX,
    // Slow and strong, so one ring is well inside the box at this age and the
    // displacement is far larger than any rounding.
    p: { speed: 120, width: 34, strength: 26, decay: 0.6, rings: 1, shine: 0, highlight: 0 },
    // OFF THE EDGE, not on it. A ring centred on the edge pushes the surface
    // along the edge, which moves a vertical boundary by nothing at all — the
    // displacement is radial, so it has to arrive at an angle to be visible.
    events: [[BOX[0] + 60, BOX[1] + BOX[3] / 2, 0.42]],
    time: 0.42,
  }],
};

/** And the ORIGINAL whole-surface effect, which must still work unchanged. */
SCENES.legacy = {
  width: W, height: H,
  cmds: edgeCmds(false),
  effect: {
    kind: "ripple", drops: [[BOX[0] + 60, BOX[1] + BOX[3] / 2, 0.42]],
    speed: 120, width: 34, strength: 26, decay: 0.6, highlight: 0,
    rings: 1, stagger: 0.09, falloff: 0.62, shine: 0, gloss: 120, bump: 70,
    light: [-0.45, -0.65, 0.62],
  },
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
    const list = { cmds: doc.cmds };
    if (doc.effect) list.effect = doc.effect;
    if (doc.effects) list.effects = doc.effects;
    window.__stats = renderDisplayList(gl, { list, width: doc.width, height: doc.height }, { dpr: 1 });
  } catch (e) { window.__ERR__ = String(e && e.stack || e); }
  window.__DONE__ = true;
})();
</script></body>`;

// ---------------------------------------------------------------------------
// The driver, which needs no browser at all
// ---------------------------------------------------------------------------
//
// Everything above is about pixels. This is about WHO GETS THE EVENT, which is
// the other half of "the document decides": a press inside a box whose sheet
// asked for one, and nothing at all otherwise. It runs first because it needs
// no GPU, so a failure here is not hidden behind a browser launch.
let bad = 0, checked = 0;
const say = (ok, name, detail) => {
  checked += 1;
  if (ok) { console.log("  PASS " + name); return; }
  bad += 1;
  console.log("  FAIL " + name + (detail ? "\n        " + detail : ""));
};

console.log("=== element-scoped surface effects ===");
console.log("");
console.log("-- the driver: which box gets the press");
{
  const list = {
    effects: [
      { id: "sky", kind: "starfield", on: "always", box: [0, 0, 300, 100], p: {} },
      { id: "pool", kind: "ripple", on: "press drag", box: [40, 120, 120, 80], p: {} },
      { id: "quiet", kind: "ripple", box: [200, 120, 80, 80], p: {} },
    ],
  };
  const fx = createEffectDriver();
  fx.tick(0, list);

  say(fx.press(100, 160) !== null, "a press inside the box that asked for one lands");
  say(list.effects[1].events.length === 1 || fx.tick(0, list) === true && list.effects[1].events.length === 1,
    "and the instance carries it");
  say(fx.press(240, 160) === null, "a press on a box that declared no trigger does nothing",
    "`evg-surface-effect` without `evg-effect-on` is an effect the application drives — " +
    "the driver must not adopt it");
  say(fx.press(150, 250) === null, "and a press on nothing at all does nothing");
  say(fx.hover(100, 160) === null, "a hover where only a press was asked for does nothing");

  // AGEING. The event is the same object the painter reads, so what the
  // driver does to it is what the shader sees.
  fx.tick(1000, list);
  const e = list.effects[1].events[0];
  say(Math.abs(e[2] - 1) < 0.01, `a second later it is a second old (${e[2].toFixed(2)})`);
  fx.tick(2500, list);
  say(list.effects[1].events.length === 0, "and past its life it is gone",
    "an event that never retires is a page that never stops drawing");

  // BUSY. A page with an `always` effect never stops; one with only idle
  // filters does.
  say(fx.busy() === true, "a page with an `always` effect is always busy");
  const idle = { effects: [{ id: "pool", kind: "ripple", on: "press", box: [0, 0, 10, 10], p: {} }] };
  const fx2 = createEffectDriver();
  fx2.tick(0, idle);
  say(fx2.busy() === false, "a page whose only effect is idle is not",
    "the host would keep asking for frames for an effect with nothing in flight");

  // THE TOPMOST ONE WINS, because two effects that overlap are a stack.
  const stacked = {
    effects: [
      { id: "under", kind: "ripple", on: "press", box: [0, 0, 200, 200], p: {} },
      { id: "over", kind: "ripple", on: "press", box: [50, 50, 100, 100], p: {} },
    ],
  };
  const fx3 = createEffectDriver();
  fx3.tick(0, stacked);
  const hit = fx3.press(100, 100);
  say(hit && hit.id === "over", "where two overlap, the one painted last takes the press",
    "paint order decides what is on top, and a press goes to what is on top");
}

console.log("");
console.log("-- the demo document, straight out of the engine");
{
  // The page the demo draws is generated by `npm run evg:fx:doc` from a Ranger
  // document whose effects are declared in a stylesheet. If that file is here,
  // hold it to what the sheet says — this is the seam between "CSS said so"
  // and "the painter drew it", and the only place both ends are visible.
  const demo = path.join(HERE, "fx-demo.js");
  if (!fs.existsSync(demo)) {
    console.log("  SKIP fx-demo.js is not built — run `npm run evg:fx:doc`");
  } else {
    const sandbox = { window: {} };
    new Function("window", fs.readFileSync(demo, "utf8"))(sandbox.window);
    const effects = sandbox.window.EVG_FX_DEMO.list.effects || [];
    const byId = Object.fromEntries(effects.map((e) => [e.id, e]));
    say(effects.length === 3, `three effects, one per element that declared one (${effects.length})`);
    say(byId.sky && byId.sky.kind === "starfield" && /always/.test(byId.sky.on || ""),
      "the sky is a starfield that runs on its own clock");
    say(byId.sky && byId.sky.p.density === 1.6 && byId.sky.p.hue2 === 305,
      "carrying the `evg-fx-*` numbers the sheet wrote",
      "a parameter the engine has never heard of did not survive the trip");
    say(byId.pool && byId.pool.box[2] === 250 && byId.pool.box[3] === 150,
      "and a pool's box is the one the layout gave it",
      "the box is not a rectangle anybody typed — it is where the element ended up");
    const carriers = (sandbox.window.EVG_FX_DEMO.list.cmds || []).filter((c) => c.efx).map((c) => c.efx);
    say(carriers.length === 3, `each one anchored in the command stream (${carriers.join(", ")})`);
  }
}

console.log("");
console.log("-- and the two writers agree about it");
{
  // The display list is read two ways: `toJson` for a host on the other side of
  // a string, and `evg-list.js` straight off the Ranger object for a host in
  // the same process. They have to produce the same thing key for key, and
  // `rt:scroll` already holds them together on every frame it draws — on a page
  // with no effects on it. This is the same claim for a page that has three.
  const built = path.join(HERE, "..", "bin", "FxDemoDoc.cjs");
  if (!fs.existsSync(built)) {
    console.log("  SKIP FxDemoDoc.cjs is not built — run `npm run evg:fx:doc`");
  } else {
    const rgr = createRequire(import.meta.url)(built);
    const root = rgr.FxDemoDoc.document();
    const lay = new rgr.EVGLayout();
    lay.setPageSize(900, 560);
    lay.layout(root);
    const dl = new rgr.EVGDisplayList();
    dl.setTextEngine(lay.getTextEngine());
    dl.build(root);
    const fromObject = listOf(dl).effects;
    const fromJson = JSON.parse(dl.toJson()).effects;
    // Keys sorted and coordinates rounded: `toJson` writes two decimals and the
    // object reader hands back what the layout computed, which is the one
    // difference between them that is meant to be there.
    const shape = (e) => JSON.stringify(e, (k, v) =>
      (v && typeof v === "object" && !Array.isArray(v))
        ? Object.fromEntries(Object.keys(v).sort().map((n) => [n, v[n]]))
        : (typeof v === "number" ? Math.round(v * 100) / 100 : v));
    const same = fromObject.length === fromJson.length &&
      fromObject.every((e, i) => shape(e) === shape(fromJson[i]));
    say(same, `both readers see the same ${fromObject.length} effects`,
      "the object reader and the JSON writer disagree:\n        " +
      JSON.stringify(fromObject) + "\n        " + JSON.stringify(fromJson));
    const carriers = listOf(dl).cmds.filter((c) => c.efx).length;
    say(carriers === JSON.parse(dl.toJson()).cmds.filter((c) => c.efx).length,
      `and the same ${carriers} rectangles carrying one`);
  }
}

let chromium;
try {
  ({ chromium } = requireHostTool("playwright-core"));
} catch (e) {
  console.error(e instanceof MissingDomDeps ? e.message : String(e));
  process.exit(3);
}
// SwiftShader, for the same reason every other painter check uses it: a check
// that only runs on a machine with a GPU is not a check.
const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e.message)));
const tmp = path.join(HERE, ".fx-check.html");

/** Render a scene once and hand back the whole canvas as RGBA bytes, plus what
 *  the painter reported about it. Whole frames rather than probes: most of
 *  what is claimed here is about a REGION, and a region is not three pixels. */
async function frameOf(scene, png) {
  fs.writeFileSync(tmp, pageFor(scene));
  await page.goto(pathToFileURL(tmp).href);
  await page.waitForFunction("window.__DONE__ === true", { timeout: 30000 });
  const err = await page.evaluate(() => window.__ERR__ || null);
  if (err) throw new Error("painter threw: " + err);
  if (png) await page.locator("#c").screenshot({ path: png });
  const out = await page.evaluate(([w, h]) => {
    const gl = document.getElementById("c").getContext("webgl2");
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return { px: Array.from(px), stats: window.__stats };
  }, [W, H]);
  // GL hands back bottom-up; flip once here so every reader below counts from
  // the top, the way the display list does.
  const flipped = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y += 1) {
    const src = (H - 1 - y) * W * 4;
    flipped.set(out.px.slice(src, src + W * 4), y * W * 4);
  }
  return { px: flipped, stats: out.stats };
}

const at = (px, x, y) => {
  const i = (y * W + x) * 4;
  return [px[i], px[i + 1], px[i + 2], px[i + 3]];
};
const lum = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
const inside = (x, y) => x >= BOX[0] + 2 && y >= BOX[1] + 2 && x < BOX[0] + BOX[2] - 2 && y < BOX[1] + BOX[3] - 2;

const writeAt = process.argv.indexOf("--write-png");
const pngPath = writeAt > -1 ? process.argv[writeAt + 1] : null;

console.log("");
console.log("-- a starfield on a card");
const sky = await frameOf(SCENES.sky, pngPath);

{
  // INSIDE: the card is nearly black, and stars are the only thing on it that
  // is not. A field with nothing in it reads as the background everywhere.
  let lit = 0, brightest = 0;
  for (let y = BOX[1] + 2; y < BOX[1] + BOX[3] - 2; y += 1) {
    for (let x = BOX[0] + 2; x < BOX[0] + BOX[2] - 2; x += 1) {
      const l = lum(at(sky.px, x, y));
      if (l > lum(SKY) + 12) lit += 1;
      brightest = Math.max(brightest, l);
    }
  }
  const area = (BOX[2] - 4) * (BOX[3] - 4);
  say(lit > area * 0.005, `something is shining on it (${lit} of ${area} pixels lit)`,
    "a starfield that lights nothing is a starfield whose parameters never arrived");
  say(brightest > 150, `and some of it is bright (peak ${Math.round(brightest)})`,
    "stars with no core: the brightest pixel on the card is barely off the background");
}

{
  // OUTSIDE: byte for byte the page drawn without the effect at all. Not "close
  // to white" — the same scene twice, so the only thing a difference can be is
  // the effect reaching past its own box.
  const plainSky = await frameOf(SCENES.skyPlain);
  let worst = 0, where = null;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (inside(x, y)) continue;
      // The box's own edge is antialiased; step clear of it on both sides.
      if (x >= BOX[0] - 2 && x < BOX[0] + BOX[2] + 2 && y >= BOX[1] - 2 && y < BOX[1] + BOX[3] + 2) continue;
      const d = Math.abs(lum(at(sky.px, x, y)) - lum(at(plainSky.px, x, y)));
      if (d > worst) { worst = d; where = [x, y]; }
    }
  }
  say(worst <= 1, `and nothing at all outside the card (worst ${worst.toFixed(1)})`,
    `the page around the box changed at ${where} — the effect is painting past the element that declared it`);
}

console.log("");
console.log("-- and the card's content is drawn over it");
{
  const plated = await frameOf(SCENES.skyUnderPlate);
  let worst = 0;
  for (let y = 75; y < 125; y += 1) {
    for (let x = 105; x < 175; x += 1) {
      const p = at(plated.px, x, y);
      worst = Math.max(worst, Math.abs(p[0] - 220), Math.abs(p[1] - 30), Math.abs(p[2] - 40));
    }
  }
  say(worst <= 2, `the plate over it is its own colour (worst ${worst})`,
    "a star came through an opaque rectangle: the source effect is being drawn " +
    "after the element's content instead of at its background");
}

console.log("");
console.log("-- it moves");
{
  const later = await frameOf(SCENES.skyLater);
  let diff = 0, n = 0;
  for (let y = BOX[1] + 2; y < BOX[1] + BOX[3] - 2; y += 2) {
    for (let x = BOX[0] + 2; x < BOX[0] + BOX[2] - 2; x += 2) {
      diff += Math.abs(lum(at(sky.px, x, y)) - lum(at(later.px, x, y)));
      n += 1;
    }
  }
  const mean = diff / n;
  say(mean > 1.5, `five seconds later it is a different sky (mean |Δ| ${mean.toFixed(2)})`,
    "the two frames are the same picture: the clock is not reaching the shader, " +
    "so the field is a still image that happens to look like stars");
}

console.log("");
console.log("-- a filter bends its own box and nothing else");
{
  const plain = await frameOf(SCENES.edgePlain);
  const wet = await frameOf(SCENES.edgeRippled);
  // INSIDE: the edge moved. Sampled along the row through the ring's crest.
  let moved = 0;
  for (let y = BOX[1] + 10; y < BOX[1] + BOX[3] - 10; y += 3) {
    for (let x = BOX[0] + 4; x < BOX[0] + BOX[2] - 4; x += 1) {
      if (Math.abs(lum(at(plain.px, x, y)) - lum(at(wet.px, x, y))) > 20) { moved += 1; }
    }
  }
  say(moved > 60, `the edge inside the box is displaced (${moved} pixels differ)`,
    "the ripple ran and changed nothing: either the instance was not live or " +
    "the events never reached the shader");

  // OUTSIDE: identical. This is the claim that the pass is scoped at all.
  let worst = 0, where = null;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (x >= BOX[0] - 2 && x < BOX[0] + BOX[2] + 2 && y >= BOX[1] - 2 && y < BOX[1] + BOX[3] + 2) continue;
      const d = Math.abs(lum(at(plain.px, x, y)) - lum(at(wet.px, x, y)));
      if (d > worst) { worst = d; where = [x, y]; }
    }
  }
  say(worst <= 2, `and the surface outside it is untouched (worst ${worst.toFixed(1)})`,
    `${where} changed: the filter is a full-screen pass wearing a box`);
}

console.log("");
console.log("-- what must not break");
{
  const unknown = await frameOf(SCENES.unknown);
  const p = at(unknown.px, BOX[0] + 20, BOX[1] + 20);
  say(Math.abs(p[0] - 30) <= 2 && Math.abs(p[1] - 140) <= 2,
    "an effect nobody registered draws the page without it",
    `the card came back ${p} instead of its own green — an unknown plugin took the frame with it`);

  const legacy = await frameOf(SCENES.legacy);
  const plain = await frameOf(SCENES.edgePlain);
  let moved = 0;
  for (let y = 40; y < H - 40; y += 3) {
    for (let x = 40; x < W - 40; x += 1) {
      if (Math.abs(lum(at(plain.px, x, y)) - lum(at(legacy.px, x, y))) > 20) moved += 1;
    }
  }
  say(moved > 60, `the whole-surface effect still runs (${moved} pixels differ)`,
    "`list.effect` — the original, application-driven ripple — stopped working");
  say(legacy.stats && legacy.stats.rippled === 1, "and still reports that it took the post-pass");
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
