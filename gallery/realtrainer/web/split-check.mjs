#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// THE SPLIT, HELD TO A BUDGET.
//
//   npm run rt:split        (after: npm run rt:page)
//
// PLAN_WEB_LOADING.md S11. A code split is not a change, it is a property, and
// a property nobody checks is a property that lasts until the next commit. One
// `new VlCompile()` in a screen, one doc comment naming a class, one
// convenience re-export, and 100 KB walks back into the first download with no
// symptom at all — every check still passes, every screen still draws, the
// page is just slower for everyone forever.
//
// So: what a visitor downloads before the first frame, in bytes as the wire
// carries them, against a number in `split-budget.json`; and the classes that
// were put behind a seam, asserted to be behind it still. The budget may
// shrink and must not grow — a commit that raises it is making an argument,
// which is the point.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(HERE, "build-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("build-manifest.json missing — run `npm run rt:page` first");
  process.exit(3);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const budget = JSON.parse(fs.readFileSync(path.join(HERE, "split-budget.json"), "utf8"));

let passed = 0, failed = 0;
const ok = (what, cond, detail = "") => {
  if (cond) passed += 1; else failed += 1;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : "  (" + detail + ")"}`);
};

const gzipOf = (name) =>
  zlib.gzipSync(fs.readFileSync(path.join(HERE, name)), { level: 9 }).length;
const sum = (names) => names.reduce((n, f) => n + gzipOf(f), 0);

console.log("--- what a visitor downloads before the first frame ---");
for (const [arrangement, limit] of Object.entries(budget.firstFrameGzip)) {
  const files = manifest.firstFrame[arrangement] || [];
  const bytes = sum(files);
  console.log(`  ${arrangement}: ${files.length} scripts`);
  for (const f of files.sort((a, b) => gzipOf(b) - gzipOf(a))) {
    console.log(`      ${String(gzipOf(f)).padStart(7)}  ${f}`);
  }
  ok(`the ${arrangement} path is within its budget`, bytes <= limit,
     `${bytes} gzipped against ${limit}`);
}

const deferredBytes = sum(manifest.deferred);
ok("the deferred half is within its budget", deferredBytes <= budget.deferredGzipMax,
   `${deferredBytes} gzipped against ${budget.deferredGzipMax}`);
ok("and there is a deferred half at all", manifest.deferred.length > 0);

console.log("--- what must not be in the first download ---");
// Asked of the module the page's entries import, which is where the answer
// is: a class in the cold module cannot be in the first download, and a class
// in the hot one is, whatever the bundler then does with it.
const hotModule = fs.readFileSync(path.join(HERE, "..", "bin", "RealTrainerDemo.mjs"), "utf8");
const hotClasses = new Set(
  [...hotModule.matchAll(/^class ([A-Za-z0-9_$]+)/gm)].map((m) => m[1]),
);
for (const name of budget.mustBeDeferred) {
  ok(`${name} is behind the seam`, !hotClasses.has(name));
}

console.log(`\npassed = ${passed}  failed = ${failed}`);
console.log(failed === 0 ? "ALL PASS" : `${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
