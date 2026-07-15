// Generate the committed GLB models for pyramid_wasm.
//   node gallery/game_engine/games/pyramid_wasm/tools/gen_models.cjs
// Emits models/diamond.glb — a flat-shaded octahedral gem with an embedded
// cyan PNG texture, a real GLB the model3d loader parses end-to-end.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const OUT = path.join(__dirname, '..', 'models');
fs.mkdirSync(OUT, { recursive: true });

// ---- tiny PNG encoder (RGBA, 8-bit) ---------------------------------------
function crc32(buf) {
  let c = ~0 >>> 0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function pngRGBA(n, rgbFn) {
  const raw = Buffer.alloc(n * (n * 4 + 1));
  for (let y = 0; y < n; y++) {
    raw[y * (n * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < n; x++) {
      const [r, g, b, a] = rgbFn(x, y);
      const o = y * (n * 4 + 1) + 1 + x * 4;
      raw[o] = r & 255; raw[o + 1] = g & 255; raw[o + 2] = b & 255; raw[o + 3] = a & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(n, 0); ihdr.writeUInt32BE(n, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// ---- geometry: flat-shaded octahedron gem ---------------------------------
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

// A 6-sided brilliant-cut gem: a hexagonal girdle sitting ~75% up (short crown,
// long pavilion), a top crown apex and a bottom culet point. 12 flat-shaded
// facets pointing in different directions catch the light like a real diamond.
function hexGem() {
  const SIDES = 6;
  const R = 0.32;     // girdle radius (widest)
  const ht = 0.18;    // crown height above the girdle
  const hb = 0.54;    // pavilion depth below (girdle at hb/(ht+hb) = 75%)
  const T = [0, ht, 0], B = [0, -hb, 0];
  const G = [];
  for (let i = 0; i < SIDES; i++) {
    const a = (i / SIDES) * Math.PI * 2;
    G.push([Math.cos(a) * R, 0, Math.sin(a) * R]);
  }
  const faces = [];
  for (let i = 0; i < SIDES; i++) {
    const j = (i + 1) % SIDES;
    faces.push([T, G[i], G[j]]);   // crown facet
    faces.push([B, G[j], G[i]]);   // pavilion facet
  }
  const positions = [], normals = [], uvs = [], indices = [];
  const uvTri = [[0.5, 1], [0, 0], [1, 0]];
  faces.forEach((f) => {
    let nrm = norm(cross(sub(f[1], f[0]), sub(f[2], f[0])));
    const cen = [(f[0][0] + f[1][0] + f[2][0]) / 3, (f[0][1] + f[1][1] + f[2][1]) / 3, (f[0][2] + f[1][2] + f[2][2]) / 3];
    if (dot(nrm, cen) < 0) nrm = [-nrm[0], -nrm[1], -nrm[2]]; // face outward
    const base = positions.length;
    for (let k = 0; k < 3; k++) {
      positions.push(f[k]); normals.push(nrm); uvs.push(uvTri[k]);
    }
    indices.push(base, base + 1, base + 2);
  });
  return { positions, normals, uvs, indices };
}

// ---- GLB assembly ----------------------------------------------------------
function f32le(arr) {
  const b = Buffer.alloc(arr.length * 4);
  arr.forEach((v, i) => b.writeFloatLE(v, i * 4));
  return b;
}
function pad4(n) { return (4 - (n % 4)) % 4; }

function buildGlb(geo, png) {
  const pos = f32le(geo.positions.flat());
  const nrm = f32le(geo.normals.flat());
  const uv = f32le(geo.uvs.flat());
  const idx = Buffer.alloc(geo.indices.length * 2);
  geo.indices.forEach((v, i) => idx.writeUInt16LE(v, i * 2));

  // BIN: pos | nrm | uv | idx (pad to 4) | png
  const parts = [pos, nrm, uv, idx];
  let off = 0;
  const views = [];
  for (const p of parts) { views.push({ off, len: p.length }); off += p.length; }
  const padIdx = pad4(off); off += padIdx;
  const pngView = { off, len: png.length };
  const bin = Buffer.concat([pos, nrm, uv, idx, Buffer.alloc(padIdx), png]);
  const binPad = pad4(bin.length);
  const binPadded = Buffer.concat([bin, Buffer.alloc(binPad)]);

  const vc = geo.positions.length;
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'Diamond', mesh: 0 }],
    meshes: [{ name: 'Diamond', primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0, mode: 4 }] }],
    materials: [{
      name: 'Gem',
      doubleSided: true,
      alphaMode: 'BLEND',
      pbrMetallicRoughness: { baseColorFactor: [0.45, 0.72, 1.0, 0.55], baseColorTexture: { index: 0 }, metallicFactor: 0.2, roughnessFactor: 0.15 },
      emissiveFactor: [0.15, 0.45, 0.9],
      extensions: { KHR_materials_emissive_strength: { emissiveStrength: 1.6 } },
    }],
    textures: [{ source: 0 }],
    images: [{ mimeType: 'image/png', bufferView: 4 }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: vc, type: 'VEC3' },
      { bufferView: 1, componentType: 5126, count: vc, type: 'VEC3' },
      { bufferView: 2, componentType: 5126, count: vc, type: 'VEC2' },
      { bufferView: 3, componentType: 5123, count: geo.indices.length, type: 'SCALAR' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: views[0].off, byteLength: views[0].len },
      { buffer: 0, byteOffset: views[1].off, byteLength: views[1].len },
      { buffer: 0, byteOffset: views[2].off, byteLength: views[2].len },
      { buffer: 0, byteOffset: views[3].off, byteLength: views[3].len },
      { buffer: 0, byteOffset: pngView.off, byteLength: pngView.len },
    ],
    buffers: [{ byteLength: binPadded.length }],
  };
  let jbuf = Buffer.from(JSON.stringify(json), 'utf8');
  const jpad = pad4(jbuf.length);
  jbuf = Buffer.concat([jbuf, Buffer.alloc(jpad, 0x20)]); // pad with spaces

  const total = 12 + 8 + jbuf.length + 8 + binPadded.length;
  const out = Buffer.alloc(total);
  let p = 0;
  out.writeUInt32LE(0x46546C67, p); p += 4; // 'glTF'
  out.writeUInt32LE(2, p); p += 4;
  out.writeUInt32LE(total, p); p += 4;
  out.writeUInt32LE(jbuf.length, p); p += 4;
  out.writeUInt32LE(0x4E4F534A, p); p += 4; // 'JSON'
  jbuf.copy(out, p); p += jbuf.length;
  out.writeUInt32LE(binPadded.length, p); p += 4;
  out.writeUInt32LE(0x004E4942, p); p += 4; // 'BIN\0'
  binPadded.copy(out, p);
  return out;
}

const png = pngRGBA(16, (x, y) => {
  // bright icy highlights; the blue tint comes from the material baseColorFactor
  const f = ((x >> 2) + (y >> 2)) & 1 ? 22 : -14;
  const s = Math.max(0, 1 - Math.hypot(x - 8, y - 8) / 11) * 55;
  return [210 + f + s, 232 + f + s, 255, 255];
});
const glb = buildGlb(hexGem(), png);
fs.writeFileSync(path.join(OUT, 'diamond.glb'), glb);
console.log('wrote models/diamond.glb (' + glb.length + ' bytes)');
