// AssemblyScript autopeli guest (Path C) — full feature parity with the Rust
// guest, on the same shared-memory RGW1/RGU1 ABI. TypeScript-style game code
// (typed globals + a shared buffer) compiled straight to WASM via asc.
//
// Ported 1:1 from rust_autopeli/src/lib.rs: input -> player controls, traffic
// AI, oil spin/recovery, ramp jumps + air boost, cone-launch impulses, collision
// sounds/rumble/particles, brake screech, and the per-player RGU1 HUD.

import {
  FP, STEER_SCALE, abiPtr, rd, wr,
  ABI_MAGIC, ABI_VERSION, ABI_SIZE,
  OFF_MAGIC, OFF_VERSION, OFF_SIZE, OFF_DT, OFF_TIME, OFF_INPUT, OFF_INPUT_P2,
  OFF_BODY_COUNT, OFF_IMPULSE_CNT, OFF_CONTACT_CNT, OFF_EVENT_CNT,
  OFF_SCORE, OFF_HITS, OFF_CAMERA_Y, OFF_AIR_P1, OFF_AIR_P2,
  BODY_P1, BODY_P2, TRAFFIC_START, TRAFFIC_COUNT, BODY_COUNT,
  IN_UP, IN_DOWN, IN_LEFT, IN_RIGHT,
  MAX_CONTACTS, MAX_IMPULSES, MAX_EVENTS,
  EVT_SOUND, EVT_RUMBLE, EVT_PARTICLES, SND_WALL, SND_BOUNCE, SND_WIN,
  bodyX, bodyY, bodySpeed, bodyAngMilli, bodyAngVelFp,
  writeBodyPos, writeControl, writeImpulse, writeEvent,
  contactCount, contactBodyA, contactBodyB, contactPhase,
  contactImpulse, contactX, contactY, contactNx, contactNy,
  isPlayer, isWall, isCone, isBar, isTraffic, clampI, decayTimer,
} from "./abi";
import { PlayerHud, buildHud, UI_SIZE, uiPtr } from "./ui";

// ---- host imports (module "env") ----
@external("env", "rg_host_register_sheet")
declare function rg_host_register_sheet(
  idPtr: i32, idLen: i32, pathPtr: i32, pathLen: i32,
  fw: i32, fh: i32, scale: i32, feet: i32, drawLayer: i32
): void;
@external("env", "rg_host_register_rect")
declare function rg_host_register_rect(
  idPtr: i32, idLen: i32, w: i32, h: i32, r: i32, g: i32, b: i32, drawLayer: i32
): void;

const CAR_MASS: i32 = 1200;
const CONE_MASS: i32 = 3;
const WIN_SCORE: i32 = 5000;
const FINISH_Y: i32 = 140;
const BRAKE_SCREECH_CD_MS: i32 = 900;
const BRAKE_SCREECH_MIN_SPD: i32 = 18;
const OIL_EFFECT_MS: i32 = 260;
const OIL_RECOVER_MS: i32 = 380;
const HIT_FLASH_MS: i32 = 260;

// ---- level data (parallel arrays, same numbers as the Rust guest) ----
const ROAD_Y: StaticArray<i32> = [6000, 5600, 5200, 4800, 4400, 4000, 3600, 3200, 2800, 2400, 2000, 1600, 1200, 800, 400, 100];
const ROAD_X: StaticArray<i32> = [240, 220, 200, 250, 300, 255, 210, 250, 310, 250, 170, 220, 290, 250, 210, 240];
const ROAD_H: StaticArray<i32> = [126, 104, 78, 96, 114, 94, 108, 94, 110, 92, 98, 90, 104, 88, 74, 112];

const OIL_Y: StaticArray<i32> = [5460, 5050, 4300, 3740, 3060, 2480, 1780, 1080, 560];
const OIL_LANE: StaticArray<i32> = [350, -450, 420, -280, 500, -500, 340, -350, 250];
const OIL_R: StaticArray<i32> = [34, 30, 38, 32, 36, 40, 34, 31, 28];

const RAMP_Y: StaticArray<i32> = [5350, 4720, 3500, 2640, 1160];
const RAMP_LANE: StaticArray<i32> = [50, -420, 380, -350, 320];
const RAMP_W: StaticArray<i32> = [38, 34, 40, 38, 36];
const RAMP_H: StaticArray<i32> = [22, 20, 22, 20, 20];

const TR_Y: StaticArray<i32> = [5520, 5260, 4930, 4590, 4270, 3950, 3610, 3280, 2940, 2570, 2190, 1810, 1420, 1040, 650];
const TR_LANE: StaticArray<i32> = [-580, 500, -180, 620, -580, 200, -620, 580, -100, 620, -580, 260, -620, 580, -200];
const TR_THR: StaticArray<i32> = [450, 390, 490, 420, 520, 370, 470, 430, 540, 400, 500, 380, 460, 510, 420];
const TR_WEAVE: StaticArray<i32> = [4, 7, 3, 5, 4, 8, 4, 6, 3, 7, 5, 8, 4, 5, 7];
const TR_WSPD: StaticArray<i32> = [1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1];
const TR_PHASE: StaticArray<i32> = [200, 1400, 2200, 3100, 4500, 800, 5400, 2700, 1900, 3800, 5900, 4100, 500, 2900, 5100];

// ---- module state (per-player arrays, index 0 = P1, 1 = P2) ----
let SOMEONE_WON: bool = false;
const RAMP_CD = new StaticArray<i32>(2);
const BRAKE_CD = new StaticArray<i32>(2);
const AIR = new StaticArray<i32>(2);
const OIL_CD = new StaticArray<i32>(2);
const OIL_RECOVER = new StaticArray<i32>(2);
const OIL_WAS = new StaticArray<i32>(2);
const GRIP = new StaticArray<i32>(2);
const HITS = new StaticArray<i32>(2);
const LAST_HIT = new StaticArray<i32>(2);
const FLASH = new StaticArray<i32>(2);

let IMP_CNT: i32 = 0;
let EVENT_WRITE: i32 = 0;
let UI_REV: u32 = 0;
let UI_LAST_SIG: i32 = -1;

// scratch "return values" (AS has no tuples)
let RCX: i32 = 0;
let RHALF: i32 = 0;
let VX: i32 = 0;
let VY: i32 = 0;
let CL_LX: i32 = 0;
let CL_LY: i32 = 0;
let CL_ANG: i32 = 0;
let DIN_S: i32 = 0;
let DIN_T: i32 = 0;
let DIN_B: i32 = 0;

// ---- road geometry ----
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

function laneX(y: i32, laneMilli: i32, margin: i32): i32 {
  roadAt(y * FP);
  const usable = RHALF - margin * FP;
  return RCX + usable * clampI(laneMilli, -1000, 1000) / 1000;
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

function onOil(xFp: i32, yFp: i32): bool {
  const y = yFp / FP;
  for (let i = 0; i < 9; i++) {
    const px = laneX(OIL_Y[i], OIL_LANE[i], 18);
    const dx = <f64>(xFp - px) / <f64>FP;
    const dy = <f64>(y - OIL_Y[i]);
    if (dx * dx + dy * dy < <f64>(OIL_R[i] * OIL_R[i])) return true;
  }
  return false;
}

function surfaceGrip(idx: i32, xFp: i32, yFp: i32): i32 {
  const grip = roadGripMilli(xFp, yFp);
  if (idx > BODY_P2 && onOil(xFp, yFp) && grip > 500) return 500;
  return grip;
}

function hitRamp(xFp: i32, yFp: i32): bool {
  const y = yFp / FP;
  for (let i = 0; i < 5; i++) {
    const rx = laneX(RAMP_Y[i], RAMP_LANE[i], 24);
    const hw = (RAMP_W[i] * FP) / 2;
    if (xFp >= rx - hw && xFp <= rx + hw && y >= RAMP_Y[i] && y <= RAMP_Y[i] + RAMP_H[i]) {
      return true;
    }
  }
  return false;
}

// ---- coarse polynomial trig (matches the Rust guest exactly) ----
function sinF(x: f64): f64 {
  const x2 = x * x;
  const x3 = x2 * x;
  const x5 = x3 * x2;
  return x - x3 / 6.0 + x5 / 120.0;
}
function sinMilli(phaseMilli: i64): i32 {
  const x = <f64>(phaseMilli % 6283) / 1000.0;
  const x2 = x * x;
  const x3 = x2 * x;
  const x5 = x3 * x2;
  return <i32>(x - x3 / 6.0 + x5 / 120.0) * 1000;
}

function bodyVxVy(idx: i32): void {
  const angDeg = <f64>bodyAngMilli(idx) / 1000.0;
  const rad = angDeg * Math.PI / 180.0;
  const speed = <f64>bodySpeed(idx) / <f64>FP;
  VX = <i32>(Math.sin(rad) * speed * <f64>FP);
  VY = <i32>(-Math.cos(rad) * speed * <f64>FP);
}

// ---- events / impulses ----
function pushEvent(kind: i32, sub: i32, a: i32, b: i32, c: i32): void {
  if (EVENT_WRITE >= MAX_EVENTS) return;
  writeEvent(EVENT_WRITE, kind, sub, a, b, c);
  EVENT_WRITE += 1;
}
function pushSound(id: i32): void { pushEvent(EVT_SOUND, id, 0, 0, 0); }
function pushRumble(pad: i32, ms: i32, strength: i32): void { pushEvent(EVT_RUMBLE, pad, strength, strength, ms); }
function pushParticles(xFp: i32, yFp: i32, amount: i32): void { pushEvent(EVT_PARTICLES, 0, xFp, yFp, amount); }

function appendImpulse(body: i32, lxFp: i32, lyFp: i32, angFp: i32): void {
  if (IMP_CNT >= MAX_IMPULSES) return;
  writeImpulse(IMP_CNT, body, lxFp, lyFp, angFp);
  IMP_CNT += 1;
}

function coneLaunchImpulse(player: i32, bodyB: i32, nxM: i32, nyM: i32): void {
  let nx = nxM;
  let ny = nyM;
  if (bodyB == player) { nx = -nx; ny = -ny; }
  const nxF = <f64>nx / 1000.0;
  const nyF = <f64>ny / 1000.0;
  bodyVxVy(player);
  const cvxF = <f64>VX / <f64>FP;
  const cvyF = <f64>VY / <f64>FP;
  const share = <f64>CAR_MASS / <f64>(CAR_MASS + CONE_MASS);
  const lvxF = cvxF * share * 0.25 + nxF * 25.0;
  const lvyF = cvyF * share * 0.25 + nyF * 25.0;
  const angF = nxF * 200.0 + nyF * 90.0;
  CL_LX = <i32>(lvxF * <f64>FP);
  CL_LY = <i32>(lvyF * <f64>FP);
  CL_ANG = <i32>(angF * <f64>FP);
}

// ---- oil + spin ----
function oilEntrySpin(idx: i32, steer: i32, now: i32): i32 {
  let spdF = <f64>bodySpeed(idx) / <f64>FP;
  if (spdF < 40.0) spdF = 40.0;
  const x = <f64>bodyX(idx) / <f64>FP;
  const y = <f64>bodyY(idx) / <f64>FP;
  const phase = <f64>now * 0.012 + x * 0.06 + y * 0.04;
  const sign = sinF(phase) >= 0.0 ? 1.0 : -1.0;
  const wobble = sinF(phase) * spdF * 0.08;
  const steerSpin = (<f64>steer / <f64>STEER_SCALE) * spdF * 0.12;
  return <i32>((wobble + steerSpin + sign * 22.0) * <f64>FP);
}

function spinStabilizer(idx: i32, oilRecover: bool): i32 {
  const av = <f64>bodyAngVelFp(idx) / <f64>FP;
  let abs = av;
  if (abs < 0.0) abs = -abs;
  let start = 200.0, full = 420.0, base = 0.10, span = 0.20;
  if (oilRecover) { start = 35.0; full = 180.0; base = 0.28; span = 0.42; }
  if (abs < start) return 0;
  let t = (abs - start) / (full - start);
  if (t < 0.0) t = 0.0;
  if (t > 1.0) t = 1.0;
  const strength = base + t * span;
  return <i32>(-av * strength * <f64>FP);
}

function oilTickEntry(idx: i32): void {
  const on = onOil(bodyX(idx), bodyY(idx));
  if (on && OIL_WAS[idx] == 0) {
    OIL_CD[idx] = OIL_EFFECT_MS;
    OIL_RECOVER[idx] = OIL_RECOVER_MS;
  }
}

// ---- audio / rumble feedback ----
function collisionRumble(player: i32, impFp: i32, kind: i32): void {
  const imp = <f64>impFp / <f64>FP;
  if (imp < 22.0) return;
  const pad = player == BODY_P2 ? 1 : 0;
  let ms = 0;
  let strength = 0;
  if (kind == 1) {
    ms = 38;
    strength = 6500 + clampI(<i32>(imp * 40.0), 0, 9000);
  } else if (kind == 2) {
    ms = 55 + clampI(<i32>(imp * 0.35), 0, 100);
    strength = 12000 + clampI(<i32>(imp * 70.0), 0, 18000);
  } else {
    ms = 60 + clampI(<i32>(imp * 0.45), 0, 130);
    strength = 14000 + clampI(<i32>(imp * 90.0), 0, 24000);
  }
  pushRumble(pad, ms, strength);
}

function pushCollisionFeedback(player: i32, other: i32, impFp: i32): void {
  if (isWall(other) || isBar(other) || isTraffic(other)) {
    const imp = <f64>impFp / <f64>FP;
    if (imp >= 18.0) pushSound(SND_WALL);
    const kind = isTraffic(other) ? 2 : 0;
    collisionRumble(player, impFp, kind);
    return;
  }
  if (isCone(other)) {
    pushSound(SND_BOUNCE);
    collisionRumble(player, impFp, 1);
  }
}

function tickBrakeAudio(idx: i32, brake: i32, dt: i32): void {
  BRAKE_CD[idx] = decayTimer(BRAKE_CD[idx], dt);
  if (brake <= 0 || BRAKE_CD[idx] > 0) return;
  const spd = bodySpeed(idx);
  if (spd / FP >= BRAKE_SCREECH_MIN_SPD) {
    pushSound(SND_BOUNCE);
    BRAKE_CD[idx] = BRAKE_SCREECH_CD_MS;
  }
}

// ---- control + AI ----
function driveFromInput(flags: i32): void {
  DIN_S = 0; DIN_T = 0; DIN_B = 0;
  if (flags & IN_LEFT) DIN_S = -STEER_SCALE;
  if (flags & IN_RIGHT) DIN_S = STEER_SCALE;
  if (flags & IN_UP) DIN_T = STEER_SCALE;
  if (flags & IN_DOWN) DIN_B = STEER_SCALE;
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

function applyPlayerExtras(idx: i32, steer: i32, now: i32, dt: i32): void {
  const x = bodyX(idx);
  const y = bodyY(idx);
  const on = onOil(x, y);
  if (on && OIL_WAS[idx] == 0) {
    pushSound(SND_BOUNCE);
    const burst = oilEntrySpin(idx, steer, now);
    if (burst != 0) appendImpulse(idx, 0, 0, burst);
  }
  OIL_WAS[idx] = on ? 1 : 0;
  if (OIL_CD[idx] > 0) OIL_CD[idx] = decayTimer(OIL_CD[idx], dt);
  if (OIL_RECOVER[idx] > 0) OIL_RECOVER[idx] = decayTimer(OIL_RECOVER[idx], dt);
  const recover = OIL_RECOVER[idx] > 0;
  const damp = spinStabilizer(idx, recover);
  if (damp != 0) appendImpulse(idx, 0, 0, damp);
  if (RAMP_CD[idx] <= 0 && hitRamp(x, y)) {
    appendImpulse(idx, 0, -95 * FP, 320 * FP);
    RAMP_CD[idx] = 700;
    AIR[idx] = 900;
    const pad = idx == BODY_P2 ? 1 : 0;
    pushSound(SND_BOUNCE);
    pushRumble(pad, 70, 12000);
  }
}

// ---- contacts -> HUD + gameplay (the .tsx contact loop) ----
function hudNoteHit(player: i32, other: i32): void {
  let kind = 0;
  if (isWall(other)) kind = 1;
  else if (isBar(other)) kind = 2;
  else if (isTraffic(other)) kind = 3;
  else if (isCone(other)) kind = 4;
  if (kind == 0) return;
  LAST_HIT[player] = kind;
  if (kind != 4) {
    HITS[player] += 1;
    FLASH[player] = HIT_FLASH_MS;
  }
}

function processContacts(): void {
  const cnt = contactCount();
  let hits = rd(OFF_HITS);
  IMP_CNT = 0;
  let ci = 0;
  while (ci < cnt && ci < MAX_CONTACTS) {
    const phase = contactPhase(ci);
    const bodyA = contactBodyA(ci);
    const bodyB = contactBodyB(ci);
    const impFp = contactImpulse(ci);
    const xFp = contactX(ci);
    const yFp = contactY(ci);
    if (phase == 1) {
      let player = -1;
      let other = -1;
      if (isPlayer(bodyA)) { player = bodyA; other = bodyB; }
      else if (isPlayer(bodyB)) { player = bodyB; other = bodyA; }
      if (player >= 0) {
        hudNoteHit(player, other);
        if (isWall(other) || isBar(other) || isTraffic(other)) {
          hits += 1;
          const imp = <f64>impFp / <f64>FP;
          if (isWall(other) && imp > 80.0) pushParticles(xFp, yFp, 6);
          if (isBar(other) && imp > 45.0) pushParticles(xFp, yFp, 6);
          if (isTraffic(other) && imp > 55.0) pushParticles(xFp, yFp, 5);
        }
        if (isCone(other)) {
          coneLaunchImpulse(player, bodyB, contactNx(ci), contactNy(ci));
          appendImpulse(other, CL_LX, CL_LY, CL_ANG);
        }
        pushCollisionFeedback(player, other, impFp);
      }
    }
    ci += 1;
  }
  wr(OFF_HITS, hits);
  wr(OFF_IMPULSE_CNT, IMP_CNT);
}

function checkWin(): void {
  if (SOMEONE_WON) return;
  const y1 = bodyY(BODY_P1) / FP;
  const y2 = bodyY(BODY_P2) / FP;
  if (y1 < FINISH_Y || y2 < FINISH_Y) {
    wr(OFF_SCORE, rd(OFF_SCORE) + WIN_SCORE);
    pushSound(SND_WIN);
    SOMEONE_WON = true;
  }
}

// ---- HUD ----
function makeHud(hits: i32, lastHit: i32, grip: i32, boost: bool, flash: bool): PlayerHud {
  const p = new PlayerHud();
  p.hits = hits;
  p.last_hit = lastHit;
  p.grip = grip;
  p.boost = boost;
  p.flash = flash;
  return p;
}

function hudSignature(p1: PlayerHud, p2: PlayerHud): i32 {
  let s = 17;
  s = s * 31 + p1.hits;
  s = s * 31 + p1.last_hit;
  s = s * 31 + p1.grip / 10;
  s = s * 31 + (p1.boost ? 1 : 0);
  s = s * 31 + (p1.flash ? 1 : 0);
  s = s * 31 + p2.hits;
  s = s * 31 + p2.last_hit;
  s = s * 31 + p2.grip / 10;
  s = s * 31 + (p2.boost ? 1 : 0);
  s = s * 31 + (p2.flash ? 1 : 0);
  return s;
}

function uiRefresh(): void {
  const p1 = makeHud(HITS[0], LAST_HIT[0], GRIP[0], AIR[0] > 0, FLASH[0] > 0);
  const p2 = makeHud(HITS[1], LAST_HIT[1], GRIP[1], AIR[1] > 0, FLASH[1] > 0);
  const sig = hudSignature(p1, p2);
  if (sig != UI_LAST_SIG) {
    UI_LAST_SIG = sig;
    UI_REV += 1;
    buildHud(p1, p2, UI_REV);
  }
}

// ---- exports (same surface as the Rust guest) ----
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
  EVENT_WRITE = 0;
  IMP_CNT = 0;
  UI_REV = 0;
  UI_LAST_SIG = -1;
  for (let i = 0; i < 2; i++) {
    RAMP_CD[i] = 0; BRAKE_CD[i] = 0; AIR[i] = 0;
    OIL_CD[i] = 0; OIL_RECOVER[i] = 0; OIL_WAS[i] = 0;
    GRIP[i] = 0; HITS[i] = 0; LAST_HIT[i] = 0; FLASH[i] = 0;
  }

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
  EVENT_WRITE = 0;
  processContacts();

  const dt = rd(OFF_DT);
  const flags = rd(OFF_INPUT);
  const flagsP2 = rd(OFF_INPUT_P2);
  const now = rd(OFF_TIME);

  driveFromInput(flags);
  const pSteer = DIN_S, pTh = DIN_T, pBr = DIN_B;
  driveFromInput(flagsP2);
  const p2Steer = DIN_S, p2Th = DIN_T, p2Br = DIN_B;

  oilTickEntry(BODY_P1);
  oilTickEntry(BODY_P2);

  const p1Grip = surfaceGrip(BODY_P1, bodyX(BODY_P1), bodyY(BODY_P1));
  const p2Grip = surfaceGrip(BODY_P2, bodyX(BODY_P2), bodyY(BODY_P2));
  GRIP[0] = p1Grip;
  GRIP[1] = p2Grip;
  writeControl(BODY_P1, pSteer, pTh, pBr, p1Grip);
  writeControl(BODY_P2, p2Steer, p2Th, p2Br, p2Grip);

  for (let ti = 0; ti < TRAFFIC_COUNT; ti++) {
    trafficControl(TRAFFIC_START + ti, ti, now);
  }

  tickBrakeAudio(BODY_P1, pBr, dt);
  tickBrakeAudio(BODY_P2, p2Br, dt);
  RAMP_CD[0] = decayTimer(RAMP_CD[0], dt);
  RAMP_CD[1] = decayTimer(RAMP_CD[1], dt);
  AIR[0] = decayTimer(AIR[0], dt);
  AIR[1] = decayTimer(AIR[1], dt);
  FLASH[0] = decayTimer(FLASH[0], dt);
  FLASH[1] = decayTimer(FLASH[1], dt);

  // IMP_CNT currently holds the cone impulses from processContacts; extras
  // continue appending from there.
  applyPlayerExtras(BODY_P1, pSteer, now, dt);
  applyPlayerExtras(BODY_P2, p2Steer, now, dt);
  wr(OFF_AIR_P1, AIR[0]);
  wr(OFF_AIR_P2, AIR[1]);
  wr(OFF_IMPULSE_CNT, IMP_CNT);

  wr(OFF_CAMERA_Y, bodyY(BODY_P1) - 120 * FP);
  checkWin();
  wr(OFF_EVENT_CNT, EVENT_WRITE);
  uiRefresh();
}

// ---- RGU1 UI section exports ----
export function rg_ui_ptr(): i32 { return <i32>uiPtr(); }
export function rg_ui_size(): i32 { return UI_SIZE; }
export function rg_ui_revision(): i32 { return <i32>UI_REV; }

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
