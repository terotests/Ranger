// ============================================================================
// Pyörretris — a rotating-sprite Tetris clone (interpreted .as / WASM guest).
// ============================================================================
//
// "Pyörre" = a whirl / spin. Every visible thing — the well, the settled stack,
// the active piece and the confetti of a cleared line — is authored by THIS
// guest as a rotatable sprite pushed over the ABI bridge (spriteReset +
// drawSprite tpl,x,y,angleDeg,frame). There is NO physics engine in the loop:
// the guest owns the grid logic AND drives each sprite's position and rotation
// directly, which is the whole point — the host just blits what we ask, rotated.
//
// The rotation is not cosmetic filler: when you spin a piece it eases 90° -> 0°
// so the tetromino visibly whirls into place, and a cleared row bursts into
// blocks that tumble as they fall — all guest-driven sprite rotation.
//
// Controls (edge mask in OFF_INPUT): LEFT/RIGHT move, UP rotates, DOWN soft
// drops, ACTION hard drops (and restarts after a top-out).
// ============================================================================
import { abiRead, abiWrite, spriteReset, drawSprite, playSound, hostRect } from "@ranger/game";

// ---- shared RGW1 header offsets (host -> guest / guest -> host) ----
const OFF_MAGIC: i32 = 0;
const OFF_VERSION: i32 = 4;
const OFF_SIZE: i32 = 8;
const OFF_DT: i32 = 12;
const OFF_TIME: i32 = 16;
const OFF_INPUT: i32 = 20;
const OFF_SCORE: i32 = 40;
const OFF_LINES: i32 = 44;
const OFF_STATE: i32 = 48;
const RGW1_MAGIC: i32 = 827803474;
const ABI_SIZE: i32 = 2560;

// input edge bits
const IN_UP: i32 = 1;
const IN_DOWN: i32 = 2;
const IN_LEFT: i32 = 4;
const IN_RIGHT: i32 = 8;
const IN_ACT: i32 = 16;

// ---- board + layout ----
const BOARD_W: i32 = 10;
const BOARD_H: i32 = 20;
const CELL: i32 = 12;
const OX: i32 = 112;    // board left in page px
const OY: i32 = 14;     // board top in page px

// template indices (declaration order in declare_resources)
const T_I: i32 = 0;
const T_O: i32 = 1;
const T_T: i32 = 2;
const T_S: i32 = 3;
const T_Z: i32 = 4;
const T_J: i32 = 5;
const T_L: i32 = 6;
const T_WALL: i32 = 7;
const T_GHOST: i32 = 8;

// piece geometry: bounding-box size + 4 base cells (col,row), flattened per piece
const PIECE_N = [4, 2, 3, 3, 3, 3, 3];
const PCOL = [0, 1, 2, 3,   0, 1, 0, 1,   1, 0, 1, 2,   1, 2, 0, 1,   0, 1, 1, 2,   0, 0, 1, 2,   2, 0, 1, 2];
const PROW = [1, 1, 1, 1,   0, 0, 1, 1,   0, 1, 1, 1,   0, 0, 1, 1,   0, 0, 1, 1,   0, 1, 1, 1,   0, 1, 1, 1];

// ---- persistent state ----
let BOARD = [];
let ACOL = [0, 0, 0, 0];
let AROW = [0, 0, 0, 0];
let curPiece: i32 = 0;
let curRot: i32 = 0;
let curPx: i32 = 0;
let curPy: i32 = 0;
let nextPiece: i32 = 0;
let score: i32 = 0;
let lines: i32 = 0;
let level: i32 = 1;
let fallTimer: i32 = 0;
let spinDeg: i32 = 0;      // active-piece spin angle, eases back to 0
let gameOver: i32 = 0;
let rngSeed: i32 = 22695477;

// line-clear confetti (parallel arrays; positions/velocities in f64)
let dX = [];
let dY = [];
let dVX = [];
let dVY = [];
let dAng = [];
let dSpin = [];
let dCol = [];
let dLife = [];

// ---- integer helpers (portable in both the interpreter and asc) ----
function idiv(a: i32, b: i32): i32 { return (a / b) | 0; }
function imod(a: i32, b: i32): i32 { return a - idiv(a, b) * b; }

function rnd7(): i32 {
  rngSeed = imod(rngSeed * 1664525 + 1013904223, 2147483647);
  if (rngSeed < 0) { rngSeed = 0 - rngSeed; }
  return imod(idiv(rngSeed, 337), 7);
}

// ---- piece cells ----
function computeCells(piece: i32, rot: i32, px: i32, py: i32): void {
  const n: i32 = PIECE_N[piece];
  let k: i32 = 0;
  while (k < 4) {
    let c: i32 = PCOL[piece * 4 + k];
    let r: i32 = PROW[piece * 4 + k];
    let t: i32 = 0;
    while (t < rot) {
      const nc: i32 = n - 1 - r;
      const nr: i32 = c;
      c = nc;
      r = nr;
      t = t + 1;
    }
    ACOL[k] = px + c;
    AROW[k] = py + r;
    k = k + 1;
  }
}

function collides(piece: i32, rot: i32, px: i32, py: i32): i32 {
  computeCells(piece, rot, px, py);
  let k: i32 = 0;
  while (k < 4) {
    const c: i32 = ACOL[k];
    const r: i32 = AROW[k];
    if (c < 0) { return 1; }
    if (c >= BOARD_W) { return 1; }
    if (r >= BOARD_H) { return 1; }
    if (r >= 0) {
      if (BOARD[r * BOARD_W + c] != 0) { return 1; }
    }
    k = k + 1;
  }
  return 0;
}

function spawnPiece(): void {
  curPiece = nextPiece;
  nextPiece = rnd7();
  curRot = 0;
  curPx = idiv(BOARD_W - PIECE_N[curPiece], 2);
  curPy = 0;
  spinDeg = 0;
  if (collides(curPiece, curRot, curPx, curPy) == 1) {
    gameOver = 1;
    playSound(4);
  }
}

function lockPiece(): void {
  computeCells(curPiece, curRot, curPx, curPy);
  let k: i32 = 0;
  while (k < 4) {
    const c: i32 = ACOL[k];
    const r: i32 = AROW[k];
    if (r >= 0) {
      if (r < BOARD_H) {
        BOARD[r * BOARD_W + c] = curPiece + 1;
      }
    }
    k = k + 1;
  }
  // every placed piece is worth points, so the score climbs even without a
  // line clear ("more pieces -> more points").
  score = score + 12;
  playSound(2);
}

function spawnConfetti(r: i32, c: i32, v: i32): void {
  if (v == 0) { return; }
  const cx: f64 = OX + c * CELL + idiv(CELL, 2);
  const cy: f64 = OY + r * CELL + idiv(CELL, 2);
  const sway: i32 = (c - 5) * 26;
  dX.push(cx);
  dY.push(cy);
  dVX.push(sway + rnd7() * 12 - 36);
  dVY.push(0 - 120 - rnd7() * 26);
  dAng.push(rnd7() * 40);
  dSpin.push(rnd7() * 120 - 360);
  dCol.push(v - 1);
  dLife.push(900);
}

function clearLines(): void {
  let nb = [];
  let i: i32 = 0;
  while (i < BOARD_W * BOARD_H) {
    nb.push(0);
    i = i + 1;
  }
  let write: i32 = BOARD_H - 1;
  let r: i32 = BOARD_H - 1;
  let cleared: i32 = 0;
  while (r >= 0) {
    let full: i32 = 1;
    let c: i32 = 0;
    while (c < BOARD_W) {
      if (BOARD[r * BOARD_W + c] == 0) { full = 0; }
      c = c + 1;
    }
    if (full == 1) {
      cleared = cleared + 1;
      let c2: i32 = 0;
      while (c2 < BOARD_W) {
        spawnConfetti(r, c2, BOARD[r * BOARD_W + c2]);
        c2 = c2 + 1;
      }
    } else {
      let c3: i32 = 0;
      while (c3 < BOARD_W) {
        nb[write * BOARD_W + c3] = BOARD[r * BOARD_W + c3];
        c3 = c3 + 1;
      }
      write = write - 1;
    }
    r = r - 1;
  }
  BOARD = nb;
  if (cleared > 0) {
    lines = lines + cleared;
    let pts: i32 = 100;
    if (cleared == 2) { pts = 300; }
    if (cleared == 3) { pts = 500; }
    if (cleared == 4) { pts = 800; }
    score = score + pts * level;
    level = idiv(lines, 10) + 1;
    playSound(3);
  }
}

function tryMove(dx: i32): void {
  if (collides(curPiece, curRot, curPx + dx, curPy) == 0) {
    curPx = curPx + dx;
  }
}

function tryRotate(): void {
  const nrot: i32 = imod(curRot + 1, 4);
  if (collides(curPiece, nrot, curPx, curPy) == 0) {
    curRot = nrot;
    spinDeg = 90;
    playSound(1);
    return;
  }
  if (collides(curPiece, nrot, curPx - 1, curPy) == 0) {
    curPx = curPx - 1;
    curRot = nrot;
    spinDeg = 90;
    playSound(1);
    return;
  }
  if (collides(curPiece, nrot, curPx + 1, curPy) == 0) {
    curPx = curPx + 1;
    curRot = nrot;
    spinDeg = 90;
    playSound(1);
  }
}

function stepDown(): void {
  if (collides(curPiece, curRot, curPx, curPy + 1) == 0) {
    curPy = curPy + 1;
  } else {
    lockPiece();
    clearLines();
    spawnPiece();
  }
}

function hardDrop(): void {
  while (collides(curPiece, curRot, curPx, curPy + 1) == 0) {
    curPy = curPy + 1;
    score = score + 1;
  }
  lockPiece();
  clearLines();
  spawnPiece();
}

function fallInterval(): i32 {
  let iv: i32 = 620 - (level - 1) * 55;
  if (iv < 90) { iv = 90; }
  return iv;
}

function updateConfetti(dt: i32): void {
  const dtS: f64 = dt / 1000.0;
  let nX = [];
  let nY = [];
  let nVX = [];
  let nVY = [];
  let nAng = [];
  let nSpin = [];
  let nCol = [];
  let nLife = [];
  let i: i32 = 0;
  while (i < dX.length) {
    let life: i32 = dLife[i] - dt;
    if (life > 0) {
      let vx: f64 = dVX[i];
      let vy: f64 = dVY[i] + 620.0 * dtS;
      let x: f64 = dX[i] + vx * dtS;
      let y: f64 = dY[i] + vy * dtS;
      let ang: f64 = dAng[i] + dSpin[i] * dtS;
      if (y < 320.0) {
        nX.push(x);
        nY.push(y);
        nVX.push(vx);
        nVY.push(vy);
        nAng.push(ang);
        nSpin.push(dSpin[i]);
        nCol.push(dCol[i]);
        nLife.push(life);
      }
    }
    i = i + 1;
  }
  dX = nX;
  dY = nY;
  dVX = nVX;
  dVY = nVY;
  dAng = nAng;
  dSpin = nSpin;
  dCol = nCol;
  dLife = nLife;
}

// ---- rendering (every draw goes through the guest sprite bridge) ----
function drawCellBlock(col: i32, row: i32, tpl: i32, ang: i32): void {
  const x: i32 = OX + col * CELL + idiv(CELL, 2);
  const y: i32 = OY + row * CELL + idiv(CELL, 2);
  drawSprite(tpl, x, y, ang, 0);
}

function drawWell(): void {
  let r: i32 = 0;
  while (r < BOARD_H) {
    drawCellBlock(0 - 1, r, T_WALL, 0);
    drawCellBlock(BOARD_W, r, T_WALL, 0);
    r = r + 1;
  }
  let c: i32 = 0 - 1;
  while (c <= BOARD_W) {
    drawCellBlock(c, BOARD_H, T_WALL, 0);
    c = c + 1;
  }
}

function drawLocked(): void {
  let r: i32 = 0;
  while (r < BOARD_H) {
    let c: i32 = 0;
    while (c < BOARD_W) {
      const v: i32 = BOARD[r * BOARD_W + c];
      if (v != 0) {
        drawCellBlock(c, r, v - 1, 0);
      }
      c = c + 1;
    }
    r = r + 1;
  }
}

function drawActive(): void {
  if (gameOver == 1) { return; }
  computeCells(curPiece, curRot, curPx, curPy);
  let k: i32 = 0;
  while (k < 4) {
    const r: i32 = AROW[k];
    if (r >= 0) {
      drawCellBlock(ACOL[k], r, curPiece, spinDeg);
    }
    k = k + 1;
  }
}

function drawConfetti(): void {
  let i: i32 = 0;
  while (i < dX.length) {
    drawSprite(dCol[i], (dX[i] | 0), (dY[i] | 0), (dAng[i] | 0), 0);
    i = i + 1;
  }
}

function drawNext(): void {
  const baseX: i32 = 336;
  const baseY: i32 = 44;
  let k: i32 = 0;
  while (k < 4) {
    const c: i32 = PCOL[nextPiece * 4 + k];
    const r: i32 = PROW[nextPiece * 4 + k];
    drawSprite(nextPiece, baseX + c * CELL, baseY + r * CELL, 0, 0);
    k = k + 1;
  }
}

function renderScene(): void {
  spriteReset();
  drawWell();
  drawLocked();
  drawActive();
  drawConfetti();
  drawNext();
}

function publish(): void {
  abiWrite(OFF_SCORE, score);
  abiWrite(OFF_LINES, lines);
  abiWrite(OFF_STATE, gameOver);
}

function resetGame(): void {
  let nb = [];
  let i: i32 = 0;
  while (i < BOARD_W * BOARD_H) {
    nb.push(0);
    i = i + 1;
  }
  BOARD = nb;
  dX = [];
  dY = [];
  dVX = [];
  dVY = [];
  dAng = [];
  dSpin = [];
  dCol = [];
  dLife = [];
  score = 0;
  lines = 0;
  level = 1;
  fallTimer = 0;
  spinDeg = 0;
  gameOver = 0;
  nextPiece = rnd7();
  spawnPiece();
}

export function init(): void {
  abiWrite(OFF_MAGIC, RGW1_MAGIC);
  abiWrite(OFF_VERSION, 1);
  abiWrite(OFF_SIZE, ABI_SIZE);
  resetGame();
  renderScene();
  publish();
}

export function update(): void {
  let dt: i32 = abiRead(OFF_DT);
  if (dt <= 0) { dt = 16; }
  if (dt > 100) { dt = 100; }
  const inp: i32 = abiRead(OFF_INPUT);

  if (gameOver == 1) {
    if ((inp & IN_ACT) != 0) { resetGame(); }
    updateConfetti(dt);
    renderScene();
    publish();
    return;
  }

  if ((inp & IN_LEFT) != 0) { tryMove(0 - 1); }
  if ((inp & IN_RIGHT) != 0) { tryMove(1); }
  if ((inp & IN_UP) != 0) { tryRotate(); }
  // Down = fast drop: snap the piece straight down into place (much quicker than
  // waiting for gravity). Action/hard-drop does the same.
  if ((inp & IN_DOWN) != 0) { hardDrop(); }
  if ((inp & IN_ACT) != 0) { hardDrop(); }

  if (gameOver == 0) {
    fallTimer = fallTimer + dt;
    const iv: i32 = fallInterval();
    while (fallTimer >= iv) {
      fallTimer = fallTimer - iv;
      stepDown();
      if (gameOver == 1) { fallTimer = 0; }
    }
  }

  if (spinDeg > 0) {
    spinDeg = spinDeg - idiv(dt * 90, 120);
    if (spinDeg < 0) { spinDeg = 0; }
  }

  updateConfetti(dt);
  renderScene();
  publish();
}

export function declare_resources(): void {
  hostRect("I", CELL, CELL, 72, 208, 224, 10);
  hostRect("O", CELL, CELL, 226, 198, 72, 10);
  hostRect("T", CELL, CELL, 178, 96, 210, 10);
  hostRect("S", CELL, CELL, 96, 202, 112, 10);
  hostRect("Z", CELL, CELL, 226, 96, 96, 10);
  hostRect("J", CELL, CELL, 82, 122, 222, 10);
  hostRect("L", CELL, CELL, 232, 150, 60, 10);
  hostRect("WALL", CELL, CELL, 74, 82, 98, 10);
  hostRect("GHOST", CELL, CELL, 44, 50, 64, 10);
}
