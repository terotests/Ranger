# Zoo.js / Octane results — Ranger TS engine

Measured against the same Octane v9 suites published on
[zoo.js.org](https://zoo.js.org/?arch=amd64&v8=true) (`arch=amd64`, V8 columns).

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

| Suite | Engine score | Same-machine Node | % of Node | zoo.js V8 (amd64) | % of zoo V8 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Richards | 59.0 | 55212 | **0.107%** | 37102 | **0.159%** |
| DeltaBlue | 110 | 127859 | **0.086%** | 106675 | **0.103%** |
| RegExp | 75.8 | 10830 | **0.700%** | 9499 | **0.798%** |
| **geo mean (these 3)** | **78.9** | 42442 | **0.186%** | — | — |

Rough zoo.js placement (Richards): near sval (~28) / dscriptcpp (~47) / eval5 (~48).

---

## C++ target (`g++ -O3` native binary)

Ranger compile: `-l=cpp` → `octane_runner`, built with `g++ -O3 -march=native`.

| Suite | Engine score | Same-machine Node | % of Node | zoo.js V8 (amd64) | % of zoo V8 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Richards | 21.7 | 55212 | **0.039%** | 37102 | **0.058%** |
| DeltaBlue | 14.9 | 127859 | **0.012%** | 106675 | **0.014%** |
| RegExp | FAIL | 10830 | — | 9499 | — (`Wrong checksum.`) |
| **geo mean (passing 2)** | **18.0** | — | **0.042%**† | — | — |

† geo mean % of Node uses Node’s geo over the same three suite keys the harness
prints; RegExp contributes no engine value.

Rough zoo.js placement (Richards): next to rust-js / dmdscript / otto (~22–24).

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
