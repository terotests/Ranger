# tests/contract/d_life

Contract tests enforcing D-LIFE.

**Plan phase:** 5+ — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-LIFE

## Unit / contract tests that gate this folder

- remove_ne_release
- dispose_backend_ne_release
- shared_geo_refcount

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 6 ✅ green

`d_life_contract_test.rgr` (12 checks): object ≠ membership ≠ backend lifetimes.
A shared geometry backs two meshes (one `geoH`, refcount 2); membership churn and
`disposeBackend` never free it; releasing one mesh keeps it live for the other;
only the last owner's release frees it.
