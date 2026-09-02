/**
 * An event calendar, asked where it actually puts overlapping events.
 *
 *   node gallery/ui/conformance/oracle/eventcal_oracle.mjs
 *
 * Writes `eventcal.json` beside this file. `EventCalCtl.rgr` is built against
 * these numbers and `eventcal_check.mjs` gates them; nothing reads the file at
 * run time.
 *
 * WHY schedule-x, AND WHAT IT IS NOT AN ORACLE FOR. The request was ReUI's
 * event calendar, and reui.io is refused by the egress proxy exactly as
 * ui.shadcn.com is — so ReUI's own chrome, its labels and its buttons cannot
 * be read here and NOTHING below claims them. What can be measured is the part
 * every event calendar has to decide and where implementations quietly differ:
 * WHERE OVERLAPPING EVENTS GO. schedule-x is a real, current event calendar
 * that decides it, and it is the oracle for that question only.
 *
 * THE ANSWER IS NOT THE OBVIOUS ONE, which is the whole reason for measuring.
 * Asked to lay out three overlapping events, almost every hand-written
 * calendar gives them a third of the width each. This one does not:
 *
 *     column 0    left 0%        width 100%      z-index 0
 *     column 1    left 33.33%    width 66.67%    z-index 1
 *     column 2    left 66.67%    width 33.33%    z-index 2
 *
 * Every event runs to the RIGHT EDGE and later columns overlay earlier ones.
 * `left = column / total`, `width = (total - column) / total`. Measured with
 * two mutually overlapping events and then with three, because the two-event
 * case is 50/50 either way and would have proved nothing.
 *
 * READ OFF THE INLINE STYLES, not off `getBoundingClientRect`. schedule-x 4
 * ships no stylesheet of its own — the theme is a separate package — so the
 * rendered boxes are degenerate, while the layout the library COMPUTED is
 * written onto each element as `top`/`height`/`inset-inline-start`/`width`
 * percentages. Those percentages are the answer; the pixels in this harness
 * are not.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { assertDomInstalled, findChromium, requireDom } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOM_DIR = path.join(HERE, "..", "dom");
const CAL_DIR = path.join(DOM_DIR, "eventcal");

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

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
await page.goto(pathToFileURL(path.join(CAL_DIR, "index.html")).href);
await page.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
await page.waitForTimeout(300);

const raw = await page.evaluate(() => {
  const num = (s, re) => {
    const m = s.match(re);
    return m ? Number(m[1]) : null;
  };
  return [...document.querySelectorAll("[data-event-id]")].map((el) => {
    const s = el.getAttribute("style") || "";
    return {
      id: el.getAttribute("data-event-id"),
      allDay: el.className.includes("date-grid"),
      top: num(s, /top: ([\d.]+)%/),
      height: num(s, /height: ([\d.]+)%/),
      left: num(s, /inset-inline-start: ([\d.]+)%/),
      width: num(s, /width: ([\d.]+)%/),
      // An all-day band's width is `calc(N00% - 2px)`: N columns wide, less
      // the gutter. The count is what matters; the 2px is a theme detail.
      spanPercent: num(s, /width: calc\(([\d.]+)% - 2px\)/),
      zIndex: num(s, /z-index: (\d+)/),
      lane: num(s, /grid-row: (\d+)/),
    };
  });
});

const version = createRequire(path.join(DOM_DIR, "package.json"))(
  "@schedule-x/calendar/package.json",
).version;
await browser.close();

// Rounded to four decimals: the library writes 66.6667 and a third is not
// representable, so an exact compare would be a compare of rounding modes.
const r4 = (n) => (n === null ? null : Math.round(n * 10000) / 10000);
const timed = raw
  .filter((e) => !e.allDay)
  .map((e) => ({ id: e.id, top: r4(e.top), height: r4(e.height), left: r4(e.left), width: r4(e.width), zIndex: e.zIndex }));
const allDay = raw
  .filter((e) => e.allDay)
  .map((e) => ({ id: e.id, days: e.spanPercent === null ? null : e.spanPercent / 100, lane: e.lane }));

const FINDINGS = {
  widthIsNotOneOverN: {
    what:
      "Three mutually overlapping events get widths 100%, 66.67% and 33.33% " +
      "at lefts 0%, 33.33% and 66.67%, with z-index equal to the column. " +
      "`left = column / total`, `width = (total - column) / total`.",
    consequence:
      "Every event reaches the right edge and later columns overlay earlier " +
      "ones. The obvious implementation — n equal columns, a third each — is " +
      "visibly a different calendar, and it is what a reimplementation writes " +
      "if nobody looks. Measured with THREE events, because two are 50/50 " +
      "under either rule and would have proved nothing.",
  },
  oneTotalPerBatch: {
    what:
      "In the 09:00 group the four events are laid out as total = 2, even " +
      "though only some pairs overlap: A and D take column 0 while B and C " +
      "take column 1. The divisor is the widest point of the whole connected " +
      "batch, not each event's own concurrency count.",
    consequence:
      "Column widths line up down the batch instead of every event choosing " +
      "its own divisor and drawing a ragged edge. It also means the layout " +
      "is two passes, not one: the columns are assigned first and the total " +
      "is only known when the batch closes.",
  },
  columnsAreReused: {
    what:
      "D starts at 10:00, exactly when A ends, and takes A's column 0 rather " +
      "than a fourth column. C takes B's column 1 the same way — B ends at " +
      "09:30 and C starts at 09:30.",
    consequence:
      "Assignment is first-fit against the events STILL RUNNING, not a " +
      "counter. And touching is not overlapping: the test is `end > start` " +
      "strictly. A calendar using `>=` puts D in a fourth column and squeezes " +
      "the morning to a quarter of its width for no reason a person can see.",
  },
  geometryIsAFractionOfTheDay: {
    what:
      "09:00–10:00 is top 37.5%, height 4.1667% — 9/24 and 1/24. The grid is " +
      "the whole 24 hours regardless of which hours carry events.",
    consequence:
      "Nothing here is measured in pixels, so the same numbers hold at any " +
      "height. EventCalCtl reports the same two fractions.",
  },
  midnightCrossingIsPromoted: {
    what:
      "The 23:00–01:00 event does NOT appear in the time grid at all. It is " +
      "drawn in the all-day band as a two-day span.",
    consequence:
      "A timed event that crosses midnight is a multi-day event, not two " +
      "boxes. This is a real decision and a surprising one — the plausible " +
      "guess is that it is split at midnight — so it is recorded and " +
      "implemented rather than left to whichever way the code happens to " +
      "fall.",
  },
  allDayLanesArePackedFirstFit: {
    what:
      "Three all-day bands: 11–12 and 13–15 share lane 1, and 12–14 is " +
      "pushed to lane 2. The end date is INCLUSIVE, which is why 11–12 and " +
      "12–14 collide at all — they share the 12th.",
    consequence:
      "All-day bands stack by first fit over INCLUSIVE date ranges, a " +
      "different rule from the timed grid's exclusive `end > start`. Two " +
      "overlap tests in one component, and using either one twice is wrong " +
      "in one place — which is the kind of thing that looks correct in a " +
      "screenshot of a week with no collisions in it.",
  },
  notAnOracleForReui: {
    what:
      "reui.io is blocked by the egress proxy, so ReUI's event calendar was " +
      "never read. This capture is schedule-x's layout, which is one real " +
      "answer and not the only one.",
    consequence:
      "The geometry below is measured and gated. ReUI's chrome — its view " +
      "switcher, its labels, its colours — is NOT implemented from a guess " +
      "about what the page looks like; it waits for the source or a " +
      "screenshot, the way the four shadcn components did.",
  },
};

const file = path.join(HERE, "eventcal.json");
fs.writeFileSync(
  file,
  JSON.stringify(
    {
      note:
        "Captured by eventcal_oracle.mjs from a rendered @schedule-x/calendar. " +
        "The layout geometry is MEASURED, read off the inline styles the " +
        "library writes. ReUI's own surface is NOT in here — see FINDINGS.",
      library: `@schedule-x/calendar@${version}`,
      week: "2026-05-11 (Monday) to 2026-05-17",
      timed,
      allDay,
      FINDINGS,
    },
    null,
    2,
  ) + "\n",
);
console.log(`wrote ${path.relative(process.cwd(), file)}`);
