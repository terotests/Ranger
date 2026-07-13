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

## Not yet in the SDL Games menu

This runs headless (the HUD is printed). Rendering it as a live SDL launcher game
— generated tiles drawn as real sprites, keyboard-driven player, on-screen HUD —
needs host operators that load and drive the worker + loader from the game loop
(`game_runtime`). That wiring is the follow-on; the streaming policy, generation,
and freeing it would drive are already proven here.
