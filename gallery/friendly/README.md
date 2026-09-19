# friendly — idiomatic target studies

Nine small Ranger programs in [`src/`](src/) try to express what a native
programmer would write. Each subdirectory compiles the same sources to one
target and records what came out: what is already the idiom, what works but
looks generated, and what the language cannot say.

```bash
# from the repository root, after npm run compile
bash gallery/friendly/compile.sh          # rust go python cpp swift kotlin dart
bash gallery/friendly/compile.sh go       # one target
```

| Target | Study | Toolchain on this machine |
| --- | --- | --- |
| [Rust](rust/README.md) | `-l=rust` → `rustc` | ran |
| [Go](go/README.md) | `-l=go` → `go build` | ran |
| [Python](python/README.md) | `-l=python` → `python3` | ran |
| [C++](cpp/README.md) | `-l=cpp` → `g++ -std=c++17` | ran |
| [Swift](swift/README.md) | `-l=swift6` → `swiftc` when present | writer only (`swiftc` not installed) |
| [Kotlin](kotlin/README.md) | `-l=kotlin` → `kotlinc` + `java -jar` | ran |
| [Dart](dart/README.md) | `-l=dart` → `dart run` | ran |

License: AGPL-3.0-or-later, with the rest of `gallery/`.

## Cross-target verdict

The Ranger compiled and the answers matched on every target that has a
toolchain here (`manhattan 7`, `shared 1`, `ok:42`, `ping`, …). **Idiom
is a per-target question.** The same source is close to Python, then Dart,
recognizable Swift (until `throw`) and Kotlin (`T?` / sealed interface,
until `throw`), workable Go, reference-counted C++, and ownership-aware
but un-Rust-like Rust.

| Idiom | Rust | Go | Python | C++ | Swift | Kotlin | Dart |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Two names, one object | `Rc<RefCell>` when proven | `*T` | object | `shared_ptr` | class / ARC | object | object |
| Weak back-edge | `Weak<RefCell>` | ignored (`*GoNullable`) | ignored (`None`) | `r_weak` / `weak_ptr` | `weak var x: T?` | ignored (`T?`) | ignored (`T?`) |
| Optional | `Option<T>` (string **params** broken) | `*GoNullable` | `None` | `r_optional_*` | `T?` | `T?` | `T?` |
| `try`/`throw` | catch **dropped**, panic | `panic`/`recover` (runs) | `raise`/`except` (runs) | `throw string` / `catch(...)` (`error_msg` lost) | `throw` without `throws` (would not swiftc) | `throw "…"` — **kotlinc rejects** | `throw "…"` / `catch` (runs) |
| Closed variants | `enum` + `if let`; string case is a cell | tagged struct | `_rg_kind` classes | `std::variant` | native `enum` + `if case let` | `sealed interface` + `if (x is T)` | `abstract class` + `is` |
| Ranger `Enum` | `i64` | `int64` | `int` | `int` | `Int` | `Int` | `int` |
| Ranger `trait` | mixin | mixin | mixin | mixin | mixin | mixin | mixin |
| Generics | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` | `Stack_int` |
| Higher-order fn | `&mut dyn FnMut` | `func(int64) int64` | callable / hoisted def | `std::function` | closure | `(Int) -> Int` | `int Function(int)` |
| Error type | no `Result` | no `(T, error)` | `Exception(str)` | no `expected` | no `throws`/`Result` | no `Result`; throw string illegal | no `Result`; throw string runs |

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
  — panic on Rust; recover/except/catch on Go/Python/C++; runs on Dart;
  illegal Swift and Kotlin (`String` is not `Error` / `Throwable`)

## How the language could improve (all targets)

1. **A `Result` / error type** with a per-target lowering: Rust `Result` +
   `?`, Go `(T, error)`, Python exception or tuple, C++ `std::expected` or
   a named exception, Swift `throws` / `Result`, Kotlin `Result` /
   `Exception`, Dart exceptions. Today `try`/`throw` is silently wrong on
   Rust, Swift, and Kotlin.
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
