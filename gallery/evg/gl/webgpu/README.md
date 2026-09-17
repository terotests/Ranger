# SPIKE — EVG on WebGPU

**Question.** EVG draws in the browser through WebGL 2
([`../evg-webgl.js`](../evg-webgl.js)). Would WebGPU draw it faster, would it
help on a phone, and does WASM belong anywhere near it?

**Answer, in one line.** WebGPU builds a frame **1.5–2.5×** faster and pays
**3.7× less per run**, which matters on a page with many clips and does not
matter on a page with few; on the redraw of a simple frame WebGL is still
ahead; and the largest single cost in either painter is JavaScript that neither
API touches — which is where WASM comes in, and where the next experiment
should go.

**Status.** Research. Not for merging as it stands: it draws six of the eight
command kinds and nothing in the repository uses it. What it is for is the
numbers below and the four things it found out the hard way.

---

## What is here

| file | what it is |
|---|---|
| [`evg-webgpu.js`](evg-webgpu.js) | the painter — 775 lines against the WebGL painter's 2531, because it draws six command kinds and that one draws eight plus blur, ripple and paths |
| [`scenes.js`](scenes.js) | display lists made rather than captured, with the two knobs the question needs: quads, and runs |
| [`page.html`](page.html) | both painters in one page, timed. Open it on a phone |
| [`bench.mjs`](bench.mjs) | the same page driven headlessly, as a table |
| [`parity.html`](parity.html) / [`parity.mjs`](parity.mjs) | the same list through both, read back and differenced, with PNGs |
| [`harness.mjs`](harness.mjs) | how to get a Chromium that actually has WebGPU on a machine with no GPU |

```sh
npm run evg:webgpu:bench                     # the table below
npm run evg:webgpu:parity                    # 15 scenes, pixel for pixel
npm run evg:webgpu:serve                     # a URL to open on a phone
node gallery/evg/gl/webgpu/parity.mjs --scene feature-gradient --shots /tmp/p
```

---

## The numbers

Chromium 141, SwiftShader, 320×240, medians of batched draws. **CPU-side
times**: building the frame, and encoding and submitting one. See
[what this machine cannot answer](#what-this-machine-cannot-answer).

| scene | quads | runs | build GL | build GPU | × | redraw GL | redraw GPU | × |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| grid-1k-1run | 1 144 | 1 | 2.400 | 1.000 | **2.40×** | 0.008 | 0.017 | 0.50× |
| grid-10k-1run | 11 430 | 1 | 8.700 | 3.500 | **2.49×** | 0.007 | 0.010 | 0.67× |
| grid-10k-100runs | 11 501 | 101 | 12.500 | 7.400 | **1.69×** | 0.203 | 0.060 | **3.39×** |
| grid-10k-1000runs | 12 001 | 1 001 | 11.000 | 3.700 | **2.97×** | 2.140 | 0.585 | **3.66×** |
| grid-10k-text200 | 11 630 | 1 | 10.900 | 6.800 | **1.60×** | 0.003 | 0.017 | 0.20× |
| grid-10k-shadows | 11 830 | 1 | 12.600 | 7.400 | **1.70×** | 0.003 | 0.013 | 0.25× |
| scroller-400 | 5 201 | 2 | 6.700 | 4.500 | **1.49×** | 0.007 | 0.012 | 0.57× |

Milliseconds. × above 1 means WebGPU is that many times faster.

**And it is the same picture.** Fifteen scenes read back from both painters and
differenced: every one within a rounding step, most of them at 0.00–0.03% of
pixels, the busiest at 1.08%. Nine of the fifteen are one feature each — flat,
alpha, radius, per-corner radius, gradient, border, shadow, rotation, text — so
a disagreement names the command that caused it rather than a percentage.

```
  PASS feature-gradient     9 quads in 1 runs — mean 0.01, 0.02% off, worst 39
  PASS grid-10k-1000runs    12001 quads in 1001 runs — mean 0.55, 1.08% off, worst 128
  PASS grid-10k-text200     11630 quads in 1 runs — mean 0.11, 0.28% off, worst 61
```

---

## What the numbers say

### 1. A run costs 3.7× less, and that is the real finding

The display list is drawn in **runs**: a clip, an image or a path ends the
batch being gathered, and each run is its own draw. WebGL 2 has no
base-instance parameter, so the painter walks all nine instance attributes and
re-points them at the run's first instance — nine `bindBuffer` +
`vertexAttribPointer` pairs, then a program bind, a VAO bind, a uniform and the
draw. **Twenty-two driver calls per run.** WebGPU's `draw()` takes
`firstInstance`, so a run is a scissor, sometimes a bind group, and the draw:
**three**.

Subtract the fixed per-frame cost and the per-run cost falls out:

| | fixed per frame | per run |
|---|---:|---:|
| WebGL 2 | ~5 µs | **~2.0 µs** |
| WebGPU | ~12 µs | **~0.55 µs** |

They cross at about **six runs**. Below that WebGL wins and the difference is
five microseconds, which is nothing. Above it WebGPU pulls away linearly: at
1 001 runs a redraw is 2.14 ms against 0.59 ms — 13% of a 60 Hz frame against
3.5%.

Which pages have many runs? Every one that clips: a datagrid (a clip per
column), a slide editor, a dashboard of cards, a document with nested
scrollers. `gallery/datagrid` is exactly this shape. Pages with few runs — a
poster, a chart, a PDF preview — get nothing here.

### 2. The build is 1.5–2.5× faster, and the reason is memory, not the GPU

The WebGL painter pushes onto nine JavaScript arrays and then copies each into
its own `Float32Array` and its own buffer: nine allocations, nine copies, nine
uploads. This writes 28 final floats per instance into one final
`Float32Array` and uploads it once — 112 bytes per quad, 1.28 MB for 11 000 of
them.

No GPU is involved in that difference. It is allocation and copying, and it
would be just as true of a WebGL painter that interleaved its attributes into
one buffer. **Some of this win is available without WebGPU at all**, and that
is worth knowing before anyone ports anything.

### 3. Render bundles do not help, and it is structural

A `GPURenderBundle` records the draw calls once and replays them with one
call, and the uniforms it reads are still written per frame — exactly the shape
of a scroll. It measured **the same** as re-encoding: 0.008–0.015 ms either
way. The per-frame cost is not the draw calls, it is the command encoder, the
render pass, the two `writeBuffer`s and the submit, and a bundle removes none
of them.

Worse, a bundle bakes its scissors, and a clip inside a scroll layer has to
move with the content. So bundles are usable exactly where there is nothing to
save (no clips) and unusable where the draw calls are actually many (clips).
`frame.canBundle` says so and `bundleDraw` falls back.

### 4. A simple redraw is cheaper in WebGL, and neither number matters

0.007 ms against 0.010–0.017 ms. WebGPU's fixed frame cost is roughly double
WebGL's because a frame is an encoder, a pass, two buffer writes and a submit
rather than a uniform and a draw. Both are under a fiftieth of a frame budget.
It is in the table because leaving it out would be dishonest, not because
anyone should act on it.

### 5. One number was a lie until it was fixed, and it is the interesting one

The text scene first measured **0.56×** — WebGPU nearly twice as slow. The
WebGL painter caches its atlas per context and appends to it; the spike rebuilt
and re-uploaded the whole atlas on every build. With the same caching it is
1.60×.

That is the shape of most "API X is slower" results, and it is a warning about
this whole document: a spike compares two implementations, and only some of
what it measures is the API.

---

## WASM

**Where WASM would help is not the painter.** The build breaks into three
parts, and the spike times them separately:

| scene | atlas | **pack** | upload | total |
|---|---:|---:|---:|---:|
| grid-10k-1run | 0.30 | **1.90** | 0.20 | 2.40 |
| grid-10k-100runs | 0.20 | **4.60** | 0.40 | 5.20 |
| grid-10k-text200 | 0.30 | **2.90** | 1.70 | 4.90 |
| grid-10k-shadows | 0.30 | **3.10** | 0.90 | 4.30 |
| scroller-400 | 0.20 | **2.20** | 0.30 | 2.70 |

- **atlas** is the browser rasterising text on a 2D canvas. Not ours, and
  cached.
- **upload** is the driver's.
- **pack** is **ours**: walking JavaScript command objects and writing 28
  floats each. **29–88% of the build**, and the single largest term in every
  scene.

Pack is pure array arithmetic over a flat structure with no DOM, no strings and
no allocation — the exact shape WASM is good at. And EVG is already positioned
for it: the layout and the display list are Ranger, Ranger compiles to WASM as
well as to ES6, `evg-binary.js` already reads a list that arrived as transferred
typed arrays, and `evg-engine.js` already runs the whole engine in a Worker.

So the honest ordering is:

1. **Have the producer write the instance buffer directly.** The display list
   already exists as typed arrays on the binary path; the painter then maps a
   GPU buffer and the producer writes into it. That removes `pack` from the
   main thread whether the painter is WebGL or WebGPU, and it is worth more
   than the API change on every scene above.
2. **Then** decide about WebGPU, on the numbers in §1 and §2.

**What this spike did NOT do:** compile anything to WASM. The claim above is a
measurement of what the JavaScript costs, not a demonstration that WASM is
cheaper. That is the next spike, and it is a bigger one — `gallery/pptx/web/wasm`
and `gallery/pptx/web/wasm-rust` are the two builds to copy from.

---

## Mobile

**This container cannot answer the mobile question and this document will not
pretend to.** There is no GPU here: both painters go through SwiftShader, a
software rasteriser, so every fill number is a CPU number and a phone's
tile-based, bandwidth-bound GPU behaves nothing like it.

What transfers to a phone is exactly what is measured above — the JavaScript
and the driver calls — and it transfers **amplified**: a phone's CPU is
several times slower than this container's, so 2.14 ms of run-switching becomes
perhaps 6–10 ms, which is most of a frame. The case for WebGPU is therefore
*stronger* on mobile than these numbers show, for the run-heavy pages and for
nothing else.

What does **not** transfer, and has to be measured on a device:

- fill rate and overdraw — the alpha-blended, discard-heavy fragment shader
  both painters run is where a mobile GPU actually spends its time, and
  `discard` defeats early-Z on tilers;
- whether the WGSL uniformity workaround below (two distance fields per
  fragment instead of one) costs anything real;
- power, which is the number that decides a scrolling app and which neither
  API's documentation will tell you;
- Safari. WebGPU shipped in Safari 26 (2025), so iOS is no longer a blocker —
  but it is a second implementation and it is unmeasured here.

To do it:

```sh
npm run evg:webgpu:serve
# open the printed URL on the phone, with this machine's address, and add
#   ?target=canvas&dpr=3&draws=120&flushed=1
```

`?target=canvas` draws into the real canvas — the path a page takes,
presentation included — and `&flushed=1` turns on the wait-for-the-GPU
measurement that is meaningless here and is the whole point there.

---

## What broke, and what it cost

Four things, none of them in the plan, all of them worth writing down.

**WebGPU into a canvas kills the GPU process under SwiftShader.** Not a shader
problem — a four-line clear does it. Rendering into a texture the page owns
works perfectly, and every WGSL feature this painter needs (a storage buffer
read in the vertex stage, `firstInstance`, `discard`, `fwidth`) was verified
against it. The bench therefore draws both painters into offscreen targets by
default and takes `?target=canvas` on hardware. Cost: an afternoon, because the
symptom is `OperationError: A valid external Instance reference no longer
exists`, which names nothing.

**Getting WebGPU at all took three separate discoveries.** `navigator.gpu` is
undefined on Playwright's `about:blank` (not a secure context) and present as
soon as the page is served; with no flags `requestAdapter()` resolves to null;
`--use-gl=swiftshader`, which the WebGL checks in this directory pass, does
nothing for WebGPU. The set that works is
`--enable-features=Vulkan --use-vulkan=swiftshader --enable-unsafe-webgpu`, and
it is written down in [`harness.mjs`](harness.mjs).

**WGSL rejects the shader GLSL compiles.** `textureSample` and `fwidth` must be
reached under *uniform* control flow, and this painter branches on an
interpolated `mode`. So every derivative is taken before the branches: a
rectangle now evaluates the shadow's distance field it will not use, and a
glyph evaluates both. One pipeline per mode would avoid it and would break the
single batch the painter exists to keep. The cost is unmeasured here — see
Mobile — and it is the one place WebGPU makes the shader worse.

**`performance.now()` cannot see a redraw.** It is coarsened to 100 µs outside
a cross-origin-isolated page, and a redraw costs 5. The first run of this bench
reported 0.100, 0.200 and 0.000 and looked like data. Everything is timed in
batches now.

And one that was the spike's own fault twice over: the first parity run was 30%
wrong because the scene put a thickness on a `RECT` (EVG emits a `BORDER`
command instead), and 39% wrong because `gd === 1` means *across* in the
display list and 2 in the shader. Both were found in minutes by the
`feature-*` scenes and would have been an afternoon each without them. **Write
the one-feature scenes first.**

---

## What is not in the spike

`IMAGE`, `PATH`, `STROKE`, backdrop blur, the ripple effect, colour emoji, and
a real clip stack beyond the intersected scissor. Each is a known shape of work
— an image is a second bind group per texture, a path is the same
stencil-then-cover with a depth-stencil attachment, blur is the same two-pass
reduction into a render target — and none of them changes the measurement, so
none was written twice.

The atlas is the spike's own, smaller implementation, sharing `fontSpec` and
`verbatim` with the WebGL painter so the comparison is about the API rather
than about two font-measuring implementations. That sharing is also the first
thing a real port would formalise: the shelf packer, the slot arithmetic and
the baseline rule belong in an `evg-text-atlas.js` that both painters import.

---

## Recommendation

**Do not port the painter yet.** The win is real but narrow — run-heavy pages —
and `evg-webgl.js` carries eight command kinds, blur, ripple and paths that
would all have to be written again and held against the same pixel tests.
Against that, WebGL 2 is on every browser that matters and this spike found no
case where it is *unusably* slow.

**Do three things instead, in this order:**

1. **Interleave the WebGL painter's instance data into one buffer.** Most of the
   1.5–2.5× build win in §2 is allocation and copying, not the API, and it is a
   contained change to a file that already has pixel tests.
2. **Have the producer write that buffer directly**, on the binary/Worker path
   that already exists. `pack` is 29–88% of the build and this removes it from
   the main thread — with or without WASM, and WASM after that.
3. **Run this page on a real phone** before anyone decides anything about
   mobile. It takes one command and it is the half of the question this
   container could not answer.

Revisit WebGPU when one of these is true: a page in the gallery is
run-bound in practice (the datagrid is the candidate — measure it, do not
assume); compute shaders start to look attractive for layout or for path
tessellation, which is the one thing WebGL cannot do at all; or WebGL 2 starts
being deprecated somewhere that matters. Until then the seam is what mattered,
and the seam held: a second GPU backend was 775 lines and no change above the
display list.
