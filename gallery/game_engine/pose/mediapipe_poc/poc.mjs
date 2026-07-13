// poc.mjs — the browser side of the MediaPipe pose PoC.
//
// Loads PoseLandmarker (MediaPipe Tasks Vision, WASM) from the LOCAL ./wasm
// fileset (no CDN), runs it over static sample images, times each inference, and
// maps the landmarks into the exact RGP1 pose shape the Ranger game reads. This
// is the real MediaPipeWorkerSource logic from PLAN_PROVIDERS §6.1, exercised
// headless so we can measure cost before any camera hardware exists.
//
// window.runBench(config) is invoked by bench.mjs (Playwright) and returns a
// plain results object (timings + the RGP1 mapping) for reporting.

import { FilesetResolver, PoseLandmarker } from "./vision_bundle.mjs";

// ---- RGP1 pose shape (mirrors SharedPoseBuffer / wasm RGP1 block) -----------
// A worker would write these bytes into a SharedArrayBuffer; here we fill a
// plain Int32Array to prove the landmark -> RGP1 mapping is real, not hand-waved.
const RGP1_PRESENT = 0, RGP1_GESTURE = 4, RGP1_COUNT = 8, RGP1_SEQ = 12, RGP1_LM0 = 16;
const FP = 256;                 // fixed-point scale, same as the game
const VIEW_W = 480, VIEW_H = 270;

const G_NONE = 0, G_ARMS_UP = 1, G_LEAN_LEFT = 2, G_LEAN_RIGHT = 3;
// BlazePose landmark indices
const L_NOSE = 0, L_LSH = 11, L_RSH = 12, L_LWR = 15, L_RWR = 16;

function classifyGesture(lm) {
  // arms_up: both wrists above both shoulders (smaller normalized y = higher)
  const shoulderY = Math.min(lm[L_LSH].y, lm[L_RSH].y);
  if (lm[L_LWR].y < shoulderY && lm[L_RWR].y < shoulderY) return G_ARMS_UP;
  const nx = lm[L_NOSE].x;
  if (nx < 0.42) return G_LEAN_LEFT;
  if (nx > 0.58) return G_LEAN_RIGHT;
  return G_NONE;
}

// Fill an RGP1-shaped Int32Array from a PoseLandmarker result (source-side logic).
function mapToRgp1(result, seq) {
  const buf = new Int32Array(32); // 128 bytes / 4
  const has = result.landmarks && result.landmarks.length > 0;
  buf[RGP1_PRESENT / 4] = has ? 1 : 0;
  buf[RGP1_SEQ / 4] = seq;
  if (!has) return buf;
  const lm = result.landmarks[0];
  buf[RGP1_GESTURE / 4] = classifyGesture(lm);
  buf[RGP1_COUNT / 4] = 1;
  const nose = lm[L_NOSE];
  buf[RGP1_LM0 / 4] = Math.round(nose.x * VIEW_W * FP);       // x fp
  buf[(RGP1_LM0 + 4) / 4] = Math.round(nose.y * VIEW_H * FP); // y fp
  return buf;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function stats(times) {
  const s = [...times].sort((a, b) => a - b);
  const n = s.length;
  const sum = s.reduce((a, b) => a + b, 0);
  const pct = (p) => s[Math.min(n - 1, Math.floor((p / 100) * n))];
  return {
    n, min: +s[0].toFixed(2), median: +pct(50).toFixed(2),
    mean: +(sum / n).toFixed(2), p95: +pct(95).toFixed(2), max: +s[n - 1].toFixed(2),
    fps_median: +(1000 / pct(50)).toFixed(1),
  };
}

window.runBench = async function runBench(config) {
  const { model, images, delegate = "CPU", warmup = 3, iters = 20 } = config;
  const t0 = performance.now();
  const fileset = await FilesetResolver.forVisionTasks("./wasm");
  const landmarker = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: model, delegate },
    runningMode: "IMAGE",
    numPoses: 1,
  });
  const initMs = +(performance.now() - t0).toFixed(1);

  const perImage = [];
  let seq = 0;
  for (const imgPath of images) {
    const img = await loadImage(imgPath);
    for (let i = 0; i < warmup; i++) landmarker.detect(img);
    const times = [];
    let lastResult = null;
    for (let i = 0; i < iters; i++) {
      const a = performance.now();
      lastResult = landmarker.detect(img);
      times.push(performance.now() - a);
    }
    const rgp1 = mapToRgp1(lastResult, ++seq);
    perImage.push({
      image: imgPath.split("/").pop(),
      w: img.naturalWidth, h: img.naturalHeight,
      detected: lastResult.landmarks?.length || 0,
      timing: stats(times),
      rgp1: {
        present: rgp1[RGP1_PRESENT / 4],
        gesture: rgp1[RGP1_GESTURE / 4],
        count: rgp1[RGP1_COUNT / 4],
        noseXfp: rgp1[RGP1_LM0 / 4], noseYfp: rgp1[(RGP1_LM0 + 4) / 4],
        noseX: +(rgp1[RGP1_LM0 / 4] / FP).toFixed(1),
        noseY: +(rgp1[(RGP1_LM0 + 4) / 4] / FP).toFixed(1),
      },
    });
  }
  landmarker.close();
  return { model: model.split("/").pop(), delegate, initMs, perImage };
};

// signal readiness to the Playwright driver
window.__pocReady = true;
