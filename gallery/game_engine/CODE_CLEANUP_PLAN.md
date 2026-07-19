# CODE_CLEANUP_PLAN — v2 ground-up implementation

Phased build plan for the binding contract in
[`CODE_CLEANUP.md`](./CODE_CLEANUP.md).

## Rebuild everything in `v2/` (including games)

We are **building the engine again under `gallery/game_engine/v2/`** — not
patching the reconciler-era tree into shape. That includes a **new `v2/games/`
folder**.

| Rule | Meaning |
|------|---------|
| **New tree is authoritative** | Interpreter, host arenas, WASM bridge, modules, runtime, render, and games all land in `v2/`. |
| **Do not delete the old tree** | Existing `games/`, `three/`, `scripting/`, `physics/`, `wasm/`, etc. stay in place as reference and as the still-running v1 demos. |
| **Select games, re-implement on the new API** | Pick titles that matter (they are not very large yet). Port each into `v2/games/<name>/` against `ranger:core` / `ranger:three` / `ranger:cannon` (or `ranger_wasm`), not against the old reconciler wrappers. |
| **Copy or rewrite by maturity** | If an old game is already close to the target API, **copy** it into `v2/games/` and adapt. If it is tangled with the old bridge/reconciler, **rewrite** it small on the new API — do not drag the tangle forward. |
| **Old code is a reference, not a dependency** | v2 games must compile and run against v2 only. Reading v1 sources for gameplay ideas is fine; importing v1 engine paths is not. |

Engine work still starts headless (evaluator + create/free over the bridge)
before any v2 game needs pixels. Games arrive once the modules they call are
gated — not by bulk-moving `gallery/game_engine/games/`.

### Contract sync (master)

[`CODE_CLEANUP.md`](./CODE_CLEANUP.md) on master now includes binding detail
this plan must follow (merged after the first scaffold draft):

| Addition | Plan impact |
|----------|-------------|
| **Hybrid binding invariants** (under D-ADAPTER) | Phase 4 — cached wrapper identity, dual revisions, turn-start refresh, guest-wins |
| **D-OWN** — who retains / releases | Phases 2, 5, 6 — ownership table tests; borrowed getters; weak attachments |
| **D-ASYNC** — poll + frame-boundary completions | Phases 5 / 8 / 10 — `begin`/`poll`/`cancel`/`release`; no ABI callbacks |
| **D-REGISTRY ID immutability** | Phase 3 — golden id table; tombstones; codegen fails on meaning change |
| **D-GEO aliasing split** | Phase 7 — Ranger-native one-copy vs Three-compat staging + `needsUpdate` |
| **Module namespace isolation** | Phase 8 prerequisite (interp) — before `ranger:*` injection |
| **Frame pipeline** (`runtime.start`) | Phase 8–10 — drain async completions between guest turns |
| **`WASM_MEMORY_ABI.md` span/status rules** | Phase 5/7 — one span convention; status codes ≠ result counts |

Gate order and required tests in CODE_CLEANUP’s **Implementation gates**
section are authoritative; the phase table below tracks them.

---

**Goal:** implement the live-object host model unit-testably from the bottom up —
TSX evaluator + WASM ABI first, rendering last — under a new `v2/` tree that
does not inherit the reconciler-era layout. Games are re-homed the same way:
selected, re-implemented, old copies kept.

| Document | Role |
|----------|------|
| [`CODE_CLEANUP.md`](./CODE_CLEANUP.md) | Binding decisions (D-IDENTITY … D-MODULES) |
| **This file** | Ordered steps, folder ownership, move list, test gates |
| [`v2/README.md`](./v2/README.md) | Entry point for the new tree |
| [`docs/WASM_MEMORY_ABI.md`](./docs/WASM_MEMORY_ABI.md) | Linear-memory rules for bulk ABI |
| [`docs/ADR-0001-three-scene-host-authority.md`](./docs/ADR-0001-three-scene-host-authority.md) | Host authority ADR |

The existing `three/`, `scripting/`, `physics/`, `wasm/`, and top-level `games/`
trees remain as the **v1 reference / demo** stack. They are not deleted. v2
starts empty of render backends and only pulls in (or rewrites) what each phase
and each selected game actually need.

---

## Principles

1. **New tree; never delete v1 to “make room”.** Create `gallery/game_engine/v2/`
   (engine + `games/`). Copy or rewrite selectively; leave the old tree intact.
   Do not bulk-import `three/src` or the reconciler bridge.
2. **Headless before pixels.** No GL/SDL/software rasterizer until create /
   retain / release / membership / dispose-backend pass on both the adapter
   path and the WASM import path.
3. **One registry → every surface.** Schema under `v2/registry/` generates host
   commands, adapter bindings, WASM imports, TypeScript decls, and Rust
   wrappers (D-REGISTRY).
4. **Tests own the gate.** Each folder README lists the unit tests that prove
   that folder’s contract. A step is done only when those tests pass and the
   obsolete path is unused or tracked for retirement.
5. **Same commands, two guests.** TSX (interp + adapter) and Rust/WASM (`abi`)
   issue the same registry commands against the same arenas (D-MODULES).
6. **Games are selected ports.** Re-implement chosen titles under `v2/games/`
   on the new API; copy when the old code is mature enough, rewrite when it is
   not. Keep the originals.

---

## Target layout (`v2/`)

Deep categorization matching actors in CODE_CLEANUP. Every directory has a
`README.md` describing what lands there and which tests gate it.

```text
gallery/game_engine/v2/
├── README.md
├── registry/                      # D-REGISTRY — single schema source
│   ├── schema/
│   │   ├── core/                  # ranger:core classes & commands
│   │   ├── three/                 # ranger:three
│   │   └── cannon/                # ranger:cannon
│   ├── codegen/
│   │   ├── host_commands/
│   │   ├── adapter_bindings/
│   │   ├── wasm_imports/
│   │   ├── typescript_decls/
│   │   └── rust_wrappers/
│   └── fixtures/                  # tiny schema samples for codegen tests
├── interp/                        # TSX evaluator (guest path A)
│   ├── values/                    # EvalValue, NativeRef, identityId
│   ├── engine/                    # ComponentEngine evaluation core
│   ├── semantics/                 # ===, Map/Set, undefined (D-IDENTITY)
│   ├── adapter/                   # construct / get / set / invoke
│   │   ├── residency/             # guest | host | hybrid (+ hybrid invariants)
│   │   └── overlay/               # D-PROP expandos / userData
│   ├── module_isolation/          # per-import namespaces (D-MODULES prerequisite)
│   └── migrate/                   # notes + staged copies from pdf_writer
├── host/                          # authoritative state (no render)
│   ├── handles/                   # fat handle, realm, generation (D-HANDLE)
│   ├── arenas/
│   │   ├── three/
│   │   │   ├── scene/
│   │   │   ├── mesh/
│   │   │   ├── geometry/
│   │   │   ├── material/
│   │   │   └── camera/
│   │   ├── physics/
│   │   │   ├── world/
│   │   │   └── body/
│   │   ├── audio/
│   │   │   ├── clip/
│   │   │   ├── source/
│   │   │   └── voice/
│   │   └── input/
│   │       ├── action_map/
│   │       └── gamepad/
│   ├── lifetime/                  # object ≠ membership ≠ backend (D-LIFE)
│   ├── ownership/                 # D-OWN retain/borrow/weak attach rules
│   ├── commands/                  # registry command implementations
│   └── tests/
│       ├── create_release/
│       ├── membership/
│       ├── dispose_backend/
│       ├── ownership/             # D-OWN table conformance
│       └── stale_cross_realm/
├── bridge/                        # guest ↔ host crossings
│   ├── wasm/
│   │   ├── imports/               # rg_* import stubs / lowering
│   │   ├── memory/                # D-WASM-MEM bounds checks
│   │   ├── async/                 # D-ASYNC begin/poll/cancel/release
│   │   ├── lifecycle/             # ranger_game_* exports host side
│   │   └── tests/
│   │       ├── create_free/
│   │       ├── retain_release/
│   │       ├── async_poll/
│   │       └── span_bounds/
│   ├── modules/                   # inject ranger:* into a realm
│   └── parity/                    # TSX vs WASM command parity harness
├── modules/                       # public guest packages
│   ├── ranger_core/
│   │   ├── runtime/
│   │   ├── surface/
│   │   ├── input/
│   │   ├── audio/
│   │   ├── assets/
│   │   ├── log/
│   │   └── platform/
│   ├── ranger_three/
│   │   ├── scene/
│   │   ├── cameras/
│   │   ├── meshes/
│   │   ├── geometries/
│   │   ├── materials/
│   │   └── math/                  # guest-only Vector3 / Quaternion …
│   ├── ranger_cannon/
│   │   ├── world/
│   │   ├── body/
│   │   └── math/
│   └── ranger_wasm/               # Rust helper crate layout
│       ├── core/
│       ├── three/
│       ├── cannon/
│       └── export_game/
├── runtime/                       # host-driven Game loop (no RAF)
│   ├── game_trait/
│   └── frame/
├── physics/                       # step / sync pose (after arenas)
│   └── step/
├── render/                        # LAST — backends only read host state
│   └── backends/
│       ├── software/
│       └── gl/
├── games/                         # selected titles re-implemented on v2 API
│   └── <name>/                    # copy-or-rewrite from top-level games/
└── tests/                         # cross-cutting runners
    ├── unit/
    │   ├── interp/
    │   ├── host/
    │   └── bridge/
    ├── contract/                  # named after D-* decisions
    │   ├── d_identity/
    │   ├── d_life/
    │   ├── d_own/
    │   ├── d_handle/
    │   ├── d_geo/
    │   ├── d_async/
    │   └── d_modules/
    └── fixtures/
        ├── tsx_scripts/
        └── wasm_guests/
```

Step 0 creates every directory above with a `README.md` (including `games/`).
Later steps fill implementations and tests under those READMEs’ contracts.
Game subfolders appear when a title is selected for port — not as a bulk copy
of `gallery/game_engine/games/`.

---

## Phase overview

| Phase | Name | Depends on | Rendering? |
|-------|------|------------|------------|
| **0** | Scaffold `v2/` + folder READMEs | — | No |
| **1** | Interp values + D-IDENTITY semantics | 0 | No |
| **2** | Host handles + arenas create/release (**D-OWN** table) | 0 | No |
| **3** | Registry schema + codegen + **ID immutability** | 0 | No |
| **4** | Native adapter + hybrid invariants (D-ADAPTER / D-PROP) | 1, 2, 3 | No |
| **5** | WASM create/free/retain/release + **D-ASYNC** poll stubs | 2, 3 | No |
| **6** | D-LIFE + D-OWN membership / dispose / weak attach | 2, 4, 5 | No |
| **7** | D-GEO bulk + aliasing split + D-WASM-MEM | 5, 6 | No |
| **8** | Module isolation → `ranger:*` + frame pipeline | 4, 5 | No |
| **9** | Physics arenas + pose sync (no draw) | 6, 8 | No |
| **10** | Audio / input / surface (D-OWN voices, D-ASYNC loads) | 8 | No |
| **11** | Render backends (software first, then GL) | 6–10 | **Yes** |
| **12** | Selected `v2/games/` ports + `RETIRE-RECONCILE` | 11 | Yes |

Phases 1–5 are the critical path: **before any frame is drawn**, create and free
objects through both bridges under unit tests (ownership rules included).

---

## Phase 0 — Scaffold (current step)

**Deliverable**

- [`CODE_CLEANUP_PLAN.md`](./CODE_CLEANUP_PLAN.md) (this file)
- [`v2/`](./v2/) directory tree with a `README.md` in every folder
- [`v2/games/`](./v2/games/) ready for selected ports (no bulk game copy yet)

**Done when**

- Layout matches the tree above
- Each README states: purpose, CODE_CLEANUP decisions, planned sources (if any),
  and the unit tests that gate that folder
- Plan states clearly: rebuild in v2 (including games), do not delete v1
- No production code required yet (stubs / empty `tests/` dirs are fine)

**Do not**

- Move `three_tsx_bridge.rgr` or reconciler paths into v2
- Add render backends
- Bulk-copy or delete top-level `games/`

---

## Phase 1 — TSX evaluator core (D-IDENTITY)

**Goal:** a v2-owned interpreter slice that can evaluate values and prove
reference identity — without Three or rendering.

**Move / copy candidates** (only as needed for tests):

| Source (v1) | Destination (v2) |
|-------------|------------------|
| `gallery/pdf_writer/src/jsx/EvalValue.rgr` | `v2/interp/values/` (adapt, do not leave dual truth) |
| Minimal eval paths from `ComponentEngine.rgr` | `v2/interp/engine/` |
| Existing JS-semantics test ideas from CODE_CLEANUP / OLD | `v2/interp/semantics/tests/` + `v2/tests/contract/d_identity/` |

Parser may stay shared with `gallery/ts_parser/` until a later extract; document
the dependency in `v2/interp/migrate/README.md`.

**Unit tests (gate)**

| Test area | Asserts |
|-----------|---------|
| `interp/semantics/tests` | `===` uses `identityId`; Map/Set key by identity |
| `interp/values/tests` | NativeRef carries immutable `identityId` + handle |
| `tests/contract/d_identity` | missing prop → `undefined` (not `null`); reorder/reparent never changes identity (once objects exist) |

**Blocked until green:** Phase 4 adapter work that claims “one script object →
one host handle”.

---

## Phase 2 — Host handles and arenas (create / free + D-OWN)

**Goal:** typed arenas that allocate and release generation-checked handles with
**no** scene graph rendering and **no** GPU. Ownership follows **D-OWN**.

**Implement first arenas (minimal):**

1. `host/arenas/three/geometry` — empty geometry create / release
2. `host/arenas/three/material` — basic material create / release
3. `host/arenas/three/mesh` — mesh create **retains** geo/mat; release
4. `host/handles` — pack/unpack, realm tag, stale rejection
5. `host/ownership` — owned vs borrowed vs weak-attachment bookkeeping

**Unit tests (gate)**

| Test area | Asserts |
|-----------|---------|
| `host/tests/create_release` | create → live; release → slot free; **second release through same wrapper → typed error** |
| `host/tests/ownership` | `meshCreate` retains geo/mat; getter returns borrowed (no refcount change) |
| `host/tests/stale_cross_realm` | wrong generation / wrong realm → error, no UB |
| `host/handles/tests` | fat two-word handle round-trip; wrap policy documented |
| `tests/contract/d_own` | ownership table rows for create / getter / arg / setGeometry |

**Still no** `render()`, no SDL, no software rasterizer.

---

## Phase 3 — Registry schema + codegen stubs (+ ID immutability)

**Goal:** one schema describing Mesh / Geometry / Material (and later core /
cannon) that *will* generate every surface. Published ids are **immutable**
(tombstone on remove; new id for binary-lowering changes).

**Early milestone:** hand-written schema fixtures + a stub generator that emits
command name lists consumed by host and bridge tests. Full codegen can mature
in parallel with Phases 4–5.

**Unit tests (gate)**

| Test area | Asserts |
|-----------|---------|
| `registry/fixtures` + codegen tests | schema → same command ids for adapter metadata and WASM import names |
| `registry/codegen/*` | regenerating does not drift public command names without a version bump (D-WASM) |
| golden id table | changing a published id’s meaning **fails** codegen; removed ids stay tombstoned |

---

## Phase 4 — Native adapter over arenas (D-ADAPTER, D-PROP, hybrid invariants)

**Goal:** interpreter reaches host only through:

```text
construct / getProperty / setProperty / invokeMethod
```

Hybrid properties also obey CODE_CLEANUP’s **Hybrid binding invariants**: one
cached wrapper per `(NativeRef, propId)`; dual revisions; turn-start refresh;
guest commit wins via the frame pipeline; stable reads within a turn unless
`immediate`.

**Unit tests (gate)**

| Test area | Asserts |
|-----------|---------|
| `interp/adapter/tests` | `new Mesh(g,m)` → one `meshH`; second construct → different handle |
| adapter overlay tests | unknown write → guest overlay; host never sees it |
| residency / hybrid tests | `mesh.position === mesh.position`; retained mirror ignores mid-turn host writes; refreshes next turn |
| `tests/unit/interp` | same script object → same host handle after property churn |

Wire guest scripts from `tests/fixtures/tsx_scripts/` — tiny files, no demos.

---

## Phase 5 — WASM surface: create / free + D-ASYNC stubs (D-WASM)

**Goal:** compiled guests call the **same** create/release commands via `rg_*`
imports. Helper concerns (strings, spans, error codes) can be thin; focus on
handle lifecycle. Async loaders use **begin/poll/cancel/release** — no ABI
callbacks (D-ASYNC).

**Unit tests (gate)** — these are the first “bridge” tests the plan calls out:

| Test area | Asserts |
|-----------|---------|
| `bridge/wasm/tests/create_free` | `rg_mesh_create` / release; arena occupancy matches host tests |
| `bridge/wasm/tests/retain_release` | retain bumps; release at 0 frees; Drop/Clone semantics for future Rust helper |
| `bridge/wasm/tests/async_poll` | exactly-once result transfer; repeated COMPLETE polls do not double-transfer; teardown releases request+result |
| `bridge/parity/tests` | TSX adapter sequence and WASM import sequence produce identical arena traces |
| `bridge/wasm/tests/span_bounds` | (can start as stubs) OOB ptr/len → typed error (D-WASM-MEM) |

**Fixture guests:** `tests/fixtures/wasm_guests/` — minimal modules that only
create and free handles (no frame loop, no render). Async fixtures may poll a
fake completed request.

---

## Phase 6 — Lifetimes (D-LIFE) + ownership edges (D-OWN)

**Goal:** prove the three lifetimes and ownership edges independently of drawing.

**Unit tests (gate)**

| Test area | Asserts |
|-----------|---------|
| `host/tests/membership` | `scene.remove(mesh)` detaches; mesh+geo+mat handles still live |
| `host/tests/dispose_backend` | `dispose_backend` does not release object handle; later attach/read still valid |
| `host/tests/ownership` | weak attachment: destroy entity → auto-detach; attachment never keeps target alive |
| `tests/contract/d_life` | shared geo: two meshes, one `geoH`; releasing one mesh does not free geo |
| `tests/contract/d_own` | realm teardown releases every ownership the realm still holds |

---

## Phase 7 — Geometry upload (D-GEO, D-WASM-MEM, aliasing)

Stable `geoH` across attribute setup; bulk spans; update ≠ new handle.

**Aliasing split (CODE_CLEANUP):** Ranger-native API = one authoritative host
copy. Three-compat wrapper may keep a guest staging array (`attribute.array`
aliases `data`); `needsUpdate` flushes to host; writes without flush do not
render.

**Unit tests:** `tests/contract/d_geo` + `bridge/wasm/tests/span_bounds` —
upload → update → read-back on one handle; OOB rejected without trap; compat
aliasing cases when the wrapper path exists.

---

## Phase 8 — Module isolation → virtual modules (D-MODULES)

**Prerequisite:** interpreter **module-namespace isolation** (CODE_CLEANUP gate
6 / `TSX_ENGINE_ISSUES` #5/#9) — colliding helpers across imports must not
clobber; repeated import returns the same namespace object.

Then inject `ranger:core` / `ranger:three` / `ranger:cannon` for the current
realm. Stub `runtime.surface` / `runtime.log` with headless fakes. Implement
the **frame pipeline** order from CODE_CLEANUP (including draining D-ASYNC
completions between guest turns).

**Unit tests:** `interp/module_isolation/tests`, `bridge/modules/tests`,
`tests/contract/d_modules` — import resolves; two realms get distinct
`runtime` roots; cross-realm `runtime` rejected; guest-only class never
appears in an arena.

---

## Phase 9 — Physics (headless)

World/body arenas + `fixed_step` + pose read. Copy pose into mesh transforms via
host commands only — still no pixels. Host pose writes bump hybrid **host
revision** (Phase 4 invariants).

**Move candidates later:** selected files from `physics/` Cannon port — only
after arenas and commands exist.

---

## Phase 10 — Audio / input / surface (fakes allowed)

Action maps, rumble stubs, clip/source/voice lifetimes (D-OWN: `play()` voices
caller-owned; `playOneShot()` mixer-owned). Asset loads via D-ASYNC poll.
Prefer fake devices so CI stays headless.

---

## Phase 11 — Render (first time pixels are required)

Backends under `v2/render/backends/` **read** host state only. Rendering is not
a sync boundary (D-SYNC). Software backend first for CI; GL/SDL second.

**Gate:** cube/teapot-style fixture renders from live host objects created via
adapter **and** via WASM — without calling any reconciler.

---

## Phase 12 — Selected games in `v2/games/` + retire reconciler

Re-home gameplay onto the new API; **leave the old games tree untouched**.

1. **Select** a small set of titles (cube / teapot / one physics toy / one
   input+audio sample — exact list TBD in `v2/games/README.md`).
2. For each title: **copy** into `v2/games/<name>/` if the old sources are
   already close to live `ranger:*` usage; otherwise **rewrite** a thin version
   on `runtime.start` / `export_game!`.
3. Prove the game runs only against v2 modules (no reconciler imports).
4. When `RETIRE-RECONCILE` criteria in CODE_CLEANUP are met, remove the
   reconciler from the *engine* path. Still do not require deleting v1 games.

---

## Selective copy / rewrite list (guidance)

Bring pieces **into v2 only when a phase or a selected game needs them**. Prefer
copy-then-adapt when the source is mature; rewrite when it is reconciler-era
tangled. **Never delete the v1 original** as part of a port.

| Keep in v1 (reference; do not delete) | Why |
|---------------------------------------|-----|
| Top-level `games/*` | Source of truth for “what the game did”; ports land in `v2/games/` |
| `three/tsx/*` wrapper tree + reconciler | Temporary compatibility (D-SYNC) until RETIRE-RECONCILE |
| `three/src/three_gl_*.rgr`, software backend | Phase 11 only (adapt into `v2/render/`) |
| Full `scripting/*` game runners | Reference for runners; rewrite against v2 runtime |

| Bring early (copy/adapt) | Phase |
|--------------------------|-------|
| `EvalValue` / identity-related eval | 1 |
| Minimal `ThreeSceneHost` handle/arena ideas (not full renderer) | 2 |
| ABI header patterns from `wasm/*.h` / `ABI_V2_PROPOSAL.md` (as reference) | 5 |
| Cannon math/body kernels (not SDL runners) | 9 |
| Selected small games → `v2/games/<name>/` | 12 (earlier smoke OK once modules exist) |

---

## Mapping to CODE_CLEANUP implementation gates

Authoritative list: CODE_CLEANUP **Implementation gates** (9 steps). Plan map:

| CODE_CLEANUP gate order | Plan phases |
|-------------------------|-------------|
| 1. D-IDENTITY | 1 |
| 2. D-ADAPTER / D-PROP (+ hybrid invariants) | 4 |
| 3. D-REGISTRY / D-TYPE / D-HANDLE (+ id immutability) | 2, 3 |
| 4. D-SYNC / D-LIFE / D-OWN / D-GEO | 4, 6, 7 |
| 5. D-WASM / D-WASM-MEM / D-ASYNC | 5, 7, 10 |
| 6. Interpreter module-namespace isolation | 8 (prerequisite) |
| 7. Virtual modules + `runtime` (D-MODULES) | 8 |
| 8. Demos → `runtime.start` / `export_game!` | 10–12 (`v2/games/`) |
| 9. `RETIRE-RECONCILE` | 12 |

---

## How to work a phase

1. Read the folder README(s) for that phase.
2. Add failing unit tests listed in the README.
3. Implement the minimum host/interp/bridge code to pass.
4. Run only that phase’s tests (document the command in the folder README as it
   appears — e.g. `bash v2/tests/unit/bridge/run.sh`).
5. Update the phase checkbox in this file when green.
6. Do not start the next phase’s production code until the gate tests pass.

---

## Phase checklist

- [x] **Phase 0** — `v2/` scaffold + per-folder READMEs
- [ ] **Phase 1** — Interp values + D-IDENTITY tests green
- [ ] **Phase 2** — Arena create/release + D-OWN table + stale handle tests
- [ ] **Phase 3** — Registry fixtures + golden id / tombstone tests
- [ ] **Phase 4** — Adapter + hybrid invariants (`position === position`, turn refresh)
- [ ] **Phase 5** — WASM create/free/retain/release + D-ASYNC poll stubs + parity
- [ ] **Phase 6** — Membership ≠ release; dispose_backend ≠ release; weak attach
- [ ] **Phase 7** — Stable `geoH` bulk upload + native vs compat aliasing
- [ ] **Phase 8** — Module isolation → `ranger:*` + frame pipeline (drain async)
- [ ] **Phase 9** — Physics step + pose sync (headless)
- [ ] **Phase 10** — Audio/input/surface fakes (D-OWN voices, D-ASYNC loads)
- [ ] **Phase 11** — First render from live host objects
- [ ] **Phase 12** — Selected games re-implemented under `v2/games/` + `RETIRE-RECONCILE` (v1 games kept)

---

## Out of scope for early phases

- Browser `requestAnimationFrame` as the primary game loop (host ticks `Game`)
- Reconciler improvements
- Full Three.js API surface (grow registry class-by-class)
- Shipping `ranger_wasm` to crates.io (layout + tests first)
- Deleting or “replacing in place” top-level `games/` / `three/` / `scripting/`
)
