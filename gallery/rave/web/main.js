// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The browser host for Rave.
//
//   RaveEditor (Ranger)  the rails, the tree, the inspector, the strip — and
//                        under them the application itself: every viewport on
//                        the stage is the runtime's own laid-out tree, drawn
//                        through a camera
//   this file            WebGL, the pointer, the keyboard, the file dialog,
//                        and the download. Nothing else.
//
// Compare gallery/figma/web/rafi/main.js, which this is a copy of with the
// board swapped for a running app: the two passes, the clear switched off
// for the second, the pan on a drag and the a11y mirror are all the same.

import { prepareDisplayList } from "./evg/gl/evg-webgl.js";
import { createA11yMirror } from "./evg/gl/evg-a11y.js";
import { installCanvasMeasurer } from "./evg/gl/evg-measure.js";
import RaveModule, { RaveEditor } from "./generated-host.js";
import { CSS } from "./generated.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("c");
const errEl = document.getElementById("err");
const fileEl = document.getElementById("file");

installCanvasMeasurer(RaveModule);

const app = new RaveEditor();
app.init(CSS);
window.__rave = app;

const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true });
if (!gl) errEl.textContent = "this page needs WebGL 2";

// --- the frame ----------------------------------------------------------------
let generation = 0;
let mirror = null;
let queued = false;

function sizeOfWindow() {
  const r = stage.getBoundingClientRect();
  return [Math.max(720, Math.floor(r.width)), Math.max(480, Math.floor(r.height))];
}

function paint() {
  queued = false;
  try {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const [w, h] = sizeOfWindow();
    const cw = Math.max(1, Math.floor(w * dpr));
    const ch = Math.max(1, Math.floor(h * dpr));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    app.setPageSize(w, h);
    // THE STAGE FIRST, THEN THE CHROME OVER IT. The stage list carries a
    // camera — scene coordinates, and the painter multiplies — and is cleared
    // to the page's own background, which is the desk. The chrome is painted
    // on top with the clear switched off: every rail and strip is opaque, so
    // what is left showing between them is exactly the application.
    draw(JSON.parse(app.boardJson()), { dpr }, true);
    draw(JSON.parse(app.displayListJson()), { dpr }, false);
    if (!mirror) mirror = createA11yMirror(stage, canvas, { onPress: (id) => act(() => app.press(id)) });
    mirror.update(JSON.parse(app.a11yJson(++generation, "")));
    errEl.textContent = "";
  } catch (e) {
    errEl.textContent = String(e && e.message ? e.message : e);
  }
}

function draw(doc, opts, clearFirst) {
  const frame = prepareDisplayList(gl, doc, opts);
  frame.draw(null, null, { clear: clearFirst });
  frame.dispose();
}

function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(paint);
}

function act(fn) {
  if (fn()) schedule();
}

// --- the pointer ---------------------------------------------------------------
// On the stage: a press selects (or, in Run, presses the app), a drag pans —
// unless it started on the selected node in Design, in which case letting go
// over another node drops it there.
let dragging = null;

function at(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

// A press in the chrome may start a drag of its own — a selection being
// swept out in a field, a track thumb being pulled — which the app carries
// on with pointerMove until pointerUp.
let chromeDrag = false;

canvas.addEventListener("pointerdown", (ev) => {
  const [x, y] = at(ev);
  canvas.setPointerCapture(ev.pointerId);
  canvas.focus();
  if (app.insideBoard(x, y)) {
    dragging = { x, y, moved: false, carry: false };
    return;
  }
  chromeDrag = true;
  act(() => app.pointerDownWith(x, y, ev.shiftKey));
});

canvas.addEventListener("pointermove", (ev) => {
  const [x, y] = at(ev);
  if (chromeDrag) {
    act(() => app.pointerMove(x, y));
    return;
  }
  if (dragging) {
    const dx = x - dragging.x;
    const dy = y - dragging.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragging.moved = true;
    if (dragging.moved && !dragging.carry) {
      app.panBy(dx, dy);
      dragging.x = x;
      dragging.y = y;
      schedule();
    }
    return;
  }
  act(() => app.hover(x, y));
});

function endDrag(ev) {
  const [x, y] = at(ev);
  if (chromeDrag) {
    chromeDrag = false;
    act(() => app.pointerUp());
    return;
  }
  if (dragging && !dragging.moved) act(() => app.pointerDown(x, y));
  dragging = null;
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", () => { dragging = null; chromeDrag = false; app.pointerUp(); });

canvas.addEventListener(
  "wheel",
  (ev) => {
    const [x, y] = at(ev);
    if (!app.insideBoard(x, y)) return;
    ev.preventDefault();
    act(() => app.wheel(x, y, ev.deltaY));
  },
  { passive: false }
);

// --- the keyboard ----------------------------------------------------------------
// A printable key while a field is being edited is typed; everything else is
// a key the app names. Ctrl/Cmd chords reach the app as `ctrl`.
canvas.addEventListener("keydown", (ev) => {
  const mod = ev.metaKey || ev.ctrlKey;
  if (ev.key.length === 1 && !mod) {
    if (app.typeChar(ev.key)) {
      ev.preventDefault();
      schedule();
      return;
    }
  }
  const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  if (app.keyWith(k, ev.shiftKey, mod)) {
    ev.preventDefault();
    schedule();
  }
});

// --- the file ---------------------------------------------------------------------
// Open… and Save are EVG buttons; the page does the two things a canvas
// cannot: show a picker, and hand the browser a download.
const realPress = app.press.bind(app);
app.press = (id) => {
  if (id === "file:open") {
    fileEl.click();
    return false;
  }
  if (id === "file:save") {
    const blob = new Blob([app.saveJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "app.rave.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return false;
  }
  return realPress(id);
};

fileEl.addEventListener("change", async () => {
  const f = fileEl.files && fileEl.files[0];
  if (!f) return;
  app.openJson(await f.text());
  schedule();
});

window.addEventListener("resize", schedule);

app.setPageSize(...sizeOfWindow());
schedule();
