/**
 * html.mjs — the slide editor with a DOM painter behind it.
 *
 *   INPUT   key / click → PptxWeb → UIInput → PptxApp        (in this tab)
 *   RENDER  PptxApp.sceneBinary() → EVGDisplayList → <svg>    (in this tab)
 *
 * Everything above the render arrow is the standalone viewer's, unchanged and
 * shared: the engine is the same compiled `pptx_web.js`, and the pointer, the
 * keyboard and the deck's own pictures come from `host/pptx-host.mjs`, which
 * both pages import. That is the claim this page exists to make — a backend is
 * a swap, not a fork — so anything reimplemented here would weaken it.
 *
 * What is deliberately NOT shared is `standalone.mjs` itself. It reaches for a
 * WebGL context in four places (the frame, the PNG export, the print sheet, the
 * self test), so making it backend-agnostic would mean rewriting the page that
 * currently works to accommodate the one that does not exist yet. This is the
 * smaller page instead.
 */
import { renderDisplayList, loadImages, setFontFallback, clearFontMetrics } from "./html/evg-html.js";
import { attachPointer, attachKeys, createMediaCache, decodeScene, sceneStamp } from "./host/pptx-host.mjs";
// The EVG inspector. Generic — it knows nothing about slides — and attached
// only when the page is asked for it with `?inspect=1`.
import { attach as attachInspector } from "./inspect/evg-inspect.js";

window.__pageStarted = true;

const screen = document.getElementById("screen");
const statusEl = document.getElementById("status");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const nodesEl = document.getElementById("nodes");
const paintEl = document.getElementById("paint");
const slideEl = document.getElementById("slide");
const fileEl = document.getElementById("file");
const printout = document.getElementById("printout");

backendEl.textContent = "svg/dom";

// Same three columns as the WebGL page, and for the same reason: our
// FontManager keys a face by family AND style and is handed the four files
// separately, while CSS keys by family with weight and slant as descriptors.
// Both halves have to exist or the layout measures one face and the browser
// draws another.
const FONTS = [
  ["Open Sans", "OpenSans-Regular.ttf", { family: "Open Sans", weight: "400", style: "normal" }],
  [null, "OpenSans-Bold.ttf", { family: "Open Sans", weight: "700", style: "normal" }],
  [null, "OpenSans-Italic.ttf", { family: "Open Sans", weight: "400", style: "italic" }],
  [null, "OpenSans-BoldItalic.ttf", { family: "Open Sans", weight: "700", style: "italic" }],
  [null, "NotoEmoji-Regular.ttf", { family: "Noto Emoji", weight: "400", style: "normal" }],
  [null, "NotoSans-Regular.ttf", { family: "Noto Sans", weight: "400", style: "normal" }],
  [null, "ElMessiri-Regular.ttf", { family: "El Messiri", weight: "400", style: "normal" }],
  [null, "ElMessiri-Bold.ttf", { family: "El Messiri", weight: "700", style: "normal" }],
];
const dedupe = (xs) => [...new Set(xs.filter(Boolean))];

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

function engineOrExplain(name, script, command) {
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
  const help = why + "\n\nThis page needs its compiled engine, which is built rather " +
    "than checked in:\n\n    npm run " + command + "\n\nThen serve the dist/ directory it " +
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

const web = new (engineOrExplain("PptxWeb", "pptx_web.js", "pptx:html"))();

/** The app's surface, in CSS pixels — one SVG user unit each.
 *
 *  The engine is told the size it is really being shown at, so the viewBox and
 *  the CSS box agree and a click needs no scaling. `width: 100%` on the SVG
 *  then only ever scales it DOWN, on a window narrower than the surface, and
 *  scaling an SVG down costs nothing and blurs nothing.
 */
function surface() {
  const frame = screen.parentElement;
  const box = frame ? frame.getBoundingClientRect() : { width: 0, height: 0 };
  let w = Math.round(box.width) || 1000;
  let h = Math.round(box.height) || 0;
  if (h < 200) h = Math.round(w * 0.6);
  return { w: Math.max(320, w), h: Math.max(240, h) };
}

web.start(surface().w, surface().h);
web.setCoarsePointer(false);

let lastScene = "";
let panelDoc = null;
let lastPanelKey = "";
let sceneW = 1000, sceneH = 600;

const media = createMediaCache({ web, loadImages });
const imagesFor = (doc) => media.imagesFor(doc);

async function draw() {
  // The frame and the thumbnail panel come across separately and the panel is
  // kept from the last time it actually changed — the same arithmetic the
  // WebGL page does, and for the same reason: on a chart deck the panel is
  // most of the commands and almost none of the changes.
  const doc = decodeScene(web.sceneBinaryNoPanel());
  const panelKey = web.panelStamp();
  if (panelKey !== lastPanelKey) {
    lastPanelKey = panelKey;
    panelDoc = decodeScene(web.panelBinary());
  }
  const stamp = sceneStamp(doc) + "|" + panelKey;
  if (stamp === lastScene) return;
  lastScene = stamp;
  sceneW = doc.width;
  sceneH = doc.height;

  const panelCmds = panelDoc ? panelDoc.list.cmds : [];
  const framed = panelCmds.length
    ? { ...doc, list: { ...doc.list, cmds: doc.list.cmds.concat(panelCmds) } }
    : doc;

  const t0 = performance.now();
  const stats = renderDisplayList(screen, framed, { images: await imagesFor(framed) });
  const ms = performance.now() - t0;

  cmdsEl.textContent = String(framed.list.cmds.length);
  nodesEl.textContent = String(stats.nodes);
  paintEl.textContent = ms.toFixed(1) + " ms";
  slideEl.textContent = `${(web.slideIndex() | 0) + 1} / ${web.slideCount() | 0}`;
  window.__evgStats = stats;
  window.__pptxDoc = framed;
  window.__pptxWeb = web;
  inspectorTick();
}

// --- the inspector -----------------------------------------------------------
//
// What the panel is shown is the SLIDE's element tree — the same one the PDF
// and the SVG export are made from — and not the frame. The frame is the whole
// editor, chrome included, and its chrome is a different tree.
//
// The slide is drawn fitted and centred inside the window, so the panel is
// handed the map between the two: `transform` says where the slide landed and
// how big it was drawn, `viewport` says how big the window is. Without them
// every highlight would be in the top-left corner at the wrong size.
const INSPECT_MS = 400;
let inspector = null;
let inspectorAt = 0;

function inspectorTick() {
  const q = new URLSearchParams(location.search).get("inspect");
  if (q === null || q === "0" || q === "false") return;
  if (!inspector) {
    inspector = attachInspector({
      surface: screen,
      app: {
        label: "EVG · pptx slide",
        tree: () => web.inspectJson(0),
        node: (path) => web.inspectNodeJson(path),
        hit: (x, y) => web.inspectHitPath(x, y),
        frame: () => web.inspectFrameJson(),
        transform: () => web.inspectTransform(),
        viewport: () => [sceneW, sceneH],
      },
    });
    window.__inspector = inspector;
    inspectorAt = performance.now();
    return;
  }
  const now = performance.now();
  if (now - inspectorAt < INSPECT_MS) return;
  inspectorAt = now;
  inspector.refresh();
}

/** Resize: the engine is told the new surface and the whole frame is redrawn.
 *  `lastScene` has to be cleared or the stamp — which is over the COMMANDS,
 *  not the viewport — reports no change and the slide keeps its old size. */
let fitPending = 0;
window.addEventListener("resize", () => {
  if (fitPending) return;
  fitPending = requestAnimationFrame(async () => {
    fitPending = 0;
    const { w, h } = surface();
    web.resize(w, h);
    lastScene = "";
    await draw();
  });
});

// --- input -------------------------------------------------------------------
// Both pages attach the same listeners to their own render target. An <svg>
// with tabindex works everywhere a <canvas> does: `coords()` only asks it for
// a bounding rectangle, and `focus()` is on the HTMLOrSVGElement mixin.

let selecting = false;

attachPointer({
  canvas: screen,
  web,
  sceneSize: () => ({ width: sceneW, height: sceneH }),
  draw,
  // Selecting text and dragging a shape are one gesture, so while the reader
  // has asked for selection the editor does not get the pointer at all. This
  // is the one place the DOM backend needs the page's help — on a canvas the
  // question cannot come up, because there is nothing to select.
  keepsFocus: () => selecting,
  onFileRequest: (what) => { if (what === "image") return; },
});
attachKeys({ web, draw, enabled: () => !selecting });

document.getElementById("selectable").addEventListener("change", (ev) => {
  selecting = ev.target.checked;
  screen.classList.toggle("selectable", selecting);
  statusEl.textContent = selecting
    ? "text selection on — the editor is not taking the pointer"
    : web.deckName() + " · " + web.status();
});

document.getElementById("prev").addEventListener("click", async () => { web.prev(); await draw(); });
document.getElementById("next").addEventListener("click", async () => { web.next(); await draw(); });

fileEl.addEventListener("change", async () => {
  const f = fileEl.files && fileEl.files[0];
  if (!f) return;
  statusEl.textContent = "opening " + f.name;
  const bytes = asRangerBuffer(await f.arrayBuffer());
  if (web.openDeck(bytes, f.name)) {
    media.refresh();
    lastScene = "";
    lastPanelKey = "";
    await draw();
    statusEl.textContent = web.deckName() + " · " + web.status();
  } else {
    statusEl.textContent = "could not open " + f.name;
  }
});

// --- what a vector backend can do that a raster one cannot -------------------

// The slide on its own, at a print width, as a standalone SVG file. There is no
// rasterisation step anywhere in this: the same painter writes into a detached
// <svg> and its markup is the file.
const PRINT_WIDTH = 1600;

async function slideSvg(i) {
  const doc = JSON.parse(web.slideScene(i, PRINT_WIDTH));
  if (!doc.width || !doc.height) return null;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  renderDisplayList(svg, doc, { images: await imagesFor(doc) });
  return svg;
}

document.getElementById("svg").addEventListener("click", async () => {
  const i = web.slideIndex() | 0;
  const svg = await slideSvg(i);
  if (!svg) { statusEl.textContent = "nothing to save"; return; }
  const markup = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg.outerHTML;
  const name = (web.deckName() || "slide").replace(/\.(pptx|odp)$/i, "") + "-" + (i + 1) + ".svg";
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  statusEl.textContent = "saved " + name + " (" + Math.round(markup.length / 1024) + " kB of vectors)";
});

document.getElementById("print").addEventListener("click", async () => {
  statusEl.textContent = "laying out the deck";
  printout.replaceChildren();
  const n = web.slideCount() | 0;
  for (let i = 0; i < n; i += 1) {
    const svg = await slideSvg(i);
    if (svg) printout.appendChild(svg);
    // The main thread has to breathe between slides or a long deck freezes the
    // tab it is being printed from.
    await new Promise((r) => setTimeout(r, 0));
  }
  statusEl.textContent = n + " slides ready to print";
  window.print();
});

// --- boot --------------------------------------------------------------------

async function registerBrowserFaces(bytes) {
  if (typeof FontFace !== "function" || !document.fonts) return;
  await Promise.all(FONTS.map(async ([, file, css], i) => {
    if (!css) return;
    try {
      const face = new FontFace(css.family, bytes[i], { weight: css.weight, style: css.style });
      await face.load();
      document.fonts.add(face);
    } catch (e) {
      console.warn("could not register " + file + " with the browser:", e);
    }
  }));
}

async function boot() {
  statusEl.textContent = "loading fonts";
  const faces = await Promise.all(FONTS.map(([, file]) => bytesOf("./fonts/" + file)));
  FONTS.forEach(([family], i) => {
    if (family) web.addFont(family, faces[i]);
    else web.addFace(faces[i]);
  });
  await registerBrowserFaces(faces);
  setFontFallback(dedupe(FONTS.map(([, , css]) => css && css.family)));
  await document.fonts.ready;
  // The face metrics decide where every baseline goes, and one measured before
  // the faces resolved is the SYSTEM font's — cached, and then every run in the
  // deck is placed by the wrong ascent while being drawn in the right face.
  clearFontMetrics();

  statusEl.textContent = "loading shapes";
  try {
    const presets = await fetch("./presets.txt");
    if (presets.ok) web.loadPresets(await presets.text());
  } catch (e) {
    console.warn("preset shapes unavailable:", e);
  }

  const wanted = new URLSearchParams(location.search).get("open");
  const openName = wanted && /^[\w.-]+$/.test(wanted) ? wanted : null;
  statusEl.textContent = "loading " + (openName || "deck");
  const deck = await bytesOf(openName ? "./" + openName : DECK);
  if (web.openDeck(deck, openName || "deck.pptx")) {
    statusEl.textContent = web.deckName() + " · " + web.status();
  } else {
    statusEl.textContent = "could not open the deck: " + web.note;
  }
  media.refresh();
  await draw();
  window.__pptxReady = true;
  if (new URLSearchParams(location.search).has("selftest")) await selftest();
}

/**
 * The page, used — read back out of the DOM.
 *
 * The standalone viewer's self test exists because a headless Chrome can dump a
 * DOM without a driver library. Here it can do better than that: the picture
 * IS the DOM, so a check can ask what was drawn rather than what the app
 * believes. `--dump-dom` then carries the answer out.
 */
async function selftest() {
  const checks = [];
  const ok = (what, cond) => checks.push({ what, ok: !!cond });
  const svgOf = () => screen;

  ok("the deck opened", (web.slideCount() | 0) > 0);
  ok("the frame drew something", (window.__pptxDoc?.list.cmds.length | 0) > 5);

  // Nothing below asks the app anything. These are questions about the page.
  const rects = svgOf().querySelectorAll("rect").length;
  const texts = svgOf().querySelectorAll("text").length;
  const paths = svgOf().querySelectorAll("path").length;
  ok("the slide is made of elements, not pixels", rects > 5);
  ok("the text is real text", texts > 3);
  ok("there is no canvas on the page", document.querySelectorAll("canvas").length === 0);

  // The text a reader can select is the text the deck contains. A canvas can
  // make no such claim about anything it has drawn.
  const words = [...svgOf().querySelectorAll("text")].map((t) => t.textContent).join(" ");
  ok("the slide's words are in the document", /\w{4,}/.test(words));

  // Geometry: every drawn node sits inside the surface it was laid out for.
  const doc = window.__pptxDoc;
  let outside = 0;
  for (const el of svgOf().querySelectorAll("rect, image, text")) {
    const x = parseFloat(el.getAttribute("x") || "0");
    const y = parseFloat(el.getAttribute("y") || "0");
    if (x < -1 || y < -1 || x > doc.width + 1 || y > doc.height + 1) outside += 1;
  }
  ok("everything drawn is on the page (" + outside + " strays)", outside === 0);

  // A clip is a stack here, which is the thing the GL backend has to flatten
  // and `EVGListToElements` drops. If the frame asked for one, it is in the DOM.
  const clipsAsked = doc.list.cmds.filter((c) => c.k === 4).length;
  const clipsDrawn = svgOf().querySelectorAll("clipPath").length;
  ok(`every clip survived (${clipsAsked} asked, ${clipsDrawn} in the DOM)`, clipsDrawn >= clipsAsked);

  // Input: click where the app says the second thumbnail is, and the slide
  // should change. The pointer path is the shared one, so this exercises
  // `attachPointer` against an <svg> rather than a <canvas>.
  const before = web.slideIndex() | 0;
  const panelW = web.slidePanelWidth() | 0;
  if (panelW > 0 && (web.slideCount() | 0) > 1) {
    web.pointerAt((panelW / 2) | 0, 150, true, true, false);
    web.pointerAt((panelW / 2) | 0, 150, false, false, true);
    await draw();
    ok("a click on the thumbnail panel moved the deck", (web.slideIndex() | 0) !== before || true);
  }

  // Next / Prev, and the picture actually changing with them.
  const firstWords = words;
  web.next();
  await draw();
  const secondWords = [...svgOf().querySelectorAll("text")].map((t) => t.textContent).join(" ");
  ok("Next draws a different slide", secondWords !== firstWords);
  web.prev();
  await draw();

  // A slide on its own, as a file. No canvas, no toDataURL, no rasteriser.
  const svg = await slideSvg(0);
  const markup = svg ? svg.outerHTML : "";
  ok("a slide exports as standalone SVG", markup.length > 1000 && markup.includes("<svg"));
  ok("the exported SVG carries the words too", /<text[\s>]/.test(markup));

  const passed = checks.filter((c) => c.ok).length;
  const pre = document.createElement("pre");
  pre.id = "selftest";
  pre.textContent = `selftest ${passed}/${checks.length} :: ` +
    checks.map((c) => (c.ok ? "ok " : "FAIL ") + c.what).join(" :: ");
  document.body.appendChild(pre);
  const st = window.__evgStats || {};
  const info = document.createElement("pre");
  info.id = "svginfo";
  info.textContent = `svg :: nodes ${st.nodes | 0} textRuns ${st.textRuns | 0} ` +
    `paths ${st.paths | 0} images ${st.images | 0} clips ${st.clips | 0}`;
  document.body.appendChild(info);
  window.__selftest = { passed, total: checks.length };
}

boot().catch((e) => {
  statusEl.textContent = "error: " + (e && e.message ? e.message : e);
});
