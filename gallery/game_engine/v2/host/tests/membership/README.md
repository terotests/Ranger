# host/tests/membership

Scene graph membership vs object lifetime.

**Plan phase:** 6 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-LIFE
- D-HANDLE

## Unit / contract tests that gate this folder

- scene_remove_does_not_release
- readd_same_handles

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 6 ✅ green

`membership_test.rgr` (15 checks): a scene arena + `entitySetParent` /
`entityDetach` model scene membership as pure edges. `scene.add` / `scene.remove`
never change refcounts; removing a mesh leaves the mesh + geometry + material
handles fully live and re-addable.
