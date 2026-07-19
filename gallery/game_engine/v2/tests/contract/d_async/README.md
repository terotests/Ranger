# tests/contract/d_async

Contract tests enforcing D-ASYNC.

**Plan phase:** 5,10 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-ASYNC

## To implement

- Poll semantics + frame-boundary completion delivery

## Unit / contract tests that gate this folder

- exactly_once_result_transfer
- completions_at_frame_boundary
- teardown_with_outstanding_requests

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
