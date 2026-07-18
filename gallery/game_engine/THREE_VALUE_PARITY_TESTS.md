# Value-parity test setup — running & validating arbitrary Three.js code

This is the unit-test rig for the goal in [`THREE.md §9`](./THREE.md#9-value-parity--running-arbitrary-threejs-code-from-the-interpreter):
_can the interpreter run almost any random three.js snippet and return the value
real three.js returns?_ It is the **value-axis** counterpart of the §8.2.1 render
fidelity gate — decoupled from whether anything draws.

## The idea in one line

> Interpret **natural three.js code** on the `three.tsx` façade, read the engine's
> returned values back with debugging instrumentation, and **diff them against
> golden numbers computed from the real three.js.**

A gap in the façade is not a crash: a missing method degrades to `null` in the
interpreter (`evaluateCallExpr` returns `EvalValue.null()`), so a probe that hits
an unimplemented method simply returns the wrong value and is reported as a
`GAP` — never a broken suite. That is what makes a **parity percentage** a stable,
always-runnable metric.

## Pipeline

```
                pinned three.js (npm)
                        │  fetch-three-reference.sh
                        ▼
   reference/vendor/three-<ver>/src   (read-only API reference, .gitignored)
                        │  gen-goldens.mjs   (runs the REAL three.js)
                        ▼
          reference/goldens.json      (committed — the source of truth)
                        │
   parity_probes.tsx ──┤  (natural three.js, one export per golden key)
                        ▼
        three_value_parity_test.rgr   (ComponentEngine + EvalValue instrumentation)
                        │
                        ▼
     PASS/FAIL (baseline gate) · OK/GAP + "value parity: implemented=X/Y (Z%)"
```

## Files

| File | Role |
|---|---|
| `three/reference/fetch-three-reference.sh` | `npm pack`s the pinned three.js and extracts `src/`+`build/` into `vendor/` (gitignored). GitHub isn't needed — the npm registry is reachable. |
| `three/reference/gen-goldens.mjs` | Imports the **real** three.js and computes reference values; one entry per probe. Run after bumping the pinned version. |
| `three/reference/goldens.json` | The committed golden numbers. The harness reads this at run time (no vendored source needed in CI). |
| `three/tsx/parity/parity_probes.tsx` | The probes: idiomatic three.js (`new THREE.Vector3(1,2,3).cross(v).normalize()`), one exported function per golden key, plus `base_*` functions using only façade-supported idioms. |
| `three/src/three_value_parity_test.rgr` | The instrumentation harness + the ordered probe list + the report. Wired into `run.sh` as `run_parity`. |

## The instrumentation

`ThreeValueProbe` in `three_value_parity_test.rgr`:

1. **Boot** — `registerGlobal("THREE"/"window")`, concatenate façade + probe scene,
   `engine.loadScript(...)`, and parse `goldens.json` with the repo's `ThreeJsonParser`.
2. **Drive** — `engine.callFunction(name, null)` runs a probe and returns its result
   as an `EvalValue` tree.
3. **Read back** — walk the golden's shape and pull the matching members from the
   engine result: `result.getMember("x").toNumber()`, `.getIndex(i)` for arrays,
   `.toBool()` for booleans. This is the "debugging instrumentation" — reading the
   interpreter's live value tree.
4. **Diff** — `matchField` compares each field with a `1e-4` epsilon (numbers),
   exact (bools), element-wise (arrays), and prints `OK` or a `GAP … (want=… got=…)`.

Two report channels, by design:
- **BASELINE** (`expectNum`) asserts idioms the façade supports **today**
  (`Vector3().set()/clone()/setScalar()/setFromSphericalCoords()`, `Scene.add/remove`)
  and emits `PASS`/`FAIL` + `ALL PASS`/`SOME FAILED` — the regression gate `run.sh`
  greps. If one of these breaks, the façade regressed.
- **PARITY** (`parity`) runs the golden-backed probes and emits `OK`/`GAP` plus
  `value parity: implemented=X/Y (Z%)`. GAPs are the measured backlog; they do
  **not** fail the suite.

## Running

```bash
# one-time: vendor the reference source (only needed to (re)generate goldens)
bash gallery/game_engine/three/reference/fetch-three-reference.sh
node gallery/game_engine/three/reference/gen-goldens.mjs \
     > gallery/game_engine/three/reference/goldens.json

# the test itself (goldens.json is committed — no vendor needed here)
bash gallery/game_engine/three/src/run.sh        # includes three_value_parity_test
# or just this suite:
node bin/output.js -es6 gallery/game_engine/three/src/three_value_parity_test.rgr \
     -d=.out -o=t.js && node .out/t.js
```

Current reading: **`implemented=0/31 (0%)`** — every probe uses idioms beyond the
façade's demo-shaped surface, so the number starts near zero and is the honest
measure of how far "run any random three.js" is. The rig is proven in both
directions: the 9 baseline checks pass, and adding a single real façade method
(e.g. `Vector3` constructor + `lengthSq`) flips its probe `GAP → OK` and moves the
metric — so the gate detects real implementation, not just absence.

## Adding a probe

1. Add a function to `gen-goldens.mjs` that computes the value from real three.js
   (keep the key stable).
2. Add the twin export to `parity_probes.tsx` — **the same math, in natural
   three.js** (this is the code we want to eventually run).
3. Add one `p.parity("<key>")` line to the ordered list in
   `three_value_parity_test.rgr`.
4. Regenerate `goldens.json`.

Keep the three in lock-step (same key, same construction). A probe is a
one-to-one contract: "this snippet, run on the façade, must equal real three.js."

## Bumping the pinned three.js version

Edit `THREE_VERSION` in `fetch-three-reference.sh`, re-fetch, regenerate
`goldens.json`, and re-run. Diffs in the goldens are three.js behavior changes
(e.g. color-management defaults) — review them before committing.

## Geometry parity (pure data, no rendering) — driven through the interpreter

Geometry is positions/normals/uvs/indices — fully testable without a GPU. Crucially
the **objects do not live in JS**: `new THREE.SphereGeometry(1,8,6)` in the
interpreted scene only carries the _args_; the real vertex data is built in the
**Ranger host** from those args (the same single-truth registry the demos use). The
test therefore drives the whole stack — interpreter → bridge → host — and validates
the **real Ranger object**, not anything on the JS façade.

Flow: `geom_probes.tsx` (JS) → `ComponentEngine` interprets it → `ThreeTsxBridge`
reads each mesh's geometry args and commands `ThreeSceneHost.geometry*()` → the host
constructs the Ranger geometry → the test reads `host.geometryAt(h)` and diffs it
against the goldens.

| File | Role |
|---|---|
| `three/reference/gen-geom-goldens.mjs` → `geom_goldens.json` | For each geometry, from real three.js: `vertexCount`, `indexCount`, bounding box, and **exact sample vertices** (first/middle/last). |
| `three/src/three_primitive_geometries.rgr` | `Plane/Circle/Ring/Sphere/Cylinder/Cone/Torus/TorusKnot` ported **1:1** from three.js's generators (same loop nesting ⇒ vertex _i_ equals three.js's vertex _i_). Object model — ES6 + C++, no rendering. **This is where the objects live.** |
| façade `three.tsx` + `three_scene_host.rgr` + `three_tsx_bridge.rgr` | Thin façade classes carry the args; the host has a `geometry*()` builder per type; the bridge routes each façade geometry flag → the host builder with three.js-default args. |
| `three/tsx/geom/geom_probes.tsx` | The **JS scene** run by the interpreter: one mesh per geometry, in golden order. |
| `three/src/three_geometry_parity_test.rgr` | Interprets the scene, reconciles it into the host, reads the real geometries back, and asserts count + bbox + exact samples + render-free invariants (whole-triangle index, in-range indices, unit normals). In `run.sh`. |

Result today: **62/62 PASS** — the interpreter builds all eight primitives + box in
the Ranger host (`host built geometries: 9`) and each matches real three.js exactly
(counts, bbox, sampled vertices). The pre-existing hand-written `ThreeBoxGeometry` is
an equivalent tessellation with a _different vertex order_, so its exact-sample check
is skipped with a `NOTE` (count + bbox still checked) — documented, not faked.

To add a geometry: (1) port its `src/geometries/*.js` generator into
`three_primitive_geometries.rgr`; (2) add a `geometryX()` builder to
`three_scene_host.rgr`; (3) add the façade arg-holder class + the bridge flag→builder
route (`buildGeometryH` / `geometrySig`); (4) add a `capture(new THREE.XGeometry(...))`
to `gen-geom-goldens.mjs` and a mesh to `geom_probes.tsx` (same params, same order);
regenerate `geom_goldens.json`; add one `ck.check(...)` line to the test.

## Coverage roadmap (probe families to add next)

The first batch covers the highest-leverage **value** surface (THREE.md §9.4 steps
2–3): Vector2/3/4, Matrix3/4, Quaternion, Euler, Color, Object3D transforms,
MathUtils. Natural next batches, each a new `*_probes.tsx` + golden section:

- **Object3D graph depth** — `traverse`, `getObjectByName`, `localToWorld`,
  nested `updateMatrixWorld`, `clone` deep-copy.
- **Geometry construction** — `SphereGeometry`/`PlaneGeometry`/… attribute counts,
  `BufferGeometry.setAttribute` + `BufferAttribute` (needs typed-array support).
- **Material/param round-trip** — constructor params captured & readable back.
- **Constants** — assert `THREE.<enum>` is defined and equals the numeric value
  (catches the "silently `undefined`" class of bug).
- **Raycaster** — value-level `intersectObjects` hit counts / distances.

Each new family raises the denominator; the parity % tracks real progress toward
"paste almost any random three.js and it runs."
