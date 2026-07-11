/// <reference path="../../scripting/game.d.ts" />
//
// Autopeli Physics — top-down racer on host physics (game_physics).
// Physics I/O: return state.physics { controls, impulses }; read state.physicsContacts (phase "begin").
//

const VIEW_W = 480;
const VIEW_H = 270;
const WORLD_H = 6000;
const ROAD_STEP = 120;

const ROAD_POINTS = [
  { y: 6000, x: 240, half: 106 },
  { y: 5200, x: 200, half: 50 },
  { y: 4400, x: 300, half: 92 },
  { y: 3600, x: 210, half: 86 },
  { y: 2800, x: 310, half: 90 },
  { y: 2000, x: 170, half: 78 },
  { y: 1200, x: 290, half: 82 },
  { y: 400, x: 210, half: 48 },
  { y: 100, x: 240, half: 94 }
];

const OIL_PATCHES = [
  { x: 280, y: 5100, r: 42 },
  { x: 160, y: 3900, r: 36 },
  { x: 320, y: 2500, r: 44 },
  { x: 190, y: 1500, r: 38 }
];

const CONES = [
  { id: "c0", x: 280, y: 5100 },
  { id: "c1", x: 160, y: 3900 },
  { id: "c2", x: 320, y: 2500 },
  { id: "c3", x: 190, y: 1500 }
];

const CONE_R = 10;

const RAMPS = [
  { x: 260, y: 5400, w: 36, h: 20 },
  { x: 180, y: 4100, w: 40, h: 22 },
  { x: 300, y: 2200, w: 38, h: 20 }
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
      const center = a.x + (b.x - a.x) * t;
      const half = a.half + (b.half - a.half) * t;
      return { center: center, half: half };
    }
    i = i + 1;
  }
  const last = ROAD_POINTS[ROAD_POINTS.length - 1];
  return { center: last.x, half: last.half };
}

function surfaceGrip(x, y) {
  let grip = 1.0;
  const r = roadAt(y);
  const edge = r.half - 14;
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
    const dx = x - o.x;
    const dy = y - o.y;
    const d2 = dx * dx + dy * dy;
    const rr = o.r * o.r;
    if (d2 < rr) {
      grip = 0.14;
    }
    oi = oi + 1;
  }
  return grip;
}

function physicsBounds() {
  const bounds = [];
  let y = 0;
  while (y < WORLD_H) {
    const r = roadAt(y);
    const y2 = y + ROAD_STEP;
    const r2 = roadAt(y2);
    const left = r.center - r.half;
    const left2 = r2.center - r2.half;
    const right = r.center + r.half;
    const right2 = r2.center + r2.half;
    bounds.push({
      kind: "segment",
      id: "L" + y,
      x1: left,
      y1: y,
      x2: left2,
      y2: y2,
      restitution: 0.32,
      spinOnHit: 280
    });
    bounds.push({
      kind: "segment",
      id: "R" + y,
      x1: right,
      y1: y,
      x2: right2,
      y2: y2,
      restitution: 0.32,
      spinOnHit: 280
    });
    y = y + ROAD_STEP;
  }
  return bounds;
}

function sprites() {
  return [
    { id: "p1", kind: "rect", w: 18, h: 28, r: 70, g: 170, b: 255 },
    { id: "p2", kind: "rect", w: 18, h: 28, r: 255, g: 120, b: 90 },
    { id: "t0", kind: "rect", w: 16, h: 24, r: 220, g: 220, b: 80 },
    { id: "t1", kind: "rect", w: 16, h: 24, r: 200, g: 200, b: 70 },
    { id: "t2", kind: "rect", w: 16, h: 24, r: 180, g: 180, b: 60 },
    { id: "cone", kind: "circle", rad: CONE_R, r: 255, g: 160, b: 40 }
  ];
}

function coneEntity(c) {
  return {
    id: c.id,
    sprite: "cone",
    position: { x: c.x, y: c.y },
    static: true,
    collision: { r: CONE_R },
    restitution: 0.45,
    spinOnWall: 360
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
      chassis: { w: 14, h: 20 },
      mass: 1.15,
      inertia: 820,
      wheelInertia: 0.12,
      maxSpeed: maxSpeed,
      accel: 520,
      brake: 680,
      drag: 0.94,
      steerRate: 118,
      steerAngle: 0.38,
      lateralGrip: 48,
      maxLateralForce: 180,
      grip: grip,
      slipThreshold: 0.62,
      slipSpin: 0.028,
      angularDamping: 0.92,
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
  const r0 = roadAt(WORLD_H - 140);
  const r1 = roadAt(WORLD_H - 180);
  return [
    carBody("p1", "p1", r0.center - 28, WORLD_H - 140, 310, 1.0, false),
    carBody("p2", "p2", r0.center + 28, WORLD_H - 140, 310, 1.0, false),
    carBody("t0", "t0", r1.center - 34, WORLD_H - 520, 130, 0.95, true),
    carBody("t1", "t1", r1.center + 40, WORLD_H - 1100, 125, 0.95, true),
    carBody("t2", "t2", r1.center - 20, WORLD_H - 1800, 128, 0.95, true),
    coneEntity(CONES[0]),
    coneEntity(CONES[1]),
    coneEntity(CONES[2]),
    coneEntity(CONES[3])
  ];
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
    if (y % 80 === 0) {
      bgFillRect(r.center - 2, y, 4, 24, 240, 220, 80);
    }
    let oi = 0;
    while (oi < OIL_PATCHES.length) {
      const o = OIL_PATCHES[oi];
      if (o.y >= y && o.y < y + 8) {
        bgFillCircle(o.x, o.y, o.r, 40, 50, 70);
      }
      oi = oi + 1;
    }
    let ri = 0;
    while (ri < RAMPS.length) {
      const ramp = RAMPS[ri];
      if (ramp.y >= y && ramp.y < y + 8) {
        bgFillRect(ramp.x - ramp.w / 2, ramp.y, ramp.w, ramp.h, 225, 180, 70);
      }
      ri = ri + 1;
    }
    let ci = 0;
    while (ci < CONES.length) {
      const cone = CONES[ci];
      if (cone.y >= y && cone.y < y + 8) {
        bgFillCircle(cone.x, cone.y, CONE_R, 255, 160, 40);
      }
      ci = ci + 1;
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
    rampCd: { p1: 0, p2: 0 }
  };
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
    if (x >= r.x - r.w / 2) {
      if (x <= r.x + r.w / 2) {
        if (y >= r.y) {
          if (y <= r.y + r.h) {
            return true;
          }
        }
      }
    }
    i = i + 1;
  }
  return false;
}

function isPlayer(id) {
  return id === "p1" || id === "p2";
}

function isWall(id) {
  if (id.length < 1) {
    return false;
  }
  const c = id.charAt(0);
  return c === "L" || c === "R";
}

function isCone(id) {
  if (id.length < 1) {
    return false;
  }
  return id.charAt(0) === "c";
}

function hashSpin(x, y, t) {
  let s = x * 13 + y * 79 + t * 0.07;
  s = s % 720;
  if (s < 0) {
    s = 0 - s;
  }
  if (s < 360) {
    return 180 + s;
  }
  return 0 - (180 + (s - 360));
}

function update(props) {
  const s = props.state;
  const events = [];
  let hits = s.hits;
  let score = s.score;
  let someoneWon = s.someoneWon;
  const airTick = { p1: s.airTick.p1, p2: s.airTick.p2 };
  const rampCd = { p1: s.rampCd.p1, p2: s.rampCd.p2 };
  const now = props.time || 0;

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
          if (isWall(otherId)) {
            hits = hits + 1;
            score = score + 50;
            events.push({ kind: "playSound", id: "wall" });
            const impact = c.normalImpulse;
            if (impact != null && impact > 80) {
              events.push({
                kind: "particles",
                id: "sparkle",
                x: c.x,
                y: c.y,
                amount: 6
              });
            }
          }
          if (isCone(otherId)) {
            hits = hits + 1;
            impulses.push({
              body: playerId,
              linear: { x: 0, y: 0 },
              angular: hashSpin(c.x, c.y, now)
            });
            events.push({ kind: "playSound", id: "wall" });
          }
        }
      }
      ci = ci + 1;
    }
  }

  const p1Cmd = driveInput(readBtn(props, 0));
  const p2Cmd = driveInput(readBtn(props, 1));
  const we = s.worldEntities;

  let p1Grip = 1.0;
  let p2Grip = 1.0;
  let t0Grip = 0.95;
  let t1Grip = 0.95;
  let t2Grip = 0.95;

  if (we) {
    if (we.p1) {
      p1Grip = surfaceGrip(we.p1.x, we.p1.y);
    }
    if (we.p2) {
      p2Grip = surfaceGrip(we.p2.x, we.p2.y);
    }
    if (we.t0) {
      t0Grip = surfaceGrip(we.t0.x, we.t0.y);
    }
    if (we.t1) {
      t1Grip = surfaceGrip(we.t1.x, we.t1.y);
    }
    if (we.t2) {
      t2Grip = surfaceGrip(we.t2.x, we.t2.y);
    }
    if (we.p1 && rampCd.p1 <= 0) {
      if (hitRamp(we.p1.x, we.p1.y)) {
        impulses.push({ body: "p1", linear: { x: 0, y: -95 }, angular: 320 });
        rampCd.p1 = 700;
        airTick.p1 = 900;
        events.push({ kind: "playSound", id: "bounce" });
      }
    }
    if (we.p2 && rampCd.p2 <= 0) {
      if (hitRamp(we.p2.x, we.p2.y)) {
        impulses.push({ body: "p2", linear: { x: 0, y: -95 }, angular: 320 });
        rampCd.p2 = 700;
        airTick.p2 = 900;
        events.push({ kind: "playSound", id: "bounce" });
      }
    }
  }

  if (rampCd.p1 > 0) {
    rampCd.p1 = rampCd.p1 - props.dt;
    if (rampCd.p1 < 0) {
      rampCd.p1 = 0;
    }
  }
  if (rampCd.p2 > 0) {
    rampCd.p2 = rampCd.p2 - props.dt;
    if (rampCd.p2 < 0) {
      rampCd.p2 = 0;
    }
  }
  if (airTick.p1 > 0) {
    airTick.p1 = airTick.p1 - props.dt;
    if (airTick.p1 < 0) {
      airTick.p1 = 0;
    }
  }
  if (airTick.p2 > 0) {
    airTick.p2 = airTick.p2 - props.dt;
    if (airTick.p2 < 0) {
      airTick.p2 = 0;
    }
  }

  if (we && !someoneWon) {
    if (we.p1 && we.p1.y < 140) {
      score = score + 5000;
      someoneWon = true;
      events.push({ kind: "playSound", id: "win" });
    } else {
      if (we.p2 && we.p2.y < 140) {
        score = score + 5000;
        someoneWon = true;
        events.push({ kind: "playSound", id: "win" });
      }
    }
  }

  const physics = {
    controls: {
      p1: { steer: p1Cmd.steer, throttle: p1Cmd.throttle, brake: p1Cmd.brake, grip: p1Grip },
      p2: { steer: p2Cmd.steer, throttle: p2Cmd.throttle, brake: p2Cmd.brake, grip: p2Grip },
      t0: { steer: 0, throttle: 0.42, brake: 0, grip: t0Grip },
      t1: { steer: 0, throttle: 0.38, brake: 0, grip: t1Grip },
      t2: { steer: 0, throttle: 0.4, brake: 0, grip: t2Grip }
    },
    impulses: impulses
  };

  return {
    score: score,
    hits: hits,
    playerSlots: 2,
    someoneWon: someoneWon,
    airTick: airTick,
    rampCd: rampCd,
    physics: physics as PhysicsStepInput,
    events: events
  };
}

function hud(props) {
  const s = props.state;
  const we = s.worldEntities;
  let spd = 0;
  let grip = 1;
  if (we && we.p1) {
    if (we.p1.speed != null) {
      spd = we.p1.speed;
    }
    if (we.p1.angle != null) {
      grip = surfaceGrip(we.p1.x, we.p1.y);
    }
  }
  let air = "";
  if (s.airTick && s.airTick.p1 > 0) {
    air = "  AIR!";
  }
  return (
    <View flexDirection="row" padding="6px" width="100%">
      <Label color="#8fd3ff">SPD </Label>
      <Label color="#ffffff">{Math.round(spd)}</Label>
      <Label color="#6a7a9a">  grip={Math.round(grip * 100)}%</Label>
      <Label color="#ffd080">  hits={s.hits}{air}</Label>
    </View>
  );
}
