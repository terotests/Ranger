#!/usr/bin/env node
// dump_rgb_to_png.js — convert an RGBSHOT dump (0xRRGGBB hex per pixel) to PNG.
// Usage: node dump_rgb_to_png.js <dump.txt> <out.png> [scale]
"use strict";
const fs = require("fs");
const zlib = require("zlib");

function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function writePng(path, w, h, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const row = y * (1 + w * 3);
    raw[row] = 0;
    rgb.copy(raw, row + 1, y * w * 3, (y + 1) * w * 3);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(path, png);
}

const [, , inPath, outPath, scaleArg] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: node dump_rgb_to_png.js <dump.txt> <out.png> [scale]");
  process.exit(1);
}
const scale = Math.max(1, parseInt(scaleArg || "4", 10));
const lines = fs.readFileSync(inPath, "utf8").split(/\r?\n/);
const hdrIdx = lines.findIndex((l) => l.startsWith("RGBSHOT "));
if (hdrIdx < 0) { console.error("no RGBSHOT header"); process.exit(1); }
const [, wStr, hStr] = lines[hdrIdx].split(" ");
const w = parseInt(wStr, 10), h = parseInt(hStr, 10);
const rows = lines.slice(hdrIdx + 1, hdrIdx + 1 + h);
const W = w * scale, H = h * scale;
const rgb = Buffer.alloc(W * H * 3);
for (let y = 0; y < h; y++) {
  const row = rows[y] || "";
  for (let x = 0; x < w; x++) {
    const hexv = row.substr(x * 6, 6);
    const val = parseInt(hexv, 16) || 0;
    const r = (val >> 16) & 0xff, g = (val >> 8) & 0xff, b = val & 0xff;
    for (let dy = 0; dy < scale; dy++) {
      for (let dx = 0; dx < scale; dx++) {
        const o = ((y * scale + dy) * W + x * scale + dx) * 3;
        rgb[o] = r; rgb[o + 1] = g; rgb[o + 2] = b;
      }
    }
  }
}
writePng(outPath, W, H, rgb);
console.log(`${outPath}: ${W}x${H} (scale ${scale})`);
