#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What a flex or grid layout costs at 1k, 10k and 100k boxes — in EVG, and in
// Chromium given the same tree.
//
//   node --expose-gc gallery/evg/bench/layout-bench.mjs [--sizes 1000,10000,100000] [--json] [--no-browser]
//
// THREE FIXTURES, because "layout" is not one cost:
//
//   flex   nested flex: a column of cards, each a row of a fixed rail and a
//          growing body that is itself a column. Four levels. This is the
//          shape an application UI actually has, and it is the one that makes
//          an engine walk the tree more than once.
//   grid   one grid container with `repeat(4, 1fr)` and N cells, each cell a
//          small flex column. Wide and shallow: the track-sizing pass at size.
//   text   the flex fixture with a text leaf in every card, so the number
//          includes measuring and wrapping real strings.
//
// WHAT THE BROWSER NUMBER IS AND IS NOT. Chromium is timed with
// `performance.now()` around a forced reflow of the same tree, after the DOM
// exists and the styles are parsed. That is generous to it in one direction —
// no parsing, no style recalc if it can be avoided — and unfair to it in
// another, because a reflow in a browser also does line layout, paint
// invalidation and containing-block bookkeeping that EVG's pass does not.
// Read it as an order-of-magnitude reference for what a production C++ layout
// engine costs on the same boxes, not as a like-for-like race.
//
// MEMORY is the retained heap of the built tree: allocate, `global.gc()`,
// measure, subtract the baseline. It answers "what does a node cost to hold",
// which is the number that decides whether 100k boxes fit at all.

import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);
const M = require(path.join(ROOT, "gallery/evg/bin/EvgLayoutBench.cjs"));

// `--ab` compiles the same fixtures through a SECOND copy of the engine built
// from the pre-change sources (`EvgLayoutBenchBase.cjs`) and interleaves the
// two, so a regression is not read off two runs taken minutes apart on a
// laptop that was doing something else in between. Alternating A/B/A/B inside
// one process is the only version of this measurement worth believing.
const BASE_PATH = path.join(ROOT, "gallery/evg/bin/EvgLayoutBenchBase.cjs");
const AB = argvHas("--ab") && fs.existsSync(BASE_PATH);
const B = AB ? require(BASE_PATH) : null;
function argvHas(n) { return process.argv.slice(2).includes(n); }

const argv = process.argv.slice(2);
const arg = (n, d) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : d);
const SIZES = arg("--sizes", "1000,10000,100000").split(",").map(Number);
const AS_JSON = argv.includes("--json");
const NO_BROWSER = argv.includes("--no-browser");

const WORDS = ["Ada Lovelace", "Grace Hopper", "Alan Turing", "Edsger Dijkstra", "Barbara McClintock"];

// --- the fixtures, as a spec both sides build from --------------------------

const S = {
  page: "display:flex;flex-direction:column;flex-wrap:nowrap;width:1200px;gap:8px;align-items:stretch",
  card: "display:flex;flex-direction:row;flex-wrap:nowrap;gap:12px;padding:8px;align-items:stretch",
  rail: "width:48px;height:56px;background-color:#e4e4e7",
  body: "display:flex;flex-direction:column;flex-wrap:nowrap;flex-grow:1;gap:4px;align-items:stretch",
  line: "height:16px;background-color:#f4f4f5",
  gridc: "display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;width:1200px",
  cell: "display:flex;flex-direction:column;flex-wrap:nowrap;gap:4px;padding:6px;align-items:stretch",
  text: "font-size:14px",
};

// A card is 7 elements: card, rail, body, and four lines.
function flexSpec(n, withText) {
  const cards = Math.max(1, Math.round(n / 7));
  const kids = [];
  for (let i = 0; i < cards; i++) {
    const lines = [];
    for (let j = 0; j < 4; j++) {
      lines.push(
        withText && j === 0
          ? { s: S.text, kids: [], text: WORDS[i % WORDS.length] }
          : { s: S.line, kids: [] }
      );
    }
    kids.push({ s: S.card, kids: [{ s: S.rail, kids: [] }, { s: S.body, kids: lines }] });
  }
  return { s: S.page, kids };
}

// A cell is 5 elements: cell plus four lines.
function gridSpec(n) {
  const cells = Math.max(1, Math.round(n / 5));
  const kids = [];
  for (let i = 0; i < cells; i++) {
    const lines = [];
    for (let j = 0; j < 4; j++) lines.push({ s: S.line, kids: [] });
    kids.push({ s: S.cell, kids: lines });
  }
  return { s: S.gridc, kids };
}

const FIXTURES = {
  flex: (n) => flexSpec(n, false),
  grid: (n) => gridSpec(n),
  text: (n) => flexSpec(n, true),
};

// --- EVG --------------------------------------------------------------------

function evgBuild(node, mod) {
  const K = mod || M;
  const el = new K.EVGElement();
  for (const decl of node.s.split(";")) {
    const t = decl.trim();
    if (!t) continue;
    const i = t.indexOf(":");
    el.setAttribute(t.slice(0, i).trim(), t.slice(i + 1).trim());
  }
  if (node.text !== undefined) {
    el.elementType = 1;
    el.textContent = node.text;
  }
  for (const k of node.kids) el.addChild(evgBuild(k, K));
  return el;
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s[s.length >> 1];
}

// `--min` reports the FASTEST run instead of the median. For the A/B
// comparison that is the estimator to use: the question there is "how fast can
// this code run", and every millisecond above the floor is the machine's, not
// the engine's. The median is right for the standalone table, where the
// question is what a frame costs in practice.
const USE_MIN = process.argv.slice(2).includes("--min");

function time(fn, { warm = 1, runs = 5 } = {}) {
  for (let i = 0; i < warm; i++) fn();
  const t = [];
  for (let i = 0; i < runs; i++) {
    const a = process.hrtime.bigint();
    fn();
    t.push(Number(process.hrtime.bigint() - a) / 1e6);
  }
  if (USE_MIN) return Math.min(...t);
  return median(t);
}

function heapNow() {
  if (global.gc) { global.gc(); global.gc(); }
  return process.memoryUsage().heapUsed;
}

function evgMeasure(spec, mod) {
  const K = mod || M;
  const before = heapNow();
  let root = evgBuild(spec, K);
  const held = heapNow();
  const nodes = K.EvgLayoutBench.countElements(root);

  const build = time(() => { evgBuild(spec, K); }, { warm: 0, runs: 3 });

  const lay = new K.EVGLayout();
  lay.setPageSize(1200, 900);
  const layout = time(() => { lay.layout(root); }, { warm: 1, runs: 5 });

  const dl = new K.EVGDisplayList();
  dl.setTextEngine(lay.getTextEngine());
  const list = time(() => { dl.build(root); }, { warm: 1, runs: 3 });
  const cmds = dl.count();

  root = null;
  return { nodes, build, layout, list, cmds, bytes: held - before };
}

// --- Chromium ---------------------------------------------------------------

function htmlFor(spec) {
  const render = (n) =>
    `<div style="${n.s}">` +
    (n.text !== undefined ? n.text : "") +
    n.kids.map(render).join("") +
    `</div>`;
  return (
    `<!doctype html><meta charset="utf-8"><style>` +
    `*{box-sizing:border-box;margin:0;padding:0;border:0 solid #000}` +
    `html,body{margin:0;padding:0;font:14px/1.2 monospace}` +
    `</style><div id="host">${render(spec)}</div>`
  );
}

function chromiumPath() {
  const cache = path.join(process.env.HOME || "", "Library/Caches/ms-playwright");
  if (!fs.existsSync(cache)) return null;
  for (const dir of fs.readdirSync(cache).filter((d) => d.startsWith("chromium-")).sort().reverse()) {
    for (const rel of [
      "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
      "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
      "chrome-linux/chrome",
    ]) {
      const p = path.join(cache, dir, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

async function browserMeasure(page, spec) {
  await page.setContent(htmlFor(spec));
  return page.evaluate(() => {
    const host = document.getElementById("host");
    const root = host.firstElementChild;
    // Force a reflow that cannot be cached: change a length the whole tree
    // depends on, then read a geometry property back.
    const t = [];
    for (let i = 0; i < 6; i++) {
      const w = 1200 - (i % 2);
      const a = performance.now();
      root.style.width = w + "px";
      void host.offsetHeight;
      t.push(performance.now() - a);
    }
    t.sort((a, b) => a - b);
    return { relayout: t[t.length >> 1], nodes: host.querySelectorAll("div").length };
  });
}

// --- run --------------------------------------------------------------------

const out = { evg: [], css: [] };

out.base = [];
for (const [name, mk] of Object.entries(FIXTURES)) {
  for (const n of SIZES) {
    const spec = mk(n);
    if (AB) {
      // A, B, A, B, … — several alternations, and the best of each side is
      // kept, so neither is charged for the other's cold code or for whatever
      // the laptop was doing during one particular pass.
      let bb = null, aa = null;
      for (let r = 0; r < 3; r++) {
        const b1 = evgMeasure(spec, B);
        const a1 = evgMeasure(spec, M);
        if (!bb || b1.layout < bb.layout) bb = b1;
        if (!aa || a1.layout < aa.layout) aa = a1;
      }
      out.base.push({ fixture: name, want: n, ...bb });
      out.evg.push({ fixture: name, want: n, ...aa });
    } else {
      out.evg.push({ fixture: name, want: n, ...evgMeasure(spec, M) });
    }
  }
}

if (!NO_BROWSER) {
  const { chromium } = require("playwright-core");
  const exe = chromiumPath();
  const browser = await chromium.launch(exe ? { executablePath: exe } : { channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  for (const [name, mk] of Object.entries(FIXTURES)) {
    for (const n of SIZES) {
      const r = await browserMeasure(page, mk(n));
      out.css.push({ fixture: name, want: n, ...r });
    }
  }
  await browser.close();
}

if (AS_JSON) {
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

const f = (v, d = 1) => (v === undefined || v === null ? "—" : v.toFixed(d));
const pad = (s, n) => String(s).padStart(n);

console.log("\nEVG layout, three fixtures, three sizes" + (global.gc ? "" : "   (no --expose-gc: memory column omitted)"));
console.log("\n  fixture   nodes   build    layout    list    cmds     B/node    layout µs/node");
for (const r of out.evg) {
  console.log(
    `  ${r.fixture.padEnd(8)}${pad(r.nodes, 7)}${pad(f(r.build), 8)}${pad(f(r.layout), 10)}${pad(f(r.list), 8)}${pad(r.cmds, 8)}` +
      `${pad(r.bytes > 0 ? Math.round(r.bytes / r.nodes) : "—", 11)}${pad(f((r.layout * 1000) / r.nodes, 2), 18)}`
  );
}
console.log("\n  ms, median of five. `layout` is a RE-layout of a tree that already exists — what a resize costs.\n");

if (AB) {
  console.log("  Against the engine before these changes, alternated in one process\n");
  console.log("  fixture   nodes    before     after     delta");
  for (const a of out.evg) {
    const b = out.base.find((x) => x.fixture === a.fixture && x.want === a.want);
    const d = ((a.layout - b.layout) / b.layout) * 100;
    console.log(
      `  ${a.fixture.padEnd(8)}${pad(a.nodes, 7)}${pad(f(b.layout), 10)}${pad(f(a.layout), 10)}` +
        `${pad((d >= 0 ? "+" : "") + f(d) + "%", 10)}`
    );
  }
  console.log("");
}

if (out.css.length) {
  console.log("  Chromium, the same tree, forced reflow (see the note at the top of this file)\n");
  console.log("  fixture   nodes   reflow    µs/node    EVG / Chromium");
  for (const c of out.css) {
    const e = out.evg.find((x) => x.fixture === c.fixture && x.want === c.want);
    console.log(
      `  ${c.fixture.padEnd(8)}${pad(c.nodes, 7)}${pad(f(c.relayout), 9)}${pad(f((c.relayout * 1000) / c.nodes, 2), 11)}` +
        `${pad(f(e.layout / c.relayout, 1) + "x", 18)}`
    );
  }
  console.log("");
}
