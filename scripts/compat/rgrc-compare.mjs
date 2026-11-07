#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// The compatibility gate for compiler changes: does the new `dist/rgrc.js`
// write exactly what the old one wrote, for every program somebody else's
// build compiles?
//
// It does not know those builds. It stands in for `dist/rgrc.js` while they
// run, so whatever a build compiles (MFilesAPI's desktop/web/build.sh,
// desktop/uix/build.sh, desktop/wasm-rs/build.sh, a cargo build.rs, EVGUI's
// demos…) is compiled twice, with the old compiler and with the new one, into
// the same directory one after the other, and the two outputs are compared
// byte for byte. The build carries on with the new compiler's output and
// exit code, so it behaves as it would with the new compiler alone.
//
//   node scripts/compat/rgrc-compare.mjs install [--base <git ref>]   (default origin/master)
//   … run the builds …
//   node scripts/compat/rgrc-compare.mjs report      exit 1 when any output differs
//   node scripts/compat/rgrc-compare.mjs uninstall   puts the new dist/rgrc.js back
//
// A program the old compiler rejects (one that uses a form only the new one
// knows) is reported as NEW and is not a failure: there is nothing to keep
// compatible with. Identical output for everything else means the change is
// invisible to existing code; a display list drawn from identical code is
// identical too, so nothing downstream has to be compared.

import fs from "node:fs";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const DIST = path.join(ROOT, "dist");
const MAIN = path.join(DIST, "rgrc.js");
const HEAD = path.join(DIST, "rgrc.head.js");
const BASE = path.join(DIST, "rgrc.base.js");
const WORK = path.join(ROOT, "tmp", "rgrc-compare");
const REPORT = path.join(WORK, "report.jsonl");
const MARK = "// rgrc-compare shim";

const shim = `#!/usr/bin/env node
${MARK}: runs rgrc.base.js and rgrc.head.js, compares, keeps head's output.
require(${JSON.stringify(path.join(HERE, "rgrc-compare.mjs").replace(/\.mjs$/, ".cjs"))});
`;

function install(baseRef) {
  if (fs.readFileSync(MAIN, "utf8").includes(MARK)) {
    console.log("already installed");
    return;
  }
  fs.mkdirSync(WORK, { recursive: true });
  const base = execFileSync("git", ["-C", ROOT, "show", `${baseRef}:dist/rgrc.js`], { maxBuffer: 1 << 30 });
  fs.writeFileSync(BASE, base);
  fs.copyFileSync(MAIN, HEAD);
  fs.writeFileSync(MAIN, shim);
  fs.writeFileSync(path.join(WORK, "base-ref"), baseRef + "\n");
  console.log(`installed: base ${baseRef}, head = the working tree's dist/rgrc.js; report in ${REPORT}`);
}

function uninstall() {
  if (!fs.existsSync(HEAD)) {
    console.log("not installed");
    return;
  }
  fs.copyFileSync(HEAD, MAIN);
  fs.rmSync(HEAD);
  fs.rmSync(BASE, { force: true });
  console.log("uninstalled: dist/rgrc.js is the head compiler again");
}

function report() {
  if (!fs.existsSync(REPORT)) {
    console.log("no compiles recorded");
    process.exit(1);
  }
  const rows = fs.readFileSync(REPORT, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const count = { SAME: 0, DIFF: 0, NEW: 0, "HEAD-FAIL": 0 };
  for (const r of rows) {
    count[r.result] = (count[r.result] || 0) + 1;
    if (r.result !== "SAME") {
      console.log(`${r.result.padEnd(9)} ${r.cwd}  ${r.args.join(" ")}`);
      for (const f of r.files || []) console.log(`            ${f}`);
    }
  }
  console.log(`compiles ${rows.length}: same ${count.SAME}, differ ${count.DIFF}, new-only ${count.NEW}, failing with head only ${count["HEAD-FAIL"]}`);
  process.exit(count.DIFF > 0 || count["HEAD-FAIL"] > 0 ? 1 : 0);
}

const cmd = process.argv[2];
if (cmd === "install") {
  const i = process.argv.indexOf("--base");
  install(i > 0 ? process.argv[i + 1] : "origin/master");
} else if (cmd === "uninstall") {
  uninstall();
} else if (cmd === "report") {
  report();
} else if (cmd === "clear") {
  fs.rmSync(REPORT, { force: true });
} else {
  console.error("usage: rgrc-compare.mjs install [--base <ref>] | report | clear | uninstall");
  process.exit(2);
}
