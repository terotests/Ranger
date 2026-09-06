/**
 * Ranger Fig host: file bytes in, EVG display list out, WebGL on the canvas.
 * OpenFig-core is loaded only for the live parse-time comparison.
 */
import { renderDisplayList, loadImages } from "./gl/evg-webgl.js";
import { installZstd } from "./zstd.mjs";
import { figmaClipboard, figmaClipboardName, readFigmaClipboard } from "./clipboard.mjs";

window.__pageStarted = true;

const canvas = document.getElementById("screen");
const statusEl = document.getElementById("status");
const nodesEl = document.getElementById("nodes");
const cmdsEl = document.getElementById("cmds");
const msEl = document.getElementById("ms");
const ofmsEl = document.getElementById("ofms");
const treeEl = document.getElementById("tree");
const propsEl = document.getElementById("props");
const pageEl = document.getElementById("page");
const frameEl = document.getElementById("frame");
const fileEl = document.getElementById("file");
const sampleEl = document.getElementById("sample");
const fitEl = document.getElementById("fit");
const zoom100El = document.getElementById("zoom100");
const debugEl = document.getElementById("debug");
const pasteEl = document.getElementById("paste");
const zoomlabEl = document.getElementById("zoomlab");
const mainEl = document.querySelector("main");

installZstd();

const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true });
if (!gl) {
  statusEl.textContent = "WebGL 2 not available";
  throw new Error("WebGL 2 required");
}

function asRangerBuffer(ab) {
  if (!ab._view) ab._view = new DataView(ab);
  return ab;
}

function engine() {
  if (typeof FigWeb !== "function") {
    throw new Error("fig_web.js did not define FigWeb — run the build");
  }
  return new FigWeb();
}

const web = engine();
window.__fig = web;

const imageUrls = new Map();

function revokeImages() {
  for (const url of imageUrls.values()) URL.revokeObjectURL(url);
  imageUrls.clear();
}

function collectImages() {
  revokeImages();
  const n = web.imageCount() | 0;
  for (let i = 0; i < n; i++) {
    const name = web.imageName(i);
    const buf = web.imageBytes(name);
    if (!buf || !buf.byteLength) continue;
    const blob = new Blob([buf], { type: "image/png" });
    imageUrls.set(name, URL.createObjectURL(blob));
  }
}

function rewriteImages(doc) {
  if (!doc?.list?.cmds) return doc;
  const cmds = doc.list.cmds.map((c) => {
    if (c.k !== 2 || !c.src) return c;
    const url = imageUrls.get(c.src);
    return url ? { ...c, src: url } : c;
  });
  return { ...doc, list: { ...doc.list, cmds } };
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(r.width * dpr));
  const h = Math.max(1, Math.floor(r.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  // The display list is laid out at the canvas's CSS size, so one scene
  // pixel is one CSS pixel and the GL side only applies the dpr.
  web.setViewport(Math.max(1, Math.floor(r.width)), Math.max(1, Math.floor(r.height)));
  return dpr;
}

async function draw() {
  const dpr = resize();
  let doc;
  try {
    doc = JSON.parse(web.scene());
  } catch (e) {
    statusEl.textContent = "scene json failed: " + e.message;
    return;
  }
  doc = rewriteImages(doc);
  const images = await loadImages(doc, { base: "" });
  renderDisplayList(gl, doc, { dpr, images });
  cmdsEl.textContent = String(doc.list?.cmds?.length || 0);
  window.__figDoc = doc;
}

function fillSelect(el, items, extra) {
  el.innerHTML = "";
  if (extra) {
    const o = document.createElement("option");
    o.value = extra.value;
    o.textContent = extra.label;
    el.appendChild(o);
  }
  for (const it of items) {
    const o = document.createElement("option");
    o.value = it.id ?? it.value;
    o.textContent = it.name || it.label || it.id;
    el.appendChild(o);
  }
}

function renderTree(node, into, depth) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = `${"  ".repeat(depth)}${node.type}  ${node.name || node.id}`;
  b.dataset.id = node.id;
  if (node.id === web.selected()) b.classList.add("on");
  b.addEventListener("click", () => {
    web.select(node.id);
    refreshChrome();
    draw();
  });
  into.appendChild(b);
  for (const ch of node.children || []) renderTree(ch, into, depth + 1);
}

function refreshChrome() {
  let stats = {};
  try { stats = JSON.parse(web.stats()); } catch { /* keep */ }
  statusEl.textContent = stats.ok === false
    ? (stats.error || "parse failed")
    : ((stats.file || "file") + " · " + (stats.prelude || "") + " v" + (stats.version ?? ""));
  nodesEl.textContent = String(stats.nodes ?? 0);
  msEl.textContent = stats.ms ? Number(stats.ms.total).toFixed(1) : "–";
  try {
    const pages = JSON.parse(web.pages());
    fillSelect(pageEl, pages);
    pageEl.value = pages[web.pageIndex()]?.id || pageEl.value;
  } catch { /* keep */ }
  try {
    const frames = JSON.parse(web.frames());
    fillSelect(frameEl, frames, { value: "-1", label: "(whole page)" });
    frameEl.value = String(web.frameIndex());
  } catch { /* keep */ }
  try {
    const tree = JSON.parse(web.tree());
    treeEl.innerHTML = "";
    renderTree(tree, treeEl, 0);
  } catch { treeEl.textContent = ""; }
  try {
    const props = JSON.parse(web.props());
    if (!Object.keys(props).length) {
      propsEl.textContent = "click a layer or the canvas";
    } else if ((typeof web.debug === "function" ? web.debug() : false)) {
      propsEl.textContent = JSON.stringify({
        figma: props.figma,
        scene: props.scene,
        evg: props.evg,
      }, null, 2);
    } else {
      propsEl.textContent = JSON.stringify(props, null, 2);
    }
  } catch { propsEl.textContent = ""; }
  if (zoomlabEl) zoomlabEl.textContent = Math.round((web.viewScale() || 1) * 100) + "%";
}

async function compareOpenFig(bytes) {
  ofmsEl.textContent = "…";
  try {
    const mod = await import("./openfig-compare.mjs");
    const ms = await mod.timeParse(bytes);
    ofmsEl.textContent = ms == null ? "n/a" : Number(ms).toFixed(1);
  } catch {
    ofmsEl.textContent = "n/a";
  }
}

async function openBuffer(ab, name) {
  statusEl.textContent = "parsing…";
  resize();
  const t0 = performance.now();
  const ok = web.openBytes(asRangerBuffer(ab), name);
  const rangerMs = performance.now() - t0;
  if (!ok) {
    statusEl.textContent = web.error() || "could not open";
    return;
  }
  collectImages();
  refreshChrome();
  msEl.textContent = rangerMs.toFixed(1);
  await draw();
  compareOpenFig(ab);
}

async function openSample() {
  statusEl.textContent = "building sample…";
  resize();
  const ok = web.openSample();
  if (!ok) {
    statusEl.textContent = web.error() || "sample failed";
    return;
  }
  collectImages();
  refreshChrome();
  await draw();
  ofmsEl.textContent = "–";
}

fileEl.addEventListener("change", async () => {
  const f = fileEl.files && fileEl.files[0];
  if (!f) return;
  await openBuffer(await f.arrayBuffer(), f.name);
});

sampleEl.addEventListener("click", () => openSample());
fitEl.addEventListener("click", () => { web.fit(); refreshChrome(); draw(); });
if (zoom100El) zoom100El.addEventListener("click", () => { web.zoom100(); refreshChrome(); draw(); });
if (debugEl) debugEl.addEventListener("change", () => { web.setDebug(debugEl.checked); refreshChrome(); draw(); });

pageEl.addEventListener("change", () => {
  const pages = JSON.parse(web.pages());
  const i = pages.findIndex((p) => p.id === pageEl.value);
  if (i >= 0) web.setPage(i);
  refreshChrome();
  draw();
});

frameEl.addEventListener("change", () => {
  web.setFrame(parseInt(frameEl.value, 10));
  refreshChrome();
  draw();
});

canvas.addEventListener("click", (ev) => {
  const r = canvas.getBoundingClientRect();
  const doc = window.__figDoc || {};
  const sw = doc.width || 1200;
  const sh = doc.height || 800;
  const x = (ev.clientX - r.left) * (sw / Math.max(1, r.width));
  const y = (ev.clientY - r.top) * (sh / Math.max(1, r.height));
  const id = web.hit(x, y);
  if (id) web.select(id);
  refreshChrome();
  draw();
});

let drag = null;
canvas.addEventListener("pointerdown", (ev) => {
  if (ev.button !== 1 && !ev.shiftKey) return;
  drag = { x: ev.clientX, y: ev.clientY, ox: web.viewX(), oy: web.viewY() };
  canvas.setPointerCapture(ev.pointerId);
});
canvas.addEventListener("pointermove", (ev) => {
  if (!drag) return;
  const dpr = canvas.width / Math.max(1, canvas.getBoundingClientRect().width);
  web.setView(drag.ox + (ev.clientX - drag.x) * dpr, drag.oy + (ev.clientY - drag.y) * dpr, web.viewScale());
  draw();
});
canvas.addEventListener("pointerup", () => { drag = null; });
canvas.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  const sc = web.viewScale() * (ev.deltaY > 0 ? 0.9 : 1.1);
  web.setView(web.viewX(), web.viewY(), sc);
  draw();
}, { passive: false });

["dragenter", "dragover"].forEach((t) => {
  window.addEventListener(t, (e) => { e.preventDefault(); mainEl.classList.add("drop"); });
});
window.addEventListener("dragleave", () => mainEl.classList.remove("drop"));
window.addEventListener("drop", async (e) => {
  e.preventDefault();
  mainEl.classList.remove("drop");
  const f = e.dataTransfer?.files?.[0];
  if (f) await openBuffer(await f.arrayBuffer(), f.name);
});

window.addEventListener("resize", () => draw());

// ⌘V / Ctrl+V straight from Figma: the copied nodes arrive as fig-kiwi bytes
// inside text/html, and a .fig file copied from the desktop comes as a file.
async function openClip(clip) {
  if (!clip.buffer) {
    statusEl.textContent = "paste: " + (clip.reason || "nothing usable");
    return false;
  }
  statusEl.textContent = "paste: " + clip.buffer.byteLength + " bytes from Figma, parsing…";
  try {
    await openBuffer(clip.buffer, figmaClipboardName(clip.meta));
  } catch (err) {
    statusEl.textContent = "paste failed: " + (err.message || err);
    console.error("[figma-viewer] paste", err);
    return false;
  }
  return true;
}

window.addEventListener("paste", async (e) => {
  const dt = e.clipboardData;
  if (!dt) {
    statusEl.textContent = "paste: the event carried no clipboardData";
    return;
  }
  const file = Array.from(dt.files || []).find((f) => /\.(fig|deck|jam)$/i.test(f.name));
  if (file) {
    e.preventDefault();
    await openBuffer(await file.arrayBuffer(), file.name);
    return;
  }
  const html = dt.getData("text/html");
  const clip = figmaClipboard(html);
  if (!clip.buffer) {
    // Say what came instead, so a paste that does nothing can be explained.
    statusEl.textContent = "paste: " + clip.reason + " · types: " + Array.from(dt.types || []).join(", ");
    console.warn("[figma-viewer] paste did not carry a Figma buffer", { types: Array.from(dt.types || []), html: (html || "").slice(0, 400) });
    return;
  }
  e.preventDefault();
  await openClip(clip);
});

if (pasteEl) {
  pasteEl.addEventListener("click", async () => {
    try {
      await openClip(await readFigmaClipboard());
    } catch (err) {
      statusEl.textContent = "paste: " + (err.message || err);
    }
  });
}

/** The .fig the page opens by itself: a real Figma export, shipped beside the
 *  page by the build. `?file=` picks another; `?file=sample` opens the deck
 *  Ranger builds in memory. */
const DEFAULT_FILE = "fixtures/health.fig";

/** Open a file the page can fetch: `?file=fixtures/health.fig`, with an
 *  optional `&page=N` and `&frame=N` to start on one page or frame.
 *  Relative to the page; no `file` opens DEFAULT_FILE, and a page served
 *  without the fixtures directory falls back to the built sample. */
async function openUrl(url, page, frame) {
  if (url === "sample") {
    await openSample();
  } else if (url) {
    statusEl.textContent = "fetching " + url + "…";
    const res = await fetch(url);
    if (!res.ok) throw new Error(url + ": " + res.status);
    await openBuffer(await res.arrayBuffer(), url.split("/").pop());
  } else {
    try {
      const res = await fetch(DEFAULT_FILE);
      if (!res.ok) throw new Error(DEFAULT_FILE + ": " + res.status);
      await openBuffer(await res.arrayBuffer(), DEFAULT_FILE.split("/").pop());
    } catch (err) {
      console.warn("[figma-viewer] " + DEFAULT_FILE + " did not load, building the sample instead", err);
      await openSample();
    }
  }
  if (Number.isFinite(page)) web.setPage(page);
  if (Number.isFinite(frame)) web.setFrame(frame);
  if (Number.isFinite(page) || Number.isFinite(frame)) {
    refreshChrome();
    await draw();
  }
}
window.__openUrl = openUrl;

const params = new URL(location.href).searchParams;
const intParam = (k) => (params.has(k) ? parseInt(params.get(k), 10) : NaN);
openUrl(params.get("file"), intParam("page"), intParam("frame")).catch((e) => {
  statusEl.textContent = String(e.message || e);
});
