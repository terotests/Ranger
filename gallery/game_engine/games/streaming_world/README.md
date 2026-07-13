# streaming_world — infinite-world streaming stress test

A player roams an effectively-infinite (1000×1000-cell) world. As it walks, the
engine **generates resources ahead and frees them behind**, keeping live memory
bounded no matter how far the player travels. This is the end-to-end stress test
for the Ranger2D streaming pipeline (PLAN_RANGER2D_STREAMING.md).

Two WASM modules run the whole loop, on the same wasm3 bridge:

- **game guest** — `../streaming_worker/worker.wasm` (Rust): each step it takes
  the player's camera cell and computes the residency ring — which cells to
  **load** ahead and which to **free** behind (hysteresis: preload radius 1,
  retire radius 2).
- **resource loader** — `../streaming_worker/resource_loader.wasm`
  (AssemblyScript): a bounded pool that **generates** a resource per new cell and
  **releases** it on free. Freeing sprites/backgrounds is the loader's job, so
  live use never grows past the ring.

## Run

```bash
npm run engine:wasm:demo:world-stress
```

Sample HUD (player coordinates + a live map, `@` = player cell, `#` = loaded):

```
[HUD] step 378   pos (32000,33152)  cell (500,518)   live=13 peak=16  gen=1143 freed=1130  host_handles=13
         . # # # #
         . # # # .
         . # @ # .
         . # # # .
         . . . . .
```

**1143 resources generated, 1130 freed, only 13 live** after roaming ~380 cells —
memory stayed bounded (peak 16, ring cap 25). That boundedness under unbounded
travel is the result the test asserts (`WORLD_STRESS_OK`).

## SDL rendering (the whole chain, on screen)

The streaming world now renders through the engine's real SDL path — the loader's
actual generated tiles drawn as sprites, a camera that follows the player, and a
coordinate HUD:

```bash
npm run engine:game-sdl:streaming-world       # build worker + AS loader + SDL app, run headless
./tmp/streaming-world/streaming_world_sdl      # windowed: WASD / arrows move, Q/Esc quits
```

- `streaming_world_sdl.rgr` — Ranger → C++ → SDL2 front-end.
- `scripting/streaming_world_runner.rgr` — `StreamingWorldRunner`: drives
  `worker.wasm` + the spawned `resource_loader.wasm`, captures each cell's 16×16
  tile and blits it (scaled) onto SoftCanvas via `blitImageRectScaled`, follows
  the player with a camera, and draws the coordinate HUD. Presented with
  `gfx_present` — the same renderer every other game uses.

A headless run (`SDL_VIDEODRIVER=dummy`, frame count given) dumps one frame's RGBA
buffer to `tmp/streaming-world/frame.rgba` so it can be turned into a PNG without a
display.

Wiring it as an entry in the SDL launcher *menu* (a `game.info` the catalog picks
up) is the remaining step; the runner already exposes the same
init/frameWithInput/draw/raw surface the menu's wasm games use.
