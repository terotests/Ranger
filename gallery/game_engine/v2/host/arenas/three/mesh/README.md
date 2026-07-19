# arenas/three/mesh

Mesh arena: create(geo,mat), retain shared resources.

**Plan phase:** 2 — see [`CODE_CLEANUP_PLAN.md`](../../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-TYPE
- D-LIFE

## To implement

- meshCreate / meshRelease (+ membership ops where applicable)

## Unit / contract tests that gate this folder

- mesh_create_release
- stale_handle_after_release

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
