# host/tests/stale_cross_realm

Generation and realm checks.

**Plan phase:** 2 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-LIFE
- D-HANDLE

## Unit / contract tests that gate this folder

- stale_generation
- cross_realm_rejected

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 2 ✅ green

`stale_cross_realm_test.rgr` (10 checks): at the command boundary a wrong-arena
handle → `WRONG_TYPE`, a use-after-release handle → `STALE`, a cross-realm forged
handle → `WRONG_REALM`, and the slot-0 sentinel → `INVALID_HANDLE` — every
failure a typed error, never UB.
