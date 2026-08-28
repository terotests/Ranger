# gallery/ui — plan

## Goal

Native EVG components good enough to replace the hand-built chrome in
`PptxApp`, with a Radix-measured definition of "good enough".

## Where it stands

**16 of 31 Radix components (51.6%)**, and **88 of 90 catalogued behaviours
(97.8%)** — 3756 observations, no divergences. Run `npm run ui:inventory` for
the first number and `npm run ui:report` for the second.

- [x] Controller convention: own a subtree of the display tree, mutate it,
      report ARIA rows (`UiCtl`)
- [x] Class-first styling with `state-*` classes; inline attributes still legal
      and still winning (`UiTree.inline` + `markInline`)
- [x] Theme scoping through `EVGStyleSheet` (`.theme-dark .ui-toggle`)
- [x] Conformance harness: one spec, two adapters, a trace diff
- [x] Metrics: a behaviour catalogue as the denominator, coverage / parity /
      observation scores, a divergence profile, and a baseline that fails the
      run on a regression
- [x] Sixteen components at parity with their `@radix-ui` counterparts: toggle,
      collapsible, checkbox, switch, radio-group, tabs, accordion, toggle-group,
      toolbar, dialog, label, separator, progress, aspect-ratio,
      accessible-icon, avatar
- [x] A modal that takes focus, restores it on Escape, and hides the page
      behind it from the accessibility tree
- [x] Offline suite in CI (`ui:test`, wired into `gallery:editors:test`)
- [x] Coordinate hit testing (`UiHost.hitTest` / `pointerDown`), innermost wins
- [x] A browser playground (`npm run ui:web`) running both hosts side by side
- [x] `opacity` honoured in `EVGDisplayList` — it was documented, set by
      rangerflow and book, and read by nothing
- [x] The `border` shorthand parsed in `EVGElement` — it used to vanish
      without a stylesheet error
- [x] `UiHost.a11yTree()` — a real `EVGA11yTree`, so `evg-a11y.js` can mirror
      it into DOM and axe-core can audit it
- [x] `ui:a11y`: axe-core over both systems, display-list contrast, and the
      structural lint offline in CI
- [x] `ui:inventory`: the Radix denominator derived from npm, with an
      unclassified package failing the run

## Next — the overlay layer

The inventory says where the leverage is: **11 of the 24 missing components are
waiting on one overlay layer** — dialog, alert-dialog, popover, tooltip,
hover-card, dropdown-menu, context-menu, menubar, navigation-menu, select,
toast. Four of those additionally need typeahead and submenus, seven need a
focus trap.

`dialog` is the smallest of them and the one already catalogued, so it is the
way in:

- [ ] An overlay layer with z-order, so a dialog paints above the page
- [ ] Focus trap: Tab and Shift+Tab cycle inside the open dialog
- [ ] Focus restore: closing returns focus to the trigger
- [ ] Escape closes
- [ ] `modal` on the accessibility row

`EVGWindow` already implements a modal dialog with focus and key handling, and
`EVGToolbar` already hand-rolls an overlay pass for its dropdown. The dialog
work should fold those together rather than adding a third.

## Next — the playground

- [ ] Drive the pointer on the Radix side through real events instead of
      `focus()` + `click()`, so the page stops simulating in that direction
- [ ] Keep a divergence history, so a transient disagreement is not lost on the
      next interaction

## Next — Tab itself

`tabstop` is reported and scored, but nothing yet *presses* Tab: the harness
has no `{ "tab": true }` step. Roving focus is therefore verified by where the
tab stop sits, not by where Tab lands. Adding the step would also need a
document-order focus model in `UiHost`.

## Next — the styling engine

`inline` is still parsed into `EVGElement.isInline` and never read by
`EVGLayout`. Either make it work or take it out of `evg/SPEC.md`; a documented
attribute that does nothing costs an afternoon every time someone believes it.


The harness already names the limit: `EVGStyleSheet` matches one class token
per selector, so there are no compound or attribute selectors, and no real
utility-class theme.

- [ ] Move the cascade onto `gallery/css/CssCore`, which already has selector
      specificity
- [ ] Compound selectors (`.ui-toggle.state-on`), then attribute selectors
- [ ] A generated Tailwind-subset utility sheet + theme tokens on top of that

## Next — the actual point

- [ ] Port one `PptxApp` surface onto these controllers. The dialogs first:
      modal + focus trap + keyboard is where hand-built chrome hurts most, and
      it is the same work the `dialog` component needs
- [ ] Fold `EVGToolbar`'s hand-rolled `openMenu` overlay into that layer
- [ ] Lift focus and key routing out of `game_engine/ui/UILayer`, which is
      SoftCanvas-bound, so games and documents share one focus model

## Open question, not a task

`radiogroup.arrow-selects` is catalogued as disputed: the reference moves
selection with the arrow keys on some presses and not others, so there is no
consistent behaviour to match. Ranger currently follows the reference's stable
region (focus moves, selection does not), which is *not* the WAI-ARIA radio
pattern. Deciding to follow the spec instead is a product call, and the
evidence for it is in `conformance/SPEC.md`.

## Deliberately not doing

- A React-compatible API. It was tried in the first draft of this module and
  removed: the DOM bridge is large and slow, and the two systems share nothing
  underneath. React is the measuring stick, not the model.
- Pixel comparison. The layout engines differ by design; only behaviour is
  meaningfully comparable.
