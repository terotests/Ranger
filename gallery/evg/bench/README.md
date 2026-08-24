# How many nodes before the GPU is worth it?

EVG can put the same chart on screen several ways: Vela writes SVG itself, the
EVG layout emits a display list that `gl/evg-webgl.js` draws with WebGL 2, and
the same list is a page of `<div>`s if you want it to be. The question this
directory answers is the practical one — **at what node count does the GPU
route start to pay** — and it answers it by measuring, not by reasoning about
it.

```
npm run evg:bench                     # the full sweep, 100 → 30 000 marks
npm run evg:bench:quick               # three sizes, fewer frames
node gallery/evg/bench/bench.mjs --marks 500,5000 --frames 30 --shots
```

Results land in `results/bench.md` (tables), `results/bench.json` (everything,
including each individual frame) and `results/shots/` (a screenshot of every
backend, because a backend that draws nothing is very fast).

## What is measured

One chart — a scatter plot, one point mark per node — built from one Vega-Lite
specification and taken to pixels six ways:

| column | what it is |
| --- | --- |
| `svg-vela` | the SVG string `VlSvg` writes, set with `innerHTML`. This is Vela's own renderer, the one behind `npm run vela:web`. |
| `svg-evg` | SVG built from EVG's display list, so it and the GPU columns draw the same numbers. |
| `html-evg` | absolutely positioned `<div>`s from the same list. A div cannot hold a polygon, so a marker becomes its bounding box with `border-radius: 50%` and a gridline one thin box per segment — which is what a DOM charting library actually draws, and less work than the others do. |
| `webgl` | `gallery/evg/gl/evg-webgl.js` — the shipped viewer, handed the display list. |
| `webgl-batch` | the same display-list geometry, tessellated **once** into two flat arrays and drawn as one `drawArrays`. |
| `webgl-sdf` | one instanced quad per mark, the shape found in the fragment shader — the trick the shipped viewer already uses for rounded boxes, applied to what a chart is made of. Chart chrome (axes, grid, frame) stays triangles; text is left out. |
| `gl-empty` | the same canvas drawing nothing at all: the compositor's own per-frame cost, so it can be subtracted rather than argued about. |

Each is timed at three points:

- **build** — everything above the browser: the Vela runtime, `evgSource`, the
  display list, the JSON parse. Shared by the columns that share a pipeline.
- **first paint** — attaching what came out and getting it on screen once.
- **redraw** — a loop of frames in which *every node is touched again*: an
  attribute on every SVG element, a transform on every div, a rebuilt and
  re-uploaded buffer for the GPU. This is the case an interactive chart lives
  in, and it is where the two approaches are supposed to diverge.

Frames are measured to the pixel, not to the end of the JavaScript: Chromium is
launched with `--run-all-compositor-stages-before-draw`, so the
`requestAnimationFrame` after a mutation fires only once the previous frame has
been through raster and composite. `cpu` in the last table is the JavaScript
half alone — mutating and forcing style and layout for the DOM backends,
building and submitting the frame for the GPU ones.

## The one thing to know before reading the numbers

**This machine has no GPU.** WebGL runs on SwiftShader, a software rasterizer,
which is measured in the `gl-empty` row and is charged to every GPU column.
The DOM columns are rasterized by Skia, also on the CPU, also well optimised —
so what the redraw table really compares is two CPU rasterizers, and the GPU
never gets to be a GPU.

That makes every measured GPU number here an **upper bound**, and it is why the
`cpu` column matters more than usual: the JavaScript half of a frame is the
part that does not change when you put the same code in front of real
hardware.

## What came out

Full tables in [`results/bench.md`](results/bench.md); the run they come from is
`results/run.log`, and `results/shots/` has the picture each backend drew at a
thousand nodes — they agree, which is the first thing to check about a
benchmark like this one.

### 1. The shipped WebGL viewer is the slowest way to draw a chart, at every size

| nodes | best DOM redraw | `webgl` redraw | of which JavaScript |
| ---: | ---: | ---: | ---: |
| 100 | 3.8 ms | 82.6 ms | 7.2 ms |
| 1 000 | 13.7 ms | 552 ms | 56 ms |
| 10 000 | 136 ms | 4 873 ms | 544 ms |
| 30 000 | 364 ms | 13 839 ms | 1 599 ms |

Not because it is on the GPU — because of what it does before it gets there.
`evg-webgl.js` is a *viewer*: it holds nothing between calls, so every frame
re-tessellates every path and issues **one draw call per path** — 30 011 of
them at thirty thousand marks. Its JavaScript alone, 1.6 s a frame, is four
times the DOM's entire frame. Batching that same geometry into a single
`drawArrays` (`webgl-batch`) fixes the draw calls and leaves the frame time
where it was: the geometry, not the API, is what costs.

### 2. The geometry is the problem, and it is upstream of the renderer

A point marker arrives in the display list as a **flattened polygon of ~190
points** — 5.8 million points for 30 000 marks, an 80 MB JSON document that
takes 9 s to build. That is why `svg-evg` (the same numbers, drawn as SVG) is
2–4× slower than `svg-vela`, which draws the same chart with arcs. Both GPU
routes and one DOM route are paying for a circle described as a hundred-gon.

Drawing each mark as **one instanced quad** with the shape found in the
fragment shader — the trick `evg-webgl.js` already uses for rounded boxes —
changes the picture completely:

| nodes | `webgl` first paint | `webgl-sdf` first paint | `html-evg` first paint |
| ---: | ---: | ---: | ---: |
| 1 000 | 55.6 ms | **3.0 ms** | 14.7 ms |
| 10 000 | 788 ms | **27.7 ms** | 129 ms |
| 30 000 | 4 167 ms | **45.2 ms** | 468 ms |

### 3. On this machine there is no crossover — and the reason is measurable

`webgl-sdf` still loses the redraw race: 748 ms against the DOM's 364 ms at
30 000 nodes. But look at where those milliseconds go. Per additional mark,
between 10 000 and 30 000 nodes:

| | `html-evg` | `svg-vela` | `webgl-sdf` |
| --- | ---: | ---: | ---: |
| whole frame | 11.2 µs | 25.4 µs | 19.6 µs |
| JavaScript | 4.3 µs | 6.9 µs | **0.0 µs** |

The GPU column's JavaScript is *flat*: 0.1 ms at a hundred nodes, 0.6 ms at
thirty thousand, because a frame is one `bufferSubData` and two draw calls
however many marks are in it. Every one of its remaining 19.6 µs per mark is
**SwiftShader** — software rasterisation, on a machine with no GPU, in the one
column that cannot fall back to Skia.

So the honest reading is a conditional one, and the condition is quantified:

> **`webgl-sdf` overtakes the best DOM backend as soon as its rasteriser costs
> less than ~11 µs per mark — that is, as soon as it is about 2× faster than
> SwiftShader.** Any real GPU is orders of magnitude past that, and the
> JavaScript half is already 20–200× cheaper than the DOM's at every size
> measured.

### 4. If what you want is the first picture, SVG is still ahead — because of the pipeline, not the paint

| nodes | `svg-vela` total | `webgl-sdf` total | of which EVG layout + display list |
| ---: | ---: | ---: | ---: |
| 1 000 | 121 ms | 450 ms | 447 ms |
| 10 000 | 1 684 ms | 3 943 ms | 3 915 ms |
| 30 000 | 5 494 ms | 12 748 ms | 12 704 ms |

The GPU route's first picture is dominated by work that has nothing to do with
the GPU: `evgSource` writes the chart out as a TSX document, the layout engine
parses and lays it out, and the display list is serialised to JSON and parsed
back. Ninety-nine per cent of `webgl-sdf`'s time to first pixel is that pipeline.

## What this says to do about it

1. **Carry a marker as a shape, not as a polygon.** The display list already
   has a radius on `RECT`; a circle is then one command and two triangles
   instead of a 190-point polygon. Every backend gets faster, the JSON stops
   being 80 MB, and the SVG target can emit `<circle>`.
2. **Let the viewer retain something.** Tessellating and re-uploading the whole
   scene per frame is only free if nothing moves. A display list that says
   which commands changed — or a viewer that keeps its buffers — is what turns
   the GPU column from 13.8 s a frame into 0.6 ms of JavaScript.
3. **Don't route a chart to the GPU through a TSX document.** For the WebGL
   target the JSX text and the JSON round trip are pure overhead: at thirty
   thousand marks they are 12.7 of the 12.7 seconds.

## Caveats, in one place

- No GPU: WebGL is SwiftShader, and it is charged the full per-pixel cost. The
  DOM columns are Skia, also CPU, also excellent. Point 3 above is the honest
  way to read the redraw table.
- `webgl-batch` and `webgl-sdf` draw no text — a constant ~30 labels whatever N
  is. `webgl`, `svg-*` and `html-evg` do.
- `html-evg` draws a marker as a rounded box and a gridline as a thin box,
  which is what a DOM chart draws and is *less* work than a polygon. The
  comparison is deliberately generous to the DOM.
- One chart type (a scatter of point marks) and one page size. Bars, which are
  rectangles in every backend, would flatter the display list; lines, which are
  a single long path, would flatter SVG.

---

# The other direction: Ranger against Vega and Chart.js

Knowing which of EVG's own backends is quickest says nothing about whether any
of them is quick. So the same scatter plot, the same data, the same browser,
against the libraries people actually reach for:

```
npm run evg:bench:libs
node gallery/evg/bench/libs.mjs --marks 100,10000 --updates 20 --shots
```

`vega` 6.4.0, `vega-lite` 6.4.3 and `chart.js` 4.5.1 are installed on demand
into `gallery/evg/bench/.libs`, which is not checked in. Tables in
[`results/libs.md`](results/libs.md), pictures in `results/shots-libs/`.

| column | what it is |
| --- | --- |
| `vela-svg` | Ranger: the Vela runtime compiles the Vega-Lite spec, computes the scene, writes SVG. |
| `vela-svg-vg` | the same Vela renderer, handed the Vega spec *vega-lite* compiled — so the gap to `vela-svg` is Vela's own Vega-Lite compiler and nothing else. |
| `evg-webgl` | Ranger: the EVG layout, the display list, the shipped WebGL viewer. |
| `vega-svg` / `vega-canvas` | the reference implementation, on the same Vega-Lite spec. |
| `chartjs` | Chart.js, 2-D canvas, animation off. No grammar: it is handed the four series directly, which is the fastest it goes. |

Two operations, both to the pixel: **first render** (specification + data → a
picture) and **update** (every point moves → a new picture). Vega keeps its
dataflow between updates and Chart.js keeps its chart; Ranger has no
incremental path, so its columns run the whole pipeline again — which is a
finding, not a handicap imposed by the harness.

## Where Ranger stands

Marginal cost of one more mark, least squares over every size measured:

| µs per node | `vela-svg` | `vela-svg-vg` | `evg-webgl` | `vega-svg` | `vega-canvas` | `chartjs` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| first render | 144 | 141 | 783 | **46** | **15** | **3.7** |
| update | 139 | 117 | 892 | **46** | **17** | **2.0** |

In whole milliseconds — first render, median of three:

| nodes | `vela-svg` | `vega-svg` | `vega-canvas` | `chartjs` |
| ---: | ---: | ---: | ---: | ---: |
| 100 | **18.5** | 28.8 | 21.6 | 7.7 |
| 300 | 41.6 | 30.7 | 25.5 | 12.3 |
| 1 000 | 91 | 50 | 30 | 17 |
| 3 000 | 304 | 124 | 58 | 23 |
| 10 000 | 1 199 | 404 | 160 | 75 |
| 30 000 | 4 301 | 1 394 | 454 | 120 |

and an update, where the gap is wider because Vela has nothing to reuse:

| nodes | `vela-svg` | `vega-svg` | `vega-canvas` | `chartjs` | Vela ÷ best |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 21 | 12 | 4.0 | 4.4 | 5.2× |
| 1 000 | 91 | 39 | 17 | 10 | 8.8× |
| 10 000 | 1 220 | 422 | 152 | 48 | 25× |
| 30 000 | 4 139 | 1 386 | 516 | 62 | 66× |

Read plainly:

1. **At a hundred marks Ranger wins.** `vela-svg` draws that chart in 18.5 ms
   against official Vega's 28.8 ms — the same specification, the same
   renderer's worth of work, from a runtime compiled out of Ranger. Small
   charts are most charts, and on those this holds its own.
2. **From a few hundred marks up it falls behind, and settles at about 3×.**
   1.4× Vega's SVG at three hundred, 1.8× at a thousand, 2.5× at three
   thousand, 3.1× at thirty thousand — which is exactly the ratio of the
   marginal costs, 144 µs a mark against 46. Against a canvas renderer it is
   10×, against Chart.js 39×.
3. **The Vega-Lite compiler is not where it goes.** `vela-svg-vg` — the same
   Vela runtime and renderer, handed the Vega specification vega-lite itself
   compiled — costs 141 µs a mark against 144. The compiler is free; the
   scene evaluation and the SVG writing are the bill.
4. **Updates are the weak point, by an order of magnitude and then some.**
   Everything else here keeps a scene and touches what changed. Vela
   recompiles the specification, recomputes every scale and re-serialises
   every path because one point moved: 4.1 s at thirty thousand marks against
   Chart.js's 62 ms.
5. **The GPU route is the slowest thing measured** — 783 µs a mark, five times
   Ranger's own SVG — for the reasons the first half of this document lays
   out: a marker arriving as a 190-point polygon, and a viewer that retains
   nothing between frames. It also pays for an 80 MB JSON document at thirty
   thousand marks, which is a garbage collector's worth of cost on its own.

## What this says to do about it

- **Keep the scene between renders.** Everything in the top half of these
  tables does. A `VlRuntime` that can be handed new data without re-reading
  the specification would close most of the update gap on its own.
- **Look at the SVG renderer and the scale evaluation, not the compiler.**
  Point 3 says where the milliseconds are.
- **Canvas is worth having as a target.** `vega-canvas` is 1.5–3× `vega-svg` at
  every size, with no GPU involved — the same 2-D canvas the display list
  could be painted onto directly, without a TSX document in the middle.

## Caveats

- Same browser, same machine, same flags for all of them; Chromium on
  SwiftShader, which only the `evg-webgl` column is sensitive to (the canvas
  backends rasterise on the CPU with Skia either way).
- Every column is warmed up at 200 marks before the sweep, the first render is
  the median of three from a clean stage, and updates are timed to the pixel
  with a 4 s budget per size. Without the warm-up the first column measured
  paid for the JIT tiers the rest then enjoyed; a single first-render sample
  moved by 2× between runs.
- Chart.js is at a different level: no grammar, no scenegraph, no Vega-Lite
  compile, and it was given the series pre-grouped. It should be faster; the
  number is here to show by how much.
- One chart type — a scatter of point marks — at one size, four series, on
  data that is regenerated per update. A line chart or a bar chart would
  shift the numbers; the pipeline shape they measure is the same.
