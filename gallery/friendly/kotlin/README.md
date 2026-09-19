# Kotlin — can Ranger write idiomatic Kotlin?

The same nine programs as [`../src/`](../src/) compiled with `-l=kotlin`,
then `kotlinc -include-runtime` and `java -jar`. Snapshots are in
[`generated/`](generated/).

```bash
bash gallery/friendly/kotlin/compile.sh
```

The Kotlin I wanted is Kotlin 2: `data class`, `T?` / `?:`, `sealed` /
`when`, `enum class`, `interface`, `List` vs `MutableList`, function
types, and `Result` or exceptions that `kotlinc` accepts.

## Verdict

**I could write Ranger that `kotlinc` accepts and that prints the right
answers** for every study. Several surfaces are already Kotlin: `String?`
/ `Int?`, `MutableList` / `arrayListOf`, `fun main(args: Array<String>)`,
a `sealed interface` for a `shape`, `is` narrowings, and
`(Int) -> Int` for a function-typed parameter.

**I could not write idiomatic Kotlin.** A `record Point` is a `class`
with `@JvmField` and an `init` that assigns the constructor arguments
again, not a `data class`. A Ranger `Enum` is an `Int`. A Ranger `trait`
is a mixin. `when` is never emitted — `match` is a chain of `if (x is T)`.
`??` is `if (hit != null) hit!! else "unknown"`, not `hit ?: "unknown"`.
`try`/`throw` writes `throw "negative"`, and **`kotlinc` rejects it**
(`String` is not `Throwable`). Empty `companion object` blocks sit on
classes that have no statics. `Int` is 32-bit.

## How to write Ranger today if the Kotlin output matters

| Wanted Kotlin | Write this Ranger | What comes out |
| --- | --- | --- |
| `data class Point(val x: Int, val y: Int)` | `record Point` | `class Point(x: Int, y: Int)` + `@JvmField` + `init` |
| `String?` / `?:` | `@(optional)`, `(?? x "u")` | `String?`; `if (x != null) x!! else "u"` |
| `sealed class` / `when` | `shape` + `match` | `sealed interface` + `if (x is Case)` |
| `enum class Color` | `Enum Color` | `Int` (`0` / `1`) |
| `interface Named` | `trait Named` | copied methods |
| `xs.sum()` / `map` | a `for` that `push`es | `for (i in xs.indices)` + `.add` |
| `(Int) -> Int` | `f:(fn:int (p:int))` | exactly that |
| `Result<Int, String>` | a `shape` | `sealed interface union_*` |
| `throw Exception("…")` | `throw "…"` | **does not kotlinc** |

Do not use `try`/`throw` if the `.kt` must `kotlinc`. Use a `shape`.
`@(weak)` is ignored — Kotlin has GC; `parent` is `TreeNode?`.

---

## The studies

### 01 — classes, sharing, null

```kotlin
class Point(x: Int, y: Int) {
    @JvmField var x: Int = 0
    @JvmField var y: Int = 0
    init { this.x = x; this.y = y }
}
class TreeNode {
    @JvmField var parent: TreeNode? = null
    fun adopt(c: TreeNode) { c.parent = this; kids.add(c) }
}
```

`alias = left` shares. `parent!!` unwraps. A human writes a `data class`
for `Point` and would not put `@JvmField` on every property.

### 02 — optionals and Result

`findName` returns `String?`. `str2int` is `rangerStr2IntPrefix`:
`Regex(…).find(s)?.value.toIntOrNull()`. `ParseOutcome` is

```kotlin
sealed interface union_ParseOutcome
class ParseOutcome_Ok(value: Int) : union_ParseOutcome
class ParseOutcome_Err(message: String) : union_ParseOutcome
```

That is close to a sealed hierarchy. It is not `Result<Int, String>`,
and `describe` is two `if (r is …)` tests, not `when (r)`.

### 03 — enums and match

`Color` is `Int`. `Message` is a `sealed interface` with one class per
case — the right Kotlin *family*, then `if (m is Message_Text)` instead
of `when (m) { is Message_Text -> … }`.

### 04 — traits / interfaces

Mixin. `show(who: User)` cannot take a `Bot`. No `interface Named`.

### 05 — iteration

`MutableList<Int>` and `for (i in xs.indices)`. `applyEach` takes
`(Int) -> Int`; `main` writes `fun(p: Int): Int { return p + 1 }`.
A human writes `{ it + 1 }` and `xs.sum()` / `xs.map { it * 2 }`.

### 06 — generics

`Stack_int` / `Stack_string`. `peek(): Int?` is the right optional.
No `class Stack<T>`.

### 07 — strings and lists

`greet(name: String)`, `total(xs: MutableList<Int>)` — not
`List<Int>` for a read-only parameter. `firstChar` is `s.substring(0, 1)`.

### 08 — builder

Copying builder is a helper class. `return this` on `MutRequest` is
the Kotlin fluent style on a reference (`fun withHost(h: String): MutRequest`).
A `data class` `copy(host = h)` builder cannot be said.

### 09 — errors

The shape path runs. The throw attempt

```kotlin
throw "negative"
} catch (e: Exception) { … }
```

is rejected by `kotlinc`. Same class of hole as Swift.

## What I could not write

`data class`, `enum class`, `when` as an expression, `interface` /
`fun interface`, `Result` / `runCatching`, `xs.sum()` / `map`/`filter`,
`List` vs `MutableList` as a choice, `val` properties, `companion object`
only when there are statics, `throw Exception`, coroutines.

## How the language could improve (for Kotlin)

1. `throw` must wrap the string in `Exception(…)` (or refuse).
2. `record` → `data class` with `val` fields.
3. `??` → `?:` ; `null?` → `== null` without a redundant `!!` on the
   true branch.
4. `match` → `when`.
5. `Enum` → `enum class`.
6. Field-free `trait` → `interface`.
7. Read-only `[T]` → `List<T>`, not `MutableList<T>`.
8. Drop empty `companion object` and `@JvmField` unless Java interop
   is requested.
9. Keep `@params` as `class Stack<T>`.
