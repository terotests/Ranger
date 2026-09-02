/**
 * react-day-picker, asked what a calendar actually does.
 *
 *   node gallery/ui/conformance/oracle/calendar_oracle.mjs
 *
 * Writes `calendar.json` beside this file. `CalendarCtl.rgr` is built against
 * these numbers; `calendar_check.mjs` gates them. Nothing reads the file at
 * run time.
 *
 * WHY react-day-picker. Radix has no calendar. shadcn's Calendar is
 * `react-day-picker` with a class map over it, so when someone says "a
 * calendar like Radix's" the behaviour they are pointing at is this library's.
 * It is the oracle the way dnd-kit is the sortable's and TanStack is the
 * table's.
 *
 * WHAT IT IS AN ORACLE FOR, AND WHAT IT IS NOT. react-day-picker owns its own
 * accessibility — the roles, the labels, the roving tabindex, the live region
 * on the caption — so unlike TanStack this capture really does answer the ARIA
 * question and not just the state question. What it does NOT answer is
 * appearance: every class here is a hook shadcn replaces wholesale, so no
 * pixel of the reference's own styling is captured or copied. Geometry for the
 * Ranger side comes from the shadcn class map read as a spec, not from here.
 *
 * IT DRIVES THE REFERENCE COMPONENT. Every answer below is read off a real
 * DayPicker in a real browser, by pressing the keys and clicking the cells a
 * person would. Nothing recomputes a date rule in JavaScript and calls that an
 * oracle — the month arithmetic is exactly the part where a re-implementation
 * and a reimplementation-of-the-reimplementation drift.
 *
 * The five things it captures:
 *
 *   1. The GRID. Six rows for May 2026, which days are outside the month, and
 *      what the caption, the column headers and the cell labels say.
 *   2. The ROVING TABINDEX. Exactly one day is tabbable; which one, before
 *      anything is selected and after.
 *   3. The KEYBOARD. Eight keys from the middle of the month, and the same
 *      eight from the edges where they cross into another month — including
 *      whether crossing SCROLLS the displayed month.
 *   4. SELECTION. Click, Enter and Space; whether clicking the selected day
 *      again clears it; what an outside day does.
 *   5. DISABLED DAYS. Whether an arrow key steps onto one and whether a click
 *      on one is ignored.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { assertDomInstalled, findChromium, requireDom } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOM_DIR = path.join(HERE, "..", "dom");
const CAL_DIR = path.join(DOM_DIR, "calendar");

/** The day the keyboard walks start from: a Wednesday in the middle. */
const MID = "2026-05-13";

/**
 * Read the whole rendered grid. Structure only — no colours, no sizes: the
 * reference's appearance is not what is being captured.
 */
const readGrid = (page) =>
  page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const root = q(".rdp-root");
    const cell = (td) => {
      const b = td.querySelector("button");
      const out = {
        day: td.getAttribute("data-day"),
        text: (b || td).textContent.trim(),
        outside: td.hasAttribute("data-outside"),
        selected: td.hasAttribute("data-selected"),
        today: td.hasAttribute("data-today"),
        disabled: td.hasAttribute("data-disabled"),
        role: td.getAttribute("role"),
      };
      if (b) {
        out.tabindex = b.getAttribute("tabindex");
        out.label = b.getAttribute("aria-label");
        out.ariaSelected = b.getAttribute("aria-selected");
        out.ariaDisabled = b.getAttribute("aria-disabled");
        out.buttonDisabled = b.disabled;
      }
      return out;
    };
    return {
      caption: q(".rdp-caption_label").textContent.trim(),
      captionRole: q(".rdp-caption_label").getAttribute("role"),
      captionLive: q(".rdp-caption_label").getAttribute("aria-live"),
      navLabel: q(".rdp-nav").getAttribute("aria-label"),
      prevLabel: q(".rdp-button_previous").getAttribute("aria-label"),
      nextLabel: q(".rdp-button_next").getAttribute("aria-label"),
      prevDisabled: q(".rdp-button_previous").disabled,
      nextDisabled: q(".rdp-button_next").disabled,
      gridRole: q(".rdp-month_grid").getAttribute("role"),
      gridLabel: q(".rdp-month_grid").getAttribute("aria-label"),
      multiselectable: q(".rdp-month_grid").getAttribute("aria-multiselectable"),
      headRowHidden: q("thead").getAttribute("aria-hidden"),
      weekdays: [...document.querySelectorAll(".rdp-weekday")].map((th) => ({
        text: th.textContent.trim(),
        label: th.getAttribute("aria-label"),
        scope: th.getAttribute("scope"),
      })),
      weeks: [...document.querySelectorAll(".rdp-week")].map((tr) =>
        [...tr.querySelectorAll("td")].map(cell),
      ),
      mode: root.getAttribute("data-mode"),
      lang: root.getAttribute("lang"),
    };
  });

/** Which day the roving tabindex currently sits on, and what has focus. */
const readFocus = (page) =>
  page.evaluate(() => {
    const tabbable = [...document.querySelectorAll(".rdp-day button")].filter(
      (b) => b.getAttribute("tabindex") === "0",
    );
    const active = document.activeElement;
    const cellOf = (el) => (el && el.closest ? el.closest("[data-day]") : null);
    return {
      tabbable: tabbable.map((b) => cellOf(b).getAttribute("data-day")),
      focused: cellOf(active) ? cellOf(active).getAttribute("data-day") : null,
      focusedTag: active ? active.className || active.tagName : null,
      caption: document.querySelector(".rdp-caption_label").textContent.trim(),
      selected: window.__selected ? new Date(window.__selected).toISOString().slice(0, 10) : null,
    };
  });

/**
 * Back to a freshly mounted May 2026 with nothing selected.
 *
 * Every measurement below starts here, and it has to: PageUp and PageDown move
 * the DISPLAYED month, so a walk that ran before this one can leave the grid
 * showing April, and the next walk would then be asking April what May does.
 * The options installed with addInitScript survive a reload, so the fixture
 * does not have to be re-installed.
 */
const reset = async (page) => {
  await page.reload();
  await page.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
  await page.waitForTimeout(120);
};

/** Put keyboard focus on one day without clicking it — a click also selects. */
const focusDay = async (page, day) => {
  await page.evaluate((d) => {
    document.querySelector(`[data-day="${d}"] button`).focus();
  }, day);
  await page.waitForTimeout(30);
};

const KEYS = [
  "ArrowRight",
  "ArrowLeft",
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
  "PageUp",
  "PageDown",
];

/** Press one key from one day and report where focus ended up. */
async function walk(page, from, key) {
  await reset(page);
  await focusDay(page, from);
  await page.keyboard.press(key);
  await page.waitForTimeout(80);
  const f = await readFocus(page);
  return { from, key, to: f.focused, caption: f.caption, tabbable: f.tabbable };
}

async function capture(page) {
  const out = {};

  // --- 1. the grid as rendered
  out.grid = await readGrid(page);
  out.shape = {
    weeks: out.grid.weeks.length,
    cellsPerWeek: out.grid.weeks[0].length,
    leadingOutside: out.grid.weeks[0].filter((c) => c.outside).length,
    trailingOutside: out.grid.weeks[out.grid.weeks.length - 1].filter((c) => c.outside).length,
    firstCell: out.grid.weeks[0][0].day,
    lastCell: out.grid.weeks[out.grid.weeks.length - 1][6].day,
    $comment:
      "Six rows because May 2026 starts on a Friday and ends on a Sunday. A " +
      "calendar that always draws six rows and one that draws as many as the " +
      "month needs disagree on every other month, so the row count is data.",
  };

  // --- 2. the roving tabindex, before anything is chosen
  out.initialFocus = {
    ...(await readFocus(page)),
    $comment:
      "Exactly one day is tabbable, and with nothing selected it is TODAY — " +
      "not the first of the month and not the first cell of the grid. Guessed " +
      "wrong here before measuring: the first-of-month reading is what most " +
      "hand-written calendars do, and it is not what the reference does.",
  };

  // --- 3. the keyboard, from the middle and from every edge
  const walks = [];
  for (const key of KEYS) walks.push(await walk(page, MID, key));
  out.keyboardMiddle = walks;

  // The edges: the four cells where a step leaves the month.
  const edges = {
    "first of month (a Friday)": "2026-05-01",
    "last of month (a Sunday)": "2026-05-31",
    "first Sunday": "2026-05-03",
    "a Saturday": "2026-05-09",
  };
  out.keyboardEdges = {};
  for (const [what, day] of Object.entries(edges)) {
    out.keyboardEdges[what] = [];
    for (const key of KEYS) out.keyboardEdges[what].push(await walk(page, day, key));
  }

  // Does stepping out of the month scroll the view? Read after a walk that
  // definitely leaves May.
  await reset(page);
  await focusDay(page, "2026-05-01");
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(120);
  const crossed = await readFocus(page);
  out.crossingMonth = {
    from: "2026-05-01",
    key: "ArrowLeft",
    focused: crossed.focused,
    caption: crossed.caption,
    tabbable: crossed.tabbable,
    $comment:
      "Arrowing off the start of the month moves the displayed month with the " +
      "focus. The grid is not a fixed window you page separately. Note the " +
      "tab stop lands on the 1st of the NEW month rather than on the focused " +
      "day — see `findings.rovingTabindex`, which is not a rule to copy.",
  };
  await reset(page);

  // --- 4. selection
  const clickDay = async (day) => {
    await page.locator(`[data-day="${day}"] button`).click();
    await page.waitForTimeout(80);
  };
  const sel = [];
  sel.push({ after: "nothing", ...(await readFocus(page)) });
  await clickDay(MID);
  sel.push({ after: "click " + MID, ...(await readFocus(page)) });
  await clickDay("2026-05-20");
  sel.push({ after: "click another day", ...(await readFocus(page)) });
  await clickDay("2026-05-20");
  sel.push({ after: "click the SAME day again", ...(await readFocus(page)) });
  out.selection = sel.map((r) => ({
    after: r.after,
    selected: r.selected,
    tabbable: r.tabbable,
    focused: r.focused,
  }));
  out.selection.$comment =
    "mode=single without `required` TOGGLES: clicking the selected day clears " +
    "the selection. A calendar that cannot be un-set is a different component.";

  // Selecting moves the tab stop onto the selected day.
  await reset(page);
  await clickDay("2026-05-20");
  out.tabStopAfterSelect = {
    ...(await readFocus(page)),
    $comment: "Once a day is selected it becomes the single tab stop.",
  };

  // Keys that commit. Focus a day, press, read.
  await reset(page);
  await focusDay(page, "2026-05-07");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(80);
  const byEnter = await readFocus(page);
  // Space is measured on its own, not on top of Enter's selection: in a
  // toggling single-select mode, "what Space does" and "what Space does when
  // something else is already chosen" are two different questions.
  await reset(page);
  await focusDay(page, "2026-05-08");
  await page.keyboard.press(" ");
  await page.waitForTimeout(80);
  const bySpace = await readFocus(page);
  out.commitKeys = {
    enter: { on: "2026-05-07", selected: byEnter.selected },
    space: { on: "2026-05-08", selected: bySpace.selected },
  };

  // An outside day: does clicking it select the date, and does the month move?
  await reset(page);
  const outsideCell = out.grid.weeks[0].find((c) => c.outside);
  await clickDay(outsideCell.day);
  out.outsideDayClick = {
    day: outsideCell.day,
    ...(await readFocus(page)),
    $comment:
      "showOutsideDays renders the neighbours' days. Clicking one selects that " +
      "date; whether the displayed month follows is the interesting half.",
  };

  // The grid was read at rest, when nothing was selected — so nothing in it
  // shows what a chosen day looks like to a reader. Read it again with one.
  await reset(page);
  await clickDay("2026-05-20");
  const withSel = await readGrid(page);
  const selCell = withSel.weeks.flat().find((c) => c.day === "2026-05-20");
  const todayCell = withSel.weeks.flat().find((c) => c.day === "2026-05-14");
  out.selectedCell = {
    cell: selCell,
    todayCell: todayCell,
    othersAriaSelected: [
      ...new Set(withSel.weeks.flat().filter((c) => c.day !== "2026-05-20").map((c) => c.ariaSelected)),
    ],
    $comment:
      "What a selected day carries, and what every other day carries. If the " +
      "unselected days say nothing at all rather than aria-selected=false, a " +
      "reader counts differently and the Ranger side must match.",
  };

  // Enter on the day that is ALREADY selected. Clicking it toggles; whether
  // the keyboard agrees is a separate question and was assumed once.
  await reset(page);
  await clickDay("2026-05-20");
  await focusDay(page, "2026-05-20");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(120);
  out.enterOnSelected = {
    ...(await readFocus(page)),
    $comment: "Does the keyboard toggle the way the pointer does?",
  };

  // --- 5. the navigation buttons
  await reset(page);
  const nav = [{ after: "start", caption: (await readFocus(page)).caption }];
  await page.locator(".rdp-button_previous").click();
  await page.waitForTimeout(80);
  nav.push({ after: "prev", caption: (await readFocus(page)).caption });
  await page.locator(".rdp-button_next").click();
  await page.locator(".rdp-button_next").click();
  await page.waitForTimeout(80);
  nav.push({ after: "next twice", caption: (await readFocus(page)).caption });
  out.nav = nav;

  return out;
}

/** The second fixture: days before the 10th cannot be picked. */
async function captureDisabled(page) {
  const out = {};
  out.grid = await readGrid(page);
  out.disabledDays = out.grid.weeks
    .flat()
    .filter((c) => c.disabled)
    .map((c) => c.day);
  out.initialFocus = await readFocus(page);

  // An arrow key aimed at a disabled day: does it stop, skip, or land?
  out.stepOntoDisabled = await walk(page, "2026-05-10", "ArrowLeft");
  out.stepOntoDisabledUp = await walk(page, "2026-05-14", "ArrowUp");

  // And a click on one.
  await page.locator('[data-day="2026-05-05"] button').click({ force: true });
  await page.waitForTimeout(80);
  out.clickDisabled = {
    day: "2026-05-05",
    ...(await readFocus(page)),
    $comment: "A disabled day is not selectable by pointer either.",
  };
  return out;
}

/**
 * The year navigation, which the default capture cannot see.
 *
 * Reported: the calendar has no way to reach a year — only previous/next
 * month arrows, so getting to 2019 is forty-eight clicks. The reference has
 * one, and `captionLayout` is "label" unless you ask, so a calendar built
 * from the default capture is missing it by construction rather than by
 * oversight.
 *
 * Four questions, and none of their answers were guessable:
 *
 *   1. WHAT APPEARS. "dropdown" gives two selects, "dropdown-years" gives one
 *      and leaves the month as a label. The nav arrows stay either way.
 *   2. WHAT YEARS, with no bounds given.
 *   3. WHAT YEARS, bounded, and which way round.
 *   4. WHAT CHANGING ONE DOES to the month, the focus and the selection.
 */
const readCaption = (page) =>
  page.evaluate(() => {
    // The selects carry no `name`; the accessible label is the handle, which
    // is itself the answer to "what does a reader call these".
    const sel = (label) => document.querySelector(`select[aria-label="${label}"]`);
    const read = (label) => {
      const s = sel(label);
      if (!s) return null;
      return {
        label,
        value: s.value,
        options: [...s.options].map((o) => ({ value: o.value, text: o.textContent, disabled: o.disabled })),
      };
    };
    const days = [...document.querySelectorAll("[data-day]")];
    return {
      months: read("Choose the Month"),
      years: read("Choose the Year"),
      nav: [...document.querySelectorAll(".rdp-nav button")].map((b) => ({
        label: b.getAttribute("aria-label"),
        disabled: b.disabled,
      })),
      firstCell: days.length ? days[0].getAttribute("data-day") : null,
      cells: days.length,
      tabbable: days
        .map((d) => d.querySelector("button"))
        .filter((b) => b && b.tabIndex === 0)
        .map((b) => b.closest("[data-day]").getAttribute("data-day")),
      selected: days
        .map((d) => d.querySelector("button"))
        .filter((b) => b && b.getAttribute("aria-selected") === "true")
        .map((b) => b.closest("[data-day]").getAttribute("data-day")),
    };
  });

const yearsOf = (cap) => (cap.years ? cap.years.options.map((o) => Number(o.value)) : []);

async function captureYearNav(open) {
  const out = {};

  // 1. What appears, in each layout.
  {
    const p = await open({ captionLayout: "dropdown" });
    const cap = await readCaption(p);
    const ys = yearsOf(cap);
    out.dropdownUnbounded = {
      hasMonthSelect: cap.months !== null,
      hasYearSelect: cap.years !== null,
      navKept: cap.nav.map((n) => n.label),
      yearCount: ys.length,
      firstYear: ys[0],
      lastYear: ys[ys.length - 1],
      viewYear: cap.years.value,
      $comment:
        "No bounds given: the list runs a hundred years BACK from the " +
        "current year and stops there, ascending. So out of the box the " +
        "dropdown cannot reach next year at all — the range is a decision " +
        "the host has to make, not a default worth copying.",
    };
    await p.close();
  }
  {
    const p = await open({ captionLayout: "dropdown-years", startMonth: "2020-01-01", endMonth: "2030-12-01" });
    const cap = await readCaption(p);
    out.dropdownYearsOnly = {
      hasMonthSelect: cap.months !== null,
      hasYearSelect: cap.years !== null,
      $comment: '"dropdown-years" is the year alone; the month stays a label.',
    };
    await p.close();
  }

  // 2 and 3. The bounded list, both directions.
  {
    const p = await open({ captionLayout: "dropdown", startMonth: "2020-01-01", endMonth: "2030-12-01" });
    const cap = await readCaption(p);
    out.bounded = {
      years: yearsOf(cap),
      monthValues: cap.months.options.map((o) => o.value),
      monthTexts: cap.months.options.map((o) => o.text),
      monthValueOfMay: cap.months.value,
      $comment:
        "The year list is exactly the bounded years, ascending. Month " +
        "option values are ZERO-BASED indices, not month numbers.",
    };
    await p.close();
  }
  {
    const p = await open({ captionLayout: "dropdown", startMonth: "2020-01-01", endMonth: "2030-12-01", reverseYears: true });
    out.reversed = { years: yearsOf(await readCaption(p)) };
    await p.close();
  }

  // A range narrow enough that most months are out of it.
  {
    const p = await open({ captionLayout: "dropdown", startMonth: "2026-05-01", endMonth: "2026-07-01" });
    const cap = await readCaption(p);
    out.narrowBounds = {
      years: yearsOf(cap),
      monthsEnabled: cap.months.options.filter((o) => !o.disabled).map((o) => o.text),
      monthsDisabled: cap.months.options.filter((o) => o.disabled).map((o) => o.text),
      nav: cap.nav,
      $comment:
        "A month outside the range is DISABLED, not removed: the list is " +
        "always twelve long, so it does not reflow as you move through the " +
        "range. The nav arrows are not bounded by it in this version.",
    };
    await p.close();
  }

  // 4. What changing one does.
  {
    const p = await open({ captionLayout: "dropdown", startMonth: "2020-01-01", endMonth: "2030-12-01" });
    const before = await readCaption(p);
    await p.selectOption('select[aria-label="Choose the Year"]', "2023");
    await p.waitForTimeout(150);
    const afterYear = await readCaption(p);
    await p.selectOption('select[aria-label="Choose the Month"]', "1");
    await p.waitForTimeout(150);
    const afterMonth = await readCaption(p);
    out.changing = {
      before: { year: before.years.value, month: before.months.value, cells: before.cells, tabbable: before.tabbable },
      afterYear: { year: afterYear.years.value, month: afterYear.months.value, cells: afterYear.cells, tabbable: afterYear.tabbable },
      afterMonth: { year: afterMonth.years.value, month: afterMonth.months.value, cells: afterMonth.cells, tabbable: afterMonth.tabbable },
      $comment:
        "Changing the year KEEPS the month index and vice versa. The grid " +
        "reshapes — May 2026 is six rows and May 2023 is five — and the tab " +
        "stop moves to the FIRST of the shown month rather than staying on " +
        "the same day number, which is the part a re-implementation gets " +
        "wrong: keeping the day number would land on a day that may not " +
        "exist in the new month.",
    };
    await p.close();
  }

  // A selection made before the jump.
  {
    const p = await open({ captionLayout: "dropdown", startMonth: "2020-01-01", endMonth: "2030-12-01" });
    await p.locator('[data-day="2026-05-20"] button').click();
    await p.waitForTimeout(120);
    await p.selectOption('select[aria-label="Choose the Year"]', "2024");
    await p.waitForTimeout(150);
    const cap = await readCaption(p);
    out.selectionSurvives = {
      selectedValue: await p.evaluate(() => (window.__selected ? new Date(window.__selected).toISOString().slice(0, 10) : null)),
      markedInView: cap.selected,
      $comment:
        "Jumping the year does not clear the selection — it just takes it " +
        "off screen. Nothing in the shown month is marked, and coming back " +
        "to May 2026 finds it still there.",
    };
    await p.close();
  }

  return out;
}

/**
 * What the numbers above mean, written after reading them rather than before.
 *
 * This block is prose about the capture and is not itself measured — every
 * claim in it points at a field that is. It exists because the raw walks are
 * forty rows of dates and the RULES behind them are the thing being copied.
 */
const FINDINGS = {
  homeAndEndAreWeekRelative:
    "Home and End move within the displayed WEEK, not the month: Home from " +
    "2026-05-13 is 2026-05-10 (that week's Sunday) and End is 2026-05-16. " +
    "From 2026-05-01, a Friday, Home is 2026-04-26 — an outside day — and the " +
    "displayed month changes to April. A calendar whose Home key means 'the " +
    "1st' is a different component, and that is the obvious wrong guess.",
  pageKeysKeepTheDayOfMonth:
    "PageUp and PageDown shift by one month and hold the day number: " +
    "2026-05-13 goes to 2026-04-13 and 2026-06-13. At the ends this is " +
    "capped by the target month's length — PageUp from 2026-05-31 is " +
    "2026-04-30, because April has no 31st.",
  focusDragsTheMonth:
    "Arrow keys are not bounded by the displayed month. Stepping off either " +
    "end scrolls the grid, so the caption is a function of the focused day.",
  tabStopAtRestIsToday:
    "With nothing selected the single tab stop is today; once a day is " +
    "selected it is the selected day. Both are measured — see initialFocus " +
    "and tabStopAfterSelect.",
  singleModeToggles:
    "mode=single without `required` clears the selection when the selected " +
    "day is clicked again. onSelect fires with undefined.",
  outsideDayDoesNotNavigate:
    "Clicking a leading outside day selects that date and leaves the caption " +
    "on the original month. Selection and display are independent.",
  rovingTabindex: {
    measured:
      "The tab stop follows the FIRST click (05-13) but not a second one: " +
      "after clicking 05-20 the tabbable day is still 05-13 while focus is " +
      "on 05-20. Stable at 800ms, so not a race. Keyboard focus does keep " +
      "the tab stop in step, except across a month change, where it jumps to " +
      "the 1st of the new month.",
    divergence:
      "NOT COPIED. WAI-ARIA's grid pattern says the tabbable cell is the one " +
      "that will receive focus, and here it demonstrably is not — tabbing " +
      "out and back would land somewhere other than where you left. The " +
      "Ranger side keeps the tab stop on the focused day at all times. This " +
      "is a deliberate, recorded deviation from the reference and the parity " +
      "counter scores it as such rather than as a miss.",
  },
};

assertDomInstalled();
const esbuild = requireDom("esbuild");
const { chromium } = requireDom("playwright-core");

await esbuild.build({
  entryPoints: [path.join(CAL_DIR, "app.jsx")],
  bundle: true,
  outfile: path.join(CAL_DIR, "bundle.js"),
  loader: { ".jsx": "jsx" },
  format: "iife",
  define: { "process.env.NODE_ENV": '"development"' },
  nodePaths: [path.join(DOM_DIR, "node_modules")],
  logLevel: "silent",
});

const url = pathToFileURL(path.join(CAL_DIR, "index.html")).href;
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));

// The options are read at mount, so they are installed before the script runs
// and re-installed after every reload.
const install = (opts) =>
  page.addInitScript(`window.__CAL__ = ${JSON.stringify(opts)};`);

await install({});
await page.goto(url);
await page.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
await page.waitForTimeout(150);
const main = await capture(page);

const page2 = await browser.newPage();
page2.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
await page2.addInitScript(`window.__CAL__ = ${JSON.stringify({ disabledBefore: "2026-05-10" })};`);
await page2.goto(url);
await page2.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
await page2.waitForTimeout(150);
const disabled = await captureDisabled(page2);

// The year navigation, each layout in its own page: `captionLayout` is read
// at mount, so these cannot share one.
const openWith = async (opts) => {
  const p = await browser.newPage();
  p.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
  await p.addInitScript(`window.__CAL__ = ${JSON.stringify(opts)};`);
  await p.goto(url);
  await p.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
  await p.waitForTimeout(150);
  return p;
};
const yearNav = await captureYearNav(openWith);

const version = createRequire(path.join(DOM_DIR, "package.json"))(
  "react-day-picker/package.json",
).version;
await browser.close();

const file = path.join(HERE, "calendar.json");
fs.writeFileSync(
  file,
  JSON.stringify(
    {
      $source: "react-day-picker " + version + ", mode=single, May 2026, today=2026-05-14",
      reactDayPicker: version,
      month: "2026-05",
      today: "2026-05-14",
      ...main,
      disabledFixture: disabled,
      yearNav,
      findings: FINDINGS,
    },
    null,
    2,
  ) + "\n",
);
console.log("wrote " + path.relative(process.cwd(), file) + "  (react-day-picker " + version + ")");
console.log("grid: " + main.shape.weeks + " weeks, " + main.shape.leadingOutside + " leading / " + main.shape.trailingOutside + " trailing outside days");
console.log("tab stop at rest: " + JSON.stringify(main.initialFocus.tabbable));
console.log("middle walks: " + main.keyboardMiddle.map((w) => w.key + "->" + w.to).join("  "));
console.log("year nav: unbounded " + yearNav.dropdownUnbounded.firstYear + ".." + yearNav.dropdownUnbounded.lastYear
  + " (" + yearNav.dropdownUnbounded.yearCount + ")"
  + ", bounded " + yearNav.bounded.years[0] + ".." + yearNav.bounded.years[yearNav.bounded.years.length - 1]
  + ", reversed starts " + yearNav.reversed.years[0]);
console.log("year jump: " + yearNav.changing.before.tabbable + " -> " + yearNav.changing.afterYear.tabbable
  + " (" + yearNav.changing.before.cells + " cells -> " + yearNav.changing.afterYear.cells + ")");
