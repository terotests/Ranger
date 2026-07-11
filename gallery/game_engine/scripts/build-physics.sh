#!/usr/bin/env bash
# Cannon.js Ranger port — compile + optional Node run.
#
# Usage (from Ranger repo root):
#   ./gallery/game_engine/scripts/build-physics.sh              # compile only
#   ./gallery/game_engine/scripts/build-physics.sh --run        # compile + Box tests
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/physics/src/cannon_test_runner.rgr"
OUT_DIR="$ROOT/tmp/physics"
JS_FILE="$OUT_DIR/cannon_test_runner.js"

RUN=false
if [[ "${1:-}" == "--run" ]]; then
  RUN=true
  shift
fi

mkdir -p "$OUT_DIR"

echo "==> Ranger -> ES6 (cannon_test_runner)"
cd "$ROOT"
RANGER_OUT="$(RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -es6 "$SOURCE" \
  -nodecli \
  -d="tmp/physics" \
  -o="cannon_test_runner.js" 2>&1)" || true
echo "$RANGER_OUT" | tail -20
if echo "$RANGER_OUT" | grep -qE '\[FAIL\]|ENOENT|Error:'; then
  echo "error: Ranger compile failed" >&2
  exit 1
fi

if [[ "$RUN" != true ]]; then
  echo "Built: $JS_FILE"
  echo "Run: npm run engine:physics:test"
  exit 0
fi

echo "==> Node (cannon Box tests)"
node "$JS_FILE"
