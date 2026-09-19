# JavaScript — can Ranger write idiomatic JavaScript?

The same nine programs as [`../src/`](../src/) compiled with `-l=es6`,
then `node`. Snapshots are in [`generated/`](generated/). TypeScript is
the same writer plus `-typescript` (annotations and `export`); there is
no `tsc` on this machine, so that flag is not a separate study.

```bash
bash gallery/friendly/javascript/compile.sh
```

The JavaScript I wanted is modern Node: ESM, `class` with fields,
`??` / optional chaining, `undefined` or `null` used on purpose, and
`throw` / `try` / `catch` that a package would keep.

## Verdict

**I could write Ranger that `node` accepts and that prints the right
answers** for every study. This is the compiler's own target. Sharing is
ordinary object identity. `[]` / `.push` / `console.log` are the JS
those names already mean. `try`/`throw` **runs**: `throw "negative"` is
legal JavaScript and the catch reads the string (`after_bad negative`).

**I could not write idiomatic 2024 JavaScript.** Optional is
`undefined` tested with `typeof(x) === "undefined"`, not `x ?? fallback`
or `x == null`. A `shape` is two classes plus `__rg_kind` string tags.
A Ranger `Enum` is a number. A Ranger `trait` is a mixin. Constructors
assign defaults and then overwrite them. Entry is `function __js_main()`
plus a call, not ESM `main`. There is no `Result`.

## How to write Ranger today if the JavaScript output matters

| Wanted JavaScript | Write this Ranger | What comes out |
| --- | --- | --- |
| `class Point { constructor(x, y) { this.x = x } }` | `record Point` | class that zeros fields, then assigns |
| `x ?? "unknown"` | `@(optional)`, `(?? x "u")` | `typeof(x) !== "undefined" && x != null ? x : "u"` |
| `throw new Error("…")` | `try` / `throw` | **works** — `throw "…"` / `catch(e)` |
| tagged union / `switch` | `shape` + `match` | `__rg_kind === "Case"` |
| `const Color = { red: 0 }` | `Enum Color` | a number |
| a shared prototype / mixin | `trait` | copied methods |
| `xs.reduce` / `map` | a `for` that `push`es | C-style index loop |
| `function f(p) { return p + 1 }` | `f:(fn:int (p:int))` | a function value |

`try`/`throw` is an acceptable JavaScript spelling, same class as
Python and Dart. A shape is still better if the same source must run on
Rust / Swift / Kotlin. `@(weak)` is ignored.

---

## The studies

### 01 — classes, sharing, undefined

`alias = left` shares. `parent` is `undefined` until `adopt`. The empty
test is `typeof(leaf.parent) === "undefined"`. A human writes
`if (!leaf.parent)`.

### 02 — optionals and Result

`findName` leaves `found` unbound and returns `undefined` on a miss.
`??` is the `typeof` / `!= null` ternary. `ParseOutcome` is two classes
with `__rg_kind`. Not a `Result`, not a discriminated union the type
checker can see.

### 03 — enums and match

`Color` is a number. `Message` is `__rg_kind` classes.

### 04 — traits

Mixin. `show(who)` cannot take a `Bot`.

### 05 — iteration

Index `for` + `.push`. The lambda is an ordinary function.

### 06 — generics

`Stack_int` / `Stack_string`. No `class Stack`.

### 07 — strings and arrays

`greet(name)`, `xs` is an array. Fine, not `xs.at(0)` / template strings
written by hand.

### 08 — builder

`return this` is the JS fluent style on a class.

### 09 — errors

The shape path runs. The throw attempt **runs**.

## What I could not write

ESM, `??` / `?.`, `Result` / typed unions, `enum`, a real prototype
interface, iterators, `async`/`await`, `toString` as `toString`.

## How the language could improve (for JavaScript)

1. `??` → `??` (and `== null` when both `null` and `undefined` matter).
2. `shape` → a tagged object a `switch` can see, or a real union in the
   TypeScript mode.
3. `Enum` → a frozen object or a TypeScript `enum`.
4. Field-free `trait` → a documented method set, not a copy.
5. Keep `@params` as one class.
6. ESM entry (`export` / no `__js_main` name) when `-nodecli` is off.
