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

## Six-engine matrix (remeasured 2026-08-08 on `9e1edf89`)

Every engine runs the SAME prepared suite bodies. External engines
(`node` / `qjs` / `duk`) take the raw zoo files; the Ranger targets
(`es6` / `cpp` / `rust`) take the run.cjs preparation (print prelude +
`inheritsFrom` rewrite). Reproduce with
`python3 bench_matrix.py` (writes `matrix-results.json`) and render with
`python3 matrix_report.py`.

Host: Intel Xeon cloud agent, Node v22.14, QuickJS 2024-01-13, Duktape 2.7.0,
`g++ -O3 -march=native`, `rustc -C opt-level=3`. Raw JSON:
[`matrix-results.json`](./matrix-results.json).

### Octane score (higher is better)

| Suite | Node (V8) | QuickJS | Duktape | Ranger es6 | Ranger C++ -O3 | Ranger Rust -O3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| richards | 52960 | 920 | 400 | **59** | 0.5† | **59** |
| deltablue | 125472 | 956 | 483 | **110** | 1† | **110** |
| splay | 17250 | 2591 | 2188 | **370** | 3† | **370** |
| regexp | 10728 | 353 | 278 | **75.8** | FAIL | **27.9** |
| crypto | 60773 | 1361 | 540 | FAIL | FAIL | FAIL |
| raytrace | 111664 | 1473 | 993 | FAIL | FAIL | FAIL |
| navier-stokes | 56689 | 2384 | 2172 | FAIL | FAIL | FAIL |
| earley-boyer | 103765 | 2228 | 1089 | FAIL | FAIL | FAIL |

† C++ Octane *scores* are quantized by the coarse `liveClock` on this host
(0.5 / 1 / 3) even though **wall time matches Rust/es6** (richards ~4.3 s vs
es6 4.2 s / rust 5.5 s). Read C++ throughput from the wall-time table or the
microbench below, not from these Octane score cells.

| Ratio on Richards (reported score) | |
| --- | ---: |
| QuickJS / Ranger es6·Rust | **15.6×** |
| Duktape / Ranger es6·Rust | **6.8×** |
| Node / Ranger es6·Rust | **897×** |
| Ranger % of zoo V8 (37102) | **0.16%** |

### Wall time of the run (suite driver included)

| Suite | Node (V8) | QuickJS | Duktape | Ranger es6 | Ranger C++ -O3 | Ranger Rust -O3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| richards | 2.0s | 2.0s | 2.0s | 4.2s | 4.3s | 5.5s |
| deltablue | 2.0s | 2.0s | 2.0s | 5.6s | 4.4s | 5.4s |
| splay | 2.1s | 2.5s | 2.4s | 6.2s | 5.7s | 6.3s |
| regexp | 2.1s | 5.4s | 6.9s | 32.8s | 1.8s‡ | 89.5s |

‡ C++ regexp exits early with checksum FAIL.

### Peak RSS (per-child `ru_maxrss`)

| Suite | Node (V8) | QuickJS | Duktape | Ranger es6 | Ranger C++ -O3 | Ranger Rust -O3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| richards | 57 MB | 10 MB | 10 MB | 87 MB | **13 MB** | **12 MB** |
| deltablue | 86 MB | 10 MB | 10 MB | 132 MB | 56 MB | 57 MB |
| splay | 470 MB | 169 MB | 129 MB | 870 MB | 485 MB | 523 MB |
| regexp | 86 MB | 10 MB | 10 MB | 224 MB | 29 MB | 32 MB |

Native RSS on Richards is now in the QuickJS class (~12–13 MB). Earlier
builds retained cycles into multi-GB; that is fixed on this master tip.

### Compatibility

Four suites produce a valid score on Ranger: richards, deltablue, splay, and
regexp (es6 + Rust; C++ regexp still checksum-fails). crypto (`Unknown type:
this`), raytrace (incorrect scene), navier-stokes (checksum), and earley-boyer
(parser rejects Scheme-compiled octal/leading-zero keys) fail the same way on
every Ranger target — engine semantics, not a lowering bug.

### Binary size (stripped, this machine)

| | stripped |
| --- | ---: |
| Duktape | **514 KB** |
| QuickJS | **1.03 MB** |
| Ranger C++ `octane_runner` (`-O3`) | **1.85 MB** (~1.8× QJS) |
| Ranger Rust `octane_runner` (`-O3`) | **2.87 MB** |

The Ranger binaries carry the whole engine — the TypeScript lexer/parser, the
regex engine, `Date`, JSON, the value model — not just an interpreter loop.

### Microbench vs QuickJS (same tip)

`node …/native/vs_quickjs.cjs` on this build — ms/run, lower is faster:

| case | raw Node | raw QuickJS | eng/ES6 | eng/C++ | ES6/QJS | C++/QJS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| loop | 0.270 | 0.365 | 2.10 | 1.59 | 5.8× | 4.4× |
| fib | 0.227 | 0.409 | 3.04 | 4.95 | 7.4× | 12× |
| strcat | 0.243 | 6.172 | 0.53 | 1.54 | **0.1×** | **0.3×** |
| array | 0.685 | 1.320 | 4.13 | 4.73 | 3.1× | 3.6× |
| object | 1.144 | 2.137 | 10.6 | 7.75 | 5.0× | 3.6× |
| method | 1.127 | 2.430 | 12.2 | 14.3 | 5.0× | 5.9× |
| regex | 1.028 | 3.719 | 27.8 | 29.7 | 7.5× | 8.0× |
| **geomean** | 0.541 | 1.570 | 4.70 | 5.68 | **3.0×** | **3.6×** |

C++/QuickJS geomean is now **~3.6×** (was ~12× after #541, ~63× before the E4
work). `strcat` / in-place append beats qjs; Octane Richards remains the
object-graph story (~16× behind QJS on the reported es6/Rust score).

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

## Bytecode tier: the statement long tail + call-site IC (2026-08-08)

The remaining phase-4 statements compile now: try/catch (finally stays
on the walker), throw, for-in, for-of, do-while, and unlabelled
break/continue — including break out of a try, rethrow from catch, and
exceptions crossing compiled/walker call boundaries in both
directions. The loops reuse the walker's own snapshot machinery
(`forInKeyList` / `forOfItemList` are now shared helpers, so the two
engines cannot diverge), exceptions unwind through a handler stack
that every throwing op consults, and a catch parameter becomes a slot
only when a conservative scan proves the name escapes nowhere outside
its clauses.

Call sites also gained an identity-keyed inline cache: op 20's guard
ladder now runs once per (site, callee identity) instead of per call —
sound because a function value's laddered properties are immutable
after mint except the `__fnprotocall__` marker, which stays a per-call
probe.

Fixed work, interleaved against the phase-6b build: **fib
105 → 79 ms C++ (−25%), 107 → 86 ms Rust** — the IC's win. The newly
compiled member-heavy bodies (splay's tree walk, richards' scheduler
tails) run within ~2–4% of their walker versions in either direction:
the VM's member ops pay a helper call and a getter probe per access
where the walker has node-level memos. Making those per-site ICs too
is the next lever.

Two parity finds from this round's probes, both fixed: calling a
non-callable value from a compiled body now throws the walker's
`<name> is not a function` TypeError (it silently answered null
before, exposed the moment try/catch compiled), and the runtime suite
gained 19 `vmlongtail` probes — 1317/1317 on es6, with the C++ and
Rust native failure sets unchanged (36+2 and 15+2, all pre-existing;
the two `crash` entries are an old `std::out_of_range` on
Number.MAX_VALUE probes that predates this branch).

## Bytecode tier: fused member ops (2026-08-08)

The member-op lever the long-tail write-up pointed at. A plain member
access used to walk the prototype chain up to three times —
`findGetter` per link, `getMember` per link, and a wrapper handle
minted per link step — each link paying a by-value union copy. The
property bag carries its own prototype, so `memberFastAt` /
`chainAccessorFreeAt` (EvHandle) now do the whole read or write gate
in ONE bag-level pass: per link, a monotone `everHadAccessor` flag
check and one hash probe, no wrapper mints. Anything off the plain
path — non-object receivers or links, any bag that ever defined an
accessor — answers a sentinel and takes the full machinery unchanged.
Wired into ops 30/31 inline (no helper call, no bcSp bracket on the
hot case), the get_elem/method funnels, and method resolution.

Fixed work, C++, interleaved against the long-tail build:
**richards 6.74 → 5.31 s (−21%)** — the scheduler is exactly
member-traffic — with splay-kernel −3% (recovering the long-tail
round's cost), `object` −7%, `method`/`fib` flat. Rust numbers move
the same direction (not interleaved; the container's speed shifted
between batches, so only interleaved pairs are comparable).
Conformance: es6 1317/1317; C++ 1255+36+2 and Rust 1276+15+2,
failure sets unchanged.

## Bytecode tier: profile-guided round — string dispatch IC (2026-08-08)

First round aimed by a real profile (callgrind on the C++ build; the
`-march=native` binary needs a plain `-O3` twin, valgrind cannot decode
AVX-512). On the `method` row, ~14% of all instructions were
string-method RESOLUTION — `overriddenPrototypeMethod` re-probed on
every call inside `invokeBuiltin`, `hasBuiltin`'s arity chain,
`registryMethodDeleted` — and the fused member read still paid two
map lookups (`hasData` then `getData`).

Three changes: `dataOrHole` collapses the bag probe pair into one;
`invokeBuiltin` splits so callers that already proved no override can
enter past the probe (`invokeBuiltinDirect`); and call_method sites
carry a registry IC for STRING receivers — prototype writes, overrides
and deletions all bump the dispatch epoch, so an unchanged epoch
re-proves the whole resolution per site. A probe that overrides
`String.prototype.indexOf` mid-run and reverts it confirms the epoch
invalidation takes effect immediately.

Fixed work, C++, interleaved: **method 460 → 154 ms (−67%)**,
**richards 5.29 → 4.31 s (−18.5%, on top of the fused-member round's
−21%)**, splay kernel −3.5%, object flat. Rust: method 667 → 214 ms
(−68%). Conformance: es6 1317/1317; C++ 1255+36+2 and Rust 1276+15+2,
failure sets bit-unchanged.

The re-profile after that round showed the next two taxes and both got
the same monotone-flag treatment. The op-20 IC's own per-call
`__fnprotocall__` probe (12.4M `hasOwnData` calls on richards) is now
epoch-based: every write funnel of that marker (putOwnData, setAttrs,
the fast write) bumps the dispatch epoch, so the IC hit needs only
identity + epoch — a probe that swaps the marker onto a live function
mid-run confirms sites re-arm and match the walker exactly. And plain
property WRITES (up to five probes: hasOwnData, isWritable/attrsOf,
extensible, protoRefuses, then putData) collapse to one store behind
`everHadAttrs` — a chain whose bags never carried attributes or
accessors, own bag unfrozen/unsealed/extensible, cannot refuse or
redirect, and with no attrs anywhere every existing slot is already at
default attributes so overwrites preserve them. Interleaved, C++:
fib −9.5%, object −10.6%, splay kernel −1.4%, richards flat.
Frozen/sealed/defineProperty/read-only-proto/setter probes all hold on
all three targets; failure sets bit-unchanged.

## Bytecode tier: switch and try/finally compile (2026-08-08)

The last two phase-4 statements of any weight. switch compiles in the
walker's exact shape — every case test evaluates in order (side
effects included), the first strict-equal match wins, bodies run from
there by fall-through — and is a break target with its own patch
window, distinct from loops, so `continue` inside a switch still
reaches the enclosing loop and pops the right number of try handlers
on the way. try/finally compiles when nothing can exit the guarded
blocks abruptly except a throw (escaping return/break/continue keeps
the statement walked): the normal path runs the finalizer inline; the
exception path binds the pending value to a hidden slot, runs a
second copy of the finalizer, and rethrows — which also gives the
"finalizer's own throw replaces the pending one" rule for free.

Ten new suite probes (fall-through, default-first, strict-equality
cases, continue-through-switch, and finally on the normal / caught /
replacing / cross-function paths): es6 1327/1327, C++ 1265/1293 and
Rust 1286/1293 — the same 36+2 and 15+2 pre-existing failures, zero
regressions. One walker trait recorded while probing: the engine
evaluates ALL case tests even after a match where Node stops at the
first hit; tier and walker agree with each other, not with Node —
a pre-existing divergence, now documented.

## Native conformance closed to the es6 gap set (2026-08-08)

The native failure piles — C++ 36+2 crashes, Rust 15+2 panics of 1303 —
are gone: **both targets now score 1297/1303 with zero crashes**, and
the six survivors are exactly the suite's documented engine-level
syntax gaps (for-of expression LHS, destructuring swap, computed
object keys, generators, optional chaining, nullish coalescing),
identical on every target. What the piles were made of:

- **C++ dates (17)**: DateTime's truncD round-tripped through the
  32-bit int; now pure double domain (2^52 magic-add floor).
- **C++ number text**: r_double_to_string / cpp_str_to_double used
  std::stod, which THROWS on overflow ("2e+308" candidates — the two
  crashes) and on subnormals (Number.MIN_VALUE undefined) where strtod
  saturates; toString now range-guards its int fast path and formats
  by the ECMA notation rules (jsNumberFormat).
- **Rust ctor panics (2)**: generated argument temporaries kept the
  callee borrowed across constructFromFunction — `calleeN.name` /
  `calledV.fnName()` inline in the call — while the body re-borrowed
  the same node/handle. Hoisted to locals.
- **Rust substring miscompile**: the writer printed the skip/take
  length as `end - start` with BOTH operands' parens suppressed, so
  `substring t (i+1) (i+2)` became `take(i + 2 - i + 1)` = 3 — `$&`
  in a replace template read three chars and never matched, and JSON's
  \uXXXX decoding sliced garbage. The writer now parenthesizes each
  side; compiler rebootstrapped (bin/output.js +6 lines).
- **Array lengths past 2^31 (C++)**: `declaredLength` is a double now
  (a JS length runs to 2^32-1; Ranger's int is 32-bit on C++), with a
  D-suffixed exact lane (arrayLengthD, canonicalArrayIndexD,
  setArrayLength taking a double) used by the `.length` read/write
  funnels, far-index element writes and the shrink walk; the int
  lane survives clamped for the hot loop paths.
- **U+2028/29 (C++)**: the \uXXXX string-escape decoder truncated any
  code past 0xFF through `char()` (`" "` decoded to `"("`!) —
  codeUnitString now writes the UTF-8 bytes on the byte-model target.
  The lexer recognises the separator as its three-byte substring
  (isLsPsUtf8) in isLineTerminatorChar / isWhitespace / advance, and
  codePointAt/advance survive the `at`-past-the-last-code-point ""
  that a multi-byte char in a byte-counted source produces.

es6 suite 1327/1327 throughout; fixed-work rows sanity-checked after
the round (fib 54ms, array 49ms, method ~165ms — within this
container's noise of the recorded numbers, no interleaved re-baseline
claimed).

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
