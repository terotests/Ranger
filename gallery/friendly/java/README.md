# Java — can Ranger write idiomatic Java?

The same nine programs as [`../src/`](../src/) compiled with `-l=java7`.
The writer emits **one `.java` file per class** under
[`generated/<study>/`](generated/). Then `javac` and `java`.

```bash
bash gallery/friendly/java/compile.sh
```

The Java I wanted is a current JDK: `record`, `Optional<T>`, `sealed`
/ `switch`, `enum`, `List` vs `ArrayList`, and exceptions `javac`
accepts. What comes out is Java 7.

## Verdict

**I could write Ranger that `javac` accepts and that prints the right
answers** for every study. Sharing is ordinary references. `null` is
`null`. `try`/`throw` **runs**: the writer wraps the string in
`new IllegalArgumentException("negative")`, so unlike Kotlin this file
is legal Java (`after_bad negative`).

**I could not write idiomatic Java.** A `record Point` is a mutable
`public class` whose fields are **`Integer`**, not `int` or a `record`.
A `shape` is `Object` plus `instanceof` / a cast, not a sealed hierarchy.
A Ranger `Enum` is an `Integer`. A Ranger `trait` is a mixin. `??` is
`x != null ? x : fallback`. Every `int` that might be optional becomes
`Integer`. There is no `Optional<T>`, no `enum`, no `List` for a
read-only parameter.

## How to write Ranger today if the Java output matters

| Wanted Java | Write this Ranger | What comes out |
| --- | --- | --- |
| `record Point(int x, int y)` | `record Point` | `public class Point { public Integer x; }` |
| `Optional<String>` / `orElse` | `@(optional)`, `(?? x "u")` | `String` + `null` |
| `throw new IllegalArgumentException` | `try` / `throw` | **works** — that exception |
| `sealed interface` / `switch` | `shape` + `match` | `Object` + `instanceof` |
| `enum Color` | `Enum Color` | `Integer` (`0` / `1`) |
| `interface Named` | `trait Named` | copied methods |
| `List<Integer>` | `[int]` | `ArrayList<Integer>` |
| `Optional<Integer> peek()` | `peek@(optional):int` | `Integer` (null = empty) |

Do use `try`/`throw` on Java — the writer wraps the string. Prefer a
`shape` only when the same source must also be Kotlin or Swift.
`@(weak)` is ignored.

---

## The studies

### 01 — classes, sharing, null

`Point.this.x = x` in the constructor. `parent` is `TreeNode`.
`Integer` for every number field. A human writes `int` and a `record`.

### 02 — optionals and Result

`findName` returns `String` (nullable). `parseInt` returns `Object`.
`describe` is two `instanceof` tests. `_getIntegerOrNull` is a
`Integer.parseInt` helper on the class.

### 03 — enums and match

`Color` is `Integer`. `Message` cases are classes; the matcher takes
`Object`.

### 04 — traits

Mixin. `show(User who)` cannot take a `Bot`. No `interface`.

### 05 — iteration

Index `for` + `.add`. `applyEach` takes `LambdaSignature1`; `main`
allocates `new LambdaSignature1() { public Integer run(Integer p) … }`.
Not `xs.stream().map` and not `(p) -> p + 1`.

### 06 — generics

`Stack_int` / `Stack_string`. `peek()` is `Integer`. No `Stack<T>`.

### 07 — strings and lists

`ArrayList<Integer>`, `String.valueOf` around every print.

### 08 — builder

`return this` is the Java fluent style on a mutable class.

### 09 — errors

The shape path runs. The throw attempt **runs**.

## What I could not write

`record`, `Optional<T>`, `enum`, `sealed` / `switch`, `interface`,
`List` vs `ArrayList`, primitive `int` fields, `var`, streams.

## How the language could improve (for Java)

1. `int` fields as `int`, optional ints as `OptionalInt` / `Integer`.
2. `record` → `record` (or a class with `final` fields).
3. `shape` → `sealed interface` + `switch` (Java 17+), not `Object`.
4. `Enum` → `enum`.
5. Field-free `trait` → `interface`.
6. Keep `@params` as `class Stack<T>`.
7. One file was the right Java call; keep it.
