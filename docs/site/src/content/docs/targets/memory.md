---
title: Memory and ownership
description: How the compiler analyses object lifetime, what the analysis changes in the output, and what the memory annotations do for each target.
---

Ten of the thirteen target languages collect the memory that a program stops
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

A compilation of `gallery/pdf_writer/src/tools/jpeg_scaler.rgr` analyses 114
functions and decides all 261 parameters: 257 `borrowed`, and 4 `moved`. It
prints no `unknown` warning.

The pass ends with a class-level verdict: a class some object of which is
ever aliased and held — stored into an object graph, aliased and then
mutated through a name, or the target of a `weak` field — needs reference
semantics on a target whose objects are values. The flag prints this too:

```text
ownership[rust] class BufferChunk -> Rc<RefCell> (stored in allocateNewChunk)
ownership[rust] class Color -> value
```

On `jpeg_scaler.rgr`, 16 classes of 22 stay `value`. Six classes become
`Rc<RefCell<T>>`: a linked buffer node, a Huffman table, a JPEG component, a
quantization table, a coefficient buffer and an EXIF tag.

A last store of a fresh local is a move, not a share. If the function builds
an object, writes its fields, and then stores it once, and no use of the
name follows, the class stays `value`. The Rust writer then drops the
`.clone()` on that store. A `def` plus the field writes after it can be one
initialization; the Rust writer folds that run into a struct literal. The
C++ writer and the Swift writer do not read those two marks yet.

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

On `jpeg_scaler.rgr` the C++ output uses `const std::shared_ptr<T>&` for the
object parameters that the pass marks `borrowed`.

### `enable_shared_from_this` only where the output needs it

A class gets `public std::enable_shared_from_this<T>` when the writer emits a
`shared_from_this()` call for it, which happens where the program uses `this`
as a value. A class that another class extends keeps the base as well, because
a subclass can call through it. Every other class does without.

The base is not free: it puts a `std::weak_ptr` into every object of the class,
so a program with many small objects pays two pointers each.

`jpeg_scaler.rgr` and `gallery/js_parser/js_ast.rgr` emit the base on no class.
Neither program uses `this` as a value.

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

On `jpeg_scaler.rgr` the removed clones include the ones inside the pixel
loops — `setPixel(x, y, c.clone())` becomes `setPixel(x, y, &c)`. A `moved`
or `shared` parameter keeps the owned mode.

### A shared class becomes `Rc<RefCell<T>>` — the default

An object used to be a value on Rust and a reference on the eleven other
targets, so a program that shared an object between two names did not
compile for Rust (the caution on the
[ownership page](/Ranger/docs/language/ownership/)). The shared-class model
closes exactly that gap, and it is the default: every class the sharing
verdict marks becomes `Rc<RefCell<T>>` — its fields, its parameters, its
locals and its collection elements — while the classes marked `value` keep
the plain struct and pay nothing. The flag `-rust-value-classes` restores
the old plain-struct model for every class.

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

Every produced-or-consumed surface follows the class: a shared class in a
return type hands out the `Rc`, a strong optional field is
`Option<Rc<RefCell<T>>>`, and an element read out of a shared collection is
the `Rc` itself.

## What the Swift writer does

### `final class`

Swift calls a method of a `final` class directly. It must call a method of an
open class through the witness table, because a subclass could replace the
method. A class that no class in the compilation extends is therefore `final`.

```swift
final class HuffmanTable : Hashable {
```

A program with no inheritance gets `final` on every class.

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

| Annotation | C++ | Swift | Rust | The ten other targets |
| --- | --- | --- | --- | --- |
| `weak` | The field becomes `r_weak<T>`, which holds a `std::weak_ptr<T>` | With `optional`, the field becomes `weak var x : T?` | The field becomes `Option<Weak<RefCell<T>>>`. It works with the shared-class default and not under `-rust-value-classes`. See below. | No change, and none is necessary |
| `strong` | No change | No change | — | No change |
| `lives` | No change | No change | No change | No change |
| `temp` | No change | No change | No change | No change |

`lives` and `temp` are read by the lifetime bookkeeping of the compiler
(`compiler/RangerAppParamDesc.rgr`), not by a writer of a target language.

### `weak` on Rust needs the shared-class model

Under `-rust-value-classes` a Rust class is a plain `struct`, no `Rc`
holds the parent to downgrade, and the `weak` output does not compile. Do
not use `@(weak)` in a program that must compile for Rust with that flag.

With the default shared-class model, the sharing verdict makes both classes
of the cycle
`Rc<RefCell<T>>`, the back reference downgrades the `Rc` that really holds
the receiver, and a read upgrades to that same `Rc`:

```rust
fn adopt(&mut self, __self_rc : &Rc<RefCell<Parent>>, mut c : Rc<RefCell<Child>>) {
  c.borrow_mut().parent = Some(Rc::downgrade(__self_rc));
  self.kids.push(c.clone());
}
…
let mut back : Rc<RefCell<Parent>> = c.borrow().parent.clone().unwrap().upgrade().unwrap();
```

The parent and child program compiles with `rustc`, runs, and reads the
parent's name back through the child's weak field — the same output as the
JavaScript build.

## What the pass does not decide yet

These forms still produce a summary that is too optimistic, or a mark that no
writer reads:

- An argument passed to a **lambda** the function received (`cb(v)`) stays
  `borrowed` even when the lambda stores it. The C++ output stays correct,
  because a lambda takes its arguments by value.
- A two-step escape through a local collection (`push tmp p` then
  `this.items = tmp`) is not counted as a store of `p`.
- The last-store move and the init fold are marks on the tree. Only the Rust
  writer reads them.

## What this means for a program

- **`weak` works on C++, on Swift, and on Rust.** Use it for a back
  reference. Two objects that
  hold each other with strong references stay in memory on all three. On
  Swift write `@(weak optional)`, because a Swift weak reference must be
  optional.
- **The passes need no help.** A local that takes a member field and changes
  it in place becomes a C++ reference, and a parameter that a function only
  reads becomes a reference on C++ and on Rust, all by themselves.
- **`-strict-ownership` is a reading tool.** It states where the compiler
  believes each argument goes, and which classes share objects. Use it to
  check that a function you believe to be pure holds only `borrowed`
  parameters, and to see which classes the Rust writer makes
  `Rc<RefCell<T>>`.
