# Progressive loading for Ranger web apps

Status: **design only**. Nothing here is implemented. The numbers are measured
on this tree at the commit this file was added; every one of them is
reproducible with the commands in [Appendix A](#appendix-a--how-the-numbers-were-taken).

The subject is not RealTrainer. RealTrainer is the *case*, because it is the
biggest Ranger app that ships to a browser and because its page is deployed at
`/realtrainer/`. The question is what a Ranger app's arrival on the web should
look like in general — from the JavaScript backend and from the WebAssembly
one — and what has to exist in the compiler, in EVG and in the host pages for
that to be the default rather than a per-app trick.

---

## 1. What ships today

One build, one file, one gate.

| Artifact | raw | gzip |
|---|---:|---:|
| `bin/RealTrainerDemo.cjs` (the whole app, Ranger → JS) | 2 486 555 | 442 692 |
| `web/realtrainer.css` (inlined into the bundle as a string) | 91 684 | 16 408 |
| `fixtures/reference/seed.json` (inlined as a string) | 407 392 | — |
| the two statechart JSONs (inlined) | 22 002 | — |
| EVG painter + host modules | 138 557 | — |
| **`bundle.js`, everything above** | **≈3 200 000** | **≈600 000** |

`web/build.mjs` does not minify. The page loads exactly one script; the browser
has nothing to paint from until all ~600 KB has arrived, been parsed and been
executed.

Inside that 2.49 MB of generated app code, by class:

| Group | bytes | share |
|---|---:|---:|
| Vega-Lite (`Vl*`: compiler, runtime, scales, axes, legends, marks) | 869 780 | 35 % |
| the app itself (`RealTrainerDemo`, parsers, screens) | 638 393 | 26 % |
| EVG (element, layout, stylesheet, display list, host tree) | 414 762 | 17 % |
| fonts and software raster (`TrueTypeFont`, `SoftCanvas`, rasterisers) | 157 703 | 6 % |
| UI controls | 95 040 | 4 % |
| everything else | 310 877 | 12 % |

Vega-Lite is a third of the download and is needed by *chart screens only*. The
TrueType and software-raster stack is dead weight in this build specifically:
the browser host installs `installCanvasMeasurer` and paints through WebGL, so
the font parser and the CPU rasteriser never run.

Once the bytes are there, boot is a straight synchronous line (desktop V8,
warm; a mid-range phone is roughly 4–6×):

```
  64 ms  require: parse + execute the module
   4 ms  new RealTrainerDemo()
  30 ms  init(css, compact)          ← 92 KB of CSS parsed at runtime, every load
   7 ms  loadPlanMachine + loadChatMachine
  33 ms  loadReference(seed 407 KB)  ← a year of data, before the first pixel
  16 ms  setPageSize + openRoute
  59 ms  first display list
 218 ms  TOTAL
```

And then the app plays a **2600 ms** loader animation (`fillMs` in
`RealTrainerDemo.rgr`) plus a hold. The loading screen is inside the payload it
is supposed to cover: it starts after the waiting is over.

### 1.1 The flicker, specifically

Three separate things, all visible on `/realtrainer/`:

1. **The page shell paints and is then removed.** `index.html` ships a
   `<header>` and an `<aside>` full of prose, styled visible. They paint the
   moment the HTML parses — within one RTT. `main.js` then adds
   `document.body.classList.add("fit")`, which sets `display: none` on both.
   Between those two moments sits the whole 600 KB download and the 218 ms
   boot. So the first thing a visitor sees is a paragraph of English about the
   ring, for as long as a second, and then it vanishes. This is the flash, and
   it is unrelated to Ranger, EVG or WASM.
2. **The stage has no size until JS gives it one.** `#stage` holds an unsized
   `<canvas>`; the canvas is measured and sized in `sizeCanvas()`. The layout
   jumps when it arrives.
3. **Nothing is on the canvas until the app exists.** There is no first
   picture that is not the app's own.

(1) and (2) are page bugs and cost a few lines. (3) is the design question this
document is about.

---

## 2. What "fast" should mean

A single number ("time to load") is what produces the all-or-nothing build. The
target is a **ladder**, with a budget for each rung, gated in CI:

| Rung | What the visitor has | Budget on the critical path |
|---|---|---|
| **T0 — a picture** | the real first screen, correct in colour and layout; not a spinner | ≤ 10 KB gzip, 0 script execution |
| **T1 — a live screen** | that screen scrolls, hovers, presses, routes | ≤ 120 KB gzip |
| **T2 — the app** | every route, charts, editors, the year of data | streamed after T1, invisible |

The web's advantage over a single-artifact runtime (Flutter, a monolithic
`.wasm`) is that T0 and T1 can be *different artifacts*, and T0 need not
contain a runtime at all. The reason that is available to Ranger and not to
most of them is specific and worth naming:

> **An EVG frame is data.** `EVGDisplayList` is rects, borders, clips, paths
> and text runs in paint order. `toJson()` and `toBinary()` already exist,
> `evg-binary.js` already reads a list nobody computed on this thread, and
> `shot-svg.mjs` already turns a list into SVG with no GPU. So the first
> picture of a Ranger app is a **build artifact**, not a runtime output.

That single fact is what the rest of this plan spends.

---

## 3. Strategy A — the baked first frame (the "EVG first" rung)

Compute the first screen at build time; ship the frame, not the machine that
computes it.

Measured, for the phone Home screen (390×844, 542 commands):

| Form of one baked frame | raw | gzip |
|---|---:|---:|
| display list as JSON | 15 210 | 3 539 |
| the same frame as SVG (`shot-svg.mjs`) | 69 292 | 7 752 |
| the WebGL painter that could draw it (`evg-webgl` + `evg-binary` + `evg-list`) | 97 577 | 32 493 |

Two variants, and they are not exclusive:

**A1 — inline SVG, zero JavaScript.** The baked frame goes into `index.html` as
inline SVG. It paints during HTML parsing, in the first RTT, with no script,
no WebGL context and no font work. 7.7 KB gzip buys the actual first screen of
the actual app. `shot-svg.mjs` is the generator and it exists today.

**A2 — the painter and a list.** 32 KB gzip of painter plus 3.5 KB of list
paints the same frame on the GPU before the app exists, and — more usefully —
gets the GL context created, the shaders compiled and the atlases uploaded
while the app is still downloading. That warm-up is otherwise paid *after* the
app arrives, at the worst possible moment.

The sensible combination is A1 for T0 (nothing beats HTML parsing) and A2
folded into T1, since the painter is needed there anyway.

**What has to be decided.**

- *A frame is baked for a size.* Bake per breakpoint bucket, not per pixel —
  the stylesheet's own `@media` boundaries are the bucket edges (768 px here),
  so two or three buckets cover it. Selection with a CSS media query and no
  script. Cheaper still: bake only the **shell** — background, header bar,
  nav rail or bottom bar — which is the layout-stable part, and let content
  arrive with T1.
- *A frame is baked for a theme.* Bake the default and the
  `prefers-color-scheme` counterpart; that is a media query too.
- *A frame is baked for a route.* Bake the entry routes only (`/`, and
  whatever the deployment links to). Everything else is a T1 concern.
- *Drift is the real risk.* A baked picture that no longer matches the app is
  worse than no picture. The defence is the one this repo already uses
  everywhere: a gate. `frame-check.mjs` drives the real app to its first frame;
  the gate asserts the baked list equals it, command for command, and fails the
  build otherwise. The baked artifact is then not a copy of the app, it is a
  *projection* of it, checked on every push.
- *Handover.* Cross-fade, or better: hold the baked layer until the app's first
  real list has been painted once, then remove it in the same frame. Because
  both sides are the same list, a correct handover is invisible — there is
  nothing to interpolate.

---

## 4. Strategy B — splitting the Ranger output

This is the rung that decides T1, and the only one that generalises to every
Ranger web app.

### 4.1 The output is already splittable

`bin/RealTrainerDemo.cjs` is 347 top-level `class` declarations, a block of
static method assignments, and `module.exports.*` at the end. **There is no
module-level work.** Nothing runs when the file is evaluated except defining
things. The only ordering constraint is `class X extends Y` (72 of them).

That means splitting is a mechanical transform on the output, not a language
redesign, and it can be built and measured before any compiler change is made.

### 4.2 Where the boundary should be

Not by hand. Profile it, using the harness that already exists:

1. Run `frame-check.mjs` / `loader-check.mjs` under V8 precise coverage
   (`Profiler.startPreciseCoverage`, or `NODE_V8_COVERAGE`).
2. The functions executed up to the **first interactive frame** are the hot
   set. Their classes are the entry chunk.
3. Everything else is cold, grouped into chunks by what pulls it in: charts,
   the raster/PDF path, the editor dialogs, the non-entry routes.
4. The profile becomes a checked-in manifest, and a gate fails when the hot set
   grows — the same discipline as the existing oracle checks.

On the numbers above, the obvious first cuts are Vega-Lite (870 KB raw) and the
font/raster stack (158 KB raw), neither of which is on the path to a first
frame. That alone is ~40 % of the app bundle.

### 4.3 Three mechanisms, in increasing cost and durability

**B1 — post-build splitter (prototype).** A tool that reads the generated file,
groups classes per the manifest and emits one entry module plus N chunk
modules. References to a cold class are the only hard part: turn top-level
`class X {…}` into a binding the chunk can fill (`let X;` in the entry, assigned
by the chunk on load). Call sites that construct a cold class must first await
its chunk — in practice that is *route entry* and *dialog open*, a handful of
places, and the host can own the await. Cheap, reversible, and it produces real
numbers to argue the compiler change with.

**B2 — a host-side chunk registry.** Formalise B1: a manifest maps chunk → the
symbols it defines, the host exposes `ensure(chunk)`, and the app calls it at
the seams it already has (routing, dialog open). Nothing in the language
changes; the app gains one asynchronous boundary it did not have.

**B3 — compiler support (the durable answer).** `bin/output.js` already
computes what to export. Give it a declared deferral — an annotation on a class
or a manifest naming deferred roots — and let it emit an entry file, N chunk
files and a manifest, with the reachability analysis on its side of the fence.
Then every Ranger web app gets the ladder by building, and the WASM backend can
share the same manifest (§6).

Note what stays honest: one source tree, one compile, one semantic. Chunking is
an *output* concern, exactly like `-l=js` vs `-l=cpp`.

---

## 5. Strategy C — the boot line itself

Splitting code is half of it. The boot sequence in §1 is the other half, and
it is cheaper to fix.

**C1 — data out of the code.** `seed.json` is 407 KB of reference data pasted
into a JavaScript string literal, parsed before the first frame, for 33 ms.
It should be a separate file, fetched in parallel with the code, and applied
*after* the first interactive frame. The first screen needs the current
route's slice, not a year. Same for the two statechart JSONs: they belong to
dialogs, so they should load when a dialog does.

**C2 — the stylesheet as an artifact, not as text.** 92 KB of CSS is parsed at
runtime on every load on every device, for 30 ms, to produce a deterministic
result. Serialise `EVGStyleSheet` after parsing — the machinery to think about
this exists (`EVGStyleCache`) — and ship the serialised form; parse text in
development only. This is the same move as the baked frame, one level up:
compute at build time what does not depend on the visitor.

**C3 — the loader should cover a wait, not follow it.** `fillMs = 2600` is a
scripted animation played when nothing is loading any more. Drive the ring from
real progress — chunk arrivals, seed applied — and let it end when the work
ends. With T0 in place there may be nothing left to cover at all, which is the
better outcome: the ring becomes a demo of EVG rather than a fixture of the
product.

**C4 — the page shell.** Default the page to its `fit` layout in CSS and let
`?page=WxH` opt *out*, rather than the reverse; give `#stage` its size in CSS
so nothing jumps. This removes the visible flash described in §1.1 and is a
handful of lines.

**C5 — the transport basics.** `minify: true` in `build.mjs` (it is off).
Separate, content-hashed files for painter / app / data so a change in the app
does not invalidate EVG, and so V8's code cache survives a deploy. `modulepreload`
for the painter and `preload` for the baked frame.

---

## 6. Strategy D — the thread split (half-built already)

`?engine=worker` exists and is checked: `main-worker.js` is a host that owns
the canvas and nothing else, `engine-worker.js` holds the app, and what crosses
is `EVGDisplayList.toBinary()` — three `Int32Array`s and a string pool,
transferred rather than copied. The protocol already distinguishes a new build
from a `shift` (the kept list moved — a scroll) from `idle`.

Made the default, that seam pays twice:

- the app's 440 KB gzip of parse and its 218 ms of boot happen where they
  cannot delay the first paint or block the compositor;
- the main thread holds the painter and the baked frame, so T0 is on screen
  and *scrolling* — the `shift` reply is the whole mechanism — while the app is
  still starting.

What has to be decided is what the host may answer synchronously. It currently
cannot read anything without a round trip; the text-input bridge and the hit
test are the places that notice. Both already have worker-side answers, so
this is a question of making the worker path the checked one rather than the
alternative one.

---

## 7. Strategy E — the same ladder for the WebAssembly builds

`/pptx-wasm/` compiles Ranger → C++ → WASM with `-O3 -s MODULARIZE=1
-s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=64MB`. A WASM build is *more*
all-or-nothing than the JS one: nothing at all happens until the module is
compiled and instantiated, and 64 MB is reserved up front on a phone that may
not want to give it.

What transfers directly:

- **T0 does not involve WASM.** The baked frame (§3) is HTML and SVG. It paints
  while the module is still streaming. This is the entire answer to "why not
  just do what Flutter does": Flutter cannot show its first screen without its
  engine; a Ranger app can, because its first screen is data.
- **`instantiateStreaming`** — compile while downloading, rather than after.
- **Profile-guided module splitting.** Binaryen's `wasm-split` does for WASM
  exactly what §4.2 describes for JS: instrument, record which functions run
  during startup, emit a primary module with those and a secondary module
  loaded lazily behind stubs. The profile can come from the same headless
  checks. Emscripten's `MAIN_MODULE`/`SIDE_MODULE` dynamic linking is the
  coarser alternative when the boundary is a whole subsystem (charts, the PDF
  writer) rather than a function set.
- **Memory.** Start small and grow, unless a measurement says the growth
  reallocations cost more than the reservation.

If B3 lands, the deferral manifest is backend-independent: the same declaration
that produces JS chunks produces the `wasm-split` profile.

---

## 8. The alternative that was raised: streaming the display list from a server

Worth stating plainly, because the format makes it genuinely available: a
screen's display list is **3.5 KB gzip**. Streaming screens from a server is
technically cheap and the wire format is already written and already checked
(`evg-binary.js`, `list-binary-check.mjs`).

It is still the wrong default here:

- it needs a server, so the deployment stops being a static directory, and
  GitHub Pages stops being sufficient;
- every screen costs a round trip (50–200 ms) where a local layout costs one
  frame (~16 ms) once the app is warm;
- it splits the product into two programs that must agree, which is the
  problem this repo's whole one-source-tree discipline exists to avoid;
- offline and back/forward stop working for free.

The useful half of the idea is exactly Strategy A: **precompute the frames at
build time and serve them as static files.** That is server-side rendering
without a server. And because the format is the same one a server would send,
the door to real streaming stays open for the case that actually needs it —
a screen whose content is not knowable at build time.

---

## 9. Proposed order

Cheap and certain first; nothing later depends on a bet made earlier.

| # | Work | Buys | Risk |
|---|---|---|---|
| 1 | C4 + C5: page shell, minify, split files, preload | kills the visible flash; ~30–40 % off the wire for free | none |
| 2 | Drop the TTF/raster stack from the browser build (dead code there) | ~158 KB raw | low |
| 3 | A1: baked first frame inline, with the drift gate | **T0** — a real picture in one RTT | low; gate makes it safe |
| 4 | C1 + C2: seed and stylesheet out of the boot line | ~60 ms and 400 KB off the first frame | low |
| 5 | §6: `?engine=worker` becomes the default | the app's parse and boot stop blocking the first paint and the compositor | medium; the worker host exists and is checked |
| 6 | §4 B1 → B2: profile-guided split, charts and cold routes out of the entry chunk | **T1** at budget | medium |
| 7 | §4 B3: chunking in the compiler, with a manifest | every Ranger web app gets the ladder | large, but it is the point |
| 8 | §7: streaming instantiation and `wasm-split` for the WASM builds | the same ladder on the other backend | medium |

Step 5 is listed after the frame work deliberately: a worker moves the boot off
the main thread, but with T0 in place there is a picture on screen regardless,
and the two compose.

## 10. What to measure, and where the gate goes

The repo's habit is that a claim is a check. The same applies here:

- **bytes on the critical path per rung**, asserted against a budget file —
  entry chunk, baked frame, painter;
- **time to first pixel** and **time to first interactive frame**, taken in
  headless Chrome by the existing `frame-check.mjs` harness with the network
  throttled to a fixed profile, so the number means the same thing twice;
- **the hot set**, from the coverage profile: a gate that fails when a class
  that was cold becomes reachable from the entry chunk. That is the check that
  keeps the split from rotting, and without it the split *will* rot.

---

## Appendix A — how the numbers were taken

```sh
npm run rt:build                       # gallery/realtrainer/bin/RealTrainerDemo.cjs
stat -c%s  gallery/realtrainer/bin/RealTrainerDemo.cjs
gzip -9 -c gallery/realtrainer/bin/RealTrainerDemo.cjs | wc -c

# class-by-class sizes of the generated output
awk '/^class /{if(n)print len" "n; n=$2; len=0} {len+=length($0)+1} END{if(n)print len" "n}' \
  gallery/realtrainer/bin/RealTrainerDemo.cjs | sort -rn | head -25

# one frame as SVG, and as a display list
node gallery/realtrainer/web/shot-svg.mjs --out /tmp/svgout
```

The boot timings come from requiring the built module in Node and marking each
call in the sequence `web/main.js` performs (`init`, `loadPlanMachine`,
`loadChatMachine`, `loadReference`, `setPageSize`, `openRoute`, `tick`,
`displayListJson`), at 390×844 on route `/`. Node on this machine, warm; treat
them as a lower bound for a phone.
