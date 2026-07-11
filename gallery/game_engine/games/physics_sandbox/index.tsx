/// <reference path="../../scripting/game.d.ts" />
//
// physics_sandbox — Cannon flipper + peg test arena.
// Tune layout and feel via the constants below; update() only forwards input.
//

const VIEW_W = 480;
const VIEW_H = 270;

// --- Flipper (pivot = hinge, physics tip sphere at bat end) ----------------
const FLIPPER_PIVOT = { x: 240, y: 218 };
const FLIPPER_LENGTH = 72;
const FLIPPER_THICK = 12;
const FLIPPER_REST_ANGLE = -38;
const FLIPPER_PRESSED_ANGLE = 28;
const FLIPPER_TIP_RADIUS = 14;
const FLIPPER_SPEED = 480;
const DEG_TO_RAD = 0.017453292519943295;

function flipperColliders() {
  return [
    { radius: FLIPPER_TIP_RADIUS, offsetX: FLIPPER_LENGTH, offsetY: 0 },
    {
      radius: FLIPPER_TIP_RADIUS * 1.15,
      offsetX: FLIPPER_LENGTH * 0.55,
      offsetY: 0,
    },
  ];
}

function stepFlipperAngle(current, pressed, dtMs) {
  const target = pressed ? FLIPPER_PRESSED_ANGLE : FLIPPER_REST_ANGLE;
  const dt = dtMs / 1000;
  const maxStep = FLIPPER_SPEED * dt;
  let cur = current;
  const diff = target - cur;
  if (diff < 0) {
    if (0 - diff < maxStep) {
      cur = target;
    } else {
      cur = cur - maxStep;
    }
  } else {
    if (diff < maxStep) {
      cur = target;
    } else {
      cur = cur + maxStep;
    }
  }
  let omega = 0;
  if (dt > 0) {
    omega = ((cur - current) * DEG_TO_RAD) / dt;
  }
  return { angle: cur, omega: omega };
}

// --- Static pegs -------------------------------------------------------------
const PEG_RADIUS = 18;
const PEG_POINTS = 100;
const PEGS = [
  { id: "pegL", x: 18, y: 108 },
  { id: "pegR", x: 362, y: 108 },
];

// --- Launch (Down = one pulse per press) ------------------------------------
const LAUNCH_SPEED_MIN = 180;
const LAUNCH_SPEED_MAX = 320;

// --- Dynamic bodies (a/b keep head-on spawn for headless collision test) ----
const HERO_RADIUS = 22;
const HERO_MASS = 1;

function sheetSprite(id, path, frameCol) {
  return {
    id,
    kind: "sheet",
    path,
    frameW: 64,
    frameH: 64,
    cols: 9,
    rows: 4,
    scale: 52,
    feetTrim: 10,
    p0: frameCol,
    p1: 0,
  };
}

function config() {
  return {
    world: { width: VIEW_W, height: VIEW_H },
    physics: {
      enabled: true,
      cannon: true,
      gravityY: 320,
      restitution: 0.82,
    },
  };
}

function sprites() {
  return [
    sheetSprite("heroA", "assets/hero_walk.png", 0),
    sheetSprite("heroB", "assets/hero2_walk.png", 2),
    sheetSprite("heroC", "assets/hero_walk.png", 4),
    { id: "ball", kind: "circle", rad: 10, r: 255, g: 220, b: 80 },
    { id: "peg", kind: "circle", rad: PEG_RADIUS, r: 200, g: 90, b: 90 },
    {
      id: "flipper",
      kind: "rect",
      w: FLIPPER_LENGTH,
      h: FLIPPER_THICK,
      r: 230,
      g: 190,
      b: 70,
    },
  ];
}

function entities() {
  const list = [
    {
      id: "a",
      sprite: "heroA",
      frame: 0,
      position: { x: 80, y: 90 },
      physics: { radius: HERO_RADIUS, mass: HERO_MASS, vx: 320, vy: 0, stable: true },
    },
    {
      id: "b",
      sprite: "heroB",
      frame: 2,
      position: { x: 400, y: 90 },
      physics: { radius: HERO_RADIUS, mass: HERO_MASS, vx: -320, vy: 0, stable: false },
    },
    {
      id: "c",
      sprite: "heroC",
      frame: 4,
      position: { x: 200, y: 72 },
      physics: { radius: HERO_RADIUS, mass: HERO_MASS, vx: 40, vy: 60, stable: true },
    },
    {
      id: "d",
      sprite: "ball",
      position: { x: 300, y: 72 },
      physics: { radius: 14, mass: 0.8, vx: -60, vy: 80, roll: 1 },
    },
    {
      id: "flipper",
      sprite: "flipper",
      position: FLIPPER_PIVOT,
      physics: {
        isKinematic: true,
        angle: FLIPPER_REST_ANGLE,
        colliders: flipperColliders(),
      },
    },
  ];

  let i = 0;
  while (i < PEGS.length) {
    const peg = PEGS[i];
    list.push({
      id: peg.id,
      sprite: "peg",
      position: { x: peg.x, y: peg.y },
      physics: { isStatic: true, radius: PEG_RADIUS, score: PEG_POINTS },
    });
    i = i + 1;
  }
  return list;
}

function initState() {
  return {
    label: "Flipper test",
    playerSlots: 1,
    score: 0,
    pegHits: 0,
    flipperAngle: FLIPPER_REST_ANGLE,
    cannonControl: {
      launchDown: false,
      launchSpeedMin: LAUNCH_SPEED_MIN,
      launchSpeedMax: LAUNCH_SPEED_MAX,
    },
  };
}

function consumeCollisions(props) {
  const state = props.state;
  let score = state.score;
  let pegHits = state.pegHits;
  const hostEvents = [];
  const prev = props.collisionEvents;
  if (prev) {
    let i = 0;
    while (i < prev.length) {
      const ev = prev[i];
      if (ev && ev.kind === "collision") {
        const pts = ev.amount;
        if (pts > 0) {
          score = score + pts;
          pegHits = pegHits + 1;
          hostEvents.push({ kind: "playSound", id: "bounce" });
        }
      }
      i = i + 1;
    }
  }
  return { score: score, pegHits: pegHits, hostEvents: hostEvents };
}

function readP0(props) {
  const inp = props.input;
  if (inp && inp.players && inp.players[0]) {
    return inp.players[0];
  }
  return {
    up: props.up,
    down: props.down,
    left: props.left,
    right: props.right,
    action: props.action,
  };
}

function update(props) {
  const s = props.state;
  const p0 = readP0(props);
  const down = p0.down || props.down;
  const dt = props.dt;
  const flipPressed = p0.action || p0.right || props.action;
  const flip = stepFlipperAngle(s.flipperAngle, flipPressed, dt);
  const hits = consumeCollisions(props);

  return {
    label: s.label,
    playerSlots: 1,
    score: hits.score,
    pegHits: hits.pegHits,
    flipperAngle: flip.angle,
    events: hits.hostEvents,
    worldEntities: s.worldEntities,
    cannonControl: {
      kinematics: {
        flipper: { angle: flip.angle, omega: flip.omega },
      },
      launchDown: down,
      launchSpeedMin: LAUNCH_SPEED_MIN,
      launchSpeedMax: LAUNCH_SPEED_MAX,
    },
  };
}

function hud(props) {
  const s = props.state;
  const we = s.worldEntities;
  let ax = 0;
  let ay = 0;
  if (we && we.a) {
    ax = we.a.x;
    ay = we.a.y;
  }
  let flipOn = 0;
  let launchOn = 0;
  const ctrl = s.cannonControl;
  if (ctrl) {
    if (ctrl.launchDown) {
      launchOn = 1;
    }
  }
  const restDiff = s.flipperAngle - FLIPPER_REST_ANGLE;
  if (restDiff < 0) {
    if (0 - restDiff > 2) {
      flipOn = 1;
    }
  } else {
    if (restDiff > 2) {
      flipOn = 1;
    }
  }
  return (
    <View>
      <Label color="#e8ecf4">{s.label}</Label>
      <Label color="#ffd080">
        score={s.score} peg hits={s.pegHits}
      </Label>
      <Label color="#a8b8d8">
        Space/Right=flipper S/Down=launch a={ax},{ay}
      </Label>
      <Label color="#90c890">
        flip={flipOn} launch={launchOn}
      </Label>
    </View>
  );
}

function createStaticBg() {
  bgClear(18, 22, 36);
  let x = 12;
  while (x < VIEW_W) {
    bgLine(x, 0, x, VIEW_H, 28, 32, 48);
    x += 24;
  }
  let y = 12;
  while (y < VIEW_H) {
    bgLine(0, y, VIEW_W, y, 28, 32, 48);
    y += 24;
  }
  bgRect(4, 4, VIEW_W - 8, VIEW_H - 8, 48, 72, 110);
  bgFillCircle(FLIPPER_PIVOT.x, FLIPPER_PIVOT.y, 6, 90, 90, 110);
}
