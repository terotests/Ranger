# `.as` source engine — interpret AssemblyScript against the WASM ABI

A third run path for game code, built on Ranger's existing live TS interpreter
(`ComponentEngine` + `EvalValue`). It closes the loop opened by the Rust and
AssemblyScript WASM guests:

```
one .as game file
├── development:  interpreted by Ranger (this engine) — instant start, hot reload
└── shipping:     compiled by asc → game.wasm
```

Both paths speak the **same RGW1/RGU1 shared-memory ABI**, so the same source
behaves identically whether interpreted or compiled.

## How it works

`ComponentEngine` already evaluates TypeScript-syntax at runtime (functions,
`let`/`const`, `if`/`while`, assignments, operators, relative imports) and
**ignores type annotations** — which is exactly the AssemblyScript-subset the
game code uses. Two pieces bridge it to the ABI:

- **`as_abi_bridge.rgr`** — `AsAbiBridge extends EvalNativeBridge`. Holds the
  RGW1 (2560 B) and RGU1 (8192 B) blocks as byte buffers and implements the flat
  bridge API (`abiRead/abiWrite`, `uiReset/uiNode/uiText/uiPropEnum/uiFinish`, …)
  over the exact byte layout the compiled guest uses.
- **`as_source_runner.rgr`** — `AsSourceRunner`. Finds the `.as` file in a game
  folder, strips the bare `import … from "@ranger/game"` line (the interpreter
  gets those names from the native bridge instead), loads the source into
  `ComponentEngine`, and calls `init()` / `update()` each frame. The host reads
  the resulting ABI (`abiRead`, `uiByte`) — same as the WASM host.

The trick that makes one file run both ways: the game imports the bridge from a
**bare specifier** `"@ranger/game"`. The interpreter only resolves relative
(`./`) imports, so that line is a no-op and the calls fall through to the native
bridge; `asc` resolves it to the real intrinsic-based SDK. Constants come from a
relative module (interpreter-safe) or are inlined.

## Demo

`games/as_demo/game.as` is a tiny game (increments score, builds a two-line
HUD). Run it interpreted, headless:

```bash
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
  node bin/output.js -es6 ./gallery/game_engine/scripting/as_source_demo.rgr \
  -d=./gallery/game_engine/scripting -o=as_source_demo.js -nodecli
node gallery/game_engine/scripting/as_source_demo.js
```

Output — a real RGW1/RGU1 document built by interpreting `.as`:

```
score=3
ui revision=3
RGU1 nodeCount=3
text node 2 = "SCORE 3"     (dynamic  "SCORE " + score)
text node 3 = "AS SOURCE"
AS SOURCE ENGINE OK
```

## Interpreted autopeli (core)

`games/autopeli_as_src/game.as` is the autopeli **core loop** (init, input →
player controls, traffic AI, contacts → per-player HUD) running interpreted.
`as_autopeli_src_demo.rgr` drives it headless and reads the ABI back:

```
P1 x=205 y=5860   P2 x=261 y=5860   traffic0 x=171 y=5520     (bodies placed)
P1 steer=1000 throttle=1000   P2 steer=-1000   tr0 steer=-7 throttle=450
HUD: HITS 1 / WALL / GRIP 100   |   HITS 0 / CONE / GRIP 100
```

— the same body positions, controls, and HUD the compiled AS guest produces.
The bridge grew to the full RGW1 surface it needs (bodies, controls, contacts,
plus impulse/event writers) and the reader sign-extends (`ar`) so negative
controls come back as `-1000`, matching `wasm_mem_i32`.

### Non-JSX parsing

`ComponentEngine` gained a `jsxParsing` flag (default `true`); `AsSourceRunner`
sets it `false` so `.as` is parsed as TypeScript, not TSX — `<` is comparison /
cast, never a JSX tag.

### Interpreter subset notes (what the `.as` must stay within)

Verified working: module-level `let` state persists across `update()`; user
functions call each other and mutate module state; `let arr = [..]` with
`arr[i] = …` element writes; bitwise `&`; array literals + indexing. Watch out:

- `/` is **float** division — use an `idiv(a,b)` helper (`(a/b)|0`, correct in
  both the interpreter and asc) wherever integer division matters.
- `<i32>x` / `<f64>x` angle-bracket casts and `: i32[]` array-type annotations
  don't parse — use `i32(x)`-style casts and untyped array literals.
- `import { … }` must be **single-line** (the runner strips it whole);
  `x.toString()` returns null — rely on implicit `"" + x` concatenation.
- `if (flags & BIT)` conditions: numbers are truthy, but prefer `!= 0` for clarity.

## Status & next steps

Working: interpreted `.as` → ABI, including the autopeli core. Follow-ons:

1. **Full parity** — port the remaining autopeli extras (oil/ramps/cone-launch/
   audio) into `game.as` and parity-check against the Rust/AS guests.
2. **Catalog + SDL wiring** — have `game_catalog` pick `AsSourceRunner` when a
   folder holds a `.as` file (`folderHasAs` is ready), so `.as` games appear in
   the launcher and drive the real physics/render host.
3. **asc parity** — compile the same `.as` with a `@ranger/game` SDK and diff the
   ABI against the interpreted run.
