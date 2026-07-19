# modules/ranger_wasm — Rust helper crate layout

Wraps generated ABI: handles, strings, spans, callbacks, error codes.

**Plan phase:** 5,8 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-WASM
- D-MODULES
- D-HANDLE

## To implement

- Mirror CODE_CLEANUP Rust examples; export_game! macro

## Unit / contract tests that gate this folder

- OwnedHandle Drop releases; Clone retains

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
