/**
 * The camera, against the coordinates it replaces.
 *
 *   node gallery/evg/gl/view-check.mjs [--write-png prefix]
 *
 * A display list has always been written in the coordinates it is drawn at,
 * so a host that pans or zooms multiplies the scene and hands over a new
 * list. A view does the multiplying in the shader instead, which is what lets
 * a frame already built be drawn somewhere else (PLAN_VIEW_TRANSFORM.md).
 *
 * The claim is that the two are the SAME PICTURE, and it is a claim about
 * pixels: a rounded corner whose radius did not scale, a border that stayed
 * one pixel while its box doubled, a clip that scissored the unpanned
 * rectangle — every one of those is a plausible drawing that is wrong, and
 * none of them changes a command count. So this bakes a view into a list the
 * old way, draws the same list with the view on the camera instead, and reads
 * both framebuffers back.
 *
 * WHAT IS DELIBERATELY NOT COMPARED PIXEL FOR PIXEL. Text. A run is
 * rasterised into an atlas at its size, so a baked list rasterises at the
 * scaled size and a camera stretches the unscaled one — the §4 caveat, and
 * the whole reason a frame may only be stretched within a band before it is
 * built again. The text scene therefore compares where the ink LANDS, which
 * is the thing a camera must still get right.
 *
 * SwiftShader, so this runs on a machine with no GPU. Exit 0 when every scene
 * agrees.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { findChromium } from "../../ui/conformance/dom-adapter.mjs";
import { chromium } from "playwright-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = 400;
const H = 240;

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) {
    passed += 1;
    console.log("  PASS  " + name + (detail ? " (" + detail + ")" : ""));
  } else {
    failed += 1;
    console.log("  FAIL  " + name + (detail ? " (" + detail + ")" : ""));
  }
};

// --- the scenes -------------------------------------------------------------
//
// Every one of them is in SCENE coordinates. `bake` below is what a host does
// today; the camera is what it would do instead.

const SCENES = {
  // Solid, rounded, bordered, and a gradient — the four things the rect
  // program does, and the three of them whose size feeds the distance field.
  boxes: [
    { k: 0, x: 0, y: 0, w: W, h: H, c: [250, 250, 252, 1] },
    { k: 0, x: 20, y: 20, w: 120, h: 60, c: [40, 90, 200, 1] },
    { k: 0, x: 160, y: 20, w: 120, h: 60, r: 18, c: [220, 60, 80, 1] },
    { k: 0, x: 20, y: 100, w: 120, h: 60, r: 10, t: 6, c: [20, 140, 90, 1] },
    { k: 0, x: 160, y: 100, w: 120, h: 60, c: [255, 200, 0, 1], gd: 0, c2: [0, 120, 255, 1] },
    { k: 0, x: 300, y: 20, w: 60, h: 140, rc: [30, 4, 30, 4], c: [120, 60, 180, 1] },
  ],
  // A fill and a stroke, both as rings. The stroke's width scales with the
  // picture, which is the choice §3 names.
  paths: [
    { k: 0, x: 0, y: 0, w: W, h: H, c: [255, 255, 255, 1] },
    {
      k: 6, x: 20, y: 20, w: 160, h: 160, c: [30, 30, 40, 1],
      pts: [40, 40, 160, 40, 160, 120, 90, 170, 40, 120],
      ends: [10],
    },
    {
      k: 7, x: 200, y: 20, w: 180, h: 180, t: 8, c: [200, 40, 40, 1],
      pts: [220, 40, 360, 40, 360, 180, 220, 180, 220, 40],
      ends: [10],
    },
  ],
  // A clip, with content that runs past it in both directions. A scissor is
  // the one rectangle the shader cannot map, so it is the one most likely to
  // be left in the coordinates the camera moved away from.
  clipped: [
    { k: 0, x: 0, y: 0, w: W, h: H, c: [245, 245, 245, 1] },
    { k: 4, x: 80, y: 60, w: 140, h: 90, c: [0, 0, 0, 1] },
    { k: 0, x: 40, y: 20, w: 300, h: 180, c: [0, 140, 160, 1] },
    { k: 5, x: 0, y: 0, w: 0, h: 0, c: [0, 0, 0, 1] },
    { k: 0, x: 250, y: 60, w: 60, h: 90, c: [160, 160, 160, 1] },
  ],
  // A rotated box: the pivot is scene geometry and the turn happens before
  // the camera, so a scaled view must not shear it.
  rotated: [
    { k: 0, x: 0, y: 0, w: W, h: H, c: [255, 255, 255, 1] },
    { k: 0, x: 120, y: 70, w: 160, h: 80, r: 12, c: [60, 60, 70, 1], rot: 20, rox: 200, roy: 110 },
  ],
  // A softened backdrop. The radius has to grow with the picture or it is a
  // different blur at a different zoom.
  blurred: [
    { k: 0, x: 0, y: 0, w: W, h: H, c: [255, 255, 255, 1] },
    { k: 0, x: 0, y: 0, w: 200, h: H, c: [10, 10, 10, 1] },
    { k: 0, x: 120, y: 60, w: 160, h: 120, r: 24, c: [0, 0, 0, 0], bb: 8 },
  ],
};

const TEXT_SCENE = [
  { k: 0, x: 0, y: 0, w: W, h: H, c: [255, 255, 255, 1] },
  { k: 3, x: 30, y: 60, w: 300, h: 24, text: "Handgloves 123", font: "", size: 24, c: [0, 0, 0, 1] },
];

/** What a host does today: multiply the scene and hand over a new list. */
function bake(cmds, v) {
  const s = v.scale, tx = v.x, ty = v.y;
  return cmds.map((c) => {
    const o = { ...c };
    o.x = c.x * s + tx;
    o.y = c.y * s + ty;
    o.w = c.w * s;
    o.h = c.h * s;
    if (c.r) o.r = c.r * s;
    if (c.rc) o.rc = c.rc.map((r) => r * s);
    if (c.t) o.t = c.t * s;
    if (c.bb) o.bb = c.bb * s;
    if (c.size) o.size = c.size * s;
    if (c.rox !== undefined) o.rox = c.rox * s + tx;
    if (c.roy !== undefined) o.roy = c.roy * s + ty;
    if (c.pts) o.pts = c.pts.map((p, i) => (i % 2 === 0 ? p * s + tx : p * s + ty));
    return o;
  });
}

const VIEWS = [
  { name: "identity", x: 0, y: 0, scale: 1 },
  { name: "a pan", x: 37, y: -22, scale: 1 },
  { name: "zoomed in", x: -60, y: -30, scale: 1.35 },
  { name: "zoomed out", x: 40, y: 25, scale: 0.7 },
  { name: "pan and zoom", x: 18, y: 44, scale: 1.15 },
];

// --- the page ---------------------------------------------------------------

const painter = fs.readFileSync(path.join(HERE, "evg-webgl.js"), "utf8")
  .replace(/^export /gm, "");

const pageFor = (cmds, view) => `<!doctype html><meta charset="utf-8">
<body style="margin:0;background:#fff"><canvas id="c" width="${W}" height="${H}"></canvas>
<script type="module">
${painter}
try {
  const gl = document.getElementById("c").getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
  const doc = { width: ${W}, height: ${H}, list: { cmds: ${JSON.stringify(cmds)} } };
  const frame = prepareDisplayList(gl, doc, { dpr: 1 });
  frame.draw(null, ${JSON.stringify(view)});
  // For the last check below, which builds ONE frame and draws it twice.
  window.__prepare = prepareDisplayList;
  window.__DONE__ = true;
} catch (e) { window.__ERR__ = String((e && e.stack) || e); window.__DONE__ = true; }
</script></body>`;

// Playwright and a Chromium, and nothing else: this draws through the
// painter and reads its own framebuffer, so it needs none of the React
// reference host the conformance oracles are built on.
const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 } });
const tmp = path.join(HERE, ".view-check.html");

/** Draw one list at one view and read the whole framebuffer back. */
async function pixelsOf(cmds, view, png) {
  fs.writeFileSync(tmp, pageFor(cmds, view));
  await page.goto(pathToFileURL(tmp).href);
  await page.waitForFunction("window.__DONE__ === true", { timeout: 30000 });
  const err = await page.evaluate(() => window.__ERR__ || null);
  if (err) throw new Error("painter threw: " + err);
  if (png) await page.locator("#c").screenshot({ path: png });
  return page.evaluate(([ww, hh]) => {
    const gl = document.getElementById("c").getContext("webgl2");
    const px = new Uint8Array(ww * hh * 4);
    gl.readPixels(0, 0, ww, hh, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return Array.from(px);
  }, [W, H]);
}

/** The worst channel difference between two framebuffers, and where. */
function worstDiff(a, b) {
  let worst = 0;
  let at = -1;
  let off = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = Math.abs(a[i] - b[i]);
    if (d > worst) { worst = d; at = i; }
    if (d > 2) off += 1;
  }
  const px = at < 0 ? null : [(at >> 2) % W, Math.floor((at >> 2) / W)];
  return { worst, off, px };
}

/** The ink's bounding box: which pixels are not the paper. */
function inkBox(px) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * 4;
      if (px[i] < 200 || px[i + 1] < 200 || px[i + 2] < 200) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  // GL reads from the bottom; the list counts from the top. Only the height
  // flips, and only the SIZE of the box is compared, so it does not matter.
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

const writeAt = process.argv.indexOf("--write-png");
const pngPrefix = writeAt > -1 ? process.argv[writeAt + 1] : null;

console.log("=== the camera against the coordinates it replaces ===");

// --- the geometry scenes ----------------------------------------------------
//
// The same picture, drawn twice: once with the view multiplied into the list
// and once with it on the camera. Two or three levels of slack per channel,
// because the two paths reach the same edge through different arithmetic and
// an antialiased boundary is where that shows.
for (const [name, cmds] of Object.entries(SCENES)) {
  for (const v of VIEWS) {
    const baked = await pixelsOf(bake(cmds, v), { x: 0, y: 0, scale: 1 },
      pngPrefix ? `${pngPrefix}-${name}-${v.name.replace(/ /g, "_")}-baked.png` : null);
    const camera = await pixelsOf(cmds, v,
      pngPrefix ? `${pngPrefix}-${name}-${v.name.replace(/ /g, "_")}-camera.png` : null);
    const d = worstDiff(baked, camera);
    ok(
      `${name}, ${v.name}`,
      d.worst <= 3,
      `worst ${d.worst}, ${d.off} px past tolerance` + (d.px && d.worst > 3 ? ` at ${d.px[0]},${d.px[1]}` : ""),
    );
  }
}

// --- text lands where it should --------------------------------------------
//
// Not the pixels: the atlas was rasterised at one size and stretched to the
// other, which is the §4 caveat and the reason for the band. What must hold
// is that the run is the right size and in the right place.
for (const v of VIEWS.slice(1)) {
  const baked = inkBox(await pixelsOf(bake(TEXT_SCENE, v), { x: 0, y: 0, scale: 1 }));
  const camera = inkBox(await pixelsOf(TEXT_SCENE, v));
  const dw = Math.abs(baked.w - camera.w);
  const dh = Math.abs(baked.h - camera.h);
  const dx = Math.abs(baked.x0 - camera.x0);
  const dy = Math.abs(baked.y0 - camera.y0);
  ok(
    `text, ${v.name}: the run is the same size in the same place`,
    dw <= 2 && dh <= 2 && dx <= 2 && dy <= 2,
    `box off by ${dx},${dy} and ${dw}x${dh}`,
  );
}

// --- a frame drawn twice is two pictures, not one --------------------------
//
// The point of the whole thing: ONE build, drawn at two views. If `draw`
// silently kept the first view, every check above would still pass — they
// each build their own frame.
{
  const two = await page.evaluate(
    ([cmds, ww, hh, v1, v2]) => {
      const gl = document.getElementById("c").getContext("webgl2");
      const doc = { width: ww, height: hh, list: { cmds } };
      const frame = window.__prepare(gl, doc, { dpr: 1 });
      const read = () => {
        const px = new Uint8Array(ww * hh * 4);
        gl.readPixels(0, 0, ww, hh, gl.RGBA, gl.UNSIGNED_BYTE, px);
        return Array.from(px);
      };
      frame.draw(null, v1);
      const a = read();
      frame.draw(null, v2);
      const b = read();
      frame.dispose();
      return { a, b };
    },
    [SCENES.boxes, W, H, VIEWS[0], VIEWS[1]],
  ).catch((e) => ({ err: String(e && e.message) }));
  if (two.err) {
    ok("one frame, two views", false, two.err);
  } else {
    const moved = worstDiff(two.a, two.b);
    ok("one frame drawn at two views is two pictures", moved.worst > 3, `worst ${moved.worst}`);
    // …and the second of them is the picture a fresh build gives.
    const fresh = await pixelsOf(SCENES.boxes, VIEWS[1]);
    const d = worstDiff(two.b, fresh);
    ok("and the moved one matches a frame built there", d.worst <= 3, `worst ${d.worst}, ${d.off} px past tolerance`);
  }
}

fs.rmSync(tmp, { force: true });
await browser.close();

console.log("");
console.log(`passed=${passed} failed=${failed}`);
if (failed > 0) {
  console.log("SOME FAILED");
  process.exit(1);
}
console.log("ALL PASS");
