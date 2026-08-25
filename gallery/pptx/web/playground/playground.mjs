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
import { attachPointer, attachKeys, createMediaCache, decodeScene, sceneStamp } from "./host/pptx-host.mjs";
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

/**
 * The examples, in two sets.
 *
 * `BLANK` builds a deck out of nothing, which is what this page has always
 * shown. `OPENED` is the other half of the API and the harder half to believe:
 * it takes a .pptx the reader chose off their own disk, opens it, changes it,
 * and saves it back. Nothing about that is simulated — `Source` below is the
 * bytes of their file, `Pptx.open` is the published call, and the editor on
 * the right opens the SAVED bytes, so anything you see there survived the
 * round trip through the package writer.
 *
 * Which set is offered depends on whether a file is loaded, because an example
 * that says `Pptx.open(Source)` is a confusing thing to hand somebody who has
 * not opened anything.
 *
 * WHY `save()` AND NOT `saveNew()`. A deck that was opened writes back OVER
 * its original package — see `PptxApi.save`. Parts this model has never heard
 * of travel through untouched, which is what makes editing somebody's real
 * deck a safe thing to do rather than a re-creation of the parts we happen to
 * understand.
 */
const BLANK = {
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

  "Six chart slides": `// Six chart slides. Everything that never changes is said ONCE: the text
// styles in a stylesheet, the axis look in one chart config, and the page
// furniture in two small helpers. What is left below each heading is the
// DATA and the one encoding choice that makes each chart a different chart.
const deck = Pptx.create();

const BLUE = "#5577F2", GREEN = "#35B7A5", RED = "#E9877F", GOLD = "#F4B84A";

deck.addStyleSheet(\`
  slide     { background-color: #FFFFFF }
  .title    { font-family: Calibri; font-size: 28pt; font-weight: bold; color: #1F3864 }
  .subtitle { font-family: Calibri; font-size: 12pt; color: #6F8098 }
  .page     { font-family: Calibri; font-size: 11pt; font-weight: bold; color: #A8B2C1 }
  .note     { font-family: Calibri; font-size: 10pt; color: #A0AABA }
\`);

// One axis look for the whole deck, instead of on every encoding of every
// spec. A chart's own config still wins, block by block.
const chart = Chart().font("Calibri").config({
  background: null,
  view:  { stroke: null },
  axis:  { domain: false, ticks: false, labelColor: "#6F8098", titleColor: "#6F8098" },
  axisY: { grid: true, gridColor: "#E7ECF2" },
  axisX: { grid: false, labelPadding: 10, labelAngle: 0 },
});

let page = 0;
const sheet = (title, subtitle) => {
  const s = deck.addSlide();
  s.addTextBox(70, 38, 760, 45, title).addClass("title");
  s.addTextBox(70, 82, 760, 28, subtitle).addClass("subtitle");
  s.addTextBox(860, 48, 60, 24, "0" + ++page).addClass("page");
  return s;
};
const plot = (s, spec) => {
  chart.addTo(s, { width: 620, height: 300, ...spec }, 70, 125, 820, 370);
  s.addTextBox(70, 515, 820, 24, chart.shapeCount + " editable shapes").addClass("note");
};

const X = (f, sort) => ({ field: f, type: "ordinal", title: null, ...(sort ? { sort } : {}) });
const Y = (f, domain) => ({ field: f, type: "quantitative", title: null,
                            ...(domain ? { scale: { domain } } : {}) });
const quiet = (enc) => ({ ...enc, x: { ...enc.x, axis: null }, y: { ...enc.y, axis: null } });

// 01 — one quarter picked out of four
{
  const s = sheet("Revenue acceleration", "Quarterly revenue · M€");
  const rows = [28, 55, 43, 91].map((revenue, i) => ({ quarter: "Q" + (i + 1), revenue }));
  const enc = { x: X("quarter", ["Q1", "Q2", "Q3", "Q4"]), y: Y("revenue", [0, 100]) };
  plot(s, {
    data: { values: rows },
    layer: [
      { mark: { type: "bar", width: 72, cornerRadiusTopLeft: 9, cornerRadiusTopRight: 9 },
        encoding: { ...enc,
          color: { condition: { test: "datum.quarter === 'Q4'", value: BLUE }, value: "#D4DCE8" } } },
      { mark: { type: "text", dy: -13, fontSize: 14, fontWeight: 700, color: "#1F3864" },
        encoding: { ...quiet(enc), text: { field: "revenue" } } },
    ],
  });
}

// 02 — actual against plan
{
  const s = sheet("Recurring revenue momentum", "Actual ARR versus operating plan · M€");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const actual = [82, 88, 95, 101, 108, 117, 124, 136];
  const target = [86, 89, 92, 96, 101, 106, 112, 118];
  const rows = months.map((month, i) => ({ month, actual: actual[i], target: target[i] }));
  // No sort: an ordinal axis is alphabetical unless told, and Jan is not first.
  const enc = { x: { ...X("month", months), sort: months }, y: { ...Y("actual", [70, 145]), scale: { domain: [70, 145], clamp: true } } };
  const curve = { interpolate: "monotone" };
  plot(s, {
    data: { values: rows },
    layer: [
      { mark: { type: "area", ...curve, color: BLUE, opacity: 0.1 }, encoding: enc },
      { mark: { type: "line", ...curve, strokeWidth: 4, color: BLUE }, encoding: quiet(enc) },
      { mark: { type: "line", ...curve, strokeWidth: 2, strokeDash: [7, 5], color: "#9DA8B7" },
        encoding: { ...quiet(enc), y: { ...Y("target"), axis: null } } },
      { mark: { type: "point", filled: true, size: 80, color: BLUE, stroke: "#FFFFFF", strokeWidth: 2 },
        encoding: quiet(enc) },
    ],
  });
}

// 03 — revenue against growth, sized by customers
{
  const s = sheet("Product portfolio", "Revenue × growth · bubble size is the customer base");
  const rows = [
    ["Atlas", 84, 32, 71, 420], ["Nova", 68, 18, 64, 610], ["Pulse", 51, 44, 58, 330],
    ["Vertex", 39, 27, 76, 210], ["Orbit", 24, 61, 49, 175], ["Echo", 18, 12, 42, 290],
    ["Flux", 46, 36, 68, 250],
  ].map(([product, revenue, growth, margin, customers]) => ({ product, revenue, growth, margin, customers }));
  const enc = { x: { ...Y("revenue", [0, 100]), title: "Revenue · M€" },
                y: { ...Y("growth", [0, 70]), title: "Growth · %" } };
  plot(s, {
    height: 310,
    data: { values: rows },
    layer: [
      { mark: { type: "circle", opacity: 0.82, stroke: "#FFFFFF", strokeWidth: 2 },
        encoding: { ...enc,
          size: { field: "customers", type: "quantitative", legend: null, scale: { range: [250, 1600] } },
          color: { field: "margin", type: "quantitative", legend: null,
                   scale: { domain: [40, 80], range: ["#DDE6F5", BLUE] } } } },
      { mark: { type: "text", dy: -21, fontSize: 11, fontWeight: 700, color: "#1F3864" },
        encoding: { ...quiet(enc), text: { field: "product" } } },
    ],
  });
}

// 04 — a heat map, coloured by threshold rather than by ramp
{
  const s = sheet("Target attainment by region", "Quarterly performance versus operating plan");
  const regions = ["Nordics", "DACH", "UK", "France", "Spain", "Benelux"];
  const table = [[103, 108, 112, 118], [94, 97, 101, 106], [99, 104, 109, 115],
                 [87, 91, 96, 102], [82, 89, 93, 98], [97, 101, 107, 111]];
  const rows = regions.flatMap((region, r) =>
    table[r].map((attainment, q) => ({ region, quarter: "Q" + (q + 1), attainment })));
  const enc = { x: { ...X("quarter", ["Q1", "Q2", "Q3", "Q4"]), axis: { orient: "top" } },
                y: { ...X("region", regions), axis: { labelPadding: 12, labelColor: "#53657E" } } };
  // Three bands read faster than a gradient: under plan, near it, over it.
  const band = (low, high, plain) => ({
    condition: [{ test: "datum.attainment < 95", value: low },
                { test: "datum.attainment >= 105", value: high }],
    value: plain,
  });
  plot(s, {
    data: { values: rows },
    layer: [
      { mark: { type: "rect", cornerRadius: 8, stroke: "#FFFFFF", strokeWidth: 5 },
        encoding: { ...enc, color: band(RED, GREEN, "#E7ECF3") } },
      { transform: [{ calculate: "datum.attainment + '%'", as: "label" }],
        mark: { type: "text", fontSize: 12, fontWeight: 700 },
        encoding: { ...quiet(enc), text: { field: "label" },
                    color: band("#FFFFFF", "#FFFFFF", "#1F3864") } },
    ],
  });
}

// 05 — the gap between actual and target, per region
{
  const s = sheet("Actual versus target", "Regional performance index");
  const rows = [["Nordics", 118, 105], ["UK", 112, 108], ["Benelux", 107, 101],
                ["DACH", 96, 102], ["France", 91, 100], ["Spain", 84, 94]]
    .map(([region, actual, target]) => ({ region, actual, target }));
  const enc = { y: { field: "region", type: "nominal", title: null },
                x: Y("target", [75, 125]) };
  const at = (f) => ({ ...quiet(enc), x: { ...Y(f), axis: null } });
  plot(s, {
    data: { values: rows },
    layer: [
      { mark: { type: "rule", strokeWidth: 5, strokeCap: "round", color: "#DCE3EC" },
        encoding: { ...enc, x2: { field: "actual" } } },
      { mark: { type: "point", filled: true, size: 150, color: "#A9B4C3" }, encoding: at("target") },
      { mark: { type: "point", filled: true, size: 250, stroke: "#FFFFFF", strokeWidth: 2 },
        encoding: { ...at("actual"),
          color: { condition: { test: "datum.actual >= datum.target", value: GREEN }, value: RED } } },
      { mark: { type: "text", dx: 15, align: "left", fontSize: 11, fontWeight: 700, color: "#1F3864" },
        encoding: { ...at("actual"), text: { field: "actual" } } },
    ],
  });
}

// 06 — the same total, split three ways
{
  const s = sheet("Customer mix evolution", "Revenue contribution by segment · M€");
  const mix = { Enterprise: [38, 44, 51, 63], SMB: [29, 31, 36, 42], Consumer: [16, 18, 22, 27] };
  const rows = Object.entries(mix).flatMap(([segment, vals]) =>
    vals.map((revenue, i) => ({ quarter: "Q" + (i + 1), segment, revenue })));
  plot(s, {
    data: { values: rows },
    mark: { type: "bar", cornerRadiusTopLeft: 5, cornerRadiusTopRight: 5 },
    encoding: {
      x: X("quarter", ["Q1", "Q2", "Q3", "Q4"]),
      y: { ...Y("revenue"), stack: "zero" },
      color: { field: "segment", type: "nominal",
               scale: { domain: ["Enterprise", "SMB", "Consumer"], range: [BLUE, GREEN, GOLD] },
               legend: { orient: "top", direction: "horizontal", title: null, symbolType: "circle" } },
    },
  });
}

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

/**
 * Examples that work on the file the reader opened.
 *
 * Each one ends by returning the deck, the same as every other example, so the
 * page saves it and the editor opens the result. `log()` prints into the pane
 * under the code as well as to the browser console.
 */
const OPENED = {
  "What is in this deck?": `// Nothing is changed here — this only READS the file you opened, and
// prints what it found. \`Source\` is the bytes of that file.
const deck = Pptx.open(Source);

log(\`\${deck.slideCount} slide(s), \${deck.width} x \${deck.height} pt\`);

for (let i = 0; i < deck.slideCount; i++) {
  const slide = deck.slide(i);
  log(\`  slide \${i + 1}: \${slide.shapeCount} shape(s)\`);
}

// The deck is returned unchanged, so the editor on the right shows the file
// exactly as it arrived — saved back through the writer on the way.
return deck;`,

  "List every element": `// Every shape on every slide: what it is called, what it is, where it sits
// and what it says. This is the whole read side of the API in one loop.
const deck = Pptx.open(Source);

for (let i = 0; i < deck.slideCount; i++) {
  const slide = deck.slide(i);
  log(\`slide \${i + 1} — \${slide.shapeCount} shape(s)\`);
  for (let k = 0; k < slide.shapeCount; k++) {
    const s = slide.shape(k);
    const box = \`\${Math.round(s.x)},\${Math.round(s.y)} \${Math.round(s.width)}x\${Math.round(s.height)}\`;
    const said = s.text ? JSON.stringify(s.text.slice(0, 48)) : "(no text)";
    log(\`  [\${k}] \${s.name || "(unnamed)"}  \${s.preset || "custom"}  \${box}  \${said}\`);
  }
}

return deck;`,

  "Retitle the first slide": `// The title is the biggest text box near the top — a deck does not have to
// name it "Title", so this finds it rather than trusting a name. Change the
// text below and press Run again.
const NEW_TITLE = "Edited in the browser";

const deck = Pptx.open(Source);
if (deck.slideCount === 0) throw new Error("that deck has no slides");
const slide = deck.slide(0);

let best = null, bestArea = 0;
for (let k = 0; k < slide.shapeCount; k++) {
  const s = slide.shape(k);
  if (!s.text) continue;
  if (s.y > slide.height * 0.5) continue;      // not in the top half: not a title
  const area = s.width * s.height;
  if (area > bestArea) { best = s; bestArea = area; }
}

if (!best) {
  log("no text in the top half of slide 1 — adding a title instead");
  best = slide.addTextBox(60, 50, slide.width - 120, 70, NEW_TITLE);
} else {
  log(\`was: \${JSON.stringify(best.text)}\`);
  best.setText(NEW_TITLE);
  log(\`now: \${JSON.stringify(best.text)}\`);
}

return deck;`,

  "Stamp every slide": `// Add the same line to the foot of every slide — the sort of thing you do to
// a deck somebody else made. Everything already on the slides is left alone.
const STAMP = "Reviewed — opened, edited and saved by @ranger/pptx";

const deck = Pptx.open(Source);
for (let i = 0; i < deck.slideCount; i++) {
  const slide = deck.slide(i);
  slide.addTextBox(40, slide.height - 34, slide.width - 80, 22, STAMP)
       .setName("stamp")
       .run(0, 0).font("Calibri", 9).color("#8A94A6");
}
log(\`stamped \${deck.slideCount} slide(s)\`);

return deck;`,

  "Add a slide at the end": `// A new slide appended to a deck that already exists — the two halves of the
// API in one example.
const deck = Pptx.open(Source);
const before = deck.slideCount;

const slide = deck.addSlide().background("FFFFFF");
slide.addTextBox(60, 90, deck.width - 120, 80, "Added to your deck")
     .run(0, 0).font("Calibri", 34).bold().color("#1F3864");
slide.addTextBox(60, 190, deck.width - 120, 60,
       \`This deck had \${before} slide(s) when it was opened.\`)
     .run(0, 0).font("Calibri", 14).color("#5A6B82");

log(\`\${before} slide(s) in, \${deck.slideCount} out\`);

return deck;`,

  "Save it back untouched": `// The plainest proof there is: open the file and save it, changing nothing.
// What the editor draws on the right came out of the writer, not out of the
// bytes you picked — and it is still your deck, because a deck that was
// OPENED is written back over its own package rather than rebuilt from the
// parts this model happens to understand.
const deck = Pptx.open(Source);
log(\`\${deck.slideCount} slide(s) in, \${deck.slideCount} slide(s) out\`);
return deck;`,
};

let web = null, renderer = null, deckBytes = null;
let lastScene = "", slideIndex = 0, slideCount = 0;

/**
 * The .pptx the reader opened, if they opened one.
 *
 * Held as bytes rather than as an open deck on purpose: every Run starts from
 * the ORIGINAL file. An example that stamped every slide would otherwise stamp
 * them again on the second press, and the reader would be looking at the
 * output of their last run without being told.
 */
let sourceBytes = null, sourceName = "";

/** What the code printed. Cleared at the start of every run. */
const logEl = () => $("log");
function clearLog() { logEl().textContent = ""; }
function say(text, bad) {
  const line = document.createElement(bad ? "span" : "span");
  if (bad) line.className = "err";
  line.textContent = text + "\n";
  logEl().appendChild(line);
  logEl().scrollTop = logEl().scrollHeight;
}
/** `console.log` in an example, in the words the example used. */
const printable = (v) =>
  typeof v === "string" ? v
  : v instanceof Error ? v.message
  : (() => { try { return JSON.stringify(v); } catch { return String(v); } })();

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
  // Typed arrays rather than JSON — see `decodeScene` in the host module. The
  // frame is told from the one before it by `sceneStamp`, because there is no
  // string left to compare.
  const doc = decodeScene(web.sceneBinary());
  const stamp = sceneStamp(doc);
  if (stamp === lastScene) return;
  lastScene = stamp;
  sceneW = doc.width;
  sceneH = doc.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(doc.width * dpr), h = Math.round(doc.height * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  if (document.documentElement.classList.contains("embed")) {
    canvas.style.height = "";
    canvas.style.flex = "1";
    canvas.style.minHeight = "0";
    canvas.style.width = "100%";
    canvas.style.objectFit = "contain";
  } else {
    canvas.style.height = doc.height + "px";
  }
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
  // Under the name the reader knows it by, when there is one. The editor puts
  // that name in its own status bar, and "playground.pptx" beside a deck they
  // opened off their disk reads as a different file.
  if (!web.openDeck(toRanger(bytes), sourceName || "playground.pptx")) {
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

/**
 * Run the reader's code. It returns a Deck; anything else is a mistake worth
 * naming.
 *
 * Nothing runs on its own in the full playground — not on load, not when the
 * example is changed. An example that opens the reader's file and edits it is
 * not a thing to do behind their back, and once one example needs a button the
 * rest may as well need the same one. An iframe with `?embed=1` is the
 * exception: the docs page that wrapped it has to show a slide, not a button.
 *
 * `Source` is the bytes of the file the reader opened, and it is the ORIGINAL
 * bytes every time — the output of a run is never written back over them. An
 * example that stamps every slide therefore stamps them once however often it
 * is pressed, instead of the reader silently editing the result of their last
 * press. The smoke test presses Run twice and counts the stamps.
 */
function run() {
  clearLog();
  let deck;
  const done = () => Promise.resolve();
  // `console.log` from inside the example reaches the pane under the code as
  // well as the browser's console. A page that answers "how many slides?" only
  // in devtools has not answered it.
  const real = { log: console.log, warn: console.warn, error: console.error };
  const tee = (fn, bad) => (...args) => {
    say(args.map(printable).join(" "), bad);
    fn.apply(console, args);
  };
  console.log = tee(real.log, false);
  console.warn = tee(real.warn, false);
  console.error = tee(real.error, true);
  try {
    const fn = new Function("Pptx", "Renderer", "Chart", "Source", "log",
                            '"use strict";\n' + $("code").value);
    const source = sourceBytes;
    deck = fn(JsApi, renderer, Chart, source, (...a) => say(a.map(printable).join(" "), false));
  } catch (err) {
    fail("the code threw: " + (err && err.message ? err.message : String(err)));
    return done();
  } finally {
    Object.assign(console, real);
  }
  if (!deck || typeof deck.save !== "function") {
    fail("the code has to `return` a deck — the last line of every example does.");
    return done();
  }
  let bytes;
  try {
    bytes = deck.save();
  } catch (err) {
    fail("saving the deck failed: " + err.message);
    return done();
  }
  return showDeck(bytes).then(() => {
    statusEl.className = "good";
    const from = sourceBytes
      ? `${sourceName} (${sourceBytes.length.toLocaleString()} bytes) → `
      : "";
    statusEl.textContent =
      `${from}${slideCount} slide(s), ${bytes.length.toLocaleString()} bytes — opened from the `
      + `file the code produced, not from the model in memory.`;
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
    config: (spec) => {
      ref.config(typeof spec === "string" ? spec : JSON.stringify(spec));
      return o;
    },
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

/**
 * The deck as it stands, which is not the same as the deck the code produced.
 *
 * The editor on the right is LIVE: drag a shape, type in one, insert one, and
 * the deck has changed — in the editor. `deckBytes` is the output of the last
 * Run and knows nothing about any of it, so exporting from it silently threw
 * away everything the reader had done by hand. Download, PNG and PDF all ask
 * the editor instead, and the editor is the thing they were looking at.
 *
 * `saveBytes` answers an ArrayBuffer; the callers want bytes.
 */
function currentBytes() {
  if (web) {
    try {
      const raw = web.saveBytes();
      const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw || []);
      if (bytes.length > 0) return bytes;
    } catch (err) {
      // An editor with nothing open cannot save, which is not a failure worth
      // a message — fall through to whatever the last Run produced.
      console.warn("the editor could not save; exporting the last run instead:", err);
    }
  }
  return deckBytes;
}

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

  // ---- the examples, and which set is on offer -------------------------
  // Changing the example loads its code and stops. It does not run: see the
  // banner on `run`.
  const select = $("preset");
  function offer(table) {
    select.textContent = "";
    for (const name of Object.keys(table)) {
      const opt = document.createElement("option");
      opt.value = name; opt.textContent = name;
      select.appendChild(opt);
    }
    const first = Object.keys(table)[0];
    select.value = first;
    $("code").value = table[first];
  }
  const table = () => (sourceBytes ? OPENED : BLANK);
  select.addEventListener("change", () => { $("code").value = table()[select.value]; });
  offer(BLANK);

  // ---- the file the examples work on -----------------------------------
  // Read here and nowhere else: there is no server behind this page and the
  // bytes never leave the tab. Opening a file switches the example list and
  // shows the deck as it arrived, so the reader can see what they picked
  // BEFORE any example has touched it.
  const sourceEl = $("source");
  function saySource() {
    if (sourceBytes) {
      sourceEl.className = "loaded";
      sourceEl.textContent =
        `${sourceName} · ${sourceBytes.length.toLocaleString()} bytes — the examples open and edit this`;
    } else {
      sourceEl.className = "";
      sourceEl.textContent = "no file — the examples build a deck from nothing";
    }
  }
  $("file").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    let bytes;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch (err) {
      return fail("could not read " + file.name + ": " + err.message);
    }
    // Openable at all? Say so now rather than inside somebody's first Run.
    try {
      const probe = JsApi.open(bytes.slice());
      sourceBytes = bytes;
      sourceName = file.name;
      saySource();
      offer(OPENED);
      clearLog();
      say(`${file.name}: ${probe.slideCount} slide(s), ${probe.width} x ${probe.height} pt`);
      say("the examples now open THIS file — press Run");
      await showDeck(bytes.slice());
      statusEl.className = "";
      statusEl.textContent = `${file.name} — ${slideCount} slide(s), as it arrived. Press Run to change it.`;
    } catch (err) {
      fail("that is not a .pptx this build can open: " + (err && err.message ? err.message : String(err)));
    }
  });

  // ---- and back to a blank page ----------------------------------------
  $("clear").addEventListener("click", async () => {
    sourceBytes = null;
    sourceName = "";
    $("file").value = "";           // or picking the same file again is a no-op
    saySource();
    offer(BLANK);
    clearLog();
    // An empty deck in the editor, so nothing of the old file is left on
    // screen to be mistaken for something still loaded.
    const empty = JsApi.create();
    empty.addSlide().background("FFFFFF");
    await showDeck(empty.save());
    statusEl.className = "";
    statusEl.textContent = "cleared — the examples build a deck from nothing again. Press Run.";
  });
  saySource();

  $("run").addEventListener("click", run);
  $("prev").addEventListener("click", () => step(-1));
  $("next").addEventListener("click", () => step(1));
  $("code").addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); }
  });
  $("download").addEventListener("click", () => {
    // An edited deck comes back as `<name>-edited.pptx` rather than as
    // "playground.pptx", so it does not land in the reader's downloads looking
    // like something this page invented — and does not overwrite the original.
    const name = sourceName
      ? sourceName.replace(/\.pptx$/i, "") + "-edited.pptx"
      : "playground.pptx";
    const bytes = currentBytes();
    if (bytes) saveFile(name, bytes,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  });
  $("png").addEventListener("click", () => {
    const bytes = currentBytes();
    if (!bytes) return;
    const d = PptxApi.open(toRanger(bytes));
    const png = fromRanger(renderer.toPng(d, slideIndex, 2.0));
    if (png.length) saveFile(`slide-${slideIndex + 1}.png`, png, "image/png");
    else fail(renderer.error || "the slide could not be drawn");
  });
  $("pdf").addEventListener("click", () => {
    const bytes = currentBytes();
    if (!bytes) return;
    const d = PptxApi.open(toRanger(bytes));
    const pdf = fromRanger(renderer.toPdfDeck(d));
    if (pdf.length) saveFile("playground.pdf", pdf, "application/pdf");
    else fail(renderer.error || "the deck could not be printed");
  });

  /**
   * Docs pages iframe this page with `?embed=1&preset=…`. The query is also
   * applied from `postMessage` so a page can ship a snippet that is not one
   * of the named presets. Autorun is the point of an embed — a docs reader
   * who has to press Run to see the picture the page is talking about has
   * not been shown the picture. The full playground still waits for Run.
   */
  function applyEmbedQuery() {
    const q = new URLSearchParams(location.search);
    const embed = q.get("embed") === "1" || q.get("embed") === "true";
    if (embed) {
      document.documentElement.classList.add("embed");
      document.body.classList.add("embed");
      window.__embedMode = true;
      if (q.get("view") === "slides") document.documentElement.classList.add("slides-only");
    }
    const preset = q.get("preset");
    const offered = table();
    if (preset && offered[preset]) {
      select.value = preset;
      $("code").value = offered[preset];
    }
    return embed && q.get("run") !== "0";
  }

  window.addEventListener("message", (ev) => {
    if (ev.source !== window.parent) return;
    const d = ev.data;
    if (!d || d.type !== "pptx-embed") return;
    document.documentElement.classList.add("embed");
    document.body.classList.add("embed");
    window.__embedMode = true;
    if (d.view === "slides") document.documentElement.classList.add("slides-only");
    if (typeof d.code === "string" && d.code.trim()) {
      $("code").value = d.code;
      run();
      return;
    }
    if (typeof d.preset === "string" && table()[d.preset]) {
      select.value = d.preset;
      $("code").value = table()[d.preset];
      run();
    }
  });

  // Nothing runs on load in the full playground. An embed autoruns so the
  // docs page that wrapped this iframe has a slide to show, not a blank deck
  // and a button.
  const shouldAutorun = applyEmbedQuery();
  try {
    if (shouldAutorun) {
      await Promise.resolve(run());
    } else {
      const empty = JsApi.create();
      empty.addSlide().background("FFFFFF");
      await showDeck(empty.save());
      statusEl.className = "";
      statusEl.textContent = "ready — press Run, or open a .pptx to edit one you already have.";
    }
  } finally {
    window.__playgroundReady = true;
  }
}

boot().catch((e) => fail("could not start: " + e.message));
window.__runPlayground = run;
// Published so the smoke test can build a deck the same way the page does,
// rather than inferring what happened from pixels.
window.__jsApi = JsApi;
window.__chart = Chart;
// The example tables and the opened file, so a test can ask the page what it
// is offering and what it is holding instead of scraping the DOM for it.
window.__examples = { BLANK, OPENED };
window.__source = () => (sourceBytes ? { name: sourceName, length: sourceBytes.length } : null);
window.__log = () => document.getElementById("log").textContent;
// The bytes the RUN produced — the API's own output, before the editor has
// opened and re-saved them. A test that asks the editor for them is measuring
// the editor's writer instead.
window.__deckBytes = () => (deckBytes ? Array.from(deckBytes) : null);
// Hand the page a file without a real file dialog, which nothing can drive.
// This is the same path the picker takes, minus the picker.
window.__openSource = async (bytes, name) => {
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], name || "test.pptx",
    { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }));
  const input = document.getElementById("file");
  input.files = dt.files;
  input.dispatchEvent(new Event("change"));
};
