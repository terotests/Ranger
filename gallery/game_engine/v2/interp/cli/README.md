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

Fixing it means giving the engine a cycle collector (trial deletion, or a
mark-sweep over a registry of live objects). Neither is a small change, and
neither is in this branch — the harness is what is delivered here.

## Known gaps

- **`await` in argument position does not suspend.** `r.push(await p)` and
  `String(await p)` produce the right *value* but run the async function
  straight through instead of yielding, so continuations queued earlier are
  observed out of order. This is a known, documented limitation, not a new
  find — `genSpineOk` in `ComponentEngine.rgr` refuses `k == 4` (CallExpression)
  on the resumable path and falls back to the eager one. `08_await_arg.js` pins
  it so it is visible whenever the harness runs. `await` bound to a variable is
  correct.
- Reference cycles leak, as above.
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
