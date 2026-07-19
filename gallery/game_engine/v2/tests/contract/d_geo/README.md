# tests/contract/d_geo

Contract tests enforcing D-GEO.

**Plan phase:** 5+ — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-GEO aliasing split (native one-copy vs Three-compat staging)
- D-GEO

## Unit / contract tests that gate this folder

- stable_geoh_upload_update_readback
- update_not_new_handle

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 7 (D-GEO / D-WASM-MEM) ✅ green

`d_geo_contract_test.rgr` (30 checks). Native path: `geometryCreateEmpty` mints a
stable `geoH` before any attribute; `geometrySetAttribute` / `geometryUpdateRange`
/ `geometryReadPositions` all mutate the SAME handle (setup + update never
re-create); bulk float arrays cross in one call; OOB update/read return a typed
error without a trap; a zero-element read is success (status separate from
count); two meshes share one `geoH`. Compat path (`three/port/src/RgCompatAttribute.rgr`):
the guest array aliases the script data, a write without `needsUpdate` never
reaches the host (does not render), and `needsUpdate` flushes the tracked range
so the host range is byte-equal. Run via `bash ../../../tests/run.sh`.
