# `.as` source engine — interpret AssemblyScript against the WASM ABI

A third run path for game code, alongside the compiled Rust/AS WASM guests. One
`.as` file runs two ways against the **same RGW1/RGU1 shared-memory ABI**:

- **development** — interpreted by Ranger's live TS interpreter (`ComponentEngine`
  + `EvalValue`): instant start, hot reload.
- **shipping** — compiled by `asc` → `game.wasm`.

Because both speak the same byte ABI, the same source behaves identically either
way.

## How it works

`ComponentEngine` evaluates TypeScript syntax at runtime and ignores type
annotations — which is the AssemblyScript subset the game code stays within. Two
pieces bridge it to the ABI:

- **`scripting/as_abi_bridge.rgr`** — `AsAbiBridge extends EvalNativeBridge`.
  Holds the RGW1 (2560 B), RGU1 (8192 B) and RGP1 pose (128 B) blocks as byte
  buffers and implements the flat bridge API (`abiRead/abiWrite`, the
  `uiReset/uiNode/uiText/uiPropEnum/uiFinish` UI builder, body/control/contact
  accessors, the `spriteReset/drawSprite` draw list, `playSound`, and pose
  readers) over the exact byte layout the compiled guest uses.
- **`scripting/as_source_runner.rgr`** — `AsSourceRunner`. Finds the `.as` file
  in a game folder, strips the bare `import … from "@ranger/game"` line, loads the
  source into `ComponentEngine`, and calls `init()` / `update()` each frame. The
  host reads the resulting ABI back the same way the WASM host does.

Two details make one file run both ways:

- **Bare `@ranger/game` import.** The interpreter only resolves relative (`./`)
  imports, so the `@ranger/game` line is a no-op and the calls fall through to the
  native bridge; `asc` resolves it to the real intrinsic-based SDK. The import
  must be **single-line** — the runner strips whole lines containing
  `@ranger/game`, so a wrapped multi-line import breaks.
- **`jsxParsing = false`.** `AsSourceRunner` sets this so `.as` is parsed as
  TypeScript, not TSX — `<` is comparison / cast, never a JSX tag.

## Writing `.as` that runs both ways

The interpreter treats all numbers as IEEE doubles, so for integer-exact behaviour
matching `asc`:

- `/` is **float** division — use an `idiv(a,b)` helper (`return (a/b)|0;`) where
  integer division matters. `imod` follows from it.
- Force integer wraparound with `x | 0` (or explicit sized-int casts — see
  [AS_LANGUAGE_COVERAGE.md](AS_LANGUAGE_COVERAGE.md) for the exact cast semantics).
- Concatenate with `"" + x` rather than `x.toString()`.

Working demos: `games/as_demo/game.as` (score + HUD),
`games/autopeli_as_src/game.as` (physics car game — input, traffic AI, contacts,
per-player HUD), `games/pyorretris/game.as` (sprite Tetris), `games/pose_demo/`.

## Host / launcher wiring

The `.as` guest plugs into the existing native host with no new physics/render
code, because the ABI is identical. A game opts in with `game.info`; the catalog
recognises `engine=as` folders and routes them into the same runners:

```ini
# physics/UI game (autopeli_as_src)
engine=as
module=game.as
physics=true

# rotatable-sprite game, no physics (pyorretris)
engine=as
render=sprites
module=game.as
```

- `physics=true` / UI: the guest drives bodies, controls and the RGU1 UI over the
  ABI; `WasmPhysicsRunner.loadAsGame` interprets the `.as` and points `abi` at the
  bridge. Resources come from the guest's `declare_resources()`
  (`hostSheet`/`hostRect`).
- `render=sprites`: the guest authors position **and** rotation directly via
  `spriteReset()` + `drawSprite(tpl, x, y, angleDeg, frame)` — a native-array draw
  list (not the fixed RGW1 block), so it can hold far more instances than 2560 B.
  `AsSpriteScene` (`scripting/as_sprite_runner.rgr`) +
  `GameSdlRunner.runSpriteGame` blit each template rotated. No physics in the loop.

## Run it (headless)

```bash
npm run engine:as:sprites   # interpreted pyorretris sprite scene -> ALL PASS
```
