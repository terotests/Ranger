# Dart — can Ranger write idiomatic Dart?

The same eleven programs as [`../src/`](../src/) compiled with `-l=dart`,
then `dart run`. Snapshots are in [`generated/`](generated/).

```bash
bash gallery/friendly/dart/compile.sh
```

The Dart I wanted is Dart 3: sound null safety (`T?` / `!` / `??`),
`List<T>` / `Map<K,V>`, top-level `void main(List<String> args)`,
`sealed` / `enum`, records or classes with final fields, and a `Result`
or exceptions a Flutter package would keep. The writer is explicitly
aimed at that package surface (`TARGET_NOTES.md`, `-pubspec`).

## Verdict

**I could write Ranger that `dart run` accepts and that prints the right
answers** for every study. This is one of the closest targets. `@(optional)`
is `T?`. Unwrap is `!`. `List<int>` / `List<String>` literals are `[1, 2, 3]`.
`void main(List<String> args)` is at file scope. A function-typed
parameter is `int Function(int)`. `try`/`throw` **runs**: Dart allows
`throw "negative"` and `catch (e)` reads the string.

**I could not write idiomatic Dart 3.** A `record Point` is a mutable
`class` with public fields, not a Dart 3 `record` or a class with
`final` fields. A `shape` is `abstract class union_*` plus implementing
classes and `if (x is Case)`, not a `sealed class` / `switch`. A Ranger
`Enum` is an `int`. A Ranger `trait` is a mixin. `??` is
`(hit != null) ? hit! : "unknown"`, not `hit ?? "unknown"`. There is no
`Result`. Generics monomorphize to `Stack_int`. Types are written
`Point origin = Point(3, 4)` rather than `final origin = Point(3, 4)`.

## How to write Ranger today if the Dart output matters

| Wanted Dart | Write this Ranger | What comes out |
| --- | --- | --- |
| `class Point { final int x; final int y; }` | `record Point` | mutable `class Point` with `int x = 0` |
| `String?` / `??` | `@(optional)`, `(?? x "u")` | `String?`; `(x != null) ? x! : "u"` |
| `sealed class Message` | `shape Message` | `abstract class union_Message` + `implements` |
| `enum Color { red, green, blue }` | `Enum Color` | `int` |
| `abstract interface class Named` | `trait Named` | copied methods |
| `xs.fold(0, (a, v) => a + v)` | a `for` that `push`es | C-style index loop + `.add` |
| `int Function(int)` | `f:(fn:int (p:int))` | exactly that |
| `Result<int, String>` / exceptions | `shape` or `try`/`throw` | abstract union, **or** `throw "…"` which **runs** |
| `void main(List<String> args)` | `sfn main` | exactly that |

`try`/`throw` is an acceptable Dart-only spelling (unlike Rust / Kotlin /
Swift). A shape is still better if the same source must run on those
targets. `@(weak)` is ignored; `parent` is `TreeNode?`.

`-pubspec` / `-flutter` are not used in this study. They write a
`pubspec.yaml` around the same class file.

---

## The studies

### 01 — classes, sharing, null safety

```dart
class TreeNode {
  String name = "";
  List<TreeNode> kids = [];
  TreeNode? parent = null;
  void adopt(TreeNode c) {
    c.parent = this;
    kids.add(c);
  }
}
```

`alias = left` shares. `leaf.parent!` unwraps. `Point` being a mutable
class is the miss — a 2-D point wants `final` fields or a Dart 3 record.

### 02 — optionals and Result

`String? findName(List<String> names, String key)`. `str2int` is
`int.tryParse` behind `rangerStr2IntPrefix`. `ParseOutcome` is an
`abstract class` plus two implementors. `describe` is two `is` tests.
Not a Dart 3 `sealed` / `switch`, not `Result`.

### 03 — enums and match

`Color` is `int`. `Message` is `abstract class union_Message`. Dart 3
`enum` and `sealed class` are not emitted.

### 04 — traits

Mixin. `show(User who)` cannot take a `Bot`. No `abstract interface class`.

### 05 — iteration

Index `for` + `.add`. `applyEach` takes `int Function(int)`. The lambda
is `(p) { return p + 1; }` — a human writes `(p) => p + 1` and
`xs.fold` / `xs.map`.

### 06 — generics

`Stack_int` / `Stack_string`. `int? peek()` is the right optional.
No `class Stack<T>`.

### 07 — strings

`greet(String name)`, `total(List<int> xs)`. `firstChar` uses Ranger
`substring`. Fine, not `name[0]` / `name.substring(0, 1)` written by hand
in a different style.

### 08 — builder

`return this` is the Dart fluent style on a class. A `copyWith` on an
immutable type cannot be said.

### 09 — errors

The shape path runs. The throw attempt **runs**:

```dart
throw "negative";
} catch (e) { caught = e.toString(); }
```

`after_bad negative` prints. That is legal Dart and closer to idiom than
Kotlin’s rejected `throw "…"`.

## What I could not write

Dart 3 `record` / `final` fields, `enum`, `sealed` + `switch`,
`abstract interface class`, `Result`, collection methods (`fold`, `map`,
`where`), `async`/`await`, `extension`, typedefs I control, `pubspec`
without the extra flags.

## How the language could improve (for Dart)

1. `record` → a Dart 3 `record` or a class with `final` fields.
2. `??` → `??`; drop the redundant `!` on a promoted local.
3. `shape` → `sealed class` + `switch`.
4. `Enum` → `enum`.
5. Field-free `trait` → `abstract interface class`.
6. Keep `@params` as `class Stack<T>`.
7. `final` locals where the Ranger name is not reassigned.
8. One-expression lambdas as `(p) => p + 1`.
9. `asString` → `toString()` override so `print(obj)` works.
