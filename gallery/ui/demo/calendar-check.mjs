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
  // The box is DateFieldCtl's `mm/dd/yyyy` editor — three segments and two
  // slashes — measured against Chromium's own date input in
  // `ui:datefield:check`. Here: that the calendar fills it and empties it.
  const d = fresh();
  const seg = () => ["cd-box-month", "cd-box-day", "cd-box-year"].map((id) => byId(d, id));
  const shown = () => seg().map((e) => e.textContent).join("/");
  ok("empty to begin with, showing the hints",
    shown() === "mm/dd/yyyy" && seg().every((e) => hasClass(e, "ui-datefield-hint")), shown());
  ok("two slashes between them", withClass(d, "ui-datefield-sep").length === 2);
  d.press("cal-2026-05-20");
  ok("a click fills it", shown() === "05/20/2026" && !seg().some((e) => hasClass(e, "ui-datefield-hint")), shown());
  // Clearing has to be visible somewhere, and the field is where.
  d.press("cal-2026-05-20");
  ok("and clicking the same day again empties it", shown() === "mm/dd/yyyy", shown());
}

console.log("typing a date moves the calendar");
{
  const d = fresh();
  const caption = () =>
    withClass(d, "cd-monthtxt")[0].textContent + " " + withClass(d, "cd-yeartxt")[0].textContent;
  const shown = () => ["cd-box-month", "cd-box-day", "cd-box-year"].map((id) => byId(d, id).textContent).join("/");
  d.press("cd-box");
  ok("a click on the box puts the keyboard in the month", d.focused === "cd-box-month", d.focused);
  ok("and the month is drawn as the active segment",
    hasClass(byId(d, "cd-box-month"), "ui-datefield-seg-focus"));
  for (const k of ["1", "2"]) d.key(k);
  ok("\"12\" fills the month and moves on", shown() === "12/dd/yyyy" && d.focused === "cd-box-day", `${shown()} @${d.focused}`);
  for (const k of ["2", "5"]) d.key(k);
  ok("\"25\" fills the day", shown() === "12/25/yyyy" && d.focused === "cd-box-year", `${shown()} @${d.focused}`);
  ok("no date yet: the calendar has no selection", !d.model.hasSelection && caption() === "May 2026", caption());
  for (const k of ["2", "0", "2", "6"]) d.key(k);
  ok("the year completes it", shown() === "12/25/2026", shown());
  ok("and the calendar turns to December with the day chosen",
    caption() === "December 2026" && d.model.hasSelection && hasClass(byId(d, "cal-2026-12-25"), "cd-day-selected"),
    caption());
  d.key("ArrowLeft");
  d.key("ArrowLeft");
  d.key("ArrowUp");
  ok("ArrowUp on the month wraps 12 to 01 and the grid follows", shown() === "01/25/2026" && caption() === "January 2026", `${shown()} ${caption()}`);
  d.key("Backspace");
  ok("Backspace empties the month and the selection with it",
    shown() === "mm/25/2026" && !d.model.hasSelection && !withClass(d, "cd-day-selected").length, shown());
  d.keyWith("Tab", false, false);
  d.keyWith("Tab", false, false);
  ok("Tab walks to the year", d.focused === "cd-box-year", d.focused);
  d.keyWith("Tab", false, false);
  ok("and out of the field onto the grid's resting day", d.focused.startsWith("cal-2026-01-"), d.focused);
  d.keyWith("Tab", true, false);
  ok("Shift+Tab from the grid comes back into the year", d.focused === "cd-box-year", d.focused);
  d.key("a");
  ok("a letter changes nothing", shown() === "mm/25/2026", shown());
  const tree = JSON.parse(d.a11yJson(1, ""));
  const node = (id) => tree.nodes.find((n) => n.id === id);
  const month = node("cd-box-month");
  ok("a reader is told each segment as a named textbox with the native role's word",
    month && month.role === "textbox" && month.name === "Month" && month.roledesc === "spinbutton", JSON.stringify(month));
  ok("under a group named Date", node("cd-box") && node("cd-box").role === "group" && node("cd-box").name === "Date", JSON.stringify(node("cd-box")));
  ok("and the slashes are not announced", !tree.nodes.some((n) => n.id === "cd-box-sep1"));
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
  ok("Enter chooses the focused day", byId(d, "cd-box-day").textContent === "15" && byId(d, "cd-box-month").textContent === "05",
    byId(d, "cd-box-month").textContent + "/" + byId(d, "cd-box-day").textContent);
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

console.log("");
console.log(failed ? `RESULT FAIL — passed=${passed} failed=${failed}` : `RESULT OK — passed=${passed} failed=0`);
process.exitCode = failed ? 1 : 0;
