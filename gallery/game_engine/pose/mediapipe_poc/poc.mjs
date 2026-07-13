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
import { RGP1, FP, mapToRgp1, decodeRgp1 } from "./rgp1.mjs";

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
    const rgp1 = decodeRgp1(mapToRgp1(lastResult, ++seq));
    perImage.push({
      image: imgPath.split("/").pop(),
      w: img.naturalWidth, h: img.naturalHeight,
      detected: lastResult.landmarks?.length || 0,
      timing: stats(times),
      rgp1,
    });
  }
  landmarker.close();
  return { model: model.split("/").pop(), delegate, initMs, perImage };
};

// dumpReference(): golden landmarks from MediaPipe for validating the native
// pipeline (NATIVE_EMBED.md milestone 2). Emits all 33 landmarks per image in
// NORMALIZED image coords [0,1] (+ visibility) so it can be diffed against
// native_bench --json regardless of image resolution.
window.dumpReference = async function dumpReference(config) {
  const { model, images } = config;
  const fileset = await FilesetResolver.forVisionTasks("./wasm");
  const landmarker = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: model, delegate: "CPU" },
    runningMode: "IMAGE", numPoses: 1,
  });
  const out = [];
  for (const imgPath of images) {
    const img = await loadImage(imgPath);
    const r = landmarker.detect(img);
    const lm = (r.landmarks && r.landmarks[0]) || [];
    out.push({
      image: imgPath.split("/").pop(),
      w: img.naturalWidth, h: img.naturalHeight,
      present: lm.length ? 1 : 0,
      landmarks: lm.map((p) => ({
        x: +p.x.toFixed(5), y: +p.y.toFixed(5), z: +p.z.toFixed(5),
        v: +(p.visibility ?? 0).toFixed(4),
      })),
    });
  }
  landmarker.close();
  return { model: model.split("/").pop(), reference: out };
};

// signal readiness to the Playwright driver
window.__pocReady = true;
