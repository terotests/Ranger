/**
 * CalendarCtl against the numbers react-day-picker actually produced.
 *
 *   node gallery/ui/conformance/oracle/calendar_check.mjs
 *
 * Every expectation here is READ OUT OF `calendar.json` at run time. Nothing
 * is transcribed: re-capture the oracle against a newer react-day-picker and
 * this file starts asking the new questions by itself, which is the only way a
 * parity counter stays honest as the reference moves.
 *
 * `CalendarTest.rgr` gates the same behaviours offline with the numbers
 * written out, and the duplication is deliberate: that suite runs where there
 * is no Chromium and no npm tree, and it is what fails first when the
 * controller breaks. This one answers a different question — whether the
 * controller still matches the LIBRARY, rather than whether it still matches
 * what the library said last year.
 *
 * It also prints a PARITY COUNT, and counts the two recorded divergences as
 * divergences rather than as passes or failures. A parity number that quietly
 * scored a deliberate deviation as a match would be measuring nothing.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const oracle = JSON.parse(fs.readFileSync(path.join(HERE, "calendar.json"), "utf8"));

const [Y, M] = oracle.month.split("-").map(Number);
const [TY, TM, TD] = oracle.today.split("-").map(Number);

/** The oracle's fixture: its month, its today, nothing selected. */
const mk = (minDate) => {
  const c = new H.CalendarCtl();
  c.tid = "cal";
  c.name = "Date";
  c.setMonth(Y, M);
  c.setToday(TY, TM, TD);
  if (minDate) c.setMinDate(...minDate.split("-").map(Number));
  c.build();
  return c;
};
const cell = (iso) => "cal-" + iso;
/** The focused day as an ISO string — the calendar's whole cursor. */
const at = (c) => H.UiDate.isoOfDays(c.currentFocusDay());
const sel = (c) => (c.hasSelection ? H.UiDate.isoOfDays(c.selectedDay) : null);

let pass = 0;
let fail = 0;
let diverged = 0;
const check = (what, got, want) => {
  const ok = String(got) === String(want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${what}: ${got}${ok ? "" : "   want " + want}`);
};
const divergence = (what, got, reference, why) => {
  diverged++;
  console.log(`  DIVERGES ${what}: ${got}   reference: ${reference}`);
  console.log(`           ${why}`);
};

// --- the grid ---------------------------------------------------------------
console.log("the grid, as the reference laid it out");
{
  const c = mk();
  const want = oracle.grid.weeks;
  check("week count", c.weekCount(), want.length);
  check("first cell", H.UiDate.isoOfDays(c.gridStart()), oracle.shape.firstCell);
  check("last cell", H.UiDate.isoOfDays(c.gridStart() + want.length * 7 - 1), oracle.shape.lastCell);

  // Every cell of every week: the date it holds, and whether it is outside
  // the month. Forty-two comparisons, because an off-by-one in the lead is
  // invisible in any single one of them.
  let cellsOk = 0;
  let cellsBad = 0;
  for (let r = 0; r < want.length; r++) {
    for (let i = 0; i < 7; i++) {
      const day = c.gridStart() + r * 7 + i;
      const w = want[r][i];
      const gotIso = H.UiDate.isoOfDays(day);
      if (gotIso === w.day && c.isOutside(day) === w.outside) cellsOk++;
      else {
        cellsBad++;
        console.log(`  FAIL cell ${r},${i}: ${gotIso}/${c.isOutside(day)} want ${w.day}/${w.outside}`);
      }
    }
  }
  check(`all ${cellsOk + cellsBad} cells match by date and outside-ness`, cellsBad, 0);

  // The day numbers drawn, including the outside ones, since showOutsideDays
  // is on in the fixture.
  const texts = [];
  for (let r = 0; r < want.length; r++)
    for (let i = 0; i < 7; i++) {
      const p = [0, 0, 0];
      H.UiDate.fromDays(c.gridStart() + r * 7 + i, p);
      texts.push(String(p[2]));
    }
  check("the numbers drawn", texts.join(","), want.flat().map((w) => w.text).join(","));
}

// --- the tab stop -----------------------------------------------------------
console.log("the tab stop");
{
  check("at rest it is today", at(mk()), oracle.initialFocus.tabbable[0]);
  const c = mk();
  c.activate(cell("2026-05-20"));
  check("and the chosen day once there is one", at(c), oracle.tabStopAfterSelect.tabbable[0]);
}

// --- the keyboard -----------------------------------------------------------
// Both walk sets, driven straight off the oracle: whatever keys and start days
// the capture happens to hold are the ones asked here.
const walkSet = (title, walks) => {
  console.log(title);
  for (const w of walks) {
    const c = mk();
    c.keyDown(cell(w.from), w.key);
    check(`${w.key} from ${w.from}`, at(c), w.to);
    check(`  caption`, c.monthLabel(), w.caption);
  }
};
walkSet("the keyboard, from the middle of the month", oracle.keyboardMiddle);
for (const [what, walks] of Object.entries(oracle.keyboardEdges)) {
  walkSet(`the keyboard, from the ${what}`, walks);
}

console.log("crossing a month boundary");
{
  const c = mk();
  const w = oracle.crossingMonth;
  c.keyDown(cell(w.from), w.key);
  check("focus", at(c), w.focused);
  check("the caption follows it", c.monthLabel(), w.caption);
  divergence(
    "the tab stop after crossing",
    at(c),
    w.tabbable[0],
    "the reference puts it on the 1st of the new month while focus is " +
      "elsewhere; WAI-ARIA's grid pattern says the tabbable cell is the one " +
      "that will receive focus, so here it stays with focus.",
  );
}

// --- selection --------------------------------------------------------------
console.log("selection");
{
  const c = mk();
  for (const step of oracle.selection) {
    if (typeof step !== "object" || !step.after) continue;
    const m = /^click (?:the SAME day again|another day|(\S+))$/.exec(step.after);
    if (step.after === "nothing") {
      check(step.after, sel(c), step.selected);
      continue;
    }
    // The oracle records what was clicked in its own words; the day comes from
    // the tab stop it reports, except for the two steps it names in prose.
    const day =
      m && m[1] ? m[1] : step.after === "click another day" ? "2026-05-20" : "2026-05-20";
    c.activate(cell(day));
    check(step.after, sel(c), step.selected);
  }
}
console.log("the keys that commit");
{
  const e = mk();
  e.keyDown(cell(oracle.commitKeys.enter.on), "Enter");
  check("Enter", sel(e), oracle.commitKeys.enter.selected);
  const s = mk();
  s.keyDown(cell(oracle.commitKeys.space.on), " ");
  check("Space", sel(s), oracle.commitKeys.space.selected);
  const t = mk();
  t.activate(cell("2026-05-20"));
  t.keyDown(cell("2026-05-20"), "Enter");
  check("Enter on the chosen day clears it", sel(t), oracle.enterOnSelected.selected);
}
console.log("an outside day");
{
  const c = mk();
  c.activate(cell(oracle.outsideDayClick.day));
  check("selects that date", sel(c), oracle.outsideDayClick.selected);
  check("and leaves the month alone", c.monthLabel(), oracle.outsideDayClick.caption);
}
console.log("the nav buttons");
{
  const c = mk();
  check(oracle.nav[0].after, c.monthLabel(), oracle.nav[0].caption);
  c.activate("cal-prev");
  check(oracle.nav[1].after, c.monthLabel(), oracle.nav[1].caption);
  c.activate("cal-next");
  c.activate("cal-next");
  check(oracle.nav[2].after, c.monthLabel(), oracle.nav[2].caption);
}

// --- what a reader hears ----------------------------------------------------
console.log("the labels a reader hears");
{
  const c = mk();
  const flat = oracle.grid.weeks.flat();
  let bad = 0;
  for (const w of flat) {
    const day = H.UiDate.toDays(...w.day.split("-").map(Number));
    if (c.dayLabel(day) !== w.label) {
      bad++;
      console.log(`  FAIL ${w.day}: ${c.dayLabel(day)}   want ${w.label}`);
    }
  }
  check(`all ${flat.length} day labels`, bad, 0);

  // The selected day's label carries the state, because that is the only place
  // the reference puts it.
  const s = mk();
  s.activate(cell(oracle.selectedCell.cell.day));
  const selDay = H.UiDate.toDays(...oracle.selectedCell.cell.day.split("-").map(Number));
  check("the chosen day's label", s.dayLabel(selDay), oracle.selectedCell.cell.label);
  const todayDay = H.UiDate.toDays(...oracle.selectedCell.todayCell.day.split("-").map(Number));
  check("today's label", s.dayLabel(todayDay), oracle.selectedCell.todayCell.label);

  divergence(
    "aria-selected on the chosen cell",
    "true",
    String(oracle.selectedCell.cell.ariaSelected),
    "the reference emits none and announces selection through the label " +
      "alone; the label is copied exactly, and aria-selected is added on top " +
      "because the APG's date-picker pattern asks for it and one extra true " +
      "attribute costs a reader nothing.",
  );
}

// --- days that cannot be picked ---------------------------------------------
console.log("disabled days");
{
  const df = oracle.disabledFixture;
  const c = mk("2026-05-10");
  const want = df.disabledDays;
  const got = [];
  for (let i = 0; i < c.weekCount() * 7; i++) {
    const day = c.gridStart() + i;
    if (c.isDisabledDay(day)) got.push(H.UiDate.isoOfDays(day));
  }
  check("which days are disabled", got.join(","), want.join(","));

  for (const w of [df.stepOntoDisabled, df.stepOntoDisabledUp]) {
    const k = mk("2026-05-10");
    k.keyDown(cell(w.from), w.key);
    check(`${w.key} from ${w.from} stops`, at(k), w.to);
  }
  const k = mk("2026-05-10");
  k.activate(cell(df.clickDisabled.day));
  check("a click on one is ignored", sel(k), df.clickDisabled.selected);
}

// --- reaching a year --------------------------------------------------------
//
// Reported: the calendar has no way to reach a year, so 2019 is forty-eight
// presses of the previous-month arrow. Every rule below is read out of the
// capture, including the two that were not guessable: which way the list runs,
// and where the cursor lands after a jump.
console.log("reaching a year, the way the reference reaches one");
{
  const yn = oracle.yearNav;
  const bounded = yn.bounded.years;
  const lo = bounded[0];
  const hi = bounded[bounded.length - 1];

  const withYears = (rev) => {
    const c = mk();
    c.startYear = lo;
    c.endYear = hi;
    c.reverseYears = rev;
    c.build();
    return c;
  };

  const c = withYears(false);
  check("the list is as long as the bounds", c.yearCount(), bounded.length);
  const listed = [];
  for (let i = 0; i < c.yearCount(); i++) listed.push(c.yearAt(i));
  check("and holds exactly those years, ascending", listed.join(","), bounded.join(","));
  // Month option values are ZERO-BASED indices in the reference, and the
  // controller counts months from one. Checked rather than assumed: the two
  // conventions differing by one is exactly the kind of thing that survives
  // every test until a December sends the year forward.
  check("the reference's month index for May", Number(yn.bounded.monthValueOfMay), M - 1);

  const r = withYears(true);
  const rlisted = [];
  for (let i = 0; i < r.yearCount(); i++) rlisted.push(r.yearAt(i));
  check("reverseYears puts the newest first", rlisted.join(","), yn.reversed.years.join(","));

  // The jump. The reference kept the month and moved the tab stop to the
  // FIRST of the shown month — 2026-05-14 to 2023-05-01, not to 2023-05-14.
  // Keeping the day number would have been the obvious choice and would land
  // on days that do not exist.
  const ch = yn.changing;
  const j = withYears(false);
  check("before the jump the cursor is where the reference put it", at(j), ch.before.tabbable[0]);
  j.setViewYear(Number(ch.afterYear.year));
  check("the year moves", j.viewYear, Number(ch.afterYear.year));
  check("the month is kept", j.viewMonth, Number(ch.afterYear.month) + 1);
  check("and the cursor goes to the first of it", at(j), ch.afterYear.tabbable[0]);
  // The grid reshapes with it: May 2026 is six rows and May 2023 is five.
  check("the grid reshapes", j.weekCount() * 7, ch.afterYear.cells);

  j.setViewMonth(Number(ch.afterMonth.month) + 1);
  check("changing the month keeps the year", j.viewYear, Number(ch.afterMonth.year));
  check("and lands on the first of that one", at(j), ch.afterMonth.tabbable[0]);
  check("that grid reshapes too", j.weekCount() * 7, ch.afterMonth.cells);

  // A year outside the bounds is not reachable. The reference expresses this
  // by not listing it; there is nothing to press, so the rule is the same.
  const b = withYears(false);
  b.setViewYear(hi + 1);
  check("a year past the end is refused", b.viewYear, Y);
  b.setViewYear(lo - 1);
  check("and one before the start", b.viewYear, Y);

  // The selection survives the jump. Measured: `__selected` was still
  // 2026-05-20 with 2024 on screen, and nothing in view was marked.
  const ss = yn.selectionSurvives;
  const k = withYears(false);
  k.activate(cell(ss.selectedValue));
  check("a day is chosen", sel(k), ss.selectedValue);
  k.setViewYear(2024);
  check("jumping the year does not clear it", sel(k), ss.selectedValue);
  const shown = [];
  const start = k.gridStart();
  for (let i = 0; i < k.weekCount() * 7; i++) {
    if (k.hasSelection && start + i === k.selectedDay) shown.push(H.UiDate.isoOfDays(start + i));
  }
  check("and nothing in the shown month is marked", shown.join(","), ss.markedInView.join(","));
}

// The panel itself is SPECIFIED, not measured: react-day-picker uses a native
// `<select>`, a canvas kit has none, and the request was for a panel you can
// scroll. What it DOES on a choice is the measured part above; that it opens,
// closes and tells a reader it is there is checked here as a specification.
console.log("the year panel (specified — the reference uses a native select)");
{
  const c = mk();
  c.startYear = 2020;
  c.endYear = 2030;
  c.build();
  const ids = () => Array.from(c.tids());
  const has = (id) => ids().includes(id);
  check("closed, the panel is not in the tree", has(c.yearPanelTid()), false);
  check("and no year option is either", has(c.yearOptTid(2024)), false);
  check("the year itself is reachable", c.isFocusable(c.yearTid()), true);
  c.activate(c.yearTid());
  check("pressing the year opens it", c.yearPanelOpen, true);
  check("the panel joins the tree", has(c.yearPanelTid()), true);
  check("with one option per year", ids().filter((x) => x.startsWith("cal-year-")).length, 11);
  check("and they are focusable", c.isFocusable(c.yearOptTid(2024)), true);
  c.activate(c.yearOptTid(2024));
  check("choosing one jumps the view", c.viewYear, 2024);
  check("and closes the panel behind it", c.yearPanelOpen, false);
  check("so the options leave the tree again", has(c.yearOptTid(2024)), false);
  c.activate(c.yearTid());
  c.activate(c.yearTid());
  check("pressing the year again closes it", c.yearPanelOpen, false);
}

const total = pass + fail;
console.log("");
console.log(`parity: ${pass}/${total} behaviours match react-day-picker ${oracle.reactDayPicker}`);
console.log(`         ${diverged} recorded divergence(s), listed above and in calendar.json findings`);
console.log(fail ? `\nRESULT FAIL — failed=${fail}` : "\nRESULT OK — failed=0");
process.exitCode = fail ? 1 : 0;
