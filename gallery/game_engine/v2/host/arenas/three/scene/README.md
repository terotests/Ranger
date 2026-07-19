# arenas/three/scene

Scene arena: create, add/remove child membership.

**Plan phase:** 2 — see [`CODE_CLEANUP_PLAN.md`](../../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-TYPE
- D-LIFE

## To implement

- sceneCreate / sceneRelease (+ membership ops where applicable)

## Unit / contract tests that gate this folder

- scene_create_release
- stale_handle_after_release

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
