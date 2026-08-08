# Bytecode tier for ComponentEngine — design plan

Status: phases 1–3, 5 and 6 are IMPLEMENTED (`bcEnabled` on by
default), and phase 4's statement tail largely so: try/catch (no
finally), throw, for-in, for-of, do-while and unlabelled
break/continue all compile, each mirroring the walker's own machinery
(shared key-snapshot/item-normalisation helpers, a handler stack the
throw sites unwind through, catch parameters as slots gated on a
conservative name-escape scan). finally, labels, switch and
destructuring stay on the walker. Call sites carry an identity-keyed
inline cache: the op-20 guard ladder runs once per (site, function
identity) — every laddered property except the mutable
`__fnprotocall__` own-data marker is immutable on a function value,
and that one is re-probed on every hit. Fixed work: C++ fib
105→79 ms, Rust 107→86 ms. The member-op follow-up landed too:
`memberFastAt`/`chainAccessorFreeAt` fuse the accessor probe and the
data walk into one bag-level chain pass (the bag holds its prototype,
so no per-link wrapper mints), guarded by the monotone
`everHadAccessor` flag; ops 30/31 run it inline. C++ richards
−21% interleaved. The profile-guided follow-up added the string-method
registry IC on call_method sites (epoch-validated, entering
invokeBuiltin past its override probe) and the single-probe bag read:
method row −67%, richards a further −18.5%. Remaining levers:
property-name interning (atom → pointer-compare map keys) and
shape/slot-offset storage — both backend-level redesigns — plus the
refcount churn (~5% of instructions in shared_count teardown) that a
borrowed-handle discipline in the VM loop could cut. The plan below is
kept as written; the phase list at the bottom records what each landed
phase measured. Originally written after the PR #541 optimization rounds
took the C++ tree-walker from 63× to ~12× of QuickJS on
the micro geomean and the profiles went flat — no line above ~4%. What is
left is the *shape* of a tree-walker: AST dispatch per visit, a heap handle
per value, a name touch per identifier. QuickJS pays none of those in its
inner loop, and its whole mechanism is small enough to copy honestly:
functions compile once into a flat instruction stream, locals become vector
slots, and one loop dispatches on integer opcodes (see the decoded `fib`
listing at the bottom).

The plan is a TIERED engine, not a rewrite: a bytecode compiler + VM that
accepts a *proven subset* of function bodies, with the existing tree-walker
as the always-correct fallback. That is the same discipline every
optimization in this engine already follows — a memoised static gate, a
fast path, and semantic parity as the invariant — applied one level up.

## Why tiering, concretely

- The engine is ~20k lines of working, conformance-tested semantics
  (1281-case runtime suite). A big-bang VM would re-implement all of it
  before passing anything.
- The subset that dominates benchmarks and real component code is small:
  arithmetic, locals, calls, member access, loops, branches. Compile that;
  leave `with`, direct `eval`, generators-when-they-exist, destructuring
  and try/catch to the walker until a later phase.
- Compiled and interpreted functions must call each other freely. They
  already can: every call funnels through `callFnValueWithValues` /
  `callUserFunctionNode`, so the tier check is one memoised branch there.

## Architecture (all Ranger, `migrate/src`)

Three new pieces, one registry:

```
class BcProgram {
    ; One i32-wide op plus one i32 operand per instruction, parallel
    ; arrays. Wasteful per byte and FAST per fetch on every Ranger
    ; target: no variable-length decode, no byte splitting, and the C++
    ; build reads two contiguous int vectors.
    def ops:[int]
    def args:[int]
    ; Constant pools. Doubles and strings are indexed by the operand;
    ; small ints can ride the operand itself (op decides).
    def constNums:[double]
    def constStrs:[string]
    ; Property/global names touched by name-carrying ops (get_field,
    ; get_name). Atom table, engine-local.
    def atoms:[string]
    ; Nested function nodes (fclosure operand indexes this).
    def fnNodes:[TSNode]
    def paramCount:int 0
    def localCount:int 0     ; params + hoisted vars, slot-indexed
    def localNames:[string]  ; slot -> name, for closures and debugging
    def stackSize:int 0      ; computed max operand-stack depth
}

class BcCompiler {
    ; Walks ONE function body. Returns true and fills `prog`, or false =
    ; "not compilable" (memoised on the TSNode, never retried).
    fn compileFunction:boolean (fnNode:TSNode prog:BcProgram) { ... }
}

; In ComponentEngine:
def bcPrograms:[BcProgram]        ; id -> program (TSNode carries the id,
                                  ; same pattern as numCacheId / litValues)
def bcStack:[EvHandle]            ; ONE shared operand+locals stack,
def bcSp:int 0                    ; frames are [base .. base+localCount+stack)
fn runBytecode:EvHandle (prog:BcProgram args:[EvHandle] closureCtx@(optional):EvalContext thisVal:EvHandle) { ... }
```

TSNode gets two memo fields (parser side, like `argScanned`):
`bcScanned:boolean`, `bcProgramId:int (0 - 1)`.

## Instruction encoding decision

Parallel `[int]` arrays — `ops[pc]` + `args[pc]` — instead of a byte
stream. Rationale, in order:

1. Ranger has no `uint8` array that lowers well everywhere; `[int]` is a
   `std::vector<int64_t>` on C++, `Vec<i64>` on Rust, plain array on es6.
2. Fetch is `(itemAt ops pc)` — one bounds-checked index, no shifting.
3. Jump patching is trivial (write `args[site] = target` after the fact).
4. The memory cost (16 bytes/instruction on C++) is irrelevant next to a
   single retained EvHandle.

The VM loop is a `while` over `pc` with an int if-chain on the opcode —
exactly the dispatch the `nodeKindOf` split proved cheap once the memo hit
inlines. Ordering the chain by measured frequency matters and is free.
(A Ranger `switch` lowering to a C++ `switch`/jump table is a compiler
follow-up that would help every target; not required for v1.)

## Opcode set v1 (~40 ops)

Stack machine, QuickJS-shaped. `A` is the i32 operand.

| Group | Ops | Notes |
| --- | --- | --- |
| consts | `push_num A` (constNums), `push_int A` (operand IS the value), `push_str A`, `push_undef`, `push_null`, `push_true`, `push_false` | numbers mint via the existing smallInt pool |
| locals | `get_loc A`, `put_loc A`, `bump_loc A` (i++/i-- statement form) | slot = frame base + A; params are slots 0..paramCount-1 |
| outer names | `get_name A`, `put_name A` (atoms) | falls back to the closure/module context chain BY NAME — the interop escape hatch; the param-slot-vector work is what makes outer frames answer these cheaply |
| this | `push_this` | slot-bound at entry only when the existing `fnNeedsThis` scan says so |
| arith | `add`, `sub`, `mul`, `div`, `mod`, `neg`, `inc`, `dec` | number×number inline; anything else calls the existing value-level helpers (`jsAddValues` etc., extracted from `evaluateBinaryExpr`) so semantics stay single-sourced |
| compare | `lt`, `le`, `gt`, `ge`, `eq`, `ne`, `seq`, `sne` | same split: fast number path inline, helper otherwise |
| logic | `not`, `to_bool` | `&&`/`||`/`??` compile to jumps |
| control | `goto A`, `if_true A`, `if_false A`, `ret`, `ret_undef` | absolute targets |
| calls | `call A` (A = argc; stack: fn, args…), `call_method A` (stack: obj, args…; atom in next `method_name A` prefix or fused operand), `new A` | all route into `callFnValueWithValues` / the existing method dispatch, so the inline caches, registry and epochs keep working unchanged |
| members | `get_field A`, `put_field A` (atoms), `get_elem`, `put_elem` | delegate to the existing member read/write helpers (getters, protos, arrays by index — all preserved) |
| stack | `dup`, `drop`, `swap` | |

Explicitly NOT in v1 (compile gate rejects the body): closures *created*
inside the body (`fclosure` is v2), `try/catch/finally`, `throw`, `with`,
direct `eval`, `arguments` (existing scan), destructuring, `for-in/of`,
labels, getter/setter *definitions*, class bodies. A call that throws
inside a compiled body unwinds correctly anyway: the engine's `scriptThrew`
flag is checked after every `call*`/member op and the VM bails out to
`ret`, which is exactly what an uncatching walker frame does today.

## The compile gate

`bcCompilableFor(fnNode)` (memoised) = the params pass `paramSlotsOkFor`
(plain names, no dupes, no `arguments`/`eval` in reach) AND every statement
and expression in the body is on the v1 whitelist AND every local is a
hoisted plain `var`/param (no block-scoped shadowing in v1). The compiler
itself IS the gate: it walks the body emitting; the first unsupported node
aborts, memoises "no", and the function stays on the walker forever. No
flag-day, no behavior cliff — `richards.js` methods compile, an eval-using
test262 case does not, both keep passing.

Name resolution at compile time mirrors the runtime scan: a name that is a
param or hoisted var of THIS function → slot index; anything else →
`get_name` atom (outer scope, module, global — resolved by the existing
chain walk with its existing memos). This is sound because the gate
guarantees no `with`/`eval` can reshape this function's own scope.

## Frames without EvalContext

A compiled call allocates NO EvalContext: locals live in the shared
`bcStack` at `[base, base+localCount)`, operands above them, `bcSp`
restored on return. That deletes, per call: the pooled-frame acquire, two
map/vector clears, the param binds, and the `this` insert — everything the
per-call profiling rounds were shaving one slice at a time.

Interop rules that make it safe:

- CALLING OUT: compiled → walker calls work unchanged (the callee builds
  its own context as today; the caller's frame is invisible to it, which
  is correct because v1 bodies contain no closure creation and no eval —
  nothing can NAME the compiled frame's locals from outside).
- CALLING IN: walker → compiled goes through the same
  `callFnValueWithValues` entry; it checks `bcProgramId >= 0` and runs the
  VM instead of binding a context. `closureCtx` (the captured cell chain)
  is carried for `get_name`/`put_name`.
- Recursion depth: `bcStack` grows by `localCount + stackSize` per frame;
  the engine's existing `callDepth` guard still applies.

## What this does to memory

The zoo/Richards episode (identity-registry retention, source-text-copying
bound clones) was fixed in the walker, but the bytecode tier removes the
remaining churn class: a compiled frame's locals are slots, so most values
never get a per-visit wrapper at all, and `call_method` can keep the
receiver on the stack instead of minting a bound clone for the common
monomorphic case (v2, after the IC learns method targets).

## Phases, each independently shippable and gated

1. **Compiler + VM for the fib/loop shape** — arithmetic, locals, if,
   for/while, return, direct calls. Gate: 1281 suite with the tier ON,
   micro answers, A/B flag (`bcEnabled`) for differential runs. Expected:
   `fib`/`loop` drop from ~18/12 ms toward low single digits (the walker's
   per-call and per-visit costs are the majority of both rows).
2. **Members, indexed access, method calls, strings** — `array`, `strcat`,
   `method` rows; Richards' scheduler methods compile. The member ops
   delegate to existing helpers, so the epochs/ICs stay authoritative.
3. **fclosure + var_refs** — closures created inside compiled bodies:
   materialize an EvalContext lazily ONLY when a closure captures (the
   escape analysis for this exists — it is the frame-pool gate inverted).
4. **try/catch, for-in/of, destructuring** — walker parity for the long
   tail, driven by whatever the conformance suite still routes to the
   walker at that point.
5. **Value representation** — DONE. Tagged slots, laid out as parallel
   lanes rather than a slot struct: `bcTags:[int]` (0 REF / 1 NUMBER /
   2 BOOLEAN / 3 UNDEFINED / 4 NULL), `bcNums:[double]`, with `bcStack`
   as the REF lane. Numbers and booleans flow between compiled ops as
   raw doubles; an EvHandle is minted only where a value crosses into
   walker territory (`bcSlotBox`) and walker results unbox on the way
   in (`bcSlotPut`). Numeric literals ride a per-program `constNums`
   double pool (`push_dnum`, op 3) instead of interned value objects.
   The invariant that makes the inline nullish equality sound: a tag-0
   slot never holds a number/boolean/undefined/null handle — bcSlotPut
   unboxes all four. Fixed-work results (10 reps/process, best of 3,
   identical outputs, same machine): C++ `loop` 55→21 ms, `strcat`
   26→18 ms, `array` 257→228 ms, `fib` 132→121 ms; Rust `loop`
   103→22 ms, `strcat` 42→22 ms, `array` 338→274 ms, `fib` 148→121 ms.
   `object`/`method` rows are flat — they are bound by property-map and
   dispatch machinery, not value minting — which is why Richards and
   DeltaBlue scores do not move. Conformance: es6 1281/1281 with the
   tier on; C++ and Rust native failure sets bit-identical to the
   pre-phase-5 build. The remaining allocation in compiled code is the
   call boundary (args/results box through `callFnValueWithValues`),
   which phase 6 takes.
6. **Direct VM→VM calls** — DONE. `call` (op 20) short-circuits to
   `bcTryDirectCall` when the callee slot holds a plain user function
   with a compiled body: argument lanes copy straight into the callee
   frame, the result returns through the `bcRet*` lanes, and nothing at
   the boundary boxes. The guard ladder mirrors
   `callFnValueWithValues`'s checks exactly; builtins, bound functions,
   constructors, eval values and argc > paramCount fall back to the
   generic path. The walker call-in uses the same slot protocol
   (bcSlotPut per argument, bcRetBox once on exit). Two walker-parity
   fixes shipped with it: compiled member reads/writes on
   null/undefined throw the walker's TypeError (they answered undefined
   before), and `?.` is gate-rejected so optional chaining keeps the
   walker's short-circuit. `fib` −19% from the pre-phase-5 base on both
   native targets; C++ splay score 3 → 136 (parity with es6/Rust).
   Phase 6b extends the same treatment to method calls: op 32 resolves
   the member once (bcCallMethod's canProps/getMember prefix) and
   direct-calls a compiled body with the receiver as `this`; resolved
   builtins and non-compilable functions complete through the resolved
   value without a second lookup. Array push/pop run under the walker
   IC's epoch guards with raw-double stores, and dense numeric element
   reads/writes never mint a handle (arrayItemNumOrNaN /
   setIndexNumberAt). Remaining levers: an identity-keyed IC on op
   20/32 so the guard ladder is paid per site rather than per call, and
   phase 4's long tail (try/catch, for-in/of).

## Testing discipline

- The 1281-case suite runs with the tier enabled — every case whose
  functions compile exercises the VM; the rest regression-test the gate.
- A differential mode runs each case walker-only vs tier-on and diffs
  output (the harness already captures both paths' answers identically).
- Per-phase probes mirror the ones this branch used: stored closures,
  `this` edge cases, spec evaluation order, throw-mid-expression.
- `vs_quickjs.cjs` and the zoo matrix are the scoreboard; RESULTS.md rows
  get a tier column.

## Appendix: the target, made concrete

QuickJS compiles our benchmark's `fib` body to 18 instructions (decoded
from `qjsc` output; `get_arg0` is one byte reading `arg_buf[0]`):

```
get_arg0; push_2; lt; if_false8 +3; get_arg0; return
get_var fib; get_arg0; push_1; sub; call1
get_var fib; get_arg0; push_2; sub; call1
add; return
```

v1 of this plan emits the same program shape — `get_loc 0; push_int 2;
lt; if_false L; get_loc 0; ret; get_name fib; …` — with EvHandle values
and helper-backed operators. Phase 5 closes the value-representation gap.
Even QuickJS pays an atom-keyed `get_var fib` per recursion; parity does
not require magic, just not paying for what a body provably cannot observe.
