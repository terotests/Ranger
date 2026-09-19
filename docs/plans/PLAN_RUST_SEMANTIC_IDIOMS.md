# PLAN_RUST_SEMANTIC_IDIOMS — closing the semantic gap the rustfriendly study found

> **Status: P0 landed. P1 and beyond wait for the target lowering IR.** The three
> correctness items — **A**, **B**, **C1** — are in, with the gallery study as
> their gate (`npm run rustfriendly:test`). The rest is parked: the ownership
> vocabulary of §1, the handle/data split (**J**) and the borrow-provenance
> inference (**M**) are cheap inside a lowering IR and expensive as further
> text-template special cases, so the refactor changes their cost, not just their
> timing.
>
> Re-verified after the refactor that split the Rust writer by question
> (`RustCall` / `RustClass` / `RustOperators` / `RustOwnership` / `RustUnion`):
> all three bugs were still live in the new layout, and the split changed none of
> the study's `generated/*.rs` by a byte.

`gallery/rustfriendly` (PR #1010) asks a question
[PLAN_RUST_IDIOMATICITY](PLAN_RUST_IDIOMATICITY.md) did not. That plan measured
*texture* — clippy warnings, casts, `return` vs tail expression — and drove it
from 1395 warnings to 0. The study asks whether the Rust **says what a Rust
programmer would say**, and the answer is a different list: no `Result`, no
`?`, a C-style `Enum` that is an `i64`, a `trait` that is a mixin, `match` as a
chain of `if let`, a 140-line map preamble in a program with no map.

This plan re-verifies the study's claims against the compiler, corrects three of
them, and ranks the work by what it costs against what it unlocks.

## Verification — what the study got right, and what it under-reported

Everything below was reproduced with `node bin/output.js -l=rust` and
`rustc 1.94.1`, first against `master` at 1351dee and again after the writer
split at 4e9fdd7.

**Confirmed as written.** `Enum` is `i64` at
[`RangerRustClassWriter.rgr:991`](../../compiler/RangerRustClassWriter.rgr#L991)
and the tag name is substituted for its integer at line 1475. `try` writes the
try block and a comment where the catch belongs
([`Lang.rgr:5589`](../../compiler/Lang.rgr#L5589)); `throw` is `panic!`
([`Lang.rgr:5547`](../../compiler/Lang.rgr#L5547)). The `FxHasher` / `RgOrderedMap`
preamble at
[`RustClass.rgr:925`](../../compiler/RustClass.rgr#L925)
is emitted unconditionally — the file already gates `use std::rc::Weak;` on
`anyWeakField` in the same header writer
([line 7601](../../compiler/RustClass.rgr#L773)), so the pattern for
gating it exists.

**Three corrections.**

1. **The optional-parameter bug is not about strings.** The study reports
   `Option<Option<String>>` for a `@(optional):string` parameter. It is every
   optional parameter:

   ```text
   fn shownI(a : Option<Option<i64>>) -> i64
   fn shownO(&self, mut p : Option<Option<Point>>) -> i64
   ```

   Root cause: `writeTypeDef` reads the `optional` flag off the name node and
   writes the `Option<…>` itself
   ([line 978](../../compiler/RangerRustClassWriter.rgr#L978)); the parameter
   emitter wraps the call in a second one
   ([lines 2617–2640](../../compiler/RangerRustClassWriter.rgr#L2628)). Deleting
   the outer wrap is the whole fix — see item **A**.

2. **A Ranger `trait` used as a type does not produce non-idiomatic Rust, it
   produces Rust that does not exist.** The study says `fn show(n:Named)` comes
   out as `&mut User` and so cannot take a `Bot`. What it actually emits is

   ```rust
   fn show(mut n : &mut Named) -> String
   ```

   and `Named` is not a declared type anywhere in the file — `rustc` stops with
   `E0425: cannot find type 'Named' in this scope`. The C++ writer has the same
   hole (`std::shared_ptr<Named>`, no `class Named`); ES6 is fine.

3. **The machinery for real Rust traits already works — under a different
   spelling.** The same program written with `Extends(Named)` instead of
   `does Named` emits exactly the Rust the study says cannot be had:

   ```rust
   pub trait NamedTrait: RgAnyRef { ... }
   impl NamedTrait for User { ... }
   impl NamedTrait for Bot  { ... }
   fn show(mut n : Rc<RefCell<dyn NamedTrait>>) -> String
   ```

   rustc-clean, and the binary prints `ada` / `bot`. So item 4 of the study's
   own ranking ("Ranger `trait` as a Rust `trait`") is not new machinery — it is
   routing `does` into the `is_extended_by_children` path the writer already
   takes at
   [`RangerRustClassWriter.rgr:1047`](../../compiler/RangerRustClassWriter.rgr#L1047).

**Unrelated, found while checking.** Two tests in `codegen-rust.test.ts` fail on
`master` — *inlines literals into the println! format string* and *flattens a
string chain into one format!*. They predate anything here.

---

## §1 The architectural frame

Two framings decide how most of the item list is built. Both belong to the
refactor, not before it.

### Separate "value vs shared identity" from "scalar vs non-scalar"

This is the single highest-leverage distinction in this document. Today
`Rc<RefCell<T>>` arrives from two unrelated questions. One is the right
question, asked by the sharing analysis:

```text
is this value aliased, mutated through more than one owner, does identity matter?
```

The other is a representation accident, asked of union case payloads at
[`StaticAnalysis.rgr:2156`](../../compiler/StaticAnalysis.rgr#L2156):

```text
does this case contain anything that is not int / double / boolean / char?
```

A `string` answers yes, so `shape ParseOutcome { case Ok { value:int } case Err
{ message:string } }` becomes

```rust
enum union_ParseOutcome {
    ParseOutcome_Ok(ParseOutcome_Ok),
    ParseOutcome_Err(Rc<RefCell<ParseOutcome_Err>>),
}
```

where a Rust programmer writes `Result<i64, String>`. `Rc<RefCell<T>>` should
mean *Ranger semantics require shared mutable identity* and nothing else.

The ownership vocabulary that falls out of this is four cases, not two:

```text
Value     — copied or moved, no identity
Unique    — one owner, moved
Shared    — Rc<RefCell<T>>, identity matters
Weak      — Weak<RefCell<T>>, back edge
```

Shape case payloads should be **Value** by default, and the aliasing analysis
should be what promotes one to Shared — the same question `markClassShared`
already answers for every other class.

**One caveat that must not be lost in the rewrite.** The scalar-only rule is not
arbitrary; it was a measured fix. The C++ writer carries the same rule and its
comment records why
([`RangerCppClassWriter.rgr:281`](../../compiler/RangerCppClassWriter.rgr#L281)):
a by-value `String` variant made every copy of the union copy the payload, and a
kind check on a 40 KB accumulator went O(len). A Ranger union value passes by
clone, so "Value by default" reintroduces that unless the lowering also stops
cloning where a move will do. The criterion is therefore not only *is it
aliased* but also *is it copied on a hot path* — and the second half is a
lowering concern (move vs clone), not an analysis one. Any fix here lands in
both writers.

### A Rust lowering IR

The backend is currently ownership analysis feeding text templates, and every
new distinction above has to be expressed as another template exception. A small
target-specific lowering stage between the two would carry the vocabulary
instead:

```text
Ranger AST + ownership analysis
        ↓
   RustLowering          ← decides Value / Borrow / MutBorrow / Shared / Weak,
        ↓                  Option / Result, Match, Clone vs Move, Try
     Rust IR
        ↓
   RustWriter            ← prints; makes no ownership decisions
```

Then "shape payload contains a String" produces `Value(String)` and the writer
prints `String`. It is not a prerequisite for the Tier 0 fixes, and it is close
to a prerequisite for **J** and **M**.

---

## Tier 0 — the Rust is wrong, not merely unidiomatic

These produce code that does not compile, or compiles and does the wrong thing.
They are small, they need no IR, and they come first.

### A. An `@(optional)` parameter is `Option<Option<T>>`

**Where.** [`RangerRustClassWriter.rgr:2617–2640`](../../compiler/RangerRustClassWriter.rgr#L2628).

**Fix.** Drop `argOptional` and its two `wr.out` calls; `writeTypeDef` already
writes the `Option<…>`.

**Status: done.** With the outer wrap removed the compiler self-compiles and
`fn shown(maybe : Option<String>)`, `fn shownInt(a : Option<i64>)` and
`fn shownPoint(&self, mut p : Option<Rc<RefCell<Point>>>)` all come out singly
wrapped. The object case keeps the ownership model through the `Option` — the
`Option` outside the cell, the shape an optional field takes.

**Gate.** The old `attempts/02_optional_string_param.rgr` was promoted to
[`gallery/rustfriendly/src/10_optional_params.rgr`](../../gallery/rustfriendly/src/10_optional_params.rgr):
an optional string, scalar and object parameter in one program, compiled,
rustc-built and run by `compile.sh`.

### B. `try` / `throw` silently drops the catch

**Where.** [`Lang.rgr:5589`](../../compiler/Lang.rgr#L5589).

**Status: done.** A `try` whose catch block is non-empty is a compile error on
`-l=rust` until item **H** lands, worded so it names the replacement. The check
is `CheckTargetSupport` / `CheckNoLossyTry` in
[`compiler/FlowCollect.rgr`](../../compiler/FlowCollect.rgr), run from
`CollectMethods` before any desugaring, so nothing below that line can see the
form and write something else for it. `throw` on its own stays legal: `panic!`
is a faithful lowering of an uncaught throw. It is the dropped catch that
changes the meaning of the program.

```text
error: Ranger try/catch is not supported by the Rust target yet.
       The catch block would be silently dropped. Use Result-style error
       propagation (shape with Ok/Err cases) instead.
```

The study's ninth program is legal Ranger, compiles, rustc-accepts and dies at
runtime. A compile error costs one line in the error list and buys back the
class of bug the whole study was written to find.

**What turning it on found.** The compiler's own sources have **twelve** such
catch blocks, every one of them an `addError(…)` reporting a parse failure — so
the Rust rendering of the compiler has been answering those twelve failures with
a panic instead of an error list, all along. That is debt at twelve sites, not a
reason to let new code through, so `-rust-allow-dropped-catch` keeps the old
behaviour and prints each site, and the three `scripts/rust-selfhost-*.sh` pass
it with a comment naming this item. Removing the flag means porting those twelve
sites, and it is the first thing **H** makes possible.

**And one more, outside the compiler.** `from_string` in `lib/JSON.rgr` is
`@(throws)`, and its own comment says the catch block "is what a Ranger program
uses to notice bad input". So **JSON parsing has no error path at all on the
Rust target** — bad input panics. `tests/compiler-json.test.ts` builds its
fixture with the flag and a comment saying exactly this; its happy path (text
produced by `to_string` two lines earlier) is unaffected. Nothing else is: every
gallery program that is built to Rust by an npm script — `invaders`, `pong`,
`js_parser`, `ts_parser`, `jpeg_scaler`, `evg_component_tool`, `pptx_web`,
`evg_trace_cli` — came back with zero dropped catches.

**Gate.** [`gallery/rustfriendly/attempts/09_throw_panics.rgr`](../../gallery/rustfriendly/attempts/09_throw_panics.rgr),
which `compile.sh` now requires to be refused with this error.

### C. A `trait` used as a type emits an undefined type

**Where.** The `default` arm of `writeTypeDef`
([line 1036](../../compiler/RangerRustClassWriter.rgr#L1036)) asks
`tc.is_extended_by_children`. A class that `does` a trait does not set that on
the trait, so the trait name falls through to `getObjectTypeString` — a bare
`Named`.

**Fix.** Two steps, in this order:

1. *Done.* A compile error naming the trait and the spelling that does work:
   `Extends(Base)`, which emits a real Rust trait object. Silent broken output
   is the worst of the three outcomes. Gate:
   [`gallery/rustfriendly/attempts/04_trait_as_type.rgr`](../../gallery/rustfriendly/attempts/04_trait_as_type.rgr).
2. *After the lowering IR.* Item **I**.

The same hole is still open in the C++ writer — `std::shared_ptr<Named>` with no
`class Named` — and closing it there is the same one-line question in
`RangerCppClassWriter.writeTypeDef`.

---

## Tier 1 — where the "this was generated" signal actually lives

Ordered by payoff against risk. **D**, **E** and **F** need no new Ranger
syntax and no language change.

### D. Value semantics for shape case payloads

The §1 distinction, applied. `ParseOutcome_Err(Rc<RefCell<ParseOutcome_Err>>)`
becomes a plain variant, and a single-field case can drop its generated struct
entirely:

```rust
enum ParseOutcome {
    Ok(i64),
    Err(String),
}
```

Two steps, worth keeping apart because they have different blast radii. The
first — payload not behind a cell — is an ownership-analysis change shared with
C++, under the hot-copy caveat in §1. The second — a one-field case unwrapping
to its payload type instead of a generated struct — is a lowering change that
also rewrites every field read on a narrowed name (`t.body` becomes the pattern
binding), so it wants **E** first.

Fixes shapes, `Result`-shaped code, data-carrying enums and readability at once.

### E. `match` over a shape → a Rust `match`

**Where.** `expandMatchesInFn` /
[`expandMatch`](../../compiler/FlowShape.rgr#L1630) desugars `match` into a
chain of `is` narrowings *before any writer sees it*, and it already computes
whether the arms cover the shape. The `if let` chain the study quotes is what
survives that desugar; the exhaustiveness fact is computed and discarded.

**Fix.** Keep the match node intact for targets that have one (Rust, and
usefully Go/Swift/Kotlin), carrying the completeness verdict, and let the writer
emit real arms. Desugar only for targets without.

No new Ranger syntax: the compiler already knows the shape, its cases, the
narrowed names and exhaustiveness.

**Expression-form `match` is a separate change.** Statement-form arms are a
backend improvement and land here. A `match` that *yields a value* is a language
enhancement, and it is what `?` in **H** is built on — so it belongs with **H**,
not with this item.

### F. `Enum` → a real Rust `enum`

**Where.** Three sites:
[`writeTypeDef` case Enum:991](../../compiler/RangerRustClassWriter.rgr#L991),
[`WriteVRef`:1286](../../compiler/RangerRustClassWriter.rgr#L1286),
[`rustFieldIsCopyScalar`:2341](../../compiler/RustOwnership.rgr#L194).

**Emit.**

```rust
#[repr(i64)]
#[derive(Clone, Copy, PartialEq, Eq)]
enum Color { Red = 0, Green = 1, Blue = 2 }
```

`#[repr(i64)]` with explicit discriminants keeps the integer representation, so
Ranger's internal integer semantics need not change and `Color::Green as i64`
stays exact.

**What the emission does not make free.** Ranger source may do arithmetic on an
enum, index an array with one, use one as a map key, or round-trip one through
`@serialize`. `as i64` casts inserted at the integer-use sites cover arithmetic
and indexing; a map key and a serialize round trip need a conversion both ways.
So the work is at the *use* sites, not the three emission sites. Keep the `i64`
lowering as the per-enum fallback where the conversion is not available, and
print the verdict under `-strict-ownership` the way the sharing verdicts print,
so the fallback is visible rather than mysterious.

Removes the loudest generated-code artifact in studies 02, 03 and 09:
`colorName(c : i64)` becomes `colorName(c : Color)`.

### G. Reachability-driven helper emission

Study 07 is 16 lines of Ranger and 195 of Rust; 140 are `RgOrderedMap`,
`FxHasher` and string-index helpers the binary never calls. The rule should be
a closure, not a switch per helper:

```text
features used by the program → required helper set → transitive closure → emit
```

`anyWeakField` at [line 7601](../../compiler/RustClass.rgr#L773) is
that rule applied to one import; generalising it is the item. Cheap, and it is
the first screen of every generated file.

---

## Tier 2 — bigger shape changes

### H. A portable `Result<T, E>` and an error-propagation operator

The study's headline gap, with one correction to its framing. Do **not** define
it as *Rust `Result`, exception elsewhere*: those are different semantics, and
defining the portable type in terms of one target's exceptions makes it an
exception feature that happens to compile to `Result`.

Define it as a genuine portable value — `Result<T, E>` with `Ok<T>` and
`Err<E>` — and let each backend choose its representation: Rust and Swift use
the native type, everything else gets the generated tagged type the union path
already produces.

The propagation operator's semantics are portable and are the whole point:

```text
evaluate a Result<T, E>
  Ok  → produce T
  Err → immediately return Err from the current function
```

The surface spelling (`?(parseInt text)`, `(try? …)`, something else) is
secondary. On Rust it is `?`:

```rust
fn load_config(path: &str) -> Result<Config, String> {
    let text = read_file(path)?;
    let json = parse_json(&text)?;
    Ok(Config::new(json))
}
```

`?` needs an expression-position `match`, which is the language half of **E**.
This is the largest item in the document — a language change, a stdlib change
and a lowering per target — and nothing else here depends on it.

### I. Behaviour-only `trait` → Rust `trait`

The second half of **C**, and the item with the larger *idiom* payoff: it is
what makes a generated `.rs` a crate someone can depend on. Verified reachable
by the `Extends(Named)` equivalence above — mark a trait that is used as a type
the way a parent class with subclasses is marked, and the existing path emits
`pub trait NamedTrait`, `impl NamedTrait for User` and
`Rc<RefCell<dyn NamedTrait>>`.

The split is per trait, and it is the right one:

```text
behaviour-only trait (no fields)  → native Rust trait + impls
stateful trait (has fields)       → mixin expansion, as today
```

Follow-on: the emitted parameter is `Rc<RefCell<dyn NamedTrait>>` where a
read-only use wants `&dyn NamedTrait`. The borrow analysis that already produces
`&Point` should reach this.

### J. A handle/data split for shared classes

Today a shared class carries the cell in every signature and at every call site:

```rust
fn add(__self_rc: &Rc<RefCell<Counter>>, amount: i64) {
    __self_rc.borrow_mut().value += amount;
}
```

The Rust spelling of the same semantics is a cheap-clone handle wrapping the
data:

```rust
#[derive(Clone)]
pub struct Counter { inner: Rc<RefCell<CounterData>> }
struct CounterData { value: i64 }

impl Counter {
    pub fn add(&self, amount: i64)  { self.inner.borrow_mut().value += amount; }
    pub fn reading(&self) -> i64    { self.inner.borrow().value }
}
```

Ranger's aliasing semantics are unchanged, `a.add(1)` reads as ordinary Rust,
`__self_rc` disappears (the handle *is* the receiver), and a caller of the
generated crate never sees `Rc<RefCell<_>>`. The general rule becomes:

```text
class proven value-like     → struct Foo { … }                impl Foo
class needing shared identity → struct Foo { inner: Rc<RefCell<FooData>> }  impl Foo
```

This supersedes the older "`__self_rc` → associated function on the `Rc`" idea.

**Three things to settle before building it.** It is the highest-risk item in
this tier, and each of these is a design decision, not a detail.

- *Re-entrancy.* Borrows are created inside methods now, so a method that calls
  another method on the same object while a borrow is live panics at runtime
  where today's pre-evaluation machinery arranges the borrows at the call site.
  The lowering needs a rule — shortest-possible borrows, or a static check.
- *Trait objects.* `Rc<RefCell<dyn NamedTrait>>` from **I** and the handle are
  two different wrappings of the same idea; they have to become one.
- *Identity.* `identical` is `Rc::ptr_eq` today; through a handle it is
  `Rc::ptr_eq(&a.inner, &b.inner)`. Mechanical, but it touches the `RgIdentical`
  machinery at
  [line 834](../../compiler/RustClass.rgr#L834).

---

## Tier 3 — worthwhile, smaller, or later

### K. Fix the generated `for`, do not chase iterator chains

A loop that pushes is respectable Rust. The generated *shape* of the loop is
what reads as machine output:

```rust
let __n_i = (xs.len() as i64);
for i in 0..__n_i { let mut v = xs[i as usize]; … }
```

where the idiom is `for &v in xs` (or `for v in xs.iter().copied()`). This is a
lowering, not an abstraction: emit the iterator form when the index name is
never read in the body and the collection is not mutated in it, and keep the
index form otherwise. The analysis exists — the Swift writer answers exactly
this question for its bound names by walking the body with
`treeReferencesVRef` ([`LiveCompiler.rgr:1455`](../../compiler/LiveCompiler.rgr#L1455)),
and the Rust `for` template already hoists the bound into `__n_i` for a reason
that disappears in the iterator form.

Iterator *adapters* (`.filter(…).map(…).collect()`) stay below this: Ranger does
not need the whole `Iterator` abstraction to emit good Rust.

### L. `snake_case`

Already ranked in PLAN_RUST_IDIOMATICITY and already blocked on the same thing:
`@serialize(true)` derives its JSON keys from field names, so a rename pass
needs a serialization-name indirection that keeps the wire names stable across
every target. Symbol resolution staying tied to the Ranger declaration is the
easy half; the serialized names are the hard half. Unchanged by this study.

### M. Borrowed returns, without a user-visible lifetime system

The study records `fn first<'a>(x: &'a str) -> &'a str` as impossible because
Ranger has no lifetimes. Rust's elision rules mean many of these need no `'a` at
all:

```rust
fn first(s: &str) -> &str
impl Foo { fn name(&self) -> &str }
```

So the compiler needs return *provenance*, not lifetimes:

```text
return aliases a field of self            → borrowed from self
return aliases exactly one borrowed param → borrowed from that parameter
anything else, or more than one source    → owned value, as today
```

Only the genuinely ambiguous case (`fn choose(a: &str, b: &str) -> &str`) needs
a relationship Ranger cannot express, and it falls back to owned. This is a
constrained inference over the analysis that already produces `&Point` and
`&str` parameters.

**Interaction with J.** A `&self` method cannot return a reference out of a
`RefCell` borrow, so a handle-split class can only use this for data that is not
behind the cell. The two items constrain each other and should be designed
together.

### N. Standard-library traits: semantic interfaces, not magic names

`asString` silently meaning `Display` and `equals` silently meaning `PartialEq`
is brittle, and a Rust-specific `@(rust_trait "Display")` annotation is too
target-specific for the core language. The Ranger-shaped answer is a small set
of semantic interfaces the backends map:

| Ranger | Rust | Java | Swift |
| --- | --- | --- | --- |
| `Printable` | `Display` | `toString` | `CustomStringConvertible` |
| `Comparable` | `PartialOrd` / `Ord` | `Comparable` | `Comparable` |
| `Hashable` | `Hash` | `hashCode` | `Hashable` |
| `Iterable` | `Iterator` | `Iterable` | `Sequence` |

A design problem of its own. Explicitly **not** a blocker for **I** — a
generated trait is useful before it is `Display`.

### O. Preserved generics as a library mode

Monomorphizing `Stack@(int)` into `Stack_int` is a reasonable compilation
strategy and should stay the default. It is a problem only when the generated
Rust is itself meant to be a reusable crate. That is a different goal from
"compile my Ranger application to Rust", and it should be a different mode:

```bash
node bin/output.js -l=rust --library …
```

with public Rust names, preserved generics where representable, modules, a
public API surface, native traits, and no unused runtime helpers. Keeping the
two goals distinct is the point; the flag is the cheap part.

### P. Consuming `self`, and concurrency

`fn with_host(mut self, …) -> Self` needs a by-value receiver Ranger cannot
spell — a genuine semantic addition, not a lowering. `Arc` / `Mutex` / `Send` /
`async` are a separate concurrency design and are out of scope for this
document. Both recorded so they are decisions rather than omissions.

---

## Order of work

| # | Item | Size | Needs the IR? |
| --- | --- | --- | --- |
| P0 | **A** optional parameter | **done** | no |
| P0 | **B** refuse lossy `try` | **done**, flag for the compiler's own 12 sites | no |
| P0 | **C1** refuse trait-as-type | **done** | no |
| P1 | **D** value semantics for shape payloads | medium, shared with C++ | helps |
| P1 | **E** real `match` arms | medium | helps |
| P1 | **F** real `enum` + use-site casts | medium | no |
| P1 | **G** reachability-driven helpers | small | no |
| P2 | **H** portable `Result` + propagation | large, cross-target | no |
| P2 | **I** behaviour-only trait → Rust trait | medium | no |
| P2 | **J** handle/data split | large, highest risk | yes |
| P3 | **K** `for` lowering | small | no |
| P3 | **L** snake_case | blocked on serialize names | no |
| P3 | **M** borrow-provenance inference | medium | yes |
| P4 | **N** semantic interfaces | design | no |
| P4 | **O** library mode | medium | no |
| P4 | **P** consuming `self`, concurrency | language | no |

P0 is in, and it removed the three footguns the study walked into — two of which
it had recorded as something milder than they were. The
striking thing about P1 is that none of it needs new Ranger syntax: **D**, **E**,
**F** and **G** are backend decisions about values, borrows, identity and native
control flow. If P0 and P1 land, the study's verdict moves from *working Rust,
but obviously generated* to something close to *ordinary Rust generated from
portable Ranger semantics* — without Ranger becoming a way to write Rust.

## Gate

**Done, and it is where the rest of this plan is checked.**
`npm run rustfriendly:test` compiles each of the ten studies, `rustc`s it and
runs the binary — and then requires every file in `attempts/` to be *refused*,
with the error that file declares on its first line:

```text
; EXPECT-ERROR: <substring the compiler must print>
```

That second half is the rule P0 exists to enforce: a form the target cannot
express has to be a compile error naming the limitation, never a binary that
panics and never Rust that does not exist. Two of the three attempts were the
other thing until P0 landed.

Each later item should arrive with its study: **F** with an `Enum` used as a
value and as an integer, **E** with a `match` whose arms cover the shape and one
whose arms do not, **D** with a `Result`-shaped union in a hot loop (the O(len)
copy §1 warns about), **J** with two names for one shared object across a method
that calls another method on it.

## How to check

```sh
npm run compile
npm run rustfriendly:test        # ten studies built and run, three attempts refused
npm run test:rust
npx vitest run --config tests/vitest.config.ts codegen-rust.test.ts
bash scripts/rust-selfhost-check.sh
```

Known-red at the time of writing, and none of it from this plan: 19 tests across
`ranger-engine` (13), `codegen-rust` (2, `format!` flattening),
`compiler-ownership` (2), `engine-imports` (1) and `ts-to-ranger-native` (1),
plus 9 rustc errors from `rust-selfhost-check.sh`. Every one of those counts is
identical with and without the P0 changes, checked by rebuilding from
`origin/master` and re-running.

Related: [`gallery/rustfriendly/README.md`](../../gallery/rustfriendly/README.md),
[PLAN_RUST_IDIOMATICITY.md](PLAN_RUST_IDIOMATICITY.md),
[PLAN_RUST_OWNERSHIP.md](PLAN_RUST_OWNERSHIP.md), [PLAN_SHAPES.md](PLAN_SHAPES.md).
