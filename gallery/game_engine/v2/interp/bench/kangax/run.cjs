#!/usr/bin/env node
// The kangax compat-table suites, run through ComponentEngine with the same
// weighting zoo.js.org uses for its ES6 / ES2016+ / ESIntl columns.
//
//   node run.cjs <zoo-checkout> [era ...]
//
// The test files come from ivankra/javascript-zoo, which extracts each
// compat-table subtest into a standalone script that prints "<name>: OK" when
// it passes. The weighting is the table's own: every FEATURE row is worth
// tiny=1, small=2, medium=4 or large=8, shared equally between the subtests
// under it, so a feature with twenty subtests does not outweigh twenty
// features with one each. A file outside any row weighs 1.
//
// Two things about the runner rather than the tests:
//
//   * Each file gets a FRESH engine, and the file it is about to run is
//     recorded on disk first. A file that hangs the engine (there is no
//     watchdog inside it) is therefore recorded as a failure when the
//     supervisor restarts the process, instead of ending the measurement.
//   * `liveClock` is on. The async tests drive their own job queue off
//     Date.now(), so a frozen clock makes them time out rather than fail
//     honestly -- and a suite that reports a real feature as missing is worse
//     than no suite.
"use strict";
const fs = require("fs");
const path = require("path");

const ENGINE = process.env.ENGINE ||
  path.resolve(__dirname, "..", "..", "bin", "engine_module.cjs");
const mod = require(ENGINE);
const ComponentEngine = mod.ComponentEngine;
const EvalValue = mod.EvHandle || mod.EvalValue;

const SIZE = { tiny: 1, small: 2, medium: 4, large: 8 };
const HEADER = /^\/\/ compat-table: (.*)$/m;
const GROUP = /^(.*) \((tiny|small|medium|large)\) > .*/;

function usage() {
  console.log("usage: run.cjs <zoo-checkout> [era ...]   (era: es5 es6 es2016 .. es2025 intl next)");
  console.log("       ERAS=es6 JSONL=/tmp/es6.jsonl node run.cjs <zoo-checkout>");
  process.exit(2);
}

const zooRoot = process.argv[2];
if (!zooRoot) usage();
const root = path.join(zooRoot, "conformance", "compat-table");
if (!fs.existsSync(root)) {
  console.log(`no compat-table tests under ${root}`);
  process.exit(2);
}

const eras = process.argv.slice(3).length
  ? process.argv.slice(3)
  : (process.env.ERAS || "es6").split(/[,\s]+/).filter(Boolean);

// One line per finished file, so a restart resumes rather than starting over.
const JSONL = process.env.JSONL || "";
const MARK = JSONL ? JSONL + ".running" : "";

const done = new Map();
if (JSONL && fs.existsSync(JSONL)) {
  for (const line of fs.readFileSync(JSONL, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line); done.set(r.rel, r); } catch (e) { /* half-written line */ }
  }
}
if (MARK && fs.existsSync(MARK)) {
  const rel = fs.readFileSync(MARK, "utf8").trim();
  if (rel && !done.has(rel)) {
    const r = { rel, ok: false, out: "", err: "did not finish (hang or crash)" };
    done.set(rel, r);
    fs.appendFileSync(JSONL, JSON.stringify(r) + "\n");
  }
  fs.unlinkSync(MARK);
}

const files = [];
for (const era of eras) {
  const dir = path.join(root, era);
  if (!fs.existsSync(dir)) {
    console.log(`-- skipping ${era}: no ${dir}`);
    continue;
  }
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort()) {
    const rel = era + "/" + name;
    const src = fs.readFileSync(path.join(dir, name), "utf8");
    const m = HEADER.exec(src.split("\n").slice(0, 8).join("\n"));
    files.push({ rel, src, header: m ? m[1] : null });
  }
}
if (!files.length) usage();

// Weights: a row's size, split between the subtests the row holds.
const groups = new Map();
for (const t of files) {
  const m = t.header && GROUP.exec(t.header);
  t.group = m ? m[1] : null;
  t.size = m ? SIZE[m[2]] : 1;
  if (m) groups.set(t.group, (groups.get(t.group) || 0) + 1);
}
for (const t of files) t.weight = t.group ? t.size / groups.get(t.group) : 1;

function runOne(t) {
  let out = "";
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = (s) => { out += s; return true; };
  let err = null;
  try {
    const e = new ComponentEngine();
    e.quiet = true;
    e.liveClock = true;
    e.maxLoopIterations = 100000000;
    e.loadScript(t.src + "\nfunction __kangax_done__() { return 'done'; }\n");
    e.callFunction("__kangax_done__", EvalValue.null());
  } catch (ex) {
    err = ex && ex.message ? ex.message : String(ex);
  }
  process.stdout.write = write;
  return { rel: t.rel, ok: /: OK/.test(out), out: out.trim().slice(0, 200), err };
}

let ran = 0;
for (const t of files) {
  if (done.has(t.rel)) continue;
  if (MARK) fs.writeFileSync(MARK, t.rel);
  const r = runOne(t);
  done.set(t.rel, r);
  if (JSONL) {
    fs.appendFileSync(JSONL, JSON.stringify(r) + "\n");
    fs.unlinkSync(MARK);
  }
  ran = ran + 1;
}

// Report: the column percentage, then every group that lost weight.
let total = 0, passed = 0;
const lost = new Map();
for (const t of files) {
  const r = done.get(t.rel);
  total += t.weight;
  if (r && r.ok) { passed += t.weight; continue; }
  const key = t.group || "(no group)";
  const row = lost.get(key) || { w: 0, files: [] };
  row.w += t.weight;
  row.files.push({ name: t.rel.split("/").pop(), w: t.weight, why: (r && (r.out || r.err)) || "not run" });
  lost.set(key, row);
}

const pct = total > 0 ? (100 * passed / total) : 0;
console.log(`${eras.join(",")}: ${passed.toFixed(2)} / ${total.toFixed(2)} = ${pct.toFixed(2)}%   (${files.filter((t) => done.get(t.rel) && done.get(t.rel).ok).length}/${files.length} files, ${ran} run now)`);
if (process.env.QUIET === "1") process.exit(0);
const rows = [...lost.entries()].sort((a, b) => b[1].w - a[1].w);
for (const [name, row] of rows) {
  console.log(`\n${row.w.toFixed(2).padStart(6)} pts  ${name}`);
  for (const f of row.files) {
    console.log(`        ${f.w.toFixed(2)} ${f.name}  >> ${String(f.why).replace(/\n/g, " | ").slice(0, 110)}`);
  }
}
