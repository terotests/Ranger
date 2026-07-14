# Interpreted `.as` / `.tsx` language coverage

What the live interpreter (`ComponentEngine`, `gallery/pdf_writer/src/jsx/ComponentEngine.rgr`,
via [`AS_SOURCE_ENGINE.md`](./AS_SOURCE_ENGINE.md)) supports when it runs a `.as` / `*.game.tsx`
script — so a guest author knows what to rely on. A `.as` source is meant to run both here
(interpreted, for fast start / hot reload) and through `asc` (compiled to WASM). Type
annotations parse and are ignored at runtime.

Self-check fixtures live in `../tests/interp/` (run from `tests/tsx-engine.test.ts`); their
`*_demo.rgr` runners print `ALL PASS`.

## Supported

- **Operators**: `+ - * / %`, string `+`; bitwise `& | ^ ~`, shifts `<< >> >>>`; exponent
  `**` (integer exponent); `< > <= >=`, `== === != !==` (all by value); `&& || ?? ! typeof
  void`; ternary `?:`; optional chaining `?.`; `x as T` / `<T>x` / `x!` (type ignored).
- **Assignment**: `=` and every compound (`+= … **=`, `&= <<= …`, `&&= ||= ??=`) on
  identifier, index (`a[i]`), and member (`o.x`) targets; `++`/`--` prefix/postfix with
  correct value semantics.
- **Literals**: decimal/float, hex `0x` / binary `0b` / octal `0o`, digit separators `1_000`;
  strings with `\n \t \r \\` escapes, template literals `${…}`, `null`, arrays, objects.
  (No exponent literals — `1e3` lexes as `1` + `e3`; write `1000`. No BigInt `123n`.)
- **Control flow**: `if/else`, `while`, `do…while`, C-style `for`, `for…of` (arrays, `Set`,
  `Map`, string chars; destructuring loop var), `for…in`, `switch/case/default` (fall-through);
  unlabeled `break`/`continue`; `return` propagates out of nested blocks/loops/switch.
- **Functions & classes**: declarations, recursion, functions as values, arrow callbacks,
  **lexical closures**; default / rest / destructured parameters; `new C()`, fields, methods,
  `this`, method chaining, bound-method callbacks, `instanceof` (direct tag, no inheritance).
- **Destructuring & spread**: `const [a,...rest] = arr`, `const {x, y: a, z = 1, ...rest} =
  obj` (nested); array/call/object spread.
- **Stdlib**: full `String` and `Array` method sets (incl. `map/filter/forEach/reduce/find/
  some/every`, `splice/sort/reverse/fill`), `Map`, `Set`, `Object.keys/values/entries/assign`,
  `JSON.stringify/parse`, `parseInt/parseFloat/Number/String/Boolean/isNaN/isFinite`,
  `console.log/warn/error`. `Math`: `round floor ceil abs sin cos tan sqrt sign trunc min max
  pow hypot`, `PI`/`E`.
- **AssemblyScript sized-int casts**: `i8/u8/i16/u16/i32/u32(x)` (and `x as T`) wrap bit-exactly
  (`u8(300)===44`, `u32(-1)===4294967295`); `i64/u64` truncate; `f32/f64` pass through.

## Deliberate divergences from the spec

Safe for typical game/UI code, but worth knowing:

| Area | This interpreter |
|------|------------------|
| Numbers | All values are IEEE doubles. **Explicit** casts / bitwise wrap bit-exactly; **implicit** per-op sized-int wraparound is not modeled (needs type inference). |
| Division by zero | Guarded to `0` (so `isNaN(0/0)` is false); `NaN` still arises from e.g. `Math.sqrt(-1)`. |
| Equality | `==` and `===` both compare by value; no coercion distinction. |
| `**` | Integer exponent only (repeated multiply). |
| `const` | Reassignment not enforced (treated like `let`). |
| `Map` keys | Matched by `==` value-equality — primitive keys only; object/array keys never match. Insertion order preserved. |
| Destructuring default | Fires on `undefined` **or** `null`. |
| Loops | Hard cap (100k value path / 10k EVG); longer loops are silently truncated. |

## Not supported

| Gap | Notes / workaround |
|-----|--------------------|
| `Date`, `RegExp` | `replace/replaceAll/split` take string patterns only. |
| `WeakMap`/`WeakSet`, typed arrays (`Int32Array`…) | Use `Map`/`Set`/plain arrays. |
| Labeled `break outer` | Unlabeled break/continue only. |
| `enum` bodies, `extends`/`super`, `static`, get/set, `#private` | Inheritance and statics unmodeled; `instanceof` has no chain. |
| `Array.from/of`, `flat(depth>1)`, `Map`/`Set` spread | Single-level `flat` / explicit constructors only. |
| `Math.log/exp/atan/atan2/asin`-family, `Math.random` | Only the `Math` builtins listed above; no randomness (determinism). |
| `type`/keyword as a binding name, unbraced `if`/expr loop bodies | See [`TSX_ENGINE_ISSUES.md`](./TSX_ENGINE_ISSUES.md). |
