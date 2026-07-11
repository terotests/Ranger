/// <reference path="../../scripting/game.d.ts" />
//
// Ylos 2 — vertical platformer with LPC spritesheets, diamonds (super power),
// and per-player finish celebrations. Original Ylos stays in games/ylos/.
//
// Split pane: left=P1 girl, right=P2 boy (paneIndex); WASD / arrows + Space + B
// Dual (480px): P1 WASD, P2 arrows + Start to join

import { soundEvent, particleEvent, rumbleEvent } from "../../scripting/game_helpers";

const BASE_W = 480;
const WORLD_H = 1890;
const VIEW_H = 270;
const MAX_ENEMIES = 12;
const MAX_FRUITS = 7;
const MAX_DIAMONDS = 7;
const MAX_BULLETS = 4;
const MAX_MOVING_PLATFORMS = 8;
const MOVING_PLAT_SPEED = 0.06;
const PLAT_COLOR_BODY = { r: 72, g: 150, b: 64 };
const PLAT_COLOR_TOP = { r: 110, g: 190, b: 86 };
const PLAT_COLOR_BOTTOM = { r: 42, g: 96, b: 38 };
const PLAT_EDGE_H = 4;
const JUMP_MIN_V = 0.28;
const JUMP_MAX_V = 0.38;
const JUMP_SUPER_MAX_V = 0.52;
const JUMP_HOLD_LIFT = 0.00062;
const JUMP_CUT = 0.42;
const JUMP_HOLD_MAX_MS = 400;
const JUMP_HOLD_MAX_SUPER_MS = 700;
const BULLET_SPEED = 0.42;
const SUPER_MS = 5000;
const CELEBRATE_INTERVAL = 520;
const FINISH_PARTICLE_MS = 2000;
const FINISH_CELEBRATE_MS = 3000;
const FINISH_WALK_MS = 4500;
const FINISH_PHASE_DONE = FINISH_CELEBRATE_MS + FINISH_WALK_MS;

const GRAV = 0.00045;
const MOVE = 0.22;
const P1_SHEET = "assets/p1_walk.png";
const P2_SHEET = "assets/p2_walk.png";
const P1_SUPER_SHEET = "assets/p1_super.png";
const P2_SUPER_SHEET = "assets/p2_super.png";
const ENEMY_SHEET = "assets/enemy_walk.png";
const ENEMY_WALK_FRAMES = 9;
// P1 = girl (left), P2 = boy (right), enemies = LPC skeleton.
// Regenerate: npm run engine:ylos2:assets

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

// Moving platforms — ping-pong between min/max (world x), landable.
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

const BASE_FRUIT_DEFS = [
  { x: 70, y: 1675 },
  { x: 210, y: 1565 },
  { x: 350, y: 1455 },
  { x: 100, y: 1245 },
  { x: 150, y: 1025 },
  { x: 85, y: 248 },
  { x: 330, y: 365 }
];

const BASE_DIAMOND_DEFS = [
  { x: 90, y: 1675, restoreOnRestart: true },
  { x: 200, y: 1565, restoreOnRestart: true },
  { x: 330, y: 1455, restoreOnRestart: true },
  { x: 70, y: 1345, restoreOnRestart: true },
  { x: 430, y: 1740, restoreOnRestart: false },
  { x: 300, y: 1015, restoreOnRestart: false },
  { x: 170, y: 705, restoreOnRestart: false }
];

const P1_START_X = 120;
const P2_START_X = 360;
const GOAL_PLATFORM = BASE_PLATFORMS[BASE_PLATFORMS.length - 1];

const DIAMOND_A = [
  "..XX..",
  ".XXXX.",
  "XXXXXX",
  ".XXXX.",
  "..XX.."
];

function worldW() {
  return bgWidth;
}

function isSplitPane() {
  return paneIndex >= 0;
}

function isDualMode() {
  if (isSplitPane()) {
    return false;
  }
  return worldW() > 300;
}

function playerSlots() {
  if (isDualMode()) {
    return 2;
  }
  return 1;
}

function localPlayerSlot() {
  if (isSplitPane()) {
    if (paneIndex == 1) {
      return 2;
    }
    return 1;
  }
  return 1;
}

function localPlayerEntityId() {
  if (localPlayerSlot() == 2) {
    return "p2";
  }
  return "p1";
}

function localSuperEntityId() {
  if (localPlayerSlot() == 2) {
    return "p2s";
  }
  return "p1s";
}

function localStartX() {
  if (localPlayerSlot() == 2) {
    return P2_START_X;
  }
  return P1_START_X;
}

function localStartFace() {
  if (localPlayerSlot() == 2) {
    return -1;
  }
  return 1;
}

function hiddenEntity() {
  return { x: -40, y: -40, visible: 0, p0: 0, p1: 0, p2: 0 };
}

function scaleX(v) {
  return (v * worldW()) / BASE_W;
}

function scalePlatform(p) {
  return {
    x: scaleX(p.x),
    y: p.y,
    w: scaleX(p.w),
    h: p.h
  };
}

function buildPlatforms() {
  const out = [];
  let i = 0;
  while (i < BASE_PLATFORMS.length) {
    out.push(scalePlatform(BASE_PLATFORMS[i]));
    i = i + 1;
  }
  return out;
}

function buildEnemyDefs() {
  const out = [];
  let i = 0;
  while (i < BASE_ENEMY_DEFS.length) {
    const d = BASE_ENEMY_DEFS[i];
    out.push({
      x: scaleX(d.x),
      y: d.y,
      dir: d.dir,
      min: scaleX(d.min),
      max: scaleX(d.max)
    });
    i = i + 1;
  }
  return out;
}

function buildFruitDefs() {
  const out = [];
  let i = 0;
  while (i < BASE_FRUIT_DEFS.length) {
    const d = BASE_FRUIT_DEFS[i];
    out.push({ x: scaleX(d.x), y: d.y });
    i = i + 1;
  }
  return out;
}

function buildDiamondDefs() {
  const out = [];
  let i = 0;
  while (i < BASE_DIAMOND_DEFS.length) {
    const d = BASE_DIAMOND_DEFS[i];
    out.push({ x: scaleX(d.x), y: d.y });
    i = i + 1;
  }
  return out;
}

function makeMovingPlatforms() {
  const out = [];
  let i = 0;
  while (i < BASE_MOVING_PLATFORMS.length) {
    const d = BASE_MOVING_PLATFORMS[i];
    const x = scaleX(d.x);
    out.push({
      x: x,
      prevX: x,
      y: d.y,
      w: scaleX(d.w),
      h: d.h,
      minX: scaleX(d.min),
      maxX: scaleX(d.max),
      dir: d.dir
    });
    i = i + 1;
  }
  return out;
}

function copyMovingPlatforms(s) {
  const out = [];
  let i = 0;
  while (i < MAX_MOVING_PLATFORMS) {
    if (s.movingPlatforms) {
      if (s.movingPlatforms[i]) {
        const mp = s.movingPlatforms[i];
        out.push({
          x: mp.x,
          prevX: mp.prevX != null ? mp.prevX : mp.x,
          y: mp.y,
          w: mp.w,
          h: mp.h,
          minX: mp.minX,
          maxX: mp.maxX,
          dir: mp.dir
        });
      } else {
        out.push(makeMovingPlatforms()[i]);
      }
    } else {
      out.push(makeMovingPlatforms()[i]);
    }
    i = i + 1;
  }
  return out;
}

function platformsOverlap(a, b) {
  if (a.x + a.w <= b.x) {
    return false;
  }
  if (b.x + b.w <= a.x) {
    return false;
  }
  if (a.y + a.h <= b.y) {
    return false;
  }
  if (b.y + b.h <= a.y) {
    return false;
  }
  return true;
}

function movingPlatformBox(x, mp) {
  return { x: x, y: mp.y, w: mp.w, h: mp.h };
}

function movingPlatformHitsOthers(mp, newX, staticPlats, movingPlats, selfIndex) {
  const box = movingPlatformBox(newX, mp);
  let i = 0;
  while (i < staticPlats.length) {
    if (platformsOverlap(box, staticPlats[i])) {
      return true;
    }
    i = i + 1;
  }
  i = 0;
  while (i < movingPlats.length) {
    if (i != selfIndex) {
      const other = movingPlats[i];
      if (other) {
        if (platformsOverlap(box, movingPlatformBox(other.x, other))) {
          return true;
        }
      }
    }
    i = i + 1;
  }
  return false;
}

function updateMovingPlatforms(platforms, dt, staticPlats) {
  let i = 0;
  while (i < platforms.length) {
    const mp = platforms[i];
    const prevX = mp.x;
    let x = mp.x + mp.dir * MOVING_PLAT_SPEED * dt;
    let dir = mp.dir;
    if (x < mp.minX) {
      x = mp.minX;
      dir = 1;
    }
    if (x + mp.w > mp.maxX) {
      x = mp.maxX - mp.w;
      dir = -1;
    }
    if (movingPlatformHitsOthers(mp, x, staticPlats, platforms, i)) {
      dir = -dir;
      x = prevX;
    }
    platforms[i] = {
      x: x,
      prevX: prevX,
      y: mp.y,
      w: mp.w,
      h: mp.h,
      minX: mp.minX,
      maxX: mp.maxX,
      dir: dir
    };
    i = i + 1;
  }
  return platforms;
}

function staticPlatformCount(platforms) {
  let n = 0;
  let i = 0;
  while (i < platforms.length) {
    if (platforms[i].vx == 0) {
      n = n + 1;
    }
    i = i + 1;
  }
  return n;
}

function playerBodyTop(py) {
  return py - 34;
}

function playerOverlapsPlatform(px, py, pw, p) {
  if (px + pw <= p.x) {
    return false;
  }
  if (px - pw >= p.x + p.w) {
    return false;
  }
  if (py <= p.y) {
    return false;
  }
  if (playerBodyTop(py) >= p.y + p.h) {
    return false;
  }
  return true;
}

function isStandingOnPlatform(px, py, pw, p) {
  if (px + pw <= p.x) {
    return false;
  }
  if (px - pw >= p.x + p.w) {
    return false;
  }
  if (py < p.y - 2) {
    return false;
  }
  if (py > p.y + 6) {
    return false;
  }
  return true;
}

function applyMovingPlatformSidePush(px, py, pw, grounded, platforms, staticCount) {
  let x = px;
  let g = grounded;
  let i = staticCount;
  while (i < platforms.length) {
    const p = platforms[i];
    const dx = p.x - p.prevX;
    if (dx != 0) {
      if (playerOverlapsPlatform(x, py, pw, p)) {
        if (isStandingOnPlatform(x, py, pw, p) == false) {
          x = x + dx;
          g = 0;
        }
      }
    }
    i = i + 1;
  }
  return { x: x, grounded: g };
}

function mergePlatforms(staticPlats, movingPlats) {
  const out = [];
  let i = 0;
  while (i < staticPlats.length) {
    const p = staticPlats[i];
    out.push({ x: p.x, y: p.y, w: p.w, h: p.h, vx: 0, prevX: p.x });
    i = i + 1;
  }
  i = 0;
  while (i < movingPlats.length) {
    const mp = movingPlats[i];
    out.push({
      x: mp.x,
      prevX: mp.prevX,
      y: mp.y,
      w: mp.w,
      h: mp.h,
      vx: mp.dir * MOVING_PLAT_SPEED
    });
    i = i + 1;
  }
  return out;
}

function stillOnMovingPlatform(px, py, pw, platforms, staticCount) {
  let i = staticCount;
  while (i < platforms.length) {
    if (isStandingOnPlatform(px, py, pw, platforms[i])) {
      return 1;
    }
    i = i + 1;
  }
  return 0;
}

function jumpHoldMaxMs(pl) {
  if (pl.superMs > 0) {
    return JUMP_HOLD_MAX_SUPER_MS;
  }
  return JUMP_HOLD_MAX_MS;
}

function jumpMaxV(pl) {
  if (pl.superMs > 0) {
    return JUMP_SUPER_MAX_V;
  }
  return JUMP_MAX_V;
}

function floorY() {
  return BASE_PLATFORMS[0].y;
}

function goalPlatform() {
  return scalePlatform(GOAL_PLATFORM);
}

function goalFeetY() {
  return goalPlatform().y;
}

function goalTriggerY() {
  return goalPlatform().y + 22;
}

function celebrateXFor(slot) {
  const gp = goalPlatform();
  if (slot == 2) {
    return gp.x + gp.w * 0.62;
  }
  return gp.x + gp.w * 0.38;
}

function celebrateYOffset(animTick) {
  const t = animTick / 200;
  return Math.sin(t) * 12 + Math.sin(t * 2.7) * 5;
}

function spawnFinishParticles(events, x, y) {
  events.push(particleEvent("celebrate", x, y - 32, 40));
  events.push(particleEvent("celebrate", x - 22, y - 16, 20));
  events.push(particleEvent("celebrate", x + 22, y - 16, 20));
  events.push(particleEvent("sparkle", x, y - 40, 18));
  events.push(particleEvent("burst", x - 24, y - 20, 12));
  events.push(particleEvent("burst", x + 24, y - 20, 12));
}

function spawnCelebratePulse(events, pl, burst) {
  const phase = burst % 4;
  const hop = pl.finishMs < FINISH_CELEBRATE_MS ? celebrateYOffset(pl.animTick) : 0;
  const px = pl.x;
  const py = pl.y - hop;
  if (phase == 0) {
    events.push(particleEvent("celebrate", px, py - 30, 22));
    events.push(particleEvent("sparkle", px - 14, py - 18, 10));
    events.push(particleEvent("sparkle", px + 14, py - 18, 10));
  } else if (phase == 1) {
    events.push(particleEvent("burst", px - 18, py - 22, 14));
    events.push(particleEvent("burst", px + 18, py - 22, 14));
  } else if (phase == 2) {
    events.push(particleEvent("celebrate", px - 10, py - 26, 14));
    events.push(particleEvent("celebrate", px + 10, py - 26, 14));
  } else {
    events.push(particleEvent("sparkle", px, py - 34, 16));
    events.push(particleEvent("celebrate", px, py - 8, 12));
  }
}

function makePlayerOnFloor(x, face) {
  return {
    x: scaleX(x),
    y: floorY(),
    vx: 0,
    vy: 0,
    face: face,
    grounded: 1,
    anim: 0,
    animTick: 0,
    jumpHold: 0,
    airJump: 0,
    jumpBoostMs: 0,
    superMs: 0,
    done: 0,
    finishMs: 0,
    finishPulseMs: 0,
    celebrateBursts: 0
  };
}

function staticLevelHeight() {
  return WORLD_H;
}

function drawSkyGradient() {
  let y = 0;
  while (y < bgHeight) {
    const t = y / bgHeight;
    const r = 30 + t * 50;
    const g = 70 + t * 90;
    const b = 140 + t * 60;
    bgFillRect(0, y, bgWidth, 4, r, g, b);
    y = y + 4;
  }
}

function drawCloud(cx, cy) {
  bgFillCircle(cx, cy, 14, 240, 245, 255);
  bgFillCircle(cx - 16, cy + 4, 10, 235, 240, 250);
  bgFillCircle(cx + 16, cy + 4, 10, 235, 240, 250);
}

function movingPlatformLayerSprite(id, w, h, color) {
  let rw = w | 0;
  if (rw < 12) {
    rw = 12;
  }
  let rh = h | 0;
  if (rh < 1) {
    rh = 1;
  }
  return {
    id: id,
    kind: "rect",
    w: rw,
    h: rh,
    r: color.r,
    g: color.g,
    b: color.b
  };
}

function movingPlatformSprites(mpi, w, h) {
  const bodyH = h - PLAT_EDGE_H * 2;
  return [
    movingPlatformLayerSprite("mp" + mpi + "t", w, PLAT_EDGE_H, PLAT_COLOR_TOP),
    movingPlatformLayerSprite("mp" + mpi + "m", w, bodyH, PLAT_COLOR_BODY),
    movingPlatformLayerSprite("mp" + mpi + "b", w, PLAT_EDGE_H, PLAT_COLOR_BOTTOM)
  ];
}

function placeMovingPlatformEntities(entities, mpi, mp, cam) {
  const cx = mp.x + mp.w / 2;
  const screenY = mp.y - cam;
  const midH = mp.h - PLAT_EDGE_H * 2;
  entities["mp" + mpi + "t"] = {
    x: cx,
    y: screenY + PLAT_EDGE_H / 2,
    visible: 1,
    r: PLAT_COLOR_TOP.r,
    g: PLAT_COLOR_TOP.g,
    b: PLAT_COLOR_TOP.b
  };
  entities["mp" + mpi + "m"] = {
    x: cx,
    y: screenY + PLAT_EDGE_H + midH / 2,
    visible: 1,
    r: PLAT_COLOR_BODY.r,
    g: PLAT_COLOR_BODY.g,
    b: PLAT_COLOR_BODY.b
  };
  entities["mp" + mpi + "b"] = {
    x: cx,
    y: screenY + mp.h - PLAT_EDGE_H / 2,
    visible: 1,
    r: PLAT_COLOR_BOTTOM.r,
    g: PLAT_COLOR_BOTTOM.g,
    b: PLAT_COLOR_BOTTOM.b
  };
}

function hideMovingPlatformEntities(entities, mpi) {
  entities["mp" + mpi + "t"] = hiddenEntity();
  entities["mp" + mpi + "m"] = hiddenEntity();
  entities["mp" + mpi + "b"] = hiddenEntity();
}

function createStaticBg() {
  const platforms = buildPlatforms();
  drawSkyGradient();
  drawCloud(scaleX(80), 220);
  drawCloud(scaleX(360), 420);
  drawCloud(scaleX(120), 720);
  drawCloud(scaleX(400), 980);
  drawCloud(scaleX(60), 1280);

  let i = 0;
  while (i < platforms.length) {
    const p = platforms[i];
    bgFillRect(p.x, p.y, p.w, p.h, PLAT_COLOR_BODY.r, PLAT_COLOR_BODY.g, PLAT_COLOR_BODY.b);
    bgFillRect(p.x, p.y, p.w, PLAT_EDGE_H, PLAT_COLOR_TOP.r, PLAT_COLOR_TOP.g, PLAT_COLOR_TOP.b);
    bgFillRect(
      p.x,
      p.y + p.h - PLAT_EDGE_H,
      p.w,
      PLAT_EDGE_H,
      PLAT_COLOR_BOTTOM.r,
      PLAT_COLOR_BOTTOM.g,
      PLAT_COLOR_BOTTOM.b
    );
    i = i + 1;
  }

  const flagX = scaleX(240);
  bgFillRect(flagX - 8, 80, 8, 90, 160, 120, 70);
  bgFillRect(flagX, 88, 36, 20, 255, 90, 90);
  bgFillRect(flagX, 96, 30, 8, 255, 210, 60);
}

function playerSheetSprite(id, path) {
  return {
    id: id,
    kind: "sheet",
    path: path,
    frameW: 64,
    frameH: 64,
    cols: 9,
    rows: 4,
    scale: 72,
    feetTrim: 10,
    jumpFrame: 3
  };
}

function superSheetSprite(id, path) {
  return {
    id: id,
    kind: "sheet",
    path: path,
    frameW: 64,
    frameH: 64,
    cols: 9,
    rows: 4,
    scale: 72,
    feetTrim: 10,
    jumpFrame: 3
  };
}

function rumbleForOwner(owner, ms, strength) {
  let pad = 0;
  if (owner == 2) {
    pad = 1;
  }
  let v = 24000;
  if (strength != null) {
    v = strength;
  }
  let dur = 120;
  if (ms != null) {
    dur = ms;
  }
  return rumbleEvent(pad, v, v, dur);
}

function enemySprite(id) {
  return {
    id: id,
    kind: "sheet",
    path: ENEMY_SHEET,
    frameW: 64,
    frameH: 64,
    cols: 9,
    rows: 4,
    scale: 60,
    feetTrim: 10,
    jumpFrame: 0
  };
}

function diamondSprite(id) {
  return {
    id: id,
    kind: "bitmap",
    px: 3,
    br: 120,
    bg: 240,
    bb: 255,
    er: 255,
    eg: 255,
    eb: 255,
    frames: [DIAMOND_A]
  };
}

function sprites() {
  const list = [];
  let e = 0;
  while (e < MAX_ENEMIES) {
    list.push(enemySprite("e" + e));
    e = e + 1;
  }
  let f = 0;
  while (f < MAX_FRUITS) {
    list.push({ id: "f" + f, kind: "circle", rad: 6, r: 255, g: 170, b: 40 });
    f = f + 1;
  }
  let d = 0;
  while (d < MAX_DIAMONDS) {
    list.push(diamondSprite("d" + d));
    d = d + 1;
  }
  let b = 0;
  while (b < MAX_BULLETS) {
    list.push({ id: "b" + b, kind: "rect", w: 6, h: 4, r: 255, g: 240, b: 120 });
    b = b + 1;
  }
  let mpi = 0;
  while (mpi < MAX_MOVING_PLATFORMS) {
    const def = BASE_MOVING_PLATFORMS[mpi];
    const layers = movingPlatformSprites(mpi, scaleX(def.w), def.h);
    list.push(layers[0]);
    list.push(layers[1]);
    list.push(layers[2]);
    mpi = mpi + 1;
  }
  // Draw players last so they appear above enemies / pickups.
  list.push(playerSheetSprite("p1", P1_SHEET));
  list.push(playerSheetSprite("p2", P2_SHEET));
  list.push(superSheetSprite("p1s", P1_SUPER_SHEET));
  list.push(superSheetSprite("p2s", P2_SUPER_SHEET));
  return list;
}

function makeEnemies() {
  const defs = buildEnemyDefs();
  const out = [];
  let i = 0;
  while (i < MAX_ENEMIES) {
    const d = defs[i];
    out.push({
      x: d.x,
      y: d.y,
      dir: d.dir,
      min: d.min,
      max: d.max,
      alive: 1,
      tick: 0,
      anim: 0,
      row: d.dir > 0 ? 3 : 1
    });
    i = i + 1;
  }
  return out;
}

function makeFruits() {
  const out = [];
  let i = 0;
  while (i < MAX_FRUITS) {
    out.push({ taken: 0 });
    i = i + 1;
  }
  return out;
}

function makeDiamonds() {
  const out = [];
  let i = 0;
  while (i < MAX_DIAMONDS) {
    out.push({ taken: 0 });
    i = i + 1;
  }
  return out;
}

function makeRestartDiamonds(prev) {
  const out = [];
  let i = 0;
  while (i < MAX_DIAMONDS) {
    const def = BASE_DIAMOND_DEFS[i];
    if (def.restoreOnRestart) {
      out.push({ taken: 0 });
    } else {
      let taken = 0;
      if (prev) {
        if (prev[i]) {
          taken = prev[i].taken;
        }
      }
      out.push({ taken: taken });
    }
    i = i + 1;
  }
  return out;
}

function makeBullets() {
  const out = [];
  let i = 0;
  while (i < MAX_BULLETS) {
    out.push({ active: 0, x: 0, y: 0, vx: 0, owner: 0 });
    i = i + 1;
  }
  return out;
}

function initState() {
  const slots = playerSlots();
  const cameraY = WORLD_H - VIEW_H;
  const p1 = makePlayerOnFloor(localStartX(), localStartFace());
  const p2 = makePlayerOnFloor(P2_START_X, -1);
  const enemies = makeEnemies();
  const fruits = makeFruits();
  const diamonds = makeDiamonds();
  const bullets = makeBullets();
  const movingPlatforms = makeMovingPlatforms();
  const entities = placeEntities(
    {
      p1: p1,
      p2: p2,
      enemies: enemies,
      fruits: fruits,
      diamonds: diamonds,
      bullets: bullets,
      movingPlatforms: movingPlatforms
    },
    cameraY,
    slots
  );
  return {
    showNet: 0,
    playerSlots: slots,
    cameraY: cameraY,
    entities: entities,
    p1: p1,
    p2: p2,
    enemies: enemies,
    fruits: fruits,
    diamonds: diamonds,
    bullets: bullets,
    movingPlatforms: movingPlatforms,
    score1: 0,
    score2: 0,
    fireCd1: 0,
    fireCd2: 0
  };
}

function readPlayer(props, index) {
  const input = props.input;
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let action = false;
  let shoot = false;
  if (index == 0) {
    up = props.up;
    left = props.left;
    right = props.right;
    action = props.action;
  }
  if (input) {
    if (input.players[index]) {
      const p = input.players[index];
      up = p.up;
      down = p.down;
      left = p.left;
      right = p.right;
      action = p.action;
      if (p.b) {
        shoot = true;
      }
      if (p.x) {
        shoot = true;
      }
    }
  }
  return { up: up, down: down, left: left, right: right, action: action, shoot: shoot };
}

function clampX(x) {
  if (x < 14) {
    return 14;
  }
  if (x > worldW() - 14) {
    return worldW() - 14;
  }
  return x;
}

function landOnPlatforms(pl, pw, dt, platforms, staticCount) {
  let grounded = 0;
  let ny = pl.y;
  let nvy = pl.vy;
  let carryVx = 0;
  if (pl.vy >= 0) {
    let i = 0;
    while (i < platforms.length) {
      const p = platforms[i];
      const moving = i >= staticCount;
      if (pl.x + pw > p.x) {
        if (pl.x - pw < p.x + p.w) {
          const feet = pl.y;
          const prevFeet = feet - pl.vy * dt;
          if (feet >= p.y) {
            if (prevFeet <= p.y + 4) {
              if (moving) {
                if (isStandingOnPlatform(pl.x, pl.y, pw, p) == false) {
                  i = i + 1;
                  continue;
                }
              }
              if (grounded == 0 || p.y < ny) {
                ny = p.y;
                nvy = 0;
                grounded = 1;
                carryVx = p.vx;
              }
            }
          }
        }
      }
      i = i + 1;
    }
  }
  return { y: ny, vy: nvy, grounded: grounded, carryVx: carryVx };
}

function enemyCollisionKind(px, py, pvy, ex, ey) {
  const dx = px - ex;
  const dy = py - ey;
  if (dx < -18) {
    return "none";
  }
  if (dx > 18) {
    return "none";
  }
  if (dy < -16) {
    return "none";
  }
  if (dy > 16) {
    return "none";
  }
  if (pvy > 0) {
    if (py < ey + 16) {
      return "stomp";
    }
  }
  return "hurt";
}

function stompBounce(pl, ey) {
  return {
    x: pl.x,
    y: ey - 2,
    vx: pl.vx,
    vy: 0 - JUMP_MAX_V * 0.55,
    face: pl.face,
    grounded: 0,
    anim: 1,
    animTick: pl.animTick,
    jumpHold: pl.jumpHold,
    airJump: 1,
    jumpBoostMs: 0,
    superMs: pl.superMs,
    done: pl.done,
    finishMs: pl.finishMs,
    finishPulseMs: pl.finishPulseMs,
    celebrateBursts: pl.celebrateBursts
  };
}

function applyEnemyHits(pl, owner, enemies, events) {
  let out = pl;
  let ei = 0;
  while (ei < MAX_ENEMIES) {
    if (enemies[ei].alive == 1) {
      const kind = enemyCollisionKind(out.x, out.y, out.vy, enemies[ei].x, enemies[ei].y);
      if (kind == "stomp") {
        enemies[ei].alive = 0;
        out = stompBounce(out, enemies[ei].y);
        events.push(soundEvent("brick"));
        events.push(soundEvent("bounce"));
        events.push(rumbleForOwner(owner, 90, 18000));
      } else {
        if (kind == "hurt") {
          if (out.superMs > 0) {
            enemies[ei].alive = 0;
            events.push(soundEvent("brick"));
            events.push(particleEvent("sparkle", enemies[ei].x, enemies[ei].y, 10));
            events.push(rumbleForOwner(owner, 60, 12000));
          } else {
            out = respawnPlayer(owner);
            events.push(soundEvent("lose"));
            events.push(rumbleForOwner(owner, 280, 40000));
          }
        }
      }
    }
    ei = ei + 1;
  }
  return out;
}

function hitPickup(px, py, fx, fy) {
  const dx = px - fx;
  const dy = py - fy;
  if (dx * dx + dy * dy > 18 * 18) {
    return false;
  }
  return true;
}

function spawnBullet(bullets, x, y, face, owner) {
  let i = 0;
  while (i < MAX_BULLETS) {
    if (bullets[i].active == 0) {
      bullets[i] = {
        active: 1,
        x: x,
        y: y,
        vx: face * BULLET_SPEED,
        owner: owner
      };
      return true;
    }
    i = i + 1;
  }
  return false;
}

function sheetFrameForPlayer(pl, moving) {
  let frame = 0;
  if (pl.grounded == 1) {
    if (moving) {
      frame = Math.floor(pl.animTick / 70) % 9;
    }
  } else {
    frame = 3;
  }
  let row = 2;
  if (pl.face > 0) {
    row = 3;
  } else {
    if (pl.face < 0) {
      row = 1;
    }
  }
  const jump = pl.grounded == 1 ? 0 : 1;
  return { p0: frame, p1: row, p2: jump };
}

function updatePlayer(pl, inp, dt, bullets, owner, fireCd, platforms) {
  const events = [];
  let face = pl.face;
  let vx = 0;
  if (inp.left) {
    vx = 0 - MOVE;
    face = -1;
  }
  if (inp.right) {
    vx = MOVE;
    face = 1;
  }
  let superMs = pl.superMs;
  if (superMs > 0) {
    superMs = superMs - dt;
    if (superMs < 0) {
      superMs = 0;
    }
  }
  const plSuper = { superMs: superMs };
  let vy = pl.vy + GRAV * dt;
  let airJump = pl.airJump;
  let jumpBoostMs = pl.jumpBoostMs;
  if (pl.grounded == 1) {
    airJump = 0;
    jumpBoostMs = 0;
  }

  const wantJump = inp.up || inp.action;
  let jumped = 0;
  if (pl.grounded == 1) {
    if (wantJump) {
      if (pl.jumpHold == 0) {
        vy = 0 - JUMP_MIN_V;
        airJump = 1;
        jumpBoostMs = 0;
        jumped = 1;
        events.push(soundEvent("bounce"));
      }
    }
  } else if (airJump == 1) {
    if (vy < 0) {
      const maxV = jumpMaxV(plSuper);
      const holdMax = jumpHoldMaxMs(plSuper);
      if (wantJump) {
        if (jumpBoostMs < holdMax) {
          vy = vy - JUMP_HOLD_LIFT * dt;
          jumpBoostMs = jumpBoostMs + dt;
          if (vy < 0 - maxV) {
            vy = 0 - maxV;
          }
        }
      } else if (pl.jumpHold == 1) {
        if (jumpBoostMs > 0) {
          vy = vy * JUMP_CUT;
          jumpBoostMs = 0;
        }
      }
    }
  }

  const pw = 8;
  const staticCount = staticPlatformCount(platforms);
  let x = pl.x + vx * dt;
  const side = applyMovingPlatformSidePush(x, pl.y, pw, pl.grounded, platforms, staticCount);
  x = side.x;
  const knockedOff = pl.grounded == 1 && side.grounded == 0 ? 1 : 0;
  x = clampX(x);

  const fallVy = vy;
  let y = pl.y + vy * dt;
  const land = landOnPlatforms({ x: x, y: y, vy: vy }, pw, dt, platforms, staticCount);
  y = land.y;
  vy = land.vy;
  let grounded = land.grounded;
  if (knockedOff == 1) {
    grounded = 0;
  }
  let anim = grounded ? 0 : 1;
  if (grounded) {
    airJump = 0;
    jumpBoostMs = 0;
    if (land.carryVx != 0) {
      x = x + land.carryVx * dt;
      if (stillOnMovingPlatform(x, y, pw, platforms, staticCount) == 0) {
        grounded = 0;
        anim = 1;
      }
    }
    x = clampX(x);
    if (pl.grounded == 0) {
      if (fallVy > 0.12) {
        events.push(soundEvent("wall"));
      }
    }
  }

  let jumpHold = wantJump ? 1 : 0;

  let animTick = pl.animTick + dt;
  if (vx == 0) {
    animTick = pl.animTick;
  }

  let cd = fireCd;
  if (cd > 0) {
    cd = cd - dt;
  }
  if (inp.shoot) {
    if (cd <= 0) {
      if (spawnBullet(bullets, x + face * 10, y - 4, face, owner)) {
        cd = 220;
        events.push(soundEvent("blip"));
      }
    }
  }

  return {
    pl: {
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      face: face,
      grounded: grounded,
      anim: anim,
      animTick: animTick,
      jumpHold: jumpHold,
      airJump: airJump,
      jumpBoostMs: jumpBoostMs,
      superMs: superMs,
      done: pl.done,
      finishMs: pl.finishMs,
      finishPulseMs: pl.finishPulseMs,
      celebrateBursts: pl.celebrateBursts
    },
    fireCd: cd,
    events: events
  };
}

function updateEnemies(enemies, dt) {
  let i = 0;
  while (i < MAX_ENEMIES) {
    const e = enemies[i];
    if (e.alive == 1) {
      let x = e.x + e.dir * dt * 0.08;
      let dir = e.dir;
      if (x < e.min) {
        x = e.min;
        dir = 1;
      }
      if (x > e.max) {
        x = e.max;
        dir = -1;
      }
      let tick = e.tick + dt;
      let anim = Math.floor(tick / 110) % ENEMY_WALK_FRAMES;
      let row = 3;
      if (dir < 0) {
        row = 1;
      }
      enemies[i] = {
        x: x,
        y: e.y,
        dir: dir,
        min: e.min,
        max: e.max,
        alive: 1,
        tick: tick,
        anim: anim,
        row: row
      };
    }
    i = i + 1;
  }
}

function bulletHitsEnemy(bx, by, ex, ey) {
  const dx = bx - ex;
  const dy = by - ey;
  if (dx < -16) {
    return false;
  }
  if (dx > 16) {
    return false;
  }
  if (dy < -14) {
    return false;
  }
  if (dy > 14) {
    return false;
  }
  return true;
}

function updateBullets(bullets, enemies, dt) {
  const events = [];
  let i = 0;
  while (i < MAX_BULLETS) {
    const b = bullets[i];
    if (b.active == 1) {
      let x = b.x + b.vx * dt;
      let y = b.y;
      let active = 1;
      if (x < 0) {
        active = 0;
      }
      if (x > worldW()) {
        active = 0;
      }
      let e = 0;
      while (e < MAX_ENEMIES) {
        if (enemies[e].alive == 1) {
          if (bulletHitsEnemy(x, y, enemies[e].x, enemies[e].y)) {
            enemies[e].alive = 0;
            active = 0;
            events.push(soundEvent("brick"));
            events.push(rumbleForOwner(b.owner, 70, 14000));
          }
        }
        e = e + 1;
      }
      bullets[i] = { active: active, x: x, y: y, vx: b.vx, owner: b.owner };
    }
    i = i + 1;
  }
  return events;
}

function respawnPlayer(which) {
  if (isSplitPane()) {
    return makePlayerOnFloor(localStartX(), localStartFace());
  }
  if (which == 1) {
    return makePlayerOnFloor(P1_START_X, 1);
  }
  return makePlayerOnFloor(P2_START_X, -1);
}

function computeCamera(p1, p2, dual) {
  let lead = WORLD_H;
  if (p1.done == 0) {
    if (p1.y < lead) {
      lead = p1.y;
    }
  }
  if (dual) {
    if (p2.done == 0) {
      if (p2.y < lead) {
        lead = p2.y;
      }
    }
  }
  if (lead >= WORLD_H) {
    lead = goalFeetY();
  }
  let cam = lead - 120;
  if (cam < 0) {
    cam = 0;
  }
  const maxCam = WORLD_H - VIEW_H;
  if (cam > maxCam) {
    cam = maxCam;
  }
  return cam;
}

function placePlayerEntity(entities, id, superId, pl, cam, moving) {
  const sheet = sheetFrameForPlayer(pl, moving);
  const superOn = pl.superMs > 0 ? 1 : 0;
  if (superOn == 1) {
    entities[id] = { x: -40, y: -40, visible: 0, p0: 0, p1: 0, p2: 0 };
    entities[superId] = {
      x: pl.x,
      y: pl.y - cam,
      p0: sheet.p0,
      p1: sheet.p1,
      p2: sheet.p2,
      visible: 1
    };
  } else {
    entities[superId] = { x: -40, y: -40, visible: 0, p0: 0, p1: 0, p2: 0 };
    entities[id] = {
      x: pl.x,
      y: pl.y - cam,
      p0: sheet.p0,
      p1: sheet.p1,
      p2: sheet.p2,
      visible: 1
    };
  }
}

function placeEntities(s, cam, slots) {
  const fruitDefs = buildFruitDefs();
  const diamondDefs = buildDiamondDefs();
  const entities = {};
  const p1Moving = finishPlayerMoving(s.p1) == 1 ? 1 : (s.p1.vx != 0 ? 1 : 0);
  if (slots == 2) {
    placePlayerEntity(entities, "p1", "p1s", s.p1, cam, p1Moving);
    const p2Moving = finishPlayerMoving(s.p2) == 1 ? 1 : (s.p2.vx != 0 ? 1 : 0);
    placePlayerEntity(entities, "p2", "p2s", s.p2, cam, p2Moving);
  } else if (isSplitPane()) {
    entities.p1 = hiddenEntity();
    entities.p2 = hiddenEntity();
    entities.p1s = hiddenEntity();
    entities.p2s = hiddenEntity();
    placePlayerEntity(
      entities,
      localPlayerEntityId(),
      localSuperEntityId(),
      s.p1,
      cam,
      p1Moving
    );
  } else {
    placePlayerEntity(entities, "p1", "p1s", s.p1, cam, p1Moving);
    entities.p2 = hiddenEntity();
    entities.p2s = hiddenEntity();
  }
  let e = 0;
  while (e < MAX_ENEMIES) {
    const en = s.enemies[e];
    if (en.alive == 1) {
      entities["e" + e] = {
        x: en.x,
        y: en.y - cam,
        p0: en.anim,
        p1: en.row,
        visible: 1
      };
    } else {
      entities["e" + e] = { x: -40, y: -40, visible: 0, p0: 0 };
    }
    e = e + 1;
  }
  let f = 0;
  while (f < MAX_FRUITS) {
    if (s.fruits[f].taken == 0) {
      const fd = fruitDefs[f];
      entities["f" + f] = { x: fd.x, y: fd.y - cam, visible: 1 };
    } else {
      entities["f" + f] = { x: -40, y: -40, visible: 0 };
    }
    f = f + 1;
  }
  let d = 0;
  while (d < MAX_DIAMONDS) {
    if (s.diamonds[d].taken == 0) {
      const dd = diamondDefs[d];
      entities["d" + d] = { x: dd.x, y: dd.y - cam, visible: 1, p0: 0 };
    } else {
      entities["d" + d] = { x: -40, y: -40, visible: 0, p0: 0 };
    }
    d = d + 1;
  }
  let b = 0;
  while (b < MAX_BULLETS) {
    const bl = s.bullets[b];
    if (bl.active == 1) {
      entities["b" + b] = { x: bl.x, y: bl.y - cam, visible: 1 };
    } else {
      entities["b" + b] = { x: -40, y: -40, visible: 0 };
    }
    b = b + 1;
  }
  let mpi = 0;
  while (mpi < MAX_MOVING_PLATFORMS) {
    const mp = s.movingPlatforms[mpi];
    if (mp) {
      placeMovingPlatformEntities(entities, mpi, mp, cam);
    } else {
      hideMovingPlatformEntities(entities, mpi);
    }
    mpi = mpi + 1;
  }
  return entities;
}

function pushEvents(dest, src) {
  let i = 0;
  while (i < src.length) {
    dest.push(src[i]);
    i = i + 1;
  }
}

function tickGoalWalk(pl, dt) {
  const gp = goalPlatform();
  const minX = gp.x + 18;
  const maxX = gp.x + gp.w - 18;
  let x = pl.x;
  let face = pl.face;
  if (face == 0) {
    face = 1;
  }
  const speed = MOVE * 0.9;
  x = x + face * speed * dt;
  if (x < minX) {
    x = minX;
    face = 1;
  }
  if (x > maxX) {
    x = maxX;
    face = -1;
  }
  return { x: x, face: face };
}

function finishPlayerMoving(pl) {
  if (pl.done == 0) {
    return 0;
  }
  if (pl.finishMs < FINISH_PHASE_DONE) {
    return 1;
  }
  return 0;
}

function playerVictoryReady(pl) {
  return pl.done == 1 && pl.finishMs >= FINISH_PHASE_DONE;
}

function showVictoryBanner(s) {
  if (s.playerSlots == 1) {
    return playerVictoryReady(s.p1);
  }
  if (s.p1.done == 0 || s.p2.done == 0) {
    return false;
  }
  return playerVictoryReady(s.p1) && playerVictoryReady(s.p2);
}

function wantsRestart(props, dual) {
  const inp0 = readPlayer(props, 0);
  if (inp0.action || inp0.shoot) {
    return true;
  }
  if (dual) {
    const inp1 = readPlayer(props, 1);
    if (inp1.action || inp1.shoot) {
      return true;
    }
  }
  return false;
}

function checkFinish(pl, slot, events) {
  if (pl.done == 1) {
    return pl;
  }
  if (pl.y <= goalTriggerY()) {
    const feetY = goalFeetY();
    const cx = celebrateXFor(slot);
    const next = {
      x: cx,
      y: feetY,
      vx: 0,
      vy: 0,
      face: slot == 2 ? -1 : 1,
      grounded: 1,
      anim: 0,
      animTick: pl.animTick,
      jumpHold: 0,
      airJump: 0,
      jumpBoostMs: 0,
      superMs: pl.superMs,
      done: 1,
      finishMs: 0,
      finishPulseMs: 0,
      celebrateBursts: 0
    };
    events.push(soundEvent("celebrate"));
    events.push(rumbleForOwner(slot, 220, 32000));
    spawnFinishParticles(events, cx, feetY);
    return next;
  }
  return pl;
}

function tickFinishPlayer(pl, dt, events) {
  if (pl.done != 1) {
    return pl;
  }
  const finishMs = pl.finishMs + dt;
  let finishPulseMs = pl.finishPulseMs;
  let bursts = pl.celebrateBursts;

  if (finishMs <= FINISH_PARTICLE_MS) {
    finishPulseMs = finishPulseMs + dt;
    if (finishPulseMs >= CELEBRATE_INTERVAL) {
      finishPulseMs = 0;
      bursts = bursts + 1;
      spawnCelebratePulse(events, pl, bursts);
    }
  } else {
    finishPulseMs = 0;
  }

  const feetY = goalFeetY();
  let x = pl.x;
  let face = pl.face;
  let y = feetY;
  const animTick = pl.animTick + dt;

  if (finishMs < FINISH_CELEBRATE_MS) {
    y = feetY - celebrateYOffset(animTick);
  } else if (finishMs < FINISH_PHASE_DONE) {
    const walk = tickGoalWalk(pl, dt);
    x = walk.x;
    face = walk.face;
    y = feetY;
  }

  return {
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    face: face,
    grounded: 1,
    anim: 0,
    animTick: animTick,
    jumpHold: 0,
    airJump: 0,
    jumpBoostMs: 0,
    superMs: pl.superMs,
    done: 1,
    finishMs: finishMs,
    finishPulseMs: finishPulseMs,
    celebrateBursts: bursts
  };
}

function hud(props) {
  const s = props.state;
  const victory = showVictoryBanner(s);
  const localSlot = localPlayerSlot();
  let msg = "Ylos 2! Kerää timantteja = supervoima. LPC-hahmot.";
  if (victory == 0) {
    if (isSplitPane()) {
      if (paneIndex == 0) {
        msg = "Vasen — tyttö (P1). Pääse maaliin!";
      } else {
        msg = "Oikea — poika (P2). Pääse maaliin!";
      }
    } else if (s.playerSlots == 2) {
      msg = msg + " Ensimmäinen maaliin juhlii — toinen jatkaa!";
    } else {
      msg = msg + " Pääse maaliin!";
    }
    if (s.p1.done == 1) {
      if (isSplitPane()) {
        msg = localSlot == 2 ? "P2 MAALISSA!" : "P1 MAALISSA!";
      } else {
        msg = "P1 MAALISSA!";
      }
    }
    if (s.playerSlots == 2) {
      if (s.p2.done == 1) {
        if (s.p1.done == 1) {
          msg = "MOLEMMAT MAALISSA!";
        } else {
          msg = "P2 MAALISSA!";
        }
      }
    }
  }
  let scoreLine = "Hedelmät: " + s.score1;
  if (s.playerSlots == 2) {
    scoreLine = "Hedelmät P1:" + s.score1 + "  P2:" + s.score2;
  }
  let superLine = "";
  if (s.p1.superMs > 0) {
    if (isSplitPane()) {
      superLine = localSlot == 2 ? "P2 SUPER!" : "P1 SUPER!";
    } else {
      superLine = "P1 SUPER!";
    }
  }
  if (s.playerSlots == 2) {
    if (s.p2.superMs > 0) {
      if (superLine.length > 0) {
        superLine = superLine + "  ";
      }
      superLine = superLine + "P2 SUPER!";
    }
  }
  let victoryLine = "";
  if (victory == 1) {
    victoryLine = "Voitto!";
    msg = "Paina Space — pelaa uudelleen";
  }
  return (
    <View flexDirection="column" padding="4px" background="#0b1020cc">
      <Label text={victoryLine} color="#ffe866" fontSize="18px" />
      <Label text={msg} color="#e8f0ff" fontSize="11px" />
      <Label text={scoreLine} color="#ffd080" fontSize="10px" />
      <Label text={superLine} color="#80e8ff" fontSize="10px" />
    </View>
  );
}

function update(props) {
  const s = props.state;
  const dt = props.dt;
  const slots = playerSlots();
  const events = [];
  const staticPlatforms = buildPlatforms();
  const fruitDefs = buildFruitDefs();
  const diamondDefs = buildDiamondDefs();
  const dual = slots == 2;
  const owner = localPlayerSlot();

  const bullets = [];
  let bi = 0;
  while (bi < MAX_BULLETS) {
    bullets.push(s.bullets[bi]);
    bi = bi + 1;
  }

  let p1 = s.p1;
  let p2 = s.p2;
  let fireCd1 = s.fireCd1;
  let fireCd2 = s.fireCd2;

  if (p1.done == 1) {
    p1 = tickFinishPlayer(p1, dt, events);
  }
  if (dual) {
    if (p2.done == 1) {
      p2 = tickFinishPlayer(p2, dt, events);
    }
  }

  if (showVictoryBanner({ playerSlots: slots, p1: p1, p2: p2 })) {
    if (wantsRestart(props, dual)) {
      const fresh = initState();
      fresh.diamonds = makeRestartDiamonds(s.diamonds);
      fresh.entities = placeEntities(
        {
          p1: fresh.p1,
          p2: fresh.p2,
          enemies: fresh.enemies,
          fruits: fresh.fruits,
          diamonds: fresh.diamonds,
          bullets: fresh.bullets,
          movingPlatforms: fresh.movingPlatforms
        },
        fresh.cameraY,
        slots
      );
      fresh.events = [soundEvent("blip")];
      return fresh;
    }
    const cameraY = computeCamera(p1, p2, dual);
    const entities = placeEntities(
      {
        p1: p1,
        p2: p2,
        enemies: s.enemies,
        fruits: s.fruits,
        diamonds: s.diamonds,
        bullets: s.bullets,
        movingPlatforms: s.movingPlatforms
      },
      cameraY,
      slots
    );
    return {
      showNet: 0,
      playerSlots: slots,
      cameraY: cameraY,
      entities: entities,
      p1: p1,
      p2: p2,
      enemies: s.enemies,
      fruits: s.fruits,
      diamonds: s.diamonds,
      bullets: s.bullets,
      movingPlatforms: s.movingPlatforms,
      score1: s.score1,
      score2: s.score2,
      fireCd1: fireCd1,
      fireCd2: fireCd2,
      events: events
    };
  }

  const movingPlatforms = copyMovingPlatforms(s);
  updateMovingPlatforms(movingPlatforms, dt, staticPlatforms);
  const platforms = mergePlatforms(staticPlatforms, movingPlatforms);

  if (p1.done == 0) {
    const inp1 = readPlayer(props, 0);
    const u1 = updatePlayer(p1, inp1, dt, bullets, owner, fireCd1, platforms);
    p1 = u1.pl;
    fireCd1 = u1.fireCd;
    pushEvents(events, u1.events);
  }

  if (dual) {
    if (p2.done == 0) {
      const inp2 = readPlayer(props, 1);
      const u2 = updatePlayer(p2, inp2, dt, bullets, 2, fireCd2, platforms);
      p2 = u2.pl;
      fireCd2 = u2.fireCd;
      pushEvents(events, u2.events);
    }
  }

  const enemies = [];
  let ei = 0;
  while (ei < MAX_ENEMIES) {
    enemies.push(s.enemies[ei]);
    ei = ei + 1;
  }
  updateEnemies(enemies, dt);
  const bulletEvents = updateBullets(bullets, enemies, dt);
  pushEvents(events, bulletEvents);

  let score1 = s.score1;
  let score2 = s.score2;
  const fruits = [];
  let fi = 0;
  while (fi < MAX_FRUITS) {
    fruits.push(s.fruits[fi]);
    fi = fi + 1;
  }
  const diamonds = [];
  let di = 0;
  while (di < MAX_DIAMONDS) {
    diamonds.push(s.diamonds[di]);
    di = di + 1;
  }

  if (p1.done == 0) {
    p1 = applyEnemyHits(p1, owner, enemies, events);
  }
  if (dual) {
    if (p2.done == 0) {
      p2 = applyEnemyHits(p2, 2, enemies, events);
    }
  }

  let fj = 0;
  while (fj < MAX_FRUITS) {
    if (fruits[fj].taken == 0) {
      const fd = fruitDefs[fj];
      if (p1.done == 0) {
        if (hitPickup(p1.x, p1.y, fd.x, fd.y)) {
          fruits[fj] = { taken: 1 };
          score1 = score1 + 1;
          events.push(soundEvent("blip"));
          events.push(soundEvent("win"));
          events.push(particleEvent("fruit", fd.x, fd.y, 22));
          events.push(rumbleForOwner(owner, 50, 10000));
        }
      }
      if (dual) {
        if (p2.done == 0) {
          if (hitPickup(p2.x, p2.y, fd.x, fd.y)) {
            fruits[fj] = { taken: 1 };
            score2 = score2 + 1;
            events.push(soundEvent("blip"));
            events.push(soundEvent("win"));
            events.push(particleEvent("fruit", fd.x, fd.y, 22));
            events.push(rumbleForOwner(2, 50, 10000));
          }
        }
      }
    }
    fj = fj + 1;
  }

  let dk = 0;
  while (dk < MAX_DIAMONDS) {
    if (diamonds[dk].taken == 0) {
      const dd = diamondDefs[dk];
      if (p1.done == 0) {
        if (hitPickup(p1.x, p1.y, dd.x, dd.y)) {
          diamonds[dk] = { taken: 1 };
          p1 = {
            x: p1.x,
            y: p1.y,
            vx: p1.vx,
            vy: p1.vy,
            face: p1.face,
            grounded: p1.grounded,
            anim: p1.anim,
            animTick: p1.animTick,
            jumpHold: p1.jumpHold,
            airJump: p1.airJump,
            jumpBoostMs: p1.jumpBoostMs,
            superMs: SUPER_MS,
            done: p1.done,
            finishMs: p1.finishMs,
            finishPulseMs: p1.finishPulseMs,
            celebrateBursts: p1.celebrateBursts
          };
          events.push(soundEvent("win"));
          events.push(particleEvent("sparkle", dd.x, dd.y, 28));
          events.push(rumbleForOwner(owner, 160, 28000));
        }
      }
      if (dual) {
        if (p2.done == 0) {
          if (hitPickup(p2.x, p2.y, dd.x, dd.y)) {
            diamonds[dk] = { taken: 1 };
            p2 = {
              x: p2.x,
              y: p2.y,
              vx: p2.vx,
              vy: p2.vy,
              face: p2.face,
              grounded: p2.grounded,
              anim: p2.anim,
              animTick: p2.animTick,
              jumpHold: p2.jumpHold,
              airJump: p2.airJump,
              jumpBoostMs: p2.jumpBoostMs,
              superMs: SUPER_MS,
              done: p2.done,
              finishMs: p2.finishMs,
              finishPulseMs: p2.finishPulseMs,
              celebrateBursts: p2.celebrateBursts
            };
            events.push(soundEvent("win"));
            events.push(particleEvent("sparkle", dd.x, dd.y, 28));
            events.push(rumbleForOwner(2, 160, 28000));
          }
        }
      }
    }
    dk = dk + 1;
  }

  if (p1.done == 0) {
    p1 = checkFinish(p1, owner, events);
  }
  if (dual) {
    if (p2.done == 0) {
      p2 = checkFinish(p2, 2, events);
    }
  }

  const cameraY = computeCamera(p1, p2, dual);
  const entities = placeEntities(
    {
      p1: p1,
      p2: p2,
      enemies: enemies,
      fruits: fruits,
      diamonds: diamonds,
      bullets: bullets,
      movingPlatforms: movingPlatforms
    },
    cameraY,
    slots
  );

  return {
    showNet: 0,
    playerSlots: slots,
    cameraY: cameraY,
    entities: entities,
    p1: p1,
    p2: p2,
    enemies: enemies,
    fruits: fruits,
    diamonds: diamonds,
    bullets: bullets,
    movingPlatforms: movingPlatforms,
    score1: score1,
    score2: score2,
    fireCd1: fireCd1,
    fireCd2: fireCd2,
    events: events
  };
}
