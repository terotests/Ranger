/**
 * Markdown in a tab.
 *
 *   TYPE    canvas  → MarkdownWeb.key / typeText → one patch on the source
 *           textarea→ MarkdownWeb.applyPatch      → …the same source
 *   PAINT   MarkdownWeb.frame() → evg-webgl.js                        (here)
 *   PRINT   MarkdownWeb.pdf()   → Blob → the browser saves it         (here)
 *
 * **Both panes edit, and there is one document.** `MdEditController` owns the
 * source; the textarea and the canvas are two views of it, and each submits a
 * patch and then re-reads. Neither writes to the other, so there is no loop —
 * which is the way a two-pane editor usually breaks, and the reason the
 * module owns the text rather than the page.
 *
 * No host process and no server: a keystroke is a function call. The only
 * things fetched are what a browser cannot make for itself — the four font
 * faces, and a document to start with.
 *
 * The page adds no drawing code of its own. `evg-webgl.js` is the same
 * renderer the RangerFlow, DataGrid and book pages use, and the seam is the
 * display list.
 *
 * **Why the faces are fetched rather than named.** The layout measures with
 * the TTF the PDF will embed, so the line breaks on the canvas and the line
 * breaks on the page are the same line breaks. If the page simply asked for
 * "Open Sans" and let the system answer, the three would disagree and it
 * would look like a bug in the line breaker.
 */
import { renderDisplayList, setFontFallback, fontSpec, verbatim } from "./gl/evg-webgl.js";

// If the import above 404s, nothing below runs and the only evidence is a
// line in the network panel. The page watches for this instead.
window.__pageStarted = true;

const canvas = document.getElementById("screen");
const sourceEl = document.getElementById("source");
const statusEl = document.getElementById("status");
const hintEl = document.getElementById("hint");
const modeEl = document.getElementById("mode");
const sampleEl = document.getElementById("sample");
const pdfBtn = document.getElementById("pdf");
const htmlBtn = document.getElementById("html");
const openBtn = document.getElementById("openFile");
const filePick = document.getElementById("filepick");
const keyCatcher = document.getElementById("keys");
const toolbarEl = document.getElementById("toolbar");

const gl = canvas.getContext("webgl2", {
  antialias: true,
  premultipliedAlpha: false,
  stencil: true,
});
if (!gl) {
  statusEl.textContent = "WebGL 2 not available";
  hintEl.textContent = "This page needs WebGL 2.";
  throw new Error("WebGL 2 required");
}

/**
 * The four faces, by the names the LAYOUT asks for.
 *
 * The variant is part of the family name — `Open Sans-Bold`, not `Open Sans`
 * at weight 700 — because that is the one spelling the TTF measurer, the PDF
 * font manager and a `FontFace` all resolve identically. Register them under
 * the plain family with a weight instead and the canvas draws a face nobody
 * measured.
 */
const FACES = [
  ["Open Sans", "OpenSans-Regular.ttf"],
  ["Open Sans-Bold", "OpenSans-Bold.ttf"],
  ["Open Sans-Italic", "OpenSans-Italic.ttf"],
  ["Open Sans-BoldItalic", "OpenSans-BoldItalic.ttf"],
  ["Noto Sans", "NotoSans-Regular.ttf"],
  ["Noto Sans-Bold", "NotoSans-Bold.ttf"],
];

const SAMPLES = {
  mermaid: "./samples/mermaid.md",
  sample: "./samples/sample.md",
  readme: "./samples/README.md",
};

/** Ranger's `buffer` is an ArrayBuffer with a DataView hung off it. */
function asRangerBuffer(ab) {
  ab._view = new DataView(ab);
  return ab;
}

async function bytesOf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + " → " + res.status);
  return await res.arrayBuffer();
}

/** The engine is a classic <script> beside this module, and it is BUILT
 *  rather than checked in; when the tag 404s the first mention of it is a
 *  bare `MarkdownWeb is not defined` with no hint that a build step was
 *  skipped — or that the SOURCE directory is being served instead of dist/. */
function engineClass() {
  const cls = globalThis.MarkdownWeb;
  if (typeof cls !== "function") {
    statusEl.textContent = "markdown_web.js is missing — run: npm run markdown:web";
    hintEl.textContent =
      "markdown_web.js is missing.\nRun `npm run markdown:web` and serve the dist/ directory it writes.";
    throw new Error("engine bundle not loaded");
  }
  return cls;
}

const app = new (engineClass())();
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let needsPaint = true;
let lastCommands = 0;

function viewSize() {
  return [canvas.clientWidth, canvas.clientHeight];
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const [w, h] = viewSize();
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  app.resize(w, h);
  needsPaint = true;
}

// ---- painting -------------------------------------------------------------
// A document is not an animation. The canvas is repainted when something
// changed — a keystroke, a scroll, a resize — and sits still otherwise, which
// is why a 38-page document does not keep a laptop's fan running.
function paint() {
  if (needsPaint) {
    needsPaint = false;
    const doc = JSON.parse(app.frame());
    const stats = renderDisplayList(gl, doc, { dpr });
    lastCommands = doc.list.cmds.length;
    if (stats && typeof stats.commands === "number") lastCommands = stats.commands;
  }
  requestAnimationFrame(paint);
}

function showStatus(extra) {
  const base = app.status();
  statusEl.textContent = extra ? base + " — " + extra : base;
}

// What a downloaded PDF or HTML file is called. It follows whatever was
// opened, so a saved file is named after the document rather than after the
// page. (It lived beside the old source-pane code and went out with it; the
// page then threw on load and silently fell back to its built-in document,
// which every check downstream read as "the layout is broken".)
let docName = "markdown";

// ---- the source pane ------------------------------------------------------
//
// The textarea is a VIEW. What it does arrives as a patch, computed by
// comparing what it now holds against what the module holds — a common prefix
// and a common suffix, which is all a textarea can report in one event. That
// keeps its keystrokes on the same undo stack as the canvas's, and stops a
// word typed on the left from throwing away the history built on the right.
function commonPatch(was, now) {
  let a = 0;
  const min = Math.min(was.length, now.length);
  while (a < min && was.charCodeAt(a) === now.charCodeAt(a)) a++;
  let z = 0;
  while (z < min - a && was.charCodeAt(was.length - 1 - z) === now.charCodeAt(now.length - 1 - z)) z++;
  return { start: a, end: was.length - z, text: now.slice(a, now.length - z) };
}

// Writing the source back into the textarea without moving the caret the
// reader is holding. Assigning `.value` resets the selection, so it is put
// back — and skipped entirely when nothing changed, because doing it on every
// frame is what makes a text field feel like it is fighting you.
let suppressSourceEvent = false;
function showSource(caretTo) {
  const text = app.sourceText();
  if (sourceEl.value !== text) {
    const at = sourceEl.selectionStart;
    const end = sourceEl.selectionEnd;
    suppressSourceEvent = true;
    sourceEl.value = text;
    suppressSourceEvent = false;
    if (caretTo === undefined) sourceEl.setSelectionRange(at, end);
  }
  if (caretTo !== undefined) sourceEl.setSelectionRange(caretTo, caretTo);
}

function afterEdit(ms) {
  needsPaint = true;
  showSource();
  refreshToolbar();
  const why = app.refusal();
  showStatus(why ? why : ms !== undefined ? ms + " ms" : "");
}

sourceEl.addEventListener("input", () => {
  if (suppressSourceEvent) return;
  const t0 = performance.now();
  const p = commonPatch(app.sourceText(), sourceEl.value);
  app.applyPatch(p.start, p.end, p.text);
  const ms = Math.round(performance.now() - t0);
  needsPaint = true;
  refreshToolbar();
  showStatus(ms + " ms");
});

// The caret in the source scrolls the drawing to the LINE it is in, and puts
// the module's caret there too — so switching panes mid-word does not lose
// the place.
function syncFromCaret() {
  if (!app.ready()) return;
  const a = sourceEl.selectionStart | 0;
  const b = sourceEl.selectionEnd | 0;
  app.setSelection(a, b);
  const y = app.offsetToY(a);
  app.scrollTo(y - 24);
  needsPaint = true;
  refreshToolbar();
}
sourceEl.addEventListener("click", syncFromCaret);
sourceEl.addEventListener("keyup", (ev) => {
  if (ev.key.startsWith("Arrow") || ev.key === "PageUp" || ev.key === "PageDown") syncFromCaret();
});

// ---- the drawing pane, which is the editor --------------------------------
//
// A canvas cannot receive typed text. Every browser editor that draws its own
// glyphs solves this the same way: a real focusable field, off-screen but not
// `display:none`, takes the keystrokes and the IME composition and the
// clipboard, and its content is thrown away after each one. `keys` in the
// HTML is that field.
app.setEditMode(true);

function viewPoint(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

// The blink. Owned by the page, not the module: a caret that blinked inside
// the engine would redraw a document nobody is looking at.
let caretOn = true;
let blinkTimer = 0;
function restartBlink() {
  caretOn = true;
  app.setCaretOn(true);
  needsPaint = true;
  clearInterval(blinkTimer);
  blinkTimer = setInterval(() => {
    if (document.activeElement !== keyCatcher) return;
    caretOn = !caretOn;
    app.setCaretOn(caretOn);
    needsPaint = true;
  }, 530);
}

function focusCanvas() {
  keyCatcher.focus({ preventScroll: true });
  restartBlink();
}

canvas.addEventListener(
  "wheel",
  (ev) => {
    ev.preventDefault();
    const step = ev.deltaMode === 1 ? 18 : 1;
    app.scrollBy(ev.deltaY * step);
    needsPaint = true;
  },
  { passive: false }
);

// A press places the caret; a drag extends the selection. Scrolling by
// dragging the page is gone — a document you can type into is one where a
// drag has to mean "select", the way it does everywhere else.
let selecting = false;
canvas.addEventListener("pointerdown", (ev) => {
  ev.preventDefault();
  canvas.setPointerCapture(ev.pointerId);
  focusCanvas();
  const [x, y] = viewPoint(ev);
  if (ev.detail >= 2) {
    app.selectWordAt(x, y);
  } else {
    app.click(x, y, ev.shiftKey);
    selecting = true;
  }
  afterEdit();
});
canvas.addEventListener("pointermove", (ev) => {
  if (!selecting) return;
  const [x, y] = viewPoint(ev);
  app.dragTo(x, y);
  needsPaint = true;
});
function endSelect() {
  selecting = false;
  refreshToolbar();
}
canvas.addEventListener("pointerup", endSelect);
canvas.addEventListener("pointercancel", endSelect);

// The key names the module takes are `docx_web`'s, so one table serves both.
const KEYS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Home: "home",
  End: "end",
  PageUp: "pageUp",
  PageDown: "pageDown",
  Backspace: "backspace",
  Delete: "delete",
  Enter: "enter",
};

keyCatcher.addEventListener("keydown", (ev) => {
  const mod = ev.ctrlKey || ev.metaKey;
  let name = KEYS[ev.key];
  if (!name && mod && ev.key.length === 1) name = ev.key.toLowerCase();
  if (!name) return;
  const t0 = performance.now();
  if (app.key(name, ev.shiftKey, mod)) {
    ev.preventDefault();
    restartBlink();
    // Scroll the caret into view, which is the one thing the module cannot
    // do for itself: it does not know how tall the window is until asked.
    const c = JSON.parse(app.caretJson());
    if (c.h > 0) {
      if (c.y < 0) app.scrollBy(c.y - 8);
      else if (c.y + c.h > canvas.clientHeight) app.scrollBy(c.y + c.h - canvas.clientHeight + 8);
    }
    afterEdit(Math.round(performance.now() - t0));
  }
});

// Typed text, including an IME composition, arrives as `input` on the hidden
// field. The field is emptied after each one: it is a funnel, not a buffer.
keyCatcher.addEventListener("input", () => {
  const v = keyCatcher.value;
  keyCatcher.value = "";
  if (!v) return;
  const t0 = performance.now();
  app.typeText(v);
  restartBlink();
  afterEdit(Math.round(performance.now() - t0));
});

keyCatcher.addEventListener("copy", (ev) => {
  ev.clipboardData.setData("text/plain", app.copySelection());
  ev.preventDefault();
});
keyCatcher.addEventListener("cut", (ev) => {
  ev.clipboardData.setData("text/plain", app.cutSelection());
  ev.preventDefault();
  afterEdit();
});
// Both flavours. A range copied in a spreadsheet carries a real `<table>` in
// `text/html` and tab-separated text in `text/plain`; the module reads the
// first with the same scanner the .docx editor uses and writes a GFM table.
keyCatcher.addEventListener("paste", (ev) => {
  const html = ev.clipboardData.getData("text/html") || "";
  const text = ev.clipboardData.getData("text/plain") || "";
  ev.preventDefault();
  if (!html && !text) return;
  const madeTable = app.pasteRich(html, text);
  afterEdit();
  if (madeTable) showStatus("pasted as a table");
});
keyCatcher.addEventListener("focus", restartBlink);
keyCatcher.addEventListener("blur", () => {
  clearInterval(blinkTimer);
  app.setCaretOn(false);
  needsPaint = true;
});

// ---- the toolbar ----------------------------------------------------------
//
// Every button is one `run(id, arg)` into the module. The page holds no rules
// about what bold means to markdown — adding a command is a row in the
// module's table, not a branch here.
function refreshToolbar() {
  const u = toolbarEl.querySelector('[data-cmd="edit.undo"]');
  const r = toolbarEl.querySelector('[data-cmd="edit.redo"]');
  if (u) u.disabled = !app.canUndo();
  if (r) r.disabled = !app.canRedo();
}

toolbarEl.addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-cmd]");
  if (!btn) return;
  const id = btn.dataset.cmd;
  let arg = btn.dataset.arg || "";
  if (id === "format.link") {
    arg = prompt("Link to:", "https://") || "";
    if (!arg) return;
  }
  const t0 = performance.now();
  app.run(id, arg);
  focusCanvas();
  afterEdit(Math.round(performance.now() - t0));
});

pdfBtn.addEventListener("click", () => {
  // Built HERE, from the same layout the canvas is showing. A canvas has one
  // page as far as `window.print()` is concerned, so the browser's own print
  // dialog would give a single clipped sheet.
  const t0 = performance.now();
  const buf = app.pdf();
  const ms = Math.round(performance.now() - t0);
  const bytes = buf instanceof ArrayBuffer ? buf : buf.buffer || buf;
  deliver(bytes, docName + ".pdf", "application/pdf");
  showStatus(app.pdfPageCount() + " pages in " + ms + " ms");
});

htmlBtn.addEventListener("click", () => {
  const html = app.html();
  deliver(new TextEncoder().encode(html), docName + ".html", "text/html");
});

openBtn.addEventListener("click", () => filePick.click());
filePick.addEventListener("change", async () => {
  const file = filePick.files && filePick.files[0];
  if (!file) return;
  docName = file.name.replace(/\.[^.]+$/, "");
  await load(await file.text());
});

sampleEl.addEventListener("change", async () => {
  const key = sampleEl.value;
  docName = key === "readme" ? "README" : key;
  try {
    const res = await fetch(SAMPLES[key]);
    await load(await res.text());
  } catch (e) {
    showStatus("could not open that sample");
  }
});

modeEl.addEventListener("change", () => {
  app.setPaged(modeEl.value === "paged");
  app.scrollTo(0);
  needsPaint = true;
  showStatus();
});

async function load(text) {
  const t0 = performance.now();
  app.setSource(text);
  const ms = Math.round(performance.now() - t0);
  showSource(0);
  app.scrollTo(0);
  needsPaint = true;
  refreshToolbar();
  showStatus(ms + " ms");
}

// ---- start ----------------------------------------------------------------
async function start() {
  resize();
  window.addEventListener("resize", resize);

  // The faces, into the engine AND into the browser: the first pair measures
  // the layout, the second pair paints it.
  const got = new Array(FACES.length).fill(false);
  await Promise.all(
    FACES.map(async ([name, file], i) => {
      try {
        const bytes = await bytesOf("./fonts/" + file);
        const ok = app.attachFont(name, asRangerBuffer(bytes.slice(0)));
        const face = new FontFace(name, bytes);
        await face.load();
        document.fonts.add(face);
        got[i] = ok;
      } catch (e) {
        // A missing face is not fatal: the layout falls back to a measured
        // table and says so. Silence would be worse.
        console.warn("face not loaded: " + name, e);
      }
    })
  );
  // In FACES order, not in the order the fetches finished: the painter walks
  // this list per CODEPOINT the way `FontManager` does, and a walk in another
  // order answers a missing glyph from another face.
  const loaded = FACES.filter((_, i) => got[i]).map(([name]) => name);
  // What the layout measured with, told to the thing that draws it.
  //
  // Two things ride on this. The pool is the fallback chain, so a codepoint
  // the text face has no glyph for is drawn from the same face it was
  // MEASURED from. And the names are the FACES — `Open Sans-Bold`, not `Open
  // Sans` plus a weight — which is how the painter knows not to strip the
  // suffix and draw bold runs in the regular face. Without this the page
  // measured 11pt Open Sans Bold and drew 11pt Open Sans: nothing looked
  // bold, and every run after a bold one sat about 7% of its width too far
  // right — a huge space in the middle of a sentence.
  setFontFallback(loaded);
  if (loaded.length === 0) {
    showStatus("no fonts — measuring with a guessed table");
  }

  try {
    const res = await fetch(SAMPLES.mermaid);
    docName = "mermaid";
    await load(await res.text());
  } catch (e) {
    console.warn("sample not loaded:", e);
    await load("# Markdown, drawn by EVG\n\nType on the left.\n");
  }

  hintEl.remove();
  paint();

  // The page checks itself, and the check is readable from outside: the smoke
  // test drives this same page in headless Chrome and reads the result out of
  // the DOM rather than out of a screenshot.
  if (new URLSearchParams(location.search).has("selftest")) {
    window.__selftest = selftest();
  }
}

function selftest() {
  const out = { ok: true, notes: [] };
  const say = (name, cond, detail) => {
    if (!cond) out.ok = false;
    out.notes.push((cond ? "PASS " : "FAIL ") + name + (detail ? " (" + detail + ")" : ""));
  };

  say("webgl2", gl instanceof WebGL2RenderingContext);
  say("fonts attached", app.fontsReady());

  const doc = JSON.parse(app.frame());
  const cmds = doc.list.cmds;
  say("commands", cmds.length > 50, cmds.length + " commands");

  // The document must arrive as TEXT RUNS, not as one big picture: a page
  // that rasterized on a server and shipped a PNG would also "have commands".
  const texts = cmds.filter((c) => c.k === 3).length;
  say("drawn as text runs", texts > 10, texts + " text runs");

  // What the layout MEASURED and what the browser will DRAW have to be the
  // same number, or every run after the first on a line sits at an x nobody
  // measured. It went wrong for bold: the layout measured `Open Sans-Bold`
  // and the painter, stripping the suffix and finding no weight on the
  // command, drew `Open Sans` — 7% narrower, so nothing looked bold and the
  // rest of the sentence sat a visible gap too far right. A screenshot could
  // not see it; two numbers can.
  const mctx = document.createElement("canvas").getContext("2d");
  const drawnWidth = (c) => {
    mctx.font = fontSpec(c, 1);
    return mctx.measureText(verbatim(c.text)).width;
  };
  const wide = (c) => c.k === 3 && c.text && c.text.length > 8;
  const boldRun = cmds.find((c) => wide(c) && c.font && c.font.endsWith("-Bold"));
  say("a bold run is on the page", !!boldRun, boldRun ? boldRun.font : "none");
  if (boldRun) {
    const drawn = drawnWidth(boldRun);
    say(
      "bold is drawn at the width it was measured",
      Math.abs(drawn - boldRun.w) <= Math.max(0.5, boldRun.w * 0.005),
      drawn.toFixed(2) + " vs " + boldRun.w.toFixed(2)
    );
  }
  const plainRun = cmds.find((c) => wide(c) && c.font && !c.font.endsWith("-Bold"));
  if (plainRun) {
    const drawn = drawnWidth(plainRun);
    say(
      "and so is the rest",
      Math.abs(drawn - plainRun.w) <= Math.max(0.5, plainRun.w * 0.005),
      drawn.toFixed(2) + " vs " + plainRun.w.toFixed(2)
    );
  }

  // …and a diagram must arrive as geometry, not as a labelled box.
  const paths = cmds.filter((c) => c.k === 6 || c.k === 7).length;
  say("diagram is geometry", paths > 0, paths + " path/stroke commands");
  say("diagrams read", app.diagramCount() > 0, app.diagramCount() + " diagrams");

  // Typing changes the drawing.
  const before = app.commandCount();
  app.setSource(sourceEl.value + "\n\n## A heading the test typed\n\nand a line under it, with [a link](https://example.com/typed) in it.\n");
  say("typing redraws", app.commandCount() > before, before + " → " + app.commandCount());

  // Scrolling moves it.
  app.scrollTo(0);
  const top = JSON.parse(app.frame());
  app.scrollTo(200);
  const lower = JSON.parse(app.frame());
  const firstY = (l) => {
    const c = l.list.cmds[0];
    return c ? c.y : 0;
  };
  say("scrolling moves it", Math.abs(firstY(top) - firstY(lower)) > 100);

  // Paged mode is the same layout with the breaks the PDF will have, so the
  // reader can see where page four starts before they print it.
  app.setPaged(true);
  say("paged has sheets", app.pdfPageCount() >= 1, app.pdfPageCount() + " sheets");
  const paged = JSON.parse(app.frame()).list.cmds.length;
  say("paged redraws", paged > 0, paged + " commands");
  app.setPaged(false);

  // A PDF, built in the tab, with the faces embedded and the right page count.
  try {
    const buf = app.pdf();
    const bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer || buf);
    const head = String.fromCharCode(...bytes.subarray(0, 5));
    say("pdf header", head === "%PDF-", head);
    const text = new TextDecoder("latin1").decode(bytes);
    const pageObjs = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
    say("pdf pages", pageObjs >= 1, pageObjs + " page objects");
    say("pdf embeds fonts", text.includes("FontFile2"));
    // One PostScript name per FACE. All four faces of a family declare the
    // same family name inside the file, and publishing them under it made
    // every reader that caches an embedded program by `/BaseFont` draw the
    // whole document in whichever face was drawn first — a page whose first
    // word was bold came out bold throughout, on paper only.
    const faces = text.match(/\/BaseFont\s*\/([^\s\/\]>]+)/g) || [];
    const unique = new Set(faces);
    say("pdf names each face once", faces.length > 1 && unique.size === faces.length,
        faces.length + " font objects, " + unique.size + " names");
    // A link in the PDF is a `/Annots` entry, not blue ink. The typed source
    // above ends with one, so this is checked on a document the test wrote
    // rather than on whatever sample happened to be open.
    const annots = (text.match(/\/Subtype\s*\/Link/g) || []).length;
    say("pdf links are clickable", annots >= 1, annots + " link annotations");
    say("pdf size", bytes.length > 2000, bytes.length + " bytes");
  } catch (e) {
    say("pdf", false, String(e));
  }

  // A click on the drawing names a CHARACTER, not a paragraph.
  //
  // This is the whole point of the source map, and the failure it replaces
  // was invisible in a screenshot: `sourceOffsetAt` answered with the block's
  // first byte whatever x it was given, so clicking the last word of the
  // fourth paragraph put the source caret at the start of it. Two clicks on
  // one line, and the answers have to differ — and both have to land inside
  // that line rather than at the top of the paragraph.
  //
  // Asked HERE, in the browser, because the offsets are computed by measuring
  // and the measurer here has the four real faces attached; the layout-level
  // version of the same round trip runs against the estimate tables in
  // `markdown:srcmap:test`.
  app.setSource("first paragraph\n\nsecond paragraph with several words in it\n");
  app.scrollTo(0);
  const mapped = JSON.parse(app.frame()).list.cmds.filter(
    (c) => c.k === 3 && c.text && c.text.indexOf("second") === 0
  );
  say("the second paragraph is on the page", mapped.length > 0, mapped.length + " runs");
  if (mapped.length > 0) {
    const run = mapped[0];
    const wantStart = "first paragraph\n\n".length;
    const atLeft = app.sourceOffsetAt(run.x + 1, run.y);
    say("a click on the first letter is that letter", atLeft === wantStart,
        atLeft + " wanted " + wantStart);
    const atRight = app.sourceOffsetAt(run.x + run.w - 1, run.y);
    say("a click on the last letter is a different letter", atRight > atLeft + 10,
        atLeft + " → " + atRight);
    say("and it is still inside the same paragraph",
        atRight <= wantStart + run.text.length, atRight + " of " + run.text.length);
    // …and the caret comes back to the line it was on rather than to the top
    // of the block, which is what makes the two panes track each other.
    const y = app.offsetToY(atRight);
    say("the offset maps back to its own line", Math.abs(y - run.y) <= 2,
        y.toFixed(1) + " vs " + run.y.toFixed(1));
  }

  // ---- the canvas is an editor ---------------------------------------------
  //
  // Everything above this line is about a document being DRAWN. These are
  // about it being edited, and they are the checks a screenshot cannot make:
  // a caret drawn in the wrong place, a keystroke that changes the picture
  // but not the file, an undo that goes back too far — all three look fine in
  // a picture and are the whole feature.
  //
  // Driven through the module's own seam rather than through synthetic DOM
  // events, for the same reason `docx_web` is: the seam is what a keystroke
  // reaches, and a test that fakes a `KeyboardEvent` is testing the browser.
  app.setSource("one two three\n");
  app.setEditMode(true);
  app.setCaretOn(true);

  const chromeCount = () => JSON.parse(app.frame()).list.cmds.length;
  app.setSelection(0, 0);
  const bare = chromeCount();
  app.setSelection(0, 7);
  say("a selection is drawn", chromeCount() > bare, bare + " → " + chromeCount());
  app.setCaretOn(false);
  const noCaret = chromeCount();
  app.setSelection(0, 0);
  app.setCaretOn(true);
  say("and so is the caret", chromeCount() > noCaret - 1);

  // Typing changes the FILE, not just the picture.
  app.setSelection(3, 3);
  app.typeText("X");
  say("typing lands in the source", app.sourceText() === "oneX two three\n", app.sourceText().trim());
  app.undo();
  say("and undo takes it out again", app.sourceText() === "one two three\n");

  // A command from the toolbar, and the bytes it wrote.
  app.setSelection(4, 7);
  say("bold ran", app.run("format.bold", ""));
  say("…and wrote the markers", app.sourceText() === "one **two** three\n", app.sourceText().trim());
  say("bold again ran", app.run("format.bold", ""));
  say("…and took them off, byte for byte", app.sourceText() === "one two three\n");

  // A heading, a list, and one undo each.
  app.setSelection(1, 1);
  app.run("block.heading", "2");
  say("a heading was made", app.sourceText() === "## one two three\n", app.sourceText().trim());
  app.undo();
  say("and undone", app.sourceText() === "one two three\n");
  app.run("block.bullet", "");
  say("a bullet was made", app.sourceText() === "- one two three\n", app.sourceText().trim());
  app.undo();
  say("and undone too", app.sourceText() === "one two three\n");

  // A refusal says why rather than writing markdown nobody typed.
  app.setSource("a **bold** b\n");
  app.setSelection(6, 12);
  say("half in and half out is refused", app.run("format.bold", "") === false);
  say("…and says why", app.refusal().length > 0, app.refusal());
  say("…and wrote nothing", app.sourceText() === "a **bold** b\n");

  // A click on the drawing moves the caret, and the caret has a place on it.
  app.setSource("alpha beta gamma\n");
  const run2 = JSON.parse(app.frame()).list.cmds.find((c) => c.k === 3 && c.text && c.text.indexOf("alpha") === 0);
  if (run2) {
    app.click(run2.x + run2.w - 1, run2.y, false);
    const c2 = JSON.parse(app.caretJson());
    say("a click puts the caret near the end", c2.offset > 10, "offset " + c2.offset);
    say("and the caret has an x on the page", c2.x > 0, c2.x.toFixed(1));
    app.typeText("!");
    say("and typing lands there", app.sourceText().indexOf("!") > 10, app.sourceText().trim());
  } else {
    say("the line is on the page", false);
  }

  // The clipboard's HTML flavour, as a table.
  app.setSource("before\n");
  app.setSelection(7, 7);
  const madeTable = app.pasteRich(
    "<table><tr><td>Name</td><td>Qty</td></tr><tr><td>Bolt</td><td>12</td></tr></table>",
    "Name\tQty\nBolt\t12"
  );
  say("a spreadsheet range pastes as a table", madeTable);
  say("…with a header rule", app.sourceText().indexOf("| ---") > 0, app.sourceText().trim().split("\n")[1] || "");
  app.undo();
  say("…and one undo takes the whole table", app.sourceText() === "before\n");

  // The other pane's edit arrives as a patch on the same stack.
  app.setSource("hello\n");
  app.applyPatch(5, 5, " world");
  say("a patch from the source pane lands", app.sourceText() === "hello world\n", app.sourceText().trim());
  app.undo();
  say("and is one undo like any other", app.sourceText() === "hello\n");

  const el = document.createElement("div");
  el.id = "selftest-result";
  el.textContent = (out.ok ? "SELFTEST OK " : "SELFTEST FAILED ") + out.notes.join(" | ");
  el.style.display = "none";
  document.body.appendChild(el);
  return out;
}

start().catch((e) => {
  statusEl.textContent = String(e && e.message ? e.message : e);
  console.error(e);
});
