# tests/tools — diagnostic drivers (not gates)

Visual/diagnostic tools over the same generic host + host state the test
suites use. Nothing here is a pass/fail gate; `tests/run.sh` does not run
these.

## ylos2_screenshot

Renders a real frame of the v2 ylos2 guest (attract-driven, both panes) by
rasterising host pane state — each sprite as a flat-colour rect of its atlas
region's w×h. A diagnostic sibling of `RgSoftwareRenderer2D.present2D` (the
contract-pinned marker rasteriser); it samples **no texels**, because the
package carries only the `.atlas` manifest — region geometry exists host-side,
pixel data does not (see `../../QUESTIONS.md` Q1).

```sh
node bin/output.js -es6 gallery/game_engine/v2/tests/tools/ylos2_screenshot.rgr \
  -d=out -o=shot.js
node out/shot.js > dump.txt
node gallery/game_engine/v2/tests/tools/dump_to_png.js dump.txt shot.png 3
```

Output legend: orange = player (idle region), yellow = player (walk region),
green = platform region tick (32×8 — the guest maps each platform to ONE
region sprite today, so platform WIDTH is not renderer state), thin line =
pane divider.
