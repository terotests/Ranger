// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The browser host for the firesim console. It owns three things and no more:
//
//   the clock    — the REAL milliseconds between two frames, handed to the
//                  app, which is what makes the simulator's latency, its
//                  listener's polling and the model's stream all run at the
//                  speed a person sees
//   the pointer  — a position, resolved to an id by EVG's own hit test
//   the pixels   — one WebGL 2 context, fed the display list the app emits
//
// Everything else — the layout, the backend, the rules, the accounts, the
// waiting — is `FiresimConsole.rgr`'s, which is why `tests/console-check.mjs`
// drives the same app with a made-up clock and asserts on the same tree.
//
// The page IS the window: `setPageSize` gets whatever the browser has, on
// load and on every resize, and the stylesheet's @media block folds the rail
// above the main area on a narrow one.

import { renderDisplayList } from "./evg/gl/evg-webgl.js";
import { createA11yMirror, pressAtCentre } from "./evg/gl/evg-a11y.js";
import { installCanvasMeasurer } from "./evg/gl/evg-measure.js";
import FiresimModule, { FiresimConsole } from "./generated-host.js";
import { CONSOLE_CSS, CONSOLE_RULES } from "./generated.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("c");
const errEl = document.getElementById("err");

// The browser measures the text: every layout the app builds asks canvas
// `measureText` in the face the painter draws with, instead of the advance
// table. Installed before the app is constructed — the app makes a layout the
// moment it is made.
const fontMeasure = installCanvasMeasurer(FiresimModule);
window.__fontMeasure = fontMeasure;

const app = new FiresimConsole();
app.init(CONSOLE_CSS, CONSOLE_RULES);
window.__firesim = app;

let generation = 0;
let mirror = null;
let focusId = "";

function sizeOfWindow() {
  const w = Math.max(360, Math.floor(window.innerWidth));
  const h = Math.max(420, Math.floor(window.innerHeight));
  return [w, h];
}

function resize() {
  const [w, h] = sizeOfWindow();
  app.setPageSize(w, h);
  paint();
}

function paint() {
  try {
    errEl.textContent = "";
    const [w, h] = sizeOfWindow();
    const list = JSON.parse(app.displayListJson());
    window.__lastList = list;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    stage.style.width = `${w}px`;
    stage.style.height = `${h}px`;
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      premultipliedAlpha: false,
      stencil: true,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error("WebGL 2 is not available in this browser");
    const doc = { width: w, height: h, list };
    renderDisplayList(gl, doc, { dpr });

    generation += 1;
    const treeJson = app.a11yJson(generation, focusId);
    window.__lastA11y = treeJson;
    const tree = JSON.parse(treeJson);
    tree.byId = new Map(tree.nodes.map((n) => [n.id, n]));
    if (mirror) mirror.update(tree);
  } catch (e) {
    errEl.textContent = String((e && e.stack) || e);
  }
}

// A canvas hands a screen reader one empty graphic no matter what was drawn
// into it, so the tree is mirrored into real DOM over the top. A reader
// activating a node is answered by pressing the app in the middle of the
// rectangle the reader was given — the same path a mouse takes.
mirror = createA11yMirror(stage, {
  canvas,
  label: "firesim console",
  onActivate: (node) => pressAtCentre(node, (x, y) => press(x, y)),
});

function press(x, y) {
  const id = app.hitId(x, y);
  focusId = id;
  app.setFocus(id);
  if (app.press(id)) paint();
}

// --- the pointer --------------------------------------------------------------
// The latency slider is the one control with a drag: the fraction of its track
// the pointer is at becomes the value, and the value becomes the simulator's
// latency. There is no second copy of the number anywhere.
let dragging = false;

// `fs-latency` IS the track — the app puts the slider's role and id on it
// rather than on the thumb, precisely so that this measurement is against a
// box that does not move. The thumb's width is taken off the usable span, so
// the far right of the track is 1.0 and not "1.0 minus a thumb".
const THUMB_PX = 14;

function trackFraction(x) {
  const tree = JSON.parse(window.__lastA11y || '{"nodes":[]}');
  const track = tree.nodes.find((n) => n.id === "fs-latency");
  if (!track || !track.b) return -1;
  const left = track.b[0] + THUMB_PX / 2;
  const width = Math.max(track.b[2] - THUMB_PX, 1);
  return Math.min(1, Math.max(0, (x - left) / width));
}

canvas.addEventListener("pointerdown", (ev) => {
  const rect = canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  const id = app.hitId(x, y);
  app.setPressed(id);
  if (id === "fs-latency" || id === "fs-latency-thumb" || id === "fs-latency-range") {
    dragging = true;
    const frac = trackFraction(x);
    if (frac >= 0) app.slideTo(frac);
    paint();
    return;
  }
  press(x, y);
});

canvas.addEventListener("pointermove", (ev) => {
  const rect = canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  if (dragging) {
    const frac = trackFraction(x);
    if (frac >= 0) app.slideTo(frac);
    paint();
    return;
  }
  const id = app.hitId(x, y);
  app.setHover(id);
  canvas.style.cursor = id ? "pointer" : "default";
});

canvas.addEventListener("pointerup", () => {
  dragging = false;
  app.setPressed("");
});

canvas.addEventListener("pointerleave", () => {
  dragging = false;
  app.setHover("");
  app.setPressed("");
});

window.addEventListener("keydown", (ev) => {
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter", " "];
  if (!keys.includes(ev.key)) return;
  const key = ev.key === " " ? "Space" : ev.key;
  if (app.key(key)) {
    ev.preventDefault();
    paint();
  }
});

window.addEventListener("resize", resize);

// --- the datasets -------------------------------------------------------------
// The sample dataset is written in Ranger, so it costs nothing. The
// RealTrainer one is `gallery/realtrainer/fixtures/reference/seed.json` — 747
// documents, the file its reference recorder puts into a REAL Firebase
// emulator — and a 400 kB fixture does not belong in the page's first byte.
// So the app asks and the host fetches: `wantedDataset()` names what it
// wants, and `loadDataset` hands it over with the rules that go with it,
// because rules are part of a dataset and not part of a tool.
const DATASETS = {
  RealTrainer: { json: "./datasets/realtrainer.json", rules: "./datasets/realtrainer.rules" },
};
let fetching = "";

async function serveDatasetRequests() {
  const wanted = app.wantedDataset();
  if (!wanted || wanted === fetching) return;
  fetching = wanted;
  const spec = DATASETS[wanted];
  if (!spec) {
    app.datasetFailed(wanted, "there is no such dataset");
    app.clearWanted();
    fetching = "";
    return;
  }
  try {
    const [json, rules] = await Promise.all([
      fetch(spec.json).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status}`)))),
      fetch(spec.rules).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status}`)))),
    ]);
    app.loadDataset(wanted, json, rules);
  } catch (e) {
    app.datasetFailed(wanted, String((e && e.message) || e));
  }
  app.clearWanted();
  fetching = "";
  paint();
}

// --- the clock ----------------------------------------------------------------
// One loop, always running, because the simulator always has something to do:
// a call in flight, a listener to poll, a reply arriving a word at a time.
// The app is handed the real elapsed time, so a dropped frame shortens what
// is animating rather than stretching it.
let last = performance.now();
function frame(now) {
  const dt = Math.min(now - last, 250);
  last = now;
  app.tick(dt);
  serveDatasetRequests();
  paint();
  requestAnimationFrame(frame);
}

resize();
requestAnimationFrame(frame);
