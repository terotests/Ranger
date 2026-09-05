#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Is the browser the thing measuring the page?
//
//   npm run evg:measure:web
//
// `evg-measure.js` hands `EVGHostTextMeasurer` one function and every layout
// in the page is meant to measure with it. A page that silently fell back to
// the table would look the same to every other check — the picture is a
// picture either way — so this asks the pages themselves, in Chromium:
//
//   * is the measurer installed and attached, and did the layout CALL it;
//   * does a run measured through EVG come out at the width canvas
//     `measureText` gives the same font shorthand, which is the width the
//     painter draws it at — the claim the file exists to make good on;
//   * are the face metrics the canvas's `fontBoundingBox*`, and is the line
//     gap non-negative and taken from a real `line-height: normal` box.
//
// Two pages, because they take the measurer two ways: the RealTrainer page
// through an ES module bundle, the responsive page through a global.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { requireDom, findChromium } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");

const PAGES = [
  {
    name: "realtrainer (bundle)",
    built: "gallery/realtrainer/web/bundle.js",
    build: "npm run rt:page",
    url: "/gallery/realtrainer/web/index.html?page=980x760",
    ready: () => window.__app && window.__fontMeasure,
  },
  {
    name: "responsive (global)",
    built: "gallery/evg/web/responsive/dist/index.html",
    build: "npm run evg:responsive:web",
    url: "/gallery/evg/web/responsive/dist/index.html",
    ready: () => window.__evgResponsive && window.__fontMeasure,
  },
];

for (const p of PAGES) {
  if (!fs.existsSync(path.join(ROOT, p.built))) {
    console.error(`${p.built} missing — run \`${p.build}\` first`);
    process.exit(3);
  }
}

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".cjs": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml",
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
const browser = await chromium.launch({ executablePath: findChromium(), args: ["--use-gl=angle", "--use-angle=swiftshader"] });

let passed = 0, failed = 0;
const ok = (what, cond, detail = "") => {
  if (cond) passed += 1; else failed += 1;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : "  (" + detail + ")"}`);
};

// What the page says about its measurer. Runs in the browser.
const probe = () => {
  const h = window.__fontMeasure;
  const m = h.measurers[0];
  const c = document.createElement("canvas").getContext("2d");
  const family = "sans-serif", size = 14, text = "Päiväkirja — 3x5@90kg";
  c.font = `${size}px ${family}`;
  const canvasW = c.measureText("‭" + text + "‬").width;
  const fm = c.measureText("Hg");
  const run = m.measureText(text, family, size);
  c.font = `bold ${size}px ${family}`;
  const canvasBoldW = c.measureText("‭" + text + "‬").width;
  const bold = m.measureText(text, family + "-Bold", size);
  return {
    attached: m.isAttached(), host: m.hostName, key: m.measureKey(),
    widthCalls: m.widthCalls, faceCalls: m.faceCalls,
    evgW: run.width, canvasW, evgBoldW: bold.width, canvasBoldW,
    asc: run.ascent, desc: run.descent, canvasAsc: fm.fontBoundingBoxAscent, canvasDesc: fm.fontBoundingBoxDescent,
    lineH: m.getLineHeight(family, size),
    // What the table would have said, for the record.
    tableW: (typeof m.fallback === "object" && m.fallback) ? m.fallback.measureText(text, family, size).width : -1,
  };
};

for (const p of PAGES) {
  console.log(`--- ${p.name}`);
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}${p.url}`, { waitUntil: "networkidle" });
  await page.waitForFunction(p.ready, null, { timeout: 20000 });
  const r = await page.evaluate(probe);
  ok("the measurer is installed and attached", r.attached && r.host === "canvas", JSON.stringify({ attached: r.attached, host: r.host }));
  ok("the layout called the browser for widths", r.widthCalls > 0, `widthCalls=${r.widthCalls}`);
  ok("and for faces, once per face", r.faceCalls > 0 && r.faceCalls % 3 === 0 && r.faceCalls <= r.widthCalls * 3, `faceCalls=${r.faceCalls}`);
  ok("a run through EVG is the width the painter's canvas gives it", Math.abs(r.evgW - r.canvasW) < 0.001, `evg=${r.evgW} canvas=${r.canvasW}`);
  ok("and a bold run, through the -Bold convention", Math.abs(r.evgBoldW - r.canvasBoldW) < 0.001 && r.evgBoldW !== r.evgW, `evg=${r.evgBoldW} canvas=${r.canvasBoldW}`);
  ok("the ascent and descent are the face's", Math.abs(r.asc - r.canvasAsc) < 0.001 && Math.abs(r.desc - r.canvasDesc) < 0.001, `evg=${r.asc}/${r.desc} canvas=${r.canvasAsc}/${r.canvasDesc}`);
  ok("line-height: normal is at least the face's box", r.lineH >= r.asc + r.desc - 0.001 && r.lineH < (r.asc + r.desc) * 1.3, `lineH=${r.lineH} asc+desc=${r.asc + r.desc}`);
  ok("the key names the host", /^host:canvas:/.test(r.key), r.key);
  ok("no page errors", errors.length === 0, errors.join("; "));
  console.log(`  (table would have said ${r.tableW.toFixed(2)}, the browser says ${r.canvasW.toFixed(2)})`);
  await page.close();
}

await browser.close();
server.close();
console.log(`\npassed = ${passed}  failed = ${failed}`);
if (failed > 0) {
  console.log("FAILURES");
  process.exit(1);
}
console.log("ALL PASS");
