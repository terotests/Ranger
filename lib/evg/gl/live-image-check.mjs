/**
 * A canvas the host draws into every frame, shown as a picture, checked in a
 * real GPU context.
 *
 *   node lib/evg/gl/live-image-check.mjs
 *
 * The painter keeps one texture per image source and does not upload a
 * source it has seen again, so a canvas that changes in place (a 3-D view on
 * a slide) would show its first frame for ever. `imageChanged(gl, src)` says
 * the pixels changed: the next draw uploads them into the same texture.
 * Drawn red, then painted blue without telling: still red (the cache holds);
 * told: blue, and no new texture was made for it.
 *
 * Exit code 0 when every probe reads the colour it should.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { requireHostTool, findChromium } from "../../../gallery/ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = 160;
const H = 100;
const LIST = { width: W, height: H, cmds: [{ k: 2, x: 20, y: 20, w: 120, h: 60, src: "live" }] };

const painter = fs.readFileSync(path.join(HERE, "evg-webgl.js"), "utf8").replace(/^export /gm, "");

const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff">
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
${painter}
(() => {
  try {
    const c = document.getElementById("c");
    const gl = c.getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
    const src = document.createElement("canvas");
    src.width = 64;
    src.height = 32;
    const g = src.getContext("2d");
    const images = new Map([["live", src]]);
    const doc = { list: ${JSON.stringify(LIST)}, width: ${W}, height: ${H} };
    const probe = () => {
      const px = new Uint8Array(4);
      gl.readPixels(80, c.height - 50, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return [...px];
    };
    const out = {};
    g.fillStyle = "rgb(220, 40, 60)";
    g.fillRect(0, 0, 64, 32);
    renderDisplayList(gl, doc, { dpr: 1, images });
    out.first = probe();
    out.unknown = imageChanged(gl, "nothing");
    g.fillStyle = "rgb(30, 80, 230)";
    g.fillRect(0, 0, 64, 32);
    renderDisplayList(gl, doc, { dpr: 1, images });
    out.untold = probe();
    const tex = IMAGE_TEXTURES.get(gl).get("live").tex;
    out.told = imageChanged(gl, "live");
    renderDisplayList(gl, doc, { dpr: 1, images });
    out.after = probe();
    out.sameTexture = IMAGE_TEXTURES.get(gl).get("live").tex === tex;
    renderDisplayList(gl, doc, { dpr: 1, images });
    out.uploadedAgain = IMAGE_TEXTURES.get(gl).uploaded;
    out.glError = gl.getError();
    window.__OUT__ = out;
  } catch (e) { window.__ERR__ = String(e && e.stack || e); }
  window.__DONE__ = true;
})();
</script></body>`;

const { chromium } = requireHostTool("playwright-core");
const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e.message)));

const tmp = path.join(HERE, ".live-image-check.html");
fs.writeFileSync(tmp, PAGE);
try {
  await page.goto(pathToFileURL(tmp).href);
  await page.waitForFunction("window.__DONE__ === true", { timeout: 60000 });
  const err = await page.evaluate(() => window.__ERR__ || null);
  if (err) throw new Error("painter threw: " + err);
  const o = await page.evaluate(() => window.__OUT__);
  const near = (px, rgb) => px[3] > 200 && Math.abs(px[0] - rgb[0]) + Math.abs(px[1] - rgb[1]) + Math.abs(px[2] - rgb[2]) < 40;
  const checks = [
    [near(o.first, [220, 40, 60]), `the first frame is drawn — rgba(${o.first})`],
    [o.unknown === false, "a source with no texture yet is not marked"],
    [near(o.untold, [220, 40, 60]), `painted over but not told: the kept texture — rgba(${o.untold})`],
    [o.told === true, "imageChanged marks a source it knows"],
    [near(o.after, [30, 80, 230]), `told: the new pixels — rgba(${o.after})`],
    [o.sameTexture, "into the texture it already had"],
    [o.uploadedAgain === 0, "and not again on the draw after"],
    [o.glError === 0, `no GL error — ${o.glError}`],
  ];
  let failed = 0;
  console.log("EVG WebGL painter — a live image source\n");
  for (const [ok, why] of checks) {
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"} ${why}`);
  }
  if (pageErrors.length) {
    failed += 1;
    for (const e of pageErrors) console.log("  FAIL page error: " + e);
  }
  console.log("");
  if (failed) {
    console.log(`RESULT FAIL — ${failed}`);
    process.exitCode = 1;
  } else {
    console.log("RESULT PASS");
  }
} finally {
  fs.rmSync(tmp, { force: true });
  await browser.close();
}
