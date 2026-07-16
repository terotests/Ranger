# Heavy models (not eager-preloaded)

Files in this `models/heavy/` folder are **not** scanned by the runner's eager
`preloadModels()` pass (it lists only the top-level `models/` directory, so
anything nested here is skipped). Put large / dense GLBs here so they don't get
loaded on every launch of the viewer.

Why: the host preloads every top-level `models/*.glb` into GPU buffers during
`setupScene`. A very large asset (e.g. `Chair.glb`, ~33 MiB / ~228k verts) can
OOM or stall a memory-constrained host such as a Raspberry Pi during that pass.
The preloader also skips any top-level GLB over ~2 MiB or ~80k verts as a
backstop (see `MODEL_PRELOAD_MAX_BYTES` / `MODEL_PRELOAD_MAX_VERTS` in
`scripting/wasm3d_runner.rgr`).

`Chair.glb` lives here as a stress-test asset for the large-GLB / 32-bit-index /
high-precision mesh path. To view it, load it explicitly rather than relying on
eager preload, or move it back up one level on a machine with ample GPU memory.
