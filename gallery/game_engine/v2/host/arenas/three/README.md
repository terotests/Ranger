# arenas/three — drawable host objects

Scene graph objects owned by the host (not the guest).

**Plan phase:** 2 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-TYPE
- D-SYNC
- D-GEO

## To implement

- geometry → material → mesh → scene/camera order in Phase 2

## Unit / contract tests that gate this folder

- create_release for each arena; shared geo retain counts

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
