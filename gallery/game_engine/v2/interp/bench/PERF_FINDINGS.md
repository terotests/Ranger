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

## What this means for the next lever — MEASURED, and not what I expected

My first reading of the table above was that the gap is **allocation**, since
the ratio tracks allocation volume so cleanly. That inference is **wrong**,
and the profile says so.

Callgrind on the `object_props` shape, against a control that does the same
property traffic on **one** object instead of 2,000 (plain `-O3` twin, since
valgrind cannot decode `-march=native` AVX-512):

| function | 2,000 objects | 1 object (control) |
|---|---:|---:|
| `EvAtomTable::idOf(string)` | 15.60% | **17.74%** |
| `EvHandle::tryProps()` | 11.86% | 11.60% |
| `EvPropertyBag::hasData(string)` | 5.09% | 6.37% |
| `~__shared_count` (refcount teardown) | 6.50% | 6.32% |
| `EvHandle::hasOwnData(string)` | 3.79% | 4.60% |
| `basic_string(char const*)` | 3.69% | 4.52% |
| `__memcmp_avx2_movbe` | 3.91% | 4.35% |

**The same functions dominate both, in nearly the same proportions, with
allocation removed entirely.** String→key resolution — `idOf` + `hasData` +
`hasOwnData` + `basic_string` + `memcmp` — is **32%** of instructions in the
allocating case and **38%** in the non-allocating one. Refcount teardown is
~6.4% in both.

So the allocation-heavy cases are not slow *because* they allocate. They are
slow because they perform more property accesses in total, and every property
access pays:

1. constructing a `std::string` from a literal at the call site,
2. hashing/comparing it in `EvAtomTable::idOf` to find the atom id,
3. comparing it again inside the bag (`hasData` → `memcmp`).

An atom table exists, but it is consulted **by string on every access**
rather than the name being resolved once and carried as an id.

### The lever

**Property-name interning — atom ids resolved once, carried as integers —
is the measured next step**, which is what BYTECODE.md already listed and
what this document previously deprioritised in favour of allocation. Concretely:

- resolve the atom at compile time for constant member names (the bytecode
  already has a constant pool; the name should become an id there, not a
  string), and cache it per IC site for dynamic ones;
- key `EvPropertyBag` by id so the bag probe is an integer compare rather
  than `memcmp`;
- stop materialising `std::string` at member-access call sites.

Refcount teardown (~6.4%) is the second term and is the borrowed-handle
discipline already noted in BYTECODE.md.

Allocation cost is real but it is **not** the dominant term, and the
`03_object_props` 64× is not evidence for it.

## What was actually done, and what it bought

Acting on the above:

| change | result |
|---|---|
| thread the pooled atom id into the VM's member **store** op | **no measurable effect** — `idOf` stayed at 15.8%. Kept because it is correct, but it was not the cost. |
| `receiverKind` stops searching for `__…__` markers (one monotone bit) | **−17.8%** wall clock |
| the same bit for `isProxyValue`, `isDataViewValue`, `isArrayBufferValue`, `argMapName` | **−23.8%** cumulative |
| `hasProto`/`protoOf` read the prototype without materialising the bag optional | **+3.3% SLOWER — reverted** |

Cumulative on the `object_props` shape: instructions 825,770,714 →
617,330,101 (−25.2%), wall clock 9320 ms → 7105 ms (−23.8%), interleaved
best-of-5 with a plain `-O3` binary on both sides and identical output.

The reverted attempt is worth recording so nobody retries it: removing the
optional looked like a pure win, but `protoBody` had to return an
`EvalValue` **by value**, and that is a twelve-alternative variant with
`rg_ptr` members — so it traded one bag-pointer copy for a whole variant
copy. `tryProps` duly vanished from the profile and the program got slower.
Instruction count went *up* 0.9% too, so both signals agreed.

### Still on the table

`EvAtomTable::idOf` is 11.2% and `tryProps` ~10%, so the original lever is
only partly collected. What remains is the harder half: interning names at
the *call sites* so `idOf` is never reached on a hot path, and giving
`tryProps` a return shape that does not copy. The cheap wins — the ones a
monotone bit could answer — are taken.

## Measurement notes

- The rangerjs figures come from PR #568's branch; `rangerjs`/`bench-cpu.sh`
  are not on master.
- Octane scores on this container are quantised and cannot rank backends —
  Richards, DeltaBlue and SplayLatency all report bit-identical numbers for
  es6, C++ and Rust, which the micro suite shows differ by ~1.8×. Use fixed
  work and wall time.
- The noise floor for interleaved A/B on this container is about ±6%,
  measured from a control that provably could not benefit.
