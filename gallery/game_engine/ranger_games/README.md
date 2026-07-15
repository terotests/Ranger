# `ranger_games/` — games written directly in Ranger

This folder holds games whose logic **is Ranger source** (`.rgr`), compiled
straight to a native binary (terminal / SDL2 / LLVM). They are the clearest
demonstration of **"Ranger as a platform"**: no runtime interpreter, no guest
module — the game *is* the compiled program.

Keep this concept separate from the two other things in the engine:

| Folder | What it is | How a game gets there |
|--------|------------|-----------------------|
| **`ranger_games/`** (here) | Static Ranger games, AOT-compiled to a native binary | Written in / emitted to `.rgr`, then `node bin/output.js` → C++/LLVM/ES6 |
| [`../games/`](../games/) | **Loadable** games the engine host runs at runtime | `index.tsx` (interpreted TSX) or `logic.wasm` / `game.as` loaded by the launcher |
| [`../scripting/`](../scripting/) | **Engine core** runtime (host, physics, sprite, HUD, WASM/TSX runners) | not a game — the platform the loadable games run on |

If you are adding a **new loadable game**, it does *not* belong here — put it in
[`../games/<name>/`](../games/) and read the top-level
[`../README.md`](../README.md). This folder is only for games that are compiled
from Ranger source into their own binary.

## The two families here

### 1. Hand-written Ranger (the original portability PoC)

Pong, authored directly in Ranger, with the pure logic isolated from every
backend. This is the reference for "write the logic once, run it on many
backends" (terminal, SDL2, LLVM, Pi).

| File | Layer | Does I/O? |
|------|-------|-----------|
| `pong_core.rgr` | Pure logic — `Pong.step(input: Buttons)`, integer Bresenham motion | No |
| `pong_render.rgr` | Draws the pure state into an RGBA `SoftCanvas` | No (buffer only) |
| `pong.rgr` | Terminal backend (ANSI + keyboard) | Yes |
| `pong_sdl.rgr` | SDL2 backend (window, gamepad, GLES2 present) | Yes |
| `sprite_char_sdl.rgr` | Character-select + gamepad walk/jump, SDL2 | Yes |
| `streaming_world_sdl.rgr` | Streaming-world demo driving `worker.wasm`, SDL2 | Yes |

These import the engine's shared rendering shims from the parent folder
(`../framebuffer.rgr`, `../gfx_sdl.rgr`, `../wasm_runtime.rgr`) — those shims are
**engine core**, not games, so they stay in `../`.

### 2. AOT native-compiled games (transpiled TSX → Ranger → native)

The **same** games that ship as loadable TSX under `../games/` can also be
compiled ahead-of-time to a native binary: the TSX is emitted to Ranger
(`../../ts_to_ranger/generated/<game>_generated.rgr`), wrapped by a small game
module, and run through the native host — no `.tsx` load at runtime.

| Game module | Runner (native SDL) | Headless runner |
|-------------|---------------------|-----------------|
| `pong_native_game.rgr` | `pong_native_sdl_runner.rgr` | `pong_native_runner.rgr` |
| `pacman_native_game.rgr` | `pacman_native_sdl_runner.rgr` | — |
| `invaders_native_game.rgr` | `invaders_native_sdl_runner.rgr` | `invaders_native_runner.rgr` |
| (spawner) | — | `spawner_native_runner.rgr` |
| (counter) | — | `counter_native_runner.rgr` |

These import the shared **native host** from `../scripting/`
(`native_game_bridge.rgr`, `game_sdl_native_host.rgr`, `game_native_runtime.rgr`)
— that host is reusable engine core, so it stays in `scripting/`. Only the
per-game modules and runners live here.

## Build & run

Hand-written Pong:

```bash
npm run engine:compile && npm run engine:run   # ES6 / Node terminal Pong
npm run engine:sdl:run                         # SDL2 window
npm run engine:build:native                    # LLVM → native terminal binary
npm run build:raspberry                        # Pi 5 aarch64 package
npm run engine:chars:poc:sdl                   # sprite_char_sdl (SDL2)
npm run engine:game-sdl:streaming-world        # streaming_world_sdl (SDL2)
```

AOT native games (compiled runner, no TSX at runtime):

```bash
npm run engine:pong:native        # headless: compile + run 180 frames
npm run engine:invaders:native    # headless: compile + run 600 frames
npm run engine:spawner:native     # headless native-runtime smoke
npm run engine:game-sdl-native:run:pong      # SDL2 native binary
npm run engine:game-sdl-native:run:invaders
npm run engine:game-sdl-native:run:pacman
```

The `_generated.rgr` inputs are (re)emitted from the loadable TSX by
`build-game-sdl-native.sh` (`--run <game>`), so the AOT and loadable versions of
a game stay in sync from a single TSX source.
