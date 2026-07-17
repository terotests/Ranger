# IDEAL_3D — host-managed scene, entity, and resource ownership for 3D

> Status: **target specification** (companion to [`IDEAL.md`](./IDEAL.md) §5,
> [`ABI_V2_PROPOSAL.md`](./ABI_V2_PROPOSAL.md) §18–§21, and
> [`IDEAL_TODO.md`](./IDEAL_TODO.md) Phase G).
>
> This document describes the **ownership model** the 3D path must move toward.
> The current `fps_wasm` and `cube3d_wasm` PoCs violate this model — they are
> proof-of-concept slices that demonstrate rendering *mechanics* (z-buffer,
> near-clip, lighting, character controller), but their architecture has the
> guest building and owning the scene graph, which is not the production target.

---

## 1. The problem with the current FPS/cube3d PoCs

The `games/fps_wasm` and `games/cube3d_wasm` guests currently:

| # | What the guest does wrong | Evidence | Required fix |
|---|---------------------------|----------|--------------|
| 1 | **Builds the mesh in guest WASM memory.** The guest allocates vertex/index/sub-mesh pools as static arrays, writes all geometry, and exports raw pointers for the host to read. | `fps_wasm/src/src/lib.rs`: `static MESH: Blk<MESH_SZ>`, `put_v()`, `add_quad()`, `add_box()` | Host allocates and owns mesh resources; guest sends `LOAD_MODEL` / `CREATE_MESH_ENTITY` commands. |
| 2 | **Guest generates its own scene graph.** The guest holds the full world structure (`World.boxes[]`), builds all entity hierarchies, and publishes them as a single monolithic block. No host-issued EntityId exists. | `fps_wasm/src/src/lib.rs`: `struct World { boxes, nv, ni, ns, … }` | Ranger owns the scene graph; guest requests entity creation and gets opaque handles back. |
| 3 | **Guest owns material/texture binding.** Materials are entirely defined in-guest (`MAT` block with texture handles hardcoded). | `fps_wasm/src/src/lib.rs`: `MAT.wu(o, tex)` with `tex = 1,2,3` | Host creates materials from loaded resources; guest receives `MaterialHandle`. |
| 4 | **No EntityId abstraction.** There are no host-issued entity identifiers. The guest directly publishes memory offsets and array indices as the "API". The host reads raw memory. | `rg_mesh_ptr()`, `rg_mat_ptr()`, `rg_cam_ptr()` exports | Host allocates `EntityId`s; guest uses opaque handles for all scene operations. |
| 5 | **No resource/instance separation.** The guest has no concept of loading a model once and instantiating it multiple times. Every mesh is baked inline. | `build_level()` creates geometry directly | Host supports `load_model()` → `ModelHandle`, then `instantiate_model()` → `EntityId`. |
| 6 | **Guest owns the camera and light as raw memory blocks.** Camera and light are static byte arrays the guest writes to directly. | `static CAM: Blk<CAM_SZ>`, `static LIT: Blk<LIT_SZ>` | Camera and lights are host entities; guest sets properties via Entity API calls. |
| 7 | **No lifecycle management.** The host cannot free or recycle any resource because everything is pinned in guest memory. There is no reference counting, no destroy, no ownership tracking. | No `destroy()` or `free()` anywhere | Host tracks per-guest entity/resource ownership and cleans up on guest removal. |

### Why this matters

The current architecture works for a single self-contained PoC, but it **cannot
scale** to a production engine because:

- Every WASM guest would need to implement its own mesh builder, material system,
  and scene management — duplicating engine work.
- The host cannot load external 3D files (glTF, GLB, OBJ) and inject them into
  the guest's private memory layout.
- Resources cannot be shared between instances (three trees = three full copies
  of mesh data in WASM memory).
- The host cannot manage lifecycle, garbage collection, or error recovery.
- There is no way to build a scene editor, prefab system, or asset pipeline that
  feeds into the same scene.

---

## 2. The target ownership model

### 2.1 The ownership rule

```
Guest owns gameplay logic.
Ranger (host) owns the engine world.
```

Ranger's ownership includes:

- `EntityId` allocation, validation, recycling, and invalidation
- Entity registry and scene graph
- Transforms (position, rotation, scale, matrix)
- Mesh instances and their GPU/CPU resources
- Lights and cameras as scene entities
- Render components and render pipeline state
- Materials, textures, and shaders
- Skeletons, animation clips, and playback state
- Resource loading, caching, sharing, and freeing
- Lifecycle management per WASM-instance

The WASM guest may:

- Store `EntityId` values in its own game state
- Compare entity handles
- Attach gameplay data (health, cooldown, AI state) to its own struct keyed by `EntityId`
- Send high-level commands to the host (create, destroy, set position, play animation)

The WASM guest may **not**:

- Generate its own `EntityId` values
- Maintain its own authoritative scene graph
- Build mesh data in WASM memory and export pointers
- Assume anything about `EntityId` binary structure
- Decide host-resource lifetimes independently

### 2.2 EntityId is an opaque host-issued handle

All `EntityId` values are created, validated, recycled, and invalidated by Ranger.

```rust
// In the guest's gameplay struct — the EntityId is a borrowed reference
struct Enemy {
    entity: EntityId,  // opaque handle from Ranger
    health: i32,
    attack_cooldown: f32,
}
```

### 2.3 Resources vs instances

Ranger's API must distinguish between a **loaded resource** (a model/mesh/texture
in the host's asset cache) and a **scene instance** (a live entity hierarchy in
the scene graph):

```rust
// One resource, many instances:
let tree_model = ranger.load_model("models/tree.glb")?;   // → ModelHandle

let tree_a = ranger.instantiate_model(tree_model)?;  // → EntityId (or hierarchy)
let tree_b = ranger.instantiate_model(tree_model)?;  // → EntityId
let tree_c = ranger.instantiate_model(tree_model)?;  // → EntityId

// Each instance has its own transform; mesh data is shared in host memory.
tree_a.set_position(Vec3::new(-10.0, 0.0, 2.0))?;
tree_b.set_position(Vec3::new(  0.0, 0.0, 4.0))?;
tree_c.set_position(Vec3::new(  8.0, 0.0,-3.0))?;
```

### 2.4 File-loaded models create host-side hierarchies

A single glTF/GLB/OBJ file may contain multiple meshes, materials, textures,
skeletons, and a node hierarchy. Ranger must:

1. Open and parse the file
2. Validate format and version
3. Resolve internal dependencies (materials reference textures, meshes reference materials)
4. Create mesh, material, texture, skeleton, and animation clip resources
5. Transfer data to the render system (GPU upload or software buffer)
6. Cache resources for sharing between instances
7. Return an opaque `ModelHandle` to the guest

When instantiated:

1. Allocate one or more `EntityId`s
2. Build the internal parent–child hierarchy
3. Attach mesh, material, and animation components
4. Return the root entity (or a typed instance handle) to the guest

```
car.glb → ModelResource
             ├─ MeshResource (Body)
             ├─ MeshResource (FrontLeftWheel)
             ├─ MeshResource (FrontRightWheel)
             ├─ MeshResource (RearLeftWheel)
             ├─ MeshResource (RearRightWheel)
             ├─ MeshResource (SteeringWheel)
             ├─ MeshResource (HeadLights)
             ├─ MaterialResource
             └─ TextureResource
```

The guest can query named child nodes:

```rust
let car = ranger.instantiate_model(car_model)?;
let steering = ranger.find_child_by_name(car.entity(), "SteeringWheel")?;
steering.set_rotation(steering_rotation)?;
```

---

## 3. The required API surface

### 3.1 Asset API (load host resources)

```rust
let model: ModelHandle    = ranger.load_model("models/character.glb")?;
let mesh: MeshHandle      = ranger.load_mesh("models/crate.obj")?;
let texture: TextureHandle = ranger.load_texture("textures/crate.png")?;
let material: MaterialHandle = ranger.create_material(material_desc)?;
```

All handles are opaque, host-issued identifiers. The guest never sees raw pixel
data, vertex buffers, or GPU resources.

### 3.2 Scene API (create scene entities)

```rust
let object    = ranger.create_object3d()?;
let crate_ent = ranger.create_mesh_entity(mesh, material)?;
let character = ranger.instantiate_model(model)?;
let camera    = ranger.create_perspective_camera(camera_desc)?;
let light     = ranger.create_point_light(light_desc)?;
let ambient   = ranger.create_ambient_light(Color::WHITE, 0.25)?;
```

Every creation returns a host-allocated `EntityId` or typed proxy containing one.

### 3.3 Entity API (mutate host scene objects)

```rust
entity.set_position(position)?;
entity.set_rotation(rotation)?;
entity.set_scale(scale)?;
entity.set_matrix(matrix)?;
entity.set_parent(parent)?;
entity.set_visible(true)?;
entity.set_enabled(true)?;
entity.destroy()?;
```

These either call the host directly (import-based) or write to a
guest-to-host command buffer. Ranger processes the commands and updates its
authoritative scene.

### 3.4 Scene file loading

```rust
let level = ranger.load_scene("levels/warehouse.scene")?;
let level_instance = ranger.instantiate_scene(level)?;

let player_spawn = ranger.find_entity_by_name(level_instance, "PlayerSpawn")?;
let exit_door    = ranger.find_entity_by_name(level_instance, "ExitDoor")?;
```

---

## 4. What must change in the current PoCs

### 4.1 Transition plan for `fps_wasm`

| Step | Change | Guest impact | Host impact |
|------|--------|--------------|-------------|
| 1 | Replace raw mesh block export with host `create_mesh()` / `create_box()` calls | Guest calls `ranger.create_box(min, max, material)` instead of `add_box()` | Host allocates mesh, returns `EntityId` |
| 2 | Replace inline material creation with `create_material(texture_handle)` | Guest receives `MaterialHandle` from host | Host owns material→texture binding |
| 3 | Replace raw camera block with `create_perspective_camera()` + per-frame `set_position`/`set_target` | Guest holds camera `EntityId`, calls `set_position()` each frame | Host owns camera entity and projection state |
| 4 | Replace raw light block with `create_ambient_light()` / `create_directional_light()` | Guest holds light `EntityId` | Host owns light parameters |
| 5 | Keep guest-side physics (character controller) but output `set_position(player_entity, pos)` | Guest still owns gameplay physics logic; outputs go via Entity API | Host updates the player entity's transform |
| 6 | Remove all `rg_mesh_ptr()` / `rg_mat_ptr()` / `rg_cam_ptr()` / `rg_lit_ptr()` exports | Guest no longer exports raw memory pointers | Host no longer reads guest memory for scene data |

### 4.2 Transition plan for `cube3d_wasm`

Same as above (simpler — single mesh, single model transform), plus:

- The spinning cube rotation drives `set_rotation(cube_entity, angle)` per frame
  instead of rewriting a model-transform matrix in WASM memory.

### 4.3 Host-side implementation requirements

| Component | Responsibility |
|-----------|----------------|
| **Entity Registry** | Allocate/free `EntityId`, generation counter for use-after-free detection |
| **Scene Graph** | Parent–child relationships, transform hierarchy, dirty-flag propagation |
| **Resource Cache** | Load, parse, cache, share, refcount, and free mesh/texture/material/animation resources |
| **Command Processor** | Validate guest commands, check handles, update scene, reject stale handles |
| **Lifecycle Manager** | Track which WASM instance owns which entities/resources; bulk-free on unload |
| **Render Bridge** | Feed the scene graph to the renderer (GLES2 or software); no guest involvement |

### 4.4 New host imports the guest will use

```c
// Asset API
i32 rg_load_model(i32 name_ptr, i32 name_len);         // → ModelHandle
i32 rg_load_texture(i32 name_ptr, i32 name_len);       // → TextureHandle
i32 rg_create_material(i32 desc_ptr);                   // → MaterialHandle

// Scene API
i32 rg_create_object3d();                               // → EntityId
i32 rg_create_mesh_entity(i32 mesh, i32 material);      // → EntityId
i32 rg_instantiate_model(i32 model_handle);             // → EntityId (root)
i32 rg_create_perspective_camera(i32 desc_ptr);         // → EntityId
i32 rg_create_ambient_light(i32 color, i32 intensity);  // → EntityId
i32 rg_create_directional_light(i32 desc_ptr);          // → EntityId
i32 rg_create_point_light(i32 desc_ptr);                // → EntityId

// Entity API
void rg_set_position(i32 entity, i32 x, i32 y, i32 z);
void rg_set_rotation(i32 entity, i32 qx, i32 qy, i32 qz, i32 qw);
void rg_set_scale(i32 entity, i32 sx, i32 sy, i32 sz);
void rg_set_parent(i32 entity, i32 parent_entity);
void rg_set_visible(i32 entity, i32 visible);
void rg_destroy_entity(i32 entity);

// Query API
i32 rg_find_child_by_name(i32 parent, i32 name_ptr, i32 name_len);  // → EntityId
```

All position/rotation/scale values use the existing fixed-point conventions
(`FP_SCALE = 256` for positions, `Q16.16` for quaternion/unit components).

---

## 5. Supported resource formats (target)

Ranger must be able to load 3D resources from external files. The guest does not
parse these — it only requests a load and receives a handle.

| Format | Type | Notes |
|--------|------|-------|
| glTF / GLB | Model (mesh + material + texture + skeleton + animation) | Industry standard; binary GLB preferred for production |
| OBJ + MTL | Model (mesh + material) | Simple geometry; no animation |
| Ranger `.mesh` | Mesh | Engine-native binary format (optimised for fixed-point) |
| Ranger `.scene` | Scene / Prefab | Entity hierarchies, spawn points, metadata |
| PPM / PNG / JPEG | Texture | PPM for dev (current); PNG/JPEG for production |
| Ranger `.anim` | Animation clip | Skeleton keyframes |
| Ranger `.skel` | Skeleton | Bone hierarchy + bind poses |

### 5.1 GLB — implemented support level

The native GLB path (`model3d/`, see its
[`README.md`](./model3d/README.md#first-support-level)) currently loads: GLB 2.0
(one JSON + one BIN chunk), scenes/nodes with `matrix` or TRS, multiple
meshes/primitives, `TRIANGLES`, `POSITION` / `NORMAL` / `TEXCOORD_0` /
**`COLOR_0`** (vertex colours), **non-indexed** primitives (indices synthesised),
**missing `NORMAL`** (smooth normals generated), `u8` / `u16` / `u32` indices,
interleaved `byteStride`, `baseColorFactor` + `baseColorTexture`,
`emissiveFactor` (+ `KHR_materials_emissive_strength`), `alphaMode`,
`KHR_materials_unlit`, multiple materials, and embedded PNG / JPEG textures.

Rejected with a clear error (never a silently-wrong model): skins, animations,
morph targets, sparse accessors, Draco / Meshopt / KTX2 (any
`extensionsRequired`), and non-`TRIANGLES` modes.

Future (not required for initial transition):

- Terrain heightmaps
- Particle system descriptors
- Environment maps / skyboxes
- Audio spatialisation sources tied to entities

---

## 6. Lifecycle management

When a WASM guest instance is removed, Ranger must:

1. Destroy all scene entities owned by that instance
2. Remove those entities from the scene graph
3. Cancel any in-progress async resource loads
4. Decrement reference counts on shared resources
5. Free resources whose reference count reaches zero
6. Invalidate all `EntityId` handles issued to that guest (generation bump)

This is only possible when the host is the single owner of the entity registry
and resource cache. If the guest held authoritative scene state in its own memory,
the host could not perform reliable cleanup.

---

## 7. The command model (guest→host communication)

The guest communicates with Ranger through one of two mechanisms (the choice is
an implementation detail, not a guest-visible difference):

### Option A: Direct host imports (synchronous)

Each API call is a WASM import that executes immediately:

```rust
let entity = rg_create_object3d();  // host call, returns immediately
rg_set_position(entity, x, y, z);  // host call
```

Pros: simple, immediate feedback. Cons: many boundary crossings per frame.

### Option B: Command buffer (batched)

The guest writes commands to a shared buffer; Ranger processes them in bulk:

```
[CREATE_OBJECT3D, out_slot_0]
[SET_POSITION, slot_0, x, y, z]
[INSTANTIATE_MODEL, model_handle, out_slot_1]
[SET_PARENT, slot_1, slot_0]
```

Pros: fewer boundary crossings, batch validation. Cons: deferred results.

Either way, the host is the single authority on the scene. The guest never builds
a parallel scene graph.

---

## 8. What the guest still owns

The guest retains full ownership of:

- **Game logic** — AI, scoring, game rules, state machines, level progression
- **Physics simulation** (where the game chooses guest-side physics, as in `fps_wasm`) —
  the character controller logic stays in the guest; its output is
  `set_position(entity, computed_pos)`, not a raw memory block
- **Input interpretation** — mapping raw input events to game actions
- **Gameplay data structures** — enemy lists, inventory, dialogue trees
- **Command sequencing** — deciding *what* to create/destroy/move and *when*

The guest does **not** own:

- The underlying mesh/texture/material data
- The scene graph structure (parent–child)
- The render pipeline or GPU state
- The `EntityId` allocation space
- Resource caching, sharing, or freeing

---

## 9. Relationship to existing documents

| Document | How IDEAL_3D relates |
|----------|---------------------|
| `IDEAL.md` §5 | §5 says "the guest owns the world" (bodies/bounds). For **3D scenes and rendering resources**, ownership inverts: Ranger owns the scene/entity/resource graph. The guest still owns world *logic* (physics sim, game rules) but publishes its results through Entity API calls, not raw memory blocks. |
| `IDEAL.md` §2.17 | §2.17 describes the camera. Under this model, the camera becomes a host entity; the guest sets its properties per frame via `set_position`/`set_target`. |
| `ABI_V2_PROPOSAL.md` §18–§21 | The block definitions (RGMB, RGMA, RGCM, RGLT) are useful for the *transport layer* between guest command buffer and host. But they should be internal host structures, not guest-exported memory. |
| `IDEAL_TODO.md` Phase G | Phase G tracks the PoC slices. This document defines the architectural target those PoCs must evolve toward. |
| `HOST_ARCHITECTURE.md` | The `GameSceneProvider` pattern aligns — the host holds the scene through an internal interface; the 3D entity registry is the generalisation. |
| `model3d/` (`gallery/game_engine/model3d/`) | **Implements** the host-managed object model this document requires (§2, §4.3): `AssetRegistry`/`EntityRegistry`, `load_model`→`ModelAsset`→entity hierarchy→`MeshRenderer`, `instantiate_model`, `find_child`. Pure Ranger, host-owned, WASM-free. §12 below is the checklist to wire it to the §4.4 ABI imports. |
| [`IDEAL_THREE.md`](./IDEAL_THREE.md) + `three/` | The **portable Ranger 3D object model + Three.js-compatible API**. Where IDEAL_3D is the WASM-guest ABI view (host owns the scene, guest sends commands), IDEAL_THREE is the *object model itself*, driven by three interchangeable front-ends — Ranger code, a TSX façade, and (future) a WASM guest — with a pluggable render backend (software / WebGL / GLES). The object model is canonical and front-end-agnostic, so the same layer compiles to C++/WASM and the ABI transport here becomes one of several ways to build the same objects. |

---

## 10. The central architectural rule

> Ranger's scene is **never** published to the guest as a writable memory structure.
>
> The guest does not send the host a complete scene snapshot.
> The guest does not build a parallel engine-scene alongside Ranger's.
>
> Instead, the guest sends high-level requests:
>
> ```
> LOAD_MODEL, INSTANTIATE_MODEL, CREATE_ENTITY, DESTROY_ENTITY,
> SET_POSITION, SET_ROTATION, SET_SCALE, SET_PARENT, SET_VISIBLE,
> CREATE_LIGHT, SET_LIGHT_ENABLED, PLAY_ANIMATION
> ```
>
> Ranger validates, updates its authoritative scene, manages lifecycles, and
> renders — the guest sees only opaque handles and confirmation/error results.

If `EntityId`, scene graph, transform tables, or model instances are built
guest-side as a new library module, the architecture has **not** been fixed.
That would be adding a Rust wrapper on top of the current broken ABI surface.

The required change is a **host-managed object model** where both
programmatically created objects and file-loaded 3D models end up in the same
Ranger-owned scene and the same Ranger-owned entity registry.

---

## 11. Clarification: §5 "guest owns the world" vs "host owns the scene"

`IDEAL.md` §5 states the guest is the single owner of its *world* (bodies, bounds,
world size). This is about **avoiding dual encoding** (the same data in both host
and guest). It does **not** mean the guest should hold raw render resources in
WASM memory.

The reconciliation:

- **Gameplay world** (what exists, where, game rules) → guest owns the *intent*
- **Engine scene** (render mesh data, GPU buffers, scene graph hierarchy, entity
  registry) → Ranger owns the *realisation*

The guest declares "there is a wall from A to B" via a host call; Ranger creates
the mesh, material, entity, and scene-graph node. The wall's *existence* is a
guest decision; its *engine representation* is a host resource.

This is identical to how the 2D path works: the guest writes body positions into
RGW1, but the *sprite* that represents the body (texture, animation, draw order)
is a host concern through the `spriteFor` / `GameSceneProvider` interface.

---

## 12. ABI integration: wiring the native `model3d` loader to the host imports

The `model3d/` module (`gallery/game_engine/model3d/`, see its
[`README.md`](./model3d/README.md)) is the **host-side realisation** of §2 and
§4.3: a Ranger-owned entity registry, transform hierarchy, asset/resource cache,
`instantiate_model`, and `find_child` — plus a native GLB importer that turns a
file into a `ModelAsset`. It is deliberately **host-side and WASM-free**, which
is exactly what §10 demands: `EntityId`s, the scene graph, transform tables, and
model instances live in the host, and the guest only ever receives opaque
handles. It is **not** a guest-side wrapper.

This section is the checklist to expose that model across the ABI (§4.4). It
does **not** require any new guest-side scene state.

### 12.1 What `model3d` already provides (host-side)

| §4.3 component | `model3d` implementation |
|----------------|--------------------------|
| Entity Registry | `EntityRegistry` — `create`, `get`, `setParent`, `findChild`, `updateWorld` (id = registry index) |
| Scene Graph | `Entity.children` + `TransformComponent` (local + world `Mat4`) |
| Resource Cache | `AssetRegistry` (models by id) → `ModelAsset` → `Mesh/Material/Texture/NodeAsset` |
| Resource loading / parse | `GlbImporter` (container + accessors) + `GltfDocument` (typed view + support gate) + `TextureDecode` (embedded PNG/JPEG → RGBA) |
| `instantiate_model` | `ModelInstancer.instantiate(model)` → root `EntityId` (nodes → entities, TRS/matrix → transforms, mesh → `MeshRenderer`) |
| `find_child_by_name` | `EntityRegistry.findChild(rootEntity, name)` |
| Public API | `ModelLoader.loadFromFile / loadFromBuffer / instantiate / findChild / getEntity` |

### 12.2 §4.4 import → `model3d` call

Keep one `ModelLoader` instance **per WASM guest** (keyed by the guest's `wasm`
handle) so its `AssetRegistry` + `EntityRegistry` are that guest's private,
host-owned scene — this is what makes the lifecycle cleanup of §6 possible.

| Host import (§4.4) | Backing `model3d` call |
|--------------------|------------------------|
| `rg_load_model(name_ptr, name_len)` → ModelHandle | read guest string → `loader.loadFromFile(dir, file)`; return model id, or `-1` (`loader.ok` / `loader.lastError` carry the reason) |
| `rg_instantiate_model(model_handle)` → EntityId | `loader.instantiate(modelId)` → root `EntityId` |
| `rg_find_child_by_name(parent, name_ptr, name_len)` → EntityId | read guest string → `loader.findChild(parent, name)` |
| `rg_set_position(entity, x, y, z)` | `loader.getEntity(entity)`; convert fixed→double; `transform.setTRS(...)`; then `updateWorld(root, identity)` |
| `rg_set_rotation(entity, qx, qy, qz, qw)` | same, Q16.16→double quaternion into `setTRS` |
| `rg_set_scale(entity, sx, sy, sz)` | same, into `setTRS` |
| `rg_set_parent(entity, parent)` | `EntityRegistry.setParent(entity, parent)` |
| `rg_create_mesh_entity(mesh, material)` | `EntityRegistry.create` + set `MeshRenderer.meshAsset` (host-authored mesh/material path) |
| `rg_load_texture(name_ptr, name_len)` → TextureHandle | `TextureDecode` on file bytes into a `TextureAsset` (standalone-texture path — **TODO**, see §12.5) |
| `rg_create_material(desc_ptr)` → MaterialHandle | build a `MaterialAsset` from the desc block (**TODO**: define desc layout) |
| `rg_destroy_entity(entity)` | **TODO** — needs destroy/free on the registries (see §12.5) |

### 12.3 Wiring steps (concrete to this codebase)

1. **Register the imports** the same way the existing 3D/resource imports are
   registered — as `env.rg_*` functions through the C++ bridge
   (`rg_wasm_bridge.h`; cf. `env.rg_res_load`, `env.rg_host_register_sheet` in
   `wasm_runtime.rgr`). Add `rg_load_model`, `rg_instantiate_model`,
   `rg_find_child_by_name`, `rg_set_position/rotation/scale`, `rg_set_parent`.
2. **String arguments** (`name_ptr`, `name_len`): the guest passes an offset into
   its own linear memory. Read the bytes host-side exactly as
   `wasm3d_runner.readResName` already does (`rbyte` / `wasm_mem_i32`), build the
   Ranger string, then call `ModelLoader`.
3. **Handles**: model id = `AssetRegistry` index, `EntityId` = `EntityRegistry`
   index; return as `i32`, reserve `-1` for errors. Before production, wrap these
   with a generation counter (§4.3, §12.5) so stale handles are rejected.
4. **Ownership**: store the per-guest `ModelLoader` in the runner (like
   `Wasm3dRunner` holds its mesh/texture state today), so unloading a guest frees
   exactly its models and entities (§6).
5. **Fixed-point**: the guest sends positions `*256` and quaternion/unit
   components as `Q16.16` (§4.4). Convert to `double` on the way in (into
   `setTRS`) and call `EntityRegistry.updateWorld(root, identity)` to refresh
   world matrices. Host-internal math stays in `double`.

### 12.4 Render bridge

The existing GPU path (`gfx_3d_*` in `gfx_sdl.rgr`, driven by `Wasm3dRunner`)
already works in `double`. To make it the §4.3 **Render Bridge** for this model,
replace its single guest-published-mesh read with a walk of the host scene:

- for each `Entity` where `hasRenderer`, resolve its `MeshAsset` (via
  `renderer.meshAsset` in the instance's `ModelAsset`), upload/lookup its
  geometry, bind the material's `baseColorTexture` (`TextureAsset.rgba` replaces
  the current PPM upload), and draw it with the entity's
  `transform.worldMatrix`.

No guest memory is read for scene data — the guest only issued handle-returning
commands.

### 12.5 What the ABI layer must still add (not in `model3d` v1)

`model3d` intentionally stops at the host object model + loader. The remaining
pieces are the ABI-surface concerns §10 says must live host-side (not as a guest
wrapper):

- per-guest ownership map + **generation counters** on `EntityId` (use-after-free
  detection) — §4.3, §6;
- `rg_destroy_entity` / free + refcounting on shared `ModelAsset`s — §6 (the
  registries are currently append-only);
- command validation / stale-handle rejection — §7 command processor;
- `rg_create_material` desc layout and the standalone `rg_load_texture` path;
- **`COLOR_0` on the GPU path**: the loader reads per-vertex colours into
  `MeshPrimitiveAsset.colors` and the software renderer (`SoftRenderer3D`) shows
  them, but `MeshBridge`'s fixed-point vertex keeps the colour word (word 6) at 0
  because the GLES2 shader in `gfx_sdl.rgr` does not yet read a vertex-colour
  attribute — wiring that is a small C++ shader step;
- optionally, the §7 Option B command buffer for batching.

### 12.6 Minimal end-to-end flow

```
guest:  h    = rg_load_model("models/robot.glb")     // ptr,len into guest memory
host:        id   = loader.loadFromFile("models", "robot.glb");  return id  (or -1)

guest:  root = rg_instantiate_model(h)
host:        return loader.instantiate(id)            // root EntityId

guest:  hand = rg_find_child_by_name(root, "RightHand")
host:        return loader.findChild(root, "RightHand")

guest:  rg_set_rotation(hand, qx, qy, qz, qw)         // Q16.16
host:        e = loader.getEntity(hand);
             e.transform.setTRS(e.transform.translation, quatFromFixed(qx,qy,qz,qw), e.transform.scale);
             loader.entities.updateWorld(root, Mat4.identity())
```

The guest holds only opaque `i32` handles throughout — satisfying §2.2 and §10.
