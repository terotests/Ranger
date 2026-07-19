# registry/schema — class & command definitions

Human-authored registry documents split by module.

**Plan phase:** 3 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-REGISTRY
- D-MODULES

## To implement

- One file (or dir) per class family; residency + ownership on every member

## Unit / contract tests that gate this folder

- Schema validation: every host/hybrid prop declares sync boundary

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 3 ✅

`RgSchema.rgr` is the schema model; `validate()` gates that every host/hybrid
prop declares a sync boundary (see `tests/schema_validation_test.rgr`).
