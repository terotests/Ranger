# PLAN_CODEGEN_OWNERSHIP — better C++ and Swift output

Status: investigation, measured on this tree. No compiler change is in this
branch. Every number below has the command that produces it.

Question: can an annotation improve the C++ and the Swift output, given that
the compiler already counts references and already reads the flow of the code?

**Answer: mostly not.** Four of the five findings need no annotation, because
the compiler already computes the fact and then throws it away, or because the
program already states the fact with a keyword that the writers ignore. One
finding needs an annotation, and that annotation exists already (`weak`); two
writers do not read it.

---

## What the compiler already does

Two passes read the flow of the program.

**The mutation pass (C++).** A local that takes a member field and then changes
it in place becomes `T&` in the place of `T`. This works, it is automatic, and
[TARGET_NOTES.md](TARGET_NOTES.md) documents it.

**The ownership inference (all targets, `-strict-ownership`).** Each parameter
gets an OwnershipKind: `borrowed`, `moved`, `owned`, `shared` or `unknown`.
`compiler/ng_StaticAnalysis.rgr` states the limit in its own comment:

> Phase A only records + reports; it does not change code generation.

So the compiler knows more about the program than the output shows. The
findings below are the difference.

---

## Finding 1 — a borrowed parameter is passed by value (C++)

The inference says `borrowed`; the writer emits `std::shared_ptr<T>` by value.
Each call therefore pays an atomic increment and an atomic decrement of the
reference count, for an argument that the function only reads.

```sh
RANGER_LIB="./compiler/Lang.rgr;./lib/stdops.rgr" \
node bin/output.js -es6 -strict-ownership \
  ./gallery/pdf_writer/src/tools/jpeg_scaler.rgr -nodecli -d=./tmp -o=x.js
```

| Measurement, `jpeg_scaler.rgr` | Count |
| --- | --- |
| Functions analysed | 110 |
| Parameters inferred `borrowed` | 255 |
| Parameters inferred anything else | 1 (`unknown`) |
| `std::shared_ptr<T>` parameters by value in the C++ output | 64 |
| `const std::shared_ptr<T>&` parameters | 0 |
| `const std::string&` / `const std::vector<T>&` parameters | 102 |

The last row matters: the writer **already** passes a value type by const
reference. Only the object parameter misses it.

The smallest reproduction, from the fixture that the ownership test uses:

```text
ownership[infer] fn sumValue:
  param 'a' -> borrowed
  param 'b' -> borrowed
```

```cpp
int  TokenBag::sumValue( std::shared_ptr<Node> a , std::shared_ptr<Node> b ) {
```

**Change:** a parameter that the inference calls `borrowed` becomes
`const std::shared_ptr<T>&`. A parameter that it calls `moved`, `owned` or
`shared` stays by value, because the callee keeps it. A parameter that it calls
`unknown` stays by value, which is the state today.

This is Phase B of a design that is already staged. It needs no annotation.

---

## Finding 2 — every class inherits `enable_shared_from_this`, and no class uses it

```sh
node bin/output.js -l=cpp ./gallery/pdf_writer/src/tools/jpeg_scaler.rgr -d=./tmp -o=x.cpp
grep -c "enable_shared_from_this" tmp/x.cpp   # 22
grep -c "shared_from_this()"      tmp/x.cpp   # 0
```

| File | Classes with the base | Calls to `shared_from_this()` |
| --- | --- | --- |
| `jpeg_scaler.rgr` | 22 | 0 |
| `gallery/js_parser/js_ast.rgr` | 41 | 0 |

The base adds a `std::weak_ptr` to every object of every class: two pointers
per instance, for a feature that neither program uses.

**Change:** emit the base only for a class whose output holds a
`shared_from_this()` call. The writer knows, because the writer emits that
call.

---

## Finding 3 — `record` is not a value type in C++ or in Swift

The language has a keyword for a class that holds data only. The writers treat
it as an ordinary class.

```ranger
record Point {
    def x:int 0
    def y:int 0
}
```

| Target | Emission today | A value type would be |
| --- | --- | --- |
| C++ | `class Point : public std::enable_shared_from_this<Point>`, used through `std::shared_ptr<Point>`, built with `std::make_shared` | a plain `struct`, on the stack, copied |
| Swift | `class Point : Hashable`, a heap object with ARC | `struct Point` |
| Rust | `struct Point` | correct already |

Two integers therefore cost a heap allocation, a control block and a reference
count on two of the three targets that need the care.

**Change:** emit `struct` for a `record` in Swift, and a value `struct` in C++.
The keyword is already in the program, so this needs no annotation either. The
risk is higher than for findings 1 and 2: a value type changes assignment from
sharing to copying, so the change needs the conformance suite behind it.

---

## Finding 4 — a Swift class is never `final`

```sh
node bin/output.js -l=swift6 ./gallery/pdf_writer/src/tools/jpeg_scaler.rgr -d=./tmp -o=x.swift
grep -c "^class "     tmp/x.swift   # 22
grep -c "^final class" tmp/x.swift  # 0
```

No class in that program extends another class, so all 22 could be `final`.
Swift devirtualizes a call on a final class, and cannot devirtualize a call on
an open one.

**Change:** emit `final class` for a class that no class in the compilation
extends. The compiler holds the class list, so the test is a lookup. No
annotation.

---

## Finding 5 — `weak` reaches Rust and stops at C++ and Swift

This is the one finding where an annotation is the mechanism, and the
annotation exists.

| Target | `def parent@(weak):Node` becomes | Handling in the writer |
| --- | --- | --- |
| Rust | `Option<Weak<RefCell<Node>>>`, assigned with `Rc::downgrade(…)` | `ng_RangerRustClassWriter.rgr`, 33 places |
| C++ | `std::shared_ptr<Node>`, the same as a strong field | `ng_RangerCppClassWriter.rgr`, no mention of the flag |
| Swift | `var parent : Node?`, no `weak` keyword | `ng_RangerSwift6ClassWriter.rgr`, no handling |

A parent and a child that hold each other therefore stay in memory on C++ and
on Swift, and the program has no way to say otherwise.

**Change:** `std::weak_ptr<T>` for a `weak` field in C++, with a `.lock()` at
the read; `weak var` in Swift. The Rust writer is the model.

`strong`, `lives` and `temp` change no output on any target. Compiled the same
program with and without each of them for C++, Rust and Swift: the output is
identical. `lives` and `temp` are read by the lifetime bookkeeping in
`ng_RangerAppParamDesc.rgr` and by no writer.

---

## What an annotation would add that the analysis cannot

The inference decided 255 of 256 parameters in a 110-function program. It
called one `unknown`. An annotation is worth its cost in three places only:

1. **`weak`** — a back reference is a decision about semantics, not a fact that
   a flow analysis can find. Finding 5.
2. **`unknown`** — a parameter that the pass cannot decide. An annotation would
   let the program state the answer in the place of taking the slow path. One
   parameter in the program measured above, so the value is small today. It
   grows if Phase B lands and `unknown` starts to cost performance.
3. **A promise across a compilation unit** — the pass reads the body it has. A
   parameter of a function that a plugin or a target-specific block writes has
   no body to read.

Everything else in this document is a fact that the compiler already holds.

---

## Order of work

| # | Change | Value | Risk | Needs an annotation |
| --- | --- | --- | --- | --- |
| 1 | `const&` for a borrowed object parameter (C++) | High: 64 parameters in one file, every call | Low. The inference already separates borrowed from moved, and a wrong answer is a compile error, not silent | No |
| 2 | `enable_shared_from_this` only where used (C++) | Medium: two pointers per object | Low | No |
| 3 | `final class` (Swift) | Medium: devirtualization | Low | No |
| 4 | `weak` in C++ and Swift | Correctness, not speed: it removes a leak | Medium: a `.lock()` at each read | The annotation exists |
| 5 | `record` as a value type (C++, Swift) | High for a program with many small records | High: assignment changes meaning | No |

Steps 1 to 3 are the ones to take first: each is local to one writer, each has
a measurement above to check against, and none changes the meaning of a
program.

## How to check a change

```sh
npm run compile                       # build the compiler
npm test                              # the full suite
node bin/output.js -l=cpp <file> -d=./tmp -o=x.cpp
```

The conformance suite in `tests/conformance/` runs the same program on several
targets and compares the output, so it is the gate for findings 4 and 5. For
findings 1 to 3 the C++ and the Swift galleries must still compile and run:
`gallery/pdf_writer/src/tools/jpeg_scaler.rgr` and `gallery/js_parser`.
