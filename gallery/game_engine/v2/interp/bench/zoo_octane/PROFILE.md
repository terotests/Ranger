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

## Where the real headroom is, in rough order

1. **Do not allocate a heap value per intermediate.** A NaN-boxed or tagged
   immediate for numbers, booleans, `null` and `undefined` removes most of the
   2.8 objects per iteration and all 8 of their per-field allocations. This is
   the single change that separates the two engines.
2. **Allocate the eight collection fields lazily.** An `EvalValue` that is a
   number never touches `objectMap` or `boundArgs`. NULL until first use would
   cut 8 allocations per value down to 0 for primitives, without touching the
   value representation.
3. **Intern property and variable names.** ~34 `strdup` calls per iteration
   exist because keys are copied strings; interned atoms (what QuickJS does)
   turn map lookups into pointer compares and delete the `strdup`/`strcmp`
   traffic — about 19% of instructions between them.
4. **Bytecode instead of AST walking.** This is the classic answer and it is
   real, but it is fourth here: at ~8% of instructions, making interpretation
   itself infinitely fast would leave the engine within ~8% of where it is.
