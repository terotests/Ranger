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
