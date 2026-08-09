// Four-way comparison on the seven native-bench workloads:
//   raw Node, raw QuickJS (qjs), engine/ES6 (Node module), engine/C++ (g++ -O3).
//
// Usage (from repo root, after building):
//   bash scripts/build-engine-module.sh
//   TARGET=cpp bash gallery/game_engine/v2/interp/bench/native/build.sh
//   node gallery/game_engine/v2/interp/bench/native/vs_quickjs.cjs
//
"use strict";
const vm = require("vm");
const path = require("path");
const fs = require("fs");
const { execFileSync, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../../../../../..");
const BENCH_DIR = __dirname;
const RAW_BENCH = path.join(BENCH_DIR, "..", "raw_bench.js");
const ENGINE_MOD = path.join(BENCH_DIR, "..", "..", "bin", "engine_module.cjs");
const CPP_BIN = path.join(BENCH_DIR, "..", "..", "bin", "cpp", "engine_bench");

const mod = require(ENGINE_MOD);
const { ComponentEngine } = mod;
const EvalValue = mod.EvHandle || mod.EvalValue;

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
const REPS = Number(process.argv[2] || 3);

function runNode(src) {
  const ctx = { __out__: "" };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return String(ctx.__out__);
}

function runJsEngine(src) {
  const e = new ComponentEngine();
  e.quiet = true;
  const o = console.log;
  console.log = () => {};
  try {
    e.loadScript("var __out__ = '';\n" + src + "\nfunction __t__() { return String(__out__); }\n");
    const r = e.callFunction("__t__", EvalValue.null());
    if (!r) return "<null>";
    return String(r.stringOf ? r.stringOf() : r.stringValue);
  } finally {
    console.log = o;
  }
}

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

function timeNative(caseName, reps) {
  let best = Infinity;
  let answer = "";
  for (let i = 0; i < 3; i++) {
    const t0 = process.hrtime.bigint();
    const out = execFileSync(CPP_BIN, [caseName, String(reps)], { encoding: "utf8" });
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    if (ms < best) best = ms;
    const m = /answer=(\S+)/.exec(out);
    if (m) answer = m[1];
  }
  return { ms: best, answer };
}

/**
 * Per-rep cost of one case on the native binary, with the process launch AND
 * the per-rep engine construction + script parse removed.
 *
 * bench_main builds a fresh ComponentEngine and re-parses the source on every
 * rep, so `(reps=N − reps=0) / N` is construct + parse + run, not run. That
 * floor is 0.77 ms here — a third of the `strcat` reading — and the ES6 column
 * has always had its own floor subtracted (`jsFloor`). Leaving it in on one
 * side only made the C++ engine look slower than the ES6 engine on the short
 * cases, which is the opposite of what run.cjs reports for the same binary.
 */
function nativePerRep(caseName, reps) {
  const base = timeNative(caseName, 0);
  const withWork = timeNative(caseName, reps);
  return { ms: (withWork.ms - base.ms) / reps, answer: withWork.answer };
}

/** Parse `name ms/run=1.234 answer=…` from raw_bench.js. */
function parseRaw(out) {
  const m = /(\S+)\s+ms\/run=([0-9.]+)\s+answer=(\S+)/.exec(out);
  if (!m) throw new Error("bad raw_bench output:\n" + out);
  return { ms: Number(m[2]), answer: m[3] };
}

function runRawHost(host, caseName) {
  // host: "node" | "qjs"
  const bin = host === "qjs" ? "qjs" : process.execPath;
  const r = spawnSync(bin, [RAW_BENCH, caseName], {
    encoding: "utf8",
    cwd: ROOT,
  });
  if (r.status !== 0) {
    throw new Error(`${host} ${caseName} failed:\n${r.stderr || r.stdout}`);
  }
  return parseRaw(r.stdout.trim());
}

if (!fs.existsSync(CPP_BIN)) {
  console.error("missing C++ binary:", CPP_BIN);
  console.error("build with: TARGET=cpp bash gallery/game_engine/v2/interp/bench/native/build.sh");
  process.exit(1);
}
if (!fs.existsSync(ENGINE_MOD)) {
  console.error("missing engine module:", ENGINE_MOD);
  console.error("build with: bash scripts/build-engine-module.sh");
  process.exit(1);
}

const qjsCheck = spawnSync("qjs", ["-e", "print(1)"], { encoding: "utf8" });
if (qjsCheck.status !== 0) {
  console.error("qjs not available on PATH");
  process.exit(1);
}

const emptySrc = wrap(EMPTY);
const nodeFloor = timeBest(() => runNode(emptySrc), 25);
// Warm V8 on the engine's own dispatch loop before taking the floor: best-of-3
// on a cold engine reads ~1.7x its warm cost, which is larger than most of the
// differences this table is trying to show.
for (let i = 0; i < 10; i++) runJsEngine(emptySrc);
const jsFloor = timeBest(() => runJsEngine(emptySrc), 25);
// `__empty__` is not a declared case, so bench_main falls through to
// `return 0;` — the native counterpart of emptySrc.
const cppFloor = nativePerRep("__empty__", REPS).ms;

const rows = [];
let mismatches = 0;

for (const [name, body] of CASES) {
  const src = wrap(body);
  const wantNode = runNode(src);
  const gotJs = runJsEngine(src);

  const rawNode = runRawHost("node", name);
  const rawQjs = runRawHost("qjs", name);

  const withWork = nativePerRep(name, REPS);
  const cppMs = Math.max(1e-4, withWork.ms - cppFloor);

  const agree =
    wantNode === gotJs &&
    wantNode === withWork.answer &&
    wantNode === String(rawNode.answer) &&
    wantNode === String(rawQjs.answer);
  if (!agree) mismatches++;

  rows.push({
    name,
    agree,
    wantNode,
    gotJs,
    gotCpp: withWork.answer,
    gotQjs: String(rawQjs.answer),
    node: Math.max(1e-4, timeBest(() => runNode(src), 25) - nodeFloor),
    qjs: rawQjs.ms,
    js: Math.max(1e-4, timeBest(() => runJsEngine(src), 15) - jsFloor),
    cpp: cppMs,
  });
}

const fmt = (ms) => (ms < 10 ? ms.toFixed(3) : ms.toFixed(1));
const ratio = (a, b) => (b <= 0 ? "—" : (a / b).toFixed(1) + "x");

console.log("ms/run (best-of / adaptive). Lower is faster.");
console.log(
  "case".padEnd(8) +
    "raw Node".padStart(10) +
    "raw QuickJS".padStart(12) +
    "eng/ES6".padStart(10) +
    "eng/C++".padStart(10) +
    " | ES6/QJS".padStart(10) +
    " C++/QJS".padStart(10) +
    "  ok"
);
console.log("-".repeat(82));

const geoms = { node: 1, qjs: 1, js: 1, cpp: 1 };
for (const r of rows) {
  geoms.node *= r.node;
  geoms.qjs *= r.qjs;
  geoms.js *= r.js;
  geoms.cpp *= r.cpp;
  console.log(
    r.name.padEnd(8) +
      fmt(r.node).padStart(10) +
      fmt(r.qjs).padStart(12) +
      fmt(r.js).padStart(10) +
      fmt(r.cpp).padStart(10) +
      (" | " + ratio(r.js, r.qjs)).padStart(10) +
      ratio(r.cpp, r.qjs).padStart(10) +
      (r.agree ? "  OK" : "  !!")
  );
  if (!r.agree) {
    console.log(
      "         answers node=" +
        r.wantNode +
        " es6=" +
        r.gotJs +
        " cpp=" +
        r.gotCpp +
        " qjs=" +
        r.gotQjs
    );
  }
}

const n = rows.length;
const g = (x) => Math.pow(x, 1 / n);
console.log("-".repeat(82));
console.log(
  "geomean".padEnd(8) +
    fmt(g(geoms.node)).padStart(10) +
    fmt(g(geoms.qjs)).padStart(12) +
    fmt(g(geoms.js)).padStart(10) +
    fmt(g(geoms.cpp)).padStart(10) +
    (" | " + ratio(g(geoms.js), g(geoms.qjs))).padStart(10) +
    ratio(g(geoms.cpp), g(geoms.qjs)).padStart(10)
);
console.log(
  "\nratios: eng/ES6 and eng/C++ are ComponentEngine (post E4e). " +
    "raw QuickJS is qjs running the same bodies via raw_bench.js."
);
if (mismatches) {
  console.log("WARNING:", mismatches, "case(s) disagreed on answers");
  process.exitCode = 1;
}
