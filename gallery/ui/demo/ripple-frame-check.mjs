#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The surface effect must not eat the page it is drawn over.
//
//   node gallery/ui/demo/ripple-frame-check.mjs
//
// WHY THIS EXISTS. `evg-surface-effect: ripple` renders the whole frame into a
// texture and puts it back on the screen through a shader. Making that texture
// left it bound to texture unit 0 — the unit the glyph atlas lives on — so the
// first rippling frame drew every letter, card and image while SAMPLING THE
// SURFACE IT WAS DRAWING INTO. The spec calls that undefined; this driver
// dropped the draws. The page came back with its chart and its icons on it and
// nothing else: no text, no cards, no buttons.
//
// Every check that existed passed on that frame. The effect was declared, the
// touch became its origin, the age advanced, the renderer reported taking the
// post-pass — all true, and all true of a blank page. Nothing was looking at
// the pixels.
//
// It also hid in the one place a person would look. The target is made once
// and reused, so only the FIRST rippling frame after it is made is wrong; on
// the live page that frame is gone in a few milliseconds and every frame after
// it is right. The single-frame render harness draws exactly that frame and
// nothing else, which is why the check lives here.
//
// So: render the dashboard twice, once at rest and once with a drop on it, and
// compare how much of the canvas each frame actually painted. A ratio rather
// than a number, so it calibrates itself against whatever the page happens to
// say today.
//
// Opacity, and not darkness: the first version of this counted dark pixels and
// PASSED on the broken frame. A page whose draws were dropped is transparent,
// the white behind it looks like a white page, and the chart that did survive
// carried enough dark pixels to clear any threshold worth setting. What is
// missing from such a frame is not ink, it is coverage.
//
// AND WHERE THE RING LANDS, for a second failure of the same family. `vUV`
// comes off the fullscreen triangle as a GL texture coordinate, whose origin
// is the BOTTOM left; a drop's y is a page coordinate, whose origin is the
// top. The shader read one as the other, so every ring appeared at the page's
// height MINUS where it was touched — click near the top of the dashboard and
// it rippled near the bottom. Every existing check still passed: the drop was
// recorded at the right place, and it is the SHADER that put it somewhere
// else. Only a picture can tell you that.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { requireDom, findChromium } from "../conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

// The renderer's own report, off the finished frame: `covered` is how many
// pixels the frame actually painted and `rippled` is whether the second pass
// ran.
const render = (env) => {
  const out = execFileSync("node", [path.join(HERE, "render.mjs"),
    path.join(ROOT, "tmp", "ripple_frame_check.png")], {
    cwd: ROOT,
    env: { ...process.env, DEMO: "dashboard", ...env },
    encoding: "utf8",
  });
  const line = out.split("\n").find((l) => l.startsWith("painted:"));
  if (!line) throw new Error("the render harness printed no stats:\n" + out);
  return JSON.parse(line.slice("painted:".length));
};

console.log("--- a rippling frame is still the page ---");

const calm = render({});
ok("the page at rest takes no post-pass", calm.rippled === 0, JSON.stringify(calm.rippled));
// The dashboard paints its own background, so a whole frame of it is opaque.
// That is what makes the ratio below mean anything.
ok("and covers the canvas", calm.covered === calm.pixels,
  `${calm.covered} of ${calm.pixels}`);

const rippled = render({ DASH_RIPPLE: "640,400,0.32" });
ok("a drop makes the frame take the post-pass", rippled.rippled === 1,
  JSON.stringify(rippled.rippled));

// A ripple pushes pixels around and can pull a few in from the edges, so the
// count is allowed to move; what it may not do is fall off a cliff. With the
// binding in the wrong order this read 573,298 against 4,809,600 — one pixel
// in eight — because the page came back transparent everywhere its dropped
// draws should have been.
ok("and the page is still on it", rippled.covered > calm.covered * 0.7,
  `${rippled.covered} of ${calm.covered}`);

// The same frame, drawn the same way, minus the effect: everything a display
// list asks for has to come out either way.
ok("with everything the list asked for still drawn",
  rippled.drawn === calm.drawn && rippled.textRuns === calm.textRuns &&
    rippled.paths === calm.paths && rippled.skippedFills === 0,
  `${rippled.drawn}/${rippled.textRuns}/${rippled.paths} vs ` +
    `${calm.drawn}/${calm.textRuns}/${calm.paths}`);

console.log("--- and it ripples where it was touched ---");

// TWO RIPPLED FRAMES, not a rippled one against a calm one. The post-pass
// target is not multisampled while the canvas is, so a rippled frame differs
// from a calm one along every diagonal edge on the page and the chart's zigzag
// swamps the ring. Both of these go through the pass, so that cancels and what
// is left is the two rings.
//
// The two heights are DIFFERENT distances from the middle on purpose. A
// symmetric pair — say 150 and 750 — is the one pair an inverted axis maps
// onto itself, so it would pass either way.
const A_Y = 150, B_Y = 400, DROP_X = 640, PAGE_H = 900, PAGE_W = 1336;

const require = createRequire(import.meta.url);
const Demo = require(path.join(ROOT, "gallery/ui/bin/DashboardDemo.cjs"));
const css = fs.readFileSync(path.join(HERE, "dashboard.css"), "utf8");
const listAt = (y) => {
  const d = new Demo.DashboardDemo();
  d.init(css);
  d.ripple(DROP_X, y);
  d.tick(320);
  return JSON.parse(d.displayListJson());
};

const probeHtml = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;background:#fff}canvas{display:block}</style>
<canvas id="c"></canvas>
<script type="module">
import { renderDisplayList } from "/gallery/evg/gl/evg-webgl.js";
const A = ${JSON.stringify({ width: PAGE_W, height: PAGE_H, list: listAt(A_Y) })};
const B = ${JSON.stringify({ width: PAGE_W, height: PAGE_H, list: listAt(B_Y) })};
const c = document.getElementById("c");
c.style.width = A.width + "px"; c.style.height = A.height + "px";
c.width = A.width; c.height = A.height;
const gl = c.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true, preserveDrawingBuffer: true });
await document.fonts.ready;
const grab = () => {
  const px = new Uint8Array(c.width * c.height * 4);
  gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
  return px;
};
renderDisplayList(gl, A, { dpr: 1 });
const a = grab();
renderDisplayList(gl, B, { dpr: 1 });
const b = grab();
// Weighted by how much each pixel changed, and in PAGE rows: readPixels counts
// from the bottom, which is the very confusion under test.
let sy = 0, wsum = 0, below = 0;
for (let i = 0; i < a.length; i += 4) {
  const d = Math.abs(a[i] - b[i]) + Math.abs(a[i+1] - b[i+1]) + Math.abs(a[i+2] - b[i+2]);
  if (d <= 8) continue;
  const pageY = c.height - 1 - Math.floor((i / 4) / c.width);
  sy += pageY * d; wsum += d;
  if (pageY > 550) below += d;
}
window.__probe = { cy: wsum ? sy / wsum : -1, belowShare: wsum ? below / wsum : -1, wsum };
window.__done = true;
</script>`;

fs.mkdirSync(path.join(ROOT, "tmp"), { recursive: true });
const probeFile = path.join(ROOT, "tmp", "ripple_where.html");
fs.writeFileSync(probeFile, probeHtml);

const server = createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = rel === "/" ? probeFile : path.join(ROOT, rel.slice(1));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404).end("not found"); return; }
  res.writeHead(200, { "content-type": file.endsWith(".js") ? "text/javascript" : "text/html" })
    .end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, r));

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: PAGE_W + 40, height: PAGE_H + 40 } });
page.on("pageerror", (e) => { failed++; console.log("  FAIL uncaught in the probe — " + e.message.split("\n")[0]); });
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.waitForFunction("window.__done === true", null, { timeout: 30000 });
const probe = await page.evaluate(() => window.__probe);
await browser.close();
server.close();

ok("the two drops changed something", probe.wsum > 0, String(probe.wsum));

// Rings at 150 and 400 put the weighted centre at about 275. Inverted they sit
// at 750 and 500 and it is about 625, so anything under 400 can only be the
// right way up.
ok("the rings are where the page was touched, not mirrored",
  probe.cy > 0 && probe.cy < 400, `weighted centre of change at page y=${probe.cy.toFixed(1)}`);

// The lower reach of a ring centred at 400 is about 495; mirrored, most of the
// change would be past 650.
ok("and nothing ripples in the half nobody touched",
  probe.belowShare >= 0 && probe.belowShare < 0.1,
  `${(probe.belowShare * 100).toFixed(1)}% of the change is below y=550`);

console.log("");
if (failed > 0) { console.log(`RESULT FAIL — ${failed} problem(s)`); process.exit(1); }
console.log("RESULT OK — the ripple draws over the page, where it was touched");
