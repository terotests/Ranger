/**
 * One corner as large as the whole side, checked in a real GPU context.
 *
 *   node lib/evg/gl/corner-check.mjs [--write-png out.png]
 *
 * CSS lets a corner take the whole side when its neighbours on that side are
 * zero: `border-radius: 30px 0 0 0` on a 30x30 box is a quarter disc. The
 * shader used to clamp every corner to HALF the box, so that quarter disc came
 * out as a square with a 15px corner, and its tip stuck out past the round
 * shape it was meant to sit under. That is the colour picker's swatch: a
 * two-square checkerboard (top-left and bottom-right quarters) under a round
 * fill, with grey square tips showing at two corners of the circle.
 *
 * Every probe below is a point the clamped shader paints and CSS does not, or
 * the other way round, plus a uniform-radius box that must not change.
 *
 * Exit code 0 when every probe reads the colour it should.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { requireDom, findChromium, assertDomInstalled } from "../../../gallery/ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GREY = [212, 212, 216];
const CYAN = [165, 243, 252];
const W = 320;
const H = 120;

// The colour picker's swatch at twice its size: a 60x60 circle over two grey
// quarters whose outer corners follow it.
const S = { x: 20, y: 20 };
const LIST = {
  width: W,
  height: H,
  cmds: [
    { k: 0, x: S.x, y: S.y, w: 30, h: 30, r: 30, rc: [30, 0, 0, 0], c: [...GREY, 1] },
    { k: 0, x: S.x + 30, y: S.y + 30, w: 30, h: 30, r: 0, rc: [0, 0, 30, 0], c: [...GREY, 1] },
    { k: 0, x: S.x, y: S.y, w: 60, h: 60, r: 30, c: [...CYAN, 0.6] },
    // A wide box with one corner as tall as the box: 40 + 0 on the left side
    // is exactly the side, so CSS leaves it at 40.
    { k: 0, x: 120, y: 30, w: 100, h: 40, r: 40, rc: [40, 0, 0, 0], c: [...GREY, 1] },
    // A plain rounded box: the common case, which must not move.
    { k: 0, x: 240, y: 30, w: 60, h: 60, r: 12, c: [...GREY, 1] },
  ],
};

const PROBES = [
  // Outside the circle, inside a corner clamped to half the box.
  { at: [S.x + 5, S.y + 5], want: "blank", why: "the top-left quarter does not poke out of the circle" },
  { at: [S.x + 55, S.y + 55], want: "blank", why: "nor does the bottom-right one" },
  { at: [S.x + 8, S.y + 4], want: "blank", why: "nor along the top edge" },
  { at: [S.x + 15, S.y + 20], want: "tinted", why: "the quarter still fills the circle's top-left" },
  { at: [S.x + 45, S.y + 40], want: "tinted", why: "and its bottom-right" },
  { at: [125, 40], want: "blank", why: "a 40px corner on a 40px-tall box is a quarter circle" },
  { at: [130, 60], want: "grey", why: "whose inside is still painted" },
  { at: [215, 65], want: "grey", why: "and the square corners stay square" },
  { at: [241, 31], want: "blank", why: "a uniform 12px corner is cut as before" },
  { at: [245, 35], want: "grey", why: "and filled just inside it" },
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
    window.__stats = renderDisplayList(gl, { list: ${JSON.stringify(LIST)}, width: ${W}, height: ${H} }, { dpr: 1 });
  } catch (e) { window.__ERR__ = String(e && e.stack || e); }
  window.__DONE__ = true;
})();
</script></body>`;

assertDomInstalled();
const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 }, deviceScaleFactor: 2 });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e.message)));

const tmp = path.join(HERE, ".corner-check.html");
fs.writeFileSync(tmp, PAGE);
try {
  await page.goto(pathToFileURL(tmp).href);
  await page.waitForFunction("window.__DONE__ === true", { timeout: 30000 });
  const err = await page.evaluate(() => window.__ERR__ || null);
  if (err) throw new Error("painter threw: " + err);

  const write = process.argv.indexOf("--write-png");
  if (write > -1 && process.argv[write + 1]) {
    await page.locator("#c").screenshot({ path: process.argv[write + 1] });
  }

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
  console.log("EVG WebGL painter — a corner as large as its side\n");
  const near = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 40;
  for (let i = 0; i < PROBES.length; i++) {
    const p = PROBES[i];
    const got = read[i];
    // "Tinted": the translucent cyan over grey, so opaque and neither pure.
    const ok = p.want === "grey" ? (got[3] > 200 && near(got, GREY))
      : p.want === "tinted" ? (got[3] > 200 && !near(got, GREY) && !near(got, CYAN))
      : got[3] < 20;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"} ${p.why} — (${p.at}) is rgba(${got})`);
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
