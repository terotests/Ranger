# web — staged browser publishing framework

**Copied from:** `gallery/game_engine/web/` (`node_modules/`, `dist/` excluded).

VFS + canvas host + build scripts for running the engine in the browser / Pages.

**Plan phase:** after v2 headless gates; point builds at v2 modules gradually.

## GPU demos (real WebGL, headless-verifiable)

The `web_tsx3d_gl_host` path runs a canonical Three.js `.tsx` scene through
ComponentEngine + ThreeTsxBridge + **ThreeGLBackend** — real WebGL on a
`<canvas>` (hardware Phong lighting, a 2048² PCF shadow map, ACES tone mapping),
no three.js JavaScript (the 3D engine is Ranger; the same backend compiles to
native GL too).

- **pinball on the GPU** — the same table the software v2 game draws (playfield
  art, pop bumpers, spinner, targets, flippers, chrome ball), rendered with real
  WebGL shadows + tone mapping:

  ```
  npm run engine:v2:pinball3d:build   # -> dist/pinball3d (open index.html)
  npm run engine:v2:pinball3d:shot    # build + headless-Chromium screenshot
  ```

  Scene: `guests/three/pinball_live.tsx` (canonical `import * as THREE from
  'three'`). Texture is single-sourced from the committed
  `games/pinball/playfield.png` and decoded in-browser.

## Unit / contract tests that gate this folder

- `node build.mjs` produces a runnable `dist` (CI later)
- VFS mount/read smoke in `src/vfs.js`
- `node build-pinball3d.mjs && node tests/browser_smoke.mjs dist/pinball3d`
  asserts the GPU pinball renders (non-blank canvas) in headless Chromium
