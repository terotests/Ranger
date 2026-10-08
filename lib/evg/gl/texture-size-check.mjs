/**
 * A picture larger than the card's MAX_TEXTURE_SIZE, checked in a real GPU
 * context.
 *
 *   node lib/evg/gl/texture-size-check.mjs [--write-png out.png]
 *
 * `texImage2D` refuses a source with a side past MAX_TEXTURE_SIZE
 * (INVALID_VALUE), and the image quad then samples an empty texture: a black
 * box where a large photo or screenshot pasted into a slide should be. The
 * painter draws such a source down to the largest size the card takes before
 * uploading it. The probes read the picture's colour, not black, in the
 * middle of its box and near both ends.
 *
 * Exit code 0 when every probe reads the colour it should.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { requireHostTool, findChromium } from "../../../gallery/ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = 320;
const H = 120;
const LIST = {
  width: W,
  height: H,
  cmds: [
    { k: 2, x: 20, y: 20, w: 280, h: 80, src: "big.png" },
  ],
};
const PROBES = [
  { at: [160, 60], why: "the middle of the picture is drawn" },
  { at: [30, 30], why: "and its left end" },
  { at: [290, 90], why: "and its right end" },
];

const painter = fs.readFileSync(path.join(HERE, "evg-webgl.js"), "utf8").replace(/^export /gm, "");

const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff">
<canvas id="c" width="${W}" height="${H}" style="width:${W}px;height:${H}px"></canvas>
<script>
${painter}
(async () => {
  try {
    const c = document.getElementById("c");
    const gl = c.getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
    const max = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    // wider than the card takes, in the list's aspect
    const src = document.createElement("canvas");
    src.width = max + 1024;
    src.height = Math.round(src.width * 80 / 280);
    const g = src.getContext("2d");
    g.fillStyle = "rgb(220, 40, 60)";
    g.fillRect(0, 0, src.width, src.height);
    const blob = await new Promise((r) => src.toBlob(r, "image/png"));
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    await img.decode();
    window.__size = [max, img.naturalWidth, img.naturalHeight];
    const images = new Map([["big.png", img]]);
    window.__stats = renderDisplayList(gl, { list: ${JSON.stringify(LIST)}, width: ${W}, height: ${H} }, { dpr: 1, images });
    window.__glError = gl.getError();
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

const tmp = path.join(HERE, ".texture-size-check.html");
fs.writeFileSync(tmp, PAGE);
try {
  await page.goto(pathToFileURL(tmp).href);
  await page.waitForFunction("window.__DONE__ === true", { timeout: 60000 });
  const err = await page.evaluate(() => window.__ERR__ || null);
  if (err) throw new Error("painter threw: " + err);

  const write = process.argv.indexOf("--write-png");
  if (write > -1 && process.argv[write + 1]) {
    await page.locator("#c").screenshot({ path: process.argv[write + 1] });
  }

  const [size, glError] = await page.evaluate(() => [window.__size, window.__glError]);
  const read = await page.evaluate((probes) => {
    const c = document.getElementById("c");
    const gl = c.getContext("webgl2");
    const px = new Uint8Array(4);
    return probes.map(([x, y]) => {
      // WebGL reads from the bottom left; the display list is y-down.
      gl.readPixels(x, c.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return [px[0], px[1], px[2], px[3]];
    });
  }, PROBES.map((p) => p.at));

  let failed = 0;
  console.log(`EVG WebGL painter — a ${size[1]}x${size[2]} picture on a card that takes ${size[0]}\n`);
  for (let i = 0; i < PROBES.length; i++) {
    const p = PROBES[i];
    const got = read[i];
    const ok = got[3] > 200 && Math.abs(got[0] - 220) + Math.abs(got[1] - 40) + Math.abs(got[2] - 60) < 40;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"} ${p.why} — (${p.at}) is rgba(${got})`);
  }
  const glOk = glError === 0;
  if (!glOk) failed += 1;
  console.log(`  ${glOk ? "PASS" : "FAIL"} no GL error after the upload — ${glError}`);
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
