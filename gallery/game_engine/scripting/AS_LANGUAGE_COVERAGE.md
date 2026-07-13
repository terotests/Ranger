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

Fixtures live in `gallery/game_engine/tests/interp/` (all run from
`tests/tsx-engine.test.ts`):
`as_lang_fixture` (operators, control flow, base stdlib — 45 checks),
`as_lang2_fixture` (destructuring, spread, params, array mutators, Object/JSON,
instanceof/in/delete, try/catch, stdlib extras — 41 checks),
`as_lang3_fixture` (Map/Set, Array#splice, lexical closures, sized-int casts —
33 checks), and `as_class_fixture` (classes — 5 checks). Their `*_demo.rgr`
runners print `ALL PASS`.

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
  `for…of` (arrays, `Set`, `Map` entries, and string chars; loop variable may
  destructure: `for (const [k,v] of map)`), **`for…in`** (object keys / array
  index strings), **`do…while`**, **`switch / case / default`** (with JS
  fall-through; `break` ends the switch, `continue`/`return` propagate).
- `break` / `continue` (unlabeled) in all loop forms; `return` propagates out of
  nested blocks/loops/switch.

### Functions & classes
- Function declarations, recursion, functions as values, arrow-function
  callbacks (see array methods).
- **Lexical closures**: a function/arrow that is returned, stored, or passed as a
  callback captures its defining scope, so free variables resolve there (and
  stateful captures like a counter mutate the captured binding). Each closure
  instance is independent.
- **Positional default parameters** (`f(x = 5)`; the default is evaluated in the
  param scope, so it can reference earlier params), **rest parameters**
  (`...args` → array), and **destructured parameters** (`{a}`/`[x]`).
- Classes: `new C()`, fields with initializers, methods, `this` reads/writes,
  fluent method chaining, bound-method references as callbacks,
  **`instanceof`** (direct class tag; no inheritance chain). (See
  `as_class_fixture`.)

### Destructuring & spread (ES2015+)
- **Declaration destructuring**: `const [a, b, ...rest] = arr` (holes, defaults,
  rest) and `const {x, y: alias, z = 1, ...rest} = obj`. Recursive/nested.
- **Spread**: array `[...a, b]`, call `f(...xs)`, object `{...o, k: v}`
  (last-write-wins on duplicate keys).

### Stdlib methods
- **String**: `length`, `toString/toUpperCase/toLowerCase/trim/trimStart/trimEnd`,
  `charAt`, `charCodeAt`, `substring`, `slice` (neg indices), `at` (neg index),
  `indexOf`, `lastIndexOf`, `includes`, `startsWith`, `endsWith`, `split`,
  `concat`, `repeat`, `padStart`, `padEnd`, `replace` (first), `replaceAll`,
  `toFixed`. (`replace`/`replaceAll` are string-search only — no RegExp.)
- **Array**: `length`, index read/write, `at`, `indexOf`, `lastIndexOf`,
  `includes`, `join`, `slice`, `concat`, `flat` (one level); mutators
  `push` (returns length, expression or statement), `pop`, `shift`, `unshift`,
  `splice` (remove/insert, returns removed), `reverse`, `fill`, `sort`
  (comparator, or JS-default string order); and the higher-order
  `map / filter / forEach / reduce / find / findIndex / some / every` (arrow or
  named callbacks — closures included — `(el, i)` args). `Array.isArray`.
- **Map**: `new Map([[k,v]…])`, `set` (chainable), `get`, `has`, `delete`,
  `clear`, `size`, `keys`, `values`, `entries`, `forEach((v,k)…)`; any key type
  (matched by value equality, insertion order preserved); iterable with
  `for (const [k,v] of map)`.
- **Set**: `new Set([…])`, `add` (chainable, dedups), `has`, `delete`, `clear`,
  `size`, `values`/`keys`, `forEach`; iterable with `for (const v of set)`.
- **Math**: `round floor ceil abs sin cos tan sqrt sign trunc`, multi-arg
  `min max pow hypot`; constant `Math.PI`.
- **Object**: `Object.keys / values / entries / assign` (the internal
  `__class__` tag is hidden).
- **JSON** (ECMA-404): `JSON.stringify` and `JSON.parse` (objects, arrays,
  strings with `\n \t \r \" \\ /` escapes, numbers, booleans, null).
- **Global**: `parseInt`, `parseFloat`, `Number()`, `String()`, `Boolean()`,
  `isNaN`, `isFinite`, `Number.isInteger / isNaN / isFinite`; `typeof`;
  `console.log / warn / error / info / debug` (prints, space-joined).

### Operators (beyond arithmetic)
- `instanceof`, `in` (object key / array index presence), `delete obj.x`.

### AssemblyScript sized-integer casts
- Cast-call syntax `i8/u8/i16/u16/i32/u32(x)` and `x as T` / `<T>x` perform
  bit-exact two's-complement wraparound (`u8(300) === 44`, `i32(-1) === -1`,
  `u32(-1) === 4294967295`, `i16(40000) === -25536`). `i64/u64` truncate to an
  integer; `f32/f64` pass through (no float32 rounding). See the standards note
  below on *implicit* wraparound.

---

## Standards notes & deliberate divergences

These are the places the interpreter intentionally differs from the ECMAScript /
AssemblyScript spec. They are safe for typical game/UI guest code but worth
knowing.

| Area | Spec (JS/AS) | This interpreter |
|---|---|---|
| Numbers | AS has sized ints (`i32/u8/i64`) with wraparound; JS has doubles | All values are IEEE doubles. **Explicit** casts (`i32(x)`, `x as u8`, bitwise/shift `\| 0`) wrap bit-exactly; **implicit** per-operation wraparound (e.g. an `i32` overflowing on `a + b` without a cast) is not modeled — it needs static type inference. |
| Division by zero | `x/0 = ±Infinity`, `0/0 = NaN` | Guarded to `0` (so `isNaN(0/0)` is false). `NaN` still arises from e.g. `Math.sqrt(-1)`, and `isNaN` detects it. |
| Destructuring default | Fires only when the value is `undefined` | Fires on `undefined` **or** `null` (missing members read as `null` here). |
| Closures | Lexical | Lexical — a captured scope is registered per closure value; a closure created in a hot loop adds one registry entry (not reclaimed), so avoid creating many throwaway closures per frame. |
| `const` | Reassignment is a TypeError | Not enforced (treated like `let`). |
| `Map` keys | Any value, identity/`SameValueZero` | Any value, matched by structural `==` (value equality). |
| Equality | `==` (coercing) vs `===` (strict) differ | Both compare by value; no distinction. |
| `**` | Full float exponent | Integer exponent only (repeated multiply). |
| `Array#sort` default | UTF-16 code-unit order | Char-code string order (same for ASCII). Comparator form is exact. |
| Loops | Unbounded | Hard cap (100k value path / 10k EVG); longer loops are silently truncated. |

### Note on shifts vs. generics

`<<` / `>>` / `>>>` are combined from single `<` / `>` tokens **in the parser**
(`parseShift`), not merged in the lexer, specifically so type-generics like
`Map<string, Array<i32>>` keep parsing. The compound `<<= >>= >>>=` (whose
trailing `=` can never appear in a generic) are tokenized directly. A string
literal whose text equals an operator (e.g. `"-"`, `"++"`) is kept as a
literal — the parser guards operator dispatch on token *type*, not just value.

---

## Still missing / limited (the remaining hard corners)

| Gap | Layer | Notes / workaround |
|---|---|---|
| `Date` / `RegExp` | evaluator | No date or regex types. `replace/replaceAll/split` take string patterns only. |
| `WeakMap` / `WeakSet` / typed arrays (`Int32Array` …) | evaluator | Use `Map`/`Set`/plain arrays. |
| Callback array methods on a **non-array** receiver | evaluator | `map/filter/…` require the receiver to evaluate to an array/Map/Set value. |
| Labeled `break outer` / labeled loops | parser+evaluator | Only unlabeled break/continue. |
| `enum` bodies, `extends` / `super`, `static` members, get/set accessors, `#private` | evaluator (enum/`extends` parse) | Class inheritance and statics are not modeled; `instanceof` has no chain. |
| `flat(depth)` beyond one level, `Array.from/of`, `Map`/`Set` spread | evaluator | Single-level `flat` / explicit constructors only. |
| `Math.log/exp/atan/atan2/asin`-family beyond the list above | evaluator | Only ops with a host builtin are exposed. |
| *Implicit* sized-int wraparound, `const` enforcement | evaluator | See the standards table above. Explicit casts do wrap. |

## Recommended next steps (highest value first)

1. **Static type inference** for `let x: i32` bindings, so integer arithmetic
   wraps implicitly (bit-exact with `asc`) without an explicit cast.
2. **Class inheritance** (`extends`/`super`, an `instanceof` chain) and `static`
   members.
3. **Closure GC** — reclaim `closureScopes` entries for closures that are no
   longer reachable (currently append-only).
4. **`Array.from` / `Map`/`Set` spread** and multi-level `flat(depth)`.
