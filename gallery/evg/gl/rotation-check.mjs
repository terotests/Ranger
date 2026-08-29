/**
 * The painter's rotation pivot, checked in a real GPU context.
 *
 *   node gallery/evg/gl/rotation-check.mjs [--write-png out.png]
 *
 * `EVGTimingTest` proves the DISPLAY LIST carries the right origin. It cannot
 * prove the shader turns anything about it — that lives in GLSL, and the only
 * honest way to check GLSL is to run it and look at the pixels.
 *
 * The case that matters is a box AND its text. A text command's quad is sized
 * to the ink, not to the line box it was laid out in, so its own centre is
 * nowhere near the element's. Turn each command about its own centre and the
 * words slide out of the box; turn both about the shared origin and they stay
 * put. Every probe below is a point that is inside the box under one of those
 * rules and outside it under the other.
 *
 * Exit code 0 when every probe reads the colour it should.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { requireDom, findChromium, assertDomInstalled } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BLUE = [37, 99, 235];
const W = 620;
const H = 260;

/**
 * One 160x60 box with a label in it, turned about `origin` — given as a
 * fraction of the box on each axis, so [0.5, 0.5] is the centre and [0, 0] is
 * the top-left corner. What `transform-origin` resolves to, in other words;
 * this file checks the painter, and the resolution itself is checked in
 * `EVGTimingTest` against the browser's own numbers.
 */
function panel(x, y, deg, origin = [0.5, 0.5]) {
  const rot = deg ? { rot: deg, rox: x + 160 * origin[0], roy: y + 60 * origin[1] } : {};
  return [
    { k: 0, x, y, w: 160, h: 60, r: 8, c: [...BLUE, 1], ...rot },
    { k: 3, x: x + 14, y: y + 18, w: 132, h: 24, text: "Rotated", size: 22,
      font: "system-ui", c: [255, 255, 255, 1], ...rot },
  ];
}

const LIST = {
  width: W,
  height: H,
  cmds: [
    ...panel(20, 30, 0),
    ...panel(230, 30, 20),
    ...panel(430, 30, 45),
    // The same 45 degrees about the TOP-LEFT corner rather than the centre.
    // Without a working origin this is indistinguishable from the panel above
    // it, so it is what proves the field is read at all rather than being
    // carried around and ignored.
    ...panel(120, 150, 45, [0, 0]),
  ],
};

// Each probe names a point and what must be there. The centre of a turned box
// is still its centre — that is the whole claim — and the corner of the page
// must stay empty, which is what fails when a rotation is applied about the
// page origin instead.
const PROBES = [
  { at: [100, 60], want: "blue", why: "the unturned box is where it was put" },
  { at: [310, 60], want: "blue", why: "a 20 degree turn keeps its own centre" },
  { at: [510, 60], want: "blue", why: "and so does a 45 degree turn" },
  // "Blank" is ALPHA zero, not white: the canvas clears to transparent and the
  // page's white shows through it. Reading the colour channels here would
  // compare against a background this canvas never painted.
  { at: [5, 250], want: "blank", why: "nothing was flung to the page corner" },
  { at: [610, 250], want: "blank", why: "nor to the other one" },
  // Turned about its top-left corner, the second panel's own corner stays put
  // while the rest of it swings down and right. Its centre therefore is NOT
  // where a centre-pivoted turn would leave it.
  // Just inside the pivoted corner, not on it: the box has an 8px radius and
  // an antialiased edge, so the corner pixel itself is legitimately empty.
  { at: [120, 167], want: "blue", why: "a corner pivot leaves the corner where it was" },
  { at: [120, 210], want: "blue", why: "and the box now hangs below that corner" },
  { at: [190, 180], want: "blank", why: "instead of sitting where a centre pivot would put it" },
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
    await document.fonts.ready;
    window.__stats = renderDisplayList(gl, { list: ${JSON.stringify(LIST)}, width: ${W}, height: ${H} }, { dpr: 1 });
  } catch (e) { window.__ERR__ = String(e && e.stack || e); }
  window.__DONE__ = true;
})();
</script></body>`;

assertDomInstalled();
const { chromium } = requireDom("playwright-core");
// SwiftShader: this has to run on a machine with no GPU, and a check that only
// runs on someone's laptop is not a check.
const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 }, deviceScaleFactor: 2 });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e.message)));

const tmp = path.join(HERE, ".rotation-check.html");
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

  // Where the WORDS ended up in the 45-degree panel, as the centroid of the
  // white ink. This is the probe that actually separates the two pivots.
  //
  // The painter sizes a text quad to the INK, not to the line box the command
  // carries, so "Rotated" sits left of centre in a 160-wide panel and its own
  // centre is about 20px from the element's. Turned about the shared origin
  // that offset swings up and to the left; turned about itself the ink stays
  // put while the box moves out from under it. Twenty pixels of disagreement,
  // in a place a box-centre probe cannot see.
  const ink = await page.evaluate((box) => {
    const c = document.getElementById("c");
    const gl = c.getContext("webgl2");
    const buf = new Uint8Array(c.width * c.height * 4);
    gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    let sx = 0, sy = 0, n = 0;
    for (let y = 0; y < c.height; y++) {
      for (let x = box[0]; x < box[1]; x++) {
        const i = (((c.height - 1 - y) * c.width) + x) * 4;
        // White and opaque: the glyphs. The panel behind them is strong blue,
        // so the two do not blur into each other at any antialiased edge.
        if (buf[i + 3] > 200 && buf[i] > 200 && buf[i + 1] > 200 && buf[i + 2] > 200) {
          sx += x; sy += y; n += 1;
        }
      }
    }
    return n ? { x: sx / n, y: sy / n, n } : null;
  }, [380, 620]);

  let failed = 0;
  console.log("EVG WebGL painter — rotation about a named origin\n");
  for (let i = 0; i < PROBES.length; i++) {
    const p = PROBES[i];
    const got = read[i];
    // Antialiasing makes an exact match the wrong test; "which of the two
    // colours is this nearer" is the question actually being asked.
    const near = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 60;
    const ok = p.want === "blue" ? (got[3] > 200 && near(got, BLUE)) : got[3] < 20;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"} ${p.why} — (${p.at}) is rgba(${got})`);
  }
  if (!ink) {
    failed += 1;
    console.log("  FAIL no white ink found in the turned panel at all");
  } else {
    // Expected under the shared pivot. Derived from the geometry, not from a
    // previous run: the ink's own centre offset from the element centre,
    // swung 45 degrees about that centre.
    const okX = Math.abs(ink.x - 495) < 6;
    const okY = Math.abs(ink.y - 45) < 6;
    if (!okX || !okY) failed += 1;
    console.log(
      `  ${okX && okY ? "PASS" : "FAIL"} the words were carried round the ELEMENT centre, ` +
        `not spun about their own — ink at (${ink.x.toFixed(1)}, ${ink.y.toFixed(1)}), ` +
        `expected near (495, 45); spun in place would be near (489, 60)`,
    );
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
    console.log("RESULT OK");
  }
} finally {
  await browser.close();
  fs.rmSync(tmp, { force: true });
}
