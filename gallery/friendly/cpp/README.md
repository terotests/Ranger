# C++ — can Ranger write idiomatic C++?

The same eleven programs as [`../src/`](../src/) compiled with `-l=cpp`,
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
answers** for every study, and — since study 11 — the *same* answers as the
other ten targets.

**I could not write idiomatic C++.** A `record Point` is still
`shared_ptr<Point>`, not a value struct. Read-only object parameters are
`const std::shared_ptr<Point>&`, which is the ownership pass doing its
job and still not `const Point&`. `@(optional)` is
`r_optional_primitive<T>` / `r_optional_union<T>`, not `std::optional`.
A `shape` is `std::variant<Ok, shared_ptr<Err>>` — close, then the string
case is a cell. A Ranger `Enum` **is** an `enum class` now, when every use in
the program is one an `enum class` can carry. `@(weak optional)` is `r_weak<T>`
over `std::weak_ptr`,
and `TreeNode` inherits `enable_shared_from_this`. That part *is* the
C++ idiom for a cycle. `int` is 32-bit `int`, not `int64_t` (buffers are the
exception).

## How to write Ranger today if the C++ output matters

| Wanted C++ | Write this Ranger | What comes out |
| --- | --- | --- |
| `struct Point { int x, y; }` | `record Point` | `class Point` + `shared_ptr<Point>` |
| `const Point&` | a read-only object param | `const shared_ptr<Point>&` |
| `shared_ptr` alias | `def alias:Counter left` | `shared_ptr<Counter> alias = left` |
| `weak_ptr` | `@(weak optional)` | `r_weak<T>` + `enable_shared_from_this` |
| `std::optional<T>` | `@(optional)` | `r_optional_primitive<T>` |
| `std::variant` / `std::expected` | `shape` | `std::variant<…>` (payload classes as `shared_ptr`) |
| `enum class Color` | `Enum Color` | `enum class Color : int`, or `int` when a use does not fit |
| `std::function<int(int)>` | `f:(fn:int (p:int))` | exactly that + `[&](int p) mutable` |
| `std::span<const int>` | `[int]` read-only | `const std::vector<int>&` |

`error_msg` after `catch` carries the real text (item 3 below), and an
optional scalar no longer needs a `str2int` somewhere in the file to bring
its helper type along (item 2).

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

An optional `string` used to be the odd one out — a plain `std::string`, with
`null?` an emptiness test, so a program that stored `""` read it back as
absent. **Fixed**: it is an `r_optional_primitive<std::string>` like every
other optional scalar, and study 11 is the study that asks.

### 03 — enums and match

`Color` is `enum class Color : int { Red = 0, Green = 1, Blue = 2, }`, and
`colorName` takes a `Color`. `Message` is a `variant` of case types. Scalar
cases can sit in the variant by value; a `string` payload is `shared_ptr`.

The decision is per enum and conservative: declared, compared, assigned,
switched on and returned is safe, and anything else — arithmetic, an array
index, a map key, `@serialize` — keeps the old `int` lowering, because an
`enum class` converts to neither direction on its own. `-strict-ownership`
prints the verdict and, on a fallback, the use that caused it. Seven of this
compiler's own enums come out native in its own C++ rendering.

### 04 — traits

Mixin, for a trait that carries fields: the methods are copied into each
consumer and the trait itself is not a type. That is the right lowering here,
because C++ has no way to give a base class's fields to classes that already
own their own copies. A trait that declares only BEHAVIOUR is a different
question — see study 11 below.

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

### 11 — absent is not empty

The study that exists because C++ was the one target that got this wrong.

```cpp
std::string AbsentMain::report( const std::string& label,
                                r_optional_primitive<std::string> s ) {
  if ( s.has_value == false ) { return label + std::string(": absent"); }
  return ((label + std::string(": present [")) + s.value) + std::string("]");
}
```

Seven targets run it here and all seven print the same seven lines.

### 11 — a behaviour-only trait as a type

```cpp
class Named { 
  public :
    virtual ~Named() {}
    virtual std::string label() = 0;
};
class User : public Named  { ... };
std::string TraitsMain::show( std::shared_ptr<Named> n ) { return n->label(); }
```

`Sized2` in the same file stays a mixin, because nothing names it as a type:
a vtable in every class that consumes any behaviour-only trait is a layout
change for programs that never asked for one.

A trait carrying FIELDS is the other half, and it is refused rather than
lowered — see `attempts/04_trait_as_type.rgr`. C++ has nothing to put the
field in: each consumer already owns its own copy, so a base holding it would
be a second, different field.

## What I could not write

`unique_ptr`, `optional`/`expected` as the *language* types, `string_view`/
`span`, move-only APIs, concepts, coroutines, `noexcept`, header/source
splits, namespaces I control.

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
5. ~~`enum class` for Ranger `Enum`.~~ **Done** — per enum, with the `int`
   lowering kept for the uses an `enum class` cannot carry. The rules are
   the same ones the Rust writer applies to its own `enum`, and they live in
   `compiler/EnumAnalysis.rgr` so there is one answer, not two.
6. `string_view` / `span` for borrowed `string` / `[T]`.
7. ~~Field-free `trait` → an abstract base or a concept.~~ **Done** for the
   abstract base. A behaviour-only trait *named as a type* becomes
   `class Named { public: virtual ~Named() {} virtual std::string label() = 0; };`
   and its consumers derive from it publicly. Concepts are still open, and so
   is the field-bearing case, which stays a mixin.
8. ~~Drop the ordered-map preamble when the program has no map.~~ **Done.**
   Study 07 went from 237 lines to 88; across the ten studies the C++ output
   is about 45% shorter. The preamble still goes in when a map is reachable —
   the selfhost build of the compiler gets all of it.
9. `int64_t` for Ranger `int`, consistently.
10. ~~**A `trait` used as a TYPE.**~~ **Done**, both halves.
    `fn show(n:Named)` used to emit `std::shared_ptr<Named>` and never declare
    `Named`, so the file did not compile while Ranger reported success. A
    behaviour-only trait is an abstract base now (item 7) and
    `src/11_behaviour_traits.rgr` is the study; a field-bearing one is
    **refused**, with the error naming the way that does work, and
    `attempts/04_trait_as_type.rgr` is the gate. Rust refuses the same program
    for the same reason. Go, Java, Kotlin, C#, Dart and Swift all still have
    the whole hole, in its silent form.
11. ~~**An optional `string` that can tell `""` from absent.**~~ **Done.**
    It was a plain `std::string` at every position — field, local and
    parameter — with `null?` an emptiness test, so a program that stored an
    empty string in an optional read it back as absent: every other target
    said `PRESENT[]` and C++ said `ABSENT`. It is an
    `r_optional_primitive<std::string>` now, the same shape an optional int
    has had all along. Four readers came with it, because none of them could
    say "absent" either: a `[K:string]` map hands back the wrapper rather than
    `""` on a miss, `read_file` distinguishes a missing file from an empty one,
    `env_var` distinguishes an unset name from one set to `""`, and JSON
    `getStr` answers absent for a key that is not there. Every one of those
    already read that way on Python and JavaScript. `std::optional` in place
    of the `r_*` twins is still item 4.
