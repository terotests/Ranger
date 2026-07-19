# wasm/tests/retain_release

Refcount via retain/release (Rust Clone/Drop later).

**Plan phase:** 5 — see [`CODE_CLEANUP_PLAN.md`](../../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-WASM
- D-HANDLE

## Unit / contract tests that gate this folder

- retain_keeps_alive
- release_at_zero_frees
- mesh_retains_geometry

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
