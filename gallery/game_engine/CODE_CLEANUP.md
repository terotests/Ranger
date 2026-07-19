# Current state: duplication and rerouting inventory

The individual "wrong files" listed later in this plan are symptoms. The disease
is a repeating pattern, and it works like this:

1. A generic engine path needs something a game knows (a world, a light, a class,
   a helper, a sound name).
2. Instead of opening a proper seam (an interface, a registry entry, a shared
   module), a **bridge or helper is added as a "temporary" shortcut** — it
   imports the game's code directly, copies the shared code locally, or hardcodes
   the game's vocabulary inline.
3. The demo works, so the shortcut ships. The documentation calls it temporary.
4. The next feature builds **on top of the shortcut**, because it is the path
   that works. The copy diverges; the game import grows roots; the hardcoded
   ladder gets one more case.

Nothing fails loudly at any step — the engine *silently reroutes* through
game-specific Ranger code, and each reroute makes the next one cheaper to add
and harder to remove. There is also a second-order form of the trap, documented
in its own chapter (0.21): **when a proper fix finally lands, the old path is
not retired**, so the fix becomes one more parallel system.

Everything below is live in the codebase today, verified with file and line
references. The chapters are grouped into six categories, and together they
cover every use-case area IDEAL.md describes (§2.1–§2.18); the coverage table at
the end of this part maps each chapter to its IDEAL.md section.

---

## Category A — game-specific code inside generic engine code

### 0.1 wasm_physics_runner.rgr contains autopeli imports and constants

`scripting/wasm_physics_runner.rgr` presents itself as the generic WASM physics
runner. What the file actually contains:

```
line 11:  Import "./wasm_autopeli_setup.rgr"        ; a specific game's world
line 12:  Import "./wasm_autopeli_render.rgr"        ; a specific game's rendering
line 32:  def assetsDir:string "gallery/game_engine/games/autopeli_wasm"
line 35:  def worldH:int 6000                        ; autopeli's track length
line 39:  def camSmoothP2:double 5860.0              ; autopeli's camera anchor
line 855: (idiv ((6000 - (to_int car.y)) * 100) 6000)  ; autopeli's progress bar
```

A second physics game cannot use this runner without editing it — which means it
is not a runner, it is autopeli with a generic name. The reroute happened at
lines 11–12: the moment the runner imported the game instead of receiving it
through an interface, every later shortcut (the constants, the camera numbers,
the progress formula) had a natural place to land.

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
(`eval/jsx/ComponentEngine.rgr:1160`), so each 3D game copied the façade in:

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
  monolith, and `old/ylos` (now removed) was a fourth generation.

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
| `three.tsx` (`class Vector3`, ~90 methods) | `three/tsx/` + 4 game copies | TSX |

Numerical fixes and conventions (handedness, Euler order, normalization edge
cases) do not propagate between them.

### 0.11 Three entity registries, none shared

- `three/src/three_scene_host.rgr` — five parallel arrays, handle = array
  index, removal never frees the slot.
- `model3d/EntityModel.rgr` — a second `EntityRegistry`, also id = array index.
- `scripting/game_entity_store.rgr` — a third store keyed by string ids for 2D
  world games.

All three lack the same things (stable ids, safe removal, type information), and
fixing one fixes nothing for the other two. the entity-registry chapter exists to replace all three
with one registry.

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

The engine promises "write the game once, run it compiled or interpreted." These
features break that promise silently — the game runs, and the feature is just
absent (IDEAL.md's parity axis, §2):

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

This is the second-order trap, and it is worth naming because it is how the
*cleanup itself* goes wrong. Every example below is a correct fix that stopped
halfway, leaving the engine with one more parallel system:

- **The capability gate** (`wasm_cap_gate.rgr`) exists and is wired into
  `wasm_game_runner` and `wasm_physics_runner` — but not the sprite runner or
  the `.as` runner (grep: no `CapGate` reference in either). Half the guests
  are gated; half still read zeroed memory on a missing capability
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

The rule this implies for all the work in this plan: **a fix is finished when
the old path is deleted**, not when the new path works. Retirement is part of
the fix's definition of done.

### 0.22 EvalValue object equality returns false; downstream effects

`eval/jsx/EvalValue.rgr:540`:

```
; Arrays and objects - reference equality for now
return false
```

Because object equality "for now" returns false, `a === a` is false in game
scripts, and `Map`/`Set` cannot key on objects. Downstream, the Three façade
needed a way to remove scene nodes without identity, so it grew the `__removed`
flag hack (`three.tsx:60,67,71`); the reconciler could not key nodes by object,
so it keys them by array position and "assumes a stable tree shape"
(`three_tsx_bridge.rgr:77–89`). One deferred line in the interpreter dictated
the design of every layer above it. This is the smallest reroute in the codebase
and the most expensive one.

### 0.23 Inconsistent logging prefixes and scattered feature flags

- Log lines are bare `print` calls with ad-hoc bracket tags — nine distinct
  prefixes across `scripting/` (`[game-engine]`, `[split-screen]`, `[menu]`,
  `[sprite-demo]`, `[wasm]`, `[wasm3d]`, `[tsx3d]`, `[poc]`, `[as]`), with
  single files mixing several. No severity levels, no way to filter
  (IDEAL.md §2.16).
- Feature toggles are scattered booleans: `hotReload` in `game_runtime.rgr:41`,
  `useAs` defined **independently in two files** (`wasm_abi_io.rgr:17` and
  `game_ui_runner.rgr:49`), and `game_runner_mode.rgr:6` documents the runner
  state as "a set of INDEPENDENT booleans (useWasmRunner, useWasmPhysics,
  useSpriteRunner, useStream, wasmSplit…)" — contradictory states are
  representable, which is the illegal-state bug class IDEAL.md §0.1 records as
  already having caused real failures.

---

## 0.24 Build and test rules derived from the inventory

Each example above survived because nothing *failed* when the shortcut was
taken. There is also proof in this codebase that the right fix works when done
completely: **pose input (RGP1)** was in exactly this state — every producer
with its own layout — and now has one shared header (`wasm/wasm_pose_abi.h`)
that every producer and both guest paths conform to, byte-for-byte
(IDEAL.md §2.4). The rules below make each category either impossible or loudly
visible:

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

The rest of this plan is organized around making the 0.24 rules true: the
file-system chapter maps where everything lives and moves core into one place;
the entity-registry chapter builds the one registry; the class-registry and
bridge chapters define the one contract and the runtime that serves it; the
lifetime/GC and guest-support chapters cover object lifetime and the generated
guest faces.

---

# Vertex data flow: construction, world binding, rendering, read-back

A single vertex of a cube is the best end-to-end probe of the architecture,
because it has to cross every boundary this plan talks about: guest → core →
renderer → and (ideally) back to the guest. This chapter walks one vertex —
the cube corner at `(+1, +1, +1)` — through all four stages, with the real code
at each step. Where a stage works differently on the TSX path and the WASM
path, both are shown; where a stage does not exist yet, that is stated and tied
to the chapter that adds it.

## Stage 1 — construction in guest code

Three.js has several distinct ways to construct a mesh, and each one gives the
vertex a different birthplace. The contract must cover all of them; today the
engine covers some. The routes, with their support status:

| Route | Three.js form | Who types the coordinates | Status today |
|-------|---------------|---------------------------|--------------|
| 1a Parametric | `new THREE.BoxGeometry(w,h,d)` | the core | supported (10 host commands) |
| 1b Explicit vertex data | `BufferGeometry` + `setAttribute('position', …)` | **the guest** | not supported (no host command, no façade class) |
| 1c Loaded from a model file | `GLTFLoader.load(url)` | the file | supported (`modelAttach`) |
| 1d Mutation after construction | `position.setXYZ(i,…)` + `needsUpdate` | the guest | partial (rebuild, not update) |

**Route 1a — parametric.** The guest names a shape and its parameters; the
coordinates are computed in the core. TSX (`games/cube/index.tsx:23–26`):
```tsx
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
mesh = new THREE.Mesh( geometry, material );
```
The reconciler issues one host command (`three_tsx_bridge.rgr:740`
`buildGeometryH` → `:807` `host.geometryBox(gw gh gd)`). The compiled WASM guest
does the same through the SDK (`games/cube3d_wasm/src/src/lib.rs:20–25`):
```rust
let cube = scene.spawn_cube(Vec3::ZERO, 1.0, tex);   // -> opaque Entity id
```
(`spawn_cube`, `lib/ranger_game/src/scene.rs:577`, sends
`rg_create_mesh_entity` and keeps only the returned id.) On this route the
doubles are born in the core: `ThreeSceneHost.geometryBox` →
`ThreeBoxGeometry.setSize` (`three/src/three_box_geometry.rgr:25`):
```
fn setSize:ThreeBoxGeometry (width:double height:double depth:double) {
    def hx:double (width * 0.5)
    ...
    ; +Z face — our vertex (+hx, +hy, +hz) is pushed here
    this.addQuad(nhx nhy hz  hx nhy hz  hx hy hz  nhx hy hz  0.0 0.0 1.0)
```

**Route 1b — explicit vertex data.** In Three.js the guest types every
coordinate itself; this is the standard route for any custom mesh:
```js
const geometry = new THREE.BufferGeometry();
const vertices = new Float32Array([ 1,1,1,  -1,-1,1,  -1,1,-1 /* … */ ]);
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
const mesh = new THREE.Mesh(geometry, material);
```
This route **does not exist in the engine today**: the façade has no
`BufferGeometry`/`setAttribute` class, and `ThreeSceneHost` has no command that
accepts raw vertex arrays — its geometry surface is ten parametric constructors
plus `modelAttach`. The only form in which a guest has ever supplied raw
vertices is the legacy *block mode*: a `rg_mesh_ptr` table of 32-byte
fixed-point records copied out of guest linear memory
(`wasm3d_runner.rgr:467–487`; reader kept for compatibility, no shipped game
uses it). The contract therefore needs a bulk vertex-upload command —
`geometryCreateRaw(positions, normals, uvs, indices)` in class-registry terms —
the write-side twin of stage 4's bulk read: one boundary crossing carrying N
vertices, landing in the same `pushVertex` sink as route 1a.

**Route 1c — loaded from a model file.** The vertices come from a glTF binary,
decoded host-side (`three_gltf_loader` / `model3d`), and enter the scene as a
finished subtree via `host.modelAttach(sceneH, model)`
(`three_tsx_bridge.rgr:609–675`). The guest sees only the returned entity
handle; the coordinates never pass through guest code at all.

**Route 1d — mutation after construction.** Three.js lets a guest edit vertices
in place (`geometry.attributes.position.setXYZ(i, x, y, z)`;
`position.needsUpdate = true`) — terrain deformation, water, morphing. The
engine's current answer is coarse: the reconciler diffs a *signature* of the
geometry parameters and on change **destroys and rebuilds the whole mesh**
(`three_tsx_bridge.rgr:582–588`, the "needsUpdate model" per its own comments
`:30, :79–82`). Parameter changes work; per-vertex edits have no path at all
until route 1b exists, after which the contract needs the matching
`geometryUpdate` (bulk overwrite of an attribute range) so an edit is an update,
not a rebuild.

Whatever the route, every vertex ends in the same place — the flat arrays of the
core geometry (`three/src/three_buffer_geometry.rgr`):
```
class ThreeBufferGeometry {
    def positions:[double]        ; x,y,z per vertex — the ONE copy
    def normals:[double]
    def uvs:[double]
    fn pushVertex:void (px py pz  nx ny nz  u v) { push this.positions px ... }
    fn getPosition:double (vertex:int comp:int) {
        return (itemAt this.positions ((vertex * 3) + comp))
    }
```
The stages below follow the route-1a vertex, but stages 2–4 are identical for
every route: once the doubles are in `positions`, their origin no longer
matters. (Skinned, instanced and morph-target meshes are further construction
forms Three.js offers; they add attributes and per-instance data on top of the
same `BufferGeometry` model and are out of scope until routes 1b/1d land.)

## Stage 2 — attachment to world objects by handle

The vertex is **not copied** into the mesh. The mesh *references* the geometry
by handle (`three/src/three_scene_host.rgr:196`):
```
fn meshNew:int (sceneH:int geoH:int matH:int) {
    def m:ThreeMesh (new ThreeMesh)
    m.setGeometry((this.geometryAt(geoH)))    ; reference, not copy
    m.setMaterial((this.materialAt(matH)))
    (this.sceneAt(sceneH)).add(m)
    push entities m
    return (array_length entities)            ; the mesh's own handle
}
```
The entity's position/rotation/scale live on the *mesh*, set separately
(`entityTransform`, `three_scene_host.rgr:242`). So after stage 2 there are two
distinct pieces of state, joined only at render time:

- the vertex's **local position** `(1, 1, 1)` — immutable, inside the geometry,
  shared by every mesh that references that geometry;
- the mesh's **world transform** — mutable, per entity, updated every frame
  (the WASM guest's `CUBE.rotation(tumble)` → `rg_set_rotation`,
  `scene.rs:734`).

The world-space position of our vertex is never stored anywhere — it is
computed fresh each frame in stage 3 as `uModel × (1,1,1)`. This split is
exactly the resource/instance separation the plan's registry formalizes
(entity-registry chapter), and it is why two meshes sharing one geometry must share one handle
(II.E): the vertex exists once no matter how many cubes are on screen.

## Stage 3 — transfer to the shaders

**GL path.** When the geometry is first drawn, the core interleaves the flat
arrays into one GPU buffer — 48 bytes per vertex
(`three/src/three_gl_backend.rgr:306–315`):
```
; interleaved float32 [px,py,pz, nx,ny,nz, u,v, tx,ty,tz,tw] (48-byte stride)
def vbuf:buffer (buffer_alloc (vc * 48))
    def o:int (i * 48)
    ByteReader.encodeF32(vbuf o (g.getPosition(i 0)))   ; px → byte offset 0
```
The GL glue binds that buffer to the `aPos` attribute
(`three/src/three_gl.rgr:70`):
```
gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 48, 0);
```
and the vertex shader (`three/src/three_gl_shaders.rgr:16`) finally combines the
two pieces of state from stage 2:
```glsl
attribute vec3 aPos;            // our vertex: (1, 1, 1), local space
uniform mat4 uModel;            // the mesh's world transform
uniform mat4 uMVP;
void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);   // world position, computed per frame
  vWorldPos = wp.xyz;
  gl_Position = uMVP * vec4(aPos, 1.0); // clip position
}
```
The upload happens once and is cached on the geometry (`glHandle` in
`ThreeBufferGeometry`); after that, only the matrices travel per frame.

**Software path** (no GPU — native Pi / tests): the rasteriser reads the same
array through the same accessor and does the shader's job on the CPU
(`three/src/three_software_backend.rgr:98–109`):
```
; project every vertex to screen space (sx, sy, sz=NDC depth)
def lx:double (geometry.getPosition(vi 0))
def ly:double (geometry.getPosition(vi 1))
def lz:double (geometry.getPosition(vi 2))
```
Same data, two renderers — which is the point of the flat-array core: the
vertex has one authoritative form, and each backend converts it at its own
boundary (float32 for GL, fixed-point ×256 for the native `gfx_3d_mesh_upload`
path).

## Stage 4 — read-back from guest code

This is where the architecture is honest about its gaps.

**Compiled WASM + JS, block mode (works today, legacy).** Because the guest
owned the vertex table, reading it back is just reading memory. The JS harness
does exactly that (`games/cube3d_wasm/tools/render.cjs:150–158`):
```js
const mp  = exp.rg_mesh_ptr();            // guest's mesh block address
const vc  = u32(mp + 16);                 // vertex count
const VTX = mp + 64, VSZ = 32;            // records: 32 bytes/vertex
for (let i = 0; i < vc; i++) { /* DataView reads at VTX + i*VSZ, /256 */ }
```
The host does the same word-by-word (`wasm3d_runner.rgr:475`
`wasm_mem_i32 handle (mb + 64 + (w * 4))`). The guest itself can read its own
static table with plain Rust. Read-back works — because there is no
abstraction, only shared bytes at agreed offsets.

**Compiled WASM, command mode (the current model): read-back does not exist.**
The guest holds an opaque `Entity` id and the host owns the vertices; the
`rg_*` import table (`scene.rs:728–786`) has creates and setters —
`rg_create_mesh_entity`, `rg_set_rotation` — and **no getter**. A guest that
needs a vertex (say, to fit a collision hull) must re-derive it from what it
asked for, hoping the host built the same thing — the world-encoded-twice trap
(0.6) waiting to reopen.

**TSX + JS: the façade lies politely.** `games/cube/index.tsx:53` reads
`mesh.geometry.width` — but that touches only the façade's *own data prop*, the
argument it passed at construction. The real `positions` array in the core is
unreachable from game script. (In the browser the core is compiled to ES6, so
*host-side* JS can call `geometry.getPosition(i, c)` directly — the gap is
specifically the guest→core direction.)

**How the plan closes stage 4.** Reading a vertex back becomes one contract on
every path:

- The class registry gives geometry a typed read surface — e.g.
  `geometryVertexCount(geoH)` and `geometryGetPosition(geoH, i) → (x, y, z)` —
  generated for the host API, the WASM import table, and the JS wrapper alike,
  with the handle validated by generation + type id (II.B) so a stale
  geometry handle returns null instead of someone else's vertices.
- On the interpreter path the native adapter (bridge chapter) routes
  `mesh.geometry.getPosition(0)` through `getProperty`/`invokeMethod` to the
  *same canonical* `ThreeBufferGeometry` — so the façade stops answering from
  its private props.
- Residency (V.3) applies: vertex data is bulk state, so the contract should
  offer a bulk read (copy N vertices into a guest buffer in one call), not a
  per-component boundary hop — the block mode's one virtue, kept without its
  shared-offset fragility.

Once stage 4 exists, the vertex's life is a closed loop — constructed by a
command, stored once in the core, composed with a transform in the shader, and
readable back through the same handle that created it — on every backend, from
one definition.

---

# Engine core components and their file-system locations

The engine's core is spread across many folders. Some of it already sits in tidy
subsystem folders (`three/`, `physics/`, `model3d/`), some is loose at the engine
root (`framebuffer.rgr`, `gfx_sdl.rgr`, …), and some is mixed together with games
and demos under `scripting/`. This part maps every core component to the place it
lives today and the place it should end up. The target is a single `core/` folder
so the boundary between "engine" and "a game" is a real directory, not a naming
convention — and this map is the inventory that move works from.

Each chapter is written the same way: **Status now** describes what is on disk
today, then **Actions** lists what to do with it.

## I.1 The eval engine — `eval/`

### Status now
- `eval/` holds a self-contained copy of the JSX/TSX interpreter: `eval/jsx/`
  (`ComponentEngine.rgr` ≈ 7,300 lines, `EvalValue.rgr` ≈ 550, `JSXToEVG.rgr`),
  `eval/jpeg/JPEGMetadata.rgr`, and `eval/core/Buffer.rgr`.
- It was copied out of `gallery/pdf_writer/src/jsx/` and has **no** references
  back into `pdf_writer`. Its only external dependencies are the shared gallery
  modules `ts_parser/` and `evg/`.
- All 46 game-engine importers now point at this copy (`../eval/jsx/…`), and both
  `EvalValue` and `ComponentEngine` compile from the new location.
- This is the interpreter that runs `*.game.tsx` and `.as` scripts at runtime.

### Actions
- Develop the object-identity and native-adapter work (entity-registry and bridge chapters) directly
  on this copy, independent of `pdf_writer`.
- Move it back into `pdf_writer` once it is stable, or promote it to a shared
  module both can use.
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
- `three/src/` (87 files) is the canonical Ranger clone of Three.js — pure Ranger
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
- Treat `three/` as a reusable subsystem: either move it under `core/` or keep it
  a sibling of `core/` (decision C1).
- `three_scene_host.rgr` is the host end of the entity registry — its rework lives
  in the entity-registry chapter.

## I.4 Physics — `physics/`

### Status now
- `physics/src/` (60 files) is a full rigid-body engine behind a `PhysicsWorld`
  interface, with two implementations (an upgraded Cannon port and an independent
  arcade engine): vectors/quaternions, shapes, the SPOOK solver, broadphase,
  raycasting, joints, and a raycast vehicle.
- `physics/tsx/` (2 files) is the TSX bridge that exposes it to game scripts.

### Actions
- Reusable subsystem: `core/` or sibling (C1).
- Wire the `PhysicsWorld` interface to the WASM/`.as` guest ABIs so a compiled
  game can pick an engine (IDEAL.md §2.5).

## I.5 3D model loading — `model3d/`

### Status now
- `model3d/` (23 files) is the host-side, WASM-free object model: an
  `AssetRegistry` and `EntityRegistry`, a GLB importer, a `ModelInstancer`, and
  `ModelLoader` (load → instantiate → find child).
- Its `EntityRegistry` is a **second**, index-based registry — the same pattern as
  the Three host, hand-rolled again.

### Actions
- Reusable subsystem: `core/` or sibling (C1).
- Fold its `EntityRegistry` onto the shared registry defined in the entity-registry chapter so there
  is one implementation, not two.

## I.6 The host runtime facades — `scripting/game_*.rgr`

### Status now
- 40 `game_*.rgr` files are the game-neutral host runtime: `game_runtime` (the
  loop, script loading, hot reload), `game_physics`, `game_audio`, `game_hud`,
  `game_sprite`, `game_camera`, `game_input`, `game_particles`,
  `game_persistence`, `game_fixed_step`, `game_runner_mode`, `game_entity_store`,
  `game_world_grid`, the provider and catalog files, and more.
- They live in `scripting/` mixed in with games, demos, runners and ABI code.

### Actions
- Move the game-neutral facades to `core/runtime/`.
- Any file here whose name or contents names a specific game is not core — a
  generic runtime file must know nothing about a specific game (AGENTS.md rule
  #1) — so it moves to that game under `games/` instead.

## I.7 The guest ABI — `wasm/` + `scripting/wasm_*.rgr` / `as_*.rgr`

### Status now
- `wasm/` holds the shared byte-layout headers that every guest language mirrors:
  `wasm_game_abi.h`, `wasm_input_abi.h`, `wasm_pose_abi.h`, `wasm_sprite_abi.h`,
  `wasm_ui_abi.h`, plus two guests (`as_resource_loader/`, `rust_worker/`).
- `scripting/` holds the host side of those ABIs — 19 `wasm_*.rgr` / `as_*.rgr`
  files: `wasm_abi_io`, `wasm_ui_io`, `wasm_cap_gate`, `wasm_block_validator`, the
  `as_abi_bridge`, and so on.

### Actions
- Move the headers and the host IO to `core/wasm/`.
- Keep game taxonomy out of the headers — body indices and sound ids are
  conventions the guest defines, not part of the transport (IDEAL.md §2.1).

## I.8 Generic runners — `scripting/*_runner*.rgr`

### Status now
- 28 runner files load a game and drive it each frame through the ABIs:
  `wasm_game_runner`, `wasm_physics_runner`, `wasm_sprite_runner`,
  `as_source_runner`, the SDL runners, split-screen, streaming, and others.
- A few still `Import` a specific game (e.g. `wasm_physics_runner` reaches into
  `wasm_autopeli_setup`/`_render`) — a runner is supposed to know no game.

### Actions
- Move the game-neutral runners to `core/runtime/`.
- Break the game imports: a runner binds to a game through a `GameSceneProvider`
  seam, so a second game reuses it unchanged (IDEAL.md §8). Game-named runners
  move to their game under `games/`.

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
- Each is its own domain and knows no specific game, so each is a reusable
  subsystem: `core/` or sibling (C1).

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
- `scripting/*_demo.rgr` (30) — demo runners; 22 orphaned demos were already
  removed, the rest are still referenced by the test suite.
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
- The eval-engine copy (I.1) already proved the mechanic end to end: five files
  relocated and 46 importers repointed, both compiling from the new location.

### Actions
- Move in blast-ordered, compile-verified tranches:
  1. loose gfx roots → `core/gfx/`;
  2. `wasm_runtime` + the ABI headers and host IO → `core/wasm/`;
  3. the game-neutral facades and runners → `core/runtime/`;
  4. the subsystems (`three/`, `physics/`, `model3d/`, …) per decision C1.
- After each tranche, compile the affected roots before committing.
- No file is deleted during the move; the delete list is drawn only once the
  boundary exists (I.11).

# Entity registry and stable object identity

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
the host dispatch a bridge call without downcasting (the bridge-call model (III.5)).
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
id."

---

# Three object model: identity, reconciliation, resource handling

## III.1 Interpreter object semantics (identity + missing member)
The evaluator lacks stable object identity and returns `null` for missing
members — tracked in [`docs/TSX_ENGINE_ISSUES.md`](./docs/TSX_ENGINE_ISSUES.md)
(#7 identity, #8 missing→`undefined`). The identity fix is **II.A** (it is
engine-wide, not Three-only); missing→`undefined` is its interpreter-local
companion. Both gate §III.2–III.4 and the native adapter (bridge chapter). The
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
guest never sees host memory. This is the same id as II.B/II.C.)

## III.3 Reconciler: key by identity, mark-and-sweep
Today `three_tsx_bridge.rgr` keys nodes by array index / DFS ordinal and assumes
a stable tree shape (`:77,86,89`), so a remove/reorder/reparent/mid-list-insert
or a hot-reload leaves stale host objects behind.

**Fix:** maintain identity→handle maps (`EvalValue id → entity`, `geometry id →
geometry`, `material id → material`, `texture id → texture`). Each reconcile:
1) mark reached identities, 2) create missing, 3) update changed, 4) **destroy
unmarked**, 5) set parent links explicitly. Never use an array index as identity.
(The identity is II.A; the handle it maps to is II.B.)

## III.4 Resource sharing → see II.E
The `buildMeshH()` duplicate-resource bug and its fix (shared geometry/material
resolve to one handle) are the concrete payoff of the identity scheme, covered in
**II.E**. In reconciler terms: step 2 of III.3 looks a resource up by its
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
the one **Class Registry** contract — see **the class-registry chapter**.

## III.7 Harden the parity rig (`THREE_VALUE_PARITY_TESTS.md`)
Good foundation (real Three.js goldens, natural Three code as input, render vs
value parity split, honest 0/31 reporting), but:
- The test can pass a broken case by accident. When a value is missing it comes
  back as `null`, and the check turns `null` into `0` (or `false`) before
  comparing — so if the correct answer happens to be `0` or `false`, a missing or
  broken feature still looks correct. Fix: check the value's type before
  comparing, and label each field `OK`, `MISSING`, `WRONG TYPE`, `WRONG VALUE`, or
  `ERROR` instead of a bare pass/fail.
- Give the interpreter semantics gaps their **own** suite (a
  `component_engine_js_semantics_test`) covering the items in
  [`TSX_ENGINE_ISSUES.md`](./docs/TSX_ENGINE_ISSUES.md) (#7 identity, #8
  missing-member, etc.), so JS-runtime gaps don't hide inside the Three-API "GAP"
  bucket.
- Add **cross-layer** parity (façade state == host canonical object) and
  regression tests for the behaviors already specified in **II.E** (resource
  aliasing, refcounted lifetime) and **III.3** (real removal; stable identity
  under insert/reorder/reparent) — a bounded resource count on reload is the
  headline assertion.
- Report **several numbers, not one percentage.** A single "X% of Three.js
  works" hides *why* a case failed and drifts every time a probe is added.
  Instead count each stage separately: how many cases **ran without throwing**,
  how many returned the **right type**, how many the **right value**, and how many
  have the **façade state matching the host object**. Group the tests into named,
  versioned sets (e.g. `three-core-math-v1`, `object3d-v1`) so each area's
  progress is tracked on its own instead of in one moving aggregate.

---

# Class registry: the bridge contract (requires separate review)
> A **contract**, not a codegen convenience. The bridge between any front-end
> (interpreter / WASM guest / native) and `ThreeSceneHost` is defined by a
> registry of **classes → their methods and props**. A guest compiled against it
> can outlive a host change, so it must be **backward compatible** and every edit
> goes through change review. It belongs with the ABI (alongside `wasm/*.h`,
> `ABI_V1.md`, `ABI_V2_PROPOSAL.md`).

**What it holds** — for each exposed class, one stable record:
```
class {
  classId : u32          ; stable, never reused — this IS the Object Type ID (entity-registry chapter)
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
wrappers, the native-adapter registrations (bridge chapter), the doc command table, and a
**surface-parity test** that fails if any generated face is missing a member —
closing today's drift (host 10 geometry constructors vs native-bridge 2). The
`classId` is the Object Type ID the host dispatches on (III.5, bridge-call
model).

**Status — SPECIAL REVIEW.** It governs every front-end and any compiled guest,
so freeze its shape before building codegen on it. Open: id widths, the type set,
where the registry lives (a `.rgr` table vs a data file), and how it maps onto
the existing `wasm/*.h` ABI headers.

# Bridge implementation: native classes and native modules
The bridge is how interpreted game code reaches host/native functionality
**without pointers** — it is the runtime side of the Class Registry contract
(class-registry chapter). It has **two surfaces**: native *classes* a script constructs
(`new THREE.Vector3()`), and native *modules* a script imports
(`import * as Ranger from "ranger-game"`). Both are versioned by, and
backward-compatible under, the class-registry contract.

## V.1 The façade stays — but it is declared once, and it is thin
The façade module is still needed: something must answer
`import * as THREE from 'three'` and declare the THREE names to the interpreter.
What changes is what's *inside* it and how many copies exist:

- **Thin, not hand-written.** Today `three.tsx` hand-copies ~90 Vector3/Object3D
  method bodies (plus the `__removed` hack, `three.tsx:60,67,71`) while the real
  math should live only in Ranger core. With the adapter (V.2), the façade stops
  implementing anything — it only *declares* which names bind to which registered
  native classes (and can be generated from the class registry).
- **One copy, not one per game.** Today the façade is copied into every 3D game
  folder — `three/tsx/three.tsx` (585 lines) plus diverged copies in
  `games/cube/` (350), `games/cubes/` (350), `games/teapot/` (237),
  `games/sponza/` (337). They diverged because the interpreter resolves the bare
  import `'three'` by looking in the **game's own directory first**
  (`readImportSource`, ComponentEngine:1160), so each game keeps a private copy
  that drifts on its own. The interpreter already has the fix built in: the same
  function falls back to the `assetPaths` search list — so the runner adds the
  one shared façade directory to `assetPaths`, `import 'three'` resolves to the
  **single canonical file** from every game, and the per-game copies are deleted.

The same declared-once rule applies to the other shared script modules that have
started duplicating (`game_helpers.tsx` and `game.d.ts` exist in both
`scripting/` and `lib/`; `breakout.d.ts` in two places).

## V.2 Native-class adapter (`NativeClassAdapter`)
The interpreter **already** wraps one native Ranger class: `valueType 7`
(`EvalValue.element(el:EVGElement)`). Generalize that hook — a `nativeObject` +
`nativeClassId` slot, with **one adapter per class in the Class Registry (Part
IV)** registered with the ComponentEngine (`EVGElement` becomes client #0):
```
interface NativeClassAdapter {
  fn className() : string                       ; "Vector3" | "Object3D" | …  (== a class-registry class)
  fn construct(args:[EvalValue]) : NativeRef     ; new THREE.Vector3(x,y,z)
  fn getProperty(self:NativeRef key:string) : EvalValue
  fn setProperty(self:NativeRef key:string v:EvalValue) : void
  fn invokeMethod(self:NativeRef m:string args:[EvalValue]) : EvalValue
}
```
Canonical types: `Vector3`↔`Vec3`, `Matrix4`↔`Mat4`, `Quaternion`↔`Quat`,
`Object3D`↔host `ThreeObject3D` — chosen so interpreter, host, and parity read
the **same** math. A host-backed `NativeRef` gets an `identityId` (entity-registry chapter), so
shared instances are one value everywhere (what makes II.E aliasing + III.3
reconciliation work); its *lifetime* is the lifetime/GC chapter.

## V.3 Residency — guest-side, host-side, or hybrid
Not every bridged class is host-backed, and this split is a first-class part of
the contract because crossing the boundary (especially WASM) per call is
expensive. Each class is one of:
- **Guest-side** — a plain interpreter value; every method runs in the
  interpreter, no host round-trip. Right for hot value math (`Vector3.add`
  shouldn't cross the boundary).
- **Host-backed** — the canonical object lives in the host registry (entity-registry chapter) and
  every method proxies to native. Required when the host owns the truth
  (`Object3D` in the scene graph, GPU resources).
- **Hybrid** — host-backed, but its *hot* methods run guest-side on a mirrored
  value while its *state-changing* methods proxy to the host. e.g. `Vector3`
  arithmetic stays local; assigning it into `mesh.position` syncs to the host.

So the **class registry marks each method/prop with an execution site**
(`guest` | `host`), and the adapter proxies only the `host` ones. Keeping value
types guest-side is also what keeps the GC problem (the lifetime/GC chapter) small.

## V.4 Object invocation (the dispatch path)
How the interpreter drives a native-class value at runtime — four hooks. The
façade only maps the name `THREE.X` to a registered class (V.1); it contributes
no code to any of these paths:
```
new THREE.X(args…)   -> adapter.construct(args)  -> EvalValue holding a NativeRef
obj.prop             -> adapter.getProperty(ref, "prop")
obj.prop = v         -> adapter.setProperty(ref, "prop", v)
obj.method(args…)    -> adapter.invokeMethod(ref, "method", args)
```
The interpreter picks the adapter by the value's `nativeClassId` (== the class-registry
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
as V.2, and the module's exported names/signatures are part of the
**class-registry contract** (versioned, append-only), so a game compiled against `ranger-game`
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

# Object lifetime and garbage collection across the boundary
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

# Guest support libraries: single definition, generated output
Today the same support classes are hand-written over and over, on two axes:
- **Per language:** `three.tsx` carries a full `Vector3`/`Object3D` façade (~90
  method bodies), the Rust WASM helpers duplicate the math in
  `lib/ranger_game/src/scene.rs` (`Vec3`, `Quat`, `Color`, `Scene`), and an
  AssemblyScript guest would add a third copy.
- **Per game:** the `three.tsx` façade itself is copied into each 3D game folder
  and has already diverged — 585 lines canonical vs 350/350/337/237 in
  `games/cube`, `cubes`, `sponza`, `teapot` (see V.1 for why, and the fix).

Same classes, N implementations → the same drift as the command ABI, at the
class level: a method fixed in one copy stays wrong in the others.

**Rule: a support class is defined once and every face of it is generated from
that definition — never hand-copied per language, and never copied per game.**
Concretely:
- The **class registry** is that single definition (names, methods,
  props, types).
- On the interpreter path, the adapter (bridge chapter) empties the façade of
  implementation: one thin, shared `three.tsx` remains, declaring name→class
  bindings, resolved from a shared search path by every game (V.1).
- For compiled guests (Rust/AS) that genuinely need local structs, **generate**
  them from the registry (the same codegen that emits the wrappers in the class-registry chapter),
  so `lib/ranger_game/` scene types and the AS equivalents can't diverge from the
  host.
- A **parity test** asserts each generated guest support matches the registry —
  the class-level analog of the class registry's surface-parity test.

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

**C. Class Registry + codegen** — new (class-registry chapter)
- The registry data (classes/methods/props + Type IDs). **M**
- Generators: `ThreeSceneHost` iface, `three_native_bridge` has/invoke, WASM
  imports, TS/Rust wrappers, doc table, surface-parity test. **L**

**D. Three façade & reconciler** — `three/tsx/`
- `three.tsx` (585) — strip the hand-copied `Vector3`/`Object3D` method bodies +
  `__removed` hack; keep one thin declaration façade (V.1). **M**
- Delete the diverged per-game copies (`games/cube`, `cubes`, `sponza`,
  `teapot`); resolve `'three'` via the shared `assetPaths` search dir instead. **S**
- `three_tsx_bridge.rgr` (1109) — reconciler: index/DFS cache → identity-keyed
  mark-and-sweep; resource reuse by identity. **L**
- `three_native_bridge.rgr` (206) — regenerated from the registry. **S**

**E. Host registry** — `three/src/`, `model3d/`
- `three_scene_host.rgr` (394) — generation handles + `typeId` + `resolveAs` +
  refcount; make `entityRemove` free. **M**
- `model3d/EntityModel.rgr` — fold its parallel `EntityRegistry` onto the core. **M**

**F. Guest support (generated, not hand-copied — the guest-support chapter)**
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

# Decisions
- **D1 = keep `ranger_games/`.** File cleanup complete at tranche 1; no further
  deletions.
- **D2 = native-object adapter** for broad Three.js support (bridge chapter).
- **D3 = keep planning.** No code yet; this doc + `docs/ADR-0001-three-scene-
  host-authority.md` are the artifacts to review.

**Open for your review:** this is a design/analysis document, not yet a project
plan — no ordering or scheduling is implied. Sequencing comes later, once the
design is agreed.

---
*Cleanup tranche 1 committed. The rest is design-only, under review.*
