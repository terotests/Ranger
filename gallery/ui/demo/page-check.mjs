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

await browser.close();
server.close();
console.log("");
if (failed > 0) { console.log(`RESULT FAIL — ${failed} problem(s)`); process.exit(1); }
console.log("RESULT OK — the page loads and every demo draws");
