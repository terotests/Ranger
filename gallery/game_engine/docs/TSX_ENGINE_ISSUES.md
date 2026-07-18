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

## Foundational semantics gaps (no clean workaround — targeted by the object-model work)

These are deeper than the table above: they are core JS-value semantics the
evaluator gets wrong, so they can't be worked around in game code, only fixed in
the evaluator. They are the reason the Three reconciler resorts to index caches
and a `__removed` hack, and they gate the native-object adapter
([`CODE_CLEANUP.md`](../CODE_CLEANUP.md) Part II).

| # | Limitation | Impact |
|---|------------|--------|
| 7 | **No stable object identity.** `EvalValue.equals()` returns `false` for every object and array (`gallery/pdf_writer/src/jsx/EvalValue.rgr:540-541`, *"reference equality for now → return false"*). So `a === a` is false; `Map`/`Set` object keys (same `equals`) don't work; `Array.indexOf/includes` on objects fail. | The Three façade (`three.tsx`) can't use identity to remove nodes, so it carries a `__removed` flag; the reconciler keys by array index / DFS ordinal instead of identity. **Fix:** a monotonic `identityId` on every reference value, compared in `equals()` and used for `Map`/`Set` keys. |
| 8 | **Missing member returns `null`, not `undefined`.** `EvalValue.getMember()` returns `EvalValue.null()` for an absent key (`EvalValue.rgr:341`) although a distinct `undefined` type exists (`isUndefined`, `EvalValue.undefined()`). | Breaks default params, `typeof`, `??`, optional chaining, and lets tests confuse "missing" with a real `0`/`false`. **Fix:** missing member → `undefined`. Sequence after #7 (may surface latent `isNull()` assumptions). |

## Value model (`EvalValue.valueType` tags)

The evaluator tags every value with an integer `valueType`
(`gallery/pdf_writer/src/jsx/EvalValue.rgr`):

| tag | type | notes |
|-----|------|-------|
| 0 | null | |
| 1 | number | |
| 2 | string | |
| 3 | bool | |
| 4 | array | keys of Map/Set are stored here |
| 5 | object | |
| 6 | function / bound-method | `function()` / `boundMethod()` |
| 7 | **native `EVGElement`** | `EvalValue.element()` — a native Ranger object already wrapped in an EvalValue. Proves the interpreter can hold a native host object; the native-object adapter ([`CODE_CLEANUP.md`](../CODE_CLEANUP.md) §II.9) generalizes exactly this slot. |
| 8 | undefined | distinct from null (but `getMember` wrongly returns null — issue #8) |
| 9 | Map | keys in `arrayValue`, looked up via the broken `equals()` (issue #7), so object keys silently fail |
| 10 | Set | same as Map |

## Related files

| File | Role |
|------|------|
| `gallery/pdf_writer/src/jsx/ComponentEngine.rgr` | Evaluator + JSX, imports, hot reload |
| `gallery/pdf_writer/src/jsx/EvalValue.rgr` | The tagged value type (`valueType`, `equals`, `getMember`) |
| `gallery/ts_parser/ts_parser_simple.rgr`, `ts_lexer.rgr` | Parser / lexer |
| [`../scripting/game_runtime.rgr`](../scripting/game_runtime.rgr) | GameRunner (`loadScript`, hot reload) |

> **Relocation under review:** the evaluator (`pdf_writer/src/jsx/` + `ts_parser/`)
> now has ~44 importers under `gallery/game_engine/` vs a handful in `pdf_writer`
> (tools/lib/bench) and `ts_to_ranger`. Moving it "under game_engine" would invert
> the dependency (pdf_writer → game_engine); the cleaner alternative is to promote
> it to a shared gallery-level module both import. Tracked in
> [`CODE_CLEANUP.md`](../CODE_CLEANUP.md) §I.6.
