# arenas/two_d/texture — Texture2D

Typed arena for ranger:2d `Texture2D` objects (D-2D, D-TYPE, D-HANDLE).

**Plan phase:** 10b — shared with atlases/sprites (D-OWN).

## Notes

- Often returned from / paired with `runtime.assets` loads (Phase 8).
- Releasing one sprite must not release a shared texture (D-2D parity tests).
