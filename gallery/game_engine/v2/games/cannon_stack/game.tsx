/**
 * Cannon stack — v2 rewrite (does not compile yet).
 *
 * v1: sprites() circles + entities() physics blobs + game_cannon_physics bridge.
 * v2: ranger:cannon bodies + ranger:2d shapes; sync guest-side or PoseBinding2D.
 */

import { runtime, type Game, type FrameInfo } from "ranger:core"
import * as TWO from "ranger:2d"
import * as CANNON from "ranger:cannon"

const BALL_R = 14
const W = 480
const H = 270

/** Guest-only: pairs a physics body with a drawable (D-MODULES guest class). */
class BallVisual {
  constructor(
    readonly body: CANNON.Body,
    readonly shape: TWO.Shape2D,
  ) {}

  syncFromPhysics(): void {
    // bodyH ≠ shapeH — never treat them as the same handle (D-TYPE / D-2D)
    const p = this.body.position
    // Cannon 3D Vec3 — for 2D playfield we use x/y; z ignored.
    // TODO: 2D physics helpers or Vec2 body API — using x/y plane by convention.
    this.shape.position.set(p.x, p.y)
  }
}

class CannonStackGame implements Game {
  private scene!: TWO.Scene2D
  private camera!: TWO.Camera2D
  private renderer!: TWO.Renderer2D
  private world!: CANNON.World
  private balls: BallVisual[] = []
  // MISSING: PoseBinding2D API — would replace syncFromPhysics in update:
  //   runtime.bindings.bindPose2D({ source: body, target: shape, … })

  async init(): Promise<void> {
    this.scene = new TWO.Scene2D()
    this.camera = new TWO.Camera2D()
    this.camera.position.set(W / 2, H / 2)
    this.renderer = new TWO.Renderer2D()
    runtime.surface.attachRenderer(this.renderer)

    this.world = new CANNON.World()
    // TODO: gravity units — v1 used gravityY: 300 in pixel space.
    this.world.gravity.set(0, 300, 0)

    // Floor — static plane/box. MISSING: clean 2D ground helper.
    const ground = new CANNON.Body({ mass: 0 })
    ground.addShape(new CANNON.Plane())
    // HACK: Plane orientation for "floor at y=H-20" is unclear in 2D mapping.
    ground.position.set(0, H - 20, 0)
    this.world.addBody(ground)

    const colors = [0x78c8ff, 0xffc878, 0xc8ff8c]
    const ys = [60, 110, 160]
    for (let i = 0; i < 3; i++) {
      const body = new CANNON.Body({ mass: 1 })
      body.addShape(new CANNON.Sphere(BALL_R))
      // TODO: Sphere vs Circle in 2D — Cannon is 3D; may want Cylinder or custom.
      body.position.set(240, ys[i], 0)
      // v1 restitution 0.05 — material API:
      // body.material = new CANNON.Material({ restitution: 0.05 })
      this.world.addBody(body)

      const shape = new TWO.Shape2D({
        kind: "circle",
        radius: BALL_R,
        color: colors[i],
      })
      this.scene.add(shape)
      this.balls.push(new BallVisual(body, shape))
    }
  }

  update(frame: FrameInfo): void {
    this.world.fixedStep(frame.fixedDelta, frame.delta)
    for (const b of this.balls) {
      b.syncFromPhysics()
    }
    // Prefer later:
    // for (const binding of this.bindings) { /* host already synced */ }

    this.renderer.render(this.scene, this.camera)
  }

  shutdown(): void {
    for (const b of this.balls) {
      this.scene.remove(b.shape)
      b.shape.release()
      this.world.removeBody(b.body)
      b.body.release()
    }
  }
}

runtime.start(new CannonStackGame())
