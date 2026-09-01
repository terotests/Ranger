#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// How far EVG shrinks a flex item, against the numbers a browser produced.
//
//   node gallery/ui/conformance/oracle/flexmin_check.mjs
//
// A flex item's `min-width` computes to `auto`, and `auto` on a flex item is
// the AUTOMATIC MINIMUM SIZE — its min-content size — not zero. EVG clamped
// only against a min-width the sheet had declared, so a row could squash a
// line of words down to whatever share was left, which no browser does.
//
// Two rules, and the second is what keeps a resizable panel working: the
// minimum is the min-content size, and it applies ONLY while the item is not a
// clipping box. `overflow: hidden` puts it back to zero.
//
// What it does NOT do is make the content fit. The item stops shrinking and
// then hangs out of its row instead — see `spillsPastRow` in the oracle, and
// the note in resize.css about where the panel's real fix belongs.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const require = createRequire(import.meta.url);
const H = require(path.join(ROOT, "gallery/ui/bin/ui_host.cjs"));
const oracle = JSON.parse(fs.readFileSync(path.join(HERE, "flexmin.json"), "utf8"));

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

// The same row the oracle built: a flexible item and a rigid 40px one, inside
// a row of the case's width.
function widthOf(row) {
  const sheet = new H.EVGStyleSheet();
  const extra = row.style ? row.style + ";" : "";
  sheet.parse(
    `.row{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:flex-start;` +
      `width:${row.row}px;font-size:16px}` +
    `.item{flex:1 1 0;font-family:Arial;font-size:13px;${extra}}` +
    `.nested{display:flex;flex-direction:row;flex-wrap:nowrap}` +
    `.kid{font-family:Arial;font-size:13px;white-space:nowrap}` +
    `.rigid{width:40px;height:10px}`,
  );
  const rowEl = H.EVGElement.createDiv();
  rowEl.className = "row";
  const item = H.EVGElement.createDiv();
  item.className = "item";
  if (row.nested) {
    item.className = "item nested";
    for (const t of row.nested) {
      const kid = H.EVGElement.createDiv();
      kid.className = "kid";
      kid.textContent = t;
      item.addChild(kid);
    }
  } else {
    item.textContent = row.text;
  }
  const rigid = H.EVGElement.createDiv();
  rigid.className = "rigid";
  rowEl.addChild(item);
  rowEl.addChild(rigid);
  sheet.applyTree(rowEl, "");
  const l = new H.EVGLayout();
  l.setPageSize(900, 600);
  l.layout(rowEl);
  return item.calculatedWidth;
}

console.log("--- how far a flex item may be shrunk ---");

// EVG measures text with its own metrics, so a width will not match the
// browser's to the pixel. What is under test is the RULE — which of the two
// candidate widths the item ends up at — so each row is scored against the
// share it was offered and the minimum it should have been floored by, and a
// tolerance wide enough for the metrics but far narrower than the gap between
// those two answers.
const TOL = 8;
let skipped = 0;
for (const row of oracle.rows) {
  // A DIVERGENCE, SAID OUT LOUD RATHER THAN DELETED. EVG has no `white-space`
  // property at all — the only `nowrap` it knows is `flex-wrap` — so a row
  // that needs one cannot be expressed, let alone matched. Its min-content
  // size in a browser is the whole line, because nothing in it may break;
  // EVG's is the longest word, so it shrinks further than a browser would.
  // The rows stay in the oracle because the browser's answer is worth having
  // written down for whoever implements `white-space`.
  if (row.needsWhiteSpace) {
    skipped += 1;
    console.log(`  SKIP ${row.name} — needs white-space, which EVG has not got ` +
      `(browser ${row.width})`);
    continue;
  }
  const got = widthOf(row);
  const near = Math.abs(got - row.width) <= TOL;
  ok(`${row.name}: ${got.toFixed(2)} (browser ${row.width})`, near,
    `off by ${(got - row.width).toFixed(2)}, tolerance ${TOL}`);
}

console.log("--- and the rule behind the numbers ---");
{
  // The two rows that decide it, stated as the difference between them rather
  // than as two absolute numbers: the same content, the same row, one clipping
  // and one not. Without the automatic minimum they come out identical, which
  // is what makes this the assertion that fails when the rule is missing.
  const open = oracle.rows.find((r) => r.name === "one word, squeezed");
  const clipped = oracle.rows.find((r) => r.name === "one word, squeezed, clipping");
  const gotOpen = widthOf(open);
  const gotClipped = widthOf(clipped);
  // The row offers 50; the word is about 71 wide. One of them takes the offer.
  const share = open.row - 40;
  ok("a row too narrow for its content does not squash it",
    gotOpen > gotClipped + 15,
    `visible ${gotOpen.toFixed(2)} vs clipping ${gotClipped.toFixed(2)} — ` +
      "the same content in the same row, and they must not agree");
  ok("the one that clips shrinks to the share it was offered",
    Math.abs(gotClipped - share) <= TOL,
    gotClipped.toFixed(2) + " want about " + share);
  ok("and the one that does not keeps its min-content width",
    Math.abs(gotOpen - open.minContent) <= TOL,
    gotOpen.toFixed(2) + " want about " + open.minContent);
}

console.log("");
console.log("passed=" + passed + " failed=" + failed + " skipped=" + skipped);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
