# fixtures/wasm_guests

Minimal WASM modules that only call create/free/retain/release.

**Plan phase:** 5 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## To implement

- mesh_create_free guest; no render import

## Unit / contract tests that gate this folder

- Loaded by bridge/wasm/tests/create_free

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
