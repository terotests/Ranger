# host/handles — fat generation-checked handles

Two-word handles with realm + generation; retain/release.

**Plan phase:** 2 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-HANDLE

## To implement

- pack/unpack; reject stale/cross-realm; document wrap policy

## Unit / contract tests that gate this folder

- roundtrip
- stale_rejected
- cross_realm_rejected

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
