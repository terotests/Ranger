# EVG Vector IR & SVG Import Plan

**Status:** Draft for discussion
**Scope:** `gallery/evg/` (renderer-neutral) + the three renderers in
`gallery/pdf_writer/src/` and the WASM UI in `gallery/game_engine/v2/ui/`

## 1. Premise

The proposal is: *do not make EVG an SVG engine — give EVG a renderer-neutral
vector layer and make SVG one importer into it.* That direction is right, and
this document adapts it to what is already in the tree.

The important correction to the original sketch: **this is not a greenfield
build.** `gallery/evg/SVGPathParser.rgr` already exists (568 lines) and already
contains `PathCommand`, an SVG path-data parser, bounds calculation, scaling and
a curve `flatten()`. It already has three independent consumers:

| Consumer | File | Uses |
| --- | --- | --- |
| PDF renderer | `pdf_writer/src/core/EVGPDFRenderer.rgr:1762` | `getScaledCommands()` → PDF `m`/`l`/`c`/`h` |
| WASM UI | `game_engine/v2/ui/WasmUiSelect.rgr:538` | `flatten(12)` → `UIContext.fillPolygon` |
| EVG tests | `game_engine/v2/evg/evg_test.rgr:2210` | parse + bounds |

The HTML renderer is a fourth consumer in spirit: it does not parse at all, it
forwards `el.svgPath` and `el.viewBox` straight into an inline `<svg>` and lets
the browser do the work (`EVGHTMLRenderer.rgr:1505`).

So the work is **not** "add a vector layer". It is "the vector layer exists,
is under-specified, and every consumer interprets it differently". That is a
stronger argument for the plan than the original sketch made, because the
divergence is already producing wrong output today.

## 2. What is actually broken today

These are the concrete defects that a shared Vector IR is meant to eliminate.
Each one is a real behavioural difference, not a hypothetical.

### 2.1 PDF and HTML disagree about `viewBox`

For the same `<Path>` element:

* **PDF** calls `getScaledCommands(w, h)`, which maps the path's *bounding box*
  onto the element box with **independent X and Y scale factors**, and ignores
  `viewBox` completely.
* **HTML** emits `<svg viewBox="…" width="w" height="h"><path d="…">` and the
  browser applies real SVG semantics: viewBox → viewport with
  `preserveAspectRatio="xMidYMid meet"` (uniform scale, centred, letterboxed).

Consequences: a non-square icon is stretched in PDF and letterboxed in HTML;
intentional padding inside the viewBox (very common in 24×24 icon sets) is
silently cropped away in PDF because bbox-fitting removes it; and a path that
does not start at the viewBox origin lands in a different place in each output.

This one issue justifies the whole plan on its own: the same document does not
render the same way, and no amount of per-renderer patching fixes it because
there is no shared definition of what the coordinates *mean*.

### 2.2 The path parser silently drops what it does not understand

`SVGPathParser.parseCommand` handles `M m L l H h V v C c Q q Z z`. It does
**not** handle:

* `A`/`a` — elliptical arc. `PathCommand` has `rx`, `ry`, `rotation`,
  `largeArc`, `sweep` fields and `flatten()` has an `"A"` branch, but the parser
  never emits one, so those are dead code.
* `S`/`s`, `T`/`t` — smooth cubic/quadratic. Common in optimizer output (SVGO)
  and in hand-written paths.
* **Implicit command repetition** — `M 10 10 20 20 30 30`, `C … … …` with
  repeated coordinate sets. The main loop reads one letter, `parseCommand`
  consumes exactly one coordinate set and returns.

The failure mode is the problem: unrecognised letters and leftover numbers are
skipped one character at a time by the `i = i + 1` branch in `parse()`. Nothing
raises, nothing warns. The path just quietly loses segments and the shape closes
across the gap. For hand-authored icon paths this has been survivable; for
imported `.svg` files it is not.

### 2.3 `Q` → cubic conversion in the PDF renderer is mathematically wrong

`EVGPDFRenderer.rgr:1804` emits, for a quadratic segment with control `C`:

```
x1 y1 x1 y1 x y c
```

i.e. it uses the quadratic control point as *both* cubic control points. The
correct degree elevation is:

```
C1 = P0 + 2/3 (C - P0)
C2 = P3 + 2/3 (C - P3)
```

The current form pulls the curve toward the control point far too weakly, so
quadratic curves render visibly flatter in PDF than in HTML (where the browser
does it correctly). The comment in the source (`; For simplicity, approximate
with cubic`) shows this was known to be an approximation; it is a
one-line-per-coordinate exact fix, and in a shared IR it is fixed once.

### 2.4 `flatten()` loses subpath structure, so holes are impossible

`flatten(steps)` returns a flat `[x0,y0,x1,y1,…]` list with no ring boundaries —
an `M` in the middle of the path just pushes another point. `UIContext.fillPolygon`
then treats the whole list as one closed polygon (it wraps last → first) and
fills by counting scanline crossings.

So any path with more than one subpath renders wrong: a donut, the letter "O",
a check mark inside a ring, any icon with a counter. Every real icon set hits
this.

### 2.5 Raster has no path support at all

`RasterPrimitives` has line/rect/rounded-rect/circle/ellipse. There is no path
entry point, which is exactly what `TODO_EVG.md` tracks as **PNG 0.9 SVG path
rasterization — TODO**. A `<Path>` in a TSX document renders in PDF and HTML and
is simply absent from PNG output.

## 3. The one big asset the sketch under-valued

The original sketch treats the raster side as "the actual work" and proposes a
new `VectorRasterizer`. In fact **a general anti-aliased path rasterizer already
exists in the tree** — it is just hard-wired to font glyphs. In
`pdf_writer/src/raster/RasterText.rgr`:

* `GlyphContour` — a closed contour of points (`RasterText.rgr:31`)
* `GlyphEdge` — an edge carrying a winding direction (`:71`)
* `flattenContour` — quadratic curve subdivision into edges (`:570`)
* `scanlineFillAA` — scanline fill, **non-zero winding rule**, 4×4 subpixel
  supersampling (`:908`)

That is a complete polygon rasterizer. Nothing about the fill stage is
font-specific; only the *input* is (TrueType contours, quadratic-only, on/off
curve points).

This changes the cost estimate substantially. The raster milestone is mostly an
**extraction**, not a new algorithm:

```
RasterText                    VectorRasterizer            RasterText
  GlyphContour       ──►        Contour          ◄──  (feeds glyph contours)
  GlyphEdge          ──►        Edge             ◄──  SVGPathParser (flattened)
  scanlineFillAA     ──►        fillAA(rule)     ◄──  UIContext.fillPolygon
```

Three wins from one refactor: PNG 0.9 gets done, the WASM UI's `fillPolygon`
gains anti-aliasing and hole support for free, and glyph rendering and path
rendering can no longer drift apart. The only genuinely new capability needed is
an **even-odd** fill rule alongside the existing non-zero.

## 4. Recommended architecture

Agreed with the sketch on the central decision:

```
SVG file ──► SvgParser ──┐
                         ├──► Vector IR ──┬──► PDF   (native path operators)
TSX <Path>/<Vector> ─────┤                ├──► HTML  (inline <svg>)
                         │                ├──► Raster(VectorRasterizer)
programmatic (charts) ───┘                └──► WASM UI (UIContext)
```

Two refinements.

### 4.1 Do not introduce a second node tree — until imports need one

The sketch proposes `VectorGroup` / `VectorPath` / `VectorRect` / `VectorEllipse`
as a parallel node tree. EVG already has an element tree (`EVGElement`, with
children, `transform`, `viewBox`, `fillColor`, `strokeColor`, `strokeWidth`) plus
`EVGDisplayList` as a flattened draw-command stream. A third tree means a third
traversal, a third transform resolution and a third paint resolution.

Recommended split, decided by **where the nodes come from**:

* **Authored vector** (`<Path>`, `<Vector>` in TSX): stays `EVGElement`. There
  are few nodes, they benefit from layout, props and data binding, and this is
  already how `<Path>` works.
* **Imported SVG** (`<Svg src="logo.svg">`): collapses into **one** `EVGElement`
  carrying a lightweight, layout-free vector display list. An Illustrator export
  can be thousands of nodes; giving each one a full `EVGElement` layout box would
  be very expensive for something that never participates in layout.

This is consistent with the sketch's own observation that EVG should see an
imported SVG as a single layout element. It also keeps the symmetry the sketch
wants — `SVG → EVG` next to `TSX → EVG` — with `EVGElement` as the shared target.

The value types the IR does need are small and uncontroversial: `PathCommand`
(exists), `Matrix2D`, `Paint`, `FillRule`.

### 4.2 Put it in `gallery/evg/`, not a new tree

`gallery/evg/` is already the renderer-neutral module (`EVGElement`, `EVGLayout`,
`EVGColor`, `EVGGradient`, `EVGDisplayList`, `SVGPathParser`). The renderers live
in `gallery/pdf_writer/src/{core,raster}` and `game_engine/v2/ui`. The vector
files belong next to `SVGPathParser.rgr`:

```
gallery/evg/
  SVGPathParser.rgr     (exists — extend, keep the name: 3 importers + tests)
  VectorPath.rgr        (contours, fill rule, paint, bounds)
  Matrix2D.rgr
  VectorViewBox.rgr     (viewBox + preserveAspectRatio → element-box transform)
  SvgParser.rgr         (XML subset → EVGElement / vector display list)
  EvgBitmapTracer.rgr   (bitmap → path; Potrace-style params for benchmarking)

gallery/pdf_writer/src/raster/
  VectorRasterizer.rgr  (extracted from RasterText)
```

Keeping the `SVGPathParser.rgr` filename matters: three files import it by
relative path and one is outside `pdf_writer`. Renaming it is a separate,
mechanical commit if wanted at all.

## 5. Staging

Ordered so that each stage lands something visible and nothing depends on a
stage that has not shipped.

### Stage 0 — Make the renderers agree — **DONE**

The highest value per line of code in the whole plan.

1. ✅ `Q` → cubic in `EVGPDFRenderer` now uses exact degree elevation (§2.3).
2. ✅ `gallery/evg/VectorViewBox.rgr` — `Matrix2D` plus one implementation of
   the SVG viewBox / `preserveAspectRatio` rule.
3. ✅ PDF resolves through it and emits the result as a `cm` matrix, with path
   commands left in user units; `getScaledCommands(w, h)` is no longer on the
   render path.
4. ✅ HTML asks the same class which viewBox applies and emits it, so the
   browser applies the identical rule.
5. ✅ `bash gallery/pdf_writer/test/run_vector.sh` (`npm run test:evg:vector`).

**One behaviour change worth knowing about.** No document in the repo sets
`viewBox` on a `<Path>` — every one relies on the art being fitted to
`width`/`height`. Dropping that would have broken all of them, so the fallback
is now: *explicit viewBox wins; otherwise synthesise one from the path bounds*,
and both renderers use the same fallback. Two consequences:

* PDF no longer stretches non-square art — the fit is uniform (`meet`), so a
  path drawn into a box of a different aspect ratio is letterboxed rather than
  distorted.
* HTML now emits the synthesised viewBox where it previously emitted none, so
  the browser fits the art instead of drawing it at 1:1 in the corner.

Both moved toward each other, and toward what the documents were clearly asking
for. Verified end to end: on the same fixture, PDF emits `2 0 0 2 -20 -20 cm`
where HTML emits `viewBox="10 10 30 30"` — the same transform expressed twice.

### Stage 1 — Path completeness — **DONE**

1. `S/s`, `T/t` (smooth cubic/quad, reflected control point).
2. Implicit command repetition in the parse loop.
3. **Fail loudly**: unknown command letters and trailing garbage must be reported
   (a warning list on the parser), never silently skipped. Today's behaviour is
   the worst kind — wrong output, no signal.
4. `A/a` arcs: parse, then normalise endpoint → centre parameterisation and emit
   cubics **in the IR**, so PDF, raster, HTML and WASM all get arcs from one
   implementation. (The PDF renderer currently has no `"A"` branch at all, so an
   arc would vanish silently.)

### Stage 2 — Contours and the shared rasterizer — **DONE**

1. ✅ `flattenRings` returns **rings** and applies the transform while
   flattening, so curves are subdivided at the size they are drawn.
   `PathRing` is the unit; `flatten()` is kept for its existing callers and
   documented as unable to express more than one contour.
2. ✅ `VectorRasterizer` extracted from `RasterText`: `VectorEdge`, `addRing`,
   `fillAA(rule)`, with even-odd alongside non-zero.
3. ✅ `RasterText` feeds glyph contours into it. Verified by rendering a text
   page before and after the refactor: **byte-identical PNG**. The duplicate
   non-AA fill path in `RasterText` (`renderGlyphFast`, `scanlineFill` and
   their helpers, all unreachable) went with it — leaving it would have left
   two fills to drift apart, which is what the stage exists to prevent.
4. ✅ Raster `<Path>` support, fill and stroke → closes **PNG 0.9**.
5. ❌ `UIContext.fillPolygon` — see the note below.

Note on scope: **fill was nearly free, stroke was not.** As predicted, fill came
out of the extraction almost unchanged, while stroking needed its own answer.
Shipped as the approximation described above: one quad per flattened segment
plus a disc at each joint, merged by the non-zero rule, giving round joins and
butt caps. It is indistinguishable from a real stroke at icon weights and
visibly an approximation for very thick strokes with sharp corners, where a
mitre would run to a point. PDF and HTML stroke natively, so only raster carries
it. Real offset curves remain the eventual answer.

**What did not land: the WASM UI still has its own fill.** `UIContext` paints
into `SoftCanvas` (`game_engine/v2/framebuffer.rgr`) while the rasterizer works
on `RasterBuffer` (`pdf_writer/src/raster`). Sharing the code needs either a
buffer abstraction or a cross-gallery dependency, and that is a design decision
worth making deliberately rather than as a side effect of this stage. The
shapes `WasmUiSelect` draws today are single-ring chevrons and check marks, so
it has no live defect from the missing hole support — but it does still lack
anti-aliasing, and `flatten()` is still what it calls.

### Stage 3 — Shape normalisation — **DONE**

`gallery/evg/VectorShapes.rgr`: `rect` (with SVG's rx/ry rules), `circle`,
`ellipse`, `line`, `polyline`, `polygon` → `PathCommand[]`, plus `asPathData`
to go back to a `d` string. Pure functions, no renderer changes, no state.

Curves come out as cubics using the exact kappa rather than arcs, so consumers
need no arc conversion. Checked geometrically — sampled points on a circle must
lie on that circle, which is what would catch a wrong kappa where endpoint
comparisons never would — and round-tripped: emit a shape as path data, parse
it back with `SVGPathParser`, confirm the geometry survived. That last one
exercises the writer and the reader against each other and is what makes the
emitted `d` safe to hand to a browser.

**What this makes redundant, as a follow-up.** Three hand-rolled versions of
the same geometry now exist alongside the derived one:

| Duplicate | Where |
| --- | --- |
| `drawRoundedRectPath` | `EVGPDFRenderer.rgr:1966`, 7 call sites, with kappa truncated to `0.5523` |
| `fillRoundedRect` / `drawRoundedRect` | `RasterPrimitives.rgr:93`, `:129` |
| `fillCircle` / `fillEllipse` | `RasterPrimitives.rgr:170`, `:326` |

Routing them through `VectorShapes` is the obvious cleanup, and it is
deliberately NOT part of this stage: `drawRoundedRectPath` works in PDF's
y-up space and is used for clipping as well as filling, so the winding
direction of the replacement matters, and no golden test currently covers
border-radius output. Worth doing with a rendering comparison in hand rather
than on the way past.

A language note found here, recorded because it will bite again: **`to_int`
floors rather than truncating toward zero.** Splitting a negative number into
whole and fractional parts directly gives the wrong pair — -2.5 comes apart as
whole -3 and fraction 0.4999.

### Stage 3.5 — Chart primitives — **DONE**

Not in the original plan. These came out of asking what a chart engine would
need on top of the vector layer, and each turned out to be a gap the layer had
rather than something a chart library could paper over.

1. ✅ `PathBuilder` — the counterpart to the parser. A chart's geometry comes
   from data, and without this the only way to draw it is to concatenate `d` by
   hand and hand the result straight back to the parser. The basic shapes are
   included, so a whole scene accumulates into one path with one fill.
2. ✅ `stroke-dasharray` / `stroke-dashoffset` in all three targets, parsed
   once in `VectorStroke`. Gridlines.
3. ✅ `rotate` rendered. It had been parsed into `EVGElement` all along with no
   renderer reading it, so a rotated axis label was silently upright. The
   rasterizer takes a transform, which is what makes it work for glyphs and
   paths through one implementation.
4. ✅ Rectangular clipping in the raster target, so a series stops at the plot
   area. PDF and HTML already clipped; only raster leaked.
5. ✅ `opacity` in the raster target, per element rather than per group.

**Found on the way, and worth knowing.** `to_string` reaches for exponential
notation on very small magnitudes — `cos 90°` is `6.123233995736766e-17` — and
**PDF real numbers have no exponential form**. That was going into content
streams, where a viewer is within its rights to reject the whole thing. Now
clamped, with the gate asserting no exponent ever reaches the stream.

**What is left of this group.** Opacity in the PDF target needs an ExtGState
resource threaded into the page dictionary in two code paths. It is the most
delicate part of the PDF writer and nothing golden-tests its structure, so it
was left rather than done in a hurry.

Also still per-target rather than shared: rotation applies in raster to what
goes through the rasterizer — text and paths. Rectangular backgrounds come from
`RasterPrimitives` and stay upright. Routing those through `VectorShapes` is the
same follow-up Stage 3 already records.

### Stage 4 — `SvgParser` and the `<Svg>` element — **DONE**

`gallery/evg/SvgParser.rgr` reads an SVG document into the vector layer, and
`<Svg src="logo.svg">` draws one in a TSX document. It is the only file in the
tree that knows any XML.

**What comes out is a flat list, not a node tree.** `SvgVectorItem` is resolved
geometry plus resolved paint, and the whole document is a `[SvgVectorItem]`.
Two decisions make that possible and both are worth stating, because they are
the reason the renderers needed almost no new code:

* **Transforms are baked.** Every enclosing `transform` is applied to the
  commands as they are produced, so an item's geometry is absolute in the
  document's own user space. An affine map takes a cubic to a cubic, so this
  approximates nothing — and it means a renderer needs no transform stack, no
  group traversal and no state machine. It draws a list.
* **Paint is resolved.** Inheritance down groups, `fill="none"`, the three
  opacity properties, `style` outranking presentation attributes: all settled
  once, in the importer, so the three renderers cannot come to different
  conclusions about what colour a shape is.

**The element reuses the path type rather than adding one.** An imported
drawing is laid out, sized and positioned exactly like a `<Path>`, so a new
`elementType` would have meant a second copy of that in the layout engine and in
all three renderers with no behavioural difference. `EVGElement.svgSource`
carries the markup; `<Svg src>` is resolved relative to the document that names
it, in `JSXToEVG.parseFile`, which is the one place that touches the filesystem
— `SvgParser` itself never opens anything, which is what keeps §8's "no network
or filesystem access from inside the parser" true by construction rather than by
review.

**HTML goes through the IR too, and this is the load-bearing decision.** It
would have been *less* code to hand the original markup to the browser inside an
inline `<svg>` — and it would have reintroduced exactly the class of defect this
plan exists to remove, because the browser would happily draw the filters,
gradients, clip paths and live text that PDF and PNG cannot. The HTML target
therefore emits one `<path>` per resolved item, and a construct outside the
profile is missing from the preview in the same way it is missing from the
print. Out of profile has to mean out of profile everywhere, or the profile is
not real.

**In the profile:** `svg`, `g`, `a`, `defs`, `use` (same-document fragments,
including forward references and `xlink:href`), `path`, `rect`, `circle`,
`ellipse`, `line`, `polyline`, `polygon`; `transform` with `matrix`,
`translate`, `scale`, `rotate` (both forms), `skewX`, `skewY`; `fill`, `stroke`,
`stroke-width`, `fill-rule`, `stroke-dasharray`, `stroke-dashoffset`,
`opacity`, `fill-opacity`, `stroke-opacity`, and the `style` attribute carrying
any of them; the root's `viewBox` and `width`/`height`; comments, CDATA,
processing instructions and namespace prefixes.

**Refused, and reported (§7.4):** `text` — with its own sentence, because a logo
that quietly loses its wordmark is the most likely "SVG support is broken"
report — plus `script`, `style`, `image`, `filter`, `mask`, `clipPath`,
`pattern`, `marker`, `symbol`, the animation elements, gradient elements (§6),
`switch`, nested `<svg>` viewports, external `href`, unknown elements, unknown
transform functions, unreadable colours and unreadable lengths. Warnings are
deduplicated by kind, so a file with four hundred gradient fills says it once.

**Refused by construction, not by mitigation:** there is no entity machinery at
all, and a DOCTYPE carrying an internal subset — the only place an entity
declaration can appear — is a parse error rather than something parsed with the
entities left as text. That removes billion-laughs and XXE by there being
nothing to expand. Node count, nesting depth, path-command count and `<use>`
expansion depth are all capped and reported as errors rather than as an
out-of-memory.

**Found on the way, and worth knowing.** `str2double` reads `"100%"` as `100`.
A root `width="100%"` is the SVG default and means "fill the viewport" — which
for an imported drawing is a decision the hosting element makes — so reading it
as user units would have sized every default-width document by a number that
means something else entirely. Lengths are now checked to be numbers before they
are read as numbers.

**Fixed on the way past.** Two divergences the imported case walked straight
into:

* The PDF renderer had no even-odd fill: it always emitted `f`/`B`, never
  `f*`/`B*`, so `fill-rule="evenodd"` — which HTML hands to the browser and the
  raster target has honoured since Stage 2 — filled the middle of a ring in PDF
  and left it hollow in the other two.
* The HTML renderer did not rotate a `<Path>`. PDF emitted a rotation matrix and
  the raster target turned the shape on the shared rasterizer, but this renderer
  builds the inline `<svg>`'s style itself rather than going through the builder
  that carries `transform`, so `rotate` never reached it and the shape stayed
  upright.

**The element's fill is the document's initial paint.** SVG's initial `fill` is
black, and that is still the default — but when the hosting element has a fill,
that becomes the value any shape inherits when neither it nor anything above it
names one. A file that sets its own colours is untouched, because its own value
wins. This is what lets an icon set follow a theme without editing the files,
and it is the only sensible answer for `currentColor`, which otherwise refers to
a CSS property an imported document cannot see. It is also what keeps the
showcase's rule — geometry in the tree, appearance in the stylesheet — true for
files the gallery does not own.

**Four consumers, not three.** `EVGDisplayList` carries imported documents too,
so the GL/WebGL backend gets them. Leaving it out would have made a `<Svg>`
present in three targets and absent from the fourth, which is the exact failure
that file was written to prevent.

**Not in this stage.** Stroke joins and caps are not represented (the raster
stroke is butt caps and round joins, Stage 2), `preserveAspectRatio` inside an
imported document is ignored because the hosting element decides the fit, and
group `opacity` is multiplied into each child's alpha rather than composited as
a unit — overlapping children inside a faded group show through each other here
and would not in a browser. Each is reported when a document uses it.

**Showcase.** A `svg` page joins the gallery with two files that make the
distinction visible: `rosette.svg` names no colours and is painted by the theme
(and is one petal referenced eight times, so `<use>` and the baked rotations are
what is on the page), while `emblem.svg` brings its own palette, its own group
transform and an even-odd counter, and keeps all three.

### Stage 5 — Paint (flat colour only) — **DONE**

Landed with Stage 4, because paint resolution is not separable from the walk
that produces the items: `fill`, `stroke`, `stroke-width`, `fill-rule`, the dash
properties and the three opacity properties, inherited down groups and resolved
into each item. Gradient paint remains deliberately **out of scope for this
plan** — see §6 — and a `url(#…)` reference is dropped with a diagnostic rather
than rendered differently in each target.

## 6. Gradients are deferred, on purpose

`linearGradient` / `radialGradient` are dropped from the first vector profile.
Everything else in this plan comes first. The reasoning is worth recording,
because it is not just a scheduling call.

**Gradients are already the worst parity offender in the codebase.** Today the
same `background-gradient` produces three different results:

| Target | Behaviour |
| --- | --- |
| HTML | `EVGHTMLRenderer.rgr:827` — the raw CSS string is passed through verbatim; the browser interpolates, with all stops |
| Raster | `evg_png_tool.rgr:490` — only `getStartColor()` and `getEndColor()` are read; **every intermediate stop is discarded**, and `RasterGradient` does its own interpolation |
| PDF | Not implemented at all (`TODO_EVG.md` still lists Type 2 / Type 3 shading as upcoming) |

So a three-stop gradient is correct in HTML, silently reduced to two stops in
PNG, and absent from PDF. Extending that into the vector layer would multiply an
existing inconsistency across every path, and the whole point of §2 is to *remove*
this class of divergence.

**Print makes the guarantee unkeepable anyway.** Even with PDF shading
implemented, gradients are the one construct where identical output cannot be
promised: many RIPs and printer drivers rasterize smooth shading rather than
executing it, at a resolution and dither of their own choosing, and banding
behaviour then depends on the device. A flat fill survives that pipeline
predictably; a gradient does not.

**Colour management is a separate, larger axis — and it affects flat colour
too.** Worth stating explicitly so it is not mistaken for a gradient problem:

* `EVGColor` is RGBA doubles with no colour-space tag (`EVGColor.rgr:5`).
* The PDF renderer writes `rg` / `RG` (DeviceRGB) everywhere, and images as
  `/DeviceRGB`. There is no ICC profile, no `/OutputIntent`, no CMYK path.

For screen output this is fine. For print, DeviceRGB means the conversion to the
press's CMYK happens somewhere downstream, outside EVG's control — brand colours
are the usual casualty. That is a genuine gap, but it is a **document-level
colour pipeline** question (output intent, ICC, spot colours), not something to
solve as a side effect of adding gradients. Deferring gradients keeps the two
questions from getting entangled.

**When to revisit.** Gradients are visually valuable, particularly for
application UI where the raster and HTML targets dominate and print parity is
not a constraint. The natural time to come back is after Stage 2, once
`VectorRasterizer` exists: gradient paint then becomes "which colour does this
covered pixel get", a property of the shared rasterizer rather than a
per-renderer special case. Prerequisites when that happens: N-stop support in
`RasterGradient` (removing the two-stop truncation), and PDF Type 2/3 shading,
so all three targets start from the same model.

## 7. Conformance: lean on the standard, and on the browser

The profile is deliberately small, but **everything inside it should follow
SVG 1.1 semantics exactly**. Adopt the spec's *semantics*, not its *scope*.
This matters more than it sounds: it is what turns "the renderers disagree"
from a design debate into a defect with a right answer. In §2.1, PDF is not an
alternative convention — it is wrong, and the spec says so.

Three levels of conformance backing, in order of value per effort.

### 7.1 Spec-derived unit assertions (do this from Stage 0)

The parts of SVG 1.1 that are literally formulas or grammar need no images, no
browser and no rendering — they are pure functions with published expected
values:

| What | Spec source | Test shape |
| --- | --- | --- |
| Path data grammar | §8.3 BNF | path string → `PathCommand[]`, incl. implicit repeats and `S`/`T` reflection |
| Path error handling | §8.3 | malformed `d` → commands up to the error, plus a diagnostic |
| Elliptical arc | Appendix F.6.5 (endpoint → centre) and F.6.6 (out-of-range radii correction) | arc params → centre/angles → cubics, numeric comparison |
| `preserveAspectRatio` | viewBox/viewport section | (viewBox, viewport, align, meet\|slice) → `Matrix2D`, all nine align values |
| Fill rules | `fill-rule` property | self-intersecting star → nonzero vs even-odd coverage |
| Shape → path | shape sections (incl. the arc-magic-number for `rect` corners) | `rect`/`circle`/`ellipse`/`polygon` → `PathCommand[]` |

One refinement this forces on Stage 1: the spec **defines** path-data error
handling — render up to, but not including, the command containing the first
error. That is better than either today's silent skip or a hard failure. Do
both halves: truncate per spec *and* surface a diagnostic, and assert both.

### 7.2 The browser as oracle — the harness already exists

`test/browser_parity_snapshot.js` + `browser_parity_test.rgr` already implement
exactly the right pattern for this, for font metrics: Chromium establishes the
numbers **once** into a committed snapshot, and the offline gate then checks EVG
against that snapshot with no browser and no network — because, as that file
puts it, a correctness gate that can be skipped stops being one.

Extend the same mechanism to vector geometry. The browser is already in the loop
as a conformance-grade SVG implementation (the HTML renderer delegates to it),
and the useful outputs are *numbers*, not images:

* `getScreenCTM()` on a `<svg>` with a given `viewBox`/size → the exact
  viewBox transform `VectorViewBox` must reproduce.
* `getBBox()` on a `<path>` → geometry after arc/smooth-curve resolution.
* `getPointAtLength()` sampled along `getTotalLength()` → a curve fingerprint
  that catches a wrong `Q`→cubic conversion (§2.3) immediately.

This fits the existing snapshot design directly: same recorder shape, same
committed-fixture gate, no image diffing, no fuzzy comparison. `playwright-core`
is already a root dependency and Chromium is already pinned by path in the
recorder.

### 7.3 The W3C SVG 1.1 test suite — later, and curated

Tempting, but not the right backbone right now:

* It is **reference-PNG based**, so it needs a working rasterizer plus fuzzy
  image comparison — i.e. it cannot help until after Stage 2, and it brings a
  whole image-diff tolerance problem with it.
* Most of it exercises features deliberately outside the profile (text, fonts,
  filters, masks, animation). Those tests would fail for reasons that are not
  defects, so raw pass rate is meaningless.
* It carries its own licensing/vendoring question for the repo.

If it is adopted later, adopt it as a **curated subset with an explicit
out-of-profile expected-fail list**, so the number the suite reports means
something.

### 7.4 Conformance also defines what "unsupported" must look like

A restricted profile is only coherent if *not implemented* is a defined,
detectable state rather than silently wrong output. So the profile in §8 should
be enforced with the same rigour as the features: for anything outside it, the
assertion is that a **diagnostic is produced**, not that something renders. That
is what makes it safe to ship a small profile and grow it.

## 8. Profile for the first SVG version

Agreed with the sketch's subset. Explicitly out, and enforced by the parser
rather than by convention:

```
script            animation         foreignObject
external CSS      filters           masks
external refs     <use> href to external documents
```

Additions worth making explicit, because imported SVG is untrusted input:

* **No XML entity expansion.** Simply do not implement entities — that removes
  billion-laughs and XXE by construction rather than by mitigation.
* **No network or filesystem access from inside the parser.** `href` /
  `xlink:href` to anything other than a same-document fragment is dropped.
* **Hard caps** on node count, nesting depth and path-command count, reported as
  a parse error rather than an OOM.
* **`<text>` must warn, not silently drop.** Illustrator and Figma exports very
  often contain `<text>`, and a logo that quietly loses its wordmark is the most
  likely "SVG support is broken" report. Detect it and say so.

## 9. Summary

The plan's core decision — *general Vector IR, SVG as an importer* — is correct
and is the right next big EVG feature. Three adjustments to the sketch:

1. **It is half-built already.** `SVGPathParser` + `PathCommand` exist with three
   consumers. The job is consolidation and correctness, not new construction.
2. **The immediate win is agreement, not capability.** PDF and HTML currently
   disagree about `viewBox`, and the quadratic conversion in PDF is wrong. Stage 0
   is small and fixes visible defects.
3. **The raster rasterizer already exists inside `RasterText`.** Extracting it is
   cheaper than writing one and pays out in three places. The genuinely new work
   on the raster side is stroking, not filling.

Conformance backing (§7): follow SVG 1.1 semantics exactly inside the profile,
starting with spec-derived unit assertions on the pure functions, and extend the
existing browser-parity snapshot harness to vector geometry. The W3C test suite
is a later, curated addition — not the backbone.

Gradients are explicitly deferred (§6): they are the one construct where
cross-target parity cannot be promised — print pipelines rasterize them at their
own discretion — and the existing implementations already disagree with each
other. Flat colour first; revisit once `VectorRasterizer` makes gradient paint a
property of one shared fill stage rather than three separate ones.
