#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// What layout costs in EVG (Ranger, compiled to JavaScript) and in EVGr (the
// strict Rust module, compiled to JavaScript by rgrc, and built natively by
// cargo), on the fixtures of lib/evg/bench/layout-bench.mjs: nested flex, a
// wide grid, and the flex fixture with text.
//
//   npm run evgr:speed [-- --sizes 1000,10000,100000] [--no-native]
//                         [--targets cpp,go] [--json]
//
// --targets builds bench/NativeBench.rgr, one Ranger program that lays the
// fixtures out with both engines, for C++ (g++ -O2) and Go, and adds its
// timings: EVG and EVGr compiled by Ranger to a native target.
//
// `layout` is a RE-layout of a tree that exists, the median of five after a
// warm-up, as layout-bench.mjs measures it. Every engine's boxes are summed
// into a checksum (x + y + w + h over all boxes), so the table also says
// whether the engines laid the fixture out the same way.

import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);
const EVG = require(path.join(ROOT, "lib/evg/bin/EvgLayoutBench.cjs"));
const R = require(path.join(ROOT, "lib/evgr/bin/Evgr.cjs"));

const argv = process.argv.slice(2);
const arg = (n, d) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : d);
const SIZES = arg("--sizes", "1000,10000,100000").split(",").map(Number);
const AS_JSON = argv.includes("--json");
const NATIVE = !argv.includes("--no-native");
const TARGETS = arg("--targets", "cpp,go").split(",").filter((t) => t);

// --- the fixtures: the specs of layout-bench.mjs ------------------------------

const WORDS = ["Ada Lovelace", "Grace Hopper", "Alan Turing", "Edsger Dijkstra", "Barbara McClintock"];
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

function flexSpec(n, withText) {
  const cards = Math.max(1, Math.round(n / 7));
  const kids = [];
  for (let i = 0; i < cards; i++) {
    const lines = [];
    for (let j = 0; j < 4; j++) {
      lines.push(withText && j === 0 ? { s: S.text, kids: [], text: WORDS[i % WORDS.length] } : { s: S.line, kids: [] });
    }
    kids.push({ s: S.card, kids: [{ s: S.rail, kids: [] }, { s: S.body, kids: lines }] });
  }
  return { s: S.page, kids };
}

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

const FIXTURES = { flex: (n) => flexSpec(n, false), grid: gridSpec, text: (n) => flexSpec(n, true) };

// --- timing -------------------------------------------------------------------

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s[s.length >> 1];
}

function time(fn, runs) {
  const t = [];
  for (let i = 0; i < runs; i++) {
    const a = process.hrtime.bigint();
    fn();
    t.push(Number(process.hrtime.bigint() - a) / 1e6);
  }
  return median(t);
}

// --- EVG ----------------------------------------------------------------------

function evgBuild(node) {
  const el = new EVG.EVGElement();
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
  for (const k of node.kids) el.addChild(evgBuild(k));
  return el;
}

function evgRun(spec) {
  const build = time(() => evgBuild(spec), 3);
  const root = evgBuild(spec);
  const lay = new EVG.EVGLayout();
  lay.setPageSize(1200, 900);
  lay.layout(root);
  const layout = time(() => lay.layout(root), 5);
  let sum = 0;
  let nodes = 0;
  (function walk(el) {
    sum += el.calculatedX + el.calculatedY + el.calculatedWidth + el.calculatedHeight;
    nodes++;
    for (const k of el.children) walk(k);
  })(root);
  return { nodes, build, layout, checksum: sum };
}

// --- EVGr (JavaScript) ----------------------------------------------------------

function evgrBuild(spec) {
  const t = R.EvgrTree.new_();
  (function add(node, parent) {
    const i = node.text !== undefined ? t.add_text(parent, node.s, node.text) : t.add(parent, node.s);
    for (const k of node.kids) add(k, i);
  })(spec, -1);
  return t;
}

function evgrRun(spec) {
  const build = time(() => evgrBuild(spec), 3);
  const t = evgrBuild(spec);
  t.layout(1200, 900);
  const layout = time(() => t.layout(1200, 900), 5);
  let sum = 0;
  for (let i = 0; i < t.count(); i++) sum += t.x(i) + t.y(i) + t.w(i) + t.h(i);
  return { nodes: t.count(), build, layout, checksum: sum };
}

// --- EVGr (native) --------------------------------------------------------------

function nativeRuns() {
  const out = {};
  try {
    const text = execFileSync(
      "cargo",
      ["run", "--release", "--offline", "--quiet", "--bin", "bench", "--manifest-path", path.join(ROOT, "lib/evgr/Cargo.toml"), "--", SIZES.join(",")],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], env: { ...process.env, CARGO_TARGET_DIR: path.join(ROOT, "lib/evgr/target") } }
    );
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      const r = JSON.parse(line);
      out[r.fixture + ":" + r.size] = r;
    }
  } catch (e) {
    return null;
  }
  return out;
}

// --- EVG and EVGr through Ranger to C++ / Go (bench/NativeBench.rgr) ------------

function has(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function rangerTargetRuns(target) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evgr-" + target + "-"));
  const out = target === "cpp" ? "nb.cpp" : "nb.go";
  try {
    const log = execFileSync("node", [path.join(ROOT, "dist/rgrc.js"), "-l=" + target, path.join(ROOT, "lib/evgr/bench/NativeBench.rgr"), "-d=" + dir, "-o=" + out], {
      encoding: "utf8",
      cwd: ROOT,
    });
    if (log.includes("[FAIL]")) return null;
    const bin = path.join(dir, "nb");
    if (target === "cpp") execFileSync("g++", ["-std=c++17", "-O2", "-o", bin, path.join(dir, out)], { stdio: "ignore" });
    else execFileSync("go", ["build", "-o", bin, out], { cwd: dir, stdio: "ignore" });
    const text = execFileSync(bin, [], { encoding: "utf8", maxBuffer: 1 << 24 });
    const res = {};
    for (const line of text.split("\n")) {
      const p = line.trim().split(/\s+/);
      if (p.length < 6) continue;
      res[p[0] + ":" + p[1] + ":" + p[2]] = { nodes: Number(p[3]), layout: Number(p[4]), checksum: Number(p[5]) * 100 };
    }
    return res;
  } catch (e) {
    return null;
  }
}

// --- run ------------------------------------------------------------------------

const native = NATIVE ? nativeRuns() : null;
const ranger = {};
for (const t of TARGETS) {
  const ok = t === "cpp" ? has("g++", ["--version"]) : t === "go" ? has("go", ["version"]) : false;
  if (ok) ranger[t] = rangerTargetRuns(t);
}
const rows = [];
for (const name of Object.keys(FIXTURES)) {
  for (const n of SIZES) {
    const spec = FIXTURES[name](n);
    const e = evgRun(spec);
    const r = evgrRun(spec);
    const nat = native ? native[name + ":" + n] : null;
    const other = {};
    for (const t of Object.keys(ranger)) {
      if (!ranger[t]) continue;
      other[t] = { evg: ranger[t][name + ":" + n + ":evg"], evgr: ranger[t][name + ":" + n + ":evgr"] };
    }
    rows.push({ fixture: name, size: n, evg: e, evgr: r, native: nat, other });
  }
}

if (AS_JSON) {
  process.stdout.write(JSON.stringify(rows, null, 2) + "\n");
} else {
  const f = (v) => (v === undefined || v === null ? "-" : v < 10 ? v.toFixed(2) : v.toFixed(1));
  const same = (a, b) => (b === undefined || b === null ? "-" : Math.abs(a - b) <= Math.max(1e-6 * Math.abs(a), 0.01) ? "=" : "≠");
  const pad = (s, n) => String(s).padStart(n);
  console.log("\nLayout (re-layout, median ms) — EVG vs EVGr\n");
  console.log(`  ${"fixture".padEnd(8)}${pad("nodes", 8)}${pad("EVG js", 10)}${pad("EVGr js", 10)}${pad("EVGr rs", 10)}${pad("js/js", 8)}${pad("EVG/rs", 8)}   boxes EVG:EVGr:rs`);
  for (const r of rows) {
    const nl = r.native ? r.native.layout : null;
    console.log(
      `  ${r.fixture.padEnd(8)}${pad(r.evg.nodes, 8)}${pad(f(r.evg.layout), 10)}${pad(f(r.evgr.layout), 10)}${pad(f(nl), 10)}` +
        `${pad((r.evg.layout / r.evgr.layout).toFixed(1) + "x", 8)}${pad(nl ? (r.evg.layout / nl).toFixed(1) + "x" : "-", 8)}` +
        `   ${same(r.evg.checksum, r.evgr.checksum)} ${same(r.evgr.checksum, r.native ? r.native.checksum : null)}`
    );
  }
  console.log("\n  Building the tree (median ms)\n");
  console.log(`  ${"fixture".padEnd(8)}${pad("nodes", 8)}${pad("EVG js", 10)}${pad("EVGr js", 10)}${pad("EVGr rs", 10)}`);
  for (const r of rows) {
    console.log(`  ${r.fixture.padEnd(8)}${pad(r.evg.nodes, 8)}${pad(f(r.evg.build), 10)}${pad(f(r.evgr.build), 10)}${pad(f(r.native ? r.native.build : null), 10)}`);
  }
  const targets = Object.keys(ranger).filter((t) => ranger[t]);
  if (targets.length) {
    console.log("\n  Through Ranger to native targets (bench/NativeBench.rgr), re-layout median ms\n");
    let head = `  ${"fixture".padEnd(8)}${pad("nodes", 8)}`;
    for (const t of targets) head += `${pad("EVG " + t, 10)}${pad("EVGr " + t, 11)}${pad("ratio", 7)}`;
    console.log(head + "   boxes");
    for (const r of rows) {
      let line = `  ${r.fixture.padEnd(8)}${pad(r.evg.nodes, 8)}`;
      let agree = true;
      for (const t of targets) {
        const o = r.other[t] || {};
        const ev = o.evg, er = o.evgr;
        line += `${pad(f(ev && ev.layout), 10)}${pad(f(er && er.layout), 11)}${pad(ev && er ? (ev.layout / er.layout).toFixed(1) + "x" : "-", 7)}`;
        // checksums are printed in hundreds
        if (!ev || !er || Math.abs(ev.checksum - er.checksum) > 100 || Math.abs(ev.checksum - r.evg.checksum) > 200) agree = false;
      }
      console.log(line + "   " + (agree ? "=" : "≠"));
    }
  }
  console.log("\n  js/js: EVG time over EVGr time, both JavaScript. EVG/rs: EVG (js) over EVGr native.");
  console.log("  boxes: = when the checksums of all boxes agree (EVG with EVGr js, EVGr js with native).\n");
}
