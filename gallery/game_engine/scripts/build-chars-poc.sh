#!/usr/bin/env bash
# Compile + run the sprite test game headless (no gfx/SDL, no wasm toolchain).
#
# Drives the PoC core (scripting/sprite_char_poc.rgr) with a scripted input
# timeline, asserts the menu + walk/jump state, and dumps lpc/output/poc_*.png.
#
# Usage:
#   ./gallery/game_engine/scripts/build-chars-poc.sh
#   npm run engine:chars:poc

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/scripting/sprite_char_poc_demo.rgr"
OUT_DIR="$ROOT/tmp/lpc"
JS_FILE="$OUT_DIR/poc_demo.js"

mkdir -p "$OUT_DIR"
cd "$ROOT"

echo "==> Ranger -> ES6 (sprite_char_poc_demo)"
RANGER_OUT="$(RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -es6 "$SOURCE" -nodecli -d="tmp/lpc" -o="poc_demo.js" 2>&1)" || true
echo "$RANGER_OUT" | tail -5
if echo "$RANGER_OUT" | grep -qE '\[FAIL\]|ENOENT|Error:'; then
  echo "error: Ranger compile failed" >&2
  exit 1
fi

echo "==> run"
node "$JS_FILE"
