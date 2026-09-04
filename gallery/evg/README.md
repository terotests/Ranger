# EVG — the layout engine

EVG lays a document out and hands the result to whatever draws it. It is a
CSS-shaped box model written in Ranger, with no browser under it and no browser
anywhere near it: flex, grid, the length units, a stylesheet with `@media` and
pseudo-classes, real font metrics with kerning, text wrapping, transitions, hit
testing and an accessibility tree — and then one flat list of draw commands that
a PDF writer, a rasteriser, an `<svg>`, a WebGL context, CoreGraphics, Android's
`Canvas` or an SDL window can each paint without knowing any of the above.

```
   tree  ──►  stylesheet  ──►  layout  ──►  display list  ──►  a painter
 (names)      (@media, vw,     (boxes,       (absolute px,      (PDF, PNG,
              themes, states)   text runs)    resolved colours)  SVG, GL, …)
```

The claim the repository makes about it everywhere: **the same tree, styled by
the same sheet, comes out the same on every target.** The showcase renders each
page to PDF, PNG and HTML from one source; the WebGL and SVG backends are
differenced pixel for pixel; and the display list is where all of them meet.

This file is the reference for the engine itself. The other documents here are:

| | |
| --- | --- |
| [`SPEC.md`](SPEC.md) | The document format, attribute by attribute, for someone implementing a reader or a painter |
| [`PLAN_CSS_LAYOUT_AND_FONTS.md`](PLAN_CSS_LAYOUT_AND_FONTS.md) | Why the CSS subset is the shape it is, and what is deliberately missing |
| [`PLAN_VECTOR_IR.md`](PLAN_VECTOR_IR.md) | The vector layer: paths, strokes, `viewBox`, SVG import |
| [`PLAN_ACCESSIBILITY.md`](PLAN_ACCESSIBILITY.md) | The second list a frame publishes — what it *means* |
| [`ISSUES.md`](ISSUES.md) | Known defects, with the measurements that found them |
| [`showcase/README.md`](showcase/README.md) | The gallery, and how it is built |
| [`gl/README.md`](gl/README.md) | The display-list seam and the GPU backend |

---

## Contents

1. [Quick start](#quick-start)
2. [The pipeline](#the-pipeline)
3. [Elements](#elements)
4. [Property reference](#property-reference)
5. [Units](#units)
6. [The CSS subset](#the-css-subset)
7. [Responsive layout](#responsive-layout)
8. [Layout](#layout)
9. [Text and fonts](#text-and-fonts)
10. [The display list](#the-display-list)
11. [Targets](#targets)
12. [Interaction](#interaction)
13. [Accessibility](#accessibility)
14. [Retained trees](#retained-trees)
15. [The files](#the-files)
16. [Running things](#running-things)

---

## Quick start

Four objects and five calls. Everything else in this file is detail on one of
them.

```ranger
Import "EVGElement.rgr"
Import "EVGStyleSheet.rgr"
Import "EVGLayout.rgr"
Import "EVGDisplayList.rgr"

; 1. a tree of names
def page (EVGElement.createDiv())
page.className = "page"
def title (EVGElement.createSpan())
title.className = "title"
title.textContent = "Hello"
page.addChild(title)

; 2. a stylesheet, and the surface it is being resolved against
def sheet (new EVGStyleSheet())
sheet.parse(".page { padding: 24px } .title { font-size: 28px; color: #10162b }")
sheet.setViewport(1200.0 800.0 false)
sheet.applyTree(page "")

; 3. boxes
def lay (new EVGLayout())
lay.setPageSize(1200.0 800.0)
lay.layout(page)

; 4. draw commands
def dl (new EVGDisplayList())
dl.setTextEngine((lay.getTextEngine()))
dl.build(page)

; 5. whatever paints them
print (dl.toJson())
```

Documents are usually written as JSX rather than built by hand —
`gallery/pdf_writer/src/jsx/JSXToEVG.rgr` reads a `.tsx` file into exactly this
tree — or with a `treefactory`, which is Ranger's tree literal. Both produce
`EVGElement`s and nothing downstream can tell which was used.

---

## The pipeline

Each stage has one job and hands on a strictly simpler thing than it received.

**1. The tree.** `EVGElement`s: a class name, a type, children, and any inline
attributes the author insisted on. In a well-written document this stage carries
no colours, sizes or spacing at all — the showcase's rule, and the reason one
tree can be a print page and a phone screen.

**2. The cascade.** `EVGStyleSheet.applyTree` resolves each element's classes,
theme, interaction state and the stated viewport into properties, and writes
them onto the element through the same `setAttribute` the authoring layer uses.
Inline attributes win; the sheet skips any property the author already set.

**3. Layout.** `EVGLayout.layout` resolves units, measures text, and computes
`calculatedX`, `calculatedY`, `calculatedWidth`, `calculatedHeight` for every
element. This is the flex/grid/flow engine and the largest file here.

**4. The display list.** `EVGDisplayList.build` walks the laid-out tree once and
emits flat commands — filled rect, border, image quad, text run, path, stroke,
push/pop clip. Absolute pixels, colours as 0–255 plus alpha, no tree and no
units left.

**5. A painter.** Which is small, because everything hard already happened.

The seam is between 4 and 5, and it is load-bearing: five painters used to walk
the tree themselves and each decided again what a box meant, which is how
`border-radius` came to work in PDF and silently not in PNG.

---

## Elements

`EVGElement` is the only node type. Its `elementType` says what it is:

| `elementType` | Kind | What it draws |
| --- | --- | --- |
| `0` | container | a box: background, border, radius, shadow, clip |
| `1` | text | a box plus its `textContent`, wrapped and measured |
| `2` | image | a box plus a decoded bitmap, fitted by `object-fit` |
| `3` | path | a box plus vector geometry from `d` / `svgPath` / `svgSource` |

Constructors: `EVGElement.createDiv()`, `createSpan()`, `createImg()` and
`createPath()`. A `treefactory` tag sets `elementType` in its props, as in
[`web/responsive/EvgResponsiveDemo.rgr`](web/responsive/EvgResponsiveDemo.rgr);
JSX sets it from the tag name.

Two names, deliberately different:

* **`id`** is global and outward-facing. The hit test reports it, the
  accessibility tree carries it, a host addresses a control by it.
* **`key`** is sibling-scoped and inward-facing. It is what
  [`EVGReconcile`](EVGReconcile.rgr) matches on so a rebuilt tree keeps the same
  element objects — and therefore keeps scroll positions and running
  transitions.

---

## Property reference

Every property is set through `EVGElement.setAttribute(name value)`, and every
name below is accepted in **both** spellings — `font-size` and `fontSize`. That
is not sugar: it is what stops the stylesheet and the inline attributes from
drifting apart, because the sheet hands its declarations to the same function.

### Box

| Property | Notes |
| --- | --- |
| `width` `height` | any unit; unset = auto |
| `min-width` `max-width` `min-height` `max-height` | clamps, applied after the size is computed |
| `padding` | 1–4 values, CSS order (`all`, `v h`, `t h b`, `t r b l`) |
| `padding-top` `padding-right` `padding-bottom` `padding-left` | |
| `margin` and the four sides | same shorthand |
| `border` | `<width> solid <color>` |
| `border-width` `border-color` | |
| `border-radius` | one value, or four; percentages resolve against the box |
| `box-shadow` | `<dx> <dy> <blur> <color>` |
| `shadow-offset-x` `shadow-offset-y` `shadow-radius` `shadow-color` | the long form |
| `opacity` | `0`–`1`, multiplied through the subtree |
| `overflow` | `visible` is the default; every other value clips the subtree and makes the box scrollable |
| `scroll-top` `scroll-left` | where a scrollable box is scrolled to |

### Layout

| Property | Values |
| --- | --- |
| `display` | `flex`, `grid` — anything else is block flow |
| `flex-direction` | `row` (the default), `column`, `column-reverse` |
| `flex-wrap` | `nowrap`, `wrap`, `wrap-reverse` |
| `justify-content` | `flex-start`, `center`, `flex-end`, `space-between`, `space-around`, `space-evenly` |
| `align-items` `align-content` | `flex-start`, `center`, `flex-end`, `stretch`, `baseline` |
| `flex` | the shorthand; `flex-basis` and `flex-shrink` separately |
| `gap` `row-gap` `column-gap` | |
| `grid-template-columns` `grid-template-rows` | `120px 1fr 40%`, `repeat(3, 1fr)`, `minmax(40px, 1fr)`, `subgrid` |
| `grid-template-areas` | a picture of names; a repeated name is one rectangle |
| `grid-column` `grid-row` `grid-area` | placement and spans |
| `grid-auto-flow` | `row`, `column` |
| `direction` | `ltr`, `rtl` — set once on the root and the whole tree turns around |
| `top` `right` `bottom` `left` | absolute positioning, against the nearest box |
| `vertical-align` | `baseline` participation for inline-ish content |

### Paint

| Property | Notes |
| --- | --- |
| `background-color` `color` | `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, named colours, `transparent` |
| `background-gradient` | `linear-gradient(…)` / `radial-gradient(…)` |
| `gradient-from` `gradient-to` `gradient-dir` | the long form |
| `background-image` | a source the host can decode |
| `backdrop-filter` | `blur(Npx)` — softens what is already behind the box |
| `scrollbar-width` `scrollbar-color` | `auto`/`thin`/`none`; the thumb's colour then the track's, `auto` for ink on whatever the bar is over. The list draws the bar when an app asks it to (`EVGDisplayList.setScrollbars`); it is up while the container scrolls, lit under the pointer |
| `evg-scrollbar-label` | `percent` (default) or `none` — the "34 %" beside the thumb while the page moves |
| `fill` `stroke` `stroke-width` `stroke-dasharray` `stroke-dashoffset` `fill-rule` | vector paint |
| `clip-path` | |
| `transform` `transform-origin` `rotate` `scale` `translate-x` `translate-y` | |
| `object-fit` | `cover`, `contain`, `fill`, `none` |
| `image-offset-x` `image-offset-y` `image-quality` `maxImageSize` | how a bitmap is placed and resampled |
| `cursor` | inherited, so "what is the cursor here" is one lookup |
| `full-bleed` | the box ignores the page margins |

### Type

| Property | Notes |
| --- | --- |
| `font-family` | inherited |
| `font-size` | inherited through `em`; `rem` stays with the root |
| `font-weight` | |
| `line-height` | a number (multiplier) or a length; `normal` is the face's own line box, which is **not** 1.2 |
| `text-align` | `left`, `center`, `right` |
| `line-break` | how lines may be broken |
| `emoji-color` | the colour fallback glyphs are painted in; defaults to `color` |

### Overlays

An overlay is a box positioned against another box rather than in the flow —
a dropdown, a tooltip, a menu panel.

| Property | Notes |
| --- | --- |
| `overlay` | the id of the element this one is anchored to |
| `overlay-side` | `top`, `right`, `bottom`, `left` |
| `overlay-align` | `start`, `center`, `end` |
| `overlay-gap` | distance from the anchor |
| `overlay-anchor-role` | what the anchor is, for the accessibility tree |
| `isOverlay` | marks the element as one |

Overlays are placed after everything they anchor to has a rectangle, which is
why a menu can be declared anywhere in the tree.

### Interaction and meaning

`transition` (see [Interaction](#interaction)), the ARIA surface (see
[Accessibility](#accessibility)), and `evg-surface-effect` with its
`evg-ripple-*` parameters, which are a GPU post-pass and are dropped by the
painters that have no render target.

### Identity

`id`, `key`, `className`, `theme`, `role`, `pageWidth`, `pageHeight`.

---

## Units

A length is an `EVGUnit`: a number, a unit type, and the pixels it resolved to.

| Suffix | Resolves against |
| --- | --- |
| `px` | itself — the CSS reference pixel, which is what everything below is defined in terms of |
| `%` | the parent's **width** on a width property, the parent's **height** on a height property |
| `hp` | the parent's height, on any property |
| `em` | the element's own font size |
| `rem` | the **root** font size |
| `vw` `vh` | the layout's page size — see below |
| `fill` | whatever space is left |
| `pt` `pc` `in` `mm` `cm` | `96/72`, `16`, `96`, `96/25.4`, `96/2.54` px — exactly as CSS defines them |

`vw` and `vh` are the viewport, which is a different thing from the parent, and
that difference is invisible on a root element and load-bearing everywhere else.
`EVGLayout.setPageSize` is what they mean, and every host already calls it. On
paper that is the **page area** — the sheet less its margins — because that is
what CSS says viewport-percentage lengths mean in paged media, and what
`EVGPDFRenderer` sets. So `100vh` is the text column on A4 and the window in a
browser, with no print-specific code anywhere. [`EVGViewportUnitTest.rgr`](EVGViewportUnitTest.rgr)
exists to keep it that way.

An **unrecognised suffix leaves the unit unset** — i.e. auto — rather than
falling through to the bare-number path, because `to_double("10ch")` is `10`
and the length would silently become `10px`.

Not implemented: `calc()`, `ch`, `ex`, and the container-relative units.

---

## The CSS subset

[`EVGStyleSheet.rgr`](EVGStyleSheet.rgr) is deliberately not a browser cascade.
It supports what a document needs in order to change its look without editing
its tree:

```css
.caption                    { … }   /* class rule, every theme */
.theme-classic .caption     { … }   /* only under theme "classic" */
.a, .b                      { … }   /* selector lists */
.btn:hover                  { … }   /* interaction state */
/* comments */

@media (max-width: 640px)                            { … }
@media (min-width: 900px) and (orientation: landscape) { … }
@media (pointer: coarse)                             { … }

@vars           { --ink: #09090b; }   /* the palette, every theme */
@vars classic   { --ink: #1b1a17; }   /* …and what "classic" makes of it */
.caption { color: var(--ink); }
```

**Resolution order**, with source order breaking ties inside each group:

```
unscoped class rules  <  theme-scoped class rules  <  inline attributes
```

Inline always wins: the applier skips any property the authoring layer already
set, which `EVGElement` records in `inlineProps`.

There are no IDs, no element selectors, no `!important`, no descendant
combinators beyond the theme scope, and no specificity arithmetic beyond
"theme-scoped beats unscoped".

### Pseudo-classes

`:hover`, `:focus`, `:active` and `:disabled`, read off the element's own
`isHovered` / `isFocused` / `isPressed` / `a11yDisabled` flags. A controller
never writes a second class name for a state the sheet can ask about.

### `@media`

A media block is a **condition on the rules inside it, not a new kind of
selector**: the rules keep the specificity they would have had outside, and a
block that does not match contributes nothing.

| Feature | Values |
| --- | --- |
| `min-width` `max-width` | CSS pixels |
| `min-height` `max-height` | CSS pixels |
| `orientation` | `portrait`, `landscape` |
| `pointer` | `coarse` (a finger), `fine` (a mouse) |

Combine with `and`; nested blocks mean both conditions hold, with the tighter
bound winning. A condition nobody could parse is *kept* rather than dropped, so
the rules inside it never apply — a misspelt query that styles everything is
worse than one that styles nothing, because it is invisible until it is not.

Conditions are evaluated against a viewport **the caller states**, because a
Ranger program has no window to ask:

```ranger
sheet.setViewport(w h coarse)     ; before applyTree
sheet.applyTreeIn(root theme w h coarse)   ; or both in one call
```

**With no viewport stated, a conditional rule does not apply at all.** A media
query that cannot be evaluated has no truth value, and guessing "yes" would
style a print page for a phone.

### Custom properties

```css
@vars          { --ink: #09090b; --line: #e4e4e7; --brand: #14b8a6; }
@vars marine   { --ink: #0a3344; --line: #b6d4e0; }
@media (max-width: 640px) { @vars { --gap: 8px; } }

.card  { border: 1px solid var(--line); color: var(--ink); }
.badge { background-color: var(--brand, #333); }   /* with a fallback */
```

**The palette is sheet-level, and `@vars` says so.** In a browser `--x` is an
inherited property of an *element*, and `:root { --x }` is only the commonest
place to put it. This engine has no root element and no inheritance, so a
palette written on a class would look element-scoped and not be — `--x` inside
a class rule is therefore **an error**, not a thing that half works.

A declaration inside `@media` carries that condition, exactly as a rule does.
Precedence is the sheet's own, applied to the palette: theme-scoped beats
unscoped, later beats earlier among equals, and a block whose media condition
does not hold is not a candidate. A variable may be written in terms of
another, so a theme can move one name and everything defined from it follows.

`var(--x)` with **no definition and no fallback drops the declaration** and
reports it: half a shorthand is worse than the value that was already there,
and the error list says where. So does an unclosed `var(` and a definition
cycle.

**What it costs: nothing measurable.** `var()` is resolved where a rule's value
becomes an element's — when a *plan* is built, once per (class, theme, state)
— and never per element. Measured on the bench table with every colour in the
sheet turned into a variable, both the full pass and the skip pass are
unchanged within run-to-run noise: 22,403 elements are styled from **18**
plans, so the palette is read eighteen times over and not once per element per
frame. Substitution is textual and happens before the value reaches
`setAttribute`, which is what lets it work inside a shorthand
(`border: 1px solid var(--line)`) with no property having to know variables
exist.

[`EVGStyleVarTest.rgr`](EVGStyleVarTest.rgr) (`npm run evg:stylevar:test`)
covers the meaning and the cost; the cache suite's fixture uses variables too,
so the two places a value is resolved — the plan builder and the direct scan it
is checked against — cannot drift apart.

### Transitions

```css
.btn { transition: background-color 150ms ease 50ms }
```

`transition` is a property like any other; [`EVGTransition`](EVGTransition.rgr)
is the clock. See [Interaction](#interaction).

### The style cache

`applyTree` is not cheap and it runs on every frame, so the resolution is cached
on a key of class list, theme, interaction bits *and* the viewport — the last
one because `@media` makes the surface part of the answer. The pass also reports
whether anything it wrote can have moved a box (`layoutClean()`) or changed a
pixel at all (`nothingChanged()`), which lets a host skip layout on a hover.

---

## Responsive layout

Everything needed for a layout that answers the size it is given, and a live
page that does it:

* **`@media`** on width, height, orientation and pointer, above.
* **`vw` / `vh`**, which are the page rather than the parent.
* **Percentages**, which are the parent.
* **`flex-wrap` with `min-width`**, which needs no rule at all — the line simply
  runs out and the next item goes below.
* **`grid-template-columns`** restated per breakpoint, which is how a card deck
  goes from four across to one.
* **`min-width` / `max-width` clamps**, for the bounds a layout should never
  cross whatever the window does.

Not implemented: `auto-fit` / `auto-fill` inside `repeat()` (the count must be a
number), container queries, and `calc()`.

### The live demo

[`web/responsive/`](web/responsive/) is a page as wide as the browser window
that is laid out **again on every resize** — the compiled engine runs in the
browser, and the browser is handed finished pixels.

```sh
npm run evg:responsive:web:serve    # build + serve on http://localhost:8007/
npm run evg:responsive:check        # the same layout, four widths, no browser
npm run evg:responsive:web:smoke    # the built page, driven in Chromium
```

Its tree carries no numbers at all; the three `@media` blocks in its stylesheet
are the entire difference between the wide layout and the phone one. Drag the
window edge and the whole pipeline — build, cascade, layout, display list,
paint — runs again, in about a millisecond of layout per frame at 1400px.

The checks assert what the breakpoints are *for* rather than what they say: the
card columns are counted by grouping the laid-out cards by their `y`, and the
sidebar's move is read off where its box ended up.

---

## Layout

[`EVGLayout.rgr`](EVGLayout.rgr) resolves units, measures text, and gives every
element a rectangle.

**The box model** is CSS's, with `padding` and `border` inside the declared
width. `EVGBox` holds the resolved pixels (`paddingLeftPx`, `borderWidthPx`, …)
after `resolveUnits` has run, and `resolveUnits` deliberately refuses to run
twice on the same element so a percentage is never resolved against an
already-resolved parent. Anything laid out more than once therefore has to start
from `resetLayoutState()`, which `layout()` calls.

**Flow** is a column of boxes. **Flex** is `display: flex` with direction, wrap,
justify, align and gaps; a text leaf shrink-wraps to its measured content rather
than claiming the parent's width. **Grid** is `display: grid` with fixed,
percentage and `fr` tracks, `repeat()`, `minmax()`, named areas, spans and row
`subgrid`.

Three things worth knowing, all documented at their source:

* `align-items` defaults to **`flex-start`**, not `stretch`. An auto cross size
  is therefore fit-content, so a column whose children should fill it says
  `width: 100%` or `align-items: stretch`.
* There is no `position: fixed`. An absolutely positioned box belongs to the
  content of the box it is positioned against, so scrolling a container moves
  everything inside it — absolutes and overlays alike, which is what makes a
  dropdown stay with its trigger.
* `flex-wrap` **initialises to `wrap`**, where CSS's initial value is `nowrap`.
  A row that must stay on one line says `flex-wrap: nowrap`, which also enables
  the row-axis shrink pass. The wrap test itself allows a hundredth of a pixel
  of overflow, because a `flex: 1` child's width was computed out of the very
  line it is then measured against and the parts do not always add back up to
  the whole — see ISSUES #8, and `EVGFlexWrapTest.rgr`, which sweeps a sidebar
  and a flexible panel across 5600 widths to keep it that way.

**The root** with no stated size becomes the page: `EVGLayout` gives it
`pageWidth` × `pageHeight`. That is right for paper and not for a window, where
the content is free to be taller and scroll — a host that wants the document's
own height measures the children's lowest edge, as
[`EvgResponsiveDemo.measuredHeight`](web/responsive/EvgResponsiveDemo.rgr) does.

**Layout warnings** are collected rather than printed: `warningCount()` /
`warningAt(i)`. The showcase build fails on them.

---

## Text and fonts

Text is measured with an `EVGTextMeasurer`, and which one you give the layout
decides how honest the answer is:

| Measurer | Metrics from | For |
| --- | --- | --- |
| `EVGTextMeasurer` (base) | `fontSize * 0.55` per character | nothing; it is the floor |
| `SimpleTextMeasurer` | a measured advance table, one entry per printable character, taken from a browser's sans fallback | headless work, and the browser demos |
| `TTFTextMeasurer` | the TTF the output will embed, kerned from the face's own GPOS pairs | print |
| `EVGContextMeasurer` | the host renderer's own loaded faces | an interactive app that paints through `UIContext` |

`isFontAccurate()` is how the engine knows the difference: a measurer that never
opens a font must not silently drive print layout, and `EVGTextEngine` asks
before letting a document that names custom faces through.

The vertical metrics are measured, not rounded: the sans fallback's ascent is
`0.905em` and its descent `0.212em`, summing to `1.117em` — no real face sums to
`1.00`, and an ascent a tenth of an em short draws every run of text that much
high. `line-height: normal` is `1.15em` for that face, not `1.2`.

[`EVGTextEngine`](EVGTextEngine.rgr) breaks paragraphs into lines, and the
display list is given the *same* engine so it breaks them in exactly the same
places. [`EVGGrapheme`](EVGGrapheme.rgr) and [`EVGCodepoint`](EVGCodepoint.rgr)
are what make "one character" mean what a reader means — 🇫🇮 is two codepoints,
👨‍👩‍👧 is five, and each is one glyph, one advance, one caret stop.

---

## The display list

`EVGDisplayList.build(root)` flattens the laid-out tree into `EVGDrawCmd`s:

| Kind | | Carries |
| --- | --- | --- |
| `0` | `RECT` | x, y, w, h, colour, radii, gradient, shadow |
| `1` | `BORDER` | the same, plus thickness |
| `2` | `IMAGE` | source, quad, flips, rotation, the crop for `object-fit: cover` |
| `3` | `TEXT` | the run, x, y, size, colour, family, weight, italic, the line box |
| `4` `5` | `PUSH_CLIP` / `POP_CLIP` | a rectangle, and a stack |
| `6` | `PATH` | rings, fill rule |
| `7` | `STROKE` | a polyline and a thickness |

Three ways out:

* **`toJson()`** — what a browser gets. Gradients and shadows do not survive it,
  so a JSON-fed backend cannot draw them.
* **`toBinary()`** — an `EVGSceneBinary` with an interned string pool, for a
  native host. Its record width is published in the format rather than agreed in
  advance; see ISSUES #4 for why that sentence is there.
* **the objects** — which is what a Kotlin or Swift host does, and why those
  painters can draw gradients, shadows and multi-ring paths that a JSON one
  cannot.

`offsetBy` and `appendFrom` compose lists, which is how a multi-page document is
assembled out of per-page layouts.

---

## Targets

Everything above the display list is one body of code. Everything below it is a
painter that knows about quads, glyph runs and scissor rectangles.

| Target | Where | Notes |
| --- | --- | --- |
| **PDF** | `gallery/pdf_writer/src/core/EVGPDFRenderer.rgr` | the print target: real vector operators, embedded subset fonts, UTF-8 and WinAnsi |
| **PNG / raster** | `gallery/pdf_writer/src/raster/EVGRasterRenderer.rgr` | anti-aliased scanline fill, the same one that paints the glyphs |
| **HTML** | `gallery/pdf_writer/src/core/EVGHTMLRenderer.rgr` | the debug view: absolutely positioned boxes and an inline `<svg>` |
| **SVG / DOM** | [`html/evg-html.js`](html/evg-html.js) | 500 lines, in the browser, from the display list |
| **WebGL 2** | [`gl/evg-webgl.js`](gl/evg-webgl.js) | one instanced quad per command; rounded corners from a distance field |
| **SDL2 + OpenGL** | `gallery/evg/gl/evg_gl_host.rgr` | the same list through the C++ target |
| **Android / AWT** | [`android/`](android/) | `EvgPainter.kt` walks the list once; `EvgSurface` is Canvas or Graphics2D |
| **Apple** | [`apple/`](apple/) | `EvgPainter.swift`, a transliteration of the Kotlin one, over CoreGraphics |

The SVG backend is the evidence that the seam is a seam: it shares no code with
the GL one, and the two are differenced pixel for pixel over the same frames —
0.022% on a sheet built to exercise every command kind, 0.000% on every slide of
the `.pptx` deck.

The same document is also a `.pptx` slide, a `.docx` page and a printed book
elsewhere in `gallery/`. That is the point of the format.

---

## Interaction

**Hit testing.** [`EVGHitTest`](EVGHitTest.rgr) answers in **paint order,
backwards** — the same order the display list draws. A tree walk is nearly the
same answer and differs exactly where it matters: an open menu's panel is drawn
above the trigger beside it, and a tree walk would take the click through the
panel. It is also what makes a modal modal — the backdrop covers the page, so a
click outside the dialog lands on it.

**Transitions.** [`EVGTransition`](EVGTransition.rgr) holds a flight per
property: where it left from, where it is going, a clock, and an easing. The
host advances it (`advanceTree(root dtMs)`), then `reconcileTree(root)` leaves
on each element the value that is actually *showing* — which, for a property in
flight, is neither end. Reversals are handled the way CSS specifies: a hover
that leaves half way comes back in half the time, and one that lands on a third
colour gets the full duration.

**Easing.** [`EVGEasing`](EVGEasing.rgr): the named curves and `cubic-bezier()`.

**Components.** [`EVGComponent`](EVGComponent.rgr) is an instance that outlives
the tree it produces, so a control can keep state across a rebuild.
[`EVGWindow`](EVGWindow.rgr), [`EVGToolbar`](EVGToolbar.rgr),
[`EVGRuler`](EVGRuler.rgr) and [`EVGSelectChrome`](EVGSelectChrome.rgr) are
backend-agnostic pieces built on top of it, shared by the document apps in
`gallery/`.

---

## Accessibility

A canvas contributes one empty graphic to a browser's accessibility tree no
matter what was drawn into it, so an EVG frame publishes a **second list**
beside the display list: what it *means*.

[`EVGA11yTree`](EVGA11yTree.rgr) is that list;
[`EVGA11yFromTree`](EVGA11yFromTree.rgr) derives it from the element tree; and
[`gl/evg-a11y.js`](gl/evg-a11y.js) mirrors it into real DOM nodes over the
canvas, so a screen reader has something to read and a keyboard has something to
focus.

The properties are the ARIA ones, in both spellings: `aria-label` / `a11yLabel`,
`role` / `a11yRole`, and `a11yChecked`, `a11yCurrent`, `a11yDescription`,
`a11yDisabled`, `a11yExpanded`, `a11yFocusable`, `a11yHasPopup`, `a11yHidden`,
`a11yInvalid`, `a11yOrientation`, `a11yPressed`, `a11yReadOnly`, `a11yRequired`,
`a11yRoleDescription`, `a11yRowCount`, `a11yRowIndex`, `a11ySelected`,
`a11ySorted`, `a11yValue`.

Tri-state where ARIA is tri-state: `a11yExpanded` is not-applicable, no, yes or
mixed, because an absent `aria-sort` and a present `aria-sort="none"` are
different things and the DOM makes the distinction.

---

## Retained trees

A document is laid out once. An application is laid out sixty times a second,
and the difference is what these are for.

* [`EVGReconcile`](EVGReconcile.rgr) matches a rebuilt tree's children against
  the previous one **by `key`**, so the same element objects survive — and with
  them the scroll positions, the focus and the running transitions.
* [`EVGComponent`](EVGComponent.rgr) does the same for the thing that *built*
  the tree.
* The style cache and the `layoutClean()` / `nothingChanged()` signals let a
  frame that changed nothing skip layout, and one that changed only a colour
  skip it too.
* `EVGElement.resetLayoutState()` is what makes a second pass over the same tree
  correct rather than a source of stale percentages.

`EVGInvalidateTest`, `EVGStyleCacheTest`, `EVGReconcileTest` and
`EVGTimingTest` are the tests that keep all four honest.

---

## The files

**The engine**

| File | |
| --- | --- |
| `EVGElement.rgr` | the node: properties, `setAttribute`, inheritance, inline tracking |
| `EVGLayout.rgr` | flow, flex, absolute positioning, overlays, scrolling, RTL |
| `EVGGrid.rgr` | grid tracks, `repeat()`, `minmax()`, named areas, subgrid |
| `EVGBox.rgr` | the resolved box model |
| `EVGUnit.rgr` | lengths and how they resolve |
| `EVGStyleSheet.rgr` | the CSS subset, the cascade, `@media`, the style cache |
| `EVGColor.rgr` | colour parsing, blending, interpolation |
| `EVGGradient.rgr` | linear and radial gradient strings |
| `EVGEasing.rgr` | timing functions |
| `EVGTransition.rgr` | properties arriving at their values over time |
| `EVGDisplayList.rgr` | the flat command list, JSON and binary |
| `EVGCommands.rgr` | everything an application can do, by name |

**Text**

| File | |
| --- | --- |
| `EVGTextEngine.rgr` | line breaking, the engine layout and painting share |
| `EVGTextMeasurer.rgr` | the measurer interface and the measured advance table |
| `EVGContextMeasurer.rgr` | measurement through a host's own renderer |
| `EVGTextFit.rgr` | text that stays inside its box |
| `EVGGrapheme.rgr` `EVGCodepoint.rgr` | what "one character" means |

**Vector**

| File | |
| --- | --- |
| `SVGPathParser.rgr` | the `d` attribute, every command including arcs |
| `SvgParser.rgr` | whole SVG files: `<use>`, `<defs>`, baked transforms |
| `PathBuilder.rgr` `VectorShapes.rgr` `VectorStroke.rgr` `VectorViewBox.rgr` | geometry, strokes, `viewBox` |
| `EvgBitmapTracer.rgr` and `EvgTrace*.rgr` | the raster-to-vector tracer |

**Interaction, meaning, components**

`EVGHitTest.rgr`, `EVGA11yTree.rgr`, `EVGA11yFromTree.rgr`,
`EVGReconcile.rgr`, `EVGComponent.rgr`, `EVGWindow.rgr`, `EVGToolbar.rgr`,
`EVGToolbarView.rgr`, `EVGToolbarIcons.rgr`, `EVGRuler.rgr`,
`EVGRulerView.rgr`, `EVGSelectChrome.rgr`, `EVGText.rgr`,
`EVGImageDecode.rgr`, `EVGImageMeasurer.rgr`.

**Painters and pages**

`html/`, `gl/`, `android/`, `apple/`, `showcase/`, `web/tracer/`,
`web/responsive/`, `tools/`.

---

## Running things

```sh
# the engine's own tests
npm run evg                     # evg_test: the layout basics
npm run evg:box:test            # the box-model shorthands
npm run evg:flexwrap:test       # a row must not wrap because of its own arithmetic
npm run evg:style:test          # pseudo-classes and transitions
npm run evg:stylecache:test     # the cache, viewport included
npm run evg:viewport:test       # vw / vh, on screen and on paper
npm run evg:rtl:test            # direction: rtl
npm run evg:overlay:test        # anchored overlays
npm run evg:invalidate:test     # what a frame is allowed to skip
npm run evg:reconcile:test      # keyed children
npm run evg:component:test      # instances that outlive the tree
npm run evg:timing:test         # easing and transition timing
npm run evg:a11y:test           # the accessibility tree
npm run evg:json:test           # the display list's JSON
npm run evg:responsive:check    # the responsive page at four widths

# oracles — the same question, asked of a browser
npm run evg:box:oracle
npm run evg:timing:oracle
npm run evg:blur:oracle

# pages
npm run showcase                # the gallery -> showcase/dist/index.html
npm run evg:responsive:web:serve   # the live responsive page
npm run evg:trace:web:serve        # the live bitmap tracer

# one document, three targets
npm run evgpdf:test             # -> PDF
npm run evghtml:test            # -> HTML
npm run evg:displaylist -- page.tsx out.json -css sheet.css
```

Anything under `bin/` is generated; the Ranger compiler has to be built first
(`npm run compile`).
