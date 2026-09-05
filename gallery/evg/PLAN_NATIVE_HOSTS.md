# Native hosts — a spike

How far EVG can move from "a native 2D API paints our list" towards "the
platform's own presentation tree shows our document", on the three platforms
that have a painter today: the browser, Apple (UIKit / SwiftUI) and Android
(View / Compose). What the platform can genuinely do better than a canvas,
where the wall is, and what to try first.

Status: **S0 and S1 built** (§8) — the platform measurers, and the engine off
the UI thread on all three platforms with the RealTrainer hosts on it; the
rest is design. The numbers
in it are measured from the repository as it is (`npm run rt:bench 40`, the
stylesheet tallies in §3.3), not projected.

Related: [`README.md`](README.md) (the pipeline and the seam),
[`gl/README.md`](gl/README.md) (the display list as a GPU input),
[`html/evg-html.js`](html/evg-html.js) (the SVG painter and its header on
identity), [`PLAN_ACCESSIBILITY.md`](PLAN_ACCESSIBILITY.md) (the second list),
[`inspect/README.md`](inspect/README.md) (the path identity),
[`apple/README.md`](apple/README.md), [`android/README.md`](android/README.md),
[`../ui/PLAN_INPUTS.md`](../ui/PLAN_INPUTS.md) (the text-input bridge).

---

## 0. The short version

Three levels of "native", and the middle one is the one to build:

| | What the platform gets | What EVG keeps | Print parity |
| --- | --- | --- | --- |
| **L0 — painter** (today) | a flat list of quads, runs, paths, clips | everything: cascade, layout, lines, hit test, a11y | exact |
| **L1 — native nodes, EVG geometry** | one real node per element (a `div`, a `View`, a composable), placed at the rectangle EVG computed | cascade, layout, line breaks, hit test, a11y *content* | exact, same lines |
| **L2 — native layout** | the platform lays the boxes out itself (CSS flex/grid, SwiftUI stacks, Compose Row/Column) | the tree, the stylesheet, the controllers | broken unless test-gated |

The claim the engine makes everywhere — *the same tree, styled by the same
sheet, comes out the same on every target* — is exactly what L2 gives up.
Every platform lays flex out slightly differently (§3.3, §4.3, §5.3 list the
deltas), and none of them can be asked to lay a page out the way the PDF was.
So L2 is an **opt-in mode behind a conformance oracle**, not the default, and
only the web has an oracle for it today (`PLAN_CSS_LAYOUT_AND_FONTS.md` §4.1
rule 9: the box model and 20 grid fixtures are already checked against
Chromium).

L1 is where the platform's real advantages live and none of the parity is
lost: element identity that survives a frame, the platform's text-input
session, its scrolling and compositor, its accessibility tree *as the tree*
rather than a mirror, its animations, and — on every platform — the engine
running **off the UI thread**. What L1 needs from EVG is one new thing, and it
is the same thing on all three platforms: a derived channel that says *what
changed*, keyed by an identity that survives a rebuild (§6, D2).

**Does this fight the engine's design?** Only at L2. The design has two
halves — *one layout, so every target agrees*, and *a dumb seam, so a painter
is small* — and L1 keeps the first and adds a second seam beside the second:
a host tree next to the display list, derived on the same pass by the same
rule the a11y tree and the inspector already follow. A painter stays a
painter. What L1 gives up is a slogan, not an invariant: the display list is
no longer the *only* way out of the engine. L2 is the one that trades the
first half away, which is why it is a mode and not a default.

The order to try it in is **web first** (the platform already has everything
L1 needs and the parity harness exists), **Compose second** (its `Layout`
composable is the cleanest fit any of the three has for "EVG measures, the
platform hosts"), **SwiftUI third** (the same fit through the `Layout`
protocol, but with a view-count ceiling that decides which apps qualify).

---

## 1. Where things stand

The pipeline is `tree → cascade → layout → display list → painter`, and the
seam below the display list is load-bearing (`README.md`, "The display list").
The three platforms in question are all painters:

| Platform | Host | Painter | Per frame |
| --- | --- | --- | --- |
| Browser | `<canvas>` + WebGL 2 (`gl/evg-webgl.js`) or `<svg>` (`html/evg-html.js`) | instanced quads / SVG nodes rebuilt | list → GPU buffers, or list → new SVG tree |
| Apple | `UIView` (`ui/ios`, `realtrainer/ios`), SwiftUI `Canvas` (watch) | `EvgPainter.swift` over `CGContext` | every command re-rasterised |
| Android | `View` (`ui/android`, `realtrainer/android`) | `EvgPainter.kt` over `android.graphics.Canvas` | every command re-rasterised |

What the engine already does that an L1 host would lean on:

* **Retention.** `EVGReconcile` keeps element objects across a rebuild by
  `key`; the style cache reports `layoutClean()` / `nothingChanged()`; a
  scroll container's clip is a **layer** whose commands are moved in place
  (`EVGDisplayList.refreshLayers`); a `keepLayout` subtree is a **fragment**
  whose commands are reused, not rebuilt.
* **Identity that exists but is not on the seam.** `EVGElement.key`
  (sibling-scoped), `EVGInspect`'s structural path (`0/3/k:share`),
  `inspectSlot` on the element and `EVGDrawCmd.node` on the command — the
  last two only while the inspector is attached.
* **Four derived lists from one walk:** the display list, the hit test, the
  a11y tree, the inspector tree. The rule they share ("derived from the
  laid-out tree, same pass, recomputes nothing") is the rule a fifth list
  would follow.
* **The platform already owns text input on the web.**
  `gl/evg-textinput.js` parks a real `<input>` over the drawn field and
  Ranger mirrors it. RealTrainer's Android port commits through an
  `InputConnection`; its iOS port becomes first responder and types through
  the same bridge.
* **A binary scene format built for a thread hop.** `toBinary()` writes an
  `EVGSceneBinary` whose `cmds`, `pts` and `ends` are `int_buffer`s — an
  `Int32Array` on the JavaScript target, and therefore transferable to and
  from a Worker with no copy. Its header records why: 12 ms of layout was
  followed by 62 ms of `toJson` and 19 ms of `JSON.parse` on a 10 084-command
  slide.

And what a scroll frame costs on the engine side, on the app that is most
like a phone app (`npm run rt:bench 40`: a 40× diary, 390×844, 200 scroll
frames):

```
scrollDocument                      0.00 ms
+ display()                         0.04 ms
+ displayListJson()                 0.34 ms
+ JSON.parse                        0.64 ms
hitId()  (per pointer move)         0.03 ms
a11yJson() + parse  (settled only)  3.96 ms
177 draw commands, 24185 bytes
```

The engine's share of a scroll frame is well under a millisecond. Whatever a
scroll frame costs on a device today, it is being spent **below the seam** —
in the painter re-rasterising 177 commands, and on the browser in the DOM
mirror the a11y tree is rebuilt into once the page settles. That is the
budget an L1 host is competing for, and it is why "native" here means
*hosting*, not a faster layout.

---

## 2. The three levels, and what decides between them

**L0 — the painter.** What exists. The platform contributes glyph
rasterisation, a 2D API and nothing else. Text is a picture; a screen reader
gets a mirror; a text field is a proxy; the compositor never sees a layer.

**L1 — native nodes, EVG geometry.** One host node per element, or per kept
subtree, placed at `calculatedX/Y/Width/Height`. The host does what a canvas
cannot:

* keep a node's **identity** — so a CSS transition, a focus ring, a caret,
  a `UITextField` or a `BasicTextField` has something to attach to;
* run **text input** in the field itself rather than over it;
* **scroll and animate on the compositor** — a scroll layer becomes a
  `transform: translate`, a `CALayer` position, a `graphicsLayer`
  translation, and the UI thread is not in the loop;
* publish **accessibility as the tree itself**: a `<button>` is a button,
  `Modifier.semantics` is the a11y node, `.accessibilityLabel` is the name —
  and the separate mirror (3.96 ms a frame, on settle) goes away on the web;
* let the engine run **off the UI thread**, because what crosses to the UI
  thread is a diff of nodes and rectangles, not a call into the engine.

Geometry stays EVG's, so the hit test, the a11y rectangles, the inspector and
the PDF still agree with the picture. The one thing that moves is **who
measures text** (D3): the platform's own metrics, so that the glyphs the host
draws are the glyphs EVG wrapped with — but the *breaks* stay EVG's.

**L2 — native layout.** Emit `display: flex`, an `HStack`, a `Row`, and let
the platform place the children. This is what the question in the title is
really asking, and the honest answer is that it works for the common subset
on each platform and stops at a different place on each:

* CSS is the only one of the three that has EVG's model *natively* — flex
  with grow/shrink/basis, wrap, grid with `fr` and `minmax` and areas.
  The mapping is small (§3.3) and the deltas are known and testable.
* SwiftUI has stacks and `Grid`, no `flex-shrink`, no `flex-basis`, no
  wrapping `HStack`, and a `Layout` protocol for everything else — which is
  where EVG's own algorithm would go (§4.3).
* Compose has `Row`/`Column` with `weight`, `FlowRow`, no CSS grid, and a
  `Layout` composable that is the cleanest custom-layout API of the three —
  and, again, EVG's algorithm is what would go in it (§5.3).

So on the two mobile platforms "native layout" collapses into "EVG's layout
running inside the platform's layout protocol", which is L1 with extra steps.
On the web it is a real option — and it is the option that breaks print
parity, because a browser's line breaking is not `EVGTextEngine`'s and its
sub-pixel flex arithmetic is not `EVGLayout`'s (ISSUES #8 exists because the
two were compared). L2 on the web is therefore a **mode**: the page becomes a
DOM application whose hit testing is DOM events and whose a11y is the DOM,
driven by Ranger controllers, and it is checked against the existing
Chromium oracles rather than trusted.

---

## 3. Web

### 3.1 What exists

* `html/evg-html.js` — the display list as `<svg>`. Rebuilt every frame; the
  header says why it cannot do otherwise: *"a draw command carries no id … so
  every frame rebuilds every node, and a CSS transition, a focus ring or a
  native `<input>` has nothing stable to attach to. That is a property of
  the SEAM, not of this file."* Differenced against WebGL at 0.022 % on the
  feature sheet, 0.000 % on the pptx deck.
* `EVGHTMLRenderer.rgr` — the print preview: absolutely positioned `<div>`s
  from `calculatedX/Y`, one per element, with real `@font-face`s. Not
  retained, not interactive, but it is already the L1 *shape*.
* `gl/evg-a11y.js` — the a11y tree as DOM over the canvas.
* `gl/evg-textinput.js` — the `<input>` proxy.
* `inspect/` — a structural path per element and `EVGDrawCmd.node`.

Every piece of an L1 web host is on the shelf. What is missing is the one
that ties them: a painter that walks the **tree**, keeps its nodes, and is
told what changed.

### 3.2 L1 — a retained DOM painter (`html/evg-dom.js`)

One DOM node per element, created once, patched thereafter:

| `elementType` | Host node | Notes |
| --- | --- | --- |
| container | `<div>` `position:absolute; left/top/width/height` from EVG; background, border, radius, shadow, opacity as CSS | `overflow` other than `visible` → `overflow:hidden` and a child layer `<div>` that carries `transform: translate(-scrollLeft, -scrollTop)`; a scroll is then a compositor-only style write |
| text | one `<div>` per **EVG line**, `white-space: pre`, the run's font, at the line box EVG placed | the browser must not wrap: EVG already broke the paragraph, and the PDF broke it in the same place. Bidi forced off as `evg-html.js` does (U+202D … U+202C) |
| image | `<img>` inside a clipping `<div>` | the `object-fit: cover` crop as `EVGHTMLRenderer` already does it |
| path | an inline `<svg>` with one `<path d>` per element | rings and `fill-rule="evenodd"` verbatim, exactly as `evg-html.js` — this is the one place SVG is chosen inside a DOM tree, and the reason the file's own header gives for SVG |
| a control (`role` set, or `a11yFocusable`) | the semantic element: `<button>`, `<input>`, `<div role=…>` | the a11y attributes go on the node itself; `evg-a11y.js`'s mirror is not needed for a tree that IS the DOM |
| a field (`InputCtl`) | a real `<input>` / `<textarea>` styled from the element | the proxy becomes the field; `applyEdit(value, selStart, selEnd)` is unchanged |

**Ordering.** DOM paint order is tree order plus stacking; EVG's is the
display list's, which the hit test walks backwards. Overlays and absolutes
are already placed after the flow (README, "Overlays"), so an overlay's node
appended last in its stacking context draws last. `z-index` is not in the
CSS subset and need not be: the tree order the list already emits is the
order the nodes are appended in.

**Transitions.** Two choices, and the recommendation is the boring one: keep
`EVGTransition` as the clock and write the *showing* value to the node, so
`ui:test`'s timing gates still hold and a transition on iOS and on the web
are the same code. CSS `transition` is available as an optimisation for
paint-only properties once the identity exists — it is the thing the current
painter cannot do at all.

**Fonts.** The demos lay out with `SimpleTextMeasurer` — a measured advance
table from a browser's sans fallback — and draw with the system sans. With a
DOM host the draw face is the same face; the table is a snapshot of it. An
`EVGTextMeasurer` backed by `CanvasRenderingContext2D.measureText` (the
metrics `evg-html.js` already caches per face) closes the loop: the wrap the
engine computes is the wrap the browser draws (D3).

**What it is checked against.** The same `parity.mjs` that holds the SVG
painter to the WebGL one, run on this painter; `ui:demo:page` for the text
session; the a11y gates with the mirror switched off and the tree asked
directly. The number to beat is the SVG painter's 0.022 %.

### 3.3 L2 — native CSS layout, as a mode

The mapping surface is small. Across `gallery/realtrainer/web/realtrainer.css`
and the eighteen `gallery/ui/demo/*.css` sheets:

```
2410 lengths in px, 44 in %, 6 in vh, 4 in rem, 1 in fill — no hp or em in these sheets
 457 display: flex      3 display: grid      3 display: none      1 display: block
 339 flex-wrap: nowrap (explicit)          15 flex-wrap: wrap
  16 position: absolute   13 position: relative
  81 lines that name something CSS does not have: overlay-*, evg-*, scrollbar-*, hp, fill, @vars
```

| EVG | CSS | Delta |
| --- | --- | --- |
| `display: flex` and the flex properties | the same | `align-items` defaults to `flex-start` here and `stretch` in CSS; `flex-wrap` initialises to `wrap` here and `nowrap` in CSS — so the emitter **writes both explicitly on every flex box** |
| `gap`, `justify-content`, `align-content` | the same | — |
| `display: grid`, tracks, `repeat`, `minmax`, areas, spans, `subgrid` | the same | no `auto-fit` / `auto-fill` on this side; the browser has it, so nothing to lose |
| `%` | the same | percent padding on the vertical axis was fixed to resolve against width, as CSS does (`PLAN_CSS_LAYOUT_AND_FONTS.md` 4.1 rule 9) |
| `hp` | `calc()` against the parent height, or `%` on a height property | not expressible on a width property without `calc()`; unused in the sheets above |
| `fill` | `flex: 1` in a flex parent | used once, as a spacer in a row |
| `vw` / `vh` | the same | on paper EVG says the page area; on the web it is the viewport, which is what the browser says too |
| `@media`, `@vars`, `var()`, themes | the same, or resolved by `EVGStyleSheet` before emission | resolving first keeps the palette sheet-level, which is the point of `@vars` |
| overlays (`overlay`, `overlay-side`, …) | **none** | EVG places them; the node gets `position:absolute` at the computed rectangle. CSS anchor positioning is not a target |
| `line-height: normal` = `1.15em` for the sans fallback | the face's own | the same face, so the same answer — but the browser's, not the table's |
| `evg-surface-effect`, `scrollbar-*`, `backdrop-filter` | dropped, native scrollbars, `backdrop-filter` | the ripple is a GPU pass with no DOM equivalent |

Where this stops being a mapping is **text**: the browser wraps a `<span>`
itself, its heights feed its own flex pass, and `calculatedHeight` is then a
number nobody drew. In this mode EVG's layout is not run at all for the
screen; the hit test is DOM events, the a11y tree is the DOM, the inspector is
the browser's, and the PDF is laid out separately by EVG from the same tree
and sheet. The check is the one `PLAN_CSS_LAYOUT_AND_FONTS.md` §6.3 already
names as option B: *"emit real CSS flex and diff against EVG frames in
tests"* — the box-model and grid oracles, extended with the demo pages.

This is a legitimate product shape — a Ranger-controlled DOM application —
and it is the shape that gives up the engine's claim. It should be built
after L1, if at all, and named as a different mode rather than as a faster
painter.

### 3.4 Threads on the web

Today: everything on the main thread, `requestAnimationFrame` calls
`app.tick`, `app.frame()`, and the painter, in that order.

Proposed: the compiled engine in a **Worker**. The main thread owns the DOM
(or the WebGL context via `OffscreenCanvas`), forwards pointer, wheel and
keyboard events to the worker, and receives one message per frame:

* for the WebGL painter, the `EVGSceneBinary` — three `Int32Array`s and a
  string pool, **transferred**, so the cost is the hop and not a copy;
* for the DOM painter, the host-tree diff (D2) in the same fixed-point
  record shape.

Text measurement in the worker: `SimpleTextMeasurer` is a table and needs
nothing; `OffscreenCanvas.getContext("2d").measureText` is available in
workers, so the canvas-backed measurer of §3.2 runs there too. Fonts must be
loaded in the worker's `FontFaceSet` as well as the page's, or the worker
measures the fallback — the same trap `evg-html.js`'s `clearFontMetrics`
exists for.

Latency: hit testing is 0.03 ms, so a press costs one `postMessage` round
trip, which is well under a frame. What this buys is that a 12 ms layout on
a chart-heavy slide no longer blocks input or the compositor, and a scroll
on a kept list is a style write on the main thread with nothing computed
there.

---

## 4. Apple

### 4.1 What exists

`apple/EvgPainter.swift` over a `CGContext`; a `UIView` host for iPhone and
iPad, a SwiftUI `Canvas` host on the watch. `frame()` is cached and repainted;
every command is rasterised every frame. The page draws its own text field
and caret; the view becomes first responder so the keyboard rises. The
dashboard lays out with EVG's estimate and paints with the platform's sans.
`apple/README.md` already names the next step for scroll: a `CGLayer` per
scroll layer, painted once per `buildSeq`, blitted per frame.

### 4.2 L1 on UIKit and on SwiftUI

**UIKit** is the direct translation of §3.2: a `UIView` (or, for cost, a
`CALayer`) per element or per kept subtree, `frame` from EVG, a `UITextField`
where the tree has a field — the web proxy pattern, with `UITextInput` doing
what `beforeinput`/`input` do — and `UIAccessibilityElement`s from
`EVGA11yTree`, which `PLAN_ACCESSIBILITY.md` §13 already sketches for macOS.
Scroll layers are `CALayer.position` writes, off the engine entirely.
`UIScrollView` stays out for the reason `DashboardView.swift` gives: the page
has its own scroll container and a second owner makes two.

**SwiftUI** is the more interesting host and the more constrained one. The
fit is the `Layout` protocol (iOS 16, macOS 13, watchOS 9): a container whose
`placeSubviews` reads `calculatedX/Y` off EVG and whose `sizeThatFits`
returns the root's size. Each element becomes a small `EvgNodeView` switching
on `elementType`: `Text` (one per EVG line, `.fixedSize()` so SwiftUI does
not wrap it again), `TextField`, `Image`, a `Path` for vectors, a `ZStack`
for a container. What SwiftUI then gives:

* identity through `.id(key)` and `ForEach` over keyed children, so a
  `withAnimation` on a rectangle change is a real animation and
  `EVGTransition`'s work can be handed over per property;
* native `TextField` with the system keyboard, selection, dictation and
  autofill — the P3 bridge that `PLAN_INPUTS.md` could not attach anywhere;
* `.accessibilityLabel`, `.accessibilityAddTraits`, `.accessibilityValue`
  from the `a11y*` fields — VoiceOver on the tree, not a mirror;
* `Material` for `backdrop-filter`, `.shadow`, `.clipShape` for radii.

And the two costs that decide which apps qualify:

* **View count.** SwiftUI diffs the whole view tree on a state change and is
  known to fall over in the low thousands of live views. RealTrainer's phone
  frame is 177 commands; the dashboard's tablet frame is 352; a pptx slide
  can be 10 000. The line is roughly *chrome-shaped apps yes, document apps
  no* (§7), and the fallback inside one app is a `Canvas` subview for a
  subtree the host marks as a picture — a chart, a slide.
* **Text.** `Text` measures itself with CoreText; EVG must measure with the
  same thing or the runs will not fit their boxes. A CoreText-backed
  `EVGTextMeasurer` (`CTLineGetTypographicBounds` on a `CTLine` from the same
  `CTFont` the surface picks) is the piece to build first, and it improves
  the **existing** CoreGraphics painter on the same day — today `ui/ios` lays
  out with the estimate and draws with the platform face, which the README
  calls "the honest choice" only because nothing better was wired.

### 4.3 L2 — SwiftUI's own layout

For completeness, what maps and what does not:

| EVG | SwiftUI | |
| --- | --- | --- |
| `flex-direction: row` / `column` | `HStack` / `VStack` | ✓ |
| `gap` | `spacing:` | ✓ |
| `justify-content: space-between` / `-around` / `-evenly` | `Spacer()`s between children | ✓, by construction |
| `justify-content: center` / `flex-end` | leading/trailing `Spacer()` | ✓ |
| `align-items` | `alignment:` on the stack | ✓, no `stretch` on the cross axis without `.frame(maxWidth: .infinity)` |
| `flex-grow` | `.frame(maxWidth: .infinity)` + `layoutPriority` | approximate — SwiftUI divides remaining space equally among flexible children, not by weight |
| `flex-shrink`, `flex-basis` | none | ✗ |
| `flex-wrap: wrap` | none in `HStack`; a custom `Layout` | ✗ natively |
| `min/max-width/height` | `.frame(minWidth:…)` | ✓ |
| `display: grid` | `Grid` (iOS 16) with `gridCellColumns`; `LazyVGrid` with `GridItem(.flexible)` | fixed columns and spans ✓; `fr` weights, `minmax`, named areas, `subgrid` ✗ |
| `position: absolute` | `.offset` / `.position` in a `ZStack` | ✓ |
| overlays | `.overlay` / `.popover` | ✓ for the anchor, placement rules differ |

A SwiftUI `Layout` that fills the gaps is EVG's flex algorithm, in Swift,
which the compiler already emits. So the recommendation for Apple is the
`Layout`-protocol host of §4.2 and not a stack emitter: the same numbers, one
implementation, and print parity kept.

### 4.4 Threads on Apple

The engine is generated Swift with no UIKit in it. Layout, the display list
and the host diff run on a background queue or an actor; CoreText measurement
is thread-safe; what crosses to the main actor is the `EVGDisplayList` (as
today) or the host-tree diff. `CADisplayLink` drives painting only. The
scroll layer as a `CGLayer` from `apple/README.md` is unchanged by any of
this and is the cheaper first step on the CoreGraphics painter.

---

## 5. Android

### 5.1 What exists

`android/EvgPainter.kt` over `android.graphics.Canvas`, a Java2D twin for
checks without a device, a `View` host in `ui/android` and
`realtrainer/android`, an `InputConnection` for the soft keyboard, and the
ripple as an AGSL `RuntimeShader` post-pass. Fonts: the platform's sans in
four styles; layout with the estimate, as on iOS.

### 5.2 L1 on Compose

Of the three platforms this is the cleanest fit, because Compose's layout
protocol is single-pass measure-and-place, which is what EVG produces:

```kotlin
Layout(content = { children of the EVG node as composables }) { measurables, constraints ->
    // EVG has already laid the tree out; the placeable is told its size and put at its rectangle
    layout(w, h) { placeables.forEachIndexed { i, p -> p.place(x[i], y[i]) } }
}
```

* **Identity:** `key(el.key)` inside the children lambda, so a reordered
  keyed list moves composables rather than recreating them; unkeyed children
  get the inspect path.
* **Text:** `BasicText` for each EVG line with `softWrap = false`, and an
  `EVGTextMeasurer` backed by Compose's `TextMeasurer` (`rememberTextMeasurer`
  / `TextMeasurer(...)`, foundation 1.5+), which is usable outside
  composition — one instance owned by the engine thread, since nothing
  documents it as shareable across threads — the D3 measurer for this
  platform.
* **Fields:** `BasicTextField` where the tree has a field; the P3 bridge
  that `PLAN_INPUTS.md` left blocked gets a host that has a field, and the
  `InputConnection` written for RealTrainer becomes the field's own.
* **Semantics:** `Modifier.semantics { role, contentDescription, stateDescription, … }`
  from the `a11y*` fields — TalkBack on the tree itself.
* **Scroll layers:** `Modifier.graphicsLayer { translationY = -scrollTop }`
  on the layer's content composable, a `RenderNode` property write with no
  recomposition; or, where the app is happy to hand scrolling over,
  `verticalScroll` with the offset fed back to `EVGElement.scrollTop`.
* **Ripple:** `Modifier.clickable` with the platform's indication replaces
  the AGSL pass; `backdrop-filter` stays a `RenderEffect`.
* **Paths:** `Canvas {}` with a `Path` from the rings, even-odd fill —
  Compose's `Canvas` is a composable, so a chart subtree is one node.

No view-count ceiling of SwiftUI's kind: Compose skips unchanged composables
by parameter equality, and `LazyColumn` exists for the document case, though
EVG's own culling already answers that (177 commands for a 40× diary).

### 5.3 L2 — Compose's own layout

| EVG | Compose | |
| --- | --- | --- |
| `flex-direction` | `Row` / `Column` | ✓ |
| `gap` | `Arrangement.spacedBy` | ✓ |
| `justify-content` | `Arrangement.SpaceBetween` / `SpaceAround` / `SpaceEvenly` / `Center` / `End` | ✓ |
| `align-items` | `verticalAlignment` / `horizontalAlignment`; `Modifier.fillMaxHeight` for `stretch` | ✓ |
| `flex-grow` | `Modifier.weight(n)` | ✓, weighted — closer than SwiftUI |
| `flex-shrink`, `flex-basis` | none | ✗ |
| `flex-wrap: wrap` | `FlowRow` / `FlowColumn` (foundation-layout 1.4+) | ✓ for `wrap`, `align-content` partial |
| `min/max-*` | `Modifier.sizeIn` | ✓ |
| `display: grid` | none — `LazyVerticalGrid` is a virtualised list, not CSS grid | ✗ (`fr`, `minmax`, areas, `subgrid`) |
| `position: absolute` | `Box` with `Modifier.offset` / `Modifier.absoluteOffset` | ✓ |
| overlays | `Popup` / `DropdownMenu` anchoring | ✓ for the anchor, placement rules differ |

Same conclusion as SwiftUI, with a wider native subset: the gaps (`shrink`,
`basis`, grid) are exactly the places a `Layout` with EVG's numbers would go,
so the L1 host is the recommendation and a `Row`/`Column` emitter is not.
The old `View` system with Google's `FlexboxLayout` is closer to CSS than
Compose is, and is not where Android is going; not recommended.

### 5.4 Threads on Android

The engine is generated Kotlin with no `android.*` in it (the stubs in
`androidstubs/` exist so the host type-checks without an SDK). Layout, list
and diff run on `Dispatchers.Default`; the `TextMeasurer` measures there;
the result is posted to the main thread as a `State` the `Layout` reads.
Choreographer drives painting only. On the existing `View` host the same
split applies with the `EVGDisplayList` as the message, which is a smaller
change than Compose and worth doing first.

---

## 6. The four decisions, shared by all three

**D1 — who owns geometry.** EVG (L1), by default. The platform (L2) only as a
mode with an oracle, and only on the web today.

**D2 — identity across frames, and a diff.** The seam is a list of commands
that "carries no id" on purpose. An L1 host needs, per element, a handle that
survives a rebuild and a statement of what changed. Proposal: a fifth derived
list beside the display list, the hit test, the a11y tree and the inspector —
`EVGHostTree` — that walks the laid-out tree on the same pass and emits
**ops** rather than a picture:

```
CREATE  path  parentPath  index  elementType  (paint, geometry, text lines, a11y)
UPDATE  path  bits: GEOMETRY | PAINT | TEXT | A11Y | SCROLL
MOVE    path  parentPath  index
REMOVE  path
```

* The key is `EVGInspect`'s path — `0/3/k:share` — so a keyed child keeps its
  node across a reorder, and an unkeyed one is what it is today: structural.
  `EVGReconcile` decides what "the same element" means; this reads the answer.
* The `UPDATE` bits come from what the engine already tracks: the style
  cache's `layoutClean()` / `nothingChanged()`, `paintStamp` on the element,
  the layer's `layerShiftX/Y`, and a text-lines stamp from `EVGTextEngine`.
* It is pure Ranger, like the display list, and so it compiles to ES6 for
  the DOM host, Swift for SwiftUI and Kotlin for Compose. Written once.
* It has the same binary form as the scene (`int_buffer` records, a string
  pool), so it crosses a thread the way the scene does.

Nothing below the seam changes: the painters keep reading the display list.
A host chooses one or the other, and a host can mix — a SwiftUI page with a
`Canvas` subtree for the chart reads both.

**D3 — text: the platform measures, EVG breaks.** An `EVGTextMeasurer` per
platform, backed by what the host draws with: `measureText` on a canvas,
CoreText, Compose's `TextMeasurer`. EVG keeps breaking the lines and emitting
one run per line, so a screen and a PDF that share a face still break in the
same place — the invariant `PLAN_CSS_LAYOUT_AND_FONTS.md` §4 is built on. A
host that wants the platform to wrap (Dynamic Type, hyphenation) is asking
for L2 on that subtree, and says so.

**D4 — the engine off the UI thread.** Worker + transferables on the web, a
background queue on Apple, `Dispatchers.Default` on Android. The message is
the display list (binary) or the host-tree diff (binary). Input goes the
other way; the hit test is 0.03 ms, so the hop is the latency. Two things
have to move to the engine thread with the engine: the text measurer (all
three are usable there) and the clock (`app.tick(dt)`), which the hosts
already hand in rather than read.

---

## 7. Which apps

The examples in the question — `npm run ui:demo:web`, `npm run rt:web`, and
their `ui:ios` / `ui:android` / `rt:ios` / `rt:android` ports — are all
chrome-shaped: a few hundred elements, a stylesheet with `@media`, controls
with state, one or two scroll containers. That is the L1 shape.

| App | Frame | Shape | L1 host | L2 |
| --- | --- | --- | --- | --- |
| `gallery/realtrainer` (`rt:*`) | 177 cmds, phone | responsive page, fields, dialogs, scroll | **yes** — the reference case on all three platforms; it already has the input bridge on each | web mode, maybe |
| `gallery/ui/demo` (`ui:demo:*`) | 352 cmds, tablet | dashboard, menus, tables, a chart | **yes**; the chart subtree stays a picture | web mode, maybe |
| `gallery/pptx`, `odp` | up to 10 000 cmds | a document, one slide at a time, a deck laid out against its own faces | no — painter; the SVG one for print | no |
| `gallery/datagrid`, `rangerdb viewer` | virtualised, immediate-mode | no element tree (`PLAN_ACCESSIBILITY.md` §4) | no — painter | no |
| `gallery/book`, `docx_viewer`, `pdf_writer` | pages | print-first | no — painter, PDF | no |

The split is the one `PLAN_ACCESSIBILITY.md` §4 already draws between
declarative and immediate-mode EVG: a host tree needs a tree.

---

## 8. Stages, each with its gate

Ordered so that every stage improves something that ships today, and the
expensive decision (D2) is made after the cheap ones have paid.

| | What | Where | Gate |
| --- | --- | --- | --- |
| **S0** ✅ | Platform text measurers behind one Ranger class, `EVGHostTextMeasurer`, that takes ONE host function and keeps the face cache, the weight convention and the cache key; `EVGDefaultMeasurer` makes it every layout's default. Hosts: canvas `measureText` (`gl/evg-measure.js`), CoreText (`apple/Sources/CoreTextMeasurer.swift`), Skia `Paint` and Java2D (`android/src/…/AndroidTextMeasurer.kt`, `AwtTextMeasurer.kt`) | `EVGContextMeasurer.rgr` was the pattern | `evg:hostmeasurer:test` (42 checks); the responsive smoke and the RealTrainer checks in Chromium; the native hosts type-check only where a Mac or `kotlinc` is |
| **S1** ✅ | Engine off the UI thread with the **existing** painters. Web: `gl/evg-engine.js` (Worker; frames as transferred `EVGSceneBinary`, now 36 fields with corners, layer and shadow; `gl/evg-binary.js` reads them; input batched into the frame request; hooks for the hit test beside the tree) and `realtrainer/web/main-worker.js` on it. Apple: `apple/Sources/EvgEngineQueue.swift`. Android/JVM: `android/src/main/…/EvgEngineThread.kt`. Both RealTrainer native views rewritten on the queues: `draw` paints the last delivered frame and reads the app for nothing | the engine untouched but for the wider record | `evg:binary:check` (27); `rt:frame` runs both browser hosts through one check and prints pointer-down-to-frame — 1.2 ms on the main thread, 11.2 ms through the Worker, in a headless Chromium without a GPU; the native views type-check only where a Mac or `kotlinc` is |
| **S2** | `EVGHostTree` — the diff channel, in Ranger, with its binary form | beside `EVGDisplayList.rgr` | a test that holds it against the display list: every `CREATE`/`UPDATE` rectangle is a rectangle the list drew; a rebuild that changes nothing emits nothing |
| **S3** | `html/evg-dom.js` — the retained DOM painter, fields as `<input>`, a11y on the nodes | web | `parity.mjs` against `evg-html.js` (beat 0.022 %); `ui:demo:page`; the a11y gates with the mirror off |
| **S4** | The Compose host for `realtrainer/android`: `Layout` + `EVGHostTree`, `BasicTextField`, semantics | Android | `rt:android:verify` with a recording host that counts composables the way `RecordingSurface` counts draws |
| **S5** | The SwiftUI host for `realtrainer/ios` through the `Layout` protocol | Apple | `rt:ios:verify`; a view-count ceiling asserted per scene |
| **S6** (optional) | L2 web mode: the cascade resolved by EVG, layout by the browser | web | the Chromium box-model and grid oracles, extended with the demo pages; the mode is named in the URL, never the default |

S0 and S1 are independent of each other and of everything after; both are
worth doing whether or not the rest happens. S2 is where the design in D2 is
committed and is the stage to review before writing it.

---

## 9. The walls, named

* **Text metrics are the whole game.** Every place a native host and EVG
  disagree about a pixel is a place they measured a run differently. S0 is
  first for that reason, and any host that wraps text itself is L2.
* **SwiftUI's view count.** A few thousand live views is where it slows; a
  document is out, and even a chrome app needs the `Canvas`-subtree escape
  hatch for a chart with 5 000 segments.
* **Unkeyed lists.** A structural path is only stable for keyed children.
  The demos already key what they reorder; a list that does not will churn
  nodes on every rebuild, which is what the painter does today, so it is
  not a regression — but it is not the win either.
* **Mixing SVG into DOM.** A `<path>` inside a `<div>` tree is fine; a clip
  stack that crosses between them is not. Paths are leaves, and a path
  never clips, so the mix stays at the leaves.
* **Two scroll owners.** A native `ScrollView` / `UIScrollView` /
  `verticalScroll` and EVG's own container cannot both own an offset. L1
  keeps EVG's and writes it to a compositor transform; handing scrolling to
  the platform is an app-level choice, per container.
* **The ripple and the backdrop blur** are GPU passes over finished pixels.
  Compose has `RenderEffect`, the web has `backdrop-filter`, SwiftUI has
  `Material`; the ripple itself becomes the platform's own indication, and
  is not the same picture. `parity.mjs` will say so, and it should be
  allowed to.
* **Print parity narrows to "same lines, native glyphs".** That is the
  contract L1 keeps and the one L2 does not, and it is worth writing into
  `README.md`'s first paragraph the day an L1 host lands.
