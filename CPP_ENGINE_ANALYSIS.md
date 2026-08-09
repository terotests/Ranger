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

## What to do next, ranked by return over difficulty

1. **Unwind the by-value cascade.** Make the leaf sinks (`toPrimitiveDefault`,
   `toStringOf`, and whatever else the ownership analysis marks as owning) take
   `const&`, and the 84 by-value parameters should collapse toward zero on their
   own. Purely mechanical, no representation change, and it removes two refcount
   round-trips from every binary operation. **Do this one.**
2. **Drop the duplicated `numberValue`.** Small, contained, saves 8 bytes per
   value and a store per number.
3. **Shorten the property chase.** Hoisting the property bag into `EvHandle`, or
   letting `EvalValue_Object` hold the map inline instead of behind a second
   `rg_ptr`, removes one or two dependent loads from the hottest path in the
   engine.
4. **Intern property names.** An atom table turns every key hash into an integer
   compare and is the precondition for any inline cache. Large, but it is the
   step QuickJS's speed actually rests on.
5. **Immediate values.** The real answer, and a rewrite of the engine's value
   model that would touch every target. Not a C++ fix — a design change. Do not
   start here.

The honest summary: items 1–3 are tractable and worth maybe a few percent each;
item 4 is a project; item 5 is the one that would close the QuickJS gap, and it
is not a C++ problem at all.
