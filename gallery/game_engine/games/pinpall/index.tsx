/// <reference path="../../scripting/game.d.ts" />
//
// Flipperitorni — vertical Cannon pinball (physics_sandbox template).
// Tall world + scrolling camera. ←/→ flippers | Space hold+release = launch
// Tune feel via BALL_ELASTICITY, LAUNCH_SPEED_*, gravityY in config().

const VIEW_W = 480;
const VIEW_H = 270;
const WORLD_H = 920;

const BALL_R = 8;
const BALL_START_X = 438;
const BALL_START_Y = 872;
const DRAIN_LEFT = 168;
const DRAIN_RIGHT = 312;
const DRAIN_FLOOR_Y = WORLD_H - BALL_R - 6;
// Once the ball has passed clearly below the lowest flippers it is no longer saveable.
// This also prevents a ball from resting forever on the cabinet floor.
const DRAIN_TRIGGER_Y = 888;
const GOAL_Y = 52;
const GOAL_LEFT = 190;
const GOAL_RIGHT = 290;
const TABLE_LEFT = 18;
const TABLE_RIGHT = 478;
const LAUNCH_LANE_LEFT = 410;
// Shaft divider meets the lip rail (original RAILS layout).
const LAUNCH_SHAFT_TOP = 628;
// Right-side pockets (playfield wedge, flipper rails, lane shaft).
const RIGHT_WEDGE_Y0 = 250;
const RIGHT_WEDGE_Y1 = LAUNCH_SHAFT_TOP + 8;
const RIGHT_WALL_X = TABLE_RIGHT - BALL_R - 26;
// Plunger shaft floor — ball can rest in the lane corner during play or after nest settle.
const LAUNCH_LANE_POCKET_X0 = LAUNCH_LANE_LEFT - BALL_R;
const LAUNCH_LANE_POCKET_X1 = TABLE_RIGHT;
const LAUNCH_LANE_POCKET_Y0 = LAUNCH_SHAFT_TOP - 8;
const STUCK_SPEED = 58;
const STUCK_SPEED_WALL = 110;
const STUCK_SPEED_RAIL = 130;
// Auto-rescue: wind up a strong plunger-style pull, then fire harder than manual max.
const STUCK_RESCUE_WIND_MS = 450;
const STUCK_RESCUE_PULL = 1.0;
const STUCK_RESCUE_BOOST = 1.25;
const START_LIVES = 3;

// Cannon uses pixels/second. The old 200..480 range barely reached the chute mouth.
// These values match the original hand-made version more closely.
const LAUNCH_SPEED_MIN = 560;
const LAUNCH_SPEED_MAX = 860;
// Launch starts vertically. The exit guide, not an early sideways shove, feeds the ball left.
const BALL_MASS = 0.62;
// Global collision elasticity (coefficient of restitution, 0–1).
// Real pinball feel is usually ~0.35–0.55; bumpers/rails inherit the same value in Cannon.
const BALL_ELASTICITY = 0.48;
const LAUNCH_ASSIST_MS = 360;
const PLUNGER_PULL_RATE = 0.0016;

const FLIPPER_LEN = 68;
const FLIPPER_THICK = 11;
const FLIPPER_TIP_R = 12;
// Screen Y grows downward. At rest the bats slope down toward the drain;
// when pressed they rotate upward toward the playfield, like the original version.
const FLIPPER_L_REST = 30;
const FLIPPER_L_PRESSED = -18;
const FLIPPER_R_REST = 150;
const FLIPPER_R_PRESSED = 198;
const FLIPPER_SPEED = 540;
const DEG_TO_RAD = 0.017453292519943295;

const FLIPPER_L0 = { x: 148, y: 828 };
const FLIPPER_R0 = { x: 332, y: 828 };
const FLIPPER_L1 = { x: 96, y: 538 };
const FLIPPER_R1 = { x: 384, y: 538 };

// Cabinet box + sloped rails. Single source for physicsBounds() and createStaticBg().
const CABINET_BOUNDS = [
  { id: "wallLeft", x1: TABLE_LEFT, y1: 28, x2: TABLE_LEFT, y2: WORLD_H - 18, b: 0.86 },
  { id: "wallRight", x1: TABLE_RIGHT, y1: 28, x2: TABLE_RIGHT, y2: WORLD_H - 18, b: 0.86 },
  { id: "topLeft", x1: TABLE_LEFT, y1: 28, x2: GOAL_LEFT, y2: 28, b: 0.9 },
  { id: "topRight", x1: GOAL_RIGHT, y1: 28, x2: TABLE_RIGHT, y2: 28, b: 0.9 },
  {
    id: "launchLaneInner",
    x1: LAUNCH_LANE_LEFT,
    y1: LAUNCH_SHAFT_TOP,
    x2: LAUNCH_LANE_LEFT,
    y2: WORLD_H - 18,
    b: 0.82,
    launchGraceSkip: true
  }
];

const PLAYFIELD_RAILS = [
  {
    id: "drainSlopeLeft",
    x1: TABLE_LEFT,
    y1: WORLD_H - 56,
    x2: DRAIN_LEFT,
    y2: WORLD_H - 18,
    b: 0.64
  },
  {
    id: "drainSlopeRight",
    x1: DRAIN_RIGHT,
    y1: WORLD_H - 18,
    x2: LAUNCH_LANE_LEFT,
    y2: WORLD_H - 56,
    b: 0.64
  },
  {
    id: "plungerFloor",
    x1: LAUNCH_LANE_LEFT,
    y1: WORLD_H - 18,
    x2: TABLE_RIGHT,
    y2: WORLD_H - 18,
    b: 0.55
  },
  // Lip: visual only. As a 6px sphere-chain it overlapped laneMouth + wallRight and wedged the ball.
  {
    id: "laneLip",
    x1: LAUNCH_LANE_LEFT,
    y1: LAUNCH_SHAFT_TOP,
    x2: 468,
    y2: 608,
    b: 0.9,
    phys: false
  },
  // Exit guide onto the playfield (original mouth rail — sole physics ramp here).
  {
    id: "laneMouth",
    x1: 458,
    y1: 598,
    x2: 368,
    y2: 568,
    b: 0.9,
    launchGraceSkip: true
  },
  // One upper guide per side leads toward the lower flippers.
  // The separate drain slopes below them form the outer V without overlapping these rails.
  { id: "flipRootL0", x1: TABLE_LEFT, y1: 770, x2: FLIPPER_L0.x, y2: FLIPPER_L0.y, b: 0.86 },
  {
    id: "flipRootR0",
    x1: FLIPPER_R0.x,
    y1: FLIPPER_R0.y,
    x2: FLIPPER_R0.x + 50,
    y2: FLIPPER_R0.y - 30,
    b: 0.86,
    launchGraceSkip: true
  },
  { id: "flipRootL1", x1: TABLE_LEFT, y1: 485, x2: FLIPPER_L1.x, y2: FLIPPER_L1.y, b: 0.86 },
  {
    id: "flipRootR1",
    x1: FLIPPER_R1.x + 4,
    y1: FLIPPER_R1.y - 3,
    x2: FLIPPER_R1.x + 20,
    y2: FLIPPER_R1.y - 14,
    b: 0.86
  }
];

// Bumper tiers — climb toward the summit (y increases downward).
const BUMPERS = [
  { id: "b4", x: 130, y: 390, r: 23, score: 250 },
  { id: "b5", x: 350, y: 390, r: 23, score: 250 },
  { id: "b7", x: 170, y: 640, r: 22, score: 150 },
  { id: "b8", x: 310, y: 640, r: 22, score: 150 }];

// Pegs: playfield guides + launcher lane walls.
const PEGS = [
  { id: "wl0", x: 34, y: 180, r: 5 },
  { id: "wl1", x: 34, y: 320, r: 5 },
  { id: "wl2", x: 34, y: 460, r: 5 },
  { id: "wl3", x: 34, y: 600, r: 5 },
  { id: "wl4", x: 34, y: 740, r: 5 },
  { id: "wr0", x: 390, y: 250, r: 5 },
  { id: "wr1", x: 420, y: 380, r: 5 },
  { id: "pg0", x: 110, y: 350, r: 4 },
  { id: "pg1", x: 370, y: 350, r: 4 },
  { id: "pg2", x: 200, y: 430, r: 4 },
  { id: "pg3", x: 280, y: 430, r: 4 },
  { id: "pg4", x: 130, y: 680, r: 4 },
  { id: "pg5", x: 350, y: 680, r: 4 },
  // Pocket blockers beside each flipper pivot (sphere colliders — closes gaps at roots).
  { id: "frL0", x: FLIPPER_L0.x - 14, y: FLIPPER_L0.y + 8, r: 8 },
  { id: "frR0", x: FLIPPER_R0.x + 14, y: FLIPPER_R0.y + 8, r: 8 },
  { id: "frL1", x: FLIPPER_L1.x - 12, y: FLIPPER_L1.y + 6, r: 7 },
  { id: "frR1", x: FLIPPER_R1.x + 12, y: FLIPPER_R1.y + 6, r: 7 }
];

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

function flipperColliders() {
  // Smaller than before — large tip spheres at rest trapped the ball (original used r=3 at rest).
  return [
    { radius: 4, offsetX: FLIPPER_LEN * 0.22, offsetY: 0 },
    { radius: 5, offsetX: FLIPPER_LEN * 0.44, offsetY: 0 },
    { radius: 5, offsetX: FLIPPER_LEN * 0.66, offsetY: 0 },
    { radius: 6, offsetX: FLIPPER_LEN * 0.86, offsetY: 0 },
    { radius: 6, offsetX: FLIPPER_LEN, offsetY: 0 }
  ];
}

function stepFlipperAngle(current, rest, pressed, flipPressed, dtMs) {
  const target = flipPressed ? pressed : rest;
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

function flipperEntity(id, pivot, restAngle) {
  return {
    id: id,
    sprite: "flipper",
    position: pivot,
    physics: {
      isKinematic: true,
      angle: restAngle,
      colliders: flipperColliders()
    }
  };
}

function config() {
  return {
    world: { width: VIEW_W, height: WORLD_H },
    physics: {
      enabled: true,
      cannon: true,
      gravityY: 360,
      restitution: BALL_ELASTICITY
    }
  };
}

function camera() {
  // Original: cam = ball.y - 165 (no lookahead). Gentle smoothing filters bounce jitter.
  return {
    follow: "ball",
    mode: "vertical",
    offsetY: -30,
    smoothing: 0.18,
    leadMs: 0,
    bounds: { x: 0, y: 0, w: VIEW_W, h: WORLD_H }
  };
}

function staticLevelHeight() {
  return WORLD_H;
}

function physicsBounds() {
  const bounds = [];
  let i = 0;
  while (i < CABINET_BOUNDS.length) {
    const r = CABINET_BOUNDS[i];
    if (r.phys == false) {
      i = i + 1;
      continue;
    }
    bounds.push({
      kind: "segment",
      id: r.id,
      x1: r.x1,
      y1: r.y1,
      x2: r.x2,
      y2: r.y2,
      restitution: r.b,
      launchGraceSkip: r.launchGraceSkip == true
    });
    i = i + 1;
  }
  i = 0;
  while (i < PLAYFIELD_RAILS.length) {
    const r = PLAYFIELD_RAILS[i];
    if (r.phys == false) {
      i = i + 1;
      continue;
    }
    bounds.push({
      kind: "segment",
      id: r.id,
      x1: r.x1,
      y1: r.y1,
      x2: r.x2,
      y2: r.y2,
      restitution: r.b,
      launchGraceSkip: r.launchGraceSkip == true
    });
    i = i + 1;
  }
  return bounds;
}

function sprites() {
  return [
    { id: "ball", kind: "circle", rad: BALL_R, r: 248, g: 248, b: 255 },
    { id: "bumper12", kind: "circle", rad: 12, r: 255, g: 105, b: 150 },
    { id: "bumper13", kind: "circle", rad: 13, r: 255, g: 105, b: 150 },
    { id: "bumper14", kind: "circle", rad: 14, r: 255, g: 105, b: 150 },
    { id: "bumper15", kind: "circle", rad: 15, r: 255, g: 105, b: 150 },
    { id: "bumper18", kind: "circle", rad: 18, r: 255, g: 105, b: 150 },
    { id: "peg4", kind: "circle", rad: 4, r: 180, g: 245, b: 255 },
    { id: "peg5", kind: "circle", rad: 5, r: 180, g: 245, b: 255 },
    { id: "peg6", kind: "circle", rad: 6, r: 180, g: 245, b: 255 },
    { id: "peg7", kind: "circle", rad: 7, r: 180, g: 245, b: 255 },
    { id: "peg8", kind: "circle", rad: 8, r: 180, g: 245, b: 255 },
    {
      id: "flipper",
      kind: "rect",
      w: FLIPPER_LEN,
      h: FLIPPER_THICK,
      r: 255,
      g: 190,
      b: 70
    },
    { id: "goal", kind: "circle", rad: 14, r: 255, g: 220, b: 80 }
  ];
}

function entities() {
  const list = [
    {
      id: "ball",
      sprite: "ball",
      position: { x: BALL_START_X, y: BALL_START_Y },
      physics: { radius: BALL_R, mass: BALL_MASS, roll: 1 }
    },
    flipperEntity("flipperL0", FLIPPER_L0, FLIPPER_L_REST),
    flipperEntity("flipperR0", FLIPPER_R0, FLIPPER_R_REST),
    flipperEntity("flipperL1", FLIPPER_L1, FLIPPER_L_REST),
    flipperEntity("flipperR1", FLIPPER_R1, FLIPPER_R_REST),
    {
      id: "goal",
      sprite: "goal",
      position: { x: 240, y: GOAL_Y },
      physics: { isStatic: true, radius: 14, score: 5000 }
    }
  ];

  let i = 0;
  while (i < BUMPERS.length) {
    const b = BUMPERS[i];
    list.push({
      id: b.id,
      sprite: "bumper" + b.r,
      position: { x: b.x, y: b.y },
      physics: { isStatic: true, radius: b.r, score: b.score }
    });
    i = i + 1;
  }

  i = 0;
  while (i < PEGS.length) {
    const p = PEGS[i];
    list.push({
      id: p.id,
      sprite: "peg" + p.r,
      position: { x: p.x, y: p.y },
      physics: { isStatic: true, radius: p.r, score: 0 }
    });
    i = i + 1;
  }

  return list;
}

function initState() {
  return {
    label: "Flipperitorni",
    playerSlots: 1,
    score: 0,
    lives: START_LIVES,
    hits: 0,
    bestHeight: 0,
    waiting: 1,
    won: 0,
    gameOver: 0,
    plungerPull: 0,
    launchHeld: 0,
    launchAssistMs: 0,
    flipperL0Angle: FLIPPER_L_REST,
    flipperR0Angle: FLIPPER_R_REST,
    flipperL1Angle: FLIPPER_L_REST,
    flipperR1Angle: FLIPPER_R_REST,
    flashMs: 0,
    rightStuckMs: 0,
    stuckRescuePull: 0
  };
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
    action: props.action
  };
}

function consumeCollisions(props, currentFlashMs) {
  const state = props.state;
  let score = state.score;
  let hits = state.hits;
  let flashMs = currentFlashMs;
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
          hits = hits + 1;
          flashMs = 120;
          hostEvents.push({ kind: "playSound", id: "bounce" });
        }
      }
      i = i + 1;
    }
  }
  return { score: score, hits: hits, flashMs: flashMs, hostEvents: hostEvents };
}

function launchSpeedForPull(pull) {
  const span = LAUNCH_SPEED_MAX - LAUNCH_SPEED_MIN;
  return LAUNCH_SPEED_MIN + span * pull;
}

function rescueLaunchSpeed() {
  return launchSpeedForPull(STUCK_RESCUE_PULL) * STUCK_RESCUE_BOOST;
}

function inLaunchLanePocket(bx, by) {
  return (
    bx > LAUNCH_LANE_POCKET_X0 &&
    bx <= LAUNCH_LANE_POCKET_X1 &&
    by > LAUNCH_LANE_POCKET_Y0 &&
    by <= WORLD_H - 8
  );
}

function inRightWedgePocket(bx, by) {
  if (by < RIGHT_WEDGE_Y0 || by > RIGHT_WEDGE_Y1) {
    return false;
  }
  if (bx > RIGHT_WALL_X) {
    return true;
  }
  if (bx > LAUNCH_LANE_LEFT - 22 && by > FLIPPER_R1.y - 35 && by < LAUNCH_SHAFT_TOP + 4) {
    return true;
  }
  if (bx > FLIPPER_R1.x - 26 && by > FLIPPER_R1.y - 35 && by < FLIPPER_R1.y + 105) {
    return true;
  }
  if (bx > FLIPPER_R0.x - 18 && by > FLIPPER_R0.y - 60 && by < FLIPPER_R0.y + 35) {
    return true;
  }
  return false;
}

function stuckSpeedOk(bx, by, ballSpeed) {
  if (ballSpeed < STUCK_SPEED) {
    return true;
  }
  if (bx > RIGHT_WALL_X && ballSpeed < STUCK_SPEED_WALL) {
    return true;
  }
  if (bx > LAUNCH_LANE_LEFT - 28 && ballSpeed < STUCK_SPEED_RAIL) {
    return true;
  }
  return false;
}

function stuckZone(bx, by, ballSpeed, launchAssistMs) {
  if (launchAssistMs > 0 || !stuckSpeedOk(bx, by, ballSpeed)) {
    return null;
  }
  if (inLaunchLanePocket(bx, by)) {
    return "lane";
  }
  if (inRightWedgePocket(bx, by)) {
    return "wedge";
  }
  return null;
}

function stuckRescueLaunch(bx, by, zone) {
  const power = rescueLaunchSpeed();
  if (zone == "lane") {
    return {
      x: bx - 16,
      y: by - 12,
      vx: -100,
      vy: 0 - power
    };
  }
  let vxScale = 0.58;
  let vyScale = 0.66;
  if (by < LAUNCH_SHAFT_TOP - 50) {
    vxScale = 0.78;
    vyScale = 0.5;
  }
  return {
    x: bx - 20,
    vx: 0 - power * vxScale,
    vy: 0 - power * vyScale
  };
}


function computeProgress(by) {
  const climbed = BALL_START_Y - by;
  return clamp(climbed / (BALL_START_Y - GOAL_Y), 0, 1);
}

function update(props) {
  const s = props.state;
  const p0 = readP0(props);
  const dt = props.dt;
  const events = [];

  const launchDown = p0.down || p0.up || p0.action || props.down || props.up || props.action;
  const launchPressed = launchDown && s.launchHeld == 0;
  const launchReleased = !launchDown && s.launchHeld == 1;

  if ((s.gameOver == 1 || s.won == 1) && launchPressed) {
    return initState();
  }

  let score = s.score;
  let lives = s.lives;
  let hits = s.hits;
  let bestHeight = s.bestHeight;
  let waiting = s.waiting;
  let won = s.won;
  let gameOver = s.gameOver;
  let plungerPull = s.plungerPull;
  let launchAssistMs = s.launchAssistMs || 0;
  let rightStuckMs = s.rightStuckMs || 0;
  let stuckRescuePull = s.stuckRescuePull || 0;
  let flashMs = decayTimer(s.flashMs, dt);

  const leftFlip = p0.left || props.left;
  const rightFlip = p0.right || props.right;

  const fL0 = stepFlipperAngle(s.flipperL0Angle, FLIPPER_L_REST, FLIPPER_L_PRESSED, leftFlip, dt);
  const fR0 = stepFlipperAngle(s.flipperR0Angle, FLIPPER_R_REST, FLIPPER_R_PRESSED, rightFlip, dt);
  const fL1 = stepFlipperAngle(s.flipperL1Angle, FLIPPER_L_REST, FLIPPER_L_PRESSED, leftFlip, dt);
  const fR1 = stepFlipperAngle(s.flipperR1Angle, FLIPPER_R_REST, FLIPPER_R_PRESSED, rightFlip, dt);

  const hitsPack = consumeCollisions(props, flashMs);
  score = hitsPack.score;
  hits = hitsPack.hits;
  flashMs = hitsPack.flashMs;
  let ei = 0;
  while (ei < hitsPack.hostEvents.length) {
    events.push(hitsPack.hostEvents[ei]);
    ei = ei + 1;
  }

  let launchVy = 0;
  const we = s.worldEntities;

  if (waiting == 1 && gameOver == 0 && won == 0) {
    if (launchDown) {
      plungerPull = plungerPull + dt * PLUNGER_PULL_RATE;
      if (plungerPull > 1) {
        plungerPull = 1;
      }
    }
    if (launchReleased && plungerPull > 0.06) {
      launchVy = 0 - launchSpeedForPull(plungerPull);
      launchAssistMs = LAUNCH_ASSIST_MS;
      waiting = 0;
      plungerPull = 0;
      events.push({ kind: "playSound", id: "blip" });
      events.push({ kind: "rumble", pad: 0, low: 14000, high: 18000, ms: 90 });
    }
    if (launchReleased && plungerPull <= 0.06) {
      plungerPull = 0;
    }
  }

  if (launchAssistMs > 0) {
    launchAssistMs = decayTimer(launchAssistMs, dt);
  }

  let cannonControl: any = {
    kinematics: {
      flipperL0: { angle: fL0.angle, omega: fL0.omega },
      flipperR0: { angle: fR0.angle, omega: fR0.omega },
      flipperL1: { angle: fL1.angle, omega: fL1.omega },
      flipperR1: { angle: fR1.angle, omega: fR1.omega }
    },
    launchDown: false,
    launchPulse: false,
    launchGraceMs: launchAssistMs,
    respawn: {}
  };

  let nestRespawn = waiting == 1 && gameOver == 0 && won == 0 && launchVy == 0;

  if (launchVy < 0) {
    cannonControl.respawn = {
      ball: { x: BALL_START_X, y: BALL_START_Y, vx: 0, vy: launchVy }
    };
    nestRespawn = false;
    rightStuckMs = 0;
    stuckRescuePull = 0;
  }

  if (we && we.ball) {
    const climbed = BALL_START_Y - we.ball.y;
    if (climbed > bestHeight) {
      bestHeight = climbed;
    }
  }

  if (won == 0 && gameOver == 0 && we && we.ball) {
    const bx = we.ball.x;
    const by = we.ball.y;
    const bvx = we.ball.vx || 0;
    const bvy = we.ball.vy || 0;
    const ballSpeed = Math.sqrt(bvx * bvx + bvy * bvy);

    const zone = stuckZone(bx, by, ballSpeed, launchAssistMs);
    if (zone) {
      rightStuckMs = rightStuckMs + dt;
      stuckRescuePull = clamp(rightStuckMs / STUCK_RESCUE_WIND_MS, 0, 1);
      if (rightStuckMs >= STUCK_RESCUE_WIND_MS) {
        rightStuckMs = 0;
        stuckRescuePull = 0;
        cannonControl.respawn = { ball: stuckRescueLaunch(bx, by, zone) };
        nestRespawn = false;
        waiting = 0;
        launchAssistMs = LAUNCH_ASSIST_MS;
        events.push({ kind: "playSound", id: "blip" });
        events.push({ kind: "rumble", pad: 0, low: 18000, high: 24000, ms: 120 });
      }
    } else {
      rightStuckMs = 0;
      stuckRescuePull = 0;
    }

    if (waiting == 0) {
      const insideGoal = bx > GOAL_LEFT + BALL_R && bx < GOAL_RIGHT - BALL_R;
      const centerDrain = by >= DRAIN_FLOOR_Y - 4 && bx > DRAIN_LEFT && bx < DRAIN_RIGHT;
    const belowLowestFlippers =
      by >= DRAIN_TRIGGER_Y && bx < LAUNCH_LANE_LEFT - BALL_R;
    const escapedTable = by > WORLD_H + BALL_R * 2 || bx < -BALL_R * 2 || bx > VIEW_W + BALL_R * 2;

    if (by <= GOAL_Y + BALL_R + 4 && insideGoal) {
      won = 1;
      waiting = 1;
      events.push({ kind: "playSound", id: "win" });
      events.push({ kind: "particles", id: "celebrate", x: bx, y: by, amount: 40 });
      events.push({ kind: "rumble", pad: 0, low: 32000, high: 32000, ms: 220 });
    } else if (centerDrain || belowLowestFlippers || escapedTable) {
      lives = lives - 1;
      waiting = 1;
      plungerPull = 0;
      launchAssistMs = 0;
//       events.push({ kind: "playSound", id: "lose" });
      events.push({ kind: "rumble", pad: 0, low: 22000, high: 22000, ms: 140 });
      if (lives <= 0) {
        lives = 0;
        gameOver = 1;
      }
    }
    }
  }

  if (nestRespawn && we && we.ball) {
    const nestInRightPocket =
      inLaunchLanePocket(we.ball.x, we.ball.y) || inRightWedgePocket(we.ball.x, we.ball.y);
    if (!(nestInRightPocket && stuckRescuePull > 0.05)) {
      cannonControl.respawn = {
        ball: { x: BALL_START_X, y: BALL_START_Y, vx: 0, vy: 0 }
      };
    }
  }

  return {
    label: s.label,
    playerSlots: 1,
    score: score,
    lives: lives,
    hits: hits,
    bestHeight: bestHeight,
    waiting: waiting,
    won: won,
    gameOver: gameOver,
    plungerPull: plungerPull,
    launchHeld: launchDown ? 1 : 0,
    launchAssistMs: launchAssistMs,
    flipperL0Angle: fL0.angle,
    flipperR0Angle: fR0.angle,
    flipperL1Angle: fL1.angle,
    flipperR1Angle: fR1.angle,
    flashMs: flashMs,
    rightStuckMs: rightStuckMs,
    stuckRescuePull: stuckRescuePull,
    events: events,
    cannonControl: cannonControl
  };
}

function hud(props) {
  const s = props.state;
  let status = "Pidä Space/↓ → päästä: laukaise";
  if (s.stuckRescuePull > 0.05) {
    const pct = (s.stuckRescuePull * 100) | 0;
    status = "Voimakas veto " + pct + "% — irrotetaan!";
  } else if (s.waiting == 1 && s.plungerPull > 0.05) {
    const pct = (s.plungerPull * 100) | 0;
    status = "Veto " + pct + "% — päästä!";
  }
  if (s.waiting == 0) {
    status = "Nouse huipun portille!";
  }
  if (s.gameOver == 1) {
    status = "Pallot loppu — Space: uusi peli";
  }
  if (s.won == 1) {
    status = "Huippu saavutettu! Space: uusi peli";
  }
  let flash = "";
  if (s.flashMs > 0) {
    flash = "  HIT!";
  }
  let progress = 0;
  const we = s.worldEntities;
  if (we && we.ball) {
    progress = computeProgress(we.ball.y);
  }
  const pct = (progress * 100) | 0;
  const heightM = (s.bestHeight / 10) | 0;
  return (
    <View flexDirection="column" padding="4px">
      <Label color="#ffe878">Flipperitorni</Label>
      <Label color="#d9f5ff">
        score={s.score} lives={s.lives} {pct}%↑ best={heightM}m{flash}
      </Label>
      <Label color="#ffb8d8">{status}</Label>
      <Label color="#8edfff">←/→ mailat (2 paria) | Space/↑/↓ plunger</Label>
    </View>
  );
}

function drawBgRail(x1, y1, x2, y2, radius, r, g, b) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  let steps = (dist / 4) | 0;
  if (steps < 1) {
    steps = 1;
  }
  let i = 0;
  while (i <= steps) {
    const t = i / steps;
    bgFillCircle(x1 + dx * t, y1 + dy * t, radius, r, g, b);
    i = i + 1;
  }
}

function createStaticBg() {
  let y = 0;
  while (y < WORLD_H) {
    const t = y / WORLD_H;
    const r = 8 + t * 18;
    const g = 14 + t * 22;
    const b = 32 + t * 40;
    bgFillRect(0, y, VIEW_W, 6, r, g, b);
    y = y + 6;
  }

  bgFillRect(4, 0, 10, WORLD_H, 28, 98, 140);
  bgFillRect(VIEW_W - 14, 0, 10, WORLD_H, 28, 98, 140);
  bgFillRect(14, 0, 3, WORLD_H, 90, 220, 255);
  bgFillRect(VIEW_W - 17, 0, 3, WORLD_H, 90, 220, 255);

  bgFillRect(GOAL_LEFT, GOAL_Y - 18, GOAL_RIGHT - GOAL_LEFT, 10, 255, 200, 65);
  bgFillRect(184, GOAL_Y - 8, 8, 34, 255, 120, 70);
  bgFillRect(288, GOAL_Y - 8, 8, 34, 255, 120, 70);
  bgFillCircle(240, GOAL_Y, 12, 255, 235, 120);

  // Launcher shaft: clear lane between the inner divider and cabinet wall.
  bgFillRect(LAUNCH_LANE_LEFT, LAUNCH_SHAFT_TOP, 4, WORLD_H - 18 - LAUNCH_SHAFT_TOP, 70, 180, 210);
  bgFillRect(TABLE_RIGHT - 2, 520, 4, 380, 70, 180, 210);
  let laneGuide = 0;
  while (laneGuide < 8) {
    bgFillCircle(TABLE_RIGHT - laneGuide * 4, 520 - laneGuide * 5, 3, 60, 190, 225);
    laneGuide = laneGuide + 1;
  }

  // Sloped playfield rails (same data as physicsBounds segments).
  let ri = 0;
  while (ri < PLAYFIELD_RAILS.length) {
    const rail = PLAYFIELD_RAILS[ri];
    drawBgRail(rail.x1, rail.y1, rail.x2, rail.y2, 4, 22, 82, 122);
    drawBgRail(rail.x1, rail.y1, rail.x2, rail.y2, 1, 100, 225, 255);
    ri = ri + 1;
  }

  bgFillRect(DRAIN_LEFT, WORLD_H - 20, DRAIN_RIGHT - DRAIN_LEFT, 20, 5, 7, 15);
  bgFillRect(DRAIN_LEFT, WORLD_H - 22, DRAIN_RIGHT - DRAIN_LEFT, 2, 255, 90, 100);

  bgFillCircle(FLIPPER_L0.x, FLIPPER_L0.y, 5, 90, 90, 110);
  bgFillCircle(FLIPPER_R0.x, FLIPPER_R0.y, 5, 90, 90, 110);
  bgFillCircle(FLIPPER_L1.x, FLIPPER_L1.y, 5, 90, 90, 110);
  bgFillCircle(FLIPPER_R1.x, FLIPPER_R1.y, 5, 90, 90, 110);

  let i = 0;
  while (i < BUMPERS.length) {
    const b = BUMPERS[i];
    bgFillCircle(b.x, b.y, b.r + 4, 18, 50, 90);
    bgFillCircle(b.x, b.y, b.r, 45, 120, 175);
    i = i + 1;
  }

  i = 0;
  while (i < PEGS.length) {
    const p = PEGS[i];
    bgFillCircle(p.x, p.y, p.r + 1, 28, 80, 120);
    bgFillCircle(p.x, p.y, p.r, 170, 240, 255);
    i = i + 1;
  }

  let markerY = 160;
  let marker = 1;
  while (markerY < WORLD_H - 80) {
    bgFillRect(22, markerY, 16, 2, 70, 110, 160);
    bgFillRect(VIEW_W - 38, markerY, 16, 2, 70, 110, 160);
    if (marker % 2 == 0) {
      bgFillCircle(30, markerY - 6, 2, 255, 210, 100);
      bgFillCircle(VIEW_W - 30, markerY - 6, 2, 255, 210, 100);
    }
    marker = marker + 1;
    markerY = markerY + 100;
  }
}