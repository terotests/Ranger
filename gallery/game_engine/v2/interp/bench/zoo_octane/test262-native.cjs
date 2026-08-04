#!/usr/bin/env node
// Run the test262 ES5 corpus through a NATIVE engine binary.
//
//   node test262-native.cjs --corpus=/path/to/test262 [--dir=test/language] \
//                           [--bin=path/to/octane_runner] [--limit=N] [--jobs=N]
//
// Scope matches CONFORMANCE.md: files tagged `es5id`, excluding Temporal and
// intl402. Each test is assembled the way test262 specifies -- assert.js, sta.js,
// any `includes:`, then the test source -- written to a temp directory and run by
// the binary. A test passes when it completes without throwing; a `negative:`
// test passes when it does NOT run to completion (a `phase: parse` test fails
// in the parser, which produces silence rather than an error message).
//
// The binary reports failures as an "Uncaught exception" line rather than an
// exit status, so both are checked. A test that produces no completion marker
// at all is counted as a crash, not a pass -- silence must never look like
// success.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..", "..");

function parseArgs(argv) {
  const o = {
    corpus: null,
    dir: "test",
    bin: path.join(ROOT, "gallery", "game_engine", "v2", "interp", "bin", "llvm", "octane_runner"),
    limit: Infinity,
    timeout: 15000,
    failFile: process.env.T262_FAIL_FILE || null,
  };
  for (const a of argv) {
    if (a.startsWith("--corpus=")) o.corpus = a.slice(9);
    else if (a.startsWith("--dir=")) o.dir = a.slice(6);
    else if (a.startsWith("--bin=")) o.bin = a.slice(6);
    else if (a.startsWith("--limit=")) o.limit = Number(a.slice(8));
    else if (a.startsWith("--timeout=")) o.timeout = Number(a.slice(10));
  }
  return o;
}

/** The YAML-ish frontmatter test262 puts in every file. */
function frontmatter(src) {
  const m = /\/\*---([\s\S]*?)---\*\//.exec(src);
  if (!m) return null;
  const body = m[1];
  const meta = { includes: [], flags: [], features: [], negative: null, es5id: null };
  const idm = /^\s*es5id:\s*(\S+)/m.exec(body);
  if (idm) meta.es5id = idm[1];
  const inc = /^\s*includes:\s*\[(.*?)\]/m.exec(body);
  if (inc) meta.includes = inc[1].split(",").map((s) => s.trim()).filter(Boolean);
  const incBlock = /^\s*includes:\s*\n((?:\s*-\s*\S+\n)+)/m.exec(body);
  if (incBlock) {
    meta.includes = incBlock[1].split("\n").map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
  }
  const fl = /^\s*flags:\s*\[(.*?)\]/m.exec(body);
  if (fl) meta.flags = fl[1].split(",").map((s) => s.trim()).filter(Boolean);
  const ft = /^\s*features:\s*\[(.*?)\]/m.exec(body);
  if (ft) meta.features = ft[1].split(",").map((s) => s.trim()).filter(Boolean);
  const neg = /^\s*negative:\s*\n\s*phase:\s*(\S+)\s*\n\s*type:\s*(\S+)/m.exec(body);
  if (neg) meta.negative = { phase: neg[1], type: neg[2] };
  return meta;
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".js") && !e.name.endsWith("_FIXTURE.js")) out.push(p);
  }
  return out;
}

const opt = parseArgs(process.argv.slice(2));
if (!opt.corpus || !fs.existsSync(opt.corpus)) {
  console.error("usage: test262-native.cjs --corpus=/path/to/test262 [--dir=test/language]");
  process.exit(2);
}
if (!fs.existsSync(opt.bin)) {
  console.error("missing binary:", opt.bin);
  process.exit(2);
}

const HARNESS = path.join(opt.corpus, "harness");
const readHarness = (n) => fs.readFileSync(path.join(HARNESS, n), "utf8");
const ASSERT = readHarness("assert.js");
const STA = readHarness("sta.js");
const harnessCache = new Map();
function includeSrc(name) {
  if (!harnessCache.has(name)) harnessCache.set(name, readHarness(name));
  return harnessCache.get(name);
}

const root = path.join(opt.corpus, opt.dir);
let files = walk(root, []);
files = files.filter((f) => !/[\\/](intl402|staging|Temporal)[\\/]/.test(f));

// ES5 scope: the corpus tags every ES5-era test with es5id.
const selected = [];
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const meta = frontmatter(src);
  if (!meta || !meta.es5id) continue;
  if (meta.flags.includes("module")) continue;
  if (meta.flags.includes("async")) continue;
  selected.push({ file: f, src, meta });
  if (selected.length >= opt.limit) break;
}

console.log("binary :", opt.bin);
console.log("corpus :", root);
console.log("es5 tests:", selected.length, "of", files.length, "files");
console.log("");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "t262-"));
const DONE = "__T262_DONE__";
let pass = 0, fail = 0, crash = 0;
const failures = [];

for (const t of selected) {
  const parts = [ASSERT, STA];
  let missingInclude = null;
  for (const inc of t.meta.includes) {
    try {
      parts.push(includeSrc(inc));
    } catch (e) {
      missingInclude = inc;
    }
  }
  if (missingInclude) continue;
  const strict = t.meta.flags.includes("onlyStrict");
  const prologue = strict ? '"use strict";\n' : "";
  // The completion marker must be the LAST thing the script does: if the test
  // throws, it is never printed, which is how a failure is detected.
  const body = prologue + parts.join("\n") + "\n" + t.src + "\nconsole.log('" + DONE + "');\n";
  const file = "t.js";
  fs.writeFileSync(path.join(dir, file), body);
  const r = spawnSync(opt.bin, [dir, file], { encoding: "utf8", timeout: opt.timeout });
  const out = String(r.stdout || "") + String(r.stderr || "");
  const completed = out.includes(DONE);
  const threw = /Uncaught exception|Test262Error/.test(out);
  const rel = path.relative(opt.corpus, t.file);

  if (t.meta.negative) {
    // A negative test must NOT run to completion. A `phase: parse` test fails
    // in the parser, which produces no exception line at all -- only silence --
    // so requiring a thrown-error message counted every early-error test as a
    // failure. A timeout is still a failure: it says nothing about the error.
    const timedOut = r.status === null && !completed;
    if (!completed && !timedOut) pass++;
    else {
      fail++;
      failures.push({ rel, why: completed ? "did not reject" : "timeout" });
    }
    continue;
  }
  if (completed && !threw) pass++;
  else if (threw) {
    fail++;
    const m = /Uncaught exception: (.{0,120})/.exec(out);
    failures.push({ rel, why: m ? m[1].replace(/\s+/g, " ") : "threw" });
  } else {
    crash++;
    failures.push({ rel, why: r.status === null ? "timeout/killed" : "no output (exit " + r.status + ")" });
  }
}

const total = pass + fail + crash;
console.log("pass  ", pass);
console.log("fail  ", fail);
console.log("crash ", crash);
console.log("");
console.log("score  " + pass + "/" + total + (total ? "  (" + ((100 * pass) / total).toFixed(2) + "%)" : ""));

if (failures.length && opt.failFile) {
  fs.writeFileSync(opt.failFile, failures.map((f) => f.rel + "\t" + f.why).join("\n") + "\n");
  console.log("full list:", opt.failFile);
}
if (failures.length) {
  console.log("");
  console.log("sample failures:");
  for (const f of failures.slice(0, 25)) console.log("  " + f.rel + "  — " + f.why);
}

fs.rmSync(dir, { recursive: true, force: true });
