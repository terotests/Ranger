# arenas/two_d/atlas — SpriteAtlas

Typed arena for ranger:2d `SpriteAtlas` objects (D-2D, D-TYPE, D-HANDLE).

**Plan phase:** 10b — D-2D-2 (loaded via Phase 8 `runtime.assets`).

## Notes

- Shared resource: releasing one sprite must not release the atlas (D-OWN).
- Staged migration sources: [`../../../../sprites/`](../../../../sprites/)
