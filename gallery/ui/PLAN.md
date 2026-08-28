# gallery/ui — plan

## Goal

Native EVG components good enough to replace the hand-built chrome in
`PptxApp`, with a Radix-measured definition of "good enough".

## Where it stands

**24 of 31 Radix components (77.4%)**, and **155 of 157 catalogued behaviours
(98.7%)** — 7860 observations, no divergences. Run `npm run ui:inventory` for
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
- [x] Twenty-four components at parity with their `@radix-ui` counterparts:
      toggle, collapsible, checkbox, switch, radio-group, tabs, accordion,
      toggle-group, toolbar, dialog, alert-dialog, popover, tooltip, hover-card,
      dropdown-menu, context-menu, slider, toast, label, separator, progress,
      aspect-ratio, accessible-icon, avatar
- [x] A pointer with no button: `hover`, `unhover` and `rightclick` steps in
      both adapters and in `UiHost`, without which a tooltip, a hover card and
      a context menu have no input at all
- [x] `valuenow` / `valuemin` / `valuemax` in the trace. The slider forced it:
      none of the other twelve fields changes as one moves, so the first
      captured oracle showed a thumb travelling from 0 to 100 with no
      observable difference at any step
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

## The overlay layer — half landed

Nine overlay components already behaved correctly — they open, take focus,
restore it, hide the page behind them and close on Escape — but they were
painted *in flow*, as ordinary children of their trigger's subtree. Behaviour
was at parity; presentation was not.

An overlay surface is **not a new element and not a portal**. It stays exactly
where it was put: still its parent's child, still the owner of its subtree, so
events, ownership and the accessibility walk keep working unchanged. Only
layout treats it differently. That is one flag on `EVGElement` and one pass in
`EVGLayout`, and it is why the menubar demo's *call sites* did not change when
it landed.

- [x] Out of flow: `isOverlay` makes `hasAbsolutePosition()` true, which reuses
      every size and spacing exclusion EVG already had. A menu is as wide as
      its trigger, not as wide as the panel hanging off it.
- [x] Positioning: a surface is anchored to a sibling carrying
      `overlay-anchor-role`, by `overlay-side` (top/bottom/left/right/center)
      and `overlay-align` (start/center/end) with an `overlay-gap`. Nothing
      joins the two by hand and no id is involved.
- [x] The subtree travels with the surface, so a surface **inside** a surface
      anchors to the moved rectangle — which is the whole reason a submenu
      needs no submenu case.
- [x] A surface with no anchor is **reported**, not silently drawn at (0,0),
      where it looks like a stylesheet mistake and is not one.
- [x] `width: fit-content`, which a floating panel needs and EVG did not have.
- [x] **Paint order.** `EVGDisplayList` defers every surface it meets and
      draws them after the whole normal tree, in the order they were reached —
      a stack, not a z-index, so there is no number to get wrong. Deferring is
      also what takes a surface out of an ancestor's `overflow: hidden`.
- [x] **Hit testing.** `EVGHitTest` builds the SAME list and scans it
      backwards, so topmost wins because topmost is last and there is one rule
      instead of two that can drift. Where the event then GOES is still the
      tree's business: an overlay never left it.
- [ ] **Collision handling:** flip and shift, so a surface near an edge is not
      drawn off the page.
- [ ] **Modal:** the same mechanism plus a backdrop and an inert page behind.
- [ ] Focus trap: Tab and Shift+Tab cycle inside the open dialog. Catalogued as
      `dialog.focus-trap` and disputed, because the harness has no Tab step to
      prove it with

Proof: `npm run evg:overlay:test` — 20 checks, each one shown to fail under a
mutation of the code it covers. The visible result is
`gallery/ui/demo/menubar.png`, rendered from `MenubarDemo.rgr`.

## Accessibility for a canvas, from the tree that drew it

A canvas contributes one empty graphic to the browser's accessibility tree no
matter what was drawn into it, so an EVG app has to publish what the frame
MEANS as well as what it looks like. The question is where that second
description comes from, and there is only one answer that does not rot: the
declaration that built the picture.

- [x] `EVGElement` carries `role` and the ARIA states beside `className` —
      the same element says what it looks like and what it is.
- [x] `EVGA11yFromTree` walks a laid-out tree and emits the nodes: only
      elements with a role, parented to the nearest ANCESTOR with a role, named
      by `aria-label` or by the text of the roleless descendants (so a row of
      Label + Shortcut announces as "New Tab ⌘ T"), placed at the rectangle
      layout computed — surfaces included, at the position the overlay pass
      moved them to.
- [x] The demo page mounts `evg-a11y.js` over its canvas, and a reader
      activating a node is answered by pressing the app at that node's
      rectangle: the same path the mouse takes, so there is no second set of
      commands to keep in step.
- [x] `npm run ui:demo:a11y` — `EVGA11yTree.lint()` plus axe-core over the
      mirror, in five states. Shown to fail: taking the label off the rows
      produces both a lint failure and axe's `aria-command-name`.

Two bugs in the shared mirror came out of wiring it to a real app, and both
were invisible to the audit page that had no input:

- a click on a mirrored node bubbled through the nested ancestors, and each
  one's handler pressed the app at ITS OWN centre — one activation on a menu
  row became three;
- `aria-expanded` was never mirrored, so a trigger could not tell a reader
  whether it was already open.

`UiHost` still builds its accessible tree from controller rows, which is right
for a controller: it knows things the tree does not, like what a key will do
next. Everything else should derive.

`EVGWindow` already implements a modal dialog with focus and key handling, and
`EVGToolbar` already hand-rolls an overlay pass for its dropdown. Folding those
into this layer is the work, rather than adding a third.

The seven components still missing are `form`,
`one-time-password-field`, `password-toggle-field`, `menubar`, `select`,
`navigation-menu` and `scroll-area`. Three of those need a text field, two need
typeahead and submenus, and one needs pointer drag — so the next component is
cheapest after a `textfield` primitive, not after more overlay work.

## Next — the playground

Driving all 45 specs through the page found four bugs in the page itself, none
of which the headless gate could see, and each of which made it report
agreement that was not there:

- the live view wedged shut after the first spec change, so the panel scored a
  trace from before the switch — under a green "traces agree";
- the DOM→EVG bridge listened for `click`, but a menu opens on `pointerdown`
  and portals its surface under the cursor, so the click landed on the menu and
  the EVG side never opened at all;
- Radix's controls are uncontrolled, so switching specs left the previous
  spec's state on the reference side while the EVG host was rebuilt fresh;
- the replay had no `focus` branch, so specs that begin by focusing something
  passed by mutual inaction.

What is left:

- [ ] Replaying an `unhover` step cannot close a tooltip: the grace area is
      left by a real pointer move, and no synthetic event reproduces it. The
      page says so where it matters; hovering by hand works and agrees
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
