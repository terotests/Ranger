# tests/tools — diagnostic drivers (not gates)

Visual/diagnostic tools over the same generic host + host state the test
suites use. Nothing here is a pass/fail gate; `tests/run.sh` does not run
these.

## ylos2_screenshot

Renders a real frame of the v2 ylos2 guest through the **sampling** backend
(`RgTexturedRenderer2D`) — LPC walk sheets + immediate environment — and
emits an `RGBSHOT` dump. Not an SDL window; for the windowed path see
[`../../TODO.md`](../../TODO.md) § SDL.

```sh
npm run engine:v2:shot:ylos2
# or: bash gallery/game_engine/v2/tests/tools/ylos2_screenshot.sh [out.png]
```

## climber_shot

Renders the `tests/render/samples/climber` game through the **sampling** backend
(`RgTexturedRenderer2D`) — real texels, sprite size (full-width ground/platforms),
painter z-order, facing flip, split-screen. Emits an `RGBSHOT` dump (0xRRGGBB
per pixel); `dump_rgb_to_png.js` turns it into a PNG.

```sh
node bin/output.js -es6 gallery/game_engine/v2/tests/tools/climber_shot.rgr -d=out -o=cshot.js
node out/cshot.js > c.txt
node gallery/game_engine/v2/tests/tools/dump_rgb_to_png.js c.txt climber.png 4
```

Unlike `ylos2_screenshot` (flat region-rects, because the ylos2 package carries
no pixel data), this is a true textured render: the climber package ships a
`.rgtx` image the texture store is filled from, and the backend samples it.
