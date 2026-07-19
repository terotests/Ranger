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

---

## Progress — Phase 1 (D-IDENTITY) ✅ green

`RgSemantics.rgr` implements the JS reference-semantics collections over
`RgValue`:

- `RgMap` / `RgSet` — ordered, key objects by **reference identity** and
  primitives by value; a missing `RgMap.get` returns `undefined` (not `null`).
- `RgArrayOps.rgIndexOf` / `rgIncludes` — array search preserving strict
  reference semantics.

**Gate:** `tests/rg_semantics_test.rgr` (29 checks) covering the four gated
cases `ref_triple_equals`, `map_set_object_keys`, `missing_property_undefined`,
`array_indexOf_includes_identity`. Run via `bash ../../tests/run.sh`.
