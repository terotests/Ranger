#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Drive the PUBLISHED tree, not the sources.
//
//   node gallery/ui/web/pages-smoke.mjs --dist gallery/ui/web/dist
//
// `ui:demo:page` serves the repository and opens /gallery/ui/demo/index.html.
// GitHub Pages serves a different tree: /ui/ redirects to /ui/demo/, and the
// playground is /ui/web/. A bundle that works at the first URL can 404 at the
// second — relative `./bundle.js` is fine, an absolute /gallery/… link is not.
// This loads what the artifact will actually carry.

import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { requireHostTool, findChromium } from "../conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const distFlag = argv.indexOf("--dist");
const DIST = path.resolve(distFlag >= 0 ? argv[distFlag + 1] : path.join(HERE, "dist"));

if (!fs.existsSync(path.join(DIST, "demo", "bundle.js")) ||
    !fs.existsSync(path.join(DIST, "web", "bundle.js"))) {
  console.error("published tree missing — run `npm run ui:pages:build` first");
  process.exit(3);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(DIST, rel);
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found: " + rel);
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const origin = `http://127.0.0.1:${port}`;

const { chromium } = requireHostTool("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();

const problems = [];
page.on("pageerror", (e) => problems.push(`uncaught: ${e.message.split("\n")[0]}`));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console.error: ${m.text().split("\n")[0]}`);
});
page.on("requestfailed", (r) => problems.push(`request failed: ${r.url().replace(/^http:\/\/[^/]+/, "")}`));

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else {
    failed++;
    console.log("  FAIL " + name + (detail ? " — " + detail : ""));
  }
};

console.log("--- / redirects to the demos ---");
problems.length = 0;
await page.goto(`${origin}/?demo=dashboard`, { waitUntil: "networkidle" });
ok("landed on /demo/", page.url().includes("/demo/"), page.url());
ok("kept ?demo=dashboard", page.url().includes("demo=dashboard"), page.url());
await page.waitForFunction("document.querySelector('#stage canvas') !== null", null, { timeout: 20000 })
  .catch(() => {});
const demoW = await page.evaluate(() => {
  const c = document.querySelector("#stage canvas");
  return c ? c.width : 0;
});
ok("the demo canvas was sized", demoW > 600, "canvas width " + demoW);
ok("no error on the demo", problems.length === 0, [...new Set(problems)].join("; "));

const chosen = await page.evaluate(() => {
  const on = document.querySelector("#demos input[type=radio]:checked");
  return on ? on.value : "";
});
ok("?demo=dashboard selected the dashboard", chosen === "dashboard", chosen);

console.log("--- /web/ is the playground ---");
problems.length = 0;
await page.goto(`${origin}/web/`, { waitUntil: "networkidle" });
await page.waitForFunction("document.querySelector('canvas') !== null", null, { timeout: 20000 })
  .catch(() => {});
const webW = await page.evaluate(() => {
  const c = document.querySelector("canvas");
  return c ? c.width : 0;
});
ok("the playground canvas was sized", webW > 200, "canvas width " + webW);
const back = await page.evaluate(() => {
  const a = document.querySelector("header a.nav");
  return a ? a.getAttribute("href") : "";
});
ok("playground links back to the demos", back === "../demo/index.html", back);
ok("no error on the playground", problems.length === 0, [...new Set(problems)].join("; "));

await browser.close();
server.close();
if (failed) process.exit(1);
console.log("  ok — published tree paints");
