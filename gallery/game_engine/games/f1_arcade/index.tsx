/// <reference path="../../scripting/game.d.ts" />
//
// F1 Arcade — Pole Position-style pseudo-3D racer.
//
// Projection: Lou / Jake Gordon scale = camDepth / relZ, with curve x/dx.
// Screen Y is remapped into [HORIZON .. VIEW_H] so the road fills the ground
// plane. Consecutive projected points define each band's height so nearer
// strips are taller AND wider, with 2px overlap (no green gaps).
// Rect poses use live w/h (engine syncPose). Player car is a rear-view sheet
// with left/center/right steer frames.
//
// Controls: Left/Right steer · Up or Space accelerate · Down brake
// Run: npm run engine:game-sdl:run:f1_arcade

import { soundEvent } from "game_helpers";

const VIEW_W = 480;
const VIEW_H = 270;
const HORIZON = 88;
const CX = 240;
const ROAD_BOTTOM = 262;

// --- Lou / javascript-racer camera ---
// Tuned so near road half-width ≈ 0.28*VIEW_W (scale≈1/ROAD_WIDTH).
const CAM_DEPTH = 0.84;
const ROAD_WIDTH = 2000;
const SEG_LENGTH = 200;
const DRAW_DIST = 48;
const CURVE_STRENGTH = 0.35;
const TRACK_SEGS = 64;
const AI_COUNT = 4;
const PROP_SLOTS = 12;
const START_TIME = 75;
const PAN_W = 960;
const PAN_H = 56;

// Sprite scale: project().scale * SPRITE_SCALE_K → percent (100 = full PNG).
// Near scale≈0.00056 → ~100%; far stays readable for crowds/palms.
const SPRITE_SCALE_K = 190000;
// Near/far depths: near ≈ full road width on screen; far ≈ thin ribbon at horizon.
const Z_NEAR = 1500;
const Z_FAR = 18000;

const PALM_W = 64;
const PALM_H = 96;
const HOUSE_W = 64;
const HOUSE_H = 64;
const CROWD_FW = 72;
const CROWD_FH = 56;
const CAR_W = 56;
const CAR_H = 36;

// Per-segment curve (−6 .. 6 style, a bit softer). Length TRACK_SEGS.
const CURVES = [
  0, 0, 0, 0, 0, 0, 0, 0,
  2, 4, 5, 4, 2, 0, 0, 0,
  0, -2, -4, -5, -4, -2, 0, 0,
  0, 0, 3, 3, 0, 0, -3, -3,
  0, 0, 0, 5, 5, 3, 0, 0,
  -4, -2, 0, 0, 2, 4, 2, 0,
  0, 0, -1, 0, 1, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0
];

// Roadside prop kind per segment (0=none 1=palm 2=house 3=crowd), side ±1.
const PROP_KIND = [
  0, 1, 0, 2, 0, 3, 0, 1,
  0, 0, 2, 0, 3, 0, 1, 0,
  0, 3, 0, 1, 0, 2, 0, 0,
  1, 0, 0, 3, 0, 2, 0, 1,
  0, 0, 1, 0, 3, 0, 2, 0,
  0, 2, 0, 1, 0, 0, 3, 0,
  1, 0, 3, 0, 0, 2, 0, 1,
  0, 0, 0, 1, 0, 3, 0, 0
];

const PROP_SIDE = [
  1, -1, 1, -1, 1, -1, 1, -1,
  -1, 1, -1, 1, -1, 1, -1, 1,
  1, -1, 1, -1, 1, -1, 1, -1,
  -1, 1, -1, 1, -1, 1, -1, 1,
  1, -1, 1, -1, 1, -1, 1, -1,
  -1, 1, -1, 1, -1, 1, -1, 1,
  1, -1, 1, -1, 1, -1, 1, -1,
  -1, 1, -1, 1, -1, 1, -1, 1
];

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

function wrapMod(v, mod) {
  let x = v % mod;
  if (x < 0) {
    x = x + mod;
  }
  return x;
}

function curveAt(seg) {
  return CURVES[wrapMod(seg, TRACK_SEGS)];
}

function propKindAt(seg) {
  return PROP_KIND[wrapMod(seg, TRACK_SEGS)];
}

function propSideAt(seg) {
  return PROP_SIDE[wrapMod(seg, TRACK_SEGS)];
}

function aiId(n) {
  return "ai" + n;
}

function propId(kind, slot) {
  return kind + slot;
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

// Project a road-plane point at relative depth relZ (camera at 0).
// Y is remapped so Z_NEAR → ROAD_BOTTOM and Z_FAR → HORIZON (fills ground).
function project(worldX, relZ, camX) {
  let z = relZ;
  if (z < 1) {
    z = 1;
  }
  const scale = CAM_DEPTH / z;
  const scaleNear = CAM_DEPTH / Z_NEAR;
  const scaleFar = CAM_DEPTH / Z_FAR;
  const denom = scaleNear - scaleFar;
  let t = 0;
  if (denom > 0.0000001) {
    t = (scale - scaleFar) / denom;
  }
  t = clamp(t, 0, 1.15);
  const sx = CX + scale * (worldX - camX) * CX;
  const sy = HORIZON + t * (ROAD_BOTTOM - HORIZON);
  const sw = scale * ROAD_WIDTH * CX;
  return { ok: 1, x: sx, y: sy, w: sw, scale: scale };
}

function spriteScalePct(projScale) {
  return clamp(floorOf(projScale * SPRITE_SCALE_K), 12, 120);
}

function rumbleW(roadHalf) {
  const w = floorOf(roadHalf * 0.12);
  if (w < 2) {
    return 2;
  }
  return w;
}

function lineW(roadHalf) {
  const w = floorOf(roadHalf * 0.04);
  if (w < 2) {
    return 2;
  }
  return w;
}

function sprites() {
  const list = [];

  list.push({ id: "sky", kind: "rect", w: VIEW_W, h: HORIZON + 4, r: 50, g: 140, b: 220 });
  list.push({ id: "ground", kind: "rect", w: VIEW_W, h: VIEW_H - HORIZON + 8, r: 34, g: 140, b: 48 });

  list.push(sheetSprite("pan0", "assets/panorama.png", PAN_W, PAN_H, 1));
  list.push(sheetSprite("pan1", "assets/panorama.png", PAN_W, PAN_H, 1));
  list.push(sheetSprite("sun", "assets/sun.png", 32, 32, 1));
  list.push(sheetSprite("cloud0", "assets/cloud_a.png", 48, 24, 1));
  list.push(sheetSprite("cloud1", "assets/cloud_b.png", 40, 20, 1));
  list.push(sheetSprite("cloud2", "assets/cloud_c.png", 36, 18, 1));

  // Road bands: live pose.w / pose.h each frame (max sizes here).
  let n = DRAW_DIST - 1;
  while (n >= 0) {
    list.push({ id: "rd" + n, kind: "rect", w: VIEW_W - 4, h: 48, r: 70, g: 72, b: 80 });
    list.push({ id: "rl" + n, kind: "rect", w: 40, h: 48, r: 220, g: 40, b: 40 });
    list.push({ id: "rr" + n, kind: "rect", w: 40, h: 48, r: 220, g: 40, b: 40 });
    list.push({ id: "ln" + n, kind: "rect", w: 12, h: 48, r: 240, g: 240, b: 220 });
    n = n - 1;
  }

  let slot = PROP_SLOTS - 1;
  while (slot >= 0) {
    list.push(sheetSprite(propId("palm", slot), "assets/palm.png", PALM_W, PALM_H, 1));
    let housePath = "assets/house.png";
    if ((slot % 2) == 1) {
      housePath = "assets/house2.png";
    }
    list.push(sheetSprite(propId("house", slot), housePath, HOUSE_W, HOUSE_H, 1));
    list.push(sheetSprite(propId("crowd", slot), "assets/crowd.png", CROWD_FW, CROWD_FH, 2));
    slot = slot - 1;
  }

  list.push({ id: "ganL", kind: "rect", w: 10, h: 70, r: 40, g: 70, b: 180 });
  list.push({ id: "ganR", kind: "rect", w: 10, h: 70, r: 40, g: 70, b: 180 });
  list.push({ id: "ganBar", kind: "rect", w: 160, h: 22, r: 230, g: 200, b: 40 });
  list.push({ id: "chkL", kind: "rect", w: 18, h: 22, r: 20, g: 20, b: 20 });
  list.push({ id: "chkR", kind: "rect", w: 18, h: 22, r: 240, g: 240, b: 240 });
  list.push({ id: "lightR", kind: "circle", rad: 5, r: 90, g: 20, b: 20 });
  list.push({ id: "lightY", kind: "circle", rad: 5, r: 90, g: 70, b: 10 });
  list.push({ id: "lightG", kind: "circle", rad: 5, r: 20, g: 90, b: 20 });

  let a = 0;
  while (a < AI_COUNT) {
    list.push(sheetSprite(aiId(a), "assets/ai" + a + ".png", CAR_W, CAR_H, 1));
    a = a + 1;
  }

  list.push(sheetSprite("player", "assets/car_player.png", CAR_W, CAR_H, 3));
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
    entities[propId("palm", slot)] = { x: -40, y: -40, visible: 0, scale: 100 };
    entities[propId("house", slot)] = { x: -40, y: -40, visible: 0, scale: 100 };
    entities[propId("crowd", slot)] = { x: -40, y: -40, visible: 0, p0: 0, scale: 100 };
    slot = slot + 1;
  }
}

function hideAi(entities) {
  let n = 0;
  while (n < AI_COUNT) {
    entities[aiId(n)] = { x: -40, y: -40, visible: 0, scale: 100 };
    n = n + 1;
  }
}

function hideRoad(entities) {
  let n = 0;
  while (n < DRAW_DIST) {
    entities["rd" + n] = { x: -80, y: -80, w: 4, h: 2, visible: 0 };
    entities["rl" + n] = { x: -80, y: -80, w: 2, h: 2, visible: 0 };
    entities["rr" + n] = { x: -80, y: -80, w: 2, h: 2, visible: 0 };
    entities["ln" + n] = { x: -80, y: -80, w: 2, h: 2, visible: 0 };
    n = n + 1;
  }
}

function initAi() {
  return {
    z0: 3500,
    x0: -0.35,
    s0: 0.22,
    z1: 6200,
    x1: 0.25,
    s1: 0.20,
    z2: 9000,
    x2: -0.15,
    s2: 0.24,
    z3: 12000,
    x3: 0.40,
    s3: 0.19
  };
}

function initState() {
  const entities = {};
  entities.sky = { x: 240, y: HORIZON * 0.5 };
  entities.ground = { x: 240, y: HORIZON + (VIEW_H - HORIZON) * 0.5 };
  entities.pan0 = { x: 240, y: HORIZON, scale: 100, visible: 1 };
  entities.pan1 = { x: 240 - PAN_W, y: HORIZON, scale: 100, visible: 1 };
  entities.sun = { x: 360, y: 36, scale: 100, visible: 1 };
  entities.cloud0 = { x: 100, y: 28, scale: 70, visible: 1 };
  entities.cloud1 = { x: 220, y: 22, scale: 55, visible: 1 };
  entities.cloud2 = { x: 340, y: 32, scale: 60, visible: 1 };

  hideRoad(entities);
  hideProps(entities);
  hideGantry(entities);
  hideAi(entities);
  entities.player = { x: 240, y: 248, p0: 1, scale: 100, angle: 0, visible: 1 };

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
    heading: 0,
    anim: 0,
    steer: 0,
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

function formatLap(ms) {
  const total = floorOf(ms / 1000);
  const mins = floorOf(total / 60);
  let secs = total - mins * 60;
  if (secs < 10) {
    return mins + ":0" + secs;
  }
  return mins + ":" + secs;
}

// Curve camera offset at relative depth (segment units ahead of player).
function camXAt(playerX, baseSeg, segPct, relZ) {
  const segsAhead = relZ / SEG_LENGTH;
  let x = 0;
  let dx = curveAt(baseSeg) * segPct * CURVE_STRENGTH;
  let walked = 0;
  while (walked < segsAhead) {
    x = x + dx;
    dx = dx + curveAt(baseSeg + floorOf(walked)) * CURVE_STRENGTH;
    walked = walked + 1;
  }
  // Fractional segment remainder.
  const frac = segsAhead - floorOf(segsAhead);
  x = x + dx * frac;
  return playerX * ROAD_WIDTH - x;
}

// Perspective road bands: sample equal Δz, project Y — nearer bands are
// taller AND wider. Overlap by 2px so grass never shows between strips.
function placeWorld(entities, playerZ, playerX, anim, aiState) {
  hideRoad(entities);
  hideProps(entities);
  hideAi(entities);

  const baseSeg = floorOf(playerZ / SEG_LENGTH);
  const segPct = (playerZ - baseSeg * SEG_LENGTH) / SEG_LENGTH;

  // Project DRAW_DIST+1 depth samples (0 = near).
  const ys = [];
  const xs = [];
  const ws = [];
  const zs = [];
  const cams = [];
  let n = 0;
  while (n <= DRAW_DIST) {
    const relZ = Z_NEAR + (n * (Z_FAR - Z_NEAR)) / DRAW_DIST;
    const camX = camXAt(playerX, baseSeg, segPct, relZ);
    const p = project(0, relZ, camX);
    ys.push(p.y);
    xs.push(p.x);
    ws.push(p.w);
    zs.push(relZ);
    cams.push(camX);
    n = n + 1;
  }

  let propSlot = 0;
  // Paint far → near.
  let bi = DRAW_DIST - 1;
  while (bi >= 0) {
    const yNear = ys[bi];
    const yFar = ys[bi + 1];
    let bandH = floorOf(yNear - yFar) + 3;
    if (bandH < 2) {
      bandH = 2;
    }
    const y = (yNear + yFar) * 0.5;
    const cx = (xs[bi] + xs[bi + 1]) * 0.5;
    let half = (ws[bi] + ws[bi + 1]) * 0.5;
    // Keep road + rumbles inside the view; clamp half so edges abut (no grass seam).
    const maxHalf = VIEW_W * 0.5 - 8;
    if (half > maxHalf) {
      half = maxHalf;
    }
    if (half < 5) {
      half = 5;
    }
    const relZ = (zs[bi] + zs[bi + 1]) * 0.5;
    const camX = cams[bi];
    const roadW = floorOf(half * 2);
    const rb = rumbleW(half);
    const lw = lineW(half);
    const segIdx = baseSeg + floorOf(relZ / SEG_LENGTH);
    const stripe = wrapMod(segIdx + floorOf(relZ / 40), 2);

    const roadR = 74;
    const roadG = 76;
    const roadB = 84;
    let rumbleR = 220;
    let rumbleG = 35;
    let rumbleB = 35;
    if (stripe == 0) {
      rumbleR = 245;
      rumbleG = 245;
      rumbleB = 245;
    }

    if (yNear > HORIZON - 2) {
      if (yFar < VIEW_H + 4) {
        entities["rd" + bi] = {
          x: cx,
          y: y,
          w: roadW,
          h: bandH,
          r: roadR,
          g: roadG,
          b: roadB,
          visible: 1
        };
        // Rumble overlaps road edge by ~1/3 so no grass seam at the curb.
        entities["rl" + bi] = {
          x: cx - half + rb * 0.2,
          y: y,
          w: rb,
          h: bandH,
          r: rumbleR,
          g: rumbleG,
          b: rumbleB,
          visible: 1
        };
        entities["rr" + bi] = {
          x: cx + half - rb * 0.2,
          y: y,
          w: rb,
          h: bandH,
          r: rumbleR,
          g: rumbleG,
          b: rumbleB,
          visible: 1
        };

        // Dashed center line all the way to the near camera (bi = 0).
        const dash = wrapMod(floorOf(relZ / 55) + bi, 2);
        if (dash == 0) {
          if (bi < DRAW_DIST - 2) {
            let lineH = bandH;
            if (lineH < 3) {
              lineH = 3;
            }
            entities["ln" + bi] = {
              x: cx,
              y: y,
              w: lw,
              h: lineH,
              r: 240,
              g: 240,
              b: 220,
              visible: 1
            };
          }
        }

        // Pin props to the *rendered* road edge (same cx/half as asphalt),
        // not a world X inside the lane — otherwise curves put them on tarmac.
        if (propSlot < PROP_SLOTS) {
          if ((bi % 2) == 0) {
            if (bi > 2) {
              if (bi < DRAW_DIST - 1) {
                const kindN = propKindAt(segIdx);
                if (kindN > 0) {
                  const side = propSideAt(segIdx);
                  const sc = spriteScalePct(CAM_DEPTH / relZ);
                  // Outside rumble: edge + margin that also scales with depth.
                  const margin = rb + 6 + floorOf(half * 0.08);
                  const propX = cx + side * (half + margin);
                  const propY = yNear;
                  if (sc >= 12) {
                    if (propX > 8) {
                      if (propX < VIEW_W - 8) {
                        let kind = "palm";
                        if (kindN == 2) {
                          kind = "house";
                        }
                        if (kindN == 3) {
                          kind = "crowd";
                        }
                        // Crowds get a slight scale bump so they stay readable.
                        let useScale = sc;
                        if (kind == "crowd") {
                          useScale = clamp(floorOf(sc * 1.15), 14, 120);
                        }
                        if (kind == "crowd") {
                          entities[propId(kind, propSlot)] = {
                            x: propX,
                            y: propY,
                            p0: (anim + propSlot) % 2,
                            scale: useScale,
                            visible: 1
                          };
                        } else {
                          entities[propId(kind, propSlot)] = {
                            x: propX,
                            y: propY,
                            scale: useScale,
                            visible: 1
                          };
                        }
                        propSlot = propSlot + 1;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    bi = bi - 1;
  }

  // AI cars — same projection.
  let a = 0;
  while (a < AI_COUNT) {
    const cz = aiZ(aiState, a);
    const lane = aiX(aiState, a);
    const rel = cz - playerZ;
    if (rel > Z_NEAR * 0.35) {
      if (rel < Z_FAR) {
        const camX = camXAt(playerX, baseSeg, segPct, rel);
        const worldCarX = lane * ROAD_WIDTH * 0.45;
        const cp = project(worldCarX, rel, camX);
        if (cp.y > HORIZON) {
          if (cp.y < VIEW_H - 8) {
            entities[aiId(a)] = {
              x: cp.x,
              y: cp.y,
              scale: spriteScalePct(cp.scale),
              visible: 1
            };
          }
        }
      }
    }
    a = a + 1;
  }
}

function placeSky(entities, heading) {
  const scroll = wrapMod(heading * (PAN_W / 360), PAN_W);
  let c0 = PAN_W * 0.5 - scroll;
  while (c0 < -PAN_W * 0.5) {
    c0 = c0 + PAN_W;
  }
  while (c0 > PAN_W * 0.5) {
    c0 = c0 - PAN_W;
  }
  entities.pan0 = { x: c0, y: HORIZON, scale: 100, visible: 1 };
  entities.pan1 = { x: c0 + PAN_W, y: HORIZON, scale: 100, visible: 1 };

  const sunRel = wrapMod(90 - heading, 360);
  let sunX = -80;
  let sunVis = 0;
  if (sunRel < 180) {
    sunX = floorOf((sunRel / 180) * VIEW_W);
    sunVis = 1;
  }
  entities.sun = { x: sunX, y: 34, scale: 100, visible: sunVis };

  placeCloud(entities, "cloud0", heading, 40, 26, 70);
  placeCloud(entities, "cloud1", heading, 160, 20, 55);
  placeCloud(entities, "cloud2", heading, 300, 30, 62);
}

function placeCloud(entities, id, heading, worldAngle, y, scale) {
  const rel = wrapMod(worldAngle - heading, 360);
  if (rel >= 180) {
    entities[id] = { x: -80, y: y, scale: scale, visible: 0 };
    return;
  }
  entities[id] = {
    x: floorOf((rel / 180) * VIEW_W),
    y: y,
    scale: scale,
    visible: 1
  };
}

function placeGantry(entities, playerZ, playerX, light) {
  if (playerZ > SEG_LENGTH * 2) {
    hideGantry(entities);
    return;
  }
  const p = project(0, SEG_LENGTH * 0.8, playerX * ROAD_WIDTH);
  const cx = p.x;
  const y = clamp(p.y - 36, 70, 160);
  const half = clamp(p.w * 0.9, 40, 120);
  entities.ganL = { x: cx - half, y: y + 20, visible: 1 };
  entities.ganR = { x: cx + half, y: y + 20, visible: 1 };
  entities.ganBar = { x: cx, y: y - 18, r: 230, g: 200, b: 40, visible: 1 };
  entities.chkL = { x: cx - half * 0.5, y: y - 18, r: 20, g: 20, b: 20, visible: 1 };
  entities.chkR = { x: cx + half * 0.5, y: y - 18, r: 240, g: 240, b: 240, visible: 1 };

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
  let heading = s.heading;
  let anim = s.anim;
  let steer = s.steer;

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

  // Visual steer lean (−1..1) + lane change.
  if (phase == "racing") {
    const steerStep = dt * 0.0011 * (0.35 + speed * 2.2);
    if (props.left) {
      x = x - steerStep;
      steer = steer - dt * 0.008;
    } else {
      if (props.right) {
        x = x + steerStep;
        steer = steer + dt * 0.008;
      } else {
        if (steer > 0.05) {
          steer = steer - dt * 0.006;
        } else {
          if (steer < -0.05) {
            steer = steer + dt * 0.006;
          } else {
            steer = 0;
          }
        }
      }
    }
  } else {
    steer = 0;
  }
  steer = clamp(steer, -1, 1);
  x = clamp(x, -1.2, 1.2);

  if (phase == "racing") {
    if (speed > 0.05) {
      const segNow = floorOf(z / SEG_LENGTH);
      const pull = curveAt(segNow) * speed * dt * 0.00012;
      x = x + pull;
      x = clamp(x, -1.25, 1.25);
      heading = wrapMod(heading + curveAt(segNow) * speed * dt * 0.02, 360);
    }
  }

  const offroad = absVal(x) > 0.95;
  if (offroad) {
    if (speed > 0.12) {
      speed = speed - dt * 0.00025;
    }
  }

  if (phase == "racing") {
    // speed is ~0..0.42 px-style; convert to world units / ms.
    z = z + speed * dt * 2.8;
    distance = distance + speed * dt;
    lapMs = lapMs + dt;
    timeLeft = timeLeft - dt / 1000;
    score = score + floorOf(speed * dt * 0.35);
    anim = anim + 1;
    if (anim > 100000) {
      anim = 0;
    }

    const lapLen = TRACK_SEGS * SEG_LENGTH;
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
    let cz = aiZ(s, n) + aiS(s, n) * dt * 2.8;
    let cx = aiX(s, n);
    const spd = aiS(s, n);
    if (cz < z - 800) {
      cz = z + 4000 + n * 1600;
      cx = ((n % 2) * 2 - 1) * (0.2 + (n % 3) * 0.12);
    }
    const wave = absVal(((z * 0.02 + n * 40) % 40) - 20) / 20;
    cx = clamp(cx + (wave - 0.5) * 0.0012 * dt, -0.7, 0.7);

    const rel = cz - z;
    if (phase == "racing") {
      if (rel > 40) {
        if (rel < 180) {
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

  placeSky(entities, heading);
  placeWorld(entities, z, x, floorOf(anim / 8), aiOut);
  placeGantry(entities, z, x, light);

  // Player car: rear-view sheet — frame 0 left / 1 center / 2 right (no spin).
  let carFrame = 1;
  if (steer < -0.25) {
    carFrame = 0;
  }
  if (steer > 0.25) {
    carFrame = 2;
  }
  // Car stays near bottom-center; road slides under via camX (Lou).
  entities.player = {
    x: 240 + x * 36,
    y: 248,
    p0: carFrame,
    scale: 100,
    angle: 0,
    visible: 1
  };

  if (phase == "finished") {
    if (props.action) {
      return initState();
    }
  }

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
    heading: heading,
    anim: anim,
    steer: steer,
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
    mph: floorOf(speed * 780),
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
