# bridge/parity — TSX vs WASM command parity

Same registry commands from both guest kinds; compare host traces.

**Plan phase:** 5 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-REGISTRY
- D-MODULES
- D-SYNC

## To implement

- Record command stream from adapter path and WASM path

## Unit / contract tests that gate this folder

- box_create_sequence_identical
- release_sequence_identical

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
