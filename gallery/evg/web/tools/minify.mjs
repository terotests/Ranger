#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// MINIFY A COMPILED RANGER BUNDLE.
//
//   node gallery/evg/web/tools/minify.mjs --file DIR/app.js --keep AppWeb
//
// The Ranger backend writes for a reader that does not exist: long
// identifiers, one statement per line, every temporary named. None of it
// survives to the browser usefully — the source these pages are compiled from
// is a .rgr file in this repository, and a stack trace through a generated
// bundle was never the way anyone debugged one. On the PowerPoint editor it
// is 3.49 MB against 2.27, and 761 KB gzipped against 639.
//
// `--keep` names the one string the page needs out of the file: the global its
// scope publishes. A minifier renames identifiers and cannot rename a
// property, so the assignment survives — but a bundle that lost it would load
// silently and fail at the first line that used it, so it is checked.
//
// esbuild comes with the conformance host's dependencies, which these builds
// do not otherwise need. A tree without them still builds: it ships the
// larger file and says so.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");

const argv = process.argv.slice(2);
const flag = (name) => {
  const at = argv.indexOf(name);
  return at >= 0 ? argv[at + 1] : undefined;
};
const file = flag("--file");
const keep = flag("--keep");
if (!file || !fs.existsSync(file)) {
  console.error("usage: minify.mjs --file <bundle.js> [--keep <global>]");
  process.exit(2);
}

let esbuild;
try {
  esbuild = createRequire(path.join(ROOT, "gallery/ui/conformance/dom/package.json"))("esbuild");
} catch {
  console.log("  (no esbuild — shipping the unminified bundle; npm run ui:conformance:install)");
  process.exit(0);
}

const src = fs.readFileSync(file, "utf8");
const out = esbuild.transformSync(src, { minify: true }).code;
if (keep && !out.includes(keep)) {
  console.error(`minifying lost ${keep} from ${file}`);
  process.exit(1);
}
fs.writeFileSync(file, out);
const kb = (s) => Math.round(s.length / 1024);
console.log(`  minified ${path.basename(file)} ${kb(src)} KB -> ${kb(out)} KB`);
