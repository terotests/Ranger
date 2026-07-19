# interp/adapter — native object adapter

Sole interpreter route to host: construct / getProperty / setProperty / invokeMethod.

**Plan phase:** 4 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-ADAPTER
- D-PROP
- D-SYNC

## To implement

- Translate registry ids → host commands
- Enforce residency; never reconcile on render

## Unit / contract tests that gate this folder

- construct_mesh_once
- same_script_object_same_handle
- unknown_read_undefined_no_host_call

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
