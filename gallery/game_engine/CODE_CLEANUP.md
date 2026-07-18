# CODE_CLEANUP — shrink the engine, then fix the Three object model

> Status: **in progress**. Scope: `gallery/game_engine` (+ the shared
> interpreter value type `gallery/pdf_writer/src/jsx/EvalValue.rgr`, which the
> Three path depends on).
>
> Two bodies of work, in order:
> - **Part I — delete dead weight** (files that serve no test/build/shipped-game
>   need). Tranche 1 **done**; no further deletions (see decisions).
> - **Part II — fix the Three object model.** An external architecture review
>   (folded in below) shows the entity-ID
>   problem is one of **several coupled issues** — the biggest being that the
>   interpreter has no stable object identity, which the entity-handle problem
>   sits on top of. The fix is identity-first, and it comes with a hard rule:
>   **stop adding Three classes/loaders/geometries until identity, keyed
>   reconciliation, and resource sharing are fixed** — every new feature
>   otherwise grows the signature/flag/typed-accessor web and gets harder to
>   unwind.
>
> **Decisions locked (owner):**
> - **D1 = keep `ranger_games/`.** It is load-bearing (TSX→native/C++/Rust
>   portability tests + npm scripts). Part I is therefore **complete at tranche
>   1**; no further file deletion.
> - **D2 = Line B — native-object adapter.** Goal is broad Three.js value
>   parity ("paste almost any Three.js code"), so the interpreter gets a real
>   native-object adapter (§II.9), not just a bounded façade subset.
> - **D3 = keep planning.** No implementation yet; this document + the ADR are
>   the review artifacts.

---

# Part I — reorganize first, delete later

**Strategy (owner):** do **not** delete eagerly. First build a single `core/`
folder and move the genuine engine core into it; then whatever is left *outside*
`core/` (and outside `games/`, `docs/`, `assets/`, `menu/`, `prototypes/`) is
the real cleanup candidate set, judged with the boundary already made concrete.
Reorg is compile-verified (`bin/output.js` runs here); nothing is removed until
the core boundary is drawn.

## I.0 Protected — never delete
`docs/`, `assets/`, `menu/` are kept as-is. `ranger_games/` is kept too, moved
to `prototypes/` (§I.3). `games/<name>/` are the shipped games.

## I.1 Keep/delete criterion (applied only after the core move)
A file **stays** iff it is (a) engine core / reusable subsystem imported by a
shipped path, (b) a shipped game under `games/<name>/`, (c) reachable from a
test/build root (a vitest `.test.ts`, `scripts/*.sh|*.mjs`, repo-root
`package.json`, or a subsystem runner like `three/src/run.sh`), or (d) in a
protected folder (§I.0). Everything else — surfaced by "what sits outside
`core/` after the move" — is a delete candidate, decided then, not now.

## I.2 Tranche 1 — DONE (28 files, all zero-reference)
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

## I.3 `ranger_games/` → `prototypes/` (keep, don't delete)
`ranger_games/` is **not** dead — it's the TSX→native/C++/Rust portability proof
(load-bearing for `ts-to-ranger-{native,host}.test.ts`, `game-engine-render.
test.ts`, the `engine:*` npm scripts, and several `build-*.sh`). **Decision:
keep it, but move it and its TSX→Ranger tests under a `prototypes/` folder** so
the main line is uncluttered without losing the proof. Mechanical move only —
relocate `ranger_games/` → `prototypes/ranger_games/`, the `ts-to-ranger-*`
tests → `prototypes/` (or `tests/prototypes/`), and rewrite the relative
`Import` paths + the test/`package.json`/`build-*.sh` path references; verify by
compiling. No behaviour change.

## I.4 Flag: a game name in a core file is a leak, by definition
Principle (AGENTS.md rule #1): a generic runner/core file must know **nothing**
about a specific game. So **any file under the core area whose name contains a
game** (`autopeli`, `pong`, `pacman`, `invaders`, `sprite_char`,
`streaming_world`, `pyorretris`, …) is suspect and flagged for review — it is
either mislabeled core, a game that belongs under `games/`, or a demo. Survey of
`scripting/`:

| File | Verdict |
|------|---------|
| `wasm_autopeli_setup.rgr`, `wasm_autopeli_render.rgr` | **The leak.** Imported by the *generic* `wasm_physics_runner.rgr` — a runner reaching into a game. Move the game logic to `games/autopeli_*/`; the runner binds via the `GameSceneProvider` seam (`IDEAL.md` §8). Not a plain `rm`; a refactor. |
| `streaming_world_runner.rgr` | Game-named "runner" → belongs with `games/streaming_world/`, not core. Review. |
| `sprite_char_poc.rgr`, `sprite_char_poc_demo.rgr` | PoC for the sprite-char game → `games/sprite_char/` or `prototypes/`. Review. |
| `ranger_autopeli_runner_demo`, `ranger_pong_runner_demo`, `wasm_autopeli_runner_demo`, `wasm_pong_runner_demo`, `pyorretris2p_demo` | Game-named demos, imported by no runner. Test-referenced ones move with their game/`prototypes/`; orphans join the delete list after the core move. |

**Rule going forward:** after the `core/` move (§I.5), a CI grep asserts no file
in `core/` contains a game name in its filename *or* an `Import` of one — the
mechanical version of "the runner has nothing to do with the games."

## I.5 The `core/` move — Phase 1 (do this before any more deletion)
`scripting/` is a dumpster: 88 `.rgr` mixing game-neutral **core** (facades,
ABI, generic runners), **games** (`*.game.tsx`), and **demos**
(`*_runner_demo.rgr`), plus loose core files at the engine root
(`framebuffer.rgr`, `gfx_sdl.rgr`, `rgba_fast_blit.rgr`, `wasm_runtime.rgr`).
Move the core into one `core/` folder so the boundary is physical, not implied.

**Proposed target layout** (subsystems already have their own folders; the open
question is whether they move *under* `core/` or stay siblings):
```
core/
  gfx/        framebuffer.rgr, gfx_sdl.rgr, rgba_fast_blit.rgr
  runtime/    game_runtime, game_physics, game_audio, game_hud, game_sprite,
              game_camera, game_input, game_particles, game_persistence,
              game_fixed_step, game_runner_mode, game_entity_store,
              game_world_grid, … (the game-neutral scripting/ facades)
  wasm/       wasm_runtime.rgr, wasm_abi_io, wasm_ui_io, as_abi_bridge,
              wasm_cap_gate, wasm_block_validator, the generic *_runner.rgr,
              + the wasm/*.h ABI headers
  (subsystems: three/ physics/ model3d/ lpc/ pose/ ui/ lib/ — move under
   core/ too, or keep as siblings? → decision C1)
```
**Blast radius.** Imports are **relative**, so each moved file rewrites its own
`../` imports *and* every importer's path to it (e.g. `framebuffer.rgr` alone
has 27 importers). Therefore move in **blast-ordered tranches, compile-verified**:
1. **Loose gfx roots** (`framebuffer`, `gfx_sdl`, `rgba_fast_blit`) → `core/gfx/`
   — self-contained, ~30 importer edits, a clean first proof of the mechanic.
2. **`wasm_runtime` + ABI/runners** → `core/wasm/`.
3. **`scripting/` game-neutral facades** → `core/runtime/` (leaving games +
   demos behind — which is exactly what makes the leftover set the cleanup list).
4. **Subsystems** (`three/`, `physics/`, …) → under `core/` *iff* C1 says so.
Each tranche: `git mv`, rewrite `Import` strings + test/script/`package.json`
paths, compile the affected roots via `bin/output.js`, commit. No deletion in
Phase 1.

**Then** Part I.1's criterion is applied to whatever remains outside `core/`,
`games/`, `prototypes/`, and the protected folders — the delete list writes
itself.

---

# Part II — fix the Three object model (the real work)

## II.1 Issue — the interpreter has no stable object identity
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

**The type system it plugs into** (`EvalValue.valueType`): `0` null,
`1` number, `2` string, `3` bool, `4` array, `5` object, `6` function/bound-
method, `7` **native `EVGElement`** (`EvalValue.element()` — a native Ranger
object already wrapped in an EvalValue), `8` undefined, `9` Map, `10` Set. Map
(9)/Set (10) store keys in `arrayValue` and look them up with the broken
`equals()`, so object keys silently fail today. Note `7` already proves the
interpreter can hold a native host object — Line B (§II.9) generalizes exactly
that slot.

**Fix (interpreter core — high blast radius, do behind a semantics test suite):**
- Add a monotonic `identityId:int` to `EvalValue`, assigned once at construction
  for every reference type (`4,5,6,7,9,10`). Make `equals()` compare `identityId`
  for those types instead of `return false`. Route `===`, `Map`/`Set` keys,
  `Array.indexOf/includes` through it. This identity is also what the reconciler
  keys on — no more `__rid`/`__removed`.
- `getMember()` on a missing key → `EvalValue.undefined()` (type 8), not
  `EvalValue.null()` (`EvalValue.rgr:341`); null/invalid receiver → defined
  error/optional path.
- ⚠️ `EvalValue` lives in `gallery/pdf_writer/` and is shared by the **whole**
  JSX/TSX interpreter (pdf_writer + game engine + UI/EVG), so this is validated
  by a new `component_engine_js_semantics_test` (see §II.5) and the existing
  pdf_writer suites, not just Three tests. Sequence identity before the
  `null→undefined` change (the latter can surface latent `isNull()` assumptions).

## II.2 Lock one architecture — a short ADR  *(docs currently contradict)*
`IDEAL_THREE.md` says Ranger/C++/WASM front-ends use the object model directly;
`THREE_BRIDGE.md` says all front-ends issue commands to one host-owned handle
registry. The second is the built direction, but the first is still in the
design docs, and `THREE.md` still names Teapot/Sponza via removed demo bridges.
Write one ADR: **"`ThreeSceneHost` owns authoritative state; interpreter/Ranger/
WASM front-ends hold opaque handles and own no Three object graph."** Then delete
or mark-historical the alternative descriptions.

## II.3 Reconciler: key by identity, mark-and-sweep
`three_tsx_bridge.rgr` caches top-level nodes by `scene.children` index and
nested nodes by DFS ordinal, and states it *"Assumes a stable tree shape"*
(`:77,86,89`). `syncScene()` walks only currently-visible children with **no
mark-and-sweep**, so removing/reordering/reparenting a node, inserting mid-list,
or a hot-reload rebuild leaves stale host objects and misaligned handles.

**Fix:** maintain identity→handle maps (`EvalValue id → entity`, `geometry id →
geometry`, `material id → material`, `texture id → texture`). Each reconcile:
1) mark reached identities, 2) create missing, 3) update changed, 4) **destroy
unmarked**, 5) set parent links explicitly. Never use an array index as identity.

## II.4 Resource sharing + lifecycle
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

## II.5 Type-erasure → capability components
`ThreeSceneHost.entities` stores everything as `ThreeObject3D`; with no downcast,
Sponza reaches typed nodes via `sunLight()/skyNode()/modelNode()` accessors on
the bridge. Each new technique (probe, fog, post) would grow that list until the
reconciler is a service locator. **Fix:** a host typed side-registry /
capability model — `EntityHandle → optional {DirectionalLight, Sky, Mesh,
ProbeGrid} component`; technique code depends on host capabilities, not
`ThreeTsxBridge`.

## II.6 Command ABI from one schema
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

## II.8 Goal scoping — Line B chosen (native adapter)
`three.tsx` hand-copies Vector3/Object3D methods (and carries the `__removed`
hack, `three.tsx:60,67,71`) while wanting the math to live only in Ranger core —
these fight as the API grows to hundreds of methods. **Owner picked Line B**:
true value parity via a native-object adapter, so `THREE.Vector3/Matrix4/
Quaternion/Object3D` become interpreter wrappers over the Ranger canonical model
(the same objects the host already uses), removing the hand-copied ~90 Vector3
methods. (Line A — a bounded façade subset — is retired as the goal.)

## II.9 Line B design — the native-object adapter *(chosen)*
The interpreter **already** wraps one native Ranger class: `valueType 7`
(`EvalValue.element(el:EVGElement)`). Line B generalizes that single-class hook
into a typed adapter so the interpreter can construct and drive *any* registered
native class by value.

1. **Generic native slot.** Replace the special-cased `evgElement` field with a
   `nativeObject` reference + a `nativeClassId`. `EVGElement` becomes the first
   client of the general mechanism rather than a bespoke type tag.
2. **`NativeClassAdapter` interface**, one per exposed class, registered with the
   ComponentEngine:
   ```
   interface NativeClassAdapter {
       fn className() : string                          ; "Vector3" | "Object3D" | …
       fn construct(args:[EvalValue]) : NativeRef        ; new THREE.Vector3(x,y,z)
       fn getProperty(self:NativeRef key:string) : EvalValue
       fn setProperty(self:NativeRef key:string v:EvalValue) : void
       fn invokeMethod(self:NativeRef m:string args:[EvalValue]) : EvalValue
   }
   ```
3. **`new THREE.X(...)` dispatch.** When the interpreter evaluates a `new` on a
   registered class, it calls `adapter.construct(args)` and returns an EvalValue
   holding the `NativeRef` — no façade `class Vector3` in `three.tsx` at all.
   Member get/set and method calls on that value route to
   `getProperty/setProperty/invokeMethod`.
4. **Backing objects are the canonical Ranger types.** `Vector3` → the Ranger
   core `Vec3`; `Matrix4` → `Mat4`; `Quaternion` → `Quat`; `Object3D` → the host
   `ThreeObject3D`. So the interpreter, the host scene, and the parity tests all
   read the **same** math — closing §II.7's "value parity could be 100% while
   core differs" gap by construction.
5. **Identity for free.** A `NativeRef`-bearing EvalValue gets an `identityId`
   like any reference (§II.1), so shared `geometry`/`material`/`Object3D`
   instances are the *same* value everywhere — this is what makes §II.4 resource
   aliasing and §II.3 keyed reconciliation actually work (two meshes sharing one
   material share one handle).
6. **Scope of the first cut.** Start with the math/scene-graph core actually
   exercised by the parity goldens: `Vector3`, `Euler`, `Quaternion`, `Matrix4`,
   `Object3D`, `Color`. Geometry/material/texture stay host resources reached via
   the command ABI (§II.6); the adapter is for the *value* types Three code
   constructs and mutates directly. Loaders/new materials wait for the §II hard
   gate.

**Blast radius / risk.** This is a ComponentEngine change, not a Three-only one:
`new`, member access, and method dispatch in the interpreter gain a native path.
It must land behind the §II.5 semantics suite and keep the existing `EVGElement`
UI path working (it becomes adapter client #0, a built-in regression).

---

# Recommended execution order (Line B locked)
0. **ADR** (§II.2) — lock "host owns state"; retire the contradictory
   `IDEAL_THREE.md`/`THREE.md` descriptions. *(Doc-only; see `docs/ADR-0001`.)*
1. **Interpreter semantics** (§II.1) — `identityId` + `equals()` by identity,
   `getMember` missing→`undefined`, identity-keyed Map/Set, clear error states —
   behind the new semantics suite. **Prereq for everything below.**
2. **Native-object adapter** (§II.9) — generalize the `valueType 7` native slot
   into `NativeClassAdapter`; back `Vector3/Euler/Quaternion/Matrix4/Object3D/
   Color` with the Ranger canonical types; keep `EVGElement` working as client #0.
3. **Identity-keyed reconciler** (§II.3) — replace index/DFS cache with a keyed
   diff + mark-and-sweep, keyed on the §II.1 identity.
4. **Resource aliasing + lifecycle + host EntityRegistry** (§II.4) — shared
   resources by identity; generation handles; refcount/release; fold in
   `model3d`'s registry; regression-test resource counts.
5. **Capability components** (§II.5) — retire `sunLight()/skyNode()/…`.
6. **Command ABI from one schema** (§II.6) — kill host/native drift.
7. **Extend the parity rig** (§II.7) — types, errors, identity, aliasing,
   cross-layer.
> **Hard gate:** do not add the next material/loader/geometry until steps 1–4
> land.

# Decisions — RESOLVED
- **D1 = keep `ranger_games/`.** Part I complete at tranche 1; no further
  deletions.
- **D2 = Line B** (native-object adapter, §II.9).
- **D3 = keep planning.** No code yet; this doc + `docs/ADR-0001-three-scene-
  host-authority.md` are the artifacts to review.

**Open for your review before any implementation:** does the step 0→4 ordering
work, and do you want the ADR (step 0) landed as the first concrete change since
it's doc-only and unblocks the doc cleanup?

---
*Part I tranche 1 committed. Part II is planning-only pending your review.*
