# friendly — idiomatic target studies

Nine small Ranger programs in [`src/`](src/) try to express what a native
programmer would write. Each subdirectory compiles the same sources to one
target and records what came out: what is already the idiom, what works but
looks generated, and what the language cannot say.

```bash
# from the repository root, after npm run compile
bash gallery/friendly/compile.sh          # every folder below
bash gallery/friendly/compile.sh go       # one target
```

| Target | Study | Toolchain on this machine |
| --- | --- | --- |
| [JavaScript](javascript/README.md) | `-l=es6` → `node` | ran |
| [Python](python/README.md) | `-l=python` → `python3` | ran |
| [Dart](dart/README.md) | `-l=dart` → `dart run` | ran |
| [Swift](swift/README.md) | `-l=swift6` → `swiftc` when present | writer only (`swiftc` not installed) |
| [Kotlin](kotlin/README.md) | `-l=kotlin` → `kotlinc` + `java -jar` | ran |
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
| 6 | [Java](java/README.md) | yes | Runs, and `throw` wraps `IllegalArgumentException`. Everything else is Java 7: `Integer` boxing, `Object` + `instanceof`, one file per class. |
| 7 | [Go](go/README.md) | yes | Sharing is `*T`. Optional is `*GoNullable`. `try`/`throw` is `panic`/`recover`. Workable, not Go-like. |
| 8 | [C++](cpp/README.md) | yes | Correct answers behind `shared_ptr` / `r_optional_*` / `catch(...)`. The `error_msg` is lost. |
| 9 | [Rust](rust/README.md) | yes | Ownership-aware (`Rc`/`RefCell`/`Weak`, borrows) and the least Rust-like. No `Result`, catch dropped, optional string **params** broken. |

Two scores that are not the same thing:

- **Correctness.** Python, JavaScript, Dart, Kotlin, Java, Go, C++, Rust
  all printed the same lines. Swift was not run (`swiftc` missing).
- **Idiom.** Python first, then the GC languages whose optional/`throw`
  already look like the language (JS, Dart), then the typed languages
  that get `T?` right but break `throw` (Swift, Kotlin), then Java
  (ugly, but legal), then Go / C++ / Rust — each more honest about
  memory, each further from what a native file looks like.

What **none** of them get from Ranger today: a `Result` / `(T, error)` /
`throws` type, a real `enum` (Ranger `Enum` is an integer on every
target), a field-free `trait` as an interface, or `@params` surviving as
`Stack<T>` rather than `Stack_int`.

### Official targets not given a folder

The command-line table in
[`docs/site/src/content/docs/targets/overview.md`](../../docs/site/src/content/docs/targets/overview.md)
lists more languages than the first seven folders had. **JavaScript and
Java were the ones that were missing and that this machine can run**;
they are folders now. Still without a study directory:

| Target | Option | Probed? | Would sit… |
| --- | --- | --- | --- |
| TypeScript | `-l=es6 -typescript` | writer | next to JavaScript. Same backend, plus types and `export`. No `tsc` here. |
| C# | `-l=csharp` | writer | around Java / Kotlin. `int?`, `List<T>`, `throw new ConfigurationErrorsException("…")`. No `mcs` / `dotnet` here. |
| PHP | `-l=php` | writer | around JavaScript. `var $x`, `isset`, `throw new Exception`. No `php` here. |
| Scala | `-l=scala` | writer | interesting optional (`Option[TreeNode]`), but `ScalaReturnValue` exception hack and not a `case class`. No `scalac` here. |

`es5`, `swift3`, `nim`, `flow`, `ts` (as its own `-l`) and `llvm` live
in `Lang.rgr` with thinner templates. They are not in this ranking.

C# is the next folder worth opening: the TypeScript engine already
self-hosts on it, and the writer wraps `throw` in a real `Exception`.

## Cross-target matrix

| Idiom | JS | Python | Dart | Swift | Kotlin | Java | Go | C++ | Rust |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Two names, one object | object | object | object | class / ARC | object | object | `*T` | `shared_ptr` | `Rc<RefCell>` when proven |
| Weak back-edge | ignored | ignored | ignored (`T?`) | `weak var x: T?` | ignored (`T?`) | ignored | ignored (`*GoNullable`) | `r_weak` / `weak_ptr` | `Weak<RefCell>` |
| Optional | `undefined` | `None` | `T?` | `T?` | `T?` | `null` / `Integer` | `*GoNullable` | `r_optional_*` | `Option<T>` (string **params** broken) |
| `try`/`throw` | `throw "…"` (runs) | `raise`/`except` (runs) | `throw "…"` (runs) | no `throws` (would not swiftc) | `throw "…"` **kotlinc rejects** | `IllegalArgumentException` (runs) | `panic`/`recover` (runs) | `throw string` / `catch(...)` (`error_msg` lost) | catch **dropped**, panic |
| Closed variants | `__rg_kind` | `_rg_kind` | `abstract class` + `is` | native `enum` | `sealed interface` | `Object` + `instanceof` | tagged struct | `std::variant` | `enum` + `if let` |
| Ranger `Enum` | number | `int` | `int` | `Int` | `Int` | `Integer` | `int64` | `int` | `i64` |
| Ranger `trait` | mixin | mixin | mixin | mixin | mixin | mixin | mixin | mixin | mixin |
| Generics | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` |
| Higher-order fn | function | callable / hoisted def | `int Function(int)` | closure | `(Int) -> Int` | `LambdaSignature1` | `func(int64) int64` | `std::function` | `&mut dyn FnMut` |
| Error type | throw string | `Exception(str)` | throw string | no `throws`/`Result` | throw string illegal | `IllegalArgumentException` | no `(T, error)` | no `expected` | no `Result` |

The ownership / memory story is the part the compiler already thinks about
(Rust borrows and `Rc`, C++ `shared_ptr`/`weak_ptr`, Swift `final`/`weak var`).
The type story — `Result`, real enums, protocols/interfaces/traits, generics
that survive into the output — is what none of the targets get from Ranger
source today.

## Shared sources

[`src/`](src/) is ordinary Ranger, not a dialect per target. Comments in
those files still describe the Rust I wanted first; each language README
restates the native idiom. A C++-only hole (`r_optional_primitive<int>`
undefined unless `str2int` appears) is worked around in
[`src/06_generics.rgr`](src/06_generics.rgr) so every target stays green.

Failed or target-specific attempts:

- [`rust/attempts/02_optional_string_param.rgr`](rust/attempts/02_optional_string_param.rgr)
  — `Option<Option<String>>` on Rust; `*GoNullable` / `None` / `T?` elsewhere
- [`rust/attempts/06_generic_function.rgr`](rust/attempts/06_generic_function.rgr)
  — Ranger rejects a free `@params` function on every target
- [`rust/attempts/09_throw_panics.rgr`](rust/attempts/09_throw_panics.rgr)
  — panic on Rust; recover/except/catch on Go/Python/C++; runs on
  JavaScript, Dart, and Java (`IllegalArgumentException`); illegal Swift
  and Kotlin (`String` is not `Error` / `Throwable`). Writer-only: C#
  wraps `ConfigurationErrorsException`, PHP `Exception`, Scala
  `customException`.

## How the language could improve (all targets)

1. **A `Result` / error type** with a per-target lowering: Rust `Result` +
   `?`, Go `(T, error)`, Python exception or tuple, C++ `std::expected` or
   a named exception, Swift `throws` / `Result`, Kotlin `Result` /
   `Exception`, Java / C# / JS / Dart / PHP exceptions. Today
   `try`/`throw` is silently wrong on Rust, Swift, and Kotlin.
2. **`Enum` as a native enum** (`enum class`, `iota`, `IntEnum`, Swift
   `enum`, Kotlin `enum class`, Dart `enum`), not an integer.
3. **`shape` match as the target’s match**, with string payloads stored
   by value where the target allows it (`when`, Dart 3 `switch`).
4. **A field-free `trait` as the target’s interface** (`trait`,
   `interface`, `Protocol`, abstract base, Dart `abstract interface class`).
   Mixins stay for traits that carry fields.
5. **Optional as the target optional** everywhere — including Rust string
   parameters, Go `*T` instead of `GoNullable`, C++ `std::optional`.
6. **`record` as a value type** on Rust/C++/Swift (`struct`), Kotlin
   `data class`, Dart 3 record / `final` fields; `class` as a reference type.
7. **Keep `@params` in the output** (`Stack<T>`, `Stack[T]`) instead of
   `Stack_int`.
8. **Do not emit unused preambles** (Rust/C++ ordered maps, Go
   `GoNullable` when unused, Kotlin empty `companion object`).

Details and ranked lists live in the per-target READMEs.
