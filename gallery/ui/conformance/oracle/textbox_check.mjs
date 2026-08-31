#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// EVG's text box against the numbers a browser produced.
//
//   node gallery/ui/conformance/oracle/textbox_check.mjs
//
// Four rules, three of which EVG had wrong when a sidebar label was reported
// as not vertically centred:
//
//   the LINE BOX for a numeric line-height is that many ems, and for `normal`
//   it is the FACE's own line box — 1.15em for the sans fallback, not 1.2;
//   the FACE's ascent and descent are 0.905 and 0.212 em, not 0.80 and 0.20,
//   and the ascent is what puts the baseline inside the line box;
//   the HALF-LEADING can be negative, and clamping it at zero pushes every
//   tightly-led line down;
//   and a box TALLER than its line box puts the line at the TOP — which is
//   not a bug, it is what both engines do, and it is why the fix for the
//   reported symptom is in the stylesheet and not in here.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const require = createRequire(import.meta.url);
const H = require(path.join(ROOT, "gallery/ui/bin/ui_host.cjs"));
const oracle = JSON.parse(fs.readFileSync(path.join(HERE, "textbox.json"), "utf8"));

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};
const near = (name, got, want, tol = 0.02) =>
  ok(name, Math.abs(got - want) <= tol, got + "   want " + want);

const SANS = oracle.faces["sans-serif"];

console.log("--- the face's metrics ---");
{
  const m = new H.EVGTextMeasurer();
  const met = m.measureText("Hxg", "sans-serif", 1000);
  // The ESTIMATE, but taken from a real fallback rather than from a round
  // number. 0.80/0.20 summed to exactly 1.00em and no face does.
  near("ascent per em", met.ascent / 1000, SANS.ascentEm);
  near("descent per em", met.descent / 1000, SANS.descentEm);
  near("and `normal` is the face's line box, not 1.2",
    m.getLineHeight("sans-serif", 1000) / 1000, SANS.normalLineBoxEm);
}

console.log("--- the half-leading, including where it goes negative ---");
{
  // The layout's baseline, read off a real element rather than recomputed
  // here: the point is that the LAYOUT agrees, not that the formula does.
  const baselineAt = (lineHeightCss) => {
    const sheet = new H.EVGStyleSheet();
    sheet.parse(
      ".page{display:flex;flex-direction:column;flex-wrap:nowrap;width:800px;height:600px}" +
      ".t{font-size:1000px" + (lineHeightCss ? ";line-height:" + lineHeightCss : "") + "}",
    );
    const page = H.EVGElement.createDiv();
    page.className = "page";
    const t = H.EVGElement.createDiv();
    t.className = "t";
    t.textContent = "Hxg";
    page.addChild(t);
    sheet.applyTree(page, "");
    const l = new H.EVGLayout();
    l.setPageSize(800, 600);
    l.layout(page);
    return { baseline: t.calculatedBaseline / 1000, box: t.calculatedHeight / 1000 };
  };
  for (const w of oracle.leading) {
    const got = baselineAt(w.lineHeight === "normal" ? "" : w.lineHeight);
    near(`line-height ${w.lineHeight}: line box`, got.box, w.lineBoxEm);
    // THE ONE THE CLAMP BROKE. At line-height 1 and 0.8 the half-leading is
    // negative and the glyphs hang out of the line box; clamping it at zero
    // moved them down by that much.
    near(`line-height ${w.lineHeight}: baseline`, got.baseline, w.baselineEm);
  }
}

console.log("--- the arrangement the bug was reported in ---");
{
  // An icon box and a label in a centred row, exactly as the sidebar had it.
  const build = (withHeight) => {
    const sheet = new H.EVGStyleSheet();
    sheet.parse(
      ".page{display:flex;flex-direction:column;flex-wrap:nowrap;width:400px;height:200px}" +
      ".row{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;height:32px;gap:8px;font-size:13px}" +
      ".icon{width:16px;height:16px}" +
      ".t{font-size:13px" + (withHeight ? ";height:20px" : "") + "}",
    );
    const page = H.EVGElement.createDiv();
    page.className = "page";
    const row = H.EVGElement.createDiv();
    row.className = "row";
    const icon = H.EVGElement.createDiv();
    icon.className = "icon";
    const t = H.EVGElement.createDiv();
    t.className = "t";
    t.textContent = "Reports";
    row.addChild(icon);
    row.addChild(t);
    page.addChild(row);
    sheet.applyTree(page, "");
    const l = new H.EVGLayout();
    l.setPageSize(400, 200);
    l.layout(page);
    // The LINE BOX, which is what a reader sees — not the border box. The
    // line sits at the top of the content box and is as tall as the leading.
    const lineTop = t.calculatedY + t.box.paddingTopPx + t.box.borderWidthPx;
    const lineHeight = t.calculatedBaseline > 0
      ? 13 * (H.EVGTextMeasurer.normalLineHeightEm())
      : 0;
    return {
      rowCentre: row.calculatedY + row.calculatedHeight / 2,
      iconCentre: icon.calculatedY + icon.calculatedHeight / 2,
      textBoxHeight: t.calculatedHeight,
      lineBoxCentre: lineTop + lineHeight / 2,
    };
  };

  const a = build(true);
  const wantA = oracle.withHandWrittenHeight;
  near("with a hand-written height, the icon is centred",
    a.iconCentre - a.rowCentre, wantA.iconCentre - wantA.rowCentre, 0.05);
  // NOT CENTRED, and the browser agrees to within a third of a pixel: the box
  // is 20 and the line inside it is 15, so the line sits high by half the
  // slack. This is the reported bug, reproduced.
  ok("and the line of text is NOT — the browser says so too",
    a.lineBoxCentre - a.rowCentre < -1.5 && wantA.offCentre < -1.5,
    `evg ${(a.lineBoxCentre - a.rowCentre).toFixed(2)}, browser ${wantA.offCentre}`);

  const b = build(false);
  const wantB = oracle.withAutoHeight;
  ok("with no height at all, the browser centres it exactly",
    wantB.offCentre === 0, "" + wantB.offCentre);
  near("and so does EVG", b.lineBoxCentre - b.rowCentre, 0, 0.05);
  near("the box being exactly the line box", b.textBoxHeight,
    13 * H.EVGTextMeasurer.normalLineHeightEm(), 0.05);
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
