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

A step is one of `{"click": tid}`, `{"key": name}`, `{"focus": tid}`,
`{"hover": tid}`, `{"unhover": true}` or `{"rightclick": tid}`. The last three
exist because three components have no other input at all: a tooltip and a
hover card open on the pointer arriving, and a context menu only on the
secondary button.

A drag is three steps, and there are two kinds of them:

- `{"press": tid, "at": 0.8}` then `{"dragto": 0.2}` then `{"release": true}`
  slides along the pressed element's own width. It is a fraction rather than a
  pixel because the two systems lay out differently on purpose, and it is what
  a slider needs.
- `{"press": tid}` then `{"dragover": tid}` then `{"release": true}` drags one
  thing ONTO another. No geometry at all: what is under the pointer is a test
  id, and each side resolves it with the same hit test a click uses.

`observe` names anything the spec wants looked at beyond the nodes themselves.
Today there is one: `"observe": ["announce"]` adds a node with the reserved id
`@announce` whose `name` is what the page's live region currently says.

It is opt-in, and the measurement says why. dnd-kit announces every stage of a
drag — "Draggable item a was moved over droppable area b." — and for a keyboard
drag that is the *entire* interaction: pressing an arrow changes nothing else
observable, because the item has not moved yet and the displacement is a
picture. Without this the spec would contain a step that cannot fail. It is not
global because Radix's toast also renders a live region, and what it says there
is a concatenation of nodes the trace already carries ("Notification SavedAll
goodUndo") — comparing that would be comparing one library's copy-writing.

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
| `togglegroup` | `x-<value>` per item |
| `toolbar` | `x-<value>` per button |
| `dialog` | `x-trigger`, `x-overlay`, `x-content`, `x-title`, `x-close` |
| `progress` | `x-indicator` |
| `aspectratio` | `x-outer` (the sized box), `x` (the ratio), `x-content` |
| `accessibleicon` | `x-glyph` |
| `avatar` | `x-fallback` |
| `alertdialog` | `x-trigger`, `x-overlay`, `x-content`, `x-title`, `x-description`, `x-cancel`, `x-action` |
| `popover` | `x-trigger`, `x-content`, `x-inner`, `x-close` |
| `tooltip` | `x-trigger`, `x-content` |
| `hovercard` | `x-trigger`, `x-content` |
| `dropdownmenu` | `x-trigger`, `x-content`, `x-item-<value>` per item |
| `contextmenu` | `x-trigger`, `x-content`, `x-item-<value>` per item |
| `slider` | `x-track`, `x-range`, `x-thumb` |
| `toast` | `x-trigger`, `x-region`, `x-viewport`, `x` (the toast), `x-title`, `x-description`, `x-action`, `x-close` |
| `sortable` | `x` (the list), `x-item-<value>` per item |

## The observation

Per test id, fifteen fields:

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
| `hidden` | inside no open modal, and not decoration | inside no `[aria-hidden="true"]` |
| `focused` | `UiHost.focusId` | `document.activeElement` |
| `visible` | reachable from the laid-out display tree | `getClientRects().length > 0` |
| `valuenow` | `UiRow.valueNow`, or null | `aria-valuenow` |
| `valuemin` | `UiRow.valueMin`, or null | `aria-valuemin` |
| `valuemax` | `UiRow.valueMax`, or null | `aria-valuemax` |
| `roledescription` | `UiRow.roleDescription`, or null | `aria-roledescription` |
| `posinset` | 1-based index among the rows sharing a parent | 1-based index among the tagged siblings |
| `parent` | `UiRow.parentTid` | the nearest tagged ancestor — **reported, not compared** |

The three numbers were added when `slider` was: none of the other twelve fields
changes as a slider moves, so the first captured trace showed five steps of a
thumb travelling from 0 to 100 with **not one observable difference**. They also
tightened `progress`, which had been compared on its state word alone.

`roledescription` and `posinset` arrived with the sortable, and each one exists
because without it a real behaviour was invisible. A dnd-kit item is a `button`
whose `aria-roledescription: sortable` is the whole affordance — a reader told
"button" learns nothing about being able to move the thing. And a reorder moves
*nothing else*: every other field of every item is identical before and after,
and the diff keys by test id, so the one thing the component does was the one
thing the harness could not see.

`posinset` is compared only between nodes that agree on a non-empty `parent`,
and the first run showed why. Radix portals a floating surface to the end of
the document, so the tooltip's content landed *after* the button beside it;
EVG keeps it the trigger's child and moves only where it is painted, so it
stayed where it was declared. Both are deliberate, and the order of unrelated
top-level controls is not a behaviour either way. Inside one control both sides
agree on the parent, and that is where a sortable's items live.

`valuenow` is null on an indeterminate progress bar, which reports a range with
no position in it. That absence is the contract: it is how every platform spells
"busy, length unknown", and a reader handed 0 instead says the work has not
started.

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

`unhover` moves the mouse to the corner **in steps**, for a related reason. A
tooltip keeps itself up over a "grace area" between the trigger and its content
and decides with `pointermove`, so a single teleporting move can land outside
the polygon without ever reporting a point beyond its edge — measured: the tip
stayed open through the whole spec.

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

3. **A modal, and how it masks.** Radix does NOT put `aria-modal` on its
   dialog; it puts `aria-hidden` on everything else, and that is what a reader
   observes, so `hidden` is compared and `aria-modal` is not. The EVG side
   raises `modal` on the dialog's row and `UiHost` marks everything outside
   its subtree hidden, which is also what `evg-a11y.js` needs to mask the
   mirror. Measured, not assumed: the first version set `aria-modal` on both
   sides and diverged.

4. **Hidden content.** Radix marks closed content hidden, which removes it from
   the browser's accessibility tree and paints nothing. EVG has no
   `display:none` that also hides a node from the accessibility surface, so the
   controller detaches the element. Both report `visible: false` — the trace
   records what a user can reach, not how the node is stored. The row is still
   reported either way, so "exists but is unreachable" stays distinguishable
   from "does not exist".

5. **A slider's disabled thumb.** The reference marks the slider's ROOT
   disabled and leaves the thumb — the node that carries `role="slider"` —
   without `aria-disabled`, taking it out of the tab order instead. Measured,
   and matched: parity means matching the reference as it behaves. Whether a
   slider role should say so is an argument for `ui:a11y`, which audits both
   sides with axe and currently minds neither.

## What had to be measured, not guessed

Every one of these came out of capturing the reference before writing the
controller, and each contradicts what the obvious implementation would do.

- **A tooltip has three state words.** Opened by the pointer it reports
  `delayed-open`; opened by focus, `instant-open`. Two words for "open",
  because a reader is told how the tip was summoned.
- **A menu does not wrap.** ArrowDown on the last item stays on the last item.
  `UiCtl.stepIndex` wraps, which is right for a radio group and wrong here, so
  `MenuCtl` has its own non-wrapping scan.
- **A menu opens focused on its surface**, not on its first item, and ArrowUp
  from there takes the LAST item.
- **ArrowUp on a slider means more.** `UiCtl.isNextKey`/`isPrevKey` answer
  "later in the list" and "earlier in the list", where ArrowUp is earlier. The
  harness caught the difference on the first run: the reference at 60, Ranger
  at 40.
- **A context menu's trigger has no role, no name and no `aria-expanded`**, and
  closing the menu leaves focus nowhere, because that trigger cannot take it.
- **A toast does not steal focus when it is raised**, and dismissing it with a
  button moves focus to the VIEWPORT rather than back to the trigger — but
  dismissing it with Escape leaves focus exactly where it was.
- **A toast's named landmark is a separate element** from the list inside it.
  The reference wraps its viewport in a `region` with an `aria-label`, and
  tagging only the list would have dropped the landmark from the comparison
  entirely.
- **A popover is not modal.** It has `role="dialog"` and takes focus, but
  everything behind it keeps its rows and its tab stops.

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
