# TS engine optimization (ComponentEngine)

Tracking **measured** interpreter performance work on the gallery **ComponentEngine**
(`gallery/pdf_writer/src/jsx/ComponentEngine.rgr`) and its **C++ native target**.
Game scripts (`*.game.tsx`, `games/*/index.tsx`) are evaluated at runtime by this
engine — see [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md).

Branch: `cursor/optimize-tsx-interpreter-4447` · PR: [#167](https://github.com/terotests/Ranger/pull/167)

## Motivation

Evaluation felt slow during **level / field initialization**, not during steady-state
game ticks. The **Arctic Rush** game (`games/ar/index.tsx`) is a good model:

- large module-level `const` arrays of object literals (`ROAD_POINTS`, `PICKUP_DEFS`, …)
- `while` loops that build road caches over `WORLD_H` (6000 px)
- `Math.sin` in the road solver
- nested loops that build many small entity objects (`placeEntities`, `sprites`)

We do **not** benchmark whole games or SDL frames — only this **native-free**
interpreter hot path so changes are attributable to evaluation, not rendering or I/O.

## Benchmark harness

| File | Role |
|------|------|
| [`gallery/pdf_writer/bench/level_init_bench.tsx`](../../pdf_writer/bench/level_init_bench.tsx) | Self-contained TSX workload mirroring `ar` init (road solver + entity build). Exports `initLevel()` returning a numeric checksum. |
| [`gallery/pdf_writer/bench/level_init_bench.js`](../../pdf_writer/bench/level_init_bench.js) | V8 / Node timing (`node gallery/pdf_writer/bench/level_init_bench.js [iters]`). |
| [`gallery/pdf_writer/bench/level_init_bench_cpp.rgr`](../../pdf_writer/bench/level_init_bench_cpp.rgr) | Native C++ harness: loads the TSX into `ComponentEngine`, calls `initLevel()` in a loop. |
| [`gallery/pdf_writer/bench/run_cpp_bench.sh`](../../pdf_writer/bench/run_cpp_bench.sh) | Marginal per-iteration timing on C++ (subtracts fixed startup/parse cost). |
| [`gallery/pdf_writer/src/tools/component_engine_module.rgr`](../../pdf_writer/src/tools/component_engine_module.rgr) | CommonJS module export for the JS benchmark / Vitest. |

**Correctness gate:** checksum must stay **`540975`** after every change.

**Interpreter settings:** `engine.quiet = true` (game hosts already do this).

### Run (V8)

```bash
node gallery/pdf_writer/bench/level_init_bench.js 300
```

### Run (native C++)

```bash
# 1. Compile harness
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js \
  -l=cpp gallery/pdf_writer/bench/level_init_bench_cpp.rgr -nodecli \
  -d=tmp/bench-cpp -o=bench.cpp

# 2. Build
cp gallery/invaders/variant.hpp tmp/bench-cpp/
g++ -O2 -std=c++17 tmp/bench-cpp/bench.cpp -o tmp/bench-cpp/bench

# 3. Time (marginal ms per initLevel)
bash gallery/pdf_writer/bench/run_cpp_bench.sh tmp/bench-cpp/bench 20 120 3
```

## Measured results (per `initLevel`)

| Target | Before | After | Change |
|--------|--------|-------|--------|
| **Native C++** (`-l=cpp`) | ~79.5 ms | **~64 ms** | **−19 %** |
| **V8** (Node `ComponentEngine` module) | ~30.9 ms | **~14.9 ms** | **−52 %** |

Allocation instrumentation (C++, one `initLevel`):

| Metric | Before | After |
|--------|--------|-------|
| `EvalValue` heap constructions | ~370 000 | ~118 000 |
| Map probes (`bindings` lookup) | ~397 000 | (unchanged order of magnitude) |
| `EvalValue::null()` share of allocs | ~57 % | ~0 % (pooled singleton) |

The C++ and V8 profiles differ a lot: on native builds, **`std::string` copies**,
**`std::map` tree walks**, and **`shared_ptr` atomic refcount** dominate wall time;
on V8, eager `toString()` / string concat in trace paths and allocation churn
dominated until those were removed.

## Optimizations (in commit order)

### 1. Guard trace strings behind `quiet` ✅

**Problem:** `ComponentEngine` built debug strings on every function call, parameter
binding, variable declaration, and array index — including `to_string` /
`EvalValue.toString()` — even when `quiet=true`. In C++ this is a `std::string`
concat + allocation per hot-path op.

**Fix:** Wrap hot-path `this.trace("…" + …)` calls in `if (false == quiet) { … }`.

**Files:** `ComponentEngine.rgr` (`evaluateCallExpr`, `evaluateMemberExpr`,
`processModuleVariableDeclaration`, `processVariableDeclaration`, …).

**Impact:** V8 ~30.9 → ~21.0 ms; C++ modest improvement. Complements the partial
`quiet` work noted in [`TSX_ENGINE_ISSUES.md`](./TSX_ENGINE_ISSUES.md) §3.

---

### 2. Fast-path `evaluateExpr` dispatch + single-probe `lookup` ✅

**Problem:** Every expression walked a long `nodeType` string chain; `lookup` did
`has` + `get` (two map probes / `hasOwnProperty` pairs per variable read).

**Fix:**

- Check dominant node types first (`Identifier`, `MemberExpression`, `CallExpression`,
  `BinaryExpression`, `NumericLiteral`).
- `EvalContext.lookup`: single `get bindings name` probe instead of `has` + `get`.

**Impact:** V8 ~21.0 → ~17.5 ms.

---

### 3. C++ codegen: `const&` for read-only heavy parameters ✅

**Problem:** `RangerCppClassWriter` passed `std::string`, `std::map`, `std::vector`,
and buffer parameters **by value**. Hot interpreter methods (`lookup`, `has`, `define`,
`evaluateBinaryExpr` operands, …) copied strings on every call.

**Fix:** `cppReadonlyValueParam()` in `ng_RangerCppClassWriter.rgr` — when
`set_cnt == 0` and type is string / map / vector / buffer, emit `const T&`.

**Impact:** C++ ~79.5 → ~73.7 ms.

---

### 4. C++ codegen: map `get` without insert-on-miss ✅

**Problem:** Object-map `get` fell through to `std::map::operator[]`, which **inserts
a null value** on every missing key. Parent-scope variable lookups probe many missing
keys → spurious tree mutations.

**Fix:** `Lang.rgr` — C++ template for generic map `get` emits `r_map_get_val()`
(`find()` + default-constructed value on miss).

**Impact:** C++ combined with #3; correctness fix for lookup semantics as well.

---

### 5. No throwaway `null` placeholders in binary expressions ✅

**Problem:** `evaluateBinaryExpr` initialized `left` and `right` with
`EvalValue.null()` before overwriting them. Binary ops always have both operands —
those two allocations ran on **every** arithmetic/compare expression (~200k per
`initLevel`, ~57 % of all `EvalValue` constructions).

**Fix:** Evaluate `node.left` / `node.right` directly; return `EvalValue.null()`
only when an operand is actually missing.

**Impact:** C++ ~73.7 → ~63.9 ms; V8 also improved.

---

### 6. `@singleton` C++ codegen + pooled immutable constants ✅

**Problem:** `@singleton(true)` was implemented for JS/Swift but **not C++** — call
sites emitted `ClassName::__singleton()` with no definition (compile error). Separately,
`EvalValue.null()`, `undefined()`, and `boolean()` allocated a fresh heap object on
every call.

**Fix:**

- `ng_RangerCppClassWriter.rgr`: emit `static std::shared_ptr<T> __singleton_instance`
  and lazy `__singleton()` (mirrors JS backend).
- `EvalValue.rgr`: `EvalConstPool @singleton(true)` holds shared `null` / `undefined`
  / `true` / `false`; factories return pool entries. Immutable values are never
  mutated in place (`setMember` / `setIndexAt` / `push` guard on `valueType`).

**Impact:** Allocations ~370k → ~118k per `initLevel`. V8 ~16.1 → ~14.9 ms.
C++ wall time neutral (~64 ms) — allocation is cheap here; refcount + dispatch
dominate.

## What we tried and reverted

- **Integer dispatch cache on `TSNode` (`evalKind` / `evalOp`):** no measurable win
  on V8 (~17.5 → ~17.9 ms); reverted to avoid touching shared parser AST.
- **`std::unordered_map` instead of `std::map` (hand-edited bench only):** ~3 % on
  C++; not committed — interpreter binding maps are small; tree vs hash is marginal
  compared to `shared_ptr` overhead.

## Remaining cost (native C++)

After the above, the dominant native cost is the **value representation**:

- every number/string/bool/object/array is a **`std::shared_ptr<EvalValue>`** on the heap
- every expression step does refcount atomics + virtual dispatch through generated C++
- `evaluateExpr` / `evaluateBinaryExpr` recursion depth is high on init-style scripts

Further significant gains likely need a **value-type or arena representation** for
`EvalValue` on the C++ target (and possibly interned small integers), not more
micro-optimizations of the current `shared_ptr` model. That is out of scope for this
incremental branch.

## Regression tests

Unchanged output on:

- [`tsx_engine_demo.rgr`](../scripting/tsx_engine_demo.rgr) — [`tests/tsx-engine.test.ts`](../../../tests/tsx-engine.test.ts)
- [`import_chain_demo.rgr`](../scripting/import_chain_demo.rgr)
- [`game_script_demo.rgr`](../scripting/game_script_demo.rgr) — [`tests/game-scripting.test.ts`](../../../tests/game-scripting.test.ts)

## Related docs

- [`TSX_ENGINE_ISSUES.md`](./TSX_ENGINE_ISSUES.md) — functional bugs and fixes
- [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md) — how hosts load and drive scripts
- `games/ar/index.tsx` (poistettu peli) — real game whose init path the benchmark models
