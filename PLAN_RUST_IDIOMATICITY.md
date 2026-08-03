# PLAN_RUST_IDIOMATICITY — how idiomatic is the Rust the compiler now produces?

Question: the ownership model reached the Rust target (PLAN_RUST_OWNERSHIP —
`&T` for proven-borrowed parameters, per-class sharing verdicts,
`Rc<RefCell<T>>` behind `-rust-shared-classes`). With that in place, how close
is the emitted code to the Rust a fluent Rust programmer would write?

**Answer: the ownership layer now reads like Rust; the surface layer is still
transpiler-Rust, and the two are cleanly separable.** The decisions a Rust
programmer makes first — which types are plain values, which are shared
mutable state behind `Rc<RefCell<T>>`, which parameters are `&T`, where a back
reference must be `Weak` — now come out the way that programmer would make
them, and the output is verified correct against the reference targets. What
remains is texture: on the 5476-line `jpeg_scaler` output, clippy counts
**1395 warnings**, the five blanket `#![allow]`s at the top of every file hide
**980 rustc warnings** (708 of them naming), and rustfmt rewrites **98 % of
the lines**. Almost none of that is the ownership model's doing — the flag-on
and flag-off outputs have the same clippy profile (1395 vs 1400) — it is the
base writer's templates, and most of it is mechanical to fix.

Everything below was measured on this machine with `rustc`/`cargo`/`clippy`
1.94.1, from the outputs of:

```sh
node bin/output.js -l=rust [-rust-shared-classes] ./tests/fixtures/<fixture>.rgr -d=./tmp/rusteval -o=<name>.rs
node bin/output.js -l=rust [-rust-shared-classes] ./gallery/pdf_writer/src/tools/jpeg_scaler.rgr -d=./tmp/rusteval -o=jpeg_<flag>.rs
```

## The semantic layer: what the ownership model gets right

"Idiomatic" has three levels, and they are worth keeping apart: (1) the code
*expresses ownership* the way a Rust program would; (2) it passes `rustc`
without blanket allows; (3) it passes clippy and rustfmt. The ownership work
closed most of level 1, which is the level that cannot be fixed by template
polish — and the one that used to produce wrong programs, not just ugly ones.

**1. Value by default, `Rc<RefCell<T>>` only where sharing is proven.** This
is the headline. A naive object-model port wraps every class in
`Rc<RefCell<T>>`; a fluent Rust programmer wraps only genuinely shared
mutable state. The sharing analysis lands on the programmer's answer.
`-strict-ownership` on `jpeg_scaler.rgr`:

```text
ownership[rust] class Color -> value
ownership[rust] class IDCT -> value
... 16 of 22 classes stay plain structs ...
ownership[rust] class BufferChunk -> Rc<RefCell> (stored in allocateNewChunk)
ownership[rust] class HuffmanTable -> Rc<RefCell> (returns a stored object from getDCTable)
ownership[rust] class JPEGComponent -> Rc<RefCell> (stored in parseSOF)
ownership[rust] class QuantizationTable -> Rc<RefCell> (stored object mutated through a local in reset)
ownership[rust] class CoeffBuffer -> Rc<RefCell> (stored in allocateCoeffBuffers)
ownership[rust] class ExifTag -> Rc<RefCell> (stored in parseIFD)
```

The six wrapped classes are exactly the codec's shared mutable state, and
each verdict prints its reason. A hand-written Rust port would make the same
six calls.

**2. The aliasing and weak idioms are the canonical ones.** The sharing
program of the docs emits the textbook shared-mutable pattern:

```rust
let mut a : Rc<RefCell<Counter>> = Rc::new(RefCell::new(Counter::new()));
let mut b : Rc<RefCell<Counter>> = a.clone();
b.borrow_mut().add(1);
```

and the parent–child program emits the textbook parent-pointer pattern —
`parent : Option<Weak<RefCell<Parent>>>`, stored with
`Some(Rc::downgrade(__self_rc))`, read back with `.upgrade().unwrap()`. Both
were re-verified live for this evaluation (as `sfn m@(main)` programs):
`rustc` builds them and they print `a 1` and `papa`, the same as the ES6
output. This is precisely how The Book tells you to write a tree with back
edges.

**3. `&T` where the summary proves borrowed.** Without the flag,
`llvm_ownership_infer.rgr` now reads

```rust
fn sumValue(&mut self, a : &Node, b : &Node) -> i64
...
let total : i64 = bag.sumValue(&root, &child);
```

where each call used to deep-copy two structs. Reference where a reference
suffices, ownership where the callee stores — that is the Rust calling
convention, inferred rather than annotated.

**4. Reads borrow shared, writes borrow mutably.** A field read of a shared
cell emits `.borrow()`, a write or method receiver `.borrow_mut()` (83
`borrow_mut()` / 70 `borrow()` sites on the jpeg output), so overlapping
reads of one cell are legal. The `RefCell already borrowed` class of panic is
handled the way a Rust programmer handles it — narrower borrows plus
pre-evaluated temporaries (90 `_tmp_*`/`__arg_*` sites), each temporary a
line a careful human would also have written, if with a better name.

**5. And it is correct and fast, which idiom is for.** Re-run for this
evaluation on inputs the conformance gate did not use:

| Run (`-width 200`, `Example.jpg`) | Output |
| --- | --- |
| ES6 reference | 27442 bytes, `4c2bfada…` |
| Rust, flag off | 1719 bytes, wrong — the wrong-image fault, live |
| Rust, `-rust-shared-classes` | 27442 bytes, `4c2bfada…` — **byte-identical** |

On `Canon_40D.jpg -width 400` the flag-on binary is again byte-identical and
runs in 0.030 s where node takes 0.186 s — the value-struct-heavy shape the
analysis preserves (16 of 22 classes un-wrapped) is what lets `rustc -O` be
six times the JS runtime instead of paying a refcount and a cell on every
object.

## The surface layer, measured

### clippy on `jpeg_on.rs` (5476 lines): 1395 warnings

| Count | Lint | What it looks like in the output |
| --- | --- | --- |
| 362 | `unnecessary_cast` | `x as i64` where `x : i64`, `0 as usize` |
| 297 | `assign_op_pattern` | `pos = pos + 1` for `pos += 1` |
| 295 | `double_parens` | `(((((result) << (1)))) | (self.readBit()))` |
| 85 | `needless_return` | `return result;` as the last statement |
| 84 | `unused_unit` | `-> ()` on every void function |
| 80 | `clone_on_copy` | `.clone()` on an `i64` |
| 60 | `to_string_in_format_args` | `println!("{}", total.to_string())` |
| 35 | `needless_borrow` | `&` where auto-deref already borrows |
| 25 | `ptr_arg` | `src : &Vec<u8>` for `&[u8]`, `String` for `&str` |
| 24 | `manual_clamp` | open-coded min/max chains |
| 14 | `cmp_owned` | allocating a `String` to compare |
| 6 | `bool_comparison` | `while done == false` |
| 28 | rest | `manual_range_contains`, `collapsible_if`, dead stores, … |

That is ~25 warnings per 100 lines. The flag-off output counts 1400 with the
same profile: **the ownership model added no lint noise**. Every high-count
row is a writer template, not an analysis question — the writer knows the
static types, so `unnecessary_cast`, `assign_op_pattern`, `double_parens`,
`needless_return`, `unused_unit` and `bool_comparison` (~1100 of the 1395)
are emission-time fixes with no semantic risk.

### What the five blanket `#![allow]`s hide: 980 rustc warnings

Every Rust output opens with `allow(unused_parens, unused_mut,
unused_variables, non_snake_case, dead_code)`. Stripping the header from
`jpeg_on.rs`:

| Count | Warning |
| --- | --- |
| 481 | variable should be snake_case |
| 116 | struct field should be snake_case |
| 111 | method should be snake_case |
| 121 | variable does not need to be `mut` |
| 119 | unnecessary parentheses |
| 10 | value assigned is never read (dead stores) |
| 22 | unused variables / never-used methods and structs |

Naming is 708 of the 980 — Ranger's camelCase carried through verbatim. The
allows are a pragmatic transpiler idiom, but they also mute the 10 dead-store
warnings that survive even with the header on (`err` shows 11 residual
warnings including an unused `use std::rc::Weak;`) — real, if small,
redundant work the compiler could see if the blanket were narrower.

### rustfmt rewrites 5356 of 5476 lines (98 %)

Space before the type colon (`value : i64`), double spaces after `->`,
trailing spaces, the `(&mut self, )` empty-trailing-comma parameter list (42
sites). Cosmetic, uniform, and total.

### Patterns a reviewer stops on

The recurring shapes, each with a representative line from the real output:

- **Every method takes `&mut self` — 136 methods, zero `&self`.** Pure
  getters included: `fn remaining(&mut self, ) -> i64`. On a shared class
  this forces the receiver borrow to `borrow_mut()` even for a read
  (`dcTable.borrow_mut().decode(&mut reader)`), which both narrows what the
  emitted code can express (no two overlapping method calls on one cell) and
  is the single loudest "generated code" signal in a signature. The mutation
  pass already computes `is_mutating` per method — the receiver mode just
  does not consume it yet.
- **Constructors return through a named temporary.** `let mut me = Counter {
  … }; return me;` where Rust writes the struct literal as the tail
  expression, and `Counter` where `Self` is the idiom. `BufferChunk::new`
  also initializes `data` twice (`vec![0u8; 0]` in the literal, the real
  allocation two lines later).
- **Clone hygiene.** 316 `.clone()` sites flag-on. On the six shared classes
  a clone is now a refcount bump with correct sharing semantics — the model
  working as designed (`getDCTable` returning `self.dcTable0.clone()` is
  exactly `Rc::clone`, though clippy would prefer that spelling for
  visibility). But the writer also stacks redundant ones:
  `self.firstChunk.clone().clone()` (twice), `return result.clone();` on a
  local `String` about to drop, `self.tokens.push(t.clone())` where `t` is
  an owned parameter the caller already cloned, and 80 `clone_on_copy`
  scalars.
- **String building.** Concatenation is `[&*a, &*b].concat()` — inside
  `toString`'s loop this reallocates the accumulator per character, O(n²)
  where `result.push(ch)` is O(n) — and printing routes through
  `.to_string()` inside `println!` (60 sites) instead of `format!`
  arguments.
- **Redundant `mut`, twice over.** 475 of 995 `let` bindings are `let mut`,
  and 121 of those `mut`s are dead by rustc's own count above; 30
  parameters are `mut x : &mut T` — a mutable binding of a mutable
  reference, where the binding-`mut` is nearly always dead weight
  (`fn attach(&mut self, mut parent : &mut Node, …)`).
- **Hot-loop borrows are not hoisted.** `toBuffer` re-borrows per byte:
  `chunk.borrow().data[(i) as usize]` inside the inner while — a human binds
  `let c = chunk.borrow();` outside the loop. Correct, but leaves easy
  performance on the table in exactly the code paths the Rust target exists
  for.
- **A free `fn main` is not a program on Rust.** `ownership_shared_counter.rgr`
  declares `fn main:void ()` at file level; the Rust output attaches it to
  the last class as `fn main(&mut self, )` and emits no crate `main`, so the
  file fails `rustc` with E0601 — only the `sfn m@(main)` form produces a
  binary. The fixture-string tests never build these files, so nothing
  catches it. (The list walk `chunk = chunk.next` via a pre-evaluated
  temporary, by contrast, is handled — that edge closed during the
  conformance gate.)
- **`#[derive(Clone)]` stays on shared classes.** Deriving a deep `Clone`
  for a struct that now lives behind `Rc<RefCell<…>>` is mostly dead code
  and re-opens the accidental-deep-copy door the model just closed; the six
  shared structs no longer need the derive.
- **The `__self_rc` hidden parameter** (`fn adopt(&mut self, __self_rc :
  &Rc<RefCell<Parent>>, …)`) is sound and its guard rails are good (the
  constructor and unnameable-receiver cases are compiler errors), but the
  Rust-native spelling of the same idea is an associated function taking
  `this: &Rc<RefCell<Parent>>` as the receiver — one parameter, not two
  views of one object. Cosmetic today; worth revisiting only if signatures
  become a public surface.

## The ranked distance to idiomatic

In order of leverage, with the measured payoff of each:

1. **`&self` receivers from the mutation pass.** The analysis exists; emit
   `&self` when `is_mutating` is false and no transitive callee mutates.
   Erases the loudest signature tell (136:0 today), lets shared-class read
   calls take `.borrow()` at the receiver, and shrinks the RefCell-conflict
   surface the pre-evaluation machinery exists to manage.
2. **Template-level clippy sweep.** Compound assignment, drop `-> ()`, tail
   expression instead of `return`, no double parens, no `(&mut self, )`
   comma, `x != 0`-style bool tests, cast only when the types differ.
   ~1100 of 1395 clippy warnings, zero semantic content.
3. **Clone hygiene.** Skip the second `.clone()` on an already-cloned Rc,
   never clone a `Copy` scalar (80), never `return local.clone()` for an
   owned local, take `push(t)` when the parameter is owned. Also spell
   shared-class clones `Rc::clone(&x)` — the idiom exists precisely to mark
   cheap-alias vs deep-copy at a glance, which is the distinction the
   ownership model computes.
4. **snake_case emission.** A rename pass (the writer already renames
   keywords) deletes 708 of the 980 hidden rustc warnings and the
   `non_snake_case` allow itself.
5. **`&[u8]` / `&str` parameters** where the writer emits `&Vec<u8>` /
   `String` reads (25 `ptr_arg` sites), and `format!` in place of the
   `[&*a, &*b].concat()` chains (60 `to_string_in_format_args` + the O(n²)
   accumulator).
6. **Hoist loop-invariant borrows** — performance, in the pixel loops.
7. **Make a free `fn main` a crate `main`** (or a compile error naming
   `sfn m@(main)`), and emit `use std::rc::Weak;` only when a weak field
   exists.
8. **Emit rustfmt-shaped text** (or run rustfmt when available) and drop the
   `unused_mut` / `unused_parens` / `unused_variables` allows as the
   corresponding emissions tighten — the end state is output that is clean
   under `rustc` with at most `dead_code` allowed, and the allows were the
   scaffolding.

Items 2, 3, 5 and 8 are pure writer templates. Items 1 and the `mut`-binding
half of 8 consume analysis that already runs. Only item 4 touches naming
visible across a build, and none of them touch the ownership model — which
is the point: the hard part of idiomatic Rust was deciding what owns what,
and that part now measures correct.

## How to check

```sh
npm run compile
mkdir -p tmp/rusteval
node bin/output.js -l=rust -rust-shared-classes ./gallery/pdf_writer/src/tools/jpeg_scaler.rgr -d=./tmp/rusteval -o=jpeg_on.rs
node bin/output.js -l=rust ./gallery/pdf_writer/src/tools/jpeg_scaler.rgr -d=./tmp/rusteval -o=jpeg_off.rs
node bin/output.js -l=rust -rust-shared-classes -strict-ownership ./gallery/pdf_writer/src/tools/jpeg_scaler.rgr -d=./tmp/rusteval -o=jpeg_diag.rs   # per-class verdicts

# correctness, on an input the gate did not use
cd tmp/rusteval
rustc --edition 2021 -O jpeg_on.rs -o jpeg_on.bin
node ../../bin/output.js -l=es6 ../../gallery/pdf_writer/src/tools/jpeg_scaler.rgr -d=. -o=jpeg_ref.js
./jpeg_on.bin  -width 200 ../../gallery/pdf_writer/assets/images/Example.jpg on.jpg
node jpeg_ref.js -width 200 ../../gallery/pdf_writer/assets/images/Example.jpg ref.jpg
md5sum on.jpg ref.jpg        # identical

# the lint measurements (any cargo project with the .rs as a bin)
cargo clippy                  # 1395 warnings flag-on, 1400 flag-off
sed '1,5d' jpeg_on.rs > noallow.rs && rustc --edition 2021 noallow.rs -o /dev/null   # 980 warnings
cp jpeg_on.rs fmt.rs && rustfmt --edition 2021 fmt.rs && diff jpeg_on.rs fmt.rs | grep -c '^<'   # 5356 of 5476 lines
```

The fixture exhibits quoted above are `ownership_shared_counter.rgr`,
`ownership_shared_weak.rgr`, `ownership_shared_surfaces.rgr` and
`llvm_ownership_infer.rgr`, compiled with and without the flag; the runnable
probe variants only substitute `sfn m@(main)` for the free `fn main`.

## Verification, and the first round of fixes

Every measurement above re-verified on this machine (clippy 1.94.1): 1395
warnings flag-on with the table's exact per-lint counts. Two structural
changes landed alongside the verification:

**The shared-class model became the Rust default** (see
PLAN_RUST_OWNERSHIP): a bare `-l=rust` build now applies the sharing
verdict, `-rust-value-classes` restores the all-value model. The conformance
gate holds under the default, and turning it on surfaced two borrow gaps on
the serialize round trip (optional shared field mid-path, expression
receiver), both fixed.

**Ranked item 1 — `&self` receivers — turned out to be one latent bug, not
a missing feature.** The writer has carried the full machinery all along:
per-method direct-mutation detection, a same-class call graph, transitive
propagation (`methodMutatesThis`). It never fired because of a truthiness
fault: `def dm:boolean (get directMutations methodName)` binds an optional,
and `if dm` compiles to a presence check, so `false` counted as `true` and
every known method was judged mutating — 136:0 on the jpeg output. With the
bug fixed, three precision holes surfaced (each found by the fixtures):

- `itemAt items 0` is a `has_call` on the member vector, and every member
  call counted as a write. A read operator on a plain collection, string or
  buffer no longer does; the mutating operators (`push`, `set`, `insert`,
  the buffer writes…) still do, and a user-class receiver stays
  conservative — any of its methods could mutate it.
- Mutation through a collection operator was invisible in the other
  direction too: `push labels s` never appears as an `=` node. The detector
  now reads the same mutating-operator list the template engine uses for
  LHS marking.
- An uninitialized member collection carries `is_optional` on its desc, and
  "touches an optional field" forced `&mut self` — but the Rust field is a
  plain `Vec`, never `Option`. Collections are exempt; a real
  `@(optional)` object field still forces `&mut self`, because its access
  path emits `as_mut()`.

Result on the jpeg output: **41 of 136 methods now take `&self`** (getters,
`remaining()`-style readers, the pure-math kernels), `rustc -O` clean, the
image byte-identical at both gate sizes. A method that reads an optional
object field keeps `&mut self` — relaxing that needs read-context
`as_ref()` emission, which is the follow-up with the widest remaining reach.

**Also landed from the ranked list:**

- Item 2, the signature half: no `-> ()` on void functions (84 warnings),
  no `(&mut self, )` trailing comma (42 sites) — clippy falls 1395 → 1310.
- Item 7, the import half: `use std::rc::Weak;` is emitted only when a
  user class holds a `@(weak)` field.
- Thirteen unconditional `print ("DEBUG …")` statements were deleted from
  the Rust writer — they wrote to stdout on every Rust compile.

Regression coverage: `tests/fixtures/rust_receivers.rgr` +
`codegen-rust.test.ts` (receiver per method kind, push-detection, no unit
return, no trailing comma, Weak gating).

**Second round — the template-level sweep (clippy 1310 → 899):**

- **`format!` replaces the concat chains** (ranked item 5). `print`
  flattens a whole string `+` chain into one `println!` with the literals
  inlined in the format string — `println!("numbers {}", numbers.len() as
  i64)`, `println!("first name {}", names[0].clone())` — and a chain in any
  other position becomes a single `format!`. An explicit `to_string` of a
  scalar drops out ({} is already Display), which also erased the 60
  `to_string_in_format_args` warnings.
- **A literal index takes no cast.** The `(idx N)` template op emits
  `arr[0]` where the templates used to hardcode `arr[(0) as usize]` —
  341 → 34 `unnecessary_cast` warnings, the rest in range forms.
- **A Copy element read takes no clone** (`(cloneif N)`): `itemAt` and the
  `for` loop keep `.clone()` for String and struct elements and drop it
  for scalars — the 80 `clone_on_copy` warnings are gone.
- **A free `fn main` is a crate entry** (ranked item 7): when a program
  declares no `sfn m@(main)`, the writer emits `fn main()` calling the
  class-attached free main — the E0601 row is closed, and the runnable
  probes of this doc now build from the fixtures as written.

**Third round (clippy 899 → 512, 1395 at the start):**

- **`x = x + e` is `x += e`** (and `-`, `*`, `/`) when the target is a
  plain scalar path — no cell, no optional, no weak segment — and the
  right side starts from the same path; anything less plain falls through
  to the full assignment machinery. 297 `assign_op_pattern` warnings and
  273 compound sites on the jpeg output.
- **The last `return x;` of a body is the tail expression `x`.** The body
  walk marks its last statement, the return custom drops the keyword and
  the semicolon on exactly that node; a bare tail `return;` disappears,
  and the constructor ends in `me` instead of `return me;`. All 85
  `needless_return` warnings.
- **A borrowed collection or buffer of scalars is a slice** — `&[i64]`,
  `&[u8]`, `&[f64]` instead of `&Vec<T>` (clippy's `ptr_arg`), safe
  because `&Vec` coerces to `&[T]` at every call site and a
  borrowed-to-borrowed chain passes the slice straight through. String
  parameters stay `String` for now — `&str` changes every call-site
  conversion and is left with the open items.

**Still open, with the reason each is parked:**

- **Double parens (306, now the largest row).** `walkCommandList`
  parenthesizes every operator at expression depth > 1 and the templates
  add their own — but the walker parens are load-bearing: binary templates
  like `(e 1) " + " (e 2)` carry no outer parens, so dropping the walker
  pair flattens `a * (b + c)`. The fix is precedence-aware emission —
  operators declaring precedence and the walker parenthesizing only when
  the child binds looser — a design change across the template engine,
  not a template edit.
- **snake_case emission.** All 708 naming warnings sit behind
  `#![allow(non_snake_case)]`, so the payoff only lands if the allow can
  be dropped — which needs fields, methods and locals renamed together,
  and `@serialize(true)` derives its JSON keys from field names, so field
  renames must keep the serialized names stable across every target.
  A rename pass with a serialization-name indirection is its own change.
- **Hoisted loop borrows.** `chunk.borrow().data[i]` per iteration wants
  `let c = chunk.borrow();` outside the loop — but only when `chunk` is
  loop-invariant, and in the very loop the doc quotes it is reassigned
  (`chunk = chunk.next`). Needs a loop-invariance analysis, not a
  template.
- Remaining small rows: `manual_clamp` (24), literal `f64` casts (14),
  `cmp_owned` (14), residual range-form usize casts (34), `let_and_return`
  (13), the `.clone().clone()` stacks, and rustfmt-shaped text with the
  allow-header shrink as the emissions tighten.
