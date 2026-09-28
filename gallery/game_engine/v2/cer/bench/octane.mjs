// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The Octane suites of interp/bench/zoo_octane through each engine, the
// source prepared as zoo_octane/run.cjs prepares it (a `print`, Measure
// timed with performance.now). Octane checks its own results: a suite that
// computes a wrong answer reports an error instead of a score.
//
//   node bench/octane.mjs                          # all suites
//   node bench/octane.mjs richards,deltablue --engines=cer-rust,cer-js
//   node bench/octane.mjs --json
//   node bench/octane.mjs --dump=/tmp/oct       # the prepared sources only
import fs from "fs";
import path from "path";
import { engines, build, ROOT, PRINT_PRELUDE } from "./common.mjs";

const args = process.argv.slice(2);
const opt = (name, d) => {
  const a = args.find((x) => x.startsWith("--" + name + "="));
  return a ? a.slice(name.length + 3) : d;
};
const WANT = opt("engines", "node,ce-js,cer-rust,cer-js").split(",");
const asJson = args.includes("--json");
const ALL = ["richards", "deltablue", "crypto", "raytrace", "earley-boyer", "regexp", "splay", "navier-stokes"];
const listed = args.filter((a) => !a.startsWith("--")).join(",").split(",").filter(Boolean);
const SUITES = listed.length ? listed : ALL;
const DIR = path.join(ROOT, "gallery/game_engine/v2/interp/bench/zoo_octane");

function prepare(src) {
  let s = src.replace(/if \(typeof print == "undefined" && typeof console != "undefined"\) \{[\s\S]*?\n\}\n/, "/* print provided */\n");
  s = s.replace(
    /Object\.defineProperty\(Object\.prototype,\s*["']inheritsFrom["']\s*,\s*\{[\s\S]*?\}\);/,
    `Function.prototype.inheritsFrom = function (shuper) {
  function Inheriter() { }
  Inheriter.prototype = shuper.prototype;
  this.prototype = new Inheriter();
  this.superConstructor = shuper;
};`
  );
  s = s.replace(/function Measure\(data\) \{\s*var elapsed = 0;\s*var start = new Date\(\);\s*/m, `function Measure(data) {
    var elapsed = 0;
    var start = performance.now();
  `);
  s = s.replace(/elapsed = new Date\(\) - start;/g, "elapsed = performance.now() - start;");
  return s;
}

const dump = opt("dump", "");
if (dump) {
  // the prepared suites as files, to run or profile an engine by hand
  fs.mkdirSync(dump, { recursive: true });
  for (const suite of SUITES) {
    fs.writeFileSync(path.join(dump, suite + ".js"), PRINT_PRELUDE + prepare(fs.readFileSync(path.join(DIR, suite + ".js"), "utf8")));
  }
  process.exit(0);
}

build(WANT.filter((e) => e !== "node"));
const runners = engines(WANT);
const results = {};
for (const suite of SUITES) {
  const src = prepare(fs.readFileSync(path.join(DIR, suite + ".js"), "utf8"));
  results[suite] = {};
  for (const [eng, run] of Object.entries(runners)) {
    const t0 = Date.now();
    const out = run(src);
    const scores = {};
    for (const l of out) {
      const m = /^([A-Za-z]+): ([0-9.e+-]+)$/.exec(l.trim());
      if (m) scores[m[1]] = Number(m[2]);
      else if (/^[A-Za-z]+: .*(Error|error|wrong|Wrong)/.test(l)) scores.error = l.trim();
    }
    if (!Object.keys(scores).length) scores.error = out.slice(-1).join("") || "no output";
    scores.wallMs = Date.now() - t0;
    results[suite][eng] = scores;
  }
}

if (asJson) {
  process.stdout.write(JSON.stringify(results) + "\n");
} else {
  const names = Object.keys(runners);
  console.log("Octane scores (higher is faster)\n");
  console.log("suite".padEnd(14) + names.map((e) => e.padStart(10)).join(""));
  const geo = {};
  for (const suite of SUITES) {
    const cells = names.map((e) => {
      const r = results[suite][e];
      const key = Object.keys(r).find((k) => k !== "wallMs" && k !== "error" && !k.endsWith("Latency"));
      if (!key) return "FAIL".padStart(10);
      (geo[e] = geo[e] || []).push(r[key]);
      const v = r[key];
      return (v >= 100 ? String(Math.round(v)) : v.toPrecision(3)).padStart(10);
    });
    console.log(suite.padEnd(14) + cells.join(""));
  }
  const g = names.map((e) => {
    const xs = geo[e] || [];
    if (xs.length !== SUITES.length) return "—".padStart(10);
    const v = Math.exp(xs.reduce((a, b) => a + Math.log(b), 0) / xs.length);
    return (v >= 100 ? String(Math.round(v)) : v.toPrecision(3)).padStart(10);
  });
  console.log("geo mean".padEnd(14) + g.join(""));
  for (const suite of SUITES) {
    for (const e of names) {
      if (results[suite][e].error) console.log(`${suite} ${e}: ${results[suite][e].error}`);
    }
  }
}
