#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// The layout cases of lib/evg/bench/layout-cases.mjs, laid out by three
// engines: EVG (Ranger, compiled to JavaScript), EVGr (the strict Rust module
// lib/evgr/src, compiled to JavaScript by rgrc) and Chromium.
//
//   npm run evgr:compare [-- --only <id>] [--verbose] [--json] [--no-browser]
//
// Every case is CSS text, split into declarations for EVG and EVGr and put in
// a `style=` attribute for Chromium, exactly as layout-conformance.mjs does.
// A pair of engines AGREES on a case when every box is within half a pixel.
// Chromium is the reference for what the CSS says; EVG is the engine EVGr
// sits beside, so both comparisons are reported.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { CASES, TEXT_CASES } from "../../evg/bench/layout-cases.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);
const EVG = require(path.join(ROOT, "lib/evg/bin/EvgLayoutBench.cjs"));
const R = require(path.join(ROOT, "lib/evgr/bin/Evgr.cjs"));

const argv = process.argv.slice(2);
const AS_JSON = argv.includes("--json");
const VERBOSE = argv.includes("--verbose");
const NO_BROWSER = argv.includes("--no-browser");
const ONLY = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
const EPS = 0.5;

// --- EVG ---------------------------------------------------------------------

function evgBuild(node) {
  const el = new EVG.EVGElement();
  for (const decl of (node.s || "").split(";")) {
    const t = decl.trim();
    if (!t) continue;
    const i = t.indexOf(":");
    if (i < 0) continue;
    el.setAttribute(t.slice(0, i).trim(), t.slice(i + 1).trim());
  }
  if (node.text !== undefined) {
    el.elementType = 1;
    el.textContent = node.text;
  }
  for (const k of node.kids || []) el.addChild(evgBuild(k));
  return el;
}

function evgBoxes(spec) {
  EVG.EVGReject.clearNotes();
  const root = evgBuild(spec);
  const lay = new EVG.EVGLayout();
  lay.setPageSize(1200, 900);
  lay.layout(root);
  const flat = [];
  (function collect(el) {
    flat.push({ x: el.calculatedX, y: el.calculatedY, w: el.calculatedWidth, h: el.calculatedHeight });
    for (const k of el.children) collect(k);
  })(root);
  return flat;
}

// --- EVGr --------------------------------------------------------------------

function evgrBuild(t, node, parent) {
  const i = node.text !== undefined ? t.add_text(parent, node.s || "", node.text) : t.add(parent, node.s || "");
  for (const k of node.kids || []) evgrBuild(t, k, i);
  return i;
}

function evgrBoxes(spec) {
  const t = R.EvgrTree.new_();
  evgrBuild(t, spec, -1);
  t.layout(1200, 900);
  const flat = [];
  for (let i = 0; i < t.count(); i++) flat.push({ x: t.x(i), y: t.y(i), w: t.w(i), h: t.h(i) });
  const unsupported = [];
  for (let k = 0; k < t.unsupported_count(); k++) unsupported.push(t.unsupported_at(k));
  return { flat, unsupported };
}

// --- Chromium ----------------------------------------------------------------

function html(spec) {
  const render = (n) =>
    `<div style="${(n.s || "").replace(/"/g, "&quot;")}">` +
    (n.text !== undefined ? n.text.replace(/[<&]/g, (c) => (c === "<" ? "&lt;" : "&amp;")) : "") +
    (n.kids || []).map(render).join("") +
    `</div>`;
  return (
    `<!doctype html><meta charset="utf-8"><style>` +
    `*{box-sizing:border-box;margin:0;padding:0;border:0 solid #000}` +
    `html,body{margin:0;padding:0;font:16px/1.2 monospace}` +
    `#host{position:absolute;left:0;top:0}` +
    `</style><div id="host">${render(spec)}</div>`
  );
}

async function browserBoxes(page, spec) {
  await page.setContent(html(spec));
  return page.evaluate(() => {
    const out = [];
    const host = document.getElementById("host");
    const origin = host.firstElementChild.getBoundingClientRect();
    (function collect(el) {
      const r = el.getBoundingClientRect();
      out.push({ x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height });
      for (const c of el.children) collect(c);
    })(host.firstElementChild);
    return out;
  });
}

// Whatever Chromium is on disk: this container's, a playwright cache's, or
// the user's own Chrome.
function chromiumPath() {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers", path.join(process.env.HOME || "", "Library/Caches/ms-playwright"), path.join(process.env.HOME || "", ".cache/ms-playwright")];
  for (const root of roots) {
    if (!root || !fs.existsSync(root)) continue;
    for (const dir of fs.readdirSync(root).filter((d) => d.startsWith("chromium-")).sort().reverse()) {
      for (const rel of [
        "chrome-linux/chrome",
        "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
      ]) {
        const p = path.join(root, dir, rel);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  return null;
}

// --- compare -----------------------------------------------------------------

function agree(a, b) {
  if (!a || !b) return null;
  if (a.length !== b.length) return [{ id: "count", miss: true }];
  const rows = [];
  for (let i = 0; i < a.length; i++) {
    const d = ["x", "y", "w", "h"].filter((k) => Math.abs(a[i][k] - b[i][k]) > EPS);
    if (d.length) rows.push({ id: "n" + i, fields: d, a: a[i], b: b[i] });
  }
  return rows;
}

let page = null;
let browser = null;
if (!NO_BROWSER) {
  const { chromium } = require("playwright-core");
  const exe = chromiumPath();
  browser = await chromium.launch(exe ? { executablePath: exe } : { channel: "chrome" });
  page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
}

const results = [];
for (const c of CASES) {
  if (ONLY && c.id !== ONLY) continue;
  const evg = evgBoxes(c.root);
  const r = evgrBoxes(c.root);
  const css = page ? await browserBoxes(page, c.root) : null;
  results.push({
    id: c.id,
    group: c.group,
    why: c.why,
    nodes: evg.length,
    unsupported: r.unsupported,
    evg,
    evgr: r.flat,
    css,
    rCss: agree(r.flat, css),
    rEvg: agree(r.flat, evg),
    eCss: agree(evg, css),
  });
}

// Text cases: EVG's own assertions, run on EVGr's boxes, and the boxes of
// both engines side by side (they share the measurer's advance table).
const textResults = [];
for (const c of TEXT_CASES) {
  if (ONLY && c.id !== ONLY) continue;
  const evg = evgBoxes(c.root);
  const r = evgrBoxes(c.root);
  let ok = false;
  try {
    ok = !!c.assert(r.flat);
  } catch (e) {
    ok = false;
  }
  textResults.push({ id: c.id, why: c.why, ok, rEvg: agree(r.flat, evg), evg, evgr: r.flat });
}

if (browser) await browser.close();

if (AS_JSON) {
  // no process.exit: it would cut a piped stdout short
  process.stdout.write(JSON.stringify({ results, textResults }, null, 2) + "\n");
} else {
  report();
}

function report() {

// --- report ------------------------------------------------------------------

const mark = (rows) => (rows === null ? "  - " : rows.length ? "DIFF" : " ok ");
const pad = (s, n) => String(s).padEnd(n);
const r2 = (v) => Math.round(v * 100) / 100;
const f = (o) => `x=${r2(o.x)} y=${r2(o.y)} w=${r2(o.w)} h=${r2(o.h)}`;

console.log("\nEVGr (Rust, via rgrc to JS) beside EVG and Chromium — the same CSS\n");
console.log(`     ${pad("case", 28)} EVGr=CSS  EVGr=EVG  EVG=CSS`);
let lastGroup = null;
const count = { rCss: 0, rEvg: 0, eCss: 0 };
for (const r of results) {
  if (r.group !== lastGroup) {
    console.log(`  ── ${r.group}`);
    lastGroup = r.group;
  }
  for (const k of Object.keys(count)) if (r[k] && r[k].length === 0) count[k]++;
  const note = r.unsupported.length ? `  (not laid out: ${r.unsupported.slice(0, 2).join("; ")}${r.unsupported.length > 2 ? "; …" : ""})` : "";
  console.log(`     ${pad(r.id, 28)}   ${mark(r.rCss)}      ${mark(r.rEvg)}     ${mark(r.eCss)}${note}`);
}
const n = results.length;
console.log(`\n  EVGr agrees with Chromium on ${count.rCss} of ${n}, with EVG on ${count.rEvg} of ${n}; EVG agrees with Chromium on ${count.eCss} of ${n}.`);

console.log("\n  Text (EVG's assertions on EVGr's boxes; boxes against EVG's)");
for (const t of textResults) {
  console.log(`     ${t.ok ? " ok " : "FAIL"}  ${mark(t.rEvg)}  ${pad(t.id, 26)} ${t.why}`);
}

if (VERBOSE) {
  for (const r of results) {
    const rows = r.rCss && r.rCss.length ? r.rCss : [];
    if (!rows.length) continue;
    console.log(`\n  ${r.id} — ${r.why}`);
    for (const d of rows.slice(0, 6)) {
      if (d.miss) {
        console.log(`     box count differs`);
        continue;
      }
      console.log(`     ${d.id} [${d.fields.join(",")}]  EVGr ${f(d.a)}   CSS ${f(d.b)}   EVG ${f(r.evg[Number(d.id.slice(1))])}`);
    }
  }
}
console.log("");
}
