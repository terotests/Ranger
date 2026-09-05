#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The label-left form, and one bug that was in the ENGINE rather than in it.
//
// The claim this page makes is a layout claim: every control's left edge is on
// one column, and a label and a control of different heights are centred
// against each other. Nine rows, deliberately of three different heights, so a
// layout that only worked when they matched has nowhere to hide.
//
// The bug it found: the flex-grow pass estimated a width-less flex CONTAINER
// at the whole row rather than at its contents, so a row holding a title block,
// a `flex: 1` spacer and a badge computed no free space at all — the spacer got
// nothing and the badge sat against the title instead of at the far end. Every
// spacer on the page was zero. `layoutElement` had already learned to look
// inside a container; the flex basis had not, and the two disagreeing is what
// let it happen.
//
//   node gallery/ui/demo/profile-check.mjs

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/ProfileDemo.cjs"));
const CSS = fs.readFileSync(path.join(HERE, "profile.css"), "utf8");

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

const fresh = () => { const d = new M.ProfileDemo(); d.init(CSS); d.displayListJson(); return d; };

function flat(d) {
  const out = [];
  const walk = (el, parent) => { out.push({ el, parent, cls: el.className || "" }); for (const k of el.children) walk(k, el); };
  walk(d.root, null);
  return out;
}
const has = (n, c) => new RegExp("(^|\\s)" + c + "(\\s|$)").test(n.cls);
const find = (d, c) => flat(d).filter((n) => has(n, c));
const one = (d, id) => flat(d).find((n) => n.el.id === id);
const mid = (el) => el.calculatedY + el.calculatedHeight / 2;

console.log("--- one column, whatever is in it ---");
{
  const d = fresh();
  const rows = find(d, "pf-row");
  ok("nine rows", rows.length === 9, "got " + rows.length);

  const labels = rows.map((r) => r.el.children[0]);
  const cells = rows.map((r) => r.el.children[1]);
  const lefts = cells.map((c) => c.calculatedX);
  ok(
    "every control starts on the same x",
    Math.max(...lefts) - Math.min(...lefts) < 0.5,
    lefts.join(","),
  );
  const labelLefts = labels.map((l) => l.calculatedX);
  ok(
    "and every label does too",
    Math.max(...labelLefts) - Math.min(...labelLefts) < 0.5,
    labelLefts.join(","),
  );
  // The column is the LABEL's stated width, not whatever the longest label
  // happened to measure — a label that sized to its own text would give nine
  // columns and read as nine unrelated rows.
  ok(
    "the control column starts where the label column ends",
    cells.every((c, i) => Math.abs(c.calculatedX - (labels[i].calculatedX + labels[i].calculatedWidth)) < 0.5),
    cells.map((c, i) => c.calculatedX + "/" + (labels[i].calculatedX + labels[i].calculatedWidth)).join(" "),
  );

  // The rows are deliberately different heights. If they were not, this check
  // would pass for the wrong reason.
  const heights = new Set(rows.map((r) => Math.round(r.el.calculatedHeight)));
  ok("the rows are not all the same height", heights.size >= 3, [...heights].join(","));
  ok(
    "and the label is centred against its control in every one",
    rows.every((r, i) => Math.abs(mid(labels[i]) - mid(cells[i])) < 1),
    rows.map((r, i) => (mid(labels[i]) - mid(cells[i])).toFixed(1)).join(" "),
  );
}

console.log("--- the spacers, which were all zero ---");
{
  const d = fresh();
  const spacers = find(d, "pf-spacer");
  ok("there are spacers", spacers.length >= 5, "got " + spacers.length);
  ok(
    "and every one of them took the slack",
    spacers.every((s) => s.el.calculatedWidth > 1),
    spacers.map((s) => Math.round(s.el.calculatedWidth)).join(","),
  );

  // What the header's spacer is FOR: the badge at the far end of the card.
  const head = find(d, "pf-head")[0];
  const badge = one(d, "pf-progress");
  const headRight = head.el.calculatedX + head.el.calculatedWidth;
  const badgeRight = badge.el.calculatedX + badge.el.calculatedWidth;
  ok(
    "the badge sits at the right edge of the header",
    headRight - badgeRight < 26,
    badgeRight + " vs " + headRight,
  );
  // And the footer's: the buttons at the far end, the hint at the near one.
  const foot = find(d, "pf-foot")[0];
  const save = one(d, "pf-save");
  const hint = find(d, "pf-foot-text")[0];
  ok(
    "the buttons sit at the right edge of the footer",
    (foot.el.calculatedX + foot.el.calculatedWidth) - (save.el.calculatedX + save.el.calculatedWidth) < 26,
  );
  ok("and the hint at the left", hint.el.calculatedX - foot.el.calculatedX < 26);
  // A trailing icon inside a box is the same mechanism at a smaller scale.
  const birth = one(d, "pf-birth");
  const icon = birth.el.children.find((k) => (k.className || "").includes("pf-icon"));
  ok(
    "and the calendar at the right edge of its box",
    (birth.el.calculatedX + birth.el.calculatedWidth) - (icon.calculatedX + icon.calculatedWidth) < 16,
  );
}

console.log("--- the caret, again measured with the engine that draws ---");
{
  const d = fresh();
  const box = one(d, "pf-name");
  const text = box.el.children.find((k) => (k.className || "").includes("pf-text"));
  const caret = one(d, "pf-name-caret");
  ok("the focused field draws a caret", !!caret);
  ok(
    "at the end of what is drawn",
    Math.abs(caret.el.calculatedX - (text.calculatedX + text.calculatedWidth)) < 0.5,
    caret.el.calculatedX + " vs " + (text.calculatedX + text.calculatedWidth),
  );
  // A LEADING icon moves where the run starts, and the caret has to know.
  d.setFocus("pf-dismissal");
  d.rebuild();
  d.displayListJson();
  const tbox = one(d, "pf-dismissal");
  const ticon = tbox.el.children.find((k) => (k.className || "").includes("pf-icon"));
  const ttext = tbox.el.children.find((k) => (k.className || "").includes("pf-text"));
  const tcaret = one(d, "pf-dismissal-caret");
  ok("the clock comes before the time", ticon.calculatedX < ttext.calculatedX);
  ok(
    "and the caret clears both",
    Math.abs(tcaret.el.calculatedX - (ttext.calculatedX + ttext.calculatedWidth)) < 0.5,
    tcaret.el.calculatedX + " vs " + (ttext.calculatedX + ttext.calculatedWidth),
  );
  ok("one caret on the page", find(d, "pf-caret").length === 1);
}

console.log("--- the switch is a position, not a mark ---");
{
  const d = fresh();
  const on = one(d, "pf-hire");
  const knobOn = on.el.children[0];
  const rightGap = (on.el.calculatedX + on.el.calculatedWidth) - (knobOn.calculatedX + knobOn.calculatedWidth);
  d.press("pf-hire");
  d.displayListJson();
  const off = one(d, "pf-hire");
  const knobOff = off.el.children[0];
  const leftGap = knobOff.calculatedX - off.el.calculatedX;
  ok("pressing it turns it off", d.hire.checkState === 0);
  ok(
    "and the knob moves to the other end",
    Math.abs(rightGap - leftGap) < 1 && knobOff.calculatedX < knobOn.calculatedX,
    "on-right=" + rightGap.toFixed(1) + " off-left=" + leftGap.toFixed(1),
  );
  ok("the track changes class with it", !off.cls.includes("pf-switch-on") && on.cls.includes("pf-switch-on"));
  d.press("pf-hire");
  ok("and back", d.hire.checkState === 1);
}

console.log("--- it types, and only where it should ---");
{
  const d = fresh();
  d.setFocus("pf-company");
  d.rebuild();
  ok("a text field takes characters", d.type("!") === true);
  ok("at the caret", d.company.value === "Harborline Systems!", JSON.stringify(d.company.value));
  d.setFocus("pf-hire");
  ok("a switch takes none", d.type("x") === false);
  d.setFocus("pf-visibility");
  ok("nor does a select", d.type("x") === false);
  // The ring closes, and every stop in it is reached once.
  d.setFocus("pf-photo-change");
  const ring = [];
  const start = d.focused;
  do { d.tab(false); ring.push(d.focused); } while (d.focused !== start && ring.length < 40);
  ok("Tab comes back to where it started", d.focused === start, ring.join(" "));
  ok("visiting every stop once", new Set(ring).size === ring.length, ring.join(" "));
  ok("twelve of them", ring.length === 12, "got " + ring.length);
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
  const nodes = JSON.parse(d.a11yJson(1, "pf-name")).nodes;
  const by = (id) => nodes.find((n) => n.id === id);

  const forms = nodes.filter((n) => n.role === "form");
  ok("one named form landmark", forms.length === 1 && forms[0].name === "Profile settings",
    JSON.stringify(forms.map((n) => n.name)));

  ok("the switch is a switch", by("pf-hire") && by("pf-hire").role === "switch",
    by("pf-hire") ? by("pf-hire").role : "absent");
  // The tri-state as the tree spells it: 0 not applicable, 1 no, 2 yes.
  ok("and says it is on", by("pf-hire").checked === 2, JSON.stringify(by("pf-hire").checked));

  // The one thing a reader cannot see about a closed select.
  ok("the select says it opens a list", by("pf-visibility") && by("pf-visibility").haspopup === "listbox",
    by("pf-visibility") ? JSON.stringify(by("pf-visibility").haspopup) : "absent");
  ok("and that it is shut", by("pf-visibility").expanded === 1, JSON.stringify(by("pf-visibility").expanded));

  // A date field says what shape the answer takes, because the calendar glyph
  // beside it is hidden and a reader is entitled to know.
  ok("the date field is described", by("pf-birth") && by("pf-birth").desc === "A date, written out.",
    by("pf-birth") ? JSON.stringify(by("pf-birth").desc) : "absent");
  ok("the time field too", by("pf-dismissal").desc === "A time of day, 24 hour.",
    JSON.stringify(by("pf-dismissal").desc));
  ok("and a plain field is not", !by("pf-company").desc, JSON.stringify(by("pf-company").desc));

  // Decoration stays out: the help glyph and every icon.
  ok("the help mark is not announced", !nodes.some((n) => (n.name || "") === "?"));
  ok("nor the chevron", !nodes.some((n) => (n.name || "").includes("⌄")));
  ok("nor the calendar", !nodes.some((n) => (n.name || "").includes("🗓")));

  ok("no lint", d.a11yProblems().length === 0, d.a11yProblems().join("; "));
  ok("no style errors", d.styleErrorCount() === 0, d.styleErrorAt(0) || "");
}

console.log("--- the select opens, and it is the controller that says so ---");
{
  // This page used to draw a CLOSED trigger and stop — the header said the open
  // state needed the overlay layer. The overlay layer already existed and
  // `SelectCtl` already had `openList`, `activate` and `keyDown` measured
  // against Radix; what was missing was a demo that drew the state the
  // controller was keeping. Every assertion here goes through the hit test or
  // the key handler, never straight at the controller, because a control that
  // works in its API and not on the page is the failure this gallery keeps
  // finding.
  const d = fresh();
  const rect = (id) => { const n = one(d, id); return n && n.el; };
  const clickOn = (id) => {
    const e = rect(id);
    if (!e) return { hit: "(missing " + id + ")", handled: false };
    const hit = d.hitId(e.calculatedX + e.calculatedWidth / 2, e.calculatedY + e.calculatedHeight / 2);
    const handled = d.press(hit);
    d.displayListJson();
    return { hit, handled };
  };

  ok("it starts closed", d.visibility.open === false);
  ok("and shows the chosen label", (rect("pf-visibility").children[0].textContent || "") === "Team only",
    rect("pf-visibility").children[0].textContent);

  const t = clickOn("pf-visibility");
  ok("a click on the trigger lands on it", t.hit === "pf-visibility", t.hit);
  ok("and opens the list", d.visibility.open === true);

  const list = rect(d.visibility.contentTid());
  ok("the list is drawn", !!list);
  // BELOW THE TRIGGER, which is the whole reason it is an overlay sibling and
  // not a child: a listbox inside a combobox would be both wrong in the tree
  // and wrong on the screen.
  const trig = rect("pf-visibility");
  ok("below the trigger", list.calculatedY >= trig.calculatedY + trig.calculatedHeight - 1,
    `list.y=${list.calculatedY} trigger bottom=${trig.calculatedY + trig.calculatedHeight}`);
  ok("and starting at its left edge", Math.abs(list.calculatedX - trig.calculatedX) < 2,
    `list.x=${list.calculatedX} trigger.x=${trig.calculatedX}`);
  ok("with a row per item", find(d, "pf-option").length === 3, String(find(d, "pf-option").length));

  // The keyboard moves a CURSOR. Choosing is a separate act, and a list you can
  // arrow through must not change the value while you do it.
  const before = d.visibility.value;
  d.keyWith("ArrowDown", false, false);
  d.displayListJson();
  ok("an arrow moves the active row", d.visibility.activeValue !== "",
    JSON.stringify(d.visibility.activeValue));
  ok("without changing the value", d.visibility.value === before,
    `${before} -> ${d.visibility.value}`);
  ok("and the list stays open", d.visibility.open === true);

  d.keyWith("Escape", false, false);
  d.displayListJson();
  ok("Escape closes it", d.visibility.open === false);
  ok("and leaves the value alone", d.visibility.value === before, d.visibility.value);
}

console.log("--- choosing an option, by pointer ---");
{
  const d = fresh();
  const rect = (id) => { const n = one(d, id); return n && n.el; };
  const clickOn = (id) => {
    const e = rect(id);
    if (!e) return { hit: "(missing " + id + ")", handled: false };
    const hit = d.hitId(e.calculatedX + e.calculatedWidth / 2, e.calculatedY + e.calculatedHeight / 2);
    const handled = d.press(hit);
    d.displayListJson();
    return { hit, handled };
  };
  clickOn("pf-visibility");
  const nobody = d.visibility.itemTid("nobody");
  const c = clickOn(nobody);
  ok("the click reaches the option it aimed at", c.hit === nobody, c.hit);
  ok("choosing sets the value", d.visibility.value === "nobody", d.visibility.value);
  ok("and closes the list", d.visibility.open === false);
  ok("the trigger shows the new label",
    (rect("pf-visibility").children[0].textContent || "") === "Nobody",
    rect("pf-visibility").children[0].textContent);

  // What a reader is told about all of it.
  const ns = JSON.parse(d.a11yJson(1, "")).nodes;
  const trg = ns.find((n) => n.id === "pf-visibility");
  ok("the trigger is a combobox", trg && trg.role === "combobox", JSON.stringify(trg && trg.role));
  // `expanded` serialises as EVGA11yTri's number, not a string: 1 is
  // collapsed, 2 is expanded. Asserting the string "false" here passed
  // vacuously for exactly as long as it took to look.
  ok("and reports itself collapsed", trg && trg.expanded === 1, JSON.stringify(trg && trg.expanded));

  clickOn("pf-visibility");
  const ns2 = JSON.parse(d.a11yJson(2, "")).nodes;
  const trg2 = ns2.find((n) => n.id === "pf-visibility");
  ok("expanded once it is open", trg2 && trg2.expanded === 2, JSON.stringify(trg2 && trg2.expanded));
  ok("the surface is a listbox", ns2.some((n) => n.role === "listbox"),
    JSON.stringify(ns2.map((n) => n.role)));
  // `selected` is a boolean and is only PRESENT on the chosen row — an
  // unselected option carries no key at all, which is what the tree does for
  // every tri-state that is not set.
  const chosen = ns2.filter((n) => n.selected === true);
  ok("exactly one option is selected", chosen.length === 1, JSON.stringify(chosen.map((n) => n.name)));
  ok("and it is the chosen one", chosen[0] && chosen[0].name === "Nobody",
    JSON.stringify(chosen[0] && chosen[0].name));
  ok("no lint with it open", d.a11yProblems().length === 0, d.a11yProblems().join("; "));
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
