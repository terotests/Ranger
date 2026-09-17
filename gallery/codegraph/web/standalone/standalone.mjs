/**
 * CodeGraph in a tab — Full EVG chrome + RangerFlow canvas, one display list.
 *
 *   browser event → CodeGraphApp → UiHost | FlowEditor
 *   display() → EVGDisplayList → evg-webgl.js
 *
 * Live examples are compiled here by VirtualCompiler against the in-memory
 * filesystem (compileEnv.json + packed compiler / gallery sources). A local
 * `.rgr` dropped on Open is installed the same way.
 */
import { prepareDisplayList } from "./gl/evg-webgl.js";
import { listOf } from "./gl/evg-list.js";

window.__pageStarted = true;

const canvas = document.getElementById("c");
const statusEl = document.getElementById("status");
const backendEl = document.getElementById("backend");
const crumbEl = document.getElementById("crumb");
const selfTestEl = document.getElementById("selftest");
const openEl = document.getElementById("open");

const FIXTURES = new Set(["shop", "many"]);
const EXAMPLES = {
  "calls.rgr": "./examples/calls.rgr",
  "animals.rgr": "./examples/animals.rgr",
};
const GALLERY_LIBS = new Set(["css", "evg", "zip"]);

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

function engineClass() {
  const cls = globalThis.CodeGraphWeb;
  if (typeof cls !== "function") {
    statusEl.textContent = "codegraph_web.js is missing — run: npm run codegraph:web";
    throw new Error("engine bundle not loaded");
  }
  return cls;
}

const app = new (engineClass())();
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let cssText = "";
let sceneStale = true;
let frame = null;
let analyzing = false;

async function loadCss() {
  const res = await fetch("./codegraph.css");
  if (!res.ok) throw new Error("codegraph.css " + res.status);
  cssText = await res.text();
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width === bw && canvas.height === bh) return;
  canvas.width = bw;
  canvas.height = bh;
  app.setPageSize(w, h);
  sceneStale = true;
}

function at(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture(ev.pointerId);
  const [x, y] = at(ev);
  app.pointerDown(x, y, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  if (app.consumeOpenFile()) openEl.click();
  if (app.consumeOpenGitUrl()) {
    window.alert("Git URL clone is the desktop SDL / CLI host (codegraph_sdl / npm run codegraph:analyze).");
  }
  sceneStale = true;
  syncChrome();
});
// GridCursor kinds, as the CSS names for them. The page is painted onto a
// canvas, so the `cursor` on an EVG element never reaches the browser; the
// app is asked what the pointer is over instead.
const CURSORS = ["default", "cell", "col-resize", "row-resize", "text", "grab", "grabbing", "crosshair", "pointer"];
canvas.addEventListener("pointermove", (ev) => {
  const [x, y] = at(ev);
  app.pointerMove(x, y, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  canvas.style.cursor = CURSORS[app.cursorAt(x, y)] || "default";
  sceneStale = true;
});
canvas.addEventListener("pointerup", (ev) => {
  const [x, y] = at(ev);
  app.pointerUp(x, y, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  if (app.consumeOpenFile()) openEl.click();
  if (app.consumeOpenGitUrl()) {
    window.alert("Git URL clone is the desktop SDL / CLI host (codegraph_sdl / npm run codegraph:analyze).");
  }
  sceneStale = true;
  syncChrome();
});
canvas.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  const [x, y] = at(ev);
  if (app.inCanvas(x, y)) {
    app.wheelGesture(app.localX(x), app.localY(y), ev.deltaX, ev.deltaY, ev.ctrlKey || ev.metaKey, ev.deltaMode === 1);
  } else {
    app.wheel(x, y, ev.deltaY);
  }
  sceneStale = true;
}, { passive: false });

window.addEventListener("keydown", (ev) => {
  const ctrl = ev.ctrlKey || ev.metaKey;
  if (ev.key === "Escape") {
    app.keyWith("Escape", ev.shiftKey, ctrl);
    sceneStale = true;
    return;
  }
  // Ctrl+F is the source pane's find bar, and the browser's own find would
  // search the page around the canvas rather than the file in it.
  if (ctrl && ev.key.length === 1) {
    if (app.typeTextWith(ev.key, true)) {
      ev.preventDefault();
      sceneStale = true;
      return;
    }
  }
  if (app.findStatus()) {
    if (ev.key === "Enter" || ev.key === "Backspace") {
      app.keyWith(ev.key, ev.shiftKey, ctrl);
      ev.preventDefault();
      sceneStale = true;
      return;
    }
    if (ev.key.length === 1 && !ctrl) {
      app.typeText(ev.key);
      ev.preventDefault();
      sceneStale = true;
      return;
    }
  }
  const focus = app.focusedField() || "";
  const onSep = String(focus).indexOf("cg-split-sep") === 0;
  if (onSep) {
    if (ev.key === "ArrowLeft" || ev.key === "ArrowRight" || ev.key === "Home" || ev.key === "End") {
      app.keyWith(ev.key, ev.shiftKey, ctrl);
      ev.preventDefault();
      sceneStale = true;
    }
    return;
  }
  if (app.focusedField() !== "cg-class-filter") return;
  if (ev.key.length === 1 && !ctrl) {
    app.typeText(ev.key);
    ev.preventDefault();
    sceneStale = true;
    return;
  }
  if (ev.key === "Backspace" || ev.key === "Delete" || ev.key === "ArrowLeft" || ev.key === "ArrowRight" || ev.key === "Home" || ev.key === "End") {
    app.keyWith(ev.key, ev.shiftKey, ctrl);
    ev.preventDefault();
    sceneStale = true;
  }
});

openEl.addEventListener("change", async () => {
  const files = [...(openEl.files || [])];
  openEl.value = "";
  if (!files.length) return;
  app.clearUserFiles();
  let entry = files[0];
  for (const f of files) {
    const text = await f.text();
    app.setUserFile(f.name, text);
    if (/\.rgr$/i.test(f.name) && files.length === 1) entry = f;
  }
  await installGalleryTree();
  app.fillMissingUserImports();
  const text = app.userFileText(entry.name) || (await entry.text());
  analyzing = true;
  try {
    app.analyzeSource(text, entry.name);
  } finally {
    analyzing = false;
    sceneStale = true;
    syncChrome();
  }
});

function syncChrome() {
  statusEl.textContent = app.statusText() || "";
  crumbEl.textContent = app.crumb() || "";
}

function paintOnce() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return { cmds: 0 };
  if (sceneStale || !frame) {
    if (frame) frame.dispose();
    const dl = app.display();
    frame = prepareDisplayList(gl, { width: w, height: h, list: listOf(dl) }, { dpr });
    sceneStale = false;
  }
  frame.draw();
  return { cmds: (frame && frame.cmdCount) || 0 };
}

function frameLoop() {
  resize();
  paintOnce();
  requestAnimationFrame(frameLoop);
}

async function installCompilerEnv() {
  const res = await fetch("./compileEnv.json");
  if (!res.ok) throw new Error("compileEnv.json " + res.status + " — run: npm run codegraph:web");
  const env = await res.json();
  for (const f of env.filesystem.files || []) app.setRootFile(f.name, f.data);
  const lib = (env.filesystem.folders || []).find((x) => x.name === "lib");
  if (lib) {
    for (const f of lib.files || []) app.setLibFile(f.name, f.data);
  }
}

async function fetchExample(name) {
  const url = EXAMPLES[name];
  if (!url) throw new Error("unknown example " + name);
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + " " + res.status);
  return res.text();
}

let compilerTreePromise = null;
async function installCompilerTree() {
  if (app.hasCompilerTree()) return;
  if (!compilerTreePromise) {
    compilerTreePromise = (async () => {
      const res = await fetch("./compilerSources.json");
      if (!res.ok) throw new Error("compilerSources.json " + res.status);
      const pack = await res.json();
      const files = pack.files || pack;
      for (const name of Object.keys(files)) app.setCompilerFile(name, files[name]);
    })();
  }
  await compilerTreePromise;
}

let galleryTreePromise = null;
async function installGalleryTree() {
  if (app.hasGalleryTree()) return;
  if (!galleryTreePromise) {
    galleryTreePromise = (async () => {
      const res = await fetch("./gallerySources.json");
      if (!res.ok) throw new Error("gallerySources.json " + res.status);
      const pack = await res.json();
      const files = pack.files || pack;
      for (const name of Object.keys(files)) app.setGalleryFile(name, files[name]);
    })();
  }
  await galleryTreePromise;
}

async function loadExample(name) {
  if (name === "compiler") {
    await installCompilerTree();
    app.analyzeCompiler();
    return;
  }
  if (GALLERY_LIBS.has(name)) {
    await installGalleryTree();
    app.analyzeGallery(name);
    return;
  }
  if (FIXTURES.has(name)) {
    app.loadSample(name);
    return;
  }
  const src = await fetchExample(name);
  app.setExampleFile(name, src);
  app.analyzeSource(src, name);
}

async function runSelfTest() {
  const nav = app.selfTest();
  let line = nav;
  try {
    const src = await fetchExample("calls.rgr");
    app.setExampleFile("calls.rgr", src);
    const ok = app.analyzeSource(src, "calls.rgr");
    const classes = app.classList() || "";
    if (!ok) {
      line = "FAIL vc " + (app.statusText() || "analyze returned false");
    } else if (classes.indexOf("Order") < 0 || classes.indexOf("LineItem") < 0) {
      line = "FAIL vc classes: " + classes.replace(/\n/g, ", ");
    } else if (nav.startsWith("PASS")) {
      line = nav + "; vc ok";
    }
  } catch (err) {
    line = "FAIL vc " + (err && err.message ? err.message : err);
  }
  selfTestEl.textContent = line;
  selfTestEl.style.display = "block";
  statusEl.textContent = line;
  sceneStale = true;
}

async function main() {
  await loadCss();
  resize();
  app.start(canvas.clientWidth || 1200, canvas.clientHeight || 800, cssText);
  sceneStale = true;
  syncChrome();
  requestAnimationFrame(frameLoop);
  await installCompilerEnv();
  const params = new URLSearchParams(location.search);
  if (params.has("selftest")) {
    await runSelfTest();
    return;
  }
  const sample = params.get("sample");
  if (sample && FIXTURES.has(sample)) {
    app.loadSample(sample);
    const open = params.get("open") || "";
    if (open) app.openClass(open);
    sceneStale = true;
    syncChrome();
    return;
  }
  const example = params.get("example") || "calls.rgr";
  if (example === "compiler" || GALLERY_LIBS.has(example) || EXAMPLES[example]) {
    await loadExample(example);
  }
  const openClass = params.get("open") || "";
  if (openClass) app.openClass(openClass);
  sceneStale = true;
  syncChrome();
}

main().catch((err) => {
  statusEl.textContent = String(err && err.message ? err.message : err);
  throw err;
});
