# modules/ranger_cannon — ranger:cannon

Guest Cannon API; handles distinct from Three.

**Plan phase:** 8,9 — see [`CODE_CLEANUP_PLAN.md`](../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-MODULES
- D-TYPE

## Implemented

`ranger_cannon.tsx` — the guest façade, registered by `RgGameHost` as
`ranger:cannon` (opt-in, like `ranger:three`). A game imports it and drives the
real Cannon port through the same native command path as ranger:2d/three:

```tsx
import * as CANNON from "ranger:cannon";
const world = new CANNON.World();
world.setGravity(0, -9.8, 0);
world.addStaticPlane(0, 1, 0);
const box = world.addBox(1, x, y, z, 0.5, 0.5, 0.5);
// each frame:
world.step(dtMs / 1000);
mesh.setTransform(box.posX(), box.posY(), box.posZ(), 0, 0, 0);
```

`World` (gravity / step / addSphere / addBox / addStaticPlane) and `Body`
(setVelocity / posX / posY / posZ) map to the `cannon_*` schema commands. Bodies
mint handles in the physics arena's own slot space (D-TYPE, distinct from Three).

## Live demo + gates

- `games/cannon3d` — a visible three + cannon game (falling boxes), in the Games
  menu; runs on the SDL build like every other tsx game.
- `tests/e2e/cannon3d_e2e_test` — loads the demo through `RgGameHost`, asserts
  the façade creates the physics bodies, the scene renders, and the falling
  boxes animate the framebuffer.
- Lower layers: `tests/contract/d_physics/cannon_bridge_test`,
  `host/arenas/physics/tests/physics_host_test`.
