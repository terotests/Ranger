# wasm/lifecycle — game export host side

Host calls ranger_game_create/init_poll/update/resize/shutdown.

**Plan phase:** 5,10 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-MODULES

## To implement

- Wire export_game! guests later; Phase 5 may stub

## Unit / contract tests that gate this folder

- host_tick_invokes_update_export

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
