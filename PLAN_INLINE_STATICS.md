# PLAN: -inline-statics — trivial static forwarder inlining

Status: **verified correct, but it does not pay on the current benchmarks.**
Keep it opt-in. The flag is `-inline-statics`; no build passes it. See
"Verification results" for the numbers and "Why it does not pay yet" for what
would have to change first.

## Verification results (2026-08-13)

**Correctness — passes everything.**

| Check | Result |
|---|---|
| Probe: 11 values, flag on vs off | identical; eligible forwarders gone from output |
| Default path unchanged | engine es6 module **byte-identical** (1 160 345 B) built by the old compiler vs the new one without the flag |
| es6 engine built WITH flag (785 expansions) | runtime conformance **1327/1327** |
| C++ engine built WITH flag | **1297/1303, 0 crashes** — failure set identical to baseline |
| Rust engine built WITH flag | **1297/1303, 0 crashes** — failure set identical to baseline |

The probe (scratchpad `inl/probe.rgr`) covers the guards specifically: an
expression argument with a side effect (`Bridge.add2((h2.bump()) y)`) stays a
call and the side effect happens exactly once; a multi-statement body stays a
call; a cascade (`add3` calling `add2`) expands both levels; a bare-atom body
(`return v.kind`) is correctly left alone. Generated es6 confirms
`Bridge.isUndefined(h)` → `h.isUndef()` and `Bridge.add3(x, y, k)` →
`(x + y) + k`.

Rust codegen does what the pass was written for — the forwarder's `Rc` clone
disappears:

```
before:  if EvValueBridge::isNull(v.clone()) || EvValueBridge::isUndefined(v.clone())
after:   if v.borrow().isNull() || v.borrow().isUndefined()
```

Generated Rust: `EvValueBridge::` call sites 1230 → 949; total `.clone()`
7761 → 7554 (−207).

**Performance — no measurable win.** Interleaved A/B, same compiler binary
with only the flag differing, best-of-9, fixed-work suite:

```
              Rust                    C++ (control)
loop      28 → 28ms   +0.0%       21 → 21ms   +0.0%
fib       83 → 84ms   +1.2%       73 → 73ms   +0.0%
strcat    25 → 24ms   −4.0%       17 → 18ms   +5.9%
array     78 → 77ms   −1.3%       64 → 61ms   −4.7%
object   175 → 173ms  −1.1%      121 → 114ms  −5.8%
method   269 → 263ms  −2.2%      200 → 205ms  +2.5%
regex    527 → 524ms  −0.6%      483 → 453ms  −6.2%
```

Rust mean ≈ −1%. The C++ column is the control: g++ already inlines these
through `const rg_ptr<T>&`, so it *cannot* benefit, yet it swings ±6%. That
is the container's noise floor, and the Rust effect sits well inside it.
**No perf claim is justified from this data.**

## Why it does not pay yet

Of the 785 expansions in the engine build:

- **568 are `tagged*` constructors** (`taggedUndefined` 218, `taggedNull` 111,
  `taggedString` 64, …). These take no handle, so there was never a clone to
  save — expanding them only removes a call the native compiler was already
  going to inline.
- **211 are `is*` predicates** taking a handle — these are the ones that drop
  the `Rc` clone (matching the −207 measured).
- 6 other.

Those 211 sites live in the **tree-walker** paths. The bytecode VM tier built
over the previous rounds deliberately bypasses exactly those paths on hot
code, so a large static-count reduction buys almost no dynamic-count
reduction on this suite.

Before investing further, **profile where the `is*` / shape-case predicates
are actually executed** (the callgrind recipe in BYTECODE.md: build a plain
`-O3` twin, since valgrind cannot decode `-march=native` AVX-512). If they do
not appear hot, neither this pass nor the shape-case folding below will move
these benchmarks, and the effort belongs elsewhere.

## Recommendation

Keep the flag, opt-in and off by default. It is proven correct and provably
inert when unused (byte-identical output), it is the enabling half of the
shape-case lever below, and it may matter on walker-heavy workloads that the
fixed-work suite does not represent. Do not enable it in the engine build
scripts on the strength of the current numbers.

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

## How to re-run the verification

All of it is reproducible; scratchpad helpers are listed in case they are
gone (they live in a session temp dir, so assume they are).

1. **Probe** — write a class with eligible and ineligible statics, compile
   twice, diff outputs. Call syntax must mirror engine sources:
   `def s:int (Bridge.add2(x y))`, args space-separated inside the parens.
   Include an expression argument wrapping a side effect to prove it stays a
   call and fires once.
2. **Default-path byte identity** — extract the pre-change compiler
   (`git show <base-branch>:bin/output.js > old-output.js`), place it in
   `bin/` so its lib resolution works (it needs `Lang.rgr`/`stdops.rgr`
   beside it *and* `lib/stdlib.rgr` via the install dir — running it from a
   temp dir fails with "Could not import file stdlib.rgr"), build the engine
   module with both compilers, `diff`. Must be identical.
3. **es6 with the flag** → `npm run test:runtime` (1327).
4. **Natives with the flag** → conformance-native.cjs both targets
   (1297/1303, 0 crashes).
5. **Perf** — interleaved A/B, same compiler binary with only the flag
   differing (NOT old-compiler vs new-compiler, which confounds).

Two traps hit during this verification, both worth knowing:

- `-d=<absolute path>` is resolved **relative to cwd**: passing
  `-d=/tmp/foo` writes to `/home/user/Ranger/tmp/foo`. Read the "Saving
  results to path" line rather than assuming.
- A native binary copied aside as a "baseline" was found to SIGILL when run
  later, while the C++ one from the same moment was fine. Do not trust a
  stashed binary — rebuild the baseline from source with the same compiler
  and the flag removed. That is the better comparison anyway.

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
around body).

**Profile first, though.** The measurement above is a caution against
assuming these are hot: 211 predicate call sites were removed from the
generated Rust and the benchmarks did not move. The shape-case folding
targets the *same* predicates one level down, so if they are not hot it will
not move them either. The cheap discriminator is the callgrind recipe in
BYTECODE.md (plain `-O3` twin binary — valgrind cannot decode `-march=native`
AVX-512): look for the `is*` / case-narrowing helpers in the profile. If they
are not near the top, the honest conclusion is that the VM tier already
bypasses this code on hot paths and the next lever should come from the
profile instead — BYTECODE.md's own remaining list names property-name
interning (atom → pointer-compare keys), shape/slot-offset storage, and the
refcount churn (~5% of instructions in `shared_count` teardown) that a
borrowed-handle discipline in the VM loop could cut.

## Invariants for whoever continues

- The designated perf branch is `claude/ranger-performance-improvements-uy9a2n`
  (conformance round pushed as 4a52458). THIS work is parked on its own
  branch. It is correctness-clean and safe to merge as an opt-in flag, but it
  should not be turned on in any build without a profile justifying it.
- Never trust a build ran from the wrong cwd; build scripts must run from
  the repo root; check artifacts, not exit codes.
- All perf claims: interleaved fixed-work wall time only (RESULTS.md
  discipline). Note the noise floor measured here: ±6% on this container,
  established from a control that provably cannot benefit.
