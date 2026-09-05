#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// No two tags in one `treefactory` may share a name.
//
//   node scripts/check-tree-tags.mjs
//
// This exists because of a silent one. The dashboard's table had
//
//   tag Head EVGElement (props (className "db-thead") (role "rowgroup"))
//
// and a page-header tag two hundred lines further down was also called `Head`.
// The compiler said nothing, the second definition won, and the table's head
// became a plain div — so the `rowgroup` went out of the accessible tree and
// took the header row's grouping with it. The PICTURE was identical. What
// noticed was a gate that happened to count row groups, and only because that
// gate had been written for an unrelated reason.
//
// A duplicate tag is never intentional: the whole point of the name is to say
// which element you meant. So it is checked here, over every `.rgr` in the
// gallery, rather than left to whichever gate happens to look at the right
// property next time.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

function* rgrFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "bin" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* rgrFiles(p);
    else if (e.name.endsWith(".rgr")) yield p;
  }
}

let files = 0;
let factories = 0;
const problems = [];

for (const file of rgrFiles(path.join(ROOT, "gallery"))) {
  const text = fs.readFileSync(file, "utf8");
  if (!/^\s*treefactory\s/m.test(text)) continue;
  files++;
  const lines = text.split("\n");
  let name = null;
  let depth = 0;
  let seen = null;
  lines.forEach((line, i) => {
    if (name === null) {
      const m = /^\s*treefactory\s+(\w+)\s*\{/.exec(line);
      if (m) { name = m[1]; depth = 1; seen = new Map(); factories++; }
      return;
    }
    const tag = /^\s*tag\s+(\w+)\s/.exec(line);
    if (tag) {
      const t = tag[1];
      if (seen.has(t)) {
        problems.push(
          `${path.relative(ROOT, file)}:${i + 1}: treefactory ${name} declares tag ` +
          `${t} twice (first at line ${seen.get(t)}) — the later one wins, silently`,
        );
      } else {
        seen.set(t, i + 1);
      }
    }
    // Brace depth, so the factory's end is found rather than assumed.
    for (const ch of line) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
    }
    if (depth <= 0) name = null;
  });
}

console.log(`tree factories: ${factories} in ${files} file(s)`);
if (problems.length) {
  for (const p of problems) console.log("  FAIL " + p);
  console.log(`\nRESULT FAIL — ${problems.length} duplicate tag name(s)`);
  process.exit(1);
}
console.log("ALL PASS — every tag name is declared once");
