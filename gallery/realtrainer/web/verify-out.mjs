#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// WHAT THE DEPLOYMENT IS ABOUT TO SERVE.
//
//   node gallery/realtrainer/web/verify-out.mjs <dir>
//
// The page is not one file any more: the entries import chunks with hashed
// names, and the chart compiler is a chunk the page asks for only after the
// first frame. A deployment step that checked `bundle.js` was non-empty would
// now pass on a directory missing most of the app.
//
// So this reads the manifest the build wrote from the bundler's own metafile
// and holds the directory to it: every script present and non-empty, at least
// one chunk still deferred — a zero there means the late import folded back
// into the first download and nobody would have noticed — and the app and the
// DOM painter really in the bytes. Those are STRING LITERALS the programs
// themselves contain — an element id the app names, the class the DOM painter
// puts on every node it makes — and not identifiers: the output is minified,
// and a minifier renames every identifier including `RealTrainerDemo`.

import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: verify-out.mjs <dir>");
  process.exit(2);
}
const fail = (why) => { console.error(`the built page is wrong: ${why}`); process.exit(1); };

const manifestPath = path.join(dir, "build-manifest.json");
if (!fs.existsSync(manifestPath)) fail("no build-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const name of ["index.html", "seed.json"]) {
  if (!fs.existsSync(path.join(dir, name)) || !fs.statSync(path.join(dir, name)).size) fail(`${name} missing or empty`);
}
for (const f of manifest.scripts || []) {
  if (!fs.existsSync(path.join(dir, f))) fail(`${f} was built and not shipped`);
  if (!fs.statSync(path.join(dir, f)).size) fail(`${f} is empty`);
}
if (!(manifest.deferred || []).length) {
  fail("nothing is deferred — the chart chunk folded back into the first download");
}
const all = manifest.scripts.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("");
for (const s of ["rt-nav-home", "rt-home-tab-stats", "evg-node"]) {
  if (!all.includes(s)) fail(`no sign of ${s} in the scripts`);
}
const kb = (f) => Math.round(fs.statSync(path.join(dir, f)).size / 1024);
console.log(
  `  ${manifest.scripts.length} scripts, ${manifest.deferred.length} deferred ` +
  `(${manifest.deferred.map((f) => `${f} ${kb(f)} KB`).join(", ")})`,
);
