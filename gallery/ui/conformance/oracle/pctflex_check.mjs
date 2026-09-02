#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// EVGLayout against the browser's own answer for a percentage width inside a
// flex-grown item.
//
//   npm run evg:pctflex:check
//
// Reads `pctflex.json`, which `pctflex_oracle.mjs` captured from Chromium.
// Every expected number came off a real browser laying out the same CSS.
//
// The gate exists because the showcase's chart pages drew every chart hanging
// off the LEFT edge of the paper — `.chartBox { width: 100% }` inside a
// `flex: 1` cell resolved to zero, and centring a 220px chart in a 0px box
// puts its left edge at -110. The cause was a MEASUREMENT freezing a layout:
// the automatic-minimum-size pass asks a flex item for its min-content width
// while its own width is still undecided, and the walk that answers resolved
// the item's children against that not-yet-known (zero) inner width.
// `resolveUnits` latches, so the percentage stayed at what the measurement
// saw. Nothing about charts, and nothing a chart test would have located.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const M = require(path.join(ROOT, "gallery/ui/bin/ControlsDemo.cjs"));
const DATA = JSON.parse(fs.readFileSync(path.join(HERE, "pctflex.json"), "utf8"));

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed += 1; console.log(`  PASS ${name}`); }
  else { failed += 1; console.log(`  FAIL ${name}${detail ? " — " + detail : ""}`); }
};

// These cases NEST — a cell holding a box holding a chart is the whole point —
// so the flat regex the flex-grow gate uses is not enough. This is a stack
// over `<div class= id=>` and `</div>`, which is all the oracle's markup ever
// contains; anything else in it would be a case this cannot rebuild, and the
// build would notice by finding no element for an id.
function build(c) {
  const re = /<div class="([^"]+)" id="([^"]+)">|<\/div>/g;
  let root = null;
  const stack = [];
  let m;
  while ((m = re.exec(c.html)) !== null) {
    if (m[1] === undefined) { stack.pop(); continue; }
    const el = new M.EVGElement();
    el.className = m[1];
    el.id = m[2];
    if (stack.length) stack[stack.length - 1].addChild(el);
    else root = el;
    stack.push(el);
  }
  const sheet = new M.EVGStyleSheet();
  sheet.parse(c.css);
  sheet.applyTree(root);
  new M.EVGLayout().layout(root, 1000, 600);
  return root;
}

const findById = (el, id) => {
  if (el.id === id) return el;
  for (const k of el.children) { const r = findById(k, id); if (r) return r; }
  return null;
};

for (const [name, c] of Object.entries(DATA.cases)) {
  console.log(`--- ${name}: ${c.note} ---`);
  const root = build(c);
  // The oracle's coordinates are page-absolute and the row starts at 0,0, so
  // they compare directly with EVG's — true only because `*{margin:0}` is
  // captured with the case.
  for (const id of c.ids) {
    const want = c.boxes[id];
    const el = findById(root, id);
    if (!el) { ok(`${id} exists`, false, "not in the built tree"); continue; }
    const near = (a, b) => Math.abs(a - b) <= 1.0;
    ok(`${id} is ${want.w}px wide at x=${want.x}`,
      near(el.calculatedX, want.x) && near(el.calculatedWidth, want.w),
      `got x=${el.calculatedX.toFixed(2)} w=${el.calculatedWidth.toFixed(2)}`);
  }
}

// And the rule the pixels are there to state, so a reader of a failure knows
// what broke rather than which number moved.
console.log("--- and the rule behind the numbers ---");
{
  const c = DATA.cases.pctInGrown;
  const root = build(c);
  const cell = findById(root, "c1");
  const box = findById(root, "b1");
  const chart = findById(root, "ch1");
  ok("a percentage width fills the width the flex pass decided",
    Math.abs(box.calculatedWidth - cell.calculatedWidth) <= 0.01,
    `box ${box.calculatedWidth.toFixed(2)} vs cell ${cell.calculatedWidth.toFixed(2)}`);
  ok("so nothing centred in it is placed at a negative offset",
    chart.calculatedX >= cell.calculatedX,
    `chart x=${chart.calculatedX.toFixed(2)}, cell x=${cell.calculatedX.toFixed(2)}`);
}

{
  // And the shape the showcase's chart pages actually ask for: `min-width: 0`
  // says the columns are halves of the PAGE, so a drawing too wide for its
  // half hangs out of it evenly rather than widening its own column. Without
  // the declaration the cell may not go below its content and the pair stops
  // adding up to the row — which is a different way for a chart to end up
  // somewhere it was not meant to be.
  const c = DATA.cases.pctMinZero;
  const root = build(c);
  const cell = findById(root, "c1");
  const box = findById(root, "b1");
  const chart = findById(root, "ch1");
  const sib = findById(root, "c2");
  ok("min-width:0 makes the columns equal halves whatever they hold",
    Math.abs(cell.calculatedWidth - sib.calculatedWidth) <= 0.01,
    `${cell.calculatedWidth.toFixed(2)} vs ${sib.calculatedWidth.toFixed(2)}`);
  const leftOver = cell.calculatedX - chart.calculatedX;
  const rightOver = (chart.calculatedX + chart.calculatedWidth)
    - (cell.calculatedX + cell.calculatedWidth);
  ok("and what does not fit hangs out of the column evenly",
    Math.abs(leftOver - rightOver) <= 0.01 && leftOver > 0,
    `left ${leftOver.toFixed(2)}, right ${rightOver.toFixed(2)}`);
  ok("the percentage box still fills the column",
    Math.abs(box.calculatedWidth - cell.calculatedWidth) <= 0.01,
    `box ${box.calculatedWidth.toFixed(2)} vs cell ${cell.calculatedWidth.toFixed(2)}`);
}

console.log(`\npassed=${passed} failed=${failed}`);
if (failed > 0) { console.log("SOME FAILED"); process.exit(1); }
console.log("ALL PASS");
