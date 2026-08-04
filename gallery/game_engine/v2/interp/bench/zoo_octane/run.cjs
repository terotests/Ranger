#!/usr/bin/env node
// Run zoo.js.org / V8 Octane benchmarks through the Ranger TS interpreter
// (ComponentEngine) and through Node on the same machine for a fair ratio.
//
// Benchmark sources: https://github.com/ivankra/javascript-zoo/tree/main/bench
// Scores match Octane v9 (higher is faster). zoo.js.org's Score column is the
// geometric mean of the non-Latency suite scores.
//
//   node run.cjs                 # all downloaded suites
//   node run.cjs richards        # one suite
//   node run.cjs richards,splay  # several
//
// Requires: bash scripts/build-engine-module.sh
// Suite files live next to this script (downloaded from javascript-zoo).
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { ComponentEngine, EvalValue } = require(
  path.join(__dirname, "..", "..", "bin", "engine_module.cjs"));

const DIR = __dirname;
const ALL = [
  "richards",
  "deltablue",
  "crypto",
  "raytrace",
  "earley-boyer",
  "regexp",
  "splay",
  "navier-stokes",
];
const ONLY = (process.argv[2] || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const SUITES = ONLY.length ? ONLY : ALL.filter((n) => fs.existsSync(path.join(DIR, n + ".js")));

// zoo.js.org amd64 V8 column (snapshot from the page the user linked). Used only
// for "where would we sit on that table" percentages — same-machine Node is the
// fairer baseline and is reported separately.
const ZOO_V8 = {
  Richards: 37102,
  DeltaBlue: 106675,
  Crypto: 39289,
  RayTrace: 119952,
  EarleyBoyer: 85422,
  RegExp: 9499,
  Splay: 42718,
  SplayLatency: 105366,
  NavierStokes: 38655,
  Score: 47285,
};

function enableLiveClock(engine) {
  // Octane times with `new Date() - start`. The realm's clock is frozen at
  // hostNowMs by design (reproducible Date); for a wall-clock bench we make
  // that field track the host clock for the life of this instance.
  Object.defineProperty(engine, "hostNowMs", {
    configurable: true,
    enumerable: true,
    get() {
      return Date.now();
    },
    set() {},
  });
}

function raiseLoopGuards(engine) {
  // Default safety cap is 100000; Octane suites exceed that.
  engine.maxLoopIterations = 1000000000;
}

function runNode(filePath) {
  // Run as a real Node process. A vm.createContext sandbox gives the script a
  // different Object.prototype than the injected Object, which breaks Octane's
  // Object.prototype.inheritsFrom pattern (DeltaBlue et al.).
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [filePath], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const wallMs = Date.now() - t0;
  if (r.error) return { lines: [], wallMs, err: r.error };
  const out = String(r.stdout || "") + String(r.stderr || "");
  const lines = out.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.length);
  if (r.status !== 0 && !lines.some((l) => /: /.test(l))) {
    return { lines, wallMs, err: new Error(out.slice(0, 500) || "node exit " + r.status) };
  }
  return { lines, wallMs };
}

// console.log is callable as a member but is not a first-class value in this
// realm (`typeof console.log === "undefined"`), so Octane's
// `print = console.log` assigns undefined. Install a real print first.
const ENGINE_PRELUDE = `
function print() {
  var s = "";
  for (var i = 0; i < arguments.length; i++) {
    if (i) s += " ";
    s += String(arguments[i]);
  }
  console.log(s);
}
`;

function prepareEngineSource(src) {
  // Keep Octane's own print bootstrap from overwriting our working print with
  // the non-value console.log binding.
  let s = src.replace(
    /if \(typeof print == "undefined" && typeof console != "undefined"\) \{[\s\S]*?\n\}\n/,
    "/* print provided by zoo_octane/run.cjs */\n"
  );
  // Function objects in this realm do not see properties added to
  // Object.prototype (DeltaBlue's inheritsFrom). Install the same helper on
  // Function.prototype, which method lookup does find.
  s = s.replace(
    /Object\.defineProperty\(Object\.prototype,\s*["']inheritsFrom["']\s*,\s*\{[\s\S]*?\}\);/,
    `Function.prototype.inheritsFrom = function (shuper) {
  function Inheriter() { }
  Inheriter.prototype = shuper.prototype;
  this.prototype = new Inheriter();
  this.superConstructor = shuper;
};`
  );
  return ENGINE_PRELUDE + s;
}

function runEngine(src) {
  const lines = [];
  const oLog = console.log;
  const oWarn = console.warn;
  const oError = console.error;
  console.log = (...a) => {
    // ComponentEngine prefixes guest console.log with "[tsx] ".
    const s = a.map(String).join(" ").replace(/^\[tsx\]\s*/, "");
    lines.push(s);
  };
  console.warn = console.log;
  console.error = console.log;
  const e = new ComponentEngine();
  e.quiet = true;
  enableLiveClock(e);
  raiseLoopGuards(e);
  const t0 = Date.now();
  let err = null;
  try {
    e.loadScript(prepareEngineSource(src) + "\nfunction __zoo_done__() { return 'done'; }\n");
    e.callFunction("__zoo_done__", EvalValue.null());
  } catch (ex) {
    err = ex;
  } finally {
    console.log = oLog;
    console.warn = oWarn;
    console.error = oError;
  }
  return { lines, wallMs: Date.now() - t0, err, engine: e };
}

function parseScores(lines) {
  const scores = {};
  for (const line of lines) {
    const m = /^([A-Za-z0-9]+): ([0-9.]+(?:e[+-][0-9]+)?)$/.exec(line.trim());
    if (m) scores[m[1]] = Number(m[2]);
    const err = /^([A-Za-z0-9]+): (.+)$/.exec(line.trim());
    if (err && !(err[1] in scores) && /Error|error|Alert|undefined/.test(err[2])) {
      scores[err[1]] = null;
      scores[err[1] + "_error"] = err[2];
    }
  }
  return scores;
}

function geoMean(nums) {
  const xs = nums.filter((n) => typeof n === "number" && n > 0);
  if (!xs.length) return null;
  const log = xs.reduce((a, b) => a + Math.log(b), 0) / xs.length;
  return Math.exp(log);
}

function pct(num, den) {
  if (num == null || !den) return "—";
  return ((100 * num) / den).toFixed(3) + "%";
}

function fmt(n) {
  if (n == null || Number.isNaN(n)) return "FAIL";
  if (n >= 100) return String(Math.round(n));
  return n.toPrecision(3);
}

const engineScores = {};
const nodeScores = {};
const rows = [];

console.log("Zoo Octane (v9) via Ranger TS engine vs Node");
console.log("Suites:", SUITES.join(", "));
console.log("");

for (const name of SUITES) {
  const file = path.join(DIR, name + ".js");
  if (!fs.existsSync(file)) {
    console.log("SKIP missing", file);
    continue;
  }
  const src = fs.readFileSync(file, "utf8");
  process.stdout.write("Node  " + name + " ... ");
  const n = runNode(file);
  if (n.err) {
    console.log("ERROR", n.err.message || n.err);
    rows.push({ name, error: "node: " + String(n.err) });
    continue;
  }
  const ns = parseScores(n.lines);
  Object.assign(nodeScores, ns);
  console.log(
    Object.entries(ns)
      .filter(([k]) => !k.endsWith("_error"))
      .map(([k, v]) => k + "=" + fmt(v))
      .join(" ") +
      "  (" +
      n.wallMs +
      " ms)"
  );

  process.stdout.write("Engine " + name + " ... ");
  const e = runEngine(src);
  if (e.err) {
    console.log("ERROR", e.err && e.err.message ? e.err.message : e.err);
    rows.push({ name, error: String(e.err) });
    continue;
  }
  const es = parseScores(e.lines);
  Object.assign(engineScores, es);
  const summary =
    Object.entries(es)
      .filter(([k]) => !k.endsWith("_error"))
      .map(([k, v]) => k + "=" + fmt(v))
      .join(" ") ||
    "(no scores) " + e.lines.slice(0, 5).join(" | ");
  console.log(summary + "  (" + e.wallMs + " ms)");
  rows.push({ name, node: ns, engine: es, nodeMs: n.wallMs, engineMs: e.wallMs, lines: e.lines });
}

const keys = Object.keys({ ...nodeScores, ...engineScores }).filter(
  (k) => !k.endsWith("_error") && k !== "Score"
);

console.log("");
console.log(
  [
    "suite".padEnd(14),
    "engine".padStart(10),
    "node".padStart(10),
    "% of Node".padStart(12),
    "zoo V8".padStart(10),
    "% of zoo V8".padStart(12),
  ].join(" ")
);
console.log("-".repeat(72));

const engVals = [];
const nodeVals = [];
for (const k of keys) {
  const eng = engineScores[k];
  const nod = nodeScores[k];
  const v8 = ZOO_V8[k];
  if (typeof eng === "number" && eng > 0) engVals.push(eng);
  if (typeof nod === "number" && nod > 0) nodeVals.push(nod);
  console.log(
    [
      k.padEnd(14),
      fmt(eng).padStart(10),
      fmt(nod).padStart(10),
      pct(eng, nod).padStart(12),
      (v8 != null ? String(v8) : "—").padStart(10),
      pct(eng, v8).padStart(12),
    ].join(" ")
  );
}

const engGeo = geoMean(engVals);
const nodeGeo = geoMean(nodeVals);
console.log("-".repeat(72));
console.log(
  [
    "GEO MEAN".padEnd(14),
    fmt(engGeo).padStart(10),
    fmt(nodeGeo).padStart(10),
    pct(engGeo, nodeGeo).padStart(12),
    String(ZOO_V8.Score).padStart(10),
    pct(engGeo, ZOO_V8.Score).padStart(12),
  ].join(" ")
);

const out = {
  when: new Date().toISOString(),
  suites: SUITES,
  engineScores,
  nodeScores,
  engineGeoMean: engGeo,
  nodeGeoMean: nodeGeo,
  pctOfSameMachineNode: engGeo && nodeGeo ? (100 * engGeo) / nodeGeo : null,
  pctOfZooV8Score: engGeo ? (100 * engGeo) / ZOO_V8.Score : null,
  zooV8: ZOO_V8,
  rows,
};
fs.writeFileSync(path.join(DIR, "last-results.json"), JSON.stringify(out, null, 2));
console.log("\nWrote", path.join(DIR, "last-results.json"));
