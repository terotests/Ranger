// ============================================================================
// cannon3d — a visible three + cannon demo (the classic net example).
// ============================================================================
// A tsx guest that renders a 3D scene with ranger:three and simulates it with
// ranger:cannon: a row of coloured boxes drops onto a ground plane and comes to
// rest, exactly like the three.js + cannon-es demos. Each frame:
//
//     world.step(dtMs / 1000)                       // cannon integrates
//     mesh.setTransform(body.posX(), .posY(), .posZ(), 0, 0, 0)   // three follows
//
// Physics runs in its own arena (D-TYPE); the only coupling is the pose copy.
// The 3D scene renders to a render target that a single full pane displays
// (SceneSprite3D), so it shows on the SDL window like every other game.
// ============================================================================

import { runtime } from "ranger:core";
import * as TWO from "ranger:2d";
import * as THREE from "ranger:three";
import * as CANNON from "ranger:cannon";

const VIEW_W = 480;
const VIEW_H = 270;

class Cannon3DGame {
  layer = null;
  cam2d = null;
  renderer = null;
  renderer3d = null;
  view = null;
  world = null;
  boxes = null;    // [{ mesh, body }]
  nowMs = 0;

  init() {
    // single full pane
    runtime.surface.setLayout("single");
    this.layer = new TWO.Layer2D();
    this.cam2d = new TWO.Camera2D();
    this.renderer = new TWO.Renderer2D();
    this.renderer3d = new THREE.Renderer3D();
    runtime.surface.attachRenderer(this.renderer);

    // ---- 3D scene: a row of falling boxes ---------------------------------
    // Unlit (basic) materials so the colours read directly through the SW
    // renderer — no dependency on a light rig. No ground MESH: the cannon
    // static plane (invisible) is where the boxes stop, so the floor reads as
    // the rest line. (A large ground plane projects to a near-horizon triangle
    // that is pathologically slow to software-rasterise.)
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, VIEW_W / VIEW_H, 0.5, 80);
    // back and slightly above, a gentle downward tilt to see the boxes settle
    camera.setPose(0.0, 4.0, 18.0, -0.18, 0.0, 0.0);

    // ---- cannon world: gravity + a static ground + dynamic boxes ----------
    this.world = new CANNON.World();
    this.world.setGravity(0, -9.8, 0);
    this.world.addStaticPlane(0, 1, 0);

    const colors = [16733525, 16755029, 6737151, 8378293, 16777045, 10079487];
    const half = 0.75;
    this.boxes = [];
    let i = 0;
    while (i < 6) {
      const bx = (i - 2.5) * 2.2;          // spread across x
      const by = 3.0 + i * 1.2;            // staggered drop heights
      const geo = new THREE.BoxGeometry(half * 2, half * 2, half * 2);
      const mat = new THREE.MeshBasicMaterial(colors[i]);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.setTransform(bx, by, 0, 0, 0, 0);
      scene.add(mesh);
      const body = this.world.addBox(1.0, bx, by, 0, half, half, half);
      // a gentle sideways nudge so the pile scatters as it lands
      body.setVelocity((i - 2.5) * 0.6, 0, 0);
      this.boxes[i] = { mesh: mesh, body: body };
      i = i + 1;
    }

    // ---- present: the scene renders to a target the pane displays ---------
    const rt = runtime.graphics.createRenderTarget({ width: VIEW_W, height: VIEW_H });
    const sprite = new TWO.Sprite2D({ source: rt.colorTexture.view() });
    sprite.setSize(VIEW_W, VIEW_H);
    sprite.setZ(1);
    this.layer.add(sprite);
    this.view = new THREE.SceneSprite3D({
      scene: scene,
      camera: camera,
      target: rt,
      sprite: sprite,
      resolution: { width: VIEW_W, height: VIEW_H },
      update: "everyFrame"
    });
    this.view.sync(this.renderer3d);
    return 1;
  }

  update(props) {
    const dt = props.dtMs;
    this.nowMs = this.nowMs + dt;

    // cannon integrates (seconds), then three follows the body poses
    this.world.step(dt / 1000);
    let i = 0;
    while (i < this.boxes.length) {
      const b = this.boxes[i];
      b.mesh.setTransform(b.body.posX(), b.body.posY(), b.body.posZ(), 0, 0, 0);
      i = i + 1;
    }

    // re-render the 3D into the target and draw it to the pane
    this.view.sync(this.renderer3d);
    this.renderer.render(this.layer, this.cam2d, 0);
    return 1;
  }
}

const __game = new Cannon3DGame();
runtime.start(__game);
