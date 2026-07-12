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

## P3 — `props.input.players`

Interpreter path supports multi-player input via `props.input.players[n]`. Native bridge:

- `PlayerInputNative` / `GameInputNative` on `UpdatePropsNative.input`
- `buildPropsFromMasks` + `frameWithMasks` on native game classes
- Emitter hoists `input.players[i]` to `in_pl<i>` locals (prefix avoids collision with entity ids `p1`/`p2`)
- Hoists use `props.input.players` (declared before local `input` binding)

---

## P4 — Invaders / Pacman emitter gaps

**Status (July 2026):** invaders + pacman emit and compile to ES6; headless invaders runner passes.

Remaining polish:

- Non-fatal TS parse warnings on emit (`expected '}' but got ''`) — lexer recovery; output still written
- Module-level `const` arrays, dynamic entity keys — see `README.md` “Not yet emitted”

---

## P5 — Duplicate game sources

**Policy:** canonical native TS inputs are `gallery/game_engine/scripting/*.game.tsx`.
Path A menu/SDL interpreter uses `gallery/game_engine/games/*/index.tsx`.
Keep both in sync manually until unified; do not delete either tree without a migration plan.

| Game | Native (Path B) | Interpreter (Path A) |
|------|-----------------|----------------------|
| Pong | `scripting/pong.game.tsx` | `games/pong/index.tsx` |
| Invaders | `scripting/invaders.game.tsx` | `games/invaders/index.tsx` |
| Pacman | `scripting/pacman_native.game.tsx` | `games/pacman/index.tsx` |

---

## Definition of Done (pong)

```bash
rm -f tmp/game-sdl-native/game_sdl_native.cpp tmp/game-sdl-native/game_sdl_native
npm run engine:game-sdl-native:smoke:pong
# Expect: entities=3 (not pac=240), no Ranger errors
```

Headless parity (no SDL):

```bash
npm test -- ts-to-ranger-native
# ball=35,12 score=1,0 after 180 frames
```

---

## P6 — New games on native path (ylos2)

**Target:** C++ is the optimal codegen target (static SDL binary). The whole
engine — background raster, split-screen, and the physics engine — is compiled
in statically; the game script logic links against it, not against a JS host.

### Architecture decisions (July 2026)

1. **Module-level consts → per-file `@singleton(true)` class.** Each `.tsx`
   compiles to `<Name>GameModule @singleton(true)` holding const scalars/arrays
   (object/derived consts built in its `Constructor`). One singleton per module.
   Access via a per-function `_mod` local because Ranger cannot type-resolve
   `(X.__singleton()).field` inline. Verified to compile **and run in C++**.
2. **Ambient engine surface → injected `GameEngineHost` (composition, not
   inheritance).** `bgWidth`/`bgHeight`/`paneIndex` + `bgFillRect`/`bgClear`/
   `bgFillCircle` live on `GameEngineHost` (over a shared `SoftCanvas`). The
   emitter routes engine globals/functions through `host.*`; the native game
   bridge injects the shared host so both split-screen panes render correctly.
3. **Type aliases.** AssemblyScript-style `i32`/`u8`/`u16`/`u32`/`f64`/`f32`
   are accepted in scripts and mapped to Ranger `int`/`double` today. For the
   C++ target these should eventually map to `int32_t`/`uint8_t`/… — see below.

### Object-valued game state (implemented)

ylos2 keeps rich objects in state that `NativeGameState`'s generic maps cannot
hold (heterogeneous static struct types):

- `p1` / `p2` are **player structs** (`vx`, `vy`, `done`, `grounded`, `superMs`, …).
- `enemies` / `fruits` / `diamonds` / `bullets` / `movingPlatforms` are
  **arrays of structs**.

**Solution:** the `GeneratedGameScript` instance persists across frames (the
native bridge holds one `script`), so object-valued state lives as `st_<field>`
instance fields, read/written directly rather than round-tripped through the
generic maps. `matchKnownStruct` only collapses `{x,y,…}` to `EntityPoseNative`
when *every* field is a pose field, so player/enemy structs keep their own
synthesized type and their fields survive.

### Progress

`games/ylos2/index.tsx` emits with `@singleton` module + host routing +
object-state fields. Compile errors: **1486 → 0** (no pong/invaders/pacman
regression). Landed inference/codegen improvements:

- element structs synthesized from `local.push({...})` (helper-built arrays)
- `[Elem]` inferred for array-literal helper returns
- helper return types finalized before synth-struct fields (ordering)
- `X[i].field` hoisted to typed `_atN` locals (Ranger rejects `(itemAt a i).field`)
- `x | 0` int-truncation idiom, `if(obj)`/`if(arr[i])` truthiness
- int→double coercion for calls and module consts in double context
- `.tsx` `Player` interface annotated with `i32`/`f64` (unifies the struct)
- push-synthesized struct fields refreshed after helper return types finalize
- call-site object literals emit as typed structs (`emitValueExpr` in `emitCall`)
- `initState()` call type → `NativeGameState`; empty `{}`/`[]` → typed defaults
- `GameSnapshot`/`Platform`/`Enemy`/`Bullet` interfaces unify ylos2 struct types
- `SpriteDefNative` extended with LPC sheet fields (`path`, `frameW`, …)
- removed overly broad `param a -> [int]` hack (pacman `put1` uses body inference)
- seventh prescan pass re-infers helper param types from finalized struct schemas
- interface `extends` merge (`MovingPlatform extends Platform` inherits x/y/w/h)
- state field routing for any `NativeGameState` binding (`fresh.p1`, `fresh.cameraY`, …)
- `finalizeSynthStructs` seeds helper param types into local var inference
- nested return structs match recorded interfaces (`UpdatePlayerResult`, `ApplyEnemyHitsResult`)
- `(call()).field` hoisted to temp (`goalPlatform().y` → `gp.y`)
- if-body `itemAt` hoists share typed locals across test + consequent

Remaining long tail (~50): bgFillRect/drawCloud int/double edges, a few
`if(int)` truthiness sites, and scattered struct field coercions in update().

Interpreter path works today: `npm run engine:game-sdl:run:ylos2` (Path A).

---

## UTF-8 source reads (emitter)

Node `buffer_to_string` codegen reads raw bytes → breaks `—`, `→` in comments.
`npm run ts2ranger:compile` runs `scripts/patch-emitter-utf8.mjs` to use `fs.readFileSync(..., 'utf8')`.

---

## Type aliases (i32 / u8 / f64) and a Ranger-compiler follow-up

`gallery/game_engine/scripting/game_native_types.ts` declares `i32`, `u8`,
`u16`, `u32`, `f64`, `f32`. The emitter maps them to `int`/`double`.

**Proposed Ranger-compiler change (C++ optimization).** Add real fixed-width
numeric types so the C++ backend emits `uint8_t`/`uint16_t`/`uint32_t`/`int32_t`
(and `float` for `f32`) — real memory/cache wins for large per-frame arrays on
the native target. Feasibility investigated; concrete touch points:

| File | Change |
|------|--------|
| `compiler/TTypeRegistry.rgr` | register `u8`/`u16`/`u32`/`i32`/`f32` names; `nameToNodeType` → `Integer`/`Double`; add `targetTypeString` cases (es6 `number`, go `int/float64`) |
| `compiler/ng_RangerCppClassWriter.rgr` | `getObjectTypeString` / `getTypeString2` / scalar decls → `uint8_t` etc. |
| `compiler/ng_FlowWork.rgr` | `shouldBeEqualTypes` / `shouldBeType`: allow `int ↔ {u8,u16,u32,i32}` and `double ↔ f32` (same pattern as existing `char ↔ int`) |
| `compiler/Lang.rgr` | arithmetic operator overloads (`+ - * / %`, comparisons) must accept the alias types, or the analyzer canonicalizes them to int/double for operator matching (`Could not match argument types for +` otherwise) |

The arithmetic-operator matching is the largest piece and the main risk; a
storage-focused first cut (struct fields / `[u8]` arrays, promote to int for
math) is the pragmatic starting scope. Recommended as a separate focused PR to
keep the compiler change isolated and regression-tested on its own.

Until then the emitter maps the aliases to `int`/`double` (correct, not yet
memory-optimal).

---

## Files touched (P0–P5)

| File | Change |
|------|--------|
| `gallery/game_engine/scripts/build-game-sdl-native.sh` | P0 fail-fast |
| `gallery/ts_to_ranger/game_script_types.rgr` | P1 `dt` / `hasDt`; P3 input types |
| `gallery/game_engine/scripting/game_native_runtime.rgr` | P1 `applyScriptPatch`; P3 `buildPropsFromMasks` |
| `gallery/game_engine/scripting/*_native_*.rgr` | P1 `applyScriptPatch`; P3 `frameWithMasks` |
| `gallery/game_engine/scripting/game_sdl_native_host.rgr` | P3 mask-based input |
| `gallery/ts_to_ranger/ts_emitter.rgr` | P2 helpers; P3/P4 inference + input hoists |
| `gallery/ts_to_ranger/generated/*.rgr` | Regenerate after emitter changes |
