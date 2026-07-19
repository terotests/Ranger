# host/tests/dispose_backend

GPU/backend dispose without object release.

**Plan phase:** 6 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-LIFE
- D-HANDLE

## Unit / contract tests that gate this folder

- dispose_backend_then_reuse_geometry_handle

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 6 ✅ green

`dispose_backend_test.rgr` (16 checks): `geometryDisposeBackend` bumps
`resourceRevision` and invalidates backend caches but does NOT release the handle
or CPU data — the geometry stays live, re-attachable, and readable.
`contentRevision` (data writes) and `resourceRevision` (backend dispose) are
separate counters; release, unlike dispose, actually frees the object.
