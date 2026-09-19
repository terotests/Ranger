# C++ — can Ranger write idiomatic C++?

The same nine programs as [`../src/`](../src/) compiled with `-l=cpp`,
then `g++ -std=c++17`. Snapshots are in [`generated/`](generated/).

```bash
bash gallery/friendly/cpp/compile.sh
```

The C++ I wanted is C++17 as a human writes it: `std::unique_ptr` where
one owner is enough, `std::optional`, `std::variant`, `enum class`,
`std::string_view` / `std::span`, exceptions or `std::expected`, and RAII.
Ranger’s C++ target is a reference-counted port of the object model:
almost everything is `std::shared_ptr<T>`.

## Verdict

**I could write Ranger that `g++` accepts and that prints the right
answers** for every study (study 06 needed a `str2int` helper in the
source so the writer would emit `r_optional_primitive<int>` — without it
`peek` names a type that was never defined).

**I could not write idiomatic C++.** A `record Point` is still
`shared_ptr<Point>`, not a value struct. Read-only object parameters are
`const std::shared_ptr<Point>&`, which is the ownership pass doing its
job and still not `const Point&`. `@(optional)` is
`r_optional_primitive<T>` / `r_optional_union<T>`, not `std::optional`.
A `shape` is `std::variant<Ok, shared_ptr<Err>>` — close, then the string
case is a cell. `@(weak optional)` is `r_weak<T>` over `std::weak_ptr`,
and `TreeNode` inherits `enable_shared_from_this`. That part *is* the
C++ idiom for a cycle. `try`/`throw` compiles to `throw std::string` +
`catch(...)`, so `error_msg` is the literal `"unspecified error"`. Every
file opens with ~180 lines of unused `rg_ordered_map` / FxHash preamble.
`int` is 32-bit `int`, not `int64_t` (buffers are the exception).

## How to write Ranger today if the C++ output matters

| Wanted C++ | Write this Ranger | What comes out |
| --- | --- | --- |
| `struct Point { int x, y; }` | `record Point` | `class Point` + `shared_ptr<Point>` |
| `const Point&` | a read-only object param | `const shared_ptr<Point>&` |
| `shared_ptr` alias | `def alias:Counter left` | `shared_ptr<Counter> alias = left` |
| `weak_ptr` | `@(weak optional)` | `r_weak<T>` + `enable_shared_from_this` |
| `std::optional<T>` | `@(optional)` | `r_optional_primitive<T>` |
| `std::variant` / `std::expected` | `shape` | `std::variant<…>` (payload classes as `shared_ptr`) |
| `enum class Color` | `Enum Color` | `int` |
| `std::function<int(int)>` | `f:(fn:int (p:int))` | exactly that + `[&](int p) mutable` |
| `std::span<const int>` | `[int]` read-only | `const std::vector<int>&` |

Do not rely on `error_msg` after `catch` — the writer emits `catch(...)`.
If an optional `int` is returned from a method, mention `str2int`
somewhere in the same compilation or the helper type is missing.

---

## The studies

### 01 — ownership

```cpp
int PointOps::manhattan(const std::shared_ptr<Point>& p);
void TreeNode::adopt(std::shared_ptr<TreeNode> c) {
    c->parent = this->shared_from_this();
    kids.push_back(c);
}
```

`alias = left` shares. `parent` is `r_weak<TreeNode>`. This is the one
study where the C++ is *trying* to be C++. A human would still make
`Point` a value.

### 02 — optionals and Result

`str2int` → `cpp_str_to_int` returning `r_optional_primitive<int>`.
`ParseOutcome` is `std::variant<ParseOutcome_Ok, shared_ptr<ParseOutcome_Err>>`.
`describe` uses `std::holds_alternative` / `std::get`. Not
`std::expected<int, std::string>`.

An optional `string` is not `r_optional_*` at all: it is a plain
`std::string`, and `null?` on one is an emptiness test. That is fine until a
program stores `""` in an optional, which then reads back as absent — see
item 10 below.

### 03 — enums and match

`Color` is `int`. `Message` is a `variant` of case types. Scalar cases
can sit in the variant by value; a `string` payload is `shared_ptr`.

### 04 — traits

Mixin. No abstract base, no concepts. `show` takes
`const shared_ptr<User>&` (or similar) — not a `User` concept.

### 05 — iteration

`const std::vector<int>& xs`, indexed `for`. `applyEach` takes
`std::function<int(int)>`. The lambda is `[&](int p) mutable { return p + 1; }`.
No `<numeric>`, no `std::ranges`.

### 06 — generics

`Stack_int` / `Stack_string`. `peek` needs `r_optional_primitive<int>`.
The writer used to define that class only when `str2int` (or a sibling)
appeared, so the shared source carried a `_optionalInt` helper nothing
called. **Fixed**: the definition is emitted where the type is, and the
helper is gone. Monomorphization, not `template<class T>`.

### 07 — strings and vectors

`greet(const std::string& name)`, `total(const std::vector<int>&)`. Not
`string_view` / `span`. UTF-8 helpers exist in the preamble of larger
programs; this file still pays for a map it does not use.

### 08 — builder

Copying builder returns `shared_ptr<Request>`. `return this` on
`MutRequest` returns another `shared_ptr` to the same object (reference
count), which is the C++ fluent style on a shared object — not a
value-returning builder.

### 09 — errors

The shape path runs. The throw attempt compiles and catches, but:

```cpp
throw std::string("negative");
} catch(...) {
    caught = "unspecified error";
}
```

That gave `after_bad unspecified error` — the exception was swallowed as a
type the catch did not name. **Fixed**: `throw` is `std::runtime_error(msg)`
and the handler re-throws to classify, so `after_bad negative`, the same line
every other target prints.

## What I could not write

`unique_ptr`, `optional`/`expected` as the language types, `enum class`,
`string_view`/`span`, move-only APIs, concepts, coroutines, `noexcept`,
header/source splits, namespaces I control.

## How the language could improve (for C++)

1. Value `record`s as ordinary structs, not `shared_ptr`.
2. ~~Always emit `r_optional_primitive` when an optional scalar exists.~~
   **Done** — the writer emits the definition where it emits the type.
   Using `std::optional` instead is item 4.
3. ~~`catch (const std::string& e)` so `error_msg` works.~~ **Done.** `throw`
   emits `std::runtime_error(msg)`, and the catch stays a catch-**all** —
   a Ranger `try` has to survive whatever crosses it, including a throw from
   a polyfill. Asking what it was is the rethrow idiom: re-throw inside the
   handler and catch it again by type. `error_msg` is the real text now,
   byte-identical to JavaScript.
4. `std::optional` / `std::variant` instead of the `r_*` twins.
5. `enum class` for Ranger `Enum`.
6. `string_view` / `span` for borrowed `string` / `[T]`.
7. Field-free `trait` → an abstract base or a concept.
8. ~~Drop the ordered-map preamble when the program has no map.~~ **Done.**
   Study 07 went from 237 lines to 88; across the ten studies the C++ output
   is about 45% shorter. The preamble still goes in when a map is reachable —
   the selfhost build of the compiler gets all of it.
9. `int64_t` for Ranger `int`, consistently.
10. **A `trait` used as a TYPE.** `fn show(n:Named)` emits
    `std::shared_ptr<Named>` and never declares `Named`, so the file does not
    compile — for a behaviour-only trait and a field-bearing one alike. Rust
    refuses the field-bearing case and emits a real `trait` for the
    behaviour-only one; here both are silent broken output. See
    `gallery/friendly/rust/src/11_behaviour_traits.rgr`, which is Rust-local
    for exactly this reason.
11. **An optional `string` that can tell `""` from absent.** It is a plain
    `std::string` at every position — field, local and parameter — and
    `null?` is an emptiness test, so a program that stores an empty string
    in an optional reads it back as absent. Every other target says
    `PRESENT[]`; C++ says `ABSENT`. This is the one place in these ten
    studies where the same Ranger prints a different answer here, and no
    study catches it: study 10 passes a non-empty string. `std::optional`
    (item 4) closes it.
