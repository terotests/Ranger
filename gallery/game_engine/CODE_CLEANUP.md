# CODE_CLEANUP — shrink the engine, then fix the Three object model

> Status: **in progress**. Scope: `gallery/game_engine` (+ the shared
> interpreter value type `gallery/pdf_writer/src/jsx/EvalValue.rgr`, which the
> Three path depends on).
>
> Chapters:
> - **Part I — reorganize first, delete later.** Build a `core/` folder, move the
>   engine core in; the leftover is the real cleanup set. Tranche 1 deletions done.
> - **Part II — Entity Registry & stable identity (engine-wide).** One
>   generation-tagged id, carrying an Object Type ID, shared by the interpreter,
>   the host, and the WASM bridge. The branch's core theme.
> - **Part III — fix the Three object model.** The coupled Three issues that sit
>   on Part II: reconciler, resource sharing, bridge-call model, parity rig.
> - **Part IV — Class Registry** (the bridge ABI contract, special review).
> - **Part V — the Bridge** (native classes via `NativeClassAdapter` + object
>   invocation + native modules like `ranger-game`; D2 = Line B).
>
> Hard rule from the review: **stop adding Three classes/loaders/geometries until
> identity, keyed reconciliation, and resource sharing land** — every new feature
> otherwise grows the signature/flag/typed-accessor web and gets harder to unwind.
>
> **Decisions locked (owner):**
> - **D1 = keep `ranger_games/`.** It is load-bearing (TSX→native/C++/Rust
>   portability tests + npm scripts). Part I is therefore **complete at tranche
>   1**; no further file deletion.
> - **D2 = Line B — native-object adapter.** Goal is broad Three.js value
>   parity ("paste almost any Three.js code"), so the interpreter gets a real
>   native-object adapter (Part V), not just a bounded façade subset.
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

## I.6 Relocate the TS evaluator (under review)
The evaluator — `gallery/pdf_writer/src/jsx/{ComponentEngine,EvalValue}.rgr` +
`gallery/ts_parser/` — is where most current work happens: ~44 importers under
`gallery/game_engine/`, vs a handful in `pdf_writer` (tools/lib/bench) and the
separate `ts_to_ranger` module. Bringing it into the engine is reasonable, but
the shape matters:
- **Option A — move under `core/jsx/`.** Simple, matches "dev lives here", but
  inverts the dependency: `pdf_writer` and `ts_to_ranger` would import *up* into
  `game_engine`, which is a layering smell (pdf_writer is the older, lower
  module).
- **Option B — promote to a shared gallery-level module** (e.g.
  `gallery/jsx_engine/`) that `game_engine`, `pdf_writer`, and `ts_to_ranger`
  all import as a peer. No inverted dependency; slightly more churn now.
- **Recommendation: Option B.** It gives the engine first-class ownership
  *without* making pdf_writer depend on the game engine. Either way it's a
  relative-import rewrite across ~50 files, compile-verified, and should land
  *with or before* the identity fix (§II.A) since that edits `EvalValue`.
Decision **C2** below.

---

# Part II — Entity Registry & stable identity (engine-wide)

> The branch's core theme, and **not** an interpreter-only concern. A stable,
> process-wide entity ID is needed at **four layers**, and they must be *one*
> coherent scheme — not four ad-hoc array-index tricks (which is what exists
> today). 32-bit, generation-tagged, never a raw index (per owner decision).

## II.A Interpreter identity — `EvalValue.identityId`
Give every reference value (`valueType 4,5,6,7,9,10`) a monotonic
`identityId:int`, assigned once at construction. Make `equals()` compare
`identityId` instead of `return false`; route `===`, `Map`/`Set` keys, and
`Array.indexOf/includes` through it. This gives every `*.game.tsx` / `.as`
object a stable runtime identity — the thing the reconciler keys on, replacing
the `__rid`/`__removed` hacks. (Interpreter-semantics detail + the
`null→undefined` companion fix live in
[`docs/TSX_ENGINE_ISSUES.md`](./docs/TSX_ENGINE_ISSUES.md) #7/#8.)
⚠️ `EvalValue` is shared by the whole JSX/TSX interpreter, so this lands behind a
new `component_engine_js_semantics_test` + the existing pdf_writer suites.

## II.B Host registry — generation-checked handles
`ThreeSceneHost` and `model3d` replace their append-only index arrays with **one**
registry whose id is a generation-tagged handle. Today `entityRemove` only
detaches from the scene and never frees the slot (`three_scene_host.rgr:255`),
which is the leak; the registry fixes it:
Each slot stores **three** things: the object, its `generation`, and its
**Object Type ID** (Mesh / Group / DirectionalLight / Sky / AmbientLight /
Geometry / Material / Texture / …). Storing the type next to the id is what lets
the host dispatch a bridge call without downcasting (Part III.5).
```
; 32-bit id, never a raw array index; 0 = null
handle = (generation << 20) | (slot + 1)

create(typeId, obj)          -> handle     ; free slot (or grow), stamp gen + type
resolve(handle)              -> obj | null ; null if the generation is stale
resolveAs(handle, typeId)    -> obj | null ; null if stale OR the type doesn't match
typeOf(handle)               -> typeId     ; what kind of object this id names
retain(handle)                             ; refcount++ — another referrer shares the id
release(handle)                            ; refcount--; at zero, free slot + bump gen
```
`create` reuses freed slots (no unbounded growth); `resolve`/`resolveAs` reject a
stale *or* wrong-typed handle instead of aliasing; `retain`/`release` give shared
resources one id and a real lifetime (II.E). This one core is what the scene
entities and `model3d`'s `EntityRegistry` both fold onto.

## II.C WASM bridge IDs — the boundary needs the same ID
A WASM guest **cannot hold host pointers or JS object refs** — host↔guest
exchange only opaque **32-bit integer IDs** (the RGW1 body ids; the 3D ABI
`EntityId` from `rg_create_mesh_entity`/`rg_set_parent`, `IDEAL_3D.md` §12). So
the ID scheme is dictated as much by this boundary as by the interpreter: it
**must** be a 32-bit, generation-tagged integer, so a guest holding a freed id
gets a safe reject (generation mismatch) instead of aliasing a recycled entity
(`IDEAL_3D.md` §12.3.3 already asks for exactly this). The **host handle (II.B)
is the id that crosses the boundary** — not a separate numbering.

## II.D How the three layers compose (one identity, three representations)
The reconciler maps **interpreter identity (II.A) → host handle (II.B)**; the
host handle **is** the id exposed over WASM (II.C); `model3d`'s `EntityId` is the
same II.B scheme. So a mesh has *one* identity across the whole engine —
front-end object, host entity, and guest-visible id all agree, and a stale
reference is rejected at every layer instead of silently aliasing. This is the
generalization the `model3d`/host/interpreter registries each approximate today
with a volatile index.

## II.E Shared references must resolve to one id (the concrete payoff)
The rule "same source object → same id" is not abstract; it is the fix for a real
bug. In Three.js two meshes can **share** one geometry and one material:
```js
const geo = new THREE.BoxGeometry();
const mat = new THREE.MeshBasicMaterial();
const a = new THREE.Mesh(geo, mat);
const b = new THREE.Mesh(geo, mat);   // a and b reference the SAME geo + mat
```
Editing `mat` must change both meshes, and disposing it once must free it. Today
`buildMeshH()` always calls `buildGeometryH()`/`buildMaterialH()`
(`three_tsx_bridge.rgr:~560`), minting a **new** host resource per mesh — so `a`
and `b` get separate copies: a `mat` edit reaches only one, `dispose()` /
`needsUpdate` can't be modelled, and nothing frees the old copy on change, so the
host tables grow unbounded over a hot-reload/GUI session.

With II.A identity + II.B handles this disappears: the reconciler resolves `geo`'s
identity to **one** geometry handle that both meshes point at, and a **refcount**
on the handle frees it when the last mesh referencing it goes away. No extra
machinery — sharing and lifetime fall straight out of "one source object → one
id." (This is why III.4 below is now just a pointer here.)

---

# Part III — fix the Three object model (the real work)

## III.1 Interpreter object semantics (identity + missing member)
The evaluator lacks stable object identity and returns `null` for missing
members — tracked in [`docs/TSX_ENGINE_ISSUES.md`](./docs/TSX_ENGINE_ISSUES.md)
(#7 identity, #8 missing→`undefined`). The identity fix is **Part II.A** (it is
engine-wide, not Three-only); missing→`undefined` is its interpreter-local
companion. Both gate §III.2–III.4 and the native adapter (Part V). The
`EvalValue.valueType` value model the adapter plugs into (note `7` is already a
native `EVGElement` slot) is in
[`TSX_ENGINE_ISSUES.md` → Value model](./docs/TSX_ENGINE_ISSUES.md).

## III.2 Fix the contradictory docs (concrete edits)
Three design docs describe two incompatible architectures, which is why the code
drifts. The decision is already written in
[`docs/ADR-0001-three-scene-host-authority.md`](./docs/ADR-0001-three-scene-host-authority.md):
**one `ThreeSceneHost` holds the scene; every front-end drives it by integer id,
and no front-end keeps its own copy of the objects.** The action here is to make
the docs say that, in three specific edits:

1. **`IDEAL_THREE.md` §3 (lines ~63–78)** currently says *"Ranger / C++ / WASM
   use the object model **directly** — no façade"* and draws each front-end
   building its own objects. **Rewrite it:** front-ends send commands to the one
   `ThreeSceneHost` and refer to objects by integer id; they do not each build a
   private object graph. (Or mark the section "historical — superseded by
   ADR-0001".)
2. **`THREE.md` demo table (lines ~272–273)** still lists `ThreeTeapotTsxBridge`
   / `ThreeSponzaTsxBridge` as the Teapot/Sponza mechanism, even though line ~168
   of the *same file* says those bridges were deleted. **Fix the table** to name
   the real path (reconciler → `ThreeSceneHost`), so the doc stops contradicting
   itself.
3. **Add a one-line pointer to ADR-0001** at the top of `IDEAL_THREE.md`,
   `THREE_BRIDGE.md`, and `THREE.md` so there is a single source of truth.

Doc-only, no code — safe to do first; it unblocks everyone reading the design.
("Integer id" here = a small number naming a host object, **not** a pointer; the
guest never sees host memory. This is the same id as Part II.B/II.C.)

## III.3 Reconciler: key by identity, mark-and-sweep
Today `three_tsx_bridge.rgr` keys nodes by array index / DFS ordinal and assumes
a stable tree shape (`:77,86,89`), so a remove/reorder/reparent/mid-list-insert
or a hot-reload leaves stale host objects behind.

**Fix:** maintain identity→handle maps (`EvalValue id → entity`, `geometry id →
geometry`, `material id → material`, `texture id → texture`). Each reconcile:
1) mark reached identities, 2) create missing, 3) update changed, 4) **destroy
unmarked**, 5) set parent links explicitly. Never use an array index as identity.
(The identity is Part II.A; the handle it maps to is Part II.B.)

## III.4 Resource sharing → see Part II.E
The `buildMeshH()` duplicate-resource bug and its fix (shared geometry/material
resolve to one handle) are the concrete payoff of the identity scheme, covered in
**Part II.E**. In reconciler terms: step 2 of III.3 looks a resource up by its
source identity before creating one.

## III.5 The bridge-call model (dispatch by stored Type ID)
This is how a front-end drives the host, and where the **Object Type ID** (II.B)
earns its place. A front-end never touches a host object; it issues a **command**
that names objects by their 32-bit id:
```
invoke(command, args…) -> result        ; args and result are ids or scalars, never pointers
; e.g.  meshH  = invoke("meshNew", sceneH, geoH, matH)   ; returns a Mesh id
;       invoke("entityTransform", meshH, x,y,z, …)       ; drives it by id
```

**The problem today.** `ThreeSceneHost.entities` stores every node as a bare
`ThreeObject3D`, and Ranger has no downcast, so when a technique needs the *typed*
object (Sponza's sun, sky, model root) the bridge grew special accessors —
`sunLight()`, `skyNode()`, `modelNode()`. Every new technique (probe, fog, post)
adds another accessor, and the bridge slides into a service locator.

**The fix — dispatch on the stored Type ID.** Because each id already carries its
Type ID (II.B), the host resolves *and type-checks* in one step and routes the
command to the right typed operation — no downcast, no per-technique accessor:
```
; host side of a command, uniform for every type:
fn applyCommand(cmd, targetH, args) {
    match typeOf(targetH) {                 ; the stored Object Type ID
        DirectionalLight -> asLight(resolveAs(targetH, DirectionalLight)).apply(cmd,args)
        Sky              -> asSky(resolveAs(targetH, Sky)).apply(cmd,args)
        Mesh             -> asMesh(resolveAs(targetH, Mesh)).apply(cmd,args)
        …
    }
}
```
`resolveAs(h, Sky)` returns null for a stale *or* wrong-typed id, so a bad command
is a safe no-op, not a crash or a silent wrong-object edit. Technique code asks
"is this id a DirectionalLight?" via `typeOf`, and depends on the host's typed
capability — **not** on `ThreeTsxBridge`. Adding a technique = registering a new
Type ID + its `apply`, never a new bridge accessor.

## III.6 The bridge surface has drifted → generate it from the Class Registry
The bridge is hand-maintained in several places and already drifted: the host
exposes 10 geometry constructors but `ThreeNativeBridge.invoke` exposes 2 (Box,
Teapot); the declarative reconciler calls the host directly, so demos work and
hide the gap. **Fix:** stop hand-writing the surface and generate every face from
the one **Class Registry** contract — see **Part IV**.

## III.7 Harden the parity rig (`THREE_VALUE_PARITY_TESTS.md`)
Good foundation (real Three.js goldens, natural Three code as input, render vs
value parity split, honest 0/31 reporting), but:
- `matchField()` uses `ev.toNumber()`; `null.toNumber()==0`, `null.toBool()==
  false`, so a **missing** impl passes when the golden is `0`/`false`. Type-check
  first; give a field one of `MISSING / THREW / WRONG_TYPE / VALUE_MISMATCH / OK`.
- Give the interpreter semantics gaps their **own** suite (a
  `component_engine_js_semantics_test`) covering the items in
  [`TSX_ENGINE_ISSUES.md`](./docs/TSX_ENGINE_ISSUES.md) (#7 identity, #8
  missing-member, etc.), so JS-runtime gaps don't hide inside the Three-API "GAP"
  bucket. (Detail lives in that doc — not repeated here.)
- Add **cross-layer** parity (façade state == host canonical object) and
  regression tests for the behaviors already specified in **II.E** (resource
  aliasing, refcounted lifetime) and **III.3** (real removal; stable identity
  under insert/reorder/reparent) — a bounded resource count on reload is the
  headline assertion. Scenarios live there, not re-listed here.
- Report **several numbers, not one percentage.** A single "X% of Three.js
  works" hides *why* a case failed and drifts every time a probe is added.
  Instead count each stage separately: how many cases **ran without throwing**,
  how many returned the **right type**, how many the **right value**, and how many
  have the **façade state matching the host object**. Group the tests into named,
  versioned sets (e.g. `three-core-math-v1`, `object3d-v1`) so each area's
  progress is tracked on its own instead of in one moving aggregate.

---

# Part IV — Class Registry: the bridge contract  ⚠️ SPECIAL REVIEW
> A **contract**, not a codegen convenience. The bridge between any front-end
> (interpreter / WASM guest / native) and `ThreeSceneHost` is defined by a
> registry of **classes → their methods and props**. A guest compiled against it
> can outlive a host change, so it must be **backward compatible** and every edit
> goes through change review. It belongs with the ABI (alongside `wasm/*.h`,
> `ABI_V1.md`, `ABI_V2_PROPOSAL.md`).

**What it holds** — for each exposed class, one stable record:
```
class {
  classId : u32          ; stable, never reused — this IS the Object Type ID (Part II)
  name    : "Vector3"    ; the Three name a front-end constructs
  props   : [ { propId,   name, type, access: get|set|getset } ]
  methods : [ { methodId, name, argTypes[], returnType } ]
}
; ABI types: id (a handle to another class), f64, i32, bool, string, enum
```

**Backward-compatibility rules (the contract):**
- *Append-only ids* — `classId`/`propId`/`methodId` are assigned once, never
  reused or renumbered; a new capability is a new id.
- *No silent removal* — a retired member is marked `deprecated` and kept so old
  guests still resolve it; removed only on a major ABI version.
- *Version + handshake* — the registry carries an ABI version; host and guest
  negotiate it (the capability gate, `IDEAL.md` §6); a guest needing a missing
  class/method is rejected at load, not fed zeros.
- *Additive args* — new method args append with defaults; existing calls stay valid.

**One source of truth.** Authored once, it generates the `ThreeSceneHost`
methods, `ThreeNativeBridge.has/invoke`, the WASM import table, the TS/Rust guest
wrappers, the native-adapter registrations (Part V), the doc command table, and a
**surface-parity test** that fails if any generated face is missing a member —
closing today's drift (host 10 geometry constructors vs native-bridge 2). The
`classId` is the Object Type ID the host dispatches on (Part III, bridge-call
model).

**Status — SPECIAL REVIEW.** It governs every front-end and any compiled guest,
so freeze its shape before building codegen on it. Open: id widths, the type set,
where the registry lives (a `.rgr` table vs a data file), and how it maps onto
the existing `wasm/*.h` ABI headers.

# Part V — The Bridge: native classes & native modules
The bridge is how interpreted game code reaches host/native functionality
**without pointers** — it is the runtime side of the Class Registry contract
(Part IV). It has **two surfaces**: native *classes* a script constructs
(`new THREE.Vector3()`), and native *modules* a script imports
(`import * as Ranger from "ranger-game"`). Both are versioned by, and
backward-compatible under, the Part IV contract.

## V.1 Why a bridge, not façade classes
`three.tsx` hand-copies ~90 Vector3/Object3D methods (plus the `__removed` hack,
`three.tsx:60,67,71`) while wanting the math to live only in Ranger core — a
fight that worsens as the API grows. D2 resolves it with the adapter below; the
bounded-façade alternative is retired.

## V.2 Native-class adapter (`NativeClassAdapter`)
The interpreter **already** wraps one native Ranger class: `valueType 7`
(`EvalValue.element(el:EVGElement)`). Generalize that hook — a `nativeObject` +
`nativeClassId` slot, with **one adapter per class in the Class Registry (Part
IV)** registered with the ComponentEngine (`EVGElement` becomes client #0):
```
interface NativeClassAdapter {
  fn className() : string                       ; "Vector3" | "Object3D" | …  (== a Part IV class)
  fn construct(args:[EvalValue]) : NativeRef     ; new THREE.Vector3(x,y,z)
  fn getProperty(self:NativeRef key:string) : EvalValue
  fn setProperty(self:NativeRef key:string v:EvalValue) : void
  fn invokeMethod(self:NativeRef m:string args:[EvalValue]) : EvalValue
}
```
Canonical types: `Vector3`↔`Vec3`, `Matrix4`↔`Mat4`, `Quaternion`↔`Quat`,
`Object3D`↔host `ThreeObject3D` — chosen so interpreter, host, and parity read
the **same** math. A host-backed `NativeRef` gets an `identityId` (Part II), so
shared instances are one value everywhere (what makes II.E aliasing + III.3
reconciliation work); its *lifetime* is Part VI.

## V.3 Residency — guest-side, host-side, or hybrid
Not every bridged class is host-backed, and this split is a first-class part of
the contract because crossing the boundary (especially WASM) per call is
expensive. Each class is one of:
- **Guest-side** — a plain interpreter value; every method runs in the
  interpreter, no host round-trip. Right for hot value math (`Vector3.add`
  shouldn't cross the boundary).
- **Host-backed** — the canonical object lives in the host registry (Part II) and
  every method proxies to native. Required when the host owns the truth
  (`Object3D` in the scene graph, GPU resources).
- **Hybrid** — host-backed, but its *hot* methods run guest-side on a mirrored
  value while its *state-changing* methods proxy to the host. e.g. `Vector3`
  arithmetic stays local; assigning it into `mesh.position` syncs to the host.

So the **Class Registry (Part IV) marks each method/prop with an execution site**
(`guest` | `host`), and the adapter proxies only the `host` ones. Keeping value
types guest-side is also what keeps the GC problem (Part VI) small.

## V.4 Object invocation (the dispatch path)
How the interpreter drives a native-class value at runtime — four hooks, no
façade class in `three.tsx`:
```
new THREE.X(args…)   -> adapter.construct(args)  -> EvalValue holding a NativeRef
obj.prop             -> adapter.getProperty(ref, "prop")
obj.prop = v         -> adapter.setProperty(ref, "prop", v)
obj.method(args…)    -> adapter.invokeMethod(ref, "method", args)
```
The interpreter picks the adapter by the value's `nativeClassId` (== the Part IV
`classId` / Object Type ID), so dispatch is a table lookup, and an unknown
member is a defined error, not a crash.

## V.5 Native modules — `import * as Ranger from "ranger-game"`
Beyond classes, the bridge exposes host functionality as **importable native
modules**. `ranger-game` is the core module namespace — the TSX-visible face of
the guest library `lib/ranger_game/` (`input`, `scene`, `sprite`, `ui`, `world`,
`resources`, `pose`) and the surface already declared in
`scripting/engine.d.ts` (`Buttons`, connected-controller count, audio/voice,
persistence). This is the important seam for handing game scripts the engine's
live state and capabilities uniformly across interpreter / WASM / native:
```ts
import * as Ranger from "ranger-game";
const pad = Ranger.controllers[0];               // live GameController state (host-owned)
if (pad.pressed(Ranger.Buttons.ACTION)) fire();
Ranger.audio.play("hit");
```
These are native functions/state, **not** JS objects — same no-pointer discipline
as V.2, and the module's exported names/signatures are part of the **Part IV
contract** (versioned, append-only), so a game compiled against `ranger-game`
keeps working when the host adds capabilities. Candidate first exports:
`controllers`/`input`, `time`, `audio`, and read-only engine/config state.

## V.6 First cut & risk
First classes: `Vector3, Euler, Quaternion, Matrix4, Object3D, Color` (their
residency per V.3 — value math guest-side, `Object3D` host-backed);
geometry/material/texture stay host-backed resources via the command surface;
loaders wait for the hard gate. First module surface: `ranger-game`
input/controllers. **Risk:** a ComponentEngine change (`new`, member access,
method dispatch, and now module import gain a native path), so it lands behind
the semantics suite (III.7) and must keep the `EVGElement` UI path green as
client #0.

---

# Part VI — Cross-boundary lifetime & garbage collection
A host-backed or hybrid value (V.3) holds a host registry handle (II.B), retained
on create. The hard question: **when the guest-side value dies, who releases the
host object?** Get it wrong and you leak host objects (the II.B leak, now across
the boundary) or free one still in use.

**The constraint that shapes the answer.** Ranger compiles to ES6 (JS GC — no
deterministic finalizer beyond `WeakRef`/`FinalizationRegistry`), C++ (RAII /
refcount), and WASM (manual). So the design **cannot** rely on a host-language
finalizer firing uniformly; lifetime must be *explicit and deterministic*.

Approach:
1. **Guest-side values need no host GC.** They are plain interpreter values,
   reclaimed by the interpreter's own memory management — another reason to keep
   value math guest-side (V.3).
2. **Host-backed objects are owned by the scene and freed by the reconciler.** The
   scene graph is the ownership root; each reconcile pass (III.3) marks every
   handle reachable from the live tree and **releases the unmarked** —
   registry-level mark-and-sweep. GC and reconciliation are the *same* pass.
3. **Refcount for sharing.** `retain`/`release` (II.B) handle shared resources
   (one geometry, two meshes): the resource frees when the *last* referrer is
   swept, not when the first mesh goes.
4. **Explicit `dispose()` is honored, not required.** A script may `dispose()` to
   free eagerly (matching Three.js) — it just calls `release`; correctness never
   depends on it being called.
5. **No reliance on interpreter finalizers.** A host-backed value that escapes the
   scene (held only in a script variable) is pinned by an explicit retain while
   the interpreter value is alive and released at a defined boundary;
   `WeakRef`/`FinalizationRegistry` is at most a JS-backend optimization, never the
   contract. The escape case is **decision C3** — favor guest-side residency to
   avoid it.

# Part VII — One guest support layer, generated (don't hand-replicate)
Today each guest path hand-writes its **own** copy of the same support classes:
`three.tsx` carries a full `Vector3`/`Object3D` façade (~90 methods), the Rust
WASM helpers duplicate the math in `lib/ranger_game/src/scene.rs` (`Vec3`, `Quat`,
`Color`, `Scene`), and an AssemblyScript guest would add a third copy. Same
classes, N implementations → the same drift as the command ABI, at the class
level (a method fixed in one copy stays wrong in the others).

**Rule: a support class is defined once and every guest face is generated from
it — never hand-copied per language.** Concretely:
- The **Class Registry (Part IV)** is that single definition (names, methods,
  props, types).
- On the interpreter path, the native adapter (Part V) removes the `three.tsx`
  façade entirely — the classes *are* the host's canonical types, so there is no
  second copy to drift.
- For compiled guests (Rust/AS) that genuinely need local structs, **generate**
  them from the registry (the same codegen that emits the wrappers in Part IV),
  so `lib/ranger_game/` scene types and the AS equivalents can't diverge from the
  host.
- A **parity test** asserts each generated guest support matches the registry —
  the class-level analog of Part IV's surface-parity test.

This is the class-level half of IDEAL.md's "parity across guest paths": a game
written once behaves identically compiled or interpreted because there is exactly
one definition of each class, not one per backend.

---

# Affected components (for work estimation)
The components each Part touches, grouped so the effort is visible. Sizes are
current line counts; **S/M/L** is rough change size, not calendar time.

**A. Interpreter core** — `gallery/pdf_writer/src/jsx/` (shared by pdf_writer +
the whole engine; deepest risk, needs the new semantics suite)
- `EvalValue.rgr` (553) — `identityId`; `equals()` by identity; `getMember`
  missing→`undefined`; a generic native slot (`nativeObject`/`nativeClassId`). **M**
- `ComponentEngine.rgr` (7288) — route `new` / member get-set / method call to the
  adapter; native-module import resolution; identity-keyed Map/Set. **L**

**B. Bridge & adapters** — new code
- `NativeClassAdapter` + per-class adapters: `Vector3, Euler, Quaternion,
  Matrix4, Object3D, Color`. **M**
- `ranger-game` native module (input/controllers, audio, time). **M**
- *Reuses* existing canonical math — `three/src/three_vector3.rgr` (232),
  `three_matrix4.rgr` (480), `three_quaternion.rgr` (166) — as backing, not rewritten. **S**

**C. Class Registry + codegen** — new (Part IV)
- The registry data (classes/methods/props + Type IDs). **M**
- Generators: `ThreeSceneHost` iface, `three_native_bridge` has/invoke, WASM
  imports, TS/Rust wrappers, doc table, surface-parity test. **L**

**D. Three façade & reconciler** — `three/tsx/`
- `three.tsx` (585) — delete the hand-copied `Vector3`/`Object3D` classes +
  `__removed` hack (Line B removes most of the file). **M**
- `three_tsx_bridge.rgr` (1109) — reconciler: index/DFS cache → identity-keyed
  mark-and-sweep; resource reuse by identity. **L**
- `three_native_bridge.rgr` (206) — regenerated from the registry. **S**

**E. Host registry** — `three/src/`, `model3d/`
- `three_scene_host.rgr` (394) — generation handles + `typeId` + `resolveAs` +
  refcount; make `entityRemove` free. **M**
- `model3d/EntityModel.rgr` — fold its parallel `EntityRegistry` onto the core. **M**

**F. Guest support (generated, not hand-copied — Part VII)**
- `lib/ranger_game/src/scene.rs` (986) — generate math/scene types from the
  registry instead of maintaining them by hand. **M** (+ AS guest if/when added)

**G. Tests**
- `component_engine_js_semantics_test` (new). **M**
- Harden value-parity (`matchField` typing + status enum); surface-parity;
  reconciler resource-count/lifecycle regression; guest-support parity. **M**

**H. Docs**
- ADR-0001 edits to `IDEAL_THREE.md` / `THREE.md` / `THREE_BRIDGE.md`. **S**
- `TSX_ENGINE_ISSUES.md` (done).

> **Hard gate (dependency, not a schedule):** the interpreter identity (A),
> native adapter (B), identity-keyed reconciler (D), and resource aliasing +
> registry (E) block adding any new material/loader/geometry — everything else
> builds on them.

# Decisions — RESOLVED
- **D1 = keep `ranger_games/`.** Part I complete at tranche 1; no further
  deletions.
- **D2 = Line B** (native-object adapter, Part V).
- **D3 = keep planning.** No code yet; this doc + `docs/ADR-0001-three-scene-
  host-authority.md` are the artifacts to review.

**Open for your review:** this is a design/analysis document, not yet a project
plan — no ordering or scheduling is implied. Sequencing comes later, once the
design is agreed.

---
*Part I tranche 1 committed. The rest is design-only, under review.*
