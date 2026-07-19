# CODE_CLEANUP — binding architecture decisions

Implementation contract for the game-engine cleanup.

| Section | Contents |
|---------|----------|
| **Components and actors** | What each name used in the code comments refers to |
| **Binding decisions** | D-IDENTITY … D-MODULES + **D-2D** (15, incl. D-OWN, D-ASYNC, first-class `ranger:2d`) |
| **Worked examples** | Camera + physics pose; geometry upload; TS `ranger:core` game; Rust/WASM `ranger_wasm` game + ABI; **TS/Rust `ranger:2d` sprite game** |
| **Implementation gates** | Required order and tests before calling a migration done |

**Implementation plan (v2 tree):** [`CODE_CLEANUP_PLAN.md`](./CODE_CLEANUP_PLAN.md)
— phased ground-up build under [`v2/`](./v2/); interpreter + WASM bridge before rendering.

Archived inventory and exploratory drafts:
[`CODE_CLEANUP_OLD.md`](./CODE_CLEANUP_OLD.md).

Related: [`docs/ADR-0001-three-scene-host-authority.md`](./docs/ADR-0001-three-scene-host-authority.md),
[`docs/WASM_MEMORY_ABI.md`](./docs/WASM_MEMORY_ABI.md).

---

# Components and actors

The engine runs game scripts against a host-owned scene. The documents in this
folder keep referring to the same small set of components; the code comments in
the worked examples name them with the labels in bold.

| Label | Component | Role |
|-------|-----------|------|
| **guest** | The game program | TSX/JS source executed by the interpreter, or Rust / AssemblyScript compiled to WASM. Owns game logic and policy (what should happen). Holds handles to host objects; never holds authoritative scene data. |
| **interp** | The TSX/JS interpreter | `ComponentEngine.rgr` + `EvalValue.rgr` (today under `gallery/pdf_writer/src/jsx/`). Evaluates guest script; every script value is an `EvalValue`. |
| **adapter** | The native-object adapter | The interpreter's only route to host objects: `construct` / `getProperty` / `setProperty` / `invokeMethod` (D-ADAPTER). Translates script operations into registry commands and enforces residency and sync boundaries. |
| **host** | The scene host | `ThreeSceneHost` plus the typed arenas (D-TYPE). Owns the authoritative scene state: cameras, scenes, meshes, geometries, materials. Everything is addressed by integer handles (`cameraH`, `meshH`, `geoH`, …), generation- and realm-tagged (D-HANDLE). |
| **physics** | The physics subsystem | The `PhysicsWorld` implementation (Cannon port or arcade engine). A separate host subsystem with its own arenas and handles (`worldH`, `bodyH`). A physics body and a drawable mesh are different objects with different handles. |
| **render** | The renderer backend | GL/SDL or the software rasterizer. Reads host scene state each frame and draws it. Rendering never creates objects and is never a sync boundary for script state (D-SYNC). |
| **wrapper** | The TSX wrapper classes | `three/tsx/three.tsx` — guest-side classes that imitate the Three.js API so existing Three.js-style code runs unchanged. Target model: thin declarations over the adapter. Today they still build a private scene tree consumed by the temporary reconciler (D-SYNC). |
| **WASM boundary** | The compiled-guest ABI | For compiled guests there is no interpreter or adapter; the guest calls generated imports and only `i32` values and byte ranges cross (D-WASM, D-WASM-MEM). Command names, handles, and timing rules are the same as on the interpreted path. |
| **runtime** | `ranger:core` capability root | Realm-scoped host services: surface, input, audio, assets, time, log, platform (D-MODULES). Not a browser global and not a cross-guest singleton. |
| **modules** | Virtual import packages | `ranger:core`, `ranger:2d`, `ranger:three`, `ranger:cannon` — injected by the Ranger runtime for the current `realmId` (D-MODULES, D-2D). Compiled guests use the same split as `ranger_wasm::{core,two_d,three,cannon}`. |
| **abi** | Generated WASM import surface | Direct host commands for compiled guests (`rg_*` / registry exports). Same commands as the adapter path; only `i32` / byte spans cross (D-WASM, D-HANDLE). The `ranger_wasm` helper crate wraps validation, ownership, strings, spans, and error codes. |

Comment convention in the code examples: comments are prefixed with the actor
that performs the step — `// guest:`, `// interp:`, `// adapter:`, `// host:`,
`// physics:`, `// render:`, `// runtime:`, `// abi:`. Use **`// abi:`** when the
guest (or helper) crosses the WASM import boundary. A line of guest code can
involve several actors; each gets its own comment line. (Earlier drafts used a
single `// bg:` prefix for the combined host-side effect; the per-actor comments
replace it.)

---

# Architecture decisions (binding — from design review)

Binding choices for implementation. Treat them as decisions, not options.

## D-IDENTITY — Stable interpreter reference identity

Every interpreter reference value — object, array, function, and NativeRef —
receives an immutable `identityId` scoped to its interpreter realm.

Rules:

- Reference `===` compares `identityId`.
- `Map` and `Set` object keys use reference identity.
- `Array.indexOf` / `includes` preserve JavaScript reference semantics.
- One NativeRef identity maps to at most one live host handle in its realm.
- Reordering, reparenting, and array-index changes never change identity.
- Reading a missing property returns `undefined`, not `null`.

The live native adapter (D-ADAPTER) and “one script object → one host handle”
(D-SYNC) are blocked until these rules pass the
`component_engine_js_semantics_test` suite.

Companion detail / known gaps: [`docs/TSX_ENGINE_ISSUES.md`](./docs/TSX_ENGINE_ISSUES.md).

## D-SYNC — Live host-backed objects; reconciler is temporary

**Conflict that was in an earlier draft:** an identity-based reconciler
(snapshot: TSX graph → reconcile → host) versus live host-backed natives (each
`new` / property write / method hits the host immediately). Both cannot be the
final model:

```js
const mesh = new THREE.Mesh(g, m); // create meshH now?
scene.add(mesh);                   // attach now?
render();                          // reconcile create/attach again?
```

**Decision: live-object model is the target.**

| Operation | Host effect (immediate) |
|-----------|-------------------------|
| `new THREE.Mesh(g, m)` | `meshCreate(geoH, matH) → meshH` once; EvalValue holds that handle |
| `scene.add(mesh)` | `entitySetParent(meshH, sceneH)` now |
| `mesh.position.set(...)` / assign | host write now, or an explicitly documented batch flush (D-ADAPTER) — never a second create |
| `scene.remove(mesh)` | detach membership only — does **not** release the object handle (D-LIFE) |

Target stack:

```
EvalValue NativeRef   (identityId — D-IDENTITY)
        │
        ▼
stable host handle  (+ realmId)   (D-HANDLE)
        │
        ▼
typed registry slot / typed arena  (D-TYPE)
        │
        ▼
canonical Ranger object
```

**Reconciler status:** `three_tsx_bridge.rgr` remains a **temporary compatibility
adapter** for demos that still build a wrapper scene tree and call `reconcile()`.
It must not be described as the final architecture.

**Deletion milestone (`RETIRE-RECONCILE`):** when the live adapter covers Mesh /
Group / Scene / Light / Camera construct + parent + transform + shared geo/mat,
and teapot + sponza + cube demos no longer call `ThreeTsxBridge.reconcile` (or
equivalent), delete the index/DFS reconcile path and the Sponza typed accessors
(`sunLight` / `skyNode` / `modelNode`).

## D-ADAPTER — Native adapter and value residency

The interpreter reaches host objects through one native-object interface:

```
construct(classId, args) -> NativeRef
getProperty(ref, propId) -> value
setProperty(ref, propId, value)
invokeMethod(ref, methodId, args) -> value
```

Every registered property and method declares its **residency** (in D-REGISTRY):

| Residency | Meaning | Example |
|-----------|---------|---------|
| `guest` | Value exists only in the interpreter; no host round-trip | `Vector3.add()` |
| `host` | Host object is authoritative on every access | geometry, texture, most `Object3D` ops |
| `hybrid` | Guest mirror with an **explicit** read/commit boundary | local `mesh.position` Vector3 |

A hybrid value must declare exactly when synchronization occurs. Example:

```js
mesh.position.x += 1
```

Must answer, in the registry metadata for `position`:

1. Does the read pull from the host first, or from a cached guest `Vector3`?
2. Does each component write cross the boundary, or only a later commit?
3. What is the commit boundary — assign to `mesh.position`, end of script turn,
   or an explicit flush? **Not** an implicit `render()` / structural reconcile.

Rendering must not act as an implicit structural reconciliation boundary
(D-SYNC). Sync boundaries are declared, not inferred.

### Hybrid binding invariants (binding)

Residency metadata alone is not enough; every hybrid property also obeys:

1. **One cached wrapper per (NativeRef identity, propId).** Repeated reads
   preserve wrapper identity: `mesh.position === mesh.position` is `true`.
   The adapter caches the bound mirror; it never mints a fresh wrapper per
   read.
2. **Two revisions.** Guest writes bump the mirror's dirty revision; host
   writes (physics, animation, loaders) bump the slot's host revision. Sync
   compares the two and propagates the newer value.
3. **Turn-start refresh.** A mirror re-pulls from the host at its first
   access in each guest turn. A retained reference (`const p = mesh.position`)
   is a snapshot within its turn: it does not observe host writes mid-turn,
   and it refreshes at its next read in a later turn — it is never
   permanently stale.
4. **Guest commit wins, ordered by the frame pipeline.** A guest commit at
   the declared boundary overwrites the host value (full vector from the
   turn-start snapshot plus the guest's component writes). Host systems that
   must not be overwritten write between guest turns (D-MODULES frame
   pipeline). Same-frame double writes resolve guest-wins — that is the
   documented conflict policy, not an accident of scheduling.
5. **Stable reads within a turn**, unless the property is declared
   `immediate` in the registry (then every read is a host read).

## D-PROP — Native properties and dynamic overlay

Host-backed objects expose **two** property stores:

1. **Native properties** declared in the class registry (`position`, `geometry`,
   `material`, `visible`, …).
2. **Guest-side dynamic overlay** for expandos and `userData`.

Semantics:

```js
mesh.nonexistent
// adapter: name is neither a registered native prop nor an overlay entry
// interp:  the read evaluates to undefined; no host call is made

mesh.nonexistent()
// interp: calling a non-callable/undefined member → TypeError-like error;
//         the error is raised guest-side, the host is never reached

mesh.customValue = 123
// adapter: unknown name on write → stored in the guest-side dynamic overlay
// host:    never sees this value; it lives and dies with the interpreter object

mesh.userData.flags = 1
// adapter: userData is overlay storage by definition — always guest-side

mesh.position.z = 5
// adapter: "position" is a registered native prop → its declared residency and
//          sync rules apply (D-ADAPTER); this is not an expando
// host:    receives the write at the declared sync boundary
```

- Unknown property **read** → `undefined` (aligned with D-IDENTITY missing-member).
- Calling an unknown or non-callable property → TypeError-like error.
- Unknown property **write** → dynamic overlay unless the class is explicitly
  sealed in the registry.
- Native property writes follow their declared residency and synchronization
  rules — they are not expandos.

Without this split, implementations tend to reject all unknown properties or
forward every expando to the host.

## D-LIFE — Three separate lifetimes (object ≠ membership ≠ GPU)

`dispose()` must **not** mean `release(handle)`. Three.js `geometry.dispose()` /
`material.dispose()` releases renderer/backend resources; the JS object stays
valid and may be used again (resources recreate). Removing a mesh from a scene
does not dispose shared geometry/material.

| Lifetime | Meaning | Commands (examples) |
|----------|---------|---------------------|
| **1. Wrapper / object** | EvalValue or WASM handle still names the host object | `retain` / `release` (refcount); handle invalid only when released and generation bumps |
| **2. Scene membership** | Attached to a parent / scene or not | `entitySetParent` / `entityDetach`; remove from scene ≠ release |
| **3. Backend resource** | GPU buffers, textures, programs | `geometryDisposeBackend(geoH)` / `materialDisposeBackend(matH)` — invalidate GPU caches, bump **resource revision**, keep `geoH` and CPU arrays alive |

```
geometryDisposeBackend(geoH)
    -> invalidate GPU/backend caches for geoH
    -> increment resourceRevision
    -> geoH and CPU geometry remain valid

geometryRelease(geoH)
    -> drop ownership (refcount)
    -> at zero: free slot, bump generation (handle may go stale)
```

Two revision counters exist and must not be merged:

- `contentRevision` — incremented by data writes (`geometryUpdateRange`,
  `geometrySetAttribute`). Tells the renderer its cached GPU copy of the
  vertex data is out of date.
- `resourceRevision` — incremented by `geometryDisposeBackend` /
  `materialDisposeBackend`. Tells the renderer its backend objects (buffers,
  programs) were invalidated even though the data did not change.

The renderer keys its caches on both. `geometryRelease` touches neither — it
ends the object lifetime (lifetime 1), which is a different event.

Legal after dispose-backend:

```js
geometry.dispose();
// adapter: invokeMethod(geometry, "dispose")
// host:    geometryDisposeBackend(geoH) — drops backend caches, bumps
//          resourceRevision; geoH and the CPU vertex arrays stay valid

mesh.geometry = geometry;
// adapter: setProperty resolves the same script object to the same geoH
// host:    meshSetGeometry(meshH, geoH) — no create, no new handle

renderer.render(scene, camera);
// render:  cache lookup for geoH misses (resourceRevision changed) →
//          recreates the GPU buffer from the still-valid CPU arrays
```

The wrapper already has empty `dispose()` stubs — wiring them to handle
destruction would be a **semantic regression**, not filling a stub.

**Most important split:** object identity ≠ scene membership ≠ GPU resource
lifetime. Separate commands and separate tests for each.

## D-OWN — Deterministic ownership: who retains, who releases

D-LIFE separates the three lifetimes; this decision fixes **who owns what**
after every kind of operation, so the TS convention (explicit `release()` +
realm sweep) and the Rust convention (`Clone` → retain, `Drop` → release) are
two guest surfaces over one host contract.

| Operation | Ownership result |
|-----------|------------------|
| `new` / `create*` / `load*` | **Owned** reference to the caller; refcount starts at 1 |
| Property getter returning a handle (`mesh.geometry`) | **Borrowed** — returns the cached wrapper for that handle; no refcount change |
| Handle passed as a method argument | **Borrowed for the duration of the call**; the callee retains only if its registry entry says so |
| `meshCreate(geoH, matH)` | The mesh **retains** geometry and material (internal strong refs) |
| `meshSetGeometry(meshH, geoH2)` | Retain new, release old — atomically on the host |
| `entitySetParent` / `entityDetach` / `scene.add` / `scene.remove` | Membership only — never touches ownership |
| Attachments (`audioSourceAttachEntity`, listener→camera, emitter→entity, constraint→body, player→device) | **Weak** generation-checked reference by default; target destruction auto-detaches; an attachment never keeps its target alive. `attachment: weak\|strong` is registry metadata; `strong` must be justified per relation |
| `release(h)` | Ends the caller's ownership **exactly once**; a second release through the same wrapper is a typed error, not a second decrement |
| Realm teardown | Releases every ownership the realm still holds — handles, requests, results, voices (final backstop) |

Guest-path policies:

- **Interpreted path.** `release()` is *optional for correctness*: realm
  teardown reclaims everything, so a script that never releases leaks only for
  the lifetime of its realm. Long-running realms should release what they
  drop. The interpreter MAY release unreachable NativeRefs (GC / `WeakRef`
  hook) as an optimization — the contract must hold without it (D-LIFE rule 5).
- **Wrapper identity.** At most one live wrapper exists per (realm, handle)
  (D-IDENTITY); getters return that cached wrapper. Two script variables
  naming the same object are the same wrapper, so "two wrappers releasing the
  same handle independently" cannot arise on the interpreted path.
- **Compiled path.** Each `OwnedHandle` clone retains; each `Drop` releases
  once. N clones = N owned references = N releases. Deterministic — no sweep
  needed except after traps (realm teardown).
- **Use after release** resolves through the stale-handle path (D-HANDLE) to a
  typed error — never undefined behavior.

## D-TYPE — Typed arenas, not typeId + pretend downcast

A stored `typeId` can *validate* a handle; it cannot produce a statically typed
`ThreeDirectionalLight` from a `ThreeObject3D` slot in Ranger (no downcasts).
Today the host keeps heterogeneous entities as base `ThreeObject3D`
(`three_scene_host.rgr`) — that is why Sponza grew `sunLight()` accessors.

**Decision: per-type arenas (preferred).**

```
Entity registry:  handle → { typeId, generation, realmId, payloadIndex, refcount, … }
Mesh arena:              payloadIndex → ThreeMesh
DirectionalLight arena:  payloadIndex → ThreeDirectionalLight
Geometry arena:          payloadIndex → ThreeBufferGeometry
Material arena:          payloadIndex → …
```

Dispatch:

```
slot = resolve(handle)           ; generation + realm check
require slot.typeId == DIRECTIONAL_LIGHT
light = directionalLights[slot.payloadIndex]
light.apply(cmd, args)
```

Optional transitional layout (one slot with parallel pool indices) is acceptable
only if every typed access goes through the matching pool index — never
`asLight(baseObject3D)`.

Without arenas, a generic registry only **moves** the Sponza accessor problem.

## D-HANDLE — Handle width, wrap, signedness, realm

Earlier draft layout `handle = (generation << 20) | (slot + 1)` gives **12-bit
generation** (wraps after 4096 reuses of the same slot) and can set the high bit
so a signed `i32` looks negative — breaking any `handle <= 0` means-invalid
convention.

**Decision:**

1. **Do not claim absolute stale-handle safety** for a packed 32-bit handle.
   Document a practical limit, then pick one mitigation before codegen:
   - **Preferred for WASM:** 64-bit logical id as **two i32** words
     (`handle_lo`, `handle_hi`) or a fat `struct { i32 slot; i32 generation; }`,
     or
   - fewer slot bits / wider generation sized to measured max live objects, or
   - **retire a slot permanently** when its generation would wrap, or
   - bump a **registry epoch** on full teardown / hot-reload (all old handles
     fail even if gen bits collide).
2. **Signedness:** treat handles as opaque bit patterns. Invalid sentinel is
   **0 only** (or a dedicated `HANDLE_INVALID`). Never use `handle < 0`.
   Generated WASM/TS bindings use `i32` only as a bit carrier.
3. **Realm / owner id** on every slot: distinguishes scenes, interpreter
   instances, and WASM guests. `resolve` fails if `slot.realmId != caller.realmId`
   even when generation and type match — prevents cross-guest handle reuse.

## D-REGISTRY — One schema generates every public surface

The class registry is the authoritative definition of classes, properties,
methods, and ABI lowering. `D-WASM` requires binary lowering metadata; `D-GEO`
uses `span<f32>` — both are meaningless without this schema.

**Minimum type system:**

- `handle<T>`
- `option<T>`
- `span<T>` — ptr+len lowering on WASM (borrowed guest memory)
- `owned_buffer<T>` / `borrowed_buffer<T>`
- `result<T, ErrorCode>`
- `string_view`
- structs, enums, and scalar types (`i32`, `u32`, `f32`, `f64`, `bool`)

**Each property / method declares:**

- ownership and retain/release behavior
- mutability
- residency (`guest` | `host` | `hybrid` — D-ADAPTER)
- sync or async behavior (async methods lower per D-ASYNC)
- WASM argument/result lowering (D-WASM, D-WASM-MEM)
- API version
- stable binary export identity (`wasmExportName` / versioned name)

**Generated outputs (one source):**

- host and typed-arena dispatch
- interpreter native-class registrations
- WASM imports
- TypeScript / Rust guest wrappers
- bridge command tables
- documentation tables
- surface-parity tests

If the schema cannot state these, codegen grows command-specific exceptions —
the failure mode this design is trying to remove.

**ID immutability (binding):**

- Published `classId` / `propId` / `methodId` / command ids / enum values are
  **immutable** once released.
- A removed entry's id becomes a reserved **tombstone** — never renumbered,
  never reused for a different semantic operation.
- A changed binary lowering is a **new id / new export name**, not an edit to
  the old one (pairs with D-WASM versioned imports).
- Codegen keeps a golden id table and **fails** if a previously published id
  changes meaning.

Without this, a stable generic `invoke(methodId, …)` dispatcher (D-WASM
model 2) is unsound: an old guest could invoke a newly assigned, unrelated
method.

**Status:** storage format (`.rgr` table vs data file) and exact handle packing
(D-HANDLE) remain open; the type system and generation targets above are
requirements before codegen.

## D-WASM — Source API ≠ binary WASM import signatures

"Append args with defaults" works for a **dynamic** dispatcher
(`invoke(methodId, argPtr, argCount, …)`). It does **not** work by changing the
signature of an existing direct WebAssembly import: instantiation checks import
types, and calls must match the declared function type.

Changing:

```
materialCreate(color: i32) -> handle
```

to:

```
materialCreate(color: i32, opacity: f64) -> handle
```

breaks previously compiled modules even if the host treats `opacity` as optional.

**Allowed versioning models (pick per surface, document in D-REGISTRY metadata):**

1. **Versioned imports:** `materialCreateV1(color)`, `materialCreateV2(color, opacity)`.
2. **Stable generic ABI:** `invoke(methodId, argPtr, argCount, resultPtr)` with
   host-side defaults for missing args.
3. **Freeze the original import forever** and supply new defaults only inside
   that host stub; new parameters require a new export name.

The class registry must label each method with its **binary WASM lowering**
separately from the **source-level** TS/Rust API.

## D-WASM-MEM — Linear-memory safety for bulk payloads

All pointer/length geometry (and other bulk) operations follow
[`docs/WASM_MEMORY_ABI.md`](./docs/WASM_MEMORY_ABI.md).

Bounds checking, memory-growth safety, atomic copying, and chunking are
**mandatory parts of the ABI**, not implementation optimizations. Summary:

- validate offset, length, overflow, and alignment before copy
- re-acquire the memory buffer after `memory.grow`; never cache JS views across calls
- no guest callbacks during a bulk copy
- chunk large uploads and read-backs
- no fixed-capacity ABI blocks for arbitrary geometry
- seqlock / revision for concurrently written shared memory
- one span convention (`offset_bytes`, `element_count`, `element_type`) with
  checked arithmetic; status codes separate from result counts

## D-ASYNC — Async operations across the WASM boundary

The registry may mark a method `async` (loaders). TS `await` and Rust futures
are guest-side sugar; the binary contract is polling plus a frame-boundary
completion queue — the ABI itself has **no callbacks**.

```
assetsLoadAudioBegin(pathPtr, pathLen) -> requestH   ; request owned by caller
requestPoll(requestH, resultOut) -> PENDING | COMPLETE | FAILED | CANCELLED
requestCancel(requestH)                              ; later polls report CANCELLED
requestRelease(requestH)                             ; frees the request slot
```

Rules:

1. **Exactly-once result transfer.** The first `COMPLETE` poll transfers
   ownership of the result handle to the caller; later polls still report
   `COMPLETE` but transfer nothing. `requestRelease` on a
   completed-but-unconsumed request releases the result too — a result can
   neither leak nor double-free.
2. **Completions are non-reentrant.** The host completes work and queues
   events; guest futures/promises resolve only when the host drains the queue
   at the frame boundary (D-MODULES frame pipeline, step 2) — never in the
   middle of a guest call, and never during a bulk copy
   ([`docs/WASM_MEMORY_ABI.md`](./docs/WASM_MEMORY_ABI.md) rule 3).
3. **Cancellation is best-effort.** After `requestCancel`, poll reports
   `CANCELLED` and any late host-side result is released host-side.
4. **Realm teardown** cancels outstanding requests and releases unconsumed
   results (D-OWN backstop) — including after a guest trap or an abandoned
   future.
5. The `rg_*_begin` / `rg_*_poll` import pairs in the Rust worked example are
   this contract; generated helper futures wrap them.

## D-GEO — Stable geometry handle across attribute setup

`new THREE.BufferGeometry()` must mint a stable `geoH` **before** attributes
exist. `setAttribute` mutates that handle; it must not call a create that
returns a new id.

```
new BufferGeometry()
    -> geometryCreateEmpty() -> geoH   ; stable from here

setAttribute(name, data…)
    -> geometrySetAttribute(geoH, name, span<f32>|span<u32>, itemSize, …)

attribute.needsUpdate = true
    -> geometryUpdateRange(geoH, name, first, count, data…)
    ; the adapter derives (first, count) from the writes it buffered since the
    ; last flush; if no range was tracked, the fallback is a full-attribute
    ; update (first=0, count=vertexCount) — still one bulk call, same geoH
```

**Two rules for vertex data:**

1. **One authoritative copy** — coordinates live only in the host geometry
   arrays. Guests hold handles or temporary read-back buffers. (Exact on the
   Ranger-native API; the Three-compat wrapper adds a guest staging array with
   aliasing — see **Aliasing** below.)
2. **Bulk crossings** — N vertices cross the WASM boundary in one call (ptr+len
   / `span`), never one call per float (D-WASM-MEM).

Handle stays stable when: geometry already attached to meshes; attributes added
one at a time; two meshes share the geometry; an attribute is replaced; index
data is added after positions. Convenience "create with all attributes at once"
may exist as sugar that still returns the empty-created handle after filling.

Read-back uses the **same** `geoH`:

```
geometryReadPositions(geoH, first, count, outSpan) -> status
; status 0 = success; elements written return via an out param — a
; zero-element read is success with writtenCount 0, never conflated with an
; error (span + status conventions: docs/WASM_MEMORY_ABI.md rules 10–11)
```

### Aliasing: Three-compat wrapper vs Ranger-native geometry

`BufferAttribute` aliasing is ordinary Three.js behavior:

```ts
const data = new Float32Array([0, 0, 0,  1, 0, 0,  0, 1, 0])
geometry.setAttribute("position", new THREE.BufferAttribute(data, 3))
data[0] = 4
attribute.needsUpdate = true
attribute.array === data   // true in Three.js — the guest still holds `data`
```

A single host copy cannot silently preserve that, so the contract is split:

| API | Authority | Behavior |
|-----|-----------|----------|
| **Three-compat wrapper** (interpreted path) | Guest array is the script-visible copy; host copy is what renders | `attribute.array` stays observable and mutable, aliasing preserved; direct writes are visible to guest reads immediately; `needsUpdate` bulk-copies the tracked range (fallback: whole attribute) to the host. A guest write without `needsUpdate` never renders. |
| **Ranger-native API** (compiled path, and the native TS surface) | Host arrays are the only copy | Guest uses upload / update / read-back commands (`geometrySetAttribute`, `geometryUpdateRange`, `geometryReadPositions`); no guest-visible array exists. |

Rules:

- The compat wrapper's guest array is a **staging copy with aliasing**, not a
  second authority: rendering always reads the host arrays, and after every
  `needsUpdate` flush the two must be byte-equal for the flushed range
  (parity-tested).
- Ownership is **not** transferred: `setAttribute` does not detach or freeze
  the guest array — that would break ordinary Three.js code.
- The compiled path has no compat mode — spans only (D-WASM-MEM).
- "One authoritative copy" is exact on the native API. On the compat wrapper
  it means *render authority*; it must not be presented as full Three.js value
  semantics — the table above is the semantics.

## D-2D — First-class retained 2D scene and sprite system

**P1.** The old games framework depends on 2D sprites, sprite sheets, primitive
shapes, cameras, animation, and frame-local drawing. These are **not**
implemented as Three.js meshes and must **not** be left behind as legacy
runner-specific ABIs (fixed RGSP1 slots, host-only character clocks, multiple
sheet registries). Omitting 2D from the binding contract would unify 3D while
leaving the more game-relevant 2D stack split across incompatible paths
(inventory: [`CODE_CLEANUP_OLD.md`](./CODE_CLEANUP_OLD.md)).

### Package

TypeScript:

```ts
import * as TWO from "ranger:2d"
```

Rust/WASM:

```rust
use ranger_wasm::two_d;
```

`ranger:2d` is a **sibling** of `ranger:three` — not a `THREE.Sprite` façade and
not folded into `ranger:core`. It uses the same handle registry, realm
validation, ownership (D-OWN), class registry (D-REGISTRY), and generated WASM
surface (D-WASM) as Three / Cannon / audio.

Prefer `ranger:2d` over `ranger:sprite`: the domain already includes rectangles,
circles, wedges, bitmap pixel art, sheets, cameras, layers, tilemaps, text, and
particles — not only textured quads.

### Object model

Persistent host-backed types (stable handles, typed arenas):

```text
Entity registry (shared)
├─ Sprite2D arena
├─ Shape2D arena
├─ Camera2D arena
├─ Layer2D / Scene2D arena
├─ TileMap2D arena
├─ AnimationPlayer2D arena
├─ Texture2D arena
├─ SpriteAtlas arena
└─ ParticleEmitter2D arena
```

Also registered: `AnimationClip2D`, `SpriteRegion` (may be a value or light
handle — declare residency in the registry), `Renderer2D`.

Frame-local drawing is separate:

```text
Sprite2D / Shape2D / …
    retained objects with identity and lifetime (D-IDENTITY, D-LIFE, D-OWN)
    → host/arenas/two_d/*

DrawList2D / Canvas2D commands
    frame-local commands without persistent object identity
    → host/frame_commands/two_d/draw_list/   (not an arena)
```

The old `game_sprite.rgr` path is the retained model; guest `.as` draw lists are
the immediate model. Both remain valid use cases — they must not stay as
unrelated implementations.

### Binding rules

- Sprite identity never depends on array index, slot number, z-order, or
  traversal order.
- Reordering and moving a sprite between layers preserves its handle.
- Texture, atlas, sprite, and animation-player identities are separate.
- Multiple sprites may share one texture or atlas (shared retain — D-OWN).
- Removing a sprite from a layer does not release it or its resources
  (membership ≠ object — D-LIFE).
- Atlas metadata loads through `runtime.assets` (D-ASYNC), not runner-specific
  manifests.
- Animation timing uses `runtime.time` and one shared animation model (not a
  per-runner clock).
- `Camera2D` supports translation, zoom, and rotation consistently on software,
  GPU, interpreted, and WASM paths — including `screenToWorld` / `worldToScreen`.
- Physics `Body` and `Sprite2D` remain **separate** objects; sync is either
  guest-side copy or an explicit weak `PoseBinding2D` (never “whichever runner
  you picked”).

### Atlas / animation asset model

One shared model replaces fixed 64×64 / row-direction / RGSP1 catalog assumptions:

```text
Texture2D          decoded image resource
SpriteAtlas        texture + named regions + animation definitions
SpriteRegion       atlas + source rect + pivot
AnimationClip2D    ordered regions + durations + events
AnimationPlayer2D  playback state attached to a Sprite2D
```

Atlas JSON must allow irregularly packed frames (not only grid sheets). LPC and
other packers emit this format; the host does not hard-code frame size.

Engine-level animation (sprites and, later, property tracks) drains events on
the same non-reentrant frame-boundary queue as D-ASYNC completions.

### Pose binding (optional)

```text
Sprite2D handle ≠ Body handle

PoseBinding2D { bodyH → spriteH }   // weak, generation-checked (D-OWN)
```

Destroying either side invalidates the binding; the binding must not keep body
or sprite alive.

### What this retires (after parity) — v2-scoped only

Fixed sprite-slot ABIs as the *primary* identity **for new v2 code**,
runner-specific sheet manifests **staged under v2**, host-only character
animation clocks **in the v2 path**, and incompatible Camera2D implementations
— tracked as D-2D migration gates in
[`CODE_CLEANUP_PLAN.md`](./CODE_CLEANUP_PLAN.md).

**v1 freeze:** retirement does **not** delete `scripting/game_sprite.rgr`, v1
sheet runners, or other engine paths that still-supported top-level `games/*`
need. v2 is additive; v1 keeps running until an explicit end-of-v1 milestone.

---

## D-MODULES — Importable packages: `ranger:core`, `ranger:2d`, `ranger:three`, `ranger:cannon`

TypeScript (and the TSX interpreter) import **virtual modules** injected by the
Ranger runtime for the current `realmId`. They are not ordinary globals and not
shared across guests.

```ts
import * as THREE from "ranger:three"
import * as CANNON from "ranger:cannon"
import * as TWO from "ranger:2d"

import {
  runtime,
  type Game,
  type FrameInfo,
  type ActionMap,
  type AudioClip,
  type AudioSource,
} from "ranger:core"
```

### Package responsibilities

```text
ranger:core
├─ runtime / game loop          runtime.start(game)
├─ surface and display
│  ├─ size / title / cursor / fullscreen
│  ├─ attachRenderer(…)
│  └─ viewports / panes         split-screen (see below)
├─ input
│  ├─ keyboard / mouse / touch / gamepads
│  ├─ action maps               logical actions, not gamepads[0]
│  ├─ player assignment         runtime.input.player(i)
│  │                            (may be scoped per viewport / pane)
│  └─ haptics                   player.rumble(…)
├─ audio
│  ├─ clips / sources / voices  separate identities (below)
│  ├─ listener                  attachTo(camera)
│  ├─ mixer buses
│  ├─ vocal FX                  runtime.audio.vocal.play(cue)
│  └─ music score               runtime.audio.music.play / stop
├─ asset loading                loadAudio / loadModel / loadSpriteAtlas / …
├─ timing                       FrameInfo.delta, fixedDelta
├─ logging                      runtime.log.*
├─ pose bindings (optional)     runtime.bindings.bindPose2D(…)
└─ platform capabilities        runtime.platform.*

ranger:2d                         (D-2D — not THREE.Sprite)
├─ Scene2D / Layer2D / Camera2D / Renderer2D
├─ Sprite2D / Shape2D / TileMap2D / ParticleEmitter2D
├─ SpriteAtlas / AnimationClip2D / AnimationPlayer2D
└─ DrawList2D                   frame-local (no persistent handles)

ranger:three
├─ scenes, cameras, meshes, geometry, materials
└─ renderer façade              (live NativeRefs — D-SYNC)

ranger:cannon
├─ worlds, bodies, shapes, constraints
└─ physics arenas               (separate from Three / 2D handles — D-TYPE)
```

`ranger:2d`, `ranger:three`, and `ranger:cannon` provide **domain object APIs**
(`new Sprite2D`, `new Mesh`, `new Body`). `ranger:core` provides the **host
environment and services**.

Today’s `ranger-game` / `scripting/engine.d.ts` surface migrates toward
`ranger:core`; new examples must not invent `window` / `document` /
`requestAnimationFrame` as the native Ranger API (web-compat shims may still
exist, but they resolve to the same runtime services).

### What uses `new` vs what the runtime owns

| Type | Creation |
|------|----------|
| `THREE.Mesh`, `THREE.Scene`, `TWO.Sprite2D`, `CANNON.Body` | `new` → host handle (D-SYNC) |
| User-defined `PlayerController` / `PhysicsVisual` | `new` — **guest-only** class; holds NativeRefs, no host handle of its own |
| `AudioSource` | `runtime.audio.createSource(…)` (or registered `new AudioSource` if in D-REGISTRY) |
| `AudioClip` / `SpriteAtlas` | returned by `runtime.assets.load*` — not `new` |
| `Gamepad` | discovered by input; **not** constructed |
| Audio output device / display / window / frame clock | owned by runtime; **not** constructed |

Undesirable:

```ts
const pad = new Gamepad()
const audioDevice = new AudioDevice()
const window = new Window()
```

Those represent platform-owned capabilities. Guests receive controlled
references scoped to their realm.

### Input: action maps over `gamepads[0]`

Raw enumeration may exist for diagnostics:

```ts
for (const pad of runtime.input.gamepads()) {
  runtime.log.info(`${pad.name}: ${pad.connected}`)
}
```

Game logic should use **logical actions**:

```ts
controls.axis1D("rotate")
controls.wasPressed("jump")
```

A gamepad’s array index is not stable identity (disconnect / reconnect / reorder /
reassign / layout differences). Distinguish:

```text
Device identity     physical connection + generation (D-HANDLE-style)
Player assignment   logical player 0, player 1, …
Action              jump, rotate, accelerate, pause, …
```

```text
GamepadHandle { slot, generation, realmId }
PlayerInput   { playerIndex, assignedDeviceHandles[], actionMap }
```

`runtime.input.player(0)` remains “player one” even if their controller
reconnects under a different device handle.

### Audio: clip ≠ source ≠ voice (and D-LIFE applies)

```text
AudioClip    decoded / shared resource          clipH
AudioSource  persistent emitter (pose, bus, …)  sourceH
AudioVoice   one active playback instance       voiceH
```

```ts
const clip = await runtime.assets.loadAudio("explosion.ogg")
// host: assetsLoadAudio → clipH (refcount resource)

const source = runtime.audio.createSource(clip, { spatial: true })
// host: audioSourceCreate(clipH, …) → sourceH; retain(clipH)

source.attachTo(mesh)
// host: audioSourceAttachEntity(sourceH, meshH) — weak, generation-checked
//       ref (D-OWN): destroying the mesh auto-detaches; the source never
//       keeps a dead entity alive

const voice1 = source.play()
const voice2 = source.play()
// host: audioSourcePlay(sourceH) → voice1H, voice2H — caller-owned voices
//       does not clone clipH or sourceH

source.playOneShot()
// host: audioSourcePlayOneShot(sourceH) — fire-and-forget: the mixer owns
//       the voice and auto-releases it when playback completes; nothing for
//       the caller to leak
```

Lifetimes follow D-LIFE (ownership per D-OWN):

- `clip.disposeBackend()` / device-buffer release — backend only; `clipH` stays valid.
- `clip.release()` — object ownership (refcount); may invalidate the handle.
- Removing a mesh does not release attached sources; `source.release()` does.
- `play()` returns a **caller-owned** `voiceH` — stop/release it (Rust: `Drop`),
  or it lives until source release / realm teardown. `playOneShot()` returns
  nothing; the mixer owns and auto-releases that voice at completion. Common
  sound effects use `playOneShot`; looping / pitch-controlled playback uses
  `play()`.

### Guest classes vs native classes

```ts
class PhysicsVisual {
  constructor(
    readonly body: CANNON.Body,
    readonly mesh: THREE.Mesh,
  ) {}
}
```

Remains a **pure guest** object: it composes NativeRefs and needs no host
handle. Register a class in D-REGISTRY only when its state/ops must live in
Ranger (e.g. `AudioSource` with host pose attachment and voice allocation).

Registry entries carry
`module: ranger:core | ranger:2d | ranger:three | ranger:cannon`
so codegen emits the correct import package, interpreter registration, WASM
surface, and TypeScript declarations (D-REGISTRY).

### Capability root (not unrelated globals)

Expose one root on `runtime`:

```ts
runtime.surface
runtime.input
runtime.audio
runtime.assets
runtime.time
runtime.log
runtime.platform
```

rather than bare `GamePads` / `Audio` / `Window` / `Assets` / `Clock` globals.
The root carries realm, permissions, backend, and lifecycle.

Compatibility vs native style:

```ts
// web-compat shim (optional)          // Ranger-native (preferred in new demos)
window.innerWidth                      runtime.surface.size.width
requestAnimationFrame(...)             runtime.start(game)  // host owns the tick
document.body.appendChild(...)         runtime.surface.attachRenderer(renderer)
```

Both may resolve to the same host services; new examples use `ranger:core`
explicitly.

### Module namespace isolation (prerequisite)

Today the interpreter binds every imported top-level name into one shared
`moduleScope` — last import wins on a collision
([`docs/TSX_ENGINE_ISSUES.md`](./docs/TSX_ENGINE_ISSUES.md) #5/#9). The
`ranger:*` packages are unsafe to expose until that is fixed. Binding rules:

- Every imported module gets its **own namespace object**; two modules may
  export the same names without clobbering each other:

  ```ts
  import * as A from "test:a"
  import * as B from "test:b"
  // both export helpers named Vector3 and init; neither overwrites the other
  A.init()
  B.init()
  ```

- Importing the same module twice in one realm returns the **same** namespace
  object (cached instance; the module body evaluates once).
- Two realms get **separate** namespace instances and **separate** `runtime`
  capability roots — no cross-realm sharing (D-HANDLE realm rules).
- A failed module initialization is **cached as failed**: re-importing reports
  the same error; the initializer does not silently re-run.
- Circular imports are a **hard error** in the first cut (deterministic), not
  a partially initialized namespace.
- Hot reload tears module state down with the realm and re-issues the
  capability roots; a stale namespace object fails like a stale handle
  (epoch bump), it does not half-work.

### Surface viewports / split-screen

Kids’ two-player titles (ylos2 `splitScreen=auto`, pyorretris2p, …) need more
than one `Camera2D`. The surface owns **panes** (viewports); cameras render
into them.

```ts
// Conceptual — exact names land in the registry
runtime.surface.setLayout("split-horizontal") // or explicit pane rects
const left = runtime.surface.pane(0)   // { x, y, width, height, player?: 0 }
const right = runtime.surface.pane(1)

renderer2d.render(scene, cameraP1, { target: left })
renderer2d.render(scene, cameraP2, { target: right })
```

Rules:

- Panes are runtime-owned rectangles on the single surface (not separate
  windows). Layout may be `single`, `split-horizontal`, `split-vertical`, or
  an explicit list of normalized rects.
- Each pane may bind a **logical player** for input routing
  (`runtime.input.player(i)` already exists; pane binding makes
  pointer/gamepad focus unambiguous in split layouts).
- `Camera2D.viewport` may default to the full surface; when rendering to a
  pane, the effective viewport is the pane rect (same camera math — D-2D).
- Software and GPU backends must honor the same pane → scissor/viewport
  mapping.
- Single-player games ignore panes (one full-surface default).

Without this, ylos2-class ports cannot express the gameplay kids already have.

### Audio: vocal FX and music score

Clip / source / voice remain the primitive model. Two **higher-level**
facades that v1 games already rely on must have a home on `ranger:core`
(not left as undefined TS-only runners):

```ts
// Vocal FX — short expressive one-shots (chuckle, gasp, …)
runtime.audio.vocal.play("chuckle")
// host: resolves a catalog or generated cue → playOneShot on a voice bus
//       (implementation may be synth or sample bank; identity is the cue name)

// Music score — start/stop a named procedural or sequenced score
runtime.audio.music.play(scoreHandleOrName)
runtime.audio.music.stop()
```

Rules:

- Vocal FX and music are **not** a second ownership universe: they mint or
  reuse `AudioSource` / mixer-owned voices under the hood (D-OWN / D-LIFE).
- Catalog cue names are realm-scoped assets or built-in packs loaded through
  `runtime.assets` where applicable (D-ASYNC).
- Ports **may** temporarily map `voiceEvent` / `musicScoreEvent` to plain
  `playOneShot` clips, but that is a **port-local** choice and must be
  documented on the game — the contract still requires the facades so
  ylos2-class titles are not stuck.

### Frame pipeline (`runtime.start`)

The host owns the tick; physics stepping and rendering are **guest-called
inside `update`**. That is the one model — runtime-owned stepping/rendering is
not a silently supported alternative.

```
1. host:  snapshot input                 (stable for the whole update call;
                                          per-pane / per-player routing applied)
2. host:  drain async completions        (D-ASYNC — futures/promises resolve here)
3. host:  deliver resize / pane layout, if any   (never mid-update)
4. host:  call game.update(frame)
5. guest:   zero or more world.fixedStep calls    (guest policy)
6. guest:   zero or more renderer.render(scene, camera[, pane])
7. host:  submit audio (SFX, vocal FX, music) + graphics, present the surface
8. host:  advance input edges            (wasPressed / wasReleased clear)
```

Rules:

- No `update` runs before async `init()` has resolved; no present before the
  first update.
- `update` throwing / returning an error stops the realm: the host calls
  `shutdown`, then tears the realm down (D-OWN backstop) — it does not retry.
- Zero render calls in an update → the host re-presents the previous frame's
  output; it never renders implicitly (D-SYNC). Multiple render calls are
  allowed (offscreen targets and **split panes**); presents compose pane
  results to the surface.
- Input values are stable across one `update` call; edge states advance only
  at step 8.

### Rust / WASM package layout (`ranger_wasm`)

Compiled guests use the **same** registry commands and host objects as
TypeScript. A helper crate wraps the generated ABI:

```rust
use ranger_wasm::{
    core::{self, ActionMap, FrameInfo, Game, GameContext, Result},
    two_d,
    three,
    cannon,
};
```

```text
ranger_wasm::core     ↔  ranger:core      (runtime, input, audio, assets, …)
ranger_wasm::two_d    ↔  ranger:2d        (sprites, cameras, atlases, …)
ranger_wasm::three    ↔  ranger:three
ranger_wasm::cannon   ↔  ranger:cannon
```

The helper owns: handle validation, retain/release on `Clone`/`Drop`, string /
span lowering (D-WASM-MEM), async asset futures, and mapping ABI error codes to
`Result`. It does **not** replace host checks — realm / generation / type are
still enforced on every import (D-HANDLE).


---

# Worked example — camera position and physics-driven mesh position

**Target design.** This chapter walks a familiar Three.js + cannon.js demo under
the live-object model (D-SYNC), with typed-arena handles (D-TYPE) and the
three lifetimes (D-LIFE). It is not how the engine works today.

The demo matters because game logic almost always does two things scripts own:

1. **Drive the camera** (`camera.position…`, aspect on resize).
2. **Observe or move object / player positions** (here: copy cannon → mesh each
   frame; the same path is “read player pose” or “teleport player”).

Full guest script (reference). Comments state, actor by actor, what happens
when each line executes under the target architecture (D-SYNC) — see
**Components and actors** for the labels. Sections below quote lines again as
they are explained.

```js
// three.js variables. Guest-side bindings; after init each holds a NativeRef
// wrapping a host handle. They are not a second scene graph.
let camera, scene, renderer
let mesh

// cannon.js variables. Handles into the physics subsystem — separate arenas
// and separate handles from the Three scene (bodyH ≠ meshH).
let world
let body

initThree()   // host objects are created inside, one per `new` — not later
initCannon()  // physics objects likewise; physics arenas, not Three arenas
animate()     // guest frame loop: step physics → copy pose to mesh → render

function initThree() {
  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100)
  // interp:  evaluates `new` on the wrapper class PerspectiveCamera
  // adapter: construct("PerspectiveCamera", [75, aspect, 1, 100]) — once, here
  // host:    cameraCreatePerspective(fov, aspect, near, far, realmId) → cameraH;
  //          allocates a camera-arena slot; pose starts at the origin
  // interp:  `camera` binds EvalValue{ NativeRef cameraH, identityId }

  camera.position.z = 5
  // adapter: getProperty(camera, "position") → hybrid Vector3 mirror bound to
  //          cameraH, initialized from the host value ((0,0,0) for a new camera)
  // guest:   writes the z component of the mirror
  // adapter: a component write on a bound mirror is a declared sync boundary
  // host:    cameraSetPosition(cameraH, 0, 0, 5) — full vector from the mirror;
  //          x,y are the mirror's current values (still 0 here). Same cameraH;
  //          no new object; membership unchanged.

  // Scene
  scene = new THREE.Scene()
  // adapter: construct("Scene")
  // host:    sceneCreate(realmId) → sceneH; scene arena, child list empty

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  // adapter: construct("WebGLRenderer", { antialias })
  // host:    rendererCreate({ antialias }) → rendererH — on native Ranger
  //          targets this usually binds the existing gfx_sdl / framebuffer
  //          surface rather than creating a new one

  renderer.setSize(window.innerWidth, window.innerHeight)
  // adapter: invokeMethod(renderer, "setSize", [w, h])
  // host:    rendererSetSize(rendererH, w, h) — viewport / backend size only

  document.body.appendChild(renderer.domElement)
  // guest:   DOM call — exists on the web target only
  // host:    presents the surface; on native SDL there is no DOM step, the
  //          surface is already on screen

  window.addEventListener('resize', onWindowResize)
  // guest:   guest-only registration; no host call now. The handler issues
  //          host commands when it runs (see onWindowResize)

  // Box
  const geometry = new THREE.BoxBufferGeometry(2, 2, 2)
  // (BoxBufferGeometry is the pre-r125 Three.js name for BoxGeometry; both
  //  lower to the same command)
  // adapter: construct("BoxBufferGeometry", [2, 2, 2])
  // host:    geometryBox(2, 2, 2) → geoH — computes the box vertices directly
  //          into the CPU arrays of a geometry-arena slot; that is the one
  //          authoritative copy (D-GEO)

  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
  // adapter: construct("MeshBasicMaterial", opts)
  // host:    materialBasic(0xff0000, wireframe=true, …) → matH; material arena

  mesh = new THREE.Mesh(geometry, material)
  // adapter: construct("Mesh", [geometry, material]) — resolves both arguments
  //          by interpreter identity to geoH / matH (same script object →
  //          same handle, D-IDENTITY)
  // host:    meshCreate(geoH, matH) → meshH; retain(geoH), retain(matH).
  //          The host mesh exists from this line on — not from scene.add,
  //          not from the first render.

  scene.add(mesh)
  // adapter: invokeMethod(scene, "add", [mesh]) — resolves mesh → meshH
  // host:    entitySetParent(meshH, sceneH) — membership only (lifetime 2,
  //          D-LIFE); creates nothing, releases nothing
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  // adapter: setProperty(camera, "aspect", value) — plain scalar native prop
  // host:    cameraSetAspect(cameraH, aspect) — mutates the same cameraH

  camera.updateProjectionMatrix()
  // adapter: invokeMethod(camera, "updateProjectionMatrix")
  // host:    cameraUpdateProjectionMatrix(cameraH) — recomputes the projection

  renderer.setSize(window.innerWidth, window.innerHeight)
  // host:    rendererSetSize(rendererH, w, h) — viewport change, not a camera op
}

function initCannon() {
  world = new CANNON.World()
  // adapter: construct("CANNON.World")
  // physics: physicsWorldCreate() → worldH — a new world in the physics subsystem

  // Box
  const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1))
  // guest:   shape parameters are guest-resident data until attached to a body;
  //          half-extents (1,1,1) match the Three box of size 2

  body = new CANNON.Body({
    mass: 1,
  })
  // adapter: construct("CANNON.Body", { mass: 1 })
  // physics: bodyCreate(mass=1) → bodyH in the body arena. The body exists
  //          without a world — world membership is set by world.addBody below.
  //          (Object lifetime ≠ membership: the same split as D-LIFE.)

  body.addShape(shape)
  // adapter: invokeMethod(body, "addShape", [shape]) — lowers the guest-side
  //          shape data across the boundary
  // physics: bodyAddBoxShape(bodyH, 1, 1, 1)

  body.angularVelocity.set(0, 10, 0)
  // adapter: hybrid vector bound to bodyH; set() is a declared sync boundary
  // physics: bodySetAngularVelocity(bodyH, 0, 10, 0)

  body.angularDamping = 0.5
  // adapter: setProperty — scalar native prop
  // physics: bodySetAngularDamping(bodyH, 0.5)

  world.addBody(body)
  // adapter: invokeMethod(world, "addBody", [body]) — resolves body → bodyH
  // physics: worldAddBody(worldH, bodyH) — membership only; the physics
  //          counterpart of scene.add
}

function animate() {
  requestAnimationFrame(animate)
  // guest:   requests the next tick. rAF on the web; on native the host frame
  //          loop schedules the next guest update

  // Step the physics world
  world.fixedStep()
  // physics: physicsWorldFixedStep(worldH, dt) — integrates every body in
  //          worldH. bodyH now holds the authoritative pose for this frame;
  //          the Three mesh is stale until the copy below runs.

  // Copy coordinates from cannon.js to three.js
  mesh.position.copy(body.position)
  // adapter: getProperty(body, "position") — read side
  // physics: bodyGetPosition(bodyH) → (x, y, z)
  // adapter: copy() into the mesh position mirror is a sync boundary
  // host:    meshSetPosition(meshH, x, y, z) — live write to the drawable;
  //          same meshH, no create, no release

  mesh.quaternion.copy(body.quaternion)
  // physics: bodyGetQuaternion(bodyH) → (qx, qy, qz, qw)
  // host:    meshSetQuaternion(meshH, qx, qy, qz, qw)

  // Render three.js
  renderer.render(scene, camera)
  // adapter: invokeMethod(renderer, "render", [scene, camera])
  // host:    rendererRender(rendererH, sceneH, cameraH)
  // render:  draws from current host state — mesh pose from the copy above,
  //          camera pose from initThree / onWindowResize. Rendering reads;
  //          it never creates, reconciles, or syncs script state (D-SYNC).
}
```

## W.1 Declarations — script bindings, not host objects yet

```js
// three.js variables — guest bindings only until construct (no host objects yet)
let camera, scene, renderer
let mesh

// cannon.js variables — will bind to worldH / bodyH (physics arena, not Three)
let world
let body
```

Under the target architecture these are **guest-side bindings** to host handles
(or to physics-world handles), not a second scene graph.

| Variable | After init | Host side |
|----------|------------|-----------|
| `camera` | `EvalValue` / WASM ref with `cameraH` | Camera arena payload (`ThreePerspectiveCamera`) |
| `scene` | NativeRef `sceneH` | Scene arena |
| `renderer` | NativeRef `rendererH` (or host-owned singleton) | Renderer + GPU backend |
| `mesh` | NativeRef `meshH` | Mesh arena; retains `geoH` / `matH` |
| `world` | Physics world handle `worldH` | Cannon / `PhysicsWorld` implementation |
| `body` | Rigid-body handle `bodyH` | Physics body arena (not a Three mesh) |

`mesh` and `body` are **different objects with different handles**. Linking them
is an explicit per-frame (or binding) copy in `animate` — the architecture does
not magically merge “physics body” and “drawable mesh” into one id.

```js
initThree()   // host: mints cameraH, sceneH, rendererH, geoH, matH, meshH; parents mesh → scene
initCannon()  // physics: mints worldH, bodyH; adds the body to the world
animate()     // guest: frame loop — step physics, copy pose to mesh, render
```

Order is intentional: create the drawable + camera first, then the physics twin,
then the loop that copies physics → mesh and renders through the camera.

## W.2 Camera create and script-driven position

```js
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100)
// adapter: construct("PerspectiveCamera", args) — the only create for this camera
// host:    cameraCreatePerspective(75, aspect, 1, 100, realmId) → cameraH (camera arena)
// interp:  camera binds EvalValue{ NativeRef cameraH, identityId } — nothing is
//          deferred to a reconcile pass
```

Live path (D-SYNC), once:

```
cameraCreatePerspective(fov=75, aspect, near=1, far=100, realmId)
    -> cameraH
camera EvalValue { NativeRef cameraH, identityId }
```

- Host allocates a slot in the **camera arena** (D-TYPE), not a bare
  `ThreeObject3D` in a mixed `entities[]` array.
- Aspect comes from the guest (window size today; on Ranger hosts often from
  the framebuffer / `GameRuntime` size). Same command either way.
- No reconciler pass later “discovers” this camera — it already exists.

```js
camera.position.z = 5
// adapter: position resolves to a hybrid Vector3 mirror bound to cameraH;
//          the component write is a declared sync boundary
// host:    cameraSetPosition(cameraH, 0, 0, 5) — full vector from the mirror
//          (x,y are the mirror's current values, still 0 for a fresh camera);
//          immediate or end-of-turn, never deferred to render(); same cameraH
```

This is the common case: **game / script sets the camera.**

Residency (hybrid residency — D-ADAPTER — is allowed for `position`):

1. Guest may keep a local `Vector3` mirror for hot math.
2. Assigning `camera.position.z = 5` (or `camera.position.set(0,0,5)`) is a
   **documented sync boundary** → host command immediately (or at end of the
   script turn, never at an implicit `render()` reconcile):

```
cameraGetPosition(cameraH) -> (x,y,z)     ; if reading
cameraSetPosition(cameraH, 0, 0, 5)       ; this write
; equivalent: entityTransform(cameraH, …) if cameras share Object3D transforms
```

Important properties:

- **Immediate (or explicitly batched) host update** — `renderer.render(scene,
  camera)` must see `z = 5` without a structural reconcile inventing a second
  camera.
- **Stable `cameraH`** — moving the camera never allocates a new handle.
- **Membership separate from pose** — the camera may or may not be a scene
  child; setting `position` does not `release` or recreate it (D-LIFE).
- **Read-back for game logic** — chase-cam / clamps use the same surface:

```js
// later, e.g. follow player
camera.position.x = mesh.position.x
// host:    meshGetPosition(meshH) → (x, y, z) — read side
// adapter: writes the camera mirror component and commits cameraSetPosition
camera.position.y = mesh.position.y + 2
camera.position.z = mesh.position.z + 5
// adapter: the three writes may commit one by one or coalesce into a single
//          cameraSetPosition at the declared boundary — same cameraH either way
// guest:   owns the policy (where the camera should be); host owns the pose
//          the renderer will use
```

Each line is `cameraSetPosition` / component set after `meshGetPosition` (or a
small guest-side temp `Vector3` then one `cameraSetPosition` flush). The host
camera pose is authoritative for rendering; the script is authoritative for
*policy* (where it should look).

### Resize — camera projection, not position

```js
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  // adapter: setProperty(camera, "aspect") → host: cameraSetAspect(cameraH, aspect)
  camera.updateProjectionMatrix()
  // adapter: invokeMethod → host: cameraUpdateProjectionMatrix(cameraH)
  renderer.setSize(window.innerWidth, window.innerHeight)
  // host: rendererSetSize(rendererH, w, h) — viewport only, no camera change
}
```

| Line | Host command |
|------|----------------|
| `camera.aspect = …` | `cameraSetAspect(cameraH, aspect)` — mutates same `cameraH` |
| `camera.updateProjectionMatrix()` | `cameraUpdateProjectionMatrix(cameraH)` — recomputes projection on host |
| `renderer.setSize(…)` | `rendererSetSize(rendererH, w, h)` — backend / viewport; not a camera pose change |

Again: no new camera object; projection lifetime is part of the camera object,
not a GPU resource `dispose()`.

## W.3 Scene, renderer, box mesh

```js
scene = new THREE.Scene()
// adapter: construct("Scene")
// host:    sceneCreate(realmId) → sceneH — scene arena, empty graph
```

```js
renderer = new THREE.WebGLRenderer({ antialias: true })
// host: rendererCreate({ antialias }) → rendererH — or bind the existing host surface
renderer.setSize(window.innerWidth, window.innerHeight)
// host: rendererSetSize(rendererH, w, h)
document.body.appendChild(renderer.domElement)
// guest: DOM call on the web target only
// host:  presents the surface; the guest never owns GPU objects on either target
```

On Ranger hosts the “canvas” is often the SDL / framebuffer surface already
owned by `gfx_sdl` / `framebuffer.rgr`. Mapping:

```
rendererCreate({ antialias }) -> rendererH   ; or bind to existing host surface
rendererSetSize(rendererH, w, h)
; appendChild → host presents that surface (no DOM on Pi/native)
```

```js
const geometry = new THREE.BoxBufferGeometry(2, 2, 2)
// adapter: construct → host: geometryBox(2,2,2) → geoH; CPU arrays in the
//          geometry arena (BoxBufferGeometry = pre-r125 name of BoxGeometry)

const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
// host: materialBasic(0xff0000, wireframe, …) → matH — material arena

mesh = new THREE.Mesh(geometry, material)
// adapter: resolves geometry / material by identity → geoH, matH
// host:    meshCreate(geoH, matH) → meshH; retain(geoH), retain(matH) —
//          the host mesh exists from this line

scene.add(mesh)
// host: entitySetParent(meshH, sceneH) — membership only; same meshH
```

Line-by-line (D-GEO + D-SYNC + D-LIFE):

| Guest line | Host effect |
|------------|-------------|
| `new BoxBufferGeometry(2,2,2)` | `geometryBox(2,2,2) → geoH` (or empty+fill); CPU arrays in geometry arena |
| `new MeshBasicMaterial({…})` | `materialBasic(color, wireframe, …) → matH` |
| `new THREE.Mesh(geometry, material)` | `meshCreate(geoH, matH) → meshH`; **retain** geo/mat; **one** host mesh |
| `scene.add(mesh)` | `entitySetParent(meshH, sceneH)` — **membership only**, same `meshH` |

Not allowed under the target model:

- `new Mesh` creates nothing, then `reconcile()` creates `meshH` later.
- `scene.add` clones geometry/material into new handles (today’s `buildMeshH`
  bug — [`CODE_CLEANUP_OLD.md`](./CODE_CLEANUP_OLD.md) II.E).
- `scene.add` as the moment the mesh “becomes real.”

Default mesh pose is identity at the origin until physics (or script) writes it.

## W.4 Physics world and rigid body (parallel to the mesh)

```js
function initCannon() {
  world = new CANNON.World()
  // physics: physicsWorldCreate() → worldH

  const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1))
  // guest: shape data stays guest-side until addShape; half-extents (1,1,1)
  //        match the Three box of size 2

  body = new CANNON.Body({
    mass: 1,
  })
  // physics: bodyCreate(mass=1) → bodyH (≠ meshH). The body exists without a
  //          world; membership comes from world.addBody below (object ≠
  //          membership, the D-LIFE split)

  body.addShape(shape)
  // physics: bodyAddBoxShape(bodyH, 1,1,1)
  body.angularVelocity.set(0, 10, 0)
  // adapter: hybrid vector; set() commits → physics: bodySetAngularVelocity(bodyH, 0,10,0)
  body.angularDamping = 0.5
  // physics: bodySetAngularDamping(bodyH, 0.5)
  world.addBody(body)
  // physics: worldAddBody(worldH, bodyH) — membership only
}
```

Physics is a **second host subsystem** (`PhysicsWorld` / Cannon), not entries in
the Three mesh arena:

| Guest line | Host effect |
|------------|-------------|
| `new CANNON.World()` | `physicsWorldCreate() → worldH` |
| `new CANNON.Box(Vec3(1,1,1))` | guest-side shape data; half-extents (1,1,1) match the Three box of size 2 |
| `new CANNON.Body({ mass: 1 })` | `bodyCreate(mass=1) → bodyH` — created without world membership |
| `body.addShape(shape)` | `bodyAddBoxShape(bodyH, 1,1,1)` |
| `body.angularVelocity.set(0,10,0)` | `bodySetAngularVelocity(bodyH, 0,10,0)` |
| `body.angularDamping = 0.5` | `bodySetAngularDamping(bodyH, 0.5)` |
| `world.addBody(body)` | `worldAddBody(worldH, bodyH)` — membership only (analogous to `scene.add`, but for `worldH`) |

`bodyH` and `meshH` stay distinct. Game logic that “moves the player” must say
which side is authoritative this frame (usually physics), then copy.

## W.5 Animate — step physics, copy pose to mesh, render through camera

```js
function animate() {
  requestAnimationFrame(animate)
  // guest: requests the next tick (rAF on web; host frame loop on native)

  // Step the physics world
  world.fixedStep()
  // physics: physicsWorldFixedStep(worldH, dt) — bodyH pose advances

  // Copy coordinates from cannon.js to three.js
  mesh.position.copy(body.position)
  // physics: bodyGetPosition(bodyH) → host: meshSetPosition(meshH, …)
  mesh.quaternion.copy(body.quaternion)
  // physics: bodyGetQuaternion(bodyH) → host: meshSetQuaternion(meshH, …)

  // Render three.js
  renderer.render(scene, camera)
  // host: rendererRender(rendererH, sceneH, cameraH); render: draws host state
}
```

### Step

```js
world.fixedStep()
// physics: physicsWorldFixedStep(worldH, dt) — integrates every body in worldH;
//          bodyH now holds the frame's authoritative simulation pose
```

After this, **authoritative simulation pose** is on `bodyH`. The Three mesh is
stale until the copy lines run.

### Object / player position — write mesh from body (observe physics → draw)

```js
mesh.position.copy(body.position)
// adapter: getProperty(body, "position") → physics: bodyGetPosition(bodyH)
// adapter: copy() into the mesh position mirror commits the write
// host:    meshSetPosition(meshH, x, y, z)
mesh.quaternion.copy(body.quaternion)
// physics: bodyGetQuaternion(bodyH) → host: meshSetQuaternion(meshH, qx,qy,qz,qw)
```

This is the core “game logic moves / mirrors the object” pattern:

```
(bx,by,bz) = bodyGetPosition(bodyH)       ; read physics authority
(qx,qy,qz,qw) = bodyGetQuaternion(bodyH)

meshSetPosition(meshH, bx, by, bz)        ; write drawable pose (live)
meshSetQuaternion(meshH, qx, qy, qz, qw)
; same meshH as scene.add — membership unchanged; no new mesh; no dispose
```

Guest-side sugar `mesh.position.copy(…)` is hybrid residency: a temporary
`Vector3` may exist in the interpreter, then one host write. It must not mint a
new `meshH` or a new geometry.

**Read path (AI, triggers, UI):** same handles, opposite direction of interest —

```js
// observe player drawable pose
const p = mesh.position
// adapter: getProperty → host: meshGetPosition(meshH) → guest Vector3 mirror

// or observe simulation pose (preferred for gameplay fairness)
const bp = body.position
// adapter: getProperty → physics: bodyGetPosition(bodyH) → guest mirror
```

**Write path (teleport / scripted move):** decide authority, then set both if
both exist:

```js
// script teleports player
body.position.set(x, y, z)
// physics: bodySetPosition(bodyH, x,y,z) — simulation pose is now authoritative
body.velocity.set(0, 0, 0)
// physics: bodySetVelocity(bodyH, 0,0,0) — clear residual motion if needed
mesh.position.copy(body.position)
// host: meshSetPosition(meshH, x,y,z) — drawable matches within the same frame
```

Never only move `mesh` if the next `fixedStep` will overwrite from `body`
(unless the body is kinematic and you write the body too).

**Data flow for one frame:**

```
bodyH (physics arena) --fixedStep--> new pose
        │
        │  bodyGetPosition / bodyGetQuaternion
        ▼
guest script (animate)
        │
        │  meshSetPosition / meshSetQuaternion
        ▼
meshH (mesh arena)  -- still parented to sceneH --
        │
cameraH.position (script policy; here still z=5)
        │
renderer.render(sceneH, cameraH)
```

### Render

```js
renderer.render(scene, camera)
// adapter: invokeMethod → host: rendererRender(rendererH, sceneH, cameraH)
// render:  draws from current host state only — reads, never creates or reconciles
```

Uses **current** host poses: mesh from the copy lines, camera from W.2
(`z = 5` or whatever the chase-cam wrote). No reconcile invents objects here.

## W.6 What this example forbids (regression checklist)

| Incorrect behavior | Why it fails this demo |
|--------------------|------------------------|
| Reconcile creates `meshH` on first `render` | `mesh.position.copy` in `animate` would have no stable target; double-create risk |
| `camera.position.z = 5` stored only in the wrapper, never sent to the host | Rendered view ignores script camera policy |
| `mesh.position.copy` allocates a new mesh/geo | Handle identity breaks; physics pairing lost |
| `scene.remove(mesh)` disposes geometry | Shared resources + revive patterns break (D-LIFE) |
| `body` and `mesh` forced to one handle | Physics step and drawable attach have different lifetimes / arenas |
| Packed handle wrap aliases `cameraH` | Chase-cam writes another guest’s camera (D-HANDLE / realm) |

## W.7 Mapping onto Ranger packages

| Concern | Import / home |
|---------|----------------|
| `cameraH` / `meshH` / `sceneH` / materials / geometries | `ranger:three` → `ThreeSceneHost` + typed arenas |
| `worldH` / `bodyH` | `ranger:cannon` → `PhysicsWorld` arenas |
| Frame tick, surface, input, audio, assets | `ranger:core` → `runtime.*` (D-MODULES) |
| `renderer.render` | Host frame end (`gfx_sdl` / WebGL); on native, surface from `runtime.surface` |

The ABI may expose fewer sugar names (`rg_set_translation(meshH,x,y,z)`), but
the **identity and timing rules** are the same as the Three lines above. Prefer
the `ranger:*` imports in new demos (worked example 3).

---

# Worked example — geometry upload, update, and read-back

Validates D-GEO / D-WASM-MEM: one authoritative host vertex copy, stable `geoH`,
bulk upload, mutation + GPU revision, read-back through the same handle.

```js
const vertices = new Float32Array([1, 1, 1,  -1, -1, 1,  -1, 1, -1 /* … */])
// guest: staging array in guest memory; after upload it remains the
//        attribute's script-visible array (compat aliasing, D-GEO) — render
//        authority is the host copy

const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
// host: materialBasic(…) → matH

const g = new THREE.BufferGeometry()
// adapter: construct("BufferGeometry")
// host:    geometryCreateEmpty() → geoH — stable from here; no attributes yet (D-GEO)

g.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
// adapter: invokeMethod — lowers the whole typed array as one span
// host:    geometrySetAttribute(geoH, "position", span<f32>, itemSize=3)
//          one bulk copy into the host CPU arrays (D-WASM-MEM); same geoH.
// guest:   attribute.array === vertices stays true (compat aliasing, D-GEO);
//          the host copy is what renders

const m = new THREE.Mesh(g, material)
// adapter: identity(g) → geoH
// host:    meshCreate(geoH, matH) → meshH; retain(geoH), retain(matH)

scene.add(m)
// host: entitySetParent(meshH, sceneH) — membership only

g.attributes.position.setXYZ(0, 2, 3, 4)
// guest:   writes the attribute's array in place — visible to guest reads at
//          once (aliasing); not rendered yet
// adapter: tracks the dirty range; no host call yet
g.attributes.position.needsUpdate = true
// adapter: needsUpdate is the declared flush boundary for tracked writes
// host:    geometryUpdateRange(geoH, "position", first=0, count=1, data)
//          overwrites the CPU range, bumps contentRevision; geoH and meshH unchanged
// render:  next frame sees the changed contentRevision and re-uploads the buffer

const x = g.attributes.position.getX(0)
// guest:   compat read from the attribute's array — no host call (D-GEO
//          aliasing); x === 2
// (parity: geometryReadPositions(geoH, first=0, count=1, out) must yield the
//  same 2 after the flush — host and staging copies converge at needsUpdate)
```

Required effects (no alternatives):

```
geometryCreateEmpty() -> geoH
geometrySetAttribute(geoH, ...)
meshCreate(geoH, matH) -> meshH
entitySetParent(meshH, sceneH)
geometryUpdateRange(geoH, ...)
geometryReadPositions(geoH, ...)   ; parity read-back: host copy yields 2
```

Forbidden: replacement `geoH`, mesh recreation on attribute change, or treating
the guest staging array as render authority (rendering reads host arrays only;
compat aliasing rules in D-GEO).

---

# Worked example — `ranger:core` game with input and audio

Target API for a small game: custom guest classes, action-map input, spatial
audio, and the D-LIFE split on shutdown. Not a claim that every symbol already
exists — this is the contract demos migrate toward (D-MODULES).

```ts
import * as THREE from "ranger:three"
import * as CANNON from "ranger:cannon"

import {
  runtime,
  type Game,
  type FrameInfo,
  type ActionMap,
  type AudioClip,
  type AudioSource,
} from "ranger:core"

/**
 * Guest-only class: no host handle of its own.
 * Composes a Cannon body + Three mesh (two NativeRefs).
 */
class PhysicsVisual {
  constructor(
    readonly body: CANNON.Body,
    readonly mesh: THREE.Mesh,
  ) {}

  syncFromPhysics(): void {
    this.mesh.position.copy(this.body.position)
    // physics: bodyGetPosition(bodyH)
    // host:    meshSetPosition(meshH, …) — live drawable write (D-SYNC)
    this.mesh.quaternion.copy(this.body.quaternion)
    // physics: bodyGetQuaternion → host: meshSetQuaternion
  }

  teleport(x: number, y: number, z: number): void {
    // guest: physics remains authoritative for simulation pose
    this.body.position.set(x, y, z)
    // physics: bodySetPosition(bodyH, x,y,z)
    this.body.velocity.set(0, 0, 0)
    this.body.angularVelocity.set(0, 0, 0)
    // physics: clear residual motion
    this.syncFromPhysics()
    // host: drawable matches within the same frame
  }
}

class BoxGame implements Game {
  private camera!: THREE.PerspectiveCamera
  private scene!: THREE.Scene
  private renderer!: THREE.WebGLRenderer

  private world!: CANNON.World
  private box!: PhysicsVisual

  private controls!: ActionMap

  private collisionClip!: AudioClip
  private collisionSound!: AudioSource

  async init(): Promise<void> {
    const size = runtime.surface.size
    // runtime: realm-scoped surface metrics (not window.innerWidth)

    // --- Three (ranger:three) -------------------------------------------

    this.camera = new THREE.PerspectiveCamera(
      75,
      size.width / size.height,
      0.1,
      100,
    )
    // adapter: construct("PerspectiveCamera", …)
    // host:    cameraCreatePerspective(…) → cameraH

    this.camera.position.set(0, 2, 6)
    // host: cameraSetPosition(cameraH, 0, 2, 6) — script policy (D-SYNC)

    this.scene = new THREE.Scene()
    // host: sceneCreate(realmId) → sceneH

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    // host: rendererCreate({ antialias }) → rendererH
    //       (native: often bind existing gfx_sdl / framebuffer)

    runtime.surface.attachRenderer(this.renderer)
    // runtime: attach rendererH to the runtime-owned surface — no DOM
    this.renderer.setSize(size.width, size.height)
    // host: rendererSetSize(rendererH, w, h)

    const geometry = new THREE.BoxGeometry(2, 2, 2)
    // host: geometryBox(2,2,2) → geoH
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
    })
    // host: materialBasic(…) → matH

    const mesh = new THREE.Mesh(geometry, material)
    // host: meshCreate(geoH, matH) → meshH; retain geo/mat
    this.scene.add(mesh)
    // host: entitySetParent(meshH, sceneH) — membership only

    // --- Cannon (ranger:cannon) -----------------------------------------

    this.world = new CANNON.World()
    // physics: physicsWorldCreate() → worldH

    const body = new CANNON.Body({ mass: 1 })
    // physics: bodyCreate(mass=1) → bodyH  (no world membership yet)
    body.addShape(new CANNON.Box(new CANNON.Vec3(1, 1, 1)))
    // physics: bodyAddBoxShape(bodyH, 1,1,1)
    body.angularDamping = 0.5
    // physics: bodySetAngularDamping(bodyH, 0.5)
    this.world.addBody(body)
    // physics: worldAddBody(worldH, bodyH) — membership only

    this.box = new PhysicsVisual(body, mesh)
    // guest: pure guest object; no new host handle

    // --- Input (ranger:core) — action map, not gamepads[0] --------------

    this.controls = runtime.input.createActionMap({
      rotate: {
        type: "axis1d",
        keyboard: { negative: "ArrowLeft", positive: "ArrowRight" },
        gamepad: { axis: "leftX" },
      },
      jump: {
        type: "button",
        keyboard: ["Space"],
        gamepad: { button: "south" },
      },
      reset: {
        type: "button",
        keyboard: ["KeyR"],
        gamepad: { button: "west" },
      },
    })
    // runtime: actionMapCreate(…) → mapH in this realm
    //          binds logical actions → current player device assignment
    //          (device handle may change; player index does not)

    // --- Audio (ranger:core) — clip ≠ source ≠ voice --------------------

    this.collisionClip = await runtime.assets.loadAudio(
      "audio/box-impact.ogg",
    )
    // runtime/host: assetsLoadAudio → clipH (shared decoded resource)

    this.collisionSound = runtime.audio.createSource(
      this.collisionClip,
      { bus: "sfx", spatial: true, volume: 0.8 },
    )
    // host: audioSourceCreate(clipH, …) → sourceH; retain(clipH)

    this.collisionSound.attachTo(this.box.mesh)
    // host: audioSourceAttachEntity(sourceH, meshH)
    //       spatial pose follows the Three entity on the host

    runtime.audio.listener.attachTo(this.camera)
    // host: audioListenerAttachEntity(listenerH, cameraH)
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height
    // host: cameraSetAspect(cameraH, aspect)
    this.camera.updateProjectionMatrix()
    // host: cameraUpdateProjectionMatrix(cameraH)
    this.renderer.setSize(width, height)
    // host: rendererSetSize(rendererH, w, h)
  }

  update(frame: FrameInfo): void {
    // runtime: host tick calls update — no guest requestAnimationFrame required

    const rotate = this.controls.axis1D("rotate")
    // runtime: read logical action (keyboard and/or assigned gamepad)

    this.box.body.angularVelocity.y += rotate * 12 * frame.delta
    // physics: bodyGet/SetAngularVelocity — simulation authority

    if (this.controls.wasPressed("jump")) {
      this.box.body.applyImpulse(new CANNON.Vec3(0, 5, 0))
      // physics: bodyApplyImpulse(bodyH, …)

      this.collisionSound.playOneShot()
      // host: audioSourcePlayOneShot(sourceH) — mixer-owned voice, auto-
      //       released at completion (D-OWN); does not clone clipH / sourceH

      // player 0 = logical assignment, not gamepads[0]
      runtime.input.player(0)?.rumble({
        lowFrequency: 0.3,
        highFrequency: 0.8,
        durationMs: 120,
      })
      // runtime: haptics on the device(s) currently assigned to player 0
    }

    if (this.controls.wasPressed("reset")) {
      this.box.teleport(0, 3, 0)
    }

    this.world.fixedStep(frame.fixedDelta, frame.delta)
    // physics: zero, one, or several steps; bodyH pose advances

    this.box.syncFromPhysics()
    // host: mesh pose ← body pose (same frame)

    this.renderer.render(this.scene, this.camera)
    // host/render: rendererRender(rendererH, sceneH, cameraH)
  }

  shutdown(): void {
    this.collisionSound.stop()
    // host: audioSourceStop(sourceH) — stop voices; sourceH still valid

    this.collisionSound.release()
    this.collisionClip.release()
    // host: release(sourceH), release(clipH) — object lifetime (D-LIFE)
    //       not the same as disposeBackend

    this.box.mesh.geometry.dispose()
    this.box.mesh.material.dispose()
    // host: geometryDisposeBackend(geoH), materialDisposeBackend(matH)
    //       GPU/backend only; handles remain until release

    this.scene.remove(this.box.mesh)
    // host: entityDetach(meshH) — membership only; does not release meshH
  }
}

runtime.start(new BoxGame())
// runtime: register Game with this realm; host owns the frame loop and
//          calls init → (resize)* → update* → shutdown
```

### What this example adds beyond W.1–W.5

| Concern | Contract |
|---------|----------|
| Imports | `ranger:three` / `ranger:cannon` / `ranger:core` — realm-scoped virtual modules |
| Frame loop | `runtime.start(game)` — host tick; not `requestAnimationFrame` as the native API |
| Surface | `runtime.surface` — no `document.body.appendChild` |
| Input | Action map + logical player; device handle ≠ player index |
| Audio | `clipH` / `sourceH` / `voiceH` distinct; `play()` mints caller-owned voices, `playOneShot()` mixer-owned (D-OWN) |
| Custom class | `PhysicsVisual` stays guest-only |
| Shutdown | `dispose()` = backend; `release()` = object; `remove` = membership |



---

# Worked example — Rust/WASM via `ranger_wasm` (same host objects)

Mirrors the TypeScript `BoxGame` example. Comments marked **`// abi:`** are the
moments the helper (or generated code) crosses the WASM import boundary into the
host. TS and Rust map to the **same** registry commands (D-MODULES, D-REGISTRY).

## R.1 Complete game

```rust
use ranger_wasm::{
    cannon,
    core::{
        ActionMap, FrameInfo, Game, GameContext, GamepadAxis, GamepadButton,
        InitContext, Key, Result, RumbleEffect,
    },
    three,
};

/// Guest-only Rust type: holds NativeRef wrappers, no host handle of its own.
struct PhysicsVisual {
    body: cannon::Body,
    mesh: three::Mesh,
}

impl PhysicsVisual {
    fn new(body: cannon::Body, mesh: three::Mesh) -> Self {
        Self { body, mesh }
    }

    fn sync_from_physics(&self) -> Result<()> {
        let position = self.body.position()?;
        // abi: rg_body_get_position(body_lo, body_hi, out…) → physics arena
        let quaternion = self.body.quaternion()?;
        // abi: rg_body_get_quaternion(…)

        self.mesh.position()?.copy_from(&position)?;
        // abi: rg_entity_set_position(mesh_lo, mesh_hi, x, y, z)
        self.mesh.quaternion()?.copy_from(&quaternion)?;
        // abi: rg_entity_set_quaternion(…)

        Ok(())
    }

    fn teleport(&self, x: f32, y: f32, z: f32) -> Result<()> {
        self.body.set_position(x, y, z)?;
        // abi: rg_body_set_position(…)
        self.body.set_velocity(0.0, 0.0, 0.0)?;
        self.body.set_angular_velocity(0.0, 0.0, 0.0)?;
        // abi: rg_body_set_velocity / rg_body_set_angular_velocity
        self.sync_from_physics()
    }
}

struct BoxGame {
    camera: three::PerspectiveCamera,
    scene: three::Scene,
    renderer: three::WebGlRenderer,
    world: cannon::World,
    cube: PhysicsVisual,
    controls: ActionMap,
    impact_clip: ranger_wasm::core::AudioClip,
    impact_source: ranger_wasm::core::AudioSource,
}

impl Game for BoxGame {
    async fn init(ctx: &mut InitContext) -> Result<Self> {
        let surface_size = ctx.surface().size()?;
        // abi: rg_surface_get_size(out_w, out_h) — runtime-owned surface

        // --- Three --------------------------------------------------------

        let camera = three::PerspectiveCamera::new(
            75.0,
            surface_size.width as f32 / surface_size.height as f32,
            0.1,
            100.0,
        )?;
        // abi: rg_camera_create_perspective(fov, aspect, near, far, out_handle)
        // host: camera arena → cameraH

        camera.position()?.set(0.0, 2.0, 6.0)?;
        // abi: rg_entity_set_position(cameraH, 0, 2, 6)

        let scene = three::Scene::new()?;
        // abi: rg_scene_create(out_handle)

        let renderer = three::WebGlRenderer::new(
            three::RendererOptions { antialias: true, ..Default::default() },
        )?;
        // abi: rg_renderer_create(flags, out_handle)

        // Native Ranger: no browser DOM.
        ctx.surface().attach_renderer(&renderer)?;
        // abi: rg_surface_attach_renderer(renderer_lo, renderer_hi)

        renderer.set_size(surface_size.width, surface_size.height)?;
        // abi: rg_renderer_set_size(…)

        let geometry = three::BoxGeometry::new(2.0, 2.0, 2.0)?;
        // abi: rg_geometry_box(2,2,2, out_geoH)
        let material = three::MeshBasicMaterial::new(
            three::MeshBasicMaterialOptions {
                color: 0xff0000,
                wireframe: true,
                ..Default::default()
            },
        )?;
        // abi: rg_material_basic(color, flags, out_matH)

        let mesh = three::Mesh::new(&geometry, &material)?;
        // abi: rg_mesh_create(geo_lo, geo_hi, mat_lo, mat_hi, out_meshH)
        // host: retain(geoH), retain(matH)

        scene.add(&mesh)?;
        // abi: rg_entity_set_parent(meshH, sceneH) — membership only

        // Host retains geo/mat via the mesh; dropping temporary wrappers is safe.
        drop(geometry);
        drop(material);
        // abi (on Drop): rg_handle_release for each OwnedHandle
        // host: refcount--; object stays alive while mesh retains it

        // --- Cannon -------------------------------------------------------

        let world = cannon::World::new()?;
        // abi: rg_physics_world_create(out_worldH)

        let shape = cannon::BoxShape::new(cannon::Vec3::new(1.0, 1.0, 1.0))?;
        // guest: shape descriptor; may be host-backed or value data per registry

        let body = cannon::Body::new(cannon::BodyOptions {
            mass: 1.0,
            ..Default::default()
        })?;
        // abi: rg_body_create(mass, out_bodyH) — no world membership yet

        body.add_shape(&shape)?;
        // abi: rg_body_add_box_shape(bodyH, 1,1,1)
        body.set_angular_damping(0.5)?;
        // abi: rg_body_set_angular_damping(bodyH, 0.5)
        world.add_body(&body)?;
        // abi: rg_world_add_body(worldH, bodyH) — membership only

        let cube = PhysicsVisual::new(body, mesh);
        // guest: no abi — pure Rust struct

        // --- Input --------------------------------------------------------

        let controls = ctx.input().create_action_map(
            ActionMap::builder()
                .axis_1d("rotate")
                    .keyboard(Key::ArrowLeft, Key::ArrowRight)
                    .gamepad_axis(GamepadAxis::LeftStickX)
                    .dead_zone(0.15)
                    .finish()
                .button("jump")
                    .key(Key::Space)
                    .gamepad_button(GamepadButton::South)
                    .finish()
                .button("reset")
                    .key(Key::KeyR)
                    .gamepad_button(GamepadButton::West)
                    .finish()
                .build(),
        )?;
        // abi: rg_input_action_map_create(desc_ptr, desc_len, out_mapH)
        //      (descriptor bytes / string table lowered per D-WASM-MEM)

        // --- Audio --------------------------------------------------------

        let impact_clip = ctx.assets().load_audio("audio/box-impact.ogg").await?;
        // abi: rg_assets_load_audio_begin(path_ptr, path_len, out_job)
        // abi: rg_assets_load_audio_poll(job) → clipH when ready
        // host: shared decoded resource

        let impact_source = ctx.audio().create_source(
            &impact_clip,
            ranger_wasm::core::AudioSourceOptions {
                bus: "sfx".into(),
                spatial: true,
                volume: 0.8,
                ..Default::default()
            },
        )?;
        // abi: rg_audio_source_create(clipH, opts…, out_sourceH)
        // host: retain(clipH)

        impact_source.attach_to_entity(&cube.mesh)?;
        // abi: rg_audio_source_attach_entity(sourceH, meshH)
        // host: AudioSource → Three entity relation stays on the host

        ctx.audio().listener().attach_to_entity(&camera)?;
        // abi: rg_audio_listener_attach_entity(listenerH, cameraH)

        Ok(Self {
            camera, scene, renderer, world, cube, controls,
            impact_clip, impact_source,
        })
    }

    fn update(
        &mut self,
        ctx: &mut GameContext,
        frame: FrameInfo,
    ) -> Result<()> {
        // host: ranger_game_update export called from the frame tick — no rAF

        let rotate = self.controls.axis_1d("rotate")?;
        // abi: rg_action_map_axis1d(mapH, name_ptr, name_len, out_f32)

        let current = self.cube.body.angular_velocity()?;
        // abi: rg_body_get_angular_velocity(…)
        self.cube.body.set_angular_velocity(
            current.x,
            current.y + rotate * 12.0 * frame.delta_seconds,
            current.z,
        )?;
        // abi: rg_body_set_angular_velocity(…)

        if self.controls.was_pressed("jump")? {
            // abi: rg_action_map_was_pressed(mapH, "jump")
            self.cube.body.apply_impulse(cannon::Vec3::new(0.0, 5.0, 0.0))?;
            // abi: rg_body_apply_impulse(…)

            self.impact_source.play_one_shot()?;
            // abi: rg_audio_source_play_one_shot(sourceH)
            // host: mixer-owned voice, auto-released at completion (D-OWN);
            //       does not clone clipH / sourceH

            if let Some(player) = ctx.input().player(0)? {
                // abi: rg_input_player(player_index, out_playerH) — logical player
                player.rumble(RumbleEffect {
                    low_frequency: 0.3,
                    high_frequency: 0.8,
                    duration_ms: 120,
                })?;
                // abi: rg_player_rumble(playerH, lo, hi, ms)
            }
        }

        if self.controls.was_pressed("reset")? {
            self.cube.teleport(0.0, 3.0, 0.0)?;
        }

        self.world.fixed_step(
            frame.fixed_delta_seconds,
            frame.delta_seconds,
        )?;
        // abi: rg_physics_world_fixed_step(worldH, fixed_dt, frame_dt)

        self.cube.sync_from_physics()?;
        // abi: body get + entity set (see sync_from_physics)

        self.renderer.render(&self.scene, &self.camera)?;
        // abi: rg_renderer_render(rendererH, sceneH, cameraH)

        Ok(())
    }

    fn resize(
        &mut self,
        _ctx: &mut GameContext,
        width: u32,
        height: u32,
    ) -> Result<()> {
        if height == 0 {
            return Ok(());
        }
        self.camera.set_aspect(width as f32 / height as f32)?;
        // abi: rg_camera_set_aspect(cameraH, aspect)
        self.camera.update_projection_matrix()?;
        // abi: rg_camera_update_projection_matrix(cameraH)
        self.renderer.set_size(width, height)?;
        // abi: rg_renderer_set_size(…)
        Ok(())
    }

    fn shutdown(&mut self, _ctx: &mut GameContext) -> Result<()> {
        self.impact_source.stop()?;
        // abi: rg_audio_source_stop(sourceH) — stops this source's voices;
        //      sourceH stays valid (same command as the TS path's stop())

        self.scene.remove(&self.cube.mesh)?;
        // abi: rg_entity_detach(meshH) / rg_entity_set_parent(meshH, 0)
        //      membership only — not release

        self.cube.mesh.geometry()?.dispose_backend()?;
        self.cube.mesh.material()?.dispose_backend()?;
        // abi: rg_geometry_dispose_backend(geoH)
        // abi: rg_material_dispose_backend(matH)
        // host: GPU/backend only; handles remain (D-LIFE)

        Ok(())
        // Drop of Self later → abi: rg_handle_release for each OwnedHandle field
    }
}

// Generates exported WASM lifecycle entry points:
//   ranger_game_create / ranger_game_init_poll / ranger_game_update /
//   ranger_game_resize / ranger_game_shutdown
ranger_wasm::export_game!(BoxGame);
// abi: host links these exports; frame tick → ranger_game_update(game, frameInfo)
```

### Game loop mapping

```text
Host frame tick
    ↓
ranger_game_update(game, frameInfo)          // abi export
    ↓
BoxGame::update(...)
```

```rust
pub trait Game: Sized {
    async fn init(ctx: &mut InitContext) -> Result<Self>;
    fn update(&mut self, ctx: &mut GameContext, frame: FrameInfo) -> Result<()>;
    fn resize(&mut self, ctx: &mut GameContext, width: u32, height: u32) -> Result<()>;
    fn shutdown(&mut self, ctx: &mut GameContext) -> Result<()>;
}
```

New Rust games use this host-driven `Game` interface. A
`request_animation_frame` compatibility shim may exist for ported browser code,
but it is not the native Ranger path.

## R.2 Gamepad — action map, raw devices, rumble

```rust
fn update_player(controls: &ActionMap, body: &cannon::Body) -> Result<()> {
    let horizontal = controls.axis_1d("move_x")?;
    let vertical = controls.axis_1d("move_y")?;
    // abi: rg_action_map_axis1d(mapH, name…) for each

    body.apply_force(cannon::Vec3::new(horizontal * 20.0, 0.0, vertical * 20.0))?;
    // abi: rg_body_apply_force(bodyH, fx, fy, fz)

    if controls.was_pressed("jump")? {
        // abi: rg_action_map_was_pressed(mapH, "jump")
        body.apply_impulse(cannon::Vec3::new(0.0, 5.0, 0.0))?;
        // abi: rg_body_apply_impulse(…)
    }
    Ok(())
}

fn log_connected_gamepads(ctx: &GameContext) -> Result<()> {
    for gamepad in ctx.input().gamepads()? {
        // abi: rg_input_gamepads_iter / rg_gamepad_get_* per device handle
        //      device handle is generation-tagged — not array index identity
        ctx.log().info(&format!(
            "Gamepad: name={}, connected={}, buttons={}, axes={}",
            gamepad.name()?,
            gamepad.is_connected()?,
            gamepad.button_count()?,
            gamepad.axis_count()?,
        ))?;
        // abi: rg_log_info(ptr, len) — string bytes in guest memory (D-WASM-MEM)
    }
    Ok(())
}

fn inspect_first_gamepad(ctx: &GameContext) -> Result<()> {
    let Some(gamepad) = ctx.input().gamepads()?.next() else {
        return Ok(());
    };
    let left_x = gamepad.axis(GamepadAxis::LeftStickX)?;
    // abi: rg_gamepad_axis(padH, axis_id, out_f32)
    let jump = gamepad.button(GamepadButton::South)?;
    // abi: rg_gamepad_button(padH, button_id, out_state)
    if jump.was_pressed {
        ctx.log().info("South button pressed")?;
    }
    Ok(())
}

// Rumble on logical player 0 (survives device reconnect):
if let Some(player) = ctx.input().player(0)? {
    // abi: rg_input_player(0, out_playerH)
    player.rumble(RumbleEffect {
        low_frequency: 0.2,
        high_frequency: 1.0,
        duration_ms: 180,
    })?;
    // abi: rg_player_rumble(playerH, …)
}
```

## R.3 Audio — clip / source / voice

```rust
// Non-spatial UI blip
let clip = ctx.assets().load_audio("audio/menu-confirm.ogg").await?;
// abi: rg_assets_load_audio_* → clipH

let source = ctx.audio().create_source(
    &clip,
    ranger_wasm::core::AudioSourceOptions {
        bus: "ui".into(),
        spatial: false,
        volume: 0.7,
        ..Default::default()
    },
)?;
// abi: rg_audio_source_create(clipH, …) → sourceH

let voice = source.play()?;
// abi: rg_audio_source_play(sourceH) → voiceH  (playback instance)
voice.set_pitch(1.05)?;
// abi: rg_audio_voice_set_pitch(voiceH, 1.05)

// Spatial engine loop attached to a mesh — relation stays on the host
let engine_source = ctx.audio().create_source(
    &engine_clip,
    ranger_wasm::core::AudioSourceOptions {
        spatial: true,
        looping: true,
        bus: "vehicles".into(),
        volume: 0.6,
        ..Default::default()
    },
)?;
// abi: rg_audio_source_create(…)
engine_source.attach_to_entity(&vehicle_mesh)?;
// abi: rg_audio_source_attach_entity(sourceH, meshH)
let engine_voice = engine_source.play()?;
// abi: rg_audio_source_play → voiceH

let speed = vehicle_body.velocity()?.length();
// abi: rg_body_get_velocity(…)
engine_voice.set_pitch(0.8 + speed * 0.015)?;
// abi: rg_audio_voice_set_pitch
engine_source.set_volume((0.3 + speed * 0.02).min(1.0))?;
// abi: rg_audio_source_set_volume

ctx.audio().listener().attach_to_entity(&camera)?;
// abi: rg_audio_listener_attach_entity(listenerH, cameraH)
// host: no per-frame guest copy of camera transform required
```

Identities: `clipH` (shared resource) ≠ `sourceH` (emitter) ≠ `voiceH` (playback).
Ownership (D-OWN): `play()` voices are caller-owned — `Drop` releases them;
`play_one_shot()` voices are mixer-owned and auto-released at completion.

## R.4 Surface, assets, logging, platform

```rust
let size = ctx.surface().size()?;
// abi: rg_surface_get_size
renderer.set_size(size.width, size.height)?;
// abi: rg_renderer_set_size
ctx.surface().set_title("Ranger WASM game")?;
// abi: rg_surface_set_title(ptr, len)
ctx.surface().set_cursor_mode(ranger_wasm::core::CursorMode::Captured)?;
// abi: rg_surface_set_cursor_mode(mode)

// Not allowed — surface is runtime-owned:
// let surface = Surface::new();

let texture = ctx.assets().load_texture("textures/crate.png").await?;
// abi: rg_assets_load_texture_* → textureH
let bytes = ctx.assets().load_bytes("levels/level-01.bin").await?;
// abi: rg_assets_load_bytes_* → guest buffer (helper frees on Drop; D-WASM-MEM)

ctx.log().info("Game initialized")?;
// abi: rg_log_info(ptr, len)
let capabilities = ctx.platform().capabilities()?;
// abi: rg_platform_capabilities(out_flags)
```

## R.5 Handles, generated wrappers, and raw ABI

Public Rust API uses typed `OwnedHandle<T>` (fat two-`u32` / D-HANDLE) — not raw
array indices. `Clone` → retain, `Drop` → release:

```rust
// Conceptual helper (generated / in ranger_wasm):
impl<T> Clone for OwnedHandle<T> {
    fn clone(&self) -> Self {
        // abi: rg_handle_retain(low, high)
        …
    }
}
impl<T> Drop for OwnedHandle<T> {
    fn drop(&mut self) {
        // abi: rg_handle_release(low, high)
    }
}
```

Host still checks realm / slot / generation / type / ownership on every call.
Rust types are an extra guest-side guard; malicious WASM can bypass the helper,
so the host must not trust static types alone.

Example generated Three wrapper call:

```rust
impl Mesh {
    pub fn new<G, M>(geometry: &G, material: &M) -> Result<Self> { … }
    // abi: rg_mesh_create(geo_lo, geo_hi, mat_lo, mat_hi, out_lo, out_hi) -> status
}
```

Raw import shape (two `i32`/`u32` words per logical handle — D-HANDLE, D-WASM):

```rust
#[link(wasm_import_module = "ranger")]
unsafe extern "C" {
    fn rg_mesh_create(
        geometry_low: u32, geometry_high: u32,
        material_low: u32, material_high: u32,
        result_low: *mut u32, result_high: *mut u32,
    ) -> i32;

    fn rg_entity_set_position(
        entity_low: u32, entity_high: u32,
        x: f32, y: f32, z: f32,
    ) -> i32;

    fn rg_entity_set_parent(
        child_low: u32, child_high: u32,
        parent_low: u32, parent_high: u32,
    ) -> i32;
}
// Every non-zero status → ranger_wasm::Error::from_code (no silent success)
```

## R.6 Bulk geometry from Rust (stable `geoH`)

```rust
let positions: Vec<f32> = vec![
    -1.0, -1.0, 0.0,  1.0, -1.0, 0.0,  0.0, 1.0, 0.0,
];
let indices: Vec<u32> = vec![0, 1, 2];

let geometry = three::BufferGeometry::new()?;
// abi: rg_geometry_create_empty(out_geoH)

geometry.set_attribute_f32("position", &positions, 3)?;
// abi: rg_geometry_set_attribute_f32(
//        geoH, name_ptr, name_len, data_ptr, element_count, item_size)
//      host bounds-checks ptr+len (D-WASM-MEM); same geoH

geometry.set_index_u32(&indices)?;
// abi: rg_geometry_set_index_u32(geoH, data_ptr, count)

geometry.update_attribute_range_f32("position", 0, &[-2.0, -1.0, 0.0])?;
// abi: rg_geometry_update_attribute_range_f32(geoH, …) — same geoH; the host
//      overwrites the CPU range and bumps contentRevision (D-GEO).
//      No separate needsUpdate call here: on the compiled path each update
//      crosses the boundary directly. The interpreted path's `needsUpdate`
//      is only the flush boundary for wrapper-buffered writes.
```

## R.7 `dispose_backend` versus Rust `Drop`

```rust
geometry.dispose_backend()?;
// abi: rg_geometry_dispose_backend(geoH) — GPU/backend only (D-LIFE)

mesh.set_geometry(&geometry)?;
// abi: rg_mesh_set_geometry(meshH, geoH) — still valid after dispose_backend
renderer.render(&scene, &camera)?;
// abi: rg_renderer_render — may recreate GPU buffer from CPU arrays

drop(geometry);
// abi: rg_handle_release(geoH)
// host: object remains if mesh (or another wrapper) still retains it
```

Realm teardown is the final safety net for handles left after traps, panics, or
abandoned futures.

## R.8 Guest-only vs registry-native classes

Most gameplay types stay ordinary Rust structs (`PlayerController`,
`PhysicsVisual`) — fields hold handles; the struct itself has **no** host
handle and generates **no** abi construct.

A class is host-backed only when Ranger must own state (example registry sketch):

```yaml
class: ParticleEmitter
module: ranger:core   # → ranger_wasm::core
arena: particle_emitter
lifetime: refcounted
construct:
  command: particleEmitterCreate
methods:
  attach_to: { command: particleEmitterAttachEntity, … }
  burst: { command: particleEmitterBurst, … }
```

```rust
let emitter = ranger_wasm::core::ParticleEmitter::new(2_000)?;
// abi: rg_particle_emitter_create(max, out_handle)
emitter.set_emission_rate(40.0)?;
// abi: rg_particle_emitter_set_emission_rate
emitter.attach_to(&mesh)?;
// abi: rg_particle_emitter_attach_entity(emitterH, meshH)
emitter.burst(100)?;
// abi: rg_particle_emitter_burst(emitterH, 100)
```

---

# Worked example — `ranger:2d` sprite game (TS + Rust)

Same registry commands on both guests (D-2D, D-MODULES). Retained `Sprite2D`
identity; atlas via `runtime.assets`; physics body remains a separate handle.
Comments use the actor prefixes from **Components and actors**.

## TypeScript

```ts
import { runtime, type Game, type FrameInfo } from "ranger:core"
import * as TWO from "ranger:2d"
import * as PHYSICS from "ranger:cannon"

class SpriteGame implements Game {
  private scene!: TWO.Scene2D
  private camera!: TWO.Camera2D
  private renderer!: TWO.Renderer2D

  private player!: TWO.Sprite2D
  private animation!: TWO.AnimationPlayer2D

  private world!: PHYSICS.World
  private body!: PHYSICS.Body

  async init() {
    // guest:  construct retained 2D graph
    // host:   scene2dCreate / camera2dCreate / renderer2dCreate → handles
    this.scene = new TWO.Scene2D()
    this.camera = new TWO.Camera2D()
    this.renderer = new TWO.Renderer2D()

    // runtime: surface owns the OS window / canvas
    runtime.surface.attachRenderer(this.renderer)

    // runtime: assetsLoadSpriteAtlas (D-ASYNC) → atlasH + textureH
    const atlas = await runtime.assets.loadSpriteAtlas(
      "characters/player.atlas.json",
    )

    // host: sprite2dCreate(region…) → spriteH (stable identity — D-2D)
    this.player = new TWO.Sprite2D(atlas.region("walk-down-0"))
    this.player.anchor.set(0.5, 1.0)
    // host: layer/scene membership only — not release (D-LIFE)
    this.scene.add(this.player)

    const walk = atlas.animation("walk-down")
    // host: animationPlayerCreate(spriteH) → playerH; play(clipH, …)
    this.animation = new TWO.AnimationPlayer2D(this.player)
    this.animation.play(walk, { loop: true, framesPerSecond: 9 })

    this.world = new PHYSICS.World()
    this.body = new PHYSICS.Body({ mass: 1 })
    this.world.addBody(this.body)
    // note: bodyH ≠ spriteH — guest sync below (or PoseBinding2D)
  }

  update(frame: FrameInfo) {
    this.world.fixedStep(frame.fixedDelta, frame.delta)

    const position = this.body.position
    // adapter: hybrid position commit (D-ADAPTER) → spriteSetPosition
    this.player.position.set(position.x, position.y)

    // render: reads host 2D state; not a sync boundary (D-SYNC)
    this.renderer.render(this.scene, this.camera)
  }
}

runtime.start(new SpriteGame())
```

Immediate-mode (no handle) for debug/effects — same module, different API:

```ts
// guest: frame-local only — host must not mint spriteH / shapeH
renderer2d.drawSprite({
  texture,
  position: [120, 80],
  source: [0, 0, 32, 32],
})
renderer2d.drawRect({
  x: 10, y: 10, width: 100, height: 8, color: 0xff0000ff,
})
```

## Rust / WASM

```rust
use ranger_wasm::{
    cannon,
    core::{FrameInfo, Game, GameContext, InitContext, Result},
    two_d,
};

struct SpriteGame {
    scene: two_d::Scene2D,
    camera: two_d::Camera2D,
    renderer: two_d::Renderer2D,
    player: two_d::Sprite2D,
    animation: two_d::AnimationPlayer2D,
    world: cannon::World,
    body: cannon::Body,
}

impl Game for SpriteGame {
    async fn init(ctx: &mut InitContext) -> Result<Self> {
        let scene = two_d::Scene2D::new()?;
        let camera = two_d::Camera2D::new()?;
        let renderer = two_d::Renderer2D::new()?;
        // abi: rg_surface_attach_renderer(…)
        ctx.surface().attach_renderer(&renderer)?;

        // abi: rg_assets_load_sprite_atlas_begin/poll → atlasH
        let atlas = ctx
            .assets()
            .load_sprite_atlas("characters/player.atlas.json")
            .await?;

        // abi: rg_sprite2d_create(region…) → spriteH
        let player = two_d::Sprite2D::new(&atlas.region("walk-down-0")?)?;
        player.anchor()?.set(0.5, 1.0)?;
        // abi: rg_scene2d_add(sceneH, spriteH) — membership
        scene.add(&player)?;

        let walk = atlas.animation("walk-down")?;
        let animation = two_d::AnimationPlayer2D::new(&player)?;
        animation.play(
            &walk,
            two_d::PlayOptions {
                looping: true,
                frames_per_second: 9.0,
            },
        )?;

        let world = cannon::World::new()?;
        let body = cannon::Body::new(cannon::BodyOptions {
            mass: 1.0,
            ..Default::default()
        })?;
        world.add_body(&body)?;

        Ok(Self {
            scene,
            camera,
            renderer,
            player,
            animation,
            world,
            body,
        })
    }

    fn update(
        &mut self,
        _ctx: &mut GameContext,
        frame: FrameInfo,
    ) -> Result<()> {
        self.world.fixed_step(
            frame.fixed_delta_seconds,
            frame.delta_seconds,
        )?;

        let position = self.body.position()?;
        // abi: rg_sprite2d_set_position(spriteH, x, y)
        self.player.position()?.set(position.x, position.y)?;

        // abi: rg_renderer2d_render(rendererH, sceneH, cameraH)
        self.renderer.render(&self.scene, &self.camera)?;
        Ok(())
    }
}

ranger_wasm::export_game!(SpriteGame);
```

### Forbids (2D regression checklist)

| Anti-pattern | Why |
|--------------|-----|
| Sprite identity = RGSP1 slot index | Reorder/reconnect breaks games (D-2D, D-HANDLE) |
| `layer.remove(sprite)` releases atlas | Shared resources + revive break (D-LIFE, D-OWN) |
| Atlas only via runner manifest | Bypasses `runtime.assets` / D-ASYNC |
| Separate Camera2D math per backend | Pointer/culling diverge (D-2D) |
| `DrawList2D` minting persistent handles | Leaks / false identity |
| Body handle reused as sprite handle | Typed arenas (D-TYPE) |

---

# Implementation gates

**Required order** (matches the phase dependency graph in
[`CODE_CLEANUP_PLAN.md`](./CODE_CLEANUP_PLAN.md) — adapter work sits *on*
registry commands and typed arenas, not before them):

1. Interpreter identity and JS semantics (D-IDENTITY) — `===`, Map/Set keys,
   missing → `undefined`.
2. Registry schema plus typed handles/arenas (D-REGISTRY, D-TYPE, D-HANDLE) —
   including published-id immutability / tombstones.
3. Adapter / property semantics over those commands (D-ADAPTER, D-PROP) —
   including hybrid invariants (cached wrapper identity, dual revisions,
   turn-start refresh, guest-wins).
4. Ownership, lifetime, and geometry (D-SYNC, D-LIFE, D-OWN, D-GEO).
5. WASM surface and parity (D-WASM, D-WASM-MEM, D-ASYNC) — create/free,
   retain/release, span bounds, `async_poll`.
6. Interpreter module-namespace isolation (D-MODULES prerequisite — today
   imports share one scope, `docs/TSX_ENGINE_ISSUES.md` #5/#9).
7. Virtual modules + runtime capability root (D-MODULES): `ranger:core` /
   `ranger:2d` / `ranger:three` / `ranger:cannon`, and
   `ranger_wasm::{core,two_d,three,cannon}` — same registry commands.
   Includes headless `runtime.assets` / `runtime.time` fakes (needed before
   D-2D atlas/animation gates).
8. **D-2D** retained 2D + atlas + Camera2D + AnimationPlayer2D + DrawList2D
   (gates D-2D-1 … D-2D-10 in [`CODE_CLEANUP_PLAN.md`](./CODE_CLEANUP_PLAN.md)).
9. Migrate demos (2D **and** 3D) to live objects + `runtime.start(Game)` /
   `ranger_wasm::export_game!` (D-SYNC, D-MODULES, D-2D).
10. Delete structural reconciliation (`RETIRE-RECONCILE`) and retired sprite
    slot/manifest paths **under v2** after D-2D parity — **not** v1
    `scripting/game_sprite` / runners while top-level games remain supported
    (**runnable legacy** until an explicit end-of-v1 / **archival legacy**
    milestone — see CODE_CLEANUP_PLAN).

**Required test gates:**

- JavaScript reference and property semantics (`===`, Map/Set keys, missing →
  `undefined`, expandos vs native props).
- Same script object → same host handle.
- Shared geometry/material identity (two meshes, one `geoH` / `matH`).
- Scene removal ≠ release.
- `DisposeBackend` ≠ release.
- Stale and cross-realm handle rejection (including cross-realm `runtime` /
  gamepad / audio access).
- Generated-surface parity (host / native bridge / WASM / wrappers /
  `ranger:*` TypeScript declarations).
- Existing WASM import signature compatibility (D-WASM).
- Reordering and reparenting never change identity.
- Geometry upload → update → read-back on one `geoH` (worked example 2).
- Action-map input survives gamepad reconnect under a new device handle
  (same logical player).
- `AudioSource.play()` twice → two voices, one `clipH` / `sourceH`;
  `playOneShot()` voices are mixer-owned and auto-released at completion.
- Guest-only class (`PhysicsVisual`) never appears in a host arena.
- TS and Rust `BoxGame` paths issue the same registry commands (surface parity).
- Fat-handle retain/release on Rust `Clone`/`Drop` matches host refcounts.
- `dispose_backend` then render still works; `Drop` of a shared `geoH` wrapper
  does not free while a mesh retains it.
- Bulk `set_attribute_f32` rejects OOB ptr/len (D-WASM-MEM) without trapping.
- Ownership table conformance (D-OWN): getter-returned handles are borrowed
  (no refcount change); a second release through one wrapper is a typed
  error; realm teardown releases everything the realm still owns.
- Weak attachment (D-OWN): destroying an entity auto-detaches attached
  sources/emitters; an attachment never keeps its target alive.
- Compat aliasing (D-GEO): `attribute.array === data` after `setAttribute`;
  a guest write without `needsUpdate` does not render; host range equals the
  staging range after each flush.
- Hybrid identity (D-ADAPTER): `mesh.position === mesh.position`; a retained
  mirror does not observe host writes mid-turn and refreshes next turn.
- Module isolation (D-MODULES): colliding helper names across two imports do
  not clobber; repeated import returns the same namespace object; two realms
  get distinct `runtime` roots.
- Async (D-ASYNC): exactly-once result transfer under repeated polls;
  completions delivered only at frame boundaries; teardown with outstanding
  requests releases both request and result.
- Registry ids (D-REGISTRY): changing a published id's meaning fails codegen;
  removed ids stay tombstoned.
- **D-2D:** same `Sprite2D` retains the same handle after reorder/reparent;
  two sprites share one atlas/texture handle; releasing one sprite does not
  release the shared atlas; layer remove ≠ release; software and GPU
  `Camera2D` transforms agree; TS and Rust resolve the same atlas region;
  animation frame at a given `runtime.time` matches across guests; immediate
  `DrawList2D` commands mint no persistent handles; `PoseBinding2D` rejects
  stale body/sprite handles; atlas/resource counts stay stable across hot
  reload.
- **Split-screen:** two panes cover the surface without overlap gaps; render
  to pane A does not draw into pane B; SW and GPU scissor/viewport agree.
- **Vocal / music facades:** `runtime.audio.vocal` / `.music` exist and obey
  clip/source/voice ownership (no parallel leak universe).
- **v1 freeze:** after any D-2D-10 / Phase 12 cleanup, top-level chess and
  ylos2 still launch on the v1 runtime paths.

A migration is complete only when its replaced path is removed in the same
change, or is covered by an explicitly tracked retirement item
(e.g. `RETIRE-RECONCILE`, D-2D-10 **v2-scoped**). **Parity is tested across
generated surfaces rather than promised.** v1 remains playable until an
explicit end-of-v1 milestone.

