#!/usr/bin/env node
// Run zoo.js.org / V8 Octane benchmarks through the Ranger TS interpreter
// on es6 (Node module), C++, and/or Rust, plus same-machine Node as baseline.
//
//   node run.cjs                              # all suites, all available targets
//   node run.cjs richards,deltablue,regexp
//   node run.cjs --targets=es6,cpp,rust richards
//
// Requires:
//   bash scripts/build-engine-module.sh          # es6
//   bash gallery/game_engine/v2/interp/bench/zoo_octane/build-native.sh
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const DIR = __dirname;
const BIN_ROOT = path.join(__dirname, "..", "..", "bin");
const ALL_SUITES = [
  "richards",
  "deltablue",
  "crypto",
  "raytrace",
  "earley-boyer",
  "regexp",
  "splay",
  "navier-stokes",
];
const ALL_TARGETS = ["es6", "cpp", "rust"];

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

function parseArgs(argv) {
  let targets = null;
  const suites = [];
  for (const a of argv) {
    if (a.startsWith("--targets=")) {
      targets = a
        .slice("--targets=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a.startsWith("--")) {
      console.error("unknown flag", a);
      process.exit(2);
    } else {
      for (const s of a.split(",")) {
        if (s.trim()) suites.push(s.trim());
      }
    }
  }
  return {
    targets: targets || ALL_TARGETS.slice(),
    suites: suites.length
      ? suites
      : ALL_SUITES.filter((n) => fs.existsSync(path.join(DIR, n + ".js"))),
  };
}

const { targets: WANT_TARGETS, suites: SUITES } = parseArgs(process.argv.slice(2));

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
  let s = src.replace(
    /if \(typeof print == "undefined" && typeof console != "undefined"\) \{[\s\S]*?\n\}\n/,
    "/* print provided by zoo_octane/run.cjs */\n"
  );
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

function parseScores(lines) {
  const scores = {};
  for (const line of lines) {
    const cleaned = String(line).replace(/^\[tsx\]\s*/, "").trim();
    const m = /^([A-Za-z0-9]+): ([0-9.]+(?:e[+-][0-9]+)?)$/.exec(cleaned);
    if (m) scores[m[1]] = Number(m[2]);
    const err = /^([A-Za-z0-9]+): (.+)$/.exec(cleaned);
    if (err && !(err[1] in scores) && /Error|error|Alert|undefined|FAIL/.test(err[2])) {
      scores[err[1]] = null;
      scores[err[1] + "_error"] = err[2];
    }
  }
  return scores;
}

function geoMean(nums) {
  const xs = nums.filter((n) => typeof n === "number" && n > 0);
  if (!xs.length) return null;
  return Math.exp(xs.reduce((a, b) => a + Math.log(b), 0) / xs.length);
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

function summarizeScores(scores) {
  return (
    Object.entries(scores)
      .filter(([k]) => !k.endsWith("_error"))
      .map(([k, v]) => k + "=" + fmt(v))
      .join(" ") || "(no scores)"
  );
}

function runNode(filePath) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [filePath], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
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

function runEs6(preparedSrc) {
  const { ComponentEngine, EvalValue } = require(path.join(BIN_ROOT, "engine_module.cjs"));
  const lines = [];
  const oLog = console.log;
  const oWarn = console.warn;
  const oError = console.error;
  console.log = (...a) => {
    lines.push(a.map(String).join(" ").replace(/^\[tsx\]\s*/, ""));
  };
  console.warn = console.log;
  console.error = console.log;
  const e = new ComponentEngine();
  e.quiet = true;
  e.liveClock = true;
  e.maxLoopIterations = 1000000000;
  const t0 = Date.now();
  let err = null;
  try {
    e.loadScript(preparedSrc + "\nfunction __zoo_done__() { return 'done'; }\n");
    e.callFunction("__zoo_done__", EvalValue.null());
  } catch (ex) {
    err = ex;
  } finally {
    console.log = oLog;
    console.warn = oWarn;
    console.error = oError;
  }
  return { lines, wallMs: Date.now() - t0, err };
}

function nativeBin(target) {
  return path.join(BIN_ROOT, target, "octane_runner");
}

function runNative(target, preparedPath) {
  const bin = nativeBin(target);
  if (!fs.existsSync(bin)) {
    return { lines: [], wallMs: 0, err: new Error("missing binary " + bin + " (run build-native.sh)") };
  }
  const dir = path.dirname(preparedPath);
  const file = path.basename(preparedPath);
  const t0 = Date.now();
  const r = spawnSync(bin, [dir, file], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  const wallMs = Date.now() - t0;
  if (r.error) return { lines: [], wallMs, err: r.error };
  const out = String(r.stdout || "") + String(r.stderr || "");
  const lines = out.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.length);
  if (r.status !== 0 && !lines.some((l) => /: /.test(l))) {
    return {
      lines,
      wallMs,
      err: new Error((out.slice(0, 800) || "exit " + r.status).replace(/\s+/g, " ")),
    };
  }
  return { lines, wallMs };
}

function targetAvailable(t) {
  if (t === "es6") return fs.existsSync(path.join(BIN_ROOT, "engine_module.cjs"));
  if (t === "cpp" || t === "rust") return fs.existsSync(nativeBin(t));
  return false;
}

const TARGETS = WANT_TARGETS.filter((t) => {
  if (!ALL_TARGETS.includes(t)) {
    console.error("unknown target", t);
    process.exit(2);
  }
  if (!targetAvailable(t)) {
    console.log("SKIP target", t, "(not built)");
    return false;
  }
  return true;
});

const nodeScores = {};
/** @type {Record<string, Record<string, number|null>>} */
const byTarget = {};
for (const t of TARGETS) byTarget[t] = {};
const rows = [];

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "zoo-octane-"));

console.log("Zoo Octane (v9) — Ranger TS engine targets vs Node");
console.log("Suites:", SUITES.join(", "));
console.log("Targets:", TARGETS.join(", ") || "(none)");
console.log("");

try {
  for (const name of SUITES) {
    const file = path.join(DIR, name + ".js");
    if (!fs.existsSync(file)) {
      console.log("SKIP missing", file);
      continue;
    }
    const raw = fs.readFileSync(file, "utf8");
    const prepared = prepareEngineSource(raw);
    const prepPath = path.join(tmpRoot, name + ".js");
    fs.writeFileSync(prepPath, prepared);

    process.stdout.write("Node   " + name + " ... ");
    const n = runNode(file);
    if (n.err) {
      console.log("ERROR", n.err.message || n.err);
      rows.push({ name, error: "node: " + String(n.err) });
      continue;
    }
    const ns = parseScores(n.lines);
    Object.assign(nodeScores, ns);
    console.log(summarizeScores(ns) + "  (" + n.wallMs + " ms)");

    const row = { name, node: ns, nodeMs: n.wallMs, targets: {} };

    for (const t of TARGETS) {
      process.stdout.write((t + "     ").slice(0, 7) + name + " ... ");
      const r = t === "es6" ? runEs6(prepared) : runNative(t, prepPath);
      if (r.err) {
        console.log("ERROR", r.err.message || r.err);
        row.targets[t] = { error: String(r.err), lines: r.lines, wallMs: r.wallMs };
        continue;
      }
      const scores = parseScores(r.lines);
      Object.assign(byTarget[t], scores);
      console.log(summarizeScores(scores) + "  (" + r.wallMs + " ms)");
      row.targets[t] = { scores, wallMs: r.wallMs, lines: r.lines };
    }
    rows.push(row);
  }
} finally {
  try {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } catch (_) {
    /* ignore */
  }
}

function printSection(title, scores) {
  const keys = Object.keys({ ...nodeScores, ...scores }).filter(
    (k) => !k.endsWith("_error") && k !== "Score"
  );
  console.log("");
  console.log("## " + title);
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
    const eng = scores[k];
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
  return { engGeo, nodeGeo };
}

const sectionMeta = {};
const TITLE = {
  es6: "es6 target (ComponentEngine as Node module)",
  cpp: "C++ target (g++ -O3 native binary)",
  rust: "Rust target (rustc -O native binary)",
};
for (const t of TARGETS) {
  sectionMeta[t] = printSection(TITLE[t], byTarget[t]);
}

const out = {
  when: new Date().toISOString(),
  suites: SUITES,
  targets: TARGETS,
  nodeScores,
  byTarget,
  sectionMeta,
  zooV8: ZOO_V8,
  rows,
};
fs.writeFileSync(path.join(DIR, "last-results.json"), JSON.stringify(out, null, 2));
console.log("\nWrote", path.join(DIR, "last-results.json"));
