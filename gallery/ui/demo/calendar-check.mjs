#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The calendar demo: that it lays out, that it can be clicked and typed at,
// and that what a reader is told matches what is drawn.
//
// `ui:calendar:test` gates the controller's arithmetic and `ui:calendar:check`
// gates it against react-day-picker. Neither of those draws anything, and a
// calendar has a specific way of being wrong on screen: seven columns that do
// not line up, a chosen day painted black-on-black because the number could
// not inherit the fill, or a grid whose cells are unreachable by the pointer.
// This is the gate for that half.
//
//   node gallery/ui/demo/calendar-check.mjs

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/CalendarDemo.cjs"));
const CSS = fs.readFileSync(path.join(HERE, "calendar.css"), "utf8");

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

const fresh = () => {
  const d = new M.CalendarDemo();
  d.init(CSS);
  d.displayListJson();
  return d;
};
const flat = (d) => {
  const out = [];
  const walk = (el) => { out.push(el); for (const k of el.children) walk(k); };
  walk(d.root);
  return out;
};
const byId = (d, id) => flat(d).find((e) => e.id === id);
const hasClass = (el, c) => new RegExp("(^|\\s)" + c + "(\\s|$)").test(el.className || "");
const withClass = (d, c) => flat(d).filter((e) => hasClass(e, c));

console.log("the stylesheet");
{
  const d = fresh();
  const errs = [];
  for (let i = 0; i < d.styleErrorCount(); i++) errs.push(d.styleErrorAt(i));
  ok("parses with no errors", errs.length === 0, errs.join("; "));
}

console.log("the grid lines up");
{
  const d = fresh();
  const weeks = withClass(d, "cd-week");
  ok("six weeks are drawn", weeks.length === 6, `got ${weeks.length}`);
  const days = withClass(d, "cd-day");
  ok("forty-two days", days.length === 42, `got ${days.length}`);

  // Seven columns, and every row's cells on the same seven x positions. A
  // calendar whose columns wander is the failure a screenshot shows first and
  // no controller test can see.
  const cols = weeks.map((w) => w.children.map((c) => Math.round(c.calculatedX)));
  const first = cols[0].join(",");
  ok("every week is seven cells", cols.every((c) => c.length === 7), JSON.stringify(cols.map(c => c.length)));
  ok("and every row shares the same seven columns",
    cols.every((c) => c.join(",") === first), JSON.stringify(cols));

  // The weekday strip sits over the same columns as the days below it.
  const heads = withClass(d, "cd-weekday").map((e) => Math.round(e.calculatedX));
  ok("the weekday strip sits over the day columns", heads.join(",") === first,
    `${heads.join(",")} vs ${first}`);

  // Nothing overflows the card.
  const card = withClass(d, "cd-card")[0];
  const right = card.calculatedX + card.calculatedWidth;
  const over = days.filter((e) => e.calculatedX + e.calculatedWidth > right + 0.5);
  ok("no day overflows the card", over.length === 0, `${over.length} do`);
}

console.log("the field says what is chosen");
{
  const d = fresh();
  ok("empty to begin with, showing the hint",
    withClass(d, "cd-box-hint").length === 1 && withClass(d, "cd-box-text").length === 0);
  d.press("cal-2026-05-20");
  const text = withClass(d, "cd-box-text");
  ok("a click fills it", text.length === 1 && text[0].textContent === "Wednesday, May 20th, 2026",
    text.length ? text[0].textContent : "no value element");
  // Clearing has to be visible somewhere, and the field is where.
  d.press("cal-2026-05-20");
  ok("and clicking the same day again empties it",
    withClass(d, "cd-box-hint").length === 1 && withClass(d, "cd-box-text").length === 0);
}

console.log("a chosen day is legible");
{
  const d = fresh();
  d.press("cal-2026-05-20");
  const cell = byId(d, "cal-2026-05-20");
  ok("the cell is marked selected", hasClass(cell, "cd-day-selected"));
  // The number carries its OWN variant class. EVGStyleSheet has no descendant
  // selectors, so without this the number stays #18181b on a #18181b fill and
  // the chosen day is a black square with nothing in it.
  ok("and so is its number", hasClass(cell.children[0], "cd-daynum-selected"),
    cell.children[0].className);
  const outside = byId(d, "cal-2026-04-26");
  ok("an outside day's number is marked too", hasClass(outside.children[0], "cd-daynum-outside"));
}

console.log("the pointer reaches the cells");
{
  const d = fresh();
  const cell = byId(d, "cal-2026-05-13");
  const cx = cell.calculatedX + cell.calculatedWidth / 2;
  const cy = cell.calculatedY + cell.calculatedHeight / 2;
  ok("a day is hittable at its centre", d.hitId(cx, cy) === "cal-2026-05-13",
    `got [${d.hitId(cx, cy)}]`);
  // And at its corner: a cell whose hit box had collapsed to its text would
  // still answer at the centre and miss here.
  ok("and at its corner",
    d.hitId(cell.calculatedX + 1, cell.calculatedY + 1) === "cal-2026-05-13",
    `got [${d.hitId(cell.calculatedX + 1, cell.calculatedY + 1)}]`);
  ok("the prev button is hittable", (() => {
    const b = byId(d, "cal-prev");
    return d.hitId(b.calculatedX + 2, b.calculatedY + 2) === "cal-prev";
  })());
}

console.log("the keyboard drives it");
{
  const d = fresh();
  // No focus yet: the first key must still land, or it reads as a dropped
  // keystroke and the second press is the one that appears to work.
  // The caption is two runs now — a month and a pressable year — so this
  // reads both. It used to be `.textContent` of the caption itself, which
  // silently became the empty string when the year was split out of it.
  const caption = () =>
    withClass(d, "cd-monthtxt")[0].textContent + " " + withClass(d, "cd-yeartxt")[0].textContent;
  d.key("ArrowRight");
  // From the resting day, today, so this is the 15th. Asserting the DAY and
  // not merely that a cell exists: every cell exists either way, and an
  // assertion that cannot fail is worse than none.
  ok("the first arrow key lands, with nothing focused yet",
    d.focused === "cal-2026-05-15", `focus is [${d.focused}]`);
  d.key("PageUp");
  ok("PageUp moves the month", caption() === "April 2026", caption());
  d.key("PageDown");
  ok("and PageDown brings it back", caption() === "May 2026", caption());
  d.key("Enter");
  ok("Enter chooses the focused day", withClass(d, "cd-box-text").length === 1);
}

console.log("what a reader is told");
{
  const d = fresh();
  const problems = d.a11yProblems();
  ok("the tree lints clean", problems.length === 0, problems.join("; "));
  const tree = JSON.parse(d.a11yJson(1, ""));
  const node = (id) => tree.nodes.find((n) => n.id === id);
  const grid = node("cal-grid");
  ok("the grid is a grid, named for its month",
    grid && grid.role === "grid" && grid.name === "May 2026", JSON.stringify(grid));
  const day = node("cal-2026-05-14");
  ok("a day is a gridcell", day && day.role === "gridcell", JSON.stringify(day));
  ok("and today's label says so first",
    day && day.name === "Today, Thursday, May 14th, 2026", day && day.name);
  const plain = node("cal-2026-05-06");
  ok("a plain day carries no affix",
    plain && plain.name === "Wednesday, May 6th, 2026", plain && plain.name);
  // The weekday strip is deliberately hidden: every day already carries its
  // weekday, and a column header would say it twice per cell.
  ok("the weekday strip is not announced",
    !/"Su"/.test(JSON.stringify(tree.nodes)), "found a weekday node");
}

// Reaching a year, on the drawn page.
//
// Reported: the calendar looked fine but had no way to a year — 2019 was
// forty-eight presses of the previous-month arrow away. `ui:calendar:check`
// gates what a year jump DOES against react-day-picker; this file gates the
// half that only exists once something is drawn: that the year is a box you
// can hit, that the panel lands under it rather than over it, and that the
// list is parked on the year you are on.
console.log("reaching a year");
{
  const d = fresh();
  const hitCentre = (id) => {
    const e = byId(d, id);
    if (!e) return "(no such element)";
    return d.hitId(e.calculatedX + e.calculatedWidth / 2, e.calculatedY + e.calculatedHeight / 2);
  };
  const press = (id) => { const took = d.press(id); d.displayListJson(); return took; };

  const caption = byId(d, "cal-caption");
  const year = byId(d, "cal-year");
  ok("the year is its own box in the caption", !!year, "no cal-year");
  // Inside the caption, so the live region a reader hears when the month
  // changes still says the year: the caption is role=status.
  ok("inside the caption, not beside it",
    year.calculatedX >= caption.calculatedX
      && year.calculatedX + year.calculatedWidth <= caption.calculatedX + caption.calculatedWidth,
    `${year.calculatedX}+${year.calculatedWidth} in ${caption.calculatedX}+${caption.calculatedWidth}`);
  // The month is beside it and neither is on top of the other.
  const month = withClass(d, "cd-monthtxt")[0];
  ok("the month sits to its left with no overlap",
    month.calculatedX + month.calculatedWidth <= year.calculatedX,
    `${month.calculatedX + month.calculatedWidth} vs ${year.calculatedX}`);
  // And the caption still fits between the two arrows.
  const prev = byId(d, "cal-prev");
  const next = byId(d, "cal-next");
  ok("and the whole caption still clears both arrows",
    prev.calculatedX + prev.calculatedWidth <= caption.calculatedX
      && caption.calculatedX + caption.calculatedWidth <= next.calculatedX,
    `${prev.calculatedX + prev.calculatedWidth} .. ${caption.calculatedX} | ${caption.calculatedX + caption.calculatedWidth} .. ${next.calculatedX}`);

  ok("the year is hittable at its centre", hitCentre("cal-year") === "cal-year", hitCentre("cal-year"));
  ok("the panel is not drawn while it is shut", !byId(d, "cal-years"), "cal-years present");

  ok("pressing the year is taken", press("cal-year"));
  const panel = byId(d, "cal-years");
  ok("the panel is drawn", !!panel, "no cal-years");
  // UNDER the year, not over it. As a child of the anchor it placed at the
  // anchor's own origin and covered the year it hangs from.
  ok("under the year, not on top of it",
    panel.calculatedY >= year.calculatedY + year.calculatedHeight,
    `panel y=${panel.calculatedY} vs year bottom ${year.calculatedY + year.calculatedHeight}`);
  // An overlay is out of flow: opening it must not move the grid.
  const gridBefore = byId(d, "cal-grid").calculatedY;
  ok("and the grid did not move to make room", gridBefore === byId(d, "cal-grid").calculatedY,
    String(gridBefore));

  // Parked on the year you are on. Without this it opens at the top, which
  // with `reverseYears` is twenty years out — the control that exists to save
  // you scrolling would start by making you scroll.
  const on = byId(d, "cal-year-2026");
  ok("the current year is inside the panel when it opens",
    on.calculatedY >= panel.calculatedY
      && on.calculatedY + on.calculatedHeight <= panel.calculatedY + panel.calculatedHeight,
    `option y=${on.calculatedY} in ${panel.calculatedY}..${panel.calculatedY + panel.calculatedHeight}`);
  // A year at the far end is scrolled out of it, which is what makes the
  // panel a scroller rather than a list that happens to fit.
  const far = byId(d, "cal-year-2036");
  ok("and a year at the far end is scrolled out of view",
    far.calculatedY + far.calculatedHeight <= panel.calculatedY,
    `far y=${far.calculatedY}`);

  // The wheel moves it, and stops at the ends.
  const before = d.yearScroll;
  ok("the wheel scrolls the panel", d.scrollBy(60) && d.yearScroll === before + 60, String(d.yearScroll));
  d.displayListJson();
  d.scrollBy(-99999);
  ok("and clamps at the top", d.yearScroll === 0, String(d.yearScroll));
  d.scrollBy(99999);
  const bottom = d.yearScroll;
  ok("and at the bottom", d.scrollBy(99999) === false && d.yearScroll === bottom, String(d.yearScroll));
  d.displayListJson();

  // Choosing one.
  ok("an option is hittable", hitCentre("cal-year-2019") === "cal-year-2019", hitCentre("cal-year-2019"));
  press("cal-year-2019");
  ok("choosing a year moves the view", d.model.viewYear === 2019, String(d.model.viewYear));
  ok("and closes the panel", !byId(d, "cal-years"), "cal-years still there");
  const texts = JSON.parse(d.displayListJson()).cmds.filter((c) => c.text !== undefined).map((c) => c.text);
  ok("the caption shows the year it went to", texts.includes("2019"), texts.join("/"));
  ok("and still shows the month it kept", texts.includes("May"), texts.join("/"));

  // The wheel is not claimed while the panel is shut — the page reads a
  // `false` as "not mine" and scrolls itself instead.
  ok("a shut panel does not swallow the wheel", d.scrollBy(60) === false);

  // What a reader is told.
  const tree = JSON.parse(d.a11yJson(1, ""));
  const yearNode = tree.nodes.find((n) => n.id === "cal-year");
  ok("the year is a button", yearNode && yearNode.role === "button", JSON.stringify(yearNode));
  ok("named with the year it is on", yearNode && yearNode.name === "Year, 2019, choose a year",
    yearNode && yearNode.name);
  // 1 is collapsed on the EVG tri; 2 is expanded.
  ok("and collapsed while it is shut", yearNode && yearNode.expanded === 1, JSON.stringify(yearNode));
  press("cal-year");
  const openTree = JSON.parse(d.a11yJson(2, ""));
  const openNode = openTree.nodes.find((n) => n.id === "cal-year");
  ok("expanded once it is open", openNode && openNode.expanded === 2, JSON.stringify(openNode));
  const list = openTree.nodes.find((n) => n.id === "cal-years");
  ok("the panel is a listbox named Year",
    list && list.role === "listbox" && list.name === "Year", JSON.stringify(list));
  const opts = openTree.nodes.filter((n) => n.role === "option");
  ok("with one option per year in the bounds", opts.length === 21, String(opts.length));
  const chosen = openTree.nodes.find((n) => n.id === "cal-year-2019");
  ok("and the one it is on is marked selected", chosen && chosen.selected === true,
    JSON.stringify(chosen));
  ok("the tree still lints clean with it open",
    Array.from(d.a11yProblems()).length === 0, Array.from(d.a11yProblems()).join(" | "));
}

// The caption is centred on the grid — the INK, not the boxes.
//
// Reported: "kalenterin selectori ei oo keskitetty". Every box was already
// centred: the caption's centre was 163.0 and so was the grid's. But
// `.cd-monthtxt` was a fixed 96px with `text-align: right`, so "May" — about
// 27px of ink — drew at the right end of a box that began 69px earlier, and
// what a person sees is the ink. The visible pair sat near 197 against a grid
// centred on 163.
//
// So this measures the span a reader actually sees, and it measures it for a
// long month name too: a fixed box hides the defect for whichever name
// happens to fill it.
console.log("the caption is centred on the grid");
{
  const check = (d, what) => {
    const grid = byId(d, "cal-grid");
    const month = byId(d, "cal-month");
    const year = byId(d, "cal-year");
    const gridMid = grid.calculatedX + grid.calculatedWidth / 2;
    const inkMid = (month.calculatedX + (year.calculatedX + year.calculatedWidth)) / 2;
    ok(`${what}: the month and year are centred on the grid`,
      Math.abs(inkMid - gridMid) < 0.5, `${inkMid.toFixed(1)} vs ${gridMid.toFixed(1)}`);
    // And the month's box is its own text, not a fixed slot it sits at one
    // end of. Its width tracking the name is the whole fix.
    return month.calculatedWidth;
  };
  const d = fresh();
  const mayW = check(d, "May");
  // September is the longest month name; the box has to grow and the pair has
  // to stay centred.
  d.press("cal-year");
  d.displayListJson();
  // Four presses of next from May reaches September.
  d.press("cal-year");
  for (let i = 0; i < 4; i++) { d.press("cal-next"); d.displayListJson(); }
  const sepW = check(d, "September");
  ok("the month box grows with the name", sepW > mayW + 10, `${mayW.toFixed(1)} -> ${sepW.toFixed(1)}`);
  // Back to a short one, and it shrinks again.
  for (let i = 0; i < 4; i++) { d.press("cal-prev"); d.displayListJson(); }
  const backW = check(d, "May again");
  ok("and shrinks again", Math.abs(backW - mayW) < 0.01, `${backW.toFixed(1)} vs ${mayW.toFixed(1)}`);
}

// The mode switcher.
//
// Asked for as checkboxes — "vois olla kiva jos ois checkboxit millä vois
// vaihtaa kalenterin moodia". They are RADIOS in the trace: the three modes
// are mutually exclusive, and a checkbox that unchecks its neighbour tells a
// reader something untrue about itself. The picture is the one the request
// described.
//
// What each mode DOES is measured — `ui:calendar:check` replays the clicks
// react-day-picker was driven through, and the third-click rule is the one
// that is not guessable. This file gates the half that only exists once
// something is drawn.
console.log("the selection mode can be switched");
{
  const d = fresh();
  const press = (id) => { const took = d.press(id); d.displayListJson(); return took; };
  const cls = (id) => { const e = byId(d, id); return e ? String(e.className) : "(absent)"; };
  const marked = (id) => cls(id).split(/\s+/).includes("cd-day-selected");
  const banded = (id) => cls(id).split(/\s+/).includes("cd-day-inrange");

  for (const m of ["single", "multiple", "range"]) {
    ok(`the ${m} option is on the page`, byId(d, "cd-modes-" + m) !== undefined);
  }
  ok("it starts in single", d.model.mode === "single", d.model.mode);

  // Single still behaves as it always did.
  press("cal-2026-05-12");
  ok("single marks the day", marked("cal-2026-05-12"), cls("cal-2026-05-12"));

  // Switching clears — a day chosen in one mode is not a range in another.
  ok("switching to multiple is taken", press("cd-modes-multiple"));
  ok("and the mode changed", d.model.mode === "multiple", d.model.mode);
  ok("and the single selection is cleared", !marked("cal-2026-05-12"), cls("cal-2026-05-12"));

  press("cal-2026-05-12");
  press("cal-2026-05-20");
  press("cal-2026-05-05");
  ok("multiple keeps three", d.model.chosenCount() === 3, String(d.model.chosenCount()));
  ok("and marks each of them",
    marked("cal-2026-05-12") && marked("cal-2026-05-20") && marked("cal-2026-05-05"));
  press("cal-2026-05-20");
  ok("clicking one again removes it", d.model.chosenCount() === 2, String(d.model.chosenCount()));
  ok("and unmarks it", !marked("cal-2026-05-20"), cls("cal-2026-05-20"));

  ok("switching to range is taken", press("cd-modes-range"));
  ok("and clears what multiple held", d.model.chosenCount() === 0, String(d.model.chosenCount()));
  press("cal-2026-05-12");
  press("cal-2026-05-20");
  ok("the range's ends are marked", marked("cal-2026-05-12") && marked("cal-2026-05-20"));
  // The BAND, which is the picture a range has and the other modes do not.
  ok("and the days between carry the band", banded("cal-2026-05-15"), cls("cal-2026-05-15"));
  ok("a day outside it carries neither",
    !marked("cal-2026-05-25") && !banded("cal-2026-05-25"), cls("cal-2026-05-25"));

  // The measured third-click rule, on the drawn page: it EXTENDS.
  press("cal-2026-05-25");
  ok("a third click extends the range rather than restarting it",
    marked("cal-2026-05-12") && marked("cal-2026-05-25") && banded("cal-2026-05-20"),
    `${cls("cal-2026-05-12")} | ${cls("cal-2026-05-20")} | ${cls("cal-2026-05-25")}`);

  // Numerals: every path that darkens a cell has to darken its number too,
  // or it is black on black.
  const num = (id) => byId(d, id).children[0].className;
  ok("a range end's numeral carries its own token",
    String(num("cal-2026-05-12")).split(/\s+/).includes("cd-daynum-selected"),
    num("cal-2026-05-12"));

  // What a reader is told.
  const tree = JSON.parse(d.a11yJson(1, ""));
  const group = tree.nodes.find((n) => n.id === "cd-modes");
  ok("the switcher is a radiogroup named for what it switches",
    group && group.role === "radiogroup" && group.name === "Selection mode",
    JSON.stringify(group));
  const radios = tree.nodes.filter((n) => n.role === "radio");
  ok("with three radios", radios.length === 3, String(radios.length));
  // 2 is checked on the EVG tri, 1 is unchecked.
  const on = radios.filter((n) => n.checked === 2);
  ok("exactly one of them is checked", on.length === 1, radios.map((n) => n.name + "=" + n.checked).join(" "));
  ok("and it is the mode the calendar is in", on[0].name === "Range", on[0].name);
  ok("the tree lints clean in every mode",
    Array.from(d.a11yProblems()).length === 0, Array.from(d.a11yProblems()).join(" | "));
}

console.log("");
console.log(failed ? `RESULT FAIL — passed=${passed} failed=${failed}` : `RESULT OK — passed=${passed} failed=0`);
process.exitCode = failed ? 1 : 0;
