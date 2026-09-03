#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The form, drawn — which is a different question from the form, measured.
//
// Nine conformance specs already drive `InputCtl` against a real `<input>` and
// agree about `value`, `selstart` and `selend` to the keystroke. Not one of
// them can see any of this:
//
//   the selection band was painted AFTER the text, so the Amount field drew a
//   blue rectangle where its number should have been, and then after that was
//   fixed it still covered the "€" beside it;
//   the band was positioned from the box while the text starts after the
//   prefix, so a selection sat one currency symbol to the left of what it was
//   selecting;
//   and the caret was measured at 14px against text drawn at 13, which is the
//   breadcrumb's font-family bug repeated with the size — four pixels of
//   overshoot on a seven-character number.
//
// A trace has no pixels. This file is where the pixels are checked.
//
//   node gallery/ui/demo/form-check.mjs

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/FormDemo.cjs"));
const CSS = fs.readFileSync(path.join(HERE, "form.css"), "utf8");

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

const fresh = () => { const d = new M.FormDemo(); d.init(CSS); d.displayListJson(); return d; };

// Every element with a class, in TREE ORDER — which is paint order, and the
// reason two of the bugs above existed at all.
function flat(d) {
  const out = [];
  const walk = (el, parent) => {
    out.push({ el, parent, cls: el.className || "" });
    for (const k of el.children) walk(k, el);
  };
  walk(d.root, null);
  return out;
}
const has = (n, c) => new RegExp("(^|\\s)" + c + "(\\s|$)").test(n.cls);
const find = (d, c) => flat(d).filter((n) => has(n, c));
const one = (d, id) => flat(d).find((n) => n.el.id === id);

console.log("--- the caret and the band are where the glyphs are ---");
{
  const d = fresh();
  // The Amount field opens focused with its whole value selected, so the band
  // and the text are the same run and must be the same width.
  const band = one(d, "fm-amount-band");
  const text = find(d, "fm-text").find((n) => n.el.textContent === "1250.00");
  const caret = one(d, "fm-amount-caret");
  ok("the amount is selected and banded", !!band && !!text && !!caret);
  ok(
    "the band is exactly as wide as the text it selects",
    Math.abs(band.el.calculatedWidth - text.el.calculatedWidth) < 0.5,
    band.el.calculatedWidth + " vs " + text.el.calculatedWidth,
  );
  ok(
    "and starts where the text starts",
    Math.abs(band.el.calculatedX - text.el.calculatedX) < 0.5,
    band.el.calculatedX + " vs " + text.el.calculatedX,
  );
  ok(
    "the caret sits at the end of the run",
    Math.abs(caret.el.calculatedX - (text.el.calculatedX + text.el.calculatedWidth)) < 0.5,
    caret.el.calculatedX + " vs " + (text.el.calculatedX + text.el.calculatedWidth),
  );
  // The prefix. The band is positioned from the BOX and the text begins after
  // the "€", so a band that ignored the prefix would start one symbol early.
  const prefix = one(d, "fm-amount").el.children.find((k) => (k.className || "").includes("fm-prefix"));
  ok("there is a currency prefix", !!prefix);
  ok(
    "and the band clears it",
    band.el.calculatedX >= prefix.calculatedX + prefix.calculatedWidth - 0.5,
    band.el.calculatedX + " vs prefix ending " + (prefix.calculatedX + prefix.calculatedWidth),
  );
}

console.log("--- paint order, which is tree order ---");
{
  const d = fresh();
  const kids = one(d, "fm-amount").el.children.map((k) => k.className || "");
  const iBand = kids.findIndex((c) => c.includes("fm-band"));
  const iPrefix = kids.findIndex((c) => c.includes("fm-prefix"));
  const iText = kids.findIndex((c) => c.includes("fm-text"));
  const iCaret = kids.findIndex((c) => c.includes("fm-caret"));
  // Behind everything it is behind: the number AND the currency symbol. The
  // second version of this fixed the text and still covered the "€".
  ok("the band is painted first", iBand === 0, kids.join(" | "));
  ok("then the prefix", iPrefix === 1, kids.join(" | "));
  ok("then the text", iText === 2, kids.join(" | "));
  ok("and the caret last", iCaret === 3, kids.join(" | "));
}

console.log("--- one caret on the page, and it follows focus ---");
{
  const d = fresh();
  ok("one caret", find(d, "fm-caret").length === 1, "got " + find(d, "fm-caret").length);
  d.setFocus("fm-name");
  d.rebuild();
  d.displayListJson();
  ok("still one after moving focus", find(d, "fm-caret").length === 1);
  ok("and it is in the field that has focus", !!one(d, "fm-name-caret"));
  ok("not in the one that lost it", !one(d, "fm-amount-caret"));
  // A field with no selection draws no band.
  ok("and a bare caret draws no band", find(d, "fm-band").length === 0);
}

console.log("--- nothing is drawn on top of anything else ---");
{
  const d = fresh();
  // The label and its required star. The first version made the label a text
  // node and hung the star off it as a child, and EVG laid the star out at the
  // content origin — on top of the first letter of the word.
  for (const tid of ["fm-name", "fm-email", "fm-secret"]) {
    const lb = one(d, tid + "-label");
    const kids = lb.el.children;
    ok(
      tid + ": the star is after the label, not on it",
      kids.length === 2 && kids[1].calculatedX >= kids[0].calculatedX + kids[0].calculatedWidth,
      kids.map((k) => k.calculatedX + "+" + k.calculatedWidth).join(" "),
    );
  }
  // Every radio has a mark, chosen or not — otherwise the unchosen ones are
  // invisible and their labels start at a different x.
  const radios = find(d, "fm-radio");
  ok("three radios", radios.length === 3, "got " + radios.length);
  ok(
    "each has a mark",
    radios.every((r) => r.el.children.some((k) => /fm-(dot|ring)/.test(k.className || ""))),
  );
  ok(
    "and exactly one is filled",
    radios.filter((r) => r.el.children.some((k) => (k.className || "").includes("fm-dot"))).length === 1,
  );
  const labels = radios.map((r) => r.el.children.find((k) => (k.className || "").includes("fm-radio-label")));
  const offsets = radios.map((r, i) => labels[i].calculatedX - r.el.calculatedX);
  ok(
    "so the labels are all inset the same",
    Math.max(...offsets) - Math.min(...offsets) < 0.5,
    offsets.join(","),
  );
}

console.log("--- the password's value is never the password's glyphs ---");
{
  const d = fresh();
  const box = one(d, "fm-secret");
  const shown = box.el.children.find((k) => (k.className || "").includes("fm-text")).textContent;
  ok("bullets are drawn", /^•+$/.test(shown), JSON.stringify(shown));
  ok("as many as there are characters", shown.length === d.secret.value.length, shown.length + " vs " + d.secret.value.length);
  ok("and the value is the text", d.secret.value === "correcthorse", JSON.stringify(d.secret.value));
  // The eye flips the glyphs and nothing else.
  d.press("fm-secret-eye");
  d.displayListJson();
  const shown2 = one(d, "fm-secret").el.children.find((k) => (k.className || "").includes("fm-text")).textContent;
  ok("the eye reveals the text", shown2 === "correcthorse", JSON.stringify(shown2));
  ok("and the value did not change", d.secret.value === "correcthorse");
}

console.log("--- and the eye sits at the end of its box, centred ---");
{
  // It was absolute at `left = halfTextW - 6`, which is a HALF-WIDTH CONSTANT
  // and not an edge: on a 244px box it landed at 116, three-quarters across.
  // Nothing caught it because every assertion above asks what the eye DOES,
  // and none asked where it is. So: the right edges line up to the box's own
  // padding, and the two vertical centres agree.
  const d = fresh();
  const rect = (n) => ({ x: n.el.calculatedX, y: n.el.calculatedY,
                         w: n.el.calculatedWidth, h: n.el.calculatedHeight });
  const box = rect(one(d, "fm-secret"));
  const eye = rect(one(d, "fm-secret-eye"));
  ok("both are laid out", box.w > 0 && eye.w > 0, JSON.stringify({ box, eye }));
  // The rule is SYMMETRY, not a number: whatever inset the text starts at on
  // the left, the eye ends at on the right. Asserting the inset itself would
  // just re-state form.css; asserting they are equal is the thing a person
  // sees.
  const text = find(d, "fm-text").find((n) => /^•+$/.test(n.el.textContent || ""));
  const leftInset = text.el.calculatedX - box.x;
  const rightInset = (box.x + box.w) - (eye.x + eye.w);
  ok("it ends as far from the right edge as the text starts from the left",
    Math.abs(leftInset - rightInset) < 1.5,
    `left=${leftInset} right=${rightInset} ${JSON.stringify({ box, eye })}`);
  // Anchored to the EDGE, not to the text: it must be past where the widest
  // plausible value would end, which the old spelling was not.
  ok("and well past the middle of the box", eye.x > box.x + box.w * 0.75,
    JSON.stringify({ box, eye }));
  const boxMid = box.y + box.h / 2;
  const eyeMid = eye.y + eye.h / 2;
  ok("vertically centred in the box", Math.abs(boxMid - eyeMid) < 1.5,
    `boxMid=${boxMid} eyeMid=${eyeMid}`);
  // The glyph is a different emoji per state, so a press is visible on its own
  // and not only in the dots beside it.
  const glyphOf = () => one(d, "fm-secret-eye").el.textContent;
  const hidden = glyphOf();
  d.press("fm-secret-eye");
  d.displayListJson();
  ok("the glyph changes when the text is revealed", glyphOf() !== hidden,
    `${hidden} -> ${glyphOf()}`);
}

console.log("--- it types, and the caret keeps up ---");
{
  const d = fresh();
  d.setFocus("fm-name");
  d.rebuild();
  ok("typing lands in the focused field", d.type("!") === true);
  ok("at the caret", d.name.value === "Ada Lovelace!", JSON.stringify(d.name.value));
  d.displayListJson();
  const text = one(d, "fm-name").el.children.find((k) => (k.className || "").includes("fm-text"));
  const caret = one(d, "fm-name-caret");
  ok(
    "and the caret is still at the end of what is drawn",
    Math.abs(caret.el.calculatedX - (text.calculatedX + text.calculatedWidth)) < 0.5,
    caret.el.calculatedX + " vs " + (text.calculatedX + text.calculatedWidth),
  );
  d.key("Home");
  d.type("X");
  ok("Home then typing inserts at the front", d.name.value === "XAda Lovelace!", JSON.stringify(d.name.value));
  // A readonly or disabled field would refuse, and neither is here — but the
  // radio group is not a text field and must refuse.
  d.setFocus("fm-delivery-post");
  ok("a radio takes no characters", d.type("q") === false);
}

console.log("--- the tab ring ---");
{
  const d = fresh();
  d.setFocus("fm-name");
  // Walk it twice round rather than asserting a count: the number of stops is
  // the demo's business and changes when a field is added, but "Tab comes back
  // to where it started" is the property, and a ring with a hole in it fails
  // that whatever its length.
  const ring = [];
  const start = d.focused;
  do { d.tab(false); ring.push(d.focused); } while (d.focused !== start && ring.length < 40);
  ok("Tab comes back to where it started", d.focused === start, ring.join(" "));
  ok("visiting every stop once", new Set(ring).size === ring.length, ring.join(" "));
  ok("the eye is one of them", ring.includes("fm-secret-eye"), ring.join(" "));
  ok("and so is the checkbox", ring.includes("fm-terms"));
  // A readonly field is still reachable: it can be read and copied from, and
  // skipping it would take something away from a keyboard user.
  ok("the readonly field is in the ring", ring.includes("fm-invoice"), ring.join(" "));
  d.setFocus("fm-name");
  d.tab(true);
  ok("Shift+Tab goes the other way", d.focused === "fm-submit", d.focused);
}

console.log("--- readonly is not disabled ---");
{
  const d = fresh();
  d.setFocus("fm-invoice");
  d.rebuild();
  const before = d.invoiceNo.value;
  ok("it takes focus", d.focused === "fm-invoice");
  ok("but not characters", d.type("x") === false);
  ok("and the value is untouched", d.invoiceNo.value === before, JSON.stringify(d.invoiceNo.value));
  // The measured surprise: no caret either. `input_readonly` drives this
  // against a real <input readonly> and Chromium reports the same selectionStart
  // through Home and every arrow — focus alone does not give one a caret.
  const s0 = d.invoiceNo.selStart();
  d.key("Home");
  ok("and no caret to move", d.invoiceNo.selStart() === s0, s0 + " -> " + d.invoiceNo.selStart());
  d.displayListJson();
  ok("so nothing draws one", !one(d, "fm-invoice-caret"));
  ok(
    "and the box says it is not for typing in",
    one(d, "fm-invoice").cls.includes("fm-box-off"),
    one(d, "fm-invoice").cls,
  );
}

console.log("--- a placeholder is drawn and is not a value ---");
{
  const d = fresh();
  const box = one(d, "fm-search");
  const ghost = box.el.children.find((k) => (k.className || "").includes("fm-ghost"));
  ok("the empty search box draws its placeholder", !!ghost && ghost.textContent === "Search customers",
    ghost ? JSON.stringify(ghost.textContent) : "absent");
  ok("greyed, not black", ghost.className.includes("fm-ghost"));
  ok("and the value is empty", d.search.value === "", JSON.stringify(d.search.value));
  // Typing replaces it outright — a placeholder that survived one character
  // would be drawn behind the text.
  d.setFocus("fm-search");
  d.rebuild();
  d.type("A");
  d.displayListJson();
  const box2 = one(d, "fm-search");
  ok("one character and it is gone", !box2.el.children.some((k) => (k.className || "").includes("fm-ghost")));
  ok("replaced by the value", d.search.value === "A", JSON.stringify(d.search.value));
}

console.log("--- nothing leaks out of its container ---");
{
  // The general form of the bug above, swept over the whole page rather than
  // asserted at the one place it was noticed. A shrink-wrapped container that
  // comes out narrower than the things inside it is not a styling mistake, it
  // is the layout getting max-content wrong, and it shows up as a button
  // hanging over the edge of the card it lives in.
  const d = fresh();
  const bad = [];
  const walk = (el) => {
    for (const k of el.children) {
      // Absolutely positioned children are out of flow: a caret and a
      // selection band are placed against the box on purpose and are not
      // content it has to make room for.
      if (k.position !== "absolute") {
        const right = k.calculatedX + k.calculatedWidth;
        const parentRight = el.calculatedX + el.calculatedWidth;
        if (right > parentRight + 0.5) {
          bad.push((k.className || "?") + " ends " + right.toFixed(0) + " inside " + (el.className || "?") + " ending " + parentRight.toFixed(0));
        }
      }
      walk(k);
    }
  };
  walk(d.root);
  ok("every element ends inside its parent", bad.length === 0, bad.join("; "));
}

console.log("--- what a reader gets ---");
{
  const d = fresh();
  const nodes = JSON.parse(d.a11yJson(1, "fm-amount")).nodes;
  const by = (id) => nodes.find((n) => n.id === id);
  const form = nodes.filter((n) => n.role === "form");
  ok("one named form landmark", form.length === 1 && form[0].name === "New invoice",
    JSON.stringify(form.map((n) => n.name)));

  // The Field's whole job: the label names the control and the hint or the
  // error describes it. NOT BOTH — see the demo's header.
  ok("the email is named by its label", by("fm-email") && by("fm-email").name === "Email",
    by("fm-email") ? JSON.stringify(by("fm-email").name) : "absent");
  ok(
    "and described by its ERROR, not its hint",
    by("fm-email").desc === "That address is missing an @.",
    JSON.stringify(by("fm-email").desc),
  );
  ok(
    "a field with no error is described by its hint",
    by("fm-secret").desc === "At least 8 characters.",
    JSON.stringify(by("fm-secret").desc),
  );
  ok("and one with neither says nothing", !by("fm-name").desc, JSON.stringify(by("fm-name").desc));

  // The star is decoration and the attribute is the claim.
  ok("the name field is a textbox", by("fm-name").role === "textbox", by("fm-name").role);
  ok("the star is not announced", !nodes.some((n) => (n.name || "").includes("*")));

  ok("no lint", d.a11yProblems().length === 0, d.a11yProblems().join("; "));
  ok("no style errors", d.styleErrorCount() === 0, d.styleErrorAt(0) || "");
}

// --- clicking puts the caret where you clicked -------------------------------
//
// The field could always answer "which character is under this x" —
// `indexAtX` — and was never asked, so a click focused a box and left the
// caret wherever it had been. It also could not have answered correctly until
// the advance table went in: fed the old bucket estimate it would have
// returned an index several characters out on any string of mixed widths.
//
// So this asserts both halves at once: that the click is wired, and that the
// index it lands on is the one under the pointer.
{
  const d = fresh();
  const bx = d.boxXOf("fm-name"), bw = d.boxWidthOf("fm-name");
  const c = d.inputFor("fm-name");
  const value = c.value;                     // "Ada Lovelace"

  // Click before the first character: caret 0, whichever way the pointer
  // approaches the left edge.
  d.pressAt("fm-name", bx + 2);
  ok("a click at the very left puts the caret at 0", c.caret === 0, c.caret);

  // Click past the end of the text: the last index, not an overflow.
  d.pressAt("fm-name", bx + bw - 2);
  ok("a click past the end puts the caret at the end", c.caret === value.length, c.caret);

  // And in between: walk the string and check the caret lands on the character
  // whose box contains the x. The measurement is exact for this string, so
  // this is an equality and not a tolerance.
  let wrong = 0, firstWrong = "";
  for (let i = 1; i < value.length; i++) {
    // Through the demo's own inverse, not `bx + 10`. That literal was the
    // padding without the border — the same mistake `pressAt` made, so the
    // round trip agreed with itself and the caret sat a pixel off the pointer.
    const x = d.pageXOf("fm-name", i) - 0.5;   // just inside char i
    d.pressAt("fm-name", x);
    if (c.caret !== i) { wrong++; if (!firstWrong) firstWrong = `x for index ${i} landed on ${c.caret}`; }
  }
  ok(`every position in "${value}" maps back to its own index`, wrong === 0, firstWrong);

  // Dragging extends rather than moves: the anchor stays where the press put it.
  d.pressAt("fm-name", bx + 10 + d.caretXOf("fm-name", 4));
  d.dragTo("fm-name", bx + 10 + d.caretXOf("fm-name", 9));
  ok("a drag keeps the anchor and moves the caret", c.anchor === 4 && c.caret === 9,
     `anchor ${c.anchor} caret ${c.caret}`);
  ok("which is a selection", c.hasSelection());
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
