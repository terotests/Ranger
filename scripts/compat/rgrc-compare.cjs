// SPDX-License-Identifier: MIT
//
// What `dist/rgrc.js` runs while rgrc-compare.mjs is installed (see there).
//
// 1. the head compiler with the caller's own arguments: the build gets exactly
//    the output, messages and exit code it would get without the gate;
// 2. the base and then the head compiler into one scratch directory, one
//    after the other, so a path a compiler writes into its output is the same
//    in both; the two outputs are compared file by file and the result is
//    appended to tmp/rgrc-compare/report.jsonl.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const DIST = path.resolve(__dirname, "..", "..", "dist");
const HEAD = path.join(DIST, "rgrc.head.js");
const BASE = path.join(DIST, "rgrc.base.js");
const WORK = path.resolve(DIST, "..", "tmp", "rgrc-compare");
const REPORT = path.join(WORK, "report.jsonl");

const args = process.argv.slice(2);
const cwd = process.cwd();

function run(compiler, argv, quiet) {
  return spawnSync(process.execPath, [...process.execArgv, compiler, ...argv], {
    cwd,
    stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    maxBuffer: 1 << 30,
  });
}

function withOutDir(dir) {
  const out = args.filter((a) => !a.startsWith("-d="));
  out.push(`-d=${dir}`);
  return out;
}

function listFiles(dir, rel = "") {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (e.isDirectory()) out.push(...listFiles(dir, r));
    else out.push(r);
  }
  return out.sort();
}

function compare(a, b) {
  const fa = listFiles(a);
  const fb = listFiles(b);
  const all = [...new Set([...fa, ...fb])].sort();
  const diff = [];
  for (const f of all) {
    const pa = path.join(a, f);
    const pb = path.join(b, f);
    if (!fs.existsSync(pa)) diff.push(`only head: ${f}`);
    else if (!fs.existsSync(pb)) diff.push(`only base: ${f}`);
    else if (!fs.readFileSync(pa).equals(fs.readFileSync(pb))) diff.push(`differs: ${f}`);
  }
  return { diff, files: all.length };
}

const real = run(HEAD, args, false);
const status = real.status === null ? 1 : real.status;

// Only a compile that writes somewhere is compared (not --help, not a check).
const compiles = args.some((a) => a.endsWith(".rgr") || a.endsWith(".rs"));
if (compiles) {
  fs.mkdirSync(WORK, { recursive: true });
  const id = crypto.randomBytes(6).toString("hex");
  const T = path.join(WORK, "run", id, "out");
  fs.mkdirSync(path.dirname(T), { recursive: true });
  const b = run(BASE, withOutDir(T), true);
  const baseOk = b.status === 0 && listFiles(T).length > 0;
  fs.renameSync(T, T + ".base");
  const h = run(HEAD, withOutDir(T), true);
  const headOk = h.status === 0 && listFiles(T).length > 0;
  const row = { cwd, args, base: b.status, head: h.status };
  if (!baseOk && headOk) row.result = "NEW";
  else if (baseOk && !headOk) row.result = "HEAD-FAIL";
  else if (!baseOk && !headOk) row.result = "SAME"; // both reject it
  else {
    const c = compare(T, T + ".base");
    row.result = c.diff.length === 0 ? "SAME" : "DIFF";
    row.compared = c.files;
    if (c.diff.length) row.files = c.diff.slice(0, 20);
  }
  fs.appendFileSync(REPORT, JSON.stringify(row) + "\n");
  if (row.result === "SAME") fs.rmSync(path.dirname(T), { recursive: true, force: true });
}
process.exit(status);
