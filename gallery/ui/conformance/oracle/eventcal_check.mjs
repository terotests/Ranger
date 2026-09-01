#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// EventCalCtl against the schedule-x capture.
//
//   node gallery/ui/conformance/oracle/eventcal_check.mjs
//
// Reads `eventcal.json` rather than restating its numbers, so a re-capture
// that changes an answer breaks the gate instead of being absorbed. The same
// eleven events go into the controller as went into the reference, and the
// layout it computes is compared entry by entry.
//
// What is MEASURED here is the geometry — columns, widths, lanes, the day
// fractions. What is NOT measured, and is not claimed anywhere below, is
// ReUI's own surface: reui.io is refused by the egress proxy.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const ORACLE = JSON.parse(fs.readFileSync(path.join(HERE, "eventcal.json"), "utf8"));

let pass = 0;
let fail = 0;
const check = (what, got, want) => {
  const ok = String(got) === String(want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${what}: ${got}${ok ? "" : "   want " + want}`);
};
// The reference writes 66.6667; a third is not representable, so comparing
// exactly would compare rounding modes rather than layouts.
const pct = (x) => Math.round(x * 1000000) / 10000;

// 11 May 2026 as a day number, in UiDate's own arithmetic — not a constant
// typed in here, which would be a second date implementation to keep in step.
const MON = H.UiDate.toDays(2026, 5, 11);
const hm = (h, m) => h * 60 + m;

const mk = () => {
  const c = new H.EventCalCtl();
  c.weekStart = MON;
  c.addTimed("a", "A", MON, hm(9, 0), hm(10, 0));
  c.addTimed("b", "B", MON, hm(9, 0), hm(9, 30));
  c.addTimed("c", "C", MON, hm(9, 30), hm(10, 30));
  c.addTimed("d", "D", MON, hm(10, 0), hm(11, 0));
  c.addTimed("e", "E", MON, hm(14, 0), hm(15, 0));
  c.addTimed("g", "G", MON, hm(16, 0), hm(17, 0));
  c.addTimed("h", "H", MON, hm(16, 10), hm(17, 10));
  c.addTimed("i", "I", MON, hm(16, 20), hm(17, 20));
  // After the triple, so the triple is not the last batch of the day — the
  // batch close used to be written twice and only the final copy was covered.
  c.addTimed("l", "L", MON, hm(18, 0), hm(18, 30));
  // 23:00 on Monday to 01:00 on Tuesday — the midnight crossing.
  c.addSpanning("j", "J", MON, hm(23, 0), MON + 1, hm(1, 0));
  c.addAllDay("f", "F", MON + 1, MON + 3);
  c.addAllDay("k", "K", MON + 2, MON + 4);
  c.layout();
  return c;
};

console.log("MEASURED — the time grid, walked out of eventcal.json");
{
  const c = mk();
  for (const want of ORACLE.timed) {
    check(`${want.id} top`, pct(c.topOf(want.id)), want.top);
    check(`${want.id} height`, pct(c.heightOf(want.id)), want.height);
    check(`${want.id} left`, pct(c.leftOf(want.id)), want.left);
    check(`${want.id} width`, pct(c.widthOf(want.id)), want.width);
    check(`${want.id} z`, c.zOf(want.id), want.zIndex);
  }
}

console.log("\nMEASURED — the all-day band");
{
  const c = mk();
  for (const want of ORACLE.allDay) {
    check(`${want.id} spans days`, c.daysOf(want.id), want.days);
    check(`${want.id} lane`, c.laneOf(want.id), want.lane);
  }
  // The midnight crossing is in the band at all — the finding, asserted rather
  // than left as a consequence of the numbers above.
  check(
    "the 23:00–01:00 event is in the band, not the grid",
    ORACLE.allDay.some((e) => e.id === "j"),
    true,
  );
  check("and the reference did not put it in the grid", ORACLE.timed.some((e) => e.id === "j"), false);
}

console.log("\nMEASURED — the two overlap rules are different rules");
{
  const c = mk();
  // Timed: strict. D starts exactly when A ends and takes A's column back.
  check("D reuses A's column", c.zOf("d"), c.zOf("a"));
  check("and the morning is two columns wide, not four", pct(c.widthOf("a")), 100);
  // All-day: inclusive. F (12th–14th) and the 11th–12th band share the 12th,
  // so F cannot have lane 1.
  check("F is pushed off lane 1 by a band it only shares one day with", c.laneOf("f"), 2);
  check("K, which shares no day with J, keeps lane 1", c.laneOf("k"), 1);
}

console.log("\nMEASURED — three overlapping events are not a third each");
{
  const c = mk();
  // The case the two-event fixture could not decide. If the rule were "n equal
  // columns" every one of these would be 33.33%.
  check("G keeps the full width", pct(c.widthOf("g")), 100);
  check("H takes two thirds", pct(c.widthOf("h")), 66.6667);
  check("I takes one third", pct(c.widthOf("i")), 33.3333);
  check("and they step across", `${pct(c.leftOf("g"))}/${pct(c.leftOf("h"))}/${pct(c.leftOf("i"))}`, "0/33.3333/66.6667");
  check("stacked in column order", `${c.zOf("g")}${c.zOf("h")}${c.zOf("i")}`, "012");
}

console.log("\nSPECIFIED — layout does not depend on the order events arrive in");
{
  // Same eleven events, declared backwards. A layout that changes when the
  // data is reordered is not a layout — and the tie between the two 09:00
  // events is the one place it could.
  const c = new H.EventCalCtl();
  c.weekStart = MON;
  c.addTimed("i", "I", MON, hm(16, 20), hm(17, 20));
  c.addTimed("h", "H", MON, hm(16, 10), hm(17, 10));
  c.addTimed("g", "G", MON, hm(16, 0), hm(17, 0));
  c.addTimed("e", "E", MON, hm(14, 0), hm(15, 0));
  c.addTimed("d", "D", MON, hm(10, 0), hm(11, 0));
  c.addTimed("c", "C", MON, hm(9, 30), hm(10, 30));
  c.addTimed("a", "A", MON, hm(9, 0), hm(10, 0));
  c.addTimed("b", "B", MON, hm(9, 0), hm(9, 30));
  c.addTimed("l", "L", MON, hm(18, 0), hm(18, 30));
  c.layout();
  check("G/H/I are unchanged", `${c.zOf("g")}${c.zOf("h")}${c.zOf("i")}`, "012");
  check("D still reuses a released column", c.zOf("d"), 0);
  // A and B start at the same minute, so the tie IS the declaration order —
  // and here A was declared after C. Recorded as what it is: this is the one
  // number in the layout that a reordering legitimately changes, and the
  // reference behaves the same way.
  check("the 09:00 tie follows declaration order", c.zOf("a") + c.zOf("b"), 1);
}

console.log("\nSPECIFIED — navigation, which no capture covers");
{
  const c = mk();
  check("a week label spans seven days", c.label(), "Monday, May 11th, 2026 – Sunday, May 17th, 2026");
  c.step(1);
  check("a week step moves seven days", c.label().split(" – ")[0], "Monday, May 18th, 2026");
  c.step(-1);
  check("and back", c.label().split(" – ")[0], "Monday, May 11th, 2026");
  c.setView("day");
  check("a day view labels one day", c.label(), "Monday, May 11th, 2026");
  c.step(1);
  check("and steps one day", c.label(), "Tuesday, May 12th, 2026");
  c.setView("month");
  check("a month view labels the month", c.label(), "May 2026");
  c.step(1);
  check("and steps a month", c.label(), "June 2026");
}
{
  // Stepping a month from the 31st: February has no 31st, and a calendar that
  // spills forward lands in March.
  const c = new H.EventCalCtl();
  c.weekStart = H.UiDate.toDays(2026, 1, 31);
  c.setView("month");
  c.step(1);
  check("a month step from the 31st clamps", c.label(), "February 2026");
  c.step(-1);
  check("and December is the month before January", (() => { const d = new H.EventCalCtl(); d.weekStart = H.UiDate.toDays(2026, 1, 15); d.setView("month"); d.step(-1); return d.label(); })(), "December 2025");
}

console.log("\nSPECIFIED — what a reader is given");
{
  const c = mk();
  const rows = Array.from(c.rows());
  const byTid = Object.fromEntries(rows.map((r) => [r.tid, r]));
  check("the calendar is a named region", byTid.eventcal.role, 27);
  check("named by what it is showing", byTid.eventcal.name, "Monday, May 11th, 2026 – Sunday, May 17th, 2026");
  check("the band is a list", byTid.allday.role, 22);
  check("the events are a list", byTid.timegrid.role, 22);
  // The time is in the NAME. A reader cannot see where a box sits, so a name
  // of "A" alone tells them nothing about when it is — which is the one thing
  // a calendar exists to say.
  // "Mo", not "Mon": UiDate's abbreviation is the one the react-day-picker
  // capture measured, and it is two letters. Written here as what that
  // function actually returns rather than as a third spelling of a weekday.
  check("a timed event says when it is", byTid.a.name, `A, ${H.UiDate.dayAbbr(H.UiDate.weekday(MON))} 09:00 to 10:00`);
  check("and that abbreviation is the day-picker's", H.UiDate.dayAbbr(H.UiDate.weekday(MON)), "Mo");
  check("an all-day band says it is all day", byTid.f.name, "F, all day, 3 days");
  check("every event is reachable", rows.filter((r) => r.focusable).length, 12);
  check("and none is a tab stop before one is focused", rows.filter((r) => r.tabStop).length, 0);
  c.activeId = "c";
  check("focusing one makes it the only tab stop", Array.from(c.rows()).filter((r) => r.tabStop).map((r) => r.tid).join(","), "c");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
console.log("ALL PASS");
