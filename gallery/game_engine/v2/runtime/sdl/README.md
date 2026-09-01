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
  navigate on key-press *edges*, hand off the chosen game to `runIn`) and
  `runIn` (poll input → actions → `host.frame` → present → forward rumble,
  honour the guest launch handoff). The window is always one pane (`480×270`,
  16:9); present follows the guest-declared pane count (1 pane → `gfx_present`,
  2+ → `gfx_present_split` which scales each full-res pane into a window half).
  `clearRgb` is a neutral framebuffer clear, not a scene sky.
  `launcherStep`/`mapMask`/`edge`/`foldQuitBits`/`toRgbaBuffer` are pure
  host-input/present seams, unit-tested headlessly.

  **One window per session** (v1 parity): `runLauncher()` opens the window once
  and closes it once. Launching a game does *not* re-create it — `runIn` /
  `runWasmIn` present into the window that is already open and retitle it, and
  the launcher retitles it back on the way out. (`run` / `runWasm` are the
  standalone wrappers that own a window, for driving one game with no launcher.)
  The earlier `gfx_close` → game → `gfx_open` dance tore the SDL window down and
  built a new one on every transition; on macOS that stacks a second window
  frame over the first and throws away whatever position, size, or Space the
  user had put the window in.

  Because the window is shared, closing it from the title bar during a game is a
  quit for the whole app, not a return to the launcher: `runIn` reports it
  (return `2`) and `runLauncher` exits.
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

A window opens on the launcher: arrows or WASD move, Space/Enter/pad `A` selects
(Games → pick a game → launch), `S` or Q/Esc/pad `B` goes back a page, and
Q/Esc/pad `B` on the category page quits. The launcher merges keyboard P1
(WASD), keyboard P2 (arrows), and gamepad 0 into one navigation mask
(`launcherNavMask`, v1 parity) — arrow keys are a *distinct* SDL source from
WASD, so reading source 0 alone would leave the launcher deaf to both the arrows
and every pad. Back/quit is normalised onto one bit by `foldQuitBits` (Q/Esc `8`,
pad `B` `64`, pad Select `1024`), so a single edge covers all three.

In-game, WASD + Space drives P1 and arrows drive P2, unchanged; back/quit is
read *separately* from the play mask (v1 keeps them apart so movement never
doubles as "exit"). A game's `runtime.input.player(i).rumble(...)` calls reach
the pad through `gfx_rumble_pad`.

## Audio

A guest's `runtime.audio.music.play(score)` and `runtime.audio.vocal.play(id)`
are recorded on the bridge (`rgcore_music_play` / `rgcore_vocal`); the host owns
playback — same split as v1 (`playSound` → `GameAudio`, `playVoice` →
`GameVocalFx`, music → score player). `initAudio()` opens the SDL audio device
and builds the synth; `pumpAudio(dt)` (called each game frame) drains new vocal
cues: catalogue voices (`cheer`/`chuckle`/`gasp`/…) through `GameVocalFx`,
palette SFX (`bounce`/`brick`/`wall`/`celebrate`/…) through `GameAudio.play`,
then ticks any playing score. PCM goes to `RgSdlAudioSink` → `gfx_audio_queue`.
Stack under `v2/audio` (`game_soundscore` + `game_audio` + `game_vocal_fx`).

Device open notes (macOS): default `SDL_AUDIODRIVER=coreaudio`; empty
`SDL_GetNumAudioDevices` is not fatal (open system default via `NULL`);
frequency/channel negotiation is allowed; host adopts `gfx_audio_sample_rate()`
and retunes `GameVocalFx` to match. The device now outlives a launcher → game →
launcher round trip (the window is no longer torn down between them), so
`gfx_audio_open` is a no-op on the way back in; the launcher calls
`gfx_audio_clear` + `resetAudioDevice()` when a game exits so the next game
starts from a silent queue and a fresh synth cursor.

> The final SDL2 **link** needs SDL2 headers, which are absent in CI — so the
> headless suite compile-checks the host, validates the Ranger→C++ codegen, and
> tests its pure seams (`tests/sdl/sdl_host_test`: framebuffer→RGBA pack, input
> map, launcher-nav edges, the music + vocal pumps; `menu/tests/launcher_ui_test`:
> the rendered launcher screen; `audio/tests/audio_score_test`:
> parse→schedule→PCM). The live window + audible output happen on a machine with
> SDL2.
