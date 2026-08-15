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
 * Text
 * ----
 * The list carries the run, the face and the size — the positions are EVG's,
 * measured from the same TTF the PDF is set in. Only the glyph *images* come
 * from the platform: here a 2D canvas rasterizes each run into an atlas, which
 * is what a browser gives us for free. The SDL2 backend swaps that one piece
 * for the engine's own RasterText and keeps everything else.
 *
 * Not yet implemented: IMAGE commands (kind 2) and nested clips beyond a
 * single scissor rectangle. Both are noted where they would go.
 */

const KIND = { RECT: 0, BORDER: 1, IMAGE: 2, TEXT: 3, PUSH_CLIP: 4, POP_CLIP: 5 };

const VERT = `#version 300 es
in vec2 aCorner;          // unit quad, 0..1
in vec4 aRect;            // x, y, w, h in page pixels
in vec4 aColor;           // rgba, 0..1
in vec3 aShape;           // radius, thickness (0 = fill), isText
in vec4 aUV;              // atlas u0,v0,u1,v1 for text
uniform vec2 uPage;
out vec4 vColor;
out vec2 vLocal;          // position within the rect, in pixels
out vec2 vHalf;
out float vRadius;
out float vThickness;
out float vIsText;
out vec2 vUV;
void main() {
  vec2 p = aRect.xy + aCorner * aRect.zw;
  // Page space is y-down like every 2D layout engine; clip space is y-up.
  vec2 ndc = vec2((p.x / uPage.x) * 2.0 - 1.0, 1.0 - (p.y / uPage.y) * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
  vColor = aColor;
  vHalf = aRect.zw * 0.5;
  vLocal = (aCorner - 0.5) * aRect.zw;
  vRadius = aShape.x;
  vThickness = aShape.y;
  vIsText = aShape.z;
  vUV = mix(aUV.xy, aUV.zw, aCorner);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec4 vColor;
in vec2 vLocal;
in vec2 vHalf;
in float vRadius;
in float vThickness;
in float vIsText;
in vec2 vUV;
uniform sampler2D uAtlas;
out vec4 outColor;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  if (vIsText > 0.5) {
    // The atlas holds coverage in the alpha channel; the colour is the run's.
    float cov = texture(uAtlas, vUV).a;
    if (cov <= 0.001) discard;
    outColor = vec4(vColor.rgb, vColor.a * cov);
    return;
  }
  float r = min(vRadius, min(vHalf.x, vHalf.y));
  float d = sdRoundedBox(vLocal, vHalf, r);
  // fwidth() is a screen-space derivative, and it jumps across the diagonal
  // seam of the triangle strip on a very large quad — which drew a visible
  // hairline across the page background. Clamping keeps the edge one pixel
  // soft no matter how big the quad is.
  float aa = clamp(fwidth(d), 0.35, 1.5);
  float alpha;
  if (vThickness > 0.0) {
    // Keep a band just inside the edge.
    float inner = -vThickness;
    alpha = smoothstep(aa, -aa, d) * smoothstep(inner - aa, inner + aa, d);
  } else {
    alpha = smoothstep(aa, -aa, d);
  }
  if (alpha <= 0.001) discard;
  outColor = vec4(vColor.rgb, vColor.a * alpha);
}`;

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
    ctx.font = `${c.size * dpr}px "${c.font}", sans-serif`;
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
    c2.font = `${m.c.size * dpr}px "${m.c.font}", sans-serif`;
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

export function renderDisplayList(gl, doc, opts = {}) {
  const dpr = opts.dpr || 1;
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
  const atlas = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, atlas);
  if (atlasCanvas) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // One instance per drawable command.
  const rects = [], colors = [], shapes = [], uvs = [];
  let skippedImages = 0;
  for (const c of cmds) {
    if (c.k === KIND.PUSH_CLIP || c.k === KIND.POP_CLIP) continue;   // TODO: scissor stack
    if (c.k === KIND.IMAGE) { skippedImages += 1; continue; }        // TODO: texture per src
    if (c.k === KIND.TEXT) {
      const s = slots.get(c);
      if (!s) continue;
      // The run is drawn where EVG put its box; the atlas slot carries the
      // ascent so the baseline lands in the same place it did in the PDF.
      rects.push(c.x - s.pad, c.y, s.w, s.h);
      uvs.push(s.u0, s.v0, s.u1, s.v1);
      shapes.push(0, 0, 1);
    } else {
      rects.push(c.x, c.y, c.w, c.h);
      uvs.push(0, 0, 0, 0);
      shapes.push(c.r || 0, c.k === KIND.BORDER ? (c.t || 1) : 0, 0);
    }
    const col = c.c || [0, 0, 0, 1];
    colors.push(col[0] / 255, col[1] / 255, col[2] / 255, col[3]);
  }
  const count = rects.length / 4;

  const quad = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const bind = (name, data, size, divisor) => {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, name);
    if (loc < 0) return;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(loc, divisor);
  };
  bind("aCorner", quad, 2, 0);
  bind("aRect", rects, 4, 1);
  bind("aColor", colors, 4, 1);
  bind("aShape", shapes, 3, 1);
  bind("aUV", uvs, 4, 1);

  gl.uniform2f(gl.getUniformLocation(prog, "uPage"), doc.width, doc.height);
  gl.uniform1i(gl.getUniformLocation(prog, "uAtlas"), 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, atlas);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);

  return { drawn: count, textRuns: slots.size, skippedImages };
}
