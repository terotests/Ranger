// index.ts — a minimal Ranger pose game as a real wasm3 guest.
//
// This is "the actual game" running compiled to wasm (via asc) and loaded by the
// native host through wasm3 — the same shape as the shipping autopeli_wasm guest,
// but pose-driven. The host writes RGP1 (pose) into this module's linear memory
// each frame, calls update(), then reads RGW1 (world) back out to render.
//
// RGP1 layout — matches the native provider (rg_pose.h WriteRgp1) exactly:
//   present@0  gesture@4  count@8  revision@12  noseX@16  noseY@20   (all i32;
//   nose in world-unit fixed-point: world_x*256, world_y*256; view 480x270)
// RGW1 layout — matches wasm_game_abi.h:
//   bodyCount@28  score@40  body0.x@64  body0.y@68   (i32 fixed-point)
//
// Game: hero (body 0) follows the tracked head; score increments on each ARMS_UP.

const RGW1 = new StaticArray<u8>(2560);
const RGP1 = new StaticArray<u8>(128);

// @ts-ignore: decorator
@inline function w1(): usize { return changetype<usize>(RGW1); }
// @ts-ignore: decorator
@inline function p1(): usize { return changetype<usize>(RGP1); }

let score: i32 = 0;
let lastG: i32 = 0;

// ---- exports the host calls (via wasm3) ----
export function abi_base(): i32 { return <i32>w1(); }        // RGW1 base
export function rg_pose_ptr(): i32 { return <i32>p1(); }     // RGP1 base (host writes here)
export function rg_pose_size(): i32 { return 128; }
export function rg_abi_version(): i32 { return 1; }
export function rg_required_caps(): i32 { return 0x0010; }   // RG_WASM_HOST_CAP_POSE_INPUT

export function init(): void {
  store<i32>(w1() + 28, 1);            // one body: the hero
  store<i32>(w1() + 64, 240 * 256);    // hero x = world 240
  store<i32>(w1() + 68, 135 * 256);    // hero y = world 135
  store<i32>(w1() + 40, 0);            // score
  score = 0;
  lastG = 0;
}

export function update(): void {
  const present = load<i32>(p1() + 0);
  const g = load<i32>(p1() + 4);
  if (present != 0) {
    store<i32>(w1() + 64, load<i32>(p1() + 16));   // hero x = nose x
    store<i32>(w1() + 68, load<i32>(p1() + 20));   // hero y = nose y
    if (g == 1 && lastG != 1) { score += 1; }      // ARMS_UP rising edge
    lastG = g;
  }
  store<i32>(w1() + 40, score);
}
