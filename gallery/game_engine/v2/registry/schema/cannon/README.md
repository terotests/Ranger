# schema/cannon — ranger:cannon

Physics world/body/shapes — separate arenas from Three.

**Plan phase:** 3,9 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-TYPE
- D-MODULES

## Implemented

`cannon_schema.rgr` — the live `ranger:cannon` command surface (classIds 40–41,
command ids in the reserved 4000-range), unioned into the bridge table by
`RgRegistryBridge.create()`:

- World (40): `cannon_world_gravity`, `cannon_world_step`
- Body (41): `cannon_body_sphere` / `cannon_body_box` / `cannon_body_static_plane`
  (mass 0 = static), `cannon_body_set_velocity`, `cannon_body_pos_x/y/z`

Dispatch is backed by `host/arenas/physics/RgPhysicsHost` (the real Cannon port
behind v2 handles). Bodies mint handles in a SEPARATE arena from Three (D-TYPE);
poses come back as doubles for the guest to copy into a Three mesh — the
three + cannon loop. The wasm binding is regenerated from this schema (the drift
guard `wasm_abi_binding_test` enforces it), so wasm guests reach cannon too.

## Unit / contract tests that gate this folder

- `tests/contract/d_physics/cannon_bridge_test` — cannon reachable through the
  bridge; a body falls and drives a Three mesh; no unhandled/errors
- `host/arenas/physics/tests/physics_host_test` — the arena's handle safety
- `physics/tests/three_cannon_sync_test` — the host-level three + cannon seam
