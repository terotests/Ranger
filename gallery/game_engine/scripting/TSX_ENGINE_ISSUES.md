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

### 11. Value-`return` inside `for` / `while` loops not propagated

Documented in [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md).

**Symptom:** `for (…) { return value; }` or `while (…) { return value; }` inside a value-returning function (`update`, `initState`, …) does **not** exit the enclosing function. Execution may continue after the loop or return `null`.

**Cause:** `runStatementValue()` runs loop bodies for side effects only. The comment in `ComponentEngine.rgr` admits this:

```rgr
; Loops run for side effects; value-returns from inside a loop are not
; propagated (uncommon in screen/reducer scripts).
```

Loop evaluators on the JSX/EVG path (`evaluateForStatement`, `evaluateWhileStatement`) propagate `hasReturn` from the loop body, but the **value-function path** (`evaluateFunctionBodyValue` → `runStatementValue`) does not wire `scriptDidReturn` through loop iterations the way `if` blocks do.

**Fix direction:** Loop evaluators in the value path should check `scriptDidReturn` after each iteration (same mechanism as nested `callFunction` save/restore in issue #6).

**Workaround:** Avoid `return` inside loops; use `if` + early `return` at statement level, or a flag variable.

### 12. Single-statement loop bodies without `{ … }`

`evaluateStatementBlock()` only executes children of a `BlockStatement`. Prefer braced loop bodies in game scripts.

### 13. `**` operator precedence and evaluation

See project `ISSUES.md` #6 — parenthesise exponent expressions. The parser accepts `**` (`ts_parser_simple.rgr`) but `evaluateBinaryExpr()` has no `**` case, so `2 ** 10` evaluates to `null`.

---

### 14. Outer-scope assignment via `define()`, not `assign`

**Symptom:** Assigning to a variable declared in an outer scope (module or enclosing function) from an inner function creates a **new local binding** instead of updating the existing one.

**Example:**

```ts
let counter = 0;
function inc() {
  counter += 1;   // or counter = counter + 1
}
```

After `inc()`, `counter` at module scope is still `0`; a shadow `counter` exists only inside `inc()`.

**Cause:** `evaluateUpdateExpr()` (and `++`/`--` paths) always call `context.define(name, value)`. `EvalContext.define()` only updates bindings in the **current** scope's variable list; if the name is not already defined locally, it **pushes a new entry** into the current scope. It does not walk the parent chain to find an existing binding.

`lookup()` correctly walks `parent` scopes, so reads see the outer value but writes go to a fresh local.

**Fix direction:** Add `EvalContext.assign(name, value)` that finds the scope owning the binding (walk parents with `has()`) and updates there; use `define()` only for declarations. Member/index assignment (`obj.x = v`) is separate and works when the object reference is written back.

**Impact on games:** Current game scripts mostly return new state objects (reducer style) rather than mutating module-level `let` bindings, so this is latent — but any shared mutable module state (`let score`, counters, caches) will silently fail.

---

### 15. Transitive import relative paths resolved from wrong directory

**Symptom:** Nested imports fail or load the wrong file when an imported module imports a sibling.

**Example:** Main script `games/foo/index.tsx` imports `./components/A.tsx`. Inside `A.tsx`:

```ts
import { helper } from "./B";
```

`B.tsx` lives next to `A.tsx` in `components/`, but resolution looks in the **main script's** directory (`games/foo/`), not `components/`.

**Cause:** `processImportDeclaration()` sets `resolvedImportDir = basePath` and calls `readImportSource(basePath, fullPath)` using the engine's global `basePath` (the entry script directory). After loading `A.tsx`, recursive `processImports(importAst)` runs **without** temporarily setting `basePath` (or an import stack) to `components/`. `resolvedImportDir` is updated on successful read but is not used as the base for nested relative imports.

**Fix direction:** Save/restore `basePath` per import frame: `push basePath = dirname(currentModulePath)` before `processImports(importAst)`, pop after.

**Workaround:** Flatten imports so all relative paths resolve from the entry script directory, or duplicate shared helpers.

---

### 16. No cycle protection on import graph

**Symptom:** Circular imports (`A.tsx → B.tsx → A.tsx`) can recurse until stack overflow.

**Cause:** `loadedFiles` is appended on each load (`push loadedFiles loadedFilePath`) for file-watching, but nothing checks whether a canonical path is already **loading** or **loaded** before re-entering `processImportDeclaration()`.

**Fix direction:** Maintain `loading:Set<canonicalPath>` and `loaded:Set<canonicalPath>`; skip or error on re-entry; optionally return already-materialized bindings for loaded modules.

---

### 17. Hot reload (`patchScript`) duplicates imports and components

**Symptom:** After hot reload, behaviour is inconsistent — old component version used, duplicate helpers, or growing `localComponents` list.

**Cause:** `patchScript()` calls `processImports(newAst)` on every patch **without** clearing or replacing prior import state:

- `localComponents` is not reset (unlike `loadScript()` which calls `clearLocalComponents()`).
- `loadedFiles` keeps growing.
- Each re-import **pushes** new `ImportedSymbol` entries; `expandComponent()` returns the **first** name match in `localComponents`, which may be the **old** AST node.
- `updateLocalComponentNode()` only updates an existing symbol; newly pushed duplicates remain.

**Fix direction:** On patch, either (a) re-run the `loadScript()` registration path for imports, or (b) upsert by `(sourcePath, exportName)` and remove stale symbols; always replace `functionNode` on name collision instead of appending.

---

### 18. Removed declarations left intentionally stale on hot reload

**Symptom:** Deleting a top-level function, `const`, or import from source does not remove it from the runtime namespace after hot reload. Old bindings remain callable.

**Cause:** Explicit comment in `patchScript()`:

```rgr
if (ch.changeKind == "removed") {
    ; Dev reload rarely removes declarations; leave stale binding.
}
```

The patcher detects removals but the evaluator deliberately does nothing. Same applies to imports re-processed by `processImports()` without unregistering removed modules.

**Fix direction:** On `"removed"`, `moduleScope` / `localComponents` / import registry should drop the binding (or full reload when any import graph node changes).

---

### 19. Bare `return;` ignored on JSX/EVG evaluation path

**Symptom:** `return;` (no expression) inside a JSX/render helper does not stop execution; statements after the return may still run.

**Cause:** Multiple JSX-path handlers only treat `ReturnStatement` when `stmt.left` is present:

```rgr
if (stmt.nodeType == "ReturnStatement") {
    if stmt.left {
        ...
        returnedEl.hasReturn = true
    }
}
```

A bare `return;` never sets `hasReturn` or returns early. The value-function path (`runStatementValue`) **does** set `scriptDidReturn = true` even without `stmt.left` — asymmetry between paths.

**Workaround:** Always `return null;` or `return <Fragment />;` in JSX helpers.

---

### 20. Import alias and default export handling incomplete

**Symptom:** Renamed or default imports may not bind the expected name, or fail to match exported symbols.

**Risky patterns:**

```ts
import { Original as Local } from "./module";
import Local from "./module";
export default function () {}
```

**Cause:** `processImportDeclaration()` collects `importedNames` from `ImportSpecifier.name` (the **exported** name in the source module), but registers bindings under the export's `fnName`, not the local alias (`spec.value`). Default exports (`ImportDefaultSpecifier`) are pushed by local name but `materializeImportedModule()` / export matching logic primarily handles `ExportNamedDeclaration` and plain `FunctionDeclaration` by **source name** equality with `importedNames`.

`ImportedSymbol.originalName` exists but is always set equal to `name`; alias mapping is unused.

**Workaround:** Import without `as` aliases; use named exports matching the import identifier.

---

### 21. Imported modules not isolated (shared `moduleScope`)

**Symptom:** Two imported files with the same private helper name interfere; non-exported bindings from one file visible to another.

**Cause:** `materializeImportedModule()` binds **every** top-level function and variable from the imported AST into the shared `moduleScope` via `defineModuleBinding()`, including non-exported helpers. There is no per-module namespace.

**Example:** `breakout_bricks.tsx` and `invaders_shared.tsx` both defining `function clamp(...)` — last import wins.

**Fix direction:** Either isolate each file in a child scope and re-export only requested symbols, or prefix/mangle private bindings.

**Note:** Current game imports use distinct helper names by convention; risk grows with more shared modules.

---

### 22. Engine reuse leaks state between parse/load cycles

**Symptom:** Calling `parse()` or `parseFile()` multiple times on the same `ComponentEngine` instance accumulates stale imports, components, and file-watch entries. Differs from `loadScript()` which resets `moduleScope` and `localComponents`.

**Cause:**

- `parse()` does **not** reset `moduleScope`, `localComponents`, or `loadedFiles`.
- `parseFile()` pushes to `loadedFiles` without clearing prior entries.
- `parseFile()` assigns `basePath = dirPath` **without** normalizing a trailing `/`, unlike `setBasePath()` used by `GameRunner`.

**Impact:** PDF/component tooling that reuses one engine instance may see cross-document leakage. `GameRunner` uses `loadScript()` (safe) but hot reload + `parse()` paths in tests/tools should reset explicitly.

**Fix direction:** Extract a `resetModuleState()` shared by `loadScript()` and the start of `parse()`, or document that `ComponentEngine` is single-shot per document.

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
