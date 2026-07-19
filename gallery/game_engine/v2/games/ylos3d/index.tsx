// ============================================================================
// ylos3d — ylos2 (v1 split-screen climber) with 3D diamond sprites.
// ============================================================================
// Same gameplay / LPC sheets / immediate env as v2 games/ylos2, authored
// against ranger:core + ranger:2d + ranger:three. Decorative diamonds use
// package .glb models via generic rg3d_model_load → SW RTT → Sprite2D
// (PLAN_2D_EMBED_3D path A) instead of the v1 bitmap glyph.
// ============================================================================

import { runtime } from "ranger:core";
import * as TWO from "ranger:2d";
import * as THREE from "ranger:three";

const BASE_W = 480;
const WORLD_H = 1890;
const GRAV = 0.00045;          // px/ms^2
const MOVE = 0.22;             // px/ms
const JUMP_MIN_V = 0.28;
const JUMP_MAX_V = 0.38;
const JUMP_HOLD_LIFT = 0.00062;
const JUMP_CUT = 0.42;
const JUMP_HOLD_MAX_MS = 400;
const MOVING_PLAT_SPEED = 0.06;
const PLAYER_W = 26;
const PLAYER_H = 44;

// v1 static-environment palette (createStaticBg)
const PLAT_EDGE_H = 4;
const PLAT_BODY_R = 72; const PLAT_BODY_G = 150; const PLAT_BODY_B = 64;
const PLAT_TOP_R = 110; const PLAT_TOP_G = 190; const PLAT_TOP_B = 86;
const PLAT_BOT_R = 42; const PLAT_BOT_G = 96; const PLAT_BOT_B = 38;

// v1 diamond spots (BASE_DIAMOND_DEFS) — rendered as 3D glTF SceneSprites.
const GEM_W = 40;
const GEM_H = 72;
const BASE_DIAMOND_DEFS = [
  { x: 420, y: 1775 },
  { x: 300, y: 1455 },
  { x: 130, y: 1125 },
  { x: 300, y: 715 },
  { x: 200, y: 475 }
];

// v1 score verbatim (game_soundscore: duration:pitch tokens, newline headers).
// The previous one-liner stub dropped durations and three of four phrases, so
// the real parser heard nothing useful / a different tune.
const SUMMIT_MUSIC =
  "tempo 152\n" +
  "beats 4/4\n" +
  "\n" +
  "@melody piano\n" +
  "0.5:E4 0.5:G4 1:A4 1:G4 1:E4\n" +
  "0.5:D4 0.5:E4 1:G4 2:E4\n" +
  "0.5:E4 0.5:G4 1:A4 1:C5 1:B4\n" +
  "1:A4 1:G4 2:E4\n";

// v1 level tables, verbatim.
const BASE_PLATFORMS = [
  { x: 0, y: 1830, w: 480, h: 60 },
  { x: 30, y: 1700, w: 190, h: 14 },
  { x: 170, y: 1590, w: 100, h: 14 },
  { x: 310, y: 1480, w: 90, h: 14 },
  { x: 50, y: 1370, w: 110, h: 14 },
  { x: 260, y: 1260, w: 100, h: 14 },
  { x: 120, y: 1150, w: 90, h: 14 },
  { x: 300, y: 1040, w: 100, h: 14 },
  { x: 40, y: 930, w: 120, h: 14 },
  { x: 220, y: 820, w: 110, h: 14 },
  { x: 80, y: 710, w: 100, h: 14 },
  { x: 280, y: 600, w: 120, h: 14 },
  { x: 140, y: 490, w: 100, h: 14 },
  { x: 320, y: 380, w: 90, h: 14 },
  { x: 60, y: 270, w: 110, h: 14 },
  { x: 40, y: 220, w: 95, h: 12 },
  { x: 200, y: 160, w: 180, h: 20 }
];
const BASE_MOVING_PLATFORMS = [
  { x: 50, y: 980, w: 100, h: 14, min: 35, max: 310, dir: 1 },
  { x: 220, y: 880, w: 90, h: 14, min: 70, max: 340, dir: -1 },
  { x: 60, y: 780, w: 110, h: 14, min: 40, max: 300, dir: 1 },
  { x: 250, y: 680, w: 85, h: 14, min: 90, max: 350, dir: -1 },
  { x: 45, y: 560, w: 100, h: 14, min: 30, max: 290, dir: 1 },
  { x: 230, y: 460, w: 95, h: 14, min: 80, max: 330, dir: -1 },
  { x: 70, y: 350, w: 90, h: 14, min: 50, max: 280, dir: 1 },
  { x: 210, y: 220, w: 110, h: 14, min: 60, max: 320, dir: -1 }
];
// v1 enemy patrols — LPC skeleton walk strip (assets/enemy_walk.png)
const BASE_ENEMY_DEFS = [
  { x: 55, y: 1700, dir: 1, min: 35, max: 115 },
  { x: 190, y: 1590, dir: -1, min: 175, max: 265 },
  { x: 320, y: 1480, dir: 1, min: 315, max: 395 },
  { x: 70, y: 1370, dir: 1, min: 55, max: 155 },
  { x: 275, y: 1260, dir: -1, min: 265, max: 355 },
  { x: 135, y: 1150, dir: 1, min: 125, max: 205 },
  { x: 310, y: 1040, dir: -1, min: 305, max: 395 },
  { x: 90, y: 710, dir: 1, min: 85, max: 175 },
  { x: 165, y: 490, dir: 1, min: 155, max: 225 },
  { x: 355, y: 380, dir: -1, min: 335, max: 400 },
  { x: 100, y: 270, dir: 1, min: 72, max: 158 },
  { x: 75, y: 220, dir: 1, min: 48, max: 122 }
];
const ENEMY_WALK_FRAMES = 9;

// logical view height (v1 VIEW_H) — the camera clamps to the world floor so
// the ground band sits as a thin strip at the bottom, exactly like v1.
const VIEW_H = 270;
const CAM_LEAD = 120;   // v1 computeCamera: player feet sit CAM_LEAD from the top

function overlapsX(px, pw, plat) {
  if (px + pw <= plat.x) { return false; }
  if (px >= plat.x + plat.w) { return false; }
  return true;
}

function makeDiamondSprite(renderer3d) {
  const scene = new THREE.Scene();
  // Bind lights to locals — the TSX evaluator may skip unused `new` expressions.
  // Slightly cooler/dimmer key so facets shade instead of blowing to white.
  const amb = new THREE.AmbientLight(16777215, 0.38);
  scene.add(amb);
  const key = new THREE.DirectionalLight(16777215, 1.25, 0.4, 1.2, 0.5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(12648447, 0.55, -0.85, 0.3, -0.5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(14745599, 0.7, -0.3, 0.4, -1.0);
  scene.add(rim);
  const under = new THREE.DirectionalLight(10526880, 0.55, 0.2, -1.0, 0.3);
  scene.add(under);
  // Keep the gem clear of the near plane while spinning.
  const camera = new THREE.PerspectiveCamera(32, 0.55, 0.5, 40);
  camera.setPose(0.0, -0.12, 3.8, 0.0, 0.0, 0.0);
  const mesh = new THREE.GLTFModel("pkg://models/diamond.glb");
  scene.add(mesh);
  mesh.setTransform(0, 0, 0, 0.12, 0.6, 0.08);
  mesh.setScale(1.55, 1.55, 1.55);
  // RT matches on-screen sprite pixels; engine RTT does 2× SSAA resolve into it
  // so we don't nearest-downsample a larger buffer a second time in 2D.
  const rt = runtime.graphics.createRenderTarget({ width: GEM_W, height: GEM_H });
  const sprite = new TWO.Sprite2D({ source: rt.colorTexture.view() });
  sprite.setSize(GEM_W, GEM_H);
  sprite.setZ(5);
  const view = new THREE.SceneSprite3D({
    scene: scene,
    camera: camera,
    target: rt,
    sprite: sprite,
    resolution: { width: GEM_W, height: GEM_H },
    update: "everyFrame"
  });
  const model = {
    view: view,
    sprite: sprite,
    mesh: mesh,
    angle: 0.6,
    amb: amb,
    key: key,
    fill: fill,
    rim: rim,
    under: under
  };
  view.sync(renderer3d);
  return model;
}

// LPC walk sheet rows: 0=up 1=left 2=down 3=right (v1 sheetFrameForPlayer)
const SHEET_ROW_RIGHT = 3;
const SHEET_ROW_LEFT = 1;
const SHEET_JUMP_COL = 3;

// original 3x5 numeral glyphs for the HUD (X = lit cell)
const HUD_DIGITS = [
  ["XXX", "X.X", "X.X", "X.X", "XXX"],
  [".X.", "XX.", ".X.", ".X.", "XXX"],
  ["XXX", "..X", "XXX", "X..", "XXX"],
  ["XXX", "..X", "XXX", "..X", "XXX"],
  ["X.X", "X.X", "XXX", "..X", "..X"],
  ["XXX", "X..", "XXX", "..X", "XXX"],
  ["XXX", "X..", "XXX", "X.X", "XXX"],
  ["XXX", "..X", "..X", "..X", "..X"],
  ["XXX", "X.X", "XXX", "X.X", "XXX"],
  ["XXX", "X.X", "XXX", "..X", "XXX"]
];

class Ylos3DGame {
  layer = null;
  cam1 = null;
  cam2 = null;
  renderer = null;
  renderer3d = null;
  celebrateSfx = null;
  movingPlats = [];
  players = [];
  enemies = [];
  diamonds = [];
  enemyAtlas = null;
  nowMs = 0;
  goalIndex = 16;
  summitMusicStarted = 0;

  makePlayer(slot, startX, atlas) {
    return {
      slot: slot,
      x: startX, y: 1830 - PLAYER_H, vx: 0, vy: 0,
      grounded: 1, facing: 1,
      jumpHoldMs: -1,
      jumpHeld: 0,
      lastGroundFeet: 1830,
      reachedGoal: 0,
      onMover: -1,
      atlas: atlas, sprite: null, animTick: 0
    };
  }

  init() {
    // split-screen through the surface capability (v1 splitScreen=auto)
    runtime.surface.setLayout("split-vertical");
    runtime.surface.pane(0).assignPlayer(0);
    runtime.surface.pane(1).assignPlayer(1);

    this.layer = new TWO.Layer2D();
    this.cam1 = new TWO.Camera2D();
    this.cam2 = new TWO.Camera2D();
    this.renderer = new TWO.Renderer2D();
    this.renderer3d = new THREE.Renderer3D();
    runtime.surface.attachRenderer(this.renderer);
    // clip ≠ source (D-LIFE): the source is created from an explicit clip
    const clip = runtime.audio.createClip();
    this.celebrateSfx = runtime.audio.createSource(clip);

    // moving platforms are immediate-drawn each frame (v1 entities), not sprites
    let i = 0;
    while (i < BASE_MOVING_PLATFORMS.length) {
      const m = BASE_MOVING_PLATFORMS[i];
      this.movingPlats.push({
        x: m.x, y: m.y, w: m.w, h: m.h, min: m.min, max: m.max, dir: m.dir,
        vx: MOVING_PLAT_SPEED * m.dir
      });
      i = i + 1;
    }

    // players are the retained sprites — each its own LPC walk sheet (v1 sheet)
    const a1 = runtime.assets.loadSpriteAtlas("pkg://p1.atlas");
    const a2 = runtime.assets.loadSpriteAtlas("pkg://p2.atlas");
    const p1 = this.makePlayer(0, 120, a1);
    const p2 = this.makePlayer(1, 330, a2);
    p1.facing = 1; p2.facing = -1;
    const starts = [p1, p2];
    let k = 0;
    while (k < starts.length) {
      const pl = starts[k];
      pl.sprite = new TWO.Sprite2D(pl.atlas, 0);
      // sheet cell is the character's on-screen box (feet-ish placement); a
      // 64px LPC frame drawn ~PLAYER_H tall.
      pl.sprite.setSize(PLAYER_H, PLAYER_H);
      pl.sprite.setZ(3);
      pl.sprite.setCell(0, pl.facing < 0 ? SHEET_ROW_LEFT : SHEET_ROW_RIGHT);
      // split-screen: this player is drawn ONLY in its own pane (v1 hides the
      // other player in the local view); world objects stay in both panes.
      pl.sprite.setPane(pl.slot);
      this.layer.add(pl.sprite);
      k = k + 1;
    }
    this.players = starts;

    // enemies — skeleton patrols on the platforms (v1 makeEnemies). One shared
    // LPC skeleton sheet; each enemy is a retained sprite drawn feet-on-platform.
    this.enemyAtlas = runtime.assets.loadSpriteAtlas("pkg://enemy.atlas");
    let ei = 0;
    while (ei < BASE_ENEMY_DEFS.length) {
      const d = BASE_ENEMY_DEFS[ei];
      const spr = new TWO.Sprite2D(this.enemyAtlas, 0);
      spr.setSize(40, 40);
      spr.setZ(2);
      let row = d.dir > 0 ? SHEET_ROW_RIGHT : SHEET_ROW_LEFT;
      spr.setCell(0, row);
      this.layer.add(spr);
      this.enemies.push({ x: d.x, y: d.y, dir: d.dir, min: d.min, max: d.max, tick: 0, sprite: spr });
      ei = ei + 1;
    }

    // 3D diamonds at v1 spots (texture-backed sprites; visible in both panes).
    let di = 0;
    while (di < BASE_DIAMOND_DEFS.length) {
      const spot = BASE_DIAMOND_DEFS[di];
      const gem = makeDiamondSprite(this.renderer3d);
      gem.sprite.setPos(spot.x, spot.y);
      this.layer.add(gem.sprite);
      this.diamonds.push(gem);
      di = di + 1;
    }

    runtime.log.info("ylos3d init: ylos2 LPC + 3D glTF diamonds");
    return 1;
  }

  updateEnemies(dt) {
    let i = 0;
    while (i < this.enemies.length) {
      const e = this.enemies[i];
      e.x = e.x + e.dir * dt * 0.08;
      if (e.x < e.min) { e.x = e.min; e.dir = 1; }
      if (e.x > e.max) { e.x = e.max; e.dir = -1; }
      e.tick = e.tick + dt;
      const anim = Math.floor(e.tick / 110) % ENEMY_WALK_FRAMES;
      const row = e.dir < 0 ? SHEET_ROW_LEFT : SHEET_ROW_RIGHT;
      // feet at (x,y): seat the 40px frame a little above the platform surface
      e.sprite.setPos(e.x, e.y - 14);
      e.sprite.setCell(anim, row);
      i = i + 1;
    }
  }

  // ---- static environment (v1 createStaticBg, immediate world-space) --------
  drawPlatform(x, y, w, h) {
    const r = this.renderer;
    r.fillRect(x, y, w, h, PLAT_BODY_R, PLAT_BODY_G, PLAT_BODY_B);
    r.fillRect(x, y, w, PLAT_EDGE_H, PLAT_TOP_R, PLAT_TOP_G, PLAT_TOP_B);
    r.fillRect(x, y + h - PLAT_EDGE_H, w, PLAT_EDGE_H, PLAT_BOT_R, PLAT_BOT_G, PLAT_BOT_B);
  }

  drawCloud(cx, cy) {
    const r = this.renderer;
    r.fillCircle(cx, cy, 14, 240, 245, 255);
    r.fillCircle(cx - 16, cy + 4, 10, 235, 240, 250);
    r.fillCircle(cx + 16, cy + 4, 10, 235, 240, 250);
  }

  drawStaticEnv() {
    const r = this.renderer;
    r.beginBackground();
    // sky gradient bands (v1 drawSkyGradient), world space, wide cover
    let y = 0;
    while (y < WORLD_H) {
      const t = y / WORLD_H;
      const sr = 30 + t * 50;
      const sg = 70 + t * 90;
      const sb = 140 + t * 60;
      r.fillRect(-260, y, 1000, 32, sr, sg, sb);
      y = y + 32;
    }
    this.drawCloud(80, 1500);
    this.drawCloud(360, 1300);
    this.drawCloud(120, 980);
    this.drawCloud(300, 560);
    this.drawCloud(90, 300);
    // static platforms (v1 createStaticBg)
    let i = 0;
    while (i < BASE_PLATFORMS.length) {
      const p = BASE_PLATFORMS[i];
      this.drawPlatform(p.x, p.y, p.w, p.h);
      i = i + 1;
    }
    // moving platforms (redrawn per frame at live x)
    i = 0;
    while (i < this.movingPlats.length) {
      const m = this.movingPlats[i];
      this.drawPlatform(m.x, m.y, m.w, m.h);
      i = i + 1;
    }
    // goal flag (v1 createStaticBg)
    const gp = BASE_PLATFORMS[this.goalIndex];
    const fx = gp.x + gp.w / 2;
    r.fillRect(fx - 2, gp.y - 44, 4, 44, 160, 120, 70);
    r.fillRect(fx + 2, gp.y - 44, 24, 14, 255, 90, 90);
    r.fillRect(fx + 2, gp.y - 30, 20, 8, 255, 210, 60);
  }

  tryStartSummitMusic() {
    if (this.summitMusicStarted == 1) { return; }
    this.summitMusicStarted = 1;
    runtime.audio.music.play(SUMMIT_MUSIC);
  }

  markGoal(pl) {
    if (pl.reachedGoal == 1) { return; }
    pl.reachedGoal = 1;
    this.celebrateSfx.playOneShot();
    runtime.audio.vocal.play("cheer");
    this.tryStartSummitMusic();
  }

  updateMovers(dt) {
    let i = 0;
    while (i < this.movingPlats.length) {
      const m = this.movingPlats[i];
      // v1 clamps the *right edge* to max (x + w <= max), not the left edge.
      m.x = m.x + MOVING_PLAT_SPEED * m.dir * dt;
      if (m.x < m.min) { m.x = m.min; m.dir = 1; }
      if (m.x + m.w > m.max) { m.x = m.max - m.w; m.dir = -1; }
      m.vx = MOVING_PLAT_SPEED * m.dir;
      i = i + 1;
    }
  }

  updatePlayer(pl, dt) {
    const pad = runtime.input.player(pl.slot);
    const left = pad.isDown("left");
    const right = pad.isDown("right");
    const jump = pad.isDown("jump");

    pl.vx = 0;
    if (left) { pl.vx = 0 - MOVE; pl.facing = -1; }
    if (right) { pl.vx = MOVE; pl.facing = 1; }
    pl.x = pl.x + pl.vx * dt;
    if (pl.x < 0) { pl.x = 0; }
    if (pl.x > BASE_W - PLAYER_W) { pl.x = BASE_W - PLAYER_W; }

    pl.vy = pl.vy + GRAV * dt;

    // v1 edge-triggers grounded jumps (hold does not auto-rejump on land).
    if (jump) {
      if (pl.grounded == 1) {
        if (pl.jumpHeld == 0) {
          pl.vy = 0 - JUMP_MIN_V;
          pl.grounded = 0;
          pl.onMover = -1;
          pl.jumpHoldMs = 0;
        }
      } else if (pl.jumpHoldMs >= 0 && pl.jumpHoldMs < JUMP_HOLD_MAX_MS && pl.vy < 0) {
        pl.vy = pl.vy - JUMP_HOLD_LIFT * dt;
        if (pl.vy < 0 - JUMP_MAX_V) { pl.vy = 0 - JUMP_MAX_V; }
        pl.jumpHoldMs = pl.jumpHoldMs + dt;
      }
    } else {
      if (pl.jumpHoldMs > 0 && pl.vy < 0) { pl.vy = pl.vy * JUMP_CUT; }
      pl.jumpHoldMs = -1;
    }
    pl.jumpHeld = jump ? 1 : 0;

    const prevFeet = pl.y + PLAYER_H;
    let newY = pl.y + pl.vy * dt;
    const newFeet = newY + PLAYER_H;
    pl.grounded = 0;
    pl.onMover = -1;
    // Landing slack matches v1 (prevFeet <= plat.y + 4).
    if (pl.vy >= 0) {
      let i = 0;
      while (i < BASE_PLATFORMS.length) {
        const p = BASE_PLATFORMS[i];
        if (overlapsX(pl.x, PLAYER_W, p)) {
          if (prevFeet <= p.y + 4 && newFeet >= p.y) {
            newY = p.y - PLAYER_H;
            pl.vy = 0;
            pl.grounded = 1;
            pl.lastGroundFeet = p.y;
            if (i == this.goalIndex) { this.markGoal(pl); }
          }
        }
        i = i + 1;
      }
      let k = 0;
      while (k < this.movingPlats.length) {
        const m = this.movingPlats[k];
        if (overlapsX(pl.x, PLAYER_W, m)) {
          if (prevFeet <= m.y + 4 && newFeet >= m.y) {
            newY = m.y - PLAYER_H;
            pl.vy = 0;
            pl.grounded = 1;
            pl.onMover = k;
            pl.lastGroundFeet = m.y;
          }
        }
        k = k + 1;
      }
    }
    pl.y = newY;

    // Ride moving platforms (v1 carryVx).
    if (pl.grounded == 1 && pl.onMover >= 0) {
      const m = this.movingPlats[pl.onMover];
      pl.x = pl.x + m.vx * dt;
      if (pl.x < 0) { pl.x = 0; }
      if (pl.x > BASE_W - PLAYER_W) { pl.x = BASE_W - PLAYER_W; }
      if (!overlapsX(pl.x, PLAYER_W, m)) {
        pl.grounded = 0;
        pl.onMover = -1;
      }
    }

    // v1 also finishes by proximity (feet near goal), not only by landing.
    if (pl.reachedGoal == 0) {
      if (pl.y + PLAYER_H <= BASE_PLATFORMS[this.goalIndex].y + 22) {
        this.markGoal(pl);
      }
    }

    if (pl.y > WORLD_H) { pl.y = 1830 - PLAYER_H; pl.vy = 0; }

    // Seat the character on the platform: the LPC frame has transparent foot
    // padding, so nudge the sprite centre down until the drawn feet meet the
    // surface (v1 feetTrim / feet-at-y placement).
    pl.sprite.setPos(pl.x + PLAYER_W / 2, pl.y + PLAYER_H / 2 + 3);

    // v1 sheetFrameForPlayer: row = facing; col = walk-cycle frame (or the
    // jump frame while airborne); idle rests on col 0.
    if (pl.vx != 0) { pl.animTick = pl.animTick + dt; }
    const row = pl.facing < 0 ? SHEET_ROW_LEFT : SHEET_ROW_RIGHT;
    let col = 0;
    if (pl.grounded == 0) {
      col = SHEET_JUMP_COL;
    } else if (pl.vx != 0) {
      col = Math.floor(pl.animTick / 70) % 9;
    }
    pl.sprite.setCell(col, row);
  }

  // v1 computeCamera: the camera top follows the player's feet, held CAM_LEAD
  // from the top, then CLAMPED to [0, WORLD_H - VIEW_H] so it never scrolls past
  // the floor. The camera returns the world Y mapped to the pane centre.
  camCenterY(pl) {
    const feet = pl.y + PLAYER_H;
    let top = feet - CAM_LEAD;
    const maxTop = WORLD_H - VIEW_H;
    if (top < 0) { top = 0; }
    if (top > maxTop) { top = maxTop; }
    return top + VIEW_H / 2;
  }

  updateCameras() {
    const p1 = this.players[0];
    const p2 = this.players[1];
    // camera X is FIXED at the world centre so each pane shows the full world
    // width (v1: the 480-wide world fills the pane, no horizontal scroll); only
    // the vertical follows the local player (clamped at the floor).
    const cx = BASE_W / 2;
    this.cam1.set(cx, this.camCenterY(p1), 1, 0);
    this.cam2.set(cx, this.camCenterY(p2), 1, 0);
  }

  update(props) {
    const dt = props.dtMs;
    this.nowMs = this.nowMs + dt;
    this.updateMovers(dt);
    this.updateEnemies(dt);
    this.updatePlayer(this.players[0], dt);
    this.updatePlayer(this.players[1], dt);
    this.updateCameras();
    // Game owns gem spin; SceneSprite3D only refreshes the RT.
    let gi = 0;
    while (gi < this.diamonds.length) {
      const gem = this.diamonds[gi];
      gem.angle = gem.angle + dt * 0.002;
      gem.mesh.setTransform(0.0, 0.0, 0.0, 0.12, gem.angle, 0.08);
      gem.mesh.setScale(1.55, 1.55, 1.55);
      gem.view.invalidate();
      gem.view.sync(this.renderer3d);
      gi = gi + 1;
    }
    // paint the static environment once (world space), then bind each pane's
    // view; the backend rasterises the environment through that pane's camera
    // under the players (v1 createStaticBg + split-screen present).
    this.drawStaticEnv();
    this.renderer.render(this.layer, this.cam1, 0);
    this.renderer.render(this.layer, this.cam2, 1);
    // HUD (screen-space overlay): each pane shows its player's climb score.
    this.renderer.beginOverlay();
    this.drawNumber(this.climbScore(this.players[0]), 0.42, 0.9, 0.016, 0.02, 0);
    this.drawNumber(this.climbScore(this.players[1]), 0.42, 0.9, 0.016, 0.02, 1);
    return 1;
  }

  // climb score: how far above the floor the player has reached (~0 at the
  // start, ~60 at the summit — the v1 HUD number).
  climbScore(pl) {
    let s = Math.floor((1830 - pl.y) / 28);
    if (s < 0) { s = 0; }
    return s;
  }

  // ---- HUD numerals (screen-space overlay, normalised pane coords) ----------
  drawDigit(dgt, nx, ny, cw, ch, pane) {
    const g = HUD_DIGITS[dgt];
    let ry = 0;
    while (ry < 5) {
      const line = g[ry];
      let cx = 0;
      while (cx < 3) {
        if (line.charAt(cx) == "X") {
          this.renderer.overlayRect(nx + cx * cw, ny + ry * ch, cw, ch, 235, 235, 235, pane);
        }
        cx = cx + 1;
      }
      ry = ry + 1;
    }
  }
  drawNumber(value, nx, ny, cw, ch, pane) {
    const digits = [];
    let v = value;
    if (v <= 0) { digits.push(0); }
    while (v > 0) { digits.push(v % 10); v = Math.floor(v / 10); }
    let k = digits.length - 1;
    let col = 0;
    while (k >= 0) {
      this.drawDigit(digits[k], nx + col * (4 * cw), ny, cw, ch, pane);
      col = col + 1;
      k = k - 1;
    }
  }

  // attract-mode target: the closest platform above the last grounded height
  // (locked at launch — re-picking mid-flight causes a limit cycle)
  nextTargetAbove(pl) {
    const feet = pl.lastGroundFeet;
    let best = null;
    let bestY = -100000;
    let i = 0;
    while (i < BASE_PLATFORMS.length) {
      const p = BASE_PLATFORMS[i];
      if (p.y < feet - 4 && p.y > bestY) { bestY = p.y; best = p; }
      i = i + 1;
    }
    let k = 0;
    while (k < this.movingPlats.length) {
      const m = this.movingPlats[k];
      if (m.y < feet - 4 && m.y > bestY) { bestY = m.y; best = m; }
      k = k + 1;
    }
    return best;
  }
}

const __game = new Ylos3DGame();
runtime.start(__game);

// ---- attract mode (game feature): suggest input as bits left=1 right=2 jump=4
// Jump must be pulsed: grounded jumps are edge-triggered (v1 jumpHold), so a
// held jump bit across landing would never leave the ground again.
function autopilotBits(slot) {
  const pl = __game.players[slot];
  const target = __game.nextTargetAbove(pl);
  if (target == null) { return 0; }
  let bits = 0;
  if (pl.grounded == 1) {
    bits = 4;
  } else if (pl.vy < 0) {
    bits = 4;
  }
  const cx = pl.x + PLAYER_W / 2;
  const inSpan = cx > target.x + 6 && cx < target.x + target.w - 6;
  if (!inSpan) {
    if (cx < target.x + target.w / 2) { bits = bits + 2; } else { bits = bits + 1; }
  }
  return bits;
}
