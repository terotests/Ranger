// Sync the pyramid_wasm billboard sprite sheets from the repo's LPC pack.
//   node gallery/game_engine/games/pyramid_wasm/tools/gen_sprites.cjs
//
// These are Universal LPC Spritesheet walkcycles (64x64 frames, 9 cols x 4 rows;
// rows = up/left/down/right, col 0 = idle + cols 1-8 walk). Licensing follows
// the LPC pack under gallery/game_engine/lpc/ (CC-BY-SA / GPL, see that dir).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..'); // gallery/game_engine
const OUT = path.join(__dirname, '..', 'sprites');
fs.mkdirSync(OUT, { recursive: true });

const SHEETS = [
  // player: the LPC "hero" character
  { src: path.join(ROOT, 'lpc', 'pack', 'characters', 'hero', 'walk.png'), dst: 'hero.png' },
  // enemy: the LPC skeleton (already committed with ylos2)
  { src: path.join(ROOT, 'games', 'ylos2', 'assets', 'enemy_walk.png'), dst: 'mummy.png' },
];

for (const s of SHEETS) {
  fs.copyFileSync(s.src, path.join(OUT, s.dst));
  console.log('copied ' + path.relative(ROOT, s.src) + ' -> sprites/' + s.dst);
}
