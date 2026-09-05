/**
 * evg-html.js — the same display list, painted as DOM instead of pixels.
 *
 * `evg-webgl.js` is the reference for this file. Both are handed the SAME
 * `{width, height, list:{cmds}}` that `EVGDisplayList` emits, and both are
 * expected to put the same picture on the screen; only the mechanism differs.
 * Nothing above the seam knows which one is running, which is the whole reason
 * the seam is there — see gallery/evg/gl/README.md.
 *
 *   EVGDisplayList ──┬─► evg-webgl.js  ─► quads, glyph atlas, GLSL
 *                    └─► THIS FILE     ─► <svg>: rect, path, text, image
 *
 * WHY SVG AND NOT DIVS. The list has eight command kinds and SVG has a native
 * answer for seven of them, including the two a stack of absolutely positioned
 * `<div>`s cannot express at all:
 *
 *   * PATH / STROKE are flattened rings in page coordinates — `<path d=…>` and
 *     `fill-rule="evenodd"` take them verbatim, with no tessellation and no
 *     stencil buffer. The GL backend needs both.
 *   * PUSH_CLIP / POP_CLIP is a STACK, and a stack of nested `<g clip-path>`
 *     intersects by construction. The GL backend has one scissor rectangle and
 *     has to intersect the stack by hand; `EVGListToElements`, which converts a
 *     list into an element tree for the PDF writer, gives up on clipping
 *     entirely and says so in its header.
 *
 * So this backend is not a degraded one. It is missing the ripple post-pass,
 * which is a GPU effect with no DOM equivalent, and it gains selectable text,
 * resolution independence, and a picture that survives being printed.
 *
 * (That sibling now exists: `evg-dom.js` reads `EVGHostTree`, the list that
 * carries identity, and keeps its nodes. This file stays what it is.)
 *
 * WHAT IS DELIBERATELY NOT HERE. Element identity. A draw command carries no
 * id — `EVGDrawCmd` has geometry and paint and nothing else — so every frame
 * rebuilds every node, and a CSS transition, a focus ring or a native `<input>`
 * has nothing stable to attach to. That is a property of the SEAM, not of this
 * file: getting it would mean an id on the command or a second walk over the
 * element tree. A painter is what this is.
 */

const KIND = {
  RECT: 0, BORDER: 1, IMAGE: 2, TEXT: 3, PUSH_CLIP: 4, POP_CLIP: 5,
  PATH: 6, STROKE: 7,
};

const SVG_NS = "http://www.w3.org/2000/svg";

// ---------------------------------------------------------------------------
// Text, and the one number that decides where every run sits
// ---------------------------------------------------------------------------

/**
 * Bidi, forced off — the same rule `evg-webgl.js` applies, for the same reason.
 *
 * EVG has already decided the order of a line: a line that changes colour
 * partway along arrives as several TEXT commands at computed x positions. A
 * renderer that reorders each of them in isolation reverses Arabic inside its
 * own run and then places the runs left to right anyway. U+202D forces every
 * character to level 0 and U+202C pops it.
 *
 * It matters MORE here than it does on the GL side. There the string is
 * rasterised into an atlas and the result is a picture; here it is a live
 * `<text>` node that the browser is still free to shape and reorder at paint
 * time.
 */
const LRO = "\u202D", PDF = "\u202C";
export const verbatim = (t) => LRO + t + PDF;

let fallbackStack = "sans-serif";

/** The families the browser may fall back to, after the one a command names.
 *
 *  Same contract as the GL backend: our FontManager falls back per CODEPOINT
 *  across every loaded face and every width in the layout was measured through
 *  that walk, so a stack that ends at `sans-serif` answers those codepoints
 *  from whatever the system has — right-looking glyphs at widths nobody
 *  measured. A page sets this to its own pool, in load order.
 */
export function setFontFallback(families) {
  const list = (families || []).filter((f) => f && f.length).map((f) => `"${f}"`);
  list.push("sans-serif");
  fallbackStack = list.join(", ");
}

/** One place that turns a TEXT command into a CSS font shorthand. */
// The family a command names, less the `-Bold` suffix `effectiveFontFamily`
// writes for a bold element: a convention the TTF measurers read as "the
// bold face", and a browser reads as a family nobody has. The weight arrives
// on its own and is what the browser is given. `gl/evg-measure.js` strips
// the same suffix, so the layout and this painter ask for one face.
const familyOf = (c) => (c.font && c.font.endsWith("-Bold") ? c.font.slice(0, -5) : c.font || "");

function fontSpec(c) {
  return `${c.italic ? "italic " : ""}${c.weight ? c.weight + " " : ""}${c.size}px "${familyOf(c)}", ${fallbackStack}`;
}

// Face metrics per font spec. `fontBoundingBox*` is a property of the FACE at
// a size, not of the string, so one measurement answers every run that shares
// a spec — which on a slide is nearly all of them.
const FACE_METRICS = new Map();
let metricCtx = null;

function faceMetrics(c) {
  const spec = fontSpec(c);
  const hit = FACE_METRICS.get(spec);
  if (hit) return hit;
  if (!metricCtx) {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    metricCtx = canvas.getContext("2d");
  }
  let asc = c.size * 1.05, desc = c.size * 0.212;
  if (metricCtx) {
    metricCtx.font = spec;
    // "Hg" rather than the run: the ink of a particular string is irrelevant
    // here and measuring per run would defeat the cache.
    const m = metricCtx.measureText("Hg");
    if (m.fontBoundingBoxAscent) asc = m.fontBoundingBoxAscent;
    if (m.fontBoundingBoxDescent) desc = m.fontBoundingBoxDescent;
  }
  const out = { asc, desc };
  FACE_METRICS.set(spec, out);
  return out;
}

/** Drop the cache when the page has registered new faces.
 *
 *  A metric measured before `document.fonts.add()` resolves is the FALLBACK
 *  face's, and it is then cached forever — every run in the deck placed by the
 *  system sans's ascent while being drawn in Open Sans. A page that loads fonts
 *  after this module calls this.
 */
export function clearFontMetrics() {
  FACE_METRICS.clear();
}

/**
 * Where the baseline of a TEXT command goes.
 *
 * Transcribed from `evg-webgl.js`, which is the definition:
 *
 *     baseline = y + (lineBox - (faceAsc + faceDesc)) / 2 + faceAsc
 *
 * A TEXT command's `y` is the top of the LINE BOX and `h` is its height, so
 * the baseline is one half-leading plus one face ascent below it. The
 * half-leading term is not decoration — a line box is normally taller than the
 * face it holds, so leaving it out draws every run high, in one direction
 * only.
 *
 * SVG's default `dominant-baseline` is alphabetic, so a `<text y=…>` placed
 * here needs no further adjustment: the two conventions already agree.
 */
function baselineOf(c) {
  const { asc, desc } = faceMetrics(c);
  const halfLeading = c.h ? (c.h - (asc + desc)) / 2 : 0;
  return c.y + halfLeading + asc;
}

// ---------------------------------------------------------------------------
// Markup
// ---------------------------------------------------------------------------

const XML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]);

/** Two decimals, and no exponent.
 *
 *  The display list is already written to hundredths — `EVGDisplayList.num`
 *  rounds there — so this loses nothing. What it prevents is `toString`
 *  reaching for scientific notation on a very small number: `1e-7` is not a
 *  valid SVG length, and one of them in a path's `d` invalidates the whole
 *  attribute rather than the one coordinate.
 */
function n(v) {
  if (!Number.isFinite(v)) return "0";
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
}

const rgba = (c) => {
  const col = c || [0, 0, 0, 1];
  const a = col[3] === undefined ? 1 : col[3];
  return a >= 1 ? `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`
                : `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${n(a)})`;
};

/** The four corner radii of a command, clamped the way CSS clamps them.
 *
 *  `rc` is present only when the four differ; a box with one radius carries a
 *  single `r`, which is the shape every backend but the GL one reads.
 */
function radiiOf(c) {
  const r = c.rc ? c.rc.slice(0, 4) : [c.r || 0, c.r || 0, c.r || 0, c.r || 0];
  const lim = Math.min(c.w, c.h) / 2;
  return r.map((v) => Math.max(0, Math.min(v || 0, lim)));
}

const uniform = (r) => r[0] === r[1] && r[1] === r[2] && r[2] === r[3];

/**
 * A rounded rectangle as a path, for the case `rx` cannot express.
 *
 * Corners are TL, TR, BR, BL — the order `border-radius` writes them in, which
 * is the order the display list carries and the order the GL shader reads.
 */
function roundedPath(x, y, w, h, r) {
  const [tl, tr, br, bl] = r;
  return [
    `M${n(x + tl)},${n(y)}`,
    `H${n(x + w - tr)}`, tr ? `A${n(tr)},${n(tr)} 0 0 1 ${n(x + w)},${n(y + tr)}` : "",
    `V${n(y + h - br)}`, br ? `A${n(br)},${n(br)} 0 0 1 ${n(x + w - br)},${n(y + h)}` : "",
    `H${n(x + bl)}`, bl ? `A${n(bl)},${n(bl)} 0 0 1 ${n(x)},${n(y + h - bl)}` : "",
    `V${n(y + tl)}`, tl ? `A${n(tl)},${n(tl)} 0 0 1 ${n(x + tl)},${n(y)}` : "",
    "Z",
  ].filter(Boolean).join("");
}

/** The rings of a PATH / STROKE command as one `d`.
 *
 *  `ends` gives the index one past each ring's last COORDINATE, so a shape with
 *  a hole survives as two subpaths rather than one confused outline. A command
 *  that set `pts` and forgot `ends` is treated as one ring covering everything,
 *  which is what the JSON writer does too.
 */
function ringsPath(c, close) {
  const pts = c.pts;
  if (!pts || pts.length < 4) return "";
  const ends = c.ends && c.ends.length ? c.ends : [pts.length];
  let d = "", at = 0;
  for (const end of ends) {
    if (end - at < 4) { at = end; continue; }
    d += `M${n(pts[at])},${n(pts[at + 1])}`;
    for (let i = at + 2; i + 1 < end; i += 2) d += `L${n(pts[i])},${n(pts[i + 1])}`;
    if (close) d += "Z";
    at = end;
  }
  return d;
}

/**
 * What a command turns about.
 *
 * An explicit origin is the easy half. Without one the rule is "the command's
 * own centre", and for TEXT that is not the centre of the line box: the GL
 * backend draws a run in a quad sized to its INK, so the pivot it falls back to
 * is the ink's centre. The two are a few pixels apart on a 22px label — enough
 * that the parity check sees it, which is how this was found.
 *
 * `EVGDisplayList` says the same thing from the other side: `rotOriginX/Y` were
 * added precisely because turning a box and its own words about their separate
 * centres pulls them apart, and anything that cares emits an origin. This is
 * the case that does not — a lone turned label — and there the ink centre is
 * both what the GPU does and what looks right.
 *
 * Three values are needed to say "unset" rather than two, because (0, 0) is a
 * legal pivot and cannot be told apart from "none" by its coordinates.
 */
function rotAttr(c) {
  if (!c.rot) return "";
  let cx, cy;
  if (c.rox !== undefined) {
    cx = c.rox;
    cy = c.roy === undefined ? c.y + c.h / 2 : c.roy;
  } else if (c.k === KIND.TEXT) {
    const ink = inkBox(c);
    cx = ink.cx;
    cy = ink.cy;
  } else {
    cx = c.x + c.w / 2;
    cy = c.y + c.h / 2;
  }
  return ` transform="rotate(${n(c.rot)} ${n(cx)} ${n(cy)})"`;
}

/**
 * The centre of the quad the GL backend would have drawn this run in.
 *
 * Transcribed from `buildTextAtlas`: a slot is the run's measured width and its
 * INK height — `actualBoundingBox*`, the ascent and descent of these particular
 * letters — with two pixels of padding, placed so the baseline lines up. The
 * padding cancels out of the centre, so what is left is the ink box.
 *
 * Measured per run rather than per face, which the cached `faceMetrics` cannot
 * be: the ink of "moon" and of "Ág" are different boxes in the same font. It is
 * only reached for a turned run with no origin, which is rare enough that the
 * measurement does not need a cache of its own.
 */
function inkBox(c) {
  const base = baselineOf(c);
  if (!metricCtx) faceMetrics(c);
  if (!metricCtx) return { cx: c.x + c.w / 2, cy: c.y + c.h / 2 };
  metricCtx.font = fontSpec(c);
  const m = metricCtx.measureText(verbatim(c.text));
  const asc = m.actualBoundingBoxAscent || c.size * 0.8;
  const desc = m.actualBoundingBoxDescent || c.size * 0.25;
  return {
    cx: c.x + Math.ceil(m.width) / 2,
    cy: base - asc + Math.ceil(asc + desc) / 2,
  };
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/**
 * Load every distinct image the list names. Same signature as the GL backend's,
 * so a host that already has one needs no second code path.
 */
export async function loadImages(doc, opts = {}) {
  const base = opts.base || "";
  const srcs = [...new Set(doc.list.cmds.filter((c) => c.k === KIND.IMAGE && c.src).map((c) => c.src))];
  const out = new Map();
  await Promise.all(srcs.map((src) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { out.set(src, img); resolve(); };
    img.onerror = () => { out.set(src, null); resolve(); };
    img.src = base + src;
  })));
  return out;
}

// ---------------------------------------------------------------------------
// The paint
// ---------------------------------------------------------------------------

/**
 * Paint a display list into an `<svg>`.
 *
 * `target` is the element to paint into: an `<svg>` is used directly, anything
 * else gets one created inside it and reused across frames.
 *
 * The markup is assembled as a STRING and handed over in one `innerHTML`. The
 * obvious alternative — `createElementNS` per command, appended as it goes —
 * is between two and four times slower on a slide-sized list, because each
 * append is a live mutation of a rendered tree; a string is parsed once with
 * nothing on screen depending on it.
 *
 * Returns the same shape of stats the GL backend returns, so a page can report
 * what it drew without knowing which backend drew it.
 */
export function renderDisplayList(target, doc, opts = {}) {
  const images = opts.images || new Map();
  const cmds = doc.list.cmds;
  const svg = svgFor(target);

  const defs = [];
  const body = [];
  let openClips = 0;
  let drawn = 0, textRuns = 0, paths = 0, drawnImages = 0, missingImages = 0, clips = 0;
  let uid = 0;

  for (const c of cmds) {
    switch (c.k) {
      case KIND.PUSH_CLIP: {
        // A nested <g clip-path> intersects with everything above it, which is
        // exactly what the stack means — and is the part the GL backend has to
        // compute by hand because a scissor is not a stack.
        const id = `evgclip${uid++}`;
        defs.push(`<clipPath id="${id}"><rect x="${n(c.x)}" y="${n(c.y)}" width="${n(Math.max(0, c.w))}" height="${n(Math.max(0, c.h))}"/></clipPath>`);
        body.push(`<g clip-path="url(#${id})">`);
        openClips += 1;
        clips += 1;
        break;
      }
      case KIND.POP_CLIP:
        // A pop with nothing pushed is a producer's bug, not this file's: close
        // nothing rather than emitting a stray `</g>` that would swallow the
        // rest of the frame into whatever encloses it.
        if (openClips > 0) { body.push("</g>"); openClips -= 1; }
        break;

      case KIND.RECT: {
        if (c.w <= 0 || c.h <= 0) break;
        let fill = rgba(c.c);
        if (c.gd !== undefined && c.c2) {
          // `gd` is 1 for across the box and anything else for down it — the
          // two directions the display list carries.
          const id = `evggrad${uid++}`;
          const across = c.gd === 1;
          defs.push(
            `<linearGradient id="${id}" x1="0" y1="0" x2="${across ? 1 : 0}" y2="${across ? 0 : 1}">` +
            `<stop offset="0" stop-color="${rgba(c.c)}"/><stop offset="1" stop-color="${rgba(c.c2)}"/>` +
            `</linearGradient>`);
          fill = `url(#${id})`;
        }
        if (c.bb > 0) body.push(backdrop(c));
        const r = radiiOf(c);
        body.push(uniform(r)
          ? `<rect x="${n(c.x)}" y="${n(c.y)}" width="${n(c.w)}" height="${n(c.h)}"${r[0] ? ` rx="${n(r[0])}"` : ""} fill="${fill}"${rotAttr(c)}/>`
          : `<path d="${roundedPath(c.x, c.y, c.w, c.h, r)}" fill="${fill}"${rotAttr(c)}/>`);
        drawn += 1;
        break;
      }

      case KIND.BORDER: {
        // The GL shader keeps a band from d = -thickness to d = 0: the border
        // sits INSIDE the box, not centred on its edge. An SVG stroke is
        // centred, so the rectangle is inset by half the thickness and the
        // radius comes down by the same amount — otherwise a 2px border on a
        // 100px box covers 101px of it and the corner is a hair too round.
        const t = c.t || 1;
        if (c.w <= t || c.h <= t) break;
        const r = radiiOf(c).map((v) => Math.max(0, v - t / 2));
        const x = c.x + t / 2, y = c.y + t / 2, w = c.w - t, h = c.h - t;
        body.push(uniform(r)
          ? `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${r[0] ? ` rx="${n(r[0])}"` : ""} fill="none" stroke="${rgba(c.c)}" stroke-width="${n(t)}"${rotAttr(c)}/>`
          : `<path d="${roundedPath(x, y, w, h, r)}" fill="none" stroke="${rgba(c.c)}" stroke-width="${n(t)}"${rotAttr(c)}/>`);
        drawn += 1;
        break;
      }

      case KIND.IMAGE: {
        const img = c.src ? images.get(c.src) : null;
        if (!img) { missingImages += 1; break; }
        // `preserveAspectRatio="…slice"` IS object-fit: cover — fill the box and
        // crop the overflow, centred, rather than distort the picture. The GL
        // backend computes the same crop as a UV rectangle because a quad has
        // nowhere else to put it.
        let attrs = `x="${n(c.x)}" y="${n(c.y)}" width="${n(c.w)}" height="${n(c.h)}"` +
                    ` preserveAspectRatio="xMidYMid slice" href="${esc(img.src)}"`;
        const transforms = [];
        if (c.rot) {
          const cx = c.rox === undefined ? c.x + c.w / 2 : c.rox;
          const cy = c.roy === undefined ? c.y + c.h / 2 : c.roy;
          transforms.push(`rotate(${n(c.rot)} ${n(cx)} ${n(cy)})`);
        }
        if (c.fx || c.fy) {
          // Mirroring is a scale about the box's own centre, which is what
          // reading the texture backwards amounts to on the GL side.
          const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
          transforms.push(`translate(${n(cx)} ${n(cy)}) scale(${c.fx ? -1 : 1} ${c.fy ? -1 : 1}) translate(${n(-cx)} ${n(-cy)})`);
        }
        if (transforms.length) attrs += ` transform="${transforms.join(" ")}"`;
        const r = radiiOf(c);
        if (r.some((v) => v > 0)) {
          // A photo in a rounded box is clipped by the same shape the box is
          // drawn with — the GL backend runs it through the same distance
          // field for the same reason.
          const id = `evgimgclip${uid++}`;
          defs.push(`<clipPath id="${id}"><path d="${roundedPath(c.x, c.y, c.w, c.h, r)}"/></clipPath>`);
          body.push(`<g clip-path="url(#${id})"><image ${attrs}/></g>`);
        } else {
          body.push(`<image ${attrs}/>`);
        }
        drawnImages += 1;
        drawn += 1;
        break;
      }

      case KIND.TEXT: {
        if (!c.text) break;
        // `xml:space="preserve"` is not optional: SVG collapses runs of spaces
        // by default, and EVG emits a run's leading and trailing space as part
        // of the run it measured. Without it an indented line starts flush.
        let a = `x="${n(c.x)}" y="${n(baselineOf(c))}" fill="${rgba(c.c)}"` +
                ` font-family="&quot;${esc(familyOf(c))}&quot;, ${esc(fallbackStack)}"` +
                ` font-size="${n(c.size)}"`;
        if (c.weight) a += ` font-weight="${esc(c.weight)}"`;
        if (c.italic) a += ` font-style="italic"`;
        body.push(`<text ${a} xml:space="preserve"${rotAttr(c)}>${esc(verbatim(c.text))}</text>`);
        textRuns += 1;
        drawn += 1;
        break;
      }

      case KIND.PATH: {
        const d = ringsPath(c, true);
        if (!d) break;
        // A gradient under a polygon is drawn in its first colour, which is
        // what every other backend does with one — matching them matters more
        // here than being prettier than them.
        body.push(`<path d="${d}" fill="${rgba(c.c)}"${c.eo ? ` fill-rule="evenodd"` : ""}${rotAttr(c)}/>`);
        paths += 1;
        drawn += 1;
        break;
      }

      case KIND.STROKE: {
        const d = ringsPath(c, false);
        if (!d) break;
        body.push(`<path d="${d}" fill="none" stroke="${rgba(c.c)}" stroke-width="${n(c.t || 1)}"` +
                  ` stroke-linejoin="round" stroke-linecap="round"${rotAttr(c)}/>`);
        paths += 1;
        drawn += 1;
        break;
      }

      default:
        break;
    }
  }

  // A producer that pushed more clips than it popped would otherwise leave the
  // markup unbalanced, and an unbalanced tree is repaired by the HTML parser in
  // whatever way it likes.
  while (openClips > 0) { body.push("</g>"); openClips -= 1; }

  svg.setAttribute("viewBox", `0 0 ${n(doc.width)} ${n(doc.height)}`);
  svg.setAttribute("width", n(doc.width));
  svg.setAttribute("height", n(doc.height));
  svg.innerHTML = (defs.length ? `<defs>${defs.join("")}</defs>` : "") + body.join("");

  return {
    drawn, textRuns, paths, images: drawnImages, missingImages, clips,
    // Every element, not `childElementCount`: a clipped run lives inside a
    // <g>, so the top-level count drops the whole of a scrolling panel and
    // reports a frame as nearly empty when it is nothing of the kind.
    nodes: svg.getElementsByTagName("*").length,
    // The ripple is a GPU post-pass over the finished frame. There is no DOM
    // equivalent, and saying so is better than silently dropping it.
    unsupportedEffect: doc.effect ? doc.effect.kind : null,
  };
}

function svgFor(target) {
  if (target && target.namespaceURI === SVG_NS && target.tagName.toLowerCase() === "svg") return target;
  let svg = target.querySelector(":scope > svg");
  if (!svg) {
    svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("xmlns", SVG_NS);
    target.appendChild(svg);
  }
  return svg;
}

/**
 * `backdrop-filter: blur(Npx)` — softening what is already painted behind a
 * rectangle before drawing it.
 *
 * The GL backend needed a render target, a separable blur and a second shader
 * for this. Here it is the CSS property it was named after, reached through a
 * `<foreignObject>`, because SVG filters do not see through to what is under
 * the element.
 *
 * A browser that does not support `backdrop-filter` draws the rectangle and
 * loses only the softening, which is the right failure — the same one the
 * display list's own header asks a backend to have.
 */
function backdrop(c) {
  const r = radiiOf(c);
  const radius = uniform(r) ? `${n(r[0])}px` : r.map((v) => `${n(v)}px`).join(" ");
  return `<foreignObject x="${n(c.x)}" y="${n(c.y)}" width="${n(c.w)}" height="${n(c.h)}">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;` +
    `border-radius:${radius};backdrop-filter:blur(${n(c.bb)}px);-webkit-backdrop-filter:blur(${n(c.bb)}px)"></div>` +
    `</foreignObject>`;
}
