#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The checkbox composition in the tree demo, held in place.
//
// ReUI's permissions tree puts a checkbox in every leaf row, and it is NOT a
// tree feature: its `useTree` runs the same two features as every other ReUI
// tree, and the ticked set is ordinary page state beside it. Copying that here
// changed two files, both under demo/ — `TreeCtl` was not touched. This file
// is what stops that quietly stopping being true.
//
// Four things it holds, each of which was verified by hand once and would
// otherwise stay verified by hand:
//
//   THE BOX IS ITS OWN HIT TARGET. The reference needs `stopPropagation` so
//   that ticking a row does not also select it. Here the box has its own id and
//   `EVGHitTest.idAt` answers with the deepest element carrying one, so there
//   is no propagation to stop. If the box ever loses its id this becomes a
//   click on the row and the tick silently starts moving the selection.
//
//   THE TICK TRAVELS WITH THE ROW. The set is keyed by tree VALUE. Keyed by
//   position instead, a drag would leave the tick behind on whatever row landed
//   in that slot — and nothing on screen would look wrong.
//
//   THE ROW CARRIES `aria-checked`, NOT A NESTED CHECKBOX. WAI-ARIA's
//   tree-with-checkboxes pattern has one widget per row. A folder carries no
//   checked state at all, because `aria-checked="false"` on something
//   uncheckable announces a checkbox that is not there.
//
//   A PRESS THAT NEVER TRAVELS IS STILL A CLICK. The drag arms on the press and
//   begins on the first move past a threshold, which is what lets one gesture
//   be both "open this folder" and "carry it somewhere".
//
//   node gallery/ui/demo/tree-checkbox-check.mjs

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/TreeDemo.cjs"));
const CSS = fs.readFileSync(path.join(HERE, "tree.css"), "utf8");

let passed = 0;
let failed = 0;
function ok(name, cond, detail) {
  if (cond) {
    passed++;
    console.log("  PASS " + name);
  } else {
    failed++;
    console.log("  FAIL " + name + (detail ? " — " + detail : ""));
  }
}

const fresh = () => {
  const d = new M.TreeDemo();
  d.init(CSS);
  return d;
};

// Where each visible row sits, by scanning a column that is past the boxes.
function rowTops(d) {
  const m = {};
  for (let y = 0; y < 520; y++) {
    const id = d.hitId(200, y);
    if (id && id.startsWith("tv-item-") && !(id in m)) m[id] = y;
  }
  return m;
}

// The first x at which the given row's own box answers, scanning left to right.
function boxOf(d, rowId, top) {
  for (let y = top + 4; y < top + 28; y++) {
    for (let x = 30; x < 240; x++) {
      const id = d.hitId(x, y);
      if (id === rowId + "-check") return { id, x, y };
    }
  }
  return null;
}

const names = (d) =>
  JSON.parse(d.a11yJson(1, "")).nodes
    .filter((n) => n.role === "treeitem")
    .map((n) => n.name + (n.checked === 2 ? "[x]" : ""))
    .join(" ");

console.log("--- the box is its own hit target ---");
{
  const d = fresh();
  const tops = rowTops(d);
  const box = boxOf(d, "tv-item-new-lead", tops["tv-item-new-lead"]);
  ok("a leaf row has a box", box !== null);
  // Guarded rather than assumed. A mutation that takes the box's id away makes
  // every lookup below return null, and a check that then throws reports
  // nothing at all — which reads like a crash rather than like a failure.
  ok(
    "and the row itself answers to the right of it",
    box !== null && d.hitId(box.x + 40, box.y) === "tv-item-new-lead",
    box ? d.hitId(box.x + 40, box.y) : "no box",
  );
  // Folders get none, the way the reference has it: nothing propagates, so a
  // folder box would have no state to show.
  const fbox = boxOf(d, "tv-item-leads", tops["tv-item-leads"]);
  ok("a folder row has none", fbox === null, fbox && fbox.id);
}

console.log("--- ticking is all a box click does ---");
{
  const d = fresh();
  d.press("tv-item-jane");
  const focusBefore = d.focused;
  const selBefore = d.model.selected.slice().join(",");
  const tops = rowTops(d);
  const box = boxOf(d, "tv-item-contacted-lead", tops["tv-item-contacted-lead"]);
  ok("the box is findable", box !== null);
  ok("not ticked to begin with", d.isChecked("contacted-lead") === false);
  if (box) d.press(box.id);
  ok("the box ticks", d.isChecked("contacted-lead") === true);
  ok("focus did not move", d.focused === focusBefore, `${focusBefore} -> ${d.focused}`);
  ok(
    "the selection did not change",
    d.model.selected.slice().join(",") === selBefore,
    `${selBefore} -> ${d.model.selected.slice().join(",")}`,
  );
  if (box) d.press(box.id);
  ok("and it unticks", box !== null && d.isChecked("contacted-lead") === false);
}

console.log("--- a folder still opens and closes under a plain press ---");
{
  const d = fresh();
  const before = names(d).split(" ").length;
  const tops = rowTops(d);
  // The gesture, as the page drives it: arm, never travel, release.
  d.beginPress("tv-item-activities", 140, tops["tv-item-activities"] + 16);
  d.dragDrop();
  ok("a press that never travels opened it", names(d).split(" ").length > before, names(d));
}

console.log("--- a press that begins on a box carries nothing ---");
{
  const d = fresh();
  const tops = rowTops(d);
  const box = boxOf(d, "tv-item-jane", tops["tv-item-jane"]);
  ok("the box is findable", box !== null);
  if (box) {
    d.beginPress(box.id, box.x, box.y);
    const moved = d.dragMove(box.x + 40, box.y + 40);
    ok("the move starts no drag", moved === false);
    ok("and nothing is being carried", d.model.dragging === false);
    d.dragDrop();
  }
}

console.log("--- the tick travels with the row ---");
{
  const d = fresh();
  ok("new-lead starts ticked", d.isChecked("new-lead") === true);
  const tops = rowTops(d);
  const from = tops["tv-item-new-lead"];
  const onto = tops["tv-item-globex"];
  d.beginPress("tv-item-new-lead", 140, from + 16);
  d.dragMove(140, from + 24);
  d.dragMove(140, onto + 28);
  d.dragDrop();
  const after = names(d);
  ok("it moved out of Leads", after.indexOf("New Lead") > after.indexOf("Globex"), after);
  ok("and it is still ticked", d.isChecked("new-lead") === true, after);
}

console.log("--- what a reader gets ---");
{
  const d = fresh();
  const nodes = JSON.parse(d.a11yJson(1, "")).nodes;
  const items = nodes.filter((n) => n.role === "treeitem");
  ok("no nested checkbox widget", nodes.filter((n) => n.role === "checkbox").length === 0);
  // 2 = yes, 1 = no, absent = not applicable. A folder must be the third.
  const folders = ["Leads", "Accounts", "Acme Corp", "Activities"];
  ok(
    "folders carry no checked state",
    items.filter((n) => folders.includes(n.name)).every((n) => !n.checked),
    items.filter((n) => folders.includes(n.name)).map((n) => n.name + "=" + n.checked).join(),
  );
  ok(
    "every leaf carries one",
    items.filter((n) => !folders.includes(n.name)).every((n) => n.checked === 1 || n.checked === 2),
    items.filter((n) => !folders.includes(n.name)).map((n) => n.name + "=" + n.checked).join(),
  );
  ok(
    "and it follows the set",
    items.find((n) => n.name === "New Lead").checked === 2 &&
      items.find((n) => n.name === "John Smith").checked === 1,
  );
  ok("no lint", d.a11yProblems().length === 0, d.a11yProblems().join("; "));
  ok("no host lint", d.hostProblems().length === 0, d.hostProblems().join("; "));
  ok("no style errors", d.styleErrorCount() === 0);
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) {
  console.log("FAILURES");
  process.exit(1);
}
console.log("ALL PASS");
