#!/usr/bin/env bash
# Headless textured screenshot of v2/games/ylos2 (no SDL window).
# Usage (from repo root): bash gallery/game_engine/v2/tests/tools/ylos2_screenshot.sh [out.png]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
cd "$ROOT"
OUT_DIR="${TMPDIR:-/tmp}/v2-ylos2-shot"
OUT_PNG="${1:-$OUT_DIR/ylos2.png}"
mkdir -p "$OUT_DIR" "$(dirname "$OUT_PNG")"

echo "==> compile ylos2_screenshot → ES6"
node bin/output.js -es6 \
  gallery/game_engine/v2/tests/tools/ylos2_screenshot.rgr \
  -d="$OUT_DIR" -o=ylos2_screenshot.js

echo "==> run → RGBSHOT dump"
node "$OUT_DIR/ylos2_screenshot.js" >"$OUT_DIR/shot.txt"

echo "==> dump → PNG"
node gallery/game_engine/v2/tests/tools/dump_rgb_to_png.js \
  "$OUT_DIR/shot.txt" "$OUT_PNG" 3

echo "wrote $OUT_PNG"
