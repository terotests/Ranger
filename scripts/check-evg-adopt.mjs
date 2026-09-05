#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// `EVGElement.adoptFrom` must mention every field of EVGElement.
//
// The reconciler keeps an element and has it take on what a freshly built one
// describes. That copy is 180 assignments written by name, and a field added to
// the class and not added there would be dropped on every rebuild — a bug whose
// symptom is "it works until you interact with it", appearing in whichever
// feature happens to use that field next rather than in the commit that caused
// it.
//
// EVGReconcileTest catches the same mistake from the other end, by comparing a
// reconciled tree's display list, accessible tree and hit test against a freshly
// built one. That check is stronger — it needs no list to be maintained — but it
// only fires for fields that reach one of those artefacts, and it names the
// symptom rather than the field. This one names the field.
//
//   node scripts/check-evg-adopt.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "gallery/evg/EVGElement.rgr");

// Structure and in-flight state, which adoptFrom must NOT copy. Each is a
// decision with a reason, so the reason lives here rather than in a bare list.
const EXPECTED_SKIPS = {
  parent: "structure — a back-reference the reconciler owns",
  children: "structure — EVGReconcile decides the child list",
  transitions: "the in-flight animations, which are the reason the element is kept",
  paintStamp: "this element's own count of paint changes — adopting is one, so it is moved on, not copied",
};

const src = fs.readFileSync(FILE, "utf8").split("\n");

const classAt = src.findIndex((l) => l.startsWith("class EVGElement"));
if (classAt < 0) throw new Error("class EVGElement not found in " + FILE);

const fields = [];
for (let i = classAt + 1; i < src.length; i++) {
  const line = src[i];
  // The field block ends at the first method or the constructor.
  if (/^\s{4}(Constructor|s?fn)\s/.test(line)) break;
  const m = /^\s{4}def\s+(\w+)(@\([^)]*\))?:/.exec(line);
  if (m) fields.push(m[1]);
}
if (fields.length === 0) throw new Error("no fields parsed — has the class layout changed?");

const bodyStart = src.findIndex((l) => l.includes("fn adoptFrom:void ("));
if (bodyStart < 0) throw new Error("adoptFrom not found in " + FILE);
const assigned = new Set();
for (let i = bodyStart + 1; i < src.length; i++) {
  if (/^\s{4}\}/.test(src[i])) break;
  const m = /^\s+(\w+)\s*=\s*other\.(\w+)\s*$/.exec(src[i]);
  if (!m) continue;
  if (m[1] !== m[2]) {
    console.error(`adoptFrom assigns ${m[1]} from other.${m[2]} — a copy must be field-to-itself`);
    process.exit(1);
  }
  assigned.add(m[1]);
}

const missing = fields.filter((f) => !assigned.has(f) && !(f in EXPECTED_SKIPS));
const strayed = [...assigned].filter((f) => !fields.includes(f));
const skippedButCopied = Object.keys(EXPECTED_SKIPS).filter((f) => assigned.has(f));

let bad = false;
for (const f of missing) {
  console.error(`EVGElement.${f} is not copied by adoptFrom — a reconciled element would lose it`);
  bad = true;
}
for (const f of strayed) {
  console.error(`adoptFrom copies "${f}", which is not a field of EVGElement`);
  bad = true;
}
for (const f of skippedButCopied) {
  console.error(`adoptFrom copies "${f}", which it must not: ${EXPECTED_SKIPS[f]}`);
  bad = true;
}

const covered = fields.length - Object.keys(EXPECTED_SKIPS).length;
console.log(
  `EVGElement: ${fields.length} fields, ${covered} copied by adoptFrom, ` +
    `${Object.keys(EXPECTED_SKIPS).length} deliberately not`,
);
if (bad) {
  console.log("");
  console.log("FAILURES");
  process.exit(1);
}
console.log("ALL PASS");
