# C# — can Ranger write idiomatic C#?

The same eleven programs as [`../src/`](../src/) compiled with `-l=csharp`,
then `mcs -langversion:latest` and `mono`. Snapshots are in
[`generated/`](generated/). Nothing generated needs a language version
past C# 7; Mono 6.8 is enough.

```bash
bash gallery/friendly/csharp/compile.sh
```

The C# I wanted is a current .NET: `record`, `T?` / `??`, `enum`,
`interface`, pattern `switch`, `IReadOnlyList<T>`, and exceptions a
library would throw (`ArgumentOutOfRangeException`, not
`ConfigurationErrorsException`).

## Verdict

**I could write Ranger that `mcs` accepts and that prints the right
answers** for every study. Several surfaces are already C#: `int` fields
(not boxed `Integer`), `int?` for an optional int, `List<T>`,
`Func<int, int>`, `static void Main`, and a `public interface` for a
`shape`. `try`/`throw` **runs**: the writer wraps the string in
`new ConfigurationErrorsException("negative")`.

**I could not write idiomatic C#.** A `record Point` is a mutable
`class` with public fields, not a `record`. A Ranger `Enum` is an `int`.
A Ranger `trait` is a mixin. `match` is `if (x is Case)` plus a cast,
not `switch`. Optional strings are `String` + `null`, not `string?`.
`??` is `(hit != null) ? hit : "unknown"`. `int` is 32-bit (Ranger
`int` is 64-bit on Go / Rust / Python). `throw` uses
`System.Configuration.ConfigurationErrorsException` — legal, but not
the exception a human picks. `RgParse` lands in every file that calls
`str2int`.

## How to write Ranger today if the C# output matters

| Wanted C# | Write this Ranger | What comes out |
| --- | --- | --- |
| `record Point(int X, int Y)` | `record Point` | `class Point { public int x; }` |
| `string?` / `??` | `@(optional)`, `(?? x "u")` | `String` + `null`; ternary |
| `int?` | `@(optional):int` | `int?` + `.Value` |
| `throw new ArgumentOutOfRangeException` | `try` / `throw` | **works** — `ConfigurationErrorsException` |
| `record Message` / `switch` | `shape` + `match` | `public interface union_*` + `is` |
| `enum Color` | `Enum Color` | `int` (`0` / `1`) |
| `interface INamed` | `trait Named` | copied methods |
| `xs.Sum()` / `Select` | a `for` that `push`es | index `for` + `.Add` |
| `Func<int, int>` | `f:(fn:int (p:int))` | exactly that |
| `Result<int, string>` | a `shape` | `interface union_*` |

Do use `try`/`throw` on C# — the writer wraps the string. Prefer a
`shape` if the same source must also be Kotlin or Swift. `@(weak)` is
ignored.

Compile the throw attempt with `-r:System.Configuration` (the shared
`compile.sh` already passes it).

---

## The studies

### 01 — classes, sharing, null

`alias = left` shares. `parent` is `TreeNode` (nullable reference, no
`?`). `Point` has `public int x`. A human writes a `record` and
`TreeNode?`.

### 02 — optionals and Result

`findName` returns `String`. `str2int` is `RgParse.Int` → `int?`.
`ParseOutcome` is `public interface union_ParseOutcome`. `describe` is
two `is` tests, not `switch (r)`. `_out` is the local because `out` is
reserved.

### 03 — enums and match

`Color` is `int`. `Message` is `public interface union_Message`.
`mcs` warns on unused `__ea0` / `__match0` for the empty `Ping` case.

### 04 — traits

Mixin. `show(User who)` cannot take a `Bot`. No `interface INamed`.

### 05 — iteration

`List<int>` and index `for`. `applyEach` takes `Func<int, int>`; `main`
writes `((Func<int, int>)((p) => { return p + 1; }))`. A human writes
`p => p + 1` and `xs.Sum()` / `xs.Select`.

### 06 — generics

`Stack_int` / `Stack_string`. `peek()` is `int?` — the right optional.
No `class Stack<T>`. `int` saturates at `int.MaxValue` in `RgParse`.

### 07 — strings and lists

`List<int>`, `String`. Fine, not `IReadOnlyList<int>` or interpolated
`$""`.

### 08 — builder

`return this` is the C# fluent style on a class. `with { Host = h }` on
a `record` cannot be said.

### 09 — errors

The shape path runs. The throw attempt **runs**:

```csharp
throw new ConfigurationErrorsException("negative");
} catch( Exception e ) { caught = e.Message; }
```

`after_bad negative` prints. Legal C#, odd exception type.

## What I could not write

`record`, `enum`, `string?` / `??`, pattern `switch`, `interface` from a
Ranger `trait`, `LINQ`, `async`/`await`, `IReadOnlyList<T>`,
`ArgumentOutOfRangeException`, 64-bit `int` / `long`.

## How the language could improve (for C#)

1. `throw` → `ArgumentException` / a small `RangerException`, not
   `ConfigurationErrorsException`.
2. `record` → `record` with `init` properties.
3. `??` → `??`; optional strings as `string?`.
4. `match` → `switch`.
5. `Enum` → `enum`.
6. Field-free `trait` → `interface`.
7. Keep `@params` as `class Stack<T>`.
8. `int` as `long` (or document the 32-bit cut) so Ranger `int` is one
   width everywhere.
