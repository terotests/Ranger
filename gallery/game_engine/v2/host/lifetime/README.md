# host/lifetime — object ≠ membership ≠ backend

Central rules and helpers for the three lifetimes.

**Plan phase:** 6 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-OWN (who retains/releases; complements the three lifetimes)
- D-LIFE

## To implement

- APIs: release, detach, disposeBackend — never conflate

## Unit / contract tests that gate this folder

- See host/tests/membership and dispose_backend

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
