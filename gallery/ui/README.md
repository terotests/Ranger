# gallery/ui — EVG controllers, measured against Radix

An **anchor for building native EVG components**: a small set of controllers
that mutate an EVG display tree, plus a harness that checks their behaviour
against real [Radix](https://www.radix-ui.com/) components running in a browser.

**License: AGPL-3.0-or-later** (Gallery).

## Why this exists

The pptx chrome is 5 800 lines of hand-built widgets inside one class. Making
that modern needs composable components — and building components with no
reference is how you discover, two years later, that your menu never had
keyboard support and your toggle never told a screen reader anything.

Radix is the reference. Not to copy: **to measure against**. It is the
best-specified unstyled component set there is, and the questions it answers —
what does focus do here, what does a disabled control do when you click it,
what does the accessibility tree say when this is closed — are exactly the
questions a native EVG kit has to answer too.

## What this is NOT

Not a React clone. An earlier draft of this module reimplemented
`createElement`, `Fragment` and `useState` over a virtual tree so components
could be shared with React DOM. That was dropped: the DOM bridge it implies is
large, slow and beside the point. Ranger and React have nothing in common
underneath, and pretending otherwise buys an API surface nobody needs.

EVG is a **display list**. Controllers own a subtree of it and mutate it in
place. There is no virtual DOM, no reconciler, no hooks, and no render pass.

```
   ToggleCtl / CollapsibleCtl        ← state lives in the controller
            │  mutates
            ▼
      EVGElement tree                ← retained; classes carry state
            │
      EVGStyleSheet.applyTree()      ← class-first theming
            │
      EVGLayout → EVGDisplayList
            │
   WebGL · SDL+GL · SoftCanvas · PDF · HTML
```

## Behaviour parity, not pixel parity

The two systems lay out differently on purpose, so comparing pixels would only
measure the font rasteriser. What they *must* agree on is what a user can
observe. After every input step both sides report the same nine fields per test
id — role, name, state, expanded, pressed, disabled, focused, visible — and the
harness diffs the traces.

```bash
npm run ui:test          # controllers + cascade, no browser, runs in CI
npm run ui:trace         # print the Ranger behaviour trace for a spec
npm run ui:conformance   # diff Ranger against real Radix in Chromium
```

`ui:conformance` needs the reference host installed once:

```bash
npm run ui:conformance:install   # react + @radix-ui + esbuild + playwright-core
```

A passing run looks like:

```
PASS toggle_collapsible  (7 steps, 35 observations)
RESULT OK
```

and a regression names itself:

```
FAIL toggle_collapsible  (1 divergences)
  click toggle-disabled :: collapsible-trigger.focused  ranger=true radix=false
```

See [`conformance/SPEC.md`](conformance/SPEC.md) for the trace contract and the
handful of places where the two systems are deliberately spelled differently.

## Class-first styling, inline still allowed

A controller never names a colour. It writes class names, and an
`EVGStyleSheet` decides what they mean — including a `.theme-dark` scope:

```css
.ui-toggle          { background-color: #e2e8f0; color: #0f172a }
.ui-toggle-state-on { background-color: #2563eb; color: #ffffff }

.theme-dark .ui-toggle { background-color: #1e293b; color: #e2e8f0 }
```

Interaction state travels as a `state-<value>` class — this system's spelling
of Radix's `data-state="<value>"`, and the hook a theme styles.

Inline attributes stay legal for the one-offs a sheet cannot express. They go
through `UiTree.inline()`, which writes the attribute **and** calls
`markInline()`, so the cascade ranks them above every sheet rule — the same
contract `JSXToEVG` and `ComponentEngine` already use.

```ranger
UiTree.inline(el "background-color" "#ff0000")   ; wins over any rule
```

### Known limit, and the first thing Tailwind theming would have to lift

`EVGStyleSheet` matches **one class token per selector** — `.a`, or
`.theme-x .a`. There is no `.ui-toggle.state-on`, so state variants are scoped
class names (`.ui-toggle-state-on`) instead of compound selectors. A real
utility-class theme needs compound and attribute selectors; `gallery/css`'s
`CssCore` already has selector specificity and would be the place to start.

## Modules

| File | Role |
| --- | --- |
| `src/UiTree.rgr` | Class helpers, `state-*` classes, inline+markInline, subtree edits |
| `src/UiCtl.rgr` | The controller convention, and the ARIA row a controller reports |
| `src/ToggleCtl.rgr` | Two-state button — parity target `@radix-ui/react-toggle` |
| `src/CollapsibleCtl.rgr` | Trigger + content — parity target `@radix-ui/react-collapsible` |
| `src/UiHost.rgr` | Root tree, focus, stylesheet, input routing, the trace |
| `conformance/` | Specs, both adapters, the diff |
| `theme/base.css` | The class-first theme |

## Related

- [`gallery/evg/`](../evg/) — layout, display list, `EVGStyleSheet`, `EVGA11yTree`
- [`gallery/evg/EVGWindow.rgr`](../evg/EVGWindow.rgr) — the controller shape this follows
- [`gallery/css/CssCore.rgr`](../css/CssCore.rgr) — selector specificity, for the theme work
- [`gallery/game_engine/ui/`](../game_engine/ui/) — focus and keyboard, still SoftCanvas-bound

Roadmap: [`PLAN.md`](PLAN.md).
