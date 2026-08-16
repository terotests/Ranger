# Vela — a Vega-compatible visualization runtime for Ranger

Vela runs a **Vega specification** and produces a **scene**: the same charts the
Vega grammar describes, computed in Ranger rather than in JavaScript, so they
compile to every Ranger target.

It is an independent implementation of the Vega grammar's semantics, not a port
of the Vega JavaScript sources and not affiliated with the Vega project. See
[Attribution and licensing](#attribution-and-licensing).

**Status:** it draws. Marks, scales, transforms, signals, expressions, axes,
legends and layout produce a scene that matches the reference implementation
item for item on **970 of 970 marks** across 24 chart types at three sizes, and
the EVG backend renders that scene to **PDF, PNG and HTML** — twenty-two charts
on three pages of the project's
[EVG showcase](https://terotests.github.io/Ranger/evg/). Compiled to **C++**
and built with `g++`, the runtime reproduces every one of those goldens byte
for byte, with no JavaScript engine underneath
([the C++ check](#the-c-check-the-javascript-is-the-host-not-the-answer)).
Every chart type the triage asked for is built; see
[What is not there yet](#what-is-not-there-yet) for what remains.

```
                   Vega-Lite JSON
                         │  VlCompile — single views; the rest is still
                         ▼  the official compiler's
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
   │  VlScene     mark / item tree              │
   │  VlCommand   flat draw commands            │
   │  VlEvg       commands → EVG path data      │
   └─────────────────────┬──────────────────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        scene JSON    commands    EVG page
       (compared to   (text, in   → PDF · PNG · HTML
        the reference) a golden)
```

The command layer is the seam: it knows nothing about EVG, and the EVG backend
knows nothing about Vega. Both are tested on their own — the commands as text
against a golden, the scene against the reference implementation.

## Try it

```bash
bash gallery/vela/tests/run.sh          # build, unit tests, goldens, parity
bash gallery/vela/tests/run_cpp.sh      # the same goldens, from a C++ binary
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
rect x=0 y=0 w=180 h=300 stroke=#ddd strokeWidth=1
group-begin
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
| An axis thinned to two labels dropped its own last one | when parity halving has got an axis down to two labels or fewer, the reference gives up the last SURVIVOR and shows the last LABEL — two labels that are not the ends of the scale do not read as one |

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
| Dataflow | a dependency graph over signals, data and scales: `update(signal, value)` recomputes only what reads it, and the scene is re-encoded |
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
* and `strfromcode` truncated a code point to a byte in **C++** — so a bin's
  label read `20 30` instead of `20 – 30`, in that target only. Fixed in the
  compiler's own C++ template, where it had been wrong for every program, not
  only this one.

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
  goldens use. `tests/run.sh` puts **every committed spec** through it — run the
  chart, set `width` to the value it already has, require the incremental scene
  to be the golden — which also catches anything accumulated and not cleared.
* **It is shorter.** A graph that prunes nothing draws the right chart and has
  done nothing. So `flowRan` is asserted by name: in the unit test's chart, of
  eight nodes, changing `cutoff` runs the signal that quotes it, the data set
  that filters on it and the two scales that take their domains from that data
  set — and leaves the source data, the other filter and its scale alone.

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

**It is not a zone database, and says so.** The rules are the ones in force now,
so a chart of dates from before the EU harmonised in 1996 or the US moved its
dates in 2007 is an hour out where the rule has since changed, and a zone with
its own history — Brazil, which abolished summer time in 2019 — is carried at its
current offset with no rule at all. A chart of the last twenty years is right; a
chart of the twentieth century is not.

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

* **Historical time zones.** The summer-time rules are the ones in force now,
  and a zone with its own history is carried at its current offset. See
  [A time zone is supplied](#a-time-zone-is-supplied-not-discovered) — a chart
  of recent data is right, an old one may be an hour out.
* **Two width estimates, on purpose.** `VlText.estimateWidth` is the
  reference's canvas-free 0.8 em per character and sizes the axis extents,
  because matching the reference's layout is what the comparison measures.
  `VlText.drawWidth` is a per-character-class table measured from the faces
  this repository ships, and sizes the box a label is drawn in. Neither has to
  be exact: the box only has to be wide enough, and the alignment inside it —
  resolved by the renderer's own metrics — is what positions the string.
* **Bounds-based layout, outside a legend.** The view is sized from what the
  axes ask for, which agrees with the reference exactly on the charts whose
  marks stay inside the plot (a bar chart is 236×347 with the plot at 51,10 in
  both, and every chart with a legend now agrees to the pixel because the
  legend's own box is measured). The reference measures the true bounds of
  *everything* drawn, so a chart with a symbol or a label hanging over the plot
  edge can still differ by a few pixels — a backend should not clip to the plot
  rectangle. `VlBounds` is what that fix would be built on.
* **Per-mark incremental encoding.** A signal change reruns only the data and
  scales that read it, but the scene itself is re-encoded whole — see
  [Changing one number](#changing-one-number). Most marks read most scales, so
  a per-mark graph would dirty nearly all of them anyway; it would pay on a
  concatenated view whose plots share nothing.
* **The rest of the Vega-Lite compiler.** Single-view specifications compile
  in Ranger now — see [Vega-Lite, in Ranger](#vega-lite-in-ranger). Layering,
  faceting, concatenation, `bin`, `xOffset`, arcs and the composite marks that
  expand into layers are still the official compiler's, and each one refuses
  out loud rather than drawing something else.

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
│   ├── VlCompile.rgr     Vega-Lite → Vega
│   └── VlRuntime.rgr     spec → scene
├── tools/
│   ├── vela_scene.rgr    CLI: spec → scene JSON
│   ├── vela_commands.rgr CLI: spec → draw commands
│   ├── vela_compile.rgr  CLI: a Vega-Lite spec → a Vega one
│   ├── vela_evg.rgr      CLI: specs → an EVG showcase page
│   └── reference/        the harness that compares against official Vega
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
