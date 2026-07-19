# registry/codegen — surface generators

Tools that turn schema into host tables, adapter bindings, WASM, TS, Rust.

**Plan phase:** 3 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-REGISTRY
- D-WASM

## To implement

- Stub generators first (emit name lists); full lowering later

## Unit / contract tests that gate this folder

- Same schema → identical command names on every backend

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
