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
 * Not yet implemented: nested clips beyond a single scissor rectangle; stroke
 * joins and caps are butt joints, which is invisible at the widths a chart uses.
 */

const KIND = {
  RECT: 0, BORDER: 1, IMAGE: 2, TEXT: 3, PUSH_CLIP: 4, POP_CLIP: 5,
  PATH: 6, STROKE: 7,
};

// aShape.z — what the fragment shader should do with this instance.
const MODE = { SHAPE: 0, TEXT: 1, IMAGE: 2 };

const VERT = `#version 300 es
in vec2 aCorner;          // unit quad, 0..1
in vec4 aRect;            // x, y, w, h in page pixels
in vec4 aColor;           // rgba, 0..1
in vec3 aShape;           // radius, thickness (0 = fill), mode
in vec4 aUV;              // u0,v0,u1,v1 — atlas slot, or the image's cover crop
in float aRot;            // radians, about the rect's own centre
uniform vec2 uPage;
out vec4 vColor;
out vec2 vLocal;          // position within the rect, in pixels
out vec2 vHalf;
out float vRadius;
out float vThickness;
out float vMode;
out vec2 vUV;
void main() {
  vec2 p = aRect.xy + aCorner * aRect.zw;
  // A rotated element turns about its own centre, which is what the PDF matrix
  // and the raster transform both do — an axis title on its side has to land in
  // the same place in all three.
  if (aRot != 0.0) {
    vec2 c = aRect.xy + aRect.zw * 0.5;
    float s = sin(aRot), co = cos(aRot);
    vec2 d = p - c;
    p = c + vec2(d.x * co - d.y * s, d.x * s + d.y * co);
  }
  // Page space is y-down like every 2D layout engine; clip space is y-up.
  vec2 ndc = vec2((p.x / uPage.x) * 2.0 - 1.0, 1.0 - (p.y / uPage.y) * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
  vColor = aColor;
  vHalf = aRect.zw * 0.5;
  vLocal = (aCorner - 0.5) * aRect.zw;
  vRadius = aShape.x;
  vThickness = aShape.y;
  vMode = aShape.z;
  vUV = mix(aUV.xy, aUV.zw, aCorner);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec4 vColor;
in vec2 vLocal;
in vec2 vHalf;
in float vRadius;
in float vThickness;
in float vMode;
in vec2 vUV;
uniform sampler2D uAtlas;
uniform sampler2D uImage;
out vec4 outColor;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// The rounded-box coverage of this fragment, 0..1.
//
// fwidth() is a screen-space derivative, and it jumps across the diagonal seam
// of the triangle strip on a very large quad — which drew a visible hairline
// across the page background. Clamping keeps the edge one pixel soft no matter
// how big the quad is.
float boxCoverage(out float d) {
  float r = min(vRadius, min(vHalf.x, vHalf.y));
  d = sdRoundedBox(vLocal, vHalf, r);
  float aa = clamp(fwidth(d), 0.35, 1.5);
  return smoothstep(aa, -aa, d);
}

void main() {
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
  if (vThickness > 0.0) {
    // Keep a band just inside the edge.
    float inner = -vThickness;
    float aa = clamp(fwidth(d), 0.35, 1.5);
    alpha = alpha * smoothstep(inner - aa, inner + aa, d);
  }
  if (alpha <= 0.001) discard;
  outColor = vec4(vColor.rgb, vColor.a * alpha);
}`;

// Paths are drawn as plain triangles in page space with one colour per draw:
// a fill covers its own bounding box through the stencil, a stroke is the quads
// its segments expand to.
const PATH_VERT = `#version 300 es
in vec2 aPos;
uniform vec2 uPage;
void main() {
  vec2 ndc = vec2((aPos.x / uPage.x) * 2.0 - 1.0, 1.0 - (aPos.y / uPage.y) * 2.0);
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
function buildTextAtlas(cmds, dpr) {
  const runs = cmds.filter((c) => c.k === KIND.TEXT && c.text);
  if (!runs.length) return { canvas: null, slots: new Map() };
  const pad = 2;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const measured = runs.map((c) => {
    ctx.font = `${c.italic ? "italic " : ""}${c.weight ? c.weight + " " : ""}${c.size * dpr}px "${c.font}", sans-serif`;
    const m = ctx.measureText(c.text);
    const asc = m.actualBoundingBoxAscent || c.size * dpr * 0.8;
    const desc = m.actualBoundingBoxDescent || c.size * dpr * 0.25;
    return { c, w: Math.ceil(m.width) + pad * 2, h: Math.ceil(asc + desc) + pad * 2, asc };
  });
  const maxW = Math.max(512, ...measured.map((m) => m.w));
  let x = 0, y = 0, rowH = 0, atlasW = Math.min(2048, nextPow2(maxW)), atlasH = 0;
  for (const m of measured) {
    if (x + m.w > atlasW) { x = 0; y += rowH; rowH = 0; }
    m.x = x; m.y = y;
    x += m.w;
    rowH = Math.max(rowH, m.h);
    atlasH = Math.max(atlasH, y + rowH);
  }
  canvas.width = atlasW;
  canvas.height = nextPow2(atlasH);
  const c2 = canvas.getContext("2d");
  c2.clearRect(0, 0, canvas.width, canvas.height);
  c2.textBaseline = "alphabetic";
  c2.fillStyle = "#fff";
  const slots = new Map();
  for (const m of measured) {
    c2.font = `${m.c.italic ? "italic " : ""}${m.c.weight ? m.c.weight + " " : ""}${m.c.size * dpr}px "${m.c.font}", sans-serif`;
    c2.fillText(m.c.text, m.x + pad, m.y + pad + m.asc);
    slots.set(m.c, {
      u0: m.x / canvas.width, v0: m.y / canvas.height,
      u1: (m.x + m.w) / canvas.width, v1: (m.y + m.h) / canvas.height,
      w: m.w / dpr, h: m.h / dpr, asc: m.asc / dpr, pad: pad / dpr,
    });
  }
  return { canvas, slots };
}

const nextPow2 = (n) => { let p = 1; while (p < n) p *= 2; return p; };

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

export function renderDisplayList(gl, doc, opts = {}) {
  const dpr = opts.dpr || 1;
  const images = opts.images || new Map();
  const cmds = doc.list.cmds;

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error("link: " + gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  const { canvas: atlasCanvas, slots } = buildTextAtlas(cmds, dpr);
  const atlas = atlasCanvas
    ? makeTexture(gl, atlasCanvas)
    : makeTexture(gl, new ImageData(1, 1));

  // One texture per distinct source, uploaded once however many quads use it.
  const textures = new Map();
  for (const [src, img] of images) {
    if (img) textures.set(src, { tex: makeTexture(gl, img), w: img.naturalWidth, h: img.naturalHeight });
  }

  // Instances in paint order, plus the runs that must be drawn separately.
  // A run is a stretch of instances that share a texture binding; an image
  // ends the run before it and forms one of its own.
  const rects = [], colors = [], shapes = [], uvs = [], rots = [];
  const runs = [];
  let missingImages = 0, drawnImages = 0;
  const pushRun = (start, count, tex) => {
    if (count > 0) runs.push({ kind: "quads", start, count, tex });
  };
  let runStart = 0;
  const flush = () => {
    const n = rects.length / 4;
    pushRun(runStart, n - runStart, null);
    runStart = n;
  };
  // Path geometry is not instanced quads, so a path ends the run before it and
  // becomes a run of its own — which is what keeps the paint order intact.
  const pushPath = (op) => { flush(); runs.push(op); };

  for (const c of cmds) {
    if (c.k === KIND.PUSH_CLIP || c.k === KIND.POP_CLIP) continue;   // TODO: scissor stack
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
      rects.push(c.x, c.y, c.w, c.h);
      uvs.push(uv[0], uv[1], uv[2], uv[3]);
      shapes.push(c.r || 0, 0, MODE.IMAGE);
      rots.push(((c.rot || 0) * Math.PI) / 180);
      colors.push(1, 1, 1, 1);
      pushRun(runStart, 1, t.tex);
      runStart = rects.length / 4;
      drawnImages += 1;
      continue;
    }
    if (c.k === KIND.TEXT) {
      const s = slots.get(c);
      if (!s) continue;
      // The run is drawn where EVG put its box; the atlas slot carries the
      // ascent so the baseline lands in the same place it did in the PDF.
      rects.push(c.x - s.pad, c.y, s.w, s.h);
      uvs.push(s.u0, s.v0, s.u1, s.v1);
      shapes.push(0, 0, MODE.TEXT);
    } else {
      rects.push(c.x, c.y, c.w, c.h);
      uvs.push(0, 0, 0, 0);
      shapes.push(c.r || 0, c.k === KIND.BORDER ? (c.t || 1) : 0, MODE.SHAPE);
    }
    rots.push(((c.rot || 0) * Math.PI) / 180);
    const col = c.c || [0, 0, 0, 1];
    colors.push(col[0] / 255, col[1] / 255, col[2] / 255, col[3]);
  }
  flush();
  const count = rects.length / 4;

  const quad = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // Attribute locations and buffers are set up once; a run re-points the
  // per-instance attributes at its own first instance, which is how the base
  // instance WebGL 2 does not have is emulated.
  const cornerBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  const cornerLoc = gl.getAttribLocation(prog, "aCorner");
  gl.enableVertexAttribArray(cornerLoc);
  gl.vertexAttribPointer(cornerLoc, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(cornerLoc, 0);

  const instanced = [
    { name: "aRect", data: rects, size: 4 },
    { name: "aColor", data: colors, size: 4 },
    { name: "aShape", data: shapes, size: 3 },
    { name: "aUV", data: uvs, size: 4 },
    { name: "aRot", data: rots, size: 1 },
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

  gl.uniform2f(gl.getUniformLocation(prog, "uPage"), doc.width, doc.height);
  gl.uniform1i(gl.getUniformLocation(prog, "uAtlas"), 0);
  gl.uniform1i(gl.getUniformLocation(prog, "uImage"), 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, atlas);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // The path pipeline: its own program, its own buffer, one draw per path.
  const pathProg = gl.createProgram();
  gl.attachShader(pathProg, compile(gl, gl.VERTEX_SHADER, PATH_VERT));
  gl.attachShader(pathProg, compile(gl, gl.FRAGMENT_SHADER, PATH_FRAG));
  gl.linkProgram(pathProg);
  if (!gl.getProgramParameter(pathProg, gl.LINK_STATUS)) {
    throw new Error("link path: " + gl.getProgramInfoLog(pathProg));
  }
  const pathVao = gl.createVertexArray();
  gl.bindVertexArray(pathVao);
  const pathBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pathBuf);
  const pathPosLoc = gl.getAttribLocation(pathProg, "aPos");
  gl.enableVertexAttribArray(pathPosLoc);
  gl.vertexAttribPointer(pathPosLoc, 2, gl.FLOAT, false, 0, 0);
  const pathPageLoc = gl.getUniformLocation(pathProg, "uPage");
  const pathColorLoc = gl.getUniformLocation(pathProg, "uColor");

  const hasStencil = gl.getContextAttributes().stencil === true;
  let paths = 0, skippedFills = 0;

  const drawTris = (verts, color) => {
    gl.bindVertexArray(pathVao);
    gl.useProgram(pathProg);
    gl.uniform2f(pathPageLoc, doc.width, doc.height);
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

  for (const run of runs) {
    if (run.kind === "fill") { drawFill(run); paths += 1; continue; }
    if (run.kind === "tris") { drawTris(run.verts, run.color); paths += 1; continue; }
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    if (run.tex) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, run.tex);
    }
    pointAt(run.start);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, run.count);
  }

  return {
    drawn: count, textRuns: slots.size, images: drawnImages, missingImages,
    runs: runs.length, paths,
    // A context without a stencil buffer cannot fill a path; say so rather than
    // drawing a chart with no bars in it.
    skippedFills,
  };
}
