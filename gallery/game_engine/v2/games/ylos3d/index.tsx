// ============================================================================
// ylos3d — hybrid 2D climber sketch with 3D diamond sprites (PLAN_2D_EMBED_3D).
// ============================================================================
// Authored against ranger:core + ranger:2d + ranger:three. The world is 2D
// (platforms, camera, players); decorative diamonds are live SW-3D octahedra
// rendered into CPU RenderTargets and sampled as texture-backed Sprite2Ds
// (path A: SW 3D → Texture2D → SW 2D).
// ============================================================================

import { runtime } from "ranger:core";
import * as TWO from "ranger:2d";
import * as THREE from "ranger:three";

const BASE_W = 480;
const WORLD_H = 900;
const VIEW_H = 270;
const GRAV = 0.00045;
const MOVE = 0.22;
const JUMP_V = 0.34;
const PLAYER_W = 26;
const PLAYER_H = 44;
const GEM_SIZE = 48;
const DIAMOND_CYAN = 7926015; // 0x78F0FF

const PLATFORMS = [
  { x: 0, y: 840, w: 480, h: 60 },
  { x: 40, y: 720, w: 160, h: 14 },
  { x: 260, y: 620, w: 140, h: 14 },
  { x: 80, y: 500, w: 150, h: 14 },
  { x: 280, y: 380, w: 140, h: 14 },
  { x: 60, y: 260, w: 160, h: 14 },
  { x: 200, y: 140, w: 180, h: 20 }
];

const DIAMOND_SPOTS = [
  { x: 420, y: 790 },
  { x: 120, y: 680 },
  { x: 330, y: 580 },
  { x: 150, y: 460 }
];

function overlapsX(px, pw, plat) {
  if (px + pw <= plat.x) { return false; }
  if (px >= plat.x + plat.w) { return false; }
  return true;
}

function makeDiamondSprite(renderer3d) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
  camera.setPose(0, 0.15, 3.2, 0, 0, 0);
  const geo = new THREE.OctahedronGeometry(0.9);
  const mat = new THREE.MeshBasicMaterial(DIAMOND_CYAN);
  const mesh = new THREE.Mesh(scene, geo, mat);
  mesh.setTransform(0, 0, 0, 0.4, 0.6, 0.15);
  const rt = runtime.graphics.createRenderTarget({ width: 64, height: 64 });
  const sprite = new TWO.Sprite2D({ source: rt.colorTexture.view() });
  sprite.setSize(GEM_SIZE, GEM_SIZE);
  sprite.setZ(5);
  const model = new THREE.SceneSprite3D({
    scene: scene,
    camera: camera,
    mesh: mesh,
    target: rt,
    sprite: sprite,
    resolution: { width: 64, height: 64 },
    update: "everyFrame"
  });
  // Prime the RT so the first present has texels even before update.
  model.sync(renderer3d, 0);
  return model;
}

class Ylos3DGame {
  layer = null;
  camera = null;
  renderer = null;
  renderer3d = null;
  player = null;
  diamonds = [];
  atlas = null;

  init() {
    this.layer = new TWO.Layer2D();
    this.camera = new TWO.Camera2D();
    this.renderer = new TWO.Renderer2D();
    this.renderer3d = new THREE.Renderer3D();

    runtime.surface.setLayout(0);
    runtime.surface.pane(0).assignPlayer(0);

    // Placeholder player: 1×1 cyan-ish texture as a solid sprite stand-in.
    const pt = runtime.graphics.createRenderTarget({ width: 8, height: 8 });
    // Fill via a tiny 3D-less path: reuse RT pixels already transparent — paint
    // with a one-shot upload by rendering a flat box into it.
    const pScene = new THREE.Scene();
    const pCam = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    pCam.setPose(0, 0, 3, 0, 0, 0);
    const pGeo = new THREE.BoxGeometry(1.4, 1.8, 0.4);
    const pMat = new THREE.MeshBasicMaterial(0x66ccff);
    const pMesh = new THREE.Mesh(pScene, pGeo, pMat);
    this.renderer3d.render(pScene, pCam, pt);
    this.player = {
      x: 40,
      y: 780,
      vx: 0,
      vy: 0,
      onGround: 0,
      sprite: new TWO.Sprite2D({ source: pt.colorTexture.view() })
    };
    this.player.sprite.setSize(PLAYER_W, PLAYER_H);
    this.player.sprite.setZ(10);
    this.layer.add(this.player.sprite);

    let i = 0;
    while (i < DIAMOND_SPOTS.length) {
      const spot = DIAMOND_SPOTS[i];
      const gem = makeDiamondSprite(this.renderer3d);
      gem.sprite.setPos(spot.x, spot.y);
      this.layer.add(gem.sprite);
      this.diamonds.push(gem);
      i = i + 1;
    }

    this.camera.set(BASE_W / 2, this.player.y - 80, 1, 0);
    return 1;
  }

  drawEnv() {
    const r = this.renderer;
    r.beginBackground();
    let y = 0;
    while (y < WORLD_H) {
      const t = y / WORLD_H;
      r.fillRect(-40, y, 560, 40, 40 + t * 40, 90 + t * 70, 150 + t * 40);
      y = y + 40;
    }
    let i = 0;
    while (i < PLATFORMS.length) {
      const p = PLATFORMS[i];
      r.fillRect(p.x, p.y, p.w, p.h, 72, 150, 64);
      r.fillRect(p.x, p.y, p.w, 3, 110, 190, 86);
      i = i + 1;
    }
  }

  updatePlayer(dt) {
    const pad = runtime.input.player(0);
    const pl = this.player;
    pl.vx = 0;
    if (pad.isDown("left")) { pl.vx = 0 - MOVE; }
    if (pad.isDown("right")) { pl.vx = MOVE; }
    if (pad.wasPressed("jump") && pl.onGround == 1) {
      pl.vy = 0 - JUMP_V;
      pl.onGround = 0;
    }
    pl.vy = pl.vy + GRAV * dt;
    pl.x = pl.x + pl.vx * dt;
    pl.y = pl.y + pl.vy * dt;
    if (pl.x < 0) { pl.x = 0; }
    if (pl.x > BASE_W - PLAYER_W) { pl.x = BASE_W - PLAYER_W; }

    pl.onGround = 0;
    let i = 0;
    while (i < PLATFORMS.length) {
      const p = PLATFORMS[i];
      if (overlapsX(pl.x, PLAYER_W, p)) {
        const feet = pl.y + PLAYER_H;
        if (pl.vy >= 0 && feet >= p.y && feet <= p.y + p.h + 8 && (pl.y + PLAYER_H - pl.vy * dt) <= p.y + 2) {
          pl.y = p.y - PLAYER_H;
          pl.vy = 0;
          pl.onGround = 1;
        }
      }
      i = i + 1;
    }
    if (pl.y > WORLD_H - PLAYER_H) {
      pl.y = WORLD_H - PLAYER_H;
      pl.vy = 0;
      pl.onGround = 1;
    }
    pl.sprite.setPos(pl.x + PLAYER_W / 2, pl.y + PLAYER_H / 2);
  }

  update(props) {
    const dt = props.dtMs;
    this.updatePlayer(dt);

    let camY = this.player.y - 80;
    if (camY < VIEW_H / 2) { camY = VIEW_H / 2; }
    if (camY > WORLD_H - VIEW_H / 2) { camY = WORLD_H - VIEW_H / 2; }
    this.camera.set(BASE_W / 2, camY, 1, 0);

    // Spin + refresh each 3D diamond into its RT before the 2D pass samples it.
    let i = 0;
    while (i < this.diamonds.length) {
      this.diamonds[i].sync(this.renderer3d, dt);
      i = i + 1;
    }

    this.drawEnv();
    this.renderer.render(this.layer, this.camera, 0);
    return 1;
  }
}

const __game = new Ylos3DGame();
runtime.start(__game);
