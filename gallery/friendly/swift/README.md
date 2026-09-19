# Swift — can Ranger write idiomatic Swift?

The same nine programs as [`../src/`](../src/) compiled with `-l=swift6`.
Snapshots are in [`generated/`](generated/). This environment has no
`swiftc`; the study validates the writer. On a Mac,
`bash gallery/friendly/swift/compile.sh` will `swiftc -O` and run when
`swiftc` is on `PATH`.

The Swift I wanted is Swift 6: `struct` vs `class` chosen on purpose,
`T?` / `guard let`, `throws` / `Result`, `enum` with associated values,
`protocol` + `extension`, value semantics, and ARC `weak`. Several of
those come out in the right *shape*.

## Verdict

**I could write Ranger whose Swift a Swift programmer would recognize.**
`@(optional)` is `String?` / `Int?`. `??` is `??`. `@(weak optional)` is
`weak var parent: TreeNode?`. A `shape` is a native `enum union_Message`
with `if case let`. Classes that nothing extends are `final class`.
Arrays use `.append`. Entry is `__main__swift()` (not `@main`, to avoid
clashing with the generated `==`).

**I could not write idiomatic Swift.** A `record Point` is still
`final class Point: Hashable` with identity `==` (`===`), not a `struct`.
Every class gets `Hashable` via `ObjectIdentifier` and a global
`func ==`. A Ranger `Enum` is an `Int`. A Ranger `trait` is a mixin, not
a `protocol`. `try`/`throw` used to emit `throw "negative"` on a method that was
**not** marked `throws`, and `"negative"` is not `Error` — see §09, now
fixed (but not compiled here). There is no `guard`, no `async`, no
`some Protocol`.
Labeled call sites (`manhattan(p: origin)`) are Swift-ish and also
verbose.

## How to write Ranger today if the Swift output matters

| Wanted Swift | Write this Ranger | What comes out |
| --- | --- | --- |
| `struct Point` | `record Point` | `final class Point: Hashable` |
| `String?` | `@(optional)` | `String?` / `nil` |
| `weak var parent: Node?` | `@(weak optional)` | exactly that |
| `enum Message { case ping; case text(String) }` | `shape Message` | `enum union_Message { case Message_Ping(Message_Ping) … }` wrapping classes |
| `enum Color` | `Enum Color` | `Int` |
| `protocol Named` | `trait Named` | copied methods |
| `throws` / `Result` | `try` / `throw` | `func … throws`, `try` at the call site, `throw RgError(message:)` — writer-only, see §09 |
| value-type mutation | mutating a `[T]` param | `inout` + `&` (when the mutation pass sees it) |

`try`/`throw` should `swiftc` now; it has not been compiled on this machine.
A `shape` is still the portable form, because Rust refuses `try`/`catch`.
Do not expect a `record` to be a `struct`.

---

## The studies

### 01 — classes, ARC, weak

```swift
final class TreeNode : Hashable {
    var kids : [TreeNode] = [TreeNode]()
    weak var parent : TreeNode? = nil
    func adopt(c : TreeNode) {
        c.parent = self
        self.kids.append(c)
    }
}
```

This is the Swift a book would show for a tree. `Point` being a class
with identity equality is the miss: a 2-D point should be a `struct`
and `Equatable` by fields. `alias = left` shares, correctly, because
both are classes.

### 02 — optionals and Result

```swift
func findName(names : [String], key : String) -> String?
func parseInt(text : String) -> union_ParseOutcome
```

`String?` is the idiom. `union_ParseOutcome` is an enum of *classes*
(`case ParseOutcome_Ok(ParseOutcome_Ok)`), not
`enum ParseOutcome { case ok(Int); case err(String) }`. `??` on a local
is Swift `??`. Optional *parameters* of string, which break Rust, emit
`String?` here.

### 03 — enums and match

`Color` is `Int`. `Message` is a real Swift enum. `match` is
`if case let .Message_Text(t) = m`. Associated values are whole objects,
not the fields (`body`, `dx`) inlined into the case.

### 04 — traits / protocols

Mixin. `label()` is on `User` and `Bot` separately. No `protocol Named`.
`show` takes `User`, not `any Named`.

### 05 — iteration

Indexed / `enumerated()` loops, `.append`. `applyEach` takes a closure.
No `xs.map { $0 * 2 }`.

### 06 — generics

`Stack_int` / `Stack_string`. `peek() -> Int?` / `String?` — good
optional, no generic `Stack<T>`.

### 07 — strings

`greet(name: String) -> String`. Labeled arguments. `firstChar` uses
Ranger `substring` (code-point indexed), not `name.prefix(1)`.

### 08 — builder

`return this` is `return self` on a class — the Swift fluent style on a
reference type. A consuming value builder (`func withHost(_ h: String) -> Self`
on a `struct`) cannot be said, because `record` is not a `struct`.

### 09 — errors

The shape path is the portable one. The throw attempt **used to** write:

```swift
func mustBePositive(value : Int) -> Int {
    if value < 0 { throw "negative" }        // not `throws`; String is not Error
    return value
}
do { let ok : Int = g.mustBePositive(value : 3) } catch { … }   // missing `try`
```

Three separate refusals from `swiftc`. It writes this now:

```swift
struct RgError: Error, CustomStringConvertible {
    let message: String
    var description: String { message }
}

func mustBePositive(value : Int) throws -> Int {
    if value < 0 { throw RgError(message: "negative") }
    return value
}
do { let ok : Int = try g.mustBePositive(value : 3) } catch { caught = String(describing: error) }
```

`CustomStringConvertible` is what keeps `error_msg` right without a template of
its own — `String(describing: error)` is the message rather than
`RgError(message: "…")`. A small error type rather than
`extension String: Error {}` (which is what the older `swift3` target does),
because extending a stdlib type with a stdlib protocol is a retroactive
conformance and Swift 6 language mode warns about it.

**`throws` does not have to propagate.** Ranger already refuses a call to a
`@(throws)` function that is not inside a `try { }` block, so the caller's
`do { } catch { }` is always there.

**Not compiled here.** `swiftc` is not installed on this machine and
`download.swift.org` is blocked by the environment's network policy, so this is
writer output read against Swift's rules, not a `swiftc` run. The Kotlin fix in
the same change *is* compiler-verified — see
[`../kotlin/src/11_throw_catch.rgr`](../kotlin/src/11_throw_catch.rgr) — and it
is why there is no Swift study beside it.

**One known limit.** The `try` keyword goes immediately before the call, which
Swift accepts on the right of an assignment and in an argument. It is not
enough to the right of a binary operator — `"x " + (try f())` is *"'try' cannot
appear to the right of a non-assignment operator"* — and covering that needs
the keyword hoisted to the front of the statement, which the writer cannot see
from the call site.

## What I could not write

`struct` vs `class` as a choice, `enum` with inline associated values,
`protocol` / `extension`, `throws` / `Result` / `try?` / `guard let`,
`async`/`await`, `some Protocol`, `Sendable`, property wrappers,
`@main`.

## How the language could improve (for Swift)

1. `record` → `struct` + memberwise `Equatable`; `class` stays a class.
2. `throw` must mark the Ranger function `throws` and wrap the string
   in a small `Error` type, or refuse to emit.
3. `shape` cases as associated values (`case text(String)`), not
   `case Text(Message_Text)`.
4. `Enum` → a Swift `enum` without payloads.
5. Field-free `trait` → `protocol`.
6. `asString` → `CustomStringConvertible`.
7. Drop identity `Hashable` / `==` on types that have no identity in the
   Ranger source (records, value shapes).
