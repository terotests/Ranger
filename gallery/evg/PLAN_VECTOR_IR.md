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

gallery/pdf_writer/src/raster/
  VectorRasterizer.rgr  (extracted from RasterText)
```

Keeping the `SVGPathParser.rgr` filename matters: three files import it by
relative path and one is outside `pdf_writer`. Renaming it is a separate,
mechanical commit if wanted at all.

## 5. Staging

Ordered so that each stage lands something visible and nothing depends on a
stage that has not shipped.

### Stage 0 — Make the renderers agree (no new files)

The highest value per line of code in the whole plan.

1. Fix the `Q` → cubic conversion in `EVGPDFRenderer` (§2.3).
2. Add `VectorViewBox` — one shared resolver producing a `Matrix2D` from
   (`viewBox`, element box, `preserveAspectRatio`).
3. PDF uses it instead of `getScaledCommands(w, h)`; HTML keeps delegating to the
   browser but now agrees, because both implement the same spec rule.
4. Golden test: one `<Path>` document → PDF and HTML, compare geometry.

Deliverable: the same document renders the same in PDF and HTML.

### Stage 1 — Path completeness

1. `S/s`, `T/t` (smooth cubic/quad, reflected control point).
2. Implicit command repetition in the parse loop.
3. **Fail loudly**: unknown command letters and trailing garbage must be reported
   (a warning list on the parser), never silently skipped. Today's behaviour is
   the worst kind — wrong output, no signal.
4. `A/a` arcs: parse, then normalise endpoint → centre parameterisation and emit
   cubics **in the IR**, so PDF, raster, HTML and WASM all get arcs from one
   implementation. (The PDF renderer currently has no `"A"` branch at all, so an
   arc would vanish silently.)

### Stage 2 — Contours and the shared rasterizer

1. `flatten()` returns **rings**, not one flat list (§2.4), plus a fill rule.
2. Extract `VectorRasterizer` from `RasterText` (§3): `Contour`, `Edge`,
   `fillAA(rule)`; add even-odd.
3. `RasterText` feeds glyph contours into it — glyph output must be pixel-identical
   before and after; this is the regression gate for the refactor.
4. Raster `<Path>` support → closes **PNG 0.9**.
5. Point `UIContext.fillPolygon` at the same code — gains AA and holes.

Note on scope: **fill is nearly free, stroke is not.** Stroking arbitrary paths
in raster needs offset-curve geometry with joins (miter/round/bevel) and caps —
that is a genuine algorithm, not an extraction, and it is the part the original
sketch under-estimated. Suggested v1: fill exactly; approximate stroke by
emitting quads per flattened segment plus round joins. PDF and HTML get real
strokes natively, so only raster carries the approximation.

### Stage 3 — Shape normalisation

`rect` / `rounded rect` / `circle` / `ellipse` / `line` / `polyline` / `polygon`
→ `PathCommand[]`. Pure functions, no renderer changes, fully unit-testable.
This is where the sketch's "everything is a path" insight pays off.

### Stage 4 — `SvgParser` and the `<Svg>` element

XML subset → vector display list, with the restricted profile below. `<Svg
src="…">` as one `EVGElement`.

### Stage 5 — Paint

Gradients on paths. **Dependency worth flagging:** the sketch lists
`linearGradient`/`radialGradient` in the first SVG version, but the PDF renderer
does not have gradients yet — `TODO_EVG.md` still lists PDF Type 2 / Type 3
shading as upcoming work. Raster has `RasterGradient` and HTML has CSS
gradients, so a gradient-filled SVG would render in two targets out of three.
Either finish PDF shading first or accept a documented gap.

## 6. Profile for the first SVG version

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

## 7. Summary

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
