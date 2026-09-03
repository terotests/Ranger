#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// How free space is shared out along a flex row, asked of the browser.
//
//   node gallery/ui/conformance/oracle/flexgrow_oracle.mjs
//
// Writes `flexgrow.json` beside this file. `flexgrow_check.mjs` gates it.
//
// WHY. The controls demo's stepper drew its four steps down the page on top of
// one another. The cause was not the stepper: `flex-grow` was NOT A PROPERTY
// EVG PARSED. `flex-shrink`, `flex-basis` and the `flex` shorthand all were,
// so a sheet written with the shorthand worked and one written with the
// longhand was ignored without a word — and `.cx-rail { flex-grow: 1 }` is the
// longhand. With the factor dropped the rail had no width of its own and took
// the parent's entire 852px; three of them did; the row overflowed threefold
// and everything after it stacked.
//
// A property that silently does nothing is the worst kind of gap, so what goes
// in beside the fix is not a unit test of the parser — it is the browser's own
// answer to the question the property asks. If EVG ever splits free space a
// different way again, this says so in pixels.
//
// The six cases are the ones where an implementation can plausibly be wrong:
//
//   1. `evenPair`      two growers, equal factors — the base case, and the one
//                      the stepper needs. Also the one that proves gaps are
//                      taken out of the free space BEFORE it is divided.
//   2. `weighted`      factors 1 and 3. Free space splits by ratio, not evenly.
//   3. `growAndFixed`  a grower beside a fixed item, so "free space" really is
//                      what is left rather than the whole line.
//   4. `growWithBasis` `flex-basis` sets what the item starts from and grow
//                      shares only the REMAINDER, which is the rule people
//                      most often get wrong.
//   5. `noFreeSpace`   the fixed items already fill the line. A grower gets
//                      nothing and must not go negative.
//   6. `columnGrow`    the same question down the cross axis, because a column
//                      is a different code path and has its own history here.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requireHostTool, findChromium } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "flexgrow.json");

const BASE = `*{margin:0;padding:0;box-sizing:border-box}`;

const CASES = [
  {
    name: "evenPair",
    note: "two equal growers between three fixed items, with a gap",
    css: `.box{display:flex;flex-direction:row;align-items:center;gap:8px;width:852px;height:40px}
          .item{width:60px;height:26px}
          .rail{height:2px;flex-grow:1}`,
    html: `<div class="box"><div class="item" id="a"></div><div class="rail" id="r1"></div><div class="item" id="b"></div><div class="rail" id="r2"></div><div class="item" id="c"></div></div>`,
    ids: ["a", "r1", "b", "r2", "c"],
  },
  {
    name: "weighted",
    note: "factors 1 and 3 share the same free space",
    css: `.box{display:flex;flex-direction:row;width:400px;height:20px}
          .one{flex-grow:1;height:10px}
          .three{flex-grow:3;height:10px}`,
    html: `<div class="box"><div class="one" id="p"></div><div class="three" id="q"></div></div>`,
    ids: ["p", "q"],
  },
  {
    name: "growAndFixed",
    note: "one grower beside a fixed item",
    css: `.box{display:flex;flex-direction:row;width:300px;height:20px}
          .fix{width:100px;height:10px}
          .go{flex-grow:1;height:10px}`,
    html: `<div class="box"><div class="fix" id="f"></div><div class="go" id="g"></div></div>`,
    ids: ["f", "g"],
  },
  {
    name: "growWithBasis",
    note: "flex-basis is the starting size; grow shares only the remainder",
    css: `.box{display:flex;flex-direction:row;width:400px;height:20px}
          .b1{flex-grow:1;flex-basis:100px;height:10px}
          .b2{flex-grow:1;flex-basis:50px;height:10px}`,
    html: `<div class="box"><div class="b1" id="u"></div><div class="b2" id="v"></div></div>`,
    ids: ["u", "v"],
  },
  {
    name: "noFreeSpace",
    note: "the fixed items already fill the line",
    css: `.box{display:flex;flex-direction:row;width:200px;height:20px}
          .fix{width:100px;height:10px}
          .go{flex-grow:1;height:10px}`,
    html: `<div class="box"><div class="fix" id="m"></div><div class="fix" id="n"></div><div class="go" id="o"></div></div>`,
    ids: ["m", "n", "o"],
  },
  {
    name: "columnGrow",
    note: "the same question down a column",
    css: `.box{display:flex;flex-direction:column;width:100px;height:300px}
          .fix{height:100px;width:20px}
          .go{flex-grow:1;width:20px}`,
    html: `<div class="box"><div class="fix" id="s"></div><div class="go" id="t"></div></div>`,
    ids: ["s", "t"],
  },
];

const { chromium } = requireHostTool("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();

const out = {
  $source:
    "Chromium via playwright-core, measured by gallery/ui/conformance/oracle/flexgrow_oracle.mjs",
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
