// ============================================================================
// Shared host <-> guest ABI: the flat RGW1 integer mailbox both sides agree on.
// ============================================================================
// The host writes input into these byte offsets before each update() and reads
// the guest's replies back afterwards; the guest does the mirror. These offsets
// (and the input edge bits) are the CONTRACT - identical for the interpreted .as
// bridge and the compiled WASM guest - so they live in one shared module instead
// of being re-declared in every game.
//
//   import { OFF_INPUT, OFF_SEL, IN_ACT } from "./abi";
// (resolves to gallery/game_engine/lib/abi.as via the runner's asset path.)
// ============================================================================

// host -> guest
export const OFF_TIME: i32 = 16;     // monotonic clock (ms), for time-based effects
export const OFF_INPUT: i32 = 20;    // edge mask this frame (see IN_* below)
// host -> guest: laid-out rect (page px) of the selected node, so a guest can
// place an absolute overlay effect at real screen coordinates.
export const OFF_RECT_X: i32 = 200;
export const OFF_RECT_Y: i32 = 204;
export const OFF_RECT_W: i32 = 208;
export const OFF_RECT_H: i32 = 212;

// guest -> host
export const OFF_SEL: i32 = 52;      // selected node id to highlight (0 = none)
export const OFF_LAUNCH: i32 = 56;   // catalog index + 1 to launch (0 = none)

// input edge bits packed into OFF_INPUT
export const IN_UP: i32 = 1;
export const IN_DOWN: i32 = 2;
export const IN_LEFT: i32 = 4;
export const IN_RIGHT: i32 = 8;
export const IN_ACT: i32 = 16;
