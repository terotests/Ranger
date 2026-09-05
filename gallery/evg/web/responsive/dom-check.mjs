#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The retained DOM painter, in a browser: are the nodes where the engine
// said, and do they survive a frame?
//
//   npm run evg:dom:check          (after: npm run evg:responsive:web)
//
// `evg-dom.js` keeps one DOM node per element and patches it from the host
// tree's ops. Two things have to be true of it, and neither is visible in a
// screenshot:
//
//   * every node's rectangle in the page — where the browser put it, through
//     parent-relative offsets and a scroll layer's transform — is the page
//     rectangle EVG gave the element. The same claim the SVG painter is
//     held to, made of DOM placement instead of `<rect>` attributes;
//   * a resize UPDATES the nodes rather than remaking them: the cards
//     rearrange from four across to two, and the DOM nodes are the same
//     objects, born in the first build.
//
// The smoke test's questions about the breakpoints are asked again here on
// the DOM, so the two painters are held to the same layout.

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const DIST = path.resolve(process.argv[2] || path.join(HERE, "dist"));

function loadPlaywright() {
  for (const anchor of [path.join(ROOT, "package.json"), import.meta.url]) {
    for (const name of ["playwright", "playwright-core"]) {
      try { return createRequire(anchor)(name); } catch { /* next */ }
    }
  }
  return null;
}
function findChrome() {
  if (process.env.RANGER_CHROMIUM) return process.env.RANGER_CHROMIUM;
  // The browsers Playwright installed, whichever build they are — the
  // package's own resolution wants the exact build it was released with.
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (fs.existsSync(base)) {
    for (const entry of fs.readdirSync(base)) {
      if (!entry.startsWith("chromium-")) continue;
      const exe = path.join(base, entry, "chrome-linux", "chrome");
      if (fs.existsSync(exe)) return exe;
    }
  }
  for (const c of [process.env.CHROME_PATH, "/usr/bin/chromium", "/usr/bin/google-chrome"].filter(Boolean)) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const pw = loadPlaywright();
if (!pw) {
  console.log("Playwright is not available — the DOM painter was not checked.");
  process.exit(0);
}
for (const f of ["index.html", "evg_responsive_demo.js", "evg-dom.js"]) {
  if (!fs.existsSync(path.join(DIST, f))) {
    console.error(`no ${f} in ${path.relative(ROOT, DIST)} — run: npm run evg:responsive:web`);
    process.exit(1);
  }
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
  const file = path.join(DIST, rel);
  if (!file.startsWith(DIST) || !fs.existsSync(file)) { res.writeHead(404).end("not found"); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const exe = findChrome();
const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

let passed = 0, failed = 0;
const check = (what, cond, detail = "") => {
  if (cond) passed += 1; else failed += 1;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : "  (" + detail + ")"}`);
};

await page.goto(`http://127.0.0.1:${port}/index.html?painter=dom`, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__evgResponsive && window.__evgResponsive.painter === "dom", null, { timeout: 20000 });

// What the DOM did with the ops: every node's rectangle, as the browser
// placed it, against the page rectangle the engine gave the element.
const placement = () => page.evaluate(() => {
  const stage = document.getElementById("stage").getBoundingClientRect();
  const out = [];
  for (const n of window.__evgDom.nodes()) {
    const r = n.el.getBoundingClientRect();
    out.push({
      path: n.path, born: n.born,
      dx: Math.abs(r.left - stage.left - n.px), dy: Math.abs(r.top - stage.top - n.py),
      dw: Math.abs(r.width - n.w), dh: Math.abs(r.height - n.h),
      lines: n.el.querySelectorAll(":scope > .evg-line").length,
      pre: [...n.el.querySelectorAll(":scope > .evg-line")].every((l) => getComputedStyle(l).whiteSpace === "pre"),
    });
  }
  return out;
});
const state = () => page.evaluate(() => window.__evgResponsive);

console.log("dom painter check");
let s = await state();
check("the page painted through the DOM painter", s.painter === "dom" && s.host && s.host.nodes > 0, JSON.stringify(s.host));
check("the stylesheet parsed clean", s.cssErrors === 0, `cssErrors=${s.cssErrors}`);
check("the first build created every node", s.host.created === s.host.count && s.host.updated === 0, JSON.stringify(s.host));

let nodes = await placement();
const worst = (list) => list.reduce((m, n) => Math.max(m, n.dx, n.dy, n.dw, n.dh), 0);
check(`every node is where the engine put it (${nodes.length} nodes)`, worst(nodes) < 0.51, `worst drift ${worst(nodes).toFixed(2)}px`);
check("text is lines, and the browser breaks none of them", nodes.some((n) => n.lines > 0) && nodes.every((n) => n.pre), "");
check("a paragraph wrapped into more than one line", nodes.some((n) => n.lines > 1), "");

// Cards, counted from the DOM: the same question the smoke test asks of
// the SVG, asked of nodes. A card is a node the tree classed `card`; the
// count in the first row is the column layout.
const columns = async () => page.evaluate(() => {
  const ys = new Map();
  for (const n of window.__evgDom.nodes()) {
    if (!n.el.classList.contains("card")) continue;
    const y = Math.round(n.py);
    ys.set(y, (ys.get(y) || 0) + 1);
  }
  return [...ys.values()];
});
let cols = await columns();
check("1400px: cards across", cols.length > 0 && cols[0] === 4, JSON.stringify(cols));

// Narrow the window: the layout changes, the nodes do not.
await page.setViewportSize({ width: 760, height: 900 });
await page.waitForFunction((want) => window.__evgResponsive && Math.abs(window.__evgResponsive.width - want) < 30, 760, { timeout: 10000 });
await page.waitForTimeout(100);
s = await state();
check("760px: the resize was updates, not creates", s.host.created === 0 && s.host.removed === 0 && s.host.updated > 0, JSON.stringify(s.host));
nodes = await placement();
check("760px: every node is still where the engine put it", worst(nodes) < 0.51, `worst drift ${worst(nodes).toFixed(2)}px`);
check("760px: the nodes are the ones born in the first build", nodes.every((n) => n.born === 1), `${nodes.filter((n) => n.born !== 1).length} reborn`);
cols = await columns();
check("760px: two cards across", cols.length > 0 && cols[0] === 2, JSON.stringify(cols));

await page.setViewportSize({ width: 1400, height: 900 });
await page.waitForFunction((want) => window.__evgResponsive && Math.abs(window.__evgResponsive.width - want) < 30, 1400, { timeout: 10000 });
await page.waitForTimeout(100);
cols = await columns();
check("back at 1400px: four across again", cols.length > 0 && cols[0] === 4, JSON.stringify(cols));
nodes = await placement();
check("and still the same nodes", nodes.every((n) => n.born === 1), "");
check("no page errors", errors.length === 0, errors.join("; "));

await browser.close();
server.close();
console.log(`\npassed = ${passed}  failed = ${failed}`);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
