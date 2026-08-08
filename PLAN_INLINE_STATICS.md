# PLAN: -inline-statics — trivial static forwarder inlining (WIP handoff)

Status: **implemented but unverified**. The compiler rebootstraps cleanly with
the pass compiled in, the flag is strictly opt-in (`-inline-statics`), and no
build uses it yet. Nothing about default compilation changes until the flag is
passed. This document is the handoff for the next session.

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

## Verification state — what the next session must do

1. **Probe test is UNFINISHED.** Scratch probe (a Bridge class + forwarders,
   compiled with and without the flag, outputs diffed) kept failing to
   compile in the BASELINE (no flag) — the probe's own Ranger syntax for
   multi-arg static calls in print/def positions was wrong, not the pass.
   Write the probe as plain def-position statements
   (`def s:int (Bridge.add2(x y))` style — mirror engine sources), get the
   baseline green FIRST, then diff flag-on vs flag-off generated es6 and
   check the call disappeared (grep for `Bridge.add2` / `isUndefined(`).
2. `npm test` / compiler feature tests (tests/, feature_tests.rgr) without
   the flag — prove the default path is untouched (the rebuildWithType
   extension runs on any `nodes`-lane match, so `defn` tests matter).
3. Engine es6 build WITH `-inline-statics` added to
   scripts/build-engine-module.sh (temporarily) → `npm run test:runtime`
   (1327 must hold). Use `-show-inline-statics` once to eyeball expansions.
4. Native builds with the flag (add to bench/zoo_octane/build-native.sh
   RANGER invocation) → conformance-native.cjs on both targets
   (1297/1303, 0 crashes must hold).
5. Perf: interleaved fixed-work timing, **Rust** binary before/after the flag
   (scratchpad fixed/ suite; method/richards rows). C++/es6 expected flat.
6. If green and Rust wins: leave the flag ON in the two engine build scripts
   and document in RESULTS.md; otherwise keep opt-in and record numbers.

## NEXT LEVER (user directive): fold shape-case type tests

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

- The designated perf branch is `claude/ranger-performance-improvements-uy9a2n`
  (conformance round pushed as 4a52458). THIS work is parked on its own
  branch so it can be verified independently — do not merge until the full
  battery above is green.
- Never trust a build ran from the wrong cwd; build scripts must run from
  the repo root; check artifacts, not exit codes.
- All perf claims: interleaved fixed-work wall time only (RESULTS.md
  discipline).
