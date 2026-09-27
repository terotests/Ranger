# PLAN_RUST_SYNTAX — strict Rust modules beside `.rgr` modules

> **Status: stages R0–R4 done (§9.1, §9.2): `rgrc file.rs` compiles a strict
> module, its output equals the rustc build's on es6, python, go and cpp, move
> and borrow errors are reported, and the `ranger` prelude crate exists. R5
> onwards is design.** Measurements in §5 and the rustc checks in §2 were run
> on this checkout with rustc 1.94.1.

Ranger gets a second source form: **`.rs` files that are valid Rust**. They
compile with `rustc` / `cargo` against a small `ranger` prelude crate, so the
real borrow checker validates them and the native Rust build is the reference
output. Ranger reads the same files and writes C++, JavaScript, Go and the
other targets from them.

`.rgr` files stay as they are: S-expression syntax, reference semantics, the
easy imperative form. A program may mix both: strict modules where ownership
matters, `.rgr` modules for everything else.

---

## 1. Decisions

| # | Decision |
| --- | --- |
| D1 | Two source forms, chosen by **file extension**: `.rgr` (old syntax, reference semantics) and `.rs` (strict Rust). |
| D2 | A `.rs` module must compile with `rustc` against the `ranger` prelude crate. Ranger accepts a **subset** of Rust (§3.4); what it accepts means what Rust means. |
| D3 | Rust move semantics and borrowing, **checked by rustc**. Ranger adds its own cheap move check so errors appear without a Rust toolchain; rustc stays the authority (`cargo check` in CI). |
| D4 | References are not stored in structs (no lifetime parameters on types). Shared data is `Rc<T>` / `Rc<RefCell<T>>` / `Weak<T>`. |
| D5 | Rust's expression-oriented blocks are lowered for statement-only targets. |
| D6 | Ranger-only information uses `#[ranger::…]` attributes from the prelude crate; `#[cfg_attr(ranger, …)]` is the zero-dependency fallback. |
| D7 | Strings follow Rust: `chars()` is code points, bytes are explicit. `s.len()` is refused by Ranger's subset so that length is always written as the unit it counts. |
| D8 | Every target's output must match the native Rust run. Anything whose Rust behaviour a target cannot reproduce (map order, overflow) is fixed in the prelude or in the spec. |

The earlier idea of a third form (Rust syntax with Ranger semantics, not
accepted by rustc) is dropped: it would be a language nobody's tools check.

---

## 2. Files, markers and imports

### 2.1 Telling the forms apart

The extension decides. rustc accepts any extension (`#[path = "x.rug"] mod x;`
compiles), but rust-analyzer, rustfmt and editors only treat `.rs` as Rust,
and that tooling is half the point, so strict modules are `.rs`.

A strict module starts with `use ranger::prelude::*;`. It is needed anyway (it
brings `int`, `string`, `Map` and the operators into scope), and it doubles as
the marker: a `.rs` file reached from a Ranger import without it gets a clear
error instead of a stream of unknown-name errors.

Checked with rustc 1.94.1:

| Marker | Result |
| --- | --- |
| `#![ranger]` | error: cannot find attribute `ranger` |
| `#![register_tool(ranger)]` | error E0658: experimental (nightly only) |
| `#[cfg_attr(ranger, weak)]` on a field | compiles; rustc drops it. Cargo's check-cfg warns unless `Cargo.toml` declares `check-cfg = ['cfg(ranger)']` |
| `#[ranger::weak]` | compiles once the prelude crate exports an attribute macro that returns its input unchanged |
| `use ranger::prelude::*;` | ordinary Rust |

### 2.2 Imports

| From → to | How |
| --- | --- |
| `.rs` → `.rs` | Rust's own rules. `mod geometry;` loads `geometry.rs` or `geometry/mod.rs` relative to the declaring file; `use crate::geometry::Point;` resolves names; `pub` is visibility, enforced by rustc. |
| `.rs` → `.rgr` | `mod legacy { ranger::import_rgr!("legacy"); }`. For rustc the macro expands to `include!(concat!(env!("OUT_DIR"), "/legacy.rs"))`, and `build.rs` runs `rgrc -l=rust` on `legacy.rgr` into `OUT_DIR`. Ranger reads the invocation as `Import "legacy.rgr"`. (The expansion was tested with a stand-in generated file.) |
| `.rgr` → `.rs` | `Import "geometry.rs"`; the extension picks the parser. |
| packages | `pkg:evg` is a Cargo path dependency; `use evg::EVGElement;`. `Cargo.toml` is the manifest for `.rs` code, `ranger.json` for `.rgr`, both naming the same directories. |

```
myapp/
  Cargo.toml        [dependencies] ranger = { path = "…/runtime/rust/ranger" }, evg = { path = … }
  build.rs          only if .rgr modules are imported
  src/main.rs       use ranger::prelude::*; mod geometry; mod legacy { ranger::import_rgr!("legacy"); }
  src/geometry.rs   strict Rust
  src/legacy.rgr    old syntax
```

`import_rgr!` needs one new compiler output: a **Rust module** — no `fn main`,
`pub` items, no crate-level attributes — instead of today's whole-program file.

### 2.3 The boundary between the forms

A `.rgr` class has reference semantics, so strict code always sees it as a
handle, `Rc<RefCell<T>>`, never a plain struct, regardless of what the Rust
backend's sharing analysis would choose inside the `.rgr` module. The module
output of §2.2 exposes exactly that.

In the other direction a `.rgr` function calling into `.rs` code follows the
`.rs` signature: `&T` / `&mut T` parameters are borrows, `T` parameters take
the value, and Ranger checks that the `.rgr` caller does not use a moved value
afterwards (the existing ownership inference, `-strict-ownership`, already
classifies the `.rgr` side).

---

## 3. What a strict module looks like

### 3.1 Example

```rust
use ranger::prelude::*;

#[derive(Clone, Copy, PartialEq)]
enum Color { Red, Green, Blue }

#[derive(Clone, Copy, Default)]
struct Point { x: int, y: int }

struct App {
    items: Vec<string>,
}

impl App {
    fn new() -> App { App { items: vec![] } }

    fn greet(&self, name: &str) -> string {
        format!("hello {}", name)
    }
}

fn main() {
    let app = App::new();
    println!("{}", app.greet("world"));
}
```

### 3.2 The prelude crate `ranger`

- `type int = i64; type double = f64; type string = String; type boolean = bool;`
  (the old names keep reading naturally; `i64` etc. are equally accepted).
- `Map<K, V>`: an **insertion-ordered** map. Rust's `HashMap` iterates in a
  random order — two runs of the same six inserts printed `b d e a c f` and
  `e f c b d a` — while JavaScript and Python iterate in insertion order.
- The Ranger operators as Rust functions and extension traits, generated from
  the `rust` templates in `compiler/Lang.rgr`.
- Attribute macros that return their input unchanged: `weak`, `late`,
  `serialize`, `doc`, `target`.
- `import_rgr!`, `tree!`, `native!`.

### 3.3 Mapping from the old syntax

| `.rgr` | `.rs` |
| --- | --- |
| `def x:int 10` / `def x@(mutable):int 10` | `let x: int = 10;` / `let mut x = 10;` |
| `def maybe@(optional):string` | `let maybe: Option<string> = None;` |
| `if (!null? x) { … }` | `if let Some(x) = &x { … }` |
| `(?? v fallback)` | `v.unwrap_or(fallback)` |
| `(? c a b)` | `if c { a } else { b }` |
| `fn` / `sfn` | method with / without `self` |
| `Constructor`, `new Foo(x)` | `fn new(…) -> Foo`, `Foo::new(x)`, `Foo { x: 1 }` |
| `record` | `#[derive(Clone)] struct` (`Copy` when all fields are) |
| `Extends(Base)` | not available in `.rs`: a Rust attribute macro sees only its own item, not `Base`'s fields. Traits and composition; inheritance stays in `.rgr`. |
| `@params(T)` | `struct History<T>`; the bounds rustc needs are ignored by Ranger |
| trait / `does` | `trait` / `impl Trait for X` |
| `shape` / `case` / `match` | `enum` with data / `match` |
| `switch` | `match` |
| `for list item:T i` | `for (i, item) in list.iter().enumerate()` |
| `(idiv a b)` / `(a / b)` | `a / b`, by the operand types |
| `push arr x` | `arr.push(x)` |
| `[T]`, `[K:V]` | `Vec<T>`, `Map<K, V>` |
| lambdas | closures; `Box<dyn Fn(T) -> U>` as a stored type |
| `try` / `throw` | `Result<T, E>` and `?`, lowered to exceptions where the target has them |
| `print x` | `println!("{}", x)`; Ranger understands `format!` / `println!` with `{}` and `{:?}` |
| `@(weak)` | `Weak<T>` in the type (plus `#[ranger::weak]` only where the intent is not visible in the type) |
| `@(late)` | `#[ranger::late]` on an `Option` field |
| `@serialize` | `#[ranger::serialize]` |
| `if_rust { … }` | `#[ranger::target(rust)] { … }` / `ranger::native!` |
| `doc { … }` | rustdoc, §4 |

### 3.4 The subset

Ranger refuses, with a message naming the alternative:

- lifetime parameters on types (`struct V<'a>`) and references stored in
  struct fields; lifetimes on functions (`fn f<'a>(x: &'a str) -> &'a str`)
  are accepted and ignored
- `unsafe`, raw pointers, `asm!`, `extern` blocks
- `impl Trait` in argument position, associated types, GATs, trait objects
  other than `dyn Fn…` and `dyn Trait` behind `Box` / `Rc`
- iterator chains (`map` / `filter` / `collect` …) until the §6 lowering has
  them; `iter()`, `iter_mut()`, `enumerate()`, `chars()`, `bytes()` in a `for`
  are accepted from the start
- `s.len()` on a string (D7)
- macros other than the known ones (`println!`, `print!`, `format!`, `vec!`,
  `panic!`, `assert!`, `assert_eq!`, the prelude's)

Anything else rustc accepts and Ranger has no lowering for is reported as
"not in the Ranger subset", never silently translated.

### 3.5 Integer overflow

Rust panics on overflow in debug builds and wraps in release builds. D8 needs
one answer; the proposal is **wrapping**, written into `SPEC_SEMANTICS.md` §2.3,
and `overflow-checks = false` in the example `Cargo.toml` so debug builds agree.

---

## 4. Documentation

The `doc { … }` tail (`compiler/RangerDocBlock.rgr`, PLAN_API_DOCS.md) has a
direct rustdoc idiom for almost every entry, and PLAN_API_DOCS §8 already
writes those forms when the output is Rust. Reading `.rs`, the same mapping
runs backwards:

| `doc` entry | rustdoc idiom read from `.rs` |
| --- | --- |
| `description` | the `///` text before the first `#` heading (Markdown kept as is) |
| `param id "…"` | `# Parameters` or `# Arguments` section, `` * `id` - text `` bullets |
| `returns "…"` | `# Returns` section |
| `throws` | `# Errors` section (and `# Panics`) |
| `see Node` | intra-doc links ``[`Node`]`` anywhere in the text |
| `example f` | `# Examples` section: each ```` ``` ```` block is a **doctest**, which `cargo test` compiles and runs, and Ranger parses as an example body and type-checks, as it does for `example f` today |
| `example "literal"` | a ```` ```text ```` block |
| `deprecated { since use description }` | `#[deprecated(since = "2.0", note = "…")]` (built into Rust); `use` → `#[ranger::doc(replaced_by = "find")]` |
| `public` | `pub` on the item (and reachable from the crate root) |
| `internal` | not `pub`, or `pub(crate)`; `#[doc(hidden)]` for `pub` items kept out of the docs |
| `experimental` | `# Stability` section, or `#[ranger::doc(experimental)]` |
| `since "1.2"` | `#[ranger::doc(since = "1.2")]` — rustdoc has no stable `since` for user crates |
| `category`, `platform` | `#[ranger::doc(category = "…", platform = "…")]` |
| `target <lang> { … }` views, `attr` | `#[ranger::doc(target = "kotlin", …)]`; rare, later |
| module / crate docs | `//!` |

The rule: rustdoc Markdown carries the prose, rustdoc's standard section
headings and Rust's own `#[deprecated]` carry what they can, and
`#[ranger::doc(…)]` carries only what Rust has no idiom for. `cargo doc`
therefore renders a strict module correctly with no Ranger tool involved.

---

## 5. Strings

Today a `.rgr` `string` is indexed in the target's own unit
(`SPEC_SEMANTICS.md` §3.1). Measured for `"aé😀b"` (4 code points, 5 UTF-16
units, 8 UTF-8 bytes):

| | ES6 | Python | Rust | Go | C++ |
| --- | --- | --- | --- | --- | --- |
| `strlen s` | 5 | 4 | 8 | 8 | 8 |
| `charAt s 1` | 233 | 233 | 195 | 195 | 195 |
| `substring s 1 2` | `é` | `é` | `é` | half of `é` | half of `é` |
| `to_chars s` (length) | 4 | 4 | 4 | 4 | 4 |
| `to_charbuffer s` (length) | 8 | 8 | 8 | 8 | 8 |

In a strict module strings mean what Rust says, and every target reproduces it:

| Rust | Meaning | Cost on every target |
| --- | --- | --- |
| `for c in s.chars()` | code points | O(1) per step |
| `s.chars().count()` | length in code points | O(n) |
| `s.chars().collect::<Vec<char>>()` | code points with random access | O(n) once |
| `s.bytes()`, `s.as_bytes()`, `s.as_bytes().len()` | UTF-8 bytes | O(1) on UTF-8 targets |
| `s.find(p)`, `&s[a..b]` | **byte** offsets, as in Rust; slicing off a char boundary panics | O(n) on UTF-16 targets |
| `s.len()` | refused by the subset (D7) | — |
| `s[i]` | not Rust | — |

Byte offsets from `find` feeding a slice are consistent with each other, which
is the property whose absence cut text on Go and C++ (the `substring` row
above). The UTF-16 targets need a byte-offset helper in their runtime; a
program that only iterates never pays for it.

---

## 6. Expression-oriented blocks

A block, `if`, `match` or `loop` can be an expression, and a block's last
expression without `;` is its value. A lowering pass after parsing hoists them
into a temporary for targets without block expressions:

```rust
let v = if c { a } else { let t = f(); t + 1 };
```

```text
def v:T
if c { v = a } { def t (f()) ; v = (t + 1) }
```

`break value` from `loop` and a function body ending in an expression lower the
same way. The same pass later turns the accepted iterator chains into loops.

---

## 7. Moves and borrows on the other targets

rustc has proved the program; the writers only need the lowering.

| Target group | Move | `.clone()` | `&T` / `&mut T` | `Rc<RefCell<T>>` | `Weak<T>` |
| --- | --- | --- | --- | --- | --- |
| JS/TS, Python, Java, Kotlin, C#, Dart, Scala, PHP, Go, Swift | plain assignment (the source is dead) | generated deep copy | the reference (Go: pointer for `&mut` of a value type) | the reference | today's `@(weak)` lowering |
| C++ | `std::move` | copy constructor | `const T&` / `T&` | `std::shared_ptr<T>` | `std::weak_ptr<T>` |
| Rust | the module as written (plus the prelude) | | | | |
| LLVM | ownership transfer | deep copy | borrowed pointer | refcounted | weak |

On the reference targets a move being a plain assignment is sound because the
source is never used again, so the aliasing is never observable.

Ranger's own move check (D3) runs in the flow pass beside optional narrowing
(`setFlowNarrowed`, `RangerAppWriterContext.rgr`): moved / maybe-moved / live
per variable, joined at branches, reset by assignment, with `Copy` types
exempt. It exists for fast feedback; it does not replace `cargo check`.

---

## 8. Implementation

| Piece | Where |
| --- | --- |
| Lexer: Rust tokens (raw strings, byte and C strings, char vs lifetime, nested block comments, doc comments kept as tokens) | `compiler/frontend/rust/lexer/RustLexer.rgr` |
| Rust AST (one node class, fixed child slots per kind) and its S-expression dump | `compiler/frontend/rust/ast/RustAst.rgr` |
| Parser: items, attributes, statements, expressions with Rust precedence, patterns, types, macro invocations | `compiler/frontend/rust/parser/RustParser.rgr` |
| Span check: children ordered and inside their parent, nothing dropped between list elements | `compiler/frontend/rust/parser/RustSpanCheck.rgr` |
| Command line driver `rustparse [-dump] [-check] files…` | `compiler/frontend/rust/cli/RustParseMain.rgr` |
| Doc comment reader (§4) → `RangerDocBlock` | R5, `compiler/frontend/rust/doc/` |
| Lowering Rust AST → CodeNode, subset checks (§3.4), block-expression lowering (§6) | R1, `compiler/frontend/rust/lower/` |
| Move and borrow check (§7) | R3, in the lowering (`lower/RustLower.rgr`, the "moves" and "borrows" sections) |
| Runtime operators the lowering writes (`rs_div`, `rs_fmt`, byte offsets, …) | `lib/rust/RsPrelude.rgr` |
| Prelude crate `ranger` (generated operator layer, `Map`, attribute macros) | R4, `runtime/rust/ranger/`; `scripts/gen-rust-prelude-ops.js` |
| Rust module output for `import_rgr!` | R6 |

The parser reads **full Rust syntax**, not only the subset: the subset is
enforced at lowering, where the message can name the construct and the
alternative. A parser that stops at the first unknown construct would give
worse errors.

## 9. Stages

Two ordering rules. The parity harness (every target's output equals the
rustc build's, D8) comes first, before any lowering, so each step is measured
from its first commit. The first fixtures use plain Rust types (`i64`,
`String`, `Vec`) and no prelude, so the harness does not wait for the prelude
crate.

| Stage | Content | Done when |
| --- | --- | --- |
| R0 | Lexer and parser for Rust syntax, AST dump, span check | **done**, §9.1 |
| R1 | Parity harness; `.rs` accepted by `rgrc`; lowering of the core subset | **done**, §9.2 |
| R2 | The rest of the subset: data enums, traits, generics, closures, `Result` / `?`, `HashMap` | **done**, §9.2 |
| R3 | Move and borrow check (§7, §3.4) | **done**, §9.2 |
| R4 | Prelude crate `ranger`: type names, ordered `Map`, the operator layer, strings per §5 | **done**, §9.2 |
| R5 | rustdoc reading (§4) | `-apidoc` output for a `.rs` module equals the one for its `.rgr` twin |
| R6 | Mixed programs: `import_rgr!`, Rust module output, `.rgr` ↔ `.rs` imports, `Cargo.toml` packages, the §2.3 boundary | a crate with both forms builds with `cargo build` and with `rgrc` for es6 and cpp, with the same output |
| R7 | Attributes and macros: `weak`, `late`, `serialize`, `target`, `tree!`, `native!` | each has a fixture on every target |
| R8 | A real module: port one self-contained `lib/` or gallery module to `.rs`; `cargo check` of all strict fixtures in CI | the ported module replaces its `.rgr` original and its tests pass on the targets they ran on before |

### R1 in steps

1. **Harness.** `tests/fixtures/rust_strict/*.rs` programs, each with a
   `main`. The test builds each with `rustc`, runs it, and records the output;
   then compiles the same file with `rgrc` for es6, go, python and cpp and
   compares. Without a Rust toolchain the test uses checked-in expected
   output.
2. **Entry into `rgrc`.** The parser is picked by extension where source is
   read: the entry file and `Import` in `FlowImport.rgr` (today
   `new RangerLispParser`). `.rs` goes to `RustParser` and then to the lowering,
   whose result is the same CodeNode tree the Lisp parser builds.
3. **Lowering** (`compiler/frontend/rust/lower/`): `fn` and `impl` → class
   with fields, methods and static methods (a method without `self` is
   static); `struct` literal → constructor; `let` / assignment / compound
   assignment; arithmetic with `/` chosen by the operand types; comparisons and
   logic; `if` / `while` / `loop` / `break` / `continue`; `for` over a range,
   `iter()`, `iter().enumerate()` and `chars()`; `match` on integers and on
   enums without data; `Option` with `Some` / `None` / `if let` → optionals;
   `Vec` and `String` methods through the §6 rename table; `println!` /
   `format!` with `{}`.
4. **Block expressions** (§6): hoisting `if`, `match`, block and `loop` values
   into temporaries, and a final expression into a `return`.
5. **Subset check** (§3.4): every node kind the lowering does not handle is
   refused with the construct's name and line, never dropped.
6. **Self-host.** The compiler now imports the frontend, so
   `npm run selfhost:check:<target>` must stay green on every target it
   passed on before.

### Later stages, what each needs first

- R2: data enums lower onto `shape` / `case` (PLAN_SHAPES), traits onto
  Ranger traits, generics onto `@params`; `Result` / `?` onto `try` / `throw`
  where the target has exceptions and a tagged value where it has not.
- R3: the flow pass's narrowing state (`setFlowNarrowed`) gets a moved /
  maybe-moved / live state beside it; borrow rules are checked at call sites.
  The negative fixtures are run through rustc too, so both verdicts are
  compared.
- R4: the operator layer is generated from the `rust` templates in
  `Lang.rgr`, so it cannot drift from what the Rust target writes.
- R6: needs a Rust *module* output mode from the Rust writer (no `fn main`,
  `pub` items) before `import_rgr!` can work.

### 9.1 R0 results

The parser is not wired into `rgrc` yet; `RustParseMain.rgr` compiles to a
standalone tool. `tests/rust-parser.test.ts` covers it:

- golden trees for `tests/fixtures/rust_syntax/*.rs` (items, expressions,
  statements, patterns and types, every literal form, the §3.1 example);
- every `.rs` file tracked in the repository parses and passes the span
  check. The one exception, `legacy/rust_compiler/src/parsers/mod.rs`, is not
  valid Rust: rustfmt rejects it at the same lines;
- invalid input is reported.

Measured outside the test suite:

| Corpus | Files | Result |
| --- | --- | --- |
| the compiler compiled to Rust (`-l=rust Compiler.rgr`) | 1 (121 781 lines) | parses in about 2 s under node |
| crates.io sources: syn 2 and 3, serde, regex, tokio, rayon, nom, itertools, anyhow and their dependencies | 2 172 | 2 170 parse with the span check; the 2 others are syn test inputs that rustfmt also rejects |

The same tool compiled to Go and Python gives byte-identical dumps.

`'\u{…}'` escapes above U+FFFF decode wrongly on the JavaScript build, because
`strfromcode` uses `String.fromCharCode` there (ISSUES.md #97); the golden
fixture leaves that case out until the operator is fixed.

### 9.2 R1–R4 results

`rgrc` picks the parser by extension: an entry file or an `Import` ending in
`.rs` goes through `RustParser` and the lowering (`compiler/frontend/rust/
lower/`), which writes Ranger source for the rest of the compiler.
`-rust-show-rgr` prints that source. `rust2rgr` (`cli/RustLowerMain.rgr`)
does the same as a standalone tool.

`tests/rust-strict.test.ts` builds each `tests/fixtures/rust_strict/*.rs`
with rustc, checks the recorded output, then compiles and runs the same file
for es6, python, go and cpp:

| Fixture | Covers |
| --- | --- |
| r1_arith, r1_control, r1_structs, r1_collections | integer and float arithmetic with Rust's truncation and printing, `if` / `match` / loops as expressions, structs, `impl`, `Vec`, `Option` |
| r2_enums, r2_traits, r2_closures, r2_closure_return, r2_results, r2_maps | data enums (as `shape` / `case`), traits and `dyn Trait`, generics (monomorphized), closures, functions returning closures and iterator chains, `Result` / `?`, `HashMap` / `BTreeMap` / sets |
| r3_moves | programs rustc accepts with moves, clones and `&mut` parameters of value types (boxed and written back) |
| r4_prelude, r4_strings, r4_helpers | the prelude's type names, `Map`, operator functions; the §5 table; char tests, float methods, padded `{:>8}` / `{:05}` formatting |
| ex_traits, ex_enums, ex_results, ex_iterators, ex_ownership, ex_strings | the playground's Rust examples, written as idiomatic Rust: `dyn Trait`, derived `PartialOrd`, `use Enum::*`, recursive enums, `ok_or` / `map_err` / `map_or`, `parse::<i64>()`, `Ordering::then`, `for` over `take` / `skip` / `enumerate` chains |

`errors/` holds constructs outside the subset and `borrow/` holds programs
rustc rejects (use after move, a move in one branch or in a loop, moving out
of `self` or an index, two `&mut` borrows, `&mut` with `&`, pushing while
iterating, using a value after a method took `self` by value). Each must be
refused by `rgrc` with the recorded message, and rustc must reject every
`borrow/` file too.

How the lowering maps what Ranger has no direct form for:

- `Result<T, E>` is a generated class `{ok, v, e}` and `?` an early return;
  `panic!` writes stderr and exits with 101 (`rs_panic`), because a Ranger
  `throw` needs a `try` in every caller.
- Tuples and generic structs are one class per instantiation. A generic
  field with no default would be optional in Ranger (ISSUES.md #99).
- A `&mut` parameter of a value type (a number, a String, a Vec on Go) is
  passed in an `RsBox_T` and written back by the caller.
- Names Ranger reserves (operators, keywords of any target) are renamed, and
  a method named like a field becomes `name_m` (ISSUES.md #98).

R3 runs in the lowering: each local carries a moved flag and position, set
where a non-Copy value is moved (by-value argument, assignment, return),
joined over `if` / `match` branches, checked for moves carried into the next
loop iteration, and cleared by assignment. At a call, two `&mut` borrows of
one place, or a `&mut` with a shared borrow of it, are errors; so is changing
a Vec inside a `for` over it.

R4 adds `runtime/rust/ranger`:

- `prelude`: `int`, `double`, `string`, `boolean`; `Map<K, V>`, which keeps
  insertion order (a `Vec` of entries plus a `HashMap` index, `entry()` API,
  `Index`, `Debug` as `HashMap` prints); the operator functions; the
  attributes `weak`, `late`, `serialize`, `doc`, `target` (a proc-macro crate,
  `macros/`, with no dependencies); `import_rgr!`.
- `ops.rs` is generated by `scripts/gen-rust-prelude-ops.js` from the
  `rust` templates of `compiler/Lang.rgr`: operators with one signature over
  int / double / boolean / string and a plain-text template, 40 of them. Each
  generated function is compiled with rustc and dropped if rustc rejects it.
  `strlen` and `rawbytechar` are left out, as their unit is the target's
  (D7). The same script writes `lower/RustPreludeOps.rgr`, from which the
  lowering turns `sqrt(x)` into the operator `(sqrt x)`, so each target runs
  its own template. `--check` fails when either file is stale.
- The lowering writes a `Map` as a class with the key order beside the map
  (`RsOMap_K_V`): Ranger's map on Go iterates in random order. `HashMap`
  stays a plain map, as Rust leaves its order unspecified.
- `rgrc -l=rust file.rs` writes the module as it is (§7): it has passed the
  subset and move checks, and rustc decides the rest.
- A `Vec` of `Option` is refused: a Ranger array has no empty element.
  `str::parse` answers a `Result` and accepts what Rust accepts (JavaScript's
  `parseInt("12x")` is 12); the error carries its Display text.
- Strings follow §5 on every target: `chars()` and `.chars().count()` are
  code points, `bytes()`, `as_bytes()[i]` and `.as_bytes().len()` are UTF-8
  bytes, and `find` / `&s[a..b]` use byte offsets. `to_uppercase` applies
  Rust's special casing of ß on Go and C++ too.

## 10. Open questions

- Should a `.rs` module be allowed to `impl` a trait for a `.rgr` class?
- `u8` / `i32` / `usize`: accept them (`usize` is what `len()` and indexing
  return in Rust) and map to `int` everywhere but Rust, or require casts?
- Generated deep copy for `.clone()` on classes that hold `Rc`: Rust clones the
  `Rc` (shallow). The other targets must do the same, so `clone` generation
  follows the field types, not "deep" everywhere.
- A tree-sitter grammar is not needed (tree-sitter-rust works); an LSP for the
  subset messages can come from the existing VS Code extension.
