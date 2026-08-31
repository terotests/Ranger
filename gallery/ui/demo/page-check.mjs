#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Load the demo page in a real browser and walk every demo.
//
//   node gallery/ui/demo/page-check.mjs
//
// WHY THIS EXISTS. `mod.EVGReconcile is not a constructor`, reported from a
// browser console. `keptTree` builds three of the demos and asks the compiled
// module for the classes it needs — the same module the elements come from,
// because two copies of a class are two classes — and `MenubarDemo.rgr` has
// never imported `EVGReconcile.rgr`. So that line threw the day it was
// written, and kept throwing for as long as the page has existed.
//
// Nothing caught it because nothing RAN the page. `ui:demo:build` bundles it,
// which proves esbuild can resolve the imports and nothing more; the checks
// beside this one drive the demo classes in Node and never touch main.js; and
// the a11y audit mirrors trees into a DOM without loading the page that draws
// them. A bundle that builds is not a page that works.
//
// So: serve the repo, load index.html, and fail on any uncaught exception or
// console error — then click through all thirteen demos, because a page that
// starts is not a page whose every tab starts.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { requireDom, findChromium } from "../conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");

if (!fs.existsSync(path.join(HERE, "bundle.js"))) {
  console.error("bundle.js missing — run `node gallery/ui/demo/build.mjs` first");
  process.exit(3);
}

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".svg": "image/svg+xml", ".woff2": "font/woff2",
};
const server = createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.join(ROOT, rel.slice(1));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" })
    .end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });

const problems = [];
page.on("pageerror", (e) => problems.push(`uncaught: ${e.message.split("\n")[0]}`));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console.error: ${m.text().split("\n")[0]}`);
});
page.on("requestfailed", (r) => problems.push(`request failed: ${r.url().replace(/^http:\/\/[^/]+/, "")}`));

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

console.log("--- the page loads ---");
// The SAME url a person opens. Serving index.html at "/" instead would make
// its relative `bundle.js` resolve to the repo root, which is not where it is
// — the check would then be testing a page nobody loads.
await page.goto(`http://127.0.0.1:${port}/gallery/ui/demo/index.html`, { waitUntil: "networkidle" });
// The stage only gets a canvas once main.js has run far enough to paint.
await page.waitForFunction("document.querySelector('#stage canvas') !== null", null, { timeout: 15000 })
  .catch(() => {});
ok("no error on first paint", problems.length === 0, [...new Set(problems)].join("; "));
// SIZED BY THE SCRIPT, not the 300x150 a canvas element is born with — that
// default is bigger than zero and would have passed while the bundle 404'd.
const painted = await page.evaluate(() => {
  const c = document.querySelector("#stage canvas");
  return c ? c.width : 0;
});
ok("and the canvas was sized by the page", painted > 600, "canvas width " + painted);

console.log("--- every demo ---");
// The switcher is a set of radios built by `radios(...)` into #demos; clicking
// each label is what a person does, and it is what exercises each demo's own
// first frame.
const names = await page.evaluate(() =>
  [...document.querySelectorAll("#demos input[type=radio]")].map((r) => r.value));
ok("the switcher offers all thirteen", names.length === 13, names.join(","));
for (const n of names) {
  problems.length = 0;
  await page.click(`#demos input[value="${n}"]`);
  await page.waitForTimeout(250);
  const drew = await page.evaluate(() => {
    const c = document.querySelector("#stage canvas");
    return c ? c.width : 0;
  });
  ok(`${n}: draws without an error`, problems.length === 0 && drew > 600,
    [...new Set(problems)].join("; ") || "canvas width " + drew);
}

console.log("--- the keyboard reaches the demo ---");
{
  // Reported: the Profile page's inputs did not respond to the keyboard. They
  // worked in Node — press then keyWith inserts — and the page dropped every
  // key, because the keydown handler bailed on any `HTMLInputElement` and the
  // only inputs here are the sidebar's own radios. Choosing a demo left focus
  // on the radio that chose it. So the check is end to end: click the field
  // the way a person does, type, and look at what the page drew.
  await page.click('#demos input[value="profile"]');
  await page.waitForTimeout(250);
  const rect = await page.evaluate(() => {
    const el = document.querySelector('[data-a11y-id="pf-name"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  ok("the Full Name field is on the page", !!rect);
  const drawn = () => page.evaluate(() => {
    const l = JSON.parse(window.__lastList || "{}");
    return (l.cmds || []).filter((c) => c.text).map((c) => c.text).find((t) => t.startsWith("Noa"));
  });
  const before = await drawn();
  await page.mouse.click(rect.x, rect.y);
  await page.waitForTimeout(120);
  const focusedTag = await page.evaluate(() => document.activeElement.tagName);
  ok("clicking the picture puts the focus on it", focusedTag === "CANVAS", focusedTag);
  await page.keyboard.type("XY");
  await page.waitForTimeout(200);
  const after = await drawn();
  ok("and typing reaches the field", after === before + "XY", before + " -> " + after);
}

console.log("--- the window follows the pointer ---");
{
  // Reported: the window only jumped at the end of a drag. `dragBy` moved the
  // controller and was the only one of the three gesture methods that did not
  // rebuild the tree, so the painted position stayed where it was built until
  // the release rebuilt it.
  await page.click('#demos input[value="dialog"]');
  await page.waitForTimeout(300);
  const box = await (await page.$("#stage canvas")).boundingBox();
  const at = () => page.evaluate(() => {
    const l = JSON.parse(window.__lastList || "{}");
    const c = (l.cmds || []).find((x) => Math.abs(x.w - 300) < 2 && Math.abs(x.h - 194) < 2);
    return c ? [c.x, c.y] : null;
  });
  await page.mouse.move(box.x + 700, box.y + 45);
  await page.waitForTimeout(120);
  const cursor = await page.evaluate(() => document.querySelector("#stage canvas").style.cursor);
  ok("the title bar says it can be moved", cursor === "move", cursor);

  const start = await at();
  await page.mouse.down();
  const seen = [];
  for (const d of [20, 40, 60]) {
    await page.mouse.move(box.x + 700 + d, box.y + 45);
    await page.waitForTimeout(60);
    seen.push((await at())[0]);
  }
  await page.mouse.up();
  // EVERY step moves it, not just the last: three distinct positions, each
  // one further along than the one before.
  ok("it moves at every step of the drag",
    seen.length === 3 && seen[0] > start[0] && seen[1] > seen[0] && seen[2] > seen[1],
    `${start[0]} -> ${seen.join(" -> ")}`);
}

console.log("--- the title bar is rounded only at the top ---");
{
  // `border-radius: 11px 11px 0 0` — the declaration that makes a strip sit
  // flush against what is under it, and which could not be written at all
  // while a box had one radius.
  const rc = await page.evaluate(() => {
    const l = JSON.parse(window.__lastList || "{}");
    const c = (l.cmds || []).find((x) => Math.abs(x.w - 298) < 2 && Math.abs(x.h - 40) < 2);
    return c ? c.rc : null;
  });
  ok("the bar carries four corners", Array.isArray(rc), JSON.stringify(rc));
  ok("rounded at the top, square at the bottom",
    rc && rc[0] > 0 && rc[1] > 0 && rc[2] === 0 && rc[3] === 0, JSON.stringify(rc));
}

console.log("--- the surface ripples where it was touched ---");
{
  // `evg-surface-effect: ripple` is an EVG EXTENSION, not CSS: there is no
  // browser property to measure it against, so what is checked is that the
  // declaration reaches the display list, that a touch becomes its origin,
  // that the age advances, and that the renderer took the second pass.
  await page.click('#demos input[value="dashboard"]');
  await page.waitForTimeout(400);
  const effect = () => page.evaluate(() => {
    const l = JSON.parse(window.__lastList || "{}");
    return l.effect || null;
  });
  const at = await effect();
  ok("the sheet's effect reaches the list", at && at.kind === "ripple",
    JSON.stringify(at));
  ok("and it is at rest until something touches it", at && at.t < 0, String(at && at.t));

  const box = await (await page.$("#stage canvas")).boundingBox();
  await page.mouse.click(box.x + 700, box.y + 430);
  await page.waitForTimeout(150);
  const live = await effect();
  ok("a click becomes the ripple's origin",
    live && Math.abs(live.x - 700) < 3 && Math.abs(live.y - 430) < 3,
    JSON.stringify(live && [live.x, live.y]));
  ok("and its clock starts", live && live.t >= 0, String(live && live.t));

  // The second pass really ran: `rippled` is the renderer saying it drew the
  // page into a texture and put it on the screen through the shader.
  const stats = await page.evaluate(() => window.__lastStats || null);
  if (stats) ok("the renderer took the post-pass", stats.rippled === 1, JSON.stringify(stats.rippled));
  else console.log("  (the page does not publish renderer stats; skipped)");
}

await browser.close();
server.close();
console.log("");
if (failed > 0) { console.log(`RESULT FAIL — ${failed} problem(s)`); process.exit(1); }
console.log("RESULT OK — the page loads and every demo draws");
