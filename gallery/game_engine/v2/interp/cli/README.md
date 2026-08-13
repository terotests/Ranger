# `rangerjs` — the engine as a standalone command-line JS runtime

`rangerjs` runs a `.js` file the way `node file.js` or `qjs file.js` does, on the
natively-compiled ComponentEngine. It exists so the engine can be compared
against other engines **outside Node**.

That last part is the whole point. When the engine runs under Node, its own
objects are V8 objects, so V8's optimiser and V8's *garbage collector* stand
between the engine and what is being measured. Speed rankings invert (strings
look fast because V8 makes them fast; atoms look slow because they are integer
maps V8 never gets to specialise) and a whole class of memory bug is invisible,
because V8 quietly cleans up after the engine. `rangerjs` is a native binary with
no JavaScript underneath it, so what it does is what the engine does.

```
                             ┌───────────────┐
   file.js  ───────────────► │   rangerjs    │ ──► stdout
                             │ (native C++)  │
                             └───────────────┘
                                    ▲
                compare against  ───┼───  qjs (QuickJS), node
```

## Build

```bash
bash gallery/game_engine/v2/interp/cli/build-rangerjs.sh            # cpp (default)
TARGET=rust bash gallery/game_engine/v2/interp/cli/build-rangerjs.sh
```

Output: `gallery/game_engine/v2/interp/bin/<target>/rangerjs`.

The build compiles `rangerjs_main.rgr` through the Ranger compiler and then
through `g++ -O3` / `rustc -O`. It takes a few minutes. It refuses to link a
stale binary if the Ranger stage failed, so a successful `built:` line means the
binary matches the source.

## Run

```bash
rangerjs file.js                       # run a script
rangerjs --time file.js                # also print elapsed_ms
rangerjs --version
rangerjs --node file.js a b c          # with a Node-shaped host (see below)
rangerjs --prefix='[tsx] ' file.js     # restore the embedded hosts' log prefix
```

`console.log` writes straight to stdout with no prefix, so output is directly
diffable against `node` and `qjs`. A leading `#!` line is stripped, as node does.

### `--node`: the injected Node surface

`--node` prepends a small JavaScript prelude that defines `require`, `process`,
`__dirname`, `__filename` and a `fs`/`path`/`crypto` subset, implemented on top
of native host calls (`__rjs_read`, `__rjs_write`, `__rjs_exists`, `__rjs_cwd`,
`__rjs_env`, `__rjs_argv`, …) that `CliHostBridge` in `rangerjs_main.rgr`
provides. Programs written for Node — the Ranger compiler's own `bin/output.js`
among them — can then be loaded unmodified.

The prelude is deliberately *source*, not engine built-ins: the engine has no
business knowing what `require` means, and a different host can inject a
different surface.

Two limits worth knowing before relying on it:

- `crypto.createHash('sha256')` is a **deterministic stand-in**, not real
  SHA-256 (`picosha2.h` is not available in this tree). Anything that checks a
  real digest will disagree with Node.
- `fs.readdirSync` returns `[]` and `mkdirSync` is a no-op.

## Comparing against QuickJS and Node

```bash
bash gallery/game_engine/v2/interp/cli/compare-qjs.sh              # bundled cases
bash gallery/game_engine/v2/interp/cli/compare-qjs.sh my.js        # one file
TIME=1 bash gallery/game_engine/v2/interp/cli/compare-qjs.sh       # with timings
```

Node is the oracle: a case counts as a failure only when **rangerjs disagrees
with node**. `qjs` is run alongside and reported separately, because when all
three differ the case itself is usually engine-sensitive rather than the engine
being wrong.

Cases live in `cases/`. They print **strings only** — every engine formats
objects and arrays differently in `console.log` (`[1, 2, 3]` vs `1,2,3` vs
`[ 1, 2, 3 ]`), so a case that prints an array reports a difference that is not a
bug. Build the expected output with `String()`, `.join()` or `JSON.stringify`.

Current state: 7 of 8 cases match Node byte for byte, including named regex
capture groups and full microtask ordering. The one failure is `08_await_arg.js`
— see *Known gaps* below.

## Measuring memory

```bash
bash gallery/game_engine/v2/interp/cli/mem-probe.sh                     # all cases
bash gallery/game_engine/v2/interp/cli/mem-probe.sh 05_tree_parent_cycle.js
SCALES="200 800 3200" bash gallery/game_engine/v2/interp/cli/mem-probe.sh
```

Cases live in `memcases/` and carry an `__N__` placeholder for their iteration
count. Each is run at several values of N and its peak RSS sampled from
`/proc/<pid>/status`.

**Read the slope, not the peak.** Baseline footprints differ by an order of
magnitude between engines (node starts at ~40 MB, qjs and rangerjs at ~2 MB), so
a single measurement says nothing. The bytes-gained-per-iteration column is the
signal:

- a case whose data does not survive its loop should be **flat** on every engine
- a case that retains its data should grow on every engine, at similar rates
- a case that grows on rangerjs while node and qjs are flat is a **leak**

The cases climb deliberately from the trivial to the compiler-shaped, so a
regression can be attributed: plain loop with array push/pop → transient class
instances → retained instances → AST-shaped tree → the same tree with parent
pointers → closure cycles → string building → symbol tables → fluent method
chains with inheritance.

### What this found: reference cycles are never reclaimed

The engine's native heap is reference counted with no cycle collector, so any
object graph containing a cycle leaks in full. Cases 04 and 05 are the same
tree, built and dropped the same number of times, differing by one line —
`c.parent = this`:

| case | rangerjs | qjs | node |
|---|---|---|---|
| `04_tree_no_parent` | **−40 B/iter** (flat) | 117 | 6425 |
| `05_tree_parent_cycle` | **256,707 B/iter** | 188 | 1570 |

31 MB → 398 MB as N goes 100 → 1600, and the slope is identical at N = 200…3200,
so it is linear leakage rather than a plateau. At 20 000 iterations the minimum
shapes leak too, while QuickJS stays at 2 MB throughout:

| program | rangerjs | qjs |
|---|---|---|
| `a.b = b` (acyclic pair) | 7 MB | 2 MB |
| `o.self = o` | 16 MB | 2 MB |
| `a.b = b; b.a = a` | 28 MB | 2 MB |
| `a.push(a)` | 13 MB | 2 MB |

This is why running the Ranger compiler on the engine needs many gigabytes: the
compiler's AST sets `node.parent = this` (`bin/output.js:2503` and a dozen more
sites), so **every node it builds is a cycle**, and none of them are ever freed.

It is also exactly the class of bug that measuring under Node hides — V8 collects
those cycles, so the same programs look fine there.

### The fix: trial-deletion cycle collection (`--gc`)

```bash
rangerjs --gc file.js          # collect cycles
rangerjs --gc-stats file.js    # ...and print collections / reclaimed / live
RANGERJS_ARGS=--gc bash .../mem-probe.sh     # measure with it on
```

The collector is trial deletion over a registry of every reference value the
engine mints (`EvGcHeap` in `EvalValue.rgr`). It uses reference counts rather
than a tracing mark-sweep for one reason: **it needs no root enumeration.** The
AST walker keeps its temporaries in native locals, which no portable traversal
can see, so a mark-sweep rooted at the engine's own structures would free
values that are live on the host stack. A refcount has no such blind spot — a
native temporary *is* a strong reference, so it counts itself.

```
shadow[i] = ref_count(objects[i]) - 1      drop the registry's own hold
for every edge inside the registry:  shadow[target] -= 1
shadow[i] > 0  =>  held from outside the registry: a root
mark out from the roots; break and drop whatever stays unmarked
```

Roots are never enumerated, only *counted* — whatever the registry cannot
account for is by definition external.

**Safety rests on one invariant:** the subtract pass and the mark pass walk the
same edges, both through `childrenOf`. That makes the collector safe against
its own blind spots — an edge `childrenOf` fails to report is never subtracted
either, so its target keeps that `+1` and reads as externally referenced.
Under-reporting costs a missed collection and nothing else. The dangerous
direction is over-reporting, so `childrenOf` names each owning field exactly
once, and bails out conservatively when a bag's `slotCount` and `slotNames`
disagree rather than risk naming one slot twice.

Results at N=6400, peak RSS:

| case | no `--gc` | `--gc` | qjs |
|---|---|---|---|
| `05_tree_parent_cycle` | **1570M** | **10M** | 3M |
| `04_tree_no_parent` | 8M | 9M | 2M |
| `03_class_retained` | 13M | 13M | 2M |
| `08_map_symbols` | 7M | 11M | 2M |
| `06_closure_cycle` | 24M | 27M | 2M |

The 05 slope — the thing that made it a leak rather than a cost — goes from
256,707 B/iter to **8**, flat from N=100 to N=3200 where it used to reach
787 MB. Wall clock is +28% worst case, and on the leaking case it is *faster*
(21.7s → 20.2s): less memory pressure pays for the traversal.

**Two limits, both deliberate:**

- **A cycle through a closure is not collected.** `EvFunctionCore` reaches its
  scope by integer id, not by pointer, so there is no owning edge to report,
  and the scope sits outside the registry. That keeps everything under it live
  — safe, just retained. `06_closure_cycle` still grows.
- **The registry pins until a pass runs**, so a program with no cycles pays a
  tolerance window (~4096 objects) that plain refcounting would not have cost
  it. That is why `--gc` is opt-in rather than the default, and why several
  cases above read a few MB *higher* with it on.

`enable()` probes `ref_count` and refuses on a target that answers 0 — every
tracing-GC target, which reclaims cycles itself and has nothing to collect
here.


## Where the memory actually stands

For ordinary programs rangerjs is at QuickJS parity and an order of magnitude
below Node, peak RSS:

| program | rangerjs | qjs | node |
|---|---|---|---|
| the 8 `cases/` files | 1–5 MB | 0–2 MB | 38–43 MB |
| `05_tree_parent_cycle` N=6400 | 10 MB (`--gc`) | 2 MB | 52 MB |
| `09_method_chain` N=6400 | 10 MB | 2 MB | 41 MB |

The one regime that is still far off is running the **Ranger compiler itself**
— a 2.6 MB bundle, which is a different scale of program from anything above:

| | peak RSS |
|---|---|
| node | **159 MB** |
| rangerjs, at the start of this work | 13 GB, never finished |
| rangerjs now | **2662 MB** |

159 MB is the honest floor to aim at, not 11–20 MB: that is what a JIT engine
with hidden classes needs for the same job, and it does not drop when V8's
heap is capped at 64 MB. Where the remaining 2.6 GB sits, all measured:

- **749 MB before the compiler runs a single line** — parsing `output.js` into
  `TSNode`s. `TSNode` is ≥364 bytes over 62 fields: 5 strings (160 B), 6
  vectors (144 B, usually empty), 28 bools (28 B). This is untouched so far
  and is the largest single item.
- **~600 MB of live guest objects** — 612,000 of them holding 8.7 million
  property slots. Halved once already by storing plain properties as values
  rather than heap-allocated slots; the remaining per-property cost is ~56 B
  against V8's ~8–16 B with hidden classes.
- **484,813 arrays holding 206,059 elements between them** — 0.4 each, and
  every one still pays for a full `EvPropertyBag`.

Things that were suspected and **ruled out** by measurement, so they do not
need revisiting: the `-native-fast-alloc` freelist (749 MB with it, 734 MB on
plain malloc), cycle garbage (3060 MB with `--gc`, 2936 MB without), and the
retained token array.

Ranked next steps: shrink `TSNode` (bools to a bitfield, `nodeType` to an
interned id, the mostly-empty vectors behind a lazily-allocated side struct);
make `EvPropertyBag` lazy so an array with no named properties does not carry
one; then shape sharing, which is what actually closes the gap to a JIT engine
and is a redesign rather than a fix.

## Known gaps

- **`await` in argument position does not suspend.** `r.push(await p)` and
  `String(await p)` produce the right *value* but run the async function
  straight through instead of yielding, so continuations queued earlier are
  observed out of order. This is a known, documented limitation, not a new
  find — `genSpineOk` in `ComponentEngine.rgr` refuses `k == 4` (CallExpression)
  on the resumable path and falls back to the eager one. `08_await_arg.js` pins
  it so it is visible whenever the harness runs. `await` bound to a variable is
  correct.
- Cycles through a closure scope still leak; see the limits above.
- `print` is not defined (QuickJS has it); use `console.log`.

## Continuing this work

Add a conformance case: drop a `.js` file in `cases/` that prints strings only,
run `compare-qjs.sh`, and check the diff against node.

Add a memory case: drop a `.js` file in `memcases/` with `__N__` where its
iteration count goes, keep it small and single-purpose, and run `mem-probe.sh`.
Give it a sibling that differs in exactly one respect wherever possible — 04
against 05 is what made the cycle leak unambiguous. A case that changes three
things at once cannot attribute what it measures.

Useful next probes, roughly in order of what they would settle:

1. **Where the 2.1 KB per leaked node goes.** The per-object cost is high even
   before the leak; `03_class_retained` shows 1340 B/iter for a two-field
   object. Splitting that between the property bag, the `EvHandle` and the
   `EvalValue` body would say whether a cycle collector is enough or the object
   layout also needs work.
2. **Whether closures leak by a different route** (`06_closure_cycle` is a
   cycle too — separating "closure captures itself" from "closure is expensive"
   needs a non-capturing variant).
3. **Timing, once memory is under control.** `TIME=1 compare-qjs.sh` already
   reports per-engine wall clock; the interesting comparison is rangerjs vs qjs
   on the same native footing, *not* rangerjs-under-node vs anything.
