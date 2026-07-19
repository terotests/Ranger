# bridge — guest ↔ host crossings

WASM imports, module injection, and TSX↔WASM parity — not game logic.

**Plan phase:** 5+ — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-WASM
- D-WASM-MEM
- D-MODULES

## To implement

- imports lower to host/commands; parity compares traces

## Unit / contract tests that gate this folder

- wasm/tests/create_free is the Phase 5 headline gate

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
