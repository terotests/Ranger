# ranger_core/surface

Size, title, cursor, fullscreen — runtime-owned; guest cannot `new Surface`.

**Split-screen / panes** are first-class: layout + `pane(i)` rectangles that
`Camera2D` / renderers target (CODE_CLEANUP D-MODULES — required for any
multi-viewport / 2P title).

**Plan phase:** 8,10 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-MODULES, D-2D (viewport ↔ Camera2D)

## To implement

- `size`, `attachRenderer`, title / cursor / fullscreen
- `setLayout("single" | "split-horizontal" | …)` or explicit pane rects
- `pane(index)` → `{ x, y, width, height, player? }`
- Optional pane ↔ logical player binding for input routing

## Unit / contract tests that gate this folder

- surface_api_smoke_headless
- split_horizontal_two_panes_cover_surface
- render_to_pane_sets_scissor_or_viewport_equivalently_sw_gpu
- single_layout_default_full_surface

---

*Scaffold; panes are contract-required for must-pass 2P ports.*
