// The interpreter benchmark across compilation targets.
//
// Three columns for the same seven workloads:
//
//   node        the script run by Node itself, the baseline
//   js engine   the interpreter compiled to JavaScript, run under Node
//   cpp engine  the interpreter compiled to C++ and built with g++ -O2
//
// The native binary has no clock (the language has no timing operator), so it
// is measured from the outside: a `reps=0` run does the startup work and no
// iterations, a `reps=N` run does N, and the difference over N is the per-run
// cost. That is the same subtraction the in-process columns make against their
// own `empty` case, so all three are measured the same way.
//
//   node run.cjs         # default reps
//   node run.cjs 5       # 5 reps per timed native run
const vm = require("vm");
const path = require("path");
const { execFileSync } = require("child_process");
const mod = require(
  path.join(__dirname, "..", "..", "bin", "engine_module.cjs"));
const { ComponentEngine } = mod;
const EvalValue = mod.EvHandle || mod.EvalValue;

const BIN = path.join(__dirname, "..", "..", "bin", "cpp", "engine_bench");
const REPS = Number(process.argv[2] || 3);

// Kept byte-identical to bench_main.rgr's caseBody and to bench.cjs.
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

// Not workloads. `keyorder` checks that both targets enumerate string keys the
// way JavaScript does (insertion order); `array_half` is `array` at half size,
// so the array path's scaling is visible rather than assumed.
const CANARIES = [
  ["keyorder", `var o = {}; o.zebra = 1; o.apple = 2; o.mango = 3; o["2"] = 4; o["1"] = 5; return Object.keys(o).join(",") + "|" + JSON.stringify(o);`],
  ["array_half", `var a = []; for (var i = 0; i < 10000; i++) { a.push(i * 2); } var t = 0; for (var j = 0; j < a.length; j++) { t += a[j]; } return t + a.length;`],
];
const wrap = (body) => `function work() {${body}\n}\n__out__ = String(work());`;

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
    return r ? String(r.stringOf ? r.stringOf() : r.stringValue) : "<null>";
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

// Wall time of the native binary, best of 3 -- process launch included, which
// is why the reps=0 run is subtracted rather than assumed to be zero.
function timeNative(caseName, reps) {
  let best = Infinity;
  let answer = "";
  for (let i = 0; i < 3; i++) {
    const t0 = process.hrtime.bigint();
    const out = execFileSync(BIN, [caseName, String(reps)], { encoding: "utf8" });
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    if (ms < best) best = ms;
    const m = /answer=(\S+)/.exec(out);
    if (m) answer = m[1];
  }
  return { ms: best, answer };
}

const fmt = (ms) => (ms < 10 ? ms.toFixed(2) : ms.toFixed(1));

// In-process floors, subtracted from the in-process columns.
const emptySrc = wrap(EMPTY);
const nodeFloor = timeBest(() => runNode(emptySrc), 25);
const jsFloor = timeBest(() => runJsEngine(emptySrc), 5);

const rows = [];
let mismatches = 0;
for (const [name, body] of CASES) {
  const src = wrap(body);
  const wantNode = runNode(src);
  const gotJs = runJsEngine(src);

  // Native: (reps=N) - (reps=0), which removes process launch and startup.
  const base = timeNative(name, 0);
  const withWork = timeNative(name, REPS);
  const cppMs = Math.max(1e-4, (withWork.ms - base.ms) / REPS);

  const agree = wantNode === gotJs && wantNode === withWork.answer;
  if (!agree) mismatches++;

  rows.push({
    name, agree, wantNode, gotJs, gotCpp: withWork.answer,
    node: Math.max(1e-4, timeBest(() => runNode(src), 25) - nodeFloor),
    js: Math.max(1e-4, timeBest(() => runJsEngine(src), 3) - jsFloor),
    cpp: cppMs,
  });
}

console.log(`reps ${REPS}   native launch+startup floor: ${fmt(timeNative("loop", 0).ms)} ms\n`);
console.log("case        node ms   js engine   cpp engine  |  js/node  cpp/node   cpp vs js   same");
console.log("-".repeat(88));
for (const r of rows) {
  const speedup = r.js / r.cpp;
  console.log(
    r.name.padEnd(9) +
    fmt(r.node).padStart(9) + fmt(r.js).padStart(12) + fmt(r.cpp).padStart(13) + "  |" +
    (r.js / r.node).toFixed(0).padStart(8) + "x" +
    (r.cpp / r.node).toFixed(0).padStart(9) + "x" +
    (speedup.toFixed(2) + "x").padStart(12) +
    (r.agree ? "   yes" : "   NO"));
}
console.log("-".repeat(88));
const geo = (sel) => Math.exp(rows.reduce((a, r) => a + Math.log(sel(r)), 0) / rows.length);
console.log("geometric mean vs Node:  js engine " + geo((r) => r.js / r.node).toFixed(0) +
            "x,  cpp engine " + geo((r) => r.cpp / r.node).toFixed(0) + "x");
console.log("cpp engine is " + geo((r) => r.js / r.cpp).toFixed(2) + "x the js engine's speed");

// --- canaries --------------------------------------------------------------
console.log("\ncanaries");
console.log("-".repeat(88));
for (const [name, body] of CANARIES) {
  const src = wrap(body);
  const wantNode = runNode(src);
  const gotJs = runJsEngine(src);
  const gotCpp = timeNative(name, 1).answer;
  if (name === "keyorder") {
    const jsOk = gotJs === wantNode, cppOk = gotCpp === wantNode;
    console.log("keyorder   node: " + wantNode);
    console.log("           js:   " + gotJs + (jsOk ? "   OK" : "   DIVERGES"));
    console.log("           cpp:  " + gotCpp + (cppOk ? "   OK" : "   DIVERGES"));
    if (!cppOk || !jsOk) {
      console.log("           -> a target that enumerates keys in a different order is not");
      console.log("              running the same language; the timings above compare two");
      console.log("              engines that disagree about observable behaviour.");
    }
  }
}
// Scaling: `array` is twice the size of `array_half`. 2x means linear.
const halfSrc = wrap(CANARIES[1][1]);
const jsHalf = Math.max(1e-4, timeBest(() => runJsEngine(halfSrc), 3) - jsFloor);
const jsFull = rows.find((r) => r.name === "array").js;
const cppHalf = (timeNative("array_half", REPS).ms - timeNative("array_half", 0).ms) / REPS;
const cppFull = rows.find((r) => r.name === "array").cpp;
console.log("\narray scaling (20000 vs 10000 elements; 2x = linear)");
console.log("  js engine   " + fmt(jsFull) + " / " + fmt(jsHalf) + " = " + (jsFull / jsHalf).toFixed(2) + "x");
console.log("  cpp engine  " + fmt(cppFull) + " / " + fmt(cppHalf) + " = " + (cppFull / cppHalf).toFixed(2) + "x");

if (mismatches) {
  console.log("\n" + mismatches + " case(s) DISAGREED -- their timings mean nothing:");
  for (const r of rows.filter((x) => !x.agree)) {
    console.log(`  ${r.name}: node ${JSON.stringify(r.wantNode)} js ${JSON.stringify(r.gotJs)} cpp ${JSON.stringify(r.gotCpp)}`);
  }
  process.exitCode = 1;
}
