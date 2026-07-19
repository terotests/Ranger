# adapter/overlay — dynamic guest properties

Expando / userData store separate from native props.

**Plan phase:** 4 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-PROP

## To implement

- Unknown write → overlay; sealed classes reject if registry says so

## Unit / contract tests that gate this folder

- expando_not_visible_to_host
- userData_always_guest

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
