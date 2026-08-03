# PLAN_CODEGEN_OWNERSHIP — better C++ and Swift output

Question: can an annotation improve the C++ and the Swift output, given that
the compiler already counts references and already reads the flow of the code?

**Answer: mostly not.** Four of the five findings need no annotation, because
the compiler already computes the fact and then throws it away, or because the
program already states the fact with a keyword that the writers ignore. One
finding needs an annotation, and that annotation exists already (`weak`); two
writers do not read it.

## Status

| # | Change | State |
| --- | --- | --- |
| 1 | `const std::shared_ptr<T>&` for a borrowed object parameter (C++) | Done |
| 2 | `enable_shared_from_this` only where the output uses it (C++) | Done |
| 3 | `final class` (Swift) | Done |
| 4a | `weak var` (Swift) | Done, for a field that is also `optional` |
| 4b | `std::weak_ptr` (C++) | Done, through the `r_weak<T>` wrapper |
| 4c | `weak` (Rust) | Works behind `-rust-shared-classes`: the sharing analysis makes the classes of the cycle `Rc<RefCell<T>>`, the back reference downgrades the live Rc, and the parent–child program compiles, runs and reads back through the weak field. See PLAN_RUST_OWNERSHIP. |
| 5 | `record` as a value type (C++, Swift) | Not done, and see below: the measurement found a different fault in `record`, which is fixed |

The sections below hold the measurement of each finding as it stood before the
change, and the "Result" line states what the same measurement gives now.

---

## What the compiler already does

Two passes read the flow of the program.

**The mutation pass (C++).** A local that takes a member field and then changes
it in place becomes `T&` in the place of `T`. This works, it is automatic, and
[TARGET_NOTES.md](TARGET_NOTES.md) documents it.

**The ownership inference (all targets, `-strict-ownership`).** Each parameter
gets an OwnershipKind: `borrowed`, `moved`, `owned`, `shared` or `unknown`.
`compiler/ng_StaticAnalysis.rgr` stated the limit in its own comment:

> Phase A only records + reports; it does not change code generation.

So the compiler knew more about the program than the output showed. The
findings below are the difference. Finding 1 closes it for C++: the pass now
runs for every C++ compilation, with or without the flag, and the C++ writer
reads the result. Every other writer still ignores it.

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

**Result.** `cppBorrowedObjectParam` in `ng_RangerCppClassWriter.rgr`, with the
pass wired into `VirtualCompiler.rgr` for the C++ target. Two guards keep the
change safe: a parameter that the program assigns to stays a copy, and every
parameter of a class that takes part in inheritance stays a copy, because a
base and an override must keep the same signature and the inference runs per
function. The pass also covers static methods now; it did not before.

| Measurement, `jpeg_scaler.rgr` | Before | Now |
| --- | --- | --- |
| `std::shared_ptr<T>` object parameters by value | 64 | 0 |
| `const std::shared_ptr<T>&` object parameters | 0 | 64 |

Built with `g++ -std=c++17` and run five times over
`gallery/pdf_writer/assets/images/Example.jpg` at `-width 600`: 4.4 s before,
3.9 s after. Both binaries write the same output file, byte for byte
(`md5sum`).

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

**Result.** `cppNeedsSharedFromThis` in `ng_RangerCppClassWriter.rgr`. It
reports true for a class whose body uses `this` as a value, and for a class
that another class extends, because a subclass calls `shared_from_this()`
through the base.

| File | Classes with the base, before | Now | Calls |
| --- | --- | --- | --- |
| `jpeg_scaler.rgr` | 22 | 0 | 0 |
| `gallery/js_parser/js_ast.rgr` | 41 | 0 | 0 |

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

**Not done, and the reason is stronger than the risk.** A `record` is a
reference on the nine targets that collect memory, because an object of
JavaScript, of Java or of Python is a reference. Making it a value on C++ and
on Swift would make the same program behave in two ways: `a = b` would share on
one target and copy on another. That is a decision about the language, not
about a writer, and it belongs to the whole toolchain or to none of it.

**What the measurement found instead: the record constructor was broken on
eleven of the twelve targets.** See the section below.

---

## Finding 3b — the record constructor did not compile

The compiler builds the constructor of a `record` from its fields
(`buildRecordConstructor` in `ng_RangerFlowParser.rgr`). The signature it builds
holds two parameters per field: a marker that carries the name of the keyword
and no type, and the parameter that carries the value.

```text
Constructor (xpos@(keyword) xpos:int ypos@(keyword) ypos:int)
```

Only the JavaScript writer dropped the marker. Every other writer put it in the
signature, and the result did not compile:

| Target | Before | Now |
| --- | --- | --- |
| C++ | `Point::Point( xpos , int xpos , ypos , int ypos )` | `Point::Point( int xpos , int ypos )` |
| Rust | `pub fn new(xpos : , xpos : i64, ypos : , ypos : i64)` | `pub fn new(xpos : i64, ypos : i64)` |
| Swift | `init(xpos : , xpos : Int, ypos : , ypos : Int )` | `init(xpos : Int, ypos : Int )` |
| Go | `func CreateNew_Point(xpos (), xpos int64, …)` against a call of two arguments | `func CreateNew_Point(xpos int64, ypos int64)` |
| Scala | `class Point (xpos : , xpos : Int, …)` | `class Point (xpos : Int, ypos : Int)` |
| Java | `Point( final  xpos , final Integer xpos , … )` | `Point( final Integer xpos , final Integer ypos )` |
| Kotlin | `class Point( xpos : , xpos : Int, … )`, call `Point(xpos, 3, ypos, 4)` | `class Point( xpos : Int, ypos : Int )`, call `Point(3, 4)` |
| C# | `Point(  xpos , int xpos , … )` | `Point( int xpos , int ypos )` |
| Python | `def __init__(self, xpos, xpos, ypos, ypos)` | `def __init__(self, xpos, ypos)` |
| PHP | call `new Point($xpos, 3, $ypos, 4)` with `$xpos` undefined | `new Point(3, 4)` |
| JavaScript / TypeScript | `constructor(xpos, ypos)` | unchanged, it was already right |

The fix is the filter that the JavaScript writer already held, in the parameter
writer and in the constructor-call writer of each target.

`tests/fixtures/record_basic.rgr` now builds and prints `3` `4` `Done` on C++
(`g++`), Rust (`rustc`), Go (`go run`), Python, PHP and Node — the six
toolchains this machine holds.

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

**Result.** `ng_RangerSwift6ClassWriter.rgr` reads `is_inherited`, which the
flow parser sets for every class that another class names after `extends`.
`jpeg_scaler.rgr` gives 22 `final class` of 22, `js_ast.rgr` 41 of 41.

---

## Finding 5 — `weak` reaches Rust and stops at C++ and Swift

This is the one finding where an annotation is the mechanism, and the
annotation exists.

| Target | `def parent@(weak):Node` becomes | Handling in the writer |
| --- | --- | --- |
| Rust | `Option<Weak<RefCell<Node>>>`, assigned with `Rc::downgrade(…)` — and the output does not compile, see the correction below | `ng_RangerRustClassWriter.rgr`, 33 places |
| C++ | `std::shared_ptr<Node>`, the same as a strong field | `ng_RangerCppClassWriter.rgr`, no mention of the flag |
| Swift | `var parent : Node?`, no `weak` keyword | `ng_RangerSwift6ClassWriter.rgr`, no handling |

A parent and a child that hold each other therefore stay in memory on C++ and
on Swift, and the program has no way to say otherwise.

**Change:** `std::weak_ptr<T>` for a `weak` field in C++, with a `.lock()` at
the read; `weak var` in Swift. The Rust writer is the model.

**Correction: `weak` does not work on Rust either.** The first version of this
document read the Rust writer and counted 33 handling sites. Counting the sites
was not a test. Compiled the parent-and-child program for Rust and gave the
output to `rustc`:

```rust
c.parent = Some(Rc::downgrade(&Rc::new(RefCell::new(p.clone()))));
…
let mut p : Parent = self.parent.clone().unwrap().upgrade().unwrap().borrow_mut();
```

`rustc` rejects the second line: `RefMut<Parent>` where `Parent` is expected.
The first line holds a second fault that `rustc` does not report: the `Rc` is a
temporary, so the `Weak` is dead at the end of the statement and `upgrade()`
would give `None`.

The cause is under the annotation. The Rust writer gives a class a plain
`struct`, so no `Rc` holds the parent for `Rc::downgrade` to take. `weak` on
Rust needs the Rust object model first, and that is a larger piece of work than
the C++ and the Swift changes above.

**Result, Swift: done.** `writeVarDef` in `ng_RangerSwift6ClassWriter.rgr`
emits `weak var x : T?` for a field that states `weak` and `optional` and whose
type is a class of the compilation. Swift needs both parts, because a weak
reference must be a `var` and must be optional. `@(weak)` without `optional`
keeps the strong form rather than emitting Swift that does not compile.

```ranger
def parent@(weak optional):Node
```

```swift
final class Node : Hashable  {
  var name : String = ""
  weak var parent : Node?
}
```

**Result, C++: done.** Swift needs the keyword only; C++ needs `.lock()` at
every read of the field, which would touch every place the writer emits a field
access. The smaller form of the change is a `r_weak<T>` wrapper above the
classes of the file: it holds a `std::weak_ptr<T>` and gives `operator->`, an
assignment from `std::shared_ptr<T>`, a conversion back to it and a test
against `NULL`. Every read site stays as it was. The writer emits the wrapper
only into a file that holds a `weak` field
(`cppIsWeakField` / `cppProgramHasWeakField` / `writeCppWeakHelper`).

```cpp
class Child {
  public :
    std::string name;
    r_weak<Parent> parent;
};

std::string  Child::parentName() {
  if ( parent == NULL ) {
    return std::string("orphan");
  }
  std::shared_ptr<Parent> p = parent;
  return p->name;
}
```

The measurement is a leak check, not a timing. A parent that holds its children
and a child that points back, built with `g++ -std=c++17 -fsanitize=address`:

| Back reference | AddressSanitizer at exit |
| --- | --- |
| `def parent@(optional):Parent` | `168 byte(s) leaked in 3 allocation(s)` |
| `def parent@(weak optional):Parent` | no leak |

`strong`, `lives` and `temp` change no output on any target. Compiled the same
program with and without each of them for C++, Rust and Swift: the output is
identical. `lives` and `temp` are read by the lifetime bookkeeping in
`ng_RangerAppParamDesc.rgr` and by no writer.

---

## What an annotation would add that the analysis cannot

The inference decided 255 of 256 parameters in a 110-function program. It
called one `unknown`. An annotation is worth its cost in three places only:

1. **`weak`** — a back reference is a decision about semantics, not a fact that
   a flow analysis can find. Finding 5. The three targets that need it now read
   it.
2. **`unknown`** — a parameter that the pass cannot decide. An annotation would
   let the program state the answer in the place of taking the slow path. One
   parameter in the program measured above, so the value is small. It is a real
   cost now that the C++ writer reads the summary: an `unknown` parameter keeps
   the copy of the pointer that a `borrowed` one drops.
3. **A promise across a compilation unit** — the pass reads the body it has. A
   parameter of a function that a plugin or a target-specific block writes has
   no body to read.

Everything else in this document is a fact that the compiler already holds.

---

## Order of work

| # | Change | Value | Risk | Needs an annotation | State |
| --- | --- | --- | --- | --- | --- |
| 1 | `const&` for a borrowed object parameter (C++) | High: 64 parameters in one file, every call | Low. The inference already separates borrowed from moved, and a wrong answer is a compile error, not silent | No | Done |
| 2 | `enable_shared_from_this` only where used (C++) | Medium: two pointers per object | Low | No | Done |
| 3 | `final class` (Swift) | Medium: devirtualization | Low | No | Done |
| 4 | `weak` in C++ and Swift | Correctness, not speed: it removes a leak | Medium: a `.lock()` at each read | The annotation exists | Done |
| 4c | `weak` in Rust | Correctness | High: it needs the Rust object model | The annotation exists | Open |
| 5 | `record` as a value type (C++, Swift) | High for a program with many small records | High: assignment changes meaning, and differently per target | No | Not done, by decision |
| 3b | the record constructor (11 targets) | Correctness: the output did not compile | Low: the JavaScript writer held the answer already | No | Done |

Steps 1 to 3 were the ones to take first: each is local to one writer, each has
a measurement above to check against, and none changes the meaning of a
program. Step 4 followed, and it does change the meaning of a program — but
only of a program that asks for the change with the annotation.

Step 5 stays open, and the reason is not the risk. A value type would make the
same program share on nine targets and copy on two. That is a change to the
language, and it needs a decision about the language, not a change to two
writers. Measuring it did find a fault worth the work: the constructor of a
`record` did not compile on eleven of the twelve targets (finding 3b).

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

The end-to-end check that findings 1 and 2 were measured against:

```sh
node bin/output.js -l=cpp ./gallery/pdf_writer/src/tools/jpeg_scaler.rgr \
  -d=./tmp -o=x.cpp
cd tmp && g++ -std=c++17 -I. x.cpp -o jpeg
./jpeg -width 600 ../gallery/pdf_writer/assets/images/Example.jpg out.jpg
md5sum out.jpg      # must match the file the previous compiler produced
```

---

## Found while the documentation was written

These are not part of the ownership question. The measurement of the docs found
them, and they are recorded here so they are not lost.

### The Rust object model does not share

A class becomes a plain `struct` in the Rust output, and the writer adds
`.clone()` where the value would move. So an object is a reference on eleven
targets and a value on Rust:

```lisp
def a:Counter (new Counter())
def b:Counter a
b.add(1)
print ("a " + (to_string a.value))
```

Prints `a 1` on JavaScript, Go, Python, C++ and Swift.
`rustc` rejects the Rust output: "borrow of moved value: `a`".

This is the same cause as finding 4c: with no `Rc` there is nothing to
downgrade, and with no `Rc` two names cannot hold one object. Both need the
same decision about how a Rust class is held.

### A default template can hold JavaScript

The `*` template of an operator is the default for a target that holds no
template of its own, and it is also the JavaScript template of many operators.
A target that falls back to such a template receives JavaScript, and the
compilation reports success:

```sh
node bin/output.js -l=python ceil.rgr -d=./tmp -o=x.py   # [OK]
grep ceil tmp/x.py                                       # c = Math.ceil(d)
```

`docs/tools/lib/model.mjs` now scans for this, and the coverage page lists the
operators per target. The scan found Python 13, Swift 9, Kotlin 7, Rust 3 and
one or two on the rest. `int2double` reached ten of the twelve targets as
`parseFloat(…)`.

**Fixed.** 14 operators gained a template for the targets that were falling
back: `int2double` (eight targets), `empty` (five), `ceil`, `floor`, `sqrt`,
`sin`, `cos`, `asin`, `acos`, `atan2`, `to_int`, `str2int`, `str2double`, and
the three optional forms of `&&`. The scan now reports nothing.

| Target | Templates added |
| --- | --- |
| Python | 13 |
| Swift 6 | 11 |
| Kotlin | 7 |
| Rust | 3 |
| C#, PHP | 2 each |
| Go, Java, C++, Scala, Swift 3 | 1 each |

The count is the change, not the total. The totals per target are on the
coverage page, and they move with each release.

`str2double` and `str2int` need a helper on Python, and the helper goes to the
`after_imports` slot, not to the default `utilities` slot: Python calls `main()`
from the bottom of the file, so a `def` below that call is not yet bound.

The result is visible in the gallery. `jpeg_scaler.rgr` compiled to Rust held
three errors, all `Rust has no ternary operator`, from the `str2double`
fallback. It now builds with `rustc` and no error. The binary runs, and it
writes a wrong image — that is the Rust object model above, not the templates.

One gap stays open under this one: the C# writer emits `double` for an optional
double, not `double?`. `str2double` therefore uses `Double.Parse`, which throws
in the place of giving an empty value. `str2int` already did this with
`Int32.Parse`. The pair is consistent and neither is optional-correct.

A probe of the 13 numeric and string operators gives the same values on
JavaScript, Python, PHP, C++, Rust and Go — the six toolchains this machine
holds.
