# model_loading — PLANNED (not runnable through the interpreter yet)

> Status: **the parser exists and is unit-tested; the interpreter-driven path is
> blocked on façade + host wiring.** This folder documents what an
> interpreter-driven model-loading test should check.

## What should be tested

Loading a glTF/GLB and validating the decoded data — pure data, **no rendering**:

- **node tree** — number of scene nodes; each node's name and TRS transform.
- **geometry decode** — per-primitive `vertexCount` / `indexCount`, and the
  bounding box of the decoded positions, vs known values for the asset.
- **accessor decode** — POSITION / NORMAL / TEXCOORD_0 / indices decoded to the
  right counts and sample values.
- **materials** — baseColor / normal texture indices resolved per material.
- **overall bounds** — the model's world-space AABB after node transforms.

Internal objects to read back: `ThreeGLTFFile` → its built `ThreeBufferGeometry`
per primitive, the node list, and the resolved material→image indices.

## Current coverage vs the gap

The **parser already exists and is unit-tested** at the object-model level:
`../../src/three_gltf_file.rgr` (+ `three_gltf_file_test.rgr`,
`three_gltf_loader_test.rgr`) parse a `.glb`, decode accessors into geometry, build
the node tree with TRS, and resolve material textures — validated with no rendering.

What is **missing** is the *interpreter-driven* path: the façade `GLTFLoader` is a
stub and loading is async + host-side (the host fetches/decodes; the browser
decodes images on a canvas), so an interpreted `loader.load('model.glb', …)` does
not yet flow through the bridge into a scene node the test can read back. That is
why this folder has no runner: the pieces exist, but not wired end-to-end from the
interpreter.

## Plan to unblock

1. Wire the façade `GLTFLoader.load()` → a bridge request → `host` decode via the
   existing `ThreeGLTFFile`, attaching the built geometry to a scene entity
   (the `GLTFModel` façade placeholder already exists for the host-attached case).
2. Provide a small, committed test asset (or reuse the fixture the existing
   `three_gltf_file_test` uses) so the run needs no network.
3. Add `gen-model-goldens.mjs` (parse the same asset in real three.js: node count,
   per-mesh vertex/index counts, bounds), a `model_scene.tsx`, and a runner.

Until then, the object-model parser tests in `../../src/` are the source of truth
for model-loading correctness.

## Files (planned)

| File | Role |
|---|---|
| `model_scene.tsx` | JS scene that loads a bundled `.glb` via the façade loader. |
| `three_model_loading_test.rgr` | Reconcile + read decoded geometry / node tree vs goldens. |
| `../../reference/gen-model-goldens.mjs` → `model_goldens.json` | Expected structure from real three.js `GLTFLoader`. |
| a small committed `.glb` fixture | The asset to load (no network). |
