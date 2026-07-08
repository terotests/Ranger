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

### 4. Non-ASCII characters inside `//` comments (native lexer) ✅ (2026-07-08)

**Symptom:** Native SDL (`tmp/game-sdl/game_sdl`) floods `Unexpected token: c/o/X/…` when loading an otherwise valid script. Node runner may work.

**Cause:** A Unicode character inside a line comment (e.g. em dash `—` U+2014) is not treated as comment text by `TSLexer`. The lexer falls out of comment mode and re-tokenizes the rest of the file as code (string literals in `INVADER_*` arrays then appear as stray `c`, `o`, `X` tokens).

**Fix:** Use ASCII-only text in `*.game.tsx` comments (replace `—` with `-`, avoid smart quotes, etc.). Fixed in [`invaders.game.tsx`](./invaders.game.tsx) header comment.

**Engine follow-up (optional):** Teach `TSLexer` to skip any non-newline byte/UTF-8 code point after `//`.

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

### 8. `/// <reference path="./game.d.ts" />` parse noise

**Symptom:** Loading a script that references `game.d.ts` prints `Parse error: expected Identifier but got TSKeyword` for `type` / `interface` lines.

**Impact:** Harmless at runtime (types are ignored); noisy in test output.

### 9. Value-`return` inside `for` / `while` loops not propagated

Documented in [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md). Loops run for side effects only in `runStatementValue`; early `return` inside a loop body does not exit the enclosing function.

### 10. Single-statement loop bodies without `{ … }`

`evaluateStatementBlock()` only executes children of a `BlockStatement`. Prefer braced loop bodies in game scripts.

### 11. `**` operator precedence

See project `ISSUES.md` #6 — parenthesise exponent expressions.

---

## Related files

| File | Role |
|------|------|
| `ComponentEngine.rgr` | Evaluator + JSX expansion |
| `game_runtime.rgr` | Retained-mode GameRunner |
| `GAME_SCRIPTING.md` | Authoring guide for game scripts |
| `invaders.game.tsx` | Stress test: module const arrays + while loops |
