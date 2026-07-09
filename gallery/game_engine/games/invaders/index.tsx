/// <reference path="../../scripting/game.d.ts" />
//
// Mini Space Invaders for the retained-mode GameRunner.
//
// Aliens and ship use kind "bitmap" — one retained sprite per actor with cached
// animation frames in the engine (not one rect per pixel).
//
// Controls: Left/Right or A/D (keyboard or gamepad). Auto-fire. score1 = points, score2 = lives.
//
// Run:
//   npm run engine:game-sdl:launcher → Invaders

import { soundEvent } from "../../scripting/game_helpers";

function resources() {
  return [
    // Path relative to this .tsx directory: assets/invaders_bg.png
    { kind: "image", id: "bg", path: "assets/invaders_bg.png" }
  ];
}

function backgroundImage() {
  return "bg";
}

const COLS = 5;
const ROWS = 3;
const ALIEN_COUNT = COLS * ROWS;

const INVADER_A = [
  "..XXX..",
  ".XXXXX.",
  "XXOXXX.",
  "XXXXXXX",
  ".X.X.X.",
  "..XXX.."
];

const INVADER_B = [
  ".XXXXX.",
  "X.XXX.X",
  "XXXXXXX",
  "XX.X.XX",
  "X.X.X.X",
  ".X...X."
];

const INVADER_C = [
  "..XXX..",
  ".XXXXX.",
  "XXOXXX.",
  "XXXXXXX",
  "X.XXX.X",
  "X.X.X.X"
];

const SHIP_ART = [
  "..XX..",
  "..XX..",
  ".XXXX.",
  "XXXXXX",
  "XX..XX"
];

function alienType(row, col) {
  if (row == 0) { return 0; }
  if (row == 1) { return 1; }
  return 2;
}

function paletteFor(kind) {
  if (kind == 0) {
    return { br: 60, bg: 220, bb: 140, er: 255, eg: 80, eb: 120 };
  }
  if (kind == 1) {
    return { br: 255, bg: 170, bb: 40, er: 255, eg: 60, eb: 40 };
  }
  return { br: 180, bg: 90, bb: 255, er: 255, eg: 240, eb: 80 };
}

function alienBitmap(kind, frame) {
  const odd = frame % 2;
  if (kind == 0) {
    if (odd == 0) { return INVADER_A; }
    return INVADER_B;
  }
  if (kind == 1) {
    if (odd == 0) { return INVADER_B; }
    return INVADER_A;
  }
  if (odd == 0) { return INVADER_C; }
  return INVADER_B;
}

function alienId(alien) {
  return ("a" + alien);
}

function alienSpriteDef(alien) {
  const col = alien % COLS;
  const row = (alien - col) / COLS;
  const kind = alienType(row, col);
  const pal = paletteFor(kind);
  return {
    id: alienId(alien),
    kind: "bitmap",
    px: 3,
    br: pal.br,
    bg: pal.bg,
    bb: pal.bb,
    er: pal.er,
    eg: pal.eg,
    eb: pal.eb,
    frames: [
      alienBitmap(kind, 0),
      alienBitmap(kind, 1)
    ]
  };
}

function buildAlienSprites() {
  const list = [];
  let alien = 0;
  while (alien < ALIEN_COUNT) {
    list.push(alienSpriteDef(alien));
    alien = alien + 1;
  }
  return list;
}

function sprites() {
  const list = buildAlienSprites();
  list.push({
    id: "ship",
    kind: "bitmap",
    px: 4,
    br: 40,
    bg: 120,
    bb: 220,
    er: 200,
    eg: 255,
    eb: 255,
    frames: [SHIP_ART]
  });
  list.push({ id: "shot", kind: "rect", w: 3, h: 10, r: 255, g: 255, b: 120 });
  return list;
}

function makeAlive() {
  const alive = [];
  let i = 0;
  while (i < ALIEN_COUNT) {
    alive.push(1);
    i = i + 1;
  }
  return alive;
}

function initEntities(waveX, waveY, px, py, shotY) {
  const entities = {};
  entities.shot = { x: px, y: shotY };
  entities.ship = { x: px, y: py, p0: 0 };

  let alien = 0;
  while (alien < ALIEN_COUNT) {
    const col = alien % COLS;
    const row = (alien - col) / COLS;
    entities[alienId(alien)] = {
      x: waveX + col * 40,
      y: waveY + row * 30,
      p0: 0
    };
    alien = alien + 1;
  }
  return entities;
}

function initState() {
  const px = 240;
  const py = 248;
  return {
    layout: "invaders",
    showNet: 0,
    entities: initEntities(70, 48, px, py, -30),
    px: px,
    py: py,
    waveX: 70,
    waveY: 48,
    waveDir: 1,
    waveTick: 0,
    anim: 0,
    shotX: px,
    shotY: -30,
    shotActive: 0,
    fireCd: 0,
    alive: makeAlive(),
    score1: 0,
    score2: 3,
    gameOver: 0
  };
}

function countAlive(alive) {
  let n = 0;
  let i = 0;
  while (i < alive.length) {
    if (alive[i] == 1) { n = n + 1; }
    i = i + 1;
  }
  return n;
}

function resetWave(alive) {
  let alien = 0;
  while (alien < ALIEN_COUNT) {
    alive[alien] = 1;
    alien = alien + 1;
  }
  return { waveX: 70, waveY: 48, waveDir: 1, waveTick: 0 };
}

function placeAlien(entities, alien, waveX, waveY, alive, anim) {
  const col = alien % COLS;
  const row = (alien - col) / COLS;
  const id = alienId(alien);
  if (alive[alien] == 0) {
    entities[id] = { x: -30, y: -30, visible: 0, p0: 0 };
  } else {
    entities[id] = {
      x: waveX + col * 40,
      y: waveY + row * 30,
      p0: anim,
      visible: 1
    };
  }
}

function placeShip(entities, px, py) {
  entities.ship = { x: px, y: py, p0: 0, visible: 1 };
}

function hitAlien(alien, waveX, waveY, sx, sy) {
  const col = alien % COLS;
  const row = (alien - col) / COLS;
  const ax = waveX + col * 40;
  const ay = waveY + row * 30;
  if (sx < ax - 14) { return 0; }
  if (sx > ax + 14) { return 0; }
  if (sy < ay - 12) { return 0; }
  if (sy > ay + 12) { return 0; }
  return 1;
}

function update(props) {
  const s = props.state;
  if (s.gameOver == 1) {
    return s;
  }

  const events = [];
  const dt = props.dt;
  let px = s.px;
  let py = s.py;
  let waveX = s.waveX;
  let waveY = s.waveY;
  let waveDir = s.waveDir;
  let waveTick = s.waveTick;
  let anim = s.anim;
  let shotX = s.shotX;
  let shotY = s.shotY;
  let shotActive = s.shotActive;
  let fireCd = s.fireCd;
  let score1 = s.score1;
  let score2 = s.score2;
  let gameOver = s.gameOver;
  const alive = s.alive;

  if (props.left || props.up) { px = px - dt * 0.22; }
  if (props.right || props.down) { px = px + dt * 0.22; }
  if (px < 24) { px = 24; }
  if (px > 456) { px = 456; }

  waveTick = waveTick + 1;
  if (waveTick > 14) {
    waveTick = 0;
    if (anim == 0) { anim = 1; } else { anim = 0; }
    waveX = waveX + waveDir * 6;
    if (waveX > 300) { waveDir = -1; waveY = waveY + 8; }
    if (waveX < 40) { waveDir = 1; waveY = waveY + 8; }
    if (waveY > 190) {
      score2 = score2 - 1;
      events.push(soundEvent("lose"));
      const reset = resetWave(alive);
      waveX = reset.waveX;
      waveY = reset.waveY;
      waveDir = reset.waveDir;
      waveTick = reset.waveTick;
      if (score2 <= 0) {
        score2 = 0;
        gameOver = 1;
      }
    }
  }

  fireCd = fireCd - 1;
  if (fireCd < 0) { fireCd = 0; }
  if (shotActive == 0) {
    if (fireCd == 0) {
      shotActive = 1;
      shotX = px;
      shotY = py - 16;
      fireCd = 22;
    }
  }
  if (shotActive == 1) {
    shotY = shotY - dt * 0.45;
    if (shotY < 0) {
      shotActive = 0;
      shotY = -30;
    }
  }

  if (shotActive == 1) {
    let alien = 0;
    while (alien < ALIEN_COUNT) {
      if (alive[alien] == 1) {
        if (hitAlien(alien, waveX, waveY, shotX, shotY) == 1) {
          alive[alien] = 0;
          shotActive = 0;
          shotY = -30;
          score1 = score1 + 10;
          events.push(soundEvent("brick"));
        }
      }
      alien = alien + 1;
    }
  }

  if (countAlive(alive) == 0) {
    events.push(soundEvent("bounce"));
    const reset = resetWave(alive);
    waveX = reset.waveX;
    waveY = reset.waveY;
    waveDir = reset.waveDir;
    waveTick = reset.waveTick;
  }

  const entities = {};
  placeShip(entities, px, py);
  if (shotActive == 1) {
    entities.shot = { x: shotX, y: shotY, visible: 1 };
  } else {
    entities.shot = { x: -20, y: -30, visible: 0 };
  }
  let alien2 = 0;
  while (alien2 < ALIEN_COUNT) {
    placeAlien(entities, alien2, waveX, waveY, alive, anim);
    alien2 = alien2 + 1;
  }

  return {
    layout: "invaders",
    showNet: 0,
    entities: entities,
    px: px,
    py: py,
    waveX: waveX,
    waveY: waveY,
    waveDir: waveDir,
    waveTick: waveTick,
    anim: anim,
    shotX: shotX,
    shotY: shotY,
    shotActive: shotActive,
    fireCd: fireCd,
    alive: alive,
    score1: score1,
    score2: score2,
    gameOver: gameOver,
    events: events
  };
}
