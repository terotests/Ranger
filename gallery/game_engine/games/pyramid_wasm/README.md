# Faaraon pyramidi (pyramid_wasm)

A gentle 3D climber for kids — Donkey Kong in three dimensions. Climb a stepped
sandstone pyramid, terrace by terrace, to the golden summit. Mummies patrol the
levels; grab a diamond for a few seconds of invincibility and bump them aside.

Runs on the **host-managed 3D scene** (IDEAL_3D Phase H): the guest owns the
world and all physics; the host owns the scene and renders it. The guest issues
`rg_create_*` at init and `rg_set_position/rotation/scale/visible` per frame,
holding only opaque `EntityId`s.

## Play

- **Move / turn / jump.** Jump up each terrace face, or take the **east-side
  stairs** — half-height steps the character auto-climbs (the easy route).
- **Diamonds** grant ~6s of invincibility (the character pulses); touch a mummy
  while glowing to knock it out for a while.
- Touch a mummy without a diamond and you drop back to the sand (lives refill —
  no scary game-over).
- Reach the **golden summit** to win. (Victory fanfare + banner land with the
  3D-audio bridge; see IDEAL_TODO Phase H.)

## Structure

- `src/src/lib.rs` — the whole game (level, character controller with auto-step,
  monsters, diamonds, invincibility, win). Third-person camera follows a gold
  avatar box.
- `tools/gen_textures.cjs` — regenerates the committed PPM textures
  (sand / stone / gold / gem / monster). `node tools/gen_textures.cjs`.
- `assets/*.ppm` — committed textures (P6, 64×64).

Actors are boxes for now; each is created through a `create_actor` helper so a
real GLB model (via the `model3d` loader) can be dropped in later by swapping
one call for `rg_create_mesh_entity(meshId, tex)`.

## Build

```sh
./gallery/game_engine/games/pyramid_wasm/src/build.sh   # → logic.wasm
```

Then launch the engine (`scripts/build-game-sdl.sh --run`) and pick
**Faaraon pyramidi** from the Games group.
