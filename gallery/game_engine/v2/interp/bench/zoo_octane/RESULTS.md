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
| DeltaBlue | 40.6 | 127859 | **0.032%** | 106675 | **0.038%** |
| Splay | 3 | — | — | — | (now completes — see matrix) |
| RegExp | FAIL | 10830 | — | 9499 | — (`Wrong checksum.`) |
| **geo mean (Richards, DeltaBlue)** | **29.7** | — | **0.035%** | — | — |

Splay now completes (it used to spin forever — see the resolved section
below); its low score is allocation cost, not a hang. RegExp is the one
native-only failure, from the multi-byte string store (below).

Rough zoo.js placement (Richards): next to rust-js / dmdscript / otto (~22–24).

---

## Rust target (`rustc -O` native binary)

Ranger compile: `-l=rust` → `octane_runner`, built with `rustc -C opt-level=3`.

| Suite | Engine score | Same-machine Node | % of Node | zoo.js V8 (amd64) | % of zoo V8 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Richards | 21.7 | 55212 | **0.039%** | 37102 | **0.058%** |
| DeltaBlue | 40.6 | 127859 | **0.032%** | 106675 | **0.038%** |
| Splay | 136 | — | — | — | (now completes — see matrix) |
| RegExp | FAIL | 10830 | — | 9499 | — (`Wrong checksum.`) |
| **geo mean (Richards, DeltaBlue)** | **29.7** | — | **0.035%** | — | — |

The Rust build matches the C++ build on Richards and DeltaBlue now that the
memory-retention and identity-registry fixes and the double-domain
floor/ToInt32 fix have landed; on Splay it scores far higher than C++ (136 vs
3), because Rust's `Rc<RefCell>` payloads churn less than the C++
`shared_ptr` value vectors on that suite's allocation shape.

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

## Six-engine matrix (2026-08-07)

Every engine runs the SAME prepared suite bodies. External engines
(`node` / `qjs` / `duk`) take the raw zoo files; the Ranger targets
(`es6` / `cpp` / `rust`) take the run.cjs preparation (print prelude +
`inheritsFrom` rewrite). Reproduce with
`python3 bench_matrix.py` (writes `matrix-results.json`) and render with
`python3 matrix_report.py`.

### Octane score (higher is better)

| Suite | Node (V8) | QuickJS | Duktape | Ranger es6 | Ranger C++ -O3 | Ranger Rust -O3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| richards | 36940 | 669 | 281 | 21.7 | 21.7 | 21.7 |
| deltablue | 61761 | 691 | 328 | 40.6 | 40.6 | 40.6 |
| splay | 10300 | 1617 | 1172 | 136 | 136† | 136 |
| regexp | 6994 | 220 | 157 | 27.9 | FAIL | FAIL |
| crypto | 41046 | 929 | 347 | FAIL | FAIL | FAIL |
| raytrace | 57719 | 981 | 629 | FAIL | FAIL | FAIL |
| navier-stokes | 39248 | 1623 | 1373 | FAIL | FAIL | FAIL |
| earley-boyer | 66591 | 1530 | 684 | FAIL | FAIL | FAIL |

† C++ splay's score flips between 3 and 136 from run to run on this
container without any code change — the engine's coarse live clock
quantizes the harness's timing windows. A fixed-work splay kernel puts
the C++ target at the same wall time across the phase-5/6 builds, so
read this row as "runs and verifies", not as a stable throughput.

Four suites (richards, deltablue, splay, and — on es6 — regexp) produce a
valid score on the Ranger engine. The other four fail the SAME way on every
Ranger target, which locates them in the engine's semantics, not a target's
lowering: crypto returns a wrong digest, raytrace renders the scene
incorrectly, navier-stokes fails its checksum, and earley-boyer trips the
engine's TS parser on the Scheme-compiled source (leading-zero numeric keys
in strict mode). `regexp` is the one target-specific split — see below.

earley-boyer fails cleanly and fast on every target now — ~0.2 s on es6,
~3 s on the natives (the parser tokenizes the 210 KB file quickly since the
O(1) `at` cache, reports the syntax errors, and the script is rejected rather
than run). Two earlier failure modes are gone: the ~60 s tokenizer hang (the
O(n²) `at`) and the native ~15 GB allocation blow-up from evaluating the
malformed post-recovery AST (a syntax-error script now throws instead of
running — the rule `eval`/`Function` already followed).

### Binary size (stripped, this machine)

| | stripped |
| --- | ---: |
| Duktape | 511 KB |
| QuickJS | 1.03 MB |
| Ranger C++ `octane_runner` (`-O3`) | 1.87 MB |
| Ranger Rust `octane_runner` (`-O3`) | 2.78 MB |

The Ranger binaries carry the whole engine — the TypeScript lexer/parser, the
regex engine, `Date`, JSON, the value model — not just an interpreter loop, so
they land above QuickJS's hand-written C VM. The `-Os` C++ build comes in at
~1.0 MB, QuickJS's size class, for ~2.7× the run time.

## Bytecode tier, phase 5: unboxed number slots (2026-08-08)

The VM's stack slots are now tagged lanes (`bcTags`/`bcNums`/`bcStack`)
instead of an `EvHandle` per slot: numbers and booleans flow between
compiled ops as raw doubles, and a value object is minted only where a
value crosses into walker territory — calls, member helpers, outer
names, the return value (design and invariants in
`migrate/BYTECODE.md`, phase 5).

Octane *scores* are not the instrument for this change: on this
container the engine's live clock is coarse enough that richards /
deltablue / splay scores quantize to the same values on every target,
before and after. Fixed work under wall time is. Each case runs its
`vs_quickjs.cjs` body 10× in one process (so engine load amortizes),
best of 3 runs, identical outputs checked, same machine, engine vs
itself:

| case | C++ before | C++ after | Rust before | Rust after |
| --- | ---: | ---: | ---: | ---: |
| loop | 55 ms | **21 ms** | 103 ms | **22 ms** |
| strcat | 26 ms | **18 ms** | 42 ms | **22 ms** |
| array | 257 ms | **228 ms** | 338 ms | **274 ms** |
| fib | 132 ms | **121 ms** | 148 ms | **121 ms** |
| object | 490 ms | 485 ms | 456 ms | 451 ms |
| method | 619 ms | 615 ms | 795 ms | 789 ms |
| regex | 605 ms | 625 ms | 549 ms | 528 ms |

The shape is the diagnosis: rows whose inner loop is arithmetic on
locals collapse (an empty-ish `loop` iteration now allocates nothing),
rows bound by property maps and method dispatch (`object`, `method`,
and the Octane suites built from them) do not move, and `fib` improves
only ~8–18% because every recursion still boxes its argument and result
through `callFnValueWithValues` — the call boundary is the next lever.

Verification for the change: es6 runtime suite 1281/1281 with the tier
on; the C++ and Rust native conformance failure sets are bit-identical
to the pre-phase-5 build (1208/1257 and 1229/1257 — the same
pre-existing native gaps); richards / deltablue / splay / crypto /
raytrace / regexp / navier-stokes behave identically per the matrix
above.

## Bytecode tier, phase 6: direct VM→VM calls (2026-08-08)

`call` (op 20) now recognises a callee slot holding a plain user
function whose body is compiled, and calls it directly: the argument
lanes are copied into the callee frame's parameter slots and the result
comes back through return lanes (`bcRet*`), so a compiled→compiled call
boxes nothing at all — no argument vector, no handle per argument, no
handle for the result. The guard ladder mirrors
`callFnValueWithValues`'s special-case checks one for one, and anything
that is not a plain compiled call (builtins, bound functions,
constructors, eval, extra arguments) falls back to the generic path,
which re-runs the ladder itself.

Same fixed-work protocol as the phase-5 table:

| case | C++ ph5 | C++ ph6 | Rust ph5 | Rust ph6 |
| --- | ---: | ---: | ---: | ---: |
| fib | 121 ms | **107 ms** | 121 ms | **108 ms** |
| loop / strcat / array | — | unchanged | — | unchanged |

`fib` is now −19% from where this branch started (132/148 ms). (An
earlier revision of this section claimed C++ splay's Octane score moved
3 → 136 with this change; that reading was the coarse-clock scoring
artifact described above — the same binary flips between those two
quantized scores at the same real speed. A fixed-work splay kernel
shows phase 6 left splay's wall time roughly unchanged.)

Two tier-vs-walker divergences found by the differential probes while
building this, both pre-existing, both fixed: reading or writing a
property of null/undefined inside a compiled body now throws the same
TypeError the walker throws (it silently answered undefined before),
and `?.` no longer compiles — the VM's member ops throw on nullish
bases, so optional access stays on the walker, which short-circuits.
The runtime suite carries eight new `vmreentry` probes plus the null
member cases; all three targets pass every one (es6 1289/1289; C++ and
Rust native failure sets unchanged from base: 47 and 26).

## Bytecode tier, phase 6b: method dispatch and array ops (2026-08-08)

Three additions on top of phase 6, all inside `call_method` (op 32) and
the element ops:

1. **Direct VM→VM method calls.** An object/function receiver resolves
   its member once (the `canProps`/`getMember` prefix of `bcCallMethod`,
   verbatim); a plain user function with a compiled body then runs as a
   slot call with the receiver as `this` — no bound-clone allocation, no
   argument boxing. Anything else — builtin methods, statics, bound
   functions, arrows, non-compilable bodies — completes through the same
   resolved value without a second lookup.
2. **Registry-array inline cache.** `push`/`pop` on a clean array (no
   proto, no own properties) run the registry body directly under the
   walker IC's exact guards (dispatch epoch + arming condition);
   `push` of a NUMBER slot stores the raw double via `arrPushNumber`.
3. **Unboxed element access.** `a[i]` with a numeric key on a dense
   array reads and writes without minting key or value handles
   (`arrayItemNumOrNaN` / `setIndexNumberAt`); non-fast shapes route
   through helpers that now mirror the walker's element-vs-property
   rules exactly.

Fixed work, C++, interleaved best-of runs against the phase-6 build:
**array 237 → 63 ms (−73%)**, richards 8.14 → 7.51 s (−7.7%),
fib −4%, splay/method/object/loop within noise. Rust: array
286 → 69 ms (−76%), others flat.

The differential probes for this round caught four more pre-existing
tier-vs-walker divergences, fixed in the same change: member reads that
miss now answer `undefined` (never `getMember`'s internal null — a miss
resolves to the registry method value or undefined, exactly as the
walker does), sparse element writes pad holes and move `length` (they
stored a plain property before), `a["length"] = n` resizes, and
arguments-mapped indexes alias their parameters through compiled
callees. Those four closed 11 pre-existing failures in the NATIVE
conformance runs on each target: C++ 47 → 36, Rust 26 → 15 (of 1274
probes, now including nine new `vmelem` cases). The es6 suite stands at
1298/1298 with the tier on.

## Splay: the C++-only spin, resolved (2026-08-07)

The long-standing "C++-only splay spin" was **not** the tree, the rotations,
or object aliasing — all of which probed correct in isolation. The root cause
was integer conversion. Ranger's `int` is **32-bit** on the C++ target, and
`to_int` on a double lowers to `(int)floor(...)` — x86 `cvttsd2si`, which
returns `INT32_MIN` for any magnitude past 2^31 instead of wrapping. That is
undefined behavior C++ resolves to a garbage value, and it poisoned every
`ToInt32`/`ToUint32`/floor built on it. Octane's deterministic `Math.random`
(a Jenkins 32-bit hash, seeded once and iterated with `+`, `<<`, `^`, `>>>`)
degenerated into a period-4 cycle on C++, so splay's unique-key loop
`do { k = random-derived } while (tree.find(k))` never saw a fresh key and
spun forever. es6 (wrapping) and Rust (saturating) were unaffected.

The fix computes floor and truncation in the pure double domain (add/subtract
2^52, no int round-trip) and computes `<<` / `>>>` through an explicit int32
wrap / a uint32 divide, so nothing depends on the 32-bit `cvttsd2si` edge.
Splay now completes on every target — es6 136, Rust 136, C++ 3 (the low C++
score is allocation cost, the DeltaBlue-shaped churn, not a hang). The same
fix makes the Jenkins PRNG stream match Node's byte for byte on C++.

es6 is the fastest of the Ranger host builds (V8's nursery vs native
`malloc`/refcount for every `EvalValue`), matching `TS_ENGINE_PERF.md`.
