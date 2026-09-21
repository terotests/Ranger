# friendly — idiomatic target studies

Twelve small Ranger programs in [`src/`](src/) try to express what a native
programmer would write. Each subdirectory compiles the same sources to one
target and records what came out: what is already the idiom, what works but
looks generated, and what the language cannot say.

```bash
# from the repository root, after npm run compile
bash gallery/friendly/compile.sh          # every folder below
bash gallery/friendly/compile.sh go       # one target
```

One program compiled ten ways has to print the same thing ten times, so
a run over every target ends by diffing each study's output across the targets
that actually ran. Nothing checked that until study 11: an optional string set
to `""` read back as absent on C++ and as present everywhere else, and both
outputs sat in this directory looking fine on their own.

A target folder may hold `src/` of its own, for a study the same program cannot
express on every target; none does today. The behaviour-only trait study was
target-local for the same reason and is `src/12_behaviour_traits.rgr` now, since
every target lowers it to its own interface. It may also hold `attempts/`:
forms *that* target cannot express.
`compile.sh` requires each one to be **refused**, with the error it declares on
its first line (`; EXPECT-ERROR: …`). A form the target cannot express has to
be a compile error naming the limitation — never a binary that panics, and
never code that does not exist. `rust/attempts/` and `cpp/attempts/` exist
today.

| Target | Study | Toolchain on this machine |
| --- | --- | --- |
| [JavaScript](javascript/README.md) | `-l=es6` → `node` | ran |
| [Python](python/README.md) | `-l=python` → `python3` | ran |
| [Dart](dart/README.md) | `-l=dart` → `dart run` | writer only (`dart` not installed) |
| [Swift](swift/README.md) | `-l=swift6` → `swiftc` when present | writer only (`swiftc` not installed) |
| [Kotlin](kotlin/README.md) | `-l=kotlin` → `kotlinc` + `java -jar` | ran (kotlinc 2.0.21) |
| [C#](csharp/README.md) | `-l=csharp` → `mcs` + `mono` | ran |
| [Java](java/README.md) | `-l=java7` → `javac` + `java` | ran |
| [Go](go/README.md) | `-l=go` → `go build` | ran |
| [C++](cpp/README.md) | `-l=cpp` → `g++ -std=c++17` | ran |
| [Rust](rust/README.md) | `-l=rust` → `rustc` | ran |
| PHP (no folder yet) | `-l=php` → `php` | ran |
| Scala, TypeScript (no folder) | `-l=scala`, `-l=es6 -typescript` | writer only |

[`bench/`](bench/README.md) is the other half of this directory: the same
Ranger program timed on every target that builds here, plus the probe for how
wide a Ranger `int` is.

License: AGPL-3.0-or-later, with the rest of `gallery/`.

## Three questions, not one

This used to be a single ordering, and a single ordering reads as a verdict.
It is three separate questions, and a target can do well on one and badly on
another:

1. **Correctness** — does the same Ranger program give the same answers?
2. **Speed** — how long does the generated code take to do the same work?
3. **Idiom** — would a native programmer keep the file?

The first two are measured, by `compile.sh` and by
[`bench/`](bench/README.md). The third is a judgement, so it is made against a
published checklist below rather than asserted: every cell can be checked
against a file in this directory.

### 1. Correctness

`compile.sh` compiles the twelve studies for every target, runs the ones that
have a toolchain here, and diffs each study's output across all of them.
**Eight targets agree on all twelve studies** — JavaScript, Python, Go, C++,
Rust, Kotlin, Java and C#. PHP has no study folder yet but does have a `php`
here, and it agrees with the JavaScript reference on every study it was run
against. Dart, Swift and Scala have no `dart`, `swiftc` or `scalac` on this
machine: their files are written and read, never run, and nothing below should
be read as a claim that they work.

The one place the targets do *not* agree is integer width.
`bench/intwidth.rgr` is the probe — `100000 * 100000`, which needs 34 bits:

| `100000 * 100000` | Targets |
| --- | --- |
| `10000000000` | JavaScript, Python, PHP, Go, Rust |
| `1410065408` | C++, C#, Java, Kotlin |

Dart and Swift declare a 64-bit `int` / `Int`, Scala a 32-bit `Int`; none was
run. Ranger has one integer type, so this is a portability hazard in the
language rather than a bug in any one writer — and on C++ the overflow is
undefined behaviour rather than a wrap.

### 2. Speed

[`bench/`](bench/README.md) runs five kernels — arithmetic, arrays, strings,
maps, objects — each timing itself. Kernels only, milliseconds, one machine,
one program:

| C++ | Rust | Kotlin | C# | Go | Java | PHP | JavaScript | Python |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 265 | 397 | 485 | 684 | 694 | 753 | 786 | 1 040 | 2 607 |

Two of the numbers in the previous reading were a writer finding rather than a
language fact, and one of them is fixed. **`charAt` was O(n) on Go and Rust** —
`[]rune(s)[i]` allocated the whole rune slice per read, `s.chars().nth(i)`
walked from the start — so a string scan was quadratic there and
constant-time everywhere else. Both index the UTF-8 byte their string is made
of now (`docs/plans/PLAN_STRING_INDEXING.md`), and the string kernel went from
2 178 ms to 6 on Rust and from 143 182 to 4 on Go, which moved Rust from
seventh to second and Go from ninth to fifth.

What is still there: **a Ranger map is a plain object on JavaScript**, with two
`hasOwnProperty` probes per lookup, which makes it the slowest map in the table
where PHP is the fastest.

### 3. Idiom

Twelve checks, each read off the generated studies in this directory, each
scored 1, ½ or 0. The score is the mean. Generics is 0 for everyone — a
Ranger `@params` class is monomorphized into `Stack_int` and `Stack_string` on
every target — so it lowers every column by the same amount rather than
separating them; it is in the table because a native reader does notice.

| Check | JS | TS | Py | PHP | Dart | Swift | Kotlin | C# | Java | Scala | Go | C++ | Rust |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Declared types | 1 | 1 | 1 | ½ | 1 | 1 | 1 | 1 | ½ | 1 | ½ | 1 | 1 |
| Optional | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | ½ | 1 | 0 | ½ | 1 |
| Ranger `Enum` | 0 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Closed variants | 0 | 1 | 0 | 0 | ½ | 1 | 1 | ½ | ½ | ½ | ½ | 1 | 1 |
| `trait` as a type | 1 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `for` loop | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Higher-order fn | 1 | 1 | ½ | 1 | 1 | 1 | 1 | 1 | ½ | 1 | 1 | 1 | ½ |
| Collections | 1 | 1 | 1 | 1 | 1 | 1 | ½ | 1 | ½ | ½ | 1 | 1 | 1 |
| Naming | 1 | ½ | ½ | 1 | 1 | 1 | 1 | ½ | 1 | 1 | ½ | 1 | ½ |
| Generics | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errors | ½ | ½ | 1 | 1 | ½ | 1 | 1 | ½ | ½ | ½ | ½ | 1 | ½ |
| Memory model | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | ½ | ½ |
| **Score** | **71%** | **83%** | **75%** | **71%** | **83%** | **92%** | **88%** | **79%** | **67%** | **79%** | **67%** | **83%** | **75%** |

Reading the columns:

- **Swift, 92%.** `T?`, `??`, `weak var`, a native `enum` for both a Ranger
  `Enum` and a `shape`, `protocol` for a behaviour-only `trait`, `throws` /
  `try` / a real `Error` type. It is also the column with the least evidence:
  no `swiftc` here, so this is a reading of the file, not of a build.
- **Kotlin, 88%.** `T?`, `enum class`, `sealed interface`, `(Int) -> Int`,
  `interface`. `MutableList` in signatures where a native API takes `List`.
- **TypeScript / Dart / C++, 83%.** TypeScript gets a discriminated union with
  a literal `__rg_kind`, which is the idiom, and loses it again on
  `union_ParseOutcome` as a type name. Dart has `T?`, `enum`, `int
  Function(int)`; its closed variants are `abstract class` + `is` rather than
  Dart 3 `sealed`. C++ is `enum class`, range-`for`, a value `record` where
  the sharing analysis proves nothing aliases it, and a preamble that goes in
  only when the program reaches it — against `shared_ptr` elsewhere and a
  32-bit `int`.
- **C# / Scala, 79%.** C#: `int?`, `List<T>`, `Func<int,int>`, `enum`,
  `interface` — with camelCase methods where .NET writes PascalCase, and
  `ConfigurationErrorsException` as the thrown type. Scala: `Option[T]`,
  `for (v <- xs)`, `trait`, a sealed class with case objects for an `Enum` —
  with `collection.mutable.ArrayBuffer` spelled out everywhere.
- **Python / Rust, 75%.** Python is annotated end to end now, with `IntEnum`
  and `Protocol`, and still writes a shape as a `_rg_kind` tag rather than a
  match, hoists multi-statement lambdas into `__rg_lambda_1` defs, and keeps
  Ranger's camelCase where PEP 8 wants snake_case. Rust is ownership-aware and
  reads like Rust — `Option<T>`, `enum` + `if let`, snake_case, `trait` — and
  still has no `Result` or `?`, takes `&mut dyn FnMut` where a native API is
  generic, and names types `Stack_int` and `union_Payload`, which rustc warns
  about.
- **JavaScript / PHP, 71%.** Both are honest, plain files in their language.
  JavaScript is the only target where a Ranger `Enum` is still a number, and
  its shapes are a `__rg_kind` string. PHP has typed properties and a native
  `enum` now; its parameters and returns are untyped, and a behaviour-only
  `trait` is not yet an `interface` there.
- **Java / Go, 67%.** Java is legal and runs: `Integer` boxing, `ArrayList`
  in signatures, `LambdaSignature1` for a lambda. Go is the one target where
  an optional is neither a pointer nor a second return value but
  `*GoNullable` with an `interface{}` inside, and the one where the ownership
  pass does not run at all.

Every target's `for` is that target's own loop now, when the body neither
reads the index nor touches the collection: `for (const v of xs)`,
`for v in xs:`, `for _, v := range xs`, `for (T v : xs)`, `for (v in xs)`,
`foreach (T v in xs)`, `for (final v in xs)`, `for v in xs`,
`for (const T& v : xs)`. The decision is one decision
([`compiler/ForLoopAnalysis.rgr`](../../compiler/ForLoopAnalysis.rgr)); only
the spelling is per target.

An earlier round of this file found the other disagreement worth recording,
and it is fixed: on C++ an optional `string` was a plain `std::string` at
every position — field, local and parameter — so `""` and absent were the same
value. Study 11 is the study that asks that question, and every target gives
the same answer now.

What **none** of them get from Ranger today: a `Result` / `(T, error)` /
`throws` type, or `@params` surviving as `Stack<T>` rather than `Stack_int`.
A Ranger `Enum` is the target's own enum everywhere except plain JavaScript,
which has none to be. A behaviour-only `trait` used as a *type* is the
target's own interface on every statically typed target except PHP, and a
field-bearing one is refused rather than emitted.

### Official targets not given a folder

The command-line table in
[`docs/site/src/content/docs/targets/overview.md`](../../docs/site/src/content/docs/targets/overview.md)
lists more languages than the first folders had. JavaScript, Java and
C# are folders now. Still without a study directory:

| Target | Option | Probed? | Would sit… |
| --- | --- | --- | --- |
| TypeScript | `-l=es6 -typescript` | writer | above JavaScript. Same backend, plus types, `export`, `enum`, and a discriminated union for a `shape`. No `tsc` here. |
| PHP | `-l=php` | **runs** | with JavaScript. Typed properties, native `enum`, `??`, `foreach`. `php` is on this machine and the twelve studies agree with the JavaScript reference; it has no study folder yet. |
| Scala | `-l=scala` | writer | with C#. `Option[T]`, `trait`, `for (v <- xs)`, a sealed class with case objects for an `Enum`; still `ScalaReturnValue` and `collection.mutable.ArrayBuffer` spelled out. No `scalac` here. |

`es5`, `swift3`, `nim`, `flow`, `ts` (as its own `-l`) and `llvm` live
in `Lang.rgr` with thinner templates. They are not in this ranking.

## Cross-target matrix

| Idiom | JS | Python | Dart | Swift | Kotlin | C# | Java | Go | C++ | Rust |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Two names, one object | object | object | object | class / ARC | object | object | object | `*T` | `shared_ptr` | `Rc<RefCell>` when proven |
| Weak back-edge | ignored | ignored | ignored (`T?`) | `weak var x: T?` | ignored (`T?`) | ignored | ignored | ignored (`*GoNullable`) | `r_weak` / `weak_ptr` | `Weak<RefCell>` |
| Optional | `undefined` | `None` | `T?` | `T?` | `T?` | `int?` / `String`+null | `null` / `Integer` | `*GoNullable` | `r_optional_*`, string included | `Option<T>` |
| `try`/`throw` | `throw "…"` (runs) | `raise`/`except` (runs) | `throw "…"` (runs) | `throw RgError(…)` / `catch` | `throw Exception(…)` / `catch` | `ConfigurationErrorsException` (runs) | `IllegalArgumentException` (runs) | `panic`/`recover` (runs) | `throw std::runtime_error` / `catch` | **refused**, naming the `shape` alternative |
| Closed variants | `__rg_kind` | `_rg_kind` | `abstract class` + `is` | native `enum` | `sealed interface` | `interface` + `is` | `Object` + `instanceof` | tagged struct | `std::variant` | `enum` + `if let` |
| Ranger `Enum` | number | `IntEnum` | `enum` | `enum : Int` | `enum class` | `enum : int` | `enum`, own file | `type C int64` + consts | `enum class` | `enum` |
| Integer width | 2⁵³ exact | arbitrary | 64-bit (declared) | 64-bit (declared) | **32-bit** | **32-bit** | **32-bit** | 64-bit | **32-bit**, overflow is UB | 64-bit |
| Ranger `trait` | mixin | mixin | mixin, + abstract class when used as a type | mixin, + `protocol` | mixin, + `interface` | mixin, + `interface` | mixin, + `interface` | mixin, + `interface` | mixin, + abstract base | mixin, + `trait` |
| Generics | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` |
| Higher-order fn | function | callable / hoisted def | `int Function(int)` | closure | `(Int) -> Int` | `Func<int, int>` | `LambdaSignature1` | `func(int64) int64` | `std::function` | `&mut dyn FnMut` |
| Error type | throw string | `Exception(str)` | throw string | `RgError` | `Exception` | `ConfigurationErrorsException` | `IllegalArgumentException` | no `(T, error)` | `std::runtime_error`, no `expected` | no `Result`; a `shape` stands in |

`Enum` and `trait`-as-a-type have moved out of the second list and into the
first: the compiler decides them once and each writer spells them. What is
left there is `Result` / `(T, error)` / `throws` as a *type*, and generics
surviving as generics rather than as `Stack_int`.

The ownership / memory story is the part the compiler already thinks about
(Rust borrows and `Rc`, C++ `shared_ptr`/`weak_ptr`, Swift `final`/`weak var`),
and it now reaches further: a local built in a function and stored for the
last time is moved rather than shared, and the `def` plus the field writes
after it are one initialization on Rust.

Integer width is the row to read before porting anything numeric. Ranger has
one integer type and the writers do not all give it the same width, so a
program that crosses 2³¹ is a different program on C++, C#, Java, Kotlin and
Scala than it is on the rest. `bench/intwidth.rgr` is the probe.

## Shared sources

[`src/`](src/) is ordinary Ranger, not a dialect per target. Comments in
those files still describe the Rust I wanted first; each language README
restates the native idiom.

`src/06_generics.rgr` used to carry a `str2int` helper that nothing called,
to work around a C++-only hole: the writer emits `r_optional_primitive<T>` for
an optional scalar, but its definition lived only on the `str2int` operator's
polyfill, so an optional scalar return or parameter named a type that was never
defined. The writer emits the definition with the type now, and the dummy is
gone.

Forms no target can express, or one target cannot:

- [`rust/attempts/04_trait_as_type.rgr`](rust/attempts/04_trait_as_type.rgr)
  and [`cpp/attempts/04_trait_as_type.rgr`](cpp/attempts/04_trait_as_type.rgr)
  — a **field-bearing** Ranger `trait` used as a *type*. Both refuse it: such a
  trait is a mixin, its fields are copied into each consumer, and no target
  has anywhere to hold them: each consumer already owns its own copy. All
  eight statically typed targets refuse it now, each naming its own way out.
  A **behaviour-only** trait becomes the target's interface instead — see
  [`src/12_behaviour_traits.rgr`](src/12_behaviour_traits.rgr), which runs on
  every one of them.
- [`rust/attempts/06_generic_function.rgr`](rust/attempts/06_generic_function.rgr)
  — Ranger rejects a free `@params` function on every target
- [`rust/attempts/09_throw_panics.rgr`](rust/attempts/09_throw_panics.rgr)
  — Rust refuses it: the catch block would be dropped and the binary would die
  on the error path. recover/except/catch on Go/Python/C++; runs on
  JavaScript, Dart, Java (`IllegalArgumentException`) and C#
  (`ConfigurationErrorsException`); illegal Swift and Kotlin (`String`
  is not `Error` / `Throwable`) — **both fixed**, see
  [`kotlin/src/11_throw_catch.rgr`](kotlin/src/11_throw_catch.rgr) and
  [`swift/README.md`](swift/README.md) §09. Writer-only: PHP `Exception`,
  Scala `customException`.

`02_optional_string_param.rgr` left this list: it is
[`src/10_optional_params.rgr`](src/10_optional_params.rgr) now, a study on
every target. It was a writer bug, not a language limit, and not a
string-specific one — every `@(optional)` parameter came out of the Rust
writer as `Option<Option<T>>`.

## How the language could improve (all targets)

1. **A `Result` / error type** with a per-target lowering: Rust `Result` +
   `?`, Go `(T, error)`, Python exception or tuple, C++ `std::expected` or
   a named exception, Swift `throws` / `Result`, Kotlin `Result` /
   `Exception`, Java / C# / JS / Dart / PHP exceptions. Today
   `try`/`throw` is silently wrong on Rust, Swift, and Kotlin.
2. **`Enum` as a native enum** (`enum class`, `iota`, `IntEnum`, Swift
   `enum`, Kotlin `enum class`, C# / Dart `enum`), not an integer.
3. **`shape` match as the target’s match**, with string payloads stored
   by value where the target allows it (`when`, Dart 3 `switch`).
4. **A field-free `trait` as the target’s interface** (`trait`,
   `interface`, `Protocol`, abstract base, Dart `abstract interface class`).
   Mixins stay for traits that carry fields.
5. **Optional as the target optional** everywhere — Go `*T` instead of
   `GoNullable`, and C++ `std::optional` rather than a plain `std::string`
   that cannot tell `""` from absent. Rust parameters are done (study 10).
6. **`record` as a value type** on Rust/C++/Swift (`struct`), C# /
   Kotlin `record` / `data class`, Dart 3 record / `final` fields;
   `class` as a reference type.
7. **Keep `@params` in the output** (`Stack<T>`, `Stack[T]`) instead of
   `Stack_int`.
8. **Do not emit unused preambles.** **Done on Rust and C++** — both gate the
   ordered map on whether the program can reach one. **Go** only declares
   `GoNullable` when the program has an optional, and **Kotlin** no longer
   opens an empty `companion object` for a class whose only static is `main`.

Items 1-4, 7 and 8 for Rust are ranked with their cost in
[`docs/plans/PLAN_RUST_SEMANTIC_IDIOMS.md`](../../docs/plans/PLAN_RUST_SEMANTIC_IDIOMS.md).
Details and ranked lists live in the per-target READMEs.
