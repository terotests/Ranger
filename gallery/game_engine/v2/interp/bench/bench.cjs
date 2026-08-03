// Interpreter vs Node, on the same source text.
//
// Both sides run the SAME script and must produce the SAME answer -- a fast
// wrong answer is not a result, so every case is checked before it is timed.
//
// Two things this harness is careful about, because both were measured wrong
// the first time round:
//
//   * The workload lives inside a `work()` function, not at script top level.
//     Node's `vm` reaches a script's top-level `var` through the context's
//     global proxy, an interceptor path ~40x slower than a local -- timing the
//     top-level shape measured that cliff and flattered the engine by the same
//     factor.
//   * Fixed cost is reported, not buried. Both sides pay per run: Node compiles
//     the script and builds a context, the engine lexes, parses and hoists. The
//     `empty` row is that floor, and the work-only columns subtract it.
//
// Recorded readings, engine work-ms at scale 1x (same machine, same session):
//
//   case      first pass   after the four fixes below
//   loop           69.1        57
//   fib           186.0        35
//   strcat         37.7        28
//   array         116.1       105
//   object         51.8        46
//   method        106.3        84
//   regex          49.0        47
//   geo mean        72x         53x   (ratio vs Node)
//
// The four: build the arguments object only for functions that mention
// `arguments`; skip the `with` scope-chain walk when no `with` exists; memoise
// a numeric literal's parsed value on its node; and ask a prototype slot
// whether it IS the registered built-in instead of materialising the built-in
// and comparing identities. Per-case numbers wobble +/- 20% run to run because
// Node's side is near the timer floor -- the geometric mean is the stable part.
//
//   node bench.cjs            # default sizes
//   node bench.cjs 4          # scale every workload by 4
//   node bench.cjs 1 loop,fib # only these cases
const vm = require("vm");
const path = require("path");
const { ComponentEngine, EvalValue } = require(
  path.join(__dirname, "..", "bin", "engine_module.cjs"));

const SCALE = Number(process.argv[2] || 1);
const ONLY = (process.argv[3] || "").split(",").filter(Boolean);
const n = (base) => Math.max(1, Math.round(base * SCALE));

// Each case is the body of `work()`, which returns the answer.
const CASES = [
  ["empty", `return 0;`],

  // NOTE: the evaluator exits any loop after 100000 iterations, silently and
  // with no error, so a case sized past that measures a truncated run. The
  // sizes here stay under it; scaling far past 1x trips it, and the
  // same-answer check reports that rather than hiding it.
  ["loop", `
    var s = 0;
    for (var i = 0; i < ${n(50000)}; i++) { s += i; }
    return s;`],

  ["fib", `
    function fib(k) { return k < 2 ? k : fib(k - 1) + fib(k - 2); }
    return fib(${n(20)});`],

  ["strcat", `
    var s = "";
    for (var i = 0; i < ${n(20000)}; i++) { s += "ab"; }
    return s.length;`],

  ["array", `
    var a = [];
    for (var i = 0; i < ${n(20000)}; i++) { a.push(i * 2); }
    var t = 0;
    for (var j = 0; j < a.length; j++) { t += a[j]; }
    return t + a.length;`],

  ["object", `
    var o = {};
    for (var i = 0; i < ${n(20000)}; i++) { o["k" + (i % 50)] = i; }
    var t = 0;
    for (var k in o) { t += o[k]; }
    return t;`],

  ["method", `
    var s = "The quick brown fox jumps over the lazy dog";
    var t = 0;
    for (var i = 0; i < ${n(20000)}; i++) { t += s.slice(i % 10, 20).indexOf("o") + s.charCodeAt(i % 40); }
    return t;`],

  ["regex", `
    var re = /([a-z]+)\\s+(\\d+)/;
    var t = 0;
    for (var i = 0; i < ${n(5000)}; i++) { var m = re.exec("item " + i + " qty 42"); if (m) { t += m[2].length; } }
    return t;`],
];

const wrap = (body) => `function work() {${body}\n}\n__out__ = String(work());`;

function runNode(src) {
  const ctx = { __out__: "" };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return String(ctx.__out__);
}

function runEngine(src) {
  const e = new ComponentEngine();
  e.quiet = true;
  const o = console.log;
  console.log = () => {};
  try {
    e.loadScript("var __out__ = '';\n" + src + "\nfunction __t__() { return String(__out__); }\n");
    const r = e.callFunction("__t__", EvalValue.null());
    return r ? String(r.stringValue) : "<null>";
  } finally {
    console.log = o;
  }
}

// Best-of-N: the minimum is the least noisy estimator for a CPU-bound run.
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

const fmt = (ms) => (ms < 10 ? ms.toFixed(2) : ms.toFixed(1));
const rows = [];
let mismatches = 0;

for (const [name, body] of CASES) {
  if (ONLY.length && name !== "empty" && !ONLY.includes(name)) continue;
  const src = wrap(body);

  const wantNode = runNode(src);
  const gotEngine = runEngine(src);
  const agree = wantNode === gotEngine;
  if (!agree) mismatches++;

  rows.push({
    name, agree, wantNode, gotEngine,
    // Node's runs land near the timer noise floor, so it gets more reps; the
    // engine's are 20-400x longer and do not need them.
    nodeMs: timeBest(() => runNode(src), 25),
    engMs: timeBest(() => runEngine(src), 3),
  });
}

const floor = rows.find((r) => r.name === "empty");
const work = rows.filter((r) => r.name !== "empty");
for (const r of work) {
  r.nodeWork = Math.max(1e-4, r.nodeMs - floor.nodeMs);
  r.engWork = Math.max(1e-4, r.engMs - floor.engMs);
  r.ratio = r.engWork / r.nodeWork;
}

console.log(`scale ${SCALE}x\n`);
console.log("case        node ms   engine ms  |  node work  eng work    ratio   same");
console.log("-".repeat(74));
console.log("empty    " + fmt(floor.nodeMs).padStart(9) + fmt(floor.engMs).padStart(12) +
            "  |     (fixed cost: compile/parse + setup)");
for (const r of work) {
  console.log(
    r.name.padEnd(9) +
    fmt(r.nodeMs).padStart(9) + fmt(r.engMs).padStart(12) + "  |" +
    fmt(r.nodeWork).padStart(10) + fmt(r.engWork).padStart(10) +
    (r.ratio.toFixed(0) + "x").padStart(9) +
    (r.agree ? "    yes" : "    NO"));
}
console.log("-".repeat(74));
const gmean = Math.exp(work.reduce((a, r) => a + Math.log(r.ratio), 0) / work.length);
console.log("geometric mean: " + gmean.toFixed(0) + "x slower than Node (work only)");

if (mismatches) {
  console.log("\n" + mismatches + " case(s) DISAGREED -- their timings mean nothing:");
  for (const r of rows.filter((x) => !x.agree)) {
    console.log(`  ${r.name}: node ${JSON.stringify(r.wantNode)} engine ${JSON.stringify(r.gotEngine)}`);
  }
  process.exitCode = 1;
}
