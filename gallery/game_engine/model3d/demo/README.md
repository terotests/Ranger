# model3d demo — render a real Khronos GLB to an image

Loads a real, non-trivial glTF Sample Asset through the native (host-side, no
WASM) 3D asset path and software-renders it to an image — proving the whole
pipeline end to end on production assets, headless (no GPU / SDL / display).

```
GLB file
  → ModelLoader        (GLB container + accessors + embedded PNG/JPEG decode)
  → ModelAsset         (meshes, materials, textures, node hierarchy)
  → ModelInstancer     (entities + world transforms)
  → SoftRenderer3D     (z-buffered, textured, directionally-lit rasteriser)
  → PPM → PNG
```

## Run

```sh
bash gallery/game_engine/model3d/demo/render.sh
```

This fetches `Duck.glb` and `BoxTextured.glb` from the Khronos
[glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) repo
(not committed here), compiles `render_glb_demo.rgr` to ES6, renders each, and
writes `out/duck.png` and `out/box.png`.

Render one asset manually:

```sh
node bin/output.js -es6 gallery/game_engine/model3d/demo/render_glb_demo.rgr -d=. -o=render.js
node render.js <dir> <file.glb> <outDir> <out.ppm> [w] [h]
node gallery/game_engine/model3d/demo/ppm_to_png.cjs <out.ppm> <out.png>
```

## Files

| File | Role |
| --- | --- |
| `SoftRenderer3D.rgr` | Software rasteriser: walks the entity graph, transforms geometry by each entity's world matrix, z-buffers textured + lit triangles, auto-frames the camera to the model's world bounding box, writes PPM |
| `render_glb_demo.rgr` | Main: `ModelLoader` → `instantiate` → `SoftRenderer3D` → PPM |
| `ppm_to_png.cjs` | Repackages the rendered PPM as PNG (Node zlib only; no rendering) |
| `fetch_samples.sh` | Downloads the Khronos sample GLBs into `assets/` |
| `render.sh` | fetch → compile → render → convert |

## Duck.glb — 4,212 triangles, 512×512 embedded PNG texture

Loaded (nodes=3, one mesh, one material, one texture), instantiated into 4
entities, rasterised in ~0.2 s under Node.

## Relationship to the WASM path

This demo drives the host loader + render bridge **directly from Ranger** — it is
the host side of `IDEAL_3D.md` §12. A WASM *guest* would not parse the file: it
would call `rg_load_model("Duck.glb")` and `rg_instantiate_model(...)`, and the
host would run exactly this `ModelLoader` + render bridge. Wiring those ABI
imports (and swapping this software rasteriser for the GLES2 path in
`gfx_sdl.rgr`) is the next step described in `IDEAL_3D.md` §12.5.
