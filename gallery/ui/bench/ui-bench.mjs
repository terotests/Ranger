#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Where the time goes in an EVG frame, phase by phase.
//
// The question this answers is not "is it fast" but "which phase do I fix".
// A total says the pipeline costs 135ms and gives you nowhere to start; the
// split says layout is 90 of it, or the display list is, and those are
// different projects.
//
// Four measurements per row count:
//
//   rebuild    build the tree, style it, lay it out, build the display list.
//              What a from-scratch declarative render costs today.
//   retained   style + layout + display list on a tree that already exists.
//              What the page pays now for any change at all.
//   hover      ONE row's interaction state changes on a tree that already
//              exists — no rebuild, no reconcile, just style + layout + list.
//              This is the number the user feels: a pointer crossing a row.
//              It logically dirties one background colour.
//   patch      ONE row's CLASS changes and the tree is rebuilt and reconciled.
//              The declarative path, which is what a `state` change will cost
//              once components drive it.
//   paint      the display list through the real WebGL painter, in Chromium.
//              Off by default (`--paint`), because it needs a browser.
//
// `patch` is the number the invalidation work has to move. A hover on one row
// of a 1600-row table logically dirties one background colour; if patch tracks
// retained, nothing is being avoided.
//
//   node gallery/ui/bench/ui-bench.mjs [--rows 200,800,1600] [--paint] [--json]

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/UiBench.cjs"));
const CSS = fs.readFileSync(path.join(ROOT, "gallery/ui/demo/table.css"), "utf8");

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const ROWS = arg("--rows", "200,800,1600").split(",").map((s) => parseInt(s, 10));
const WANT_PAINT = argv.includes("--paint");
const AS_JSON = argv.includes("--json");

// Median of `n` runs after `warm` discarded. Median and not mean: one GC pause
// in a five-run mean moves the answer by more than the change being measured.
function time(fn, { warm = 2, runs = 7 } = {}) {
  for (let i = 0; i < warm; i++) fn();
  const t = [];
  for (let i = 0; i < runs; i++) {
    const a = process.hrtime.bigint();
    fn();
    t.push(Number(process.hrtime.bigint() - a) / 1e6);
  }
  t.sort((x, y) => x - y);
  return t[t.length >> 1];
}

function measure(rows) {
  const sheet = () => M.UiBench.sheetFor(CSS);

  // --- rebuild: everything, from nothing ---
  const rebuild = time(() => {
    const s = sheet();
    const root = M.UiBench.page(rows, -1);
    M.UiBench.styleOnly(s, root);
    const lay = M.UiBench.layoutOnly(root);
    M.UiBench.listOnly(root, lay);
  });

  // --- the phases of that, separately ---
  const build = time(() => M.UiBench.page(rows, -1));

  const s1 = sheet();
  const styleTree = M.UiBench.page(rows, -1);
  const style = time(() => M.UiBench.styleOnly(s1, styleTree));

  const s2 = sheet();
  const layTree = M.UiBench.page(rows, -1);
  M.UiBench.styleOnly(s2, layTree);
  const layout = time(() => M.UiBench.layoutOnly(layTree));

  const s3 = sheet();
  const dlTree = M.UiBench.page(rows, -1);
  M.UiBench.styleOnly(s3, dlTree);
  const dlLay = M.UiBench.layoutOnly(dlTree);
  const displayList = time(() => M.UiBench.listOnly(dlTree, dlLay));

  // --- retained: the tree stands, everything after it runs again ---
  const s4 = sheet();
  const live = M.UiBench.page(rows, -1);
  const retained = time(() => {
    M.UiBench.styleOnly(s4, live);
    const lay = M.UiBench.layoutOnly(live);
    M.UiBench.listOnly(live, lay);
  });

  // --- hover: an interaction bit flips on a tree that stands ---
  // No rebuild and no reconcile: this is the pointer crossing a row. A hover
  // changes no layout property and no element's command count, so in principle
  // it costs a repaint. Today it costs a whole pipeline.
  const s6 = sheet();
  const hoverLive = M.UiBench.page(rows, -1);
  M.UiBench.styleOnly(s6, hoverLive);
  M.UiBench.listOnly(hoverLive, M.UiBench.layoutOnly(hoverLive));
  const grid = hoverLive.children[0].children[0];
  let hovered = null;
  let hoverLay = M.UiBench.layoutOnly(hoverLive);
  const hover = time(() => {
    if (hovered) hovered.isHovered = false;
    hovered = grid.children[(Math.random() * rows) | 0];
    hovered.isHovered = true;
    M.UiBench.styleOnly(s6, hoverLive);
    // The invalidation decision, in one line. The sheet knows whether anything
    // it wrote can have moved a box, and a hover provably cannot.
    if (!M.UiBench.layoutClean(s6)) hoverLay = M.UiBench.layoutOnly(hoverLive);
    M.UiBench.listOnly(hoverLive, hoverLay);
  });
  // What the pass actually did, so a skip that silently stopped working is
  // visible as a number rather than as a suspiciously good time.
  const hoverStyled = M.UiBench.styledCount(s6);
  const hoverSkipped = M.UiBench.skippedCount(s6);
  const hoverLayoutClean = M.UiBench.layoutClean(s6);

  // --- patch: one row's class changes, through the declarative path ---
  // Rebuild the page with the hover on a different row, reconcile it into the
  // live tree, then do what a frame does. This is the honest cost of "one row
  // lit up" as the architecture stands.
  const s5 = sheet();
  let patchLive = M.UiBench.page(rows, -1);
  M.UiBench.styleOnly(s5, patchLive);
  M.UiBench.listOnly(patchLive, M.UiBench.layoutOnly(patchLive));
  const rec = new M.EVGReconcile();
  let hoverAt = Math.floor(rows / 2);
  const patch = time(() => {
    hoverAt = (hoverAt + 1) % rows;
    const next = M.UiBench.page(rows, hoverAt);
    rec.resetStats();
    rec.reconcile(patchLive, next);
    M.UiBench.styleOnly(s5, patchLive);
    const lay = M.UiBench.layoutOnly(patchLive);
    M.UiBench.listOnly(patchLive, lay);
  });

  const sN = sheet();
  const sizeTree = M.UiBench.page(rows, -1);
  M.UiBench.styleOnly(sN, sizeTree);
  const sizeLay = M.UiBench.layoutOnly(sizeTree);
  const commands = M.UiBench.listOnly(sizeTree, sizeLay);
  const elements = M.UiBench.countElements(sizeTree);

  return { rows, elements, commands, build, style, layout, displayList, retained, hover, patch, rebuild,
           hoverStyled, hoverSkipped, hoverLayoutClean };
}

// --- paint, in a real browser ---------------------------------------------------
async function paintTimes(results) {
  const { requireDom, findChromium } = await import("../conformance/dom-adapter.mjs");
  const docs = results.map((r) => {
    const s = M.UiBench.sheetFor(CSS);
    const root = M.UiBench.page(r.rows, -1);
    M.UiBench.styleOnly(s, root);
    const lay = M.UiBench.layoutOnly(root);
    return { rows: r.rows, list: JSON.parse(M.UiBench.listJson(root, lay)) };
  });

  const page = path.join(ROOT, "tmp", "ui_bench.html");
  fs.mkdirSync(path.dirname(page), { recursive: true });
  fs.writeFileSync(
    page,
    `<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,">
<style>html,body{margin:0;background:#fff}canvas{display:block}</style>
<canvas id="c"></canvas>
<script type="module">
import { renderDisplayList } from "/gallery/evg/gl/evg-webgl.js";
const DOCS = ${JSON.stringify(docs)};
const c = document.getElementById("c");
c.style.width = "1240px"; c.style.height = "900px";
c.width = 1240; c.height = 900;
const gl = c.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true, preserveDrawingBuffer: true });
await document.fonts.ready;
const out = [];
for (const d of DOCS) {
  const doc = { width: 1240, height: 900, list: d.list };
  await Promise.all(doc.list.cmds.filter((x) => x.text).map((x) => document.fonts.load(\`\${x.size}px "\${x.font}"\`)));
  // Warm the atlas and the buffers, then take the median of seven.
  for (let i = 0; i < 3; i++) renderDisplayList(gl, doc, { dpr: 1 });
  const t = [];
  for (let i = 0; i < 7; i++) { const a = performance.now(); renderDisplayList(gl, doc, { dpr: 1 }); gl.finish(); t.push(performance.now() - a); }
  t.sort((x, y) => x - y);
  out.push({ rows: d.rows, paint: t[t.length >> 1] });
}
window.__paint = out;
window.__done = true;
</script>`,
  );

  const { createServer } = await import("node:http");
  const server = createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = rel === "/" ? page : path.join(ROOT, rel.slice(1));
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return void res.writeHead(404).end("no");
    const type = file.endsWith(".js") || file.endsWith(".mjs") ? "text/javascript" : "text/html";
    res.writeHead(200, { "content-type": type }).end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;

  const { chromium } = requireDom("playwright-core");
  const browser = await chromium.launch({ executablePath: findChromium() });
  const p = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  p.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
  await p.goto(`http://127.0.0.1:${port}/`);
  await p.waitForFunction("window.__done === true", null, { timeout: 120000 });
  const out = await p.evaluate(() => window.__paint);
  await browser.close();
  server.close();
  return new Map(out.map((o) => [o.rows, o.paint]));
}

const results = ROWS.map(measure);
if (WANT_PAINT) {
  const paint = await paintTimes(results);
  for (const r of results) r.paint = paint.get(r.rows);
}

if (AS_JSON) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const f = (v) => (v == null ? "  —  " : v.toFixed(1).padStart(6));
  console.log("=== EVG UI pipeline, ms per frame (median of 7) ===");
  console.log("");
  console.log(
    "  rows  elements   cmds |  build   style  layout    list |  paint   hover   patch retained rebuild",
  );
  console.log(
    "  ----  --------  ----- | ------ ------- ------- ------- | ------ ------- ------- -------- -------",
  );
  for (const r of results) {
    console.log(
      `  ${String(r.rows).padStart(4)}  ${String(r.elements).padStart(8)}  ${String(r.commands).padStart(5)} |` +
        ` ${f(r.build)} ${f(r.style)} ${f(r.layout)} ${f(r.displayList)} |` +
        ` ${f(r.paint)} ${f(r.hover)} ${f(r.patch)} ${f(r.retained)} ${f(r.rebuild)}`,
    );
  }
  console.log("");
  for (const r of results) {
    console.log(
      `  hover at ${r.rows}: ${r.hoverStyled} element(s) re-styled, ${r.hoverSkipped} skipped,` +
        ` layout ${r.hoverLayoutClean ? "SKIPPED" : "run"}`,
    );
  }
  console.log("");
  console.log("  hover = one row's interaction state flips on a tree that stands. It is");
  console.log("  the number a person feels, and it should approach `paint`.");
  console.log("  patch = one row's class changes through the whole declarative path.");
  console.log("  While either tracks `retained`, nothing is being avoided.");
}
