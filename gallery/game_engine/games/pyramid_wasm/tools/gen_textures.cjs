// Generate the committed Pyramid textures (PPM P6, 64x64).
//   node gallery/game_engine/games/pyramid_wasm/tools/gen_textures.cjs
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
const h = (n) => ((n % 1) + 1) % 1;

// Sandstone blocks: warm tan ashlar with staggered courses + carved mortar.
writePPM('stone.ppm', (x, y) => {
  const courseH = 16, blockW = 21, mortar = 3;
  const row = Math.floor(y / courseH);
  const off = (row & 1) ? blockW / 2 : 0;
  const bx = (x + off) % blockW, by = y % courseH;
  if (by < mortar || bx < mortar) return [150, 122, 84]; // recessed mortar
  const id = (Math.floor((x + off) / blockW) * 7 + row * 13) & 15;
  const t = id - 8;
  // fine grain speckle
  const g = ((x * 131 + y * 57) & 15) - 7;
  return [208 + t + g, 180 + t * 0.8 + g, 128 + t * 0.6 + g];
});

// Desert sand ground: soft dunes with rippled speckle.
writePPM('sand.ppm', (x, y) => {
  const ripple = Math.sin(x * 0.4 + Math.sin(y * 0.13) * 2.0) * 10;
  const g = ((x * 193 + y * 71) & 15) - 7;
  return [222 + ripple + g, 196 + ripple * 0.8 + g, 140 + ripple * 0.5 + g];
});

// Gold summit / capstone: bright metallic with a highlight sweep.
writePPM('gold.ppm', (x, y) => {
  const cx = x - N / 2, cy = y - N / 2;
  const shine = Math.max(0, 1 - Math.hypot(cx, cy) / 40) * 70;
  const facet = ((x >> 3) + (y >> 3)) & 1 ? 12 : -12;
  const g = ((x * 97 + y * 41) & 7) - 3;
  return [230 + shine + facet + g, 190 + shine * 0.8 + facet + g, 70 + facet * 0.5 + g];
});

// Diamond / gem: faceted cyan crystal (bright so it reads as a pickup).
writePPM('gem.ppm', (x, y) => {
  const cx = x - N / 2, cy = y - N / 2;
  const r = Math.hypot(cx, cy);
  const ang = Math.atan2(cy, cx);
  const facet = Math.abs((h(ang / (Math.PI * 2) * 6) - 0.5)) * 2; // 6-fold facets
  const core = Math.max(0, 1 - r / 30);
  const v = 90 + facet * 90 + core * 90;
  return [v * 0.5, 200 + core * 40, 230 + facet * 20];
});

// Rolling boulder / bomb hazard: dark cracked rock (reads clearly as danger).
writePPM('ball.ppm', (x, y) => {
  const cx = x - N / 2, cy = y - N / 2;
  const r = Math.hypot(cx, cy);
  const shade = Math.max(0, 1 - r / 40); // rounded shading
  let v = 60 + shade * 60;
  const g = ((x * 151 + y * 89) & 15) - 7;
  v += g;
  // a few dark cracks
  const crack = Math.abs(Math.sin(x * 0.5) * 12 - (y % 24)) < 2 || Math.abs(x - y) < 2;
  if (crack) v -= 34;
  return [v + 14, v + 6, v]; // slightly warm dark grey
});

// Monster: mummy-wrap bandage look — off-white wraps with dark gaps + eyes.
writePPM('monster.ppm', (x, y) => {
  const band = Math.sin((x * 0.6 + y * 1.7)) * 0.5 + 0.5;
  let r = 190 + band * 40, g = 180 + band * 38, b = 150 + band * 30;
  if (band < 0.18) { r = 70; g = 66; b = 58; } // shadowed wrap gap
  // two glowing eyes near the top-centre
  const eyeY = 22;
  if (Math.abs(y - eyeY) < 4 && (Math.abs(x - 26) < 4 || Math.abs(x - 38) < 4)) {
    return [255, 120, 40];
  }
  return [r, g, b];
});
