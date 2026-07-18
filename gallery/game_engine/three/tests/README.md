# `three/tests/` — feature test folders (interpreter-driven)

Each subfolder is one **feature**, tested the way the engine is actually used:
a JavaScript scene (`.tsx`) is **run through the TSX interpreter** against the
`three.tsx` façade, and the results are validated against golden values computed
from the **real three.js**. The objects do **not** live in JS — the interpreter
supplies the *args*, and the real work happens in the Ranger object model / host.
These suites need no GPU: they check values and data, not pixels.

Every feature folder is self-contained:

```
<feature>/
  README.md      — what this feature tests, and how
  *.tsx          — the JS scene(s) the interpreter runs
  *_test.rgr     — the driver: boots the engine, runs the scene, validates
```

| Folder | Feature | Status |
|---|---|---|
| [`value_parity/`](./value_parity/) | Math + core API value parity (Vector2/3, Matrix4, Quaternion, Euler, Color, Object3D, MathUtils) returning correct values through the interpreter | 9 baseline PASS; parity `0/31` (the measured backlog) |
| [`geometry/`](./geometry/) | Primitive + complex geometry construction (Plane, Circle, Ring, Sphere, Cylinder, Cone, Torus, TorusKnot) built in the Ranger host from interpreter args | `62/62` PASS |
| [`spec/`](./spec/) | Camera (projection matrix), transformed-mesh world matrix, colour families, view-frustum culling — one runner, one description file | `57/57` PASS |

Requested but gated on engine/façade wiring (documented in [`spec/README.md`](./spec/README.md)):
**object hierarchy** (needs a façade `Group` + nested reconcile), **animation** (needs an
object-model `KeyframeTrack`/mixer), **model loading** (parser exists + unit-tested, but the
async host-side loader isn't interpreter-driven yet).

## One runner + a description file (why `spec/` is shaped that way)

The per-suite cost is Ranger→ES6 **compilation** (~8 s each); running the compiled JS is
sub-second. So the way to go faster is fewer *compiles*, not fewer *checks*. The `spec/`
runner is compiled **once** and reads its expected values from a data file
(`../reference/spec_goldens.json`) at run time — adding cases is a JSON edit, and several
features share one compile. New feature areas that fit this shape should join `spec/` rather
than get their own compiled suite.

Shared inputs live outside these folders (they are not per-feature):
- `../reference/` — the pinned three.js checkout, the golden generators
  (`gen-*.mjs`), and the committed `*_goldens.json` the drivers read.
- `../src/` — the Ranger object model (geometry, math, host) under test.
- `../tsx/three.tsx` — the façade the scenes import as `THREE`.

Run everything (each folder's suite is wired into `../src/run.sh`):
```bash
bash gallery/game_engine/three/src/run.sh     # prints ALL PASS per suite
```
Run one feature directly:
```bash
node bin/output.js -es6 \
  gallery/game_engine/three/tests/geometry/three_geometry_parity_test.rgr \
  -d=.out -o=t.js && node .out/t.js
```

The design rationale (reference checkout, goldens, the parity metric) is in
[`../../THREE_VALUE_PARITY_TESTS.md`](../../THREE_VALUE_PARITY_TESTS.md) and
[`../../THREE.md §9`](../../THREE.md).
