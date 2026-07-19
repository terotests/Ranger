# host — authoritative scene & subsystem state

Typed arenas + handles + command implementations. No pixels.

**Plan phase:** 2+ — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-TYPE
- D-HANDLE
- D-LIFE
- D-SYNC

## To implement

- Arenas first; commands call into arenas; render reads later

## Unit / contract tests that gate this folder

- host/tests/* create/release/membership/dispose/stale

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
