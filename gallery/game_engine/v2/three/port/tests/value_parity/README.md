# value_parity — math + core API value parity through the interpreter

## What is tested

Whether the TSX interpreter can run **natural three.js math/core code** and get
the value real three.js returns — decoupled from rendering. This is the
value-axis counterpart of the render-fidelity gate (THREE.md §8.2.1) and the
operational meaning of "run almost any random three.js code from the interpreter"
(THREE.md §9).

`parity_probes.tsx` holds one exported function per checked API, written as
idiomatic three.js (constructor args, method chains):

- **Vector3** — `add`, `sub`, `cross`, `dot`, `normalize`, `lengthSq`,
  `distanceTo`, `lerp`, `multiplyScalar`, `applyMatrix4`, `applyQuaternion`
- **Vector2** — `length`, `add`, `angle`
- **Matrix4** — `makeRotationY`/`applyMatrix4`, `compose`, `determinant`
- **Quaternion / Euler** — `setFromAxisAngle`, `setFromEuler`, `setFromQuaternion`
- **Color** — channel values (incl. sRGB→linear), named colors, `setHSL`
- **Object3D** — `lookAt`, world position, child count, `.parent` identity,
  `traverse`
- **MathUtils** — `degToRad`, `clamp`, `lerp`

## How it works

`three_value_parity_test.rgr` boots `ComponentEngine`, concatenates the façade
(`../../tsx/three.tsx`) with `parity_probes.tsx`, runs it, then drives each probe
with `engine.callFunction(...)` and reads the returned `EvalValue` tree back
(`getMember` / `getIndex` / `toNumber` / `toBool`). It diffs each field against
`../../reference/goldens.json` (produced by `../../reference/gen-goldens.mjs` from
the real three.js). A missing façade method degrades to `null` in the interpreter
(it does not abort), so a gap surfaces as a value mismatch — reported, never a
crash.

Two report channels:
- **BASELINE** — idioms the façade supports today (`Vector3().set()/clone()`,
  `Scene.add/remove`, `setFromSphericalCoords`) → `PASS`/`FAIL` + `ALL PASS`
  (the regression gate `run.sh` greps).
- **PARITY** — the golden-backed probes → `OK`/`GAP` + a
  `value parity: implemented=X/Y (Z%)` line. GAPs are the measured backlog; they
  do **not** fail the suite.

## Current result

`value parity: implemented=0/31 (0%)` — the probes use idioms beyond the façade's
demo-shaped surface (per THREE.md §9, most math lives in the Ranger core but is
not yet surfaced/delegated through the façade), so the number starts at zero and
is the honest measure of the gap. As the façade grows, GAPs flip to `OK` and the
percentage climbs. The 9 baseline checks prove the harness detects real values;
adding one real façade method (e.g. `Vector3` ctor + `lengthSq`) flips its probe
`GAP → OK`.

## Add a probe

1. Add a function computing the value from real three.js to
   `../../reference/gen-goldens.mjs` (stable key).
2. Add the twin export to `parity_probes.tsx` — same math, natural three.js.
3. Add one `p.parity("<key>")` line to `three_value_parity_test.rgr`.
4. Regenerate `../../reference/goldens.json`.

## Files

| File | Role |
|---|---|
| `parity_probes.tsx` | The JS probes the interpreter runs. |
| `three_value_parity_test.rgr` | Driver: boots the engine, runs the probes, diffs vs goldens, reports baseline + parity %. |
