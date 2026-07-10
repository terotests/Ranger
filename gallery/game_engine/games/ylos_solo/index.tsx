/// <reference path="../../scripting/game.d.ts" />
//
// Ylos! Solo — single-player vertical platformer for split-screen panes.
// Each child gets their own pane (240×270) and progresses independently.
//
// P1: WASD + Space (jump) + B (shoot)  |  arrows on right pane

import { soundEvent } from "../../scripting/game_helpers";

const WORLD_W = 240;
const WORLD_H = 1890;
const VIEW_H = 270;
const MAX_ENEMIES = 6;
const MAX_FRUITS = 5;
const MAX_BULLETS = 4;

const GRAV = 0.00045;
const MOVE = 0.22;
const JUMP_V = 0.38;
const BULLET_SPEED = 0.42;

const PLATFORMS = [
  { x: 0, y: 1830, w: 240, h: 60 },
  { x: 15, y: 1700, w: 45, h: 14 },
  { x: 85, y: 1590, w: 50, h: 14 },
  { x: 155, y: 1480, w: 45, h: 14 },
  { x: 25, y: 1370, w: 55, h: 14 },
  { x: 130, y: 1260, w: 50, h: 14 },
  { x: 60, y: 1150, w: 45, h: 14 },
  { x: 150, y: 1040, w: 50, h: 14 },
  { x: 20, y: 930, w: 60, h: 14 },
  { x: 110, y: 820, w: 55, h: 14 },
  { x: 40, y: 710, w: 50, h: 14 },
  { x: 140, y: 600, w: 60, h: 14 },
  { x: 70, y: 490, w: 50, h: 14 },
  { x: 160, y: 380, w: 45, h: 14 },
  { x: 30, y: 270, w: 55, h: 14 },
  { x: 100, y: 160, w: 90, h: 20 }
];

const ENEMY_DEFS = [
  { x: 28, y: 1686, dir: 1, min: 18, max: 58 },
  { x: 95, y: 1576, dir: -1, min: 88, max: 132 },
  { x: 160, y: 1466, dir: 1, min: 158, max: 198 },
  { x: 35, y: 1356, dir: 1, min: 28, max: 78 },
  { x: 138, y: 1246, dir: -1, min: 133, max: 178 },
  { x: 68, y: 696, dir: 1, min: 43, max: 88 }
];

const FRUIT_DEFS = [
  { x: 35, y: 1675 },
  { x: 105, y: 1565 },
  { x: 175, y: 1455 },
  { x: 50, y: 1245 },
  { x: 165, y: 365 }
];

const HERO_START = { x: 120, y: 1800 };
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
  drawSkyGradient();
  drawCloud(40, 220);
  drawCloud(180, 420);
  drawCloud(60, 720);
  drawCloud(200, 980);
  drawCloud(30, 1280);

  let i = 0;
  while (i < PLATFORMS.length) {
    const p = PLATFORMS[i];
    bgFillRect(p.x, p.y, p.w, p.h, 72, 150, 64);
    bgFillRect(p.x, p.y, p.w, 4, 110, 190, 86);
    bgFillRect(p.x, p.y + p.h - 4, p.w, 4, 42, 96, 38);
    i = i + 1;
  }

  bgFillRect(112, 80, 8, 90, 160, 120, 70);
  bgFillRect(120, 88, 36, 20, 255, 90, 90);
  bgFillRect(120, 96, 30, 8, 255, 210, 60);
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
  list.push(heroSprite("hero", 80, 170, 255));
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
  const out = [];
  let i = 0;
  while (i < MAX_ENEMIES) {
    const d = ENEMY_DEFS[i];
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
    out.push({ active: 0, x: 0, y: 0, vx: 0 });
    i = i + 1;
  }
  return out;
}

function initState() {
  return {
    showNet: 0,
    playerSlots: 1,
    cameraY: WORLD_H - VIEW_H,
    entities: {},
    hero: {
      x: HERO_START.x,
      y: HERO_START.y,
      vx: 0,
      vy: 0,
      face: 1,
      grounded: 0,
      anim: 0,
      jumpHold: 0
    },
    enemies: makeEnemies(),
    fruits: makeFruits(),
    bullets: makeBullets(),
    score: 0,
    won: 0,
    winTick: 0,
    fireCd: 0
  };
}

function readPlayer(props) {
  let up = props.up;
  let left = props.left;
  let right = props.right;
  let action = props.action;
  let shoot = false;
  const input = props.input;
  if (input) {
    if (input.players[0]) {
      const p = input.players[0];
      up = p.up;
      left = p.left;
      right = p.right;
      action = p.action;
      if (p.b) { shoot = true; }
      if (p.x) { shoot = true; }
    }
  }
  return { up: up, left: left, right: right, action: action, shoot: shoot };
}

function clampX(x) {
  if (x < 14) { return 14; }
  if (x > WORLD_W - 14) { return WORLD_W - 14; }
  return x;
}

function landOnPlatforms(pl, pw, phh, dt) {
  let grounded = 0;
  let ny = pl.y;
  let nvy = pl.vy;
  if (pl.vy >= 0) {
    let i = 0;
    while (i < PLATFORMS.length) {
      const p = PLATFORMS[i];
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

function hitEnemy(px, py, ex, ey) {
  const dx = px - ex;
  const dy = py - ey;
  if (dx < -18) { return false; }
  if (dx > 18) { return false; }
  if (dy < -16) { return false; }
  if (dy > 16) { return false; }
  return true;
}

function hitFruit(px, py, fx, fy) {
  const dx = px - fx;
  const dy = py - fy;
  if ((dx * dx) + (dy * dy) > 18 * 18) {
    return false;
  }
  return true;
}

function spawnBullet(bullets, x, y, face) {
  let i = 0;
  while (i < MAX_BULLETS) {
    if (bullets[i].active == 0) {
      bullets[i] = { active: 1, x: x, y: y, vx: face * BULLET_SPEED };
      return true;
    }
    i = i + 1;
  }
  return false;
}

function updateHero(pl, inp, dt, bullets, fireCd) {
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
  const land = landOnPlatforms({ x: x, y: y, vy: vy }, pw, phh, dt);
  y = land.y;
  vy = land.vy;
  let grounded = land.grounded;
  let anim = grounded ? 0 : 1;

  const wantJump = inp.up || inp.action;
  if (grounded) {
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
      if (spawnBullet(bullets, x + face * 10, y - 4, face)) {
        cd = 220;
        events.push(soundEvent("blip"));
      }
    }
  }

  return {
    pl: { x: x, y: y, vx: vx, vy: vy, face: face, grounded: grounded, anim: anim, jumpHold: jumpHold },
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
      let anim = tick > 200 ? 1 : 0;
      if (tick > 200) {
        tick = 0;
      }
      enemies[i] = { x: x, y: e.y, dir: dir, min: e.min, max: e.max, alive: 1, tick: tick, anim: anim };
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
      if (x > WORLD_W) { active = 0; }
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
      bullets[i] = { active: active, x: x, y: y, vx: b.vx };
    }
    i = i + 1;
  }
  return events;
}

function respawnHero() {
  return {
    x: HERO_START.x,
    y: HERO_START.y,
    vx: 0,
    vy: 0,
    face: 1,
    grounded: 0,
    anim: 0,
    jumpHold: 0
  };
}

function computeCamera(heroY) {
  let cam = heroY - 120;
  if (cam < 0) { cam = 0; }
  const maxCam = WORLD_H - VIEW_H;
  if (cam > maxCam) { cam = maxCam; }
  return cam;
}

function placeEntities(s, cam) {
  const entities = {};
  entities.hero = {
    x: s.hero.x,
    y: s.hero.y - cam,
    p0: s.hero.anim,
    visible: 1
  };
  let e = 0;
  while (e < MAX_ENEMIES) {
    const en = s.enemies[e];
    if (en.alive == 1) {
      entities["e" + e] = { x: en.x, y: en.y - cam, p0: en.anim, visible: 1 };
    } else {
      entities["e" + e] = { x: -40, y: -40, visible: 0, p0: 0 };
    }
    e = e + 1;
  }
  let f = 0;
  while (f < MAX_FRUITS) {
    if (s.fruits[f].taken == 0) {
      const fd = FRUIT_DEFS[f];
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

function hud(props) {
  const s = props.state;
  let msg = "Ylos! Keraa hedelmia, ammu etanaa. Paas maaliin!";
  if (s.won == 1) {
    msg = "VOITIT!";
  }
  return (
    <View flexDirection="column" padding="4px" background="#0b1020cc">
      <Label text={msg} color="#e8f0ff" fontSize="10px" />
      <Label text={"Hedelmat: " + s.score} color="#ffd080" fontSize="9px" />
    </View>
  );
}

function update(props) {
  const s = props.state;
  const dt = props.dt;
  if (s.won != 0) {
    return {
      showNet: 0,
      playerSlots: 1,
      cameraY: s.cameraY,
      entities: s.entities,
      hero: s.hero,
      enemies: s.enemies,
      fruits: s.fruits,
      bullets: s.bullets,
      score: s.score,
      won: s.won,
      winTick: s.winTick + dt,
      fireCd: s.fireCd
    };
  }

  const events = [];
  const inp = readPlayer(props);

  const bullets = [];
  let bi = 0;
  while (bi < MAX_BULLETS) {
    bullets.push(s.bullets[bi]);
    bi = bi + 1;
  }

  const u = updateHero(s.hero, inp, dt, bullets, s.fireCd);
  let hero = u.pl;
  let i = 0;
  while (i < u.events.length) {
    events.push(u.events[i]);
    i = i + 1;
  }

  const enemies = [];
  let ei = 0;
  while (ei < MAX_ENEMIES) {
    enemies.push(s.enemies[ei]);
    ei = ei + 1;
  }
  updateEnemies(enemies, dt);
  const bulletEvents = updateBullets(bullets, enemies, dt);
  i = 0;
  while (i < bulletEvents.length) {
    events.push(bulletEvents[i]);
    i = i + 1;
  }

  let score = s.score;
  const fruits = [];
  let fi = 0;
  while (fi < MAX_FRUITS) {
    fruits.push(s.fruits[fi]);
    fi = fi + 1;
  }

  let ei2 = 0;
  while (ei2 < MAX_ENEMIES) {
    if (enemies[ei2].alive == 1) {
      if (hitEnemy(hero.x, hero.y, enemies[ei2].x, enemies[ei2].y)) {
        hero = respawnHero();
        events.push(soundEvent("lose"));
      }
    }
    ei2 = ei2 + 1;
  }

  let fj = 0;
  while (fj < MAX_FRUITS) {
    if (fruits[fj].taken == 0) {
      const fd = FRUIT_DEFS[fj];
      if (hitFruit(hero.x, hero.y, fd.x, fd.y)) {
        fruits[fj] = { taken: 1 };
        score = score + 1;
        events.push(soundEvent("win"));
      }
    }
    fj = fj + 1;
  }

  let won = 0;
  if (hero.y <= GOAL_Y) {
    won = 1;
    events.push(soundEvent("win"));
  }

  const cameraY = computeCamera(hero.y);
  const entities = placeEntities(
    { hero: hero, enemies: enemies, fruits: fruits, bullets: bullets },
    cameraY
  );

  return {
    showNet: 0,
    playerSlots: 1,
    cameraY: cameraY,
    entities: entities,
    hero: hero,
    enemies: enemies,
    fruits: fruits,
    bullets: bullets,
    score: score,
    won: won,
    winTick: 0,
    fireCd: u.fireCd,
    events: events
  };
}
