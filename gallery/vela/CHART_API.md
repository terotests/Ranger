# A chart API for Vela — marks and channels, called rather than written

Vela runs a specification. Until now the only way to hand it one was to write
that specification out as text: a program that wanted a chart built JSON, and
`gallery/datagrid` builds twenty chart types that way, in three hundred lines of
string concatenation, quote by escaped quote:

```ranger
out = (out + ",\"mark\":\"bar\",\"encoding\":{\"x\":{" + catField + "},\"y\":{" + valueField + "}")
```

`src/VlChart.rgr` is the other front door. The same chart, called:

```ranger
def data (VlDataset.create())
data.row().str("region" "North").num("sales" 120.0)
data.row().str("region" "South").num("sales"  93.0)

def chart (VlChart.create(data))
chart.size(300 200)
chart.bar().x("region").y("sales").aggregate("sum")

def spec:VlJson (chart.toSpec())
```

Nothing underneath changes. `toSpec` answers a Vega-Lite value — the same value
the parser produces for the text above — and it goes through `VlCompile`,
`VlRuntime`, `VlScene` and out to SVG, EVG, PDF, PNG or a C++ binary exactly as
a pasted specification does.

```
        Vega JSON ──────────────┐
                                │
   Vega-Lite JSON ─→ VlCompile ─┤
                                │
   VlChart (called) ─→ Vega-Lite┘
                                │
                                ▼
                            VlRuntime
                                │
                             VlScene
                                │
              ┌────────┬────────┼─────────┬────────┐
              ▼        ▼        ▼         ▼        ▼
            SVG      EVG      PNG       PDF     C++ binary
```

## Where each idea comes from

Five libraries were read for this, and what was taken from each is worth
stating, because the parts that were **not** taken are the design:

| From | What was taken | What was not |
| --- | --- | --- |
| **AntV G2** | the fluent surface is a *writer of specifications*, not the engine; a view's encoding is inherited by its marks | G2's own runtime, its composition grammar, its animation model |
| **Observable Plot** | a channel need not state its type — the data says; a chart is four calls, not a class hierarchy | Plot's own mark set and its transform pipeline: Vega-Lite already has both |
| **Vega-Lite** | the whole vocabulary — `data`, `mark`, `encoding`, `transform` — because Vela already speaks it | nothing; this is the semantics the API emits |
| **Apache ECharts** | `dataset` as a value beside the chart rather than inside it, shared by several views | ECharts' series model and its option object |
| **Unovis** | the reading that a chart is components over one container | a component tree of its own — Vega's scene already is one |

The one idea worth spelling out is G2's, because it is what makes this an API
rather than a wrapper: **the functional surface is a layer over the declarative
spec, not a parallel implementation of it.** Every call writes into a
specification and `toSpec` hands that specification over. There is no path where
the API computes something the engine would have computed differently, because
the API computes nothing at all.

## The view carries the encoding; the marks inherit it

```ranger
def chart (VlChart.create(data))
chart.size(320 180)
chart.x("quarter").y("sales").color("region")

chart.area().markOpacity(0.35)
chart.line()
```

Two marks, one set of axes, one legend, one colour scale — the thing a
`LineChart` class and an `AreaChart` class cannot do between them. G2 supports
this directly and it is the single most useful structural idea in it.

Inheritance is resolved **here**, at emit time. What comes out is a `layer`
whose every layer carries its channels in full:

```json
{"width":320,"height":180,"data":{"values":[…]},
 "layer":[
  {"mark":{"type":"area","opacity":0.35},
   "encoding":{"x":{"field":"quarter","type":"temporal"},
               "y":{"field":"sales","type":"quantitative"},
               "color":{"field":"region","type":"nominal"}}},
  {"mark":"line",
   "encoding":{"x":{"field":"quarter","type":"temporal"},
               "y":{"field":"sales","type":"quantitative"},
               "color":{"field":"region","type":"nominal"}}}]}
```

That is deliberate. A specification that states everything is one the compiler
already handles, one that reads the same in a diff as it does in a debugger, and
one whose inheritance rules cannot drift away from the compiler's — because it
has none by the time the compiler sees it.

## A channel need not say what it is

```ranger
chart.line().x("quarter").y("sales").color("region")
```

`quarter` holds ISO dates, so it is `temporal`. `sales` holds numbers, so it is
`quantitative`. `region` holds names, so it is `nominal`. That is the whole of
the Observable Plot ergonomics and it is read off `VlDataset` rather than
guessed at: a column of ISO dates is an instant, a column of numbers is a
quantity, anything else is a name. `"2016"` on its own is **not** a date — a bar
chart of years labelled as instants puts every year on the same tick — and a
column the data does not have is not a type at all:

```ranger
chart.bar().x("region").y("profit")
; chart.errors → ["the data has no column called 'profit'"]
```

Vega-Lite would draw that chart with an empty axis and say nothing. Saying so is
the API's one original contribution to correctness, and it is possible only
because the data is here: the API holds the dataset, so it knows what is in it.

Where the data cannot answer, the caller can: `.type("ordinal")` states it, and
a `timeUnit`, a `bin` or an `aggregate` implies it.

## What it does not cover, it hands through

```ranger
def binned (VlJson.objectValue())
binned.setMember("field" (VlJson.stringValue("sales")))
binned.setMember("bin" step)
chart.bar().encodeJson("x" binned).count("y")
```

Vega-Lite is larger than any fluent surface over it. `encodeJson`,
`transformJson`, `propJson`, `scaleJson` and `configJson` write into the
specification directly, and the layer that knows says what it cannot do:

```
refused: a bin written with 'step' is not compiled here
```

A wrapper that has to grow a method before anyone can draw anything is a worse
wrapper, and a wrapper that keeps its own list of what the layer below supports
is wrong the first time that layer grows.

## The surface

**`VlDataset`** — rows as JSON objects, which is what `"data": {"values": […]}`
holds. `row()` opens a fluent row (`str`, `num`, `whole`, `flag`, `json`);
`numbers(field values)` and `strings(field values)` fill a column at a time, for
a caller that holds arrays rather than records; `fromValues(json)` takes rows
straight from the parser. `fieldType(field)` is the inference above, and
`hasField`, `count` and `toValues` are the rest.

**`VlChart`** — the view. `create(dataset)`; `size`, `width`, `height`,
`heading`, `background`; `filter(expr)` and `calculate(expr as)`; `configJson`.
The channel methods (`x`, `y`, `color`, `detail`, `encodeJson`) set the channels
every mark inherits. `errors` is what could not be built.

**Marks** — `bar`, `line`, `area`, `point`, `circle`, `square`, `tick`, `rule`,
`rect`, `arc`, `label`, `boxplot`, and `mark(type)` for anything else. Each
answers a `VlChartMark`; `latest()` answers the last one added.

**`VlChartMark`** — channels (`x`, `y`, `x2`, `y2`, `color`, `fill`, `stroke`,
`size`, `shape`, `opacity`, `theta`, `radius`, `detail`, `text`, `order`,
`column`, `row`, `xOffset`, `yOffset`), constants (`valueNumber`,
`valueString`), and `count(channel)` for the aggregate that reads no column.

Properties of the channel most recently named — the cursor — read in the order
they are thought: `.y("sales").aggregate("sum").stack("normalize")`. They are
`aggregate`, `bin`, `maxBins`, `timeUnit`, `type`, `title`, `format`, `stack`,
`noStack`, `sortBy`, `keepOrder`, `scaleType`, `scheme`, `scaleJson`,
`noLegend`, `noAxis`. `on("y")` moves the cursor back to a channel already set.

Properties of the mark itself: `filled`, `markSize`, `markColor`,
`markOpacity`, `interpolate`, `withPoints`, `innerRadius`, `cornerRadius`,
`tooltip`, and `propNumber` / `propString` / `propFlag` for the rest.

A channel names a **column**; a constant is said as a constant. `.color("red")`
meaning a column called red and `.color("#c00")` meaning paint it red cannot
both be true, and the version that guesses is the one that draws a chart nobody
asked for.

## How it is checked

Three ways, and the second and third are the ones that matter.

**Against what a person would have written.** `tests/chart_test.rgr` builds ten
charts with the API and, for each, compiles both it and a hand-written
Vega-Lite specification through `VlCompile`, comparing the Vega they produce
text for text. That comparison is blind to how the Vega-Lite was spelled and
sensitive to everything that reaches the runtime. Each built chart is then RUN,
and the number of things it draws is printed. Seventy-one checks.

Two refusals matching each other is not agreement, so the suite fails a chart
whose comparison was two refusals — the silent skip this repository refuses to
have anywhere else.

**Against the reference.** `tools/vela_chart.rgr` builds six charts by calling
the API — there is no specification text in that file — and writes each one out
twice: the Vega-Lite the API produced and the SVG Vela drew from it.
`tools/reference/chart_api.mjs` gives the first to the **official** Vega-Lite
and Vega, renders their SVG, and compares the ink through the same
`svgcompare.mjs` the renderer harness uses — outlines to a quarter of a pixel,
text by its anchor:

```
  ok       grouped    40 primitives
  ok       layered    62 primitives
  ok       margins    46 primitives
  ok       over_time  59 primitives
  ok       scatter    68 primitives
  ok       totals     34 primitives

6/6 charts built by the API draw what the reference draws
```

The comparison is on the picture rather than on the scene, on purpose: two
compilers may name a group differently and draw the same chart. The first run of
it reported 3 of 6, and the three it caught were real — see below.

**Natively.** `tests/run_cpp.sh` compiles `chart_test` and `vela_chart` to C++,
builds them with `g++`, and requires the same seventy-one checks to pass and the
same six charts to come out byte for byte identical to the JavaScript build. An
API that builds a specification is portable in a way a charting library is not,
and that is where the claim is either true or not.

```bash
bash gallery/vela/tests/run.sh                  # includes the 66 checks and the six charts
npm run vela:chart                              # write the six charts and their specs
npm run vela:chart:check                        # and hold them to official Vega-Lite
bash gallery/vela/tests/run_cpp.sh              # the same, from a native binary
```

## A page that prints the calls that drew it

`tools/vela_chart_page.rgr` writes
[`gallery/evg/showcase/pages/chart_api.tsx`](../evg/showcase/pages/chart_api.tsx),
which the EVG showcase renders to PDF, PNG, HTML and WebGL under three themes
like any other page — *Charts, called* on
[the published gallery](https://terotests.github.io/Ranger/evg/). It is the
only page there that no specification was written for.

Each chart is printed with the calls that built it, and those lines are not a
transcription: they are read out of the tool's own source at the markers around
each chart's own calls, so a changed call changes the printed line with it.
Without the source the tool refuses to write the page at all — a page claiming
to show the code that ran is worse than no page if the code is stale.

One thing had to be worked around to get there, and it is worth writing down
because anyone printing code on an EVG page will hit it: **JSX text is
tokenised as if it were code**, so a double quote in it opens a string and
`x("region")` came out as `x(region )`. A line therefore goes onto the page as
a string *literal* in an expression container — `{"x(\"region\")"}` — which is
the one place the parser keeps a quote.

```bash
npm run vela:showcase   # regenerate the page (and the specification-fed ones)
npm run showcase        # render every page to PDF, PNG and HTML
npm run showcase:gl     # …and check the GPU backend drew it too
```

## What building it found

A new front door is a harness: it reaches the engine along a path nothing else
takes. Three defects came out of six demo charts, none of them in the API.

| What was wrong | What the reference does |
| --- | --- |
| Every quarter of every year was labelled **"2016 Qq"** | `%q` is a directive — the quarter, 1 to 4 — and an unknown directive answers its own letter, so the label said nothing about being wrong. `timeUnit: "yearquarter"` compiles to the format `"%Y Q%q"`, which this formatter had never been asked for |
| A grouped bar chart 320 pixels wide drew **twenty-pixel bars** with a third of every group empty | which way round the two bands are sized depends on who decided the plot's size. Nobody having said, a sub-band is twenty pixels and the band above it is as wide as its sub-bands need; a **stated** width is not a suggestion, and then the band spans the plot and the sub-scale spans the band |
| The key to a see-through area was drawn **solid** | a key stands for the mark, so it is as transparent as the mark is — and an opacity may be stated on the MARK (`{"type": "area", "opacity": 0.35}`) rather than as a channel. Read only off the channel, every layered chart's legend was a shade too dark |

None of the three is about the API. All three were invisible from the specs the
suite already had, which is the argument for the front door existing.

## What two other catalogues say is missing

An API is only as wide as the charts underneath it, so the surface was measured
against two other libraries' catalogues rather than against an opinion:
**Syncfusion's** chart types (Chart, AccumulationChart, StockChart) and
**Observable Plot's** marks. Thirty-six specifications, one per named type, live
in [`tests/chart_types`](tests/chart_types/) and go through both implementations:

```bash
npm run vela:types      # Ranger and official Vega-Lite, scene against scene
```

**32 of 36 draw exactly what the reference draws.** Getting there fixed five
defects, each of which was invisible from the suite that existed:

| what was wrong | what the reference does |
| --- | --- |
| A **box plot ignored a stated `width`** — 20 pixels a band, 60 for three groups, axes drawn to match | a box plot is built as its own Vega specification rather than through the ordinary sizing path, and that path was the only one reading `width`. The band spans the plot instead, and no step signal is written at all |
| **`thickness` on a tick was read only from the configuration** | `{"type": "tick", "thickness": 4}` is a mark saying how thick it is. A bullet chart's measure bar and a hi-lo-open-close chart's open and close both came out a hairline |
| A **stacked line was not stacked** | a line stacks when the chart *says* so (a bar and an area stack by default and a line never), and a stacked line imputes the categories a series skips, so the ones above it stand on something |
| A **rule on a discrete axis sat half a pixel off** | a rule is a **band** scale with no padding, placed in the middle of its band — not a point scale. Only a band takes back the half pixel its axis group is offset by, so the hi-lo chart's geometry was right and its axis was not |
| An **error bar was titled after the columns it was computed from** — `"lower_y, upper_y"` — and called itself a rule | the axis is named after the column the interval is *about*, the band is expanded as a layer of one (`layer_0_marks`), and a composite says what it is: `ariaRoleDescription: "errorbar"` |

What still differs, and it is worth naming precisely rather than rounding up:

* **`pareto`** — two y scales resolved independently. One of the second layer's
  two domain entries lands in the *first* layer's scale, so the left axis is
  scaled to a column it does not draw and gets a fifth tick. The two axes are
  also emitted twice each. Dual-axis charts draw, but not yet exactly.
* **`polar_column`** — a **discrete theta scale** answers one angle for every
  category, so a polar column chart collapses to a single wedge. This is the
  blocker for the whole radar/polar family rather than a defect of its own.
* **`errorbar` / `errorband`** — the geometry, the styles, the names and the
  aria role now match; the `description` string a screen reader is handed still
  lists the two ends where the reference lists the mean and both ends.

And what neither Vela nor the Vega-Lite grammar has at all, which is a feature
list rather than a bug list: **funnel** and **pyramid**; a real **polar
coordinate system** (radar, polar line/area/column, rose); **3D** charts;
**treemap**, **sankey**, **smith chart** and the **gauge** family; and from
Plot's side **hexbin**, **contour**, **raster**, **voronoi/delaunay**, **tree**,
**waffle** and the **dodge** (beeswarm) transform. Everything interactive —
crosshair, tooltip, zoom, selection — is the interaction gap below.

## What is not there yet

* **Composition beyond a layer.** `column` and `row` are channels and work; a
  concatenation of two charts and the top-level `facet` operator are not built
  here — the second is refused by the compiler as well.
* **Interaction.** The runtime has signals and a dependency graph, and changing
  one signal recomputes only what reads it. What is missing is everything
  between a pointer and a signal: hit testing, hover, selection, brush, zoom.
  That is the largest single thing Vela does not have, and it is a runtime
  feature rather than an API one — but the API is where it would be *said*
  (`.select("brush")`), so it belongs on this list.
* **A host API.** Resize, focus, events, an accessibility model. A chart that
  redraws when its container changes size is a host concern, and there is no
  seam for a host yet.
* **Straight to Vega.** Everything here emits Vega-Lite, which is right for a
  first version: it is the vocabulary the compiler already covers, and the
  comparison against a hand-written specification is what makes the API
  checkable. A second emitter that skips the compiler — marks and scales
  written directly as Vega — would remove a layer for a caller that wants one,
  and would want a comparison of its own.
* **The grid.** `gallery/datagrid` builds its twenty chart types as text and is
  the obvious first caller. It is not converted here: that is a change to a
  working program, and it belongs in its own diff rather than tacked onto the
  API that makes it possible.
