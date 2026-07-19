# physics — v2 physics area

| Path | Role |
|------|------|
| [`cannon/`](./cannon/) | Staged, well-tested Cannon port (from v1 `physics/src`) |
| [`step/`](./step/) | Host `fixed_step` wiring (to implement) |
| [`tests/`](./tests/) | Cross-cutting physics gates |

Live handles eventually sit in `host/arenas/physics/`.

---

## Progress — Phase 9 (headless physics) ✅ green

`step/RgPhysicsWorld.rgr` is a rigid-body world in its OWN arena (separate slot
space from Three, D-TYPE): `bodyCreate` (mass 0 = static), `setVelocity`,
`step(dt)` semi-implicit-Euler gravity integration, and pose reads. Body handles
are generation-checked and release-safe (double release → typed error). The
step clock comes from `runtime.time`.

**Gates (green):** `tests/physics_step_test` (11 — create/step/read, static
bodies never move) and `tests/pose_sync_test` (8 — a stepped body pose copied
into a mesh via host commands bumps the mesh hybrid HOST revision; a retained
position mirror stays a within-turn snapshot and refreshes to the physics pose
next turn, Phase-4 invariants). Run via `bash ../tests/run.sh`.
