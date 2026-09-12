/**
 * RangerFlow in a tab.
 *
 *   INPUT   browser event → RangerFlowWeb → FlowEditor          (here)
 *   RENDER  FlowEditor.frameJson() → EVGDisplayList → evg-webgl.js (here)
 *
 * The seam is the display list, and `evg-webgl.js` is the same renderer the
 * DataGrid page uses — this page adds no drawing code of its own. What is
 * fetched is only what a browser cannot make for itself: the font faces the
 * text runs are rasterized with, and a `.sql` file to open.
 */
import { prepareDisplayList } from "./gl/evg-webgl.js";
import { createViewKeeper } from "./gl/evg-view.js";
// The fixture this page's head started fetching before the body was parsed —
// see gallery/evg/web/tools/inline-assets.mjs, which writes that head.
import { textOf } from "./evg/assets-client.mjs";

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

// ---- what has to be built again ------------------------------------------
//
// The graph is built in ITS OWN coordinates now and the camera is a uniform
// (`gallery/evg/PLAN_VIEW_TRANSFORM.md` S2), so a pan and a zoom inside the
// band redraw the frame the GPU already holds: no walk over the diagram, no
// atlas, no upload. What still needs a new frame is a change to the PICTURE —
// a drag, a selection, a hover, a keystroke, a new document.
//
// Which is a question about what just happened, and the answer comes from the
// engine's own surface: every call into it marks the frame stale EXCEPT the
// handful that can only move the view, and a field written on it does too. The
// list below is therefore the safe way round — a reader left off it costs a
// rebuild, while a writer left off it would show a stale picture, and anything
// the page adds later is stale by default.
let sceneStale = true;
const VIEW_ONLY = new Set([
  // gestures that can only move the camera
  "wheelGesture", "pinchBegin", "pinchTo", "pinchEnd", "fitView",
  // a pointer move is one of the two, and `viewGesture` below says which
  "pointerMove",
  // and everything that only reads
  "editing", "editValue", "pendingConnect", "cursorAt", "connectMode",
  "statusText", "stats", "selfTest", "selectedId", "selectedLabel",
  "selectedRowCount", "sceneJson", "svg", "frame", "frameScene", "frameView",
  "tick", "viewGesture", "sampleText", "frameGrid",
]);

const rawApp = new (engineClass())();
const app = new Proxy(rawApp, {
  get(target, key) {
    const val = target[key];
    if (typeof val !== "function") return val;
    return (...args) => {
      if (!VIEW_ONLY.has(key)) sceneStale = true;
      const out = val.apply(target, args);
      // A pointer move is a pan while the canvas is being dragged and a hover
      // otherwise — and a hover repaints the node under it, so it is not free.
      if (key === "pointerMove" && !target.viewGesture()) sceneStale = true;
      return out;
    };
  },
  set(target, key, value) {
    sceneStale = true;
    target[key] = value;
    return true;
  },
});
let dpr = Math.min(window.devicePixelRatio || 1, 2);

// The drawing buffer has to match the element it is displayed in. When it
// does not, the browser SCALES the buffer into the element and every hit test
// in the core — which works in honest CSS pixels — points somewhere else: you
// have to click below what you can see, and the further down the canvas the
// worse it gets, which puts the zoom buttons and the minimap in the worst
// place on the surface.
//
// A `window.resize` listener alone does not see it. The canvas is `inset: 0`
// inside a `flex: 1` box, so it also changes height when the Mermaid panel
// opens, when the header wraps to a second row, when the footer grows — none
// of which resizes the window. So the element is watched instead of the
// window, which covers all of those and the window too.
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
  if (canvas.width === bw && canvas.height === bh) return;
  canvas.width = bw;
  canvas.height = bh;
  app.resize(w, h);
}

let sizeWatch = null;

/** How far the buffer has drifted from the element, as a ratio. 1 is honest. */
function sizeDrift() {
  const h = canvas.clientHeight;
  if (h === 0 || canvas.height === 0) return 1;
  return (canvas.height / dpr) / h;
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
  canvas.style.cursor = app.pendingConnect() ? "crosshair" : (app.cursorAt(x, y) || "");
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
// Three gestures arrive here as one event, and only the browser knows which
// facts distinguish them — so all three are handed over and the editor
// classifies. `ctrlKey` on a wheel is not the reader holding Ctrl: it is how
// every platform reports a trackpad pinch.
canvas.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  const [x, y] = at(ev);
  app.wheelGesture(x, y, ev.deltaX, ev.deltaY, ev.ctrlKey || ev.metaKey, ev.deltaMode === 1);
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
  if (ev.key === "Escape" && app.pendingConnect()) { app.cancelPending(); syncSelection(); }
  // While a label is being typed the hidden input has focus and owns the
  // keyboard; the shortcuts below would delete the node you are naming.
  if (ev.target === typing) return;
  if (ev.target !== document.body && ev.target !== canvas) return;
  const handled = app.keyDown(ev.key, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  if (handled) ev.preventDefault();
});

const bind = (id, fn) => document.getElementById(id).addEventListener("change", fn);

/**
 * Fit once the canvas has actually changed size.
 *
 * Showing or hiding the source panel takes a column off the canvas, and a
 * `ResizeObserver` delivers AFTER the animation-frame callbacks of the frame it
 * belongs to. Fitting in the same turn measures the width the canvas is about
 * to stop having, and the drawing ends up hanging off the right-hand edge. Two
 * frames is what it takes for the observer to have run and the new size to be
 * in.
 */
function fitSoon() {
  requestAnimationFrame(() => requestAnimationFrame(() => app.fitView()));
}
bind("scenario", (e) => {
  showSourceBox(e.target.value);
  // For the two source formats the textarea is the diagram, so it is what
  // gets drawn — otherwise the panel would show one example and the canvas
  // another.
  if (FORMATS.includes(e.target.value)) {
    renderSource();
  } else {
    app.loadScenario(e.target.value);
  }
  app.fitView();
  // …and again once the panel has finished taking or giving back its column.
  fitSoon();
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

// ---- the source panel ------------------------------------------------------
// One textarea, two formats. The panel is the whole of the browser's share of
// this: both readers, the layout and the router are in the engine bundle, and
// which reader gets the text is whatever the demo dropdown chose — not sniffed
// from the text, because a half-typed `@startuml` is not a Mermaid flowchart.
const srcBox = document.getElementById("srcbox");
const srcArea = document.getElementById("srcarea");
const exampleSel = document.getElementById("example");
const srcHint = document.getElementById("srchint");

const FORMATS = ["mermaid", "plantuml", "graphviz", "d2"];
let srcFormat = "mermaid";

const HINT = {
  mermaid: "Mermaid: flowcharts, sequence, class, state, ER, mind maps and more. Live redraw is on; Ctrl/\u2318+Enter renders now.",
  plantuml: "PlantUML: sequence, class, object, activity, component, deployment, use case. Live redraw is on; Ctrl/\u2318+Enter renders now.",
  graphviz: "Graphviz DOT: one grammar, clusters, shapes and attributes. Live redraw is on; Ctrl/\u2318+Enter renders now.",
  d2: "D2: containers, shapes, sql_table, class, sequence diagrams, vars, classes and globs. Imports are not resolved in the browser. Live redraw is on; Ctrl/\u2318+Enter renders now.",
};

/** The example dropdown, filled from whatever the engine offers this format. */
function fillExamples(format) {
  const list = engineClass().sampleList(format);
  exampleSel.replaceChildren();
  for (const entry of list.split("|")) {
    const [value, label] = entry.split("\t");
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label ?? value;
    exampleSel.append(opt);
  }
}

function showSourceBox(scenario) {
  const on = FORMATS.includes(scenario);
  srcBox.hidden = !on;
  if (!on) return;
  // Switching format is a different gallery and a different sample; coming
  // back to the same one keeps whatever was being edited.
  if (scenario !== srcFormat || !srcArea.value) {
    srcFormat = scenario;
    fillExamples(srcFormat);
    srcArea.value = engineClass().sampleText(srcFormat, exampleSel.value);
  }
  app.setSourceFormat(srcFormat);
  srcHint.textContent = HINT[srcFormat] ?? "";
}

function renderSource() {
  app.setSourceFormat(srcFormat);
  app.loadDiagram(srcArea.value, document.getElementById("srcstyle").value);
  app.fitView();
  syncControls();
}

// ---- live ------------------------------------------------------------------
// Redraw as the text is typed, which is the whole point of having the source
// next to the drawing.
//
// Three things make it bearable rather than annoying. It is DEBOUNCED, so a
// burst of keystrokes costs one parse rather than twenty. It does not FIT, so
// the page does not jump out from under somebody who zoomed in — `liveRender`
// puts the camera back where it was. And a source that parses to nothing
// changes nothing: every reader refuses an empty diagram rather than adopting
// one, so the last good drawing stays up with the reason in the status line.
const liveBox = document.getElementById("srclive");
const LIVE_DELAY = 300;
let liveTimer = 0;

function liveRender() {
  app.setSourceFormat(srcFormat);
  app.liveRender(srcArea.value, document.getElementById("srcstyle").value);
  syncControls();
}

srcArea.addEventListener("input", () => {
  clearTimeout(liveTimer);
  if (!liveBox.checked) return;
  liveTimer = setTimeout(liveRender, LIVE_DELAY);
});
// Turning it back on catches up with whatever was typed while it was off.
liveBox.addEventListener("change", () => {
  if (liveBox.checked) liveRender();
});

document.getElementById("srcrender").addEventListener("click", renderSource);
// Picking an example replaces the text and draws it: the dropdown is the
// gallery, and a gallery you have to press a second button to see is a list.
bind("example", (e) => {
  srcArea.value = engineClass().sampleText(srcFormat, e.target.value);
  renderSource();
});
// The look is a stylesheet, and switching it re-renders the same text: the
// sheet decides the fills, the paper and the edge colour in one move.
bind("srcstyle", (e) => {
  if (!app.setSourceStyle(e.target.value)) renderSource();
  app.fitView();
  syncControls();
});
// Ctrl/\u2318+Enter renders without reaching for the button.
srcArea.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
    ev.preventDefault();
    renderSource();
  }
});

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
// Adding a column puts the caret in its name, so the hidden input has to take
// focus the same way a double-click makes it.
document.getElementById("addrow").addEventListener("click", () => {
  if (app.addRow() < 0) return;
  typing.value = app.editValue();
  typing.focus({ preventScroll: true });
  typing.setSelectionRange(0, typing.value.length);
  syncSelection();
});
document.getElementById("delrow").addEventListener("click", () => {
  app.removeRow();
  typing.blur();
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
  const rows = app.selectedRowCount();
  document.getElementById("addrow").disabled = rows < 0;
  document.getElementById("delrow").disabled = rows < 1;
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

// The frame the GPU holds, and what it was built for. `keeper` is the
// arithmetic of §4 of the design: a built frame may be drawn at a view within
// a √2 band of the one it was built at, and while the window stays inside the
// region the build covered — one window of overscan each way, the same number
// `FlowView.overscan` builds for.
let sceneFrame = null;
let builtDpr = 0;
const keeper = createViewKeeper({ overscan: 1 });
const frameCounts = { builds: 0, kept: 0 };
window.__frames = frameCounts;

let lastCmds = 0;
// The paper and the background pattern. Periodic, so a pan SLIDES it: it is
// built two periods wider than the canvas and drawn at the offset the engine
// reports, and only a new period — a zoom, a resize — builds it again. Built
// into the diagram's frame instead, the same grid would be nine times the dots
// (the region is three windows across) and rebuilt on every click.
let gridFrame = null;
let gridPeriod = -1;
let gridBuiltAt = [0, 0];
let gridSize = [0, 0];

function paintOnce() {
  // One step of the force layout, if one is running. A settling graph moves
  // every frame, so it is a new frame every time; a settled one is not.
  if (app.tick()) sceneStale = true;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  // The camera, the grid's offset and the screen-anchored half. Cheap: no
  // diagram in it, which is the point — this is what a pan costs.
  const tick = JSON.parse(app.frameView());
  const view = { x: tick.view[0], y: tick.view[1], scale: tick.view[2] };
  const grid = tick.grid || [0, 0, 0];
  const sizeChanged = gridSize[0] !== w || gridSize[1] !== h;

  // ---- the paper and the pattern, slid ------------------------------------
  if (!gridFrame || grid[2] !== gridPeriod || sizeChanged || dpr !== builtDpr) {
    const gdoc = JSON.parse(app.frameGrid());
    if (gridFrame) gridFrame.dispose();
    gridFrame = prepareDisplayList(gl, gdoc, { dpr });
    gridPeriod = grid[2];
    gridBuiltAt = [grid[0], grid[1]];
    gridSize = [w, h];
  }
  const gridStats = gridFrame.draw(null, [grid[0] - gridBuiltAt[0], grid[1] - gridBuiltAt[1], 1]);

  // ---- the diagram, through the camera ------------------------------------
  const fit = keeper.fits(view, w, h);
  let cmds = lastCmds;
  if (sceneStale || !sceneFrame || !fit.keep || dpr !== builtDpr) {
    const doc = JSON.parse(app.frameScene());
    if (sceneFrame) sceneFrame.dispose();
    sceneFrame = prepareDisplayList(gl, doc, { dpr });
    keeper.built(view, w, h);
    sceneStale = false;
    cmds = doc.list.cmds.length;
    lastCmds = cmds;
    frameCounts.builds += 1;
  } else {
    frameCounts.kept += 1;
  }
  builtDpr = dpr;
  const stats = sceneFrame.draw(null, tick.view, { clear: false });

  // ---- the chrome, on top and fresh --------------------------------------
  const chrome = tick.chrome;
  let chromeStats = null;
  if (chrome && chrome.cmds && chrome.cmds.length > 0) {
    const cf = prepareDisplayList(gl, { width: tick.width, height: tick.height, list: chrome }, { dpr });
    chromeStats = cf.draw(null, null, { clear: false });
    cf.dispose();
  }
  return {
    cmds: cmds + (chrome && chrome.cmds ? chrome.cmds.length : 0),
    stats,
    chromeStats,
    gridStats,
  };
}

function frame() {
  // The drawing buffer is a property of THIS frame, so it is decided here.
  // A `ResizeObserver` alone was not enough — it depends on the browser
  // delivering an observation before the paint, and when it does not, the
  // buffer is stretched into the element and every hit test in the core
  // points somewhere else. Two integer comparisons per frame buy certainty.
  resize();
  const painted = paintOnce();
  const stats = painted.stats;
  const runs = stats.runs + (painted.chromeStats ? painted.chromeStats.runs : 0);
  const paths = stats.paths + (painted.chromeStats ? painted.chromeStats.paths : 0);
  cmdsEl.textContent =
    `${painted.cmds} cmds · ${runs} runs · ${paths} paths · ` +
    `${frameCounts.kept} kept/${frameCounts.builds} built`;
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
  // Setting the drawing buffer does not change the element's CSS size, so
  // this cannot loop; `resize` returns early when nothing actually moved.
  if (typeof ResizeObserver === "function") {
    // Kept in a variable on purpose: an observer with no reference to it is
    // a well-known way to have one collected out from under you.
    sizeWatch = new ResizeObserver(() => resize());
    sizeWatch.observe(canvas);
  }
  // The schema fixture is the only thing the page cannot make for itself. It
  // is handed over once and kept, so the scenario picker can come back to it.
  app.setFixtureSql(await textOf("ecommerce.sql"));

  const params = new URLSearchParams(location.search);
  const wanted = params.get("scenario") || "erd";
  document.getElementById("scenario").value = wanted;
  showSourceBox(wanted);
  // `?example=class` opens the gallery on one of them, so a screenshot of a
  // sample is a URL rather than two clicks.
  const example = params.get("example");
  if (example && FORMATS.includes(wanted)) {
    exampleSel.value = example;
    if (exampleSel.value === example) {
      srcArea.value = engineClass().sampleText(wanted, example);
    }
  }
  // `?look=dark` picks the stylesheet on load, for the same reason.
  const look = params.get("look");
  if (look) {
    document.getElementById("srcstyle").value = look;
    app.sourceStyle = look;
  }
  if (FORMATS.includes(wanted)) {
    renderSource();
  } else {
    app.loadScenario(wanted);
  }
  syncControls();
  app.fitView();
  fitSoon();

  if (new URLSearchParams(location.search).has("selftest")) {
    // No browser-driver library here, so the page tests itself and writes the
    // verdict where headless Chrome's --dump-dom can read it back.
    // "backend: webgl2" is a label the page writes about itself, so the
    // self test checks the facts under it: that the context really is a
    // WebGL2RenderingContext, that it has the stencil buffer a filled path
    // needs, that the scene left GL draw calls behind, and that no fill was
    // skipped for want of one.
    // One frame first: the ResizeObserver runs after the layout that opened
    // the source panel, so measuring before it would report a drift the
    // reader never sees.
    // The layout has to settle first. `showSourceBox` above narrowed the
    // canvas, and a `ResizeObserver` delivers AFTER the animation-frame
    // callbacks of the frame it belongs to — so one awaited frame is not
    // enough and two are. Only when it is actually needed: every awaited
    // frame here is virtual time the headless harness has to have left over.
    for (let i = 0; i < 2; i += 1) {
      if (Math.abs(sizeDrift() - 1) < 0.005) break;
      await new Promise((go) => requestAnimationFrame(go));
    }
    // Measured BEFORE the verdict is revealed: the `<pre>` below the footer
    // takes its room from the canvas, so showing it is itself a resize, and
    // reading the drift afterwards would report one the reader never sees.
    const drift = sizeDrift();
    const line = app.selfTest();
    const glOk = gl instanceof WebGL2RenderingContext;
    const stencil = gl.getContextAttributes().stencil === true;
    const painted = paintOnce();
    // Three frames make one canvas now \u2014 the pattern, the diagram, the chrome
    // \u2014 so what the page reports about "how much was drawn" is the sum. Read
    // from one frame it would say a schema was nearly empty.
    const sumOf = (key) =>
      (painted.stats[key] || 0) + (painted.gridStats ? painted.gridStats[key] || 0 : 0) +
      (painted.chromeStats ? painted.chromeStats[key] || 0 : 0);
    const stats = {
      drawn: sumOf("drawn"),
      paths: sumOf("paths"),
      runs: sumOf("runs"),
      skippedFills: sumOf("skippedFills"),
    };

    // ---- the camera, checked rather than described -------------------------
    //
    // The claim is that a pan and a zoom inside the band redraw the frame the
    // GPU already holds, and that everything else builds a new one. Both
    // halves matter: a policy that never rebuilt would be fast and show a
    // stale diagram, which is the failure this cannot be allowed to have.
    const camera = [];
    const say = (name, cond, detail) =>
      camera.push((cond ? "ok " : "FAIL ") + name + (detail ? " (" + detail + ")" : ""));
    paintOnce();
    {
      const before = frameCounts.builds;
      for (let i = 0; i < 6; i += 1) {
        app.wheelGesture(200, 200, -40, 0, false, false); // a pan, not a zoom
        paintOnce();
      }
      // A force layout that is still settling moves the graph every frame, so
      // there is no frame to keep and nothing for this to say.
      const settling = rawApp.simRunning === true;
      say("a pan keeps the frame", settling || frameCounts.builds === before,
          settling ? "the layout is still settling"
                   : before + " \u2192 " + frameCounts.builds + " builds");
    }
    {
      // A click changes the picture — the node under it takes a selection
      // border — so it has to cost a frame.
      const before = frameCounts.builds;
      app.pointerDown(300, 200, false, false);
      app.pointerUp(300, 200, false, false);
      paintOnce();
      say("a click builds a new one", frameCounts.builds > before,
          before + " \u2192 " + frameCounts.builds);
    }
    {
      // And so does a zoom past the band: the atlas was rasterised at a size
      // and the curves were flattened for one.
      const before = frameCounts.builds;
      for (let i = 0; i < 8; i += 1) {
        app.wheelGesture(400, 300, 0, -120, true, false); // ctrl+wheel = zoom
      }
      paintOnce();
      say("a zoom past the band rebuilds", frameCounts.builds > before,
          before + " \u2192 " + frameCounts.builds);
      app.fitView();
      paintOnce();
    }
    {
      // ---- THE PICTURE ITSELF, both ways ----------------------------------
      //
      // Everything above counts commands and builds. This reads the canvas
      // back: the three frames the page now draws \u2014 the pattern slid, the
      // diagram through the camera, the chrome on top \u2014 against ONE list with
      // the camera multiplied in, which is what this page drew before and what
      // every exporter still emits. A camera that is off by a pan, a grid slid
      // the wrong way, a chrome list drawn with a clear: all of them pass every
      // other check on this page and none of them survives this one.
      const W = canvas.width, H = canvas.height;
      const read = () => {
        const px = new Uint8Array(W * H * 4);
        gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
        return px;
      };
      const bothWays = () => {
        paintOnce();
        const a = read();
        const baked = JSON.parse(app.sceneJson());
        const bf = prepareDisplayList(gl, baked, { dpr });
        bf.draw(null);
        bf.dispose();
        return [a, read()];
      };
      // THE THREE-PIXEL BORDER IS LEFT OUT, and it is the one place the two are
      // expected to differ: the baked paper ends exactly at the canvas edge and
      // is antialiased there, while the pattern frame's paper is padded so it
      // can be slid, so it covers that row completely.
      const differ = (a, b) => {
        let worst = 0, off = 0;
        for (let y = 3; y < H - 3; y += 1) {
          for (let x = 3; x < W - 3; x += 1) {
            const i = (y * W + x) * 4;
            for (let k = 0; k < 4; k += 1) {
              const d = Math.abs(a[i + k] - b[i + k]);
              if (d > worst) worst = d;
              if (d > 8) off += 1;
            }
          }
        }
        return { worst, pct: (100 * off) / (W * H * 4) };
      };
      // Where the ink is, which is the question a difference of antialiasing
      // cannot change: a camera off by a pan or a scale moves this box.
      //
      // INK MEANS INK, not the pale edge of a hairline: at a sixth of a zoom a
      // one-pixel rule lands between pixels and the two roads spread it
      // differently, so a threshold near the paper would report a stray
      // 190-grey pixel as the top of the diagram and this would measure
      // antialiasing instead of geometry.
      const inkBox = (px) => {
        let x0 = W, y0 = H, x1 = -1, y1 = -1;
        for (let y = 3; y < H - 3; y += 1) {
          for (let x = 3; x < W - 3; x += 1) {
            const i = (y * W + x) * 4;
            if (px[i] < 150 || px[i + 1] < 150 || px[i + 2] < 150) {
              if (x < x0) x0 = x; if (x > x1) x1 = x;
              if (y < y0) y0 = y; if (y > y1) y1 = y;
            }
          }
        }
        return [x0, y0, x1, y1];
      };

      // AT UNIT ZOOM THE TWO ARE THE SAME PICTURE, to the last bit. This is
      // the check with no slack in it: the glyph atlas is rasterised at the
      // same size on both roads, so anything that differs here is geometry.
      app.fitView();
      rawApp.editor.view.viewport.zoom = 1;
      sceneStale = true;
      const [camOne, bakedOne] = bothWays();
      const one = differ(camOne, bakedOne);
      say("at unit zoom the camera draws the baked picture", one.pct < 0.2,
          `worst ${one.worst}, ${one.pct.toFixed(3)}% of the interior differs`);

      // AND AT THE DIAGRAM'S OWN ZOOM the ink lands in the same place. Not the
      // same pixels: a glyph rasterised for a frame built at 0.2 and then drawn
      // through the camera is not bit-identical to one rasterised at the size
      // the walk baked in, and neither is a hairline that lands between pixels.
      // What must not change is WHERE the diagram is, and that is the box.
      app.fitView();
      sceneStale = true;
      const [camFit, bakedFit] = bothWays();
      const a = inkBox(camFit), b = inkBox(bakedFit);
      const slip = Math.max(...a.map((v, i) => Math.abs(v - b[i])));
      say("and at the diagram's own zoom the ink is in the same place", slip <= 2,
          `camera ${a.join(",")} vs baked ${b.join(",")}`);
    }
    {
      // The chrome is a list of its own and is NOT in the graph's frame: it is
      // built every frame, which is why a ruler stays 18 pixels wide while the
      // diagram under it zooms.
      const f = JSON.parse(app.frameView());
      const hasChrome = !!(f.chrome && f.chrome.cmds);
      const g = JSON.parse(app.frameScene());
      say("the frame carries a camera", Array.isArray(f.view) && f.view.length === 3,
          JSON.stringify(f.view));
      say("the chrome is its own list", hasChrome, hasChrome ? f.chrome.cmds.length + " commands" : "none");
      say("the graph is not in it", (g.list.cmds.length > (f.chrome.cmds.length || 0)),
          g.list.cmds.length + " vs " + (f.chrome.cmds.length || 0));
      // A pan's payload: the camera and the chrome, against the diagram.
      say("a pan's payload is the camera, not the diagram",
          app.frameView().length * 3 < app.frameScene().length,
          app.frameView().length + " vs " + app.frameScene().length + " bytes");
    }

    selfTestEl.hidden = false;
    // `drift` is the one number that says whether what you see is where you
    // can click: the drawing buffer against the element it is scaled into.
    selfTestEl.textContent =
      `${line}\nwebgl2=${glOk} stencil=${stencil} quads=${stats.drawn} ` +
      `paths=${stats.paths} runs=${stats.runs} skippedFills=${stats.skippedFills} ` +
      `drift=${drift.toFixed(3)}\ncamera: ${camera.join(" | ")}`;
  }
  requestAnimationFrame(frame);
}

boot().catch((err) => {
  statusEl.textContent = "failed: " + err.message;
  throw err;
});
