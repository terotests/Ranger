# PLAN — a stable EntityRegistry for the Three host

> Status: **plan / proposal** (no code yet). Companion to
> [`IDEAL_3D.md`](./IDEAL_3D.md) §12.3 and [`THREE_BRIDGE.md`](./THREE_BRIDGE.md).
> Scope confirmed: `gallery/game_engine` only. ID width: **32-bit for now**.

## 1. The problem, verified in the code

The host registries key objects by **raw array index**, and "removal" never
frees the slot. Concretely:

- `three/src/three_scene_host.rgr` keeps five parallel arrays — `scenes`,
  `cameras`, `geometries`, `materials`, `entities` — and every `*New` method
  returns `(array_length …)` as a 1-based handle (e.g. `sceneNew`, `meshNew`,
  `groupNew`, `lightAmbient`). The handle **is** the index.
- `entityRemove` (`three_scene_host.rgr:255`) only calls `scene.remove(obj)`.
  It does **not** free the `entities` slot.
- The reconciler exercises exactly that path: on a mesh signature change,
  `three/tsx/three_tsx_bridge.rgr:586` calls `host.entityRemove(...)`, then
  `buildMeshH` **pushes a new entry**. Result: the `entities` array grows
  monotonically with orphaned dead slots on every hot-reload / prop change, and
  the old handle still silently indexes a detached object instead of being
  rejected.
- `model3d/EntityModel.rgr` defines a **second** `EntityRegistry` with the same
  design (`id = array_length entities`, no generation, no free) — duplication of
  the exact pattern we want to fix.

The engine's own spec already prescribes the fix — `IDEAL_3D.md` §12.3.3:
> *"Before production, wrap these with a generation counter … so stale handles
> are rejected."*

### Failure modes this causes
1. **Unbounded growth / leak** — dead entities are never reclaimed.
2. **Stale-handle aliasing** — a handle to a removed object reads a live-looking
   but detached object; if slots were ever compacted, it would read a *different*
   object. Silent, not rejected.
3. **No single owner** — the same index-handle pattern is hand-rolled in ≥3
   places (5 arrays in the host + a separate registry in `model3d`).

## 2. Design — `EntityHandle` = generation-tagged 32-bit handle

Goal from the prior session: *a stable, process-wide unique id that is not a
volatile array index, with stale handles rejected rather than silently
dereferenced.* With 32-bit, a **generation-packed handle** delivers exactly the
guarantees a Map-of-ids would, without needing a Map type and while **reusing
memory** (fixing the leak):

```
handle (i32, 1-based; 0 = null) = (generation << INDEX_BITS) | (slotIndex + 1)
  INDEX_BITS = 20  ->  1,048,575 live slots, 4,095 generations per slot
```

- **Slot pool with a free-list.** The registry holds a slot array plus an
  `int` free-list. `create` pops a free slot (or grows), stamps the object and
  the slot's current `generation`, and returns the packed handle. `destroy`
  clears the slot, bumps its `generation`, and pushes the slot back on the free
  list — **memory is reclaimed**, so no unbounded growth.
- **Stale handles are rejected.** `resolve(handle)` unpacks slot+gen; if the
  slot is empty or `slot.generation != handle.generation`, it returns null (a
  safe no-op / warning), never a wrong object.
- **Stable for the object's lifetime**, and unique process-wide until the
  20-bit index space wraps under 4,095× churn on the same slot (documented
  bound; 64-bit widening is a later, mechanical change — see §6).

> Map-based alternative: if we prefer a literal `Map<id → slot>` with a
> monotonic never-reused counter (closer to the original "Map-based" phrasing),
> it needs an int-keyed dictionary primitive Ranger doesn't currently expose for
> typed registries, and a plain id→slot array would re-introduce the growth
> leak. The generation-packed handle gives the same external guarantees
> (stable id, stale rejection) **plus** memory reuse, so it is the recommended
> primary. Both are drop-in behind the same `EntityRegistry` API.

### Proposed API (one reusable core)
```
class EntityRegistry<T> {           ; conceptually; Ranger is monomorphic, see note
    fn create(obj:T) : int          ; -> handle (never 0)
    fn resolve(handle:int) : T      ; -> obj or null if stale/freed
    fn alive(handle:int) : boolean
    fn destroy(handle:int) : void   ; frees slot, bumps generation
    fn count() : int                ; live count
    fn forEach(...) : void          ; iterate live slots (for render walks)
}
```
Ranger note: since Ranger classes aren't generic, land **one** concrete registry
over the shared base type actually stored. In the Three host every registered
object is a `ThreeObject3D` (scenes/cameras/lights/meshes/groups all derive from
it) or a resource (`ThreeBufferGeometry` / `ThreeMaterial`). Cleanest split:
- `EntityRegistry` over `ThreeObject3D` (replaces the `entities` array), and
- either two thin resource registries over geometry/material, **or** a single
  small generic-by-hand handle-pool helper the three registries embed.

## 3. Wiring `ThreeSceneHost` (backward-compatible)

The public handle-based method surface (`meshNew`, `entityAt`, `entityRemove`,
…) **stays identical** so every caller — `three_tsx_bridge.rgr`,
`three_native_bridge.rgr`, `web/web_tsx3d_host.rgr`, and all
`three/tests/**` — keeps compiling unchanged. Internally:

| Today | After |
|-------|-------|
| `push entities m; return (array_length entities)` | `return entities.create(m)` |
| `itemAt entities (h-1)` in `entityAt` | `entities.resolve(h)` |
| `entityRemove`: `scene.remove(obj)` only | `scene.remove(obj)` **and** `entities.destroy(h)` |
| reconciler rebuild orphans old slot | `destroy` reclaims it; new `create` may reuse it |

The reconciler at `three_tsx_bridge.rgr:586` needs **no change** — it already
calls `entityRemove` then rebuilds; once `entityRemove` frees the slot, the leak
is gone for free. Geometry/material handles get the same treatment if we choose
to registry-ize them (optional; they are append-only today and lower-risk).

## 4. Tests

- New `three/src/three_entity_registry_test.rgr`: create → resolve → destroy →
  resolve-returns-null; generation rejection (destroy then resolve old handle);
  free-slot reuse; count accuracy.
- Extend `three/src/three_scene_host_test.rgr`: after an `entityRemove`,
  `entityCount()` reflects the free (not monotonic growth), and the freed handle
  no longer resolves.
- A reconciler regression: N signature-change rebuilds keep live-entity count
  bounded (proves the leak is closed).

## 5. Phasing (so each step is independently reviewable / shippable)

1. **Phase 1 — Registry core + Three host.** Land `EntityRegistry`
   (`three/src/three_entity_registry.rgr`), route `ThreeSceneHost.entities`
   through it, fix `entityRemove` to free, add tests. *Self-contained; matches
   the branch name; no external API change.*  ← the concrete deliverable
2. **Phase 2 — Resource handles.** Optionally route geometry/material (and
   scene/camera) through the same pool for one uniform mechanism.
3. **Phase 3 — De-duplicate `model3d`.** Retire `model3d/EntityModel.rgr`'s
   parallel registry onto the shared core (touches `ModelLoader` + `model3d`
   tests). Bigger blast radius; separate PR.
4. **Phase 4+ (out of scope here).** Runner consolidation
   (`WasmGameRunner`/`GameRunner`) and folder reorg — tracked separately; large,
   invasive, needs its own plan.

## 6. Known limits / future
- **32-bit now.** Wrap bound documented in §2; widening to 64-bit is a later,
  mechanical change (two i32 words or a wider int type) behind the same API.
- **Cross-registry type safety** is by convention (a geometry handle used as an
  entity handle isn't type-checked); acceptable, matches today's behavior.

---
*No code changed by this document. Phase 1 is ready to implement on request.*
