# traffic

## What this app is for

A traffic screen for one city: where you are going, how long it takes, and the
routes you saved. Three screens and a bottom nav — it is the fixture the app
tool is checked against, so it stays small enough to read in one sitting and
real enough to contain every shape the tool checks.

<!-- evg_app:generated — rewritten by `evg_app memo`; edit above and below, not here -->

## The screens

| state | page | takes | pressable |
| --- | --- | --- | --- |
| `map` | pages/map.evg.json | `nav.routes`, `nav.settings`, `nav.map` | `nav.map`, `nav.routes`, `nav.settings` |
| `routes` | pages/routes.evg.json | `nav.map`, `nav.settings`, `route.add`, `nav.routes` | `route.add`, `nav.map`, `nav.routes`, `nav.settings` |
| `settings` | pages/settings.evg.json | `nav.map`, `nav.routes`, `nav.settings` | `nav.map`, `nav.routes`, `nav.settings` |

## The data model

| key | in the initial context | written by | read by |
| --- | --- | --- | --- |
| `trips` | true | route.add | routes |

<!-- /evg_app:generated -->

## Decisions

- **Each state takes its own nav event and ignores it.** Pressing the tab you
  are already on is inert, and the alternative — a tab with no `id` — would be
  a button that looks pressable and is not. `check` refuses to let it be
  neither.
- **`trips` is stored, not counted.** There is no list of routes in the
  context to count; when there is one, this key goes away and the page reads
  the list's length instead.
- **The nav is `left: 0px`, not `left: 12px`.** An absolute child is measured
  from inside the parent padding, so asking for the padding again moves it one
  padding to the right of the cards it floats over.
