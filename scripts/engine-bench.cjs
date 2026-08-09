#!/usr/bin/env node
// The ComponentEngine interpreter against Node — and against QuickJS and every
// native target that was built — on one table, measured one way.
//
//   npm run engine:bench            # default reps
//   npm run engine:bench -- 60      # more reps: slower, less noise
//
// Columns, all in ms per run of the same seven workload bodies:
//
//   node        the body run by Node itself. Not the engine — the ceiling.
//   qjs         the body run by QuickJS, if `qjs` is on PATH.
//   es6         the interpreter compiled to JavaScript, run in-process.
//   cpp / rust  the interpreter compiled to that target and built natively.
//
// HOW THIS IS MEASURED, because it is easy to get wrong and the first version
// of this comparison did:
//
//   * node and qjs compile the body once and re-run it, adaptive until the
//     timed window passes 300 ms (see bench/raw_bench.js). No engine involved.
//   * es6 and the native targets build a FRESH interpreter and re-parse the
//     source on every rep, so a raw per-rep number is construct + parse + run.
//     Both therefore subtract an empty-body floor measured exactly the same
//     way. Subtracting it on one side only makes the native engine look slower
//     than the JS one, which is not true.
//   * The es6 column warms V8 before taking its floor. Best-of-3 on a cold V8
//     reads about 1.7x its warm cost, which is larger than most differences
//     this table is trying to show.
//
// Every row is also checked for AGREEMENT: each engine must produce the answer
// Node produces, or the row is marked and the process exits non-zero. A fast
// wrong answer is not a result.
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const INTERP = path.join(ROOT, "gallery", "game_engine", "v2", "interp");
const ENGINE_MOD = path.join(INTERP, "bin", "engine_module.cjs");
const RAW_BENCH = path.join(INTERP, "bench", "raw_bench.js");
const NATIVE_TARGETS = ["cpp", "rust"];

const REPS = Number(process.argv[2] || 20);

// Byte-identical to bench_main.rgr's caseBody and to raw_bench.js. A different
// size is a different benchmark, so these three copies must not drift.
const CASES = [
  ["loop", `var s = 0; for (var i = 0; i < 50000; i++) { s += i; } return s;`],
  ["fib", `function fib(k) { return k < 2 ? k : fib(k - 1) + fib(k - 2); } return fib(20);`],
  ["strcat", `var s = ""; for (var i = 0; i < 20000; i++) { s += "ab"; } return s.length;`],
  ["array", `var a = []; for (var i = 0; i < 20000; i++) { a.push(i * 2); } var t = 0; for (var j = 0; j < a.length; j++) { t += a[j]; } return t + a.length;`],
  ["object", `var o = {}; for (var i = 0; i < 20000; i++) { o["k" + (i % 50)] = i; } var t = 0; for (var k in o) { t += o[k]; } return t;`],
  ["method", `var s = "The quick brown fox jumps over the lazy dog"; var t = 0; for (var i = 0; i < 20000; i++) { t += s.slice(i % 10, 20).indexOf("o") + s.charCodeAt(i % 40); } return t;`],
  ["regex", `var re = /([a-z]+)\\s+(\\d+)/; var t = 0; for (var i = 0; i < 5000; i++) { var m = re.exec("item " + i + " qty 42"); if (m) { t += m[2].length; } } return t;`],
];
const EMPTY = `return 0;`;
const wrap = (body) => `function work() {${body}\n}\n__out__ = String(work());`;

function die(msg, hint) {
  console.error(`\n${msg}`);
  if (hint) console.error(hint);
  process.exit(1);
}

if (!fs.existsSync(ENGINE_MOD)) {
  die(`missing the es6 engine: ${path.relative(ROOT, ENGINE_MOD)}`,
      "build it with:  npm run engine:build");
}

const mod = require(ENGINE_MOD);
const { ComponentEngine } = mod;
const EvalValue = mod.EvHandle || mod.EvalValue;

const nativeBin = (t) => path.join(INTERP, "bin", t, "engine_bench");
const builtTargets = NATIVE_TARGETS.filter((t) => fs.existsSync(nativeBin(t)));
const haveQjs =
  spawnSync("qjs", ["-e", "print(1)"], { encoding: "utf8" }).status === 0;

// ---------------------------------------------------------------- timing ---

function timeBest(fn, reps) {
  let best = Infinity;
  for (let i = 0; i < reps; i++) {
    const t0 = process.hrtime.bigint();
    fn();
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    if (ms < best) best = ms;
  }
  return best;
}

function runNode(src) {
  const ctx = { __out__: "" };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return String(ctx.__out__);
}

function runEs6Engine(src) {
  const e = new ComponentEngine();
  e.quiet = true;
  const log = console.log;
  console.log = () => {};
  try {
    e.loadScript(
      "var __out__ = '';\n" + src + "\nfunction __t__() { return String(__out__); }\n");
    const r = e.callFunction("__t__", EvalValue.null());
    if (!r) return "<null>";
    return String(r.stringOf ? r.stringOf() : r.stringValue);
  } finally {
    console.log = log;
  }
}

/** Best-of-3 launches of `<bin> <case> <reps>`. */
function timeNative(bin, caseName, reps) {
  let best = Infinity;
  let answer = "";
  for (let i = 0; i < 3; i++) {
    const t0 = process.hrtime.bigint();
    const out = execFileSync(bin, [caseName, String(reps)], { encoding: "utf8" });
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    if (ms < best) best = ms;
    const m = /answer=(\S+)/.exec(out);
    if (m) answer = m[1];
  }
  return { ms: best, answer };
}

/** Per-rep cost with the process launch removed (reps=0 does the startup only). */
function nativePerRep(bin, caseName, reps) {
  const base = timeNative(bin, caseName, 0);
  const work = timeNative(bin, caseName, reps);
  return { ms: (work.ms - base.ms) / reps, answer: work.answer };
}

/** raw_bench.js on `node` or `qjs`: compiles once, adaptive, reports ms/run. */
function runRawHost(host, caseName) {
  const bin = host === "qjs" ? "qjs" : process.execPath;
  const r = spawnSync(bin, [RAW_BENCH, caseName], { encoding: "utf8", cwd: ROOT });
  if (r.status !== 0) {
    throw new Error(`${host} ${caseName} failed:\n${r.stderr || r.stdout}`);
  }
  const m = /(\S+)\s+ms\/run=([0-9.]+)\s+answer=(\S+)/.exec(r.stdout.trim());
  if (!m) throw new Error(`bad raw_bench output from ${host}:\n${r.stdout}`);
  return { ms: Number(m[2]), answer: m[3] };
}

// ----------------------------------------------------------------- floors ---

const emptySrc = wrap(EMPTY);
for (let i = 0; i < 10; i++) runEs6Engine(emptySrc); // warm V8 first
const es6Floor = timeBest(() => runEs6Engine(emptySrc), 25);
// `__empty__` is not a declared case, so bench_main falls through to
// `return 0;` — the native counterpart of emptySrc.
const nativeFloor = {};
for (const t of builtTargets) {
  nativeFloor[t] = nativePerRep(nativeBin(t), "__empty__", REPS).ms;
}

// ------------------------------------------------------------------- run ---

console.log(`\nComponentEngine vs Node — ms per run, lower is faster (reps=${REPS})`);
if (!builtTargets.length) {
  console.log("no native binary found; run `npm run engine:build` for cpp/rust columns");
}
if (!haveQjs) {
  console.log("qjs not on PATH; install QuickJS for the reference column");
}

const cols = ["node", ...(haveQjs ? ["qjs"] : []), "es6", ...builtTargets];
const header =
  "case".padEnd(9) + cols.map((c) => c.padStart(10)).join("") + "   vs node   ok";
console.log("\n" + header);
console.log("-".repeat(header.length));

const rows = [];
let disagreed = 0;

for (const [name, body] of CASES) {
  const src = wrap(body);
  const want = runNode(src);
  const r = { name, want, ms: {}, answers: {} };

  r.ms.node = runRawHost("node", name).ms;
  r.answers.node = want;
  if (haveQjs) {
    const q = runRawHost("qjs", name);
    r.ms.qjs = q.ms;
    r.answers.qjs = String(q.answer);
  }

  r.answers.es6 = runEs6Engine(src);
  r.ms.es6 = Math.max(1e-4, timeBest(() => runEs6Engine(src), 15) - es6Floor);

  for (const t of builtTargets) {
    const n = nativePerRep(nativeBin(t), name, REPS);
    r.ms[t] = Math.max(1e-4, n.ms - nativeFloor[t]);
    r.answers[t] = n.answer;
  }

  r.agree = cols.every((c) => String(r.answers[c]) === want);
  if (!r.agree) disagreed++;
  rows.push(r);

  const fmt = (ms) => (ms < 10 ? ms.toFixed(3) : ms.toFixed(1));
  const fastestEngine = Math.min(...["es6", ...builtTargets].map((c) => r.ms[c]));
  console.log(
    name.padEnd(9) +
      cols.map((c) => fmt(r.ms[c]).padStart(10)).join("") +
      (fastestEngine / r.ms.node).toFixed(1).padStart(8) + "x" +
      (r.agree ? "   OK" : "   !!")
  );
}

console.log("-".repeat(header.length));
const geo = (c) =>
  Math.pow(rows.reduce((a, r) => a * r.ms[c], 1), 1 / rows.length);
console.log(
  "geomean".padEnd(9) + cols.map((c) => {
    const g = geo(c);
    return (g < 10 ? g.toFixed(3) : g.toFixed(1)).padStart(10);
  }).join(""));

if (haveQjs) {
  console.log("\nagainst QuickJS (lower is better, 1.0x would be parity):");
  for (const c of ["es6", ...builtTargets]) {
    const all = geo(c) / geo("qjs");
    const noStrcat = (() => {
      const keep = rows.filter((r) => r.name !== "strcat");
      const g = (k) => Math.pow(keep.reduce((a, r) => a * r.ms[k], 1), 1 / keep.length);
      return g(c) / g("qjs");
    })();
    console.log(
      `  ${c.padEnd(6)} ${all.toFixed(1)}x   (${noStrcat.toFixed(1)}x excluding strcat)`);
  }
  console.log(
    "\n  Quote the second number. QuickJS 2021-03-27 has no string ropes, so its\n" +
    "  `s += \"ab\"` is quadratic and the strcat row flatters us by 5-10x. See\n" +
    "  QUICKJS_COMPARISON.md.");
}

for (const r of rows.filter((x) => !x.agree)) {
  console.log(`\n!! ${r.name}: node says ${r.want}`);
  for (const c of cols) {
    if (String(r.answers[c]) !== r.want) console.log(`     ${c} says ${r.answers[c]}`);
  }
}

if (disagreed) {
  console.error(`\n${disagreed} row(s) disagreed with Node. A fast wrong answer is not a result.`);
  process.exit(1);
}
console.log("\nall targets agree with Node.\n");
