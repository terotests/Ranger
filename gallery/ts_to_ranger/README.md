# TS → Ranger → Native (game engine PoC)

Proof-of-concept for compiling `*.game.tsx` scripts to native Ranger instead of
interpreting them through `ComponentEngine` at runtime.

**Core architecture:** TypeScript is read at **emitter runtime** (during the
build step / while you iterate on the script in the interpreter), and the
**generated Ranger is compiled statically** into the native game binary. The
generated file — not any hand-written copy — is the artifact that gets compiled.

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

```
pong.game.tsx ──(emitter runtime)──► generated/pong_generated.rgr ──(static compile)──► native
```

| Layer | File | Role |
|-------|------|------|
| Bridge types | `game_script_types.rgr` | `NativeGameState`, `EntityPoseNative`, `SpriteDefNative`, `UpdatePropsNative` |
| Emitter | `ts_emitter.rgr` | Type-aware AST → Ranger source |
| CLI | `ts_emitter_main.rgr` | `-i foo.game.tsx -o foo_generated.rgr` |
| **Generated (compiled)** | `generated/pong_generated.rgr` | `GeneratedGameScript` — statically compiled game logic |
| Native host | `game_native_runtime.rgr` | Retained sprites without `EvalValue` |
| Demo | `pong_native_runner.rgr` | Imports the **generated** class; headless 180-frame parity run |

There is **no hand-written native game logic** — `pong_native_runner.rgr`
imports `generated/pong_generated.rgr` directly, so the compiled binary contains
exactly what the emitter produced from the `.tsx` source.

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
| `resources()` | `fn resources:[ResourceDefNative] ()` |
| `initState()` | `fn initState:NativeGameState ()` |
| `update(props)` | `fn update:NativeGameState (props:UpdatePropsNative)` |

### Engine host bridge — resources & events (both paths)

The engine bridge lets scripts create engine objects/resources and send events.
It is **data-driven** so the identical contract runs in the TS interpreter and in
the static-compiled binary (no per-path glue, reducer-friendly):

- **`resources()`** — declared once (like `sprites()`); returns resource defs the
  host registers into its tables. `kind` selects the table:

  ```ts
  function resources() {
    return [
      { kind: "image",     id: "bg",   path: "space.png" },
      { kind: "sound",     id: "blip", path: "blip.wav" },
      { kind: "sprite",    id: "star", px: 2, frameCount: 3 },  // animation frames
      { kind: "collision", id: "star", w: 8, h: 8 }             // registered for later
    ];
  }
  ```

- **`state.events[]`** — `update()` returns transient events each frame; the host
  drains them after the reducer step (`playSound`, `spawn`, `destroy`, custom):

  ```ts
  return { entities, t, events: [
    { kind: "playSound", id: "blip" },
    { kind: "spawn", id: "shot", x: px, y: py }
  ] };
  ```

`GameHost` (`game_host.rgr`) owns the registries (`images`, `sounds`,
`spriteFrames`, `collisions`) and event sink (`soundsPlayed`, `spawnRequests`,
`destroyRequests`, `eventCount`). Both `GameRunner` (interpreter) and
`NativeGameRunner` (compiled) register `resources()` at setup and drain
`state.events` each frame into the same `GameHost`. The `spawner.game.tsx` demo
verifies byte-identical host state across paths.

### Arbitrary scalar state fields

TS state may carry any numeric field (invaders `px`, `waveX`, `anim`, …). Fields
not in the fixed `NativeGameState` schema are routed to a generic
`numbers:[string:double]` map: `set patch.numbers "t" (...)` on write and
`(unwrap (get s.numbers "t"))` on read. So scripts are not limited to the
predefined score/velocity fields.

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
- `while` loops (with integer/double locals + reassignment)
- Literals, member access, `+ - * < >`, unary `-`
- Object literals → `NativeGameState` / `SpriteDefNative` / `ResourceDefNative` /
  `GameEventNative` / entity map
- Array literals in `sprites()`, `resources()`, and `state.events`
- Arbitrary scalar state fields via the `numbers` map

### Type-aware emission (why the output compiles statically)

Ranger distinguishes `int` and `double` and rejects implicit coercion, while TS
has a single `number` type. The emitter therefore:

- Tracks each variable's Ranger type (`varTypes`) and the known field types of
  the bridge structs (`fieldType`).
- Emits numeric literals in the form expected by their context: `pose.x = 240.0`
  (double field) but `score = 0` / `s2 = (s2 + 1)` (int field).
- Promotes binary-operand literals to the common numeric type
  (`by < 6.0` because `by` is a double).
- **Hoists entity reads** to typed locals: `s.entities.ball.x` becomes
  `def in_ball:EntityPoseNative (unwrap (get s.entities "ball"))` + `in_ball.x`,
  because Ranger cannot take `.field` directly off a `(get map key)` expression.

### Not yet emitted

- `hud()` / JSX (keep on interpreter path or separate EVG codegen)
- `for` loops, helper `function` calls with params, module-level `const`
  arrays (invaders bitmap tables), dynamic entity keys (`entities[id]`),
  array indexing/`push` on script-owned arrays
- Multi-screen `state.screen` / `screens`

Full Invaders compilation needs the above (helpers, `const` arrays, dynamic
keys). The host bridge, `while`, and the `numbers` map are the foundation; the
`spawner.game.tsx` and `counter.game.tsx` demos exercise them end-to-end on both
paths.

## Recommended Ranger language changes

These would shrink the emitter and improve TS fidelity **without editing `.tsx`
files**. Ordered by how much emitter complexity they remove:

1. **Member access on `(get map key)`** — allow `(get m k).field` (or
   `m["k"].field`) directly. Removes the entity-hoisting pass entirely.
2. **Numeric coercion (int→double widening)** — allow `int` literals in `double`
   context (`if (by < 6)`, `def x:double 0`). Removes all type-directed number
   emission. (Verified today: the compiler rejects `def a:double 5`, `b < 5`,
   and `o.x = 10` — see `shouldBeEqualTypes` in `ng_RangerFlowParser.rgr` and
   operator matching in `ng_parser_std_match.rgr`.)
3. **Struct literal sugar** — `EntityPoseNative { x: bx, y: by }` instead of
   manual field assignment (matches TS object literal syntax).
4. **`partial merge` operator** — `state <- patch` for reducer-style game state.
5. **Typed string maps** — `entities["ball"].x` on `[string:EntityPoseNative]`.
6. **Script host trait** — `implements GameScript` with checked `initState` /
   `update` / `sprites` signatures for compile-time host wiring.

The emitter currently compensates for (1) and (2) so that the generated Ranger
compiles statically today; implementing them in the compiler would let the
emitter emit near-verbatim TS.

## Files

```
gallery/ts_to_ranger/
  game_script_types.rgr        # shared bridge types (+ numbers map, events)
  game_host.rgr                # GameHost registry + ResourceDefNative/GameEventNative
  ts_emitter.rgr               # type-aware AST → Ranger
  ts_emitter_main.rgr          # CLI
  generated/pong_generated.rgr # emitter output — statically compiled
  generated/spawner_generated.rgr
  generated/counter_generated.rgr
gallery/game_engine/scripting/
  game_native_runtime.rgr      # native host (no interpreter) + GameHost
  game_runtime.rgr             # interpreter host + GameHost
  pong_native_runner.rgr       # imports generated class, headless parity
  spawner.game.tsx / *_runner  # resources + events demo (both paths)
  counter.game.tsx / *_runner  # while-loop demo (both paths)
```

## Next steps

1. Full Invaders: helper `function` calls with params, module-level `const`
   arrays (bitmap tables), dynamic entity keys (`entities[alienId(i)]`), array
   indexing/`push` on script arrays.
2. Richer events/resources: typed spawn payloads, sprite frame bitmap upload,
   collision geometry registration consumed by the SDL host.
3. `game_sdl_native_runner.rgr` — SDL host that imports generated script instead
   of `loadScript(.tsx)`.
4. LLVM path: `game_native_runtime + generated/*.rgr` → single native binary.
5. Optional: codegen `hud()` to `game_hud` EVG tree builder (static JSX).
