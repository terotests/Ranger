#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The same tree, laid out by EVG and by Chromium, box for box.
//
//   node gallery/evg/bench/layout-conformance.mjs [--json] [--only <id>] [--verbose]
//
// The cases live in `layout-cases.mjs` and are written ONCE, as CSS text. This
// file splits that text into `setAttribute` calls for EVG and drops it into a
// `style=` attribute for the browser, so neither side gets a translation the
// other did not.
//
// A case PASSES when every box agrees within half a pixel. Half and not zero
// because a browser rounds a used value into layout units and this engine does
// not; a real disagreement is never a rounding one.
//
// What a failure means is worth stating plainly, because this is not a test
// suite: it is a MEASUREMENT. Chromium is the definition of what the CSS says,
// so a differing box is a place where an EVG document and the CSS it was
// written as do not describe the same page. Some of those are known and
// deliberate (the initial values EVG chose differently, grouped as `defaults`),
// and the report separates them from the rest.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CASES, TEXT_CASES } from "./layout-cases.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);
const M = require(path.join(ROOT, "gallery/evg/bin/EvgLayoutBench.cjs"));

const argv = process.argv.slice(2);
const AS_JSON = argv.includes("--json");
const VERBOSE = argv.includes("--verbose");
const ONLY = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
const EPS = 0.5;

// --- the tree, numbered the same way on both sides ---------------------------

function walk(node, out) {
  const id = "n" + out.length;
  out.push({ id, node });
  for (const k of node.kids || []) walk(k, out);
  return out;
}

// --- EVG side ----------------------------------------------------------------

function evgBuild(node) {
  const el = new M.EVGElement();
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
  // The reject collector is process-wide on purpose — an element has no route
  // to the layout that will read it — so a harness that runs many documents in
  // one process has to reset it, or case 40's complaint is still attached to
  // case 41.
  M.EVGReject.clearNotes();
  const root = evgBuild(spec);
  const lay = new M.EVGLayout();
  lay.setPageSize(1200, 900);
  lay.layout(root);
  const flat = [];
  (function collect(el) {
    flat.push({
      x: el.calculatedX,
      y: el.calculatedY,
      w: el.calculatedWidth,
      h: el.calculatedHeight,
    });
    for (const k of el.children) collect(k);
  })(root);
  const warn = [];
  for (let i = 0; i < lay.warningCount(); i++) warn.push(lay.warningAt(i));
  return { flat, warn };
}

// --- browser side ------------------------------------------------------------

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

// --- compare -----------------------------------------------------------------

const r2 = (v) => Math.round(v * 100) / 100;

function diff(a, b) {
  const rows = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i], y = b[i];
    if (!x || !y) {
      rows.push({ id: "n" + i, miss: true, evg: x || null, css: y || null });
      continue;
    }
    const d = ["x", "y", "w", "h"].filter((k) => Math.abs(x[k] - y[k]) > EPS);
    if (d.length) rows.push({ id: "n" + i, fields: d, evg: x, css: y });
  }
  return rows;
}

// --- run ---------------------------------------------------------------------

const { chromium } = require("playwright-core");

// The repo's `findChromium` names the revision playwright-core was built
// against, which is not always the revision that is installed. Take whatever
// is actually on disk, and fall back to the user's own Chrome.
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

const exe = chromiumPath();
const browser = await chromium.launch(exe ? { executablePath: exe } : { channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

const results = [];
for (const c of CASES) {
  if (ONLY && c.id !== ONLY) continue;
  let evg, css, err = null;
  let warn = [];
  try {
    const e = evgBoxes(c.root);
    evg = e.flat;
    warn = e.warn;
    css = await browserBoxes(page, c.root);
  } catch (ex) {
    err = String(ex && ex.message ? ex.message : ex);
  }
  const rows = err ? null : diff(evg, css);
  results.push({ ...c, root: undefined, err, rows, warn, nodes: evg ? evg.length : 0, evg, css });
}

// Text cases: EVG only, and behavioural.
const textResults = [];
for (const c of TEXT_CASES) {
  if (ONLY && c.id !== ONLY) continue;
  let ok = false, boxes = null, err = null;
  try {
    boxes = evgBoxes(c.root).flat;
    ok = !!c.assert(boxes);
  } catch (ex) {
    err = String(ex && ex.message ? ex.message : ex);
  }
  textResults.push({ id: c.id, why: c.why, says: c.says, ok, err, boxes });
}

await browser.close();

if (AS_JSON) {
  console.log(JSON.stringify({ results, textResults }, null, 2));
  process.exit(0);
}

// --- report ------------------------------------------------------------------

const pad = (s, n) => String(s).padEnd(n);
let lastGroup = null;
let pass = 0, fail = 0;
const failing = [];

console.log("\nEVG layout vs Chromium — the same CSS, two engines\n");
for (const r of results) {
  if (r.group !== lastGroup) {
    console.log(`  ── ${r.group}`);
    lastGroup = r.group;
  }
  const bad = r.err || (r.rows && r.rows.length);
  if (bad) { fail++; failing.push(r); } else pass++;
  const mark = r.err ? "ERR " : r.rows.length ? "DIFF" : "ok  ";
  console.log(`     ${mark} ${pad(r.id, 26)} ${r.nodes ? r.nodes + " boxes" : ""}  ${r.rows && r.rows.length ? r.rows.length + " differ" : ""}`);
}

console.log(`\n  ${pass} of ${pass + fail} cases agree box for box.\n`);

if (failing.length) {
  console.log("  Where they differ\n");
  for (const r of failing) {
    console.log(`  ${r.id} — ${r.why}`);
    console.log(`     ${r.warn.length ? "the engine warned: " + r.warn[0] : "the engine reported nothing — the difference is silent"}`);
    if (r.err) { console.log(`     ERROR ${r.err}\n`); continue; }
    for (const d of r.rows.slice(0, VERBOSE ? 99 : 4)) {
      if (d.miss) { console.log(`     ${d.id}: one side has no such box`); continue; }
      const f = (o) => `x=${r2(o.x)} y=${r2(o.y)} w=${r2(o.w)} h=${r2(o.h)}`;
      console.log(`     ${d.id} [${d.fields.join(",")}]`);
      console.log(`        evg  ${f(d.evg)}`);
      console.log(`        css  ${f(d.css)}`);
    }
    if (!VERBOSE && r.rows.length > 4) console.log(`     … and ${r.rows.length - 4} more`);
    console.log("");
  }
}

console.log("  Text in layout (EVG only — see the note in the case file)\n");
for (const t of textResults) {
  console.log(`     ${t.err ? "ERR " : t.ok ? "ok  " : "NO  "} ${pad(t.id, 26)} ${t.says}`);
  if (t.err) console.log(`          ${t.err}`);
}
console.log("");
