#!/usr/bin/env bash
# End-to-end: fetch Khronos sample GLBs, load+render them with the native Ranger
# 3D asset path, and write PNGs to ./out. Run from anywhere.
#
#   bash gallery/game_engine/model3d/demo/render.sh
set -e

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../../.." && pwd)"
cd "$ROOT"

bash "$HERE/fetch_samples.sh"

OUT=".model3d_demo_out"
mkdir -p "$OUT" "$HERE/out"
trap 'rm -rf "$OUT"' EXIT

echo "compiling render_glb_demo -> ES6"
node bin/output.js -es6 "$HERE/render_glb_demo.rgr" -d="$OUT" -o=render.js >/dev/null 2>&1

render() {
  local glb="$1" ppm="$2" png="$3" w="$4" h="$5"
  node "$OUT/render.js" "$HERE/assets" "$glb" "$OUT" "$ppm" "$w" "$h" | grep "\[render\]"
  node "$HERE/ppm_to_png.cjs" "$OUT/$ppm" "$HERE/out/$png"
}

render Duck.glb        duck.ppm duck.png 512 512
render BoxTextured.glb box.ppm  box.png  480 480

echo "PNGs in $HERE/out/"
