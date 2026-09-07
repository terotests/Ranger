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

// --- `line-height` is three different computations, not one ------------------
//
// CSS lets it be written three ways and keeps them apart: `normal` is the
// FACE's own line box, a NUMBER is that many times the font size, and a
// LENGTH is itself. EVG held one double and ran everything through
// `to_double`, which stops at the first character it cannot use — so `24px`
// came back 24 and was used as a multiplier. A 14px run got a 336-pixel line
// box, and a line sitting at the top of a box twelve times too tall reads, on
// the screen, as a line that has fallen to the bottom of everything near it.
console.log("--- line-height as a number, a length and a percentage ---");
{
  const boxOf = (lineHeight, rootPx) => {
    const sheet = new H.EVGStyleSheet();
    sheet.parse(
      `.page{display:flex;flex-direction:column;flex-wrap:nowrap;width:400px;height:300px;font-size:${rootPx}px}` +
      ".t{font-size:14px" + (lineHeight ? ";line-height:" + lineHeight : "") + "}",
    );
    const page = H.EVGElement.createDiv();
    page.className = "page";
    const t = H.EVGElement.createDiv();
    t.className = "t";
    t.textContent = "Hxg";
    page.addChild(t);
    sheet.applyTree(page, "");
    const l = new H.EVGLayout();
    l.setPageSize(400, 300);
    l.layout(page);
    return t.calculatedHeight;
  };
  const NORMAL = 14 * SANS.normalLineBoxEm;
  near("unset is the face's own line box", boxOf("", 16), NORMAL);
  near("`normal` says the same", boxOf("normal", 16), NORMAL);
  near("a number multiplies the font size", boxOf("1.5", 16), 21);
  near("and so does a percentage, against the font size", boxOf("150%", 16), 21);
  near("a length in px is itself, NOT a multiplier", boxOf("24px", 16), 24);
  near("`em` is against this element's own size", boxOf("2em", 16), 28);
  near("`rem` is against the root's", boxOf("1.5rem", 16), 24);
  // The half-leading goes negative here, and the line still owns its box.
  near("a number under one gives a box smaller than the face", boxOf("0.8", 16), 11.2);
}

// --- the text starts inside the border, not on it ----------------------------
//
// `getInnerWidth` takes the border off as well as the padding, and the
// layout's own `calculatedBaseline` is measured from the border edge and adds
// both. The display list added only the padding, so a text element with a
// border drew its text one border-width high and one left — over its own top
// border, and measured against a width that assumed it started inside it.
// EVG disagreeing with EVG, which is the kind of divergence that survives
// longest because both halves look right on their own.
console.log("--- a border on a text element ---");
{
  const build = (borderPx) => {
    const sheet = new H.EVGStyleSheet();
    sheet.parse(
      ".page{display:flex;flex-direction:column;flex-wrap:nowrap;width:400px;height:300px}" +
      ".t{font-size:14px;height:60px;padding:5px 7px" +
      (borderPx ? `;border-width:${borderPx}px;border-color:#fff` : "") + "}",
    );
    const page = H.EVGElement.createDiv();
    page.className = "page";
    const t = H.EVGElement.createDiv();
    t.className = "t";
    t.textContent = "Hxg";
    page.addChild(t);
    sheet.applyTree(page, "");
    const l = new H.EVGLayout();
    l.setPageSize(400, 300);
    l.layout(page);
    const dl = new H.EVGDisplayList();
    dl.setTextEngine(l.getTextEngine());
    dl.build(page);
    const cmd = JSON.parse(dl.toJson()).cmds.find((c) => c.k === 3);
    return { baseline: t.calculatedBaseline, lineTop: cmd.y, lineLeft: cmd.x, lineBox: cmd.h };
  };
  for (const bw of [0, 3]) {
    const got = build(bw);
    near(`border ${bw}px: the line starts below the border and the padding`,
      got.lineTop, bw + 5);
    near(`border ${bw}px: and to the right of both`, got.lineLeft, bw + 7);
    // THE ONE THAT MATTERS: the layout's baseline and the painter's are the
    // same point. The painter puts the baseline a half-leading and an ascent
    // below the line box's top; the layout computes it from the border edge.
    const half = (got.lineBox - (SANS.ascentEm + SANS.descentEm) * 14) / 2;
    near(`border ${bw}px: the layout's baseline is the painter's`,
      got.lineTop + half + SANS.ascentEm * 14, got.baseline);
  }
}

// --- a shrink-wrapped box cannot break its own content -----------------------
//
// A text element with no stated width shrink-wraps: the layout measures the
// run, adds the padding and the border, and that sum is the box. The breaker
// then works with the box MINUS the same padding and border, and
// `(w + chrome) - chrome` is not always `w` in binary floating point. For some
// strings it lands a few parts in a quadrillion low, and a line measured to
// fit exactly is then a hair too wide and goes onto a second line. ISSUES.md
// #7, reported as five labels of a sidebar on one line and the sixth on two.
console.log("--- the round trip a shrink-wrapped box makes ---");
{
  const eng = new H.EVGTextEngine();
  const WORDS = [
    "Overview", "Text engine", "Display list", "Style sheet", "Hit testing",
    "Accessibility", "Layout", "Transitions", "Scroll layers", "Vertical rhythm",
    "Kerning pairs", "Harjoituspäiväkirja", "Johdetut arvot", "porraskävely",
    "Viimeisimmät arviot", "Hermostokuorma", "Kontrastivoima", "Alkulämmittely",
    "Takakyykky", "Penkkipunnerrus", "Loppuverryttely",
  ];
  let lossy = 0;
  let broke = 0;
  let all = 0;
  let firstBreak = "";
  for (const w of WORDS)
    for (const fs of [11, 12, 13, 14, 15, 16, 17, 24])
      for (const pad of [4, 6, 8, 10, 12, 16, 20, 24])
        for (const bw of [0, 1, 2, 3]) {
          const content = eng.maxLineWidth(w, "sans-serif", fs);
          const inner = content + pad * 2 + bw * 2 - pad * 2 - bw * 2;
          all += 1;
          if (inner < content) lossy += 1;
          if (eng.lineCount(w, "sans-serif", fs, inner) !== 1) {
            broke += 1;
            if (!firstBreak) firstBreak = `"${w}" at ${fs}px, ${pad}px padding, ${bw}px border`;
          }
        }
  // The check is only worth its place if the arrangement it covers really is
  // the lossy one: say how many of the round trips come back short.
  ok("the round trip really does lose width for some strings", lossy > 0,
     `${lossy} of ${all}`);
  ok("and not one of them breaks inside its own box", broke === 0,
     `${broke} of ${all} broke — first ${firstBreak}`);
}

// --- a flex container's own text is an anonymous flex item -------------------
//
// An element that is a flex container and carries text of its own does not lay
// that text out as a block. CSS wraps it in an ANONYMOUS FLEX ITEM, and from
// then on `align-items` and `justify-content` place it like any other item.
//
// That is the pill idiom, written that way everywhere:
//
//   .pill { display: flex; align-items: center; height: 34px; padding: 0 12px }
//
// with the label as the element's own text. EVG placed the line at the top of
// the content box and never consulted `align-items`, so the label sat against
// the pill's top edge with all the slack under it.
//
// The check is the EQUIVALENCE, which is stronger than any number: the
// element's own text has to land exactly where the same text in a child of the
// same container lands. A browser cannot tell those two apart and neither may
// EVG. The block cases are here to say the anonymous item is only a flex
// container's — a block's line boxes still start at the top of its content box.
console.log("--- a flex container's own text ---");
{
  const lineTop = (containerCss, nested) => {
    const sheet = new H.EVGStyleSheet();
    sheet.parse(
      ".page{display:flex;flex-direction:column;flex-wrap:nowrap;width:400px;height:300px}" +
      ".pill{" + containerCss + "}" +
      ".inner{font-size:15px}",
    );
    const page = H.EVGElement.createDiv();
    page.className = "page";
    const pill = H.EVGElement.createDiv();
    pill.className = "pill";
    if (nested) {
      const t = H.EVGElement.createDiv();
      t.className = "inner";
      t.textContent = "10min";
      pill.addChild(t);
    } else {
      pill.textContent = "10min";
    }
    page.addChild(pill);
    sheet.applyTree(page, "");
    const l = new H.EVGLayout();
    l.setPageSize(400, 300);
    l.layout(page);
    const dl = new H.EVGDisplayList();
    dl.setTextEngine(l.getTextEngine());
    dl.build(page);
    const c = JSON.parse(dl.toJson()).cmds.find((x) => x.k === 3);
    return { y: c.y, box: c.h, baseline: pill.calculatedBaseline, pillH: pill.calculatedHeight };
  };

  const FLEX = "display:flex;flex-wrap:nowrap;height:34px;padding:0 12px;font-size:15px";
  const CASES = [
    ["align-items: center", FLEX + ";flex-direction:row;align-items:center"],
    ["align-items: flex-end", FLEX + ";flex-direction:row;align-items:flex-end"],
    ["align-items: flex-start", FLEX + ";flex-direction:row;align-items:flex-start"],
    ["no align-items at all", FLEX + ";flex-direction:row"],
    ["column, justify-content: center", FLEX + ";flex-direction:column;justify-content:center"],
    ["column, justify-content: flex-end", FLEX + ";flex-direction:column;justify-content:flex-end"],
  ];
  for (const [name, css] of CASES) {
    const own = lineTop(css, false);
    const kid = lineTop(css, true);
    near(`${name}: the container's own text lands where a child's does`,
      own.y, kid.y, 0.02);
  }

  // The slack really is there to be shared — otherwise every case above would
  // pass by having none — and a centred line has half of it above.
  const centred = lineTop(CASES[0][1], false);
  near("and centring puts half the slack above the line",
    centred.y, (centred.pillH - centred.box) / 2, 0.02);
  ok("which is slack worth sharing", centred.pillH - centred.box > 10,
     `${(centred.pillH - centred.box).toFixed(1)}px`);

  // The layout's baseline moves with it, or `align-items: baseline` on the row
  // around the pill would line the pill up by a baseline the painter does not
  // draw at.
  const half = (centred.box - (SANS.ascentEm + SANS.descentEm) * 15) / 2;
  near("the layout's baseline is still the painter's",
    centred.y + half + SANS.ascentEm * 15, centred.baseline, 0.02);

  // A BLOCK is not a flex container: its line boxes start at the top of its
  // content box whatever `align-items` says, which is the rule the fix must
  // not have widened.
  const block = lineTop("height:34px;padding:0 12px;font-size:15px;align-items:center", false);
  near("a block ignores align-items and starts at the top", block.y, 0);
}

// --- `white-space: nowrap` ---------------------------------------------------
//
// Two values matter here: `normal`, which wraps at the box's width, and
// `nowrap`, which does not wrap at all — the line is as long as the text and
// the box clips it if it clips anything. A ONE-LINE FIELD is the reason: an
// `<input>` never wraps whatever is in it, it scrolls.
//
// It is INHERITED, as CSS has it, so a field says it once and the run and the
// placeholder inside it obey without saying so themselves. And the layout and
// the display list have to agree about the count, or the box is sized for one
// wrap and painted with another.
console.log("--- white-space ---");
{
  const wrap = (ws, nested) => {
    const sheet = new H.EVGStyleSheet();
    sheet.parse(
      ".page{display:flex;flex-direction:column;flex-wrap:nowrap;width:400px;height:300px}" +
      ".box{width:80px;font-size:13px" + (ws ? ";white-space:" + ws : "") + "}" +
      ".run{font-size:13px}",
    );
    const page = H.EVGElement.createDiv();
    page.className = "page";
    const box = H.EVGElement.createDiv();
    box.className = "box";
    const TEXT = "one two three four five";
    if (nested) {
      const run = H.EVGElement.createDiv();
      run.className = "run";
      run.textContent = TEXT;
      box.addChild(run);
    } else {
      box.textContent = TEXT;
    }
    page.addChild(box);
    sheet.applyTree(page, "");
    const l = new H.EVGLayout();
    l.setPageSize(400, 300);
    l.layout(page);
    const dl = new H.EVGDisplayList();
    dl.setTextEngine(l.getTextEngine());
    dl.build(page);
    const runs = JSON.parse(dl.toJson()).cmds.filter((c) => c.k === 3);
    const el = nested ? box.getChild(0) : box;
    return { drawn: runs.length, boxH: el.calculatedHeight, lineBox: runs[0].h };
  };

  const normal = wrap("", false);
  ok("a narrow box wraps by default", normal.drawn > 1, normal.drawn + " lines");
  // The height the layout reserved is the height the lines drawn need: the
  // two sides counting differently is a box the last line falls out of.
  near("and its height is the lines it drew", normal.boxH, normal.drawn * normal.lineBox);

  const flat = wrap("nowrap", false);
  ok("`nowrap` does not wrap", flat.drawn === 1, flat.drawn + " lines");
  near("and its height is one line", flat.boxH, flat.lineBox);

  // INHERITED: the box says it, the run inside obeys.
  const inherited = wrap("nowrap", true);
  ok("a child inherits it", inherited.drawn === 1, inherited.drawn + " lines");
  const inheritedNormal = wrap("", true);
  ok("and inherits `normal` too", inheritedNormal.drawn > 1, inheritedNormal.drawn + " lines");
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
