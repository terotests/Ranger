#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The Ranger trace against the reference trace, frame by frame.
//
//   node gallery/realtrainer/web/trace-diff.mjs [--all]
//
// Both sides write the same shape — after every step, the accessibility tree
// as role, name and state — and this is where they meet. What is compared is
// the sequence of nodes a reader would stop on: buttons, headings, fields,
// dialogs, landmarks. Plain text is not, because the EVG tree does not publish
// text nodes and the day rows carry their text in their names anyway; lists
// and list items are not, because one side wraps rows in them and the other
// does not, and a wrapper is not something a reader is told about.
//
// A missing node is one the reference has and the port does not — a name the
// two do not agree on, or a control not drawn. An extra node is the reverse.
// Order matters: the sequence is what a reader tabs through. The score per
// frame is the longest common subsequence over the reference's length, and
// the gate below the table is what `rt:trace:diff` holds.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const ALL = process.argv.includes("--all");

const COMPARED = new Set([
  "button", "heading", "textbox", "checkbox", "radio", "dialog", "link", "tab",
  "banner", "main", "navigation", "region", "switch", "combobox", "menuitem",
]);

function keyOf(n) {
  const state = n.state ? ` [${n.state}]` : "";
  return `${n.role} "${n.name}"${state}`;
}

function compared(nodes) {
  return nodes.filter((n) => COMPARED.has(n.role)).map(keyOf);
}

/** Longest common subsequence, as the pairs of indices that matched. */
function lcs(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { pairs.push([i, j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

const refDir = path.join(ROOT, "traces", "reference");
const ourDir = path.join(ROOT, "traces");
if (!fs.existsSync(refDir)) {
  console.log("no reference traces yet — record them with scripts/record-reference-trace.mjs on a machine with the app");
  process.exit(0);
}

let worst = 1;
let compared_ = 0;
for (const name of fs.readdirSync(refDir).filter((f) => f.endsWith(".json")).sort()) {
  const ourPath = path.join(ourDir, name);
  if (!fs.existsSync(ourPath)) {
    console.log(`  ${name}: no Ranger trace — run npm run rt:trace:record`);
    worst = 0;
    continue;
  }
  const ref = JSON.parse(fs.readFileSync(path.join(refDir, name), "utf8"));
  const ours = JSON.parse(fs.readFileSync(ourPath, "utf8"));
  console.log(`\n  ${name}  (reference ${ref.viewport ?? "?"})`);
  ref.frames.forEach((rf, k) => {
    const of = ours.frames[k];
    const a = compared(rf.nodes);
    const b = of ? compared(of.nodes) : [];
    const pairs = lcs(a, b);
    const score = a.length ? pairs.length / a.length : 1;
    compared_ += 1;
    worst = Math.min(worst, score);
    const matchedA = new Set(pairs.map(([i]) => i));
    const matchedB = new Set(pairs.map(([, j]) => j));
    const missing = a.filter((_, i) => !matchedA.has(i));
    const extra = b.filter((_, j) => !matchedB.has(j));
    const stateNote = rf.state && of && of.state && rf.state !== of.state ? `  state ${of.state} ≠ ${rf.state}` : "";
    console.log(`    ${String(rf.step).padEnd(18)} ${(score * 100).toFixed(0).padStart(3)}%  ${pairs.length}/${a.length} in order, ${extra.length} extra${stateNote}${of && !of.handled && rf.handled ? "  (the port found nothing to press)" : ""}`);
    if (ALL || score < 1 || extra.length) {
      for (const m of missing) console.log(`        − ${m}`);
      for (const e of extra) console.log(`        + ${e}`);
    }
  });
}

console.log("");
if (compared_ === 0) {
  console.log("nothing to compare");
  process.exit(0);
}
// The gate: nothing may fall below this. Raise it as the port catches up; a
// number that only ever goes up is a number that means something.
const FLOOR = Number(process.env.RT_TRACE_FLOOR ?? "0.9");
if (worst < FLOOR) {
  console.log(`the worst frame matches ${(worst * 100).toFixed(0)}% of the reference — below the ${(FLOOR * 100).toFixed(0)}% floor`);
  process.exit(1);
}
console.log(`every frame matches at least ${(worst * 100).toFixed(0)}% of the reference in order`);
