# TSX engine issues (ComponentEngine)

Tracking bugs and limitations in the gallery **ComponentEngine** (`gallery/pdf_writer/src/jsx/ComponentEngine.rgr`) that affect `*.game.tsx` scripts evaluated at runtime (see [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md)).

## Fixed

### 1. `while` loops were no-ops ✅ (2026-07-08)

**Symptom:** Any `while (…) { … }` in a loaded script was silently skipped. Game logic that built sprite lists or `alive[]` arrays with `while` never ran — e.g. Space Invaders registered only the last `list.push()` (one entity: `shot`).

**Cause:** `WhileStatement` was parsed by `TSParserSimple` but never handled in `ComponentEngine` statement dispatch (`evaluateFunctionBody`, `evaluateFunctionBodyValue`, `runStatementValue`, `evaluateStatementBlock`).

**Fix:** Added `evaluateWhileStatement()` and wired it into all four dispatch paths.

**Note:** This looked like “module `const` not visible in functions”, but the real failure was the loop never executing. After the while fix, `while (i < ALIEN_COUNT)` works with top-level `const ALIEN_COUNT = COLS * ROWS`.

**Regression:** [`tsx_engine_demo.rgr`](./tsx_engine_demo.rgr) + [`tsx_engine_demo.game.tsx`](./tsx_engine_demo.game.tsx), tested in [`tests/tsx-engine.test.ts`](../../../tests/tsx-engine.test.ts).

---

### 2. Module-scope structures (`const` arrays/objects) ✅ (2026-07-08)

**Symptom:** Hard to define shared game data (sprite bitmaps, palettes, config objects) at the top of a script; workarounds pushed everything into helper functions.

**Cause / gaps:**

- While loops (issue #1) prevented loops that populate arrays from running — looked like const scoping.
- `loadScript` did not reset bindings per script load (re-load accumulated stale globals).
- Top-level `export const …` was not registered (only bare `const` / `function`).

**Fix:**

- Explicit **`moduleScope`** on `ComponentEngine` — fresh scope per `loadScript()`, script bindings stored there.
- **`hostScope`** for `registerGlobal()` — survives `loadScript()` resets (game config injected by Ranger host).
- **`moduleScope.parent = hostScope`** so functions see both script `const` and injected globals.
- **`processModuleVariableDeclaration`** for top-level vars; local `const` inside functions still uses `processVariableDeclaration` + current scope.
- **`registerTopLevelNode` / `processTopLevelVarNode`** unwrap `export …` declarations.

**Supported patterns (tested):**

```tsx
const COLS = 5;
const ROWS = 3;
const ALIEN_COUNT = COLS * ROWS;      // computed const
const LINES = ["..XXX..", ".XXXXX."]; // string array
const PALETTE = { r: 10, g: 20, b: 30 };
function len() { return LINES.length; }
function first() { return LINES[0]; }
function total() { return PALETTE.r + PALETTE.g; }
```

**Example:** [`invaders.game.tsx`](./invaders.game.tsx) — module-level `INVADER_A/B/C` bitmap arrays.

---

### 3. Heavy evaluator debug logging ✅ (partial, 2026-07-08)

`ComponentEngine` printed every variable bind, function call, method call, and index access. Long game runs flooded stderr and could hit `ENOBUFS` in Vitest.

**Fix:** Added `quiet` flag + `trace()` helper; `GameRunner.init()` sets `engine.quiet = true`. Hot-path method/index logs use `trace()`.

**Remaining:** Import/template-literal paths still print when not quiet.

---

## Known limitations (open)

### Recommended fix order (2026-07-10)

These are the highest-impact open bugs for `gallery/game_engine` runtime scripts. Fix scope assignment, import resolution, and hot-reload duplication first — they produce hard-to-trace silent failures.

| Priority | Issue | Why first |
|----------|-------|-----------|
| **P0** | [#14 Outer-scope assignment via `define()`](#14-outer-scope-assignment-via-define-not-assign) | Mutations create shadow locals; module state never updates |
| **P0** | [#15 Transitive import paths](#15-transitive-import-relative-paths-resolved-from-wrong-directory) | `components/A.tsx → ./B` breaks when B is not in the main script dir |
| **P0** | [#17 Hot reload duplicates](#17-hot-reload-patchscript-duplicates-imports-and-components) | `expandComponent()` may resolve a stale component after reload |
| **P1** | [#16 Cyclic imports](#16-no-cycle-protection-on-import-graph) | `A → B → A` can recurse until stack overflow |
| **P1** | [#18 Removed bindings stay live](#18-removed-declarations-left-intentionally-stale-on-hot-reload) | Deleted functions/vars still callable after patch |
| **P1** | [#11 Return inside loops](#11-value-return-inside-for--while-loops-not-propagated) | Early exit in reducers silently wrong |
| **P2** | [#19 Bare `return;` on JSX path](#19-bare-return-ignored-on-jsxevg-evaluation-path) | `return;` does not stop execution in render helpers |
| **P2** | [#20 Import alias / default export](#20-import-alias-and-default-export-handling-incomplete) | `import { X as Y }` / `import Y from` fragile |
| **P2** | [#21 Imported modules not isolated](#21-imported-modules-not-isolated-shared-modulescope) | Private helpers from two files can clobber each other |
| **P2** | [#22 Engine reuse leaks state](#22-engine-reuse-leaks-state-between-parse-load-cycles) | `parse()` / `parseFile()` do not reset like `loadScript()` |
| **P3** | [#13 `**` operator](#13--operator-precedence-and-evaluation) | Parsed but not evaluated |

---

### 4. Non-ASCII characters inside `//` comments (native lexer) ✅ (2026-07-08)

**Symptom:** Native SDL (`tmp/game-sdl/game_sdl`) floods `Unexpected token: c/o/X/…` when loading an otherwise valid script. Node runner may work.

**Cause:** `TSLexer` used UTF-8 **byte** length (`strlen`) as `len` while `pos` tracked **code units** via `r_utf8_char_at`. After a multi-byte character (e.g. em dash `—`), `pos` and `source.at(pos)` diverged — `isAlpha` / `isAlphaNumCh` read the wrong byte and identifiers like `const` were split into `c`, `o`, `nst…`. String literals in sprite arrays were then tokenized character-by-character.

**Fix:** [`gallery/ts_parser/ts_lexer.rgr`](../../../gallery/ts_parser/ts_lexer.rgr):

- `countCodeUnits()` sets `len` to code-unit count (C++ UTF-8 walk; ES6 BMP-safe).
- `isAlpha` / `isAlphaNumCh` classify the peeked `ch` (`charAt ch 0`), not `charAt source pos`.
- JSX apostrophe heuristic uses `peekAt(±1)` instead of byte offsets.

**Regression:** [`tests/ts-lexer.test.ts`](../../../tests/ts-lexer.test.ts) (`tokenizes line comments with UTF-8 punctuation`).

---

### 5. C++ dead-code elimination of loop evaluation in `runStatementValue` ✅ (2026-07-08)

**Symptom:** Native SDL shows only the `shot` sprite (and auto-fire works) but **no ship or invaders** (`entities=1`, `ship=-1,-1`). Node/ES6 runner OK (`entities=277`).

**Cause:** `runStatementValue()` called `evaluateWhileStatement()` etc. but assigned the result to a **local that was never read**. Clang++ removed those calls as dead code. Game script loops (`buildAlienSprites`, `sprites()` ship merge, …) never ran in the C++ build.

**Fix:** Added void wrappers `runWhileStatementValue` / `runForStatementValue` / `runForOfStatementValue` that invoke loop evaluators without an unused temp.

**Verify after rebuild:** `npm run engine:game-sdl` then headless run should print `entities=277` (not `1`).

---

### 6. Nested `callFunction` left `scriptDidReturn` stuck ✅ (2026-07-08)

**Symptom:** Ship and invader wave stay frozen; auto-fire/score may still change. Node motion test: `a0p0` and `ship4` unchanged after hundreds of frames.

**Cause:** `evaluateFunctionCall()` did not save/restore `scriptDidReturn`. Any helper in an `if` condition (e.g. `countAlive(alive) == 0`) set the flag; the rest of `update()` (including `placeShip`, `placeAlienPixels`, final `return { entities }`) was skipped.

**Fix:** Save/restore `scriptDidReturn` + `scriptReturnValue` around nested calls in both `evaluateFunctionCall()` and the inline path in `evaluateCallExpr()`.

**Also:** `evaluateCallExprForSideEffect()` now invokes plain helper calls (`placeShip(...)`, `placeAlienPixels(...)`) — previously only `arr.push()` ran.

**Also:** SDL input exposes **Left/Right** (and A/D); Invaders uses `props.left` / `props.right` for cannon movement.

---

### 7. Object/array member assignment (`obj.prop = v`, `arr[i] = v`) ✅ (2026-07-08)

**Symptom:** Game window opens and scores render, but **no sprites** (Invaders shows only `0` and lives `3`). Node headless run also had `ship=0,0` and ~500 non-background pixels (mostly score digits).

**Cause:** `evaluateUpdateExpr()` only handled simple identifier assignment (`x = 1`). Game scripts assign entity positions with `entities.ship0 = { x, y }`, `entities[id] = …`, and `alive[i] = 0` — all silently no-ops. Retained sprites stayed at default `(0,0)`; centered rects drew mostly off-screen (clipped).

**Fix:** Added `EvalValue.setMember()` / `setIndexAt()` and member-expression handling in `evaluateUpdateExpr()`.

**Regression:** `memberAssign=19` in [`tsx_engine_demo`](./tsx_engine_demo.rgr); invaders runner expects `entities>200` and `ship.x>100`.

---

### 8. Reserved word `type` as identifier (native / C++ parser) ✅ (2026-07-08)

**Symptom:** Loading a script in **native SDL** (`tmp/game-sdl/game_sdl`) floods `Unexpected token: c/o/X/…` and `Parse error: expected ',' but got 'ienType(r'`. Node runner may still appear to work.

**Cause:** `const type = …` or `function f(type)` — the identifier **`type`** is a TypeScript keyword (`TSKeyword`). The native parser rejects it; error recovery then mis-tokenizes the rest of the file.

**Fix:** Do not use `type` as a variable or parameter name in `*.game.tsx`. Use `kind`, `variant`, `category`, etc. Fixed in [`invaders.game.tsx`](./invaders.game.tsx).

**Avoid as identifiers:** `type`, `interface`, `declare`, `export` (when not at statement start), and other TS keywords.

---

### 9. Generic / complex types on engine callback signatures (e.g. `hud`, `update`)

**Symptom:** JSX HUD does not render at all — no score text in the top strip. Parser may print errors such as `Parse error: expected '{' but got '.'` or `Unknown type: object` while loading imports. `scriptHasFunction("hud")` can fail or the function body never binds correctly.

**Cause:** `TSParserSimple` / `ComponentEngine` do not fully parse TypeScript generic type annotations on function parameters and return types. Signatures like:

```tsx
function hud(props: TypedEventProps<BreakoutState>): JSX.Element { … }
function update(props: TypedEventProps<BreakoutState>): BreakoutState { … }
```

break parsing (angle brackets, nested generics). The engine silently skips or mis-registers the function.

**Workaround:** Use **untyped** signatures for functions the GameRunner calls by name (`initState`, `sprites`, `update`, `hud`, …). Keep types in `*.d.ts` + `/// <reference path="…" />` for IDE checking only:

```tsx
/// <reference path="../../scripting/game.d.ts" />
/// <reference path="./breakout.d.ts" />

function update(props) {
  const s = props.state;
  …
}

function hud(props) {
  const s = props.state;
  return (
    <View flexDirection="row" padding="8px" width="100%" justifyContent="space-between">
      <Label color="#ffffff">SCORE {s.screens.play.score}</Label>
    </View>
  );
}
```

**Good reference:** [`games/invaders/index.tsx`](../games/invaders/index.tsx) — `function update(props)` / `function hud(props)`.

**Also avoid in runtime scripts:** non-null assertions (`getScreen(s, "gameOver")!`) — prefer `s.screens.gameOver` or guard without `!`.

**Fixed in:** [`games/breakout/index.tsx`](../games/breakout/index.tsx), [`breakout.game.tsx`](./breakout.game.tsx) (2026-07-09).

---

### 10. `/// <reference path="./game.d.ts" />` parse noise

**Symptom:** Loading a script that references `game.d.ts` prints `Parse error: expected Identifier but got TSKeyword` for `type` / `interface` lines.

**Impact:** Harmless at runtime (types are ignored); noisy in test output.

### 11. Value-`return` inside `for` / `while` loops not propagated ✅ (2026-07-10)

**Fix:** Value-path loop runners (`runWhileStatementValue`, `runForStatementValue`, `runForOfStatementValue`) execute bodies via `runBlockOrStatement()` and honour `scriptDidReturn`, `loopBreak`, `loopContinue`.

**Regression:** `whileReturn=5` in [`tsx_engine_demo`](./tsx_engine_demo.rgr).

### 12. Single-statement loop bodies without `{ … }`

`evaluateStatementBlock()` only executes children of a `BlockStatement`. Prefer braced loop bodies in game scripts.

### 13. `**` operator precedence and evaluation

See project `ISSUES.md` #6 — parenthesise exponent expressions. The parser accepts `**` (`ts_parser_simple.rgr`) but `evaluateBinaryExpr()` has no `**` case, so `2 ** 10` evaluates to `null`.

---

### 14. Outer-scope assignment via `define()`, not `assign` ✅ (2026-07-10, PR #156)

**Fix:** `EvalContext.assign()` / `assignExisting()`; `evaluateUpdateExpr()` uses `context.assign()`.

---

### 15. Transitive import relative paths resolved from wrong directory ✅ (2026-07-10)

**Fix:** Save/restore `basePath` per import frame; `moduleDirFromRead()` resolves nested paths (e.g. `import_fixtures/mid.tsx`).

**Regression:** [`import_chain_demo.rgr`](./import_chain_demo.rgr).

---

### 16. No cycle protection on import graph ✅ (2026-07-10)

**Fix:** `importLoading` / `importLoaded` canonical-path sets; skip cycles and re-bind from existing `moduleScope`.

---

### 17. Hot reload (`patchScript`) duplicates imports and components ✅ (2026-07-10)

**Fix:** `patchScript()` clears import/component state before re-import; `upsertLocalComponent()`; `expandComponent()` uses last match.

---

### 18. Removed declarations left stale on hot reload ✅ (2026-07-10)

**Fix:** `moduleScope.removeBinding()` + `removeLocalComponentByName()` on `"removed"` patch entries.

---

### 19. Bare `return;` ignored on JSX/EVG evaluation path ✅ (2026-07-10)

**Fix:** JSX paths set `hasReturn` even when `ReturnStatement` has no expression.

---

### 20. Import alias and default export handling incomplete

**Status:** Named `import { X as Y }` aliases bind under local name `Y` (2026-07-10). **Default exports** (`import Local from "./module"`) still fragile.

---

### 21. Imported modules not isolated (shared `moduleScope`)

**Symptom:** Two imported files with the same private helper name interfere; non-exported bindings from one file visible to another.

**Cause:** `materializeImportedModule()` binds **every** top-level function and variable from the imported AST into the shared `moduleScope` via `defineModuleBinding()`, including non-exported helpers. There is no per-module namespace.

**Example:** `breakout_bricks.tsx` and `invaders_shared.tsx` both defining `function clamp(...)` — last import wins.

**Fix direction:** Either isolate each file in a child scope and re-export only requested symbols, or prefix/mangle private bindings.

**Note:** Current game imports use distinct helper names by convention; risk grows with more shared modules.

---

### 22. Engine reuse leaks state between parse/load cycles ✅ (2026-07-10)

**Fix:** `resetParseState()` in `parse()` / `parseFile()`; `parseFile()` uses `setBasePath()`.

---

## Related files

| File | Role |
|------|------|
| `ComponentEngine.rgr` | Evaluator + JSX expansion; `EvalContext`, `processImports`, `patchScript` |
| `EvalValue.rgr` | Runtime value model (`setMember`, `setIndexAt`) |
| `ts_ast_patch.rgr` | Hot-reload AST diff (`TSAstPatcher`) |
| `game_runtime.rgr` | Retained-mode GameRunner (`loadScript`, `hotReloadScript`) |
| `GAME_SCRIPTING.md` | Authoring guide for game scripts |
| `invaders.game.tsx` | Stress test: module const arrays + while loops |
| `games/invaders/index.tsx` | Untyped `update` / `hud` callbacks (parser-safe) |
| `breakout.game.tsx` / `games/breakout/index.tsx` | Retained bricks + JSX `hud()` overlay |
| `breakout_bricks.tsx` | Relative `import` between scripts |
| `GAME_ENGINE_DESIGN.md` | Design notes: retained sprites + JSX HUD, performance |
