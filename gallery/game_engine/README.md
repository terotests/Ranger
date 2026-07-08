# Ranger Game Engine base

A minimal, **portable** game-engine base whose goal is exactly the one in the
brief: write the game logic once in Ranger, iterate on a **Mac/desktop**, then
run the *same* logic as a **native binary on a Raspberry Pi driving a TV over
HDMI**, with room to add **game-controller** input.

The design is documented in [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md). The
LLVM backend bugs found (and fixed) while getting the native path working are in
[`LLVM_BUGS.md`](./LLVM_BUGS.md).

## The portability contract

The pure game logic lives once in [`pong_core.rgr`](./pong_core.rgr) and is
driven by two interchangeable backends:

| Part | File / classes | Touches I/O? | Portable? |
|------|----------------|--------------|-----------|
| **Game logic** | `pong_core.rgr` — `Pong`, `Buttons` | No | 100% — identical on every target |
| **Render layer** | `framebuffer.rgr` (`SoftCanvas`) + `pong_render.rgr` (`PongRenderer`) | No (writes an RGBA buffer only) | 100% — bit-identical frames everywhere |
| **Terminal backend** | `pong.rgr` — `Terminal` | Yes (ANSI draw + keys + timing) | desktop / Pi console |
| **SDL2 backend** | `pong_sdl.rgr` — `SdlBackend` + `gfx_sdl.rgr` | Yes (SDL2 window + keyboard) | **native window on macOS / Linux / Pi HDMI** |

`Pong.step(input:Buttons)` is pure: it reads an abstract controller snapshot and
advances the simulation. It never calls `write`, `move_cursor`, `poll_keypress`,
or `gfx_present`. That is what lets the exact same logic run under Node on your
Mac and as a native binary on the Pi. Motion uses **integer accumulators** (no
floats, no division), so the simulation is bit-for-bit deterministic across
targets and backends.

## How the engine is built

The engine is not a monolithic runtime library. It is a **thin stack of Ranger
files** that share one pure game core and swap only the platform boundary at the
bottom. The reference game is Pong, but the same layering is meant to carry over
to a real title (e.g. Koodisampo on the Pi).

### Layer stack

```
  ┌─────────────────────────────────────────────────────────────┐
  │  Platform backend (pick one)                                 │
  │  pong.rgr (terminal)  OR  pong_sdl.rgr (SDL2 window)         │
  │  — frame loop, input polling, timing, present to screen      │
  └───────────────────────────┬─────────────────────────────────┘
                              │ reads Buttons, calls step/draw
  ┌───────────────────────────▼─────────────────────────────────┐
  │  pong_core.rgr — Pong + Buttons                              │
  │  Pure simulation: paddles, ball, scoring, AI. No I/O.        │
  └───────────────────────────┬─────────────────────────────────┘
                              │ game state (ints, booleans)
  ┌───────────────────────────▼─────────────────────────────────┐
  │  pong_render.rgr — PongRenderer                               │
  │  Paints one frame into a SoftCanvas (RGBA byte buffer).      │
  └───────────────────────────┬─────────────────────────────────┘
                              │ raw RGBA pixels
  ┌───────────────────────────▼─────────────────────────────────┐
  │  framebuffer.rgr — SoftCanvas                                │
  │  Portable raster: clear, fillRect, fillCircle on `buffer`.   │
  └───────────────────────────┬─────────────────────────────────┘
                              │ (SDL path only)
  ┌───────────────────────────▼─────────────────────────────────┐
  │  gfx_sdl.rgr — gfx_open / gfx_present / gfx_poll_mask …      │
  │  C++ operator templates → tiny SDL2 shim (no Lang.rgr edit).  │
  └─────────────────────────────────────────────────────────────┘
```

**Rule of thumb:** if a file imports `write`, `poll_keypress`, or `gfx_present`,
it is a backend. If it only mutates `Pong` fields or writes pixels into
`SoftCanvas`, it is portable.

### One frame (SDL backend)

`SdlBackend.run()` in `pong_sdl.rgr` is the game loop:

1. **Input** — `gfx_poll_mask()` pumps SDL events and returns a bitmask; the
   backend maps that to a fresh `Buttons` snapshot (`up`, `down`, `quit`, …).
2. **Logic** — `game.step(btns)` advances the simulation by one tick. This is
   the only place game rules run.
3. **Draw** — `PongRenderer.draw(game, cv)` clears the `SoftCanvas`, paints
   walls/paddles/ball into the RGBA buffer, then `gfx_present(cv.raw(), w, h)`
   uploads the buffer to an SDL streaming texture and swaps the window
   (`SDL_RENDERER_PRESENTVSYNC` — no extra `SDL_Delay`; vsync paces frames).
4. **Repeat** until quit or an optional frame limit (for headless CI).

The terminal backend (`pong.rgr`) runs the same `Pong.step()` but draws via
`cellAt()` + ANSI escape codes instead of `SoftCanvas` + SDL.

### Motion: logic vs rendering

Ball speed uses **integer Bresenham-style accumulators** in `pong_core.rgr`:

- `axAcc` / `ayAcc` accumulate each frame by `vxMag` / `vyMag`.
- When an accumulator reaches `STEP` (3), the ball moves one **logical cell**
  and the accumulator wraps.

Collision and scoring use the cell-snapped `ballX` / `ballY` so every target
stays deterministic. For smooth graphics, `PongRenderer` adds a **render-only**
sub-pixel offset from the accumulators (`ballCenterX` / `ballCenterY`): the ball
slides smoothly between cells without changing simulation behaviour. Golden-frame
tests still sample the same centre pixel via those helpers.

### SoftCanvas → screen

`SoftCanvas` (`framebuffer.rgr`) owns a tightly-packed **RGBA8888** buffer
(`buffer_alloc` / `buffer_set`). Layout matches `SDL_PIXELFORMAT_RGBA32`, so the
SDL path is a straight memory upload — no colour swizzle, no PNG, no Node at
runtime.

`gfx_sdl.rgr` declares **operators** with `cpp` templates and a one-shot C
polyfill (`rgfx_open`, `rgfx_present`, …). Ranger emits the shim into the
generated `.cpp`; linking against `libsdl2` is the only external step. The ES6
templates in the same file are stubs so the sources still type-check for the web
target.

### Build pipeline (SDL window)

`scripts/build-sdl.sh` (also `npm run engine:sdl` / `engine:sdl:run`):

| Step | What happens |
|------|----------------|
| 1. Ranger → C++ | `node bin/output.js -l=cpp pong_sdl.rgr` → `tmp/pong-sdl/pong_sdl.cpp` |
| 2. Copy helper | `variant.hpp` (Ranger tagged-union helper for C++ codegen) |
| 3. Compile + link | `clang++` or `g++` + `pkg-config --cflags --libs sdl2` → `tmp/pong-sdl/pong_sdl` |
| 4. Run (optional) | `./pong_sdl` or `./pong_sdl 120` for a fixed frame count |

The terminal path is simpler: `npm run engine:compile` emits `pong.js`, then
`npm run engine:run` plays it under Node.

The LLVM path (`scripts/build-native.sh`, `npm run engine:build:native`) compiles
`pong.rgr` (terminal backend) to a small native binary via the LLVM backend +
`runtime/ranger_rt.c` — useful on the Pi before SDL2 is wired for production.

### Adding a new game

1. Put **pure logic** in `my_game_core.rgr` (`step(input:Buttons)` or similar).
2. Put **portable drawing** in `my_game_render.rgr` (target: `SoftCanvas` only).
3. Add a **backend** that owns the loop: poll input → `step` → draw → present.
4. Reuse `gfx_sdl.rgr` for any native window build; reuse `framebuffer.rgr` for
   any raster game until EVG lands (see `RENDERING_EVG.md`).

See [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md) for HDMI/gamepad roadmap and
[`tests/game-engine-render.test.ts`](../../tests/game-engine-render.test.ts) for
the headless render regression.

## Quick start (Mac / any desktop — JavaScript)

```bash
npm install
npm run engine:compile     # pong.rgr -> pong.js
npm run engine:run         # play in your terminal
```

Controls: **W/S** move, **D** toggle the debug HUD (live ball/paddle state
overlaid on the frame), **Q** quit.

## Native graphics window (SDL2) — the "real" PoC

`pong_sdl.rgr` renders the game into an **RGBA software framebuffer**
(`SoftCanvas`) and blits that buffer to a **native SDL2 window** every frame
(Ranger → C++ → SDL2). This is the desktop/Pi PoC: a real window, no Node, no
PNG — the render target is an in-memory byte buffer handed straight to an SDL
streaming texture (`SDL_PIXELFORMAT_RGBA32`). On the Pi the same SDL2 backend
drives the HDMI framebuffer via KMS/DRM.

```bash
# macOS:   brew install sdl2
# Ubuntu:  sudo apt-get install libsdl2-dev
npm run engine:sdl:run     # Ranger -> C++ -> SDL2 binary, then open the window
```

Controls: **W/S** (or **↑/↓**) move, **Q/Esc** quit. For CI / headless boxes the
binary takes an optional frame count and honours the SDL dummy driver:

```bash
npm run engine:compile:sdl                           # Ranger -> C++ only (pong_sdl.cpp)
npm run engine:sdl                                    # compile + build -> tmp/pong-sdl/pong_sdl
SDL_VIDEODRIVER=dummy tmp/pong-sdl/pong_sdl 120       # render 120 frames, then exit
```

The portable render layer is covered by
[`tests/game-engine-render.test.ts`](../../tests/game-engine-render.test.ts): it
renders a deterministic frame into the buffer on Node (asserting exact pixel
colours) and, when SDL2 + a C++ compiler are present, builds and runs the native
binary headlessly.

> The design doc [`RENDERING_EVG.md`](./RENDERING_EVG.md) describes swapping
> `SoftCanvas` for the gallery's full **EVG** vector renderer (gradients,
> shadows, TrueType fonts). That stack renders today on the ES6 target; making it
> build for **native C++** needs a couple more C++-backend fixes (one — the
> `int_buffer`/`double_buffer` type mapping — landed with this work).

## Which target for the Raspberry Pi? (C++, Go, Rust, or LLVM)

All targets share the identical `Pong` logic. They differ only in the platform
backend and toolchain. Measured on this repo (Linux x86-64, `pong.rgr`,
terminal backend):

| Target | Builds native on Linux/Pi? | Notes | Binary size |
|--------|:--:|-------|------------|
| **LLVM + C runtime** | ✅ (after the fix in `LLVM_BUGS.md`) | Smallest binary, no external deps, uses `runtime/ranger_rt.c` (POSIX `termios`). **Recommended for the Pi.** | ~22 KB |
| **C++** (`g++`) | ✅ | Needs `variant.hpp` (auto-fetched by the makefile plugin). Natural fit for future SDL2 C++ bindings. | ~137 KB |
| **Rust** (`rustc`) | ✅ | Proper `cfg(unix)`/`cfg(windows)` keyboard polyfill; large static binary. | ~4.1 MB |
| **Go** (`go build`) | ❌ | `on_keypress` polyfill is Windows-only (`syscall.NewLazyDLL`); fails on Linux. See `LLVM_BUGS.md`. | — |
| **Node / ES6** | ✅ (needs Node) | Best for desktop iteration; also fine on the Pi under Node. | — |

**Recommendation:** develop on the Mac with the **ES6/Node** build, ship to the
Pi with the **LLVM + C runtime** build (or **C++** if you prefer a C/C++
toolchain for the eventual SDL2 backend). Avoid **Go** for on-device keyboard
input until the polyfill gains a POSIX branch.

### Build a native binary (LLVM + C runtime — recommended)

```bash
npm run engine:build:native        # -> tmp/pong-native/pong  (then run it)
```

or manually:

```bash
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
  node bin/output.js -l=llvm ./gallery/game_engine/pong.rgr \
  -d=tmp/pong-native -o=pong.ll -target=native-linux-gnu -nodecli
clang tmp/pong-native/pong.ll runtime/ranger_rt.c -o tmp/pong-native/pong -Wno-override-module
tmp/pong-native/pong
```

On a Raspberry Pi (Raspberry Pi OS) the same commands work — use
`-target=native-linux-gnu` (aarch64) and the distro `clang`.

### Build a native binary (C++)

```bash
npm run engine:compile:cpp         # -> pong.cpp
cp gallery/invaders/variant.hpp gallery/game_engine/   # if not auto-fetched
g++ -std=c++17 -pthread gallery/game_engine/pong.cpp -o /tmp/pong_cpp
/tmp/pong_cpp
```

### Build a native binary (Rust)

```bash
npm run engine:compile:rust        # -> pong.rs
rustc gallery/game_engine/pong.rs -o /tmp/pong_rs
/tmp/pong_rs
```

## Display, rendering & debugging

See [`PLAN_GAME_ENGINE.md` §6b](./PLAN_GAME_ENGINE.md) for the full treatment.
In short:

* **Display over HDMI:** the terminal backend already shows on the TV via the
  Pi console at boot (zero deps); the target path is **SDL2 via KMS/DRM**
  (direct HDMI framebuffer, no desktop). The renderer owns resolution scaling,
  TV overscan safe-area, and vsync — game logic stays in a fixed logical grid.
* **Rendering:** fixed logical timestep + double buffering; world drawn first,
  then overlays (score, HUD).
* **Debugging:** because `Pong.step()` is pure and integer-deterministic, you
  debug gameplay **on the Mac** (Node debugger / unit tests). Record the
  per-frame `Buttons` stream on the Pi and **replay** it on the Mac to
  reproduce a bug exactly. An on-screen **debug HUD** (press `D`) shows live
  state on the TV itself when no shell is attached.

## Files

| File | Purpose |
|------|---------|
| `pong_core.rgr` | **Pure, portable game logic** (`Pong`, `Buttons`) shared by all backends |
| `pong.rgr` | Terminal (ANSI) backend + frame loop; imports `pong_core.rgr` |
| `pong.js` | Committed ES6 build of the terminal game (desktop / Mac) |
| `framebuffer.rgr` | `SoftCanvas`: a tiny portable RGBA8888 software framebuffer (`buffer` ops) |
| `pong_render.rgr` | `PongRenderer`: paints Pong state into a `SoftCanvas` (no platform I/O) |
| `gfx_sdl.rgr` | SDL2 window/present operators (C++ templates + shim); no `Lang.rgr` change |
| `pong_sdl.rgr` | Native SDL2 backend: renders the RGBA buffer into a real window |
| `ROADMAP.md` | **Roadmap:** nykytila, puutteet, prioriteetit ja vaiheittainen jatkokehitys |
| `lpc/` | **LPC spritesheet compositor** (Ranger): PNG-generointi, myöhemmin dynaaminen hahmoluonti — [`lpc/TODO.md`](./lpc/TODO.md) |
| `LPC_HEADLESS_SPRITESHEET.md` | LPC-arkkitehtuuri, lisenssi ja Ranger-native compositor -suunnitelma |
| `PLAN_GAME_ENGINE.md` | Full architecture: layers, input/render abstractions, SDL2/HDMI + gamepad backend, roadmap |
| `RENDERING_EVG.md` | Rich renderer design: reuse the gallery EVG stack (gradients/shadows/fonts/`l`-JSX) as the game framebuffer, with a WebGL/GLES2 path for the Pi |
| `LLVM_BUGS.md` | LLVM backend bugs found while enabling the native path (one fixed, two worked around) |
| `scripts/build-native.sh` | One-shot LLVM → clang → native binary build |
| `scripts/build-sdl.sh` | One-shot Ranger → C++ → native SDL2 window build |
