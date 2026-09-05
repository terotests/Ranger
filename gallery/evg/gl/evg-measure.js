// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The browser measures, EVG breaks the lines.
//
// PLAN_NATIVE_HOSTS.md S0, the web half. `EVGHostTextMeasurer` (Ranger) takes
// ONE function from the platform — width of a run, and a face's ascent,
// descent and line gap — and every layout in the compiled module then
// measures with it. This file is that function for a browser: a 2D canvas
// context and `measureText`, with the font shorthand built EXACTLY as the
// painters build theirs (`evg-webgl.js` and `evg-html.js` `fontSpec`), so the
// face the layout measured with is the face the atlas or the `<text>` node
// draws with. Before this, the layout measured with the advance table — one
// browser's sans, snapshotted once — and the painter drew with whatever this
// browser resolved, which is the gap S0 exists to close.
//
// It works in a Worker too (`OffscreenCanvas`), which is what S1 wants: the
// engine off the main thread, measuring where it lays out.
//
// WHAT IT DOES NOT DO. It does not decide which module to install into: a
// page that bundles several generated modules has several `EVGDefaultMeasurer`
// singletons — two copies of a class are two classes — and installs into
// each. `installCanvasMeasurer(modules)` takes the list.
//
// ONE FACT WORTH KNOWING. Canvas has no line gap. `fontBoundingBoxAscent` and
// `Descent` are the face's, but `line-height: normal` in CSS is ascent +
// descent + the face's lineGap, and the sans fallback's gap is real: 1.15em
// of line box against 1.117em of ascent + descent. So in a document the gap
// is measured off a hidden element with `line-height: normal`, once per face;
// in a worker there is no element, and the host says "unknown" (a negative
// number), which the Ranger side reads as zero.

const LRO = "\u202D", PDF = "\u202C";

/**
 * The family a command names, stripped of the `-Bold` suffix
 * `EVGElement.effectiveFontFamily` adds for a bold element. The suffix is a
 * convention for the TTF measurers (`FontManager` reads `Family-Bold` as the
 * bold face); a browser reads it as a family nobody has and falls to the
 * stack. The weight arrives separately, and that is what the browser uses.
 */
export function familyOf(name) {
  const f = name || "";
  return f.endsWith("-Bold") ? f.slice(0, -5) : f;
}

/**
 * Make a measurer for one compiled module and attach the browser to it.
 *
 * @param {object} mod  the generated module: `EVGHostTextMeasurer` and
 *                      `EVGDefaultMeasurer` are read off it
 * @param {object} [opts]
 * @param {string[]} [opts.fallback]  the families the browser may fall back
 *                      to, in order — the same list handed to the painter's
 *                      `setFontFallback`, so the two walks agree
 * @param {boolean} [opts.install=true]  make it the module's default
 * @returns {{ measurer: object, refresh: () => void, detach: () => void }}
 */
export function createCanvasMeasurer(mod, opts = {}) {
  if (!mod || typeof mod.EVGHostTextMeasurer !== "function") {
    throw new Error("evg-measure: the module has no EVGHostTextMeasurer — import EVGLayout.rgr (or EVGTextEngine.rgr) in the Ranger program");
  }
  const stackList = (opts.fallback || []).filter((f) => f && f.length).map((f) => `"${f}"`);
  stackList.push("sans-serif");
  const fallbackStack = stackList.join(", ");

  const ctx = makeContext();
  // Face metrics by font spec: the vertical numbers are a property of the
  // face at a size, not of any string, so three answers serve every run.
  const faces = new Map();
  let currentFont = "";

  const spec = (family, size, bold, italic) => {
    const fam = family && family.length ? `"${family}", ${fallbackStack}` : fallbackStack;
    return `${italic ? "italic " : ""}${bold ? "bold " : ""}${size}px ${fam}`;
  };

  const setFont = (s) => {
    if (s !== currentFont) {
      ctx.font = s;
      currentFont = s;
    }
  };

  const faceOf = (s, size) => {
    let f = faces.get(s);
    if (f) return f;
    setFont(s);
    // "Hg" rather than any run: the face's box is the same for every string.
    const m = ctx.measureText("Hg");
    const asc = m.fontBoundingBoxAscent || 0;
    const desc = m.fontBoundingBoxDescent || 0;
    f = { asc, desc, gap: normalGap(s, asc + desc, size) };
    faces.set(s, f);
    return f;
  };

  const metric = (kind, text, family, size, bold, italic) => {
    const s = spec(family, size, bold, italic);
    if (kind === 0) {
      if (!text) return 0;
      setFont(s);
      // The same bidi override the painters apply: EVG has already ordered
      // the runs, and a measurement that reorders inside one is a different
      // width from the one that will be drawn.
      return ctx.measureText(LRO + text + PDF).width;
    }
    const f = faceOf(s, size);
    if (kind === 1) return f.asc;
    if (kind === 2) return f.desc;
    return f.gap;
  };

  const measurer = new mod.EVGHostTextMeasurer();
  measurer.attach(metric, "canvas");
  if (opts.install !== false) mod.EVGDefaultMeasurer.install(measurer);

  return {
    measurer,
    /** A face finished loading (`document.fonts.ready`): forget what was
     *  measured with the fallback and move the key, so every engine holding
     *  this measurer measures again. */
    refresh() {
      faces.clear();
      currentFont = "";
      measurer.invalidate();
    },
    /** Back to the table. */
    detach() {
      measurer.detach();
      if (opts.install !== false) mod.EVGDefaultMeasurer.uninstall();
    },
  };
}

/**
 * The same, for every module a page bundles. Returns one handle whose
 * `refresh` refreshes them all — a page has one `document.fonts.ready`.
 */
export function installCanvasMeasurer(modules, opts = {}) {
  const list = Array.isArray(modules) ? modules : [modules];
  const made = list.map((m) => createCanvasMeasurer(m, opts));
  return {
    measurers: made.map((h) => h.measurer),
    refresh() { for (const h of made) h.refresh(); },
    detach() { for (const h of made) h.detach(); },
  };
}

// ---------------------------------------------------------------------------

function makeContext() {
  if (typeof document !== "undefined" && document.createElement) {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext("2d");
    if (ctx) return ctx;
  }
  if (typeof OffscreenCanvas !== "undefined") {
    const ctx = new OffscreenCanvas(8, 8).getContext("2d");
    if (ctx) return ctx;
  }
  throw new Error("evg-measure: no 2D canvas context available here");
}

// The line gap, from the one place a browser states it: the height of a
// line box at `line-height: normal`. Measured at the face's own size — the
// gap scales with the em, and rounding at a small size is what it is.
let probe = null;
function normalGap(fontSpec, ascPlusDesc, size) {
  if (typeof document === "undefined" || !document.body) return -1;
  if (!probe) {
    probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:absolute;left:-10000px;top:0;visibility:hidden;white-space:nowrap;line-height:normal;padding:0;border:0;margin:0;pointer-events:none";
    probe.textContent = "Hg";
    document.body.appendChild(probe);
  }
  probe.style.font = fontSpec;
  const h = probe.getBoundingClientRect().height;
  if (!(h > 0) || !(ascPlusDesc > 0)) return -1;
  const gap = h - ascPlusDesc;
  // A negative gap is a rounding artefact of a box measured in whole pixels
  // against metrics measured in fractions; a face has no negative gap.
  return gap > 0 ? gap : 0;
}
