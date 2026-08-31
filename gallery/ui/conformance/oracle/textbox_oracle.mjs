#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Where a browser puts a line of text inside its box.
//
//   node gallery/ui/conformance/oracle/textbox_oracle.mjs
//
// Writes `textbox.json` beside this file. EVG's layout, its measurer and the
// WebGL painter are all built against these numbers.
//
// WHY. A sidebar label was reported as not vertically centred, and "centre the
// text in the row" turns out to be four separate rules, three of which EVG had
// wrong and one of which is not a rule at all:
//
//   1. THE LINE BOX. `line-height: 1.2` is 1.2em exactly. `normal` is NOT
//      1.2 — it is the face's own line box, about 1.15em for the sans
//      fallback, and EVG used 1.2 for both.
//   2. THE FACE'S ASCENT AND DESCENT. EVG estimated 0.80em and 0.20em, which
//      sum to exactly 1.00em. No real face does: measured at 1000px the sans
//      fallback is 0.905 and 0.212, summing to 1.117em. The ascent is what
//      puts the baseline inside the line box, so the estimate drew every run
//      high.
//   3. THE HALF-LEADING. baseline = (lineBox - (ascent + descent)) / 2 +
//      ascent, and that first term can be NEGATIVE — at `line-height: 1` the
//      line box is smaller than the face and the glyphs overflow it equally
//      top and bottom. EVG clamped it at zero.
//   4. AND THE ONE THAT IS NOT A BUG: a box TALLER than its line box puts the
//      line at the TOP and leaves the slack underneath. Both engines do this,
//      and it is why a hand-rounded `height: 20px` on a 15.6-tall line makes
//      a centred row look wrong. The fix for that one is in the stylesheet.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requireDom, findChromium } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.setContent('<style>html,body{margin:0;padding:0}</style><div id="host"></div>');

const capture = await page.evaluate(() => {
  // The baseline is read with a zero-sized inline-block aligned to it: its top
  // IS the baseline, and unlike a canvas measurement it is the box the layout
  // actually produced.
  const baselineOf = (el) => {
    const s = document.createElement("span");
    s.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
    el.appendChild(s);
    const y = s.getBoundingClientRect().top - el.getBoundingClientRect().top;
    s.remove();
    return y;
  };

  // Face metrics at 1000px, where the browser's integer rounding is noise.
  const faces = {};
  for (const fam of ["sans-serif", "serif", "monospace"]) {
    const S = 1000;
    const c = document.createElement("canvas").getContext("2d");
    c.font = `${S}px ${fam}`;
    const m = c.measureText("Hxg");
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;left:0;top:0;font-family:${fam};font-size:${S}px;line-height:normal`;
    d.textContent = "Hxg";
    document.body.appendChild(d);
    faces[fam] = {
      ascentEm: +(m.fontBoundingBoxAscent / S).toFixed(4),
      descentEm: +(m.fontBoundingBoxDescent / S).toFixed(4),
      normalLineBoxEm: +(d.getBoundingClientRect().height / S).toFixed(4),
      baselineInNormalEm: +(baselineOf(d) / S).toFixed(4),
    };
    d.remove();
  }

  // The half-leading model, at a size big enough to read fractions off.
  const leading = [];
  for (const lh of ["normal", "2", "1.5", "1.2", "1", "0.8"]) {
    const S = 1000;
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;left:0;top:0;font-family:sans-serif;font-size:${S}px;line-height:${lh}`;
    d.textContent = "Hxg";
    document.body.appendChild(d);
    leading.push({
      lineHeight: lh,
      lineBoxEm: +(d.getBoundingClientRect().height / S).toFixed(4),
      baselineEm: +(baselineOf(d) / S).toFixed(4),
    });
    d.remove();
  }

  // And the arrangement the bug was reported in: an icon box and a label in a
  // centred row, with and without a hand-written height on the label.
  const host = document.getElementById("host");
  host.innerHTML =
    '<style>' +
    '.row{position:absolute;left:0;display:flex;flex-direction:row;align-items:center;' +
    'height:32px;gap:8px;font-family:sans-serif;font-size:13px}' +
    '.icon{width:16px;height:16px}</style>' +
    '<div class="row" id="rA" style="top:0"><i class="icon"></i><span id="tA" style="height:20px">Reports</span></div>' +
    '<div class="row" id="rB" style="top:40px"><i class="icon"></i><span id="tB">Reports</span></div>';
  const arrangement = (rowId, textId) => {
    const row = document.getElementById(rowId);
    const t = document.getElementById(textId);
    const icon = row.querySelector(".icon");
    const rr = row.getBoundingClientRect();
    const tr = t.getBoundingClientRect();
    const ir = icon.getBoundingClientRect();
    const rg = document.createRange();
    rg.selectNodeContents(t);
    const lr = rg.getBoundingClientRect();
    return {
      rowCentre: +(rr.y + rr.height / 2).toFixed(3),
      iconCentre: +(ir.y + ir.height / 2).toFixed(3),
      textBoxTop: +(tr.y - rr.y).toFixed(3),
      textBoxHeight: +tr.height.toFixed(3),
      lineBoxTop: +(lr.y - rr.y).toFixed(3),
      lineBoxHeight: +lr.height.toFixed(3),
      lineBoxCentre: +(lr.y + lr.height / 2).toFixed(3),
      // The number the report was about: how far the line of text is from the
      // middle of the row it is supposed to be centred in.
      offCentre: +(lr.y + lr.height / 2 - (rr.y + rr.height / 2)).toFixed(3),
    };
  };
  return {
    faces,
    leading,
    withHandWrittenHeight: arrangement("rA", "tA"),
    withAutoHeight: arrangement("rB", "tB"),
  };
});

await browser.close();
fs.writeFileSync(path.join(HERE, "textbox.json"), JSON.stringify(capture, null, 1) + "\n");
console.log("wrote oracle/textbox.json");
console.log("faces:", JSON.stringify(capture.faces["sans-serif"]));
for (const l of capture.leading) {
  console.log(`  line-height ${String(l.lineHeight).padEnd(7)} lineBox=${l.lineBoxEm}em  baseline=${l.baselineEm}em` +
    `   half-leading=${((l.lineBoxEm - (capture.faces["sans-serif"].ascentEm + capture.faces["sans-serif"].descentEm)) / 2).toFixed(4)}em`);
}
console.log("hand-written height:", JSON.stringify(capture.withHandWrittenHeight));
console.log("auto height:        ", JSON.stringify(capture.withAutoHeight));
