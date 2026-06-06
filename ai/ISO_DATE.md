# IsoDate — portable calendar stdlib

Ranger apps should treat calendar dates as **ISO strings** (`YYYY-MM-DD`), not host `Date` objects.

## Layers

| Layer | Location | Role |
|-------|----------|------|
| **Stdlib** | `lib/IsoDate/` | Pure Ranger: `DateMath`, `IsoDateParse`, `IsoCalendar` |
| **Intrinsics** | `compiler/Lang.rgr` | `iso_add_days`, `iso_compare`, `iso_between` — per-target codegen |
| **Legacy ES6** | `lib/Time.rgr` | Host `Date` wrapper (ES6-only); prefer IsoDate for new code |
| **App domain** | e.g. RealTrainer `YearSheetPeriods` | Business rules on top of IsoDate |

## Usage

```rgr
Import "IsoDateLib.rgr"

def next (DateMath.addDays("2026-01-25" 7))
def week (IsoCalendar.getIsoWeekNumber("2026-02-09"))
def only (IsoDateParse.toIsoDateOnly("2026-02-09T14:30:00"))
```

Intrinsics desugar to stdlib on the `ranger` target; Kotlin uses `java.time.LocalDate`:

```rgr
def d (iso_add_days "2026-01-25" 7)
if (iso_between "2026-02-01" "2026-01-01" "2026-12-31") {
  print "in range"
}
```

## Host bridges (TypeScript, Swift UI)

Convert at the boundary only:

```ts
const iso = rangerResult.startDate; // string
const ui = new Date(iso + "T12:00:00"); // avoid TZ drift for date-only
```

## What not to do

- Do not parse dates with regex in app code — use `IsoDateParse`
- Do not use `Time.rgr` / `SystemDate` for shared portable logic
- Do not put app-specific period/sheet rules in `lib/IsoDate/`
