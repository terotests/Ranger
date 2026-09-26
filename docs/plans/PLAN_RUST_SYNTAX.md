# PLAN_RUST_SYNTAX — Ranger written in Rust syntax, with Rust's move semantics

> **Status: design. Nothing here is implemented.** The string measurements in
> §5 were taken on this checkout; everything else is a decision or a proposal.

Ranger's S-expression syntax is the main source of friction for people and for
agents: almost every entry under "Ranger language gotchas" in `AGENTS.md` is a
parser pitfall (bare vs parenthesised calls, one statement per line,
parenthesised receivers, typed array literal groups, prefix Elvis). This plan
replaces the surface syntax with Rust's, and adopts Rust's **move semantics**
for values. The type checker, the operator system in `Lang.rgr`, the flow
analysis and the twelve writers stay.

The files are not meant to compile with `rustc`. They parse as Rust, so
tree-sitter highlighting and `rustfmt` work on them, but the semantics are
Ranger's: no lifetimes, no full borrow checker, and a `string` with a defined
cross-target meaning.

---

## 1. Decisions

| # | Decision |
| --- | --- |
| D1 | The surface syntax is a subset of Rust's grammar. Ranger-only features use Rust's extension points: attributes, `name!(…)` invocations, `#[cfg(…)]`. |
| D2 | **Rust move semantics.** `let b = a;` moves `a` unless its type is `Copy`; a later read or write of `a` is a compile error. `.clone()` is the explicit copy. |
| D3 | **Second-class references.** `&T` / `&mut T` are allowed on parameters (and locals bound from them), never stored in a field or returned. No lifetimes. |
| D4 | Shared ownership is explicit: `Rc<T>`, `Rc<RefCell<T>>`, `Weak<T>`. |
| D5 | Rust's expression-oriented blocks are supported and lowered for statement-only targets. |
| D6 | The standard-library surface is the Ranger operator set, reached through method or function syntax. It grows over time; Rust std is not the reference. |
| D7 | A `string`'s length and iteration are in **Unicode code points**; bytes are explicit. No O(n) indexing hidden behind `s[i]`. |
| D8 | Both syntaxes coexist during migration, chosen by file extension, and can import each other. |

---

## 2. Syntax

### 2.1 Example

The `ai/QUICKREF.md` file-shape example:

```rust
use other_file;

enum Color { Red, Green, Blue }

#[derive(Clone, Copy)]
struct Point { x: int = 0, y: int = 0 }

struct App {
    items: Vec<string>,
}

impl App {
    fn new() -> App { App { items: vec![] } }

    fn greet(&self, name: string) -> string {
        "hello " + name
    }
}

fn main() {
    print(App::new().greet("world"));
}
```

### 2.2 Mapping

| Ranger today | Rust syntax |
| --- | --- |
| `def x:int 10` | `let x: int = 10;` |
| `def counter@(mutable):int 0` | `let mut counter = 0;` |
| `def maybe@(optional):string` | `let maybe: Option<string>;` |
| `if (!null? x) { … }` | `if let Some(x) = x { … }`; `if x.is_some()` narrows too |
| `(?? v fallback)` | `v.unwrap_or(fallback)` |
| `(? c a b)` | `if c { a } else { b }` |
| `fn` / `sfn` | method with / without a `self` parameter |
| `Constructor (…)`, `new Foo(x)` | `fn new(…) -> Foo`, `Foo::new(x)`; struct literal `Foo { x: 1 }` |
| `record Point { … }` | `struct Point { … }` (`#[derive(Copy)]` to make it `Copy`) |
| `Extends(Base)` | `#[extends(Base)] struct Foo` (§2.4) |
| `class History @params(Op)` | `struct History<Op>`; bounds are accepted and ignored |
| trait / `does` | `trait` / `impl Trait for X` |
| `shape` / `case` / `match` | `enum` with struct variants / `match` |
| `Enum Color ( … )` | `enum Color { … }` |
| `switch v { case … }` | `match v { … }` |
| `for list item:T i { }` | `for (i, item) in list.iter().enumerate() { }`, `for item in list { }` |
| `while`, `break`, `continue`, `return` | same |
| `(idiv a b)` / `(a / b)` | `a / b`, integer or real division by the operand types |
| `push arr x` | `arr.push(x)` or `push(arr, x)` (§6) |
| `[T]`, `[K:V]` | `Vec<T>`, `Map<K, V>` |
| lambdas `fn:T (p:T)` | closures `\|p: T\| -> T { … }`, type `Fn(T) -> T` |
| `try { } { }` / `throw` | open question, §9 |
| `Import "x.rgr"`, `pkg:evg/X.rgr` | `mod x;` / `use evg::X;` |
| `@(weak)`, `@(late)`, `@serialize` | `#[weak]`, `#[late]`, `#[derive(Serialize)]` |
| `if_rust { … }` | `#[cfg(target = "rust")] { … }` |
| `doc { public since "1.2" example f }` | `///` text + `#[doc(public, since = "1.2", example = f)]` |
| `(tree Name (Tag …))` | `tree! { Name { Tag { … } } }` |

Types keep Ranger's names (`int`, `double`, `string`, `boolean`, `char`,
`charbuffer`); the grammar only sees paths. `i64` / `f64` / `bool` / `String`
can be accepted as aliases.

`x: int = 0` in a struct is the default-field-values syntax, which newer Rust
grammar accepts. If the formatter or highlighter in use rejects it, the
fallback is `#[default(0)] x: int`.

### 2.3 Extension points

| Rust mechanism | Used for |
| --- | --- |
| `#[attr]` on items and fields | `extends`, `weak`, `late`, `serialize`, `doc(…)`, `main` |
| `#[cfg(target = "…")]` on items, statements, blocks | today's `if_rust` / per-target code |
| `name! { … }` / `name!( … )` | `tree!`, `native!` (a verbatim target snippet), later additions |

A `name!` body is any balanced token tree, so a new construct never needs a
grammar change.

### 2.4 Inheritance

Rust has no inheritance; the gallery uses it. `#[extends(Base)]` keeps
`Extends` with today's meaning: fields and methods of `Base` are inherited,
`impl` blocks override. New code should prefer traits.

---

## 3. Moves (D2)

### 3.1 Rules

The move checker is a per-variable state carried through the same
statement-by-statement flow pass that already does optional narrowing
(`setFlowNarrowed` in `RangerAppWriterContext.rgr`, driven from
`RangerFlowParser.rgr` / `FlowStdMatch.rgr`).

| Situation | Result |
| --- | --- |
| `let b = a;`, `x = a;`, `f(a)` with a `T` parameter, `a` returned, `a` pushed into a collection | `a` is **moved** |
| read or write of a moved variable | error, pointing at the move |
| `a = <value>` | `a` is live again |
| moved in one branch of an `if` / `match` only | **maybe-moved** after the join; any use is an error |
| moved inside a loop body and not reassigned before the end of the body | error at the move |
| `let b = self.x;` / `let b = obj.field;` on a non-`Copy` type | error; use `take(&mut self.x)`, `replace(&mut self.x, v)`, or `.clone()` |
| `move \|…\| { … }` | captured variables are moved |
| `self` parameter by value (`fn into_x(self)`) | receiver is moved |
| `Copy` types: `int`, `double`, `boolean`, `char`, data-less enums, `#[derive(Copy)]` structs | never moved |

The existing flow pass already joins branch states and understands branches
that exit (`return`, `break`, `continue`, `throw`), which is exactly what the
maybe-moved join needs.

### 3.2 References (D3)

- `&T` and `&mut T` may appear on parameters, and on locals initialised from a
  parameter or from `&x` / `&mut x`.
- A reference may not be stored in a field, captured by a closure that
  escapes, put into a collection, or returned.
- At every call: no `&mut` argument may overlap another argument's path.
  `self` counts as an argument, so `self.f(&mut self.x)` is refused when `f`
  takes `&self` or `&mut self`.
- A variable may not be moved or assigned while a reference to it is live in
  the same function.

These restrictions make lifetime inference unnecessary. It is the model of
Swift's `inout`, Mojo and Hylo.

### 3.3 Shared ownership (D4)

Graph-shaped data (parent pointers, observers, caches) uses `Rc<T>` for shared
immutable, `Rc<RefCell<T>>` for shared mutable, `Weak<T>` for back-pointers.
`.borrow()` / `.borrow_mut()` are operators; the Rust target emits them as is,
the other targets drop them.

### 3.4 Lowering per target

| Target group | Move | `.clone()` | `&T` / `&mut T` | `Rc<RefCell<T>>` | `Weak<T>` |
| --- | --- | --- | --- | --- | --- |
| JS/TS, Python, Java, Kotlin, C#, Dart, Scala, PHP, Go, Swift | plain assignment (source is dead) | generated deep copy | the reference itself (Go: pointer for `&mut` on value types) | the reference | today's `@(weak)` lowering |
| C++ | `std::move` | copy constructor | `const T&` / `T&` | `std::shared_ptr<T>` | `std::weak_ptr<T>` |
| Rust | as written | as written | as written | as written | as written |
| LLVM | ownership transfer, no refcount | deep copy | borrowed pointer | refcounted | weak |

On the reference targets, a move being a plain assignment is sound because the
checker proved the source is never used again: the aliasing a reference target
would create is never observable. Explicit `.clone()` needs a generated
`clone` method per class, which the Rust and C++ writers partly have already.

For the Rust writer this removes most of the work described in
`RUST_ISSUES.md`, `PLAN_RUST_OWNERSHIP.md` and `PLAN_CODEGEN_OWNERSHIP.md`:
ownership is read from the source instead of inferred. The `-rust-shared-classes`
analysis stays for code in the old syntax.

---

## 4. Expression-oriented blocks (D5)

Rust allows a block, `if`, `match` or `loop` as an expression, and a block's
last expression without `;` as its value (including a function body's return
value).

A lowering pass runs after parsing and before the flow pass:

```rust
let v = if c { a } else { let t = f(); t + 1 };
```

becomes, for every target that lacks block expressions:

```text
def v:T
if c { v = a } { def t (f()) ; v = (t + 1) }
```

`break value` from `loop` lowers the same way. A function whose body ends in an
expression gets an explicit `return`. Targets that have expression forms
(Rust, Kotlin, Scala, Swift for `if`) may keep them later as an idiom pass;
the first version lowers everywhere except Rust.

---

## 5. Strings (D7)

### 5.1 What happens today

Measured on this checkout for `"aé😀b"` (4 code points, 5 UTF-16 units,
8 UTF-8 bytes):

| | ES6 | Python | Rust | Go | C++ |
| --- | --- | --- | --- | --- | --- |
| `strlen s` | 5 | 4 | 8 | 8 | 8 |
| `charAt s 1` | 233 | 233 | 195 | 195 | 195 |
| `substring s 1 2` | `é` | `é` | `é` | half of `é` | half of `é` |
| `to_chars s` (length) | 4 | 4 | 4 | 4 | 4 |
| `to_charbuffer s` (length) | 8 | 8 | 8 | 8 | 8 |

`strlen` / `charAt` / `substring` count the target's native unit
(PLAN_STRING_INDEXING.md, `SPEC_SEMANTICS.md` §3.1). That was chosen to keep
scanners O(1) per step; the cost is that a non-ASCII string means different
things on different targets.

### 5.2 The rule in the new syntax

| Syntax | Meaning | Cost everywhere |
| --- | --- | --- |
| `for c in s.chars()` | code points | O(1) per step |
| `s.chars().count()` | length in code points | O(n) |
| `s.chars().collect::<Vec<char>>()`, `to_chars(s)` | code points, random access | O(n) once, then O(1) |
| `s.bytes()`, `s.as_bytes()` | UTF-8 bytes (`charbuffer`) | O(1) index |
| `s.as_bytes().len()` | length in UTF-8 bytes | O(1) on UTF-8 targets, O(n) on UTF-16 ones |
| `s.find(p)` | code-point index of `p` (or `None`) | O(n) |
| `s.slice(a, b)` | code points `[a, b)` | O(n) |
| `s.len()` | **refused**: a Rust reader expects bytes, a Ranger reader characters | — |
| `s[i]` | **refused**, as in Rust | — |

Every text operation then means code points on every target, the byte view is
explicit, and nothing looks O(1) while being O(n): a loop that needs random
access says so with `to_chars`.

The per-target work is the `chars()` iterator: `for (const c of s)` on JS,
`s.codePoints()` on Java/Kotlin/Scala, `EnumerateRunes()` on C#, `runes` on
Dart, `unicodeScalars` on Swift, `range` over a Go string, a UTF-8 decoder on
C++, `mb_str_split` on PHP. The `to_chars` templates already contain most of
these.

### 5.3 The old syntax

`charAt` / `substring` / `strlen` on a `string` keep their native-unit meaning
in `.rgr` files until the compiler's own scanners, the JSON and XML parsers and
`lib/evg` are moved to iteration or `to_chars` (`-strict-strings` lists the
sites). After that, PLAN_STRING_INDEXING §4.4 can be closed by removing
string indexing from the portable surface.

---

## 6. Standard-library surface (D6)

A method or function call resolves in this order:

1. A method of the receiver's class or trait.
2. A Ranger operator whose name matches, with the receiver as the first
   argument: `arr.push(x)` → `(push arr x)`, `s.trim()` → `(trim s)`.
3. A rename table from Rust spelling to Ranger operator name, kept next to the
   parser: `len` on `Vec` → `array_length`, `is_empty` → `array_length == 0`,
   `contains_key` → `has`, `unwrap_or` → `??`, `to_string` → `to_string`, …

Operator matching stays type-directed, as it is now, so `push` on a `Vec` and
on a `charbuffer` pick different templates. Anything not found is an ordinary
"no such method" error listing the nearest operators. The table grows as code
needs it.

Iterator chains (`map`, `filter`, `sum`, `collect`) are not in the first
version. They lower to loops later, in the §4 pass.

---

## 7. Implementation

### 7.1 Parser

`compiler/RangerRustParser.rgr` beside `RangerLispParser.rgr` (2 147 lines):
a tokenizer for Rust tokens (including raw strings, lifetimes rejected, `///`
doc comments kept) and a precedence-climbing parser for items, statements,
expressions, patterns and types. It produces **the same CodeNode tree** the
Lisp parser does, so everything after parsing is shared. Estimated 3 000 –
5 000 lines.

Source positions must map to the Rust-syntax file so errors point at it.

### 7.2 Passes added

| Pass | Where | Section |
| --- | --- | --- |
| block-expression lowering | after parsing, before the flow pass | §4 |
| move state (moved / maybe-moved / live) | in the flow pass, beside narrowing | §3.1 |
| reference escape and call-site overlap check | in the flow pass | §3.2 |
| method → operator resolution and rename table | in call matching | §6 |
| `clone` generation per class | in the writers that lack it | §3.4 |

Moves and references only apply to files in the new syntax (D8); old-syntax
files keep reference semantics.

### 7.3 Interop between the two syntaxes

A new-syntax function calling an old-syntax one passes a value into a world
with reference semantics. The old function's parameter ownership, from the
existing inference (`-strict-ownership`: borrowed / moved / shared / owned),
decides what the call means:

| Old parameter | Treated as |
| --- | --- |
| borrowed | `&T` |
| moved, owned | `T` (the argument is moved) |
| shared | `Rc<RefCell<T>>` is required |
| unknown | `T` (moved), conservative |

---

## 8. Migration

1. **Converter.** A writer that emits the new syntax, modelled on
   `RangerRangerClassWriter.rgr` (the Ranger-to-Ranger writer, 370 lines) and
   the Rust writer. It uses the ownership inference to choose between
   `&T`, `T` and `Rc<RefCell<T>>` for each parameter and field; what it cannot
   classify becomes `Rc<RefCell<T>>` with a `// review:` comment.
2. **Verification.** For every converted file, both versions compile to every
   target and the outputs are diffed; the test suite and the selfhost parity
   checks run on the converted tree.
3. **Order.** `tests/` fixtures, then `lib/`, then `gallery/`, then the
   compiler.
4. **Self-hosting.** `RangerRustParser.rgr` is written in the old syntax. When
   the compiler converts and passes `npm run selfhost:check:*`, it is switched
   over; `dist/rgrc.js` remains the bootstrap.
5. `Lang.rgr` stays in S-expressions: it is template data, not user code.

---

## 9. Stages

| Stage | Content | Done when |
| --- | --- | --- |
| R0 | Parser for items, `let`, operators with precedence, calls, `if` / `while` / `for` / `match`, structs, impls, enums | `tests/fixtures` programs written by hand in the new syntax give the same output as their `.rgr` versions on es6, rust, go, python, cpp |
| R1 | Block-expression lowering | an expression-heavy fixture runs on all targets |
| R2 | Move checker | positive and negative fixtures for every row of §3.1 |
| R3 | References and call-site overlap check | fixtures for §3.2, including `self` overlap |
| R4 | Strings per §5.2 | the §5.1 table gives 4 / code points on every target in the new syntax |
| R5 | Attributes and macros: `extends`, `weak`, `late`, `serialize`, `doc`, `cfg`, `tree!`, `native!` | the gallery feature set is expressible |
| R6 | Converter and interop | `lib/` converted and passing |
| R7 | Gallery, then compiler | selfhost parity on the converted compiler |

---

## 10. Open questions

- **File extension.** `.rgs` is proposed; `.rs` would make editors run
  rust-analyzer, which reports errors on code that is not valid Rust.
- **Errors.** `try` / `catch` is not Rust grammar. Either `Result<T, E>` with
  `?`, lowered to exceptions on targets that have them, or `try! { … }
  catch!(e) { … }`. `Result` fits the rest of the design better.
- **Integer types.** `int` is 64-bit today. Accept `i32` / `u8` / `usize`, or
  only `int` and `double`? `u8` is useful for `charbuffer` work.
- **Inheritance.** Keep `#[extends]` permanently, or only for migrated code.
- **Records and `Copy`.** Should a `record` be `Copy` by default?
- **Tooling.** A tree-sitter grammar for the subset gives highlighting; a
  language server can come from the existing VS Code extension.
