// Micro-benchmark for the ComponentEngine (TS/TSX interpreter).
//
// Loads level_init_bench.tsx into the interpreter and repeatedly calls
// initLevel(), which reproduces the "ar" game's level-initialization hot path
// (road solver + entity object building). Reports wall-clock time so interpreter
// optimizations can be measured against a stable, native-free workload.
//
// Usage:
//   node gallery/pdf_writer/bench/level_init_bench.js [iterations]
//   node --prof gallery/pdf_writer/bench/level_init_bench.js 300   (for V8 profiling)

const fs = require("fs");
const path = require("path");

const {
  ComponentEngine,
  EvalValue,
} = require("../bin/component_engine_module.cjs");

const iterations = parseInt(process.argv[2] || "300", 10);
const warmup = Math.max(5, Math.floor(iterations * 0.1));

const src = fs.readFileSync(
  path.join(__dirname, "level_init_bench.tsx"),
  "utf8"
);

function makeEngine() {
  const engine = new ComponentEngine();
  engine.quiet = true;
  engine.loadScript(src);
  return engine;
}

// Sanity: run once, print the checksum so we know the interpreter path works and
// produces a deterministic result across code changes.
{
  const engine = makeEngine();
  const result = engine.callFunction("initLevel", EvalValue.null());
  console.log("checksum =", Math.round(result.numberValue));
}

// Warm up (JIT + any lazy interpreter caches).
{
  const engine = makeEngine();
  for (let i = 0; i < warmup; i++) {
    engine.callFunction("initLevel", EvalValue.null());
  }
}

// Timed run. Re-parsing the script each engine is expensive and noisy, so we
// reuse a single engine and only time the repeated evaluation of initLevel().
const engine = makeEngine();

const t0 = process.hrtime.bigint();
for (let i = 0; i < iterations; i++) {
  engine.callFunction("initLevel", EvalValue.null());
}
const t1 = process.hrtime.bigint();

const totalMs = Number(t1 - t0) / 1e6;
const perIter = totalMs / iterations;

console.log(`iterations = ${iterations}`);
console.log(`total      = ${totalMs.toFixed(2)} ms`);
console.log(`per iter   = ${perIter.toFixed(4)} ms`);
console.log(`throughput = ${(1000 / perIter).toFixed(1)} initLevel/s`);
