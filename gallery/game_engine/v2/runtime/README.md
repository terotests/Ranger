# runtime — host-driven game loop

Frame ticks from the host into Game::update — not browser RAF as primary.

**Plan phase:** 8,10 — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-MODULES
- D-SYNC

## To implement

- InitContext / GameContext / FrameInfo

## Unit / contract tests that gate this folder

- host_calls_update_N_times

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
