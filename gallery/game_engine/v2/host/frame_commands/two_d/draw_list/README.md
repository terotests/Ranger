# frame_commands/two_d/draw_list — DrawList2D

Frame-owned immediate draw commands for `ranger:2d` (D-2D-6).

**Not an arena.** Do **not** allocate generation-checked object identity for
individual draw commands. Clearing the list at frame end must not look like
`release(handle)`.

**Plan phase:** 10b — D-2D-6.

## Binding decisions

- D-2D (immediate vs retained)
- D-HANDLE (no persistent handles minted here)

## Unit / contract tests that gate this folder

- `tests/contract/d_2d` — `draw_list_no_persistent_handles`
- Staging sources (migration only): [`../../../../sprites/`](../../../../sprites/)
