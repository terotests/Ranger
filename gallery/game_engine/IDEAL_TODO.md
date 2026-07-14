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
- [ ] **4.4 Unified sound palette** (row 11, IDEAL.md §4, IDEAL_API §2.6/§4). Fold
  the RGW1 sound enum + `.as` sound queue into one registered per-game palette
  (`registerSound(name, spec)`); the sound-event record (§2.6) is identical on RGW1,
  `.as`, TS.
  *Check:* a game registers `"brick"` with no core branch; both paths emit it.

---

## Phase 5 — input, docs, and proof (rows 12–14)

- [ ] **5.1 Richer uniform host→guest input** (row 12, IDEAL.md §2.9). Populate the
  RGIN record on every path; games declare semantic actions mapped through a
  remappable table; hotplug/resize as events.
  *Check:* an analog-stick guest reads `LSTICK_X` on both WASM and `.as`.
- [ ] **5.2 CI leak guard wired** (row 13). Phase 0.2 grep runs in CI against every
  core file + header.
  *Check:* a deliberately-introduced `autopeli` in a core file fails CI.
- [ ] **5.3 Cross-path & second-game conformance fixtures** (row 14, IDEAL.md §7).
  A test that runs one guest on WASM *and* `.as` and diffs the block bytes; a second
  physics game under `games/`.
  *Check:* the two paths are byte-identical; the second game needs no core edit.

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
- [ ] Registries for shapes / sounds / clips / haptics / routes / emitters / flags (§6).

---

*Progress is tracked here and mirrored in the session task list. Phase 1 and the
additive Phase 2 headers land first because they are safe (no code references the
removed constants) and unblock the enforcement + seam work that follows.*
