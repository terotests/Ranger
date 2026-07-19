# host — authoritative scene & subsystem state

Typed **arenas** (retained pools) + **frame_commands** (per-frame buffers) +
handles + registry command implementations. No pixels.

**Plan phase:** 2+ — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-TYPE
- D-HANDLE
- D-LIFE
- D-SYNC
- D-OWN
- D-2D (arenas/two_d vs frame_commands/two_d)

## To implement

- Arenas first for retained objects; frame_commands for immediate DrawList2D
- Registry commands call into arenas / frame buffers; render reads later


## Unit / contract tests that gate this folder

- host/tests/* create/release/membership/dispose/stale

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
