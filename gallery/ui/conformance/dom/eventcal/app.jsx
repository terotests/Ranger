// A real event calendar, mounted so a probe can read where it puts things.
//
// reui.io is refused by the egress proxy, exactly as ui.shadcn.com is, so the
// ReUI event calendar's own chrome cannot be read here. What CAN be read is
// the part every event calendar has to get right and where implementations
// quietly differ: WHERE OVERLAPPING EVENTS GO. schedule-x is a real, current
// event calendar that computes it, and it is the oracle for that question
// only — not for ReUI's buttons, its colours or its labels.
//
// The week is fixed (11–17 May 2026, a Monday) for the reason the day-picker
// oracle's month is: an oracle whose answers change overnight is not one.
// schedule-x 4 is written against Temporal, which this Chromium does not have.
// The polyfill is the proposal's own reference implementation, so the library
// still runs its real arithmetic — nothing here reimplements a date.
import { Temporal } from "temporal-polyfill";
globalThis.Temporal = Temporal;
import { createCalendar, viewWeek, viewDay, viewMonthGrid } from "@schedule-x/calendar";

// Six events chosen so every branch of a packing algorithm is reachable:
//
//   a, b     start at the same minute — the tie a "sort by start" cannot break
//   c        starts inside a, ends after it — a partial overlap, three deep
//   d        starts exactly when a ends — TOUCHING, not overlapping, and the
//            single most common off-by-one in this algorithm
//   e        sits alone later in the day
//   f        an all-day event, which is a different lane system entirely
const TZ = "UTC";
const at = (hhmm) =>
  Temporal.ZonedDateTime.from(`2026-05-11T${hhmm}:00[${TZ}]`);
const EVENTS = [
  { id: "a", title: "A", start: at("09:00"), end: at("10:00") },
  { id: "b", title: "B", start: at("09:00"), end: at("09:30") },
  { id: "c", title: "C", start: at("09:30"), end: at("10:30") },
  { id: "d", title: "D", start: at("10:00"), end: at("11:00") },
  { id: "e", title: "E", start: at("14:00"), end: at("15:00") },
  // Three mutually overlapping, to tell "share the width evenly" apart from
  // whatever the two-event case happens to look like.
  { id: "g", title: "G", start: at("16:00"), end: at("17:00") },
  { id: "h", title: "H", start: at("16:10"), end: at("17:10") },
  { id: "i", title: "I", start: at("16:20"), end: at("17:20") },
  // A standalone event AFTER the triple overlap, so that the triple is not the
  // last group in the day. Without it the only batch with a middle column was
  // the final one, and a layout that closed its last batch differently from
  // every other batch would have looked correct.
  { id: "l", title: "L", start: at("18:00"), end: at("18:30") },
  // An event that runs past midnight: does it become one box or two?
  {
    id: "j",
    title: "J",
    start: Temporal.ZonedDateTime.from("2026-05-11T23:00:00[UTC]"),
    end: Temporal.ZonedDateTime.from("2026-05-12T01:00:00[UTC]"),
  },
  {
    id: "f",
    title: "F",
    start: Temporal.PlainDate.from("2026-05-12"),
    end: Temporal.PlainDate.from("2026-05-14"),
  },
  // A second all-day band overlapping the first, to see whether they stack
  // into lanes or draw on top of each other.
  {
    id: "k",
    title: "K",
    start: Temporal.PlainDate.from("2026-05-13"),
    end: Temporal.PlainDate.from("2026-05-15"),
  },
];

// WHICH VIEW, from the query string. Day, week and month are three different
// layouts and the question "where does an event go" has a different answer in
// each, so each has to be measured.
//
// A fresh load per view rather than a runtime switch: `calendarState.setView`
// exists but flipping it after render throws inside the library on a date it
// has not recomputed, and an oracle that pokes a component's internals is
// measuring the poke. `defaultView` is the supported way to ask for a view and
// it is the one a host would use.
const VIEW_BY_NAME = {
  day: viewDay.name,
  week: viewWeek.name,
  month: viewMonthGrid.name,
};
const wanted = new URLSearchParams(location.search).get("view") || "week";

const cal = createCalendar({
  views: [viewDay, viewWeek, viewMonthGrid],
  defaultView: VIEW_BY_NAME[wanted] || viewWeek.name,
  selectedDate: Temporal.PlainDate.from("2026-05-11"),
  events: EVENTS,
});
cal.render(document.getElementById("root"));
window.__CAL__ = cal;
window.__EVENTS__ = EVENTS;
window.__VIEW__ = wanted;
window.__READY__ = true;
