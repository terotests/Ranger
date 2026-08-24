/**
 * @ranger/pptx — open a .pptx, read it, change it, write it back.
 *
 * This file is the translation layer and nothing else. The document logic is
 * `gallery/pptx/api/PptxApi.rgr`, compiled to `dist/pptx_api.cjs`; what is
 * here turns that into something a JavaScript caller expects:
 *
 *   * BYTES. Ranger's `buffer` is an ArrayBuffer with a DataView hung off it,
 *     which is what the compiled runtime reads through. A caller passes a
 *     Uint8Array or a Node Buffer and gets a Uint8Array back; neither side has
 *     to know about the other's shape.
 *   * ERRORS. Ranger has no throw that a C++ target would honour the same way,
 *     so a failure there is a value: `ok` is false and `error` says why. Here
 *     it is an exception, because a JavaScript caller who forgets to check a
 *     boolean gets a corrupt document and no clue where it came from.
 *   * ABSENCE. `shapeNamed` answers null rather than a handle that says it is
 *     not there, and an index past the end throws rather than returning a
 *     handle that silently swallows writes. Both are what the language's own
 *     collections do.
 *
 * What is NOT translated is the shape of the API: the names, the arguments and
 * the fluency are the Ranger facade's, because that facade is what the
 * generated documentation describes. A wrapper that renamed things would need
 * its own documentation and the two would drift.
 */
"use strict";

const api = require("./dist/pptx_api.cjs");

/** A Ranger `buffer` from anything a caller is likely to hold. */
function toRanger(bytes) {
  if (bytes == null) throw new TypeError("expected bytes, got " + bytes);
  let ab;
  if (bytes instanceof ArrayBuffer) {
    ab = bytes;
  } else if (ArrayBuffer.isView(bytes)) {
    // A Node Buffer is a view onto a POOLED ArrayBuffer that holds other
    // people's data too, so the whole buffer must never be handed over —
    // byteOffset and byteLength are the slice that belongs to this value.
    ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  } else {
    throw new TypeError("expected a Uint8Array, Buffer or ArrayBuffer");
  }
  ab._view = new DataView(ab);
  return ab;
}

/** …and back. */
function fromRanger(buf) {
  if (!buf) return new Uint8Array(0);
  return new Uint8Array(buf);
}

/** One run of text: the unit that carries a font, a size, a weight, a colour. */
class Run {
  constructor(ref) { this._ = ref; }
  get exists() { return this._.exists(); }
  get text() { return this._.text(); }
  setText(s) { this._.setText(String(s)); return this; }
  /** The font this run NAMES — not necessarily the one a renderer has. */
  font(family, sizePt) { this._.font(String(family || ""), Number(sizePt) || 0); return this; }
  bold(on = true) { this._.bold(!!on); return this; }
  italic(on = true) { this._.italic(!!on); return this; }
  /** "4472C4" or "#4472C4". */
  color(hex) { this._.color(String(hex)); return this; }
}

/** One shape: a box, a picture, a group, a placeholder. */
class Shape {
  constructor(ref) { this._ = ref; }
  get exists() { return this._.exists(); }
  get name() { return this._.name(); }
  setName(s) { this._.setName(String(s)); return this; }
  /** A class a stylesheet can address. Repeatable; a class added twice is carried once. */
  addClass(...names) { for (const n of names) this._.addClass(String(n)); return this; }
  removeClass(...names) { for (const n of names) this._.removeClass(String(n)); return this; }
  hasClass(name) { return this._.hasClass(String(name)); }
  /** The id `#name` addresses. NOT `setName`, which is the PowerPoint object name. */
  setStyleId(id) { this._.setStyleId(String(id)); return this; }
  get styleId() { return this._.styleId(); }
  /** One property, inline. Nothing in any sheet can override it, `!important` included. */
  style(name, value) { this._.style(String(name), String(value)); return this; }
  /** "rect", "ellipse", "star5" — one of the 187 ECMA-376 preset geometries. */
  get preset() { return this._.preset(); }
  setPreset(name) { this._.setPreset(String(name)); return this; }
  get x() { return this._.x(); }
  get y() { return this._.y(); }
  get width() { return this._.width(); }
  get height() { return this._.height(); }
  get rotation() { return this._.rotation(); }
  /** Points from the slide's top left. */
  at(x, y) { this._.at(Number(x), Number(y)); return this; }
  size(w, h) { this._.size(Number(w), Number(h)); return this; }
  /** Degrees clockwise. */
  rotate(deg) { this._.rotate(Number(deg)); return this; }
  fill(hex) { this._.fill(String(hex)); return this; }
  noFill() { this._.noFill(); return this; }
  line(hex, widthPt = 0) { this._.line(String(hex), Number(widthPt)); return this; }
  noLine() { this._.noLine(); return this; }
  get text() { return this._.text(); }
  /** Replaces all the text, keeping the first run's formatting. */
  setText(s) { this._.setText(String(s)); return this; }
  /** "l" | "ctr" | "r" | "just" */
  align(how) { this._.align(String(how)); return this; }
  get paragraphCount() { return this._.paragraphCount(); }
  runCount(para) { return this._.runCount(para | 0); }
  run(para, index) { return new Run(this._.runAt(para | 0, index | 0)); }
  addRun(para, text) { return new Run(this._.addRun(para | 0, String(text))); }
}

class Slide {
  constructor(ref) { this._ = ref; }
  get exists() { return this._.exists(); }
  get width() { return this._.width(); }
  get height() { return this._.height(); }
  get shapeCount() { return this._.shapeCount(); }
  shape(i) {
    const ref = this._.shapeAt(i | 0);
    if (!ref.exists()) throw new RangeError("there is no shape " + i + " on this slide");
    return new Shape(ref);
  }
  /** The first shape with this name, or null. Templates name their boxes. */
  shapeNamed(name) {
    const ref = this._.shapeNamed(String(name));
    return ref.exists() ? new Shape(ref) : null;
  }
  /** Every shape, in the order they are drawn. */
  shapes() {
    const out = [];
    for (let i = 0; i < this.shapeCount; i++) out.push(new Shape(this._.shapeAt(i)));
    return out;
  }
  get text() { return this._.text(); }
  addTextBox(x, y, w, h, text = "") {
    return new Shape(this._.addTextBox(Number(x), Number(y), Number(w), Number(h), String(text)));
  }
  addShape(preset, x, y, w, h) {
    return new Shape(this._.addShape(String(preset), Number(x), Number(y), Number(w), Number(h)));
  }
  removeShape(i) { return this._.removeShape(i | 0); }
  background(hex) { this._.background(String(hex)); return this; }
  /** A class a stylesheet can address: `slide.review { … }`. */
  addClass(...names) { for (const n of names) this._.addClass(String(n)); return this; }
  /** The id `#name` addresses. */
  setStyleId(id) { this._.setStyleId(String(id)); return this; }
  /** One property, inline. No rule can beat it. */
  style(name, value) { this._.style(String(name), String(value)); return this; }
}

class Deck {
  constructor(deck) {
    if (!deck.ok) throw new Error(deck.error || "the deck could not be opened");
    this._ = deck;
  }
  get slideCount() { return this._.slideCount(); }
  get width() { return this._.width(); }
  get height() { return this._.height(); }
  setSize(w, h) { this._.setSize(Number(w), Number(h)); return this; }
  slide(i) {
    const ref = this._.slideAt(i | 0);
    if (!ref.exists()) throw new RangeError("there is no slide " + i + " in this deck");
    return new Slide(ref);
  }
  slides() {
    const out = [];
    for (let i = 0; i < this.slideCount; i++) out.push(new Slide(this._.slideAt(i)));
    return out;
  }
  addSlide() { return new Slide(this._.addSlide()); }
  removeSlide(i) { return this._.removeSlide(i | 0); }
  /**
   * CSS over the deck.
   *
   * Resolved when the deck is saved — or drawn, or `applyStyles()` is called —
   * rather than here, because a sheet is declarative and the boxes it
   * describes are usually created after it.
   */
  addStyleSheet(css) { this._.addStyleSheet(String(css)); return this; }
  /** Resolve the sheet now. Only needed to READ a styled value back. */
  applyStyles() { this._.applyStyles(); return this; }
  /** Properties a slide cannot honour and selectors this layer cannot read. */
  get styleWarnings() { return this._.styleWarnings(); }
  /** Every character in the deck. What a search index reads. */
  get text() { return this._.text(); }
  /**
   * Write it back. For a deck that was OPENED this writes over the package it
   * came from, so every part this API does not model — animations, embedded
   * workbooks, custom XML — is copied through byte for byte and only the
   * slides that changed are rewritten. For a created deck it is `saveNew`.
   */
  save() { return fromRanger(this._.save()); }
  /** A package built from the model alone. Anything unmodelled is gone. */
  saveNew() { return fromRanger(this._.saveNew()); }
}

const Pptx = {
  /** The version of this surface, not of the repository. */
  get version() { return api.PptxApi.version(); },
  /** Open a .pptx from its bytes. Throws if they are not a readable package. */
  open(bytes) { return new Deck(api.PptxApi.open(toRanger(bytes))); },
  /** An empty 16:9 deck with no slides. `addSlide` is the next call. */
  create() { return new Deck(api.PptxApi.create()); },
};

module.exports = { Pptx, Deck, Slide, Shape, Run, toRanger, fromRanger };
