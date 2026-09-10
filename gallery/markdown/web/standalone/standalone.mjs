/**
 * Markdown in a tab.
 *
 *   TYPE    textarea → MarkdownWeb.setSource → parse, lay out, display list
 *   PAINT   MarkdownWeb.frame() → evg-webgl.js                        (here)
 *   PRINT   MarkdownWeb.pdf()   → Blob → the browser saves it         (here)
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

// ---- the source pane ------------------------------------------------------
// Every keystroke re-parses and re-lays out the whole document. That is the
// honest v1: it is fast enough at the sizes this page opens with, and it is
// measured rather than assumed — the status line says how long it took.
let typingTimer = 0;
function onTyped() {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    const t0 = performance.now();
    app.setSource(sourceEl.value);
    const ms = Math.round(performance.now() - t0);
    needsPaint = true;
    showStatus(ms + " ms");
  }, 90);
}
sourceEl.addEventListener("input", onTyped);

// The caret in the source scrolls the drawing to the block it is in. The two
// panes share nothing but the character offsets the parser recorded.
function syncFromCaret() {
  if (!app.ready()) return;
  const y = app.offsetToY(sourceEl.selectionStart | 0);
  app.scrollTo(y - 24);
  needsPaint = true;
}
sourceEl.addEventListener("click", syncFromCaret);
sourceEl.addEventListener("keyup", (ev) => {
  if (ev.key.startsWith("Arrow") || ev.key === "PageUp" || ev.key === "PageDown") syncFromCaret();
});

// ---- the drawing pane -----------------------------------------------------
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

// Dragging the page, and a phone's flick.
let dragging = null;
canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture(ev.pointerId);
  dragging = { y: ev.clientY, at: app.scrollPosition() };
});
canvas.addEventListener("pointermove", (ev) => {
  if (!dragging) return;
  app.scrollTo(dragging.at - (ev.clientY - dragging.y));
  needsPaint = true;
});
function endDrag(ev) {
  if (!dragging) return;
  dragging = null;
  // A click that did not drag is a click: put the caret in the source.
  const r = canvas.getBoundingClientRect();
  const offset = app.sourceOffsetAt(ev.clientX - r.left, ev.clientY - r.top);
  if (offset >= 0) {
    sourceEl.focus({ preventScroll: true });
    sourceEl.setSelectionRange(offset, offset);
  }
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", () => { dragging = null; });

canvas.addEventListener("keydown", (ev) => {
  const [, h] = viewSize();
  const step = { ArrowDown: 60, ArrowUp: -60, PageDown: h - 40, PageUp: -(h - 40) }[ev.key];
  if (step !== undefined) {
    ev.preventDefault();
    app.scrollBy(step);
    needsPaint = true;
  } else if (ev.key === "Home") {
    ev.preventDefault();
    app.scrollTo(0);
    needsPaint = true;
  } else if (ev.key === "End") {
    ev.preventDefault();
    app.scrollTo(1e9);
    needsPaint = true;
  }
});

// ---- out of the tab -------------------------------------------------------
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

let docName = "document";

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
  sourceEl.value = text;
  const t0 = performance.now();
  app.setSource(text);
  const ms = Math.round(performance.now() - t0);
  app.scrollTo(0);
  needsPaint = true;
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
