#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// How far a flex item may be SHRUNK, and what happens to what will not fit.
//
//   node gallery/ui/conformance/oracle/flexmin_oracle.mjs
//
// Writes `flexmin.json` beside this file.
//
// WHY. A resizable panel's breadcrumb wrote itself across the divider and into
// the panel beside it. The panel had no `overflow`, so it clipped nothing —
// that is one bug and a stylesheet fixes it. The other is here: EVG shrinks a
// flex item to whatever share the free space gives it, and clamps only against
// a min-width the sheet DECLARED. A browser does not. A flex item's `min-width`
// computes to `auto`, and `auto` on a flex item is the AUTOMATIC MINIMUM SIZE
// — roughly its min-content size — so a real flex row refuses to squash a row
// of words down to nothing.
//
// Three things need measuring rather than assuming, and the first is the one
// that matters most:
//
//   IT DOES NOT PREVENT OVERFLOW. `min-width: auto` stops the BOX shrinking;
//   it does not make the content fit. An item that will not shrink below its
//   min-content size simply hangs out of its container instead. This is worth
//   recording because it is the opposite of what "minimum size" suggests, and
//   because it decides where the resizable panel's real fix belongs.
//
//   OVERFLOW TURNS IT OFF. The automatic minimum applies only while the item's
//   overflow is `visible`. Give it `overflow: hidden` and the minimum becomes
//   zero and the item shrinks freely — which is why the two declarations go
//   together on a panel, and why implementing the minimum without this rule
//   would break the panel that was just fixed.
//
//   WHAT THE MINIMUM IS. For an item with no intrinsic aspect ratio and an
//   auto main size it is the min-content size: the widest UNBREAKABLE piece,
//   which for text is the longest word rather than the longest line.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requireDom, findChromium } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Each case is a row of a fixed width holding one flexible item and one rigid
// one, so the flexible item is always asked for less than it wants.
const CASES = [
  // Room to spare, twice over: the minimum must not disturb an item that
  // already fits, and an item whose share is above its min-content size is not
  // floored by anything.
  { name: "plenty of room", row: 600, text: "Home Breadcrumb One", style: "" },
  { name: "one long word", row: 120, text: "Breadcrumb", style: "" },
  { name: "words, wrappable", row: 120, text: "Home Breadcrumb One", style: "" },

  // THE PAIR THAT DECIDES IT. The row is narrow enough that the share on offer
  // (90 less the rigid 40, so 50) is below the width of the word, so the
  // automatic minimum is what the item ends up at — and the same case with
  // `overflow: hidden` shrinks to the share instead. Built out of a single
  // word on purpose, so that no `white-space` declaration is needed to say it.
  { name: "one word, squeezed", row: 90, text: "Breadcrumb", style: "" },
  { name: "one word, squeezed, clipping", row: 90, text: "Breadcrumb", style: "overflow:hidden" },
  // The other two ways to turn the automatic minimum off, both of which a real
  // splitter uses.
  { name: "squeezed, min-width 0", row: 90, text: "Breadcrumb", style: "min-width:0" },
  { name: "squeezed, overflow scroll", row: 90, text: "Breadcrumb", style: "overflow:scroll" },

  // Several words with wrapping allowed: min-content is the LONGEST WORD and
  // not the whole line, so this floors at the same place the single word does.
  { name: "words, squeezed", row: 90, text: "Home Breadcrumb One", style: "" },

  // A declared minimum wins over the automatic one in both directions: above
  // it, and below it.
  { name: "min-width above content", row: 120, text: "Home", style: "min-width:90px" },
  { name: "min-width below content", row: 90, text: "Breadcrumb", style: "min-width:10px" },

  // A nested row: the minimum of a CONTAINER is built from its children.
  { name: "nested row", row: 120, text: "", style: "", nested: ["Home", "Breadcrumb"] },

  // AND ONE EVG CANNOT EXPRESS, kept for the day it can. With no wrapping
  // allowed nothing may break, so min-content is the whole line — 137.28 here
  // against the 70.81 of its longest word. EVG has no `white-space` property,
  // so its answer is the longest word and the check skips this row and says so.
  { name: "words, nowrap", row: 120, text: "Home Breadcrumb One", style: "white-space:nowrap" },
];


const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
await page.setContent(`<style>
  html,body{margin:0}
  .row{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:flex-start}
  .item{flex:1 1 0;font:13px Arial}
  .rigid{flex:0 0 40px;height:10px}
</style><div id="host"></div>`);

const rows = await page.evaluate((cases) => {
  const host = document.getElementById("host");
  return cases.map((c) => {
    const row = document.createElement("div");
    row.className = "row";
    row.style.width = c.row + "px";
    const item = document.createElement("div");
    item.className = "item";
    item.style.cssText = c.style;
    if (c.nested) {
      item.style.display = "flex";
      item.style.flexDirection = "row";
      item.style.flexWrap = "nowrap";
      for (const t of c.nested) {
        const kid = document.createElement("div");
        kid.style.cssText = "font:13px Arial;white-space:nowrap";
        kid.textContent = t;
        item.appendChild(kid);
      }
    } else {
      item.textContent = c.text;
    }
    const rigid = document.createElement("div");
    rigid.className = "rigid";
    row.appendChild(item);
    row.appendChild(rigid);
    host.appendChild(row);

    // What the browser gave the item, and what it would have given it with a
    // free hand — `fit-content`/`min-content` on a copy measures the intrinsic
    // sizes without disturbing the case being recorded.
    const probe = item.cloneNode(true);
    probe.style.position = "absolute";
    probe.style.flex = "none";
    probe.style.width = "min-content";
    host.appendChild(probe);
    const minContent = probe.getBoundingClientRect().width;
    probe.style.width = "max-content";
    const maxContent = probe.getBoundingClientRect().width;
    probe.remove();

    const ib = item.getBoundingClientRect();
    const rb = row.getBoundingClientRect();
    const out = {
      name: c.name, row: c.row, text: c.text, style: c.style,
      nested: c.nested || null,
      // The used width of the item, which is the whole question.
      width: +ib.width.toFixed(2),
      // Does the BOX hang out of the row? This is the part that surprises.
      spillsPastRow: +(ib.right - rb.right).toFixed(2),
      // Does the CONTENT hang out of the box?
      contentWidth: item.scrollWidth,
      minWidthComputed: getComputedStyle(item).minWidth,
      minContent: +minContent.toFixed(2),
      maxContent: +maxContent.toFixed(2),
    };
    row.remove();
    return out;
  });
}, CASES);

await browser.close();

// The rule, derived from the rows rather than asserted: the used width is the
// share the row could give, floored by the automatic minimum — and the
// automatic minimum is the min-content size only while overflow is visible.
for (const r of rows) {
  // EVG has no `white-space` property at all — the only `nowrap` it knows is
  // `flex-wrap`. A row that needs one to mean what it means is recorded here
  // and skipped by the check rather than quietly dropped, so the gap stays
  // visible and the file stays the browser's answer rather than EVG's.
  r.needsWhiteSpace = /white-space/.test(r.style);
  const clips = /overflow\s*:\s*(hidden|scroll|auto)/.test(r.style);
  const declared = /min-width\s*:\s*([0-9.]+)px/.exec(r.style);
  r.automaticMinimum = declared ? parseFloat(declared[1]) : (clips ? 0 : r.minContent);
  r.flooredByIt = Math.abs(r.width - r.automaticMinimum) < 0.51;
}

const file = path.join(HERE, "flexmin.json");
fs.writeFileSync(file, JSON.stringify({
  note: "How far a flex item may be shrunk. Captured from Chromium; see the header of flexmin_oracle.mjs.",
  rows,
}, null, 2) + "\n");
console.log(`wrote ${path.relative(process.cwd(), file)} — ${rows.length} cases`);
for (const r of rows) {
  console.log(`  ${r.name.padEnd(24)} width ${String(r.width).padStart(7)}  ` +
    `min-content ${String(r.minContent).padStart(7)}  auto-min ${String(r.automaticMinimum).padStart(7)}  ` +
    `spills ${String(r.spillsPastRow).padStart(7)}`);
}
