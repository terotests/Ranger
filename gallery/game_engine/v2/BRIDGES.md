# BRIDGES.md — the one generated bridge (plan, written before the code)

Status: **plan**. No bridge code exists yet; a hand-rolled draft
(`interp/engine/Rg2DHostBridge.rgr`, an if-chain of `rg2d_*` names) was written
and **deleted before commit** because it reproduced the exact failure v2 exists
to eliminate. This document specifies what will be built instead, anchored to
[`CODE_CLEANUP.md`](../CODE_CLEANUP.md).

---

## 1. Why bridges are where v1 died

Every v1 bridge was **authored per surface, per domain, sometimes per game**:

| v1 artifact | Disease |
|---|---|
| `three/tsx/three_native_bridge.rgr` | hand if-chain of `three_*` string commands; adding a command = editing bridge code |
| RGSP1 sprite ABI | **fixed slots**, host-only character clocks, "runner-specific ABIs" (CODE_CLEANUP D-2D calls these out by name) |
| multiple sheet registries / runner manifests | each runner grew its own asset table instead of `runtime.assets` |
| Sponza `sunLight()` / `skyNode()` accessors | scene-specific typed getters bolted onto a generic host (D-TYPE's opening complaint) |
| `three_tsx_bridge.rgr` reconciler | per-frontend scene mirror, explicitly "temporary" (D-SYNC) |

The common root: **the command table lived in hand-written bridge code**, so
every new domain (2D, cannon, audio) and every new transport (interpreter,
WASM) forked a new incompatible copy. My deleted draft did it again — it served
`ranger:2d`+`core` only; three/cannon/audio would each have needed another
parallel if-chain, exactly the v1 rot.

CODE_CLEANUP's answer is explicit (D-REGISTRY, "Generated outputs (one
source)"):

> host and typed-arena dispatch · interpreter native-class registrations ·
> WASM imports · TypeScript / Rust guest wrappers · **bridge command tables** ·
> documentation tables · surface-parity tests

> *"If the schema cannot state these, codegen grows command-specific
> exceptions — the failure mode this design is trying to remove."*

So: **a bridge is generated data plus generic machinery. It is never authored
per domain, and adding a command never edits bridge code — it adds a schema
row.**

---

## 2. The one bridge — architecture

```
registry/schema/{core,two_d,three,cannon}/   authored DATA (the only hand part)
        │  RgSchema + lowering metadata
        ▼
registry/codegen/                            RgCodegen (Phase 3, extended)
        │  emits ONE RgCommandTable + dispatchers + wrappers
        ▼
┌──────────────────────────────────────────────────────────────┐
│ RgCommandTable  (rows: {id, classId, methodId, name,         │
│   wasmExport, module, argSpec, retSpec, ownershipEffect})    │
└──────────────────────────────────────────────────────────────┘
   │                        │                       │
   ▼                        ▼                       ▼
interpreter transport   WASM import surface     guest wrappers
(ONE EvalNativeBridge)  (bridge/wasm rg_*)      (TS façade / Rust)
   │                        │
   └────────► generated host dispatch ◄─────────┘
              (table row → typed-arena method call)
                        │
                        ▼
        RgRanger2D · RgAudio · RgInput · RgSurface ·
        RgHost(three) · RgPhysicsWorld(cannon)   (Phases 2–11 arenas)
```

### 2.1 Schema rows (authored data — the only hand-written part)

Phase 3's `RgSchema` already carries classId/propId/methodId, residency,
ownership, sync, and `wasmExport`. It gains the lowering metadata D-REGISTRY
requires:

```
RgParamDef  { name, type }        ; type ∈ i32 f64 bool string handle<T>
                                  ;        array<i32> array<f64> (span on WASM)
RgMethodDef { … args:[RgParamDef], ret:type,
              ownershipEffect ∈ { create(arena), retainArgs, releaseSelf, none },
              targetArena }       ; which typed arena executes it
```

Module id ranges (immutable once published, golden-id checked):

| module | classIds | command ids |
|---|---|---|
| `ranger:core` | 10–19 | 1000–1999 |
| `ranger:2d` | 20–29 | 2000–2999 |
| `ranger:three` | 30–39 | 3000–3999 (existing fixture ids 100–199 stay tombstone-mapped) |
| `ranger:cannon` | 40–49 | 4000–4999 |

One schema dir per module (`registry/schema/two_d/`, … — the dirs already
exist). **This answers the cross-module question directly:** three, cannon,
audio, input, surface, and 2D are *rows in the same table*, so the single
bridge serves all of them by construction; nothing per-domain exists to fork.

### 2.2 The command table (generated)

`RgCodegen.commands(schema)` (exists) grows to emit full rows including
`argSpec` (e.g. `"h:i:i"` = handle, int, int) and `retSpec` (`"h"` create,
`"i"`, `"d"`, `"v"`). The golden-id gate (exists) extends across all four
modules: meaning-change / renumber / tombstone-reuse / lowering-change fail.

### 2.3 Interpreter transport — ONE generic `EvalNativeBridge`

`interp/engine/RgRegistryBridge.rgr` — the only `EvalNativeBridge` subclass in
v2, and it contains **zero per-command code**:

- `has(name)` = table lookup (name or `module:command`).
- `invoke(name, args)`:
  1. resolve the table row (unknown → typed error, never silent null),
  2. decode `args` against `argSpec` (arity + type check; `h:` params resolve
     the guest id → fat `RgHandle` and re-verify generation/realm/type at the
     registry — a stale id fails exactly like the WASM path),
  3. call the **generated dispatcher** for the row,
  4. encode the result per `retSpec` (a `create` result mints a guest id).
- It owns the single **guest-id ↔ OwnedHandle surrogate table** for all
  modules (D-IDENTITY: one id ↔ one live handle; ids never reused), the realm
  id, and `teardown()` (releases every surrogate — D-OWN backstop).

The guest-visible call shapes are the D-ADAPTER quartet plus module statics:

```
rg_construct(classId, …)            → ref     (new Sprite2D / new Body / …)
rg_get(ref, propId) / rg_set(ref, propId, v)
rg_invoke(ref, methodId, …)         → value   (layer.add, source.playOneShot, …)
rg_call(commandId, …)               → value   (module-level: input, surface, time)
```

Flat per-domain names (`rg2d_sprite_create(…)`) may exist as *generated
aliases* in the table for façade ergonomics — but they are rows, not code.

### 2.4 Generated host dispatch (the terminal glue)

Something must finally call `RgRanger2D.spriteCreate(...)`. Per D-REGISTRY that
dispatch is a **generated output**: `registry/codegen/` gains an emitter that
writes `registry/generated/RgDispatch.rgr` — for each table row, an arg-checked
call into the owning arena method. Regenerating from an unchanged schema is
byte-identical (drift test).

**Interim honesty rule:** until the emitter lands, a hand dispatcher is
tolerated *only* behind a **coverage gate**: a test walks the table and fails
if any row lacks a dispatcher entry or any dispatcher entry lacks a row. The
gate makes the interim un-forkable; the emitter retires it.

### 2.5 Same table → WASM surface (parity, D-WASM)

`bridge/wasm/imports/` stops hand-declaring names: its `rg_*` import list is
the `wasmExport` column of the same table (two-word handles, out-register +
status, as today). The existing `bridge/parity` test extends to iterate the
table: for every command, the interpreter transport and the WASM path must
produce identical arena traces. Signature changes = new export name/id
(D-WASM versioning), enforced by the golden table.

### 2.6 Guest façades are generated wrappers

`three.tsx` proved the pattern: guest classes wrap bare commands so game code
stays ordinary ("`cube.tsx` unmodified"). The TS façade (`ranger2d.tsx`,
`ranger_core.tsx`, and eventually a regenerated `three.tsx`) is a **generated
TypeScript wrapper** (a listed D-REGISTRY output): classes/methods emitted from
the same schema rows. Interim hand façades are guest-side sugar only (no host
knowledge beyond command names) and are marked for regeneration.

### 2.7 What the design explicitly forbids

- per-domain or per-game bridge classes; any command name containing a game
  name (`ylos2_*` is a design bug by definition)
- editing bridge/dispatch code to add a capability (add a schema row instead)
- fixed-slot ABIs, runner-private clocks/manifests (time = `runtime.time`,
  assets = `runtime.assets`)
- scene-specific typed accessors on the host
- a second command table anywhere (WASM, docs, façades all derive from the one)

---

## 3. Implementation order (each step gated, committed green)

1. **Schema rows** for the commands ylos2 + the launcher actually need
   (~30 rows across `two_d` + `core`: texture/atlas/region/clip, sprite,
   layer, camera, anim-player, input read, surface panes, audio one-shot /
   vocal / music, time, log, launch). Golden table extended.
2. **Command-table + coverage gate + `RgRegistryBridge`** (generic decode /
   surrogate ids / typed errors / teardown). Gate: table-coverage test +
   stale-id / wrong-arity / unknown-command typed-error tests.
3. **ylos2 + launcher TSX run through it** (the real validation this was all
   for): façade TSX + game TSX evaluated by the staged `ComponentEngine`,
   frame pipeline order, split-screen software present, pixels asserted.
4. **Extend the table to `three` + `cannon`**: map the existing three commands
   (fixture ids tombstoned → new rows) and the cannon step/body surface; a
   convergence test drives a 2D scene, a three mesh, and a cannon step through
   the *same* bridge instance in one realm.
5. **Dispatcher emitter** (`registry/codegen` → `registry/generated/*.rgr`)
   replaces the interim hand dispatcher; coverage gate flips to comparing
   generated output against the table.
6. **Façade generation** for TS wrappers; regenerate `ranger2d.tsx`.

Step 3 is deliberately before 4–6: the plan's own rule ("validate against real
guest code") outranks completeness — but steps 4–6 are commitments, not
options; the table design is what makes them additive rows instead of new
bridges.

---

## 4. Test gates for bridge work

| Gate | Asserts |
|---|---|
| table coverage | every table row dispatches; every dispatch entry has a row (drift = red) |
| golden ids ×4 modules | published ids immutable; lowering change ⇒ new export |
| generic decode | wrong arity / wrong type / unknown command / stale guest id → typed errors |
| surrogate identity | one guest id per live handle; release → stale; teardown reclaims all |
| interp ↔ WASM parity | identical arena traces per table row on both transports |
| cross-module realm | 2d + core + three + cannon commands interleave through one bridge/realm |
| regen determinism | codegen twice from one schema ⇒ byte-identical table + dispatch |
