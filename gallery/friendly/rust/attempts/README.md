# Attempts that did not become idiomatic Rust

These files are not in `compile.sh`. Each one is a pattern I wanted and
could not ship.

| File | Wanted Rust | What happened |
| --- | --- | --- |
| [`02_optional_string_param.rgr`](02_optional_string_param.rgr) | `fn shown(maybe: Option<String>) -> String` | Ranger accepts it. The writer emits `Option<Option<String>>`. `rustc` rejects the body and every call site. |
| [`06_generic_function.rgr`](06_generic_function.rgr) | `fn identity<T>(x: T) -> T` | Ranger rejects `@params` on a free function (`Undefined variable x`, `Undefined variable identity`). |
| [`09_throw_panics.rgr`](09_throw_panics.rgr) | `try` / `catch` | Compiles. `throw` is `panic!`. The catch block is a comment. The binary dies on the error path. Same file is the throw probe on the other targets: recover/except/catch on Go/Python/C++, runs on Dart, rejected by `kotlinc`, would not `swiftc`. |

Things I did not even write as `.rgr`, because the language has no spelling:

- `Result<T, E>` and `?`
- `impl Display for T` / `impl From<T> for U` / `impl Iterator`
- lifetimes (`'a`, `&str` as a return, `Option<&T>`)
- `async` / `await`
- `Arc<Mutex<T>>` / threads / `Send`
- `Drop` / RAII guards
- `mod` / crates / `use`
- `unsafe` written by the programmer
- `macro_rules!`
- `if let` / `while let` / match guards / match as an expression
- consuming `self` (by-value methods)
- `dyn Trait` as a user-written type
