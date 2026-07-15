# cube3d_wasm — lit spinning cube (Rust → WASM + software 3D host)

The **Phase-1 vertical slice** of the 3D-graphics proposal
([`ABI_V2_PROPOSAL.md`](../../ABI_V2_PROPOSAL.md) §18–§21). It proves the whole
pipeline end to end with the smallest real thing: a Rust guest compiled to WASM
that **declares 3D geometry, a perspective camera, and scene lighting**, and a
headless host that reads those blocks straight out of the guest's linear memory
and **software-rasterises** them to PNG — no GPU, no SDL, no display.

It is the concrete answer to *"can we combine physics + 3D rendering with a Rust
game compiled to WASM?"*: the render half and the Rust→WASM half are shown here;
**Phase 2** replaces the guest's hand-spun rotation with the existing
`physics/src/cannon_*` 3D rigid-body world driving the same mesh transform.

## What the guest declares (mirrors the proposed ABI)

| Block | Magic | Proposal | Contents |
|-------|-------|----------|----------|
| MESH     | `RGMB` | §18 | 24 vertices (position `*256`, normal Q16.16, RGBA, uv `*4096`) + 36 `u16` indices + **6 sub-meshes** (one per face, each naming a material) + a per-frame model rotation |
| MATERIAL | `RGMA` | §17/§18 | a material table: each material = `{ texture handle, base colour, flags (lit/unlit) }` |
| CAM      | `RGCM` | §19 | `PERSPECTIVE` camera: eye / target / up / fov / near / far |
| LIGHT    | `RGLT` | §20 | ambient term + one directional "sun" (dir + colour + intensity) |

The guest does **no floating point** — it writes fixed-point integers and, each
frame, bumps the model rotation. All matrix math, projection, the z-buffer,
texture sampling, and per-vertex Gouraud shading live host-side
(`tools/render.cjs`), exactly the "host owns rendering, guest owns the world"
split of `IDEAL.md` §2.17 / §5.

**2D is the special case (§21):** a mesh with an `UNLIT` material, `z = 0`, and an
`AFFINE2D`/ortho camera is a flat textured sprite through the *same* path.

## Materials & the resource loader (§17)

The material pipeline the guest drives at `init()`:

1. **Load a texture** — the guest calls the host import `rg_res_load(name, len)
   -> handle` (§17). The host loads `assets/<name>.ppm`, keeps the pixels
   **host-side**, and returns an **opaque handle**. The guest never sees a
   pointer — the §17 "no guest pointer is retained, handles are opaque" rule.
2. **Create a material** — the guest writes a MATERIAL entry `{ texture handle,
   base colour, flags }` into the `RGMA` table.
3. **Assign it to a surface** — each cube face is a sub-mesh (`first_index,
   index_count, material_id`); the guest points 4 side faces at the *crate*
   material and the top/bottom at the *tiles* material.

The host then rasterises each sub-mesh: sample its material's texture at the
perspective-correct uv, multiply by the material base colour **and** the
interpolated per-vertex light term (§20). Texture supplies detail; lighting
modulates it across faces — so the directional sun is clearly visible.

Textures are committed as **PPM** (`assets/*.ppm`) so the loader is a ~15-line
decode with no image-library dependency; regenerate them with
`node tools/gen_textures.cjs`. Swapping in a PNG decoder (or a procedural /
streamed source) is a change to `rg_res_load` alone — the guest is untouched.
Later material upgrades (shaders, mipmaps, LOD) likewise live behind the handle
and change nothing guest-side.

## Build & run

> **Headless only — not a menu game (yet).** This PoC renders through the Node
> host in `tools/`, not the shipped SDL engine: the guest imports `rg_res_load`
> and declares MESH/CAM/LIGHT blocks the in-engine wasm runners don't understand,
> so it has **no `game.info`** and does not appear in the launcher. Running it
> in-engine needs the 3D host + an `rg_res_load` provider — `IDEAL_TODO.md`
> Phase G.3. Run it here with:

```bash
# 1. compile the Rust guest to logic.wasm
npm run engine:wasm:build:cube3d
#    (or: bash gallery/game_engine/games/cube3d_wasm/src/build.sh)

# 2. render N frames to gallery/game_engine/games/cube3d_wasm/out/*.png
npm run engine:wasm:demo:cube3d
#    (or: node gallery/game_engine/games/cube3d_wasm/tools/render.cjs 48)
```

Outputs:

- `out/cube_hero.png` — one representative frame.
- `out/cube_spin_montage.png` — a 3×3 grid across the rotation.

## Files

```
src/src/lib.rs        guest: declares MESH/MATERIAL/CAM/LIGHT, loads textures via
                      rg_res_load, spins the cube, exports *_ptr/*_size
src/Cargo.toml        cdylib, wasm32-unknown-unknown
src/build.sh          cargo build --release --target wasm32-unknown-unknown -> logic.wasm
tools/render.cjs      headless host: rg_res_load impl + PPM decode, reads blocks,
                      view-projection, z-buffer + textured + Gouraud raster, PNG encode
tools/gen_textures.cjs generates the committed assets/*.ppm textures
assets/crate.ppm      wooden-crate texture (cube sides)
assets/tiles.ppm      stone-tile texture (cube top/bottom)
```

## Phase 2 (next)

1. Add a floor plane mesh + a few cube bodies.
2. Wire `physics/src/cannon_world` (gravity, contacts) so it owns each body's
   transform; the guest reads poses and writes them into each MESH model slot —
   the same `IDEAL.md` §2.5 "shape declared once, pose streams per frame" split
   already used by the 2D host-physics path (`autopeli_wasm`).
3. Keep the exact same `render.cjs` rasteriser; only the source of the transforms
   changes.
