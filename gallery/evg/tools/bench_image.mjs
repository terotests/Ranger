// Shared by the benchmark scripts: an 8-bit PNG reader with no dependencies,
// and the two measures they score with.
import fs from "node:fs";
import zlib from "node:zlib";

export function decodePng(file) {
  const b = fs.readFileSync(file);
  let o = 8, ihdr = null; const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), t = b.toString("ascii", o + 4, o + 8);
    if (t === "IHDR") ihdr = { w: b.readUInt32BE(o + 8), h: b.readUInt32BE(o + 12), depth: b[o + 16], color: b[o + 17] };
    if (t === "IDAT") idat.push(b.subarray(o + 8, o + 8 + len));
    o += 12 + len;
    if (t === "IEND") break;
  }
  if (!ihdr || ihdr.depth !== 8) throw new Error("only 8-bit PNG input");
  const ch = { 0: 1, 2: 3, 6: 4 }[ihdr.color];
  if (!ch) throw new Error("unsupported PNG colour type " + ihdr.color);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { w, h } = ihdr, stride = w * ch, px = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride), pos = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[pos++], line = Buffer.from(raw.subarray(pos, pos + stride)); pos += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? line[i - ch] : 0, bb = prev[i], c = i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (ft === 1) v += a; else if (ft === 2) v += bb; else if (ft === 3) v += (a + bb) >> 1;
      else if (ft === 4) { const p = a + bb - c, pa = Math.abs(p - a), pb = Math.abs(p - bb), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? bb : c); }
      line[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const s = x * ch, d = (y * w + x) * 4;
      if (ch === 1) { px[d] = px[d+1] = px[d+2] = line[s]; px[d+3] = 255; }
      else { px[d] = line[s]; px[d+1] = line[s+1]; px[d+2] = line[s+2]; px[d+3] = ch === 4 ? line[s+3] : 255; }
    }
    prev = line;
  }
  return { width: w, height: h, data: px };
}

/** The 1-bit image potrace is given, as a P4 file, plus the pixels it stands for. */
export function writePbm(file, img, threshold = 128) {
  const { width: W, height: H, data: px } = img;
  const bits = new Uint8Array(W * H), ref = Buffer.alloc(W * H * 4);
  for (let i = 0, p = 0; p < W * H; p++, i += 4) {
    bits[p] = (0.299*px[i] + 0.587*px[i+1] + 0.114*px[i+2]) < threshold ? 1 : 0;
    const v = bits[p] ? 0 : 255;
    ref[i] = ref[i+1] = ref[i+2] = v; ref[i+3] = 255;
  }
  const rowBytes = Math.ceil(W / 8), pbm = Buffer.alloc(rowBytes * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (bits[y*W + x]) pbm[y*rowBytes + (x >> 3)] |= 0x80 >> (x & 7);
  fs.writeFileSync(file, Buffer.concat([Buffer.from(`P4\n${W} ${H}\n`), pbm]));
  return ref;
}

export const rmse = (a, b) => { let s = 0, n = 0;
  for (let i = 0; i < a.length; i += 4) for (let c = 0; c < 3; c++) { const d = a[i+c] - b[i+c]; s += d*d; n++; }
  return Math.sqrt(s / n); };

export function ssim(a, b, w, h) {
  const gray = p => { const g = new Float64Array(w * h);
    for (let i = 0, j = 0; j < g.length; i += 4, j++) g[j] = 0.299*p[i] + 0.587*p[i+1] + 0.114*p[i+2];
    return g; };
  const ga = gray(a), gb = gray(b), C1 = 6.5025, C2 = 58.5225, win = 8, step = 4;
  let acc = 0, cnt = 0;
  for (let y = 0; y + win <= h; y += step) for (let x = 0; x + win <= w; x += step) {
    let ma = 0, mb = 0;
    for (let j = 0; j < win; j++) for (let i = 0; i < win; i++) { const k = (y+j)*w + x+i; ma += ga[k]; mb += gb[k]; }
    const n = win * win; ma /= n; mb /= n;
    let va = 0, vb = 0, cov = 0;
    for (let j = 0; j < win; j++) for (let i = 0; i < win; i++) { const k = (y+j)*w + x+i;
      const da = ga[k] - ma, db = gb[k] - mb; va += da*da; vb += db*db; cov += da*db; }
    va /= n-1; vb /= n-1; cov /= n-1;
    acc += ((2*ma*mb + C1) * (2*cov + C2)) / ((ma*ma + mb*mb + C1) * (va + vb + C2));
    cnt++;
  }
  return acc / cnt;
}
