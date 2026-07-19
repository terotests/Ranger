# render — backends (PHASE 11 — do not start early)

Read-only consumers of host scene state. Never a script sync boundary.

**Plan phase:** 11 — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-SYNC

## To implement

- Empty until Phases 1–10 gates are green
- Software backend first for CI; GL second

## Unit / contract tests that gate this folder

- render_smoke_from_live_handles — only after bridge gates pass

## Notes

- FORBIDDEN early: calling reconcile, creating objects during render

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
