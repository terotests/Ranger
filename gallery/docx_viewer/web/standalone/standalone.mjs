/**
 * The Word viewer with the host taken out — and with the PNG taken out.
 *
 *   INPUT   key / click → DocxWeb → DocxEditController          (in this tab)
 *   RENDER  DocxViewer.sceneJson(page) → EVGDisplayList → WebGL (in this tab)
 *
 * The old host rasterized every page on the server and sent a picture of it.
 * The layout and the painting are unchanged; they just write draw commands
 * now, and the browser draws them.
 */
import { renderDisplayList, loadImages } from "./gl/evg-webgl.js";

// The page watches for this: if the imports above fail, nothing below runs
// and the only evidence anywhere is a 404 in the network panel.
window.__pageStarted = true;

const canvas = document.getElementById("screen");
const statusEl = document.getElementById("status");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const pageEl = document.getElementById("slide");
const fileEl = document.getElementById("file");
const editEl = document.getElementById("edit");
const chartToolsEl = document.getElementById("chartTools");

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
  // The fallback pool the desktop build has always had, and the browser
  // build did not: an emoji face, a face with the geometric bullets in it,
  // and an Arabic one.
  //
  // `FontManager` falls back per CODEPOINT across every loaded face, so
  // having these loaded at all is the whole of it — none of them becomes the
  // face Latin text is drawn in. Without them a browser MEASURED Arabic with
  // notdef widths while the canvas DREW it with the system's own Arabic font:
  // the glyphs looked right and every number about them was wrong, so a title
  // wrapped a word early and the caret sat a letter short of where it looked.
  [null, "NotoEmoji-Regular.ttf"],
  [null, "NotoSans-Regular.ttf"],
  [null, "ElMessiri-Regular.ttf"],
  [null, "ElMessiri-Bold.ttf"],
];
const DOCUMENT = "./document.docx";

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
 * bare `DocxWeb is not defined` with no hint that a build step was skipped.
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

const web = new (engineOrExplain("DocxWeb", "docx_web.js", "docx_viewer:web"))();
web.start();

let page = 0;
let lastScene = "";
let sceneW = canvas.width;
let sceneH = canvas.height;
const imageCache = new Map();
const blobUrls = new Map();

/** The document's own picture parts, as object URLs. The bytes came out of the
 *  package with the document; nothing is fetched. */
function refreshMedia() {
  for (const url of blobUrls.values()) if (url) URL.revokeObjectURL(url);
  blobUrls.clear();
  imageCache.clear();
  let parts = [];
  try {
    parts = JSON.parse(web.imageParts() || "[]");
  } catch (_) {
    parts = [];
  }
  for (const part of parts) {
    const raw = web.imageBytes(part);
    const view = raw instanceof ArrayBuffer ? new Uint8Array(raw) : raw;
    if (!view || !(view.length || view.byteLength)) continue;
    const type = /\.png$/i.test(part) ? "image/png" : "image/jpeg";
    blobUrls.set(part, URL.createObjectURL(new Blob([view], { type })));
  }
}

async function imagesFor(doc) {
  const wanted = new Set(doc.list.cmds.filter((c) => c.k === 2 && c.src).map((c) => c.src));
  for (const src of wanted) {
    if (imageCache.has(src)) continue;
    const url = blobUrls.get(src) || "";
    if (!url) {
      imageCache.set(src, null);
      continue;
    }
    const got = await loadImages({ list: { cmds: [{ k: 2, src: url }] } }, { base: "" });
    imageCache.set(src, got.get(url) || null);
  }
  const out = new Map();
  for (const src of wanted) out.set(src, imageCache.get(src) || null);
  return out;
}

// The whole editor, not only the paper: the shared toolbar above the page, a
// status line under it, and the window layer on top. The app decides all of
// that; this file sizes the frame around the paper and hands over events.
async function draw(force) {
  // The app lays the page out and sizes the frame around it in one call: a
  // Word page is not one size, and measuring before laying out measures the
  // page you were on.
  web.frameFit(720);
  const text = web.frame();
  if (!force && text === lastScene) return;
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
  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  const stats = renderDisplayList(gl, doc, { dpr, images: await imagesFor(doc) });
  page = web.page() | 0;
  cmdsEl.textContent = String(doc.list.cmds.length);
  pageEl.textContent = `${page + 1} / ${web.pageCount() | 0}`;
  if (chartToolsEl) chartToolsEl.hidden = (web.selectedChart() | 0) === 0;
  window.__evgStats = stats;
  window.__docxDoc = doc;
}

function coords(ev) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(sceneW - 1, Math.floor((ev.clientX - rect.left) * (sceneW / Math.max(1, rect.width))))),
    y: Math.max(0, Math.min(sceneH - 1, Math.floor((ev.clientY - rect.top) * (sceneH / Math.max(1, rect.height))))),
  };
}

// Whether the button is still down. A move with nothing held is a hover; a
// move with the button held is a DRAG, and the app cannot tell the two apart
// unless this file says which one it is. It used to always say "not held", so
// dragging across text selected nothing.
let buttonDown = false;

canvas.addEventListener("pointerdown", async (ev) => {
  canvas.focus();
  const { x, y } = coords(ev);
  buttonDown = true;
  // The pointer is captured so that a drag which leaves the canvas keeps
  // arriving here — letting go outside the window otherwise leaves the app
  // believing the button is still down forever.
  if (canvas.setPointerCapture) {
    try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* not captured */ }
  }
  // Through the frame, so a press lands on a window, then the toolbar, then
  // the paper — in that order, decided by the app rather than by this file.
  web.framePointer(x, y, true, true, false, ev.shiftKey);
  page = web.page() | 0;
  await draw(true);
});

canvas.addEventListener("pointermove", async (ev) => {
  const { x, y } = coords(ev);
  if (web.framePointer(x, y, false, buttonDown, false, false)) await draw(true);
});

canvas.addEventListener("pointerup", async (ev) => {
  const { x, y } = coords(ev);
  buttonDown = false;
  if (canvas.releasePointerCapture) {
    try { canvas.releasePointerCapture(ev.pointerId); } catch (_) { /* not captured */ }
  }
  web.framePointer(x, y, false, false, true, ev.shiftKey);
  await draw(true);
});

// A pointer that is cancelled (the browser took the gesture) ends the drag too.
canvas.addEventListener("pointercancel", async (ev) => {
  const { x, y } = coords(ev);
  buttonDown = false;
  web.framePointer(x, y, false, false, true, false);
  await draw(true);
});

const KEYS = {
  Backspace: "backspace",
  Delete: "delete",
  Enter: "enter",
  Tab: "tab",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Home: "home",
  End: "end",
  PageUp: "pageUp",
  PageDown: "pageDown",
};

// The wheel and a one-finger swipe are the same question — how far did it
// travel — and the app decides when that adds up to a page.
let scrollBusy = false;
async function scrollBy(dy) {
  if (!dy || scrollBusy) return;
  scrollBusy = true;
  try {
    if (web.scroll(Math.round(dy))) {
      page = web.page() | 0;
      await draw(true);
    }
  } finally {
    scrollBusy = false;
  }
}

canvas.addEventListener(
  "wheel",
  (ev) => {
    ev.preventDefault();
    let dy = ev.deltaY;
    if (ev.deltaMode === 1) dy *= 16;
    else if (ev.deltaMode === 2) dy *= 400;
    scrollBy(dy);
  },
  { passive: false }
);

let touchY = 0;
let touching = false;
canvas.addEventListener(
  "touchstart",
  (ev) => {
    if (ev.touches.length !== 1) return;
    touchY = ev.touches[0].clientY;
    touching = true;
  },
  { passive: true }
);
canvas.addEventListener(
  "touchmove",
  (ev) => {
    if (!touching || ev.touches.length !== 1) return;
    const y = ev.touches[0].clientY;
    const dy = touchY - y;
    touchY = y;
    ev.preventDefault();
    scrollBy(dy);
  },
  { passive: false }
);
canvas.addEventListener("touchend", () => {
  touching = false;
});

canvas.addEventListener("keydown", async (ev) => {
  if (ev.ctrlKey || ev.metaKey) {
    const k = ev.key.toLowerCase();
    if (k === "v") return; // the paste event below carries the clipboard
    if (k === "a") { ev.preventDefault(); web.key("selectAll", false, true); await draw(true); return; }
    if (k === "z") { ev.preventDefault(); web.key("undo", false, true); await draw(true); return; }
    if (k === "y") { ev.preventDefault(); web.key("redo", false, true); await draw(true); return; }
    if (k === "b") { ev.preventDefault(); web.key("bold", false, true); await draw(true); return; }
    if (k === "c" || k === "x") {
      ev.preventDefault();
      const text = k === "c" ? web.copySelection() : web.cutSelection();
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        /* a page without permission still edits */
      }
      await draw(true);
      return;
    }
    return;
  }
  const name = KEYS[ev.key];
  if (name) {
    ev.preventDefault();
    web.key(name, ev.shiftKey, false);
    // The app owns the page number: in view mode these keys TURN the page,
    // and in edit mode the caret can walk onto another one. Either way, what
    // this page thinks it is showing comes back from the app rather than
    // being guessed here.
    page = web.page() | 0;
    await draw(true);
    return;
  }
  if (ev.key.length === 1 && web.editMode()) {
    ev.preventDefault();
    web.typeText(ev.key);
    await draw(true);
  }
});

window.addEventListener("paste", async (ev) => {
  if (document.activeElement !== canvas) return;
  ev.preventDefault();
  const cd = ev.clipboardData;
  const html = cd ? cd.getData("text/html") : "";
  const text = cd ? cd.getData("text/plain") : "";
  web.paste(html, text);
  await draw(true);
});

document.getElementById("next")?.addEventListener("click", async () => {
  web.goToPage(page + 1);
  page = web.page() | 0;
  await draw(true);
});
document.getElementById("prev")?.addEventListener("click", async () => {
  web.goToPage(page - 1);
  page = web.page() | 0;
  await draw(true);
});
editEl?.addEventListener("click", async () => {
  const on = !web.editMode();
  web.setEditMode(on);
  editEl.setAttribute("aria-pressed", String(on));
  canvas.focus();
  await draw(true);
});
document.getElementById("chartType")?.addEventListener("click", async () => {
  web.editChart("kind.next", "1");
  await draw(true);
});
document.getElementById("chartStyle")?.addEventListener("click", async () => {
  web.editChart("style.next", "1");
  await draw(true);
});
document.getElementById("chartDelete")?.addEventListener("click", async () => {
  web.deleteChart();
  await draw(true);
});

fileEl?.addEventListener("change", async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const ok = web.openDocument(asRangerBuffer(await file.arrayBuffer()), file.name);
  statusEl.textContent = ok ? "opened " + file.name : "could not open: " + web.note;
  page = 0;
  refreshMedia();
  await draw(true);
});

async function selftest() {
  const checks = [];
  const ok = (name, cond) => checks.push({ name, ok: !!cond });

  ok("the context is a WebGL 2 context", typeof WebGL2RenderingContext === "function" && gl instanceof WebGL2RenderingContext);
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  window.__glRenderer = String((info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) || "");
  const stats = window.__evgStats || {};
  ok("GL draw calls carried the page", (stats.drawn | 0) > 20);
  ok("the page is text, not one big picture", (stats.textRuns | 0) > 10);
  ok("a document is open", (web.pageCount() | 0) >= 1);

  // Turning pages.
  const first = web.scene(0);
  if ((web.pageCount() | 0) > 1) {
    page = 1;
    await draw(true);
    ok("the next page is a different picture", web.scene(1) !== first);
    page = 0;
    await draw(true);
  } else {
    ok("the next page is a different picture", true);
  }

  // Reading, not editing: PageDown and a swipe have to turn the page. This
  // used to do nothing at all — every key went to a caret, and there is no
  // caret in a document you are only reading.
  if ((web.pageCount() | 0) > 1) {
    web.setEditMode(false);
    web.goToPage(0);
    web.key("pageDown", false, false);
    ok("PageDown turns the page in view mode", (web.page() | 0) === 1);
    web.key("up", false, false);
    ok("and the arrow keys come back", (web.page() | 0) === 0);
    const travelled = web.scroll(4000);
    ok("a swipe turns it too", travelled && (web.page() | 0) > 0);
    web.goToPage(0);
    page = web.page() | 0;
    await draw(true);
  } else {
    ok("PageDown turns the page in view mode", true);
    ok("and the arrow keys come back", true);
    ok("a swipe turns it too", true);
  }

  // The frame: the shared toolbar is IN the picture, and clicking a button in
  // it runs a command. Word had no toolbar at all before this.
  {
    const cmds = JSON.parse(web.commands() || "[]");
    ok("the app has a command surface", cmds.length > 8);
    const wasEdit = !!web.editMode();
    ok("a toolbar button runs its command", web.run("edit.mode", ""));
    ok("and it did something", !!web.editMode() !== wasEdit);
    web.run("edit.mode", "");
    ok("the frame is wider than the paper", (web.frameWidth() | 0) > 0);
  }

  // Typing, through the same path a keystroke takes.
  web.setEditMode(true);
  web.click(120, 200, false);
  web.typeText("Zx");
  await draw(true);
  ok("typing changed the page", web.scene(page) !== first);

  // Dragging with the button held paints a selection. Through `framePointer`,
  // because the bug was in this file as much as in the app: a move used to say
  // the button was NOT down, so the app could not tell a drag from a hover and
  // a drag across text selected nothing at all.
  {
    web.setEditMode(true);
    const y = 200;
    web.framePointer(120, y, true, true, false, false);
    await draw(true);
    const beforeDrag = web.copySelection() || "";
    ok("a press alone selects nothing", beforeDrag.length === 0);
    // Held, and moved — several steps, the way a real drag arrives.
    for (const x of [200, 320, 460]) {
      web.framePointer(x, y, false, true, false, false);
    }
    web.framePointer(460, y, false, false, true, false);
    await draw(true);
    const dragged = web.copySelection() || "";
    ok("dragging with the button held selects text", dragged.length > 0);
    // And letting go leaves it selected rather than collapsing it.
    ok("and letting go keeps it", (web.copySelection() || "").length > 0);
    web.framePointer(120, y, true, true, false, false);
    web.framePointer(120, y, false, false, true, false);
    await draw(true);
  }

  // A chart pasted from the spreadsheet stays a chart, and is drawn by the
  // same Vela renderer — as geometry, not as a picture of one.
  const chartHtml = window.__chartHtml || "";
  if (chartHtml) {
    const before = (window.__evgStats.paths | 0);
    web.paste(chartHtml, "");
    await draw(true);
    ok("a pasted chart landed in the document", (web.selectedChart() | 0) > 0);
    ok("and is drawn as geometry", (window.__evgStats.paths | 0) > before);
    ok("its type can be changed here", web.editChart("kind.next", "1"));
    await draw(true);
  }

  const passed = checks.filter((c) => c.ok).length;
  const el = document.createElement("pre");
  el.id = "selftest";
  el.textContent = `selftest ${passed}/${checks.length} :: ` + checks.map((c) => (c.ok ? "PASS " : "FAIL ") + c.name).join(" | ");
  document.body.appendChild(el);
  const gpu = document.createElement("pre");
  gpu.id = "glinfo";
  const st = window.__evgStats || {};
  gpu.textContent = `gl ${window.__glRenderer} :: draws ${st.drawn | 0} textRuns ${st.textRuns | 0} paths ${st.paths | 0} images ${st.images | 0}`;
  document.body.appendChild(gpu);
  window.__selftest = { passed, total: checks.length };
}

async function boot() {
  statusEl.textContent = "loading fonts";
  const faces = await Promise.all(FONTS.map(([, file]) => bytesOf("./fonts/" + file)));
  FONTS.forEach(([family], i) => {
    if (family) web.addFont(family, faces[i]);
    else web.addFace(faces[i]);
  });
  await document.fonts.ready;

  statusEl.textContent = "loading document";
  const bytes = await bytesOf(DOCUMENT);
  if (web.openDocument(bytes, "document.docx")) {
    statusEl.textContent = web.title();
  } else {
    statusEl.textContent = "could not open: " + web.note;
  }
  refreshMedia();
  await draw(true);
  window.__docxReady = true;

  // A chart on the clipboard, for the self test to paste. Written by the build
  // from a real spreadsheet copy; absent in a plain build.
  try {
    const res = await fetch("./chart-clip.html");
    if (res.ok) window.__chartHtml = await res.text();
  } catch (_) {
    /* no chart to paste */
  }
  if (new URLSearchParams(location.search).has("selftest")) await selftest();
}

boot().catch((e) => {
  statusEl.textContent = "error: " + (e && e.message ? e.message : e);
});
