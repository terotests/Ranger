# PLAN: -inline-statics — trivial static forwarder inlining

Status: **implemented, verified correct, and NOT worth turning on**. The full
battery below is green — es6, C++ and Rust all keep their conformance scores
with the flag — but the measured speedup is within noise on Rust and small and
mixed on C++. The flag therefore stays strictly opt-in (`-inline-statics`) and
no build script enables it. Nothing about default compilation changes unless
the flag is passed. See "Verification results" for the numbers.

## Why

The interpreter (gallery/game_engine/v2/interp) funnels almost every value
question through EvValueBridge static forwarders:

```
sfn isUndefined:boolean (v:EvHandle) {
    return (v.isUndefined())
}
```

ComponentEngine.rgr alone has ~1200 EvValueBridge call sites. Per target:

- **es6**: V8 inlines these when hot — near-zero cost.
- **C++**: the writer emits `const rg_ptr<EvHandle>&` parameters and the
  whole program is one translation unit at -O3 — g++ inlines them. Near-zero.
- **Rust**: the writer emits OWNED `Rc<RefCell<EvHandle>>` parameters, so every
  call site pays `v.clone()` — a refcount up/down pair per call that LLVM does
  not reliably cancel. **This is the target where the win lives.** Inlining
  `EvValueBridge::isUndefined(v.clone())` into `v.borrow().isUndefined()`
  removes the clone entirely.

## What is implemented (3 edits, all committed on this branch)

1. **compiler/ng_RangerFlowParser.rgr** — `tryInlineTrivialStatic` +
   `inlineStaticEligible` (placed right before `TransformOpFn`), hooked into
   `cmdLocalCall`'s ns>1 branch right after `findFunctionDesc` resolves,
   gated on `ctx.hasCompilerFlag("inline-statics")`.

   Eligibility (deliberately conservative — anything else keeps the call):
   - callee is `sfn` (`m.is_static`), on a non-template class, resolved via
     the plain `Class.name` two-segment shape;
   - body is EXACTLY one `return (expr)` (expression body only);
   - no optional return, no optional/keyword/default params;
   - every name in the body is a parameter, a class-qualified reference, or
     a language operator (bare names from the callee scope ⇒ bail; direct
     recursion ⇒ bail); depth cap 6 for cascades;
   - every CALL argument is a plain bare name (no expressions, no literals,
     no dotted refs) so evaluation order/count cannot change.

   Transform: build a `RangerArgMatch` with param→argNode in the `nodes`
   lane, `retExpr.rebuildWithType(am true)`, `node.getChildrenFrom(newExpr)`,
   `flow_done = false`, re-`WalkNode` in the CALLER's context (types, param
   descs, ref counts recomputed as if the body were written at the site).
   Debug flag: `-show-inline-statics` prints each expansion.

2. **compiler/ng_CodeNodeCompilerExtensions.rgr** — `rebuildWithType` gains
   ns-root substitution: a qualified reference whose ROOT segment matches a
   `match.nodes` binding (`v.isUndefined` with `v` bound) is rebuilt with
   ns[0] replaced and `vref` rejoined — only when the bound node is a bare
   name. Without this the dominant forwarder shape cannot substitute at all
   (`defn` bodies share this limitation today; this extension fixes both).

3. **compiler/VirtualCompiler.rgr** — flag registered in the help list.
   (CLI `-flags` auto-populate `ctx.compilerFlags`; no other plumbing.)

`bin/output.js` on this branch is the rebootstrapped compiler containing the
pass (`npm run compile` was clean).

## Verification results

All six steps ran. Reproduce the native A/B with the `EXTRA_RANGER_FLAGS` hook
added to `bench/zoo_octane/build-native.sh`:
`EXTRA_RANGER_FLAGS=-inline-statics bash .../build-native.sh`.

1. **Probe — green.** A Bridge class of forwarders (`sfn f(b:Box)` →
   `b.method()`), compiled with and without the flag. Runtime output is
   byte-identical; the generated es6 shows exactly the intended rewrite:
   `Bridge.valueOf(b)` → `b.fetchValue()`, `Bridge.plus(b n)` → `b.plus(n)`,
   `Bridge.isZero(z)` → `z.isZero()`. Cascades fold all the way down
   (`Bridge.valueOf2(b)` → `b.fetchValue()`, two levels). The deliberately
   ineligible two-statement forwarder keeps its call. Bridge call sites in
   the output: 12 → 6.
2. **`npm test` — no regression.** 1432 passed, 11 failed. The 11 failures are
   all in `shapes.test.ts` (Rust shape lowering + two writer expectations) and
   reproduce **identically on the base commit** with the four changed files
   reverted — pre-existing, unrelated to this pass.
3. **es6 engine with the flag — green.** 785 expansions
   (`taggedUndefined` 218, `taggedNull` 111, `taggedString` 64,
   `isUndefined` 61, `isNull` 51, `taggedNumber`/`taggedArray` 46 each,
   `taggedObject` 44, `isString` 36, `isNumber` 20, …).
   `npm run test:runtime`: **1327/1327**, same as baseline.
4. **Native with the flag — green.** conformance-native.cjs:
   C++ **1297/1303, 0 crashes**; Rust **1297/1303, 0 crashes**. Both match
   baseline exactly, same six failures (err 2, for/destr/obj/iter 1 each).
5. **Perf — flat.** Interleaved fixed-work wall time, 9 reps, min ms,
   base → flag:

   | script | Rust | C++ |
   | --- | ---: | ---: |
   | arith_big | −0.4% | +3.3% |
   | prop | −2.8% | −5.8% |
   | call | −1.6% | −3.7% |
   | method | −1.9% | −3.9% |
   | typemix | +0.0% | −1.9% |
   | pool_hit | +1.9% | −0.5% |
   | pool_miss | +0.9% | −1.9% |

   Rust is noise in both directions. C++ is a consistent but small win outside
   `arith_big`. Neither justifies turning the flag on by default.

   **Why the Rust win did not materialise.** The generated `octane_runner.rs`
   loses 313 of 1265 `EvValueBridge::` call sites but only **207 of 7761
   `.clone()` calls (2.7%)** — because the highest-count forwarders
   (`taggedUndefined` 218, `taggedNull` 111, `taggedHole` …) take **no
   arguments**, so they never carried an `Rc` clone to begin with. The
   handle-taking predicates that do (`isUndefined`, `isNull`, `isString`,
   `isNumber` — ~200 sites) are the only ones whose clone disappears, and that
   is too small a slice of the total to show up in wall time.
6. **Decision: keep opt-in.** No build script enables the flag. The pass is
   correct and costs nothing when off.

### Known, harmless bail

A forwarder whose body calls a method named exactly `getValue` is never
expanded — `sfn aaa:int (b:Box) { return (b.getValue()) }` bails, while the
identical body with the method renamed (`fetchIt`, `readIt`, `getFoo`,
`getValueX`, `get_value`, …) expands. It is the identifier alone: renaming the
field, changing the callee's body, or moving the forwarder in the class does
not matter. `getValue` is a built-in operator form the serializer emits
(`ng_RangerSerializeClass.rgr` writes `(getValue arr arr_i)`), so the collision
is almost certainly why eligibility rejects it — but that has not been proven,
and the effect is only that an optimisation is skipped, never wrong code.

## NEXT LEVER — DONE, and it won: the `is` operator

**Implemented. See `SHAPES_IS_OPERATOR.md`.** The prediction below held: the
cost was never the call, it was the case machinery underneath it.
`is v _:Shape.Case` is the `case` discriminant test with the binding and the
block removed, so Rust emits `matches!` where it used to emit
`if let … = v.clone()`.

Measured on the interpreter, interleaved wall time: **Rust 16–20% faster on the
Octane suites and 10–19% on the fixed-work micros**; C++ and es6 flat — exactly
the split this document predicted, and the opposite of `-inline-statics`, which
was flat everywhere. Conformance unchanged (1327/1327 es6, 1297/1303 native,
0 crashes).

The original reasoning is kept below because it is what pointed at the fix.

The forwarders bottom out in EvHandle/EvalValue instance methods with this
shape:

```
fn isNumber:boolean () {
    case self n:EvalValue.Number {
        return true
    }
    return false
}
```

That is a TYPE TEST expressed as a case narrowing: bind-and-return-true,
fall-through-return-false. Today it compiles (per target) into the generic
case machinery — on Rust a match with a binding, on C++ a variant
kind check through the case scaffolding — plus a method call to reach it.

The optimization to implement next: **detect this exact body shape**
(single `case self x:Shape.Case { return true }` followed by `return false`,
no other statements, no use of the binding) **and compile it to a direct
discriminant check** with no binding and no call:

- Rust: `matches!(&*self_.borrow().body, union_EvalValue::Number(..))`-shaped
  emission (or whatever the writer's existing kind-test primitive is);
- C++: the variant kind/tag compare the case header already lowers to,
  minus the binding;
- es6: the existing kind-tag field compare.

Recognition can live in the flow (mark the method desc as a pure kind test:
`m.is_kind_test = true`, kind recorded) with each writer emitting its native
tag compare for calls to marked methods — OR as a writer-level peephole on
the method body. Flow-level marking composes with -inline-statics: the
static forwarder inlines to `v.isNumber()`, and the marked instance method
emits as a tag compare — the full chain
`EvValueBridge.isNumber(v)` → `v.isNumber()` → one discriminant load+compare
per test, no calls, no Rc clone.

Search for candidates: `grep -n "case self\|case body" gallery/game_engine/v2/interp/migrate/src/EvalValue.rgr EvHandle.rgr`
(EvalValue.isNumber/isString/isArrayValue/isSet/isMap..., EvHandle wrappers
around body). These sit under EVERY dynamic type dispatch in the engine —
this is the highest-frequency code in the interpreter.

## Invariants for whoever continues

- The perf round this branched from is merged (PR #543, 4a52458). The battery
  above is green, so this branch is mergeable on correctness grounds — but it
  buys no measured speed, so merging it only adds an unused flag.
- Never trust a build ran from the wrong cwd; build scripts must run from
  the repo root; check artifacts, not exit codes.
- All perf claims: interleaved fixed-work wall time only (RESULTS.md
  discipline).
