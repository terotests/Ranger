/**
 * The same editor, with the host taken out.
 *
 *   INPUT   browser event → DataGridWeb → UIInput → GridApp        (in this tab)
 *   RENDER  GridApp.sceneJson() → EVGDisplayList → evg-webgl.js    (in this tab)
 *
 * The architecture is unchanged: the seam is still the display list, and the
 * WebGL renderer is the same file the Node-hosted page uses. What is gone is
 * the HTTP in the middle — the app was never remote, it just happened to be in
 * another process on the same machine.
 *
 * The only things fetched are the ones a browser cannot make for itself: the
 * font faces, and a workbook to open. Both are handed to the app as bytes.
 */
import { renderDisplayList, loadImages } from "./gl/evg-webgl.js";

// The page watches for this: if the imports above fail, nothing below runs
// and the only evidence anywhere is a 404 in the network panel.
window.__pageStarted = true;

const canvas = document.getElementById("screen");
const statusEl = document.getElementById("status");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const fpsEl = document.getElementById("fps");
const fileEl = document.getElementById("file");

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
  ["Open Sans", "OpenSans-Regular.ttf"],
  [null, "OpenSans-Bold.ttf"],
  [null, "OpenSans-Italic.ttf"],
  [null, "OpenSans-BoldItalic.ttf"],
];
const WORKBOOK = "./business-workbook.xlsx";

/** A Ranger `buffer` is an ArrayBuffer with a DataView hung off it — that is
 *  what the compiled runtime reads through, so bytes arriving from fetch() have
 *  to be dressed the same way before the app will take them. */
function asRangerBuffer(arrayBuffer) {
  const ab = arrayBuffer;
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
 * bare `DataGridWeb is not defined` with no hint that a build step was skipped.
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

const web = new (engineOrExplain("DataGridWeb", "datagrid_web.js", "datagrid:web"))();
web.start(canvas.width, canvas.height);

let pointerDown = false;
let redraws = 0;
let fpsT0 = performance.now();
let lastScene = "";
let sceneW = canvas.width;
let sceneH = canvas.height;
let lastCopySeq = 0;

// --- the picture -------------------------------------------------------------

const imageCache = new Map();
const blobUrls = new Map();

/** A sheet's pictures live on the model as bytes. With no host to serve them
 *  the page makes its own object URLs — one per package part, kept for as long
 *  as the workbook is open. */
function mediaUrl(part) {
  if (blobUrls.has(part)) return blobUrls.get(part);
  const book = web.app.book;
  for (let s = 0; s < book.sheetCount(); s += 1) {
    const sheet = book.sheetAt(s);
    for (let i = 0; i < sheet.imageCount(); i += 1) {
      const img = sheet.imageAt(i);
      if (img.src !== part || !img.bytes) continue;
      const view = img.bytes instanceof ArrayBuffer ? new Uint8Array(img.bytes) : img.bytes;
      const type = part.endsWith(".png") ? "image/png" : "image/jpeg";
      const url = URL.createObjectURL(new Blob([view], { type }));
      blobUrls.set(part, url);
      return url;
    }
  }
  blobUrls.set(part, "");
  return "";
}

async function imagesFor(doc) {
  const wanted = new Set(doc.list.cmds.filter((c) => c.k === 2 && c.src).map((c) => c.src));
  const missing = [...wanted].filter((src) => !imageCache.has(src));
  for (const src of missing) {
    const url = mediaUrl(src);
    if (!url) {
      imageCache.set(src, null);
      continue;
    }
    const fetched = await loadImages({ list: { cmds: [{ k: 2, src: url }] } }, { base: "" });
    imageCache.set(src, fetched.get(url) || null);
  }
  const out = new Map();
  for (const src of wanted) out.set(src, imageCache.get(src) || null);
  return out;
}

/** Build the scene and draw it — but only when it differs from the one already
 *  on the canvas. The app is right here, so "has anything changed" is a string
 *  comparison rather than a request. */
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
  gl.clearColor(0.96, 0.97, 0.98, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  const stats = renderDisplayList(gl, doc, { dpr, images: await imagesFor(doc) });
  cmdsEl.textContent = String(doc.list.cmds.length);
  window.__evgStats = stats;
  window.__gridDoc = doc;
  redraws += 1;
}

/** The app asks the HOST to open a picker — it does not know it is in a tab.
 *  In a window that is a system dialog; here it is the file input already on
 *  the page, and for "save as" the browser's own download. Same button, same
 *  command, whichever it is running in. */
function serveFileRequest() {
  const want = web.takeFileRequest();
  if (!want) return;
  if (want === "open") {
    fileEl?.click();
    return;
  }
  if (want === "saveAs") {
    // A page cannot choose where a file goes; it can only hand one over.
    statusEl.textContent = "use the browser's download for a copy";
  }
}

async function afterInput() {
  serveFileRequest();
  await draw();
  await maybeCopy();
}

// --- the clipboard -----------------------------------------------------------

function pngBlob(base64) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}

/** The app counts copies; when the count moves, something was copied — by a
 *  key or by a button — and the flavours it left behind go on the system
 *  clipboard. Same four as the hosted build. */
async function maybeCopy() {
  const seq = web.copySeq() | 0;
  if (seq === lastCopySeq) return;
  lastCopySeq = seq;
  const app = web.app;
  const text = app.clipboardTsv || "";
  const html = app.clipboardHtml || "";
  const png = app.clipboardPng || "";
  if ((html || png) && typeof ClipboardItem === "function" && navigator.clipboard?.write) {
    const flavours = { "text/plain": new Blob([text], { type: "text/plain" }) };
    if (html) flavours["text/html"] = new Blob([html], { type: "text/html" });
    if (png) flavours["image/png"] = pngBlob(png);
    try {
      await navigator.clipboard.write([new ClipboardItem(flavours)]);
      return;
    } catch (_) {
      /* fall through to plain text */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    /* a page without clipboard permission still edits fine */
  }
}

// --- input -------------------------------------------------------------------

function canvasCoords(ev) {
  const rect = canvas.getBoundingClientRect();
  const sx = sceneW / Math.max(1, rect.width);
  const sy = sceneH / Math.max(1, rect.height);
  return {
    x: Math.max(0, Math.min(sceneW - 1, Math.floor((ev.clientX - rect.left) * sx))),
    y: Math.max(0, Math.min(sceneH - 1, Math.floor((ev.clientY - rect.top) * sy))),
  };
}

const KEY_MAP = {
  Backspace: "backspace",
  Enter: "enter",
  Tab: "tab",
  Escape: "escape",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Delete: "delete",
  Home: "home",
  End: "end",
  PageUp: "pageUp",
  PageDown: "pageDown",
  F2: "f2",
};
// b / i / u joined the list when the formatting commands arrived.
const CTRL_CHORD = /^[abcefhiklmsuvxyzABCEFHIKLMSUVXYZ ]$/;

canvas.addEventListener("pointerdown", async (ev) => {
  canvas.setPointerCapture(ev.pointerId);
  canvas.focus();
  pointerDown = true;
  const { x, y } = canvasCoords(ev);
  web.pointer(x, y, true, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  await afterInput();
});

canvas.addEventListener("pointermove", async (ev) => {
  if (!pointerDown) return;
  const { x, y } = canvasCoords(ev);
  web.pointer(x, y, true, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  await afterInput();
});

async function release(ev) {
  if (!pointerDown) return;
  pointerDown = false;
  const { x, y } = canvasCoords(ev);
  web.pointer(x, y, false, ev.shiftKey, ev.ctrlKey || ev.metaKey);
  await afterInput();
}
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);

canvas.addEventListener("dblclick", async (ev) => {
  const { x, y } = canvasCoords(ev);
  web.autoFitAt(x, y);
  await afterInput();
});

canvas.addEventListener(
  "wheel",
  async (ev) => {
    ev.preventDefault();
    const { x, y } = canvasCoords(ev);
    const horizontal = ev.shiftKey || Math.abs(ev.deltaX) > Math.abs(ev.deltaY);
    const raw = horizontal ? (ev.deltaX || ev.deltaY) : ev.deltaY;
    if (horizontal) web.wheelX(x, y, raw < 0 ? 1 : -1);
    else web.wheel(x, y, raw < 0 ? 1 : -1);
    await afterInput();
  },
  { passive: false }
);

canvas.addEventListener("keydown", async (ev) => {
  const special = KEY_MAP[ev.key];
  if (special) {
    ev.preventDefault();
    web.key(special, ev.shiftKey, ev.ctrlKey || ev.metaKey);
    await afterInput();
    return;
  }
  if (ev.ctrlKey || ev.metaKey) {
    // Ctrl+V is served by the paste event below, which is the only way to read
    // the OS clipboard without asking for permission.
    if (ev.key === "v" || ev.key === "V") return;
    if (CTRL_CHORD.test(ev.key)) {
      ev.preventDefault();
      web.text(ev.key, ev.shiftKey, true);
      await afterInput();
    }
    return;
  }
  if (ev.key.length === 1) {
    ev.preventDefault();
    web.text(ev.key, ev.shiftKey, false);
    await afterInput();
  }
});

window.addEventListener("paste", async (ev) => {
  if (document.activeElement !== canvas) return;
  ev.preventDefault();
  const text = ev.clipboardData ? ev.clipboardData.getData("text/plain") : "";
  web.pasteText(text);
  await afterInput();
});

fileEl?.addEventListener("change", async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const raw = await file.arrayBuffer();
  let opened = false;
  try {
    const bytes = await maybeDecryptWorkbook(raw, "");
    opened = web.openWorkbook(asRangerBuffer(bytes), file.name);
    // Encrypted OLE packages need a password; ask once and retry.
    if (!opened && /password-protected/i.test(web.note || "")) {
      const password = window.prompt("This workbook is password-protected. Enter the password:", "");
      if (password != null && password.length > 0) {
        const unlocked = await maybeDecryptWorkbook(raw, password);
        opened = web.openWorkbookPassword
          ? web.openWorkbookPassword(asRangerBuffer(unlocked), file.name, password)
          : web.openWorkbook(asRangerBuffer(unlocked), file.name);
      }
    }
  } catch (e) {
    web.note = String(e && e.message ? e.message : e);
    opened = false;
  }
  statusEl.textContent = opened ? "opened " + file.name : "could not open: " + web.note;
  imageCache.clear();
  for (const url of blobUrls.values()) if (url) URL.revokeObjectURL(url);
  blobUrls.clear();
  lastScene = "";
  await draw();
});

/** OLE compound magic: password-protected OOXML before decryption. */
function isOleCompound(ab) {
  if (!ab || ab.byteLength < 8) return false;
  const u8 = new Uint8Array(ab);
  return u8[0] === 0xd0 && u8[1] === 0xcf && u8[2] === 0x11 && u8[3] === 0xe0;
}

/**
 * Browser hosts decrypt with Web Crypto (vendored ooxml-encryption) before the
 * Ranger ZIP loader runs. Node already decrypts inside GridApp; this path is
 * for the static page where `require('crypto')` is unavailable.
 */
async function maybeDecryptWorkbook(ab, password) {
  if (!isOleCompound(ab)) return ab;
  if (!password) {
    // Let Ranger report the clear "password required" error.
    return ab;
  }
  const { decryptWorkbook } = await import("./ooxml-encryption/dist/index.js");
  const plain = await decryptWorkbook(new Uint8Array(ab), password);
  return plain.buffer.slice(plain.byteOffset, plain.byteOffset + plain.byteLength);
}

// --- start -------------------------------------------------------------------

async function boot() {
  statusEl.textContent = "loading fonts";
  const faces = await Promise.all(FONTS.map(([, file]) => bytesOf("./fonts/" + file)));
  FONTS.forEach(([family], i) => {
    if (family) web.addFont(family, faces[i]);
    else web.addFace(faces[i]);
  });
  await document.fonts.ready;

  statusEl.textContent = "loading workbook";
  try {
    const wb = await bytesOf(WORKBOOK);
    if (web.openWorkbook(wb, "business-workbook.xlsx")) {
      web.showSheet("Summary");
      statusEl.textContent = "live";
    } else {
      web.useDemo();
      statusEl.textContent = "demo sheet (" + web.note + ")";
    }
  } catch (e) {
    // No workbook beside the page is not an error: the app has a demo sheet.
    web.useDemo();
    statusEl.textContent = "demo sheet";
  }
  await draw();
  window.__gridReady = true;

  // `?selftest=1` drives the app through a short script and reports what
  // happened in the page itself. Headless Chrome can dump a DOM but cannot
  // click, so this is how the build is checked end to end without a browser
  // driver: the page does the clicking.
  if (new URLSearchParams(location.search).has("selftest")) {
    await selftest();
  }

  // A once-a-second tick, only so the caret blinks and the fps figure means
  // something. Everything else redraws on the input that caused it.
  setInterval(async () => {
    await draw();
    fpsEl.textContent = String(redraws);
    redraws = 0;
  }, 1000);
}

async function selftest() {
  const checks = [];
  const ok = (name, cond) => checks.push({ name, ok: !!cond });

  // Is the picture actually going through the GPU pipeline, or is something
  // quietly falling back? "backend: webgl2" is a label the page writes about
  // itself; these are the facts under it.
  ok("the context is a WebGL 2 context", typeof WebGL2RenderingContext === "function" && gl instanceof WebGL2RenderingContext);
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  window.__glRenderer = String(renderer || "");
  ok("it has a stencil buffer (paths need one)", gl.getContextAttributes().stencil === true);
  const stats = window.__evgStats || {};
  ok("GL draw calls carried the scene", (stats.drawn | 0) > 20);
  ok("no fill was skipped for want of a stencil", (stats.skippedFills | 0) === 0);

  const before = web.scene();
  ok("a workbook is open", (web.app.book.sheetCount() | 0) > 1);
  ok("the scene has commands", JSON.parse(before).list.cmds.length > 40);

  // Typing into a cell, through the same input path a keystroke takes.
  web.run("nav.goto", "B7");
  web.text("4", false, false);
  web.text("2", false, false);
  web.key("enter", false, false);
  ok("what was typed is in the model", String(web.app.model.getCell(6, 1)) === "42");
  const after = web.scene();
  ok("and the picture changed", after !== before);

  // Copying: the flavours the page would put on the system clipboard.
  const seq0 = web.copySeq() | 0;
  web.run("nav.goto", "B3");
  web.run("edit.copy", "");
  ok("copying bumped the counter", (web.copySeq() | 0) > seq0);
  ok("with text to paste", (web.app.clipboardTsv || "").length > 0);

  // A chart, which is the deepest path in the app: selection → Vela → EVG.
  web.run("nav.goto", "B3");
  web.run("insert.chart", "");
  const withPicker = JSON.parse(web.scene()).list.cmds.length;
  ok("the chart picker opened", withPicker > JSON.parse(after).list.cmds.length);
  web.app.applyChartDialog();
  await draw();
  const charted = JSON.parse(web.scene());
  const geometry = charted.list.cmds.filter((c) => c.k === 6 || c.k === 7).length;
  ok("a chart was drawn from the numbers", geometry > 4);

  const passed = checks.filter((c) => c.ok).length;
  const line = checks.map((c) => (c.ok ? "PASS " : "FAIL ") + c.name).join(" | ");
  const el = document.createElement("pre");
  el.id = "selftest";
  el.textContent = `selftest ${passed}/${checks.length} :: ${line}`;
  const gpu = document.createElement("pre");
  gpu.id = "glinfo";
  const st = window.__evgStats || {};
  gpu.textContent = `gl ${window.__glRenderer} :: draws ${st.drawn | 0} textRuns ${st.textRuns | 0} paths ${st.paths | 0} images ${st.images | 0}`;
  document.body.appendChild(gpu);
  document.body.appendChild(el);
  window.__selftest = { passed, total: checks.length, checks };
}

boot().catch((e) => {
  statusEl.textContent = "error: " + (e && e.message ? e.message : e);
});
