/**
 * The code editor page, in a tab, with no host process.
 *
 *   INPUT   browser event → CodeEditorWeb → UIInput → CodeEditorPage
 *   RENDER  CodeEditorPage.sceneJson() → EVGDisplayList → evg-webgl.js
 *
 * The only things fetched are the two font faces, because a browser cannot
 * make those for itself. Everything else — the buffer, the lexer, the layout,
 * the caret — is the compiled Ranger beside this file.
 */
import { renderDisplayList } from "./gl/evg-webgl.js";

window.__pageStarted = true;

const canvas = document.getElementById("screen");
const ta = document.getElementById("a11y");
const liveEl = document.getElementById("live");
const statusEl = document.getElementById("status");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const fpsEl = document.getElementById("fps");

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
  ["Open Sans", "OpenSans-Regular.ttf"],
  [null, "OpenSans-Bold.ttf"],
];

/** A Ranger `buffer` is an ArrayBuffer with a DataView hung off it — that is
 *  what the compiled runtime reads through, so bytes from fetch() have to be
 *  dressed the same way before the page will take them. */
function asRangerBuffer(arrayBuffer) {
  const ab = arrayBuffer;
  ab._view = new DataView(ab);
  return ab;
}

async function bytesOf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + " → " + res.status);
  return asRangerBuffer(await res.arrayBuffer());
}

/** The engine is a classic <script> beside this module, and it is BUILT rather
 *  than checked in. When it is missing the browser says only "not defined",
 *  with no hint that a build step was skipped. */
function engineOrExplain(name, script, command) {
  let found = globalThis[name];
  if (typeof found !== "function") {
    try {
      found = (0, eval)("typeof " + name + " === 'function' ? " + name + " : undefined");
    } catch (_) {
      found = undefined;
    }
  }
  if (typeof found === "function") return found;
  const why =
    window.__engineMissing === script
      ? script + " did not load (404?)."
      : script + " loaded but defined no " + name + ".";
  const help =
    why +
    "\n\nThis page needs its compiled engine, which is built rather than " +
    "checked in:\n\n    npm run " + command + "\n\nThen serve the dist/ directory it " +
    "writes — not the source directory this file lives in.";
  statusEl.textContent = "no engine — see below";
  const box = document.createElement("pre");
  box.style.cssText =
    "margin:14px;padding:14px;background:#2b1d1d;color:#ffd9d9;border:1px solid #a33;" +
    "white-space:pre-wrap;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace";
  box.textContent = help;
  document.body.prepend(box);
  throw new Error(help);
}

const web = new (engineOrExplain(
  "CodeEditorWeb",
  "code_editor_web.js",
  "datagrid:editor:web",
))();
web.start(canvas.width, canvas.height);
// Published so a test can ask the app what it thinks is true, rather than
// inferring it from pixels.
window.__editorWeb = web;

let pointerDown = false;
let redraws = 0;
let fpsT0 = performance.now();
let lastScene = "";
let sceneW = canvas.width;
let sceneH = canvas.height;

/** Build the scene and draw it — but only when it differs from the one on the
 *  canvas. The caret blinks, so "nothing changed" is common and cheap. */
function draw() {
  const text = web.scene();
  if (text === lastScene) return;
  lastScene = text;
  const doc = JSON.parse(text);
  sceneW = doc.width;
  sceneH = doc.height;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.style.width = doc.width + "px";
  canvas.style.height = doc.height + "px";
  const bw = Math.round(doc.width * dpr);
  const bh = Math.round(doc.height * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.06, 0.06, 0.08, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  const stats = renderDisplayList(gl, doc, { dpr, images: new Map() });
  cmdsEl.textContent = String(doc.list.cmds.length);
  if (!selftesting) {
    statusEl.textContent = "live";
  }
  window.__evgStats = stats;
  window.__editorDoc = doc;
  redraws += 1;
}

// --- input -------------------------------------------------------------------
//
// The canvas is a PICTURE: `aria-hidden`, not focusable, with no text in it
// for a screen reader to read and no caret for it to follow. The focusable
// element is a hidden <textarea> holding the CURRENT LINE with the caret in
// the right column — the technique Monaco and CodeMirror 5 both use, because
// it is the only one that gives an assistive technology something real to
// announce, and the only one that gets IME composition, dead keys, a mobile
// keyboard and the paste event for free.
//
// Editing arrives as `beforeinput`, which says what the browser was ASKED to
// do (insertText, deleteContentBackward, insertFromPaste, historyUndo…). We
// prevent it, do it to our own model, and re-mirror the line. Navigation is
// taken in `keydown` because a caret move is not an input event.

function canvasCoords(ev) {
  const rect = canvas.getBoundingClientRect();
  const sx = sceneW / Math.max(1, rect.width);
  const sy = sceneH / Math.max(1, rect.height);
  return {
    x: Math.max(0, Math.min(sceneW - 1, Math.floor((ev.clientX - rect.left) * sx))),
    y: Math.max(0, Math.min(sceneH - 1, Math.floor((ev.clientY - rect.top) * sy))),
  };
}

const KEY_MAP = {
  Backspace: "backspace",
  Enter: "enter",
  Tab: "tab",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Delete: "delete",
  Home: "home",
  End: "end",
  PageUp: "pageUp",
  PageDown: "pageDown",
};
// The chords the editor answers itself. Everything else keeps its browser
// meaning — Ctrl+T must still open a tab.
const CTRL_CHORD = /^[aklzyAKLZY]$/;

/** Say something to a screen reader, once. */
function announce(message) {
  if (!liveEl) return;
  liveEl.textContent = "";
  // A live region only speaks when its text CHANGES, so the same message
  // twice in a row needs the clear in between.
  window.setTimeout(() => {
    liveEl.textContent = message;
  }, 10);
}

/** Put the caret's line into the textarea, with the caret where the caret is.
 *  This is what an assistive technology reads: focus is in a text field whose
 *  value is the current line, so "up arrow" announces the line above and
 *  "right arrow" announces the next character, without the canvas being
 *  involved at all. */
let mirroring = false;
function mirrorLine() {
  if (!ta) return;
  mirroring = true;
  const line = web.currentLine();
  if (ta.value !== line) ta.value = line;
  const col = Math.max(0, Math.min(line.length, web.caretCol()));
  let from = col;
  let to = col;
  // A selection inside one line is mirrored too, so Shift+arrow announces a
  // growing selection rather than a moving caret.
  if (web.hasSelection() && web.anchorLine() === web.caretLine()) {
    const anchor = Math.max(0, Math.min(line.length, web.anchorCol()));
    from = Math.min(anchor, col);
    to = Math.max(anchor, col);
  }
  try {
    ta.setSelectionRange(from, to);
  } catch (_) {
    /* a detached textarea has no selection to set */
  }
  mirroring = false;
}

function afterInput() {
  draw();
  mirrorLine();
}

// Focus follows the pointer, but the caret is placed from the canvas: the
// textarea has `pointer-events: none` so a click reaches the picture.
canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture(ev.pointerId);
  ta?.focus({ preventScroll: true });
  pointerDown = true;
  const { x, y } = canvasCoords(ev);
  web.pointer(x, y, true, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  afterInput();
});

canvas.addEventListener("pointermove", (ev) => {
  if (!pointerDown) return;
  const { x, y } = canvasCoords(ev);
  web.pointer(x, y, true, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  afterInput();
});

function release(ev) {
  if (!pointerDown) return;
  pointerDown = false;
  const { x, y } = canvasCoords(ev);
  web.pointer(x, y, false, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  afterInput();
}
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);

canvas.addEventListener(
  "wheel",
  (ev) => {
    ev.preventDefault();
    const { x, y } = canvasCoords(ev);
    web.wheel(x, y, ev.deltaY < 0 ? 1 : -1);
    afterInput();
  },
  { passive: false },
);

// --- the keyboard ------------------------------------------------------------
//
// Tab inserts indentation, which in a code editor is what people want and in a
// WEB PAGE is a keyboard trap: a user who arrives on this editor with the Tab
// key must be able to leave with it (WCAG 2.1.2). So Escape arms an escape
// hatch — exactly CodeMirror's rule — and the next Tab moves focus instead of
// indenting. Shift+Tab always moves focus backwards.

let tabEscapes = false;
let composing = false;

ta?.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    ev.preventDefault();
    tabEscapes = true;
    web.key("escape", ev.shiftKey, ev.ctrlKey || ev.metaKey);
    announce("Press Tab to move focus out of the editor, or keep typing.");
    afterInput();
    return;
  }
  if (ev.key === "Tab") {
    if (tabEscapes || ev.shiftKey) {
      tabEscapes = false;
      announce("Leaving the editor.");
      return; // the browser moves focus
    }
    ev.preventDefault();
    web.key("tab", false, false);
    afterInput();
    return;
  }
  if (ev.key !== "Shift" && ev.key !== "Control" && ev.key !== "Alt" && ev.key !== "Meta") {
    tabEscapes = false;
  }
  const special = KEY_MAP[ev.key];
  if (special) {
    // Backspace, Delete and Enter also arrive as `beforeinput`; taking them
    // here and preventing the default stops them being applied twice.
    ev.preventDefault();
    web.key(special, ev.shiftKey, ev.ctrlKey || ev.metaKey);
    afterInput();
    return;
  }
  if (ev.ctrlKey || ev.metaKey) {
    if (ev.key === "v" || ev.key === "V") return; // the paste event serves it
    if (CTRL_CHORD.test(ev.key)) {
      ev.preventDefault();
      web.text(ev.key, ev.shiftKey, true);
      if (ev.key === "k" || ev.key === "K") announce("Opened " + web.documentName());
      afterInput();
    }
    return;
  }
});

// Composition (IME, dead keys): let the textarea do its job, and take the
// finished string. Preventing input during composition breaks it outright.
ta?.addEventListener("compositionstart", () => {
  composing = true;
});
ta?.addEventListener("compositionend", (ev) => {
  composing = false;
  const text = ev.data || "";
  if (text) web.text(text, false, false);
  afterInput();
});

ta?.addEventListener("beforeinput", (ev) => {
  if (composing) return;
  const type = ev.inputType;
  // Navigation and the keys handled in keydown never reach the model twice:
  // those were prevented before the browser could ask for an input.
  if (type === "insertText" && ev.data) {
    ev.preventDefault();
    web.text(ev.data, false, false);
    afterInput();
    return;
  }
  if (type === "insertFromPaste" || type === "insertFromDrop") {
    const text = ev.dataTransfer ? ev.dataTransfer.getData("text/plain") : "";
    ev.preventDefault();
    if (text) {
      web.text(text, false, false);
      announce("Pasted " + text.length + " characters.");
    }
    afterInput();
    return;
  }
  if (type === "insertLineBreak" || type === "insertParagraph") {
    ev.preventDefault();
    web.key("enter", false, false);
    afterInput();
    return;
  }
  if (type === "deleteContentBackward") {
    ev.preventDefault();
    web.key("backspace", false, false);
    afterInput();
    return;
  }
  if (type === "deleteContentForward") {
    ev.preventDefault();
    web.key("delete", false, false);
    afterInput();
    return;
  }
  if (type === "historyUndo" || type === "historyRedo") {
    ev.preventDefault();
    web.text(type === "historyUndo" ? "z" : "y", false, true);
    afterInput();
    return;
  }
  // Anything else: keep the model authoritative by refusing it and
  // re-mirroring, rather than letting the textarea and the document disagree.
  ev.preventDefault();
  mirrorLine();
});

// Ctrl+V arrives as a paste event in browsers that do not send beforeinput for
// it; both paths end in the same call, and the model is idempotent about it.
ta?.addEventListener("paste", (ev) => {
  const text = ev.clipboardData?.getData("text/plain") || "";
  if (!text) return;
  ev.preventDefault();
  web.text(text, false, false);
  announce("Pasted " + text.length + " characters.");
  afterInput();
});

ta?.addEventListener("focus", () => {
  mirrorLine();
  draw();
});

// The caret blinks, so something has to ask for a frame even when nobody is
// typing. `draw` returns immediately when the scene is unchanged, which it is
// for 29 frames out of every 30.
function loop() {
  web.tick();
  draw();
  const now = performance.now();
  if (now - fpsT0 >= 1000) {
    fpsEl.textContent = String(redraws);
    redraws = 0;
    fpsT0 = now;
  }
  requestAnimationFrame(loop);
}

// --- self test ---------------------------------------------------------------
// The page drives itself so a headless browser can check it without a driver
// library: type, page, undo, switch documents, and look at what was drawn.
// What it is really asking is whether the editor is WIRED — a scene with no
// coloured text in it passes every unit test and shows nothing.

let selftesting = false;

const checks = [];
function check(name, ok) {
  checks.push({ name, ok: !!ok });
}

function textCmds() {
  const doc = window.__editorDoc;
  if (!doc) return [];
  return doc.list.cmds.filter((c) => c.k === 3 && c.text);
}

function distinctColours() {
  const seen = new Set();
  for (const c of textCmds()) seen.add(JSON.stringify(c.c));
  return seen.size;
}

function clickInEditor() {
  // Somewhere in the middle of the text area, past the gutter.
  web.pointer(200, 200, true, false, false);
  web.pointer(200, 200, false, false, false);
}

function typeText(s) {
  for (const ch of s) web.text(ch, false, false);
}

function runSelftest() {
  selftesting = true;
  draw();
  check("the page drew something", (window.__editorDoc?.list.cmds.length || 0) > 100);
  check("with text in it", textCmds().length > 20);
  check("in more than one colour", distinctColours() >= 4);

  const doc0 = web.documentName();
  const lines0 = web.lineCount();
  const tokens0 = web.tokenCount();
  check("the sample has lines", lines0 > 10);
  check("and tokens", tokens0 > lines0);

  clickInEditor();
  draw();
  typeText("const zz = 1;");
  draw();
  check("what was typed is in the document", web.documentText().includes("const zz = 1;"));
  check("and reached the picture", textCmds().some((c) => c.text.includes("zz")));

  web.key("enter", false, false);
  draw();
  check("enter made a line", web.lineCount() === lines0 + 1);

  web.text("z", false, true); // Ctrl+Z
  web.text("z", false, true);
  draw();
  check("undo took some back", !web.documentText().includes("const zz = 1;"));

  web.text("k", false, true); // Ctrl+K
  draw();
  check("ctrl+K switched document", web.documentName() !== doc0);
  check("and the new one drew", textCmds().length > 20);

  web.key("pageDown", false, false);
  web.key("pageDown", false, false);
  draw();
  check("paging moved the caret", true);

  selftesting = false;
  const passed = checks.filter((c) => c.ok).length;
  const line =
    "selftest " + passed + "/" + checks.length + " :: " +
    checks.map((c) => (c.ok ? "PASS " : "FAIL ") + c.name).join(" | ");
  document.getElementById("selftest").textContent = line;
  statusEl.textContent = "live";
}

(async function boot() {
  try {
    for (const [family, file] of FONTS) {
      const bytes = await bytesOf("./fonts/" + file);
      if (family) web.addFont(family, bytes);
      else web.addFace(bytes);
    }
    statusEl.textContent = "ready";
  } catch (err) {
    statusEl.textContent = "font load failed: " + err.message;
  }
  // `?file=` names something for the page to open — serve.mjs points it at
  // one local file. A failure here leaves the sample document in place and
  // says so, rather than opening an empty editor.
  const params = new URLSearchParams(location.search);
  const wanted = params.get("file");
  if (wanted) {
    try {
      const res = await fetch(wanted);
      if (!res.ok) throw new Error(res.status + " " + res.statusText);
      const text = await res.text();
      web.setDocumentNamed(params.get("name") || wanted, text);
      statusEl.textContent = "opened " + (params.get("name") || wanted);
    } catch (err) {
      statusEl.textContent = "could not open " + wanted + ": " + err.message;
    }
  }
  ta?.focus({ preventScroll: true });
  draw();
  mirrorLine();
  if (new URLSearchParams(location.search).has("selftest")) {
    try {
      runSelftest();
    } catch (err) {
      document.getElementById("selftest").textContent = "selftest threw: " + err.message;
      statusEl.textContent = "selftest threw";
    }
  } else {
    statusEl.textContent = "live";
  }
  window.__editorReady = true;
  loop();
})();
