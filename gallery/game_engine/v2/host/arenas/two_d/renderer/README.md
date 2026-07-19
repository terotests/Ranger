# arenas/two_d/renderer — Renderer2D

Typed arena for ranger:2d retained `Renderer2D` present/config state
(D-2D, D-TYPE, D-HANDLE). Pixel backends live under `v2/render/` (Phase 11).

**Plan phase:** 10b (handle + state); Phase 11 (SW/GPU present).

## Notes

- Retained object — not the frame `DrawList2D` buffer.
- Immediate commands: [`../../../frame_commands/two_d/draw_list/`](../../../frame_commands/two_d/draw_list/)
