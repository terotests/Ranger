# physics/tsx — the CANNON TSX façade (run cannon-es scripts on the Ranger port)

A canonical [cannon-es](https://github.com/pmndrs/cannon-es) script runs **1:1**
in the TSX interpreter against a thin `CANNON.*` façade, and the real simulation
is the Ranger Cannon port (`physics/src`, the `Cannon*` classes).

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

## The binding is 1:1 host↔guest (not a per-demo mirror)

Every `CANNON.*` object is a thin **handle** to exactly one host `Cannon*`
object; **the host is the single source of truth**. Constructors create the host
object, methods delegate to it through the native bridge, and there is **no
duplicated physics state on the guest** and **no per-demo reconciliation** — so
*any* cannon-es program drives the real engine, not just the fields one demo
happens to touch.

```
  guest (interpreter)          native bridge            host (Ranger engine)
  new CANNON.World()      ── cannon_world_new() ──►     new CannonWorld   (handle 1)
  new CANNON.Body({mass}) ── cannon_body_new(m) ──►     new CannonBody    (handle 1)
  body.addShape(box)      ── cannon_body_add_shape ─►   CannonBody.addShape
  world.fixedStep()       ── cannon_world_step ──────►  CannonWorld.step
  body.position (view)    ◄─ cannon_body_get ─────────  CannonBody.position
```

The only guest-held state is the transform **view** (`body.position` /
`.quaternion`): the interpreter has no native property interception, so
`World.step()` pulls each body's pose from the host into its view once per step —
**generically over all bodies**, with no per-shape knowledge. Setting an input
(`body.angularVelocity.set(...)`, `world.gravity.set(...)`) forwards to the host
immediately.

## Files

- **`cannon.tsx`** — the façade: `CANNON.*` handle wrappers (`World`, `Body`,
  `Vec3`, `Quaternion`, `Box`, `Sphere`, `Plane`). Every class delegates to the
  host; none holds physics state. Honours the interpreter constraints (no
  `extends`/`super`, no `=== undefined`).
- **`cannon_native_bridge.rgr`** — the host side: `CannonNativeBridge extends
  EvalNativeBridge`, a handle registry over the real `Cannon*` engine, exposing
  the API above as bare native functions.
- **`cannon_box_scene.tsx`** — the canonical falling+spinning box in cannon-es
  notation.
- **`cannon_tsx_bridge_test.rgr`** — end-to-end proof: interpret the scene, drive
  60 frames, assert the façade mesh fell under gravity and spun (the real engine
  pose reached the interpreter). 4/4 ALL PASS.

## Capability hint

`import * as CANNON from 'cannon-es'` (or `@ranger/cannon`, or the demo's relative
`../dist/cannon-es.js`) is a **capability hint** in `ComponentEngine`, not a file
load: the façade classes are in the class table (concatenated), so
`new CANNON.World()` resolves by class name, and the bare `cannon_*` calls route
to the registered `CannonNativeBridge`.

## Extending

Adding a class is adding a handle type, never editing a reconciler. To support
`Cylinder` / `Trimesh` / `ConvexPolyhedron`, constraints, materials, `applyForce`,
raycasts, or collision events: add the `cannon_*` functions to
`cannon_native_bridge.rgr` and the thin wrapper class to `cannon.tsx`.

## Run

```
npm run engine:physics:tsx        # -> "ALL PASS"
```
