#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The browser's own <input type="date">, asked what a segmented date field does.
//
//   node gallery/ui/conformance/oracle/datefield_oracle.mjs
//
// Writes `datefield.json` beside this file. `DateFieldCtl.rgr` is built
// against it and `datefield_check.mjs` gates it; nothing reads the file at run
// time.
//
// WHY THE NATIVE CONTROL. shadcn has no date FIELD — its Date Picker is a
// calendar in a popover behind a button, and "picker with input" parses free
// text. Radix and Base UI have none either. What a person asked for is the
// `__/__/____` editor: three segments, arrows that step the one under the
// caret, digits that fill it and move on, Backspace that empties it. The one
// implementation of that everybody has already used is the browser's, and it is
// the same rule this gallery applied to the time picker: a native control is a
// real oracle.
//
// HOW IT IS READ. The segments live in a closed shadow tree and `input.value`
// is empty until all three are filled, so the DOM says nothing about a
// half-typed date. The ACCESSIBILITY tree does: Chromium exposes each segment
// as a `spinbutton` named Month, Day or Year, with `valuetext` for what it
// shows and `focused` for the one the keyboard is in — read here through the
// DevTools protocol, which is what a screen reader is given.
//
// WHAT IS WORTH ASKING, because every one of these is a guess otherwise:
//
//   WHERE FOCUS LANDS on Tab in, and what ArrowLeft/Right do at the ends.
//   THE STEP AT THE EDGES: does the month wrap from 12 to 1, does the year.
//   TYPING: "1" then "3" into the month — one digit that cannot take a second.
//   AUTO-ADVANCE: whether a completed segment moves the caret on, and whether
//   the year, being last, moves anywhere.
//   BACKSPACE on a filled segment and on an empty one.
//   AN IMPOSSIBLE DAY: 31 with the month stepped to February — what the
//   segments show and what `value` becomes.
//   HOME, END, PAGEUP, PAGEDOWN — bound to something, or to nothing.
//   A LETTER.
//   WHEN `value` APPEARS, digit by digit.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findChromium, requireHostTool } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "datefield.json");

const { chromium } = requireHostTool("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
// en-US, deliberately: the segment ORDER is a locale decision and the
// controller has to pick one. mm/dd/yyyy is what shadcn's own demos show.
const context = await browser.newContext({ locale: "en-US" });
const page = await context.newPage();
await page.setContent(
  `<button id="before">before</button>` +
    `<input id="d" type="date" style="font:14px Arial;width:160px">` +
    `<button id="after">after</button>`,
);
const cdp = await context.newCDPSession(page);
await cdp.send("Accessibility.enable");

// The three segments and the field's committed value, as one observation.
async function read() {
  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  const segs = {};
  let focus = "";
  for (const n of nodes) {
    if (!n.role || n.role.value !== "spinbutton") continue;
    const name = n.name ? n.name.value : "";
    const prop = (k) => (n.properties || []).find((p) => p.name === k);
    const vt = prop("valuetext");
    const fo = prop("focused");
    const key = name.toLowerCase();
    segs[key] = vt ? String(vt.value.value) : "";
    if (fo && fo.value.value) focus = key;
  }
  const value = await page.evaluate(() => document.querySelector("#d").value);
  const active = await page.evaluate(() => document.activeElement && document.activeElement.id);
  return { value, segs, focus: active === "d" ? focus : (active || ""), };
}

// Start over: a value (or none), and the keyboard in the FIRST segment by
// tabbing in from the element before — which is how a person arrives, and
// which does not depend on where in the box a click would land.
async function start(value) {
  await page.evaluate((v) => {
    const d = document.querySelector("#d");
    d.value = v || "";
    document.querySelector("#before").focus();
  }, value);
  await page.keyboard.press("Tab");
  await page.waitForTimeout(40);
}

const order = [];
const scenarios = {};
async function scenario(name, value, steps) {
  await start(value);
  const rec = { start: { value: value || "", ...(await read()) }, steps: [] };
  for (const step of steps) {
    if (step.type) await page.keyboard.type(step.type);
    else await page.keyboard.press(step.key);
    await page.waitForTimeout(40);
    rec.steps.push({ ...step, ...(await read()) });
  }
  scenarios[name] = rec;
  order.push(name);
}

const K = (k) => ({ key: k });
const T = (t) => ({ type: t });

await scenario("tab_in_empty", "", [K("ArrowRight"), K("ArrowRight"), K("ArrowRight"), K("ArrowLeft"), K("ArrowLeft"), K("ArrowLeft"), K("ArrowLeft")]);
await scenario("arrows_on_empty", "", [K("ArrowUp"), K("ArrowUp"), K("ArrowDown"), K("ArrowDown"), K("ArrowDown")]);
await scenario("month_wraps", "2026-12-20", [K("ArrowUp"), K("ArrowUp"), K("ArrowDown"), K("ArrowDown"), K("ArrowDown")]);
await scenario("day_wraps", "2026-01-31", [K("ArrowRight"), K("ArrowUp"), K("ArrowUp"), K("ArrowDown"), K("ArrowDown"), K("ArrowDown")]);
await scenario("year_steps", "2026-05-20", [K("ArrowRight"), K("ArrowRight"), K("ArrowUp"), K("ArrowUp"), K("ArrowDown"), K("ArrowDown"), K("ArrowDown")]);
await scenario("type_month_one_three", "", [T("1"), T("3"), T("1"), T("2"), T("0"), T("2"), T("6")]);
await scenario("type_month_zero_five", "", [T("0"), T("5"), T("2"), T("0"), T("2"), T("0"), T("2"), T("6"), T("7")]);
await scenario("type_over_filled", "2026-05-20", [T("1"), T("1"), T("0"), T("9"), T("1"), T("9"), T("9"), T("9")]);
await scenario("backspace", "2026-05-20", [K("ArrowRight"), K("ArrowRight"), K("Backspace"), K("Backspace"), K("Backspace"), K("Backspace"), K("Backspace")]);
await scenario("delete", "2026-05-20", [K("Delete"), K("Delete"), K("ArrowRight"), K("Delete")]);
await scenario("impossible_day", "2026-01-31", [K("ArrowUp"), K("ArrowUp"), K("ArrowRight"), K("ArrowUp")]);
await scenario("home_end_page", "2026-05-20", [K("Home"), K("End"), K("PageUp"), K("PageDown"), K("ArrowRight"), K("PageUp"), K("ArrowRight"), K("PageUp"), K("PageDown")]);
await scenario("letters", "2026-05-20", [T("a"), T("x"), K("ArrowRight"), T("b")]);
await scenario("tab_out", "2026-05-20", [K("Tab"), K("Tab"), K("Tab")]);
await scenario("shift_tab_back", "2026-05-20", [K("ArrowRight"), K("ArrowRight"), K("Shift+Tab"), K("Shift+Tab"), K("Shift+Tab")]);
await scenario("year_partial", "", [T("0"), T("5"), T("2"), T("0"), T("2"), T("0"), K("ArrowUp"), K("ArrowDown")]);
await scenario("space_enter", "2026-05-20", [K(" "), K("Enter")]);
// The empty day and the empty year under the arrows — the month was measured
// above; a day and a year have different maxima and the year has no wrap, so
// "what does Up do to nothing" needs asking three times.
await scenario("arrows_on_empty_day_year", "", [K("ArrowRight"), K("ArrowUp"), K("ArrowDown"), K("ArrowDown"), K("ArrowRight"), K("ArrowUp"), K("ArrowDown"), K("ArrowDown")]);
await scenario("arrows_on_empty_day_down_first", "", [K("ArrowRight"), K("ArrowDown")]);
// Two digits that cannot be a day, and two zeros that cannot be anything.
await scenario("day_three_two", "", [K("ArrowRight"), T("3"), T("2")]);
await scenario("day_three_one", "", [K("ArrowRight"), T("3"), T("1"), T("5")]);
await scenario("zeros", "", [T("0"), T("0"), T("0"), T("7")]);
await scenario("month_one_then_arrow", "", [T("1"), K("ArrowRight"), T("2")]);
// A typed digit after an arrow: does the arrow reset the two-digit buffer.
await scenario("arrow_then_type", "", [T("1"), K("ArrowUp"), T("2")]);
// Year: five digits and a sixth, and Backspace after typing.
await scenario("year_long", "", [T("1"), T("2"), T("1"), T("2"), T("2"), T("0"), T("2"), T("6"), T("7"), T("8"), K("Backspace"), T("1")]);
// Backspace on a filled month, then a digit: is the buffer fresh.
await scenario("backspace_then_type", "2026-05-20", [K("Backspace"), T("1"), T("1")]);

const version = browser.version();
await browser.close();

fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      note:
        "Captured by datefield_oracle.mjs from Chromium's own <input type=\"date\"> in en-US, read through the accessibility tree: each segment is a spinbutton named Month, Day or Year whose valuetext is what it shows and whose focused flag says where the keyboard is. `value` is the input's committed value. Every scenario starts by tabbing in from the element before the field.",
      browser: "Chromium " + version,
      locale: "en-US",
      order,
      scenarios,
    },
    null,
    2,
  ) + "\n",
);
console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${order.length} scenarios`);
