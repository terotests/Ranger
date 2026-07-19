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

- `RgSdlGameHost.rgr` — the driver. Two entry loops share one window/present
  path: `runLauncher()` (present the rich launcher canvas via `gfx_present`,
  navigate on key-press *edges*, hand off the chosen game to `run`) and `run`
  (poll input → actions → `host.frame` → present split → forward rumble, honour
  the guest launch handoff). `launcherStep`/`mapMask`/`edge`/`toRgbaBuffer` are
  pure host-input/present seams, unit-tested headlessly.
- `RgSdlMain.rgr` — native entry; calls `runLauncher()` (engine chrome, not a
  game — games remain `.tsx`-only).
- `../../menu/RgLauncherUi.rgr` — the launcher screen itself (title, subtitle,
  category cards → game cards, moving accent). Renders into a SoftCanvas through
  the **self-contained** v2 UI/EVG/font stack (nothing imported outside `v2/`).
- `../../../gfx_sdl.rgr` — the native `gfx_*` operators (SDL2). They carry both
  `cpp` and `es6` templates, so this host **compiles and runs headlessly as a
  no-op**; the real window exists only in the native build.

## Input map (default keyboard)

`gfx_input_source_mask(source)` bits → actions: `16`→left, `32`→right, `1`→up,
`2`→down, `4`→action, and jump = up | action. Source `0` = P1 (WASD/Space),
source `1` = P2 (arrows); `2..9` = gamepads.

In the launcher these bits drive the menu on rising edges (a tap moves once):
`16`/`32` move the selection, `4` selects (category → game list → launch), `2`
goes back a page.

## Build + run on macOS

Prereq: SDL2 (`brew install sdl2`). From the repo root:

```sh
npm run engine:game-sdl:launcher:v2
```

That runs `scripts/build-sdl-v2.sh`, which (1) compiles `RgSdlMain.rgr` to C++
(`RANGER_LIB=… node bin/output.js -l=cpp … -o RgSdlMain.cpp`) and (2) links it
against SDL2 + OpenGL into `tmp/sdl-v2/ranger-v2`, then launches it. Unlike the
v1 game runner, the v2 host needs **no wasm3 and no libcurl** — only the
operators it actually calls are emitted (all `SDL2/SDL.h`); GL is pulled in only
by `gfx_sdl.rgr`'s shared prelude.

A window opens on the launcher: arrows move, Space/`A` selects (Games → pick a
game → launch), `S` goes back, Q/Esc quits. WASD + Space drives P1 in-game,
arrows drive P2; a game's `runtime.input.player(i).rumble(...)` calls reach the
pad through `gfx_rumble_pad`.

> The final SDL2 **link** needs SDL2 headers, which are absent in CI — so the
> headless suite compile-checks the host, validates the Ranger→C++ codegen, and
> tests its pure seams (`tests/sdl/sdl_host_test`: framebuffer→RGBA pack, input
> map, launcher-nav edges; `menu/tests/launcher_ui_test`: the rendered launcher
> screen). The live window run happens on a machine with SDL2. Audio playback
> additionally needs the score/one-shot synth (a `gfx_audio_*` sink) — a
> separate follow-up.
