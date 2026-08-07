# Zoo.js / Octane results — Ranger TS engine

Measured against the same Octane v9 suites published on
[zoo.js.org](https://zoo.js.org/?arch=amd64&v8=true) (`arch=amd64`, V8 columns).

> **Post-PR #541 cross-engine table** (QuickJS, Duktape, C++/Rust binary size,
> RSS, microbench): see [`COMPARE.md`](./COMPARE.md).

```bash
bash scripts/build-engine-module.sh
bash gallery/game_engine/v2/interp/bench/zoo_octane/build-native.sh
node gallery/game_engine/v2/interp/bench/zoo_octane/run.cjs \
  --targets=es6,cpp,rust,llvm richards,deltablue,regexp
```

Octane scores are higher-is-faster throughput numbers. Percentages are
`engine / baseline × 100`. Same-machine Node is the fair ratio; zoo V8 is for
table placement against the published amd64 column.

Live `Date` uses a relative wall clock (`liveClock`) so readings stay inside
32-bit `truncD` on C++ (absolute epoch ms overflow there).

---

## es6 target (ComponentEngine as Node module)

Ranger compile: `-es6 -nodemodule` → `engine_module.cjs`, run in-process under Node.

Re-measured on `333cce69` (after PR #541), same machine as `COMPARE.md`
(Node Richards 56480):

| Suite | Engine score | Same-machine Node | % of Node | zoo.js V8 (amd64) | % of zoo V8 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Richards | 21.7 | 56480 | **0.038%** | 37102 | **0.058%** |
| DeltaBlue | 40.6 | 121406 | **0.033%** | 106675 | **0.038%** |
| RegExp | 75.8 | 10664 | **0.711%** | 9499 | **0.798%** |
| **geo mean (these 3)** | **40.5** | 41800 | **0.097%** | — | — |

Rough zoo.js placement (Richards): next to rust-js / dmdscript / otto (~22–24).
Peak RSS on this run: Richards ~915 MB, DeltaBlue ~2.4 GB, RegExp ~2.1 GB.

Earlier table on this page (Richards 59 / DeltaBlue 110) was from a prior
revision; RegExp is unchanged at 75.8.

---

## C++ target (`g++ -O3` native binary)

Ranger compile: `-l=cpp` → `octane_runner`, built with `g++ -O3 -march=native`.

**Post-PR #541 note:** full adaptive Octane no longer finishes on a 16 GB host —
`shared_ptr` retains object cycles and RSS hits multi-GB (5 fixed Richards
iterations → ~6.4 GB, score ≈ **2.6**). See [`COMPARE.md`](./COMPARE.md).
Historical adaptive scores below are kept for reference from an earlier run:

| Suite | Engine score | Same-machine Node | % of Node | zoo.js V8 (amd64) | % of zoo V8 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Richards | 21.7† | 55212 | **0.039%** | 37102 | **0.058%** |
| DeltaBlue | 14.9† | 127859 | **0.012%** | 106675 | **0.014%** |
| RegExp | FAIL | 10830 | — | 9499 | — (`Wrong checksum.`) |
| **geo mean (passing 2)** | **18.0** | — | **0.042%**†† | — | — |

† historical adaptive scores (pre-leak / different host conditions).
†† geo mean % of Node uses Node’s geo over the same three suite keys the harness
prints; RegExp contributes no engine value.

Stripped binary size now: **1.82 MB** (see COMPARE.md vs QuickJS 1.03 MB /
Duktape 0.51 MB).

---

## Rust target (`rustc -O` native binary)

Ranger compile: `-l=rust` → `octane_runner`, built with `rustc -C opt-level=3`.

| Suite | Engine score | Same-machine Node | % of Node | zoo.js V8 (amd64) | % of zoo V8 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Richards | 7.98 | 55212 | **0.014%** | 37102 | **0.022%** |
| DeltaBlue | 14.9 | 127859 | **0.012%** | 106675 | **0.014%** |
| RegExp | FAIL | 10830 | — | 9499 | — (`Wrong checksum.`) |
| **geo mean (passing 2)** | **10.9** | — | **0.026%**† | — | — |

Rough zoo.js placement (Richards): among the slowest scoring interpreters
(js-interpreter ~11, yavashark ~15).

---

## LLVM target (`clang -O2` native binary)

Ranger compile: `-l=llvm -target=native-linux-gnu` → `octane_runner.ll`, linked
with `runtime/ranger_rt.c`, `runtime/ranger_mem.c` and `runtime/ranger_buffer.c`.
This is the only target with reference counting plus a cycle collector, so it is
also the only one whose heap stays flat across a whole benchmark.

Measured in the same run as the Node baseline below (a different machine from
the es6/C++/Rust tables above, so compare the **% of Node** column, not the raw
Node numbers).

| Suite | Engine score | Same-machine Node | % of Node | zoo.js V8 (amd64) | % of zoo V8 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Richards | 7.98 | 23585 | **0.034%** | 37102 | **0.022%** |
| DeltaBlue | 5.50 | 44411 | **0.012%** | 106675 | **0.005%** |
| Crypto | FAIL | 22864 | — | 39289 | — (`Crypto operation failed`) |
| NavierStokes | FAIL | 27372 | — | 38655 | — (heap grows past 7 GB) |
| **geo mean (passing 2)** | **6.62** | 28454 | **0.023%** | — | — |

Heap behaviour, `RANGER_MEM_TRACE=200000` on richards: 16 MB → 28 MB across
2.8 M object allocations, dropping back on each collection. Before the string
and cycle work in this branch the same run grew 780 MB per 50,000 allocations
and never finished.

Crypto now runs to completion (~34 s) and returns a wrong result rather than
crashing; it is the same engine bug the C++ and Rust targets hit. NavierStokes
is the one suite still bounded by memory rather than correctness.

---

## LLVM target vs QuickJS

Both are single self-contained interpreter binaries linking nothing but libc
and libm, which makes them directly comparable on size. QuickJS here is the
distro build, version 2021-03-27.

```bash
qjs gallery/game_engine/v2/interp/bench/zoo_octane/richards.js
gallery/game_engine/v2/interp/bin/llvm/octane_runner <dir> richards.js
```

### Binary size — the LLVM build is *smaller*

| | on disk | stripped | `.text` | `.rodata` |
| --- | ---: | ---: | ---: | ---: |
| `octane_runner` (LLVM) | 906,016 B | 895,616 B | 799,810 B | 39,392 B |
| `qjs` | 1,034,552 B | 1,034,552 B | 704,402 B | 124,704 B |
| **difference** | **−128,536 B (−12.4%)** | −13.4% | +95 KB | −85 KB |

The split is worth reading: our *code* is ~95 KB bigger, and QuickJS carries
~85 KB more read-only data (Unicode tables, its atom table). A tree-walking
interpreter generated from Ranger source lands in the same size class as a
hand-written C bytecode VM — slightly under it.

### Speed — QuickJS is 40–110× faster

Octane scores, higher is better. Same machine, same run.

| Suite | LLVM | QuickJS | Node | QuickJS / LLVM |
| --- | ---: | ---: | ---: | ---: |
| Richards | 7.98 | 611 | 19861 | **77×** |
| DeltaBlue | 5.50 | 602 | 51162 | **109×** |

A fixed-work microbenchmark (fib(24), a 300k-iteration arithmetic loop, 200k
property stores, 20k string concatenations) removes the adaptive harness and
gives the narrowest honest gap:

| | elapsed |
| --- | ---: |
| LLVM | 2448 ms |
| QuickJS | 57 ms |
| ratio | **43×** |

That is the expected shape: QuickJS compiles to bytecode and interprets that,
while this engine walks the AST and boxes every intermediate as an `EvalValue`.

### Memory and startup

Peak RSS:

| Workload | LLVM | QuickJS |
| --- | ---: | ---: |
| trivial script | 10.1 MB | 10.1 MB |
| Richards | 31.2 MB | 10.1 MB |
| DeltaBlue | 123.8 MB | 10.1 MB |

Startup on a trivial script is under 10 ms for both. Richards is now flat
enough to finish in 31 MB; DeltaBlue still climbs to 124 MB, so its allocation
shape has a leak the current collector does not reach.

### Language coverage (probe, not a claim of completeness)

`let` / arrow / `class` / template literals / `async function` / `Symbol` /
`Map` / RegExp captures / `JSON` work on both. **Generators, `Proxy` and
`BigInt` work on QuickJS and not here** — so the size comparison above is
between a smaller language and a complete one, and the ~12% size advantage
would narrow if those were added.

---

## Suites that did not produce a valid score (any target)

| Suite | Outcome |
| --- | --- |
| Crypto | Wrong crypto result / `Unknown type: this` on parse. |
| RayTrace | `Scene rendered incorrectly` (after `new ns.Deep.C()` fix). |
| Splay | `Key not found`. |
| NavierStokes | `checksum failed`. |
| EarleyBoyer | Parse errors (octal / Scheme-compiled JS). |
| RegExp on C++/Rust | Runs on es6; native regex checksum mismatch. |

---

## Target comparison (passing suites only)

| Suite | es6 | C++ | Rust | LLVM |
| --- | ---: | ---: | ---: | ---: |
| Richards | 59.0 | 21.7 | 7.98 | 7.98 |
| DeltaBlue | 110 | 14.9 | 14.9 | 5.50 |
| RegExp | 75.8 | FAIL | FAIL | not run |

The LLVM column was measured on a different machine from the other three, so
read it against its own **% of Node** row above rather than against these
absolute scores.

es6 is the fastest of the three host builds here (V8 nursery vs native
`malloc` / refcount cost for `EvalValue`), matching the story in
`TS_ENGINE_PERF.md`.
