// Autopeli interpreted from a .as file — runs on Ranger's live TS interpreter
// against the same RGW1/RGU1 ABI as the compiled Rust/AS guests. Core playable
// loop: input -> player controls, traffic AI, contacts -> per-player HUD.
// (oil/ramps/cone-launch/audio are follow-ons, as in the first compiled slice.)
import { abiRead, abiWrite, bodyX, bodyY, writeBodyPos, writeControl, contactCount, contactBodyA, contactBodyB, contactPhase, uiReset, uiNode, uiPropEnum, uiTextRgb, uiFinish, hostSheet, hostRect } from "@ranger/game";

const FP: i32 = 256;
const STEER: i32 = 1000;
const OFF_MAGIC: i32 = 0;
const OFF_VERSION: i32 = 4;
const OFF_SIZE: i32 = 8;
const OFF_DT: i32 = 12;
const OFF_TIME: i32 = 16;
const OFF_INPUT: i32 = 20;
const OFF_INPUT_P2: i32 = 24;
const OFF_BODY_COUNT: i32 = 28;
const OFF_CONTACT_CNT: i32 = 36;
const OFF_SCORE: i32 = 40;
const OFF_HITS: i32 = 44;
const OFF_CAMERA_Y: i32 = 48;
const RGW1_MAGIC: i32 = 827803474;
const ABI_SIZE: i32 = 2560;

const IN_UP: i32 = 1;
const IN_DOWN: i32 = 2;
const IN_LEFT: i32 = 4;
const IN_RIGHT: i32 = 8;
const FINISH_Y: i32 = 140;
const WIN_SCORE: i32 = 5000;
const HIT_FLASH_MS: i32 = 260;

const ROAD_Y = [6000, 5600, 5200, 4800, 4400, 4000, 3600, 3200, 2800, 2400, 2000, 1600, 1200, 800, 400, 100];
const ROAD_X = [240, 220, 200, 250, 300, 255, 210, 250, 310, 250, 170, 220, 290, 250, 210, 240];
const ROAD_H = [126, 104, 78, 96, 114, 94, 108, 94, 110, 92, 98, 90, 104, 88, 74, 112];

const TR_Y = [5520, 5260, 4930, 4590, 4270, 3950, 3610, 3280, 2940, 2570, 2190, 1810, 1420, 1040, 650];
const TR_LANE = [-580, 500, -180, 620, -580, 200, -620, 580, -100, 620, -580, 260, -620, 580, -200];
const TR_THR = [450, 390, 490, 420, 520, 370, 470, 430, 540, 400, 500, 380, 460, 510, 420];
const TR_WEAVE = [4, 7, 3, 5, 4, 8, 4, 6, 3, 7, 5, 8, 4, 5, 7];
const TR_WSPD = [1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1];
const TR_PHASE = [200, 1400, 2200, 3100, 4500, 800, 5400, 2700, 1900, 3800, 5900, 4100, 500, 2900, 5100];

// per-player + scratch module state (persists across update() calls)
let GRIP = [0, 0];
let HITS = [0, 0];
let LAST_HIT = [0, 0];
let FLASH = [0, 0];
let SOMEONE_WON: i32 = 0;
let UI_REV: i32 = 0;
let UI_LAST_SIG: i32 = -1;
let RCX: i32 = 0;
let RHALF: i32 = 0;
let DIN_S: i32 = 0;
let DIN_T: i32 = 0;
let DIN_B: i32 = 0;

// integer helpers (portable: (a/b)|0 is int-div in asc and truncates in interp)
function idiv(a: i32, b: i32): i32 { return (a / b) | 0; }
function imod(a: i32, b: i32): i32 { return a - idiv(a, b) * b; }
function trunc32(x: i32): i32 { return x | 0; }
function clampI(v: i32, lo: i32, hi: i32): i32 {
  if (v < lo) { return lo; }
  if (v > hi) { return hi; }
  return v;
}
function decayTimer(t: i32, dt: i32): i32 {
  const n: i32 = t - dt;
  if (n < 0) { return 0; }
  return n;
}

function roadAt(yFp: i32): void {
  const y: i32 = idiv(yFp, FP);
  if (y >= ROAD_Y[0]) { RCX = ROAD_X[0] * FP; RHALF = ROAD_H[0] * FP; return; }
  if (y <= ROAD_Y[15]) { RCX = ROAD_X[15] * FP; RHALF = ROAD_H[15] * FP; return; }
  let i: i32 = idiv(ROAD_Y[0] - y, 400);
  if (i > 14) { i = 14; }
  const ay: i32 = ROAD_Y[i];
  const ax: i32 = ROAD_X[i];
  const ah: i32 = ROAD_H[i];
  const by: i32 = ROAD_Y[i + 1];
  const bx: i32 = ROAD_X[i + 1];
  const bh: i32 = ROAD_H[i + 1];
  const span: i32 = ay - by;
  let t: i32 = 0;
  if (span > 0) { t = idiv((ay - y) * FP, span); }
  RCX = ax * FP + idiv((bx * FP - ax * FP) * t, FP);
  RHALF = ah * FP + idiv((bh * FP - ah * FP) * t, FP);
}

function cxLane(yFp: i32, laneMilli: i32): i32 {
  roadAt(yFp);
  const usable: i32 = RHALF - 22 * FP;
  return RCX + idiv(usable * clampI(laneMilli, -1000, 1000), 1000);
}

function roadGripMilli(xFp: i32, yFp: i32): i32 {
  roadAt(yFp);
  const edge: i32 = RHALF - 16 * FP;
  const off: i32 = xFp - RCX;
  let grip: i32 = 1000;
  if (off < 0) {
    if (-off > edge) { grip = 450; }
  } else if (off > edge) {
    grip = 450;
  }
  return grip;
}

function surfaceGrip(idx: i32, xFp: i32, yFp: i32): i32 {
  return roadGripMilli(xFp, yFp);
}

// coarse polynomial sine * 1000, wrapped to i32 like the compiled guest
function sinMilli(phase: i32): i32 {
  const x: f64 = imod(phase, 6283) / 1000.0;
  const x2: f64 = x * x;
  const x3: f64 = x2 * x;
  const x5: f64 = x3 * x2;
  return trunc32(x - x3 / 6.0 + x5 / 120.0) * 1000;
}

function driveFromInput(flags: i32): void {
  DIN_S = 0; DIN_T = 0; DIN_B = 0;
  if (flags & IN_LEFT) { DIN_S = -STEER; }
  if (flags & IN_RIGHT) { DIN_S = STEER; }
  if (flags & IN_UP) { DIN_T = STEER; }
  if (flags & IN_DOWN) { DIN_B = STEER; }
}

function drivePlayer(idx: i32, flags: i32): void {
  driveFromInput(flags);
  const grip: i32 = surfaceGrip(idx, bodyX(idx), bodyY(idx));
  GRIP[idx] = grip;
  writeControl(idx, DIN_S, DIN_T, DIN_B, grip);
}

function trafficControl(idx: i32, ti: i32, now: i32): void {
  const bx: i32 = bodyX(idx);
  const by: i32 = bodyY(idx);
  roadAt(by - 115 * FP);
  const cx: i32 = RCX;
  const half: i32 = RHALF;
  const phase: i32 = idiv(now * TR_WSPD[ti] * 12, 10000) + TR_PHASE[ti];
  const wave: i32 = idiv(sinMilli(phase) * TR_WEAVE[ti], 1000);
  const targetX: i32 = cx + idiv((half - 23 * FP) * TR_LANE[ti], 1000) + wave * FP;
  const error: i32 = targetX - bx;
  let steer: i32 = clampI(idiv(error, 34), -STEER, STEER);
  roadAt(by);
  const safeL: i32 = RCX - RHALF + 16 * FP;
  const safeR: i32 = RCX + RHALF - 16 * FP;
  if (bx < safeL) { steer = STEER; }
  if (bx > safeR) { steer = -STEER; }
  const grip: i32 = surfaceGrip(idx, bx, by);
  writeControl(idx, steer, TR_THR[ti], 0, grip);
}

function isPlayer(code: i32): i32 { if (code == 0) { return 1; } if (code == 1) { return 1; } return 0; }
function isWall(code: i32): i32 { if (code == 1000) { return 1; } if (code == 1001) { return 1; } return 0; }
function isCone(code: i32): i32 { if (code >= 100) { if (code < 200) { return 1; } } return 0; }
function isBar(code: i32): i32 { if (code >= 200) { if (code < 300) { return 1; } } return 0; }
function isTraffic(code: i32): i32 { if (code >= 2) { if (code < 17) { return 1; } } return 0; }

function hudNoteHit(player: i32, other: i32): void {
  let kind: i32 = 0;
  if (isWall(other) == 1) { kind = 1; }
  else if (isBar(other) == 1) { kind = 2; }
  else if (isTraffic(other) == 1) { kind = 3; }
  else if (isCone(other) == 1) { kind = 4; }
  if (kind == 0) { return; }
  LAST_HIT[player] = kind;
  if (kind != 4) {
    HITS[player] = HITS[player] + 1;
    FLASH[player] = HIT_FLASH_MS;
  }
}

function processContacts(): void {
  const cnt: i32 = contactCount();
  let ci: i32 = 0;
  while (ci < cnt) {
    if (ci < 14) {
      if (contactPhase(ci) == 1) {
        const a: i32 = contactBodyA(ci);
        const b: i32 = contactBodyB(ci);
        let player: i32 = -1;
        let other: i32 = -1;
        if (isPlayer(a) == 1) { player = a; other = b; }
        else if (isPlayer(b) == 1) { player = b; other = a; }
        if (player >= 0) { hudNoteHit(player, other); }
      }
    }
    ci = ci + 1;
  }
}

function checkWin(): void {
  if (SOMEONE_WON == 1) { return; }
  const y1: i32 = idiv(bodyY(0), FP);
  const y2: i32 = idiv(bodyY(1), FP);
  if (y1 < FINISH_Y) { abiWrite(OFF_SCORE, abiRead(OFF_SCORE) + WIN_SCORE); SOMEONE_WON = 1; }
  else if (y2 < FINISH_Y) { abiWrite(OFF_SCORE, abiRead(OFF_SCORE) + WIN_SCORE); SOMEONE_WON = 1; }
}

// ---- HUD (flat bridge calls; per pane the host renders column 10 or 20) ----
function gripLine(colId: i32, order: i32, idx: i32): void {
  const g: i32 = idiv(GRIP[idx], 10);
  const label: string = "GRIP " + g;
  if (GRIP[idx] >= 650) { uiTextRgb(colId + order + 2, colId, order, label, 64, 208, 96); }
  else if (GRIP[idx] >= 350) { uiTextRgb(colId + order + 2, colId, order, label, 224, 208, 64); }
  else { uiTextRgb(colId + order + 2, colId, order, label, 255, 96, 64); }
}

function hitTypeLine(colId: i32, order: i32, idx: i32): void {
  const k: i32 = LAST_HIT[idx];
  const nid: i32 = colId + order + 2;
  if (k == 1) { uiTextRgb(nid, colId, order, "WALL", 176, 176, 176); }
  else if (k == 2) { uiTextRgb(nid, colId, order, "BAR", 64, 208, 255); }
  else if (k == 3) { uiTextRgb(nid, colId, order, "CAR", 255, 144, 40); }
  else if (k == 4) { uiTextRgb(nid, colId, order, "CONE", 255, 208, 48); }
}

function playerColumn(colId: i32, order: i32, idx: i32): void {
  uiNode(colId, 1, 1, order);
  uiPropEnum(21, 1); // flex-direction: column
  const hitsLabel: string = "HITS " + HITS[idx];
  if (FLASH[idx] > 0) { uiTextRgb(colId + 1, colId, 0, hitsLabel, 255, 48, 48); }
  else { uiTextRgb(colId + 1, colId, 0, hitsLabel, 255, 255, 255); }
  hitTypeLine(colId, 1, idx);
  gripLine(colId, 3, idx);
}

function hudSignature(): i32 {
  let s: i32 = 17;
  s = s * 31 + HITS[0];
  s = s * 31 + LAST_HIT[0];
  s = s * 31 + idiv(GRIP[0], 10);
  s = s * 31 + FLASH[0];
  s = s * 31 + HITS[1];
  s = s * 31 + LAST_HIT[1];
  s = s * 31 + idiv(GRIP[1], 10);
  s = s * 31 + FLASH[1];
  return s | 0;
}

function uiRefresh(): void {
  const sig: i32 = hudSignature();
  if (sig != UI_LAST_SIG) {
    UI_LAST_SIG = sig;
    UI_REV = UI_REV + 1;
    uiReset();
    uiNode(1, 0, 1, 0);
    uiPropEnum(21, 0); // root: row
    playerColumn(10, 0, 0);
    playerColumn(20, 1, 1);
    uiFinish(UI_REV);
  }
}

export function init(): void {
  abiWrite(OFF_MAGIC, RGW1_MAGIC);
  abiWrite(OFF_VERSION, 1);
  abiWrite(OFF_SIZE, ABI_SIZE);
  abiWrite(OFF_BODY_COUNT, 17);
  abiWrite(OFF_SCORE, 0);
  abiWrite(OFF_HITS, 0);
  SOMEONE_WON = 0;
  UI_REV = 0;
  UI_LAST_SIG = -1;
  GRIP[0] = 0; GRIP[1] = 0;
  HITS[0] = 0; HITS[1] = 0;
  LAST_HIT[0] = 0; LAST_HIT[1] = 0;
  FLASH[0] = 0; FLASH[1] = 0;

  const spawnY: i32 = (6000 - 140) * FP;
  roadAt(spawnY);
  const sx: i32 = RCX;
  writeBodyPos(0, sx - 28 * FP, spawnY);
  writeBodyPos(1, sx + 28 * FP, spawnY);
  let ti: i32 = 0;
  while (ti < 15) {
    const yFp: i32 = TR_Y[ti] * FP;
    writeBodyPos(2 + ti, cxLane(yFp, TR_LANE[ti]), yFp);
    ti = ti + 1;
  }
}

export function update(): void {
  processContacts();
  const dt: i32 = abiRead(OFF_DT);
  const flags: i32 = abiRead(OFF_INPUT);
  const flagsP2: i32 = abiRead(OFF_INPUT_P2);
  const now: i32 = abiRead(OFF_TIME);
  drivePlayer(0, flags);
  drivePlayer(1, flagsP2);
  let ti: i32 = 0;
  while (ti < 15) {
    trafficControl(2 + ti, ti, now);
    ti = ti + 1;
  }
  FLASH[0] = decayTimer(FLASH[0], dt);
  FLASH[1] = decayTimer(FLASH[1], dt);
  abiWrite(OFF_CAMERA_Y, bodyY(0) - 120 * FP);
  checkWin();
  uiRefresh();
}

export function declare_resources(): void {
  hostSheet("p1", "assets/car1.png", 471, 909, 4, 454, 10);
  hostSheet("p2", "assets/car2.png", 471, 908, 4, 454, 10);
  hostSheet("trafficCar", "assets/othercar.png", 285, 625, 7, 312, 10);
  hostSheet("cone", "assets/cone.png", 204, 275, 9, 252, 10);
  hostSheet("oil", "assets/oil.png", 891, 706, 9, 353, 0);
  hostRect("bar", 8, 46, 210, 215, 225, 5);
}
