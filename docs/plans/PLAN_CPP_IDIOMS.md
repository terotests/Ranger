# PLAN_CPP_IDIOMS — lifting the bottom of the idiom table

> **Status: item 0's verification done, C1 (records), C4 and the preamble half
> of item 8 landed; the Rust half of the preamble work landed with them.**
> C2, C3, C5 and every Tier 1 and Tier 2 item are still proposals. The
> verification section is reproduced against `master` at 9e61f8a5 with
> `g++ 13`, `rustc 1.94.1`, `go`, `python3` and `node 22` on this machine.
>
> What shipped, and what gated it:
>
> - **C1, for `record`s.** `compiler/CppValueAnalysis.rgr` reads
>   `rust_needs_ref_semantics` — the verdict `analyzeClassSharing` has been
>   computing for C++ compilations all along with only the Rust writer reading
>   it — and adds the disqualifiers that are about what the C++ writer does
>   with a class: an `@(optional)` of it (an optional object *is* the null
>   pointer here), a `cast` to it, a method that hands out bare `this`
>   (`shared_from_this()` needs the pointer), a field of its own type,
>   inheritance in either direction, and membership of a closed family (which
>   keeps the family's own rule). `-cpp-shared-classes` restores the old
>   lowering; `-strict-ownership` prints the verdict and its reason.
>   Widening past `record` was tried and reverted: a `const User&` parameter
>   cannot call `who.label()` until the writer emits `const` member functions,
>   which is its own item (C6 below).
>
>   Two things the value form needed that the pointer form never did, both
>   found by probing rather than by the studies: a parameter the body writes
>   through is `Point&` (behind a `shared_ptr` the `const` was on the pointer,
>   and `needs_cpp_reference` already recorded the fact), and a `T&` does not
>   bind a temporary, so a `new` in an argument list goes through `rg_arg_ref`.
>   `tests/fixtures/cpp_value_record.rgr` is the gate for both, and it prints
>   the same six lines on C++, JavaScript, Python, Go and Rust.
> - **C4, and then on every target that had the same loop.** The decision is
>   one decision, so it lives in `compiler/ForLoopAnalysis.rgr` and each writer
>   spells it: `for (const v of xs)` on JavaScript and TypeScript, `for v in
>   xs:` on Python, `for _, v := range xs` on Go, `for (T v : xs)` on Java,
>   `for (v in xs)` on Kotlin, `foreach (T v in xs)` on C#, `for (final v in
>   xs)` on Dart, `for v in xs` on Swift, `for (const T& v : xs)` on C++.
>   Rust already had it; es5 is left out because `for...of` is ES6. Same two
>   safety conditions everywhere: the body must not read the index and must not
>   touch any name the collection rests on.
>
>   Two things this pass found. Changing the es6 template is a BOOTSTRAP
>   change: the compiler is built with `-es6`, so the template that routes to
>   the new writer has to land in a binary that already has the writer, or
>   every `for` in the compiler is written as nothing. It takes two builds, and
>   the fixpoint check is the gate. And `for` over a collection the body
>   appends to answers 5 on nine targets and 3 on Rust, whose index loop reads
>   the bound into a local first -- deliberately, to avoid a borrow that would
>   stop the body. That is ISSUES.md #96.
> - **Item 8's remainder.** `r_optional_union`, the `Any` union and
>   `rg_arg_ref` are reachability-gated. The twelve C++ studies lost 291 lines.
> - **Rust, same question.** `use std::rc::Rc` / `use std::cell::RefCell` and
>   the `RgAnyRef` / `rg_downcast` / `RgIdentical` trio go in only when the cell
>   can reach the output. Six of the twelve Rust studies drop all thirteen
>   lines.
>
> Gate run for each: `gallery/friendly/compile.sh` (twelve studies per target,
> every `attempts/` file still refused, and the cross-target output diff clean
> — six targets agree on all twelve), the C++ selfhost build (the C++ binary
> compiles the compiler to a file that differs from the Node build's only in
> the 34 pre-existing non-ASCII hunks described below), and
> `scripts/rust-selfhost-check.sh` (zero rustc errors).
>
> **One thing this work found and did not fix: ISSUES.md #95.** 34 hunks of the
> C++ selfhost diff are non-ASCII and nothing else — `—` comes back as `â`.
> They are on `master` too, byte for byte, so nothing here caused them. The
> writer is not the problem: a non-ASCII literal is emitted correctly and the
> binary prints it correctly. `read_file` is — on C++ it hands back bytes, so
> `strlen` of a file holding `em dash —` is 96 where JavaScript says 92, and
> the compiler reading its own sources writes each byte back as a character.
> That is the Issue #57 class (`SPEC_SEMANTICS.md`: code points on every
> target) on a target nobody had asked it of. It belongs with Track 1's
> conformance suite, not with C3 below, and `TARGET_NOTES.md` no longer claims
> the output is byte-identical save for one line.

The idiom ranking on the landing page put C++ last at 29%, Rust at 37% and Go
at 38% when this was written; after item 0's corrections and the work above it
reads Rust 46%, C++ 45%, Go 38%, and Go is last. This plan says what to do about that. It is scoped by one rule the
[language-improvement plan](PLAN_LANGUAGE_IMPROVEMENTS.md) already states and
this one inherits: **existing `.rgr` sources keep compiling and keep meaning
what they mean**, and the self-hosting compiler is the canary.

The short answer to "do we need language features, or is the static analysis
enough?" is **both, in that order**: the three largest C++ deductions need no
new syntax at all — they need the C++ writer to read verdicts the analyser
already computes and Rust already consumes — and the items after those need
four small, additive language features, none of which is a new keyword except
one.

---

## 0. Correct the baseline first

Three of the C++ deductions on the landing page describe a compiler that no
longer exists. Re-running the studies today:

```bash
bash gallery/friendly/compile.sh cpp     # 12 studies, g++ -std=c++17
bash gallery/friendly/compile.sh rust    # 12 studies, rustc, + library mode
```

Both end with *all studies compiled, all attempts refused*, and both print the
same answers as the other targets.

| Claim in the current copy | Today |
| --- | --- |
| "An optional `string` is still a plain `std::string` that treats `""` as absent — study 11 would print the wrong answer if it built" | Study 11 builds and prints `empty: present []`. The type is `r_optional_primitive<std::string>`. |
| "The int path names `r_optional_primitive` without defining it, so studies 10 and 11 do not compile" | Both compile; the definition is emitted where the type is. |
| "Study 12 names a missing `Named`" (C++ and Rust) | Both compile. C++ emits `class Named` with a pure virtual `label()`; the attempt that *should* fail (a field-bearing trait as a type) is refused with the error it declares. |

So `absent 10` and part of `interfaces 16` score a fixed compiler, and the same
is true of the Rust "studies 10 and 11 fail on a doubled `Option`" line. **Item
0 is to re-score and correct `landing/index.html:747` (and the Rust and Go
blocks).** It costs an afternoon and it changes which items are genuinely worst.

This is also the plan's first real deliverable, because of *why* the stale
numbers survived: the twelve per-study scores are hand-written prose in
`landing/index.html`, not a measurement. Nothing recomputes them and nothing
fails when they drift.

**Item 0b — make the score reproducible.** Give each study a rubric file listing
the idioms that study is checking for, as assertions over the generated file
(`no shared_ptr<Point>`, `uses std::optional`, `range-for over xs`,
`enum class Color`), and a script that prints the twelve numbers per target.
Then an item in this plan either moves a number or it did not land. Without it,
every item below is unverifiable and the table rots again.

---

## 1. What is actually worst, after the correction

For C++, with the three fixed items set aside, the real deductions rank:

| Column | C++ | What it is |
| --- | --- | --- |
| generics | 16 | `Stack_int`, `Stack_string` — monomorphized names, no `template` |
| interfaces | 16 | half fixed; the field-bearing case is refused, concepts absent |
| params | 20 | `const std::shared_ptr<Point>&` where a human writes `const Point&` |
| iterators | 28 | index `for`, no range-`for`, no `<algorithm>`, no `<ranges>` |
| option | 30 | `r_optional_primitive<T>`, not `std::optional<T>` |
| errors | 32 | `std::runtime_error` + rethrow; no `std::expected` |
| shapes | 32 | `std::variant`, then the string case is a `shared_ptr` cell |
| ownership | 36 | a `record Point` is `shared_ptr<Point>` |

`generics` is the worst column on **every one of the thirteen targets** (16–30).
`params`, `option` and `ownership` are the C++-specific ones, and they have a
single common cause.

---

## 2. The central finding: C++ ignores a verdict it already pays for

The same Ranger program, study 01, compiled twice:

```rust
// gallery/friendly/rust/generated/01_ownership.rs
struct Point { x : i64, y : i64 }
fn manhattan(&self, p : &Point) -> i64
```

```cpp
// gallery/friendly/cpp/generated/01_ownership.cpp
class Point { public: int x; int y; ... };
int PointOps::manhattan( const std::shared_ptr<Point>& p );
```

Rust gets the value type because `StaticAnalyzer.analyzeClassSharing`
([`StaticAnalysis.rgr:2774`](../../compiler/StaticAnalysis.rgr#L2774)) proved
`Point` is never aliased-and-held, and recorded that on the class as
`rust_needs_ref_semantics`
([`RangerAppClassDesc.rgr:126`](../../compiler/RangerAppClassDesc.rgr#L126)).
The pass **runs for C++ too** —
[`VirtualCompiler.rgr:1263`](../../compiler/VirtualCompiler.rgr#L1263) gates it
on `cpp || rust || -strict-ownership` — and the C++ writer reads only the
*parameter* half of the result (a borrowed object parameter becomes
`const shared_ptr<T>&`,
[`RangerCppClassWriter.rgr:1638`](../../compiler/RangerCppClassWriter.rgr#L1638)).
The *class* half has exactly one consumer,
[`RustClass.rgr:259`](../../compiler/RustClass.rgr#L259).

The C++ writer also already knows how to emit a class by value: a scalar-only
shape case sits inside the variant rather than behind a pointer
(`std::variant<Message_Ping, std::shared_ptr<Message_Text>, Message_Move>` in
study 03). The decision procedure and the emission both exist. They are not
wired together.

That is the whole of item **C1**, and it is worth restating what it does *not*
require: no new syntax, no change to any `.rgr` file, no change to what any
program means.

---

## Tier 0 — writer work, no new syntax

**C1. Value classes on C++.** A class the sharing analysis proves unshared is
`T`, `const T&` and `T&`, constructed on the stack, not `shared_ptr<T>`.
Rename `rust_needs_ref_semantics` to `needs_ref_semantics` (keep the old name
as an alias for one release) and have the C++ writer read it the way
`RustClass` does. Ship behind `-cpp-value-classes`, matching the existing
`-rust-value-classes` flag, which is the same switch pointing the other way.
Flip the default when the C++ selfhost build still reproduces itself
byte-for-byte (`npm run selfhost:build:cpp`). Moves `ownership`, `params` and
`builder`.

**C2. `std::optional` for `@(optional)`.** The helper's surface —
`has_value`, `value`, `operator bool`, `== nullptr` — is a subset of
`std::optional`. The union case needs `std::optional<std::variant<…>>` and the
object case needs a decision (a null `shared_ptr` is already an optional; an
`optional<shared_ptr<T>>` is two nullables). Do the scalar and string cases
first; they are the ones the studies score. Moves `option` and `absent`.

**C3. `int` is `int64_t`.** This is not idiom, it is conformance: 32-bit `int`
is why one line of the compiler's own C++-built output differs from the Node
build (see `TARGET_NOTES.md`). It belongs in the cross-target conformance suite
with a fixture that overflows 32 bits, not in a style plan — but it stays on
this list because it is the reason `strings` and `iterators` can disagree
across targets on the same program.

**C4. Range-`for`.** `for (const auto& v : xs)` when the index variable is used
only to fetch the element. The Rust writer already makes this decision
(PLAN_RUST_SEMANTIC_IDIOMS item K, `RustOperators.rgr:2599`); the predicate is
the same one. Moves `iterators` on C++, and the same predicate moves Go
(`range`), Python (`enumerate` is already there) and C# (`foreach`).

**C5. `std::string_view` / `std::span` for proven-borrowed parameters.**
Depends on the same parameter verdict C1 depends on, with one extra condition:
the parameter is never stored, never returned, never captured by a lambda that
outlives the call. The ownership pass distinguishes `borrowed` from `moved` and
`shared` already ([`StaticAnalysis.rgr:1602`](../../compiler/StaticAnalysis.rgr#L1602)).
Moves `params` and `strings`.

Tier 0 alone should take C++ from the twenties into the forties, and it is all
writer code behind a flag.

---

## Tier 1 — four small language features

Each of these is additive: a program that does not use it compiles to the same
bytes it compiles to today.

**L1. `@(value)` / `@(reference)` on `record` and `class`.** The annotation
exists and is documented — for `shape` cases and groups
(`ai/GRAMMAR.md`, Shape Definition). Extending it to records and classes is one
grammar edit and no new keyword.

The reason to have it even after C1 lands: an inference-only design means the
C++ representation of a public type can flip because *somebody else's* function
aliased it. That is fine inside a program and unacceptable for a library — the
signature changes without the declaration changing. `@(value)` lets an author
pin the answer, and `@(reference)` lets them pin the other one. Where the
annotation and the analysis disagree, the annotation wins and the analysis
reports the conflict under `-strict-ownership`, the way the enum fallback does.

**L2. `Result` in the standard library, plus an early-return operator.** This
is the single item with the widest reach: `errors` is 28–68 across the table
and the C++, Rust, Go and Java numbers are all bounded by the same hole. It is
item **H** of PLAN_RUST_SEMANTIC_IDIOMS, unbuilt.

It must desugar to machinery the thirteen writers already have, which means a
`shape`:

```ranger
shape Result @params(T E) {
    case Ok  { def value:T }
    case Err { def error:E }
}
```

plus one operator — spelled `(try! expr)` or `(? expr)` — that returns the
`Err` from the enclosing function and unwraps the `Ok` otherwise. Every target
can lower that as a `match` and an early `return`, which is what the shape
machinery already emits, so day one costs nothing per target. Then each writer
can recognise the shape by name and emit its own: `Result<T,E>` + `?` on Rust,
`std::expected` on C++23, `(T, error)` on Go, `throws` on Swift,
`Result<T>` on Kotlin. `try` / `throw` stays exactly as it is; nothing existing
moves.

Prerequisite: it needs generics that survive to the writer (L5) or a
monomorphized `Result_int_string`, which is the ugly-but-working version and
the one to ship first.

**L3. `interface` as a declaration of its own.** Today a behaviour-only `trait`
*used as a type* works on C++ and Rust and is a silent hole on Go, Java,
Kotlin, C#, Dart and Swift — the `gallery/friendly/cpp/README.md` item 10 says
so in those words. The ambiguity is the cause: a `trait` is a mixin, unless
something names it as a type, unless it carries fields, in which case it is
refused. Four outcomes from one keyword, decided by use.

An `interface` declares behaviour only, is always a type, and may not carry
fields. Then every writer has exactly one lowering and no decision procedure:
abstract base (C++), `trait` (Rust), `interface` (Go, Java, C#, Kotlin, Dart,
TypeScript), `protocol` (Swift), `Protocol` (Python). `trait` keeps its current
meaning and its current lowering, so this breaks nothing. It is the one item
here that lifts a column on eleven targets at once, and `interfaces` is 16–52
today.

**L4. `@(borrow)` on a parameter.** The explicit spelling of what the ownership
pass infers, for the same library-stability reason as L1. Cheap once C5 exists,
and pointless before it.

---

## Tier 2 — the expensive one, and the one after it

**L5. Generics that survive to the writer.** `Stack<T>`, not `Stack_int`.
`generics` is 16–30 on every target; this is the only item that lifts the whole
table at once. It is also the most expensive: monomorphization happens *before
any writer runs* and that was a deliberate choice —
[PLAN_GENERICS](PLAN_GENERICS.md) records it as "no backend changes, and none of
the fourteen targets was touched".

The staged version: keep the template *and* the instantiation set in the
context, and let a writer opt in. A writer that does nothing keeps the
monomorphized path it has, so the change is backwards compatible by
construction, and the first two opt-ins (C++ `template<class T>`, Rust `<T>`)
are also the two targets where the monomorphized names are most visibly wrong.
That plan's own open warning about `Maybe<T>` and `@(optional)` should be
settled in the same pass, or explicitly ruled out of generics' path.

**L6. Iterator adapters.** `map` / `filter` / `fold` in the standard library,
lowered to `<ranges>`, iterator chains, comprehensions or an index loop
depending on the target. `iterators` is 28–86. Lower priority than it looks:
C4 (range-`for`) buys most of the C++ movement for a fraction of the cost, and
this one needs a stdlib design discussion that L2 should go first in.

---

## The other two at the bottom

**Go (38%)** is the cheapest target in the table to improve, because the
ownership pass **does not run for it at all** —
[`VirtualCompiler.rgr:1263`](../../compiler/VirtualCompiler.rgr#L1263) gates it
on `cpp || rust`. Three items, all Tier 0:

- `option 26` / `absent 24`: `*GoNullable` is an untyped struct with a tag.
  `*T` for objects and `(T, bool)` for scalars is the Go spelling, and the
  second is what `has_value` already means.
- `params 22`: run the ownership pass for Go and pass values where the verdict
  is `borrowed`.
- `iterators 46`: `range`, per C4.
- `errors 28`: falls out of L2.

**Java (50%)** is a *dialect* problem, not a writer problem: the target is
`java7`, so `Optional<T>`, records, sealed interfaces, lambdas and `var` are all
unavailable by definition. Add `-l=java17` as a second dialect and leave
`java7` untouched. That is backwards compatible in the strongest sense — the
old target keeps emitting the old bytes — and it moves `option 36`,
`shapes 36`, `params 62` and `generics 20` in one change.

**Rust (37%)** needs L2, L5 and L6, in that order; everything cheaper in
PLAN_RUST_SEMANTIC_IDIOMS has landed except H, J and M.

---

## Order of work

| # | Item | Cost | Moves | |
| --- | --- | --- | --- | --- |
| 1 | 0 — re-verify and correct the copy | S | the table's honesty | **done** |
| 1b | 0b — make the score a script | S | the table's honesty | open |
| 2 | C1 — value classes on C++ | M | ownership, params, builder | **done for `record`** |
| 3 | C2 — `std::optional` | M | option, absent | open |
| 4 | C4 — range-`for` (C++ and Go) | S | iterators ×2 | **done for C++** |
| 5 | Go: run the ownership pass, `*T` / `(T, bool)` | M | option, absent, params | open |
| 6 | C5 + L4 — `string_view` / `span`, `@(borrow)` | M | params, strings | open |
| 7 | L3 — `interface` | M | interfaces, on eleven targets | open |
| 8 | L1 — `@(value)` on record and class | S | stability of 2 and 5 | open |
| 9 | L2 — `Result` + early return | L | errors, on all of them | open |
| 10 | `-l=java17` | M | four Java columns | open |
| 11 | L5 — preserved generics | XL | generics, on all of them | open |
| 12 | C3 — `int64_t`; L6 — adapters | M | conformance; iterators | open |

Two items the work added to the list:

| # | Item | Cost | Why |
| --- | --- | --- | --- |
| C6 | `const` member functions on C++, from `mutates_self` | M | it is what blocks C1 from covering classes: a `const User&` cannot call `who.label()`. `StaticAnalyzer` already computes `mutates_self` per method. |
| — | ISSUES.md #95: `read_file` hands back bytes on C++ | M | a conformance bug, not an idiom one; it belongs with Track 1's suite |

Items 1–6 are writer and analysis work with no language change. Items 7–9 are
the additive features. Item 11 is the one that needs a decision before it needs
code.

## Gate

Nothing lands without all four:

1. `bash gallery/friendly/compile.sh` — every study compiles on every target
   with a toolchain, every `attempts/` file is still refused with its declared
   error, and the cross-target output diff is clean.
2. `npm run selfhost:build:cpp` — the C++ build of the compiler still compiles
   the compiler to a file byte-identical to the Node build's, and the binary
   that comes out of it reproduces itself. Same for `:rust`, `:go`, `:dart`,
   `:python`, `:csharp` where the item touches them.
3. `npm run test` — no new failures.
4. The rubric script from item 0b shows the number the item claimed to move,
   moving.

Related: [PLAN_RUST_SEMANTIC_IDIOMS.md](PLAN_RUST_SEMANTIC_IDIOMS.md),
[PLAN_LANGUAGE_IMPROVEMENTS.md](PLAN_LANGUAGE_IMPROVEMENTS.md),
[PLAN_GENERICS.md](PLAN_GENERICS.md),
[PLAN_RUST_OWNERSHIP.md](PLAN_RUST_OWNERSHIP.md),
[`gallery/friendly/cpp/README.md`](../../gallery/friendly/cpp/README.md).
