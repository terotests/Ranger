// rgp1.mjs — shared source-side mapping: MediaPipe landmarks -> RGP1 pose shape.
//
// One source of truth for both the headless benchmark (poc.mjs) and the live
// game (game.mjs). This is the MediaPipeWorkerSource logic from PLAN_PROVIDERS
// §6.1: turn a PoseLandmarker result into the bytes a game reads from RGP1.

// Canonical RGP1 v2 layout — the SHARED wasm/wasm_pose_abi.h offsets, identical
// to lib/ranger_game/src/pose.rs, scripting/as_abi_bridge.rgr, and the native
// rg_pose.h, so a guest reads pose from the same bytes everywhere (IDEAL §2.4).
// Landmarks are stored NORMALIZED [0,1] * FP (no view size baked into the wire);
// decodeRgp1() scales to view pixels for the PoC HUD/game.
export const RGP1 = {
  MAGIC: 0, VERSION: 4, SIZE: 8, REVISION: 12, PRESENT: 16, GESTURE: 20,
  COUNT: 24, TIME: 28, DT: 32, FLAGS: 36, LM0: 64, LM_STRIDE: 24, BYTES: 856,
};
export const RGP1_MAGIC = 0x31504752;        // 'RGP1' little-endian
export const RGP1_VERSION = 2;
export const FLAG_VALID = 1;
export const FP = 256;                       // fixed-point scale (matches the game)
export const VIEW_W = 480, VIEW_H = 270;     // nominal view size (decode scaling only)

export const G_NONE = 0, G_ARMS_UP = 1, G_LEAN_LEFT = 2, G_LEAN_RIGHT = 3;
// BlazePose landmark indices
export const L_NOSE = 0, L_LSH = 11, L_RSH = 12, L_LWR = 15, L_RWR = 16;

export function gestureName(g) {
  return ["NONE", "ARMS_UP", "LEAN_LEFT", "LEAN_RIGHT"][g] || "NONE";
}

export function classifyGesture(lm) {
  // arms_up: both wrists above both shoulders (smaller normalized y = higher)
  const shoulderY = Math.min(lm[L_LSH].y, lm[L_RSH].y);
  if (lm[L_LWR].y < shoulderY && lm[L_RWR].y < shoulderY) return G_ARMS_UP;
  const nx = lm[L_NOSE].x;
  if (nx < 0.42) return G_LEAN_LEFT;
  if (nx > 0.58) return G_LEAN_RIGHT;
  return G_NONE;
}

// Fill an RGP1-shaped Int32Array from a PoseLandmarker result. `seq` is the
// seqlock/revision counter. Landmarks are written NORMALIZED [0,1] * FP (the
// canonical, view-independent wire). Returns the buffer.
export function mapToRgp1(result, seq, buf) {
  buf = buf || new Int32Array(RGP1.BYTES / 4);   // 856 bytes
  const has = result.landmarks && result.landmarks.length > 0;
  buf[RGP1.MAGIC / 4] = RGP1_MAGIC;
  buf[RGP1.VERSION / 4] = RGP1_VERSION;
  buf[RGP1.SIZE / 4] = RGP1.BYTES;
  buf[RGP1.REVISION / 4] = seq;
  buf[RGP1.PRESENT / 4] = has ? 1 : 0;
  buf[RGP1.GESTURE / 4] = 0;
  buf[RGP1.COUNT / 4] = 0;
  buf[RGP1.FLAGS / 4] = has ? FLAG_VALID : 0;
  if (has) {
    const lm = result.landmarks[0];
    buf[RGP1.GESTURE / 4] = classifyGesture(lm);
    // Write the full skeleton so a guest can draw it; positions normalized.
    const n = Math.min(lm.length, 33);
    buf[RGP1.COUNT / 4] = n;
    for (let i = 0; i < n; i++) {
      const base = (RGP1.LM0 + i * RGP1.LM_STRIDE) / 4;
      buf[base + 0] = Math.round(lm[i].x * FP);           // normalized x
      buf[base + 1] = Math.round(lm[i].y * FP);           // normalized y
      buf[base + 5] = Math.round((lm[i].visibility ?? 1) * FP); // conf
    }
  }
  return buf;
}

export function decodeRgp1(buf) {
  const nxFp = buf[RGP1.LM0 / 4];
  const nyFp = buf[(RGP1.LM0 + 4) / 4];
  // The wire is normalized; scale to VIEW pixels for the PoC HUD/game.
  return {
    present: buf[RGP1.PRESENT / 4],
    gesture: buf[RGP1.GESTURE / 4],
    count: buf[RGP1.COUNT / 4],
    seq: buf[RGP1.REVISION / 4],
    noseXfp: nxFp, noseYfp: nyFp,
    noseX: +((nxFp / FP) * VIEW_W).toFixed(1),
    noseY: +((nyFp / FP) * VIEW_H).toFixed(1),
  };
}
