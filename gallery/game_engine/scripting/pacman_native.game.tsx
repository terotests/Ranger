/// <reference path="./game.d.ts" />
//
// Pac-Man — flat-state variant for TS→Ranger native compile (Path B).
// Full multi-screen + JSX HUD: pacman.game.tsx + engine:game-sdl:run:pacman
//
// Native:
//   npm run engine:game-sdl-native:watch:pacman   # save .tsx → auto rebuild + restart
//   npm run ts2ranger:emit -- gallery/game_engine/scripting/pacman_native.game.tsx
//   npm run engine:game-sdl-native:run:pacman

const TILE = 14;
const STEP_MS = 220.0;
const GHOST_STEP_MS = 220.0;
const POWER_MS = 6000.0;
const SCATTER_MS = 7000.0;
const CHASE_MS = 20000.0;
const HURT_MS = 1500.0;
const START_GHOST_DELAY_MS = 3000.0;
const RESPAWN_GHOST_DELAY_MS = 2000.0;
const GHOST_COUNT = 4;

const COLS = 19;
const ROWS = 11;
const ORIGIN_X = 107;
const ORIGIN_Y = 52;

const MODE_SCATTER = 0;
const MODE_CHASE = 1;

const CH_WALL = 35;
const CH_DOT = 46;
const CH_POWER = 79;
const CH_START = 83;
const CH_GHOST = 71;

const MAZE_FLAT = [
  35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35,
  35, 79, 46, 46, 46, 46, 46, 46, 46, 35, 46, 46, 46, 46, 46, 46, 46, 79, 35,
  35, 46, 35, 35, 35, 46, 35, 35, 46, 35, 46, 35, 35, 46, 35, 35, 35, 46, 35,
  35, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 35,
  35, 46, 35, 35, 35, 46, 35, 46, 35, 35, 35, 46, 35, 46, 35, 35, 35, 46, 35,
  35, 46, 46, 46, 46, 46, 35, 46, 46, 83, 46, 46, 35, 46, 46, 46, 46, 46, 35,
  35, 46, 35, 35, 35, 35, 35, 35, 35, 46, 35, 35, 35, 35, 35, 35, 35, 46, 35,
  35, 71, 46, 46, 46, 46, 46, 46, 35, 46, 46, 46, 46, 46, 46, 71, 46, 46, 35,
  35, 46, 35, 35, 35, 46, 35, 46, 35, 35, 35, 46, 35, 46, 35, 35, 35, 46, 35,
  35, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 35,
  35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35
];

const TUNNEL_ROWS = [3, 9];

function mazeAt(col, row) {
  return MAZE_FLAT[row * COLS + col];
}

function isTunnelRow(row) {
  let i = 0;
  while (i < TUNNEL_ROWS.length) {
    if (TUNNEL_ROWS[i] == row) { return 1; }
    i = i + 1;
  }
  return 0;
}

function wrapCol(col, row) {
  if (isTunnelRow(row) == 1) {
    if (col < 0) { return COLS - 1; }
    if (col >= COLS) { return 0; }
  }
  return col;
}

function isWall(col, row) {
  if (row < 0) { return 1; }
  if (row >= ROWS) { return 1; }
  if (isTunnelRow(row) == 1) {
    if (col < 0) { return 0; }
    if (col >= COLS) { return 0; }
  } else {
    if (col < 0) { return 1; }
    if (col >= COLS) { return 1; }
  }
  if (mazeAt(col, row) == CH_WALL) { return 1; }
  return 0;
}

function canWalk(col, row) {
  if (isWall(col, row) == 1) { return 0; }
  return 1;
}

function tileX(col) {
  return ORIGIN_X + col * TILE + (TILE / 2);
}

function tileY(row) {
  return ORIGIN_Y + row * TILE + (TILE / 2);
}

function dirDelta(dir) {
  if (dir == 0) { return { dc: 0, dr: -1 }; }
  if (dir == 1) { return { dc: 1, dr: 0 }; }
  if (dir == 2) { return { dc: 0, dr: 1 }; }
  return { dc: -1, dr: 0 };
}

function tryMove(col, row, dir) {
  const d = dirDelta(dir);
  let nc = col + d.dc;
  let nr = row + d.dr;
  nc = wrapCol(nc, nr);
  if (canWalk(nc, nr) == 1) {
    return { ok: 1, col: nc, row: nr };
  }
  return { ok: 0, col: col, row: row };
}

function lerpTile(col, row, frac, dir) {
  const cx = tileX(col);
  const cy = tileY(row);
  const d = dirDelta(dir);
  const tx = tileX(col + d.dc);
  const ty = tileY(row + d.dr);
  const t = frac / 1000.0;
  return { x: cx + (tx - cx) * t, y: cy + (ty - cy) * t };
}

function lerpIfMoving(col, row, frac, dir) {
  if (canAdvance(col, row, dir) == 0) {
    return { x: tileX(col), y: tileY(row) };
  }
  return lerpTile(col, row, frac, dir);
}

function opposite(dir) {
  if (dir == 0) { return 2; }
  if (dir == 2) { return 0; }
  if (dir == 1) { return 3; }
  return 1;
}

function firstOpenDir(col, row) {
  let dir = 0;
  while (dir < 4) {
    const mv = tryMove(col, row, dir);
    if (mv.ok == 1) { return dir; }
    dir = dir + 1;
  }
  return 0;
}

function canAdvance(col, row, dir) {
  const mv = tryMove(col, row, dir);
  if (mv.ok == 1) { return 1; }
  return 0;
}

function absVal(n) {
  if (n < 0) { return 0 - n; }
  return n;
}

function dist(col, row, tc, tr) {
  return absVal(col - tc) + absVal(row - tr);
}

function wallId(col, row) {
  return "w" + col + "x" + row;
}

function dotId(i) {
  return "d" + i;
}

function powerId(i) {
  return "p" + i;
}

function ghostId(i) {
  return "g" + i;
}

function scatterCol(gi) {
  if (gi == 0) { return 17; }
  if (gi == 1) { return 1; }
  if (gi == 2) { return 17; }
  return 1;
}

function scatterRow(gi) {
  if (gi == 0) { return 0; }
  if (gi == 1) { return 0; }
  if (gi == 2) { return 10; }
  return 10;
}

function ghostPalR(gi) {
  if (gi == 0) { return 220; }
  if (gi == 1) { return 255; }
  if (gi == 2) { return 80; }
  return 255;
}

function ghostPalG(gi) {
  if (gi == 0) { return 40; }
  if (gi == 1) { return 140; }
  if (gi == 2) { return 220; }
  return 160;
}

function ghostPalB(gi) {
  if (gi == 0) { return 60; }
  if (gi == 1) { return 180; }
  if (gi == 2) { return 220; }
  return 60;
}

function buildPlaySprites() {
  const list = [];
  let row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      if (mazeAt(col, row) == CH_WALL) {
        list.push({
          id: wallId(col, row),
          kind: "rect",
          w: TILE,
          h: TILE,
          r: 32,
          g: 56,
          b: 190
        });
      }
      col = col + 1;
    }
    row = row + 1;
  }
  let dotIdx = 0;
  let powIdx = 0;
  row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      const ch = mazeAt(col, row);
      if (ch == CH_DOT) {
        list.push({ id: dotId(dotIdx), kind: "circle", rad: 2, r: 255, g: 220, b: 120 });
        dotIdx = dotIdx + 1;
      }
      if (ch == CH_POWER) {
        list.push({ id: powerId(powIdx), kind: "circle", rad: 5, r: 255, g: 220, b: 160 });
        powIdx = powIdx + 1;
      }
      col = col + 1;
    }
    row = row + 1;
  }
  list.push({ id: "pac", kind: "wedge", rad: 6, r: 255, g: 240, b: 60, p0: 0, p1: 2 });
  let gi = 0;
  while (gi < GHOST_COUNT) {
    list.push({
      id: ghostId(gi),
      kind: "ghost",
      rad: 7,
      r: ghostPalR(gi),
      g: ghostPalG(gi),
      b: ghostPalB(gi),
      p0: 1,
      p1: 0
    });
    gi = gi + 1;
  }
  return list;
}

function sprites() {
  return buildPlaySprites();
}

function makeDotCol() {
  const arr = [];
  let row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      if (mazeAt(col, row) == CH_DOT) {
        arr.push(col);
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return arr;
}

function makeDotRow() {
  const arr = [];
  let row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      if (mazeAt(col, row) == CH_DOT) {
        arr.push(row);
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return arr;
}

function makeDotAlive() {
  const arr = [];
  let row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      if (mazeAt(col, row) == CH_DOT) {
        arr.push(1);
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return arr;
}

function makePowerCol() {
  const arr = [];
  let row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      if (mazeAt(col, row) == CH_POWER) {
        arr.push(col);
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return arr;
}

function makePowerRow() {
  const arr = [];
  let row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      if (mazeAt(col, row) == CH_POWER) {
        arr.push(row);
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return arr;
}

function makePowerAlive() {
  const arr = [];
  let row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      if (mazeAt(col, row) == CH_POWER) {
        arr.push(1);
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return arr;
}

function findStart() {
  let row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      if (mazeAt(col, row) == CH_START) {
        return { col: col, row: row };
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return { col: 9, row: 5 };
}

function ghostSpawnCol(gi) {
  let n = 0;
  let row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      if (mazeAt(col, row) == CH_GHOST) {
        if (n == gi) { return col; }
        n = n + 1;
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return 9;
}

function ghostSpawnRow(gi) {
  let n = 0;
  let row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      if (mazeAt(col, row) == CH_GHOST) {
        if (n == gi) { return row; }
        n = n + 1;
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return 7;
}

function makeGhostCol() {
  const arr = [];
  let gi = 0;
  while (gi < GHOST_COUNT) {
    arr.push(ghostSpawnCol(gi));
    gi = gi + 1;
  }
  return arr;
}

function makeGhostRow() {
  const arr = [];
  let gi = 0;
  while (gi < GHOST_COUNT) {
    arr.push(ghostSpawnRow(gi));
    gi = gi + 1;
  }
  return arr;
}

function makeGhostDir() {
  const arr = [];
  arr.push(3);
  arr.push(3);
  arr.push(3);
  arr.push(3);
  return arr;
}

function makeGhostFrac() {
  const arr = [];
  arr.push(0);
  arr.push(0);
  arr.push(0);
  arr.push(0);
  return arr;
}

function makeGhostEyes() {
  const arr = [];
  arr.push(0);
  arr.push(0);
  arr.push(0);
  arr.push(0);
  return arr;
}

function pack1(v) {
  const a = [];
  a.push(v);
  return a;
}

function at1(a) {
  return a[0];
}

function put1(a, v) {
  a[0] = v;
}

function placeWalls(entities) {
  let row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      if (mazeAt(col, row) == CH_WALL) {
        entities[wallId(col, row)] = { x: tileX(col), y: tileY(row) };
      }
      col = col + 1;
    }
    row = row + 1;
  }
}

function placeDots(entities, dotCol, dotRow, dotAlive, powerCol, powerRow, powerAlive) {
  let i = 0;
  while (i < dotCol.length) {
    if (dotAlive[i] == 1) {
      entities[dotId(i)] = { x: tileX(dotCol[i]), y: tileY(dotRow[i]) };
    } else {
      entities[dotId(i)] = { x: 0, y: 0, visible: 0 };
    }
    i = i + 1;
  }
  i = 0;
  while (i < powerCol.length) {
    if (powerAlive[i] == 1) {
      entities[powerId(i)] = { x: tileX(powerCol[i]), y: tileY(powerRow[i]) };
    } else {
      entities[powerId(i)] = { x: 0, y: 0, visible: 0 };
    }
    i = i + 1;
  }
}

function pacMouth(frameSeed, moving) {
  if (moving == 0) { return 0; }
  return 1 + (frameSeed % 3);
}

function placePac(entities, col, row, frac, dir, frameSeed, moving, blink) {
  if (blink == 1) {
    entities.pac = { x: 0, y: 0, visible: 0 };
    return;
  }
  const pos = lerpIfMoving(col, row, frac, dir);
  entities.pac = {
    x: pos.x,
    y: pos.y,
    p0: dir,
    p1: pacMouth(frameSeed, moving)
  };
}

function ghostDrawR(gi, powered, frameSeed, eyes) {
  if (eyes == 1) { return 255; }
  if (powered > 0) {
    if ((frameSeed % 16) < 8) { return 40; }
    return 200;
  }
  return ghostPalR(gi);
}

function ghostDrawG(gi, powered, frameSeed, eyes) {
  if (eyes == 1) { return 255; }
  if (powered > 0) {
    if ((frameSeed % 16) < 8) { return 80; }
    return 200;
  }
  return ghostPalG(gi);
}

function ghostDrawB(gi, powered, frameSeed, eyes) {
  if (eyes == 1) { return 255; }
  if (powered > 0) {
    if ((frameSeed % 16) < 8) { return 255; }
    return 255;
  }
  return ghostPalB(gi);
}

function ghostDrawRad(eyes) {
  if (eyes == 1) { return 3; }
  return 7;
}

function placeGhosts(entities, ghostCol, ghostRow, ghostDir, ghostFrac, ghostEyes, powered, frameSeed) {
  let i = 0;
  while (i < GHOST_COUNT) {
    const pos = lerpIfMoving(ghostCol[i], ghostRow[i], ghostFrac[i], ghostDir[i]);
    entities[ghostId(i)] = {
      x: pos.x,
      y: pos.y,
      r: ghostDrawR(i, powered, frameSeed, ghostEyes[i]),
      g: ghostDrawG(i, powered, frameSeed, ghostEyes[i]),
      b: ghostDrawB(i, powered, frameSeed, ghostEyes[i]),
      rad: ghostDrawRad(ghostEyes[i]),
      p0: ghostDir[i],
      p1: ghostEyes[i]
    };
    i = i + 1;
  }
}

function initEntities(start, dotCol, dotRow, dotAlive, powerCol, powerRow, powerAlive, ghostCol, ghostRow, ghostDir, ghostFrac, ghostEyes) {
  const entities = {};
  placeWalls(entities);
  placeDots(entities, dotCol, dotRow, dotAlive, powerCol, powerRow, powerAlive);
  placePac(entities, start.col, start.row, 0, 0, 0, 0, 0);
  placeGhosts(entities, ghostCol, ghostRow, ghostDir, ghostFrac, ghostEyes, 0, 0);
  return entities;
}

function initState() {
  const start = findStart();
  const dotCol = makeDotCol();
  const dotRow = makeDotRow();
  const dotAlive = makeDotAlive();
  const powerCol = makePowerCol();
  const powerRow = makePowerRow();
  const powerAlive = makePowerAlive();
  const ghostCol = makeGhostCol();
  const ghostRow = makeGhostRow();
  const ghostDir = makeGhostDir();
  const ghostFrac = makeGhostFrac();
  const ghostEyes = makeGhostEyes();
  return {
    showNet: 0,
    entities: initEntities(start, dotCol, dotRow, dotAlive, powerCol, powerRow, powerAlive, ghostCol, ghostRow, ghostDir, ghostFrac, ghostEyes),
    score1: 0,
    score2: 3,
    pacCol: pack1(start.col),
    pacRow: pack1(start.row),
    pacDir: pack1(0),
    nextDir: pack1(0),
    pacFrac: 0.0,
    frameSeed: pack1(0),
    globalMode: pack1(MODE_SCATTER),
    modeTimer: SCATTER_MS,
    ghostReleaseMs: START_GHOST_DELAY_MS,
    dotCol: dotCol,
    dotRow: dotRow,
    dotAlive: dotAlive,
    powerCol: powerCol,
    powerRow: powerRow,
    powerAlive: powerAlive,
    ghostCol: ghostCol,
    ghostRow: ghostRow,
    ghostDir: ghostDir,
    ghostFrac: ghostFrac,
    ghostEyes: ghostEyes,
    score: 0,
    powered: 0.0,
    powerLeft: 0.0,
    hurtTimer: 0.0,
    gameOver: pack1(0)
  };
}

function readInputDir(props, prev) {
  let dir = prev;
  if (props.up) { dir = 0; }
  if (props.right) { dir = 1; }
  if (props.down) { dir = 2; }
  if (props.left) { dir = 3; }
  return dir;
}

function tryTurn(col, row, curDir, wantDir) {
  const t = tryMove(col, row, wantDir);
  if (t.ok == 1) { return wantDir; }
  return curDir;
}

function eatAt(col, row, dotCol, dotRow, dotAlive, powerCol, powerRow, powerAlive) {
  let score = 0;
  let powered = 0;
  let i = 0;
  while (i < dotCol.length) {
    if (dotAlive[i] == 1) {
      if (dotCol[i] == col) {
        if (dotRow[i] == row) {
          dotAlive[i] = 0;
          score = score + 10;
        }
      }
    }
    i = i + 1;
  }
  i = 0;
  while (i < powerCol.length) {
    if (powerAlive[i] == 1) {
      if (powerCol[i] == col) {
        if (powerRow[i] == row) {
          powerAlive[i] = 0;
          score = score + 50;
          powered = 1;
        }
      }
    }
    i = i + 1;
  }
  return { score: score, powered: powered };
}

function listDirsFor(gCol, gRow, gDir, forbidReverse) {
  const opts = [];
  let dir = 0;
  while (dir < 4) {
    let skip = 0;
    if (forbidReverse == 1) {
      if (dir == opposite(gDir)) { skip = 1; }
    }
    if (skip == 0) {
      const mv = tryMove(gCol, gRow, dir);
      if (mv.ok == 1) { opts.push(dir); }
    }
    dir = dir + 1;
  }
  return opts;
}

function chaseTargetCol(gi, pacCol, pacRow, pacDir, gCol, gRow) {
  const d = dirDelta(pacDir);
  if (gi == 0) { return pacCol; }
  if (gi == 1) { return pacCol + d.dc * 4; }
  if (gi == 2) { return pacCol + d.dc * 2; }
  if (dist(gCol, gRow, pacCol, pacRow) > 8) {
    return scatterCol(gi);
  }
  return pacCol;
}

function chaseTargetRow(gi, pacCol, pacRow, pacDir, gCol, gRow) {
  const d = dirDelta(pacDir);
  if (gi == 0) { return pacRow; }
  if (gi == 1) { return pacRow + d.dr * 4; }
  if (gi == 2) { return pacRow + d.dr * 2; }
  if (dist(gCol, gRow, pacCol, pacRow) > 8) {
    return scatterRow(gi);
  }
  return pacRow;
}

function pickGhostDir(gCol, gRow, gDir, gi, pacCol, pacRow, pacDir, globalMode, powered) {
  const opts = listDirsFor(gCol, gRow, gDir, 1);
  if (opts.length == 0) {
    const rev = listDirsFor(gCol, gRow, gDir, 0);
    if (rev.length == 0) { return gDir; }
    return rev[0];
  }
  if (powered > 0) {
    let best = opts[0];
    let bestDist = -1;
    let i = 0;
    while (i < opts.length) {
      const mv = tryMove(gCol, gRow, opts[i]);
      const dd = dist(mv.col, mv.row, pacCol, pacRow);
      if (dd > bestDist) {
        bestDist = dd;
        best = opts[i];
      }
      i = i + 1;
    }
    return best;
  }
  let tc = scatterCol(gi);
  let tr = scatterRow(gi);
  if (globalMode == MODE_CHASE) {
    tc = chaseTargetCol(gi, pacCol, pacRow, pacDir, gCol, gRow);
    tr = chaseTargetRow(gi, pacCol, pacRow, pacDir, gCol, gRow);
  }
  let best2 = opts[0];
  let bestD = 9999;
  let j = 0;
  while (j < opts.length) {
    const mv2 = tryMove(gCol, gRow, opts[j]);
    const dd2 = dist(mv2.col, mv2.row, tc, tr);
    if (dd2 < bestD) {
      bestD = dd2;
      best2 = opts[j];
    }
    j = j + 1;
  }
  return best2;
}

function stepGhostAt(gi, gCol, gRow, gDir, gEyes, pacCol, pacRow, pacDir, globalMode, powered) {
  if (gEyes == 1) {
    const spCol = ghostSpawnCol(gi);
    const spRow = ghostSpawnRow(gi);
    const dir = pickGhostDir(gCol, gRow, gDir, gi, spCol, spRow, 1, MODE_CHASE, 0);
    const mv = tryMove(gCol, gRow, dir);
    if (mv.ok == 1) {
      gCol = mv.col;
      gRow = mv.row;
      gDir = dir;
    }
    if (gCol == spCol) {
      if (gRow == spRow) { gEyes = 0; }
    }
    return { col: gCol, row: gRow, dir: gDir, eyes: gEyes };
  }
  const dir2 = pickGhostDir(gCol, gRow, gDir, gi, pacCol, pacRow, pacDir, globalMode, powered);
  const mv2 = tryMove(gCol, gRow, dir2);
  if (mv2.ok == 1) {
    gCol = mv2.col;
    gRow = mv2.row;
    gDir = dir2;
  }
  return { col: gCol, row: gRow, dir: gDir, eyes: gEyes };
}

function hitGhostAtGrid(pacCol, pacRow, pacFrac, pacDir, ghostCol, ghostRow, ghostFrac, ghostDir, ghostEyes) {
  const pacPos = lerpIfMoving(pacCol, pacRow, pacFrac, pacDir);
  let i = 0;
  while (i < GHOST_COUNT) {
    if (ghostEyes[i] == 0) {
      const pos = lerpIfMoving(ghostCol[i], ghostRow[i], ghostFrac[i], ghostDir[i]);
      const dx = absVal(pacPos.x - pos.x);
      const dy = absVal(pacPos.y - pos.y);
      if (dx + dy < 14) { return i; }
    }
    i = i + 1;
  }
  return -1;
}

function countAliveDots(dotAlive) {
  let n = 0;
  let i = 0;
  while (i < dotAlive.length) {
    if (dotAlive[i] == 1) { n = n + 1; }
    i = i + 1;
  }
  return n;
}

function resetAfterHurt(ghostCol, ghostRow, ghostDir, ghostFrac, ghostEyes) {
  const start = findStart();
  let gi = 0;
  while (gi < GHOST_COUNT) {
    ghostCol[gi] = ghostSpawnCol(gi);
    ghostRow[gi] = ghostSpawnRow(gi);
    ghostDir[gi] = 3;
    ghostFrac[gi] = 0;
    ghostEyes[gi] = 0;
    gi = gi + 1;
  }
  return {
    pacCol: start.col,
    pacRow: start.row,
    pacFrac: 0.0,
    hurtTimer: HURT_MS
  };
}

function update(props) {
  const s = props.state;
  if (at1(s.gameOver) == 1) {
    if (props.action) {
      return initState();
    }
    return {
      showNet: 0,
      score1: s.score1,
      score2: s.score2,
      gameOver: pack1(1)
    };
  }
  const dt = props.dt;
  let nextDirArr = s.nextDir;
  let nextDir = readInputDir(props, at1(nextDirArr));
  put1(nextDirArr, nextDir);
  let pacColArr = s.pacCol;
  let pacRowArr = s.pacRow;
  let pacDirArr = s.pacDir;
  let frameSeedArr = s.frameSeed;
  let globalModeArr = s.globalMode;
  let pacCol = at1(pacColArr);
  let pacRow = at1(pacRowArr);
  let pacDir = at1(pacDirArr);
  let pacFrac = s.pacFrac;
  let score = s.score;
  let score2 = s.score2;
  let powered = s.powered;
  let powerLeft = s.powerLeft;
  let frameSeed = at1(frameSeedArr) + 1;
  put1(frameSeedArr, frameSeed);
  let globalMode = at1(globalModeArr);
  let modeTimer = s.modeTimer - dt;
  let hurtTimer = s.hurtTimer;
  let ghostReleaseMs = s.ghostReleaseMs;
  if (ghostReleaseMs > 0) {
    ghostReleaseMs = ghostReleaseMs - dt;
  }
  let dotCol = s.dotCol;
  let dotRow = s.dotRow;
  let dotAlive = s.dotAlive;
  let powerCol = s.powerCol;
  let powerRow = s.powerRow;
  let powerAlive = s.powerAlive;
  let ghostCol = s.ghostCol;
  let ghostRow = s.ghostRow;
  let ghostDir = s.ghostDir;
  let ghostFrac = s.ghostFrac;
  let ghostEyes = s.ghostEyes;
  let gameOverArr = s.gameOver;
  let gameOver = at1(gameOverArr);
  let moving = 0;
  let blink = 0;

  if (hurtTimer > 0) {
    hurtTimer = hurtTimer - dt;
    if ((frameSeed % 8) < 4) { blink = 1; }
  }

  if (powered > 0) {
    powerLeft = powerLeft - dt;
    if (powerLeft <= 0) {
      powered = 0.0;
      powerLeft = 0.0;
    }
  } else {
    if (modeTimer <= 0) {
      if (globalMode == MODE_SCATTER) {
        globalMode = MODE_CHASE;
        put1(globalModeArr, globalMode);
        modeTimer = CHASE_MS;
      } else {
        globalMode = MODE_SCATTER;
        put1(globalModeArr, globalMode);
        modeTimer = SCATTER_MS;
      }
    }
  }

  if (hurtTimer <= 0) {
    if (pacFrac < 80) {
      pacDir = tryTurn(pacCol, pacRow, pacDir, nextDir);
      put1(pacDirArr, pacDir);
    }
    pacFrac = pacFrac + ((1000 * dt) / STEP_MS);
    while (pacFrac >= 1000) {
      pacDir = tryTurn(pacCol, pacRow, pacDir, nextDir);
      put1(pacDirArr, pacDir);
      const mv = tryMove(pacCol, pacRow, pacDir);
      if (mv.ok == 1) {
        pacCol = mv.col;
        pacRow = mv.row;
        put1(pacColArr, pacCol);
        put1(pacRowArr, pacRow);
        pacFrac = pacFrac - 1000;
        moving = 1;
        const eat = eatAt(pacCol, pacRow, dotCol, dotRow, dotAlive, powerCol, powerRow, powerAlive);
        score = score + eat.score;
        if (eat.powered == 1) {
          powered = 1.0;
          powerLeft = POWER_MS;
        }
      } else {
        pacFrac = 0;
      }
    }

    if (ghostReleaseMs <= 0) {
      let gi = 0;
      while (gi < GHOST_COUNT) {
        ghostFrac[gi] = ghostFrac[gi] + ((1000 * dt) / GHOST_STEP_MS);
        while (ghostFrac[gi] >= 1000) {
          const beforeCol = ghostCol[gi];
          const beforeRow = ghostRow[gi];
          const stepped = stepGhostAt(gi, ghostCol[gi], ghostRow[gi], ghostDir[gi], ghostEyes[gi], pacCol, pacRow, pacDir, globalMode, powered);
          ghostCol[gi] = stepped.col;
          ghostRow[gi] = stepped.row;
          ghostDir[gi] = stepped.dir;
          ghostEyes[gi] = stepped.eyes;
          if (ghostCol[gi] == beforeCol) {
            if (ghostRow[gi] == beforeRow) {
              ghostFrac[gi] = 0;
            } else {
              ghostFrac[gi] = ghostFrac[gi] - 1000;
            }
          } else {
            ghostFrac[gi] = ghostFrac[gi] - 1000;
          }
        }
        gi = gi + 1;
      }
    }

    if (ghostReleaseMs <= 0) {
    const gh = hitGhostAtGrid(pacCol, pacRow, pacFrac, pacDir, ghostCol, ghostRow, ghostFrac, ghostDir, ghostEyes);
    if (gh >= 0) {
      if (powered > 0) {
        score = score + 200;
        ghostEyes[gh] = 1;
        ghostFrac[gh] = 0;
      } else {
        score2 = score2 - 1;
        if (score2 <= 0) {
          gameOver = 1;
          put1(gameOverArr, 1);
          score2 = 0;
          hurtTimer = 0.0;
          powered = 0.0;
          powerLeft = 0.0;
        } else {
          const reset = resetAfterHurt(ghostCol, ghostRow, ghostDir, ghostFrac, ghostEyes);
          pacCol = reset.pacCol;
          pacRow = reset.pacRow;
          pacDir = 0;
          put1(pacColArr, pacCol);
          put1(pacRowArr, pacRow);
          put1(pacDirArr, 0);
          put1(nextDirArr, 0);
          nextDir = 0;
          pacFrac = reset.pacFrac;
          hurtTimer = reset.hurtTimer;
          ghostReleaseMs = HURT_MS + RESPAWN_GHOST_DELAY_MS;
          powered = 0.0;
          powerLeft = 0.0;
        }
      }
    }
    }
  }

  if (countAliveDots(dotAlive) == 0) {
    gameOver = 1;
    put1(gameOverArr, 1);
  }

  const entities = {};
  placeWalls(entities);
  placeDots(entities, dotCol, dotRow, dotAlive, powerCol, powerRow, powerAlive);
  placePac(entities, pacCol, pacRow, pacFrac, pacDir, frameSeed, moving, blink);
  placeGhosts(entities, ghostCol, ghostRow, ghostDir, ghostFrac, ghostEyes, powered, frameSeed);

  return {
    showNet: 0,
    entities: entities,
    pacCol: pacColArr,
    pacRow: pacRowArr,
    pacDir: pacDirArr,
    nextDir: nextDirArr,
    pacFrac: pacFrac,
    frameSeed: frameSeedArr,
    globalMode: globalModeArr,
    modeTimer: modeTimer,
    dotCol: dotCol,
    dotRow: dotRow,
    dotAlive: dotAlive,
    powerCol: powerCol,
    powerRow: powerRow,
    powerAlive: powerAlive,
    ghostCol: ghostCol,
    ghostRow: ghostRow,
    ghostDir: ghostDir,
    ghostFrac: ghostFrac,
    ghostEyes: ghostEyes,
    score: score,
    powered: powered,
    powerLeft: powerLeft,
    hurtTimer: hurtTimer,
    ghostReleaseMs: ghostReleaseMs,
    score1: score,
    score2: score2,
    gameOver: gameOverArr
  };
}
