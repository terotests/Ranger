#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// THE FIRST PAINT, and what is in it.
//
//   npm run rt:shell        (after: npm run rt:page)
//
// Not what the app draws — `frame-check.mjs` has that — but what the DOCUMENT
// says before the app exists at all, which is a different question and was for
// a long time the wrong answer. The page shipped a header and an aside full of
// prose, styled visible, and `main.js` hid them by adding a class once the
// whole bundle had arrived and run. So the first thing a visitor saw was a
// paragraph of English about a ring, for as long as the download took, and
// then it vanished. No amount of code splitting fixes that: the document
// simply said the wrong thing first.
//
// The mode is settled now in a few synchronous lines in the head, before the
// body exists. This check proves it, and the only way to prove it is to look
// at the page WHILE THE BUNDLE IS STILL COMING — so the bundle is held at the
// server and the assertions are made in the gap.
//
// Two shapes, and neither may flash into the other:
//
//   no query        the app fills the window; no chrome, ever
//   ?page=WxH       the documented demo; the chrome is there from the start

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

// Nothing here is timed. The bundle's request is held OPEN while the document
// is examined and released afterwards, so a slow machine makes this check
// slower and never makes it flaky.
const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".cjs": "text/javascript", ".css": "text/css", ".json": "application/json",
};
// A gate the check re-arms before each page load: the bundle request waits on
// whatever promise is current, and `openGate()` lets it through.
let gate = null;
const armGate = () => { let open; gate = { wait: new Promise((r) => { open = r; }), open }; };
const openGate = () => gate.open();
armGate();
const server = createServer(async (req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.join(ROOT, rel.slice(1));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  // The one file the page cannot paint without — held until the check says so.
  if (/bundle(-worker)?\.js$/.test(rel)) await gate.wait;
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" }).end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = (q) => `http://127.0.0.1:${port}/gallery/realtrainer/web/index.html${q}`;

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const VIEW = { width: 1200, height: 900 };

let passed = 0, failed = 0;
const ok = (what, cond, detail = "") => {
  if (cond) passed += 1; else failed += 1;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : "  (" + detail + ")"}`);
};

/** What the document shows, asked of the live page. */
const shellOf = () => ({
  text: document.body.innerText.replace(/\s+/g, " ").trim(),
  header: !!document.querySelector("header")?.getClientRects().length,
  aside: !!document.querySelector("aside")?.getClientRects().length,
  stage: (() => {
    const r = document.getElementById("stage").getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  })(),
  scrollbar: document.documentElement.scrollHeight > window.innerHeight + 1,
});

// --- the app filling the window: the URL a visitor opens --------------------
{
  const page = await browser.newPage({ viewport: VIEW });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  // `domcontentloaded`, not `load`: the bundle is being held, so `load` would
  // wait for the very thing this check exists to look behind.
  await page.goto(url(""), { waitUntil: "domcontentloaded" });

  console.log("--- before the bundle arrives ---");
  const before = await page.evaluate(shellOf);
  ok("nothing is written on the page", before.text === "", JSON.stringify(before.text.slice(0, 60)));
  ok("no header", !before.header);
  ok("no aside", !before.aside);
  ok(
    "the stage is already the window",
    before.stage.w === VIEW.width && before.stage.h === VIEW.height,
    `${before.stage.w}x${before.stage.h} vs ${VIEW.width}x${VIEW.height}`,
  );
  ok("the document does not scroll", !before.scrollbar);

  openGate();
  await page.waitForFunction("window.__lastList !== undefined", null, { timeout: 30000 });

  console.log("--- after it runs ---");
  const after = await page.evaluate(shellOf);
  ok("still nothing written", after.text === "", JSON.stringify(after.text.slice(0, 60)));
  ok("still no header", !after.header);
  ok("still no aside", !after.aside);
  ok(
    "the stage did not move",
    after.stage.w === before.stage.w && after.stage.h === before.stage.h,
    `${before.stage.w}x${before.stage.h} -> ${after.stage.w}x${after.stage.h}`,
  );
  const canvas = await page.evaluate(() => {
    const r = document.querySelector("#stage canvas").getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  ok(
    "the canvas fills the stage",
    canvas.w === after.stage.w && canvas.h === after.stage.h,
    `${canvas.w}x${canvas.h}`,
  );
  const cmds = await page.evaluate(() => JSON.parse(window.__lastList).cmds.length);
  ok("and the app drew something on it", cmds > 0, `${cmds} commands`);
  ok("no page errors", errors.length === 0, errors[0] || "");
  await page.close();
}

// --- the documented demo: `?page=WxH` --------------------------------------
// The other direction of the same bug: a page that decided its mode late would
// flash the app's shape before laying out the prose. Held the same way.
{
  armGate();
  const page = await browser.newPage({ viewport: VIEW });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url("?page=980x760"), { waitUntil: "domcontentloaded" });

  console.log("--- the pinned page, before the bundle arrives ---");
  const before = await page.evaluate(shellOf);
  ok("the header is there from the start", before.header);
  ok("so is the aside", before.aside);
  ok("and the prose with it", before.text.includes("RealTrainer"), before.text.slice(0, 40));

  openGate();
  await page.waitForFunction("window.__lastList !== undefined", null, { timeout: 30000 });
  const after = await page.evaluate(shellOf);
  console.log("--- and after ---");
  ok("the header stayed", after.header);
  ok("the aside stayed", after.aside);
  const canvas = await page.evaluate(() => {
    const r = document.querySelector("#stage canvas").getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  ok("the stage took the size it was given", canvas.w === 980 && canvas.h === 760, `${canvas.w}x${canvas.h}`);
  ok("no page errors", errors.length === 0, errors[0] || "");
  await page.close();
}

await browser.close();
server.close();
console.log(`\npassed = ${passed}  failed = ${failed}`);
console.log(failed === 0 ? "ALL PASS" : `${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
