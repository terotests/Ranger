# Why the C++ engine is not faster than it is

A reading of the generated `octane_runner.cpp`, not a benchmark hunt. The
question that started it was "why does the JavaScript build look fastest now?".
The first answer is that it is not.

## The premise was wrong: C++ is the fastest target

The es6 runner pays **112 ms of fixed startup** — node itself plus a 1.15 MB
CommonJS module — against 3.2 ms for the C++ binary and 2.8 ms for Rust. Every
short benchmark carries that. Subtracting it from the same-host interleaved
fixed-work runs:

| script | es6 work | cpp work | rust work | es6 / cpp |
| --- | ---: | ---: | ---: | ---: |
| arith_big | 502 ms | 283 ms | 304 ms | 1.78× |
| prop | 112 | 40 | 42 | 2.80× |
| call | 89 | 31 | 32 | 2.90× |
| method | 1196 | 830 | 841 | 1.44× |
| typemix | 917 | 569 | 611 | 1.61× |
| pool_hit | 463 | 280 | 304 | 1.66× |
| pool_miss | 497 | 276 | 301 | 1.80× |

C++ is fastest on every row. The impression comes from the Octane **score**
column, where C++ reads `0.5` because its `liveClock` is quantised on this host
— the score is unusable for C++, and `RESULTS.md` already says so. Read wall
time for C++, never the score.

The real question is therefore not "why is C++ slow" but **"why is C++ only
1.4–2.9× faster than the same interpreter running on a JIT, and 3.6× behind
QuickJS?"**

## What is already done well

Worth stating so none of it gets re-done:

- `rg_ordered_map` — vector storage plus an open-addressed index, insertion
  order preserved for JS key enumeration, and `const char*`/`string_view`
  overloads so a literal key probes without building a `std::string`.
- `-native-fast-alloc` — a thread-local size-class freelist under
  `operator new`, so an allocation is a freelist pop.
- `rg_ptr` is `std::__shared_ptr<T, __gnu_cxx::_S_single>` — **non-atomic**
  refcounts, via `-cpp-single-thread`.
- `rg_make` is `__allocate_shared`, so object and control block are **one**
  allocation.
- A small-integer pool covers 0…4095, so `EvHandle::number(42)` allocates
  nothing.
- The C++ writer already emits `const&` for parameters its ownership analysis
  proves borrowed — 267 of 351 in `ComponentEngine`.

The cheap wins are taken. What is left is representation.

## The structural cost: a JavaScript value is a heap object

Measured with a probe compiled from the generated header:

```
sizeof(r_union_EvalValue) = 24
sizeof(EvHandle)          = 40   (was 56 — see the isArray defect below)
sizeof(rg_ptr<EvHandle>)  = 16   (pointer + control pointer)
sizeof(EvPropertyBag)     = 144
```

So the number `42` is: a 16-byte fat pointer, pointing at a 40-byte heap object
carrying a refcount, whose `body` is a 24-byte variant holding
`EvalValue_Number`, **and** whose `numberValue` field holds the same double a
second time.

QuickJS's `JSValue` is **16 bytes total**, passed in registers, with int32,
double, null, undefined and boolean as immediates — no allocation, no refcount,
no indirection. Its refcount is manual (`JS_DupValue`/`JS_FreeValue`) and only
touched for heap kinds.

That single difference explains most of the remaining gap, and it also explains
why the es6 build keeps up: **the boxing is in the engine's design, not in the
C++ target**, so both builds box every value. The difference is what each
platform does with short-lived boxes — V8 bump-allocates in a nursery and a
copying collector makes dead objects free, while C++ pays a freelist pop, a
refcount round-trip, and a freelist push. V8 also brings hidden classes and
inline caches that the C++ output has no equivalent of.

### Chase depth on a property read

```
rg_ptr<EvHandle> → EvHandle → variant body → rg_ptr<EvalValue_Object>
    → EvalValue_Object → rg_ptr<EvPropertyBag> → EvPropertyBag (144 B)
    → rg_ordered_map → index_ → entries
```

Five dependent loads before the key is even hashed. QuickJS reaches a property
in about two: `JSObject` → shape/property array. Dependent loads do not
pipeline, so this is latency the optimiser cannot remove.

### Keys are strings, not atoms

Every property access hashes the key bytes (`rg_hash_bytes`, a word-at-a-time
hash — a good one). QuickJS interns every property name into a 32-bit **atom**,
so a lookup compares integers and a shape can index by atom directly. For
`o.a = o.a + 1` in a loop, QuickJS compares an int where this engine hashes a
string. The hash is fast; it is not free, and it is on the hottest path there
is.

## Defects found in the generated code

### 1. A method name collision taxed every value 16 bytes — fixed

`class EvHandle : public rg_esft<EvHandle>` — every `EvHandle` carried the
16-byte weak-pointer slot of `enable_shared_from_this`, 29% of a 56-byte object,
on all 20.5 million handles Richards mints.

The trigger: `cppNeedsSharedFromThis` gives the base class to a whole class if
**any** method uses `this` as a value. In `EvHandle` exactly one call did, and
all twelve `shared_from_this()` sites resolved to the same callee — `isArray`.
`isArray` is also a **global Ranger operator**, so `this.isArray()` could not
resolve as a plain method call and went through the operator, which needs `this`
as an object value. In the same function, `this->isBoolean()` compiles to a
direct call while `(shared_from_this())->isArray()` does a weak→shared upgrade.

`EvalValue.rgr` had already hit this and worked around it, with a comment:

```lisp
; Named isArrayValue — a global `isArray` operator blocks methods named isArray.
```

`EvHandle` had not. Renaming `EvHandle.isArray` → `isArrayValue` (87 call
sites) drops the base class: `sizeof(EvHandle)` **56 → 40**, and
`shared_from_this()` sites 12 → 7 (the rest belong to `EvalContext`).

Measured: **C++ ≈ −1%, es6 ≈ −1%** on fixed work. Real, and much smaller than
the 29% size cut suggests — because the hot values come from the small-integer
pool and are allocated once. This is worth keeping for the memory, and it is a
good example of a large-looking structural defect that is not a large speed win.

### 2. Refcounted values passed by value — 84 sites

`ComponentEngine` passes `rg_ptr<EvHandle>` **by value** in 84 parameters
against 267 by `const&`, and the by-value ones are on the hottest paths:

```cpp
rg_ptr<EvHandle> ComponentEngine::applyBinaryOp( int opK, rg_ptr<EvHandle> left, rg_ptr<EvHandle> right );
bool             ComponentEngine::looseEquals ( rg_ptr<EvHandle> left, rg_ptr<EvHandle> right );
rg_ptr<EvHandle> ComponentEngine::bcGetElem   ( rg_ptr<EvHandle> obj,  rg_ptr<EvHandle> key );
rg_ptr<EvHandle> ComponentEngine::evaluateExpr( rg_ptr<TSNode> node );
```

Every arithmetic operation therefore pays two refcount increments on entry and
two decrements on exit. This is the classic C++ anti-pattern — pass
`shared_ptr` by value only when taking ownership — and here it is generated, not
written.

`applyBinaryOp` does **not** assign its parameters, so it is not the
`set_cnt > 0` bail in `cppBorrowedObjectParam`. It is the **ownership analysis**:
`left` is passed on to `toPrimitiveDefault(rg_ptr<EvHandle> v)` and
`toStringOf(rg_ptr<EvHandle> v)`, which are themselves by-value, so the operand
counts as escaping. **A by-value sink poisons every caller transitively.** Fix
the leaves and the cascade unwinds upward on its own.

### 3. The same number stored twice

`EvHandle` holds both `r_union_EvalValue body` (whose `EvalValue_Number`
alternative carries the double) and a separate `double numberValue`. One of them
is redundant; which one can go depends on how `setNumberOf`/`slotOwned` mutate
in place.

## The ownership model, measured

A probe compiled at `-O3 -march=native` doing what the engine does — pass two
refcounted values into a function, read a field, return — 20 M iterations:

| what is passed | time | note |
| --- | ---: | --- |
| `rg_ptr<Val>` by value | **56.7 ms** | what Ranger emits for 84 parameters |
| intrusive refcount by value | 57.7 ms | QuickJS-style 8-byte handle |
| `const rg_ptr<Val>&` | **14.2 ms** | what Ranger already emits for 267 |
| `const IPtr&` (intrusive) | 14.2 ms | |
| raw `const Val*` | 14.3 ms | no refcount at all |

Three conclusions, one of which corrects what I wrote in the first draft of this
document:

1. **`const shared_ptr&` is exactly as fast as a raw pointer.** The 267
   parameters the ownership analysis already proves borrowed cost nothing. There
   is no reason to move them to raw pointers.
2. **The 84 by-value parameters cost 4×** on this pattern. That is the whole
   finding. It is not a representation problem — it is a parameter-passing
   problem, and it is exactly the rule in the reference:
   *"Vältä `shared_ptr` funktioparametrina — passaa `const shared_ptr&`."*
   Note that Ranger already uses a **non-atomic** count (`_S_single` via
   `-cpp-single-thread`), so this 4× is *without* the atomic traffic the usual
   argument rests on. The guideline holds more strongly here, not less.
3. **Switching to intrusive refcounting buys nothing.** By value it measured
   57.7 ms against `shared_ptr`'s 56.7 — no better. The cost is the refcount
   traffic itself, not the width of the handle. My earlier suggestion to adopt a
   QuickJS-style intrusive counter for speed was wrong, and this is why:
   QuickJS is not fast because its counter is intrusive, it is fast because
   **immediates never touch a counter at all.**

### Where `unique_ptr` does apply

The reference's criterion is shared lifetime — the renderer and the UI both
holding one texture. A JavaScript value referenced from two variables is exactly
that, so engine **values** must stay shared. But several things in the engine are
single-owner and pay refcounting for nothing:

- `EvPropertyBag` — owned by exactly one `EvalValue` case (144 bytes behind a
  second `rg_ptr`, and one of the five dependent loads on every property read)
- `EvFunctionCore` / `EvFunctionBinding`
- `TSNode` — the AST, owned by its tree

These are the `unique_ptr` (or plain by-value member) candidates. Inlining the
bag into the case would remove both a refcount and a dependent load.

## What newer C++ standards would actually give

The build is **already `-std=c++17`**, so most of this is available now and
unused:

- **`std::optional` — the one that matters.** It is the missing representation
  for an `<optional>` of a union, which is what blocks the property-bag
  optimisation (11.3% of es6 runtime) and which today silently narrows to case
  #1 on a missing key. This is a correctness fix and an optimisation unblock in
  one.
- **`std::variant`** — measured against the vendored `mpark::variant` on the
  engine's hottest pattern (`holds_alternative` + `get`, 100 M iterations):
  **160.0 ms vs 161.5 ms, same `sizeof` of 24**. Switch to drop a vendored
  header, not for speed.
- **Guaranteed copy elision** (C++17) is already in effect.
- **C++20** would add `[[likely]]`/`[[unlikely]]` for the hot arms of the kind
  tests and `std::span` for borrowed array views. Both modest; neither changes
  the picture.

Raising the baseline is worth doing for `std::optional` and for dropping the
polyfill. It is not worth doing in the expectation of speed.

## Is this a library or a style problem?

Largely yes, and in a way that is fixable without redesigning the engine:

- **`shared_ptr` for every value is a library choice**, and it is the expensive
  one: a 16-byte fat pointer where a raw pointer is 8, and a refcount
  round-trip on every copy. QuickJS reaches the same safety with a manual
  refcount that immediates skip entirely.
- **By-value `shared_ptr` parameters are a style violation** the writer commits
  84 times. This one is worth fixing and does not need any redesign.
- **`enable_shared_from_this` on a value type is a style problem** that a single
  method name triggered.
- **`mpark::variant` is a C++11 polyfill**, but the build is already
  `-std=c++17`. `std::variant` is available and libstdc++ optimises it directly.
  Worth measuring — not claimed here, because neither is trivially copyable when
  the alternatives hold `shared_ptr`.

What is **not** a library problem is the boxing itself. No amount of C++ tuning
turns a heap-allocated, refcounted, five-loads-deep value into a 16-byte
immediate. That is the design QuickJS chose, and it is the reason it is 3.6×
ahead.

## What static analysis should decide, and what operators should emit

Ranger's advantage over a C++ compiler is that it already knows ownership —
`ownership_kind`, `ownership_resolved`, `set_cnt`, `@(lives)`, `@(weak)`. A C++
compiler cannot prove these things across translation units; Ranger can prove
them from the whole program. Four decisions follow directly, in order of value:

1. **Borrowed ⇒ `const&`.** Already done for 267 parameters, worth 4× each.
   The 84 that miss out do so because the analysis is **transitive and
   pessimistic**: `applyBinaryOp`'s operands are marked owning only because they
   flow into `toPrimitiveDefault(rg_ptr<EvHandle> v)`, which is itself by value.
   Fixing the leaf sinks unwinds the cascade upward without touching any caller.
2. **Last use ⇒ `std::move`.** There are **zero** `std::move` in 41,584
   generated lines. C++11's implicit move on `return localName;` covers most
   returns, so the gap is at call sites: a dead local passed into an owning
   parameter copies where it could transfer. This only matters for parameters
   that genuinely take ownership — after decision 1, few remain.
3. **Single owner ⇒ no refcount.** `EvPropertyBag`, `EvFunctionCore`, `TSNode`
   have exactly one owner. `unique_ptr`, or a by-value member, removes both the
   count and a dependent load.
4. **Non-escaping ⇒ stack.** A value the analysis proves does not outlive its
   frame needs no allocation at all. This is the largest of the four and the
   hardest to prove.

**Custom operators are the mechanism.** Value lifetime is expressible as
operators with per-target templates — a `dup` / `drop` / `borrow` triple — so
the C++ target emits a refcount operation only where the analysis says one is
needed, and the es6 and Python targets emit nothing at all. That is the same
device that let `is` give twelve targets a discriminant test without any writer
learning the word "shape": put the decision in the flow, and the spelling in a
template.

## Implemented: return-only escapes no longer force a copy

Decision 1 above is now in the compiler.

The ownership analysis was already a proper interprocedural fixpoint, and it was
already right about most parameters — 267 of 351 were `const&`. The 84 that were
not traced back through `-strict-ownership`, which prints its own reasoning:

```
ownership[infer] fn applyBinaryOp:
  param 'left'  -> shared (call toPrimitive.v, call toPrimitiveDefault.v, …)
ownership[infer] fn toPrimitiveDefault:
  param 'v'     -> moved  (call toPrimitive.v)
ownership[infer] fn toPrimitive:
  param 'v'     -> shared (<return>, call callPrimitiveMethod.obj, …)
```

The chain bottoms out at `<return>`: `toPrimitive` **returns** its parameter,
which the analysis counted as an ownership transfer. That verdict then
propagated up every caller — `toPrimitiveDefault`, then `applyBinaryOp`, then
`runBytecode` — so a return three calls away made every arithmetic operation
copy both of its operands.

**A return is not an ownership transfer on a reference-counted target.** The
writer copies the handle at the `return` statement, and the caller's argument is
alive for the whole call, so nothing outlives the reference. Taking the
parameter by value does not remove that copy — it adds a second one to *every*
call, including the calls that never reach the returning path.

A store into a field or a collection is different: it genuinely outlives the
call, and still forces by value.

The change is three edits:

- `RangerAppParamDesc.escape_return_only` — true while every escape is a return.
- `recordEscape` clears it for any `via` other than `"return"` (`field`,
  `member-coll`).
- `resolveCallEscapes` propagates it across call edges — an argument stays
  return-only only if the callee's matching parameter is. Monotone
  (true → false only), so the existing fixpoint still terminates.
- `cppBorrowedObjectParam` accepts `moved`/`shared` when the flag holds.

It is kept **beside** `ownership_kind` rather than folded into it, because the
Rust writer reads `ownership_kind` to choose `&T`, where a returned borrow would
need a lifetime annotation. Rust is deliberately untouched.

### Result

| | before | after |
| --- | ---: | ---: |
| `rg_ptr` parameters by value | 123 | **83** |
| `rg_ptr` parameters by `const&` | 301 | **394** |

`applyBinaryOp`, `looseEquals`, `bcGetElem`, `toPrimitive` and
`toPrimitiveDefault` are all now `const&`:

```cpp
rg_ptr<EvHandle> ComponentEngine::applyBinaryOp( int opK,
    const rg_ptr<EvHandle>& left, const rg_ptr<EvHandle>& right );
```

Interleaved fixed-work wall time, 11 reps, min — **every row improved**:

| script | C++ | Rust |
| --- | ---: | ---: |
| arith_big | −3.2% | +1.4% |
| prop | −3.0% | −1.1% |
| call | −1.2% | −0.8% |
| method | −4.2% | +2.6% |
| typemix | −4.7% | −0.5% |
| pool_hit | −1.1% | +2.0% |
| pool_miss | −3.4% | −1.2% |

Rust is noise in both directions, which is the intended outcome. Octane
deltablue on C++ measured −0.6% min / −1.4% median over 9 reps; a 5-rep run of
the same pair had said +9.9%, which is how much the time-targeted suites move on
this host and why the fixed-work micros are the measurement.

Conformance unchanged: es6 1327/1327, C++ and Rust 1297/1303 with 0 crashes, and
`shapes.test.ts` still fails exactly its 11 pre-existing tests with no C++
codegen test affected.

## Side by side with QuickJS, at source level

Fetched `quickjs.c` / `quickjs.h` (bellard/quickjs, master) and read the same
three operations in both engines.

### The operand stack

```c
/* QuickJS */                        │  /* Ranger, generated */
JSValue *local_buf, *stack_buf, *sp; │  std::vector<rg_ptr<EvHandle>> bcStack;
```

QuickJS's operand stack is a raw pointer into `alloca`'d 16-byte **immediates**.
A push is a 16-byte store; a pop is a decrement. Ranger's is a heap `std::vector`
of **reference-counted handles**, so a push is a refcount increment plus a
capacity check and a pop is a decrement plus a possible free.

The engine already knows this matters — `bcSlotPut` keeps a parallel
`bcTags[]`/`bcNums[]` and stores numbers, booleans, `null` and `undefined`
**unboxed**, falling back to `bcStack[i] = h` only for reference kinds. That is
the right idea, applied to slots. It has not reached the operand stack.

### Adding two numbers

```c
/* QuickJS: OP_add fast path */
op1 = sp[-2]; op2 = sp[-1];
if (likely(JS_VALUE_IS_BOTH_INT(op1, op2))) {
    r = (int64_t)JS_VALUE_GET_INT(op1) + JS_VALUE_GET_INT(op2);
    sp[-2] = JS_NewInt32(ctx, r);
    sp--;
}
```

```cpp
// Ranger, after today's parameter fix
rg_ptr<EvHandle> ComponentEngine::applyBinaryOp( int opK,
    const rg_ptr<EvHandle>& left, const rg_ptr<EvHandle>& right ) {
  if ( left->isNumber() && right->isNumber() ) {
    return EvValueBridge::taggedNumber((left->numberValue + right->numberValue));
  }
```

QuickJS: two stack loads, two tag tests, one store, **no dereference, no
allocation, no refcount**. Ranger: two pointer dereferences, two variant tag
tests, two field loads, then `taggedNumber` **mints a handle** and returns a
refcounted 16-byte value. The `const&` is new today and removed two refcount
round-trips; what remains is the boxing of the *result*.

### Reading a property

```c
/* QuickJS: find_own_property */
sh = p->shape;
h  = (uintptr_t)atom & sh->prop_hash_mask;
h  = sh->hash_table[h];
while (h) {
    pr = &prop[h - 1];
    if (likely(pr->atom == atom)) { *ppr = &p->prop[h - 1]; return pr; }
    h = pr->hash_next;
}
```

```cpp
// Ranger: EvHandle::memberFastAt
if( mpark::holds_alternative<rg_ptr<EvalValue_Object>>(body) ) {
  rg_ptr<EvalValue_Object> o = mpark::get<rg_ptr<EvalValue_Object>>(body); // copy → refcount
  rg_ptr<EvPropertyBag> bag = o->properties;                               // copy → refcount
  ...
  r_union_EvalValue dv = bag->dataOrHole(key);   // 24-byte variant returned by value
  if ( false == EvalValue__ops::isHole(dv) ) {
    return EvHandle::fromBody(dv);               // mints a NEW handle
```

QuickJS compares **integers** — the atom — against a per-shape hash table and
returns a pointer into the property array. No refcount, no allocation, about
three loads.

Ranger hashes the key **bytes**, and on the way there copies two `shared_ptr`s
into locals, returns a 24-byte variant by value, and then re-boxes the result
into a fresh `EvHandle`.

### What this exposes that the parameter fix did not

Those two lines — `rg_ptr<EvalValue_Object> o = mpark::get<…>(body);` and
`rg_ptr<EvPropertyBag> bag = o->properties;` — are **local** copies, not
parameters, so today's optimisation does not touch them. Counted across the
generated file:

| local `rg_ptr` initialised from | count |
| --- | ---: |
| `mpark::get<…>` (a variant payload) | 172 |
| a field read (`x->y;`) | 195 |
| another local (`x;`) | 164 |

**531 refcount round-trips that a `const rg_ptr<T>&` binding would remove**, on
locals that are read and never reassigned. This is the same optimisation one
level down, and the same static analysis can decide it: a local that is not
reassigned, does not escape, and whose source outlives it can bind by reference.

`bcSlotPut( int i, rg_ptr<EvHandle> h )` is the matching case among the 83
parameters still passed by value. It stores `h` on exactly **one of five**
paths — the cold one — yet pays a refcount on every call, including every
number store. `const&` plus a copy at the store site would move that cost onto
the path that actually needs it. The analysis cannot see that today because
`recordEscape` does not know which branch it is in; teaching it *conditional*
escapes is the next step, and it is worth noting that this is where by-value
would remain correct-but-slower rather than wrong.

The reason not to make `const&` unconditional is real: a callee holding a
reference into a container that the callee itself then clears has a dangling
reference, and by-value protects against exactly that. Return-only escapes —
what today's change covers — cannot store at all, which is why they were safe to
flip without any new analysis.

## Ranked, honestly

1. ~~**Unwind the by-value cascade**~~ — **done**, see above. 123 by-value
   parameters down to 83, every hot signature now `const&`, C++ −1.1% to −4.7%
   on fixed work with Rust untouched.
2. **`std::optional` for optional-of-union** — fixes a silent-wrong-narrowing
   trap on C++ and unblocks the property-bag work (11.3% of es6 runtime).
   C++17 is already the baseline.
3. **Single-owner members** — inline `EvPropertyBag` into its case: one refcount
   and one dependent load off the hottest path.
4. **Drop the duplicated `numberValue`** — 8 bytes and a store per number.
5. **Intern property names as atoms** — turns every key hash into an integer
   compare and is the precondition for any inline cache. A project.
6. **Immediate values** — the one that would actually close the QuickJS gap, and
   the one thing on this list that is *not* a C++ problem. It is the engine's
   value model, it would touch every target, and it should not be started
   casually.

Items 1–4 are tractable. What this exercise mostly shows is that the expensive
part is not which smart pointer is used but **how many values are refcounted at
all** — and that is a question the static analysis can answer, not the C++
standard.
