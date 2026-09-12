/**
 * Ranger Fig host: file bytes in, EVG display list out, WebGL on the canvas.
 */
import { prepareDisplayList, loadImages } from "./gl/evg-webgl.js";
// The frame crosses as typed arrays, not as text — see `draw`.
import { cmdsOfBinary, viewOfBinary } from "./gl/evg-binary.js";
// Keep the frame or walk the board again — see `draw` and `moveView`.
import { createViewKeeper } from "./gl/evg-view.js";
import { attachViewGestures } from "./gl/evg-gestures.js";
// The file this page's head started fetching before the body was parsed.
import { responseFor } from "./evg/assets-client.mjs";
import { figmaClipboard, figmaClipboardName, readFigmaClipboard, FIG_FILE_RE } from "./clipboard.mjs";

window.__pageStarted = true;

const canvas = document.getElementById("screen");
const statusEl = document.getElementById("status");
const nodesEl = document.getElementById("nodes");
const cmdsEl = document.getElementById("cmds");
// How many view changes were served from the frame in hand rather than by
// walking the board again. The number IS the feature.
const keptEl = document.getElementById("kept");
const msEl = document.getElementById("ms");
const treeEl = document.getElementById("tree");
const propsEl = document.getElementById("props");
const inspEl = document.getElementById("inspector");
const pageListEl = document.getElementById("pagelist");
const pageCountEl = document.getElementById("pagecount");
const frameEl = document.getElementById("frame");
const fileNameEl = document.getElementById("filename");
const assetsEl = document.getElementById("assets");
const assetCountEl = document.getElementById("assetcount");
const rawEl = document.getElementById("raw");
const zoomReadEl = document.getElementById("zoomread");
const rulerTopEl = document.getElementById("rulertop");
const rulerLeftEl = document.getElementById("rulerleft");
const sizeBadgeEl = document.getElementById("sizebadge");
const boardEl = document.getElementById("board");
const handlesEl = document.getElementById("handles");
const guidesEl = document.getElementById("guides");
const toolMoveEl = document.getElementById("toolmove");
const toolHandEl = document.getElementById("toolhand");
const debugBtnEl = document.getElementById("debugbtn");
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
// The view as a CAMERA on the list rather than a transform on the element
// tree. A pan is then three numbers, the frame in hand and a uniform,
// instead of a walk of the whole board: see `moveView` below.
web.setCamera(true);
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

// THE FRAME IN HAND, and the arithmetic that says whether it is still the
// right one. A pan inside the region the list was built for, at a scale
// inside the band its glyphs and curves were built for, is the same frame
// drawn somewhere else: one uniform, no walk of the board, no upload. Past
// either, the scene is walked again for a new region. See
// gallery/evg/PLAN_VIEW_TRANSFORM.md and gl/evg-view.js.
let frame = null;
let frameDpr = 0;
const keeper = createViewKeeper({ overscan: 1 });

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
    doc = { width: bin.width, height: bin.height, view: viewOfBinary(bin), list: { cmds: cmdsOfBinary(bin) } };
  } catch (e) {
    statusEl.textContent = "scene failed: " + e.message;
    return;
  }
  doc = rewriteImages(doc);
  const images = await loadImages(doc, { base: "" });
  if (frame) frame.dispose();
  frame = prepareDisplayList(gl, doc, { dpr, images });
  frameDpr = dpr;
  frame.draw(null, doc.view);
  // Only a list that CARRIES a camera may be drawn at another view. Without
  // one the view is already multiplied into the coordinates, so redrawing it
  // somewhere else would move the picture twice.
  if (doc.view) keeper.built(doc.view, canvas.clientWidth, canvas.clientHeight);
  else keeper.reset();
  cmdsEl.textContent = String(doc.list?.cmds?.length || 0);
  window.__figDoc = doc;
  refreshOverlays();
}

/**
 * The view moved. Draw the frame in hand if it still covers where we are,
 * else walk the board again.
 *
 * This is the whole of S1: the expensive path is the one it does NOT take.
 * A pan used to be `setView` — which wrote a transform and walked 3,565
 * nodes — then a serialise, a decode, an atlas and an upload. Inside the
 * region and the band it is now a uniform and a draw call.
 */
async function moveView(v) {
  const view = { x: v.x, y: v.y, scale: v.sc };
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const fit = frame && frameDpr === (window.devicePixelRatio || 1) ? keeper.fits(view, w, h) : { keep: false };
  // Ranger keeps the numbers either way: the hit test, the selection ring
  // and the inspector all read the view, and they must agree with the
  // picture whether the frame was kept or built.
  web.setView(view.x, view.y, view.scale);
  if (fit.keep) {
    frame.draw(null, view);
    showKept(keeper.counts);
    return;
  }
  await draw();
  showKept(keeper.counts);
}

function showKept(counts) {
  if (!keptEl) return;
  keptEl.textContent = counts.kept + " kept / " + counts.builds + " built";
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
  // The rulers and the badge come from the VIEW, not from the board, so they
  // move with the hand rather than with the next paint. A ruler a frame
  // behind the thing it measures is worse than no ruler.
  refreshOverlays();
  scheduleFrame();
}

function scheduleFrame() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(async () => {
    framePending = false;
    const moving = pendingView;
    pendingView = null;
    if (painting) {
      // A paint is still in flight; come back after it rather than
      // starting a second one over the same GL context.
      if (moving) pendingView = moving;
      repaintWanted = true;
      return;
    }
    painting = true;
    try {
      if (moving) {
        await moveView(moving);
      } else {
        await draw();
      }
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
    // ONE GLYPH FOR THE TYPE, not the word. "STROKE_GEOMETRY" in front of
    // every name is sixteen characters of column that the name then has to
    // share, and at the fourth level of a tree the name is what is left out.
    // The shape is what a reader is after anyway — Figma draws an icon here
    // for the same reason.
    const ty = document.createElement("span");
    ty.className = "ty";
    ty.textContent = typeGlyph(node.type);
    ty.title = node.type;
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = node.name || node.id;
    if (node.type === "INSTANCE" || node.type === "SYMBOL") pick.classList.add("inst");
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

/** A node type as one character. Kept as a table rather than guessed from
 *  the name, because the interesting ones are the ones that do not read like
 *  their shape: a STICKY is a note, a SECTION is the board's own furniture,
 *  and STROKE_GEOMETRY is an outline the file brought rather than a layer
 *  anybody drew. Anything unlisted falls through to a neutral mark, which is
 *  honest: the tooltip still carries the word. */
const TYPE_GLYPHS = {
  DOCUMENT: "▣", CANVAS: "▤", PAGE: "▤",
  FRAME: "▢", GROUP: "▢", SECTION: "▥",
  INSTANCE: "◈", SYMBOL: "◈", COMPONENT: "◈", COMPONENT_SET: "◈",
  TEXT: "T", STICKY: "▧", SHAPE_WITH_TEXT: "▧",
  VECTOR: "✧", BOOLEAN_OPERATION: "✧", STAR: "✦", LINE: "╱", CONNECTOR: "↗",
  RECTANGLE: "▭", ROUNDED_RECTANGLE: "▭", ELLIPSE: "◯", REGULAR_POLYGON: "△",
  STAMP: "◍", WIDGET: "⬡", MEDIA: "▶", TABLE: "▦", CODE_BLOCK: "⌗",
  STROKE_GEOMETRY: "◌", EMOJI: "☺",
};
function typeGlyph(t) {
  return TYPE_GLYPHS[t] || "·";
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
  // The file's name goes where a design tool puts it: the top of the rail,
  // not the middle of a status line.
  if (fileNameEl) fileNameEl.textContent = stats.file || "Ranger Fig";
  try {
    renderPages(JSON.parse(web.pages()), web.pageIndex());
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
  if (!d || !d.id) {
    inspectedId = null;
    inspEl.hidden = true;
    propsEl.hidden = false;
    if (!propsEl.textContent) propsEl.textContent = "click a layer or the canvas";
    return;
  }
  // The raw node has a tab of its own now; the panel keeps the hint line for
  // when nothing is selected and is otherwise the inspector alone.
  propsEl.hidden = true;
  renderRaw();
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

/* What a layer IS decides what the panel shows.
 *
 * Everything used to get every section: a radius field on a line, a fill on
 * a text layer whose colour is set somewhere else, "Auto layout" on a sticky.
 * A panel that shows a control for something the layer cannot have teaches
 * the reader to stop reading it. So the sections are picked by kind, and each
 * one is only built when the layer actually has the thing.
 */

/** Kinds that are placed as a rectangle and can be rounded. A path carries
 *  its own corners in its outline and a text layer has none. */
const BOXY = new Set(["container", "image", "sticky"]);

function buildInspector(d) {
  inspEl.textContent = "";

  const isInstance = d.source === "INSTANCE" || d.source === "SYMBOL" || !!d.componentId;
  const head = el("div", "head");
  head.append(el("span", "kindlab", isInstance ? "Instance" : (d.source || d.kind)));
  if (!isInstance) head.lastChild.style.color = "var(--faint)";
  head.append(el("span", "nm", d.name || d.id));
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

  // --- the component an instance came from ---------------------------------
  // The reader already follows this to draw the instance; the panel saying so
  // is what turns the word INSTANCE into somewhere to go.
  if (d.componentId) {
    const c = section("Component");
    const go = el("button", null, d.componentName || d.componentId);
    go.type = "button";
    go.className = "linkbtn";
    go.title = "Select the component this instance is of";
    go.addEventListener("click", () => {
      web.select(d.componentId);
      const scope = scopeFor(d.componentId);
      if (scope) { scopeId = scope; folded.clear(); }
      refreshChrome();
      draw();
    });
    c.append(go);
    c.append(el("p", "note", "an instance is drawn from this component's layers"));
    inspEl.append(c);
  }

  // --- position -------------------------------------------------------------
  const geom = section("Position");
  const rect = { x: d.x, y: d.y, w: d.w, h: d.h };
  const push = () => { web.editRect(rect.x, rect.y, rect.w, rect.h); afterEdit(); };

  // ALIGN IN THE PARENT, which is arithmetic on two rectangles — and the
  // panel has only ever had one of them. `inspect` carries the parent's box
  // now, so these six are real moves and not decoration.
  if (d.parentW > 0 && d.parentH > 0) {
    const bar = el("div", "alignbar");
    const move = (nx, ny) => {
      if (nx != null) rect.x = nx;
      if (ny != null) rect.y = ny;
      push();
      inspectedId = null;   // the fields have to re-read the numbers
      refreshInspector();
    };
    const mk = (title, glyph, fn) => {
      const b = el("button", null, glyph);
      b.type = "button";
      b.title = title;
      b.addEventListener("click", fn);
      bar.append(b);
    };
    mk("Align left in " + (d.parentName || "the parent"), "⇤", () => move(0, null));
    mk("Centre horizontally", "↔", () => move((d.parentW - d.w) / 2, null));
    mk("Align right", "⇥", () => move(d.parentW - d.w, null));
    mk("Align top", "⤒", () => move(null, 0));
    mk("Centre vertically", "↕", () => move(null, (d.parentH - d.h) / 2));
    mk("Align bottom", "⤓", () => move(null, d.parentH - d.h));
    geom.append(bar);
  }

  geom.append(fieldRow(
    numField("X", d.x, (v) => { rect.x = v; push(); }),
    numField("Y", d.y, (v) => { rect.y = v; push(); }),
  ));

  // The turn, and the mirror beside it. A mirror is not a turn — no angle
  // reverses handedness — so it is its own switch and not a rotation of 180.
  const turn = el("div", "fields");
  turn.append(numField("∠", d.rotation || 0, (v) => { web.editRotation(v); afterEdit(); }, { step: 1 }));
  const flip = el("button", "flipbtn" + (d.mirrored ? " on" : ""), d.mirrored ? "⇋ flipped" : "⇋ flip");
  flip.type = "button";
  flip.title = "Mirror this layer. A mirror reverses handedness, which no angle does.";
  flip.addEventListener("click", () => { web.editFlip(); afterEdit(); inspectedId = null; refreshInspector(); });
  turn.append(flip);
  geom.append(turn);
  geom.append(el("p", "note", `on the page  ${round(d.pageX)}, ${round(d.pageY)}`));
  inspEl.append(geom);

  // --- size -----------------------------------------------------------------
  const size = section("Layout");
  size.append(fieldRow(
    numField("W", d.w, (v) => { rect.w = v; push(); }, { min: 0 }),
    numField("H", d.h, (v) => { rect.h = v; push(); }, { min: 0 }),
  ));
  if (d.layout) {
    const facts = el("div", "facts");
    facts.append(
      el("span", "chip", d.layout.mode),
      el("span", "chip", "gap " + round(d.layout.gap)),
      el("span", "chip", "padding " + d.layout.padding.map(round).join(" ")),
      el("span", "chip", d.layout.justify + " · " + d.layout.align),
    );
    size.append(facts);
    size.append(el("p", "note", "auto layout as the file exported it — every layer is drawn where Figma put it"));
  }
  // A container is the only thing that can cut its children off at its edge.
  if (d.kind === "container" || d.children > 0) {
    size.append(check("Clip content", d.clip, (on) => { web.editClip(on); afterEdit(); }));
  }
  inspEl.append(size);

  // --- text ------------------------------------------------------------------
  if (d.text) {
    const t = section("Text");
    const area = el("textarea");
    area.value = d.text.chars;
    area.spellcheck = false;
    let typing = null;
    area.addEventListener("input", () => {
      clearTimeout(typing);
      typing = setTimeout(() => { web.editText(area.value); afterEdit(); }, 120);
    });
    t.append(area);
    const style = { size: d.text.size, lh: d.text.lineHeight, ls: d.text.letterSpacing, al: d.text.align };
    const pushStyle = () => { web.editTextStyle(style.size, style.lh, style.ls, style.al); afterEdit(); };
    t.append(fieldRow(
      numField("Size", d.text.size, (v) => { style.size = v; pushStyle(); }, { min: 1 }),
      numField("Line", d.text.lineHeight, (v) => { style.lh = v; pushStyle(); }, { min: 0, step: 0.1 }),
      numField("Track", d.text.letterSpacing, (v) => { style.ls = v; pushStyle(); }, { step: 0.1 }),
    ));
    t.append(pick("Align", ["left", "center", "right"], d.text.align, (v) => { style.al = v; pushStyle(); }));
    const facts = el("div", "facts");
    facts.append(el("span", "chip", `${d.text.family} ${d.text.weight}`));
    t.append(facts);
    t.append(el("p", "note", d.text.outline
      ? "drawn as the outlines the editor shaped — changing any of these lays the line out here instead, in the font this machine has"
      : "drawn as text, in the font this machine has"));
    inspEl.append(t);
  }

  // --- the picture ------------------------------------------------------------
  if (d.image) {
    const im = section("Image");
    const facts = el("div", "facts");
    facts.append(el("span", "chip", d.imageFit || "cover"));
    if (d.crop) facts.append(el("span", "chip", "cropped"));
    im.append(facts);
    if (d.crop) {
      im.append(el("p", "note",
        `showing ${(d.crop[2] * 100).toFixed(0)}% × ${(d.crop[3] * 100).toFixed(0)}% of the bitmap, from ${(d.crop[0] * 100).toFixed(1)}%, ${(d.crop[1] * 100).toFixed(1)}%`));
    }
    im.append(el("p", "note", "bytes  " + d.image));
    inspEl.append(im);
  }

  // --- what it is painted with -------------------------------------------------
  const look = section("Appearance");
  const opacity = el("div", "f wide");
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
  // A COLOUR SWATCH FOR A PICTURE IS A LIE. An image paint has no colour —
  // `hex` is whatever the solid fields happened to hold — and the Image
  // section above already says what it is painted with.
  const paintIsImage = d.fill && d.fill.kind === "image";
  if (d.fill && !paintIsImage) {
    look.append(fieldRow(colorField("Fill", d.fill.hex, (v) => { web.editFill(v); afterEdit(); })));
  }
  if (d.stroke) {
    look.append(fieldRow(colorField("Stroke", d.stroke.hex, (v) => { web.editStroke(v, d.stroke.weight); afterEdit(); })));
    look.append(fieldRow(
      numField("Weight", d.stroke.weight, (v) => { web.editStroke(d.stroke.hex, v); afterEdit(); }, { min: 0, step: 0.5 }),
      el("div", "f", d.stroke.align),
    ));
    look.lastChild.lastChild.title = "which side of the edge the stroke sits on";
  }
  // A RADIUS ONLY WHERE THERE CAN BE ONE. A path carries its corners in its
  // own outline and a text layer has none, so the field was a number that
  // went nowhere on both.
  if (BOXY.has(d.kind)) {
    look.append(fieldRow(numField("Radius", d.radius, (v) => { web.editRadius(v); afterEdit(); }, { min: 0 })));
    if (!d.radiusUniform) look.append(el("p", "note", "the four corners differ; one number here sets them all"));
  }
  if (d.fill && d.fill.kind === "gradient") {
    look.append(el("p", "note", "the paint is a gradient; a colour here makes it solid"));
  }
  inspEl.append(look);

  // --- the outline, where there is one ------------------------------------------
  if (d.hasPath) {
    const pth = section("Path");
    const facts = el("div", "facts");
    facts.append(el("span", "chip", d.evenOdd ? "even-odd" : "non-zero"));
    pth.append(facts);
    pth.append(el("p", "note", d.evenOdd
      ? "a ring inside a ring is a hole — the rule the file wrote"
      : "overlapping rings fill; a hole needs the winding to run the other way"));
    inspEl.append(pth);
  }

  // --- everything else worth saying ----------------------------------------------
  const facts = [];
  if (d.children) facts.push(`${d.children} ${d.children === 1 ? "child" : "children"}`);
  if (d.parentId) facts.push("in " + (d.parentName || d.parentId));
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

/** A checkbox that reads like the rows around it. */
function check(label, on, apply) {
  const wrap = el("label", "chk");
  const box = el("input");
  box.type = "checkbox";
  box.checked = !!on;
  box.addEventListener("change", () => apply(box.checked));
  wrap.append(box, el("span", null, label));
  return wrap;
}

/** One of a few, as a segmented row — three buttons beat a <select> when
 *  there are three answers and each is one word. */
function pick(label, options, value, apply) {
  const wrap = el("div", "seg");
  wrap.append(el("span", "segl", label));
  const group = el("div", "segb");
  for (const o of options) {
    const b = el("button", null, o);
    b.type = "button";
    b.setAttribute("aria-pressed", o === value ? "true" : "false");
    b.addEventListener("click", () => {
      for (const other of group.children) other.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-pressed", "true");
      apply(o);
    });
    group.append(b);
  }
  wrap.append(group);
  return wrap;
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

/** The file's pages, as a list. A <select> hides all but one of them behind
 *  a click, and which page you are on is the first thing a reader of a file
 *  needs to know — Figma puts them in the rail for the same reason. */
function renderPages(pages, current) {
  pageListEl.textContent = "";
  pageCountEl.textContent = pages.length > 1 ? String(pages.length) : "";
  for (let i = 0; i < pages.length; i += 1) {
    const p = pages[i];
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-current", i === current ? "true" : "false");
    const ic = document.createElement("span");
    ic.className = "ic";
    ic.textContent = "▤";
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = p.name || p.id;
    b.append(ic, nm);
    b.title = p.id;
    b.addEventListener("click", () => {
      if (i === web.pageIndex()) return;
      web.setPage(i);
      // A page is a different board: the layers pane has to start again at
      // its root rather than stay rooted at a layer that is not on it.
      scopeId = null;
      folded.clear();
      refreshChrome();
      draw();
    });
    pageListEl.append(b);
  }
}

frameEl.addEventListener("change", () => {
  web.setFrame(parseInt(frameEl.value, 10));
  refreshChrome();
  draw();
});

/* ---------------------------------------------------------------------------
 * The rails' tabs, the rulers, the size badge and the tools.
 *
 * Chrome, all of it — but chrome that says something the board cannot. The
 * rulers give the board its own coordinates back (a layer at x=11073 is at
 * 11073, not "somewhere right"), the badge gives the selection its size where
 * the eye already is, and the hand tool is the one gesture the board could not
 * express: drag WITHOUT the click at the end of it selecting something.
 * ------------------------------------------------------------------------- */

function wireTabs(barId, panes) {
  const bar = document.getElementById(barId);
  if (!bar) return;
  bar.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-pane]");
    if (!b) return;
    for (const other of bar.querySelectorAll("button[data-pane]")) {
      other.setAttribute("aria-selected", other === b ? "true" : "false");
    }
    for (const [name, el] of Object.entries(panes)) {
      if (el) el.hidden = name !== b.dataset.pane;
    }
    if (b.dataset.pane === "assets") renderAssets();
    if (b.dataset.pane === "raw") renderRaw();
  });
}
wireTabs("lefttabs", {
  file: document.getElementById("filepane"),
  assets: document.getElementById("assetspane"),
});
wireTabs("righttabs", {
  design: document.getElementById("designpane"),
  raw: document.getElementById("rawpane"),
});

/** The images the file carries. The only thing in a .fig that is an asset in
 *  Figma's sense, and the one list that says whether a picture drew as grey
 *  because the bytes are missing or because the reader lost them. */
let assetUrls = [];
function renderAssets() {
  for (const u of assetUrls) URL.revokeObjectURL(u);
  assetUrls = [];
  assetsEl.textContent = "";
  let n = 0;
  try { n = web.imageCount() | 0; } catch { n = 0; }
  assetCountEl.textContent = n ? String(n) : "";
  if (!n) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "this file carries no images";
    assetsEl.append(p);
    return;
  }
  for (let i = 0; i < n; i += 1) {
    const name = web.imageName(i);
    const fig = document.createElement("figure");
    const thumb = document.createElement("div");
    thumb.className = "thumb";
    try {
      const bytes = web.imageBytes(name);
      if (bytes && bytes.byteLength) {
        const url = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
        assetUrls.push(url);
        thumb.style.backgroundImage = `url("${url}")`;
      }
    } catch { /* a hash with no bytes stays an empty tile, which is the fact */ }
    const cap = document.createElement("figcaption");
    cap.textContent = name.length > 12 ? name.slice(0, 10) + "…" : name;
    cap.title = name;
    fig.append(thumb, cap);
    assetsEl.append(fig);
  }
}

/** The raw node beside the layer it became — the pane the Debug checkbox used
 *  to push into the middle of the inspector.
 *
 * ONLY WHEN THE TAB IS SHOWING. `props()` serialises the selected node's whole
 * raw subtree AND the scene it became; on a board's section that is twelve
 * megabytes of JSON, built in Ranger, escaped a character at a time and parsed
 * back. Called on every selection change it was the selection change: 2.8
 * seconds of a 5-second profile, under `jsonEscape`, for a pane nobody was
 * looking at. A hidden pane costs nothing now, and switching to it builds it.
 */
function renderRaw() {
  if (!rawEl || rawEl.parentElement?.hidden) return;
  try {
    const props = JSON.parse(web.props());
    rawEl.textContent = JSON.stringify({ figma: props.figma, scene: props.scene }, null, 2);
  } catch {
    rawEl.textContent = "select a layer to see the node the file carries and the layer it became";
  }
}

/* Rulers. Ticks every 1, 2, 5 × 10^n board units, whichever lands between 60
 * and 220 pixels apart at the current zoom — the same ladder a chart axis
 * climbs, for the same reason: a tick you cannot read the label of is a line. */
function niceStep(minPx, scale) {
  const raw = minPx / Math.max(scale, 1e-6);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 5, 10]) {
    if (pow * m >= raw) return pow * m;
  }
  return pow * 10;
}

function drawRulers() {
  if (!rulerTopEl || !rulerLeftEl) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const v = viewNow();
  const css = getComputedStyle(document.body);
  const ink = css.getPropertyValue("--faint").trim() || "#999";
  const line = css.getPropertyValue("--line").trim() || "#ddd";
  const face = css.getPropertyValue("--rail").trim() || "#fff";
  const step = niceStep(90, v.sc);
  const label = (n) => (Math.abs(n) >= 10000 ? (n / 1000).toFixed(1) + "k" : String(Math.round(n)));

  const each = (el, horizontal) => {
    const r = el.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (el.width !== w || el.height !== h) { el.width = w; el.height = h; }
    const c = el.getContext("2d");
    if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, r.width, r.height);
    c.fillStyle = face;
    c.fillRect(0, 0, r.width, r.height);
    c.font = '9px ui-monospace, Menlo, Consolas, monospace';
    c.textBaseline = "middle";
    // The span of board the ruler covers, from the view the board is drawn
    // with: screen = board * sc + offset, so board = (screen - offset) / sc.
    const span = horizontal ? r.width : r.height;
    const off = horizontal ? v.x : v.y;
    const from = Math.floor((0 - off) / v.sc / step) * step;
    const to = (span - off) / v.sc;
    for (let n = from; n <= to; n += step) {
      const p = n * v.sc + off;
      if (p < -40 || p > span + 40) continue;
      c.strokeStyle = line;
      c.beginPath();
      if (horizontal) { c.moveTo(Math.round(p) + 0.5, 13); c.lineTo(Math.round(p) + 0.5, 20); }
      else { c.moveTo(13, Math.round(p) + 0.5); c.lineTo(20, Math.round(p) + 0.5); }
      c.stroke();
      c.fillStyle = ink;
      if (horizontal) {
        c.textAlign = "left";
        c.fillText(label(n), Math.round(p) + 3, 7);
      } else {
        // Down the left edge, turned a quarter so the digits read upward
        // like Figma's — a horizontal number in a 20px column is two digits
        // and an ellipsis.
        c.save();
        c.translate(8, Math.round(p) + 3);
        c.rotate(-Math.PI / 2);
        c.textAlign = "left";
        c.fillText(label(n), 0, 0);
        c.restore();
      }
    }
  };
  each(rulerTopEl, true);
  each(rulerLeftEl, false);
}

/** The selection's size, under it, where Figma puts it. Placed from the same
 *  view the board is drawn with, so it follows a pan without a repaint. */
function placeSizeBadge() {
  if (!sizeBadgeEl) return;
  let d = null;
  try { d = JSON.parse(web.inspect()); } catch { d = null; }
  if (!d || !d.id || !(d.w > 0) || !(d.h > 0)) { sizeBadgeEl.hidden = true; return; }
  const v = viewNow();
  const r = boardEl.getBoundingClientRect();
  const x = (d.pageX + d.w / 2) * v.sc + v.x;
  const y = (d.pageY + d.h) * v.sc + v.y;
  if (x < -80 || y < -40 || x > r.width + 80 || y > r.height + 40) { sizeBadgeEl.hidden = true; return; }
  sizeBadgeEl.hidden = false;
  sizeBadgeEl.style.left = x + "px";
  sizeBadgeEl.style.top = (y + 7) + "px";
  sizeBadgeEl.textContent = `${round(d.w)} × ${round(d.h)}`;
}


/* ---------------------------------------------------------------------------
 * The selection, as something you can take hold of.
 *
 * The panel could always move a layer — type a number into X. What it could
 * not do is the thing a hand does: put the layer where it looks right. So the
 * selection gets a body to drag, eight handles to resize by, a ring to turn
 * it with, and a snap that lines it up with what is beside it.
 *
 * All of it is DOM over the board rather than commands in the display list. A
 * handle has to stay 9 pixels whatever the zoom — in the list it would grow
 * with the board — and a drag on one must NOT reach the gesture handler
 * underneath, which would pan instead. An element that stops the event is the
 * whole of that second problem solved.
 *
 * Every drag ends in `editRect` or `editRotation`, the same two calls the
 * fields in the panel make. Nothing is written back to the file.
 * ------------------------------------------------------------------------- */

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const SNAP_PX = 6;          // how near, in SCREEN pixels, counts as lined up

let handleEls = null;
let dragging = null;

function buildHandles() {
  if (handleEls) return handleEls;
  handlesEl.textContent = "";
  // One group, so a turned layer's handles turn with it: they are placed on
  // the layer's UNTURNED box and the group carries the angle, about the same
  // origin Figma turns a layer about — its own top-left corner.
  const group = el("div", "grp");
  handlesEl.append(group);
  const body = el("div", "body");
  group.append(body);
  const hs = {};
  for (const k of HANDLES) {
    const h = el("div", "h " + k);
    group.append(h);
    hs[k] = h;
  }
  const rot = el("div", "rot");
  group.append(rot);
  handleEls = { group, body, hs, rot };
  body.addEventListener("pointerdown", (e) => startDrag(e, "move"));
  for (const k of HANDLES) hs[k].addEventListener("pointerdown", (e) => startDrag(e, k));
  rot.addEventListener("pointerdown", (e) => startDrag(e, "rotate"));
  return handleEls;
}

/** Where the selection's box is on the screen, from the same view the board
 *  is drawn with. Null when there is nothing selected or it is off-screen. */
function selectionScreenBox() {
  let d = null;
  try { d = JSON.parse(web.inspect()); } catch { d = null; }
  if (!d || !d.id || !(d.w > 0) || !(d.h > 0)) return null;
  const v = viewNow();
  return {
    d,
    x: d.pageX * v.sc + v.x,
    y: d.pageY * v.sc + v.y,
    w: d.w * v.sc,
    h: d.h * v.sc,
    sc: v.sc,
  };
}

/** The handles, placed. Called on every paint and every pan, like the badge:
 *  they follow the view rather than the document. */
function placeHandles() {
  if (!handlesEl) return;
  // Mid-drag the box is being rewritten on every move; placing it again from
  // the engine is what keeps the handle under the finger.
  const b = selectionScreenBox();
  if (!b || handTool) { handlesEl.hidden = true; return; }
  const r = boardEl.getBoundingClientRect();
  if (b.x > r.width || b.y > r.height || b.x + b.w < 0 || b.y + b.h < 0) {
    handlesEl.hidden = true;
    return;
  }
  const { group, body, hs, rot } = buildHandles();
  handlesEl.hidden = false;
  const deg = b.d.rotation || 0;
  group.style.transformOrigin = b.x + "px " + b.y + "px";
  group.style.transform = deg ? `rotate(${deg}deg)` : "";
  body.style.left = b.x + "px";
  body.style.top = b.y + "px";
  body.style.width = b.w + "px";
  body.style.height = b.h + "px";
  const at = { nw: [0, 0], n: [0.5, 0], ne: [1, 0], e: [1, 0.5],
               se: [1, 1], s: [0.5, 1], sw: [0, 1], w: [0, 0.5] };
  // A box too small to hold them would be all handle and no box: below that
  // the corners stay and the edges go.
  const tight = b.w < 34 || b.h < 34;
  for (const k of HANDLES) {
    const [fx, fy] = at[k];
    hs[k].style.left = (b.x + b.w * fx) + "px";
    hs[k].style.top = (b.y + b.h * fy) + "px";
    hs[k].hidden = tight && k.length === 1;
  }
  rot.style.left = (b.x + b.w / 2) + "px";
  rot.style.top = (b.y - 22) + "px";
}

/** The lines the selection is currently lined up with. */
function showGuides(lines) {
  if (!guidesEl) return;
  guidesEl.textContent = "";
  const r = boardEl.getBoundingClientRect();
  for (const g of lines) {
    const d = el("div");
    if (g.axis === "x") {
      d.style.left = g.at + "px";
      d.style.top = "0";
      d.style.width = "1px";
      d.style.height = r.height + "px";
    } else {
      d.style.left = "0";
      d.style.top = g.at + "px";
      d.style.width = r.width + "px";
      d.style.height = "1px";
    }
    guidesEl.append(d);
  }
}

/** The edges and centres of what the selection sits beside, in PAGE units.
 *  Read once when a drag starts: the board does not change under it. */
function snapSources() {
  try {
    const boxes = JSON.parse(web.snapBoxes());
    const xs = [];
    const ys = [];
    for (const b of boxes) {
      xs.push(b.x, b.x + b.w / 2, b.x + b.w);
      ys.push(b.y, b.y + b.h / 2, b.y + b.h);
    }
    return { xs, ys };
  } catch {
    return { xs: [], ys: [] };
  }
}

/** The nudge that lines `edges` up with one of `lines`, or 0. The delta is
 *  ADJUSTED, never replaced: a layer never jumps to a guide it was not
 *  already beside — the same rule the slide editor snaps by. */
function nearestSnap(edges, lines, tol) {
  let best = 0;
  let bestGap = tol;
  let hit = null;
  for (const e of edges) {
    for (const L of lines) {
      const gap = Math.abs(L - e);
      if (gap < bestGap) { bestGap = gap; best = L - e; hit = L; }
    }
  }
  return { by: best, at: hit };
}

function startDrag(ev, mode) {
  const b = selectionScreenBox();
  if (!b) return;
  ev.preventDefault();
  ev.stopPropagation();
  ev.target.setPointerCapture(ev.pointerId);
  const v = viewNow();
  dragging = {
    mode,
    id: b.d.id,
    from: { x: b.d.x, y: b.d.y, w: b.d.w, h: b.d.h },
    pageFrom: { x: b.d.pageX, y: b.d.pageY },
    rot0: b.d.rotation || 0,
    startX: ev.clientX,
    startY: ev.clientY,
    sc: v.sc,
    centre: { x: b.x + b.w / 2, y: b.y + b.h / 2 },
    snap: snapSources(),
    moved: false,
  };
  ev.target.addEventListener("pointermove", onDragMove);
  ev.target.addEventListener("pointerup", endDrag);
  ev.target.addEventListener("pointercancel", endDrag);
}

function onDragMove(ev) {
  if (!dragging) return;
  const g = dragging;
  const px = ev.clientX - g.startX;
  const py = ev.clientY - g.startY;
  if (Math.abs(px) > 2 || Math.abs(py) > 2) g.moved = true;
  if (!g.moved) return;

  if (g.mode === "rotate") {
    const r = boardEl.getBoundingClientRect();
    const cx = ev.clientX - r.left - g.centre.x;
    const cy = ev.clientY - r.top - g.centre.y;
    let deg = (Math.atan2(cy, cx) * 180) / Math.PI + 90;
    // Shift steps by fifteen, which is where a turn is usually wanted and
    // never quite where a hand stops.
    if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
    while (deg > 180) deg -= 360;
    while (deg < -180) deg += 360;
    web.editRotation(deg);
    afterDragEdit();
    return;
  }

  // Screen pixels into board units: one is the other divided by the zoom.
  let dx = px / g.sc;
  let dy = py / g.sc;
  // A TURNED LAYER IS RESIZED IN ITS OWN FRAME. The handle the hand is on
  // points along the layer's axes, not the page's, so the pointer's travel
  // is turned back by the layer's angle before it is read as a width.
  if (g.mode !== "move" && g.rot0) {
    const r = (-g.rot0 * Math.PI) / 180;
    const c = Math.cos(r), sn = Math.sin(r);
    const ux = dx * c - dy * sn;
    const uy = dx * sn + dy * c;
    dx = ux;
    dy = uy;
  }
  // …and its edges are then not the page's edges either, so there is nothing
  // for them to line up with. Snapping is for boxes that share a frame.
  const canSnap = !g.rot0;
  const tol = SNAP_PX / g.sc;
  const lines = [];

  if (g.mode === "move") {
    const ex = [g.pageFrom.x + dx, g.pageFrom.x + g.from.w / 2 + dx, g.pageFrom.x + g.from.w + dx];
    const ey = [g.pageFrom.y + dy, g.pageFrom.y + g.from.h / 2 + dy, g.pageFrom.y + g.from.h + dy];
    const sx = canSnap ? nearestSnap(ex, g.snap.xs, tol) : { by: 0, at: null };
    const sy = canSnap ? nearestSnap(ey, g.snap.ys, tol) : { by: 0, at: null };
    dx += sx.by;
    dy += sy.by;
    const v = viewNow();
    if (sx.at != null) lines.push({ axis: "x", at: sx.at * v.sc + v.x });
    if (sy.at != null) lines.push({ axis: "y", at: sy.at * v.sc + v.y });
    web.editRect(g.from.x + dx, g.from.y + dy, g.from.w, g.from.h);
  } else {
    // A handle moves the edges it is ON and no others — the right-hand one
    // cannot line the left edge up with anything, and offering to is how a
    // resize ends up dragging the far side of the box about.
    const k = g.mode;
    const west = k.includes("w");
    const east = k.includes("e");
    const north = k.startsWith("n");
    const south = k.startsWith("s");
    const v = viewNow();
    if (west || east) {
      const edge = west ? g.pageFrom.x + dx : g.pageFrom.x + g.from.w + dx;
      const s = canSnap ? nearestSnap([edge], g.snap.xs, tol) : { by: 0, at: null };
      dx += s.by;
      if (s.at != null) lines.push({ axis: "x", at: s.at * v.sc + v.x });
    }
    if (north || south) {
      const edge = north ? g.pageFrom.y + dy : g.pageFrom.y + g.from.h + dy;
      const s = canSnap ? nearestSnap([edge], g.snap.ys, tol) : { by: 0, at: null };
      dy += s.by;
      if (s.at != null) lines.push({ axis: "y", at: s.at * v.sc + v.y });
    }
    let { x, y, w, h } = g.from;
    if (west) { x += dx; w -= dx; }
    if (east) { w += dx; }
    if (north) { y += dy; h -= dy; }
    if (south) { h += dy; }
    // Shift keeps the shape: a corner takes the larger of the two changes
    // and applies it to both, which is what "do not distort this" means.
    if (ev.shiftKey && (west || east) && (north || south) && g.from.w > 0 && g.from.h > 0) {
      const k2 = Math.max(w / g.from.w, h / g.from.h);
      const nw2 = g.from.w * k2;
      const nh2 = g.from.h * k2;
      if (west) x = g.from.x + g.from.w - nw2;
      if (north) y = g.from.y + g.from.h - nh2;
      w = nw2;
      h = nh2;
    }
    // A box cannot be turned inside out by dragging past its far edge.
    if (w < 1) { w = 1; if (west) x = g.from.x + g.from.w - 1; }
    if (h < 1) { h = 1; if (north) y = g.from.y + g.from.h - 1; }
    web.editRect(x, y, w, h);
  }
  showGuides(lines);
  afterDragEdit();
}

/** A drag paints, and it does NOT rebuild the panel: the fields would be torn
 *  out from under the hand on every pointermove. The panel catches up when
 *  the drag ends. */
function afterDragEdit() {
  scheduleFrame();
  placeHandles();
  placeSizeBadge();
}

function endDrag(ev) {
  if (!dragging) return;
  const g = dragging;
  const t = ev.target;
  t.removeEventListener("pointermove", onDragMove);
  t.removeEventListener("pointerup", endDrag);
  t.removeEventListener("pointercancel", endDrag);
  try { t.releasePointerCapture(ev.pointerId); } catch { /* already gone */ }
  dragging = null;
  showGuides([]);
  // A PRESS THAT DID NOT TRAVEL IS A CLICK, and a click on the body should
  // pick what is under it rather than keep what happens to be selected —
  // otherwise a big section, once selected, swallows every click inside it.
  if (!g.moved && g.mode === "move") {
    selectAt(ev.clientX, ev.clientY);
    return;
  }
  if (g.moved) {
    inspectedId = null;       // the panel re-reads the numbers the drag wrote
    refreshInspector();
    const revert = inspEl.querySelector(".foot button + button");
    if (revert) revert.disabled = false;
    draw();
  }
}

/** Everything that follows the view rather than the document. Called on every
 *  paint and on every pan, which is why it touches no engine state. */
function refreshOverlays() {
  drawRulers();
  placeSizeBadge();
  placeHandles();
  const pct = Math.round(web.viewScale() * 100) + "%";
  if (zoomReadEl) zoomReadEl.textContent = pct;
}

// The hand tool. The board already pans on a drag; what this changes is the
// tap at the end of one — with the hand down, a click moves nothing and
// selects nothing, which is what makes it possible to drag FROM a layer.
let handTool = false;
function setTool(hand) {
  handTool = hand;
  if (toolMoveEl) toolMoveEl.setAttribute("aria-pressed", hand ? "false" : "true");
  if (toolHandEl) toolHandEl.setAttribute("aria-pressed", hand ? "true" : "false");
  boardEl.classList.toggle("hand", hand);
  placeHandles();
}
if (toolMoveEl) toolMoveEl.addEventListener("click", () => setTool(false));
if (toolHandEl) toolHandEl.addEventListener("click", () => setTool(true));
window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
  if (e.key === "v" || e.key === "V") setTool(false);
  if (e.key === "h" || e.key === "H") setTool(true);
});

// The debug toggle is a button in the toolbar now; the checkbox stays as the
// thing that holds the state, so nothing that reads it has to change.
if (debugBtnEl && debugEl) {
  debugBtnEl.addEventListener("click", () => {
    debugEl.checked = !debugEl.checked;
    debugBtnEl.setAttribute("aria-pressed", debugEl.checked ? "true" : "false");
    web.setDebug(debugEl.checked);
    refreshChrome();
    draw();
  });
}

function selectAt(clientX, clientY) {
  if (handTool) return;
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

window.addEventListener("resize", () => { draw(); refreshOverlays(); });

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
// The chrome, for a test that selects without clicking.
window.__refresh = refreshChrome;
// The view as the gestures move it, for a benchmark or a driver: it goes
// through the same coalescing an interactive pan does.
window.__setViewSoon = setViewSoon;
window.__frames = () => keeper.counts;
// One view change, start to finish, for a benchmark: the same path a pan
// takes, without the animation frame in front of it.
window.__moveView = (x, y, sc) => moveView({ x, y, sc });
window.__redraw = (x, y, sc) => { if (frame) frame.draw(null, { x, y, scale: sc }); };

const params = new URL(location.href).searchParams;
const intParam = (k) => (params.has(k) ? parseInt(params.get(k), 10) : NaN);
openUrl(params.get("file"), intParam("page"), intParam("frame")).catch((e) => {
  statusEl.textContent = String(e.message || e);
});
