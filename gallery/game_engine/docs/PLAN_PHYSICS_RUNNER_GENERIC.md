# PLAN — Make `WasmPhysicsRunner` generic (de-autopeli-fy the physics host)

> Status: proposed. Guardrails: [`../AGENTS.md`](../AGENTS.md).

## Problem

`scripting/wasm_physics_runner.rgr` is placed as engine *core* but is in
practice the autopeli game: it imports `wasm_autopeli_setup.rgr` /
`wasm_autopeli_render.rgr`, hardcodes the road/traffic scene, a 2-player split,
the racing HUD, autopeli id↔ABI-code encoding, and world constants
(`worldH 6000`, start line). The autopeli world is encoded **twice** — here and
in the guest (`wasm/rust_autopeli/src/lib.rs`) — agreeing only by convention.

## Target (see IDEAL, don't duplicate here)

The full target architecture, the `GameSceneProvider` interface, the
single-world-owner (guest) handshake, the neutral ABI header, and the
"done is checkable" leak-guard grep + second-game fixture are specified in:

- [`../IDEAL.md`](../IDEAL.md) **§3** (`GameSceneProvider` seam) and **§7**
  (leak-guard grep, allow-listing, second-game regression fixture).
- [`../IDEAL_API.md`](../IDEAL_API.md) **§7** (provider/capability registry).

Do not restate the interface or grep here — IDEAL §7 already carries the exact
`grep -rniE 'autopeli|…'` command and back-references this plan for phasing.

## Phased migration (unique to this plan — each phase ships green)

Keep every autopeli variant (`autopeli_wasm`, `autopeli_as`, `autopeli_as_src`)
plus Pong/Breakout runnable at each step. Verify with the existing demos
(`scripting/wasm_autopeli_runner_demo.rgr`,
`scripting/split_screen_runner_demo.rgr`) and the SDL smoke targets after each
phase.

- **Phase 0 — Freeze.** Land `AGENTS.md` + this plan + the IDEAL §7 grep in CI,
  allow-listing today's known offenders. No behavior change.
- **Phase 1 — Extract the interface, no logic change.** Define
  `GameSceneProvider` and move `WasmVisualEntity` into a neutral
  `game_visual_entity.rgr`. `git mv` `wasm_autopeli_setup.rgr` /
  `wasm_autopeli_render.rgr` into `games/autopeli_wasm/scene/`, rename classes
  `Autopeli*`. `WasmPhysicsRunner` holds `provider:GameSceneProvider`, chosen by
  a small factory. Logic just indirected.
- **Phase 2 — Push game logic through the interface.** Move `spriteFor`,
  `contactBodyCode`/`bodyCodeToId`, `playerOnOil`, HUD, event vocabulary, camera
  policy, world constants, and `resolvePlayerCount` into the provider. Core now
  holds zero autopeli identifiers → the §7 grep passes on
  `wasm_physics_runner.rgr`.
- **Phase 3 — Single world owner (guest).** Extend the ABI scene handshake so
  the guest declares bodies/bounds/world-size/camera hints; the default provider
  reads them; delete the host-side `setupPhysics()` copy. World lives only in the
  guest.
- **Phase 4 — Neutralize the ABI header.** Rewrite `wasm/wasm_game_abi.h`
  comments/constants to describe guest-defined conventions; move autopeli
  specifics guest-side. Keep the wire layout/version stable.
- **Phase 5 — Prove genericity.** Add one small non-autopeli host-physics game
  loading through the *same* `WasmPhysicsRunner` with its own provider/guest —
  the permanent regression fixture of §7.

`scripting/wasm_game_runner.rgr` (Pong) has the same disease, milder; fold it
into the provider model once the interface exists (Phase 5 candidate).
