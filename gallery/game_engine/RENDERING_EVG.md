# EVG as the game-engine rendering layer

> Follow-up to [`PLAN_GAME_ENGINE.md` §5–6b](./PLAN_GAME_ENGINE.md). The base
> ships with a cell-grid terminal renderer. This document specifies the
> **richer, easier-to-program rendering layer** built on the gallery's existing
> **EVG** (vector graphics) + `l`/JSX engine + TrueType font stack, and the path
> to a **WebGL/GLES2** GPU backend for the Raspberry Pi.

## 1. Why reuse EVG instead of hand-writing pixels

Section 5 of the plan proposes a small imperative `Renderer` (`fillRect`,
`blit`). That works, but the gallery already contains a **mature 2D vector
renderer** that produces an RGBA pixel buffer — i.e. exactly a game framebuffer
— with features that would take a long time to re-implement:

| Capability | Where it already lives | Game use |
|-----------|------------------------|----------|
| RGBA pixel buffer (`getRawBuffer():buffer`) | `src/raster/RasterBuffer.rgr` | the frame you blit to HDMI |
| Filled/stroked rect, rounded-rect, circle, ellipse, AA lines | `src/raster/RasterPrimitives.rgr` | sprites, shapes, bars |
| Linear & radial **gradients** | `src/raster/RasterGradient.rgr` (`EVGRasterRenderer.renderLinearGradientRect…`) | backgrounds, glows |
| **Shadows** (gaussian blur + offset) | `src/raster/RasterBlur.rgr` (`RasterShadow`) | drop shadows, bloom |
| **Transparency / alpha compositing** | `src/raster/RasterCompositing.rgr` (`RasterCompositor`) | HUD panels, fades |
| **SVG path** parsing & fill | `gallery/evg/SVGPathParser.rgr` | vector sprites, icons |
| **TrueType font** rendering | `src/fonts/TrueTypeFont.rgr`, `FontManager.rgr`, `src/raster/RasterText.rgr` | real text, any TTF |
| **Flexbox layout** | `gallery/evg/EVGLayout.rgr` | menus, HUD, dialogs |
| **Declarative `l`/JSX** scene tree | `src/jsx/ComponentEngine.rgr`, `JSXToEVG.rgr`, `EvalValue.rgr` | describe UI as components |
| Output backends (PDF/HTML/PNG/PPM) | `src/core/EVG*Renderer.rgr`, `src/raster/PNGEncoder.rgr` | tooling / screenshots |

`EVGRasterRenderer` (`src/raster/EVGRasterRenderer.rgr`) already ties primitives
+ gradients + shadows together and exposes `init(w,h)`, `clear(r,g,b,a)`,
`fillCircle/fillRoundedRect`, `renderLinearGradientRect`,
`renderRoundedRectWithShadow`, and **`getRawBuffer():buffer`** — the RGBA bytes
we hand straight to the display.

The gallery "book" sample (`gallery/pdf_writer/examples/test_simple.tsx` —
*"The Adventures of Little Fox"*) shows the declarative style already working:
JSX components with `flexDirection`, `flex`, `marginTop`, custom `fontFamily`,
and images, rendered through this exact stack.

## 2. Two authoring styles, one framebuffer

The game builds each frame into an `EVGRasterRenderer` buffer; the platform
layer just blits it. Two complementary ways to author a frame:

* **Imperative (hot path — the game world).** Call `EVGRasterRenderer`
  primitives directly from the platform `draw(game)` method. Cheap, allocation-
  free, ideal for the many moving sprites.

  ```ranger
  r.clear(20 24 40 255)
  r.renderLinearGradientRect(0 0 W H 90.0 10 20 60 40 60 120)   ; bg
  r.renderRoundedRectWithShadow(px py 6 40 3 220 220 220 255 0 0 0 120 6 2 2) ; paddle + shadow
  r.fillCircle(bx by 6 240 240 120 255)                          ; ball
  ```

* **Declarative (UI — menus, HUD, dialogs, story screens).** Author `l`/JSX
  components that produce an `EVGElement` tree; `EVGLayout` does flexbox, and the
  renderer rasterizes it. This is the "book example" pattern applied to game UI:

  ```tsx
  function HUD({ p1, cpu }) {
    return (
      <View flexDirection="row" padding="8px" background="#0008">
        <Label fontFamily="PressStart2P" color="#fff">{p1}</Label>
        <Label flex="1" />
        <Label fontFamily="PressStart2P" color="#fff">{cpu}</Label>
      </View>
    );
  }
  ```

Gameplay logic (`Pong.step`) stays pure regardless of style: it only mutates
state; the platform's `draw` step reads that state to build the EVG frame.

## 3. Present path per platform (blit the RGBA buffer)

`getRawBuffer()` returns tightly packed RGBA8888. Each backend uploads it:

| Platform | Present |
|----------|---------|
| **Raspberry Pi (SDL2)** | `SDL_UpdateTexture(tex, NULL, raw, W*4)` → `SDL_RenderCopy` → `SDL_RenderPresent`. Streaming texture, HDMI via KMS/DRM. |
| **Web / desktop dev (canvas)** | `ctx.putImageData(new ImageData(rawClamped, W, H), 0, 0)` (or upload as a GL texture). |
| **Terminal (zero-dep bring-up)** | downsample the RGBA buffer to a coarse cell grid + ANSI 24-bit colour (`\x1b[48;2;r;g;bm`) — lets the EVG frame show on the Pi console before SDL is wired up. |

Only ~one new operator family is needed (see plan §6): `gfx_present_rgba(buf w
h)` whose `llvm`/`cpp` templates call a new `runtime/ranger_gfx.c` (SDL2) and
whose `es6` template does `putImageData`. Everything above it is pure Ranger.

## 4. Fonts — same text on Mac and Pi

`FontManager` + `TrueTypeFont` load any `.ttf` and `RasterText` rasterizes glyph
runs into the buffer. Because it is pure Ranger (no platform font APIs), text
looks **identical** on the Mac dev build and the Pi native build — important for
deterministic golden-frame tests. Bitmap/pixel fonts (e.g. `PressStart2P`) give
a crisp retro look on a TV; glyphs can be cached to a texture atlas for the GPU
path.

## 5. `evg_c` (embedded JS) vs the native Ranger route

[`terotests/evg_c`](https://github.com/terotests/evg_c) drives EVG from an
**embedded JS engine**. For this game engine the **native Ranger `l`/JSX engine
is the better fit**:

* **One language, one binary.** `ComponentEngine` + `JSXToEVG` are already
  Ranger; compiled to native they need **no embedded JS runtime** on the Pi
  (smaller, faster boot, less memory — matters on a Pi).
* **Deterministic & portable.** Same integer/vector code on every target, so
  record/replay and golden frames hold across Mac↔Pi.
* **Easy to modify.** The engine is plain Ranger source in the gallery — extend
  attributes/components without touching a C/JS embedding boundary.

`evg_c` remains a useful reference for the C-side embedding/perf tricks and for
a JS-authored content pipeline, but the on-device renderer should stay
Ranger-native.

## 6. WebGL / GLES2 optimization (the GPU path)

The software rasterizer is fine for HUD/2D and initial bring-up, but full-screen
gradients, shadows (blur), and lots of alpha compositing are the expensive parts
— and they map perfectly to a GPU. Plan:

* **Keep the scene API identical.** Introduce an `EVGRenderer` interface that
  `EVGRasterRenderer` (software) and a new `EVGGLRenderer` (GPU) both implement.
  Game/UI code does not change.
* **Primitives → GPU.** Rects/rounded-rects/circles as textured quads or SDF
  shaders; gradients as a fragment shader (no per-pixel CPU loop); shadows as a
  separable gaussian-blur shader; alpha via GL blending; the RasterBuffer
  becomes a GL texture / FBO.
* **On the Pi:** **OpenGL ES 2.0** on the VideoCore GPU through an SDL2 GL
  context (`SDL_GL_CreateContext`). On the web: **WebGL** from the `es6` backend
  (same shaders/GLSL ES). New operators `gl_*` mirror the `gfx_*` family.
* **Batching:** one draw call per material/atlas; glyphs and sprites share a
  texture atlas.
* **Hybrid:** rasterize static/complex vector UI once to a texture (CPU EVG),
  then composite it cheaply on the GPU each frame; animate the world on the GPU.

## 7. Performance & determinism notes

* Gameplay stays **integer/deterministic**; rasterization/GPU float math is a
  presentation detail and never feeds back into logic — determinism preserved.
* Render on the frame thread; use **dirty regions** (or full-clear on the GPU).
* Target 60 fps at 720p for the software path on a Pi 4 for modest scenes; use
  the GLES2 path for 1080p + full-screen effects.

## 8. Prerequisites / known gaps (Phase 0)

Wiring EVG in requires first getting the EVG tooling to build in this repo
snapshot. Observed while prototyping:

* `EVGRasterRenderer`'s transitive imports fail to compile here with a
  `function variable not found writeByte` name-resolution error (reproduce:
  compile any file importing `src/raster/EVGRasterRenderer.rgr` with
  `RANGER_LIB=./compiler/Lang.rgr`). `Buffer.writeByte` exists in
  `src/core/Buffer.rgr`, so this is a resolution/rename issue.
* The tree is mid-rename: `PLAN_*` docs reference `src/l/` while the code is
  `src/jsx/` — align these before depending on the module paths above.

These are pre-existing EVG-tooling issues (not part of the game base) and are
the first task before a working EVG game frame can be committed.

## 9. Roadmap

1. **Phase 0 — fix EVG build** (`writeByte` resolution; `src/l`↔`src/jsx`).
2. **Phase 1 — software EVG frame.** `EVGRenderer` interface; port Pong's `draw`
   to `EVGRasterRenderer`; `gfx_present_rgba` operator + `runtime/ranger_gfx.c`
   (SDL2) and `es6` canvas backend. Terminal downsample fallback.
3. **Phase 2 — declarative UI.** HUD/menu/pause components via `l`/JSX +
   `EVGLayout`; custom TTF fonts; golden-frame tests (Mac↔Pi identical).
4. **Phase 3 — GPU.** `EVGGLRenderer` on GLES2 (Pi) / WebGL (web); gradient +
   blur shaders; texture atlas for glyphs/sprites; batching.
