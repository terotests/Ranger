// Headless host for the fps_wasm guest — a light Doom-style walk-around.
//
// The guest owns the level + player physics; this host loads textures, drives a
// scripted input sequence (move/turn/jump), renders the first-person view with
// the textured z-buffer rasteriser, and draws a top-down map from the guest's
// COLLIDERS block + the recorded player path.
//
//   node gallery/game_engine/games/fps_wasm/tools/render.cjs [frames]
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const W = 420, H = 300;
const HERE = __dirname;
const WASM = path.join(HERE, '..', 'logic.wasm');
const ASSETS = path.join(HERE, '..', 'assets');
const OUT = path.join(HERE, '..', 'out');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- vec/mat
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
function mul(a, b) {
  const o = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { let s = 0; for (let k = 0; k < 4; k++) s += a[r * 4 + k] * b[k * 4 + c]; o[r * 4 + c] = s; }
  return o;
}
const apply = (m, v) => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3] * v[3],
  m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7] * v[3],
  m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11] * v[3],
  m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3],
];
function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, 2 * far * near * nf, 0, 0, -1, 0];
}
function lookAt(eye, target, up) {
  const z = norm(sub(eye, target)), x = norm(cross(up, z)), y = cross(z, x);
  return [x[0], x[1], x[2], -dot(x, eye), y[0], y[1], y[2], -dot(y, eye), z[0], z[1], z[2], -dot(z, eye), 0, 0, 0, 1];
}

// ---------------------------------------------------------------- PNG
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgb, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---------------------------------------------------------------- textures (§17)
const textures = [null];
function decodePPM(buf) {
  let p = 0;
  const tok = () => { while ([32, 10, 9, 13].includes(buf[p])) p++; let s = p; while (p < buf.length && ![32, 10, 9, 13].includes(buf[p])) p++; return buf.slice(s, p).toString('ascii'); };
  if (tok() !== 'P6') throw new Error('not P6');
  const w = +tok(), h = +tok(); tok(); p++;
  return { w, h, data: buf.slice(p, p + w * h * 3) };
}
function loadTexture(name) { textures.push(decodePPM(fs.readFileSync(path.join(ASSETS, name + '.ppm')))); return textures.length - 1; }
function sampleTex(tex, u, v) {
  let tx = Math.floor((u - Math.floor(u)) * tex.w), ty = Math.floor((1 - (v - Math.floor(v))) * tex.h);
  tx = ((tx % tex.w) + tex.w) % tex.w; ty = ((ty % tex.h) + tex.h) % tex.h;
  const o = (ty * tex.w + tx) * 3;
  return [tex.data[o] / 255, tex.data[o + 1] / 255, tex.data[o + 2] / 255];
}

// ---------------------------------------------------------------- block reads
function readScene(exp) {
  const dv = new DataView(exp.memory.buffer);
  const i32 = (o) => dv.getInt32(o, true), u32 = (o) => dv.getUint32(o, true), u16 = (o) => dv.getUint16(o, true);
  const FP = 256, Q = 65536, UVS = 4096;
  const mp = exp.rg_mesh_ptr();
  const vc = u32(mp + 16), ic = u32(mp + 20), sc = u32(mp + 24);
  const VTX = mp + 64, verts = [];
  for (let i = 0; i < vc; i++) {
    const o = VTX + i * 32, uvp = u32(o + 28);
    verts.push({ p: [i32(o) / FP, i32(o + 4) / FP, i32(o + 8) / FP], n: [i32(o + 12) / Q, i32(o + 16) / Q, i32(o + 20) / Q], uv: [(uvp & 0xffff) / UVS, (uvp >>> 16) / UVS] });
  }
  const IDX = mp + u32(mp + 52), idx = []; // pool offsets published in the header
  for (let i = 0; i < ic; i++) idx.push(u16(IDX + i * 2));
  const SUB = mp + u32(mp + 56), sub2 = [];
  for (let i = 0; i < sc; i++) { const o = SUB + i * 12; sub2.push({ first: u32(o), count: u32(o + 4), material: u32(o + 8) }); }
  const tp = exp.rg_mat_ptr(), mc = u32(tp + 16), mats = [];
  for (let i = 0; i < mc; i++) { const o = 20 + tp + i * 16, base = u32(o + 4); mats.push({ tex: u32(o), base: [((base >>> 24) & 255) / 255, ((base >>> 16) & 255) / 255, ((base >>> 8) & 255) / 255], flags: u32(o + 8) }); }
  const cp = exp.rg_cam_ptr();
  const cam = { eye: [i32(cp + 20) / FP, i32(cp + 24) / FP, i32(cp + 28) / FP], target: [i32(cp + 32) / FP, i32(cp + 36) / FP, i32(cp + 40) / FP], up: [i32(cp + 44) / Q, i32(cp + 48) / Q, i32(cp + 52) / Q], fovy: i32(cp + 56) / FP, near: i32(cp + 60) / FP, far: i32(cp + 64) / FP };
  const lp = exp.rg_lit_ptr();
  const unpack = (c) => [((c >>> 24) & 255) / 255, ((c >>> 16) & 255) / 255, ((c >>> 8) & 255) / 255];
  const lit = { ambRGB: unpack(u32(lp + 16)), ambI: i32(lp + 20) / FP, sunDir: norm([i32(lp + 24) / Q, i32(lp + 28) / Q, i32(lp + 32) / Q]), sunRGB: unpack(u32(lp + 36)), sunI: i32(lp + 40) / FP };
  return { verts, idx, sub: sub2, mats, cam, lit };
}
function readColliders(exp) {
  const dv = new DataView(exp.memory.buffer), i32 = (o) => dv.getInt32(o, true), u32 = (o) => dv.getUint32(o, true), FP = 256;
  const cp = exp.rg_col_ptr(), n = u32(cp + 16), boxes = [];
  for (let i = 0; i < n; i++) { const o = 20 + cp + i * 28; boxes.push({ min: [i32(o) / FP, i32(o + 4) / FP, i32(o + 8) / FP], max: [i32(o + 12) / FP, i32(o + 16) / FP, i32(o + 20) / FP], kind: u32(o + 24) }); }
  return boxes;
}

// ---------------------------------------------------------------- first-person raster
function renderFPS(sc) {
  const color = new Uint8Array(W * H * 3);
  const zbuf = new Float32Array(W * H).fill(Infinity);
  for (let i = 0; i < W * H; i++) { color[i * 3] = 30; color[i * 3 + 1] = 32; color[i * 3 + 2] = 40; } // ceiling/haze
  const view = lookAt(sc.cam.eye, sc.cam.target, sc.cam.up);
  const proj = perspective(sc.cam.fovy, W / H, sc.cam.near, sc.cam.far);
  const vp = mul(proj, view);
  const lightTerm = (wn) => { const nl = Math.max(0, dot(wn, sc.lit.sunDir)); return [0, 1, 2].map((i) => sc.lit.ambI * sc.lit.ambRGB[i] + sc.lit.sunI * nl * sc.lit.sunRGB[i]); };
  const T = sc.verts.map((v) => ({ clip: apply(vp, [v.p[0], v.p[1], v.p[2], 1]), light: lightTerm(norm(v.n)), uv: v.uv }));
  const sx = (c) => (c[0] / c[3] * 0.5 + 0.5) * W, sy = (c) => (1 - (c[1] / c[3] * 0.5 + 0.5)) * H, sz = (c) => c[2] / c[3];

  // near-plane clip (w > eps) so a quad with a vertex behind the camera — e.g.
  // the big floor — is clipped, not dropped whole.
  const EPS = 1e-4;
  const lerpV = (a, b, t) => ({
    clip: a.clip.map((v, i) => v + (b.clip[i] - v) * t),
    uv: [a.uv[0] + (b.uv[0] - a.uv[0]) * t, a.uv[1] + (b.uv[1] - a.uv[1]) * t],
    light: a.light.map((v, i) => v + (b.light[i] - v) * t),
  });
  const clipNear = (poly) => {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const ain = a.clip[3] > EPS, bin = b.clip[3] > EPS;
      if (ain) out.push(a);
      if (ain !== bin) out.push(lerpV(a, b, (EPS - a.clip[3]) / (b.clip[3] - a.clip[3])));
    }
    return out;
  };

  const rasterTri = (a, b, c, tex, mat, unlit) => {
    const ax = sx(a.clip), ay = sy(a.clip), az = sz(a.clip), aw = 1 / a.clip[3];
    const bx = sx(b.clip), by = sy(b.clip), bz = sz(b.clip), bw = 1 / b.clip[3];
    const cx = sx(c.clip), cy = sy(c.clip), cz = sz(c.clip), cw = 1 / c.clip[3];
    const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    if (area === 0) return;
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx))), maxX = Math.min(W - 1, Math.ceil(Math.max(ax, bx, cx)));
    const minY = Math.max(0, Math.floor(Math.min(ay, by, cy))), maxY = Math.min(H - 1, Math.ceil(Math.max(ay, by, cy)));
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((bx - px) * (cy - py) - (cx - px) * (by - py)) / area;
      const w1 = ((cx - px) * (ay - py) - (ax - px) * (cy - py)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const depth = w0 * az + w1 * bz + w2 * cz, di = y * W + x;
      if (depth >= zbuf[di]) continue;
      zbuf[di] = depth;
      const iw = w0 * aw + w1 * bw + w2 * cw;
      const p0 = w0 * aw / iw, p1 = w1 * bw / iw, p2 = w2 * cw / iw;
      let tc = [1, 1, 1];
      if (tex) tc = sampleTex(tex, p0 * a.uv[0] + p1 * b.uv[0] + p2 * c.uv[0], p0 * a.uv[1] + p1 * b.uv[1] + p2 * c.uv[1]);
      const lr = unlit ? 1 : w0 * a.light[0] + w1 * b.light[0] + w2 * c.light[0];
      const lg = unlit ? 1 : w0 * a.light[1] + w1 * b.light[1] + w2 * c.light[1];
      const lb = unlit ? 1 : w0 * a.light[2] + w1 * b.light[2] + w2 * c.light[2];
      color[di * 3] = Math.min(255, tc[0] * mat.base[0] * lr * 255) | 0;
      color[di * 3 + 1] = Math.min(255, tc[1] * mat.base[1] * lg * 255) | 0;
      color[di * 3 + 2] = Math.min(255, tc[2] * mat.base[2] * lb * 255) | 0;
    }
  };

  for (const s of sc.sub) {
    const mat = sc.mats[s.material] || sc.mats[0], tex = textures[mat.tex] || null, unlit = (mat.flags & 1) !== 0;
    for (let t = s.first; t < s.first + s.count; t += 3) {
      const poly = clipNear([T[sc.idx[t]], T[sc.idx[t + 1]], T[sc.idx[t + 2]]]);
      for (let i = 1; i + 1 < poly.length; i++) rasterTri(poly[0], poly[i], poly[i + 1], tex, mat, unlit);
    }
  }
  return Buffer.from(color);
}

// ---------------------------------------------------------------- top-down map
function renderMap(boxes, pathPts) {
  const MW = 440, MH = 320, sc = 20, ox = MW / 2, oz = MH / 2;
  const img = Buffer.alloc(MW * MH * 3, 18);
  const X = (wx) => Math.round(ox + wx * sc), Z = (wz) => Math.round(oz - wz * sc);
  const px = (x, y, r, g, b) => { if (x < 0 || y < 0 || x >= MW || y >= MH) return; const o = (y * MW + x) * 3; img[o] = r; img[o + 1] = g; img[o + 2] = b; };
  const rect = (x0, y0, x1, y1, r, g, b) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) px(x, y, r, g, b); };
  for (const bx of boxes) {
    const col = bx.kind === 1 ? [110, 110, 120] : bx.kind === 3 ? [90, 150, 90] : [150, 100, 55];
    rect(X(bx.min[0]), Z(bx.min[2]), X(bx.max[0]), Z(bx.max[2]), ...col);
  }
  // player path
  for (let i = 1; i < pathPts.length; i++) {
    const a = pathPts[i - 1], b = pathPts[i];
    const steps = Math.max(1, Math.round(Math.hypot(X(b.x) - X(a.x), Z(b.z) - Z(a.z))));
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(X(a.x) + (X(b.x) - X(a.x)) * s / steps), y = Math.round(Z(a.z) + (Z(b.z) - Z(a.z)) * s / steps);
      const col = b.air ? [255, 210, 80] : [90, 200, 255];
      px(x, y, ...col); px(x + 1, y, ...col); px(x, y + 1, ...col);
    }
  }
  const start = pathPts[0], end = pathPts[pathPts.length - 1];
  rect(X(start.x) - 3, Z(start.z) - 3, X(start.x) + 3, Z(start.z) + 3, 80, 255, 120);
  rect(X(end.x) - 3, Z(end.z) - 3, X(end.x) + 3, Z(end.z) + 3, 255, 90, 90);
  return { buf: img, w: MW, h: MH };
}

function montage(frames, cols) {
  const rows = Math.ceil(frames.length / cols), MW = W * cols, MH = H * rows;
  const out = Buffer.alloc(MW * MH * 3, 20);
  frames.forEach((fr, k) => { const cx = (k % cols) * W, cy = Math.floor(k / cols) * H; for (let y = 0; y < H; y++) fr.copy(out, ((cy + y) * MW + cx) * 3, y * W * 3, (y + 1) * W * 3); });
  return { buf: out, w: MW, h: MH };
}

// ---------------------------------------------------------------- input script
// segments: [nFrames, forward, strafe, turn, jump]
const SCRIPT = [
  [10, 0, 0, 0, 0],    // settle
  [22, 0, 0, 1, 0],    // turn right toward the doorway (+X)
  [46, 1, 0, 0, 0],    // walk east across left room, past the pillars
  [30, 1, 0, 0, 0],    // through the doorway into the right room
  [6, 0, 0, 0, 1],     // jump...
  [22, 1, 0, 0, 0],    // ...forward onto the low platform
  [16, 0, 0, 1, 0],    // turn to look around room B
  [26, 1, 0, 0, 0],    // walk toward the east wall (collision stop)
  [10, 1, 0, 0, 0],    // keep pushing into the wall — slides/stops
  [18, 0, 0, -1, 0],   // turn back
  [26, 1, 0, 0, 0],    // walk back
];

(async () => {
  const nOverride = parseInt(process.argv[2] || '0', 10);
  const mod = new WebAssembly.Module(fs.readFileSync(WASM));
  let inst;
  const env = { rg_res_load: (p, l) => { const name = Buffer.from(new Uint8Array(inst.exports.memory.buffer, p, l)).toString('utf8'); const h = loadTexture(name); console.log(`  rg_res_load("${name}") -> ${h}`); return h; } };
  inst = new WebAssembly.Instance(mod, { env });
  const exp = inst.exports;
  exp.init();

  const boxes = readColliders(exp);
  const flat = [];
  for (const [n, f, s, t, j] of SCRIPT) for (let i = 0; i < n; i++) flat.push([f, s, t, i === 0 ? j : 0]);
  const total = nOverride > 0 ? nOverride : flat.length;

  const path2 = [];
  const frames = [];
  const grabEvery = Math.max(1, Math.floor(total / 12));
  let hero = null;
  for (let f = 0; f < total; f++) {
    const [fw, st, tn, jp] = flat[Math.min(f, flat.length - 1)] || [0, 0, 0, 0];
    exp.update(33, fw, st, tn, jp);
    const pxw = exp.player_x() / 256, pzw = exp.player_z() / 256, air = exp.player_on_ground() === 0;
    path2.push({ x: pxw, z: pzw, air });
    if (f % grabEvery === 0 && frames.length < 12) frames.push(renderFPS(readScene(exp)));
    if (f === Math.floor(total * 0.62)) hero = renderFPS(readScene(exp));
  }
  if (!hero) hero = frames[frames.length - 1];

  fs.writeFileSync(path.join(OUT, 'fps_hero.png'), encodePNG(hero, W, H));
  const m = montage(frames, 3);
  fs.writeFileSync(path.join(OUT, 'fps_walk_montage.png'), encodePNG(m.buf, m.w, m.h));
  const mp = renderMap(boxes, path2);
  fs.writeFileSync(path.join(OUT, 'fps_map.png'), encodePNG(mp.buf, mp.w, mp.h));
  console.log(`stepped ${total} physics frames; ${boxes.length} colliders`);
  console.log('  out/fps_hero.png');
  console.log('  out/fps_walk_montage.png');
  console.log('  out/fps_map.png   (top-down: walls grey, obstacles brown, platform green, path blue/gold=airborne)');
})().catch((e) => { console.error(e); process.exit(1); });
