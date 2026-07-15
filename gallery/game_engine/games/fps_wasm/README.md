# fps_wasm — light Doom-style walk-around (Rust → WASM + physics + software 3D)

A first-person movement PoC that combines **guest-side physics**, **3D
rendering**, and a **Rust game compiled to WASM**. No shooting — just moving
around rooms with a physics-driven player, the next step after
[`games/cube3d_wasm`](../cube3d_wasm).

The **guest owns the world and the player physics** (`IDEAL.md` §5): it generates
a two-room level (perimeter + divider walls with a doorway, crate pillars, a
low platform), runs a **kinematic character controller**, and drives a
**first-person camera**. The host only loads textures and renders. A Doom player
*is* a character controller — an AABB that slides along walls and stands on
boxes — not a rigid-body solver, so that is what the guest implements (gravity,
jump, swept per-axis AABB collision, ground/step resolution).

## What the guest declares & drives

| Block | Magic | Proposal | Contents |
|-------|-------|----------|----------|
| MESH      | `RGMB` | §18 | level geometry (walls/floor/obstacles as textured quads) + per-face sub-meshes + published pool offsets |
| MATERIAL  | `RGMA` | §17/§18 | floor / brick-wall / crate materials, each a texture handle |
| CAM       | `RGCM` | §19 | `PERSPECTIVE` first-person camera, rewritten every frame to the player's eye + facing |
| LIGHT     | `RGLT` | §20 | ambient + one directional sun |
| COLLIDERS | `RGCO` | §5-style | the physics world the guest declares (AABBs), also read by the host for the map |

Input (host → guest): `update(dt_ms, forward, strafe, turn, jump)` with
forward/strafe/turn ∈ {-1,0,1}, jump ∈ {0,1}. Internal sim is `f32`; all block
values are written fixed-point (positions `*256`, normals/units Q16.16, uv
`*4096`) so the transport contract matches the proposal.

## Physics (character controller)

Each `update`: turn the yaw; build a horizontal move vector from the facing;
apply jump (if grounded) and gravity; integrate and **resolve collisions
axis-by-axis** against every collider AABB (push out along the least-penetration
axis, zero that velocity component, mark grounded when landing on a top face);
finally clamp to the `y = 0` floor plane. This gives wall-sliding, standing on
crates, and jumping onto the platform.

## Rendering

The host reuses the `cube3d_wasm` textured rasteriser (perspective + **per-pixel
z-buffer**, no polygon sorting — intersecting geometry like a crate on the floor
needs true depth) with **near-plane clipping** added, so the big floor quad
(one corner behind the camera) is clipped, not dropped. Textures are sampled
perspective-correct and modulated by per-vertex Gouraud lighting.

## Build & run

```bash
npm run engine:wasm:build:fps   # build the guest -> logic.wasm
npm run engine:wasm:demo:fps    # build + run the scripted walkthrough -> out/*.png
#   node tools/gen_textures.cjs   # regenerate assets/*.ppm
```

Outputs:

- `out/fps_hero.png` — a representative first-person frame.
- `out/fps_walk_montage.png` — first-person frames across the walk.
- `out/fps_map.png` — top-down map: walls grey, obstacles brown, platform green,
  player path blue (grounded) / gold (airborne). The gold segment is the jump
  onto the platform — visible proof the physics drives position + jumps.

## Files

```
src/src/lib.rs        guest: level gen + character controller + FP camera + blocks
tools/render.cjs      host: rg_res_load, scripted input, z-buffer raster (near-clip), map
tools/gen_textures.cjs generates assets/{brick,floor,crate}.ppm
```

## Next

- Swap the guest's hand-authored level for procedural room generation.
- Replace the scripted input with live keyboard input on the `.rgr`/SDL host
  (`IDEAL_TODO.md` Phase G.3); the guest is unchanged.
- Dynamic obstacles via the `cannon` rigid-body world (Phase G.2) alongside the
  kinematic player controller.
