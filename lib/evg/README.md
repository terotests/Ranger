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
| [`PLAN_NATIVE_HOSTS.md`](PLAN_NATIVE_HOSTS.md) | A spike: DOM, SwiftUI and Compose as hosts rather than painters — what the platform can do better than a canvas, where native layout stops, and the engine off the UI thread |
| [`bench/README.md`](bench/README.md) | The same CSS through this engine and through Chromium — where they disagree, and what layout costs at 100k boxes |
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

Two tags mean more than their `elementType`. A **`popover`** is a container that
is also a [surface](#surfaces-popovers-anchors-and-presentation) — out of flow,
in the top layer, placed against an anchor — without saying `overlay: true`. A
**`connector`** is a path whose `d` the layout writes; see
[Connectors](#connectors).

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
| `flex-direction` | `row`, `column`. The reversed directions parse and then warn: nothing lays them out |
| `flex-wrap` | `nowrap`, `wrap`, `wrap-reverse` |
| `justify-content` | `flex-start`, `center`, `flex-end`, `space-between`, `space-around`, `space-evenly` |
| `align-items` `align-content` | `flex-start`, `center`, `flex-end`, `stretch`, `baseline` |
| `align-self` | the same set, on the item, overriding its container's `align-items` |
| `flex` | the shorthand; `flex-basis` and `flex-shrink` separately |
| `gap` `row-gap` `column-gap` | the longhands override the shorthand, per axis — in a row `column-gap` is between the items and `row-gap` between the wrapped lines |
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

### Surfaces: popovers, anchors and presentation

A **surface** is a box that is not in the flow and not in the page's stacking
order either: a dropdown, a tooltip, a menu panel, the toolbar that appears
around a selected element. Two things make it one, and they are separate:

* it takes no space in its parent — nothing moves for it;
* it is drawn **after the whole normal tree, outside every clip**. That is a
  real top layer, the same thing the web's Popover API gives you: an ancestor's
  `overflow: hidden` cannot cut it and no `z-index` is involved. See
  `deferredOverlays` in [`EVGDisplayList`](EVGDisplayList.rgr).

It still lives where it belongs in the tree. A menu declared inside its button
is a child of that button for events, state and the accessibility tree, and is
only *drawn* somewhere else — which is what a portal is for in other toolkits,
here as a property of the layout.

Say so with the `popover` tag, or with `overlay: true` on any element:

```json
{"tag": "div",     "props": {"anchor-name": "--file"}, "text": "File"},
{"tag": "popover", "props": {
  "position-anchor": "--file",
  "position-area": "bottom start",
  "position-try-fallbacks": "top start, right start",
  "fit-viewport": "true", "overflow": "hidden",
  "sheet-below": "600px"
}}
```

#### Naming the anchor

| Property | Notes |
| --- | --- |
| `anchor-name` | names this element so something can point at it: `--file` |
| `position-anchor` | what this surface is positioned against: an `anchor-name` or an `#id`. Also marks the element as a surface |
| `overlay-anchor-role` | the older convention: the surface takes whichever **sibling** declares this |
| `overlay` / `isOverlay` | marks the element as a surface without naming an anchor |

Three ways to say it, in the order they win: an element set from code, then
`position-anchor`, then the sibling convention. `position-anchor` is the only
one that reaches out of the surface's own parent, so a menu no longer has to be
declared beside its trigger. It is the same name a connector points at — one
registry, collected once per layout.

#### Where it goes

| Property | Notes |
| --- | --- |
| `position-area` | `bottom start`, `top end`, `right center`, `bottom left`, `center`, `cover` — the side, then where along that side's cross axis |
| `overlay-side` / `overlay-align` | the same two things written separately |
| `overlay-gap` | distance from the anchor |
| `position-try-fallbacks` | `"top start, right start, left start"` — areas to try when the declared one does not fit |
| `position-try-order` | `most-space` takes the roomiest candidate instead of the first that fits |

`position-area`'s second word may be logical (`start`, `center`, `end`) or
physical (`left`, `right`, `top`, `bottom`); which axis a physical word means
depends on the side, exactly as in CSS. `center` and `cover` are sides of their
own: a modal centred on the page, and a backdrop covering it.

The candidates are tried in order — the declared area, then each fallback, then
the **opposite side**, which is always appended and is the flip this pass has
always done. The first candidate that is *wholly on the page* wins. With
`position-try-order: most-space` every fitting candidate is scored by the free
room left over and the roomiest wins. When none fits, the one that hangs off by
the least does, and it is then shifted back onto the page: a surface half off
the page is worse than one covering its anchor.

Where it actually went is written back onto the element as
`overlayPlacedSide` and `overlayPlacedAlign` — fields, not properties, because
they are the pass's output and an input the layout also writes would read last
frame's answer. An arrow that has to point the other way when a menu opens
upwards reads them, and so does every test here.

#### Placing one edge: `anchor()`

`position-area` puts a whole surface on a side of its anchor, which is what a
menu wants. A badge hanging off a card's corner is a different statement — one
edge of this box on one edge of that one — and no area can say it. That is
CSS's `anchor()`, in the inset properties:

```json
{"tag": "div", "props": {"anchor-name": "--card"}},
{"tag": "div", "props": {
  "position-anchor": "--card",
  "left": "calc(anchor(right) - 12px)",
  "top":  "calc(anchor(top) - 10px)",
  "width": "24px", "height": "24px"
}}
```

| In | Written as | Means |
| --- | --- | --- |
| `left` / `right` | `anchor(left)`, `anchor(right)`, `anchor(center)` | that edge of the anchor |
| `top` / `bottom` | `anchor(top)`, `anchor(bottom)`, `anchor(center)` | that edge of the anchor |
| any of them | `calc(anchor(…) + 8px)`, `calc(anchor(…) - 8px)` | that edge, offset |

`left` and `top` place this box's near edges; `right` and `bottom` place its far
ones. Both insets on one axis **stretch** the box between them, the same rule
`left` with `right` already follows. An edge from the wrong axis — `left:
anchor(bottom)` — is reported and dropped rather than guessed at. One anchor
reference and at most one length: anything more would need a real `calc()`,
which this engine does not have.

One consequence worth knowing: `position-anchor` makes the element a surface,
so a badge placed this way is out of the flow and drawn in the top layer, above
the page and outside every clip. When you want it clipped with its container
and stacked with it, position it with `position: absolute` inside that
container instead — the geometry is yours to write, and nothing looks it up.

#### When it does not fit

| Property | Notes |
| --- | --- |
| `fit-viewport` | clamp the surface to the room on the side it landed on |
| `overflow` (`overflow-y`) | anything but `visible` clips, and then `scrollHeight` is how much more there is |

A menu of forty rows does not fit under anything. `fit-viewport: true` cuts it
to the room there is rather than letting it run off the page; with `overflow`
set it clips, and `scrollHeight` minus `clientHeight` is how far there is to
scroll — the ordinary scroll model, no second mechanism. The field
`overlayClamped` says it happened. Pair it with `position-try-order: most-space`, so the side chosen
is the roomier one before the clamp rather than the first that nearly fits.

This engine has one `overflow` per box, not one per axis; `overflow-y` and
`overflow-x` are accepted and set it, because `overflow-y: auto` on a menu is
how the web writes "and scroll if it is too tall" and dropping it silently was
worse than clipping both axes. Clipping both is safe for a submenu: a nested
surface is drawn in the top layer, outside every clip.

#### When it is the wrong widget

| Property | Notes |
| --- | --- |
| `presentation` | `anchored` (the default), `sheet`, `fullscreen` |
| `sheet-below` | become a sheet at or below this page width |

This is the one part with no CSS equivalent, and the reason it exists: at 390
wide an anchored menu is not badly placed, it is the wrong widget. No fallback
list fixes that. `presentation: sheet` drops the anchor entirely — the surface
becomes as wide as the page, as tall as its content needs, pinned to the bottom
edge, and its children are laid out again at that width. `fullscreen` takes the
page. `sheet-below: 600px` is the one line that covers the usual case; a
`@media` block setting `presentation` is the general route, and both arrive at
the same place. The field `overlayPlacedPresentation` says which it ended up
being.

#### The pass

```
normal layout
      ↓
surfaces, once every anchor has a rectangle
      ↓
presentation          anchored | sheet | fullscreen
      ↓
anchor                position-anchor → the name registry
      ↓
insets                anchor() in left/top/right/bottom, if any — done
      ↓
placement             position-area, then each fallback, then the flip
      ↓                   first that fits, or the roomiest, or the least bad
fit                   clamp to the room, measure the scroll extent
      ↓
shift onto the page
      ↓
top layer, drawn after everything, outside every clip
```

What is **not** here: dismissal, focus policy, and the stack that keeps a
submenu open while its parent is. Those are interaction, not layout, and belong
with [`EVGFocus`](EVGFocus.rgr) and [`EVGCommands`](EVGCommands.rgr). A surface
with no anchor is reported by name rather than placed silently at the origin —
see `EVGLayout.getOverlayErrors()`.

Most of the vocabulary above is CSS's own — `anchor-name`, `position-anchor`,
`position-area`, `position-try-fallbacks`, `position-try-order` — so what you
know about anchor positioning transfers. `presentation`, `sheet-below` and
`fit-viewport` are EVG's, because the web builds those out of media queries and
a popover by hand.

`npm run evg:popover:test` and `npm run evg:overlay:test`.

### Connectors

A `connector` is a line between two elements whose geometry the **layout**
writes. `path` is the other half of the pair: there the author owns `d` and the
layout owns nothing.

| Property | Notes |
| --- | --- |
| `anchor-name` | names this element so a connector can point at it, as in CSS Anchor Positioning: `--orders` |
| `from` / `to` | an `anchor-name` or an `#id` |
| `from-side` / `to-side` | `left`, `right`, `top`, `bottom`, `center`, the four corners — or `auto` |
| `routing` | `straight`, `orthogonal`, `bezier` |
| `from-offset` / `to-offset` | a gap between the box edge and the line's end |
| `arrow-start` / `arrow-end` | `none`, `open` (two strokes), `triangle` (filled) |
| `arrow-size` | the head's length |

It is drawn with the stroke vocabulary a path already has — `stroke`,
`stroke-width`, `stroke-linecap`, `stroke-linejoin`, `stroke-dasharray`. There
is no connector-specific styling and there should not be.

```json
{"tag": "div", "props": {"anchor-name": "--orders"}},
{"tag": "div", "props": {"anchor-name": "--revenue"}},
{"tag": "connector", "props": {
  "from": "--orders", "to": "--revenue",
  "stroke": "rgb(250,204,21)", "stroke-width": "3px",
  "arrow-end": "triangle", "arrow-size": "10px"
}}
```

`auto` is the point of the tag. The connector above leaves the right edge of
one card and arrives at the left edge of the other while they sit side by side;
reflow the same document to one column and it leaves the bottom and arrives at
the top, because the sides are decided from where the boxes ended up rather
than from where they were when the document was written. A `path` at
`left: 171px` cannot do that, and that is what it was doing before.

Connectors are solved after layout and after the overlay pass, so a line can
point at anything, declared anywhere. What cannot be resolved is reported —
`connector: nothing is called "--revenue"` — and draws nothing rather than a
line to the origin. The heads are filled and the shaft is stroked, which is why
they are separate paths internally (`EVGElement.arrowPath`): a fill closes every
subpath it is given, and an orthogonal shaft closed is a triangle nobody asked
for.

See [`EVGConnector.rgr`](EVGConnector.rgr) and its test,
`npm run evg:connector:test`.

### Interaction and meaning

`transition` (see [Interaction](#interaction)), the ARIA surface (see
[Accessibility](#accessibility)), and `evg-surface-effect` with `evg-effect-on`
and the `evg-fx-*` / `evg-ripple-*` parameters, which are GPU passes and are
dropped by the painters that have no render target.

#### Surface effects belong to an element

```css
.hero-sky { evg-surface-effect: starfield; evg-effect-on: always; evg-fx-density: 1.6 }
.pool     { evg-surface-effect: ripple;    evg-effect-on: press drag }
```

`evg-surface-effect` names WHAT runs, `evg-effect-on` says WHAT STARTS IT, and
`evg-fx-<name>: <number>` passes parameters the engine never reads — WHERE is
the element's own border box, because the layout already worked it out. So the
document decides which card ripples, and no application code holds a drop, a
clock or a coordinate.

The display list carries one instance per element that declared one, under the
element's `id`, and the painter looks the name up in a registry:

```js
registerSurfaceEffect({ name, layer: "source" | "filter", params, frag })
```

A **source** is drawn in paint order at the element's own background, so the
element's content is painted over it; a **filter** runs over the finished
surface, clipped to the box, which is how the ripple bends text it knows
nothing about; a **backdrop** is a filter in paint order — it reads what is
behind the element, writes it back changed, and then the element's own
background, border and children are drawn on top, sharp. Each is one GLSL
function and a parameter list, and the box mask is applied for them — a plugin
cannot paint outside its own element.

Seven ship with the painter:

| name | layer | what it is |
| --- | --- | --- |
| `ripple` | filter | rings through the finished surface, from a press or a drag |
| `starfield` | source | stars and dust on the element's own background |
| `liquid-glass` | backdrop | refraction at the rim, with a sweep that crosses it |
| `plasma-wave` | source | drifting ribbons of light |
| `raindrop` | backdrop | drops on the pane, each one a small lens over the page |
| `ambient-light` | source | a slow wash of colour with soft orbs in it |
| `smoke` | source | a bank of smoke rising through the box, or a cloud filling it |

`liquid-glass` is refraction rather than fog, and it composes with the CSS that
was already there:

```css
.glass {
  backdrop-filter: blur(9px);              /* the frosting — already EVG's */
  background-color: rgba(255,255,255,.07); /* the tint — an ordinary fill  */
  border-radius: 30px;                     /* the shape, said once         */
  evg-surface-effect: liquid-glass;        /* and the lens at its rim      */
  evg-fx-strength: 40;
}
```

The bend follows the element's own rounded box, so a pane is a lens at whatever
size the layout gave it — nothing in the plugin knows the shape in advance.

`lib/evg/gl/evg-fx.js` is the host's side: it hit-tests the boxes the list
carries and turns pointer events into the events the shaders read.
An instance the host marks `off` is skipped by the painter and the driver
both — no pass, no shader, and a press on it falls through to whatever is
under it. That is the hook a page's own switch hangs on, and the one
`prefers-reduced-motion` would; `fx-demo.html` has a switch per effect.

[`lib/evg/gl/effect-presets.css`](gl/effect-presets.css) is fourteen blocks
that are already a look — five skies, two plasma fields, two rains, two washes
and three of smoke —
paste-able into the editor under the gallery demo or into a stylesheet of your
own. `npm run evg:fx:shots` paints every one of them into a contact sheet, and
`fx-check` reads the same file through the engine's own cascade, so a preset
nobody can parse fails a check rather than quietly drawing the defaults.

The original whole-surface effect (`list.effect`, drops pushed in by the
application) is unchanged and still runs. [`PLAN_EFFECTS.md`](PLAN_EFFECTS.md)
has the design, what it does not do yet, and how to write a plugin;
`npm run evg:fx:test`, `npm run evg:fx:check`, `npm run evg:fx:demo` and
`npm run evg:fx:shots`.

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
justify, align, `align-self` and the two gaps; a text leaf shrink-wraps to its
measured content rather than claiming the parent's width. **Grid** is
`display: grid` with fixed, percentage and `fr` tracks, `repeat()`, `minmax()`,
named areas, spans and row `subgrid`.

**Sizing a flex line** is CSS's "resolve flexible lengths" in both directions:
a `flex-basis` is the item's starting main size whether or not it grows, the
free space is shared by `flex-grow` and the overflow by `flex-shrink` × base,
and an item that hits `min-width` or `max-width` is FROZEN at the limit and
what it did not take is offered to the rest. `max-width` is applied before
`min-width`, so when the two contradict each other the minimum wins.
[`EVGFlexRulesTest.rgr`](EVGFlexRulesTest.rgr) (`npm run evg:flexrules:test`)
is the statement of all five rules, and
[`bench/`](bench/) is where they were found — the same CSS through this engine
and through Chromium, box for box.

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

**And a declaration the engine cannot use is one of them.** `calc()`,
`width: min-content`, `aspect-ratio`, `align-self` before it existed,
`repeat(auto-fit, …)`, a reversed flex direction — each of these used to be
dropped in silence, and a dropped `width` is not neutral: in a row it fills the
parent, so `width: calc(100% - 40px)` did not fail to apply, it applied as
`width: 100%`. [`EVGReject`](EVGReject.rgr) collects every one and `layout()`
drains it into the same list. It de-duplicates and caps itself, so one bad rule
applied to 22,403 elements is one warning and not 22,403 — measured, because
the style cache replays a plan per element per frame.

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
| `EVGHostTextMeasurer` | **the platform that will paint** — canvas `measureText`, CoreText, Skia's `Paint`, Java2D — through one function the host hands over | every screen app; see below |

`isFontAccurate()` is how the engine knows the difference: a measurer that never
opens a font must not silently drive print layout, and `EVGTextEngine` asks
before letting a document that names custom faces through.

**The platform measures, EVG breaks the lines.** A screen app draws with a face
the platform chose, and the table is a snapshot of one browser's sans; where
the two differ a caret lands beside its glyphs and a label clips its box.
[`EVGHostTextMeasurer`](EVGHostTextMeasurer.rgr) closes that with **one
function** a host provides — `metric(kind text family size bold italic)`: a
run's width, or a face's ascent, descent and line gap — and keeps everything
else in Ranger: the per-face cache, the `-Bold` convention
`effectiveFontFamily` writes the weight in, the cache key, and the fallback to
the table until the platform attaches. The lines are still broken here, one
run per line, so a PDF and a screen that share a face still break in the same
place. The hosts are a page each:

| Platform | File | Installed by |
| --- | --- | --- |
| browser | [`gl/evg-measure.js`](gl/evg-measure.js) — canvas `measureText`, the painters' own `fontSpec`, the gap off a `line-height: normal` probe; works in a Worker | `gallery/ui/demo`, `gallery/realtrainer/web`, `gallery/ui/web`, `web/responsive` |
| Apple | [`apple/Sources/CoreTextMeasurer.swift`](apple/Sources/CoreTextMeasurer.swift) — the `CTFont` the surface draws with, `CTLineGetTypographicBounds` | `ui/ios`, its watch app, `realtrainer/ios` |
| Android | [`android/src/android/…/AndroidTextMeasurer.kt`](android/src/android/kotlin/fi/ranger/evg/AndroidTextMeasurer.kt) — the `FaceSet`'s `Typeface` through a `Paint`; [`AwtTextMeasurer.kt`](android/src/awt/kotlin/fi/ranger/evg/AwtTextMeasurer.kt) is the Java2D twin the desktop checks use | `ui/android`, `realtrainer/android`, both `CheckDashboard`-style checks |

They reach every layout through **`EVGDefaultMeasurer`** (in
`EVGTextMeasurer.rgr`): a process-wide default that `EVGLayout` and
`EVGTextEngine` read in their constructors, so the twenty-five `new
EVGLayout()`s in the gallery pick it up without being told. A host installs
before the app is constructed — the demos keep a layout from the moment they
exist — and `setMeasurer` still overrides it, which is how print keeps the TTF
one. `npm run evg:hostmeasurer:test` drives the Ranger half with a made-up
platform, and `npm run evg:measure:web` opens two built pages in Chromium and
asks whether a run measured through EVG is the width the painter's canvas
gives the same font shorthand; PLAN_NATIVE_HOSTS.md S0 is where it came from.

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
  native host, and for a browser host whose engine is in a Worker. Its record
  width is published in the format rather than agreed in advance; see ISSUES
  #4 for why that sentence is there. The record is 36 ints: since the list
  started crossing a thread it also carries the other three corners, the
  scroll layer a clip opens, and the shadow — which no JSON ever did.
  [`gl/evg-binary.js`](gl/evg-binary.js) reads it back into the JSON's shape,
  and `npm run evg:binary:check` holds it to the object reader.
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
| **Retained DOM** | [`html/evg-dom.js`](html/evg-dom.js) | one node per element, patched from the host tree's ops — the nodes survive a frame |
| **WebGL 2** | [`gl/evg-webgl.js`](gl/evg-webgl.js) | one instanced quad per command; rounded corners from a distance field |
| **SDL2 + OpenGL** | `lib/evg/gl/evg_gl_host.rgr` | the same list through the C++ target |
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
`a11yInvalid`, `a11yModal`, `a11yOrientation`, `a11yPressed`, `a11yReadOnly`, `a11yRequired`,
`a11yRoleDescription`, `a11yRowCount`, `a11yRowIndex`, `a11ySelected`,
`a11ySorted`, `a11yValue`.

Tri-state where ARIA is tri-state: `a11yExpanded` is not-applicable, no, yes or
mixed, because an absent `aria-sort` and a present `aria-sort="none"` are
different things and the DOM makes the distinction.

---

## The engine off the UI thread

Nothing above the display list needs a window, so on every platform the app
can run on a thread of its own and hand the UI thread frames to paint
(PLAN_NATIVE_HOSTS.md S1). The shape is the same three times: the host makes
the app, then never touches it directly again — every call is posted to the
engine in order, a call that changed the page produces a frame there, and the
UI thread keeps the last frame and paints it. Three verbs: `post` (no
answer), `ask` (an answer, later, on the UI thread), and `sync` for the one
read a platform insists on at once (`canBecomeFirstResponder`,
`onCheckIsTextEditor`).

| Platform | The harness | A host on it |
| --- | --- | --- |
| browser | [`gl/evg-engine.js`](gl/evg-engine.js): a Worker, frames as transferred `EVGSceneBinary`, input batched into the frame request | `gallery/realtrainer/web/main-worker.js` (`?engine=worker`) |
| Apple | [`apple/Sources/EvgEngineQueue.swift`](apple/Sources/EvgEngineQueue.swift): a serial `DispatchQueue`, frames delivered to the main thread | `gallery/realtrainer/ios` |
| Android / JVM | [`android/src/main/…/EvgEngineThread.kt`](android/src/main/kotlin/fi/ranger/evg/EvgEngineThread.kt): a single-thread executor, `onMain` is `View.post` | `gallery/realtrainer/android` |

Frames are coalesced — a burst of posts makes one build after the last — and
a kept list that only scrolled crosses as its layers' shifts, not as a list.
The cost is that a host cannot read the app synchronously; the RealTrainer
check measures what that costs a press (pointer-down to the frame that showed
it) on both browser hosts, and prints it.

## The host tree

The display list is deliberately dumb — no identity, so a painter is small
— and that is exactly what a host that wants to KEEP nodes cannot use.
[`EVGHostTree`](EVGHostTree.rgr) is the fifth list beside the four above,
derived from the same laid-out tree by the same rule, and it says what
changed rather than what to draw:

```
CREATE  path parentPath index    a node, with everything a host needs
UPDATE  path bits                 GEOMETRY | PAINT | TEXT | A11Y | SCROLL
MOVE    path parentPath index     the same node, elsewhere
REMOVE  path
```

The identity is the inspector's path (`0/3/k:share`), so a keyed reorder is
a MOVE and not a rebuild. Geometry is parent-relative at scroll 0, so a
scroll is one SCROLL bit on the container and no op on its children — a
compositor moves them. Text is the engine's lines, one run per line at the
display list's offsets, so the host breaks nothing itself and print parity
holds. [`html/evg-dom.js`](html/evg-dom.js) is the first host on it: a DOM
node per element, patched; `npm run evg:dom:check` asks Chromium whether
every node is where the engine put it and whether a resize updated the
nodes rather than remaking them, and `npm run rt:dom` asks the same of
RealTrainer, scene change and scroll included. Both are live on the site:
[the responsive page](https://terotests.github.io/Ranger/evg/responsive/?painter=dom)
and [RealTrainer](https://terotests.github.io/Ranger/realtrainer/?painter=dom)
as `?painter=dom` (the SVG painter is the responsive page's default, and
`?engine=worker` on RealTrainer runs the engine in a Worker).
PLAN_NATIVE_HOSTS.md S2 and S3.

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
| `EVGConnector.rgr` | connectors: a line between two elements, solved after layout |
| `EVGBox.rgr` | the resolved box model |
| `EVGUnit.rgr` | lengths and how they resolve |
| `EVGStyleSheet.rgr` | the CSS subset, the cascade, `@media`, the style cache |
| `EVGColor.rgr` | colour parsing, blending, interpolation |
| `EVGGradient.rgr` | linear and radial gradient strings |
| `EVGEasing.rgr` | timing functions |
| `EVGTransition.rgr` | properties arriving at their values over time |
| `EVGDisplayList.rgr` | the flat command list, JSON and binary |
| `EVGCommands.rgr` | everything an application can do, by name |
| `EVGHostTree.rgr` | the fifth list: what changed, for a host that keeps nodes |

**Text**

| File | |
| --- | --- |
| `EVGTextEngine.rgr` | line breaking, the engine layout and painting share |
| `EVGTextMeasurer.rgr` | the measurer interface and the measured advance table |
| `EVGContextMeasurer.rgr` | measurement through a host's own renderer |
| `EVGHostTextMeasurer.rgr` | measurement through the platform that will paint, from one host function |
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

The UI counterpart of the bitmap tracer lives one directory up as
[`gallery/erazer`](../../gallery/erazer/README.md): a screenshot in, a nested EVG layout
out, with widget guesses (button, field, tab, menu, checkbox, icon) instead
of photographic paths. `npm run erazer:web:serve` is the live page.

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
npm run evg:popover:test        # named anchors, fallbacks, fit-viewport, sheets
npm run evg:connector:test      # a line between two elements, and absolute in a grid
npm run evg:invalidate:test     # what a frame is allowed to skip
npm run evg:reconcile:test      # keyed children
npm run evg:component:test      # instances that outlive the tree
npm run evg:timing:test         # easing and transition timing
npm run evg:a11y:test           # the accessibility tree
npm run evg:json:test           # the display list's JSON
npm run evg:hostmeasurer:test   # a platform's one function reaches every layout
npm run evg:measure:web         # ...and in Chromium the browser is the one measuring
npm run evg:binary:check        # the list reads the same off the object and off toBinary()
npm run evg:hosttree:test       # the host tree says only what changed
npm run evg:dom:check           # ...and the DOM painter puts the nodes where it said, and keeps them
npm run evg:responsive:check    # the responsive page at four widths

# oracles — the same question, asked of a browser
npm run evg:box:oracle
npm run evg:timing:oracle
npm run evg:blur:oracle

# pages
npm run showcase                # the gallery -> showcase/dist/index.html
npm run evg:responsive:web:serve   # the live responsive page
npm run evg:trace:web:serve        # the live bitmap tracer
npm run erazer:web:serve           # bitmap UI screenshot → EVG layout
npm run livebuild:serve            # seed a phone; Follow up streams display lists over SSE
npm run livebuild:withcursor       # same page, local Cursor Agent CLI (agent login)
# Export copies a markdown brief (document + how to build it as a Rave / EVG app)
# onto the clipboard for another Ranger agent.

# one document, three targets
npm run evgpdf:test             # -> PDF
npm run evghtml:test            # -> HTML
npm run evg:displaylist -- page.tsx out.json -css sheet.css
```

Anything under `bin/` is generated; the Ranger compiler has to be built first
(`npm run compile`).

## As a package

EVG is the package `evg`. Inside this repository a gallery project names it
by path; outside, `rgrc install` fetches it from Git by subdirectory:

```json
"dependencies": {
  "evg": { "path": "../../lib/evg" }
}
```

```json
"dependencies": {
  "evg": { "git": "https://github.com/terotests/Ranger.git",
           "rev": "<commit>", "subdir": "lib/evg" }
}
```

```ranger
Import "pkg:evg/EVGElement.rgr"
Import "pkg:evg/EVGLayout.rgr"
```

Its own dependency is `image` (`lib/image`: the JPEG and PNG codecs behind
`EVGImageDecode`), which depends on `zip` (`lib/zip`: DEFLATE). Both are
sibling path dependencies, so a Git fetch of `lib/evg` brings them along at
the same commit. Nothing under this directory imports `gallery/`.

The window layer that used to live here — `EVGWindow`, `EVGTextFit`,
`EVGContextMeasurer`, `EVGRulerView`, `EVGToolbarView` — needs the gallery's
software rasteriser and font engine and is the package
[`gallery/evg_window`](../../gallery/evg_window/README.md).

## License

**MIT**, like the compiler and the rest of `lib/`. EVG moved here from
`gallery/evg`, and from AGPL-3.0-or-later to MIT, in September 2026; the
reasoning is in [LICENSING.md](../../LICENSING.md).
