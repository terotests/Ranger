# 3D Model Viewer (model_viewer_wasm)

A **Tests**-section browser for real GLB models, on the host-managed 3D scene
(IDEAL_3D Phase H). Flip through several free Khronos sample assets with the
**left / right arrows**; the current model spins slowly so its shape and texture
read clearly.

## How it works

The host preloads every `models/*.glb` through the **model3d loader**
(`GlbImporter` → `ModelAsset` → `MeshBridge` → GPU upload) and registers each
under its basename. The WASM guest (`src/src/lib.rs`) owns only *which* model is
shown:

- `init()` — `rg_load_model(name)` for each model, one `rg_create_mesh_entity`
  per model at the origin, a camera and lights; shows model 0.
- `update(dt, forward, strafe, turn, jump)` — `turn = +1` (right arrow) → next
  model, `-1` (left arrow) → previous (one step per press); spins the current
  model via `rg_set_rotation`.

The guest holds only opaque `EntityId`s; the host owns the meshes, textures,
camera, lights, and rendering.

## Models

Free Khronos [glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets)
(committed; see [`models/CREDITS.md`](models/CREDITS.md) for licenses):

| Model | Shows |
| --- | --- |
| `Box` | untextured, flat base colour |
| `BoxTextured` | embedded PNG texture (decoded to RGBA) |
| `BoxVertexColors` | per-vertex `COLOR_0` (RGB cube gradient) |
| `Duck` | 4,212-triangle textured mesh with a node hierarchy |

Plus a nature pack (`tree_*`, `bush_*`, …) in `models/`. Oversized assets (e.g.
`Chair.glb`) live in `models/heavy/` and are **not** eagerly preloaded — the Pi
host skips that subdirectory (and any GLB over ~2 MiB / 80k verts) so launch
cannot OOM.

Re-download the Khronos four with `tools/fetch_models.sh`. Drop other supported
GLBs into `models/`; the guest discovers them via `rg_list_resources`.

## Build

```sh
./gallery/game_engine/games/model_viewer_wasm/src/build.sh   # → logic.wasm
```

## Headless check

The model-switching logic is verified without a display by driving the guest
with mock host imports:

```sh
node gallery/game_engine/games/model_viewer_wasm/tools/headless_check.cjs
```

It asserts init loads all models, the arrows cycle the visible model both ways,
exactly one model is visible at a time, and a held arrow advances only once.
