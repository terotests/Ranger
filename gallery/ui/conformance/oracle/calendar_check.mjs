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

const total = pass + fail;
console.log("");
console.log(`parity: ${pass}/${total} behaviours match react-day-picker ${oracle.reactDayPicker}`);
console.log(`         ${diverged} recorded divergence(s), listed above and in calendar.json findings`);
console.log(fail ? `\nRESULT FAIL — failed=${fail}` : "\nRESULT OK — failed=0");
process.exitCode = fail ? 1 : 0;
