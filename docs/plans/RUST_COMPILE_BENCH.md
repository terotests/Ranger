# Compile time on large strict-Rust programs

`scripts/rust-compile-bench.mjs` generates a strict-Rust program of N units
(two structs, an enum, a function each; `main` calls every unit) and times
`node dist/rgrc.js -l=<target>` on it.

    node scripts/rust-compile-bench.mjs --sizes=50,200,700 --langs=es6,go

## Go vs ES6

The report that started this: Go took 0.47s / 2.4s / 32s on 1.1k / 5.7k /
22.6k lines where ES6 took 0.4s / 1.3s / 5.3s. The generator used for those
numbers was not committed, and on master of 2026-09-28 the gap does not
reproduce with either of two generators:

- this script's units (below): Go is as fast as ES6 or faster;
- the `tests/fixtures/rust_strict/*.rs` programs, renamed per unit and
  concatenated (maps, traits, iterators, `Rc`/`Weak`, `#[ranger::serialize]`):
  42k lines take 14.4s on ES6 and 13.5s on Go.

## Class writers: union membership was quadratic

The ES6, Python, C#, Kotlin and Dart class writers ask
`RangerGenericClassWriter.unionInterfacesOf` for every class they write, and
it scanned every defined class for sealable unions each time. With 2100
classes that was 10s of a 30s ES6 compile. It now builds a class-name →
interfaces index on the first question and reads it after that. The output is
byte-identical.

Before / after (one run each, Linux container, Node 22):

| units | lines | es6 before | es6 after | go before | go after |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 50 | 1 656 | 1.82s | 1.80s | 1.89s | 1.76s |
| 200 | 6 606 | 5.88s | 4.56s | 4.24s | 4.31s |
| 700 | 23 106 | 29.77s | 18.98s | 17.78s | 16.59s |

## What is left

Time still grows faster than the input (200 → 700 units: 3.5× the lines,
about 4× the time). The CPU profile puts it in the garbage collector and in
the `CodeNode` and `RangerAppWriterContext` constructors: the number of
objects allocated is linear (about 1 760 `CodeNode`s and 530 contexts per
unit), but the heap reaches 2.6 GB on the 700-unit program and every
collection has more to walk. A context allocates about 60 maps and arrays when
it is forked, a `CodeNode` about 15. Allocating those lazily, or not keeping
forked contexts reachable from the nodes after type checking, is the next
step; both touch every target the compiler is written for.

## 2026-11-15: young generation, loops over a call, fewer arrays per node

Three changes, each output byte-identical (the compiler's own two-stage
self-host compares equal):

- `dist/rgrc.js` starts itself once more with a fixed 128 MB young
  generation (`scripts/rgrc-launcher.mjs`, added by `npm run compile`).
  Nearly everything the compiler allocates lives until the end, so with the
  default 16 MB every scavenge copies it to the old space; on web/com
  (113k lines) the scavenges took 5 of 18 s. Same compiler, flags off/on:
  com 18.1 s → 15.2 s, the 700-unit program 9.5 s → 9.0 s. It costs about
  0.1 s of start-up, so small programs gain nothing. `RGRC_NO_RESPAWN=1`
  or an explicit `--*-semi-space-size` flag turns it off.
- The ES6 writer wrote `for (f(x)) item i { … }` as
  `for (i = 0; i < f(x).length; i++) { item = f(x)[i] … }`: the call ran
  twice per element, a quadratic loop when it builds the array. It now
  evaluates the collection once into a block-scoped constant. 154 loops in
  the compiler itself were written this way.
- A `CodeNode` allocated 13 arrays and maps; five of them (`methodChain`,
  `rust_preevaluated_args`, `rg_init_*`) are almost never set and are now
  optional. An optional array or hash field starts as `undefined` in the
  ES6 writer (it was `[]`, so `null? x` was never true there).

Min of three runs, `-l=es6`, 4 vCPU container, Node 22, rustc 1.97 (before =
master 6c388e6, after = this change; com does not compile on master):

| unit | lines | before | after | rustc debug | rustc check |
| --- | ---: | ---: | ---: | ---: | ---: |
| gen200 | 6 605 | 3.07 s | 3.03 s | 1.49 s | 0.82 s |
| gen700 | 23 105 | 9.25 s | 8.44 s | 5.31 s | 2.99 s |
| uix | 2 755 | 1.17 s | 1.27 s | 0.45 s | 0.24 s |
| uix1 | 6 177 | 1.92 s | 1.77 s | 0.89 s | 0.48 s |
| vbs | 10 777 | 1.98 s | 2.09 s | 0.89 s | 0.49 s |
| core | 11 269 | 2.51 s | 2.56 s | 1.20 s | 0.68 s |
| com | 113 193 | — | 14.18 s | 12.10 s | 7.40 s |

Runs vary by about 10 % here. Large programs are 5–10 % faster; small ones
are where they were, because the same change set also made the Rust frontend
do more (module paths, renaming same-named types, `==` helpers). Ranger is
still 1.2–2.5× slower than rustc debug.

What a small program spends (vbs, 2.0 s): 0.6 s start-up and parsing
`Lang.rgr` (520 kB) and the Rust prelude, which every run does again; 0.4 s
GC; 0.5 s operator matching (`stdParamMatch`). Caching the parsed `Lang.rgr`
and the lazy contexts above are the next steps.

## Round 2 (2026-11-15): fewer allocations per context and node

An allocation-sampling profile of the 700-unit program showed 3.0 GB
allocated for an 8 s run, and GC took 20 % of the time. Changes:

- `@(lazy)` on an array or hash field (ES6 writer only; TypeScript, Flow and
  the other targets ignore it and stay eager): the constructor stores
  `undefined` in `__lz_<name>` and a getter allocates the table on first
  read. All 60 tables of `RangerAppWriterContext` (forked hundreds of
  thousands of times; most forks never touch them) and six of `CodeNode`
  (`ns`, `props`, `prop_keys`, `comments`, `attrs`,
  `register_expressions`) use it.
- `CodeNode.prop_cnt` counts writes to `props`; the `get*Property` /
  `has*Property` getters return the default without the lookup when it is
  0. `getStringProperty` alone was asked on 540 000 nodes with no props.
- `RangerAppWriterContext.expr_stack` (a `[boolean]` of which only the
  length was read) is now the counter `expr_depth`; `getErrorCount` reads
  the root's list (`addError` stores every error there) instead of summing
  the whole parent chain.
- The launcher passes `NODE_COMPILE_CACHE` (in the temp dir) to the child,
  saving about 0.1 s of script compilation on the child's start.

Min of three runs, `-l=es6`, same container; before = master a520c5ff8.
Output is byte-identical:

| unit | before | after |
| --- | ---: | ---: |
| gen200 | 3.30 s | 3.16 s |
| gen700 | 9.56 s | 8.22 s |
| uix | 1.31 s | 1.26 s |
| uix1 | 1.91 s | 1.91 s |
| vbs | 2.26 s | 1.85 s |
| core | 2.61 s | 2.40 s |
| com | 15.28 s | 13.51 s |

Left out:
- A `CodeNode` has 99 fields (~800 bytes without pointer compression), and
  the parser makes ~1 M of them on gen700: 780 MB of the 3 GB. 45 fields are
  never set on these inputs. Putting defaults on the prototype would bring
  back the many-hidden-classes problem the ES6 writer fixed earlier; moving
  rare fields to a side object is a ~1 000-site refactor, not done.
- Getters of lazy fields still allocate on a read: `ns` (70 % of nodes),
  `register_expressions` (read on every node by `WalkNode`) and the parent
  chain walks in `getOperators` / `isVarDefined` / `isEnumDefined` read them.

## Round 3 (2026-11-15): rarely set CodeNode fields in a side object

`@(rare)` on a field (ES6 writer only): the value lives in `this.__x`, an
object made on the first write by `__xNew()`; until then a getter returns
the field's initial value. Only fields whose initial value is a literal
qualify (`jsRareDefault`), so the getter never hands out an object a caller
could change. 40 `CodeNode` fields that were set on at most 0.5 % of the
nodes of gen700 and com carry it.

gen700 allocates 2.77 GB instead of 2.95 GB (parser 777 → 545 MB) and GC
time drops ~12 %, but the accessor calls cost about as much, so gen700 is
unchanged (7.2 s). vbs 1.98 → 1.76 s, com 13.50 → 13.31 s. Output is
byte-identical.

## Round 4 (2026-11-15): contexts and operator lookup

- `getOperators` (ES6): when no namespace in the chain adds an operator of
  that name and no context has an operator function, it returns the shared
  list; it copied it into a new array on each of ~250 000 calls (gen700).
- A `@(rare)` setter given the initial value on an object with no side
  object returns without making one: `copy` and `rebuildWithType` copy
  every field, and made a side object for every copied node.
- `RangerAppWriterContext.counters` (a `TypeCounts`) is made on first use
  (root and function contexts only); it was allocated on every fork. 24
  context fields that are almost never set are `@(rare)` (the class went
  from 105 constructor fields to 81).

gen700 allocates 2.44 GB (was 2.74 GB), com 12.95 → 12.27 s; output
byte-identical.

## Round 5 (2026-11-15): parser strings, more rare fields, variable lookup

- String literals with escapes are decoded by copying the runs between
  escapes as one substring each; the loop appended one character at a time.
- 30 more `CodeNode` fields set on at most ~3.5 % of the nodes (vbs) are
  `@(rare)` (constructor fields 60 → 30): parser allocation on gen700
  539 → 349 MB, total 2.29 → 2.21 GB.
- `RangerAppWriterContext.local_var_cnt` counts the variables a context
  defines; `isVarDefined`, `getVariableDef` and `isLocalToCapture` skip the
  map lookup (and the lazy map) when it is 0. `isVarDefined` self time on
  com 388 → 205 ms (6 M calls).

Wall time moves within the ~10 % noise of this VM (vbs 1.69 → 1.67 s best,
com 11.9 → 12.5 s / 13.2 → 13.1 s); output byte-identical on vbs, uix1,
gen200, gen700 and com.

Where the time is now (com, 13.4 s): GC ~2.4 s; parsing the Ranger text the
Rust frontend generates (6.9 MB) ~1.2 s, of which slicing tokens 0.19 s and
CodeNode allocation 0.18 s; fixed cost per run ~0.3 s, half of it parsing
Lang.rgr, JSON.rgr, RsPrelude.rgr and stdlib.rgr (≈ 0.17 s) — the case for
a parsed-tree cache, or for the Rust frontend handing over CodeNodes
without the text round trip.
