# CODE_CLEANUP — binding architecture decisions

Implementation contract for the game-engine cleanup.

| Section | Contents |
|---------|----------|
| **Binding decisions** | D-IDENTITY … D-GEO (below) |
| **Worked examples** | Camera + physics pose; geometry upload / update / read-back |
| **Implementation gates** | Required order and tests before calling a migration done |

Archived inventory and exploratory drafts:
[`CODE_CLEANUP_OLD.md`](./CODE_CLEANUP_OLD.md).

Related: [`docs/ADR-0001-three-scene-host-authority.md`](./docs/ADR-0001-three-scene-host-authority.md),
[`docs/WASM_MEMORY_ABI.md`](./docs/WASM_MEMORY_ABI.md).

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
adapter** for demos that still build a façade scene tree and call `reconcile()`.
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

## D-PROP — Native properties and dynamic overlay

Host-backed objects expose **two** property stores:

1. **Native properties** declared in the class registry (`position`, `geometry`,
   `material`, `visible`, …).
2. **Guest-side dynamic overlay** for expandos and `userData`.

Semantics:

```js
mesh.nonexistent       // undefined
mesh.nonexistent()     // TypeError-like: not a function
mesh.customValue = 123 // allowed expando → dynamic overlay
mesh.userData.flags = 1
mesh.position.z = 5    // native prop → residency / sync rules (D-ADAPTER)
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
- sync or async behavior (loaders)
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

**Two rules for vertex data:**

1. **One authoritative copy** — coordinates live only in the host geometry
   arrays. Guests hold handles or temporary read-back buffers.
2. **Bulk crossings** — N vertices cross the WASM boundary in one call (ptr+len
   / `span`), never one call per float (D-WASM-MEM).

Handle stays stable when: geometry already attached to meshes; attributes added
one at a time; two meshes share the geometry; an attribute is replaced; index
data is added after positions. Convenience "create with all attributes at once"
may exist as sugar that still returns the empty-created handle after filling.

Read-back uses the **same** `geoH`:

```
geometryReadPositions(geoH, first, count, outSpan) -> n
```

---

# Worked example — camera position and physics-driven mesh position

**Target design.** This chapter walks a familiar Three.js + cannon.js demo under
the live-object model (D-SYNC), with typed-arena handles (D-TYPE) and the
three lifetimes (D-LIFE). It is not how the engine works today.

The demo matters because game logic almost always does two things scripts own:

1. **Drive the camera** (`camera.position…`, aspect on resize).
2. **Observe or move object / player positions** (here: copy cannon → mesh each
   frame; the same path is “read player pose” or “teleport player”).

Full guest script (reference). `// bg:` comments state the **host / background**
effect under the target architecture (D-SYNC). Sections below quote lines again
as they are explained.

```js
// three.js variables — guest bindings; become NativeRefs to host handles after init
let camera, scene, renderer
let mesh

// cannon.js variables — separate physics handles (not Three mesh ids)
let world
let body

initThree()   // create cameraH / sceneH / rendererH / meshH (live)
initCannon()  // create worldH / bodyH (physics arena)
animate()     // each frame: step body → copy pose to mesh → render

function initThree() {
  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100)
  // bg: cameraCreatePerspective(fov, aspect, near, far, realmId) → cameraH
  //     EvalValue { NativeRef cameraH, identityId }; slot in camera arena

  camera.position.z = 5
  // bg: cameraSetPosition(cameraH, 0, 0, 5) — live host write, same cameraH
  //     (hybrid: optional guest Vector3 mirror, then sync boundary on assign)

  // Scene
  scene = new THREE.Scene()
  // bg: sceneCreate(realmId) → sceneH in scene arena; no meshes yet

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  // bg: rendererCreate({ antialias }) → rendererH
  //     (on Ranger native: often bind existing gfx_sdl / framebuffer surface)

  renderer.setSize(window.innerWidth, window.innerHeight)
  // bg: rendererSetSize(rendererH, w, h) — viewport / backend size

  document.body.appendChild(renderer.domElement)
  // bg: host presents the surface (DOM on web; SDL window on native — no appendChild)

  window.addEventListener('resize', onWindowResize)
  // bg: guest-only; handler issues camera/renderer commands below

  // Box
  const geometry = new THREE.BoxBufferGeometry(2, 2, 2)
  // bg: geometryBox(2, 2, 2) → geoH; CPU vertex arrays in geometry arena (D-GEO)

  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
  // bg: materialBasic(0xff0000, wireframe=true, …) → matH in material arena

  mesh = new THREE.Mesh(geometry, material)
  // bg: meshCreate(geoH, matH) → meshH; retain(geoH), retain(matH); one host mesh now

  scene.add(mesh)
  // bg: entitySetParent(meshH, sceneH) — membership only; same meshH (D-LIFE)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  // bg: cameraSetAspect(cameraH, aspect) — mutates same cameraH

  camera.updateProjectionMatrix()
  // bg: cameraUpdateProjectionMatrix(cameraH) — recompute projection on host

  renderer.setSize(window.innerWidth, window.innerHeight)
  // bg: rendererSetSize(rendererH, w, h)
}

function initCannon() {
  world = new CANNON.World()
  // bg: physicsWorldCreate() → worldH (PhysicsWorld / Cannon subsystem)

  // Box
  const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1))
  // bg: half-extents (1,1,1) match Three box size 2; shape data for bodyCreate

  body = new CANNON.Body({
    mass: 1,
  })
  // bg: bodyCreate(worldH, mass=1) → bodyH in physics body arena (≠ meshH)

  body.addShape(shape)
  // bg: bodyAddBoxShape(bodyH, 1, 1, 1)

  body.angularVelocity.set(0, 10, 0)
  // bg: bodySetAngularVelocity(bodyH, 0, 10, 0)

  body.angularDamping = 0.5
  // bg: bodySetAngularDamping(bodyH, 0.5)

  world.addBody(body)
  // bg: physics world membership for bodyH (like scene.add, but for worldH)
}

function animate() {
  requestAnimationFrame(animate)
  // bg: host frame tick schedules next guest update (or rAF on web)

  // Step the physics world
  world.fixedStep()
  // bg: physicsWorldFixedStep(worldH, dt) — advances bodyH pose in physics arena

  // Copy coordinates from cannon.js to three.js
  mesh.position.copy(body.position)
  // bg: (x,y,z) = bodyGetPosition(bodyH); meshSetPosition(meshH, x,y,z)
  //     live write to drawable; does not create/release meshH

  mesh.quaternion.copy(body.quaternion)
  // bg: (qx..qw) = bodyGetQuaternion(bodyH); meshSetQuaternion(meshH, …)

  // Render three.js
  renderer.render(scene, camera)
  // bg: rendererRender(rendererH, sceneH, cameraH)
  //     reads current host poses; no reconcile / no second mesh create
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
initThree()   // bg: mint cameraH, sceneH, rendererH, geoH, matH, meshH + parent
initCannon()  // bg: mint worldH, bodyH; physics membership
animate()     // bg: enter frame loop (step → copy pose → render)
```

Order is intentional: create the drawable + camera first, then the physics twin,
then the loop that copies physics → mesh and renders through the camera.

## W.2 Camera create and script-driven position

```js
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100)
// bg: cameraCreatePerspective(75, aspect, 1, 100, realmId) → cameraH
//     NativeRef in EvalValue; camera-arena payload — not a reconcile later
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
// bg: cameraSetPosition(cameraH, 0, 0, 5) — immediate (or end-of-turn) host write
//     stable cameraH; membership unchanged; no new camera object
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
// bg: meshGetPosition(meshH) → x; cameraSetPosition component or full vec write
camera.position.y = mesh.position.y + 2
camera.position.z = mesh.position.z + 5
// bg: still the same cameraH; script policy, host camera pose for render
```

Each line is `cameraSetPosition` / component set after `meshGetPosition` (or a
small guest-side temp `Vector3` then one `cameraSetPosition` flush). The host
camera pose is authoritative for rendering; the script is authoritative for
*policy* (where it should look).

### Resize — camera projection, not position

```js
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  // bg: cameraSetAspect(cameraH, aspect)
  camera.updateProjectionMatrix()
  // bg: cameraUpdateProjectionMatrix(cameraH)
  renderer.setSize(window.innerWidth, window.innerHeight)
  // bg: rendererSetSize(rendererH, w, h)
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
// bg: sceneCreate(realmId) → sceneH in scene arena; empty graph
```

```js
renderer = new THREE.WebGLRenderer({ antialias: true })
// bg: rendererCreate({ antialias }) → rendererH (or bind host framebuffer)
renderer.setSize(window.innerWidth, window.innerHeight)
// bg: rendererSetSize(rendererH, w, h)
document.body.appendChild(renderer.domElement)
// bg: present surface (web DOM / native SDL — no guest-owned GPU objects)
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
// bg: geometryBox(2,2,2) → geoH; CPU arrays in geometry arena

const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
// bg: materialBasic(…) → matH

mesh = new THREE.Mesh(geometry, material)
// bg: meshCreate(geoH, matH) → meshH; retain geo/mat — mesh is real now

scene.add(mesh)
// bg: entitySetParent(meshH, sceneH) — membership only; same meshH
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
  bug — II.E).
- `scene.add` as the moment the mesh “becomes real.”

Default mesh pose is identity at the origin until physics (or script) writes it.

## W.4 Physics world and rigid body (parallel to the mesh)

```js
function initCannon() {
  world = new CANNON.World()
  // bg: physicsWorldCreate() → worldH

  const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1))
  // bg: box half-extents for the upcoming body (matches Three size 2)

  body = new CANNON.Body({
    mass: 1,
  })
  // bg: bodyCreate(worldH, mass=1) → bodyH  (≠ meshH)

  body.addShape(shape)
  // bg: bodyAddBoxShape(bodyH, 1,1,1)
  body.angularVelocity.set(0, 10, 0)
  // bg: bodySetAngularVelocity(bodyH, 0,10,0)
  body.angularDamping = 0.5
  // bg: bodySetAngularDamping(bodyH, 0.5)
  world.addBody(body)
  // bg: add bodyH to worldH membership
}
```

Physics is a **second host subsystem** (`PhysicsWorld` / Cannon), not entries in
the Three mesh arena:

| Guest line | Host effect |
|------------|-------------|
| `new CANNON.World()` | `physicsWorldCreate() → worldH` |
| `new CANNON.Box(Vec3(1,1,1))` | half-extents (1,1,1) match the Three box of size 2 |
| `new CANNON.Body({ mass: 1 })` | `bodyCreate(worldH, mass=1) → bodyH` |
| `body.addShape(shape)` | `bodyAddBoxShape(bodyH, 1,1,1)` |
| `body.angularVelocity.set(0,10,0)` | `bodySetAngularVelocity(bodyH, 0,10,0)` |
| `body.angularDamping = 0.5` | `bodySetAngularDamping(bodyH, 0.5)` |
| `world.addBody(body)` | membership in the physics world (analogous to `scene.add`, but for `worldH`) |

`bodyH` and `meshH` stay distinct. Game logic that “moves the player” must say
which side is authoritative this frame (usually physics), then copy.

## W.5 Animate — step physics, copy pose to mesh, render through camera

```js
function animate() {
  requestAnimationFrame(animate)
  // bg: schedule next frame / guest update

  // Step the physics world
  world.fixedStep()
  // bg: physicsWorldFixedStep(worldH, dt) — bodyH pose advances

  // Copy coordinates from cannon.js to three.js
  mesh.position.copy(body.position)
  // bg: bodyGetPosition(bodyH) → meshSetPosition(meshH, …)
  mesh.quaternion.copy(body.quaternion)
  // bg: bodyGetQuaternion(bodyH) → meshSetQuaternion(meshH, …)

  // Render three.js
  renderer.render(scene, camera)
  // bg: rendererRender(rendererH, sceneH, cameraH)
}
```

### Step

```js
world.fixedStep()
// bg: physicsWorldFixedStep(worldH, dt) — advances bodyH in the physics arena
```

After this, **authoritative simulation pose** is on `bodyH`. The Three mesh is
stale until the copy lines run.

### Object / player position — write mesh from body (observe physics → draw)

```js
mesh.position.copy(body.position)
// bg: bodyGetPosition(bodyH) → meshSetPosition(meshH, x,y,z)
mesh.quaternion.copy(body.quaternion)
// bg: bodyGetQuaternion(bodyH) → meshSetQuaternion(meshH, qx,qy,qz,qw)
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
const p = mesh.position   // meshGetPosition(meshH) → guest Vector3 mirror

// or observe simulation pose (preferred for gameplay fairness)
const bp = body.position  // bodyGetPosition(bodyH)
```

**Write path (teleport / scripted move):** decide authority, then set both if
both exist:

```js
// script teleports player
body.position.set(x, y, z)           // bodySetPosition(bodyH, x,y,z)
body.velocity.set(0, 0, 0)           // clear residual motion if needed
mesh.position.copy(body.position)    // keep drawable in sync same frame
```

Never only move `mesh` if the next `fixedStep` will overwrite from `body`
(unless the body is kinematic and you write the body too).

Lifetime diagram for one frame:**

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
// bg: rendererRender(rendererH, sceneH, cameraH) — current host poses only
```

Uses **current** host poses: mesh from the copy lines, camera from W.2
(`z = 5` or whatever the chase-cam wrote). No reconcile invents objects here.

## W.6 What this example forbids (regression checklist)

| Incorrect behavior | Why it fails this demo |
|--------------------|------------------------|
| Reconcile creates `meshH` on first `render` | `mesh.position.copy` in `animate` would have no stable target; double-create risk |
| `camera.position.z = 5` only stored on façade | Rendered view ignores script camera policy |
| `mesh.position.copy` allocates a new mesh/geo | Handle identity breaks; physics pairing lost |
| `scene.remove(mesh)` disposes geometry | Shared resources + revive patterns break (D-LIFE) |
| `body` and `mesh` forced to one handle | Physics step and drawable attach have different lifetimes / arenas |
| Packed handle wrap aliases `cameraH` | Chase-cam writes another guest’s camera (D-HANDLE / realm) |

## W.7 Mapping onto Ranger packages

| Concern | Target home |
|---------|-------------|
| `cameraH` / `meshH` / `sceneH` / materials / geometries | `ThreeSceneHost` + typed arenas (`three/`) |
| `worldH` / `bodyH` | `PhysicsWorld` implementation (`physics/`), wired through the guest ABI / `ranger-game` |
| Script loop `animate` | Guest TSX / WASM `update`; host calls fixed step then guest, or guest calls step via import |
| `renderer.render` | Host frame end (`gfx_sdl` / WebGL backend) reading host camera + scene |

The ABI may expose fewer sugar names (`rg_set_translation(meshH,x,y,z)`), but
the **identity and timing rules** are the same as the Three lines above.

---

# Worked example — geometry upload, update, and read-back

Validates D-GEO / D-WASM-MEM: one authoritative host vertex copy, stable `geoH`,
bulk upload, mutation + GPU revision, read-back through the same handle.

```js
const vertices = new Float32Array([1, 1, 1,  -1, -1, 1,  -1, 1, -1 /* … */])
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
// bg: materialBasic(…) → matH

const g = new THREE.BufferGeometry()
// bg: geometryCreateEmpty() → geoH  (stable from here; no attributes yet)

g.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
// bg: geometrySetAttribute(geoH, "position", span<f32>, itemSize=3)
//     one bulk copy into host geometry arrays (D-WASM-MEM); not a new geoH

const m = new THREE.Mesh(g, material)
// bg: meshCreate(geoH, matH) → meshH; retain(geoH)

scene.add(m)
// bg: entitySetParent(meshH, sceneH)

g.attributes.position.setXYZ(0, 2, 3, 4)
g.attributes.position.needsUpdate = true
// bg: geometryUpdateRange(geoH, "position", 0, 1, data)
//     overwrites CPU arrays; bumps contentRevision; same geoH; meshH unchanged

const x = g.attributes.position.getX(0)
// bg: geometryReadPositions(geoH, 0, 1, out) → x === 2
//     same handle that created / rendered the geometry
```

Required effects (no alternatives):

```
geometryCreateEmpty() -> geoH
geometrySetAttribute(geoH, ...)
meshCreate(geoH, matH) -> meshH
entitySetParent(meshH, sceneH)
geometryUpdateRange(geoH, ...)
geometryReadPositions(geoH, ...) -> 2
```

Forbidden: replacement `geoH`, mesh recreation on attribute change, or a second
authoritative vertex array on the guest after upload.


---

# Implementation gates

**Required order:**

1. Interpreter identity and `undefined` semantics (D-IDENTITY).
2. Native adapter and property-overlay semantics (D-ADAPTER, D-PROP).
3. Typed registry and arenas (D-REGISTRY, D-TYPE, D-HANDLE).
4. Shared resource identity and lifetime (D-SYNC, D-LIFE, D-GEO).
5. Generated bridge and WASM surfaces (D-REGISTRY, D-WASM, D-WASM-MEM).
6. Migrate demos to live objects (D-SYNC).
7. Delete structural reconciliation (`RETIRE-RECONCILE`).

**Required test gates:**

- JavaScript reference and property semantics (`===`, Map/Set keys, missing →
  `undefined`, expandos vs native props).
- Same script object → same host handle.
- Shared geometry/material identity (two meshes, one `geoH` / `matH`).
- Scene removal ≠ release.
- `DisposeBackend` ≠ release.
- Stale and cross-realm handle rejection.
- Generated-surface parity (host / native bridge / WASM / wrappers).
- Existing WASM import signature compatibility (D-WASM).
- Reordering and reparenting never change identity.
- Geometry upload → update → read-back on one `geoH` (worked example 2).

A migration is complete only when its replaced path is removed in the same
change, or is covered by an explicitly tracked retirement item
(e.g. `RETIRE-RECONCILE`). **Parity is tested across generated surfaces rather
than promised.**

