#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// EVG's scroll container against the numbers a browser produced.
//
//   node gallery/ui/conformance/oracle/scroll_check.mjs
//
// The same box, the same rows, the same six scroll offsets, and the answers
// out of `scroll.json`. Five things are being asked, and the first one is the
// one that used to be wrong:
//
//   the content KEEPS ITS SIZE — a flex column with a definite height shrinks
//   its children to fit, and a scroll container is the statement that it must
//   not;
//   `scrollHeight` and `clientHeight` mean what the DOM means by them;
//   children move by exactly the offset and the box does not move at all;
//   a scrollTop past either end is CLAMPED, and reading it back gives the
//   clamped value, not the asked-for one;
//   what is scrolled out of view is not under the pointer.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const require = createRequire(import.meta.url);
const H = require(path.join(ROOT, "gallery/ui/bin/ui_host.cjs"));
const oracle = JSON.parse(fs.readFileSync(path.join(HERE, "scroll.json"), "utf8"));

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};
const eq = (name, got, want) =>
  ok(name, Math.abs(got - want) < 0.5, got + "   want " + want);

const G = oracle.geometry;

// The browser page put the box at (40, 30). Reproduced exactly, so the rows'
// absolute y coordinates can be compared against the recorded ones rather than
// against a difference — an offset that is right relative to itself and wrong
// on the page is a bug this would otherwise miss.
const CSS =
  `.page{display:flex;flex-direction:column;flex-wrap:nowrap;width:800px;height:600px}` +
  `.box{position:absolute;left:40px;top:30px;width:300px;height:${G.boxHeight}px;` +
  `padding:${G.padding}px;overflow:hidden;display:flex;flex-direction:column;flex-wrap:nowrap}` +
  `.row{height:${G.rowHeight}px}` +
  `.hbox{position:absolute;left:40px;top:300px;width:300px;height:80px;overflow:hidden;` +
  `display:flex;flex-direction:row;flex-wrap:nowrap}` +
  `.cell{width:120px;height:80px}`;

function build() {
  const sheet = new H.EVGStyleSheet();
  sheet.parse(CSS);
  const mk = (cls, id) => {
    const e = H.EVGElement.createDiv();
    e.className = cls;
    if (id) e.id = id;
    return e;
  };
  const page = mk("page", "page");
  const box = mk("box", "box");
  for (let i = 0; i < G.rows; i++) box.addChild(mk("row", "r" + i));
  page.addChild(box);
  const hbox = mk("hbox", "hbox");
  for (let i = 0; i < 5; i++) hbox.addChild(mk("cell", "c" + i));
  page.addChild(hbox);
  sheet.applyTree(page, "");
  return { page, box, hbox };
}
function lay(page) {
  const l = new H.EVGLayout();
  l.setPageSize(800, 600);
  l.layout(page);
  return l;
}
const find = (el, id) => {
  if (el.id === id) return el;
  for (const k of el.children) { const f = find(k, id); if (f) return f; }
  return null;
};

console.log("--- the content is not shrunk to fit ---");
{
  // THE ONE THAT WAS WRONG. A flex column with a definite height shrinks
  // overflowing fixed children in proportion, which is right for a box that
  // clips and catastrophic for one that scrolls: the virtualiser's 230,000
  // pixel spacer became 414 and fourteen rows drew on one line.
  const { page, box } = build();
  lay(page);
  eq("the first row keeps its height", find(page, "r0").calculatedHeight, G.firstRowHeight);
  eq("and so does the last", find(page, "r7").calculatedHeight, G.lastRowHeight);
  eq("the box keeps its own", box.calculatedHeight, G.boxHeight);
}

console.log("--- scrollHeight and clientHeight mean what the DOM means ---");
{
  const { page, box } = build();
  lay(page);
  eq("scrollHeight", box.scrollHeight, G.scrollHeight);
  eq("clientHeight", box.clientHeight(), G.clientHeight);
  eq("so there is this much to scroll", box.maxScrollTop(), G.maxScrollTop);
}

console.log("--- six offsets, including both ends and past them ---");
for (const want of oracle.states) {
  const { page, box } = build();
  box.scrollTop = want.asked;
  lay(page);
  // What the browser STORED. Asking for 100000 and being given 300 is the
  // behaviour; a control that remembers what it asked for disagrees with the
  // screen forever after.
  eq(`asked ${want.asked}: stored offset`, box.scrollTop, want.scrollTop);
  // The BOX does not move. Only its content does.
  eq(`asked ${want.asked}: the box stays put`, box.calculatedY, want.box.y);
  let bad = "";
  for (const r of want.rows) {
    const el = find(page, r.id);
    if (Math.abs(el.calculatedY - r.y) > 0.5) bad += ` ${r.id}=${el.calculatedY} want ${r.y};`;
    if (Math.abs(el.calculatedX - r.x) > 0.5) bad += ` ${r.id}.x=${el.calculatedX} want ${r.x};`;
  }
  ok(`asked ${want.asked}: every row where the browser put it`, bad === "", bad);
}

console.log("--- what is scrolled out of sight is not under the pointer ---");
{
  // The same two page points at every offset: the middle of the box, and five
  // pixels ABOVE its top edge, where the rows that scrolled away now sit. The
  // browser answers `html` there. A hit test with no notion of a clip answers
  // with whichever row happens to be at that coordinate — invisible and
  // clickable at the same time.
  const hit = new H.EVGHitTest();
  for (const want of oracle.states) {
    const { page, box } = build();
    box.scrollTop = want.asked;
    lay(page);
    const bx = box.calculatedX;
    const by = box.calculatedY;
    const mid = hit.idAt(page, bx + 20, by + G.boxHeight / 2);
    ok(`asked ${want.asked}: the middle of the box is ${want.underMiddle}`,
      mid === want.underMiddle, mid);
    const above = hit.idAt(page, bx + 20, by - 5);
    // The browser says `html`; the EVG page has no such element, and "not a
    // row" is the claim either way.
    ok(`asked ${want.asked}: five pixels above it is not a row`,
      above === "page" || above === "", above);
  }
}

console.log("--- and the same sideways ---");
{
  const Hz = oracle.horizontal;
  const { page, hbox } = build();
  lay(page);
  eq("the cells keep their width", find(page, "c0").calculatedWidth, Hz.cellWidth);
  eq("scrollWidth", hbox.scrollWidth, Hz.scrollWidth);
  eq("clientWidth", hbox.clientWidth(), Hz.clientWidth);
  const at0 = find(page, "c0").calculatedX;
  {
    const b = build();
    b.hbox.scrollLeft = 90;
    lay(b.page);
    eq("scrolled 90, the first cell moved 90", at0 - find(b.page, "c0").calculatedX, Hz.shiftAt90);
  }
  {
    const b = build();
    b.hbox.scrollLeft = 100000;
    lay(b.page);
    eq("and it clamps sideways too", b.hbox.scrollLeft, Hz.clampedTo);
  }
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
