/**
 * @ranger/pptx — open a .pptx, read it, change it, write it back.
 *
 * The document API is headless: no canvas, no fonts. Drawing lives behind
 * `@ranger/pptx/render`, whose bundle is five times the size.
 */

/** Anything a caller is likely to be holding bytes in. */
export type Bytes = Uint8Array | ArrayBuffer | ArrayBufferView;

/** A run of text: the unit that carries a font, a size, a weight and a colour. */
export declare class Run {
  readonly exists: boolean;
  readonly text: string;
  setText(s: string): this;
  /** The font this run NAMES — not necessarily the one a renderer has. */
  font(family: string, sizePt: number): this;
  bold(on?: boolean): this;
  italic(on?: boolean): this;
  /** "4472C4" or "#4472C4". */
  color(hex: string): this;
}

/** One shape on one slide. Shapes inside a group are not reachable. */
export declare class Shape {
  readonly exists: boolean;
  readonly name: string;
  setName(s: string): this;
  /** A class a stylesheet can address. A class added twice is carried once. */
  addClass(...names: string[]): this;
  removeClass(...names: string[]): this;
  hasClass(name: string): boolean;
  /** The id `#name` addresses — NOT `setName`, which is the PowerPoint object name. */
  setStyleId(id: string): this;
  readonly styleId: string;
  /** One property, inline. Nothing in any sheet overrides it, `!important` included. */
  style(name: string, value: string): this;
  /** One of the 187 ECMA-376 preset geometries: "rect", "ellipse", "star5". */
  readonly preset: string;
  setPreset(name: string): this;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  /** Points from the slide's top left. */
  at(x: number, y: number): this;
  size(w: number, h: number): this;
  /** Degrees clockwise. */
  rotate(deg: number): this;
  fill(hex: string): this;
  noFill(): this;
  line(hex: string, widthPt?: number): this;
  noLine(): this;
  readonly text: string;
  /** Replaces all the text, keeping the first run's formatting. */
  setText(s: string): this;
  align(how: "l" | "ctr" | "r" | "just"): this;
  readonly paragraphCount: number;
  runCount(para: number): number;
  run(para: number, index: number): Run;
  addRun(para: number, text: string): Run;
}

export declare class Slide {
  readonly exists: boolean;
  readonly width: number;
  readonly height: number;
  readonly shapeCount: number;
  /** Throws RangeError past the end. */
  shape(i: number): Shape;
  /** The first shape with this name, or null. Templates name their boxes. */
  shapeNamed(name: string): Shape | null;
  shapes(): Shape[];
  readonly text: string;
  addTextBox(x: number, y: number, w: number, h: number, text?: string): Shape;
  addShape(preset: string, x: number, y: number, w: number, h: number): Shape;
  removeShape(i: number): boolean;
  background(hex: string): this;
  /** A class a stylesheet can address: `slide.review { … }`. */
  addClass(...names: string[]): this;
  /** The id `#name` addresses. */
  setStyleId(id: string): this;
  /** One property, inline. No rule can beat it. */
  style(name: string, value: string): this;
}

export declare class Deck {
  readonly slideCount: number;
  readonly width: number;
  readonly height: number;
  setSize(w: number, h: number): this;
  /** Throws RangeError past the end. */
  slide(i: number): Slide;
  slides(): Slide[];
  addSlide(): Slide;
  removeSlide(i: number): boolean;
  /**
   * CSS over the deck. Resolved when the deck is saved or drawn, not here.
   *
   * `.class`, `#id`, an element name (`slide`, `shape`, `textBox`, `picture`,
   * `group`, `table`, `chart`, `paragraph`, `run`), the two combined, and the
   * descendant combinator. `font-*` and `color` inherit down to the runs;
   * `fill`, `stroke` and `stroke-width` do not. A fluent call always wins.
   */
  addStyleSheet(css: string): this;
  /** Resolve the sheet now. Only needed to READ a styled value back. */
  applyStyles(): this;
  /** Properties a slide cannot honour, and selectors this layer cannot read. */
  readonly styleWarnings: string[];
  /** Every character in the deck. What a search index reads. */
  readonly text: string;
  /**
   * Write it back. A deck that was OPENED is written over the package it came
   * from, so every part this API does not model — animations, embedded
   * workbooks, custom XML — is copied through byte for byte and only the
   * slides that changed are rewritten. A created deck falls back to `saveNew`.
   */
  save(): Uint8Array;
  /** A package built from the model alone. Anything unmodelled is gone. */
  saveNew(): Uint8Array;
}

export declare const Pptx: {
  /** The version of this surface, not of the repository. */
  readonly version: string;
  /** Throws if the bytes are not a readable .pptx package. */
  open(bytes: Bytes): Deck;
  /** An empty 16:9 deck with no slides. */
  create(): Deck;
};

export declare function toRanger(bytes: Bytes): ArrayBuffer;
export declare function fromRanger(buf: ArrayBuffer | null): Uint8Array;
