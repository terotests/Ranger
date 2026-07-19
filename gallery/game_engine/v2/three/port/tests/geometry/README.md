# geometry — primitive + complex geometry parity through the interpreter

## What is tested

That interpreted three.js geometry code builds the **correct vertex data** — and
that the data is built where it should be: **in the Ranger host, not in JS**.
`new THREE.SphereGeometry(1, 8, 6)` in the scene only carries the *args*; the real
positions/normals/uvs/indices are generated in the Ranger object model
(`../../src/three_primitive_geometries.rgr`, ported 1:1 from three.js). Geometry is
pure data, so this is fully checkable without a GPU.

Covered (each a mesh in `geom_probes.tsx`, in golden order):

| Geometry | Args used | verts / indices |
|---|---|---|
| Plane | `(2, 3, 2, 2)` | 9 / 24 |
| Circle | `(1, 8)` | 10 / 24 |
| Ring | `(0.5, 1, 8, 1)` | 18 / 48 |
| Sphere | `(1, 8, 6)` | 63 / 240 |
| Cylinder | `(1, 1, 2, 8, 1)` | 52 / 96 |
| Cone | `(1, 2, 8)` | 35 / 48 |
| Torus | `(1, 0.4, 6, 12)` | 91 / 432 |
| **TorusKnot** (complex) | `(1, 0.4, 32, 6, 2, 3)` | 231 / 1152 |
| Box (existing core class) | `(1, 1, 1)` | 24 / 36 |

## How it works — the full stack

```
geom_probes.tsx            new THREE.SphereGeometry(1,8,6)   (args only)
   │  ComponentEngine interprets
   ▼
ThreeTsxBridge             reads the façade geometry flag + args (buildGeometryH)
   │  commands the host
   ▼
ThreeSceneHost.geometry*() constructs the REAL Ranger geometry from the args
   │
   ▼
three_geometry_parity_test.rgr  reads host.geometryAt(h) and validates it
```

The driver interprets the scene, calls `bridge.renderFrame(...)` to reconcile it
(`host built geometries: 9`), then for each handle asserts against
`../../reference/geom_goldens.json` (from `../../reference/gen-geom-goldens.mjs`):

- exact **vertexCount** and **indexCount** (tessellation parity),
- **bounding box** (min/max xyz),
- **exact sample vertices** (first/middle/last — the 1:1 port preserves vertex
  order, so vertex _i_ must equal three.js's vertex _i_),
- render-free **invariants** true for all: whole-triangle index count, in-range
  indices, unit-length normals.

## Current result

`62/62 PASS`. The eight ported primitives match real three.js exactly. The
pre-existing hand-written `ThreeBoxGeometry` is an equivalent tessellation with a
**different vertex order**, so its exact-sample check is skipped with a `NOTE`
(count + bbox still checked) — documented, not faked.

## Add a geometry

1. Port `src/geometries/X.js` into `../../src/three_primitive_geometries.rgr`.
2. Add a `geometryX()` builder to `../../src/three_scene_host.rgr`.
3. Add the façade arg-holder class (`../../tsx/three.tsx`) + the bridge
   flag→builder route (`../../tsx/three_tsx_bridge.rgr`: `buildGeometryH` /
   `geometrySig`).
4. Add `capture(new THREE.XGeometry(...))` to `../../reference/gen-geom-goldens.mjs`
   and a mesh to `geom_probes.tsx` (same params, same order); regenerate
   `geom_goldens.json`.
5. Add one `ck.check(bridge.host <handle> "<key>" true)` line to the driver.

## Files

| File | Role |
|---|---|
| `geom_probes.tsx` | The JS scene the interpreter runs (one mesh per geometry). |
| `three_geometry_parity_test.rgr` | Driver: interprets the scene, reconciles into the host, validates the real Ranger geometries vs goldens. |
