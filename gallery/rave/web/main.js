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
import { EXAMPLE } from "./generated-example.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("c");
const errEl = document.getElementById("err");
const fileEl = document.getElementById("file");

installCanvasMeasurer(RaveModule);

const app = new RaveEditor();
app.init(CSS);
if (EXAMPLE) app.openMarkup(EXAMPLE);
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
// On the stage: a press selects (or, in Run, presses the app). A drag that
// started ON a node in Design carries that node, and letting go over another
// one drops it there; a drag that started on nothing pans.
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
    // A press that lands ON a node picks that node up; one that lands on
    // nothing pans the stage, as it always did.
    const onNode = app.beginBoardDrag(x, y);
    if (onNode) schedule();
    dragging = { x, y, moved: false, carry: !!onNode };
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
    if (dragging.moved && dragging.carry) {
      act(() => app.dragTo(x, y));
      return;
    }
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
  if (chromeDrag) {
    chromeDrag = false;
    act(() => app.pointerUp());
    return;
  }
  if (dragging && dragging.carry) {
    if (dragging.moved) act(() => app.dropAt(x, y));
    else act(() => app.press("dropcancel"));
  } else if (dragging && !dragging.moved) {
    act(() => app.pointerDown(x, y));
  }
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
let wantFig = false;
// Whether a `rave serve` is behind this page, holding one file.
let served = false;

// Reading the clipboard needs permission the user may not have given, and
// writing it needs a secure context. Both fall back to a textarea the page
// puts up rather than failing silently.
const pasteEl = document.createElement("textarea");
pasteEl.className = "rave-paste";
pasteEl.placeholder = "Paste the answer here, then press ⌘Enter / Ctrl+Enter";
pasteEl.style.display = "none";
document.body.appendChild(pasteEl);
const pasteHint = document.createElement("div");
pasteHint.className = "rave-paste-hint";
pasteHint.textContent = "⌘Enter / Ctrl+Enter to take it · Escape to close";
pasteHint.style.display = "none";
document.body.appendChild(pasteHint);
pasteEl.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    closePasteBox();
    ev.preventDefault();
  } else if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) {
    const text = pasteEl.value;
    closePasteBox();
    app.applyAiText(text);
    schedule();
    ev.preventDefault();
  }
  ev.stopPropagation();
});

function openPasteBox(text) {
  pasteEl.value = text;
  pasteEl.style.display = "block";
  pasteHint.style.display = "block";
  pasteEl.focus();
  if (text) pasteEl.select();
}

function closePasteBox() {
  pasteEl.style.display = "none";
  pasteHint.style.display = "none";
  pasteEl.value = "";
}

function fallbackCopy(text) {
  openPasteBox(text);
  try {
    document.execCommand("copy");
  } catch (e) {
    /* the person copies it themselves */
  }
}

// Ctrl+V / ⌘V anywhere while the AI sheet is up: the browser hands the text
// over without asking anyone's permission, which is the whole reason this is
// nicer than reading the clipboard.
document.addEventListener("paste", (ev) => {
  if (pasteEl.style.display === "block") return;
  if (!app.aiIsOpen || !app.aiIsOpen()) return;
  const text = (ev.clipboardData || window.clipboardData).getData("text");
  if (!text) return;
  ev.preventDefault();
  app.applyAiText(text);
  schedule();
});

const realPress = app.press.bind(app);
app.press = (id) => {
  if (id === "file:open") {
    fileEl.accept = ".json,.rave,.rave.json,.fig,application/json";
    wantFig = false;
    fileEl.click();
    return false;
  }
  // The AI menu's two doors: a canvas has no clipboard, so the page has one.
  if (id === "ai:copy") {
    const text = app.aiPrompt();
    navigator.clipboard.writeText(text).then(
      () => { app.press("ai:copied"); schedule(); },
      () => { fallbackCopy(text); },
    );
    return false;
  }
  if (id === "ai:paste") {
    // A box you can paste into, always. Reading the clipboard needs a
    // permission the browser may not give, and asking for it to show a
    // textarea anyway is a worse first move than just showing the textarea.
    openPasteBox("");
    return false;
  }
  if (id === "file:import") {
    fileEl.accept = ".fig";
    wantFig = true;
    fileEl.click();
    return false;
  }
  if (id === "file:save" && served) {
    // `rave serve` gave us a file; Save puts it back rather than handing the
    // browser a download nobody asked for.
    fetch("doc", { method: "PUT", body: app.saveMarkup() }).then(
      () => { app.press("file:saved"); schedule(); },
      () => { /* fall back to the download below on the next press */ served = false; },
    );
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
  // A .fig is bytes and a .rave.json is text — the picker is the same one,
  // and which button opened it decides how the file is read.
  if (wantFig || /\.fig$/i.test(f.name)) {
    // Ranger reads a `buffer` through a DataView it expects to find on the
    // ArrayBuffer itself.
    const ab = await f.arrayBuffer();
    if (!ab._view) ab._view = new DataView(ab);
    app.importFig(ab, f.name);
  } else if (/\.rave$/i.test(f.name) && !/\.json$/i.test(f.name)) {
    app.openMarkup(await f.text());
  } else {
    app.openJson(await f.text());
  }
  fileEl.value = "";
  schedule();
});

// --- the file, when `rave serve` is behind the page -----------------------------
// The document lives on disk; the page loads it, follows it when something
// else writes it, and writes it back on Save. That is what makes an agent
// editing the file and a person looking at the screen the same session.
async function loadServedDoc(announce) {
  let text;
  try {
    const r = await fetch("doc", { cache: "no-store" });
    if (!r.ok) return false;
    text = await r.text();
  } catch (e) {
    return false;
  }
  if (!text.trim()) return false;
  const ok = app.openMarkup(text);
  served = true;
  if (ok && announce) app.press("file:saved");
  schedule();
  return true;
}

loadServedDoc(false).then((ok) => {
  if (!ok) return;
  try {
    const events = new EventSource("events");
    events.onmessage = () => loadServedDoc(false);
  } catch (e) {
    /* no live reload, but the file still loaded */
  }
});

window.addEventListener("resize", schedule);

app.setPageSize(...sizeOfWindow());
schedule();
