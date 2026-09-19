# friendly — idiomatic target studies

Eleven small Ranger programs in [`src/`](src/) try to express what a native
programmer would write. Each subdirectory compiles the same sources to one
target and records what came out: what is already the idiom, what works but
looks generated, and what the language cannot say.

```bash
# from the repository root, after npm run compile
bash gallery/friendly/compile.sh          # every folder below
bash gallery/friendly/compile.sh go       # one target
```

One program compiled eleven ways has to print the same thing eleven times, so
a run over every target ends by diffing each study's output across the targets
that actually ran. Nothing checked that until study 11: an optional string set
to `""` read back as absent on C++ and as present everywhere else, and both
outputs sat in this directory looking fine on their own.

A target folder may hold `src/` of its own, for a study the same program cannot
express on every target. There are two: `rust/src/11_behaviour_traits.rgr`,
because the C++ writer names a trait type it never declares, and
`kotlin/src/11_throw_catch.rgr`, because Rust refuses `try`/`catch` outright. It may also hold `attempts/`:
forms *that* target cannot express.
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
| [Kotlin](kotlin/README.md) | `-l=kotlin` → `kotlinc` + `java -jar` | ran (kotlinc 2.0.21) |
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
| 4 | [Swift](swift/README.md) | writer only | `T?`, `??`, `weak var`, native `enum` for a `shape`. `throw` now emits `func … throws`, `try` at the call site and a small `Error` type — writer-checked, not `swiftc`-checked. |
| 5 | [Kotlin](kotlin/README.md) | yes | `T?`, `sealed interface`, `(Int) -> Int`. `throw` is `Exception(msg)` now, kotlinc-clean and `error_msg`-correct. |
| 6 | [C#](csharp/README.md) | yes | `int?`, `List<T>`, `Func<int, int>`, `interface` for a `shape`. `throw` wraps `ConfigurationErrorsException` and **runs**. `int` is 32-bit. |
| 7 | [Java](java/README.md) | yes | Runs, and `throw` wraps `IllegalArgumentException`. Everything else is Java 7: `Integer` boxing, `Object` + `instanceof`, one file per class. |
| 8 | [Go](go/README.md) | yes | Sharing is `*T`. Optional is `*GoNullable`. `try`/`throw` is `panic`/`recover`. Workable, not Go-like. |
| 9 | [C++](cpp/README.md) | yes | `enum class` for a Ranger `Enum` now, and an optional string is an `r_optional_primitive<std::string>` rather than a `std::string` with `""` meaning absent — the one answer that used to differ from every other target. Still `shared_ptr` everywhere. `error_msg` carries the real text, and the map preamble only goes in when a map is reachable (study 07: 237 → 88 lines). |
| 10 | [Rust](rust/README.md) | yes | Ownership-aware (`Rc`/`RefCell`/`Weak`, borrows) and still the least Rust-like, though less so: a Ranger `Enum` is a real `enum`, a `shape` match is a real `match`, names are `snake_case` and a behaviour-only `trait` is a `trait`. What is left is the big one — no `Result`, no `?`. `try`/`catch` and a `trait` used as a type are compile errors rather than wrong output, and optional params are fixed. |

Two scores that are not the same thing:

- **Correctness.** Python, JavaScript, Dart, Kotlin, C#, Java, Go, C++,
  Rust all printed the same lines, and `compile.sh` now proves it by diffing
  them rather than leaving it to the reader. The one place they disagreed was
  found by study 10 and is fixed: on C++ an optional `string` was a plain
  `std::string` at every position — field, local and parameter — so `""` and
  absent were the same value. Study 11 is the study that asks the question,
  and it is the same answer on every target now.
- **Idiom.** Python first, then the GC languages whose optional/`throw`
  already look like the language (JS, Dart), then the typed languages
  that get `T?` right but break `throw` (Swift, Kotlin), then C# (legal
  `int?` / `Func` / `interface`, odd exception type), then Java (ugly,
  but legal), then Go / C++ / Rust — each more honest about memory, each
  further from what a native file looks like.

What **none** of them get from Ranger today: a `Result` / `(T, error)` /
`throws` type, or `@params` surviving as `Stack<T>` rather than `Stack_int`.
A real `enum` and a field-free `trait` as an interface are Rust-and-C++ only
so far; the other eight still lower an `Enum` to an integer.

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
| Optional | `undefined` | `None` | `T?` | `T?` | `T?` | `int?` / `String`+null | `null` / `Integer` | `*GoNullable` | `r_optional_*`, string included | `Option<T>` |
| `try`/`throw` | `throw "…"` (runs) | `raise`/`except` (runs) | `throw "…"` (runs) | no `throws` (would not swiftc) | `throw "…"` **kotlinc rejects** | `ConfigurationErrorsException` (runs) | `IllegalArgumentException` (runs) | `panic`/`recover` (runs) | `throw string` / `catch(...)` (`error_msg` lost) | catch **dropped**, panic |
| Closed variants | `__rg_kind` | `_rg_kind` | `abstract class` + `is` | native `enum` | `sealed interface` | `interface` + `is` | `Object` + `instanceof` | tagged struct | `std::variant` | `enum` + `if let` |
| Ranger `Enum` | number | `int` | `int` | `Int` | `Int` | `int` | `Integer` | `int64` | `enum class` when every use fits | `enum` when every use fits |
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
  — a **field-bearing** Ranger `trait` used as a *type*. Rust refuses it: such a
  trait is a mixin, its fields are copied into each consumer, and Rust has no
  associated fields to hold them. A **behaviour-only** trait is a real Rust
  trait now — see [`rust/src/11_behaviour_traits.rgr`](rust/src/11_behaviour_traits.rgr).
  The C++ writer still has the hole for both kinds (`std::shared_ptr<Named>`,
  no `class Named`); ES6 and the other dynamic targets are fine.
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
