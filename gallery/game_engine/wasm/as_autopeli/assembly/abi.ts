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
export const MAX_IMPULSES: i32 = 16;
export const OFF_EVENTS: i32 = 2048;
export const EVENT_SIZE: i32 = 20;
export const MAX_EVENTS: i32 = 12;

// event kinds / sound ids
export const EVT_SOUND: i32 = 1;
export const EVT_RUMBLE: i32 = 2;
export const EVT_PARTICLES: i32 = 3;
export const SND_WALL: i32 = 1;
export const SND_BOUNCE: i32 = 2;
export const SND_WIN: i32 = 3;

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
export function bodyAngMilli(idx: i32): i32 {
  return rd(OFF_BODIES + idx * BODY_SIZE + 8);
}
export function bodyAngVelFp(idx: i32): i32 {
  return rd(OFF_BODIES + idx * BODY_SIZE + 16);
}
export function writeBodyPos(idx: i32, xFp: i32, yFp: i32): void {
  wr(OFF_BODIES + idx * BODY_SIZE, xFp);
  wr(OFF_BODIES + idx * BODY_SIZE + 4, yFp);
}
export function writeImpulse(slot: i32, body: i32, lxFp: i32, lyFp: i32, angFp: i32): void {
  const base = OFF_IMPULSES + slot * IMPULSE_SIZE;
  wr(base, body);
  wr(base + 4, lxFp);
  wr(base + 8, lyFp);
  wr(base + 12, angFp);
}
export function writeEvent(slot: i32, kind: i32, sub: i32, a: i32, b: i32, c: i32): void {
  const base = OFF_EVENTS + slot * EVENT_SIZE;
  wr(base, kind);
  wr(base + 4, sub);
  wr(base + 8, a);
  wr(base + 12, b);
  wr(base + 16, c);
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
export function contactImpulse(i: i32): i32 {
  return rd(OFF_CONTACTS + i * CONTACT_SIZE + 12);
}
export function contactX(i: i32): i32 {
  return rd(OFF_CONTACTS + i * CONTACT_SIZE + 16);
}
export function contactY(i: i32): i32 {
  return rd(OFF_CONTACTS + i * CONTACT_SIZE + 20);
}
export function contactNx(i: i32): i32 {
  return rd(OFF_CONTACTS + i * CONTACT_SIZE + 24);
}
export function contactNy(i: i32): i32 {
  return rd(OFF_CONTACTS + i * CONTACT_SIZE + 28);
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

// ============================================================================
// Object model — the "common header" game code builds on.
//
// Everything above is the raw bridge (offsets + rd/wr + index accessors). The
// layer below wraps it so gameplay code reads in objects — `P1.x`, `road.half`,
// `c.bodyA`, `impulses.angular(...)` — instead of scratch globals, positional
// writers, and index calls. Two properties make this safe for the WASM path:
//
//   * Same emitted arithmetic. Views are thin getters/setters over rd/wr, so
//     the numbers that reach the ABI are identical to the low-level version
//     (verified byte-for-byte by tools/selfcheck.cjs / parity.cjs).
//   * Zero per-frame allocation. Every object here is a module-scope singleton;
//     result structs are mutated-and-returned, never freshly allocated in the
//     loop. That keeps `--runtime minimal` (no GC) from growing memory.
//
// The one rule the singletons impose: a value struct returned from a function
// (road/vec2/drive/coneLaunch) is shared, so copy its fields into locals before
// calling the same producer again. The game code already works this way.
// ============================================================================

// ---- small result structs (replace the old RCX/VX/CL_/DIN_ scratch globals) ----
export class Road { center: i32 = 0; half: i32 = 0; }
export class Vec2 { x: i32 = 0; y: i32 = 0; }
export class Drive { steer: i32 = 0; throttle: i32 = 0; brake: i32 = 0; }
export class ConeLaunch { lx: i32 = 0; ly: i32 = 0; ang: i32 = 0; }

// ---- header facade: named fields instead of rd(OFF_*)/wr(OFF_*) ----
export class World {
  get dt(): i32 { return rd(OFF_DT); }
  get time(): i32 { return rd(OFF_TIME); }
  get inputP1(): i32 { return rd(OFF_INPUT); }
  get inputP2(): i32 { return rd(OFF_INPUT_P2); }
  get hits(): i32 { return rd(OFF_HITS); }
  set hits(v: i32) { wr(OFF_HITS, v); }
  get score(): i32 { return rd(OFF_SCORE); }
  set score(v: i32) { wr(OFF_SCORE, v); }
  set cameraY(v: i32) { wr(OFF_CAMERA_Y, v); }
  set airP1(v: i32) { wr(OFF_AIR_P1, v); }
  set airP2(v: i32) { wr(OFF_AIR_P2, v); }

  // Stamp the RGW1 header + reset the per-frame counters (called from init()).
  initHeader(): void {
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
  }
}
export const world = new World();

// ---- body view: `b.x`, `b.speed`, `b.control(...)` instead of bodyX(idx)/writeControl(idx,...) ----
export class Body {
  idx: i32;
  constructor(idx: i32) { this.idx = idx; }
  get x(): i32 { return bodyX(this.idx); }
  get y(): i32 { return bodyY(this.idx); }
  get speed(): i32 { return bodySpeed(this.idx); }
  get angMilli(): i32 { return bodyAngMilli(this.idx); }
  get angVel(): i32 { return bodyAngVelFp(this.idx); }
  setPos(xFp: i32, yFp: i32): void { writeBodyPos(this.idx, xFp, yFp); }
  control(steer: i32, throttle: i32, brake: i32, grip: i32): void {
    writeControl(this.idx, steer, throttle, brake, grip);
  }
}
// Persistent player views + one rebindable view for the traffic loop.
export const P1 = new Body(BODY_P1);
export const P2 = new Body(BODY_P2);
const TR_VIEW = new Body(TRAFFIC_START);
export function bodyAt(idx: i32): Body { TR_VIEW.idx = idx; return TR_VIEW; }

// ---- contact view: `c.bodyA`/`c.phase`/`c.nx` instead of contactBodyA(i)/… ----
export class Contact {
  i: i32 = 0;
  get bodyA(): i32 { return contactBodyA(this.i); }
  get bodyB(): i32 { return contactBodyB(this.i); }
  get phase(): i32 { return contactPhase(this.i); }
  get impulse(): i32 { return contactImpulse(this.i); }
  get x(): i32 { return contactX(this.i); }
  get y(): i32 { return contactY(this.i); }
  get nx(): i32 { return contactNx(this.i); }
  get ny(): i32 { return contactNy(this.i); }
}
export const contact = new Contact();

// ---- impulse accumulator: hides the slot counter + OFF_IMPULSE_CNT ----
export class Impulses {
  count: i32 = 0;
  reset(): void { this.count = 0; }
  add(body: i32, lxFp: i32, lyFp: i32, angFp: i32): void {
    if (this.count >= MAX_IMPULSES) return;
    writeImpulse(this.count, body, lxFp, lyFp, angFp);
    this.count += 1;
  }
  angular(body: i32, angFp: i32): void { this.add(body, 0, 0, angFp); }
  flush(): void { wr(OFF_IMPULSE_CNT, this.count); }
}
export const impulses = new Impulses();

// ---- event accumulator: `events.sound(id)` / `.rumble()` / `.particles()` ----
export class Events {
  count: i32 = 0;
  reset(): void { this.count = 0; }
  emit(kind: i32, sub: i32, a: i32, b: i32, c: i32): void {
    if (this.count >= MAX_EVENTS) return;
    writeEvent(this.count, kind, sub, a, b, c);
    this.count += 1;
  }
  sound(id: i32): void { this.emit(EVT_SOUND, id, 0, 0, 0); }
  rumble(pad: i32, ms: i32, strength: i32): void { this.emit(EVT_RUMBLE, pad, strength, strength, ms); }
  particles(xFp: i32, yFp: i32, amount: i32): void { this.emit(EVT_PARTICLES, 0, xFp, yFp, amount); }
  flush(): void { wr(OFF_EVENT_CNT, this.count); }
}
export const events = new Events();
