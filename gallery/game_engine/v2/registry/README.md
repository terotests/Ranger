# registry — single schema source of truth

Authoritative class/command schema that generates every public surface.

**Plan phase:** 3 — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-REGISTRY ID immutability (golden ids / tombstones)
- D-REGISTRY
- D-WASM
- D-ADAPTER
- D-MODULES

## To implement

- YAML/JSON (or Ranger) schema for classes, properties, methods, ABI lowering
- Generators under codegen/ emit host, adapter, WASM, TS, Rust

## Unit / contract tests that gate this folder

- fixtures: schema samples compile to stable command name/id tables
- codegen drift test: public command names change only with version bump

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
