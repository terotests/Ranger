# The conformance contract

One spec, two adapters, one diff.

```
specs/*.json ──┬─→ ranger-adapter.cjs  → EVG controllers (Node, no browser)
               └─→ dom-adapter.mjs     → @radix-ui in Chromium
                          │
                     compare.mjs → divergences, or RESULT OK
```

Neither side gets to describe the test in its own terms: the fixture and the
input steps live in the spec, and both adapters build from it.

## A spec

```json
{
  "name": "toggle_collapsible",
  "fixture": {
    "controls": [
      { "type": "toggle", "tid": "toggle", "name": "Bold" },
      { "type": "toggle", "tid": "toggle-disabled", "name": "Italic", "disabled": true },
      { "type": "collapsible", "tid": "collapsible", "name": "Details", "body": "Hidden body" }
    ]
  },
  "steps": [
    { "click": "toggle" },
    { "click": "collapsible-trigger" },
    { "key": "Enter" }
  ]
}
```

A composite control derives its parts' test ids: a collapsible `x` owns
`x-trigger` and `x-content`.

Both adapters observe once before the first step and once after every step, so
a spec with *n* steps produces *n + 1* observations.

## The observation

Per test id, nine fields:

| Field | Ranger (EVG) | Radix (DOM) |
| --- | --- | --- |
| `role` | `EVGA11yRole.ariaName()` of the controller's row | explicit `role`, else the tag's implicit one, else `"none"` |
| `name` | the controller's accessible name | `aria-label`, else text content for a named role, else `""` |
| `state` | the `state-<value>` class | the `data-state` attribute |
| `expanded` | `EVGA11yTri` → `true` / `false` / `null` | `aria-expanded` → `true` / `false` / `null` |
| `pressed` | `EVGA11yTri` → `true` / `false` / `null` | `aria-pressed` → `true` / `false` / `null` |
| `disabled` | the controller's `disabled` | `disabled` or `aria-disabled` |
| `focused` | `UiHost.focusId` | `document.activeElement` |
| `visible` | reachable from the laid-out display tree | `getClientRects().length > 0` |

## Where the two are deliberately spelled differently

These are the only translations. Everything else is compared literally, and a
new one should be argued for in a pull request rather than added quietly.

1. **State.** Radix writes `data-state="open"`. EVG has no attribute bag and is
   styled by class, so a controller writes the class `state-open` (plus a
   component-scoped `ui-collapsible-state-open`, because `EVGStyleSheet`
   matches one class token per selector). Both report the bare word `open`.

2. **A wrapper's role.** Radix's `Collapsible.Root` is a plain `div` with no
   ARIA role; so is its EVG counterpart. Both report `"none"` rather than one
   side inventing a `group`.

3. **Hidden content.** Radix marks closed `Collapsible.Content` hidden, which
   removes it from the browser's accessibility tree and paints nothing. EVG has
   no `display:none` that also hides a node from the accessibility surface, so
   the controller detaches the element. Both report `visible: false` — the
   trace records what a user can reach, not how the node is stored.

## Running it

```bash
npm run ui:conformance:install   # once: react + @radix-ui + esbuild + playwright-core
npm run ui:conformance
```

Chromium is found via `$RANGER_CHROMIUM`, then `$PLAYWRIGHT_BROWSERS_PATH`,
then playwright's default. The Ranger adapter needs none of this and is what CI
runs, through `npm run ui:test`.

## Adding a component

1. Write the controller in `src/`, and give it `rows()` in ARIA terms.
2. Teach both adapters the new `type` — the Ranger one in
   `ranger-adapter.cjs`, the Radix one in `dom/app.jsx`.
3. Add a spec that drives it through every state you claim to support,
   including the disabled and keyboard paths.
4. Run `npm run ui:conformance`, and only then decide the component is done.

A component with no spec is not a component yet.
