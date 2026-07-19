# interp/semantics — JS reference semantics

===, Map/Set keys, missing → undefined — blocks live adapter until green.

**Plan phase:** 1 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-IDENTITY

## To implement

- component_engine_js_semantics_test suite lands here

## Unit / contract tests that gate this folder

- ref_triple_equals
- map_set_object_keys
- missing_property_undefined
- array_indexOf_includes_identity

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
