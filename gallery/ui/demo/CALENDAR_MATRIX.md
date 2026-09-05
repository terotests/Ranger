# The calendar against react-day-picker 10.0.1

Asked for: a feature matrix against react-day-picker, to build toward.

Every row marked **measured** is checked by `npm run ui:calendar:check`, which
reads its expectations out of `gallery/ui/conformance/oracle/calendar.json` at
run time rather than from anything transcribed here — re-capture the oracle
against a newer react-day-picker and the gate starts asking the new questions
by itself. Rows marked **specified** have no oracle behind them and say so;
rows marked **not built** are the honest remainder.

The reference is driven, not read: `calendar_oracle.mjs` mounts a real
`DayPicker` in Chromium and presses the keys and clicks the cells a person
would. Its documentation site is unreachable from this environment, which
turns out not to matter — the library is installed and a library you can drive
is a better oracle than a page you can read.

Appearance is deliberately **not** in this matrix. Every class in the
reference's DOM is a hook shadcn replaces wholesale, so no geometry or colour
of it is copied; the classes here are this kit's own.

## The grid

| feature | reference | Ranger | status |
|---|---|---|---|
| Six-row month, leading and trailing outside days | yes | yes | **measured** — all 42 cells compared, not just the shape |
| `showOutsideDays` | yes | yes | **measured** |
| Caption naming the month | yes | yes | **measured** |
| Weekday column headers | yes | yes, hidden from the trace | **measured** + one recorded divergence: every cell already carries its weekday, so a header would say it twice per cell |
| Multiple months side by side | yes | no | **not built** |
| Week numbers (`showWeekNumber`) | yes | no | **not built** |
| First day of week / locale | yes | Sunday only | **not built** |

## Selection

| feature | reference | Ranger | status |
|---|---|---|---|
| `mode="single"` | yes | yes | **measured** |
| Clicking the selected day clears it | yes | yes | **measured** — and is the obvious wrong guess |
| Enter and Space commit | yes | yes | **measured** |
| Clicking an outside day selects it without moving the month | yes | yes | **measured** |
| `mode="multiple"` / `"range"` | yes | no | **not built** |
| `required` | yes | no | **not built** |

## The keyboard

| feature | reference | Ranger | status |
|---|---|---|---|
| Arrows, and stepping off an end scrolls the month | yes | yes | **measured**, eight keys from the middle and eight from each edge |
| Home / End are WEEK-relative | yes | yes | **measured** — a Home that means "the 1st" is a different component |
| PageUp / PageDown hold the day number, capped by the target month's length | yes | yes | **measured** |
| One roving tab stop | yes | yes, with a recorded divergence | **measured**; the reference's tab stop follows only the first click, this one always follows focus |

## Disabled days

| feature | reference | Ranger | status |
|---|---|---|---|
| `disabled={{ before }}` | yes | `setMinDate` | **measured** |
| An arrow key onto a disabled day | steps onto it | same | **measured** |
| A click on one is ignored | yes | yes | **measured** |
| `disabled` by matcher, array or function | yes | one rule only | **not built** |

## Reaching a year — the reported gap

Before this, the only navigation was previous/next month, so 2019 was
forty-eight clicks away.

| feature | reference | Ranger | status |
|---|---|---|---|
| A year control exists at all | `captionLayout="dropdown"` — **off by default** | a pressable year in the caption | **measured** (what it does) |
| Bounded year list | `startMonth`/`endMonth` | `startYear`/`endYear` | **measured** — exactly those years, ascending |
| Unbounded default | 100 years BACK from the current year, ending there | not copied | **measured, and deliberately not followed**: the reference out of the box cannot reach next year at all |
| Newest first | `reverseYears` | `reverseYears` | **measured** |
| A year change keeps the month | yes | yes | **measured** |
| …and moves the cursor to the FIRST of it | yes | yes | **measured** — not to the same day number, which need not exist |
| …and does not clear the selection | yes | yes | **measured** — it just goes off screen |
| A year outside the bounds is unreachable | not listed | refused | **measured** |
| A month select beside the year | `captionLayout="dropdown"`, months out of range disabled not removed | `setViewMonth` exists, nothing draws it | **not built** (the controller half is measured) |
| `captionLayout="dropdown-years"` (year alone) | yes | this is the shape built | **measured** |
| A scrollable year PANEL | no — it uses a native `<select>` | yes | **specified**: a canvas kit has no native select, and the request was for a panel you can scroll. What choosing a year does is measured; how the panel looks and scrolls is not |
| The panel opens parked on the current year | n/a | yes | **specified** |

## What a reader is told

| feature | reference | Ranger | status |
|---|---|---|---|
| `role="grid"`, `gridcell`, named cells | yes | yes | **measured** |
| "Today, …" and ", selected" affixes | yes | yes | **measured** |
| A live region on the caption | yes | yes | this kit's `role="status"` |
| The year as an expandable button with a listbox | native `<select>` | `role="button"`, `aria-expanded`, `role="listbox"` of options | **specified** — a native select has no equivalent to compare against |
