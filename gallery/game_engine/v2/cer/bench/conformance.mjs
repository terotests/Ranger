// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The runtime conformance probes of ComponentEngine (tests/runtime-
// conformance.test.ts) run through CEr. Every probe is the body of a
// function; Node runs it for the expected value, CEr runs it in a fresh
// engine, and the two are compared the way the test compares them (the
// value and its type; -0 is not 0).
//
// ComponentEngine's side is not re-run here: the test asserts that every
// probe outside its KNOWN_GAPS list passes and every probe inside fails, so
// its count is the number of probes minus the gaps.
//
//   node bench/conformance.mjs            # native CEr (cargo)
//   node bench/conformance.mjs --js       # CEr compiled to JS by rgrc
//   node bench/conformance.mjs --list     # also list CEr's failures
//   node bench/conformance.mjs --json     # one JSON object
import fs from "fs";
import path from "path";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CER = path.resolve(HERE, "..");
const ROOT = path.resolve(CER, "../../../..");
const TEST = path.join(ROOT, "tests/runtime-conformance.test.ts");
const args = process.argv.slice(2);
const useJs = args.includes("--js");
const list = args.includes("--list");
const asJson = args.includes("--json");

/** The array or set literal that follows `marker` in the test source. */
function literalAfter(src, marker, open, close) {
  const at = src.indexOf(marker);
  if (at < 0) throw new Error("not found: " + marker);
  // the literal after the `=`, not the type annotation before it
  let i = src.indexOf(open, src.indexOf("=", at + marker.length));
  const start = i;
  let depth = 0;
  let quote = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      i = src.indexOf("\n", i);
      continue;
    }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error("unbalanced: " + marker);
}

const src = fs.readFileSync(TEST, "utf8");
const PROBES = new Function("return " + literalAfter(src, "const PROBES", "[", "]"))();
const KNOWN_GAPS = new Set(new Function("return " + literalAfter(src, "const KNOWN_GAPS = new Set<string>(", "[", "]"))());

function tag(v) {
  if (v === undefined) return "u";
  if (v === null) return "l";
  if (typeof v === "boolean") return "b:" + v;
  if (typeof v === "number") return Object.is(v, -0) ? "n:-0" : "n:" + String(v);
  if (typeof v === "string") return "s:" + v;
  return "o:" + typeof v;
}

const expected = new Map();
for (const [name, body] of PROBES) {
  let t;
  try {
    t = tag(new Function(body)());
  } catch (e) {
    t = "t:" + e;
  }
  expected.set(name, t);
}

const script = (body) => "(function () { " + body + "\n})();";
const actual = new Map();
if (useJs) {
  const req = createRequire(import.meta.url);
  const mod = req(path.join(CER, "bin/Cer.cjs"));
  for (const [name, body] of PROBES) {
    const e = mod.Engine.new_();
    let r;
    try {
      r = e.eval_typed(script(body));
    } catch (ex) {
      r = "t:host " + ex;
    }
    actual.set(name, r);
  }
} else {
  const recs = PROBES.map(([name, body]) => name + "\u0002" + script(body)).join("\u0001");
  const file = path.join(os.tmpdir(), "cer-probes-" + process.pid + ".txt");
  fs.writeFileSync(file, recs);
  const r = spawnSync("cargo", ["run", "--release", "--quiet", "--bin", "probe", "--manifest-path", path.join(CER, "Cargo.toml"), "--", file], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, CARGO_TARGET_DIR: process.env.CARGO_TARGET_DIR || path.join(CER, "target") },
  });
  fs.unlinkSync(file);
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
  for (const line of r.stdout.split("\n")) {
    const tab = line.indexOf("\t");
    if (tab < 0) continue;
    actual.set(line.slice(0, tab), line.slice(tab + 1).replace(/\\n/g, "\n").replace(/\\\\/g, "\\"));
  }
}

// A thrown value compares by its kind only: the messages are the engine's own.
const kindOf = (t) => (t.startsWith("t:") ? "t" : t);
const same = (a, b) => (a.startsWith("t:") && b.startsWith("t:") ? true : kindOf(a) === kindOf(b));

const groups = new Map();
let cerPass = 0;
let cePass = 0;
let both = 0;
let cerOnly = 0;
let ceOnly = 0;
const failures = [];
for (const [name, , group] of PROBES) {
  const ok = same(expected.get(name), actual.get(name) ?? "<missing>");
  const ceOk = !KNOWN_GAPS.has(name);
  if (ok) cerPass++;
  if (ceOk) cePass++;
  if (ok && ceOk) both++;
  if (ok && !ceOk) cerOnly++;
  if (!ok && ceOk) ceOnly++;
  const g = groups.get(group) || { n: 0, cer: 0, ce: 0 };
  g.n++;
  if (ok) g.cer++;
  if (ceOk) g.ce++;
  groups.set(group, g);
  if (!ok) failures.push([group, name, expected.get(name), actual.get(name)]);
}

const report = {
  probes: PROBES.length,
  cer: cerPass,
  componentEngine: cePass,
  both,
  cerOnly,
  componentEngineOnly: ceOnly,
  build: useJs ? "js" : "native",
  groups: Object.fromEntries(groups),
};
if (asJson) {
  process.stdout.write(JSON.stringify(report) + "\n");
} else {
  console.log(`probes: ${PROBES.length}`);
  console.log(`CEr (${report.build}) agrees with Node: ${cerPass}`);
  console.log(`ComponentEngine agrees with Node:  ${cePass} (all but its KNOWN_GAPS)`);
  console.log(`both: ${both}, only CEr: ${cerOnly}, only ComponentEngine: ${ceOnly}\n`);
  console.log("group".padEnd(16) + "probes".padStart(8) + "CEr".padStart(8) + "CE".padStart(8));
  for (const [g, v] of [...groups.entries()].sort((a, b) => b[1].n - a[1].n)) {
    console.log(g.padEnd(16) + String(v.n).padStart(8) + String(v.cer).padStart(8) + String(v.ce).padStart(8));
  }
  if (list) {
    console.log("\nCEr's failures:");
    for (const [g, n, want, got] of failures) {
      console.log(`  ${g}/${n}: want ${JSON.stringify(want).slice(0, 60)} got ${JSON.stringify(got).slice(0, 80)}`);
    }
  }
}
