# climber — rendering sample (test game)

A **minimal** TSX game whose only job is to exercise the sampling software
renderer end-to-end at small resolution. It is authored exactly like a shipped
game — real `ranger:core` + `ranger:2d` imports, a `Game` class,
`runtime.start()`, driven by the host-owned tick — but implements a tiny subset:
a ground band, three platforms with real width, two textured characters on a
split screen, and a floating pickup.

Not a shipped game (it lives under `tests/`), so it is exempt from the
`games/` AGENTS rules; it exists to give the render gate a small, deterministic
scene with a small reference frame.

## Files

- `index.tsx` — the game (≈2 screens of code).
- `scene.atlas` — atlas manifest. Adds an `image <uri>` line over the ylos2
  format: it names the pixel source the texture is filled from.
- `scene.rgtx` — the pixel source, a documented palette-indexed ASCII raster
  (`rgtex w h` / `pal idx rrggbb aa` / `row <hexchars>`). Small, human-authorable,
  no PNG decoder; the real asset pipeline replaces the format later behind the
  same texture pixel store. **Original placeholder art** — the point is that the
  backend samples real texels, not the art itself.

## What it proves

Gated by `tests/render/textured_render_test`: the produced framebuffer is a real
picture — sky clear, full-width ground (sprite **size**, not a marker), edge-vs-
grass **per-texel** sampling, characters drawn from **package pixel data**,
painter **z-order**, and split-screen from two cameras over one scene.

## Look at it

```sh
node bin/output.js -es6 gallery/game_engine/v2/tests/tools/climber_shot.rgr -d=out -o=cshot.js
node out/cshot.js > c.txt
node gallery/game_engine/v2/tests/tools/dump_rgb_to_png.js c.txt climber.png 4
```
