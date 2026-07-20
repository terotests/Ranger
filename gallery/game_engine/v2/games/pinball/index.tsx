// ============================================================================
// pinball — a 3D physics pinball table (ranger:cannon + ranger:three + audio).
// ============================================================================
// A real lit 3D scene rendered through ranger:three: the playfield, pop bumpers,
// slingshots, flippers and the steel ball are 3D meshes with lambert materials,
// shaded by an ambient + directional light rig (lights parented to the scene so
// they actually light it), viewed at an angle like a real cabinet. Cannon drives
// the ball in the 2D playfield plane; its (px,py) maps onto the 3D playfield and
// the ball mesh follows. A DMD score overlay sits on top. Left/right = flippers.
//
// Physics stays y-DOWN in playfield space (py: 0 = top/bumpers, H = flippers), so
// gravity is +py (down the table). 3D map: X = px-W/2, Z = py-H/2, Y = height.

import { runtime } from "ranger:core";
import * as TWO from "ranger:2d";
import * as THREE from "ranger:three";
import * as CANNON from "ranger:cannon";

const W = 360;
const H = 620;
const BALL_R = 9;
const GRAV = 430;
const WALL = 12;
const WALL_BOUNCE = 0.82;
const FLIP_KICK = 540;
const FLIP_SOFT = 190;
const BUMP_KICK = 400;
const SLING_KICK = 360;
const PLUNGE_X = W - 24;
const PLUNGE_Y = 90;
const DRAIN_Y = H - 12;
const VIEW_W = 480;
const VIEW_H = 270;
const RT_W = 440;
const RT_H = 300;
const SC = 0.05;               // px -> 3D units

const BUMPERS = [
  { x: 96, y: 150, r: 26, cr: 90, cg: 150, cb: 255 },
  { x: 180, y: 116, r: 26, cr: 255, cg: 90, cb: 120 },
  { x: 264, y: 150, r: 26, cr: 190, cg: 110, cb: 255 },
];
const SLINGS = [
  { x: 84, y: 452, dir: 1 },
  { x: 276, y: 452, dir: -1 },
];

// map playfield (px,py) -> 3D X/Z on the flat playfield
function mapX(px) { return (px - W / 2) * SC; }
function mapZ(py) { return (py - H / 2) * SC; }

class PinballGame {
  layer = null;
  cam = null;
  renderer = null;
  r3d = null;
  view = null;
  world = null;
  ball = null;
  ballMesh = null;
  flipMeshL = null;
  flipMeshR = null;
  bumpMeshes = [];
  bx = 0; by = 0; lbx = 0; lby = 0;
  score = 0;
  balls = 3;
  mult = 2;
  flipL = 0; flipR = 0;
  bumpFlash = [0, 0, 0];
  nowMs = 0;

  addLambertMesh(geo, cr, cg, cb, scene) {
    const mat = new THREE.MeshLambertMaterial((cr * 65536) + (cg * 256) + cb);
    const m = new THREE.Mesh(geo, mat);
    scene.add(m);
    return m;
  }

  init() {
    runtime.surface.setLayout("single");
    this.layer = new TWO.Layer2D();
    this.cam = new TWO.Camera2D();
    this.renderer = new TWO.Renderer2D();
    this.r3d = new THREE.Renderer3D();
    runtime.surface.attachRenderer(this.renderer);

    // ---- cannon: the ball in the playfield plane -------------------------
    this.world = new CANNON.World();
    this.world.setGravity(0, GRAV, 0);
    this.ball = this.world.addSphere(1, PLUNGE_X, PLUNGE_Y, 0, BALL_R);
    this.bx = PLUNGE_X; this.by = PLUNGE_Y; this.lbx = PLUNGE_X; this.lby = PLUNGE_Y;

    // ---- three: the lit 3D table -----------------------------------------
    const scene = new THREE.Scene();
    // light rig — PARENTED to the scene (scene.add) so it actually shades.
    const amb = new THREE.AmbientLight(0xFFFFFF, 0.45);
    scene.add(amb);
    const key = new THREE.DirectionalLight(0xFFFFFF, 1.15, -0.4, 1.1, 0.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8899FF, 0.5, 0.6, 0.7, -0.4);
    scene.add(fill);

    // camera: above and behind the flipper end, looking down the whole table
    const camera = new THREE.PerspectiveCamera(50, RT_W / RT_H, 0.5, 120);
    camera.setPose(0.0, H * SC * 0.78, H * SC * 0.66, -0.9, 0.0, 0.0);

    // playfield: a flat plane (rotate the XY plane flat), deep blue
    const pfGeo = new THREE.PlaneGeometry(W * SC * 1.02, H * SC * 1.02, 1, 1);
    const pf = this.addLambertMesh(pfGeo, 40, 46, 130, scene);
    pf.setTransform(0, 0, 0, -1.5707963, 0, 0);

    // rails around the playfield (thin raised boxes)
    const railGeo = new THREE.BoxGeometry(0.3, 0.7, H * SC);
    const railL = this.addLambertMesh(railGeo, 150, 160, 200, scene);
    railL.setTransform(mapX(WALL), 0.35, 0, 0, 0, 0);
    const railR = this.addLambertMesh(railGeo, 150, 160, 200, scene);
    railR.setTransform(mapX(W - WALL), 0.35, 0, 0, 0, 0);
    const railTGeo = new THREE.BoxGeometry(W * SC, 0.7, 0.3);
    const railT = this.addLambertMesh(railTGeo, 150, 160, 200, scene);
    railT.setTransform(0, 0.35, mapZ(WALL), 0, 0, 0);

    // pop bumpers — octahedron caps that stand up off the field
    this.bumpMeshes = [];
    let bi = 0;
    while (bi < BUMPERS.length) {
      const bp = BUMPERS[bi];
      const g = new THREE.OctahedronGeometry(bp.r * SC * 1.3);
      const m = this.addLambertMesh(g, bp.cr, bp.cg, bp.cb, scene);
      m.setTransform(mapX(bp.x), bp.r * SC, mapZ(bp.y), 0, 0, 0);
      this.bumpMeshes[bi] = m;
      bi = bi + 1;
    }

    // slingshots — low blue wedges near the flippers
    let si = 0;
    while (si < SLINGS.length) {
      const sl = SLINGS[si];
      const g = new THREE.BoxGeometry(0.9, 0.6, 1.4);
      const m = this.addLambertMesh(g, 70, 150, 240, scene);
      m.setTransform(mapX(sl.x), 0.3, mapZ(sl.y), 0, sl.dir * 0.5, 0);
      si = si + 1;
    }

    // spinner disc (left) — a flattened bright octahedron target
    const spinGeo = new THREE.OctahedronGeometry(1.6);
    const spin = this.addLambertMesh(spinGeo, 245, 200, 60, scene);
    spin.setTransform(mapX(62), 0.15, mapZ(300), 0, 0, 0);
    spin.setScale(1.0, 0.28, 1.0);

    // bank targets — bright studs scattered up the table
    const tgs = [[150, 236, 255, 210, 60], [210, 236, 90, 200, 255], [126, 300, 230, 70, 90], [246, 300, 70, 200, 120], [180, 340, 250, 220, 80]];
    let ti = 0;
    while (ti < tgs.length) {
      const tg = tgs[ti];
      const g = new THREE.OctahedronGeometry(0.55);
      const m = this.addLambertMesh(g, tg[2], tg[3], tg[4], scene);
      m.setTransform(mapX(tg[0]), 0.45, mapZ(tg[1]), 0, 0, 0);
      ti = ti + 1;
    }

    // centre lane arrows — thin raised boxes pointing up the table
    const arGeo = new THREE.BoxGeometry(0.5, 0.28, 2.4);
    const arCols = [[255, 80, 60], [250, 210, 70], [255, 80, 60]];
    const arXs = [150, 180, 210];
    let ai = 0;
    while (ai < 3) {
      const c = arCols[ai];
      const m = this.addLambertMesh(arGeo, c[0], c[1], c[2], scene);
      m.setTransform(mapX(arXs[ai]), 0.2, mapZ(410), 0, 0, 0);
      ai = ai + 1;
    }

    // flippers — red bars that swing about the vertical axis
    const flGeo = new THREE.BoxGeometry(2.6, 0.5, 0.7);
    this.flipMeshL = this.addLambertMesh(flGeo, 235, 70, 70, scene);
    this.flipMeshR = this.addLambertMesh(flGeo, 235, 70, 70, scene);

    // the steel ball — a bright octahedron so the facets catch the light
    const ballGeo = new THREE.OctahedronGeometry(BALL_R * SC * 1.6);
    this.ballMesh = this.addLambertMesh(ballGeo, 220, 226, 236, scene);

    // present: render the scene to a target the single pane shows
    const rt = runtime.graphics.createRenderTarget({ width: RT_W, height: RT_H });
    const sprite = new TWO.Sprite2D({ source: rt.colorTexture.view() });
    sprite.setSize(RT_W, RT_H);
    sprite.setZ(1);
    this.layer.add(sprite);
    this.view = new THREE.SceneSprite3D({
      scene: scene, camera: camera, target: rt, sprite: sprite,
      resolution: { width: RT_W, height: RT_H }, update: "everyFrame"
    });
    this.view.sync(this.r3d);
    return 1;
  }

  resetBall() {
    this.ball.setPosition(PLUNGE_X, PLUNGE_Y, 0);
    this.bx = PLUNGE_X; this.by = PLUNGE_Y; this.lbx = PLUNGE_X; this.lby = PLUNGE_Y;
  }

  sfx(name) { runtime.audio.vocal.play(name); }

  update(props) {
    const dt = props.dtMs;
    this.nowMs = this.nowMs + dt;
    const dts = dt / 1000;
    if (dts <= 0) { return 1; }

    const pad = runtime.input.player(0);
    const lpr = pad.isDown("left");
    const rpr = pad.isDown("right");
    this.flipL = lpr ? 1 : Math.max(0, this.flipL - dt / 90);
    this.flipR = rpr ? 1 : Math.max(0, this.flipR - dt / 90);

    this.bx = this.ball.posX();
    this.by = this.ball.posY();
    let vx = (this.bx - this.lbx) / dts;
    let vy = (this.by - this.lby) / dts;
    this.lbx = this.bx; this.lby = this.by;

    if (this.bx < WALL + BALL_R && vx < 0) { vx = -vx * WALL_BOUNCE; this.sfx("wall"); }
    if (this.bx > W - WALL - BALL_R && vx > 0) { vx = -vx * WALL_BOUNCE; this.sfx("wall"); }
    if (this.by < WALL + BALL_R && vy < 0) { vy = -vy * WALL_BOUNCE; }

    let bi = 0;
    while (bi < BUMPERS.length) {
      const bp = BUMPERS[bi];
      const dx = this.bx - bp.x;
      const dy = this.by - bp.y;
      const rr = bp.r + BALL_R;
      if (dx * dx + dy * dy < rr * rr) {
        const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
        vx = (dx / d) * BUMP_KICK;
        vy = (dy / d) * BUMP_KICK;
        this.score = this.score + 100 * this.mult;
        this.bumpFlash[bi] = 180;
        this.sfx("bounce");
      }
      if (this.bumpFlash[bi] > 0) { this.bumpFlash[bi] = this.bumpFlash[bi] - dt; }
      bi = bi + 1;
    }

    let si = 0;
    while (si < SLINGS.length) {
      const sl = SLINGS[si];
      const dx = this.bx - sl.x;
      const dy = this.by - sl.y;
      if (dx * dx + dy * dy < 30 * 30 && vy > 0) {
        vx = sl.dir * SLING_KICK * 0.6;
        vy = -SLING_KICK;
        this.score = this.score + 50 * this.mult;
        this.sfx("brick");
      }
      si = si + 1;
    }

    if (this.by > 512 && this.by < 588 && vy > -60) {
      if (this.bx > 60 && this.bx < 176) {
        vy = lpr ? -FLIP_KICK : -FLIP_SOFT; vx = 150;
        if (lpr) { this.sfx("bounce"); }
      } else if (this.bx > 184 && this.bx < 300) {
        vy = rpr ? -FLIP_KICK : -FLIP_SOFT; vx = -150;
        if (rpr) { this.sfx("bounce"); }
      }
    }

    if (this.by > DRAIN_Y) {
      this.balls = this.balls - 1;
      this.sfx("lose");
      if (this.balls <= 0) { this.balls = 3; this.score = 0; }
      this.resetBall();
      vx = 0; vy = 0;
    }

    this.ball.setVelocity(vx, vy, 0);
    this.world.step(dts);

    this.draw3d();
    return 1;
  }

  draw3d() {
    // ball follows the physics; spin it a little for life
    const spin = this.nowMs * 0.004;
    this.ballMesh.setTransform(mapX(this.bx), BALL_R * SC, mapZ(this.by), spin, spin * 0.7, 0);

    // flippers swing about Y: left tip inward when raised, right mirrored
    const laRest = -0.35; const laUp = 0.5;
    const raRest = 3.14159 + 0.35; const raUp = 3.14159 - 0.5;
    const la = laRest + (laUp - laRest) * this.flipL;
    const ra = raRest + (raUp - raRest) * this.flipR;
    this.flipMeshL.setTransform(mapX(120), 0.35, mapZ(560), 0, la, 0);
    this.flipMeshR.setTransform(mapX(240), 0.35, mapZ(560), 0, ra, 0);

    // bumper flash: pop up + brighten by scaling when hit
    let bi = 0;
    while (bi < this.bumpMeshes.length) {
      const bp = BUMPERS[bi];
      const hot = this.bumpFlash[bi] > 0 ? 1 : 0;
      const s = hot == 1 ? 1.28 : 1.0;
      this.bumpMeshes[bi].setScale(s, s, s);
      bi = bi + 1;
    }

    this.view.sync(this.r3d);
    this.renderer.render(this.layer, this.cam, 0);

    // DMD score overlay
    const r = this.renderer;
    r.beginOverlay();
    r.overlayRect(0.30, 0.02, 0.40, 0.11, 26, 6, 6, 0);
    this.drawNumber(this.score, 0.66, 0.04, 0.012, 0.022, 255, 170, 20);
    this.drawNumber(this.balls, 0.335, 0.04, 0.010, 0.018, 255, 170, 20);
  }

  drawNumber(value, nx, ny, cw, ch, cr, cg, cb) {
    const digits = [];
    let v = value;
    if (v <= 0) { digits.push(0); }
    while (v > 0) { digits.push(v % 10); v = Math.floor(v / 10); }
    let k = digits.length - 1;
    let col = 0;
    while (k >= 0) {
      this.drawDigit(digits[k], nx + col * (4 * cw), ny, cw, ch, cr, cg, cb);
      col = col + 1;
      k = k - 1;
    }
  }
  drawDigit(dgt, nx, ny, cw, ch, cr, cg, cb) {
    const g = DIGITS[dgt];
    let ry = 0;
    while (ry < 5) {
      const line = g[ry];
      let cx = 0;
      while (cx < 3) {
        if (line.charAt(cx) == "X") {
          this.renderer.overlayRect(nx + cx * cw, ny + ry * ch, cw * 0.9, ch * 0.9, cr, cg, cb, 0);
        }
        cx = cx + 1;
      }
      ry = ry + 1;
    }
  }
}

const DIGITS = [
  ["XXX", "X.X", "X.X", "X.X", "XXX"],
  [".X.", "XX.", ".X.", ".X.", "XXX"],
  ["XXX", "..X", "XXX", "X..", "XXX"],
  ["XXX", "..X", "XXX", "..X", "XXX"],
  ["X.X", "X.X", "XXX", "..X", "..X"],
  ["XXX", "X..", "XXX", "..X", "XXX"],
  ["XXX", "X..", "XXX", "X.X", "XXX"],
  ["XXX", "..X", "..X", "..X", "..X"],
  ["XXX", "X.X", "XXX", "X.X", "XXX"],
  ["XXX", "X.X", "XXX", "..X", "XXX"],
];

const __game = new PinballGame();
runtime.start(__game);
