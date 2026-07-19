# v2 — ground-up engine (live objects)

Greenfield implementation of the CODE_CLEANUP binding contract. Headless
interpreter + host arenas + WASM bridge first; rendering last.

**Plan phase:** 0+ — see [`CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md).

## Binding decisions

- All D-* in [`CODE_CLEANUP.md`](../CODE_CLEANUP.md)

## Top-level map

| Folder | Role | First real work |
|--------|------|-----------------|
| [`registry/`](./registry/) | Schema + codegen for every surface | Phase 3 |
| [`interp/`](./interp/) | TSX evaluator, identity, adapter (staged sources under `migrate/src`) | Phase 1 → 4 |
| [`host/`](./host/) | Handles, typed arenas, ownership (D-OWN), commands | Phase 2 |
| [`bridge/`](./bridge/) | WASM imports, legacy block headers, module inject, parity | Phase 5 |
| [`modules/`](./modules/) | `ranger:core` / **`ranger:2d`** / `three` / `cannon` + `ranger_wasm` | Phase 8–10b |
| [`runtime/`](./runtime/) | Host-driven `Game` loop | Phase 8–10 |
| [`physics/`](./physics/) | Staged Cannon port + step wiring | Phase 9 |
| [`three/`](./three/) | Staged Three class port + tests (no `tsx` bridge) | Phase 2–7 |
| [`sprites/`](./sprites/) | Staged v1 sprite sources → migrate to **`ranger:2d`** (D-2D) | Phase 10b–12 |
| [`lpc/`](./lpc/) | LPC compositor → SpriteAtlas assets | Phase 10b |
| [`evg/`](./evg/) | EVG layout/vector primitives (staged) | UI / soft-2D |
| [`model3d/`](./model3d/) | glTF / model readers (staged) | Phase 10 |
| [`ui/`](./ui/) | Retained UI widgets (staged) | with EVG |
| [`web/`](./web/) | Browser VFS + publish framework (staged) | after headless gates |
| [`render/`](./render/) | Backends only — **do not start early** | Phase 11 |
| [`games/`](./games/) | Selected **2D + 3D** titles on v2 API (v1 kept) | Phase 12 |
| [`tests/`](./tests/) | Cross-cutting unit + D-* contract gates | Phase 1+ |

Each subdirectory has its own `README.md` listing what to implement and which
unit tests gate that folder.

## To implement

- Fill child folders per `CODE_CLEANUP_PLAN.md` phases
- Do not import the reconciler or `three/tsx` wrapper tree here
- Phase 5 headline: `bridge/wasm/tests/create_free` — create/free over `rg_*`
  before any renderer exists
- Rebuild **including games** under `games/` — select, copy-or-rewrite; **do not
  delete** top-level `../games/`
- **`ranger:2d` is P1** (CODE_CLEANUP D-2D) — sibling of `ranger:three`, not
  `THREE.Sprite`; staged `sprites/` / RGSP1 migrate via D-2D-1…10
- Staged copies are present; rewire imports before treating them as live

## Unit / contract tests that gate this folder

- `tests/unit/*` and `tests/contract/*` are the cross-cutting gates
- A phase is done only when its folder README tests pass
- Staged ports bring their upstream `*_test.rgr` files — re-home runners next

## Notes

- Plan: [`../CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md) (rebuild policy +
  **Staged modular imports** + **2D sprites**)
- Contract: [`../CODE_CLEANUP.md`](../CODE_CLEANUP.md)
- v1 trees stay as reference; work and game ports land in v2

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
