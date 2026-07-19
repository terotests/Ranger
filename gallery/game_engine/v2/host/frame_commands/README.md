# host/frame_commands — frame-owned command buffers

Immediate / per-frame command lists. **Not** typed arenas: entries do not mint
persistent generation-checked object identity (D-HANDLE).

Contrast with [`../arenas/`](../arenas/) (retained object pools).

**Plan phase:** 10b+ (2D draw list); other domains may grow similar folders.
