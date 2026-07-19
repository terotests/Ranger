# physics — step & pose sync (headless)

Physics stepping that writes body pose; mesh sync via host commands.

**Plan phase:** 9 — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-TYPE
- D-SYNC

## To implement

- Reuse Cannon kernels selectively; no SDL runners

## Unit / contract tests that gate this folder

- fixed_step_changes_pose
- pose_copy_to_mesh_commands

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*
