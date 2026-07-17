# Ranger WASM lambdas / closures — plan & feasibility

This document plans how to compile Ranger lambdas (`(fn:… (args){body})`) and
closures (`{ … }`) to WebAssembly on the freestanding WAT backend. It builds on
the memory-management runtime already in place ([`PLAN_WASM_MEMORY.md`](./PLAN_WASM_MEMORY.md)):
the free-list heap, reference-counted objects, typedesc-driven recursive field
release, and the wasm-global mechanism added for singletons. **The closure
environment is just an RC object** — so most of the hard lifetime work is already
solved and reused, not reinvented.

## 0. Where things stand today

On the LLVM/WAT path lambdas are **from zero**: the LowIR builder lowers nothing
for a lambda — the body is not emitted, and a call to a lambda-typed local is
dropped entirely (`f(21)` produced an empty `run()` that just returned `$fn`, an
undefined reference). The native/es6/C++ backends support lambdas; the WAT
backend never did.

**What the frontend already gives us (reusable):**
- Each lambda is a `RangerAppFunctionDesc` with `is_lambda = true`, its `fnBody`
  (`node.children[2]`), params (from `node.children[1]`), and return type
  (`node.children[0]`), pushed to the enclosing method's `currM.myLambdas`
  (`ng_RangerFlowParser.rgr:EnterLambdaMethod`).
- The lambda is parsed under `subCtx.is_capturing = true`; the lambda value node
  is `RangerNodeType.ExpressionType` carrying the signature in `expression_value`,
  and a call through it is flagged `node.has_lambda_call = true`.

**What is missing and must be built:** function hoisting into the module, a wasm
function **table** + **`elem`** + **type signatures**, **`call_indirect`**, a
representation for lambda values, capture-set analysis, and the closure
environment (with RC of captured objects). No wasm function-pointer machinery
exists in `ng_WATWriter.rgr` yet.

## Tiivistelmä (FI)

Lambdat ovat WAT-backendissä nollasta. Frontend antaa valmiiksi lambda-rungon
funktiokuvauksena (`myLambdas`), joten runko on nostettavissa top-level-wasm-
funktioksi. Puuttuu: wasm-funktiotaulu (`table`/`elem`/`type`) + `call_indirect`,
lambda-arvon esitys, capture-analyysi ja sulkeuman ympäristö. **Avainoivallus:**
sulkeuman ympäristö on tavallinen RC-olio — juuri rakennettu olio-kenttien RC
(retain/move/release + typedesc-tuho) hoitaa napattujen olioiden elinkaaren, eli
käyttäjän esiin nostama ongelma (napattu olio vapautuu ennenaikaisesti vaikka
lambda vielä viittaa siihen) ratkeaa suoraan: ympäristö **retainaa** napatut
oliot ja **releasee** ne kun sulkeuma tuhoutuu. Kolme tasoa: (1) ei-nappaavat,
(2) nappaa mutta ei mutatoi, (3) nappaa ja mutatoi (laatikointi + RC). Yksisäikeinen
WASM ⇒ ei lukituksia; ainoa hankala osa on muistin elinkaari, joka on jo ratkaistu.

---

## 1. The three levels (matching the problem statement)

### Level 1 — non-capturing lambdas (easiest)
The body references only its own params and globals — no free variables from the
enclosing scope. Example: a comparator `(fn:int (a:int b:int) { return (- a b) })`.
The value is simply **the function's table index**; the call is a `call_indirect`.
No environment, no RC beyond the normal call. This is the foundation.

### Level 2 — capture by value, read-only (second easiest)
The body reads outer variables but does not mutate them, e.g. a threshold in
`filter(xs { return (v >= threshold) })`. Capture = **copy** the captured
primitives/strings into an environment at closure-creation time; **retain** any
captured object (so it survives as long as the closure). The body reads from the
environment. Because the lambda never writes them, a snapshot copy is correct.

### Level 3 — capture and mutate (hardest, and the useful one)
The body writes an outer variable and the write must be visible outside the
lambda (or shared across invocations) — the event-handler pattern: "wait for an
event, then set properties on an object captured from the enclosing scope."
Two sub-cases:
- **Mutated captured local of value type** (`count = count + 1`): the variable
  must be **boxed** — moved to a heap cell that both the outer scope and the
  closure reference, so both see the same value.
- **Mutated captured object** (`entity.hp = 0` where `entity` was created in the
  enclosing function): the closure holds a **reference** to the object; the write
  goes through that reference. The lifetime hazard the problem statement calls
  out — the object could be freed by its original scope while the closure still
  holds it — is solved by RC: **the environment retains the object on capture and
  releases it when the closure is destroyed**, so the object lives as long as
  *either* the outer scope or any closure references it.

Single-threaded WASM means **no locking** is needed for level 3 — the only hard
part is allocation/lifetime, which the existing RC runtime already handles.

---

## 2. Core design

### 2.1 Lambda value representation — a closure record (RC object)
Represent every lambda value uniformly as a pointer to a small **closure record**
allocated with `ranger_obj_new` (so it *is* a reference-counted object):

```
Closure (RC object body):
  [ fn_index : i32 ]        ; table index of the hoisted body
  [ captured field 0 ]      ; env: copies / boxes / retained object refs
  [ captured field 1 ]
  ...
```

- Its **typedesc** marks captured-object fields `owned` (kind 1) and boxed-cell
  fields `owned` — so `obj_release(closure)` → `obj_destroyFields` → releases
  every captured object / box **for free**, reusing the object-field RC just
  built. Captured value copies (int/f64) are non-owned and need no release.
- A **non-capturing** lambda (Level 1) is the degenerate case: a closure record
  with only `fn_index` and no env fields (or, as an optimisation, a bare `i32`
  index with no allocation — see §4).

### 2.2 Hoisted body + hidden env parameter
Each lambda body is lowered as a top-level LowIR function
`<enclosingMangled>__lambdaN`, taking the **closure pointer as a hidden first
parameter** (`%__env`), followed by the declared params. Free-variable reads/
writes in the body are rewritten to load/store through `%__env` at the field
offset assigned during capture analysis.

### 2.3 Calling a lambda value
`f(args)` where `f` is a lambda-typed local/param lowers to:
```
env      = f                       ; the closure pointer
fn_index = load [env + 0]
call_indirect (type $sig)  env  args…  fn_index
```
`$sig` is the wasm function type `(param i32 <declared params…>) (result …)` —
the hidden env `i32` plus the declared signature.

### 2.4 New wasm module machinery (in `ng_WATWriter.rgr`)
- `(table $lam funcref (elem $lam0 $lam1 …))` — one table of all hoisted lambda
  functions (and any function whose address is taken).
- `(type $sig_… (func (param …) (result …)))` — one per distinct call_indirect
  signature; deduplicated. `call_indirect` references the type index.
- New LowIR ops mirroring the singleton work: `func_ref <name>` → the table index
  of a hoisted function (an `i32`), and `call_indirect <typeIndex> <args…>`. The
  writer emits `i32.const <index>` for `func_ref` (resolved from an
  `elemIndex[name]` map, exactly like `typedesc_ptr`/`str_ptr` addresses) and
  `call_indirect (type $sig_…)`.

### 2.5 Capture analysis
Walk the lambda body; a **free variable** is any VRef that resolves to a local/
param of an enclosing method (not a param of the lambda, not a class field via
`this`, not a global). For each:
- classify as **value** (int/f64/bool → copy), **string** (copy = dup, owned),
  **object** (retain, owned), or **mutated** (needs a box).
- assign it an env field offset; record kind for the closure typedesc.

**Good news — the capture set is already computed by the frontend.**
`RangerAppWriterContext` has `is_capturing` + `captured_variables:[string]`;
while parsing a lambda body every reference to an outer local is appended to
`captured_variables` (`ng_RangerAppWriterContext.rgr:858`), and the set is
exposed on the lambda node as `node.lambda_ctx.captured_variables` (used by the
existing es6/C++ closure codegen, `ng_RangerFlowParser.rgr:3640`). Nested
capture ("2nd tier") is handled too. So the IR pass **reads** the capture set
rather than computing free variables from scratch — it only needs to classify
each name (value/string/object/mutated) and lay out the env. Mutation can be
detected from whether the body assigns the captured name.

### 2.6 Boxing mutated captures (Level 3, value-typed)
A mutated captured value-local is promoted to a **heap cell** (a 1-field RC
object, or a raw `Heap_alloc(4/8)`): the enclosing scope's reads/writes and the
closure's reads/writes both go through the same cell pointer, which is captured
(retained) in the env. On scope exit the cell is released; the closure's env also
holds a reference, so it survives until the closure is released. (Captured
*objects* are already references — no extra box; only value-typed mutated locals
need boxing.)

---

## 3. Implementation phases

> **Status: L0–L3 implemented and tested** (`runtime/wasm/lambda_demo.rgr` +
> `lambda_test.mjs`, 19 assertions). Non-capturing calls/callbacks, read-only
> capture (value/string/object), object mutation (event-handler pattern), and
> boxed value mutation all work and are leak-free; the native/freestanding
> non-`-wasmrc` path is byte-identical (ranger_autopeli `logic.wasm` unchanged).
> L4 (bare-index / stack-alloc optimisation, f64 capture, `this`-capture) is the
> remaining optional polish.

- **Phase L0 — infrastructure (no captures yet).**
  Hoist every `myLambdas` body as `…__lambdaN(%__env, params…)`; emit the wasm
  `table`/`elem`; add `func_ref` + `call_indirect` LowIR ops and their WAT
  emission; collect+dedup `(type …)` signatures. Lower a lambda expression to a
  closure record with just `fn_index`; lower `f(args)` to `call_indirect`. Target
  test: a directly-called and a passed-as-callback **non-capturing** lambda.

- **Phase L1 — non-capturing callbacks end-to-end.**
  A function taking a `(fn:…)` param calls it via `call_indirect`; a lambda
  literal passed as that arg materialises its closure record. Reuse the RC path
  so the closure record is freed at scope end (empty env → destroyFields no-op).

- **Phase L2 — capture by value (read-only).**
  Capture analysis + env layout + closure typedesc; rewrite body free-var reads
  to `[%__env + off]`; copy value/string captures and retain object captures at
  creation. `obj_release(closure)` frees the retained captures (object-field RC).

- **Phase L3 — capture + mutate.**
  Box mutated value-typed captures into shared heap cells; route both sides
  through the cell. Object mutation already works via the retained reference.
  This delivers the event-handler pattern safely: **the object survives as long
  as the outer scope OR the closure holds it**, with no double-free (RC), and no
  locking (single-threaded).

- **Phase L4 — polish.**
  Optimise non-capturing lambdas to a bare index (skip the heap record) when the
  value never needs a uniform representation; escape analysis to stack-allocate
  closures that never outlive their creating frame; document the cycle caveat
  (a closure capturing an object that transitively references the closure leaks,
  same RC limit as elsewhere).

---

## 4. Key decisions & trade-offs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Value representation | Uniform heap **closure record** (RC object) | Reuses object-field RC for captured-object lifetimes; one code path. Bare-index fast path for non-capturing is a Phase-L4 optimisation. |
| Env parameter | Hidden first arg `%__env` | Standard closure-conversion; avoids per-lambda global state; re-entrant. |
| Captured object lifetime | **Retain on capture, release on closure destruction** | Solves the problem statement's premature-free hazard; RC frees the object once, when neither scope nor closure holds it. |
| Mutated value capture | **Box** into a shared heap cell | The only way the outer scope and the closure observe the same mutation. |
| Locking | **None** | WASM is single-threaded; only allocation/lifetime is hard, and that is RC. |
| Cycles | Leak (documented) | Same inherent RC limitation as object graphs; never corrupts. |

## 5. Risks & unknowns

1. ~~**Capture-set source.**~~ **Resolved:** the frontend already records the
   captured names (`captured_variables` / `node.lambda_ctx.captured_variables`,
   including nested capture), so L2–L3 read the set instead of computing it. The
   remaining IR work is classification (value/string/object/mutated) + env
   layout, not free-variable analysis.
2. **Type-signature plumbing.** `call_indirect` needs a correct wasm `(type …)`
   index per distinct signature (incl. the hidden env param and f64 params).
   Dedup + emission is new but mechanical.
3. **Lambda-typed params/returns in the type checker.** The value flows as an
   `i32` (closure pointer) through params, fields, and returns; ensure the LowIR
   type for a `(fn:…)`-typed slot is the pointer type and that
   `is_direct_method_call` vs `has_lambda_call` dispatch is honoured at the call
   site. (Today the WAT path ignores `has_lambda_call`.)
4. **Interaction with the string arena / owned-locals.** A closure stored past
   its creating scope must be treated as escaped (like a returned owned local),
   or it is released too early. Reuse `escapedLocals`.

## 6. Effort estimate

- L0+L1 (non-capturing, table + `call_indirect`): **medium** — the bulk of the
  new machinery, but self-contained and testable in isolation.
- L2 (read-only capture): **medium**, gated on the capture-set question.
- L3 (mutating capture + boxing): **medium-high**, but the memory-safety core is
  already solved by the existing RC — boxing is the main new logic.
- L4 (optimisation): optional.

Recommended order: **L0 → L1 → resolve the capture-set question → L2 → L3.**
Ship L1 (non-capturing callbacks) as a first usable milestone; L3 is the most
useful (event handlers) and is unblocked by the RC runtime already in place.
