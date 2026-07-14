# TSX → Native compilation — remaining work

> Status/roadmap notes for finishing **Path B** (TS `.tsx` → Ranger → statically
> compiled with the host → C++). This work lives primarily under
> [`gallery/game_engine/`](../game_engine/) (game scripts, native runtime,
> physics, build scripts). The emitter and generated output live in
> [`gallery/ts_to_ranger/`](./). Companion to
> [`AGENT_NATIVE_REPAIR.md`](./AGENT_NATIVE_REPAIR.md) (P0–P6 history; on the
> native-repair branch / PR #189).
>
> **Written:** July 2026. Pick up later when there's a suitable moment.

---

## Related files in `gallery/game_engine/`

| Area | Path | Role on the native path |
|------|------|-------------------------|
| **Game scripts (Path A)** | [`games/`](../game_engine/games/) | Interpreter `.tsx` sources (`pong`, `invaders`, `ylos2`, `autopeli_physics`, …) |
| **Native TS inputs (Path B)** | [`scripting/*.game.tsx`](../game_engine/scripting/) | Canonical emit sources for pong / invaders / pacman (`pong.game.tsx`, `invaders.game.tsx`, `pacman_native.game.tsx`) |
| **Native SDL runners** | [`scripting/*_native_sdl_runner.rgr`](../game_engine/scripting/) | Link generated script + host into one C++ binary |
| **Native runtime** | [`scripting/game_native_runtime.rgr`](../game_engine/scripting/game_native_runtime.rgr) | Frame loop, sprite sync, state merge — **physics wiring missing (B1)** |
| **Native bridge** | [`scripting/native_game_bridge.rgr`](../game_engine/scripting/native_game_bridge.rgr) | Wires `GeneratedGameScript` into the runner |
| **Host physics** | [`scripting/game_physics.rgr`](../game_engine/scripting/game_physics.rgr), [`physics_core.rgr`](../game_engine/scripting/physics_core.rgr), [`game_physics_bridge.rgr`](../game_engine/scripting/game_physics_bridge.rgr) | Compiled physics + **EvalValue marshalling** (disappears on Path B) |
| **Cannon physics** | [`scripting/game_cannon_physics.rgr`](../game_engine/scripting/game_cannon_physics.rgr), [`physics/`](../game_engine/physics/) | Pinpall, physics sandbox |
| **Engine host** | [`scripting/game_engine_host.rgr`](../game_engine/scripting/game_engine_host.rgr) | `bgFillRect`, `paneIndex`, ambient surface for emitted scripts |
| **Fixed-width TS types** | [`scripting/game_native_types.ts`](../game_engine/scripting/game_native_types.ts) | `u8`/`i32`/`f64` aliases for native-bound scripts |
| **Build** | [`scripts/build-game-sdl-native.sh`](../game_engine/scripts/build-game-sdl-native.sh) | Emit `.tsx` → `generated/*.rgr` → C++ → SDL binary |
| **Roadmap** | [`ROADMAP.md`](../game_engine/ROADMAP.md) | Engine maturity matrix (links back here) |
| **Design** | [`scripting/GAME_ENGINE_DESIGN.md`](../game_engine/scripting/GAME_ENGINE_DESIGN.md), [`scripting/GAME_SCRIPTING.md`](../game_engine/scripting/GAME_SCRIPTING.md) | Retained sprites, reducer, TSX API |

**npm (native SDL smoke):** `engine:game-sdl-native:smoke:pong|invaders|pacman` in root `package.json`.

**Emitter output:** [`generated/`](./generated/) (`pong_generated.rgr`, `ylos2_generated.rgr`, …).

---

## Architecture context (why native compilation matters)

There are two execution models for a `.tsx` game script:

- **Interpreted (Path A, current default):** `ComponentEngine` interprets
  `update()`/`sprites()` every frame. All data is boxed `EvalValue`. A
  physics-heavy game reaches the (already compiled) host physics **only through a
  dynamic `EvalValue` bridge** (`game_physics_bridge.rgr`), which walks
  `getMember(key)` trees to marshal bodies/wheels/controls/impulses/contacts —
  every frame, both directions.
- **Native (Path B):** the `.tsx` is compiled to Ranger (`*_generated.rgr`), then
  statically compiled **together with the host** into one C++ binary. The TSX
  interpreter disappears **and so does the EvalValue marshalling** — the script
  calls the host (physics/render) directly through typed static structs.

**Key implication:** for physics games the win is *not* "just `update()` gets
faster." The entire dynamic layer (interpreter dispatch **+** per-frame EvalValue
marshalling) collapses to static C++. The marshalling is likely the larger cost,
so native compilation is a structural win, not a marginal one.

Fixed-width types (`u8`/`u16`/`u32`/`i32`/`f32`, see PR #194) are a shared
enabler: on the C++ target they emit `uint8_t`/…/`float`, giving tight structs;
they also match AssemblyScript, so they benefit a possible WASM direction too.

---

## Game status on the native path (empirical, ES6 compile)

| Game | Errors | Blocker type |
|------|-------:|--------------|
| pong | ✅ 0 | done |
| invaders | ✅ 0 | done |
| pacman | ✅ 0 | done |
| ylos2 | ✅ 0 | done (P6) |
| breakout | 52 | multi-screen state + `Record<>` + emitter crash |
| physics_sandbox | 67 | physics + void-helper emit bug |
| pinpall | 168 | physics (Cannon) + heterogeneous descriptors |
| autopeli | 293 | host physics + dynamic maps + descriptors |

> Error counts look large but recur from a few root causes (dynamic maps,
> heterogeneous descriptors, null idioms, physics I/O). They are not 293
> independent problems.

---

## Remaining work by subsystem

### A. Emitter — type / struct synthesis

| # | Gap | Blocks | Size |
|---|-----|--------|------|
| A1 | **`Record<string,T>` → `[string:TNative]`** — currently emits a non-existent `RecordNative` type and **crashes the Ranger compiler** (`Cannot read properties of undefined (reading 'variables')`) | breakout, autopeli | 🟢 Small, high impact |
| A2 | **Multi-screen state** (`state.screen` + `state.screens[name]`) — synthesized `*StateNative`/`*ScreenNative` classes are referenced but **never emitted** | breakout | 🟡 Medium |
| A3 | **Dynamic string-keyed heterogeneous maps** (`we[id]`, `controls[id] = …`) | autopeli, physics games | 🟡 Medium |
| A4 | **void helper call as a statement** ("Primitive element at top level", e.g. `bgLine`) — emitted into a context the parser rejects | physics_sandbox | 🟢 Small |
| A5 | **Object-param shape inference + helper annotations** (~60 in autopeli) — `patchX(o)`, `roadAt(y)→{center,half}`, etc. | all physics games | 🟢 Tedious but straightforward |
| A6 | **null / optional idioms** (`x != null`, `a \|\| 0`, `x == null`) → sentinel / lowering | autopeli | 🟡 Medium |
| A7 | **`Math.*`** (`sin`/`floor`/…) — not wired (ylos2 worked around it) | autopeli, others | 🟢 Small |
| A8 | **int/double/i32 coercion long tail** — same class solved for ylos2; recurs per game | all | 🟢 Incremental |

### B. Runtime — native-path features

| # | Gap | Blocks | Size |
|---|-----|--------|------|
| B1 | **Physics I/O contract** (typed `*Native` structs) + **`GamePhysics` wiring** into the native runtime + fixed-step loop. The native runtime does not import `GamePhysics` today. | autopeli, pinpall, physics_sandbox | 🔴 Largest — new subsystem |
| B2 | **Engine hooks `entities()` / `camera()` / `config()`** — the native runtime does not call these (only `initState`/`sprites`/`resources`) | all physics / entity / camera games | 🟡 Medium |
| B3 | **`resources()` sample assets** (partial — sheet sprites work for ylos2) | asset-heavy games | 🟢 Small |

### C. Codegen target & build

| # | Gap | Note | Size |
|---|-----|------|------|
| C1 | **C++ target end-to-end** — tests currently compile to **ES6**; the real perf win (static SDL binary) needs C++ codegen + physics linked | perf goal | 🟡 Medium |
| C2 | **Per-game behavioral parity tests** — only pong has behavioral assertions; ylos2 is compile-only | QA | 🟢 Incremental |

---

## Physics I/O contract (B1) — design sketch

The typed structs that replace the EvalValue bridge. Keep them target-agnostic so
the same contract serves a native C++ bridge **and** a possible WASM bridge. The
host physics core (`physics_core.rgr`: `PhysBody`/`PhysContact`/`PhysCommand`/…)
already exists as compiled Ranger and can be linked directly — B1 is about typed
I/O + orchestration, not reimplementing physics.

Script reads (host-populated into state each frame):

- `worldEntities: [string:WorldEntityNative]` — `{ x, y, vx, vy, speed, angle, angularVel, present }`
- `physicsContacts: [PhysicsContactNative]` — `{ id, phase, bodyA, bodyB, normalImpulse, x, y, nx, ny }`

Script writes (returned from `update()`, consumed by host physics):

- `physics: PhysicsStepInputNative` — `{ controls: [string:PhysicsControlNative], impulses: [PhysicsImpulseNative] }`
  - `PhysicsControlNative` — `{ steer, throttle, brake, grip }`
  - `PhysicsImpulseNative` — `{ body, linearX, linearY, angular, hasLinear }` (sentinel for the angular-only push)

Native runtime (`game_native_runtime.rgr`) would then: import `GamePhysics`, run
the fixed-step, populate `worldEntities`/`physicsContacts` before calling
`update()`, and consume the returned `physics` block. Requires B2 to call
`entities()`/`config()` for body/world setup.

`present` / `hasLinear` sentinels replace the interpreted `we[id]` /
`c.normalImpulse != null` null checks (native structs have no null) — see A6.

---

## Recommended order

**Phase 1 — cheap, broadly useful emitter fixes** (unblocks breakout, trims every
game's tail):
- A1 `Record<>` (also fixes the compiler crash) → breakout likely near-done
- A4 void-helper bug, A7 `Math.*`, A2 multi-screen state

**Phase 2 — physics foundation** (target-agnostic, serves all physics games):
- B1 typed physics I/O contract + `GamePhysics` wiring + fixed-step
- B2 `entities()`/`camera()`/`config()` hooks
- A3 dynamic maps, A6 null idioms

**Phase 3 — autopeli + pinpall** finish (A5 annotations, shape matching) once the
foundation is in place.

**Phase 4 — C++ target + parity tests** (C1, C2) — locks in the perf win and
regression safety.

---

## Key takeaway

- **Non-physics games (breakout)** are close: the main blocker is one
  compiler-crashing type gap (`Record<>`, A1) + multi-screen state (A2).
- **Physics games (autopeli / pinpall / physics_sandbox)** are a bigger effort,
  and their shared bottleneck is **B1 (physics I/O contract + runtime wiring)** —
  not per-error type fixing.
- Start at **A1** (fast win + crash fix, unblocks breakout), then **B1** (the
  foundation the whole physics-game family depends on).

---

## Related PRs / branches

- PR #189 `cursor/native-repair-p0-p2-47b5` — native path P0–P5 base
- PR #190 `cursor/utf8-ylos2-p6-47b5` — P6 ylos2 (native compile green)
- PR #194 `cursor/ranger-fixed-width-types-47b5` — `u8`/`u16`/`u32`/`i32`/`f32` in the compiler
