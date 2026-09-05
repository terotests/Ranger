#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// RealTrainer painted as retained DOM (`?painter=dom`), in Chromium.
//
//   npm run rt:dom          (after: npm run rt:page)
//
// The same app and the same host as the WebGL page, with the picture made of
// DOM nodes patched from `EVGHostTree` instead of a frame on the card. What
// has to hold, and is asked here: every node sits where the engine put it,
// on the loader and again on the sign-in page it hands over to; a scene
// change is creates and removes, not a rebuild of everything; a press
// through the same pointer path opens the dashboard; and a scroll of the
// document moves the DOM by the engine's numbers, as one transform.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { requireDom, findChromium } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
if (!fs.existsSync(path.join(HERE, "bundle.js"))) {
  console.error("bundle.js missing — run `npm run rt:page` first");
  process.exit(3);
}

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".cjs": "text/javascript", ".css": "text/css", ".json": "application/json",
};
const server = createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.join(ROOT, rel.slice(1));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" }).end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
// Tall enough for the page chrome and the 760px card under it.
const VIEW = { width: 1200, height: 1100 };
const page = await browser.newPage({ viewport: VIEW });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

let passed = 0, failed = 0;
const ok = (what, cond, detail = "") => {
  if (cond) passed += 1; else failed += 1;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : "  (" + detail + ")"}`);
};

await page.goto(`http://127.0.0.1:${port}/gallery/realtrainer/web/index.html?page=980x760&painter=dom`, { waitUntil: "networkidle" });
await page.waitForFunction("window.__lastHost !== undefined", null, { timeout: 20000 });

const placement = () => page.evaluate(() => {
  const root = document.getElementById("dom").getBoundingClientRect();
  let worst = 0, n = 0, lines = 0;
  for (const node of window.__evgDom.nodes()) {
    // A transformed node's bounding rect is the turned box; the engine's
    // rectangle is the box before the turn. Placement is asked of the rest.
    if (node.transformed) continue;
    const r = node.el.getBoundingClientRect();
    worst = Math.max(worst, Math.abs(r.left - root.left - node.px), Math.abs(r.top - root.top - node.py), Math.abs(r.width - node.w), Math.abs(r.height - node.h));
    n += 1;
    lines += node.el.querySelectorAll(":scope > .evg-line").length;
  }
  return { worst, n, lines };
});
const hostStats = () => page.evaluate("window.__lastHost");
const scene = () => page.evaluate("window.__app.sceneName()");

console.log("--- the loader, as DOM ---");
let p = await placement();
ok(`nodes are where the engine put them (${p.n} nodes, ${p.lines} lines)`, p.worst < 0.51, `worst ${p.worst.toFixed(2)}px`);
ok("text is there", p.lines > 0);

console.log("--- the hand-over ---");
await page.waitForFunction("window.__app.sceneName() === 'signin'", null, { timeout: 8000 });
await page.waitForTimeout(150);
let h = await hostStats();
ok("the sign-in page arrived as creates and removes", h.created > 0 && h.removed > 0, JSON.stringify(h));
p = await placement();
ok(`and its nodes are where the engine put them (${p.n} nodes)`, p.worst < 0.51, `worst ${p.worst.toFixed(2)}px`);

console.log("--- a press, through the same pointer path ---");
// A press is a click on the canvas where the accessibility tree says the
// element is: the same pointer path the WebGL page takes.
const clickId = async (id) => {
  const box = await page.evaluate((id) => {
    const tree = JSON.parse(window.__app.a11yJson(1, ""));
    const n = tree.nodes.find((n) => n.id === id);
    return n ? n.b : null;
  }, id);
  if (!box) return false;
  const c = await page.evaluate(() => { const r = document.getElementById("c").getBoundingClientRect(); return { x: r.left, y: r.top }; });
  await page.mouse.click(c.x + box[0] + box[2] / 2, c.y + box[1] + box[3] / 2);
  return true;
};
const canvasBox = await page.evaluate(() => { const r = document.getElementById("c").getBoundingClientRect(); return { x: r.left, y: r.top, bottom: r.bottom }; });
ok("the canvas is in the window, over the nodes", canvasBox.y >= 0 && canvasBox.bottom <= VIEW.height, JSON.stringify(canvasBox));
ok("the button reports a rectangle", await clickId("rt-google"), "no rt-google node");
await page.waitForTimeout(250);
ok("the click opens the dashboard", (await scene()) === "dashboard", await scene());
console.log(`  (pointer-down to the frame that showed it: ${(await page.evaluate("window.__latency")).toFixed(1)} ms)`);
p = await placement();
ok(`the dashboard's nodes are where the engine put them (${p.n} nodes)`, p.worst < 0.51, `worst ${p.worst.toFixed(2)}px`);

console.log("--- the document, scrolled ---");
ok("the rail opens the document", await clickId("rt-rail-log"), "no rt-rail-log node");
await page.waitForTimeout(250);
ok("the document scene is on", (await scene()) === "document", await scene());
const before = await page.evaluate(() => {
  const layers = [...document.querySelectorAll("#dom .evg-layer")];
  return layers.map((l) => l.style.transform);
});
await page.mouse.move(canvasBox.x + 480, canvasBox.y + 400);
await page.mouse.wheel(0, 300);
await page.waitForTimeout(300);
const after = await page.evaluate(() => [...document.querySelectorAll("#dom .evg-layer")].map((l) => l.style.transform));
ok("a scroll moved a layer by one transform", after.some((t, i) => t !== before[i] && /translate/.test(t)), JSON.stringify(after).slice(0, 120));
h = await hostStats();
ok("and remade nothing", h.created === 0 && h.removed === 0, JSON.stringify(h));
p = await placement();
ok(`scrolled, every node is still where the engine put it (${p.n} nodes)`, p.worst < 0.51, `worst ${p.worst.toFixed(2)}px`);
ok("no page errors", errors.length === 0, errors.join("; "));

await browser.close();
server.close();
console.log(`\npassed = ${passed}  failed = ${failed}`);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
