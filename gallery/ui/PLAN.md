# gallery/ui — plan

## Goal

Native EVG components good enough to replace the hand-built chrome in
`PptxApp`, with a Radix-measured definition of "good enough".

## Done

- [x] Controller convention: own a subtree of the display tree, mutate it,
      report ARIA rows (`UiCtl`)
- [x] Class-first styling with `state-*` classes; inline attributes still legal
      and still winning (`UiTree.inline` + `markInline`)
- [x] Theme scoping through `EVGStyleSheet` (`.theme-dark .ui-toggle`)
- [x] `ToggleCtl` at parity with `@radix-ui/react-toggle`
- [x] `CollapsibleCtl` at parity with `@radix-ui/react-collapsible`
- [x] Conformance harness: one spec, two adapters, a trace diff
- [x] Offline suite in CI (`ui:test`, wired into `gallery:editors:test`)

## Next — more surface, same method

Each of these lands with a spec, or it does not land.

- [ ] `TabsCtl` — roving focus, arrow keys, `aria-selected`
- [ ] `DialogCtl` — modal, focus trap, restore focus on close, Escape
- [ ] `DropdownCtl` — an overlay layer with z-order, dismiss-on-outside
- [ ] `CheckboxCtl` / `RadioGroupCtl` — the tri-state `checked` path
- [ ] Composition: a Slot/`asChild` equivalent, so a controller can merge its
      props and classes into a caller's element instead of wrapping it

## Next — the styling engine

The harness already names the limit: `EVGStyleSheet` matches one class token
per selector, so there are no compound or attribute selectors, and no real
utility-class theme.

- [ ] Move the cascade onto `gallery/css/CssCore`, which already has selector
      specificity
- [ ] Compound selectors (`.ui-toggle.state-on`), then attribute selectors
- [ ] A generated Tailwind-subset utility sheet + theme tokens on top of that

## Next — the actual point

- [ ] Port one `PptxApp` surface (the dialogs first: modal + focus trap +
      keyboard is where hand-built chrome hurts most) onto these controllers
- [ ] Fold `EVGToolbar`'s hand-rolled `openMenu` overlay into the layer the
      dropdown work introduces, rather than leaving two of them
- [ ] Lift focus and key routing out of `game_engine/ui/UILayer`, which is
      SoftCanvas-bound, so games and documents share one focus model

## Deliberately not doing

- A React-compatible API. It was tried in the first draft of this module and
  removed: the DOM bridge is large and slow, and the two systems share nothing
  underneath. React is the measuring stick, not the model.
- Pixel comparison. The layout engines differ by design; only behaviour is
  meaningfully comparable.
