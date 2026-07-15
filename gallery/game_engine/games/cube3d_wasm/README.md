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
| MESH  | `RGMB` | §18 | 24 vertices (position `*256`, normal Q16.16, RGBA) + 36 `u16` indices, one per-frame model rotation |
| CAM   | `RGCM` | §19 | `PERSPECTIVE` camera: eye / target / up / fov / near / far |
| LIGHT | `RGLT` | §20 | ambient term + one directional "sun" (dir + colour + intensity) |

The guest does **no floating point** — it writes fixed-point integers and, each
frame, bumps the model rotation. All matrix math, projection, the z-buffer, and
per-vertex Gouraud shading live host-side (`tools/render.cjs`), exactly the
"host owns rendering, guest owns the world" split of `IDEAL.md` §2.17 / §5.

**2D is the special case (§21):** a mesh with `flags |= RG_MESH_UNLIT`, `z = 0`,
and an `AFFINE2D`/ortho camera is a flat sprite through the *same* path.

## Build & run

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
src/src/lib.rs      guest: declares MESH/CAM/LIGHT, spins the cube, exports *_ptr/*_size
src/Cargo.toml      cdylib, wasm32-unknown-unknown
src/build.sh        cargo build --release --target wasm32-unknown-unknown -> logic.wasm
tools/render.cjs    headless host: reads blocks, builds view-projection, z-buffer
                    rasteriser + Gouraud lighting, PNG encoder (node zlib only)
```

## Phase 2 (next)

1. Add a floor plane mesh + a few cube bodies.
2. Wire `physics/src/cannon_world` (gravity, contacts) so it owns each body's
   transform; the guest reads poses and writes them into each MESH model slot —
   the same `IDEAL.md` §2.5 "shape declared once, pose streams per frame" split
   already used by the 2D host-physics path (`autopeli_wasm`).
3. Keep the exact same `render.cjs` rasteriser; only the source of the transforms
   changes.
