#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What a scroll container actually does, asked of a browser.
//
//   node gallery/ui/conformance/oracle/scroll_oracle.mjs
//
// Writes `scroll.json` beside this file. EVGLayout is built against these
// numbers; nothing reads the file at run time.
//
// WHY AN ORACLE FOR THIS. "Content taller than its box scrolls" sounds like
// one sentence of behaviour and is at least five, four of which are only
// visible if you ask:
//
//   1. Is the content SHRUNK to fit, or does it keep its size and overflow?
//      EVG's answer was "shrunk" — the flex shrink-to-fit pass runs whenever
//      fixed children exceed a definite height — and that is why the
//      virtualiser could not put a spacer in a column: fourteen rows drew on
//      one 46-pixel line. A browser does not shrink. This is the difference
//      between a clipped box and a scrolling one.
//   2. What is `scrollHeight` — the content, the box, or the larger of the
//      two? (It is padding-box content, and it INCLUDES the container's
//      bottom padding only in some engines, which is why it is measured
//      rather than derived.)
//   3. Where do children move to when the box is scrolled, and does the box
//      itself move? (It does not; only its content does.)
//   4. What does the browser do with a scrollTop past the end, or below zero?
//      It clamps, silently, and reading the property back gives the clamped
//      value — so a control that stores what it asked for and a control that
//      stores what it got disagree forever after.
//   5. Is content scrolled out of view still under the pointer?
//      `elementFromPoint` says no. EVG's hit test walked a flat paint list
//      with no notion of a clip and would have said yes.
//
// The page is deliberately plain: fixed pixel sizes, no fonts involved, one
// column of fixed-height rows in a fixed-height box. Nothing here depends on
// text measurement, so the numbers are the layout's and not the font's.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requireDom, findChromium } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// 8 rows of 60 in a 200-tall box: 480 of content, 280 to scroll through, and
// 200/60 is not a whole number of rows, so a row is always part-cut.
const ROWS = 8;
const ROW_H = 60;
const BOX_H = 200;
const BOX_W = 300;
const PAD = 10;

const PAGE = `<!doctype html><meta charset="utf-8">
<style>
  html,body { margin:0; padding:0; }
  #box {
    position:absolute; left:40px; top:30px;
    width:${BOX_W}px; height:${BOX_H}px;
    padding:${PAD}px;
    box-sizing:border-box;
    overflow:hidden;
    display:flex; flex-direction:column; flex-wrap:nowrap;
  }
  .row { height:${ROW_H}px; flex-shrink:0; }
  /* A second box, WIDER content, for the horizontal answer. */
  #hbox {
    position:absolute; left:40px; top:300px;
    width:${BOX_W}px; height:80px;
    overflow:hidden;
    display:flex; flex-direction:row; flex-wrap:nowrap;
  }
  .cell { width:120px; height:80px; flex-shrink:0; }
</style>
<div id="box">${Array.from({ length: ROWS }, (_, i) => `<div class="row" id="r${i}"></div>`).join("")}</div>
<div id="hbox">${Array.from({ length: 5 }, (_, i) => `<div class="cell" id="c${i}"></div>`).join("")}</div>`;

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.setContent(PAGE);

const capture = await page.evaluate(({ ROWS, ROW_H, BOX_H, PAD }) => {
  const box = document.getElementById("box");
  const hbox = document.getElementById("hbox");
  const rowsAt = () =>
    Array.from({ length: ROWS }, (_, i) => {
      const r = document.getElementById("r" + i).getBoundingClientRect();
      return { id: "r" + i, x: r.x, y: r.y, w: r.width, h: r.height };
    });
  const boxRect = () => {
    const r = box.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  };
  // The point at the vertical middle of the box, and one just above its top
  // edge — the same page coordinates at every scroll offset, so what is under
  // them is entirely the container's doing.
  const br = box.getBoundingClientRect();
  const probeIn = { x: br.x + 20, y: br.y + BOX_H / 2 };
  const probeAbove = { x: br.x + 20, y: br.y - 5 };
  const under = (p) => {
    const el = document.elementFromPoint(p.x, p.y);
    return el ? el.id || el.tagName.toLowerCase() : null;
  };

  const at = (top) => {
    box.scrollTop = top;
    return {
      asked: top,
      // What the browser STORED, which is not always what it was told.
      scrollTop: box.scrollTop,
      box: boxRect(),
      rows: rowsAt(),
      underMiddle: under(probeIn),
      underAbove: under(probeAbove),
    };
  };

  box.scrollTop = 0;
  const out = {
    geometry: {
      rows: ROWS,
      rowHeight: ROW_H,
      boxHeight: BOX_H,
      padding: PAD,
      // THE FIRST QUESTION. If the browser shrank the rows to fit, this is
      // less than ROW_H and EVG's old behaviour was right.
      firstRowHeight: document.getElementById("r0").getBoundingClientRect().height,
      lastRowHeight: document.getElementById("r" + (ROWS - 1)).getBoundingClientRect().height,
      scrollHeight: box.scrollHeight,
      clientHeight: box.clientHeight,
      maxScrollTop: box.scrollHeight - box.clientHeight,
    },
    states: [at(0), at(60), at(130), at(280), at(100000), at(-50)],
    horizontal: (() => {
      hbox.scrollLeft = 0;
      const zero = document.getElementById("c0").getBoundingClientRect().x;
      hbox.scrollLeft = 90;
      const moved = document.getElementById("c0").getBoundingClientRect().x;
      hbox.scrollLeft = 100000;
      const clamped = hbox.scrollLeft;
      return {
        cellWidth: document.getElementById("c0").getBoundingClientRect().width,
        scrollWidth: hbox.scrollWidth,
        clientWidth: hbox.clientWidth,
        shiftAt90: zero - moved,
        clampedTo: clamped,
      };
    })(),
  };
  return out;
}, { ROWS, ROW_H, BOX_H, PAD });

await browser.close();

fs.writeFileSync(
  path.join(HERE, "scroll.json"),
  JSON.stringify(capture, null, 1) + "\n",
);
console.log("wrote oracle/scroll.json");
console.log("  row height under a too-short box:", capture.geometry.firstRowHeight,
  "(shrunk would be less than", ROW_H + ")");
console.log("  scrollHeight:", capture.geometry.scrollHeight,
  " clientHeight:", capture.geometry.clientHeight,
  " maxScrollTop:", capture.geometry.maxScrollTop);
for (const s of capture.states) {
  console.log(`  asked ${s.asked} -> stored ${s.scrollTop}; r0 at y=${s.rows[0].y}; ` +
    `under middle=${s.underMiddle} above=${s.underAbove}`);
}
console.log("  horizontal:", JSON.stringify(capture.horizontal));
