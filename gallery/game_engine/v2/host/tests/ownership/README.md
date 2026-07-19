# host/tests/ownership — D-OWN gate suite

Ownership table conformance without rendering.

**Plan phase:** 2,6 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-OWN

## To implement

- Cover create / getter / meshCreate retain / setGeometry swap / release-once

## Unit / contract tests that gate this folder

- ownership_table_create_getter_mesh
- realm_teardown_releases_all

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 2 ✅ green

`ownership_test.rgr` (29 checks): `meshCreate` retains geo+mat (refcount 1→2),
getters borrow (no refcount change), `meshSetGeometry` retains new / releases
old, and releasing the mesh drops only the mesh's strong refs (caller-owned
objects stay live until the caller releases them).
