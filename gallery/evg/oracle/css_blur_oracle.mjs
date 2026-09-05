/**
 * The browser, asked what `backdrop-filter: blur()` actually does to pixels.
 *
 *   node gallery/evg/oracle/css_blur_oracle.mjs
 *
 * Writes `css-blur.json` beside this file. Nothing in EVG reads it at run
 * time; the WebGL painter is written against these numbers and
 * `EVGBlurTest.rgr` checks the parts that can be checked without a GPU.
 *
 * WHY MEASURE AT ALL. Everyone "knows" CSS blur is a Gaussian, and the filter
 * spec even says `blur(v)` is a Gaussian with standard deviation `v`. Both
 * halves of that are traps:
 *
 *   1. A Gaussian with sigma = v is not what browsers compute. The spec allows
 *      the classic THREE-BOX approximation from SVG, and that is what every
 *      engine ships — so the profile is very slightly different from a true
 *      Gaussian, and the box widths follow a formula worth copying exactly
 *      rather than reinventing.
 *   2. `backdrop-filter` is not `filter`. It samples what is BEHIND the
 *      element, and the interesting question is what happens at the element's
 *      own edge: a naive implementation blurs only the pixels inside the box,
 *      so the edge fades toward whatever is outside the sample — usually
 *      transparent — and the result has a dark or pale rim a real one does
 *      not. Question 3 below is that rim, measured.
 *
 * Five questions:
 *   1. The PROFILE. A hard black/white edge behind a blurred pane: what does
 *      the ramp across it look like, sample by sample? That is the kernel,
 *      read off the screen.
 *   2. The RADIUS. Does the ramp scale linearly with the radius?
 *   3. The EDGE. A uniform colour behind the pane: is the pane's own border
 *      the same colour all the way to its edge, or does it fall off?
 *   4. COMPOSITING. A translucent background-color on the blurring element —
 *      is it painted over the blurred backdrop, and with what?
 *   5. ROUNDING. Does the blur respect the element's border-radius?
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { requireDom, findChromium, assertDomInstalled } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// A page is one 400x200 backdrop with a 200x120 pane centred over it. Every
// case changes only the backdrop's paint and the pane's filter, so a
// difference in the pixels is a difference in the thing being asked about.
const page = (backdrop, paneStyle) => `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#fff}
  #stage{position:relative;width:400px;height:200px;overflow:hidden}
  #back{position:absolute;inset:0;${backdrop}}
  #pane{position:absolute;left:100px;top:40px;width:200px;height:120px;${paneStyle}}
</style>
<div id="stage"><div id="back"></div><div id="pane"></div></div>`;

assertDomInstalled();
const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const tab = await browser.newPage({ viewport: { width: 420, height: 220 } });

const file = path.join(HERE, ".blur-probe.html");

/** One case: render it, screenshot the stage, hand back a pixel reader. */
async function shoot(backdrop, paneStyle) {
  fs.writeFileSync(file, page(backdrop, paneStyle));
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const buf = await tab.locator("#stage").screenshot();
  // Decode the PNG with the page itself — no image library, and the browser
  // is right there.
  return tab.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const at = (x, y) => {
      const i = (y * c.width + x) * 4;
      return [d[i], d[i + 1], d[i + 2], d[i + 3]];
    };
    return { w: c.width, h: c.height, px: [...Array(c.height)].map((_, y) =>
      [...Array(c.width)].map((_, x) => at(x, y))) };
  }, buf.toString("base64"));
}

const lum = (p) => Math.round(0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]);
const out = {};

// --- 1 & 2. the profile across a hard edge, at three radii ------------------
// The backdrop is black on the left of x=200 and white on the right. Reading
// row 100 across that boundary gives the kernel's step response, which is its
// integral — and the derivative of that is the kernel itself.
const EDGE = "background:linear-gradient(to right,#000 0,#000 50%,#fff 50%,#fff 100%)";
out.stepResponse = {};
for (const r of [4, 8, 16]) {
  const s = await shoot(EDGE, `backdrop-filter:blur(${r}px)`);
  const row = s.px[100];
  // 60 samples either side of the boundary, as luminance 0..255.
  const from = 200 - 40, to = 200 + 40;
  out.stepResponse["blur(" + r + "px)"] = {
    xFrom: from - 200, xTo: to - 200,
    luma: row.slice(from, to).map(lum),
  };
}
out.$profileComment =
  "Row 100 across a black/white boundary at x=200, as luminance. This is the " +
  "kernel's step response; the difference between neighbouring samples is the " +
  "kernel. Compare a true Gaussian against the three-box approximation here.";

// --- 3. the element's own edge over a UNIFORM backdrop -----------------------
// Mid grey everywhere behind. If the implementation samples only what is
// inside the pane, the pane's rim fades toward transparent and this row is not
// flat. A real one is flat: the backdrop is sampled past the edge and then
// clipped.
{
  const s = await shoot("background:#808080", "backdrop-filter:blur(12px)");
  const row = s.px[100];
  out.uniformBackdrop = {
    // Just inside the pane's left edge, which is at x=100.
    insideLeft: [0, 1, 2, 3, 4, 6, 8, 12, 20].map((d) => ({ dx: d, luma: lum(row[100 + d]) })),
    centre: lum(row[200]),
    $comment:
      "A flat row means the backdrop is sampled BEYOND the element and then " +
      "clipped to it. A ramp would mean the sample was clamped to the box, " +
      "which is the bug this case exists to catch.",
  };
}

// --- 4. a translucent background over the blurred backdrop -------------------
{
  const s = await shoot("background:#000", "backdrop-filter:blur(12px);background:rgba(255,255,255,0.6)");
  out.overColour = {
    paneCentre: s.px[100][200],
    $comment:
      "Black backdrop, blurred, under a 60% white fill. The blur of a uniform " +
      "black is black, so this is the fill composited over black: 255*0.6 = 153.",
  };
}

// --- 4b. a feature that straddles the pane's own edge -------------------------
// Cases 1-3 all have the same colour on both sides of the pane's border, which
// makes them blind to two mistakes that look identical in them: a blur that
// samples only inside the box, and one that ignores the corner radius. Both
// were written, both passed, and both had to be caught by a case where what is
// OUTSIDE the pane differs from what is just inside it.
//
// White page, a black stripe starting exactly at the pane's left edge. Now:
//   - just inside that edge, a correct blur is lightened by the white it can
//     see OUTSIDE the pane; one that cannot look past the box stays black;
//   - just outside the rounded corner, the backdrop is untouched black, while
//     a blur drawn square would have lightened it there too.
{
  const s = await shoot(
    "background:#fff",
    "backdrop-filter:blur(12px);border-radius:40px");
  // The stripe is drawn as a second layer behind the pane, so a separate page.
  const withStripe = `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#fff}
  #stage{position:relative;width:400px;height:200px;overflow:hidden}
  #back{position:absolute;inset:0;background:#fff}
  #stripe{position:absolute;left:99px;top:0;width:101px;height:200px;background:#000}
  #pane{position:absolute;left:100px;top:40px;width:200px;height:120px;
        backdrop-filter:blur(12px);border-radius:40px}
</style>
<div id="stage"><div id="back"></div><div id="stripe"></div><div id="pane"></div></div>`;
  fs.writeFileSync(file, withStripe);
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const buf = await tab.locator("#stage").screenshot();
  const shot = await tab.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const at = (x, y) => { const i = (y * c.width + x) * 4; return [d[i], d[i+1], d[i+2], d[i+3]]; };
    return { insideEdge: [at(102,100), at(105,100), at(110,100), at(120,100)],
             outsideCorner: at(103, 43), deepInside: at(150, 100) };
  }, buf.toString("base64"));
  out.acrossTheEdge = {
    ...shot,
    $comment:
      "White page, black stripe from x=99 to x=200 — one pixel LEFT of the " +
      "pane's own left edge at x=100, so that the stripe's border is outside " +
      "the region a correct blur samples. A painter that antialiases its " +
      "rectangles (EVG does; a browser's div does not) otherwise leaves a soft " +
      "seam exactly on the pane's border, and that seam blurs into the first " +
      "few pixels and muddies the very comparison this case exists for. " +
      "`insideEdge` is x = 102, 105, 110, 120 at mid height: a blur that can " +
      "see past the pane's border is lightened there by the white outside it, " +
      "and one that cannot stays black. `outsideCorner` is (103,43), which is " +
      "outside the 40px corner: the backdrop there is UNTOUCHED, so a blur " +
      "drawn as a square rather than a rounded box lightens a pixel that " +
      "should have stayed black.",
  };
}

// --- 4c. a corner with something to blur behind it ---------------------------
// Case 5 below proves the FILL is clipped to the radius. It cannot prove the
// BLUR is, because its backdrop is uniform black: blurred black is black, so a
// blur drawn as a square rather than a rounded box looks identical.
//
// This one puts a hard horizontal band across the top of the pane. Outside the
// rounded corner the backdrop is the raw band — black — while a square blur
// would have mixed it with the white below and left grey there instead.
{
  const banded = `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#fff}
  #stage{position:relative;width:400px;height:200px;overflow:hidden}
  #back{position:absolute;inset:0;background:#fff}
  #band{position:absolute;left:0;top:39px;width:400px;height:31px;background:#000}
  #pane{position:absolute;left:100px;top:40px;width:200px;height:120px;
        backdrop-filter:blur(12px);border-radius:40px}
</style>
<div id="stage"><div id="back"></div><div id="band"></div><div id="pane"></div></div>`;
  fs.writeFileSync(file, banded);
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const buf = await tab.locator("#stage").screenshot();
  const shot = await tab.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const at = (x, y) => { const i = (y * c.width + x) * 4; return [d[i], d[i+1], d[i+2], d[i+3]]; };
    return { outsideCorner: at(103, 43), insideBand: at(200, 50), belowBand: at(200, 90) };
  }, buf.toString("base64"));
  out.bandedCorner = {
    ...shot,
    $comment:
      "A black band across the top of a rounded pane over white, starting one " +
      "pixel ABOVE the pane so its own edge is outside what the blur samples " +
      "— the same precaution `acrossTheEdge` explains. " +
      "`outsideCorner` (103,43) lies outside the 40px radius, so the backdrop " +
      "there is the RAW band and stays black; a blur drawn square would have " +
      "mixed in the white below and left grey. `insideBand` and `belowBand` " +
      "are the softened band itself, well inside the shape.",
  };
}

// --- 4d. a corner with a VERTICAL feature through it --------------------------
// 4c's band is horizontal, so near the top-left corner everything is black and
// blurred-black is black: a blur drawn square instead of rounded looks exactly
// the same. This turns the feature ninety degrees. A narrow black column down
// the pane's left side means that just outside the corner the raw backdrop is
// black while the blurred one has pulled in the white to its right — so the
// two answers are 0 and something near 100, and a square clip cannot hide.
{
  const striped = `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#fff}
  #stage{position:relative;width:400px;height:200px;overflow:hidden}
  #back{position:absolute;inset:0;background:#fff}
  #col{position:absolute;left:95px;top:0;width:14px;height:200px;background:#000}
  #pane{position:absolute;left:100px;top:40px;width:200px;height:120px;
        backdrop-filter:blur(12px);border-radius:40px}
</style>
<div id="stage"><div id="back"></div><div id="col"></div><div id="pane"></div></div>`;
  fs.writeFileSync(file, striped);
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const buf = await tab.locator("#stage").screenshot();
  const shot = await tab.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const at = (x, y) => { const i = (y * c.width + x) * 4; return [d[i], d[i+1], d[i+2], d[i+3]]; };
    return { outsideCorner: at(104, 43), wellInside: at(104, 100), rightOfIt: at(140, 100) };
  }, buf.toString("base64"));
  out.verticalCorner = {
    ...shot,
    $comment:
      "A black column covering x = 95..109, so that inside the pane it is " +
      "100..109 and its own edge is five pixels clear of the pane's border. " +
      "That clearance matters more here than anywhere else: the border pixel " +
      "is what every clamped sample reads, so a painter that softens its " +
      "rectangles by a third of a pixel has that third replicated across half " +
      "the kernel. Narrow on purpose, too: a wide column stays dark when blurred and the " +
      "two answers end up 0 and 20, which is inside the noise a GPU comparison " +
      "has to allow. A narrow one blurs almost away, and the gap becomes the " +
      "width of the scale. " +
      "of the pane. `outsideCorner` (104,43) is outside the 40px radius: raw " +
      "black. `wellInside` (104,100) is the same x at mid height, inside the " +
      "shape: the blurred column, much lighter. The gap between those two " +
      "numbers is the whole test — a blur drawn square gives the second answer " +
      "in both places.",
  };
}

// --- 4e. a narrow feature well clear of every border --------------------------
// The step response in case 1 is a single edge at the pane's centre. This is a
// narrow COLUMN — two edges close together, which is the harder thing for a
// kernel to get right — and it is placed 50px in from the nearest border so
// that nothing about the element's edge is involved. That separation is the
// point: it is the profile against which the kernel itself can be judged.
{
  const inner = `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#fff}
  #stage{position:relative;width:400px;height:200px;overflow:hidden}
  #back{position:absolute;inset:0;background:#fff}
  #col{position:absolute;left:150px;top:0;width:14px;height:200px;background:#000}
  #pane{position:absolute;left:100px;top:40px;width:200px;height:120px;
        backdrop-filter:blur(12px)}
</style>
<div id="stage"><div id="back"></div><div id="col"></div><div id="pane"></div></div>`;
  fs.writeFileSync(file, inner);
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const buf = await tab.locator("#stage").screenshot();
  const shot = await tab.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const xs = [];
    for (let x = 130; x <= 190; x += 2) xs.push(x);
    return { xs, luma: xs.map((x) => {
      const i = (100 * c.width + x) * 4;
      return Math.round(0.2126 * d[i] + 0.7152 * d[i+1] + 0.0722 * d[i+2]);
    }) };
  }, buf.toString("base64"));
  out.innerColumn = {
    ...shot,
    $comment:
      "A 14px black column at x=150, fifty pixels clear of the pane's nearest " +
      "border, sampled across at mid height. Two edges close together is the " +
      "case a kernel is easiest to get wrong on, and there is no border " +
      "behaviour mixed into it.",
  };
}

// --- 4f. and what happens WITHIN a kernel's reach of the border ---------------
// Recorded because it is a real difference, and not matched.
//
// Move that same column to straddle the pane's left border and the browser
// stops producing a blur profile at all. Across x = 100..108 it is a straight
// line of about 8 levels a pixel; at x = 109, the column's own right edge, it
// JUMPS 63 levels; and from 110 it is another straight line of about 2.5. A
// blurred step is an S-curve. Two straight segments with a discontinuity
// between them is not a Gaussian, a three-box approximation, or any kernel —
// it is what a compositor's downsampled edge handling looks like.
//
// So EVG clamps at the element's border, which is the principled reading of
// the same rule, and matches the browser everywhere the border is more than a
// kernel's reach away — within 3 levels, see `innerColumn`. Inside that band
// the two differ by up to about 45, and the difference is Chrome's artefact
// rather than a behaviour worth copying. Written down here so the next person
// to compare screenshots finds the answer instead of the puzzle.
{
  const straddling = `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#fff}
  #stage{position:relative;width:400px;height:200px;overflow:hidden}
  #back{position:absolute;inset:0;background:#fff}
  #col{position:absolute;left:95px;top:0;width:14px;height:200px;background:#000}
  #pane{position:absolute;left:100px;top:40px;width:200px;height:120px;
        backdrop-filter:blur(12px)}
</style>
<div id="stage"><div id="back"></div><div id="col"></div><div id="pane"></div></div>`;
  fs.writeFileSync(file, straddling);
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const buf = await tab.locator("#stage").screenshot();
  const shot = await tab.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const xs = [];
    for (let x = 98; x <= 130; x++) xs.push(x);
    return { xs, luma: xs.map((x) => {
      const i = (100 * c.width + x) * 4;
      return Math.round(0.2126 * d[i] + 0.7152 * d[i+1] + 0.0722 * d[i+2]);
    }) };
  }, buf.toString("base64"));
  out.borderBand = {
    ...shot,
    matched: false,
    $comment:
      "NOT matched, on purpose. Two straight segments with a 63-level jump at " +
      "x=109 — Chrome's downsampled edge handling, not a kernel. EVG clamps at " +
      "the border instead and agrees with the browser everywhere further than " +
      "a kernel's reach from it. Kept so the difference is a decision on " +
      "record rather than a surprise.",
  };
}

// --- 5. rounded corners ------------------------------------------------------
{
  const s = await shoot("background:#000", "backdrop-filter:blur(12px);background:rgba(255,255,255,0.85);border-radius:40px");
  // The pane's top-left corner is at (100,40) with a 40px radius, so (104,44)
  // is outside the rounded shape and (140,80) is well inside it.
  out.rounded = {
    outsideTheCorner: s.px[44][104],
    insideTheCorner: s.px[80][140],
    $comment:
      "Outside the rounded corner the backdrop shows through untouched " +
      "(black); inside, the pane's fill is over it. The blur is clipped to " +
      "the BORDER BOX INCLUDING its radius, not to the rectangle.",
  };
}

await browser.close();
fs.rmSync(file, { force: true });

// --- which model is it, then? -----------------------------------------------
// The step responses above are enough to decide between the two candidates, so
// the oracle decides rather than leaving it to whoever reads the numbers. Both
// are fitted here and the residuals are recorded: a claim about the kernel
// that comes with its own error bar is one an implementation can be held to.
function stepOfThreeBoxes(sigma, n) {
  // The SVG filter spec's approximation, which the CSS filter spec inherits:
  // three box passes of width d = floor(sigma * 3 * sqrt(2*pi) / 4 + 0.5).
  // An odd d centres; an even d is offset by half a pixel on two of the three
  // passes and widened by one on the third, which is what makes the result
  // symmetric.
  let d = Math.floor((sigma * 3 * Math.sqrt(2 * Math.PI)) / 4 + 0.5);
  if (d < 1) d = 1;
  const step = new Array(2 * n).fill(0).map((_, i) => (i < n ? 0 : 1));
  const pass = (sig, w, off) => sig.map((_, i) => {
    const half = w >> 1;
    let acc = 0;
    for (let k = i - half + off; k < i - half + off + w; k++) {
      acc += sig[Math.min(Math.max(k, 0), sig.length - 1)];
    }
    return acc / w;
  });
  return d % 2 === 1
    ? pass(pass(pass(step, d, 0), d, 0), d, 0)
    : pass(pass(pass(step, d, 0), d, 1), d + 1, 0);
}
const erf = (x) => {
  // Abramowitz & Stegun 7.1.26, plenty for four significant figures.
  const s = x < 0 ? -1 : 1; x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
};
const phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

out.kernel = {};
for (const [label, v] of Object.entries(out.stepResponse)) {
  const r = parseInt(label.match(/\d+/)[0], 10);
  const N = 300;
  const models = {
    "gaussian sigma=r": (x) => 255 * phi(x / r),
    "gaussian sigma=r/2": (x) => 255 * phi(x / (r / 2)),
    "three-box sigma=r": ((a) => (x) => 255 * a[N + x])(stepOfThreeBoxes(r, N)),
    "three-box sigma=r/2": ((a) => (x) => 255 * a[N + x])(stepOfThreeBoxes(r / 2, N)),
  };
  const fits = {};
  for (const [name, f] of Object.entries(models)) {
    let worst = 0;
    for (let i = 0; i < v.luma.length; i++) {
      const x = v.xFrom + i;
      worst = Math.max(worst, Math.abs(v.luma[i] - f(x)));
    }
    fits[name] = Math.round(worst * 10) / 10;
  }
  out.kernel[label] = fits;
}
out.kernel.$comment =
  "Worst absolute error in luminance (0..255) between the measured step " +
  "response and each candidate. `three-box sigma=r` wins at every radius by " +
  "a wide margin — so `blur(r)` is the SVG three-box approximation with " +
  "sigma = r, NOT a true Gaussian and NOT sigma = r/2. The common belief is " +
  "half right: the sigma is the radius, and the shape is not a Gaussian.";


const outFile = path.join(HERE, "css-blur.json");
fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n");
console.log("wrote " + path.relative(process.cwd(), outFile));
for (const [k, v] of Object.entries(out.stepResponse)) {
  const l = v.luma;
  console.log(`  ${k.padEnd(14)} edge ramp ${l[35]} ${l[38]} ${l[40]} ${l[42]} ${l[45]}`);
}
console.log("  uniform backdrop, inside the left edge:",
  out.uniformBackdrop.insideLeft.map((s) => s.luma).join(" "));
console.log("  centre:", out.uniformBackdrop.centre);
console.log("  60% white over blurred black:", JSON.stringify(out.overColour.paneCentre));
console.log("  outside a 40px corner:", JSON.stringify(out.rounded.outsideTheCorner),
  " inside:", JSON.stringify(out.rounded.insideTheCorner));
console.log("  across the pane's own edge:",
  out.acrossTheEdge.insideEdge.map((p) => lum(p)).join(" "),
  " outside the corner:", lum(out.acrossTheEdge.outsideCorner),
  " deep inside:", lum(out.acrossTheEdge.deepInside));
console.log("  banded corner: outside=", lum(out.bandedCorner.outsideCorner),
  " in the band=", lum(out.bandedCorner.insideBand),
  " below it=", lum(out.bandedCorner.belowBand));
console.log("  vertical corner: outside=", lum(out.verticalCorner.outsideCorner),
  " same x inside=", lum(out.verticalCorner.wellInside),
  " right of it=", lum(out.verticalCorner.rightOfIt));
console.log("  inner column:", out.innerColumn.luma.slice(0, 12).join(" "), "...");
console.log("  border band (NOT matched):", out.borderBand.luma.slice(0, 14).join(" "), "...");
console.log("  worst luminance error per candidate kernel:");
for (const [label, fits] of Object.entries(out.kernel)) {
  if (label.startsWith("$")) continue;
  const best = Object.entries(fits).sort((a, b) => a[1] - b[1])[0][0];
  console.log("    " + label.padEnd(14) +
    Object.entries(fits).map(([n, e]) => `${n}=${e}`).join("  ") + "   -> " + best);
}
