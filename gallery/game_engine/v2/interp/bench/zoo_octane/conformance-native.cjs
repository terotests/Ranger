#!/usr/bin/env node
// Run the runtime-conformance probes through a NATIVE engine binary and compare
// each result against Node.
//
//   node conformance-native.cjs [path/to/binary] [--group=<substr>] [--limit=N]
//
// The probes themselves live in tests/runtime-conformance.test.ts, which drives
// the es6 build in-process. A native binary cannot be driven that way -- it
// takes a directory and a file -- so the probes are extracted and each one is
// written out as a script the binary can load. Expectations stay DERIVED: Node
// runs the same source, so a probe that is wrong about JavaScript fails here
// rather than silently encoding a misunderstanding.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..", "..");
const PROBE_FILE = path.join(ROOT, "tests", "runtime-conformance.test.ts");

function parseArgs(argv) {
  let bin = path.join(
    ROOT, "gallery", "game_engine", "v2", "interp", "bin", "llvm", "octane_runner"
  );
  let group = null;
  let limit = Infinity;
  for (const a of argv) {
    if (a.startsWith("--group=")) group = a.slice(8);
    else if (a.startsWith("--limit=")) limit = Number(a.slice(8));
    else if (!a.startsWith("--")) bin = a;
  }
  return { bin, group, limit };
}

/** Pull the PROBES array literal out of the test file and evaluate it. */
function loadProbes() {
  const src = fs.readFileSync(PROBE_FILE, "utf8");
  const startMarker = "const PROBES: Array<[name: string, body: string, group: string]> = [";
  const start = src.indexOf(startMarker);
  if (start < 0) throw new Error("PROBES array not found in " + PROBE_FILE);
  const open = src.indexOf("[", start + startMarker.length - 1);
  // Walk to the matching bracket. Brackets inside string literals and inside
  // comments do not count -- a `//` comment mentioning one used to unbalance
  // the scan and swallow the rest of the file.
  let depth = 0;
  let i = open;
  let quote = null;
  let comment = null; // "line" | "block"
  for (; i < src.length; i++) {
    const c = src[i];
    const n = src[i + 1];
    if (comment === "line") {
      if (c === "\n") comment = null;
      continue;
    }
    if (comment === "block") {
      if (c === "*" && n === "/") { comment = null; i++; }
      continue;
    }
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "/" && n === "/") { comment = "line"; i++; continue; }
    if (c === "/" && n === "*") { comment = "block"; i++; continue; }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) break;
    }
  }
  const literal = src.slice(open, i + 1);
  return vm.runInNewContext("(" + literal + ")");
}

/** What Node makes of a probe body, as the engine would print it. */
// Globals a real script environment has and a bare vm sandbox does not. Without
// them the ORACLE is wrong rather than the engine: `typeof performance` is
// "object" in Node and in every engine target, but "undefined" in an empty
// sandbox, so performance-typeof was reported as a native failure when all
// three targets already agreed with Node. Keep this list to globals the engine
// genuinely provides.
function sandboxGlobals() {
  return { performance: performance };
}

function nodeValue(body) {
  try {
    const v = vm.runInNewContext(
      "(function(){" + body + "})()",
      sandboxGlobals(),
      { timeout: 5000 }
    );
    return { ok: true, text: render(v) };
  } catch (e) {
    return { ok: false, text: "throw:" + (e && e.name ? e.name : "Error") };
  }
}

function render(v) {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "number") {
    if (Number.isNaN(v)) return "NaN";
    if (v === Infinity) return "Infinity";
    if (v === -Infinity) return "-Infinity";
  }
  return String(v);
}

const { bin, group, limit } = parseArgs(process.argv.slice(2));
if (!fs.existsSync(bin)) {
  console.error("missing binary:", bin);
  process.exit(2);
}

let probes = loadProbes();
if (group) probes = probes.filter((p) => String(p[2]).includes(group));
if (probes.length > limit) probes = probes.slice(0, limit);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "conf-native-"));
const results = { pass: 0, fail: 0, crash: 0, skipNode: 0 };
const failures = [];

console.log("binary :", bin);
console.log("probes :", probes.length + (group ? " (group ~ " + group + ")" : ""));
console.log("");

for (const [name, body] of probes) {
  const expected = nodeValue(body);
  if (!expected.ok) {
    // A probe Node itself throws on is not a value comparison; skip it here.
    results.skipNode++;
    continue;
  }
  const file = "probe.js";
  fs.writeFileSync(
    path.join(dir, file),
    "var __v = (function(){" + body + "})();\nconsole.log('RESULT:' + " +
      "(__v === null ? 'null' : (__v === undefined ? 'undefined' : String(__v))));\n"
  );
  const r = spawnSync(bin, [dir, file], { encoding: "utf8", timeout: 30000 });
  const out = String(r.stdout || "") + String(r.stderr || "");
  const m = /RESULT:(.*)/.exec(out);
  if (r.status !== 0 && !m) {
    results.crash++;
    failures.push({ name, kind: "crash", want: expected.text, got: (out.trim().split("\n")[0] || "exit " + r.status) });
    continue;
  }
  const got = m ? m[1].trim() : "(no output)";
  if (got === expected.text) results.pass++;
  else {
    results.fail++;
    failures.push({ name, kind: "value", want: expected.text, got });
  }
}

const total = results.pass + results.fail + results.crash;
console.log("pass  ", results.pass);
console.log("fail  ", results.fail);
console.log("crash ", results.crash);
console.log("skipped (Node throws)", results.skipNode);
console.log("");
console.log(
  "score  " + results.pass + "/" + total +
  (total ? "  (" + ((100 * results.pass) / total).toFixed(2) + "%)" : "")
);

if (failures.length) {
  // Group by the probe-name prefix: the failures cluster by FEATURE, and a
  // flat list of 200 lines hides that a single missing feature accounts for
  // most of them.
  const byPrefix = new Map();
  for (const f of failures) {
    const key = String(f.name).split("-")[0];
    if (!byPrefix.has(key)) byPrefix.set(key, []);
    byPrefix.get(key).push(f);
  }
  const groups = [...byPrefix.entries()].sort((a, b) => b[1].length - a[1].length);
  console.log("");
  console.log("failures by feature:");
  for (const [key, fs2] of groups) {
    console.log("  " + String(key + "                ").slice(0, 16) + fs2.length);
  }
  const outFile = process.env.CONF_FAIL_FILE;
  if (outFile) {
    fs.writeFileSync(outFile, failures.map(
      (f) => f.kind + "\t" + f.name + "\twant=" + f.want + "\tgot=" + f.got
    ).join("\n") + "\n");
    console.log("");
    console.log("full list: " + outFile);
  }
}

fs.rmSync(dir, { recursive: true, force: true });
process.exit(results.fail + results.crash ? 1 : 0);
