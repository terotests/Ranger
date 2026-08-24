/**
 * @ranger/pptx/chart — a Vega or Vega-Lite specification onto a slide, as
 * shapes rather than as a picture.
 *
 * The third entry point, and separate from the other two for the reason the
 * other two are separate from each other: in Ranger an import is not lazy, so
 * the only way not to carry something is not to name it. `dist/pptx_api.cjs`
 * is a ZIP reader, an XML parser and a writer. `dist/pptx_api_render.cjs` adds
 * a rasterizer and fonts. This bundle adds Vela — a Vega and Vega-Lite
 * compiler, its expression language, its scales and its time zones — and a
 * build step that only fills in a template should carry none of it.
 *
 * What lands on the slide is DrawingML: `prstGeom` rectangles for the bars,
 * lines for the gridlines, `custGeom` for the areas and the wedges, text boxes
 * for the labels. So the chart scales without blurring, every bar is
 * selectable, the numbers are in the slide's text where a search and a screen
 * reader reach them, and the file is a fraction of the size of a PNG of it.
 *
 * A Deck or a Slide from the main entry point is accepted here because both
 * bundles were compiled from the same sources: the model class in one is the
 * model class in the other, and the handle is passed straight through.
 */
"use strict";

const chart = require("./dist/pptx_api_chart.cjs");
const { Shape } = require("./index.cjs");

class Chart {
  constructor() { this._ = new chart.PptxVega(); }

  /** Whether the last `addTo` worked. */
  get ok() { return this._.ok; }
  /** Why it did not, when it did not. */
  get error() { return this._.error; }
  /** How many shapes the last chart became. */
  get shapeCount() { return this._.shapeCount; }

  /**
   * What "sans-serif" is called on this deck.
   *
   * Vega names a CSS family and a slide names a font. Writing "sans-serif"
   * into a run leaves every reader to pick, which is the one outcome that
   * makes two people looking at the same deck see different charts. Calibri
   * unless told otherwise.
   */
  font(family) { this._.font(String(family)); return this; }

  /** How finely a curve is subdivided — an area's edge, a wedge, a smoothed line. */
  curveSteps(n) { this._.curveSteps(n | 0); return this; }

  /**
   * Compile `spec` and put it on `slide`, inside the box, in points.
   *
   * `spec` may be the JSON text or the object; an object is stringified here.
   * The chart keeps the aspect ratio the specification asked for and is
   * centred in the box, so state the size in the specification and the room
   * in the box.
   *
   * Returns the GROUP. Moving it moves the chart; ungrouping it in PowerPoint
   * leaves the bars and the labels behind as shapes, which is the point of
   * not shipping a picture.
   */
  addTo(slide, spec, x, y, w, h) {
    const text = typeof spec === "string" ? spec : JSON.stringify(spec);
    const ref = this._.addTo(slide._, text, Number(x), Number(y), Number(w), Number(h));
    if (!this._.ok) throw new Error(this._.error || "the chart could not be drawn");
    return new Shape(ref);
  }
}

module.exports = { Chart };
