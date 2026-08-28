# The conformance contract

One spec, two adapters, one diff — and a score.

```
specs/*.json ──┬─→ ranger-adapter.cjs  → EVG controllers (Node, no browser)
               └─→ dom-adapter.mjs     → @radix-ui in Chromium
                          │
              compare.mjs → divergences
              report.mjs  → coverage / parity / observations, vs baseline.json
```

Neither side gets to describe the test in its own terms: the fixture and the
input steps live in the spec, and both adapters build from it.

## A spec

```json
{
  "name": "radiogroup_arrow_next",
  "component": "radiogroup",
  "behaviours": ["arrow-next", "arrow-wraps", "disabled-skipped"],
  "fixture": {
    "controls": [
      {
        "type": "radiogroup", "tid": "rg", "name": "Size", "value": "s",
        "items": [
          { "value": "s", "name": "Small" },
          { "value": "m", "name": "Medium", "disabled": true },
          { "value": "l", "name": "Large" }
        ]
      }
    ]
  },
  "steps": [{ "click": "rg-s" }, { "key": "ArrowDown" }, { "key": "ArrowDown" }]
}
```

`behaviours` must name entries from `behaviours.json`; `report.mjs` refuses a
spec that invents one, so the catalogue cannot rot quietly. Specs are kept
small — one behaviour group each — because a failure marks exactly the
behaviours the failing spec claimed.

Both adapters observe once before the first step and once after every step, so
a spec with *n* steps produces *n + 1* observations.

### Test ids for composite controls

Both adapters derive these identically. A control `x`:

| Control | Parts |
| --- | --- |
| `collapsible` | `x-trigger`, `x-content` |
| `radiogroup` | `x-<value>` per item |
| `tabs` | `x-list`, `x-tab-<value>`, `x-panel-<value>` |
| `accordion` | `x-<value>`, `x-<value>-trigger`, `x-<value>-content` |

## The observation

Per test id, eleven fields:

| Field | Ranger (EVG) | Radix (DOM) |
| --- | --- | --- |
| `role` | `EVGA11yRole.ariaName()` of the controller's row | explicit `role`, else the tag's implicit one, else `"none"` |
| `name` | the controller's accessible name | `aria-label`, else text content for a named role, else `""` |
| `state` | the `state-<value>` class | the `data-state` attribute |
| `expanded` | `EVGA11yTri` | `aria-expanded` |
| `pressed` | `EVGA11yTri` | `aria-pressed` |
| `checked` | `EVGA11yTri` | `aria-checked` |
| `selected` | `EVGA11yTri` | `aria-selected` |
| `disabled` | the controller's `disabled` | `disabled` or `aria-disabled` |
| `tabstop` | `UiRow.tabStop` | `tabIndex >= 0 && !disabled` |
| `focused` | `UiHost.focusId` | `document.activeElement` |
| `visible` | reachable from the laid-out display tree | `getClientRects().length > 0` |

Tri-states carry `true`, `false`, `"mixed"` or `null`. `null` means "not
applicable" — `aria-checked="false"` on something that is not checkable makes a
screen reader announce a control that does not exist, so the absence is part of
the contract, not a missing value.

`tabstop` is what makes roving focus observable: a composite that roves keeps
exactly one of its items true.

## Settling before observing

The DOM adapter waits two animation frames after every action before it looks.
Without that it observes a half-committed DOM: Playwright returns as soon as
the event is dispatched, but React 18 flushes state in a later task, and the
same spec then produces **different oracles on different runs**. This was
measured, not assumed — before the wait, two consecutive runs of the same
radio-group spec disagreed about which item was selected. An unsettled oracle
turns the whole benchmark into a race detector.

The Ranger side has no async, so it is settled by construction.

## Where the two are deliberately spelled differently

These are the only translations. Everything else is compared literally, and a
new one should be argued for in a pull request rather than added quietly.

1. **State.** Radix writes `data-state="open"`. EVG has no attribute bag and is
   styled by class, so a controller writes the class `state-open` (plus a
   component-scoped `ui-collapsible-state-open`, because `EVGStyleSheet`
   matches one class token per selector). Both report the bare word `open`.

2. **A wrapper's role.** Radix's `Collapsible.Root`, `Tabs.Root` and
   `Accordion.Item` are plain `div`s with no ARIA role; so are their EVG
   counterparts. Both report `"none"` rather than one side inventing a `group`.

3. **Hidden content.** Radix marks closed content hidden, which removes it from
   the browser's accessibility tree and paints nothing. EVG has no
   `display:none` that also hides a node from the accessibility surface, so the
   controller detaches the element. Both report `visible: false` — the trace
   records what a user can reach, not how the node is stored. The row is still
   reported either way, so "exists but is unreachable" stays distinguishable
   from "does not exist".

## Disputed: `radiogroup.arrow-selects`

The WAI-ARIA radio pattern says an arrow key moves focus **and** selection.
`@radix-ui/react-radio-group` does not do this consistently, so there is no
single behaviour to be at parity with, and the catalogue marks it disputed
rather than scoring it either way.

Measured, in Chromium, settled two frames and again after 500 ms:

```
click rg-s   → s selected, s focused
ArrowDown    → focus moves to l,  selection stays on s
ArrowUp      → focus moves to s,  selection stays on s
ArrowDown    → focus moves to l,  selection moves to l
```

The first two arrow presses after a pointer click move focus alone; every press
after that moves both. Reproduced with a two-item and a three-item group, and
with the React root mounted on `#root` and directly on `document.body`, so it
is not an artefact of the harness or of where the app is mounted.

`RadioGroupCtl` therefore moves focus and the roving tab stop but not the
selection, matching the reference's stable region, and the specs stop at two
arrow presses. If a Radix upgrade settles this, the harness will say so — the
`arrow-selects` behaviour is in the catalogue waiting for a spec.

## Running it

```bash
npm run ui:conformance:install   # once: react + @radix-ui + esbuild + playwright-core
npm run ui:conformance           # divergences
npm run ui:report                # the scorecard, compared with baseline.json
npm run ui:report:baseline       # record a new baseline after real progress
```

Chromium is found via `$RANGER_CHROMIUM`, then `$PLAYWRIGHT_BROWSERS_PATH`,
then playwright's default. The Ranger adapter needs none of this and is what CI
runs, through `npm run ui:test`.

## Adding a component

1. Catalogue its behaviours in `behaviours.json` first. The score drops — that
   is the point: the denominator is the intent, not the work already done.
2. Add it to the Radix playground in `dom/app.jsx` and capture what the
   reference actually does. Do not write the controller against what you
   assume Radix does.
3. Write the controller in `src/`, and give it `rows()` in ARIA terms.
4. Teach `ranger-adapter.cjs` the new fixture `type`.
5. Write one spec per behaviour group, including the disabled and keyboard
   paths.
6. Run `npm run ui:report`, and only then decide the component is done.

A component with no spec is not a component yet.
