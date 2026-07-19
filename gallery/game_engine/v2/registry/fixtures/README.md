# registry/fixtures — tiny schemas for tests

Minimal schema snippets (e.g. Mesh + Geometry only) so codegen tests stay fast.

**Plan phase:** 3 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-REGISTRY

## To implement

- Hand-written YAML/JSON covering create/release + one property

## Unit / contract tests that gate this folder

- fixture schema round-trips through every codegen backend

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 3 ✅

`three_schema_fixture.rgr` provides the Mesh/Geometry/Material schema + golden id
table consumed by the schema/codegen/golden tests.
