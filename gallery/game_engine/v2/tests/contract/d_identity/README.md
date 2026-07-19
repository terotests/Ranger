# tests/contract/d_identity

Contract tests enforcing D-IDENTITY.

**Plan phase:** 1+ — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-IDENTITY

## Unit / contract tests that gate this folder

- triple_equals
- map_set_keys
- missing_undefined

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 1 ✅ green

`d_identity_contract_test.rgr` (15 checks) is the cross-cutting gate. Beyond the
unit cases it proves the harder contract clauses: **reparenting** a child across
two parents' `children` arrays and **reordering** an array leave `identityId`
untouched (a Map keyed on the moved object still resolves), and a live nativeRef
identity cannot be rebound to a new host handle until released. Run via `bash
../../../tests/run.sh`.
