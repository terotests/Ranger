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

## Status & next steps

Working: the interpreted `.as` → ABI pipeline (this is the new engine the
project was missing). Follow-ons:

1. **asc parity** — compile the same `game.as` with a `@ranger/game` SDK and diff
   the ABI against the interpreted run (as `tools/parity.cjs` does for Rust↔AS).
2. **Catalog + SDL wiring** — have `game_catalog` pick `AsSourceRunner` when a
   folder holds a `.as` file (the runner already exposes `folderHasAs`), so `.as`
   games appear in the launcher next to `.wasm` ones.
3. **Scale the bridge** — grow the flat SDK to the full RGW1 surface (bodies,
   controls, contacts, impulses, events) so a real game like autopeli runs
   interpreted, then parity-check it against the Rust/AS guests.
