# THREE_BRIDGE — driving Three onto a single host-owned registry (interpreter + WASM convergence)

> Status: **migration proposal** (target spec, not yet implemented). Companion to
> [`IDEAL_THREE.md`](./IDEAL_THREE.md) (the object model + the generic reconciler
> rule §5) and [`IDEAL_3D.md`](./IDEAL_3D.md) (the host-owned scene/entity/resource
> ownership model the WASM path targets). The physics side already ships the end
> state — see [`physics/tsx`](./physics/tsx/README.md) as the worked reference.

## 1. Why this change

Today the two Three front-ends drive **different object graphs**, so they can
never converge on shared state:

- **Interpreter path** — `three/tsx/three_tsx_bridge.rgr` (`ThreeTsxBridge`) is a
  generic reconciler that builds **bridge-private** objects: `def scene:ThreeScene`
  + `def nodes:[ThreeObject3D]` owned by the bridge instance.
- **WASM path** — `IDEAL_3D` / `lib/ranger_game/src/scene.rs` drives a **separate**
  host-managed `EntityId` registry (`runtime/rg_wasm_bridge.c` + `gfx_sdl.rgr`).

`IDEAL_THREE` §3's "same object model" means the same class *code*, not the same
live *instances*: the interpreter builds one set of `ThreeMesh`es, a WASM build
builds another in linear memory. **Same code, different state.**

The goal of this change: **one authoritative host-owned registry that every
front-end (interpreter, WASM, Rust, native) issues commands against**, so a WASM
guest and an interpreter guest converge on the *same* scene after each refresh
cycle. This is exactly the ownership model `IDEAL_3D` §1 already mandates ("Ranger
owns the scene graph, the entity registry, and every GPU resource; the guest only
issues creation/mutation commands and holds opaque handles").

### Decision gate (read before starting)

Do this **only if** you actually want convergent shared state / a single host
scene that multiple front-ends drive. If the interpreter and WASM are meant to be
*independent* ways to run the same engine (never on shared live state), then two
stacks is acceptable and §3 stands — skip this doc.

## 2. The key idea: separate the reconciler's JOB from object OWNERSHIP

The reconciler does two things today, tangled together:

1. **Map the interpreted façade to real objects by type** (geometry/material/light
   /camera/transform) — this is good and stays.
2. **Own those objects privately** — this is what blocks convergence.

Split them. Keep (1); move ownership to a single host registry that the reconciler
*commands* instead of *owns*. The declarative `three.tsx` façade stays unchanged
(so unmodified three.js examples still run) — the reconciler becomes a
**declarative → command translator** over the shared registry.

Contrast with physics: rendering is *declarative* (keep the reconciler, re-point
it), physics is *imperative/stateful* (the façade itself issues commands — the
handle model). Both end at the same place: **one host registry, driven by
commands, holding opaque handles.**

```
  interpreter  three.tsx (declarative) → reconciler ──emit commands──┐
  Rust/WASM    three.rs  (handles)      ───────────────────────────►─┤
  native       Ranger code              ─── direct calls ───────────►─┤
                                                                       ▼
                                          ONE host-owned Three registry
                                          (ThreeScene / ThreeObject3D graph)
                                                       │
                                                 ThreeWebGLRenderer.render
```

## 3. The command ABI (the transport-neutral seam)

Define one stable, integer-handle command surface — the Three analog of
`scene.rs`'s `rg_*` imports and Cannon's `cannon_*` natives. Handles are 1-based
registry indices (0 = null). Sketch:

| command | returns | notes |
|---|---|---|
| `three_scene_new()` | sceneH | allocates a `ThreeScene` in the registry |
| `three_scene_set_background(sceneH, rgba)` | — | |
| `three_camera_set(sceneH, fov, aspect, near, far)` | camH | perspective camera |
| `three_camera_pose(camH, px,py,pz, qx,qy,qz,qw)` | — | position **and** orientation |
| `three_geometry_box(w,h,d)` | geoH | resource; built once, shared |
| `three_geometry_teapot(size, seg, …)` | geoH | |
| `three_material_basic(color, mapPath, side, wireframe)` | matH | resource |
| `three_material_phong(color, specular, shininess, flat, mapPath, envPath)` | matH | |
| `three_mesh_new(sceneH, geoH, matH)` | entH | instance references resources |
| `three_entity_transform(entH, px,py,pz, qx,qy,qz,qw, sx,sy,sz)` | — | re-read each frame (needsUpdate) |
| `three_light_ambient(sceneH, color, intensity)` | entH | |
| `three_light_directional(sceneH, color, intensity, dx,dy,dz, castShadow)` | entH | |
| `three_entity_visible(entH, on)` / `three_entity_destroy(entH)` | — | lifecycle |
| `three_renderer_set(sceneH, toneMapping, exposure, shadowOn)` | — | render policy |

Rules:
- **Resource / instance separation** (`IDEAL_3D` §1 #5): geometry + material are
  `*_new → handle` resources; a mesh *references* them. Loading once and
  instancing many times is a host concern, not a guest copy.
- **Transport encoding:** the interpreter passes `f64` directly (EvalValue carries
  doubles). WASM crosses integers only, so a WASM front-end fixed-point-encodes
  exactly as `scene.rs` does (`FP = 256`, `Q16 = 65536`) — a transport detail, not
  an architecture change. Keep that conversion in the front-end wrapper, never in
  the object model.

## 4. Migration steps

Ordered so the tree stays green at every step (`three/src/run.sh` → ALL PASS,
`-l=cpp` clean).

### Phase 1 — the host registry + command executor
Add `three/src/three_scene_host.rgr` (`ThreeSceneHost`): registry arrays
(`scenes`/`entities`/`geometries`/`materials`), 1-based handles, and one method
per command that builds/updates the real `three/src` objects. Pure Ranger,
`-l=cpp` clean, with `three_scene_host_test.rgr`. This is the direct analog of
`physics/tsx/cannon_native_bridge.rgr`'s registry.

### Phase 2 — expose it to the two transports
- **Interpreter:** `three/tsx/three_native_bridge.rgr` —
  `ThreeNativeBridge extends EvalNativeBridge`, `has(name)`/`invoke(name,args)`
  dispatching every `three_*` command into the one `ThreeSceneHost`. Mirror
  `CannonNativeBridge` exactly (arg coercion helpers, handle resolution).
- **WASM:** a `three.rs` (or extend `scene.rs`) whose `Entity(i32)` / `Model(i32)`
  handles are the *same* registry ids, forwarding to the `three_*` host imports.

Both must call into the **same** `ThreeSceneHost` instance for a given host, so the
registry is shared.

### Phase 3 — re-point the reconciler (the core change)
In `ThreeTsxBridge`:
- **Delete** `def scene:ThreeScene` and `def nodes:[ThreeObject3D]` private
  ownership.
- Keep the by-type mapping and the `nodeSigs` / rebuild-on-signature-change
  (needsUpdate) logic — but have each branch **emit a `three_*` command** to the
  shared host instead of mutating a private object. On first sight of a façade
  child: `three_mesh_new(...)` and cache the returned handle; each frame:
  `three_entity_transform(handle, …)`; on removal from `scene.children`:
  `three_entity_destroy(handle)`.
- Keep **count-and-warn** (`unsupportedCount` / `fallbackTextureCount`) — never
  silently fake (§5).

The reconciler is still the one generic reconciler; it just stops owning objects.

### Phase 4 — render from the shared registry
`ThreeWebGLRenderer.render` walks the `ThreeSceneHost`'s scene (by `sceneH`), not a
bridge-private `ThreeScene`. Now the frame reflects whatever front-end issued the
commands.

### Phase 5 — verify convergence (the point of the whole change)
Add `three/tsx/three_convergence_test.rgr`:
1. Drive a scene through the **interpreter** front-end (load `three.tsx` + a scene,
   tick N frames). Snapshot the host registry (entity count, transforms).
2. Reset a fresh host; drive the **same** scene through a **direct `three_*`
   command sequence** (simulating the WASM/Rust guest). Snapshot.
3. Assert the two snapshots are **identical** — same entities, same transforms,
   same materials. That proves both front-ends land on one registry and converge.
4. Bonus: drive the *same* host from both front-ends interleaved; assert the final
   state is front-end-independent after one refresh cycle.

### Phase 6 — delete the parallelism
Once the teapot/Sponza plumbing (`WebTeapotTsxHost`, `ThreeSponzaScene`) binds to
the shared registry via handles, remove any remaining bridge-private object
construction. There must be exactly one registry and one reconciler.

## 5. Guardrails (non-negotiable — inherited from §5 + IDEAL_3D)

- **One generic reconciler. No per-demo `*_tsx_bridge`.** Adding an example must
  not add a bridge (`IDEAL_THREE` §5).
- **Host owns the registry and every GPU resource; front-ends hold opaque handles
  only.** No guest-built scene block, no `rg_*_ptr` raw-memory publishing
  (`IDEAL_3D` §1).
- **Count-and-warn on anything unsupported; never silently fake.**
- **Object model stays pure Ranger** (compiles to ES6 **and** C++/WASM); GPU work
  stays in the backend via templates; shaders stay GLSL ES 1.00.
- **The command ABI is a transport**, game-neutral, no frozen taxonomies (mirror
  `scene.rs`'s "this module is a TRANSPORT" rule).

## 6. Reference implementation (physics, already shipped)

The physics side is the end state in miniature — copy its shapes:

- `physics/tsx/cannon_native_bridge.rgr` — `CannonNativeBridge extends
  EvalNativeBridge`; a handle registry (`worlds`/`bodies`/`shapes`) over the real
  engine; `has`/`invoke` command dispatch. **This is the template for
  `ThreeNativeBridge` + `ThreeSceneHost`.**
- `physics/tsx/cannon.tsx` — a handle façade (physics is imperative, so the façade
  itself issues commands). For Three, keep the façade **declarative** and let the
  reconciler emit the commands instead — the only structural difference.
- `physics/tsx/cannon_tsx_bridge_test.rgr` — drives the real engine through the
  interpreter and asserts the outcome. The template for the convergence test.

Because Cannon already routes every guest action through one host registry, an
interpreter physics scene and a future WASM physics guest driving the same
registry converge for free. This doc brings Three to the same property.

## 7. Risks / fallback

- **Big blast radius:** the reconciler feeds every Three example (cube, cubes,
  teapot, Sponza) and both hosts. Land Phases 1–2 (add the registry + bridges)
  behind the existing path first, prove them with unit tests, then switch the
  reconciler (Phase 3) and delete the private path (Phase 6) last.
- **Incremental backing-store swap:** as an intermediate, `ThreeSceneHost` can wrap
  the *existing* private `ThreeScene` first (no behavior change), then have both
  the interpreter and a command-driven test hit it — proving the seam before the
  WASM front-end exists.
- **Renderer coupling:** confirm `ThreeWebGLRenderer` can render an externally-owned
  `ThreeScene` (it should — it already takes `render(scene, camera)`), so Phase 4
  is a pointer change, not a renderer rewrite.
