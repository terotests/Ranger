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
| [`interp/`](./interp/) | TSX evaluator, identity, adapter | Phase 1 → 4 |
| [`host/`](./host/) | Handles, typed arenas, commands | Phase 2 |
| [`bridge/`](./bridge/) | WASM imports, module inject, parity | Phase 5 |
| [`modules/`](./modules/) | `ranger:*` + `ranger_wasm` façades | Phase 8 |
| [`runtime/`](./runtime/) | Host-driven `Game` loop | Phase 8–10 |
| [`physics/`](./physics/) | Headless step + pose sync | Phase 9 |
| [`render/`](./render/) | Backends only — **do not start early** | Phase 11 |
| [`tests/`](./tests/) | Cross-cutting unit + D-* contract gates | Phase 1+ |

Each subdirectory has its own `README.md` listing what to implement and which
unit tests gate that folder.

## To implement

- Fill child folders per `CODE_CLEANUP_PLAN.md` phases
- Do not import the reconciler or `three/tsx` wrapper tree here
- Phase 5 headline: `bridge/wasm/tests/create_free` — create/free over `rg_*`
  before any renderer exists

## Unit / contract tests that gate this folder

- `tests/unit/*` and `tests/contract/*` are the cross-cutting gates
- A phase is done only when its folder README tests pass

## Notes

- Plan: [`../CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md)
- Contract: [`../CODE_CLEANUP.md`](../CODE_CLEANUP.md)
- v1 demos remain under `three/`, `scripting/`, `games/` until Phase 12

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
