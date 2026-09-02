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
  const caption = () => withClass(d, "cd-caption")[0].textContent;
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

console.log("");
console.log(failed ? `RESULT FAIL — passed=${passed} failed=${failed}` : `RESULT OK — passed=${passed} failed=0`);
process.exitCode = failed ? 1 : 0;
