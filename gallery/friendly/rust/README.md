# Rust — can Ranger write idiomatic Rust?

A small gallery study. Ten Ranger programs try to express the Rust a fluent
Rust programmer would write — ownership, `Option` / `Result`, data-carrying
enums, traits, iterators, generics, slices, builders, errors. Each file was
compiled with `-l=rust -strict-ownership`, built with `rustc --edition 2021`,
and run. The generated sources are in [`generated/`](generated/).

The question is not “does it rustc?” (it does). The question is: **when I write
ordinary Ranger, does the Rust look like Rust — and when it does not, is that
because I wrote the Ranger wrong, because the writer is unfinished, or because
the language cannot say the thing?**

```bash
# from the repository root, after `npm run compile`
bash gallery/friendly/compile.sh rust     # or: bash gallery/friendly/rust/compile.sh
```

The script compiles each study, `rustc`s it and runs the binary — and then
requires every file in [`attempts/`](attempts/README.md) to be *refused*, with
the error that file declares. That second half is the point: a form the target
cannot express has to be a compile error naming the limitation, never a binary
that panics and never Rust that does not exist.

License: AGPL-3.0-or-later, with the rest of `gallery/`.

## Verdict

**I could write working Ranger that rustc accepts and that prints the right
answers.** Several surfaces are already close to the book: borrowed `&Point`
and `&[i64]` / `&str` parameters, `&self` on read-only value types, `Rc` only
on classes the sharing analysis proves shared, `Weak` for a parent pointer,
`Option<T>` for `@(optional)`, `format!` / `+=` / tail expressions.

**I could not write idiomatic Rust.** The language has no `Result`, no `?`, no
lifetimes, no `impl Trait for Type`, no iterator adapters, no consuming `self`,
no `Arc`/`Mutex`, no modules. A Ranger `Enum` is an `i64`. A `shape` used as
`Result` is a generated `union_*` enum whose `Err` case is
`Rc<RefCell<…>>` because a `string` field is not a scalar. `match` becomes a
chain of `if let`. A Ranger `trait` is a mixin: the methods are copied into
each class; there is no Rust `trait` in the output. Every file opens with ~140
lines of unused `RgOrderedMap` / `FxHasher` preamble, and thirteen more of
`Rc` / `RefCell` / `rg_downcast` that a file with no shared class never uses.

Three holes I walked into while writing the study. **All three are now closed**
— see [What changed since the study](#what-changed-since-the-study).

1. An optional **parameter** became `Option<Option<T>>` and did not rustc.
   Reported here as a string problem; it was every optional parameter. *Fixed:
   it is now [study 10](../src/10_optional_params.rgr).*
2. `try` / `throw` compiled, emitted `panic!`, and **dropped the catch block**.
   The binary died. *Now a compile error on `-l=rust`.*
3. A Ranger `trait` used as a **type** emitted a Rust type that does not exist
   (`fn show(n : &mut Named)`, no `Named` in the file, `rustc: E0425`). Worse
   than "not idiomatic" — I first recorded it as `show` taking a concrete
   `&mut User`. *Now a compile error naming the spelling that works.*

## How to write Ranger today if the Rust output matters

These are the forms that survived this study.

| Wanted Rust | Write this Ranger | What comes out |
| --- | --- | --- |
| `struct Point { x, y }` | `record Point { def x:int 0 … }` | `struct Point { x: i64, y: i64 }` |
| `fn f(p: &Point)` | a method that only reads `p` | `fn f(&self, p: &Point)` |
| shared mutable object | `def b:Counter a` then mutate `b` | `Rc<RefCell<Counter>>` + `borrow_mut` |
| `Option<Weak<RefCell<T>>>` | `def parent@(weak optional):T` | exactly that |
| `Option<T>` return | `fn find@(optional):T`, assign into an optional local, return the local | `-> Option<T>` |
| `name.unwrap_or("x")` | `(?? name "x")` on a **local**, not a parameter | `if name.is_some() { … } else { "x" }` |
| `&[i64]` / `&str` args | a `[int]` or `string` you only read | `&[i64]`, `&str` |
| closed variants | `shape Message { case Ping case Text { … } }` | a Rust `enum` (see the caveats) |
| “Display” | `fn asString:string ()` | an ordinary method, not `impl Display` |
| `Result` | a `shape` with `Ok` / `Err` cases | a generated enum — **not** `Result<T, E>` |
| map / filter | a `for` loop that `push`es | an index `for` over `&[T]` |
| generic type | `class Stack @params(T)` then `Stack@(int)` | `struct Stack_int` / `Stack_string` |

`@(optional)` in a parameter list is fine now (study 10). `try` / `throw` and a
`trait` used as a type are compile errors on this target rather than traps. Do
**not** `return x` from an optional function when `x` is non-optional — bind
`def found@(optional):T` and return that. Do **not** expect a Ranger `Enum` to
become a Rust `enum`.

---

## The studies

Each section is: the Rust I wanted, the Ranger I wrote, what the writer
emitted, and why that is or is not the idiom.

### 01 — ownership, borrows, sharing, weak back-edges

Source: [`../src/01_ownership.rgr`](../src/01_ownership.rgr)

This is the closest study. The analysis printed the verdicts a Rust programmer
would have chosen by hand:

```text
ownership[rust] class Point -> value
ownership[rust] class PointOps -> value
ownership[rust] class Counter -> Rc<RefCell> (aliased and mutated in main)
ownership[rust] class TreeNode -> Rc<RefCell> (weak field TreeNode.parent)
```

`manhattan` only reads its argument, so it is `&self` and `&Point`. Aliasing
`def alias:Counter left` plus `alias.add(1)` wraps `Counter`. The parent field
is `Option<Weak<RefCell<TreeNode>>>`, stored with `Rc::downgrade`, read with
`upgrade()`. The program prints `shared 1` and `parent root`.

```rust
fn manhattan(&self, p : &Point) -> i64 { /* … */ ax + ay }

fn reading(__self_rc : &Rc<RefCell<Counter>>) -> i64 {
    __self_rc.borrow().value
}
fn add(__self_rc : &Rc<RefCell<Counter>>, amount : i64) {
    __self_rc.borrow_mut().value += amount;
}

fn adopt(__self_rc : &Rc<RefCell<TreeNode>>, mut c : Rc<RefCell<TreeNode>>) {
    c.borrow_mut().parent = Some(Rc::downgrade(__self_rc));
    __self_rc.borrow_mut().kids.push(c.clone());
}
```

**What is not idiomatic.** Shared-class methods are associated functions with
a hidden `__self_rc`, not `(&self)` / `(&mut self)` on the `Rc`. A human would
write `impl Counter { fn add(&mut self, amount: i64) }` on a value, or
`fn add(this: &Rc<RefCell<Self>>, …)` if they really wanted the cell. The
constructor still writes the struct with zeros and assigns the fields two
lines later. `TreeNode.name` became `&'static str` because every store was a
literal — lucky, and fragile if a later assignment is a computed `string`.

**Could I have written it more idiomatically in Ranger?** No. There is no
`&T`, no `'a`, no `weak` spelling other than the annotation. The inference
is the feature. Returning `this` from `adopt` is not needed; storing `this`
in a `weak` field is the documented cycle break and it works.

### 02 — Option and Result

Source: [`../src/02_option_result.rgr`](../src/02_option_result.rgr)

`@(optional)` is `Option`. `findName` returns `Option<String>`. `??` on a
local is `unwrap_or`. `str2int` is `text.parse::<i64>().ok()`. `null?` is
`is_none()`. That half is the idiom.

There is no `Result<T, E>` and no `?`. A `shape ParseOutcome` with `Ok` /
`Err` is the closest the language can say. What rustc sees:

```rust
pub enum union_ParseOutcome {
    ParseOutcome_Ok(ParseOutcome_Ok),
    ParseOutcome_Err(Rc<RefCell<ParseOutcome_Err>>),
}
fn parseInt(text : &str) -> union_ParseOutcome { /* … */ }
```

Both cases are value structs inside the tag now — `Err` used to be
`Rc<RefCell<ParseOutcome_Err>>` because a `string` was not counted as scalar.
That rule protected the *kind check*, which used to clone the scrutinee to
test it; a real `match` over a reference does not, so the cost it guarded is
gone. A human still writes `Result<i64, String>`: the remaining distance is
one-field cases unwrapping to their payload type. `match` is a pair of `if let`s, not a `match`, and it
is a statement that writes a local — not an expression, so there is no
`?` and no `let n = parse_int(s)?;`.

Returning a non-optional from an optional function is a Ranger compile
error. The working form (also how `lib/Shell.rgr` is written):

```ranger
def found@(optional):string
; …
found = n
return found
```

**Writer bug — fixed.** `fn shown:string (maybe@(optional):string)` — a
perfectly ordinary Ranger signature — emitted
`fn shown(maybe : Option<Option<String>>)` and did not rustc. I wrote it up as a
string problem because that is where I hit it; it was every optional parameter,
scalar and object alike. `writeTypeDef` already writes the `Option<…>` from the
name node's flag and the parameter emitter wrapped it in a second one. The
workaround in this study (drop the parameter, use `??` on a local) is no longer
needed: [`../src/10_optional_params.rgr`](../src/10_optional_params.rgr) is the same
program with the parameter back, and it runs.

### 03 — enums and match

Source: [`../src/03_enums_shapes.rgr`](../src/03_enums_shapes.rgr)

I wanted

```rust
enum Color { Red, Green, Blue }
enum Message { Ping, Text { body: String }, Move { dx: i64, dy: i64 } }
```

Ranger `Enum Color ( Red Green Blue )` does **not** become a Rust enum.
`colorName` takes `c : i64` and compares to `0` / `1`. `Color.Green` in
`main` is the literal `1`. The name is gone.

`shape Message` does become an enum, and `Ping` / `Move` (scalars only) sit
in the tag. `Text` has a `string`, so it is `Rc<RefCell<Message_Text>>`.
`match` is again `if let` arms. The program prints `ping` / `text:hi` /
`move:2,3`, so the semantics are right and the surface is generated.

**Could it be done?** The data-carrying family can be written (as a shape).
The C-style `Enum` cannot be made into a Rust enum from Ranger source; the
writer would have to change. I cannot write `Message::Text { body }`
construction or a match expression that yields a value.

### 04 — traits

Source: [`../src/04_traits.rgr`](../src/04_traits.rgr)

I wanted `trait Named { fn label(&self) -> String; }` plus `impl Named for
User`, `impl Display for User`, and a `fn show(n: &dyn Named)`.

Ranger `trait Named { def name:string "" fn label:string () { return name } }`
plus `does Named` is a mixin. The output has **no** `trait Named`. `User` and
`Bot` each contain a copied `fn label(&self)`. `asString` is an ordinary
method, not `Display`. `show` takes `&mut User`, so it cannot accept a `Bot`.

```rust
impl User {
    fn asString(&self) -> String { format!("{} {}", self.name, self.age).clone() }
    fn label(&self) -> String { self.name.to_string() }
}
fn show(mut who : &mut User) -> String { /* … */ }
```

**Could it be done?** For a **behaviour-only** trait — methods and no fields —
yes, and it is done: see [study 12](../src/12_behaviour_traits.rgr).

```rust
pub trait NamedTrait: RgAnyRef { fn label(&mut self) -> String; }
impl NamedTrait for User { … }
impl NamedTrait for Bot  { … }
fn show(mut n : Rc<RefCell<dyn NamedTrait>>) -> String
```

The trait in *this* study carries a field, and that case stays a mixin: its
fields are copied into each consumer and Rust has no associated fields to hold
them. Typing a parameter by such a trait used to emit a Rust type that does not
exist; it is a compile error now —
[`attempts/04_trait_as_type.rgr`](attempts/04_trait_as_type.rgr).

**But the machinery is already there, one spelling over.** The same program
written with `Extends(Named)` instead of `does Named` emits exactly what this
section says cannot be had:

```rust
pub trait NamedTrait: RgAnyRef { … }
impl NamedTrait for User { … }
impl NamedTrait for Bot  { … }
fn show(mut n : Rc<RefCell<dyn NamedTrait>>) -> String
```

rustc-clean, and it prints `ada` / `bot`. So "a Ranger `trait` as a Rust
`trait`" is routing `does` into the path a parent class with subclasses already
takes, not new machinery. There is still no spelling for “implement this Rust
*standard* trait” — `impl Display` / `impl From` / `impl Iterator` — and that is
a separate design question (semantic interfaces rather than magic method names).

### 05 — iterators

Source: [`../src/05_iterators.rgr`](../src/05_iterators.rgr)

I wanted `xs.iter().copied().sum()`, `.filter(|n| n % 2 == 0).count()`,
`.map(|n| n * 2).collect()`.

Ranger has `for` and a lambda value. The writer turns a read-only `[int]`
into `&[i64]` and `x = x + v` into `+=`, which is decent loop Rust. It does
not emit an adapter chain. A function-typed parameter becomes
`&mut dyn FnMut(i64) -> i64` — closer than I expected — but the body still
walks by index and `push`es.

```rust
fn total(xs : &[i64]) -> i64 {
    let mut acc : i64 = 0;
    for i in 0..(xs.len() as i64) {
        let mut v = xs[i as usize];
        acc += v;
    }
    acc
}
fn applyEach(xs : &[i64], f : &mut dyn FnMut(i64) -> i64) -> Vec<i64> { /* push */ }
```

The lambda in `main` is `&mut |mut p| { return p + 1; }`, not
`|p| p + 1`. **Could I have written iterator adapters?** No. There is no
`Iterator` in the language. `lib/stdlib.rgr` has `map` / `filter` as methods
on the array class; those would still lower to loops, and they are not on
the default `RANGER_LIB` this study uses.

### 06 — generics

Source: [`../src/06_generics.rgr`](../src/06_generics.rgr)

I wanted `struct Stack<T>` and `fn peek(&self) -> Option<&T>`.

`class Stack @params(T)` plus `Stack@(int)` / `Stack@(string)` compiles. The
Rust is two structs, `Stack_int` and `Stack_string`. `peek` is
`Option<i64>` / `Option<String>` — owned, not borrowed. `put` on the string
stack takes `&str` and `to_string()`s it, which is reasonable.

A free generic function does not exist. [`attempts/06_generic_function.rgr`](attempts/06_generic_function.rgr)
is rejected (`Undefined variable x`, `Undefined variable identity`). There
are no bounds, no `where`, no lifetime on the peek.

**Could it be done?** The monomorphized class is the Ranger idiom and it
works. It is not a Rust generic library. Anyone who wanted one
`Stack<T>` in the `.rs` cannot get it from Ranger source.

### 07 — slices and strings

Source: [`../src/07_slices_strings.rgr`](../src/07_slices_strings.rgr)

This one landed. Borrowed `[int]` is `&[i64]`. Borrowed `string` is `&str`.
`greet` is `format!`. `firstChar` walks `s.chars()` (code-point indexed, as
Ranger requires). Calling `total` twice on the same slice is legal because
both takes are shared borrows.

```rust
fn greet(name : &str) -> String { format!("{}{}", "hello ".to_string(), name).clone() }
fn total(xs : &[i64]) -> i64 { /* … */ }
fn firstChar(s : &str) -> String { s.chars().take(1).collect::<String>().clone() }
```

**What I could not write.** A function that returns `&str` or `&[i64]`
borrowed from an argument. Ranger has no lifetime, so a substring is always
a new `String`. The trailing `.clone()` on an owned local that is about to
drop is the writer, not the source.

### 08 — builder

Source: [`../src/08_builder.rgr`](../src/08_builder.rgr)

I wanted the consuming builder:

```rust
impl Request {
    fn with_host(mut self, h: String) -> Self { self.host = h; self }
}
Request::new().with_host("localhost").with_port(8080)
```

Ranger classes are references. There is no by-value `self`. Two workarounds:

1. **Copying builder on a record** — `withHost` takes `r:Request` and
   returns `new Request(h r.path r.port)`. The Rust is
   `fn withHost(&self, r: &Request, h: &str) -> Request`. Each step is a
   helper on a separate `RequestBuild` class, because a record has no
   methods. It works. It is not `impl Request`.

2. **Mutating `return this`** — `MutRequest.withHost` emits

   ```rust
   fn withHost(&mut self, h : String) -> MutRequest {
       self.host = h.clone();
       self.clone()
   }
   ```

   The chain rustc-accepts (`m.withHost(…).withPort(…).withPath(…)`). It
   mutates `m` *and* returns a clone. That is neither the Rust consuming
   builder nor `&mut self -> &mut Self`. Returning `this` did **not** force
   `Rc<RefCell>` here, because nothing aliased the object under two names.

**Could it be done?** The fluent call works. The idiom (consume `self`,
return `Self`, no hidden clone) cannot be said.

### 09 — errors

Source: [`../src/09_errors.rgr`](../src/09_errors.rgr)

I wanted `fn must_be_positive(v: i64) -> Result<i64, String>` and `?`.

The portable Ranger form is the same `shape` as study 02. It runs:
`ok:3` / `err:negative`. It is not `Result` and there is no `?`.

The spelling a Ranger programmer actually uses is `try` / `throw` /
`@(throws)`. That file is [`attempts/09_throw_panics.rgr`](attempts/09_throw_panics.rgr).
The writer is explicit:

```rust
fn mustBePositive(value : i64) -> i64 {
    if value < 0 { panic!("{}", "negative".to_string()); }
    value
}
/* try: Rust has no exceptions, so the catch block is not written */
let bad : i64 = Guard::mustBePositive(0 - 1);
```

The successful path prints `try_ok 3`. The failing path panics. `error_msg`
in the catch is never reached. This is documented in
`docs/site/src/content/docs/targets/overview.md`. It is still a footgun:
the program is legal Ranger, compiles, rustc accepts it, and is wrong.

**Could it be done?** Only by not using `try` — and the compiler now says so
rather than letting it through. A first-class portable `Result` is the missing
piece: a genuine value everywhere, with Rust and Swift using the native type and
the other targets getting the generated tagged form, plus a propagation operator
whose rule (`Ok` → the value, `Err` → return it from the current function) is the
same on every target. Defining it as "Rust `Result`, exception elsewhere" would
make it an exception feature that happens to compile to `Result`.

### 10 — optional parameters

Source: [`../src/10_optional_params.rgr`](../src/10_optional_params.rgr)

This one was an attempt, not a study. It is here because the fix landed:

```rust
fn shown(maybe : Option<String>) -> String
fn shownInt(a : Option<i64>) -> i64
fn shownPoint(&self, mut p : Option<Rc<RefCell<Point>>>) -> i64
```

Three optional parameters — a string, a scalar and an object — each singly
wrapped, each `is_none()`-tested and unwrapped in the body, each passed an
`Option` at the call site. The binary prints `name ada` / `miss unknown` /
`int 41` / `point 7`.

The object case shows the ownership model still applies through the `Option`:
`Point` is stored in a local and handed on, so it is
`Option<Rc<RefCell<Point>>>` — the `Option` outside the cell, which is the same
shape an optional field takes.

**Was the study wrong?** About the scope, yes. I hit it on a string and wrote it
up as a string problem; an optional `int` and an optional object were just as
broken. Optional *locals* and optional *returns* really were fine — they never
went through the parameter emitter, which is what made the hole look narrower
than it was.

---

## What changed since the study

The study was written against the compiler of one afternoon. These landed after
it, and the numbers above have been re-checked against them.

| Was | Now |
| --- | --- |
| optional parameter → `Option<Option<T>>`, no rustc | singly wrapped, [study 10](../src/10_optional_params.rgr) runs |
| every file carried ~140 lines of map preamble it never called | emitted only when the program can reach it; study 07 is 194 lines → 82 |
| `Enum Color` was `i64`, `Color.Green` was `1` | `enum Color { Red = 0, … }` and `Color::Green`, per enum and conservative |
| `match` over a shape was a chain of `if let` | a Rust `match`, no wildcard when the arms cover the enum |
| `for` was always an index loop with a hoisted bound and a cast | `for v in xs.iter().copied()` where that is safe |
| a behaviour-only `trait` as a type named a type that did not exist | `pub trait NamedTrait` + one `impl` per consumer ([study 12](../src/12_behaviour_traits.rgr)) |
| a `shape` case holding a `string` sat behind `Rc<RefCell<…>>` | it rides inside the variant; collections and objects still take the cell |
| the output was always a program | `-rust-library` gives it a public surface and no `main` |
| every file carried `#![allow(non_snake_case)]` and 708 warnings | identifiers are snake_case; the allow is gone and the count is zero |
| `try` / `catch` compiles and drops the catch | compile error on `-l=rust` naming the replacement |
| `trait` as a type → `&mut Named`, no such type, `E0425` | compile error naming `Extends(Base)`, which does work |
| `attempts/` run by hand, if at all | run by `compile.sh`; each must be refused with its declared error |
| nine studies, no gate | ten studies plus the attempts, under `compile.sh` |
| every file opened with `use std::rc::Rc;`, `use std::cell::RefCell;` and the `RgAnyRef` / `rg_downcast` / `RgIdentical` trio | in only when the cell can reach the output — a shared class, a `@(weak)` field, a closed family, a behaviour-only trait used as a type, or an inheritance family. Six of the twelve studies have none of those and drop all thirteen lines |

`try` / `catch` is refused rather than lowered, so `-rust-allow-dropped-catch`
keeps the old behaviour and prints each dropped site. The compiler's own sources
need it: twelve catch blocks, each an `addError(…)` reporting a parse failure,
have been dropped from the Rust rendering of the compiler all along — so the
Rust selfhost build reports those twelve failures as a panic rather than as an
error list. The selfhost scripts pass the flag with a comment naming the debt.

The compiler refactor that split the Rust writer by question
(`RustCall` / `RustClass` / `RustOperators` / `RustOwnership` / `RustUnion`)
changed none of the `generated/*.rs` in this directory by a byte.


---

## What I could not write at all

No `.rgr` was attempted for these. The parser has no form.

| Rust idiom | Why not |
| --- | --- |
| `Result<T, E>` and `?` | No type, no operator. A `shape` is a closed family, not `Result`. |
| `impl Display` / `From` / `Iterator` / `Drop` | No `impl Trait for Type`. `asString` is a method name. |
| Lifetimes, `&str` / `&[T]` / `Option<&T>` as returns | Annotations `lives` / `temp` are bookkeeping, not `'a`. |
| `async` / `.await` | No async in the language. |
| `Arc<Mutex<T>>`, channels, `Send` | Sharing is `Rc<RefCell<T>>` only. |
| `mod` / `crate` / `use` | `Import "File.rgr"` is compile-time inclusion. One `.rs` file. |
| `unsafe`, `macro_rules!` | No user spelling. The writer emits `unsafe` only for `cast` downcasts. |
| `if let` / `while let` / match guards / match-as-expression | `match` is a statement. `case` narrows. |
| Consuming `self` | Methods always see a reference object. |
| `dyn Trait` as a type the user writes | Polymorphism is `Extends` / `does` / generated vtables. |

---

## How the language (and the Rust writer) could improve

Ranked by how much they would change the studies above. The ranking below is the
study's own, kept as written; it has since been checked against the compiler,
corrected where it was wrong and re-ordered in
[`docs/plans/PLAN_RUST_SEMANTIC_IDIOMS.md`](../../../docs/plans/PLAN_RUST_SEMANTIC_IDIOMS.md),
which is where the work is tracked. Items 3 and 10 below are done; item 4 turned
out to be a reroute rather than new machinery.

1. **A `Result` type and a `?`.** The single biggest gap versus idiomatic
   Rust. On Rust it is `Result<T, E>`. On JavaScript it can stay a thrown
   string. `try` / `throw` should either refuse `-l=rust` or lower to
   `Result` so the catch is not silently deleted.

2. **`Enum` → Rust `enum`, `shape` match → `match`.** `Color` as `i64` and
   `if let` chains are the loudest “this was generated” signals on studies
   02, 03 and 09. Scalar-only cases already sit in the tag; a `string`
   payload should be `String` inside the variant, not `Rc<RefCell<…>>`,
   unless the case is actually shared.

3. **Fix optional string parameters.** `Option<Option<String>>` is a writer
   bug. Locals and returns already do the right thing.

4. **Ranger `trait` as a Rust `trait` when it has no fields.** A behaviour-only
   trait (`fn label:string ()`) could emit `trait Named { fn label(&self) -> String; }`
   and `impl Named for User`. Field-bearing traits stay mixins. That would
   unlock `dyn Named` without the `rgf_*` machinery. A way to mark
   `asString` as `Display` (and `equals` as `PartialEq`) would make the
   output usable as a crate.

5. **Iterator lowering.** `for xs v:int i { acc = (acc + v) }` can stay a
   loop. A small set of operators — `map`, `filter`, `reduce` — could emit
   `.iter().map(…).collect()` when the body is a pure expression. The
   language already has those methods on the stdlib array class.

6. **Generic functions, and keep `@params` in the Rust.**
   `fn identity@params(T):T (x:T)` should compile. Emitting `struct Stack<T>`
   instead of `Stack_int` / `Stack_string` would make the output a library
   someone might depend on.

7. **By-value `self` and borrowed returns.** A method that returns `this`
   after mutating it wants `fn with_host(mut self, h: String) -> Self`. A
   `peek` that does not copy wants `Option<&T>`. Both need a lifetime /
   ownership annotation the writer can see — today’s `lives` / `temp` are
   not that.

8. **Do not emit the map preamble into a program that has no map.** Study
   07 is 16 lines of Ranger and 195 lines of Rust; 140 of those are
   `RgOrderedMap` and string-index helpers the binary never calls.

9. ~~**`snake_case` names.**~~ **Done** — identifiers are snake_case and the
   allow is gone. Every file used to carry `#![allow(non_snake_case)]`.
   `docs/plans/PLAN_RUST_IDIOMATICITY.md` already ranks this. It is mechanical and it
   is what a reviewer sees first.

10. **`try` must not be silently lossy.** If (1) is too large, a compile
    error on `throw` / `catch` for `-l=rust` would have saved the ninth
    study from looking finished.

Items 1–4 and 10 are language or writer *semantics*. 5–9 are emission
quality. The ownership layer (study 01, slices in 07) is already the part
a Rust programmer would recognize.

## Files

```
gallery/friendly/
  compile.sh              Ranger → build → run, then attempts must be refused
  src/NN_*.rgr            the eleven programs, shared with every sibling study
  rust/
    README.md             this study
    generated/NN_*.rs     snapshots of the writer output
    generated/NN_*.out    what each binary printed
    attempts/             forms Rust cannot express, each with its
                          `; EXPECT-ERROR:` line — see attempts/README.md
```

`bash gallery/friendly/compile.sh rust` runs all of it; without the argument it
runs all ten targets. The Rust arm also rebuilds every study with
`-rust-library` and checks it under `rustc --crate-type=lib` — that mode gives
the output a public surface and no crate `main`, for when the `.rs` is meant to
be a crate rather than a program.

Related: [`docs/plans/PLAN_RUST_SEMANTIC_IDIOMS.md`](../../../docs/plans/PLAN_RUST_SEMANTIC_IDIOMS.md)
(where this study's findings are tracked),
[`docs/plans/PLAN_RUST_IDIOMATICITY.md`](../../../docs/plans/PLAN_RUST_IDIOMATICITY.md),
[`docs/plans/PLAN_RUST_OWNERSHIP.md`](../../../docs/plans/PLAN_RUST_OWNERSHIP.md),
[`docs/site/src/content/docs/targets/memory.md`](../../../docs/site/src/content/docs/targets/memory.md).
