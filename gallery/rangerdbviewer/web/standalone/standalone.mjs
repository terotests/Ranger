/**
 * RangerDBViewer with the host taken out — and with the database server taken
 * out too.
 *
 *   INPUT   click / wheel → RangerDbViewerWeb → DbViewerFrame     (in this tab)
 *   RENDER  DbViewerFrame.sceneJson() → EVGDisplayList → WebGL 2  (in this tab)
 *   DATA    RangerDB, compiled into the bundle above               (in this tab)
 *
 * The seam is the display list, and `evg-webgl.js` is the same renderer the
 * spreadsheet, the document and the slide deck hand their lists to. This file
 * owns the canvas, the fonts and the events, and decides nothing else.
 */
import { renderDisplayList } from "./gl/evg-webgl.js";

// The page watches for this: if the import above fails, nothing below runs and
// the only evidence anywhere is a 404 in the network panel.
window.__pageStarted = true;

const canvas = document.getElementById("screen");
const statusEl = document.getElementById("status");
const engineEl = document.getElementById("engine");
const sectionEl = document.getElementById("section");
const cmdsEl = document.getElementById("cmds");
const backendEl = document.getElementById("backend");

const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true });
if (!gl) {
  statusEl.textContent = "WebGL 2 not available";
  throw new Error("WebGL 2 required");
}
backendEl.textContent = "webgl2";

const FONTS = [
  ["Open Sans", "OpenSans-Regular.ttf"],
  [null, "OpenSans-Bold.ttf"],
  [null, "OpenSans-Italic.ttf"],
  [null, "OpenSans-BoldItalic.ttf"],
];

function asRangerBuffer(ab) {
  ab._view = new DataView(ab);
  return ab;
}

async function bytesOf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + " → " + res.status);
  return asRangerBuffer(await res.arrayBuffer());
}

/**
 * The engine is a classic <script> beside this module, and it is BUILT rather
 * than checked in. When it is missing the browser says nothing useful: the tag
 * 404s, this module runs regardless, and the first mention of the class is a
 * bare `RangerDbViewerWeb is not defined`.
 *
 * The usual cause is serving the SOURCE directory — index.html and this file
 * live there, the compiled bundle only ever lands in dist/.
 */
function engineOrExplain(name, script, command) {
  // A classic script's top-level `class X {}` makes a global BINDING but not a
  // property of globalThis, so both have to be asked.
  let found = globalThis[name];
  if (typeof found !== "function") {
    try {
      found = (0, eval)("typeof " + name + " === 'function' ? " + name + " : undefined");
    } catch (_) {
      found = undefined;
    }
  }
  if (typeof found === "function") return found;
  const why = window.__engineMissing === script
    ? script + " did not load (404?)."
    : script + " loaded but defined no " + name + ".";
  const help =
    why + "\n\nThis page needs its compiled engine, which is built rather than " +
    "checked in:\n\n    npm run " + command + "\n\nThen serve the dist/ directory it " +
    "writes — not the source directory this file lives in.";
  statusEl.textContent = "no engine — see below";
  const box = document.createElement("pre");
  box.style.cssText =
    "margin:14px 0;padding:14px;background:#2b1d1d;color:#ffd9d9;border:1px solid #a33;" +
    "white-space:pre-wrap;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace";
  box.textContent = help;
  document.body.prepend(box);
  throw new Error(help);
}

const web = new (engineOrExplain("RangerDbViewerWeb", "rangerdbviewer_web.js", "rangerdbviewer:web"))();

let sceneW = canvas.width;
let sceneH = canvas.height;

function draw() {
  const text = web.scene();
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
  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  const stats = renderDisplayList(gl, doc, { dpr });

  engineEl.textContent = web.engineName() || "—";
  sectionEl.textContent = web.section();
  cmdsEl.textContent = String(doc.list.cmds.length);
  const note = web.note();
  statusEl.textContent = note ? web.status() + "  ·  " + note : web.status();
  window.__evgStats = stats;
  window.__dbScene = doc;
}

function coords(ev) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(sceneW - 1, Math.floor((ev.clientX - rect.left) * (sceneW / Math.max(1, rect.width))))),
    y: Math.max(0, Math.min(sceneH - 1, Math.floor((ev.clientY - rect.top) * (sceneH / Math.max(1, rect.height))))),
  };
}

// Whether the button is still down. A move with nothing held is a hover; a
// move with the button held is a DRAG, and the frame cannot tell the two apart
// unless this file says which one it is.
let buttonDown = false;

canvas.addEventListener("pointerdown", (ev) => {
  canvas.focus();
  const { x, y } = coords(ev);
  buttonDown = true;
  // The pointer is captured so a drag that leaves the canvas keeps arriving
  // here — letting go outside otherwise leaves the frame believing the button
  // is still down forever.
  if (canvas.setPointerCapture) {
    try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* not captured */ }
  }
  web.pointer(x, y, true, true, false);
  draw();
});

canvas.addEventListener("pointermove", (ev) => {
  const { x, y } = coords(ev);
  if (web.pointer(x, y, buttonDown, false, false)) draw();
});

canvas.addEventListener("pointerup", (ev) => {
  const { x, y } = coords(ev);
  buttonDown = false;
  if (canvas.releasePointerCapture) {
    try { canvas.releasePointerCapture(ev.pointerId); } catch (_) { /* not captured */ }
  }
  web.pointer(x, y, false, false, true);
  draw();
});

canvas.addEventListener("pointercancel", (ev) => {
  const { x, y } = coords(ev);
  buttonDown = false;
  web.pointer(x, y, false, false, true);
  draw();
});

canvas.addEventListener(
  "wheel",
  (ev) => {
    ev.preventDefault();
    let dy = ev.deltaY;
    if (ev.deltaMode === 1) dy *= 16;
    else if (ev.deltaMode === 2) dy *= 400;
    if (web.wheel(Math.round(dy))) draw();
  },
  { passive: false }
);

// The keyboard, for the two panels that are spreadsheets. The page forwards
// and decides nothing — which key means what is the frame's business, and
// whether a cell will take the text is the database column's.
window.addEventListener("keydown", (ev) => {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const named = ["Enter", "Escape", "Backspace", "Tab", "F4",
                 "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (named.indexOf(ev.key) >= 0) {
    if (web.key(ev.key)) {
      ev.preventDefault();
      draw();
    }
    return;
  }
  // A single printable character is text; everything else is a key we do not
  // handle, and the browser keeps it.
  if (ev.key.length === 1) {
    if (web.text(ev.key)) {
      ev.preventDefault();
      draw();
    }
  }
});

function command(id) {
  web.run(id, "");
  draw();
}

document.getElementById("live").addEventListener("click", () => command("engine.rangerdb"));
document.getElementById("fromSql").addEventListener("click", () => command("db.sql"));
document.getElementById("diagram").addEventListener("click", () => command("view.diagram"));
document.getElementById("cols").addEventListener("click", () => command("view.schema"));
document.getElementById("rows").addEventListener("click", () => command("view.data"));

// The SVG is produced by the same scene the canvas is drawing; the page only
// wraps it in a download, because writing a file is a host's job and this
// page IS the host.
function download(text, name, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

document.getElementById("svg").addEventListener("click", () => {
  download(web.diagramSvg(), "schema.svg", "image/svg+xml");
});

// The schema written back out as DDL. Produced by SchemaToDdl, which a
// round-trip test checks against the reader rather than against a fixture of
// expected text.
document.getElementById("ddl").addEventListener("click", () => {
  download(web.schemaDdl(), "schema.sql", "text/plain");
});

function fitCanvas() {
  const w = Math.max(720, Math.min(1240, Math.floor(window.innerWidth - 90)));
  const h = Math.max(520, Math.min(820, Math.floor(window.innerHeight - 320)));
  web.resize(w, h);
}

window.addEventListener("resize", () => {
  fitCanvas();
  draw();
});

async function boot() {
  statusEl.textContent = "loading fonts";
  const faces = await Promise.all(FONTS.map(([, file]) => bytesOf("./fonts/" + file)));
  FONTS.forEach(([family], i) => {
    if (family) web.addFont(family, faces[i]);
    else web.addFace(faces[i]);
  });
  await document.fonts.ready;

  statusEl.textContent = "opening the database";
  const w = Math.max(720, Math.min(1240, Math.floor(window.innerWidth - 90)));
  const h = Math.max(520, Math.min(820, Math.floor(window.innerHeight - 320)));
  web.start(w, h);
  // The live engine cannot describe a relationship yet, so the page opens on
  // the schema that can — and the button beside it goes back.
  web.run("db.sql", "");
  // `?section=` opens straight onto one of the pages, which is what a link to
  // a particular view needs and what a screenshot of one needs too.
  const wanted = new URLSearchParams(location.search).get("section") || "diagram";
  if (wanted === "metrics") {
    web.run("metrics.run", "");
  } else if (wanted === "schema") {
    web.run("view.schema", "");
  } else if (wanted === "data") {
    web.run("view.data", "");
  } else {
    web.run("view.diagram", "");
  }
  draw();
  window.__dbReady = true;

  if (new URLSearchParams(location.search).has("selftest")) {
    const { selftest } = await import("./selftest.mjs");
    await selftest(web, draw);
  }
}

boot().catch((e) => {
  statusEl.textContent = "error: " + (e && e.message ? e.message : e);
});
