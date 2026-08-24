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
| 100 | 4.6 ms | 90.7 ms | 7.1 ms |
| 1 000 | 12.1 ms | 692 ms | 50 ms |
| 10 000 | 124 ms | 5 013 ms | 578 ms |
| 30 000 | 384 ms | 15 550 ms | 1 962 ms |

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
| 1 000 | 53 ms | **1.9 ms** | 18 ms |
| 10 000 | 542 ms | **17 ms** | 144 ms |
| 30 000 | 2 207 ms | **59 ms** | 466 ms |

### 3. On this machine there is no crossover — and the reason is measurable

`webgl-sdf` still loses the redraw race: 749 ms against the DOM's 384 ms at
30 000 nodes. But look at where those milliseconds go. Per additional mark,
between 10 000 and 30 000 nodes:

| | `html-evg` | `svg-vela` | `webgl-sdf` |
| --- | ---: | ---: | ---: |
| whole frame | 13.0 µs | 31.5 µs | 25.3 µs |
| JavaScript | 4.8 µs | 8.1 µs | **0.0 µs** |

The GPU column's JavaScript is *flat*: 0.1 ms at a hundred nodes, 0.65 ms at
thirty thousand, because a frame is one `bufferSubData` and two draw calls
however many marks are in it. Every one of its remaining 25 µs per mark is
**SwiftShader** — software rasterisation, on a machine with no GPU, in the one
column that cannot fall back to Skia.

So the honest reading is a conditional one, and the condition is quantified:

> **`webgl-sdf` overtakes the best DOM backend as soon as its rasteriser costs
> less than ~13 µs per mark — that is, as soon as it is about 2× faster than
> SwiftShader.** Any real GPU is orders of magnitude past that, and the
> JavaScript half is already 20–200× cheaper than the DOM's at every size
> measured.

### 4. If what you want is the first picture, SVG is still ahead — because of the pipeline, not the paint

| nodes | `svg-vela` total | `webgl-sdf` total | of which EVG layout + display list |
| ---: | ---: | ---: | ---: |
| 1 000 | 85 ms | 261 ms | 259 ms |
| 10 000 | 931 ms | 3 584 ms | 3 567 ms |
| 30 000 | 2 938 ms | 11 061 ms | 11 002 ms |

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

> These are the numbers **after** the two optimisation passes this benchmark
> set off — documented in
> [`gallery/vela/README.md`](../../vela/README.md#where-the-time-went). Vela's
> marginal cost per mark was 144 µs when this comparison was first run and is
> 67 µs now; the "before" column below is that first run. The Vela columns now
> call `renderAnswer`, which is what the playground page calls: the same work
> without a JSON envelope around the SVG.

Marginal cost of one more mark, least squares over every size measured:

| µs per node | `vela-svg` (before) | `vela-svg` | `vela-svg-vg` | `evg-webgl` | `vega-svg` | `vega-canvas` | `chartjs` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| first render | 144 | **67** | 54 | 943 | 39 | 13 | 3.6 |
| update | 139 | **62** | 65 | 904 | 50 | 15 | 1.9 |

In whole milliseconds — first render, median of three:

| nodes | `vela-svg` | `vega-svg` | `vega-canvas` | `chartjs` |
| ---: | ---: | ---: | ---: | ---: |
| 100 | **12.3** | 23.5 | 19.1 | 8.7 |
| 300 | **20.8** | 25.5 | 19.4 | 12.5 |
| 1 000 | **43** | 52 | 28 | 12 |
| 3 000 | 129 | 123 | 55 | 20 |
| 10 000 | 676 | 452 | 167 | 80 |
| 30 000 | 1 995 | 1 191 | 398 | 118 |

(100 to 3 000 are medians of nine, the two largest of three: at twenty
milliseconds a render, three samples are not a measurement.)

and an update, where the gap is wider because Vela has nothing to reuse:

| nodes | `vela-svg` | `vega-svg` | `vega-canvas` | `chartjs` | Vela ÷ best |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 11.0 | 10.1 | 3.8 | 4.6 | 2.9× |
| 1 000 | 46 | 43 | 16 | 7.4 | 6.3× |
| 10 000 | 600 | 511 | 173 | 49 | 12× |
| 30 000 | 1 868 | 1 506 | 456 | 62 | 30× |

Read plainly:

1. **Up to about three thousand marks Ranger is the faster of the two
   grammars.** 12.3 ms against official Vega's 23.5 at a hundred marks, 43
   against 52 at a thousand, level at three thousand — the same specification,
   the same drawing, from a runtime compiled out of Ranger. Small charts are
   most charts.
2. **Above that it is behind by about 1.7×**, evenly: 1.5× at ten thousand,
   1.7× at thirty thousand, which is the ratio of the marginal costs (67 µs a
   mark against 39). Against a canvas renderer it is 5×, against Chart.js 19×.
3. **The Vega-Lite compiler is not where it goes.** `vela-svg-vg` — the same
   Vela runtime and renderer, handed the Vega specification vega-lite itself
   compiled — costs 54 µs a mark against 67. The scene evaluation and the SVG
   writing are the bill.
4. **Updates are still the weak point, though the gap to Vega has nearly
   closed.** Vela recomputes everything because one point moved; Vega keeps its
   dataflow — and yet 62 µs a mark against 50 now, where it was 139 against 46.
   The distance left is to the canvas renderers: 1.9 s at thirty thousand marks
   against Chart.js's 62 ms.
5. **The GPU route is the slowest thing measured** — 894 µs a mark, twelve
   times Ranger's own SVG — for the reasons the first half of this document
   lays out: a marker arriving as a 190-point polygon, and a viewer that
   retains nothing between frames. It also pays for an 80 MB JSON document at
   thirty thousand marks, which is a garbage collector's worth of cost on its
   own.

## What this says to do about it

- **Keep the scene between renders.** Everything in the top half of these
  tables does. A `VlRuntime` that can be handed new data without re-reading
  the specification would close most of the update gap on its own, and it is
  now the largest single thing left.
- **Look at the SVG renderer and the scale evaluation, not the compiler.**
  Point 3 says where the milliseconds are. The cheap wins there have been
  taken; what is left allocates an object per path segment and a hash lookup
  per property read, which is a change of shape rather than a change of line.
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

---

# How many points fit

The two benchmarks above compare Vela at ordinary sizes. This one asks where it
*stops*, which is the question a point-intensive chart actually raises.

```
npm run evg:bench:capacity
node gallery/evg/bench/capacity.mjs --sizes 10000,100000 --shapes line,scatter
node gallery/evg/bench/capacity.mjs --budget 60000 --no-reference
```

Headless — no browser, no compositor — so what it measures is the runtime and
the renderer. The reference implementation is measured the same way, through
`view.toSVG()`, which is vega's own SVG renderer with no page under it either.
A shape stops when one render passes the budget (20 s by default). Tables in
[`results/capacity.md`](results/capacity.md).

## The distinction that decides everything

**A scatter of N points is N marks and N elements. A line through N points is
ONE mark and one element with N vertices.** They look alike on the page and
cost nothing like the same — so "how many points can it handle" has no single
answer, only an answer per shape.

| shape | what the renderer is asked for | ≤ 100 ms | ≤ 1 s | ≤ 10 s | largest measured |
| --- | --- | ---: | ---: | ---: | --- |
| `line` | one path, N vertices | 1 000 | 30 000 | **300 000** | 1 000 000 in 22 s |
| `area` | one path, 2N vertices | 1 000 | 30 000 | **300 000** | 1 000 000 in 35 s |
| `line-8` | eight paths | 3 000 | 30 000 | **300 000** | 1 000 000 in 29 s |
| `tick` | N rules | 3 000 | 30 000 | 100 000 | 1 000 000 in 44 s |
| `scatter` | N symbols, four colour series | 1 000 | 10 000 | 100 000 | 300 000 in 23 s |
| `rect` | N cells | — | 10 000 | 100 000 | 1 000 000 in 39 s |

Nothing failed. There is no size in this sweep where Vela refuses, runs out of
memory or produces a wrong chart — a million points come out of every shape,
and the largest document it wrote was 379 MB of SVG. The ceiling is patience,
not capacity.

## Two numbers to carry away

**Per point, for a line-shaped chart: ~20 µs.** A hundred thousand points in
2.3 s of scene building and 0.6 s of SVG. The vertices are cheap; it is the
dataflow — a filter expression per row, a description string per row, an extent
pass — that is being paid for, and Vega pays the same bill at about half the
price.

**Per point, for a mark-shaped chart: ~45 µs, and one DOM node each.** A
hundred thousand symbols is a 38 MB document. The renderer will write it in
under five seconds; the browser is the part that will not enjoy it (below).

## What it costs against the reference

Consistently **1.5–2.9×** vega's own SVG renderer, at every shape and every
size — no shape where Vela falls off a cliff the reference does not, and none
where it wins. The ratio is flat with N, which is what says both are linear.

| points | `line` vela / vega | `scatter` vela / vega | `tick` vela / vega |
| ---: | --- | --- | --- |
| 10 000 | 248 / 95 ms | 531 / 210 ms | 346 / 155 ms |
| 100 000 | 3 287 / 1 568 ms | 4 753 / 2 117 ms | 2 902 / 1 927 ms |
| 300 000 | 7 090 / 3 064 ms | 23 311 / 14 121 ms | 12 939 / 5 878 ms |

## The browser is a lower ceiling than the renderer

`results/browser-capacity/` runs the same scatter to pixels in Chromium. An SVG
chart puts one element per mark into the DOM, and that — not the runtime — is
what decides how many marks a page can hold:

| marks | Vela → pixels | vega SVG | vega canvas | Chart.js (canvas) |
| ---: | ---: | ---: | ---: | ---: |
| 10 000 | 0.70 s | 0.34 s | 0.21 s | 0.08 s |
| 30 000 | 1.8 s | 0.93 s | 0.39 s | 0.13 s |
| 100 000 | 5.8 s | 3.1 s | 1.5 s | 0.93 s |
| 300 000 | 18 s | 13 s | 4.1 s | 1.5 s |

The canvas renderers are two orders of magnitude ahead at the top not because
their arithmetic is better but because they draw pixels instead of building a
document. **Past about thirty thousand marks, no SVG renderer is the right
answer — the answer is a canvas, or fewer marks.**

## What to do with a lot of points

1. **If it can be a line, an area or a band, it can carry ten times more.** One
   path with 300 000 vertices renders in 7 s and is one DOM node; 300 000
   symbols are 23 s and 300 000 DOM nodes.
2. **If it must be marks, bin or aggregate first.** `bar-agg`, `histogram` and
   `stacked` in the sweep are large *data* and small *drawings*: the rows go
   through the dataflow and come out as twenty bars.
3. **Past ~30 000 marks, stop rendering SVG.** EVG's display list already has
   a raster and a GPU backend; that seam exists for exactly this, even if the
   viewer behind it is not ready yet (the first half of this document).

## What this benchmark found

Running it the first time found a quadratic, which is the reason a capacity
benchmark is worth having at all:

- `VlRuntime.sortMarkItems` was an **insertion sort** — fine for a bar chart,
  which is what its comment assumed, and quadratic for a line, whose item count
  is the number of data points. Vega-Lite puts a `sort` on every line it
  compiles, so a line through 10 000 points spent 3.9 s of its 4.0 s sorting.
  It is a stable merge sort now: the same chart takes 0.17 s.
- `VelaWeb.render` answered JSON with the whole SVG document **inside a JSON
  string** — 40 MB escaped and parsed back at 100 000 marks, 53% of everything
  the page waited for. `renderAnswer` returns the object instead, which halved
  the wait; `render` still answers JSON for callers that want it.

Both are in [`gallery/vela/README.md`](../../vela/README.md#where-the-time-went)
with the before and after.
