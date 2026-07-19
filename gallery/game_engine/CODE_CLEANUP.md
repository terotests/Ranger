# CODE_CLEANUP — binding architecture decisions

Implementation contract for the game-engine cleanup. Older inventories and
exploratory chapters were moved to [`CODE_CLEANUP_OLD.md`](./CODE_CLEANUP_OLD.md).

Related: [`docs/ADR-0001-three-scene-host-authority.md`](./docs/ADR-0001-three-scene-host-authority.md).

---

# Architecture decisions (binding — from design review)

These are the binding choices for implementation. Exploratory inventory that used
to surround them is in [`CODE_CLEANUP_OLD.md`](./CODE_CLEANUP_OLD.md).

## D-SYNC — Live host-backed objects; reconciler is temporary

**Conflict that was in an earlier draft:** III.3 described an identity-based
reconciler (snapshot: TSX graph → reconcile → host), while V.2 described
`Object3D` as live host-backed natives (each `new` / property write / method
hits the host immediately). Both cannot be the final model:

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
| `mesh.position.set(...)` / assign | `entityTransform(meshH, …)` now (or an explicitly documented per-frame batch flush — never a second create) |
| `scene.remove(mesh)` | detach membership only — does **not** release the object handle (see D-LIFE) |

Target stack:

```
EvalValue NativeRef
        │
        ▼
stable host handle  (+ realmId)
        │
        ▼
typed registry slot / typed arena  (D-TYPE)
        │
        ▼
canonical Ranger object
```

**Reconciler status:** `three_tsx_bridge.rgr` remains a **temporary compatibility
adapter** for demos that still build a façade scene tree and call `reconcile()`.
It must not be described as the final architecture.

**Deletion milestone for the structural reconciler:** when the live adapter
covers Mesh / Group / Scene / Light / Camera construct + parent + transform +
shared geo/mat, and teapot + sponza + cube demos no longer call
`ThreeTsxBridge.reconcile` (or equivalent), delete the index/DFS reconcile path
and the Sponza typed accessors (`sunLight` / `skyNode` / `modelNode`). Track as
issue/checklist item `RETIRE-RECONCILE`.

Hot value types (`Vector3`, etc.) may keep a **local mirror** (V.3); sync
boundaries must be explicit (`mesh.position = v`, host-dependent method, or
documented dirty commit) — not a silent second authority.

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

Legal after dispose-backend:

```js
geometry.dispose();              // → geometryDisposeBackend(geoH)
mesh.geometry = geometry;        // same geoH, still valid
renderer.render(scene, camera);  // may recreate GPU buffer from CPU arrays
```

The façade already has empty `dispose()` stubs — wiring them to handle
destruction would be a **semantic regression**, not filling a stub.

**Most important split:** object identity ≠ scene membership ≠ GPU resource
lifetime. Separate commands and separate tests for each.

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

**Allowed versioning models (pick per surface, document in registry metadata):**

1. **Versioned imports:** `materialCreateV1(color)`, `materialCreateV2(color, opacity)`.
2. **Stable generic ABI:** `invoke(methodId, argPtr, argCount, resultPtr)` with
   host-side defaults for missing args.
3. **Freeze the original import forever** and supply new defaults only inside
   that host stub; new parameters require a new export name.

The class registry must label each method with its **binary WASM lowering**
separately from the **source-level** TS/Rust API.

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
```

Handle stays stable when: geometry already attached to meshes; attributes added
one at a time; two meshes share the geometry; an attribute is replaced; index
data is added after positions. Convenience "create with all attributes at once"
may exist as sugar that still returns the empty-created handle after filling.

---

