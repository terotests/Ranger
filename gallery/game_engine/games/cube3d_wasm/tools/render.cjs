// Headless host for the cube3d_wasm guest — the Phase-1 slice of ABI_V2 §18–§21.
//
// It instantiates the WASM guest, reads the guest-declared MESH ('RGMB'),
// CAMERA ('RGCM') and LIGHT ('RGLT') blocks straight out of linear memory,
// builds the view-projection host-side (§19), software-rasterises the triangles
// with a z-buffer, shades per-vertex Gouraud from the sun+ambient light (§20),
// and writes PNG frames + a montage. No GPU, no SDL, no display required.
//
//   node gallery/game_engine/games/cube3d_wasm/tools/render.cjs [frames]
//
// This is the "host-side matrix math + software rasteriser first" step of the
// §21 incremental plan: it proves the render pipeline and the Rust->WASM guest
// end to end. Phase 2 swaps the guest's hand-spun rotation for the cannon 3D
// physics world driving the same MESH transform.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const W = 400, H = 300;
const HERE = __dirname;
const WASM = path.join(HERE, '..', 'logic.wasm');
const OUT = path.join(HERE, '..', 'out');
fs.mkdirSync(OUT, { recursive: true });

// ------------------------------------------------------------------ tiny vec/mat
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function mul(a, b) { // 4x4 row-major a*b
  const o = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    let s = 0; for (let k = 0; k < 4; k++) s += a[r * 4 + k] * b[k * 4 + c];
    o[r * 4 + c] = s;
  }
  return o;
}
function apply(m, v) { // m * [x,y,z,w]
  const x = v[0], y = v[1], z = v[2], w = v[3];
  return [
    m[0] * x + m[1] * y + m[2] * z + m[3] * w,
    m[4] * x + m[5] * y + m[6] * z + m[7] * w,
    m[8] * x + m[9] * y + m[10] * z + m[11] * w,
    m[12] * x + m[13] * y + m[14] * z + m[15] * w,
  ];
}
function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, 2 * far * near * nf,
    0, 0, -1, 0,
  ];
}
function lookAt(eye, target, up) {
  const z = norm(sub(eye, target));
  const x = norm(cross(up, z));
  const y = cross(z, x);
  return [
    x[0], x[1], x[2], -dot(x, eye),
    y[0], y[1], y[2], -dot(y, eye),
    z[0], z[1], z[2], -dot(z, eye),
    0, 0, 0, 1,
  ];
}
function rotY(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1]; }
function rotX(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1]; }

// ------------------------------------------------------------------ PNG encoder
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgb, w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit truecolor
  const raw = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0; // filter none
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ------------------------------------------------------------------ block reads
function readBlocks(exp, mem) {
  const dv = new DataView(mem.buffer);
  const i32 = (o) => dv.getInt32(o, true);
  const u32 = (o) => dv.getUint32(o, true);
  const u16 = (o) => dv.getUint16(o, true);
  const FP = 256, Q16 = 65536;

  // MESH
  const mp = exp.rg_mesh_ptr();
  if (u32(mp) !== 0x424d4752) throw new Error('bad MESH magic');
  const vc = u32(mp + 16), ic = u32(mp + 20);
  const rot = [i32(mp + 24) / FP, i32(mp + 28) / FP, i32(mp + 32) / FP];
  const pos = [i32(mp + 36) / FP, i32(mp + 40) / FP, i32(mp + 44) / FP];
  const flags = u32(mp + 48);
  const VTX = mp + 64, VSZ = 32;
  const verts = [];
  for (let i = 0; i < vc; i++) {
    const o = VTX + i * VSZ;
    verts.push({
      p: [i32(o) / FP, i32(o + 4) / FP, i32(o + 8) / FP],
      n: [i32(o + 12) / Q16, i32(o + 16) / Q16, i32(o + 20) / Q16],
      c: u32(o + 24),
    });
  }
  const IDX = VTX + vc * VSZ, idx = [];
  for (let i = 0; i < ic; i++) idx.push(u16(IDX + i * 2));

  // CAM
  const cp = exp.rg_cam_ptr();
  if (u32(cp) !== 0x4d434752) throw new Error('bad CAM magic');
  const cam = {
    proj: u32(cp + 16),
    eye: [i32(cp + 20) / FP, i32(cp + 24) / FP, i32(cp + 28) / FP],
    target: [i32(cp + 32) / FP, i32(cp + 36) / FP, i32(cp + 40) / FP],
    up: norm([i32(cp + 44) / Q16, i32(cp + 48) / Q16, i32(cp + 52) / Q16]),
    fovy: i32(cp + 56) / FP,
    near: i32(cp + 60) / FP,
    far: i32(cp + 64) / FP,
  };

  // LIGHT
  const lp = exp.rg_lit_ptr();
  if (u32(lp) !== 0x544c4752) throw new Error('bad LIGHT magic');
  const unpack = (c) => [(c >>> 24) & 255, (c >>> 16) & 255, (c >>> 8) & 255];
  const lit = {
    ambientRGB: unpack(u32(lp + 16)).map((v) => v / 255),
    ambientI: i32(lp + 20) / FP,
    sunDir: norm([i32(lp + 24) / Q16, i32(lp + 28) / Q16, i32(lp + 32) / Q16]),
    sunRGB: unpack(u32(lp + 36)).map((v) => v / 255),
    sunI: i32(lp + 40) / FP,
  };
  return { verts, idx, rot, pos, flags, cam, lit };
}

// ------------------------------------------------------------------ rasteriser
function renderFrame(scene) {
  const { verts, idx, rot, pos, flags, cam, lit } = scene;
  const color = new Uint8Array(W * H * 3);
  const zbuf = new Float32Array(W * H).fill(Infinity);
  // dark background
  for (let i = 0; i < W * H; i++) { color[i * 3] = 24; color[i * 3 + 1] = 26; color[i * 3 + 2] = 34; }

  const model = mul(mul(rotX(rot[0]), rotY(rot[1])), [1, 0, 0, pos[0], 0, 1, 0, pos[1], 0, 0, 1, pos[2], 0, 0, 0, 1]);
  const view = lookAt(cam.eye, cam.target, cam.up);
  const proj = perspective(cam.fovy, W / H, cam.near, cam.far);
  const vp = mul(proj, view);
  const unlit = (flags & 1) !== 0;

  // transform + shade every vertex
  const T = verts.map((v) => {
    const world = apply(model, [v.p[0], v.p[1], v.p[2], 1]);
    const wn = norm(apply(model, [v.n[0], v.n[1], v.n[2], 0]));
    const clip = apply(vp, world);
    const base = [((v.c >>> 24) & 255) / 255, ((v.c >>> 16) & 255) / 255, ((v.c >>> 8) & 255) / 255];
    let rgb;
    if (unlit) {
      rgb = base;
    } else {
      const nl = Math.max(0, dot(wn, lit.sunDir));
      rgb = base.map((b, i) =>
        Math.min(1, b * (lit.ambientI * lit.ambientRGB[i] + lit.sunI * nl * lit.sunRGB[i])));
    }
    return { clip, rgb };
  });

  const sx = (c) => (c[0] / c[3] * 0.5 + 0.5) * W;
  const sy = (c) => (1 - (c[1] / c[3] * 0.5 + 0.5)) * H;
  const sz = (c) => c[2] / c[3];

  for (let t = 0; t < idx.length; t += 3) {
    const a = T[idx[t]], b = T[idx[t + 1]], c = T[idx[t + 2]];
    if (a.clip[3] <= 0 || b.clip[3] <= 0 || c.clip[3] <= 0) continue; // behind camera
    const ax = sx(a.clip), ay = sy(a.clip), az = sz(a.clip);
    const bx = sx(b.clip), by = sy(b.clip), bz = sz(b.clip);
    const cx = sx(c.clip), cy = sy(c.clip), cz = sz(c.clip);
    const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    if (area === 0) continue;
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const maxX = Math.min(W - 1, Math.ceil(Math.max(ax, bx, cx)));
    const minY = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const maxY = Math.min(H - 1, Math.ceil(Math.max(ay, by, cy)));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5;
        let w0 = ((bx - px) * (cy - py) - (cx - px) * (by - py)) / area;
        let w1 = ((cx - px) * (ay - py) - (ax - px) * (cy - py)) / area;
        let w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue; // outside (z-buffer handles both windings)
        const depth = w0 * az + w1 * bz + w2 * cz;
        const di = y * W + x;
        if (depth >= zbuf[di]) continue;
        zbuf[di] = depth;
        const r = w0 * a.rgb[0] + w1 * b.rgb[0] + w2 * c.rgb[0];
        const g = w0 * a.rgb[1] + w1 * b.rgb[1] + w2 * c.rgb[1];
        const bl = w0 * a.rgb[2] + w1 * b.rgb[2] + w2 * c.rgb[2];
        color[di * 3] = Math.min(255, r * 255) | 0;
        color[di * 3 + 1] = Math.min(255, g * 255) | 0;
        color[di * 3 + 2] = Math.min(255, bl * 255) | 0;
      }
    }
  }
  return Buffer.from(color);
}

function montage(frames, cols) {
  const rows = Math.ceil(frames.length / cols);
  const MW = W * cols, MH = H * rows;
  const out = Buffer.alloc(MW * MH * 3, 20);
  frames.forEach((fr, k) => {
    const cx = (k % cols) * W, cy = Math.floor(k / cols) * H;
    for (let y = 0; y < H; y++)
      fr.copy(out, ((cy + y) * MW + cx) * 3, y * W * 3, (y + 1) * W * 3);
  });
  return { buf: out, w: MW, h: MH };
}

// ------------------------------------------------------------------ main
(async () => {
  const nFrames = parseInt(process.argv[2] || '48', 10);
  const mod = new WebAssembly.Module(fs.readFileSync(WASM));
  const inst = new WebAssembly.Instance(mod, {});
  const exp = inst.exports;
  const mem = exp.memory;
  exp.init();

  const heroIdx = Math.floor(nFrames * 0.28);
  const grabAt = [];
  for (let i = 0; i < 9; i++) grabAt.push(Math.floor((i * nFrames) / 9));
  const grabbed = [];
  let hero = null;

  for (let f = 0; f < nFrames; f++) {
    exp.update(16, 0, 0, 0, 0);
    if (grabAt.includes(f) || f === heroIdx) {
      const scene = readBlocks(exp, mem);
      const buf = renderFrame(scene);
      if (grabAt.includes(f)) grabbed.push(buf);
      if (f === heroIdx) hero = buf;
    }
  }

  fs.writeFileSync(path.join(OUT, 'cube_hero.png'), encodePNG(hero, W, H));
  const m = montage(grabbed, 3);
  fs.writeFileSync(path.join(OUT, 'cube_spin_montage.png'), encodePNG(m.buf, m.w, m.h));
  console.log(`rendered ${nFrames} frames of the guest-declared cube`);
  console.log(`  out/cube_hero.png            (${W}x${H})`);
  console.log(`  out/cube_spin_montage.png    (${m.w}x${m.h}, 3x3 of the rotation)`);
})().catch((e) => { console.error(e); process.exit(1); });
