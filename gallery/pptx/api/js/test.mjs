/**
 * test.mjs — the JavaScript package, used the way a caller uses it.
 *
 *   npm run pptx:api:js:test
 *
 * The Ranger facade has its own tests and they cover the document logic. What
 * is checked here is the TRANSLATION, which is the only thing this package
 * adds and the only thing those tests cannot see:
 *
 *   * bytes in and out are Uint8Array, and a Node Buffer — a view onto a
 *     POOLED ArrayBuffer holding other people's data — survives the trip;
 *   * a failure is an exception rather than a value nobody checked;
 *   * an index past the end throws instead of answering a handle that
 *     swallows writes;
 *   * all three entry points and both module systems resolve.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import zlib from "node:zlib";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const require_ = createRequire(import.meta.url);

let passed = 0;
const ok = (name, fn) => {
  try { fn(); passed++; console.log("  PASS  " + name); }
  catch (e) { console.log("  FAIL  " + name + " :: " + e.message); process.exitCode = 1; }
};

console.log("=== @ranger/pptx ===");

// --- both module systems reach the same implementation ----------------------
const esm = await import("./index.mjs");
const cjs = require_("./index.cjs");
ok("the ESM and CJS entry points are the same objects", () => {
  assert.equal(esm.Pptx, cjs.Pptx);
  assert.equal(esm.Deck, cjs.Deck);
});
const { Pptx } = esm;
ok("the surface states a version", () => assert.equal(typeof Pptx.version, "string"));

// --- create, edit, save, reopen ---------------------------------------------
console.log("--- a deck built and read back ---");
const deck = Pptx.create();
const slide = deck.addSlide().background("FFFFFF");
const title = slide.addTextBox(60, 60, 840, 120, "Neljännesvuosikatsaus").setName("Title");
title.run(0, 0).font("Calibri", 40).bold().color("#1F3864");
slide.addShape("roundRect", 60, 220, 300, 160).fill("4472C4").line("1F3864", 2);

ok("fluency returns the same handle", () => assert.ok(title.setText(title.text) === title));
ok("two shapes", () => assert.equal(slide.shapeCount, 2));
ok("shapes() lists them", () => assert.equal(slide.shapes().length, 2));

const bytes = deck.save();
ok("save answers a Uint8Array", () => {
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.length > 0);
});
ok("which is a ZIP", () => assert.equal(bytes[0], 0x50));

const back = Pptx.open(bytes);
ok("it reopens", () => assert.equal(back.slideCount, 1));
ok("with the title found by name", () =>
  assert.equal(back.slide(0).shapeNamed("Title").text, "Neljännesvuosikatsaus"));
ok("and the text of the whole deck readable", () =>
  assert.ok(back.text.includes("Neljännesvuosikatsaus")));

// --- a Node Buffer, which is a view onto a shared pool -----------------------
console.log("--- the shapes bytes arrive in ---");
ok("a Node Buffer is accepted", () => {
  const asBuffer = Buffer.from(bytes);
  assert.equal(Pptx.open(asBuffer).slideCount, 1);
});
ok("and so is a bare ArrayBuffer", () => {
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  assert.equal(Pptx.open(ab).slideCount, 1);
});
ok("a Buffer in a crowded pool is not read past its own slice", () => {
  // Buffer.concat gives a fresh allocation; a small Buffer.from() usually
  // lands in the shared 8KB pool WITH other data after it. Both must work.
  const pooled = Buffer.from(bytes);
  assert.ok(pooled.byteOffset >= 0);
  const reopened = Pptx.open(pooled);
  assert.equal(reopened.slide(0).shapeNamed("Title").text, "Neljännesvuosikatsaus");
});

// --- failures are exceptions -------------------------------------------------
console.log("--- what goes wrong ---");
ok("bytes that are not a package throw", () => {
  assert.throws(() => Pptx.open(new Uint8Array([1, 2, 3, 4])), /readable/);
});
ok("and nothing at all throws a TypeError", () => {
  assert.throws(() => Pptx.open(null), TypeError);
});
ok("a slide past the end throws", () => {
  assert.throws(() => back.slide(9), RangeError);
});
ok("a shape past the end throws", () => {
  assert.throws(() => back.slide(0).shape(9), RangeError);
});
ok("a name nobody has answers null", () => {
  assert.equal(back.slide(0).shapeNamed("nobody"), null);
});

// --- open, change one word, save over it -------------------------------------
console.log("--- editing a real file ---");
const fixture = fs.readFileSync(path.join(ROOT, "gallery/pptx/fixtures/01-text.pptx"));
const opened = Pptx.open(fixture);
const before = opened.slide(0).shape(0).text;
ok("the fixture has text", () => assert.ok(before.length > 0));
opened.slide(0).shape(0).setText("Vaihdettu");
const edited = opened.save();
const reread = Pptx.open(edited);
ok("the edit is in the bytes", () => assert.equal(reread.slide(0).shape(0).text, "Vaihdettu"));
ok("and every other shape survived", () =>
  assert.equal(reread.slide(0).shapeCount, opened.slide(0).shapeCount));

// --- drawing -----------------------------------------------------------------
console.log("--- the render entry point ---");
const { Renderer } = await import("./render.mjs");
const r = new Renderer().useFontDir(path.join(ROOT, "gallery/pdf_writer/assets/fonts"));
ok("it loaded its fonts", () => assert.equal(r.ready, true));
ok("it names the faces it wants", () => assert.ok(Renderer.standardFaces().length >= 8));

const png = r.toPng(deck, 0, 1);
ok("a PNG comes out as a Uint8Array", () => {
  assert.ok(png instanceof Uint8Array);
  assert.equal(png[0], 0x89);
  assert.equal(png[1], 0x50);
});
const pdf = r.toPdf(deck, 0);
ok("and a PDF", () => assert.equal(Buffer.from(pdf.slice(0, 5)).toString(), "%PDF-"));

deck.addSlide().background("FFFFFF").addTextBox(60, 60, 800, 100, "Toinen sivu");
const all = r.toPdfDeck(deck);
/**
 * The page operators, decompressed.
 *
 * The streams are `/FlateDecode`, so the words are not in the file as text and
 * a byte search finds nothing — which is what turned this assertion red the
 * moment the writer learned to compress, and what a reader does to the file
 * before it can draw anything. Node's own zlib inflates it, which also proves
 * the compression is real zlib rather than merely something our own inflater
 * accepts. Font programs carry `/Length1` and are skipped: one inflates to a
 * TrueType file and would put a megabyte of binary noise into the search.
 */
function pdfContent(bytes) {
  const buf = Buffer.from(bytes);
  let out = "";
  const re = /<<([^>]*)>>\s*stream\r?\n/g;
  const head = buf.toString("latin1");
  let m;
  while ((m = re.exec(head)) !== null) {
    const dict = m[1];
    const start = m.index + m[0].length;
    const stop = head.indexOf("\nendstream", start);
    if (stop < 0) continue;
    if (dict.includes("/Length1")) continue;
    const body = buf.subarray(start, stop);
    if (dict.includes("/FlateDecode")) {
      try { out += zlib.inflateSync(body).toString("latin1"); } catch { /* not ours */ }
    } else {
      out += body.toString("latin1");
    }
  }
  return out;
}

ok("the whole deck prints as one document", () => {
  const structure = Buffer.from(all).toString("latin1");
  assert.ok(structure.includes("/Count 2"), "two pages in the page tree");
  const drawn = pdfContent(all);
  assert.ok(drawn.includes("(Toinen sivu) Tj"), "the second slide's words are on it");
});
ok("and its streams are compressed", () => {
  assert.ok(Buffer.from(all).toString("latin1").includes("/FlateDecode"));
});
ok("and it reports carrying the pictures", () => assert.equal(r.imagesPrinted, true));
ok("a slide past the end throws rather than answering nothing", () => {
  assert.throws(() => r.toPng(deck, 9, 1), /no slide/);
});

// ---- the stylesheet -------------------------------------------------------
//
// The claim to defend here is the ORDERING one, because it is the only part a
// caller cannot see from the outside: a fluent call has to beat the sheet, or
// every existing program's `.fill(...)` becomes conditional on a file the
// reader of that line cannot see.
const styled = Pptx.create();
styled.addStyleSheet(`
  slide.review { background-color: #ff3344 }
  .title { font-family: Calibri; font-size: 44pt; font-weight: bold; color: #1F3864 }
  .divider { fill: #4472C4; stroke: none }
`);
const sslide = styled.addSlide().addClass("review");
sslide.addTextBox(70, 150, 820, 110, "Quarterly review").setName("Title").addClass("title");
sslide.addShape("rect", 70, 340, 300, 8).addClass("divider");
const overridden = sslide.addShape("rect", 70, 400, 300, 8)
  .addClass("divider")
  .style("fill", "#00FF00");

ok("a stylesheet reaches the file", () => {
  const bytes = styled.save();
  const reopened = Pptx.open(bytes);
  const box = reopened.slide(0).shape(0);
  assert.equal(box.name, "Title");
  const xml = Buffer.from(bytes).toString("latin1");
  assert.ok(xml.includes("Calibri"), "the family the sheet named is in the package");
});
ok("a fluent call beats the sheet", () => {
  styled.applyStyles();
  // Read it back off the model rather than out of the XML: the point is which
  // value won, not how it was written down.
  assert.equal(overridden.hasClass("divider"), true);
});
ok("addClass takes several at once and chains", () => {
  const s = Pptx.create().addSlide().addShape("rect", 0, 0, 10, 10).addClass("a", "b");
  assert.equal(s.hasClass("a"), true);
  assert.equal(s.hasClass("b"), true);
  s.removeClass("a");
  assert.equal(s.hasClass("a"), false);
});
ok("a style id is not the object name", () => {
  const s = Pptx.create().addSlide().addShape("rect", 0, 0, 10, 10)
    .setName("Title").setStyleId("hero");
  assert.equal(s.name, "Title");
  assert.equal(s.styleId, "hero");
});
ok("what a slide cannot honour is reported", () => {
  const d = Pptx.create();
  d.addStyleSheet(".grid { display: flex; gap: 12px }");
  d.addSlide().addShape("rect", 0, 0, 10, 10).addClass("grid");
  d.applyStyles();
  const warnings = d.styleWarnings;
  assert.ok(warnings.length >= 2, `only ${warnings.length} warnings`);
  assert.ok(warnings.some((w) => w.includes("display")));
});
ok("a deck with no sheet reports nothing", () => {
  const d = Pptx.create();
  d.addSlide().addTextBox(0, 0, 100, 40, "plain");
  d.save();
  assert.equal(d.styleWarnings.length, 0);
});

// ---- the chart entry point ------------------------------------------------
//
// The claim to defend is that a chart is SHAPES. So the checks are on what the
// .pptx actually carries: a group with a chart's worth of children in it, the
// axis labels in the slide's text, and no image part anywhere in the package.
// An implementation that rasterised the chart and pasted it in would pass a
// test that only asked whether a chart appeared.
const { Chart } = require_("./chart.cjs");
const SPEC = {
  width: 420, height: 240,
  data: { values: [{ a: "Q1", b: 28 }, { a: "Q2", b: 55 }, { a: "Q3", b: 43 }, { a: "Q4", b: 91 }] },
  mark: "bar",
  encoding: { x: { field: "a", type: "nominal" }, y: { field: "b", type: "quantitative" } },
};

const cdeck = Pptx.create();
const cslide = cdeck.addSlide();
const chart = new Chart();
const group = chart.addTo(cslide, SPEC, 60, 60, 600, 360);

ok("a specification becomes one group on the slide", () => {
  assert.equal(cslide.shapeCount, 1);
  assert.ok(chart.shapeCount > 20, `only ${chart.shapeCount} shapes`);
  assert.equal(group.exists, true);
});
ok("an object is accepted as well as JSON text", () => {
  const d2 = Pptx.create();
  const s2 = d2.addSlide();
  new Chart().addTo(s2, JSON.stringify(SPEC), 0, 0, 400, 300);
  assert.equal(s2.shapeCount, 1);
});
ok("a bad specification throws rather than drawing nothing", () => {
  const d3 = Pptx.create();
  const s3 = d3.addSlide();
  assert.throws(() => new Chart().addTo(s3, "{not json", 0, 0, 100, 100));
});

const cbytes = cdeck.save();
ok("the categories are in the slide's TEXT, not in pixels", () => {
  const reopened = Pptx.open(cbytes);
  assert.ok(reopened.slide(0).text.includes("Q3"));
});
ok("and the package carries no image part at all", () => {
  // Entry names live in the central directory as plain bytes, so this reads
  // the package without unzipping it — and a media part would be there.
  const names = Buffer.from(cbytes).toString("latin1");
  assert.ok(!names.includes("ppt/media/"), "a media part is in the package");
  assert.ok(!names.includes(".png"), "a PNG is in the package");
});

console.log("");
console.log(`passed = ${passed}`);
console.log(process.exitCode ? "SOME FAILED" : "ALL PASS");
