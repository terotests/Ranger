/// <reference path="../../scripting/game.d.ts" />
//
// Arctic Rush — simple top-down arcade racer for the same engine style as Ylos!
//
// Controls:
//   P1: left/right steer, up/action accelerate, down brake, B/X turbo
//   P2: same through input.players[1] in dual mode
//
// The game uses:
//   - one pre-rendered vertical background
//   - sprite entities for cars, traffic, pickups and effects
//   - HUD text
//   - one shared camera
//
// In a narrow 240 px pane it runs as single-player.
// In a 480 px pane it enables a second player.
// Split-screen (game.info): each pane is solo with its own camera; peerCar shows
// the other player's car from the opposite pane.

import { soundEvent } from "../../scripting/game_helpers";

const BASE_W = 480;
const WORLD_H = 6000;
const VIEW_H = 270;

const MAX_TRAFFIC = 8;
const MAX_PICKUPS = 20;
const MAX_OBSTACLES = 13;
const MAX_FX = 8;

const START_Y = WORLD_H - 150;
const FINISH_Y = 120;

const ROAD_HALF_MIN = 70;
const ROAD_HALF_MAX = 112;

const ACCEL = 0.00034;
const BRAKE = 0.00058;
const DRAG = 0.00010;
const OFFROAD_DRAG = 0.00042;
const MAX_SPEED = 0.50;
const MAX_OFFROAD_SPEED = 0.20;
const REVERSE_SPEED = -0.08;
const STEER = 0.00072;
const STEER_RETURN = 0.004;
const TURBO_ACCEL = 0.00070;
const TURBO_DRAIN = 0.040;
const TURBO_RECHARGE = 0.010;

const CHECKPOINTS = [4800, 3600, 2400, 1200];
const CHECKPOINT_BONUS = 20000;

const ROAD_POINTS = [
  // The first bends are close to the start so the road visibly turns immediately.
  { y: 6000, x: 240, half: 106, zone: 0 },
  { y: 5800, x: 170, half: 104, zone: 0 },
  { y: 5580, x: 310, half: 100, zone: 0 },
  { y: 5360, x: 185, half: 98, zone: 0 },
  { y: 5140, x: 300, half: 94, zone: 0 },
  { y: 4920, x: 220, half: 92, zone: 0 },

  { y: 4700, x: 150, half: 84, zone: 1 },
  { y: 4480, x: 315, half: 82, zone: 1 },
  { y: 4260, x: 190, half: 80, zone: 1 },
  { y: 4040, x: 325, half: 78, zone: 1 },
  { y: 3820, x: 205, half: 82, zone: 1 },
  { y: 3600, x: 285, half: 86, zone: 1 },

  { y: 3380, x: 165, half: 102, zone: 2 },
  { y: 3160, x: 310, half: 106, zone: 2 },
  { y: 2940, x: 190, half: 102, zone: 2 },
  { y: 2720, x: 325, half: 98, zone: 2 },
  { y: 2500, x: 180, half: 96, zone: 2 },
  { y: 2280, x: 285, half: 92, zone: 2 },

  { y: 2060, x: 145, half: 76, zone: 3 },
  { y: 1840, x: 325, half: 72, zone: 3 },
  { y: 1620, x: 175, half: 70, zone: 3 },
  { y: 1400, x: 315, half: 72, zone: 3 },
  { y: 1180, x: 190, half: 74, zone: 3 },
  { y: 960, x: 305, half: 76, zone: 3 },
  { y: 740, x: 165, half: 78, zone: 3 },
  { y: 520, x: 300, half: 82, zone: 3 },
  { y: 300, x: 195, half: 86, zone: 3 },
  { y: 100, x: 240, half: 92, zone: 3 }
];

const TRAFFIC_DEFS = [
  { xOff: -30, y: 5640, speed: 0.18, lane: -1 },
  { xOff:  34, y: 5160, speed: 0.15, lane: 1 },
  { xOff: -22, y: 4520, speed: 0.20, lane: -1 },
  { xOff:  30, y: 3980, speed: 0.17, lane: 1 },
  { xOff: -36, y: 3260, speed: 0.19, lane: -1 },
  { xOff:  24, y: 2660, speed: 0.16, lane: 1 },
  { xOff: -28, y: 1780, speed: 0.21, lane: -1 },
  { xOff:  32, y: 900, speed: 0.18, lane: 1 }
];

const PICKUP_DEFS = [
  // kind 0 = fuel/score, 1 = turbo, 2 = valuable gem
  { xOff: -42, y: 5740, kind: 2 },
  { xOff:  36, y: 5520, kind: 0 },
  { xOff: -30, y: 5280, kind: 2 },
  { xOff:  42, y: 4980, kind: 1 },
  { xOff: -38, y: 4660, kind: 2 },

  { xOff:  34, y: 4380, kind: 2 },
  { xOff: -44, y: 4100, kind: 0 },
  { xOff:  28, y: 3820, kind: 2 },
  { xOff: -34, y: 3520, kind: 1 },
  { xOff:  40, y: 3260, kind: 2 },

  { xOff: -42, y: 2980, kind: 2 },
  { xOff:  36, y: 2700, kind: 0 },
  { xOff: -28, y: 2420, kind: 2 },
  { xOff:  42, y: 2140, kind: 1 },
  { xOff: -36, y: 1860, kind: 2 },

  { xOff:  34, y: 1560, kind: 2 },
  { xOff: -40, y: 1280, kind: 0 },
  { xOff:  28, y: 980, kind: 2 },
  { xOff: -34, y: 680, kind: 1 },
  { xOff:  36, y: 380, kind: 2 }
];

//
// kind 0 = cone, 1 = rock/barrier, 2 = ramp.
// xOff is relative to the road centre, so these follow the bends.
//
const OBSTACLE_DEFS = [
  { xOff: -34, y: 5600, kind: 0 },
  { xOff:  24, y: 5320, kind: 2 },
  { xOff:  46, y: 5000, kind: 0 },
  { xOff: -20, y: 4620, kind: 1 },
  { xOff:  30, y: 4200, kind: 2 },
  { xOff: -44, y: 3780, kind: 0 },
  { xOff:  18, y: 3380, kind: 1 },
  { xOff: -26, y: 3000, kind: 2 },
  { xOff:  40, y: 2540, kind: 0 },
  { xOff: -32, y: 2080, kind: 1 },
  { xOff:  20, y: 1640, kind: 2 },
  { xOff: -38, y: 1080, kind: 0 },
  { xOff:  30, y: 560, kind: 2 }
];

const CAR_STRAIGHT = [
  "..OO..",
  ".OOOO.",
  "OOXXOO",
  "OOOOOO",
  ".OXXO.",
  "O....O",
  "O....O",
  ".OOOO."
];

const CAR_LEFT = [
  ".OO...",
  "OOOO..",
  "OOXXO.",
  ".OOOOO",
  "..OXXO",
  ".O...O",
  "O....O",
  ".OOOO."
];

const CAR_RIGHT = [
  "...OO.",
  "..OOOO",
  ".OXXOO",
  "OOOOO.",
  "OXXO..",
  "O...O.",
  "O....O",
  ".OOOO."
];

const TRAFFIC_A = [
  "..OO..",
  ".OOOO.",
  "OOXXOO",
  "OOOOOO",
  ".OXXO.",
  "O....O",
  ".OOOO."
];

const PICKUP_FUEL = [
  ".OOOO.",
  "OOOOOO",
  "OO..OO",
  "OOOOOO",
  "OO..OO",
  ".OOOO."
];

const PICKUP_TURBO = [
  "..OO..",
  ".OOOO.",
  "OOOOOO",
  "..OO..",
  ".OOOO.",
  "..OO.."
];

const PICKUP_VALUE = [
  "..OO..",
  ".OXXO.",
  "OXXXXO",
  ".OXXO.",
  "..OO..",
  "...O.."
];

const SPARK = [
  ".O.O.",
  "..O..",
  "OOOOO",
  "..O..",
  ".O.O."
];

const CONE = [
  "..O..",
  ".OOO.",
  ".OXO.",
  "OOOOO"
];

const ROCK_BLOCK = [
  ".OOOO.",
  "OOOOOO",
  "OOXXOO",
  "OOOOOO",
  ".OOOO."
];

const RAMP = [
  "......",
  "....OO",
  "..OOOO",
  "OOOOOO",
  "XXXXXX"
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
  return isDualMode() ? 2 : 1;
}

function scaleX(v) {
  return (v * worldW()) / BASE_W;
}

function clamp(v, lo, hi) {
  if (v < lo) { return lo; }
  if (v > hi) { return hi; }
  return v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

const ROAD_CACHE_STEP = 8;
let ROAD_CACHE_W = -1;
let ROAD_CACHE_CENTER = [];
let ROAD_CACHE_HALF = [];
let ROAD_CACHE_ZONE = [];

function computeRoadAtRaw(y) {
  let i = 0;
  while (i < ROAD_POINTS.length - 1) {
    const a = ROAD_POINTS[i];
    const b = ROAD_POINTS[i + 1];

    if (y <= a.y && y >= b.y) {
      const span = a.y - b.y;
      const t = span == 0 ? 0 : (a.y - y) / span;
      const progress = WORLD_H - y;

      // One smooth procedural bend layered over the authored control points.
      const wave =
        Math.sin(progress * 0.0105) * 38 +
        Math.sin(progress * 0.0042 + 1.2) * 22;

      const half = scaleX(lerp(a.half, b.half, t));
      const rawCenter = scaleX(lerp(a.x, b.x, t) + wave);

      return {
        center: clamp(rawCenter, half + scaleX(18), worldW() - half - scaleX(18)),
        half: half,
        zone: t < 0.5 ? a.zone : b.zone
      };
    }
    i = i + 1;
  }

  const last = ROAD_POINTS[ROAD_POINTS.length - 1];
  const half = scaleX(last.half);
  return {
    center: clamp(scaleX(last.x), half + scaleX(18), worldW() - half - scaleX(18)),
    half: half,
    zone: last.zone
  };
}

function ensureRoadCache() {
  if (ROAD_CACHE_W == worldW()) {
    return;
  }

  ROAD_CACHE_W = worldW();
  ROAD_CACHE_CENTER = [];
  ROAD_CACHE_HALF = [];
  ROAD_CACHE_ZONE = [];

  let y = 0;
  while (y <= WORLD_H + ROAD_CACHE_STEP) {
    const r = computeRoadAtRaw(y);
    ROAD_CACHE_CENTER.push(r.center);
    ROAD_CACHE_HALF.push(r.half);
    ROAD_CACHE_ZONE.push(r.zone);
    y = y + ROAD_CACHE_STEP;
  }
}

function roadAt(y) {
  ensureRoadCache();

  const maxIndex = ROAD_CACHE_CENTER.length - 1;
  let index = (y / ROAD_CACHE_STEP) | 0;
  index = clamp(index, 0, maxIndex);

  return {
    center: ROAD_CACHE_CENTER[index],
    half: ROAD_CACHE_HALF[index],
    zone: ROAD_CACHE_ZONE[index]
  };
}

function roadLeftAt(y) {
  const r = roadAt(y);
  return r.center - r.half;
}

function roadRightAt(y) {
  const r = roadAt(y);
  return r.center + r.half;
}

function staticLevelHeight() {
  return WORLD_H;
}

function zoneColors(zone) {
  if (zone == 0) {
    return {
      ground: [24, 46, 40],
      road: [58, 66, 68],
      edge: [170, 186, 176],
      line: [245, 210, 100]
    };
  }
  if (zone == 1) {
    return {
      ground: [180, 198, 212],
      road: [73, 82, 90],
      edge: [235, 244, 250],
      line: [245, 215, 110]
    };
  }
  if (zone == 2) {
    return {
      ground: [92, 132, 152],
      road: [130, 176, 196],
      edge: [220, 245, 250],
      line: [245, 245, 230]
    };
  }
  return {
    ground: [42, 44, 55],
    road: [66, 62, 70],
    edge: [132, 126, 138],
    line: [255, 210, 95]
  };
}

function drawTree(x, y, snowy) {
  if (snowy) {
    bgFillRect(x - 2, y + 8, 4, 12, 92, 72, 56);
    bgFillCircle(x, y + 7, 8, 42, 90, 66);
    bgFillCircle(x, y + 2, 6, 230, 240, 246);
  } else {
    bgFillRect(x - 2, y + 8, 4, 12, 80, 58, 42);
    bgFillCircle(x, y + 7, 8, 28, 76, 50);
    bgFillCircle(x, y + 1, 6, 36, 104, 65);
  }
}

function drawRock(x, y) {
  bgFillCircle(x, y + 6, 7, 78, 76, 86);
  bgFillRect(x - 6, y + 6, 12, 6, 60, 58, 68);
}

function drawCheckpoint(y) {
  const r = roadAt(y);
  const left = r.center - r.half;
  const right = r.center + r.half;

  bgFillRect(left, y, right - left, 5, 235, 235, 235);

  let x = left;
  let flip = 0;
  while (x < right) {
    if (flip == 0) {
      bgFillRect(x, y, 8, 5, 30, 30, 34);
    }
    flip = 1 - flip;
    x = x + 8;
  }
}

function drawRoadSlice(y, step) {
  const road = roadAt(y);
  const c = zoneColors(road.zone);
  const left = road.center - road.half;
  const right = road.center + road.half;

  bgFillRect(0, y, bgWidth, step, c.ground[0], c.ground[1], c.ground[2]);
  bgFillRect(left - 5, y, right - left + 10, step, c.edge[0], c.edge[1], c.edge[2]);
  bgFillRect(left, y, right - left, step, c.road[0], c.road[1], c.road[2]);

  if (((y / 28) | 0) % 2 == 0) {
    bgFillRect(road.center - 2, y, 4, step, c.line[0], c.line[1], c.line[2]);
  }
}

function createStaticBg() {
  let y = 0;
  const step = 10;

  while (y < bgHeight) {
    drawRoadSlice(y, step);
    y = y + step;
  }

  let d = 0;
  while (d < ROAD_POINTS.length) {
    const p = ROAD_POINTS[d];
    const rx = scaleX(p.x);
    const half = scaleX(p.half);

    if (p.zone == 0 || p.zone == 1) {
      drawTree(rx - half - 24, p.y + 30, p.zone == 1);
      drawTree(rx + half + 24, p.y - 20, p.zone == 1);
      drawTree(rx - half - 46, p.y - 80, p.zone == 1);
    }

    if (p.zone == 3) {
      drawRock(rx - half - 18, p.y + 25);
      drawRock(rx + half + 22, p.y - 30);
    }

    d = d + 1;
  }

  let cp = 0;
  while (cp < CHECKPOINTS.length) {
    drawCheckpoint(CHECKPOINTS[cp]);
    cp = cp + 1;
  }

  drawCheckpoint(FINISH_Y);

  const finish = roadAt(FINISH_Y);
  bgFillRect(finish.center - finish.half - 5, FINISH_Y - 30, 5, 38, 240, 240, 240);
  bgFillRect(finish.center + finish.half, FINISH_Y - 30, 5, 38, 240, 240, 240);
  bgFillRect(finish.center - finish.half, FINISH_Y - 30, finish.half * 2, 5, 230, 60, 60);
}

function carSprite(id, mainR, mainG, mainB) {
  return {
    id: id,
    kind: "bitmap",
    px: 4,
    br: mainR,
    bg: mainG,
    bb: mainB,
    er: 34,
    eg: 36,
    eb: 44,
    frames: [CAR_STRAIGHT, CAR_LEFT, CAR_RIGHT]
  };
}

function trafficSprite(id) {
  return {
    id: id,
    kind: "bitmap",
    px: 4,
    br: 235,
    bg: 160,
    bb: 55,
    er: 36,
    eg: 38,
    eb: 46,
    frames: [TRAFFIC_A]
  };
}

function pickupSprite(id, kind) {
  if (kind == 0) {
    return {
      id: id,
      kind: "bitmap",
      px: 2,
      br: 255,
      bg: 210,
      bb: 60,
      er: 90,
      eg: 60,
      eb: 20,
      frames: [PICKUP_FUEL]
    };
  }

  if (kind == 1) {
    return {
      id: id,
      kind: "bitmap",
      px: 2,
      br: 70,
      bg: 220,
      bb: 255,
      er: 20,
      eg: 50,
      eb: 70,
      frames: [PICKUP_TURBO]
    };
  }

  return {
    id: id,
    kind: "bitmap",
    px: 3,
    br: 255,
    bg: 90,
    bb: 220,
    er: 255,
    eg: 230,
    eb: 90,
    frames: [PICKUP_VALUE]
  };
}

function sprites() {
  const out = [];

  out.push(carSprite("p1", 235, 70, 70));
  out.push(carSprite("p2", 70, 165, 255));

  let i = 0;
  while (i < MAX_TRAFFIC) {
    out.push(trafficSprite("t" + i));
    i = i + 1;
  }

  let p = 0;
  while (p < MAX_PICKUPS) {
    out.push(pickupSprite("k" + p, PICKUP_DEFS[p].kind));
    p = p + 1;
  }

  let o = 0;
  while (o < MAX_OBSTACLES) {
    const kind = OBSTACLE_DEFS[o].kind;
    if (kind == 0) {
      out.push({
        id: "o" + o, kind: "bitmap", px: 3,
        br: 255, bg: 130, bb: 35,
        er: 245, eg: 245, eb: 230,
        frames: [CONE]
      });
    } else if (kind == 1) {
      out.push({
        id: "o" + o, kind: "bitmap", px: 3,
        br: 115, bg: 105, bb: 105,
        er: 45, eg: 42, eb: 48,
        frames: [ROCK_BLOCK]
      });
    } else {
      out.push({
        id: "o" + o, kind: "bitmap", px: 3,
        br: 225, bg: 180, bb: 70,
        er: 65, eg: 55, eb: 45,
        frames: [RAMP]
      });
    }
    o = o + 1;
  }

  let f = 0;
  while (f < MAX_FX) {
    out.push({
      id: "fx" + f,
      kind: "bitmap",
      px: 2,
      br: 255,
      bg: 225,
      bb: 90,
      er: 255,
      eg: 110,
      eb: 50,
      frames: [SPARK]
    });
    f = f + 1;
  }

  return out;
}

function makePlayer(x, face) {
  return {
    x: scaleX(x),
    y: START_Y,
    speed: 0,
    steer: 0,
    face: face,
    turbo: 100,
    damage: 0,
    score: 0,
    checkpoint: 0,
    finished: 0,
    finishTick: 0,
    invuln: 0
  };
}

function makeTraffic() {
  const out = [];
  let i = 0;

  while (i < MAX_TRAFFIC) {
    const d = TRAFFIC_DEFS[i];
    const r = roadAt(d.y);

    out.push({
      x: r.center + scaleX(d.xOff),
      y: d.y,
      speed: d.speed,
      alive: 1,
      lane: d.lane
    });

    i = i + 1;
  }

  return out;
}

function makePickups() {
  const out = [];
  let i = 0;

  while (i < MAX_PICKUPS) {
    out.push({ taken: 0 });
    i = i + 1;
  }

  return out;
}

function makeFx() {
  const out = [];
  let i = 0;

  while (i < MAX_FX) {
    out.push({ active: 0, x: -40, y: -40, ttl: 0 });
    i = i + 1;
  }

  return out;
}

function spawnFx(fx, x, y) {
  let i = 0;

  while (i < MAX_FX) {
    if (fx[i].active == 0) {
      fx[i] = { active: 1, x: x, y: y, ttl: 260 };
      return;
    }
    i = i + 1;
  }
}

function localStartX() {
  if (isSplitPane()) {
    if (paneIndex == 1) {
      return 270;
    }
    return 210;
  }
  return 210;
}

function initState() {
  const slots = playerSlots();
  const p1 = makePlayer(localStartX(), 1);
  const p2 = makePlayer(270, -1);
  const traffic = makeTraffic();
  const pickups = makePickups();
  const fx = makeFx();

  const cameraY = START_Y - VIEW_H + 105;
  const entities = placeEntities(
    { p1: p1, p2: p2, traffic: traffic, pickups: pickups, fx: fx },
    cameraY,
    slots
  );

  return {
    showNet: 0,
    playerSlots: slots,
    cameraY: cameraY,
    p1: p1,
    p2: p2,
    traffic: traffic,
    pickups: pickups,
    fx: fx,
    entities: entities,
    timeLeft: 105000,
    winner: 0,
    message: "ARCTIC RUSH",
    messageTick: 1600
  };
}

function readPlayer(props, index) {
  const input = props.input;

  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let action = false;
  let turbo = false;

  if (index == 0) {
    up = props.up;
    down = props.down;
    left = props.left;
    right = props.right;
    action = props.action;
  }

  if (input && input.players[index]) {
    const p = input.players[index];
    up = p.up;
    down = p.down;
    left = p.left;
    right = p.right;
    action = p.action;

    if (p.b) { turbo = true; }
    if (p.x) { turbo = true; }
  }

  return {
    accelerate: up || action,
    brake: down,
    left: left,
    right: right,
    turbo: turbo
  };
}

function playerAnim(pl) {
  if (pl.steer < -0.18) { return 1; }
  if (pl.steer > 0.18) { return 2; }
  return 0;
}

function isOffroad(pl) {
  const r = roadAt(pl.y);
  const margin = scaleX(11);
  return pl.x < r.center - r.half + margin || pl.x > r.center + r.half - margin;
}

function updatePlayer(pl, inp, dt, fx) {
  let speed = pl.speed;
  let steer = pl.steer;
  let turbo = pl.turbo;
  let y = pl.y;
  let x = pl.x;
  let damage = pl.damage;
  let invuln = pl.invuln;
  let score = pl.score;
  let jumpTick = pl.finishTick;

  const events = [];

  if (jumpTick > 0) {
    jumpTick = jumpTick - dt;
    if (jumpTick < 0) { jumpTick = 0; }
  }

  if (inp.accelerate) {
    if (speed < 0) {
      // Throttle acts as a strong brake while reversing, then accelerates forward.
      speed = speed + BRAKE * 1.8 * dt;
      if (speed > 0) { speed = 0; }
    } else {
      speed = speed + ACCEL * dt;
    }
  } else if (inp.brake) {
    if (speed > 0.015) {
      // First brake the forward motion.
      speed = speed - BRAKE * dt;
      if (speed < 0) { speed = 0; }
    } else {
      // Only start reversing once the car has almost stopped.
      speed = speed - ACCEL * 0.65 * dt;
    }
  } else {
    if (speed > 0) {
      speed = speed - DRAG * dt;
      if (speed < 0) { speed = 0; }
    } else if (speed < 0) {
      speed = speed + DRAG * 1.8 * dt;
      if (speed > 0) { speed = 0; }
    }
  }

  if (inp.turbo && turbo > 0 && speed > 0.12) {
    speed = speed + TURBO_ACCEL * dt;
    turbo = turbo - TURBO_DRAIN * dt;
    if (turbo < 0) { turbo = 0; }
  } else {
    turbo = turbo + TURBO_RECHARGE * dt;
    if (turbo > 100) { turbo = 100; }
  }

  speed = clamp(speed, REVERSE_SPEED, MAX_SPEED);

  if (inp.left) {
    steer = steer - STEER * dt;
  } else if (inp.right) {
    steer = steer + STEER * dt;
  } else {
    if (steer < 0) {
      steer = steer + STEER_RETURN * dt;
      if (steer > 0) { steer = 0; }
    } else if (steer > 0) {
      steer = steer - STEER_RETURN * dt;
      if (steer < 0) { steer = 0; }
    }
  }

  steer = clamp(steer, -1, 1);

  const zone = roadAt(y).zone;
  let grip = 1.0;
  if (zone == 1) { grip = 0.80; }
  if (zone == 2) { grip = 0.56; }

  x = x + steer * speed * dt * grip * 0.56;
  y = y - speed * dt;

  x = clamp(x, 10, worldW() - 10);

  const offroad = isOffroad({ x: x, y: y });
  if (offroad) {
    speed = speed - OFFROAD_DRAG * dt;
    if (speed > MAX_OFFROAD_SPEED) {
      speed = MAX_OFFROAD_SPEED;
    }

    if (((y | 0) % 40) < 8) {
      spawnFx(fx, x, y + 16);
    }
  }

  if (speed < 0 && y > START_Y) {
    y = START_Y;
    speed = 0;
  }

  if (invuln > 0) {
    invuln = invuln - dt;
    if (invuln < 0) { invuln = 0; }
  }

  score = score + speed * dt * 0.12;

  return {
    player: {
      x: x,
      y: y,
      speed: speed,
      steer: steer,
      face: pl.face,
      turbo: turbo,
      damage: damage,
      score: score,
      checkpoint: pl.checkpoint,
      finished: pl.finished,
      finishTick: jumpTick,
      invuln: invuln
    },
    events: events
  };
}

function updateTraffic(traffic, dt, p1Y, p2Y, dual) {
  let i = 0;

  while (i < MAX_TRAFFIC) {
    const t = traffic[i];

    if (t.alive == 1) {
      let near = Math.abs(t.y - p1Y) < 700;
      if (dual && Math.abs(t.y - p2Y) < 700) {
        near = true;
      }

      if (near) {
        let y = t.y - t.speed * dt;
        if (y < 120) {
          y = WORLD_H - 180 - i * 120;
        }

        const r = roadAt(y);
        const laneX = t.lane < 0
          ? r.center - r.half * 0.36
          : r.center + r.half * 0.36;

        traffic[i] = {
          x: laneX,
          y: y,
          speed: t.speed,
          alive: 1,
          lane: t.lane
        };
      }
    }

    i = i + 1;
  }
}

function hitBox(ax, ay, bx, by, hw, hh) {
  const dx = ax - bx;
  const dy = ay - by;

  if (dx < -hw) { return false; }
  if (dx > hw) { return false; }
  if (dy < -hh) { return false; }
  if (dy > hh) { return false; }

  return true;
}

function applyTrafficHits(pl, traffic, fx, events) {
  if (pl.invuln > 0 || pl.finishTick > 0) {
    return pl;
  }

  let out = pl;
  let i = 0;

  while (i < MAX_TRAFFIC) {
    const t = traffic[i];

    if (t.alive == 1 && Math.abs(t.y - out.y) < 40) {
      if (hitBox(out.x, out.y, t.x, t.y, scaleX(17), 22)) {
        let knock = out.x < t.x ? -1 : 1;
        let damage = out.damage + 1;

        if (damage > 3) {
          damage = 3;
        }

        out = {
          x: clamp(out.x + knock * scaleX(22), 12, worldW() - 12),
          y: out.y + 22,
          speed: out.speed * 0.32,
          steer: knock * -0.65,
          face: out.face,
          turbo: out.turbo,
          damage: damage,
          score: out.score,
          checkpoint: out.checkpoint,
          finished: out.finished,
          finishTick: out.finishTick,
          invuln: 1200
        };

        spawnFx(fx, out.x, out.y);
        events.push(soundEvent("wall"));
        events.push(soundEvent("lose"));
      }
    }

    i = i + 1;
  }

  return out;
}

function obstacleWorldPos(index) {
  const d = OBSTACLE_DEFS[index];
  const r = roadAt(d.y);
  return {
    x: r.center + scaleX(d.xOff),
    y: d.y,
    kind: d.kind
  };
}

function applyObstacles(pl, fx, events) {
  let out = pl;
  let i = 0;

  while (i < MAX_OBSTACLES) {
    const o = obstacleWorldPos(i);

    if (Math.abs(o.y - out.y) > 44) {
      i = i + 1;
      continue;
    }

    if (o.kind == 2) {
      // Ramp: while airborne, the player clears normal obstacles and traffic.
      if (out.finishTick <= 0 && hitBox(out.x, out.y, o.x, o.y, scaleX(22), 20)) {
        out = {
          x: out.x,
          y: out.y - 8,
          speed: clamp(out.speed + 0.10, 0, MAX_SPEED),
          steer: out.steer,
          face: out.face,
          turbo: out.turbo,
          damage: out.damage,
          score: out.score + 350,
          checkpoint: out.checkpoint,
          finished: out.finished,
          finishTick: 720,
          invuln: out.invuln
        };
        spawnFx(fx, out.x, out.y + 12);
        events.push(soundEvent("bounce"));
      }
    } else if (out.finishTick <= 0 && out.invuln <= 0) {
      const hw = o.kind == 0 ? scaleX(12) : scaleX(18);
      const hh = o.kind == 0 ? 14 : 19;

      if (hitBox(out.x, out.y, o.x, o.y, hw, hh)) {
        const damageAdd = o.kind == 0 ? 0 : 1;
        out = {
          x: clamp(out.x + (out.x < o.x ? -scaleX(18) : scaleX(18)), 12, worldW() - 12),
          y: out.y + 12,
          speed: out.speed * (o.kind == 0 ? 0.58 : 0.28),
          steer: out.x < o.x ? -0.8 : 0.8,
          face: out.face,
          turbo: out.turbo,
          damage: clamp(out.damage + damageAdd, 0, 3),
          score: out.score,
          checkpoint: out.checkpoint,
          finished: out.finished,
          finishTick: out.finishTick,
          invuln: 900
        };
        spawnFx(fx, out.x, out.y);
        events.push(soundEvent("wall"));
      }
    }

    i = i + 1;
  }

  return out;
}

function pickupWorldPos(index) {
  const d = PICKUP_DEFS[index];
  const r = roadAt(d.y);

  return {
    x: r.center + scaleX(d.xOff),
    y: d.y,
    kind: d.kind
  };
}

function applyPickups(pl, pickups, events) {
  let out = pl;
  let i = 0;

  while (i < MAX_PICKUPS) {
    if (pickups[i].taken == 0) {
      const p = pickupWorldPos(i);

      if (Math.abs(p.y - out.y) < 36 &&
          hitBox(out.x, out.y, p.x, p.y, scaleX(16), 18)) {
        pickups[i] = { taken: 1 };

        if (p.kind == 0) {
          out = {
            x: out.x,
            y: out.y,
            speed: out.speed,
            steer: out.steer,
            face: out.face,
            turbo: out.turbo,
            damage: out.damage,
            score: out.score + 500,
            checkpoint: out.checkpoint,
            finished: out.finished,
            finishTick: out.finishTick,
            invuln: out.invuln
          };
        } else if (p.kind == 1) {
          out = {
            x: out.x,
            y: out.y,
            speed: out.speed,
            steer: out.steer,
            face: out.face,
            turbo: clamp(out.turbo + 50, 0, 100),
            damage: out.damage,
            score: out.score + 300,
            checkpoint: out.checkpoint,
            finished: out.finished,
            finishTick: out.finishTick,
            invuln: out.invuln
          };
        } else {
          out = {
            x: out.x,
            y: out.y,
            speed: out.speed,
            steer: out.steer,
            face: out.face,
            turbo: clamp(out.turbo + 10, 0, 100),
            damage: out.damage,
            score: out.score + 1500,
            checkpoint: out.checkpoint,
            finished: out.finished,
            finishTick: out.finishTick,
            invuln: out.invuln
          };
        }

        events.push(soundEvent("blip"));
        events.push(soundEvent("win"));
      }
    }

    i = i + 1;
  }

  return out;
}

function applyCheckpoint(pl) {
  let out = pl;
  let bonus = 0;
  let message = "";

  if (out.checkpoint < CHECKPOINTS.length) {
    const y = CHECKPOINTS[out.checkpoint];

    if (out.y <= y) {
      out = {
        x: out.x,
        y: out.y,
        speed: out.speed,
        steer: out.steer,
        face: out.face,
        turbo: out.turbo,
        damage: out.damage,
        score: out.score + 1000,
        checkpoint: out.checkpoint + 1,
        finished: out.finished,
        finishTick: out.finishTick,
        invuln: out.invuln
      };

      bonus = CHECKPOINT_BONUS;
      message = "CHECKPOINT +" + ((CHECKPOINT_BONUS / 1000) | 0);
    }
  }

  return { player: out, bonus: bonus, message: message };
}

function updateFx(fx, dt) {
  let i = 0;

  while (i < MAX_FX) {
    const f = fx[i];

    if (f.active == 1) {
      const ttl = f.ttl - dt;

      if (ttl <= 0) {
        fx[i] = { active: 0, x: -40, y: -40, ttl: 0 };
      } else {
        fx[i] = {
          active: 1,
          x: f.x,
          y: f.y + 0.03 * dt,
          ttl: ttl
        };
      }
    }

    i = i + 1;
  }
}

function computeCamera(p1, p2, dual) {
  if (isSplitPane()) {
    let cam = p1.y - VIEW_H + 105;
    cam = clamp(cam, 0, WORLD_H - VIEW_H);
    return cam;
  }

  let leadY = p1.y;

  if (dual && p2.y < leadY) {
    leadY = p2.y;
  }

  let cam = leadY - VIEW_H + 105;
  cam = clamp(cam, 0, WORLD_H - VIEW_H);

  return cam;
}

function inCameraRange(worldY, cam, margin) {
  const screenY = worldY - cam;
  return screenY >= 0 - margin && screenY <= VIEW_H + margin;
}

function peerCarAnim(peer) {
  if (peer.steer < -0.18) { return 1; }
  if (peer.steer > 0.18) { return 2; }
  return 0;
}

function placePeerCar(entities, cam) {
  if (false == isSplitPane()) {
    return;
  }
  if (peerCar.active != 1) {
    entities.p2 = { x: -40, y: -40, p0: 0, visible: 0 };
    return;
  }

  const p2Lift = peerCar.finishTick > 0
    ? Math.sin((peerCar.finishTick / 720) * Math.PI) * 24
    : 0;
  const visible = inCameraRange(peerCar.y, cam, 96) ? 1 : 0;

  entities.p2 = {
    x: peerCar.x,
    y: peerCar.y - cam - p2Lift,
    p0: peerCarAnim(peerCar),
    visible: visible
  };
}

function placeEntities(s, cam, slots) {
  const entities = {};

  const p1Lift = s.p1.finishTick > 0
    ? Math.sin((s.p1.finishTick / 720) * Math.PI) * 24
    : 0;

  entities.p1 = {
    x: s.p1.x,
    y: s.p1.y - cam - p1Lift,
    p0: playerAnim(s.p1),
    visible: 1
  };

  if (slots == 2) {
    const p2Lift = s.p2.finishTick > 0
      ? Math.sin((s.p2.finishTick / 720) * Math.PI) * 24
      : 0;
    entities.p2 = {
      x: s.p2.x,
      y: s.p2.y - cam - p2Lift,
      p0: playerAnim(s.p2),
      visible: 1
    };
  } else {
    entities.p2 = { x: -40, y: -40, p0: 0, visible: 0 };
    placePeerCar(entities, cam);
  }

  let i = 0;
  while (i < MAX_TRAFFIC) {
    const t = s.traffic[i];
    const tVisible = t.alive == 1 && inCameraRange(t.y, cam, 48);
    entities["t" + i] = {
      x: t.x,
      y: t.y - cam,
      p0: 0,
      visible: tVisible ? 1 : 0
    };
    i = i + 1;
  }

  let p = 0;
  while (p < MAX_PICKUPS) {
    if (s.pickups[p].taken == 0) {
      const wp = pickupWorldPos(p);
      const pVisible = inCameraRange(wp.y, cam, 36);
      entities["k" + p] = {
        x: wp.x,
        y: wp.y - cam,
        p0: 0,
        visible: pVisible ? 1 : 0
      };
    } else {
      entities["k" + p] = {
        x: -40,
        y: -40,
        p0: 0,
        visible: 0
      };
    }
    p = p + 1;
  }

  let o = 0;
  while (o < MAX_OBSTACLES) {
    const ow = obstacleWorldPos(o);
    const oVisible = inCameraRange(ow.y, cam, 44);
    entities["o" + o] = {
      x: ow.x,
      y: ow.y - cam,
      p0: 0,
      visible: oVisible ? 1 : 0
    };
    o = o + 1;
  }

  let f = 0;
  while (f < MAX_FX) {
    const fx = s.fx[f];
    const fxVisible = fx.active == 1 && inCameraRange(fx.y, cam, 40);
    entities["fx" + f] = {
      x: fx.x,
      y: fx.y - cam,
      p0: 0,
      visible: fxVisible ? 1 : 0
    };
    f = f + 1;
  }

  return entities;
}

function speedKmh(speed) {
  return clamp((speed * 360) | 0, 0, 220);
}

function bar(value, max, count) {
  let out = "";
  let i = 0;
  const filled = ((value / max) * count) | 0;

  while (i < count) {
    out = out + (i < filled ? "#" : ".");
    i = i + 1;
  }

  return out;
}

function hud(props) {
  const s = props.state;

  const sec = clamp((s.timeLeft / 1000) | 0, 0, 999);
  const p1Speed = speedKmh(s.p1.speed);
  const p1Score = s.p1.score | 0;

  let top = "TIME " + sec + "   SCORE " + p1Score;
  let second =
    "P1 " + p1Speed + " KM/H  TURBO [" + bar(s.p1.turbo, 100, 8) + "]  DMG " + s.p1.damage;

  if (isSplitPane()) {
    if (paneIndex == 0) {
      top = "LEFT  TIME " + sec + "   SCORE " + p1Score;
    } else {
      top = "RIGHT TIME " + sec + "   SCORE " + p1Score;
    }
  } else if (s.playerSlots == 2) {
    second =
      "P1 " + p1Speed + "  P2 " + speedKmh(s.p2.speed) +
      "  LEAD " + (((s.p2.y - s.p1.y) / 10) | 0);
  }

  let center = "";
  if (s.messageTick > 0) {
    center = s.message;
  }
  if (s.p1.finishTick > 0) {
    center = "JUMP!";
  }

  if (s.winner == 1) {
    center = "P1 WINS!";
  }
  if (s.winner == 2) {
    center = "P2 WINS!";
  }
  if (s.winner == 3) {
    center = "TIME UP";
  }

  return (
    <View flexDirection="column" padding="4px" background="#071018cc">
      <Label text={top} color="#e9f6ff" fontSize="11px" />
      <Label text={second} color="#7fe7ff" fontSize="9px" />
      <Label text={center} color="#ffd86b" fontSize="12px" />
    </View>
  );
}

function copyArray(src) {
  const out = [];
  let i = 0;

  while (i < src.length) {
    out.push(src[i]);
    i = i + 1;
  }

  return out;
}

function pushEvents(dest, src) {
  let i = 0;

  while (i < src.length) {
    dest.push(src[i]);
    i = i + 1;
  }
}

function update(props) {
  const s = props.state;
  const dt = props.dt;
  const slots = playerSlots();
  const dual = slots == 2;

  if (s.winner != 0) {
    return {
      showNet: 0,
      playerSlots: slots,
      cameraY: s.cameraY,
      p1: s.p1,
      p2: s.p2,
      traffic: s.traffic,
      pickups: s.pickups,
      fx: s.fx,
      entities: s.entities,
      timeLeft: s.timeLeft,
      winner: s.winner,
      message: s.message,
      messageTick: s.messageTick
    };
  }

  const events = [];
  const traffic = copyArray(s.traffic);
  const pickups = copyArray(s.pickups);
  const fx = copyArray(s.fx);

  const inp1 = readPlayer(props, 0);
  const u1 = updatePlayer(s.p1, inp1, dt, fx);
  let p1 = u1.player;
  pushEvents(events, u1.events);

  let p2 = s.p2;

  if (dual) {
    const inp2 = readPlayer(props, 1);
    const u2 = updatePlayer(s.p2, inp2, dt, fx);
    p2 = u2.player;
    pushEvents(events, u2.events);
  }

  updateTraffic(traffic, dt, p1.y, p2.y, dual);

  p1 = applyTrafficHits(p1, traffic, fx, events);
  p1 = applyObstacles(p1, fx, events);
  p1 = applyPickups(p1, pickups, events);

  if (dual) {
    p2 = applyTrafficHits(p2, traffic, fx, events);
    p2 = applyObstacles(p2, fx, events);
    p2 = applyPickups(p2, pickups, events);
  }

  let timeLeft = s.timeLeft - dt;
  let message = s.message;
  let messageTick = s.messageTick - dt;

  const cp1 = applyCheckpoint(p1);
  p1 = cp1.player;

  if (cp1.bonus > 0) {
    timeLeft = timeLeft + cp1.bonus;
    message = cp1.message;
    messageTick = 1300;
    events.push(soundEvent("win"));
  }

  if (dual) {
    const cp2 = applyCheckpoint(p2);
    p2 = cp2.player;

    if (cp2.bonus > 0) {
      timeLeft = timeLeft + cp2.bonus;
      message = "P2 " + cp2.message;
      messageTick = 1300;
      events.push(soundEvent("win"));
    }
  }

  let winner = 0;

  if (p1.y <= FINISH_Y) {
    winner = 1;
    events.push(soundEvent("win"));
    events.push(soundEvent("bounce"));
  } else if (dual && p2.y <= FINISH_Y) {
    winner = 2;
    events.push(soundEvent("win"));
    events.push(soundEvent("bounce"));
  } else if (timeLeft <= 0) {
    timeLeft = 0;
    winner = 3;
    events.push(soundEvent("lose"));
  }

  updateFx(fx, dt);

  const cameraY = computeCamera(p1, p2, dual);
  const entities = placeEntities(
    { p1: p1, p2: p2, traffic: traffic, pickups: pickups, fx: fx },
    cameraY,
    slots
  );

  return {
    showNet: 0,
    playerSlots: slots,
    cameraY: cameraY,
    p1: p1,
    p2: p2,
    traffic: traffic,
    pickups: pickups,
    fx: fx,
    entities: entities,
    timeLeft: timeLeft,
    winner: winner,
    message: message,
    messageTick: messageTick,
    events: events
  };
}