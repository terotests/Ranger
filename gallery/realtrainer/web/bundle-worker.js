// gallery/evg/gl/evg-webgl.js
var KIND = {
  RECT: 0,
  BORDER: 1,
  IMAGE: 2,
  TEXT: 3,
  PUSH_CLIP: 4,
  POP_CLIP: 5,
  PATH: 6,
  STROKE: 7
};
var MODE = { SHAPE: 0, TEXT: 1, IMAGE: 2, COLORTEXT: 3 };
var VERT = `#version 300 es
in vec2 aCorner;          // unit quad, 0..1
in vec4 aRect;            // x, y, w, h in page pixels
in vec4 aColor;           // rgba, 0..1
in vec4 aColor2;          // far gradient stop, rgba 0..1
in vec3 aShape;           // radius (top-left), thickness (0 = fill), mode
in vec4 aRadii;           // the four corners: TL, TR, BR, BL
in float aGrad;           // 0 = flat, 1 = down the box, 2 = across it
in vec4 aUV;              // u0,v0,u1,v1 \u2014 atlas slot, or the image's cover crop
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
  // and the raster transform both do \u2014 an axis title on its side has to land in
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
var FRAG = `#version 300 es
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
// of the triangle strip on a very large quad \u2014 which drew a visible hairline
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
    // Text the browser drew in colours of its own \u2014 a colour emoji. The atlas
    // holds the finished pixels, so they are sampled rather than reduced to a
    // coverage mask; only the run's opacity still applies.
    vec4 glyph = texture(uAtlas, vUV);
    if (glyph.a <= 0.001) discard;
    outColor = vec4(glyph.rgb, glyph.a * vColor.a);
    return;
  }
  if (vMode > 1.5) {
    // Image: the UV rectangle already carries the object-fit crop, so this is
    // a plain sample. The radius still applies \u2014 a photo in a rounded box is
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
var PATH_VERT = `#version 300 es
in vec2 aPos;
uniform vec2 uPage;
uniform vec2 uShift;
void main() {
  vec2 p = aPos + uShift;
  vec2 ndc = vec2((p.x / uPage.x) * 2.0 - 1.0, 1.0 - (p.y / uPage.y) * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
}`;
var PATH_FRAG = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 outColor;
void main() { outColor = uColor; }`;
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
function strokeTriangles(rings, width) {
  const half = Math.max(width, 0.75) / 2;
  const tris = [];
  for (const ring of rings) {
    for (let i = 0; i + 3 < ring.length; i += 2) {
      const x1 = ring[i], y1 = ring[i + 1], x2 = ring[i + 2], y2 = ring[i + 3];
      let dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      const nx = -dy / len * half, ny = dx / len * half;
      tris.push(
        x1 + nx,
        y1 + ny,
        x2 + nx,
        y2 + ny,
        x2 - nx,
        y2 - ny,
        x1 + nx,
        y1 + ny,
        x2 - nx,
        y2 - ny,
        x1 - nx,
        y1 - ny
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
function compile(gl2, type, src) {
  const s = gl2.createShader(type);
  gl2.shaderSource(s, src);
  gl2.compileShader(s);
  if (!gl2.getShaderParameter(s, gl2.COMPILE_STATUS)) {
    throw new Error("shader: " + gl2.getShaderInfoLog(s));
  }
  return s;
}
var LRO = "\u202D";
var PDF = "\u202C";
var verbatim = (t) => LRO + t + PDF;
var fallbackStack = "sans-serif";
var familyOf = (c) => c.font && c.font.endsWith("-Bold") ? c.font.slice(0, -5) : c.font || "";
function fontSpec(c, dpr2) {
  return `${c.italic ? "italic " : ""}${c.weight ? c.weight + " " : ""}${c.size * dpr2}px "${familyOf(c)}", ${fallbackStack}`;
}
function runKey(c, dpr2) {
  return `${dpr2}|${c.font || ""}|${c.size}|${c.weight || ""}|${c.italic ? 1 : 0}|${c.text}`;
}
function atlasRuns(cmds, dpr2, view, onlyVisible) {
  const seen = /* @__PURE__ */ new Set();
  const runs = [];
  for (const c of cmds) {
    if (c.k !== KIND.TEXT || !c.text) continue;
    if (onlyVisible && view) {
      const w = c.w || 0, h = c.h || (c.size || 0) * 1.5;
      if (c.x > view.w || c.y > view.h || c.x + w < 0 || c.y + h < 0) continue;
    }
    const key = runKey(c, dpr2);
    if (seen.has(key)) continue;
    seen.add(key);
    runs.push(c);
  }
  return runs;
}
var nextPow2 = (n) => {
  let p = 1;
  while (p < n) p *= 2;
  return p;
};
var PAD = 2;
function measureRun(ctx, c, dpr2) {
  ctx.font = fontSpec(c, dpr2);
  const m = ctx.measureText(verbatim(c.text));
  const asc = m.actualBoundingBoxAscent || c.size * dpr2 * 0.8;
  const desc = m.actualBoundingBoxDescent || c.size * dpr2 * 0.25;
  const faceAsc = m.fontBoundingBoxAscent || (c.h ? c.h * dpr2 * 0.78 : c.size * dpr2 * 1.05);
  const faceDesc = m.fontBoundingBoxDescent || c.size * dpr2 * 0.212;
  return { c, w: Math.ceil(m.width) + PAD * 2, h: Math.ceil(asc + desc) + PAD * 2, asc, faceAsc, faceDesc };
}
function shelfOf(w, limit) {
  return { w, limit, x: 0, y: 0, rowH: 0 };
}
function placeRun(shelf, m) {
  if (shelf.x + m.w > shelf.w) {
    shelf.x = 0;
    shelf.y += shelf.rowH;
    shelf.rowH = 0;
  }
  if (shelf.y + m.h > shelf.limit) return false;
  m.x = shelf.x;
  m.y = shelf.y;
  shelf.x += m.w;
  shelf.rowH = Math.max(shelf.rowH, m.h);
  return true;
}
var shelfHeight = (shelf) => nextPow2(Math.max(64, shelf.y + shelf.rowH));
function slotOf(m, dpr2, texW, texH, colored) {
  return {
    u0: m.x / texW,
    v0: m.y / texH,
    u1: (m.x + m.w) / texW,
    v1: (m.y + m.h) / texH,
    w: m.w / dpr2,
    h: m.h / dpr2,
    asc: m.asc / dpr2,
    pad: PAD / dpr2,
    faceAsc: m.faceAsc / dpr2,
    faceDesc: m.faceDesc / dpr2,
    colored
  };
}
function rasterRuns(c2, measured, dpr2) {
  c2.textBaseline = "alphabetic";
  c2.fillStyle = "#fff";
  for (const m of measured) {
    c2.font = fontSpec(m.c, dpr2);
    c2.fillText(verbatim(m.c.text), m.x + PAD, m.y + PAD + m.asc);
  }
}
function buildTextAtlas(cmds, dpr2, view, maxTex) {
  let runs = atlasRuns(cmds, dpr2, view, false);
  let culled = false;
  const limit = Math.max(2048, maxTex || 2048);
  const canvas2 = document.createElement("canvas");
  const ctx = canvas2.getContext("2d");
  if (!runs.length) return { canvas: null, slots: /* @__PURE__ */ new Map(), culled, shelf: shelfOf(Math.min(2048, limit), limit) };
  const measure = (c) => measureRun(ctx, c, dpr2);
  const pack = (list, atlasW2) => {
    const shelf2 = shelfOf(atlasW2, Infinity);
    for (const m of list) placeRun(shelf2, m);
    shelf2.limit = limit;
    return shelf2;
  };
  let measured = runs.map(measure);
  let atlasW = Math.min(2048, nextPow2(Math.max(512, ...measured.map((m) => m.w))));
  let shelf = pack(measured, atlasW);
  while (shelfHeight(shelf) > limit && atlasW < limit) {
    atlasW = Math.min(limit, atlasW * 2);
    shelf = pack(measured, atlasW);
  }
  if (shelfHeight(shelf) > limit && view) {
    runs = atlasRuns(cmds, dpr2, view, true);
    culled = true;
    measured = runs.map(measure);
    shelf = pack(measured, atlasW);
  }
  while (shelfHeight(shelf) > limit && measured.length > 1) {
    measured = measured.slice(0, Math.max(1, Math.floor(measured.length / 2)));
    culled = true;
    shelf = pack(measured, atlasW);
  }
  canvas2.width = atlasW;
  canvas2.height = Math.min(limit, shelfHeight(shelf));
  const c2 = canvas2.getContext("2d");
  c2.clearRect(0, 0, canvas2.width, canvas2.height);
  rasterRuns(c2, measured, dpr2);
  const slots = /* @__PURE__ */ new Map();
  for (const m of measured) {
    const s = slotOf(m, dpr2, canvas2.width, canvas2.height, false);
    s._px = m.x;
    s._py = m.y;
    s._pw = m.w;
    s._ph = m.h;
    slots.set(runKey(m.c, dpr2), s);
  }
  markColoredSlots(c2, slots);
  return { canvas: canvas2, slots, culled, shelf };
}
function inkIsColored(data, W2, x0, y0, x1, y1) {
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const i = (y * W2 + x) * 4;
      if (data[i + 3] < 24) continue;
      if (data[i] < 232 || data[i + 1] < 232 || data[i + 2] < 232) return true;
    }
  }
  return false;
}
function markColoredSlots(c2, slots) {
  let img;
  try {
    img = c2.getImageData(0, 0, c2.canvas.width, c2.canvas.height);
  } catch (_) {
    return;
  }
  const data = img.data, W2 = img.width;
  for (const s of slots.values()) {
    const x0 = s._px | 0, y0 = s._py | 0;
    const x1 = Math.min(W2, x0 + Math.ceil(s._pw));
    const y1 = Math.min(img.height, y0 + Math.ceil(s._ph));
    s.colored = inkIsColored(data, W2, x0, y0, x1, y1);
    delete s._px;
    delete s._py;
    delete s._pw;
    delete s._ph;
  }
}
function coverUV(sw, sh, bw, bh) {
  if (!sw || !sh || !bw || !bh) return [0, 0, 1, 1];
  const src = sw / sh, box = bw / bh;
  if (src > box) {
    const f2 = box / src;
    return [(1 - f2) / 2, 0, 1 - (1 - f2) / 2, 1];
  }
  const f = src / box;
  return [0, (1 - f) / 2, 1, 1 - (1 - f) / 2];
}
function makeTexture(gl2, source) {
  const t = gl2.createTexture();
  gl2.bindTexture(gl2.TEXTURE_2D, t);
  gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA, gl2.RGBA, gl2.UNSIGNED_BYTE, source);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.LINEAR);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.LINEAR);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE);
  return t;
}
var PROGRAMS = /* @__PURE__ */ new WeakMap();
var ATLASES = /* @__PURE__ */ new WeakMap();
var IMAGE_TEXTURES = /* @__PURE__ */ new WeakMap();
function growAtlas(gl2, have, texH) {
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
  gl2.deleteTexture(have.tex);
  have.tex = makeTexture(gl2, big);
}
function appendRuns(gl2, have, runs, dpr2) {
  const measured = runs.map((c) => measureRun(have.ctx, c, dpr2));
  const shelf = { ...have.shelf };
  for (const m of measured) {
    if (!placeRun(shelf, m)) return false;
  }
  const needH = Math.min(shelf.limit, shelfHeight(shelf));
  if (needH > have.texH) growAtlas(gl2, have, needH);
  have.shelf = shelf;
  const c2 = have.ctx;
  rasterRuns(c2, measured, dpr2);
  gl2.bindTexture(gl2.TEXTURE_2D, have.tex);
  for (const m of measured) {
    const w = Math.min(m.w, have.texW - m.x);
    const h = Math.min(m.h, have.texH - m.y);
    let colored = false;
    if (w > 0 && h > 0) {
      let img = null;
      try {
        img = c2.getImageData(m.x, m.y, w, h);
      } catch (_) {
        img = null;
      }
      if (img) {
        colored = inkIsColored(img.data, img.width, 0, 0, img.width, img.height);
        gl2.texSubImage2D(gl2.TEXTURE_2D, 0, m.x, m.y, gl2.RGBA, gl2.UNSIGNED_BYTE, img);
      } else {
        gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA, gl2.RGBA, gl2.UNSIGNED_BYTE, have.bitmap);
      }
    }
    have.slots.set(runKey(m.c, dpr2), slotOf(m, dpr2, have.texW, have.texH, colored));
  }
  return true;
}
function atlasFor(gl2, cmds, dpr2, view) {
  const have = ATLASES.get(gl2);
  if (have && !have.culled) {
    const missing = [];
    const seen = /* @__PURE__ */ new Set();
    for (const c of cmds) {
      if (c.k !== KIND.TEXT || !c.text) continue;
      const key = runKey(c, dpr2);
      if (have.slots.has(key) || seen.has(key)) continue;
      seen.add(key);
      missing.push(c);
    }
    if (!missing.length) {
      have.rebuilt = false;
      have.added = 0;
      return have;
    }
    if (have.bitmap && appendRuns(gl2, have, missing, dpr2)) {
      have.rebuilt = false;
      have.added = missing.length;
      return have;
    }
  }
  const keyOf = () => atlasRuns(cmds, dpr2, view, true).map((c) => runKey(c, dpr2)).join("|");
  if (have && have.culled && have.key === keyOf()) {
    have.rebuilt = false;
    have.added = 0;
    return have;
  }
  if (have && have.tex) gl2.deleteTexture(have.tex);
  const maxTex = gl2.getParameter(gl2.MAX_TEXTURE_SIZE) || 2048;
  const { canvas: canvas2, slots, culled, shelf } = buildTextAtlas(cmds, dpr2, view, maxTex);
  const made = {
    key: culled ? keyOf() : null,
    culled,
    slots,
    shelf,
    bitmap: canvas2,
    ctx: canvas2 ? canvas2.getContext("2d") : null,
    texW: canvas2 ? canvas2.width : 1,
    texH: canvas2 ? canvas2.height : 1,
    // Reported in the stats: rebuilding the atlas means rasterising every run
    // on the page and uploading it, and doing that on a frame where nothing
    // about the text changed is the waste this cache exists to stop; adding
    // means the runs that were new. A test can watch them; a timing number
    // on a software GL driver cannot.
    rebuilt: true,
    added: slots.size,
    tex: canvas2 ? makeTexture(gl2, canvas2) : makeTexture(gl2, new ImageData(1, 1))
  };
  ATLASES.set(gl2, made);
  return made;
}
function textureCacheFor(gl2, images) {
  let cache = IMAGE_TEXTURES.get(gl2);
  if (!cache) {
    cache = /* @__PURE__ */ new Map();
    IMAGE_TEXTURES.set(gl2, cache);
  }
  let uploaded = 0;
  for (const [src, img] of images) {
    if (!img) continue;
    const have = cache.get(src);
    if (have && have.img === img) continue;
    if (have && have.tex) gl2.deleteTexture(have.tex);
    cache.set(src, { tex: makeTexture(gl2, img), w: img.naturalWidth, h: img.naturalHeight, img });
    uploaded += 1;
  }
  cache.uploaded = uploaded;
  return cache;
}
var BLUR_VERT = `#version 300 es
in vec2 aCorner;
out vec2 vUV;
void main() {
  vUV = aCorner;
  gl_Position = vec4(aCorner * 2.0 - 1.0, 0.0, 1.0);
}`;
var BLUR_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uSrc;
uniform vec2 uStep;
uniform float uWidth;
uniform float uOffset;
out vec4 outColor;
void main() {
  // Named mid and not h-a-l-f: that is a reserved word in GLSL ES 3.00 and the
  // shader will not compile with it. And no backticks in this comment either \u2014
  // it lives inside a template literal, and one would end the shader here.
  float mid = floor(uWidth * 0.5);
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 129; i++) {
    if (float(i) >= uWidth) break;
    float k = float(i) - mid + uOffset;
    // No clamp of our own: the target is exactly the copied region, so the
    // sampler's own CLAMP_TO_EDGE is the measured rule \u2014 a sample that falls
    // off the element takes the border pixel's value.
    acc += texture(uSrc, vUV + uStep * k);
  }
  outColor = acc / uWidth;
}`;
var BACKDROP_VERT = `#version 300 es
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
var BACKDROP_FRAG = `#version 300 es
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
  // REPLACES what is under it rather than tinting it \u2014 the pixels it is made
  // of are those same pixels, softened.
  outColor = vec4(c.rgb, cov);
}`;
function boxesForSigma(sigma) {
  let d = Math.floor(sigma * 3 * Math.sqrt(2 * Math.PI) / 4 + 0.5);
  if (d < 1) d = 1;
  return d % 2 === 1 ? [{ w: d, off: 0 }, { w: d, off: 0 }, { w: d, off: 0 }] : [{ w: d, off: 0 }, { w: d, off: 1 }, { w: d + 1, off: 0 }];
}
var RIPPLE_VERT = `#version 300 es
in vec2 aPos;
out vec2 vUV;
void main() {
  vUV = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;
var RIPPLE_FRAG = `#version 300 es
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
  // every ring at uRes.y minus where it was touched \u2014 a click near the top of
  // the dashboard rippled near the bottom of it. Everything below this line is
  // in page space, and the two places that hand a vector back to GL flip it
  // back.
  vec2 p = vec2(vUV.x, 1.0 - vUV.y) * uRes;

  // SUM the drops. This is the whole of the interference: two rings that
  // cross reinforce where their crests meet and cancel where a crest meets a
  // trough, and nothing here implements that \u2014 it is what adding waves does.
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
    // an expanding target rather than a circle. They cost no state \u2014 the
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
  // slope, and the slope is the normal \u2014 so nothing has to be computed or
  // stored to light this surface that the displacement did not already need.
  //
  // The gradient is taken in SCREEN SPACE with dFdx/dFdy rather than by
  // differentiating the sum by hand. Two reasons: the analytic derivative of
  // a Gaussian times a sine, summed over every ring of every drop, is a
  // second expression that has to be kept in step with the first one forever
  // \u2014 and this one is exact for whatever the first one happens to be. The
  // loops above branch only on uniforms, so every fragment in a quad takes
  // the same path and the derivative is well defined.
  //
  // dFdy differentiates against WINDOW y, which runs up, while the height
  // field and the light are both in page space, which runs down \u2014 so the y
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

  // The specular lives on the FLANK of a wave and not on its top \u2014 that is
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
var RIPPLE_TARGET = /* @__PURE__ */ new WeakMap();
function rippleTargetFor(gl2, w, h) {
  let t = RIPPLE_TARGET.get(gl2);
  if (!t) {
    t = { w: 0, h: 0, tex: null, fbo: null, depth: null, complete: false };
    RIPPLE_TARGET.set(gl2, t);
  }
  if (t.w === w && t.h === h && t.tex) return t;
  if (t.tex) gl2.deleteTexture(t.tex);
  if (t.fbo) gl2.deleteFramebuffer(t.fbo);
  t.tex = gl2.createTexture();
  gl2.bindTexture(gl2.TEXTURE_2D, t.tex);
  gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA8, w, h, 0, gl2.RGBA, gl2.UNSIGNED_BYTE, null);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.LINEAR);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.LINEAR);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE);
  t.fbo = gl2.createFramebuffer();
  gl2.bindFramebuffer(gl2.FRAMEBUFFER, t.fbo);
  gl2.framebufferTexture2D(gl2.FRAMEBUFFER, gl2.COLOR_ATTACHMENT0, gl2.TEXTURE_2D, t.tex, 0);
  if (t.depth) gl2.deleteRenderbuffer(t.depth);
  t.depth = gl2.createRenderbuffer();
  gl2.bindRenderbuffer(gl2.RENDERBUFFER, t.depth);
  gl2.renderbufferStorage(gl2.RENDERBUFFER, gl2.DEPTH24_STENCIL8, w, h);
  gl2.framebufferRenderbuffer(gl2.FRAMEBUFFER, gl2.DEPTH_STENCIL_ATTACHMENT, gl2.RENDERBUFFER, t.depth);
  t.complete = gl2.checkFramebufferStatus(gl2.FRAMEBUFFER) === gl2.FRAMEBUFFER_COMPLETE;
  gl2.bindRenderbuffer(gl2.RENDERBUFFER, null);
  gl2.bindFramebuffer(gl2.FRAMEBUFFER, null);
  t.w = w;
  t.h = h;
  return t;
}
var BLUR_TARGETS = /* @__PURE__ */ new WeakMap();
function blurTargetsFor(gl2, w, h) {
  let t = BLUR_TARGETS.get(gl2);
  if (!t) {
    t = { w: 0, h: 0, tex: [null, null], fbo: [null, null], src: null };
    BLUR_TARGETS.set(gl2, t);
  }
  if (t.w === w && t.h === h && t.src) return t;
  const nw = w, nh = h;
  if (t.src) gl2.deleteTexture(t.src);
  const mk = () => {
    const tex = gl2.createTexture();
    gl2.bindTexture(gl2.TEXTURE_2D, tex);
    gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA8, nw, nh, 0, gl2.RGBA, gl2.UNSIGNED_BYTE, null);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.LINEAR);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.LINEAR);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE);
    return tex;
  };
  for (let i = 0; i < 2; i++) {
    if (t.tex[i]) gl2.deleteTexture(t.tex[i]);
    if (t.fbo[i]) gl2.deleteFramebuffer(t.fbo[i]);
    t.tex[i] = mk();
    t.fbo[i] = gl2.createFramebuffer();
    gl2.bindFramebuffer(gl2.FRAMEBUFFER, t.fbo[i]);
    gl2.framebufferTexture2D(gl2.FRAMEBUFFER, gl2.COLOR_ATTACHMENT0, gl2.TEXTURE_2D, t.tex[i], 0);
  }
  t.src = mk();
  gl2.bindFramebuffer(gl2.FRAMEBUFFER, null);
  t.w = nw;
  t.h = nh;
  return t;
}
function programsFor(gl2) {
  const found = PROGRAMS.get(gl2);
  if (found) return found;
  const prog = gl2.createProgram();
  gl2.attachShader(prog, compile(gl2, gl2.VERTEX_SHADER, VERT));
  gl2.attachShader(prog, compile(gl2, gl2.FRAGMENT_SHADER, FRAG));
  gl2.linkProgram(prog);
  if (!gl2.getProgramParameter(prog, gl2.LINK_STATUS)) {
    throw new Error("link: " + gl2.getProgramInfoLog(prog));
  }
  const blurProg = gl2.createProgram();
  gl2.attachShader(blurProg, compile(gl2, gl2.VERTEX_SHADER, BLUR_VERT));
  gl2.attachShader(blurProg, compile(gl2, gl2.FRAGMENT_SHADER, BLUR_FRAG));
  gl2.linkProgram(blurProg);
  if (!gl2.getProgramParameter(blurProg, gl2.LINK_STATUS)) {
    throw new Error("link blur: " + gl2.getProgramInfoLog(blurProg));
  }
  const rippleProg = gl2.createProgram();
  gl2.attachShader(rippleProg, compile(gl2, gl2.VERTEX_SHADER, RIPPLE_VERT));
  gl2.attachShader(rippleProg, compile(gl2, gl2.FRAGMENT_SHADER, RIPPLE_FRAG));
  gl2.linkProgram(rippleProg);
  if (!gl2.getProgramParameter(rippleProg, gl2.LINK_STATUS)) {
    throw new Error("link ripple: " + gl2.getProgramInfoLog(rippleProg));
  }
  const backdropProg = gl2.createProgram();
  gl2.attachShader(backdropProg, compile(gl2, gl2.VERTEX_SHADER, BACKDROP_VERT));
  gl2.attachShader(backdropProg, compile(gl2, gl2.FRAGMENT_SHADER, BACKDROP_FRAG));
  gl2.linkProgram(backdropProg);
  if (!gl2.getProgramParameter(backdropProg, gl2.LINK_STATUS)) {
    throw new Error("link backdrop: " + gl2.getProgramInfoLog(backdropProg));
  }
  const pathProg = gl2.createProgram();
  gl2.attachShader(pathProg, compile(gl2, gl2.VERTEX_SHADER, PATH_VERT));
  gl2.attachShader(pathProg, compile(gl2, gl2.FRAGMENT_SHADER, PATH_FRAG));
  gl2.linkProgram(pathProg);
  if (!gl2.getProgramParameter(pathProg, gl2.LINK_STATUS)) {
    throw new Error("link path: " + gl2.getProgramInfoLog(pathProg));
  }
  const made = {
    prog,
    pathProg,
    cornerLoc: gl2.getAttribLocation(prog, "aCorner"),
    uPage: gl2.getUniformLocation(prog, "uPage"),
    uShift: gl2.getUniformLocation(prog, "uShift"),
    uAtlas: gl2.getUniformLocation(prog, "uAtlas"),
    uImage: gl2.getUniformLocation(prog, "uImage"),
    pathPosLoc: gl2.getAttribLocation(pathProg, "aPos"),
    pathPageLoc: gl2.getUniformLocation(pathProg, "uPage"),
    pathShiftLoc: gl2.getUniformLocation(pathProg, "uShift"),
    pathColorLoc: gl2.getUniformLocation(pathProg, "uColor"),
    blurProg,
    blurCornerLoc: gl2.getAttribLocation(blurProg, "aCorner"),
    blurSrc: gl2.getUniformLocation(blurProg, "uSrc"),
    blurStep: gl2.getUniformLocation(blurProg, "uStep"),
    blurWidth: gl2.getUniformLocation(blurProg, "uWidth"),
    blurOffset: gl2.getUniformLocation(blurProg, "uOffset"),
    rippleProg,
    ripplePosLoc: gl2.getAttribLocation(rippleProg, "aPos"),
    rippleSrc: gl2.getUniformLocation(rippleProg, "uSrc"),
    rippleRes: gl2.getUniformLocation(rippleProg, "uRes"),
    rippleDrops: gl2.getUniformLocation(rippleProg, "uDrops"),
    rippleCount: gl2.getUniformLocation(rippleProg, "uCount"),
    rippleSpeed: gl2.getUniformLocation(rippleProg, "uSpeed"),
    rippleWidth: gl2.getUniformLocation(rippleProg, "uWidth"),
    rippleStrength: gl2.getUniformLocation(rippleProg, "uStrength"),
    rippleDecay: gl2.getUniformLocation(rippleProg, "uDecay"),
    rippleHi: gl2.getUniformLocation(rippleProg, "uHi"),
    rippleRings: gl2.getUniformLocation(rippleProg, "uRings"),
    rippleStagger: gl2.getUniformLocation(rippleProg, "uStagger"),
    rippleFalloff: gl2.getUniformLocation(rippleProg, "uFalloff"),
    rippleShine: gl2.getUniformLocation(rippleProg, "uShine"),
    rippleGloss: gl2.getUniformLocation(rippleProg, "uGloss"),
    rippleBump: gl2.getUniformLocation(rippleProg, "uBump"),
    rippleLight: gl2.getUniformLocation(rippleProg, "uLight"),
    backdropProg,
    backdropPosLoc: gl2.getAttribLocation(backdropProg, "aPos"),
    backdropUVLoc: gl2.getAttribLocation(backdropProg, "aUV"),
    backdropCornerLoc: gl2.getAttribLocation(backdropProg, "aCorner"),
    backdropSrc: gl2.getUniformLocation(backdropProg, "uSrc"),
    backdropHalf: gl2.getUniformLocation(backdropProg, "uHalf"),
    backdropRadius: gl2.getUniformLocation(backdropProg, "uRadius")
  };
  PROGRAMS.set(gl2, made);
  return made;
}
function prepareDisplayList(gl2, doc, opts = {}) {
  return buildFrame(gl2, doc, opts);
}
function buildFrame(gl2, doc, opts = {}) {
  const dpr2 = opts.dpr || 1;
  const images = opts.images || /* @__PURE__ */ new Map();
  const cmds = doc.list.cmds;
  const built = programsFor(gl2);
  const prog = built.prog;
  gl2.useProgram(prog);
  const { tex: atlas, slots, rebuilt: atlasRebuilt, added: atlasAdded } = atlasFor(gl2, cmds, dpr2, { w: doc.width, h: doc.height });
  const textures = textureCacheFor(gl2, images);
  const texturesUploaded = textures.uploaded | 0;
  const rects = [], colors = [], colors2 = [], grads = [], shapes = [], uvs = [], rots = [], radii = [];
  const pushRadii = (c) => {
    if (c.rc) radii.push(c.rc[0], c.rc[1], c.rc[2], c.rc[3]);
    else {
      const r = c.r || 0;
      radii.push(r, r, r, r);
    }
  };
  const origins = [];
  const runs = [];
  let missingImages = 0, drawnImages = 0;
  const clipStack = [];
  let clip = null;
  const layerStack = [];
  let layer = 0;
  const pushRun = (start, count2, tex) => {
    if (count2 > 0) runs.push({ kind: "quads", start, count: count2, tex, clip, layer });
  };
  let runStart = 0;
  const flush = () => {
    const n = rects.length / 4;
    pushRun(runStart, n - runStart, null);
    runStart = n;
  };
  const pushPath = (op) => {
    flush();
    runs.push(Object.assign(op, { clip, layer }));
  };
  for (const c of cmds) {
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
      const col3 = c.c || [0, 0, 0, 1];
      const rgba = [col3[0] / 255, col3[1] / 255, col3[2] / 255, col3[3]];
      if (c.k === KIND.STROKE) {
        const tris = strokeTriangles(rings, c.t || 1);
        if (tris.length) pushPath({ kind: "tris", verts: new Float32Array(tris), color: rgba });
      } else {
        pushPath({
          kind: "fill",
          rings: rings.map((r) => new Float32Array(r)),
          bounds: boundsOf(rings),
          evenOdd: !!c.eo,
          color: rgba
        });
      }
      continue;
    }
    if (c.k === KIND.IMAGE) {
      const t = c.src && textures.get(c.src);
      if (!t) {
        missingImages += 1;
        continue;
      }
      flush();
      const uv = coverUV(t.w, t.h, c.w, c.h);
      const u0 = c.fx ? uv[2] : uv[0];
      const u1 = c.fx ? uv[0] : uv[2];
      const v0 = c.fy ? uv[3] : uv[1];
      const v1 = c.fy ? uv[1] : uv[3];
      rects.push(c.x, c.y, c.w, c.h);
      uvs.push(u0, v0, u1, v1);
      shapes.push(c.r || 0, 0, MODE.IMAGE);
      pushRadii(c);
      rots.push((c.rot || 0) * Math.PI / 180);
      origins.push(c.rox || 0, c.roy || 0, c.rox === void 0 ? 0 : 1);
      colors.push(1, 1, 1, 1);
      colors2.push(1, 1, 1, 1);
      grads.push(0);
      pushRun(runStart, 1, t.tex);
      runStart = rects.length / 4;
      drawnImages += 1;
      continue;
    }
    if (c.k === KIND.TEXT) {
      const s = slots.get(runKey(c, dpr2));
      if (!s) continue;
      const halfLeading = c.h ? (c.h - (s.faceAsc + s.faceDesc)) / 2 : 0;
      rects.push(c.x - s.pad, c.y + halfLeading + s.faceAsc - (s.pad + s.asc), s.w, s.h);
      uvs.push(s.u0, s.v0, s.u1, s.v1);
      shapes.push(0, 0, s.colored ? MODE.COLORTEXT : MODE.TEXT);
      radii.push(0, 0, 0, 0);
    } else {
      rects.push(c.x, c.y, c.w, c.h);
      uvs.push(0, 0, 0, 0);
      shapes.push(c.r || 0, c.k === KIND.BORDER ? c.t || 1 : 0, MODE.SHAPE);
      pushRadii(c);
    }
    rots.push((c.rot || 0) * Math.PI / 180);
    origins.push(c.rox || 0, c.roy || 0, c.rox === void 0 ? 0 : 1);
    const col = c.c || [0, 0, 0, 1];
    colors.push(col[0] / 255, col[1] / 255, col[2] / 255, col[3]);
    const col2 = c.c2 || col;
    colors2.push(col2[0] / 255, col2[1] / 255, col2[2] / 255, col2[3]);
    grads.push(c.c2 ? c.gd === 1 ? 2 : 1 : 0);
  }
  flush();
  const count = rects.length / 4;
  const quad = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
  const vao = gl2.createVertexArray();
  gl2.bindVertexArray(vao);
  const blurVao = gl2.createVertexArray();
  gl2.bindVertexArray(blurVao);
  const blurQuadBuf = gl2.createBuffer();
  gl2.bindBuffer(gl2.ARRAY_BUFFER, blurQuadBuf);
  gl2.bufferData(gl2.ARRAY_BUFFER, quad, gl2.STATIC_DRAW);
  gl2.enableVertexAttribArray(built.blurCornerLoc);
  gl2.vertexAttribPointer(built.blurCornerLoc, 2, gl2.FLOAT, false, 0, 0);
  const backdropVao = gl2.createVertexArray();
  gl2.bindVertexArray(backdropVao);
  const backdropBuf = gl2.createBuffer();
  gl2.bindBuffer(gl2.ARRAY_BUFFER, backdropBuf);
  gl2.enableVertexAttribArray(built.backdropPosLoc);
  gl2.vertexAttribPointer(built.backdropPosLoc, 2, gl2.FLOAT, false, 24, 0);
  gl2.enableVertexAttribArray(built.backdropUVLoc);
  gl2.vertexAttribPointer(built.backdropUVLoc, 2, gl2.FLOAT, false, 24, 8);
  gl2.enableVertexAttribArray(built.backdropCornerLoc);
  gl2.vertexAttribPointer(built.backdropCornerLoc, 2, gl2.FLOAT, false, 24, 16);
  gl2.bindVertexArray(vao);
  const cornerBuf = gl2.createBuffer();
  gl2.bindBuffer(gl2.ARRAY_BUFFER, cornerBuf);
  gl2.bufferData(gl2.ARRAY_BUFFER, quad, gl2.STATIC_DRAW);
  const cornerLoc = built.cornerLoc;
  gl2.enableVertexAttribArray(cornerLoc);
  gl2.vertexAttribPointer(cornerLoc, 2, gl2.FLOAT, false, 0, 0);
  gl2.vertexAttribDivisor(cornerLoc, 0);
  const instanced = [
    { name: "aRect", data: rects, size: 4 },
    { name: "aColor", data: colors, size: 4 },
    { name: "aColor2", data: colors2, size: 4 },
    { name: "aGrad", data: grads, size: 1 },
    { name: "aShape", data: shapes, size: 3 },
    { name: "aRadii", data: radii, size: 4 },
    { name: "aUV", data: uvs, size: 4 },
    { name: "aRot", data: rots, size: 1 },
    { name: "aOrigin", data: origins, size: 3 }
  ];
  for (const a of instanced) {
    a.buf = gl2.createBuffer();
    gl2.bindBuffer(gl2.ARRAY_BUFFER, a.buf);
    gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(a.data), gl2.STATIC_DRAW);
    a.loc = gl2.getAttribLocation(prog, a.name);
    if (a.loc < 0) continue;
    gl2.enableVertexAttribArray(a.loc);
    gl2.vertexAttribDivisor(a.loc, 1);
  }
  const pointAt = (first) => {
    for (const a of instanced) {
      if (a.loc < 0) continue;
      gl2.bindBuffer(gl2.ARRAY_BUFFER, a.buf);
      gl2.vertexAttribPointer(a.loc, a.size, gl2.FLOAT, false, 0, first * a.size * 4);
    }
  };
  const pathProg = built.pathProg;
  const pathVao = gl2.createVertexArray();
  gl2.bindVertexArray(pathVao);
  const pathBuf = gl2.createBuffer();
  gl2.bindBuffer(gl2.ARRAY_BUFFER, pathBuf);
  const pathPosLoc = built.pathPosLoc;
  gl2.enableVertexAttribArray(pathPosLoc);
  gl2.vertexAttribPointer(pathPosLoc, 2, gl2.FLOAT, false, 0, 0);
  const pathPageLoc = built.pathPageLoc;
  const pathColorLoc = built.pathColorLoc;
  gl2.bindVertexArray(vao);
  const baseShifts = (doc.list.shifts || []).map((s) => [s[0], s[1]]);
  const frame2 = {
    doc,
    dispose() {
      for (const a of instanced) gl2.deleteBuffer(a.buf);
      gl2.deleteBuffer(cornerBuf);
      gl2.deleteBuffer(blurQuadBuf);
      gl2.deleteBuffer(backdropBuf);
      gl2.deleteBuffer(pathBuf);
      gl2.deleteVertexArray(vao);
      gl2.deleteVertexArray(blurVao);
      gl2.deleteVertexArray(backdropVao);
      gl2.deleteVertexArray(pathVao);
    }
  };
  let fresh = true;
  frame2.draw = (shiftsNow) => {
    const madeNow = fresh;
    fresh = false;
    const shiftOf = (l) => {
      if (!l) return ZERO_SHIFT;
      const now = shiftsNow && shiftsNow[l - 1] || baseShifts[l - 1] || ZERO_SHIFT;
      const base = baseShifts[l - 1] || ZERO_SHIFT;
      return [now[0] - base[0], now[1] - base[1]];
    };
    let curShift = ZERO_SHIFT;
    gl2.useProgram(prog);
    gl2.bindVertexArray(vao);
    gl2.uniform2f(built.uPage, doc.width, doc.height);
    gl2.uniform2f(built.uShift, 0, 0);
    gl2.uniform1i(built.uAtlas, 0);
    gl2.uniform1i(built.uImage, 1);
    const fx = doc.list.effect;
    const rippling = !!fx && fx.kind === "ripple" && fx.drops && fx.drops.length > 0 && fx.drops.some((d) => Math.exp(-d[2] * fx.decay) > 4e-3);
    let target = rippling ? rippleTargetFor(gl2, gl2.canvas.width, gl2.canvas.height) : null;
    if (target && !target.complete) target = null;
    if (target) gl2.bindFramebuffer(gl2.FRAMEBUFFER, target.fbo);
    gl2.activeTexture(gl2.TEXTURE0);
    gl2.bindTexture(gl2.TEXTURE_2D, atlas);
    gl2.viewport(0, 0, gl2.canvas.width, gl2.canvas.height);
    gl2.disable(gl2.DEPTH_TEST);
    gl2.enable(gl2.BLEND);
    gl2.blendFuncSeparate(gl2.SRC_ALPHA, gl2.ONE_MINUS_SRC_ALPHA, gl2.ONE, gl2.ONE_MINUS_SRC_ALPHA);
    gl2.clearColor(0, 0, 0, 0);
    gl2.clear(gl2.COLOR_BUFFER_BIT);
    const hasStencil = gl2.getContextAttributes().stencil === true;
    let paths = 0, skippedFills = 0;
    const drawTris = (verts, color) => {
      gl2.bindVertexArray(pathVao);
      gl2.useProgram(pathProg);
      gl2.uniform2f(pathPageLoc, doc.width, doc.height);
      gl2.uniform2f(built.pathShiftLoc, curShift[0], curShift[1]);
      gl2.uniform4f(pathColorLoc, color[0], color[1], color[2], color[3]);
      gl2.bindBuffer(gl2.ARRAY_BUFFER, pathBuf);
      gl2.bufferData(gl2.ARRAY_BUFFER, verts, gl2.STREAM_DRAW);
      gl2.drawArrays(gl2.TRIANGLES, 0, verts.length / 2);
    };
    const drawFill = (op) => {
      if (!hasStencil) {
        skippedFills += 1;
        return;
      }
      gl2.bindVertexArray(pathVao);
      gl2.useProgram(pathProg);
      gl2.uniform2f(pathPageLoc, doc.width, doc.height);
      gl2.bindBuffer(gl2.ARRAY_BUFFER, pathBuf);
      gl2.enable(gl2.STENCIL_TEST);
      gl2.colorMask(false, false, false, false);
      gl2.stencilFunc(gl2.ALWAYS, 0, 255);
      if (op.evenOdd) {
        gl2.stencilMask(1);
        gl2.stencilOp(gl2.KEEP, gl2.KEEP, gl2.INVERT);
      } else {
        gl2.stencilMask(255);
        gl2.stencilOpSeparate(gl2.FRONT, gl2.KEEP, gl2.KEEP, gl2.INCR_WRAP);
        gl2.stencilOpSeparate(gl2.BACK, gl2.KEEP, gl2.KEEP, gl2.DECR_WRAP);
      }
      for (const ring of op.rings) {
        gl2.bufferData(gl2.ARRAY_BUFFER, ring, gl2.STREAM_DRAW);
        gl2.drawArrays(gl2.TRIANGLE_FAN, 0, ring.length / 2);
      }
      gl2.colorMask(true, true, true, true);
      gl2.stencilFunc(gl2.NOTEQUAL, 0, op.evenOdd ? 1 : 255);
      gl2.stencilOp(gl2.KEEP, gl2.KEEP, gl2.ZERO);
      gl2.uniform4f(pathColorLoc, op.color[0], op.color[1], op.color[2], op.color[3]);
      const [x0, y0, x1, y1] = op.bounds;
      gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([
        x0,
        y0,
        x1,
        y0,
        x1,
        y1,
        x0,
        y0,
        x1,
        y1,
        x0,
        y1
      ]), gl2.STREAM_DRAW);
      gl2.drawArrays(gl2.TRIANGLES, 0, 6);
      gl2.stencilMask(255);
      gl2.disable(gl2.STENCIL_TEST);
    };
    const sxScale = gl2.canvas.width / doc.width;
    const syScale = gl2.canvas.height / doc.height;
    let scissorOn = false;
    const applyClip = (list) => {
      if (!list) {
        if (scissorOn) {
          gl2.disable(gl2.SCISSOR_TEST);
          scissorOn = false;
        }
        return;
      }
      if (!scissorOn) {
        gl2.enable(gl2.SCISSOR_TEST);
        scissorOn = true;
      }
      let r = null;
      for (const c of list) {
        const sh = shiftOf(c.layer);
        const b = { x: c.x + sh[0], y: c.y + sh[1], w: c.w, h: c.h };
        if (!r) {
          r = b;
          continue;
        }
        const x0 = Math.max(r.x, b.x), y0 = Math.max(r.y, b.y);
        const x1 = Math.min(r.x + r.w, b.x + b.w), y1 = Math.min(r.y + r.h, b.y + b.h);
        r = { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
      }
      const x = Math.round(r.x * sxScale);
      const y = Math.round((doc.height - (r.y + r.h)) * syScale);
      const w = Math.max(0, Math.round(r.w * sxScale));
      const h = Math.max(0, Math.round(r.h * syScale));
      gl2.scissor(x, y, w, h);
    };
    let backdrops = 0;
    const drawBackdrop = (c) => {
      const sigma = c.bb * dpr2;
      const bx = Math.round((c.x + curShift[0]) * sxScale);
      const by = Math.round((doc.height - (c.y + curShift[1] + c.h)) * syScale);
      const bw = Math.max(1, Math.round(c.w * sxScale));
      const bh = Math.max(1, Math.round(c.h * syScale));
      const rx = Math.max(0, Math.min(bx, gl2.canvas.width - 1));
      const ry = Math.max(0, Math.min(by, gl2.canvas.height - 1));
      const rw = Math.min(gl2.canvas.width - rx, bw);
      const rh = Math.min(gl2.canvas.height - ry, bh);
      if (rw <= 0 || rh <= 0) return;
      const t = blurTargetsFor(gl2, rw, rh);
      gl2.bindTexture(gl2.TEXTURE_2D, t.src);
      gl2.copyTexImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA8, rx, ry, rw, rh, 0);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.LINEAR);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.LINEAR);
      const wasScissor = gl2.isEnabled(gl2.SCISSOR_TEST);
      gl2.disable(gl2.SCISSOR_TEST);
      gl2.disable(gl2.BLEND);
      gl2.useProgram(built.blurProg);
      gl2.bindVertexArray(blurVao);
      gl2.uniform1i(built.blurSrc, 0);
      gl2.activeTexture(gl2.TEXTURE0);
      const boxes = boxesForSigma(sigma);
      let srcTex = t.src, dst = 0;
      for (const axis of [[1 / t.w, 0], [0, 1 / t.h]]) {
        for (const box of boxes) {
          gl2.bindFramebuffer(gl2.FRAMEBUFFER, t.fbo[dst]);
          gl2.viewport(0, 0, t.w, t.h);
          gl2.bindTexture(gl2.TEXTURE_2D, srcTex);
          gl2.uniform2f(built.blurStep, axis[0], axis[1]);
          gl2.uniform1f(built.blurWidth, box.w);
          gl2.uniform1f(built.blurOffset, box.off);
          gl2.drawArrays(gl2.TRIANGLE_STRIP, 0, 4);
          srcTex = t.tex[dst];
          dst = 1 - dst;
        }
      }
      gl2.bindFramebuffer(gl2.FRAMEBUFFER, target ? target.fbo : null);
      gl2.viewport(0, 0, gl2.canvas.width, gl2.canvas.height);
      gl2.enable(gl2.BLEND);
      gl2.useProgram(built.backdropProg);
      gl2.bindVertexArray(backdropVao);
      const u0 = 0, v0 = 0, u1 = 1, v1 = 1;
      const x0 = bx / gl2.canvas.width * 2 - 1, y0 = by / gl2.canvas.height * 2 - 1;
      const x1 = (bx + bw) / gl2.canvas.width * 2 - 1;
      const y1 = (by + bh) / gl2.canvas.height * 2 - 1;
      gl2.bindBuffer(gl2.ARRAY_BUFFER, backdropBuf);
      gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([
        x0,
        y0,
        u0,
        v0,
        0,
        0,
        x1,
        y0,
        u1,
        v0,
        1,
        0,
        x0,
        y1,
        u0,
        v1,
        0,
        1,
        x1,
        y1,
        u1,
        v1,
        1,
        1
      ]), gl2.STREAM_DRAW);
      gl2.bindTexture(gl2.TEXTURE_2D, srcTex);
      gl2.uniform1i(built.backdropSrc, 0);
      gl2.uniform2f(built.backdropHalf, bw / 2, bh / 2);
      gl2.uniform1f(built.backdropRadius, (c.r || 0) * sxScale);
      gl2.drawArrays(gl2.TRIANGLE_STRIP, 0, 4);
      gl2.activeTexture(gl2.TEXTURE0);
      gl2.bindTexture(gl2.TEXTURE_2D, atlas);
      if (wasScissor) gl2.enable(gl2.SCISSOR_TEST);
      backdrops += 1;
    };
    for (const run of runs) {
      curShift = shiftOf(run.layer);
      applyClip(run.clip);
      if (run.kind === "backdrop") {
        drawBackdrop(run.cmd);
        continue;
      }
      if (run.kind === "fill") {
        drawFill(run);
        paths += 1;
        continue;
      }
      if (run.kind === "tris") {
        drawTris(run.verts, run.color);
        paths += 1;
        continue;
      }
      gl2.useProgram(prog);
      gl2.bindVertexArray(vao);
      gl2.uniform2f(built.uShift, curShift[0], curShift[1]);
      if (run.tex) {
        gl2.activeTexture(gl2.TEXTURE1);
        gl2.bindTexture(gl2.TEXTURE_2D, run.tex);
      }
      pointAt(run.start);
      gl2.drawArraysInstanced(gl2.TRIANGLE_STRIP, 0, 4, run.count);
    }
    applyClip(null);
    if (target) {
      gl2.bindFramebuffer(gl2.FRAMEBUFFER, null);
      gl2.viewport(0, 0, gl2.canvas.width, gl2.canvas.height);
      gl2.disable(gl2.BLEND);
      gl2.clearColor(0, 0, 0, 0);
      gl2.clear(gl2.COLOR_BUFFER_BIT);
      gl2.useProgram(built.rippleProg);
      const quad2 = gl2.createBuffer();
      gl2.bindVertexArray(null);
      gl2.bindBuffer(gl2.ARRAY_BUFFER, quad2);
      gl2.bufferData(
        gl2.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl2.STREAM_DRAW
      );
      gl2.enableVertexAttribArray(built.ripplePosLoc);
      gl2.vertexAttribPointer(built.ripplePosLoc, 2, gl2.FLOAT, false, 0, 0);
      gl2.activeTexture(gl2.TEXTURE0);
      gl2.bindTexture(gl2.TEXTURE_2D, target.tex);
      gl2.uniform1i(built.rippleSrc, 0);
      gl2.uniform2f(built.rippleRes, doc.width, doc.height);
      const drops = new Float32Array(24);
      const n = Math.min(8, fx.drops.length);
      for (let i = 0; i < n; i++) {
        drops[i * 3] = fx.drops[i][0];
        drops[i * 3 + 1] = fx.drops[i][1];
        drops[i * 3 + 2] = fx.drops[i][2];
      }
      gl2.uniform3fv(built.rippleDrops, drops);
      gl2.uniform1i(built.rippleCount, n);
      gl2.uniform1f(built.rippleSpeed, fx.speed);
      gl2.uniform1f(built.rippleWidth, fx.width);
      gl2.uniform1f(built.rippleStrength, fx.strength);
      gl2.uniform1f(built.rippleDecay, fx.decay);
      gl2.uniform1f(built.rippleHi, fx.highlight);
      gl2.uniform1i(built.rippleRings, Math.max(1, Math.min(5, Math.round(fx.rings || 1))));
      gl2.uniform1f(built.rippleStagger, fx.stagger || 0);
      gl2.uniform1f(built.rippleFalloff, fx.falloff || 0);
      gl2.uniform1f(built.rippleShine, fx.shine || 0);
      gl2.uniform1f(built.rippleGloss, Math.max(1, fx.gloss || 1));
      gl2.uniform1f(built.rippleBump, fx.bump || 0);
      const L = fx.light || [0, 0, 1];
      gl2.uniform3f(built.rippleLight, L[0], L[1], L[2]);
      gl2.drawArrays(gl2.TRIANGLES, 0, 3);
      gl2.deleteBuffer(quad2);
      gl2.enable(gl2.BLEND);
    }
    return {
      drawn: count,
      textRuns: slots.size,
      images: drawnImages,
      missingImages,
      runs: runs.length,
      paths,
      // What this frame had to make rather than reuse. Both should be 0 on a
      // frame that draws what the last one drew.
      atlasRebuilt: madeNow && atlasRebuilt ? 1 : 0,
      texturesUploaded: madeNow ? texturesUploaded : 0,
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
      rippled: target ? 1 : 0
    };
  };
  return frame2;
}
var ZERO_SHIFT = [0, 0];

// gallery/evg/gl/evg-a11y.js
var HIDDEN_ROLES = /* @__PURE__ */ new Set(["none", "presentation"]);
var CONTENT_ROLES = /* @__PURE__ */ new Set([
  "text",
  "heading",
  "button",
  "gridcell",
  "columnheader",
  "rowheader",
  "checkbox",
  "radio",
  "tab",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "listitem",
  "link"
]);
function elementFor(role) {
  if (role === "button") return document.createElement("button");
  if (role === "textbox") {
    const input = document.createElement("input");
    input.type = "text";
    input.autocapitalize = "off";
    input.autocomplete = "off";
    input.spellcheck = false;
    return input;
  }
  return document.createElement("div");
}
function styleBase(el) {
  const s = el.style;
  s.position = "absolute";
  s.margin = "0";
  s.padding = "0";
  s.border = "0";
  s.background = "transparent";
  s.color = "transparent";
  s.font = "inherit";
  s.fontSize = "10px";
  s.lineHeight = "1";
  s.overflow = "hidden";
  s.whiteSpace = "pre";
  s.outline = "none";
  s.pointerEvents = "none";
  s.userSelect = "none";
}
function setAttr(el, name, value) {
  if (value === null || value === void 0 || value === "") {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== String(value)) {
    el.setAttribute(name, String(value));
  }
}
var TRI = { 1: "false", 2: "true", 3: "mixed" };
function createA11yMirror(host, { canvas: canvas2, onActivate, onFocus, scale = 1, label = "Application", tabbable = "roving" } = {}) {
  const root = document.createElement("div");
  root.className = "evg-a11y";
  root.style.position = "absolute";
  root.style.left = "0";
  root.style.top = "0";
  root.style.right = "0";
  root.style.bottom = "0";
  root.style.overflow = "hidden";
  root.style.pointerEvents = "none";
  host.appendChild(root);
  if (canvas2) {
    canvas2.setAttribute("aria-hidden", "true");
  }
  const els = /* @__PURE__ */ new Map();
  let lastGen = -1;
  let lastFocus = null;
  let settingFocus = false;
  function activate(node) {
    if (onActivate) onActivate(node);
  }
  function ensure(node) {
    let entry = els.get(node.id);
    if (entry && entry.role !== node.role) {
      entry.el.remove();
      entry = null;
    }
    if (!entry) {
      const el = elementFor(node.role);
      styleBase(el);
      if (node.role === "button") {
        el.type = "button";
        el.tabIndex = -1;
      }
      if (node.role === "textbox") {
        el.tabIndex = -1;
        el.style.pointerEvents = "none";
      }
      el.dataset.a11yId = node.id;
      el.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const n = els.get(node.id);
        if (n) activate(n.node);
      });
      entry = { el, role: node.role, node };
      els.set(node.id, entry);
    }
    entry.node = node;
    return entry;
  }
  function applyAria(el, node, byId) {
    const role = node.role;
    if (el.tagName !== "BUTTON") setAttr(el, "role", role);
    const content = CONTENT_ROLES.has(role);
    if (role === "textbox") {
      setAttr(el, "aria-label", node.name);
      const text = node.value || "";
      if (document.activeElement !== el && el.value !== text) el.value = text;
    } else if (role === "status") {
      const text = node.value || node.name || "";
      if (el.textContent !== text) el.textContent = text;
      setAttr(el, "aria-label", null);
    } else if (content) {
      const text = node.name || "";
      if (el.textContent !== text) el.textContent = text;
      setAttr(el, "aria-label", null);
    } else {
      setAttr(el, "aria-label", node.name);
    }
    setAttr(el, "aria-description", node.desc);
    setAttr(el, "aria-roledescription", node.roledesc);
    setAttr(el, "aria-expanded", node.expanded ? TRI[node.expanded] || null : null);
    setAttr(el, "aria-disabled", node.disabled ? "true" : null);
    if (el.tagName === "BUTTON") el.disabled = !!node.disabled;
    if (tabbable === "all" && !(el.tagName === "BUTTON" && node.disabled)) {
      const stop = node.focusable ? 0 : -1;
      if (el.tabIndex !== stop) el.tabIndex = stop;
    }
    setAttr(el, "aria-readonly", node.readonly || null);
    setAttr(el, "aria-required", node.required || null);
    setAttr(el, "aria-invalid", node.invalid || null);
    setAttr(el, "aria-modal", node.modal ? "true" : null);
    setAttr(el, "aria-selected", node.selected ? "true" : null);
    if (!node.checked && node.pressed) {
      setAttr(el, "aria-pressed", role === "button" ? TRI[node.pressed] || null : null);
      setAttr(el, "aria-checked", null);
    } else if (node.checked) {
      const state2 = TRI[node.checked] || null;
      if (role === "button") {
        setAttr(el, "aria-pressed", state2);
        setAttr(el, "aria-checked", null);
      } else {
        setAttr(el, "aria-checked", state2);
        setAttr(el, "aria-pressed", null);
      }
    } else {
      setAttr(el, "aria-pressed", null);
      setAttr(el, "aria-checked", null);
    }
    setAttr(el, "aria-valuenow", node.now == null ? null : node.now);
    setAttr(el, "aria-valuemin", node.min == null ? null : node.min);
    setAttr(el, "aria-valuemax", node.max == null ? null : node.max);
    setAttr(el, "aria-rowcount", node.rows || null);
    setAttr(el, "aria-colcount", node.cols || null);
    setAttr(el, "aria-rowindex", node.row || null);
    setAttr(el, "aria-colindex", node.col || null);
    setAttr(el, "aria-posinset", node.pos || null);
    setAttr(el, "aria-setsize", node.size || null);
    setAttr(el, "aria-level", node.level || null);
    setAttr(el, "aria-orientation", node.orientation || null);
    setAttr(el, "aria-current", node.current || null);
    setAttr(el, "aria-live", node.live === 2 ? "assertive" : node.live === 1 ? "polite" : null);
    const b = node.b || [0, 0, 0, 0];
    const parent = hostNode(node, byId);
    const pb = parent ? parent.b || [0, 0, 0, 0] : [0, 0, 0, 0];
    const left = (b[0] - pb[0]) * scale;
    const top = (b[1] - pb[1]) * scale;
    const w = Math.max(0, b[2] * scale);
    const h = Math.max(0, b[3] * scale);
    const s = el.style;
    if (s.left !== left + "px") s.left = left + "px";
    if (s.top !== top + "px") s.top = top + "px";
    if (s.width !== w + "px") s.width = w + "px";
    if (s.height !== h + "px") s.height = h + "px";
  }
  function applyModal(tree, byId) {
    const modal = tree.nodes.find((n) => n.modal);
    const keep = /* @__PURE__ */ new Set();
    if (modal) {
      let at2 = modal;
      while (at2) {
        keep.add(at2.id);
        at2 = at2.p ? byId.get(at2.p) : null;
      }
    }
    for (const n of tree.nodes) {
      if (n.p !== tree.root) continue;
      const entry = els.get(n.id);
      if (!entry) continue;
      const hide = modal && !keep.has(n.id);
      setAttr(entry.el, "aria-hidden", hide ? "true" : null);
    }
  }
  function hostNode(node, byId) {
    let at2 = node.p ? byId.get(node.p) : null;
    while (at2 && at2.role === "textbox") at2 = at2.p ? byId.get(at2.p) : null;
    return at2;
  }
  function update(tree) {
    if (!tree || !tree.nodes) return { skipped: true };
    if (tree.gen === lastGen && tree.focus === lastFocus) return { skipped: true };
    lastGen = tree.gen;
    const byId = /* @__PURE__ */ new Map();
    for (const n of tree.nodes) byId.set(n.id, n);
    const seen = /* @__PURE__ */ new Set();
    for (const node of tree.nodes) {
      if (HIDDEN_ROLES.has(node.role)) continue;
      seen.add(node.id);
      const entry = ensure(node);
      applyAria(entry.el, node, byId);
      const host2 = hostNode(node, byId);
      const parentEl = host2 ? (els.get(host2.id) || {}).el : root;
      const want = parentEl || root;
      if (entry.el.parentNode !== want) want.appendChild(entry.el);
    }
    for (const [id, entry] of els) {
      if (!seen.has(id)) {
        entry.el.remove();
        els.delete(id);
      }
    }
    applyModal(tree, byId);
    if (tabbable !== "all" && tree.focus !== lastFocus) {
      const prev = lastFocus ? els.get(lastFocus) : null;
      if (prev) prev.el.tabIndex = -1;
    }
    const focused = tree.focus ? els.get(tree.focus) : null;
    if (focused) {
      if (tabbable !== "all") focused.el.tabIndex = 0;
      if (document.activeElement !== focused.el) {
        settingFocus = true;
        try {
          focused.el.focus({ preventScroll: true });
        } finally {
          settingFocus = false;
        }
      }
    }
    lastFocus = tree.focus;
    return { nodes: tree.nodes.length, elements: els.size, gen: tree.gen };
  }
  function destroy() {
    root.remove();
    els.clear();
    if (canvas2) canvas2.removeAttribute("aria-hidden");
  }
  root.addEventListener("focusin", (ev) => {
    if (settingFocus || !onFocus) return;
    const el = ev.target && ev.target.closest ? ev.target.closest("[data-a11y-id]") : null;
    if (!el) return;
    const entry = els.get(el.dataset.a11yId);
    if (entry) onFocus(entry.node);
  });
  root.setAttribute("aria-label", label);
  return {
    root,
    update,
    destroy,
    /** The element a node is mirrored as, or null — the bridge edits in it. */
    elementOf(id) {
      const entry = els.get(id);
      return entry ? entry.el : null;
    },
    get size() {
      return els.size;
    },
    isSettingFocus() {
      return settingFocus;
    }
  };
}
function pressAtCentre(node, press2) {
  const b = node.b || [0, 0, 0, 0];
  const cx = Math.round(b[0] + b[2] / 2);
  const cy = Math.round(b[1] + b[3] / 2);
  press2(cx, cy);
}

// gallery/evg/gl/evg-textinput.js
function createTextInputBridge({ host, canvas: canvas2, onEdit, onComposition, onKey }) {
  const makeProxy = () => {
    const own2 = document.createElement("input");
    own2.type = "text";
    own2.setAttribute("aria-hidden", "true");
    own2.tabIndex = -1;
    own2.autocapitalize = "off";
    own2.autocomplete = "off";
    own2.spellcheck = false;
    Object.assign(own2.style, {
      position: "absolute",
      opacity: "0",
      padding: "0",
      margin: "0",
      border: "0",
      outline: "none",
      background: "transparent",
      color: "transparent",
      caretColor: "transparent",
      zIndex: "1",
      // It must not take the pointer. Ranger does every hit test and places
      // every caret; the proxy only needs the keyboard, and it is sitting
      // exactly on top of the field it serves. Without this it swallows the
      // pointermove over its own box — measured: the I-beam cursor stopped
      // appearing the moment a field was focused, because the canvas never saw
      // the pointer again.
      pointerEvents: "none"
    });
    own2.style.display = "none";
    host.appendChild(own2);
    return own2;
  };
  let own = makeProxy();
  let el = own;
  let active = null;
  let composing = false;
  let echo = false;
  const wired = /* @__PURE__ */ new WeakSet();
  const report = (inputType, isComposing) => {
    if (echo) return;
    onEdit({
      value: el.value,
      selStart: el.selectionStart ?? 0,
      selEnd: el.selectionEnd ?? 0,
      inputType: inputType || "",
      isComposing: !!isComposing
    });
  };
  function wire(target) {
    if (wired.has(target)) return;
    wired.add(target);
    const mine = () => target === el && active !== null;
    target.addEventListener("input", (ev) => {
      if (mine()) report(ev.inputType, ev.isComposing);
    });
    target.addEventListener("beforeinput", (ev) => {
      if (!mine() || !onComposition) return;
      if (ev.inputType !== "insertCompositionText") return;
      const start = target.selectionStart ?? 0;
      const text = ev.data || "";
      onComposition({ active: true, start, end: start + text.length, text });
    });
    target.addEventListener("compositionend", () => {
      if (!mine()) return;
      composing = false;
      if (onComposition) onComposition({ active: false, start: 0, end: 0, text: "" });
    });
    target.addEventListener("compositionstart", () => {
      if (mine()) composing = true;
    });
    target.addEventListener("keyup", () => {
      if (mine()) report("", composing);
    });
    target.addEventListener("select", () => {
      if (mine()) report("", composing);
    });
    target.addEventListener("mouseup", () => {
      if (mine()) report("", composing);
    });
    target.addEventListener("keydown", (ev) => {
      if (!mine() || !onKey) return;
      if (ev.isComposing) return;
      const taken = onKey({
        key: ev.key,
        shiftKey: ev.shiftKey,
        ctrlKey: ev.ctrlKey,
        metaKey: ev.metaKey,
        altKey: ev.altKey,
        preventDefault: () => ev.preventDefault()
      });
      if (taken) ev.preventDefault();
    });
  }
  wire(own);
  function takePointer(target, yes) {
    if (target === own) return;
    target.style.pointerEvents = yes ? "auto" : "none";
    target.style.cursor = yes ? "text" : "";
    target.style.caretColor = "transparent";
  }
  return {
    /** True while a field owns the keyboard. */
    isActive: () => active !== null,
    activeTid: () => active,
    isComposing: () => composing,
    /**
     * Hand the session to a field. `box` is where the field is drawn, in
     * canvas coordinates, so the proxy can sit on top of it.
     */
    focusField(tid, { value, selStart, selEnd, kind, maxLength, readOnly, box }, element) {
      if (!element) {
        const fresh = makeProxy();
        if (el === own) takePointer(own, false);
        own.remove();
        own = fresh;
      }
      const next = element || own;
      if (next !== el) {
        takePointer(el, false);
        if (el === own) own.style.display = "none";
        el = next;
        wire(el);
      }
      takePointer(el, true);
      active = tid;
      echo = true;
      el.type = kind === "password" ? "password" : "text";
      el.inputMode = kind === "number" ? "decimal" : kind === "email" ? "email" : "text";
      el.readOnly = !!readOnly;
      if (maxLength > 0) el.maxLength = maxLength;
      else el.removeAttribute("maxlength");
      el.value = value;
      el.setSelectionRange(selStart, selEnd);
      if (box && el === own) {
        el.style.display = "block";
        el.style.left = box.x + "px";
        el.style.top = box.y + "px";
        el.style.width = box.w + "px";
        el.style.height = box.h + "px";
      }
      if (document.activeElement !== el) el.focus({ preventScroll: true });
      echo = false;
    },
    /**
     * Ranger changed the state — a click moved the caret, say.
     *
     * This also takes the focus BACK, and has to: the page focuses its canvas
     * on every pointerdown so that keys reach it, which quietly ends the
     * session on the second click of a double-click. Measured — the word was
     * selected in Ranger, the proxy still read 4,4 and unfocused, and the
     * keystroke went round the old keydown path and inserted instead of
     * replacing. While a session is active the proxy holds the keyboard, and
     * "active" is not a thing anything else gets to decide by accident.
     */
    sync({ value, selStart, selEnd }) {
      if (active === null) return;
      echo = true;
      if (el.value !== value) el.value = value;
      el.setSelectionRange(selStart, selEnd);
      if (document.activeElement !== el) el.focus({ preventScroll: true });
      echo = false;
    },
    blurField() {
      if (active === null) return;
      this.release();
      if (canvas2) canvas2.focus({ preventScroll: true });
    },
    /**
     * End the session and leave the focus where it is going. Tab out of a
     * field is this: the browser moves the focus to the next control, and
     * the canvas must not take it back on the way.
     */
    release() {
      if (active === null) return;
      active = null;
      composing = false;
      takePointer(el, false);
      if (el === own) {
        own.style.display = "none";
        own.value = "";
      }
    },
    /** For tests and for anything that needs to see the real element. */
    element: () => el
  };
}

// gallery/evg/gl/evg-binary.js
var FIELDS_READ = 36;
function binaryStride(bin) {
  const n = bin.count | 0;
  const len = bin.cmds.length;
  if (n === 0) return FIELDS_READ;
  const stride = len / n | 0;
  if (stride * n !== len) {
    throw new Error(`scene binary: ${len} ints do not divide into ${n} commands`);
  }
  if (stride < FIELDS_READ) {
    throw new Error(`scene binary: ${stride} fields per command, but this reader wants ${FIELDS_READ}`);
  }
  return stride;
}
var rgb = (packed) => [packed >> 16 & 255, packed >> 8 & 255, packed & 255];
function cmdsOfBinary(bin) {
  const n = bin.count | 0;
  const stride = binaryStride(bin);
  const r = bin.cmds, p = bin.pts, e = bin.ends, pool = bin.strings;
  const out = new Array(n);
  for (let i = 0; i < n; i += 1) {
    const b = i * stride;
    const o = { k: r[b] };
    const layer = r[b + 30];
    if (layer > 0) o.layer = layer;
    o.x = r[b + 1] / 100;
    o.y = r[b + 2] / 100;
    o.w = r[b + 3] / 100;
    o.h = r[b + 4] / 100;
    const flags = r[b + 9];
    const radius = r[b + 5] / 100;
    if (flags & 64) o.rc = [radius, r[b + 27] / 100, r[b + 28] / 100, r[b + 29] / 100];
    if (radius > 0) o.r = radius;
    const t = r[b + 6] / 100;
    if (t > 0) o.t = t;
    o.c = [...rgb(r[b + 7]), r[b + 8] / 100];
    if (flags & 1) {
      o.gd = r[b + 10];
      o.c2 = [...rgb(r[b + 11]), r[b + 12] / 100];
    }
    const textIdx = r[b + 15];
    if (textIdx >= 0) {
      o.text = pool[textIdx];
      o.font = pool[r[b + 16]];
      o.size = r[b + 13] / 100;
      const w = r[b + 17];
      if (w >= 0) o.weight = pool[w];
      if (flags & 2) o.italic = true;
    }
    const src = r[b + 18];
    if (src >= 0) o.src = pool[src];
    if (flags & 4) o.fx = true;
    if (flags & 8) o.fy = true;
    const rot = r[b + 14] / 100;
    if (rot !== 0) {
      o.rot = rot;
      if (flags & 32) {
        o.rox = r[b + 24] / 100;
        o.roy = r[b + 25] / 100;
      }
    }
    const bb = r[b + 26] / 100;
    if (bb > 0) o.bb = bb;
    if (flags & 128) {
      o.sh = {
        x: r[b + 31] / 100,
        y: r[b + 32] / 100,
        blur: r[b + 33] / 100,
        c: [...rgb(r[b + 34]), r[b + 35] / 100]
      };
    }
    const pStart = r[b + 19], pCount = r[b + 20];
    if (pCount > 0) {
      const pts = new Array(pCount);
      for (let j = 0; j < pCount; j += 1) pts[j] = p[pStart + j] / 100;
      o.pts = pts;
      const eStart = r[b + 21], eCount = r[b + 22];
      const ends = new Array(eCount);
      for (let j = 0; j < eCount; j += 1) ends[j] = e[eStart + j];
      o.ends = ends;
      if (flags & 16) o.eo = 1;
    }
    out[i] = o;
  }
  return out;
}

// gallery/evg/gl/evg-engine.js
function connectEngine(worker2, init) {
  let nextId = 1;
  const waiting = /* @__PURE__ */ new Map();
  let posts = [];
  let last2 = {};
  let errorFn = (e) => console.error("engine:", e.during, e.message);
  let readyResolve;
  const ready = new Promise((r) => {
    readyResolve = r;
  });
  let frameWaiting = null;
  worker2.onmessage = (ev) => {
    const m = ev.data;
    switch (m.t) {
      case "ready":
        last2 = m.state || {};
        readyResolve(last2);
        break;
      case "ret": {
        const w = waiting.get(m.id);
        if (w) {
          waiting.delete(m.id);
          w.resolve(m.value);
        }
        break;
      }
      case "frame": {
        m.doc.list = { seq: m.doc.seq, shifts: m.shifts, cmds: cmdsOfBinary(m.doc.bin) };
        if (m.doc.effect) m.doc.list.effect = m.doc.effect;
        delete m.doc.bin;
      }
      case "shift":
      case "idle": {
        last2 = m.state || last2;
        const w = frameWaiting;
        frameWaiting = null;
        if (w) w.resolve(m);
        break;
      }
      case "error": {
        if (m.id !== void 0 && waiting.has(m.id)) {
          const w = waiting.get(m.id);
          waiting.delete(m.id);
          w.reject(new Error(m.message));
        } else if (frameWaiting && m.during.startsWith("batch")) {
          const w = frameWaiting;
          frameWaiting = null;
          w.reject(new Error(m.message));
        }
        errorFn(m);
        break;
      }
      default:
        break;
    }
  };
  worker2.postMessage({ t: "init", init });
  const send = (calls, frame2, dt, dirty2) => {
    const batch = { t: "batch", posts, calls, frame: frame2, dt, dirty: dirty2 };
    posts = [];
    worker2.postMessage(batch);
  };
  return {
    ready,
    post(name, ...args) {
      posts.push([name, args]);
    },
    call(name, ...args) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        waiting.set(id, { resolve, reject });
        send([{ id, name, args }], false);
      });
    },
    frame(dt, dirty2) {
      if (frameWaiting) return frameWaiting.promise;
      let resolve, reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      frameWaiting = { promise, resolve, reject };
      send([], true, dt, !!dirty2);
      return promise;
    },
    /** Send what is queued without asking for a frame. */
    flush() {
      if (posts.length) send([], false);
    },
    state() {
      return last2;
    },
    onError(fn) {
      errorFn = fn;
    },
    close() {
      worker2.postMessage({ t: "close" });
    }
  };
}

// gallery/realtrainer/web/main-worker.js
var stage = document.getElementById("stage");
var canvas = document.getElementById("c");
var errEl = document.getElementById("err");
var fpsEl = document.getElementById("fps");
var sceneEl = document.getElementById("scene");
var params = new URLSearchParams(location.search);
var pageParam = params.get("page");
var fit = !pageParam || pageParam === "fit";
var coarseQuery = window.matchMedia ? window.matchMedia("(pointer: coarse)") : null;
var coarse = !!(coarseQuery && coarseQuery.matches);
var W = 0;
var H = 0;
if (fit) {
  document.body.classList.add("fit");
  W = stage.clientWidth;
  H = stage.clientHeight;
} else {
  const [w, h] = pageParam.split("x").map(Number);
  if (w > 0 && h > 0) {
    W = w;
    H = h;
  }
}
var route = params.get("route") || (fit ? "/" : "");
var worker = new Worker(new URL("./worker-bundle.js", import.meta.url), { type: "module" });
var engine = connectEngine(worker, { w: W, h: H, coarse, route });
engine.onError((e) => {
  errEl.textContent = e.during + "\n" + e.message;
});
var dpr = Math.min(2, window.devicePixelRatio || 1);
function sizeCanvas(w, h) {
  W = w;
  H = h;
  dropFrame();
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  if (!fit) {
    stage.style.width = W + "px";
    stage.style.height = H + "px";
  }
}
sizeCanvas(W, H);
var glMode = params.get("gl") || "";
var gl = canvas.getContext("webgl2", {
  antialias: glMode !== "noaa",
  premultipliedAlpha: false,
  stencil: true,
  preserveDrawingBuffer: glMode === "preserve"
});
if (!gl) errEl.textContent = "WebGL 2 is not available in this browser.";
var frame = null;
var frameDoc = null;
function dropFrame() {
  if (frame) frame.dispose();
  frame = null;
  frameDoc = null;
}
var dirty = true;
var scrolledAt = 0;
var STILL_SCROLLING_MS = 200;
var inputAt = 0;
window.__latency = 0;
var state = {};
var lastA11y = '{"nodes":[]}';
var lastShifts = [];
var isMoving = (now) => drag !== null || (state.velocity || 0) !== 0 || now - scrolledAt < STILL_SCROLLING_MS;
function applyReply(r) {
  state = r.state || state;
  if (r.t === "frame") {
    dropFrame();
    if (gl) frame = prepareDisplayList(gl, { width: W, height: H, list: r.doc.list }, { dpr });
    frameDoc = r.doc;
    lastShifts = r.shifts;
    if (r.built && r.built.a11y) {
      lastA11y = r.built.a11y;
      if (!isMoving(performance.now())) {
        try {
          mirror.update(JSON.parse(lastA11y));
        } catch (e) {
          errEl.textContent = String(e);
        }
        mirrorDue = performance.now() + MIRROR_MIN_GAP_MS;
      }
    }
  } else if (r.t === "shift") {
    lastShifts = r.shifts;
  } else {
    return false;
  }
  if (frame) window.__lastStats = frame.draw(lastShifts);
  if (inputAt) {
    window.__latency = performance.now() - inputAt;
    inputAt = 0;
  }
  sceneEl.textContent = state.scene || "";
  canvas.style.cursor = state.overBar ? "default" : "";
  return true;
}
var generation = 0;
var focus = "";
var MIRROR_MIN_GAP_MS = 250;
var mirrorDue = 0;
var mirrorInFlight = false;
var mirror = createA11yMirror(stage, {
  canvas,
  label: "RealTrainer demo",
  tabbable: "all",
  onActivate: (node) => pressAtCentre(node, (x, y) => press(x, y)),
  onFocus: (node) => {
    focus = node.id;
    engine.post("@a11yFocus", focus);
    engine.call("hasField", node.id).then((has) => {
      if (has) {
        if (state.field !== node.id) {
          engine.post("setFocus", node.id);
          engine.post("rebuild");
        }
      } else if (state.field) {
        engine.post("setFocus", "");
        engine.post("rebuild");
      }
      dirty = true;
      syncTextSession();
    });
  }
});
async function syncMirror(now) {
  if (!gl || mirrorInFlight) return;
  if (now !== void 0 && now < mirrorDue) return;
  mirrorDue = (now === void 0 ? performance.now() : now) + MIRROR_MIN_GAP_MS;
  mirrorInFlight = true;
  try {
    generation += 1;
    const json = await engine.call("a11yJson", generation, focus);
    lastA11y = json;
    mirror.update(JSON.parse(json));
  } catch (e) {
    errEl.textContent = String(e && e.stack || e);
  } finally {
    mirrorInFlight = false;
  }
}
function changed() {
  dirty = true;
  mirrorDue = 0;
}
function at(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}
function press(x, y) {
  engine.post("@up", x, y);
  changed();
  syncTextSession();
}
var textInput = createTextInputBridge({
  host: stage,
  canvas,
  onEdit: async ({ value, selStart, selEnd }) => {
    const tid = textInput.activeTid();
    if (!tid) return;
    const took = await engine.call("applyEdit", tid, value, selStart, selEnd);
    if (!took) return;
    changed();
    const after = JSON.parse(await engine.call("fieldStateJson", tid));
    if (after && after.value !== value) textInput.sync(after);
  },
  onKey: (k) => {
    if (k.key === "Tab") {
      textInput.release();
      engine.post("setFocus", "");
      engine.post("rebuild");
      changed();
      return false;
    }
    if (k.key !== "Escape" && k.key !== "Enter") return false;
    engine.call("keyWith", k.key, k.shiftKey, k.ctrlKey || k.metaKey).then((took) => {
      if (took) changed();
      syncTextSession();
    });
    return true;
  }
});
var sessionSync = 0;
async function syncTextSession() {
  const my = ++sessionSync;
  const tid = await engine.call("focusedField");
  if (my !== sessionSync) return;
  if (!tid) {
    textInput.blurField();
    return;
  }
  const st = JSON.parse(await engine.call("fieldStateJson", tid));
  if (my !== sessionSync) return;
  if (!st) {
    textInput.blurField();
    return;
  }
  if (focus !== tid) {
    focus = tid;
    engine.post("@a11yFocus", focus);
  }
  if (textInput.activeTid() === tid) {
    textInput.sync(st);
    return;
  }
  if (!mirror.elementOf(tid)) {
    mirrorDue = 0;
    await syncMirror();
  }
  textInput.focusField(tid, st, mirror.elementOf(tid));
}
stage.addEventListener(
  "wheel",
  (e) => {
    engine.post("scrollHalt");
    engine.post("scrollDocument", e.deltaY);
    dirty = true;
    scrolledAt = performance.now();
    e.preventDefault();
  },
  { passive: false }
);
var drag = null;
var barGrab = null;
canvas.addEventListener("pointerdown", (ev) => {
  const [x, y] = at(ev);
  inputAt = performance.now();
  canvas.setPointerCapture(ev.pointerId);
  barGrab = engine.call("scrollbarGrab", x, y).then((took) => {
    barGrab = null;
    if (took) {
      drag = { bar: true };
      dirty = true;
    }
  });
  drag = { y, moved: false, at: ev.timeStamp || performance.now() };
  engine.post("@down", x, y);
  dirty = true;
});
canvas.addEventListener("pointerup", (ev) => {
  const [x, y] = at(ev);
  const finish = () => {
    if (drag?.bar) {
      drag = null;
      engine.post("scrollbarRelease");
      dirty = true;
      return;
    }
    const scrolled = drag?.moved;
    drag = null;
    if (scrolled) {
      engine.post("scrollRelease");
      engine.post("setPressed", "");
      dirty = true;
      return;
    }
    press(x, y);
  };
  if (barGrab) barGrab.then(finish);
  else finish();
});
canvas.addEventListener("pointercancel", () => {
  if (drag?.bar) engine.post("scrollbarRelease");
  drag = null;
  engine.post("scrollHalt");
  engine.post("setPressed", "");
  dirty = true;
});
canvas.addEventListener("pointermove", (ev) => {
  const [x, y] = at(ev);
  if (drag && drag.bar) {
    engine.post("scrollbarDrag", y);
    dirty = true;
    scrolledAt = ev.timeStamp || performance.now();
    return;
  }
  if (drag) {
    const dy = drag.y - y;
    if (drag.moved || Math.abs(dy) > 6) {
      if (!drag.moved) engine.post("setPressed", "");
      const now = ev.timeStamp || performance.now();
      const dt = now - drag.at;
      drag.at = now;
      drag.moved = true;
      drag.y = y;
      engine.post("scrollDrag", dy, dt);
      dirty = true;
      scrolledAt = now;
    }
    return;
  }
  engine.post("@hover", x, y);
  dirty = true;
});
canvas.addEventListener("pointerleave", () => {
  engine.post("@leave");
  dirty = true;
});
if (fit) {
  let lastKey = "";
  const refit = () => {
    const w = Math.max(240, Math.round(stage.clientWidth));
    const h = Math.max(240, Math.round(stage.clientHeight));
    const c = !!(coarseQuery && coarseQuery.matches);
    const key = `${w}x${h}:${c}`;
    if (key === lastKey) return;
    lastKey = key;
    engine.post("setPointerCoarse", c);
    engine.post("setPageSize", w, h);
    sizeCanvas(w, h);
    changed();
  };
  new ResizeObserver(refit).observe(stage);
  window.addEventListener("resize", refit);
  if (coarseQuery && coarseQuery.addEventListener) coarseQuery.addEventListener("change", refit);
}
var last = performance.now();
var frames = 0;
var fpsAt = last;
async function step(now) {
  const dt = now - last;
  last = now;
  let reply;
  try {
    reply = await engine.frame(dt, dirty);
  } catch (e) {
    errEl.textContent = String(e && e.stack || e);
    requestAnimationFrame(step);
    return;
  }
  dirty = false;
  const gliding = (state.velocity || 0) !== 0;
  applyReply(reply);
  if (gliding || (state.velocity || 0) !== 0) scrolledAt = now;
  if (isMoving(now) === false) syncMirror(now);
  frames += 1;
  if (now - fpsAt >= 500) {
    fpsEl.textContent = Math.round(frames * 1e3 / (now - fpsAt)) + " fps";
    frames = 0;
    fpsAt = now;
  }
  requestAnimationFrame(step);
}
window.__app = {
  sceneName: () => state.scene || "",
  a11yJson: () => lastA11y,
  fieldStateJson: (tid) => engine.call("fieldStateJson", tid),
  focusedField: () => state.field || "",
  plan: { state: () => state.plan || "" },
  chat: { state: () => state.chat || "" },
  press: (id) => {
    engine.post("press", id);
    changed();
    engine.flush();
  },
  typeText: (t) => {
    engine.post("typeText", t);
    changed();
    engine.flush();
  },
  openRoute: (r) => {
    engine.post("openRoute", r);
    changed();
    engine.flush();
  },
  rebuild: () => {
    engine.post("rebuild");
    changed();
    engine.flush();
  },
  engine
};
Object.defineProperty(window, "__lastList", {
  get: () => {
    if (!frameDoc) return '{"cmds":[]}';
    const base = frameDoc.list.shifts || [];
    const stack = [];
    let cur = [0, 0];
    const cmds = frameDoc.list.cmds.map((c) => {
      let o = c;
      if (c.k === 4) {
        stack.push(cur);
        if (c.layer > 0) {
          const now = lastShifts[c.layer - 1] || base[c.layer - 1] || [0, 0];
          const was = base[c.layer - 1] || [0, 0];
          cur = [now[0] - was[0], now[1] - was[1]];
        }
      }
      if (cur[0] !== 0 || cur[1] !== 0) {
        o = { ...c, x: c.x + cur[0], y: c.y + cur[1] };
        if (c.pts) o.pts = c.pts.map((v, i) => v + (i % 2 === 0 ? cur[0] : cur[1]));
      }
      if (c.k === 5) cur = stack.pop() || [0, 0];
      return o;
    });
    return JSON.stringify({ cmds });
  }
});
engine.ready.then((st) => {
  state = st;
  document.fonts.ready.then(() => {
    engine.post("@refreshFonts");
    changed();
    requestAnimationFrame(step);
  });
});
