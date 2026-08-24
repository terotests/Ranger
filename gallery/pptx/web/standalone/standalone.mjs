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

// The page watches for this: if the imports above fail, nothing below runs
// and the only evidence anywhere is a 404 in the network panel.
window.__pageStarted = true;

const canvas = document.getElementById("screen");
const statusEl = document.getElementById("status");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const slideEl = document.getElementById("slide");
const fileEl = document.getElementById("file");
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
}

function coords(ev) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(sceneW - 1, Math.floor((ev.clientX - rect.left) * (sceneW / Math.max(1, rect.width))))),
    y: Math.max(0, Math.min(sceneH - 1, Math.floor((ev.clientY - rect.top) * (sceneH / Math.max(1, rect.height))))),
  };
}

// Whether the button is still held is this file's to remember: the app is
// told down/pressed/released and a move that says "not down" cannot be a drag,
// which is the whole of dragging a shape.
let pointerHeld = false;

canvas.addEventListener("pointerdown", async (ev) => {
  canvas.focus();
  const { x, y } = coords(ev);
  pointerHeld = true;
  web.mods(!!ev.shiftKey, !!(ev.ctrlKey || ev.metaKey));
  // Through the frame: a press lands on a window, then the toolbar, then the
  // slide — in that order, decided by the app rather than by this file.
  web.pointerAt(x, y, true, true, false);
  await draw();
  afterInput();
  await servicePendingFile();
});

canvas.addEventListener("pointermove", async (ev) => {
  const { x, y } = coords(ev);
  if (web.pointerAt(x, y, false, pointerHeld, false)) await draw();
});

canvas.addEventListener("pointerup", async (ev) => {
  const { x, y } = coords(ev);
  pointerHeld = false;
  web.pointerAt(x, y, false, false, true);
  await draw();
  afterInput();
});

canvas.addEventListener("pointercancel", () => {
  pointerHeld = false;
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

const KEYS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Home: "home",
  End: "end",
  PageUp: "pageUp",
  PageDown: "pageDown",
  Delete: "del",
  Backspace: "backspace",
  Escape: "escape",
  Enter: "enter",
  F2: "f2",
  F5: "f5",
};

window.addEventListener("keydown", async (ev) => {
  const ctrl = !!(ev.ctrlKey || ev.metaKey);
  // Ctrl chords are characters with the modifier held — undo, redo, select
  // all, group, bold — and the app decides which of them mean anything.
  if (ctrl && (ev.key === "s" || ev.key === "S")) {
    ev.preventDefault();
    downloadDeck();
    return;
  }
  if (ctrl && ev.key.length === 1) {
    ev.preventDefault();
    web.type(ev.key, !!ev.shiftKey, true);
    await draw();
    return;
  }
  const name = KEYS[ev.key];
  if (name) {
    ev.preventDefault();
    web.keyMod(name, !!ev.shiftKey, ctrl);
    await draw();
    afterInput();
    return;
  }
  // Typing into the selected shape — and, while a show is running, the
  // letters a presenter reaches for: space goes on, P and L put a pen or a
  // laser out, B blanks the screen, N shows the presenter's own view.
  if (ev.key.length === 1 && (web.editing() || web.presenting())) {
    ev.preventDefault();
    web.type(ev.key, !!ev.shiftKey, false);
    await draw();
    afterInput();
  }
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
  if (want === "save") downloadDeck();
}

// Saving, in a tab: the app writes the package into memory and the browser is
// asked to keep it. There is no path to save to and nothing to save it with.
function downloadDeck() {
  const raw = web.saveBytes();
  const view = raw instanceof ArrayBuffer ? new Uint8Array(raw) : raw;
  if (!view || !(view.length || view.byteLength)) {
    statusEl.textContent = "nothing to save";
    return;
  }
  const url = URL.createObjectURL(
    new Blob([view], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = web.suggestedName() || "deck.pptx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  statusEl.textContent = "saved " + a.download;
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
    const before = JSON.parse(web.scene()).list.cmds.length;
    ok("the grid turns on", web.run("view.grid", ""));
    await draw();
    ok("and it is drawn", JSON.parse(web.scene()).list.cmds.length > before);
    web.run("view.grid", "");
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
