#!/usr/bin/env node
// Compare the engine's tiers against the ordinary Ranger→JavaScript output.
//
//   npm run engine:bench
//
// Three ways of running the same `.rgr` file:
//
//   tier 1 (bytecode)  the RgVM interpreter, JIT off
//   tier 2 (jit)       the same bytecode, promoted to host code after a few
//                      calls; the first call still runs interpreted
//   compiled           the file put through the normal compiler and required
//                      as a JavaScript module — the ceiling for this host
//
// The frontend cost (parse + analyze, roughly a quarter of a second) is
// reported separately: it is paid once per load and says nothing about how
// fast the program itself runs.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE = resolve(ROOT, "gallery/ranger_engine");
const PROGRAM = resolve(ENGINE, "examples/bench.rgr");
const TMP_REL = "tmp/ranger-engine-bench";
const TMP = resolve(ROOT, TMP_REL);

process.env.RANGER_LIB = `${resolve(ROOT, "compiler")}/;${resolve(ROOT, "lib")}/`;

// The cases. `warm` calls the entry once before timing so the JIT tier has
// something to promote — a cold measurement of tier 2 is a measurement of the
// interpreter plus a compile.
const CASES = [
  { name: "fib(24)", fn: "Bench.fib", args: [24], expect: 46368 },
  { name: "loopChunks(8, 50000)", fn: "Bench.loopChunks", args: [8, 50000], expect: 1199976 },
  { name: "collatzMax(3000)", fn: "Bench.collatzMax", args: [3000], expect: 216 },
];

function quiet(run) {
  const log = console.log;
  console.log = () => {};
  try {
    return run();
  } finally {
    console.log = log;
  }
}

async function quietAsync(run) {
  const log = console.log;
  console.log = () => {};
  try {
    return await run();
  } finally {
    console.log = log;
  }
}

function build() {
  if (!existsSync(resolve(ENGINE, "bin/rg_api.js"))) {
    console.log("engine host missing, building it first…");
    execFileSync("bash", [resolve(ROOT, "scripts/ranger-engine-build.sh")], { stdio: "inherit" });
  }
}

function compileNative() {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  execFileSync(
    "node",
    // -d is resolved against the compiler's working directory, so it has to
    // stay relative even though everything else here is absolute.
    ["bin/output.js", "-es6", "-nodemodule", PROGRAM, `-d=./${TMP_REL}`, "-o=bench.js"],
    { cwd: ROOT, env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" }, stdio: "pipe" },
  );
  return require(resolve(TMP, "bench.js"));
}

// Best of N: one timing of a few milliseconds says more about what else the
// machine was doing than about the engine.
const REPS = 7;

function time(run) {
  let ms = Infinity;
  let value;
  for (let i = 0; i < REPS; i++) {
    const t0 = process.hrtime.bigint();
    value = run();
    const t1 = process.hrtime.bigint();
    ms = Math.min(ms, Number(t1 - t0) / 1e6);
  }
  return { ms, value };
}

function pad(s, n) {
  return String(s).padEnd(n);
}

function padLeft(s, n) {
  return String(s).padStart(n);
}

async function main() {
  build();
  const api = require(resolve(ENGINE, "bin/rg_api.js"));

  const load = async (jitThreshold) => {
    const engine = new api.RgEngine();
    engine.vm.echo = false;
    if (jitThreshold >= 0) engine.enableJit(jitThreshold);
    const ok = await quietAsync(() => engine.loadFile(PROGRAM));
    if (!ok) throw new Error(`could not load the benchmark: ${engine.errorText}`);
    return engine;
  };

  const t0 = process.hrtime.bigint();
  const interp = await load(-1);
  const loadMs = Number(process.hrtime.bigint() - t0) / 1e6;
  const jit = await load(2);
  const native = quiet(() => compileNative());

  console.log("");
  console.log(`load: frontend ${Math.round(interp.frontendMs)} ms + lowering ${Math.round(interp.lowerMs)} ms (${Math.round(loadMs)} ms total, once per program)`);
  console.log("");
  console.log(`${pad("case", 22)}${padLeft("tier 1 (ms)", 13)}${padLeft("tier 2 (ms)", 13)}${padLeft("compiled (ms)", 15)}${padLeft("tier1/tier2", 13)}${padLeft("tier2/compiled", 16)}`);
  console.log("-".repeat(92));

  for (const c of CASES) {
    const [cls, method] = c.fn.split(".");
    const a = time(() => interp.callNum(c.fn, c.args));
    // Warm the JIT: the promotion happens between calls, so the first call is
    // still interpreted and the timing after it is the compiled one.
    jit.callNum(c.fn, c.args);
    const b = time(() => jit.callNum(c.fn, c.args));
    const nativeFn = native[cls][method];
    nativeFn(...c.args);
    const n = time(() => nativeFn(...c.args));

    for (const [label, got] of [["tier 1", a.value], ["tier 2", b.value], ["compiled", n.value]]) {
      if (got !== c.expect) {
        console.error(`  MISMATCH in ${c.name}: ${label} returned ${got}, expected ${c.expect}`);
        process.exitCode = 1;
      }
    }

    console.log(
      pad(c.name, 22) +
        padLeft(a.ms.toFixed(1), 13) +
        padLeft(b.ms.toFixed(1), 13) +
        padLeft(n.ms.toFixed(1), 15) +
        padLeft(`${(a.ms / b.ms).toFixed(1)}x`, 13) +
        padLeft(`${(b.ms / Math.max(n.ms, 0.001)).toFixed(1)}x`, 16),
    );
  }

  console.log("");
  const tiers = jit.module.functions
    .filter((f) => f.callCount > 0)
    .map((f) => `${f.name}=${["bytecode", "jit", "unsupported"][f.tier]}`)
    .join("  ");
  console.log(`tier 2 run ended with: ${tiers}`);
  console.log(`interpreted steps — tier 1: ${interp.vm.steps}   tier 2: ${jit.vm.steps}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
