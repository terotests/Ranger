# host/commands — registry command implementations

Host-side functions named by the registry (meshCreate, handleRelease, …).

**Plan phase:** 2,4,5 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-REGISTRY
- D-SYNC

## To implement

- Thin command layer over arenas; shared by adapter and WASM

## Unit / contract tests that gate this folder

- command_trace_for_parity_harness

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
