// game.mjs — a live pose-controlled game using the MediaPipe integration.
//
// Same concept as the Ranger pose_demo game (games/pose_demo/game.as), but drawn
// directly in the browser so it runs on real hardware with a webcam. The pose
// path is identical to the headless bench: PoseLandmarker -> landmarks -> RGP1
// (via rgp1.mjs) -> the game reads present/gesture/nose and reacts.
//
//   - the hero sprite follows your head (nose landmark)
//   - raise both arms (ARMS_UP) to power up (super sprite) and score
//   - a HUD shows gesture, score, live FPS and inference ms
//
// No webcam? add ?nocam=1 to loop a sample image instead (also how the headless
// smoke test drives it). Sprites are the ylos2 LPC sheets.

import { FilesetResolver, PoseLandmarker } from "./vision_bundle.mjs";
import { mapToRgp1, decodeRgp1, gestureName, VIEW_W, VIEW_H, G_ARMS_UP } from "./rgp1.mjs";

const SCALE = 2;
const CANVAS_W = VIEW_W * SCALE, CANVAS_H = VIEW_H * SCALE;
const SHEET_FRAME = 64;                 // LPC frame size
const SHEET_SRC_Y = 128;                // "down-facing" row, frame 0

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

async function makeCameraSource() {
  const video = document.createElement("video");
  video.autoplay = true; video.playsInline = true; video.muted = true;
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
  video.srcObject = stream;
  await video.play();
  return { kind: "camera", frame: () => video, ready: () => video.readyState >= 2 };
}

async function makeImageSource() {
  // Fallback "virtual camera": draw a sample image into a canvas each frame.
  const img = await loadImage("./assets/images/pose.jpg");
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const cx = c.getContext("2d"); cx.drawImage(img, 0, 0);
  return { kind: "sample-image", frame: () => c, ready: () => true };
}

const state = {
  heroX: VIEW_W / 2, heroY: VIEW_H / 2, supers: 0, lastGesture: 0,
  fps: 0, inferMs: 0, mode: "?",
};
window.__gameStats = state;              // for the headless smoke test

export async function startGame() {
  const canvas = document.getElementById("game");
  canvas.width = CANVAS_W; canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  const hero = await loadImage("./assets/sprites/p1_walk.png");
  const heroSuper = await loadImage("./assets/sprites/p1_super.png");

  const fileset = await FilesetResolver.forVisionTasks("./wasm");
  const model = new URLSearchParams(location.search).get("model") ||
    "./assets/models/pose_landmarker_lite.task";
  const landmarker = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: model, delegate: "CPU" },
    runningMode: "VIDEO", numPoses: 1,
  });

  const noCam = new URLSearchParams(location.search).has("nocam");
  let source;
  try { source = noCam ? await makeImageSource() : await makeCameraSource(); }
  catch (e) { source = await makeImageSource(); }
  state.mode = source.kind;

  const rgpBuf = new Int32Array(856 / 4);   // full RGP1 v2 block (header + 33 landmarks)
  let seq = 0, fpsT = performance.now(), fpsN = 0;

  function loop() {
    const now = performance.now();
    if (source.ready()) {
      const t0 = performance.now();
      const result = landmarker.detectForVideo(source.frame(), now);
      state.inferMs = +(performance.now() - t0).toFixed(1);

      const pose = decodeRgp1(mapToRgp1(result, ++seq, rgpBuf));
      if (pose.present) {
        // mirror X so moving right on screen matches moving right IRL
        state.heroX = VIEW_W - pose.noseX;
        state.heroY = pose.noseY;
        if (pose.gesture === G_ARMS_UP && state.lastGesture !== G_ARMS_UP) state.supers++;
        state.lastGesture = pose.gesture;
        state.gestureName = gestureName(pose.gesture);
      }
    }

    // ---- render ----
    ctx.fillStyle = "#141c2e"; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    for (let y = 0; y < CANVAS_H; y += 40) { ctx.fillStyle = (y % 80 === 0) ? "#1c2740" : "#182135"; ctx.fillRect(0, y, CANVAS_W, 20); }
    const armsUp = state.lastGesture === G_ARMS_UP;
    const sheet = armsUp ? heroSuper : hero;
    const dw = SHEET_FRAME * SCALE, dh = SHEET_FRAME * SCALE;
    const dx = state.heroX * SCALE - dw / 2, dy = state.heroY * SCALE - dh / 2;
    ctx.drawImage(sheet, 0, SHEET_SRC_Y, SHEET_FRAME, SHEET_FRAME, dx, dy, dw, dh);

    // HUD
    fpsN++;
    if (now - fpsT >= 500) { state.fps = +(fpsN * 1000 / (now - fpsT)).toFixed(1); fpsN = 0; fpsT = now; }
    ctx.fillStyle = "#0b1120cc"; ctx.fillRect(0, 0, CANVAS_W, 26 * SCALE);
    ctx.fillStyle = "#ffdc78"; ctx.font = `${11 * SCALE}px monospace`;
    ctx.fillText(`POSE ${state.gestureName || "…"}   SUPERS ${state.supers}`, 8, 15 * SCALE);
    ctx.fillStyle = "#8fd3ff"; ctx.font = `${9 * SCALE}px monospace`;
    ctx.fillText(`${state.mode}  ${state.fps} fps  infer ${state.inferMs} ms  model ${model.split("/").pop()}`, 8, 24 * SCALE);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return state;
}
