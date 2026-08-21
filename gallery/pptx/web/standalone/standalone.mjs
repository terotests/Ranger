/**
 * The slide viewer with the host taken out.
 *
 *   INPUT   key / click → PptxWeb → UIInput → PptxApp      (in this tab)
 *   RENDER  PptxApp.sceneJson() → EVGDisplayList → WebGL    (in this tab)
 *
 * The viewer always produced a display list and the host always drew it with
 * this same evg-webgl.js; HTTP was the only thing in between. The deck's
 * pictures come out of the package with the deck, so they become textures
 * here rather than being fetched from a server — which is also why pictures
 * appear in the GL path at all now.
 */
import { renderDisplayList, loadImages } from "./gl/evg-webgl.js";

// The page watches for this: if the imports above fail, nothing below runs
// and the only evidence anywhere is a 404 in the network panel.
window.__pageStarted = true;

const canvas = document.getElementById("screen");
const statusEl = document.getElementById("status");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const slideEl = document.getElementById("slide");
const fileEl = document.getElementById("file");

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
const DECK = "./deck.pptx";

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
 * bare `PptxWeb is not defined` with no hint that a build step was skipped.
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

const web = new (engineOrExplain("PptxWeb", "pptx_web.js", "pptx:web"))();
web.start(canvas.width, canvas.height);

let lastScene = "";
let sceneW = canvas.width;
let sceneH = canvas.height;
const imageCache = new Map();
const blobUrls = new Map();

/** The deck's own image parts, as object URLs. The bytes are already on the
 *  model; nothing is fetched. */
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

async function draw() {
  const text = web.scene();
  if (text === lastScene) return;
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
  cmdsEl.textContent = String(doc.list.cmds.length);
  slideEl.textContent = `${(web.slideIndex() | 0) + 1} / ${web.slideCount() | 0}`;
  window.__evgStats = stats;
  window.__pptxDoc = doc;
}

function coords(ev) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(sceneW - 1, Math.floor((ev.clientX - rect.left) * (sceneW / Math.max(1, rect.width))))),
    y: Math.max(0, Math.min(sceneH - 1, Math.floor((ev.clientY - rect.top) * (sceneH / Math.max(1, rect.height))))),
  };
}

canvas.addEventListener("pointerdown", async (ev) => {
  canvas.focus();
  const { x, y } = coords(ev);
  // Through the frame: a press lands on a window, then the toolbar, then the
  // slide — in that order, decided by the app rather than by this file.
  web.pointerAt(x, y, true, true, false);
  await draw();
});

canvas.addEventListener("pointermove", async (ev) => {
  const { x, y } = coords(ev);
  if (web.pointerAt(x, y, false, false, false)) await draw();
});

canvas.addEventListener("pointerup", async (ev) => {
  const { x, y } = coords(ev);
  web.pointerAt(x, y, false, false, true);
  await draw();
});

const KEYS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  Home: "home",
  End: "end",
  PageUp: "pageUp",
  PageDown: "pageDown",
};

window.addEventListener("keydown", async (ev) => {
  const name = KEYS[ev.key];
  if (!name) return;
  ev.preventDefault();
  web.key(name);
  await draw();
});

document.getElementById("next")?.addEventListener("click", async () => {
  web.next();
  await draw();
});
document.getElementById("prev")?.addEventListener("click", async () => {
  web.prev();
  await draw();
});

fileEl?.addEventListener("change", async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const ok = web.openDeck(asRangerBuffer(await file.arrayBuffer()), file.name);
  statusEl.textContent = ok ? "opened " + file.name : "could not open: " + web.note;
  refreshMedia();
  lastScene = "";
  await draw();
});

async function selftest() {
  const checks = [];
  const ok = (name, cond) => checks.push({ name, ok: !!cond });

  ok("the context is a WebGL 2 context", typeof WebGL2RenderingContext === "function" && gl instanceof WebGL2RenderingContext);
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  window.__glRenderer = String((info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) || "");
  const stats = window.__evgStats || {};
  ok("GL draw calls carried the slide", (stats.drawn | 0) > 2);
  ok("a deck is open", (web.slideCount() | 0) > 1);

  const first = web.scene();
  web.next();
  await draw();
  ok("the next slide is a different picture", web.scene() !== first);
  ok("and the index moved", (web.slideIndex() | 0) === 1);
  web.key("end");
  await draw();
  ok("End reaches the last slide", (web.slideIndex() | 0) === (web.slideCount() | 0) - 1);
  web.key("home");
  await draw();
  ok("Home comes back", (web.slideIndex() | 0) === 0);

  // The frame: the deck has the shared toolbar now, and its buttons run
  // commands. It used to draw its own dark band with a string in it.
  {
    const cmds = JSON.parse(web.commands() || "[]");
    ok("the app has a command surface", cmds.length > 4);
    ok("a toolbar command runs", web.run("slide.next", ""));
    ok("and it turned the slide", (web.slideIndex() | 0) === 1);
    ok("the slide picker opens as a window", web.run("slide.pick", ""));
    ok("and it is up", JSON.parse(web.scene()).list.cmds.length > 0);
    web.run("slide.first", "");
    ok("first comes back", (web.slideIndex() | 0) === 0);
  }

  // Pictures: the deck carries them, so they should be textures by now.
  const parts = JSON.parse(web.imageParts() || "[]");
  ok("the deck's pictures came with it", parts.length > 0);
  let painted = 0;
  for (let i = 0; i < (web.slideCount() | 0); i += 1) {
    web.gotoSlide(i);
    await draw();
    painted += (window.__evgStats.images | 0);
  }
  ok("and at least one was drawn", painted > 0);
  web.gotoSlide(0);
  await draw();

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

  statusEl.textContent = "loading deck";
  const deck = await bytesOf(DECK);
  if (web.openDeck(deck, "deck.pptx")) {
    statusEl.textContent = web.deckName() + " · " + web.status();
  } else {
    statusEl.textContent = "could not open the deck: " + web.note;
  }
  refreshMedia();
  await draw();
  window.__pptxReady = true;
  if (new URLSearchParams(location.search).has("selftest")) await selftest();
}

boot().catch((e) => {
  statusEl.textContent = "error: " + (e && e.message ? e.message : e);
});
