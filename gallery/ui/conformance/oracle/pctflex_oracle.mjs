#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// A percentage width inside an item whose own width comes from `flex`, asked
// of the browser.
//
//   node gallery/ui/conformance/oracle/pctflex_oracle.mjs
//
// Writes `pctflex.json` beside this file. `pctflex_check.mjs` gates it.
//
// WHY. Every chart on the showcase's generated chart pages hung off the LEFT
// edge of the paper. The charts were fine; `.chartBox { width: 100% }` was
// coming out zero wide, and `align-items: center` centring a 220px chart in a
// 0px box puts its left edge at -110.
//
// The cause is an ordering one, and it is easy to reintroduce. A `flex: 1`
// item is asked for its min-content size in the middle of the pass that is
// working out how wide it gets, so at that moment its inner width is zero.
// The measuring walk resolved its children's units against that zero — and
// `resolveUnits` latches, so `100%` stayed at the 0 it was measured with and
// the flow never asked again. A measurement froze a layout.
//
// The cases are the ones an implementation can plausibly get wrong:
//
//   1. `pctInGrown`     the chart's own shape: `width: 100%` under `flex: 1`,
//                       with a fixed-size box centred inside it.
//   2. `pctHalfInGrown` not just 100% — a percentage that is a real fraction
//                       of a width the flex pass decided.
//   3. `pctInGrownDeep` two levels down, because the measuring walk recurses
//                       and each level has to be handed back unresolved too.
//   4. `pctWeighted`    factors 1 and 3, so the two cells resolve their
//                       percentages against DIFFERENT widths. Written with the
//                       `flex` shorthand, which sets a zero basis: `flex-grow`
//                       alone leaves the basis at `auto`, and EVG starts a
//                       grower from zero rather than from its content — a
//                       separate divergence, and not one this gate is about.
//   5. `pctInFixed`     the control: the same tree with a stated width on the
//                       cell. This one worked all along, and if a fix breaks
//                       it the fix went too far.
//   6. `pctOverMin`     content wider than the share on offer, so the
//                       automatic minimum size — the very pass that does the
//                       premature measuring — decides the cell's width.
//   7. `pctMinZero`     the same, with `min-width: 0`: the cell is a half of
//                       the row whatever it holds, the percentage is a half
//                       of the row, and the oversized drawing hangs out of
//                       its column evenly on both sides. This is what the
//                       showcase's chart pages ask for, and the case exists
//                       so the sheet's `min-width: 0` is gated rather than
//                       remembered.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requireHostTool, findChromium } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "pctflex.json");

const BASE = `*{margin:0;padding:0;box-sizing:border-box}`;

// The cell/box/chart shape the showcase draws its charts in, as CSS.
const SHAPE = `.row{display:flex;flex-direction:row;width:487px;height:200px}
          .cell{display:flex;flex-direction:column}
          .box{display:flex;flex-direction:column;align-items:center}
          .chart{width:220.55px;height:172px}`;

const CASES = [
  {
    name: "pctInGrown",
    note: "width:100% under flex:1, with a fixed box centred in it",
    css: `${SHAPE}
          .cell{flex:1}
          .box{width:100%}`,
    html: `<div class="row" id="row"><div class="cell" id="c1"><div class="box" id="b1"><div class="chart" id="ch1"></div></div></div><div class="cell" id="c2"></div></div>`,
    ids: ["row", "c1", "b1", "ch1", "c2"],
  },
  {
    name: "pctHalfInGrown",
    note: "a percentage that is a real fraction of the width flex decided",
    css: `${SHAPE}
          .cell{flex:1}
          .box{width:50%}
          .chart{width:40px;height:20px}`,
    html: `<div class="row" id="row"><div class="cell" id="c1"><div class="box" id="b1"><div class="chart" id="ch1"></div></div></div><div class="cell" id="c2"></div></div>`,
    ids: ["row", "c1", "b1", "ch1", "c2"],
  },
  {
    name: "pctInGrownDeep",
    note: "two levels of percentage below the grown item",
    css: `${SHAPE}
          .cell{flex:1}
          .box{width:100%}
          .inner{display:flex;flex-direction:column;align-items:center;width:50%}
          .chart{width:40px;height:20px}`,
    html: `<div class="row" id="row"><div class="cell" id="c1"><div class="box" id="b1"><div class="inner" id="in1"><div class="chart" id="ch1"></div></div></div></div><div class="cell" id="c2"></div></div>`,
    ids: ["row", "c1", "b1", "in1", "ch1", "c2"],
  },
  {
    name: "pctWeighted",
    note: "factors 1 and 3, so the two cells resolve against different widths",
    css: `${SHAPE}
          .one{flex:1;display:flex;flex-direction:column}
          .three{flex:3;display:flex;flex-direction:column}
          .box{width:100%}
          .chart{width:40px;height:20px}`,
    html: `<div class="row" id="row"><div class="one" id="c1"><div class="box" id="b1"><div class="chart" id="ch1"></div></div></div><div class="three" id="c2"><div class="box" id="b2"><div class="chart" id="ch2"></div></div></div></div>`,
    ids: ["row", "c1", "b1", "ch1", "c2", "b2", "ch2"],
  },
  {
    name: "pctInFixed",
    note: "the control: a stated width on the cell, which always worked",
    css: `${SHAPE}
          .cell{width:243.5px}
          .box{width:100%}`,
    html: `<div class="row" id="row"><div class="cell" id="c1"><div class="box" id="b1"><div class="chart" id="ch1"></div></div></div><div class="cell" id="c2"></div></div>`,
    ids: ["row", "c1", "b1", "ch1", "c2"],
  },
  {
    name: "pctOverMin",
    note: "content wider than the share on offer, so the automatic minimum decides",
    css: `.row{display:flex;flex-direction:row;width:300px;height:200px}
          .cell{display:flex;flex-direction:column;flex:1}
          .box{display:flex;flex-direction:column;align-items:center;width:100%}
          .chart{width:220.55px;height:172px}`,
    html: `<div class="row" id="row"><div class="cell" id="c1"><div class="box" id="b1"><div class="chart" id="ch1"></div></div></div><div class="cell" id="c2"></div></div>`,
    ids: ["row", "c1", "b1", "ch1", "c2"],
  },
  {
    name: "pctMinZero",
    note: "min-width:0 — a half of the row whatever it holds, overflowing evenly",
    css: `.row{display:flex;flex-direction:row;width:300px;height:200px}
          .cell{display:flex;flex-direction:column;flex:1;min-width:0}
          .box{display:flex;flex-direction:column;align-items:center;width:100%}
          .chart{width:220.55px;height:172px}`,
    html: `<div class="row" id="row"><div class="cell" id="c1"><div class="box" id="b1"><div class="chart" id="ch1"></div></div></div><div class="cell" id="c2"></div></div>`,
    ids: ["row", "c1", "b1", "ch1", "c2"],
  },
];

const { chromium } = requireHostTool("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();

const out = {
  $source:
    "Chromium via playwright-core, measured by gallery/ui/conformance/oracle/pctflex_oracle.mjs",
  cases: {},
};

for (const c of CASES) {
  await page.setContent(`<style>${BASE}${c.css}</style>${c.html}`);
  const boxes = await page.evaluate((ids) => {
    const o = {};
    for (const id of ids) {
      const r = document.getElementById(id).getBoundingClientRect();
      o[id] = {
        x: Math.round(r.x * 100) / 100,
        y: Math.round(r.y * 100) / 100,
        w: Math.round(r.width * 100) / 100,
        h: Math.round(r.height * 100) / 100,
      };
    }
    return o;
  }, c.ids);
  out.cases[c.name] = { note: c.note, css: c.css, html: c.html, ids: c.ids, boxes };
}

await browser.close();
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log("wrote " + path.relative(process.cwd(), OUT));
