/**
 * CodeGraph in a tab.
 *
 *   INPUT   browser event → CodeGraphWeb → FlowEditor
 *   RENDER  FlowEditor.frameJson() → EVGDisplayList → evg-webgl.js
 *
 * The chrome (class list, breadcrumb, history) is this page. RangerFlow only
 * draws the current window of the graph.
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
const backEl = document.getElementById("back");
const fwdEl = document.getElementById("fwd");
const umlEl = document.getElementById("uml");
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
  "wheelGesture", "fitView", "pointerMove",
  "statusText", "stats", "selfTest", "sceneJson", "frameView", "frameScene",
  "frameGrid", "tick", "viewGesture", "classList", "crumb", "pageId",
  "pageTitle", "titleText", "sampleId", "umlView", "canBack", "canForward",
  "svg",
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
        app.fitView();
        syncChrome();
      }
    });
    classesEl.appendChild(b);
  }
}

function syncChrome() {
  crumbEl.textContent = app.crumb();
  sampleEl.value = app.sampleId();
  backEl.disabled = !app.canBack();
  fwdEl.disabled = !app.canForward();
  umlEl.classList.toggle("on", !!app.umlView());
  fillClasses();
}

sampleEl.addEventListener("change", () => {
  app.loadSample(sampleEl.value);
  app.fitView();
  syncChrome();
});
backEl.addEventListener("click", () => {
  if (app.goBack()) app.fitView();
  syncChrome();
});
fwdEl.addEventListener("click", () => {
  if (app.goForward()) app.fitView();
  syncChrome();
});
document.getElementById("overview").addEventListener("click", () => {
  if (app.goOverview()) app.fitView();
  syncChrome();
});
umlEl.addEventListener("click", () => {
  app.setUml(!app.umlView());
  app.fitView();
  syncChrome();
});
document.getElementById("fit").addEventListener("click", () => app.fitView());
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

async function main() {
  await loadFonts();
  resize();
  app.init(canvas.clientWidth, canvas.clientHeight);
  app.fitView();
  syncChrome();
  const params = new URLSearchParams(location.search);
  if (params.get("sample")) {
    app.loadSample(params.get("sample"));
    app.fitView();
    syncChrome();
  }
  if (params.has("selftest")) {
    const line = app.selfTest();
    selfTestEl.textContent = line;
    selfTestEl.style.display = "block";
    statusEl.textContent = line;
    syncChrome();
  }
  requestAnimationFrame(frame);
}

main().catch((err) => {
  statusEl.textContent = String(err && err.message ? err.message : err);
  throw err;
});
