# Interpreted `.as` / `.tsx` Language Coverage

This documents how much of TypeScript / AssemblyScript the live interpreter
(`ComponentEngine`, in `gallery/pdf_writer/src/jsx/ComponentEngine.rgr`) actually
supports when it runs a `.as` game via `AsSourceRunner`
(`gallery/game_engine/scripting/as_source_runner.rgr`), and where the "hard
corners" still are.

It is a coverage map, not a spec: a `.as` source is meant to run **both** here
(interpreted, for fast start / hot reload) and through `asc` (compiled to WASM,
for shipping). This file tracks the interpreted path so guest authors know what
they can rely on.

## The pipeline (and where gaps live)

```
.as source ──▶ TSLexer ──▶ TSParserSimple (tsxMode=false) ──▶ AST ──▶ ComponentEngine
              (tokens)     (gallery/ts_parser/…)                       (tree-walking eval)
```

A feature can be missing at any of three layers, and the fix location differs:

- **Lexer** (`gallery/ts_parser/ts_lexer.rgr`) — how characters become tokens
  (numeric literals, multi-char operators).
- **Parser** (`gallery/ts_parser/ts_parser_simple.rgr`) — how tokens become AST
  nodes (precedence levels, statement forms).
- **Evaluator** (`ComponentEngine.rgr`) — how AST nodes execute.

A recurring surprise: **the parser is far more complete than the evaluator.**
Many constructs parse into a node the evaluator then ignores. When adding
coverage, first check whether the parser already emits the node — if so, the fix
is evaluator-only (cheap and low-risk).

## How to test

`bin/output.js` (the Ranger→JS compiler) is prebuilt, so you only compile a
small runner and run it with node:

```bash
# Compile + run the language-coverage self-check (asserts 45 features)
RANGER_LIB="./compiler/Lang.rgr;./lib/stdops.rgr" \
  node bin/output.js -es6 ./gallery/game_engine/tests/interp/as_lang_demo.rgr \
  -nodecli -d=tests/.output -o=as_lang_demo.js
node tests/.output/as_lang_demo.js        # expect "ALL PASS"
```

Fixtures live in `gallery/game_engine/tests/interp/`:
`as_lang_fixture/game.as` (language features) and `as_class_fixture/game.as`
(classes). Both are also run from `tests/tsx-engine.test.ts`.

To probe a single feature, drop a `game.as` that writes results to the shared
ABI (`abiWrite(off, expr)`) into a folder and bind it with `AsSourceRunner`,
then read them back with `r.abiRead(off)`.

---

## Supported

### Operators
- Arithmetic `+ - * / %`, string `+` concatenation.
- Bitwise `& | ^`, **shifts `<< >> >>>`**, **bitwise NOT `~`**.
- **Exponent `**`** (integer exponent; used for game/AS math).
- Comparison `< > <= >=`, equality `== === != !==` (loose/strict not
  distinguished — both compare by value).
- Logical `&& || ??` (short-circuit), unary `! - + ~ typeof void`.
- Ternary `?:`, optional chaining `?.`, nullish `??`.
- `x as T` and `<T>x` type assertions (type ignored at runtime), `x!`.

### Assignment & update
- `=` and compound `+= -= *= /= %= **=`, bitwise/shift
  `&= |= ^= <<= >>= >>>=`, logical `&&= ||= ??=`.
- All of the above on **identifier, index (`a[i] += 1`), and member
  (`o.x *= 2`) targets**.
- `++` / `--`, prefix and postfix, with correct **value semantics**
  (`let d = c++` yields the pre-value), on identifier and member/index targets.

### Literals
- Decimal, float, exponent; **hex `0x`, binary `0b`, octal `0o`**; digit
  separators `1_000` (now stripped so they parse).
- String (with `\n \t \r \\` escapes), template literals with `${…}`
  interpolation, booleans, `null`, array `[...]` and object `{...}` literals.

### Control flow
- `if / else if / else`, `while`, C-style `for (let i=0; i<n; i++)`,
  `for…of`, **`for…in`** (object keys / array index strings),
  **`do…while`**, **`switch / case / default`** (with JS fall-through;
  `break` ends the switch, `continue`/`return` propagate correctly).
- `break` / `continue` (unlabeled) in all loop forms; `return` propagates out of
  nested blocks/loops/switch.

### Functions & classes
- Function declarations, recursion, functions as values, arrow-function
  callbacks (see array methods).
- Classes: `new C()`, fields with initializers, methods, `this` reads/writes,
  fluent method chaining, bound-method references as callbacks. (See
  `as_class_fixture`.)

### Stdlib methods
- **String**: `length`, `toString/toUpperCase/toLowerCase/trim`, `charAt`,
  `charCodeAt`, `substring`, `slice` (neg indices), `indexOf`, `includes`,
  `startsWith`, `endsWith`, `split`, `repeat`, `padStart`, `padEnd`, `toFixed`.
- **Array**: `length`, index read/write, `push` (statement position),
  `indexOf`, `includes`, `join`, `slice`, and the higher-order
  `map / filter / forEach / reduce / find / findIndex / some / every`
  (arrow or named callbacks, `(el, i)` args).
- **Math**: `round floor ceil abs sin cos sqrt sign trunc`, and multi-arg
  `min max pow`; constant `Math.PI`.
- **Global**: `parseInt`, `parseFloat`; `typeof`.

---

## Still missing / limited (the hard corners)

Ordered roughly by how often real TS/AS code hits them.

| Gap | Layer | Notes / workaround |
|---|---|---|
| `try / catch / finally`, `throw` | evaluator (parser OK) | No exception model. Return error codes/sentinels instead. |
| Array `pop/shift/unshift/splice/sort/reverse/concat/flat`, `Array.isArray` | evaluator | Only the methods listed above are wired. |
| Callback methods returning from **non-array** receivers (e.g. `this.list.map`) | evaluator | `map/filter/…` require the receiver to evaluate to an array value. |
| `Map` / `Set` / `Date` / `RegExp` | evaluator | `new Map()/new Set()` return null; no keyed-collection type. Use objects/arrays. |
| `JSON.stringify/parse`, `Object.keys/values/entries/assign` | evaluator | Not implemented. `for…in` covers key iteration. |
| `console.log` as a guest function | evaluator | Not a registered global in the `.as` bridge (games use the RGU1 HUD). |
| Destructuring in `let/const` (`const [a,b]=…`, `const {x}=…`) | evaluator (parser OK) | Object-pattern **params** work; declarations do not. Assign fields individually. |
| Spread / rest (`...args`, `[...a]`, `f(...xs)`) | evaluator (parser OK) | Parsed as `SpreadElement`/`RestElement`, not expanded. |
| Positional **default parameters** (`f(x = 5)`) | evaluator | Ignored unless the arg is passed. Object-pattern defaults do work. |
| `let x;` (declaration without initializer) | evaluator | Creates no binding; a later read misses. Always initialize (`let x = 0;`). |
| Labeled `break outer` / labeled loops | parser+evaluator | Only unlabeled break/continue. |
| Closures capture the **call site**, not the definition scope | evaluator | Dynamic-scoped, not lexical. Avoid relying on captured outer locals. |
| `const` immutability, sized-integer (`i32/u8/i64`) overflow/wrap semantics | evaluator | All numbers are IEEE doubles; only `x|0`-style truncation via bitwise ops. `i32(x)` casts are not applied. |
| `**` with a fractional/large exponent | evaluator | Integer exponent only (repeated multiply). |
| `instanceof`, `in`, `delete` | parser+evaluator | Absent. |
| `enum` bodies, `extends` / `super`, `static` members, getters/setters | evaluator (enum parses) | Class inheritance and statics are not modeled. |
| Hard loop cap (10k EVG / 100k value path) | evaluator | Very long loops are silently truncated. |

### Note on shifts vs. generics

`<<` / `>>` / `>>>` are combined from single `<` / `>` tokens **in the parser**
(`parseShift`), not merged in the lexer, specifically so type-generics like
`Map<string, Array<i32>>` keep parsing. The compound `<<= >>= >>>=` (whose
trailing `=` can never appear in a generic) are tokenized directly. A string
literal whose text equals an operator (e.g. `"-"`, `"++"`) is now kept as a
literal — the parser guards operator dispatch on token *type*, not just value.

---

## Recommended next steps (highest value first)

1. **`try/catch/throw`** — a global `scriptThrew` + `scriptThrowValue` pair
   (mirroring `scriptDidReturn`) unwinding through `runStatementList` and the
   loop/call boundaries. Parser already emits `TryStatement`/`ThrowStatement`.
2. **Array mutators** `pop/shift/unshift/splice/sort/reverse` and
   `Array.isArray` — mechanical, alongside the existing array block.
3. **Destructuring in declarations** — reuse the existing `bindObjectPattern`
   for `ObjectPattern`, add `ArrayPattern`, in `processVariableDeclaration`.
4. **Positional default params** — in the two argument binders, when
   `argIdx >= numArgs` and `param.init` exists, evaluate the default.
5. **`let x;` binding** — define the name as `undefined` even with no
   initializer.
6. **`Map`/`Set`** — back them with the existing object map / array.
