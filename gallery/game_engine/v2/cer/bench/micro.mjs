// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The seven workloads of ComponentEngine's own micro benchmark
// (interp/bench/bench.cjs), run by every engine. Each script runs its
// workload five times and reports the fastest, timed inside the script with
// performance.now: parsing and setup are not counted, for any engine. Every
// engine's answer is checked against Node's before its time is shown.
//
//   node bench/micro.mjs                       # node, ce-js, cer-rust, cer-js
//   node bench/micro.mjs --engines=cer-rust,cer-go,cer-cpp
//   node bench/micro.mjs --scale=2 --json
import { engines, build } from "./common.mjs";

const args = process.argv.slice(2);
const opt = (name, d) => {
  const a = args.find((x) => x.startsWith("--" + name + "="));
  return a ? a.slice(name.length + 3) : d;
};
const WANT = opt("engines", "node,ce-js,cer-rust,cer-js").split(",");
const SCALE = Number(opt("scale", "1"));
const asJson = args.includes("--json");
const n = (base) => Math.max(1, Math.round(base * SCALE));

export const CASES = [
  ["loop", `var s = 0; for (var i = 0; i < ${n(50000)}; i++) { s += i; } return s;`],
  ["fib", `function fib(k) { return k < 2 ? k : fib(k - 1) + fib(k - 2); } return fib(${n(20)});`],
  ["strcat", `var s = ""; for (var i = 0; i < ${n(20000)}; i++) { s += "ab"; } return s.length;`],
  ["array", `var a = []; for (var i = 0; i < ${n(20000)}; i++) { a.push(i * 2); } var t = 0; for (var j = 0; j < a.length; j++) { t += a[j]; } return t + a.length;`],
  ["object", `var o = {}; for (var i = 0; i < ${n(20000)}; i++) { o["k" + (i % 50)] = i; } var t = 0; for (var k in o) { t += o[k]; } return t;`],
  ["method", `var s = "The quick brown fox jumps over the lazy dog"; var t = 0; for (var i = 0; i < ${n(20000)}; i++) { t += s.slice(i % 10, 20).indexOf("o") + s.charCodeAt(i % 40); } return t;`],
  ["regex", `var re = /([a-z]+)\\s+(\\d+)/; var t = 0; for (var i = 0; i < ${n(5000)}; i++) { var m = re.exec("item " + i + " qty 42"); if (m) { t += m[2].length; } } return t;`],
];

const script = (body) => `function work() { ${body}
}
var best = 1e18;
var r;
for (var k = 0; k < 5; k++) {
  var t0 = performance.now();
  r = work();
  var dt = performance.now() - t0;
  if (dt < best) best = dt;
}
print("RESULT " + r + " " + best);
`;

build(WANT.filter((e) => e !== "node"));
const runners = engines(WANT);
const rows = [];
for (const [name, body] of CASES) {
  const row = { name };
  let want = null;
  for (const [eng, run] of Object.entries(runners)) {
    const out = run(script(body));
    const line = out.find((l) => l.startsWith("RESULT "));
    if (!line) {
      row[eng] = { error: out.slice(-2).join(" | ") };
      continue;
    }
    const [, value, ms] = line.split(" ");
    if (want === null) want = value;
    row[eng] = { value, ms: Number(ms), same: value === want };
  }
  rows.push(row);
}

if (asJson) {
  process.stdout.write(JSON.stringify(rows) + "\n");
} else {
  const names = Object.keys(runners);
  console.log(`scale ${SCALE}x, best of 5, ms (the work only)\n`);
  console.log("case".padEnd(9) + names.map((e) => e.padStart(10)).join(""));
  for (const r of rows) {
    const cells = names.map((e) => {
      const c = r[e];
      if (!c || c.error) return "error".padStart(10);
      const t = c.ms < 10 ? c.ms.toFixed(2) : c.ms.toFixed(1);
      return (t + (c.same ? "" : "!")).padStart(10);
    });
    console.log(r.name.padEnd(9) + cells.join(""));
  }
  console.log("\n! = a different answer from the first engine (its time means nothing)");
  for (const r of rows) {
    for (const e of names) {
      if (r[e] && r[e].error) console.log(`${r.name} ${e}: ${r[e].error}`);
    }
  }
}
