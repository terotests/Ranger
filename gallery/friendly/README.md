# friendly — idiomatic target studies

Ten small Ranger programs in [`src/`](src/) try to express what a native
programmer would write. Each subdirectory compiles the same sources to one
target and records what came out: what is already the idiom, what works but
looks generated, and what the language cannot say.

```bash
# from the repository root, after npm run compile
bash gallery/friendly/compile.sh          # every folder below
bash gallery/friendly/compile.sh go       # one target
```

A target folder may also hold `attempts/`: forms *that* target cannot express.
`compile.sh` requires each one to be **refused**, with the error it declares on
its first line (`; EXPECT-ERROR: …`). A form the target cannot express has to
be a compile error naming the limitation — never a binary that panics, and
never code that does not exist. Only `rust/attempts/` exists today.

| Target | Study | Toolchain on this machine |
| --- | --- | --- |
| [JavaScript](javascript/README.md) | `-l=es6` → `node` | ran |
| [Python](python/README.md) | `-l=python` → `python3` | ran |
| [Dart](dart/README.md) | `-l=dart` → `dart run` | ran |
| [Swift](swift/README.md) | `-l=swift6` → `swiftc` when present | writer only (`swiftc` not installed) |
| [Kotlin](kotlin/README.md) | `-l=kotlin` → `kotlinc` + `java -jar` | ran |
| [C#](csharp/README.md) | `-l=csharp` → `mcs` + `mono` | ran |
| [Java](java/README.md) | `-l=java7` → `javac` + `java` | ran |
| [Go](go/README.md) | `-l=go` → `go build` | ran |
| [C++](cpp/README.md) | `-l=cpp` → `g++ -std=c++17` | ran |
| [Rust](rust/README.md) | `-l=rust` → `rustc` | ran |

License: AGPL-3.0-or-later, with the rest of `gallery/`.

## Ranking

Same Ranger, same printed answers (`manhattan 7`, `shared 1`, `ok:42`,
`ping`, …) on every target that has a toolchain here. **The ranking is
about idiom** — would a native programmer keep the file — not about
whether Ranger compiled.

| Rank | Target | Runs | Why it sits here |
| --- | --- | --- | --- |
| 1 | [Python](python/README.md) | yes | Closest to the language. `None`, `raise`/`except`, `enumerate`, `__main__`. Looks like Python a human would debug. |
| 2 | [JavaScript](javascript/README.md) | yes | The compiler’s own target. Objects share, `throw "…"` runs, arrays are arrays. Optional is verbose `typeof` / `undefined`. |
| 3 | [Dart](dart/README.md) | yes | `T?`, `int Function(int)`, file-scope `main`, `throw "…"` runs. No Dart 3 `record` / `sealed` / `enum`. |
| 4 | [Swift](swift/README.md) | writer only | `T?`, `??`, `weak var`, native `enum` for a `shape`. `throw` has no `throws` and would not `swiftc`. |
| 5 | [Kotlin](kotlin/README.md) | yes | `T?`, `sealed interface`, `(Int) -> Int`. `throw "…"` is **not** `Throwable` — `kotlinc` rejects it. |
| 6 | [C#](csharp/README.md) | yes | `int?`, `List<T>`, `Func<int, int>`, `interface` for a `shape`. `throw` wraps `ConfigurationErrorsException` and **runs**. `int` is 32-bit. |
| 7 | [Java](java/README.md) | yes | Runs, and `throw` wraps `IllegalArgumentException`. Everything else is Java 7: `Integer` boxing, `Object` + `instanceof`, one file per class. |
| 8 | [Go](go/README.md) | yes | Sharing is `*T`. Optional is `*GoNullable`. `try`/`throw` is `panic`/`recover`. Workable, not Go-like. |
| 9 | [C++](cpp/README.md) | yes | Correct answers behind `shared_ptr` / `r_optional_*` / `catch(...)`. The `error_msg` is lost. |
| 10 | [Rust](rust/README.md) | yes | Ownership-aware (`Rc`/`RefCell`/`Weak`, borrows) and the least Rust-like. No `Result`, no native `enum`, `match` as an `if let` chain. `try`/`catch` and a `trait` used as a type are now compile errors rather than wrong output, and optional params are fixed. |

Two scores that are not the same thing:

- **Correctness.** Python, JavaScript, Dart, Kotlin, C#, Java, Go, C++,
  Rust all printed the same lines. Swift was not run (`swiftc` missing).
  One exception, found by study 10 and **not** fixed: on C++ an optional
  `string` is a plain `std::string` at every position — field, local and
  parameter — so `""` and absent are the same value. The same program prints
  `PRESENT[]` on every other target and `ABSENT` on C++. Study 10 does not
  exercise it (it passes `"ada"` and nothing), so the row above still holds;
  it is recorded here because no study would otherwise catch it.
- **Idiom.** Python first, then the GC languages whose optional/`throw`
  already look like the language (JS, Dart), then the typed languages
  that get `T?` right but break `throw` (Swift, Kotlin), then C# (legal
  `int?` / `Func` / `interface`, odd exception type), then Java (ugly,
  but legal), then Go / C++ / Rust — each more honest about memory, each
  further from what a native file looks like.

What **none** of them get from Ranger today: a `Result` / `(T, error)` /
`throws` type, a real `enum` (Ranger `Enum` is an integer on every
target), a field-free `trait` as an interface, or `@params` surviving as
`Stack<T>` rather than `Stack_int`.

### Official targets not given a folder

The command-line table in
[`docs/site/src/content/docs/targets/overview.md`](../../docs/site/src/content/docs/targets/overview.md)
lists more languages than the first folders had. JavaScript, Java and
C# are folders now. Still without a study directory:

| Target | Option | Probed? | Would sit… |
| --- | --- | --- | --- |
| TypeScript | `-l=es6 -typescript` | writer | next to JavaScript. Same backend, plus types and `export`. No `tsc` here. |
| PHP | `-l=php` | writer | around JavaScript. `var $x`, `isset`, `throw new Exception`. No `php` here. |
| Scala | `-l=scala` | writer | interesting optional (`Option[TreeNode]`), but `ScalaReturnValue` exception hack and not a `case class`. No `scalac` here. |

`es5`, `swift3`, `nim`, `flow`, `ts` (as its own `-l`) and `llvm` live
in `Lang.rgr` with thinner templates. They are not in this ranking.

## Cross-target matrix

| Idiom | JS | Python | Dart | Swift | Kotlin | C# | Java | Go | C++ | Rust |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Two names, one object | object | object | object | class / ARC | object | object | object | `*T` | `shared_ptr` | `Rc<RefCell>` when proven |
| Weak back-edge | ignored | ignored | ignored (`T?`) | `weak var x: T?` | ignored (`T?`) | ignored | ignored | ignored (`*GoNullable`) | `r_weak` / `weak_ptr` | `Weak<RefCell>` |
| Optional | `undefined` | `None` | `T?` | `T?` | `T?` | `int?` / `String`+null | `null` / `Integer` | `*GoNullable` | `r_optional_*` | `Option<T>` (string **params** broken) |
| `try`/`throw` | `throw "…"` (runs) | `raise`/`except` (runs) | `throw "…"` (runs) | no `throws` (would not swiftc) | `throw "…"` **kotlinc rejects** | `ConfigurationErrorsException` (runs) | `IllegalArgumentException` (runs) | `panic`/`recover` (runs) | `throw string` / `catch(...)` (`error_msg` lost) | catch **dropped**, panic |
| Closed variants | `__rg_kind` | `_rg_kind` | `abstract class` + `is` | native `enum` | `sealed interface` | `interface` + `is` | `Object` + `instanceof` | tagged struct | `std::variant` | `enum` + `if let` |
| Ranger `Enum` | number | `int` | `int` | `Int` | `Int` | `int` | `Integer` | `int64` | `int` | `i64` |
| Ranger `trait` | mixin | mixin | mixin | mixin | mixin | mixin | mixin | mixin | mixin | mixin |
| Generics | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` |
| Higher-order fn | function | callable / hoisted def | `int Function(int)` | closure | `(Int) -> Int` | `Func<int, int>` | `LambdaSignature1` | `func(int64) int64` | `std::function` | `&mut dyn FnMut` |
| Error type | throw string | `Exception(str)` | throw string | no `throws`/`Result` | throw string illegal | `ConfigurationErrorsException` | `IllegalArgumentException` | no `(T, error)` | no `expected` | no `Result` |

The ownership / memory story is the part the compiler already thinks about
(Rust borrows and `Rc`, C++ `shared_ptr`/`weak_ptr`, Swift `final`/`weak var`).
The type story — `Result`, real enums, protocols/interfaces/traits, generics
that survive into the output — is what none of the targets get from Ranger
source today.

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
  — a Ranger `trait` used as a *type*. Rust refuses it: the trait is a mixin
  there and no type of that name is declared, so the writer used to emit
  `fn show(n : &mut Named)` with no `Named` in the file (`rustc: E0425`). The
  C++ writer still has the same hole (`std::shared_ptr<Named>`, no
  `class Named`); ES6 and the other dynamic targets are fine.
- [`rust/attempts/06_generic_function.rgr`](rust/attempts/06_generic_function.rgr)
  — Ranger rejects a free `@params` function on every target
- [`rust/attempts/09_throw_panics.rgr`](rust/attempts/09_throw_panics.rgr)
  — Rust refuses it: the catch block would be dropped and the binary would die
  on the error path. recover/except/catch on Go/Python/C++; runs on
  JavaScript, Dart, Java (`IllegalArgumentException`) and C#
  (`ConfigurationErrorsException`); illegal Swift and Kotlin (`String`
  is not `Error` / `Throwable`). Writer-only: PHP `Exception`, Scala
  `customException`.

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
8. **Do not emit unused preambles** (Rust/C++ ordered maps, Go
   `GoNullable` when unused, Kotlin empty `companion object`).

Items 1-4, 7 and 8 for Rust are ranked with their cost in
[`docs/plans/PLAN_RUST_SEMANTIC_IDIOMS.md`](../../docs/plans/PLAN_RUST_SEMANTIC_IDIOMS.md).
Details and ranked lists live in the per-target READMEs.
