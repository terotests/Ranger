#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// TreeCtl's keyboard drag against what the library actually did.
//
// The companion to `tree_dnd_oracle.mjs`, and it exists for the same reason
// `ui:table:check` does: the reference publishes the interesting part of this
// feature nowhere a DOM trace can see it. A keyboard drag moves a target
// between rows and BETWEEN rows, and until the drop lands the page looks
// identical from one arrow press to the next. So the comparison is against a
// recorded capture rather than a live trace.
//
// Every field of every step is compared, so a target that is right in kind and
// wrong in level fails on the level.
//
//   node gallery/ui/conformance/oracle/tree_dnd_check.mjs

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const require = createRequire(import.meta.url);
const { buildHost } = require(path.join(ROOT, "gallery/ui/conformance/build-host.cjs"));
const M = require(path.join(ROOT, "gallery/ui/bin/ui_host.cjs"));

const oracle = JSON.parse(fs.readFileSync(path.join(HERE, "tree-dnd.json"), "utf8"));

let passed = 0;
let failed = 0;
const eq = (name, got, want) => {
  if (got === want) {
    passed++;
    return;
  }
  failed++;
  console.log("  FAIL " + name);
  console.log("       got  " + JSON.stringify(got));
  console.log("       want " + JSON.stringify(want));
};

// What the controller says its drag looks like, in the oracle's vocabulary.
function look(host, ctl) {
  const kinds = ["none", "item", "line"];
  const rows = [];
  for (let i = 0; i < ctl.rowValue.length; i++) rows.push(ctl.rowValue[i]);
  return {
    dragging: ctl.dragging,
    dragged: ctl.draggedValues.slice(),
    kind: ctl.dropKind === 0 ? "none" : kinds[ctl.dropKind],
    // The oracle names the root by its id; this side stores "" for it only when
    // there is no parent, so map the root's value through unchanged.
    item: ctl.dropKind === 0 ? "" : ctl.dropItem,
    childIndex: ctl.dropKind === 2 ? ctl.dropChildIndex : -1,
    insertionIndex: ctl.dropKind === 2 ? ctl.dropInsertIndex : -1,
    lineIndex: ctl.dropKind === 2 ? ctl.dropLineIndex : -1,
    lineLevel: ctl.dropKind === 2 ? ctl.dropLineLevel : -99,
    focused: host.focusId,
    order: rows,
  };
}

for (const run of oracle.runs) {
  console.log("--- " + run.name + " ---");
  const host = buildHost(M, oracle.fixture, "");
  const ctl = host.ctls[0];

  host.clickWith("tr-item-" + run.click, false, false);
  for (const [id, mods] of run.extraClicks || []) {
    host.clickWith("tr-item-" + id, mods.includes("Shift"), mods.includes("Control"));
  }

  for (let s = 0; s < run.steps.length; s++) {
    const want = run.steps[s];
    if (s > 0) host.key(want.step);
    const got = look(host, ctl);
    const at = run.name + " :: " + want.step;
    eq(at + " :: dragging", got.dragging, want.dragging);
    eq(at + " :: dragged", got.dragged.join(","), want.dragged.join(","));
    eq(at + " :: kind", got.kind, want.kind);
    eq(at + " :: item", got.item, want.item);
    eq(at + " :: childIndex", got.childIndex, want.childIndex);
    eq(at + " :: insertionIndex", got.insertionIndex, want.insertionIndex);
    eq(at + " :: lineIndex", got.lineIndex, want.lineIndex);
    eq(at + " :: lineLevel", got.lineLevel, want.lineLevel);
    eq(at + " :: order", got.order.join(","), want.order.join(","));
    // Focus is compared only where the reference has one: a line target leaves
    // DOM focus wherever it was, and the two sides agree about that by both
    // not moving it.
    if (want.focused) eq(at + " :: focused", got.focused, want.focused);
  }
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) {
  console.log("FAILURES");
  process.exit(1);
}
console.log("ALL PASS");
