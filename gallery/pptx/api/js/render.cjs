/**
 * @ranger/pptx/render — the same decks, drawn.
 *
 * A separate entry point rather than a member of the main one, because the
 * bundle behind it is five times the size: `dist/pptx_api.cjs` is a ZIP
 * reader, an XML parser and a writer, and `dist/pptx_api_render.cjs` adds a
 * canvas, a font manager, image decoders and a PDF writer. A caller who only
 * rewrites the text of a template should not load the second one, and a lazy
 * `require` inside a method would not spare them: a bundler follows it.
 *
 * A Deck from the main entry point is accepted here because both bundles were
 * compiled from the same sources, so the model class in one is the model class
 * in the other — it is passed straight through, not converted.
 */
"use strict";

const render = require("./dist/pptx_api_render.cjs");
const { toRanger, fromRanger } = require("./index.cjs");

class Renderer {
  constructor() { this._ = new render.PptxRenderer(); }

  /** True once a face has been loaded. Nothing draws readably before that. */
  get ready() { return this._.ready; }
  /** Why the last call produced nothing. */
  get error() { return this._.error; }
  /**
   * False, and worth reading before trusting a PDF: the PDF writer resolves a
   * picture by PATH and a document names its pictures by package part, so a
   * deck with a logo on it prints without the logo. The shapes and the text
   * are there.
   */
  get imagesPrinted() { return this._.imagesPrinted; }

  /** Every face in a directory laid out like `gallery/pdf_writer/assets/fonts`. */
  useFontDir(dir) { this._.useFontDir(String(dir)); return this; }
  /** One named face from its bytes — the browser and the build-server path. */
  addFont(family, bytes) { this._.addFont(String(family), toRanger(bytes)); return this; }
  /** A face that joins the per-codepoint fallback pool without becoming a family. */
  addFace(bytes) { this._.addFace(toRanger(bytes)); return this; }
  /** The 187 preset geometries, as `gallery/office/geom/assets/presets.txt`. */
  usePresets(text) { this._.usePresets(String(text)); return this; }

  /** The faces this repository ships, in the order the fallback walk takes them. */
  static standardFaces() { return render.PptxRenderer.standardFaces(); }

  /**
   * One slide as a PNG. `scale` multiplies 96 dots per inch rather than naming
   * a pixel width, because a deck's pages can differ in size and "twice as
   * sharp" should mean that whatever the page is.
   */
  toPng(deck, slide = 0, scale = 1) {
    const out = fromRanger(this._.toPng(deck._, slide | 0, Number(scale) || 1));
    if (out.length === 0) throw new Error(this._.error || "the slide could not be drawn");
    return out;
  }

  /** One slide as a vector PDF page at the slide's own size in points. */
  toPdf(deck, slide = 0) {
    const out = fromRanger(this._.toPdf(deck._, slide | 0));
    if (out.length === 0) throw new Error(this._.error || "the slide could not be printed");
    return out;
  }

  /** The whole deck as one PDF, a page per slide, with the fonts embedded once. */
  toPdfDeck(deck) {
    const out = fromRanger(this._.toPdfDeck(deck._));
    if (out.length === 0) throw new Error(this._.error || "the deck could not be printed");
    return out;
  }
}

module.exports = { Renderer };
