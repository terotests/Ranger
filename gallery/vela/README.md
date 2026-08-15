# Vela — a Vega-compatible visualization runtime for Ranger

Vela runs a **Vega specification** and produces a **scene**: the same charts the
Vega grammar describes, computed in Ranger rather than in JavaScript, so they
compile to every Ranger target.

It is an independent implementation of the Vega grammar's semantics, not a port
of the Vega JavaScript sources and not affiliated with the Vega project. See
[Attribution and licensing](#attribution-and-licensing).

**Status:** the core runs. Marks, scales, transforms, signals and expressions
produce a scene that matches the reference implementation item for item on
14 of 14 marks across 13 chart types. **Axes, legends and rendering are not
built yet** — see [What is not there yet](#what-is-not-there-yet).

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
   │  VlScene     mark / item tree              │
   │  VlCommand   flat draw commands            │
   └─────────────────────┬──────────────────────┘
                         │
                  ┌──────┴───────┐
                  ▼              ▼
             scene JSON     draw commands
          (compared against  (what a renderer
           the reference)     will consume)
```

Rendering is deliberately last. The command layer is the seam a backend plugs
into; the EVG backend waits on richer SVG-path support in EVG, and until then
the commands are checked as text.

## Try it

```bash
bash gallery/vela/tests/run.sh          # build, unit tests, goldens, parity
```

```bash
# a scene from an unmodified Vega-Lite-compiled spec
node gallery/vela/bin/vela_scene.js gallery/vela/tests/specs/bar.vg.json

# the same chart as drawing commands
node gallery/vela/bin/vela_commands.js gallery/vela/tests/specs/bar.vg.json
```

```
rect x=0 y=0 w=180 h=300 stroke=#ddd strokeWidth=1
group-begin
rect x=1 y=216 w=18 h=84 fill=#4c78a8
rect x=21 y=135 w=18 h=165 fill=#4c78a8
rect x=41 y=171 w=18 h=129 fill=#4c78a8
…
group-end
```

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

**14 / 14 marks**, against Vega 6.4 and Vega-Lite 6.4.

| Area | State |
| --- | --- |
| Marks | rect, rule, symbol, text, line, area, arc, path, image — encoded; group marks are not nested yet |
| Scales | band, point, linear, ordinal · `nice`, `zero`, `clamp`, `round`, step ranges, colour schemes |
| Transforms | filter, formula, stack (with sort), aggregate, bin, extent, impute, project, collect (unsorted) |
| Expressions | the documented expression profile: operators, member access, calls, array and object literals |
| Signals | literal values and `update` expressions, settled against the scales |
| Data | inline `values` and `source`; a `url` is refused rather than fetched |
| Guides | **not built** — axes and legends produce nothing |
| Layout | **not built** — no autosize, padding or group layout |
| Dataflow | **batch only** — no pulses, no changesets, no incremental re-run |
| Rendering | **not built** — the command layer exists, the backends do not |
| Interaction | **not built** |

## What is not there yet

* **Axes and legends.** The reference builds them as ordinary marks inside axis
  groups; Vela skips them. The parity harness counts them separately so this is
  visible rather than flattering: what it reports as matching is the data marks.
* **Rendering.** Waiting on EVG's SVG-path work. `VlCommand` is the interface a
  backend will consume, and it is built and tested now so that the backend is a
  small step rather than a design.
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
