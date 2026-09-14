// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The exported application's host: `app.rave.json` beside this page, the
// runtime compiled without the editor, one view the size of the window.
//
//   RaveRuntime (Ranger)  routes, the guard, the mock session, the layout
//                         at the window's width, the bound controls
//   this file             WebGL, the pointer, the keyboard, the hash
//
// The route is the hash: `#/settings` opens on the settings page, and every
// navigation writes the hash back, so Back and a shared link both work.

import { prepareDisplayList } from "./evg/gl/evg-webgl.js";
import { createA11yMirror } from "./evg/gl/evg-a11y.js";
import { installCanvasMeasurer } from "./evg/gl/evg-measure.js";
import RaveModule, { RaveExport } from "./generated-host.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("c");
const errEl = document.getElementById("err");

installCanvasMeasurer(RaveModule);

const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true });
if (!gl) errEl.textContent = "this page needs WebGL 2";

let rt = null;
let generation = 0;
let mirror = null;
let queued = false;
let lastPath = "";

function sizeOfWindow() {
  const r = stage.getBoundingClientRect();
  return [Math.max(320, Math.floor(r.width)), Math.max(320, Math.floor(r.height))];
}

function coarse() {
  return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
}

function paint() {
  queued = false;
  if (!rt) return;
  try {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const [w, h] = sizeOfWindow();
    const cw = Math.max(1, Math.floor(w * dpr));
    const ch = Math.max(1, Math.floor(h * dpr));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    rt.resizeView(0, w, h);
    const frame = prepareDisplayList(gl, JSON.parse(rt.displayListJson(0)), { dpr });
    frame.draw(null, null, { clear: true });
    frame.dispose();
    if (!mirror) mirror = createA11yMirror(stage, canvas, { onPress: (id) => act(() => rt.pressIn(0, id)) });
    mirror.update(JSON.parse(rt.a11yJson(0)));
    syncHash();
    errEl.textContent = "";
  } catch (e) {
    errEl.textContent = String(e && e.message ? e.message : e);
  }
}

function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(paint);
}

function act(fn) {
  if (fn()) schedule();
}

// --- the hash is the route ------------------------------------------------------
function syncHash() {
  const p = rt.path();
  if (p === lastPath) return;
  lastPath = p;
  const want = "#" + p;
  if (location.hash !== want) history.replaceState(null, "", want);
}

window.addEventListener("hashchange", () => {
  if (!rt) return;
  const p = location.hash.startsWith("#") ? location.hash.slice(1) : "";
  if (p && p !== rt.path()) act(() => rt.navigate(p));
});

// --- the pointer ------------------------------------------------------------------
function at(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

canvas.addEventListener("pointerdown", (ev) => {
  if (!rt) return;
  canvas.focus();
  const [x, y] = at(ev);
  act(() => rt.pointerDown(0, x, y));
});

canvas.addEventListener("pointermove", (ev) => {
  if (!rt) return;
  const [x, y] = at(ev);
  act(() => rt.hover(0, x, y));
});

// --- the keyboard --------------------------------------------------------------------
canvas.addEventListener("keydown", (ev) => {
  if (!rt) return;
  const mod = ev.metaKey || ev.ctrlKey;
  if (ev.key.length === 1 && !mod) {
    if (rt.typeChar(0, ev.key)) {
      ev.preventDefault();
      schedule();
      return;
    }
  }
  const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  if (rt.keyWith(0, k, ev.shiftKey, mod)) {
    ev.preventDefault();
    schedule();
  }
});

window.addEventListener("resize", schedule);

// --- the document beside the page --------------------------------------------------
async function boot() {
  let json = "";
  try {
    const res = await fetch("./app.rave.json");
    if (res.ok) json = await res.text();
  } catch {
    json = "";
  }
  if (!json || !RaveExport.isDocument(json)) json = RaveExport.starter();
  rt = RaveExport.open(json);
  const [w, h] = sizeOfWindow();
  rt.addView("app", w, h, coarse());
  const p = location.hash.startsWith("#") ? location.hash.slice(1) : "";
  if (p) rt.navigate(p);
  window.__raveApp = rt;
  schedule();
}

boot();
