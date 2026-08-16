# Vela — a Vega-compatible visualization runtime for Ranger

Vela runs a **Vega specification** and produces a **scene**: the same charts the
Vega grammar describes, computed in Ranger rather than in JavaScript, so they
compile to every Ranger target.

It is an independent implementation of the Vega grammar's semantics, not a port
of the Vega JavaScript sources and not affiliated with the Vega project. See
[Attribution and licensing](#attribution-and-licensing).

**Status:** it draws, and it compiles what it draws, and what it draws is
compared against the reference's own renderer. Marks, scales, transforms,
signals, expressions, axes, legends and layout produce a scene that matches the
reference implementation item for item on **1844 of 1844 marks** across 46 chart
types at several sizes; the SVG it renders from that scene matches the SVG
official Vega renders on **4723 of 4723 drawn outlines and labels**, to a
quarter of a pixel; **42 of 42** Vega-Lite sources compile in Ranger and draw
the same scene as the official compiler feeding official Vega; and the EVG
backend renders that scene to **PDF, PNG and HTML** — fifty charts on seven
pages of the project's [EVG showcase](https://terotests.github.io/Ranger/evg/).
There is also a page you can [paste a specification into](#paste-a-specification-and-watch-it-draw).

Compiled to **C++** and built with `g++`, the whole chain reproduces every one of
those goldens byte for byte with no JavaScript engine underneath
([the C++ check](#the-c-check-the-javascript-is-the-host-not-the-answer)). A
`time` scale is read in a zone that is
[supplied rather than discovered](#a-time-zone-is-supplied-not-discovered), and
changing one signal
[recomputes only what reads it](#changing-one-number). See
[What is not there yet](#what-is-not-there-yet) for what remains.

```
                   Vega-Lite JSON
                         │  VlCompile — layers, facets, concatenation,
                         ▼  composite marks
                     Vega JSON
                         │
   ┌─────────────────────┴──────────────────────┐
   │                   Vela                     │
   │                                            │
   │  VlJson      spec + data as one value type │
   │  VlExpr      the Vega expression language  │
   │  VlTransform filter formula stack bin …    │
   │  VlScale     band point linear log ordinal │
   │  VlRuntime   signals → data → scales →     │
   │              encode                        │
   │  VlAxis      ticks, labels, grid, title    │
   │  VlLegend    symbols, keys, title          │
   │  VlBounds    how big a drawn thing is      │
   │  VlViewBox   how big the whole picture is  │
   │  VlScene     mark / item tree              │
   │  VlCommand   flat draw commands            │
   │  VlShape     the geometry a mark IS        │
   │  VlSvg       commands → SVG                │
   │  VlEvg       commands → EVG path data      │
   └─────────────────────┬──────────────────────┘
                         │
          ┌──────────┬───┴──────┬──────────┐
          ▼          ▼          ▼          ▼
    scene JSON    commands    SVG      EVG page
   (compared to   (text, in  (compared  → PDF · PNG · HTML
    the reference) a golden)  to Vega's
                              renderer)
```

The command layer is the seam: it knows nothing about EVG, and the EVG backend
knows nothing about Vega. Both are tested on their own — the commands as text
against a golden, the scene against the reference implementation, and the SVG
against the SVG the reference's own renderer produces.

`VlShape` sits beside the seam rather than inside a backend, and that placement
is load-bearing. The symbol outlines, wedges, curves and rounded rectangles used
to live in the EVG backend, and while they did, that backend drew every symbol
that was not a square as a circle and every curve as straight segments. Nothing
could tell, because the scene said `shape: "diamond"` and the scene was what was
being compared.

## Paste a specification and watch it draw

```bash
npm run vela:web        # build gallery/vela/web/dist
python3 -m http.server -d gallery/vela/web/dist
```

One HTML file and one compiled script. Paste Vega or Vega-Lite, press Render,
and what appears is drawn by `gallery/vela/src/*.rgr` — the runtime, the
Vega-Lite compiler and the SVG renderer, compiled to JavaScript by the same
toolchain that compiles them to C++. The page also shows the Vega a Vega-Lite
specification became, which is most of what a playground is for.

Its own data is beside it. A relative `data.url` is looked for in `web/data`
first, and those files carry the names the published examples ask for —
`data/cars.json`, `data/seattle-weather.csv` — with the same columns and
entirely invented numbers (`node gallery/vela/web/make-data.mjs`). An example
copied off the Vega site therefore draws with no network and without this
repository depending on someone else's server. Which source was used is
reported on every chart, because a plausible chart of Seattle weather that is
not Seattle's weather would be a worse outcome than no chart at all.

Two more things about it are deliberate:

* **The page fetches, the runtime does not.** A `data.url` is loaded and parsed
  by the page and handed to the runtime as values, because the runtime has no
  loader and should not grow one — it compiles to eight targets, and seven of
  them have no idea what a URL is. A relative url resolves against the Vega
  editor's own data directory, so an example copied from the Vega site works as
  pasted.
* **What it will not draw, it says.** A transform Vela does not have comes back
  as `the transform 'density' is not compiled here` rather than as a chart with
  a line missing from it. A blank pane and a wrong chart are the same thing to
  whoever is looking at it.

### The same chart, four ways

The other tabs are not other views of the SVG. They are the other backends,
reached from the same scene:

| tab | what draws it |
| --- | --- |
| **Chart** | Vela's own SVG renderer, `VlSvg.rgr` |
| **WebGL** | the EVG page → `JSXToEVG` → stylesheet → `EVGLayout` → display list, drawn as GPU quads by `gallery/evg/gl/evg-webgl.js` |
| **PNG** | the same layout, filled by `EVGRasterRenderer` and deflated by `PNGEncoder` — finished image bytes, computed in Ranger |
| **PDF** | the same page through `EVGPDFRenderer`, faces embedded; the browser only displays it |

`tools/vela_targets.rgr` is what makes the last three reachable from a page.
The one concession it makes to running in a browser is fonts: the layout
measures with the real TrueType faces and the loader that would read them off
disk has no disk, so the page fetches the `.ttf` files and hands the bytes to
`addFont`. Everything else — parsing, styling, layout, filling, encoding — is
the same code the CLI tools run.

That makes the page a comparison rather than a demonstration. Four renderers
that agree on where a bar's corner is are four renderers reading one scene; one
that disagrees has a bug, and it is visible by clicking between two tabs.

`node gallery/vela/web/smoke.mjs` opens the page in a real browser and checks
every path: Vega in, Vega-Lite in, a fetched url, a refusal, and each of the
three other backends producing what it claims to — quads and text runs on the
GPU, PNG bytes the browser will decode, and a PDF. The page is the one part of
this that a CLI cannot check — it depends on a browser loading a compiled
script and on that script having no `require` left in it, and both fail as an
empty pane rather than as an error.

## Try it

```bash
bash gallery/vela/tests/run.sh          # build, unit tests, goldens, parity
bash gallery/vela/tests/run_cpp.sh      # the same goldens, from a C++ binary
node gallery/vela/tools/reference/render.mjs  # the DRAWING, against Vega's renderer
node gallery/vela/tools/reference/zones.mjs   # a time axis, in eight zones
npm run vela:compiler                  # Vega-Lite, compiled in Ranger
```

```bash
# a scene from an unmodified Vega-Lite-compiled spec
node gallery/vela/bin/vela_scene.js gallery/vela/tests/specs/bar.vg.json

# the same chart as drawing commands
node gallery/vela/bin/vela_commands.js gallery/vela/tests/specs/bar.vg.json

# and as a drawn page: regenerate the showcase's charts, then render them
npm run vela:showcase && npm run showcase
```

```
rect x=0.5 y=0.5 w=180 h=300 stroke=#ddd strokeWidth=1   ← the frame, on the
group-begin                                                  half pixel so its
                                                             stroke stays crisp
group-begin
line x=0.5 y=300.5 x2=180.5 y2=300.5 stroke=#ddd strokeWidth=1     ← grid
…
line x=10.5 y=300.5 x2=10.5 y2=305.5 stroke=#888 strokeWidth=1     ← tick
text x=9.5 y=307.5 size=10 align=center text=A                     ← label
line x=0.5 y=300.5 x2=180.5 y2=300.5 stroke=#888 strokeWidth=1     ← domain
text x=90.5 y=321.5 size=11 align=center text=a                    ← title
group-end
rect x=1 y=216 w=18 h=84 fill=#4c78a8                              ← the bars
rect x=21 y=135 w=18 h=165 fill=#4c78a8
…
group-end
```

The scene's root item also carries `viewWidth`, `viewHeight`, `originX` and
`originY`: how big a canvas to make and where to put the plot inside it, once
the axes have said how much room their labels and titles need. A backend reads
those four numbers and never has to know what an axis is.

## How correctness is established

Every number in a chart — where a bar starts, how wide a band is, which values
an axis would label — is a decision with a right answer, and the reference
implementation is the one that defines it. So Vela is not tested against
hand-written expectations. It is tested against **official Vega**:

```
              a Vega-Lite example
                       │
              official vega-lite
                       │
                 Vega JSON  ────────────┐
                       │                │
              official vega          Vela
                       │                │
             view.scenegraph()      VlScene
                       │                │
                       └───── diff ─────┘
```

`tools/reference/parity.mjs` runs both over the same spec and compares every
channel of every item. `tools/reference/compile_specs.mjs` generates the specs
themselves with the official compiler, so the inputs cannot drift into
something convenient either.

### And then the drawing, because a scenegraph is not a picture

A scenegraph says `shape: "diamond"`, `baseline: "middle"`, `interpolate:
"basis"` and stops. It takes a renderer to say what a diamond looks like, where
a middle-baselined label's glyphs actually sit, and which curve joins eight
points. All of that lived below the comparison, checked only against this
repository's own golden files — and a golden file pins what *changed*. It can
never tell you that what you drew was wrong from the start.

So the reference renders to SVG, Vela renders to SVG (`VlSvg.rgr`, `vela_svg`),
and `tools/reference/render.mjs` puts both documents through **one** parser:

```
                 Vega JSON
                  │      │
       official vega     Vela
                  │      │
          view.toSVG()   vela_svg
                  │      │
                  └ diff ┘        outlines and text anchors, in page pixels
```

Shapes are not compared as path strings — the reference writes a circle as two
elliptical arcs and Vela writes it as four cubics, and those are the same
circle. Each outline is flattened and the two are compared by **symmetric
Hausdorff distance**, point to nearest *segment*: the furthest either outline
strays from the other, independent of where a path started or which way round
it went. The tolerance is a quarter of a pixel, so it means something.

The first run of it disagreed on 704 of 3004 drawn primitives, in ways the
scene comparison had no way to see — see the table below. It now agrees on all
of them, and `run_cpp.sh` requires the native binary to produce the same SVG
byte for byte.

Four specs exist only to be drawn, because a harness proves nothing about a
path nothing takes: `symbol_shapes` (all twelve builtin shapes),
`curves` (all nine interpolations), `paint_channels` (dashes, corner radii,
stroke caps, fill and stroke opacity apart) and `text_placement` (every
alignment, baseline, nudge and angle).

Every spec under `tests/specs` is compared, **including the smaller copies the
showcase draws**. Those are the same charts at the size a printed page needs,
and size is what the awkward parts of an axis depend on: which labels collide,
which tick lands on a half pixel, whether the last label is close enough to the
end of the scale to be pulled inside it. Four of the defects in the table below
were sitting in specs the comparison did not reach until the showcase pages
brought them in.

The reference is an **optional** dev dependency. Without it the parity step says
that nothing was compared and the rest of the suite still runs — a silent skip
would read as a pass.

### And a suite of chosen charts is not coverage

Everything above holds Vela to a quarter of a pixel on `tests/specs`. That is a
strong statement about those forty-four charts and **no statement at all** about
any other: they were chosen, and a suite that contains only what already works
cannot tell you what does not. Pasting specifications into the page found seven
real defects in an afternoon, one paste at a time, which is what a missing
measurement feels like from the outside.

`tools/reference/coverage.mjs` is the measurement. It runs the **official
Vega-Lite gallery** — every example on the Vega-Lite site, vendored under
`tests/corpus/specs` — through both implementations and gives each one a
verdict:

```
npm run vela:coverage              # what works, what does not, and why
npm run vela:coverage -- --fetch   # first run: get the data sets
npm run vela:coverage -- --verbose bar_layered_transparent
```

| verdict | meaning |
| --- | --- |
| `same` | the two SVGs agree, ink for ink, through the same comparison `render.mjs` uses |
| `differs` | both drew; they are not the same picture |
| `refused` | Vela said what it could not do, and drew nothing |
| `crashed` | it threw, or produced something that is not an SVG |
| `skipped` | the data is not available, or the reference would not draw it either |

The output that matters is the last part: **causes, ranked by how many examples
each one blocks**. That is an implementation queue ordered by the only measure
worth having — how much of the real corpus each missing piece would unlock —
and it makes a claim of progress checkable rather than anecdotal.

Where it stands, and it is worth stating plainly rather than rounding up:

| | first run | now |
| --- | --- | --- |
| drawn exactly as the reference draws them | 11 | **35** |
| drawn, but not the same picture | 106 | 102 |
| refused, with a reason | 58 | 38 |
| crashed | 0 | 0 |
| skipped (no data, or the reference refused it too) | 13 | 13 |
| **of what it was asked to draw** | 6.3% exact, 66.9% drawn | **20.0% exact, 78.3% drawn** |

Every one of those twenty-four came from the report rather than from a guess,
and several were things the curated suite could not have found: no axis in it
reaches a thousand, so nobody noticed that thousands were not grouped; none of
its legend labels is long enough to be truncated, so nobody noticed that a
label overhanging its limit made the plot narrower; none of its data files
writes a date as "Jan 1 2000", so the parser only ever read ISO; and every one
of its channels states its type, so nobody noticed that an untyped one was
read as a quantity instead of a category.

The remaining hundred are a long tail rather than a wall. Most come out within
a few pixels of the reference and differ for their own reason — a rounding
rule here, a guide default there — which is what a coverage report is for:
without it, each of those would be found one paste at a time.

The specs are vendored because they are small and change rarely; the data is
not, because it is eight megabytes of somebody else's numbers. Both
implementations are handed the same rows, so no comparison depends on which
copy is on disk — but a comparison cannot run without one, and those examples
are reported as `skipped` rather than quietly passed.

Coverage is a measurement, not a gate: it exits 0 whatever it finds, because
the number going down is the news. `render.mjs` is the gate.

```bash
npm install --no-save vega vega-lite
node gallery/vela/tools/reference/parity.mjs
```

### Where the reference already caught Vela being wrong

Each of these was found by the harness, not by reading the spec:

| What was wrong | What the reference does |
| --- | --- |
| A scatter plot's points were the wrong size | `config.style.point` supplies size 30 and stroke width 2; the spec says only `"style": ["point"]` |
| A line joined its points in data order | `"sort": {"field": "x"}` orders a mark's *items*, not its data |
| A stacked bar's segments were in the wrong order | `stack` accumulates in the sort order while the tuples keep their identity |
| A histogram's bars were mirrored | a rect written from its far corner is normalised so its size is never negative |
| A grouped bar's columns overlapped | a channel's `offset` may itself be a whole scaled channel |
| Filling in a default colour broke a stroked mark | a mark that encodes *either* fill or stroke gets *neither* default |
| Tick marks sat on fractional pixels | tick positions are rounded (`tickRound`); label positions are not |
| Axis labels drifted half a pixel | the axis group is offset half a pixel so its rules stay crisp, and a label on a discrete scale takes that half pixel back |
| Grid lines ran the wrong way | a grid line follows the *crossing* scale's range, so an inverted y range and an ascending band range draw in opposite directions |
| Every second y-axis label vanished | the overlap test compared one-sidedly, and a y axis runs downward |
| An axis read 0, 0.5, 1 | a tick *set* shares one precision, chosen from its step: 0.0, 0.5, 1.0 |
| A binned histogram invented its own ticks | a binned scale is labelled at its bin boundaries |
| Every symbol was drawn an eighth too big | `size` is an area, but the circle vega draws in it has radius `sqrt(size)/2`, not `sqrt(size/PI)` |
| A pie came out inside a box | a chart with no plotting frame carries `style: "view"` — transparent, and *not* the `cell` style's border |
| A legend could have been drawn in the wrong corner and still "matched" | the harness walked through group marks instead of comparing them, and a group is what holds the coordinates |
| A grid line drawn at `gridOpacity` faded the whole line | the opacity of a *stroke* is `strokeOpacity`; `opacity` stays at 1 |
| A log axis printed ten labels on top of each other | `labelOverlap` is `"greedy"` there, not `true` — hide each label that runs into the last one KEPT, since halving drops the readable ticks and keeps the crowded ones |
| The last label of an axis was pulled inside the plot when it did not need to be | `labelFlush` is a threshold in PIXELS, and `true` means one pixel — not "the first and last label" |
| A band tick sat one pixel right of its own label | ticks and labels share the axis group's half-pixel offset; only the label was taking it |
| A heat map of a count came out uniformly pale | a domain with no width maps every value to the MIDDLE of the range, not to zero — "all the same" is not "all lowest" |
| A point-scale axis was half a pixel out | only a BAND takes back the half pixel the axis group is offset by; a point scale's own positions are not whole numbers, so there is none to take |
| An axis reserved room for a label it had hidden | the widest label is the widest DRAWN one, measured after the overlap pass |
| An axis thinned to two labels dropped its own last one | when parity halving has got an axis down to two labels or fewer, the reference gives up the last SURVIVOR and shows the last LABEL — two labels that are not the ends of the scale do not read as one |

### And what the RENDERER comparison caught, which none of the above could

The scene was right in every one of these. The picture was not.

| What was wrong | What the reference does |
| --- | --- |
| **Forty-two of the eighty charts were a different size than the reference's**, one of them by fifteen pixels | a view is sized from the BOUNDS of everything drawn, not from what the axes asked for. A bottom axis' last label sticks out to the *right*, and its extent only ever described how far it reached *down* |
| An axis' domain line made every page a pixel taller | an axis contributes the box its TICKS and LABELS occupy, squared off against the scale's range. The grid and the domain line are drawn but do not get to grow the page |
| Every framed chart's border was a blurred two-pixel grey | a stroked group is nudged half a pixel, so a one-pixel line lands inside a row of pixels instead of straddling two |
| Every symbol that was not a circle or a square **was drawn as a circle** | there are twelve builtin shapes, and a diamond legend key beside diamond-less points is a chart that lies about its own data |
| Every curve was drawn as straight segments | nine interpolations, of which `basis`, `cardinal`, `catmull-rom`, `monotone` and `natural` are real splines — and `monotone` is a claim about the data, not a matter of taste |
| A rounded bar had square corners | `cornerRadius`, per corner, clamped to half the shorter side |
| A dashed grid line came out solid | `gridDash` was read from the spec and stored nowhere. The scene comparison could not see it either: a dash is an ARRAY, and arrays were skipped along with the back-references |
| A translucent fill inside a solid outline was drawn washed out | `fillOpacity` and `strokeOpacity` are separate channels; EVG carries one opacity per element, so the shape is written twice rather than averaged |
| The page was painted white when the spec said `"background": null` | a background is a rectangle the specification asked for, not a default |
| A `stroke-cap: square` rule was measured as if it were butt | a square cap reaches `sqrt(2)/2` of the stroke width past the end |

### And what pasting a specification into the page caught

The playground is a harness too — it is the only one whose input is whatever
somebody happens to try. Every one of these came from a chart copied off the
Vega site:

| What was wrong | What the reference does |
| --- | --- |
| A spec-level `transform` array **was read by nobody** | a filter that removed half the rows simply did not happen, a calculate never added its field, and nothing was reported. `filter` and `calculate` are compiled now; the rest refuse by name |
| An explicit `width` was ignored on a chart with a discrete axis | a declared size is not a suggestion: the scale spans it instead of deciding it. A six-category bar chart asked to be 180 wide came out 20 |
| A channel's own `scale` was ignored | `{"scale": {"domain": […], "range": […]}}` is how anyone fixes the order of a stack or gives a series its colours. The colours were right for the wrong categories |
| A stack was ordered alphabetically | a declared domain orders the stack, through an `indexof` over it — and that field has to be grouped by as well, or the aggregate throws it away before the sort can read it |
| `timeUnit` refused outright | it is a substitution, not a floor: the fields the unit does not name come from a fixed reference year, which is what puts every March on the same bar |
| A band axis of instants formatted them in UTC | a scale carries the chart's zone whether or not it is a `time` scale — a Helsinki January was labelled December |
| An axis `format` given as a `{"signal"}` read as the empty string | the official compiler writes `timeUnitSpecifier([…])` there rather than the `"%b"` it evaluates to, so the axis came out with four blank labels |

Two of them were bugs in the harness itself, found the same way: it flattened
curves at a fixed resolution, so a 300px arc read as three quarters of a pixel
wrong when it was exact; and its SVG parser never captured text content, so for
its first run it silently compared no labels at all.

## Compatibility

Measured by `tests/run.sh`: does the mark geometry match the reference?

| Chart | Spec | Marks match |
| --- | --- | --- |
| bar | `bar.vg.json` | ✓ |
| stacked bar | `bar_stacked.vg.json` | ✓ |
| grouped bar | `bar_grouped.vg.json` | ✓ |
| histogram (bin) | `histogram.vg.json` | ✓ |
| line | `line.vg.json` | ✓ |
| area | `area.vg.json` | ✓ |
| scatter | `scatter.vg.json` | ✓ |
| bubble (size) | `bubble.vg.json` | ✓ |
| coloured scatter | `scatter_colored.vg.json` | ✓ |
| log scale | `scatter_log.vg.json` | ✓ |
| multi-series line | `line_coloured.vg.json` | ✓ (a faceted group per series) |
| streamgraph | `streamgraph.vg.json` | ✓ |
| time axis | `line_temporal.vg.json` | ✓ |
| heat map | `heatmap.vg.json` | ✓ (colour ramp + gradient key) |
| box plot | `boxplot.vg.json` | ✓ |
| donut | `donut.vg.json` | ✓ |
| normalized stack | `bar_normalized.vg.json` | ✓ |
| labelled bar | `bar_labelled.vg.json` | ✓ |
| faceted columns | `facet_columns.vg.json` | ✓ (trellis: headers, footers, titles) |
| concatenation | `concat_two.vg.json` | ✓ (two plots, laid out) |
| tick | `tick.vg.json` | ✓ |
| text labels | `text_labels.vg.json` | ✓ |
| pie / arc | `pie.vg.json` | ✓ |
| layered | `layered.vg.json` | ✓ (both layers) |

**970 / 970 marks**, against Vega 6.4 and Vega-Lite 6.4 — data marks, every axis
grid, tick, label, domain line and title, every legend symbol, key and title,
and the groups that place all of them, in all twenty-four charts, at the parity
size and at both of the sizes the showcase draws them.

The groups are the newer half of that number. A group carries the coordinates
that *place* what is inside it, and the harness used to walk straight through
them: a legend whose every symbol matched could still have been drawn in the
wrong corner of the page and nothing would have said so. They are compared now,
which is also what pins the legend's own size and position.

| Area | State |
| --- | --- |
| Marks | rect, rule, symbol, text, line, area, arc, path, image · group marks, with data faceted per series and axes of their own |
| Scales | band, point, linear, log, pow, sqrt, time, ordinal · `nice`, `zero`, `clamp`, `round`, `base`, `exponent`, step ranges, colour schemes and ramps |
| Transforms | filter, formula, stack (zero, center, normalize), aggregate, joinaggregate, bin, extent, impute, project, collect (unsorted) · count, valid, missing, distinct, sum, mean, min, max, median, q1, q3, variance, stdev, stderr |
| Expressions | the documented expression profile: operators, member access, calls, array and object literals |
| Signals | literal values and `update` expressions, settled against the scales |
| Data | inline `values` and `source`; a `url` is refused rather than fetched |
| Axes | ticks, grid, labels, domain, title · `tickCount`, `tickRound`, `labelAngle`, `labelFlush`, `labelOverlap`, band and binned ticks |
| Legends | symbol legends for fill, stroke, size, shape and opacity, and gradient legends for continuous colour · title, layout from the drawn bounds in either direction, the spec's own `encode` blocks, and all eight `orient` anchors |
| Layout | axis extents, view size and plot origin (`autosize: pad`) · several plots side by side, and a trellis of them — by column, by row, both at once, or wrapped onto a computed grid — with headers, footers and turned titles, placed by their full bounds (`layout`) |
| Time zones | a `time` scale is read in a **supplied** zone — roughly sixty named ones with the EU, US and southern summer-time rules, or a plain offset — never in the host's. `utc` is UTC whatever the runtime was told |
| Rendering | **EVG backend**: PDF, PNG and HTML, via `PathBuilder` path data — rect, rule, symbol, text, line, area, arc |
| Theming | colours from the spec, or from a stylesheet by class; `config.axis` and `config.style` are read |
| Dataflow | a dependency graph over signals, data, scales **and marks**: `update(signal, value)` recomputes only what reads it, and a mark nothing dirty reaches keeps the items it already had |
| Interaction | **not built** |

## Legends: a layout that measures its own ink

An axis is placed by arithmetic. Tick size plus label padding plus the widest
label is the extent, the plot is pushed in by that much, and no part of it needs
to know what was actually drawn.

A legend cannot work that way, and this is the interesting difference. Each row
is as tall as `max(ceil(sqrt(symbolSize) + strokeWidth), fontSize)` — whichever
of the symbol and the label wins — the next row starts below the previous row's
**box**, and a symbol large enough to spill above its own origin pushes its row
down by the spill. In a size legend, whose symbols grow down the column, that is
five different row heights and five different gaps, none of which is a constant.

So `VlBounds` answers the question the axes never had to ask: how much room does
this drawn thing take. Two of its numbers are worth knowing because both are
surprising, and both come from the reference rather than from first principles:

* a line of text is `fontSize` tall — not the line height — and its top edge
  sits at `baselineOffset − round(0.8 × fontSize)` from the anchor;
* vega's own circle has radius `sqrt(size)/2`, not the `sqrt(size/PI)` that
  would give it the stated area, and a stroked path is expanded by the *miter*
  allowance (four half-widths), not by half a stroke width.

The second one was a rendering bug here as well as a layout one: every symbol
this backend drew was an eighth too big, on every scatter plot, until a legend
symbol had to agree with the mark it stands for.

The spec's own `encode` block is applied to the symbols and labels *before*
anything is measured, because it changes what there is to measure — a legend
that strokes its symbols makes every row taller.

## A log axis prints fewer labels than it draws ticks

A log scale's ticks are every whole multiple inside each decade — 10, 20 … 90,
100 — so a domain of two decades has twenty of them and nowhere near room for
twenty labels. The reference does not thin the ticks; it thins the *labels*,
keeping the ones near the front of each decade and blanking the rest. On
[10, 100] with room for eight, 10 through 80 are printed and 90 is not.

The test is d3's, and the surprising half of it is that a value just below a
power of the base counts as the *ninth* step of the decade below rather than
the first of its own: 90 divided by its nearest power is 0.9, which is folded
up to 9, and 9 is one too many. Getting that backwards prints every label or
none.

The labels themselves are grouped rather than abbreviated — a thousand is
"1,000", not "1k" — and the domain nices to whole powers of the base, because
there is no even step to round to. `[19, 91]` becomes `[10, 100]`, and a domain
reaching below one nices *downward*, never to zero, which a log scale cannot
reach.

## Drawing: the EVG backend

`VlEvg` turns the command list into an EVG document, which the existing tools
render to PDF, PNG and HTML. It became possible when EVG's vector layer landed:
`PathBuilder` takes computed geometry and produces path data that one parser
reads on every target, which is exactly what a chart is.

Two decisions are worth knowing about:

**One path per run of the same paint.** A chart's eleven grid lines share a
colour and a width, so they become one `<Path>` with one `d`, not eleven
elements. Only *consecutive* commands merge, so the drawing order survives —
grid under bars under labels. A bar chart with axes comes out as six paths and
twenty-two labels.

**Colour can come from the specification or from a stylesheet.** By default a
chart carries its own colours, written as `fill` and `stroke` attributes — the
specification decided them and a chart drawn on its own should look like the
chart it describes. In class mode (`useClasses`) the writer emits class names
instead: `chartFill0`, `chartStroke0`, `chartGrid`, `chartLabel`, `chartTitle`
and so on, with series numbered in the order the chart draws them. A data mark
that is TEXT gets `chartText0` and a `color` rule rather than a `fill` one,
because `fill` styles a shape and a label is not one. The
specification's colours are then written out as an unscoped stylesheet, so they
remain the default, and a theme's scoped rules override them. That is how the
showcase renders one generated page in three palettes without regenerating it.
Only colour moves: stroke widths, opacities and every coordinate stay in the
tree, because they were computed from the data and are not a matter of taste.

**Text is placed by a box and an alignment.** A label is given a box wide enough
for its string and told which edge of it the anchor is; the renderer's own font
metrics then decide where inside that box the glyphs sit, so nothing here has to
know how wide the text really is. The same box is what makes a turned axis title
land correctly — all three targets rotate about the element's box centre.

That design did not work at first, and the reason was in EVG rather than here:
an absolutely positioned element's size was never computed. `layoutChildren`
called `layoutAbsolute`, which sets x and y and nothing else, so
`calculatedWidth` stayed 0 for every one of them — a label had no box for
`text-align` to align in, a rotation "about its centre" turned about its left
edge, and the HTML target was not rotating labels at all. Charts are what
surfaced it; the fix is in `EVGLayout` and `EVGHTMLRenderer` and applies to
anything absolutely positioned.

Two more of the same kind turned up once the charts were on a page, and both
were HTML-only — the PDF and PNG of the same document were already right.
Every coordinate the layout computes is a page coordinate, but the renderer
believed an absolute element's were already relative to its parent and left
them alone, so the browser applied the parent's offset a second time and every
path and label sat tens of pixels down and to the right of its box. And a path
with no fill was emitted as `fill="currentColor"` — the inherited text colour —
which filled each plot frame and gridline solid black. `run_vector.sh` now
checks both on a fixture built for them.

Two pages of the showcase are generated: **Charts**, the six types most people
mean by the word, and **Chart types**, the rest — and the features only some
charts have, which is what makes it worth having as a page of its own. A size
legend whose rows are all different heights, a stroke legend, a log axis that
labels only some of the ticks it draws, two marks sharing one plot, and text as
a mark.

```bash
npm run vela:showcase     # -> pages/charts.tsx, pages/plots.tsx + their CSS
npm run showcase          # -> PDF, PNG and HTML in three palettes
```

Both pages are committed with their stylesheets, so the Pages build renders them
like any other page and does not need the Vela toolchain. They follow the
gallery's own rule — the tree says what is drawn, the stylesheet says how it
looks — so the same fourteen charts come out in **Editorial**, **Studio** and
**Autumn**, and with no chart theme at all they come out in the colours their
specifications asked for.

The second page paid for itself before it was finished: four defects had been
sitting in charts that only differ from the parity specs by being smaller, and
they are the four at the end of the table above.

## What else the example gallery would need

The Vega-Lite example gallery has a hundred-odd charts. `tools/reference/triage.mjs`
answers the only useful question about any of them — does this runtime already
produce it, and if not, what is missing — by compiling a list of candidates
written over this project's own data, running both implementations, and
reporting `ok`, `DIFF`, `PARTIAL` or `FAILED` with the reason.

```bash
node gallery/vela/tools/reference/triage.mjs
```

**All twenty-two** candidates match the reference item for item. When the triage
was first run it was nine, and the thirteen it named as missing were built
rather than listed:

| Was missing | What it unlocked |
| --- | --- |
| Group marks with faceted data | a coloured multi-series line, a stacked area, a streamgraph |
| Plots side by side (`layout`) | horizontal concatenation |
| Continuous colour ramps, and the gradient legend one earns | heat maps, with and without labels |
| The `symbol` shape range | a shape-encoded scatter |
| `joinaggregate`, and quantile aggregates | box plots |
| Power and `sqrt` scales | radial charts |
| Time scales and a calendar | every chart with a date on an axis |
| Format specifiers past `.Nf` | a normalized stack's percentage axis |
| `stderr` | error bars |
| Trellis layout — headers, footers and titles around a grid | column faceting |

Four smaller things it found were fixed the same way: a formatted number's minus
sign is the typographic one (U+2212), a formatter with no specifier prints
twelve significant digits rather than six decimals, `{"field": {"group":
"width"}}` reads a property of the enclosing group — which is how a rule with
one axis encoded is told to span the plot — and a `scope` group's own reach is
what a legend is anchored past, so a series drawn with a wide stroke pushes its
key further out than the plot rectangle would.

Re-run it after any change: a candidate that stops matching is a regression the
committed specs might not cover, and a new candidate is a feature request with
evidence attached.

## Vega-Lite, in Ranger

Vela runs Vega. Vega-Lite is the shorthand nearly everyone actually writes, and
turning one into the other was the last thing in the pipeline still done by the
official JavaScript.

```bash
node gallery/vela/bin/vela_compile.js chart.vl.json chart.vg.json
```

Stripped of the vocabulary, a compiler is a set of decisions about defaults.
Vega-Lite says "a bar chart of `a` against `b`"; Vega has to be told that `a` is
a band scale with an inner padding of 0.1, that `b` is stacked even though
nobody asked for a stack, that the bars are `#4c78a8`, that the y axis gets a
grid and the x axis does not, and that a bar is a `rect` whose width is
`max(0.25, bandwidth('x'))`. Every one of those is a decision the reference
makes, and `VlCompile.rgr` is those decisions written down.

**How it is checked is the point.** The output is *not* held to the official
compiler's JSON — two compilers may reach the same chart by different
specifications, and comparing spellings would test the wrong thing. It is
compared by **drawing it**: the same Vega-Lite source goes through this compiler
into Vela, and through the official compiler into official Vega, and the two
scenes must agree mark for mark.

```bash
npm run vela:compiler
```

**27 of 27** — every committed Vega-Lite source compiles in Ranger and draws the
same scene, with nothing refused. Several come out as the *same specification*,
byte for byte, key order included, which was never the goal and is a good sign
about the defaults.

That covers the four ways a chart can be more than one chart:

| | |
| --- | --- |
| **Layer** | several marks over one pair of axes. The scale types have to be settled *across* the layers before any of them compiles — a text label layered over bars sits on the **bars'** band scale, and on its own would have asked for a point scale and stood in the wrong place |
| **Facet** | one chart drawn once per value, with the furniture that says which is which. The grid axes stay in the cell; the labelled x axis moves to the column footer and the labelled y axis to the row header, because those are drawn once per column or row rather than once per panel |
| **Concat** | panes side by side or stacked, sharing only the dimension that runs across the join — so every scale carries the pane's name, because two panes both have an `x` |
| **Composite** | a box plot is five marks over eight derived data sets. Quartiles are computed **twice**: joined back onto every row, so a row can be compared with its own group's hinges, and again as an aggregate, which is what the box is drawn from |

…and the single-view features that had been missing: `bin` (two transforms and
two signals, because a binned axis ticks on bin *edges*), `xOffset` (a band
scale inside a band scale), arcs, and a series-coloured line, which is not one
line — a line joins its points in order, so the rows are partitioned into a
faceted group before the shape is drawn.

**Coverage is reported, not assumed.** A specification this compiler does not
cover refuses out loud and is counted as not covered, never as passing. What is
still refused: an `errorbar`, an `errorband`, and the top-level `facet`
operator (the `row`, `column` and `facet` *channels* are built).

Four defects in the *runtime* surfaced while building it, because the compiler
asked for things the committed specs never had:

* a turned axis label was anchored by its middle instead of its end —
  `labelAngle: 270` is what a category axis defaults to, and no parity spec had
  ever used it;
* a `size` legend over an outlined mark was drawn filled;
* the JSON writer rounded every number to six decimals, which is right for a
  scene measured in pixels and wrong for a specification carrying a full turn
  in radians;
* `strfromcode` truncated a code point to a byte in **C++** — so a bin's label
  read `20 30` instead of `20 – 30`, in that target only. Fixed in the
  compiler's own C++ template, where it had been wrong for every program, not
  only this one;
* and `strlen` counts **bytes** in C++ and code units in JavaScript, so a
  negative axis label — written with the typographic minus, three bytes and one
  character — measured five characters wide and reserved sixteen pixels nothing
  was printed in. Every chart with a negative value on an axis was that much
  wider in C++ than in JavaScript. Labels are measured in characters now, which
  is the same number on every target.

## Changing one number

Computing a whole scene from a whole specification is the right shape for
drawing a chart once, and the wrong shape for drawing it again with one number
changed — a slider moved, a filter narrowed, a year picked. So the specification
is also read as a **graph**: which signal each data set's transforms mention,
which data set each scale takes its domain from, which signal each other
signal's update expression names.

```
rt.run(spec)                      the whole chart
rt.update("cutoff", 50)           the chart again, having recomputed
                                  only what reads `cutoff`
rt.flowRan                        exactly which nodes those were
```

The dependencies are read off the **parsed expressions**, not the text: an
identifier that names a signal is a dependency on it, `data('x')` is a
dependency on that data set, `scale('y')` on that scale — and a member access
reads only its object, which is what keeps `datum.width` from looking like a
dependency on the `width` signal.

Two things have to be true, and a test that checks one of them is worthless:

* **It is right.** The scene after a change must be the scene a fresh run with
  that value produces, character for character, through the same writer the
  goldens use. `tests/run.sh` puts **every committed spec** through both paths —
  set `width` to the value it already has, which dirties every scale and
  re-encodes every mark, then set a signal nothing reads, which dirties nothing
  and keeps every mark. Both have to answer the golden. The first catches
  anything accumulated and not cleared; the second catches a reused mark the
  layout failed to re-place.
* **It is shorter.** A graph that prunes nothing draws the right chart and has
  done nothing. So `flowRan` is asserted by name: in the unit test's chart, of
  ten nodes, changing `cutoff` runs the signal that quotes it, the data set that
  filters on it, the two scales that take their domains from that data set, and
  the one **mark** drawn from it — leaving the source data, the other filter,
  its scale and the mark that reads them alone.

**Marks are part of the graph.** A mark reads the data set it is drawn from,
every scale its encode block names, and every signal any expression in it
mentions; a group mark reads whatever the marks inside it read. A mark nothing
dirty reaches is not re-encoded at all — its items are the same items, and the
layout re-places them. That needed one thing from the layout: a mark's
contribution to it is remembered with the mark, so a kept mark keeps its box
too. Axes and legends are still rebuilt whichever mark changed: they are drawn
from the scales, they are cheap, and a chart has a handful of them against
however many marks its data has rows.

## A time zone is supplied, not discovered

A `time` scale is read in a wall clock, and the reference reads the clock of the
machine it runs on. A runtime that compiles to eight targets cannot do that and
should not want to: the same specification has to draw the same chart
everywhere, and "whatever the host thinks the zone is" is not an input. So the
zone is **supplied** —

```bash
node gallery/vela/bin/vela_scene.js chart.vg.json --zone=Europe/Helsinki
```

— and `tools/reference/zones.mjs` asserts that Vela told a zone and the
reference running in that zone (`TZ=`) produce the same chart, mark for mark, in
**eight zones** chosen to break a naive implementation:

| Zone | What it catches |
| --- | --- |
| `UTC` | the baseline: no rule at all |
| `Europe/Helsinki` | the EU rule, two hours east |
| `Europe/London` | the EU rule at zero, where standard time *is* UTC and the two stop being distinguishable if you were relying on the offset being non-zero |
| `America/New_York` | the US rule: west of UTC, and its transitions are stated in local time rather than in UTC |
| `America/Phoenix` | west of UTC with **no** rule, next door to one that has one |
| `Australia/Sydney` | a **southern** summer — the window wraps the new year, so the test is an OR and not an AND |
| `Pacific/Auckland` | southern, and far enough east that a day boundary is half a day from UTC's |
| `Asia/Kolkata` | a half-hour offset, which catches anything storing an offset in whole hours |

A zone here is a standard offset, what summer time adds, and the rule saying
when: the EU's (last Sunday in March to last Sunday in October, both stated in
UTC), the United States' (second Sunday in March to first Sunday in November,
stated in local time), and the two southern patterns. Roughly sixty named zones
carry those, and a plain `+05:45` works too.

**A rule is not forever**, so a zone carries **eras**: a list of
(from-year, offset, saving, rule) rows, and the one in force is the last whose
year has passed. That is what makes a chart of the 1990s right as well as a
chart of last week —

| Era boundary | What changed |
| --- | --- |
| 1996 | the European Union harmonised: the continent's clocks used to go back in **September** |
| 2007 | the United States moved **both** its dates; before that, April to October |
| 1987 | and before *that*, the spring change was the **last** Sunday in April |
| 2007 | New Zealand moved both of its dates too, from October–March to September–April |
| 2011, 2015 | Moscow spent four years an hour further east, on permanent summer time |
| 2020 | Brazil abolished summer time |

`line_historical` is six-hourly readings across the 1995 autumn change, and the
zone suite runs it in all eight zones — a runtime carrying only each zone's
*current* rule is an hour out on every one of those rows, so the test fails
loudly rather than silently.

**It is still not a zone database.** It carries the rules that have been in
force across the span a chart is normally drawn over, and it carries them as
rules; it does not carry the tens of thousands of one-off transitions the IANA
database records, and it does not pretend to. A date before the first era of its
zone is read at that era's offset.

Two things fell out of building it, and the second is the more interesting:

* **A day is not always twenty-four hours long.** Stepping a daily axis by a
  fixed span across a clock change lands an hour off the wall clock, so a day, a
  week, a month and a year all step on the *clock* and are converted back. Below
  a day the two are the same thing. Converting back asks the zone for its offset
  **twice** — the offset at the answer need not be the offset at the question,
  because the answer may have crossed the boundary the question was near.
* **An axis always labels its own end.** Six-hourly data across a clock change
  gave four labels of which no two may touch. Halving keeps the first and the
  third; the reference keeps the first and the **fourth**, because when parity
  thinning has got an axis down to two labels or fewer, two labels that are not
  the ends do not read as a scale. It gives up the last survivor and shows the
  last label instead. That was a defect in every chart, not only a dated one —
  found by putting the same chart in a different zone.

## The C++ check: the JavaScript is the host, not the answer

The parity harness cannot say whether Vela is portable, because both sides of
its comparison run in node. So there is a second suite that says it:

```bash
npm run vela:cpp        # or: bash gallery/vela/tests/run_cpp.sh
```

It compiles all three CLIs to **C++** with `-l=cpp`, builds them with the
system compiler, and requires the native binaries to reproduce the committed
goldens **byte for byte** — 24 scenes, 24 command lists, 47 specs against what
the JavaScript build says, and one whole showcase page that has to come out as
the file that is checked in. `g++` is optional; without it the step says so and
exits 0, the same way the parity step behaves without the reference.

It found a defect on its first run, and the defect is the reason the suite is
worth having:

| What was wrong | Why only C++ saw it |
| --- | --- |
| A box plot's lower hinge printed as `54.0705032704` instead of `54.5` | `formatNumber` scaled the fraction by `10^maxDecimals` into an **int**. Twelve significant digits of a two-digit number is ten decimals, so the scale is 10<sup>10</sup> — a JavaScript number holds it, a 32-bit int wraps it to 1410065408 |

Every coordinate in that chart was already correct; the geometry never reaches
the wide path. Only a *label* was wrong, in one target, on one chart — which is
precisely the class of bug a single-target suite is blind to. The scale is a
double now, and the digits are taken from the top a place at a time so no
intermediate value is ever larger than a digit.

## What is not there yet

* **Transitions that are not rules.** A zone's eras cover the rule changes; the
  IANA database also records thousands of one-off transitions — a country that
  skipped a year, a territory that changed sides — and those are not carried.
  See [A time zone is supplied](#a-time-zone-is-supplied-not-discovered).
* **Two width estimates, on purpose.** `VlText.estimateWidth` is the
  reference's canvas-free 0.8 em per character and sizes the axis extents,
  because matching the reference's layout is what the comparison measures.
  `VlText.drawWidth` is a per-character-class table measured from the faces
  this repository ships, and sizes the box a label is drawn in. Neither has to
  be exact: the box only has to be wide enough, and the alignment inside it —
  resolved by the renderer's own metrics — is what positions the string.
* **Incremental axes and legends.** A signal change re-encodes only the marks
  that read it, but the guides are rebuilt whichever one changed. They are
  cheap, so this is a deliberate stop rather than an oversight —
  see [Changing one number](#changing-one-number).
* **The rest of the Vega-Lite compiler.** All forty-two sources in the suite
  compile in Ranger — see [Vega-Lite, in Ranger](#vega-lite-in-ranger). What is
  still refused, out loud rather than drawn as something else: an `errorbar`,
  an `errorband`, the top-level `facet` operator, and every spec-level
  `transform` except `filter` and `calculate` — `loess`, `regression`,
  `window`, `fold`, `pivot`, `density` and the rest. Those were not refused
  before they were listed: a `transform` array was read by nobody, so a filter
  that removed half the rows simply did not happen and the chart looked
  entirely reasonable.
* **The time units that are not fields.** `year`, `quarter`, `month`, `date`,
  `day`, `hours`, `minutes` and `milliseconds` are computed; `week`, `isoweek`
  and `dayofyear` are refused by name. Each has a real rule and none of the
  three is a variation on the others, so a chart that asked for a week and
  silently got a month would be wrong in a way nobody would notice.
* **A rotated title can size the page a pixel differently.** The reference
  lays an axis title out by MOVING it — it bounds the title where it first put
  it and then translates the box — so the bounds it ends up with carry the
  floating-point residue of a position the title no longer has. A quarter turn
  has no exact cosine in binary, the page is sized by the CEILING of those
  bounds, and a title whose rotated extent lands exactly on a whole pixel can
  therefore tip either way. Vela computes the bounds where the title actually
  is, which agrees with the reference on every chart in the suite; it is not
  guaranteed to on a chart that sits exactly on the tie.
* **No loader.** `data.url` is refused by the runtime; the browser page fetches
  it and passes values instead. Seven of the eight targets have no idea what a
  URL is, so this belongs to the host rather than to the runtime.
* **Gradients are drawn as their own stops.** No target Vela compiles to paints
  one, so a ramp becomes one flat band per pair of stops, in the reference's own
  stop colours. The renderer comparison checks that the bands tile exactly the
  rectangle the reference filled rather than pretending the two are the same
  thing.
* **A custom symbol `shape` given as path data.** The twelve builtins are
  drawn; a shape named by an SVG path is not, and `vela_svg` says so on the
  error stream rather than drawing a circle.

## Layout

```
gallery/vela/
├── src/
│   ├── VlJson.rgr        value model, parser, canonical writer
│   ├── VlMath.rgr        ln / exp / pow, which Ranger's operators lack
│   ├── VlText.rgr        label width estimate, for axis extents
│   ├── VlBounds.rgr      how much room a drawn thing takes
│   ├── VlAxis.rgr        an axis spec becomes rules and text
│   ├── VlLegend.rgr      a legend spec becomes symbols and text
│   ├── VlEvg.rgr         the EVG backend: commands → path data
│   ├── VlExpr.rgr        expression parser (AST)
│   ├── VlExprEval.rgr    expression evaluator + scope
│   ├── VlScale.rgr       band / point / linear / log / ordinal, ticks
│   ├── VlTime.rgr        the calendar, and the zones it is read in
│   ├── VlTransform.rgr   data transforms
│   ├── VlConfig.rgr      the defaults a mark inherits
│   ├── VlScene.rgr       scene graph + canonical JSON
│   ├── VlCommand.rgr     flat draw commands (renderer-agnostic)
│   ├── VlShape.rgr       the geometry a mark IS, shared by every backend
│   ├── VlViewBox.rgr     how big the picture is, from the bounds of the ink
│   ├── VlSvg.rgr         the SVG backend — the one that is compared
│   ├── VlCompile.rgr     Vega-Lite → Vega
│   └── VlRuntime.rgr     spec → scene
├── tools/
│   ├── vela_scene.rgr    CLI: spec → scene JSON
│   ├── vela_commands.rgr CLI: spec → draw commands
│   ├── vela_svg.rgr      CLI: spec → SVG
│   ├── vela_compile.rgr  CLI: a Vega-Lite spec → a Vega one
│   ├── vela_evg.rgr      CLI: specs → an EVG showcase page
│   ├── vela_web.rgr      the same, with no file system: for the browser
│   └── reference/        the harness that compares against official Vega
├── web/                  paste a specification, see what it draws
│   ├── index.html        the page
│   ├── build.sh          compile the script beside it
│   ├── make-data.mjs     stand-in data under the example data sets' names
│   ├── data/             …and the files it writes
│   └── smoke.mjs         open it in a browser and check it drew
├── tests/
│   ├── *_test.rgr        unit tests (JSON, expressions, scales, dataflow)
│   ├── specs/            generated Vega-Lite sources and compiled Vega specs
│   ├── golden/           committed scene and command output
│   ├── run.sh            build + test everything
│   └── run_cpp.sh        the same goldens, from a native C++ build
└── bin/                  build artifacts (not committed)
```

## Why this and not "run Vega in the JS interpreter"

Both were considered. Ranger's ComponentEngine can in fact host modern
JavaScript — a probe of the features the Vega bundles need (classes,
generators, spread, destructuring, optional chaining, `Symbol.iterator`) passes
45 of 45 — so running the official bundle is a real option, and it stays useful
as the reference this project is measured against.

But a runtime written in Ranger compiles to C++, Rust, Go, Swift, Kotlin, C#,
Dart and JavaScript with no JavaScript engine underneath, and it exercises the
parts of Ranger a real application needs: immutable data at the edges, a
mutable kernel, expression evaluation, numerics, collections and cross-target
determinism. That is worth more to this repository than a hosted bundle — and
`npm run vela:cpp` turns the claim into something that either passes or fails,
rather than something the architecture diagram asserts.

## Attribution and licensing

Vela is an independent Ranger implementation compatible with the **Vega**
visualization grammar. Vega and Vega-Lite are developed by the University of
Washington Interactive Data Lab and contributors, and are licensed under the
BSD 3-Clause License; a copy is in [`VEGA_LICENSE`](VEGA_LICENSE).

* Vela is **not** affiliated with, endorsed by, or a product of the Vega
  project. The name "Vela" is this project's own.
* Parts of the implementation follow algorithms described by the Vega
  documentation and its sources — the tick algorithm, the band-scale layout,
  the bin step search, the order defaults are applied in. Those files say so
  where it applies.
* The specs under `tests/specs/` are generated by the official Vega-Lite
  compiler from inputs written here; the data in them is this project's own, so
  no upstream example data set is redistributed.
