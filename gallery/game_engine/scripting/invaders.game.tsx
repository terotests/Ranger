/// <reference path="./game.d.ts" />
//
// Mini Space Invaders for the retained-mode GameRunner.
//
// Aliens are built from many small coloured rects (pixel-art style) - the runner
// keeps each pixel as a retained sprite and only moves them each frame.
//
// Controls (game_sdl_runner): Left/Right arrows (or A/D) move the cannon.
// W/S and Up/Down work too. Firing is automatic. score1 = points, score2 = lives.
//
// Run:
//   npm run engine:game-sdl:run -- gallery/game_engine/scripting/invaders.game.tsx
//   SDL_VIDEODRIVER=dummy tmp/game-sdl/game_sdl gallery/game_engine/scripting/invaders.game.tsx 600

const PX = 3;
const COLS = 5;
const ROWS = 3;
const ALIEN_COUNT = COLS * ROWS;
const PIXELS_PER_ALIEN = 18;

const INVADER_A = [
  "..XXX..",
  ".XXXXX.",
  "XXOXXX.",
  "XXXXXXX",
  ".X.X.X.",
  "X..X..X"
];

const INVADER_B = [
  "..XXX..",
  ".XXXXX.",
  "XXXXXXX",
  ".XX.XX.",
  ".XXXXX.",
  "..X.X.."
];

const INVADER_C = [
  ".XXXXX.",
  "XXXXXXX",
  "XOXXXOX",
  "XXXXXXX",
  ".X...X.",
  "X.....X"
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

function pixelsFromBitmap(bitmap, pal) {
  const parts = [];
  let row = 0;
  while (row < bitmap.length) {
    const line = bitmap[row];
    let col = 0;
    while (col < line.length) {
      const ch = line.charAt(col);
      if (ch == "X" || ch == "O") {
        const isEye = ch == "O";
        parts.push({
          dx: (col - 3) * PX,
          dy: (row - 2) * PX,
          r: isEye ? pal.er : pal.br,
          g: isEye ? pal.eg : pal.bg,
          b: isEye ? pal.eb : pal.bb
        });
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return parts;
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

function spriteId(alien, pix) {
  return ("a" + alien + "p" + pix);
}

function buildAlienSprites() {
  const list = [];
  let alien = 0;
  while (alien < ALIEN_COUNT) {
    const col = alien % COLS;
    const row = (alien - col) / COLS;
    const kind = alienType(row, col);
    const pal = paletteFor(kind);
    const parts = pixelsFromBitmap(alienBitmap(kind, 0), pal);
    let pix = 0;
    while (pix < parts.length) {
      if (pix < PIXELS_PER_ALIEN) {
        const p = parts[pix];
        list.push({
          id: spriteId(alien, pix),
          kind: "rect",
          w: PX,
          h: PX,
          r: p.r,
          g: p.g,
          b: p.b
        });
      }
      pix = pix + 1;
    }
    while (pix < PIXELS_PER_ALIEN) {
      list.push({
        id: spriteId(alien, pix),
        kind: "rect",
        w: 1,
        h: 1,
        r: 0,
        g: 0,
        b: 0
      });
      pix = pix + 1;
    }
    alien = alien + 1;
  }
  return list;
}

function buildShipSprites() {
  return [
    { id: "ship0", kind: "rect", w: 4, h: 4, r: 120, g: 220, b: 255 },
    { id: "ship1", kind: "rect", w: 4, h: 4, r: 120, g: 220, b: 255 },
    { id: "ship2", kind: "rect", w: 4, h: 4, r: 120, g: 220, b: 255 },
    { id: "ship3", kind: "rect", w: 6, h: 6, r: 80, g: 180, b: 255 },
    { id: "ship4", kind: "rect", w: 8, h: 8, r: 40, g: 120, b: 220 },
    { id: "ship5", kind: "rect", w: 4, h: 10, r: 200, g: 255, b: 255 }
  ];
}

function sprites() {
  const list = buildAlienSprites();
  const ship = buildShipSprites();
  let i = 0;
  while (i < ship.length) {
    list.push(ship[i]);
    i = i + 1;
  }
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
  entities.ship0 = { x: px - 10, y: py + 6 };
  entities.ship1 = { x: px - 4, y: py + 6 };
  entities.ship2 = { x: px + 4, y: py + 6 };
  entities.ship3 = { x: px - 3, y: py + 2 };
  entities.ship4 = { x: px - 4, y: py - 2 };
  entities.ship5 = { x: px - 2, y: py - 10 };

  let alien = 0;
  while (alien < ALIEN_COUNT) {
    const col = alien % COLS;
    const row = (alien - col) / COLS;
    const ax = waveX + col * 40;
    const ay = waveY + row * 30;
    const kind = alienType(row, col);
    const pal = paletteFor(kind);
    const parts = pixelsFromBitmap(alienBitmap(kind, 0), pal);
    let pix = 0;
    while (pix < PIXELS_PER_ALIEN) {
      const id = spriteId(alien, pix);
      if (pix < parts.length) {
        const p = parts[pix];
        entities[id] = { x: ax + p.dx, y: ay + p.dy };
      } else {
        entities[id] = { x: -20, y: -20 };
      }
      pix = pix + 1;
    }
    alien = alien + 1;
  }
  return entities;
}

function initState() {
  const px = 240;
  const py = 248;
  return {
    layout: "invaders",
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

function placeAlienPixels(entities, alien, waveX, waveY, alive, anim) {
  const col = alien % COLS;
  const row = (alien - col) / COLS;
  const ax = waveX + col * 40;
  const ay = waveY + row * 30;
  const kind = alienType(row, col);
  const pal = paletteFor(kind);
  const parts = pixelsFromBitmap(alienBitmap(kind, anim), pal);
  let pix = 0;
  while (pix < PIXELS_PER_ALIEN) {
    const id = spriteId(alien, pix);
    if (alive[alien] == 0) {
      entities[id] = { x: -30, y: -30 };
    } else {
      if (pix < parts.length) {
        const p = parts[pix];
        entities[id] = { x: ax + p.dx, y: ay + p.dy };
      } else {
        entities[id] = { x: -30, y: -30 };
      }
    }
    pix = pix + 1;
  }
}

function placeShip(entities, px, py) {
  entities.ship0 = { x: px - 10, y: py + 6 };
  entities.ship1 = { x: px - 4, y: py + 6 };
  entities.ship2 = { x: px + 4, y: py + 6 };
  entities.ship3 = { x: px - 3, y: py + 2 };
  entities.ship4 = { x: px - 4, y: py - 2 };
  entities.ship5 = { x: px - 2, y: py - 10 };
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

  anim = anim + 1;
  if (anim > 18) { anim = 0; }

  waveTick = waveTick + 1;
  if (waveTick > 14) {
    waveTick = 0;
    waveX = waveX + waveDir * 6;
    if (waveX > 300) { waveDir = -1; waveY = waveY + 8; }
    if (waveX < 40) { waveDir = 1; waveY = waveY + 8; }
    if (waveY > 190) {
      score2 = score2 - 1;
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
        }
      }
      alien = alien + 1;
    }
  }

  if (countAlive(alive) == 0) {
    const reset = resetWave(alive);
    waveX = reset.waveX;
    waveY = reset.waveY;
    waveDir = reset.waveDir;
    waveTick = reset.waveTick;
  }

  const entities = {};
  placeShip(entities, px, py);
  if (shotActive == 1) {
    entities.shot = { x: shotX, y: shotY };
  } else {
    entities.shot = { x: -20, y: -30 };
  }
  let alien2 = 0;
  while (alien2 < ALIEN_COUNT) {
    placeAlienPixels(entities, alien2, waveX, waveY, alive, anim);
    alien2 = alien2 + 1;
  }

  return {
    layout: "invaders",
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
    gameOver: gameOver
  };
}
