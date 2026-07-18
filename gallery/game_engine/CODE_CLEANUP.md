# CODE_CLEANUP — shrink the engine, then fix the Three object model

> Status: **in progress**. Scope: `gallery/game_engine` (+ the shared
> interpreter value type `gallery/pdf_writer/src/jsx/EvalValue.rgr`, which the
> Three path depends on).
>
> Two bodies of work, in order:
> - **Part I — delete dead weight** (files that serve no test/build/shipped-game
>   need). Tranche 1 **done**; the rest gated on decisions in §I.3.
> - **Part II — fix the Three object model.** An external architecture review
>   (folded in below, every claim verified against code) shows the entity-ID
>   problem is a *symptom* of a deeper root cause: **the interpreter has no
>   stable object identity.** The fix is identity-first, and it comes with a hard
>   rule: **stop adding Three classes/loaders/geometries until identity, keyed
>   reconciliation, and resource sharing are fixed** — every new feature
>   otherwise grows the signature/flag/typed-accessor web and gets harder to
>   unwind.

---

# Part I — dead-file cleanup

## I.1 Keep/delete criterion
A file **stays** iff it is (a) engine core / reusable subsystem imported by a
shipped path, (b) a shipped game under `games/<name>/`, or (c) reachable from a
test/build root: a vitest `.test.ts`, `scripts/*.sh|*.mjs`, repo-root
`package.json`, **or a subsystem test runner like `three/src/run.sh`**. Anything
else is a delete candidate.

## I.2 Tranche 1 — DONE (28 files, all verified zero-reference)
Removed on this branch; every file confirmed unreferenced across all roots +
`.rgr` imports before deletion:
- `old/ylos/` (superseded original of `games/ylos2-4`).
- Debug/bisect scratch: `scripting/autopeli_debug_{load,min,orig}.rgr`,
  `scripting/autopeli_bisect.rgr`.
- 22 orphan `scripting/*_demo.rgr` (no test, script, package.json, or import
  loads them): `as_autopeli_src_demo`, `as_physics_integration_demo`,
  `as_source_demo`, `autopeli_physics_runner_demo`, `game_env_resolver_demo`,
  `game_fixed_step_demo`, `game_provider_demo`, `game_runner_mode_demo`,
  `game_scene_provider_demo`, `game_script_contract_demo`,
  `game_sound_palette_demo`, `game_split_nav_demo`, `game_split_world_demo`,
  `import_ast_cache_demo`, `lpc_test_runner_demo`, `menu_tsx_fit_demo`,
  `menu_tsx_render_demo`, `menu_tsx_uirunner_demo`, `pose_provider_demo`,
  `wasm_block_validator_demo`, `wasm_cap_gate_demo`, `wasm_ui_demo`.

*(Note: vitest deps aren't installed in this environment, so the JS suite
couldn't be run here; safety is by construction — none of the 28 are referenced
by any test/build root or import.)*

## I.3 Pending tranches — need a decision (NOT dead weight)
The survey **corrected** an assumption: `ranger_games/` is *not* an orphan
island. Five files are load-bearing test/build fixtures:

| File | Loaded by |
|------|-----------|
| `ranger_games/pong_sdl.rgr` | `game-engine-render.test.ts`, `scripts/build-sdl.sh` |
| `ranger_games/{counter,invaders,pong,spawner}_native_runner.rgr` | `ts-to-ranger-{native,host}.test.ts`, `package.json engine:*:native` |
| `ranger_games/{invaders,pong,pacman}_native_sdl_runner.rgr` | `scripts/build-game-sdl-native.sh` |
| `ranger_games/{sprite_char,streaming_world}_sdl.rgr` | `scripts/build-{sprite-char,streaming-world}-sdl.sh` |
| `ranger_games/pong.rgr` | `package.json engine:compile{,:cpp,:rust}`, `engine:run`, `build-native.sh`, `build-raspberry.sh` |

Deleting these deletes the **TSX→native/C++/Rust portability proof** and breaks
those tests + npm scripts. So it's a "remove the feature + its tests + its build
wiring + its README/AGENTS sections" decision, not a cleanup. Same for the
`category=Tests` game variants (`games/ranger_autopeli`, `ranger_pong`,
`rust_pong`, `autopeli_as_src`, `autopeli_physics`, `autopeli_wasm`) — each is
reachable only through its own `scripting/*_runner_demo.rgr`, so a variant and
its runner must go together.

**Decisions needed** (§ Decisions, bottom).

## I.4 NOT deletable — refactor targets, not cleanup
`scripting/wasm_autopeli_setup.rgr` and `wasm_autopeli_render.rgr` are the
"world encoded twice" smell AGENTS.md flags, but they are **live imports** of
`wasm_physics_runner.rgr`. They're removed by the `IDEAL.md` §8 seam refactor,
not by `rm`.

---

# Part II — fix the Three object model (the real work)

## II.0 The one-line diagnosis
The system is quietly building **two products at once**: (1) a Three.js-compatible
JS runtime, and (2) a Ranger-native object model. They can converge, but only
once the contract between them is explicit and the interpreter has real object
identity. Today the seam leaks in five verified places.

## II.1 Root cause — the interpreter has no stable object identity  *(verified)*
- `EvalValue.equals()` returns **`false` for every object and array**
  (`gallery/pdf_writer/src/jsx/EvalValue.rgr:540-541`, *"reference equality for
  now → return false"*). So `a === a` is false; `Map`/`Set` object keys (same
  `equals`) are broken; `Array.indexOf/includes` on objects fail.
- Consequence in the Three façade: `three.tsx` can't use object identity to
  remove nodes, so it carries a `__removed` workaround.
- `EvalValue.getMember()` returns **`null` for a missing member**
  (`EvalValue.rgr:341`) although a distinct `undefined` exists (`isUndefined`,
  `EvalValue.undefined()`). Breaks default params, `typeof`, `??`, optional
  chaining, and lets tests confuse "missing" with a real `0`/`false`.

**Fix (interpreter core — high blast radius, do behind a semantics test suite):**
- Give every reference value (`object`, `array`, `function`, `Map`, `Set`,
  native) a monotonic `identityId`. Route `===`, `Map`/`Set` keys,
  `indexOf`/`includes` through it. This identity is also what the reconciler
  keys on — no more `__rid`/`__removed`.
- Missing member → `undefined` (not `null`); null/invalid receiver → defined
  error/optional path.
- ⚠️ `EvalValue` is shared by the whole JSX interpreter (pdf_writer + game
  engine), so this change is validated by a new
  `component_engine_js_semantics_test` (see §II.5), not just Three tests.

## II.2 Lock one architecture — a short ADR  *(docs currently contradict)*
`IDEAL_THREE.md` says Ranger/C++/WASM front-ends use the object model directly;
`THREE_BRIDGE.md` says all front-ends issue commands to one host-owned handle
registry. The second is the built direction, but the first is still in the
design docs, and `THREE.md` still names Teapot/Sponza via removed demo bridges.
Write one ADR: **"`ThreeSceneHost` owns authoritative state; interpreter/Ranger/
WASM front-ends hold opaque handles and own no Three object graph."** Then delete
or mark-historical the alternative descriptions.

## II.3 Reconciler: key by identity, mark-and-sweep  *(verified)*
`three_tsx_bridge.rgr` caches top-level nodes by `scene.children` index and
nested nodes by DFS ordinal, and states it *"Assumes a stable tree shape"*
(`:77,86,89`). `syncScene()` walks only currently-visible children with **no
mark-and-sweep**, so removing/reordering/reparenting a node, inserting mid-list,
or a hot-reload rebuild leaves stale host objects and misaligned handles.

**Fix:** maintain identity→handle maps (`EvalValue id → entity`, `geometry id →
geometry`, `material id → material`, `texture id → texture`). Each reconcile:
1) mark reached identities, 2) create missing, 3) update changed, 4) **destroy
unmarked**, 5) set parent links explicitly. Never use an array index as identity.

## II.4 Resource sharing + lifecycle  *(verified)*
`buildMeshH()` always calls `buildGeometryH()`/`buildMaterialH()`
(`three_tsx_bridge.rgr:~560`), so two meshes sharing one `geometry`/`material` in
Three.js get **separate** host resources — material edits don't affect both, and
`dispose()`/`needsUpdate` can't be modelled. A mesh signature change frees no
geometry/material, so long hot-reload/GUI sessions grow the host tables
unbounded.

**Fix:** identify geometry/material/texture by **interpreter identity, not mesh
signature**, so shared resources map to one handle; add lifecycle ops with
refcount or mark-and-sweep:
```
geometryCreate / geometryUpdate / geometryRelease
materialCreate / materialUpdate / materialRelease
textureCreate  / textureUpdate  / textureRelease
entityCreate   / entityReparent / entityDestroy
```
**This is where the EntityRegistry work lands** — the host registry gains stable
generation-checked handles + a free list + refcount, replacing the append-only
`entities`/`geometries`/`materials` arrays and the no-op `entityRemove`
(`three_scene_host.rgr:255`). (32-bit handle `= (generation<<20)|(slot+1)`, per
earlier decision.) `model3d/EntityModel.rgr`'s parallel index-based
`EntityRegistry` folds onto the same core.

## II.5 Type-erasure → capability components  *(verified direction)*
`ThreeSceneHost.entities` stores everything as `ThreeObject3D`; with no downcast,
Sponza reaches typed nodes via `sunLight()/skyNode()/modelNode()` accessors on
the bridge. Each new technique (probe, fog, post) would grow that list until the
reconciler is a service locator. **Fix:** a host typed side-registry /
capability model — `EntityHandle → optional {DirectionalLight, Sky, Mesh,
ProbeGrid} component`; technique code depends on host capabilities, not
`ThreeTsxBridge`.

## II.6 Command ABI from one schema  *(drift verified)*
Host exposes 10 geometry constructors; `ThreeNativeBridge.invoke` exposes 2
(Box, Teapot). The declarative reconciler calls the host directly so demos work,
but the command transport is hand-maintained and already drifted. **Fix:** one
command schema generating the `ThreeSceneHost` interface, `ThreeNativeBridge.
has/invoke`, WASM imports, TS/Rust wrappers, the doc command table, and a
surface-parity test.

## II.7 Harden the parity rig (`THREE_VALUE_PARITY_TESTS.md`)
Good foundation (real Three.js goldens, natural Three code as input, render vs
value parity split, honest 0/31 reporting), but:
- `matchField()` uses `ev.toNumber()`; `null.toNumber()==0`, `null.toBool()==
  false`, so a **missing** impl passes when the golden is `0`/`false`. Type-check
  first; give a field one of `MISSING / THREW / WRONG_TYPE / VALUE_MISMATCH / OK`.
- Split out a `component_engine_js_semantics_test` (identity `a===a`, distinct
  objects unequal, Map/Set object keys, `undefined` vs `null`, `extends`/`super`,
  getters/setters, typed arrays, constructor defaults, error types) so JS-runtime
  gaps don't hide inside the Three-API "GAP" bucket.
- Add **cross-layer** parity (façade state == host canonical object), and
  aliasing/lifecycle tests: two meshes share geometry/material; material change
  shows in both; removing a child really removes the host entity; mid-list insert
  keeps others' identity; reorder preserves objects; reparent updates
  parent+matrixWorld; dispose/reload doesn't grow resource count; nested texture
  request resolves.
- Report a vector, not one %: `executed cleanly / correct type / correct value /
  core-synced`, with versioned profiles (`three-core-math-v1`, `object3d-v1`, …).

## II.8 The Line A / Line B decision (goal scoping)
`three.tsx` hand-copies Vector3/Object3D methods while wanting the math to live
only in Ranger core — these fight as the API grows to hundreds of methods.
- **Line A — bounded demo compat.** Façade stays a data model over a named
  Three.js subset; drop "paste arbitrary Three.js code"; reconciler+bridge tests
  are the contract. Cheapest, most stable.
- **Line B — true value compat.** Add a native-object adapter
  (`EvalValue.nativeObject`, `NativeClassAdapter{construct,getProperty,
  setProperty,invokeMethod}`) so `THREE.Vector3/Matrix4/Quaternion/Object3D` are
  interpreter wrappers over the Ranger canonical model — removes the hand-copied
  ~90 Vector3 methods. Bigger interpreter change, but the only path to "almost
  any Three.js code."

---

# Recommended execution order
1. **ADR** (§II.2) — lock "host owns state"; retire the contradictory docs.
2. **Interpreter semantics** (§II.1) — object identity, missing→`undefined`,
   identity-keyed Map/Set, clear error states — behind the new semantics suite.
3. **Identity-keyed reconciler** (§II.3) — replace index/DFS cache with a keyed
   diff + mark-and-sweep.
4. **Resource aliasing + lifecycle + host EntityRegistry** (§II.4) — shared
   resources by identity; generation handles; refcount/release; fold in
   `model3d`'s registry; regression-test resource counts.
5. **Capability components** (§II.5) — retire `sunLight()/skyNode()/…`.
6. **Command ABI from one schema** (§II.6) — kill host/native drift.
7. **Line A vs B** (§II.8) — decide the native-object adapter.
8. **Extend the parity rig** (§II.7) — types, errors, identity, aliasing.
> **Hard gate:** do not add the next material/loader/geometry until steps 2–4
> land.

# Decisions needed from you
- **D1 (cleanup).** `ranger_games/` + the `category=Tests` game variants + their
  `ts-to-ranger-*` tests and `engine:*` npm scripts: delete the whole
  TSX→native portability feature, or keep it? (It's load-bearing, not dead.)
- **D2 (goal).** Line A (bounded façade subset) or Line B (native-object adapter
  for broad value parity)? This sets how far steps 2 and 7 go.
- **D3 (order).** Do you want me to start at step 1–2 (ADR + interpreter
  identity, the root cause), or land the host-side EntityRegistry (step 4) first
  as an isolated win while the interpreter change is scoped?

---
*Part I tranche 1 is committed. Parts I.3 and II await D1–D3.*
