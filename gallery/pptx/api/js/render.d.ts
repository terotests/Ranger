/** @ranger/pptx/render — the same decks, drawn. */
import type { Bytes, Deck } from "./index";

export declare class Renderer {
  constructor();
  /** True once a face has been loaded. Nothing draws readably before that. */
  readonly ready: boolean;
  /** Why the last call produced nothing. */
  readonly error: string;
  /** Whether the last PDF carried the deck's pictures. */
  readonly imagesPrinted: boolean;

  /** Every face in a directory laid out like `gallery/pdf_writer/assets/fonts`. */
  useFontDir(dir: string): this;
  /** One named face from its bytes — the browser and build-server path. */
  addFont(family: string, bytes: Bytes): this;
  /** A face that joins the per-codepoint fallback pool without becoming a family. */
  addFace(bytes: Bytes): this;
  /** The 187 preset geometries, as `presets.txt`. */
  usePresets(text: string): this;
  /** The faces this repository ships, in fallback order. */
  static standardFaces(): string[];

  /** `scale` multiplies 96 dots per inch, not a pixel width. */
  toPng(deck: Deck, slide?: number, scale?: number): Uint8Array;
  /** One slide as a vector page at the slide's own size in points. */
  toPdf(deck: Deck, slide?: number): Uint8Array;
  /** The whole deck as one PDF, a page per slide, fonts embedded once. */
  toPdfDeck(deck: Deck): Uint8Array;
}
