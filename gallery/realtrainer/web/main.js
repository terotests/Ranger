// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The browser host. It owns three things and no more:
//
//   the clock      — the REAL milliseconds between two frames, handed to the
//                    app, which is what makes a dropped frame shorten the
//                    animation instead of stretching it
//   the pointer    — a position, resolved to an id by EVG's own hit test
//   the pixels     — one WebGL 2 context, fed the display list the app emits
//
// Everything else — what the page looks like, how fast the ring turns, when
// the loader hands over — is `RealTrainerDemo.rgr`'s, which is why the
// headless check can drive the same app with a made-up clock and assert on the
// same picture.

import { renderDisplayList } from "../../evg/gl/evg-webgl.js";
import { createA11yMirror, pressAtCentre } from "../../evg/gl/evg-a11y.js";
import { RealTrainerDemo } from "./generated-host.js";
import { REALTRAINER_CSS, REALTRAINER_COMPACT } from "./generated.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("c");
const errEl = document.getElementById("err");
const fpsEl = document.getElementById("fps");
const sceneEl = document.getElementById("scene");

const app = new RealTrainerDemo();
app.init(REALTRAINER_CSS, REALTRAINER_COMPACT);

// For anything driving this page from outside — the browser check reads the
// last frame's list rather than guessing at pixels.
window.__app = app;

// The wheel, and nothing else about scrolling: how far the document may move
// is the layout's answer, because it is the half that measured the content.
stage.addEventListener(
  "wheel",
  (e) => {
    if (app.scrollDocument(e.deltaY)) {
      e.preventDefault();
    }
  },
  { passive: false },
);

const W = app.widthPx();
const H = app.heightPx();
const dpr = Math.min(2, window.devicePixelRatio || 1);
canvas.style.width = W + "px";
canvas.style.height = H + "px";
canvas.width = Math.round(W * dpr);
canvas.height = Math.round(H * dpr);
stage.style.width = W + "px";
stage.style.height = H + "px";

const gl = canvas.getContext("webgl2", {
  antialias: true,
  premultipliedAlpha: false,
  stencil: true,
  preserveDrawingBuffer: true,
});
if (!gl) {
  errEl.textContent = "WebGL 2 is not available in this browser.";
}

let generation = 0;
let focus = "";

const mirror = createA11yMirror(stage, {
  canvas,
  label: "RealTrainer demo",
  // A reader activating a node is answered by pressing the app in the middle
  // of the rectangle the reader was given — the same path the mouse takes.
  onActivate: (node) => pressAtCentre(node, (x, y) => press(x, y)),
});

function paint() {
  if (!gl) return;
  try {
    errEl.textContent = "";
    const listJson = app.displayListJson();
    window.__lastList = listJson;
    const doc = { width: W, height: H, list: JSON.parse(listJson) };
    window.__lastStats = renderDisplayList(gl, doc, { dpr });
    generation += 1;
    mirror.update(JSON.parse(app.a11yJson(generation, focus)));
    sceneEl.textContent = app.sceneName();
  } catch (e) {
    errEl.textContent = String((e && e.stack) || e);
  }
}

function at(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

function press(x, y) {
  const id = app.hitId(x, y);
  app.setPressed("");
  if (app.press(id)) paint();
}

canvas.addEventListener("pointerdown", (ev) => {
  const [x, y] = at(ev);
  app.setPressed(app.hitId(x, y));
  paint();
});
canvas.addEventListener("pointerup", (ev) => {
  const [x, y] = at(ev);
  press(x, y);
});
canvas.addEventListener("pointermove", (ev) => {
  const [x, y] = at(ev);
  const id = app.hitId(x, y);
  if (id === hovered) return;
  hovered = id;
  app.setHover(id);
  // Hover starts a transition, and a transition needs frames — the loop is
  // already running, so there is nothing to start here beyond the flag.
});
canvas.addEventListener("pointerleave", () => {
  hovered = "";
  app.setHover("");
});
let hovered = "";

// --- the frame loop ----------------------------------------------------------
//
// It never stops, because the ring never stops: this is a loading screen, and
// a loading screen that idles is a frozen one. The sign-in page is still
// ticked, so a hover's 160ms fade has frames to run in.
let last = performance.now();
let frames = 0;
let fpsAt = last;

function step(now) {
  const dt = now - last;
  last = now;
  app.tick(dt);
  paint();
  frames += 1;
  if (now - fpsAt >= 500) {
    fpsEl.textContent = Math.round((frames * 1000) / (now - fpsAt)) + " fps";
    frames = 0;
    fpsAt = now;
  }
  requestAnimationFrame(step);
}

// The first frame waits for the faces the list names, so the wordmark is not
// measured in one font and drawn in another.
document.fonts.ready.then(() => {
  paint();
  requestAnimationFrame(step);
});
