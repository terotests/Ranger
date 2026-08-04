# Zoo.js / Octane results — Ranger TS engine

Measured against the same Octane v9 suites published on
[zoo.js.org](https://zoo.js.org/?arch=amd64&v8=true) (`arch=amd64`, V8 columns).

```bash
bash scripts/build-engine-module.sh
bash gallery/game_engine/v2/interp/bench/zoo_octane/build-native.sh
node gallery/game_engine/v2/interp/bench/zoo_octane/run.cjs \
  --targets=es6,cpp,rust richards,deltablue,regexp
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

| Suite | es6 | C++ | Rust |
| --- | ---: | ---: | ---: |
| Richards | 59.0 | 21.7 | 7.98 |
| DeltaBlue | 110 | 14.9 | 14.9 |
| RegExp | 75.8 | FAIL | FAIL |

es6 is the fastest of the three host builds here (V8 nursery vs native
`malloc` / refcount cost for `EvalValue`), matching the story in
`TS_ENGINE_PERF.md`.
