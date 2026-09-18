# The view on the GPU — a design

A canvas that pans and zooms rebuilds its whole display list for every frame,
because the pan and the zoom are baked into the coordinates that list carries.
They do not have to be. The painter already applies a translate in the vertex
shader — `uShift`, what a scroll layer moves by — and a *view* is that with a
scale and no layer. Keep the frame, change two uniforms.

Status: **S0 through S3 are built** (§11 says what each one is and what gate it
passed); S4 is not started. Every number in the design was measured on this
repository as it stood when it was written, on the machine it was written on,
and the measurement is named beside it.

Related: [`gl/README.md`](gl/README.md) (the display list as a GPU input),
[`README.md`](README.md) (the pipeline and the seam),
[`PLAN_NATIVE_HOSTS.md`](PLAN_NATIVE_HOSTS.md) (the engine off the UI thread —
this is orthogonal to it and composes with it),
[`../figma/README.md`](../figma/README.md) (the canvas that found this).

---

## 0. The short version

One pan frame of a FigJam board of 3,565 nodes — 744 commands, 767,000 points
— in Chromium, after the flattening and bridge work already on this branch:

| per frame | today | with a view |
| --- | --- | --- |
| build the display list (Ranger) | 37 ms | — |
| decode it in the page | 9 ms | — |
| build the GPU frame: atlas, buffers, upload | 18 ms | — |
| draw it | 18 ms | 18 ms |
| **a pan** | **87 ms** (11 fps) | **~18 ms** (50 fps) |

The last row is not a projection. `prepareDisplayList` already returns a frame
whose `draw()` can be called again, and drawing the same frame a second time
costs 18.4 ms and rebuilds nothing — measured. What is missing is a way to
draw that same frame *somewhere else*: a scale beside the translate the shader
already has, and a host that keeps the frame while the view moves.

**A zoom is not free the way a pan is.** Two things in a built frame have the
scale baked into them — the glyph atlas is rasterized at a size, and a curve
was flattened for a size — so a view may stretch a frame only so far before it
has to be built again (§4). That band is the whole of the design's honesty:
pans are exact and free, zoom is free within about ±40% and costs one rebuild
outside it.

---

## 1. What is already there

Nothing in this design is a new mechanism. Every piece exists and is in use:

| | where | what it does |
| --- | --- | --- |
| a translate applied by the shader | `gl/evg-webgl.js`, `uShift` | a scroll layer that moved since the frame was built draws moved, without rebuilding |
| a frame that outlives its draw | `prepareDisplayList` → `frame.draw(shifts)` | RealTrainer's fling: 266 scroll frames, none of them laid out again (`npm run rt:scroll`) |
| a clip carried into a transformed subtree | `EVGDisplayList.cullThroughTransform` | culling against the region a view will actually show |
| subdivision chosen from the drawn size | `EVGDisplayList.drawScale` | a curve knows how big it will be after the transform |
| a flattened outline kept on its element | `EVGElement.ringsCache` | the same path is not re-parsed for the next frame |
| the frame as typed arrays | `EVGDisplayList.toBinary` | no text between the engine and the painter |

The design is one step further along the line those five are already on: stop
baking the camera into the coordinates at all.

---

## 2. The contract

Today a display list is in **device space**: a command's `x` is where it lands
on the canvas, and `transformFrom` has already multiplied every point of it by
whatever transforms its element sat under. With a view, a list is in **scene
space** and carries the camera beside it:

```ranger
list.setView(x y scale)     ; the camera, not an element property
```

* The walk does not bake that transform. Nothing else changes: element
  transforms *inside* the scene (a rotated label, a scaled badge) are baked as
  they are today, because they belong to the picture rather than to the
  camera.
* `toJson` and `toBinary` carry `view` beside `width`/`height`. The binary
  record is unchanged — the view is three numbers on the envelope, not a field
  per command — and `sceneStride` already derives the record width, so an
  older reader meets a list it can still read (it would draw it unpanned,
  which is why `view` is also reported in `stats`).
* No view means an identity view, which is exactly the list every consumer
  gets today. **This is opt-in from the first line.** A PDF, a PNG, an SVG
  export and every golden test see byte-identical output unless a host asks
  for a camera.

The host stops putting the pan/zoom on a world element. The figma viewer's
`SceneToEVG.buildPage` would no longer write `transform: translate(…) scale(…)`
on the world div; it would call `list.setView(panX, panY, zoom)` instead. The
element tree then no longer changes when the view does — which is the whole
point: a tree that does not change does not need to be walked.

---

## 3. What multiplies, and where

In the vertex shader, `uShift` (vec2) becomes `uView` (vec4: `sx, sy, tx, ty`):

```glsl
vec2 p = aRect.xy * uView.xy + uView.zw + aCorner * aRect.zw * uView.xy;
```

and with it, in the same shader: the half-size that feeds the distance field,
the corner radii, the border thickness, and the rotation origin. A gradient is
computed in the quad's own 0..1 space and is unaffected; an image's UV crop is
computed from aspect ratios and is unaffected. The path program
(`PATH_VERT`) takes the same uniform, applied to `aPos`.

Outside the shader, three things are in device pixels and must be mapped by
the host before they are handed to GL:

| | today | with a view |
| --- | --- | --- |
| a clip (scissor rectangle) | device pixels | multiply by the view when the scissor is set |
| the stroke expansion (a quad per segment, CPU) | device pixels | expand in scene units, let the shader scale — or keep a device-width stroke by dividing the width by the scale, which is what a hairline wants |
| a blur/shadow radius | device pixels | scale it; a shadow that does not grow with the picture reads as a different shadow |

Rotation in the view is possible (`uView` becomes a `mat3`) and nothing in the
repository needs it. Leave it out; say so where the field is declared.

---

## 4. The two things a scale cannot carry

A view stretches a *built* frame, and two things in a built frame were built
for a size.

**Glyphs.** The atlas is a 2-D canvas rasterization of each run at its size.
Scaled up on the GPU it blurs; scaled down it aliases. `atlasFor` already
keys its slots by run and size, so the fix is a policy and not a mechanism:
rebuild the atlas — not the list — when the view's scale leaves the band the
atlas was built for. That is a text-only rebuild, and on the board above it is
part of the 18 ms build, not all of it. (The permanent fix is SDF glyphs,
which is its own plan and its own quality argument. Not this one.)

**Curves.** A path was flattened into points for a drawn size (`drawScale`),
so a frame stretched far enough shows facets — and one shrunk far enough
carries points nobody can see. Same policy, same band.

So the rule, and it is the whole risk of the design:

> A frame may be drawn at any **pan**. It may be drawn at a scale between
> `1/√2` and `√2` of the scale it was built at. Outside that, or outside the
> region it was built for (§5), it is built again.

A pinch crosses a √2 band about every three notches, so a zoom gesture costs a
rebuild every third frame or so and pans between them cost nothing — against
every frame costing one today. The tolerance is a number, not a law: a viewer
that cares more about sharpness than about frames picks 1.15 instead.

---

## 5. Culling a list you mean to keep

Culling today asks *what is in the viewport*, and a kept frame is drawn at
views the viewport did not have. So a kept list is built for a **region**:
the viewport grown by an overscan, in scene units.

The scroll layers already do this vertically — `setOverscan(before, after)`,
defaulting to one clip height each way — and `refreshLayers` already decides
when a shift has left the range the overscan covered. A view needs the same
decision in two dimensions:

```
rebuild when   the view's scale left the band                  (§4)
          or   the viewport is no longer inside the built region
```

Sizing the region is a memory argument, not a correctness one: one viewport of
overscan in each direction is 9× the commands in the worst case and usually
far less (a board at fit-zoom is mostly on screen already; a board at 8× has
almost nothing on it). A cap — "grow the region until it would exceed N
commands, then stop" — keeps the worst case bounded and degrades to today's
behaviour, one build per frame, rather than to a stall.

---

## 6. What each painter has to do

| painter | work | notes |
| --- | --- | --- |
| WebGL (`gl/evg-webgl.js`) | `uShift` → `uView` in two shaders, the scissor multiply, `frame.draw(view, shifts)` | the frame already survives its draw |
| DOM (`html/evg-html.js`) | one CSS `transform` on the root group | the natural form; arguably already free |
| Apple (`apple/`) | a CTM before the frame is drawn | `CGContext`/`CALayer` take one |
| Android (`android/`) | `Canvas.setMatrix` before the frame | same |
| SDL2 / C++ (RealTrainer native) | the same uniform in the same shader | the shader is shared source |
| PDF, PNG, SVG exporters | nothing | there is no camera in a printed page: they get an identity view and bake as they do now |
| the a11y mirror (`gl/evg-a11y.js`) | multiply the rectangles it positions the DOM at | it mirrors *painted* geometry, so it follows the camera |
| hit testing | nothing, but it becomes honest | every host already maps a click through `(screen − pan) / zoom` by hand; the view is that number in one place |

---

## 7. Who it helps, measured as it is today

| | today | what the view removes |
| --- | --- | --- |
| **figma viewer** — pan/zoom a board, 3,565 nodes | 87 ms a frame (§0) | the list build, the decode and the GPU build: ~69 of the 87 |
| **rangerflow** — drag, wheel, pinch a diagram, 2,516 commands | 12.1 ms to build and serialize a frame (`loadSqlFixture`, node) | the same: its `FlowView.build()` walks and culls the whole graph per frame, and a pan does not change the graph |
| **markdown** — scroll a document, 3,365 commands | 5.1 ms a frame: `offsetBy` over every command, a copy of the list, then JSON | `offsetBy` and the copy disappear — the scroll IS the view |
| **RealTrainer / ui** — flings and scroll containers | already kept; `refreshLayers` moves the commands on the CPU | a layer shift becomes a view with a translate: the CPU move goes too |
| **pptx viewer** | a slide is static | little per frame; the win is at fit/zoom and on a zoomed presenter view |
| **evg inspect, the responsive demo** | rebuild per view change | the same as any canvas |

Two of those — rangerflow and markdown — are already fast enough that nobody
would rewrite them for this alone. They are in the table because the change is
in the engine and they get it for the price of deleting code: `offsetBy` and
the per-frame list copy in markdown's `frame()`, the camera arithmetic spread
through `FlowView`'s painting in rangerflow.

---

## 8. Where it gives nothing

* A page that draws once. PDF, PNG, SVG, the pptx export: there is no second
  frame to keep.
* The first frame of a file. A build is a build; this is about the second one.
* Content that changes every frame — an animation, a simulation tick, a drag
  that moves a node. The view keeps a frame whose *scene* is unchanged. (A
  drag that moves one node is the fragments mechanism's problem, and §10 says
  why the view is what would finally make fragments work.)

---

## 9. What could go wrong

| risk | what it looks like | what holds it |
| --- | --- | --- |
| text softens while zooming | a pinch looks blurry until it settles | the band (§4), and a rebuild on gesture end; the check is a pixel diff of a kept frame against a rebuilt one at the band's edge |
| a golden test moves | a PDF or a conformance oracle shifts by a rounding | identity view is the default and bakes exactly as today; any consumer that does not call `setView` must be byte-identical, and that is the gate on S0 |
| two mechanisms disagree | a scroll layer inside a view drifts | one composition, written once: `view ∘ layerShift`, the layer's shift in scene units; `rt:scroll` already holds the layer half to a full rebuild, and the same check gains a view |
| the region policy thrashes | every second frame is a rebuild after all | the policy is one function in `gl/`, with the region and the band as its inputs, so it is testable without a browser (`evg:gestures:check` is the precedent) |
| the binary record grows | an older reader misreads a frame | it does not grow: the view rides on the envelope. `sceneStride` derives the width and refuses a narrower record with both numbers in the message |

---

## 10. Alternatives, and why this one

* **Move the engine to a Worker** (`gl/evg-engine.js`, PLAN_NATIVE_HOSTS S1).
  Takes the cost off the UI thread; does not remove it. A 87 ms frame stays 87
  ms of somebody's CPU, and the pan still lags by one frame. Composes with
  this design rather than competing: a Worker that need not rebuild has
  nothing to send.
* **Render to a texture and scale that** (a tile cache). Cheap to draw, and
  every zoom is a resample: text goes soft immediately rather than at the band
  edge, and the memory is the whole board at device resolution.
* **Keep the per-element commands and re-emit them** (the fragments mechanism,
  already in `EVGDisplayList`). It cannot survive a view change today,
  because what it keeps is in device space — the commands it re-emits would be
  transformed a second time. In scene space that objection disappears, which
  makes the view the thing that unlocks fragments for canvases, and fragments
  the answer to "one node moved, nothing else did".
* **Do nothing and flatten less.** That was the last three commits, and it
  bought 20×. It runs out here: what is left per frame is the frame itself.

---

## 11. Stages

| | what | gate | state |
| --- | --- | --- | --- |
| **S0** | `setView` on `EVGDisplayList`, carried by `toJson`/`toBinary`; `uView` in the two WebGL shaders; `frame.draw(shifts, view)` | every existing consumer byte-identical (identity view); a kept frame drawn at a new view matches a rebuilt list pixel for pixel (`evg:binary:check` gains the view; a pixel diff on the figma board) | **done** — `evg:view:check`, 31 checks, worst channel difference 0 |
| **S1** | the keep/rebuild policy as a host helper in `gl/` — region, band, and "rebuild now" — with the figma viewer on it | a headless check of the policy alone (no browser), and the board's pan frame at ~18 ms with the same pixels | **done** — `gl/evg-view.js` and `evg:view:policy` (30 checks); the figma viewer pans on a kept frame |
| **S2** | rangerflow on it: `FlowView` builds in world space, the camera leaves its painting code | its smoke test, and the minimap (which draws the *same* scene at another view — a second view, free) | **done** — in three frames rather than one, see below |
| **S3** | markdown's scroll on it: `frame()` stops copying and offsetting the document list | `markdown:web:test`, and the caret still lands where it is clicked | **done** — and the caret is now a list of its own |
| **S4** | layer shifts expressed as views; the native painters (Apple, Android, SDL) take a CTM | `rt:scroll` and `rt:frame` on both hosts | not started |

**S2 came out as THREE frames, not one.** The design assumed a canvas is a
scene with a camera on it. RangerFlow is three things at three different rates,
and the split is the interesting part of the stage:

| | what | in | rebuilt when |
| --- | --- | --- | --- |
| the pattern | the paper and the dot grid | screen pixels | the zoom or the window changes — a pan SLIDES it, because a pattern moved by one of its own periods is itself |
| the diagram | lanes, edges, nodes, labels | flow units, with the camera beside them | the graph changes, or the view leaves the band or the region |
| the chrome | rulers, minimap, ports, grips, buttons | screen pixels | every frame; it is a few dozen commands and all of it moves when the view does |

Two things had to be said out loud that the baked walk got for free, and they
are `FlowView.drawn` and `FlowView.hair`: **whether a thing is worth drawing is
a question about screen size** (a label at 1.2 pixels is mush whatever the model
says, so every level-of-detail test asks `drawn(len)`), and **a hairline is a
pixel, not a flow unit** (`hair(px)` divides by the zoom the frame is built at).
Everything else — a border, a row height, a font size — was already a flow
length going through `sl`, and those needed no change at all.

The grid is the reason for the third frame. Built into the diagram's list it
would cover the region rather than the window: nine times the dots, rebuilt on
every click — 1.2 MB of display list for one PlantUML diagram, measured. As its
own periodic frame it costs what it always did and a pan does not touch it.

Not done in S2: **the minimap is still drawn the long way**, as its own dots
rather than as the diagram's frame at a second view. The frames are there now,
so it is a small change, but it is a change to the minimap rather than to the
camera and nothing depends on it.

**Two bugs only a pixel could find**, both caught by the page's own
camera-against-baked comparison and both fixed here:

* **A camera written to two decimals.** `EVGDisplayList.toJson` wrote the view
  through `num`, which rounds to a hundredth — right for a coordinate, wrong
  for a SCALE that multiplies every coordinate in the list. A zoom of 0.4053
  came out as 0.41 and drew the diagram 1.2% too large: eight pixels of slip at
  the bottom of the canvas, and invisible at zoom 1, which is where every check
  had been looking. `EVGDisplayList.fine` writes six decimals, and the view is
  the only thing that uses it. (The binary bridge was never affected: it carries
  doubles.)
* **A hairline floor measured in the wrong space.** The painter widens a stroke
  to three quarters of a PIXEL so a thin line does not fall between samples —
  but it applied that floor to the list's own units, and a list with a camera is
  in scene units. A 1.5-unit edge on a diagram at 0.17 is a quarter of a pixel:
  the floor never applied, and every line came out a third as dark as the same
  diagram drawn without a camera. `strokeTriangles` now takes the scale the
  frame is built at.

S0 is the only stage that touches the engine's contract, and it is additive.
S1 is where the frames come from. Everything after it is a host choosing to
stop doing arithmetic it no longer has to do.
