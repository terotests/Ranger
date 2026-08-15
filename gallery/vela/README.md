# Vela — a Vega-compatible visualization runtime for Ranger

Vela runs a **Vega specification** and produces a **scene**: the same charts the
Vega grammar describes, computed in Ranger rather than in JavaScript, so they
compile to every Ranger target.

It is an independent implementation of the Vega grammar's semantics, not a port
of the Vega JavaScript sources and not affiliated with the Vega project. See
[Attribution and licensing](#attribution-and-licensing).

**Status:** it draws. Marks, scales, transforms, signals, expressions, axes and
layout produce a scene that matches the reference implementation item for item
on **129 of 129 marks** across 13 chart types, and the EVG backend renders that
scene to **PDF, PNG and HTML** — six charts are on the project's
[EVG showcase](https://terotests.github.io/Ranger/evg/). Legends are the
remaining piece; see [What is not there yet](#what-is-not-there-yet).

```
                   Vega-Lite JSON
                         │  official vega-lite (compile step, JS for now)
                         ▼
                     Vega JSON
                         │
   ┌─────────────────────┴──────────────────────┐
   │                   Vela                     │
   │                                            │
   │  VlJson      spec + data as one value type │
   │  VlExpr      the Vega expression language  │
   │  VlTransform filter formula stack bin …    │
   │  VlScale     band point linear ordinal     │
   │  VlRuntime   signals → data → scales →     │
   │              encode                        │
   │  VlAxis      ticks, labels, grid, title    │
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
| tick | `tick.vg.json` | ✓ |
| text labels | `text_labels.vg.json` | ✓ |
| pie / arc | `pie.vg.json` | ✓ |
| layered | `layered.vg.json` | ✓ (both layers) |

**129 / 129 marks**, against Vega 6.4 and Vega-Lite 6.4 — data marks and every
axis grid, tick, label, domain line and title in all thirteen charts.

| Area | State |
| --- | --- |
| Marks | rect, rule, symbol, text, line, area, arc, path, image — encoded; group marks are not nested yet |
| Scales | band, point, linear, ordinal · `nice`, `zero`, `clamp`, `round`, step ranges, colour schemes |
| Transforms | filter, formula, stack (with sort), aggregate, bin, extent, impute, project, collect (unsorted) |
| Expressions | the documented expression profile: operators, member access, calls, array and object literals |
| Signals | literal values and `update` expressions, settled against the scales |
| Data | inline `values` and `source`; a `url` is refused rather than fetched |
| Axes | ticks, grid, labels, domain, title · `tickCount`, `tickRound`, `labelAngle`, `labelFlush`, `labelOverlap`, band and binned ticks |
| Legends | **not built** |
| Layout | axis extents, view size and plot origin (`autosize: pad`); no group or facet layout |
| Rendering | **EVG backend**: PDF, PNG and HTML, via `PathBuilder` path data — rect, rule, symbol, text, line, area, arc |
| Theming | colours from the spec, or from a stylesheet by class; `config.axis` and `config.style` are read |
| Dataflow | **batch only** — no pulses, no changesets, no incremental re-run |
| Rendering | **not built** — the command layer exists, the backends do not |
| Interaction | **not built** |

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
and so on, with series numbered in the order the chart draws them. The
specification's colours are then written out as an unscoped stylesheet, so they
remain the default, and a theme's scoped rules override them. That is how the
showcase renders one generated page in three palettes without regenerating it.
Only colour moves: stroke widths, opacities and every coordinate stay in the
tree, because they were computed from the data and are not a matter of taste.

**Text is placed by measurement, not by alignment.** The first attempt gave each
label a box and a `textAlign` and let the renderer's own font metrics centre the
string in it. That is the better design and it does not work: EVG's label
styling does not carry a width out to the target, so the box is auto-width, the
alignment has nothing to align within, and every label lands at its box's left
edge — which put a bar chart's category labels progressively further right than
their ticks. The anchor is resolved here instead, with the same width estimate
the axis extents use. A proportional face differs from that estimate by a pixel
or two; the alternative was labels tens of pixels out.

The chart page on the showcase is generated:

```bash
npm run vela:showcase     # -> pages/charts.tsx + themes/charts-default.css
npm run showcase          # -> PDF, PNG and HTML in three palettes
```

Both files are committed, so the Pages build renders them like any other page
and does not need the Vela toolchain. The page follows the gallery's own rule —
the tree says what is drawn, the stylesheet says how it looks — so the same six
charts come out in **Editorial**, **Studio** and **Autumn**, and with no chart
theme at all they come out in the colours their specifications asked for.

## What is not there yet

* **Legends.** The reference builds them as marks inside legend groups, the
  same way it builds axes. The parity harness counts them separately, so what
  it reports as matching does not include them. A chart that encodes colour is
  drawn correctly and has no key.
* **Time and log scales**, and a Ranger Vega-Lite compiler — none of which a
  static chart needs, and all of which are named in the table below.
* **A turned axis title.** The reference writes a y-axis title on its side
  beside the axis; Vela draws it upright in a band above the plot. EVG's three
  targets do not agree about what `rotate` means on a label — the raster target
  turns it about the top-left of a box whose width layout never measured, and
  the HTML target does not turn labels at all — so a chart built on it comes
  out differently in each. Worth revisiting when a label's box is measured.
* **Two width estimates, on purpose.** `VlText.estimateWidth` is the
  reference's canvas-free 0.8 em per character and sizes the axis extents,
  because matching the reference's layout is what the comparison measures.
  `VlText.drawWidth` is a per-character-class table measured from the faces
  this repository ships, and places the text. A backend with real font metrics
  should replace the second and nothing else.
* **Bounds-based layout.** The view is sized from what the axes ask for, which
  agrees with the reference exactly on the charts whose marks stay inside the
  plot (a bar chart is 236×347 with the plot at 51,10 in both). The reference
  measures the true bounds of everything drawn, so a chart with a symbol or a
  label hanging over the plot edge can differ by a few pixels — a backend
  should not clip to the plot rectangle.
* **Time scales and the date/time layer.** No temporal axis.
* **Log and power scales.** `VlMath` has the `ln`/`exp`/`pow` they need; the
  scale types are not wired up.
* **Incremental dataflow.** Everything recomputes. The transform signatures are
  per-transform so an incremental core can go underneath without rewriting them.
* **A Ranger Vega-Lite compiler.** The Vega-Lite → Vega step is still the
  official JavaScript one. That is the right order: the Vega runtime is a large
  but well-defined job, and the Vega-Lite compiler solves a different problem.

## Layout

```
gallery/vela/
├── src/
│   ├── VlJson.rgr        value model, parser, canonical writer
│   ├── VlMath.rgr        ln / exp / pow, which Ranger's operators lack
│   ├── VlText.rgr        label width estimate, for axis extents
│   ├── VlAxis.rgr        an axis spec becomes rules and text
│   ├── VlEvg.rgr         the EVG backend: commands → path data
│   ├── VlExpr.rgr        expression parser (AST)
│   ├── VlExprEval.rgr    expression evaluator + scope
│   ├── VlScale.rgr       band / point / linear / ordinal, ticks, nice
│   ├── VlTransform.rgr   data transforms
│   ├── VlConfig.rgr      the defaults a mark inherits
│   ├── VlScene.rgr       scene graph + canonical JSON
│   ├── VlCommand.rgr     flat draw commands (renderer-agnostic)
│   └── VlRuntime.rgr     spec → scene
├── tools/
│   ├── vela_scene.rgr    CLI: spec → scene JSON
│   ├── vela_commands.rgr CLI: spec → draw commands
│   ├── vela_evg.rgr      CLI: specs → an EVG showcase page
│   └── reference/        the harness that compares against official Vega
├── tests/
│   ├── *_test.rgr        unit tests (JSON, expressions, scales)
│   ├── specs/            generated Vega-Lite sources and compiled Vega specs
│   ├── golden/           committed scene and command output
│   └── run.sh            build + test everything
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
determinism. That is worth more to this repository than a hosted bundle.

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
