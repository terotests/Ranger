# runtime — host-driven game loop

Frame ticks from the host into Game::update — not browser RAF as primary.

**Plan phase:** 8,10 — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-MODULES frame pipeline (drain D-ASYNC completions between turns)
- D-MODULES
- D-SYNC

## To implement

- InitContext / GameContext / FrameInfo

## Unit / contract tests that gate this folder

- host_calls_update_N_times

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 8b (frame pipeline) ✅ green

`frame/RgFramePipeline.rgr` implements the host-owned 8-step tick: snapshot input
→ drain async completions (D-ASYNC resolves at the frame boundary, never
mid-update) → deliver resize → `game.update(frame)` (guest issues fixedStep /
render) → present (zero render calls re-present the previous frame, never
renders implicitly) → advance input edges. No update runs before async `init()`
resolves; an update error stops the realm (shutdown + D-OWN teardown, no retry).
Gates: `frame/tests/frame_pipeline_test` (18), `tests/clock_test` (11 —
`runtime.time` fixed-step accumulator).
