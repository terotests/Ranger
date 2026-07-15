// node_host.mjs — a headless host for the Ranger autopeli WASM guest.
//
// The engine's WasmPhysicsRunner needs SDL (rendering/audio) to build, so it
// can't run in a headless CI container. This harness implements the SAME RGW1
// per-frame protocol (write poses/dt/input/contacts -> call update() -> read
// controls/impulses/events -> step physics) against V8's WebAssembly — the very
// API the browser uses — so it exercises the guest end-to-end exactly as the
// real host would. It is a test harness, not the game engine's physics.
//
//   node gallery/game_engine/games/ranger_autopeli/src/node_host.mjs
import fs from "fs";

const FP = 256;
const WASM = new URL("../logic.wasm", import.meta.url);
const inst = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(WASM)));
const x = inst.exports;
const mem = new DataView(x.memory.buffer);
const base = x.abi_base();
const R = (o) => mem.getInt32(base + o, true);
const W = (o, v) => mem.setInt32(base + o, v | 0, true);

// RGW1 offsets (in-block)
const OFF = { DT: 12, TIME: 16, INPUT: 20, INPUT_P2: 24, BODY_COUNT: 28,
  IMPULSE_CNT: 32, CONTACT_CNT: 36, SCORE: 40, HITS: 44, CAMERA_Y: 48, EVENT_CNT: 52 };
const bodyOff = (i, f) => 64 + i * 24 + f;      // x,y,angle,speed,angVel,flags @ 0,4,8,12,16,20
const ctrlOff = (i, c) => 832 + i * 16 + c * 4; // steer,throttle,brake,grip
const impOff  = (k, f) => 1344 + k * 16 + f;    // body,ix,iy,ang
const conOff  = (i, f) => 1600 + i * 32 + f;    // bodyA,bodyB,phase,imp,x,y,nx,ny
const evtOff  = (k, f) => 2048 + k * 20 + f;    // kind,sub,a,b,c

// ---- host-side world: 17 car bodies + two side walls -------------------------
const W_ROAD = 480, LEFT = 40 * FP, RIGHT = 440 * FP;
const bodies = [];
for (let i = 0; i < 17; i++) bodies.push({ x: 240 * FP, y: 3000 * FP, ang: 0, spd: 0 });
bodies[0].x = 220 * FP; bodies[0].y = 5860 * FP;
bodies[1].x = 260 * FP; bodies[1].y = 5860 * FP;
for (let i = 2; i < 17; i++) bodies[i].y = (5500 - (i - 2) * 350) * FP;

x.init();
console.log("magic ok:", R(0) === 827803474, " body_count:", R(OFF.BODY_COUNT));

let pendingContacts = [];
let maxHits = 0, sounds = 0, lastCam = 0;
const traj = [];

for (let frame = 0; frame < 400; frame++) {
  // 1. host writes authoritative body poses into the block
  for (let i = 0; i < 17; i++) {
    W(bodyOff(i, 0), bodies[i].x); W(bodyOff(i, 4), bodies[i].y);
    W(bodyOff(i, 8), bodies[i].ang); W(bodyOff(i, 12), bodies[i].spd);
    W(bodyOff(i, 16), 0); W(bodyOff(i, 20), 1);
  }
  // 2. frame inputs — press UP (throttle) + RIGHT (steer), like the SDL demo
  W(OFF.DT, 16); W(OFF.TIME, frame * 16); W(OFF.INPUT, 1 | 8); W(OFF.INPUT_P2, 1 | 4);
  // 3. contacts from previous step
  W(OFF.CONTACT_CNT, pendingContacts.length);
  pendingContacts.forEach((c, i) => {
    W(conOff(i, 0), c.a); W(conOff(i, 4), c.b); W(conOff(i, 8), 1);
    W(conOff(i, 12), c.imp); W(conOff(i, 16), c.x); W(conOff(i, 20), c.y);
    W(conOff(i, 24), c.nx); W(conOff(i, 28), c.ny);
  });
  // 4. run the guest
  x.update();
  // 5. drain events
  const nev = R(OFF.EVENT_CNT);
  for (let k = 0; k < nev; k++) if (R(evtOff(k, 0)) === 1) sounds++;
  // 6+7. read controls, apply a simple top-down physics step
  pendingContacts = [];
  for (let i = 0; i < 17; i++) {
    const steer = R(ctrlOff(i, 0)), throttle = R(ctrlOff(i, 1)), brake = R(ctrlOff(i, 2));
    let b = bodies[i];
    b.ang += Math.round(steer * 16 * 3 / 1000);       // steer -> heading (milli-deg)
    b.spd += Math.round(throttle * 16 * 6 / 1000);    // throttle -> accelerate (fp/frame)
    b.spd -= Math.round(brake * 16 * 8 / 1000);
    b.spd -= Math.round(b.spd * 4 / 100);             // drag
    if (b.spd < 0) b.spd = 0;
    const rad = (b.ang / 1000) * Math.PI / 180;
    b.x += Math.round(Math.sin(rad) * b.spd);         // integrate (all fp)
    b.y -= Math.round(Math.cos(rad) * b.spd);
    // wall collisions -> contacts for next frame
    if (b.x < LEFT)  { b.x = LEFT;  if (i < 2) pendingContacts.push({ a: i, b: 1000, imp: 40 * FP, x: b.x, y: b.y, nx: 1000, ny: 0 }); }
    if (b.x > RIGHT) { b.x = RIGHT; if (i < 2) pendingContacts.push({ a: i, b: 1001, imp: 40 * FP, x: b.x, y: b.y, nx: -1000, ny: 0 }); }
  }
  // car-vs-car: p1 near a traffic body -> contact
  for (let t = 2; t < 17; t++) {
    const dx = (bodies[0].x - bodies[t].x) / FP, dy = (bodies[0].y - bodies[t].y) / FP;
    if (dx * dx + dy * dy < 24 * 24) { pendingContacts.push({ a: 0, b: t, imp: 60 * FP, x: bodies[0].x, y: bodies[0].y, nx: 0, ny: 1000 }); }
  }
  maxHits = R(OFF.HITS); lastCam = R(OFF.CAMERA_Y);
  if (frame % 80 === 0 || frame === 399)
    traj.push(`f${frame}: p1=(${(bodies[0].x/FP)|0},${(bodies[0].y/FP)|0}) spd=${(bodies[0].spd/FP)|0} hits=${maxHits} sounds=${sounds}`);
}

console.log(traj.join("\n"));
const y0 = 5860, y1 = (bodies[0].y / FP) | 0;
console.log(`\np1 moved: ${y1 !== y0} (y ${y0} -> ${y1})`);
console.log(`hits: ${maxHits}  sounds emitted: ${sounds}  camera_y: ${(lastCam/FP)|0}`);
console.log((y1 !== y0 && maxHits > 0) ? "RANGER-AUTOPELI-HOST: PASS" : "RANGER-AUTOPELI-HOST: FAIL");
