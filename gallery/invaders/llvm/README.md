# Space Invaders — LLVM IR sample

Checked-in example of Ranger's **experimental LLVM backend** output for [`../invaders.rgr`](../invaders.rgr).

| File | Description |
| --- | --- |
| `invaders.ll` | Human-readable LLVM IR (~1,700 lines). Generated on **arm64-apple-macos**; `target triple` reflects the host used at build time. |

This is **not** WebAssembly. It is LLVM intermediate representation — the same kind of text IR that `clang` consumes before linking a native executable.

## Regenerate

From the repository root (requires `npm run compile` first):

```bash
npm run game:build:llvm
cp tmp/invaders-native/invaders.ll gallery/invaders/llvm/invaders.ll
```

The build script writes to `tmp/invaders-native/` (gitignored) and links `runtime/ranger_term.c` into a native binary. Only the `.ll` sample is kept here for inspection and docs.

## Build and run (native)

```bash
npm run game:build:llvm
./tmp/invaders-native/invaders
```

## What to look for in the IR

- String constants (`@.str.*`) for terminal messages
- `declare` lines for libc and `ranger_*` terminal helpers
- Struct layouts (`%struct.Alien`, `%struct.Invaders`, …)
- Lowered game logic: `Invaders_gameLoop`, `Invaders_render`, `RtPtrArray_*` runtime calls

See the main [README](../../../README.md#experimental-llvm-backend-space-invaders) for WASM/freestanding experiments and test commands (`npm run test:llvm`).
