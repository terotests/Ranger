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
import { createTextInputBridge } from "../../evg/gl/evg-textinput.js";
import { RealTrainerDemo } from "./generated-host.js";
import { REALTRAINER_CSS, REALTRAINER_COMPACT, REALTRAINER_PLAN_MACHINE, REALTRAINER_CHAT_MACHINE, REALTRAINER_SEED } from "./generated.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("c");
const errEl = document.getElementById("err");
const fpsEl = document.getElementById("fps");
const sceneEl = document.getElementById("scene");

const app = new RealTrainerDemo();
app.init(REALTRAINER_CSS, REALTRAINER_COMPACT);
app.loadPlanMachine(REALTRAINER_PLAN_MACHINE);
app.loadChatMachine(REALTRAINER_CHAT_MACHINE);
app.loadReference(REALTRAINER_SEED);
// `?page=390x844&route=/calendar/cal-plan?week=2026-02-09` opens the app the
// way the reference recorder opens the original: a phone, on a route.
// `page=fit` is the phone itself: the page is the viewport, and so is any
// viewport too narrow for the desktop demo when nothing was asked — a phone
// opening the bare URL gets the shell, on its route or on Home.
// `page=fit` — or no `page` at all — makes the page the window: it is laid
// out at the window's size and again on every resize, and the stylesheet's
// `@media` blocks answer for the width. `page=390x844` pins a size, which is
// what the checks want.
const params = new URLSearchParams(location.search);
const pageParam = params.get("page");
const fit = !pageParam || pageParam === "fit";
{
  if (fit) {
    document.body.classList.add("fit");
    app.setPageSize(window.innerWidth, window.innerHeight);
  } else {
    const [w, h] = pageParam.split("x").map(Number);
    if (w > 0 && h > 0) app.setPageSize(w, h);
  }
  const route = params.get("route");
  if (route) app.openRoute(route);
  else if (fit) app.openRoute("/");
}

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

let W = app.widthPx();
let H = app.heightPx();
const dpr = Math.min(2, window.devicePixelRatio || 1);
function sizeCanvas() {
  W = app.widthPx();
  H = app.heightPx();
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  stage.style.width = W + "px";
  stage.style.height = H + "px";
}
sizeCanvas();

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
  syncTextSession();
}

// --- the text fields ---------------------------------------------------------
//
// The platform owns the editing session: a real <input> sits over the drawn
// field and Ranger mirrors its value and selection. See evg-textinput.js for
// what was measured first and why a keydown-driven editor was a dead end.
const textInput = createTextInputBridge({
  host: stage,
  canvas,
  onEdit: ({ value, selStart, selEnd }) => {
    const tid = textInput.activeTid();
    if (!tid) return;
    if (!app.applyEdit(tid, value, selStart, selEnd)) return;
    paint();
    const after = JSON.parse(app.fieldStateJson(tid));
    if (after && after.value !== value) textInput.sync(after);
  },
  onKey: (k) => {
    if (k.key !== "Tab" && k.key !== "Escape" && k.key !== "Enter") return false;
    const took = app.keyWith(k.key, k.shiftKey, k.ctrlKey || k.metaKey);
    syncTextSession();
    if (took) paint();
    return took;
  },
});

/** Hand the keyboard to the field the app says is focused, or take it back. */
function syncTextSession() {
  const tid = app.focusedField();
  if (!tid) {
    textInput.blurField();
    return;
  }
  const st = JSON.parse(app.fieldStateJson(tid));
  if (!st) {
    textInput.blurField();
    return;
  }
  if (textInput.activeTid() === tid) {
    textInput.sync(st);
    return;
  }
  textInput.focusField(tid, st);
}

// A finger has no wheel: a drag on the canvas scrolls what the wheel would,
// and a drag that scrolled is not a press when it lifts. Six pixels is the
// slack a tap gets before it becomes a drag.
let drag = null;
canvas.addEventListener("pointerdown", (ev) => {
  const [x, y] = at(ev);
  drag = { y, moved: false };
  canvas.setPointerCapture(ev.pointerId);
  app.setPressed(app.hitId(x, y));
  paint();
});
canvas.addEventListener("pointerup", (ev) => {
  const [x, y] = at(ev);
  const scrolled = drag?.moved;
  drag = null;
  if (scrolled) {
    app.setPressed("");
    paint();
    return;
  }
  press(x, y);
});
canvas.addEventListener("pointercancel", () => {
  drag = null;
  app.setPressed("");
  paint();
});
canvas.addEventListener("pointermove", (ev) => {
  const [x, y] = at(ev);
  if (drag) {
    const dy = drag.y - y;
    if (drag.moved || Math.abs(dy) > 6) {
      drag.moved = true;
      drag.y = y;
      if (app.scrollDocument(dy)) paint();
    }
    return;
  }
  const id = app.hitId(x, y);
  if (id === hovered) return;
  hovered = id;
  app.setHover(id);
  // Hover starts a transition, and a transition needs frames — the loop is
  // already running, so there is nothing to start here beyond the flag.
});
// The window changed size: the page is laid out again at the new size — the
// sheet is told the viewport inside `setPageSize`'s rebuild — and drawn.
if (fit) {
  let pending = false;
  window.addEventListener("resize", () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      app.setPageSize(window.innerWidth, window.innerHeight);
      sizeCanvas();
      paint();
    });
  });
}

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
