# Where the engine actually loses to QuickJS (2026-08-14)

Resolves the apparent contradiction between the two benchmark suites, and
corrects the hypothesis that the cycle leak explained it.

## The contradiction that wasn't

Two suites appeared to disagree by 13× about the same engine:

| | micro (`vs_quickjs.cjs`) | rangerjs (`bench-cpu.sh`) |
|---|---|---|
| object case vs qjs | **4.8×** | **64×** |

They share a name, not a workload:

```js
// micro object.js -- ONE object, 20k string-keyed writes, one for-in
var o = {};
for (var i = 0; i < 20000; i++) { o["k" + (i % 50)] = i; }

// rangerjs 03_object_props.js -- 20k OBJECTS allocated and retained
function P(x, y, z) { this.x = x; this.y = y; this.z = z; }
for (var i = 0; i < 20000; i++) { objs.push(new P(i, i + 1, i + 2)); }
for (var r = 0; r < 40; r++) { /* 800k property read/writes */ }
```

The micro case allocates **one** object and hammers its property map. The
rangerjs case allocates **20,000** and keeps them all live. They measure
different things, so there was never a contradiction to explain.

## The pattern in the outliers

Every rangerjs case that blows past ~10× builds a large retained structure
first:

| case | vs qjs | what it allocates |
|---|---:|---|
| `03_object_props` | 64× | 20,000 objects, retained in an array |
| `12_class_dispatch` | 39× | 30,000 class instances, retained |
| `04_array_ops` | 29× | 30,000-element array, built then popped |
| `07_closures` | 13× | closures per iteration |
| `06_string_ops` | 3.5× | almost nothing |
| `11_json` | 3.9× | almost nothing |
| `10_map_set` | 4.7× | almost nothing |

The low-allocation cases sit near the micro suite's ~3.3× geomean. The gap
scales with **how much the case allocates and retains**, not with how much
work it does per object.

## The cycle collector is not the answer here

The earlier hypothesis — that these numbers were inflated by the reference
cycle leak, since `bench-cpu.sh` never passes `--gc` — does not survive
contact with the workloads:

- `new P(x, y, z)` has no back-pointers, so these graphs contain **no
  cycles** for the collector to reclaim.
- The objects are deliberately **live** for the whole measurement; a
  collector cannot free what is still referenced.
- PR #568's own table already shows this: `03_class_retained` is 13 MB both
  with and without `--gc`.

`--gc` matters enormously for `05_tree_parent_cycle` (1570 MB → 10 MB), which
is what it was built for. It is not what makes `object_props` 64×.

## What this means for the next lever

The engine's remaining gap is **allocation and per-object memory traffic**,
not the interpreter dispatch loop:

- Arithmetic and control flow are already within ~2.4× of QuickJS
  (`loop` 2.4×, and the micro geomean is 3.3×).
- Cases that merely *touch* objects are ~3–5×.
- Cases that *create* objects in bulk are 29–64×.

So the ordering of the documented levers should be revisited. Property-name
interning and shape/slot storage both reduce per-object *size* and per-access
cost, which helps — but the measurement says the first question to ask is
what one `new P(x, y, z)` costs end to end: allocation, refcount traffic, the
property bag's initial capacity, and how many separate allocations one guest
object implies.

A profile of `03_object_props` specifically (rather than of Richards, which
is the shape that has been profiled before) is the cheapest next step, using
the callgrind recipe in BYTECODE.md — build a plain `-O3` twin, since
valgrind cannot decode `-march=native` AVX-512.

## Measurement notes

- The rangerjs figures come from PR #568's branch; `rangerjs`/`bench-cpu.sh`
  are not on master.
- Octane scores on this container are quantised and cannot rank backends —
  Richards, DeltaBlue and SplayLatency all report bit-identical numbers for
  es6, C++ and Rust, which the micro suite shows differ by ~1.8×. Use fixed
  work and wall time.
- The noise floor for interleaved A/B on this container is about ±6%,
  measured from a control that provably could not benefit.
