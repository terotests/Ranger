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

For ordinary programs rangerjs is in QuickJS's ballpark and an order of
magnitude below Node, peak RSS:

| program | rangerjs | qjs | node |
|---|---|---|---|
| the 8 `cases/` files | 1–6 MB | 0–3 MB | 36–48 MB |
| `09_method_chain` N=6400 | 11 MB | 2 MB | 49 MB |
| `05_tree_parent_cycle` N=6400 | 16 MB (`--gc`) | 3 MB | 50 MB |

Running the **Ranger compiler itself** — a 2.6 MB bundle — is the demanding case:

| | peak RSS |
|---|---|
| node | **158 MB** |
| rangerjs, at the start of this work | 13 GB, never finished |
| rangerjs now | **459 MB** |

Every step was found by measurement, and the method matters more than the
individual fixes:

1. **Reference cycles were never reclaimed** — found by the `memcases/` slope
   harness, where cases 04 and 05 differ by one line. Fixed with `--gc`.
2. **Two quadratic string walks** — found by sampling with gdb. 482 KB of
   source went from 31,575 ms to 536 ms and parse became linear.
3. **The whole module source copied onto every function value** — 1797 MB in
   723 copies of a 2.6 MB script, found with an `LD_PRELOAD` malloc shim.
4. **Hidden classes** — 48,771 wide objects had only 70 distinct key-sets, the
   commonest 72 keys across 25,208 AST nodes. The layout is shared now.
5. **A shared empty property bag** — 485,898 of 614,109 live values are arrays
   that never get a named property.
6. **The system allocator instead of `-native-fast-alloc`** — 577 MB with the
   freelist against 459 MB without, for 2.8% wall clock.

That last one is worth dwelling on: the same comparison earlier in this work
was 749 MB vs 734 MB, i.e. not worth having. The freelist never returns blocks
to the OS, so it only became expensive once the allocation mix changed under
it. A settled measurement is worth re-taking after the thing it measured has
moved.

### What the remaining 459 MB is

At peak, live allocations by size class (the tracked total is 391 MB; the rest
is allocator overhead and fragmentation across ~2.1 M live blocks):

| class | live | count | what |
|---|---|---|---|
| 512 B | 116 MB | 289,681 | `TSNode`, now 432 B |
| 2 KB | 79 MB | 43,318 | wide objects' value arrays |
| 128 B | 54 MB | 710,620 | property bags and array values |
| 64 B | 45 MB | 892,310 | small values, strings |

`TSNode` is the largest single item. 128 bytes of it have already moved behind
one pointer; another ~60 bytes sit in fields referenced 2–6 times each, but
they are small bools and ints spread over ~90 call sites, so the ratio is much
worse than the first batch.

Below that, a property costs ~24 bytes against V8's ~8 because `EvalValue` is
24 bytes — `rg_ptr` is a non-intrusive shared pointer. Making it intrusive
would take every class reference in every Ranger program from 16 to 8 bytes;
that is a change to the C++ target's memory model, not a fix.

One regression to be aware of: `08_map_symbols` at N=6400 went from 37 MB to
62 MB with the allocator change. That case churns short-lived 20-property
objects, which is exactly what a freelist is good at. The compile workload is
worth 118 MB and the synthetic one costs 25 MB, so the trade is taken
deliberately — `FAST_ALLOC=-native-fast-alloc` gets the old behaviour back.

### The measured case for shape sharing

`--gc-stats` reports the live set by shape, which is what makes the biggest
remaining lever concrete rather than theoretical. On a compile:

- **48,771 objects hold more than 50 properties each**, and between them ~89%
  of all 3.57 M live property slots.
- Those 48,771 objects have only **70 distinct key-sets**.
- The most common one is **72 properties across 25,208 objects**, keyed
  `__class__ sp ep row col has_operator disabled_node op_index
  is_array_literal is_system_class is_plugin is_direct_method_call …` — the
  compiler's own `CodeNode`, i.e. 25,208 instances of one class.

(The *widest* object is a different one: 258 keys, `random cast if_javascript
if_go if_java …`, which is the operator table from `Lang.rgr`. Widest and
most-common are separate measurements and should not be conflated — an
earlier commit message in this branch does exactly that and is wrong.)

Every one of those 25,208 objects stores all 72 keys again. Per property the
key half is the atom in the map entry (8 B with padding), the `slotAtoms`
entry (4 B) and a hash-index slot (~7 B) — about 19 B that is byte-identical
across all 25,208 objects, with only the values differing. That is ~34 MB for
one shape, and ~60 MB across all the wide objects.

A hidden class stores the key→slot layout once per shape and leaves the object
holding a shape pointer plus a flat array of values:

```
object:  [ shape* ][ v0 ][ v1 ][ v2 ] ...     8 B + one word per property
shape:   { "sp"->0, "ep"->1, "row"->2, ... }  stored once for all 25,208
```

which is most of why V8 costs ~8 B per property against this engine's ~40.
Shapes pay off exactly when objects are built the same way every time, which
is the case here — same constructor, same field order. They do not shrink the
VALUES, though, and that is the other half of the gap.

Things suspected and **ruled out** by measurement, so they need no revisiting:
the `-native-fast-alloc` freelist (749 MB with it, 734 MB on plain malloc),
`malloc_trim` retention (126 MB), cycle garbage on this workload (3060 MB with
`--gc`, 2936 MB without), the retained token array, and live strings (2.4 MB
of payload in total).

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
