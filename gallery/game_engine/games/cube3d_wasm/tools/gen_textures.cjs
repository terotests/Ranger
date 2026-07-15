// Generate the committed texture assets (PPM P6) the resource loader loads.
//   node gallery/game_engine/games/cube3d_wasm/tools/gen_textures.cjs
// PPM is used so the host loader stays a ~15-line decode (no PNG dependency);
// a real project would ship PNGs and decode them in the same rg_res_load path.
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
    buf[o] = r & 255; buf[o + 1] = g & 255; buf[o + 2] = b & 255;
  }
  const header = Buffer.from(`P6\n${N} ${N}\n255\n`, 'ascii');
  fs.writeFileSync(path.join(OUT, name), Buffer.concat([header, buf]));
  console.log('wrote assets/' + name);
}

// Wooden crate: warm planks, seams, grain streaks, dark frame + cross brace.
writePPM('crate.ppm', (x, y) => {
  const border = x < 4 || y < 4 || x >= N - 4 || y >= N - 4;
  const plankSeam = (x % 21) < 2;            // vertical plank gaps
  const onDiag = Math.abs((x) - y) < 3 || Math.abs(x - (N - 1 - y)) < 3; // cross brace
  let r = 150, g = 96, b = 48;               // base wood
  const grain = Math.sin(x * 0.7 + y * 0.15) * 10 + ((x * 2654435761) & 15) - 7;
  r += grain; g += grain * 0.7; b += grain * 0.4;
  if (plankSeam) { r *= 0.55; g *= 0.55; b *= 0.55; }
  if (onDiag) { r = 120; g = 78; b = 40; }
  if (border) { r = 70; g = 44; b = 22; }
  return [r, g, b];
});

// Tile / checker for top & bottom: two stone tones with grout lines.
writePPM('tiles.ppm', (x, y) => {
  const cell = 16;
  const gx = x % cell, gy = y % cell;
  const grout = gx < 2 || gy < 2;
  const checker = (Math.floor(x / cell) + Math.floor(y / cell)) & 1;
  if (grout) return [60, 62, 68];
  return checker ? [180, 184, 192] : [138, 142, 150];
});
