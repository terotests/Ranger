#!/usr/bin/env node
// Compares an es_conformance_main run against the values Node produces for the
// same probe bodies, using the same classification the native harness uses.
//
//   node scripts/es-conformance-oracle.cjs <output-file>
//
// This is the Node-oracle leg for the NATIVE harness. The vitest suite
// tests/runtime-conformance.test.ts already does it for the engine as a module;
// this does it for the engine as a compiled program, so the two can be shown to
// agree — including on which probes are known gaps.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "tests", "runtime-conformance.test.ts");

function sliceArray(txt, marker) {
  const start = txt.indexOf(marker);
  if (start < 0) throw new Error(marker + " not found");
  // After the `=`, so a TS type annotation like Array<[name: string, ...]>
  // is not mistaken for the array literal.
  const open = txt.indexOf("[", txt.indexOf("=", start));
  let depth = 0, inString = null, escaped = false, i = open;
  for (; i < txt.length; i++) {
    const c = txt[i];
    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (c === inString) inString = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inString = c; continue; }
    if (c === "/" && txt[i + 1] === "/") { while (i < txt.length && txt[i] !== "\n") i++; continue; }
    if (c === "[") depth++;
    else if (c === "]") { depth--; if (depth === 0) break; }
  }
  return vm.runInNewContext("(" + txt.slice(open, i + 1) + ")");
}

/** es_conformance_main's showNum, in JavaScript. */
function showNum(v) {
  if (Number.isNaN(v)) return "NaN";
  if (v === Infinity) return "+Inf";
  if (v === -Infinity) return "-Inf";
  if (v === 0) return Object.is(v, -0) ? "-0" : "+0";
  const neg = v < 0;
  let m = Math.abs(v), e = 0;
  while (m >= 2) { m /= 2; e++; }
  while (m < 1) { m *= 2; e--; }
  const scaled = (m - 1) * 67108864;
  const hi = Math.floor(scaled);
  const lo = Math.floor((scaled - hi) * 67108864);
  return `${neg ? "-" : "+"}1.${hi}:${lo}p${e}`;
}

/** es_conformance_main's showStr, in JavaScript. */
function showStr(s) {
  let plain = true;
  for (let i = 0; i < s.length; i++) {
    const u = s.charCodeAt(i);
    if (u < 32 || u > 126) plain = false;
  }
  if (plain) return "str:" + s;
  return "strhex:" + Buffer.from(s, "utf8").toString("hex");
}

function classify(v) {
  if (typeof v === "number") return "num:" + showNum(v);
  if (typeof v === "string") return showStr(v);
  if (typeof v === "boolean") return "bool:" + (v ? "true" : "false");
  if (v === undefined) return "undef";
  if (v === null) return "null";
  return "kind:" + typeof v;
}

function main() {
  const outFile = process.argv[2];
  if (!outFile) {
    console.error("usage: es-conformance-oracle.cjs <output-file>");
    process.exit(2);
  }
  const txt = fs.readFileSync(SRC, "utf8");
  const probes = sliceArray(txt, "const PROBES");
  const knownGaps = new Set(sliceArray(txt, "const KNOWN_GAPS"));
  const names = new Set(probes.map((p) => p[0]));

  // Only lines whose prefix is a real probe name. The engine prints parser
  // diagnostics ("Parse error", "Unexpected token") for probes it cannot parse,
  // and those are not attributable to any one probe.
  const got = new Map();
  for (const line of fs.readFileSync(outFile, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const name = line.slice(0, eq);
    if (names.has(name)) got.set(name, line.slice(eq + 1));
  }

  const missing = [];
  const agree = [];
  const differ = [];
  const brokenProbe = [];
  for (const [name, body] of probes) {
    let want;
    try {
      want = classify(new Function(body)());
    } catch (err) {
      brokenProbe.push(name);
      continue;
    }
    if (!got.has(name)) { missing.push(name); continue; }
    if (got.get(name) === want) agree.push(name);
    else differ.push({ name, got: got.get(name), want });
  }

  const differNames = new Set(differ.map((d) => d.name));
  const unexpected = differ.filter((d) => !knownGaps.has(d.name));
  const closedGaps = [...knownGaps].filter((n) => names.has(n) && !differNames.has(n) && got.has(n));

  console.log(`probes            ${probes.length}`);
  console.log(`answered          ${got.size}`);
  console.log(`agree with Node   ${agree.length}`);
  console.log(`differ            ${differ.length}   (known gaps: ${differ.length - unexpected.length})`);
  console.log(`missing           ${missing.length}`);
  console.log(`broken probe      ${brokenProbe.length}   (Node itself throws)`);
  console.log(`gaps that CLOSED  ${closedGaps.length}`);
  if (missing.length) console.log("\nMISSING:\n  " + missing.slice(0, 20).join("\n  "));
  if (unexpected.length) {
    console.log(`\nUNEXPECTED DIFFERENCES (${unexpected.length}):`);
    for (const d of unexpected.slice(0, 40)) {
      console.log(`  ${d.name}\n     got  ${d.got}\n     want ${d.want}`);
    }
  }
  if (closedGaps.length) console.log("\nKNOWN GAPS THAT NOW PASS:\n  " + closedGaps.join("\n  "));
  process.exitCode = unexpected.length > 0 || missing.length > 0 ? 1 : 0;
}

main();
