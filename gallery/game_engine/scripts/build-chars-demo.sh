#!/usr/bin/env bash
# Compile + run the RGSP1 sprite-character demo (host bridge, no WASM toolchain).
#
# It hand-writes the exact RGSP1 bytes the Rust guest (wasm/rust_sprite_char)
# emits, drives the host bridge (scripting/wasm_sprite_runner.rgr), asserts the
# resolved draw commands, and renders lpc/output/characters_demo.png.
#
# Usage:
#   ./gallery/game_engine/scripts/build-chars-demo.sh
#   npm run engine:chars:demo

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/scripting/wasm_sprite_runner_demo.rgr"
OUT_DIR="$ROOT/tmp/lpc"
JS_FILE="$OUT_DIR/sprite_demo.js"

mkdir -p "$OUT_DIR"
cd "$ROOT"

echo "==> Ranger -> ES6 (wasm_sprite_runner_demo)"
RANGER_OUT="$(RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -es6 "$SOURCE" -nodecli -d="tmp/lpc" -o="sprite_demo.js" 2>&1)" || true
echo "$RANGER_OUT" | tail -5
if echo "$RANGER_OUT" | grep -qE '\[FAIL\]|ENOENT|Error:'; then
  echo "error: Ranger compile failed" >&2
  exit 1
fi

echo "==> run"
node "$JS_FILE"
