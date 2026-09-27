#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// A run of text is drawn on whole device pixels.
//
//   node lib/evg/gl/text-snap-check.mjs
//
// The painter rasterises every run into an atlas at the page's device ratio and
// draws it as a textured quad, sampled linearly. Layout puts text at fractional
// positions all the time (a centred label, a half-leading, a flex share), and a
// quad whose corner is a fraction of a pixel off the grid samples each glyph
// between two texels: the whole run comes out resampled, a little soft next to
// the same words in the page's own DOM. That was reported by eye on the EVGUI
// pages as "a slight blurriness in the EVG rendered font".
//
// The rule, checked on the framebuffer: the same run drawn at x = 30 and at
// x = 30.37 (and the same for y, and at a device ratio of 2) differ only by a
// whole-pixel move. A resampled run matches the integer one under no shift at
// all, because every edge pixel changes value.
//
// Exit code 0 when every fractional placement is a whole-pixel copy.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { findChromium } from "../../../gallery/ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = 240;
const H = 80;

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else {
    failed += 1;
    console.log("  FAIL " + name + (detail === undefined ? "" : " — " + detail));
  }
};

const scene = (x, y) => [
  { k: 0, x: 0, y: 0, w: W, h: H, c: [255, 255, 255, 1] },
  { k: 3, x, y, w: 200, h: 20, text: "Set the dimensions 100%", font: "", size: 14, c: [9, 9, 11, 1] },
];

const painter = fs.readFileSync(path.join(HERE, "evg-webgl.js"), "utf8").replace(/^export /gm, "");

const pageFor = (cmds, dpr) => `<!doctype html><meta charset="utf-8">
<body style="margin:0;background:#fff"><canvas id="c" width="${W * dpr}" height="${H * dpr}"></canvas>
<script type="module">
${painter}
try {
  const gl = document.getElementById("c").getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
  const doc = { width: ${W}, height: ${H}, list: { cmds: ${JSON.stringify(cmds)} } };
  const frame = prepareDisplayList(gl, doc, { dpr: ${dpr} });
  frame.draw(null, null);
  if (gl.finish) gl.finish();
  window.__DONE__ = true;
} catch (e) { window.__ERR__ = String((e && e.stack) || e); window.__DONE__ = true; }
</script></body>`;

const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: W * 2 + 40, height: H * 2 + 40 } });
const tmp = path.join(HERE, ".text-snap-check.html");
let loadSeq = 0;

/** The framebuffer as luminance, one byte a pixel, rows top-down. */
async function lumaOf(cmds, dpr) {
  fs.writeFileSync(tmp, pageFor(cmds, dpr));
  loadSeq += 1;
  await page.goto(pathToFileURL(tmp).href + "?n=" + loadSeq, { waitUntil: "load" });
  await page.waitForFunction("window.__DONE__ === true", { timeout: 30000 });
  const err = await page.evaluate(() => window.__ERR__ || null);
  if (err) throw new Error("painter threw: " + err);
  const [ww, hh] = [W * dpr, H * dpr];
  const px = await page.evaluate(([ww, hh]) => {
    const gl = document.getElementById("c").getContext("webgl2");
    const out = new Uint8Array(ww * hh * 4);
    gl.readPixels(0, 0, ww, hh, gl.RGBA, gl.UNSIGNED_BYTE, out);
    return Array.from(out);
  }, [ww, hh]);
  const l = new Uint8Array(ww * hh);
  for (let y = 0; y < hh; y += 1) {
    for (let x = 0; x < ww; x += 1) {
      const i = ((hh - 1 - y) * ww + x) * 4; // GL rows are bottom-up
      l[y * ww + x] = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
    }
  }
  return { l, ww, hh };
}

/** The worst pixel difference between a and b moved by (dx, dy), over the inside. */
function worst(a, b, dx, dy) {
  let m = 0;
  for (let y = 4; y < a.hh - 4; y += 1) {
    for (let x = 4; x < a.ww - 4; x += 1) {
      const d = Math.abs(a.l[y * a.ww + x] - b.l[(y + dy) * b.ww + (x + dx)]);
      if (d > m) m = d;
    }
  }
  return m;
}

/** The whole-pixel move that makes b equal a, if there is one. */
function wholePixelMatch(a, b) {
  let best = { d: 256, dx: 0, dy: 0 };
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const d = worst(a, b, dx, dy);
      if (d < best.d) best = { d, dx, dy };
    }
  }
  return best;
}

for (const dpr of [1, 2]) {
  console.log(`--- device ratio ${dpr} ---`);
  const base = await lumaOf(scene(30, 30), dpr);
  let ink = 0;
  for (const v of base.l) if (v < 128) ink += 1;
  ok("the run draws ink", ink > 50, ink + " dark pixels");
  for (const [fx, fy] of [[30.37, 30], [30, 30.41], [30.5, 30.5], [29.77, 30.23]]) {
    const moved = await lumaOf(scene(fx, fy), dpr);
    const m = wholePixelMatch(base, moved);
    // 2 levels of slack for the rasteriser's own rounding; a resampled run
    // is tens of levels off along every edge.
    ok(`at (${fx}, ${fy}) it is the same pixels, moved ${m.dx},${m.dy}`, m.d <= 2,
       "worst difference " + m.d + " under the best whole-pixel move");
  }
}

await browser.close();
fs.rmSync(tmp, { force: true });
console.log(failed ? `\nRESULT FAIL — ${failed}` : "\nALL PASS");
process.exit(failed ? 1 : 0);
