# wasm/async — D-ASYNC request slots

begin / poll / cancel / release for loaders; no ABI callbacks.

**Plan phase:** 5,8,10 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-ASYNC
- D-OWN
- D-WASM

## To implement

- requestH owned by caller
- Exactly-once result transfer on first COMPLETE poll
- Completions drained only at frame boundary

## Unit / contract tests that gate this folder

- exactly_once_transfer
- cancel_then_poll_cancelled
- teardown_releases_request_and_result

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
