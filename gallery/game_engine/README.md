# Ranger Game Engine base

A minimal, **portable** game-engine base whose goal is exactly the one in the
brief: write the game logic once in Ranger, iterate on a **Mac/desktop**, then
run the *same* logic as a **native binary on a Raspberry Pi driving a TV over
HDMI**, with room to add **game-controller** input.

The design is documented in [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md). The
LLVM backend bugs found (and fixed) while getting the native path working are in
[`LLVM_BUGS.md`](./LLVM_BUGS.md).

## The portability contract

`pong.rgr` is the reference game. It is split into two parts:

| Part | Classes | Touches I/O? | Portable? |
|------|---------|--------------|-----------|
| **Game logic** | `Pong`, `Buttons` | No | 100% — identical on every target |
| **Platform layer** | `Terminal` | Yes (draw + input + timing) | Swapped per platform |

`Pong.step(input:Buttons)` is pure: it reads an abstract controller snapshot and
advances the simulation. It never calls `write`, `move_cursor`, or
`poll_keypress`. That is what lets the exact same logic run under Node on your
Mac and as a native ELF on the Pi. Motion uses **integer accumulators** (no
floats, no division), so the simulation is bit-for-bit deterministic across
targets. On the Pi the `Terminal` backend is replaced by the SDL2 backend
(HDMI framebuffer + gamepad) described in the plan — `Pong` does not change.

## Quick start (Mac / any desktop — JavaScript)

```bash
npm install
npm run engine:compile     # pong.rgr -> pong.js
npm run engine:run         # play in your terminal
```

Controls: **W/S** move, **D** toggle the debug HUD (live ball/paddle state
overlaid on the frame), **Q** quit.

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
| `pong.rgr` | Reference game: pure `Pong`/`Buttons` logic + `Terminal` platform layer |
| `pong.js` | Committed ES6 build (desktop / Mac) |
| `PLAN_GAME_ENGINE.md` | Full architecture: layers, input/render abstractions, SDL2/HDMI + gamepad backend, roadmap |
| `RENDERING_EVG.md` | Rich renderer design: reuse the gallery EVG stack (gradients/shadows/fonts/`l`-JSX) as the game framebuffer, with a WebGL/GLES2 path for the Pi |
| `LLVM_BUGS.md` | LLVM backend bugs found while enabling the native path (one fixed, two worked around) |
| `scripts/build-native.sh` | One-shot LLVM → clang → native binary build |
