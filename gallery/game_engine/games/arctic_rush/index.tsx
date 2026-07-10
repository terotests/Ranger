/// <reference path="../../scripting/game.d.ts" />
//
// Arctic Rush — arcade forest rally (MVP).
//
// Race north before time runs out. Collect pickups, pass checkpoints, dodge traffic.
//
// Controls:
//   Left/Right — steer
//   Up / A     — gas
//   Down / B   — brake
//   Start      — pause
//
// Static level via createStaticBg(); retained bitmap sprites.

import { soundEvent } from "../../scripting/game_helpers";

const WORLD_W = 480;
const WORLD_H = 5000;
const VIEW_H = 270;
const CAR_SCREEN_Y = 210;

const MAX_TRAFFIC = 4;
const MAX_PICKUPS = 8;
const MAX_FX = 4;

const MAX_SPEED = 0.26;
const ACCEL = 0.00014;
const BRAKE = 0.00022;
const COAST = 0.00004;
const OFFROAD_DRAG = 0.00012;
const STEER_RATE = 0.00022;
const STEER_DAMP = 0.92;

const START_TIME = 90;
const COUNTDOWN_MS = 3200;
const CHECKPOINT_BONUS = 25;
const CHECKPOINT_SCORE = 1000;
const TURBO_SCORE = 100;
const COIN_SCORE = 200;
const CLOSE_PASS_SCORE = 250;
const FINISH_Y = 180;

const ROAD = [
  { y: 5000, cx: 240, w: 180 },
  { y: 4700, cx: 210, w: 176 },
  { y: 4400, cx: 270, w: 172 },
  { y: 4100, cx: 200, w: 170 },
  { y: 3800, cx: 280, w: 168 },
  { y: 3500, cx: 230, w: 166 },
  { y: 3200, cx: 260, w: 164 },
  { y: 2900, cx: 190, w: 162 },
  { y: 2600, cx: 300, w: 160 },
  { y: 2300, cx: 220, w: 158 },
  { y: 2000, cx: 270, w: 156 },
  { y: 1700, cx: 200, w: 154 },
  { y: 1400, cx: 250, w: 152 },
  { y: 1100, cx: 210, w: 150 },
  { y: 800, cx: 260, w: 148 },
  { y: 500, cx: 230, w: 146 },
  { y: 200, cx: 240, w: 144 }
];

const CHECKPOINTS = [
  { y: 3800, taken: 0 },
  { y: 2300, taken: 0 },
  { y: 1100, taken: 0 }
];

const TRAFFIC_DEFS = [
  { y: 4550, speed: 0.09 },
  { y: 3650, speed: 0.085 },
  { y: 2750, speed: 0.095 },
  { y: 1850, speed: 0.08 }
];

const PICKUP_DEFS = [
  { y: 4200, kind: "coin" },
  { y: 3300, kind: "coin" },
  { y: 3000, kind: "turbo" },
  { y: 2100, kind: "coin" },
  { y: 1500, kind: "coin" },
  { y: 900, kind: "coin" },
  { y: 600, kind: "coin" },
  { y: 350, kind: "coin" }
];

const CAR_STRAIGHT = [
  "..XX..",
  ".XXXX.",
  "XOXXXO",
  "XXXXXX",
  ".XXXX.",
  "XX..XX"
];

const CAR_LEFT = [
  "..XX..",
  ".XXX..",
  "XOXX..",
  ".XXXXX",
  "..XXX.",
  ".XX..."
];

const CAR_RIGHT = [
  "..XX..",
  "..XXX.",
  "..XXOX",
  "XXXXX.",
  ".XXX..",
  "...XX."
];

const TRAFFIC_CAR = [
  "..XX..",
  ".XXXX.",
  "XXXXXX",
  "XXXXXX",
  ".XXXX.",
  "XX..XX"
];

function iDiv(n, d) {
  let q = 0;
  let acc = n;
  if (d <= 0) {
    return 0;
  }
  while (acc >= d) {
    acc = acc - d;
    q = q + 1;
  }
  return q;
}

function iFloor(n) {
  let v = n;
  if (v < 0) {
    v = 0 - v;
    const q = iDiv(v, 1);
    if (v == q) {
      return 0 - q;
    }
    return 0 - (q + 1);
  }
  return iDiv(v, 1);
}

function iCeil(n) {
  const f = iFloor(n);
  if (n > f) {
    return f + 1;
  }
  return f;
}

function staticLevelHeight() {
  return WORLD_H;
}

function getRoadAt(wy) {
  let i = 0;
  while (i < ROAD.length - 1) {
    const hi = ROAD[i];
    const lo = ROAD[i + 1];
    if (wy <= hi.y) {
      if (wy >= lo.y) {
        const span = hi.y - lo.y;
        let t = 0;
        if (span > 0) {
          t = (hi.y - wy) / span;
        }
        return {
          cx: hi.cx + (lo.cx - hi.cx) * t,
          w: hi.w + (lo.w - hi.w) * t,
          left: 0,
          right: 0
        };
      }
    }
    i = i + 1;
  }
  const last = ROAD[ROAD.length - 1];
  return { cx: last.cx, w: last.w, left: 0, right: 0 };
}

function roadBounds(wy) {
  const r = getRoadAt(wy);
  r.left = r.cx - r.w / 2;
  r.right = r.cx + r.w / 2;
  return r;
}

function drawNightSky() {
  let y = 0;
  while (y < bgHeight) {
    const t = y / bgHeight;
    const r = 8 + t * 18;
    const g = 14 + t * 28;
    const b = 32 + t * 48;
    bgFillRect(0, y, bgWidth, 6, r, g, b);
    y = y + 6;
  }
}

function drawTree(tx, ty, tall) {
  const trunkH = tall ? 18 : 12;
  const trunkW = 6;
  bgFillRect(tx - 3, ty, trunkW, trunkH, 50, 38, 28);
  const rad = tall ? 14 : 10;
  bgFillCircle(tx, ty - 4, rad, 28, 58, 38);
  bgFillCircle(tx - 8, ty + 2, rad - 4, 24, 50, 32);
  bgFillCircle(tx + 8, ty + 2, rad - 4, 24, 50, 32);
}

function drawSnowPatch(sx, sy, sw) {
  bgFillRect(sx, sy, sw, 6, 210, 220, 235);
  bgFillRect(sx + 2, sy + 2, sw - 4, 3, 230, 238, 248);
}

function drawRoadStripe(wy) {
  const rd = roadBounds(wy);
  const left = rd.left;
  const right = rd.right;
  const w = right - left;

  bgFillRect(0, wy, left, 4, 12, 22, 16);
  bgFillRect(right, wy, bgWidth - right, 4, 12, 22, 16);

  const shoulder = 14;
  bgFillRect(left - shoulder, wy, shoulder, 4, 200, 210, 225);
  bgFillRect(right, wy, shoulder, 4, 200, 210, 225);

  bgFillRect(left, wy, w, 4, 48, 52, 58);

  const phase = iDiv(wy, 36) % 2;
  if (phase == 0) {
    const cx = rd.cx;
    bgFillRect(cx - 2, wy, 4, 4, 240, 220, 80);
  }
}

function drawStartLine(wy) {
  const rd = roadBounds(wy);
  let x = rd.left;
  while (x < rd.right) {
    const phase = iDiv(x, 16) % 2;
    if (phase == 0) {
      bgFillRect(x, wy, 16, 8, 240, 240, 250);
    } else {
      bgFillRect(x, wy, 16, 8, 30, 30, 40);
    }
    x = x + 16;
  }
}

function drawFinishLine(wy) {
  const rd = roadBounds(wy);
  bgFillRect(rd.left, wy, rd.right - rd.left, 10, 240, 60, 60);
  bgFillRect(rd.left, wy + 10, rd.right - rd.left, 4, 240, 220, 60);
}

function createStaticBg() {
  drawNightSky();

  let y = 0;
  while (y < WORLD_H) {
    drawRoadStripe(y);
    y = y + 4;
  }

  drawStartLine(4980);
  drawFinishLine(FINISH_Y);

  let ty = 120;
  while (ty < WORLD_H) {
    const rd = roadBounds(ty);
    const seed = iDiv(ty, 70);
    const leftTree = (seed * 17) % 3;
    const rightTree = (seed * 13) % 3;
    if (leftTree == 0) {
      drawTree(rd.left - 28 - (seed % 20), ty, seed % 2 == 0);
    }
    if (rightTree == 0) {
      drawTree(rd.right + 28 + (seed % 16), ty, seed % 2 == 1);
    }
    if (seed % 5 == 0) {
      drawSnowPatch(rd.left - 10, ty + 2, 8);
      drawSnowPatch(rd.right + 2, ty + 2, 8);
    }
    ty = ty + 70;
  }

  let ci = 0;
  while (ci < CHECKPOINTS.length) {
    const cy = CHECKPOINTS[ci].y;
    const rd = roadBounds(cy);
    bgFillRect(rd.left, cy, rd.right - rd.left, 6, 60, 200, 255);
    ci = ci + 1;
  }
}

function carSprite(id, frames, br, bg, bb) {
  return {
    id: id,
    kind: "bitmap",
    px: 3,
    br: br,
    bg: bg,
    bb: bb,
    er: 40,
    eg: 40,
    eb: 50,
    frames: frames
  };
}

function sprites() {
  const list = [];
  list.push(
    carSprite("car", [CAR_STRAIGHT, CAR_LEFT, CAR_RIGHT], 230, 50, 45)
  );
  let t = 0;
  while (t < MAX_TRAFFIC) {
    list.push(
      carSprite("traffic" + t, [TRAFFIC_CAR, TRAFFIC_CAR], 70, 120, 200)
    );
    t = t + 1;
  }
  let p = 0;
  while (p < MAX_PICKUPS) {
    list.push({ id: "pickup" + p, kind: "circle", rad: 7, r: 255, g: 210, b: 50 });
    p = p + 1;
  }
  let f = 0;
  while (f < MAX_FX) {
    list.push({ id: "fx" + f, kind: "circle", rad: 5, r: 220, g: 230, b: 255 });
    f = f + 1;
  }
  return list;
}

function makeTraffic() {
  const out = [];
  let i = 0;
  while (i < MAX_TRAFFIC) {
    const d = TRAFFIC_DEFS[i];
    const rd = roadBounds(d.y);
    out.push({
      y: d.y,
      x: rd.cx,
      speed: d.speed,
      minY: d.y - 180,
      maxY: d.y + 40,
      passed: 0,
      closePass: 0
    });
    i = i + 1;
  }
  return out;
}

function makePickups() {
  const out = [];
  let i = 0;
  while (i < MAX_PICKUPS) {
    const d = PICKUP_DEFS[i];
    const rd = roadBounds(d.y);
    const side = i % 2 == 0 ? -1 : 1;
    out.push({
      y: d.y,
      x: rd.cx + side * 30,
      kind: d.kind,
      taken: 0
    });
    i = i + 1;
  }
  return out;
}

function makeCheckpoints() {
  const out = [];
  let i = 0;
  while (i < CHECKPOINTS.length) {
    out.push({ y: CHECKPOINTS[i].y, taken: 0 });
    i = i + 1;
  }
  return out;
}

function makeFx() {
  const out = [];
  let i = 0;
  while (i < MAX_FX) {
    out.push({ active: 0, x: 0, y: 0, life: 0 });
    i = i + 1;
  }
  return out;
}

function initState() {
  const startY = 4940;
  const rd = roadBounds(startY);
  return {
    showNet: 0,
    playerSlots: 1,
    phase: "countdown",
    countdownMs: COUNTDOWN_MS,
    paused: 0,
    cameraY: startY - CAR_SCREEN_Y,
    entities: {},
    car: {
      x: rd.cx,
      y: startY,
      speed: 0,
      steer: 0,
      frame: 0
    },
    traffic: makeTraffic(),
    pickups: makePickups(),
    checkpoints: makeCheckpoints(),
    fx: makeFx(),
    timeLeft: START_TIME,
    score: 0,
    distanceScore: 0,
    collectScore: 0,
    passScore: 0,
    checkpointScore: 0,
    msg: "",
    msgTick: 0,
    hitCd: 0,
    finishTick: 0
  };
}

function readInput(props) {
  const input = props.input;
  let left = props.left;
  let right = props.right;
  let gas = props.up || props.action;
  let brake = props.down;
  let pause = false;
  if (input) {
    if (input.players[0]) {
      const p = input.players[0];
      left = p.left;
      right = p.right;
      if (p.up || p.a) {
        gas = true;
      }
      if (p.down || p.b) {
        brake = true;
      }
      if (p.start) {
        pause = true;
      }
    }
  }
  return { left: left, right: right, gas: gas, brake: brake, pause: pause };
}

function clampX(x) {
  if (x < 16) {
    return 16;
  }
  if (x > WORLD_W - 16) {
    return WORLD_W - 16;
  }
  return x;
}

function onRoad(x, y) {
  const rd = roadBounds(y);
  const margin = 6;
  if (x < rd.left + margin) {
    return false;
  }
  if (x > rd.right - margin) {
    return false;
  }
  return true;
}

function spawnFx(fx, x, y) {
  let i = 0;
  while (i < MAX_FX) {
    if (fx[i].active == 0) {
      fx[i] = { active: 1, x: x, y: y, life: 400 };
      return;
    }
    i = i + 1;
  }
}

function hitCar(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  if (dx < -18) {
    return false;
  }
  if (dx > 18) {
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

function hitPickup(px, py, pk) {
  const dx = px - pk.x;
  const dy = py - pk.y;
  if ((dx * dx) + (dy * dy) > 16 * 16) {
    return false;
  }
  return true;
}

function padScore(n) {
  let s = "" + n;
  while (s.length < 6) {
    s = "0" + s;
  }
  return s;
}

function padTime(n) {
  const v = iCeil(n);
  if (v < 10) {
    return "0" + v;
  }
  return "" + v;
}

function placeEntities(s, cam) {
  const entities = {};
  entities.car = {
    x: s.car.x,
    y: s.car.y - cam,
    p0: s.car.frame,
    visible: 1
  };
  let t = 0;
  while (t < MAX_TRAFFIC) {
    const tr = s.traffic[t];
    entities["traffic" + t] = {
      x: tr.x,
      y: tr.y - cam,
      visible: 1,
      p0: 0
    };
    t = t + 1;
  }
  let p = 0;
  while (p < MAX_PICKUPS) {
    const pk = s.pickups[p];
    if (pk.taken == 0) {
      let col = { r: 255, g: 210, b: 50 };
      if (pk.kind == "turbo") {
        col = { r: 80, g: 220, b: 255 };
      }
      entities["pickup" + p] = {
        x: pk.x,
        y: pk.y - cam,
        visible: 1,
        r: col.r,
        g: col.g,
        b: col.b,
        rad: pk.kind == "turbo" ? 9 : 7
      };
    } else {
      entities["pickup" + p] = { x: -40, y: -40, visible: 0 };
    }
    p = p + 1;
  }
  let f = 0;
  while (f < MAX_FX) {
    const fx = s.fx[f];
    if (fx.active == 1) {
      entities["fx" + f] = {
        x: fx.x,
        y: fx.y - cam,
        visible: 1,
        rad: 4 + iDiv(fx.life, 100)
      };
    } else {
      entities["fx" + f] = { x: -40, y: -40, visible: 0 };
    }
    f = f + 1;
  }
  return entities;
}

function hud(props) {
  const s = props.state;
  const spd = iFloor(s.car.speed * 1000);
  let topMsg = "ARCTIC RUSH — Race the night. Beat the storm.";
  if (s.phase == "countdown") {
    const sec = iCeil(s.countdownMs / 1000);
    if (sec > 3) {
      topMsg = "GET READY...";
    } else {
      if (sec > 0) {
        topMsg = "" + sec;
      } else {
        topMsg = "GO!";
      }
    }
  }
  if (s.phase == "finish") {
    topMsg = "FINISH! TIME BONUS " + iFloor(s.timeLeft * 50);
  }
  if (s.phase == "timeout") {
    topMsg = "TIME UP — press ACTION to retry";
  }
  if (s.paused == 1) {
    topMsg = "PAUSED";
  }
  let centerMsg = s.msg;
  if (s.msgTick > 0) {
    centerMsg = s.msg;
  }
  return (
    <View flexDirection="column" padding="4px" background="#081018cc">
      <View flexDirection="row" justifyContent="space-between">
        <Label
          text={"SCORE " + padScore(s.score)}
          color="#ffd040"
          fontSize="11px"
        />
        <Label
          text={"TIME " + padTime(s.timeLeft)}
          color="#8cd3ff"
          fontSize="11px"
        />
      </View>
      <Label text={topMsg} color="#e8f0ff" fontSize="11px" padding="2px" />
      <View flexDirection="row" justifyContent="space-between">
        <Label text={"SPEED " + spd} color="#8cd3ff" fontSize="10px" />
        <Label text={"STAGE 1/1"} color="#90a8c0" fontSize="10px" />
      </View>
      {centerMsg != "" ? (
        <Label text={centerMsg} color="#ff9060" fontSize="12px" padding="4px" />
      ) : null}
      {s.phase == "finish" ? (
        <Label
          text={
            "TOTAL " +
            s.score +
            "  CP:" +
            s.checkpointScore +
            "  COL:" +
            s.collectScore
          }
          color="#ffd040"
          fontSize="10px"
        />
      ) : null}
    </View>
  );
}

function updateCountdown(s, dt) {
  let ms = s.countdownMs - dt;
  let phase = s.phase;
  if (ms <= 0) {
    ms = 0;
    phase = "race";
  }
  const cam = s.car.y - CAR_SCREEN_Y;
  return {
    showNet: 0,
    playerSlots: 1,
    phase: phase,
    countdownMs: ms,
    paused: 0,
    cameraY: cam,
    entities: placeEntities(s, cam),
    car: s.car,
    traffic: s.traffic,
    pickups: s.pickups,
    checkpoints: s.checkpoints,
    fx: s.fx,
    timeLeft: s.timeLeft,
    score: s.score,
    distanceScore: s.distanceScore,
    collectScore: s.collectScore,
    passScore: s.passScore,
    checkpointScore: s.checkpointScore,
    msg: phase == "race" ? "GO!" : s.msg,
    msgTick: phase == "race" ? 800 : 0,
    hitCd: 0,
    finishTick: 0,
    events: phase == "race" ? [soundEvent("blip")] : []
  };
}

function updateRace(props, s, dt) {
  const inp = readInput(props);
  const events = [];

  if (inp.pause) {
    return {
      showNet: 0,
      playerSlots: 1,
      phase: s.phase,
      countdownMs: s.countdownMs,
      paused: s.paused == 1 ? 0 : 1,
      cameraY: s.cameraY,
      entities: s.entities,
      car: s.car,
      traffic: s.traffic,
      pickups: s.pickups,
      checkpoints: s.checkpoints,
      fx: s.fx,
      timeLeft: s.timeLeft,
      score: s.score,
      distanceScore: s.distanceScore,
      collectScore: s.collectScore,
      passScore: s.passScore,
      checkpointScore: s.checkpointScore,
      msg: s.msg,
      msgTick: s.msgTick,
      hitCd: s.hitCd,
      finishTick: s.finishTick,
      events: events
    };
  }

  if (s.paused == 1) {
    return {
      showNet: 0,
      playerSlots: 1,
      phase: s.phase,
      countdownMs: s.countdownMs,
      paused: 1,
      cameraY: s.cameraY,
      entities: s.entities,
      car: s.car,
      traffic: s.traffic,
      pickups: s.pickups,
      checkpoints: s.checkpoints,
      fx: s.fx,
      timeLeft: s.timeLeft,
      score: s.score,
      distanceScore: s.distanceScore,
      collectScore: s.collectScore,
      passScore: s.passScore,
      checkpointScore: s.checkpointScore,
      msg: s.msg,
      msgTick: s.msgTick,
      hitCd: s.hitCd,
      finishTick: s.finishTick,
      events: events
    };
  }

  let car = {
    x: s.car.x,
    y: s.car.y,
    speed: s.car.speed,
    steer: s.car.steer,
    frame: 0
  };

  let steerIn = 0;
  if (inp.left) {
    steerIn = steerIn - 1;
  }
  if (inp.right) {
    steerIn = steerIn + 1;
  }
  car.steer = car.steer * STEER_DAMP + steerIn * STEER_RATE * dt;

  if (inp.gas) {
    car.speed = car.speed + ACCEL * dt;
  } else {
    if (inp.brake) {
      car.speed = car.speed - BRAKE * dt;
    } else {
      car.speed = car.speed - COAST * dt;
    }
  }
  if (car.speed > MAX_SPEED) {
    car.speed = MAX_SPEED;
  }
  if (car.speed < 0) {
    car.speed = 0;
  }

  const rd = roadBounds(car.y);
  const off = onRoad(car.x, car.y) == false;
  if (off) {
    car.speed = car.speed - OFFROAD_DRAG * dt;
    if (car.speed < 0.02) {
      car.speed = 0.02;
    }
  }

  const turnFactor = 1 + car.speed * 1.8;
  car.x = car.x + car.steer * turnFactor * dt;
  car.x = clampX(car.x);

  if (car.speed > 0.01) {
    car.y = car.y - car.speed * dt;
  }

  if (steerIn < 0) {
    car.frame = 1;
  } else {
    if (steerIn > 0) {
      car.frame = 2;
    } else {
      car.frame = 0;
    }
  }

  let timeLeft = s.timeLeft - dt / 1000;
  let score = s.score;
  let distanceScore = s.distanceScore;
  let collectScore = s.collectScore;
  let passScore = s.passScore;
  let checkpointScore = s.checkpointScore;
  let msg = s.msg;
  let msgTick = s.msgTick;
  if (msgTick > 0) {
    msgTick = msgTick - dt;
    if (msgTick <= 0) {
      msg = "";
      msgTick = 0;
    }
  }

  const distGain = iFloor(car.speed * dt * 0.15);
  distanceScore = distanceScore + distGain;
  score = score + distGain;

  const traffic = [];
  let ti = 0;
  while (ti < MAX_TRAFFIC) {
    traffic.push(s.traffic[ti]);
    ti = ti + 1;
  }

  let hitCd = s.hitCd;
  if (hitCd > 0) {
    hitCd = hitCd - dt;
  }

  ti = 0;
  while (ti < MAX_TRAFFIC) {
    let tr = traffic[ti];
    tr.y = tr.y - tr.speed * dt;
    if (tr.y < tr.minY) {
      tr.y = tr.maxY;
      tr.passed = 0;
      tr.closePass = 0;
      const nrd = roadBounds(tr.y);
      tr.x = nrd.cx;
    }
    if (car.y < tr.y) {
      if (tr.passed == 0) {
        tr.passed = 1;
        let dx = car.x - tr.x;
        if (dx < 0) {
          dx = 0 - dx;
        }
        if (dx < 34) {
          if (tr.closePass == 0) {
            tr.closePass = 1;
            passScore = passScore + CLOSE_PASS_SCORE;
            score = score + CLOSE_PASS_SCORE;
            msg = "CLOSE PASS +" + CLOSE_PASS_SCORE;
            msgTick = 1200;
            events.push(soundEvent("win"));
          }
        }
      }
    }
    if (hitCd <= 0) {
      if (hitCar(car.x, car.y, tr.x, tr.y)) {
        car.speed = car.speed * 0.35;
        hitCd = 900;
        msg = "CRASH!";
        msgTick = 900;
        events.push(soundEvent("lose"));
      }
    }
    traffic[ti] = tr;
    ti = ti + 1;
  }

  const pickups = [];
  let pi = 0;
  while (pi < MAX_PICKUPS) {
    pickups.push(s.pickups[pi]);
    pi = pi + 1;
  }
  pi = 0;
  while (pi < MAX_PICKUPS) {
    if (pickups[pi].taken == 0) {
      if (hitPickup(car.x, car.y, pickups[pi])) {
        const pkKind = pickups[pi].kind;
        pickups[pi] = {
          y: pickups[pi].y,
          x: pickups[pi].x,
          kind: pkKind,
          taken: 1
        };
        if (pkKind == "turbo") {
          collectScore = collectScore + TURBO_SCORE;
          score = score + TURBO_SCORE;
          msg = "TURBO +" + TURBO_SCORE;
        } else {
          collectScore = collectScore + COIN_SCORE;
          score = score + COIN_SCORE;
          msg = "+" + COIN_SCORE;
        }
        msgTick = 1000;
        events.push(soundEvent("blip"));
      }
    }
    pi = pi + 1;
  }

  const checkpoints = [];
  let ci = 0;
  while (ci < CHECKPOINTS.length) {
    checkpoints.push(s.checkpoints[ci]);
    ci = ci + 1;
  }
  ci = 0;
  while (ci < checkpoints.length) {
    if (checkpoints[ci].taken == 0) {
      if (car.y <= checkpoints[ci].y) {
        checkpoints[ci] = { y: checkpoints[ci].y, taken: 1 };
        timeLeft = timeLeft + CHECKPOINT_BONUS;
        checkpointScore = checkpointScore + CHECKPOINT_SCORE;
        score = score + CHECKPOINT_SCORE;
        msg = "CHECKPOINT! TIME +" + CHECKPOINT_BONUS;
        msgTick = 1500;
        events.push(soundEvent("win"));
      }
    }
    ci = ci + 1;
  }

  const fx = [];
  let fi = 0;
  while (fi < MAX_FX) {
    fx.push(s.fx[fi]);
    fi = fi + 1;
  }
  if (off && car.speed > 0.05) {
    spawnFx(fx, car.x + (car.steer > 0 ? 8 : -8), car.y);
  }
  fi = 0;
  while (fi < MAX_FX) {
    if (fx[fi].active == 1) {
      let life = fx[fi].life - dt;
      if (life <= 0) {
        fx[fi] = { active: 0, x: 0, y: 0, life: 0 };
      } else {
        fx[fi] = { active: 1, x: fx[fi].x, y: fx[fi].y, life: life };
      }
    }
    fi = fi + 1;
  }

  let phase = s.phase;
  let finishTick = s.finishTick;
  if (car.y <= FINISH_Y) {
    phase = "finish";
    const timeBonus = iFloor(timeLeft * 50);
    score = score + timeBonus;
    msg = "YOU MADE IT!";
    msgTick = 5000;
    events.push(soundEvent("win"));
    finishTick = 0;
  } else {
    if (timeLeft <= 0) {
      phase = "timeout";
      timeLeft = 0;
      msg = "TIME UP";
      msgTick = 99999;
      events.push(soundEvent("lose"));
    }
  }

  const cameraY = car.y - CAR_SCREEN_Y;
  const entities = placeEntities(
    { car: car, traffic: traffic, pickups: pickups, fx: fx },
    cameraY
  );

  return {
    showNet: 0,
    playerSlots: 1,
    phase: phase,
    countdownMs: s.countdownMs,
    paused: 0,
    cameraY: cameraY,
    entities: entities,
    car: car,
    traffic: traffic,
    pickups: pickups,
    checkpoints: checkpoints,
    fx: fx,
    timeLeft: timeLeft,
    score: score,
    distanceScore: distanceScore,
    collectScore: collectScore,
    passScore: passScore,
    checkpointScore: checkpointScore,
    msg: msg,
    msgTick: msgTick,
    hitCd: hitCd,
    finishTick: finishTick,
    events: events
  };
}

function update(props) {
  const s = props.state;
  const dt = props.dt;

  if (s.phase == "countdown") {
    return updateCountdown(s, dt);
  }

  if (s.phase == "race") {
    return updateRace(props, s, dt);
  }

  if (s.phase == "finish") {
    const tick = s.finishTick + dt;
    const cam = s.car.y - CAR_SCREEN_Y;
    return {
      showNet: 0,
      playerSlots: 1,
      phase: s.phase,
      countdownMs: s.countdownMs,
      paused: 0,
      cameraY: cam,
      entities: placeEntities(s, cam),
      car: s.car,
      traffic: s.traffic,
      pickups: s.pickups,
      checkpoints: s.checkpoints,
      fx: s.fx,
      timeLeft: s.timeLeft,
      score: s.score,
      distanceScore: s.distanceScore,
      collectScore: s.collectScore,
      passScore: s.passScore,
      checkpointScore: s.checkpointScore,
      msg: s.msg,
      msgTick: s.msgTick,
      hitCd: s.hitCd,
      finishTick: tick,
      events: []
    };
  }

  if (s.phase == "timeout") {
    if (props.action) {
      return initState();
    }
    const cam = s.cameraY;
    return {
      showNet: 0,
      playerSlots: 1,
      phase: s.phase,
      countdownMs: s.countdownMs,
      paused: 0,
      cameraY: cam,
      entities: s.entities,
      car: s.car,
      traffic: s.traffic,
      pickups: s.pickups,
      checkpoints: s.checkpoints,
      fx: s.fx,
      timeLeft: s.timeLeft,
      score: s.score,
      distanceScore: s.distanceScore,
      collectScore: s.collectScore,
      passScore: s.passScore,
      checkpointScore: s.checkpointScore,
      msg: s.msg,
      msgTick: s.msgTick,
      hitCd: s.hitCd,
      finishTick: s.finishTick,
      events: []
    };
  }

  return s;
}
