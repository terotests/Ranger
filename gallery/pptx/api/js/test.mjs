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
 *   * both entry points and both module systems resolve.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

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
ok("the whole deck prints as one document", () => {
  const text = Buffer.from(all).toString("latin1");
  assert.ok(text.includes("/Count 2"), "two pages in the page tree");
  assert.ok(text.includes("(Toinen sivu) Tj"), "the second slide's words are on it");
});
ok("and it says pictures are not printed yet", () => assert.equal(r.imagesPrinted, false));
ok("a slide past the end throws rather than answering nothing", () => {
  assert.throws(() => r.toPng(deck, 9, 1), /no slide/);
});

console.log("");
console.log(`passed = ${passed}`);
console.log(process.exitCode ? "SOME FAILED" : "ALL PASS");
