#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// Text that does not stand out from the picture under it gets a halo.
//
//   node lib/evg/gl/contrast-check.mjs
//
// With `contrastGuard: true` the painter composites what is under each run
// (pictures and fills drawn before it) and, when the run falls short of the
// WCAG ratio (4.5:1, 3:1 for large text), draws a thin outline in black or
// white under its glyphs. Checked here on a picture that is near-white on
// top and dark at the bottom:
//
//   - white text on the white half gets a dark halo (frame stats and pixels)
//   - small dark text on the dark half is drawn in a colour that reads
//     instead (an outline only fills small letters in); with
//     `contrastRepair: false` it is listed and drawn as it is
//   - white text on the dark half gets none
//   - dark text on the dark half gets a light halo
//   - white text on a plain light fill gets one too, and is listed in
//     stats.lowContrast; on a dark fill it gets none
//   - text on a vector shape is not judged (its box is not its ink), nor is
//     a run with no letter or digit (a bullet)
//   - translucent text is judged by its colour blended over the backdrop
//   - the same scene with the guard off draws no halo
//
// Exit code 0 when every case holds.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { findChromium } from "../../../gallery/ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = 400;
const H = 200;

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else {
    failed += 1;
    console.log("  FAIL " + name + (detail === undefined ? "" : " — " + detail));
  }
};

const WHITE = [255, 255, 255, 1];
const INK = [20, 24, 32, 1];
const picture = { k: 2, x: 0, y: 0, w: W, h: H, src: "sky" };
const run = (y, c, text = "Budjetti ja puskuri", size = 40) =>
  ({ k: 3, x: 20, y, w: 300, h: size * 1.25, text, font: "", size, weight: 700, c });

const relativeLuminance = (r, g, b) => {
  const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
const contrastRatio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const painter = fs.readFileSync(path.join(HERE, "evg-webgl.js"), "utf8").replace(/^export /gm, "");

// The picture is made in the page: the top half near-white, the bottom half
// a dark green, like a sky of cloud over a line of trees.
const pageFor = (cmds, guard, repair = true) => `<!doctype html><meta charset="utf-8">
<body style="margin:0;background:#fff"><canvas id="c" width="${W}" height="${H}"></canvas>
<script type="module">
${painter}
try {
  const pc = document.createElement("canvas");
  pc.width = 64; pc.height = 64;
  const px = pc.getContext("2d");
  px.fillStyle = "#f4f6f8"; px.fillRect(0, 0, 64, 32);
  px.fillStyle = "#1c3a24"; px.fillRect(0, 32, 64, 32);
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = pc.toDataURL(); });
  const gl = document.getElementById("c").getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
  const doc = { width: ${W}, height: ${H}, list: { cmds: ${JSON.stringify(cmds)} } };
  const frame = prepareDisplayList(gl, doc, { dpr: 1, images: new Map([["sky", img]]), contrastGuard: ${guard}, contrastRepair: ${repair} });
  window.__STATS__ = frame.draw(null, null);
  if (gl.finish) gl.finish();
  const out = new Uint8Array(${W} * ${H} * 4);
  gl.readPixels(0, 0, ${W}, ${H}, gl.RGBA, gl.UNSIGNED_BYTE, out);
  window.__PX__ = Array.from(out);
  window.__DONE__ = true;
} catch (e) { window.__ERR__ = String((e && e.stack) || e); window.__DONE__ = true; }
</script></body>`;

const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 } });
const tmp = path.join(HERE, ".contrast-check.html");
let loadSeq = 0;

/** Stats and the darkest / lightest pixel in a band of rows (top-down). */
async function render(cmds, guard, repair = true) {
  fs.writeFileSync(tmp, pageFor(cmds, guard, repair));
  loadSeq += 1;
  await page.goto(pathToFileURL(tmp).href + "?n=" + loadSeq, { waitUntil: "load" });
  await page.waitForFunction("window.__DONE__ === true", { timeout: 30000 });
  const err = await page.evaluate(() => window.__ERR__ || null);
  if (err) throw new Error("painter threw: " + err);
  const stats = await page.evaluate(() => window.__STATS__);
  const px = await page.evaluate(() => window.__PX__);
  const band = (y0, y1) => {
    let min = 255, max = 0;
    for (let y = y0; y < y1; y++) {
      const row = H - 1 - y; // GL rows run bottom up
      for (let x = 0; x < W; x++) {
        const i = (row * W + x) * 4;
        const l = (px[i] + px[i + 1] + px[i + 2]) / 3;
        if (l < min) min = l;
        if (l > max) max = l;
      }
    }
    return { min, max };
  };
  return { stats, band };
}

try {
  console.log("white text on the white half");
  {
    const { stats, band } = await render([picture, run(20, WHITE)], true);
    ok("one halo", stats.contrastHalos === 1, "contrastHalos = " + stats.contrastHalos);
    const b = band(15, 70);
    ok("dark pixels around the letters", b.min < 120, "darkest = " + b.min.toFixed(0));
  }
  console.log("guard off");
  {
    const { stats, band } = await render([picture, run(20, WHITE)], false);
    ok("no halo", stats.contrastHalos === 0, "contrastHalos = " + stats.contrastHalos);
    const b = band(15, 70);
    ok("nothing dark on the white half", b.min > 200, "darkest = " + b.min.toFixed(0));
  }
  console.log("white text on the dark half");
  {
    const { stats } = await render([picture, run(130, WHITE)], true);
    ok("no halo", stats.contrastHalos === 0, "contrastHalos = " + stats.contrastHalos);
  }
  console.log("dark text on the dark half");
  {
    const { stats, band } = await render([picture, run(130, INK)], true);
    ok("one halo", stats.contrastHalos === 1, "contrastHalos = " + stats.contrastHalos);
    const b = band(125, 180);
    ok("light pixels around the letters", b.max > 150, "lightest = " + b.max.toFixed(0));
  }
  console.log("a dark scrim over the picture");
  {
    const scrim = { k: 0, x: 0, y: 0, w: W, h: H, c: [0, 0, 0, 0.7] };
    const { stats } = await render([picture, scrim, run(20, WHITE)], true);
    ok("no halo", stats.contrastHalos === 0, "contrastHalos = " + stats.contrastHalos);
  }
  console.log("white text on a light fill, no picture");
  {
    const fill = { k: 0, x: 0, y: 0, w: W, h: H, c: [240, 242, 245, 1] };
    const { stats } = await render([fill, run(20, WHITE)], true);
    ok("one halo", stats.contrastHalos === 1, "contrastHalos = " + stats.contrastHalos);
    const lc = stats.lowContrast || [];
    ok("listed as low contrast with its ratio",
      lc.length === 1 && lc[0].text === "Budjetti ja puskuri" && lc[0].ratio < 1.2 && lc[0].need === 3,
      JSON.stringify(lc));
  }
  console.log("small dark text on the dark half");
  {
    const { stats, band } = await render([picture, run(130, INK, "Bucket 0 (ajallaan)", 16)], true);
    ok("recoloured, not outlined", stats.contrastRecolored === 1 && stats.contrastHalos === 0,
      "recolored = " + stats.contrastRecolored + ", halos = " + stats.contrastHalos);
    const lc = (stats.lowContrast || [])[0] || {};
    const to = lc.to || [0, 0, 0];
    const lbg = relativeLuminance(0x1c, 0x3a, 0x24);
    ok("listed as fixed by colour, and the new colour reads",
      lc.fixed === "colour" && contrastRatio(relativeLuminance(to[0], to[1], to[2]), lbg) >= 4.5, JSON.stringify(lc));
    const b = band(128, 152);
    ok("light letters on the dark half", b.max > 150, "lightest = " + b.max.toFixed(0));
  }
  console.log("small dark text on the dark half, repair off");
  {
    const { stats, band } = await render([picture, run(130, INK, "Bucket 0 (ajallaan)", 16)], true, false);
    ok("listed, drawn as it is", stats.contrastRecolored === 0 && stats.contrastHalos === 0 && (stats.lowContrast || []).length === 1,
      JSON.stringify(stats.lowContrast));
    const b = band(128, 152);
    ok("no light letters", b.max < 120, "lightest = " + b.max.toFixed(0));
  }
  console.log("a bullet on a light fill");
  {
    const fill = { k: 0, x: 0, y: 0, w: W, h: H, c: [240, 242, 245, 1] };
    const { stats } = await render([fill, run(20, WHITE, "\u2022")], true);
    ok("not judged", stats.contrastHalos === 0 && !(stats.lowContrast || []).length,
      "contrastHalos = " + stats.contrastHalos);
  }
  console.log("half-transparent light text on a dark fill");
  {
    const fill = { k: 0, x: 0, y: 0, w: W, h: H, c: [20, 24, 40, 1] };
    const { stats } = await render([fill, run(20, [200, 200, 210, 0.25])], true);
    ok("judged by the blended colour", stats.contrastHalos === 1, "contrastHalos = " + stats.contrastHalos);
  }
  console.log("white text on a dark fill, no picture");
  {
    const fill = { k: 0, x: 0, y: 0, w: W, h: H, c: [20, 24, 40, 1] };
    const { stats } = await render([fill, run(20, WHITE)], true);
    ok("no halo", stats.contrastHalos === 0, "contrastHalos = " + stats.contrastHalos);
  }
  console.log("white text on a vector shape over a light fill");
  {
    const fill = { k: 0, x: 0, y: 0, w: W, h: H, c: [240, 242, 245, 1] };
    const shape = { k: 6, c: [20, 24, 40, 1], pts: [0, 0, 400, 0, 400, 100, 0, 100], ends: [8] };
    const { stats } = await render([fill, shape, run(20, WHITE)], true);
    ok("not judged", stats.contrastHalos === 0, "contrastHalos = " + stats.contrastHalos);
  }
} finally {
  await browser.close();
  fs.rmSync(tmp, { force: true });
}

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
