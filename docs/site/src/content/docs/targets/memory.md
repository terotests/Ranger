---
title: Memory and ownership
description: How the compiler analyses object lifetime, what the analysis changes in the output, and what the memory annotations do for each target.
---

Nine of the twelve target languages collect the memory that a program stops
using. Three do not: C++ and Swift count references, and Rust owns and moves.
For those three the compiler must decide where each object lives and who keeps
it alive.

[Ownership and lifetime](/Ranger/docs/language/ownership/) states the model of
the language. This page states what the compiler writes for it, per target.
Each statement here comes from the compiler sources and from the code that the
compiler writes.

## Two analyses

The compiler has two passes that read the flow of the program.

### 1. The mutation pass, for C++

The pass finds a local variable that takes its value from a member field. When
a later statement changes that local in place, the pass writes a reference in
the place of a copy:

```lisp
fn writeByte:void (b:int) {
    def buf:buffer currentChunk.data
    buffer_set buf 0 b
}
```

```cpp
std::vector<uint8_t>& buf = currentChunk->data;   // a reference
buf[0] = static_cast<uint8_t>(b);                 // changes the field
```

Without the pass the local is a copy, and the change is lost. The pass runs for
every C++ compilation, and the program needs no annotation. The operators that
count as a change in place are the buffer operators, `push`, `set`, `clear`,
`remove`, `removeIndex` and `put`.

### 2. The ownership inference

The second pass reads where each parameter goes — through every store form,
and through the calls it passes into, against the summaries of the callees —
and gives it one of four states: `borrowed`, `moved`, `shared` or `unknown`.
[Ownership and lifetime](/Ranger/docs/language/ownership/) states what each one
means and how to read the summary.

The pass runs always for a C++ and for a Rust compilation, because both
writers read the result. For any other target the flag `-strict-ownership`
runs it. The flag also prints the result, on every target:

```sh
rgrc program.rgr -l=cpp -strict-ownership
```

```text
ownership[infer] fn attach:
  param 'parent' -> borrowed
  param 'child' -> moved (parent.left)
```

The numbers are large. The compilation of
`gallery/pdf_writer/src/tools/jpeg_scaler.rgr` analyses 110 functions and
decides all 256 parameters: 254 `borrowed`, and 2 buffers that the decoder
stores into a member.

The pass ends with a class-level verdict: a class some object of which is
ever aliased and held — stored into an object graph, aliased and then
mutated through a name, or the target of a `weak` field — needs reference
semantics on a target whose objects are values. The flag prints this too:

```text
ownership[rust] class Counter -> Rc<RefCell> (aliased and mutated in main)
ownership[rust] class Color -> value
```

On `jpeg_scaler.rgr`, 21 classes of 22 stay `value`.

## What the C++ writer does with the result

### A borrowed object parameter is a reference

An object parameter is a `std::shared_ptr<T>`. Passing it by value costs one
atomic increment on the call and one atomic decrement on the return. A
`borrowed` parameter does not escape the function. The caller therefore holds
the object for the whole call, and the callee needs no count of its own. Such a
parameter becomes `const std::shared_ptr<T>&`:

```cpp
// borrowed
std::vector<int64_t> JPEGDecoder::decodeBlock(
    const std::shared_ptr<BitReader>& reader ,
    const std::shared_ptr<JPEGComponent>& c ) {
```

`const` applies to the pointer and not to the object, so `reader->readBit()`
still compiles. A parameter that the program assigns to, or that the inference
calls `moved`, `shared` or `unknown`, stays a copy.

A reference binds the caller's storage, so the call site pays attention to
what the argument names. A local, a parameter, `this` or a fresh temporary
binds directly. An argument that names a member field or a collection element
is passed as a call-time copy, `std::shared_ptr<T>( … )`: the callee can
reach that storage through the object graph, and without the copy a
reassignment inside the call would swap the object under the reference, and a
grown collection would leave it dangling.

The check skips a method of a class that takes part in inheritance. A base and
an override must have the same signature. The inference runs per function, so a
base could say `borrowed` where the override says `moved`. That would turn an
override into an overload without a message.

| `jpeg_scaler.rgr`, C++ output | Before | Now |
| --- | --- | --- |
| `std::shared_ptr<T>` object parameters by value | 64 | 0 |
| `const std::shared_ptr<T>&` object parameters | 0 | 64 |
| `const std::string&` / `const std::vector<T>&` parameters | 102 | 102 |

The same program, built with `g++ -std=c++17` and run five times to scale a
photograph to 600 pixels of width, takes 4.4 seconds before the change and 3.9
seconds after it. The two builds write the same file, byte for byte.

### `enable_shared_from_this` only where the output needs it

A class gets `public std::enable_shared_from_this<T>` when the writer emits a
`shared_from_this()` call for it, which happens where the program uses `this`
as a value. A class that another class extends keeps the base as well, because
a subclass can call through it. Every other class does without.

The base is not free: it puts a `std::weak_ptr` into every object of the class,
so a program with many small objects pays two pointers each.

| File | Classes with the base, before | Now | Calls to `shared_from_this()` |
| --- | --- | --- | --- |
| `jpeg_scaler.rgr` | 22 | 0 | 0 |
| `gallery/js_parser/js_ast.rgr` | 41 | 0 | 0 |

### `weak` fields hold no count

A field that states `weak` becomes `r_weak<T>` in the place of
`std::shared_ptr<T>`. `r_weak<T>` is a small wrapper that the compiler writes
into the file above the classes. It holds a `std::weak_ptr<T>` and gives the
shared pointer back at the read. A field access, a null test and an assignment
therefore stay as they were:

```lisp
class Child {
    def name:string ""
    def parent@(weak optional):Parent
}
```

```cpp
class Child {
  public :
    std::string name;
    r_weak<Parent> parent;
};
```

```cpp
std::string Child::parentName() {
  if ( parent == NULL ) {
    return std::string("orphan");
  }
  std::shared_ptr<Parent> p = parent;   // the wrapper locks here
  return p->name;
}
```

The wrapper appears only in a file that holds a `weak` field.

A parent that holds its children and a child that points back at its parent is
the case this answers. With a strong back reference the pair keeps itself in
memory; `g++ -fsanitize=address` on the program above reports
`168 byte(s) leaked in 3 allocation(s)`. With `weak` on the back reference the
same program leaks nothing.

## What the Rust writer does with the result

### A proven-borrowed object parameter is `&T`

A Rust class is a plain `struct`, so a read-only object argument used to pay
a whole-struct `#[derive(Clone)]` copy at every call. A parameter the
inference proves `borrowed` — and the mutation pass confirms untouched —
now takes a reference, and the call site drops the clone:

```rust
// before                                    // now
fn sumValue(mut a : Node, mut b : Node)      fn sumValue(a : &Node, b : &Node)
bag.sumValue(root.clone(), child.clone());   bag.sumValue(&root, &child);
```

On `jpeg_scaler.rgr` the removed clones are the ones inside the pixel loops
— `setPixel(x, y, c.clone())` becomes `setPixel(x, y, &c)` — and the binary
writes the same file, byte for byte. A `moved` or `shared` parameter keeps
the owned mode.

### `-rust-shared-classes`: a shared class becomes `Rc<RefCell<T>>`

By default an object is a value on Rust and a reference on the eleven other
targets, so a program that shares an object between two names does not
compile for Rust (the caution on the
[ownership page](/Ranger/docs/language/ownership/)). The experimental flag
`-rust-shared-classes` closes exactly that gap: every class the sharing
verdict marks becomes `Rc<RefCell<T>>` — its fields, its parameters, its
locals and its collection elements — while the classes marked `value` keep
the plain struct and pay nothing.

```rust
let mut a : Rc<RefCell<Counter>> = Rc::new(RefCell::new(Counter::new()));
let mut b : Rc<RefCell<Counter>> = a.clone();   // def b:Counter a — one object
b.borrow_mut().add(1);                          // prints: a 1, on Rust too
```

A method that uses `this` as a value takes a hidden first parameter
`__self_rc : &Rc<RefCell<T>>`, because `&mut self` cannot reach the `Rc`
that holds the receiver; every call site passes the receiver's `Rc`
alongside. That is what makes a live back reference possible — see `weak`
below.

The flag is experimental: a shared class in a return type, a strong optional
field of one, and elements read out of shared collections do not follow the
class yet. Without the flag the Rust output is unchanged, byte for byte.

## What the Swift writer does

### `final class`

Swift calls a method of a `final` class directly. It must call a method of an
open class through the witness table, because a subclass could replace the
method. A class that no class in the compilation extends is therefore `final`.

```swift
final class HuffmanTable : Hashable {
```

Both gallery programs above hold no inheritance, so every class of each is
`final`: 22 of 22 in `jpeg_scaler.rgr`, 41 of 41 in `js_ast.rgr`.

### `weak var`

A field that states `weak` together with `optional` becomes a Swift weak
reference:

```lisp
class Node {
    def name:string ""
    def parent@(weak optional):Node
}
```

```swift
final class Node : Hashable  {
  var name : String = ""
  weak var parent : Node?
}
```

Swift needs both parts: the storage must be a `var`, and the type must be
optional, because Swift sets a weak reference to nil when the object goes away.
A field that states `weak` without `optional` therefore keeps the strong form.

## What the annotations change

Ranger has four annotations for memory: `weak`, `strong`, `lives` and `temp`.
The table states what each target does with them, measured by a compilation of
the same program with and without each annotation.

| Annotation | C++ | Swift | Rust | The nine other targets |
| --- | --- | --- | --- | --- |
| `weak` | The field becomes `r_weak<T>`, which holds a `std::weak_ptr<T>` | With `optional`, the field becomes `weak var x : T?` | The field becomes `Option<Weak<RefCell<T>>>`. It works under `-rust-shared-classes` and not without the flag. See below. | No change, and none is necessary |
| `strong` | No change | No change | — | No change |
| `lives` | No change | No change | No change | No change |
| `temp` | No change | No change | No change | No change |

`lives` and `temp` are read by the lifetime bookkeeping of the compiler
(`compiler/ng_RangerAppParamDesc.rgr`), not by a writer of a target language.

### `weak` on Rust needs the flag

Without `-rust-shared-classes` a Rust class is a plain `struct`, no `Rc`
holds the parent to downgrade, and the `weak` output does not compile. Do
not use `@(weak)` in a program that must compile for Rust without the flag.

With the flag, the sharing verdict makes both classes of the cycle
`Rc<RefCell<T>>`, the back reference downgrades the `Rc` that really holds
the receiver, and a read upgrades to that same `Rc`:

```rust
fn adopt(&mut self, __self_rc : &Rc<RefCell<Parent>>, mut c : Rc<RefCell<Child>>) {
  c.borrow_mut().parent = Some(Rc::downgrade(__self_rc));
  self.kids.push(c.clone());
}
…
let mut back : Rc<RefCell<Parent>> = c.borrow_mut().parent.clone().unwrap().upgrade().unwrap();
```

The parent and child program compiles with `rustc`, runs, and reads the
parent's name back through the child's weak field — the same output as the
JavaScript build.

## What this means for a program

- **`weak` works on C++ and on Swift, and on Rust under
  `-rust-shared-classes`.** Use it for a back reference. Two objects that
  hold each other with strong references stay in memory on all three. On
  Swift write `@(weak optional)`, because a Swift weak reference must be
  optional.
- **The passes need no help.** A local that takes a member field and changes
  it in place becomes a C++ reference, and a parameter that a function only
  reads becomes a reference on C++ and on Rust, all by themselves.
- **`-strict-ownership` is a reading tool.** It states where the compiler
  believes each argument goes, and which classes share objects. Use it to
  check that a function you believe to be pure holds only `borrowed`
  parameters, and to see which classes the Rust flag would make
  `Rc<RefCell<T>>`.
