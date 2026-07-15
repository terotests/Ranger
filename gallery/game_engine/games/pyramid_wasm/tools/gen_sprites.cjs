// Generate the committed billboard sprite sheets for pyramid_wasm.
//   node gallery/game_engine/games/pyramid_wasm/tools/gen_sprites.cjs
// Emits:
//   sprites/mummy.png — 3 walk frames x 4 facings (front/left/right/back)
//   sprites/hero.png  — 4 cols (walk 0-2 + jump) x 4 facings
// RGBA with a transparent background. The 3D engine renders each as a
// camera-facing billboard; the guest picks the cell (facing row, frame col).
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
function writePNG(name, W, H, buf) {
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

// ---- per-cell drawing context ----------------------------------------------
function makeSheet(name, cols, rows, CW, CH, drawCell) {
  const SW = CW * cols, SH = CH * rows;
  const sheet = Buffer.alloc(SW * SH * 4);
  const ctx = {
    CW, CH,
    set(cx, cy, lx, ly, rgb, a = 255) {
      if (lx < 0 || ly < 0 || lx >= CW || ly >= CH) return;
      const o = ((cy * CH + ly) * SW + (cx * CW + lx)) * 4;
      sheet[o] = rgb[0]; sheet[o + 1] = rgb[1]; sheet[o + 2] = rgb[2]; sheet[o + 3] = a;
    },
    ellipse(cx, cy, ox, oy, rx, ry, rgb) {
      for (let ly = Math.floor(oy - ry); ly <= oy + ry; ly++)
        for (let lx = Math.floor(ox - rx); lx <= ox + rx; lx++) {
          const dx = (lx - ox) / rx, dy = (ly - oy) / ry;
          if (dx * dx + dy * dy <= 1) ctx.set(cx, cy, lx, ly, rgb);
        }
    },
    rect(cx, cy, x0, y0, x1, y1, rgb) {
      for (let ly = y0; ly < y1; ly++) for (let lx = x0; lx < x1; lx++) ctx.set(cx, cy, lx, ly, rgb);
    },
    stripes(cx, cy, y0, y1, rgb) {
      for (let ly = y0; ly < y1; ly++) {
        if (((ly + (cx % 2)) % 5) !== 0) continue;
        for (let lx = 0; lx < CW; lx++) {
          const o = ((cy * CH + ly) * SW + (cx * CW + lx)) * 4;
          if (sheet[o + 3] > 0) { sheet[o] = rgb[0]; sheet[o + 1] = rgb[1]; sheet[o + 2] = rgb[2]; }
        }
      }
    },
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) drawCell(ctx, c, r);
  writePNG(name, SW, SH, sheet);
}

// ---- mummy (3 frames x 4 facings) ------------------------------------------
const WRAP = [216, 205, 165], WRAP_D = [150, 138, 105], EYE = [38, 28, 22], GLOW = [255, 150, 60];
makeSheet('mummy.png', 3, 4, 32, 48, (g, col, row) => {
  const dir = row, frame = col;
  const swing = frame === 1 ? 0 : (frame === 0 ? -1 : 1);
  g.rect(col, row, 12 + swing, 38, 16 + swing, 47, WRAP);
  g.rect(col, row, 16 - swing, 38, 20 - swing, 47, WRAP);
  g.ellipse(col, row, 16, 27, 8, 12, WRAP);
  if (dir === 0 || dir === 3) { g.rect(col, row, 4, 22, 9, 26, WRAP); g.rect(col, row, 23, 22, 28, 26, WRAP); }
  else if (dir === 1) g.rect(col, row, 3, 24, 12, 28, WRAP);
  else g.rect(col, row, 20, 24, 29, 28, WRAP);
  g.ellipse(col, row, 16, 11, 7, 8, WRAP);
  g.stripes(col, row, 4, 47, WRAP_D);
  if (dir === 0) { g.ellipse(col, row, 13, 11, 1.4, 1.8, EYE); g.ellipse(col, row, 19, 11, 1.4, 1.8, EYE); }
  else if (dir === 1) g.ellipse(col, row, 12, 11, 1.4, 1.8, GLOW);
  else if (dir === 2) g.ellipse(col, row, 20, 11, 1.4, 1.8, GLOW);
});

// ---- hero: a little explorer kid (4 cols: walk 0-2 + jump ; 4 facings) ------
const SKIN = [235, 190, 150], SHIRT = [70, 120, 210], SHORTS = [90, 70, 55];
const HAT = [200, 170, 110], HAT_D = [150, 120, 70], HAIR = [70, 50, 35], PUPIL = [40, 30, 28];
makeSheet('hero.png', 4, 4, 32, 48, (g, col, row) => {
  const dir = row;
  const jump = col === 3;
  const swing = jump ? 0 : (col === 0 ? -2 : (col === 2 ? 2 : 0));
  // legs (bent together when jumping)
  if (jump) {
    g.rect(col, row, 12, 36, 16, 43, SKIN); g.rect(col, row, 16, 36, 20, 43, SKIN);
  } else {
    g.rect(col, row, 12 + swing, 37, 16 + swing, 47, SKIN);
    g.rect(col, row, 16 - swing, 37, 20 - swing, 47, SKIN);
  }
  // torso (shirt)
  g.ellipse(col, row, 16, 28, 7, 9, SHIRT);
  g.rect(col, row, 10, 33, 22, 38, SHORTS);
  // arms — raised when jumping, else forward/side by facing
  if (jump) { g.rect(col, row, 6, 18, 11, 23, SKIN); g.rect(col, row, 21, 18, 26, 23, SKIN); }
  else if (dir === 0 || dir === 3) { g.rect(col, row, 7, 25, 11, 33, SKIN); g.rect(col, row, 21, 25, 25, 33, SKIN); }
  else if (dir === 1) g.rect(col, row, 6, 26, 13, 30, SKIN);
  else g.rect(col, row, 19, 26, 26, 30, SKIN);
  // head + hair + explorer hat
  g.ellipse(col, row, 16, 14, 6, 6.5, SKIN);
  if (dir === 3) g.ellipse(col, row, 16, 13, 6, 6, HAIR); // back of head = hair
  g.ellipse(col, row, 16, 9, 8, 3.5, HAT);      // hat brim
  g.ellipse(col, row, 16, 7, 5, 3.5, HAT_D);    // hat crown
  // face by facing
  if (dir === 0) { g.ellipse(col, row, 13, 14, 1.2, 1.6, PUPIL); g.ellipse(col, row, 19, 14, 1.2, 1.6, PUPIL); }
  else if (dir === 1) g.ellipse(col, row, 12, 14, 1.2, 1.6, PUPIL);
  else if (dir === 2) g.ellipse(col, row, 20, 14, 1.2, 1.6, PUPIL);
});
