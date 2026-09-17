// SPDX-License-Identifier: AGPL-3.0-or-later
//
// evg-webgpu.js — SPIKE. The same EVG display list, drawn with WebGPU.
//
// This is a research backend, not a replacement for `../evg-webgl.js`. It
// exists to answer one question with numbers instead of opinion: does WebGPU
// buy EVG anything on the web, and where. It therefore covers the part of the
// command set that the answer depends on and openly leaves the rest out.
//
//   covered   RECT (fill, gradient, border, per-corner radius, rotation),
//             its drop shadow, TEXT through a glyph atlas, PUSH/POP_CLIP as
//             scissor rectangles, the layer shift, the camera.
//   not here  IMAGE, PATH, STROKE, backdrop blur, the ripple effect, colour
//             emoji. Every one of them is a known shape of work — an image is
//             a second bind group, a path is the same stencil-then-cover with
//             a depth-stencil attachment — and none of them changes what the
//             measurement says, so none of them is written twice for a spike.
//
// WHAT IS STRUCTURALLY DIFFERENT, and what it turned out to be worth. The
// measurements are in README.md; the verdicts are repeated here so that
// nobody reads this file and infers a win it did not get.
//
// 1. ONE BUFFER, NOT NINE. The WebGL painter keeps nine parallel arrays —
//    aRect, aColor, aColor2, aGrad, aShape, aRadii, aUV, aRot, aOrigin — one
//    vertex buffer each, because that is what an attribute is. Here the
//    instance record is one interleaved f32 array in a read-only STORAGE
//    buffer, indexed by `instance_index`. One allocation, one upload, one
//    write of memory that a producer could fill directly.
//    WORTH: a frame builds 1.5-2.5x faster — and most of that is allocation
//    and copying rather than the API, so a WebGL painter that interleaved its
//    attributes would take much of it too.
//
// 2. A REAL BASE INSTANCE. The list is drawn in RUNS — a clip change or a
//    texture change ends one — and WebGL 2 has no base-instance parameter, so
//    the painter re-points all nine attributes with nine bindBuffer +
//    vertexAttribPointer pairs before every run, then binds the program, the
//    VAO and a uniform: twenty-two driver calls. WebGPU's `draw()` takes
//    `firstInstance`, so a run is a scissor, sometimes a bind group, and the
//    draw: three.
//    WORTH: 2.0 microseconds per run against 0.55 — the one solid win, and
//    only on pages with many clips. The two cross at about six runs.
//
// 3. RENDER BUNDLES. A frame drawn again unchanged — a scroll, a pan, a caret
//    blink — can be recorded once as a GPURenderBundle and replayed with one
//    `executeBundles`, with the uniforms still written per frame so the
//    picture moves. WebGL has no equivalent.
//    WORTH: NOTHING, measured. The per-frame cost is the encoder, the pass,
//    the buffer writes and the submit, and a bundle removes none of them. It
//    also bakes its scissors, so it cannot be used on a list with clips —
//    which is precisely the list whose draw calls are many. `canBundle` says
//    so and `bundleDraw` falls back. Kept in the file because a negative
//    result someone else would otherwise spend a day re-deriving is worth
//    the sixty lines.
//
// Everything above the seam is untouched: this file takes the same
// `{width, height, list:{cmds, shifts}}` document the PDF, the SVG and the
// WebGL painters take, and knows nothing about JSX, flex, grid or fonts.

// THE FONT SPEC IS THE WEBGL PAINTER'S, IMPORTED. A CSS font shorthand and the
// bidi override a run is measured inside are not what this spike is comparing:
// they decide which face the browser picks and therefore how wide every run
// is, and two independent implementations of them differ in ways that show up
// as "the pixels disagree" while both painters are doing their job. Sharing
// them makes the comparison about the API. (It also says where a real port
// would go: these two, the shelf packer and the slot arithmetic belong in an
// `evg-text-atlas.js` that both painters import, rather than in either.)
import { fontSpec, verbatim } from "../evg-webgl.js";

const KIND = {
  RECT: 0, BORDER: 1, IMAGE: 2, TEXT: 3, PUSH_CLIP: 4, POP_CLIP: 5,
  PATH: 6, STROKE: 7,
};

// aShape.z in the WebGL painter — what the fragment stage does with the quad.
const MODE = { SHAPE: 0, TEXT: 1, IMAGE: 2, COLORTEXT: 3, SHADOW: 4 };

// Floats per instance. Laid out to match the nine attributes the WebGL
// painter feeds, field for field, so the two can be differenced without
// either one being "the version with the extra thing".
//
//   0..3   rect      x, y, w, h          page pixels
//   4..7   colour    r, g, b, a          0..1
//   8..11  colour2   r, g, b, a          far gradient stop
//   12..15 radii     TL, TR, BR, BL
//   16..18 shape     radius, thickness, mode
//   19     grad      0 flat, 1 down, 2 across
//   20..23 uv        u0, v0, u1, v1      atlas slot
//   24     rot       radians
//   25..27 origin    pivot x, pivot y, 1 when the list named one
const STRIDE = 28;

// A scroll layer's shift is a uniform that changes per run, so it lives in its
// own buffer read at a dynamic offset — one slot per layer. WebGPU requires
// dynamic uniform offsets to be a multiple of 256.
const SHIFT_SLOT = 256;
const MAX_LAYERS = 64;

// NO BACKTICKS ANYWHERE BELOW, comments included: the whole shader is a JS
// template literal and one would end it mid-word. The GLSL in
// `../evg-webgl.js` carries the same warning three times over, and this file
// still hit it — the failure is a JavaScript SyntaxError pointing at a WGSL
// identifier, which reads like anything but what it is.
const SHADER = /* wgsl */ `
struct Frame {
  // (sx, sy, tx, ty) — the camera, exactly as uView is in the GLSL.
  view : vec4<f32>,
  page : vec2<f32>,
  _pad : vec2<f32>,
};
struct Shift { d : vec4<f32> };

@group(0) @binding(0) var<uniform> frame : Frame;
@group(0) @binding(1) var<uniform> shift : Shift;
@group(0) @binding(2) var<storage, read> inst : array<f32>;
@group(1) @binding(0) var atlasSampler : sampler;
@group(1) @binding(1) var atlas : texture_2d<f32>;

struct VOut {
  @builtin(position) pos : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) color2 : vec4<f32>,
  @location(2) t : vec2<f32>,
  @location(3) local : vec2<f32>,
  @location(4) half : vec2<f32>,
  @location(5) radii : vec4<f32>,
  @location(6) uv : vec2<f32>,
  // grad, thickness, mode — three scalars that would otherwise be three
  // locations, and a varying slot is a scarcer thing than a component.
  @location(7) misc : vec3<f32>,
};

fn f(base : u32, i : u32) -> f32 { return inst[base + i]; }

@vertex
fn vs(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> VOut {
  // The unit quad as a triangle strip: (0,0) (1,0) (0,1) (1,1). No vertex
  // buffer at all — four corners are cheaper to compute than to fetch.
  let corner = vec2<f32>(f32(vi & 1u), f32((vi >> 1u) & 1u));
  let b = ii * ${STRIDE}u;

  let rect = vec4<f32>(f(b,0u), f(b,1u), f(b,2u), f(b,3u));
  let rot = f(b,24u);
  let sh = shift.d.xy;

  // Scene units until the camera is applied, same order as the GLSL: the
  // rotation, the pivot and the layer shift are properties of the picture.
  var p = rect.xy + sh + corner * rect.zw;
  if (rot != 0.0) {
    let hasPivot = f(b,27u) > 0.5;
    let c = select(rect.xy + rect.zw * 0.5, vec2<f32>(f(b,25u), f(b,26u)), hasPivot) + sh;
    let s = sin(rot);
    let co = cos(rot);
    let d = p - c;
    p = c + vec2<f32>(d.x * co - d.y * s, d.x * s + d.y * co);
  }
  p = p * frame.view.xy + frame.view.zw;

  var o : VOut;
  // Page space is y-down; clip space is y-up.
  o.pos = vec4<f32>((p.x / frame.page.x) * 2.0 - 1.0, 1.0 - (p.y / frame.page.y) * 2.0, 0.0, 1.0);
  o.color = vec4<f32>(f(b,4u), f(b,5u), f(b,6u), f(b,7u));
  o.color2 = vec4<f32>(f(b,8u), f(b,9u), f(b,10u), f(b,11u));
  o.t = corner;
  // Measured in page pixels, so the camera scales them as much as the
  // position: a box drawn at twice the scale has twice the radius and twice
  // the border, or it is a different box rather than the same one nearer.
  o.half = rect.zw * 0.5 * frame.view.xy;
  o.local = (corner - vec2<f32>(0.5)) * rect.zw * frame.view.xy;
  o.radii = vec4<f32>(f(b,12u), f(b,13u), f(b,14u), f(b,15u)) * frame.view.x;
  o.misc = vec3<f32>(f(b,19u), f(b,17u) * frame.view.x, f(b,18u));
  let uv0 = vec2<f32>(f(b,20u), f(b,21u));
  let uv1 = vec2<f32>(f(b,22u), f(b,23u));
  o.uv = mix(uv0, uv1, corner);
  return o;
}

// The radii arrive as (TL, TR, BR, BL) — the order border-radius writes them
// in — and one choice per axis narrows them to the corner this fragment is in.
fn sdRoundedBox(p : vec2<f32>, b : vec2<f32>, r : vec4<f32>) -> f32 {
  let tb = select(vec2<f32>(r.x, r.w), vec2<f32>(r.y, r.z), p.x > 0.0);
  let rr = select(tb.x, tb.y, p.y > 0.0);
  let q = abs(p) - b + rr;
  return length(max(q, vec2<f32>(0.0))) + min(max(q.x, q.y), 0.0) - rr;
}

@fragment
fn fs(i : VOut) -> @location(0) vec4<f32> {
  let grad = i.misc.x;
  let thickness = i.misc.y;
  let mode = i.misc.z;

  // EVERY DERIVATIVE IS TAKEN BEFORE THE BRANCHES, and this is not a style
  // choice. WGSL requires textureSample and fwidth to be reached under
  // UNIFORM control flow — the derivative is taken across a 2x2 quad of
  // fragments, and it is meaningless if some of those lanes took another
  // branch. 'mode' is an interpolated value, so the compiler cannot prove the
  // four lanes agree, and the same shader that GLSL compiles happily (leaving
  // the derivative undefined) WGSL rejects outright.
  //
  // What it costs: a rectangle evaluates the shadow distance field it will
  // not use, and a glyph evaluates both. Two extra sdRoundedBox calls and two
  // fwidths on every fragment. The alternative is one pipeline per mode,
  // which is cheap to switch in WebGPU but would break the single batch this
  // painter exists to keep — see the spike report, "what WGSL made us do".
  let glyph = textureSample(atlas, atlasSampler, i.uv);

  // The shadow's box: the quad was grown by the blur on every side, so the
  // box it belongs to is that much smaller and the same radii describe it.
  let bl = max(thickness, 0.0);
  let hb = max(i.half - vec2<f32>(bl), vec2<f32>(0.01));
  let sd = sdRoundedBox(i.local, hb, min(i.radii, vec4<f32>(min(hb.x, hb.y))));
  let sdWidth = fwidth(sd);

  // The shape's own box.
  let d = sdRoundedBox(i.local, i.half, min(i.radii, vec4<f32>(min(i.half.x, i.half.y))));
  // fwidth() jumps across the strip's diagonal on a very large quad, which
  // drew a visible hairline across the page in the GL painter. Clamped for
  // the same reason and by the same amount.
  let aa = clamp(fwidth(d), 0.35, 1.5);

  if (mode > 3.5) {
    // A shadow with no blur is a hard offset copy, and smoothstep over a
    // zero-wide band is undefined; one pixel of antialiasing stands in.
    let soft = max(bl * 0.5, clamp(sdWidth, 0.35, 1.5));
    let sa = smoothstep(soft, -soft, sd);
    if (sa <= 0.002) { discard; }
    return vec4<f32>(i.color.rgb, i.color.a * sa);
  }
  if (mode > 0.5 && mode < 1.5) {
    // The atlas holds coverage in alpha; the colour is the run's.
    if (glyph.a <= 0.001) { discard; }
    return vec4<f32>(i.color.rgb, i.color.a * glyph.a);
  }

  var alpha = smoothstep(aa, -aa, d);
  var base = i.color;
  if (grad > 0.5) {
    base = mix(i.color, i.color2, clamp(select(i.t.y, i.t.x, grad > 1.5), 0.0, 1.0));
  }
  if (thickness > 0.0) {
    // Keep a band just inside the edge.
    let inner = -thickness;
    alpha = alpha * smoothstep(inner - aa, inner + aa, d);
  }
  if (alpha <= 0.001) { discard; }
  return vec4<f32>(base.rgb, base.a * alpha);
}
`;

/** An adapter and a device, or null with the reason. Never throws. */
export async function requestDevice() {
  if (typeof navigator === "undefined" || !navigator.gpu) {
    return { device: null, why: "navigator.gpu is not there — no WebGPU in this browser, or the page is not a secure context" };
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { device: null, why: "no adapter — WebGPU is present but nothing can drive it" };
    const device = await adapter.requestDevice();
    const info = adapter.info || {};
    return {
      device,
      adapter,
      why: null,
      describe: [info.vendor, info.architecture, info.device, info.description].filter(Boolean).join(" / ") || "unnamed adapter",
    };
  } catch (e) {
    return { device: null, why: String(e) };
  }
}

// ── the glyph atlas ─────────────────────────────────────────────────────────
//
// One slot per RUN rather than per glyph, which is what keeps EVG's own
// kerning: the positions in the list were measured from the TTF the PDF is set
// in, and rasterising the run whole means the browser never re-spaces it. The
// WebGL painter does exactly this; the code is short enough that the spike
// carries its own rather than exporting three helpers out of a 2500-line file
// it does not otherwise touch.

const PAD = 2;
const nextPow2 = (n) => { let p = 1; while (p < n) p *= 2; return p; };

const runKey = (c, dpr) => `${fontSpec(c, dpr)}|${c.ls || 0}|${c.text}`;

function buildAtlas(cmds, dpr) {
  const runs = new Map();
  for (const c of cmds) {
    if (c.k !== KIND.TEXT || !c.text) continue;
    const key = runKey(c, dpr);
    if (!runs.has(key)) runs.set(key, c);
  }
  if (!runs.size) return { canvas: null, slots: new Map(), w: 1, h: 1 };

  const measure = document.createElement("canvas").getContext("2d");
  const placed = [];
  // A shelf packer: rows as wide as the atlas, a new row when the next run
  // does not fit. Runs are near enough the same height that nothing smarter
  // pays for itself here.
  const LIMIT = 2048;
  let x = 0, y = 0, rowH = 0, maxX = 0;
  for (const [key, c] of runs) {
    measure.font = fontSpec(c, dpr);
    if (c.ls) measure.letterSpacing = `${c.ls * dpr}px`; else measure.letterSpacing = "0px";
    const m = measure.measureText(verbatim(c.text));
    // TWO ASCENTS, and the difference between them is the whole of where a run
    // sits — the same rule ../evg-webgl.js follows, copied because getting it
    // wrong is invisible in a screenshot and wrong by most of a line in a
    // heading. `actualBoundingBox*` is the ink of THESE letters and sizes the
    // slot; `fontBoundingBox*` is the FACE, and EVG's y is the top of the line
    // box with the baseline one face-ascent (plus half-leading) below it.
    const asc = m.actualBoundingBoxAscent || (c.size || 12) * dpr * 0.8;
    const desc = m.actualBoundingBoxDescent || (c.size || 12) * dpr * 0.25;
    const faceAsc = m.fontBoundingBoxAscent || (c.size || 12) * dpr * 1.05;
    const faceDesc = m.fontBoundingBoxDescent || (c.size || 12) * dpr * 0.212;
    const w = Math.ceil(m.width) + PAD * 2;
    const h = Math.ceil(asc + desc) + PAD * 2;
    if (x + w > LIMIT) { x = 0; y += rowH; rowH = 0; }
    placed.push({ key, c, x, y, w, h, asc, faceAsc, faceDesc });
    x += w;
    maxX = Math.max(maxX, x);
    rowH = Math.max(rowH, h);
  }
  const texW = nextPow2(Math.max(64, maxX));
  const texH = nextPow2(Math.max(64, y + rowH));

  const canvas = document.createElement("canvas");
  canvas.width = texW;
  canvas.height = texH;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  ctx.clearRect(0, 0, texW, texH);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  const slots = new Map();
  for (const p of placed) {
    ctx.font = fontSpec(p.c, dpr);
    if (p.c.ls) ctx.letterSpacing = `${p.c.ls * dpr}px`;
    else ctx.letterSpacing = "0px";
    ctx.fillText(verbatim(p.c.text), p.x + PAD, p.y + PAD + p.asc);
    slots.set(p.key, {
      u0: p.x / texW, v0: p.y / texH,
      u1: (p.x + p.w) / texW, v1: (p.y + p.h) / texH,
      w: p.w / dpr, h: p.h / dpr,
      asc: p.asc / dpr, pad: PAD / dpr,
      faceAsc: p.faceAsc / dpr, faceDesc: p.faceDesc / dpr,
    });
  }
  return { canvas, slots, w: texW, h: texH };
}

// ── the painter ─────────────────────────────────────────────────────────────

const CACHE = new WeakMap();

// THE ATLAS IS KEPT, and it has to be for the comparison to mean anything.
// ../evg-webgl.js caches its atlas per GL context and appends to it — a frame
// that changed a rectangle has not changed a letter, so it rasterises nothing.
// Without the same here, this spike rebuilt and re-uploaded the whole atlas on
// every build and reported WebGPU as 0.56x on the text scene: a number about
// the missing cache and not about the API.
//
// Coarser than the WebGL painter's: that one appends new runs to a shelf it
// keeps, this one keeps the last atlas and rebuilds when the set of runs
// changes at all. Enough for a spike, and it is what the number now reflects.
const ATLASES = new WeakMap();

function atlasFor(device, cmds, dpr) {
  const keys = [];
  for (const c of cmds) if (c.k === KIND.TEXT && c.text) keys.push(runKey(c, dpr));
  keys.sort();
  const key = dpr + "|" + keys.join("\u0000");
  const had = ATLASES.get(device);
  if (had && had.key === key) return { ...had, reused: true };

  const atlas = buildAtlas(cmds, dpr);
  const texture = device.createTexture({
    size: [atlas.w, atlas.h],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  if (atlas.canvas) {
    device.queue.copyExternalImageToTexture({ source: atlas.canvas }, { texture }, [atlas.w, atlas.h]);
  }
  const made = { key, slots: atlas.slots, texture, w: atlas.w, h: atlas.h, view: texture.createView() };
  if (had) had.texture.destroy();
  ATLASES.set(device, made);
  return { ...made, reused: false };
}

function pipelineFor(device, format) {
  const found = CACHE.get(device);
  if (found && found.format === format) return found;
  const module = device.createShaderModule({ code: SHADER });
  const group0 = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform", hasDynamicOffset: true } },
      { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
    ],
  });
  const group1 = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
    ],
  });
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [group0, group1] }),
    vertex: { module, entryPoint: "vs" },
    primitive: { topology: "triangle-strip" },
    fragment: {
      module,
      entryPoint: "fs",
      targets: [{
        format,
        // The same over-blend the GL painter sets with blendFuncSeparate:
        // a non-premultiplied source composited onto a premultiplied target.
        blend: {
          color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
          alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
        },
      }],
    },
  });
  const made = { module, pipeline, group0, group1, format };
  CACHE.set(device, made);
  return made;
}

/**
 * Build a frame: the instance array, the buffers, the runs, the atlas.
 *
 * Returns the same shape `../evg-webgl.js` returns — `draw(shifts, view)`,
 * `dispose()`, plus `stats` — so a harness can hold the two against each
 * other without knowing which it has.
 */
export function prepareDisplayList(gpu, doc, opts = {}) {
  const { device, context, format } = gpu;
  const dpr = opts.dpr || 1;
  const cmds = doc.list.cmds;
  const built = pipelineFor(device, format);

  // THE BUILD, IN THREE PARTS, TIMED SEPARATELY — because "building a frame
  // costs 6ms" is not an answer to "would WASM help". Only one of these three
  // is a producer writing numbers into memory, and that is the only one a
  // WASM producer could take over:
  //
  //   atlas   rasterising text on a 2D canvas. The browser's, not ours.
  //   pack    walking the command objects and writing 28 floats each. OURS.
  //   upload  writeBuffer, createBuffer, the texture copy. The driver's.
  const t0 = performance.now();

  const atlas = atlasFor(device, cmds, dpr);
  const tAtlas = performance.now();

  // ONE array, written once. The WebGL painter pushes onto nine JS arrays and
  // then copies each into its own Float32Array; this writes final floats into
  // final memory. That difference is the thing a WASM producer would inherit.
  let quads = 0;
  for (const c of cmds) {
    if (c.k === KIND.PUSH_CLIP || c.k === KIND.POP_CLIP) continue;
    if (c.k === KIND.RECT || c.k === KIND.BORDER || c.k === KIND.TEXT) {
      quads += 1;
      if (c.sh) quads += 1;  // the shadow is a quad of its own, drawn first
    }
  }
  const data = new Float32Array(quads * STRIDE);
  let n = 0;

  const put = (c, mode, colour, rect, extra = {}) => {
    const b = n * STRIDE;
    data[b + 0] = rect[0]; data[b + 1] = rect[1]; data[b + 2] = rect[2]; data[b + 3] = rect[3];
    data[b + 4] = colour[0] / 255; data[b + 5] = colour[1] / 255; data[b + 6] = colour[2] / 255;
    data[b + 7] = colour[3] === undefined ? 1 : colour[3];
    // A command with no second stop is flat, and the far stop is then the
    // near one, so the shader's mix is a no-op whatever it is handed.
    const c2 = c.c2 || colour;
    data[b + 8] = c2[0] / 255; data[b + 9] = c2[1] / 255; data[b + 10] = c2[2] / 255;
    data[b + 11] = c2[3] === undefined ? 1 : c2[3];
    const r = extra.radii || (c.rc ? c.rc : [c.r || 0, c.r || 0, c.r || 0, c.r || 0]);
    data[b + 12] = r[0]; data[b + 13] = r[1]; data[b + 14] = r[2]; data[b + 15] = r[3];
    data[b + 16] = r[0];
    data[b + 17] = extra.thickness === undefined
      ? (c.k === KIND.BORDER ? (c.t || 1) : 0)
      : extra.thickness;
    data[b + 18] = mode;
    // THE DIRECTION IS INVERTED ON THE WAY IN, and it is not a typo. The
    // display list's `gd` is 1 for ACROSS the box; the shader's grad is 2 for
    // across and 1 for down. ../evg-webgl.js writes `c.gd === 1 ? 2 : 1` for
    // the same reason. Reading `gd` straight through cost this spike its first
    // clean parity run: every gradient ran the wrong way, which on a mixed
    // page reads as a plausible picture and 39% of the pixels wrong.
    data[b + 19] = extra.grad === undefined
      ? (c.c2 ? (c.gd === 1 ? 2 : 1) : 0)
      : extra.grad;
    const uv = extra.uv || [0, 0, 0, 0];
    data[b + 20] = uv[0]; data[b + 21] = uv[1]; data[b + 22] = uv[2]; data[b + 23] = uv[3];
    // Degrees in the list, radians in the shader — the same conversion
    // ../evg-webgl.js does when it fills aRot. Reading it raw turns a 90°
    // label by 90 radians, which lands somewhere plausible and wrong.
    data[b + 24] = ((c.rot || 0) * Math.PI) / 180;
    if (c.rox !== undefined) { data[b + 25] = c.rox; data[b + 26] = c.roy; data[b + 27] = 1; }
    n += 1;
  };

  // Runs, in paint order. A clip change ends one — a scissor is pipeline state
  // and one draw has one scissor — and so would an image, if the spike drew
  // images.
  const runs = [];
  const clipStack = [];
  const layerStack = [];
  let clip = null;
  let layer = 0;
  let runStart = 0;
  const flush = () => {
    if (n > runStart) runs.push({ start: runStart, count: n - runStart, clip, layer });
    runStart = n;
  };

  let skipped = 0;
  for (const c of cmds) {
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
    if (c.k === KIND.IMAGE || c.k === KIND.PATH || c.k === KIND.STROKE) { skipped += 1; continue; }

    if (c.sh) {
      // Grown by the blur on every side so the falloff has somewhere to go;
      // the shader measures the box back down from the quad.
      const bl = c.sh.blur || 0;
      put(c, MODE.SHADOW, c.sh.c, [c.x + (c.sh.x || 0) - bl, c.y + (c.sh.y || 0) - bl, c.w + bl * 2, c.h + bl * 2],
          { thickness: bl, grad: 0 });
    }
    if (c.k === KIND.TEXT && c.text) {
      const slot = atlas.slots.get(runKey(c, dpr));
      if (!slot) { skipped += 1; continue; }
      // WHERE A RUN SITS. EVG's y is the top of the LINE BOX and c.h is its
      // height, so the baseline is the CSS half-leading below the top plus one
      // face ascent; inside the slot the baseline is pad + ink ascent down
      // from the top. Line the two up. Lifted from ../evg-webgl.js rather than
      // re-derived, because the two painters agreeing about this is the
      // difference between a comparison and a coincidence.
      const halfLeading = c.h ? (c.h - (slot.faceAsc + slot.faceDesc)) / 2 : 0;
      put(c, MODE.TEXT, c.c,
          [c.x - slot.pad, c.y + halfLeading + slot.faceAsc - (slot.pad + slot.asc), slot.w, slot.h],
          { uv: [slot.u0, slot.v0, slot.u1, slot.v1], radii: [0, 0, 0, 0], thickness: 0, grad: 0 });
      continue;
    }
    put(c, MODE.SHAPE, c.c, [c.x, c.y, c.w, c.h]);
  }
  flush();

  const tPack = performance.now();

  // ── upload ──
  const instBuf = device.createBuffer({
    size: Math.max(STRIDE * 4, data.byteLength),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  if (data.byteLength) device.queue.writeBuffer(instBuf, 0, data);

  const frameBuf = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  // As many 256-byte slots as this list has layers, and no more. Sized to
  // MAX_LAYERS it was 16 KiB written on every frame of every scroll — which
  // cost more than the draw calls it was there to serve.
  const layerCount = Math.max(1, Math.min(MAX_LAYERS, (doc.list.shifts || []).length));
  const shiftBuf = device.createBuffer({ size: SHIFT_SLOT * layerCount, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

  const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });

  const bind0 = device.createBindGroup({
    layout: built.group0,
    entries: [
      { binding: 0, resource: { buffer: frameBuf } },
      { binding: 1, resource: { buffer: shiftBuf, size: 16 } },
      { binding: 2, resource: { buffer: instBuf } },
    ],
  });
  const bind1 = device.createBindGroup({
    layout: built.group1,
    entries: [
      { binding: 0, resource: sampler },
      { binding: 1, resource: atlas.view },
    ],
  });

  const tUpload = performance.now();
  const buildMs = tUpload - t0;
  const timing = {
    atlasMs: tAtlas - t0,
    atlasReused: atlas.reused,
    packMs: tPack - tAtlas,
    uploadMs: tUpload - tPack,
    totalMs: buildMs,
  };
  const baseShifts = (doc.list.shifts || []).map((s) => [s[0], s[1]]);
  const fbW = () => context.canvas.width;
  const fbH = () => context.canvas.height;

  const viewVec = (v) => {
    if (!v) return [1, 1, 0, 0];
    const s = v.scale === undefined || v.scale === null ? 1 : v.scale;
    return [s, s, v.x || 0, v.y || 0];
  };

  let bundle = null;

  const frame = {
    kind: "webgpu",
    quads: n,
    runs: runs.length,
    textRuns: atlas.slots.size,
    skipped,
    buildMs,
    timing,
    bytes: data.byteLength,
    dispose() {
      instBuf.destroy();
      frameBuf.destroy();
      shiftBuf.destroy();
      // The atlas is NOT destroyed here: it belongs to the device and outlives
      // any one frame, which is the whole point of keeping it.
      bundle = null;
    },
  };

  // What the shifts and the camera come to for this draw, written before any
  // encoding so the recorded bundle and the re-encoded pass read the same
  // numbers.
  // Scratch, allocated once. A frame written per frame allocates per frame,
  // and a scroll is nothing but frames.
  const frameScratch = new Float32Array(8);
  const shiftScratch = new Float32Array(SHIFT_SLOT * layerCount / 4);

  const writeUniforms = (shiftsNow, viewNow) => {
    const v = viewVec(viewNow || doc.view || null);
    frameScratch[0] = v[0]; frameScratch[1] = v[1]; frameScratch[2] = v[2]; frameScratch[3] = v[3];
    frameScratch[4] = doc.width; frameScratch[5] = doc.height;
    device.queue.writeBuffer(frameBuf, 0, frameScratch);
    // One 256-byte slot per layer, holding the difference between where the
    // layer is now and where it was when this frame was built.
    shiftScratch.fill(0);
    if (shiftsNow) {
      for (let i = 0; i < Math.min(layerCount, shiftsNow.length); i += 1) {
        const base = (baseShifts[i] || [0, 0]);
        shiftScratch[i * (SHIFT_SLOT / 4) + 0] = (shiftsNow[i][0] || 0) - base[0];
        shiftScratch[i * (SHIFT_SLOT / 4) + 1] = (shiftsNow[i][1] || 0) - base[1];
      }
    }
    device.queue.writeBuffer(shiftBuf, 0, shiftScratch);
    return v;
  };

  // A clip list, intersected, through the camera, into framebuffer pixels.
  // WebGPU's scissor is measured from the TOP — unlike GL's — and must lie
  // inside the attachment, so it is clamped rather than trusted.
  const scissorOf = (list, v, shiftsNow) => {
    if (!list || !list.length) return null;
    let r = null;
    for (const c of list) {
      const i = c.layer;
      const sh = (i > 0 && shiftsNow && shiftsNow[i])
        ? [(shiftsNow[i][0] || 0) - (baseShifts[i] ? baseShifts[i][0] : 0),
           (shiftsNow[i][1] || 0) - (baseShifts[i] ? baseShifts[i][1] : 0)]
        : [0, 0];
      const b = { x: c.x + sh[0], y: c.y + sh[1], w: c.w, h: c.h };
      if (!r) { r = b; continue; }
      const x0 = Math.max(r.x, b.x), y0 = Math.max(r.y, b.y);
      const x1 = Math.min(r.x + r.w, b.x + b.w), y1 = Math.min(r.y + r.h, b.y + b.h);
      r = { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
    }
    const sx = fbW() / doc.width, sy = fbH() / doc.height;
    const x = Math.round((r.x * v[0] + v[2]) * sx);
    const y = Math.round((r.y * v[1] + v[3]) * sy);
    const w = Math.round(r.w * v[0] * sx);
    const h = Math.round(r.h * v[1] * sy);
    const cx = Math.max(0, Math.min(fbW(), x));
    const cy = Math.max(0, Math.min(fbH(), y));
    return [cx, cy, Math.max(0, Math.min(fbW() - cx, w)), Math.max(0, Math.min(fbH() - cy, h))];
  };

  // Issue the runs into a pass or a bundle encoder — the two share an
  // interface, which is the point of a bundle.
  const record = (pass, v, shiftsNow, allowScissor) => {
    pass.setPipeline(built.pipeline);
    pass.setBindGroup(1, bind1);
    let boundLayer = -1;
    for (const run of runs) {
      if (allowScissor) {
        const sc = scissorOf(run.clip, v, shiftsNow);
        if (sc) {
          if (sc[2] === 0 || sc[3] === 0) continue;
          pass.setScissorRect(sc[0], sc[1], sc[2], sc[3]);
        } else {
          pass.setScissorRect(0, 0, fbW(), fbH());
        }
      }
      if (run.layer !== boundLayer) {
        pass.setBindGroup(0, bind0, [run.layer * SHIFT_SLOT]);
        boundLayer = run.layer;
      }
      // THE LINE THIS SPIKE IS ABOUT. WebGL needs nine bindBuffer +
      // vertexAttribPointer pairs here to move to this run's first instance.
      pass.draw(4, run.count, 0, run.start);
    }
  };

  // A view is an object, and one per frame is garbage per frame. The canvas
  // hands over a NEW texture each frame so its view cannot be kept; a texture
  // the caller owns can be.
  let cachedTarget = null, cachedView = null;
  const viewOf = (target) => {
    if (target === cachedTarget) return cachedView;
    cachedTarget = target;
    cachedView = target.createView();
    return cachedView;
  };

  frame.draw = (shiftsNow, viewNow, drawOpts = {}) => {
    const v = writeUniforms(shiftsNow, viewNow);
    const target = drawOpts.target || context.getCurrentTexture();
    const enc = device.createCommandEncoder();
    const pass = enc.beginRenderPass({
      colorAttachments: [{
        view: viewOf(target),
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
        loadOp: drawOpts.clear === false ? "load" : "clear",
        storeOp: "store",
      }],
    });
    record(pass, v, shiftsNow, true);
    pass.end();
    device.queue.submit([enc.finish()]);
    return { drawn: n, runs: runs.length };
  };

  /**
   * The same frame, recorded once and replayed.
   *
   * A bundle fixes the draw calls, the bind groups and the scissors; it does
   * NOT fix what the uniform buffers hold, so the shift and the camera still
   * move the picture. That is exactly the frame a scroll and a pan need — and
   * the reason a bundle stops being valid is a clip that has to move with the
   * content it scrolls, which is why `bundleDraw` records without scissors and
   * falls back to `draw` when the list has clips.
   */
  frame.canBundle = runs.every((r) => !r.clip || !r.clip.length);
  frame.bundleDraw = (shiftsNow, viewNow, drawOpts = {}) => {
    if (!frame.canBundle) return frame.draw(shiftsNow, viewNow, drawOpts);
    const v = writeUniforms(shiftsNow, viewNow);
    if (!bundle) {
      const be = device.createRenderBundleEncoder({ colorFormats: [format] });
      record(be, v, shiftsNow, false);
      bundle = be.finish();
    }
    const target = drawOpts.target || context.getCurrentTexture();
    const enc = device.createCommandEncoder();
    const pass = enc.beginRenderPass({
      colorAttachments: [{
        view: viewOf(target),
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
        loadOp: drawOpts.clear === false ? "load" : "clear",
        storeOp: "store",
      }],
    });
    pass.executeBundles([bundle]);
    pass.end();
    device.queue.submit([enc.finish()]);
    return { drawn: n, runs: 1 };
  };

  return frame;
}

export function renderDisplayList(gpu, doc, opts = {}) {
  const frame = prepareDisplayList(gpu, doc, opts);
  const stats = frame.draw(opts.shifts, opts.view);
  return { frame, stats };
}
