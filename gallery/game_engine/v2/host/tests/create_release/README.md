# host/tests/create_release

Create and free objects; refcount zero frees slot.

**Plan phase:** 2 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-HANDLE
- D-TYPE

## Unit / contract tests that gate this folder

- geometry_material_mesh_create_release
- double_release_errors

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 2 ✅ green

`create_release_test.rgr` (15 checks): create → live (refcount 1) + payload
readback; release → slot freed (`liveCount` 0); second release through the same
wrapper → typed `DOUBLE_RELEASE`; a reused slot returns a fresh generation so the
old wrapper's handle stays stale.
