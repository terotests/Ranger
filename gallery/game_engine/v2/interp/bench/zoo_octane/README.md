# Zoo.js / Octane bench for the Ranger TS engine

Runs the same V8 Octane v9 suites published on
[zoo.js.org](https://zoo.js.org/?arch=amd64&v8=true) through:

1. **Node** (same machine baseline)
2. **Ranger `ComponentEngine`** (the TS/TSX interpreter)

## Setup

```bash
bash scripts/build-engine-module.sh          # es6 Node module
bash gallery/game_engine/v2/interp/bench/zoo_octane/build-native.sh  # cpp + rust
# Suite .js files are vendored next to run.cjs (from ivankra/javascript-zoo).
node gallery/game_engine/v2/interp/bench/zoo_octane/run.cjs
node gallery/game_engine/v2/interp/bench/zoo_octane/run.cjs --targets=es6,cpp,rust richards,deltablue,regexp
```

See [`COMPARE.md`](./COMPARE.md) for the post-PR #541 QuickJS / Duktape /
C++ / Rust comparison (binary size, Richards, RSS, microbench), and
`RESULTS.md` for per-target Octane tables.

## Scoring

Octane scores are throughput relative to a fixed reference (higher is faster).
`run.cjs` reports each suite score, the geometric mean, and two percentages:

| Column | Meaning |
| --- | --- |
| `% of Node` | engine score / same-machine Node score (fair ratio) |
| `% of zoo V8` | engine score / V8 column on zoo.js.org amd64 (rough table placement) |

The engine needs a live `Date` clock for Octane's `new Date() - start` timing
(the realm clock is frozen by default) and a raised `maxLoopIterations` so
long suites are not silently truncated. Both are applied in `run.cjs`.

`console.log` is not a first-class value in this realm, so Octane's
`print = console.log` is replaced with a small `print` prelude.
