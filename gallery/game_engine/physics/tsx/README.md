# physics/tsx — the CANNON TSX façade (run cannon-es scripts on the Ranger port)

The physics analogue of `three/tsx`. A canonical [cannon-es](https://github.com/pmndrs/cannon-es)
script runs **1:1** in the TSX interpreter against a thin `CANNON.*` façade, and
the real simulation is the Ranger Cannon port (`physics/src`, the `Cannon*`
classes), reached by a bridge — exactly the `three.tsx` + `ThreeTsxBridge`
pattern.

```
import * as CANNON from '../dist/cannon-es.js';

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
const body = new CANNON.Body({ mass: 1 });
body.addShape(new CANNON.Box(new CANNON.Vec3(1, 1, 1)));
body.angularVelocity.set(0, 10, 0);
world.addBody(body);

// each frame:
world.fixedStep();
mesh.position.copy(body.position);
mesh.quaternion.copy(body.quaternion);
```

## Files

- **`cannon.tsx`** — Layer 1 façade: thin `CANNON.*` data classes (`World`,
  `Body`, `Vec3`, `Quaternion`, `Box`, `Sphere`, `Plane`, `Material`,
  `ContactMaterial`). Plain state + trivial methods; no physics. Honours the
  interpreter constraints (no `extends`/`super`, no `=== undefined`).
- **`cannon_tsx_bridge.rgr`** — the reconcile+step bridge. `build()` reads the
  interpreted `world` (gravity, bodies, each body's shape) and constructs the
  real `CannonWorld` + `CannonBody`; `stepFrame(dt)` advances the Ranger
  simulation and writes each body's `position`/`quaternion` **back** onto the
  façade objects (`EvalValue.setMember`), so the interpreted
  `mesh.position.copy(body.position)` reads the simulated pose. Pure Ranger —
  compiles to ES6 and C++.
- **`cannon_box_scene.tsx`** — the canonical falling+spinning box, using the
  cannon-es notation above.
- **`cannon_tsx_bridge_test.rgr`** — end-to-end proof: interpret the scene, drive
  60 frames through the bridge, and assert the façade mesh fell under gravity and
  spun (the write-back reached the interpreter).

## Capability hint

`import * as CANNON from 'cannon-es'` (or `@ranger/cannon`, or the demo's relative
`../dist/cannon-es.js`) is a **capability hint** in `ComponentEngine`, not a file
load: the façade classes are in the class table (concatenated), so
`new CANNON.World()` resolves by class name; the `CANNON` namespace constants come
from a host-registered global.

## Run

```
npm run engine:physics:tsx        # -> "ALL PASS"
```
