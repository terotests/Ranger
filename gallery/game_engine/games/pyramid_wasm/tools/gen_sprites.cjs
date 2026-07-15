// Generate the committed billboard sprite sheets for pyramid_wasm.
//   node gallery/game_engine/games/pyramid_wasm/tools/gen_sprites.cjs
// Emits sprites/mummy.png — a little mummy in 4 facings (rows: front, left,
// right, back) x 3 walk frames (cols), RGBA with a transparent background,
// drawn simply but readably. The 3D engine renders it as a camera-facing
// billboard; the guest picks the cell from facing-vs-camera + a walk cycle.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const OUT = path.join(__dirname, '..', 'sprites');
fs.mkdirSync(OUT, { recursive: true });

// ---- PNG encoder (RGBA) ----------------------------------------------------
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
function writePNG(name, W, H, buf /* RGBA */) {
  const raw = Buffer.alloc(H * (W * 4 + 1));
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    buf.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  fs.writeFileSync(path.join(OUT, name),
    Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
  console.log('wrote sprites/' + name + ' (' + W + 'x' + H + ')');
}

// ---- mummy sheet -----------------------------------------------------------
const CW = 32, CH = 48, COLS = 3, ROWS = 4;        // 3 walk frames x 4 facings
const SW = CW * COLS, SH = CH * ROWS;
const sheet = Buffer.alloc(SW * SH * 4);           // zeroed => transparent

const WRAP = [216, 205, 165], WRAP_D = [150, 138, 105], EYE = [38, 28, 22], GLOW = [255, 150, 60];
function set(cx, cy, lx, ly, rgb, a = 255) {
  if (lx < 0 || ly < 0 || lx >= CW || ly >= CH) return;
  const X = cx * CW + lx, Y = cy * CH + ly, o = (Y * SW + X) * 4;
  sheet[o] = rgb[0]; sheet[o + 1] = rgb[1]; sheet[o + 2] = rgb[2]; sheet[o + 3] = a;
}
function ellipse(cx, cy, ox, oy, rx, ry, rgb) {
  for (let ly = Math.floor(oy - ry); ly <= oy + ry; ly++)
    for (let lx = Math.floor(ox - rx); lx <= ox + rx; lx++) {
      const dx = (lx - ox) / rx, dy = (ly - oy) / ry;
      if (dx * dx + dy * dy <= 1) set(cx, cy, lx, ly, rgb);
    }
}
function rect(cx, cy, x0, y0, x1, y1, rgb) {
  for (let ly = y0; ly < y1; ly++) for (let lx = x0; lx < x1; lx++) set(cx, cy, lx, ly, rgb);
}
// bandage stripes over whatever body pixels exist in [y0,y1)
function stripes(cx, cy, y0, y1) {
  for (let ly = y0; ly < y1; ly++) {
    if (((ly + (cx % 2)) % 5) !== 0) continue;
    for (let lx = 0; lx < CW; lx++) {
      const o = ((cy * CH + ly) * SW + (cx * CW + lx)) * 4;
      if (sheet[o + 3] > 0) { sheet[o] = WRAP_D[0]; sheet[o + 1] = WRAP_D[1]; sheet[o + 2] = WRAP_D[2]; }
    }
  }
}

// draw one cell: dir 0=front,1=left,2=right,3=back ; frame 0..2 (leg swing)
function drawMummy(col, row) {
  const dir = row, frame = col;
  const swing = frame === 1 ? 0 : (frame === 0 ? -1 : 1);
  // legs (behind body)
  rect(col, row, 12 + swing, 38, 16 + swing, 47, WRAP);
  rect(col, row, 16 - swing, 38, 20 - swing, 47, WRAP);
  // torso
  ellipse(col, row, 16, 27, 8, 12, WRAP);
  // arms — Egyptian outstretched for front/back; one forward for profiles
  if (dir === 0 || dir === 3) {
    rect(col, row, 4, 22, 9, 26, WRAP);
    rect(col, row, 23, 22, 28, 26, WRAP);
  } else if (dir === 1) {
    rect(col, row, 3, 24, 12, 28, WRAP);   // arm forward (left)
  } else {
    rect(col, row, 20, 24, 29, 28, WRAP);  // arm forward (right)
  }
  // head
  ellipse(col, row, 16, 11, 7, 8, WRAP);
  // bandage stripes across body + head
  stripes(col, row, 4, 47);
  // eyes / face by facing
  if (dir === 0) {            // front: two eyes
    ellipse(col, row, 13, 11, 1.4, 1.8, EYE);
    ellipse(col, row, 19, 11, 1.4, 1.8, EYE);
  } else if (dir === 1) {     // left profile: one eye toward the left
    ellipse(col, row, 12, 11, 1.4, 1.8, GLOW);
  } else if (dir === 2) {     // right profile: one eye toward the right
    ellipse(col, row, 20, 11, 1.4, 1.8, GLOW);
  }                            // back: no face
}

for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) drawMummy(c, r);
writePNG('mummy.png', SW, SH, sheet);
