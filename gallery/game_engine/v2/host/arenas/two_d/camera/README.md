# arenas/two_d/camera

Typed arena for ranger:2d `camera` objects (D-2D, D-TYPE, D-HANDLE).

**Plan phase:** 10b — D-2D-3…D-2D-6.

## Notes

- `draw_list` entries are frame-local: do **not** allocate generation-checked
  object identity for individual draw commands.
- Staged migration sources: [`../../../../sprites/`](../../../../sprites/)
