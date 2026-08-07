# Cross-engine comparison (post PR #541)

Measured on `333cce69` (master after
[#541](https://github.com/terotests/Ranger/pull/541)) against the same Octane v9
suites published on [zoo.js.org](https://zoo.js.org/?sort=binary_size).

```bash
bash scripts/build-engine-module.sh
bash gallery/game_engine/v2/interp/bench/zoo_octane/build-native.sh   # cpp + rust, -O3
# QuickJS 2024-01-13 and Duktape 2.7.0 built locally (see compare_engines.py)
python3 gallery/game_engine/v2/interp/bench/zoo_octane/compare_engines.py
python3 gallery/game_engine/v2/interp/bench/zoo_octane/compare_engines_finish.py
node gallery/game_engine/v2/interp/bench/native/vs_quickjs.cjs
```

Raw JSON: [`compare_results/fixed_compare.json`](./compare_results/fixed_compare.json).

Host: Intel Xeon (cloud agent), Node v22.14, g++ 13.3 `-O3 -march=native`,
rustc 1.83 `-C opt-level=3`, QuickJS 2024-01-13 (`-O2 -flto`, stripped),
Duktape 2.7.0 (`gcc -O3` + print/console extras).

---

## Binary size

| Engine | on disk | stripped | `.text` | `.rodata` |
| --- | ---: | ---: | ---: | ---: |
| **Duktape** `duk` | 601 KB | **514 KB** | 400 KB | 28 KB |
| **QuickJS** `qjs` | 1.03 MB | **1.03 MB** | 719 KB | 126 KB |
| **Ranger C++** `octane_runner` | 2.14 MB | **1.82 MB** | 1.53 MB | 36 KB |
| **Ranger Rust** `octane_runner` | 6.13 MB | **2.67 MB** | 2.04 MB | 104 KB |
| Ranger es6 module (`engine_module.cjs`) | 1.00 MB | — (JS source) | — | — |

zoo.js.org published (for orientation): QuickJS ~1.1M, Duktape ~691K.

**Takeaway:** the C++ engine binary is ~1.8× QuickJS and ~3.6× Duktape after
strip. Most of the gap is `.text` (generated interpreter + parser + value
layer). Rust is larger still. The es6 build is not a standalone embeddable
binary — it is a Node module.

---

## Speed — Octane Richards (higher is better)

### Full adaptive Octane (engines that finish cleanly)

| Engine | Richards | DeltaBlue | RegExp | Richards peak RSS |
| --- | ---: | ---: | ---: | ---: |
| Node (V8) | **56480** | 121406 | 10664 | 54 MB |
| QuickJS | **912** | 952 | 352 | 9.2 MB |
| Duktape | **404** | 487 | 274 | 9.2 MB |
| **Ranger es6** | **21.7** | 40.6 | 75.8 | **915 MB** |

zoo.js.org published: QuickJS Richards ~787, Duktape ~381, V8 ~37102 — our
machine is a bit faster than their table, ratios match.

| Ratio | Richards |
| --- | ---: |
| QuickJS / Ranger es6 | **42×** |
| Duktape / Ranger es6 | **19×** |
| Node / Ranger es6 | **2600×** |
| Ranger es6 % of zoo V8 | **0.058%** |

Rough zoo.js placement for Ranger es6 Richards (21.7): next to rust-js /
dmdscript / otto (~22–24).

### Fixed-work Richards (N iterations of `runRichards`)

Used for C++/Rust because the full adaptive harness retains cycles until RSS
hits multi-GB and times out on a 16 GB host. Score ≈ `100 × (35302 / µs)`.

| Engine | N | ms | µs/iter | Richards≈ | peak RSS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Node | 20 | 9 | 450 | ~7845 | 52 MB |
| QuickJS | 20 | 79 | 3950 | ~894 | 8.1 MB |
| Duktape | 20 | 174 | 8700 | ~406 | 8.1 MB |
| Ranger es6 | 20 | 4944 | 247200 | ~14.3 | 552 MB |
| **Ranger C++ `-O3`** | **5** | 6787 | 1.36e6 | **~2.6** | **6.4 GB** |
| **Ranger Rust `-O3`** | **5** | 4285 | 8.57e5 | **~4.1** | **6.4 GB** |

| Ratio vs QuickJS (fixed) | |
| --- | ---: |
| QJS / Ranger es6 | ~63× |
| QJS / Ranger Rust | ~217× |
| QJS / Ranger C++ | ~344× |

Rust beats C++ on this object-heavy path (~1.6×); both are far behind the es6
build running on V8’s nursery GC.

---

## Speed — microbenchmarks vs QuickJS

From `native/vs_quickjs.cjs` (seven bodies; ms/run, lower is faster):

| case | raw Node | raw QuickJS | eng/ES6 | eng/C++ | ES6/QJS | C++/QJS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| loop | 0.269 | 0.370 | 15.2 | 10.7 | 41× | 29× |
| fib | 0.221 | 0.418 | 18.3 | 16.0 | 44× | 38× |
| strcat | 0.260 | 6.188 | 6.27 | 5.98 | **1.0×** | **1.0×** |
| array | 0.728 | 1.320 | 24.9 | 13.3 | 19× | 10× |
| object | 1.202 | 2.129 | 27.5 | 31.4 | 13× | 15× |
| method | 1.129 | 2.488 | 45.5 | 38.9 | 18× | 16× |
| regex | 1.052 | 3.848 | 32.5 | 46.1 | 8× | 12× |
| **geomean** | 0.554 | 1.591 | 20.9 | 18.6 | **13.2×** | **11.7×** |

This is the PR #541 story: C++/QuickJS geomean is **~12×** on these
workloads (was ~63× before the E4 work). `strcat` matches QuickJS because the
slot machinery appends in place while qjs copies. Octane Richards is a
different shape — allocation + object graph — and is where the native builds
fall off.

---

## Memory

| Workload | QuickJS | Duktape | Ranger es6 | Ranger C++ | Ranger Rust |
| --- | ---: | ---: | ---: | ---: | ---: |
| Richards (adaptive) | 9 MB | 9 MB | **915 MB** | — (does not finish) | — |
| Richards fixed N=5 | — | — | — | **6.4 GB** | **6.4 GB** |
| DeltaBlue (adaptive) | 9 MB | 9 MB | **2.4 GB** | — | — |

C++/Rust use `shared_ptr` / `Rc` without a cycle collector. Richards builds
retaining task/packet graphs; five iterations already hold ~6 GB. The LLVM
target (documented in `RESULTS.md`) has a cycle collector and stays in tens of
MB — that is the fair size/memory peer for QuickJS, not the C++/Rust runners.

---

## Compatibility (Octane + language surface)

| Suite | Node | QuickJS | Duktape | Ranger es6 | Ranger C++/Rust |
| --- | :---: | :---: | :---: | :---: | :---: |
| Richards | ✓ | ✓ | ✓ | ✓ | fixed-N only (mem) |
| DeltaBlue | ✓ | ✓ | ✓ | ✓ | mem-bound |
| RegExp | ✓ | ✓ | ✓ | ✓ | checksum FAIL |
| Crypto / RayTrace / Splay / NavierStokes / EarleyBoyer | ✓ | ✓† | varies | FAIL (see RESULTS.md) | FAIL |

† QuickJS runs the full Octane set; Duktape is ES5-oriented (zoo: ~29% ES6).

Language surface vs QuickJS (from prior LLVM probe in `RESULTS.md`, still
accurate for this engine): `let` / arrow / `class` / templates / `async` /
`Symbol` / `Map` / RegExp captures / `JSON` work. **Generators, `Proxy`, and
`BigInt` work on QuickJS and not here.** So the size comparison is against a
smaller language than QuickJS.

---

## Summary

| Question | Answer after PR #541 |
| --- | --- |
| How big? | C++ stripped **1.82 MB** (QuickJS 1.03 MB, Duktape 0.51 MB) |
| How fast (micro)? | C++ **11.7×** behind QuickJS geomean; strcat at parity |
| How fast (Richards)? | es6 **21.7** (~42× behind QJS); C++/Rust ≈ **2.6 / 4.1** and memory-bound |
| How much RAM? | QJS/Duk ~9 MB; es6 ~0.9–2.4 GB on Octane; C++/Rust ~6 GB after 5 Richards iters |
| Compatible? | Richards/DeltaBlue/RegExp on es6; several Octane suites still FAIL; no generators/Proxy/BigInt |

The microbench wins from #541 are real. Closing the Octane/zoo.js gap needs a
cycle-collecting or nursery-style GC on the native value layer, not more
call-path micro-opts — Richards is dominated by retained object graphs.
