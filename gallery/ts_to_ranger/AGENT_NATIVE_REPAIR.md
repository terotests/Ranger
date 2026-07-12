# Native path repair guide (TS → Ranger → SDL)

> Agent-oriented checklist for **Path B** (`game_sdl_native` + `generated/*.rgr`).
> Path A (`game_sdl` + `ComponentEngine`) must keep working — do not break it while fixing B.

**Last updated:** July 2026

---

## Problem summary

| # | Issue | Where |
|---|--------|--------|
| **P0** | Compiler returns exit 0 on errors → stale binary links | `bin/output.js`, `build-game-sdl-native.sh` |
| **P1** | `patch.dt` missing from `NativeGameState` | `game_native_runtime.rgr`, `game_script_types.rgr` |
| **P2** | `import { soundEvent }` → `this.soundEvent()` (invalid) | `ts_emitter.rgr` |
| **P3** | `props.input.players` not supported in native | `ts_emitter.rgr`, `UpdatePropsNative` |
| **P4** | Invaders / pacman emitter parse errors | `invaders.game.tsx`, `pacman_native.game.tsx` |
| **P5** | Duplicate sources `games/` vs `scripting/` | pong, invaders, pacman |
| **P6** | New games (pinpall, …) not on native path | runtime A only |

---

## Repair order

```
P0 (fail-fast) → P1 (patch.dt) → P2 (soundEvent) → pong smoke OK
                                                  → P4 (invaders/pacman)
```

**Minimum “pong works”:** P0 + P1 + P2.

---

## P0 — Fail fast on compile errors

`build-game-sdl-native.sh` must:

1. Check emitter exit code.
2. Remove stale `game_sdl_native.cpp` / binary before Ranger compile.
3. Check Ranger `node bin/output.js` exit code.
4. Verify `$CPP_FILE` exists before linking.

Without this, a failed compile leaves the previous game binary (e.g. pacman `entities=240`) and smoke tests lie.

---

## P1 — `patch.dt` on `NativeGameState`

`NativeGameRunner.applyUpdate` calls `host.tickMusic` with frame delta. Add to `NativeGameState`:

- `dt:double` (default `0.0`)
- `hasDt:boolean` (sentinel pattern like `hasVx` / `hasVy`)

`NativeGameStateOps.mergeState` copies `dt` when `patch.hasDt`.

Callers use `runner.applyScriptPatch(patch props)` so `patch.dt = props.dt` before merge.

---

## P2 — Inline `game_helpers` imports

`import { soundEvent } from "./game_helpers"` must **not** emit `this.soundEvent(...)`.

`ts_emitter.rgr` recognizes bridge helpers (`soundEvent`, `musicEvent`, `particleEvent`, …) and emits inline `GameEventNative` temporaries, same shape as object literals in `state.events`.

---

## P3 — `props.input.players` (not yet)

Interpreter path supports multi-player input via `props.input.players[n]`. Native bridge needs:

- `UpdatePropsNative` player slots, **or**
- Emitter rewrite to `props.up` / `props.down` when `playerSlots === 1`.

---

## P4 — Invaders / Pacman emitter gaps

Full compilation still needs (see `README.md` “Not yet emitted”):

- Module-level `const` arrays (bitmap tables)
- Dynamic entity keys `entities[id]`
- Helper calls with richer param inference (in progress)

---

## P5 — Duplicate game sources

Canonical native inputs live under `gallery/game_engine/scripting/*.game.tsx`.
`gallery/game_engine/games/*/index.tsx` is Path A (menu / SDL interpreter). Keep in sync manually until unified.

---

## Definition of Done (pong)

```bash
rm -f tmp/game-sdl-native/game_sdl_native.cpp tmp/game-sdl-native/game_sdl_native
npm run engine:game-sdl-native:smoke:pong
# Expect: entities=3 (not pac=240), no Ranger errors, ball≈212,105 score=0,0
```

Headless parity (no SDL):

```bash
npm test -- ts-to-ranger-native
```

---

## Type aliases (groundwork, not blocking)

`gallery/game_engine/scripting/game_native_types.ts` defines `i32` / `f64` aliases for scripts.
Future: emitter reads annotations and validates integer-only ops at eval time on Path A.

---

## Files touched by P0–P2

| File | Change |
|------|--------|
| `gallery/game_engine/scripts/build-game-sdl-native.sh` | P0 fail-fast |
| `gallery/ts_to_ranger/game_script_types.rgr` | P1 `dt` / `hasDt` |
| `gallery/game_engine/scripting/game_native_runtime.rgr` | P1 `applyScriptPatch` |
| `gallery/game_engine/scripting/*_native_*.rgr` | P1 use `applyScriptPatch` |
| `gallery/ts_to_ranger/ts_emitter.rgr` | P2 bridge helpers + inference fixes |
| `gallery/ts_to_ranger/generated/*.rgr` | Regenerate after emitter changes |
