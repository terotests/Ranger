/**
 * RangerFlow in a tab.
 *
 *   INPUT   browser event → RangerFlowWeb → FlowEditor          (here)
 *   RENDER  FlowEditor.sceneJson() → EVGDisplayList → evg-webgl.js (here)
 *
 * The seam is the display list, and `evg-webgl.js` is the same renderer the
 * DataGrid page uses — this page adds no drawing code of its own. What is
 * fetched is only what a browser cannot make for itself: the font faces the
 * text runs are rasterized with, and a `.sql` file to open.
 */
import { renderDisplayList } from "./gl/evg-webgl.js";

// If the import above 404s, nothing below runs and the only evidence is a line
// in the network panel. The page watches for this instead.
window.__pageStarted = true;

const canvas = document.getElementById("screen");
const statusEl = document.getElementById("status");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const fpsEl = document.getElementById("fps");
const selfTestEl = document.getElementById("selftest");

const gl = canvas.getContext("webgl2", {
  antialias: true,
  premultipliedAlpha: false,
  stencil: true,
});
if (!gl) {
  statusEl.textContent = "WebGL 2 not available";
  throw new Error("WebGL 2 required");
}
backendEl.textContent = "webgl2";

const FONTS = [
  ["Noto Sans", "NotoSans-Regular.ttf", 400, "normal"],
  ["Noto Sans", "NotoSans-Bold.ttf", 700, "normal"],
  ["Noto Sans", "NotoSans-Italic.ttf", 400, "italic"],
];

async function loadFonts() {
  await Promise.all(FONTS.map(async ([family, file, weight, style]) => {
    const face = new FontFace(family, `url(./fonts/${file})`, { weight, style });
    await face.load();
    document.fonts.add(face);
  }));
}

/** The engine is a classic <script> beside this module, and it is BUILT
 *  rather than checked in; when the tag 404s the first mention of it is a bare
 *  `RangerFlowWeb is not defined` with no hint that a build step was skipped. */
function engineClass() {
  const cls = globalThis.RangerFlowWeb;
  if (typeof cls !== "function") {
    statusEl.textContent =
      "rangerflow_web.js is missing — run: npm run rangerflow:web";
    throw new Error("engine bundle not loaded");
  }
  return cls;
}

const app = new (engineClass())();
let dpr = Math.min(window.devicePixelRatio || 1, 2);

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  app.resize(w, h);
}

// ---- input ---------------------------------------------------------------
// The editor works in CSS pixels; the canvas is in device pixels. Converting
// once here keeps every hit test in the core honest at any zoom level.
function at(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

// Two fingers on the surface. The browser gives us a pointer per finger and
// nothing else; the pinch itself — what the zoom becomes, and what stays
// still while it changes — is the editor's arithmetic, not this file's.
const touches = new Map();

function pinchPair() {
  const live = [...touches.values()];
  return live.length === 2 ? live : null;
}

canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture(ev.pointerId);
  const [x, y] = at(ev);
  if (ev.pointerType === "touch") {
    touches.set(ev.pointerId, [x, y]);
    const pair = pinchPair();
    if (pair) {
      // The second finger cancels whatever the first one had started —
      // otherwise a pinch drags a node across the diagram as it zooms.
      app.pointerUp(x, y, false, false);
      app.pinchBegin(pair[0][0], pair[0][1], pair[1][0], pair[1][1]);
      return;
    }
  }
  const wasEditing = app.editing();
  app.pointerDown(x, y, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  // The core ends the edit when the press lands elsewhere; the hidden input
  // has to hear about it or it keeps the keyboard.
  if (wasEditing && !app.editing()) typing.blur();
});
canvas.addEventListener("pointermove", (ev) => {
  const [x, y] = at(ev);
  if (touches.has(ev.pointerId)) {
    touches.set(ev.pointerId, [x, y]);
    const pair = pinchPair();
    if (pair) {
      app.pinchTo(pair[0][0], pair[0][1], pair[1][0], pair[1][1]);
      return;
    }
  }
  app.pointerMove(x, y, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  canvas.style.cursor = app.cursorAt(x, y) || "";
});
canvas.addEventListener("pointerup", (ev) => {
  const [x, y] = at(ev);
  if (touches.delete(ev.pointerId)) {
    app.pinchEnd();
    if (touches.size > 0) return;
  }
  app.pointerUp(x, y, ev.shiftKey, ev.ctrlKey || ev.metaKey);
});
canvas.addEventListener("pointercancel", (ev) => {
  if (touches.delete(ev.pointerId)) app.pinchEnd();
});
canvas.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  const [x, y] = at(ev);
  app.wheel(x, y, Math.sign(ev.deltaY));
}, { passive: false });
// The right-hand button. The menu is drawn on the canvas by the view, so the
// browser's own menu has to be suppressed — and the press has to reach the
// editor, which is what decides what the menu says.
canvas.addEventListener("contextmenu", (ev) => {
  ev.preventDefault();
  const [x, y] = at(ev);
  app.contextDown(x, y);
  syncSelection();
});

// ---- typing into a label -------------------------------------------------
// The canvas cannot receive composed characters, dead keys, or anything a
// phone's keyboard produces. A real <input> can, so one sits offscreen, takes
// focus while a label is being edited, and has its value mirrored into the
// editor on every input event. The editor still owns the model — the input is
// a keyboard, not a source of truth.
const typing = document.getElementById("typing");

function startEditing(x, y) {
  if (!app.beginEditAt(x, y)) return false;
  typing.value = app.editValue();
  typing.focus({ preventScroll: true });
  typing.setSelectionRange(typing.value.length, typing.value.length);
  syncSelection();
  return true;
}

function stopEditing(commit) {
  if (!app.editing()) return;
  if (commit) app.commitEdit(); else app.cancelEdit();
  typing.blur();
  syncSelection();
}

canvas.addEventListener("dblclick", (ev) => {
  ev.preventDefault();
  const [x, y] = at(ev);
  startEditing(x, y);
});

typing.addEventListener("input", () => {
  if (!app.editing()) return;
  app.setEditText(typing.value, typing.selectionStart ?? typing.value.length);
});

// Caret moves that produce no input still have to reach the editor, or the bar
// on screen stops agreeing with the one the browser is keeping.
for (const evName of ["keyup", "click", "select"]) {
  typing.addEventListener(evName, () => {
    if (!app.editing()) return;
    app.setEditText(typing.value, typing.selectionStart ?? typing.value.length);
  });
}

typing.addEventListener("keydown", (ev) => {
  if (!app.editing()) return;
  if (ev.key === "Escape") { ev.preventDefault(); stopEditing(false); }
  else if (ev.key === "Enter" || ev.key === "Tab") { ev.preventDefault(); stopEditing(true); }
});

typing.addEventListener("blur", () => stopEditing(true));

window.addEventListener("keydown", (ev) => {
  // While a label is being typed the hidden input has focus and owns the
  // keyboard; the shortcuts below would delete the node you are naming.
  if (ev.target === typing) return;
  if (ev.target !== document.body && ev.target !== canvas) return;
  const handled = app.keyDown(ev.key, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  if (handled) ev.preventDefault();
});

const bind = (id, fn) => document.getElementById(id).addEventListener("change", fn);
bind("scenario", (e) => {
  app.loadScenario(e.target.value);
  app.fitView();
  // Each scenario picks the layout and notation that suit it; the controls
  // have to say what the app actually did, or the next change reads as a
  // no-op because the dropdown already showed the value.
  syncControls();
});
bind("layout", (e) => app.setLayout(e.target.value));
bind("notation", (e) => app.setNotation(e.target.value));
bind("edgetype", (e) => app.setEdgeType(e.target.value));
bind("bg", (e) => app.setBackgroundVariant(Number(e.target.value)));
bind("theme", (e) => app.setTheme(e.target.value));
bind("snap", (e) => app.setSnap(e.target.checked));
bind("rulers", (e) => app.setRulers(e.target.checked));
bind("bridges", (e) => app.setBridges(e.target.checked));
document.getElementById("fit").addEventListener("click", () => app.fitView());

document.getElementById("svg").addEventListener("click", () => {
  const blob = new Blob([app.svg()], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "rangerflow.svg";
  a.click();
  URL.revokeObjectURL(a.href);
});

// ---- the editing toolbar -------------------------------------------------
// Every button here calls one method on the app, which calls one method on the
// editor: the browser owns no editing logic at all, which is what lets the
// same authoring run in the SDL host and in a headless test.
const renameEl = document.getElementById("rename");
const connectBtn = document.getElementById("connect");

/** A readable default name, so a new box is never called "node 7". */
const SHAPE_NAMES = {
  rect: "Vaihe", stadium: "Alku", diamond: "Ehto?", parallelogram: "Syöte",
  cylinder: "Tietokanta", document: "Tuloste", trapezoid: "Käsin",
  hexagon: "Valmistelu", predefined: "Aliohjelma", circle: "A", note: "Huomio",
  sort: "Lajittele", collate: "Kokoa", or: "TAI", papertape: "Reikänauha",
  directdata: "Levy", sequentialdata: "Nauha", multidocument: "Tulosteet",
  internalstorage: "Muisti", action: "Toiminto", sendsignal: "Lähetä",
  receivesignal: "Vastaanota",
};

for (const btn of document.querySelectorAll("#tools .shape")) {
  btn.addEventListener("click", () => {
    const shape = btn.dataset.shape;
    app.addNode(SHAPE_NAMES[shape] || "Vaihe", shape);
    syncSelection();
  });
}

connectBtn.addEventListener("click", () => {
  const on = !app.connectMode();
  app.setConnectMode(on);
  connectBtn.classList.toggle("on", on);
});

document.getElementById("del").addEventListener("click", () => {
  app.deleteSelection();
  syncSelection();
});
document.getElementById("rotate").addEventListener("click", () => {
  app.rotateSelected();
  syncSelection();
});
document.getElementById("dup").addEventListener("click", () => {
  app.duplicateSelection();
  syncSelection();
});
document.getElementById("undo").addEventListener("click", () => {
  app.undo();
  syncSelection();
});
document.getElementById("redo").addEventListener("click", () => {
  app.redo();
  syncSelection();
});

// Typing in the name field renames as you type: no Enter to remember, and no
// modal dialog over a canvas that is showing you the thing you are naming.
renameEl.addEventListener("input", () => {
  if (renameEl.disabled) return;
  app.renameSelected(renameEl.value);
});

/** The name field follows the selection, unless the caret is in it. */
function syncSelection() {
  const id = app.selectedId();
  const has = id.length > 0;
  renameEl.disabled = !has;
  if (document.activeElement === renameEl) return;
  renameEl.value = has ? app.selectedLabel() : "";
  renameEl.placeholder = has ? "" : "select a node";
}

canvas.addEventListener("pointerup", () => syncSelection());

// A schema the user picks is read in this tab and never uploaded anywhere.
document.getElementById("file").addEventListener("change", async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  app.loadSql(await file.text());
  app.fitView();
});

// ---- frame loop ----------------------------------------------------------
let frames = 0, lastFps = performance.now();

function frame() {
  const doc = JSON.parse(app.frame());
  const stats = renderDisplayList(gl, doc, { dpr });
  cmdsEl.textContent =
    `${doc.list.cmds.length} cmds · ${stats.runs} runs · ${stats.paths} paths`;
  statusEl.textContent = app.statusText() + " · " + app.stats();
  frames += 1;
  const now = performance.now();
  if (now - lastFps > 500) {
    fpsEl.textContent = (frames * 1000 / (now - lastFps)).toFixed(0) + " fps";
    frames = 0;
    lastFps = now;
  }
  requestAnimationFrame(frame);
}

/** Put the controls back in step with whatever the app decided. */
function syncControls() {
  document.getElementById("layout").value = app.layoutName;
  document.getElementById("notation").value = app.editor.view.notation;
  document.getElementById("theme").value = app.editor.view.theme.name;
  connectBtn.classList.toggle("on", app.connectMode());
  document.getElementById("rulers").checked = app.editor.view.showRulers;
  document.getElementById("bridges").checked = app.editor.view.bridgeEdges;
  syncSelection();
}

async function boot() {
  await loadFonts();
  resize();
  window.addEventListener("resize", resize);
  // The schema fixture is the only thing the page cannot make for itself. It
  // is handed over once and kept, so the scenario picker can come back to it.
  const res = await fetch("./ecommerce.sql");
  app.setFixtureSql(await res.text());

  const params = new URLSearchParams(location.search);
  const wanted = params.get("scenario") || "erd";
  document.getElementById("scenario").value = wanted;
  app.loadScenario(wanted);
  syncControls();
  app.fitView();

  if (new URLSearchParams(location.search).has("selftest")) {
    // No browser-driver library here, so the page tests itself and writes the
    // verdict where headless Chrome's --dump-dom can read it back.
    // "backend: webgl2" is a label the page writes about itself, so the
    // self test checks the facts under it: that the context really is a
    // WebGL2RenderingContext, that it has the stencil buffer a filled path
    // needs, that the scene left GL draw calls behind, and that no fill was
    // skipped for want of one.
    const line = app.selfTest();
    const glOk = gl instanceof WebGL2RenderingContext;
    const stencil = gl.getContextAttributes().stencil === true;
    const doc = JSON.parse(app.sceneJson());
    const stats = renderDisplayList(gl, doc, { dpr });
    selfTestEl.hidden = false;
    selfTestEl.textContent =
      `${line}\nwebgl2=${glOk} stencil=${stencil} quads=${stats.drawn} ` +
      `paths=${stats.paths} runs=${stats.runs} skippedFills=${stats.skippedFills}`;
  }
  requestAnimationFrame(frame);
}

boot().catch((err) => {
  statusEl.textContent = "failed: " + err.message;
  throw err;
});
