# TS → Ranger → Native (game engine PoC)

Proof-of-concept for compiling `*.game.tsx` scripts to native Ranger instead of
interpreting them through `ComponentEngine` at runtime.

**TypeScript sources are not modified.** The pipeline reads existing
`gallery/game_engine/scripting/*.game.tsx` files and emits Ranger.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Authoring (unchanged)                                          │
│  pong.game.tsx  ──reference──►  game.d.ts (editor only)         │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
         ▼                                       ▼
┌─────────────────────┐              ┌──────────────────────────┐
│  Runtime path (A)   │              │  Native path (B) PoC       │
│  TSLexer → AST      │              │  TSLexer → AST → TSEmitter │
│  ComponentEngine    │              │  *.native.rgr / generated  │
│  GameRunner         │              │  NativeGameRunner          │
└─────────┬───────────┘              └────────────┬─────────────┘
          │                                       │
          └───────────────┬───────────────────────┘
                          ▼
              SoftCanvas → SDL / headless RGBA
```

### Path A — interpret TS (today)

- `game_runtime.rgr` + `ComponentEngine` evaluoi AST:n jokaisella framella.
- Toimii Node- ja SDL-hostissa ilman erillistä TS-runtimea.

### Path B — compile TS logic to Ranger (PoC)

| Layer | File | Role |
|-------|------|------|
| Bridge types | `game_script_types.rgr` | `NativeGameState`, `EntityPoseNative`, `SpriteDefNative`, `UpdatePropsNative` |
| Emitter | `ts_emitter.rgr` | AST → Ranger source (game-script subset) |
| CLI | `ts_emitter_main.rgr` | `-i foo.game.tsx -o foo_generated.rgr` |
| Native host | `game_native_runtime.rgr` | Retained sprites without `EvalValue` |
| Example game | `pong_game_native.rgr` | Hand-tuned native Pong (parity reference) |
| Demo | `pong_native_runner.rgr` | Headless 180-frame parity run |

## Parity result (Pong, 180 frames)

Both paths produce identical output:

```
ball=212,105
score=0,0
```

```bash
# TS interpreter path
npm run engine:pong:runner

# Native Ranger path
npm run engine:pong:native
```

## Commands

```bash
# Emit Ranger from a game script (does not touch the .tsx file)
npm run ts2ranger:emit -- gallery/game_engine/scripting/pong.game.tsx

# Compile emitter CLI
npm run ts2ranger:compile

# Headless native pong
npm run engine:pong:native
```

## Bridge contract

The host (`GameRunner` / `NativeGameRunner`) calls the same script surface as
`game.d.ts`:

| Function | Native signature |
|----------|------------------|
| `sprites()` | `fn sprites:[SpriteDefNative] ()` |
| `initState()` | `fn initState:NativeGameState ()` |
| `update(props)` | `fn update:NativeGameState (props:UpdatePropsNative)` |

### State merge

`update()` may return a **partial** patch (like TS reducer style). The bridge
merges via `NativeGameStateOps.mergeState()`:

- Scalars use sentinel `-1` = omitted (`showNet`, `score1`, …).
- `vx`/`vy` use `hasVx`/`hasVy` flags.
- `entities` map: shallow merge by sprite id.

### What the emitter supports (PoC subset)

- Top-level `function` declarations
- `const` / `let` → `def`
- `if` / `return` / assignment statements
- Literals, member access, `+ - * < >`, unary `-`
- Object literals → `NativeGameState` / `SpriteDefNative` / entity map
- Array literal in `sprites()`

### Not yet emitted

- `hud()` / JSX (keep on interpreter path or separate EVG codegen)
- `while` / `for`, helper calls, module-level `const` arrays
- Multi-screen `state.screen` / `screens`

## Recommended Ranger language changes

These would shrink the emitter and improve TS fidelity **without editing `.tsx`
files**:

1. **Numeric coercion** — allow `int` literals in `double` context (`if (by < 6)`
   without `6.0`; `def x:double 0` should mean `0.0`).
2. **Block statement lists** — `if { a = 1; b = 2; }` with semicolons (today
   requires one statement per line in blocks).
3. **Struct literal sugar** — `EntityPoseNative { x: bx, y: by }` instead of
   manual field assignment (TS object literal syntax).
4. **`partial merge` operator** — `state <- patch` for reducer-style game state.
5. **Typed string maps** — `entities["ball"].x` syntax on `[string:EntityPoseNative]`.
6. **Script host trait** — `implements GameScript` with checked `initState` /
   `update` / `sprites` signatures for compile-time host wiring.
7. **Optional static methods** — fix `sfn` codegen for ES6/C++ (use instance
   methods or real static dispatch).

## Files

```
gallery/ts_to_ranger/
  game_script_types.rgr   # shared bridge types
  ts_emitter.rgr          # AST → Ranger
  ts_emitter_main.rgr     # CLI
  generated/              # emitter output (gitignored optional)
gallery/game_engine/scripting/
  game_native_runtime.rgr
  pong_game_native.rgr    # reference native implementation
  pong_native_runner.rgr
```

## Next steps

1. Expand emitter: `while`, module `const`, helper `function` calls.
2. `game_sdl_native_runner.rgr` — SDL host that imports generated script instead
   of `loadScript(.tsx)`.
3. LLVM path: `game_native_runtime + pong_game_native` → single native binary
   (~same as `build-game-sdl.sh` but without interpreter).
4. Optional: codegen `hud()` to `game_hud` EVG tree builder (static JSX).
