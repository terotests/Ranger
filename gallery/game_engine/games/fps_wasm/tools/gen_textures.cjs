// Generate the committed FPS level textures (PPM P6).
//   node gallery/game_engine/games/fps_wasm/tools/gen_textures.cjs
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets');
fs.mkdirSync(OUT, { recursive: true });
const N = 64;

function writePPM(name, rgbFn) {
  const buf = Buffer.alloc(N * N * 3);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const [r, g, b] = rgbFn(x, y);
    const o = (y * N + x) * 3;
    buf[o] = Math.max(0, Math.min(255, r)) | 0;
    buf[o + 1] = Math.max(0, Math.min(255, g)) | 0;
    buf[o + 2] = Math.max(0, Math.min(255, b)) | 0;
  }
  fs.writeFileSync(path.join(OUT, name), Buffer.concat([Buffer.from(`P6\n${N} ${N}\n255\n`), buf]));
  console.log('wrote assets/' + name);
}

// Brick wall: staggered courses, mortar lines, per-brick tint.
writePPM('brick.ppm', (x, y) => {
  const courseH = 16, brickW = 32, mortar = 3;
  const row = Math.floor(y / courseH);
  const off = (row & 1) ? brickW / 2 : 0;
  const bx = (x + off) % brickW, by = y % courseH;
  if (by < mortar || bx < mortar) return [92, 88, 84]; // mortar
  const id = (Math.floor((x + off) / brickW) * 7 + row * 13) & 31;
  const t = id - 16;
  return [150 + t, 70 + t * 0.6, 55 + t * 0.4];
});

// Stone floor tiles.
writePPM('floor.ppm', (x, y) => {
  const cell = 16, gx = x % cell, gy = y % cell;
  if (gx < 2 || gy < 2) return [54, 56, 60];
  const checker = (Math.floor(x / cell) + Math.floor(y / cell)) & 1;
  const n = ((x * 131 + y * 57) & 15) - 7;
  return checker ? [120 + n, 122 + n, 128 + n] : [96 + n, 98 + n, 104 + n];
});

// Crate obstacle (reused idea from cube3d).
writePPM('crate.ppm', (x, y) => {
  const border = x < 4 || y < 4 || x >= N - 4 || y >= N - 4;
  const onDiag = Math.abs(x - y) < 3 || Math.abs(x - (N - 1 - y)) < 3;
  let r = 150, g = 96, b = 48;
  const grain = Math.sin(x * 0.7 + y * 0.15) * 10 + ((x * 2654435761) & 15) - 7;
  r += grain; g += grain * 0.7; b += grain * 0.4;
  if (onDiag) { r = 120; g = 78; b = 40; }
  if (border) { r = 70; g = 44; b = 22; }
  return [r, g, b];
});
