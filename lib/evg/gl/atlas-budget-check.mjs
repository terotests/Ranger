#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// One enormous run of text does not make the glyph atlas start over on
// every draw.
//
//   node lib/evg/gl/atlas-budget-check.mjs
//
// A run is rasterised at the size it lands on the screen, and that size comes
// from the document: `font-size: 2020px` at a device ratio of 2 is a picture
// thousands of pixels tall. Two display lists that share a context (an
// editor's chrome and its slide) used to evict each other: the slide's giant
// run filled the shelf, the chrome found no room and rebuilt the atlas
// without it, the slide rebuilt it again — every paint, with a read-back of
// the whole texture each time, and the page stopped answering.
//
// Checked here: `rasterDpr` keeps a run inside its share of the atlas; three
// lists drawn in turn (small runs, 2020px headings, one run wider than any
// shelf) settle on one atlas; a long line is cut into pieces drawn at the
// frame's ratio (`splitWideRuns`) and is as crisp as a short one
// (nothing rebuilds after the first round, and every run keeps its slot);
// and the headings still draw ink.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { findChromium } from "../../../gallery/ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = 960;
const H = 540;

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else {
    failed += 1;
    console.log("  FAIL " + name + (detail === undefined ? "" : " — " + detail));
  }
};

const painter = fs.readFileSync(path.join(HERE, "evg-webgl.js"), "utf8").replace(/^export /gm, "");
const { rasterDpr, splitWideRuns, RUN_PIECE_W } = await import(pathToFileURL(path.join(HERE, "evg-webgl.js")).href);

console.log("--- rasterDpr ---");
ok("a run that fits keeps the frame's ratio", rasterDpr(400, 40, 2, 8192) === 2);
const r = rasterDpr(20000, 5400, 2, 8192);
ok("a 5400px tall run is rasterised at most a sixteenth of the atlas tall", 5400 * (r / 2) <= 8192 / 16 + 0.001, String(r));
const r2 = rasterDpr(30000, 100, 1, 8192);
ok("a very wide run at most as wide as an atlas starts", 30000 * r2 <= 2048 + 0.001, String(r2));
ok("an empty run keeps the ratio", rasterDpr(0, 0, 2, 8192) === 2);

console.log("--- splitWideRuns ---");
{
  // 7 device pixels a letter at ratio 2
  const measure = (c, text) => Array.from(text).length * 7;
  const line = '{"$schema": "https://vega.github.io/schema/vega-lite/v5.json", "background": "#fff", '.repeat(8);
  const long = { k: 3, x: 40, y: 10, w: 4000, h: 18, text: line, font: "mono", size: 13, c: [9, 9, 11, 1] };
  const short = { k: 3, x: 0, y: 0, w: 50, h: 18, text: "lyhyt", size: 13, c: [0, 0, 0, 1] };
  const list = [short, long, { ...long, rot: 90 }];
  const out = splitWideRuns(list, 2, measure);
  const pieces = out.filter((c) => c.y === 10 && !c.rot);
  ok("a long line is cut into pieces", pieces.length > 1, String(pieces.length));
  ok("each piece fits a slot", pieces.every((p) => measure(p, p.text) <= RUN_PIECE_W - 8), pieces.map((p) => measure(p, p.text)).join(","));
  ok("the pieces say the whole line", pieces.map((p) => p.text).join("") === line);
  ok("each piece starts where the line before it ends", pieces.every((p, i) => Math.abs(p.x - (40 + measure(p, pieces.slice(0, i).map((q) => q.text).join("")) / 2)) < 0.001));
  ok("a short run is left as it is", out[0] === short);
  ok("a turned run is left whole", out.filter((c) => c.rot).length === 1);
  ok("a list with nothing wide is the same list", splitWideRuns([short], 2, measure).length === 1);
}

// the editor's chrome: many small runs; the slide: a heading at 2020px
const chrome = [];
for (let i = 0; i < 80; i += 1) {
  chrome.push({ k: 3, x: 10 + (i % 8) * 110, y: 10 + Math.floor(i / 8) * 20, w: 100, h: 16, text: "Menu item " + i, font: "", size: 12, c: [9, 9, 11, 1] });
}
const slide = [{ k: 0, x: 0, y: 0, w: W, h: H, c: [255, 255, 255, 1] }];
for (const [i, word] of ["Yksi", "Kaksi", "Kolme", "Neljä"].entries()) {
  slide.push({ k: 3, x: i * 40, y: -1700 + i * 40, w: W, h: 2424, text: word, font: "", size: 2020, c: [9, 9, 11, 1] });
}

// a thumbnail-like list whose one run is wider than any shelf
const wide = [{ k: 3, x: 0, y: 0, w: W, h: 300, text: "IMDB Rating (binned) and population", font: "", size: 212, c: [9, 9, 11, 1] }];

const page0 = `<!doctype html><meta charset="utf-8">
<body style="margin:0;background:#fff"><canvas id="c" width="${W * 2}" height="${H * 2}"></canvas><canvas id="c2" width="${W * 2}" height="80"></canvas>
<script type="module">
${painter}
try {
  const gl = document.getElementById("c").getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
  const draw = (cmds) => {
    const f = prepareDisplayList(gl, { width: ${W}, height: ${H}, list: { cmds } }, { dpr: 2 });
    const st = f.draw(null, null, { clear: false });
    f.dispose();
    return { rebuilt: st.atlasRebuilt, added: st.atlasAdded };
  };
  const stats = [];
  for (let i = 0; i < 3; i += 1) {
    stats.push(draw(${JSON.stringify(chrome)}));
    stats.push(draw(${JSON.stringify(slide)}));
    stats.push(draw(${JSON.stringify(wide)}));
  }
  if (gl.finish) gl.finish();
  const px = new Uint8Array(${W * 2} * ${H * 2} * 4);
  gl.readPixels(0, 0, ${W * 2}, ${H * 2}, gl.RGBA, gl.UNSIGNED_BYTE, px);
  let ink = 0;
  for (let i = 0; i < px.length; i += 4) if (px[i] < 128) ink += 1;
  // A line far wider than a slot, and its first words alone, at 13px: the
  // first 300 pixels of each are equally dark (crisp), not the long one
  // a quarter as dark (rasterised small and stretched).
  const sharp = (cmds) => {
    const g2 = document.getElementById("c2").getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
    const f = prepareDisplayList(g2, { width: ${W}, height: 40, list: { cmds: [{ k: 0, x: 0, y: 0, w: ${W}, h: 40, c: [255, 255, 255, 1] }, ...cmds] } }, { dpr: 2 });
    f.draw(null, null);
    f.dispose();
    const q = new Uint8Array(600 * 80 * 4);
    g2.readPixels(0, 0, 600, 80, g2.RGBA, g2.UNSIGNED_BYTE, q);
    let dark = 0;
    for (let i = 0; i < q.length; i += 4) if (q[i] < 64) dark += 1;
    return dark;
  };
  const line = ${JSON.stringify('{"$schema": "https://vega.github.io/schema/vega-lite/v5.json", "background": "#fff", '.repeat(8))};
  const run = (text) => [{ k: 3, x: 0, y: 10, w: ${W}, h: 18, text, font: "", size: 13, c: [9, 9, 11, 1] }];
  const longDark = sharp(run(line));
  const shortDark = sharp(run(line.slice(0, 60)));
  window.__OUT__ = { stats, ink, longDark, shortDark, maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE) };
} catch (e) { window.__ERR__ = String((e && e.stack) || e); }
window.__DONE__ = true;
</script></body>`;

const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
const tmp = path.join(HERE, ".atlas-budget-check.html");
fs.writeFileSync(tmp, page0);
await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
await page.waitForFunction("window.__DONE__ === true", { timeout: 60000 });
const err = await page.evaluate(() => window.__ERR__ || null);
const out = await page.evaluate(() => window.__OUT__ || null);
await browser.close();
fs.rmSync(tmp, { force: true });

console.log("--- three lists drawn in turn: menus, 2020px headings, a very wide run ---");
ok("the painter ran", !err && out, err || "");
if (out) {
  const st = JSON.stringify(out.stats);
  ok("every heading gets a slot", out.stats[1].added === 4, st);
  ok("after the first round nothing rebuilds the atlas", out.stats.slice(3).every((s) => !s.rebuilt), st);
  ok("and the last round finds every run already there", out.stats.slice(6).every((s) => !s.added), st);
  ok("the heading draws ink", out.ink > W * H * 0.05, out.ink + " dark pixels");
  ok("a 600-letter line is as crisp as its first words alone", out.shortDark > 100 && out.longDark > out.shortDark * 0.85, out.longDark + " vs " + out.shortDark + " dark pixels");
}
console.log(failed ? `\nRESULT FAIL — ${failed}` : "\nALL PASS");
process.exit(failed ? 1 : 0);
