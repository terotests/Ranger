// ppm_to_png.cjs — convert a binary PPM (P6) to PNG for viewing.
//
// The Ranger SoftRenderer3D writes P6 PPM (portable, no encoder dependency);
// this repackages it as PNG using Node's built-in zlib. Rendering itself is done
// entirely by the Ranger code — this only changes the container.
//
//   node ppm_to_png.cjs <in.ppm> <out.png>

const fs = require('fs');
const zlib = require('zlib');

const inp = process.argv[2];
const outp = process.argv[3];
if (!inp || !outp) {
  console.error('usage: node ppm_to_png.cjs <in.ppm> <out.png>');
  process.exit(1);
}

const buf = fs.readFileSync(inp);
let p = 0;
function ws(b) { return b === 32 || b === 10 || b === 9 || b === 13; }
function tok() {
  while (ws(buf[p])) p++;
  const s = p;
  while (!ws(buf[p])) p++;
  return buf.slice(s, p).toString();
}
const magic = tok();
if (magic !== 'P6') { console.error('not a P6 PPM'); process.exit(1); }
const W = +tok(), H = +tok();
tok();       // maxval
p++;         // single whitespace after maxval
const rgb = buf.slice(p);

function crc32(b) {
  let c = ~0;
  for (let i = 0; i < b.length; i++) {
    c ^= b[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const T = Buffer.from(type);
  const L = Buffer.alloc(4); L.writeUInt32BE(data.length);
  const cd = Buffer.concat([T, data]);
  const C = Buffer.alloc(4); C.writeUInt32BE(crc32(cd));
  return Buffer.concat([L, cd, C]);
}

const raw = Buffer.alloc(H * (1 + W * 3));
let o = 0;
for (let y = 0; y < H; y++) {
  raw[o++] = 0; // filter: none
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    raw[o++] = rgb[i]; raw[o++] = rgb[i + 1]; raw[o++] = rgb[i + 2];
  }
}
const idat = zlib.deflateSync(raw);
const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 2;  // colour type: RGB
fs.writeFileSync(outp, Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]));
console.log(`wrote ${outp} (${W}x${H})`);
