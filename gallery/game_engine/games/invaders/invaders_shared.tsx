/// <reference path="../../scripting/game.d.ts" />
//
// Shared Invaders play logic for index.tsx (level 1) and level2.tsx.

import { soundEvent } from "game_helpers";

export const COLS = 5;
export const ROWS = 3;
export const ALIEN_COUNT = COLS * ROWS;
const SHOT_COOLDOWN = 42;
const WAVE_STEP_DOWN = 12;
const LEVEL_LOAD_MS = 1800;

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

export const SHIP_ART = [
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

export function buildAlienSprites() {
  const list = [];
  let alien = 0;
  while (alien < ALIEN_COUNT) {
    list.push(alienSpriteDef(alien));
    alien = alien + 1;
  }
  return list;
}

export function buildSprites() {
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

export function makeAlive() {
  const alive = [];
  let i = 0;
  while (i < ALIEN_COUNT) {
    alive.push(1);
    i = i + 1;
  }
  return alive;
}

export function initEntities(waveX, waveY, px, py, shotY) {
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

export function makePlayState(score1, score2, levelLabel) {
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
    score1: score1,
    score2: score2,
    gameOver: 0,
    levelLabel: levelLabel,
    levelCleared: 0,
    celebrateMs: 0,
    loadQueued: 0,
    background: ""
  };
}

function emptyEntities() {
  const entities = {};
  entities.shot = { x: -20, y: -30, visible: 0 };
  entities.ship = { x: -30, y: -30, p0: 0, visible: 0 };
  let alien = 0;
  while (alien < ALIEN_COUNT) {
    entities[alienId(alien)] = { x: -30, y: -30, visible: 0, p0: 0 };
    alien = alien + 1;
  }
  return entities;
}

function levelLoadState(s, celebrateMs, loadQueued, events) {
  return {
    layout: "invaders",
    showNet: 0,
    entities: emptyEntities(),
    px: s.px,
    py: s.py,
    waveX: s.waveX,
    waveY: s.waveY,
    waveDir: s.waveDir,
    waveTick: s.waveTick,
    anim: s.anim,
    shotX: s.shotX,
    shotY: s.shotY,
    shotActive: 0,
    fireCd: s.fireCd,
    alive: s.alive,
    score1: s.score1,
    score2: s.score2,
    gameOver: s.gameOver,
    levelLabel: s.levelLabel,
    levelCleared: 1,
    celebrateMs: celebrateMs,
    loadQueued: loadQueued,
    background: "win",
    events: events
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

// Classic invaders: formation speeds up as it steps down and as aliens are killed.
function wavePeriodFor(baseWavePeriod, waveY, aliveCount, minWavePeriod) {
  let descents = (waveY - 48) / WAVE_STEP_DOWN;
  let killed = ALIEN_COUNT - aliveCount;
  let killBoost = killed / 4;
  let period = baseWavePeriod - descents - killBoost;
  if (period < minWavePeriod) {
    period = minWavePeriod;
  }
  return period;
}

function stepWaveDown(waveY, waveDir) {
  if (waveDir > 0) {
    waveDir = -1;
  } else {
    waveDir = 1;
  }
  waveY = waveY + WAVE_STEP_DOWN;
  return { waveY: waveY, waveDir: waveDir };
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

export function runPlayUpdate(props, baseWavePeriod, levelMode) {
  const s = props.state;
  if (s.gameOver == 1) {
    return s;
  }

  if (s.levelCleared == 1) {
    let celebrateMs = s.celebrateMs - props.dt;
    let loadQueued = s.loadQueued;
    if (celebrateMs <= 0) {
      celebrateMs = 0;
      if (loadQueued == 0) {
        if (levelMode == "level1") {
          pushGame("level2.tsx");
        }
        if (levelMode == "level2") {
          loadGame("win.tsx");
        }
        loadQueued = 1;
      }
    }
    return levelLoadState(s, celebrateMs, loadQueued, []);
  }

  let minWavePeriod = 4;
  if (levelMode == "level2") {
    minWavePeriod = 3;
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
  const aliveCount = countAlive(alive);
  const wavePeriod = wavePeriodFor(baseWavePeriod, waveY, aliveCount, minWavePeriod);

  if (props.left || props.up) { px = px - dt * 0.22; }
  if (props.right || props.down) { px = px + dt * 0.22; }
  if (px < 24) { px = 24; }
  if (px > 456) { px = 456; }

  waveTick = waveTick + 1;
  if (waveTick > wavePeriod) {
    waveTick = 0;
    if (anim == 0) { anim = 1; } else { anim = 0; }
    waveX = waveX + waveDir * 6;
    if (anim == 0) {
      events.push(soundEvent("wall"));
    } else {
      events.push(soundEvent("bounce"));
    }
    let steppedDown = 0;
    if (waveX > 300) {
      const step = stepWaveDown(waveY, waveDir);
      waveDir = step.waveDir;
      waveY = step.waveY;
      steppedDown = 1;
    }
    if (waveX < 40) {
      if (steppedDown == 0) {
        const step = stepWaveDown(waveY, waveDir);
        waveDir = step.waveDir;
        waveY = step.waveY;
      } else {
        waveDir = 1;
      }
    }
    if (waveY > 140) {
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
    if (props.action) {
      if (fireCd == 0) {
        shotActive = 1;
        shotX = px;
        shotY = py - 16;
        fireCd = SHOT_COOLDOWN;
        events.push(soundEvent("blip"));
      }
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
    if (s.levelCleared == 0) {
      events.push(soundEvent("win"));
      if (levelMode == "level1") {
        saveGameData({ score1: score1, score2: score2, level: 2 });
      }
      if (levelMode == "level2") {
        saveGameData({ score1: score1, score2: score2, level: 0, won: 1 });
      }
      const cleared = {
        px: px,
        py: py,
        waveX: waveX,
        waveY: waveY,
        waveDir: waveDir,
        waveTick: waveTick,
        anim: anim,
        shotX: shotX,
        shotY: shotY,
        fireCd: fireCd,
        alive: alive,
        score1: score1,
        score2: score2,
        gameOver: gameOver,
        levelLabel: s.levelLabel
      };
      return levelLoadState(cleared, LEVEL_LOAD_MS, 0, events);
    }
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
    levelLabel: s.levelLabel,
    levelCleared: s.levelCleared,
    celebrateMs: s.celebrateMs,
    loadQueued: s.loadQueued,
    background: s.background,
    events: events
  };
}

export function playHud(levelLabel, score1, score2, levelCleared) {
  if (levelCleared == 1) {
    return (
      <View width="100%" height="100%" flexDirection="column" justifyContent="center" align="center">
        <Label color="#ffffff">LOADING...</Label>
      </View>
    );
  }
  return (
    <View flexDirection="row" padding="8px" width="100%" justifyContent="space-between">
      <Label color="#8fd3ff">{levelLabel}</Label>
      <Label color="#ffffff">SCORE {score1}</Label>
      <Label color="#ff8899">LIVES {score2}</Label>
    </View>
  );
}
