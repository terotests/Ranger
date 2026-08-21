/**
 * The book editor with nothing behind it.
 *
 * `book_web.js` is the editor — BookApp, the flow engine, the preflight
 * checks — compiled from Ranger to JavaScript and loaded into the page. This
 * file is the host: it hands over the font faces and the photographs (a
 * browser cannot read files, so they are fetched), forwards pointer and key
 * events, and draws the display list the editor hands back through WebGL 2.
 *
 * There is no server. A pointer move does not cross a network; it is a
 * function call, and the next frame is drawn from the list that call produced.
 */
import { renderDisplayList, loadImages } from "./gl/evg-webgl.js";

const canvas = document.getElementById("view");
const metaEl = document.getElementById("meta");
const stateEl = document.getElementById("state");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const selftestEl = document.getElementById("selftest");
const SELFTEST = new URLSearchParams(location.search).has("selftest");

const gl = canvas.getContext("webgl2", {
  antialias: true,
  premultipliedAlpha: false,
  stencil: true,
});
if (!gl) {
  metaEl.textContent = "WebGL 2 not available";
  throw new Error("WebGL 2 required");
}

/** An ArrayBuffer as the thing Ranger's `buffer` type is: it carries a DataView. */
function asRangerBuffer(ab) {
  ab._view = new DataView(ab);
  return ab;
}
async function fetchBuffer(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("could not fetch " + url);
  return asRangerBuffer(await res.arrayBuffer());
}

const web = new globalThis.BookWeb();
web.start(1180, 800);

const FACES = [
  "OpenSans-Regular.ttf",
  "OpenSans-Bold.ttf",
  "OpenSans-Italic.ttf",
  "OpenSans-BoldItalic.ttf",
  "Cinzel-Regular.ttf",
  "Cinzel-Bold.ttf",
  "JosefinSans-Regular.ttf",
  "JosefinSans-Bold.ttf",
];
// The families beyond the default one. A face is registered under the name in
// its own file; this is how the layout learns it may measure with it.
const FAMILIES = ["Cinzel", "Josefin Sans"];

/**
 * Textures, kept between frames.
 *
 * `loadImages` builds an `Image` per source every time it is called, and this
 * page redraws on every pointer move — re-decoding three photographs per
 * mouse-move is the difference between a drag that follows the cursor and one
 * that lurches. So the sources are diffed and only new ones are fetched.
 */
const texCache = new Map();

async function texturesFor(doc) {
  const srcs = new Set(
    (doc.list?.cmds || []).filter((c) => c.k === 2 && c.src).map((c) => c.src)
  );
  const missing = [...srcs].filter((s) => !texCache.has(s));
  if (missing.length) {
    const fresh = await loadImages({ list: { cmds: missing.map((src) => ({ k: 2, src })) } }, { base: "./" });
    for (const [k, v] of fresh) texCache.set(k, v);
  }
  return texCache;
}

async function boot() {
  const stamp = new URLSearchParams(location.search).get("v") || "";
  const q = stamp ? "?v=" + stamp : "";
  // Faces first: the flow engine measures with them, and a book laid out with
  // guessed widths and drawn with real ones breaks in different places.
  // The FIRST face goes in as a named family, the rest as bare faces. That is
  // not a style: `addFont` is what tells the renderer it has a real face at
  // all, and without it every measurement falls back to a 3x5 bitmap step —
  // which is narrow enough that nothing ever wraps, so a title runs off the
  // trim while the picture on screen is drawn in the right font by the
  // browser's own atlas. Measuring and painting disagreeing is exactly the
  // failure this stack is built to prevent, and it hides well.
  let first = true;
  for (const face of FACES) {
    const bytes = await fetchBuffer("./fonts/" + face + q);
    if (first) {
      web.addFont("Open Sans", bytes);
      first = false;
    } else {
      web.addFace(bytes);
    }
  }
  for (const fam of FAMILIES) web.noteFamily(fam);
  // The atlas measures with the browser's copy of the same faces; drawing
  // before they arrive rasterizes the first frame in a fallback.
  if (document.fonts && document.fonts.ready) {
    try {
      await Promise.all([
        document.fonts.load('12px "Open Sans"'),
        document.fonts.load('700 12px "Open Sans"'),
        document.fonts.load('12px "Cinzel"'),
        document.fonts.load('12px "Josefin Sans"'),
      ]);
      await document.fonts.ready;
    } catch (_) {
      /* a browser without the API still draws, in its default face */
    }
  }
  web.openSample("assets/");
  // `?spread=N` opens on a given spread, so a screenshot can be of a page with
  // something on it rather than of the title page.
  const wanted = parseInt(new URLSearchParams(location.search).get("spread") || "0", 10);
  for (let i = 0; i < wanted; i++) web.command("nav.next", "");
  if (new URLSearchParams(location.search).has("edit")) web.command("edit.toggle", "");
  const n = web.assetCount();
  for (let i = 0; i < n; i++) {
    const p = web.assetAt(i);
    web.addImage(p, await fetchBuffer("./" + p + q));
  }
  await redraw();
}

async function redraw() {
  const doc = JSON.parse(web.sceneJson());
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cssW = doc.width || 1180;
  const cssH = doc.height || 800;
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  const bw = Math.round(cssW * dpr);
  const bh = Math.round(cssH * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  // The IMAGE commands carry the document's own asset paths, which is what the
  // page fetched them under, so the textures are keyed by the same string.
  const textures = await texturesFor(doc);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.886, 0.871, 0.839, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  renderDisplayList(gl, doc, { dpr, images: textures });
  if (backendEl) backendEl.textContent = "webgl2";
  if (cmdsEl) cmdsEl.textContent = String((doc.list?.cmds || []).length);
  refreshMeta();
}

function refreshMeta() {
  const m = JSON.parse(web.metaJson());
  metaEl.textContent = `${m.title} — ${m.pages} pages, ${m.spreads} spreads`;
  const bits = [];
  bits.push(m.editing ? "editing" : "reading (Ctrl+E)");
  if (m.selected) bits.push(`${m.selected} selected`);
  if (m.overset) bits.push("OVERSET");
  if (m.errors) bits.push(`${m.errors} preflight error(s)`);
  else if (m.warnings) bits.push(`${m.warnings} warning(s)`);
  stateEl.textContent = bits.join("  ·  ");
  stateEl.className = m.overset || m.errors ? "warn" : "";
  return m;
}

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const cssW = parseFloat(canvas.style.width) || 1180;
  const cssH = parseFloat(canvas.style.height) || 800;
  return {
    x: Math.round(((e.clientX - rect.left) / rect.width) * cssW),
    y: Math.round(((e.clientY - rect.top) / rect.height) * cssH),
  };
}

let dragging = false;
canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  dragging = true;
  canvas.focus();
  const p = canvasPoint(e);
  web.pointer(p.x, p.y, true, e.shiftKey, e.ctrlKey || e.metaKey);
  redraw();
});
canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  web.pointer(p.x, p.y, true, e.shiftKey, e.ctrlKey || e.metaKey);
  redraw();
});
canvas.addEventListener("pointerup", (e) => {
  dragging = false;
  const p = canvasPoint(e);
  web.pointer(p.x, p.y, false, e.shiftKey, e.ctrlKey || e.metaKey);
  redraw();
});
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const p = canvasPoint(e);
    web.scroll(e.deltaY > 0 ? -1 : 1, p.x, p.y);
    redraw();
  },
  { passive: false }
);

const KEYS = {
  ArrowLeft: () => web.keyLeft(),
  ArrowRight: () => web.keyRight(),
  ArrowUp: () => web.keyUp(),
  ArrowDown: () => web.keyDown(),
  Home: () => web.keyHome(),
  End: () => web.keyEnd(),
  Escape: () => web.keyEscape(),
  Delete: () => web.keyDelete(),
  Backspace: () => web.keyDelete(),
};
const CHORDS = new Set(["z", "y", "e", "d", "a", "l"]);

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    const c = e.key.toLowerCase();
    if (!CHORDS.has(c)) return;
    e.preventDefault();
    web.chord(c, e.shiftKey);
    redraw();
    return;
  }
  const fn = KEYS[e.key];
  if (!fn) return;
  e.preventDefault();
  web.key(fn(), e.shiftKey);
  redraw();
});

for (const el of document.querySelectorAll("[data-cmd]")) {
  el.addEventListener("click", () => {
    web.command(el.dataset.cmd, el.dataset.arg || "");
    redraw();
  });
}

// The book leaves the page the way it would leave a print shop: as the same
// SVG the command-line demo writes, produced by the same renderer, here.
document.getElementById("save")?.addEventListener("click", () => {
  const m = JSON.parse(web.metaJson());
  const svg = web.spreadSvg(m.spread);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "spread-" + String(m.spread + 1).padStart(3, "0") + ".svg";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});

/** A scripted run of the editor, reported into the DOM for smoke.mjs. */
async function selftest() {
  const results = [];
  const check = (name, ok) => results.push((ok ? "ok " : "FAIL ") + name);
  try {
    const before = JSON.parse(web.metaJson());
    check("the book opened with pages", before.pages > 1);
    check("and more than one spread", before.spreads > 1);
    check("reading, not editing", before.editing === false);

    web.chord("e", false);
    check("Ctrl+E arms editing", JSON.parse(web.metaJson()).editing === true);

    web.command("nav.next", "");
    const turned = JSON.parse(web.metaJson());
    check("the spread turns", turned.spread === before.spread + 1);

    web.chord("a", false);
    const sel = JSON.parse(web.metaJson());
    check("Ctrl+A selects the frames on it", sel.selected > 0);

    web.key(web.keyRight(), true);
    check("an arrow nudges without losing the selection", JSON.parse(web.metaJson()).selected > 0);
    check("and it is undoable", JSON.parse(web.metaJson()).undo === true);

    web.chord("z", false);
    check("Ctrl+Z undoes it", JSON.parse(web.metaJson()).selected === 0);

    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent("pointerdown", {
      clientX: rect.left + rect.width * 0.62,
      clientY: rect.top + rect.height * 0.5,
      bubbles: true, pointerId: 1,
    }));
    canvas.dispatchEvent(new PointerEvent("pointerup", {
      clientX: rect.left + rect.width * 0.62,
      clientY: rect.top + rect.height * 0.5,
      bubbles: true, pointerId: 1,
    }));
    check("a click on the page reaches the editor", JSON.parse(web.metaJson()).selected >= 0);

    // The title is furniture text, wrapped by the engine rather than by the
    // flow, and it is measured with the same faces the page draws with. If it
    // comes back as one long line, the engine is measuring with something else.
    web.command("nav.first", "");
    const titleCmds = (JSON.parse(web.sceneJson())?.list?.cmds || [])
      .filter((c) => c.k === 3 && c.font === "Cinzel");
    check("the title is set in the display face", titleCmds.length > 0);
    check("and it wraps inside the page", titleCmds.length > 1);
    web.command("nav.next", "");
    web.command("nav.next", "");

    const doc = JSON.parse(web.sceneJson());
    const cmds = doc?.list?.cmds || [];
    check("the display list has a spread in it", cmds.length > 50);
    check("with text on it", cmds.some((c) => c.k === 3 && c.text));
    check("and a clipped picture", cmds.some((c) => c.k === 4));

    const svg = web.spreadSvg(1);
    check("a spread can be saved as SVG in the page", svg.startsWith("<svg") && svg.length > 500);
    const pre = web.preflightText();
    check("preflight runs in the page", pre.includes("error(s)"));
  } catch (e) {
    results.push("FAIL threw " + e);
  }
  const passed = results.filter((r) => r.startsWith("ok ")).length;
  selftestEl.textContent = `selftest ${passed}/${results.length} :: ` + results.join(" :: ");
}

boot()
  .then(() => (SELFTEST ? selftest() : null))
  .catch((err) => {
    metaEl.textContent = String(err);
    if (selftestEl) selftestEl.textContent = "selftest 0/1 :: FAIL " + err;
    console.error(err);
  });
