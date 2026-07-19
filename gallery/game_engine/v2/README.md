# v2 — ground-up engine (live objects)

Greenfield implementation of the CODE_CLEANUP binding contract. **v2 is the
authoritative new stack**; v1 is a **migration reference** that stays
**runnable** until an explicit archival milestone (see plan Intent).

Headless interpreter + host arenas + WASM bridge first; rendering last.

**Plan phase:** 0+ — see [`CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md).

## Central model

```text
guest identity
    → generated registry command
    → typed host arena  (or frame_commands buffer)
    → renderer reads host state
```

TSX and WASM issue the **same** registry commands. Object lifetime is separate
from scene membership and from backend-resource lifetime (D-LIFE / D-OWN).

**Staged vs live:** copies under `sprites/`, `three/port/`, `physics/cannon/`,
etc. are **staged** (provenance + future rewire). They are not the live engine
until a phase wires them. Do not treat import paths as done at Phase 0.

## Binding decisions

- All D-* in [`CODE_CLEANUP.md`](../CODE_CLEANUP.md)
- Gate order matches plan phases: identity → registry/arenas → adapter →
  ownership/geo → WASM → modules (incl. assets/time) → D-2D → render → games

## Top-level map

| Folder | Role | First real work |
|--------|------|-----------------|
| [`registry/`](./registry/) | Schema + codegen for every surface | Phase 3 |
| [`interp/`](./interp/) | TSX evaluator, identity, adapter (staged sources under `migrate/src`) | Phase 1 → 4 |
| [`host/`](./host/) | Handles, typed **arenas**, **frame_commands** (DrawList2D), ownership | Phase 2 |
| [`bridge/`](./bridge/) | WASM imports, legacy block headers, module inject, parity | Phase 5 |
| [`modules/`](./modules/) | `ranger:core` / **`ranger:2d`** / `three` / `cannon` + `ranger_wasm` | Phase 8–10b |
| [`runtime/`](./runtime/) | Host-driven `Game` loop; assets/time in Phase 8 | Phase 8–10 |
| [`physics/`](./physics/) | Staged Cannon port + step wiring | Phase 9 |
| [`three/`](./three/) | Staged Three class port + tests (no `tsx` bridge) | Phase 2–7 |
| [`sprites/`](./sprites/) | Staged v1 sprite sources → migrate to **`ranger:2d`** (D-2D) | Phase 10b–12 |
| [`lpc/`](./lpc/) | LPC compositor → SpriteAtlas assets | Phase 10b |
| [`evg/`](./evg/) | EVG layout/vector primitives (staged) | UI / soft-2D |
| [`model3d/`](./model3d/) | glTF / model readers (staged) | Phase 8+ (assets) |
| [`ui/`](./ui/) | Retained UI widgets (staged) | with EVG |
| [`web/`](./web/) | Browser VFS + publish framework (staged) | after headless gates |
| [`render/`](./render/) | Backends only — **do not start early** | Phase 11 |
| [`games/`](./games/) | Selected **2D + 3D** titles on v2 API (must-pass: chess, ylos2) | Phase 12 |
| [`tests/`](./tests/) | Cross-cutting unit + D-* contract gates | Phase 1+ |

Each subdirectory has its own `README.md` listing what to implement and which
unit tests gate that folder.

## v1 policy (short)

| Mode | Guarantee |
|------|-----------|
| **Runnable legacy** (current → Phase 12) | Top-level `../games/` stay launchable; v1 `scripting/` / runners frozen |
| **Archival legacy** (later milestone only) | v1 sources kept for reference; only v2 guaranteed runnable |

Phase 12 does **not** delete v1 runtime infrastructure. See plan Intent.

## To implement

- Fill child folders per `CODE_CLEANUP_PLAN.md` phases
- Do not import the reconciler or `three/tsx` wrapper tree here
- Phase 5 headline: `bridge/wasm/tests/create_free` — create/free over `rg_*`
  before any renderer exists
- Rebuild **including games** under `games/` — select, copy-or-rewrite; **do not
  delete** top-level `../games/`
- **`ranger:2d` is P1** (CODE_CLEANUP D-2D) — sibling of `ranger:three`, not
  `THREE.Sprite`; staged `sprites/` / RGSP1 migrate via D-2D-1…10
- Retained 2D objects → `host/arenas/two_d/`; immediate `DrawList2D` →
  `host/frame_commands/two_d/`
- Staged copies are present; rewire imports before treating them as live

## Unit / contract tests that gate this folder

- `tests/unit/*` and `tests/contract/*` are the cross-cutting gates
- A phase is done only when its folder README tests pass
- Staged ports bring their upstream `*_test.rgr` files — re-home runners next

## Notes

- Plan: [`../CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md) (rebuild policy +
  **Staged modular imports** + **2D sprites** + runnable→archival transition)
- Contract: [`../CODE_CLEANUP.md`](../CODE_CLEANUP.md)

---

## Progress log

- **Phase 1 — TSX evaluator core (D-IDENTITY): ✅ green.** A dependency-light,
  v2-owned value slice proves reference identity without Three/rendering:
  `interp/values/` (`RgValue`, `RgRealm`), `interp/semantics/`
  (`RgMap`/`RgSet`/`RgArrayOps`), and the cross-cutting gate
  `tests/contract/d_identity/`.
- **Phase 2 — Host handles + typed arenas (D-HANDLE / D-TYPE / D-OWN): ✅ green.**
  `host/handles/` (fat generation+realm+type handle, two-word transport),
  `host/RgRegistry.rgr` (slot table with stale/cross-realm/wrong-type rejection),
  `host/arenas/RgHost.rgr` (geometry/material/mesh arenas — create/release,
  retain-on-create, borrowed getters, retain-new/release-old, weak attachments),
  `host/ownership/OwnedHandle.rgr` (release-once), and the `tests/contract/d_own/`
  gate.

- **Phase 3 — Registry schema + codegen + golden ids (D-REGISTRY): ✅ green.**
  `registry/schema/` (class/prop/method model with residency+ownership+sync),
  `registry/codegen/` (host/wasm/adapter surfaces from one schema + golden-id
  immutability checker), `registry/fixtures/` (Mesh/Geometry/Material sample +
  golden table). Schema validation, codegen parity, and golden-id gates.

- **Phase 4 — Native adapter (D-ADAPTER / D-PROP / hybrid invariants): ✅ green.**
  `interp/adapter/RgAdapter.rgr` — one `construct`/`getProperty`/`setProperty`
  interface over the arenas: one script object → one host handle, cached
  wrapper per handle, hybrid `position` mirror (identity-stable, turn-snapshot,
  guest-commit-wins), and the D-PROP overlay (unknown write → guest overlay, host
  never sees it). Tests in `interp/adapter/tests/` + `tests/unit/interp/`.

- **Phase 5 — WASM bridge (D-WASM / D-WASM-MEM / D-ASYNC): ✅ green.**
  `bridge/wasm/imports/` (`rg_*` create/retain/release over the same host, two-word
  handle transport), `bridge/wasm/async/` (poll-based D-ASYNC, exactly-once result
  transfer), `bridge/wasm/memory/` (checked span bounds), and `bridge/parity/`
  (adapter and WASM paths produce identical arena traces).

- **Phase 6 — Lifetimes (D-LIFE): ✅ green.** Object ≠ scene membership ≠ backend
  resource lifetime, each with its own commands + tests: `host/tests/membership`
  (scene add/remove are pure edges — handles stay live), `host/tests/dispose_backend`
  (`disposeBackend` bumps `resourceRevision`, keeps the handle + CPU data; separate
  from `contentRevision` and from release), and `tests/contract/d_life` (a shared
  geometry survives until its last owner releases).

- **Phase 7 — Geometry upload / aliasing (D-GEO / D-WASM-MEM): ✅ green.**
  `geometryCreateEmpty` → stable `geoH`; `geometrySetAttribute` / `updateRange` /
  `readPositions` all mutate the same handle with bulk float spans, OOB rejected
  without a trap. The Three-compat wrapper (`three/port/src/RgCompatAttribute.rgr`)
  keeps a guest-aliased staging array; a write without `needsUpdate` never
  renders, and a flush makes the host range byte-equal. Gate: `tests/contract/d_geo`.

- **Phase 8a — Module isolation + runtime root (D-MODULES): ✅ green.**
  `interp/module_isolation/RgModuleSystem.rgr` (per-import namespace objects, no
  clobber, cached same-module import, per-realm instances, failed-init caching,
  circular = hard error) and `modules/ranger_core/RgRuntime.rgr` (per-realm
  capability root with `runtime.time` / `runtime.assets` / `runtime.log`,
  cross-realm rejection, teardown). Gates: `interp/module_isolation/tests`,
  `tests/contract/d_modules`.

Shared harness `tests/harness/RgTest.rgr` + driver `tests/run.sh` (26 suites, 409
checks). Run: `bash tests/run.sh` → `v2 ALL GREEN — 26/26 suites passed`.

*Later phases (8b/9+) arrive incrementally; see `../CODE_CLEANUP_PLAN.md`.*
