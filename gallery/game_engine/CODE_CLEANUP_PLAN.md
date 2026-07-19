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
| **D-2D / `ranger:2d`** (P1) | Phase 10b–12 — sibling of Three; retained + DrawList2D; D-2D-1…10 |

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
trees remain as the **v1 reference / demo** stack. They are not deleted.

**Staged imports:** well-tested modular packages are **copied into `v2/`**
(see below) so work happens on the new tree. Copies start as *staged* — import
paths may still point at v1 until rewired. Reconciler / `three/tsx` bridges are
**not** copied.

---

## Staged modular imports (copied into `v2/`)

Copy mature, unit-tested modules; leave tangled bridge/demo shells in v1.

| v2 path | Copied from | Why | Skipped |
|---------|-------------|-----|---------|
| `physics/cannon/src/` | `physics/src/` | Cannon port + 23 `*_test.rgr` | `physics/tsx/` bridge |
| `three/port/src/` + `tests/` | `three/src/`, `three/tests/` | Class-per-file Three port + tests | `three/tsx/` reconciler wrappers |
| `interp/migrate/src/` | `pdf_writer/src/jsx/{EvalValue,ComponentEngine,JSXToEVG}.rgr` | TSX evaluator core | Full pdf_writer |
| `bridge/wasm/legacy_blocks/` | `wasm/*.h` (+ small workers) | RGW1/RGSP1/RGU1 block ABI reference | — |
| `sprites/` | `scripting/game_sprite.rgr`, `wasm_sprite_abi.h`, `lib/ranger_game`, runners | **2D sprites** (see below) | Full `scripting/` |
| `lpc/` | `lpc/` (no `output/`) | LPC sheet compositor + pack | Full Universal LPC art tree |
| `evg/` | `gallery/evg/` | EVG layout/vector primitives + test | `original/`, `bin/` |
| `model3d/` | `model3d/` (no `demo/`) | glTF readers + tests | — |
| `ui/` | `ui/` | Retained UI / EVG launcher widgets | — |
| `web/` | `web/` (no `node_modules`/`dist`) | Browser VFS + publish framework | — |

Each folder’s README records provenance and rewire status.

### P1: `ranger:2d` is first-class (D-2D — do not omit)

**Binding contract:** [`CODE_CLEANUP.md`](./CODE_CLEANUP.md) **D-2D**. Omitting
2D would unify Three while leaving the old game-relevant sprite stack split
across incompatible paths (fixed slots, multiple sheet registries, several
cameras/animation clocks — see `CODE_CLEANUP_OLD.md`).

Package layout (sibling of Three, not `THREE.Sprite`):

```text
ranger:core     runtime, surface, input, audio, assets, time, bindings
ranger:2d       sprites, sheets/atlases, animation, layers, Camera2D,
                shapes, tilemaps, text, particles, DrawList2D
ranger:three    3D scenes / meshes / materials
ranger:cannon   physics worlds / bodies
```

Rust: `ranger_wasm::{core, two_d, three, cannon}`.

| Piece | v2 home | Role |
|-------|---------|------|
| Registry schema | `registry/schema/two_d/` | D-2D-1 class/command defs |
| Guest module | `modules/ranger_2d/` | TS / interpreter façades |
| Rust helper | `modules/ranger_wasm/two_d/` | `ranger_wasm::two_d` |
| Host arenas | `host/arenas/two_d/` | Sprite2D, Camera2D, Atlas, … |
| Staged v1 sprite code | `sprites/` | migrate sources (game_sprite, RGSP1) |
| LPC compositor | `lpc/` | emit SpriteAtlas JSON + textures |
| Soft/blit deps | `sprites/deps/` | until `render/` present path |

**Retained vs immediate** (both required, separate APIs):

| Mode | Types | Identity |
|------|-------|----------|
| Retained | `Sprite2D`, `Shape2D`, `Scene2D`, … | Stable handles (D-HANDLE) |
| Immediate | `DrawList2D` / frame draw commands | **No** persistent handles |

RGSP1 / `game_sprite` remain **legacy migration sources** until D-2D-7…D-2D-10
parity; they are not the target identity model.

Selected **2D games** belong in `v2/games/` the same way as 3D titles.

---

## Principles

1. **New tree; never delete v1 to “make room”.** Engine + games + staged
   modules live under `v2/`. Leave the old tree intact. Copy modular tested
   packages; **do not** copy reconciler / `three/tsx` / `physics/tsx` bridges.
2. **Headless before pixels.** No GL/SDL present path until create / retain /
   release / membership / dispose-backend pass on adapter + WASM command paths.
   Soft-2D sprite *logic* and RGSP1 validation can be tested headless earlier.
3. **One registry → every surface.** Schema under `v2/registry/` generates host
   commands, adapter bindings, WASM imports, TypeScript decls, and Rust
   wrappers (D-REGISTRY). Legacy block ABIs (RGSP1, RGU1, …) stay documented
   until superseded.
4. **Tests own the gate.** Each folder README lists the unit tests that prove
   that folder’s contract. A step is done only when those tests pass and the
   obsolete path is unused or tracked for retirement.
5. **Same commands, two guests.** TSX (interp + adapter) and Rust/WASM (`abi`)
   issue the same registry commands against the same arenas (D-MODULES).
6. **Games are selected ports.** Re-implement chosen titles under `v2/games/`
   on the new API; copy when the old code is mature enough, rewrite when it is
   not. Keep the originals. **Include `ranger:2d` games**, not only Three demos.
7. **Staged copies are not live wiring.** A file under `v2/` still needs import
   rewires, registry exposure, and gate tests before games depend on it.
8. **`ranger:2d` is P1.** Do not ship a “3D-only” cleanup; D-2D gates are
   required alongside Three/Cannon (CODE_CLEANUP D-2D).

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
│   │   ├── two_d/                 # ranger:2d (D-2D)
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
│   │   ├── two_d/                 # Sprite2D, Camera2D, Atlas, Layer, … (D-2D)
│   │   │   ├── sprite/
│   │   │   ├── shape/
│   │   │   ├── camera/
│   │   │   ├── layer/
│   │   │   ├── atlas/
│   │   │   ├── animation/
│   │   │   └── draw_list/         # frame-local — no arena identity
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
│   ├── ranger_2d/                 # ranger:2d (D-2D) — not THREE.Sprite
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
│       ├── two_d/                 # ranger_wasm::two_d
│       ├── three/
│       ├── cannon/
│       └── export_game/
├── runtime/                       # host-driven Game loop (no RAF)
│   ├── game_trait/
│   └── frame/
├── physics/                       # Cannon port (staged) + step wiring
│   ├── cannon/                    # COPY of physics/src + tests
│   └── step/
├── three/                         # staged Ranger Three port (not tsx bridge)
│   └── port/                      # COPY of three/src + three/tests
├── sprites/                       # STAGED v1 sprite sources → migrate to ranger:2d
│   ├── host/                      # game_sprite.rgr (legacy retained)
│   ├── abi/                       # RGSP1 (legacy slots — retire after D-2D-10)
│   ├── rust/
│   ├── runners/
│   └── deps/
├── lpc/                           # COPY LPC compositor + pack
├── evg/                           # COPY gallery/evg primitives
├── model3d/                       # COPY model readers + tests
├── ui/                            # COPY retained UI widgets
├── web/                           # COPY browser publish / VFS host
├── render/                        # LAST — backends only read host state
│   └── backends/
│       ├── software/
│       └── gl/
├── games/                         # selected 2D + 3D titles on v2 API
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
    │   ├── d_2d/                  # ranger:2d parity (D-2D)
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
| **10b** | **D-2D** `ranger:2d` (gates D-2D-1…D-2D-6 headless first) | 2, 5, 8 | No* |
| **11** | Render backends + Camera2D / sprite present (SW + GPU) | 6–10b | **Yes** |
| **12** | Migrate games + D-2D-7…10 + `RETIRE-RECONCILE` | 11 | Yes |

\*Retained create/free, atlas load (fake bytes), animation clock, and DrawList2D
“no handle minted” tests are headless; equivalent SW/GPU camera samples need
Phase 11.

Phases 1–5 are the critical path: **before any frame is drawn**, create and free
objects through both bridges under unit tests (ownership rules included).

---

## Phase 0 — Scaffold + staged modular copies (current step)

**Deliverable**

- [`CODE_CLEANUP_PLAN.md`](./CODE_CLEANUP_PLAN.md) (this file)
- [`v2/`](./v2/) directory tree with a `README.md` in every folder
- [`v2/games/`](./v2/games/) ready for selected ports (no bulk game copy yet)
- Staged copies of modular tested packages (physics, three port, evaluator,
  wasm headers, sprites, lpc, evg, model3d, ui, web)

**Done when**

- Layout matches the tree above (including `sprites/`)
- Each README states: purpose, CODE_CLEANUP decisions, planned sources (if any),
  and the unit tests that gate that folder
- Plan states clearly: rebuild in v2 (including games + 2D sprites), do not
  delete v1
- Staged copies exist; rewire/live wiring is later phases

**Do not**

- Copy `three/tsx` or `physics/tsx` reconciler bridges into v2
- Treat staged copies as live (games still must not depend on broken imports)
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

## Phase 10b — D-2D `ranger:2d` (migration gates)

Implement the binding decision in CODE_CLEANUP **D-2D**. Staged `sprites/` /
RGSP1 / LPC are **inputs to migrate**, not the long-term API.

| Gate | Deliverable |
|------|-------------|
| **D-2D-1** | Registry classes + generated TS/Rust (`ranger:2d` / `two_d`) |
| **D-2D-2** | One atlas format via `runtime.assets.loadSpriteAtlas` (TS + WASM) |
| **D-2D-3** | Retained `Sprite2D` with stable handle identity |
| **D-2D-4** | Shared `Camera2D` (math first; SW/GPU present in Phase 11) |
| **D-2D-5** | `AnimationClip2D` + `AnimationPlayer2D` on `runtime.time` |
| **D-2D-6** | Frame-local `DrawList2D` separate from retained objects |
| **D-2D-7** | Migrate `game_sprite` users → retained `ranger:2d` |
| **D-2D-8** | Migrate RGSP1 ready-character games → SpriteAtlas / AnimationPlayer2D |
| **D-2D-9** | Migrate `.as` `drawSprite` → `DrawList2D` |
| **D-2D-10** | Delete old sheet manifests, fixed slots, runner animation clocks after parity |

**Parity tests (required)** — also listed in CODE_CLEANUP implementation gates:

- Same `Sprite2D` retains the same handle after reorder/reparent
- Two sprites share one atlas and texture handle
- Releasing one sprite does not release the shared atlas
- Removing a sprite from a layer does not release it
- Software and GPU camera transforms produce equivalent coordinates
- TS and Rust/WASM resolve the same atlas region
- Animation produces the same frame at a given runtime time
- Immediate draw-list commands do not leak persistent handles
- Body-to-sprite binding rejects stale body or sprite handles
- Atlas/resource counts remain stable across hot reload

---

## Phase 11 — Render (first time pixels are required)

Backends under `v2/render/backends/` **read** host state only. Rendering is not
a sync boundary (D-SYNC). Software backend first for CI; GL/SDL second.
**2D present** (sprites, shapes, tilemaps) must honor the same `Camera2D` as
3D paths honor their cameras — D-2D-4 completes here for SW/GPU parity.

**Gate:** cube/teapot from live handles (adapter + WASM) without reconciler;
plus retained `Sprite2D` + atlas smoke on software (and GPU when available).

---

## Phase 12 — Selected games + D-2D-7…10 + retire reconciler

Re-home gameplay onto the new API; **leave the old games tree untouched**.

1. **Select** titles spanning **2D and 3D** (cube / teapot / Cannon toy /
   Pac-Man or Breakout / LPC character — list in `v2/games/README.md`).
2. Copy or rewrite onto `ranger:2d` / `ranger:three` / `ranger:core` (not
   RGSP1 slots or reconciler wrappers).
3. Complete **D-2D-7…D-2D-10** for migrated titles.
4. `RETIRE-RECONCILE` + delete retired sprite slot/manifest paths when parity
   is green. Still do not require deleting v1 games.

---

## Selective copy / rewrite list (guidance)

Bring pieces **into v2 only when a phase or a selected game needs them**. Prefer
copy-then-adapt when the source is mature; rewrite when it is reconciler-era
tangled. **Never delete the v1 original** as part of a port.

| Keep in v1 (reference; do not delete) | Why |
|---------------------------------------|-----|
| Top-level `games/*` | Source of truth for “what the game did”; ports land in `v2/games/` |
| `three/tsx/*`, `physics/tsx/*` | Reconciler-era bridges — not copied into v2 |
| Full `scripting/*` | Engine runners stay as reference; pieces staged under `sprites/`, etc. |

| Already staged under `v2/` (rewire next) | Phase |
|------------------------------------------|-------|
| `interp/migrate/src` evaluator slice | 1 |
| `three/port` math/object model (+ backends later) | 2–7, 11 |
| `bridge/wasm/legacy_blocks` | 5 / sprites / UI |
| `physics/cannon` | 9 |
| `sprites/*`, `lpc/` → migrate into `ranger:2d` | 10b–12 (D-2D-*) |
| `evg/`, `ui/` | with soft-2D / UI |
| `registry/schema/two_d`, `modules/ranger_2d` | 10b D-2D-1 |
| `model3d/`, `web/` | 10–12 |
| Selected small games → `v2/games/<name>/` | 12 |

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
| 7. Virtual modules + `runtime` (incl. `ranger:2d`) | 8, 10b |
| 8. D-2D retained 2D + atlas + camera + anim + draw list | 10b–12 (D-2D-1…10) |
| 9. Demos → `runtime.start` / `export_game!` (2D + 3D) | 10–12 (`v2/games/`) |
| 10. `RETIRE-RECONCILE` + retire sprite slots/manifests | 12 |

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
- [ ] **Phase 10b** — D-2D-1…D-2D-6 (`ranger:2d` registry, atlas, Sprite2D, Camera2D math, anim, DrawList2D)
- [ ] **Phase 11** — SW/GPU present + Camera2D parity (3D + 2D)
- [ ] **Phase 12** — D-2D-7…10 game migrations + `RETIRE-RECONCILE` (v1 kept)

---

## Out of scope for early phases

- Browser `requestAnimationFrame` as the primary game loop (host ticks `Game`)
- Reconciler improvements
- Full Three.js API surface (grow registry class-by-class)
- Shipping `ranger_wasm` to crates.io (layout + tests first)
- Deleting or “replacing in place” top-level `games/` / `three/` / `scripting/`
)
