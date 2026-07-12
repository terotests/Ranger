// RGW1 shared-memory ABI bridge for AssemblyScript guests — the direct
// counterpart of the Rust guest's constants + rd/wr helpers. A fixed buffer in
// linear memory; the host reads/writes it by (abi_base() + offset). This is the
// "same WASM bridge as Rust" the AssemblyScript game code builds on.

export const FP: i32 = 256;
export const STEER_SCALE: i32 = 1000;

export const ABI_MAGIC: i32 = 0x31574752; // 'RGW1'
export const ABI_VERSION: i32 = 1;
export const ABI_SIZE: i32 = 2560;

// header field offsets
export const OFF_MAGIC: i32 = 0;
export const OFF_VERSION: i32 = 4;
export const OFF_SIZE: i32 = 8;
export const OFF_DT: i32 = 12;
export const OFF_TIME: i32 = 16;
export const OFF_INPUT: i32 = 20;
export const OFF_INPUT_P2: i32 = 24;
export const OFF_BODY_COUNT: i32 = 28;
export const OFF_IMPULSE_CNT: i32 = 32;
export const OFF_CONTACT_CNT: i32 = 36;
export const OFF_SCORE: i32 = 40;
export const OFF_HITS: i32 = 44;
export const OFF_CAMERA_Y: i32 = 48;
export const OFF_EVENT_CNT: i32 = 52;
export const OFF_AIR_P1: i32 = 56;
export const OFF_AIR_P2: i32 = 60;

export const OFF_BODIES: i32 = 64;
export const BODY_SIZE: i32 = 24;
export const OFF_CONTROLS: i32 = 832;
export const CTRL_SIZE: i32 = 16;
export const OFF_IMPULSES: i32 = 1344;
export const IMPULSE_SIZE: i32 = 16;
export const OFF_CONTACTS: i32 = 1600;
export const CONTACT_SIZE: i32 = 32;
export const MAX_CONTACTS: i32 = 14;

// body / obstacle id codes
export const ID_WALL_L: i32 = 1000;
export const ID_WALL_R: i32 = 1001;

// standard body indices
export const BODY_P1: i32 = 0;
export const BODY_P2: i32 = 1;
export const TRAFFIC_START: i32 = 2;
export const TRAFFIC_COUNT: i32 = 15;
export const BODY_COUNT: i32 = 2 + TRAFFIC_COUNT;

// input flag bits
export const IN_UP: i32 = 1;
export const IN_DOWN: i32 = 2;
export const IN_LEFT: i32 = 4;
export const IN_RIGHT: i32 = 8;

// The shared ABI block, living in this module's linear memory.
export const ABI = new StaticArray<u8>(ABI_SIZE);

export function abiPtr(): usize {
  return changetype<usize>(ABI);
}

// Little-endian 32-bit read/write at an ABI-relative offset.
export function rd(off: i32): i32 {
  return load<i32>(abiPtr() + <usize>off);
}

export function wr(off: i32, v: i32): void {
  store<i32>(abiPtr() + <usize>off, v);
}

// ---- typed accessors (mirror the Rust helpers) ----
export function bodyX(idx: i32): i32 {
  return rd(OFF_BODIES + idx * BODY_SIZE);
}
export function bodyY(idx: i32): i32 {
  return rd(OFF_BODIES + idx * BODY_SIZE + 4);
}
export function bodySpeed(idx: i32): i32 {
  return rd(OFF_BODIES + idx * BODY_SIZE + 12);
}
export function writeBodyPos(idx: i32, xFp: i32, yFp: i32): void {
  wr(OFF_BODIES + idx * BODY_SIZE, xFp);
  wr(OFF_BODIES + idx * BODY_SIZE + 4, yFp);
}
export function writeControl(idx: i32, steer: i32, throttle: i32, brake: i32, grip: i32): void {
  const base = OFF_CONTROLS + idx * CTRL_SIZE;
  wr(base, steer);
  wr(base + 4, throttle);
  wr(base + 8, brake);
  wr(base + 12, grip);
}

// ---- contact accessors ----
export function contactCount(): i32 {
  return rd(OFF_CONTACT_CNT);
}
export function contactBodyA(i: i32): i32 {
  return rd(OFF_CONTACTS + i * CONTACT_SIZE);
}
export function contactBodyB(i: i32): i32 {
  return rd(OFF_CONTACTS + i * CONTACT_SIZE + 4);
}
export function contactPhase(i: i32): i32 {
  return rd(OFF_CONTACTS + i * CONTACT_SIZE + 8);
}

// ---- classification predicates (mirror the Rust guest / the .tsx isPlayer) ----
export function isPlayer(code: i32): bool {
  return code == BODY_P1 || code == BODY_P2;
}
export function isWall(code: i32): bool {
  return code == ID_WALL_L || code == ID_WALL_R;
}
export function isCone(code: i32): bool {
  return code >= 100 && code < 200;
}
export function isBar(code: i32): bool {
  return code >= 200 && code < 300;
}
export function isTraffic(code: i32): bool {
  return code >= TRAFFIC_START && code < TRAFFIC_START + TRAFFIC_COUNT;
}

export function clampI(v: i32, lo: i32, hi: i32): i32 {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

export function decayTimer(t: i32, dt: i32): i32 {
  const next = t - dt;
  return next < 0 ? 0 : next;
}
