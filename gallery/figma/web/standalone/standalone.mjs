/**
 * Ranger Fig host: file bytes in, EVG display list out, WebGL on the canvas.
 * OpenFig-core is loaded only for the live parse-time comparison.
 */
import { renderDisplayList, loadImages } from "./gl/evg-webgl.js";
// The frame crosses as typed arrays, not as text — see `draw`.
import { cmdsOfBinary } from "./gl/evg-binary.js";
import { attachViewGestures } from "./gl/evg-gestures.js";
// The file this page's head started fetching before the body was parsed.
import { responseFor } from "./evg/assets-client.mjs";
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
const inspEl = document.getElementById("inspector");
const pageEl = document.getElementById("page");
const frameEl = document.getElementById("frame");
const fileEl = document.getElementById("file");
const sampleEl = document.getElementById("sample");
const fitEl = document.getElementById("fit");
const debugEl = document.getElementById("debug");
const pasteEl = document.getElementById("paste");
const zoomlabEl = document.getElementById("zoomlab");
const zoomInEl = document.getElementById("zoomin");
const zoomOutEl = document.getElementById("zoomout");
const warnsEl = document.getElementById("warns");
const warnLinkEl = document.getElementById("warnlink");
const unreadEl = document.getElementById("unread");
const unreadLinkEl = document.getElementById("unreadlink");
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
    // Typed arrays, not JSON. The list is the same picture either way — to
    // the hundredth, which `gallery/evg/gl/list-binary-check.mjs` holds the
    // two to — but a board is thousands of commands and tens of thousands of
    // coordinates, and writing that as text was most of what a pan cost:
    // `toJson` and the number formatting under it 42% of a profile, and the
    // garbage they made another 33%. `scene()` still answers in JSON for
    // anything that wants to read a frame.
    const bin = web.sceneBin();
    doc = { width: bin.width, height: bin.height, list: { cmds: cmdsOfBinary(bin) } };
  } catch (e) {
    statusEl.textContent = "scene failed: " + e.message;
    return;
  }
  doc = rewriteImages(doc);
  const images = await loadImages(doc, { base: "" });
  renderDisplayList(gl, doc, { dpr, images });
  cmdsEl.textContent = String(doc.list?.cmds?.length || 0);
  window.__figDoc = doc;
}

// Interactive input arrives faster than a frame, and a frame is not cheap:
// setView rebuilds the display list in Ranger and draw() serialises the
// whole scene to JSON and back. Applying every wheel event as it lands is
// what made zooming stutter — the queue grows while the work is being
// redone. So input records where the view should be, and one animation
// frame moves it there and paints once.
let pendingView = null;
let framePending = false;
let painting = false;
let repaintWanted = false;

/** Where the view is, counting anything input has asked for but that has
 *  not been applied yet. */
function viewNow() {
  if (pendingView) return pendingView;
  return { x: web.viewX(), y: web.viewY(), sc: web.viewScale() };
}

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 16;

function setViewSoon(x, y, sc) {
  pendingView = { x, y, sc: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, sc)) };
  showZoom(pendingView.sc);
  scheduleFrame();
}

function scheduleFrame() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(async () => {
    framePending = false;
    if (pendingView) {
      web.setView(pendingView.x, pendingView.y, pendingView.sc);
      pendingView = null;
    }
    if (painting) {
      // A paint is still in flight; come back after it rather than
      // starting a second one over the same GL context.
      repaintWanted = true;
      return;
    }
    painting = true;
    try {
      await draw();
    } finally {
      painting = false;
      if (repaintWanted) {
        repaintWanted = false;
        scheduleFrame();
      }
    }
  });
}

function showZoom(sc) {
  if (zoomlabEl) zoomlabEl.textContent = Math.round((sc || 1) * 100) + "%";
}

/** Zoom keeping one point on the screen where it is. Without an anchor a
 *  zoom pulls the page toward the origin and every step has to be undone
 *  with a pan. The scene is laid out in CSS pixels, so the anchor is too. */
function zoomAbout(factor, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const px = clientX == null ? r.width / 2 : clientX - r.left;
  const py = clientY == null ? r.height / 2 : clientY - r.top;
  const now = viewNow();
  const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, now.sc * factor));
  if (next === now.sc) return;
  const k = next / now.sc;
  setViewSoon(px - (px - now.x) * k, py - (py - now.y) * k, next);
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

/* ---------------------------------------------------------------------------
 * The layers pane.
 *
 * A board is thousands of layers, and a flat list of all of them is not a
 * tree — it is a wall. This is the tree: rows fold, and the pane is rooted at
 * ONE layer at a time. Picking something on the canvas roots it there, so what
 * you get is the handful of layers under what you just clicked rather than the
 * whole file scrolled to somewhere near it. The crumbs above say where that is
 * and climb back out.
 *
 * Everything is open by default — a fold you have to click through to see
 * anything is a list with extra steps — and folds itself only when a root has
 * more rows under it than anyone reads at once.
 * ------------------------------------------------------------------------- */

const ROW_BUDGET = 600;

let layerTree = null;   // the page as `web.tree()` last gave it
let scopeId = null;     // the layer the pane is rooted at; null is the page
const folded = new Set();   // folded by hand
const opened = new Set();   // opened by hand, and so never folded for room
const subtreeSize = new Map();

/** How many rows a layer costs, itself included. Measured once per tree so
 *  the pane can decide what fits without laying it out to find out. */
function sizeOf(node) {
  const seen = subtreeSize.get(node.id);
  if (seen != null) return seen;
  let n = 1;
  for (const ch of node.children || []) n += sizeOf(ch);
  subtreeSize.set(node.id, n);
  return n;
}

function findPath(node, id, path) {
  if (!node) return null;
  if (node.id === id) return [...path, node];
  for (const ch of node.children || []) {
    const hit = findPath(ch, id, [...path, node]);
    if (hit) return hit;
  }
  return null;
}

/** Where to root the pane for a layer the canvas just picked: at it when it
 *  has anything under it, and at its parent when it does not — the siblings
 *  of a leaf are the useful thing to see, and a pane holding one row is not. */
function scopeFor(id) {
  const path = findPath(layerTree, id, []);
  if (!path) return null;
  const node = path[path.length - 1];
  if ((node.children || []).length) return node.id;
  const parent = path[path.length - 2];
  return parent ? parent.id : node.id;
}

function scopeTo(id) {
  scopeId = id;
  folded.clear();
  opened.clear();
  renderLayers();
}

function renderLayers() {
  treeEl.textContent = "";
  if (!layerTree) return;
  const path = scopeId ? (findPath(layerTree, scopeId, []) || [layerTree]) : [layerTree];
  const root = path[path.length - 1];

  if (path.length > 1) {
    const crumbs = document.createElement("div");
    crumbs.className = "crumbs";
    path.forEach((n, i) => {
      if (i) crumbs.append(document.createTextNode("›"));
      const c = document.createElement("button");
      c.type = "button";
      c.textContent = n.name || n.type || n.id;
      c.title = n.id;
      if (i === path.length - 1) c.className = "here";
      c.addEventListener("click", () => scopeTo(i ? n.id : null));
      crumbs.append(c);
    });
    treeEl.append(crumbs);
  }

  const selected = web.selected();
  let budget = ROW_BUDGET;
  let selectedRow = null;

  // `reserve` is the rows still owed to layers queued behind this one, up
  // the whole chain. Without it the first section on a board eats the pane
  // and the twenty after it never appear at all — not even folded.
  const walk = (node, depth, reserve) => {
    if (budget <= 0) return;
    budget -= 1;
    const kids = node.children || [];
    const row = document.createElement("div");
    row.className = "row" + (node.id === selected ? " on" : "");
    row.style.paddingLeft = 2 + depth * 11 + "px";

    // Open, unless it was folded by hand or is too big to fit in what is
    // left of the pane — and a layer opened by hand stays open however big
    // it is.
    const tooBig = depth > 0 && !opened.has(node.id) && sizeOf(node) - 1 > budget - reserve;
    const open = kids.length > 0 && !folded.has(node.id) && !tooBig;

    const fold = document.createElement("button");
    fold.type = "button";
    fold.className = "fold";
    if (kids.length) {
      fold.textContent = open ? "▾" : "▸";
      fold.title = open ? "Fold this layer" : `Open this layer — ${sizeOf(node) - 1} under it`;
      fold.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (open) { folded.add(node.id); opened.delete(node.id); }
        else { folded.delete(node.id); opened.add(node.id); }
        renderLayers();
      });
    } else {
      fold.textContent = "";
      fold.disabled = true;
    }
    row.append(fold);

    const pick = document.createElement("button");
    pick.type = "button";
    pick.className = "pick";
    pick.title = node.id;
    const ty = document.createElement("span");
    ty.className = "ty";
    ty.textContent = node.type;
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = node.name || node.id;
    pick.append(ty, nm);
    pick.addEventListener("click", () => {
      // Picking IN the tree selects and no more: rooting the pane at every
      // click would take the tree away as you walked down it.
      web.select(node.id);
      refreshChrome();
      draw();
    });
    row.append(pick);

    if (kids.length && node.id !== root.id) {
      const into = document.createElement("button");
      into.type = "button";
      into.className = "into";
      into.textContent = "⤵";
      into.title = "Show only what is under this layer";
      into.addEventListener("click", (ev) => { ev.stopPropagation(); scopeTo(node.id); });
      row.append(into);
    }

    treeEl.append(row);
    if (node.id === selected) selectedRow = row;
    if (!open) return;
    for (let i = 0; i < kids.length; i += 1) {
      walk(kids[i], depth + 1, reserve + (kids.length - 1 - i));
    }
  };
  walk(root, 0, 0);

  if (budget <= 0) {
    const more = document.createElement("p");
    more.className = "more";
    more.textContent = "that is as far as the pane goes — fold a layer, or click into one";
    treeEl.append(more);
  }
  if (selectedRow) selectedRow.scrollIntoView({ block: "nearest" });
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

/** Fields the file carries that the converter never reads. The warnings
 *  above can only name a case someone thought of; when a page looks wrong
 *  and nothing is reported, what is missing is what nobody wrote a warning
 *  for, so this is the list to read next. */
function unreadSummary() {
  let list = [];
  try { list = JSON.parse(web.unread()); } catch { /* keep */ }
  const named = list.filter((u) => u.note);
  const lines = list.map(
    (u) => String(u.count).padStart(6) + "  " + u.field + (u.note ? "\n          " + u.note : "")
      + "\n          e.g. " + u.id + " " + JSON.stringify(u.name)
  );
  return { total: list.length, named: named.length, lines };
}

/** The scene by node type, and how much of it puts nothing on the canvas.
 *  A type whose nodes mostly draw nothing is where the page is losing its
 *  content, and it names a type rather than a layer. */
function censusSummary() {
  let c = { types: [], imagesMissing: 0, overridesSeen: 0, overridesUsed: 0, overridesUnplaced: 0 };
  try { c = JSON.parse(web.census()); } catch { /* keep */ }
  const types = [...c.types].sort((a, b) => b.drawNothing - a.drawNothing || b.nodes - a.nodes);
  const empty = types.reduce((n, t) => n + t.drawNothing, 0);
  const total = types.reduce((n, t) => n + t.nodes, 0);
  const lines = types.map(
    (t) => String(t.nodes).padStart(6) + "  " + t.type.padEnd(20) +
      (t.drawNothing ? t.drawNothing + " of them draw nothing" : "")
  );
  return {
    empty, total, lines,
    imagesMissing: c.imagesMissing,
    overridesSeen: c.overridesSeen,
    overridesUsed: c.overridesUsed,
    overridesUnplaced: c.overridesUnplaced,
  };
}

function diagnosticsText() {
  const c = censusSummary();
  const u = unreadSummary();
  const out = [];
  // Where the time went, so a slow file can be blamed on the stage that
  // is actually slow rather than on the reader as a whole.
  try {
    const st = JSON.parse(web.stats());
    const ms = st.ms || {};
    const stage = (name, v) => name + " " + Number(v || 0).toFixed(0) + "ms";
    out.push(
      "parsed in " + Number(ms.total || 0).toFixed(0) + "ms — " +
        [stage("zip", ms.zip), stage("inflate", ms.inflate), stage("zstd", ms.zstd),
         stage("schema", ms.schema), stage("decode", ms.decode), stage("tree", ms.tree)].join(", ")
    );
    out.push(st.nodes + " nodes in the file, " + st.cmds + " draw commands out of them");
    out.push("");
  } catch { /* keep */ }
  out.push("the scene by node type — " + c.total + " nodes, " + c.empty + " of which put nothing on the canvas");
  if (c.imagesMissing) out.push(c.imagesMissing + " image fills have no bytes in the file and paint as grey boxes");
  if (c.overridesSeen) {
    out.push(
      c.overridesSeen + " instance overrides in the file, " + c.overridesUsed + " applied"
        + (c.overridesUnplaced
            ? ", " + c.overridesUnplaced + " naming no node in their component"
              + " (a variant that is not the one shown, or a layer hidden in it — Figma draws neither)"
            : "")
        + (c.overridesUsed ? "" : " — instances are showing their component's own text")
    );
  }
  out.push(c.lines.join("\n"));
  out.push("");
  out.push("fields this file carries that the reader does not look at");
  out.push("(" + u.named + " of " + u.total + " are known to change what you see)");
  out.push(u.total ? u.lines.join("\n\n") : "  none — the reader looks at every field in this file");
  return out.join("\n");
}

function reportWarnings() {
  const w = warningSummary();
  window.__figWarnings = w.lines;
  if (warnsEl) warnsEl.textContent = String(w.total);
  if (w.total) console.warn("[figma-viewer] " + w.total + " unsupported:\n  " + w.lines.join("\n  "));
  const u = unreadSummary();
  const c = censusSummary();
  window.__figUnread = u.lines;
  window.__figCensus = c;
  if (unreadEl) unreadEl.textContent = String(c.empty);
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
    // The option's value is the frame's INDEX, which is what `setFrame`
    // takes and what `frameIndex` reads back. Listing the ids instead left
    // the control blank on every file — no option ever matched the index
    // put into it — and picking one called `setFrame(13709)`, out of range,
    // which quietly showed the whole page again. A section with no name
    // wears its id rather than an empty row.
    const frames = JSON.parse(web.frames());
    fillSelect(frameEl, frames.map((f, i) => ({ id: String(i), name: f.name || f.id })),
      { value: "-1", label: "(whole page)" });
    frameEl.value = String(web.frameIndex());
  } catch { /* keep */ }
  try {
    layerTree = JSON.parse(web.tree());
    subtreeSize.clear();
    if (scopeId && !findPath(layerTree, scopeId, [])) scopeId = null;
    renderLayers();
  } catch { layerTree = null; treeEl.textContent = ""; }
  refreshInspector();
  showZoom(web.viewScale());
}

/* ---------------------------------------------------------------------------
 * The inspector.
 *
 * The scene graph is a graph and not a picture, so this is not a list of facts
 * about the selected layer: the numbers on it ARE the layer, and typing one
 * paints the page again. Figma answers this with a grid of boxes; here only
 * what you can change looks like a field and everything else is text. A label
 * is a scrub handle - drag it sideways and the number follows, which beats
 * aiming at a spinner and is the one gesture worth borrowing.
 *
 * Nothing is written back to the file. `Revert` re-reads the document the
 * scene was converted from.
 * ------------------------------------------------------------------------- */

let inspectedId = null;

function refreshInspector() {
  let d = null;
  try { d = JSON.parse(web.inspect()); } catch { d = null; }
  const debug = typeof web.debug === "function" ? web.debug() : false;
  if (!d || !d.id) {
    inspectedId = null;
    inspEl.hidden = true;
    propsEl.hidden = false;
    if (!propsEl.textContent) propsEl.textContent = "click a layer or the canvas";
    return;
  }
  propsEl.hidden = !debug;
  if (debug) {
    try {
      const props = JSON.parse(web.props());
      propsEl.textContent = JSON.stringify({ figma: props.figma, scene: props.scene }, null, 2);
    } catch { /* keep */ }
  }
  inspEl.hidden = false;
  // Rebuilt only when the selection changes: a field must not be torn out
  // from under the caret on its own keystroke.
  if (inspectedId !== d.id) {
    inspectedId = d.id;
    buildInspector(d);
  }
}

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const round = (v) => Math.round(v * 100) / 100;

/** A number you can type or drag. The label is the handle, with pointer
 *  capture so the drag survives leaving the 60 pixels the label occupies. */
function numField(label, value, apply, opts = {}) {
  const wrap = el("div", "f");
  const lab = el("label", null, label);
  const inp = el("input");
  inp.value = String(round(value));
  inp.inputMode = "decimal";
  inp.spellcheck = false;
  const step = opts.step ?? 1;
  const commit = (v) => {
    if (!Number.isFinite(v)) return;
    if (opts.min != null && v < opts.min) v = opts.min;
    if (opts.max != null && v > opts.max) v = opts.max;
    inp.value = String(round(v));
    apply(v);
  };
  inp.addEventListener("change", () => commit(parseFloat(inp.value)));
  inp.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") { commit(parseFloat(inp.value)); inp.blur(); }
    if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
      ev.preventDefault();
      const by = (ev.key === "ArrowUp" ? 1 : -1) * (ev.shiftKey ? 10 : step);
      commit((parseFloat(inp.value) || 0) + by);
    }
  });
  let scrub = null;
  lab.addEventListener("pointerdown", (ev) => {
    scrub = { x: ev.clientX, from: parseFloat(inp.value) || 0 };
    lab.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });
  lab.addEventListener("pointermove", (ev) => {
    if (!scrub) return;
    commit(scrub.from + (ev.clientX - scrub.x) * (ev.shiftKey ? step * 10 : step));
  });
  const stop = () => { scrub = null; };
  lab.addEventListener("pointerup", stop);
  lab.addEventListener("pointercancel", stop);
  wrap.append(lab, inp);
  return wrap;
}

function colorField(label, hex, apply) {
  const wrap = el("div", "f wide");
  const lab = el("label", null, label);
  lab.style.cursor = "default";
  const pick = el("input");
  pick.type = "color";
  pick.value = hex;
  const text = el("input");
  text.value = hex;
  text.spellcheck = false;
  const commit = (v) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(v)) return;
    pick.value = v.toLowerCase();
    text.value = v.toLowerCase();
    apply(v.toLowerCase());
  };
  pick.addEventListener("input", () => commit(pick.value));
  text.addEventListener("change", () => commit(text.value.trim()));
  wrap.append(lab, pick, text);
  return wrap;
}

function section(title) {
  const s = el("section");
  s.append(el("h3", null, title));
  return s;
}

function fieldRow(...fields) {
  const row = el("div", "fields");
  row.append(...fields);
  return row;
}

/** An edit repaints the page. The panel is left alone: the values it shows
 *  are the ones just typed into it. */
function afterEdit() {
  draw();
  const revert = inspEl.querySelector(".foot button");
  if (revert) revert.disabled = false;
}

function buildInspector(d) {
  inspEl.textContent = "";

  const head = el("div", "head");
  head.append(el("span", "nm", d.name || d.id), el("span", "chip", d.source || d.kind));
  const eye = el("button", "eye" + (d.visible ? "" : " off"), d.visible ? "◉" : "◌");
  eye.type = "button";
  eye.title = "Show or hide this layer";
  eye.addEventListener("click", () => {
    const on = !eye.classList.contains("off");
    web.editVisible(!on);
    eye.classList.toggle("off", on);
    eye.textContent = on ? "◌" : "◉";
    afterEdit();
  });
  head.append(eye);
  inspEl.append(head);

  const geom = section("Position and size");
  const rect = { x: d.x, y: d.y, w: d.w, h: d.h };
  const push = () => { web.editRect(rect.x, rect.y, rect.w, rect.h); afterEdit(); };
  geom.append(fieldRow(
    numField("X", d.x, (v) => { rect.x = v; push(); }),
    numField("Y", d.y, (v) => { rect.y = v; push(); }),
    numField("W", d.w, (v) => { rect.w = v; push(); }, { min: 0 }),
    numField("H", d.h, (v) => { rect.h = v; push(); }, { min: 0 }),
  ));
  geom.append(el("p", "note", `on the page  ${round(d.pageX)}, ${round(d.pageY)}`));
  inspEl.append(geom);

  const look = section("Appearance");
  const opacity = el("div", "f");
  const opLab = el("label", null, "Opacity");
  opLab.style.cursor = "default";
  const slider = el("input");
  slider.type = "range";
  slider.min = "0"; slider.max = "100"; slider.step = "1";
  slider.value = String(Math.round(d.opacity * 100));
  const pct = el("span", "chip", slider.value + "%");
  slider.addEventListener("input", () => {
    pct.textContent = slider.value + "%";
    web.editOpacity(Number(slider.value) / 100);
    afterEdit();
  });
  opacity.append(opLab, slider, pct);
  look.append(fieldRow(opacity));
  const row = [];
  if (d.fill) row.push(colorField("Fill", d.fill.hex, (v) => { web.editFill(v); afterEdit(); }));
  if (d.stroke) {
    row.push(colorField("Stroke", d.stroke.hex, (v) => { web.editStroke(v, d.stroke.weight); afterEdit(); }));
    row.push(numField("Weight", d.stroke.weight, (v) => { web.editStroke(d.stroke.hex, v); afterEdit(); }, { min: 0, step: 0.5 }));
  }
  row.push(numField("Radius", d.radius, (v) => { web.editRadius(v); afterEdit(); }, { min: 0 }));
  look.append(fieldRow(...row));
  if (d.fill && d.fill.kind !== "solid") {
    look.append(el("p", "note", `the paint is a ${d.fill.kind}; a colour here makes it solid`));
  }
  if (d.image) look.append(el("p", "note", "image  " + d.image));
  inspEl.append(look);

  if (d.text) {
    const t = section("Text");
    const facts = el("div", "facts");
    facts.append(
      el("span", "chip", `${d.text.family} ${d.text.weight}`),
      el("span", "chip", `${round(d.text.size)}px`),
      el("span", "chip", d.text.align),
    );
    t.append(facts);
    const area = el("textarea");
    area.value = d.text.chars;
    area.spellcheck = false;
    let typing = null;
    area.addEventListener("input", () => {
      clearTimeout(typing);
      typing = setTimeout(() => { web.editText(area.value); afterEdit(); }, 120);
    });
    t.append(area);
    t.append(el("p", "note", d.text.outline
      ? "drawn as the outlines the editor shaped — retyping drops them for the font this machine has"
      : "drawn as text, in the font this machine has"));
    inspEl.append(t);
  }

  if (d.layout) {
    const l = section("Auto layout");
    const facts = el("div", "facts");
    facts.append(
      el("span", "chip", d.layout.mode),
      el("span", "chip", "gap " + round(d.layout.gap)),
      el("span", "chip", "padding " + d.layout.padding.map(round).join(" ")),
      el("span", "chip", d.layout.justify + " · " + d.layout.align),
    );
    l.append(facts);
    l.append(el("p", "note", "read from the file; every layer is drawn where it was exported"));
    inspEl.append(l);
  }

  const facts = [];
  if (d.children) facts.push(`${d.children} ${d.children === 1 ? "child" : "children"}`);
  if (d.hasPath) facts.push("vector path");
  if (d.clip) facts.push("clips its content");
  for (const fx of d.effects || []) facts.push(`${fx.kind} ${round(fx.blur)}px`);
  if (facts.length || (d.warnings || []).length) {
    const more = section("Also");
    const chips = el("div", "facts");
    for (const f of facts) chips.append(el("span", "chip", f));
    more.append(chips);
    for (const w of d.warnings || []) more.append(el("p", "warn", "not drawn fully: " + w));
    inspEl.append(more);
  }

  const foot = el("div", "foot");
  foot.append(el("code", null, d.id));
  // What the file gave this layer, what the reader made of it, and which of
  // the two is missing the colour — to the console, where it can be read and
  // pasted. A page that draws wrong in a file nobody can send anywhere is
  // otherwise only describable in gestures.
  const why = el("button", null, "Selection debug");
  why.type = "button";
  why.title = "Print everything about this layer to the console";
  why.addEventListener("click", () => {
    const text = web.selectionDebug();
    window.__selectionDebug = text;
    console.log(text);
    statusEl.textContent = "selection debug printed to the console (also window.__selectionDebug)";
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  });
  foot.append(why);
  const revert = el("button", null, "Revert edits");
  revert.type = "button";
  revert.disabled = !d.edits;
  revert.title = "Read the layers back from the file";
  revert.addEventListener("click", () => {
    web.revertEdits();
    inspectedId = null;
    refreshInspector();
    draw();
  });
  foot.append(revert);
  inspEl.append(foot);
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
// A step per press, about the middle of the canvas — the same factor a
// notch of the wheel gives, so the two agree.
const STEP = 1.25;
if (zoomInEl) zoomInEl.addEventListener("click", () => zoomAbout(STEP, null, null));
if (zoomOutEl) zoomOutEl.addEventListener("click", () => zoomAbout(1 / STEP, null, null));
if (zoomlabEl) {
  zoomlabEl.addEventListener("click", () => { web.zoom100(); refreshChrome(); draw(); });
}
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
  if (id) {
    web.select(id);
    // What you just clicked is what the pane is about.
    const scope = scopeFor(id);
    if (scope) { scopeId = scope; folded.clear(); }
  }
  refreshChrome();
  draw();
}

// Drag to pan with any button, two fingers to pinch, wheel or trackpad to
// zoom, and a press that does not travel is a selection. All of it is
// `gallery/evg/gl/evg-gestures.js`, which reads the view this page keeps
// and hands back another — the page still decides when to paint one.
attachViewGestures(canvas, {
  view: viewNow,
  setView: setViewSoon,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  onTap: (clientX, clientY) => selectAt(clientX, clientY),
  onCursor: (name) => { canvas.style.cursor = name; },
});

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

if (unreadLinkEl) {
  unreadLinkEl.addEventListener("click", (ev) => {
    ev.preventDefault();
    if (propsEl) propsEl.textContent = diagnosticsText();
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
      // The head started this before the body was parsed — see
      // gallery/evg/web/tools/inline-assets.mjs.
      const res = await responseFor(DEFAULT_FILE);
      if (res instanceof Error) throw res;
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
// One paint, on demand: what a bench times and what a test waits for.
window.__draw = draw;

const params = new URL(location.href).searchParams;
const intParam = (k) => (params.has(k) ? parseInt(params.get(k), 10) : NaN);
openUrl(params.get("file"), intParam("page"), intParam("frame")).catch((e) => {
  statusEl.textContent = String(e.message || e);
});
