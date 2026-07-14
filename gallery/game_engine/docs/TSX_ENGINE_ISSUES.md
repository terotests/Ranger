# Interpreter limitations (ComponentEngine)

Known gaps in the live interpreter (`gallery/pdf_writer/src/jsx/ComponentEngine.rgr`,
parser under `gallery/ts_parser/`) that affect `*.game.tsx` and `.as` scripts run at
runtime. Authoring guide: [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md).

These are the constructs that still misbehave. Everything else in normal game code —
`while`/`for`, `break`/`continue`, member/index assignment, `**`, bitwise `| & ^ << >> >>>`,
`Math.sin/cos/tan/abs/floor/ceil/round/sqrt/min/max/PI`, `typeof`, named `import { X as Y }`,
generic type annotations on functions, hot reload — works.

## Open limitations

| # | Limitation | Workaround |
|---|------------|------------|
| 1 | **TS keywords as binding names.** `const type = …` / `function f(type)` parse-error (also `interface`, `declare`, …). Keywords are fine as object keys / member names, not as variable or parameter names. | Rename the binding (`kind`, `variant`, `category`). |
| 2 | **Unbraced loop/if bodies.** Only `return` / `break` / `continue` work as an unbraced single-statement body; an unbraced `if` or expression statement is silently skipped. | Always brace loop and `if` bodies: `for (…) { stmt }`. |
| 3 | **`Math.random` unsupported** (and other rarely-used `Math` helpers). Absent by design — output must stay deterministic. | Seed your own PRNG in game state, or take randomness from an input/host channel. |
| 4 | **Default-export imports fragile.** `import Local from "./m"` is unreliable; named imports (with or without `as`) work. | Use named exports/imports matching the identifier. |
| 5 | **Imported modules share one scope.** `materializeImportedModule()` binds every top-level name (incl. non-exported helpers) into a shared `moduleScope`; last import wins on a name collision. | Use distinct helper names across imported files. |
| 6 | **`/// <reference path="…" />` parse noise.** Harmless at runtime (types are ignored), but prints `expected Identifier but got TSKeyword` for `type`/`interface` lines. | Ignore, or keep type decls in `.d.ts` referenced for IDE only. |

## Related files

| File | Role |
|------|------|
| `gallery/pdf_writer/src/jsx/ComponentEngine.rgr` | Evaluator + JSX, imports, hot reload |
| `gallery/ts_parser/ts_parser_simple.rgr`, `ts_lexer.rgr` | Parser / lexer |
| [`../scripting/game_runtime.rgr`](../scripting/game_runtime.rgr) | GameRunner (`loadScript`, hot reload) |
