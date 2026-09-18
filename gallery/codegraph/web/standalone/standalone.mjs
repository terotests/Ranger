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
  "calls_v2.rgr": "./examples/calls_v2.rgr",
  "zip_writer.hpp": "./examples/zip_writer.hpp",
};
// Menu items whose files are not named after them. The diff example
// compiles both fixtures in the tab and opens on what changed between them.
const EXAMPLE_FILES = { cpp: ["zip_writer.hpp"], "diff-calls": ["calls.rgr", "calls_v2.rgr"] };
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

// The EXAMPLE menu asks the app; the app can only compile what is in its
// VFS. A pick it could not serve (css before the gallery pack is fetched,
// the C++ fixture, animals.rgr) is left in `pendingSample` — fetch the
// sources here, then pick the same item again.
function serveHostRequests() {
  if (app.consumeOpenFile()) openEl.click();
  if (app.consumeOpenGitUrl()) {
    window.alert("Git URL clone is the desktop SDL / CLI host (codegraph_sdl / npm run codegraph:analyze).");
  }
  const want = app.consumePendingSample();
  if (want && !analyzing) {
    analyzing = true;
    loadExample(want)
      .catch((err) => { statusEl.textContent = String(err && err.message ? err.message : err); })
      .finally(() => {
        analyzing = false;
        sceneStale = true;
        syncChrome();
      });
  }
}

// The bundle is the compiler's ES6 output, where reading a file is a
// Promise — so every app method on a path that could read one (a click that
// opens a class, a menu pick) is `async`. Await them, or the status line and
// the host requests are read before the click has happened.
canvas.addEventListener("pointerdown", async (ev) => {
  canvas.setPointerCapture(ev.pointerId);
  const [x, y] = at(ev);
  await app.pointerDown(x, y, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  serveHostRequests();
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
canvas.addEventListener("pointerup", async (ev) => {
  const [x, y] = at(ev);
  await app.pointerUp(x, y, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  serveHostRequests();
  sceneStale = true;
  syncChrome();
});
canvas.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  const [x, y] = at(ev);
  if (app.inCanvas(x, y)) {
    app.wheelGesture(app.localX(x), app.localY(y), ev.deltaX, ev.deltaY, ev.ctrlKey || ev.metaKey, ev.deltaMode === 1);
  } else {
    let dx = ev.deltaX;
    let dy = ev.deltaY;
    // A mouse wheel has no sideways axis; Shift+wheel is the usual stand-in.
    if (ev.shiftKey && Math.abs(dx) < Math.abs(dy)) {
      dx = dy;
      dy = 0;
    }
    if (typeof app.wheelXY === "function") app.wheelXY(x, y, dx, dy);
    else app.wheel(x, y, dy);
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
  // search the page around the canvas rather than the file in it. Ctrl+C
  // with a selection in the pane copies it: the app hands the text back.
  if (ctrl && ev.key.length === 1) {
    if (app.typeTextWith(ev.key, true)) {
      ev.preventDefault();
      const clip = app.consumeClipboardText ? app.consumeClipboardText() : "";
      if (clip && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(clip).catch(() => {});
      }
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
  const inSource = typeof app.sourceActive === "function" && app.sourceActive();
  const editorKeys = {
    ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1,
    Home: 1, End: 1, PageUp: 1, PageDown: 1,
    Enter: 1, Backspace: 1, Delete: 1,
  };
  if (inSource) {
    if (editorKeys[ev.key]) {
      app.keyWith(ev.key, ev.shiftKey, ctrl);
      ev.preventDefault();
      sceneStale = true;
      return;
    }
    if (ev.key.length === 1 && !ctrl) {
      app.typeText(ev.key);
      ev.preventDefault();
      sceneStale = true;
    }
    return;
  }
  if (onSep) {
    if (ev.key === "ArrowLeft" || ev.key === "ArrowRight" || ev.key === "Home" || ev.key === "End") {
      app.keyWith(ev.key, ev.shiftKey, ctrl);
      ev.preventDefault();
      sceneStale = true;
    }
    return;
  }
  if (!app.hasField(app.focusedField())) return;
  if (ev.key.length === 1 && !ctrl) {
    app.typeText(ev.key);
    ev.preventDefault();
    sceneStale = true;
    return;
  }
  if (ev.key === "Enter" || ev.key === "Backspace" || ev.key === "Delete" || ev.key === "ArrowLeft" || ev.key === "ArrowRight" || ev.key === "Home" || ev.key === "End") {
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
    if (/\.(rgr|hpp|h|cpp|cc|ts)$/i.test(f.name) && files.length === 1) entry = f;
  }
  await installGalleryTree();
  app.fillMissingUserImports();
  const text = app.userFileText(entry.name) || (await entry.text());
  analyzing = true;
  try {
    await app.analyzeText(text, entry.name);
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

// The app's own clock: transitions and the member drawer's slide advance
// per frame, and a frame that moved something is repainted.
let lastFrameMs = 0;
function frameLoop(nowMs) {
  const now = typeof nowMs === "number" ? nowMs : performance.now();
  const dt = lastFrameMs ? Math.min(now - lastFrameMs, 100) : 16;
  lastFrameMs = now;
  if (app.tick && app.tick(dt)) sceneStale = true;
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

// Put the sources an item needs into the app, then let the app pick it —
// the same path the EXAMPLE menu takes, so the select and the status line
// agree with what is drawn.
async function loadExample(name) {
  if (name === "compiler") {
    await installCompilerTree();
  } else if (GALLERY_LIBS.has(name)) {
    await installGalleryTree();
  } else if (!FIXTURES.has(name)) {
    const files = EXAMPLE_FILES[name] || [name];
    for (const file of files) {
      if (!EXAMPLES[file]) throw new Error("unknown example " + name);
      if (!app.hasExampleFile(file)) {
        const src = await fetchExample(file);
        app.setExampleFile(file, src);
      }
    }
  }
  const ok = await app.pickSample(name);
  if (!ok && app.consumePendingSample()) {
    throw new Error("could not load " + name + ": " + (app.statusText() || ""));
  }
  return ok;
}

async function runSelfTest() {
  const nav = await app.selfTest();
  let line = nav;
  try {
    const src = await fetchExample("calls.rgr");
    app.setExampleFile("calls.rgr", src);
    const ok = await app.analyzeSource(src, "calls.rgr");
    const classes = app.classList() || "";
    if (!ok) {
      line = "FAIL vc " + (app.statusText() || "analyze returned false");
    } else if (classes.indexOf("Order") < 0 || classes.indexOf("LineItem") < 0) {
      line = "FAIL vc classes: " + classes.replace(/\n/g, ", ");
    } else if (nav.startsWith("PASS")) {
      line = nav + "; vc ok";
    }
    // The EXAMPLE menu: a pick the app cannot serve is handed back here.
    // css needs the gallery pack, cpp the fixture; both used to stop at
    // "gallery sources not loaded" in the tab.
    if (line.startsWith("PASS")) {
      for (const [item, want] of [["css", "CssSheet"], ["cpp", "ZipWriter"], ["diff-calls", "Receipt"]]) {
        await app.pickSample(item);
        const pending = app.consumePendingSample();
        if (pending !== item) {
          line = "FAIL menu " + item + " did not ask the host (got '" + pending + "')";
          break;
        }
        await loadExample(item);
        const got = app.classList() || "";
        if (got.indexOf(want) < 0) {
          line = "FAIL menu " + item + ": " + (app.statusText() || "no " + want);
          break;
        }
      }
      if (line.startsWith("PASS")) {
        // The diff example opens on the summary page with the change counted.
        const page = app.pageId ? app.pageId() : "";
        const summary = app.diffSummary ? app.diffSummary() : "";
        if (page !== "diff:0") line = "FAIL diff example opened on " + page;
        else if (!/added/.test(summary) || !/removed/.test(summary)) line = "FAIL diff summary: " + summary;
        else line += "; menu ok; diff ok";
      }
    }
  } catch (err) {
    line = "FAIL vc " + (err && err.message ? err.message : err);
  }
  selfTestEl.textContent = line;
  selfTestEl.style.display = "block";
  statusEl.textContent = line;
  sceneStale = true;
}

// The source pane measures with the face it is drawn in. Without the file
// the renderer steps every character at a bitmap font's width, which is
// wider than Noto Sans, and the tokens of a line drifted apart.
async function loadCodeFont() {
  try {
    const res = await fetch("./fonts/NotoSans-Regular.ttf");
    if (!res.ok) return;
    const ab = await res.arrayBuffer();
    ab._view = new DataView(ab);
    app.loadCodeFont("Noto Sans", ab);
    sceneStale = true;
  } catch (_) {
    // The pane still works at the fallback step.
  }
}

async function main() {
  await loadCss();
  resize();
  app.start(canvas.clientWidth || 1200, canvas.clientHeight || 800, cssText);
  sceneStale = true;
  syncChrome();
  requestAnimationFrame(frameLoop);
  await loadCodeFont();
  await installCompilerEnv();
  const params = new URLSearchParams(location.search);
  if (params.has("selftest")) {
    await runSelfTest();
    return;
  }
  const sample = params.get("sample");
  if (sample && FIXTURES.has(sample)) {
    await app.loadSample(sample);
    const open = params.get("open") || "";
    if (open) await app.openClass(open);
    sceneStale = true;
    syncChrome();
    return;
  }
  const example = params.get("example") || "calls.rgr";
  if (example === "compiler" || GALLERY_LIBS.has(example) || EXAMPLES[example] || EXAMPLE_FILES[example]) {
    await loadExample(example);
  }
  const openClass = params.get("open") || "";
  if (openClass) await app.openClass(openClass);
  // ?members=Order opens the popup that lists every member of a class —
  // what a click on a "+ N more" row does.
  const membersOf = params.get("members") || "";
  if (membersOf) await app.showMembersSettled(membersOf);
  sceneStale = true;
  syncChrome();
}

main().catch((err) => {
  statusEl.textContent = String(err && err.message ? err.message : err);
  throw err;
});
