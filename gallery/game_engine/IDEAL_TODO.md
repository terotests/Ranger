# IDEAL_TODO — the road from today's ABI to the target

> Companion to [`IDEAL.md`](./IDEAL.md) (the *why*) and
> [`IDEAL_API.md`](./IDEAL_API.md) (the *what*). This file is the *how*: the
> ordered, checkable work list that turns the target specification into code.
>
> Each item names the concrete files it touches, the `IDEAL.md` / `IDEAL_API.md`
> section it satisfies, and a check that tells us it landed. Status markers:
> `[ ]` not started · `[~]` in progress · `[x]` done.

The order follows `IDEAL.md` §"Affected areas" rows 1–14, grouped so that each
phase is independently landable and verifiable. Rows 1–4 are ABI-surface cleanup,
5–7 the wiring/enforcement layer, 8–11 the seam/ownership moves, 12–14 the input,
docs, and proof that lock parity in.

The guiding invariant (IDEAL.md §0): **a hypothetical *second* game of the same
genre must reuse a core file unchanged.** Every item below moves one thing off the
wrong side of the engine-core ↔ game boundary, or opens a seam that was welded shut.

---

## Status snapshot

| Phase | State |
|-------|-------|
| 0 groundwork + leak guard | ✅ done |
| 1 header taxonomy cleanup + generic control channels | ✅ done |
| 2 new headers (RGP1, RGIN) + additive physics/input/cap fields | ✅ done |
| 3 gate · RGCQ resolver · block validator · provider registry | ✅ core done (byte-plumbing + `.as` gate = tracked follow-ups) |
| 4 scene-provider seam · sound palette | 🟡 seams landed + proven; runner rewire, single-owner (4.2), sprite roster (4.3) remain |
| 5 richer input · CI leak guard · conformance fixtures | ⬜ not started |
| R runtime correctness (fixed-step, input, transactional load) | ⬜ not started — from an external review, all 8 findings re-verified against source |
| G 3D graphics (mesh · camera · lighting · materials/textures · resource loader · player physics) | 🟡 Phase-1 slices landed: `games/cube3d_wasm` (textured lit cube via `rg_res_load`) + `games/fps_wasm` (Doom-style character-controller walk-around, z-buffer + near-clip); rigid-body `cannon` wiring + `.rgr`/SDL host = follow-ups |

**Three.js clone (separate track, not an ABI phase).** The portable Ranger clone
of Three.js ([`IDEAL_THREE.md`](./IDEAL_THREE.md), `three/`) is tracked outside the
phases above. The cube and teapot examples run 1:1 in the interpreter (the teapot
renders on the GPU in the browser); the Sponza light-probe example
([`three/IDEAL_SPONZA.md`](./three/IDEAL_SPONZA.md)) runs interpreted with hot
reload (`three/tsx/three_sponza_tsx_test.rgr` in `run.sh`) and has a native SDL
runner (`three/sponza_sdl_runner.rgr`, C++-codegen verified). Remaining: a native
glTF **file** loader (the accessor decoder is done), the render-to-texture (FBO)
passes for the shadow map + probe bake in `ThreeGLBackend`, and the browser +
playground host for `sponza.tsx`. See `IDEAL_THREE §8`.

**Verification strategy (three tiers, no SDL/WASM build needed).** This approach
emerged during the work and proved repeatable — new items should follow it:

1. **Pure self-test** — extract the logic into a pure function/class and ship a
   `scripting/<name>_demo.rgr` that compiles through the Ranger compiler, runs on
   node, and prints `RESULT: N passed, 0 failed`. The tested code IS the shipped
   code (e.g. `FixedStep.plan`, `RunnerModeClassifier`, `GameScriptContract`), so
   the test isn't a parallel reimplementation.
2. **Native-target compile** — compile the touched core file with `-l=cpp`
   (Ranger→C++), which catches type/interface breakage the es6 path misses and
   proves the change builds for the SDL/Pi target.
3. **Real-game integration** — where a change touches the shared runtime, drive a
   real game headlessly (`breakout_runner_demo.rgr` runs `breakout.game.tsx`
   through the full `GameRunner`) and assert no regression / no false-positive.

The ceiling is the SDL binary link (needs SDL2 headers, absent here); anything
that can only be observed by running the SDL window is marked as a follow-up
rather than done blind. Current suite: **10 self-tests, 120 assertions, 0
failing** (`wasm_cap_gate` 6, `wasm_block_validator` 13, `game_provider` 12,
`game_env_resolver` 11, `game_scene_provider` 15, `game_sound_palette` 14,
`game_fixed_step` 16, `game_split_world` 6, `game_script_contract` 12,
`game_runner_mode` 15), plus the breakout real-game integration run.

**Regression check (WASM autopeli, the highest-risk path).** The cap gate was
wired into `wasm_physics_runner` — the autopeli runner. Confirmed safe:
- the full runner compiles **Ranger→C++** (`build-wasm-autopeli-demo.sh`; the
  final link needs SDL2 headers, absent in this env — unrelated to the changes);
- `runtime/rg_wasm_bridge.c` + `rg_wasm_has_export` compiles against wasm3;
- the autopeli guest exports **no** handshake functions → the gate admits it as a
  legacy v1 / caps-0 guest, i.e. **no behaviour change**;
- `game_sdl_runner` (ties every touched runner + audio) compiles Ranger→C++;
- the interpreted `.as` autopeli physics demo **runs** and the car moves under
  control (exercises the `writeControlChannel` refactor) — "AS PHYSICS
  INTEGRATION OK".

## Discoveries during implementation (fed back into the docs)

- **RGIN lacked the standard `revision` word.** IDEAL_API §0.3 mandates a seqlock
  `revision` on every block, but §2.5's RGIN header omitted it. Added
  `RG_IN_OFF_REVISION` (header now 20 B, records at 20) and updated §2.5.
- **The gate needs export-presence detection.** `has(rg_abi_version)` in the §1.1
  pseudocode assumes the host can tell "not exported" from "exported and returned
  0". Added the `rg_wasm_has_export` wasm3 primitive and noted the requirement in
  §1.1.
- **Reserved cap bits made concrete.** §8 left `UI_DYNAMIC` as `0x0020?` and
  `RES_STREAM` as *tbd*; assigned `0x0020` / `0x0040` in the header and §8.
- **RGIN was missing from the §2.1 block overview** (only specified in §2.5); added
  it to the index table.
- **RGCQ byte exchange is blocked on a missing primitive.** Only
  `rg_wasm_mem_read_i32` exists; reading the guest's declared query keys needs a
  byte/string read. Recorded as the concrete blocker on 3.2's remaining work.
- **A failed wasm load silently rendered as Pong.** `game_sdl_runner.loadWasmAt`
  never checked whether `WasmGameRunner`/`WasmPhysicsRunner` actually loaded the
  module, and `WasmGameRunner` renders a hardcoded ball+paddles court reading
  zeroed getters — so *any* wasm game that fails to load (missing host import, bad
  module, gate rejection) looked like "Pong opened." Fixed: both runners expose
  `isLoaded()` and `loadWasmAt` aborts to the menu (`abortWasmLoad`) on failure
  instead of falling through. This bit the `cube3d_wasm`/`fps_wasm` PoCs (they
  import `rg_res_load`, absent in the SDL host) and is a general robustness fix for
  every future wasm game.

---

## Phase 0 — groundwork & safety net

Nothing structural; just make the cleanup measurable before we start moving code.

- [x] **0.1 Write this plan** (`IDEAL_TODO.md`). Ordered, per-item checks.
- [x] **0.2 Leak-guard grep** — `scripts/abi-leak-guard.sh` greps every *generic*
  core file for a game name (`autopeli|pong|pacman|invaders|breakout`) and every
  shared header for a taxonomy leak, exits non-zero on a hit.
  *Check:* the header-taxonomy pass is now clean; it still lists the two known
  game-name-in-core leaks (`wasm_physics_runner.rgr`, `game_runtime.rgr`) that
  Phase 4 rows 8/9 remove. (IDEAL.md §7, row 13.)
- [x] **0.3 Confirm the header-taxonomy constants are dead** before deleting.
  *Check:* `grep -rn RG_WASM_ID_CONE0|RG_WASM_SOUND_WALL|RG_SPR_CHAR_HERO` finds no
  reference outside the two headers (already verified — guests define their own).

---

## Phase 1 — ABI-surface cleanup (rows 1–4): the header stops being a taxonomy

Additive/safe: no host or guest code references the constants being removed, so the
risk is low and this phase can land first.

- [x] **1.1 Split game taxonomy out of `wasm_game_abi.h`** (row 1, IDEAL.md §2.1).
  Remove `RG_WASM_GRIP_SCALE`, `RG_WASM_STEER_SCALE`, `RG_WASM_ID_CONE0`,
  `RG_WASM_ID_BAR0`, `RG_WASM_BODY_TRAFFIC0`, `RG_WASM_TRAFFIC_COUNT`,
  `RG_WASM_SOUND_WALL/BOUNCE/WIN`, `RG_WASM_BODY_P1/P2`, and the
  `Standard body indices (autopeli)` comment. Rewrite remaining comments to say
  "conventions the guest defines". The autopeli guest already owns equivalents
  (`STEER_SCALE`, `TRAFFIC_COUNT`, … in `rust_autopeli/src/lib.rs`).
  *Check:* header contains no game noun; `grep -i autopeli wasm/wasm_game_abi.h` = 0.
- [x] **1.2 Split roster out of `wasm_sprite_abi.h`** (row 10, IDEAL.md §2.1/§2.8).
  Remove `RG_SPR_CHAR_HERO/KNIGHT/MAGE/ROGUE/COUNT`; the roster is the catalog table
  `RG_SPR_OFF_CAT_IDS` (already present). Reframe `RG_SPR_ANIM_WALK/RUN/JUMP` as a
  documented *default convention*, not a frozen enum (data-driven atlas rows target).
  *Check:* `grep RG_SPR_CHAR_ wasm/` finds only guest sources, not the header.
- [x] **1.3 Generic control channels** (row 2, IDEAL.md §2.2, IDEAL_API §2.2).
  Add `RG_WASM_CTRL_OFF_CH0..CH3` to `wasm_game_abi.h`; document the 16-byte control
  record as four opaque scalar channels named by the guest.
  *Check:* header defines `RG_WASM_CTRL_OFF_CH0`; comment names no car part.
- [x] **1.4 Host side genre-neutral accessor** (row 2). `scripting/wasm_abi_io.rgr`
  now exposes `readControlChannel(bodyIdx, ch)`; the four car-named readers delegate
  to it as thin deprecated shims (their car interpretation moves to the guest/scene
  provider in Phase 4, when the runner stops holding the concrete autopeli setup).
  `scripting/as_abi_bridge.rgr` gains `writeControlChannel(i, ch, v)` (guest-facing)
  with `writeControl` delegating to it.
  *Check:* both files compile via the Ranger compiler; core exposes the indexed
  channel accessors. (Full removal of the named shims is gated on Phase 4.1.)

---

## Phase 2 — give every informal block a header (row 3) + additive physics/input fields

Brand-new `wasm/*.h` files and additive constants. Nothing existing breaks.

- [x] **2.1 `wasm/wasm_pose_abi.h` (RGP1 v2)** (row 3, IDEAL.md §2.4, IDEAL_API §2.4).
  Full header: magic/version/size/seqlock revision, present/gesture/lm_count/time/dt/
  flags, aggregate body vx/vy/speed, per-landmark x/y/vx/vy/speed/conf, `FP_SCALE`/
  `FP_VEL`, `RG_POSE_FLAG_*`, `RG_WASM_HOST_CAP_POSE_INPUT`.
  *Check:* file exists, offsets match IDEAL_API §2.4 byte-for-byte.
- [x] **2.2 Additive physics constants in `wasm_game_abi.h`** (row 3, IDEAL.md §2.5).
  Add contact phases `PERSIST`/`END`; shape kinds `CIRCLE/BOX/SEGMENT/POLYGON`;
  body flags `STATIC`/`SENSOR` (keep `ACTIVE`); document the contact record's
  proposed manifold additions (depth, tangent impulse) and `MAX_CONTACTS`
  drop-lowest-impulse overflow policy.
  *Check:* header defines `RG_WASM_CONTACT_PHASE_END` and `RG_WASM_SHAPE_BOX`.
- [x] **2.3 RGW1 view fields + input record header** (row 12, IDEAL.md §2.14/§2.9).
  Add view-size documentation to RGW1's host→guest words and a new
  `wasm/wasm_input_abi.h` (RGIN) per IDEAL_API §2.5 (per-player 40-byte typed record:
  buttons, sticks, triggers, pointer, flags).
  *Check:* `wasm_input_abi.h` exists with `RG_IN_OFF_LSTICK_X` etc.
- [x] **2.4 New capability bits** (IDEAL_API §8). Add `RG_WASM_HOST_CAP_POSE_INPUT`
  `0x0010` (in game header + pose header), reserve `RG_WASM_HOST_CAP_UI_DYNAMIC`
  `0x0020` and `RG_WASM_HOST_CAP_RES_STREAM` `0x0040`.
  *Check:* `grep POSE_INPUT wasm/wasm_game_abi.h` = 1.
- [x] **2.5 `wasm/README.md` ABI index** (row 13, IDEAL.md §7). One table of every
  block: name, header, magic, version, size, direction, cadence, status.
  *Check:* file lists RGW1/RGSP1/RGU1/RGP1/RGIN with links.

---

## Phase 3 — the wiring/enforcement layer (rows 5–7)

Now the headers exist; make the host *use* the handshake and validate uniformly.

- [~] **3.1 Activate the capability gate** (row 5, IDEAL.md §6, IDEAL_API §1.1).
  Shared helper `scripting/wasm_cap_gate.rgr` (`WasmCapGate`): reads
  `rg_abi_version` / `rg_required_caps` (a missing optional export = legacy
  v1/caps 0 via the new `wasm_has_export` bridge primitive), rejects `ver > host`
  or `need & ~hostCaps` with a surfaced reason. Wired into the three WASM runners'
  load paths — `wasm_physics_runner.rgr` (advertises PHYSICS|RGU1),
  `wasm_game_runner.rgr` (no optional caps), `sprite_wasm_runner.rgr` — each
  closing the handle and bailing on rejection, before `init()`.
  Native bridge: `rg_wasm_has_export` added to `runtime/rg_wasm_bridge.{c,h}` +
  `wasm_has_export` op in `wasm_runtime.rgr`.
  *Check:* `wasm_cap_gate_demo.rgr` self-test — 6/6 pass (legacy passes, present
  cap passes, missing cap rejected, newer ABI rejected, `addCap` admits, multi-cap
  passes); all three runners compile with the wiring.
  *Remaining:* the interpreted `.as` path (`as_source_runner.rgr`) needs an
  interpreted-export presence probe (EvalValue API) — tracked as a 3.1 follow-up.
- [~] **3.2 Resolve RGCQ / `rg_check_env`** (row 5, IDEAL_API §1.2). The
  game-neutral answer source landed: `scripting/game_env_resolver.rgr`
  (`EnvResolver` + `EnvValue`) resolves the documented core key set (screen.*,
  device.type, input.*, audio/haptics/gpu/storage/network, locale,
  clock.monotonic, log.level, debugmode) to typed values (BOOL/INT/STRING),
  returning `present=false` for unknown keys so a guest keeps its default.
  *Check:* `game_env_resolver_demo.rgr` self-test — 11/11 pass (typed answers,
  configured vs default host, unknown-key fallthrough).
  *Remaining (needs new plumbing):* the RGCQ byte exchange — read the guest's
  declared keys from the RGW1 tail, write these answers + `present`/`type`, set
  `READY=1`, call `rg_check_env`. Blocked on a byte/string wasm-memory read
  primitive (only `rg_wasm_mem_read_i32` exists today) and a guest that actually
  declares queries to verify end-to-end.
- [~] **3.3 Uniform block validation** (row 6, IDEAL_API §0.3). New
  `scripting/wasm_block_validator.rgr` (`WasmBlockValidator`): one `validate`
  (magic / version≤host / size), `validateMinSize` for variable-size blocks
  (RGP1/RGIN), and `clampCount` (never trust a guest count). Wired into
  `wasm_abi_io.rgr` — `verifyBlock()` + `clampCount()` delegate to it; the stale
  magic-only `verifyMagic` is kept as a thin compat shim.
  *Check:* `wasm_block_validator_demo.rgr` self-test — 13/13 pass across RGW1 /
  RGSP1 / RGP1 / RGIN (valid, wrong-magic, version-0, newer-version, size-mismatch,
  min-size, count clamps); `wasm_abi_io.rgr` compiles.
  *Remaining:* migrate RGSP1/RGP1/RGIN readers + the `.as` bridge to call
  `verifyBlock`/`clampCount` at their read sites (replacing per-block ad-hoc checks).
- [~] **3.4 Provider registry** (row 7, IDEAL.md §6, IDEAL_API §7). New
  `scripting/game_provider.rgr`: `GameProvider` base/interface (`id / capBit /
  direction / cadence / onAttach / onDeclare / beforeUpdate / afterUpdate /
  onDetach`), a `GameProviderRegistry` (`attach / advertisedCaps / provides /
  byId / *All` lifecycle fan-out), and concrete `PhysicsProvider` (0x1),
  `Rgu1Provider` (0x8), `PoseInputProvider` (0x10). `WasmCapGate` gains
  `setHostCapsFromRegistry(reg)` so advertised caps = OR of providers by
  construction. `wasm_physics_runner.rgr` now attaches its providers and derives
  the gate's caps from the registry (no hardcoded cap list).
  *Check:* `game_provider_demo.rgr` self-test — 12/12 pass, proving attaching a
  provider widens advertised caps and the gate admits the newly-covered guest;
  `wasm_physics_runner.rgr` compiles.
  *Remaining:* migrate the existing `game_pose_provider.rgr` / `game_image_loader.rgr`
  onto `GameProvider` and route the runners' per-frame drain through the registry's
  `beforeUpdateAll` / `afterUpdateAll` (overlaps Phase 4 seam work).

---

## Phase 4 — seam & ownership moves (rows 8–11)

The structural payoff: core compiles against interfaces, the guest owns the world.

- [~] **4.1 `GameSceneProvider` seam** (row 8, IDEAL.md §3, IDEAL_API §7). The
  interface landed: `scripting/game_scene_provider.rgr` (`GameSceneProvider` base
  with genre-neutral defaults) carries the game's world size, player count,
  camera policy, body-id↔code convention, sprite mapping, and sound/particle
  event vocabulary — the exact constants that leak into core today (6000, 5640,
  2, wall/bounce/win, the assets path). Autopeli's implementation lives in its
  game module: `games/autopeli_wasm/scene/autopeli_scene_provider.rgr`.
  *Check:* `game_scene_provider_demo.rgr` conformance test — 15/15 pass: autopeli
  AND a second `BumperSceneProvider` (800×800, 4 players, own sprites/sounds)
  drive the SAME interface reference through one `describe()` "core" function, and
  the base default leaks no game (§0 invariant proven).
  *Remaining (needs SDL build to verify runtime):* rewire `wasm_physics_runner.rgr`
  to hold a `GameSceneProvider` and read world/camera/sound/sprite through it,
  then drop the `wasm_autopeli_setup` / `wasm_autopeli_render` imports and the
  hardcoded wall/bounce/win map — clearing the runner's leak-guard hits.
- [ ] **4.2 Single world owner** (row 9, IDEAL.md §5). Guest declares bodies/bounds/
  world-size/camera through the declare-once channel; delete
  `wasm_autopeli_setup.rgr`'s host copy.
  *Check:* the road/traffic exist in exactly one file (the guest).
- [ ] **4.3 Data-driven sprite roster & animations** (row 10, IDEAL.md §2.8). Roster
  from `RG_SPR_OFF_CAT_IDS` + `lpc_char_catalog.rgr`; anim rows/cycles from atlas
  data (`atlas.json`), documented fallbacks; no `RG_SPR_CHAR_*`.
  *Check:* adding a character = a catalog entry, no header edit.
- [~] **4.4 Unified sound palette** (row 11, IDEAL.md §4, IDEAL_API §2.6/§4). The
  fixed sound enum is now a registry: `GameSoundPalette` (in `game_audio.rgr`)
  maps a sound NAME → `SynthToneSpec` as data; `registerDefaults()` installs the
  former hardcoded set (identical tones), and `GameAudio.registerSound(name, spec)`
  lets a game add/override sounds. The `if (id == "wall") {…}` ladder in
  `hasBuiltin`/`lookupSpec` is gone — both now do a table lookup.
  *Check:* `game_sound_palette_demo.rgr` self-test — 14/14 pass (empty palette,
  defaults preserve tones, register-new, override, unknown→default, and GameAudio
  consulting the palette + `registerSound`); `game_audio.rgr` compiles.
  *Remaining:* fold the `.as` integer `playSound` queue and the RGW1 sound sub-id
  into the same palette so the §2.6 sound-event record is identical on RGW1 / `.as`
  / TS (the scene provider's `soundName(sub)` from 4.1 is the RGW1→name hop).

---

## Phase 5 — input, docs, and proof (rows 12–14)

- [ ] **5.1 Richer uniform host→guest input** (row 12, IDEAL.md §2.9). Populate the
  RGIN record on every path; games declare semantic actions mapped through a
  remappable table; hotplug/resize as events.
  *Check:* an analog-stick guest reads `LSTICK_X` on both WASM and `.as`.
- [x] **5.1a RGP1 pose input reaches the compiled-WASM path (parity)** (rows 3/4/12,
  IDEAL.md §2.4). The `.as` path was the only one that could read pose; now the
  compiled-WASM path can too. Added `lib/ranger_game/src/pose.rs` (an RGP1 reader
  mirroring `wasm/wasm_pose_abi.h`) + `sprite_pose_game!` (sprite exports +
  `rg_pose_ptr`/`rg_pose_size` + `rg_required_caps = POSE`). The sprite host
  (`scripting/sprite_wasm_runner.rgr`) streams RGP1 into the guest each tick and
  renders the guest's RGU1 HUD + a skeleton overlay. All producers/consumers were
  aligned to the canonical layout (native `rg_pose.h/.cc`, `mediapipe/rgp1.mjs`,
  the `.as` bridge), closing the live drift and the view-size-in-coords leak.
  *Check:* `lib/ranger_game` layout test `pose_block_layout` (offsets byte-for-byte);
  `games/pose_arena` (`npm run engine:pose:verify`) runs the real `.wasm` in Node,
  streams RGP1, and asserts the RGSP1 sprite slot + the RGU1 HUD pose text; native
  `rg_pose_test.cc` passes on the canonical layout.
  *Remaining:* the `.as` FakePoseSource still uses a pixel (not normalized) landmark
  convention internally — normalize it + `games/pose_demo/game.as` for full
  value-level parity; a live SDL run once a camera source replaces the fake sweep.
- [ ] **5.2 CI leak guard wired** (row 13). Phase 0.2 grep runs in CI against every
  core file + header.
  *Check:* a deliberately-introduced `autopeli` in a core file fails CI.
- [ ] **5.3 Cross-path & second-game conformance fixtures** (row 14, IDEAL.md §7).
  A test that runs one guest on WASM *and* `.as` and diffs the block bytes; a second
  physics game under `games/`.
  *Check:* the two paths are byte-identical; the second game needs no core edit.

---

## Phase R — runtime correctness & state management (external review, verified)

A static source review (unrun) surfaced a class of bugs **orthogonal** to the
ABI-parity work above: fixed-step timing, input/player-count semantics, and
non-transactional backend switching in the runners. Every item below was
**re-verified against the current source at the cited line** before listing —
all confirmed. These are the highest production risk today (the review's words:
"the biggest production risk is mode/lifecycle management, not the rendering or
scripting idea"). Fix order follows the review's recommendation; each fix gets a
regression test (Phase 5.x / roadmap delta-time + gamepad gaps).

- [x] **R.1 (High) Fixed-step loop runs one extra step + leaves accumulator
  negative.** Fixed by extracting the scheduling into a pure planner
  `scripting/game_fixed_step.rgr` (`FixedStep.plan` → `FixedStepPlan{steps,
  residualMs}`): runs at most `maxSteps`, residual always in `[0, fixedStepMs)`
  (or 0 when the backlog is dropped at the cap) — never `maxSteps+1`, never
  negative. `game_runtime.frameWithInput` now calls the planner and loops
  `plan.steps` times. The tested code IS the shipped code.
  *Check:* `game_fixed_step_demo.rgr` self-test — 16/16 pass (incl. huge-dt caps at
  exactly `maxSteps` with residual 0, the boundary 48/49/100ms cases, and no
  negative residual); `game_runtime.rgr` compiles Ranger→C++.
- [ ] **R.2 (Low / semantics — likely intended, NOT a bug) `playerCount = 2` in
  the 1-player branch.** `game_input.rgr:262` — `buildFromSdl(1)` builds a P2
  "join" mask and sets `playerCount = 2`. The review read this as a bug, but it is
  almost certainly **deliberate drop-in co-op**: a second player can join at any
  time by pressing a button, which is exactly the behaviour wanted (esp. for kids'
  games). **Do NOT** "fix" it by reporting 1 — that would remove always-joinable
  P2. The only real weakness is naming: `playerCount` conflates *active players*
  with *joinable slots*. Optional refinement (behaviour-preserving): expose
  `activePlayerCount` / `availableSlots` / `joinRequested` so a game that needs the
  true active count can get it, while drop-in co-op stays the default.
  *Test (if refined):* `availableSlots == 2` while `activePlayerCount == 1` until a
  join input arrives — and the always-joinable P2 path is unchanged.
- [x] **R.3 (High) Input-edge sync omits left/right.** Fixed:
  `game_sdl_runner.syncInputEdges()` now reseeds `prevLeftHeld` (mask bit 16) and
  `prevRightHeld` (bit 32) alongside quit/up/down/action, so a button held across a
  mode switch / view open is no longer re-counted as a fresh press. Mirrors the
  existing up/down/action pattern with the bits the edge readers actually use.
  *Check:* `game_sdl_runner.rgr` compiles Ranger→C++. (Runtime edge behaviour needs
  the SDL build to exercise; the fix is a direct mirror of the working edges.)
- [x] **R.4 (High) Failed `.as` load leaves the runner half-switched.** Fixed:
  `loadAsAt` now loads **transactionally** — it builds a `candidate`
  `WasmPhysicsRunner` in a local, `init`s + `loadAsGame`s + `setupScene`s it
  WITHOUT touching active state, and only on success swaps `wasmPhysicsRunner =
  candidate` and flips the mode flags. A failed load returns with the prior runner
  and every mode flag untouched.
  *Check:* `game_sdl_runner.rgr` compiles Ranger→C++.
- [x] **R.5 (Medium) `entities()` called twice per scene setup.** Fixed:
  `setupScene` now calls the script's `entities()` exactly once, hoisting the
  result into `spawnEntities` and reusing it for both activation/seed and the
  retained-sprite spawn — a side-effecting/non-deterministic `entities()` can no
  longer diverge between the two uses.
  *Check:* `game_runtime.rgr` compiles Ranger→C++.
- [~] **R.6 (Medium) Runner boolean-flag soup permits illegal states.** First step
  landed: `scripting/game_runner_mode.rgr` — a `RunnerMode` enum (menu / tsx /
  tsx-split / wasm / wasm-physics / wasm-split / sprite / stream) + a **pure
  `RunnerModeClassifier`** that collapses the flags into one canonical mode AND
  rejects illegal combinations with a reason (two backends at once; physics
  without wasm; wasm-split without wasm or without split-active — including the
  review's exact example). `game_sdl_runner.loadGame` now runs
  `checkModeConsistency()` after each dispatch, logging any illegal state the
  instant it is set (output-only, no behaviour change).
  *Check:* `game_runner_mode_demo.rgr` self-test — 15/15 (every canonical mode +
  four illegal combinations rejected + the namer); `game_sdl_runner.rgr` compiles
  Ranger→C→C++.
  *Remaining (the larger refactor):* make the mode the single source of truth —
  replace the independent flags with it, and split `game_sdl_runner` into a common
  backend interface (`load`/`update`/`draw`/`resize`/`unload`) with one adapter per
  mode (complements the §7 provider work). Needs the SDL build to verify at runtime.
- [~] **R.7 Split-screen semantics — clarified with the maintainer; a second axis
  added.** The review read `auto == always` as a bug. Per the maintainer it is
  **not**: `"auto"` means the *engine* splits a single-player-authored game into
  two panes/cameras with **zero game-side work** (`"always"` is an alias; every
  shipped game uses `auto`). `dualPlayerMode` (a natively two-player game) already
  short-circuits the split. Documented that in `shouldUseSplitScreen()`.
  The real gap the maintainer surfaced is a **second, orthogonal axis** the config
  couldn't express: the *world model* behind a split —
  - **separate**: two independent sessions, one per pane (pinball — two unrelated
    boards). Today's implicit behaviour for tsx games (`loadPanes(same, same)`).
  - **shared**: one simulated world/physics viewed by two cameras following
    different players (autopeli — one road+physics, two views). Today's implicit
    behaviour for the wasm+physics split path (`WasmSplitScreenHost`, one `runner`).

  Landed: a `splitWorld = shared | separate` field on `GameCatalogEntry`, parsed
  from `game.info`, plus `GameCatalog.resolveSplitWorld(entry)` — an explicit value
  wins, otherwise it infers `shared` for wasm+physics and `separate` otherwise, so
  **today's behaviour is preserved** and the choice is now *decoupled from the
  backend*.
  *Check:* `game_split_world_demo.rgr` self-test — 6/6 (default inference for
  wasm+physics/tsx, explicit override both ways, `game.info` parse);
  `game_catalog.rgr` + `game_sdl_runner.rgr` compile Ranger→C++.
  *Remaining (needs SDL build to verify):* route `loadGame` by `resolveSplitWorld`
  instead of by backend, so a tsx game can request a shared world and a wasm game
  separate sessions — i.e. make the split hosts honour the axis, not just record it.
  (Note: `game.info` for these fields is already a clean `key=value` parser
  (`parseInfoLine`), so 7b's "fragile `indexOf`" concern does not apply to them; the
  raw-text `indexOf "engine=…"` fallback is the only substring path left.)
- [x] **R.8 (Medium) Script return values assigned without contract checks.**
  Fixed: new `scripting/game_script_contract.rgr` (`GameScriptContract`) validates a
  script return at the boundary and builds a **located** error
  (`game / function / expected / received`). `game_runtime` now validates
  `initState`'s and `update`'s returns — on an invalid `update` the previous state
  is **kept** (a broken frame no longer corrupts the runtime); on invalid
  `initState` the error is surfaced immediately. Both are guarded by
  `scriptHasFunction`, so a game that omits the function is never falsely flagged.
  *Check:* `game_script_contract_demo.rgr` self-test — 12/12 (valid object passes,
  null/number rejected with a located error, array checks, `typeName`);
  `game_runtime.rgr` + `game_sdl_runner.rgr` compile Ranger→C++; and the **real
  breakout TSX game runs 300 frames through the full runtime with no false-positive
  contract error** (score/entities/screen progress normally).
  *Remaining (optional):* extend to `entities` / layout / render-command returns.

---

## Later / larger seams (IDEAL.md §2.6–§2.18 — tracked, not yet scheduled)

These are fully specified in `IDEAL_API.md` but depend on Phases 1–5 landing first:

- [ ] Dynamic UI — handle-based `rg_evg_*` create/mutate/free + command block (§2.6/§3.1).
- [ ] Dynamic/streamed resources — `rg_res_*`, RGO1/RGX1/RGLD headers (§2.7/§3.2/§2.8).
- [ ] Body→sprite binding — one `BodyVisual` contract on every path (§2.5/§5.3).
- [ ] Selectable physics engine behind `PhysicsWorld` (arcade / cannon / native) (§2.5).
- [ ] Audio: file decode, positional, voice/music, soundscore producer (§2.10/§3.5).
- [ ] Storage over the ABI (`rg_store_*`), animation (`rg_anim_*`), haptics dual-motor,
  view navigation (`rg_view_*`), logging (`rg_log`), particles/effects/filters,
  camera block (RG_CAM) + shared `Mat3` transform (§2.11–§2.18, §3.3–§3.9).
  *(The camera + 3D-render part is now its own Phase G below.)*
- [ ] Registries for shapes / sounds / clips / haptics / routes / emitters / flags (§6).

---

## Phase G — 3D graphics (camera projection · mesh · lighting)

The camera/transform work (`IDEAL.md` §2.17) generalised into a full 3D render
path, on the principle that **2D is the orthographic, `z = 0`, unlit special case
of 3D** (`ABI_V2 §21`). Specified in `ABI_V2_PROPOSAL.md` §18–§21; the matrix math
reuses the already-tested `physics/src/cannon_mat3`/`cannon_vec3`/`cannon_quaternion`.
Ordered so each step is independently runnable — the same discipline as the rest of
this file.

- [~] **G.1 Phase-1 render slice — Rust→WASM guest + software rasteriser, with
  materials & a resource loader** (`ABI_V2 §17–§21`, `IDEAL.md` §2.17). Landed:
  [`games/cube3d_wasm`](./games/cube3d_wasm). A Rust guest compiled to
  `wasm32-unknown-unknown` declares a cube MESH (`RGMB`, §18: verts + normals + uv +
  6 per-face sub-meshes), a MATERIAL table (`RGMA`, §17/§18), a PERSPECTIVE camera
  (`RGCM`, §19), and scene LIGHT (`RGLT`, §20), and spins it. At init the guest loads
  two textures through the host **resource loader** `rg_res_load(name) -> handle`
  (§17: host owns the pixels, guest holds only an opaque handle), builds a material
  per texture, and assigns the *crate* material to the 4 sides and the *tiles*
  material to top/bottom. A headless Node host (`tools/render.cjs`) reads the blocks,
  builds the view-projection, and software-rasterises each sub-mesh with a z-buffer,
  perspective-correct texture sampling, and per-vertex Gouraud lighting to PNG (no
  GPU/SDL/display). The guest does no float — it writes fixed-point ints (positions
  `FP_SCALE`, normals/units Q16.16, uv `*4096`) and bumps the model rotation per
  frame, exactly the `IDEAL.md` §2.17/§5 "host owns rendering, guest owns the world"
  split. Textures are committed as PPM under `assets/`; swapping in a PNG/streamed
  source is a `rg_res_load`-only change, and later material upgrades (shaders,
  mipmaps, LOD) live behind the handle with no guest change.
  *Check:* `npm run engine:wasm:build:cube3d` builds `logic.wasm`;
  `npm run engine:wasm:demo:cube3d` logs `rg_res_load("crate")->1` /
  `("tiles")->2` and renders `out/cube_hero.png` + `out/cube_spin_montage.png` — a
  correctly-occluded, textured, lit, perspective cube (crate sides, tiled top).
- [~] **G.2 Player physics — kinematic character controller (Doom-style walk).**
  Landed: [`games/fps_wasm`](./games/fps_wasm). A Rust→WASM guest generates a
  two-room level (walls with a doorway, crate pillars, a jump-up platform), runs a
  **character controller** (gravity, jump, swept per-axis AABB collision vs
  walls/obstacles/floor, ground/step resolution), declares the physics world as a
  COLLIDERS block (`RGCO`), and drives a first-person PERSPECTIVE camera each frame.
  The host loads three textures via `rg_res_load`, drives a scripted
  move/turn/jump sequence, renders the first-person view (z-buffer + **near-plane
  clipping** added so the floor quad is clipped not dropped), and draws a top-down
  map from the colliders + recorded path. A Doom player is a character controller
  (an AABB that slides walls / stands on boxes), not a rigid-body solver — so that
  is what the guest implements.
  *Check:* `npm run engine:wasm:demo:fps` renders `out/fps_hero.png`,
  `out/fps_walk_montage.png`, and `out/fps_map.png` — the map's path shows the
  player walking through the doorway (not through walls) and a gold airborne
  segment jumping onto the platform.
- [ ] **G.2b Dynamic rigid bodies — wire the `cannon` world.** Alongside the
  kinematic player, drive dynamic obstacles (falling/stacking crates) with
  `physics/src/cannon_world` (gravity, contacts) owning each body's transform; the
  guest streams each pose into a MESH model slot — the "shape declared once, pose
  streams per frame" split the 2D host-physics path (`autopeli_wasm`) already uses
  (`IDEAL.md` §2.5). The rasteriser is unchanged; only the transform source moves.
  *Check:* crates fall, settle, and stack deterministically in fixed-point.
- [~] **G.3 In-engine GPU renderer (production path).** Landed (compile-verified,
  pending an SDL/GL run): a real **GLES2** 3D path so `cube3d_wasm`/`fps_wasm` are
  launcher games, not just headless PoCs.
  - `gfx_sdl.rgr`: a depth buffer on the GL context + a forward 3D pipeline
    (textured, depth-tested, ambient+directional-sun shader, VBO/EBO mesh upload,
    column-major matrix math) exposed as new operators `gfx_3d_upload_texture`,
    `gfx_3d_mesh_upload`, `gfx_3d_begin/set_camera/set_light/draw/end/present`.
  - `scripting/wasm3d_runner.rgr` (`Wasm3dRunner`): reads the guest blocks, uploads
    the mesh + textures once, and each frame passes camera/model/light to the GPU
    and issues per-sub-mesh draws; presents via a GL swap.
  - `game_sdl_runner.rgr`: `render=3d` routes to `Wasm3dRunner` (before the
    Pong-shaped wasm path), with WASD+space feeding `update(dt, fwd, strafe, turn,
    jump)`; the guests carry `game.info` `render=3d` again.
  - The guests dropped the `rg_res_load` host import for a declare-once **RESOURCE
    block** ('RGRS', texture names) the host loads — so the module has **no env
    imports** and loads on every host (in-engine + Node).
  *Check:* `game_sdl_runner.rgr` + `wasm3d_runner.rgr` + `gfx_sdl.rgr` compile
  Ranger→C++; the emitted GL C++ is well-formed. Ceiling is the SDL/GL binary link
  (SDL2/GLES2 headers absent here) — so a live window run is the remaining verify.
- [ ] **G.3b Software backend parity + effects.** Keep the Node software rasteriser's
  approach as an in-engine CPU fallback (`framebuffer.rgr`) behind the same runner,
  for hosts without a GPU and for headless golden-frame tests (`IDEAL.md` §2.17
  "both backends"); and let 2D effects/particles (§2.18) target the 3D pass.
- [ ] **G.4 Conformance (`ABI_V2 §13`).** Golden byte fixtures for the cube's MESH/
  CAM/LIGHT blocks; a malformed-mesh validator vector (out-of-range index, odd
  `idx_count`, degenerate normal); a replay assertion that the *scene* replays
  byte-identically while lighting stays free to vary (proving §11's output-only
  rendering invariant).
  *Check:* the fixtures exist and pass, mirroring the §5 collision-pool validator.

---

## Phase H — host-managed 3D scene (IDEAL_3D.md)

The GPU PoC (Phase G.3) works but pushes mesh/scene/material/camera/light ownership
into the WASM guest as raw exported blocks — `IDEAL_3D.md` §1 lists this as the thing
to fix. Target: **the host owns the scene, entities and resources; the guest sends
high-level commands via direct host imports and holds only opaque `EntityId` handles**
(`IDEAL_3D.md` §2, §10). Command model chosen: **direct host imports** (§7 Option A).
The existing `gfx_3d_*` GLES2 pipeline stays as the Render Bridge (§4.3); only the
*source* of scene data changes (guest blocks → host registry).

Landed in testable stages on the branch (this is the whole §4 transition, delivered so
each stage runs before the next):

- [x] **H.1 Host scene core + multi-light renderer.** In `gfx_sdl.rgr` C++: a retained
  **entity registry** (`EntityId` = index+generation), transforms (pos/rot/scale),
  a **resource-backed** mesh/texture/material model reusing `rgfx_mesh_upload` /
  `rgfx_3d_upload_texture`, light entities (ambient / directional / point), a camera
  entity, and a **forward multi-light** shader (ambient + N directional + N point →
  static lights + a player lamp). `rgfx_scene_reset()` / `rgfx_scene_render(w,h)` walk
  the registry and drive the GL pipeline. Exposed as `extern "C"` for the bridge.
- [x] **H.2 Host imports (C bridge).** In `runtime/rg_wasm_bridge.c`, add + link the
  guest-facing imports (`IDEAL_3D.md` §4.4): `rg_load_texture`, `rg_create_material`,
  `rg_create_mesh` / `rg_create_box`, `rg_create_mesh_entity`,
  `rg_create_perspective_camera`, `rg_create_ambient_light` /
  `rg_create_directional_light` / `rg_create_point_light`, `rg_set_position` /
  `rg_set_rotation` / `rg_set_scale` / `rg_set_enabled` / `rg_set_visible` /
  `rg_set_parent` / `rg_destroy_entity`, `rg_set_camera_target` /
  `rg_set_active_camera` — thin `m3ApiRawFunction` wrappers over the `extern "C"`
  scene API. Positions `FP_SCALE`, quaternions/units Q16.16 (§4.4).
- [x] **H.3 `Wasm3dRunner` dual-mode.** Guests exporting `rg_mesh_ptr` keep the legacy
  block model; guests without it are host-managed — the runner `scene_reset()`s on
  load, runs guest `init` once (the guest issues the commands), and per frame runs
  `update` then `scene_render(pw,ph)`. No `rg_*_ptr` exports consumed in scene mode.
- [x] **H.4 Convert `cube3d_wasm`.** Guest `init()`: `rg_load_texture` +
  `rg_create_box` + `rg_create_camera` (+ `set_position`/`set_target`/
  `set_active_camera`) + `rg_create_light` (ambient + directional). `update()`:
  `rg_set_rotation(cube, quat)`. Removed MESH/CAM/LIGHT/MATERIAL/RESOURCE blocks +
  `rg_*_ptr` exports. _(Deferred: thin `Object3D`/`Light`/`Camera` Rust wrapper for
  `obj.set_position()` sugar — imports called directly for now, §2.2.)_
- [x] **H.5 Convert `fps_wasm`.** Level built with `rg_create_box` per wall/obstacle +
  a thin floor slab; player camera an entity driven by the still-guest-side character
  controller via `rg_set_position`/`rg_set_target`; static point lights (one per room)
  + a player lamp (`rg_create_light` POINT + `rg_set_range`, lamp `rg_set_position`d to
  the eye each frame). Character controller, AABB collision + input interpretation stay
  guest-side (§8). Removed all MESH/MAT/CAM/LIGHT/RES/COLLIDER blocks + `rg_*_ptr` /
  `player_*` exports.
- [ ] **H.6 Headless parity + lifecycle.** Reimplement the host imports in the Node
  tools as a JS scene + the existing software rasteriser (so headless still renders
  the same guests); per-guest lifecycle cleanup on unload (§6): destroy entities,
  refcount/free resources, bump generations. _(Blocking now: `cube3d_wasm/tools/
  render.cjs` and `fps_wasm/tools/render.cjs` still expect the removed block exports
  — after H.4/H.5 those guests import `env.rg_create_box` etc. that the Node host does
  not yet provide, so headless render fails until this lands. The in-engine SDL host is
  unaffected.)_
- [x] **H.7 GLB model loading (`model3d` → render bridge).** `Wasm3dRunner.preloadModels()`
  loads every `<gameDir>/models/*.glb` through the native `model3d` loader
  (`GlbImporter` → `ModelAsset` → `MeshBridge` → `gfx_3d_mesh_upload` /
  `gfx_3d_upload_texture`) and registers each under its basename, so a host-managed
  guest resolves it with `rg_load_model("name")` → `rg_create_mesh_entity` (§12.4).
  Importer support level (see `model3d/README.md`): scenes/nodes (matrix or TRS),
  `TRIANGLES`, `POSITION`/`NORMAL`/`TEXCOORD_0`/**`COLOR_0`**, **non-indexed** primitives
  (synthesised indices), **missing `NORMAL`** (generated), `u8`/`u16`/`u32` indices,
  interleaved `byteStride`, `baseColorFactor`/`baseColorTexture`, `emissiveFactor`
  (+`KHR_materials_emissive_strength`), `alphaMode`, `KHR_materials_unlit`, embedded
  PNG/JPEG; skins/animations/morph/sparse/Draco/Meshopt/KTX2 rejected with a clear
  error. Games: `pyramid_wasm` (diamond gem) and `model_viewer_wasm` (Tests — browse
  GLBs with the arrows). _(Deferred: `COLOR_0` on the GPU path — the loader reads
  per-vertex colours and the software renderer shows them, but the GLES2 vertex shader
  does not yet consume the colour word; see IDEAL_3D §12.5.)_

---

*Progress is tracked here and mirrored in the session task list. Phase 1 and the
additive Phase 2 headers land first because they are safe (no code references the
removed constants) and unblock the enforcement + seam work that follows.*
