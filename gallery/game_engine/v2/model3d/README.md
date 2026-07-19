# model3d — staged glTF / model readers

**Copied from:** `gallery/game_engine/model3d/` (demo/ excluded).

Readers, mesh/scene bridges, texture decode, and existing tests. Wire into
`ranger:three` asset loading (D-ASYNC) rather than keeping a parallel script
bridge forever.

**Plan phase:** after geometry arenas (Phase 7) / assets (Phase 8 `runtime.assets`).

## Unit / contract tests that gate this folder

- `tests/*Test.rgr` / `run.sh` (re-home paths as needed)
