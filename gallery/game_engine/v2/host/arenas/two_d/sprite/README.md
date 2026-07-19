# arenas/two_d/sprite — Sprite2D

Typed arena for ranger:2d `Sprite2D` objects (D-2D, D-TYPE, D-HANDLE).

**Plan phase:** 10b — D-2D-3.

## Notes

- Retained handle identity survives reorder/reparent.
- Immediate draws use [`../../../frame_commands/two_d/draw_list/`](../../../frame_commands/two_d/draw_list/), not this arena.
- Staged migration sources: [`../../../../sprites/`](../../../../sprites/)
