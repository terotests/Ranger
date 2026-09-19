# Attempts — forms the Rust target cannot express

Each file here is a pattern that a Ranger programmer reaches for and the Rust
target cannot write. They are **not** dead files: `compile.sh` runs them and
requires each one to be *refused*, with the error the file declares on its first
line:

```text
; EXPECT-ERROR: <substring the compiler must print>
```

That is the rule this directory exists to hold: a form the target cannot express
has to be a compile error naming the limitation — never a binary that panics, and
never Rust that does not exist. Two of the three files below were the other thing
first.

| File | Wanted Rust | What happens now |
| --- | --- | --- |
| [`04_trait_as_type.rgr`](04_trait_as_type.rgr) | `fn show(n: &dyn Named)` | Refused. A Ranger `trait` is a mixin: its methods are copied into each class that `does` it and no Rust type of that name is declared. The writer used to emit `fn show(mut n : &mut Named)` with no `Named` in the file — `rustc: E0425`. |
| [`06_generic_function.rgr`](06_generic_function.rgr) | `fn identity<T>(x: T) -> T` | Refused by Ranger itself: `@params` on a free function is not a form the parser has (`Undefined variable x`). Monomorphized generic *classes* work. |
| [`09_throw_panics.rgr`](09_throw_panics.rgr) | `try` / `catch` | Refused. Rust has no exceptions, so the template wrote the try block and a comment where the catch belonged: legal Ranger, accepted by rustc, recovery path gone. `throw` on its own is still legal — `panic!` is a faithful lowering of an uncaught throw. |

## What left this directory

`02_optional_string_param.rgr` is now [`../../src/10_optional_params.rgr`](../../src/10_optional_params.rgr).
It was never a language limit, only a writer bug — and not a string-specific one:
every `@(optional)` parameter came out as `Option<Option<T>>`, scalar, string and
object alike. It compiles, rustc-builds and runs.

## Things with no `.rgr` at all, because the language has no spelling

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

Each of these is an item in
[`docs/plans/PLAN_RUST_SEMANTIC_IDIOMS.md`](../../../../docs/plans/PLAN_RUST_SEMANTIC_IDIOMS.md),
with what it would cost.
