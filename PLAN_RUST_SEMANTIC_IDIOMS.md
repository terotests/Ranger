# PLAN_RUST_SEMANTIC_IDIOMS — closing the semantic gap the rustfriendly study found

`gallery/rustfriendly` (PR #1010) asks a question
[PLAN_RUST_IDIOMATICITY](PLAN_RUST_IDIOMATICITY.md) did not: that plan measured
*texture* — clippy warnings, casts, `return` vs tail expression — and drove it
from 1395 warnings to 0. The study asks whether the Rust **says what a Rust
programmer would say**, and the answer is a different list: no `Result`, no
`?`, a C-style `Enum` that is an `i64`, a `trait` that is a mixin, `match` as a
chain of `if let`, a 140-line map preamble in a program with no map.

This plan re-verifies the study's claims against the compiler on this machine,
corrects three of them, and ranks the work by what it costs against what it
unlocks.

## Verification — what the study got right, and what it under-reported

Everything below was reproduced against `master` (1351dee) with
`node bin/output.js -l=rust` and `rustc 1.94.1`.

**Confirmed as written.** `Enum` is `i64` at
[`ng_RangerRustClassWriter.rgr:991`](compiler/ng_RangerRustClassWriter.rgr#L991)
and the tag name is substituted for its integer at line 1475. `try` writes the
try block and a comment where the catch belongs
([`Lang.rgr:5589`](compiler/Lang.rgr#L5589)); `throw` is `panic!`
([`Lang.rgr:5547`](compiler/Lang.rgr#L5547)). The `FxHasher` / `RgOrderedMap`
preamble at
[`ng_RangerRustClassWriter.rgr:7753`](compiler/ng_RangerRustClassWriter.rgr#L7753)
is emitted unconditionally — the file already gates `use std::rc::Weak;` on
`anyWeakField` in the same header writer
([line 7601](compiler/ng_RangerRustClassWriter.rgr#L7601)), so the pattern for
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
   ([line 978](compiler/ng_RangerRustClassWriter.rgr#L978)); the parameter
   emitter wraps the call in a second one
   ([lines 3676–3692](compiler/ng_RangerRustClassWriter.rgr#L3676)). Deleting
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
   [`ng_RangerRustClassWriter.rgr:1047`](compiler/ng_RangerRustClassWriter.rgr#L1047).

**Unrelated, found while checking.** Two tests in `codegen-rust.test.ts` fail on
`master` — *inlines literals into the println! format string* and *flattens a
string chain into one format!*. They predate anything here.

## Tier 0 — the Rust is wrong, not merely unidiomatic

These three produce code that does not compile, or compiles and does the wrong
thing. They are small and they come first.

### A. An `@(optional)` parameter is `Option<Option<T>>`

**Where.** [`ng_RangerRustClassWriter.rgr:3676–3692`](compiler/ng_RangerRustClassWriter.rgr#L3676).

**Fix.** Drop `argOptional` and its two `wr.out` calls; `writeTypeDef` already
writes the `Option<…>`.

**Status: written and verified.** With the six lines removed, the compiler
self-compiles, `fn shown(maybe : Option<String>)`, `fn shownI(a : Option<i64>)`
and `fn shownO(&self, mut p : Option<Point>)` all come out singly wrapped, the
binary from `attempts/02_optional_string_param.rgr` builds and prints `ada`,
and `compiler-rust.test.ts` + `codegen-rust.test.ts` show the same 60 pass / 2
fail as the unpatched baseline.

**Regression test.** A fixture with an optional scalar, string and object
parameter, asserting no `Option<Option`.

### B. A `trait` used as a type emits an undefined type

**Where.** The `default` arm of `writeTypeDef`
([line 1036](compiler/ng_RangerRustClassWriter.rgr#L1036)) asks
`tc.is_extended_by_children`. A class that `does` a trait does not set that on
the trait, so the trait name falls through to `getObjectTypeString` — a bare
`Named`.

**Fix.** Two steps, in this order:

1. *Today.* Make it a compile error: a parameter, field, return or local typed
   by a `trait` on `-l=rust` should name the trait and say the target cannot
   express it. Silent broken output is the worst of the three outcomes.
2. *Then.* Mark a trait that is used as a type the same way a parent class with
   subclasses is marked, and let the existing path emit
   `pub trait NamedTrait`, `impl NamedTrait for User` and
   `Rc<RefCell<dyn NamedTrait>>`. Verified reachable by the `Extends(Named)`
   equivalence above. A field-bearing trait keeps its mixin lowering for the
   field copies; only the *type* use needs the vtable.

This also closes the same hole in the C++ writer.

### C. `try` / `throw` silently drops the catch

**Where.** [`Lang.rgr:5589`](compiler/Lang.rgr#L5589).

**Fix now.** Refuse it. A `try` whose catch block is non-empty is a compile
error on `-l=rust` until item **D** lands. The study's ninth program is legal
Ranger, compiles, rustc-accepts and dies at runtime — a compile error costs one
sentence in the error list and buys back the class of bug the whole study was
written to find.

**Cost.** One template arm plus an error in the flow parser. Do not wait for D.

## Tier 1 — the semantics that unlock the idiom

### D. `Result<T, E>` and `?`

The study's own item 1, and the largest. The shape machinery is most of it: a
`shape` already lowers to a real Rust `enum`
([line 7623](compiler/ng_RangerRustClassWriter.rgr#L7623)) with one variant per
case, and `match` over it is exhaustiveness-checked at desugar time
([`ng_RangerFlowParser.rgr:7029`](compiler/ng_RangerFlowParser.rgr#L7029)).

**Design sketch.** A `shape` annotated `@(result)` with exactly two cases, or a
first-class `Result` in `stdlib.rgr` built on the same union path, lowers to:

| target | lowering |
| --- | --- |
| rust | `Result<T, E>`, `?` on an `@(throws)` call, `Ok(v)` tail |
| es6 / python / php | thrown value, the spelling `try` has today |
| go | `(T, error)` |
| c++ / java / c# | the existing union, or the target's exception |

`?` needs an expression-position `match` — which is item **G** — so G is on D's
critical path, not independent of it.

**Cost.** The largest item in this plan. It is a language change, a stdlib
change and ten target lowerings. Nothing else here needs it.

### E. Behaviour-only `trait` → Rust `trait`

Covered by **B2**. Listed separately because the *idiom* payoff is larger than
the bug fix: it is what makes a generated `.rs` a crate someone can depend on.
Follow-on, once `dyn NamedTrait` is reachable: a way to say "this method is
`Display`" / "`PartialEq`" / "`From`", so `asString` and `equals` land as
`impl Display` and `impl PartialEq` rather than inherent methods.

A second follow-on: the emitted parameter is
`Rc<RefCell<dyn NamedTrait>>` where a read-only use wants `&dyn NamedTrait`.
The borrow analysis that already produces `&Point` should reach this.

### F. `Enum` → a real Rust `enum`

**Where.** Three sites:
[`writeTypeDef` case Enum:991](compiler/ng_RangerRustClassWriter.rgr#L991),
[`WriteVRef`:1475](compiler/ng_RangerRustClassWriter.rgr#L1475),
[`rustFieldIsCopyScalar`:2341](compiler/ng_RangerRustClassWriter.rgr#L2341).

**Why it is not a one-liner.** Every target lowers `Enum` to an integer, and
Ranger source may do arithmetic on one, index an array with one, use one as a
map key, or round-trip it through `@serialize`. A Rust `enum` supports none of
those without casts.

**Design.** A conservative per-enum analysis, in the shape of the existing
class-sharing analysis: emit `#[repr(i64)] #[derive(Clone, Copy, PartialEq, Eq)]
enum Color { Red = 0, Green = 1, Blue = 2 }` and `Color::Green` **only** when no
site in the program does arithmetic on, casts, indexes by, or serializes a value
of that enum; otherwise keep `i64`. Print the verdict under `-strict-ownership`
the way the sharing verdicts print, so the fallback is visible rather than
mysterious.

**Payoff.** The loudest "this was generated" tell in studies 02, 03 and 09, and
`colorName(c : i64)` becomes `colorName(c : Color)`.

### G. `match` over a shape → a Rust `match`

**Where.** `expandMatchesInFn` /
[`expandMatch`](compiler/ng_RangerFlowParser.rgr#L7029) desugars `match` into a
chain of `is` narrowings *before any writer sees it*, and it already computes
whether the arms cover the shape. The `if let` chain the study quotes is what
survives that desugar; the exhaustiveness fact is computed and discarded.

**Fix.** Keep the match node intact for targets that have one (Rust, and
usefully Go/Swift/Kotlin), carrying the completeness verdict, and let the writer
emit real arms. Desugar only for targets without.

**Payoff.** The tell in three of the nine studies, and — crucially — the
prerequisite for `?` and for match-as-expression in **D**.

## Tier 2 — emission quality

### H. No map preamble in a program with no map

Study 07 is 16 lines of Ranger and 195 of Rust; 140 are `RgOrderedMap`,
`FxHasher` and string-index helpers the binary never calls. Gate the block at
[line 7753](compiler/ng_RangerRustClassWriter.rgr#L7753) on "the program
declares a hash type or calls a map operator", exactly as `anyWeakField` gates
`use std::rc::Weak;` at line 7601 of the same writer. Cheap, and it is what a
reader sees in the first screen of every generated file.

### I. A `String` payload can ride inside a union variant

`ParseOutcome_Err` holds one `string`, so it is
`ParseOutcome_Err(Rc<RefCell<ParseOutcome_Err>>)`. The rule is deliberate
([`ng_StaticAnalysis.rgr:2169`](compiler/ng_StaticAnalysis.rgr#L2169)): a
by-value `String` variant makes every enum clone copy the payload, and a Ranger
union value passes by clone. That reasoning is sound for a union that is cloned
in a loop and wrong for a `Result` returned once.

**Fix.** Let the existing sharing analysis answer it instead of the blanket
rule: a case never aliased under two names and never mutated through one rides
in the variant by value, `String` payload and all. This is the same question
`markClassShared` already answers for every other class.

### J. `snake_case`

Already ranked in PLAN_RUST_IDIOMATICITY and already blocked on the same thing:
`@serialize(true)` derives JSON keys from field names, so a rename pass needs a
serialization-name indirection. Unchanged by this study; listed so the two plans
agree.

### K. `__self_rc` → an associated function on the `Rc`

`fn adopt(&mut self, __self_rc : &Rc<RefCell<TreeNode>>, …)` is two views of one
object. The Rust spelling is `fn adopt(this: &Rc<RefCell<Self>>, …)`. Cosmetic
while the signatures are internal; it matters the moment **E** makes a generated
file a crate surface.

### L. Iterator adapters

`for` stays a `for`. But `map` / `filter` / `reduce` with a pure expression body
can lower to `.iter().map(…).collect()`. The stdlib already has those methods on
the array class. Lowest payoff-per-risk item in this plan; do it last.

## Tier 3 — language surface, only if wanted

- **Free generic functions.** `fn identity@params(T):T (x:T)` is rejected today
  (`attempts/06_generic_function.rgr`). Monomorphized classes work; free
  functions do not.
- **`@params` kept as Rust generics.** `struct Stack<T>` instead of
  `Stack_int` / `Stack_string`. Needed for the output to be a library rather
  than a program.
- **By-value `self`.** The consuming builder (`fn with_host(mut self) -> Self`)
  needs a method receiver Ranger cannot spell. The mutating-and-cloning form the
  study found is correct but is neither Rust builder idiom.
- **Borrowed returns / lifetimes.** `Option<&T>`, `&str` slices of an argument.
  Probably out of scope for a portable language; recorded so it is a decision
  rather than an omission.

## Order of work

| # | Item | Size | Unlocks |
| --- | --- | --- | --- |
| 1 | **A** optional parameter | 6 lines, verified | every optional-parameter program |
| 2 | **C** refuse lossy `try` | one template + one error | stops shipping wrong binaries |
| 3 | **H** gate the map preamble | one condition | every generated file's first screen |
| 4 | **B** trait-as-type: error, then `dyn` | small, then medium | E; fixes broken output |
| 5 | **G** real `match` | medium | D; three of nine studies |
| 6 | **F** real `enum` | medium + analysis | three of nine studies |
| 7 | **I** `String` in a variant | small, reuses sharing analysis | `Result`-shaped code |
| 8 | **D** `Result` + `?` | large, cross-target | the study's headline gap |
| 9 | **E** std traits, **K**, **L** | medium | crate-quality output |

Items 1–3 are a day and remove the two footguns the study walked into. Items
4–7 are where the "this was generated" signal actually lives. Item 8 is the
language change, and it should start only once 5 has given it an expression
`match` to build `?` on.

## Gate

None of the nine study programs is built by any test — `compile.sh` is run by
hand, and the checked-in `generated/*.rs` snapshots will rot. Before any item
above lands, wire `bash gallery/rustfriendly/compile.sh` into the test scripts
(it already fails on a Ranger `[FAIL]`, on `rustc`, and on a wrong line of
output), and add the three `attempts/` programs as negative cases: each should
be a *compile error* naming the target limitation, never a binary that panics.
That turns the study from a snapshot of one afternoon into the regression suite
for this plan.

## How to check

```sh
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
  node bin/output.js -es6 ./compiler/ng_Compiler.rgr -nodecli -d=./bin -o=output.js
node bin/output.js -l=rust ./gallery/rustfriendly/attempts/02_optional_string_param.rgr \
  -d=./tmp/rusteval -o=opt.rs
rustc --edition 2021 ./tmp/rusteval/opt.rs -o ./tmp/rusteval/opt.bin && ./tmp/rusteval/opt.bin
bash gallery/rustfriendly/compile.sh
npx vitest run --config tests/vitest.config.ts compiler-rust.test.ts codegen-rust.test.ts
```

Related: [`gallery/rustfriendly/README.md`](gallery/rustfriendly/README.md),
[PLAN_RUST_IDIOMATICITY.md](PLAN_RUST_IDIOMATICITY.md),
[PLAN_RUST_OWNERSHIP.md](PLAN_RUST_OWNERSHIP.md), [PLAN_SHAPES.md](PLAN_SHAPES.md).
