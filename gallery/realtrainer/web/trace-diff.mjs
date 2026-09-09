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
const ROLES = process.argv.includes("--roles");

const COMPARED = new Set([
  "button", "heading", "textbox", "checkbox", "radio", "dialog", "link", "tab",
  "banner", "main", "navigation", "region", "switch", "combobox", "menuitem",
]);

// A MENU ITEM IS A BUTTON TO THIS DIFF, for the same reason a list wrapper is
// nothing: both sides give the reader a stop with the same name in the same
// place, and only one of them says the stop is inside a menu. The port's
// calendar dropdown is `role="menu"` with `menuitem` children — which is what
// a dropdown should be, and what its own keyboard trap is built on — while the
// reference's is fourteen plain buttons in a div. Counting that as fourteen
// controls missing and fourteen invented said the port had lost the calendar
// switcher it draws perfectly well. The difference is not hidden: `--roles`
// prints every stop whose role the two sides disagree on.
const SAME_STOP = new Map([["menuitem", "button"]]);
const roleOf = (n) => SAME_STOP.get(n.role) ?? n.role;

function keyOf(n) {
  const state = n.state ? ` [${n.state}]` : "";
  return `${roleOf(n)} "${n.name}"${state}`;
}

function compared(nodes) {
  return nodes.filter((n) => COMPARED.has(n.role)).map(keyOf);
}

/** The stops whose role the two sides spell differently, name by name. */
function roleNotes(refNodes, ourNodes) {
  // By NAME, so an unnamed node is skipped: `banner ""` and `main ""` are not
  // the same stop as each other however the two sides spell them.
  const ours = new Map();
  for (const n of ourNodes) if (COMPARED.has(n.role) && n.name) ours.set(n.name, n.role);
  const out = new Map();
  for (const n of refNodes) {
    if (!COMPARED.has(n.role) || !n.name) continue;
    const mine = ours.get(n.name);
    if (mine && mine !== n.role) out.set(`${n.role} → ${mine}`, (out.get(`${n.role} → ${mine}`) ?? 0) + 1);
  }
  return [...out].map(([k, n]) => `${n} ${k}`);
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

// THE RATCHET, PER SCENARIO. One floor over everything says nothing useful the
// moment a scenario walks somewhere nobody has been: the first recording of a
// screen this port does not have yet reads 14%, and a single number either
// drops to 14 — and stops guarding the fifteen scenarios that are at 100 — or
// refuses the recording that found the gap. So every scenario carries its own
// worst frame, in `traces/parity.json`, and none of them may fall below it.
// `--bless` writes what is measured now and REFUSES to lower a baseline
// unless `RT_TRACE_BLESS_DOWN=1` says the drop is meant.
const BASE = path.join(ourDir, "parity.json");
const baseline = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, "utf8")) : {};
const BLESS = process.argv.includes("--bless");
const measured = {};

let worst = 1;
let compared_ = 0;
for (const name of fs.readdirSync(refDir).filter((f) => f.endsWith(".json")).sort()) {
  const ourPath = path.join(ourDir, name);
  if (!fs.existsSync(ourPath)) {
    console.log(`  ${name}: no Ranger trace — run npm run rt:trace:record`);
    worst = 0;
    measured[name] = 0;
    continue;
  }
  let scenarioWorst = 1;
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
    scenarioWorst = Math.min(scenarioWorst, score);
    const matchedA = new Set(pairs.map(([i]) => i));
    const matchedB = new Set(pairs.map(([, j]) => j));
    const missing = a.filter((_, i) => !matchedA.has(i));
    const extra = b.filter((_, j) => !matchedB.has(j));
    const stateNote = rf.state && of && of.state && rf.state !== of.state ? `  state ${of.state} ≠ ${rf.state}` : "";
    console.log(`    ${String(rf.step).padEnd(18)} ${(Math.floor(score * 1000) / 10).toFixed(1).padStart(5)}%  ${pairs.length}/${a.length} in order, ${extra.length} extra${stateNote}${of && !of.handled && rf.handled ? "  (the port found nothing to press)" : ""}`);
    if (ALL || score < 1 || extra.length) {
      for (const m of missing) console.log(`        − ${m}`);
      for (const e of extra) console.log(`        + ${e}`);
    }
    if (ROLES && of) {
      for (const note of roleNotes(rf.nodes, of.nodes)) console.log(`        ~ ${note}`);
    }
  });
  measured[name] = Math.floor(scenarioWorst * 1000) / 1000;
}

console.log("");
if (compared_ === 0) {
  console.log("nothing to compare");
  process.exit(0);
}
// The gate: nothing may fall below this. Raise it as the port catches up; a
// number that only ever goes up is a number that means something.
if (BLESS) {
  const down = process.env.RT_TRACE_BLESS_DOWN === "1";
  const lowered = Object.keys(measured).filter((k) => baseline[k] !== undefined && measured[k] < baseline[k]);
  if (lowered.length && !down) {
    for (const k of lowered) {
      console.log(`  ${k}: ${(baseline[k] * 100).toFixed(1)}% → ${(measured[k] * 100).toFixed(1)}%`);
    }
    console.log("\nthese would LOWER the baseline. A parity number that can fall is a");
    console.log("number nobody reads: fix the port, or say RT_TRACE_BLESS_DOWN=1 and why.");
    process.exit(1);
  }
  const next = { ...baseline };
  for (const k of Object.keys(measured)) next[k] = down ? measured[k] : Math.max(measured[k], baseline[k] ?? 0);
  fs.writeFileSync(BASE, JSON.stringify(next, null, 1) + "\n");
  console.log(`  baseline written — ${Object.keys(next).length} scenarios`);
  process.exit(0);
}

// The gate: no scenario may fall below the worst frame it was blessed at.
const fell = [];
const fresh = [];
for (const [name, score] of Object.entries(measured)) {
  if (baseline[name] === undefined) fresh.push(name);
  else if (score < baseline[name] - 1e-9) fell.push([name, score, baseline[name]]);
}
console.log("");
for (const [name, score, was] of fell) {
  console.log(`  ${name} fell to ${(score * 100).toFixed(1)}% — it was blessed at ${(was * 100).toFixed(1)}%`);
}
for (const name of fresh) {
  console.log(`  ${name} has no baseline — run \`npm run rt:trace:diff -- --bless\``);
}
if (fell.length || fresh.length) process.exit(1);

const atOne = Object.values(measured).filter((v) => v >= 0.999).length;
const total = Object.keys(measured).length;
console.log(`no scenario is below the parity it was blessed at — ${atOne} of ${total} at 100%, worst ${(Math.floor(worst * 1000) / 10).toFixed(1)}%`);
// The marker `scripts/run-gallery-editor-tests.sh` greps for. The compiler
// prints `[FAIL]` and still exits 0, so that runner refuses to take a zero
// exit as a pass — a suite has to SAY it passed.
console.log("ALL PASS");
