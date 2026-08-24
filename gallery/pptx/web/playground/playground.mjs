/**
 * playground.mjs — run the reader's code against the published API, then open
 * what it produced in the editor beside it.
 *
 * The round trip is the point. The code on the left calls `PptxApi` and ends
 * with a deck; the page takes `deck.save()` — the actual .pptx bytes, ZIP and
 * all — and hands them to `PptxWeb.openDeck`, which is the standalone viewer
 * unchanged. So the picture on the right is not a preview of the model in
 * memory: it is the file, parsed back from bytes, drawn by the editor. A bug
 * in the writer shows up here as a wrong slide rather than as a correct
 * preview and a broken download.
 *
 * Both halves are in one bundle (`pptx_playground.rgr`) for the same reason:
 * a page that generated with one copy of the code and drew with another could
 * show a slide no reader would ever get.
 */
import { attachPointer, attachKeys, createMediaCache } from "./host/pptx-host.mjs";
import { renderDisplayList, loadImages, markColoredSlots, verbatim, setFontFallback }
  from "./gl/evg-webgl.js";

const $ = (id) => document.getElementById(id);
const canvas = $("screen"), statusEl = $("status");
const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true });
if (!gl) { statusEl.textContent = "WebGL 2 not available"; throw new Error("WebGL 2 required"); }
$("backend").textContent = "webgl2";

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
const dedupe = (list) => [...new Set(list.filter(Boolean))];

/** A Ranger `buffer`: an ArrayBuffer with a DataView hung off it. */
function asRangerBuffer(ab) { ab._view = new DataView(ab); return ab; }
function toRanger(bytes) {
  const ab = bytes instanceof ArrayBuffer
    ? bytes
    : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return asRangerBuffer(ab);
}
const fromRanger = (buf) => new Uint8Array(buf);
async function bytesOf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + " → " + res.status);
  return asRangerBuffer(await res.arrayBuffer());
}

/**
 * The same faces, told to the BROWSER as well as to our own FontManager.
 * The layout measures with ours and the GL backend rasterizes through a 2D
 * canvas; without this the canvas has never heard of the family and draws the
 * system sans at widths nobody measured.
 */
async function registerBrowserFaces(bytes) {
  if (typeof FontFace !== "function" || !document.fonts) return;
  await Promise.all(FONTS.map(async ([, file, css], i) => {
    if (!css) return;
    try {
      const face = new FontFace(css.family, bytes[i], { weight: css.weight, style: css.style });
      await face.load();
      document.fonts.add(face);
    } catch (e) { console.warn("could not register " + file + ":", e); }
  }));
}

const PRESETS = {
  "A title slide": `// The deck is yours to build. \`Pptx\` and \`Renderer\` are in scope.
const deck = Pptx.create();
const slide = deck.addSlide().background("FFFFFF");

slide.addTextBox(70, 150, 820, 110, "Quarterly review")
     .setName("Title")
     .run(0, 0).font("Calibri", 44).bold().color("#1F3864");

slide.addTextBox(70, 265, 820, 60, "Sales, by region")
     .run(0, 0).font("Calibri", 22).color("#5B6B84");

slide.addShape("rect", 70, 340, 300, 8).fill("4472C4").noLine();
return deck;`,

  "Shapes and colour": `const deck = Pptx.create();
const slide = deck.addSlide().background("0E1116");

const shapes = ["star5", "hexagon", "roundRect", "ellipse", "triangle", "heart"];
const colours = ["E8452C", "F0A202", "2CA58D", "4472C4", "8E5BB5", "E8607A"];

shapes.forEach((name, i) => {
  const col = i % 3, row = (i / 3) | 0;
  slide.addShape(name, 90 + col * 270, 90 + row * 210, 200, 170)
       .fill(colours[i])
       .noLine();
});

slide.addTextBox(90, 470, 800, 50, "Six of the 187 preset geometries")
     .run(0, 0).font("Calibri", 20).color("#9FB0C4");
return deck;`,

  "Several slides": `const deck = Pptx.create();

["Problem", "Approach", "Result"].forEach((word, i) => {
  const slide = deck.addSlide().background("FFFFFF");
  slide.addTextBox(80, 90, 800, 90, word)
       .run(0, 0).font("Calibri", 40).bold().color("#1F3864");
  slide.addShape("rect", 80, 200, 60 + i * 260, 26).fill("4472C4").noLine();
  slide.addTextBox(80, 250, 800, 60, "Slide " + (i + 1) + " of 3")
       .run(0, 0).font("Calibri", 18).color("#7A8AA0");
});
return deck;`,

  "A stylesheet, not fluent calls": `// The same slide as the first preset, with the look in a sheet
// instead of on every call. font-* and color inherit down to the
// runs; fill and stroke do not. A fluent call always wins.
const deck = Pptx.create();

deck.addStyleSheet(\`
  slide.review { background-color: #FFFFFF }

  .title {
    font-family: Calibri;
    font-size: 44pt;
    font-weight: bold;
    color: #1F3864;
  }

  .subtitle {
    font-family: Calibri;
    font-size: 22pt;
    color: #5B6B84;
  }

  .divider { fill: #4472C4; stroke: none }
\`);

const slide = deck.addSlide().addClass("review");

slide.addTextBox(70, 150, 820, 110, "Quarterly review")
     .setName("Title")
     .addClass("title");

slide.addTextBox(70, 265, 820, 60, "Sales, by region")
     .addClass("subtitle");

slide.addShape("rect", 70, 340, 300, 8).addClass("divider");

// Inline beats the sheet, !important included.
slide.addShape("rect", 70, 370, 300, 8)
     .addClass("divider")
     .style("fill", "#E8452C");

return deck;`,

  "A Vega chart, as vectors": `// A Vega-Lite specification, compiled and put on the slide as SHAPES.
// No image: every bar below is a DrawingML rectangle in the .pptx the
// editor on the right opened, and the labels are in the slide's text.
const deck = Pptx.create();
const slide = deck.addSlide().background("FFFFFF");

slide.addTextBox(70, 40, 820, 50, "Revenue by quarter")
     .run(0, 0).font("Calibri", 30).bold().color("#1F3864");

const chart = Chart().font("Calibri");
chart.addTo(slide, {
  width: 460, height: 260,
  data: { values: [
    { quarter: "Q1", revenue: 28 },
    { quarter: "Q2", revenue: 55 },
    { quarter: "Q3", revenue: 43 },
    { quarter: "Q4", revenue: 91 },
  ]},
  mark: { type: "bar", color: "#4472C4" },
  encoding: {
    x: { field: "quarter", type: "nominal", title: null },
    y: { field: "revenue", type: "quantitative", title: "M€" },
  },
}, 70, 110, 620, 380);

slide.addTextBox(70, 500, 820, 40, chart.shapeCount + " shapes — not one pixel of image")
     .run(0, 0).font("Calibri", 16).color("#5B6B84");
return deck;`,

  "Right to left": `const deck = Pptx.create();
const slide = deck.addSlide().background("FFFFFF");

slide.addTextBox(80, 120, 800, 90, "مرحبا بالعالم")
     .align("r")
     .run(0, 0).font("Arabic Typesetting", 44).color("#1F3864");

slide.addTextBox(80, 230, 800, 60, "Arabic is shaped and reordered before it is drawn")
     .run(0, 0).font("Calibri", 18).color("#5B6B84");
return deck;`,
};

let web = null, renderer = null, deckBytes = null;
let lastScene = "", slideIndex = 0, slideCount = 0;

function fail(message) {
  statusEl.className = "bad";
  statusEl.textContent = message;
}

/**
 * The editor's own size, in the coordinates the display list uses.
 *
 * A pointer position has to be expressed in these and in nothing else: the
 * canvas is drawn at whatever width the pane happens to be and at whatever
 * device pixel ratio the screen has, and the editor knows about neither.
 */
let sceneW = canvas.width;
let sceneH = canvas.height;
const sceneSize = () => ({ width: sceneW, height: sceneH });

async function draw() {
  if (!web) return;
  const text = web.scene();
  if (text === lastScene) return;
  lastScene = text;
  const doc = JSON.parse(text);
  sceneW = doc.width;
  sceneH = doc.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(doc.width * dpr), h = Math.round(doc.height * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  canvas.style.height = doc.height + "px";
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.055, 0.067, 0.086, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  const images = media ? await media.imagesFor(doc) : new Map();
  renderDisplayList(gl, doc, { dpr, images });
  // Published so the smoke test can ask the app what it thinks is true rather
  // than inferring it from pixels — the same hook the standalone page exposes.
  window.__pptxDoc = doc;
  window.__pptxWeb = web;
}

async function showDeck(bytes) {
  deckBytes = bytes;
  if (!web.openDeck(toRanger(bytes), "playground.pptx")) {
    return fail("the editor could not open the bytes the API produced: " + web.note);
  }
  // The deck's own pictures, straight off the model — nothing is fetched.
  if (media) media.refresh();
  slideCount = web.slideCount() | 0;
  slideIndex = 0;
  web.gotoSlide(0);
  lastScene = "";
  await draw();
  where();
}

/**
 * The chrome, after anything that could have changed what the app is doing.
 *
 * The editor turns its own pages — a click on a thumbnail, Page Down, a
 * command from the toolbar — so the page's slide counter has to follow the
 * APP rather than the other way round. Read from `slideIndex` alone it went
 * stale the first time somebody clicked in the editor rather than on the
 * arrows beside it.
 */
function afterInput() {
  if (!web) return;
  slideCount = web.slideCount() | 0;
  slideIndex = web.slideIndex() | 0;
  where();
}

function where() {
  $("where").textContent = slideCount ? `${slideIndex + 1} / ${slideCount}` : "—";
}

function step(delta) {
  if (!slideCount) return;
  slideIndex = Math.max(0, Math.min(slideCount - 1, slideIndex + delta));
  web.gotoSlide(slideIndex);
  lastScene = "";
  draw();
  where();
}

/**
 * The editor, wired up.
 *
 * Everything here comes from the shared host module, which is also what the
 * standalone viewer at /pptx/ attaches — so the two pages cannot drift into
 * disagreeing about what a click means. This page used to attach NONE of it:
 * it drew the editor, toolbar and all, and listened to nothing, so the pane
 * on the right was a picture of an editor rather than one.
 *
 * The keyboard is the one thing that had to be different. This page has a
 * TEXTAREA beside the canvas, and a listener that sent every keystroke to the
 * deck would make writing code impossible — typing `const` would select all,
 * delete it and put the letters in a shape. So the keys are the deck's only
 * while the canvas has focus, which clicking it gives.
 */
let media = null;
function attachEditor() {
  media = createMediaCache({ web, loadImages });
  attachPointer({ canvas, web, sceneSize, draw, afterInput });
  attachKeys({
    web,
    draw,
    afterInput,
    enabled: () => document.activeElement === canvas,
  });
}

/** Run the reader's code. It returns a Deck; anything else is a mistake worth naming. */
function run() {
  let deck;
  try {
    const fn = new Function("Pptx", "Renderer", "Chart", '"use strict";\n' + $("code").value);
    deck = fn(JsApi, renderer, Chart);
  } catch (err) {
    return fail("the code threw: " + (err && err.message ? err.message : String(err)));
  }
  if (!deck || typeof deck.save !== "function") {
    return fail("the code has to `return` a deck — the last line of every preset does.");
  }
  let bytes;
  try {
    bytes = deck.save();
  } catch (err) {
    return fail("saving the deck failed: " + err.message);
  }
  showDeck(bytes).then(() => {
    statusEl.className = "good";
    statusEl.textContent =
      `${slideCount} slide(s), ${bytes.length.toLocaleString()} bytes — opened from the file, `
      + `not from the model in memory.`;
  });
}

/**
 * The JavaScript shape of the API, over the compiled classes.
 *
 * The npm package's wrapper is the same translation and cannot be imported
 * here: it is CommonJS over the Node bundle. This is the browser's copy of it,
 * and it is deliberately thin — the argument order, the names and the fluency
 * are the facade's, so code written here runs unchanged against the package.
 */
const wrap = (ref, methods, getters) => {
  const o = {};
  for (const m of methods) o[m] = (...a) => { const r = ref[m](...a); return r === ref ? o : r; };
  for (const [name, fn] of Object.entries(getters || {})) {
    Object.defineProperty(o, name, { get: () => fn(ref), enumerable: true });
  }
  return o;
};

function Run(ref) {
  const o = {};
  for (const m of ["setText", "font", "bold", "italic", "color"]) {
    o[m] = (...a) => { ref[m](...a); return o; };
  }
  Object.defineProperty(o, "text", { get: () => ref.text() });
  return o;
}
function Shape(ref) {
  const o = {};
  for (const m of ["setName", "setPreset", "at", "size", "rotate", "fill", "noFill",
                   "line", "noLine", "setText", "align", "setStyleId", "style"]) {
    o[m] = (...a) => { ref[m](...a); return o; };
  }
  o.addClass = (...names) => { for (const n of names) ref.addClass(String(n)); return o; };
  o.removeClass = (...names) => { for (const n of names) ref.removeClass(String(n)); return o; };
  o.hasClass = (name) => ref.hasClass(String(name));
  o.run = (p, i) => Run(ref.runAt(p | 0, i | 0));
  o.addRun = (p, t) => Run(ref.addRun(p | 0, String(t)));
  for (const g of ["name", "preset", "x", "y", "width", "height", "rotation", "text"]) {
    Object.defineProperty(o, g, { get: () => ref[g]() });
  }
  return o;
}
function Slide(ref) {
  const o = {
    // The handle itself, so `Chart.addTo` can reach past the wrapper — the
    // same reason `Deck` carries one.
    _ref: ref,
    shape: (i) => Shape(ref.shapeAt(i | 0)),
    shapeNamed: (n) => { const s = ref.shapeNamed(String(n)); return s.exists() ? Shape(s) : null; },
    addTextBox: (...a) => Shape(ref.addTextBox(...a)),
    addShape: (...a) => Shape(ref.addShape(...a)),
    removeShape: (i) => ref.removeShape(i | 0),
    background: (hex) => { ref.background(String(hex)); return o; },
    addClass: (...names) => { for (const n of names) ref.addClass(String(n)); return o; },
    setStyleId: (id) => { ref.setStyleId(String(id)); return o; },
    style: (name, value) => { ref.style(String(name), String(value)); return o; },
  };
  for (const g of ["width", "height", "shapeCount", "text"]) {
    Object.defineProperty(o, g, { get: () => ref[g]() });
  }
  return o;
}
function Deck(ref) {
  const o = {
    _ref: ref,
    slide: (i) => Slide(ref.slideAt(i | 0)),
    addSlide: () => Slide(ref.addSlide()),
    removeSlide: (i) => ref.removeSlide(i | 0),
    setSize: (w, h) => { ref.setSize(w, h); return o; },
    save: () => fromRanger(ref.save()),
    saveNew: () => fromRanger(ref.saveNew()),
    addStyleSheet: (css) => { ref.addStyleSheet(String(css)); return o; },
    applyStyles: () => { ref.applyStyles(); return o; },
    styleWarnings: () => ref.styleWarnings(),
  };
  for (const g of ["slideCount", "width", "height", "text"]) {
    Object.defineProperty(o, g, { get: () => ref[g]() });
  }
  return o;
}
/**
 * The chart facade, over the compiled `PptxVega`.
 *
 * `addTo` takes the specification as an object or as JSON text and puts the
 * result on the slide as SHAPES — not as a picture. That is visible in the
 * page rather than only claimed: the editor on the right opened the .pptx
 * bytes, so every bar it draws came out of the file's shape tree.
 */
function Chart() {
  const ref = new PptxVega();
  const o = {
    font: (f) => { ref.font(String(f)); return o; },
    curveSteps: (n) => { ref.curveSteps(n | 0); return o; },
    addTo: (slide, spec, x, y, w, h) => {
      const text = typeof spec === "string" ? spec : JSON.stringify(spec);
      const made = ref.addTo(slide._ref, text, +x, +y, +w, +h);
      if (!ref.ok) throw new Error(ref.error || "the chart could not be drawn");
      return Shape(made);
    },
  };
  Object.defineProperty(o, "shapeCount", { get: () => ref.shapeCount });
  return o;
}

const JsApi = {
  get version() { return PptxApi.version(); },
  create: () => Deck(PptxApi.create()),
  open: (bytes) => {
    const d = PptxApi.open(toRanger(bytes));
    if (!d.ok) throw new Error(d.error);
    return Deck(d);
  },
};

function saveFile(name, bytes, mime) {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function boot() {
  statusEl.textContent = "loading fonts…";
  const faces = await Promise.all(FONTS.map(([, f]) => bytesOf("./fonts/" + f)));

  web = new PptxWeb();
  web.start(canvas.width, canvas.height);
  const play = new PptxPlayground();
  renderer = play.renderer;

  FONTS.forEach(([family], i) => {
    if (family) { web.addFont(family, faces[i]); renderer.addFont(family, faces[i]); }
    else { web.addFace(faces[i]); renderer.addFace(faces[i]); }
  });
  attachEditor();
  await registerBrowserFaces(faces);
  setFontFallback(dedupe(FONTS.map(([, , css]) => css && css.family)));
  await document.fonts.ready;

  statusEl.textContent = "loading shapes…";
  try {
    const presets = await fetch("./presets.txt");
    if (presets.ok) {
      const text = await presets.text();
      web.loadPresets(text);
      renderer.usePresets(text);
    }
  } catch (e) { console.warn("preset shapes unavailable:", e); }

  const select = $("preset");
  for (const name of Object.keys(PRESETS)) {
    const opt = document.createElement("option");
    opt.value = name; opt.textContent = name;
    select.appendChild(opt);
  }
  select.addEventListener("change", () => { $("code").value = PRESETS[select.value]; run(); });
  $("code").value = PRESETS[Object.keys(PRESETS)[0]];

  $("run").addEventListener("click", run);
  $("prev").addEventListener("click", () => step(-1));
  $("next").addEventListener("click", () => step(1));
  $("code").addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); }
  });
  $("download").addEventListener("click", () => {
    if (deckBytes) saveFile("playground.pptx", deckBytes,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  });
  $("png").addEventListener("click", () => {
    if (!deckBytes) return;
    const d = PptxApi.open(toRanger(deckBytes));
    const png = fromRanger(renderer.toPng(d, slideIndex, 2.0));
    if (png.length) saveFile(`slide-${slideIndex + 1}.png`, png, "image/png");
    else fail(renderer.error || "the slide could not be drawn");
  });
  $("pdf").addEventListener("click", () => {
    if (!deckBytes) return;
    const d = PptxApi.open(toRanger(deckBytes));
    const pdf = fromRanger(renderer.toPdfDeck(d));
    if (pdf.length) saveFile("playground.pdf", pdf, "application/pdf");
    else fail(renderer.error || "the deck could not be printed");
  });

  run();
  window.__playgroundReady = true;
}

boot().catch((e) => fail("could not start: " + e.message));
window.__runPlayground = run;
// Published so the smoke test can build a deck the same way the page does,
// rather than inferring what happened from pixels.
window.__jsApi = JsApi;
window.__chart = Chart;
