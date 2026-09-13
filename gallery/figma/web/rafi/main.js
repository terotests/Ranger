// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The browser host for Rafi — the Fig editor with its chrome drawn by Ranger.
//
//   RafiApp (Ranger)  the rails, the tree, the panel, the toolbar, the strip,
//                     and the board underneath them, as one display list
//   this file         WebGL, the pointer, the keyboard, the file dialog, and
//                     the bytes the page starts on
//
// Compare `gallery/figma/web/standalone`, which is the same editor with the
// chrome in HTML: over there this file would be nine hundred lines of DOM
// building. Here the app answers a list of draw commands and the page paints
// it, which is the whole difference.
//
//   ?file=NAME   read another file from beside the page instead of the fixture

import { prepareDisplayList, loadImages } from "./evg/gl/evg-webgl.js";
import { createA11yMirror } from "./evg/gl/evg-a11y.js";
import { installCanvasMeasurer } from "./evg/gl/evg-measure.js";
import RafiModule, { RafiApp } from "./generated-host.js";
import { CSS } from "./generated.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("c");
const errEl = document.getElementById("err");
const fileEl = document.getElementById("file");

installCanvasMeasurer(RafiModule);

const app = new RafiApp();
app.init(CSS);
window.__rafi = app;

// STENCIL, or the paths are skipped. A filled path is drawn through the
// stencil buffer, and a context without one silently drops every one of
// them — which on a Figma board is all the text, because the editor wrote
// the glyphs as outlines.
const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true });
if (!gl) errEl.textContent = "this page needs WebGL 2";

// --- the images the file carries ---------------------------------------------
// The painter takes a URL per image command; the file carries bytes. One blob
// URL per image, made when a file is opened and thrown away when the next one
// is, because a tab that opens twenty boards should not hold twenty boards of
// bitmaps.
const imageUrls = new Map();
// …and the decoded pictures themselves, which is a different map: the painter
// takes `src` -> Image, not `src` -> URL. Handing it the URLs paints a black
// board, because a string where a texture belongs is a texture that never
// binds.
let textures = new Map();

// Ranger reads a `buffer` through a DataView it expects to find on the
// ArrayBuffer itself.
function asRangerBuffer(ab) {
  if (!ab._view) ab._view = new DataView(ab);
  return ab;
}

function collectImages() {
  for (const url of imageUrls.values()) URL.revokeObjectURL(url);
  imageUrls.clear();
  const n = app.imageCount() | 0;
  for (let i = 0; i < n; i++) {
    const name = app.imageName(i);
    const buf = app.imageBytes(name);
    if (!buf || !buf.byteLength) continue;
    imageUrls.set(name, URL.createObjectURL(new Blob([buf], { type: "image/png" })));
  }
}

async function decodeImages() {
  const board = withImages(JSON.parse(app.boardJson()));
  textures = await loadImages(board, { base: "" });
}

function withImages(doc) {
  if (!doc?.list?.cmds || imageUrls.size === 0) return doc;
  const cmds = doc.list.cmds.map((c) => {
    if (c.k !== 2 || !c.src) return c;
    const url = imageUrls.get(c.src);
    return url ? { ...c, src: url } : c;
  });
  return { ...doc, list: { ...doc.list, cmds } };
}

// --- the frame ----------------------------------------------------------------
let generation = 0;
let mirror = null;
let queued = false;

function sizeOfWindow() {
  const r = stage.getBoundingClientRect();
  return [Math.max(640, Math.floor(r.width)), Math.max(420, Math.floor(r.height))];
}

function paint() {
  queued = false;
  try {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const [w, h] = sizeOfWindow();
    // The list is laid out at the canvas's CSS size, so one element pixel is
    // one CSS pixel and the GL side applies the device ratio alone.
    const cw = Math.max(1, Math.floor(w * dpr));
    const ch = Math.max(1, Math.floor(h * dpr));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    app.setPageSize(w, h);
    // THE BOARD FIRST, THEN THE CHROME OVER IT. The board's list carries a
    // camera — it is in scene coordinates and the painter multiplies — and its
    // own page background is the desk, the size of the window. The chrome is
    // painted on top with the clear switched off: every rail, ruler and strip
    // is opaque, so what is left showing is exactly the board.
    const board = withImages(JSON.parse(app.boardJson()));
    draw(board, { dpr, images: textures }, true);
    // `renderDisplayList` cannot do the second pass: it calls `draw(shifts)`
    // with one argument, so there is no way through it to say "keep what is
    // already on the canvas" — and a clear here paints the board out and
    // leaves a black hole where the document was.
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
// A press on the board is a select, and a drag on it is a pan: the same two
// the DOM editor gives the canvas, and the app decides which by asking its own
// layout what is under the point.
let dragging = null;

function at(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

canvas.addEventListener("pointerdown", (ev) => {
  const [x, y] = at(ev);
  canvas.setPointerCapture(ev.pointerId);
  canvas.focus();
  if (app.insideBoard(x, y)) {
    dragging = { x, y, moved: false };
    return;
  }
  act(() => app.pointerDown(x, y));
});

canvas.addEventListener("pointermove", (ev) => {
  const [x, y] = at(ev);
  if (dragging) {
    const dx = x - dragging.x;
    const dy = y - dragging.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragging.moved = true;
    if (dragging.moved) {
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
  if (dragging && !dragging.moved) act(() => app.pointerDown(x, y));
  dragging = null;
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", () => { dragging = null; });

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

canvas.addEventListener("keydown", (ev) => {
  if (ev.metaKey || ev.ctrlKey) return;
  const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  if (app.keyWith(k, ev.shiftKey, false)) {
    ev.preventDefault();
    schedule();
  }
});

// --- opening a file -------------------------------------------------------------
// `Open…` is an EVG button, so the app reports the press and the page opens the
// dialog: a file picker has to be a real input for the browser to show one at
// all, and it is the only piece of DOM on this page.
const realPress = app.press.bind(app);
app.press = (id) => {
  if (id === "open") {
    fileEl.click();
    return false;
  }
  return realPress(id);
};

fileEl.addEventListener("change", async () => {
  const f = fileEl.files && fileEl.files[0];
  if (!f) return;
  const bytes = asRangerBuffer(await f.arrayBuffer());
  app.openBytes(bytes, f.name);
  collectImages();
  app.fit();
  await decodeImages();
  schedule();
});

window.addEventListener("resize", schedule);

// --- the file the page starts on --------------------------------------------------
const start = new URLSearchParams(location.search).get("file") || "fixtures/health.fig";

async function boot() {
  try {
    const res = await fetch(start);
    if (!res.ok) throw new Error(`${start}: ${res.status}`);
    const bytes = asRangerBuffer(await res.arrayBuffer());
    if (!app.openBytes(bytes, start.split("/").pop())) {
      app.openSample();
    }
  } catch {
    // No file beside the page is not an error: the sample is a real document
    // built in memory, which is what the deck reader has always fallen back on.
    app.openSample();
  }
  collectImages();
  app.setPageSize(...sizeOfWindow());
  app.fit();
  await decodeImages();
  schedule();
}

boot();
