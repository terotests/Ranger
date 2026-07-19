# arenas/two_d/camera — Camera2D

Typed arena for ranger:2d `Camera2D` objects (D-2D, D-TYPE, D-HANDLE).

**Plan phase:** 10b — D-2D-4 (math); Phase 11 (SW/GPU present parity).

## Notes

- One shared camera math model for pointer/culling across backends.
- Split-screen uses multiple cameras bound to surface viewports (Phase 10).
- Staged migration sources: [`../../../../sprites/`](../../../../sprites/)
