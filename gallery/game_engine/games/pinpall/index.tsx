/// <reference path="../../scripting/game.d.ts" />
//
// Flipperitorni — vertical pinball sketch for Ranger Engine.
//
// Controls:
//   Left / A   = left flippers
//   Right / D  = right flippers
//   Space / Up = hold to pull plunger, release to launch
//
// The table is taller than the viewport. The camera follows the ball upward.
// Two flipper pairs make it possible to keep climbing toward the summit gate.

import { soundEvent, particleEvent, rumbleEvent } from "../../scripting/game_helpers";

const BASE_W = 480;
const WORLD_H = 920;
const VIEW_H = 270;

const BALL_R = 7;
const GRAVITY = 0.00034;
const MAX_SPEED = 0.68;
const WALL_BOUNCE = 0.74;
const BUMPER_SPEED = 0.27;
const FLIPPER_POWER = 0.26;
const START_X = 443;
const START_Y = 850;
const LAUNCH_GRACE_MS = 360;
const START_LIVES = 3;
const GOAL_Y = 55;
const MAX_BUMPERS = 10;
const MAX_FLIPPERS = 4;
const PHYSICS_STEPS = 4;
const MOTION_DAMP = 0.9985;
const PEG_BOUNCE = 0.006;
const FLIPPER_REST_ANGLE = Math.PI / 6;
const FLIPPER_PRESSED_ANGLE = FLIPPER_REST_ANGLE - (40 * Math.PI / 180);
const FLIPPER_MAIN_REST_LEN = 80;
const FLIPPER_MAIN_PRESSED_LEN = 124;
const FLIPPER_UPPER_REST_LEN = 70;
const FLIPPER_UPPER_PRESSED_LEN = 108;
const FLIPPER_MAIN_VIS_LEN = 76;
const FLIPPER_UPPER_VIS_LEN = 68;
const FLIPPER_TIP_RADIUS_REST = 3;
const FLIPPER_TIP_RADIUS_PRESSED = 11;
const FLIPPER_SWING_MS = 210;
const PLUNGER_X = 443;
const PLUNGER_Y_REST = 902;
const PLUNGER_PULL_MAX = 58;
const PLUNGER_PULL_RATE = 0.00145;
const SPIN_DECAY = 0.9991;
const SPIN_CURVE = 0.00042;
const SPIN_COLLIDE_GAIN = 0.032;

const LEFT_FLIPPER_FRAMES = [
  [
    "....................",
    "....................",
    "..XX................",
    "...XXXX.............",
    ".....XXXXXX.........",
    "........XXXXXXX.....",
    "...........XXXXXXX..",
    "..............XXXXX.",
    ".................XX."
  ],
  [
    ".................XX.",
    "..............XXXXX.",
    "...........XXXXXXX..",
    "........XXXXXXX.....",
    ".....XXXXXXX........",
    "..XXXXXXX...........",
    ".XXXXX..............",
    ".XX.................",
    "...................."
  ]
];

const RIGHT_FLIPPER_FRAMES = [
  [
    "....................",
    "....................",
    "................XX..",
    ".............XXXX...",
    ".........XXXXXX.....",
    ".....XXXXXXX........",
    "..XXXXXXX...........",
    ".XXXXX..............",
    ".XX................."
  ],
  [
    ".XX.................",
    ".XXXXX..............",
    "..XXXXXXX...........",
    ".....XXXXXXX........",
    "........XXXXXXX.....",
    "...........XXXXXXX..",
    "..............XXXXX.",
    ".................XX.",
    "...................."
  ]
];

const BUMPER_DEFS = [
  { x: 112, y: 735, value: 100 },
  { x: 250, y: 690, value: 150 },
  { x: 350, y: 628, value: 100 },
  { x: 170, y: 590, value: 200 },
  { x: 305, y: 485, value: 250 },
  { x: 92, y: 430, value: 150 },
  { x: 225, y: 365, value: 300 },
  { x: 365, y: 310, value: 200 },
  { x: 160, y: 220, value: 350 },
  { x: 300, y: 145, value: 500 }
];

const PEG_DEFS = [
  { x: 55, y: 670, r: 5 },
  { x: 205, y: 760, r: 5 },
  { x: 300, y: 760, r: 5 },
  { x: 420, y: 600, r: 5 },
  { x: 125, y: 500, r: 5 },
  { x: 255, y: 545, r: 5 },
  { x: 405, y: 455, r: 5 },
  { x: 55, y: 345, r: 5 },
  { x: 285, y: 285, r: 5 },
  { x: 420, y: 235, r: 5 },
  { x: 90, y: 155, r: 5 },
  { x: 235, y: 105, r: 5 }
];

const FLIPPER_DEFS = [
  // Main pair: pivots sit at the inner tips of the lower ramps.
  { side: -1, pivotX: 146, pivotY: 828 },
  { side: 1, pivotX: 334, pivotY: 828 },
  // Upper pair: also attached to their ramps instead of floating in the middle.
  { side: -1, pivotX: 92, pivotY: 535 },
  { side: 1, pivotX: 388, pivotY: 535 }
];

const RAILS = [
  { x1: 18, y1: 770, x2: 146, y2: 828 },
  // Stop before the launcher lane (lane starts at x=410).
  // Ramp from right flipper — stops short of the launcher chute mouth.
  { x1: 334, y1: 828, x2: 376, y2: 818 },
  // Launcher shaft left wall — tall barrier so the ball cannot roll back into the lane.
  { x1: 410, y1: 628, x2: 410, y2: 910 },
  // Lip above the lane: deflect playfield balls away from the chute mouth.
  { x1: 410, y1: 628, x2: 468, y2: 608 },
  // Lane mouth skim — high at the actual exit.
  { x1: 458, y1: 598, x2: 368, y2: 568 },
  { x1: 18, y1: 485, x2: 92, y2: 535 },
  { x1: 388, y1: 535, x2: 404, y2: 524 },
  { x1: 18, y1: 285, x2: 95, y2: 330 },
  { x1: 385, y1: 330, x2: 462, y2: 285 },
  { x1: 45, y1: 90, x2: 165, y2: 68 },
  { x1: 315, y1: 68, x2: 435, y2: 90 }
];

function worldW() {
  return bgWidth;
}

function scaleX(v) {
  return (v * worldW()) / BASE_W;
}

function staticLevelHeight() {
  return WORLD_H;
}

function clamp(v, lo, hi) {
  if (v < lo) {
    return lo;
  }
  if (v > hi) {
    return hi;
  }
  return v;
}

function length2(x, y) {
  return Math.sqrt(x * x + y * y);
}

function drawGradient() {
  let y = 0;
  while (y < bgHeight) {
    const t = y / bgHeight;
    const r = 10 + t * 16;
    const g = 18 + t * 20;
    const b = 40 + t * 36;
    bgFillRect(0, y, bgWidth, 5, r, g, b);
    y = y + 5;
  }
}

function drawRail(x1, y1, x2, y2) {
  const steps = 32;
  let i = 0;
  while (i <= steps) {
    const t = i / steps;
    const x = scaleX(x1 + (x2 - x1) * t);
    const y = y1 + (y2 - y1) * t;
    bgFillCircle(x, y, 3, 88, 220, 255);
    i = i + 1;
  }
}

function createStaticBgDisabledForEngineDebug() {
  drawGradient();

  bgFillRect(4, 0, 8, WORLD_H, 30, 105, 150);
  bgFillRect(bgWidth - 12, 0, 8, WORLD_H, 30, 105, 150);
  bgFillRect(12, 0, 4, WORLD_H, 100, 235, 255);
  bgFillRect(bgWidth - 16, 0, 4, WORLD_H, 100, 235, 255);

  let ri = 0;
  while (ri < RAILS.length) {
    const rail = RAILS[ri];
    drawRail(rail.x1, rail.y1, rail.x2, rail.y2);
    ri = ri + 1;
  }

  let pi = 0;
  while (pi < PEG_DEFS.length) {
    const peg = PEG_DEFS[pi];
    bgFillCircle(scaleX(peg.x), peg.y, peg.r + 2, 30, 90, 130);
    bgFillCircle(scaleX(peg.x), peg.y, peg.r, 180, 245, 255);
    pi = pi + 1;
  }

  let bi = 0;
  while (bi < BUMPER_DEFS.length) {
    const b = BUMPER_DEFS[bi];
    bgFillCircle(scaleX(b.x), b.y, 21, 22, 62, 100);
    bgFillCircle(scaleX(b.x), b.y, 18, 50, 130, 180);
    bi = bi + 1;
  }

  // Launcher lane.
  bgFillRect(scaleX(410), 690, scaleX(54), 5, 70, 200, 235);
  bgFillRect(scaleX(414), 700, 3, 190, 80, 190, 220);
  bgFillRect(scaleX(455), 700, 3, 190, 80, 190, 220);

  // Summit gate.
  bgFillRect(scaleX(168), 34, scaleX(144), 10, 255, 200, 65);
  bgFillRect(scaleX(184), 44, 8, 34, 255, 120, 70);
  bgFillRect(scaleX(288), 44, 8, 34, 255, 120, 70);
  bgFillCircle(scaleX(240), 51, 12, 255, 235, 120);

  // Decorative height markers.
  let markerY = 150;
  let marker = 1;
  while (markerY < WORLD_H) {
    bgFillRect(scaleX(20), markerY, scaleX(18), 2, 80, 120, 170);
    bgFillRect(scaleX(442), markerY, scaleX(18), 2, 80, 120, 170);
    if (marker % 2 == 0) {
      bgFillCircle(scaleX(28), markerY - 8, 2, 255, 220, 120);
      bgFillCircle(scaleX(452), markerY - 8, 2, 255, 220, 120);
    }
    marker = marker + 1;
    markerY = markerY + 100;
  }
}

function flipperSprite(id, frames) {
  return {
    id: id,
    kind: "bitmap",
    px: 4,
    br: 255,
    bg: 160,
    bb: 70,
    er: 255,
    eg: 235,
    eb: 170,
    frames: frames
  };
}



function sprites() {
  const list = [];
  list.push({ id: "ball", kind: "circle", rad: BALL_R, r: 248, g: 248, b: 255 });
  list.push({ id: "ballGlow", kind: "circle", rad: BALL_R + 3, r: 80, g: 180, b: 255 });
  list.push({ id: "plunger", kind: "box", w: 12, h: 20, r: 235, g: 110, b: 75 });
  list.push(flipperSprite("fl0", LEFT_FLIPPER_FRAMES));
  list.push(flipperSprite("fl1", RIGHT_FLIPPER_FRAMES));
  list.push(flipperSprite("fl2", LEFT_FLIPPER_FRAMES));
  list.push(flipperSprite("fl3", RIGHT_FLIPPER_FRAMES));

  let i = 0;
  while (i < MAX_BUMPERS) {
    list.push({ id: "bum" + i, kind: "circle", rad: 13, r: 255, g: 105, b: 150 });
    list.push({ id: "bumCore" + i, kind: "circle", rad: 6, r: 255, g: 235, b: 110 });
    i = i + 1;
  }
  return list;
}

function makeBallWaiting() {
  return {
    x: scaleX(START_X),
    y: START_Y,
    vx: 0,
    vy: 0,
    spin: 0,
    active: 0
  };
}

function makeBumpers() {
  const out = [];
  let i = 0;
  while (i < MAX_BUMPERS) {
    out.push({ flashMs: 0, cooldownMs: 0 });
    i = i + 1;
  }
  return out;
}

function hiddenEntity() {
  return { x: -50, y: -50, visible: 0, p0: 0 };
}

function flipSwingMs(s, index) {
  if (index == 0) {
    return s.flipSwing0;
  }
  if (index == 1) {
    return s.flipSwing1;
  }
  if (index == 2) {
    return s.flipSwing2;
  }
  return s.flipSwing3;
}

function flipperSwinging(s, index) {
  return flipSwingMs(s, index) > 0;
}

function plungerHeadY(s) {
  if (s.plungerActive == 1) {
    return s.plungerY;
  }
  return PLUNGER_Y_REST + s.plungerPull * PLUNGER_PULL_MAX;
}

function placeEntities(s) {
  const entities = {};
  const cam = s.cameraY;
  const ball = s.ball;

  if (ball.active == 1 || s.waiting == 1 || s.won == 1) {
    entities.ballGlow = {
      x: ball.x,
      y: ball.y - cam,
      visible: 1
    };
    entities.ball = {
      x: ball.x,
      y: ball.y - cam,
      visible: 1
    };
  } else {
    entities.ballGlow = hiddenEntity();
    entities.ball = hiddenEntity();
  }

  if (s.waiting == 1 || s.plungerActive == 1) {
    entities.plunger = {
      x: scaleX(PLUNGER_X),
      y: plungerHeadY(s) - cam,
      visible: 1
    };
  } else {
    entities.plunger = hiddenEntity();
  }

  let fi = 0;
  while (fi < MAX_FLIPPERS) {
    const f = FLIPPER_DEFS[fi];
    const pressed = flipperSwinging(s, fi);
    const seg = flipperSegment(f, pressed);
    const halfVis = scaleX(flipperVisLen(f)) * 0.5;
    entities["fl" + fi] = {
      x: seg.x1 + Math.cos(seg.angle) * halfVis,
      y: (seg.y1 + Math.sin(seg.angle) * halfVis) - cam,
      p0: pressed ? 1 : 0,
      visible: 1
    };
    fi = fi + 1;
  }

  let bi = 0;
  while (bi < MAX_BUMPERS) {
    const def = BUMPER_DEFS[bi];
    const flash = s.bumpers[bi].flashMs > 0;
    entities["bum" + bi] = {
      x: scaleX(def.x),
      y: def.y - cam,
      visible: 1,
      r: flash ? 255 : 255,
      g: flash ? 235 : 105,
      b: flash ? 110 : 150
    };
    entities["bumCore" + bi] = {
      x: scaleX(def.x),
      y: def.y - cam,
      visible: 1
    };
    bi = bi + 1;
  }

  return entities;
}

function initState() {
  const ball = makeBallWaiting();
  const cameraY = WORLD_H - VIEW_H;
  const state = {
    showNet: 0,
    ball: ball,
    bumpers: makeBumpers(),
    cameraY: cameraY,
    score: 0,
    lives: START_LIVES,
    bestHeight: 0,
    waiting: 1,
    won: 0,
    gameOver: 0,
    leftDown: 0,
    rightDown: 0,
    launchHeld: 0,
    launchGraceMs: 0,
    plungerPull: 0,
    plungerY: PLUNGER_Y_REST,
    plungerVy: 0,
    plungerActive: 0,
    flipSwing0: 0,
    flipSwing1: 0,
    flipSwing2: 0,
    flipSwing3: 0,
    flipFired0: 0,
    flipFired1: 0,
    flipFired2: 0,
    flipFired3: 0,
    leftFlipHeld: 0,
    rightFlipHeld: 0,
    flipperHitCd: 0,
    entities: {}
  };
  state.entities = placeEntities(state);
  return state;
}

function readInput(props) {
  let left = props.left;
  let right = props.right;
  let up = props.up;
  let action = props.action;
  const input = props.input;
  if (input) {
    if (input.players[0]) {
      const p = input.players[0];
      left = p.left;
      right = p.right;
      up = p.up;
      action = p.action;
      if (p.b || p.x) {
        action = true;
      }
    }
  }
  return { left: left, right: right, launch: up || action };
}

function copyBall(ball) {
  return {
    x: ball.x,
    y: ball.y,
    vx: ball.vx,
    vy: ball.vy,
    spin: ball.spin,
    active: ball.active
  };
}

function copyBumpers(src, dt) {
  const out = [];
  let i = 0;
  while (i < MAX_BUMPERS) {
    const b = src[i];
    let flashMs = b.flashMs - dt;
    let cooldownMs = b.cooldownMs - dt;
    if (flashMs < 0) {
      flashMs = 0;
    }
    if (cooldownMs < 0) {
      cooldownMs = 0;
    }
    out.push({ flashMs: flashMs, cooldownMs: cooldownMs });
    i = i + 1;
  }
  return out;
}

function clampBallSpeed(ball) {
  const speed = length2(ball.vx, ball.vy);
  if (speed > MAX_SPEED) {
    const k = MAX_SPEED / speed;
    ball.vx = ball.vx * k;
    ball.vy = ball.vy * k;
  }
}

function applyCollisionSpin(ball, nx, ny) {
  const cross = ball.vx * ny - ball.vy * nx;
  ball.spin = clamp(ball.spin + cross * SPIN_COLLIDE_GAIN, -1.5, 1.5);
}

function applyBallSpin(ball, dt) {
  if (ball.spin == 0) {
    return;
  }
  const speed = length2(ball.vx, ball.vy);
  if (speed > 0.02) {
    const nx = ball.vx / speed;
    const ny = ball.vy / speed;
    const px = 0 - ny;
    const py = nx;
    const curve = ball.spin * SPIN_CURVE * dt;
    ball.vx = ball.vx + px * curve;
    ball.vy = ball.vy + py * curve;
  }
  ball.spin = ball.spin * SPIN_DECAY;
  if (ball.spin > -0.004 && ball.spin < 0.004) {
    ball.spin = 0;
  }
}

function collideCircle(ball, cx, cy, radius, bounceSpeed) {
  let dx = ball.x - cx;
  let dy = ball.y - cy;
  let dist = length2(dx, dy);
  const minDist = BALL_R + radius;
  if (dist >= minDist) {
    return false;
  }
  if (dist < 0.001) {
    dx = 0;
    dy = -1;
    dist = 1;
  }
  const nx = dx / dist;
  const ny = dy / dist;
  ball.x = cx + nx * minDist;
  ball.y = cy + ny * minDist;
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot < 0) {
    ball.vx = ball.vx - (1 + WALL_BOUNCE) * dot * nx;
    ball.vy = ball.vy - (1 + WALL_BOUNCE) * dot * ny;
    applyCollisionSpin(ball, nx, ny);
  }
  if (bounceSpeed > 0) {
    ball.vx = ball.vx + nx * bounceSpeed;
    ball.vy = ball.vy + ny * bounceSpeed;
  }
  return true;
}

function collideSegment(ball, x1, y1, x2, y2, thickness, restitution) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = 0;
  if (lenSq > 0.001) {
    t = ((ball.x - x1) * dx + (ball.y - y1) * dy) / lenSq;
  }
  t = clamp(t, 0, 1);
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  let nx = ball.x - px;
  let ny = ball.y - py;
  let dist = length2(nx, ny);
  const minDist = BALL_R + thickness;
  if (dist >= minDist) {
    return { hit: false, t: t, nx: 0, ny: 0 };
  }
  if (dist < 0.001) {
    const segLen = Math.sqrt(lenSq);
    if (segLen > 0.001) {
      nx = 0 - dy / segLen;
      ny = dx / segLen;
    } else {
      nx = 0;
      ny = -1;
    }
    dist = 1;
  } else {
    nx = nx / dist;
    ny = ny / dist;
  }
  ball.x = px + nx * minDist;
  ball.y = py + ny * minDist;
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot < 0) {
    ball.vx = ball.vx - (1 + restitution) * dot * nx;
    ball.vy = ball.vy - (1 + restitution) * dot * ny;
    applyCollisionSpin(ball, nx, ny);
  }
  return { hit: true, t: t, nx: nx, ny: ny };
}

function flipperPhysLen(def, pressed) {
  if (def.pivotY >= 700) {
    if (pressed) {
      return FLIPPER_MAIN_PRESSED_LEN;
    }
    return FLIPPER_MAIN_REST_LEN;
  }
  if (pressed) {
    return FLIPPER_UPPER_PRESSED_LEN;
  }
  return FLIPPER_UPPER_REST_LEN;
}

function flipperVisLen(def) {
  if (def.pivotY >= 700) {
    return FLIPPER_MAIN_VIS_LEN;
  }
  return FLIPPER_UPPER_VIS_LEN;
}

function flipperAngle(def, pressed) {
  if (def.side < 0) {
    if (pressed) {
      return FLIPPER_PRESSED_ANGLE;
    }
    return FLIPPER_REST_ANGLE;
  }
  if (pressed) {
    return Math.PI - FLIPPER_PRESSED_ANGLE;
  }
  return Math.PI - FLIPPER_REST_ANGLE;
}

function flipperSegment(def, pressed) {
  const angle = flipperAngle(def, pressed);
  const x1 = scaleX(def.pivotX);
  const y1 = def.pivotY;
  const len = scaleX(flipperPhysLen(def, pressed));
  const x2 = x1 + Math.cos(angle) * len;
  const y2 = y1 + Math.sin(angle) * len;
  return { x1: x1, y1: y1, x2: x2, y2: y2, angle: angle };
}

function flipperPairGap(pairIndex) {
  const leftSeg = flipperSegment(FLIPPER_DEFS[pairIndex * 2], false);
  const rightSeg = flipperSegment(FLIPPER_DEFS[pairIndex * 2 + 1], false);
  let gapLeft = leftSeg.x2;
  let gapRight = rightSeg.x2;
  if (gapLeft > gapRight) {
    const tmp = gapLeft;
    gapLeft = gapRight;
    gapRight = tmp;
  }
  return {
    left: gapLeft,
    right: gapRight,
    pivotY: FLIPPER_DEFS[pairIndex * 2].pivotY
  };
}

function isInDrainGap(ball, gap) {
  if (ball.y < gap.pivotY) {
    return false;
  }
  const pad = BALL_R + 2;
  return ball.x > gap.left + pad && ball.x < gap.right - pad;
}

function flipperPlayfieldNormal(def, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let nx = 0 - dy;
  let ny = dx;
  const nlen = length2(nx, ny);
  if (nlen > 0.001) {
    nx = nx / nlen;
    ny = ny / nlen;
  }
  if (ny > 0) {
    nx = 0 - nx;
    ny = 0 - ny;
  }
  return { nx: nx, ny: ny };
}

function ballOnFlipperFace(ball, norm, x1, y1, x2, y2) {
  const midX = (x1 + x2) * 0.5;
  const midY = (y1 + y2) * 0.5;
  const side = (ball.x - midX) * norm.nx + (ball.y - midY) * norm.ny;
  return side >= 0 - BALL_R;
}

function applyFlipperImpulse(ball, def, hit, seg) {
  let tipPower = 1.0;
  if (hit.hit) {
    tipPower = 0.7 + hit.t * 0.55;
  }
  const angle = flipperAngle(def, true);
  const impulse = FLIPPER_POWER * tipPower;
  ball.vx = ball.vx + Math.cos(angle) * impulse;
  ball.vy = ball.vy + Math.sin(angle) * impulse;
  ball.spin = ball.spin + def.side * tipPower * 0.14;
}

function flipperSegmentHit(ball, x1, y1, x2, y2, pressed) {
  const thickness = pressed ? 7 : 3;
  const restitution = pressed ? 0.82 : 0.28;
  const hit = collideSegment(ball, x1, y1, x2, y2, thickness, restitution);
  let tipRad = FLIPPER_TIP_RADIUS_REST;
  if (pressed) {
    tipRad = FLIPPER_TIP_RADIUS_PRESSED;
  }
  const hitTip = collideCircle(ball, x2, y2, tipRad, 0);
  return { any: hit.hit || hitTip, hit: hit };
}

function collideFlipper(ball, def, pressed, gap, alreadyFired) {
  if (pressed) {
    let anyHit = false;
    let fired = alreadyFired;
    const segP = flipperSegment(def, true);
    const hitP = flipperSegmentHit(ball, segP.x1, segP.y1, segP.x2, segP.y2, true);
    if (hitP.any) {
      anyHit = true;
      if (fired == 0) {
        applyFlipperImpulse(ball, def, hitP.hit, segP);
        fired = 1;
      }
    }
    if (fired == 0) {
      const segR = flipperSegment(def, false);
      const hitR = flipperSegmentHit(ball, segR.x1, segR.y1, segR.x2, segR.y2, true);
      if (hitR.any) {
        anyHit = true;
        applyFlipperImpulse(ball, def, hitR.hit, segR);
        fired = 1;
      }
    }
    return { hit: anyHit, fired: fired };
  }

  const seg = flipperSegment(def, false);
  const x1 = seg.x1;
  const y1 = seg.y1;
  const x2 = seg.x2;
  const y2 = seg.y2;

  if (isInDrainGap(ball, gap)) {
    return { hit: false, fired: alreadyFired };
  }
  const norm = flipperPlayfieldNormal(def, x1, y1, x2, y2);
  if (!ballOnFlipperFace(ball, norm, x1, y1, x2, y2)) {
    return { hit: false, fired: alreadyFired };
  }

  const hitR = flipperSegmentHit(ball, x1, y1, x2, y2, false);
  if (hitR.any && ball.vy > 0) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const segLen = length2(dx, dy);
    if (segLen > 0.001) {
      const tx = dx / segLen;
      const ty = dy / segLen;
      const slide = 0.00055;
      ball.vx = ball.vx + tx * slide;
      ball.vy = ball.vy + ty * slide;
    }
  }
  return { hit: hitR.any, fired: alreadyFired };
}

function flipperSwingingByIndex(index, swing0, swing1, swing2, swing3) {
  if (index == 0) {
    return swing0 > 0;
  }
  if (index == 1) {
    return swing1 > 0;
  }
  if (index == 2) {
    return swing2 > 0;
  }
  return swing3 > 0;
}

function collideFlippers(ball, swing0, swing1, swing2, swing3, fired0, fired1, fired2, fired3) {
  const lowerGap = flipperPairGap(0);
  const upperGap = flipperPairGap(1);
  let hit = false;
  let fi = 0;
  while (fi < MAX_FLIPPERS) {
    const pressed = flipperSwingingByIndex(fi, swing0, swing1, swing2, swing3);
    const gap = fi < 2 ? lowerGap : upperGap;
    let alreadyFired = 0;
    if (fi == 0) {
      alreadyFired = fired0;
    }
    if (fi == 1) {
      alreadyFired = fired1;
    }
    if (fi == 2) {
      alreadyFired = fired2;
    }
    if (fi == 3) {
      alreadyFired = fired3;
    }
    const res = collideFlipper(ball, FLIPPER_DEFS[fi], pressed, gap, alreadyFired);
    if (res.hit) {
      hit = true;
    }
    if (fi == 0) {
      fired0 = res.fired;
    }
    if (fi == 1) {
      fired1 = res.fired;
    }
    if (fi == 2) {
      fired2 = res.fired;
    }
    if (fi == 3) {
      fired3 = res.fired;
    }
    fi = fi + 1;
  }
  return { hit: hit, fired0: fired0, fired1: fired1, fired2: fired2, fired3: fired3 };
}

function collideWorldWalls(ball) {
  const left = scaleX(16) + BALL_R;
  const right = worldW() - scaleX(16) - BALL_R;
  if (ball.x < left) {
    ball.x = left;
    if (ball.vx < 0) {
      ball.vx = 0 - ball.vx * WALL_BOUNCE;
    }
  }
  if (ball.x > right) {
    ball.x = right;
    if (ball.vx > 0) {
      ball.vx = 0 - ball.vx * WALL_BOUNCE;
    }
  }
}

function applyLauncherExit(ball, launchGraceMs) {
  if (launchGraceMs <= 0) {
    return;
  }
  if (ball.y < 720 && ball.x > scaleX(400)) {
    ball.vx = ball.vx - 0.0012;
    if (ball.vy > -0.42) {
      ball.vy = ball.vy - 0.0008;
    }
  }
}

function repelLauncherReentry(ball) {
  if (ball.x > scaleX(405) && ball.x < scaleX(470) && ball.y > 615 && ball.y < 865) {
    if (ball.vx > 0.02) {
      ball.vx = ball.vx - 0.0018;
    }
    if (ball.y > 780 && ball.vy > 0) {
      ball.vx = ball.vx - 0.0009;
    }
  }
}

function collideRails(ball, launchGraceMs) {
  let i = 0;
  while (i < RAILS.length) {
    const r = RAILS[i];
    // During launch, ignore flipper ramp + shaft walls + mouth guides.
    if (launchGraceMs > 0 && (i == 1 || i == 2 || i == 3 || i == 4)) {
      i = i + 1;
      continue;
    }
    const hit = collideSegment(
      ball,
      scaleX(r.x1),
      r.y1,
      scaleX(r.x2),
      r.y2,
      3,
      WALL_BOUNCE
    );
    if (hit.hit && i == 3) {
      ball.vx = ball.vx - 0.12;
      ball.vy = ball.vy - 0.05;
    }
    if (hit.hit && i == 4) {
      ball.vx = ball.vx - 0.08;
      ball.vy = ball.vy - 0.06;
    }
    i = i + 1;
  }
}

function collidePegs(ball) {
  let i = 0;
  while (i < PEG_DEFS.length) {
    const p = PEG_DEFS[i];
    collideCircle(ball, scaleX(p.x), p.y, p.r, PEG_BOUNCE);
    i = i + 1;
  }
}

function updateBumperCollisions(ball, bumpers, score, events) {
  let nextScore = score;
  let i = 0;
  while (i < MAX_BUMPERS) {
    const def = BUMPER_DEFS[i];
    if (collideCircle(ball, scaleX(def.x), def.y, 16, BUMPER_SPEED)) {
      if (bumpers[i].cooldownMs <= 0) {
        bumpers[i] = { flashMs: 150, cooldownMs: 180 };
        nextScore = nextScore + def.value;
        events.push(soundEvent("bounce"));
        events.push(particleEvent("sparkle", scaleX(def.x), def.y, 12));
      }
    }
    i = i + 1;
  }
  return nextScore;
}

function computeCamera(ball, waiting, won) {
  if (waiting == 1) {
    return WORLD_H - VIEW_H;
  }
  if (won == 1) {
    return 0;
  }
  let cam = ball.y - 165;
  cam = clamp(cam, 0, WORLD_H - VIEW_H);
  return cam;
}

function resetForNextBall() {
  return makeBallWaiting();
}

function hud(props) {
  const s = props.state;
  let title = "FLIPPERITORNI";
  let help = "A/← vasen maila   D/→ oikea maila";
  let status = "Pidä Space: vedä tappi | Päästä: laukaise";
  if (s.waiting == 1 && s.plungerPull > 0.05) {
    const pct = Math.floor(s.plungerPull * 100);
    status = "Veto " + pct + "% — päästä Space!";
  }
  if (s.plungerActive == 1) {
    status = "Laukaistaan...";
  }
  if (s.waiting == 0) {
    status = "Nouse kohti huipun porttia!";
  }
  if (s.gameOver == 1) {
    title = "PALLOT LOPPUIVAT";
    status = "Space/↑: uusi peli";
  }
  if (s.won == 1) {
    title = "HUIPPU SAAVUTETTU!";
    status = "Space/↑: pelaa uudelleen";
  }
  const height = Math.floor(s.bestHeight / 10);
  return (
    <View flexDirection="column" padding="4px" background="#071226dd">
      <Label text={title} color="#ffe878" fontSize="16px" />
      <Label text={"Pisteet: " + s.score + "   Pallot: " + s.lives + "   Nousu: " + height + " m"} color="#d9f5ff" fontSize="10px" />
      <Label text={status} color="#ffb8d8" fontSize="10px" />
      <Label text={help} color="#8edfff" fontSize="9px" />
    </View>
  );
}

function firePlungerAtBall(ball, power, events) {
  ball.x = scaleX(START_X);
  ball.y = START_Y;
  ball.vx = -0.1 - power * 0.44;
  ball.vy = -0.42 - power * 0.88;
  ball.spin = -0.05 - power * 0.32;
  ball.active = 1;
  events.push(soundEvent("blip"));
  events.push(rumbleEvent(0, 12000 + power * 22000, 18000 + power * 24000, 80 + power * 140));
  return LAUNCH_GRACE_MS;
}

function update(props) {
  const s = props.state;
  const dt = props.dt;
  const inp = readInput(props);
  const launchDown = inp.launch ? 1 : 0;
  const launchPressed = launchDown == 1 && s.launchHeld == 0;
  const launchReleased = launchDown == 0 && s.launchHeld == 1;
  const events = [];

  if ((s.gameOver == 1 || s.won == 1) && launchPressed) {
    const fresh = initState();
    fresh.events = [soundEvent("blip")];
    return fresh;
  }

  let ball = copyBall(s.ball);
  let bumpers = copyBumpers(s.bumpers, dt);
  let score = s.score;
  let lives = s.lives;
  let waiting = s.waiting;
  let won = s.won;
  let gameOver = s.gameOver;
  let bestHeight = s.bestHeight;
  let flipperHitCd = s.flipperHitCd - dt;
  if (flipperHitCd < 0) {
    flipperHitCd = 0;
  }

  let launchGraceMs = s.launchGraceMs - dt;
  if (launchGraceMs < 0) {
    launchGraceMs = 0;
  }

  let plungerPull = s.plungerPull;
  let plungerY = s.plungerY;
  let plungerVy = s.plungerVy;
  let plungerActive = s.plungerActive;

  let flipSwing0 = s.flipSwing0 - dt;
  let flipSwing1 = s.flipSwing1 - dt;
  let flipSwing2 = s.flipSwing2 - dt;
  let flipSwing3 = s.flipSwing3 - dt;
  if (flipSwing0 < 0) {
    flipSwing0 = 0;
  }
  if (flipSwing1 < 0) {
    flipSwing1 = 0;
  }
  if (flipSwing2 < 0) {
    flipSwing2 = 0;
  }
  if (flipSwing3 < 0) {
    flipSwing3 = 0;
  }

  let flipFired0 = s.flipFired0;
  let flipFired1 = s.flipFired1;
  let flipFired2 = s.flipFired2;
  let flipFired3 = s.flipFired3;
  const leftFlip = inp.left ? 1 : 0;
  const rightFlip = inp.right ? 1 : 0;
  const leftEdge = leftFlip == 1 && s.leftFlipHeld == 0;
  const rightEdge = rightFlip == 1 && s.rightFlipHeld == 0;

  if (leftEdge) {
    flipSwing0 = FLIPPER_SWING_MS;
    flipSwing2 = FLIPPER_SWING_MS;
    flipFired0 = 0;
    flipFired2 = 0;
  }
  if (rightEdge) {
    flipSwing1 = FLIPPER_SWING_MS;
    flipSwing3 = FLIPPER_SWING_MS;
    flipFired1 = 0;
    flipFired3 = 0;
  }

  if (waiting == 1 && gameOver == 0 && won == 0) {
    ball.x = scaleX(START_X);
    ball.y = START_Y;
    ball.vx = 0;
    ball.vy = 0;
    ball.spin = 0;
    ball.active = 0;

    if (plungerActive == 0 && launchDown == 1) {
      plungerPull = plungerPull + dt * PLUNGER_PULL_RATE;
      if (plungerPull > 1) {
        plungerPull = 1;
      }
    }

    if (plungerActive == 0 && launchReleased && plungerPull <= 0.04) {
      plungerPull = 0;
    }

    if (plungerActive == 0 && launchReleased && plungerPull > 0.04) {
      plungerActive = 1;
      plungerY = PLUNGER_Y_REST + plungerPull * PLUNGER_PULL_MAX;
      plungerVy = -0.62 - plungerPull * 1.05;
    }

    if (plungerActive == 1) {
      plungerY = plungerY + plungerVy * dt;
      plungerVy = plungerVy - 0.00055 * dt;
      const hitY = START_Y + BALL_R + 3;
      if (plungerY <= hitY) {
        plungerY = hitY;
        launchGraceMs = firePlungerAtBall(ball, plungerPull, events);
        waiting = 0;
        plungerActive = 0;
        plungerPull = 0;
        plungerVy = 0;
        plungerY = PLUNGER_Y_REST;
      } else if (plungerY < START_Y - 80) {
        plungerActive = 0;
        plungerVy = 0;
        plungerY = PLUNGER_Y_REST;
      }
    }
  }

  if (ball.active == 1 && gameOver == 0 && won == 0) {
    const stepDt = dt / PHYSICS_STEPS;
    let step = 0;
    while (step < PHYSICS_STEPS) {
      ball.vy = ball.vy + GRAVITY * stepDt;
      ball.vx = ball.vx * MOTION_DAMP;
      ball.vy = ball.vy * MOTION_DAMP;
      ball.x = ball.x + ball.vx * stepDt;
      ball.y = ball.y + ball.vy * stepDt;
      applyBallSpin(ball, stepDt);

      collideWorldWalls(ball);
      applyLauncherExit(ball, launchGraceMs);
      repelLauncherReentry(ball);
      collideRails(ball, launchGraceMs);
      collidePegs(ball);
      score = updateBumperCollisions(ball, bumpers, score, events);

      let hitFlipper = false;
      if (launchGraceMs <= 0) {
        const flipperResult = collideFlippers(
          ball,
          flipSwing0,
          flipSwing1,
          flipSwing2,
          flipSwing3,
          flipFired0,
          flipFired1,
          flipFired2,
          flipFired3
        );
        hitFlipper = flipperResult.hit;
        flipFired0 = flipperResult.fired0;
        flipFired1 = flipperResult.fired1;
        flipFired2 = flipperResult.fired2;
        flipFired3 = flipperResult.fired3;
      }
      if (hitFlipper && flipperHitCd <= 0) {
        flipperHitCd = 95;
        events.push(soundEvent("wall"));
        events.push(rumbleEvent(0, 13000, 18000, 65));
      }

      clampBallSpeed(ball);
      step = step + 1;
    }

    const climbed = WORLD_H - ball.y;
    if (climbed > bestHeight) {
      bestHeight = climbed;
    }

    if (ball.y <= GOAL_Y) {
      won = 1;
      waiting = 0;
      ball.active = 0;
      ball.y = GOAL_Y;
      ball.vx = 0;
      ball.vy = 0;
      ball.spin = 0;
      score = score + 5000;
      events.push(soundEvent("celebrate"));
      events.push(particleEvent("celebrate", ball.x, ball.y, 50));
      events.push(rumbleEvent(0, 36000, 36000, 260));
    } else if (ball.y > WORLD_H + 24) {
      lives = lives - 1;
      events.push(soundEvent("lose"));
      events.push(rumbleEvent(0, 30000, 30000, 180));
      if (lives <= 0) {
        lives = 0;
        gameOver = 1;
        waiting = 0;
        ball.active = 0;
      } else {
        ball = resetForNextBall();
        waiting = 1;
        plungerPull = 0;
        plungerActive = 0;
        plungerVy = 0;
        plungerY = PLUNGER_Y_REST;
      }
    }
  }

  const cameraY = computeCamera(ball, waiting, won);
  const next = {
    showNet: 0,
    ball: ball,
    bumpers: bumpers,
    cameraY: cameraY,
    score: score,
    lives: lives,
    bestHeight: bestHeight,
    waiting: waiting,
    won: won,
    gameOver: gameOver,
    leftDown: leftFlip,
    rightDown: rightFlip,
    launchHeld: launchDown,
    launchGraceMs: launchGraceMs,
    plungerPull: plungerPull,
    plungerY: plungerY,
    plungerVy: plungerVy,
    plungerActive: plungerActive,
    flipSwing0: flipSwing0,
    flipSwing1: flipSwing1,
    flipSwing2: flipSwing2,
    flipSwing3: flipSwing3,
    flipFired0: flipFired0,
    flipFired1: flipFired1,
    flipFired2: flipFired2,
    flipFired3: flipFired3,
    leftFlipHeld: leftFlip,
    rightFlipHeld: rightFlip,
    flipperHitCd: flipperHitCd,
    entities: {},
    events: events
  };
  next.entities = placeEntities(next);
  return next;
}