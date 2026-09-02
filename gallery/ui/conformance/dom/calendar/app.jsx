// The reference calendar, mounted so a probe can read it.
//
// react-day-picker is what shadcn's Calendar wraps, so this is the behaviour a
// person means when they say "a calendar like that one". Mounted in the
// single-selection mode the shadcn example shows.
//
// MAY 2026, and not the current month or February. The month is the fixture
// here, and most months are too kind to it: February 2026 begins on a Sunday
// and has 28 days, so it is exactly four full weeks and `showOutsideDays`
// shows nothing at all. May 2026 begins on a Friday and ends on a Sunday: five
// leading outside days, six trailing, six rows — the widest grid the component
// ever draws, and the only shape where "which cell is the first of the month"
// is a real question. Day 1 falling on a Friday also means ArrowLeft from it
// crosses into April, so the boundary rules are reachable.
//
// `today` is passed rather than left to the clock, for the same reason the
// month is: an oracle whose answers change overnight is not an oracle.
import React from "react";
import { createRoot } from "react-dom/client";
import { DayPicker } from "react-day-picker";

const MONTH = new Date(2026, 4, 1);
const TODAY = new Date(2026, 4, 14);

function App() {
  const [selected, setSelected] = React.useState(undefined);
  const opts = window.__CAL__ || {};
  React.useEffect(() => {
    window.__selected = selected;
  }, [selected]);
  const extra = {};
  // Some questions only have answers when a day cannot be picked: what an
  // arrow key does when it lands on one, and whether a click is ignored.
  if (opts.disabledBefore) extra.disabled = { before: new Date(opts.disabledBefore) };
  // The year navigation. It EXISTS in this library and is off by default —
  // `captionLayout` is "label" unless you ask for a dropdown — which is why a
  // calendar built from the default capture has previous/next arrows and no
  // way to reach a year five back. `startMonth`/`endMonth` are what bound the
  // year list; without them the library picks a range of its own, and the
  // point of the capture is to learn which.
  if (opts.captionLayout) extra.captionLayout = opts.captionLayout;
  if (opts.startMonth) extra.startMonth = new Date(opts.startMonth);
  if (opts.endMonth) extra.endMonth = new Date(opts.endMonth);
  if (opts.reverseYears) extra.reverseYears = true;
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={setSelected}
      defaultMonth={MONTH}
      today={TODAY}
      showOutsideDays={opts.showOutsideDays !== false}
      {...extra}
    />
  );
}

createRoot(document.getElementById("root")).render(<App />);
window.__READY__ = true;
