# wasm/memory — linear memory safety

Bounds-check ptr+len; re-acquire buffer every command.

**Plan phase:** 5,7 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-WASM-MEM

## To implement

- Follow docs/WASM_MEMORY_ABI.md

## Unit / contract tests that gate this folder

- oob_span_typed_error
- no_callback_during_copy

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
