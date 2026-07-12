// AssemblyScript autopeli guest (Path C) — the same shared-memory RGW1/RGU1 ABI
// the Rust guest uses, driven by TypeScript-style game code. This is the "how
// close can the .tsx go" experiment: the gameplay reads like the original .tsx
// (typed globals, `flags & IN_LEFT`, the isPlayer(bodyA/bodyB) contact loop,
// `"HITS " + hits.toString()` HUD labels) yet compiles straight to WASM via asc.
//
// Scope: this port covers the core loop that makes the game playable + the HUD
// (input -> player controls, traffic AI, contacts -> per-player hits, RGU1 HUD).
// It intentionally omits the polish the Rust guest also has (oil spin, ramps/
// air, cone-launch impulses, collision sounds/rumble) — those are mechanical
// follow-ons, not needed to demonstrate the AS bridge.

import {
  FP, STEER_SCALE, ABI, abiPtr, rd, wr,
  ABI_MAGIC, ABI_VERSION, ABI_SIZE,
  OFF_MAGIC, OFF_VERSION, OFF_SIZE, OFF_DT, OFF_TIME, OFF_INPUT, OFF_INPUT_P2,
  OFF_BODY_COUNT, OFF_IMPULSE_CNT, OFF_CONTACT_CNT, OFF_EVENT_CNT,
  OFF_SCORE, OFF_HITS, OFF_CAMERA_Y, OFF_AIR_P1, OFF_AIR_P2,
  BODY_P1, BODY_P2, TRAFFIC_START, TRAFFIC_COUNT, BODY_COUNT,
  IN_UP, IN_DOWN, IN_LEFT, IN_RIGHT,
  bodyX, bodyY, writeBodyPos, writeControl,
  contactCount, contactBodyA, contactBodyB, contactPhase,
  isPlayer, isWall, isCone, isBar, isTraffic, clampI, decayTimer,
} from "./abi";
import { PlayerHud, buildHud, UI_SIZE, uiPtr } from "./ui";

// ---- host imports (module "env"), as the .wasm bridge provides ----
@external("env", "rg_host_register_sheet")
declare function rg_host_register_sheet(
  idPtr: i32, idLen: i32, pathPtr: i32, pathLen: i32,
  fw: i32, fh: i32, scale: i32, feet: i32, drawLayer: i32
): void;
@external("env", "rg_host_register_rect")
declare function rg_host_register_rect(
  idPtr: i32, idLen: i32, w: i32, h: i32, r: i32, g: i32, b: i32, drawLayer: i32
): void;

const FINISH_Y: i32 = 140;
const WIN_SCORE: i32 = 5000;
const HIT_FLASH_MS: i32 = 260;

// ---- level data (parallel arrays, same numbers as the Rust guest) ----
const ROAD_Y: StaticArray<i32> = [6000, 5600, 5200, 4800, 4400, 4000, 3600, 3200, 2800, 2400, 2000, 1600, 1200, 800, 400, 100];
const ROAD_X: StaticArray<i32> = [240, 220, 200, 250, 300, 255, 210, 250, 310, 250, 170, 220, 290, 250, 210, 240];
const ROAD_H: StaticArray<i32> = [126, 104, 78, 96, 114, 94, 108, 94, 110, 92, 98, 90, 104, 88, 74, 112];

const TR_Y: StaticArray<i32> = [5520, 5260, 4930, 4590, 4270, 3950, 3610, 3280, 2940, 2570, 2190, 1810, 1420, 1040, 650];
const TR_LANE: StaticArray<i32> = [-580, 500, -180, 620, -580, 200, -620, 580, -100, 620, -580, 260, -620, 580, -200];
const TR_THR: StaticArray<i32> = [450, 390, 490, 420, 520, 370, 470, 430, 540, 400, 500, 380, 460, 510, 420];
const TR_WEAVE: StaticArray<i32> = [4, 7, 3, 5, 4, 8, 4, 6, 3, 7, 5, 8, 4, 5, 7];
const TR_WSPD: StaticArray<i32> = [1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1];
const TR_PHASE: StaticArray<i32> = [200, 1400, 2200, 3100, 4500, 800, 5400, 2700, 1900, 3800, 5900, 4100, 500, 2900, 5100];

// ---- module state (would be the reducer state in the .tsx) ----
let SOMEONE_WON: bool = false;
let GRIP_P1: i32 = 0;
let GRIP_P2: i32 = 0;
let HITS_P1: i32 = 0;
let HITS_P2: i32 = 0;
let LAST_HIT_P1: i32 = 0;
let LAST_HIT_P2: i32 = 0;
let FLASH_P1: i32 = 0;
let FLASH_P2: i32 = 0;

let UI_REV: u32 = 0;
let UI_LAST_SIG: i32 = -1;

// road_at returns two values; AS has no tuples, so it fills these.
let RCX: i32 = 0;
let RHALF: i32 = 0;

function roadAt(yFp: i32): void {
  const y = yFp / FP;
  if (y >= ROAD_Y[0]) { RCX = ROAD_X[0] * FP; RHALF = ROAD_H[0] * FP; return; }
  if (y <= ROAD_Y[15]) { RCX = ROAD_X[15] * FP; RHALF = ROAD_H[15] * FP; return; }
  let i = (ROAD_Y[0] - y) / 400;
  if (i > 14) i = 14;
  const ay = ROAD_Y[i], ax = ROAD_X[i], ah = ROAD_H[i];
  const by = ROAD_Y[i + 1], bx = ROAD_X[i + 1], bh = ROAD_H[i + 1];
  const span = ay - by;
  let t: i32 = 0;
  if (span > 0) t = ((ay - y) * FP) / span;
  RCX = ax * FP + (bx * FP - ax * FP) * t / FP;
  RHALF = ah * FP + (bh * FP - ah * FP) * t / FP;
}

function cxLane(yFp: i32, laneMilli: i32): i32 {
  roadAt(yFp);
  const usable = RHALF - 22 * FP;
  return RCX + usable * clampI(laneMilli, -1000, 1000) / 1000;
}

function roadGripMilli(xFp: i32, yFp: i32): i32 {
  roadAt(yFp);
  const edge = RHALF - 16 * FP;
  const off = xFp - RCX;
  let grip = 1000;
  if (off < 0) {
    if (-off > edge) grip = 450;
  } else if (off > edge) {
    grip = 450;
  }
  return grip;
}

function surfaceGrip(idx: i32, xFp: i32, yFp: i32): i32 {
  return roadGripMilli(xFp, yFp);
}

// coarse polynomial sine * 1000 (matches the Rust guest's sin_milli exactly)
function sinMilli(phaseMilli: i64): i32 {
  const x = <f64>(phaseMilli % 6283) / 1000.0;
  const x2 = x * x;
  const x3 = x2 * x;
  const x5 = x3 * x2;
  return <i32>(x - x3 / 6.0 + x5 / 120.0) * 1000;
}

function drivePlayer(idx: i32, flags: i32): void {
  let steer = 0;
  let throttle = 0;
  let brake = 0;
  if (flags & IN_LEFT) steer = -STEER_SCALE;
  if (flags & IN_RIGHT) steer = STEER_SCALE;
  if (flags & IN_UP) throttle = STEER_SCALE;
  if (flags & IN_DOWN) brake = STEER_SCALE;
  const grip = surfaceGrip(idx, bodyX(idx), bodyY(idx));
  if (idx == BODY_P1) GRIP_P1 = grip; else GRIP_P2 = grip;
  writeControl(idx, steer, throttle, brake, grip);
}

function trafficControl(idx: i32, ti: i32, now: i32): void {
  const bx = bodyX(idx);
  const by = bodyY(idx);
  roadAt(by - 115 * FP);
  const cx = RCX, half = RHALF;
  const phase = <i64>now * <i64>TR_WSPD[ti] * 12 / 10000 + <i64>TR_PHASE[ti];
  const wave = sinMilli(phase) * TR_WEAVE[ti] / 1000;
  const targetX = cx + (half - 23 * FP) * TR_LANE[ti] / 1000 + wave * FP;
  const error = targetX - bx;
  let steer = clampI(error / 34, -STEER_SCALE, STEER_SCALE);
  roadAt(by);
  const safeL = RCX - RHALF + 16 * FP;
  const safeR = RCX + RHALF - 16 * FP;
  if (bx < safeL) steer = STEER_SCALE;
  if (bx > safeR) steer = -STEER_SCALE;
  const grip = surfaceGrip(idx, bx, by);
  writeControl(idx, steer, TR_THR[ti], 0, grip);
}

// Record a player collision for the HUD (the .tsx did this in the reducer).
function hudNoteHit(player: i32, other: i32): void {
  let kind = 0;
  if (isWall(other)) kind = 1;
  else if (isBar(other)) kind = 2;
  else if (isTraffic(other)) kind = 3;
  else if (isCone(other)) kind = 4;
  if (kind == 0) return;
  // Cone (kind 4) is a light bump: label only, no hit count / flash.
  if (player == BODY_P1) {
    LAST_HIT_P1 = kind;
    if (kind != 4) { HITS_P1 += 1; FLASH_P1 = HIT_FLASH_MS; }
  } else if (player == BODY_P2) {
    LAST_HIT_P2 = kind;
    if (kind != 4) { HITS_P2 += 1; FLASH_P2 = HIT_FLASH_MS; }
  }
}

// Direct port of the .tsx contact loop the user pointed at.
function processContacts(): void {
  const cnt = contactCount();
  let ci = 0;
  while (ci < cnt && ci < 14) {
    if (contactPhase(ci) == 1) {
      const bodyA = contactBodyA(ci);
      const bodyB = contactBodyB(ci);
      let player = -1;
      let other = -1;
      if (isPlayer(bodyA)) { player = bodyA; other = bodyB; }
      else if (isPlayer(bodyB)) { player = bodyB; other = bodyA; }
      if (player >= 0) hudNoteHit(player, other);
    }
    ci += 1;
  }
}

function checkWin(): void {
  if (SOMEONE_WON) return;
  const y1 = bodyY(BODY_P1) / FP;
  const y2 = bodyY(BODY_P2) / FP;
  if (y1 < FINISH_Y || y2 < FINISH_Y) {
    wr(OFF_SCORE, rd(OFF_SCORE) + WIN_SCORE);
    SOMEONE_WON = true;
  }
}

function makeHud(hits: i32, lastHit: i32, grip: i32, flash: bool): PlayerHud {
  const p = new PlayerHud();
  p.hits = hits;
  p.last_hit = lastHit;
  p.grip = grip;
  p.boost = false;
  p.flash = flash;
  return p;
}

function hudSignature(p1: PlayerHud, p2: PlayerHud): i32 {
  let s = 17;
  s = s * 31 + p1.hits;
  s = s * 31 + p1.last_hit;
  s = s * 31 + p1.grip / 10;
  s = s * 31 + (p1.flash ? 1 : 0);
  s = s * 31 + p2.hits;
  s = s * 31 + p2.last_hit;
  s = s * 31 + p2.grip / 10;
  s = s * 31 + (p2.flash ? 1 : 0);
  return s;
}

function uiRefresh(): void {
  const p1 = makeHud(HITS_P1, LAST_HIT_P1, GRIP_P1, FLASH_P1 > 0);
  const p2 = makeHud(HITS_P2, LAST_HIT_P2, GRIP_P2, FLASH_P2 > 0);
  const sig = hudSignature(p1, p2);
  if (sig != UI_LAST_SIG) {
    UI_LAST_SIG = sig;
    UI_REV += 1;
    buildHud(p1, p2, UI_REV);
  }
}

// ---- exports (the same surface the Rust guest exports) ----
export function abi_base(): i32 {
  return <i32>abiPtr();
}

export function init(): void {
  wr(OFF_MAGIC, ABI_MAGIC);
  wr(OFF_VERSION, ABI_VERSION);
  wr(OFF_SIZE, ABI_SIZE);
  wr(OFF_BODY_COUNT, BODY_COUNT);
  wr(OFF_IMPULSE_CNT, 0);
  wr(OFF_CONTACT_CNT, 0);
  wr(OFF_EVENT_CNT, 0);
  wr(OFF_AIR_P1, 0);
  wr(OFF_AIR_P2, 0);
  wr(OFF_SCORE, 0);
  wr(OFF_HITS, 0);

  SOMEONE_WON = false;
  GRIP_P1 = 0; GRIP_P2 = 0;
  HITS_P1 = 0; HITS_P2 = 0;
  LAST_HIT_P1 = 0; LAST_HIT_P2 = 0;
  FLASH_P1 = 0; FLASH_P2 = 0;
  UI_REV = 0; UI_LAST_SIG = -1;

  const spawnY = (6000 - 140) * FP;
  roadAt(spawnY);
  const sx = RCX;
  writeBodyPos(BODY_P1, sx - 28 * FP, spawnY);
  writeBodyPos(BODY_P2, sx + 28 * FP, spawnY);

  for (let ti = 0; ti < TRAFFIC_COUNT; ti++) {
    const idx = TRAFFIC_START + ti;
    const yFp = TR_Y[ti] * FP;
    writeBodyPos(idx, cxLane(yFp, TR_LANE[ti]), yFp);
  }
}

export function update(): void {
  processContacts();

  const dt = rd(OFF_DT);
  const flags = rd(OFF_INPUT);
  const flagsP2 = rd(OFF_INPUT_P2);
  const now = rd(OFF_TIME);

  drivePlayer(BODY_P1, flags);
  drivePlayer(BODY_P2, flagsP2);

  for (let ti = 0; ti < TRAFFIC_COUNT; ti++) {
    trafficControl(TRAFFIC_START + ti, ti, now);
  }

  FLASH_P1 = decayTimer(FLASH_P1, dt);
  FLASH_P2 = decayTimer(FLASH_P2, dt);

  wr(OFF_CAMERA_Y, bodyY(BODY_P1) - 120 * FP);
  checkWin();
  uiRefresh();
}

// ---- RGU1 UI section exports ----
export function rg_ui_ptr(): i32 {
  return <i32>uiPtr();
}
export function rg_ui_size(): i32 {
  return UI_SIZE;
}
export function rg_ui_revision(): i32 {
  return <i32>UI_REV;
}

// ---- host resource manifest (same assets as the Rust guest) ----
function hostSheet(id: string, path: string, fw: i32, fh: i32, scale: i32, feet: i32, dl: i32): void {
  const ib = String.UTF8.encode(id);
  const pb = String.UTF8.encode(path);
  rg_host_register_sheet(
    <i32>changetype<usize>(ib), ib.byteLength,
    <i32>changetype<usize>(pb), pb.byteLength,
    fw, fh, scale, feet, dl
  );
}
function hostRect(id: string, w: i32, h: i32, r: i32, g: i32, b: i32, dl: i32): void {
  const ib = String.UTF8.encode(id);
  rg_host_register_rect(<i32>changetype<usize>(ib), ib.byteLength, w, h, r, g, b, dl);
}

export function declare_resources(): void {
  hostSheet("p1", "assets/car1.png", 471, 909, 4, 454, 10);
  hostSheet("p2", "assets/car2.png", 471, 908, 4, 454, 10);
  hostSheet("trafficCar", "assets/othercar.png", 285, 625, 7, 312, 10);
  hostSheet("cone", "assets/cone.png", 204, 275, 9, 252, 10);
  hostSheet("oil", "assets/oil.png", 891, 706, 9, 353, 0);
  hostRect("bar", 8, 46, 210, 215, 225, 5);
}
