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
observe. After every input step both sides report the same eleven fields per
test id — role, name, state, expanded, pressed, checked, selected, disabled,
tabstop, focused, visible — and the harness diffs the traces.

```bash
npm run ui:test          # controllers + cascade, no browser, runs in CI
npm run ui:report        # the scorecard, against real Radix in Chromium
npm run ui:conformance   # the same run, printed as divergences
```

The browser side needs the reference host installed once — `ui:web` and
`ui:report` both say so by name if it is missing:

```bash
npm run ui:conformance:install   # react + @radix-ui + esbuild + playwright-core
```

## Trying it in a browser

```bash
npm run ui:conformance:install   # once
npm run ui:web                   # builds, serves, prints the URL
```

Radix on the left, Ranger's EVG controllers painted by `gallery/evg/gl` on the
right, and the live trace below with every divergence highlighted. Pick any
fixture, click or type on either side, or replay a spec's own steps.

Clicking the canvas runs the **real EVG hit test** — coordinates to a test id,
innermost control wins — which is the one part of a host the headless gate
cannot exercise, because it drives controllers by id.

It is a playground, not the gate. The keyboard is genuinely shared (one key
event, both sides handle it), but the pointer has to be *mirrored* between two
independent hosts, and a mirrored click is a simulation of a click. Treat what
you see here as a lead and confirm it with `npm run ui:report`.

## The score

`behaviours.json` is the catalogue: every behaviour this kit intends to match,
written down as intent. It is the denominator — **cataloguing a component
nobody has built lowers the score**, which is the only way a number like this
stays honest.

```
component      specs  behaviours   coverage    parity  observations
────────────────────────────────────────────────────────────────────────
toggle            3        8/ 8  100.0%  100.0%       165/165
collapsible       3        7/ 7  100.0%  100.0%       330/330
checkbox          4        7/ 7  100.0%  100.0%       198/198
radiogroup        3        8/ 9   88.9%   88.9%       407/407
tabs              2        8/ 8  100.0%  100.0%       638/638
accordion         2        6/ 6  100.0%  100.0%       616/616
switch            2        5/ 5  100.0%  100.0%       132/132
dialog            0        0/ 6    0.0%    0.0%             —
────────────────────────────────────────────────────────────────────────
TOTAL            19       49/56   87.5%   87.5%     2486/2486
```

Three numbers, because one hides too much. **Coverage** is how much of the
catalogue any spec touches at all — until it is high, the rest is not
trustworthy. **Parity** is the headline: behaviours a spec exercises *and* that
agree with Radix on every observation. **Observation parity** counts matching
fields, so progress shows up between whole behaviours flipping green. A
divergence profile says which *kind* of thing is wrong — focus, aria,
visibility — which is usually what says where to work next.

`baseline.json` is checked in and compared on every run, so a pull request
shows the score moving and a regression fails the run.

A regression names itself:

```
FAIL toggle_disabled  (1 divergences)
  click toggle-disabled :: collapsible-trigger.focused  ranger=true radix=false
```

Two things the harness found that are worth knowing before trusting any
number like the above:

- **The oracle has to settle.** Playwright returns when the event is
  dispatched, but React 18 commits later. Observing immediately produced
  *different oracles on different runs* of the same spec. The DOM adapter now
  waits two frames.
- **The reference is not always self-consistent.** Radix's radio group moves
  selection with the arrow keys on some presses and not others. That one is
  catalogued as disputed with its evidence rather than scored either way —
  see [`conformance/SPEC.md`](conformance/SPEC.md).

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

### What the playground pushed back into EVG

Two documented EVG attributes turned out to be inert, and the playground is
what made that visible — a disabled control that would not dim, and a tab strip
that would not sit on one line:

- **`opacity`** was stored on `EVGElement`, listed in `evg/SPEC.md`, and set by
  `rangerflow`'s fade highlighter and `book`'s slabs — but nothing ever read
  it, so the emitted alpha was always 1. `EVGDisplayList` now scales the alpha
  of everything an element and its subtree emit, so every painter gets it: it
  is only numbers in the display list. Nested fades multiply.
- **`border`**, the shorthand, was dropped in silence — the stylesheet
  reported no error and no border appeared, while `border-width` plus
  `border-color` worked fine. `EVGElement` now parses it in any order
  (`1px solid #cbd5e1`, `#cbd5e1 solid 2px`), takes `none` as a clear, and
  accepts-and-ignores the style keyword, since EVG strokes one way.
- **`inline`** is still inert: parsed into `isInline`, never read by
  `EVGLayout`. Use `display: flex` with `flex-direction`, which EVG does
  support in full (gap, wrapping, `justify-content`, `align-items`).

The pattern is worth naming: a CSS property that parses, stores, and does
nothing is the most expensive kind of bug, because everything looks right
until you compare against a reference. Three of them turned up in one
afternoon of putting EVG next to Radix.

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
| `src/ToggleCtl.rgr` | Two-state button — `@radix-ui/react-toggle` |
| `src/CollapsibleCtl.rgr` | Trigger + content — `@radix-ui/react-collapsible` |
| `src/CheckboxCtl.rgr` | Tri-state checkbox, and the switch that is one without the mixed state |
| `src/RadioGroupCtl.rgr` | Roving focus, arrow keys, disabled items skipped |
| `src/TabsCtl.rgr` | Tab strip and panels — only the active panel is in the tree |
| `src/AccordionCtl.rgr` | Single-open sections — `@radix-ui/react-accordion` |
| `src/UiHost.rgr` | Root tree, focus, stylesheet, input routing, the trace |
| `conformance/` | The catalogue, specs, both adapters, the diff and the scorecard |
| `web/` | The browser playground (`npm run ui:web`) |
| `theme/base.css` | The class-first theme |

## Related

- [`gallery/evg/`](../evg/) — layout, display list, `EVGStyleSheet`, `EVGA11yTree`
- [`gallery/evg/EVGWindow.rgr`](../evg/EVGWindow.rgr) — the controller shape this follows
- [`gallery/css/CssCore.rgr`](../css/CssCore.rgr) — selector specificity, for the theme work
- [`gallery/game_engine/ui/`](../game_engine/ui/) — focus and keyboard, still SoftCanvas-bound

Roadmap: [`PLAN.md`](PLAN.md).
