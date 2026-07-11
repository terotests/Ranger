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

### 3. Heavy evaluator debug logging ✅ (partial, 2026-07-08; hot paths, 2026-07-11)

`ComponentEngine` printed every variable bind, function call, method call, and index access. Long game runs flooded stderr and could hit `ENOBUFS` in Vitest.

**Fix:** Added `quiet` flag + `trace()` helper; `GameRunner.init()` sets `engine.quiet = true`. Hot-path method/index logs use `trace()`.

**2026-07-11 follow-up:** Hot-path `trace()` call sites still **built** their string arguments (with `to_string` / `EvalValue.toString()`) even when `quiet=true`, which was a major perf cost on both V8 and C++. Those sites are now guarded with `if (false == quiet)`. See [`TS_ENGINE_OPTIMIZATION.md`](./TS_ENGINE_OPTIMIZATION.md).

**Remaining:** Import/template-literal paths still print when not quiet.

---

### 14. Outer-scope assignment shadowing locals ✅ (2026-07-10)

**Symptom:** `counter += 1` inside a function created a new local instead of updating a module-level `let counter`.

**Fix:** `EvalContext.assignExisting()` + `assign()` walk the parent chain before falling back to `define()`. `evaluateUpdateExpr()` and `++`/`--` now call `context.assign()`.

**Regression:** [`games/ar/index.tsx`](../games/ar/index.tsx) (Arctic Rush) — module-level mutable state updated from `update()` helpers.

---

### 15. `Math.sin` / `Math.cos` / `Math.PI` ✅ (2026-07-10)

**Symptom:** `Math.sin(angle)` returned `null` with “Unhandled method call”.

**Fix:** Method dispatch in `evaluateCallExpr()` handles `sin` and `cos`; `Math.PI` via `evaluateMemberExpr()` (`M_PI`).

**Still missing:** `Math.random`, `Math.atan2`, `Math.min`/`max`, etc.

---

### 16. Bitwise `|` `&` `^` ✅ partial (2026-07-10)

**Symptom:** Expressions like `(speed * 360) | 0` (int truncation idiom) did not work.

**Fix:** Parser bitwise precedence (`parseBitwiseOr/Xor/And`); evaluator `evaluateBinaryExpr()` implements `|`, `&`, `^` with int32 coercion.

**Still missing:** `<<`, `>>`, `>>>`, unary `~`.

---

### 17. `break` / `continue` in loops ✅ partial (2026-07-10)

**Symptom:** `continue` / `break` were not valid loop statements.

**Fix:** `TSParserSimple` parses `break`/`continue`; `evaluateStatementBlock()` and loop evaluators (`evaluateWhileStatement`, `evaluateForStatement`, …) propagate `hasBreak` / `hasContinue`.

**Caveat:** `break`/`continue` only work **inside** loop bodies routed through those evaluators. They are not handled as standalone statements in `runStatementValue()`.

**Regression:** [`games/ar/index.tsx`](../games/ar/index.tsx) — `continue` in collision loops.

---

### 11. Value-`return` inside `for` / `while` loops (value path) ✅ (2026-07-10, PR #159)

**Fix:** Value-path loop runners (`runWhileStatementValue`, `runForStatementValue`, `runForOfStatementValue`) honour `scriptDidReturn`; `runStatementList` stops on `loopBreak` / `loopContinue`.

**Regression:** `whileReturn=5` in [`tsx_engine_demo`](./tsx_engine_demo.rgr).

---

### 18. Transitive import relative paths ✅ (2026-07-10, PR #159)

**Fix:** Save/restore `basePath` per import frame; nested relative imports resolve from the importer directory (`moduleDirFromRead()`).

**Regression:** [`import_chain_demo.rgr`](./import_chain_demo.rgr) — `importChain=7`.

---

### 19. Cyclic import protection ✅ (2026-07-10, PR #159)

**Fix:** `importLoading` / `importLoaded` canonical-path sets guard re-entry in `processImportDeclaration()`.

---

### 20. Hot reload (`patchScript`) duplicates ✅ (2026-07-10, PR #159)

**Fix:** `patchScript()` clears import/component state; `upsertLocalComponent()`; `expandComponent()` uses the **last** name match.

---

### 21. Removed declarations on hot reload ✅ (2026-07-10, PR #159)

**Fix:** `removeBinding()` on removed declarations during `patchScript()`.

---

### 22. Bare `return;` on JSX/EVG path ✅ (2026-07-10, PR #159)

**Fix:** JSX-path `ReturnStatement` without expression sets `hasReturn`.

---

### 23. Import alias (`import { X as Y }`) ✅ partial (2026-07-10, PR #159)

**Fix:** Named import aliases bind under local name (`spec.value`).

**Still missing:** default export imports (`import Y from "./module"`).

---

### 25. Engine reuse leaks state between parse/load cycles ✅ (2026-07-10, PR #159)

**Fix:** `resetParseState()` in `parse()` / `parseFile()`.

---

### 26. `typeof` operator + optional `paneIndex` global ✅ (2026-07-10, PR #159)

**Symptom:** Split-screen games could not use `typeof paneIndex !== "undefined"` to detect pane mode.

**Fix:** `typeof` parsed and evaluated; missing identifiers return `"undefined"` without throwing; `EvalValue.undefined()`; `GameRunner.setPaneIndex(n)` / `clearPaneIndex()`; split-screen host injects pane index per runner.

**Regression:** `splitNoPane=0`, `splitWithPane=1` in [`tsx_engine_demo`](./tsx_engine_demo.rgr).

---

## Known limitations (open)

_Validated against `master` @ 2026-07-10 (PR #156, #158 merged); PR #159 fixes documented below._

### Recommended fix order

| Priority | Issue | Status |
|----------|-------|--------|
| ~~P0~~ | ~~Outer-scope assignment~~ | ✅ Fixed (#14, master) |
| ~~P0~~ | ~~Transitive import paths~~ | ✅ Fixed (#18, PR #159) |
| ~~P0~~ | ~~Hot reload duplicates~~ | ✅ Fixed (#20, PR #159) |
| ~~P1~~ | ~~Cyclic imports~~ | ✅ Fixed (#19, PR #159) |
| ~~P1~~ | ~~Removed bindings stale~~ | ✅ Fixed (#21, PR #159) |
| ~~P1~~ | ~~Return inside loops (value path)~~ | ✅ Fixed (#11, PR #159) |
| ~~P2~~ | ~~Bare `return;` on JSX path~~ | ✅ Fixed (#22, PR #159) |
| **P2** | [#23 Default export imports](#23-import-alias-and-default-export-handling-incomplete) | Partial (`as` aliases done) |
| **P2** | [#24 Shared `moduleScope`](#24-imported-modules-not-isolated-shared-modulescope) | Open |
| **P3** | [#13 `**` operator](#13--operator-parsed-not-evaluated) | Open |
| **P3** | Bitwise `<<` `>>` `~` | Open (partial: `\|` `&` `^` done) |
| **P3** | `Math.random` and other Math helpers | Open (partial: `sin`/`cos`/`PI` done) |

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

### 11. Value-`return` inside `for` / `while` loops not propagated (value path)

**Status:** ✅ Fixed (PR #159). See [Fixed #11](#11-value-return-inside-for--while-loops-value-path--2026-07-10-pr-159).

---

### 12. Single-statement loop bodies without `{ … }`

**Status:** Partially improved.

`evaluateStatementBlock()` handles a single `ReturnStatement`, `BreakStatement`, or `ContinueStatement` as the loop body. Other unbraced bodies (`if`, expression statements) are still skipped. Prefer braced loop bodies in game scripts.

### 13. `**` operator parsed, not evaluated

**Status:** Still open on master.

See project `ISSUES.md` #6 — parenthesise exponent expressions. Parser accepts `**`; `evaluateBinaryExpr()` has no `**` case → `null`.

---

### 18. Transitive import relative paths resolved from wrong directory

**Status:** ✅ Fixed (PR #159). See [Fixed #18](#18-transitive-import-relative-paths--2026-07-10-pr-159).

---

### 19. No cycle protection on import graph

**Status:** ✅ Fixed (PR #159). See [Fixed #19](#19-cyclic-import-protection--2026-07-10-pr-159).

---

### 20. Hot reload (`patchScript`) duplicates imports and components

**Status:** ✅ Fixed (PR #159). See [Fixed #20](#20-hot-reload-patchscript-duplicates--2026-07-10-pr-159).

---

### 21. Removed declarations left intentionally stale on hot reload

**Status:** ✅ Fixed (PR #159). See [Fixed #21](#21-removed-declarations-on-hot-reload--2026-07-10-pr-159).

---

### 22. Bare `return;` ignored on JSX/EVG evaluation path

**Status:** ✅ Fixed (PR #159). See [Fixed #22](#22-bare-return-on-jsxevg-path--2026-07-10-pr-159).

---

### 23. Import alias and default export handling incomplete

**Status:** Partial — named `import { X as Y }` fixed (PR #159); default export still open.

**Risky patterns:**

```ts
import { Original as Local } from "./module";
import Local from "./module";
```

**Cause:** Default export matching is still fragile.

**Workaround:** Import without `as` aliases; use named exports matching the import identifier.

---

### 24. Imported modules not isolated (shared `moduleScope`)

**Status:** Still open on master.

**Cause:** `materializeImportedModule()` binds **all** top-level functions and variables into shared `moduleScope`, including non-exported helpers. Last import wins on name collision.

**Workaround:** Use distinct helper names across imported files (current game scripts do this by convention).

---

### 25. Engine reuse leaks state between parse/load cycles

**Status:** ✅ Fixed (PR #159). See [Fixed #25](#25-engine-reuse-leaks-state-between-parse-load-cycles--2026-07-10-pr-159).

---

## Related files

| File | Role |
|------|------|
| `ComponentEngine.rgr` | Evaluator + JSX; `typeof`, imports, `patchScript` |
| `EvalValue.rgr` | Runtime value model (`undefined`, `setMember`) |
| `ts_ast_patch.rgr` | Hot-reload AST diff |
| `ts_parser_simple.rgr` | Parser (`typeof`, `break`/`continue`, bitwise) |
| `game_runtime.rgr` | GameRunner (`loadScript`, `setPaneIndex`, hot reload) |
| `game_split_screen.rgr` | Split-screen host (`paneIndex` injection) |
| `games/ar/index.tsx` | Arctic Rush — `Math.sin`, `\|` int cast, `continue` |
| `GAME_SCRIPTING.md` | Authoring guide |
| `invaders.game.tsx` | Module const arrays + while loops |
| `import_chain_demo.rgr` | Transitive import regression |
| `breakout_bricks.tsx` | Relative `import` between scripts |
