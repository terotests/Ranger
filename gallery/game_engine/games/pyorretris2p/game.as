// ============================================================================
// Pyörretris 2P — a two-player, split-well version of the rotating-sprite Tetris.
// ============================================================================
//
// Same guest-driven rotatable-sprite Tetris as games/pyorretris, but TWO wells
// live in the scene at once — you drop straight into a head-to-head match. Every
// visible thing (both wells, both stacks, both active pieces and the line-clear
// confetti) is still authored by THIS guest as a rotatable sprite pushed over the
// ABI bridge; the host just blits what we ask, rotated. There is no physics: the
// guest owns two independent grids and drives every sprite directly.
//
// Two input channels arrive over the ABI: Player 1's edge mask in OFF_INPUT
// (host binds WASD), Player 2's in OFF_INPUT2 (host binds the arrow keys). Each
// player owns one well.
//
// Controls per player (edge mask): LEFT/RIGHT move, UP rotates, DOWN soft-drops,
// ACTION hard-drops. First well to top out loses the round; either ACTION then
// restarts a fresh match.
// ============================================================================
import { abiRead, abiWrite, spriteReset, drawSprite, playSound, hostRect } from "@ranger/game";

// ---- shared RGW1 header offsets (host -> guest / guest -> host) ----
const OFF_MAGIC: i32 = 0;
const OFF_VERSION: i32 = 4;
const OFF_SIZE: i32 = 8;
const OFF_DT: i32 = 12;
const OFF_TIME: i32 = 16;
const OFF_INPUT: i32 = 20;      // player 1 edge mask
const OFF_INPUT2: i32 = 24;     // player 2 edge mask
const OFF_SCORE: i32 = 40;
const OFF_LINES: i32 = 44;
const OFF_STATE: i32 = 48;
const OFF_WINNER: i32 = 60;     // guest -> host: -1 undecided, else winning player
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
const OY: i32 = 14;     // board top in page px (both wells share it)
const OX0: i32 = 40;    // player 1 well left in page px
const OX1: i32 = 280;   // player 2 well left in page px

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
// One flat BOARD holds both wells back to back: cell (p,r,c) lives at
// p*BOARD_W*BOARD_H + r*BOARD_W + c, so each player owns a contiguous region.
let BOARD = [];
// scratch cells for the piece being tested/drawn (reused each call)
let ACOL = [0, 0, 0, 0];
let AROW = [0, 0, 0, 0];
// per-player active-piece + progress state (index 0 = P1, 1 = P2)
let CURPIECE = [0, 0];
let CURROT = [0, 0];
let CURPX = [0, 0];
let CURPY = [0, 0];
let NEXTP = [0, 0];
let SCORE = [0, 0];
let LINES = [0, 0];
let LEVEL = [1, 1];
let FALLT = [0, 0];
let SPIN = [0, 0];      // active-piece spin angle per well, eases back to 0
let OVER = [0, 0];      // 1 once that well has topped out
let matchOver: i32 = 0; // 1 once the round is decided
let winner: i32 = -1;   // 0 = P1, 1 = P2, -1 = undecided
let rngSeed: i32 = 22695477;

// line-clear confetti (parallel arrays; positions/velocities in f64). Shared
// across both wells — each burst carries absolute page coordinates.
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

// flat index of cell (p,r,c) in the shared BOARD
function bIdx(p: i32, r: i32, c: i32): i32 {
  return p * (BOARD_W * BOARD_H) + r * BOARD_W + c;
}

// page-pixel left edge of well `p`
function boardOX(p: i32): i32 {
  if (p == 1) { return OX1; }
  return OX0;
}

// ---- piece cells (writes the scratch ACOL/AROW; well-independent) ----
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

function collides(p: i32, piece: i32, rot: i32, px: i32, py: i32): i32 {
  computeCells(piece, rot, px, py);
  let k: i32 = 0;
  while (k < 4) {
    const c: i32 = ACOL[k];
    const r: i32 = AROW[k];
    if (c < 0) { return 1; }
    if (c >= BOARD_W) { return 1; }
    if (r >= BOARD_H) { return 1; }
    if (r >= 0) {
      if (BOARD[bIdx(p, r, c)] != 0) { return 1; }
    }
    k = k + 1;
  }
  return 0;
}

// first well to top out loses; the other is declared the winner
function endMatch(loser: i32): void {
  if (matchOver == 0) {
    matchOver = 1;
    winner = 1 - loser;
    playSound(4);
  }
}

function spawnPiece(p: i32): void {
  CURPIECE[p] = NEXTP[p];
  NEXTP[p] = rnd7();
  CURROT[p] = 0;
  CURPX[p] = idiv(BOARD_W - PIECE_N[CURPIECE[p]], 2);
  CURPY[p] = 0;
  SPIN[p] = 0;
  if (collides(p, CURPIECE[p], CURROT[p], CURPX[p], CURPY[p]) == 1) {
    OVER[p] = 1;
    endMatch(p);
  }
}

function lockPiece(p: i32): void {
  computeCells(CURPIECE[p], CURROT[p], CURPX[p], CURPY[p]);
  let k: i32 = 0;
  while (k < 4) {
    const c: i32 = ACOL[k];
    const r: i32 = AROW[k];
    if (r >= 0) {
      if (r < BOARD_H) {
        BOARD[bIdx(p, r, c)] = CURPIECE[p] + 1;
      }
    }
    k = k + 1;
  }
  // every placed piece is worth points, so the score climbs even without a line
  // clear ("more pieces -> more points").
  SCORE[p] = SCORE[p] + 12;
  playSound(2);
}

function spawnConfetti(p: i32, r: i32, c: i32, v: i32): void {
  if (v == 0) { return; }
  const cx: f64 = boardOX(p) + c * CELL + idiv(CELL, 2);
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

function clearLines(p: i32): void {
  // rebuild just this player's region into a scratch board, then copy it back
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
      if (BOARD[bIdx(p, r, c)] == 0) { full = 0; }
      c = c + 1;
    }
    if (full == 1) {
      cleared = cleared + 1;
      let c2: i32 = 0;
      while (c2 < BOARD_W) {
        spawnConfetti(p, r, c2, BOARD[bIdx(p, r, c2)]);
        c2 = c2 + 1;
      }
    } else {
      let c3: i32 = 0;
      while (c3 < BOARD_W) {
        nb[write * BOARD_W + c3] = BOARD[bIdx(p, r, c3)];
        c3 = c3 + 1;
      }
      write = write - 1;
    }
    r = r - 1;
  }
  let j: i32 = 0;
  while (j < BOARD_W * BOARD_H) {
    BOARD[p * (BOARD_W * BOARD_H) + j] = nb[j];
    j = j + 1;
  }
  if (cleared > 0) {
    LINES[p] = LINES[p] + cleared;
    let pts: i32 = 100;
    if (cleared == 2) { pts = 300; }
    if (cleared == 3) { pts = 500; }
    if (cleared == 4) { pts = 800; }
    SCORE[p] = SCORE[p] + pts * LEVEL[p];
    LEVEL[p] = idiv(LINES[p], 10) + 1;
    playSound(3);
  }
}

function tryMove(p: i32, dx: i32): void {
  if (collides(p, CURPIECE[p], CURROT[p], CURPX[p] + dx, CURPY[p]) == 0) {
    CURPX[p] = CURPX[p] + dx;
  }
}

function tryRotate(p: i32): void {
  const nrot: i32 = imod(CURROT[p] + 1, 4);
  if (collides(p, CURPIECE[p], nrot, CURPX[p], CURPY[p]) == 0) {
    CURROT[p] = nrot;
    SPIN[p] = 90;
    playSound(1);
    return;
  }
  if (collides(p, CURPIECE[p], nrot, CURPX[p] - 1, CURPY[p]) == 0) {
    CURPX[p] = CURPX[p] - 1;
    CURROT[p] = nrot;
    SPIN[p] = 90;
    playSound(1);
    return;
  }
  if (collides(p, CURPIECE[p], nrot, CURPX[p] + 1, CURPY[p]) == 0) {
    CURPX[p] = CURPX[p] + 1;
    CURROT[p] = nrot;
    SPIN[p] = 90;
    playSound(1);
  }
}

function stepDown(p: i32): void {
  if (collides(p, CURPIECE[p], CURROT[p], CURPX[p], CURPY[p] + 1) == 0) {
    CURPY[p] = CURPY[p] + 1;
  } else {
    lockPiece(p);
    clearLines(p);
    spawnPiece(p);
  }
}

function hardDrop(p: i32): void {
  while (collides(p, CURPIECE[p], CURROT[p], CURPX[p], CURPY[p] + 1) == 0) {
    CURPY[p] = CURPY[p] + 1;
    SCORE[p] = SCORE[p] + 1;
  }
  lockPiece(p);
  clearLines(p);
  spawnPiece(p);
}

function fallInterval(p: i32): i32 {
  let iv: i32 = 620 - (LEVEL[p] - 1) * 55;
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
function drawCellBlock(p: i32, col: i32, row: i32, tpl: i32, ang: i32): void {
  const x: i32 = boardOX(p) + col * CELL + idiv(CELL, 2);
  const y: i32 = OY + row * CELL + idiv(CELL, 2);
  drawSprite(tpl, x, y, ang, 0);
}

function drawWell(p: i32): void {
  let r: i32 = 0;
  while (r < BOARD_H) {
    drawCellBlock(p, 0 - 1, r, T_WALL, 0);
    drawCellBlock(p, BOARD_W, r, T_WALL, 0);
    r = r + 1;
  }
  let c: i32 = 0 - 1;
  while (c <= BOARD_W) {
    drawCellBlock(p, c, BOARD_H, T_WALL, 0);
    c = c + 1;
  }
}

function drawLocked(p: i32): void {
  let r: i32 = 0;
  while (r < BOARD_H) {
    let c: i32 = 0;
    while (c < BOARD_W) {
      const v: i32 = BOARD[bIdx(p, r, c)];
      if (v != 0) {
        drawCellBlock(p, c, r, v - 1, 0);
      }
      c = c + 1;
    }
    r = r + 1;
  }
}

function drawActive(p: i32): void {
  if (OVER[p] == 1) { return; }
  computeCells(CURPIECE[p], CURROT[p], CURPX[p], CURPY[p]);
  let k: i32 = 0;
  while (k < 4) {
    const r: i32 = AROW[k];
    if (r >= 0) {
      drawCellBlock(p, ACOL[k], r, CURPIECE[p], SPIN[p]);
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

function renderScene(): void {
  spriteReset();
  drawWell(0);
  drawWell(1);
  drawLocked(0);
  drawLocked(1);
  drawActive(0);
  drawActive(1);
  drawConfetti();
}

function publish(): void {
  // host score HUD reads OFF_SCORE; show the leader's score, state = match over.
  let top: i32 = SCORE[0];
  if (SCORE[1] > top) { top = SCORE[1]; }
  abiWrite(OFF_SCORE, top);
  abiWrite(OFF_LINES, LINES[0] + LINES[1]);
  abiWrite(OFF_STATE, matchOver);
  abiWrite(OFF_WINNER, winner);
}

function resetPlayer(p: i32): void {
  let i: i32 = 0;
  while (i < BOARD_W * BOARD_H) {
    BOARD[p * (BOARD_W * BOARD_H) + i] = 0;
    i = i + 1;
  }
  SCORE[p] = 0;
  LINES[p] = 0;
  LEVEL[p] = 1;
  FALLT[p] = 0;
  SPIN[p] = 0;
  OVER[p] = 0;
  NEXTP[p] = rnd7();
  spawnPiece(p);
}

function resetGame(): void {
  // (re)allocate the shared two-well board
  let nb = [];
  let i: i32 = 0;
  while (i < 2 * BOARD_W * BOARD_H) {
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
  matchOver = 0;
  winner = -1;
  resetPlayer(0);
  resetPlayer(1);
}

// one player's per-frame input + gravity (skipped once that well is out)
function stepPlayer(p: i32, inp: i32, dt: i32): void {
  if (OVER[p] == 1) { return; }
  if ((inp & IN_LEFT) != 0) { tryMove(p, 0 - 1); }
  if ((inp & IN_RIGHT) != 0) { tryMove(p, 1); }
  if ((inp & IN_UP) != 0) { tryRotate(p); }
  // Down / Action both hard-drop: snap straight into place.
  if ((inp & IN_DOWN) != 0) { hardDrop(p); }
  if ((inp & IN_ACT) != 0) { hardDrop(p); }

  if (OVER[p] == 0) {
    FALLT[p] = FALLT[p] + dt;
    const iv: i32 = fallInterval(p);
    while (FALLT[p] >= iv) {
      FALLT[p] = FALLT[p] - iv;
      stepDown(p);
      if (OVER[p] == 1) { FALLT[p] = 0; }
    }
  }

  if (SPIN[p] > 0) {
    SPIN[p] = SPIN[p] - idiv(dt * 90, 120);
    if (SPIN[p] < 0) { SPIN[p] = 0; }
  }
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
  const inp0: i32 = abiRead(OFF_INPUT);
  const inp1: i32 = abiRead(OFF_INPUT2);

  if (matchOver == 1) {
    // either player can start a fresh match with ACTION
    if (((inp0 & IN_ACT) != 0) || ((inp1 & IN_ACT) != 0)) { resetGame(); }
    updateConfetti(dt);
    renderScene();
    publish();
    return;
  }

  stepPlayer(0, inp0, dt);
  stepPlayer(1, inp1, dt);

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
