/** @ranger/pptx/chart — a Vega specification onto a slide, as shapes. */
import type { Shape, Slide } from "./index";

export declare class Chart {
  constructor();
  /** Whether the last `addTo` worked. */
  readonly ok: boolean;
  /** Why it did not, when it did not. */
  readonly error: string;
  /** How many shapes the last chart became. */
  readonly shapeCount: number;

  /** What "sans-serif" is called on this deck. Calibri unless told otherwise. */
  font(family: string): this;
  /** How finely a curve is subdivided. Sixteen segments unless told otherwise. */
  curveSteps(n: number): this;

  /**
   * Compile `spec` and put it on `slide`, inside the box, in points. The
   * specification may be the JSON text or the object. Returns the group;
   * ungrouping it leaves the bars and the labels behind as shapes.
   */
  addTo(slide: Slide, spec: string | object, x: number, y: number, w: number, h: number): Shape;
}
