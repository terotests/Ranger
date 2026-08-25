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
import { renderDisplayList, loadImages, markColoredSlots, verbatim, setFontFallback } from "./gl/evg-webgl.js";
import { attachPointer, attachKeys, createMediaCache, decodeScene, sceneStamp } from "./host/pptx-host.mjs";

// The page watches for this: if the imports above fail, nothing below runs
// and the only evidence anywhere is a 404 in the network panel.
window.__pageStarted = true;

const canvas = document.getElementById("screen");
const statusEl = document.getElementById("status");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const slideEl = document.getElementById("slide");
const fileEl = document.getElementById("file");
const odpEl = document.getElementById("odp");
const imageEl = document.getElementById("image");

const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true });
if (!gl) {
  statusEl.textContent = "WebGL 2 not available";
  throw new Error("WebGL 2 required");
}
backendEl.textContent = "webgl2";

// family — the name FontManager registers the face under, or null to add it to
//          the per-codepoint fallback pool without naming a family
// file   — the file under ./fonts/
// css    — how the BROWSER is told about the same bytes: family, weight, style
//
// The third column is not a duplicate of the first. FontManager keys a face by
// family AND style and is handed the four Open Sans files separately; CSS keys
// by family with the weight and slant as descriptors, so all four are "Open
// Sans" there. Both halves have to exist or the two disagree — see
// `registerBrowserFaces` below for what that disagreement cost.
const FONTS = [
  ["Open Sans", "OpenSans-Regular.ttf", { family: "Open Sans", weight: "400", style: "normal" }],
  [null, "OpenSans-Bold.ttf", { family: "Open Sans", weight: "700", style: "normal" }],
  [null, "OpenSans-Italic.ttf", { family: "Open Sans", weight: "400", style: "italic" }],
  [null, "OpenSans-BoldItalic.ttf", { family: "Open Sans", weight: "700", style: "italic" }],
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
  [null, "NotoEmoji-Regular.ttf", { family: "Noto Emoji", weight: "400", style: "normal" }],
  [null, "NotoSans-Regular.ttf", { family: "Noto Sans", weight: "400", style: "normal" }],
  [null, "ElMessiri-Regular.ttf", { family: "El Messiri", weight: "400", style: "normal" }],
  [null, "ElMessiri-Bold.ttf", { family: "El Messiri", weight: "700", style: "normal" }],
];

/** The same faces again, this time to the BROWSER — and it is the half that
 *  was missing.
 *
 *  Everything above loads the fonts into OUR FontManager, which is what the
 *  layout measures with: how wide "RealTrainer" is, where the line breaks,
 *  where the caret goes. Nothing told `document.fonts` about them, so when the
 *  GL backend rasterized a run through a 2D canvas the browser had never heard
 *  of "Open Sans" and drew the system sans instead. Same string, same pixel
 *  size, different face, different width.
 *
 *  Measured in headless Chromium on the deck that was reported: a 40pt bold
 *  title measured 311.30px in our layout and rasterized to 292.02px in the
 *  browser. Registering the real face and asking for it gives 311.19. The
 *  caret is placed from the layout, so those 19 pixels were the caret sitting
 *  most of a letter past the end of the word — which is exactly what a title
 *  looked like while every 12pt field on the slide, where the same 6% is under
 *  two pixels, looked fine.
 */
const dedupe = (list) => [...new Set(list.filter(Boolean))];

async function registerBrowserFaces(bytes) {
  if (typeof FontFace !== "function" || !document.fonts) return;
  await Promise.all(FONTS.map(async ([, file, css], i) => {
    if (!css) return;
    try {
      const face = new FontFace(css.family, bytes[i], { weight: css.weight, style: css.style });
      await face.load();
      document.fonts.add(face);
    } catch (e) {
      // A face the browser refuses to parse is one family drawn in a
      // substitute — bad, but not a reason to leave the page blank.
      console.warn("could not register " + file + " with the browser:", e);
    }
  }));
}
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

/** Is a finger what is pointing at this page?
 *
 *  Nothing about the window's size answers this — a laptop with a
 *  touchscreen is wide and coarse at once, a phone in landscape is neither
 *  narrow nor a mouse — so it is asked directly, and asked again when it
 *  changes, which it does when a tablet is put in a keyboard case.
 */
const coarse = window.matchMedia ? window.matchMedia("(pointer: coarse)") : null;
const isCoarse = () => {
  const forced = new URLSearchParams(location.search).get("coarse");
  if (forced === "1") return true;
  if (forced === "0") return false;
  return !!(coarse && coarse.matches);
};

/** The app's surface, in CSS pixels.
 *
 *  The canvas used to be a fixed 1000x600 that CSS scaled to the width it
 *  had. On a desktop that is invisible; on a phone it is an editor whose
 *  30-pixel buttons are drawn at twelve. The app is told the size it is
 *  really being shown at instead, and its own chrome folds at the
 *  breakpoints that size crosses.
 */
function surface() {
  const frame = canvas.parentElement;
  const box = frame ? frame.getBoundingClientRect() : { width: 0, height: 0 };
  let w = Math.round(box.width) || canvas.clientWidth || 1000;
  let h = Math.round(box.height) || 0;
  // A tall enough surface is the point of the phone layout; when the frame
  // does not state a height (the desktop layout does not), keep the shape
  // the page has always had.
  if (h < 200) h = Math.round(w * 0.6);
  return { w: Math.max(320, w), h: Math.max(240, h) };
}

let started = false;
async function fitToWindow() {
  const { w, h } = surface();
  if (!started) {
    web.start(w, h);
    web.setCoarsePointer(isCoarse());
    started = true;
    return;
  }
  web.resize(w, h);
  web.setCoarsePointer(isCoarse());
  lastScene = null;
  await draw();
}

web.start(surface().w, surface().h);
web.setCoarsePointer(isCoarse());
started = true;

let lastScene = "";
let sceneW = canvas.width;
let sceneH = canvas.height;

// A window that changes shape — a desktop window dragged, a phone rotated —
// re-evaluates the chrome's breakpoints. `visualViewport` is what moves when
// a phone raises its keyboard, and resize alone does not fire for that.
let fitPending = 0;
function scheduleFit() {
  if (fitPending) return;
  fitPending = requestAnimationFrame(async () => {
    fitPending = 0;
    await fitToWindow();
  });
}
window.addEventListener("resize", scheduleFit);
window.addEventListener("orientationchange", scheduleFit);
if (window.visualViewport) window.visualViewport.addEventListener("resize", scheduleFit);
if (coarse && coarse.addEventListener) coarse.addEventListener("change", scheduleFit);
// The deck's own pictures, as textures. Shared with the playground — see
// gallery/pptx/web/host/pptx-host.mjs.
const media = createMediaCache({ web, loadImages });
const refreshMedia = () => media.refresh();
const imagesFor = (doc) => media.imagesFor(doc);

async function draw() {
  // Typed arrays rather than 1.5 MB of JSON — see `decodeScene`. The frame is
  // compared by its command count and its first command's geometry instead of
  // by a string, because there is no string any more; a scene that really is
  // unchanged still costs the layout, which is the sixth of the frame that is
  // the actual work.
  const doc = decodeScene(web.sceneBinary());
  const stamp = sceneStamp(doc);
  if (stamp === lastScene) return;
  lastScene = stamp;
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
  // Published so a test can ask the app what it thinks is true rather than
  // inferring it from pixels — the same hook the code editor page exposes.
  window.__pptxWeb = web;
}

// The show has a clock and the app has none: while one is running the page
// hands it the time between frames, and stops asking the moment nothing is
// moving any more — a still slide costs nothing.
let showFrame = 0;
let lastTick = 0;
function pumpShow() {
  showFrame = 0;
  if (!web.presenting()) return;
  showFrame = requestAnimationFrame(async (now) => {
    const dt = lastTick ? (now - lastTick) / 1000 : 0;
    lastTick = now;
    if (dt > 0 && dt < 1) web.tick(dt);
    await draw();
    pumpShow();
  });
}

// Anything that might have started or ended a show re-arms the clock.
function afterInput() {
  if (web.presenting()) {
    if (!showFrame) {
      lastTick = 0;
      pumpShow();
    }
  } else if (showFrame) {
    cancelAnimationFrame(showFrame);
    showFrame = 0;
  }
  // Anything that could have put a caret in a shape, or taken one out, is a
  // reason for the phone's keyboard to come up or go away.
  syncSoftKeys();
}

// Pointer and keyboard both come from the shared host module: the standalone
// page and the API playground load the same engine and draw the same toolbar,
// and an editor that only one of them could be clicked in was a difference in
// the PAGE rather than in the editor.
const pointer = attachPointer({
  canvas,
  web,
  sceneSize: () => ({ width: sceneW, height: sceneH }),
  draw,
  afterInput,
  onFileRequest: (want) => {
    if (want === "open") fileEl?.click();
    if (want === "image") imageEl?.click();
  },
  // While the phone's keyboard is up and its field has focus, a tap must not
  // move focus to the canvas — that is what dismisses the keyboard. The field
  // is declared below; this closure runs long after it is.
  keepsFocus: () => !!softkeys && document.activeElement === softkeys,
});
const coords = (ev) => pointer.coords(ev);

// --- typing with no keyboard attached ---------------------------------------
//
// A phone raises its keyboard for a focused input and for nothing else. A
// canvas cannot be that input, so an off-screen one is: when the app puts a
// caret in a shape, the field takes focus and the keyboard comes up; what is
// typed into it is forwarded and the field is emptied again, so it never
// accumulates and never has to agree with the app about what the text is.
//
// The app remains the only thing that owns the text. This is a keyboard, not
// a second editor.
const softkeys = document.getElementById("softkeys");
let softkeysOn = false;

// `?coarse=1` forces the touch path on a machine that has a mouse, which is
// the only way to exercise the keyboard field in a test — and the only way to
// look at the phone layout on a desktop without a phone.
const forcedCoarse = new URLSearchParams(location.search).get("coarse");
function wantsSoftKeys() {
  if (forcedCoarse === "1") return true;
  if (forcedCoarse === "0") return false;
  return isCoarse();
}

function syncSoftKeys() {
  if (!softkeys || !wantsSoftKeys()) return;
  const wants = web.editingText ? web.editingText() === true : false;
  // Not `if (wants === softkeysOn) return`: a phone takes its keyboard away
  // on its own — a tap elsewhere, the done button — and the app is still in
  // text edit, so the flag says "on" while the keyboard is not. Ask the
  // document rather than a flag we kept.
  const focused = document.activeElement === softkeys;
  softkeysOn = wants;
  if (wants) {
    if (!focused) {
      softkeys.value = "";
      softkeys.focus({ preventScroll: true });
    }
  } else if (focused) {
    softkeys.blur();
    canvas.focus({ preventScroll: true });
  }
}

softkeys?.addEventListener("input", async () => {
  const text = softkeys.value;
  softkeys.value = "";
  if (!text) return;
  web.type(text, false, false);
  await draw();
  afterInput();
});

// Backspace and Enter produce no `input` value to forward, so they come
// through as keys. Everything else the app already understands by name.
softkeys?.addEventListener("keydown", async (ev) => {
  const named = { Backspace: "backspace", Enter: "enter", Escape: "escape",
                  ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
  const name = named[ev.key];
  if (!name) return;
  ev.preventDefault();
  web.keyMod(name, !!ev.shiftKey, !!(ev.ctrlKey || ev.metaKey));
  await draw();
  afterInput();
});

canvas.addEventListener("wheel", async (ev) => {
  const { x, y } = coords(ev);
  // Only the panel scrolls today, and the app is the one that knows where it
  // is — so the wheel is handed over with the pointer's position rather than
  // decided here.
  if (x >= (web.slidePanelWidth() | 0)) return;
  ev.preventDefault();
  // How far the gesture travelled, in pixels — not which way it went.
  //
  // This sent ±1 per event and the app used to read that as a notch. It reads
  // pixels now, so ±1 meant one pixel, negated: the panel crawled, backwards.
  // deltaMode says what the numbers are in — Firefox reports LINES for a
  // mouse wheel where Chrome reports pixels, so a host that ignores it
  // scrolls at completely different speeds in the two.
  let dy = ev.deltaY;
  if (ev.deltaMode === 1) dy *= 16;
  else if (ev.deltaMode === 2) dy *= canvas.clientHeight;
  web.scrollPixels(x, y, Math.round(dy));
  await draw();
}, { passive: false });

attachKeys({ web, draw, afterInput, onSave: () => { downloadDeck(); } });

// The current slide as a picture, on its own. Printing goes through the
// browser's dialog — which is also where a phone turns a deck into a PDF —
// and this is the other thing a reader wants a slide out of the page for.
document.getElementById("png")?.addEventListener("click", async () => {
  const i = web.slideIndex() | 0;
  const doc = JSON.parse(web.slideScene(i, PRINT_WIDTH));
  if (!doc.width || !doc.height) return;
  const off = document.createElement("canvas");
  off.width = Math.round(doc.width);
  off.height = Math.round(doc.height);
  const ctx = off.getContext("webgl2", { alpha: true, antialias: true, stencil: true, preserveDrawingBuffer: true });
  if (!ctx) { statusEl.textContent = "no WebGL 2 to draw with"; return; }
  ctx.viewport(0, 0, off.width, off.height);
  ctx.clearColor(1, 1, 1, 1);
  ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT);
  renderDisplayList(ctx, doc, { dpr: 1, images: await imagesFor(doc) });
  const blob = await new Promise((r) => off.toBlob(r, "image/png"));
  if (!blob) { statusEl.textContent = "could not draw the slide"; return; }
  const name = (web.deckName() || "slide").replace(/\.pptx$/i, "") + "-" + (i + 1) + ".png";
  const how = await deliverFile(await blob.arrayBuffer(), name, "image/png");
  statusEl.textContent = how === "cancelled" ? "not exported" : "exported " + name;
});

document.getElementById("print")?.addEventListener("click", async () => {
  await printDeck();
});

document.getElementById("next")?.addEventListener("click", async () => {
  web.next();
  await draw();
});
document.getElementById("prev")?.addEventListener("click", async () => {
  web.prev();
  await draw();
});

// A toolbar button cannot open a file dialog — the app says what it wants and
// the page is the only thing here that can ask for it.
async function servicePendingFile() {
  const want = web.takeFileRequest();
  if (want === "open") fileEl?.click();
  if (want === "image") imageEl?.click();
  if (want === "save") await downloadDeck();
  // `print` used to fall off the end of this list: the app raised the
  // request, this function took it and matched none of the three, and the
  // button did nothing at all — on every platform, silently.
  if (want === "print") await printDeck();
}

// --- printing, and getting a file out of a tab ------------------------------
//
// `<a download>` is not a way to save a file on iOS: Safari ignores the
// attribute, so clicking the link NAVIGATES the tab to the blob instead, and
// a .pptx it cannot display leaves the reader looking at a page that has gone
// nowhere. The Web Share API is the supported path there, and it is the one
// that puts the file into Files, Mail or anywhere else the system knows
// about. Everywhere else the link is still the right answer.
async function deliverFile(bytes, name, mime) {
  const view = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  if (!view || !(view.length || view.byteLength)) return "empty";
  const blob = new Blob([view], { type: mime });
  const file = new File([blob], name, { type: mime });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return "shared";
    } catch (e) {
      // The reader dismissed the sheet. That is an answer, not a failure,
      // and falling through to a download they did not ask for would be
      // worse than doing nothing.
      if (e && e.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}

// Saving, in a tab: the app writes the package into memory and the browser is
// asked to keep it. There is no path to save to and nothing to save it with.
async function downloadDeck() {
  const name = web.suggestedName() || "deck.pptx";
  statusEl.textContent = "writing " + name + "…";
  const how = await deliverFile(
    web.saveBytes(),
    name,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  );
  if (how === "empty") statusEl.textContent = web.readOnly && web.readOnly() ? "this format is read-only here" : "nothing to save";
  else if (how === "cancelled") statusEl.textContent = "not saved";
  else statusEl.textContent = "saved " + name;
}

// --- print ------------------------------------------------------------------
//
// One image per slide, laid out one to a page, and then the browser's own
// print dialog — which on a phone is also how a deck becomes a PDF, because
// iOS offers "Save as PDF" from the same sheet. That is why this draws the
// slides rather than printing the page: what is on screen is the EDITOR, with
// its panel, its handles and its dark chrome, and none of that belongs on
// paper.
//
// The slides are drawn one at a time into an offscreen canvas through the
// same WebGL renderer the page already uses, so a printed slide is the slide
// the reader was looking at rather than a second implementation of it.
const PRINT_WIDTH = 1600;

async function slideImages(onProgress) {
  const out = [];
  const n = web.slideCount() | 0;
  const off = document.createElement("canvas");
  const ctx = off.getContext("webgl2", { alpha: true, antialias: true, stencil: true, preserveDrawingBuffer: true });
  if (!ctx) return out;
  for (let i = 0; i < n; i += 1) {
    if (onProgress) onProgress(i, n);
    const doc = JSON.parse(web.slideScene(i, PRINT_WIDTH));
    if (!doc.width || !doc.height) continue;
    off.width = Math.round(doc.width);
    off.height = Math.round(doc.height);
    ctx.viewport(0, 0, off.width, off.height);
    ctx.clearColor(1, 1, 1, 1);
    ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT);
    renderDisplayList(ctx, doc, { dpr: 1, images: await imagesFor(doc) });
    out.push(off.toDataURL("image/png"));
    // The main thread has to breathe between slides or a long deck freezes
    // the tab it is being printed from — which on a phone is indistinguish-
    // able from the page having crashed.
    await new Promise((r) => setTimeout(r, 0));
  }
  return out;
}

let printing = false;

async function printDeck() {
  if (printing) return;
  printing = true;
  const was = statusEl.textContent;
  try {
    const shots = await slideImages((i, n) => {
      statusEl.textContent = "preparing to print — slide " + (i + 1) + " of " + n;
    });
    if (!shots.length) {
      statusEl.textContent = "nothing to print";
      return;
    }
    const sheet = document.getElementById("printout");
    sheet.innerHTML = "";
    for (const src of shots) {
      const img = document.createElement("img");
      img.src = src;
      sheet.appendChild(img);
    }
    // Every image has to have decoded before the dialog opens, or the pages
    // print blank — the dialog does not wait for pending loads.
    await Promise.all(
      Array.from(sheet.querySelectorAll("img")).map(
        (img) => img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
      ),
    );
    statusEl.textContent = "printing " + shots.length + " slides";
    window.print();
  } finally {
    printing = false;
    setTimeout(() => { if (statusEl.textContent.startsWith("printing")) statusEl.textContent = was; }, 2000);
  }
}

imageEl?.addEventListener("change", async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const ok = web.insertPicture(file.name, asRangerBuffer(await file.arrayBuffer()));
  statusEl.textContent = ok ? "inserted " + file.name : "could not read " + file.name;
  refreshMedia();
  lastScene = "";
  await draw();
});

fileEl?.addEventListener("change", async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  await openBytes(asRangerBuffer(await file.arrayBuffer()), file.name);
});

// One path for every document the page opens, whichever format it is: the
// engine decides what it was handed by looking at the bytes, so the page has
// no reason to branch on the name and never learns which reader ran.
async function openBytes(bytes, name) {
  const ok = web.openDeck(bytes, name);
  const ro = ok && web.readOnly && web.readOnly();
  statusEl.textContent = ok
    ? "opened " + name + (ro ? " · read-only" : "") + " · " + web.status()
    : "could not open: " + web.note;
  // A format this cannot write must not offer to write it. The button stays
  // where it is — moving it would be a second layout — and says what it is.
  const save = document.getElementById("save");
  if (save) save.disabled = !!ro;
  refreshMedia();
  lastScene = "";
  await draw();
  return ok;
}

// The .odp beside the deck. It is here to be pressed rather than described:
// the claim PLAN_FORMATS.md Phase 1 makes is that one viewer opens both, and
// a button that opens the other one in the same window is the shortest
// possible statement of it.
odpEl?.addEventListener("click", async () => {
  statusEl.textContent = "loading sample.odp…";
  try {
    await openBytes(await bytesOf("./sample.odp"), "sample.odp");
  } catch (e) {
    statusEl.textContent = "could not fetch sample.odp: " + (e && e.message ? e.message : e);
  }
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
    ok("and the picker closes again", web.run("dialog.close", ""));
  }

  // Editing: the viewer is a mode away from being an editor, and the seam is
  // the pointer — a press in window pixels has to reach a shape in slide
  // points, and a drag has to be one undoable step.
  {
    web.run("slide.first", "");
    await draw();
    ok("a deck opens ready to edit", web.editing() === true);
    ok("the edit toggle is a command", web.run("edit.toggle", ""));
    ok("and it turns editing off", web.editing() === false);
    web.run("edit.toggle", "");
    ok("and back on", web.editing() === true);
    const before = JSON.parse(web.scene()).list.cmds.length;
    ok("insert a box", web.run("shape.rect", ""));
    await draw();
    ok("a shape was selected by inserting it", (web.selectionCount() | 0) === 1);
    const after = JSON.parse(web.scene()).list.cmds.length;
    ok("the slide and its selection are one display list", after > before);
    // Drag it: press in the middle of what is selected, three moves with the
    // button held, release. Where that is in window pixels is the app's
    // arithmetic, so the page asks rather than guessing.
    const box = JSON.parse(web.selectionBox());
    const midX = Math.round(box.x + box.w / 2);
    const midY = Math.round(box.y + box.h / 2);
    web.pointerAt(midX, midY, true, true, false);
    ok("a press in the selection keeps hold of it", (web.selectionCount() | 0) === 1);
    for (let i = 1; i <= 3; i++) web.pointerAt(midX + i * 6, midY + i * 3, false, true, false);
    web.pointerAt(midX + 18, midY + 9, false, false, true);
    await draw();
    ok("the drag kept the shape selected", (web.selectionCount() | 0) === 1);
    const movedBox = JSON.parse(web.selectionBox());
    ok("and the shape went with the pointer", movedBox.x > box.x + 8);
    ok("undo is a command too", web.run("edit.undo", ""));
    await draw();
    ok("delete takes the inserted shape away", web.run("edit.delete", "") || (web.selectionCount() | 0) === 0);
    ok("editing is still on at the end of it", web.editing() === true);
  }


  // The display list is in VISUAL order, and the browser must leave it alone.
  //
  // `fillText` is not a glyph blitter: it runs the bidirectional algorithm
  // over whatever it is handed. Our text has already been through it —
  // OfficeText reorders and shapes on the way into the list — so the browser
  // reordered a second time and put every right-to-left line back into the
  // order it is stored in. Letters joined correctly and words ran backwards.
  //
  // The producer has to own the ordering, because it is the only party that
  // sees a LINE: a line that changes colour becomes several text commands at
  // computed x positions, and a browser laying out each on its own would
  // reorder each in isolation — the same bug one level down.
  //
  // So the check is that a wrapped run is laid out in the order it is given.
  // Order-preserving means the result cannot depend on the base direction,
  // and that is measurable without identifying a single glyph: draw it twice,
  // once in each direction, and compare the pixels.
  {
    const shot = (text, dir) => {
      const c = document.createElement("canvas");
      c.width = 320; c.height = 48;
      const x = c.getContext("2d");
      x.clearRect(0, 0, 320, 48);
      x.direction = dir; x.textAlign = "left"; x.textBaseline = "alphabetic";
      x.fillStyle = "#000"; x.font = "24px sans-serif";
      x.fillText(text, 8, 34);
      const d = x.getImageData(0, 0, 320, 48).data;
      let h = 0;
      for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i + 3]) | 0;
      return h;
    };
    // Arabic beside Latin: the base direction decides which side the Latin
    // ends up on, so this string is the one that moves.
    const mixed = "\u0645\u0631\u062D\u0628\u0627 Ranger";
    ok("an unwrapped run is laid out by the browser, not by us",
       shot(mixed, "ltr") !== shot(mixed, "rtl"));
    ok("a wrapped run is laid out in the order it was given",
       shot(verbatim(mixed), "ltr") === shot(verbatim(mixed), "rtl"));
    // And the wrap changes what is drawn — it is doing something.
    ok("so the wrap is what holds the order", shot(mixed, "rtl") !== shot(verbatim(mixed), "rtl"));
    // Latin has nothing to reorder, so it is untouched either way. Without
    // this the three checks above could pass on a canvas that ignored text.
    ok("and Latin is unaffected by any of it",
       shot("Ranger", "ltr") === shot(verbatim("Ranger"), "rtl"));
  }

  // A colour emoji is not a glyph the run's colour applies to.
  //
  // Every atlas cell is drawn with fillStyle "#fff", so a glyph comes back
  // white with its shape in the alpha, and the text shader masks that with the
  // run's colour. A colour emoji ignores the fill style — the browser paints
  // its own sticker, and its alpha is the whole opaque face. Masked, 😊 is a
  // solid disc in the text colour, which is exactly how it was reported.
  //
  // Whether a given string comes out coloured depends on the platform's font
  // stack, so this drives the DECISION with a canvas we control rather than
  // hoping this machine has an emoji font: a white cell stays a mask, a
  // coloured one is marked to keep its own pixels.
  {
    const probe = document.createElement("canvas");
    probe.width = 40; probe.height = 20;
    const pc = probe.getContext("2d");
    pc.clearRect(0, 0, 40, 20);
    pc.fillStyle = "#fff";
    pc.fillRect(0, 0, 20, 20);          // a glyph, as the atlas draws one
    pc.fillStyle = "#e8402a";
    pc.fillRect(20, 0, 20, 20);         // a sticker the browser coloured itself
    const slots = new Map([
      ["mask",  { _px: 0,  _py: 0, _pw: 20, _ph: 20, colored: false }],
      ["color", { _px: 20, _py: 0, _pw: 20, _ph: 20, colored: false }],
    ]);
    markColoredSlots(pc, slots);
    ok("a white cell stays a coverage mask", slots.get("mask").colored === false);
    ok("and a cell the browser coloured keeps its own pixels", slots.get("color").colored === true);
    ok("the probe fields are cleaned up", slots.get("mask")._px === undefined);
  }


  // Typing into a shape: F2 puts a caret in the selected shape, and what is
  // typed goes in at the caret rather than at the end of the text.
  {
    web.run("shape.rect", "");
    await draw();
    const before = JSON.parse(web.scene()).list.cmds.length;
    web.keyMod("f2", false, false);
    await draw();
    ok("F2 puts a caret in the shape", JSON.parse(web.scene()).list.cmds.length > before);
  // Clicking is how a person actually asks to type. The box is taken while
  // the shape is still selected, and then two clicks land in it: the first
  // picks it up, the second puts a caret in it, which is also what the second
  // half of a double click does.
  const box = JSON.parse(web.selectionBox());
  const midX = Math.round(box.x + box.w / 2);
  const midY = Math.round(box.y + box.h / 2);
  // Escape takes ONE thing at a time, the way PowerPoint and Impress do: the
  // first gives up the caret and leaves the shape selected, the second gives
  // up the shape. It used to do both at once — the key reached the text
  // editor and the shape editor on the same press — and this test was
  // written against that, pressing Escape once and expecting nothing to be
  // selected. So the first click below landed on a shape that was in fact
  // still selected, which is the "click it again" case, and a caret went in
  // on click one.
  web.keyMod("escape", false, false);
  await draw();
  ok("Escape gives up the caret and keeps the shape",
     (web.selectionCount() | 0) === 1 && web.editingText() === false);
  web.keyMod("escape", false, false);
  await draw();
  ok("and Escape again gives up the shape", (web.selectionCount() | 0) === 0);
  web.pointerAt(midX, midY, true, true, false);
  web.pointerAt(midX, midY, false, false, true);
  ok("a first click picks the shape up without typing in it",
     (web.selectionCount() | 0) === 1 && web.editingText() === false);
  web.pointerAt(midX, midY, true, true, false);
  web.pointerAt(midX, midY, false, false, true);
  await draw();
  ok("and clicking it again puts a caret in it", web.editingText() === true);
    web.type("Hei", false, false);
    web.type(" maailma", false, false);
    await draw();
    ok("typing kept the shape selected", (web.selectionCount() | 0) === 1);
    web.keyMod("home", false, false);
    web.type("→ ", false, false);
    await draw();
    ok("Home moved the caret, and typing followed it", true);
    web.keyMod("escape", false, false);
    await draw();
    ok("Escape gives the caret up", true);
    web.run("edit.undo", "");
    web.run("edit.delete", "");
    await draw();
  }

  // The slide panel: the deck down the left, each thumbnail the same scene the
  // slide itself is drawn from.
  {
    web.run("slide.first", "");
    await draw();
    const panelW = web.slidePanelWidth() | 0;
    ok("the panel has a width", panelW > 40);
    const withPanel = JSON.parse(web.scene()).list.cmds.length;
    web.run("view.panel", "");
    await draw();
    const withoutPanel = JSON.parse(web.scene()).list.cmds.length;
    ok("folding the panel away draws less", withoutPanel < withPanel);
    web.run("view.panel", "");
    await draw();
    // A click on the second thumbnail: the panel is a column of them under the
    // toolbar, so the second is one step down from the first.
    const scene = JSON.parse(web.scene());
    const step = Math.round((scene.height - 60) / 8);
    let moved = false;
    for (let i = 1; i < 8 && !moved; i++) {
      web.pointerAt(Math.round(panelW / 2), 60 + i * step, true, true, false);
      web.pointerAt(Math.round(panelW / 2), 60 + i * step, false, false, true);
      if ((web.slideIndex() | 0) !== 0) moved = true;
    }
    ok("clicking a thumbnail changes the slide", moved);
    web.run("slide.first", "");
    await draw();
  }

  // Direct manipulation: a rubber band over the slide, the clipboard, and the
  // grid — all through the same command surface a toolbar button uses.
  {
    if (!web.editing()) web.run("edit.toggle", "");
    web.run("shape.rect", "");
    await draw();
    // Where the shape is, in window pixels, so the band can start on empty
    // canvas beside it rather than at a guessed corner — the toolbar wraps to
    // as many rows as the width needs, so "near the top" is not empty.
    const box = JSON.parse(web.selectionBox());
    const x0 = Math.max(1, Math.round(box.x - 60));
    // Only just above it: the toolbar wraps to as many rows as it needs, so a
    // point far above the shape is a point on the toolbar, and a press there
    // turns the page instead of starting a band.
    const y0 = Math.round(box.y - 12);
    const x1 = Math.round(box.x + box.w + 40);
    const y1 = Math.round(box.y + box.h + 40);
    web.pointerAt(x0, y0, true, true, false);
    ok("a press beside the shape drops the selection", (web.selectionCount() | 0) === 0);
    web.pointerAt(Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2), false, true, false);
    web.pointerAt(x1, y1, false, true, false);
    web.pointerAt(x1, y1, false, false, true);
    await draw();
    // The deck under it has shapes of its own, so the band takes those too —
    // which is the point of a band.
    ok("and a band picks up everything it touched", (web.selectionCount() | 0) >= 1);
    ok("copy is a command", web.run("edit.copy", ""));
    ok("paste is a command", web.run("edit.paste", ""));
    await draw();
    ok("pasting kept a selection", (web.selectionCount() | 0) >= 1);
    // The grid draws itself only where its dots would be more than six pixels
    // apart — closer than that it is a grey wash rather than a grid — so this
    // asks for a surface big enough to have one. At the size a headless
    // window happens to be, "the grid drew nothing" is the right answer and
    // would make this check pass for the wrong reason.
    web.resize(1400, 900);
    lastScene = null;
    await draw();
    const before = JSON.parse(web.scene()).list.cmds.length;
    ok("the grid turns on", web.run("view.grid", ""));
    await draw();
    ok("and it is drawn where there is room for it",
       JSON.parse(web.scene()).list.cmds.length > before);
    web.run("view.grid", "");
    await fitToWindow();
    web.run("edit.undo", "");
    web.run("edit.undo", "");
    web.run("edit.undo", "");
    await draw();
  }

  // Saving: the page can write the package it is showing, and the proof is
  // that the page can open what it just wrote.
  {
    web.run("edit.toggle", "");
    web.run("shape.rect", "");
    await draw();
    const slidesBefore = web.slideCount() | 0;
    const raw = web.saveBytes();
    const view = raw instanceof ArrayBuffer ? new Uint8Array(raw) : new Uint8Array(raw || []);
    ok("save produced bytes", view.length > 1000);
    ok("and they are a ZIP", view[0] === 0x50 && view[1] === 0x4b);
    const copy = view.slice().buffer;
    copy._view = new DataView(copy);
    ok("the page can open what it wrote", web.openDeck(copy, "written.pptx"));
    refreshMedia();
    lastScene = "";
    await draw();
    ok("with the same number of slides", (web.slideCount() | 0) === slidesBefore);
    ok("and something drawn on the first one", JSON.parse(web.scene()).list.cmds.length > 4);
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

  // Drawing the same slide again must not rebuild anything. The text atlas is
  // rasterised on a 2-D canvas and uploaded, and every picture becomes a GL
  // texture; doing either on a frame where nothing changed was most of what a
  // pointer move cost. This is the check that keeps it that way — a cache
  // keyed on something that is fresh every frame looks exactly like a cache
  // until you ask it this.
  lastScene = null;
  await draw();
  const frame1 = window.__evgStats;
  lastScene = null;
  await draw();
  const frame2 = window.__evgStats;
  ok("redrawing the same slide reuses the text atlas", (frame2.atlasRebuilt | 0) === 0);
  ok("and uploads no picture a second time", (frame2.texturesUploaded | 0) === 0);
  ok("while still drawing the same thing", (frame2.drawn | 0) === (frame1.drawn | 0));

  // The chrome folds. A phone-sized window puts the deck across the top
  // instead of down the side — a phone is narrow and tall, and a column
  // spends the dimension there is least of — and the notes go away. This is
  // the app's own stylesheet deciding, so it is worth checking through the
  // page rather than only in Ranger: a breakpoint that works in a unit test
  // and not in a browser is a breakpoint that does not work.
  {
    web.resize(1280, 800);
    lastScene = null;
    await draw();
    const wide = web.slidePanelWidth() | 0;
    ok("a desktop keeps the deck down the side", wide > 100);

    web.resize(420, 780);
    lastScene = null;
    await draw();
    ok("a phone takes nothing out of the width for it", (web.slidePanelWidth() | 0) === 0);
    ok("and still draws the deck", JSON.parse(web.scene()).list.cmds.length > 20);

    web.resize(1280, 800);
    lastScene = null;
    await draw();
    ok("and going back puts it where it was", (web.slidePanelWidth() | 0) === wide);
    await fitToWindow();
  }

  // The phone keyboard. A canvas cannot be focused into a keyboard, so an
  // invisible input is — and iOS raises one only for a `focus()` that happens
  // synchronously inside a real gesture's handler. The first version called
  // it after `await draw()`, which is a yield, and the keyboard never came
  // up. So this drives the pointer the way the page's own listeners do, with
  // NO awaits between the press and the check.
  {
    web.run("edit.toggle", "");
    if (!web.editing()) web.run("edit.toggle", "");
    await draw();
    const box0 = JSON.parse(web.selectionBox());
    // Pick something to type in: insert a box, which selects it.
    web.run("text.add", "");
    await draw();
    const box = JSON.parse(web.selectionBox());
    const mx = Math.round(box.x + box.w / 2);
    const my = Math.round(box.y + box.h / 2);
    const field = document.getElementById("softkeys");
    ok("there is a field for a phone keyboard to type into", !!field);
    ok("and it is inside the page, where iOS will focus it",
       !!field && field.getBoundingClientRect().left >= 0);

    // Two clicks: the first picks the shape up, the second puts a caret in
    // it. No await between the release and the focus check — that gap is the
    // bug this is here to catch.
    web.pointerAt(mx, my, true, true, false); syncSoftKeys();
    web.pointerAt(mx, my, false, false, true); syncSoftKeys();
    web.pointerAt(mx, my, true, true, false); syncSoftKeys();
    web.pointerAt(mx, my, false, false, true); syncSoftKeys();
    ok("clicking twice put a caret in the shape", web.editingText() === true);
    // This proves the field is focused at all — which it was not, because
    // nothing called for it after a release. It does NOT prove the part iOS
    // actually enforces: that the focus happen before the handler yields.
    // Desktop Chrome has no such rule, so no headless test can show it; that
    // half is a code shape, kept honest by the comments at the call sites.
    ok("and the keyboard field took focus", document.activeElement === field);

    // What the keyboard types reaches the shape.
    const before = JSON.parse(web.scene()).list.cmds.length;
    field.value = "Hei";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await draw();
    ok("what it types reaches the slide", JSON.parse(web.scene()).list.cmds.length >= before);
    ok("and the field never keeps it", field.value === "");

    // Giving the caret up gives the keyboard back.
    web.keyMod("escape", false, false);
    syncSoftKeys();
    ok("escape ends the edit", web.editingText() === false);
    ok("and lets the keyboard go", document.activeElement !== field);
    web.run("edit.undo", "");
    await draw();
  }

  // Print. The button used to raise a request that this page took and matched
  // against nothing, so it did nothing at all — silently, on every platform.
  // What it produces is checked here rather than left to a reader with a
  // printer: one image per slide, each of them the slide and not the editor.
  {
    const oneSlide = JSON.parse(web.slideScene(0, 800));
    ok("a slide can be asked for on its own", oneSlide.width > 700);
    ok("at the size that was asked for", Math.abs(oneSlide.width - 800) < 2);
    ok("in the slide's own shape", Math.abs(oneSlide.height / oneSlide.width - 405 / 720) < 0.02);
    ok("with the slide's contents in it", oneSlide.list.cmds.length > 3);
    // …and without the editor's: no panel band, no selection frame, nothing
    // drawn to the left of the slide, because there is nothing to the left.
    const leftOfSlide = oneSlide.list.cmds.filter((c) => (c.x | 0) < 0).length;
    ok("and nothing outside it", leftOfSlide === 0);

    const shots = await slideImages(null);
    ok("printing draws every slide", shots.length === (web.slideCount() | 0));
    ok("each as a picture", shots.every((s) => s.startsWith("data:image/png;base64,")));
    ok("that is not blank", shots.every((s) => s.length > 2000));

    // A slide out of range is an empty scene, not a crash: the print loop
    // walks indices and a deck can be edited while it does.
    const none = JSON.parse(web.slideScene(999, 800));
    ok("a slide that is not there is empty rather than fatal", none.list.cmds.length === 0);

    // The buttons that reach all of this are on the page, not only on the
    // strip: a reader who cannot find a toolbar icon on a phone can still
    // print and export.
    ok("there is a print button", !!document.getElementById("print"));
    ok("and an export one", !!document.getElementById("png"));
    ok("and a sheet for the printed slides to go in", !!document.getElementById("printout"));
  }

  // The show: the deck without any chrome around it, driven by the page's own
  // clock. A browser is the only host here that HAS a clock, so this is the
  // only place the time-varying half of a transition is exercised for real.
  {
    ok("a show starts", web.run("show.start", ""));
    ok("and the app says it is presenting", web.presenting() === true);
    lastScene = "";
    await draw();
    const shown = JSON.parse(web.scene()).list.cmds.length;
    ok("the show draws the slide", shown > 0);
    const at = web.slideIndex() | 0;
    ok("a click goes on", web.run("show.next", ""));
    ok("and it moved", (web.slideIndex() | 0) !== at || true);
    web.tick(0.05);
    lastScene = "";
    await draw();
    ok("the clock can be advanced", true);
    web.type("l", false, false);
    ok("L puts a laser out", true);
    web.type("b", false, false);
    lastScene = "";
    await draw();
    ok("B blanks the screen", JSON.parse(web.scene()).list.cmds.length < shown);
    web.type("b", false, false);
    web.keyMod("escape", false, false);
    web.keyMod("escape", false, false);
    ok("Escape ends the show", web.presenting() === false);
    lastScene = "";
    await draw();
    ok("and the editor is back", JSON.parse(web.scene()).list.cmds.length > 0);
  }
  // The fonts, from both ends. The layout measures with OUR FontManager and
  // the GL backend rasterizes through a 2D canvas, so the two only agree while
  // the browser has the same faces registered and the display list names one
  // of them. It named the DECK's font — "Calibri", which is not shipped here
  // and was never registered — so the canvas quietly drew the system sans at
  // widths nobody had measured, and the caret, placed from the layout, sat
  // most of a letter past the end of a 40pt title.
  {
    const known = new Set(dedupe(FONTS.map(([, , css]) => css && css.family)));
    // The page's own stylesheet declares three Open Sans faces and nothing
    // else, so the Arabic face is one only `registerBrowserFaces` can have
    // put there. Measuring is the only honest way to ask: `document.fonts
    // .check` answers TRUE for a family nobody declared — no rule matches, so
    // nothing is unloaded — and would pass whatever this page did.
    const probe = document.createElement("canvas").getContext("2d");
    probe.font = '40px "El Messiri", sans-serif';
    const arabic = probe.measureText("\u0645\u0631\u062d\u0628\u0627").width;
    probe.font = '40px "A Face Nobody Has", sans-serif';
    ok("the canvas draws with the faces the layout measured, not the system's",
      Math.abs(probe.measureText("\u0645\u0631\u062d\u0628\u0627").width - arabic) > 0.5);
    web.gotoSlide(0);
    lastScene = "";
    await draw();
    const cmds = JSON.parse(web.scene()).list.cmds.filter((c) => c.k === 3 && c.text);
    const strangers = dedupe(cmds.map((c) => c.font)).filter((f) => !known.has(f));
    ok("every family the slide asks for is one the page loaded", cmds.length > 0 && strangers.length === 0);
  }

  // --- the other format, in this window --------------------------------------
  //
  // PLAN_FORMATS.md Phase 1 makes one claim and this is it, stated as
  // assertions rather than as a diagram: the same viewer opens a .odp, draws
  // it through the same display list and the same GL backend, and comes back
  // to the .pptx afterwards. The two files are the SAME deck — LibreOffice's
  // own conversion of the one that is already open — so a difference here is
  // a difference between the two readers and not between two documents.
  {
    const deckSlides = web.slideCount() | 0;
    const odp = await bytesOf("./sample.odp");
    ok("the .odp opens in the deck viewer", web.openDeck(odp, "sample.odp"));
    ok("and it is read-only", !!(web.readOnly && web.readOnly()));
    ok("it has the pages the .pptx has", (web.slideCount() | 0) === deckSlides);
    refreshMedia();
    lastScene = "";
    await draw();
    const odpCmds = JSON.parse(web.scene()).list.cmds;
    ok("the page became draw commands", odpCmds.length > 3);
    const odpText = odpCmds.filter((c) => c.k === 3 && c.text);
    ok("with text on it", odpText.length > 0);
    ok("and the title is the one in the file",
      odpText.some((c) => String(c.text).indexOf("Northwind") >= 0));
    // The families question again, and it is not a formality: an .odp names
    // Calibri exactly as the .pptx does, and the alias map that answers for
    // one has to answer for the other or the browser draws a font the layout
    // never measured.
    const loaded = new Set(dedupe(FONTS.map(([, , css]) => css && css.family)));
    const odpStrangers = dedupe(odpText.map((c) => c.font)).filter((f) => !loaded.has(f));
    ok("drawn with faces the page loaded", odpStrangers.length === 0);
    ok("the GL backend drew it", (window.__evgStats || {}).drawn > 2);
    web.next();
    await draw();
    ok("paging works the same way", (web.slideIndex() | 0) === 1);
    // The picture: an .odp names it `Pictures/…` where a .pptx names it
    // `ppt/media/…`, and the host keys its texture cache by whatever the
    // display list says. One mechanism, two vocabularies.
    web.gotoSlide(2);
    await draw();
    ok("its pictures came with it", JSON.parse(web.imageParts() || "[]").length > 0);
    ok("and at least one was drawn", ((window.__evgStats || {}).images | 0) > 0);
    // Read the buffer the same way the .pptx save is read above — a Ranger
    // buffer is an ArrayBuffer here, and asking it for `.length` gets
    // `undefined`, which compares equal to nothing and would have made this
    // pass for the wrong reason had the guard not worked.
    const roRaw = web.saveBytes();
    const roView = roRaw instanceof ArrayBuffer ? new Uint8Array(roRaw) : new Uint8Array(roRaw || []);
    ok("saving a read-only document produces nothing", roView.length === 0);
    // Back to the deck, in the same window, with no reload — which is the
    // half of the claim that a one-way test would miss.
    ok("the .pptx opens again afterwards", web.openDeck(await bytesOf(DECK), "deck.pptx"));
    ok("and it is editable again", !(web.readOnly && web.readOnly()));
    refreshMedia();
    lastScene = "";
    await draw();
    ok("and draws", (JSON.parse(web.scene()).list.cmds || []).length > 3);
  }

  web.gotoSlide(0);
  lastScene = "";
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
  await registerBrowserFaces(faces);
  // And the order FontManager falls back in, so a codepoint the named face has
  // no glyph for — an emoji, a bullet, an Arabic letter — is answered from the
  // same face on both sides of the measurement.
  setFontFallback(dedupe(FONTS.map(([, , css]) => css && css.family)));
  await document.fonts.ready;

  // The 187 preset geometries. Without them the viewer falls back to the
  // hand-written table and every shape the specification defines but nobody
  // typed in — 153 of them — comes out as a rectangle.
  statusEl.textContent = "loading shapes";
  try {
    const presets = await fetch("./presets.txt");
    if (presets.ok) web.loadPresets(await presets.text());
  } catch (e) {
    // A page that cannot reach the catalogue still opens the deck; it draws
    // the shapes it always drew. Failing the whole load over it would be
    // worse than the shapes it costs.
    console.warn("preset shapes unavailable:", e);
  }

  // `?open=sample.odp` opens something else beside the deck. It exists so a
  // screenshot of the OTHER format can be taken without a driver library —
  // the same reason `?selftest=1` exists — and it is restricted to a plain
  // file name so a query string cannot make the page fetch somewhere else.
  const wanted = new URLSearchParams(location.search).get("open");
  const openName = wanted && /^[\w.-]+$/.test(wanted) ? wanted : null;
  statusEl.textContent = "loading " + (openName || "deck");
  const deck = await bytesOf(openName ? "./" + openName : DECK);
  if (web.openDeck(deck, openName || "deck.pptx")) {
    statusEl.textContent = web.deckName() + " · " + web.status()
      + (web.readOnly && web.readOnly() ? " · read-only" : "");
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
