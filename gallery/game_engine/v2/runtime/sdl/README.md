# runtime/sdl — native SDL2 host (macOS / Pi)

The single native platform boundary of the v2 2D stack. It drives the **same
generic** `RgGameHost` + registry bridge + `Rg2DPresenter` the headless tests
use, adding a real window, real input, and real haptics — with **no game
knowledge** and **no additions to `ranger:core`**.

## Boundary (what does NOT leak)

- The guest (`.tsx`) reaches input/audio/etc. through `runtime.*` exactly as in
  the headless build — it never sees SDL, a window, or a pad.
- `ranger:core` is unchanged; it lowers to the same `rgcore_*` commands.
- `RgSdlGameHost` only feeds the **host-side** devices (`bridge.input.setAction`
  from the SDL mask) and reads **host-side** state (the `RgFramebuffer`, the
  recorded rumble) to forward to SDL. Game logic stays in the `.tsx`.
- The physical-key → logical-action map (`mapMask`) is host input *config*, not
  game logic; a game only ever sees logical actions (`left`, `jump`, …).

## Files

- `RgSdlGameHost.rgr` — the driver: open window, loop (poll input → actions →
  `host.frame` → present split → forward rumble), honour the launcher handoff.
- `RgSdlMain.rgr` — native entry; boots the launcher menu (engine infra, not a
  game — games remain `.tsx`-only).
- `../../../gfx_sdl.rgr` — the native `gfx_*` operators (SDL2). They carry both
  `cpp` and `es6` templates, so this host **compiles and runs headlessly as a
  no-op**; the real window exists only in the native build.

## Input map (default keyboard)

`gfx_input_source_mask(source)` bits → actions: `16`→left, `32`→right, `1`→up,
`2`→down, `4`→action, and jump = up | action. Source `0` = P1 (WASD/Space),
source `1` = P2 (arrows); `2..9` = gamepads.

## Build + run on macOS

Prereq: SDL2 (`brew install sdl2`). From the repo root:

```sh
# 1. Ranger -> C++
node bin/output.js -cpp gallery/game_engine/v2/runtime/sdl/RgSdlMain.rgr \
  -d=build/sdl -o=RgSdlMain.cpp

# 2. C++ -> binary, linked against SDL2 (uses gfx_sdl's rgfx_* shim)
clang++ -std=c++17 -O2 build/sdl/RgSdlMain.cpp \
  $(sdl2-config --cflags --libs) -o build/sdl/ranger-v2

# 3. run from the repo root (assets resolve relative to CWD via pkg://)
./build/sdl/ranger-v2
```

A window opens on the launcher; pick a game (e.g. Pomppija/ylos2). WASD + Space
drives P1, arrows drive P2; a game's `runtime.input.player(i).rumble(...)` calls
reach the pad through `gfx_rumble_pad`.

> The final SDL2 **link** needs SDL2 headers, which are absent in CI — so the
> headless suite compile-checks the host and tests its pure seams
> (`tests/sdl/sdl_host_test`: framebuffer→RGBA pack + input map), and the live
> window run happens on a machine with SDL2. Audio playback additionally needs
> the score/one-shot synth (a `gfx_audio_*` sink) — a separate follow-up.
