# PLAN_RUST_REENTRANCY — why the Rust self-host compiles and does not run

> **Status: fixed. The Rust rendering of the compiler now compiles the
> compiler, and its output is byte-identical to the node-hosted compiler's.**
> Measured on this tree, Linux x86-64, rustc from the toolchain in the
> container. `npm run selfhost:run:rust` is the gate.

The Rust rendering of the compiler has reported **0 rustc errors** for a long
time, and it has never run: given any input at all it aborts before writing a
line of output. `scripts/rust-selfhost-check.sh` type-checks the generated
source and nothing more, so the gate was green and the program was dead.

Built unoptimised, it says what is wrong:

```
thread '<unnamed>' panicked at ranger_compiler.rs:105454:19:
RefCell already borrowed
   5: core::cell::RefCell<T>::borrow_mut
   6: ranger_compiler::RangerActiveOperators::initialize_op_cache
   7: ranger_compiler::RangerAppWriterContext::init_op_list
   8: ranger_compiler::VirtualCompiler::run
```

Both causes are the same shape: **a borrow that outlives the statement that
took it, and a `borrow_mut` of the same cell inside**. rustc cannot see it —
`RefCell` checks at run time — so neither shows up in the error count.

## 1. A `for` head holds its borrow for the whole loop — **fixed**

```ranger
for stdCommands.children lch i {
    ...
    set opHash fc.vref newOpList
}
```

`for x in EXPR` is the one place Rust keeps a temporary alive across a block.
The Reference lists the condition of an `if` or a `while` as its own temporary
scope — those `Ref`s are dropped before the body runs — but a `for` desugars
to a `match` over `into_iter(EXPR)`, and every temporary in `EXPR` lives until
the match ends, which is after the last iteration.

So the head borrows `this` to reach `stdCommands`, the body borrows `this`
mutably to write `opHash`, and the first iteration panics.

The writer already knew the shape: the index form of the loop reads its bound
into a local first, with a comment saying why. The check that picks between
the forms (`rustForBodyTouchesCollection`) compares NAMES, and this body never
mentions `stdCommands`, so it took the iterator form.

**Fix:** the iterator form now reads the collection into a local first
whenever reading it takes a borrow — a field in a receiverless method, or a
path through a shared class — which ends the borrow at that statement's
semicolon. 761 loops in the generated compiler carried a `.borrow()` in the
head.

The condition is "does this read borrow", not "is this a field", and the
difference matters: a field of a plain struct reached through a `&self`
receiver is `self.lines`, no cell and nothing held, and hoisting that would
clone the collection once per loop for nothing. The front page's Rust sample
is exactly that shape, which is how the over-wide version was caught.

## 2. A trait method with a `&mut self` receiver — **fixed**

With §1 fixed the compiler gets from the first operator lookup all the way
into writing its output, and then:

```
thread '<unnamed>' panicked at ranger_compiler.rs:106496:16:
RefCell already borrowed
   6: ranger_compiler::LiveCompiler::local_call
   9: ranger_compiler::RangerJavaScriptClassWriter::walk_node
  11: <RangerJavaScriptClassWriter as RangerGenericClassWriterTrait>::write_class
  12: ranger_compiler::LiveCompiler::local_call
```

`LiveCompiler::local_call` does

```rust
let _tmp_1 = __self_rc.borrow().lang_writer.clone().unwrap();
_tmp_1.borrow_mut().write_class(node, ctx, wr);
```

`write_class` walks the class body, which calls back into `LiveCompiler`,
which reaches `local_call` again and takes `_tmp_1.borrow_mut()` on the same
cell. The compiler and its writers are **mutually recursive by design**; the
Rust backend dispatches those calls through `Rc<RefCell<dyn Trait>>` with a
`&mut self` receiver, and a `&mut self` receiver means the call site holds a
`RefMut` for the whole call.

### Why the receiver is `&mut self`

Not because the walk mutates anything interesting. Every writer class carries
"once" latches and counters — `wrote_header`, `*_enums_written`,
`kotlin_package_written`, `csLambdaArgCounter`, `pyLambdaCounter`,
`signature_cnt`, `fmtMode` — and a method that writes one of them mutates its
own object. The receiver-mutability fixpoint propagates that up every caller,
so `write_class` and `walk_node` end up `&mut self` and every dispatch through
the trait takes the cell exclusively.

`compiler/RustOwnership.rgr` already documents both halves of the bind:

> A method that carries its own handle hands it to something that will reach
> back through it, and a `&self` receiver is a borrow of the cell held for the
> whole call: the caller's borrow is still live when the callee takes its own.
> Reaching every field through the handle instead borrows for one statement at
> a time.

...and, three lines up:

> A method the TRAIT declares always keeps its receiver, whatever its body
> does. Without one the call site writes `Parent::m(…)`, which is the parent's
> own implementation — the override never runs.

Dynamic dispatch needs a receiver; a receiver is a borrow; a borrow across a
re-entrant call is a panic. That is the whole of it.

### The fix: put the receiver on the handle

Every class that is NOT in a trait family already uses the safe convention:

```rust
fn initialize_op_cache(__self_rc : &Rc<RefCell<RangerActiveOperators>>) {
    __self_rc.borrow_mut().op_hash.insert(…);   // borrow ends at the ;
}
```

581 methods in the generated compiler are written that way. The trait families
are the exception. So implement the trait for the HANDLE rather than for the
struct:

```rust
impl CTrait for Rc<RefCell<C>> {
    fn write_class(&self, node, ctx, wr) { C::write_class(self, node, ctx, wr) }
}
```

`&self` is then `&Rc<RefCell<C>>` — exactly the `__self_rc` the inherent
method already wants — and **no borrow is held across the call**. Dynamic
dispatch still works, because `Rc<RefCell<Rc<RefCell<C>>>>` unsizes to
`Rc<RefCell<dyn CTrait>>`: the handle type written everywhere else does not
change, only what sits inside it.

Concretely:

1. `rustMethodNeedsReceiver` returns false for a trait method of such a
   family, so the inherent method is emitted receiverless with
   `__self_rc : &Rc<RefCell<C>>` — the concrete class, not `dyn CTrait`.
2. The trait declares every method `&self`.
3. `impl CTrait for Rc<RefCell<C>>`, each body forwarding `C::m(self, …)`.
4. `impl RgAnyRef for Rc<RefCell<C>>`.
5. The site that builds a handle wraps one level further.
6. Call sites keep their shape; `borrow_mut()` becomes `borrow()` because the
   methods are `&self` now.

### What it took, in the end

Eleven edits, in the order they were found:

1. `StaticAnalyzer.computeTraitReentrancy` answers the question below and
   records it on the class descriptor.
2. `rustMethodNeedsReceiver` returns *false* for a trait method of such a
   family — the inherent method is emitted receiverless.
3. `computeSelfRcNeeds` stops excluding those families, so every method
   carries `__self_rc`.
4. `rustSelfRcParamType` types it with the class being EMITTED, because each
   subclass carries its own copy of an inherited method over its own fields.
5. The trait declares every method `&self`; the impls target
   `Rc<RefCell<C>>` and forward `C::m(self, …)`; `RgAnyRef` likewise.
6. The field accessors return by value, and the `_mut` pair hands back a
   `RefMut` projected onto the field with `RefMut::map` — the call sites keep
   the shape they already write.
7. A call whose receiver is a trait handle dispatches instead of naming the
   class, and passes no hidden handle.
8. An associated-function call names the class being emitted, not the one
   that declared the method.
9. `this` as a value, and an assignment into a trait-typed field, wrap one
   cell further: the trait object holds a handle now, not a struct.
10. The `this`-to-concrete downcast is skipped, because the hidden receiver
    is already concrete.
11. …and two more instances of §1's shape, found only by running it: a
    **hidden receiver read through a field** (`&__self_rc.borrow().compiler…`
    as an argument — the borrow lives to the semicolon, which is after the
    call returns) is bound to a local first, and the `for`-head hoist also
    covers a **bare field name** (`for walkAlso ch i`), which the first fix
    missed because it only looked at dotted paths.

The last two are not trait-specific and were latent everywhere;
`RangerFlowParser::startWalk` is the one that surfaced.

### Why it has to be scoped, and to what

It cannot be done to every trait family. The trait's FIELD ACCESSORS are the
problem: `fn rgf_name_node(&self) -> &Rc<RefCell<CodeNode>>` returns a
reference INTO the struct, and a method on `Rc<RefCell<C>>` has no struct to
return a reference into — it would have to return an owned clone.

| family | accessor call sites |
| --- | --- |
| `RangerGenericClassWriterTrait` (the writers) | **3**, all `rgf_compiler_mut` at start-up |
| `RangerAppParamDescTrait` | **1 789** |

So the writer family can take the change for almost nothing, and the
`RangerAppParamDesc` family cannot without turning 1 789 borrows into clones.

The discriminator should be the property that makes the family unsafe rather
than a list of names: **the family is re-entrant** — the trait root has a
field of some class X, and X has a field of the trait's own type. For the
writers that is `RangerGenericClassWriter.compiler : LiveCompiler` and
`LiveCompiler.langWriter : RangerGenericClassWriter`, a two-cycle. A family
with no such cycle cannot be re-entered through its handle and keeps the
present scheme.

### The alternative, for the record

Emit the latch fields (`wrote_header`, `*_written`, the counters, `fmtMode`)
as `Cell<T>` on Rust and teach the receiver-mutability fixpoint that writing
one does not make a method `&mut self`. Then every writer method is `&self`,
every dispatch is a shared borrow, and shared borrows nest. It is a much
smaller change and it fixes the same panic — but it holds only while no new
field mutation appears in a walk method, and it puts `Cell` into the generated
structs. Removing the memo in `formatterEnabled` alone moves 97 methods off
`&mut self` (1 560 → 1 463), which is the shape of the effect.

## 3. The gate

`scripts/rust-selfhost-check.sh` type-checks and stops, which is how a dead
program kept a green light for years. `scripts/rust-selfhost-run.sh`
(`npm run selfhost:run:rust`) is the real bar, the same one C++ and Go are
held to:

1. generate and type-check — 0 rustc errors;
2. build with `rustc -O`;
3. make that binary compile `compiler/Compiler.rgr` to ES6;
4. **diff the result against `bin/output.js`**.

Step 4 is the test. Two compilers that agree to the byte are the same
compiler. It passes: 5 596 785 bytes, identical, in 7.3 s against the node
host's 7.8 s.
