# Repairing the demo pages, against benchmarks that can be measured

Ten defects were reported from looking at the pages. Every suite was green at
the time, which is the first thing this plan has to explain.

## Why the suites did not see any of it

Two blind spots, and they account for all ten:

1. **The containment rule is horizontal only.** `form-check` asserts
   `right > parentRight` and nothing about vertical. Everything reported as
   "broken layout" is things sitting *on top of* each other.
2. **The page gate asks whether the page draws, not whether it works.**
   `ui:demo:page` loads every demo and fails on an exception or a console
   error. A button that lights up and changes nothing passes it.

## The benchmarks

The two sites suggested — `daypicker.dev` and the YearPicker demo — are both
blocked by this environment's egress proxy (`000`, `CONNECT tunnel failed`).
That turns out not to matter: the libraries themselves are installed in
`gallery/ui/conformance/dom`, and a library you can drive is a better oracle
than a page you can read.

| defect | benchmark | how it is measured |
|---|---|---|
| Controls / Filters layout overlap | **Chromium** | same CSS laid out in a real browser; EVGLayout must agree. Plus an invariant that needs no oracle: nothing overlaps a sibling or passes its parent's bottom |
| Sliders | `@radix-ui/react-slider` 1.4.7, `@base-ui/react` 1.7.0 | drive the reference, record pointer and keyboard behaviour |
| Select dropdown | `@radix-ui/react-select` 2.3.7, `@base-ui/react` 1.7.0 | same |
| Event calendar day/week/month | `@schedule-x/calendar` 4.7.0 | the library that already answered the overlap question answers the view question |
| Calendar year navigation | `react-day-picker` 10.0.1 | `captionLayout="dropdown"` / `"dropdown-years"`, `reverseYears`, `startMonth`/`endMonth` — it exists, it is off by default |
| Number field | `@base-ui/react` 1.7.0 | already measured; unchanged |
| Time picker | **the browser's own `<input type="time">`** | a native control is a real oracle |
| Message composer | none — **specified** | no library ships a chat composer. Written from the screenshot and from `MessageCtl`'s existing surface, and said so |
| Year *panel* (scroll to a year) | none — **specified** | react-day-picker has a dropdown, not a scrollable panel. The pattern is the one linked in the request |

Where a row says **specified**, no measurement is claimed for it. That
distinction is the point of the table.

## Order, and why

1. **The vertical layout gate.** One rule, every demo, no oracle needed. It is
   first because it is the only item that makes the other layout work
   *visible*, and because it turns "looks broken" into a number.
2. **Controls and Filters**, driven red-to-green against that number.
3. **Sliders and Select** — the two controls reported as not working, both with
   a reference installed.
4. **Event calendar views**, against schedule-x.
5. **Calendar year navigation**: the dropdown (measured) and the panel
   (specified).
6. **Time picker** against the native control; **message composer** specified;
   the form's date field wired to the calendar.

## The score

`npm run ui:layout:check` prints a count per demo. The baseline it starts from
is recorded in `layout-baseline.json` beside it, so a change that improves one
demo and breaks another cannot read as progress.

## Progress

Layout faults, by `npm run ui:layout:check`: **51 → 45 → 41 → 25**.

| defect | state |
|---|---|
| Controls page layout | fixed — `.cx-page` had a fixed `height`, `.cx-strip` a fixed height and wrapping |
| Sliders | fixed — the controller had the pointer and the keyboard since it was measured; the demo called none of it, and the page threw the x away. `ui:controls:demo` 90 → 128, `ui:demo:page` +11, mutation-proved |
| Event calendar Day/Week/Month | fixed against `@schedule-x/calendar` 4.7.0, whose runtime `setView` throws — so the oracle app takes `?view=` and loads fresh per view. `ui:eventcal:demo` 29 → 47 |
| Select dropdown | fixed — opens, keyboard-navigable, dismissed by a click outside. `ui:profile:check` 42 → 66 |
| Password eye | fixed — `position: absolute` was silently unparsed, which is also most of what made the sliders and the controls page look wrong |
| Calendar year navigation | fixed — measured against `captionLayout="dropdown"`; the scrollable panel is specified, and says so. `CALENDAR_MATRIX.md` is the requested feature matrix |
| Filters demo | 1 layout fault left (`fd-menu`) |
| Message composer | outstanding — specified, no library reference |
| Form page calendar | outstanding |
| Time selector | outstanding — benchmark is the browser's own `<input type="time">` |

Two engine defects were found on the way and are the reason several of the
reports had one cause: **`flex-grow` and `position` were both parsed by
nobody**. Each now has an oracle (`evg:flexgrow:check`, six Chromium-measured
cases) or a gate that would have caught it.
