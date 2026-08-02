# PLAN_RUST_OWNERSHIP — carry the ownership work to the Rust target

Question: the ownership inference is now sound and interprocedural
(PLAN_OWNERSHIP_SOUNDNESS), and the C++ writer profits from it. Can the Rust
output profit the same way?

**Answer: yes, in two steps of very different size.** The small step is the
direct transfer of the C++ finding: a parameter the summary proves `borrowed`
can be `&T`, which deletes a whole-struct `.clone()` at every read-only call
site. The large step is the one every Rust document in this repository already
names: the object model. A Ranger object is a reference on eleven targets and
a value on Rust, and no parameter-passing fix changes that.

## What the Rust output does today, measured

`tests/fixtures/llvm_ownership_infer.rgr` compiled with `-l=rust`:

```rust
fn attach(&mut self, mut parent : &mut Node, mut child : Rc<RefCell<Node>>) -> ()
fn addToken(&mut self, mut t : Node) -> ()
fn sumValue(&mut self, mut a : Node, mut b : Node) -> i64
...
helper.attach(&mut root, Rc::new(RefCell::new(child.clone())));
bag.addToken(root.clone());
let total : i64 = bag.sumValue(root.clone(), child.clone());
```

Three parameter modes already exist — `&mut T` from the mutation pass,
`Rc<RefCell<T>>` from the weak-field wrap, owned `T` with `.clone()` at the
call site — and each line above shows a cost or a fault:

1. **`sumValue(root.clone(), child.clone())`** — the function reads two
   fields. Each call deep-copies both structs (`#[derive(Clone)]` clones the
   member vectors too). The ownership summary already says `a -> borrowed`,
   `b -> borrowed`.
2. **`addToken(root.clone())`** — the summary says `t -> moved (tokens)`.
   The clone means the bag holds a *different object* than the caller's
   `root`: a later change through `root` reaches every other target's list
   and not Rust's. This is the wrong-image class of bug in
   `gallery/pdf_writer` (PLAN_CODEGEN_OWNERSHIP, "the Rust object model does
   not share").
3. **`Rc::new(RefCell::new(child.clone()))`** — the weak-wrap builds a fresh
   `Rc` around a fresh clone at the call site, so a `Weak` stored from it is
   dead on arrival and the stored object is again a copy
   (PLAN_CODEGEN_OWNERSHIP finding 4c).
4. The sharing program of the docs (`def b:Counter a`) still does not
   compile: `rustc` E0382, borrow of moved value.

Faults 2–4 are one fault: a class is a plain `struct`, so no two names can
hold one object. Fault 1 is independent, and fixable now.

## Status

| # | Change | State |
| --- | --- | --- |
| 1 | `&T` for an object parameter the summary proves `borrowed` (no clone at the call site) | Done |
| 2a | Class-level sharing decision as a diagnostic: `-strict-ownership` prints which classes need `Rc<RefCell<T>>`, and why | Done |
| 2b | The emission: a shared class becomes `Rc<RefCell<T>>`, reusing the machinery the trait support already has; `weak` then stores a real `Weak<RefCell<T>>` | Behind `-rust-shared-classes`: the sharing program prints `a 1`, and the parent–child `weak` program compiles, runs, and reads back through the weak reference — finding 4c of PLAN_CODEGEN_OWNERSHIP, live on Rust for the first time |
| 3 | `moved` parameter takes the value without a clone when the argument is dead after the call | Open, needs liveness, and only pays once step 2b exists |

### Step 2a, measured

`analyzeClassSharing` in `ng_StaticAnalysis.rgr` runs after the ownership
fixpoint and marks a class shared on the first of: a parameter of its type
`moved`/`shared` (a callee holds the object while the caller's name lives), a
def or assignment alias that some name then mutates through, a field or
collection read into a local that is mutated, or being the target of a
`weak` field. The walk carries its own mutated-name collection (method-call
receivers, field-assignment roots, mutating-operator targets), so it does
not depend on the C++/Rust-only mutation pass and prints under any target.

```text
ownership[rust] class Counter -> Rc<RefCell> (aliased and mutated in main)
ownership[rust] class Parent -> Rc<RefCell> (weak field Child.parent)
ownership[rust] class Child -> Rc<RefCell> (stored via adopt.c)
ownership[rust] class Color -> value
```

On `jpeg_scaler.rgr`: **21 of 22 classes stay `value`** — the program is
almost entirely value-shaped, which is why the struct model mostly works
there — and the one exception the analysis finds is the exact aliasing
pattern the value model breaks on:

```text
ownership[rust] class BufferChunk -> Rc<RefCell> (stored object mutated through a local in toBuffer)
```

`Buffer` walks its chunk list through a local (`def chunk:BufferChunk
firstChunk` … `chunk.next`) while other methods mutate chunks through other
names; under clone-on-assignment those names can hold different copies. This
is the strongest candidate yet for the wrong-image fault, and 2b needs to
make exactly this class a reference.

---

## Step 1 — `&T` for a proven-borrowed object parameter

The immutable-borrow marking in `ng_StaticAnalysis.rgr` (`analyzeFunction`)
has always excluded object types, with the comment:

> We do NOT mark object-type parameters as immutable because they may have
> optional fields accessed with `.as_mut().unwrap()`, and method calls on
> those fields require the parent to be `&mut`.

That caution was correct when nothing proved where a parameter went. The
interprocedural summary now proves it: `borrowed` means no store into any
object graph, no return, no storing callee anywhere down the chain. The
remaining hazards are receiver mutation and reassignment, and the mutation
pass already tracks both (`is_mutating`, `mutation_count`, `set_cnt`).

**Change.** `applyOwnershipToRustBorrows` in `ng_StaticAnalysis.rgr`, run for
the `rust` target after `analyzeOwnershipAll` (`VirtualCompiler.rgr` now runs
the ownership pass for Rust as well). A parameter is upgraded to
`rust_borrow_type = 1` — the writer already emits `name : &T` for that, takes
`&x` at the call site, and restores `.clone()` when a reference is forwarded
to an owned parameter — when all of these hold:

- the summary resolved it `borrowed`;
- the mutation pass saw no mutation, no method call on it, no reassignment
  (`is_mutating` false, `mutation_count` 0, `set_cnt` 0);
- it is not already `&mut`, not `Rc`-wrapped, not assigned to a field;
- it is not optional and not a keyword marker;
- its type is a defined class of the compilation — not a system class, not a
  union, not a trait, and not part of an inheritance chain, for the same
  signature-stability reason as `cppBorrowedObjectParam`.

**Result.** The fixture now reads:

```rust
fn sumValue(&mut self, a : &Node, b : &Node) -> i64
...
let total : i64 = bag.sumValue(&root, &child);
```

`rustc` accepts the output, the program prints what the ES6 output prints,
and the two clones at that call site are gone. On
`gallery/pdf_writer/src/tools/jpeg_scaler.rgr` the numbers are in the
measurement section below.

Behavior is unchanged by construction: a `borrowed` parameter is read-only
and non-escaping, so a reference and a private deep copy are observationally
identical — the reference is just not paid for.

## Step 2 — the object model (open, the design)

The correct model is the one the language documents: an object is a
reference. On Rust that is `Rc<RefCell<T>>`, and three facts make it less
work than it once was:

1. The trait support already holds every pattern: `Rc<RefCell<dyn Trait>>`
   fields, `.borrow()` / `.borrow_mut()` at use sites, clone-of-`Rc` on
   assignment (`ng_RangerRustClassWriter.rgr`, the `rust_needs_rc_wrap`
   paths). The change is to apply the same emission to a concrete class.
2. The escape analysis now tells which classes need it. A class needs
   reference semantics only if some object of it is ever *aliased and held* —
   stored into a graph while another name stays live, or aliased by a `def`.
   The summary exposes exactly those events (`moved`, `shared`, the alias
   table). A class that never shares — every parameter `borrowed`, no alias
   stores — keeps today's plain `struct` and pays nothing.
3. `weak` on Rust (PLAN_CODEGEN_OWNERSHIP 4c) is unblocked by it: with a real
   `Rc` holding the parent, `Rc::downgrade` finally has something to
   downgrade, and the C++ `r_weak<T>` wrapper has a direct analogue in a
   `Weak<RefCell<T>>` field read through `.upgrade()`.

Order of work when this step is taken: first a class-level diagnostic
(`-strict-ownership` prints which classes the analysis would make `Rc`),
measured against the gallery; then the emission behind a flag; then the flag
becomes the default and `weak` lands on Rust. That is the same
diagnose-then-consume staging that carried the C++ work.

### Where the emission stands (`-rust-shared-classes`)

`applySharedClassRcWrap` gives every field, parameter and local of a shared
class the `rust_needs_rc_wrap` mode the writer already implements, and the
def-writer learned the one missing move: an initializer that is already
`Rc<RefCell<T>>` is an alias, so it clones the Rc rather than wrapping a
second cell. That is enough for the program the docs define the object model
with:

```rust
let mut a : Rc<RefCell<Counter>> = Rc::new(RefCell::new(Counter::new()));
let mut b : Rc<RefCell<Counter>> = a.clone();
b.borrow_mut().add(1);
```

`rustc` accepts it and it prints `a 1` — the first time a Ranger program
that shares an object between two names works on Rust. Without the flag,
every Rust output is byte-identical to before
(`tests/compiler-ownership.test.ts` asserts both).

The two gaps that stood between the flag and the parent–child program are
closed:

1. **`this` as a value.** A method of a shared class runs inside `&mut self`
   and cannot reach the `Rc` that holds it — the `shared_from_this` question
   in Rust form. A method whose body uses `this` as a value now takes a
   hidden first parameter `__self_rc : &Rc<RefCell<T>>`
   (`rustNeedsSelfRc` / `writeSelfRcReceiverArg`), and every call site
   passes the receiver's Rc alongside the `borrow_mut()` — safe, because
   the callee only clones or downgrades the Rc and never borrows the cell
   again. `c.parent = this` emits `Some(Rc::downgrade(__self_rc))`: a live
   back reference, where the old output built a fresh cell around a copy of
   self, dead on arrival.
2. **Collections of a shared class.** The element type follows the class:
   `kids:[Child]` is `Vec<Rc<RefCell<Child>>>`, and a `HashMap` value the
   same.

A weak read completes the loop: `(unwrap c.parent)` upgrades to the Rc
itself (`…parent.clone().unwrap().upgrade().unwrap()`), and a def from it is
recognized as an already-owned Rc — no second cell, no `RefMut` type error.
The program

```lisp
p.adopt(c)
def back:Parent (unwrap c.parent)
print back.name
```

compiles with `rustc` and prints `papa`, the same as the ES6 output. This is
finding 4c of PLAN_CODEGEN_OWNERSHIP — `weak` on Rust — working for the
first time, ten lines of writer change once the object model existed.

The next round closed the produced-or-consumed surfaces. A shared class in
a return position hands out the Rc (`writeRustReturnType`), a strong
optional field is `Option<Rc<RefCell<T>>>` (`writeStructField`), a call
result or a strong-optional unwrap that already carries an Rc is taken as
one (`rustInitRcState`), and the sharing analysis learned the two events
that make those surfaces matter: a named value stored into any object graph,
and a function that returns stored state. The aliasing probe — store an
object into a list and an optional field, read it back through two getters,
mutate through one name — compiles with `rustc`, runs, and prints `yy`,
the same as the ES6 output. A field read borrows shared
(`n.borrow().name`) while a write and a method receiver borrow mutably, so
two reads of one cell can overlap; that turned the probe's
`RefCell already borrowed` panic into the right answer.

What the flag still does not cover: a `this`-value method called through a
receiver chain the writer cannot name (`(expr).method(x)`), and an
assignment whose right side reads the same cell its left side writes
(`a.name = b.name` when the two names hold one object needs the right side
in a temporary first). The conformance suite over a larger program (the
`evg` gallery) is the right gate before the flag can default on.

## How to check

```sh
npm run compile
npx vitest run --config tests/vitest.config.ts compiler-rust.test.ts codegen-rust.test.ts compiler-ownership.test.ts
```

The gate for step 1 on this machine, both sides built with `rustc`:

```sh
node bin/output.js -l=rust ./tests/fixtures/llvm_ownership_infer.rgr -d=./tmp -o=own.rs
node bin/output.js -l=rust ./gallery/pdf_writer/src/tools/jpeg_scaler.rgr -d=./tmp -o=jpeg.rs
```

- the fixture builds and prints `3` (the same as the ES6 output);
- `jpeg.rs` builds before and after, the binary writes the same output file
  byte for byte, and the `.clone()` count falls — the count is the measured
  win;
- the summaries printed under `-strict-ownership` do not change (step 1 reads
  the summary, it does not alter it).

## Measurement, step 1

| Measurement | Before | After |
| --- | --- | --- |
| `llvm_ownership_infer.rgr`: whole-struct clones at the `sumValue` call | 2 | 0 |
| `llvm_ownership_infer.rgr`: `rustc` accepts, prints `3` like the ES6 output | yes | yes |
| `jpeg_scaler.rgr`: `.clone()` sites in the Rust output | 321 | 314 |
| `jpeg_scaler.rgr`: `rustc -O` accepts (errors) | 0 | 0 |
| `jpeg_scaler.rgr`: output file of the binary | `97d86d9d…` | `97d86d9d…` (byte-identical) |

The seven removed clone sites are the ones inside the pixel loops:
`setPixel(x, y, c.clone())` in `fillRect` and `drawLine` becomes
`setPixel(x, y, &c)`, so the win per frame is a `Color` deep copy per pixel,
not seven copies per program.

(The jpeg image itself is byte-identical before/after but still wrong versus
the C++ image — that is fault 2/the object model, and step 1 does not claim
it.)
