/// <reference path="../../scripting/game.d.ts" />
//
// Ylos! — vertical platformer. One script for split-screen panes (240px) and
// dual-player mode (480px). Stomp slugs, collect fruit, first to the goal wins.
//
// Split pane: WASD/arrows + Space + B  |  Dual: P1 WASD, P2 arrows + Start to join

import { soundEvent, particleEvent } from "../../scripting/game_helpers";

const BASE_W = 480;
const WORLD_H = 1890;
const VIEW_H = 270;
const MAX_ENEMIES = 8;
const MAX_FRUITS = 6;
const MAX_BULLETS = 4;

const GRAV = 0.00045;
const MOVE = 0.22;
const JUMP_V = 0.38;
const BULLET_SPEED = 0.42;

const BASE_PLATFORMS = [
  { x: 0, y: 1830, w: 480, h: 60 },   // 1 pohja
  { x: 30, y: 1700, w: 190, h: 14 },  // 2
  { x: 170, y: 1590, w: 100, h: 14 }, // 3
  { x: 310, y: 1480, w: 90, h: 14 },  // 4
  { x: 50, y: 1370, w: 110, h: 14 },  // 5
  { x: 260, y: 1260, w: 100, h: 14 }, // 6
  { x: 120, y: 1150, w: 90, h: 14 },  // 7
  { x: 300, y: 1040, w: 100, h: 14 }, // 8
  { x: 40, y: 930, w: 120, h: 14 },   // 9
  { x: 220, y: 820, w: 110, h: 14 },  // 10
  { x: 80, y: 710, w: 100, h: 14 },   // 11
  { x: 280, y: 600, w: 120, h: 14 },  // 12
  { x: 140, y: 490, w: 100, h: 14 },  // 13
  { x: 320, y: 380, w: 90, h: 14 },   // 14
  { x: 60, y: 270, w: 110, h: 14 },   // 15
  { x: 200, y: 160, w: 180, h: 20 }   // 16 maali
];

const BASE_ENEMY_DEFS = [
  { x: 55, y: 1686, dir: 1, min: 35, max: 115 },
  { x: 190, y: 1576, dir: -1, min: 175, max: 265 },
  { x: 320, y: 1466, dir: 1, min: 315, max: 395 },
  { x: 70, y: 1356, dir: 1, min: 55, max: 155 },
  { x: 275, y: 1246, dir: -1, min: 265, max: 355 },
  { x: 135, y: 1136, dir: 1, min: 125, max: 205 },
  { x: 310, y: 1026, dir: -1, min: 305, max: 395 },
  { x: 90, y: 696, dir: 1, min: 85, max: 175 }
];

const BASE_FRUIT_DEFS = [
  { x: 70, y: 1675 },
  { x: 210, y: 1565 },
  { x: 350, y: 1455 },
  { x: 100, y: 1245 },
  { x: 150, y: 1025 },
  { x: 330, y: 365 }
];

const P1_START_X = 120;
const P2_START_X = 360;
const GOAL_Y = 175;

const HERO_A = [
  "..OO..",
  ".OOOO.",
  "OOXXOO",
  ".OOOO.",
  "..OO..",
  ".O..O."
];

const HERO_B = [
  "..OO..",
  ".OOOO.",
  "OOXXOO",
  ".OOOO.",
  "..OO..",
  "O....O"
];

const SLUG_A = [
  ".OOOO.",
  "OOOOOO",
  "OOXXOO",
  "OOOOOO"
];

const SLUG_B = [
  "..OO..",
  ".OOOO.",
  "OOOOOO",
  ".OOOO."
];

function worldW() {
  return bgWidth;
}

function isDualMode() {
  return worldW() > 300;
}

function playerSlots() {
  if (isDualMode()) {
    return 2;
  }
  return 1;
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

function floorY() {
  return BASE_PLATFORMS[0].y - 12;
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
    jumpHold: 0
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
    bgFillRect(p.x, p.y, p.w, p.h, 72, 150, 64);
    bgFillRect(p.x, p.y, p.w, 4, 110, 190, 86);
    bgFillRect(p.x, p.y + p.h - 4, p.w, 4, 42, 96, 38);
    i = i + 1;
  }

  const flagX = scaleX(240);
  bgFillRect(flagX - 8, 80, 8, 90, 160, 120, 70);
  bgFillRect(flagX, 88, 36, 20, 255, 90, 90);
  bgFillRect(flagX, 96, 30, 8, 255, 210, 60);
}

function heroSprite(id, br, bg, bb) {
  return {
    id: id,
    kind: "bitmap",
    px: 3,
    br: br,
    bg: bg,
    bb: bb,
    er: 30,
    eg: 30,
    eb: 40,
    frames: [HERO_A, HERO_B]
  };
}

function enemySprite(id) {
  return {
    id: id,
    kind: "bitmap",
    px: 3,
    br: 90,
    bg: 200,
    bb: 70,
    er: 40,
    eg: 30,
    eb: 20,
    frames: [SLUG_A, SLUG_B]
  };
}

function sprites() {
  const list = [];
  list.push(heroSprite("p1", 80, 170, 255));
  list.push(heroSprite("p2", 255, 120, 90));
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
  let b = 0;
  while (b < MAX_BULLETS) {
    list.push({ id: "b" + b, kind: "rect", w: 6, h: 4, r: 255, g: 240, b: 120 });
    b = b + 1;
  }
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
      tick: 0
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
  const p1 = makePlayerOnFloor(P1_START_X, 1);
  const p2 = makePlayerOnFloor(P2_START_X, -1);
  const enemies = makeEnemies();
  const fruits = makeFruits();
  const bullets = makeBullets();
  const entities = placeEntities(
    { p1: p1, p2: p2, enemies: enemies, fruits: fruits, bullets: bullets },
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
    bullets: bullets,
    score1: 0,
    score2: 0,
    winner: 0,
    winTick: 0,
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
      if (p.b) { shoot = true; }
      if (p.x) { shoot = true; }
    }
  }
  return { up: up, down: down, left: left, right: right, action: action, shoot: shoot };
}

function clampX(x) {
  if (x < 14) { return 14; }
  if (x > worldW() - 14) { return worldW() - 14; }
  return x;
}

function landOnPlatforms(pl, pw, phh, dt, platforms) {
  let grounded = 0;
  let ny = pl.y;
  let nvy = pl.vy;
  if (pl.vy >= 0) {
    let i = 0;
    while (i < platforms.length) {
      const p = platforms[i];
      if (pl.x + pw > p.x) {
        if (pl.x - pw < p.x + p.w) {
          const feet = pl.y + phh;
          const prevFeet = feet - pl.vy * dt;
          if (feet >= p.y) {
            if (prevFeet <= p.y + 4) {
              ny = p.y - phh;
              nvy = 0;
              grounded = 1;
            }
          }
        }
      }
      i = i + 1;
    }
  }
  return { y: ny, vy: nvy, grounded: grounded };
}

function enemyCollisionKind(px, py, pvy, ex, ey) {
  const dx = px - ex;
  const dy = py - ey;
  if (dx < -18) { return "none"; }
  if (dx > 18) { return "none"; }
  if (dy < -16) { return "none"; }
  if (dy > 16) { return "none"; }
  if (pvy > 0) {
    if (py < ey + 4) {
      return "stomp";
    }
  }
  return "hurt";
}

function stompBounce(pl, ey) {
  return {
    x: pl.x,
    y: ey - 14,
    vx: pl.vx,
    vy: 0 - JUMP_V * 0.55,
    face: pl.face,
    grounded: 0,
    anim: 1,
    jumpHold: pl.jumpHold
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
      } else {
        if (kind == "hurt") {
          out = respawnPlayer(owner);
          events.push(soundEvent("lose"));
        }
      }
    }
    ei = ei + 1;
  }
  return out;
}

function hitFruit(px, py, fx, fy) {
  const dx = px - fx;
  const dy = py - fy;
  if ((dx * dx) + (dy * dy) > 18 * 18) {
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
  let vy = pl.vy + GRAV * dt;
  let x = pl.x + vx * dt;
  let y = pl.y + vy * dt;
  x = clampX(x);

  const phh = 12;
  const pw = 8;
  const fallVy = vy;
  const land = landOnPlatforms({ x: x, y: y, vy: vy }, pw, phh, dt, platforms);
  y = land.y;
  vy = land.vy;
  let grounded = land.grounded;
  let anim = grounded ? 0 : 1;

  const wantJump = inp.up || inp.action;
  if (grounded) {
    if (pl.grounded == 0) {
      if (fallVy > 0.12) {
        events.push(soundEvent("wall"));
      }
    }
    if (wantJump) {
      if (pl.jumpHold == 0) {
        vy = 0 - JUMP_V;
        grounded = 0;
        events.push(soundEvent("bounce"));
      }
    }
  }

  let jumpHold = wantJump ? 1 : 0;

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
      jumpHold: jumpHold
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
      let anim = 0;
      if (tick > 200) {
        anim = 1;
        tick = 0;
      }
      enemies[i] = {
        x: x,
        y: e.y,
        dir: dir,
        min: e.min,
        max: e.max,
        alive: 1,
        tick: tick,
        anim: anim
      };
    }
    i = i + 1;
  }
}

function bulletHitsEnemy(bx, by, ex, ey) {
  const dx = bx - ex;
  const dy = by - ey;
  if (dx < -16) { return false; }
  if (dx > 16) { return false; }
  if (dy < -14) { return false; }
  if (dy > 14) { return false; }
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
      if (x < 0) { active = 0; }
      if (x > worldW()) { active = 0; }
      let e = 0;
      while (e < MAX_ENEMIES) {
        if (enemies[e].alive == 1) {
          if (bulletHitsEnemy(x, y, enemies[e].x, enemies[e].y)) {
            enemies[e].alive = 0;
            active = 0;
            events.push(soundEvent("brick"));
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
  if (which == 1) {
    return makePlayerOnFloor(P1_START_X, 1);
  }
  return makePlayerOnFloor(P2_START_X, -1);
}

function computeCamera(p1, p2, dual) {
  let lead = p1.y;
  if (dual) {
    if (p2.y < lead) {
      lead = p2.y;
    }
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

function placeEntities(s, cam, slots) {
  const fruitDefs = buildFruitDefs();
  const entities = {};
  entities.p1 = {
    x: s.p1.x,
    y: s.p1.y - cam,
    p0: s.p1.anim,
    visible: 1
  };
  if (slots == 2) {
    entities.p2 = {
      x: s.p2.x,
      y: s.p2.y - cam,
      p0: s.p2.anim,
      visible: 1
    };
  } else {
    entities.p2 = { x: -40, y: -40, visible: 0, p0: 0 };
  }
  let e = 0;
  while (e < MAX_ENEMIES) {
    const en = s.enemies[e];
    if (en.alive == 1) {
      entities["e" + e] = {
        x: en.x,
        y: en.y - cam,
        p0: en.anim,
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
  return entities;
}

function pushEvents(dest, src) {
  let i = 0;
  while (i < src.length) {
    dest.push(src[i]);
    i = i + 1;
  }
}

function hud(props) {
  const s = props.state;
  let msg = "Ylos! Hypi etanan paalle tai ammu. Keraa hedelmia.";
  if (s.playerSlots == 2) {
    msg = msg + " Ensimmainen maaliin voittaa!";
  } else {
    msg = msg + " Paas maaliin!";
  }
  if (s.winner == 1) {
    msg = "P1 VOITTI!";
  }
  if (s.winner == 2) {
    msg = "P2 VOITTI!";
  }
  let scoreLine = "Hedelmat: " + s.score1;
  if (s.playerSlots == 2) {
    scoreLine = "Hedelmat P1:" + s.score1 + "  P2:" + s.score2;
  }
  return (
    <View flexDirection="column" padding="4px" background="#0b1020cc">
      <Label text={msg} color="#e8f0ff" fontSize="11px" />
      <Label text={scoreLine} color="#ffd080" fontSize="10px" />
    </View>
  );
}

function update(props) {
  const s = props.state;
  const dt = props.dt;
  const slots = playerSlots();
  if (s.winner != 0) {
    return {
      showNet: 0,
      playerSlots: slots,
      cameraY: s.cameraY,
      entities: s.entities,
      p1: s.p1,
      p2: s.p2,
      enemies: s.enemies,
      fruits: s.fruits,
      bullets: s.bullets,
      score1: s.score1,
      score2: s.score2,
      winner: s.winner,
      winTick: s.winTick + dt,
      fireCd1: s.fireCd1,
      fireCd2: s.fireCd2
    };
  }

  const events = [];
  const platforms = buildPlatforms();
  const fruitDefs = buildFruitDefs();
  const dual = slots == 2;
  const inp1 = readPlayer(props, 0);

  const bullets = [];
  let bi = 0;
  while (bi < MAX_BULLETS) {
    bullets.push(s.bullets[bi]);
    bi = bi + 1;
  }

  const u1 = updatePlayer(s.p1, inp1, dt, bullets, 1, s.fireCd1, platforms);
  let p1 = u1.pl;
  let p2 = s.p2;
  let fireCd2 = s.fireCd2;
  pushEvents(events, u1.events);

  if (dual) {
    const inp2 = readPlayer(props, 1);
    const u2 = updatePlayer(s.p2, inp2, dt, bullets, 2, s.fireCd2, platforms);
    p2 = u2.pl;
    fireCd2 = u2.fireCd;
    pushEvents(events, u2.events);
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

  p1 = applyEnemyHits(p1, 1, enemies, events);
  if (dual) {
    p2 = applyEnemyHits(p2, 2, enemies, events);
  }

  let fj = 0;
  while (fj < MAX_FRUITS) {
    if (fruits[fj].taken == 0) {
      const fd = fruitDefs[fj];
      if (hitFruit(p1.x, p1.y, fd.x, fd.y)) {
        fruits[fj] = { taken: 1 };
        score1 = score1 + 1;
        events.push(soundEvent("blip"));
        events.push(soundEvent("win"));
        events.push(particleEvent("fruit", fd.x, fd.y, 22));
      }
      if (dual) {
        if (hitFruit(p2.x, p2.y, fd.x, fd.y)) {
          fruits[fj] = { taken: 1 };
          score2 = score2 + 1;
          events.push(soundEvent("blip"));
          events.push(soundEvent("win"));
          events.push(particleEvent("fruit", fd.x, fd.y, 22));
        }
      }
    }
    fj = fj + 1;
  }

  let winner = 0;
  if (p1.y <= GOAL_Y) {
    winner = 1;
    events.push(soundEvent("win"));
    events.push(soundEvent("bounce"));
  } else {
    if (dual) {
      if (p2.y <= GOAL_Y) {
        winner = 2;
        events.push(soundEvent("win"));
        events.push(soundEvent("bounce"));
      }
    }
  }

  const cameraY = computeCamera(p1, p2, dual);
  const entities = placeEntities(
    { p1: p1, p2: p2, enemies: enemies, fruits: fruits, bullets: bullets },
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
    bullets: bullets,
    score1: score1,
    score2: score2,
    winner: winner,
    winTick: 0,
    fireCd1: u1.fireCd,
    fireCd2: fireCd2,
    events: events
  };
}
