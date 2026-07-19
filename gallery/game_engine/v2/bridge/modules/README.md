# bridge/modules — inject ranger:* into a realm

Virtual imports resolved by the runtime for the current realmId.

**Plan phase:** 8 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-MODULES

## To implement

- Map ranger:three → module bindings backed by adapter/WASM

## Unit / contract tests that gate this folder

- import_ranger_three_resolves
- cross_realm_runtime_rejected

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
