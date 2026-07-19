# schema/cannon — ranger:cannon

Physics world/body/shapes — separate arenas from Three.

**Plan phase:** 3,9 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-TYPE
- D-MODULES

## To implement

- World, Body, BoxShape, Vec3/Quaternion as registered or guest math

## Unit / contract tests that gate this folder

- bodyCreate never allocates a mesh handle

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
