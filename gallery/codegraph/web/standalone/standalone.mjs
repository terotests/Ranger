/**
 * CodeGraph in a tab.
 *
 *   INPUT   browser event → CodeGraphWeb → FlowEditor
 *   RENDER  FlowEditor.frameJson() → EVGDisplayList → evg-webgl.js
 *
 * Live examples are compiled here by VirtualCompiler (compileEnv.json +
 * examples/*.rgr). RangerFlow only draws the current window of the graph.
 */
import { prepareDisplayList } from "./gl/evg-webgl.js";
import { createViewKeeper } from "./gl/evg-view.js";

window.__pageStarted = true;

const canvas = document.getElementById("screen");
const statusEl = document.getElementById("status");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const crumbEl = document.getElementById("crumb");
const classesEl = document.getElementById("classes");
const sampleEl = document.getElementById("sample");
const sourceEl = document.getElementById("source");
const analyzeEl = document.getElementById("analyze");
const backEl = document.getElementById("back");
const fwdEl = document.getElementById("fwd");
const umlEl = document.getElementById("uml");
const selfTestEl = document.getElementById("selftest");

const FIXTURES = new Set(["shop", "many"]);
const EXAMPLES = {
  "calls.rgr": "./examples/calls.rgr",
  "animals.rgr": "./examples/animals.rgr",
};
const COMPILER_NOTE = `; Ranger compiler — VirtualCompiler.rgr and the files it Imports.
; Analyze walks every class (paged, ≤ 24 boxes). This takes a moment.
; The sources are loaded from compiler/, not typed in this box.
`;

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

function engineClass() {
  const cls = globalThis.CodeGraphWeb;
  if (typeof cls !== "function") {
    statusEl.textContent = "codegraph_web.js is missing — run: npm run codegraph:web";
    throw new Error("engine bundle not loaded");
  }
  return cls;
}

let sceneStale = true;
const VIEW_ONLY = new Set([
  "wheelGesture", "fitView", "zoomToSelected", "pointerMove",
  "statusText", "stats", "selfTest", "sceneJson", "frameView", "frameScene",
  "frameGrid", "tick", "viewGesture", "classList", "crumb", "pageId",
  "pageTitle", "titleText", "sampleId", "umlView", "canBack", "canForward",
  "svg", "hasCompiler", "hasCompilerTree", "hasSelection", "selectedId",
]);

const rawApp = new (engineClass())();
const app = new Proxy(rawApp, {
  get(target, key) {
    const val = target[key];
    if (typeof val !== "function") return val;
    return (...args) => {
      if (!VIEW_ONLY.has(key)) sceneStale = true;
      const out = val.apply(target, args);
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
let analyzing = false;

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

function at(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture(ev.pointerId);
  const [x, y] = at(ev);
  app.pointerDown(x, y, ev.shiftKey, ev.ctrlKey || ev.metaKey);
});
canvas.addEventListener("pointermove", (ev) => {
  const [x, y] = at(ev);
  app.pointerMove(x, y, ev.shiftKey, ev.ctrlKey || ev.metaKey);
});
canvas.addEventListener("pointerup", (ev) => {
  const [x, y] = at(ev);
  app.pointerUp(x, y, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  syncChrome();
});
canvas.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  const [x, y] = at(ev);
  app.wheelGesture(x, y, ev.deltaX, ev.deltaY, ev.ctrlKey || ev.metaKey, ev.deltaMode === 1);
}, { passive: false });

function fillClasses() {
  const names = (app.classList() || "").split("\n").filter(Boolean);
  const current = app.pageId();
  classesEl.innerHTML = "";
  for (const name of names) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = name;
    if (current === "class:" + name) b.className = "current";
    b.addEventListener("click", () => {
      if (app.openClass(name)) {
        syncChrome();
      }
    });
    classesEl.appendChild(b);
  }
}

function syncChrome() {
  crumbEl.textContent = app.crumb();
  const id = app.sampleId();
  if ([...sampleEl.options].some((o) => o.value === id)) {
    sampleEl.value = id;
  }
  sourceEl.disabled = FIXTURES.has(id);
  const canAnalyze = app.hasCompiler() && (
    id === "compiler"
      ? app.hasCompilerTree()
      : sourceEl.value.trim().length > 0
  );
  analyzeEl.disabled = analyzing || !canAnalyze;
  backEl.disabled = !app.canBack();
  fwdEl.disabled = !app.canForward();
  umlEl.classList.toggle("on", !!app.umlView());
  const zoomSel = document.getElementById("zoomSel");
  if (zoomSel) zoomSel.disabled = !app.hasSelection();
  fillClasses();
}

async function installCompilerEnv() {
  const res = await fetch("./compileEnv.json");
  if (!res.ok) {
    throw new Error("compileEnv.json " + res.status + " — run: npm run codegraph:web");
  }
  const env = await res.json();
  for (const f of env.filesystem.files || []) {
    app.setRootFile(f.name, f.data);
  }
  const lib = (env.filesystem.folders || []).find((x) => x.name === "lib");
  if (lib) {
    for (const f of lib.files || []) {
      app.setLibFile(f.name, f.data);
    }
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
      if (!res.ok) {
        throw new Error("compilerSources.json " + res.status);
      }
      const pack = await res.json();
      const files = pack.files || pack;
      for (const name of Object.keys(files)) {
        app.setCompilerFile(name, files[name]);
      }
    })();
  }
  await compilerTreePromise;
}

async function analyzeCurrent(filename) {
  if (!app.hasCompiler()) {
    statusEl.textContent = "compiler libraries not loaded";
    return false;
  }
  analyzing = true;
  analyzeEl.disabled = true;
  try {
    if (filename === "compiler") {
      await installCompilerTree();
      return !!(await Promise.resolve(app.analyzeCompiler()));
    }
    const ok = await Promise.resolve(app.analyzeSource(sourceEl.value, filename));
    return !!ok;
  } finally {
    analyzing = false;
    app.fitView();
    syncChrome();
  }
}

async function loadExample(name) {
  sourceEl.disabled = false;
  if (name === "compiler") {
    sourceEl.value = COMPILER_NOTE;
    await analyzeCurrent("compiler");
    return;
  }
  sourceEl.value = await fetchExample(name);
  await analyzeCurrent(name);
}

sampleEl.addEventListener("change", async () => {
  const id = sampleEl.value;
  if (FIXTURES.has(id)) {
    sourceEl.value = "";
    sourceEl.disabled = true;
    app.loadSample(id);
    app.fitView();
    syncChrome();
    return;
  }
  try {
    await loadExample(id);
  } catch (err) {
    statusEl.textContent = String(err && err.message ? err.message : err);
  }
});
analyzeEl.addEventListener("click", async () => {
  const id = sampleEl.value;
  const file = FIXTURES.has(id) ? "example.rgr" : id;
  try {
    await analyzeCurrent(file);
  } catch (err) {
    statusEl.textContent = String(err && err.message ? err.message : err);
  }
});
backEl.addEventListener("click", () => {
  if (app.goBack()) syncChrome();
});
fwdEl.addEventListener("click", () => {
  if (app.goForward()) syncChrome();
});
document.getElementById("overview").addEventListener("click", () => {
  if (app.goOverview()) syncChrome();
});
umlEl.addEventListener("click", () => {
  app.setUml(!app.umlView());
  syncChrome();
});
document.getElementById("fit").addEventListener("click", () => app.fitView());
document.getElementById("zoomSel").addEventListener("click", () => {
  app.zoomToSelected();
});
canvas.addEventListener("dblclick", (ev) => {
  const [x, y] = at(ev);
  if (app.openAt(x, y)) {
    syncChrome();
  }
});
document.getElementById("svg").addEventListener("click", () => {
  const blob = new Blob([app.svg()], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "codegraph.svg";
  a.click();
  URL.revokeObjectURL(a.href);
});

let sceneFrame = null;
let builtDpr = 0;
const keeper = createViewKeeper({ overscan: 1 });
const frameCounts = { builds: 0, kept: 0 };
window.__frames = frameCounts;
let lastCmds = 0;
let gridFrame = null;
let gridPeriod = -1;
let gridBuiltAt = [0, 0];
let gridSize = [0, 0];

function paintOnce() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const tick = JSON.parse(app.frameView());
  const view = { x: tick.view[0], y: tick.view[1], scale: tick.view[2] };
  const grid = tick.grid || [0, 0, 0];
  const sizeChanged = gridSize[0] !== w || gridSize[1] !== h;

  if (!gridFrame || grid[2] !== gridPeriod || sizeChanged || dpr !== builtDpr) {
    const gdoc = JSON.parse(app.frameGrid());
    if (gridFrame) gridFrame.dispose();
    gridFrame = prepareDisplayList(gl, gdoc, { dpr });
    gridPeriod = grid[2];
    gridBuiltAt = [grid[0], grid[1]];
    gridSize = [w, h];
  }
  gridFrame.draw(null, [grid[0] - gridBuiltAt[0], grid[1] - gridBuiltAt[1], 1]);

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
  const chrome = tick.chrome;
  let chromeStats = null;
  if (chrome && chrome.cmds && chrome.cmds.length > 0) {
    const cf = prepareDisplayList(gl, { width: tick.width, height: tick.height, list: chrome }, { dpr });
    chromeStats = cf.draw(null, null, { clear: false });
    cf.dispose();
  }
  return { cmds, stats, chromeStats };
}

function frame() {
  resize();
  const painted = paintOnce();
  const stats = painted.stats;
  const paths = stats.paths + (painted.chromeStats ? painted.chromeStats.paths : 0);
  cmdsEl.textContent = `${painted.cmds} cmds · ${paths} paths`;
  statusEl.textContent = app.statusText();
  requestAnimationFrame(frame);
}

async function runSelfTest() {
  const nav = app.selfTest();
  let line = nav;
  try {
    sourceEl.value = await fetchExample("calls.rgr");
    const ok = await Promise.resolve(app.analyzeSource(sourceEl.value, "calls.rgr"));
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
  syncChrome();
}

async function main() {
  await loadFonts();
  resize();
  app.init(canvas.clientWidth, canvas.clientHeight);
  app.fitView();
  syncChrome();
  requestAnimationFrame(frame);
  await installCompilerEnv();
  const params = new URLSearchParams(location.search);
  if (params.has("selftest")) {
    await runSelfTest();
    return;
  }
  const sample = params.get("sample");
  if (sample && FIXTURES.has(sample)) {
    app.loadSample(sample);
    sourceEl.value = "";
    sourceEl.disabled = true;
    app.fitView();
    syncChrome();
    return;
  }
  const example = params.get("example") || "calls.rgr";
  if (example === "compiler" || EXAMPLES[example]) {
    sampleEl.value = example;
    await loadExample(example);
  }
}

main().catch((err) => {
  statusEl.textContent = String(err && err.message ? err.message : err);
  throw err;
});
