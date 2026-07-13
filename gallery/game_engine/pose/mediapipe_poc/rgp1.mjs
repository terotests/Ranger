// rgp1.mjs — shared source-side mapping: MediaPipe landmarks -> RGP1 pose shape.
//
// One source of truth for both the headless benchmark (poc.mjs) and the live
// game (game.mjs). This is the MediaPipeWorkerSource logic from PLAN_PROVIDERS
// §6.1: turn a PoseLandmarker result into the bytes a game reads from RGP1.

export const RGP1 = { PRESENT: 0, GESTURE: 4, COUNT: 8, SEQ: 12, LM0: 16 };
export const FP = 256;                       // fixed-point scale (matches the game)
export const VIEW_W = 480, VIEW_H = 270;     // nominal world size

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
// seqlock/revision counter. Returns the buffer plus a decoded view for HUDs.
export function mapToRgp1(result, seq, buf) {
  buf = buf || new Int32Array(32);           // 128 bytes
  const has = result.landmarks && result.landmarks.length > 0;
  buf[RGP1.PRESENT / 4] = has ? 1 : 0;
  buf[RGP1.SEQ / 4] = seq;
  buf[RGP1.GESTURE / 4] = 0;
  buf[RGP1.COUNT / 4] = 0;
  if (has) {
    const lm = result.landmarks[0];
    buf[RGP1.GESTURE / 4] = classifyGesture(lm);
    buf[RGP1.COUNT / 4] = 1;
    buf[RGP1.LM0 / 4] = Math.round(lm[L_NOSE].x * VIEW_W * FP);
    buf[(RGP1.LM0 + 4) / 4] = Math.round(lm[L_NOSE].y * VIEW_H * FP);
  }
  return buf;
}

export function decodeRgp1(buf) {
  return {
    present: buf[RGP1.PRESENT / 4],
    gesture: buf[RGP1.GESTURE / 4],
    count: buf[RGP1.COUNT / 4],
    seq: buf[RGP1.SEQ / 4],
    noseXfp: buf[RGP1.LM0 / 4], noseYfp: buf[(RGP1.LM0 + 4) / 4],
    noseX: +(buf[RGP1.LM0 / 4] / FP).toFixed(1),
    noseY: +(buf[(RGP1.LM0 + 4) / 4] / FP).toFixed(1),
  };
}
