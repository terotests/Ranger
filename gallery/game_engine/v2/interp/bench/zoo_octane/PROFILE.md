# Where the LLVM engine's time goes

QuickJS runs the same benchmarks 43–109× faster **without a JIT** — it is a
bytecode interpreter, the same broad category as this engine. So the gap is not
"they compile and we don't". This is what the measurements say it actually is.

Reproduce:

```bash
# allocation counts, both engines, same loop
valgrind --tool=memcheck gallery/game_engine/v2/interp/bin/llvm/octane_runner <dir> arith.js
valgrind --tool=memcheck qjs arith.js

# instruction-level profile
valgrind --tool=callgrind --cache-sim=no --branch-sim=no <binary> <dir> arith.js
callgrind_annotate callgrind.out.<pid>
```

The binary must be built from an `.ll` with `define private` rewritten to
`define`, or every engine function is anonymous in the profile.

---

## The headline: 28 heap allocations per loop iteration, against zero

`for (var i = 0; i < N; i++) { s = s + i; }` — nothing but integer addition.

| N | LLVM engine | QuickJS |
| ---: | ---: | ---: |
| 2,000 | 156,029 allocs | 1,540 allocs |
| 4,000 | 212,029 allocs | 1,540 allocs |
| **per iteration** | **28 allocs, 741 bytes** | **0 allocs, 0 bytes** |

QuickJS's count does not move with N at all: its values are NaN-boxed 64-bit
words living in a value stack, so an arithmetic loop never reaches the
allocator. Every intermediate here is a heap `EvalValue`.

## Why 28, and not 3

`EvalValue` carries **five `[string:...]` map fields** (`objectMap`,
`getterMap`, `setterMap`, `attrFlags`, `suppressedKeys`) and **three
`[EvalValue]` array fields** (`arrayValue`, `mapVals`, `boundArgs`). Each one
is constructed eagerly with the value. So minting a single `EvalValue` — even
for the number `42` — costs:

```
1 object header + 5 string-map headers + 3 ptr-array descriptors = 9 allocations
```

The measured per-iteration counts line up with that exactly:

| | measured per iteration | = objects × field count |
| --- | ---: | --- |
| objects | 2.8 | — |
| string maps | 14.0 | 2.8 × 5 ✓ |
| ptr-arrays | 9.4 | 2.8 × 3 ✓ |

The map *storage* is already lazy (allocated on first `put`), which is why a
plain number does not also pay for entry tables. The remaining cost is the
header per field, per value.

## Instruction profile agrees

Callgrind self-cost on the same loop, grouped:

| Category | Share of instructions |
| --- | ---: |
| `malloc` / `calloc` / `free` | **~58%** |
| `strdup` / `strcmp` / `strlen` / `memcpy` | ~11% |
| refcount + field destruction (`ranger_obj_release`, `ranger_destroy_fields`, …) | ~10% |
| string-map operations (`RtSMap_get/put/has`) | ~8% |
| **actually interpreting the program** (`evaluateBinaryExpr`, `EvalValue_*`, …) | **~8%** |

Roughly **87% of the work is memory management and string plumbing; 8% is
running the JavaScript.** `ranger_strdup` alone is called ~34 times per
iteration — every variable and property name is copied on the way into and out
of a string-keyed map.

## What a pure allocator fix buys — and what it doesn't

`RtSMap` headers are a fixed size with a pure churn lifetime, so they were put
on a free list (`RANGER_SMAP_POOL=0` disables it, so both costs stay
measurable):

| Workload | pool off | pool on | change |
| --- | ---: | ---: | ---: |
| 300k-iteration arithmetic loop | 1.13 s | 0.90 s | **−20%** |
| Richards (full Octane suite) | 24.49 s | 23.99 s | −2% |

That contrast is the useful part. Removing allocator *overhead* for one of the
three allocation classes is worth 20% on a loop that does nothing but churn
maps, and almost nothing on a real benchmark, where the cost is spread over
objects, arrays, strings and the maps that do get storage. glibc's tcache
already makes same-size `malloc`/`free` cheap; the problem is not the price of
an allocation, it is **making 28 of them to add two integers**.

## Pooling the object blocks too — and why it changes almost nothing

The obvious next step is to pool the `EvalValue` blocks the same way, and it was
tried (`RANGER_OBJ_POOL=0` disables it): a per-size free list in
`ranger_obj_new` / `ranger_obj_release`, so a released block is reused instead of
returned to libc.

| Configuration | 300k arithmetic loop | Richards |
| --- | ---: | ---: |
| no pools | 0.97 s | 24.25 s |
| map headers pooled | 0.87 s (**−12%**) | 23.99 s (−2%) |
| object blocks pooled | 0.99 s (**±0%**) | 23.64 s (−2.5%) |
| both | 0.85 s | — |

Allocation counts, same loop, measured under memcheck:

| | allocs per iteration |
| --- | ---: |
| no pools | 28.0 |
| both pools | 22.0 |
| QuickJS | 0 |

**glibc's tcache is already a per-size free list.** Putting another one in front
of it saves the bookkeeping around a `malloc` call, not the allocation, which is
why the object-block pool — 2.8 allocations per iteration — is worth nothing
measurable, while the map pool — 14 per iteration — is worth 12%. The gain
tracks the *number of allocations removed*, and per-allocation the saving is
tiny.

### Why a value pool cannot be pushed further without a compiler change

The version that would actually pay is recycling a whole `EvalValue` *with its
five maps and three arrays still attached*, so reuse costs zero allocations
instead of one saved out of nine. That does not work today: the generated
constructor calls `RtSMap_new_kind` for every map field on every `new`, so a
recycled block's collections are immediately overwritten. The ratio is exact in
the measurements — 14.0 maps per iteration against 2.8 objects is 5.0 fresh maps
per value, every time.

Reaching zero therefore needs one of:

- **lazy or reusable collection fields** in the emitted constructor (NULL until
  first use, or "clear if already present"), which is a backend change; or
- **explicit acquire/release in the engine**, which means hand-managing
  lifetimes that reference counting already manages, correctly only on the
  native targets, with use-after-free as the failure mode.

And the ceiling is bounded either way: allocation plus refcounting is ~68% of
instructions, so removing *all* of it makes this loop ~3× faster. QuickJS is
43× ahead. Pooling is worth doing; it is not the road to parity. Not creating a
value object for a number is.

## The engine's own value pool — the one thing that does work

`EvalValue` already caches integers 0–4095 (`EvalConstPool.smallInt`,
`EvalValue.rgr:1294`): 4096 instances built once and shared, because a number
is immutable so one instance serves the whole program. That is a value pool, and
it gives the cleanest measurement in this file — two loops doing identical work,
differing only in whether the result lands in the cache:

| 300,000 iterations | elapsed | objects allocated |
| --- | ---: | ---: |
| `s = i + 1` — result < 4096, **hits the pool** | 0.29 s | 4,787 |
| `s = i + 1000000` — **misses** | 0.62 s | 604,787 |

**2.1× and 600,000 allocations removed.** A hit skips all nine allocations for
that value, which is why it beats the allocator-level pools above by an order of
magnitude — those only make one of the nine cheaper.

### Widening it is not the lever

The obvious follow-up, 4096 → 65536, was tried and is a clear loss:

| | trivial script | Richards |
| --- | --- | --- |
| pool 4096 | 0.01 s / 10.1 MB | 24.25 s / 31.5 MB |
| pool 65536 | **0.09 s / 72.6 MB** | 23.35 s / **96.1 MB** |

−3.7% on Richards for **+64 MB of baseline memory and a 9× slower startup**, and
both microbenchmarks got *slower* — the eager fill dominates and the working set
no longer fits the cache. Reverted.

The hits come from hot *small* values — indices, loop counters, lengths, char
codes — which 4096 already covers. Accumulators grow without bound and no cache
of any size catches them.

### A literal was being re-allocated on every visit

Isolating the loop header exposed something simpler than a representation
problem. `for (var i = 0; i < 100000; i++) { }` — an **empty** body — allocated
2 objects per iteration. Hoisting the bound to a variable removed one of them:

| same 100,000 iterations | objects | elapsed |
| --- | ---: | ---: |
| `i < 100000` (literal) | 200,641 | 0.16 s |
| `var B = 100000; i < B` | 100,649 | 0.11 s |

Half the allocations in an empty loop were the constant `100000` being rebuilt
every time the condition was evaluated. The literal's *text→double parse* was
already memoised on the AST node; its value object was not, so any literal
outside the 4096-entry pool minted a fresh `EvalValue` per visit.

Interning it on the node (`TSNode.numCacheId` indexing a table in
`EvalConstPool`, since an `EvalValue` field there would be a type cycle) is
safe for exactly the reason `smallInts` is safe — a literal is a constant and a
number is immutable:

| | before | after |
| --- | ---: | ---: |
| empty 100k loop | 200,641 objects / 0.16 s | **100,641 / 0.11 s** |
| `s = s + i`, 100k | 300,570 objects | **200,570** |
| 300k arithmetic loop | 0.85 s | **0.68 s** (−20%) |
| `s = f(s)`, 20k | 0.11 s | **0.08 s** (−27%) |
| Richards | 24.25 s | 23.44 s |
| DeltaBlue | — | 50.41 s |

Richards barely moves because its literals are mostly small and the pool
already answered them; the gain is real wherever a program's constants sit
above 4096, which in an empty loop was *half of all allocation*.

### What that implies

A pool miss currently costs **nine** allocations. If a miss cost **one** — the
collection fields allocated lazily instead of eagerly — the miss penalty would
drop ~9× and no wider pool would be needed at all. That is a backend change, not
a change to the value representation, and it is cheaper than either.

A general "recycle any value" pool is a different proposition: it needs to know
when a value dies, which reference counting already knows — and that path is
exactly the allocator-level pool measured above at ~0–2.5%.

## Getting the last allocation to zero

After literal interning, `for (var i = 0; i < 100000; i++) { }` allocates
exactly one object per iteration — the incremented `i`. The binding is the same
one every time and always holds a number, so nothing needs allocating: writing
the new number into the existing value would do.

The catch is aliasing. `var a = i; i++;` must not change `a`, so an in-place
update is only legal when the value is **uniquely owned** — and reference
counting already knows that. `RangerMem.refCount(v)` was added to check whether
the signal is usable, and it is:

| | rc |
| --- | ---: |
| only the scope binding holds the value | **3** |
| binding plus one alias | **5** |

The two cases separate. What is *not* usable is the threshold: the baseline is
3 rather than 1 because the enclosing function's own locals (`cur`, `c`) each
retain, so the number depends on the shape of whichever function performs the
test. Hard-coding "3 means unique" would silently become wrong the next time
that function is edited, and the failure mode is a mutated value that another
binding can still see — silent corruption in a JavaScript engine. That check is
therefore deliberately **not** shipped.

There is a form that needs no calibration at all: run the test **inside the
runtime**, reading the value straight out of the scope's binding map. No Ranger
local holds it there, so `rc == 1` is unambiguous — the map's own reference and
nothing else. `RangerMem.mapValueUnique(m, key)` does exactly that, and a
statement-position `i++` on a uniquely-owned number binding now writes
`numberValue` in place instead of minting a replacement.

The safety cases fall out of the reference count rather than needing to be
enumerated: a pooled small integer and an interned literal each carry a second
reference from the pool array, and a value a second binding aliases carries one
from that binding, so all three take the allocating path. Verified against Node:

```js
var i = 100000; var a = i; i++;   // a stays 100000
var x = 5;      var y = x; x++;   // y stays 5, and 2+3 is still 5
var o = {v: 200000}; var p = o.v; o.v++;
var arr = [300000]; var e = arr[0]; arr[0]++;
function f(n) { n++; return n; }  // the caller's binding is untouched
```

All six agree with Node exactly.

| | at the start | + literal interning | + in-place `++` |
| --- | ---: | ---: | ---: |
| empty 100k loop | 200,641 objects / 0.16 s | 100,641 / 0.11 s | **4,737 / 0.04 s** |
| `s = s + i`, 100k | 300,570 objects | 200,570 | **104,666** |
| 300k arithmetic loop | 0.97 s | 0.68 s | **0.46 s** |
| Richards | 24.25 s | 23.44 s | 23.24 s |

**An empty loop now allocates nothing per iteration** — 4,737 objects is the
fixed cost of loading the script — and the arithmetic loop is 2.1× faster than
where this section started. The one allocation left in `s = s + i` is the sum
itself: a binary expression has no destination binding to write into.

## Where the real headroom is, in rough order

1. **Do not allocate a heap value per intermediate.** A NaN-boxed or tagged
   immediate for numbers, booleans, `null` and `undefined` removes most of the
   2.8 objects per iteration and all 8 of their per-field allocations. This is
   the single change that separates the two engines.
2. **Allocate the eight collection fields lazily.** An `EvalValue` that is a
   number never touches `objectMap` or `boundArgs`. NULL until first use would
   cut 8 allocations per value down to 0 for primitives, without touching the
   value representation — and it is what makes a small-integer pool *miss*
   affordable, which is why widening the pool is not a substitute for it.
3. **Intern property and variable names.** ~34 `strdup` calls per iteration
   exist because keys are copied strings; interned atoms (what QuickJS does)
   turn map lookups into pointer compares and delete the `strdup`/`strcmp`
   traffic — about 19% of instructions between them.
4. **Bytecode instead of AST walking.** This is the classic answer and it is
   real, but it is fourth here: at ~8% of instructions, making interpretation
   itself infinitely fast would leave the engine within ~8% of where it is.
