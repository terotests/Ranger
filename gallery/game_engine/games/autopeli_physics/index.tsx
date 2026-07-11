/// <reference path="../../scripting/game.d.ts" />
//
// Autopeli Physics — denser traffic edition.
// Physics I/O: return state.physics { controls, impulses }; read state.physicsContacts (phase "begin").
//

const VIEW_W = 480;
const VIEW_H = 270;
const WORLD_H = 6000;
const ROAD_STEP = 80;

// Player car PNGs (trimmed RGBA). Scale applies to cropped frame — keep ~4 to match pre-crop size.
const CAR1_IMG_W = 471;
const CAR1_IMG_H = 909;
const CAR2_IMG_W = 471;
const CAR2_IMG_H = 908;
const CAR_SCALE = 4;

// Mass (kg) — collision response uses invMass; car ~1200 kg, cone ~3 kg.
const CAR_MASS_KG = 1200;
const CONE_MASS_KG = 3;

// Yaw stabilizer: soft damping when spin exceeds these (deg/s).
const SPIN_DAMP_START = 200;
const SPIN_DAMP_FULL = 420;

// Brake screech: one-shot while hard braking (long cooldown avoids ticking).
const BRAKE_SCREECH_MIN_SPD = 75;
const BRAKE_SCREECH_CD_MS = 900;

// Trimmed asset PNGs (checkerboard removed, alpha + crop).
const CONE_IMG_W = 204;
const CONE_IMG_H = 275;
const CONE_SCALE = 9;
const CONE_FEET = 252;

const OIL_IMG_W = 891;
const OIL_IMG_H = 706;
const OIL_SCALE = 9;
const OIL_FEET = 353;

const TRAFFIC_IMG_W = 285;
const TRAFFIC_IMG_H = 625;
// Same on-screen width as player: 471*4/100 ≈ 285*7/100 ≈ 19 px
const TRAFFIC_SCALE = 7;
const TRAFFIC_FEET = 312;

const ROAD_POINTS = [
  // Widened version of the same course so dense traffic and obstacles are easier to pass.
  { y: 6000, x: 240, half: 126 },
  { y: 5600, x: 220, half: 104 },
  { y: 5200, x: 200, half: 78 },
  { y: 4800, x: 250, half: 96 },
  { y: 4400, x: 300, half: 114 },
  { y: 4000, x: 255, half: 94 },
  { y: 3600, x: 210, half: 108 },
  { y: 3200, x: 250, half: 94 },
  { y: 2800, x: 310, half: 110 },
  { y: 2400, x: 250, half: 92 },
  { y: 2000, x: 170, half: 98 },
  { y: 1600, x: 220, half: 90 },
  { y: 1200, x: 290, half: 104 },
  { y: 800, x: 250, half: 88 },
  { y: 400, x: 210, half: 74 },
  { y: 100, x: 240, half: 112 }
];

function roadAt(y) {
  let i = 0;
  while (i < ROAD_POINTS.length - 1) {
    const a = ROAD_POINTS[i];
    const b = ROAD_POINTS[i + 1];
    if (y <= a.y && y >= b.y) {
      const span = a.y - b.y;
      let t = 0;
      if (span > 0) {
        t = (a.y - y) / span;
      }
      return {
        center: a.x + (b.x - a.x) * t,
        half: a.half + (b.half - a.half) * t
      };
    }
    i = i + 1;
  }
  const last = ROAD_POINTS[ROAD_POINTS.length - 1];
  return { center: last.x, half: last.half };
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

function decayTimer(cd, dt) {
  let v = cd - dt;
  if (v < 0) {
    return 0;
  }
  return v;
}

function roundVal(v) {
  if (v >= 0) {
    return (v + 0.5) | 0;
  }
  return (v - 0.5) | 0;
}

function isSplitPane() {
  return paneIndex >= 0;
}

function isAuthorityPane() {
  return !isSplitPane() || paneIndex === 0;
}

function localPlayerId() {
  if (isSplitPane() && paneIndex === 1) {
    return "p2";
  }
  return "p1";
}

function readLocalBtn(props) {
  return readBtn(props, 0);
}

function laneX(y, lane, margin) {
  const r = roadAt(y);
  const usable = r.half - margin;
  return r.center + usable * clamp(lane, -1, 1);
}

const OIL_PATCHES = [
  { id: "oil0", y: 5460, lane: 0.35, r: 34 },
  { id: "oil1", y: 5050, lane: -0.45, r: 30 },
  { id: "oil2", y: 4300, lane: 0.42, r: 38 },
  { id: "oil3", y: 3740, lane: -0.28, r: 32 },
  { id: "oil4", y: 3060, lane: 0.5, r: 36 },
  { id: "oil5", y: 2480, lane: -0.5, r: 40 },
  { id: "oil6", y: 1780, lane: 0.34, r: 34 },
  { id: "oil7", y: 1080, lane: -0.35, r: 31 },
  { id: "oil8", y: 560, lane: 0.25, r: 28 }
];

const CONES = [
  // Opening slalom.
  { id: "c0", y: 5660, lane: -0.55 },
  { id: "c1", y: 5585, lane: 0.5 },
  { id: "c2", y: 5510, lane: -0.45 },
  { id: "c3", y: 5435, lane: 0.42 },

  // Narrow roadworks gate.
  { id: "c4", y: 5100, lane: -0.72 },
  { id: "c5", y: 5100, lane: 0.72 },
  { id: "c6", y: 5015, lane: -0.55 },
  { id: "c7", y: 5015, lane: 0.55 },

  // Mid-course slaloms.
  { id: "c8", y: 4580, lane: -0.55 },
  { id: "c9", y: 4500, lane: 0.52 },
  { id: "c10", y: 4420, lane: -0.48 },
  { id: "c11", y: 4040, lane: 0.58 },
  { id: "c12", y: 3960, lane: -0.5 },
  { id: "c13", y: 3880, lane: 0.42 },

  // Chicane.
  { id: "c14", y: 3330, lane: -0.72 },
  { id: "c15", y: 3260, lane: -0.35 },
  { id: "c16", y: 3190, lane: 0.35 },
  { id: "c17", y: 3120, lane: 0.72 },

  // Late race pressure.
  { id: "c18", y: 2280, lane: 0.58 },
  { id: "c19", y: 2200, lane: -0.5 },
  { id: "c20", y: 2120, lane: 0.45 },
  { id: "c21", y: 1460, lane: -0.6 },
  { id: "c22", y: 1380, lane: 0.52 },
  { id: "c23", y: 1300, lane: -0.42 },
  { id: "c24", y: 760, lane: -0.62 },
  { id: "c25", y: 700, lane: 0.62 },
  { id: "c26", y: 500, lane: -0.45 },
  { id: "c27", y: 440, lane: 0.45 }
];

// Static barrier poles (palkit) — solid obstacles, not movable props.
const BARS = [
  { id: "b0", y: 5220, lane: -0.42, w: 8, h: 46 },
  { id: "b1", y: 5220, lane: 0.42, w: 8, h: 46 },
  { id: "b2", y: 4200, lane: -0.38, w: 8, h: 44 },
  { id: "b3", y: 4140, lane: 0.38, w: 8, h: 44 },
  { id: "b4", y: 2920, lane: -0.4, w: 8, h: 46 },
  { id: "b5", y: 2860, lane: 0.4, w: 8, h: 46 },
  { id: "b6", y: 1900, lane: -0.38, w: 8, h: 44 },
  { id: "b7", y: 1840, lane: 0.38, w: 8, h: 44 },
  { id: "b8", y: 980, lane: -0.4, w: 8, h: 46 },
  { id: "b9", y: 920, lane: 0.4, w: 8, h: 46 }
];

const CONE_R = 9;

const RAMPS = [
  { y: 5350, lane: 0.05, w: 38, h: 22 },
  { y: 4720, lane: -0.42, w: 34, h: 20 },
  { y: 3500, lane: 0.38, w: 40, h: 22 },
  { y: 2640, lane: -0.35, w: 38, h: 20 },
  { y: 1160, lane: 0.32, w: 36, h: 20 }
];

const TRAFFIC = [
  { id: "t0", y: 5520, lane: -0.58, maxSpeed: 132, throttle: 0.45, weave: 4, weaveSpeed: 0.0012, phase: 0.2 },
  { id: "t1", y: 5260, lane: 0.5, maxSpeed: 118, throttle: 0.39, weave: 7, weaveSpeed: 0.0010, phase: 1.4 },
  { id: "t2", y: 4930, lane: -0.18, maxSpeed: 148, throttle: 0.49, weave: 3, weaveSpeed: 0.0015, phase: 2.2 },
  { id: "t3", y: 4590, lane: 0.62, maxSpeed: 124, throttle: 0.42, weave: 5, weaveSpeed: 0.0013, phase: 3.1 },
  { id: "t4", y: 4270, lane: -0.58, maxSpeed: 158, throttle: 0.52, weave: 4, weaveSpeed: 0.0012, phase: 4.5 },
  { id: "t5", y: 3950, lane: 0.2, maxSpeed: 112, throttle: 0.37, weave: 8, weaveSpeed: 0.0009, phase: 0.8 },
  { id: "t6", y: 3610, lane: -0.62, maxSpeed: 142, throttle: 0.47, weave: 4, weaveSpeed: 0.0014, phase: 5.4 },
  { id: "t7", y: 3280, lane: 0.58, maxSpeed: 128, throttle: 0.43, weave: 6, weaveSpeed: 0.0011, phase: 2.7 },
  { id: "t8", y: 2940, lane: -0.1, maxSpeed: 166, throttle: 0.54, weave: 3, weaveSpeed: 0.0016, phase: 1.9 },
  { id: "t9", y: 2570, lane: 0.62, maxSpeed: 120, throttle: 0.4, weave: 7, weaveSpeed: 0.0010, phase: 3.8 },
  { id: "t10", y: 2190, lane: -0.58, maxSpeed: 150, throttle: 0.5, weave: 5, weaveSpeed: 0.0013, phase: 5.9 },
  { id: "t11", y: 1810, lane: 0.26, maxSpeed: 116, throttle: 0.38, weave: 8, weaveSpeed: 0.0009, phase: 4.1 },
  { id: "t12", y: 1420, lane: -0.62, maxSpeed: 138, throttle: 0.46, weave: 4, weaveSpeed: 0.0014, phase: 0.5 },
  { id: "t13", y: 1040, lane: 0.58, maxSpeed: 155, throttle: 0.51, weave: 5, weaveSpeed: 0.0012, phase: 2.9 },
  { id: "t14", y: 650, lane: -0.2, maxSpeed: 126, throttle: 0.42, weave: 7, weaveSpeed: 0.0010, phase: 5.1 }
];

function config() {
  return {
    world: { width: VIEW_W, height: WORLD_H },
    physics: { enabled: true, sharedWorld: true, fixedStep: 16.666 }
  };
}

function staticLevelHeight() {
  return WORLD_H;
}

function patchX(o) {
  return laneX(o.y, o.lane, 18);
}

function rampX(r) {
  return laneX(r.y, r.lane, 24);
}

function obstacleX(o, margin) {
  return laneX(o.y, o.lane, margin);
}

function surfaceGrip(x, y) {
  let grip = 1.0;
  const r = roadAt(y);
  const edge = r.half - 16;
  const off = x - r.center;
  if (off < 0) {
    if (0 - off > edge) {
      grip = 0.45;
    }
  } else {
    if (off > edge) {
      grip = 0.45;
    }
  }

  let oi = 0;
  while (oi < OIL_PATCHES.length) {
    const o = OIL_PATCHES[oi];
    const dx = x - patchX(o);
    const dy = y - o.y;
    if (dx * dx + dy * dy < o.r * o.r) {
      grip = 0.08;
    }
    oi = oi + 1;
  }
  return grip;
}

function onOil(x, y) {
  let oi = 0;
  while (oi < OIL_PATCHES.length) {
    const o = OIL_PATCHES[oi];
    const dx = x - patchX(o);
    const dy = y - o.y;
    if (dx * dx + dy * dy < o.r * o.r) {
      return true;
    }
    oi = oi + 1;
  }
  return false;
}

function oilSpin(entity, cmd, now) {
  if (!entity) {
    return 0;
  }
  const spd = entity.speed || 0;
  if (spd < 18) {
    return 0;
  }
  const wobble = Math.sin(now * 0.012 + entity.x * 0.06 + entity.y * 0.04) * spd * 0.14;
  const steerSpin = cmd.steer * spd * 0.32;
  return wobble + steerSpin;
}

function spinStabilizerImpulse(entity) {
  if (!entity || entity.angularVel == null) {
    return 0;
  }
  const av = entity.angularVel;
  let abs = av;
  if (abs < 0) {
    abs = 0 - abs;
  }
  if (abs < SPIN_DAMP_START) {
    return 0;
  }
  let t = (abs - SPIN_DAMP_START) / (SPIN_DAMP_FULL - SPIN_DAMP_START);
  if (t > 1) {
    t = 1;
  }
  const strength = 0.1 + t * 0.2;
  return (0 - av) * strength;
}

function pushSpinStabilizer(impulses, id, entity, enabled) {
  if (!enabled || !entity) {
    return;
  }
  const damp = spinStabilizerImpulse(entity);
  if (damp !== 0) {
    impulses.push({ body: id, angular: damp });
  }
}

function physicsBounds() {
  const bounds = [];
  let y = 0;
  while (y < WORLD_H) {
    const r = roadAt(y);
    const y2 = y + ROAD_STEP;
    const r2 = roadAt(y2);
    bounds.push({
      kind: "segment",
      id: "L" + y,
      x1: r.center - r.half,
      y1: y,
      x2: r2.center - r2.half,
      y2: y2,
      restitution: 0.32,
      spinOnHit: 280
    });
    bounds.push({
      kind: "segment",
      id: "R" + y,
      x1: r.center + r.half,
      y1: y,
      x2: r2.center + r2.half,
      y2: y2,
      restitution: 0.32,
      spinOnHit: 280
    });
    y = y + ROAD_STEP;
  }
  return bounds;
}

function sheetSprite(id, path, frameW, frameH, scale, feetTrim) {
  return {
    id: id,
    kind: "sheet",
    path: path,
    frameW: frameW,
    frameH: frameH,
    cols: 1,
    rows: 1,
    scale: scale,
    feetTrim: feetTrim
  };
}

function carSprite(id, path, frameW, frameH) {
  return sheetSprite(id, path, frameW, frameH, CAR_SCALE, roundVal(frameH / 2));
}

function sprites() {
  return [
    carSprite("p1", "assets/car1.png", CAR1_IMG_W, CAR1_IMG_H),
    carSprite("p2", "assets/car2.png", CAR2_IMG_W, CAR2_IMG_H),
    sheetSprite("trafficCar", "assets/othercar.png", TRAFFIC_IMG_W, TRAFFIC_IMG_H, TRAFFIC_SCALE, TRAFFIC_FEET),
    sheetSprite("cone", "assets/cone.png", CONE_IMG_W, CONE_IMG_H, CONE_SCALE, CONE_FEET),
    sheetSprite("oil", "assets/oil.png", OIL_IMG_W, OIL_IMG_H, OIL_SCALE, OIL_FEET),
    { id: "bar", kind: "rect", w: 8, h: 46, r: 210, g: 215, b: 225 }
  ];
}

function coneEntity(o) {
  return {
    id: o.id,
    sprite: "cone",
    position: { x: obstacleX(o, 16), y: o.y },
    collision: { r: CONE_R },
    mass: CONE_MASS_KG,
    inertia: 12,
    drag: 0.93,
    maxSpeed: 620,
    restitution: 0.48,
    spinOnWall: 28,
    angularDamping: 0.92,
    angularStop: 1.5
  };
}

function barEntity(o) {
  return {
    id: o.id,
    sprite: "bar",
    position: { x: obstacleX(o, 20), y: o.y },
    static: true,
    collision: { w: o.w, h: o.h },
    restitution: 0.26,
    spinOnWall: 240
  };
}

function oilEntity(o) {
  return {
    id: o.id,
    sprite: "oil",
    position: { x: patchX(o), y: o.y },
    static: true,
    physics: false
  };
}

function carBody(id, sprite, x, y, maxSpeed, grip, ai) {
  let driveFront = 1;
  let driveRear = 1;
  if (ai) {
    driveFront = 0;
    driveRear = 1;
  }
  return {
    id: id,
    sprite: sprite,
    position: { x: x, y: y },
    angle: 0,
    vehicle: {
      chassis: ai ? { w: 11, h: 16 } : { w: 14, h: 20 },
      mass: CAR_MASS_KG,
      inertia: 820,
      wheelInertia: 0.12,
      maxSpeed: maxSpeed,
      accel: ai ? 430 : 520,
      brake: 920,
      drag: 0.94,
      steerRate: ai ? 92 : 118,
      steerAngle: ai ? 0.32 : 0.38,
      lateralGrip: ai ? 58 : 56,
      maxLateralForce: ai ? 205 : 195,
      grip: grip,
      slipThreshold: 0.62,
      slipSpin: 0.024,
      angularDamping: 0.94,
      angularStop: 4,
      restitution: 0.35,
      spinOnWall: 240,
      wheels: [
        { offsetX: -9, offsetY: -12, w: 5, h: 9, drive: driveFront, steer: true },
        { offsetX: 9, offsetY: -12, w: 5, h: 9, drive: driveFront, steer: true },
        { offsetX: -9, offsetY: 12, w: 5, h: 9, drive: driveRear },
        { offsetX: 9, offsetY: 12, w: 5, h: 9, drive: driveRear }
      ]
    }
  };
}

function entities() {
  const out = [];
  const start = roadAt(WORLD_H - 140);
  out.push(carBody("p1", "p1", start.center - 28, WORLD_H - 140, 310, 1.0, false));
  out.push(carBody("p2", "p2", start.center + 28, WORLD_H - 140, 310, 1.0, false));

  let ti = 0;
  while (ti < TRAFFIC.length) {
    const t = TRAFFIC[ti];
    out.push(carBody(t.id, "trafficCar", laneX(t.y, t.lane, 22), t.y, t.maxSpeed, 0.95, true));
    ti = ti + 1;
  }

  let ci = 0;
  while (ci < CONES.length) {
    out.push(coneEntity(CONES[ci]));
    ci = ci + 1;
  }

  let bi = 0;
  while (bi < BARS.length) {
    out.push(barEntity(BARS[bi]));
    bi = bi + 1;
  }

  let oi = 0;
  while (oi < OIL_PATCHES.length) {
    out.push(oilEntity(OIL_PATCHES[oi]));
    oi = oi + 1;
  }
  return out;
}

function camera() {
  if (paneIndex === 1) {
    return {
      follow: "p2",
      mode: "vertical",
      offsetY: -90,
      smoothing: 0.12,
      bounds: { x: 0, y: 0, w: VIEW_W, h: WORLD_H }
    };
  }
  return {
    follow: "p1",
    mode: "vertical",
    offsetY: -90,
    smoothing: 0.12,
    bounds: { x: 0, y: 0, w: VIEW_W, h: WORLD_H }
  };
}

function createStaticBg() {
  bgClear(18, 32, 22);
  let y = 0;
  while (y < WORLD_H) {
    const r = roadAt(y);
    const left = r.center - r.half;
    const right = r.center + r.half;
    bgFillRect(0, y, left, 8, 14, 28, 18);
    bgFillRect(left, y, r.half * 2, 8, 52, 58, 64);
    bgFillRect(right, y, VIEW_W - right, 8, 14, 28, 18);

    // Center line and edge markers make the speed easier to read.
    if (y % 80 === 0) {
      bgFillRect(r.center - 2, y, 4, 24, 240, 220, 80);
    }
    if (y % 48 < 8) {
      bgFillRect(left + 5, y, 3, 8, 225, 225, 225);
      bgFillRect(right - 8, y, 3, 8, 225, 225, 225);
    }

    let ri = 0;
    while (ri < RAMPS.length) {
      const ramp = RAMPS[ri];
      if (ramp.y >= y && ramp.y < y + 8) {
        const rx = rampX(ramp);
        bgFillRect(rx - ramp.w / 2, ramp.y, ramp.w, ramp.h, 225, 180, 70);
        bgFillRect(rx - ramp.w / 2, ramp.y, ramp.w, 4, 255, 225, 120);
      }
      ri = ri + 1;
    }

    let bi = 0;
    while (bi < BARS.length) {
      const bar = BARS[bi];
      if (bar.y >= y && bar.y < y + 8) {
        const bx = obstacleX(bar, 20);
        bgFillRect(bx - bar.w / 2, bar.y - bar.h / 2, bar.w, bar.h, 210, 215, 225);
        bgFillRect(bx - bar.w / 2 - 1, bar.y - bar.h / 2, 2, bar.h, 255, 230, 70);
        bgFillRect(bx + bar.w / 2 - 1, bar.y - bar.h / 2, 2, bar.h, 255, 230, 70);
      }
      bi = bi + 1;
    }

    y = y + 8;
  }
}

function initState() {
  return {
    score: 0,
    hits: 0,
    playerSlots: 2,
    someoneWon: false,
    airTick: { p1: 0, p2: 0 },
    rampCd: { p1: 0, p2: 0 },
    brakeCd: { p1: 0, p2: 0 }
  };
}

function hearsPlayer(playerId) {
  if (!isSplitPane()) {
    return true;
  }
  return localPlayerId() === playerId;
}

function playSoundEvent(id) {
  return { kind: "playSound", id: id };
}

function rumbleForPlayer(playerId, ms, strength) {
  let pad = 0;
  if (playerId === "p2") {
    pad = 1;
  }
  let str = 18000;
  if (strength != null) {
    str = strength;
  }
  let dur = 90;
  if (ms != null) {
    dur = ms;
  }
  return { kind: "rumble", pad: pad, low: str, high: str, ms: dur };
}

function collisionRumble(events, playerId, impulse, kind) {
  let imp = impulse != null ? impulse : 0;
  if (imp < 22) {
    return;
  }
  let ms = 45;
  let str = 9000;
  if (kind === "cone") {
    ms = 38;
    str = 6500 + clamp(imp * 40, 0, 9000);
  } else if (kind === "traffic") {
    ms = 55 + clamp(imp * 0.35, 0, 100);
    str = 12000 + clamp(imp * 70, 0, 18000);
  } else {
    ms = 60 + clamp(imp * 0.45, 0, 130);
    str = 14000 + clamp(imp * 90, 0, 24000);
  }
  events.push(rumbleForPlayer(playerId, ms, str));
}

function pushCollisionFeedback(events, playerId, otherId, c) {
  const imp = c.normalImpulse != null ? c.normalImpulse : 0;
  if (isWall(otherId) || isBar(otherId) || isTraffic(otherId)) {
    if (imp >= 18) {
      events.push(playSoundEvent("wall"));
    }
    let kind = "wall";
    if (isTraffic(otherId)) {
      kind = "traffic";
    }
    collisionRumble(events, playerId, imp, kind);
    return;
  }
  if (isCone(otherId)) {
    events.push(playSoundEvent("bounce"));
    collisionRumble(events, playerId, imp, "cone");
  }
}

function tickBrakeAudio(events, slot, car, cmd, brakeCd, dt) {
  if (slot === "p1") {
    if (!hearsPlayer("p1")) {
      return;
    }
    brakeCd.p1 = decayTimer(brakeCd.p1, dt);
    if (!car || cmd.brake <= 0 || brakeCd.p1 > 0) {
      return;
    }
    const spd = car.speed != null ? car.speed : 0;
    if (spd >= BRAKE_SCREECH_MIN_SPD) {
      events.push(playSoundEvent("bounce"));
      brakeCd.p1 = BRAKE_SCREECH_CD_MS;
    }
    return;
  }

  if (!hearsPlayer("p2")) {
    return;
  }
  brakeCd.p2 = decayTimer(brakeCd.p2, dt);
  if (!car || cmd.brake <= 0 || brakeCd.p2 > 0) {
    return;
  }
  const spd2 = car.speed != null ? car.speed : 0;
  if (spd2 >= BRAKE_SCREECH_MIN_SPD) {
    events.push(playSoundEvent("bounce"));
    brakeCd.p2 = BRAKE_SCREECH_CD_MS;
  }
}

function driveInput(btn) {
  let steer = 0;
  let throttle = 0;
  let brake = 0;
  if (btn.left) {
    steer = -1;
  }
  if (btn.right) {
    steer = 1;
  }
  if (btn.up) {
    throttle = 1;
  }
  if (btn.down) {
    brake = 1;
    throttle = 0;
  }
  return { steer: steer, throttle: throttle, brake: brake };
}

function readBtn(props, index) {
  const inp = props.input;
  if (inp && inp.players && inp.players[index]) {
    return inp.players[index];
  }
  if (index === 0) {
    return {
      up: props.up,
      down: props.down,
      left: props.left,
      right: props.right
    };
  }
  return { up: false, down: false, left: false, right: false };
}

function hitRamp(x, y) {
  let i = 0;
  while (i < RAMPS.length) {
    const r = RAMPS[i];
    const rx = rampX(r);
    if (x >= rx - r.w / 2 && x <= rx + r.w / 2) {
      if (y >= r.y && y <= r.y + r.h) {
        return true;
      }
    }
    i = i + 1;
  }
  return false;
}

function isPlayer(id) {
  return id === "p1" || id === "p2";
}

function isTraffic(id) {
  if (id.length < 2 || id.charAt(0) !== "t") {
    return false;
  }
  return true;
}

function isWall(id) {
  if (id.length < 1) {
    return false;
  }
  const c = id.charAt(0);
  return c === "L" || c === "R";
}

function isCone(id) {
  return id.length > 0 && id.charAt(0) === "c";
}

function isBar(id) {
  return id.length > 0 && id.charAt(0) === "b";
}

function coneLaunchImpulse(c, playerId, car) {
  let nx = c.nx != null ? c.nx : 0;
  let ny = c.ny != null ? c.ny : 1;
  if (c.bodyB === playerId) {
    nx = 0 - nx;
    ny = 0 - ny;
  }
  let lvx = nx * 60;
  let lvy = ny * 60;
  if (car) {
    const cvx = car.vx != null ? car.vx : 0;
    const cvy = car.vy != null ? car.vy : 0;
    const share = CAR_MASS_KG / (CAR_MASS_KG + CONE_MASS_KG);
    lvx = cvx * share * 0.25 + nx * 25;
    lvy = cvy * share * 0.25 + ny * 25;
  }
  return {
    linear: { x: lvx, y: lvy },
    angular: nx * 200 + ny * 90
  };
}

function trafficControl(entity, t, now) {
  if (!entity) {
    return { steer: 0, throttle: t.throttle, brake: 0, grip: 0.95 };
  }

  // Look ahead and aim for a moving point inside the chosen lane.
  const lookAheadY = entity.y - 115;
  const road = roadAt(lookAheadY);
  const wave = Math.sin(now * t.weaveSpeed + t.phase) * t.weave;
  const targetX = road.center + (road.half - 23) * t.lane + wave;
  const error = targetX - entity.x;
  let steer = clamp(error / 34, -1, 1);

  // Stronger correction near the road edge.
  const here = roadAt(entity.y);
  const safeLeft = here.center - here.half + 16;
  const safeRight = here.center + here.half - 16;
  if (entity.x < safeLeft) {
    steer = 1;
  }
  if (entity.x > safeRight) {
    steer = -1;
  }

  return {
    steer: steer,
    throttle: t.throttle,
    brake: 0,
    grip: surfaceGrip(entity.x, entity.y)
  };
}

function update(props) {
  const s = props.state;
  const events = [];
  let hits = s.hits;
  let score = s.score;
  let someoneWon = s.someoneWon;
  const airTick = { p1: s.airTick.p1, p2: s.airTick.p2 };
  const rampCd = { p1: s.rampCd.p1, p2: s.rampCd.p2 };
  let brakeP1 = 0;
  let brakeP2 = 0;
  if (s.brakeCd) {
    brakeP1 = s.brakeCd.p1 != null ? s.brakeCd.p1 : 0;
    brakeP2 = s.brakeCd.p2 != null ? s.brakeCd.p2 : 0;
  }
  const brakeCd = { p1: brakeP1, p2: brakeP2 };
  const now = props.time || 0;
  const we = s.worldEntities;

  const impulses = [];
  const contacts = s.physicsContacts;
  if (contacts) {
    let ci = 0;
    while (ci < contacts.length) {
      const c = contacts[ci];
      if (c && c.phase === "begin") {
        let playerId = "";
        let otherId = "";
        if (isPlayer(c.bodyA)) {
          playerId = c.bodyA;
          otherId = c.bodyB;
        } else if (isPlayer(c.bodyB)) {
          playerId = c.bodyB;
          otherId = c.bodyA;
        }

        if (playerId !== "") {
          if (isAuthorityPane()) {
            if (isWall(otherId)) {
              hits = hits + 1;
              if (c.normalImpulse != null && c.normalImpulse > 80) {
                events.push({ kind: "particles", id: "sparkle", x: c.x, y: c.y, amount: 6 });
              }
            }

            if (isCone(otherId)) {
              const car = we ? we[playerId] : null;
              const launch = coneLaunchImpulse(c, playerId, car);
              impulses.push({
                body: otherId,
                linear: launch.linear,
                angular: launch.angular
              });
            }

            if (isBar(otherId)) {
              hits = hits + 1;
              if (c.normalImpulse != null && c.normalImpulse > 45) {
                events.push({ kind: "particles", id: "sparkle", x: c.x, y: c.y, amount: 6 });
              }
            }

            if (isTraffic(otherId)) {
              hits = hits + 1;
              if (c.normalImpulse != null && c.normalImpulse > 55) {
                events.push({ kind: "particles", id: "sparkle", x: c.x, y: c.y, amount: 5 });
              }
            }
          }

          if (hearsPlayer(playerId)) {
            pushCollisionFeedback(events, playerId, otherId, c);
          }
        }
      }
      ci = ci + 1;
    }
  }

  let p1Cmd = { steer: 0, throttle: 0, brake: 0 };
  let p2Cmd = { steer: 0, throttle: 0, brake: 0 };
  const localCmd = driveInput(readLocalBtn(props));
  if (isSplitPane()) {
    if (localPlayerId() === "p1") {
      p1Cmd = localCmd;
    } else {
      p2Cmd = localCmd;
    }
  } else {
    p1Cmd = driveInput(readBtn(props, 0));
    p2Cmd = driveInput(readBtn(props, 1));
  }

  let p1Grip = 1.0;
  let p2Grip = 1.0;
  if (we && we.p1) {
    p1Grip = surfaceGrip(we.p1.x, we.p1.y);
  }
  if (we && we.p2) {
    p2Grip = surfaceGrip(we.p2.x, we.p2.y);
  }

  if (we) {
    if (we.p1 && onOil(we.p1.x, we.p1.y)) {
      impulses.push({ body: "p1", angular: oilSpin(we.p1, p1Cmd, now) });
    }
    if (we.p2 && onOil(we.p2.x, we.p2.y)) {
      impulses.push({ body: "p2", angular: oilSpin(we.p2, p2Cmd, now) });
    }

    pushSpinStabilizer(impulses, "p1", we.p1, !isSplitPane() || isAuthorityPane());
    pushSpinStabilizer(impulses, "p2", we.p2, !isSplitPane() || !isAuthorityPane());

    if ((!isSplitPane() || isAuthorityPane()) && we.p1 && rampCd.p1 <= 0 && hitRamp(we.p1.x, we.p1.y)) {
      impulses.push({ body: "p1", linear: { x: 0, y: -95 }, angular: 320 });
      rampCd.p1 = 700;
      airTick.p1 = 900;
      if (hearsPlayer("p1")) {
        events.push(playSoundEvent("bounce"));
        events.push(rumbleForPlayer("p1", 70, 12000));
      }
    }
    if ((!isSplitPane() || !isAuthorityPane()) && we.p2 && rampCd.p2 <= 0 && hitRamp(we.p2.x, we.p2.y)) {
      impulses.push({ body: "p2", linear: { x: 0, y: -95 }, angular: 320 });
      rampCd.p2 = 700;
      airTick.p2 = 900;
      if (hearsPlayer("p2")) {
        events.push(playSoundEvent("bounce"));
        events.push(rumbleForPlayer("p2", 70, 12000));
      }
    }
  }

  tickBrakeAudio(events, "p1", we ? we.p1 : null, p1Cmd, brakeCd, props.dt);
  tickBrakeAudio(events, "p2", we ? we.p2 : null, p2Cmd, brakeCd, props.dt);

  if (isAuthorityPane()) {
    if (rampCd.p1 > 0) {
      rampCd.p1 = decayTimer(rampCd.p1, props.dt);
    }
    if (rampCd.p2 > 0) {
      rampCd.p2 = decayTimer(rampCd.p2, props.dt);
    }
    if (airTick.p1 > 0) {
      airTick.p1 = decayTimer(airTick.p1, props.dt);
    }
    if (airTick.p2 > 0) {
      airTick.p2 = decayTimer(airTick.p2, props.dt);
    }

    if (we && !someoneWon) {
      if (we.p1 && we.p1.y < 140) {
        score = score + 5000;
        someoneWon = true;
        events.push({ kind: "playSound", id: "win" });
      } else if (we.p2 && we.p2.y < 140) {
        score = score + 5000;
        someoneWon = true;
        events.push({ kind: "playSound", id: "win" });
      }
    }
  } else {
    if (localPlayerId() === "p2") {
      if (rampCd.p2 > 0) {
        rampCd.p2 = decayTimer(rampCd.p2, props.dt);
      }
      if (airTick.p2 > 0) {
        airTick.p2 = decayTimer(airTick.p2, props.dt);
      }
    }
  }

  const controls: Record<string, PhysicsControl> = {};
  if (isSplitPane()) {
    if (localPlayerId() === "p1") {
      controls.p1 = { steer: p1Cmd.steer, throttle: p1Cmd.throttle, brake: p1Cmd.brake, grip: p1Grip };
    } else {
      controls.p2 = { steer: p2Cmd.steer, throttle: p2Cmd.throttle, brake: p2Cmd.brake, grip: p2Grip };
    }
    if (isAuthorityPane()) {
      let ti = 0;
      while (ti < TRAFFIC.length) {
        const t = TRAFFIC[ti];
        const entity = we ? we[t.id] : null;
        controls[t.id] = trafficControl(entity, t, now);
        ti = ti + 1;
      }
    }
  } else {
    controls.p1 = { steer: p1Cmd.steer, throttle: p1Cmd.throttle, brake: p1Cmd.brake, grip: p1Grip };
    controls.p2 = { steer: p2Cmd.steer, throttle: p2Cmd.throttle, brake: p2Cmd.brake, grip: p2Grip };
    let ti = 0;
    while (ti < TRAFFIC.length) {
      const t = TRAFFIC[ti];
      const entity = we ? we[t.id] : null;
      controls[t.id] = trafficControl(entity, t, now);
      ti = ti + 1;
    }
  }

  return {
    score: score,
    hits: hits,
    playerSlots: 2,
    someoneWon: someoneWon,
    airTick: airTick,
    rampCd: rampCd,
    brakeCd: brakeCd,
    physics: { controls: controls, impulses: impulses } as PhysicsStepInput,
    events: events
  };
}

function hud(props) {
  const s = props.state;
  const we = s.worldEntities;
  const followId = isSplitPane() && paneIndex === 1 ? "p2" : "p1";
  let spd = 0;
  let grip = 1;
  let progress = 0;
  const car = we ? we[followId] : null;
  if (car) {
    if (car.speed != null) {
      spd = car.speed;
    }
    grip = surfaceGrip(car.x, car.y);
    progress = clamp((WORLD_H - car.y) / (WORLD_H - 140), 0, 1);
  }

  let air = "";
  if (s.airTick && s.airTick[followId] > 0) {
    air = "  AIR!";
  }
  let oil = "";
  if (car && onOil(car.x, car.y)) {
    oil = "  OIL!";
  }

  return (
    <View flexDirection="row" padding="6px" width="100%">
      <Label color="#8fd3ff">SPD </Label>
      <Label color="#ffffff">{roundVal(spd)}</Label>
      <Label color="#6a7a9a">  grip={roundVal(grip * 100)}%</Label>
      <Label color="#8899bb">{oil}</Label>
      <Label color="#8ff0a4">  {roundVal(progress * 100)}%</Label>
      <Label color="#ffd080">  hits={s.hits}{air}</Label>
    </View>
  );
}