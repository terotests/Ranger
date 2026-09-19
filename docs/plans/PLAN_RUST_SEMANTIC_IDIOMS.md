# PLAN_RUST_SEMANTIC_IDIOMS — closing the semantic gap the friendly study found

> **Status: P0 landed. P1: D, E, F, G done. P2: I done, H and J open.
> P3: K and L done, M open. P4: O done for its public-surface half.** The three
> correctness items — **A**, **B**, **C1** — are in, with the gallery study as
> their gate (`bash gallery/friendly/compile.sh`). The rest is parked: the ownership
> vocabulary of §1, the handle/data split (**J**) and the borrow-provenance
> inference (**M**) are cheap inside a lowering IR and expensive as further
> text-template special cases, so the refactor changes their cost, not just their
> timing.
>
> Re-verified after the refactor that split the Rust writer by question
> (`RustCall` / `RustClass` / `RustOperators` / `RustOwnership` / `RustUnion`):
> all three bugs were still live in the new layout, and the split changed none of
> the study's `generated/*.rs` by a byte.

The Rust study in `gallery/friendly` (PR #1010) asks a question
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
[`gallery/friendly/src/10_optional_params.rgr`](../../gallery/friendly/src/10_optional_params.rgr)
— a shared study, so all ten targets build it and six of them run it. All six
print the same four lines.

**And it found the same class of bug on C++.** `r_optional_primitive<T>` is the
C++ shape of an optional scalar, and its definition lived only on the `str2int`
operator's polyfill — so a program with an optional scalar parameter or return
that never called `str2int` emitted the type and never declared it
(`error: 'r_optional_primitive' has not been declared`). The gallery had been
working around it with a `str2int` helper in `src/06_generics.rgr` that nothing
called. The definition is now emitted where the type is
([`RangerCppClassWriter.cppEmitOptionalPrimitive`](../../compiler/RangerCppClassWriter.rgr)),
keyed on the same text so it never doubles up with the operator's copy, and the
dummy helper is gone.

**One C++ divergence this study records and does not fix.** An optional `string`
on C++ is a plain `std::string` at every position — field, local and parameter —
and `null?` on one is an emptiness test. A program that stores `""` in an
optional reads it back as absent: `PRESENT[]` on every other target, `ABSENT` on
C++. That is the only place in the ten studies where the same Ranger prints a
different answer, and no study catches it, because study 10 passes a non-empty
string. Closing it means giving C++ `std::optional` for strings, which is
`gallery/friendly/cpp/README.md` item 4, not this plan.

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

**Gate.** [`gallery/friendly/rust/attempts/09_throw_panics.rgr`](../../gallery/friendly/rust/attempts/09_throw_panics.rgr),
which `compile.sh` now requires to be refused with this error.

**Swift and Kotlin have the same shape of problem**, per the sibling studies:
`throw "negative"` is not a `Error` / `Throwable` there, so the file does not
compile — which at least fails loudly. C++ catches with `catch(...)` and loses
`error_msg`. The rule this item establishes is target-independent: refuse what
the target cannot express until it can.

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
   [`gallery/friendly/rust/attempts/04_trait_as_type.rgr`](../../gallery/friendly/rust/attempts/04_trait_as_type.rgr).
2. *After the lowering IR.* Item **I**.

The same hole is still open in the C++ writer — `std::shared_ptr<Named>` with no
`class Named` — and closing it there is the same one-line question in
`RangerCppClassWriter.writeTypeDef`.

---

## Tier 1 — where the "this was generated" signal actually lives

Ordered by payoff against risk. **D**, **E** and **F** need no new Ranger
syntax and no language change.

### D. Value semantics for shape case payloads

**Status: done for the payload half, on Rust, under a mutation guard.** A
`string` payload rides inside the variant, so a `Result`-shaped shape reads as

```rust
pub enum union_ParseOutcome {
    ParseOutcome_Ok(ParseOutcome_Ok),
    ParseOutcome_Err(ParseOutcome_Err),
}
```

rather than an `Err` behind `Rc<RefCell<…>>`. Collections, maps, optionals and
object fields stay behind the cell: those are the payloads whose copies are
unbounded.

**What changed the answer was E.** The old rule — a `string` is not scalar, so
the case is shared — existed because a by-value `String` variant made every copy
of the union copy the payload, and the copy that hurt was the *kind check*:
`case` cloned the scrutinee to match it, so asking "which case is this" on a
40 KB accumulator was O(len). On Rust it no longer does. A shape `match` is a
real `match` over a reference and a hand-written `case` is an `if let` over one;
neither clones. The Rust rendering of the compiler has **zero** clone-at-kind-check
sites left. What remains are the copies a Ranger program actually asks for — an
assignment, an argument, a return — where a `String` costs exactly what a
`String` field costs anywhere else in the generated code.

The C++ writer keeps its own rule (`cppUnionValueCase`), because nothing changed
there: its `case` still copies to test.

**The guard, and why the counters could not be it.** A case whose narrowed
binding is *mutated* has to keep the cell: `case v s:EvalValue.String {
str_append s.value x }` works through `borrow_mut` and cannot work in the
variant, where the match binds `&EvalValue_String`. `prop_assign_cnt` does not
see it (the mutation is an operator, not an `=`) and `set_cnt` counts the
constructor's own initialisation, so neither counter answers the question. The
guard is a scan: does any mutating operator have a target whose path is *rooted*
at a name of this case type. Rooted matters — the target is `s.value`, whose own
type is `string`; the type that decides is `s`'s.

**Still open: the second step.** A one-field case unwrapping to its payload type
— `Ok(i64)` rather than `Ok(ParseOutcome_Ok)` — is a lowering change that also
rewrites every field read on a narrowed name, and it is what would make this
read as `Result<i64, String>` rather than as a two-variant enum of structs.

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

**Status: done.** `describe` on study 03 is now

```rust
match &m {
  union_Message::Message_Ping(__match0) => { out = "ping".to_string(); }
  union_Message::Message_Text(t)        => { out = format!(…); }
  union_Message::Message_Move(mv)       => { out = format!(…); }
}
```

with no wildcard, because the arms cover the enum. The Rust rendering of the
compiler carries **91** of these and no `if let union_` at all.

The desugar still runs — it is what the other nine targets need — but it now
marks the run it produces: `match_head` on the first narrowing, `match_arm` on
each, `match_tail` on the last, and `match_total` when the arms cover the whole
generated enum rather than just a group. The Rust `case` template hands off to
[`RustUnion.rustWriteUnionCase`](../../compiler/RustUnion.rgr), which reads the
marks and emits either an arm or the `if let` a hand-written `case` still gets.
The binding and the forked scope are already in place by then: `case` is
declared `_@(newcontext):void (arg@(union):T item@(define):T code:block)`, so
the generic machinery has declared the narrowed name before any template or
custom runs.

**Expression-form `match` is still open**, and it is what `?` in **H** needs.
This item is the statement form.

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

**Status: done, conservatively.** `colorName(c : i64)` is `colorName(c : Color)`
and `Color.Green` is `Color::Green`. The analysis is per enum and the fallback
is the old `i64` lowering, so the worst case is exactly today's output. Under
`-strict-ownership` each enum prints its verdict and, when it falls back, why:

```text
enum[rust] RangerAnnType -> Rust enum
enum[rust] RangerNodeType -> i64 (a field of an @serialize class)
```

The safe uses are a declaration of that type, an `Enum.Member` reference,
`==` / `!=`, an assignment, a `switch`/`case`, and a `return`. Everything else
falls back. Two things the analysis had to learn:

- An enum-typed node that names no enum counts against *every* enum, because
  the writer cannot say which one it is. Resolving it through `eval_type_name`
  and the param desc first is what took the compiler's own enums from
  "all i64" to seven of eight native.
- **A `switch` whose case labels name a different enum than the scrutinee.**
  `RangerAppParamDesc.getVarTypeName` in this compiler switched on a
  `RangerNodeRefType` field and labelled its arms `RangerContextVarType.NoType`
  / `.This` — so the second arm answered "This" for a **Weak** reference. It
  compiled on every target because both enums are integers and the members
  happened to line up. A Rust enum has no such coincidence. The analysis now
  refuses both enums on a mismatch, and the compiler's own slip is fixed.

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

**Status: done.** Study 07 was 16 lines of Ranger and 194 of Rust; 140 were
`RgOrderedMap`, `FxHasher` and string-index helpers the binary never calls. It
is **82** lines now. Across the ten studies the Rust output fell by roughly 40%:

```text
01_ownership   251 -> 150     06_generics       213 -> 112
02_option      281 -> 180     07_slices         194 ->  82
03_enums       278 -> 177     08_builder        231 -> 130
04_traits      196 ->  95     09_errors         256 -> 155
05_iterators   207 -> 106     10_optional_params 195 ->  94
```

Two families are gated independently: the map preamble, and the three
character-indexing string helpers. The scan is in
[`RustClass.rustHeaderHelperNeeds`](../../compiler/RustClass.rgr). Three things
it had to learn, each of which silently broke a first attempt:

- A class the file never writes cannot reach a helper, and the operator and
  template classes of `Lang.rgr` / `stdops.rgr` declare maps all over — so an
  unfiltered scan says every program needs the preamble. That is how it came to
  be in every file in the first place. `Map` itself is a *trait* class here.
- `def m:[string:int]` is rewritten by `CollectMethods` into `new Map@(string
  int)` with `value_type` VRef, so the `key_type` is gone from the name node by
  the time a writer sees it; the class name is the signal that survives.
- `sfn` lands in `static_methods`, not `methods`. A program whose only entry
  point is `sfn m@(main)` has an *empty* `methods` list, so the first version
  answered "no map" for a program that is nothing but a map.

The rule should be a closure, not a switch per helper:

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

**Status: done, by route (2).** A behaviour-only Ranger trait — methods and no
fields — is now a real Rust trait:

```rust
pub trait NamedTrait: RgAnyRef { fn label(&mut self) -> String; }
impl NamedTrait for User { … }
impl NamedTrait for Bot  { … }
fn show(mut n : Rc<RefCell<dyn NamedTrait>>) -> String
```

rustc-clean, and [`rust/src/11_behaviour_traits.rgr`](../../gallery/friendly/rust/src/11_behaviour_traits.rgr)
runs it — two traits on one class, a `dyn` parameter, dispatch over two
implementors.

**Route (1) does not work, and it is worth saying why.** Marking the trait the
way `Extends(Base)` marks a parent (`is_extended_by_children` plus the consumers
in `child_classes`) is enough to get the *type* right on its own. Letting the
trait class through `VirtualCompiler`'s class-writing loop to get the
declaration is not: `writeClass` expects a `class` node, and a `trait` node
walks out as raw tokens — `r#traitNamedr#fnlabelr#return"anon"`.

So the declaration is emitted from the Rust header instead, from the same descs
and with the same receiver rules `writeClass` uses for a parent class, and the
consumers' `impl`s come from `writeClass` by walking `consumes_traits` beside
`extends_classes`. `impl RgAnyRef` follows the same widening.

A trait that **carries fields** stays a pure mixin and using it as a type is
still the compile error from **C1**: its fields are copied into each consumer
and Rust has no associated fields to hold them.
[`attempts/04_trait_as_type.rgr`](../../gallery/friendly/rust/attempts/04_trait_as_type.rgr)
is that case, and the gate still requires it to be refused.

**The same hole is still open on C++**, for both kinds of trait: that writer
emits `std::shared_ptr<Named>` and never declares `Named`. That is why study 11
lives under `rust/src` rather than the shared `src/` — `compile.sh` compiles a
target-local `src/` alongside the shared one.

The item with the larger *idiom* payoff: it is
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

**Status: done.** `for v in xs.iter().copied()` where the element is a Copy
scalar, `.cloned()` otherwise, and the index form only where it is still needed.
On the Rust rendering of the compiler that is **833 iterator loops to 507 index
loops**, from 1340 index loops and none.

Both forms bind an *owned* value, which is what makes the rewrite safe rather
than merely shorter: the index loop wrote `let mut v = xs[i]` for a Copy scalar
and `xs[i].clone()` otherwise, and `.copied()` / `.cloned()` bind exactly the
same thing. Binding `&T` with a bare `.iter()` is what a human writes, but it
changes every use of the name in the body — a different change.

The index form stays when the body reads the index, or when it touches the
collection at all. That second test has to cover every name the collection
expression rests on, not just its last segment: `for lctx.ownedLocals …` rests
on `lctx`, and a body that passes `lctx` on mutably is a borrow error even
though it never says `ownedLocals`. Testing only the tail segment let five such
loops through and cost five rustc errors on the selfhost build.

Two things the first attempt got wrong, both invisible in the studies and both
loud on the compiler's own 81 000 lines:

- `(e N)` is not a bare `WalkNode`: it brackets the walk with `setInExpr`.
  Without that a call operand is written as a *statement*, so
  `(xs.allExamples(doc).len() as i64)` came out as `(self.allExamples(doc);`.
- A bound name has to go through the walker, not out as a raw `vref`. A Ranger
  local may be called `fn`, and `let mut fn = …` does not parse — the
  reserved-word renaming lives in the walker.


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

**Status: done, and `#![allow(non_snake_case)]` is gone.** `parseInt` is
`parse_int`, `evenCount` is `even_count`. The 81 000-line Rust rendering of this
compiler draws **zero** naming warnings with the allow taken away.

**The documented blocker does not hold.** `@serialize(true)` was said to tie the
JSON keys to the field names, so a rename would move the wire format. It does
not: the serializer generates a Ranger `toDictionary` that writes `pvar.name` —
the name *as written* — as the key, and the field access beside it goes through
the same rename as every other access. The wire format is tied to the source
name, not the emitted one.

**What made it one change rather than two.** A `.` path segment can be a field
or a method and the writer often cannot tell which where it writes one. That
stops mattering when both are renamed the same way, so this is a single
transform at a single place — `adjustType`, which in this writer is called only
for identifiers. Three things it had to learn, each caught by the selfhost
build:

- **Type names are not identifiers.** The first segment of a static path is a
  class, and the desc carries it in `compiledName` like anything else, so
  `InputFSFolder.fromDictionary` became `input_fs_folder::from_dictionary` —
  which rustc reads as a module. 1278 errors. A name that is a declared class
  keeps its spelling.
- **One definition site emitted a method name raw.** Every call went through
  `adjustType`; the static-method *declaration* did not, so the calls could not
  find what they named. 889 errors. The constructor's parameter list was the
  same kind of miss.
- **Two Ranger names can snake_case to one.** `FlowStdMatch` has a local
  `pluginFn` assigned into an outer `plugin_fn`, and renaming the first gave
  `plugin_fn = plugin_fn.clone()` — a variable shadowing itself. That is the one
  way this transform can change the meaning of a program rather than fail, so a
  name whose snake_case form is already a name somewhere in the program keeps
  its spelling. One site in 81 000 lines, and it would have been silent if both
  had been mutable.

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

### O. A library mode — partly done

**Status: the mode exists; generics and modules are not in it.**
`-rust-library` says the generated `.rs` is a crate someone depends on rather
than a program to run: every struct, field and method is `pub`, and there is no
crate `main` — the entry body becomes `pub fn __rg_main_body()`, so the file can
be a `lib.rs`. All eleven Rust studies build under
`rustc --crate-type=lib` with zero errors, and `compile.sh` checks that on
every run. The default build is byte-identical to before.

Two of the things this mode wanted arrived as their own items and are on by
default: no unused runtime helpers (**G**) and native traits (**I**).

**Not in it, and the reason each is its own change.** Preserved `@params` as
Rust generics — `Stack<T>` instead of `Stack_int` / `Stack_string` — is a
monomorphisation change, not an emission one. Modules need a notion of
file-scoped visibility Ranger does not have. Both stay below.

### O-rest. Preserved generics

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
| P1 | **D** value semantics for shape payloads | **done** for the payload half | helps |
| P1 | **E** real `match` arms (statement form) | **done** | helps |
| P1 | **F** real `enum` + use-site casts | **done** | no |
| P1 | **G** reachability-driven helpers | **done** | no |
| P2 | **H** portable `Result` + propagation | large, cross-target | no |
| P2 | **I** behaviour-only trait → Rust trait | **done** | no |
| P2 | **J** handle/data split | large, highest risk | yes |
| P3 | **K** `for` lowering | **done** | no |
| P3 | **L** snake_case | **done**, allow dropped | no |
| P3 | **M** borrow-provenance inference | medium | yes |
| P4 | **N** semantic interfaces | design | no |
| P4 | **O** library mode (public surface) | **done**; generics/modules not | no |
| P4 | **P** consuming `self`, concurrency | language | no |

**Where this stands.** P0 removed the three footguns the study walked into, two
of which it had recorded as something milder than they were. **P1 is complete**
— the generated file is ~40% shorter (**G**), a Ranger `Enum` that can be one is
a Rust `enum` (**F**), a `match` over a shape is a `match` (**E**), and a
`string` payload rides in the variant (**D**). **I** (P2), **K** and **L** (P3)
and the public-surface half of **O** (P4) are in as well, and
`#![allow(non_snake_case)]` is gone.

Each was verified the same way: the selfhost build stays at its 9 pre-existing
rustc errors, all ten `friendly` targets compile and run, the gallery programs
build clean, and the suite matches `origin/master` once the tests that asserted
camelCase names were updated to the names the target now emits.

Three of the four remaining items are not emission work. **H** is a language
change across ten targets and wants an expression `match` first. **J** and **M**
are the two items §1 says are cheap inside a lowering IR and expensive without
one, and **J** has three design questions open besides. **N** and **P** are
design and language work. What is left that is *not* in that class: the second
step of **D** (a one-field case unwrapping to its payload), and preserved
generics and modules under **O**.

The
striking thing about P1 is that none of it needs new Ranger syntax: **D**, **E**,
**F** and **G** are backend decisions about values, borrows, identity and native
control flow. If P0 and P1 land, the study's verdict moves from *working Rust,
but obviously generated* to something close to *ordinary Rust generated from
portable Ranger semantics* — without Ranger becoming a way to write Rust.

## Gate

**Done, and it is where the rest of this plan is checked.**
The study moved to [`gallery/friendly`](../../gallery/friendly/README.md), where
the same ten `src/` programs are compiled to ten targets and the Rust study is
one of them. `bash gallery/friendly/compile.sh rust` compiles each study,
`rustc`s it and runs the binary — and then requires every file in
`rust/attempts/` to be *refused*, with the error that file declares on its first
line:

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

Because `src/` is shared, each of those lands on all ten targets at once, and
that is the point: the optional-parameter study was written for Rust and found
the same class of bug on C++ the first time it ran there. A Rust-only fixture
would not have.

## How to check

```sh
npm run compile
bash gallery/friendly/compile.sh rust   # ten studies built and run, three attempts refused
bash gallery/friendly/compile.sh        # all ten targets
npm run test:rust
npx vitest run --config tests/vitest.config.ts codegen-rust.test.ts
bash scripts/rust-selfhost-check.sh
```

Toolchains on the machine this was last run on: node, python3, go, g++, javac,
rustc. `swiftc`, `kotlinc`, `dart` and `mcs` were absent, so those four targets
were checked as writer output only.

Known-red at the time of writing, and none of it from this plan: 19 tests across
`ranger-engine` (13), `codegen-rust` (2, `format!` flattening),
`compiler-ownership` (2), `engine-imports` (1) and `ts-to-ranger-native` (1),
plus 9 rustc errors from `rust-selfhost-check.sh`. Every one of those counts is
identical with and without the P0 changes, checked by rebuilding from
`origin/master` and re-running.

Related: [`gallery/friendly/rust/README.md`](../../gallery/friendly/rust/README.md),
[PLAN_RUST_IDIOMATICITY.md](PLAN_RUST_IDIOMATICITY.md),
[PLAN_RUST_OWNERSHIP.md](PLAN_RUST_OWNERSHIP.md), [PLAN_SHAPES.md](PLAN_SHAPES.md).
