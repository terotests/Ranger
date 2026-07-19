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

---

## Progress — Phase 11 (software 2D present) ✅ green

`backends/software/RgSoftwareRenderer2D.rgr` rasterises retained `ranger:2d`
sprites into a CPU `RgFramebuffer` through the shared `Camera2D` (D-2D-4). The
backend READS host state only — rendering is not a sync boundary (D-SYNC): it
allocates no handles and never mutates the scene.

**Gate (green):** `tests/software_present2d_test.rgr` (10) — a sprite lands at
its camera-projected pixel, empty space stays clear, present allocates no
registry handles and leaves sprite positions untouched, re-presenting identical
state is deterministic, panning the camera moves the pixel, and sprites outside
the layer are not drawn. Run via `bash ../tests/run.sh`.
