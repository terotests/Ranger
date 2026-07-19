# CODE_CLEANUP — current inventory and target design

## How to read this document

| Section | What it is |
|---------|------------|
| **0.x** | **Current state.** Concrete duplication and game-leak examples with file/line refs. |
| **Vertex data flow** | **Target design only.** How one vertex should travel once the architecture lands. Not a description of today's behavior. |
| **I. File-system map** | **Current state → move list.** Where core code lives today, and which directory each piece moves to. |
| **II–V + lifetime / guest libs** | **Design that closes the gaps.** Each subsection starts from today's code, then states the change. |
| **Architecture decisions** | Binding choices from design review — resolve conflicts before implementation. |
| **Affected components / Decisions** | Work inventory and recorded choices. |

Claims in 0.x were re-checked against `master` (2026-07-19). Design chapters below
incorporate a later architecture review; **do not implement the registry until
the P1 decisions in "Architecture decisions" are satisfied.**

## Review notes (verified against master)

Corrections applied while reviewing this plan:

1. **`wasm_physics_runner.rgr` line map drifted.** Autopeli imports are at lines **12–13** (not 11–12); `assetsDir` / `worldH` / `camSmoothP2` at **33 / 36 / 40**; HUD progress formula at **855** still holds.
2. **CapGate wiring is wider than the draft said.** `WasmCapGate` is used by `wasm_game_runner`, `wasm_physics_runner`, **and** `sprite_wasm_runner`. It is still missing from `wasm_sprite_runner` / `as_source_runner` / `as_sprite_runner` — those guests can still read zeroed capability memory.
3. **File counts on master:** `scripting/game_*.rgr` = **49** (was 40); `*_runner*.rgr` = **31** (was 28); `three/src/*.rgr` = **86** (was 87); ComponentEngine importers from game_engine ≈ **48**.
4. **`useAs` flag** is defined independently in **three** files (`wasm_abi_io.rgr`, `game_ui_runner.rgr`, `wasm_physics_runner.rgr`), not two.
5. **Host geometry vs native bridge:** `ThreeSceneHost` exposes **10** constructors (`geometryBox/Teapot/Plane/Circle/Ring/Sphere/Cylinder/Cone/Torus/TorusKnot`); `ThreeNativeBridge.invoke` still only handles **Box + Teapot**. Claim kept; names listed so the gap is checkable.
6. **Parity false-pass mechanism:** `matchField` calls `ev.toNumber()`; `EvalValue.toNumber()` returns **0.0** for null/undefined/object. So a missing probe that should be `0` compares equal to golden `0` without a type check. The draft's "null→0" wording was directionally right; the mechanism is `toNumber()`, not an explicit coerce in `matchField`.
7. **`buildMeshH` is at line 810** (not ~560). It still always calls `buildGeometryH` / `buildMaterialH` with no identity lookup — shared façade geo/mat mint new host resources per mesh.
8. **`cannon_mat3.rgr`** is used inside physics (`cannon_body.rgr` + tests) but still by nothing in `scripting/` or the camera path — the "unused as a camera" claim stands.
9. **`old/ylos` still exists** under `gallery/game_engine/old/ylos` (not removed). Treat as delete-candidate, not already gone.
10. **Vertex chapter stays target-only.** Do not read Stages 1–4 as current behavior; today's TSX path goes façade → index-keyed reconciler → `ThreeSceneHost` append-only handles; today's WASM 3D path still has a legacy `rg_mesh_ptr` mode in `wasm3d_runner.rgr`.

Open layout questions (not architecture blockers):

- **C1:** Should `three/`, `physics/`, `model3d/` move under `core/` or stay siblings?
- **Class registry storage:** `.rgr` table vs data file (type system is decided below).

---

# Architecture decisions (binding — from design review)

These resolve conflicts that would otherwise make the rest of this document an
unsafe implementation contract. Treat them as decisions, not options.

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


# Current state: duplication inventory

When a generic engine path needs something only a game knows, the usual response
has been a shortcut: import the game, copy a shared module into the game folder,
or hardcode the game's names/numbers in the runner. The demo ships; the next
feature builds on the shortcut. The inventory below lists the live cases.

A second failure mode (0.21): a correct replacement lands, but the old path is
not deleted, so the engine now has two systems.

---

## Category A — game-specific code inside generic engine code

### 0.1 wasm_physics_runner.rgr contains autopeli imports and constants

`scripting/wasm_physics_runner.rgr` presents itself as the generic WASM physics
runner. What the file actually contains:

```
line 12:  Import "./wasm_autopeli_setup.rgr"        ; a specific game's world
line 13:  Import "./wasm_autopeli_render.rgr"        ; a specific game's rendering
line 33:  def assetsDir:string "gallery/game_engine/games/autopeli_wasm"
line 36:  def worldH:int 6000                        ; autopeli's track length
line 40:  def camSmoothP2:double 5860.0              ; autopeli's camera anchor
line 855: (idiv ((6000 - (to_int car.y)) * 100) 6000)  ; autopeli's progress bar
```

A second physics game cannot use this runner without editing it. The imports at
lines 12–13 are the decision that made the later constants (track length, camera
anchor, progress formula) land in the "generic" file.

### 0.2 Three HUD implementations, selected inside wasm_physics_runner.rgr

The engine has three unrelated ways to draw a HUD, and `wasm_physics_runner.rgr`
chooses between all three at runtime:

1. **The guest's RGU1 UI document** — the guest writes a retained-mode UI block,
   the host validates and renders it (`scripting/wasm_ui_io.rgr`; selected at
   `wasm_physics_runner.rgr:814–841`, flag `useWasmHud`).
2. **The TS `hud()` path** — a JSX tree composited by `GameHudBlitter`
   (`scripting/game_hud.rgr`), which supports only View backgrounds and Label
   text in a 3×5 bitmap font.
3. **A hardcoded autopeli HUD** — `wasm_physics_runner.rgr:844–890` (`drawHudOn`)
   draws speed, progress, hits, grip, oil and air bars with raw `fillRect`
   calls. The bars' meanings (grip, oil, air) are autopeli game design living in
   the "generic" runner as the fallback.

Meanwhile the rich EVG renderer (TTF fonts, borders, widgets) exists but is used
only for menus. Three render paths, three capability ceilings, and the fallback
is a specific game's dashboard (IDEAL.md §2.15).

### 0.3 Sound id-to-name mappings hardcoded in three host files

The ABI transports a sound event as an integer `sub` id, and the header now
correctly says the id indexes a game-registered palette. But no registered
palette crosses the boundary — instead each host path hardcodes its own
integer→name ladder:

- `scripting/as_sprite_runner.rgr:64–70` — `1 → "blip", 2 → "brick",
  3 → "win", 4 → "lose"`.
- `scripting/wasm_physics_runner.rgr:300–308` — `1 → "wall", 2 → "bounce",
  3 → "win"` (a different vocabulary for the same id numbers).
- `scripting/game_scene_provider.rgr:77–79` — `soundName(sub)` stub returning
  `""`.

The names themselves are then restated a second time where the sounds are
registered (`scripting/game_audio.rgr:247–251` registers
`"brick"/"bounce"/"wall"/"lose"/"win"`). The same guest id can mean a different
sound depending on which runner happens to load the game (IDEAL.md §2.10, §4).

### 0.4 Particle preset duplicated; guest particle ids overridden

Two reroutes stacked:

- The one shared preset is a **verbatim copy**: `game_particles.rgr:142–181` and
  `wasm_sparkle_pool.rgr:88–127` contain the same sparkle spawner — identical
  count clamps (`≤0→12`, `>28→28`), the same angle range `0…6.283185307`, speed
  `0.06…0.22`, life `200…420 ms`, size `1.5…4.0`, and the same four hardcoded
  colors. A tuning change in one file silently does not apply to the other.
- The WASM path then discards the guest's intent: a particle event's sub-id is
  overwritten with `ev.id = "sparkle"` (`wasm_physics_runner.rgr:318–319`), and
  `game_scene_provider.rgr:81–83` returns `"sparkle"` for every sub-id. A guest
  cannot ask for any other effect, so the next game's explosion will be a
  sparkle until someone adds another hardcoded case (IDEAL.md §2.18).

### 0.5 Sponza-specific accessors in three_tsx_bridge.rgr

`three/tsx/three_tsx_bridge.rgr` is the one generic TSX→host reconciler. It also
contains:

```
line 154: fn sunLight:ThreeDirectionalLight () { return reconciledSun }
line 156: fn skyNode:ThreeSky ()              { return reconciledSky }
line 158: fn modelNode:ThreeObject3D ()       { return reconciledModel }
```

The file's own comments say where this came from: the per-demo `ThreeSponzaScene`
class was deleted and its recipe "now lives in the one generic reconciler"
(lines 120, 1033, 1079). The demo-specific class was removed **in name only** —
its content rerouted into core, where every future rendering technique (probes,
fog, post-processing) will want its own accessor next to `sunLight()`.

---

## Category B — data defined in more than one place

### 0.6 World geometry defined separately in host and guest

The autopeli road and traffic exist in **two unrelated source files in two
languages**, one on each side of the WASM boundary:

- Host: `scripting/wasm_autopeli_setup.rgr` — `roadHalf = 126` (line 10),
  narrowing to `112` (line 187), with interpolation logic (line 217).
- Guest: `games/autopeli_wasm/src/src/lib.rs` — `TRAFFIC_COUNT: i32 = 15`
  (line 53), a 15-entry `TRAFFIC` table (line 269).

Nothing checks these against each other. Change one and the game does not error
— physics and rendering just quietly disagree (IDEAL.md §5).

### 0.7 Voice-effect list maintained in three files

The 11 vocal effects (`laugh, giggle, chuckle, sigh, gasp, cough, cheer, boo,
hmm, huh, yawn`) are hardcoded, in the same order, in:

1. `scripting/game_vocal_fx.rgr:78–88` — the canonical list.
2. `scripting/engine.d.ts:425–436` — restated as the `VoiceEffectId` union type,
   **and again** at lines 659–669 as eleven `declare function` helpers.
3. `scripting/game_vocal_fx_bridge.rgr:30–42` — restated as an
   `if (name == "laugh") … if (name == "yawn")` ladder in `has()`.

Adding one effect means editing three (arguably four) lists; missing one produces
no error, just a voice that works on some paths and not others.

### 0.8 Shared script modules copied per game folder, diverged

Games import the Three.js façade as `import * as THREE from 'three'`. The
interpreter resolves the bare name by checking **the game's own folder first**
(`gallery/pdf_writer/src/jsx/ComponentEngine.rgr:1160`), so each 3D game copied the façade in:

| Copy | Lines |
|------|-------|
| `three/tsx/three.tsx` (canonical) | 585 |
| `games/cube/three.tsx` | 350 |
| `games/cubes/three.tsx` | 350 |
| `games/sponza/three.tsx` | 337 |
| `games/teapot/three.tsx` | 237 |

A bug fixed in one copy stays broken in the other four. The interpreter already
supports shared search directories (`assetPaths`, same function, line 1170) —
the copies exist because copying was the shortcut that worked that day. The same
has happened to `game_helpers.tsx` and `game.d.ts` (in both `scripting/` and
`lib/`) and `breakout_bricks.tsx` (`scripting/` and `games/breakout/` hold
byte-identical 127-line copies — identical *today*, one edit away from drifting).

### 0.9 Games duplicated across folders and variants

The duplication is not only inside the engine — entire games are copied:

- **Pong exists five times**: `games/pong/index.tsx` (213 lines, TSX),
  `scripting/pong.game.tsx` (216 lines, a diverged near-copy),
  `ranger_games/pong_core.rgr` + `pong.rgr` + render/SDL/native runners (static
  Ranger, 7 files), `games/ranger_pong/` (Ranger→WASM), and `games/rust_pong/`
  (Rust→WASM). Some of these are deliberate portability proofs — but the two
  TSX variants are just an unmerged copy.
- **Four games live in both `scripting/` and `games/`**: `breakout`, `invaders`,
  `pacman`, `pong` each have a `scripting/<name>.game.tsx` *and* a
  `games/<name>/` folder.
- **The ylos series is versioned by copying the whole game**: `ylos3` and
  `ylos4` share the same file list; their `index.tsx` differs by 7 lines while
  `ylosN_shared.tsx` has diverged from 2,564 to 3,153 lines — the shared module
  was copied and then grew separately. `ylos2` is an earlier 2,204-line
  monolith, and `old/ylos` is a fourth generation still on disk under
  `gallery/game_engine/old/ylos`.

Version control exists; versioning by folder copy means every bug fixed in
`ylos4` is still present in `ylos2` and `ylos3`.

---

## Category C — subsystems implemented multiple times

### 0.10 Vector math implemented five times in three languages

| Implementation | Where | Language |
|----------------|-------|----------|
| `three_vector3.rgr` | `three/src/` | Ranger |
| `cannon_vec3.rgr` | `physics/src/` | Ranger |
| `GltfMath.rgr` | `model3d/` | Ranger |
| `scene.rs` (`Vec3`, `Quat`) | `lib/ranger_game/src/` | Rust |
| `three.tsx` (small Vector3 subset + duplicated Object3D-shaped state across Scene/Group/Mesh/…) | `three/tsx/` + 4 game copies | TSX |

Numerical fixes and conventions (handedness, Euler order, normalization edge
cases) do not propagate between them.

### 0.11 Three entity registries, none shared

- `three/src/three_scene_host.rgr` — five parallel arrays, handle = array
  index, removal never frees the slot.
- `model3d/EntityModel.rgr` — a second `EntityRegistry`, also id = array index.
- `scripting/game_entity_store.rgr` — a third store keyed by string ids for 2D
  world games.

All three lack the same things (stable ids, safe removal, type information), and
fixing one fixes nothing for the other two. The entity-registry chapter replaces
all three with one registry.

### 0.12 Five input encodings; the host bit layout differs from the other four

The same D-pad + buttons concept is encoded five times (IDEAL.md §2.9):

| Representation | Players × buttons | Bit layout |
|----------------|-------------------|------------|
| `wasm/wasm_game_abi.h` (RGW1 `input`/`input_p2`) | 2 × 5 | `UP=1 DOWN=2 LEFT=4 RIGHT=8 ACTION=16` |
| `wasm/wasm_sprite_abi.h` (RGSP1) | 2 × 6 | same as RGW1 (`+BACK=32`) |
| `wasm/wasm_input_abi.h` (RGIN) | 8 × analog+pointer | same base bits |
| `lib/ranger_game/src/input.rs` (guest `Buttons`) | — | same base bits |
| `scripting/game_input.rgr` (host `InputMask`) | 8 × 12 | **`ACTION=4 QUIT=8 LEFT=16 RIGHT=32 …`** |

Four representations agree on the bit values; the host's own `InputMask` uses a
**conflicting layout** for the same buttons. Every host↔ABI crossing therefore
requires a translation, and getting it wrong is silent. (RGIN also illustrates
the half-landed-fix pattern — see 0.21.)

### 0.13 Three body-to-visual binding mechanisms

How a moving thing gets drawn depends on which path the game took (IDEAL.md §2.5):

1. **Host template mapping** — `scripting/wasm_autopeli_render.rgr` keeps
   `WasmVisualEntity` templates and maps them by string id
   (`findTemplate`/`spawnVisual`, lines 188/225); the host pushes body poses into
   the visuals each frame.
2. **RGSP1 character slots** — `scripting/wasm_sprite_runner.rgr` reads
   guest-written slots (`charId/anim/dir/xFp/yFp`) and resolves sheets through
   the LPC catalog — with **no link to any physics body** (the file has no RGW1
   import at all).
3. **The `.as` draw list** — `scripting/as_abi_bridge.rgr:36–40, 356` lets the
   guest push `drawSprite(tpl, x, y, angleDeg, frame)` calls into native arrays;
   the guest authors the transform directly, no physics in between.

A game written once does not bind the same way on the other backend.

### 0.14 Three animation frame mechanisms; one time-based

1. `ui/UIAnimator.rgr` — host-only glow/pulse effects with an `elapsedMs` clock
   and an `.after` completion callback (lines 78, 174–184).
2. RGSP1's per-slot clock — the only real time→frame computation:
   `wasm_sprite_runner.rgr:121–146` (`animFps`: walk 9, run 13, jump 10;
   `timedFrame = clockMs × fps / 1000 mod frames`).
3. RGU1 — no retained animation at all: any change re-emits the entire UI
   document (`as_abi_bridge.rgr:161–267` zeroes and re-adds every node).

The other sprite paths don't keep time — `game_sprite.rgr` takes a frame index
from the guest (`p0`), and the `.as` draw list takes `frame` per call. Three
mechanisms, three capability ceilings, no shared tween/easing/completion model
(IDEAL.md §2.12).

### 0.15 Three sprite-sheet registration paths

1. `scripting/game_sprite.rgr` — TS-path sheet defs (`shFrameW/shCols/…`,
   lines 58–66, loaded at 336), drawn by sub-rect blit or GPU sprites.
2. `scripting/wasm_sprite_runner.rgr` — RGSP1 catalog sheets resolved as
   `slug + "/walk.png"` (line 207) via the LPC character catalog.
3. `scripting/as_abi_bridge.rgr:306–313` — the `.as` `hostSheet`/`hostRect`
   native-array manifest.

Three ways to tell the engine "here is a sheet of frames," none shared, and the
emitted `atlas.json` from the packing pipeline is ignored at runtime
(IDEAL.md §2.8).

### 0.16 Three camera systems; the ABI transports camera_y only

1. **Integer pan** — `scripting/game_camera.rgr:27–28` (`camX/camY`) with the
   literal `screen = world − cam` subtraction in `game_runtime.rgr:1076–1085`.
2. **A real pan/zoom/rotate matrix camera** — exists only on the GLES2 sprite
   overlay (`gfx_sdl.rgr:842–863`, `rgfx_gpu_camera_set`), wired from exactly
   one caller (`game_sprite.rgr:117`), **off by default**, and the software
   fallbacks ignore it entirely (`gfx_sdl.rgr:1814`).
3. **A full Mat3 library** — `physics/src/cannon_mat3.rgr` (472 lines), imported
   by nothing outside `physics/src/`.

And the shared ABI carries only `camera_y` — a guest cannot even pan
horizontally through the transport (IDEAL.md §2.17).

### 0.17 Three physics paths, two vehicle implementations, one unused interface

- **Path 1:** `scripting/physics_core.rgr` (701 lines, arcade 2D) behind the
  `game_physics.rgr` facade — what games actually use.
- **Path 2:** the full Cannon port under `physics/src/` behind the
  `physics_world.rgr` interface, with `arcade_physics_world.rgr` as a second
  implementation — and **no game or scripting file imports the interface**
  (grep: its only importers are the two implementations and the test).
- **Path 3:** `scripting/game_cannon_physics.rgr` — the TS bridge that imports
  the Cannon solver but then fights it: hand-rolled `clampBody`/`clampArena`
  position resets run every step (lines 961–1015) instead of letting the solver
  own boundaries.

Vehicles exist twice: `scripting/physics_vehicle.rgr` (arcade wheel plugin, 164
lines) and `physics/src/cannon_vehicle.rgr` (raycast suspension model, 161
lines, reachable only from tests). IDEAL.md §2.5's interface seam was built —
then never connected (see 0.21).

---

## Category D — features available on one guest path only

These features exist on one guest path only. The game still runs on the other
path; the feature is missing with no error (IDEAL.md §2):

### 0.18 API set differs between the .as and compiled-WASM paths

`scripting/as_abi_bridge.rgr` (64 functions) exposes the guest draw list
(`drawSprite`), the host resource manifest (`hostSheet`/`hostRect`), and the
sound queue (`playSound`) as native-array APIs. `scripting/wasm_abi_io.rgr` (57
functions) — the compiled-WASM equivalent — has **none of them** (zero matches
for any of those names). A game that uses sprites-by-manifest or sounds, written
once, behaves differently compiled vs interpreted.

### 0.19 Voice, music, navigation and persistence exist on the TS path only

- **Voice/music** — `playVoice` flows only through the TS event bridge
  (`game_vocal_fx_bridge.rgr:59`); music only via the TS `startMusic`/soundscore
  path (`game_soundscore.rgr:503–522`). The binary ABI has no encoding for
  either (IDEAL.md §2.10).
- **Screen navigation** — `loadGame`/`pushGame`/`popGame` exist only as
  host-native string invokes on the TS path
  (`game_host_native.rgr:114–176` → `pendingNavOp` → `game_sdl_runner.rgr:1231`).
  No ABI slot exists; every transition is a full teardown + `initState()`
  reload, with no suspend/resume (IDEAL.md §2.13).
- **Persistence** — `saveGameData`/`loadGameData`/`resetGameData` are a TS-path
  native bridge only (`game_host_native.rgr:124–187`,
  `game_persistence.rgr:5`); a WASM or `.as` guest cannot save
  (IDEAL.md §2.11).

### 0.20 RGX1 and RGLD blocks have no shared header

`RGX1` (streaming) and `RGLD` (loader) are used by
`scripting/streaming_world_runner.rgr` and `wasm/rust_worker/src/lib.rs`, but
`wasm/` contains only five headers (game, input, pose, sprite, ui) — the
streaming and loader blocks exist purely as conventions in two codebases that
must agree byte-for-byte with no shared definition (IDEAL.md §2.7).

---

## Category E — partially completed fixes and deferred semantics

### 0.21 Completed fixes whose old paths were not removed

Each item below is a correct replacement that shipped without deleting the old
path, so both now coexist:

- **The capability gate** (`wasm_cap_gate.rgr`) is wired into
  `wasm_game_runner`, `wasm_physics_runner`, and `sprite_wasm_runner` — but not
  `wasm_sprite_runner`, `as_source_runner`, or `as_sprite_runner`. Guests on the
  ungated paths still read zeroed memory when a capability is missing
  (IDEAL.md §2.14, §6).
- **The generic control channel** landed in `as_abi_bridge.rgr` as
  `writeControlChannel` (line 116) — and the car-shaped
  `writeControl(steer, throttle, brake, grip)` still sits directly below it
  (line 121), while the compiled path still reads
  `readControlSteer/Throttle/Brake/Grip` (`wasm_abi_io.rgr:234–246`). The
  genre-neutral fix and the car vocabulary now coexist (IDEAL.md §2.2).
- **The `PhysicsWorld` interface** was built with two conforming engines — and
  no game or runner imports it (0.17). The seam exists; nothing goes through it.
- **The RGIN input ABI** was created to fix RGW1's two-bitfield input — its own
  header says so ("RGIN is the one typed per-player input surface that closes
  that gap") — but RGW1's `input`/`input_p2` words and RGSP1's copies remain,
  so the fix is now the **fifth** input representation (0.12).
- **The RGCQ resolver** (`game_env_resolver.rgr`) exists to answer the typed
  capability query that IDEAL.md problem #7 called inert — the byte plumbing is
  in place but it is not called from every runner.
- **The host↔native-bridge command surface** drifted the same way: the host
  gained 10 geometry constructors; `ThreeNativeBridge.invoke` still exposes 2
  (Box, Teapot). The new commands landed on one face of the bridge only.

Definition of done for migrations in this plan: the old path is deleted in the
same change that enables the new one.

### 0.22 EvalValue object equality returns false; downstream effects

`gallery/pdf_writer/src/jsx/EvalValue.rgr:540`:

```
; Arrays and objects - reference equality for now
return false
```

Because object equality returns false, `a === a` is false in game scripts, and
`Map`/`Set` cannot key on objects. Concrete fallout in the Three path:

- Façade removal uses a `__removed` flag (`three.tsx:60,67,71`) instead of
  identity.
- The reconciler stores `nodeHandles:[int]` keyed by `scene.children[i]` and
  `subHandles` in DFS order, with an explicit comment that it "Assumes a stable
  tree shape" (`three_tsx_bridge.rgr:77–89`).

Until `EvalValue.equals` uses a stable id, neither a keyed reconciler nor a live
adapter can prove "same script object → same host handle."

### 0.23 Inconsistent logging prefixes and scattered feature flags

- Log lines are bare `print` calls with ad-hoc bracket tags — nine distinct
  prefixes across `scripting/` (`[game-engine]`, `[split-screen]`, `[menu]`,
  `[sprite-demo]`, `[wasm]`, `[wasm3d]`, `[tsx3d]`, `[poc]`, `[as]`), with
  single files mixing several. No severity levels, no way to filter
  (IDEAL.md §2.16).
- Feature toggles are scattered booleans: `hotReload` in `game_runtime.rgr:41`,
  `useAs` defined **independently in three files** (`wasm_abi_io.rgr:17`,
  `game_ui_runner.rgr:49`, `wasm_physics_runner.rgr:65`), and
  `game_runner_mode.rgr:6` documents the runner
  state as "a set of INDEPENDENT booleans (useWasmRunner, useWasmPhysics,
  useSpriteRunner, useStream, wasmSplit…)" — contradictory states are
  representable, which is the illegal-state bug class IDEAL.md §0.1 records as
  already having caused real failures.

---

## 0.24 Build and test rules derived from the inventory

Counterexample that worked: pose input (RGP1) once had per-producer layouts;
now one header (`wasm/wasm_pose_abi.h`) is shared byte-for-byte (IDEAL.md §2.4).
Rules below make the failure modes above fail CI or compile:

- **A runner receives the game, never imports it.** Games bind through the
  provider/scene interface. Enforced mechanically: a CI grep fails the build if
  a file under `core/` names a game in its filename or imports one
  (kills 0.1, 0.5, and the HUD/sound/particle inlining of 0.2–0.4).
- **Every vocabulary is registered data, not a code ladder.** Sound names,
  particle effects, voice effects, character rosters: the game registers them
  once; core dispatches by table lookup. A grep for `sub == 1`-style ladders and
  duplicated name lists backs it (kills 0.3, 0.4, 0.7).
- **Every world/scene fact has exactly one owner.** The guest declares it; the
  host reads it through the ABI. A conformance fixture runs one game on both
  paths and diffs the block bytes (kills 0.6).
- **Shared modules resolve from one place.** The façade and helpers live once on
  the shared search path; a duplicate-basename check in CI flags a game-local
  copy of a shared module — and flags a game copied whole into a sibling folder
  (kills 0.8, 0.9).
- **One definition per class and per subsystem, all faces generated.** The class
  registry is the single source for classes/methods/props; the
  interpreter façade, Rust/AS guest structs, and every bridge surface are
  generated from it, with a surface-parity test that fails on drift
  (kills 0.10, and the command-surface drift in 0.21).
- **One entity registry** with stable generation-tagged ids and type ids
  (entity-registry chapter) backs the Three host, `model3d`, and the world store
  (kills 0.11, and gives 0.13's binding one identity to hang on).
- **One representation per concept across the boundary.** Input, camera,
  sheets, animation each get one typed surface in the contract, and the old
  encodings are deleted as part of the change (kills 0.12, 0.14–0.16).
- **Parity is tested, not promised.** A fixture game exercises sprites, sound,
  persistence, and navigation on the compiled and interpreted paths and asserts
  identical behavior — a feature that exists on one path fails the suite
  instead of silently missing (kills 0.18–0.20).
- **A fix is finished when the old path is deleted.** Every migration in this
  plan lists the files it retires, and the PR that lands the new path removes
  the old one or is not done (kills 0.21 — the half-landed-fix trap).
- **No silent "for now" in the value model.** The interpreter semantics get
  their own test suite (`component_engine_js_semantics_test`, the Three object-model chapter) so a
  deferred semantic — identity, `undefined`, Map/Set keys — is a red test, not
  a comment (kills 0.22).
- **One log call with a severity and one flag registry** replace the bracket
  tags and the independent booleans; runner mode becomes a single enum so
  contradictory states are unrepresentable (kills 0.23).

## 0.25 Coverage of IDEAL.md use-case areas

| IDEAL.md § | Area | Chapter here |
|-----------|------|--------------|
| §2.1 | ABI taxonomy in headers | largely fixed in headers; residue tracked in 0.3 (sound ids), 0.21 |
| §2.2 | Car-shaped control record | 0.21 |
| §2.3 | RGU1 discipline (the good model) | referenced in 0.2, 0.14 |
| §2.4 | Pose block | the success story — cited in 0.24 |
| §2.5 | Physics, collision, body→sprite | 0.13, 0.17 |
| §2.6 | Dynamic UI (snapshot-only rebuild) | 0.14 (RGU1 re-emit) |
| §2.7 | Resource loaders / streaming | 0.20 |
| §2.8 | Sprite sheets | 0.15 |
| §2.9 | Input & haptics | 0.12 |
| §2.10 | Sound / voice / music | 0.3, 0.19 |
| §2.11 | Persistence | 0.19 |
| §2.12 | Animation systems | 0.14 |
| §2.13 | Screens / view stack | 0.19 |
| §2.14 | Init & capability negotiation | 0.21 |
| §2.15 | HUD | 0.2 |
| §2.16 | Logging & feature flags | 0.23 |
| §2.17 | Camera & matrices | 0.16 |
| §2.18 | Particles & effects | 0.4 |
| §5 | One world, one owner | 0.6 |
| §7 | Mechanically checkable "done" | 0.24 |

Later chapters turn the 0.24 rules into concrete moves: file-system layout (I),
one entity registry (II), class registry + bridge (III–V), lifetime rules, and
generated guest faces.

---

# Vertex data flow: target design

**This chapter is the goal, not the current implementation.**

It follows one vertex — the cube corner at `(+1, +1, +1)` — through the planned
architecture: construct → live attach by handle → render → read back (D-SYNC).
Today's gaps: no stable identity, index-keyed reconciler (temporary), append-only
host handles, dual WASM mesh modes.

Depends on: class registry, live native adapter, typed-arena registry (D-TYPE),
D-LIFE (object / membership / GPU).

Two rules:

- **One copy.** Authoritative coordinates live only in the host geometry arrays.
  Guests and façades hold handles (or temporary read-back buffers), not a second
  source of truth.
- **Bulk crossings.** N vertices cross the WASM boundary in one call. One call
  per float is the failure mode.

## Path diagram — TSX (interpreted)

The interpreted path runs in one process; the "boundary" is the native adapter,
which maps script objects to registry commands. Identity, not memory layout, is
what crosses it.

```
TSX guest script                interpreter (bridge)            host core
────────────────                ────────────────────            ─────────
const g = new THREE.BoxGeometry()
        │
        ▼
façade name "BoxGeometry" ────► native adapter
                                construct(args)
                                       │  command: geometryBox(1,1,1)
                                       ▼
                                ThreeSceneHost ───► ThreeBoxGeometry.setSize
                                       │                 │ pushVertex(+1,+1,+1,…)
                                geoH = (gen|type|slot)   ▼
                                       │           ThreeBufferGeometry
                                       ▼           positions:[double] ◄── ONE copy
g holds EvalValue{ NativeRef geoH, identityId }
        │
const m = new THREE.Mesh(g, mat)
        │  identity(g) → same geoH; meshCreate(geoH,matH)→meshH  [live, D-SYNC]
        ▼
scene.add(m) → entitySetParent(meshH, sceneH)   ; membership, not create-again
        │
render frame:
  (geoH, revision) → 48-byte interleave → GPU buffer   (or software rasteriser)
  uModel(meshH) × (1,1,1) → world position             (computed, never stored)

read-back:
  m.geometry.attributes.position.getX(0)
        │  adapter getProperty / invokeMethod
        ▼
  resolveAs(geoH, GEOMETRY) → ThreeBufferGeometry.getPosition(0,0) → 1.0
```

## Path diagram — WASM (compiled)

The compiled path has a hard memory boundary: only integers and byte ranges
cross it. Every arrow through the wall is one generated import from the class
registry; vertex payloads cross once, in bulk, in each direction.

```
Rust guest (WASM linear memory)      ║ ABI boundary ║        Ranger host
───────────────────────────────      ║ i32 + bytes  ║        ───────────
static VERTS: [f32; 72] = [ … ];     ║              ║
        │                            ║              ║
let geo = scene.geometry_raw(        ║              ║
    &VERTS, &NORMALS, &UVS, &IDX);   ║              ║
        │  rg_geometry_raw(ptr,len ×4)              ║
        ├───────── one crossing ─────╫──────────────╫──► copy ranges out of
        │                            ║              ║    guest linear memory
        │◄──────── geoH : i32 ───────╫──────────────╫─── pushVertex → core arrays
        │                            ║              ║    positions:[double] ◄ ONE copy
let cube = scene.mesh(geo, mat);     ║              ║
        │  rg_create_mesh_entity(geoH, matH)        ║
        │◄──────── meshH : i32 ──────╫──────────────╫─── meshNew + retain(geoH)
        │                            ║              ║
cube.rotation(q);                    ║              ║
        │  rg_set_rotation(meshH, qx,qy,qz,qw)      ║
        ├────────────────────────────╫──────────────╫──► entityTransform(meshH)
        │                            ║              ║
        │                            ║              ║    render frame:
        │                            ║              ║    (geoH, revision) → GPU /
        │                            ║              ║    software backend
let n = geo.read_positions(          ║              ║
    0, 24, &mut buf);                ║              ║
        │  rg_geometry_read(geoH, 0, 24, outPtr)    ║
        ├───────── one crossing ─────╫──────────────╫──► resolveAs(geoH, GEOMETRY)
        │◄──────── 24 vertices ──────╫──────────────╫─── bulk copy into guest buf
```

The two diagrams differ only at the boundary column: the TSX path passes
identities and EvalValues through an in-process adapter, the WASM path passes
integers and byte ranges through generated imports — but the command names, the
handle format, the one copy in the core, and the read-back contract are the
same. That symmetry is the point: one registry definition serves both columns.

## Stage 1 — construction in guest code

Three.js offers several construction routes; each becomes a thin path onto the
same write surface. All geometry commands are declared once in the class
registry and generated for every face (host API, interpreter adapter, WASM
imports, JS wrapper).

**Route 1a — parametric.** The guest names a shape; the core computes the
coordinates.
```tsx
const geometry = new THREE.BoxGeometry();          // adapter: construct("BoxGeometry")
const mesh     = new THREE.Mesh(geometry, material);
```
The native adapter maps the constructor to the registry command
`geometryBox(w, h, d) → geoH` and returns an EvalValue holding the geometry
handle. The compiled guest issues the same command through the generated SDK
(`scene.spawn_cube(...)` today; the command, not the SDK call, is the contract).
The doubles are born in the core (`ThreeBoxGeometry.setSize` → `pushVertex`),
which stays exactly as it is.

**Route 1b — explicit vertex data (stable handle — D-GEO).** The guest types
coordinates the Three.js way:
```js
const geometry = new THREE.BufferGeometry();  // geometryCreateEmpty() → geoH
const vertices = new Float32Array([ 1,1,1,  -1,-1,1,  -1,1,-1 /* … */ ]);
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
// → geometrySetAttribute(geoH, "position", span, itemSize=3)
```
`geoH` is minted at `new` and **does not change** when attributes are added,
replaced, or indexed later. Bulk upload is still one crossing per
`setAttribute` / `updateRange` (ptr+len on WASM), not one call per float.
Optional sugar `geometryCreateFilled(...)` may fill an empty geometry in one
host call but must return that same `geoH`. Encoding of f32/u32 spans is fixed
in the registry type system (see class-registry chapter).

**Route 1c — loaded from a model file.** The guest names an asset; the host
decodes the glTF and instantiates the subtree:
```rust
let model = scene.load_model("sponza");    // → ModelHandle
let root  = scene.instantiate(model);      // → root entity handle
```
The vertices go file → host decoder → core arrays and never pass through guest
code. The guest can still reach them afterwards — stage 4 works on any geometry
handle, including ones born from a file.

**Route 1d — mutation after construction.** Per-vertex editing (terrain, water,
morphing) is an *update*, not a rebuild:
```js
geometry.attributes.position.setXYZ(7, 1.0, 2.5, 1.0);
geometry.attributes.position.needsUpdate = true;
```
The adapter buffers `setXYZ` writes against the local mirror (V.3) and, on
`needsUpdate`, flushes:
```
geometryUpdateRange(geoH, attribute, firstVertex, count, data) → contentRevision
```
Same stable `geoH` (D-GEO). Host overwrites CPU arrays and bumps content
revision (GPU cache keyed by revision; unrelated to `dispose()` / D-LIFE).
Skinned/instanced/morph meshes add attributes the same way — new registry
entries, not a new identity model.

## Stage 2 — live create + attach by handle (D-SYNC)

```
new THREE.Mesh(g, m)  → meshCreate(geoH, matH) → meshH   ; object lifetime begins
scene.add(mesh)       → entitySetParent(meshH, sceneH)   ; membership only
```

Handles are generation-tagged, realm-tagged, and typed via arenas (II.B, D-TYPE,
D-HANDLE). Semantics:

- `meshCreate` **retains** `geoH` / `matH` (object refcount). Two meshes from the
  same façade geometry resolve via interpreter identity (II.A) to one `geoH`.
- `scene.add` / `scene.remove` change membership only — they do not
  `geometryDisposeBackend` or `release` shared resources (D-LIFE).
- Local vertex `(1,1,1)` lives in geometry; mesh owns transform only.
- World position is computed per frame (`uModel × local`), never stored.
- Wrong-type / stale / wrong-realm handle fails at the command boundary.

## Stage 3 — rendering

Rendering consumes the one copy; this is the part of the current engine the
design keeps, tightened by the revision from stage 1d:

- On first draw — or when the geometry's content revision has changed — the
  backend interleaves the flat arrays into its native form: the GL backend
  packs `[px,py,pz, nx,ny,nz, u,v, tangent]` at a 48-byte stride and caches the
  GPU buffer keyed by `(geoH, contentRevision)`; `geometryUpdateRange` or
  `geometryDisposeBackend` (then re-upload) invalidates that cache entry only.
- The vertex shader composes the two pieces of stage-2 state:
```glsl
attribute vec3 aPos;                    // (1, 1, 1) — local, from the geometry
uniform mat4 uModel;                    // the mesh's transform, per frame
uniform mat4 uMVP;
void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);   // world position, computed, not stored
  vWorldPos = wp.xyz;
  gl_Position = uMVP * vec4(aPos, 1.0);
}
```
- The software rasteriser reads the same arrays through the same accessor
  (`geometry.getPosition(vi, c)`) and does the same composition on the CPU. Two
  renderers, one authoritative form, per-backend conversion at the last
  boundary (f32 for GL, fixed-point for the native upload path).

## Stage 4 — read-back from guest code

Reading a vertex back is part of the same contract that wrote it — one typed
read surface, generated for every path from the same registry entries:

```
geometryVertexCount(geoH) → n
geometryReadPositions(geoH, firstVertex, count, out) → count   ; bulk copy
```

- **Interpreter path.** `mesh.geometry` resolves through the adapter to the
  canonical core object — not to a façade data prop — so
  `geometry.attributes.position.getX(0)` answers from the same `positions`
  array the renderer draws. Single-value reads are cheap here because the core
  is in-process.
- **WASM path.** The generated import copies a vertex range into a guest buffer
  in one crossing:
```rust
let mut buf = [0f32; 3 * 24];
let n = geo.read_positions(0, 24, &mut buf);   // one call, 24 vertices
```
- **JS host path.** The generated wrapper exposes the same two calls over the
  compiled core; a browser tool reads vertices through the wrapper, not by
  dead-reckoning byte offsets in guest memory.
- **Failure is typed.** A stale handle (geometry destroyed, slot reused) fails
  the generation check and the read returns 0/null — it cannot return another
  geometry's vertices. A wrong-type handle fails `resolveAs` the same way.

With stage 4 in place the loop closes: the same handle that created the vertex
attaches it, renders it, updates it, and reads it back — on the interpreted,
compiled, and JS paths, from one definition in the class registry, with the one
copy living in the core the whole time.

## WASM linear-memory constraints and the rules they impose

The WASM column of this design moves vertex payloads through the guest's linear
memory. That memory model has specific properties, each of which is a concrete
risk for the bulk commands above; each risk becomes a rule of the contract.

**1. The host receives offsets, not pointers.** `ptr` in
`rg_geometry_raw(ptr, len)` is an integer offset into the guest's memory. A
buggy or hostile guest can pass any number. *Rule:* the host bounds-checks
`ptr + len` against the current memory size (and requires 4-byte alignment)
before copying, and rejects with a typed error — the same discipline the RGU1
validator already applies to its block.

**2. Memory growth invalidates host-side views.** When guest memory grows
(`memory.grow`), a JS `ArrayBuffer` view of it is detached; a cached view then
reads garbage or throws. This is not hypothetical — the current JS harness
caches exactly such a view (`render.cjs:49,143`,
`const dv = new DataView(exp.memory.buffer)`). The Ranger host's per-word
`wasm_mem_i32` reads are immune but slow. *Rule:* a bulk copy re-acquires the
memory buffer at the start of every command and never holds a view across
calls; the fast path and the safe path are the same path.

**3. No guest callbacks during a copy.** If the host calls back into the guest
mid-copy (an allocation, a logging hook), the guest may grow memory and the
source range moves under the copy. *Rule:* bulk commands are atomic with
respect to guest execution — the host completes the copy before any guest
export runs again.

**4. Linear memory grows but never shrinks.** A guest that stages a large
vertex buffer to upload it keeps that memory forever, even after the host has
copied it out — a 50 MB model staged guest-side inflates the instance
permanently. *Rules:* large assets take route 1c (host-side decode — the
vertices never enter guest memory at all); guest-built geometry beyond a
threshold uploads in **chunks** (`geometryAppend(geoH, first, count, data)`)
so peak staging is bounded and reusable.

**5. Uploads double the data temporarily.** During `geometrySetAttribute` /
bulk fill the vertices exist twice — guest staging buffer plus core arrays. On
Pi-class targets with large scenes this peak matters. Chunked upload (rule 4)
bounds it; the one-copy rule guarantees the doubling is transient, not permanent.

**6. Read-back requires guest-side allocation.** `read_positions` writes into a
buffer the guest must allocate first, which may force `memory.grow`, which can
fail. *Rules:* the guest sizes the buffer from `geometryVertexCount` before
reading; a failed allocation or an out-of-range window is a typed error
(return 0), never a trap; large read-backs chunk the same way uploads do.

**7. Fixed-size shared blocks cap capacity — vertex data must not use them.**
The engine's existing ABI blocks freeze their capacity into the header:
`RG_WASM_MAX_BODIES 32`, `RG_WASM_MAX_ENTITIES 64`, `RG_UI_MAX_NODES 64`,
`RG_UI_STRING_CAP 1024`. A fixed block for geometry would put a
`MAX_VERTICES` constant in a header and cap every game's mesh size forever —
the legacy `rg_mesh_ptr` block had exactly this shape. *Rule:* vertex payloads
go through ptr+len bulk commands only; fixed blocks remain for small,
fixed-cardinality state (input words, camera), never for geometry.

**8. Shared memory across threads can tear.** The streaming vertical
(`rust_worker`, RGX1 at a fixed offset in linear memory) has a worker writing
while another side reads. A reader can observe a half-written vertex range.
The codebase already has the discipline for this: RGP1's seqlock `revision`
(odd = mid-write, even = stable, `wasm_pose_abi.h:43`). *Rule:* any
concurrently-written buffer carries the same seqlock; single-threaded command
uploads need none because rule 3 makes them atomic.

**9. wasm32 addresses top out at 4 GiB.** Whole-scene vertex data can approach
the guest's address-space ceiling long before the host's. This is the memory
argument for the design's ownership rule: the authoritative copy lives host-side
and the guest holds 32-bit handles — the guest's memory scales with what it
*stages*, not with what the scene *contains*.

---

## Current path (what happens today) — contrast only

Keep this next to the target diagrams so the gap is concrete:

**TSX today** (`games/cube` / `games/teapot` / `games/sponza`):

1. Game imports a **local** `three.tsx` (350 / 237 / 337 lines) — not the
   canonical `three/tsx/three.tsx` (585) — because `readImportSource` checks the
   game directory before `assetPaths` (`ComponentEngine.rgr:1160`).
2. Façade builds plain interpreter objects (`valueType` object/array). No host
   handle on the geometry value.
3. `three_tsx_bridge.rgr` reconciles `scene.children[i]` → `nodeHandles[i]`
   (index key). `buildMeshH` (line 810) calls `buildGeometryH`/`buildMaterialH`
   every time — two meshes sharing one façade `geometry` get **two** host
   geometries.
4. `ThreeSceneHost.entityRemove` (line 255) only `scene.remove(...)`; the slot
   in `entities:[ThreeObject3D]` is never reused. Handle ≈ `array_length`.

**WASM 3D today** (`wasm3d_runner.rgr`):

1. Dual mode: if the guest exports `rg_mesh_ptr`, the host reads a guest memory
   block (legacy). If not, it uses `rg_create_*` / `rg_set_*` commands
   (`sceneMode` branch ~439).
2. No generation-tagged handles; entity ids are still closer to "index the guest
   published" than to II.B.
3. Vertex upload is not yet the D-GEO contract (`geometryCreateEmpty` +
   `geometrySetAttribute`); legacy `rg_mesh_ptr` still exists alongside commands.

The target diagrams above replace both of these with one handle + one copy + one
bulk command set generated from the class registry.

---

# Engine core components and their file-system locations

Map of where engine code lives today and where it should move. Target: a `core/`
directory so "engine vs game" is a path, not a naming convention.

Each subsection: **Status now** (on disk) → **Actions** (concrete moves).

## I.1 The eval engine — planned `eval/`

### Status now
- The JSX/TSX interpreter lives in `gallery/pdf_writer/src/jsx/`
  (`ComponentEngine.rgr` ≈ 7,300 lines, `EvalValue.rgr` ≈ 550, `JSXToEVG.rgr`)
  and is imported by 46 game-engine files. It is the interpreter that runs
  `*.game.tsx` and `.as` scripts at runtime.
- Its only pdf_writer-internal dependencies are `../jpeg/JPEGMetadata.rgr` and
  `../core/Buffer.rgr`; everything else it imports is the shared gallery
  modules `ts_parser/` and `evg/`.
- The move was validated in a spike on this branch (since reverted to keep the
  PR design-only): copying the five files to `gallery/game_engine/eval/`
  mirroring the `{jsx,jpeg,core}` layout leaves every relative import valid,
  the copy contains no pdf_writer references, ~48 game_engine importers each get
  a one-line path change, and both `EvalValue` and `ComponentEngine` compile
  from the new location.

### Actions
- Copy the interpreter to `gallery/game_engine/eval/` exactly as spiked, and
  repoint the ~48 game_engine importers.
- Develop the object-identity and native-adapter work (entity-registry and
  bridge chapters) on that copy, independent of `pdf_writer`.
- Move it back into `pdf_writer` once stable, or promote it to a shared module
  both can use.
- In the final layout it belongs under `core/` (e.g. `core/eval/`).

## I.2 The graphics layer — loose files at the engine root

### Status now
- `framebuffer.rgr` — the RGBA framebuffer every backend draws into.
- `gfx_sdl.rgr` — the SDL window + input + GPU path (native macOS/Linux/Pi).
- `rgba_fast_blit.rgr` — the fast software blit.
- `wasm_runtime.rgr` — the host side of the WASM runtime.
- All four sit loose in the engine root next to the planning docs, so nothing
  marks them as core. `framebuffer.rgr` alone has 27 importers.

### Actions
- Move `framebuffer` / `gfx_sdl` / `rgba_fast_blit` to `core/gfx/`.
- Move `wasm_runtime` to `core/wasm/` alongside the ABI (I.7).

## I.3 The Three object model — `three/`

### Status now
- `three/src/` (86 `.rgr` files) is the canonical Ranger clone of Three.js — pure Ranger
  that compiles to ES6 and C++: the math types (`three_vector3`, `three_matrix4`,
  `three_quaternion`, `three_euler`, `three_color`, `three_box3`, `three_frustum`),
  the geometries and materials, lights and textures, the WebGL and software
  renderer, the glTF loader, the light-probe GI, and `three_scene_host.rgr` — the
  one host-owned registry of scenes/cameras/geometries/materials/entities.
- `three/tsx/` (23 files) is the front-end: the TSX façade (`three.tsx`), the
  reconciler bridge (`three_tsx_bridge.rgr`), the native command bridge, and the
  convergence/parity tests.
- `three/tests/` (19) and `three/reference/` (14) round it out.

### Actions
- Decision **C1**: move `three/` under `core/three/` **or** leave as sibling
  `gallery/game_engine/three/` listed in AGENTS.md as a reusable subsystem.
- Rework `three_scene_host.rgr` per II.B / D-TYPE / D-LIFE (typed arenas, realm,
  DisposeBackend vs Release). No new Sponza-style reconciler accessors (0.5);
  track `RETIRE-RECONCILE` for deleting structural reconcile.

## I.4 Physics — `physics/`

### Status now
- `physics/src/` (60 files) is a full rigid-body engine behind a `PhysicsWorld`
  interface, with two implementations (an upgraded Cannon port and an independent
  arcade engine): vectors/quaternions, shapes, the SPOOK solver, broadphase,
  raycasting, joints, and a raycast vehicle.
- `physics/tsx/` (2 files) is the TSX bridge that exposes it to game scripts.

### Actions
- Same **C1** placement choice as `three/`.
- Concrete wiring gap: grep shows `physics_world.rgr` is imported only by
  `cannon_physics_world.rgr`, `arcade_physics_world.rgr`, and tests — no
  `scripting/*_runner*.rgr` imports it. Pick one runner (e.g. physics sandbox)
  and drive it through `PhysicsWorld` only; delete the bypass path that
  constructs `GamePhysics` / Cannon directly once that works (IDEAL.md §2.5).

## I.5 3D model loading — `model3d/`

### Status now
- `model3d/` (23 files) is the host-side, WASM-free object model: an
  `AssetRegistry` and `EntityRegistry`, a GLB importer, a `ModelInstancer`, and
  `ModelLoader` (load → instantiate → find child).
- Its `EntityRegistry` is a **second**, index-based registry — the same pattern as
  the Three host, hand-rolled again.

### Actions
- Same **C1** placement choice.
- Replace `model3d/EntityModel.rgr` `EntityRegistry` (id = array index) with the
  II.B registry API (`create`/`resolveAs`/`retain`/`release`). Migration check:
  `instantiate` / `instantiateNode` return generation-tagged handles; a stale
  handle after destroy must resolve to null.

## I.6 The host runtime facades — `scripting/game_*.rgr`

### Status now
- 49 `game_*.rgr` files mix game-neutral host runtime with other scripts. The
  neutral set includes: `game_runtime` (the
  loop, script loading, hot reload), `game_physics`, `game_audio`, `game_hud`,
  `game_sprite`, `game_camera`, `game_input`, `game_particles`,
  `game_persistence`, `game_fixed_step`, `game_runner_mode`, `game_entity_store`,
  `game_world_grid`, the provider and catalog files, and more.
- They live in `scripting/` mixed in with games, demos, runners and ABI code.

### Actions
- Move game-neutral `game_*.rgr` to `core/runtime/`.
- Mechanical filter (AGENTS.md #1): if `rg -n 'autopeli|pong|pacman|invaders|breakout'`
  hits the file, it is **not** core — move under `games/<name>/` (or delete if
  orphaned). Example already failing that filter: anything that only exists to
  serve autopeli HUD/sound ladders inside a runner (see 0.1–0.4).

## I.7 The guest ABI — `wasm/` + `scripting/wasm_*.rgr` / `as_*.rgr`

### Status now
- `wasm/` holds the shared byte-layout headers that every guest language mirrors:
  `wasm_game_abi.h`, `wasm_input_abi.h`, `wasm_pose_abi.h`, `wasm_sprite_abi.h`,
  `wasm_ui_abi.h`, plus two guests (`as_resource_loader/`, `rust_worker/`).
- `scripting/` holds the host side of those ABIs — 19 `wasm_*.rgr` / `as_*.rgr`
  files: `wasm_abi_io`, `wasm_ui_io`, `wasm_cap_gate`, `wasm_block_validator`, the
  `as_abi_bridge`, and so on.

### Actions
- Move `wasm/*.h`, `wasm_runtime.rgr`, and host IO (`wasm_abi_io`, `wasm_ui_io`,
  `wasm_cap_gate`, `wasm_block_validator`, `as_abi_bridge`, …) to `core/wasm/`.
- Header comment audit: replace phrases like "Standard body indices (autopeli)"
  with "guest convention — example values used by autopeli". Sound/particle ids
  must not be described as engine-wide standards (0.3, 0.4).

## I.8 Generic runners — `scripting/*_runner*.rgr`

### Status now
- 31 `*_runner*.rgr` files load a game and drive it each frame through the ABIs:
  `wasm_game_runner`, `wasm_physics_runner`, `wasm_sprite_runner`,
  `as_source_runner`, the SDL runners, split-screen, streaming, and others.
- A few still `Import` a specific game (e.g. `wasm_physics_runner` reaches into
  `wasm_autopeli_setup`/`_render`) — a runner is supposed to know no game.

### Actions
- Move game-neutral runners to `core/runtime/`.
- For `wasm_physics_runner.rgr`: delete `Import "./wasm_autopeli_setup.rgr"` /
  `wasm_autopeli_render.rgr`; take setup/render/HUD/assets through
  `GameSceneProvider` (already stubbed in `game_scene_provider.rgr` with empty
  `soundName` / hardcoded `particleName → "sparkle"`). Acceptance: a second
  physics WASM game runs without editing the runner file.
- Move game-named runners (`*autopeli*`, etc.) under `games/<name>/`.

## I.9 Reusable subsystems — `ui/`, `menu/`, `lpc/`, `pose/`

### Status now
- `ui/` (19 files) — the retained-mode UI toolkit: `UILayer`, widgets, text
  input, soft keyboard, the animator, the EVG launcher menu.
- `menu/` (3 files + assets) — the launcher menu.
- `lpc/` — the sprite-character pipeline: character catalog, spritesheet packing,
  and baked output.
- `pose/` — body-tracking input: the native provider, a MediaPipe proof of
  concept, and a benchmark.

### Actions
- Keep as reusable subsystems; apply **C1** (under `core/` or siblings).
- No code move blocked on other chapters — these folders already match the
  "knows no game" rule.

## I.10 Guest libraries — `lib/ranger_game/`

### Status now
- `lib/ranger_game/src/` is the Rust library a compiled WASM game links against:
  `input` (controllers/`Buttons`), `scene`, `sprite`, `ui`, `world`, `pose`,
  `resources`, `block`.
- It is the guest-side face of the ABIs and the source of the `ranger-game`
  native module (bridge chapter). Its `scene.rs` duplicates the host math by hand.

### Actions
- Keep it as the guest SDK.
- Generate its scene/class types from the Class Registry (guest-support chapter) so the guest
  copy cannot drift from the host.

## I.11 Not core — games, demos, prototypes

### Status now
- `games/` (70 files) — the shipped games; these are the ones that matter.
- `scripting/*.game.tsx` (13) — games that happen to live in `scripting/`.
- `scripting/*_demo.rgr` (52) — demo runners; 22 were verified orphaned (no
  test, script, package.json or import references them) and are first in line
  for deletion in the implementation phase; the rest are referenced by the test
  suite. Debug/bisect scratch (`autopeli_debug_*`, `autopeli_bisect`) and
  `old/ylos` (still present) are delete-candidates once CI confirms no refs.
- `ranger_games/` (16) — the TSX→native/C++/Rust portability proof (load-bearing
  for tests and npm scripts).
- `docs/`, `assets/`, `menu/` are kept as-is.

### Actions
- Games stay in `games/`; move the `scripting/*.game.tsx` ones there too.
- Games must not carry private copies of shared modules: four games hold
  diverged copies of `three.tsx` today (see V.1) — once the shared façade
  resolves via the search path, those copies are deleted.
- Move `ranger_games/` (and its TSX→Ranger tests) under `prototypes/`.
- Demos: keep the test-referenced ones; once the `core/` move draws the boundary,
  whatever is left outside `core/`, `games/`, `prototypes/`, `docs/`, `assets/`,
  and `menu/` is the delete-candidate list.

## I.12 How the move is done

### Status now
- Imports are relative paths, so moving one file rewrites its own `../` imports
  *and* every importer's path to it. The Ranger compiler (`bin/output.js`) runs
  here, so each move can be compile-verified.
- The eval-engine spike (I.1) proved the mechanic end to end — five files
  relocated, importers repointed, both compiling from the new location —
  and was then reverted so the planning branch stays design-only.

### Actions
- Move in blast-ordered, compile-verified tranches:
  1. loose gfx roots → `core/gfx/`;
  2. `wasm_runtime` + the ABI headers and host IO → `core/wasm/`;
  3. the game-neutral facades and runners → `core/runtime/`;
  4. the subsystems (`three/`, `physics/`, `model3d/`, …) per decision C1.
- After each tranche, compile the affected roots before committing.
- No file is deleted during the move; the delete list is drawn only once the
  boundary exists (I.11).

---

# Entity registry and stable object identity

Need: one 32-bit, generation-tagged id used by the interpreter, the host
registries, and the WASM boundary. Today each layer invents its own index.

## II.A Interpreter identity — `EvalValue.identityId`

**Today** (`gallery/pdf_writer/src/jsx/EvalValue.rgr:540–541`):

```
; Arrays and objects - reference equality for now
return false
```

Effects you can observe in games:

- In a `.game.tsx` script, `a === a` is false for object `a`.
- `Map`/`Set` cannot key on objects.
- Three façade invented `__removed` (`three.tsx:60`) because it cannot test
  "is this the same node?"
- Reconciler comment at `three_tsx_bridge.rgr:89`: assumes stable tree shape.

**Change:** give every reference `valueType` (4,5,6,7,9,10) a monotonic
`identityId` at construction. `equals()` compares `identityId`. Route `===`,
`Map`/`Set`, `Array.indexOf`/`includes` through it.

Land behind a new `component_engine_js_semantics_test` plus existing pdf_writer
suites (`EvalValue` is shared). Companion fix: missing member → `undefined`
(not `null`) — see `docs/TSX_ENGINE_ISSUES.md` #7 / #8.

## II.B Host registry — handles, realms, typed arenas

**Today** (`three/src/three_scene_host.rgr`):

- `entities`, `geometries`, `materials`, … are parallel arrays of mixed/base types.
- Create returns `array_length` (raw index).
- `entityRemove` (line 255) detaches from the scene only — slot never freed.
- No realm: nothing stops one guest from using another's index.

`model3d/EntityModel.rgr` and `scripting/game_entity_store.rgr` are separate
registries with the same index-as-id weakness.

**Change (D-HANDLE + D-TYPE):**

```
; Logical handle — prefer fat/64-bit for WASM (two i32); if packed 32-bit is
; used temporarily, document wrap risk and never treat sign bit as invalid.
HANDLE_INVALID = 0

slot {
  typeId       ; which arena
  generation   ; wide enough, or retire slot on wrap
  realmId      ; scene / interpreter / WASM guest owner
  payloadIndex ; index into the typed arena
  refcount     ; object lifetime (D-LIFE)
}

create(typeId, realmId, obj) -> handle
resolve(handle, realmId)     -> slot | null   ; gen + realm
payload(slot)                -> typed arena object
retain(handle) / release(handle)
```

Per-type arenas (D-TYPE):

```
meshes[payloadIndex]             : ThreeMesh
directionalLights[payloadIndex]  : ThreeDirectionalLight
geometries[payloadIndex]         : ThreeBufferGeometry
…
```

`typeId` selects the arena; it does **not** downcast a base `ThreeObject3D`.

Fold `model3d`'s registry onto this API.

**Acceptance:**

1. Create → remove (detach) → create: membership ops do not free the object;
   `release` + gen bump makes old handle resolve null (or epoch invalidates).
2. Cross-realm: guest A handle fails `resolve` in guest B's realm.
3. Typed access never goes through a base-type array + cast.

## II.C WASM bridge IDs

**Today:** WASM guests exchange i32 ids without generation/realm
(`IDEAL_3D.md` §12.3.3).

**Change:** guest-visible id **is** the II.B handle (fat two-i32 or packed with
documented limits). No second numbering scheme. Binary imports versioned per
D-WASM.

## II.D Layer composition (live path)

| Layer | Today | Target |
|-------|-------|--------|
| Interpreter object | no identity | `identityId` (II.A) on NativeRef |
| Host object | array index | handle → typed arena payload (II.B) |
| WASM guest | bare i32 index | same handle (II.C), realm-scoped |
| Sync model | façade tree + reconcile | **live** construct/parent/property (D-SYNC) |

`identityId` ↔ `handle` is established at `construct`, not at reconcile.
Reconciler is transitional only (`RETIRE-RECONCILE`).

## II.E Shared geometry/material — concrete bug this fixes

**Today** (`three_tsx_bridge.rgr:810–819`): `buildMeshH` always mints new geo/mat
handles, so two meshes sharing one façade `geometry` get two host geometries.

**With live adapter + II.A + II.B:** `new Mesh(geo, mat)` looks up
`identityId(geo)` → one `geoH`, `retain`s it. Second mesh gets the same handle.
Last `release` frees the object; `dispose()` only runs `*DisposeBackend`
(D-LIFE).

---

# Three object model: live host objects (reconciler transitional)

## III.1 Interpreter semantics gate

Blocked on II.A + missing→`undefined` (`docs/TSX_ENGINE_ISSUES.md` #7/#8).
Also separate **read of unknown data prop** from **call of unknown method**
(V.4 / D-PROP below).

## III.2 Fix contradictory docs (do this first — doc-only)

**Today's contradiction (verified):**

- `IDEAL_THREE.md` §3 (~lines 627–630): front-ends use the object model
  "directly".
- Code + `THREE_BRIDGE.md`: one `ThreeSceneHost`, integer-handle commands.
- `THREE.md` ~169 deleted Teapot/Sponza bridges; table 272–273 still names them.

**ADR:** [`docs/ADR-0001-three-scene-host-authority.md`](./docs/ADR-0001-three-scene-host-authority.md).

**Edits:**

1. Rewrite `IDEAL_THREE.md` §3 to: front-ends hold handles to host-owned objects;
   **live** commands (D-SYNC), not each building a private graph.
2. Fix `THREE.md` demo table → live adapter / host (reconciler only if still
   present as temporary).
3. ADR pointer at top of `IDEAL_THREE.md`, `THREE_BRIDGE.md`, `THREE.md`.

## III.3 Structural reconciler — temporary only (D-SYNC)

**Today:** index/DFS `nodeHandles` (`three_tsx_bridge.rgr:77–89`).

**Not the target.** While demos still call reconcile:

- May key by `identityId` instead of child index (bugfix only).
- Must not create a second host object for something `new Mesh` already created
  once the live adapter is on for that class.

**Done when:** `RETIRE-RECONCILE` checklist complete — delete structural
reconcile + Sponza accessors.

## III.4 Resource sharing

Same as **II.E**, on the live path: construct-time identity lookup, not
reconcile-time.

## III.5 Dispatch via typed arenas (D-TYPE)

**Today (0.5):** base-type storage forced `sunLight()` / `skyNode()` /
`modelNode()`.

**Target:**

```
slot = resolve(handle, realmId)
require slot.typeId == DIRECTIONAL_LIGHT
directionalLights[slot.payloadIndex].apply(cmd, args)
```

Command shape remains `invoke(command, args…) -> result` with handles/scalars
only. New technique = new `typeId` + arena + apply handlers — not a bridge
accessor.

## III.6 Bridge surface drift → generate from class registry

**Today (verified):** host 10 geometry constructors; native bridge 2 (Box,
Teapot). Reconciler bypasses the bridge face, so demos hide the gap.

**Change:** generate all faces from the class registry; surface-parity test.

## III.7 Harden the parity rig

File: `three/tests/value_parity/three_value_parity_test.rgr`.

**False-pass today:** `matchField` → `ev.toNumber()` → `0.0` for null
(`EvalValue.rgr:220`).

**Changes:** type-check + status enum; separate JS semantics suite; assert
façade handle == host handle (II.E); **backend dispose ≠ handle release**
(D-LIFE); resource counts across hot-reload; named versioned suites — not one
percentage.

---

# Class registry: contract + type system + WASM lowering

Versioned table of classes → methods/props. Guests compile against it. Lives
with the ABI (`wasm/*.h`, `ABI_V1.md`).

## Record shape

```
class {
  classId : u32          ; stable — Object Type ID / arena selector (D-TYPE)
  name    : "BufferGeometry"
  props   : [ { propId, name, type, access, residency: guest|host } ]
  methods : [ { methodId, name, args[], returnType, wasmLowering, sync } ]
}
```

## Type system (must cover bulk geometry — not only scalars)

Earlier draft listed only `id, f64, i32, bool, string, enum`. That cannot express
`geometrySetAttribute` or loaders. Minimum:

```
handle<T>          ; realm-scoped host id
option<T>
span<T>            ; ptr+len lowering on WASM (borrowed guest memory)
owned_buffer<T>    ; host allocates / guest allocates — metadata chooses
borrowed_buffer<T>
result<T, ErrorCode>
string_view
struct { fields… }
enum
scalars: i32, u32, f32, f64, bool
```

Per-method / per-arg metadata:

- ownership / retain rules (who retains a returned handle)
- mutability
- sync vs async (loaders)
- WASM pointer/length lowering (D-WASM)
- return-buffer allocation (guest-alloc vs host-alloc)
- **apiVersion / wasmExportName** (binary identity ≠ source name)

If the schema cannot state these, codegen grows command-specific exceptions —
the failure mode this design is trying to remove.

## Binary WASM compatibility (D-WASM)

Source-level "optional new argument" ≠ changing an existing import signature.

Registry must emit one of: versioned export names (`fooV1`/`fooV2`), a stable
`invoke(methodId, …)` generic ABI, or a frozen import stub that never gains
required parameters. Document which model each method uses.

## Generated faces

`ThreeSceneHost` / arena APIs, `ThreeNativeBridge.has/invoke`, WASM imports,
TS/Rust wrappers, native-adapter registrations, doc tables, surface-parity test.

**Status — SPECIAL REVIEW before codegen** on storage format and exact handle
width choice (D-HANDLE), with the type system above as a requirement.

---

# Bridge implementation: native classes and native modules

## V.1 Façade: one thin file, not five copies

**Today (verified line counts):**

| Path | Lines |
|------|------:|
| `three/tsx/three.tsx` (canonical) | 585 |
| `games/cube/three.tsx` | 350 |
| `games/cubes/three.tsx` | 350 |
| `games/sponza/three.tsx` | 337 |
| `games/teapot/three.tsx` | 237 |

Canonical `Vector3` implements only a **small subset** (`set`, `copy`,
`setScalar`, `clone`, `setFromSphericalCoords`) — not ~90 methods. The real
duplication is **Object3D-shaped state and small methods** repeated across
Scene / Group / Mesh / camera / light classes, plus diverged per-game copies.
The deeper problem is **dual authority** (façade vs core), not raw method count.

Cause of copies: `readImportSource` checks the game directory before
`assetPaths` (`ComponentEngine.rgr:1160`).

Also duplicated: `game_helpers.tsx` / `game.d.ts` (`scripting/` + `lib/`);
identical `breakout_bricks.tsx` (127 lines × 2).

**Change:** add shared dir to `assetPaths`; delete per-game `three.tsx`; thin
canonical façade to name → native class declarations.

## V.2 Native-class adapter (live host path — D-SYNC)

**Today:** only `valueType 7` (`EVGElement`) is a native hook.

**Change:** `nativeObject` + `nativeClassId` + `NativeClassAdapter`:

```
construct / getProperty / setProperty / invokeMethod
```

For `Object3D` and subclasses, `construct` creates the host object **once**;
property/method ops mutate that handle immediately (or via documented batch
flush). No reconcile step for those classes once migrated.

Host-backed refs carry `identityId` (II.A). Canonical math backing:
`three_vector3` / `three_matrix4` / …

## V.3 Residency

| Kind | When | Example |
|------|------|---------|
| Guest-side | Hot value math | `Vector3.add` |
| Host-backed | Host/GPU truth | `Object3D`, textures, geometries |
| Hybrid | Local mirror; explicit sync boundary | assign `mesh.position`, then host write |

Sync boundaries for hybrids must be listed in the class registry (assign,
method, or dirty commit) — never two silent authorities.

## V.4 Member access: props vs methods (D-PROP)

Do **not** treat every unknown member as one "defined error." JS semantics:

```
mesh.nonexistent           // undefined  (missing data prop)
mesh.nonexistent()         // TypeError: not a function
mesh.customValue = 123     // allowed expando (userData / overlay)
mesh.position              // native prop → host/guest residency rules
```

Host-backed wrappers need **two stores**:

1. **Native properties** — declared in the class registry (`position`,
   `geometry`, `material`, `visible`, …).
2. **Dynamic overlay** — `userData`, app expandos, temporary flags.

Unknown **native method** name → TypeError-like failure on call.
Unknown **read** → `undefined`.
Unknown **write** → overlay (unless registry marks the class sealed).

## V.5 Native module `ranger-game`

**Today:** `lib/ranger_game/` + `engine.d.ts` declarations; no real native
module import yet.

**Target:**

```ts
import * as Ranger from "ranger-game";
const pad = Ranger.controllers[0];
if (pad.pressed(Ranger.Buttons.ACTION)) fire();
Ranger.audio.play("hit");
```

Versioned under the class-registry / D-WASM rules. First exports:
`controllers`/`input`, `time`, `audio`, read-only config.

## V.6 First cut and risk

First classes: `Vector3, Euler, Quaternion, Matrix4, Object3D, Color` (math
guest-side; `Object3D` live host-backed). Geometry/material/texture as host
resources with D-GEO / D-LIFE commands. Gate with semantics suite; keep
`EVGElement` UI path green as client #0.

---

# Object lifetime across the boundary (D-LIFE)

**Today:** `entityRemove` does not free slots; façade `dispose()` is empty.

**Constraint:** ES6 / C++ / WASM — no portable finalizer. Lifetime is explicit.

**Three lifetimes (mandatory split):**

1. **Wrapper/object** — handle validity + refcount (`retain`/`release`).
2. **Scene membership** — `entitySetParent` / `entityDetach` only.
3. **Backend resource** — `*DisposeBackend` invalidates GPU caches + bumps
   resource revision; CPU object and handle remain.

**Rules:**

1. Guest-side values — interpreter memory only.
2. Live host objects — freed by `release` at refcount 0 (generation/epoch),
   **not** by "not seen in reconcile" as the long-term GC (reconciler mark-sweep
   may exist only until `RETIRE-RECONCILE`).
3. Shared resources — refcount across meshes (II.E).
4. `dispose()` → `*DisposeBackend` only — never `release`.
5. Escaped host value held only in a script variable — prefer guest-side
   residency for pure values; otherwise explicit retain until a defined
   boundary. `WeakRef` is JS-only optimization, not the contract.

**Tests (minimum):** dispose-backend then render again; remove-from-scene then
still mutate object; shared geo dispose-backend does not invalidate second
mesh's handle; release of last owner invalidates handle.

---

# Guest support libraries: one definition, generated faces

**Today:**

| Face | Where | Problem |
|------|-------|---------|
| TSX façade | `three.tsx` + 4 game copies | Small Vector3 subset + duplicated Object3D-shaped state; dual authority vs core |
| Rust guest math | `lib/ranger_game/src/scene.rs` (986) | hand-rolled `Vec3`/`Quat`/`Color`/`Scene` |
| (future) AS guest | — | would be a third copy |

**Rule:** class registry is the single definition; generate every language face.
Thin shared façade + live adapter on interpreter path; generated structs for
compiled guests. Parity test against registry.

---

# Affected components (work inventory)

Sizes = current line counts. **S/M/L** = change size, not calendar time.

**A. Interpreter** — `gallery/pdf_writer/src/jsx/`
- `EvalValue.rgr` (553) — `identityId`; `equals`; missing→`undefined`; native
  slot; overlay vs native props. **M**
- `ComponentEngine.rgr` (7288) — live `new`/member/method → adapter; native
  module import; Map/Set by identity; shared `assetPaths` for `three`. **L**

**B. Bridge (new)**
- `NativeClassAdapter` + live `Object3D` path; value adapters for
  `Vector3, Euler, Quaternion, Matrix4, Color`. **M**
- `ranger-game` module. **M**
- Reuse `three_vector3` / `three_matrix4` / `three_quaternion`. **S**

**C. Class registry + codegen (new)**
- Schema with handle/span/option/result + wasmLowering metadata. **M**
- Generators + surface-parity + WASM version policy tests. **L**

**D. Three façade & transitional reconciler** — `three/tsx/`
- `three.tsx` (585) — thin declarations; empty `dispose` → DisposeBackend. **M**
- Delete per-game `three.tsx` copies; `assetPaths`. **S**
- `three_tsx_bridge.rgr` (1109) — shrink toward live ops; **delete** structural
  reconcile at `RETIRE-RECONCILE`. **L**
- `three_native_bridge.rgr` (206) — regenerate. **S**

**E. Host registry + arenas**
- `three_scene_host.rgr` (394) — handles, realm, arenas, refcount,
  DisposeBackend vs Release, free on release. **L**
- `model3d/EntityModel.rgr` — fold onto II.B. **M**

**F. Guest support** — generate `scene.rs` math/types. **M**

**G. Tests** — JS semantics; parity typing; D-LIFE lifetime suite; surface-parity;
  D-WASM import stability; guest-support parity. **M**

**H. Docs** — ADR-0001 + IDEAL_THREE / THREE / THREE_BRIDGE. **S**

**Hard gate before registry implementation:** D-SYNC, D-LIFE, D-TYPE, D-HANDLE,
D-WASM agreed (this section). Then: II.A identity → V.2 live adapter → II.B
arenas → retire reconciler. New material/loader/geometry features wait on that
chain **and** on D-GEO stable handles.

**First mechanical cleanups (no hard gate):**

1. Doc edits in III.2.
2. Orphan `*_demo.rgr` deletion (I.11) with CI grep.
3. Shared `assetPaths` + delete duplicate `three.tsx` / `breakout_bricks.tsx`.
4. CI grep: no game name under future `core/` (0.24).

---

# Decisions

- **D1 = keep `ranger_games/`.** Move under `prototypes/` in the layout phase.
  Only I.11 orphans are approved deletions.
- **D2 = native-object adapter** with **live Object3D** semantics (D-SYNC / V.2).
- **D3 = planning first for registry codegen** until D-SYNC/D-LIFE/D-TYPE/D-HANDLE/D-WASM
  are accepted — this file + ADR-0001 are the review artifacts.
- **D-SYNC / D-LIFE / D-TYPE / D-HANDLE / D-WASM / D-GEO / D-PROP** — see
  Architecture decisions (binding).

**Still open (non-blocking for choosing the sync model):** C1 folder placement;
exact handle packing (fat two-i32 vs packed+epoch); class-registry file format.

---
*Design/analysis document. Vertex chapter = target. 0.x and I.* = current tree.
Architecture decisions override conflicting wording elsewhere in older drafts.*
