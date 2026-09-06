/**
 * Ranger Fig host: file bytes in, EVG display list out, WebGL on the canvas.
 * OpenFig-core is loaded only for the live parse-time comparison.
 */
import { renderDisplayList, loadImages } from "./gl/evg-webgl.js";
import { figmaClipboard, figmaClipboardName, readFigmaClipboard, FIG_FILE_RE } from "./clipboard.mjs";

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
const warnsEl = document.getElementById("warns");
const warnLinkEl = document.getElementById("warnlink");
const mainEl = document.querySelector("main");


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

/** Warnings from the last conversion, grouped by what was unsupported.
 *  One summary rather than a console line per node: a file built out of
 *  components produces one warning per instance, and the list is only
 *  useful in aggregate. */
function warningSummary() {
  let list = [];
  try { list = JSON.parse(web.warnings()); } catch { /* keep */ }
  const groups = new Map();
  for (const w of list) {
    const g = groups.get(w.feature) || [];
    g.push(w);
    groups.set(w.feature, g);
  }
  const lines = [];
  for (const [feature, nodes] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    const sample = nodes.slice(0, 5).map((n) => n.id + " " + JSON.stringify(n.name)).join(", ");
    lines.push(nodes.length + "x " + feature + " — " + sample + (nodes.length > 5 ? ", …" : ""));
  }
  return { total: list.length, groups, lines };
}

function reportWarnings() {
  const w = warningSummary();
  window.__figWarnings = w.lines;
  if (warnsEl) warnsEl.textContent = String(w.total);
  if (w.total) console.warn("[figma-viewer] " + w.total + " unsupported:\n  " + w.lines.join("\n  "));
  return w;
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
  reportWarnings();
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
  reportWarnings();
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

function selectAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const doc = window.__figDoc || {};
  const sw = doc.width || 1200;
  const sh = doc.height || 800;
  const x = (clientX - r.left) * (sw / Math.max(1, r.width));
  const y = (clientY - r.top) * (sh / Math.max(1, r.height));
  const id = web.hit(x, y);
  if (id) web.select(id);
  refreshChrome();
  draw();
}

// Dragging the canvas pans it, with any button. A page bigger than the
// window is the normal case — the fit button is not a substitute for
// moving around — and a modifier nobody is told about is the same as no
// panning at all. A press that does not travel is still a selection, so
// the two share the gesture: the drag decides which it was on release.
const DRAG_SLOP = 4;
let drag = null;
canvas.addEventListener("pointerdown", (ev) => {
  drag = {
    id: ev.pointerId,
    x: ev.clientX,
    y: ev.clientY,
    ox: web.viewX(),
    oy: web.viewY(),
    moved: false,
  };
  canvas.setPointerCapture(ev.pointerId);
});
canvas.addEventListener("pointermove", (ev) => {
  if (!drag || ev.pointerId !== drag.id) return;
  const dx = ev.clientX - drag.x;
  const dy = ev.clientY - drag.y;
  if (!drag.moved && Math.abs(dx) + Math.abs(dy) < DRAG_SLOP) return;
  drag.moved = true;
  canvas.style.cursor = "grabbing";
  // The canvas backing store is bigger than its CSS box on a HiDPI screen,
  // and the view is in backing-store pixels, so the pointer's travel has
  // to be scaled or the page slides at the wrong speed.
  const dpr = canvas.width / Math.max(1, canvas.getBoundingClientRect().width);
  web.setView(drag.ox + dx * dpr, drag.oy + dy * dpr, web.viewScale());
  draw();
});
function endDrag(ev) {
  if (!drag || ev.pointerId !== drag.id) return;
  const wasDrag = drag.moved;
  drag = null;
  canvas.style.cursor = "grab";
  if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
  if (!wasDrag && ev.button === 0) selectAt(ev.clientX, ev.clientY);
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);
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

/** Everything known about the last paste, in one place: what the clipboard
 *  carried, what came out of the base64, and what the engine made of it.
 *  A paste that silently draws nothing is the failure this exists for, so
 *  the report is written to the Selected pane and to window.__lastPaste
 *  rather than only to the console. */
function pasteReport(clip, stage) {
  const report = { stage, reason: clip.reason || "", clipboard: clip.debug || {} };
  if (clip.buffer) report.clipboard.bytes = clip.buffer.byteLength;
  if (stage === "drawn") {
    try {
      const st = JSON.parse(web.stats());
      report.engine = {
        pasted: st.pasted, prelude: st.prelude, version: st.version, zstd: st.zstd,
        nodes: st.nodes, pages: st.pages, blobs: st.blobs, images: st.images,
        // A paste is orphans by nature: the copied layers point at the page
        // they came from. adopted < orphans would be layers read and never
        // drawn, which is what a half-empty paste looks like from here.
        orphans: st.orphans, unrooted: st.unrooted, adopted: st.adopted,
        cmds: st.cmds, ms: st.ms,
      };
      report.frames = JSON.parse(web.frames()).map((f) => f.name);
      report.warnings = JSON.parse(web.warnings());
    } catch (err) {
      report.engine = { error: String(err.message || err) };
    }
  }
  window.__lastPaste = report;
  if (propsEl) propsEl.textContent = "paste report\n" + JSON.stringify(report, null, 2);
  console[stage === "drawn" ? "log" : "warn"]("[figma-viewer] paste", report);
  return report;
}

async function openClip(clip) {
  if (!clip.buffer) {
    const r = pasteReport(clip, "rejected");
    const types = (r.clipboard.types || []).join(", ");
    statusEl.textContent = "paste: " + (clip.reason || "nothing usable") + (types ? " · types: " + types : "");
    return false;
  }
  statusEl.textContent = "paste: " + clip.buffer.byteLength + " bytes from Figma, parsing…";
  try {
    await openBuffer(clip.buffer, figmaClipboardName(clip.meta));
  } catch (err) {
    clip.reason = String(err.message || err);
    pasteReport(clip, "failed");
    statusEl.textContent = "paste failed: " + (err.message || err);
    console.error("[figma-viewer] paste", err);
    return false;
  }
  const r = pasteReport(clip, "drawn");
  const e = r.engine || {};
  // Counts, not "ok": they are what says whether the paste arrived whole.
  statusEl.textContent = "paste: " + clip.buffer.byteLength + " bytes · "
    + (e.nodes || 0) + " nodes · " + (e.pages || 0) + " pages · "
    + (r.frames || []).length + " frames"
    + (e.orphans ? " · " + e.adopted + "/" + e.orphans + " loose layers placed" : "")
    + ((r.warnings || []).length ? " · " + r.warnings.length + " warnings" : "");
  return true;
}

window.addEventListener("paste", async (e) => {
  const dt = e.clipboardData;
  if (!dt) {
    statusEl.textContent = "paste: the event carried no clipboardData";
    return;
  }
  const file = Array.from(dt.files || []).find((f) => FIG_FILE_RE.test(f.name));
  if (file) {
    e.preventDefault();
    await openBuffer(await file.arrayBuffer(), file.name);
    return;
  }
  const html = dt.getData("text/html");
  const clip = figmaClipboard(html);
  clip.debug.types = Array.from(dt.types || []);
  if (!clip.buffer) {
    // Say what came instead, so a paste that does nothing can be explained.
    clip.debug.htmlHead = (html || "").slice(0, 400);
    await openClip(clip);
    return;
  }
  e.preventDefault();
  await openClip(clip);
});

// The count in the footer is the headline; the list is what says which
// layers and why, so it goes where a reader can read it.
if (warnLinkEl) {
  warnLinkEl.addEventListener("click", (ev) => {
    ev.preventDefault();
    const w = warningSummary();
    if (propsEl) {
      propsEl.textContent = w.total
        ? "unsupported (" + w.total + ")\n\n" + w.lines.join("\n\n")
        : "nothing unsupported in this file";
    }
  });
}

if (pasteEl) {
  pasteEl.addEventListener("click", async () => {
    try {
      await openClip(await readFigmaClipboard());
    } catch (err) {
      // NotAllowedError when the read was not granted: that is the answer,
      // not a bug, and the page has to say which it was.
      pasteReport({ buffer: null, reason: String(err.name || "") + ": " + (err.message || err), debug: {} }, "rejected");
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
