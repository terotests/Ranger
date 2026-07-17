/// <reference path="../../scripting/game.d.ts" />
//
// F1 Arcade — classic Pole Position-style pseudo-3D racer.
//
// Retained horizontal strip sprites project a perspective road. Roadside
// props (palms, houses, cheering crowds) and cars are real PNG sheets with
// pre-baked depth tiers (sheet cache is keyed by path, so each size is its
// own file — see tools/gen_sprites.py).
//
// Controls: Left/Right steer · Up or Space accelerate · Down brake
// Run: npm run engine:game-sdl:run:f1_arcade
//      or launcher → F1 Arcade

import { soundEvent } from "game_helpers";

const VIEW_W = 480;
const VIEW_H = 270;
const HORIZON = 88;
const STRIPS = 28;
const TRACK_LEN = 48;
const SEG_LEN = 220;
const Z_STEP = 42;
const CAR_TIERS = 4;
const AI_COUNT = 4;
const PROP_SLOTS = 8;
const PROP_TIERS = 3;
const START_TIME = 75;

// Pre-baked PNG sizes from tools/gen_sprites.py
const PALM_W = [20, 37, 64];
const PALM_H = [30, 55, 96];
const HOUSE_W = [20, 37, 64];
const HOUSE_H = [20, 37, 64];
const CROWD_FW = [23, 41, 72];
const CROWD_FH = [17, 32, 56];
const AI_W = [15, 26, 39, 56];
const AI_H = [11, 20, 29, 42];
const PLAYER_W = 56;
const PLAYER_H = 42;

const CURVES = [
  0, 0, 0, 0, 0, 0,
  1, 2, 2, 1, 0, 0,
  0, -1, -2, -2, -1, 0,
  0, 0, 1, 1, 0, 0,
  -1, -1, 0, 0, 2, 2,
  1, 0, 0, -2, -1, 0,
  0, 1, 0, -1, 0, 0,
  0, 0, 1, 0, 0, 0
];

function roadWAt(i) {
  const n = i + 1;
  return 26 + ((n * n * 300) / (STRIPS * STRIPS));
}

function rumbleWAt(i) {
  return 3 + ((i * 12) / STRIPS);
}

function lineWAt(i) {
  const w = 1 + ((i * 4) / STRIPS);
  if (w < 2) {
    return 2;
  }
  return w;
}

function stripY(i) {
  const ground = VIEW_H - HORIZON;
  return HORIZON + ((i + 0.5) * ground) / STRIPS;
}

function stripH() {
  const ground = VIEW_H - HORIZON;
  const h = (ground / STRIPS) + 1;
  if (h < 3) {
    return 3;
  }
  return h;
}

function curveAt(seg) {
  let s = seg % TRACK_LEN;
  if (s < 0) {
    s = s + TRACK_LEN;
  }
  return CURVES[s];
}

function absVal(v) {
  if (v < 0) {
    return 0 - v;
  }
  return v;
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

function floorOf(v) {
  return v | 0;
}

function aiId(n, tier) {
  return ("ai" + n) + ("t" + tier);
}

function propId(kind, slot, tier) {
  return (kind + slot) + ("t" + tier);
}

function sheetSprite(id, path, frameW, frameH, cols) {
  return {
    id: id,
    kind: "sheet",
    path: path,
    frameW: frameW,
    frameH: frameH,
    cols: cols,
    rows: 1,
    scale: 100,
    feetTrim: 0
  };
}

function sprites() {
  const list = [];
  const h = stripH();

  list.push({ id: "sky", kind: "rect", w: VIEW_W, h: HORIZON + 4, r: 50, g: 140, b: 220 });
  list.push({ id: "ground", kind: "rect", w: VIEW_W, h: VIEW_H - HORIZON + 8, r: 34, g: 140, b: 48 });

  list.push({ id: "cloud0", kind: "circle", rad: 16, r: 240, g: 248, b: 255 });
  list.push({ id: "cloud1", kind: "circle", rad: 12, r: 235, g: 245, b: 255 });
  list.push({ id: "cloud2", kind: "circle", rad: 14, r: 240, g: 248, b: 255 });

  let m = 0;
  while (m < 8) {
    list.push({
      id: "mt" + m,
      kind: "rect",
      w: 36 + (m % 3) * 10,
      h: 18 + (m % 4) * 6,
      r: 28,
      g: 48,
      b: 34
    });
    m = m + 1;
  }

  let i = 0;
  while (i < STRIPS) {
    const rw = roadWAt(i);
    const rbw = rumbleWAt(i);
    list.push({ id: "rd" + i, kind: "rect", w: rw, h: h, r: 70, g: 72, b: 80 });
    list.push({ id: "rl" + i, kind: "rect", w: rbw, h: h, r: 220, g: 40, b: 40 });
    list.push({ id: "rr" + i, kind: "rect", w: rbw, h: h, r: 220, g: 40, b: 40 });
    list.push({ id: "ln" + i, kind: "rect", w: lineWAt(i), h: h, r: 240, g: 240, b: 220 });
    i = i + 1;
  }

  // Roadside PNG props — pre-sized tiers (sheet cache is path-keyed).
  // Define far slots first so nearer props paint on top.
  let slot = PROP_SLOTS - 1;
  while (slot >= 0) {
    let tier = 0;
    while (tier < PROP_TIERS) {
      list.push(sheetSprite(
        propId("palm", slot, tier),
        "assets/palm_" + tier + ".png",
        PALM_W[tier],
        PALM_H[tier],
        1
      ));
      let housePath = "assets/house_";
      if ((slot % 2) == 1) {
        housePath = "assets/house2_";
      }
      list.push(sheetSprite(
        propId("house", slot, tier),
        housePath + tier + ".png",
        HOUSE_W[tier],
        HOUSE_H[tier],
        1
      ));
      list.push(sheetSprite(
        propId("crowd", slot, tier),
        "assets/crowd_" + tier + ".png",
        CROWD_FW[tier],
        CROWD_FH[tier],
        2
      ));
      tier = tier + 1;
    }
    slot = slot - 1;
  }

  // Start gantry pieces.
  list.push({ id: "ganL", kind: "rect", w: 10, h: 70, r: 40, g: 70, b: 180 });
  list.push({ id: "ganR", kind: "rect", w: 10, h: 70, r: 40, g: 70, b: 180 });
  list.push({ id: "ganBar", kind: "rect", w: 160, h: 22, r: 230, g: 200, b: 40 });
  list.push({ id: "chkL", kind: "rect", w: 18, h: 22, r: 20, g: 20, b: 20 });
  list.push({ id: "chkR", kind: "rect", w: 18, h: 22, r: 240, g: 240, b: 240 });
  list.push({ id: "lightR", kind: "circle", rad: 5, r: 90, g: 20, b: 20 });
  list.push({ id: "lightY", kind: "circle", rad: 5, r: 90, g: 70, b: 10 });
  list.push({ id: "lightG", kind: "circle", rad: 5, r: 20, g: 90, b: 20 });

  // AI cars — PNG depth tiers.
  let n = 0;
  while (n < AI_COUNT) {
    let tier = 0;
    while (tier < CAR_TIERS) {
      list.push(sheetSprite(
        aiId(n, tier),
        (("assets/ai" + n) + "_") + tier + ".png",
        AI_W[tier],
        AI_H[tier],
        1
      ));
      tier = tier + 1;
    }
    n = n + 1;
  }

  list.push(sheetSprite("player", "assets/car_player.png", PLAYER_W, PLAYER_H, 1));

  return list;
}

function hideGantry(entities) {
  entities.ganL = { x: -40, y: -40, visible: 0 };
  entities.ganR = { x: -40, y: -40, visible: 0 };
  entities.ganBar = { x: -40, y: -40, visible: 0 };
  entities.chkL = { x: -40, y: -40, visible: 0 };
  entities.chkR = { x: -40, y: -40, visible: 0 };
  entities.lightR = { x: -40, y: -40, visible: 0 };
  entities.lightY = { x: -40, y: -40, visible: 0 };
  entities.lightG = { x: -40, y: -40, visible: 0 };
}

function hideProps(entities) {
  let slot = 0;
  while (slot < PROP_SLOTS) {
    let tier = 0;
    while (tier < PROP_TIERS) {
      entities[propId("palm", slot, tier)] = { x: -40, y: -40, visible: 0 };
      entities[propId("house", slot, tier)] = { x: -40, y: -40, visible: 0 };
      entities[propId("crowd", slot, tier)] = { x: -40, y: -40, visible: 0, p0: 0 };
      tier = tier + 1;
    }
    slot = slot + 1;
  }
}

function hideAi(entities) {
  let n = 0;
  while (n < AI_COUNT) {
    let tier = 0;
    while (tier < CAR_TIERS) {
      entities[aiId(n, tier)] = { x: -40, y: -40, visible: 0 };
      tier = tier + 1;
    }
    n = n + 1;
  }
}

function initAi() {
  return {
    z0: 900,
    x0: -0.35,
    s0: 0.22,
    z1: 1600,
    x1: 0.25,
    s1: 0.20,
    z2: 2400,
    x2: -0.15,
    s2: 0.24,
    z3: 3200,
    x3: 0.40,
    s3: 0.19
  };
}

function initState() {
  const entities = {};
  entities.sky = { x: 240, y: HORIZON * 0.5 };
  entities.ground = { x: 240, y: HORIZON + (VIEW_H - HORIZON) * 0.5 };
  entities.cloud0 = { x: 90, y: 28 };
  entities.cloud1 = { x: 210, y: 20 };
  entities.cloud2 = { x: 340, y: 32 };
  let m = 0;
  while (m < 8) {
    entities["mt" + m] = { x: 30 + m * 58, y: HORIZON - 6, visible: 1 };
    m = m + 1;
  }

  let i = 0;
  while (i < STRIPS) {
    const y = stripY(i);
    entities["rd" + i] = { x: 240, y: y, visible: 1 };
    entities["rl" + i] = { x: 100, y: y, visible: 1 };
    entities["rr" + i] = { x: 380, y: y, visible: 1 };
    entities["ln" + i] = { x: 240, y: y, visible: 0 };
    i = i + 1;
  }

  hideProps(entities);
  hideGantry(entities);
  hideAi(entities);
  entities.player = { x: 240, y: 242, p0: 0, visible: 1 };

  const ai = initAi();
  return {
    showNet: 0,
    phase: "countdown",
    countMs: 0,
    light: 0,
    z: 40,
    x: 0,
    speed: 0,
    maxSpeed: 0.42,
    timeLeft: START_TIME,
    score: 0,
    lap: 0,
    lapMs: 0,
    bestLap: 0,
    distance: 0,
    finished: 0,
    crashMs: 0,
    mountainX: 0,
    anim: 0,
    entities: entities,
    score1: 0,
    score2: START_TIME,
    mph: 0,
    z0: ai.z0,
    x0: ai.x0,
    s0: ai.s0,
    z1: ai.z1,
    x1: ai.x1,
    s1: ai.s1,
    z2: ai.z2,
    x2: ai.x2,
    s2: ai.s2,
    z3: ai.z3,
    x3: ai.x3,
    s3: ai.s3
  };
}

function aiZ(s, n) {
  if (n == 0) { return s.z0; }
  if (n == 1) { return s.z1; }
  if (n == 2) { return s.z2; }
  return s.z3;
}

function aiX(s, n) {
  if (n == 0) { return s.x0; }
  if (n == 1) { return s.x1; }
  if (n == 2) { return s.x2; }
  return s.x3;
}

function aiS(s, n) {
  if (n == 0) { return s.s0; }
  if (n == 1) { return s.s1; }
  if (n == 2) { return s.s2; }
  return s.s3;
}

function setAiFields(out, n, z, x, spd) {
  if (n == 0) {
    out.z0 = z;
    out.x0 = x;
    out.s0 = spd;
  }
  if (n == 1) {
    out.z1 = z;
    out.x1 = x;
    out.s1 = spd;
  }
  if (n == 2) {
    out.z2 = z;
    out.x2 = x;
    out.s2 = spd;
  }
  if (n == 3) {
    out.z3 = z;
    out.x3 = x;
    out.s3 = spd;
  }
}

function tierForScale(scale) {
  if (scale < 0.28) {
    return 0;
  }
  if (scale < 0.48) {
    return 1;
  }
  if (scale < 0.72) {
    return 2;
  }
  return 3;
}

function propTierForScale(scale) {
  if (scale < 0.35) {
    return 0;
  }
  if (scale < 0.65) {
    return 1;
  }
  return 2;
}

function formatLap(ms) {
  const total = floorOf(ms / 1000);
  const mins = floorOf(total / 60);
  let secs = total - mins * 60;
  if (secs < 10) {
    return mins + ":0" + secs;
  }
  return mins + ":" + secs;
}

function placeRoad(entities, playerZ, playerX) {
  let x = 0;
  let dx = 0;
  let step = 0;
  while (step < STRIPS) {
    const i = STRIPS - 1 - step;
    const zAhead = (step + 1) * Z_STEP;
    const worldZ = playerZ + zAhead;
    const seg = floorOf(worldZ / SEG_LEN);
    dx = dx + curveAt(seg) * 0.085;
    x = x + dx;

    const scale = (step + 1) / STRIPS;
    const cx = 240 + x - playerX * scale * 170;
    const y = stripY(i);
    const rw = roadWAt(i);
    const rbw = rumbleWAt(i);

    const stripe = floorOf(worldZ / 28) % 2;

    let roadR = 68;
    let roadG = 70;
    let roadB = 78;
    if (stripe == 0) {
      roadR = 78;
      roadG = 80;
      roadB = 88;
    }

    let rumbleR = 220;
    let rumbleG = 40;
    let rumbleB = 40;
    if (stripe == 0) {
      rumbleR = 240;
      rumbleG = 240;
      rumbleB = 240;
    }

    entities["rd" + i] = {
      x: cx,
      y: y,
      r: roadR,
      g: roadG,
      b: roadB,
      visible: 1
    };
    entities["rl" + i] = {
      x: cx - rw * 0.5 - rbw * 0.5,
      y: y,
      r: rumbleR,
      g: rumbleG,
      b: rumbleB,
      visible: 1
    };
    entities["rr" + i] = {
      x: cx + rw * 0.5 + rbw * 0.5,
      y: y,
      r: rumbleR,
      g: rumbleG,
      b: rumbleB,
      visible: 1
    };

    const dash = floorOf(worldZ / 40) % 2;
    if (dash == 0) {
      if (i > 4) {
        entities["ln" + i] = {
          x: cx,
          y: y,
          r: 240,
          g: 240,
          b: 220,
          visible: 1
        };
      } else {
        entities["ln" + i] = { x: cx, y: y, visible: 0 };
      }
    } else {
      entities["ln" + i] = { x: cx, y: y, visible: 0 };
    }

    step = step + 1;
  }

  return { bend: x, nearScale: 1 };
}

function projectZ(relZ) {
  if (relZ <= 20) {
    return { scale: 1, step: STRIPS - 1, y: stripY(STRIPS - 1), visible: 1 };
  }
  if (relZ > STRIPS * Z_STEP) {
    return { scale: 0, step: 0, y: HORIZON, visible: 0 };
  }
  const step = clamp(floorOf(relZ / Z_STEP), 0, STRIPS - 1);
  const i = STRIPS - 1 - step;
  const scale = (step + 1) / STRIPS;
  return { scale: scale, step: step, y: stripY(i), visible: 1 };
}

function roadCenterAt(playerZ, playerX, relZ) {
  let x = 0;
  let dx = 0;
  let step = 0;
  const target = clamp(floorOf(relZ / Z_STEP), 1, STRIPS);
  while (step < target) {
    const zAhead = (step + 1) * Z_STEP;
    const worldZ = playerZ + zAhead;
    const seg = floorOf(worldZ / SEG_LEN);
    dx = dx + curveAt(seg) * 0.085;
    x = x + dx;
    step = step + 1;
  }
  const scale = target / STRIPS;
  return 240 + x - playerX * scale * 170;
}

function placeGantry(entities, playerZ, playerX, light) {
  const rel = 0 - playerZ;
  if (rel < -80) {
    hideGantry(entities);
    return;
  }
  if (rel > STRIPS * Z_STEP) {
    hideGantry(entities);
    return;
  }
  if (playerZ > 280) {
    hideGantry(entities);
    return;
  }
  const scale = clamp(0.55 + (280 - playerZ) / 500, 0.45, 1.1);
  const cx = roadCenterAt(playerZ, playerX, 120);
  const y = 150 - (playerZ / 280) * 40;
  const half = 70 * scale;
  const barW = 140 * scale;
  entities.ganL = { x: cx - half, y: y + 20, visible: 1 };
  entities.ganR = { x: cx + half, y: y + 20, visible: 1 };
  entities.ganBar = { x: cx, y: y - 18, r: 230, g: 200, b: 40, visible: 1 };
  entities.chkL = { x: cx - barW * 0.35, y: y - 18, r: 20, g: 20, b: 20, visible: 1 };
  entities.chkR = { x: cx + barW * 0.35, y: y - 18, r: 240, g: 240, b: 240, visible: 1 };

  let rr = 60;
  let rg = 20;
  let rb = 20;
  let yr = 70;
  let yg = 50;
  let yb = 10;
  let gr = 20;
  let gg = 60;
  let gb = 20;
  if (light >= 1) {
    rr = 240;
    rg = 40;
    rb = 40;
  }
  if (light >= 2) {
    yr = 250;
    yg = 190;
    yb = 40;
  }
  if (light >= 3) {
    gr = 40;
    gg = 230;
    gb = 70;
  }
  entities.lightR = { x: cx - 18, y: y - 18, r: rr, g: rg, b: rb, rad: 5, visible: 1 };
  entities.lightY = { x: cx, y: y - 18, r: yr, g: yg, b: yb, rad: 5, visible: 1 };
  entities.lightG = { x: cx + 18, y: y - 18, r: gr, g: gg, b: gb, rad: 5, visible: 1 };
}

function placeProps(entities, playerZ, playerX, anim) {
  hideProps(entities);
  let slot = 0;
  while (slot < PROP_SLOTS) {
    const ahead = 140 + slot * 200;
    const worldZ = playerZ + ahead;
    const seg = floorOf(worldZ / SEG_LEN);
    const proj = projectZ(ahead);
    if (proj.visible == 1) {
      if (proj.scale > 0.14) {
        const cx = roadCenterAt(playerZ, playerX, ahead);
        const rw = roadWAt(STRIPS - 1 - proj.step);
        const side = ((seg + slot) % 2) * 2 - 1;
        const kindIdx = (seg + slot) % 3;
        let kind = "palm";
        let edge = 22;
        if (kindIdx == 1) {
          kind = "house";
          edge = 30;
        }
        if (kindIdx == 2) {
          kind = "crowd";
          edge = 26;
        }
        const tx = cx + side * (rw * 0.5 + edge + proj.scale * 34);
        const tier = propTierForScale(proj.scale);
        // Sheet sprites plant feet at (x,y).
        const feetY = proj.y + 2;
        if (kind == "crowd") {
          const frame = (anim + slot) % 2;
          entities[propId(kind, slot, tier)] = {
            x: tx,
            y: feetY,
            p0: frame,
            visible: 1
          };
        } else {
          entities[propId(kind, slot, tier)] = {
            x: tx,
            y: feetY,
            visible: 1
          };
        }
      }
    }
    slot = slot + 1;
  }
}

function placeAiCars(entities, s, playerZ, playerX) {
  hideAi(entities);
  let n = 0;
  while (n < AI_COUNT) {
    const cz = aiZ(s, n);
    const cxLane = aiX(s, n);
    const rel = cz - playerZ;
    if (rel > 40) {
      if (rel < STRIPS * Z_STEP) {
        const proj = projectZ(rel);
        if (proj.visible == 1) {
          if (proj.scale > 0.1) {
            const roadX = roadCenterAt(playerZ, playerX, rel);
            const screenX = roadX + cxLane * proj.scale * 150;
            const tier = tierForScale(proj.scale);
            entities[aiId(n, tier)] = {
              x: screenX,
              y: proj.y + 2,
              visible: 1
            };
          }
        }
      }
    }
    n = n + 1;
  }
}

function update(props) {
  const s = props.state;
  const dt = props.dt;
  const events = [];
  let phase = s.phase;
  let countMs = s.countMs;
  let light = s.light;
  let z = s.z;
  let x = s.x;
  let speed = s.speed;
  let timeLeft = s.timeLeft;
  let score = s.score;
  let lap = s.lap;
  let lapMs = s.lapMs;
  let bestLap = s.bestLap;
  let distance = s.distance;
  let finished = s.finished;
  let crashMs = s.crashMs;
  let mountainX = s.mountainX;
  let anim = s.anim;

  if (phase == "countdown") {
    countMs = countMs + dt;
    if (countMs > 700) {
      if (light < 3) {
        light = light + 1;
        countMs = 0;
        events.push(soundEvent("blip"));
      }
    }
    if (light >= 3) {
      if (countMs > 450) {
        phase = "racing";
        events.push(soundEvent("win"));
      }
    }
  }

  let accel = 0;
  if (phase == "racing") {
    if (props.up || props.action) {
      accel = 1;
    }
    if (props.down) {
      accel = -1;
    }
  }

  if (crashMs > 0) {
    crashMs = crashMs - dt;
    speed = speed * 0.92;
  } else {
    if (accel > 0) {
      speed = speed + dt * 0.00022;
    } else {
      if (accel < 0) {
        speed = speed - dt * 0.00035;
      } else {
        speed = speed - dt * 0.00005;
      }
    }
  }

  speed = clamp(speed, 0, s.maxSpeed);

  if (phase == "racing") {
    const steer = dt * 0.0011 * (0.35 + speed * 2.2);
    if (props.left) {
      x = x - steer;
    }
    if (props.right) {
      x = x + steer;
    }
  }
  x = clamp(x, -1.15, 1.15);

  if (phase == "racing") {
    if (speed > 0.05) {
      const segNow = floorOf(z / SEG_LEN);
      const pull = curveAt(segNow) * speed * dt * 0.00035;
      x = x + pull;
      x = clamp(x, -1.2, 1.2);
    }
  }

  const offroad = absVal(x) > 0.92;
  if (offroad) {
    if (speed > 0.12) {
      speed = speed - dt * 0.00025;
    }
  }

  if (phase == "racing") {
    z = z + speed * dt;
    distance = distance + speed * dt;
    lapMs = lapMs + dt;
    timeLeft = timeLeft - dt / 1000;
    score = score + floorOf(speed * dt * 0.35);
    mountainX = mountainX - curveAt(floorOf(z / SEG_LEN)) * speed * dt * 0.02;
    anim = anim + 1;
    if (anim > 100000) {
      anim = 0;
    }

    const lapLen = TRACK_LEN * SEG_LEN;
    if (z > (lap + 1) * lapLen) {
      lap = lap + 1;
      timeLeft = timeLeft + 25;
      if (bestLap == 0) {
        bestLap = lapMs;
      } else {
        if (lapMs < bestLap) {
          bestLap = lapMs;
        }
      }
      lapMs = 0;
      events.push(soundEvent("celebrate"));
      score = score + 1000;
    }

    if (timeLeft <= 0) {
      timeLeft = 0;
      phase = "finished";
      finished = 1;
      events.push(soundEvent("lose"));
    }
  } else {
    anim = anim + 1;
  }

  let n = 0;
  const aiOut = {
    z0: s.z0,
    x0: s.x0,
    s0: s.s0,
    z1: s.z1,
    x1: s.x1,
    s1: s.s1,
    z2: s.z2,
    x2: s.x2,
    s2: s.s2,
    z3: s.z3,
    x3: s.x3,
    s3: s.s3
  };
  while (n < AI_COUNT) {
    let cz = aiZ(s, n) + aiS(s, n) * dt;
    let cx = aiX(s, n);
    const spd = aiS(s, n);
    if (cz < z - 200) {
      cz = z + 900 + n * 400;
      cx = ((n % 2) * 2 - 1) * (0.2 + (n % 3) * 0.12);
    }
    const wave = absVal(((z * 0.02 + n * 40) % 40) - 20) / 20;
    cx = cx + (wave - 0.5) * 0.0012 * dt;
    cx = clamp(cx, -0.7, 0.7);

    const rel = cz - z;
    if (phase == "racing") {
      if (rel > 20) {
        if (rel < 90) {
          if (absVal(cx - x) < 0.28) {
            if (crashMs <= 0) {
              crashMs = 400;
              speed = speed * 0.45;
              score = score + 50;
              events.push(soundEvent("bounce"));
            }
          }
        }
      }
    }
    setAiFields(aiOut, n, cz, cx, spd);
    n = n + 1;
  }

  const entities = {};
  entities.sky = { x: 240, y: HORIZON * 0.5, r: 50, g: 140, b: 220 };
  entities.ground = {
    x: 240,
    y: HORIZON + (VIEW_H - HORIZON) * 0.5,
    r: 34,
    g: 140,
    b: 48
  };
  entities.cloud0 = { x: 90 + mountainX * 0.15, y: 28 };
  entities.cloud1 = { x: 210 + mountainX * 0.12, y: 20 };
  entities.cloud2 = { x: 340 + mountainX * 0.1, y: 32 };

  let m = 0;
  while (m < 8) {
    let mx = 30 + m * 58 + mountainX * 0.35;
    while (mx < -40) {
      mx = mx + 520;
    }
    while (mx > 520) {
      mx = mx - 520;
    }
    entities["mt" + m] = {
      x: mx,
      y: HORIZON - (6 + (m % 4) * 3),
      visible: 1
    };
    m = m + 1;
  }

  placeRoad(entities, z, x);
  placeProps(entities, z, x, floorOf(anim / 8));
  placeGantry(entities, z, x, light);
  placeAiCars(entities, aiOut, z, x);

  const playerScreenX = 240 + x * 70;
  entities.player = {
    x: playerScreenX,
    y: 248,
    p0: 0,
    visible: 1
  };

  if (phase == "finished") {
    if (props.action) {
      return initState();
    }
  }

  const mph = floorOf(speed * 780);

  return {
    showNet: 0,
    phase: phase,
    countMs: countMs,
    light: light,
    z: z,
    x: x,
    speed: speed,
    maxSpeed: s.maxSpeed,
    timeLeft: timeLeft,
    score: score,
    lap: lap,
    lapMs: lapMs,
    bestLap: bestLap,
    distance: distance,
    finished: finished,
    crashMs: crashMs,
    mountainX: mountainX,
    anim: anim,
    entities: entities,
    score1: score,
    score2: floorOf(timeLeft),
    z0: aiOut.z0,
    x0: aiOut.x0,
    s0: aiOut.s0,
    z1: aiOut.z1,
    x1: aiOut.x1,
    s1: aiOut.s1,
    z2: aiOut.z2,
    x2: aiOut.x2,
    s2: aiOut.s2,
    z3: aiOut.z3,
    x3: aiOut.x3,
    s3: aiOut.s3,
    mph: mph,
    events: events
  };
}

function hud(props) {
  const s = props.state;
  const timeShow = s.timeLeft | 0;
  const mphShow = s.mph | 0;
  const scoreShow = s.score | 0;
  const lapStr = formatLap(s.lapMs);

  if (s.phase == "finished") {
    return (
      <View flexDirection="column" padding="10px" width="100%" align="center">
        <Label color="#ffe66d">TIME UP</Label>
        <Label color="#ffffff">SCORE {scoreShow}</Label>
        <Label color="#8fd3ff">SPACE = RESTART</Label>
      </View>
    );
  }

  if (s.phase == "countdown") {
    let msg = "READY";
    if (s.light == 1) {
      msg = "3";
    }
    if (s.light == 2) {
      msg = "2";
    }
    if (s.light >= 3) {
      msg = "1";
    }
    return (
      <View flexDirection="column" padding="8px" width="100%">
        <View flexDirection="row" width="100%" justifyContent="space-between">
          <Label color="#ffe66d">TOP {scoreShow}</Label>
          <Label color="#7ec8ff">TIME {timeShow}</Label>
          <Label color="#9dffb0">SPEED 0</Label>
        </View>
        <View flexDirection="row" width="100%" justifyContent="center" padding="18px">
          <Label color="#ffffff">{msg}</Label>
        </View>
      </View>
    );
  }

  return (
    <View flexDirection="row" padding="6px" width="100%" justifyContent="space-between">
      <Label color="#ffe66d">SCORE {scoreShow}</Label>
      <Label color="#7ec8ff">TIME {timeShow}</Label>
      <Label color="#ffd0a0">LAP {lapStr}</Label>
      <Label color="#9dffb0">SPEED {mphShow}</Label>
    </View>
  );
}
