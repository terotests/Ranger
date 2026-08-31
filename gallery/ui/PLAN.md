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
- [x] **Collision handling:** a surface whose side does not fit FLIPS to the
      other side of its anchor, then SHIFTS along the edge to stay on the page.
      Where neither side fits, the roomier one wins and the surface is clamped
      — it then covers its anchor, which is what a browser does too: showing
      the rows is worth more than the gap. The side it ended up on is published
      as `overlayPlacedSide`, the way Radix publishes `data-side`. Visible in
      the demo: put the bar at the bottom and the menus open upwards.
- [x] **Modal:** the same mechanism. `overlay-side: cover` is the backdrop —
      the page, sized by the layout pass because a percentage resolves against
      the parent, and the parent of a dialog is whatever part of the page
      declared it. The content is `center`. With paint-order hit testing the
      backdrop is also what a click outside lands on, which is what makes a
      modal modal rather than a thing that looks like one.
- [ ] Focus trap: Tab and Shift+Tab cycle inside the open dialog. Catalogued as
      `dialog.focus-trap` and disputed, because the harness has no Tab step to
      prove it with

Proof: `npm run evg:overlay:test` — 42 checks, each one shown to fail under a
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

**The controllers are on it.** `UiTree.anchor()`, `UiTree.surface()` and
`UiTree.backdrop()` are the whole API, and each controller uses two lines of
it: popover, dropdown menu, context menu, tooltip and hover card anchor their
panel to their trigger; dialog and alert dialog take a backdrop and centre.
Nothing else in those files changed — the surface is still the trigger's
sibling, so focus, Escape, `hidden` and the accessibility walk work exactly as
they did.

The oracle for that was the conformance trace, and it is the useful result:
**46/46 specs still agree, and none of the 15 observed fields moved.** The
panels stopped pushing the page down and started floating, and nothing a user
can observe about behaviour changed. `UiHost.hitTest` now scans the same paint
order backwards, so a click on an open panel reaches the panel and not the
trigger beside it.

`EVGWindow` still implements its own modal dialog with focus and key handling,
and `EVGToolbar` still hand-rolls an overlay pass for its dropdown. Folding
those two into this layer is what is left.

The seven components still missing are `form`,
`one-time-password-field`, `password-toggle-field`, `menubar`, `select`,
`navigation-menu` and `scroll-area`. Three of those need a text field, two need
typeahead and submenus, and one needs pointer drag — so the next component is
cheapest after a `textfield` primitive, not after more overlay work.

## Sortable — the first control whose reference is not Radix

Radix has no sortable. ReUI's is `@dnd-kit/sortable` underneath, and so is
every other in the shadcn family, so dnd-kit is the oracle and gets exactly the
treatment Radix gets: the real library in a real browser, one fixture, one
diff. It is in the trace as `sortable`, kept out of the Radix coverage fraction
by a `beyond` bucket in `radix-inventory.json` — a component the denominator
never contained must not inflate the number.

The oracle was captured before a line of `SortableCtl` existed, and it said
immediately that the harness could not see a sortable at all:

- [x] **`roledescription`.** Every dnd-kit item is a `button` carrying
      `aria-roledescription: sortable`, and that is the whole affordance: a
      reader told "button" learns nothing about being able to move the thing.
      Now a field on `UiRow`, on `EVGA11yNode`, on `EVGElement`, and mirrored
      as the real attribute by `evg-a11y.js`.
- [x] **`posinset`.** A reorder moves *nothing else* — every other field of
      every item is identical before and after, and `diffNodes` keys by test
      id. The one thing the component does was invisible.
- [x] **The announcement.** A keyboard drag's arrow step changes nothing
      observable: the item has not moved and the displacement is a picture.
      `"observe": ["announce"]` puts the live region in the trace as a node, so
      that step can fail.
- [x] **A drag onto something.** The harness had `dragto: <fraction>`, which is
      a slider's gesture. `dragover: <tid>` needs no geometry at all — what is
      under the pointer is a test id, resolved by the same hit test a click
      uses.

`posinset` found a divergence on its first run and it was not a bug: the
tooltip's content was 2nd on the Ranger side and 3rd on the Radix side, because
Radix portals a floating surface to the end of the document while EVG keeps it
the trigger's child. Position is therefore compared only inside a control,
where both sides agree on the parent.

The controller is 300 lines with no drag machinery in it. The interesting part
is what it does NOT do: `rows()` reports the committed order while `build()`
draws the prospective one, because dnd-kit leaves the DOM alone during a drag
and moves items with transforms. What a reader is told and what the eye sees
come apart on purpose, and only the drop reconciles them.

Live in the playground: press an item on the canvas and drag it onto another,
or click one and use Space / arrows / Escape. Both sides reorder together, and
the panel says "traces agree" at every step.

## Four more components, and the blockers that had held them

The overlay layer and the pointer drag cleared what the plan said was in the
way, so the four they were blocking are in: **menubar**, **navigation-menu**,
**select** and **scroll-area**. Radix coverage is **28/31, 90.3%**, and the
three still missing — `form`, `one-time-password-field`,
`password-toggle-field` — all want the same thing, a text field.

Each one was captured from the real component before a line of the controller
existed, and each one corrected something that had been written from
assumption:

- **menubar** is not a row of dropdowns. An arrow at the top level moves which
  menu is OPEN, not which trigger has focus, and the BAR holds the tab stop
  until a menu has been opened — after that the one that was opened keeps it.
  Passed on the first comparison run.
- **navigation-menu** is deliberately not a menubar: triggers are `button`s,
  every one of them is a tab stop, and opening a panel LEAVES FOCUS on the
  trigger. It also renders its viewport only while something is open — the
  first version kept an empty one in the page, and the diff said so.
- **select** hides the page behind it: the list is modal, so with it open the
  reference marks the trigger and its own value `aria-hidden`. And
  `aria-selected` follows selected AND focused *together*, so arrowing off the
  chosen row leaves nothing selected at all. Both were found by disagreeing
  with the obvious implementation, and both were copied rather than corrected.
- **scroll-area** is the honest thin one. Measured, the reference exposes no
  roles and no names anywhere in it, and renders no scrollbar until the pointer
  is over it. Scrolling is not observable in the fifteen fields either. What is
  compared is that the content stays reachable and visible while the box does
  not grow — and saying that plainly is better than inventing a field to make
  the component look better measured.

It also found a defect in the audit itself. The scroll area is the first
control here that clips, and `a11y.mjs` counted a clip command as a painted
rectangle — so every row inside it was reported as black-on-black at 1:1. Only
fills count now.

## CSS states and transitions

A canvas UI that does not react to the pointer reads as a picture of a UI. The
stylesheet could say what a button looks like; it could not say what it looks
like *while you are on it*. So `EVGStyleSheet` grew pseudo-classes and EVG grew
a clock.

Four states, because these are the four an element already knows about itself:
`:hover`, `:focus`, `:active`, `:disabled`. `EVGPseudo.holds` reads them off
`isHovered`, `isFocused`, `isPressed` and `a11yDisabled` — nothing new is
tracked to support them, and `:disabled` therefore agrees with what the
accessibility tree publishes rather than being a second opinion about it.

Two decisions are worth keeping written down:

- **A state rule wins wherever it is written.** The obvious implementation
  applies rules in file order, and it is wrong: a later base rule silently
  undoes an earlier `:hover`. `applyTo` runs four passes instead — plain, then
  theme-scoped, then the state rules in the same two groups — which is a
  coarse stand-in for specificity, but it is the part of specificity these
  selectors can actually express.
- **An unknown pseudo-class is an error, not a rule that never matches.**
  `.btn:focus-visible` used to parse into something that quietly did nothing.
  Now it is reported. A rule that never fires and says nothing is a developer
  looking at the wrong file.

Transitions are `EVGTransition`, and the unit is a **flight**: one property of
one element moving from a value to a value over a duration. `reconcileTree`
compares what the stylesheet just wrote against what is on screen and starts,
retargets or drops flights; `advanceTree` moves them by real elapsed time and
writes back. Colours interpolate per channel, numbers linearly, and
`transition: background-color 140ms, color 140ms` parses including the `all`
form.

The awkward case is reversing mid-flight, and CSS has a specific answer:
leaving a half-faded button does not take the full duration to come back, it
takes the fraction already travelled. So a reversal shortens the new flight to
`ms * progress()`. That is one line, and it is the difference between a hover
that feels attached to the pointer and one that feels like it is buffering.

`EVGStyleStateTest.rgr` is 24 checks over all of it, and it was written before
the implementation: states, ordering, an unknown pseudo-class, a transition
starting, a reversal, the no-transition case being instant, opacity as a
non-colour, and the whole subtree advancing. Four mutations were run against it
and each produced the failure it should have.

`UiHost` binds it to input — `markStates` sets the three flags from the hit
test, `layout()` reconciles, `tick(dt)` advances, `busyNow()` says whether
anything is still moving — and the playground drives a `requestAnimationFrame`
loop from that.

The loop was written wrong twice, in the same way, and the note now in
`main.jsx` exists so it is not written wrong a third time: `observe()` is
async, and the flight a hover creates does not exist until the stylesheet has
been applied *inside* it. Asking `busyNow()` before awaiting it gives exactly
one frame and a colour frozen where it started.

Measured in the playground, a sortable row at rest is `rgb(248,250,252)`,
`rgb(244,247,252)` forty milliseconds into a hover, `rgb(238,242,255)` settled,
and back at rest after the pointer leaves.

What is not there yet:

- [x] Easing, the full shorthand, and `transform` — see below
- [ ] `:focus-visible`, which needs a keyboard-versus-pointer distinction the
      host does not currently keep
- [ ] Transitions on layout geometry. `transform` moves and scales a subtree,
      but a transition on `width` is still parsed and ignored — that one needs
      a re-layout per frame, not a rewrite of the display list
- [ ] `@keyframes`. `transition` covers state changes; an animation that runs
      on its own does not exist

## Easing, the transition shorthand, and transform

Three things the first cut of transitions did not have, and the browser was
asked about all three before any of them was written.
`oracle/css_timing_oracle.mjs` drives a real `Animation` in Chromium, pauses it
and sets `currentTime` by hand — sampling by waiting real milliseconds measures
the scheduler as much as the engine — and `oracle/css-timing.json` is the
capture. `EVGTimingTest.rgr` is 281 checks, most of them transcribed from it.

**Easing** is `EVGEasing`: the four keywords, `linear`, `cubic-bezier()` and
`steps()`. The curve is parametric, so the output cannot be read off directly —
given x, the parameter has to be solved for first, Newton–Raphson with
bisection where the derivative vanishes. That fallback looked like paranoia
until the test was made to sample 0.499 as well as 0.5: on
`cubic-bezier(1, 0, 0, 1)` a Newton-only solver is out by six orders of
magnitude a hair either side of the midpoint, and lands exactly right ON it.
Sampling round numbers hid a real defect completely, and that is the general
lesson, not a fact about Bézier curves.

**The shorthand** now carries duration, timing function and delay, per
property, with `all` and later-entry-wins so `transition: all 200ms, opacity 0s`
means what it says. The list parser counts parentheses, because
`cubic-bezier(0.25, 0.1, 0.25, 1)` is one token with three commas in it and
splitting on every comma yields four fragments that each still parse as
something.

Two measured results worth keeping, because neither is what you would guess:

- **A reversal is shortened by the EASED progress, not the clock's.** A 200ms
  `ease-in` reversed at 100ms comes back in 63ms, not 100ms — the clock says
  half way and the eye says a third, and the eye is what has to travel back.
- **The factor compounds; it does not replace.** Reversing a reversal makes the
  leg LONGER again: 200 → 100 → 150. Halving each time is the obvious
  implementation and it makes a jittery pointer converge on an instant snap.
- And the **delay is not shortened** while the duration is. That one was
  settled by sampling the colour on the screen rather than trusting a timing
  object, since the two could have disagreed.

**`transform`** is `rotate()`, `scale()`, `translate()` and the axis forms,
composed at parse time into one similarity — an angle, a uniform scale and an
offset. That is the largest family closed under composition that a display list
of axis-aligned boxes can represent exactly, and composing rather than setting
four fields independently is what makes order work: `rotate(90deg)
translate(10px, 0)` goes down the page and the other order goes across. A skew
or a non-uniform scale is reported, not approximated. It also makes the four
numbers interpolable, so `transition: transform 200ms` is four ordinary number
flights and needs no matrix decomposition per frame.

**`transform-origin`** decides what all of that happens about, and it takes
every spelling CSS has: keywords, percentages, lengths, and the one-value
forms. Seventeen of them were put to a browser and the resolved pixel origin
recorded, because the grammar is not the obvious one:

- A lone LENGTH sets x and leaves y at 50%, but a lone `top` or `bottom` is a
  Y keyword and sets the other axis. `transform-origin: 10px` is `10px 50%`;
  `transform-origin: top` is `50% 0%`. Reading "the first value is x" gets
  every length right and every keyword wrong.
- With two keywords the ORDER IS FREE — `top left` and `left top` are the same
  point.

That second rule needed a better test than the one first written for it. `top
left` cannot demonstrate a swap, because `left` and `top` both resolve to 0%
and the two orderings agree; the mutation that removed the swap passed. The
pairs that separate them are `top center` and `center right`, and they are in
the table now.

It is resolved late, in the display list, where the laid-out box exists — a
percentage needs a size, and resolving when the stylesheet is applied would use
the previous frame's box. It transitions too, since the browser says it does:
0% 0% to 100% 100% passes through 25px 10px on a 100x40 box a quarter of the
way through. The value is interpolated as WRITTEN, so percentages travel as
percentages; a change of unit mid-flight jumps instead, which is a deliberate
difference from CSS's blend of the resolved lengths and is written down where
it happens.

Applying it needed one new thing in the display list: a rotation ORIGIN.
`EVGDrawCmd.rotate` used to turn a command about its own centre, which is right
for a lone sideways axis label and wrong for anything else — a text quad is
sized to its ink, not to the line box, so a box and its own words turned about
their separate centres come apart. The pass that applies it is shaped like
`fadeFrom`, and for the same reason: a transform is a property of a SUBTREE, and
the list has already flattened the subtree by the time it is known what was in
it. Paths are turned in their geometry instead, the way `PathBuilder` already
does, so a backend that has never heard of a transform still draws a turned
icon.

`npm run evg:rotation:check` renders that through the real WebGL painter under
SwiftShader and reads the pixels back, because the pivot lives in GLSL and the
only honest way to check GLSL is to run it. Its first version passed under a
mutation that removed the whole feature — every probe sampled a box centre,
which is invariant under both pivots. The probe that actually separates them
is the centroid of the white ink. A fourth panel turned 45 degrees about its
top-left CORNER was added with `transform-origin`, for the same reason: it is
indistinguishable from the centre-turned one unless the origin is really read.

### The cascade bug this uncovered

A property declared only under `:hover` never went away again. The colour came
back because a base rule declares it; the transform did not, because nobody
writes `transform: none` on a base rule. A browser recomputes a style from
nothing every time; this stylesheet mutates the element in place, which is fast
and which silently strands any property no rule is currently writing.

`clearStateProps` now puts back the initial value of everything a state rule for
this element *can* set, before deciding which states hold — that set being
exactly the properties at risk, since a base rule's are rewritten a moment
later anyway. Inline still outranks the sheet, so an inline value is never
cleared. Only properties with an unambiguous initial value are covered and
`initialValue` says which; `color` is deliberately absent, because its initial
value is `inherit` and writing a literal would break inheritance rather than
restore it.

### And one in the playground

The animation loop called `observe()` per frame — snapshot both trees, diff
them, behind two `requestAnimationFrame` waits — so a 140ms transition got five
frames and read as a stutter. It now repaints and takes the diff once, when
everything has settled. `repaint()` goes through the layout that creates the
flight in the first place, so the loop still has to paint BEFORE asking whether
anything is moving; asking first gives exactly one frame and a colour frozen
where it started, which it did, twice.

## The motion showcase, and a kit that answers the pointer

Everything above is measured. None of it was *visible* anywhere, and "does the
motion feel right" is not a question a checker answers — so there is now a
fourth demo, and the kit itself moves.

**`MotionDemo.rgr`** is the showcase: seven timing functions racing side by
side under the curve each one draws, a delay staggering three bars, nine tiles
turning about nine different origins, and cards that answer the pointer. The
curves are not pictures — each `d` is sampled from the very `EVGEasing` that
moves the dot beside it, so the drawing and the motion cannot drift apart.

It is the one demo in that directory that does **not** rebuild its tree, and
the reason is worth stating plainly because it contradicts what the other three
are there to demonstrate. A flight is a property of an ELEMENT: it remembers
where a value was when the pointer arrived. Rebuild the tree and that memory is
gone, so every transition would establish itself at its destination and nothing
would ever move. So this one owns its tree, built once, and state changes only
set flags on it — the same shape `UiHost` has, for the same reason.

The flip that drives the self-running panels is a **theme**. `.theme-go .mo-dot`
is the far end of a journey, and turning the theme over moves everything at
once with no new mechanism and no element gaining or losing a class — which is
also a fair test that theme scoping and state rules compose.

Verified headlessly before it was ever looked at: the seven dots leave together
from x=335 and arrive together at x=869, and at the midpoint they read 602,
763.5, 503.4, 700.6, 602, 915.7 and 548.6 — each one exactly its own timing
function, and the overshoot row genuinely past its target.

**The kit** then got the same treatment in `theme/base.css`: hover, press and
state transitions across checkbox, radio, switch, tabs, toggle group,
accordion, collapsible, the slider thumb, progress and toast. Three rules held
to throughout —

- the transition goes on the BASE rule, never on `:hover`, or a control eases
  in and snaps out;
- in is faster than out and a press is fastest, because a control has to feel
  attached to the finger;
- nothing moves that would reflow, so every bit of movement is `transform`.

Two things it found. `text-align` was parsed by `EVGElement` and read by
**nothing** — a documented attribute that did not exist, which is the defect
this file complains about by name a few sections down. It now reaches the
display list, measured off the same text engine that broke the line. And the
first hover colour written here was `#e2e8f0`, which is exactly where the
checkbox and the switch already rest, so hovering them did nothing at all and
looked like a broken transition rather than a palette mistake. Both were found
by measuring the painted colour rather than by reading the sheet.

What is deliberately NOT there: an entrance for the overlays. A dialog, a
popover and a tooltip are CREATED when they open, and a transition needs a
value to leave from — a new element has none, so it establishes at its
destination. A browser does exactly the same, which is why Radix animates its
entrances with `@keyframes` and not `transition`. That is the next thing to
build, and the overlays are what should reach for it first.

## The demo page had none of it

The showcase moved and the conformance playground moved. The three demos on
the same page did not: they had **no** `:hover` rule in any of their three
stylesheets, no hover tracking at all for the toolbar and the sortable, and the
canvas never changed the cursor. Reported by using it, which is the only way
that gets noticed — a page that answers a click and looks identical whether or
not anything is under the pointer reads as a picture of a UI.

The reason was architectural, and fixing it meant being precise about a claim
this directory makes rather than abandoning it. "Reordering is rebuilding" is
still true. But a tree rebuilt between two frames has different ELEMENTS in it,
and hover is a flag on an element while a transition is a memory held by one —
so a rebuilt demo could not have had either, however much CSS was thrown at it.

`keptTree` in `demo/main.js` splits the difference by splitting the meaning of
"a change":

- **Data** — the order, which menu is open, whether the bar sits at the bottom —
  rebuilds, exactly as before, from the same static `page()` the PNG snapshots
  and the accessibility audit call. One description of each demo, not two.
- **Hover is not data.** It is a presentational state the stylesheet owns, so it
  sets a flag on the tree that is already there.

Then the three stylesheets got what they never had: hover, press and a small
squeeze, in the purple the menubar and toolbar already use and with the lift
the sortable's reference gives its rows. And the canvas cursor now says what is
interactive, read from the accessible tree's own `activate` flag rather than
from a second list of what counts as a button.

### A colour bug the measurement caught

Probing the toolbar mid-fade returned `rgba(156, 154, 162, 0.64)` — a grey —
on the way to a pale lilac. `transparent` is `rgba(0, 0, 0, 0)`, a BLACK with
no alpha, so interpolating the four channels independently drags every fade-in
from no background through a dark middle. It is the classic "fade through
black", and on screen it reads as dirt rather than as a bug.

CSS interpolates colour in **premultiplied** alpha for exactly this reason, and
the browser confirms it: fading `transparent` to `rgb(244, 241, 254)` reports
`rgba(244, 241, 254, 0.25)` a quarter of the way — the hue is already right and
only the opacity moves. `mixColor` premultiplies now. Where both ends are
opaque the premultiplication is the identity, so nothing about the ordinary
case changed; the toolbar's button now fades at the correct hue instead of
through grey.

## A drag you can watch

The sortable reordered the array on every pointer move, so the rows teleported
into their new places and the row being carried stayed flat in the list. What a
drag should show — where the thing is going, and the space opening for it — was
missing entirely.

It is built the way dnd-kit builds it, and the first decision is the one that
makes the rest possible: **the order is not touched until the drop.**
Reordering live means rebuilding the list on every move, and a rebuilt list has
different elements in it, so nothing can travel anywhere. Instead the target is
recorded, and three things move:

- **the placeholder** — the row you picked up, faded and dashed, slides to the
  slot it will land in. That is the "right place", said before you commit to it.
- **the rows in between** step one place to open the gap. One place, never
  more: pick a row up and drop it three down and the three it passes each step
  once.
- **a floating copy** follows the pointer. It is positioned with `left`/`top`,
  which takes it out of the flow, and added last, which puts it on top —
  children paint in order and there is no z-index to get wrong. It carries no
  id, because hit testing scans backwards and an id there would put the preview
  under the cursor so the row beneath could never be found.

The stride, 88px, is the row's 76 plus the list's 12 gap, and it is the one
piece of arithmetic in that sheet a change elsewhere can silently break.

### Three bugs on the way, each invisible to the one before it

**The gap did not open.** The target is what decides which rows step aside, and
it was in the rebuild key — so every crossing rebuilt the list and the rows
appeared in their new places. `applyShift` re-aims an existing tree instead.

**Then it still did not open**, because the drag branch of the pointer handler
returns early and never started the frame loop. The classes were right, the
rules were right, and every flight sat at zero progress for the whole gesture.

**Then the placeholder alone refused to move**, and that one was an engine bug
worth the trip. `reconcile` reads the target off the element and `writeBack`
writes the showing value to the same field, so a second reconcile before the
next tick reads its own output back and concludes the target has moved to
wherever the animation has got to. A host asks its tree three questions a frame
— what to draw, what is under the pointer, what it means — and each lays out
and reconciles, so three reconciles a frame is ordinary. It stayed hidden
because the stylesheet rewrites its own values at the top of every one of them.
A property set INLINE has no such protection and simply would not animate.

A flight now remembers what it last wrote, and a target equal to that is not a
new declaration. `EVGTimingTest` has the case in both a number and a colour,
plus the check that a genuine mid-flight change is still heard — which is what
would fail if the memory were applied too broadly.

## The menubar keyboard, and a chevron read out loud

Two accessibility defects in the demo menubar, both reported by using it.

**The keyboard was a dead end.** Every branch of the key handler began
`if (!state.open) return false`, so pressing Escape — or arriving with nothing
open — left the component completely unreachable. A pointer user would never
notice; a keyboard user finds nothing else. It handled two of the eight keys
the WAI-ARIA menubar pattern names and gave up.

All of it is there now, and three parts of the pattern are worth writing down
because they are the ones an implementation invents wrongly:

- **Left/Right on the bar move focus without opening anything** — unless a menu
  is already down, in which case they bring it along. That is what lets you
  look along a menubar without pulling every menu out of it.
- **Right means two different things.** On a row that owns a submenu it opens
  that submenu; anywhere else it leaves for the next menu. Right on `Share`
  used to jump to Edit, which is the bug that distinction exists to prevent.
- **Escape closes one level and puts focus back where it came from** — out of a
  submenu onto the row that owns it, out of a menu onto its trigger. That is
  the part that makes the component recoverable rather than a trap.

Opening a menu and choosing a row inside it is one keystroke but two frames:
the rows are read off the accessible tree, and the tree for a menu that was
closed a moment ago has none. The request is remembered and settled after the
paint that builds them.

**And `Share` announced as "Share greater-than".** The chevron beside the label
is decoration, and the accessible name is built from the text of an element's
roleless descendants — so the glyph went into the name as if it were a word.
`aria-expanded` on the row already says "there is more this way", properly.

EVG had no way to say "this is decoration", so it has one now: `aria-hidden`
prunes an element and everything under it out of the accessible tree and out of
any ancestor's name. The whole BRANCH, not just the element — a hidden wrapper
with a real button inside it must not report the button, and a button a reader
is told about but cannot see is worse than one it is never told about. Proving
that needed a better fixture than the chevron itself: a glyph with no role
makes no node either way, so the first version of the test passed under a
mutation that removed the pruning entirely.

## Table — the second control whose reference is not Radix

Radix has no table. ReUI's is `@tanstack/react-table` underneath, as is every
shadcn-family one, so TanStack is the oracle — exactly as dnd-kit is for the
sortable, and declared the same way in `beyond` so the coverage number cannot
quietly count it as Radix.

But it is a **narrower** oracle, and saying so is half the work. dnd-kit owns
its accessibility: it writes the roledescription, the aria-pressed and the
announcements, so copying it gets those right for free. TanStack is headless.
It computes state and hands you nothing to render — no roles, no `aria-sort`,
not one attribute. So the state machine is TanStack's and the ARIA is the HTML
table spec's, and `oracle/table.json` is where the first half was captured
before a line of Ranger existed.

Four measured answers, three of which are not what you would write:

- **The sort cycle has three states**, not two: first direction, other
  direction, then unsorted again. A hand-written table toggles between two
  forever, and the order the data arrived in becomes unreachable.
- **A numeric column sorts descending first** and a text column ascending.
  "First click" means "most useful first click" — biggest-first for a quantity,
  A-to-Z for a name. Both full cycles were captured rather than assuming the
  numeric one mirrors the text one.
- **The header checkbox is page-scoped.** Select everything on page one, then
  clear it, and page two's rows stay selected — it never touched them. "Some
  but not all" is a third state, which is the indeterminate the box has to
  show.
- **Sorting while paged stays on the page it was on.**

And one that will bite an implementation: TanStack's `nextPage()` does **not**
clamp. Called on the last page it moves to an index with no rows in it, and
only `getCanNextPage()` says not to. `TableCtl.nextPage` gates itself instead —
a control that can put itself somewhere empty is a control every caller has to
remember to guard — and the check prints that difference rather than asserting
it away.

`npm run ui:table:check` runs the controller over the same six rows and the
same clicks and compares against TanStack's recorded answers. It needs no
browser, so it is in the CI suite. Three mutations were run against it — a
two-state toggle, a numeric column sorting ascending first, and a select-all
that touches every row — and each is exactly a mistake a real table makes.

`aria-sort` needed a field of its own in the trace, for the same reason
`valuenow` did for the slider: sorting changes which rows are where and nothing
else about any node, so without it the one thing the control does is the one
thing the diff cannot see.

### Six specs, and what they cost to make pass

The DOM side is a real `<table>` driven by TanStack, and the snapshot could not
see it: it derived a role from the tag for `<button>` and `<a>` and called
everything else `none`, so a whole table reported as nothing at all. Implicit
roles are the rule here and the attribute is the exception — `<tr>`, `<th>`,
`<td>` and `<input type=checkbox>` all know what they are. A native checkbox
also keeps `checked` and `indeterminate` as DOM PROPERTIES with no attribute
behind them, so reading only `aria-checked` reported the select-all box as
saying nothing.

`cell` and `gridcell` turned out to be different roles rather than two
spellings, and the distinction is the same one as `table` versus `grid`: a
gridcell is something you steer a cursor onto.

Three accessibility defects the audit caught, all of them structural:

- `role="table"` may contain only rows. The paging buttons were parented to it
  and a reader walking by row would have found something that is not one, so
  the controller's root is now a wrapper and `tid` belongs to the table inside
  it — the same shape the DOM reference has.
- A row's children have to be cells, so the select-all lives inside a column
  header rather than beside one.
- A focusable row has no name to announce, and giving it one means reading
  every cell twice. Rows are not focus targets; selection is a **checkbox in
  the row**, which is what ReUI does and the only way a keyboard reaches it.
  Selecting by clicking the row went out with it: it is a choice with no oracle
  behind it, and inventing behaviour is exactly what this harness exists to
  stop.

### The probe was wrong twice more

`sort-keeps-page` was in the catalogue and it was wrong. The bare probe said
sorting keeps the page; the reference component resets it. Chasing the
difference found `autoResetPageIndex`, which defaults to **on** — and whether
it fires depends on how the table is WIRED, which is precisely the part a
headless library leaves to its caller.

So the oracle now renders `dom/app.jsx`'s own component and clicks the same
test ids a person would, instead of building a little TanStack table beside it.
One source of truth, and the question cannot come back. The clamping difference
noted earlier disappeared with it: measured through the real UI, paging past
the end does not happen at all, because the button is disabled.

Two flaws in the probe itself, both found because the numbers looked wrong:
every mutation goes through React state, so reading the table object back
synchronously reads the previous one and reports that nothing happened; and
`resetPagination()` restores TanStack's default of ten per page rather than the
four the probe was set up with, which made the whole selection capture measure
a one-page table.

### The demo, and the shorthand it broke

`demo/TableDemo.rgr` is the table wearing ReUI's clothes: a bordered card, a
muted header whose sortable columns carry a chevron, rows that light under the
pointer, coloured status badges, and a footer that says how many are selected
and which page you are on. It reuses `TableCtl` unchanged — the controller
decides what is true, the tree literal decides what it looks like, and neither
knows about the other. Writing the sort cycle and the page-scoped selection a
second time for the demo would be writing an untested copy of the only part of
a table that is hard.

Like the motion showcase, the tree is **kept**. Hover is a flag on an element,
and a rebuilt tree has a different element in that position with no memory of
anything, so a demo that rebuilds every frame can have no hover and no
transitions at all. A press rebuilds, because a press changes the data; the
pointer moving does not.

And then the footer wrapped onto a second line, which is how a defect four
months old finally surfaced.

`.tb-foot` declares `padding: 0 16px`, and the row's contents sat flush against
the card's edge. EVG was reading the whole declaration as **one** unit:
`EVGUnit.parse("0 16px")` sees the leading `0`, stops there, and the box was
given zero on all four sides. Every two-, three- and four-value box shorthand
in the gallery had been wrong since the sheets were written — 30 declarations
across five stylesheets, every one of them silently dropping its horizontal
padding. Nobody had reported it because a padding that is too small does not
look like a bug. It looks like a layout someone chose.

`oracle/css_box_oracle.mjs` put each form on a real element and read back the
four computed sides, and the rejections are the half worth capturing: a browser
drops the whole **declaration** on a five-value list, a junk component or a
negative padding, rather than dropping the component — so an element keeps what
it had, which is a different observable outcome from zero. A negative *margin*
is ordinary CSS and survives. `EVGBoxShorthandTest.rgr` is those 17 rows plus a
laid-out row proving it reaches the geometry and not just the box; four
mutations were run against it, and the two-value one alone fails seven checks.

This is the third defect this month found by looking at painted output rather
than at code, after the non-idempotent transition reconcile and a `text-align`
that was parsed and read by nothing. None of the three would have been found by
reading; all three had passing tests around them.

## Dropdown menu — submenus, and one attribute nobody was looking at

The dropdown had been at 100% for thirteen behaviours since the first pass, and
it was a flat list. Nothing in the gallery nested: `MenuCtl` had no submenu,
`MenubarCtl` had none, and the menubar DEMO drew one that no controller backed
and no spec measured. So "the menu works" meant "the menu works as far as we
had asked".

### The field that was not there

Before any of it, `aria-haspopup` was added to the trace, for the reason
`aria-sort` was: a submenu's parent row is a `menuitem` like the one beside it,
carries the same name, and differs by exactly one attribute. Without the field
the diff cannot see the only thing that separates them, and the chevron is not
something a reader can see either.

Adding it found four gaps in one run, none of them in a submenu:

- the dialog, alert-dialog and popover triggers all carry
  `aria-haspopup="dialog"` on the reference and carried nothing here — a
  reader was not told the button opens a dialog, and "dialog" is a different
  promise from "menu";
- every menubar trigger carries `aria-haspopup="menu"`, and ours did not;
- the CONTEXT menu trigger carries **none** — and the first version here gave
  it one. That is right, and it is the same split `aria-expanded` already
  makes: a context menu cannot be summoned from the keyboard, so promising a
  reader a popup would promise something it cannot reach.

One field, four defects, and three of them in components that had been at 100%
for weeks.

### What Radix actually does with a submenu

Read off the reference, and two of these are not what the WAI-ARIA prose would
lead you to write:

- **Opening by name puts you inside.** ArrowRight, or Enter on the row, opens
  the submenu and focuses its FIRST item. That is the opposite of opening the
  root menu, where focus lands on the surface and the first item is only
  reached by arrowing. The asymmetry is real: you asked for this submenu by
  name, so it puts you in it.
- **Opening by pointer does not.** Resting on the row opens the submenu and
  leaves focus on the row — the pointer is still there and you have not said
  you are going in. Getting this one backwards makes a menu that jumps out
  from under the cursor.
- **The horizontal arrows are for nesting only.** ArrowRight on an ordinary
  row does nothing; ArrowLeft in a dropdown's root menu does nothing. A
  vertical menu does not step sideways, which is why `isNextKey`/`isPrevKey`
  are not used in `MenuCtl.keyDown`.
- **Escape closes every level**, not one, and ArrowLeft unwinds exactly one.
- **Each menu keeps its own roving tab stop.** With focus inside a submenu the
  sub-trigger is STILL the tab stop of the menu it lives in, so two rows carry
  it. The first version kept one across the whole tree; the diff said so.

### The delay, and where a delay can honestly be tested

A hovered submenu opens after **100ms** — measured in the browser at 25ms
intervals, closed through 75 and open at 100 — and closes **instantly** when
the pointer moves to another row. The asymmetry is the whole design: slow to
open so that dragging down a menu does not flash every submenu on the way
past, instant to close so the menu keeps up with you.

The conformance harness cannot check that number. Its steps settle for two
animation frames, about 32ms, which lands in the middle of the wait: a spec
that observed there would be measuring the machine and would pass and fail on
different runs. So a `settle` was added to the `hover` step, both specs observe
firmly past the delay, and the delay ITSELF is checked in `ui:test`, where the
clock is a number the test hands over. That split is the rule: the browser is
the authority on behaviour, and an exact time belongs where time is exact.

Which is not a nicety. Without those four checks a submenu that opened
INSTANTLY passed every conformance spec — and did, until they were written.

### Five specs and six mutations

`dropdownmenu_submenu_keyboard`, `_pointer` and `_nested` join the two that
were there; the nested one reaches three levels deep, skips a disabled
sub-trigger and unwinds a level at a time. Six mutations were run against the
set — an instant hover-open, a hover-open that steals focus, ArrowRight as a
next key, ArrowLeft closing everything, a sub-trigger with no `aria-haspopup`,
and a hover that leaves the old submenu open — and every one is caught, the
first by `ui:test` and the rest by the diff.

`MenuCtl` also gained the one thing `overlayAnchor` exists for. A submenu
surface is its parent ROW's child, so ownership, events, the accessibility
walk and paint order all follow the tree; but the overlay pass finds an anchor
among a surface's SIBLINGS, and this surface has none. Nothing in the gallery
had used the explicit field, so the submenu laid out at the origin — invisible
to a harness that compares ARIA and not geometry, and obvious the moment one
opened on a page.

### The demo, and the two defects it had

`demo/DropdownDemo.rgr` is ReUI's account menu: the signed-in user at the top,
a segmented theme picker, rows with icons and counts, a status row that opens
a submenu beside it, a destructive Logout. It owns **no** state — open/closed,
the roving focus, the submenu stack, the 100ms clock and every key are
`MenuCtl`'s — so its keyboard is the measured one. The menubar demo beside it,
whose keyboard is hand-written and matched against nothing, is the
counter-example.

Two structural defects, both caught by the audit and both worth naming:

- `role="menu"` may contain only menu things, and a `radiogroup` is not one.
  The theme picker is a `group` of `menuitemradio`s instead — which is what
  Radix's own `DropdownMenu.RadioGroup` renders, for this reason.
- The surface was the trigger's CHILD, which put a whole menu inside a button:
  `nested-interactive`. It is the trigger's sibling now, inside a roleless
  wrapper — which is also how the overlay pass finds its anchor without being
  told, so the explicit `overlayAnchor` is back to being the submenu's alone.

## A postscript: the stride, and what a comment cannot enforce

The rotation origin added two ints to `EVGDisplayList`'s per-command record —
24 to 26 — and `stride()` carried a comment saying to read it through the
function and never inline the number. A reader on the other side of the bridge
had inlined it anyway:

```js
export const SCENE_STRIDE = 24;   //  pptx/web/host/pptx-host.mjs
```

From the second command onwards every field was read two ints early. Colours
became coordinates, coordinates became flags, and the frame stayed
plausible-looking numbers all the way down until a ring count taken out of
somebody's colour reached `new Array(eCount)` and threw `RangeError: Invalid
array length` — in the WebAssembly parity job, which needs an Emscripten
toolchain and runs late in the deploy workflow. A hundred fields downstream of
the mistake, in a job that only runs on master.

Three things came out of it, and only the first is the fix:

- **The shape is derived, not agreed.** `cmds` is allocated as exactly
  `count * stride`, so `sceneStride(bin)` recovers the writer's number by
  dividing. It cannot drift, and it needs no new export — which matters,
  because three producers publish this frame by three different routes and only
  one is in a position to export a constant. What the decoder names is the
  FLOOR it needs (`SCENE_FIELDS_READ = 23`); a wider record is somebody else's
  business, a narrower one throws with both numbers in the message.
- **The claim that the two paths agree was a comment.** It said "the
  equivalence test in the standalone suite compares the two field by field" and
  there was no such test. There is now: `scene-binary-check.mjs` asks the engine
  for the JSON and the binary of every slide of every fixture and compares them
  field by field — 37 decks, 45 slides, 8,658 commands, no browser, no
  toolchain, one second — and it names the field that differs rather than
  saying the frames do. It is in the gallery suite and in CI *before* the
  WebAssembly build.
- **Two checks that would have caught it were not wired up.** `npm run
  pptx:web:test` fails outright on this, and the playground draws an empty
  page. Both were reachable the whole time and neither was in the suite the
  work was run against.

The lesson is not "be careful with strides". It is that a positional format
needs its shape carried with it or recoverable from it, because "both sides
know the layout" is not a property anything enforces — and its failure mode is
not a clean error at the boundary but nonsense that surfaces somewhere
unrecognisable.

## Dialog and window — and `backdrop-filter: blur()` underneath them

Two things the gallery could not do: soften what is behind a surface, and put
a window somewhere the user chooses with whatever the caller likes inside it.

### The blur, and two beliefs that turned out to be half right

Measured before a line of it was written, and both halves of the obvious
answer are wrong in different ways.

**The kernel is not a Gaussian.** `blur(r)` is the SVG filter spec's three-box
approximation with sigma = r — the CSS filter spec adopts it by reference and
every engine ships it. Fitted against Chrome at three radii, the three-box
model is within half a luminance level everywhere; a true Gaussian with the
same sigma is out by up to 14. So the common belief is exactly half right: the
sigma IS the radius, and the shape is not a Gaussian. `oracle/css-blur.json`
records the residuals of all four candidates, so the claim comes with its own
error bar.

**The backdrop is the element's own region, edge-clamped** — not the page
behind it. This one was implemented backwards first, and the reason is worth
keeping: behind a pane over flat grey the browser's result is flat to the
border, and that was read as proof that the blur samples past the edge. It
proves nothing. A uniform field is uniform under either rule. The case that
decides is a feature straddling the border, and it is not subtle — a black
stripe starting at the pane's left edge reads `255 255 255 | 0 0 0` with no
ramp at all, while the same boundary 100px further in gets the full smooth
curve. Outside content does not enter.

One case is recorded and deliberately **not** matched: within a kernel's reach
of the border, Chrome stops producing a blur profile at all. Across nine
pixels it is a straight line of about 8 levels each, then a 63-level JUMP at
the feature's own edge, then another straight line of about 2.5. A blurred step
is an S-curve; two straight segments with a discontinuity is a compositor's
downsampled edge handling. EVG clamps at the border — the principled reading of
the same rule — and agrees with the browser to within 3 levels everywhere the
border is further away than the kernel reaches.

`gl/blur-check.mjs` is 14 probes under SwiftShader against the oracle's own
pixels, and six mutations are caught: sigma halved, one box pass instead of
three, sampling past the border, ignoring the radius, blurring on one axis
only, and dropping the even-width offsets. Three of those checks exist only
because an earlier version of them did not catch the mutation they were
written for — a scene that is uniform along the axis you broke will happily
report success.

Two implementation notes that were bugs first:

- The blur targets are sized to the region **exactly**. Growing a shared
  target and reusing it for a smaller region stretches the image by
  target/region on the first pass and reads back region/target of it on the
  last, and those cancel along any axis where the picture is uniform. Two
  scenes written to catch that saw nothing.
- `TEXTURE0` is the glyph atlas for the whole frame, and the blur borrows it.
  Leaving it bound meant every letter drawn after a dialog sampled the blur
  instead of the atlas, came back with alpha 1, and rendered as a solid black
  rectangle the size of the word — which is exactly what the first screenshot
  of the dialog demo showed, in every run on the page.

### The window

`EVGWindow` has a fixed vocabulary — `addLabel`, `addButton`, `addRadio`,
`addCheckbox`, `addSwatch`, and one content rectangle whose pixels the owner
paints by hand. Anything it has no method for cannot go in the window: a table,
a form with a select in it, another controller's output.

`WindowCtl` owns a frame and nothing else. `bodyEl` is an ordinary
`EVGElement`; the caller fills it, and `build()` re-makes the chrome around it
without touching it. The demo puts a form in one and a small table in the
other, from two unrelated tree literals, and the class knows about neither.

Modal and movable are the same class with one flag. The ARIA is Radix's dialog
and is already measured through `DialogCtl`; the DRAGGING has no reference —
nothing in Radix moves a dialog — so it is specified rather than measured, and
`UiTest` states the rules: the title bar is the handle and only when movable, a
modal never drags, enough of the window stays on screen to grab it again, the
arrow keys move it too, and the caller's content survives every rebuild.

Three things the live page found that the tests had not:

- **The handle is the bar AND its title.** The label fills the bar, and a hit
  test returns the innermost thing under the pointer, so pressing the middle of
  a title bar reported the title and the window did not move. The test that now
  covers it clicks the title, which is what the page actually hands over.
- **The ARIA was in `rows()` only.** That is what the conformance host reads;
  `EVGA11yFromTree` walks the ELEMENTS, and that is what a page using the
  controller directly publishes. The demo's accessible tree had the form fields
  and the table in it and no dialog at all — and the audit passed, because a
  node that is missing cannot fail a rule about its name. `build()` now writes
  the same facts to both.
- **A button may not contain another one.** With the close button inside the
  handle, axe says `nested-interactive` and is right. The strip across the top
  is a roleless container now, with the handle and the close button as
  siblings; the handle still fills everything left of the close, so the whole
  bar is grabbable.

`UiCtl` gained a third gesture for this. A slider asks for a fraction of a
track, a sortable asks what it is over, and a window asks how far the pointer
has moved — `dragBy(dx, dy)` in page pixels, so the controller never learns
where it was picked up and a window grabbed by the right end of its bar does
not jump left.

## Tree — a generous oracle, and a branch no mutation could reach

ReUI's tree is `@headless-tree/react` over `@headless-tree/core`, wired with
`syncDataLoaderFeature` and `hotkeysCoreFeature` and nothing else; `Tree`,
`TreeItem` and `TreeItemLabel` are a stylesheet over it. So the library is the
oracle, the way dnd-kit is for the sortable — and it is a far more generous one
than TanStack was. The table's library writes not a single attribute, so all of
the table's ARIA had to be argued from the HTML spec. `getProps()` here hands
back the role, `aria-expanded`, `aria-level`, `aria-setsize`, `aria-posinset`,
`aria-selected` and the roving `tabIndex`, so the accessible tree is not
designed at all — it is copied, and then measured.

Four things the measurement said that a reading of the WAI-ARIA pattern would
not have:

- **The tree is flat.** `getItems()` returns the visible rows already
  flattened, every one of them a sibling, and depth is carried by `aria-level`
  alone. A `role="group"` per folder is equally valid ARIA and would not match,
  so `TreeCtl` builds a flat list too.
- **The root is not a row.** A tree rooted at `crm` shows CRM's children and
  never CRM. This is load-bearing later.
- **Enter and Space toggle the folder and select nothing**, because
  `selectionFeature` is not in ReUI's list. And yet every row still publishes
  `aria-selected="false"` — telling a reader the rows are selectable when
  nothing can select them. That is the library's choice rather than a good one,
  and it is copied, because the harness records what the reference does.
- **ArrowRight on a leaf is not a no-op.** It steps DOWN, exactly as it does on
  an already-open folder — the library has one `expandOrDown` path and a leaf
  falls through it. The first reading here said "does nothing", and it came
  from a spec whose opening `focus` step the reference had silently ignored:
  headless-tree tracks its own focused item and a DOM focus call does not set
  it, so several presses were being scored against a tree that had never
  focused anything. Tree specs click instead. The rule is not new — a step the
  reference ignores makes every observation after it agreement about nothing —
  but it is the first time it bit through a *library's* internal state rather
  than the page's.

Three specs, 3475 observations, eighteen behaviours, all matching. Nine
mutations were run against them and eight are caught. The ninth is more
interesting than the eight:

- **The leaf ArrowRight mutation survived the first time.** Not one spec
  pressed ArrowRight on a leaf — the walks all happened to be on folders. The
  behaviour was in the catalogue and reported as matched, on evidence that did
  not exist. `tree_expand`'s walk was rewritten to end on a leaf and it is
  caught now.
- **The top-level ArrowLeft mutation was equivalent.** Deleting the guard
  changed no observable behaviour, and for a good reason: the root is not a
  row, so a top-level item's parent is not in the visible list and the lookup
  fails anyway. Two mechanisms were answering one question. The guard is gone
  and the comment in its place says why, because a branch nothing can reach
  reads as coverage from the outside.

### The demo, and a second silent hole in the accessible tree

`demo/TreeDemo.rgr` is the same split the table and dropdown demos make: the
controller decides what is true, the tree literal decides what it looks like.
It owns two things the controller does not — the twenty-pixel indent, which is
presentation because depth already lives in `aria-level`, and the twisty, which
is `aria-hidden` because `aria-expanded` says the same thing in words.

Then the audit reported **1 node**, and passed.

`EVGA11yFromTree` maps an element's `role` string to a role code and drops the
element — and everything under it — when it does not recognise one. It did not
know `tree` or `treeitem`. Eighteen rows on screen, one node in the
accessibility tree, no finding: a node that was never made breaks no rule about
the nodes that were. This is the second time that exact shape of failure has
appeared here; the dialog's was the first.

So the second fix matters more than the first. An unrecognised role is now
REPORTED, through a `notes` list on `EVGA11yTree` that `lint()` empties before
anything else — the builder gets to say what it could not represent, instead of
the silence that a passing audit then reads as agreement. There is no safe
default to substitute: `group` would invent structure, and skipping is what
caused this.

`aria-level` was missing from the accessible tree entirely — `EVGA11yNode` had
`posInSet` and `setSize` and no `level`, `UiHost` dropped all three on the way
from `rows()`, and the DOM mirror wrote none of them. The trace had carried
them since the controller went in, so the conformance number was right while
the thing a screen reader actually reads was a flat list of unnumbered rows.
Fixed on all four: the node, both builders, and `evg-a11y.js`.

## Element identity — `key`, and a reconciler

Every demo in this directory keeps its element tree between frames, and
`main.js` says so plainly: *"Rebuild only if the data changed."* The comment
beside it is a measurement rather than a worry —

> every element is new every frame, so every flight establishes at its
> destination. Measured before it was believed: the rows making room for a
> dragged item were at their final positions 40ms after the pointer crossed,
> having travelled through nothing.

So the declarative half of the gallery ran ONCE, at init, and everything after
that was imperative mutation of the tree it produced. The sortable was the
clearest case: `applyShift()` re-aimed the live list by hand, walking by INDEX
— `list.children[i]` assumed to be the row for `order[i]`, which holds only
because the order does not change mid-drag. A keyed reconciler for one list,
written without keys, correct by luck. The same workaround had been invented
independently five times.

### `key` is not `id`

`id` is global and outward-facing: the hit test reports it, the accessible tree
carries it, and an application addresses a control by it. `key` is
sibling-scoped and inward-facing: this new child is the same LOGICAL child as
that live one, so keep its element. Two lists on one page may both key a row
"video"; two elements may not share an id. The preview in the sortable is the
case that makes the distinction concrete: it deliberately has no id — hit
testing scans backwards and an id there would hide the row underneath it — and
it very much needs a key.

`EVGReconcile.reconcile(live, next)` matches children by (key, tagName), keeps
what it can, takes `next`'s order, and reports how many it kept, created,
dropped and moved. An unkeyed child matches by position AMONG UNKEYED SIBLINGS,
and a mismatch there is a miss rather than a search — falling forward past one
pairs the second unkeyed child of one render with the third of another, which
is how an unkeyed list shifts its state by one on every insert.

### The oracle is an invariant, not a capture

Nothing ships a reconciliation you can read pixels off. So the check is:

> a reconciled tree must describe exactly what a freshly built one describes

on all four things a tree produces — display list, layout, hit test, accessible
tree. That is what makes it field-agnostic. `adoptFrom` copies 180 fields of
`EVGElement` by name, skipping three (`parent`, `children`, `transitions`), and
a field somebody adds to the class and forgets to add there would be dropped on
every rebuild. Four such mutations were run and all four are caught, because a
dropped field that changes nothing observable changes nothing at all.
`scripts/check-evg-adopt.mjs` catches the same mistake earlier and by name.

Nine mutations, eight caught. The ninth — swapping the adopt and the match —
is genuinely equivalent, because `adoptFrom` skips `children`; the comment
where the order is written down says so rather than warning about a danger that
is not there.

### The litmus test: `applyShift()` is gone

`gallery/ui/demo/sortable-motion-check.mjs` runs the demo's own pipeline with
no browser and measures where each row is actually drawn. The gap opens over
180ms through a spread of positions; with the reconcile taken out, the row is
simply there one frame later. `applyShift` and `movePreview` are both deleted,
and the page rebuilds the whole tree on every frame of a drag.

**And the drop regressed, which is the useful half of this.** At the drop the
list reorders and every shift transform goes to zero in the same frame. With
the elements kept across that rebuild — which is the feature — the row's new
layout position is 88px further down while its transform is still +88, so a
transitioned transform starts from a row drawn 176px low and slides back:
measured, y=216 jumping to 304 and taking 180ms to return. Keeping identity
across a layout change is exactly the FLIP problem, and it does not appear
until identity works.

The fix is the reference's own rule: dnd-kit's `useSortable` transitions
`transform` only while `isSorting`. `.sr-row-sorting` carries the transform
transition and is on the rows only while something is being carried, so the
transform snaps when the drag ends and the two halves cancel. The cost is a 2px
hover lift that snaps rather than eases outside a drag — which is what the
reference does. The check now holds both halves: the gap opens, and the drop
moves nothing.

### What this is NOT yet

It is the identity layer and nothing above it. It does not decide when to
rebuild, does not track dependencies, and does not know what a component is —
those are the next steps, and they are language work rather than library work.
Doing this one first was deliberate: the runtime semantics are provable without
touching the compiler, and sugar over an unproven runtime is the expensive
order to work in.

## Component instances — the owner, not another element layer

`EVGReconcile` made an ELEMENT survive a rebuild. This makes the thing that
BUILT it survive one, which is a different problem and the one that has to be
solved before `state` means anything.

The distinction matters, because "keyed reconciliation" sounds like it should
already cover this. A reconciler works on the OUTPUT: two trees exist and it
decides which of their nodes are the same node. Nothing in that gives the
builder anywhere to live. A function that returns a subtree starts from nothing
every time it is called, so a value it would like to remember between calls has
no home and gets pushed up into a controller. `MenuCtl.pendingTid` and
`pendingMs` are exactly that: a 100ms submenu timer belonging to ONE ROW, kept
on the controller because a row is a function call and a function call cannot
hold a clock.

`EVGComponent` is a separate owner sitting ABOVE the element layer, not a new
element layer:

```
EVGComponentHost   key -> instance, and the pass that decides who is still here
    EVGComponent   props, state, and a view that returns
        EVGElement     -> EVGReconcile -> layout / display list / hit test / a11y
```

`EVGReconcile` is untouched by this commit. The two are keyed the same way —
`render()` stamps the component's path onto its root element's `key` — so the
host and the reconciler cannot disagree about which row is which. A component
whose view forgot that would keep its own state and lose its element's, which
is worse than neither persisting.

### mount / update / dispose

The same three events `EVGReconcileStats` counts for elements (kept, created,
dropped), one level up and named apart so a number says which layer it came
from. `endPass` disposes everything the pass did not ask for, and that is the
half a reconciler cannot do: dropping an element takes a subtree out of the
tree and tells nobody, which is fine for a box and wrong for anything holding a
timer, a pointer capture or a subscription. Nothing owns such a resource yet —
the hook exists first on purpose, because retrofitting a lifecycle onto
components that already leak is the expensive order.

There is no remove call and there should not be one: a thing leaves a view by
not being built. The test proves the forget is real by asking for the same key
again and getting an instance with none of the old one's memory.

### The leg of identity a library cannot have

Identity should be parent + CALL SITE + key. This has the first and the third.
Two sibling calls with one key are therefore indistinguishable here from one
component being rebuilt, and they would share an instance and its state. That
is REPORTED rather than absorbed — quietly handing back the same object is the
failure mode that looks like it works, and it would show up as two rows
mysteriously agreeing about everything. Folding the call site in is something a
compiler can do when `component` becomes a literal, and it is the argument for
doing that in the compiler rather than here.

### On the page

`TreeDemo`'s rows are `TreeRow` components now, and the demo rebuilds through
the reconciler on every press. Collapsing a folder is the visible half of the
lifecycle: ten components live, six after collapsing Accounts, ten again after
re-opening. The display list and the accessible tree are byte-identical to what
the hand-built version produced, checked state by state.

`TreeRow` has no local state, and saying so is the honest position: it is a
pure function of its props today. What being a component buys it now is the
identity and the lifecycle — and one thing that shows immediately, because the
elements persist: the focus tint now TRANSITIONS across a state change instead
of snapping, which a from-scratch rebuild could never do.

### Deliberately not optimised

Every component's view runs on every pass. Nothing tracks which state a view
read, and nothing skips a subtree. The sortable already rebuilds its whole tree
on every frame of a drag and keeps all 61 elements, so the simple semantics are
affordable at this scale; dependency tracking is the answer to a measurement
nobody has taken yet, and taking it early would buy complexity with no evidence.

## Where the frame actually goes

There was no benchmark. `gallery/ui/bench` is one now, and it exists because a
claim about which phase is expensive has to be falsifiable — a total says the
pipeline costs 250ms and gives you nowhere to start.

The fixture is the table demo's row shape at N rows: 14 elements and 6 text
runs each, real strings so text measurement is not flattered by every run being
the same width. Median of seven, phases timed separately.

```
  rows  elements   cmds |  build   style  layout    list |  paint   patch retained rebuild
   200      2803   1803 |   14.2    19.6     5.1     1.1 |    3.5    54.5     28.8    41.7
   800     11203   7203 |   49.6    78.1    26.7     8.9 |   10.3   213.6    118.4   171.6
  1600     22403  14403 |   98.0   178.6    70.5    21.1 |   31.8   561.8    252.9   451.1
```

Two conclusions, and the second one was not the expected one.

**The painter is not the problem.** 31.8ms to draw 14,403 commands, against
252.9ms to decide what they are. Optimising WebGL here would be optimising 12%
of the frame. That much was expected.

**The STYLESHEET is the problem, not layout.** 178.6ms of a 252.9ms retained
frame — 71% — against layout's 70.5 (28%) and the display list's 21.1 (8%). The
working assumption before measuring was that layout plus display-list
construction dominated; they are together barely half of what the cascade costs.

The reason is in `EVGStyleSheet.applyTo`, and it is not subtle. Per element,
per frame: split the className string, clear the state properties, then FOUR
passes over the rule set (plain, themed, plain-state, themed-state). At 22,403
elements that is 22,403 string splits and ~90,000 rule scans every frame — to
produce **18 distinct answers**, because a 1600-row table has 18 distinct class
strings in it and the resolved property set depends on nothing else but the
state flags and the theme.

So the first big win is not incremental layout. It is a resolved-style cache
keyed on `(className, theme, hovered, pressed, focused)`. That is a real
refactor rather than a memo one can bolt on — the four passes WRITE onto the
element instead of producing a value, so they have to be turned into something
that returns a property set before anything can be cached — and it is guarded
by the conformance suite, the demo audit and a display-list equality check.

**And `patch` costs more than `rebuild`.** 561.8 against 451.1 at 1600 rows: a
change to one row's class, taken through build → reconcile → style → layout →
display list, is more expensive than throwing the tree away. That is not a
regression and it is not a surprise — the reconciler bought IDENTITY, which is
what transitions and component state need, and it never claimed to buy speed.
But it does say plainly what the next layer is for: while `patch` tracks
`retained`, nothing is being avoided, and one row lighting up logically dirties
one background colour.

`ui:bench` and `ui:bench:paint` run it. The numbers above are one machine's and
are meant to be re-measured, not quoted.

## The resolved-style cache

The benchmark said the cascade was 71% of a retained frame. It is not any more.

```
  1600 rows        style   layout    list  retained   rebuild   patch
  before           178.6     70.5    21.1     252.9     451.1   561.8
  after             53.1     45.5    13.6     114.2     207.4   269.1
```

Style is 3.4× faster and the whole retained frame is 2.2×. Nothing about the
architecture changed to get it — the cascade was doing the same work over and
over.

`applyTo` did five full scans of the rule list per element per frame: one to
clear the state properties and four to apply the groups (plain, themed,
plain-state, themed-state). What those scans produce is an ordered list of
(property, value) writes, and that list depends on exactly four things: the
class string, the theme, the four interaction bits `EVGPseudo.holds` reads, and
the viewport. A 1600-row table has EIGHTEEN distinct class strings in 22,403
elements.

So the scan runs once per distinct key and the result is replayed. Plans are
flat parallel arrays with a start/count index rather than a list of lists — one
allocation that grows, and no nested array type to thread through the backends.
The viewport is not in the key: it invalidates the whole cache instead, because
a sheet is parsed once and a window resizes rarely, and being clever there would
be optimising the rare case.

`hasInline` was the other half. The sheet asks it once per declaration per
element — about 180,000 times a frame — and it converted the property name to
kebab-case before looking in a list that is almost always empty. An early return
took style from 68ms to 53.

### The oracle, and the two things it could not see

The old implementation is kept as `applyToDirect`. The test builds the same tree
twice, styles it both ways and compares the DISPLAY LISTS — field-agnostic, for
the same reason the reconciler's invariant is.

Nine mutations. Three of them exposed the fixture rather than the code, and two
of those exposed a limit of differential testing itself:

- **The theme was not in the fixture at all.** It said `.dark .box`, which this
  sheet does not support — only `.theme-<name> .class` — so the rule became a
  parse error and there was no theme rule to get wrong. `testFixtureParses` now
  asserts the sheet parses clean, which is the check that would have said so
  immediately.
- **A differential oracle is blind to what the two sides share.** Breaking
  `hasInline` breaks the cached path and the direct path identically, so the two
  display lists still agreed. Inline precedence needs a direct assertion, and
  has one.
- **One sheet, two themes** is a case `testAgreement` structurally cannot reach,
  because it builds a fresh sheet per comparison — so each cache only ever held
  one theme and the key never needed to carry it. Dropping the theme from the
  key passed everything until a test applied one sheet twice.

And one near-miss worth recording: a mutation round used `git checkout` to
restore a file, which reverted the `hasInline` optimisation because it was not
committed yet. The benchmark numbers taken after that point were measuring
source that no longer existed. Restore from a copy, not from HEAD, while the
thing being measured is uncommitted.

## Invalidation: what a change is allowed to cost

A hover on one row of a 1600-row table logically dirties one background colour.
It used to cost the whole pipeline.

```
  1600 rows        style   layout    list   hover  retained   rebuild
  before            178.6     70.5    21.1   113.5     252.9     451.1
  after the cache    53.1     45.5    13.6   113.5     114.2     207.4
  after this          2.5     48.6    13.8    16.3      61.2     242.2
                                              ^^^^
                                     paint at 1600 rows is 26.3
```

**A hover is now cheaper than painting the frame it causes.** Two elements
re-style — the row that lit up and the one that stopped — 22,401 are skipped,
and layout does not run at all.

Two mechanisms, both on the element rather than in a side table.

**An element remembers what the sheet last wrote to it**: the class string, the
theme, the four interaction bits, the sheet's generation and the child count.
When all five still agree, the element already contains exactly what the pass
would write and the pass returns without writing. Four scalar comparisons and no
allocation. The sheet's generation is bumped by re-parsing and by a viewport
change, so either invalidates every element at once without touching any of
them.

**A plan knows whether it can move a box.** Each cached plan carries a signature
of its LAYOUT-relevant declarations only. Two plans with the same signature
cannot move anything however much else differs between them — which is exactly a
`:hover` rule that sets a colour. When no element's signature changed, the pass
reports `layoutClean()` and the caller skips layout entirely.

`isLayoutProperty` is conservative by construction: anything not on the
paint-only list counts as layout, so a property nobody thought about costs a
layout pass rather than silently leaving a stale one. `transform` is on the
paint-only list because EVG applies it to the display list after layout — which
is what makes a transform-driven drag free of the geometry pipeline.

### The failure this could have had

Skipping a layout that was needed does not crash. It draws a box where it used
to be — occasionally, only after certain changes, and only until something else
forces a full pass. So the test does not check the classification, it checks the
CONSEQUENCE: two trees, the same edit applied to both, one taking the fast path
and one always laying out, display lists compared. Ten kinds of edit, and each
case also states what it expected the pass to decide — because a pipeline that
never skips passes every comparison and is worth nothing.

Seven mutations. Two are worth writing down:

- **`writeBack` invalidated every element, every frame.** `EVGTransition.reconcile`
  runs on every element in the tree and ends by writing back showing values, and
  the first version of the invalidation hook sat there unconditionally. So on
  every page in this gallery — all of which use transitions — nothing was ever
  skipped. The benchmark could not see it, because a benchmark that runs no
  transitions is not the page. The second version, "invalidate if it has any
  flight", was still wrong: a finished flight stays in the list, so every
  element that had ever transitioned stayed stale forever. It invalidates while
  a flight is MOVING, and `testSkipSurvivesTransitions` is what says so.
- **The hook is not load-bearing at all.** Removing it entirely passes every
  test, because `EVGFlight.hasWrote` already lets a flight recognise its own
  output and carry on. That mutation was run and survived; the comment says so
  rather than claiming a necessity that is not there.

### What the sheet still cannot see

`textContent`. It is not a property, it does not change the child count, and it
changes how wide a run is — so a host that edits text by hand must force a
layout. Nothing here does: text comes from a rebuild, and a rebuild goes through
`EVGReconcile`, which overwrites the element and therefore its style state.
Recorded as a check rather than left as a trap.

A removed child had the same shape and was closed: an element records how many
children it had. An ADDED child was caught anyway — a new element has never been
styled — but a removal has no other symptom, and skipping there draws the
survivors where they used to be.

### `rebuild` and `patch` barely moved, and should not have

242 and 263, against 207 and 269 before. A from-scratch build has nothing to
skip: every element is new, so every element styles and layout must run. The
declarative path's cost is the build (81ms) and the reconcile, and lowering
those is a different project — one the benchmark can now argue about.

## Tree selection, and three things the source said that a reading would not

`selectionFeature` is the first of the ten headless-tree features ReUI's tree
does not enable. It is a MODE here — off by default, because the eighteen
behaviours already measured are measured against ReUI's configuration and must
not move. A fixture asks for it with `"selection": true`, and the DOM reference
builds a different tree.

Fourteen behaviours, two specs, 4,988 observations. Eight mutations, all caught
— but only after three of them exposed the fixture rather than the code, which
is becoming the pattern worth naming: **the mutation that survives is usually
telling you what your fixture does not contain.**

Three findings, none of which a reading of WAI-ARIA would give you:

- **`space` is COMMENTED OUT of the library's selection hotkeys, and that means
  the opposite of what it looks like.** Space still selects — through the click
  path, because a row is a `<button>` and activating one fires `click`, and the
  selection feature's click handler with no modifiers is
  `setSelectedItems([itemId])`. So selecting nine rows with Control+A and then
  pressing Space leaves exactly one selected. The first version kept all nine
  and the reference had dropped eight.
- **A modified click does not open a folder.** The base handler reads
  `if (e.ctrlKey || e.shiftKey || e.metaKey) return;` before the expand branch.
  Miss it and shift-clicking down a list to select a range opens and closes
  every folder on the way past. Found by a divergence on a folder the reference
  had left shut.
- **Shift+Arrow shrinks as well as grows.** When the focused row AND the one it
  is moving towards are both already selected, the FOCUSED one is deselected
  rather than the next one selected. That is what makes walking back over a
  range give the range back instead of doing nothing.

And the fixture lessons, because each cost a mutation that should have failed:

- A click on a row that is not VISIBLE is not a step. It hits nothing on one
  side and cannot be found on the other, and the two disagree about what
  happens to focus — an artefact of the harness, not a finding.
- "Select all" and "select every node" are the same answer until the fixture
  has a closed folder with children in it.
- And even then the difference is invisible, because a hidden row is not in
  either trace. The step that makes it observable is opening the folder
  afterwards — with ArrowRight, not Enter, since Enter would collapse the
  selection first.

The harness grew one thing: a click can carry modifiers (`"mods": ["Shift"]`).
Keys needed nothing — Playwright already understands `"Shift+ArrowUp"` and the
Ranger side passes the string through to the controller.

## Tree drag and drop, and a feature the DOM cannot show you

`dragAndDropFeature` + `keyboardDragAndDropFeature`, both halves. The KEYBOARD
one walks drop targets an arrow at a time; the POINTER one computes a target
from where in a row the cursor sits. They share the target and the drop and
agree about nothing else. The pointer half is written up below.

**The DOM is not the oracle here.** A keyboard drag moves a target between rows
and BETWEEN rows, and the library publishes none of it as an attribute — press
ArrowDown four times and the trace is identical four times over, until the drop
lands. So the targets are captured from the library into `oracle/tree-dnd.json`
and checked field by field, exactly as the table's state machine is:
`npm run ui:tree:dnd:check`, 280 comparisons over five drags. The DOM-observable
half — the drop, the cancel, the focus — is two ordinary conformance specs on
top.

The tree is at 51 of 51 behaviours over 10 specs and 20,521 observations, two
of them measured by the oracle rather than a trace.

### Three rules that decide the whole walk

- **The default `canDrop` is `target.item.isFolder()`.** So an item target on a
  LEAF is rejected and the walk recurses straight past it. That is why one
  ArrowDown can look like it moved two places, and it was the thing that made
  the first hand-derivation of the algorithm disagree with the measurement.
- **At the end of a group the walk changes LEVEL, not position.** A line below
  the last child of a folder steps out to the grandparent's level instead of
  moving down a row — which is how a keyboard reaches "after this whole subtree"
  at all.
- **The insertion index is not the child index.** A child index counts the list
  as it is; the insertion index counts it as it will be once the dragged rows
  have been taken out of it.

### Two focuses, and a drag is where they come apart

`moveDragPosition` calls `setFocused()` on an item target. That moves the
library's own focused item — which the roving `tabIndex` follows — and it is NOT
followed by `updateDomFocus()`, so the browser's focus stays where the drag
began.

Both halves were measured the hard way. The first version moved both, and the
oracle had moved neither. The second moved neither, and the conformance trace
said the tab stop had moved. And it PERSISTS: Escape cancels the drag and leaves
the tab stop wherever the last item target put it, so an arrow after a cancelled
drag starts from there. TreeCtl's key handler reads the library's focused item
rather than the host's focus for exactly this reason.

Six mutations, all caught: 45 failures for dropping the `isFolder` rule, 45 for
dropping the reparent branch, 14 for not stepping into an open folder, 7 for an
uncorrected insertion index, 7 for a drag that carries only the focused row, 1
for Escape dropping instead of cancelling.

### And two more fixtures that did not contain what they were testing

- A child named and never declared. `acme` had `"children": ["jane"]` with no
  `jane` node, so one side rendered a nameless row and the other skipped it, and
  the two disagreed about the fixture before either had done anything.
- A standalone probe that did not rebuild the reference bundle. Two rounds of
  "the drop does nothing" were measuring a bundle from before the change. The
  adapter rebuilds on every run; anything that talks to the page directly has to
  as well.

## Tree pointer drag and drop, and the branch that could not be reached

The other half. A pointer does not walk — it points, and the target is computed
from two numbers: how far DOWN the row the cursor is, which picks above / into
/ below, and how far IN from its left edge, which picks which ancestor's level
a drop at the end of a group belongs to.

Neither number is a coordinate anywhere in this work. `topPercent` is a
fraction because the bands are fractions; `leftPixels` is pixels because it is
only ever compared against the indent, which both sides are told. Sending a
fraction horizontally would make the answer depend on how wide a row happened
to be laid out, and the two sides have no reason to agree about that. The first
capture learnt this the hard way, by recording fractions and getting different
reparent levels on the two sides.

### Three things in the placement rule that a reading would not give you

- **A row you cannot drop INTO has no middle.** `reorderAreaPercentage` is 0.3
  normally and 0.5 when `canMakeChild` is false, so on a leaf the two bands
  meet at the halfway line and there is no third case at all.
- **An open folder takes children from its whole body**, including the bottom
  of the row where an ordinary row would reorder below it. The
  `ExpandedFolder` branch returns before the below-band is ever considered.
- **The reparent level is a floor, not an answer.** `max(minLevel, floor(x /
  indent))`, where `minLevel` is the level of the row BELOW — so pointing at
  the root from the last row of a deep group gets you the next row's level and
  not the root.

### The drag code, and a move that is not a move

`onDragOver` keys on a CODE — row, placement type, reparent level — and returns
before computing anything when the code has not changed. That would be a plain
optimisation except for one detail: **the code's placement is computed with
`canMakeChild` forced TRUE**, while the target's is computed with the real
value. So on a row nothing may be dropped into, 0.4 and 0.6 are the same code
and different targets, and the second move is swallowed. Measured: the target
stays "above" at 0.6, and the drop — which recomputes from its own coordinates
— then lands BELOW. The indicator and the outcome legitimately disagree.

And the code is cleared on a successful DROP and nowhere else. Not on a cancel,
not on a dragstart. So a new drag inherits the last one's code: hold a drag over
a closed folder, start a second drag, hold it over the same folder at the same
place, and the folder never opens, because the move that would have armed the
timer was read as no move at all. That one was found by the DOM harness, not by
the oracle — every oracle run starts a fresh page with one drag in it, so the
case could not arise there.

### `openOnDropDelay`, and time in a controller with no clock

800ms over a CLOSED folder opens it under the cursor. Time arrives through
`dragElapsed(ms)` rather than a wall clock, because a controller that reads the
clock cannot be tested and because the caller owns the frame loop anyway. The
harness gained a `"hold": <ms>` on a `dragpoint` step to match: a real wait on
the DOM side, a clock advance on the Ranger side.

Two of the reference's four arming conditions cannot be observed at all.
Removing the is-a-folder check or the already-open check passes every test —
and that is not a hole in the fixture: opening a leaf and re-opening an open
folder are both `setExpanded(x true)` on something already in that state. They
are kept because the reference has them, and the code says so.

### A branch that could not be reached, and how that was established

Two guards in the pointer path never fire: the library's second `canDrop` after
`getDragTarget`, and the climb to the parent when the parent refuses. Both
survived mutation. The usual reading of a surviving mutation is that the fixture
does not contain the case — so the case was looked for exhaustively: every row
dragged onto every other row, at nine heights and ten indents, 7290
combinations. Zero. The proof is short once you see it: a parent refuses only by
being a dragged row or a descendant of one, since it is a folder by
construction, and either makes the row itself a descendant of a dragged row.
So the row is refused whenever its parent is.

The guards are gone and the argument is in the source. A branch nothing can
reach is not defensive, it is a claim about behaviour that no test can check.

### Fifteen mutations, all caught

The pointer path is 879 comparisons over 19 runs, and every mutation fails at
least one: 44 for flipping above and below, 121 for a drag that does not take
over the selection, 15 for a fixed reorder band, 12 for dropping the reparent
branch, 6 for dropping the open-folder branch, 6 for the early return on the
drag code, 6 for computing that code with the real `canMakeChild`, 6 for
clearing a kept target, 4 each for ignoring the reparent floor and for never
reading `leftPixels`, 1 each for a drop that reads the stored target and for
every arming condition on the folder timer.

Four of those runs exist because the mutation survived first. Three of them
needed the FIXTURE deepened rather than the check sharpened — a second child so
the reparent floor bites, a chain two levels deep at the end of the tree so
there is a case where the floor does NOT bite and the cursor's own answer
survives, and a closed folder, because every other folder in the fixture was
open and `openOnDropDelay` only fires on a closed one.

### The line in the demo

`TreeDemo` draws it. The drop line is a ROW in the flat list rather than a
floating bar, because the list is the only thing that knows where row N is —
and it is two pixels tall with a negative margin either side, so inserting it
moves nothing. It is indented to the level the drop would land at, which is the
only feedback the reparent gesture has: dragging left along the last row of a
group walks the line out one indent at a time, and without the picture there is
nothing to aim with.

The demo's press does NOT start the drag. It arms one, and the drag begins on
the first move past four pixels — which is how one gesture can be both "open
this folder" and "carry it somewhere". Activate on the press and every drag
would toggle a folder on its way out.

Two things were wrong the first time and both were visible only in the paint:
the drop line's ink used `flex-grow`, which EVG has no notion of, so the line
was zero pixels wide and painted nothing (EVG's unit vocabulary has `fill` for
this); and the drop-into outline shrank the row by its own border, so every row
below a target jumped up two pixels the moment the cursor entered one. EVG draws
borders inside the box, the way `border-box` does, and the correction was to
remove the correction.

## Checkboxes in the tree, and the change that was not needed

ReUI's permissions tree puts a checkbox in every leaf row. It looks like a
tree feature and it is not one: its `useTree` is configured with
`syncDataLoaderFeature` and `hotkeysCoreFeature` — the same two as every
other ReUI tree — and the ticked set is an ordinary `useState<Set<string>>`
on the page beside it. The tree does not know the boxes exist.

Copying that here changed **two files, both under `demo/`**. `TreeCtl`,
`UiCtl` and `UiHost` are untouched, and that is the result rather than a
convenience: it is what the component split was for.

Three things fell out of it that are worth writing down.

**There is no `stopPropagation`, because there is no propagation.** The
reference needs `onClick={(e) => e.stopPropagation()}` on the checkbox so
that ticking a row does not also select it. Here the box simply has its own
id, and `EVGHitTest.idAt` answers with the DEEPEST element carrying one — so
a click at the box is a click at the box and a click thirty pixels right of
it is a click at the row. Measured both, at real coordinates.

**The tick travels with the row.** The ticked set is keyed by tree VALUE, so
dragging `New Lead` out of `Leads` and dropping it after `Globex` carries its
tick with it. Keying by visible position would have moved the tick to
whatever row landed in that slot, and nothing on screen would look wrong.

**The reference's accessibility is copied in picture and not in semantics.**
ReUI nests a real `role="checkbox"` inside the `treeitem`, which makes a
reader announce two things where a person sees one. WAI-ARIA's
tree-with-checkboxes pattern has one widget per row and puts `aria-checked`
on the `treeitem` itself. So the box here is `a11yHidden` decoration and the
ROW carries `aria-checked` — leaves only, because a folder shows no box and
`aria-checked="false"` on something uncheckable announces a checkbox that
does not exist. The audit confirms it: ten treeitems, zero nested
checkboxes, folders with no checked state at all.

`toggleIconType="plus-minus"` came along with it, since it is the one thing
in that pattern that IS a Tree option — five lines, and the glyphs are − and
+ rather than the chevrons.

### What was deliberately NOT built

headless-tree ships a real `checkboxesFeature`, and it is a different
product from the pattern above: a folder's tick propagates to its whole
subtree, folders gain a third `indeterminate` state, and
`canCheckFolders` defaults to false whenever propagation is on. None of it
is in ReUI's pattern, so none of it is here. If it is ever wanted it belongs
in `TreeCtl`, captured from the library first — propagation rules and a
tri-state boundary are exactly the shape of thing this repository keeps
getting wrong by reading rather than measuring.

## Timeline, and the component with no oracle at all

Every other component here is measured against a headless library. ReUI's
Timeline has none under it — it is a hand-written component — and its source
could not be reached from this environment: reui.io is refused by the proxy,
there is no npm package, and the plausible GitHub paths are 404. So there is no
trace to diff against, no `behaviours.json` entry and no conformance spec. A
spec here would be a step that cannot fail, which is the thing this harness
exists to refuse.

**What there is, is a picture, and a picture is a measurement.** The reference
rendering `defaultValue={3}` over four items shows:

- the DOT filled for steps 1, 2 and 3, and pale for 4
- the LINE dark between 1–2 and 2–3, and pale between 3–4

So the dot is `step <= value` and the line is `step < value`, and **they are not
the same predicate**. That is the whole finding. The obvious implementation
gives both the same `completed` flag and draws a dark line under the current
step — and `npm run ui:timeline:check` fails four ways when you do.

What the picture does not show is not built rather than guessed: horizontal
orientation, behaviour at a value outside 1..n, and whether the reference's
`value`/`onValueChange` make it interactive. As used, it is a list.

**There is no `TimelineCtl`**, because there is nothing to control. `TreeCtl`
exists because arrows, ranges, drop targets and an insertion index are hard and
worth measuring; a timeline is a list of records and one integer.

### The icons are the real files

lucide-static 1.37.0 (ISC), pasted verbatim. `EVGDisplayList` imports a whole
SVG document — circles, lines and paths, fill and stroke — so the file declares
the geometry and the STYLESHEET decides the colour: `stroke="currentColor"`
resolves to the hosting element's fill. One copy of each icon serves both a
dark dot and a pale one.

The gate checks that neither colour is the parser's default black, because a
mis-spelt property is invisible otherwise — which is exactly what happened.

### Four things that were wrong, and what caught each

- **`fill-color` instead of `fill`.** The property is spelt as SVG spells it.
  The sheet ignores an unknown property without complaining, so every icon came
  out black and the page still rendered. Found by reading the display list's
  colours, not by looking at it.
- **A 4px gap at the wrong end.** The line stopped four pixels short of the
  next dot instead of clearing two at each end. The reference's own arithmetic
  says which: `translate-y-6.5` against a 24px dot is 2, and
  `calc(100% - 1.5rem - 0.25rem)` takes 28 off the height, so 2 and 2. No
  screenshot was going to show that; the check did on its first run.
- **A synthetic probe that lied.** A hand-built row said `align-items: stretch`
  needs an explicit parent height, and a whole `rowHeight` field was written
  around that claim. Measured again on the real page, stretch worked — and then
  removing it changed nothing at all, because the rail's content already adds
  up to the row's height. The declaration was inert and is gone. **Probe the
  real thing, not a model of it.**
- **A stale compiled artifact, twice.** A mutation run leaves the mutated
  `.cjs` behind; the next check reads it and reports a failure that is not
  there, and the next screenshot renders a page that does not exist. Both new
  checks now compile before they read, like every other gate.

`height: fill` is worth one line of its own: it is NOT flex-grow. `EVGUnit`
resolves it to the parent's size, and a child asking for it stops the parent
growing at all. The line's height is therefore a number, computed in Ranger —
the same subtraction the reference writes as a `calc()`, in a language that can
do arithmetic.

One thing the check cannot catch, and says so: layout clamps a child to the
space its siblings left, so a line asked for MORE than the rest of the column
comes out right anyway. Only an undershoot is visible, and there is a mutation
for that.

### The gates

`ui:timeline:check` is 33 assertions and 10 mutations, all caught bar the two
that are provably unobservable. `ui:tree:checkbox` is 23 assertions over the
checkbox composition — the box being its own hit target, a box click leaving
focus and selection alone, the tick travelling with a dragged row, and
`aria-checked` on the row with no nested widget — and 5 mutations, all caught.
Both are in `run-gallery-editor-tests.sh`, which is now 39 suites.

## `aria-orientation`, and six controllers that were quietly silent

Added to the observed field list while starting on the resizable splitter,
where it is load-bearing: two separators in a nested layout have the same role,
the same name and the same value range, and the ONLY thing that says ArrowLeft
moves one and does nothing at all to the other is the orientation.

It was not a resizable problem. Adding the field turned **every** spec red, and
after the two sides were taught to report an absent value the same way, seven
specs stayed red — all of them components that had been at parity for months:

| node | what the reference says |
| --- | --- |
| every menu surface, submenus included | `vertical` |
| a menubar's open menu | `vertical` |
| a VERTICAL separator | `vertical` |
| the slider's THUMB, not its track | `horizontal` |
| the toolbar root | `horizontal` |
| the tabs LIST, not the tabs root | `horizontal` |

Two of those are details a reading would get wrong. **A horizontal separator
says nothing**: `horizontal` is the ARIA default and Radix leaves the attribute
off rather than writing the default down, which is why only the vertical one
diverged. And the orientation sits on **the node that carries the role** — the
slider's thumb rather than its track, the tabs list rather than the tabs root
— which is not where a reading would put it either.

`aria-controls` was deliberately not added. It is an id reference and the trace
is already keyed by test id, so comparing it would only be comparing two id
schemes that have no reason to agree.

+2315 observations, all matching. The lesson is the one `aria-level` taught on
the tree, at a larger scale: **a field the diff does not carry is a field
nobody is wrong about.** Parity at 100% over a field list that is missing
something is parity over the wrong question.

## Plan — Form, and the text field underneath it

The four ReUI patterns asked for (`Field` + `Input`, an error list, a password
with a show/hide toggle, a two-column form with `Select` and buttons) plus the
invoice screenshot are ONE component with a lot of dressing. The dressing is a
weekend. The component is `Input`, and this repo has never had a text field.

> **Reviewed after the resizable and the breadcrumb**, which changed three
> things below. Phase 0 is partly done and its remaining half is smaller than
> it looked; a step was missing from it entirely; and Phase 3 needs an
> affordance the plan did not know about. The revisions are marked ▲.

### Phase 0 — the field list, first, and it will hurt

**Do not start with the components.** `aria-orientation` just taught the lesson
at scale: a field the diff does not carry is a field nobody can be wrong about.
Today the trace observes 23 fields and **not one of them can see the text in a
box**. Build `Input` first and it would reach 100% parity on a trace blind to
its entire purpose.

What has to go in, and how each is compared:

| field | source | note |
| --- | --- | --- |
| `value` | `el.value` | the text itself. Not `aria-valuenow` — that is a number on a slider |
| `selstart`, `selend` | `el.selectionStart/End` | where the caret is, and what is selected. The only way a keyboard test can fail |
| `invalid` | `aria-invalid` | the error pattern's whole state |
| `required` | `aria-required` | Radix already emits it and we have never compared it |
| `readonly` | `aria-readonly` | mirrored by `evg-a11y.js` already, never compared |
| `placeholder` | attribute | what a reader announces on an empty box |
| `describedby` | **resolved to TEXT** | see below |

`describedby` is the interesting one. The error list reaches a reader ONLY
through `aria-describedby`, and comparing the raw attribute would be comparing
two id schemes with no reason to agree — the same argument that kept
`aria-controls` out. So resolve it: follow the ids, concatenate the text, and
compare THAT. The same resolution is needed for `name`, because an input's
accessible name comes from a `<label for>` OUTSIDE it and our tree computes
names from content. **Name-from-elsewhere is a genuine engine gap and Phase 0
is where it gets closed.**

Expect this phase to turn specs red. That is the return on it.

▲ **Partly done, and it paid immediately.** `invalid`, `required`, `readonly`
and `current` are in the list now, along with `orientation` from the resizable
work. Adding `required` — before there is any form — turned the radio group red
on its first run: **Radix publishes `aria-required="false"` and this side
published nothing**, and then the toggle group red on its second, because it
shares the controller and Radix does NOT publish it there. Absent and "false"
are different claims, and neither was visible before.

Still to do: `value`, `selstart`, `selend`, `placeholder`, and `describedby`
resolved to text. Those have no source until the text field exists, so they
belong with Phase 1 rather than ahead of it.

▲ **And a step that was missing: the implicit-role table.** The DOM snapshot
maps tags to roles for the trace, and that table had grown one component at a
time — `button`, `a`, `table`, `tr`, `td`, `th`, `input` and nothing else.
Completing it for the breadcrumb's `nav`/`ol`/`li` turned **two long-passing
components red**: the navigation menu was not a landmark and its list not a
list, and the toast viewport was not a list of toasts. It has now been
completed for a form's tags too — `form` (a landmark only when named, which is
the HTML-ARIA mapping and not a simplification), `fieldset`, `textarea`,
`select`, `output` — so that table stops being a component late.

The general form of this is worth stating once: **the trace has two blind
spots, not one.** A missing FIELD makes a property invisible; a missing tag
mapping makes a whole NODE's role invisible. Both were found this week, and
neither by the same instrument — the field by a component that needed it, the
tag table by a component built from tags nothing had used.

### Phase 1 — the text field primitive

The one real piece of engineering here, and the reason `Input` is not a
weekend.

**Caret geometry needs no new metric.** `EVGTextEngine.measureRun(text, family,
size)` measures a whole string, and the caret's x for index `i` is
`measureRun(text[0..i])`. Exact by construction, because it is the same
measurement the painter uses — the same reason `breakLines` measures whole
candidate lines rather than summing words. A click maps back the other way by
bisecting over prefix widths. O(log n) measurements per click, and no
per-glyph advance table to keep in step with the font.

What `InputCtl` owns:

- caret index and selection anchor; `selstart`/`selend` derived, never stored
- insert, Backspace, Delete; Arrows; Shift+Arrows; Home/End; Ctrl+A
- word motion (Ctrl+Arrow) and double-click-selects-word, which need a word
  boundary rule — measure the browser's, do not invent one
- a horizontal scroll offset once the text is wider than the box, and the rule
  that keeps the caret in view (which is NOT "centre it")
- `type="password"`: the VALUE is the text and the GLYPHS are bullets, and
  those must not be the same string anywhere
- placeholder when empty, which is drawn text and not a value

**The oracle is a real `<input>`.** Everything above is observable — `value`,
`selectionStart`, `selectionEnd` — so this is ordinary conformance, no
bespoke capture. That is worth saying out loud: the hardest component here has
the easiest oracle.

Explicitly NOT in scope, and each is a real thing being declined: IME
composition, RTL and bidi caret movement, the clipboard, an undo stack,
spellcheck, autofill.

### Phase 2 — the harness has to be able to type

`{"key": "a"}` already presses one key. Typing needs a step:
`{"type": "hello"}` → `page.keyboard.type` on the DOM side, characters fed to
the controller on ours. Small, and nothing in Phase 1 can be tested without it.

### Phase 3 — Field, FieldLabel, FieldError, FieldGroup

▲ **This needs the two-pass affordance the breadcrumb just needed**, and the
plan did not know it. Layout happens after the tree is built, so any component
whose CONTENT depends on its own measured size — a breadcrumb that collapses, a
field whose error list wraps, a label that truncates — needs measure, decide,
rebuild, and somebody has to own the decision between the passes.
`BreadcrumbCtl` owns none of it: it is told the width and answers what to draw,
and the caller does the measuring. That is the shape to reuse, and it should be
settled here rather than reinvented per component.

▲ **Axe is a third instrument and it finds different things.** On the
breadcrumb it caught what the diff could not: a `role="list"` whose children
are buttons is invalid, and Radix's `<li>` carries no test id so it was in
NEITHER trace. A form is full of that shape — `fieldset`/`legend`,
`label`/`control`, error lists — so run `ui:a11y` early and often here, not
only at the end.


Mostly composition once Phase 0 exists: the label names the input, the error
list describes it, `aria-invalid` marks it. `FieldGroup` is a `role="group"`.
The one thing to measure rather than assume is whether the reference makes the
error list a live region — if it does, the announcement is part of the
contract; if it does not, a screen reader user learns about the error only on
focus, and that is worth writing down either way.

### Phase 4 — the rest of the inputs, in this order

1. **Textarea.** The caret goes 2D; `breakLines` already exists, so this is
   caret-index ↔ (line, column) and vertical arrows that remember a desired
   column.
2. **Number**, which is `Input` plus a step and a range.
3. **Date field** (the invoice's `Apr 24, 2026` with a calendar button) —
   segmented editing is its own contract, measure before writing.
4. **Combobox** (the invoice's `Customer` with a clear ×) — `Select` and
   `Input` already exist; this is the two wired together, and it is the one
   with the richest ARIA.
5. Password show/hide is NOT a component: it is a `button` with `aria-pressed`
   beside an input whose type flips. Already expressible today.

### Phase 5 — the demo, which is the invoice

Sections with a heading, a description and a badge; two- and three-column
grids; icons inside inputs; a `+ Add item` button. It is a layout showcase, and
that is the point: it is where the grid and the intrinsic-width bugs will turn
up, the way the timeline's rail found `fill` and `stretch`.

### Ordering, in one line

Field list → text field → typing step → Field wrappers → more inputs → invoice.
Anything that starts further down that list is building on a trace that cannot
see what it built.

### ▲ Done: phases 0-3, and what they turned up

`InputCtl` exists, the harness types, and nine specs drive it against a real
`<input>` — `input_typing`, `input_caret`, `input_word_motion`,
`input_placeholder`, `input_maxlength`, `input_readonly`, `input_disabled`,
`input_required`, `input_password`. `value`, `placeholder`, `selstart`,
`selend` and `description` joined the compared fields; `type` and modified
`key` joined the steps; `keyDownWith` and `typeChar` joined `UiCtl` beside the
`activateWith` they were modelled on.

**Three rules were wrong on the first run, and the reference said so.**

- **Ctrl+ArrowRight lands on the END of a word, not the start of the next.**
  The mirror image of `wordLeft` reads naturally and is not what the platform
  does: on `"alpha  beta gamma"` from 0 it gave 7 where Chromium gives 5.
  Backwards lands on a word's start and forwards on its end — both on the
  word's own edge, and the asymmetry is the finding.
- **A readonly field has no caret at all.** Not "takes arrows but will not
  change": Chromium reports `selectionStart` at the value's length through
  Home and every arrow, which is what a field with no selection hands back.
  Focus alone does not give a readonly input a caret, so there is nothing for
  a key to move.
- **`required` and `readonly` are ATTRIBUTES on a native control**, and the
  snapshot was reading only the aria form — so `<input readonly>` reported
  nothing at all. The same trap `checked` fell into on a native checkbox, one
  component later. And the fixture had been written with `aria-required`
  beside the native one, which is making the oracle agree with this side
  rather than measuring it.

**And `description` found three holes that had been there for months.** A
compared field nobody had is a field nobody can be wrong about, and the moment
`aria-describedby` was resolved to its text, three long-passing components went
red: **a tooltip that never described its trigger** (the sentence a tooltip
exists to say, invisible to a reader), an alert dialog whose body text reached
nobody, and every dnd-kit item's keyboard instructions — a pattern with no
visible affordance, where the sentence IS the interface.

**Still open, and each for a stated reason rather than an oversight:**

- **`input_click_caret`.** A click DOES place the caret on both sides, and
  agreeing about where needs the two boxes to be the same width in the same
  font. They are not — see the measurer task — so `input_caret` uses `focus`.
  It passed with a click only because `"one two three"` does not fill the box,
  so the centre landed past the end of the text and both sides said 13. A
  check that passes by coincidence is worse than no check.
- **`aria-pressed` on a demo-built tree.** `EVGElement` has no field for it,
  so the password's show/hide button carries the state in its NAME instead —
  "Show password" then "Hide password", which is the other accepted spelling.
- **`required` and `invalid` on `EVGA11yNode`.** Measured properly through the
  conformance trace; a demo tree cannot state them, and half-stating them
  would be a second, weaker answer.
- **Phase 4's textarea, date field and combobox**, which are the three where
  the caret goes somewhere new.

### ▲ A second reference: Profile Settings, and what it asks for that the first did not

The invoice form is a COLUMN — label above control, one field per row, two
halves where they fit. The second reference is a **row**: the label sits to the
left of the control and every control's left edge lines up down a single
column, which is a different layout claim and the one that finds different
bugs. Both are worth having, so it is a second demo rather than a rewrite of
the first.

What it adds, in the order it is worth building:

1. **The label-left layout itself.** A label column of a stated width and a
   control column that takes the rest, with the two vertically centred against
   each other whatever height the control is. The switch row and the tag row
   are different heights and both have to sit right.
2. **A switch**, which `SwitchCtl` already is — a toggle whose label is beside
   it rather than above it, and the only control in the picture whose state is
   drawn as a position rather than a mark.
3. **A select**, which `SelectCtl` already is: a closed trigger showing the
   chosen label and a chevron. Opening it needs the overlay the dropdown demo
   already has, so the open state is real work and not decoration.
4. **A tag input** — chips with a `×` each, and an inline placeholder after the
   last one that types into the same box. This is genuinely new: a listbox of
   removable tokens sharing a line with a text field, and the interesting part
   is what Backspace does at position 0 (it takes the token before the caret,
   which is the whole reason the pattern feels right).
5. **A date field and a time field.** The plan already declines segmented
   editing until it is measured, and that has not changed — so these are drawn
   as text fields with an icon, the calendar on the right and the clock on the
   left, and the demo says so rather than implying a date picker that is not
   there.
6. **A badge and icon buttons**, which are presentation: a pill in the header,
   an avatar with Change/Remove beside it, and a footer with a hint on the left
   and two buttons on the right.

## Resizable, and a reference that publishes an impossible range

ReUI's is react-resizable-panels, and its own prop names give it away:
`orientation` and percentage strings (`"50%"`) are that library's API and
nobody else's. A generous oracle and an easy one — one role, four attributes
and a keyboard, all DOM-observable — so ordinary conformance, no capture.

Six specs, 12 behaviours, 5245 observations. Five things measured that a
reading would not give you:

- **The orientation inverts.** A separator in a HORIZONTAL group publishes
  `aria-orientation="vertical"`. That is right: the attribute describes the
  separator LINE, which stands across the axis it resizes.
- **And the key handler reads the other one.** ArrowLeft moves the separator
  whose GROUP is horizontal — the same separator that publishes "vertical".
  Two orientations, opposite values, both correct.
- **`aria-valuenow` is the panel BEFORE**, so moving one separator changes the
  next one's published value.
- **Enter collapses the panel before, too.** With only the second panel
  collapsible, Enter does nothing at all and reads as unimplemented — which is
  exactly how it read here until a fixture put `collapsible` on the first.
- **F6 stays inside its own group.** In the reference's own nested example each
  group has one separator, so F6 focuses the one it is already on and looks
  broken. It took a group of three panels to see it work.

### Two places this deliberately does not copy the reference

**An impossible range.** From three panels up, every separator but the first
publishes an incoherent one. Measured at 20/30/50, the second says
`aria-valuemin=50`, `aria-valuenow=30`, `aria-valuemax=0` — min above now above
max, with valuemin tracking the CUMULATIVE size up to that panel rather than
any minimum. No assistive technology can use that. So this side publishes a
coherent range, `separator-constraints` is catalogued **disputed** with the
numbers, and the harness gained a per-spec **`ignore`** list: fields a spec
declares disputed go out of the denominator entirely rather than counting as
matches, with `$ignore` in the spec saying what was measured and why. Two
panels, where the reference is right, are measured in full.

**An unnamed focusable control.** The library names no separator, leaving one
announcing "50, separator" and nothing about what it splits. That is an
omission, not a contract, so both sides name it after the panel it resizes —
a divergence that ADDS rather than changes, and the only one here.

The a11y gate found the second one, along with a separator that had no height
at all — which is not pedantry: a focusable control with no box is one a
pointer cannot reach and a focus ring cannot be drawn around.

## Breadcrumb, a component with no oracle, and a role table that was short

Radix has no breadcrumb and neither does anything else ReUI uses: the
reference is markup. So the DOM side of these two specs is a SECOND
IMPLEMENTATION of the HTML and ARIA specs, written here — it catches the two
sides disagreeing and **cannot catch both of them being wrong**. That is a
weaker guarantee than the tree's or the table's and the catalogue says so.

The half worth having is the collapse. A trail too wide for its box drops
crumbs, and which it keeps is a rule rather than a preference: **the first,
because it is the way out; the last, because it is where you are; the one
before it, because it is one step back.** Everything else becomes one ellipsis,
named "More" so a reader learns crumbs are missing rather than hearing three
dots. That is what the reference's screenshot shows — `Home > … > Components >
Breadcrumb` — and it is the floor, too: below first-plus-last there is nothing
left to drop, so the trail OVERFLOWS rather than lying about where you are.

The controller measures nothing. It is told the available width and each
crumb's width and answers which to draw, which keeps the rule testable without
a font — and it is the only shape that works in EVG at all: **layout happens
after the tree is built, so a component whose CONTENT depends on its own width
needs two passes and somebody has to own the decision between them.** Here the
caller owns it. That is the affordance a `Field` will need too, and it is worth
knowing before the form work starts.

### Two more fields, and two more silent controllers

`aria-current` went into the observed field list, because a breadcrumb's whole
claim is which crumb is the page you are on and the trace could not see it.

Then the DOM snapshot's implicit-role table turned out to be **short**. It knew
`button`, `a`, `table`, `tr`, `td`, `th` and `input` — grown one component at a
time — and had never needed `nav`, `ol`, `ul` or `li`. Completing it turned two
long-passing components red:

- **the navigation menu was not a landmark.** Radix renders
  `NavigationMenu.Root` as a `<nav>` and its List as an `<ol>`; this side
  reported no role for either, so a reader could not jump to it.
- **the toast viewport was not a list**, and each toast not a list item, so
  nothing told a reader how many notifications were waiting.

And then axe found what the diff still could not: a `role="list"` whose
children are buttons is invalid, because Radix's `<li>` carries no test id and
was in **neither** trace. Tagging it made both sides able to be wrong about it.
Three different instruments, three different findings, none of which the other
two could have made.

## How much of a component is hand-work the engine should have done

Asked directly, and worth answering with a measurement rather than an opinion:
strip one hardcoded size at a time from a demo's stylesheet, lay out again, and
compare. **A declaration that changes nothing is one the engine was going to
work out anyway.** Across `tree.css`, `timeline.css` and `resize.css`, 56 fixed
sizes:

| | count | what it means |
| --- | --- | --- |
| the engine already knows it | **20** | pure redundancy, delete on sight |
| the engine says a DIFFERENT number | 24 | a hand-rounded override — usually wrong |
| the engine genuinely cannot | 12 | a real gap, or a real decision |

The middle row is the uncomfortable one. `.tv-label { width: 340px }` makes a
tree label 340 pixels wide when its text is **38.5** — which is why the
checkbox beside it needed a margin, and why hit-testing a label hits far past
the text. `.tl-title { width: 362px }` against 129. These are not conservative
defaults; they are wrong numbers that happen to look right because nothing
beside them is competing for the space.

### The gap that caused most of it, now closed

`EVGLayout.intrinsicWidth` stopped at text leaves, and its comment said why:
*"sizing a container to its subtree needs a real intrinsic pass, and reporting
a made-up number would silently misplace every neighbour."* Fair when the
alternative was a guess. The alternative had become **every component
hand-setting a width its own children already knew**, which is worse and does
not stay correct.

So the pass is written: a container's max-content width is the sum of its
children along the row axis and the widest of them down the column, plus gaps
and chrome — the recursive definition, terminating on the leaves that were
already handled. And a width-less flex CONTAINER now shrink-wraps to it, which
is what `flex: 0 1 auto` does in CSS and what this engine did not do.

Measured on the breadcrumb, which is where it was noticed: six hand-set widths
in the demo, **five of them redundant** — the engine already sized every text
leaf correctly at 32, 86, 40, 72, 75 — and the sixth compensating for the
container gap. After the change: **none**. Every gate stayed green, including
all 40 editor suites.

### The gaps still open, in order of how much hand-work they cost

1. **Intrinsic HEIGHT for text is computed but routinely overridden.** The
   engine does line-count × line-spacing correctly; the stylesheets state
   rounded numbers instead (`height: 20px` against 16.8, `22px` against 18).
   Twenty of the twenty-four overrides are heights. Nothing needs building —
   the numbers need deleting, one component at a time, with a look at each.
2. **`align-items: stretch` against a content-sized parent.** A splitter has to
   state `height: 298px` to span its group. This was written up earlier as
   "inert" on the timeline, and that was true THERE for a specific reason: the
   rail's content already summed to the row height. It is not inert in general
   and the earlier note oversold it.
3. **An SVG element has no intrinsic size.** `.tl-icon` reports 0 without a
   stated width, so every icon states one. A `viewBox` is an aspect ratio and
   the engine could use it the way a browser uses an image's.

### And one that was invisible from either direction

`EVGA11yFromTree` could not read a value range off an element at all — no
`a11yValueNow` field existed. A page built from a CONTROLLER publishes one
through `UiRow`; a page built from ELEMENTS could not, and the two paths feed
the same tree. Axe found it, on a focusable `separator` with no value: not a
splitter, a decoration that has taken a tab stop. Now readable from both.

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
`text-align` was the other one and it cost exactly that — it is now read by the
display list, found by a row of cards whose labels sat in the top-left corner
however they were styled.


The harness already names the limit: `EVGStyleSheet` matches one class token
per selector, so there are no compound or attribute selectors, and no real
utility-class theme.

- [ ] Move the cascade onto `gallery/css/CssCore`, which already has selector
      specificity
- [ ] Compound selectors (`.ui-toggle.state-on`), then attribute selectors
- [ ] A generated Tailwind-subset utility sheet + theme tokens on top of that

## Next — from identity to a component model

`key` and `EVGReconcile` are step one of a longer list, and the rest is
language work rather than library work. In the order that pays:

- [x] **Persistent component instances.** `EVGComponent` + `EVGComponentHost`,
      above the element layer rather than inside it
- [ ] **`component` / `state` / `view` as syntax**, lowering the way
      `treefactory` does — to code the type checker already knows how to check.
      Two things the compiler can do that the library cannot: fold the CALL
      SITE into a component's identity, and give `state` a static slot so it
      never depends on the order the view ran (which is the whole reason React
      has to forbid a hook inside an `if`)
- [ ] **The litmus test for that step: `Tabs`.** Small enough to read in one
      screen and it proves three things at once — the component instance
      survives, its `state active` survives, and the element identity survives.
      Dialog and Menu come after it, for focus and ARIA; a Grid is the stress
      test, not the first test
- [x] **A resolved-style cache.** 3.4× on the cascade, 2.2× on the whole
      retained frame
- [x] **Invalidation classes.** A hover is 16.3ms against a 26.3ms paint at
      1600 rows — cheaper than drawing the frame it causes
- [ ] **A retained display list.** It is what is left of a hover: 13.8 of the
      16.3ms. Per-element command spans, patched rather than rebuilt
- [ ] **A transform-only path for motion values.** Half of it exists already —
      `transform` is classified paint-only, so a drag skips layout. What is left
      is skipping the style pass and the display-list rebuild too
- [ ] **Dependency tracking**, and not before the three above have been
      measured
- [ ] **Declarative event handlers**, so a component reads from one place
- [ ] **`computed`**
- [ ] **A high-frequency path for motion values.** Structural state (order,
      selection, which folder is open) can drive a rebuild; pointer position
      and drag offset change 60–120 times a second and should invalidate paint
      without re-laying-out a subtree. `dragPage`'s preview coordinates are
      that case today, and they currently go through a full rebuild
- [ ] **`context`**, and only then a store

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
