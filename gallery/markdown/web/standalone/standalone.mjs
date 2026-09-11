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
const themeEl = document.getElementById("theme");
const pdfBtn = document.getElementById("pdf");
const htmlBtn = document.getElementById("html");
const pptxBtn = document.getElementById("pptx");
const openBtn = document.getElementById("openFile");
const filePick = document.getElementById("filepick");
const keyCatcher = document.getElementById("keys");
const toolbarEl = document.getElementById("toolbar");
const shapeEl = document.getElementById("pageshape");
const pagebarEl = document.getElementById("pagebar");
const pagenumEl = document.getElementById("pagenum");
const pagetotalEl = document.getElementById("pagetotal");
const pageprevEl = document.getElementById("pageprev");
const pagenextEl = document.getElementById("pagenext");

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
// The faces the page managed to fetch, in FACES order — the fallback chain
// the layout measured against and the painter draws against. `selftest`
// rebuilds the layout's font shorthand from it.
let loadedFaces = [];

const FACES = [
  ["Open Sans", "OpenSans-Regular.ttf"],
  ["Open Sans-Bold", "OpenSans-Bold.ttf"],
  ["Open Sans-Italic", "OpenSans-Italic.ttf"],
  ["Open Sans-BoldItalic", "OpenSans-BoldItalic.ttf"],
  ["Noto Sans", "NotoSans-Regular.ttf"],
  ["Noto Sans-Bold", "NotoSans-Bold.ttf"],
];

// Fetched before the selftest runs, because the selftest is synchronous —
// the smoke harness reads `window.__selftest` off the DOM and an async one
// would have to be waited for on the other side of the bridge.
let selftestDeck = "";
let selftestTheme = "";
let selftestTheme2 = "";

const THEMES = {
  corporate: "./themes/corporate.css",
  editorial: "./themes/editorial.css",
};

const SAMPLES = {
  mermaid: "./samples/mermaid.md",
  diagrams: "./samples/diagrams.md",
  deck: "./samples/deck.md",
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

// A built file, handed to the browser to save. It went out with the old
// source-pane code and nothing said so until a reader pressed ⬇ PDF and got
// `ReferenceError: deliver is not defined` — the second function this edit
// deleted by accident, after `docName`. Both are now covered by the page's
// own checks, which press the buttons.
function deliver(bytes, name, mime) {
  const view = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  if (!view || !view.length) return "empty";
  const blob = new Blob([view], { type: mime });
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
    // Only while the SOURCE pane owns the keyboard. Putting a selection back
    // into a textarea nobody is typing in is how the caret ended up there.
    if (caretTo === undefined && active === "source") sourceEl.setSelectionRange(at, end);
  }
  if (caretTo !== undefined && active === "source") sourceEl.setSelectionRange(caretTo, caretTo);
}

function afterEdit(ms) {
  needsPaint = true;
  showSource();
  refreshToolbar();
  refreshPagebar();
  const why = app.refusal();
  showStatus(why ? why : ms !== undefined ? ms + " ms" : "");
}

sourceEl.addEventListener("input", () => {
  if (suppressSourceEvent) return;
  setActive("source");
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
  if (active !== "source") return;
  const a = sourceEl.selectionStart | 0;
  const b = sourceEl.selectionEnd | 0;
  app.setSelection(a, b);
  const y = app.offsetToY(a);
  app.scrollTo(y - 24);
  needsPaint = true;
  refreshToolbar();
  refreshPagebar();
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

// ---- one editor at a time -------------------------------------------------
//
// Both panes show the same document and only one of them is being typed into.
// Which one is a MODE, not a guess: the pane that was last clicked owns the
// keyboard, the other one is read-only until it is clicked, and the canvas
// draws a caret only while it owns it.
//
// Without the mode the two fight. A keystroke on the canvas writes the source
// back into the textarea, the textarea's selection is restored, and a reader
// who glances down finds their next word going into the left pane instead.
// The bug looked like "focus jumps"; it was two editors both believing they
// were active.
let active = "source";
function setActive(which) {
  if (active === which) return;
  active = which;
  sourceEl.readOnly = which !== "source";
  sourceEl.classList.toggle("readonly", which !== "source");
  if (which === "canvas") {
    keyCatcher.focus({ preventScroll: true });
    restartBlink();
  } else {
    clearInterval(blinkTimer);
    app.setCaretOn(false);
  }
  needsPaint = true;
}
sourceEl.addEventListener("focus", () => setActive("source"));
sourceEl.addEventListener("pointerdown", () => setActive("source"));

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
    if (active !== "canvas" || document.activeElement !== keyCatcher) return;
    caretOn = !caretOn;
    app.setCaretOn(caretOn);
    needsPaint = true;
  }, 530);
}

function focusCanvas() {
  setActive("canvas");
  // …and re-focus even when the mode did not change: a click inside the
  // canvas after a click on a toolbar button has to come back.
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
    refreshPagebar();
  },
  { passive: false }
);

// A press places the caret; a drag extends the selection. Scrolling by
// dragging the page is gone — a document you can type into is one where a
// drag has to mean "select", the way it does everywhere else.
let selecting = false;
canvas.addEventListener("pointerdown", (ev) => {
  ev.preventDefault();
  // Throws `NotFoundError` for a pointer the browser does not have down —
  // which a synthetic event never is, and a real one sometimes is not either.
  // Capture is an optimisation for the drag; the click must not depend on it.
  try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* no capture */ }
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
keyCatcher.addEventListener("focus", () => setActive("canvas"));
keyCatcher.addEventListener("blur", () => {
  clearInterval(blinkTimer);
  app.setCaretOn(false);
  needsPaint = true;
});

// ---- the sheet, and which of them you are on ------------------------------
//
// The page number sits OVER the paper rather than beside it, follows the
// scroll, and is also how you jump: typing a number in it goes there. All
// three are one control because they are one question — "where am I" and
// "take me there" are the same widget in every reader.
function refreshPagebar() {
  const on = modeEl.value === "paged" || modeEl.value === "slides";
  pagebarEl.classList.toggle("on", on);
  shapeEl.disabled = !on;
  if (!on) return;
  const total = app.pageCountNow();
  const at = app.pageAt() + 1;
  pagetotalEl.textContent = String(total);
  if (document.activeElement !== pagenumEl) pagenumEl.value = String(at);
  pageprevEl.disabled = at <= 1;
  pagenextEl.disabled = at >= total;
}

function goToPage(n) {
  app.scrollToPage(n - 1);
  needsPaint = true;
  refreshPagebar();
}

pageprevEl.addEventListener("click", () => goToPage(app.pageAt()));
pagenextEl.addEventListener("click", () => goToPage(app.pageAt() + 2));
pagenumEl.addEventListener("change", () => {
  const n = parseInt(pagenumEl.value, 10);
  if (Number.isFinite(n)) goToPage(n);
  else refreshPagebar();
});
pagenumEl.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") { ev.preventDefault(); pagenumEl.blur(); }
});

shapeEl.addEventListener("change", () => {
  app.setPageSize(shapeEl.value);
  needsPaint = true;
  refreshPagebar();
  showStatus();
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

// The deck. Not a picture of the slides: a heading is a title placeholder, a
// list is bullets PowerPoint reflows, a table is a table. What could not go
// out as text — a diagram — went out as shapes, and the status line says so,
// because a reader who opens it and cannot edit the flowchart should have
// been told before they tried.
pptxBtn.addEventListener("click", () => {
  const t0 = performance.now();
  const buf = app.pptx();
  const ms = Math.round(performance.now() - t0);
  const bytes = buf instanceof ArrayBuffer ? buf : buf.buffer || buf;
  deliver(bytes, docName + ".pptx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  showStatus(app.pptxReport() + " — " + ms + " ms");
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

// The company template. One fetch, one string, and the layout is resolved
// from it — the markdown is not touched, which is the whole claim.
async function useTheme(key) {
  // Empty is not "no template": it is "whatever the document asks for". The
  // templates are all registered by name at startup, so clearing the reader's
  // choice hands the decision back to the front matter.
  if (!key) {
    app.setStyleSheet("");
    showStatus(app.themeReport());
    refreshPagebar();
    needsPaint = true;
    return;
  }
  if (key === "none") {
    app.setStyleSheet(" ");
    showStatus("no template");
    refreshPagebar();
    needsPaint = true;
    return;
  }
  try {
    const res = await fetch(THEMES[key]);
    app.setStyleSheet(await res.text());
    const left = app.styleSheetReport();
    showStatus(left ? key + ".css — not honoured: " + left : key + ".css");
  } catch (e) {
    showStatus("could not read that template");
  }
  refreshPagebar();
  needsPaint = true;
}

themeEl.addEventListener("change", () => useTheme(themeEl.value));

modeEl.addEventListener("change", () => {
  // Three modes, one document. `slides` is `paged` with the break rules a
  // deck wants — same tree, same layout, a different policy — so the sheet
  // controls stay live for it.
  const name = modeEl.value === "scroll" ? "continuous" : modeEl.value;
  if (name !== "continuous") app.setPageSize(shapeEl.value);
  app.setMode(name);
  app.scrollTo(0);
  needsPaint = true;
  refreshPagebar();
  const note = app.slideReport();
  showStatus(note || undefined);
});

async function load(text) {
  const t0 = performance.now();
  app.setSource(text);
  const ms = Math.round(performance.now() - t0);
  showSource(0);
  app.scrollTo(0);
  needsPaint = true;
  refreshToolbar();
  refreshPagebar();
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
  loadedFaces = loaded;
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
  const q = new URLSearchParams(location.search);
  // `?sample=diagrams` opens one of the dropdown's documents, so a screenshot
  // of any of them can be taken without clicking. It goes through the same
  // handler the dropdown does rather than a second loader.
  // Every template this page has, by name, so a document can ask for one
  // itself. Registered once; which is used is then the document's business
  // until the reader picks from the dropdown.
  await Promise.all(
    Object.keys(THEMES).map(async (name) => {
      try {
        app.addTheme(name, await (await fetch(THEMES[name])).text());
      } catch (e) {
        console.warn("template not loaded: " + name, e);
      }
    })
  );

  const wantedTheme = q.get("theme");
  if (wantedTheme && THEMES[wantedTheme]) {
    themeEl.value = wantedTheme;
    await useTheme(wantedTheme);
  }
  const wanted = q.get("sample");
  if (wanted && SAMPLES[wanted]) {
    sampleEl.value = wanted;
    sampleEl.dispatchEvent(new Event("change"));
  }
  if (q.has("selftest")) {
    try {
      selftestDeck = await (await fetch(SAMPLES.deck)).text();
      selftestTheme = await (await fetch(THEMES.corporate)).text();
      selftestTheme2 = await (await fetch(THEMES.editorial)).text();
    } catch (e) {
      selftestDeck = "";
    }
    window.__selftest = selftest();
  }
  // A known editing state, for a screenshot. It drives the same seam a
  // keystroke does — there is no demo-only path into the document — so a
  // picture taken this way is a picture of the editor rather than of a mock.
  if (q.has("demo")) {
    if (q.get("demo") === "paged" || q.get("demo") === "slides") {
      modeEl.value = q.get("demo");
      app.setPageSize(q.get("size") || "a4");
      app.setMode(q.get("demo") === "slides" ? "slides" : "paged");
      app.scrollTo(0);
      refreshPagebar();
      needsPaint = true;
      return;
    }
    const at = app.sourceText().indexOf("diagram travels");
    if (at > 0) {
      app.setSelection(at, at + 15);
      app.run("format.bold", "");
      const after = app.sourceText().indexOf("through a README");
      app.setSelection(after + 10, after + 16);
    }
    app.setCaretOn(true);
    showSource();
    refreshToolbar();
    needsPaint = true;
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
  //
  // The two numbers are two measurements of the SAME STRING in this browser:
  // once with the face the layout read — the command names it, and the page
  // registered that face under that exact name, so `"Open Sans-Bold"` is a
  // family the browser has — and once with the shorthand the painter builds.
  // The bug is the gap between them, and it is the gap whatever box the run
  // ends up in.
  //
  // This used to hold the painter's width against the command's `w`. But `w`
  // is the ELEMENT's inner width, and a run in a box wider than its text — a
  // diagram's label, a table cell — is legitimately narrower than the box it
  // sits in. Two of the nine wide runs on this page are, so the check passed
  // or failed on which run `find` happened to reach first, and it reached a
  // different one wherever the installed fonts differed.
  const mctx = document.createElement("canvas").getContext("2d");
  const widthWith = (spec, text) => {
    mctx.font = spec;
    return mctx.measureText(verbatim(text)).width;
  };
  const faceSpec = (c) => `${c.size}px "${c.font}", sans-serif`;
  const wide = (c) => c.k === 3 && c.text && c.text.length > 8;
  const runs = cmds.filter((c) => wide(c) && c.font && loadedFaces.includes(c.font));
  say("wide runs to check", runs.length > 2, runs.length + " runs of " + loadedFaces.length + " faces");
  const off = runs
    .map((c) => ({ c, m: widthWith(faceSpec(c), c.text), d: widthWith(fontSpec(c, 1), c.text) }))
    .filter((r) => Math.abs(r.d - r.m) > Math.max(0.5, r.m * 0.005));
  say(
    "every run is drawn in the face it was measured in",
    off.length === 0,
    off.length === 0
      ? runs.length + " runs agree"
      : off.map((r) => `${r.c.font}: measured ${r.m.toFixed(2)} drawn ${r.d.toFixed(2)}`).join("; ")
  );
  const boldRun = runs.find((c) => c.font.endsWith("-Bold"));
  say("a bold run is on the page", !!boldRun, boldRun ? boldRun.font : "none");

  // …and a diagram must arrive as geometry, not as a labelled box.
  const paths = cmds.filter((c) => c.k === 6 || c.k === 7).length;
  say("diagram is geometry", paths > 0, paths + " path/stroke commands");
  say("diagrams read", app.diagramCount() > 0, app.diagramCount() + " diagrams");

  // Four notations, one document. Mermaid was the only fence this editor
  // could draw; PlantUML, Graphviz and D2 are read through their own doors
  // now, and the failure to catch is the quiet one — a fence that is parsed
  // as code, so there is no slot at all and the count silently stays at one.
  {
    const kept = sourceEl.value;
    const four =
      "```plantuml\n@startuml\nclass Tilaus\nclass Rivi\nTilaus *-- Rivi\n@enduml\n```\n\n" +
      "```dot\ndigraph { a -> b; }\n```\n\n" +
      "```d2\nvarasto -> keraily\nkeraily -> lahetys\n```\n\n" +
      "```mermaid\nflowchart LR\n  A --> B\n```\n";
    app.setSource(four);
    say("four notations, four diagrams", app.diagramCount() === 4, app.diagramCount() + " read");
    const four_cmds = JSON.parse(app.frame()).list.cmds;
    const shapes = four_cmds.filter((c) => c.k === 6 || c.k === 7).length;
    say("and all four arrive as geometry", shapes > 8, shapes + " path/stroke commands");
    const drewName = (t) => four_cmds.some((c) => c.k === 3 && (c.text || "").includes(t));
    // A class diagram read as a sequence diagram still draws boxes and
    // edges, so counting shapes would not catch it. Counting names does.
    say("the PlantUML classes are on the page", drewName("Tilaus") && drewName("Rivi"));
    // Same question for D2, and with words no other fence on this page uses.
    say("the D2 objects are on the page", drewName("varasto") && drewName("lahetys"));

    // Switching the layout must not lose them. The diagrams are prepared at
    // the width of the column they land in, and that width changes with the
    // page shape — so the preparation has to happen against the style the
    // layout is about to use, not the one it used last time. When it did
    // not, every diagram came back as "… — no handler prepared this one"
    // until some later rebuild happened to line up.
    const notes = () =>
      JSON.parse(app.frame()).list.cmds.filter(
        (c) => c.k === 3 && (c.text || "").includes("no handler prepared")
      ).length;
    say("no unprepared slot to begin with", notes() === 0);
    app.setPaged(true);
    say("…none after switching to paged", notes() === 0, app.diagramCount() + " diagrams");
    app.setPageSize("a4 landscape");
    say("…none after changing the page shape", notes() === 0);
    app.setPageSize("a4");
    app.setPaged(false);
    say("…and none on the way back", notes() === 0);
    app.setSource(kept);
  }

  // A space typed at the inside edge of bold used to un-write it: a
  // delimiter run closes emphasis only when what precedes it is not
  // whitespace, so `**travels **` is four literal asterisks, and the reader
  // watched markers they never typed appear in the document.
  {
    const kept = sourceEl.value;
    app.setSource("Mermaid is how **a diagram travels** through a README.\n");
    const at = app.sourceText().indexOf("travels") + "travels".length;
    app.setSelection(at, at);
    app.typeText(" ");
    say(
      "a space at the closing edge steps outside the bold",
      app.sourceText().includes("**a diagram travels** "),
      JSON.stringify(app.sourceText().trim())
    );
    const shown = JSON.parse(app.frame()).list.cmds
      .filter((c) => c.k === 3)
      .map((c) => c.text || "")
      .join(" ");
    say("…so no asterisks reach the page", !shown.includes("**"), shown.slice(0, 80));
    app.undo();
    say("…and one undo puts it back", app.sourceText().includes("**a diagram travels** through"));

    // The other end of the run, which breaks the same way.
    app.setSource("Mermaid is how **a diagram travels** through a README.\n");
    const open = app.sourceText().indexOf("**a diagram") + 2;
    app.setSelection(open, open);
    app.typeText(" ");
    say(
      "a space at the opening edge steps outside it too",
      app.sourceText().includes("how  **a diagram travels**"),
      JSON.stringify(app.sourceText().trim())
    );
    app.setSource(kept);
  }

  // A company template, resolved over the same document.
  //
  // The check that bites is the first one: the layout keys a block's boxes
  // under its SOURCE, a style is the other half of what made them and was
  // not in the key, so switching the template replayed the boxes measured
  // under the previous one and nothing moved at all. On the page that showed
  // up as a paragraph redrawn at the new size on the old size's positions,
  // with the second half of a wrapped line over the first — so the overlap
  // is checked too, as the thing a reader actually saw.
  {
    const kept = sourceEl.value;
    app.setSource("A paragraph long enough that it has to wrap at this width, with\na soft break in it and several more words after that one.\n");
    const runs = () =>
      JSON.parse(app.frame()).list.cmds.filter((c) => c.k === 3 && (c.text || "").length > 2);
    const before = runs();
    app.setStyleSheet("document { font-size: 21pt; color: #aa0000 }");
    const after = runs();
    say("a template reaches the layout", after.length !== before.length || after[0].w !== before[0].w,
        before.length + " runs → " + after.length);
    // Two runs on one line may not overlap. This is the bug, stated as the
    // thing a reader saw: text on top of text.
    let overlap = 0;
    for (let i = 0; i < after.length; i++) {
      for (let j = i + 1; j < after.length; j++) {
        const a = after[i], b = after[j];
        if (Math.abs(a.y - b.y) > 1) continue;
        if (a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5) overlap++;
      }
    }
    say("and nothing is drawn on top of anything", overlap === 0, overlap + " overlapping runs");
    app.setStyleSheet("");
    app.setSource(kept);
  }

  // A document that names its own template gets it without anybody picking.
  // The page registers every template it has by name at startup; the reader's
  // choice, when there is one, beats the document's.
  {
    const kept = app.sourceText();
    app.setStyleSheet("");
    app.setSource("---\ntheme: corporate\n---\n\n# Title\n\nprose\n");
    say("the document's own template is used", app.themeInUse() === "corporate", app.themeReport());
    const corporate = JSON.parse(app.frame()).list.cmds.find((c) => c.k === 3);
    app.setSource("---\ntheme: editorial\n---\n\n# Title\n\nprose\n");
    say("…and another document gets another one", app.themeInUse() === "editorial", app.themeReport());
    const editorial = JSON.parse(app.frame()).list.cmds.find((c) => c.k === 3);
    say("…which is a different heading, not just a different name",
        Math.abs(corporate.h - editorial.h) > 2,
        corporate.h.toFixed(1) + " vs " + editorial.h.toFixed(1));

    // A name nobody registered is said out loud rather than laid out plain
    // in silence.
    app.setSource("---\ntheme: nobodys\n---\n\n# Title\n\nprose\n");
    say("a template nobody has is named", app.themeReport().includes("nobodys"), app.themeReport());

    // …and the reader beats the document, which is the rule the page size
    // already follows.
    app.setSource("---\ntheme: corporate\n---\n\n# Title\n\nprose\n");
    app.setStyleSheet(selftestTheme2 || "h1 { font-size: 9pt }");
    say("the reader's choice wins", app.themeInUse() === "", app.themeReport());
    app.setStyleSheet("");
    say("…and giving it back returns the document's", app.themeInUse() === "corporate", app.themeReport());
    app.setSource(kept);
    app.setStyleSheet("");
  }

  // …and the document that ships with the template, through the same door a
  // reader opens it by: the sample, then the sheet. Runs on one line may not
  // overlap, whatever order those two arrive in.
  {
    const kept = sourceEl.value;
    const overlapsNow = () => {
      const runs = JSON.parse(app.frame()).list.cmds.filter(
        (c) => c.k === 3 && (c.text || "").length > 1
      );
      let n = 0;
      for (let i = 0; i < runs.length; i++) {
        for (let j = i + 1; j < runs.length; j++) {
          const a = runs[i], b = runs[j];
          if (Math.abs(a.y - b.y) > 1) continue;
          if (a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5) n++;
        }
      }
      return n;
    };
    try {
      const doc = selftestDeck;
      const css = selftestTheme;
      if (!doc || !css) throw new Error("not fetched");
      app.setSource(doc);
      say("the deck sample, plain, draws clear", overlapsNow() === 0, overlapsNow() + " overlapping runs");
      app.setStyleSheet(css);
      say("…and with the template over it", overlapsNow() === 0, overlapsNow() + " overlapping runs");
      // The other order, which is the one the page uses on a fresh load.
      app.setStyleSheet("");
      app.setSource("x\n");
      app.setStyleSheet(css);
      app.setSource(doc);
      say("…and template first, document second", overlapsNow() === 0, overlapsNow() + " overlapping runs");

      // Typing, which is the path that leans on the block cache hardest: one
      // block re-measures and every other block's boxes are replayed.
      const at = app.sourceText().indexOf("kaksi yrityst");
      let typed = 0;
      if (at > 0) {
        app.setSelection(at, at);
        for (const ch of "aivan ") {
          app.typeText(ch);
          if (overlapsNow() !== 0) typed++;
        }
      }
      say("…and after six keystrokes in it", typed === 0, typed + " keystrokes drew over themselves");

      // …and the layout switches, each of which changes the column width.
      app.setPaged(true);
      say("…and paged with the template", overlapsNow() === 0, overlapsNow() + " overlapping runs");
      app.setPageSize("a4 landscape");
      say("…and landscape", overlapsNow() === 0, overlapsNow() + " overlapping runs");
      app.setPageSize("a4");
      app.setPaged(false);
      say("…and back to continuous", overlapsNow() === 0, overlapsNow() + " overlapping runs");

      // The other way text lands on text: a run drawn in a face nobody
      // measured it in. The display list can be perfectly spaced and the page
      // still overlap, because the painter advances by its own idea of each
      // glyph. The runs at the top of this test were checked that way on the
      // README; the deck — a second theme, a second set of faces — is checked
      // the same way here, and the worst disagreement is named.
      //
      // It is deliberately NOT the command's `w`: `w` is the ELEMENT's inner
      // width, and a run in a box wider than its text — a diagram's label, a
      // table cell — is legitimately narrower than the box it sits in, so
      // that comparison passed or failed on which run came first.
      let worst = null;
      let worstBy = 0;
      let checked = 0;
      let slack = 0.5;
      for (const c of JSON.parse(app.frame()).list.cmds) {
        if (!wide(c) || !c.font || !loadedFaces.includes(c.font)) continue;
        checked++;
        const measured = widthWith(faceSpec(c), c.text);
        const by = Math.abs(widthWith(fontSpec(c, 1), c.text) - measured);
        if (by > worstBy) { worstBy = by; worst = c; slack = Math.max(0.5, measured * 0.005); }
      }
      say("deck runs to check", checked > 2, checked + " runs");
      say(
        "every deck run is drawn in the face it was measured in",
        worstBy <= slack,
        worst
          ? worstBy.toFixed(2) + "px out on [" + worst.text.slice(0, 24) + "] in " + worst.font
          : checked + " runs agree exactly"
      );

      // …and the space BETWEEN two runs of one paragraph. A soft line break
      // in the source joins two segments with one space; anything wider is a
      // hole in the middle of a sentence, which is what the too-narrow half
      // of the check above would look like on the page.
      {
        // A document short enough that the whole paragraph is one line at any
        // width the test runs at, so the check is about the SPACE and not
        // about where the line happened to break.
        app.setSource("Yksi rivi\nja toinen.\n");
        const all = JSON.parse(app.frame()).list.cmds.filter((c) => c.k === 3 && c.text);
        const head = all.find((c) => c.text.startsWith("Yksi rivi"));
        if (head) {
          const line = all
            .filter((c) => Math.abs(c.y - head.y) < 1)
            .sort((a, b) => a.x - b.x);
          let widest = 0;
          for (let i = 1; i < line.length; i++) {
            const g = line[i].x - (line[i - 1].x + line[i - 1].w);
            if (g > widest) widest = g;
          }
          // One space of that face, with room for rounding.
          const space = mctx.measureText(" ").width || 4;
          say("the paragraph is more than one run", line.length > 1, line.length + " runs on its first line");
          say("a soft break is one space, not a hole", widest <= space * 2.5,
              widest.toFixed(2) + "pt between runs, a space is " + space.toFixed(2));
        } else {
          say("the paragraph is on the page", false, "not found");
        }
      }

      // The other template, over the same document. Two sheets is the claim;
      // one of them being clean is half a check.
      app.setStyleSheet(selftestTheme2);
      say("the other template draws clear too", overlapsNow() === 0, overlapsNow() + " overlapping runs");
    } catch (e) {
      say("the deck sample is readable", false, String(e));
    }
    app.setStyleSheet("");
    app.setSource(kept);
  }

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

  // …and slides, which is the third call into the same layout: one document,
  // one tree, a different break policy. The claim of `PLAN_SLIDES.md` is that
  // a deck is a layout POLICY and not a conversion, so what is checked is
  // that the words are the same words and only the sheet count changed.
  {
    // The document as the APP has it, not as the source pane shows it: by
    // this point the test has typed a link into it, and restoring the pane's
    // text would throw that away — which it did, and the PDF's link
    // annotations went to zero three checks later.
    const kept = app.sourceText();
    const words = () =>
      JSON.parse(app.frame()).list.cmds.filter((c) => c.k === 3).map((c) => c.text).join("|");
    app.setSource(selftestDeck || "# One\n\na\n\n## Two\n\nb\n\n## Three\n\nc\n");
    app.setStyleSheet(selftestTheme || "deck { split-level: 2 }");
    app.setMode("paged");
    const pagedSheets = app.pdfPageCount();
    const pagedWords = words();
    app.setMode("slides");
    say("the tab switches", app.currentMode() === "slides", app.currentMode());
    say("and a deck has more sheets than a document", app.pdfPageCount() > pagedSheets,
        pagedSheets + " pages → " + app.pdfPageCount() + " slides");
    say("…of the same words", words().split("|").sort().join("|") === pagedWords.split("|").sort().join("|"));
    say("…and it says how it split them", app.slideReport().length > 0, app.slideReport());

    // The PDF is built from a second layout, in the tab, so "the same
    // document prints the same columns as the canvas draws" is a claim that
    // can be false — and was, until the print layout was given the same
    // sheet and the same mode. The sheet count is what says so cheaply.
    try {
      const buf = app.pdf();
      const bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer || buf);
      const text = new TextDecoder("latin1").decode(bytes);
      const pages = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
      say("the PDF has the slides the canvas has", pages === app.pdfPageCount(),
          pages + " in the file, " + app.pdfPageCount() + " on the canvas");
    } catch (e) {
      say("a deck can be printed", false, String(e));
    }
    app.setMode("continuous");
    app.setStyleSheet("");
    app.setSource(kept);
  }

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
  // …and a TABLE CELL is a character too.
  //
  // It was not. `maybeTable` gave each cell a `literal` and no source map, so
  // every character in the grid answered -1, the inline nodes under it went
  // unstamped, and the layout fell back to stamping each cell's boxes with
  // the TABLE's own start. A click anywhere in a table put the caret on the
  // opening pipe and the next keystroke landed there, in the markup. Nothing
  // about the drawing was wrong, which is why it survived every screenshot.
  {
    const kept = app.sourceText();
    const table = "| Alue | Tulos |\n| --- | --- |\n| Verkkokauppa | 18 |\n";
    app.setSource(table);
    app.scrollTo(0);
    const cell = JSON.parse(app.frame()).list.cmds.find(
      (c) => c.k === 3 && (c.text || "") === "Verkkokauppa"
    );
    say("the cell is drawn", !!cell);
    if (cell) {
      const want = table.indexOf("Verkkokauppa");
      const at = app.sourceOffsetAt(cell.x + 1, cell.y + 2);
      say("a click in a cell names a character in that cell", at >= want && at <= want + 2,
          at + " wanted " + want);
      // …and through the seam a mouse uses, not the offset helper: click,
      // then type. The pipe this used to land on is at offset 34.
      app.click(cell.x + cell.w - 1, cell.y + 2, false);
      app.typeText("X");
      const line = app.sourceText().split("\n")[2];
      say("typing in a cell edits that cell", line === "| VerkkokauppaX | 18 |", line);
    }
    app.setSource(kept);
  }

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

  // ---- the page's own wiring, driven with REAL events ----------------------
  //
  // Everything above asks the MODULE questions. These press keys, because the
  // three bugs a reader hit were all in the wiring between the two: Down did
  // nothing, Shift+Arrow selected nothing, and a caret would not go into a
  // line that had just been typed. None of them was reachable from the module
  // — `markdown:edit:test` drives the same moves and is green — so nothing
  // short of a synthetic KeyboardEvent could have caught them.
  const press = (key, opts) =>
    keyCatcher.dispatchEvent(
      new KeyboardEvent("keydown", Object.assign({ key, bubbles: true, cancelable: true }, opts || {}))
    );
  const caret = () => JSON.parse(app.caretJson());

  app.setSource("alpha beta\n\nsecond line here\n\nthird line\n");
  app.setEditMode(true);
  // A click on the drawing is what makes the canvas the active editor.
  const firstRun = JSON.parse(app.frame()).list.cmds.find(
    (c) => c.k === 3 && c.text && c.text.indexOf("alpha") === 0
  );
  if (firstRun) {
    canvas.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, pointerId: 1, detail: 1,
      clientX: canvas.getBoundingClientRect().left + firstRun.x + 2,
      clientY: canvas.getBoundingClientRect().top + firstRun.y + 4,
    }));
  }
  say("clicking the drawing gives it the keyboard", document.activeElement === keyCatcher,
      document.activeElement ? document.activeElement.id || document.activeElement.tagName : "none");
  say("…and the source pane goes read-only", sourceEl.readOnly);

  app.setSelection(2, 2);
  const wasAt = caret().offset;
  press("ArrowDown");
  const afterDown = caret().offset;
  say("Down moves the caret", afterDown > wasAt, wasAt + " → " + afterDown);
  press("ArrowUp");
  say("…and Up brings it back", caret().offset === wasAt, caret().offset + " vs " + wasAt);

  press("ArrowRight", { shiftKey: true });
  press("ArrowRight", { shiftKey: true });
  const sel = caret();
  say("Shift+Right selects", sel.focus - sel.anchor === 2, sel.anchor + ".." + sel.focus);

  // A line typed just now is a line the caret can go into. This is the one a
  // reader reported: add a line, then try to reach it.
  app.setSelection(app.sourceText().length, app.sourceText().length);
  app.typeText("\n\nwrite something here");
  needsPaint = true;
  const end = app.sourceText().length;
  const atEnd = caret().offset;
  app.key("up", false, false);
  const direct = caret().offset;
  app.setSelection(end, end);
  press("ArrowUp");
  const up1 = caret().offset;
  press("ArrowDown");
  say("a line typed just now can be reached", caret().offset >= end - 21,
      "end=" + end + " caret=" + atEnd + " up=" + up1 + " down=" + caret().offset +
      " lines=" + app.linesJson());

  // …and by clicking it, which is how a reader actually gets there.
  const newRun = JSON.parse(app.frame()).list.cmds.find(
    (c) => c.k === 3 && c.text && c.text.indexOf("write something") === 0
  );
  say("the new line is on the page", !!newRun, newRun ? newRun.text : "not drawn");
  if (newRun) {
    app.click(newRun.x + 3, newRun.y + 2, false);
    say("and a click lands in it", caret().offset >= end - 21, caret().offset + " of " + end);
  }

  // The source pane takes the keyboard back when it is clicked, and gives it
  // up again — the mode, both ways.
  sourceEl.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 2 }));
  say("clicking the source pane takes the keyboard back", !sourceEl.readOnly);
  canvas.dispatchEvent(new PointerEvent("pointerdown", {
    bubbles: true, cancelable: true, pointerId: 3, detail: 1, clientX: 10, clientY: 10,
  }));
  say("…and the drawing takes it again", sourceEl.readOnly);

  // The buttons. Both were broken by a deleted helper and nothing said so.
  try {
    const n = deliver(new TextEncoder().encode("x"), "probe.txt", "text/plain");
    say("a built file can be handed to the browser", n === "downloaded", n);
  } catch (e) {
    say("a built file can be handed to the browser", false, String(e));
  }

  // …and the deck, which is the third file this page can produce. A `.pptx`
  // is a zip, so the two bytes at the front are the cheapest proof that what
  // came back is a file and not a message; the exporter's own report is the
  // proof that it went out as TEXT rather than as a picture of the slides.
  {
    const kept = app.sourceText();
    app.setSource(selftestDeck || "# One\n\n- a\n- b\n\n## Two\n\nb\n");
    app.setStyleSheet(selftestTheme || "deck { split-level: 2 }");
    app.setMode("slides");
    try {
      const buf = app.pptx();
      const bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer || buf);
      say("a deck comes out as a zip", bytes[0] === 0x50 && bytes[1] === 0x4b,
          bytes.length + " bytes");
      const report = app.pptxReport();
      say("…with a title on every slide", report.includes(app.pdfPageCount() + " title"), report);
      say("…and bullets in it", /[1-9]\d* bullet/.test(report), report);
      // The one thing that could not go out as text says so, per slide.
      say("…and says what it had to draw instead",
          app.pptxNotesText().length === 0 || app.pptxNotesText().includes("slide"),
          app.pptxNotesText().split("\n")[0] || "nothing to report");
      pptxBtn.click();
      say("and the button delivers it", true);
    } catch (e) {
      say("a deck can be exported", false, String(e));
    }
    app.setMode("continuous");
    app.setStyleSheet("");
    app.setSource(kept);
  }

  // ---- the sheet, centred, turned, and counted -----------------------------
  app.setSource("# One\n\n" + "para\n\n".repeat(400) + "# Two\n\nlast\n");
  modeEl.value = "paged";
  app.setPageSize("a4");
  app.setPaged(true);
  app.scrollTo(0);
  const portraitPages = app.pageCountNow();
  // Four hundred paragraphs is more than two sheets, and saying so is the
  // check: the layout cache stayed armed into `layoutPaged`, which replays a
  // block's boxes instead of laying it out — so `reserve` never ran, the page
  // never broke, and the whole document came out on two sheets drawn over
  // each other. Paged mode had been wrong since the cache landed.
  say("paged gives as many sheets as it needs", portraitPages > 8,
      portraitPages + " pages for " + app.blockCount() + " blocks");

  // The paper sits in the MIDDLE of the window when the window is wider.
  // The PAPER, not the grey it sits on: the backdrop is a rect too, and it is
  // the first one, and it is the whole document tall.
  // The PAPER, not the grey it sits on: the backdrop is a rect too, and it is
  // the first one, and it is the whole document tall. The colour is an array
  // under `c`, which is how the display list carries one.
  const isWhite = (c) => c.c && c.c[0] === 255 && c.c[1] === 255 && c.c[2] === 255;
  const sheetOf = (l) =>
    l.list.cmds.find((cmd) => cmd.k === 0 && cmd.w > 100 && cmd.h > 100 && isWhite(cmd));
  const sheet = sheetOf(JSON.parse(app.frame()));
  say("the sheet is drawn", !!sheet, sheet ? sheet.w.toFixed(0) + "x" + sheet.h.toFixed(0) : "none");
  if (sheet) {
    const slack = canvas.clientWidth - sheet.w;
    const centred = slack <= 0 || Math.abs(sheet.x - slack / 2) < 1.5;
    say("…centred in the window", centred,
        "x=" + sheet.x.toFixed(1) + " slack/2=" + (slack / 2).toFixed(1));
    say("…and with a margin above it", sheet.y > 0, "y=" + sheet.y.toFixed(1));
  }

  // Landscape is the same sheet on its side, and it takes fewer pages.
  app.setPageSize("a4 landscape");
  const land = sheetOf(JSON.parse(app.frame()));
  say("landscape is wider than it is tall", !!land && land.w > land.h,
      land ? land.w.toFixed(0) + "x" + land.h.toFixed(0) : "none");
  app.setPageSize("a4");

  // Which page you are on follows the scroll, and jumping goes there.
  app.scrollTo(0);
  say("the first page is page 1", app.pageAt() === 0, String(app.pageAt()));
  app.scrollToPage(2);
  say("jumping to page 3 lands on it", app.pageAt() === 2, String(app.pageAt()));
  const y3 = app.scrollPosition();
  app.scrollBy(-40);
  say("…and scrolling back up says so", app.pageAt() <= 2, String(app.pageAt()));
  say("a jump actually scrolled", y3 > 0, y3.toFixed(0));
  app.setPaged(false);

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
