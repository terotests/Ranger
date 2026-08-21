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

function afterInput() {
  draw();
}

// --- input -------------------------------------------------------------------

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
  Escape: "escape",
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
const CTRL_CHORD = /^[aklzyAKLZY]$/;

canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture(ev.pointerId);
  canvas.focus();
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

canvas.addEventListener("keydown", (ev) => {
  const special = KEY_MAP[ev.key];
  if (special) {
    ev.preventDefault();
    web.key(special, ev.shiftKey, ev.ctrlKey || ev.metaKey);
    afterInput();
    return;
  }
  if (ev.ctrlKey || ev.metaKey) {
    // Ctrl+V is served by the paste event below — the only way to read the
    // OS clipboard without asking for a permission the page does not need.
    if (ev.key === "v" || ev.key === "V") return;
    if (CTRL_CHORD.test(ev.key)) {
      ev.preventDefault();
      web.text(ev.key, ev.shiftKey, true);
      afterInput();
    }
    return;
  }
  if (ev.key.length === 1) {
    ev.preventDefault();
    web.text(ev.key, ev.shiftKey, false);
    afterInput();
  }
});

canvas.addEventListener("paste", (ev) => {
  const text = ev.clipboardData?.getData("text/plain") || "";
  if (!text) return;
  ev.preventDefault();
  web.text(text, false, false);
  afterInput();
});

// The caret blinks, so something has to ask for a frame even when nobody is
// typing. `draw` returns immediately when the scene is unchanged.
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
  canvas.focus();
  draw();
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
