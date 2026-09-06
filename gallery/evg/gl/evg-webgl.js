/**
 * evg-webgl.js — draw an EVG display list with WebGL 2.
 *
 * Input is what evg_displaylist_tool emits: a page size and a flat list of
 * commands in absolute pixels with colours already resolved. Nothing above
 * this file knows about GL, and nothing in this file knows about JSX, flex,
 * grid or fonts — that is the whole point of the seam.
 *
 * Drawing model
 * -------------
 * Every command is one quad. Rounded corners and borders are done in the
 * fragment shader with a signed distance function, so a rounded rect costs the
 * same two triangles as a square one and needs no tessellation:
 *
 *   sdRoundedBox(p, halfSize, r) = length(max(|p| - halfSize + r, 0)) - r
 *
 * A fill keeps the inside; a border keeps a band of `thickness` inside the
 * edge. Antialiasing is one fwidth() smoothstep, which is why the corners come
 * out clean at any radius without multisampling.
 *
 * Paint order
 * -----------
 * The list is in paint order and must stay that way, so it is split into RUNS:
 * consecutive quads that share the atlas are one instanced draw, and an image
 * — which needs its own texture bound — breaks the run and is drawn on its
 * own. Every run reads the same instance buffers, offset to its first
 * instance, because WebGL 2 has no base-instance parameter.
 *
 * Text
 * ----
 * The list carries the run, the face and the size — the positions are EVG's,
 * measured from the same TTF the PDF is set in. Only the glyph *images* come
 * from the platform: here a 2D canvas rasterizes each run into an atlas, which
 * is what a browser gives us for free. The SDL2 backend swaps that one piece
 * for the engine's own RasterText and keeps everything else.
 *
 * Images
 * ------
 * `object-fit: cover` is the only fit EVG's raster and PDF targets implement,
 * and it is done here the same way they do it — by cropping, not by squashing.
 * The crop is a UV rectangle computed from the source and box aspect ratios,
 * so the GPU samples the covered region directly and the quad stays two
 * triangles. A radius on the element clips the photo through the same distance
 * field the rectangles use.
 *
 * Vector paths
 * ------------
 * A path arrives already flattened into rings of points, in page coordinates —
 * the display list does the parsing and the viewBox arithmetic, so this file
 * carries no path parser. A FILL is drawn stencil-then-cover: each ring goes
 * into the stencil buffer as a triangle fan, then one quad over the path's
 * bounding box paints every pixel the rule says is inside. That handles holes
 * and both fill rules without a triangulator, and it is why the context needs a
 * stencil buffer. A STROKE is expanded to a quad per segment on the CPU, which
 * needs no stencil at all.
 *
 * Clips are scissor rectangles, intersected as they nest. Not yet: stroke
 * joins and caps are butt joints, which is invisible at the widths a chart uses.
 */

const KIND = {
  RECT: 0, BORDER: 1, IMAGE: 2, TEXT: 3, PUSH_CLIP: 4, POP_CLIP: 5,
  PATH: 6, STROKE: 7,
};

// aShape.z — what the fragment shader should do with this instance.
// TEXT paints the atlas as a coverage mask in the run's own colour, which is
// right for a glyph and wrong for a colour emoji: the browser draws 😊 in its
// own colours, and its ALPHA is the whole opaque face, so masking it with the
// run's colour gives a solid disc in the text colour. COLORTEXT samples the
// atlas's own pixels instead. Which one a run gets is decided by looking at
// what the browser actually drew — see `atlasIsColored`.
const MODE = { SHAPE: 0, TEXT: 1, IMAGE: 2, COLORTEXT: 3 };

const VERT = `#version 300 es
in vec2 aCorner;          // unit quad, 0..1
in vec4 aRect;            // x, y, w, h in page pixels
in vec4 aColor;           // rgba, 0..1
in vec4 aColor2;          // far gradient stop, rgba 0..1
in vec3 aShape;           // radius (top-left), thickness (0 = fill), mode
in vec4 aRadii;           // the four corners: TL, TR, BR, BL
in float aGrad;           // 0 = flat, 1 = down the box, 2 = across it
in vec4 aUV;              // u0,v0,u1,v1 — atlas slot, or the image's cover crop
in float aRot;            // radians
in vec3 aOrigin;          // pivot x, y, and 1 when the list named one
uniform vec2 uPage;
// How far the scroll layer this instance sits in has moved since its
// buffers were built. Zero for everything outside a layer, and for a frame
// drawn the moment it was built; a fling is this changing, and nothing else.
uniform vec2 uShift;
out vec4 vColor;
out vec4 vColor2;
out float vGrad;
out vec2 vT;              // 0..1 along the box, for the gradient
out vec2 vLocal;          // position within the rect, in pixels
out vec2 vHalf;
out vec4 vRadii;
out float vThickness;
out float vMode;
out vec2 vUV;
void main() {
  vec2 p = aRect.xy + uShift + aCorner * aRect.zw;
  // A rotated element turns about its own centre, which is what the PDF matrix
  // and the raster transform both do — an axis title on its side has to land in
  // the same place in all three.
  if (aRot != 0.0) {
    // What the quad turns ABOUT. aOrigin.z is 1 when the display list named a
    // point and 0 when it did not; without one the pivot is the quad's own
    // centre, which is right for a lone sideways label and wrong for a whole
    // element being turned. A box, its text and its children have to share one
    // pivot or they come apart -- and a text quad is sized to its ink, not to
    // the line box, so its own centre is nowhere near the element's.
    //
    // No backticks in here: this comment lives inside a JS template literal,
    // and one would end the shader source mid-word.
    vec2 c = (aOrigin.z > 0.5 ? aOrigin.xy : (aRect.xy + aRect.zw * 0.5)) + uShift;
    float s = sin(aRot), co = cos(aRot);
    vec2 d = p - c;
    p = c + vec2(d.x * co - d.y * s, d.x * s + d.y * co);
  }
  // Page space is y-down like every 2D layout engine; clip space is y-up.
  vec2 ndc = vec2((p.x / uPage.x) * 2.0 - 1.0, 1.0 - (p.y / uPage.y) * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
  vColor = aColor;
  vColor2 = aColor2;
  vGrad = aGrad;
  vT = aCorner;
  vHalf = aRect.zw * 0.5;
  vLocal = (aCorner - 0.5) * aRect.zw;
  vRadii = aRadii;
  vThickness = aShape.y;
  vMode = aShape.z;
  vUV = mix(aUV.xy, aUV.zw, aCorner);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec4 vColor;
in vec4 vColor2;
in float vGrad;
in vec2 vT;
in vec2 vLocal;
in vec2 vHalf;
in vec4 vRadii;
in float vThickness;
in float vMode;
in vec2 vUV;
uniform sampler2D uAtlas;
uniform sampler2D uImage;
out vec4 outColor;

// Four corners, picked by the quadrant the fragment is in. The radii arrive
// as (TL, TR, BR, BL) -- the order border-radius writes them in -- and one
// choice per axis narrows them to the corner that matters here. No backticks
// in this comment: the whole shader is a JS template literal.
float sdRoundedBox(vec2 p, vec2 b, vec4 r) {
  vec2 tb = (p.x > 0.0) ? vec2(r.y, r.z) : vec2(r.x, r.w); // right : left
  float rr = (p.y > 0.0) ? tb.y : tb.x;                     // bottom : top
  vec2 q = abs(p) - b + rr;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rr;
}

// The rounded-box coverage of this fragment, 0..1.
//
// fwidth() is a screen-space derivative, and it jumps across the diagonal seam
// of the triangle strip on a very large quad — which drew a visible hairline
// across the page background. Clamping keeps the edge one pixel soft no matter
// how big the quad is.
float boxCoverage(out float d) {
  // The clamp stays per corner: the display list already applies the CSS
  // scale-down, so this only catches a caller that hands over a radius no box
  // could hold.
  float lim = min(vHalf.x, vHalf.y);
  vec4 r = min(vRadii, vec4(lim));
  d = sdRoundedBox(vLocal, vHalf, r);
  float aa = clamp(fwidth(d), 0.35, 1.5);
  return smoothstep(aa, -aa, d);
}

void main() {
  if (vMode > 2.5) {
    // Text the browser drew in colours of its own — a colour emoji. The atlas
    // holds the finished pixels, so they are sampled rather than reduced to a
    // coverage mask; only the run's opacity still applies.
    vec4 glyph = texture(uAtlas, vUV);
    if (glyph.a <= 0.001) discard;
    outColor = vec4(glyph.rgb, glyph.a * vColor.a);
    return;
  }
  if (vMode > 1.5) {
    // Image: the UV rectangle already carries the object-fit crop, so this is
    // a plain sample. The radius still applies — a photo in a rounded box is
    // clipped by the same distance field the box itself is drawn with.
    vec4 tex = texture(uImage, vUV);
    float d;
    float cov = boxCoverage(d);
    if (cov <= 0.001) discard;
    outColor = vec4(tex.rgb, tex.a * cov);
    return;
  }
  if (vMode > 0.5) {
    // The atlas holds coverage in the alpha channel; the colour is the run's.
    float cov = texture(uAtlas, vUV).a;
    if (cov <= 0.001) discard;
    outColor = vec4(vColor.rgb, vColor.a * cov);
    return;
  }
  float d;
  float alpha = boxCoverage(d);
  // A two-stop linear gradient, mixed the way the software canvas mixes it:
  // straight down the box, or straight across when the fill said so.
  vec4 base = vColor;
  if (vGrad > 0.5) {
    base = mix(vColor, vColor2, clamp(vGrad > 1.5 ? vT.x : vT.y, 0.0, 1.0));
  }
  if (vThickness > 0.0) {
    // Keep a band just inside the edge.
    float inner = -vThickness;
    float aa = clamp(fwidth(d), 0.35, 1.5);
    alpha = alpha * smoothstep(inner - aa, inner + aa, d);
  }
  if (alpha <= 0.001) discard;
  outColor = vec4(base.rgb, base.a * alpha);
}`;

// Paths are drawn as plain triangles in page space with one colour per draw:
// a fill covers its own bounding box through the stencil, a stroke is the quads
// its segments expand to.
const PATH_VERT = `#version 300 es
in vec2 aPos;
uniform vec2 uPage;
uniform vec2 uShift;
void main() {
  vec2 p = aPos + uShift;
  vec2 ndc = vec2((p.x / uPage.x) * 2.0 - 1.0, 1.0 - (p.y / uPage.y) * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
}`;

const PATH_FRAG = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 outColor;
void main() { outColor = uColor; }`;

/** The rings of a path command, as flat [x,y,…] arrays. */
function ringsOf(c) {
  const out = [];
  const pts = c.pts || [];
  const ends = c.ends || [];
  let start = 0;
  for (const end of ends) {
    if (end - start >= 4) out.push(pts.slice(start, end));
    start = end;
  }
  return out;
}

/** A stroke's quads: one per segment, butt-jointed. */
function strokeTriangles(rings, width) {
  const half = Math.max(width, 0.75) / 2;
  const tris = [];
  for (const ring of rings) {
    for (let i = 0; i + 3 < ring.length; i += 2) {
      const x1 = ring[i], y1 = ring[i + 1], x2 = ring[i + 2], y2 = ring[i + 3];
      let dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      // The normal, scaled to half the stroke width.
      const nx = (-dy / len) * half, ny = (dx / len) * half;
      tris.push(
        x1 + nx, y1 + ny, x2 + nx, y2 + ny, x2 - nx, y2 - ny,
        x1 + nx, y1 + ny, x2 - nx, y2 - ny, x1 - nx, y1 - ny,
      );
    }
  }
  return tris;
}

function boundsOf(rings) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const ring of rings) {
    for (let i = 0; i + 1 < ring.length; i += 2) {
      if (ring[i] < x0) x0 = ring[i];
      if (ring[i] > x1) x1 = ring[i];
      if (ring[i + 1] < y0) y0 = ring[i + 1];
      if (ring[i + 1] > y1) y1 = ring[i + 1];
    }
  }
  return [x0, y0, x1, y1];
}

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error("shader: " + gl.getShaderInfoLog(s));
  }
  return s;
}

/**
 * Fetch and upload every distinct image the list refers to.
 *
 * Separate from rendering, and async, because a texture cannot be bound until
 * its bytes have arrived — and the whole page would otherwise draw once with
 * holes where the photos go. Call it, await it, then render.
 *
 * A `src` that will not load resolves to null rather than rejecting: one
 * missing photo should leave a gap in the page, not an empty canvas.
 */
export async function loadImages(doc, opts = {}) {
  const base = opts.base || "";
  const srcs = [...new Set(doc.list.cmds.filter((c) => c.k === KIND.IMAGE && c.src).map((c) => c.src))];
  const out = new Map();
  await Promise.all(
    srcs.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            out.set(src, img);
            resolve();
          };
          img.onerror = () => {
            out.set(src, null);
            resolve();
          };
          img.src = base + src;
        })
    )
  );
  return out;
}

/**
 * Rasterize each text run into one atlas texture.
 *
 * A run per slot rather than a glyph per slot: EVG has already decided where
 * each run sits and how wide it is, so the backend does not need to shape
 * anything — it needs a picture of the run. That also keeps kerning exactly as
 * EVG measured it, since the same string goes to the rasterizer whole.
 */
/**
 * What makes two text runs the same GLYPHS. Everything that changes the
 * rasterized shape is in here and nothing else is — a run that moved, or
 * changed colour, draws the same picture from the same slot.
 *
 * The atlas used to be keyed by the command OBJECT, which made it impossible
 * to reuse between frames: a display list arrives as fresh JSON every time, so
 * every object is new and every glyph was rasterized and uploaded again. Sixty
 * times a second.
 */

/**
 * A run of display-list text, wrapped so the browser lays it out verbatim.
 *
 * `fillText` is not a glyph blitter: it runs the bidirectional algorithm over
 * whatever it is given. That is right for logical text and wrong for ours —
 * the display list is in VISUAL order already, reordered and shaped by
 * OfficeText on the way in, so the browser reordered a second time and put
 * every right-to-left line back into the order it was stored in. Letters
 * joined correctly (shaped once) and words ran backwards (reordered twice),
 * which is exactly how it was reported.
 *
 * The producer has to own the ordering because it is the only party that sees
 * a LINE: a line that changes colour partway along becomes several text
 * commands at computed x positions, and a browser asked to lay out each of
 * them on its own would reorder each in isolation — the same bug one level
 * down. So the fix is to stop the browser reordering: U+202D LEFT-TO-RIGHT
 * OVERRIDE forces every character to level 0, and U+202C pops it.
 *
 * Applied to every run, not only the ones with Arabic in them. It is a no-op
 * for Latin, it keeps measurement and rasterization on identical strings, and
 * an unconditional rule is one a future backend cannot half-implement.
 */
const LRO = "\u202D", PDF = "\u202C";
export const verbatim = (t) => LRO + t + PDF;

/** The families the browser may fall back to, after the one a command names.
 *
 *  It matters because our own FontManager falls back per CODEPOINT across
 *  every loaded face — that is how an emoji, a geometric bullet or an Arabic
 *  letter gets drawn at all when the text face has no glyph for it — and every
 *  width in the layout was measured through that walk. A canvas that ends its
 *  font list at `sans-serif` answers those same codepoints from whatever the
 *  system has, so the glyphs appear (looking fine) at widths nobody measured.
 *
 *  A page sets this to its own pool, in the order it loaded the faces, so the
 *  two walks agree. Default is what it always was.
 */
let fallbackStack = "sans-serif";
export function setFontFallback(families) {
  const list = (families || []).filter((f) => f && f.length).map((f) => `"${f}"`);
  list.push("sans-serif");
  fallbackStack = list.join(", ");
}

/** One place that turns a TEXT command into a CSS font shorthand — it was
 *  written twice, once for measuring and once for rasterizing, and the two
 *  had to stay identical or a run was drawn at a size it was not measured at.
 */
// The family less the `-Bold` suffix `effectiveFontFamily` writes for a bold
// element — a convention for the TTF measurers, and to a browser a family
// nobody has. The weight is given separately. `evg-measure.js` strips the
// same suffix, so the layout measured with the face this draws with.
const familyOf = (c) => (c.font && c.font.endsWith("-Bold") ? c.font.slice(0, -5) : c.font || "");

function fontSpec(c, dpr) {
  return `${c.italic ? "italic " : ""}${c.weight ? c.weight + " " : ""}${c.size * dpr}px "${familyOf(c)}", ${fallbackStack}`;
}

function runKey(c, dpr) {
  return `${dpr}|${c.font || ""}|${c.size}|${c.weight || ""}|${c.italic ? 1 : 0}|${c.text}`;
}

/** The runs an atlas holds: every distinct run, or — `onlyVisible` — only
 *  those that touch the page, when the whole list would not fit a texture. */
function atlasRuns(cmds, dpr, view, onlyVisible) {
  const seen = new Set();
  const runs = [];
  for (const c of cmds) {
    if (c.k !== KIND.TEXT || !c.text) continue;
    if (onlyVisible && view) {
      const w = c.w || 0, h = c.h || (c.size || 0) * 1.5;
      if (c.x > view.w || c.y > view.h || c.x + w < 0 || c.y + h < 0) continue;
    }
    const key = runKey(c, dpr);
    if (seen.has(key)) continue;
    seen.add(key);
    runs.push(c);
  }
  return runs;
}

const nextPow2 = (n) => { let p = 1; while (p < n) p *= 2; return p; };

// The empty border around a slot, so the linear filter never samples a
// neighbour's ink.
const PAD = 2;

/** One run, measured with the face it will be drawn in. */
function measureRun(ctx, c, dpr) {
  ctx.font = fontSpec(c, dpr);
  const m = ctx.measureText(verbatim(c.text));
  // Two different ascents, and the difference between them is the whole of
  // where a run sits. `actualBoundingBox*` is the INK of these particular
  // letters — "moon" has no ascender and no descender, "Ãg" has both — and
  // is what the slot has to be big enough to hold. `fontBoundingBoxAscent`
  // is the FACE's ascent, the same number for every string in the font, and
  // is what EVG means: a TEXT command's y is the top of the line box, and
  // the baseline sits one face-ascent below it. Placing the ink at y
  // instead pushed every run up by the height of the empty space above its
  // capitals — a couple of pixels for a caption, most of a line for a
  // heading — which in a spreadsheet is text climbing out of its row.
  const asc = m.actualBoundingBoxAscent || c.size * dpr * 0.8;
  const desc = m.actualBoundingBoxDescent || c.size * dpr * 0.25;
  const faceAsc = m.fontBoundingBoxAscent || (c.h ? c.h * dpr * 0.78 : c.size * dpr * 1.05);
  // The face's DESCENT, needed for the half-leading — the line box holds the
  // whole face, not just the part above the baseline.
  const faceDesc = m.fontBoundingBoxDescent || c.size * dpr * 0.212;
  return { c, w: Math.ceil(m.width) + PAD * 2, h: Math.ceil(asc + desc) + PAD * 2, asc, faceAsc, faceDesc };
}

/**
 * The atlas is a SHELF: rows of slots, left to right, top to bottom, and a
 * cursor at the end of the last row. A new run goes after the cursor or
 * starts the next row. The cursor is KEPT between frames — that is what lets
 * a frame add the runs it is the first to show behind the ones already there
 * instead of laying every run out again.
 */
function shelfOf(w, limit) {
  return { w, limit, x: 0, y: 0, rowH: 0 };
}

/** Place one measured run on the shelf. False when it would pass the limit,
 *  and false for a run WIDER THAN THE SHELF: placed at x=0 and uploaded up to
 *  the texture's edge, such a run kept a slot whose u1 ran past 1.0, and
 *  CLAMP_TO_EDGE answered every sample beyond the edge with the last column
 *  of ink — a horizontal streak, in the text's colour, running on from where
 *  the glyphs stopped. Seen on the timeline's descriptions on a Retina Mac,
 *  whose face was wider than the 512px atlas the first frame's short runs had
 *  sized. Refusing here makes `appendRuns` hand back false, and the atlas is
 *  rebuilt at the width its widest run needs. */
function placeRun(shelf, m) {
  if (m.w > shelf.w) return false;
  if (shelf.x + m.w > shelf.w) { shelf.x = 0; shelf.y += shelf.rowH; shelf.rowH = 0; }
  if (shelf.y + m.h > shelf.limit) return false;
  m.x = shelf.x;
  m.y = shelf.y;
  shelf.x += m.w;
  shelf.rowH = Math.max(shelf.rowH, m.h);
  return true;
}

/** How tall a shelf's rows are so far, as a texture height. */
const shelfHeight = (shelf) => nextPow2(Math.max(64, shelf.y + shelf.rowH));

function slotOf(m, dpr, texW, texH, colored) {
  return {
    u0: m.x / texW, v0: m.y / texH,
    u1: (m.x + m.w) / texW, v1: (m.y + m.h) / texH,
    w: m.w / dpr, h: m.h / dpr, asc: m.asc / dpr, pad: PAD / dpr,
    faceAsc: m.faceAsc / dpr, faceDesc: m.faceDesc / dpr,
    colored,
  };
}

function rasterRuns(c2, measured, dpr) {
  c2.textBaseline = "alphabetic";
  c2.fillStyle = "#fff";
  for (const m of measured) {
    c2.font = fontSpec(m.c, dpr);
    c2.fillText(verbatim(m.c.text), m.x + PAD, m.y + PAD + m.asc);
  }
}

/**
 * Every run in the list, rasterized from scratch — what the first frame does,
 * and what a frame does when the shelf is full.
 *
 * Packed in rows. A list with more text than one texture holds — a long feed
 * of cards, most of it scrolled away — used to ask for a texture taller than
 * the card allows and get nothing back, so every run drew as a solid box.
 * Now the atlas widens up to the card's limit, then keeps only the runs that
 * touch the page (the rest are not drawn anyway), and as a last resort drops
 * what still does not fit.
 */
function buildTextAtlas(cmds, dpr, view, maxTex) {
  let runs = atlasRuns(cmds, dpr, view, false);
  let culled = false;
  const limit = Math.max(2048, maxTex || 2048);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!runs.length) return { canvas: null, slots: new Map(), culled, shelf: shelfOf(Math.min(2048, limit), limit) };
  const measure = (c) => measureRun(ctx, c, dpr);
  // Every run on a shelf, however tall that makes it — the fits are judged
  // after, against the limit.
  const pack = (list, atlasW) => {
    const shelf = shelfOf(atlasW, Infinity);
    for (const m of list) {
      // A run wider than the widest texture the card allows is CUT, and cut
      // honestly: the slot's width is what will be rasterised, so the quad
      // ends where the glyphs end instead of sampling past the texture's
      // edge. `fullW` keeps the measured width across the repacks below.
      if (m.fullW === undefined) m.fullW = m.w;
      m.w = Math.min(m.fullW, atlasW);
      placeRun(shelf, m);
    }
    shelf.limit = limit;
    return shelf;
  };
  let measured = runs.map(measure);
  let atlasW = Math.min(2048, nextPow2(Math.max(512, ...measured.map((m) => m.w))));
  let shelf = pack(measured, atlasW);
  while (shelfHeight(shelf) > limit && atlasW < limit) {
    atlasW = Math.min(limit, atlasW * 2);
    shelf = pack(measured, atlasW);
  }
  if (shelfHeight(shelf) > limit && view) {
    runs = atlasRuns(cmds, dpr, view, true);
    culled = true;
    measured = runs.map(measure);
    shelf = pack(measured, atlasW);
  }
  while (shelfHeight(shelf) > limit && measured.length > 1) {
    measured = measured.slice(0, Math.max(1, Math.floor(measured.length / 2)));
    culled = true;
    shelf = pack(measured, atlasW);
  }
  canvas.width = atlasW;
  canvas.height = Math.min(limit, shelfHeight(shelf));
  const c2 = canvas.getContext("2d");
  c2.clearRect(0, 0, canvas.width, canvas.height);
  rasterRuns(c2, measured, dpr);
  const slots = new Map();
  for (const m of measured) {
    const s = slotOf(m, dpr, canvas.width, canvas.height, false);
    s._px = m.x; s._py = m.y; s._pw = m.w; s._ph = m.h;
    slots.set(runKey(m.c, dpr), s);
  }
  markColoredSlots(c2, slots);
  return { canvas, slots, culled, shelf };
}

/** Whether a cell of pixels holds anything but white ink. Every other pixel
 *  each way — enough to catch a sticker, cheap enough not to matter. */
function inkIsColored(data, W, x0, y0, x1, y1) {
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 24) continue;
      // White is what a masked glyph is. Anything meaningfully off it was
      // painted by the browser and has to keep its own pixels.
      if (data[i] < 232 || data[i + 1] < 232 || data[i + 2] < 232) return true;
    }
  }
  return false;
}

/**
 * Which atlas cells the browser drew in colours of its own.
 *
 * Everything here is drawn with `fillStyle = "#fff"`, so a glyph comes out
 * white with the shape carried in the alpha — a coverage mask, which is what
 * the text shader expects. A colour emoji ignores the fill style: the browser
 * paints its own bitmap, and its alpha is the whole opaque sticker. Masked
 * with the run's colour that is a solid blob — a red disc where a smiling
 * face should be, which is exactly how this was reported.
 *
 * There is no reliable way to ask ahead of time whether a string will come out
 * coloured: it depends on the codepoints, the font stack and the platform, and
 * the emoji ranges alone get it wrong in both directions. So this reads back
 * what was actually drawn. One `getImageData` over the whole atlas, on the
 * rare frames that build one, and every fourth pixel of each cell — enough to
 * catch a sticker, cheap enough not to matter.
 */
export function markColoredSlots(c2, slots) {
  let img;
  try {
    img = c2.getImageData(0, 0, c2.canvas.width, c2.canvas.height);
  } catch (_) {
    return;                       // a tainted or zero-sized canvas: leave them all as masks
  }
  const data = img.data, W = img.width;
  for (const s of slots.values()) {
    const x0 = s._px | 0, y0 = s._py | 0;
    const x1 = Math.min(W, x0 + Math.ceil(s._pw));
    const y1 = Math.min(img.height, y0 + Math.ceil(s._ph));
    s.colored = inkIsColored(data, W, x0, y0, x1, y1);
    delete s._px; delete s._py; delete s._pw; delete s._ph;
  }
}

/**
 * The UV rectangle that makes a source of `sw`×`sh` cover a box of `bw`×`bh`.
 *
 * This is `object-fit: cover`: fill the box and crop the overflow, centred,
 * rather than distort the picture. Cropping in UV space means the GPU samples
 * only what is shown, so the quad stays two triangles whatever the aspect
 * mismatch.
 */
function coverUV(sw, sh, bw, bh) {
  if (!sw || !sh || !bw || !bh) return [0, 0, 1, 1];
  const src = sw / sh, box = bw / bh;
  if (src > box) {
    const f = box / src;          // source is wider: crop left and right
    return [(1 - f) / 2, 0, 1 - (1 - f) / 2, 1];
  }
  const f = src / box;            // source is taller: crop top and bottom
  return [0, (1 - f) / 2, 1, 1 - (1 - f) / 2];
}

function makeTexture(gl, source) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

/**
 * The two programs, compiled once per context and kept.
 *
 * They used to be built on every call — two `compileShader`s, two
 * `linkProgram`s and the `getShaderParameter` / `getProgramParameter` that go
 * with them, sixty times a second. Those queries are SYNCHRONOUS: asking for
 * COMPILE_STATUS makes the CPU wait for the driver to finish the compile it
 * had every right to defer. In a Chrome profile of the code editor it was
 * 160 ms of a 440 ms window — 36% of the frame, spent recompiling two shaders
 * that had not changed since the page loaded.
 *
 * Keyed by the context, so a page with two canvases gets two sets and a
 * context that is thrown away takes its programs with it.
 */
const PROGRAMS = new WeakMap();
const ATLASES = new WeakMap();
const IMAGE_TEXTURES = new WeakMap();

/**
 * Make room on a kept atlas: a taller bitmap with the old one drawn at its
 * top, a texture uploaded from it, and every slot's v rescaled to the new
 * height. Doubling, so it happens a handful of times in the life of a page.
 */
function growAtlas(gl, have, texH) {
  const big = document.createElement("canvas");
  big.width = have.texW;
  big.height = texH;
  const ctx = big.getContext("2d");
  ctx.clearRect(0, 0, big.width, big.height);
  ctx.drawImage(have.bitmap, 0, 0);
  const scale = have.texH / texH;
  for (const s of have.slots.values()) {
    s.v0 *= scale;
    s.v1 *= scale;
  }
  have.bitmap = big;
  have.ctx = ctx;
  have.texH = texH;
  gl.deleteTexture(have.tex);
  have.tex = makeTexture(gl, big);
}

/**
 * The runs a frame shows for the first time, added behind the ones the atlas
 * already holds. Each new slot is rasterized, read back once — the read
 * serves both the colour check and the upload — and sent to the card as a
 * sub-image; nothing already on the atlas is touched. False when the shelf
 * cannot take them, which is the caller's cue to start a fresh one.
 */
function appendRuns(gl, have, runs, dpr) {
  const measured = runs.map((c) => measureRun(have.ctx, c, dpr));
  const shelf = { ...have.shelf };
  for (const m of measured) {
    if (!placeRun(shelf, m)) return false;
  }
  const needH = Math.min(shelf.limit, shelfHeight(shelf));
  if (needH > have.texH) growAtlas(gl, have, needH);
  have.shelf = shelf;
  const c2 = have.ctx;
  rasterRuns(c2, measured, dpr);
  gl.bindTexture(gl.TEXTURE_2D, have.tex);
  for (const m of measured) {
    const w = Math.min(m.w, have.texW - m.x);
    const h = Math.min(m.h, have.texH - m.y);
    let colored = false;
    if (w > 0 && h > 0) {
      let img = null;
      try {
        img = c2.getImageData(m.x, m.y, w, h);
      } catch (_) {
        img = null;               // a tainted canvas: the slot stays a mask, and is uploaded whole
      }
      if (img) {
        colored = inkIsColored(img.data, img.width, 0, 0, img.width, img.height);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, m.x, m.y, gl.RGBA, gl.UNSIGNED_BYTE, img);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, have.bitmap);
      }
    }
    have.slots.set(runKey(m.c, dpr), slotOf(m, dpr, have.texW, have.texH, colored));
  }
  return true;
}

/**
 * The text atlas for this context, ADDED TO as the page shows new text and
 * rebuilt only when it is full.
 *
 * It used to be keyed by every distinct run in the list, in order, and
 * rebuilt whole whenever that key changed. On a static page the key never
 * changed and the atlas was free; on a SCROLLING one it changed on every
 * frame, because the list is culled to the viewport and every scroll brings
 * a row in and takes one out — so every scroll frame rasterized every run on
 * the page onto a 2-D canvas, read the whole canvas back to find the colour
 * emoji, and uploaded it to the card. In a Chrome profile of a fling that
 * was a fifth of the frame, and it is what the fling stuttered on.
 *
 * Now a frame asks for the runs it holds that the atlas does not — usually
 * none, and on the frame a new row arrives, that row's — and those alone are
 * drawn, read back and uploaded. What it does NOT include is where the runs
 * are or what colour they are, because neither changes a glyph. Runs that
 * scroll away stay on the shelf, and are there when the page scrolls back;
 * when the shelf is full the atlas starts again from the runs on the screen.
 *
 * A list too big for one texture even alone falls back to the old scheme:
 * an atlas of the runs that touch the page, keyed by them and rebuilt when
 * they change. `culled` says which regime is in force.
 */
function atlasFor(gl, cmds, dpr, view) {
  const have = ATLASES.get(gl);
  if (have && !have.culled) {
    const missing = [];
    const seen = new Set();
    for (const c of cmds) {
      if (c.k !== KIND.TEXT || !c.text) continue;
      const key = runKey(c, dpr);
      if (have.slots.has(key) || seen.has(key)) continue;
      seen.add(key);
      missing.push(c);
    }
    if (!missing.length) {
      have.rebuilt = false;
      have.added = 0;
      return have;
    }
    if (have.bitmap && appendRuns(gl, have, missing, dpr)) {
      have.rebuilt = false;
      have.added = missing.length;
      return have;
    }
  }
  const keyOf = () => atlasRuns(cmds, dpr, view, true).map((c) => runKey(c, dpr)).join("|");
  if (have && have.culled && have.key === keyOf()) {
    have.rebuilt = false;
    have.added = 0;
    return have;
  }
  if (have && have.tex) gl.deleteTexture(have.tex);
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
  const { canvas, slots, culled, shelf } = buildTextAtlas(cmds, dpr, view, maxTex);
  const made = {
    key: culled ? keyOf() : null,
    culled,
    slots,
    shelf,
    bitmap: canvas,
    ctx: canvas ? canvas.getContext("2d") : null,
    texW: canvas ? canvas.width : 1,
    texH: canvas ? canvas.height : 1,
    // Reported in the stats: rebuilding the atlas means rasterising every run
    // on the page and uploading it, and doing that on a frame where nothing
    // about the text changed is the waste this cache exists to stop; adding
    // means the runs that were new. A test can watch them; a timing number
    // on a software GL driver cannot.
    rebuilt: true,
    added: slots.size,
    tex: canvas ? makeTexture(gl, canvas) : makeTexture(gl, new ImageData(1, 1)),
  };
  ATLASES.set(gl, made);
  return made;
}

/**
 * One GL texture per image source, for the life of the context. Uploading the
 * same picture again every frame is pure cost — the code before this cache
 * both re-uploaded and leaked one texture per image per frame.
 *
 * The entry remembers WHICH image it was made from, and that is not a detail.
 * A src here is a name inside a document — `ppt/media/image1.png` — and a
 * second document names its own first picture exactly the same. Keying on the
 * name alone, the cache answered a newly opened file with the previous file's
 * textures: open one deck, open another, and slide 1 still showed the logo of
 * the deck before it. So a changed image object re-uploads, and the texture it
 * replaces is deleted rather than left on the card.
 */
function textureCacheFor(gl, images) {
  let cache = IMAGE_TEXTURES.get(gl);
  if (!cache) {
    cache = new Map();
    IMAGE_TEXTURES.set(gl, cache);
  }
  let uploaded = 0;
  for (const [src, img] of images) {
    if (!img) continue;
    const have = cache.get(src);
    if (have && have.img === img) continue;
    if (have && have.tex) gl.deleteTexture(have.tex);
    cache.set(src, { tex: makeTexture(gl, img), w: img.naturalWidth, h: img.naturalHeight, img });
    uploaded += 1;
  }
  cache.uploaded = uploaded;
  return cache;
}

/**
 * Forget every image texture on this context. A host that closes a document
 * does not have to call this — a changed image re-uploads on its own — but a
 * host that unloads one without opening another can hand the card's memory
 * back instead of holding it until the context dies.
 */
export function dropImageTextures(gl) {
  const cache = IMAGE_TEXTURES.get(gl);
  if (!cache) return 0;
  let dropped = 0;
  for (const entry of cache.values()) {
    if (entry && entry.tex) {
      gl.deleteTexture(entry.tex);
      dropped += 1;
    }
  }
  cache.clear();
  return dropped;
}

// ---------------------------------------------------------------------------
// backdrop-filter: blur()
// ---------------------------------------------------------------------------
// What CSS does here is measured in `../oracle/css-blur.json`, and two of the
// findings decide this whole implementation:
//
//   THE KERNEL IS NOT A GAUSSIAN. `blur(r)` is the SVG filter spec's
//   three-box approximation with sigma = r — three box passes of width
//   d = floor(sigma * 3 * sqrt(2*pi) / 4 + 0.5). Fitted against a real browser
//   at three radii the three-box model is within half a luminance level
//   everywhere; a true Gaussian with the same sigma is out by up to 14. The
//   common belief is half right: the sigma is the radius, and the shape is not
//   a Gaussian.
//
//   THE BACKDROP IS THE ELEMENT'S OWN REGION, EDGE-CLAMPED. Not the page
//   behind it: what a browser blurs is the rectangle under the element and
//   nothing outside it, with samples that fall off the edge taking the border
//   pixel's value.
//
//   This one was got backwards first. A flat grey behind a pane comes out flat
//   to the border — no rim — and that was read as proof that the backdrop is
//   sampled past the edge. It is not proof of anything: a uniform field is
//   uniform under either rule. The case that decides is a feature that
//   straddles the border, and it is decisive: white page, black stripe
//   starting exactly at the pane's left edge, and the row across reads
//   255 255 255 | 0 0 0 with NO ramp at the border at all — while the same
//   black/white boundary 100px further in, INSIDE the pane, gets the full
//   smooth ramp. Outside content does not enter. Edge samples clamp.
//
//   So the copy is exactly the element's box, and CLAMP_TO_EDGE does the rest.
//   Growing the copy by the kernel's reach — which is what this did first —
//   bleeds the page into the pane's border and is visibly wrong over anything
//   that is not flat.
//
// Three passes across and three down, separably, ping-ponging between two
// framebuffers: nine texture reads per pixel per axis at worst, instead of the
// d*d of the direct form.
const BLUR_VERT = `#version 300 es
in vec2 aCorner;
out vec2 vUV;
void main() {
  vUV = aCorner;
  gl_Position = vec4(aCorner * 2.0 - 1.0, 0.0, 1.0);
}`;

// One box pass along `uStep`, which is one texel across or one down. The box
// is centred for an odd width; for an even one the spec offsets two of the
// three passes by half a texel and widens the third, and `uOffset` carries
// that — which is what keeps the result symmetric instead of creeping one way.
const BLUR_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uSrc;
uniform vec2 uStep;
uniform float uWidth;
uniform float uOffset;
out vec4 outColor;
void main() {
  // Named mid and not h-a-l-f: that is a reserved word in GLSL ES 3.00 and the
  // shader will not compile with it. And no backticks in this comment either —
  // it lives inside a template literal, and one would end the shader here.
  float mid = floor(uWidth * 0.5);
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 129; i++) {
    if (float(i) >= uWidth) break;
    float k = float(i) - mid + uOffset;
    // No clamp of our own: the target is exactly the copied region, so the
    // sampler's own CLAMP_TO_EDGE is the measured rule — a sample that falls
    // off the element takes the border pixel's value.
    acc += texture(uSrc, vUV + uStep * k);
  }
  outColor = acc / uWidth;
}`;

// The blurred region, drawn back over the page and clipped to the element's
// rounded box. Three things a vertex needs, and they are three different
// spaces, which is why this does not reuse BLUR_VERT: where the quad goes
// (clip space), which part of the padded texture it reads (a sub-rect, since
// the texture holds the box PLUS the kernel's reach), and where the fragment
// sits inside the box (0..1, for the rounding).
const BACKDROP_VERT = `#version 300 es
in vec2 aPos;
in vec2 aUV;
in vec2 aCorner;
out vec2 vUV;
out vec2 vCorner;
void main() {
  vUV = aUV;
  vCorner = aCorner;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// The rounding is the same distance field the solid shapes use, so a blurred
// pane and a plain one have the same corner.
const BACKDROP_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
in vec2 vCorner;
uniform sampler2D uSrc;
uniform vec2 uHalf;
uniform float uRadius;
out vec4 outColor;
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main() {
  vec2 local = (vCorner - 0.5) * uHalf * 2.0;
  float r = min(uRadius, min(uHalf.x, uHalf.y));
  float d = sdRoundedBox(local, uHalf, r);
  float aa = clamp(fwidth(d), 0.35, 1.5);
  float cov = smoothstep(aa, -aa, d);
  if (cov <= 0.001) discard;
  vec4 c = texture(uSrc, vUV);
  // Opaque where the box covers, and nothing outside it. The blurred backdrop
  // REPLACES what is under it rather than tinting it — the pixels it is made
  // of are those same pixels, softened.
  outColor = vec4(c.rgb, cov);
}`;

/**
 * The box width the CSS filter spec asks for at a given sigma, and how the
 * three passes are offset. Straight out of the SVG spec's pseudo-code, which
 * the CSS filter spec adopts by reference — and matched against a browser at
 * three radii before it was believed.
 */
export function boxesForSigma(sigma) {
  let d = Math.floor((sigma * 3 * Math.sqrt(2 * Math.PI)) / 4 + 0.5);
  if (d < 1) d = 1;
  return d % 2 === 1
    // Odd: three identical centred passes.
    ? [{ w: d, off: 0 }, { w: d, off: 0 }, { w: d, off: 0 }]
    // Even: two passes offset against each other by a texel, and a third one
    // texel wider. Without this the result creeps half a pixel per pass.
    : [{ w: d, off: 0 }, { w: d, off: 1 }, { w: d + 1, off: 0 }];
}

/** How far a three-box blur of this sigma reaches, in pixels. */
export function blurReach(sigma) {
  const b = boxesForSigma(sigma);
  return b.reduce((acc, p) => acc + Math.floor(p.w / 2) + 1, 0);
}

// Two framebuffers and the textures behind them, kept per context and rebuilt
// when the region's size changes. A dialog's scrim is the same size every
// frame, so after the first one this allocates nothing.
//
// EXACTLY the region's size, and not "at least" it. Growing a shared target
// and reusing it for a smaller region looks like the obvious saving and is a
// trap: `copyTexImage2D` resizes the source texture to what was copied, while
// the passes render across the whole target, so the first pass stretches the
// image by target/region and the last one reads back only the region/target
// fraction of it. The two cancel out along any axis where the picture happens
// to be uniform — which is why a scene with a horizontal band through it saw
// nothing wrong, twice.
// ---------------------------------------------------------------------------
// evg-surface-effect: ripple
// ---------------------------------------------------------------------------
//
// A post-process over the finished surface: render the page to a texture, then
// draw that texture across the screen with a fragment shader that bends the
// sample position in a ring travelling out from where somebody touched it.
//
// The whole point is that the shader knows NOTHING about Ranger. It gets a
// picture, a centre and an age. Everything on the page bends together — text,
// card edges, the chart's own paths — because by the time this runs they are
// all the same pixels, which is the most direct demonstration this gallery has
// that a dashboard that looks like the DOM is not DOM pixels.
//
// This is an EVG EXTENSION and says so in its name: `evg-surface-effect` is
// not a CSS property and nothing here should ever be measured against a
// browser looking for a divergence, because there is nothing to diverge from.
const RIPPLE_VERT = `#version 300 es
in vec2 aPos;
out vec2 vUV;
void main() {
  vUV = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const RIPPLE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uRes;        // page pixels
// Up to this many touches at once. Eight is not a limit anybody reaches by
// tapping; it is what a FINGER DRAGGED across the surface fills in a third of
// a second, and the oldest is retired to make room.
#define MAX_DROPS 8
uniform vec3 uDrops[MAX_DROPS];  // x, y in page pixels; z is seconds since
uniform int uCount;
uniform float uSpeed;     // px per second the ring travels
uniform float uWidth;     // the envelope's sigma, px
uniform float uStrength;  // displacement at the crest, px
uniform float uDecay;     // per second
uniform float uHi;        // how much the crest lightens
// One touch sends a TRAIN of rings from the same point, a stagger apart.
#define MAX_RINGS 5
uniform int uRings;
uniform float uStagger;   // seconds between one wavefront and the next
uniform float uFalloff;   // what each ring behind the front is worth
uniform float uShine;     // how strong the glint is
uniform float uGloss;     // Blinn-Phong exponent: how tight it is
uniform float uBump;      // what turns the height field into a slope
uniform vec3 uLight;      // where the light is, not necessarily normalised
in vec2 vUV;
out vec4 outColor;

void main() {
  // PAGE PIXELS, y DOWN. vUV comes off the fullscreen triangle as a GL texture
  // coordinate, whose origin is the BOTTOM left; a drop's x and y are page
  // coordinates, whose origin is the top left. Reading one as the other put
  // every ring at uRes.y minus where it was touched — a click near the top of
  // the dashboard rippled near the bottom of it. Everything below this line is
  // in page space, and the two places that hand a vector back to GL flip it
  // back.
  vec2 p = vec2(vUV.x, 1.0 - vUV.y) * uRes;

  // SUM the drops. This is the whole of the interference: two rings that
  // cross reinforce where their crests meet and cancel where a crest meets a
  // trough, and nothing here implements that — it is what adding waves does.
  //
  // The displacement is summed as a VECTOR, not as a scalar amplitude, so two
  // rings arriving from opposite sides push the surface in opposite
  // directions and the pixel between them stays where it was.
  vec2 push = vec2(0.0);
  float crest = 0.0;
  float energy = 0.0;
  for (int i = 0; i < MAX_DROPS; i++) {
    if (i >= uCount) break;
    vec3 drop = uDrops[i];
    vec2 delta = p - drop.xy;
    float d = length(delta);
    vec2 dir = delta / max(d, 0.001);

    // The TRAIN. A drop on water does not make one ring, it makes several
    // from the same point a moment apart, each fainter than the one in front:
    // an expanding target rather than a circle. They cost no state — the
    // rings of one touch differ only in when they started, so the k-th is
    // simply this touch aged by k staggers, and one that has not started yet
    // has a negative age and is skipped.
    float amp = 1.0;
    for (int k = 0; k < MAX_RINGS; k++) {
      if (k >= uRings) break;
      float t = drop.z - float(k) * uStagger;
      if (t <= 0.0) break;
      float radius = t * uSpeed;
      // A Gaussian ring: the wave only exists near the front, so the rest of
      // the page is sampled exactly where it was drawn and stays sharp.
      float env = exp(-pow((d - radius) / uWidth, 2.0));
      float fade = env * exp(-t * uDecay) * amp;
      float wave = sin((d - radius) * 0.16) * fade;
      push += dir * wave;
      crest += wave;
      // The ENVELOPE, kept apart from the signal. It is the ring's amplitude
      // with the oscillation divided out, so unlike the wave itself it does
      // not pass through zero twice per wavelength.
      energy += fade;
      amp *= uFalloff;
    }
  }

  float wave = crest;
  // Back into UV space to sample with: page y runs down and the texture's runs
  // up, so the displacement's y is negated on its way out.
  vec2 offset = vec2(push.x, -push.y) * uStrength / uRes;

  // A whisper of chromatic aberration along the crest. The numbers are 1.08
  // and 0.92 rather than anything bolder for a reason: past about a tenth the
  // dashboard stops looking like water and starts looking like a filter.
  float r = texture(uSrc, vUV + offset * 1.08).r;
  float g = texture(uSrc, vUV + offset).g;
  float b = texture(uSrc, vUV + offset * 0.92).b;
  float a = texture(uSrc, vUV + offset).a;

  // ---- THE SURFACE'S OWN NORMAL, AND A LIGHT ON IT ----------------------
  //
  // The wave sum is a HEIGHT FIELD: the rings added up. Its gradient is the
  // slope, and the slope is the normal — so nothing has to be computed or
  // stored to light this surface that the displacement did not already need.
  //
  // The gradient is taken in SCREEN SPACE with dFdx/dFdy rather than by
  // differentiating the sum by hand. Two reasons: the analytic derivative of
  // a Gaussian times a sine, summed over every ring of every drop, is a
  // second expression that has to be kept in step with the first one forever
  // — and this one is exact for whatever the first one happens to be. The
  // loops above branch only on uniforms, so every fragment in a quad takes
  // the same path and the derivative is well defined.
  //
  // dFdy differentiates against WINDOW y, which runs up, while the height
  // field and the light are both in page space, which runs down — so the y
  // component is negated. Get this wrong and the light silently moves to the
  // other side of the page: the glint still looks like a glint, on the wrong
  // edge of every wave.
  vec2 grad = vec2(dFdx(wave), -dFdy(wave)) * uBump;
  vec3 N = normalize(vec3(-grad, 1.0));

  // Blinn-Phong. The eye looks straight down at a flat page, so V is +Z and
  // the half vector is the light plus that.
  vec3 L = normalize(uLight);
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), uGloss) * uShine;

  // The specular lives on the FLANK of a wave and not on its top — that is
  // the whole difference from the ambient term beside it, and it is why the
  // glint slides along the ring as the ring travels rather than sitting on
  // it.
  //
  // It is faded out where there is no ring, so a page whose ripples have died
  // carries no shine. That fade is taken from the ENVELOPE and not from the
  // wave: the wave crosses zero twice per wavelength, and fading by it would
  // cut a dark seam straight through the middle of every glint.
  float alive = clamp(energy * 3.0, 0.0, 1.0);

  vec3 col = vec3(r, g, b) + wave * uHi + spec * alive;
  outColor = vec4(col, a);
}`;

// One target, kept and resized only when the canvas is. Same shape as the blur
// targets above and for the same reason: a frame that allocates a texture is a
// frame that stutters.
const RIPPLE_TARGET = new WeakMap();

function rippleTargetFor(gl, w, h) {
  let t = RIPPLE_TARGET.get(gl);
  if (!t) { t = { w: 0, h: 0, tex: null, fbo: null, depth: null, complete: false }; RIPPLE_TARGET.set(gl, t); }
  if (t.w === w && t.h === h && t.tex) return t;
  if (t.tex) gl.deleteTexture(t.tex);
  if (t.fbo) gl.deleteFramebuffer(t.fbo);
  t.tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t.tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // A displaced sample near the edge must repeat the edge, not read black —
  // otherwise the ring draws a dark rim as it reaches the sides of the page.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  t.fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
  // A STENCIL BUFFER, and it is not optional. Path fills are stencil-then-
  // cover, so a target without one cannot fill a path — and the chart on the
  // page that wanted this effect is nothing but path fills. Leaving it off did
  // not draw a chart with no bars in it, which is what the missing-stencil
  // branch is written to do: it made every frame take half a SECOND, because
  // the driver fell off its fast path and back into software for a stencil
  // buffer that was not there. 7ms a frame became 540.
  if (t.depth) gl.deleteRenderbuffer(t.depth);
  t.depth = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, t.depth);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, w, h);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, t.depth);
  t.complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  t.w = w; t.h = h;
  return t;
}

const BLUR_TARGETS = new WeakMap();

function blurTargetsFor(gl, w, h) {
  let t = BLUR_TARGETS.get(gl);
  if (!t) {
    t = { w: 0, h: 0, tex: [null, null], fbo: [null, null], src: null };
    BLUR_TARGETS.set(gl, t);
  }
  if (t.w === w && t.h === h && t.src) return t;
  const nw = w, nh = h;
  if (t.src) gl.deleteTexture(t.src);
  const mk = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, nw, nh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // CLAMP_TO_EDGE is not a detail: it is what makes a sample past the copied
    // region repeat its edge instead of reading black, which is the same thing
    // the browser does at the screen's own edge.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  };
  for (let i = 0; i < 2; i++) {
    if (t.tex[i]) gl.deleteTexture(t.tex[i]);
    if (t.fbo[i]) gl.deleteFramebuffer(t.fbo[i]);
    t.tex[i] = mk();
    t.fbo[i] = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo[i]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex[i], 0);
  }
  t.src = mk();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  t.w = nw; t.h = nh;
  return t;
}

function programsFor(gl) {
  const found = PROGRAMS.get(gl);
  if (found) return found;
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error("link: " + gl.getProgramInfoLog(prog));
  }
  const blurProg = gl.createProgram();
  gl.attachShader(blurProg, compile(gl, gl.VERTEX_SHADER, BLUR_VERT));
  gl.attachShader(blurProg, compile(gl, gl.FRAGMENT_SHADER, BLUR_FRAG));
  gl.linkProgram(blurProg);
  if (!gl.getProgramParameter(blurProg, gl.LINK_STATUS)) {
    throw new Error("link blur: " + gl.getProgramInfoLog(blurProg));
  }
  const rippleProg = gl.createProgram();
  gl.attachShader(rippleProg, compile(gl, gl.VERTEX_SHADER, RIPPLE_VERT));
  gl.attachShader(rippleProg, compile(gl, gl.FRAGMENT_SHADER, RIPPLE_FRAG));
  gl.linkProgram(rippleProg);
  if (!gl.getProgramParameter(rippleProg, gl.LINK_STATUS)) {
    throw new Error("link ripple: " + gl.getProgramInfoLog(rippleProg));
  }

  const backdropProg = gl.createProgram();
  gl.attachShader(backdropProg, compile(gl, gl.VERTEX_SHADER, BACKDROP_VERT));
  gl.attachShader(backdropProg, compile(gl, gl.FRAGMENT_SHADER, BACKDROP_FRAG));
  gl.linkProgram(backdropProg);
  if (!gl.getProgramParameter(backdropProg, gl.LINK_STATUS)) {
    throw new Error("link backdrop: " + gl.getProgramInfoLog(backdropProg));
  }
  const pathProg = gl.createProgram();
  gl.attachShader(pathProg, compile(gl, gl.VERTEX_SHADER, PATH_VERT));
  gl.attachShader(pathProg, compile(gl, gl.FRAGMENT_SHADER, PATH_FRAG));
  gl.linkProgram(pathProg);
  if (!gl.getProgramParameter(pathProg, gl.LINK_STATUS)) {
    throw new Error("link path: " + gl.getProgramInfoLog(pathProg));
  }
  // The locations belong to the program, so they are cached with it rather
  // than looked up per frame.
  const made = {
    prog,
    pathProg,
    cornerLoc: gl.getAttribLocation(prog, "aCorner"),
    uPage: gl.getUniformLocation(prog, "uPage"),
    uShift: gl.getUniformLocation(prog, "uShift"),
    uAtlas: gl.getUniformLocation(prog, "uAtlas"),
    uImage: gl.getUniformLocation(prog, "uImage"),
    pathPosLoc: gl.getAttribLocation(pathProg, "aPos"),
    pathPageLoc: gl.getUniformLocation(pathProg, "uPage"),
    pathShiftLoc: gl.getUniformLocation(pathProg, "uShift"),
    pathColorLoc: gl.getUniformLocation(pathProg, "uColor"),
    blurProg,
    blurCornerLoc: gl.getAttribLocation(blurProg, "aCorner"),
    blurSrc: gl.getUniformLocation(blurProg, "uSrc"),
    blurStep: gl.getUniformLocation(blurProg, "uStep"),
    blurWidth: gl.getUniformLocation(blurProg, "uWidth"),
    blurOffset: gl.getUniformLocation(blurProg, "uOffset"),
    rippleProg,
    ripplePosLoc: gl.getAttribLocation(rippleProg, "aPos"),
    rippleSrc: gl.getUniformLocation(rippleProg, "uSrc"),
    rippleRes: gl.getUniformLocation(rippleProg, "uRes"),
    rippleDrops: gl.getUniformLocation(rippleProg, "uDrops"),
    rippleCount: gl.getUniformLocation(rippleProg, "uCount"),
    rippleSpeed: gl.getUniformLocation(rippleProg, "uSpeed"),
    rippleWidth: gl.getUniformLocation(rippleProg, "uWidth"),
    rippleStrength: gl.getUniformLocation(rippleProg, "uStrength"),
    rippleDecay: gl.getUniformLocation(rippleProg, "uDecay"),
    rippleHi: gl.getUniformLocation(rippleProg, "uHi"),
    rippleRings: gl.getUniformLocation(rippleProg, "uRings"),
    rippleStagger: gl.getUniformLocation(rippleProg, "uStagger"),
    rippleFalloff: gl.getUniformLocation(rippleProg, "uFalloff"),
    rippleShine: gl.getUniformLocation(rippleProg, "uShine"),
    rippleGloss: gl.getUniformLocation(rippleProg, "uGloss"),
    rippleBump: gl.getUniformLocation(rippleProg, "uBump"),
    rippleLight: gl.getUniformLocation(rippleProg, "uLight"),
    backdropProg,
    backdropPosLoc: gl.getAttribLocation(backdropProg, "aPos"),
    backdropUVLoc: gl.getAttribLocation(backdropProg, "aUV"),
    backdropCornerLoc: gl.getAttribLocation(backdropProg, "aCorner"),
    backdropSrc: gl.getUniformLocation(backdropProg, "uSrc"),
    backdropHalf: gl.getUniformLocation(backdropProg, "uHalf"),
    backdropRadius: gl.getUniformLocation(backdropProg, "uRadius"),
  };
  PROGRAMS.set(gl, made);
  return made;
}

/**
 * A FRAME, BUILT AND KEPT.
 *
 * Everything the painter makes from a display list before it can draw it —
 * the instance arrays, the buffers on the card, the runs, the paths'
 * geometry — is made here once and kept on the object this returns. `draw`
 * puts it on the screen, as many times as asked; `dispose` gives the card
 * its memory back.
 *
 * What that is for is a SCROLL. The app keeps its list across a fling and
 * moves the layer inside it (`EVGDisplayList.refreshLayers`), so the frame
 * built from that list is still the right frame, moved: `draw` takes the
 * layers' current shifts, subtracts what was built in, and hands the
 * difference to the shaders as a uniform, per run. A scroll frame is then
 * the uniform, the scissors and the draw calls — no arrays, no upload —
 * which is what the browser's own compositor does with a layer, and why a
 * page scrolled this way stops stuttering where one rebuilt every frame
 * did not.
 *
 * `renderDisplayList` below is build, draw once, dispose: what a page that
 * does not keep its list wants, and what every caller had before.
 */
export function prepareDisplayList(gl, doc, opts = {}) {
  return buildFrame(gl, doc, opts);
}

export function renderDisplayList(gl, doc, opts = {}) {
  const frame = buildFrame(gl, doc, opts);
  const stats = frame.draw(opts.shifts);
  frame.dispose();
  return stats;
}

function buildFrame(gl, doc, opts = {}) {
  const dpr = opts.dpr || 1;
  const images = opts.images || new Map();
  const cmds = doc.list.cmds;

  const built = programsFor(gl);
  const prog = built.prog;
  gl.useProgram(prog);

  // The atlas, kept until the glyphs in it change. Building it means laying
  // out every run on a 2-D canvas and uploading the result — and the runs are
  // the same from one frame to the next almost always, because a frame that
  // differs by a moved shape has not changed a single letter.
  const { tex: atlas, slots, rebuilt: atlasRebuilt, added: atlasAdded } = atlasFor(gl, cmds, dpr, { w: doc.width, h: doc.height });

  // One texture per distinct source, uploaded ONCE — not once per frame. This
  // used to make a new GL texture for every picture on every frame and never
  // delete any of them: a decode and an upload per frame, and a leak.
  const textures = textureCacheFor(gl, images);
  const texturesUploaded = textures.uploaded | 0;

  // Instances in paint order, plus the runs that must be drawn separately.
  // A run is a stretch of instances that share a texture binding; an image
  // ends the run before it and forms one of its own.
  const rects = [], colors = [], colors2 = [], grads = [], shapes = [], uvs = [], rots = [], radii = [];
  // `rc` is on a command only when its four corners differ; a box with one
  // radius still carries a single `r`, so nothing that reads this list had to
  // change to keep working.
  const pushRadii = (c) => {
    if (c.rc) radii.push(c.rc[0], c.rc[1], c.rc[2], c.rc[3]);
    else { const r = c.r || 0; radii.push(r, r, r, r); }
  };
  // Three floats per command, not two: a pivot at (0, 0) is a legal place to
  // turn about, so "is there one" cannot be read off the coordinates.
  const origins = [];
  const runs = [];
  let missingImages = 0, drawnImages = 0;
  // The clip in force, as a rectangle or null. A clip is a scissor here, and a
  // scissor is pipeline state rather than per-instance data, so a change of
  // clip has to END the run being gathered — everything in a run is drawn by
  // one call and one call has one scissor.
  //
  // This used to be skipped outright, with a note promising a scissor stack.
  // What that cost was not subtle: a label wider than its cell was drawn in
  // full, across whatever its neighbour had in it and over the row numbers,
  // because the clip that said where to stop was thrown away between the
  // display list and the screen.
  // The clip is the LIST of rectangles in force, each with the layer it was
  // written in, and it is intersected when it is applied rather than here:
  // a clip written inside a scroll layer moves with the layer's content,
  // the layer's own clip does not, and which rectangle wins between them
  // depends on how far the content has moved by the time the frame is
  // drawn — which a kept frame does not know yet.
  const clipStack = [];
  let clip = null;
  // The scroll layer the commands being gathered belong to: 0 outside any,
  // else the id the list put on the clip that opened it.
  const layerStack = [];
  let layer = 0;
  const pushRun = (start, count, tex) => {
    if (count > 0) runs.push({ kind: "quads", start, count, tex, clip, layer });
  };
  let runStart = 0;
  const flush = () => {
    const n = rects.length / 4;
    pushRun(runStart, n - runStart, null);
    runStart = n;
  };
  // Path geometry is not instanced quads, so a path ends the run before it and
  // becomes a run of its own — which is what keeps the paint order intact.
  const pushPath = (op) => { flush(); runs.push(Object.assign(op, { clip, layer })); };

  for (const c of cmds) {
    // A backdrop blur reads the framebuffer as it stands, so it has to happen
    // between the runs before it and the runs after it — the same reason a
    // path breaks the batch. The command then goes on to emit its own fill
    // below, which composites over the blur exactly as the browser does.
    if (c.k === KIND.RECT && c.bb > 0) {
      flush();
      runs.push({ kind: "backdrop", cmd: c, clip, layer });
    }
    if (c.k === KIND.PUSH_CLIP) {
      flush();
      clipStack.push(clip);
      layerStack.push(layer);
      clip = (clip || []).concat([{ x: c.x, y: c.y, w: c.w, h: c.h, layer }]);
      if (c.layer > 0) layer = c.layer;
      continue;
    }
    if (c.k === KIND.POP_CLIP) {
      flush();
      clip = clipStack.length ? clipStack.pop() : null;
      layer = layerStack.length ? layerStack.pop() : 0;
      continue;
    }
    if (c.k === KIND.PATH || c.k === KIND.STROKE) {
      const rings = ringsOf(c);
      if (!rings.length) continue;
      const col = c.c || [0, 0, 0, 1];
      const rgba = [col[0] / 255, col[1] / 255, col[2] / 255, col[3]];
      if (c.k === KIND.STROKE) {
        const tris = strokeTriangles(rings, c.t || 1);
        if (tris.length) pushPath({ kind: "tris", verts: new Float32Array(tris), color: rgba });
      } else {
        pushPath({ kind: "fill", rings: rings.map((r) => new Float32Array(r)),
                   bounds: boundsOf(rings), evenOdd: !!c.eo, color: rgba });
      }
      continue;
    }
    if (c.k === KIND.IMAGE) {
      const t = c.src && textures.get(c.src);
      if (!t) { missingImages += 1; continue; }
      // Everything queued so far has to be drawn BEFORE this photo, or the
      // page paints out of order.
      flush();
      const uv = coverUV(t.w, t.h, c.w, c.h);
      // Mirrored is the same quad read the other way round: aUV is
      // (u0,v0,u1,v1) and the fragment mixes between them, so swapping the
      // ends flips the picture without touching the geometry.
      const u0 = c.fx ? uv[2] : uv[0];
      const u1 = c.fx ? uv[0] : uv[2];
      const v0 = c.fy ? uv[3] : uv[1];
      const v1 = c.fy ? uv[1] : uv[3];
      rects.push(c.x, c.y, c.w, c.h);
      uvs.push(u0, v0, u1, v1);
      shapes.push(c.r || 0, 0, MODE.IMAGE);
      pushRadii(c);
      rots.push(((c.rot || 0) * Math.PI) / 180);
      origins.push(c.rox || 0, c.roy || 0, c.rox === undefined ? 0 : 1);
      colors.push(1, 1, 1, 1);
      colors2.push(1, 1, 1, 1);
      grads.push(0);
      pushRun(runStart, 1, t.tex);
      runStart = rects.length / 4;
      drawnImages += 1;
      continue;
    }
    if (c.k === KIND.TEXT) {
      const s = slots.get(runKey(c, dpr));
      if (!s) continue;
      // EVG's y is the top of the LINE BOX and c.h is its height, so the
      // baseline is the CSS half-leading below the top plus one face ascent:
      //
      //     baseline = y + (lineBox - (faceAsc + faceDesc)) / 2 + faceAsc
      //
      // The half-leading term was missing, and it is missing in only one
      // direction: a line box is normally TALLER than the face it holds, so
      // every run was drawn that much high — 0.54px for 13px text at
      // line-height 1.2, and most of a pixel at reading sizes. It is computed
      // here rather than in the layout on purpose: this is where the real face
      // metrics are, and the layout only ever has an estimate of them.
      //
      // Inside the slot the baseline is pad + ink ascent down from the top.
      // Line the two up. This is the same rule the software canvas draws by,
      // which is what makes a page look the same whichever backend drew it.
      // Everything in the slot is stored in CSS pixels, and so is c.h.
      const halfLeading = c.h ? (c.h - (s.faceAsc + s.faceDesc)) / 2 : 0;
      rects.push(c.x - s.pad, c.y + halfLeading + s.faceAsc - (s.pad + s.asc), s.w, s.h);
      uvs.push(s.u0, s.v0, s.u1, s.v1);
      shapes.push(0, 0, s.colored ? MODE.COLORTEXT : MODE.TEXT);
      radii.push(0, 0, 0, 0);
    } else {
      rects.push(c.x, c.y, c.w, c.h);
      uvs.push(0, 0, 0, 0);
      shapes.push(c.r || 0, c.k === KIND.BORDER ? (c.t || 1) : 0, MODE.SHAPE);
      pushRadii(c);
    }
    rots.push(((c.rot || 0) * Math.PI) / 180);
    origins.push(c.rox || 0, c.roy || 0, c.rox === undefined ? 0 : 1);
    const col = c.c || [0, 0, 0, 1];
    colors.push(col[0] / 255, col[1] / 255, col[2] / 255, col[3]);
    // `gd` is the display list's gradient direction: 1 means across the box,
    // anything else means down it. A command with no `c2` is flat, and the
    // second stop is then the first, so the shader's mix is a no-op.
    const col2 = c.c2 || col;
    colors2.push(col2[0] / 255, col2[1] / 255, col2[2] / 255, col2[3]);
    grads.push(c.c2 ? (c.gd === 1 ? 2 : 1) : 0);
  }
  flush();
  const count = rects.length / 4;

  const quad = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // The two VAOs a blurred backdrop draws through. Built here rather than
  // inside `drawBackdrop` so a page with one dialog on it and a page with ten
  // allocate the same amount: nothing, per frame.
  //
  // The blur passes draw a full-target quad in clip space and read the same
  // corners as UVs, so one attribute does both. The final draw needs its own
  // UVs — it puts the BOX back, out of a texture that holds the box plus the
  // kernel's reach — so it is a separate, streamed buffer.
  const blurVao = gl.createVertexArray();
  gl.bindVertexArray(blurVao);
  const blurQuadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, blurQuadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(built.blurCornerLoc);
  gl.vertexAttribPointer(built.blurCornerLoc, 2, gl.FLOAT, false, 0, 0);

  const backdropVao = gl.createVertexArray();
  gl.bindVertexArray(backdropVao);
  const backdropBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, backdropBuf);
  // x, y in clip space, then u, v into the padded texture, then the 0..1
  // corner the rounding is measured from — six floats a vertex.
  gl.enableVertexAttribArray(built.backdropPosLoc);
  gl.vertexAttribPointer(built.backdropPosLoc, 2, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(built.backdropUVLoc);
  gl.vertexAttribPointer(built.backdropUVLoc, 2, gl.FLOAT, false, 24, 8);
  gl.enableVertexAttribArray(built.backdropCornerLoc);
  gl.vertexAttribPointer(built.backdropCornerLoc, 2, gl.FLOAT, false, 24, 16);

  gl.bindVertexArray(vao);

  // Attribute locations and buffers are set up once; a run re-points the
  // per-instance attributes at its own first instance, which is how the base
  // instance WebGL 2 does not have is emulated.
  const cornerBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  const cornerLoc = built.cornerLoc;
  gl.enableVertexAttribArray(cornerLoc);
  gl.vertexAttribPointer(cornerLoc, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(cornerLoc, 0);

  const instanced = [
    { name: "aRect", data: rects, size: 4 },
    { name: "aColor", data: colors, size: 4 },
    { name: "aColor2", data: colors2, size: 4 },
    { name: "aGrad", data: grads, size: 1 },
    { name: "aShape", data: shapes, size: 3 },
    { name: "aRadii", data: radii, size: 4 },
    { name: "aUV", data: uvs, size: 4 },
    { name: "aRot", data: rots, size: 1 },
    { name: "aOrigin", data: origins, size: 3 },
  ];
  for (const a of instanced) {
    a.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, a.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a.data), gl.STATIC_DRAW);
    a.loc = gl.getAttribLocation(prog, a.name);
    if (a.loc < 0) continue;
    gl.enableVertexAttribArray(a.loc);
    gl.vertexAttribDivisor(a.loc, 1);
  }
  const pointAt = (first) => {
    for (const a of instanced) {
      if (a.loc < 0) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, a.buf);
      gl.vertexAttribPointer(a.loc, a.size, gl.FLOAT, false, 0, first * a.size * 4);
    }
  };

  // The path pipeline: its own program (compiled with the other one, above),
  // its own buffer, one draw per path.
  const pathProg = built.pathProg;
  const pathVao = gl.createVertexArray();
  gl.bindVertexArray(pathVao);
  const pathBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pathBuf);
  const pathPosLoc = built.pathPosLoc;
  gl.enableVertexAttribArray(pathPosLoc);
  gl.vertexAttribPointer(pathPosLoc, 2, gl.FLOAT, false, 0, 0);
  const pathPageLoc = built.pathPageLoc;
  const pathColorLoc = built.pathColorLoc;
  gl.bindVertexArray(vao);

  // What the layers had moved by when this frame was built. Those moves are
  // in the coordinates above already; `draw` applies only what came after.
  const baseShifts = (doc.list.shifts || []).map((s) => [s[0], s[1]]);

  const frame = {
    doc,
    dispose() {
      for (const a of instanced) gl.deleteBuffer(a.buf);
      gl.deleteBuffer(cornerBuf);
      gl.deleteBuffer(blurQuadBuf);
      gl.deleteBuffer(backdropBuf);
      gl.deleteBuffer(pathBuf);
      gl.deleteVertexArray(vao);
      gl.deleteVertexArray(blurVao);
      gl.deleteVertexArray(backdropVao);
      gl.deleteVertexArray(pathVao);
    },
  };

  // What the build made, reported by the first draw and not again: a frame
  // drawn a second time added nothing to the atlas and uploaded nothing.
  let fresh = true;
  frame.draw = (shiftsNow) => {
  const madeNow = fresh;
  fresh = false;
  // The move a layer has made since this frame was built: what the shaders
  // add. A frame drawn as it was built, or a run outside any layer, adds 0.
  const shiftOf = (l) => {
    if (!l) return ZERO_SHIFT;
    const now = (shiftsNow && shiftsNow[l - 1]) || baseShifts[l - 1] || ZERO_SHIFT;
    const base = baseShifts[l - 1] || ZERO_SHIFT;
    return [now[0] - base[0], now[1] - base[1]];
  };
  let curShift = ZERO_SHIFT;

  gl.useProgram(prog);
  gl.bindVertexArray(vao);
  gl.uniform2f(built.uPage, doc.width, doc.height);
  gl.uniform2f(built.uShift, 0, 0);
  gl.uniform1i(built.uAtlas, 0);
  gl.uniform1i(built.uImage, 1);

  // A LIVE SURFACE EFFECT redirects the whole frame into a texture first. It
  // is live only while it is still moving: an effect declared in the sheet but
  // with no touch behind it (`t` below zero) costs a comparison and nothing
  // else, which is what lets a page carry the declaration all the time.
  const fx = doc.list.effect;
  // Live while ANY drop still has something left in it. The application
  // retires them, so in practice this is "are there any"; the decay test
  // stays as the renderer's own guard against being asked to draw nothing.
  const rippling = !!fx && fx.kind === "ripple" && fx.drops && fx.drops.length > 0 &&
    fx.drops.some((d) => Math.exp(-d[2] * fx.decay) > 0.004);
  let target = rippling
    ? rippleTargetFor(gl, gl.canvas.width, gl.canvas.height)
    : null;
  // An incomplete target draws the page without the effect rather than
  // drawing nothing, which is the same choice the missing-stencil branch
  // makes about path fills: say what could not be done, do the rest.
  if (target && !target.complete) target = null;
  if (target) gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);

  // THE ATLAS IS BOUND HERE, AFTER THE TARGET, AND THE ORDER IS THE WHOLE
  // POINT. Creating the target's texture leaves it bound to the active unit,
  // which is this one — so binding the atlas first meant the frame drew with
  // the render target itself in the sampler the glyphs and images read. A
  // texture sampled while it is attached to the framebuffer being drawn into
  // is a feedback loop, and the spec says the result is undefined: this
  // driver dropped every textured draw. The page came out with its paths on
  // it and NOTHING else — no card, no letter — which reads as "the effect
  // broke the renderer" and is really one line of state in the wrong order.
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, atlas);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const hasStencil = gl.getContextAttributes().stencil === true;
  let paths = 0, skippedFills = 0;

  const drawTris = (verts, color) => {
    gl.bindVertexArray(pathVao);
    gl.useProgram(pathProg);
    gl.uniform2f(pathPageLoc, doc.width, doc.height);
    gl.uniform2f(built.pathShiftLoc, curShift[0], curShift[1]);
    gl.uniform4f(pathColorLoc, color[0], color[1], color[2], color[3]);
    gl.bindBuffer(gl.ARRAY_BUFFER, pathBuf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
  };

  /**
   * Stencil-then-cover. Every ring goes into the stencil as a fan; the rule
   * decides which counts survive; then one quad over the bounding box paints
   * them and zeroes the stencil on its way out, so no clear is needed between
   * paths.
   */
  const drawFill = (op) => {
    if (!hasStencil) { skippedFills += 1; return; }
    gl.bindVertexArray(pathVao);
    gl.useProgram(pathProg);
    gl.uniform2f(pathPageLoc, doc.width, doc.height);
    gl.bindBuffer(gl.ARRAY_BUFFER, pathBuf);

    gl.enable(gl.STENCIL_TEST);
    gl.colorMask(false, false, false, false);
    gl.stencilFunc(gl.ALWAYS, 0, 0xff);
    if (op.evenOdd) {
      gl.stencilMask(0x01);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT);
    } else {
      gl.stencilMask(0xff);
      // A ring's winding decides the sign, which is what "non-zero" counts.
      gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.INCR_WRAP);
      gl.stencilOpSeparate(gl.BACK, gl.KEEP, gl.KEEP, gl.DECR_WRAP);
    }
    for (const ring of op.rings) {
      gl.bufferData(gl.ARRAY_BUFFER, ring, gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, ring.length / 2);
    }

    gl.colorMask(true, true, true, true);
    gl.stencilFunc(gl.NOTEQUAL, 0, op.evenOdd ? 0x01 : 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.ZERO);
    gl.uniform4f(pathColorLoc, op.color[0], op.color[1], op.color[2], op.color[3]);
    const [x0, y0, x1, y1] = op.bounds;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      x0, y0, x1, y0, x1, y1,
      x0, y0, x1, y1, x0, y1,
    ]), gl.STREAM_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.stencilMask(0xff);
    gl.disable(gl.STENCIL_TEST);
  };

  // A clip rectangle in page coordinates becomes a scissor box in framebuffer
  // pixels, which are scaled by the device ratio and measured from the BOTTOM.
  const sxScale = gl.canvas.width / doc.width;
  const syScale = gl.canvas.height / doc.height;
  let scissorOn = false;
  const applyClip = (list) => {
    if (!list) {
      if (scissorOn) { gl.disable(gl.SCISSOR_TEST); scissorOn = false; }
      return;
    }
    if (!scissorOn) { gl.enable(gl.SCISSOR_TEST); scissorOn = true; }
    let r = null;
    for (const c of list) {
      const sh = shiftOf(c.layer);
      const b = { x: c.x + sh[0], y: c.y + sh[1], w: c.w, h: c.h };
      if (!r) { r = b; continue; }
      const x0 = Math.max(r.x, b.x), y0 = Math.max(r.y, b.y);
      const x1 = Math.min(r.x + r.w, b.x + b.w), y1 = Math.min(r.y + r.h, b.y + b.h);
      r = { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
    }
    const x = Math.round(r.x * sxScale);
    const y = Math.round((doc.height - (r.y + r.h)) * syScale);
    const w = Math.max(0, Math.round(r.w * sxScale));
    const h = Math.max(0, Math.round(r.h * syScale));
    gl.scissor(x, y, w, h);
  };

  // One blurred backdrop: copy what is behind, soften it, put it back.
  //
  // The copy is the element's box GROWN by the kernel's reach, because the
  // browser samples past the edge — see the note on BLUR_FRAG. Only the last
  // step clips to the box, and it does so with the same rounded distance field
  // the solid shapes use.
  let backdrops = 0;
  const drawBackdrop = (c) => {
    const sigma = c.bb * dpr;
    // The element's box in framebuffer pixels, measured from the bottom the
    // way GL counts.
    const bx = Math.round((c.x + curShift[0]) * sxScale);
    const by = Math.round((doc.height - (c.y + curShift[1] + c.h)) * syScale);
    const bw = Math.max(1, Math.round(c.w * sxScale));
    const bh = Math.max(1, Math.round(c.h * syScale));
    // EXACTLY the box, and no padding. What a browser blurs is the rectangle
    // under the element with its edges clamped, not the page around it — see
    // the note on BLUR_FRAG, where getting this wrong is the mistake a flat
    // backdrop cannot show you.
    const rx = Math.max(0, Math.min(bx, gl.canvas.width - 1));
    const ry = Math.max(0, Math.min(by, gl.canvas.height - 1));
    const rw = Math.min(gl.canvas.width - rx, bw);
    const rh = Math.min(gl.canvas.height - ry, bh);
    if (rw <= 0 || rh <= 0) return;

    const t = blurTargetsFor(gl, rw, rh);
    // Straight off the framebuffer being drawn into. This is the one read
    // that has to happen mid-frame, and it is why a blur breaks the batch.
    gl.bindTexture(gl.TEXTURE_2D, t.src);
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, rx, ry, rw, rh, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const wasScissor = gl.isEnabled(gl.SCISSOR_TEST);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.BLEND);
    gl.useProgram(built.blurProg);
    gl.bindVertexArray(blurVao);
    gl.uniform1i(built.blurSrc, 0);
    gl.activeTexture(gl.TEXTURE0);

    // Six passes, three each way, ping-ponging between the two targets. The
    // texture the region was copied into is only the first pass's input.
    const boxes = boxesForSigma(sigma);
    let srcTex = t.src, dst = 0;
    for (const axis of [[1 / t.w, 0], [0, 1 / t.h]]) {
      for (const box of boxes) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo[dst]);
        gl.viewport(0, 0, t.w, t.h);
        gl.bindTexture(gl.TEXTURE_2D, srcTex);
        gl.uniform2f(built.blurStep, axis[0], axis[1]);
        gl.uniform1f(built.blurWidth, box.w);
        gl.uniform1f(built.blurOffset, box.off);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        srcTex = t.tex[dst];
        dst = 1 - dst;
      }
    }

    // And back onto the page, clipped to the element's rounded box. The quad
    // is the BOX, not the grown region, so the padding's only job was to keep
    // the edges honest.
    //
    // Back onto THE FRAME'S OWN TARGET, which is the screen only when no
    // surface effect is running: a dialog on a rippling page would otherwise
    // put its softened backdrop straight on the canvas, under everything the
    // post-pass is about to draw over it.
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.BLEND);
    gl.useProgram(built.backdropProg);
    gl.bindVertexArray(backdropVao);
    // The quad covers the box, the copy IS the box, and the target is exactly
    // the copy — so the UVs are the whole texture.
    const u0 = 0, v0 = 0, u1 = 1, v1 = 1;
    const x0 = (bx / gl.canvas.width) * 2 - 1, y0 = (by / gl.canvas.height) * 2 - 1;
    const x1 = ((bx + bw) / gl.canvas.width) * 2 - 1;
    const y1 = ((by + bh) / gl.canvas.height) * 2 - 1;
    gl.bindBuffer(gl.ARRAY_BUFFER, backdropBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      x0, y0, u0, v0, 0, 0,
      x1, y0, u1, v0, 1, 0,
      x0, y1, u0, v1, 0, 1,
      x1, y1, u1, v1, 1, 1,
    ]), gl.STREAM_DRAW);
    gl.bindTexture(gl.TEXTURE_2D, srcTex);
    gl.uniform1i(built.backdropSrc, 0);
    gl.uniform2f(built.backdropHalf, bw / 2, bh / 2);
    gl.uniform1f(built.backdropRadius, (c.r || 0) * sxScale);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Put the state back the way the batch expects to find it. TEXTURE0 is the
    // glyph atlas for the whole frame and this has just been using it for its
    // own textures — leave it bound to the blur and every letter drawn after a
    // dialog samples that instead of the atlas, comes back with alpha 1
    // everywhere, and renders as a solid black rectangle the size of the word.
    // Which is exactly what the first dialog screenshot showed, in every run
    // on the page.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlas);
    if (wasScissor) gl.enable(gl.SCISSOR_TEST);
    backdrops += 1;
  };

  for (const run of runs) {
    curShift = shiftOf(run.layer);
    applyClip(run.clip);
    if (run.kind === "backdrop") { drawBackdrop(run.cmd); continue; }
    if (run.kind === "fill") { drawFill(run); paths += 1; continue; }
    if (run.kind === "tris") { drawTris(run.verts, run.color); paths += 1; continue; }
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.uniform2f(built.uShift, curShift[0], curShift[1]);
    if (run.tex) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, run.tex);
    }
    pointAt(run.start);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, run.count);
  }
  applyClip(null);

  // The second pass. Everything above drew into a texture; this puts it on the
  // screen through the ripple. One fullscreen quad, no blending — the texture
  // already holds the finished surface and compositing it again would darken
  // its own edges against itself.
  if (target) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(built.rippleProg);
    const quad = gl.createBuffer();
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STREAM_DRAW);
    gl.enableVertexAttribArray(built.ripplePosLoc);
    gl.vertexAttribPointer(built.ripplePosLoc, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target.tex);
    gl.uniform1i(built.rippleSrc, 0);
    // In PAGE pixels, which is the space the drop was recorded in — the
    // texture is in device pixels and the shader never has to know.
    gl.uniform2f(built.rippleRes, doc.width, doc.height);
    // Flattened to (x, y, age) triples, oldest first — the order is the
    // application's and the shader does not care, because addition does not.
    const drops = new Float32Array(24);
    const n = Math.min(8, fx.drops.length);
    for (let i = 0; i < n; i++) {
      drops[i * 3] = fx.drops[i][0];
      drops[i * 3 + 1] = fx.drops[i][1];
      drops[i * 3 + 2] = fx.drops[i][2];
    }
    gl.uniform3fv(built.rippleDrops, drops);
    gl.uniform1i(built.rippleCount, n);
    gl.uniform1f(built.rippleSpeed, fx.speed);
    gl.uniform1f(built.rippleWidth, fx.width);
    gl.uniform1f(built.rippleStrength, fx.strength);
    gl.uniform1f(built.rippleDecay, fx.decay);
    gl.uniform1f(built.rippleHi, fx.highlight);
    gl.uniform1i(built.rippleRings, Math.max(1, Math.min(5, Math.round(fx.rings || 1))));
    gl.uniform1f(built.rippleStagger, fx.stagger || 0);
    gl.uniform1f(built.rippleFalloff, fx.falloff || 0);
    gl.uniform1f(built.rippleShine, fx.shine || 0);
    // Never zero: pow(x, 0) is 1 everywhere and the whole page turns white.
    gl.uniform1f(built.rippleGloss, Math.max(1, fx.gloss || 1));
    gl.uniform1f(built.rippleBump, fx.bump || 0);
    const L = fx.light || [0, 0, 1];
    gl.uniform3f(built.rippleLight, L[0], L[1], L[2]);
    // One triangle covering the screen, not two: no seam down the diagonal
    // for `fwidth` to trip over, and three vertices instead of six.
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.deleteBuffer(quad);
    gl.enable(gl.BLEND);
  }

  return {
    drawn: count, textRuns: slots.size, images: drawnImages, missingImages,
    runs: runs.length, paths,
    // What this frame had to make rather than reuse. Both should be 0 on a
    // frame that draws what the last one drew.
    atlasRebuilt: (madeNow && atlasRebuilt) ? 1 : 0, texturesUploaded: madeNow ? texturesUploaded : 0,
    // The runs this frame was the first to show, rasterized and uploaded on
    // their own. A scroll frame that brought no new row in reports 0.
    atlasAdded: madeNow ? atlasAdded : 0,
    // Whether this draw built its buffers or drew the ones it had.
    frameBuilt: madeNow ? 1 : 0,
    // A context without a stencil buffer cannot fill a path; say so rather than
    // drawing a chart with no bars in it.
    skippedFills,
    // How many backdrops were softened. Each one is a framebuffer read and six
    // passes, so this is the number to look at when a frame with a dialog on
    // it costs more than one without.
    backdrops,
    // Whether this frame went through a surface effect. 0 on every frame of
    // every page that is not rippling, which is nearly all of them.
    rippled: target ? 1 : 0,
  };
  };
  return frame;
}

const ZERO_SHIFT = [0, 0];
