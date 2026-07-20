// ============================================================================
// ylos3d — ylos2 (v1 split-screen climber) with 3D diamond sprites.
// ============================================================================
// Same gameplay / LPC sheets / immediate env as v2 games/ylos2, authored
// against ranger:core + ranger:2d + ranger:three. Decorative diamonds use
// package .glb models via generic rg3d_model_load → SW RTT → Sprite2D
// (PLAN_2D_EMBED_3D path A) instead of the v1 bitmap glyph.
//
// Game logic restored from v1 ylos3_shared: diamond → super mode, enemy
// stomp/hurt, named SFX/vocal/rumble sends, and the summit celebrate dance.
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
const JUMP_SUPER_MAX_V = 0.52;
const JUMP_HOLD_LIFT = 0.00062;
const JUMP_CUT = 0.42;
const JUMP_HOLD_MAX_MS = 400;
const JUMP_HOLD_MAX_SUPER_MS = 700;
const MOVING_PLAT_SPEED = 0.06;
const PLAYER_W = 26;
const PLAYER_H = 44;

const SUPER_MS = 8000;
const SUPER_WARN_MS = 2500;
const SUPER_BLINK_MS = 200;
const CELEBRATE_INTERVAL = 520;
const FINISH_PARTICLE_MS = 2000;
const FINISH_CELEBRATE_MS = 3000;
const FINISH_WALK_MS = 4500;
const FINISH_PHASE_DONE = FINISH_CELEBRATE_MS + FINISH_WALK_MS;

// v1 static-environment palette (createStaticBg)
const PLAT_EDGE_H = 4;
const PLAT_BODY_R = 72; const PLAT_BODY_G = 150; const PLAT_BODY_B = 64;
const PLAT_TOP_R = 110; const PLAT_TOP_G = 190; const PLAT_TOP_B = 86;
const PLAT_BOT_R = 42; const PLAT_BOT_G = 96; const PLAT_BOT_B = 38;

// v1 diamond spots (BASE_DIAMOND_DEFS) — rendered as 3D glTF SceneSprites.
// respawn mirrors level_forest: first two return after death, rest stay taken.
const GEM_W = 40;
const GEM_H = 72;
const BASE_DIAMOND_DEFS = [
  { x: 420, y: 1775, respawn: 1 },
  { x: 300, y: 1455, respawn: 1 },
  { x: 130, y: 1125, respawn: 0 },
  { x: 300, y: 715, respawn: 0 },
  { x: 200, y: 475, respawn: 0 }
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

function jumpMaxV(superMs) {
  if (superMs > 0) { return JUMP_SUPER_MAX_V; }
  return JUMP_MAX_V;
}

function jumpHoldMaxMs(superMs) {
  if (superMs > 0) { return JUMP_HOLD_MAX_SUPER_MS; }
  return JUMP_HOLD_MAX_MS;
}

function showSuperSprite(pl) {
  if (pl.superMs <= 0) { return false; }
  if (pl.superMs > SUPER_WARN_MS) { return true; }
  const phase = (pl.superMs / SUPER_BLINK_MS) | 0;
  if (phase % 2 == 1) { return true; }
  return false;
}

function celebrateYOffset(animTick) {
  const t = animTick / 200;
  return Math.sin(t) * 12 + Math.sin(t * 2.7) * 5;
}

function hitPickup(px, py, fx, fy) {
  const dx = px - fx;
  const dy = py - fy;
  if (dx * dx + dy * dy > 18 * 18) { return false; }
  return true;
}

function enemyCollisionKind(px, py, pvy, ex, ey) {
  const dx = px - ex;
  const dy = py - ey;
  if (dx < -18) { return "none"; }
  if (dx > 18) { return "none"; }
  if (dy < -16) { return "none"; }
  if (dy > 16) { return "none"; }
  if (pvy > 0) {
    if (py < ey + 16) { return "stomp"; }
  }
  return "hurt";
}

// Guest SFX send: named cues go through vocal (bridge records them; hosts that
// wire GameSoundPalette can synthesise blip/brick/bounce/wall/lose/win/celebrate).
function playSfx(id) {
  runtime.audio.vocal.play(id);
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
  fx = [];
  enemyAtlas = null;
  nowMs = 0;
  goalIndex = 16;
  summitMusicStarted = 0;

  makePlayer(slot, startX, atlas, superAtlas) {
    return {
      slot: slot,
      x: startX, y: 1830 - PLAYER_H, vx: 0, vy: 0,
      grounded: 1, facing: 1,
      jumpHoldMs: -1,
      jumpHeld: 0,
      lastGroundFeet: 1830,
      reachedGoal: 0,
      done: 0,
      finishMs: 0,
      finishPulseMs: 0,
      celebrateBursts: 0,
      superMs: 0,
      onMover: -1,
      atlas: atlas,
      superAtlas: superAtlas,
      sprite: null,
      superSprite: null,
      animTick: 0
    };
  }

  playVoice(name) {
    runtime.audio.vocal.play(name);
  }

  rumble(slot, ms, strength) {
    runtime.input.player(slot).rumble(strength, ms);
  }

  spawnBurst(x, y, count, r, g, b) {
    let i = 0;
    while (i < count) {
      const ang = (i / count) * 6.28318;
      this.fx.push({
        x: x + Math.cos(ang) * 6,
        y: y + Math.sin(ang) * 4,
        vx: Math.cos(ang) * 0.06,
        vy: Math.sin(ang) * 0.04 - 0.05,
        life: 420,
        rad: 3 + (i % 3),
        r: r, g: g, b: b
      });
      i = i + 1;
    }
  }

  spawnFinishParticles(x, y) {
    this.spawnBurst(x, y - 32, 10, 255, 220, 90);
    this.spawnBurst(x - 22, y - 16, 6, 255, 160, 80);
    this.spawnBurst(x + 22, y - 16, 6, 120, 220, 255);
  }

  spawnCelebratePulse(pl, burst) {
    const phase = burst % 4;
    const hop = pl.finishMs < FINISH_CELEBRATE_MS ? celebrateYOffset(pl.animTick) : 0;
    const px = pl.x + PLAYER_W / 2;
    const py = pl.y + PLAYER_H - hop;
    if (phase == 0) {
      this.spawnBurst(px, py - 30, 8, 255, 230, 120);
    } else if (phase == 1) {
      this.spawnBurst(px - 18, py - 22, 5, 255, 140, 90);
      this.spawnBurst(px + 18, py - 22, 5, 255, 140, 90);
    } else if (phase == 2) {
      this.spawnBurst(px - 10, py - 26, 5, 140, 230, 255);
      this.spawnBurst(px + 10, py - 26, 5, 140, 230, 255);
    } else {
      this.spawnBurst(px, py - 34, 6, 255, 255, 180);
    }
  }

  updateFx(dt) {
    const kept = [];
    let i = 0;
    while (i < this.fx.length) {
      const p = this.fx[i];
      p.life = p.life - dt;
      if (p.life > 0) {
        p.x = p.x + p.vx * dt;
        p.y = p.y + p.vy * dt;
        p.vy = p.vy + 0.0002 * dt;
        kept.push(p);
      }
      i = i + 1;
    }
    this.fx = kept;
  }

  drawFx() {
    const r = this.renderer;
    let i = 0;
    while (i < this.fx.length) {
      const p = this.fx[i];
      r.fillCircle(p.x, p.y, p.rad, p.r, p.g, p.b);
      i = i + 1;
    }
  }

  seatPlayerSprites(pl) {
    const sx = pl.x + PLAYER_W / 2;
    const sy = pl.y + PLAYER_H / 2 + 3;
    const superOn = showSuperSprite(pl) ? 1 : 0;
    if (superOn == 1) {
      pl.sprite.setPos(-1000, -1000);
      pl.superSprite.setPos(sx, sy);
    } else {
      pl.sprite.setPos(sx, sy);
      pl.superSprite.setPos(-1000, -1000);
    }
    const row = pl.facing < 0 ? SHEET_ROW_LEFT : SHEET_ROW_RIGHT;
    let col = 0;
    if (pl.done == 1) {
      if (pl.finishMs < FINISH_CELEBRATE_MS) {
        col = Math.floor(pl.animTick / 90) % 9;
      } else if (pl.finishMs < FINISH_PHASE_DONE) {
        col = Math.floor(pl.animTick / 70) % 9;
      } else {
        col = 0;
      }
    } else if (pl.grounded == 0) {
      col = SHEET_JUMP_COL;
    } else if (pl.vx != 0) {
      col = Math.floor(pl.animTick / 70) % 9;
    }
    pl.sprite.setCell(col, row);
    pl.superSprite.setCell(col, row);
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

    // players are the retained sprites — each its own LPC walk + super sheet
    const a1 = runtime.assets.loadSpriteAtlas("pkg://p1.atlas");
    const a2 = runtime.assets.loadSpriteAtlas("pkg://p2.atlas");
    const s1 = runtime.assets.loadSpriteAtlas("pkg://p1_super.atlas");
    const s2 = runtime.assets.loadSpriteAtlas("pkg://p2_super.atlas");
    const p1 = this.makePlayer(0, 120, a1, s1);
    const p2 = this.makePlayer(1, 330, a2, s2);
    p1.facing = 1; p2.facing = -1;
    const starts = [p1, p2];
    let k = 0;
    while (k < starts.length) {
      const pl = starts[k];
      pl.sprite = new TWO.Sprite2D(pl.atlas, 0);
      pl.sprite.setSize(PLAYER_H, PLAYER_H);
      pl.sprite.setZ(3);
      pl.sprite.setCell(0, pl.facing < 0 ? SHEET_ROW_LEFT : SHEET_ROW_RIGHT);
      pl.sprite.setPane(pl.slot);
      this.layer.add(pl.sprite);

      pl.superSprite = new TWO.Sprite2D(pl.superAtlas, 0);
      pl.superSprite.setSize(PLAYER_H, PLAYER_H);
      pl.superSprite.setZ(3);
      pl.superSprite.setCell(0, pl.facing < 0 ? SHEET_ROW_LEFT : SHEET_ROW_RIGHT);
      pl.superSprite.setPane(pl.slot);
      pl.superSprite.setPos(-1000, -1000);
      this.layer.add(pl.superSprite);
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
      this.enemies.push({
        x: d.x, y: d.y, dir: d.dir, min: d.min, max: d.max,
        tick: 0, alive: 1, sprite: spr
      });
      ei = ei + 1;
    }

    // 3D diamonds at v1 spots — collectible (grant SUPER_MS), not decoration.
    let di = 0;
    while (di < BASE_DIAMOND_DEFS.length) {
      const spot = BASE_DIAMOND_DEFS[di];
      const gem = makeDiamondSprite(this.renderer3d);
      gem.x = spot.x;
      gem.y = spot.y;
      gem.respawn = spot.respawn;
      gem.taken = 0;
      gem.sprite.setPos(spot.x, spot.y);
      this.layer.add(gem.sprite);
      this.diamonds.push(gem);
      di = di + 1;
    }

    runtime.log.info("ylos3d init: ylos2 LPC + 3D gems + super/stomp/celebrate");
    return 1;
  }

  updateEnemies(dt) {
    let i = 0;
    while (i < this.enemies.length) {
      const e = this.enemies[i];
      if (e.alive == 0) {
        e.sprite.setPos(-1000, -1000);
      } else {
        e.x = e.x + e.dir * dt * 0.08;
        if (e.x < e.min) { e.x = e.min; e.dir = 1; }
        if (e.x > e.max) { e.x = e.max; e.dir = -1; }
        e.tick = e.tick + dt;
        const anim = Math.floor(e.tick / 110) % ENEMY_WALK_FRAMES;
        const row = e.dir < 0 ? SHEET_ROW_LEFT : SHEET_ROW_RIGHT;
        // feet at (x,y): seat the 40px frame a little above the platform surface
        e.sprite.setPos(e.x, e.y - 14);
        e.sprite.setCell(anim, row);
      }
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
    this.drawFx();
  }

  tryStartSummitMusic() {
    if (this.summitMusicStarted == 1) { return; }
    this.summitMusicStarted = 1;
    runtime.audio.music.play(SUMMIT_MUSIC);
  }

  goalPlatform() {
    return BASE_PLATFORMS[this.goalIndex];
  }

  celebrateXFor(slot) {
    const gp = this.goalPlatform();
    if (slot == 1) {
      return gp.x + gp.w * 0.62 - PLAYER_W / 2;
    }
    return gp.x + gp.w * 0.38 - PLAYER_W / 2;
  }

  enterFinish(pl) {
    if (pl.done == 1) { return; }
    const gp = this.goalPlatform();
    const feetY = gp.y;
    const cx = this.celebrateXFor(pl.slot);
    pl.x = cx;
    pl.y = feetY - PLAYER_H;
    pl.vx = 0;
    pl.vy = 0;
    pl.grounded = 1;
    pl.onMover = -1;
    pl.jumpHoldMs = -1;
    pl.facing = pl.slot == 1 ? -1 : 1;
    pl.done = 1;
    pl.reachedGoal = 1;
    pl.finishMs = 0;
    pl.finishPulseMs = 0;
    pl.celebrateBursts = 0;
    this.celebrateSfx.playOneShot();
    playSfx("celebrate");
    this.playVoice("cheer");
    this.rumble(pl.slot, 220, 125);
    this.spawnFinishParticles(cx + PLAYER_W / 2, feetY);
    this.tryStartSummitMusic();
  }

  tickGoalWalk(pl, dt) {
    const gp = this.goalPlatform();
    const minX = gp.x + 18;
    const maxX = gp.x + gp.w - 18 - PLAYER_W;
    let x = pl.x;
    let face = pl.facing;
    if (face == 0) { face = 1; }
    const speed = MOVE * 0.9;
    x = x + face * speed * dt;
    if (x < minX) { x = minX; face = 1; }
    if (x > maxX) { x = maxX; face = -1; }
    pl.x = x;
    pl.facing = face;
  }

  tickFinishPlayer(pl, dt) {
    pl.finishMs = pl.finishMs + dt;
    pl.animTick = pl.animTick + dt;
    if (pl.finishMs <= FINISH_PARTICLE_MS) {
      pl.finishPulseMs = pl.finishPulseMs + dt;
      if (pl.finishPulseMs >= CELEBRATE_INTERVAL) {
        pl.finishPulseMs = 0;
        pl.celebrateBursts = pl.celebrateBursts + 1;
        this.spawnCelebratePulse(pl, pl.celebrateBursts);
      }
    } else {
      pl.finishPulseMs = 0;
    }

    const feetY = this.goalPlatform().y;
    if (pl.finishMs < FINISH_CELEBRATE_MS) {
      // hop / dance on the summit (v1 celebrateYOffset)
      pl.y = feetY - PLAYER_H - celebrateYOffset(pl.animTick);
      pl.vx = 0;
    } else if (pl.finishMs < FINISH_PHASE_DONE) {
      this.tickGoalWalk(pl, dt);
      pl.y = feetY - PLAYER_H;
      pl.vx = MOVE * 0.9 * pl.facing;
    } else {
      pl.y = feetY - PLAYER_H;
      pl.vx = 0;
    }
    pl.vy = 0;
    pl.grounded = 1;
    this.seatPlayerSprites(pl);
  }

  markGoal(pl) {
    this.enterFinish(pl);
  }

  respawnPlayer(pl) {
    const startX = pl.slot == 0 ? 120 : 330;
    pl.x = startX;
    pl.y = 1830 - PLAYER_H;
    pl.vx = 0;
    pl.vy = 0;
    pl.grounded = 1;
    pl.facing = pl.slot == 0 ? 1 : -1;
    pl.jumpHoldMs = -1;
    pl.jumpHeld = 0;
    pl.lastGroundFeet = 1830;
    pl.onMover = -1;
    pl.superMs = 0;
    pl.animTick = 0;
  }

  respawnMarkedDiamonds() {
    let i = 0;
    while (i < this.diamonds.length) {
      const gem = this.diamonds[i];
      if (gem.respawn == 1 && gem.taken == 1) {
        gem.taken = 0;
        gem.sprite.setPos(gem.x, gem.y);
      }
      i = i + 1;
    }
  }

  stompBounce(pl, ey) {
    pl.y = ey - 2 - PLAYER_H;
    pl.vy = 0 - JUMP_MAX_V * 0.55;
    pl.grounded = 0;
    pl.onMover = -1;
    pl.jumpHoldMs = 0;
  }

  applyEnemyHits(pl) {
    if (pl.done == 1) { return 0; }
    const px = pl.x + PLAYER_W / 2;
    const py = pl.y + PLAYER_H;
    let died = 0;
    let ei = 0;
    while (ei < this.enemies.length) {
      const e = this.enemies[ei];
      if (e.alive == 1) {
        const kind = enemyCollisionKind(px, py, pl.vy, e.x, e.y);
        if (kind == "stomp") {
          e.alive = 0;
          this.stompBounce(pl, e.y);
          playSfx("brick");
          playSfx("bounce");
          this.playVoice("chuckle");
          this.rumble(pl.slot, 90, 70);
          this.spawnBurst(e.x, e.y - 10, 6, 220, 220, 220);
        } else if (kind == "hurt") {
          if (pl.superMs > 0) {
            e.alive = 0;
            playSfx("brick");
            this.rumble(pl.slot, 60, 47);
            this.spawnBurst(e.x, e.y - 10, 8, 120, 230, 255);
          } else {
            this.respawnPlayer(pl);
            this.respawnMarkedDiamonds();
            died = 1;
            playSfx("lose");
            this.playVoice("gasp");
            this.rumble(pl.slot, 280, 156);
            break;
          }
        }
      }
      ei = ei + 1;
    }
    return died;
  }

  collectDiamonds(pl) {
    if (pl.done == 1) { return; }
    const px = pl.x + PLAYER_W / 2;
    const py = pl.y + PLAYER_H;
    let i = 0;
    while (i < this.diamonds.length) {
      const gem = this.diamonds[i];
      if (gem.taken == 0) {
        if (hitPickup(px, py, gem.x, gem.y)) {
          gem.taken = 1;
          gem.sprite.setPos(-1000, -1000);
          pl.superMs = SUPER_MS;
          playSfx("win");
          this.rumble(pl.slot, 160, 110);
          this.spawnBurst(gem.x, gem.y, 10, 120, 230, 255);
        }
      }
      i = i + 1;
    }
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

    if (pl.superMs > 0) {
      pl.superMs = pl.superMs - dt;
      if (pl.superMs < 0) { pl.superMs = 0; }
    }
    const plSuper = pl.superMs | 0;
    const maxV = jumpMaxV(plSuper);
    const holdMax = jumpHoldMaxMs(plSuper);

    pl.vx = 0;
    if (left) { pl.vx = 0 - MOVE; pl.facing = -1; }
    if (right) { pl.vx = MOVE; pl.facing = 1; }
    pl.x = pl.x + pl.vx * dt;
    if (pl.x < 0) { pl.x = 0; }
    if (pl.x > BASE_W - PLAYER_W) { pl.x = BASE_W - PLAYER_W; }

    pl.vy = pl.vy + GRAV * dt;
    const fallVy = pl.vy;

    // v1 edge-triggers grounded jumps (hold does not auto-rejump on land).
    if (jump) {
      if (pl.grounded == 1) {
        if (pl.jumpHeld == 0) {
          pl.vy = 0 - JUMP_MIN_V;
          pl.grounded = 0;
          pl.onMover = -1;
          pl.jumpHoldMs = 0;
          playSfx("bounce");
        }
      } else if (pl.jumpHoldMs >= 0 && pl.jumpHoldMs < holdMax && pl.vy < 0) {
        pl.vy = pl.vy - JUMP_HOLD_LIFT * dt;
        if (pl.vy < 0 - maxV) { pl.vy = 0 - maxV; }
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
    const wasAirborne = pl.grounded == 0 ? 1 : 0;
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
            if (i == this.goalIndex) { this.enterFinish(pl); }
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

    if (pl.grounded == 1 && wasAirborne == 1) {
      if (fallVy > 0.12) {
        playSfx("wall");
      }
    }

    // v1 also finishes by proximity (feet near goal), not only by landing.
    if (pl.done == 0) {
      if (pl.y + PLAYER_H <= this.goalPlatform().y + 22) {
        this.enterFinish(pl);
      }
    }

    if (pl.y > WORLD_H) {
      this.respawnPlayer(pl);
      this.respawnMarkedDiamonds();
      playSfx("lose");
      this.playVoice("gasp");
    }

    if (pl.vx != 0) { pl.animTick = pl.animTick + dt; }
    this.seatPlayerSprites(pl);
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

  updateDiamonds(dt) {
    let gi = 0;
    while (gi < this.diamonds.length) {
      const gem = this.diamonds[gi];
      if (gem.taken == 0) {
        gem.angle = gem.angle + dt * 0.002;
        gem.mesh.setTransform(0.0, 0.0, 0.0, 0.12, gem.angle, 0.08);
        gem.mesh.setScale(1.55, 1.55, 1.55);
        gem.view.invalidate();
        gem.view.sync(this.renderer3d);
        gem.sprite.setPos(gem.x, gem.y);
      }
      gi = gi + 1;
    }
  }

  update(props) {
    const dt = props.dtMs;
    this.nowMs = this.nowMs + dt;
    this.updateMovers(dt);
    this.updateEnemies(dt);
    this.updateFx(dt);

    let si = 0;
    while (si < this.players.length) {
      const pl = this.players[si];
      if (pl.done == 1) {
        this.tickFinishPlayer(pl, dt);
      } else {
        this.updatePlayer(pl, dt);
        if (pl.done == 0) {
          this.applyEnemyHits(pl);
          this.collectDiamonds(pl);
        }
      }
      si = si + 1;
    }

    this.updateDiamonds(dt);
    this.updateCameras();
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
  if (pl.done == 1) { return 0; }
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
