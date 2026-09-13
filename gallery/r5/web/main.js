// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The browser host for r5. It owns what a browser owns and nothing else:
//
//   the frame    — one WebGL 2 context. The document is drawn first, through
//                  the camera the engine keeps, moved to where the app's
//                  layout put the pane; the app's chrome is drawn over it
//                  with the canvas kept. One canvas, two frames.
//   the pointer  — on the canvas it is the app's (rail, bar, sheets, editor);
//                  over the pane it is the document's, through the same host
//                  modules the pptx and docx pages use.
//   the keyboard — a hidden field holding the caret's line, the technique
//                  Monaco and CodeMirror 5 use: IME composition, dead keys, a
//                  phone's keyboard and the paste event all arrive for free.
//   the fetches  — fonts, presets, templates, samples, the picture.
//   the files    — the picker in, the downloads out.
//
// Everything else — what a press means, which pane has the keyboard, what a
// patch does to the other view, every export — is R5App.rgr's, and the
// headless check (smoke.mjs) drives this same page.

import { prepareDisplayList, setFontFallback } from "./gl/evg-webgl.js";
import { createA11yMirror, pressAtCentre } from "./gl/evg-a11y.js";
import { attachPointer as attachDeckPointer, attachKeys as attachDeckKeys } from "./host/pptx-host.mjs";
import { attachPointer as attachDocPointer, attachKeys as attachDocKeys } from "./host/docx-host.mjs";

const stage = document.getElementById("stage");
const canvas = document.getElementById("c");
const paneEl = document.getElementById("pane");
const keys = document.getElementById("keys");
const hintEl = document.getElementById("hint");
const errEl = document.getElementById("err");
const filePick = document.getElementById("filepick");

const FACES = [
  ["Open Sans", "OpenSans-Regular.ttf"],
  ["Open Sans-Bold", "OpenSans-Bold.ttf"],
  ["Open Sans-Italic", "OpenSans-Italic.ttf"],
  ["Open Sans-BoldItalic", "OpenSans-BoldItalic.ttf"],
  ["Noto Sans", "NotoSans-Regular.ttf"],
  ["Noto Sans-Bold", "NotoSans-Bold.ttf"],
];
const THEMES = { corporate: "./themes/corporate.css", editorial: "./themes/editorial.css" };
const SAMPLES = {
  mermaid: "./samples/mermaid.md",
  diagrams: "./samples/diagrams.md",
  picture: "./samples/picture.md",
  deck: "./samples/deck.md",
  sample: "./samples/sample.md",
  readme: "./samples/README.md",
};

function fail(e) {
  errEl.textContent = String((e && e.stack) || e);
  console.error(e);
}

/** Ranger's `buffer` is an ArrayBuffer with a DataView hung off it. */
function asRangerBuffer(ab) {
  ab._view = new DataView(ab);
  return ab;
}

function pngSize(ab) {
  const d = new DataView(ab);
  if (d.byteLength < 24 || d.getUint32(0) !== 0x89504e47) return [0, 0];
  return [d.getUint32(16), d.getUint32(20)];
}

async function bytesOf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + " → " + res.status);
  return await res.arrayBuffer();
}

async function textOf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + " → " + res.status);
  return await res.text();
}

function engineClass() {
  const cls = globalThis.R5App;
  if (typeof cls !== "function") {
    hintEl.textContent = "r5_app.js is missing.\nRun `npm run r5:web` and serve the dist/ directory it writes.";
    throw new Error("engine bundle not loaded");
  }
  return cls;
}

const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true });
if (!gl) {
  hintEl.textContent = "WebGL 2 is not available in this browser.";
  throw new Error("no WebGL 2");
}

const app = new (engineClass())();
window.__r5 = app;

let dpr = Math.min(window.devicePixelRatio || 1, 2);
let W = 0;
let H = 0;
let needsPaint = true;
let lastRev = "";

// --- the window ---------------------------------------------------------------
// The page IS the window. A phone's keyboard shrinks the visual viewport, and
// the editor has to stay above it, so that is the size the app is told —
// not the layout viewport the keyboard is covering.
function sizeOfWindow() {
  // `?page=390x800` is a phone's window on a desk, for a screenshot: headless
  // Chrome will not open a window narrower than about 500px.
  const forced = /^(\d+)x(\d+)$/.exec(new URLSearchParams(location.search).get("page") || "");
  if (forced) return [parseInt(forced[1], 10), parseInt(forced[2], 10)];
  const vv = window.visualViewport;
  const w = Math.max(320, Math.floor(vv ? vv.width : window.innerWidth));
  const h = Math.max(360, Math.floor(vv ? vv.height : window.innerHeight));
  return [w, h];
}

let coarse = false;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const [w, h] = sizeOfWindow();
  const nowCoarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  if (w === W && h === H && nowCoarse === coarse && canvas.width === Math.round(w * dpr)) return;
  W = w;
  H = h;
  coarse = nowCoarse;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  stage.style.width = `${w}px`;
  stage.style.height = `${h}px`;
  app.setPointerCoarse(coarse);
  app.setPageSize(w, h);
  dropDocFrame();
  needsPaint = true;
}

// --- the pictures the painter needs -------------------------------------------
const pictures = new Map();
async function registerPicture(path, bytes, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { pictures.set(path, img); resolve(); };
    img.onerror = () => { pictures.set(path, null); resolve(); };
    img.src = url;
  });
}

// --- painting -----------------------------------------------------------------
// THE DOCUMENT IS BUILT ONCE AND SCROLLED WITH A CAMERA. `docViewFrame()` is
// the camera, the caret and a build number; `docFrame()` is all of that with
// the document's commands, and is asked for only when the build number moves.
// The chrome is small and is built every time something in it changed.
let docFrame = null;
let docRev = -1;
let docDpr = 0;
let docW = 0;
let docH = 0;
let pane = { shown: false, x: 0, y: 0, w: 0, h: 0, view: "md", editor: false, menu: false, focus: "editor" };
const frameCounts = { builds: 0, kept: 0 };
window.__frames = frameCounts;

function dropDocFrame() {
  if (docFrame) docFrame.dispose();
  docFrame = null;
  docRev = -1;
}

function placePane() {
  const shown = pane.shown && !pane.menu;
  paneEl.style.display = shown ? "block" : "none";
  paneEl.style.left = `${pane.x}px`;
  paneEl.style.top = `${pane.y}px`;
  paneEl.style.width = `${pane.w}px`;
  paneEl.style.height = `${pane.h}px`;
}

function drawDocument(tick) {
  const stale = !docFrame || tick.rev !== docRev || dpr !== docDpr || pane.w !== docW || pane.h !== docH;
  if (stale) {
    dropDocFrame();
    const doc = JSON.parse(app.docFrame());
    // The list is laid out for the pane; the shaders map page coordinates
    // to the CANVAS, so the frame is told the canvas's size and the camera
    // below moves the document into the pane.
    doc.width = W;
    doc.height = H;
    docFrame = prepareDisplayList(gl, doc, { dpr, images: pictures });
    docRev = tick.rev;
    docDpr = dpr;
    docW = pane.w;
    docH = pane.h;
    frameCounts.builds += 1;
  } else {
    frameCounts.kept += 1;
  }
  const v = tick.view || [0, 0, 1];
  docFrame.draw(null, [v[0] + pane.x, v[1] + pane.y, v[2] || 1]);
  const chrome = tick.chrome;
  if (chrome && chrome.cmds && chrome.cmds.length > 0) {
    const cf = prepareDisplayList(gl, { width: W, height: H, list: chrome }, { dpr });
    cf.draw(null, [pane.x, pane.y, 1], { clear: false });
    cf.dispose();
  }
}

function paintOnce() {
  errEl.textContent = "";
  const chromeDoc = JSON.parse(app.chromeJson());
  pane = JSON.parse(app.paneRectJson());
  placePane();
  bindEditorHost(pane.shown ? pane.view : "");
  window.__lastChrome = chromeDoc;
  const tick = pane.shown ? JSON.parse(app.docViewFrame()) : null;
  // Two frames share one glyph atlas, and a kept frame is only good while the
  // atlas it was built against stands: a chrome that brought new runs may
  // have grown or rebuilt it under the document. The chrome's build says
  // whether it added anything; when it did, the document is built again on
  // the atlas as it now is and the whole picture is drawn once more.
  for (let pass = 0; pass < 2; pass += 1) {
    if (tick) drawDocument(tick);
    const cf = prepareDisplayList(gl, chromeDoc, { dpr });
    const stats = cf.draw(null, null, { clear: !tick });
    cf.dispose();
    const moved = !!(stats && (stats.atlasRebuilt || stats.atlasAdded > 0));
    if (!tick || !moved) break;
    dropDocFrame();
  }
  mirrorA11y();
}

function paint() {
  try {
    const rev = app.revision();
    if (needsPaint || rev !== lastRev) {
      needsPaint = false;
      lastRev = rev;
      paintOnce();
      // Building the document can move the camera or the page count.
      const after = app.revision();
      if (after !== rev) {
        lastRev = after;
        paintOnce();
      }
    }
  } catch (e) {
    fail(e);
  }
  requestAnimationFrame(paint);
}
window.__redraw = () => { needsPaint = true; paintOnce(); };

// --- the accessibility mirror -------------------------------------------------
let generation = 0;
const mirror = createA11yMirror(stage, {
  canvas,
  label: "r5 markdown",
  onActivate: (node) => pressAtCentre(node, (x, y) => {
    app.press(app.hitId(x, y));
    afterInput();
  }),
});
function mirrorA11y() {
  generation += 1;
  const tree = JSON.parse(app.a11yJson(generation, ""));
  tree.byId = new Map(tree.nodes.map((n) => [n.id, n]));
  mirror.update(tree);
}

// --- what the app asks the page to do -----------------------------------------
function deliver(bytes, name, mime) {
  const view = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  if (!view || !view.length) return "empty";
  const blob = new Blob([view], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
window.__lastDownload = "";

let docName = "markdown";

// The PDF of whatever is on screen: the sheets of the markdown, the slides
// as the reader left them, or the Word pages as the reader left them.
function pdfOfView() {
  const screen = app.currentScreen();
  if (screen === "deck") return app.md.deckPdf();
  if (screen === "doc") return app.md.docPdf();
  return app.md.pdf();
}

async function openSample(key) {
  const url = SAMPLES[key];
  if (!url) return;
  try {
    const text = await textOf(url);
    docName = key;
    app.setSource(text, key);
    dropDocFrame();
    needsPaint = true;
  } catch (e) {
    fail(e);
  }
}

async function handleRequests() {
  for (;;) {
    const r = app.takeRequest();
    if (!r) break;
    try {
      if (r === "open-file") {
        filePick.click();
      } else if (r === "download:pdf") {
        window.__lastDownload = deliver(pdfOfView(), docName + ".pdf", "application/pdf");
      } else if (r === "download:html") {
        window.__lastDownload = deliver(new TextEncoder().encode(app.md.html()), docName + ".html", "text/html");
      } else if (r === "download:pptx") {
        window.__lastDownload = deliver(app.md.pptx(), docName + ".pptx",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation");
      } else if (r.startsWith("sample:")) {
        await openSample(r.slice(7));
      } else if (r.startsWith("theme:")) {
        const key = r.slice(6);
        if (THEMES[key]) {
          const text = await textOf(THEMES[key]);
          app.addTextFile("/themes/" + key + ".css", text);
          app.applyTemplate(key, text);
        }
      }
    } catch (e) {
      fail(e);
    }
    needsPaint = true;
  }
}

filePick.addEventListener("change", async () => {
  const file = filePick.files && filePick.files[0];
  if (!file) return;
  const text = await file.text();
  docName = file.name.replace(/\.(md|markdown|txt)$/i, "") || "markdown";
  app.setSource(text, docName);
  dropDocFrame();
  needsPaint = true;
  filePick.value = "";
});

// --- the keyboard ---------------------------------------------------------------
// The field holds the caret's LINE with the caret in the right column while
// the editor has the keyboard, so a screen reader announces the line and an
// IME composes against real text. Over the preview it is a funnel: emptied
// after each input.
let mirroring = false;
function mirrorLine() {
  if (app.focusTarget() !== "editor") {
    if (keys.value !== "") keys.value = "";
    return;
  }
  mirroring = true;
  const line = app.currentLine();
  if (keys.value !== line) keys.value = line;
  const col = Math.max(0, Math.min(line.length, app.caretCol()));
  let from = col;
  let to = col;
  if (app.hasSelection() && app.anchorLine() === app.caretLine()) {
    const anchor = Math.max(0, Math.min(line.length, app.anchorCol()));
    from = Math.min(anchor, col);
    to = Math.max(anchor, col);
  }
  try { keys.setSelectionRange(from, to); } catch (_) { /* detached */ }
  mirroring = false;
}

function focusKeys(where) {
  app.setFocus(where);
  keys.focus({ preventScroll: true });
  mirrorLine();
  restartBlink();
}

// The caret's blink is the page's clock, not the engine's: a caret that
// blinked inside the module would redraw a document nobody is looking at.
let blinkPhase = 0;
let blinkTimer = 0;
function restartBlink() {
  blinkPhase = 0;
  app.setBlink(0);
  app.setCaretOn(true);
  clearInterval(blinkTimer);
  blinkTimer = setInterval(() => {
    if (document.activeElement !== keys) return;
    blinkPhase += 1;
    app.setBlink(blinkPhase);
    app.setCaretOn(blinkPhase % 2 === 0);
  }, 530);
}

function afterInput() {
  mirrorLine();
  handleRequests();
  needsPaint = true;
  // The preview's caret into view: the module does not know how tall the
  // pane is until asked.
  if (app.focusTarget() === "preview" && pane.view === "md") {
    const c = JSON.parse(app.md.caretJson());
    if (c.h > 0) {
      if (c.y < 0) app.md.scrollBy(c.y - 8);
      else if (c.y + c.h > pane.h) app.md.scrollBy(c.y + c.h - pane.h + 8);
    }
  }
}

const KEY_MAP = {
  Backspace: "backspace", Enter: "enter", Tab: "tab", Delete: "delete",
  ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
  Home: "home", End: "end", PageUp: "pageUp", PageDown: "pageDown",
};
const CTRL_CHORD = /^[abeizyABEIZY]$/;
const CLIPBOARD_CHORD = /^[cxvCXV]$/;
let composing = false;

// Over the slides or the Word page the keys are that editor's, through its
// own host module attached to this same field; this handler steps aside.
function paneEditorHasKeys() {
  return app.focusTarget() === "preview" && (pane.view === "deck" || pane.view === "doc");
}

keys.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    ev.preventDefault();
    if (!app.escape() && app.focusTarget() === "editor") app.key("escape", ev.shiftKey, false);
    afterInput();
    return;
  }
  if (paneEditorHasKeys()) return;
  if (ev.key === "Tab") {
    if (ev.shiftKey || app.focusTarget() !== "editor") return; // the browser moves focus
    ev.preventDefault();
    app.key("tab", false, false);
    afterInput();
    return;
  }
  const mod = ev.ctrlKey || ev.metaKey;
  const special = KEY_MAP[ev.key];
  if (special) {
    if (app.key(special, ev.shiftKey, mod)) ev.preventDefault();
    else if (app.focusTarget() === "editor") ev.preventDefault();
    afterInput();
    return;
  }
  if (mod && ev.key.length === 1) {
    if (CLIPBOARD_CHORD.test(ev.key)) return; // copy / cut / paste fire on the field
    if (CTRL_CHORD.test(ev.key)) {
      ev.preventDefault();
      app.chord(ev.key.toLowerCase());
      afterInput();
    }
  }
});

keys.addEventListener("compositionstart", () => { composing = true; });
keys.addEventListener("compositionend", (ev) => {
  composing = false;
  const text = ev.data || "";
  if (text) app.text(text);
  afterInput();
});

keys.addEventListener("beforeinput", (ev) => {
  if (composing || paneEditorHasKeys()) return;
  const type = ev.inputType;
  if (type === "insertText" && ev.data) {
    ev.preventDefault();
    app.text(ev.data);
    afterInput();
    return;
  }
  if (type === "insertFromPaste" || type === "insertFromDrop") {
    ev.preventDefault();
    const text = ev.dataTransfer ? ev.dataTransfer.getData("text/plain") : "";
    if (text) app.text(text);
    afterInput();
    return;
  }
  if (type === "insertLineBreak" || type === "insertParagraph") {
    ev.preventDefault();
    app.key("enter", false, false);
    afterInput();
    return;
  }
  if (type === "deleteContentBackward") {
    ev.preventDefault();
    app.key("backspace", false, false);
    afterInput();
    return;
  }
  if (type === "deleteContentForward") {
    ev.preventDefault();
    app.key("delete", false, false);
    afterInput();
    return;
  }
  if (type === "historyUndo" || type === "historyRedo") {
    ev.preventDefault();
    if (type === "historyUndo") app.undo(); else app.redo();
    afterInput();
    return;
  }
  ev.preventDefault();
  mirrorLine();
});

keys.addEventListener("copy", (ev) => {
  if (paneEditorHasKeys()) return;
  const text = app.copySelection();
  if (!text) return;
  ev.preventDefault();
  ev.clipboardData?.setData("text/plain", text);
});
keys.addEventListener("cut", (ev) => {
  if (paneEditorHasKeys()) return;
  const text = app.cutSelection();
  if (!text) return;
  ev.preventDefault();
  ev.clipboardData?.setData("text/plain", text);
  afterInput();
});
keys.addEventListener("paste", (ev) => {
  if (paneEditorHasKeys()) return;
  const html = ev.clipboardData?.getData("text/html") || "";
  const text = ev.clipboardData?.getData("text/plain") || "";
  ev.preventDefault();
  if (!html && !text) return;
  // A range copied in a spreadsheet carries a real <table>; the module writes
  // it as a GFM table when the preview is typing.
  if (app.focusTarget() === "preview") app.md.pasteRich(html, text);
  else if (text) app.text(text);
  afterInput();
});
keys.addEventListener("focus", () => { mirrorLine(); needsPaint = true; });
keys.addEventListener("blur", () => {
  clearInterval(blinkTimer);
  app.setCaretOn(false);
  app.setFocus("");
  needsPaint = true;
});

// --- the pointer, on the canvas ----------------------------------------------
function at(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

let touchScroll = null;
canvas.addEventListener("pointerdown", (ev) => {
  const [x, y] = at(ev);
  const where = app.pointerDown(x, y, ev.shiftKey, ev.detail || 1);
  if (where === "editor") {
    ev.preventDefault();
    try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* no capture */ }
    if (ev.pointerType === "touch") {
      // A finger on the editor scrolls it; a mouse selects.
      app.pointerUp();
      touchScroll = { y, acc: 0 };
    }
    focusKeys("editor");
  } else if (where === "chrome") {
    ev.preventDefault();
    handleRequests();
    // A press that hid the editor takes the keyboard with it.
    const p = JSON.parse(app.paneRectJson());
    if (!p.editor && app.focusTarget() === "editor") keys.blur();
  }
  needsPaint = true;
});
canvas.addEventListener("pointermove", (ev) => {
  const [x, y] = at(ev);
  if (touchScroll) {
    touchScroll.acc += touchScroll.y - y;
    touchScroll.y = y;
    while (Math.abs(touchScroll.acc) >= 20) {
      app.wheel(x, y, touchScroll.acc > 0 ? 20 : -20);
      touchScroll.acc += touchScroll.acc > 0 ? -20 : 20;
    }
    return;
  }
  app.pointerMove(x, y);
  canvas.style.cursor = app.cursorAt(x, y);
});
function endPointer() {
  touchScroll = null;
  app.pointerUp();
  mirrorLine();
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("pointerleave", () => { app.clearHover(); });
canvas.addEventListener("wheel", (ev) => {
  const [x, y] = at(ev);
  const step = ev.deltaMode === 1 ? 18 : ev.deltaMode === 2 ? 400 : 1;
  if (app.wheel(x, y, ev.deltaY * step)) ev.preventDefault();
}, { passive: false });

// --- the pointer, over the document --------------------------------------------
function panePoint(ev) {
  const r = paneEl.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

let selecting = false;
let paneTouch = null;
paneEl.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  const step = ev.deltaMode === 1 ? 18 : ev.deltaMode === 2 ? 400 : 1;
  if (pane.view === "deck") {
    const [x, y] = panePoint(ev);
    app.md.deckHost().scrollPixels2(Math.round(x), Math.round(y), Math.round(ev.deltaX * step), Math.round(ev.deltaY * step));
    app.md.touch();
  } else if (pane.view === "doc") {
    if (ev.ctrlKey || ev.metaKey) app.md.docHost().zoomBy(ev.deltaY < 0 ? 1.1 : 1 / 1.1);
    else app.md.docHost().frameWheel(Math.round(ev.deltaY * step));
    app.md.touch();
  } else {
    app.md.scrollBy(ev.deltaY * step);
  }
  needsPaint = true;
}, { passive: false });

paneEl.addEventListener("pointerdown", (ev) => {
  if (pane.view !== "md") {
    // The editor's own host module takes the press; the keyboard follows.
    focusKeys("preview");
    return;
  }
  ev.preventDefault();
  try { paneEl.setPointerCapture(ev.pointerId); } catch (_) { /* no capture */ }
  const [x, y] = panePoint(ev);
  if (ev.pointerType === "touch") {
    // A finger scrolls the page; a mouse places the caret and drags a selection.
    paneTouch = { y };
    return;
  }
  focusKeys("preview");
  if (ev.detail >= 2) app.md.selectWordAt(x, y);
  else {
    app.md.click(x, y, ev.shiftKey);
    selecting = true;
  }
  afterInput();
});
paneEl.addEventListener("pointermove", (ev) => {
  if (pane.view !== "md") return;
  const [x, y] = panePoint(ev);
  if (paneTouch) {
    app.md.scrollBy(paneTouch.y - y);
    paneTouch.y = y;
    needsPaint = true;
    return;
  }
  if (!selecting) return;
  app.md.dragTo(x, y);
  needsPaint = true;
});
function endSelect() {
  selecting = false;
  paneTouch = null;
  needsPaint = true;
}
paneEl.addEventListener("pointerup", endSelect);
paneEl.addEventListener("pointercancel", endSelect);

// The two editors' own input, attached over the pane while one is on
// screen, through the same modules the pptx and docx pages use.
let editorHost = null;
let boundView = "";
function editorDraw() {
  app.md.touch();
  app.touch();
  needsPaint = true;
  // The Word editor's own File menu: Print is the PDF of its pages. (There
  // is no .docx writer, so Save has nothing to write.)
  if (pane.view === "doc") {
    const want = app.md.docHost().takeFileRequest();
    if (want === "print") window.__lastDownload = deliver(app.md.docPdf(), docName + ".pdf", "application/pdf");
  }
}
function keepKeyboard() {
  keys.focus({ preventScroll: true });
}
function bindEditorHost(view) {
  if (view === boundView) return;
  if (editorHost) {
    for (const h of editorHost) h.detach();
    editorHost = null;
  }
  boundView = view;
  const sceneSize = () => ({ width: paneEl.clientWidth, height: paneEl.clientHeight });
  const enabled = (which) => () => app.focusTarget() === "preview" && pane.view === which;
  if (view === "deck") {
    const web = app.md.deckHost();
    editorHost = [
      attachDeckPointer({
        canvas: paneEl, web, sceneSize, draw: editorDraw, afterInput: keepKeyboard, keepsFocus: () => true,
        onFileRequest: (want) => {
          if (want === "saveAs" || want === "save") window.__lastDownload = deliver(app.md.pptx(), docName + ".pptx",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation");
          else if (want === "print") window.__lastDownload = deliver(app.md.deckPdf(), docName + ".pdf", "application/pdf");
        },
      }),
      attachDeckKeys({
        web, draw: editorDraw, afterInput: keepKeyboard, target: keys, enabled: enabled("deck"),
        onSave: () => { window.__lastDownload = deliver(app.md.pptx(), docName + ".pptx",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation"); },
      }),
    ];
  } else if (view === "doc") {
    const web = app.md.docHost();
    editorHost = [
      attachDocPointer({ canvas: paneEl, web, sceneSize, draw: editorDraw, afterInput: keepKeyboard, keepsFocus: () => true }),
      attachDocKeys({
        web, draw: editorDraw, afterInput: keepKeyboard, target: keys, enabled: enabled("doc"),
        onCopy: (text) => navigator.clipboard?.writeText(text).catch(() => {}),
        onCut: (text) => navigator.clipboard?.writeText(text).catch(() => {}),
      }),
    ];
  }
}

// --- start ----------------------------------------------------------------------
async function start() {
  const css = await textOf("./r5.css");
  const [w, h] = sizeOfWindow();
  app.init(css, w, h);
  app.setBuild(document.querySelector("script[src^='./r5_app.js']")?.src.split("v=")[1] || "");
  resize();
  window.addEventListener("resize", resize);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);
  if (window.matchMedia) window.matchMedia("(pointer: coarse)").addEventListener?.("change", resize);

  // The faces, into the engine AND into the browser: the first measures the
  // layout, the second paints it. Both spellings of a variant — `Open
  // Sans-Bold` as the layout names it, and `Open Sans` at weight 700 as the
  // slide and Word editors ask for it — from one set of bytes.
  const got = new Array(FACES.length).fill(false);
  await Promise.all(FACES.map(async ([name, file], i) => {
    try {
      const bytes = await bytesOf("./fonts/" + file);
      got[i] = app.attachFont(name, asRangerBuffer(bytes.slice(0)));
      const face = new FontFace(name, bytes);
      await face.load();
      document.fonts.add(face);
      const dash = name.indexOf("-");
      if (dash > 0) {
        const variant = name.slice(dash + 1);
        const plain = new FontFace(name.slice(0, dash), bytes.slice(0), {
          weight: variant.indexOf("Bold") >= 0 ? "700" : "400",
          style: variant.indexOf("Italic") >= 0 ? "italic" : "normal",
        });
        await plain.load();
        document.fonts.add(plain);
      }
    } catch (e) {
      console.warn("face not loaded: " + name, e);
    }
  }));
  setFontFallback(FACES.filter((_, i) => got[i]).map(([name]) => name));

  try { app.loadPresets(await textOf("./presets.txt")); } catch (e) { console.warn("presets unavailable:", e); }
  for (const [name, url] of Object.entries(THEMES)) {
    try {
      const text = await textOf(url);
      app.addTextFile("/themes/" + name + ".css", text);
      app.addTemplate(name, text);
    } catch (_) { /* one template fewer */ }
  }
  try {
    const ab = await bytesOf("./samples/logo.png");
    const [pw, ph] = pngSize(ab);
    app.addImage("/logo.png", asRangerBuffer(ab.slice(0)), "image/png", pw, ph);
    await registerPicture("/logo.png", ab, "image/png");
  } catch (_) { /* alt text where the picture would be */ }

  const q = new URLSearchParams(location.search);
  const wanted = q.get("sample");
  await openSample(SAMPLES[wanted] ? wanted : "mermaid");
  if (q.get("theme") && THEMES[q.get("theme")]) app.useTemplate(q.get("theme"));
  await handleRequests();
  const view = q.get("view");
  if (view === "deck" || view === "doc" || view === "preview" || view === "edit") app.setScreen(view);
  if (q.get("mode") === "paged" || q.get("mode") === "slides") app.setMode(q.get("mode"));

  hintEl.remove();
  window.__pageStarted = true;
  requestAnimationFrame(paint);
  if (q.has("selftest")) selftest();
}

// --- self test ------------------------------------------------------------------
// The page drives itself so a headless browser can check it without a driver
// library, and writes the verdict into the DOM. What it asks is whether the
// page is WIRED: a chrome with the bar or the rail in it, an editor drawing
// its lines, a document arriving as text runs, a keystroke on one side
// reaching the other, a sheet opening, a PDF built in the tab.
function selftest() {
  const results = [];
  const check = (name, ok, note) => results.push({ name, ok: !!ok, note: note || "" });
  try {
    const texts = (doc) => doc.list.cmds.filter((c) => c.k === 3).map((c) => c.text);
    window.__redraw();
    let t = texts(window.__lastChrome);
    const wide = W >= 768;
    check("chrome has the rail or the bar", wide ? t.includes("Preview") && t.includes("Export") : t.includes("More") && t.includes("Edit"), `${W}x${H}`);
    if (!wide) { app.setScreen("edit"); window.__redraw(); t = texts(window.__lastChrome); }
    check("editor draws line numbers and text", t.includes("1") && t.some((s) => s.startsWith("#")));
    check("the editor measures with the face it draws", app.tr.fontFamily === "Open Sans" && app.tr.hasFont);
    check("editor text is markdown-coloured", window.__lastChrome.list.cmds.some((c) => c.k === 3 && c.text.startsWith("#") && c.c && c.c[0] === 5 && c.c[1] === 80));
    app.pointerDown(pane.editor ? 200 : 100, 120, false, 1);
    const before = app.md.sourceText();
    app.text("Q");
    check("a keystroke in the editor reaches the markdown", app.md.sourceText() !== before && app.md.sourceText().includes("Q"));
    app.undo();
    check("undo puts it back on both sides", app.md.sourceText() === before && app.editor.text() === before);
    if (!wide) app.setScreen("preview");
    window.__redraw();
    const doc = JSON.parse(app.docFrame());
    check("the document arrived as text runs", doc.list.cmds.filter((c) => c.k === 3).length > 10);
    check("a mermaid fence arrived as geometry", doc.list.cmds.some((c) => c.k === 6 || c.k === 7));
    check("the pane is where the layout put it", pane.shown && pane.w > 100 && pane.h > 100 && (wide ? pane.x > 72 : pane.x === 0));
    app.press(wide ? "r5-menu-layout" : "r5-nav-more");
    window.__redraw();
    t = texts(window.__lastChrome);
    check("a sheet opens", t.includes(wide ? "Template" : "Menu") && pane.menu === true);
    if (!wide) { app.press("r5-menu-layout"); window.__redraw(); t = texts(window.__lastChrome); check("the More sheet leads to Layout", t.includes("Template")); }
    app.press("r5-mode-paged");
    window.__redraw();
    check("paged mode has sheets", app.md.currentMode() === "paged" && app.md.pageCountNow() >= 1);
    app.press("r5-close");
    window.__redraw();
    check("the sheet closes", app.menuOpen() === "" && pane.menu === false);
    const pdf = app.md.pdf();
    const head = String.fromCharCode(...new Uint8Array(pdf).slice(0, 5));
    check("a PDF is built in the tab", head === "%PDF-" && pdf.byteLength > 1000, `${pdf.byteLength} bytes`);
    app.press("r5-menu-export");
    app.press("r5-export-html");
    handleRequests().then(() => {
      check("export goes through a request the page serves", window.__lastDownload === "downloaded");
      app.setScreen("deck");
      window.__redraw();
      check("the slides draw in the pane", pane.view === "deck" && app.md.deckSlideCount() >= 1, `${app.md.deckSlideCount()} slides`);
      // A new document, and a keystroke, while the slides are on screen:
      // the slides are the new document's, not the one they were made from.
      const slideText = () => JSON.parse(app.docFrame()).list.cmds.filter((c) => c.k === 3).map((c) => c.text).join("|");
      app.setSource("# Fresh deck title\n\nOne line.\n", "fresh");
      window.__redraw();
      check("opening a document while on the slides rebuilds them", slideText().includes("Fresh deck title"));
      app.pointerDown(pane.editor ? 200 : 100, 120, false, 1);
      app.editor.sel.setCaret(0, 18);
      app.editor.sel.collapseToCaret();
      app.text(" Z");
      window.__redraw();
      check("a keystroke while on the slides reaches them", slideText().includes("Fresh deck title Z"));
      // A presentation edit on the slides — a title recoloured — survives
      // the next markdown change; a rewording of the title in the deck does
      // not, and the head says so.
      const pres = app.md.deckWeb.app.presentation;
      const title = pres.slides[0].shapes[0];
      title.noFill = false; title.fill.isSet = true; title.fill.srgb = "FF0000";
      app.md.deckWeb.app.editor.dirty = true;
      app.text("!");
      window.__redraw();
      const title2 = app.md.deckWeb.app.presentation.slides[0].shapes[0];
      check("a recoloured slide keeps its colour when the markdown changes", slideText().includes("Fresh deck title Z!") && title2.fill.srgb === "FF0000" && !app.deckInvasive());
      title2.text.paragraphs[0].runs[0].text = "Retyped on the slide";
      app.md.deckWeb.app.editor.dirty = true;
      app.text("?");
      window.__redraw();
      check("a slide whose words were retyped is kept, with the way back", app.deckInvasive() && texts(window.__lastChrome).includes("↻ from .md"));
      app.press("r5-rebuild");
      window.__redraw();
      check("↻ from .md builds the slides from the markdown again", !app.deckInvasive() && slideText().includes("Fresh deck title Z!?"));
      app.setScreen("doc");
      window.__redraw();
      const doc = app.md.docModel;
      const para = doc.blockAt(0).paragraph;
      para.spaceAfterPt = 44;
      doc.touch();
      app.text("#");
      window.__redraw();
      check("a spaced Word paragraph keeps its spacing when the markdown changes", app.md.docModel.blockAt(0).paragraph.spaceAfterPt === 44 && app.md.docModel.blockAt(0).paragraph.text.includes("Z!?#"));
      const docPdf = app.md.docPdf();
      check("the Word pages come out as a PDF", String.fromCharCode(...new Uint8Array(docPdf).slice(0, 5)) === "%PDF-", `${docPdf.byteLength} bytes`);
      app.setScreen("preview");
      app.setMode("continuous");
      // The other shape: a phone's chrome, then the desk's again.
      app.setPageSize(390, 760);
      window.__redraw();
      const narrow = texts(window.__lastChrome);
      check("at 390px the bar is there and the rail is not", narrow.includes("More") && !narrow.includes("Export"));
      app.setPageSize(1100, 760);
      window.__redraw();
      const desk = texts(window.__lastChrome);
      check("at 1100px the rail is there and the bar is not", desk.includes("Export") && !desk.includes("More"));
      app.setPageSize(W, H);
      dropDocFrame();
      needsPaint = true;
      window.__selftest = { ok: results.every((r) => r.ok), results };
      const pre = document.createElement("pre");
      pre.id = "selftest";
      pre.textContent = JSON.stringify(window.__selftest);
      document.body.appendChild(pre);
    });
  } catch (e) {
    check("selftest threw", false, String((e && e.stack) || e));
    window.__selftest = { ok: false, results };
    const pre = document.createElement("pre");
    pre.id = "selftest";
    pre.textContent = JSON.stringify(window.__selftest);
    document.body.appendChild(pre);
  }
}

start().catch(fail);
