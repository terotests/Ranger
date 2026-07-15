# Ranger WASM memory management — plan & feasibility (RAII vs GC)

This document evaluates how Ranger's classes and the `new` operator should be
handled when compiling to WebAssembly, and whether the answer is **RAII**,
**reference counting**, or a **garbage collector**. It builds directly on the
existing native/LLVM design in [`PLAN_LLVM_MEMORY.md`](./PLAN_LLVM_MEMORY.md)
and the WAT backend in [`PLAN_WASM_BACKEND.md`](./PLAN_WASM_BACKEND.md).

## Implementation progress (branch: claude/ranger-wasm-memory-rc)

- **Phase 0 — free-list allocator** ✅ `runtime/wasm/ranger_heap.rgr`. malloc/free
  in linear memory (first-fit, split, coalesce, tail-reclaim, OOM-safe). 16/16
  tests.
- **Phase 1 — RC objects** ✅ `runtime/wasm/ranger_obj.rgr`. `[rc|size|type|pad]`
  header, `ranger_obj_new/retain/release`, typedesc-driven recursive field
  release. 10/10 tests.
- **Phase 2 — codegen wiring** ✅ `-wasmrc` flag; `objRcEnabled` gates the object
  path; `lowerNewObject` emits `ranger_obj_new`; owned locals release at scope
  end AND per loop iteration (`releaseLoopBodyOwned`); `x = new` reassignment
  releases the old value. Objects allocated in loops are leak-free (validated to
  50 000 iterations). 7/7 e2e tests. No regressions; native path untouched.

**Usable today:** object-oriented code — `new` of classes with primitive fields,
in loops and nested loops, with automatic deterministic cleanup. This covers
games, entity systems, and object-graph logic.

**Not yet — and the key scoping finding:** strings and arrays/collections are
**not implemented for freestanding WASM at all** — they currently lower to libc
calls (`sprintf`, `strlen`, `ranger_ptrarray_*`) that do not exist in a
freestanding module (wat2wasm rejects `undefined function $sprintf`). So "string
/array RC on WASM" is really *implement the string + collection runtime for
freestanding WASM* (allocation, literals, concat, length, indexing) and *then*
RC — a major multi-phase subsystem, not a small add-on to the object work.
General-purpose programs (parser, tools, the in-browser compiler) need it;
object-based game/logic code does not.

- **Phase 3 — string runtime + RC** ✅ *done*
  - 3.1–3.2 ✅ freestanding WASM string runtime (`ranger_str_*` in
    `runtime/wasm/ranger_obj.rgr`: len/concat/dup/from_int/cmp/release; literals
    in a data segment written by `ng_WATWriter.rgr`; `Mem.loadU8/storeU8` →
    `i32.load8_u/store8`). Concat/to_string/strlen all functional (`str_test` 5/5).
  - 3.4 ✅ **owned-string-local RC.** The compiler tracks owned string locals
    (`ownedStringLocals`) and releases them at scope end and per loop iteration
    via `ranger_str_release` (a no-op for static-literal pointers). Fresh strings
    (concat/to_string/string-call) are owned directly; borrowed initializers
    (literal/VRef/field) are dup'd so the local owns a private copy.
    `lowerStringConcat` also frees its own intermediates (int→string temps and
    fresh nested-concat operands). Reassignment frees the old buffer first. A
    per-frame `"HITS " + n` loop stays heap-flat to 100 000 iterations
    (`str_rc_test` 9/9). Gated on `-wasmrc`; the libc path is byte-unchanged.
  - 3.5 ✅ **statement-scoped fresh-string arena.** Fresh strings built
    mid-expression but never bound to a local — the dominant game pattern
    `host.drawText("SCORE " + n)` — are tracked in `pendingStringTemps` and freed
    at statement end (per iteration in loops, per branch in conditions). Owners
    (assigned local / returned value) *claim* their temp out of the arena so it
    is not double-freed. `churnInline` (concat as a bare call argument) stays
    heap-flat to 10 000 iterations.
  - 3.3 ✅ **comparison + char access.** `==`/`!=` route to `ranger_str_cmp`;
    `charAt`/`substring`/`strfromcode`/`rawbytechar` route to
    `ranger_char_at`/`ranger_substring`/`ranger_str_fromcode`/`ranger_str_frombyte`
    (added to the `ranger` runtime class; substring/fromcode results join the
    arena). `str_rc_test` 25/25. libc path verified byte-unchanged (a `==`
    snippet still emits `strcmp`, not `ranger_str_cmp`).
  - a string-returning *call* result is dup'd (own a private copy) rather than
    move-owned, since the callee's return is a borrow by convention (getters).
- **Phase 4 — typedesc emission + array runtime + RC** 🟩 *4a done*
  - 4a ✅ **typedesc emission + owned string-field release.** The type
    descriptors already built for all targets are now serialised into the WASM
    static data segment (`ng_WATWriter.emitStaticData`: field arrays + 12-byte
    headers `[size|fieldCount|fieldsPtr]`, after the string literals, below the
    heap base). `lowerNewObject` passes the descriptor address to
    `ranger_obj_new` for classes with owned (string) fields, so
    `obj_release → obj_destroyFields` frees each string field (runtime now
    handles kind 0 → `str_release`). String fields carry a dup'd private copy;
    reassignment frees the old buffer first (release-before-overwrite now active
    on the WASM path, not just libc). Fixed a latent `ptr_to_int` gap in the WAT
    writer (identity on wasm) surfaced by the first string-field store. A
    create/destroy loop of an Entity with a `name` field stays heap-flat to
    50 000 iterations, zero live blocks (`field_rc_test` 9/9). Object/ptr-array
    fields stay borrow (owned=0) — no descriptor recursion — to avoid double-free
    of shared/cyclic graphs until borrow analysis promotes true owners.
  - 4b 🟩 **collections on the free-list heap + RC** (ptr-arrays done; maps next)
    - **Allocator unified.** `emitHeapAlloc` routes to the free-list `Heap`
      (`Heap_calloc`) under `-wasmrc`, so collections stop using the leak-forever
      bump pointer — which also *collided* with the free-list control words at
      Mem[0]/Mem[4] whenever a program mixed objects and collections (a latent
      corruption bug, now fixed). `Heap_realloc` (alloc+copy+free) replaces libc
      `realloc` in the push-grow path.
    - **`[int]` and `[T]` arrays are freed** at scope end and per loop iteration
      (`ranger_ptrarray_release`: frees backing store + descriptor; for
      element-owned object arrays, `obj_release`s each element). Pushing an owned
      object local *moves* it into the array (escaped, released once by the
      array); a fresh/borrowed element is retained by `ranger_ptrarray_push_owned`
      to balance. Built as `ranger.ptrarray_*` runtime methods on the free-list
      heap. `coll_rc_test` 11/11 — int and object arrays correct (incl. multiple
      backing grows), and build/use/drop loops stay heap-flat with zero live
      blocks. libc path byte-unchanged (`realloc`, not `Heap_realloc`).
    - `[K:V]` maps already allocate their descriptor/keys/vals from the free-list
      heap (the same `emitHeapAlloc` unification), so a map-using program no
      longer corrupts the heap. They work up to the fixed bucket capacity;
      *overflow beyond capacity recurses infinitely in the open-addressing probe*
      — a pre-existing `RtMap` limitation on ALL targets (libc included), a
      map-growth issue, not a memory one. ⬜ *remaining:* map descriptor/bucket
      release (maps aren't in the owned-release path on any target yet) + growth;
      `[string]` array element release (libc releases elements via `obj_release`
      only, so string elements need a per-element kind in the descriptor).
- **Phase 5 — per-frame arena** ⬜ *optional optimisation, not required for
  correctness* — checkpoint/reset the frontier for frame-scoped temporaries.

Recommended order if continued: Phase 3 (strings) → Phase 4 (typedesc + arrays);
Phase 5 only if profiling shows RC overhead matters in a frame loop.

## Tiivistelmä (FI)

Kysymys oli: RAII vai GC? **Vastaus: kumpaakaan ei tarvitse keksiä uutena.**
Ranger on jo *valinnut* muistimallinsa manuaalisille targeteille — kevyt
viitelaskenta (RC) + staattinen scope-siivous, joka on käytännössä RAII
(deterministinen vapautus lohkon lopussa, ei GC-taukoja). Tämä on toteutettu ja
testattu LLVM/libc-targeteille. **WASM-polkua ei vain ole vielä nostettu
"freestanding/bump"-luokasta** — se allokoi `new`:llä bump-osoittimella eikä
vapauta mitään.

Ratkaisu on **laajentaa olemassa oleva RC + static cleanup WASM:iin**, ei tehdä
GC:tä. Toteutuskelpoisuus on **korkea**, koska omistajuusanalyysi ja
retain/release-lisäys ovat jo *target-riippumattomia* (`ng_LowIRBuilder.rgr`),
pelkästään `usesLibc`-lipulla pois päältä. Puuttuva osa on WASM-natiivi runtime:
vapautuslistallokaattori + `ranger_obj_new/release/retain` + typedesc-taulukot
lineaarimuistiin. Lisänä pelisilmukoille **per-frame areena** (bump + reset),
joka on halvin voitto. Sykliset viittaukset vuotavat (RC:n rajoite) — sama kuin
natiivilla; ne hoidetaan borrow-by-defaultilla ja heikoilla viittauksilla.

---

## 1. Where WASM stands today

The WAT backend allocates objects with a monotonic bump pointer and never frees:

- `lowerNewObject` (`compiler/ng_LowIRBuilder.rgr:2555`) branches on the target:
  libc → `ranger_obj_new(size, typeDesc)`; **freestanding (WASM) → `emitHeapAlloc`
  (bump)**.
- `heap_alloc` in WAT (`compiler/ng_WATWriter.rgr:439`) is just
  `global.get $heap_ptr` / `i32.add` / `global.set $heap_ptr`. No object header,
  no free, ever.

Consequences for real programs:

- A game `update()` that does any `new` per frame grows `$heap_ptr` unbounded;
  over a few thousand frames it exhausts the one 64 KiB page and traps. This is
  exactly why `ranger_pong` and `ranger_autopeli` were written with **static
  classes + fixed `Mem` slots** — a procedural workaround for the missing heap
  discipline, not an idiomatic use of Ranger's object model.
- No destructors run, so any owned string/array/object field also leaks.

## 2. What already exists (and is reusable)

Ranger already has a complete, deliberate memory model for **manual** targets
(LLVM + libc), documented in `PLAN_LLVM_MEMORY.md` and implemented in
`runtime/ranger_mem.c`:

- **Object header** in front of the body: `{ u32 rc; u32 size; TypeDesc* type; u32 pad }`
  (`ranger_mem.c:28`). The Ranger-level pointer is the body; the header sits at
  `body - HEADER_SIZE`.
- **Type descriptors** drive recursive field release:
  `RangerFieldDesc { u32 offset; u8 kind; u8 owned; ... }`,
  `RangerTypeDesc { u32 struct_size; u16 field_count; ...; FieldDesc* fields }`
  (`ranger_mem.c:10-26`). `kind` ∈ {STRING, OBJECT, PTR_ARRAY}; `owned` gates
  whether release recurses (`ranger_destroy_field:53`, honours `!owned → return`).
- **Runtime API** (`ranger_mem.c`): `ranger_obj_new`, `ranger_obj_retain`,
  `ranger_obj_release` (recursive), `ranger_str_release`, `ranger_strdup`,
  `ranger_ptrarray_release`, `ranger_ptrarray_push_owned`,
  `ranger_mem_live_objects` (test hook).
- **Insertion is target-agnostic.** All retain/release/obj_new/cleanup is emitted
  in `ng_LowIRBuilder.rgr` — the LLVM writer is a dumb instruction printer with
  no RC knowledge. Sites: `lowerNewObject:2568`, `emitReleaseOwnedLocals:2865`
  (function/scope end), `releaseOwnedLocal:2812`, `emitFieldStoreOn:2236`,
  `lowerPush:1304` (move vs push_owned), `lowerReturn:3261` (escape → no release),
  loop-reassignment release (`lowerVarDef:3130`).
- **The gate.** Every one of those sites is guarded by `target.usesLibc` /
  `memEnabled()` (`ng_LowIRBuilder.rgr:391`) / `isManualMemory()`. The default
  WASM target `wasm32-hosted-debug` has `usesLibc=false`
  (`ng_LowIRTarget.rgr:142`), so the RC ops are **never emitted** for WAT — the
  WAT writer isn't ignoring them, they don't exist in its LowIR.
- **Type descriptors are already built for every struct regardless of target**
  (`lowerTypeDesc:1832`, stored in `LowIRModule.typeDescs`); only the *LLVM
  writer* serialises them (`ng_LLVMIRWriter.rgr:188`). The WAT writer never
  touches `module.typeDescs`.
- The ownership analysis defaults object/ptr-array fields to `owned=0`
  (**borrow-by-default**, `ng_LowIRBuilder.rgr:1854-1867`) to avoid double-free
  on aliased graphs; only string fields are owned by default.

**Reusability verdict: high.** The hard, language-level work — deciding what is
owned/borrowed/escaped and where to release — is done and target-independent.
Routing it into WAT is ~90% plumbing: provide the runtime functions + the
descriptor data in linear memory, and flip the target's memory model. (As
evidence: `wasm32-wasi` already sets `usesLibc=true` (`ng_LowIRTarget.rgr:151`),
so compiling with it *already* emits `call $ranger_obj_new` into WAT — it just
fails because nothing defines those functions or places a typedesc table in
memory.)

## 3. The question, reframed: RAII or GC?

The project already answered this for manual targets, and the answer applies to
WASM: **light RC + static scope-cleanup, not a tracing GC.** Concretely:

- **"RAII"** in Ranger *is* the static-cleanup layer: an owned local that does
  not escape is released deterministically at scope/function end
  (`emitReleaseOwnedLocals`). No runtime, no pauses, freed exactly when it dies.
- **RC** covers the cases RAII alone can't — shared ownership across fields,
  pushes, and returns — with `retain`/`release`.
- A **tracing GC** was explicitly rejected (`PLAN_LLVM_MEMORY.md` "Älä tee
  täyttä GC:tä"). For a real-time game loop this is the *right* call: RC/RAII
  free deterministically with no stop-the-world pauses, whereas a GC introduces
  jitter that is poison for a 60 Hz frame budget.

So the WASM plan is not "add RAII" *or* "add a GC" — it is **promote the WASM
target from the freestanding class into the managed/manual class by giving it
the RC+cleanup runtime**, which delivers RAII-style determinism.

## 4. Options evaluated

### Option A — Port light-RC + static cleanup to WASM  ★ recommended (primary)

Give the WASM target the same memory model as native, backed by a self-contained
linear-memory runtime instead of libc.

New components (all additive; no change to the ownership analysis):

1. **A free-list allocator in linear memory** (`malloc`/`free`) to replace the
   bump allocator: a small size-classed free list or a TLSF-lite. Reserve a heap
   region; objects get the same `[header][body]` shape as native.
2. **`ranger_obj_new` / `ranger_obj_release` / `ranger_obj_retain` / str /
   ptrarray** emitted as WAT (or a tiny `ranger_mem_wasm.c` compiled to
   `wasm32-unknown-unknown` and linked). `release` walks the typedesc exactly as
   `ranger_destroy_field` does. The existing `ng_LowIRRuntime.rgr` already shows
   the pattern of emitting runtime functions as target-agnostic LowIR — the same
   mechanism can emit these so they flow through the WAT writer unchanged.
3. **Typedesc emission into a WASM data segment**: serialise each
   `LowIRTypeDesc`/`LowIRTypeFieldDesc` into linear memory with intra-memory
   pointer fixups for the `fields` array, and pass the descriptor address to
   `ranger_obj_new` (mirroring `@Class_typeDesc` on LLVM). Offsets in the
   descriptor are already flat-memory byte offsets.
4. **Target wiring**: decouple "emit RC" from "libc". Today `memEnabled ==
   usesLibc`. Introduce a memory-model value (e.g. `manual-wasm`) so the WASM
   target enables RC but selects the wasm allocator primitives instead of libc
   `malloc`/`free`. The WAT writer already emits `call` ops, so once the runtime
   functions exist the RC calls "just work."

Pros: deterministic, pause-free; reuses the entire analysis; identical semantics
to native (one model to reason about); runs on **both** hosts (wasm3 native +
browser V8) because it is plain i32 linear-memory code.
Cons: reference **cycles leak** (RC's inherent limitation). Effort: medium.

### Option B — Per-frame arena / region  ★ recommended (complement)

The current bump allocator *is* an arena minus the reset. Expose a checkpoint at
frame start (save `$heap_ptr`) and a bulk reset at frame end (restore it). All
per-frame temporaries vanish for free — zero per-object cost, ideal for games.

Add an `@(arena)` / scoped-region API so transient allocations target the frame
arena while persistent state uses the RC heap (Option A) or fixed slots. Valid as
long as no live reference survives the reset boundary — enforced by the same
escape analysis.

Pros: the cheapest possible win, perfectly matched to a frame loop; no headers,
no RC traffic. Cons: only for strictly frame-scoped lifetimes; needs escape
analysis to be safe. Effort: low–medium.

### Option C — Full tracing GC (mark-sweep)  ✗ not now

A precise GC needs stack maps to find roots; a conservative GC must scan wasm
locals (not directly addressable inside the module without a shadow stack) plus
linear memory. It handles cycles (RC's weakness) but reintroduces pauses.
Verdict: against the project principle and wrong for real-time loops; revisit
only if cyclic object graphs become common *and* RC leaks prove painful in
practice.

### Option D — WASM GC proposal (engine-managed heap)  ✗ parked (browser-only future)

Use the wasm-gc `struct`/`array` heap types and let V8's GC manage lifetimes.
Blockers: (i) it requires a fundamentally different codegen — typed managed
objects instead of linear-memory structs — which is incompatible with the
fixed-offset **linear-memory ABI** the engine's games use (RGW1/RGU1 blocks live
at byte offsets); objects and ABI blocks would occupy two disjoint worlds. (ii)
**wasm3, the engine's native host, does not support wasm-gc** — only browsers do.
Adopting it would split the target and break the "runs identically on wasm3 and
in the browser" property this project relies on. Verdict: possible *future
browser-only* variant, not a primary path.

## 5. Recommendation

1. **Primary: Option A** — port the existing RC + static-cleanup model to WASM,
   promoting the WASM target into the managed/manual memory class. This is the
   direct, reuse-heavy answer to "how do Ranger classes + `new` survive WASM,"
   and it gives RAII-grade determinism with no GC.
2. **Complement: Option B** — a per-frame arena for game-loop temporaries, which
   is nearly free in this design and the best fit for the frame budget.
3. **Not** Option C (full GC), consistent with the project's stated principle.
4. **Park** Option D (wasm-gc) as a potential browser-only future once/if a
   managed-heap codegen path is ever desired — explicitly out of scope while the
   dual wasm3+browser host and the linear-memory ABI stand.

RAII vs GC, one line: **extend the existing RC + static cleanup — that already
*is* RAII where it can be and RC where it must be; a GC is neither needed nor
wanted for a real-time frame loop.**

## 6. Design specifics

- **Object layout (unify with native):** allocate `HEADER + body`; header
  `{ u32 rc; u32 size; u32 typeDescPtr; u32 pad }` (32-bit pointers on wasm32, so
  16 bytes — smaller than the 24-byte 64-bit native header). Body pointer =
  `alloc + 16`. `release` reads the header at `ptr - 16`.
- **Allocator:** reserve a heap base **above** the fixed ABI region. For the
  games, the RGW1/RGU1 blocks and the private state sit at fixed low offsets; the
  object heap must start past them (configurable `heapBase`). Programs that use
  only fixed slots (like today's games) pay nothing. Free list keyed by size
  class; coalescing optional in v1.
- **Typedesc data:** one data segment; `ranger_obj_release` walks
  `field_count`, and for each field switches on `kind` and checks `owned`, using
  `*(i32*)(body + offset)` — a direct transliteration of `ranger_destroy_field`
  into i32 loads.
- **WAT writer changes:** minimal — emit the typedesc data segment and the
  runtime functions (or accept them from the LowIR runtime emitter). RC calls are
  already `call` ops. f64 and nested control flow (both landed) are unaffected.
- **Coexistence with the linear-memory ABI:** unchanged. `Mem.storeI32` fixed
  slots and RC-managed objects live in the same page at disjoint ranges; a guest
  can use both (e.g. RC objects for transient game entities, fixed slots for the
  host-facing ABI blocks).

## 7. Phasing

- **Phase 0 — allocator.** Free-list `malloc`/`free` in linear memory + tests
  (alloc/free/reuse, alignment, exhaustion). Reserve `heapBase`. Cheapest
  standalone value: makes repeated `new` non-leaking even before RC.
- **Phase 1 — obj runtime + typedescs.** Emit typedescs to a data segment; emit
  `ranger_obj_new/release/retain` (+ str/ptrarray) walking them. Header layout.
- **Phase 2 — flip the target.** Add `manual-wasm` memory model; decouple
  `memEnabled` from `usesLibc`; route `lowerNewObject` and all cleanup sites to
  the wasm allocator primitives. Now owned locals release at scope end.
- **Phase 3 — frame arena.** `$heap_ptr` checkpoint/reset + `@(arena)` scope;
  escape analysis guards cross-frame survivors.
- **Phase 4 — optimisation & cycles.** Share the escape/borrow pass
  (`PLAN_LLVM_MEMORY.md` Phase 3) with WASM to cut redundant retain/release;
  weak references for known cycles; promote provably-owned object/array fields
  back to `owned=1`.
- **Testing:** port the `tests/fixtures/llvm_mem_*.rgr` suite to a WASM harness
  that asserts `ranger_mem_live_objects() == 0` after scopes, run under V8 (and
  wasm3). Rewrite one game (e.g. an autopeli entity pool) using real `new`
  objects to validate end-to-end and measure module-size/perf cost.

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Allocator bugs (fragmentation, alignment, double-free) | Size classes + a focused test suite; start without coalescing; reuse native semantics. |
| Reference **cycles leak** (RC) | borrow-by-default for object/array fields (already the default); weak refs; document — a leak is far better than a real-time GC pause. |
| Heap vs fixed-ABI-region collision | Configurable `heapBase` above the reserved ABI blocks; games using only fixed slots are unaffected. |
| Module-size / per-alloc cost | Runtime is small; RC only where ownership is non-trivial; arena bypasses RC for per-frame temporaries. |
| wasm3 compatibility | All plain i32 linear-memory ops — wasm3 runs them (this is precisely why wasm-gc/Option D is rejected). |
| Analysis conservatism (borrow-by-default over-leaks true owners) | Same known interim state as native; Phase 4 borrow analysis promotes them back. |

## 9. Feasibility verdict & effort

**Feasible, and mostly reuse.** The intellectually hard part — target-agnostic
ownership/escape analysis and RC-insertion — already exists and already runs; it
is merely gated off for WASM. The remaining work is a **self-contained WASM
runtime** (allocator + a handful of typedesc-walking functions) plus **data-
segment emission** and a **target-model flag**, none of which touch the language
or the analysis.

- **Effort:** Option A ≈ a medium compiler project (Phases 0–2 are the core;
  each is self-contained and independently testable). Option B is a small add-on.
- **Highest-leverage first step:** Phase 0 (free-list allocator) alone stops the
  unbounded-bump leak for any repeated `new`, and Phase 1 makes `new` + owned
  locals fully safe — at which point the games can drop the static-class / fixed-
  slot workaround and use idiomatic Ranger objects.
- **Not recommended:** a tracing GC (Option C) or wasm-gc (Option D) as the
  primary path, for the determinism and dual-host reasons above.
