#!/usr/bin/env bash
# LPC spritesheet compose — Ranger compile + Node run (no JS compositor in lpc/).
#
# Usage (from Ranger repo root):
#   ./gallery/game_engine/scripts/build-lpc.sh              # compile only
#   ./gallery/game_engine/scripts/build-lpc.sh --run        # compile + default male
#   ./gallery/game_engine/scripts/build-lpc.sh --run female gallery/game_engine/lpc/output/female.png
#
# Environment:
#   LPC_ROOT  — path to Universal-LPC-Spritesheet-Character-Generator (optional)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/lpc/src/lpc_compose_runner.rgr"
OUT_DIR="$ROOT/tmp/lpc"
JS_FILE="$OUT_DIR/lpc_compose_runner.js"
DEFAULT_LPC_ROOT="${LPC_ROOT:-$ROOT/../Universal-LPC-Spritesheet-Character-Generator}"
EMBEDDED_PACK="$ROOT/gallery/game_engine/lpc/pack/demo-male-walk"

RUN=false
if [[ "${1:-}" == "--run" ]]; then
  RUN=true
  shift
fi

mkdir -p "$OUT_DIR"

echo "==> Ranger -> ES6 (lpc_compose_runner)"
cd "$ROOT"
RANGER_OUT="$(RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -es6 "$SOURCE" \
  -nodecli \
  -d="tmp/lpc" \
  -o="lpc_compose_runner.js" 2>&1)" || true
echo "$RANGER_OUT" | tail -15
if echo "$RANGER_OUT" | grep -qE '\[FAIL\]|ENOENT|Error:'; then
  echo "error: Ranger compile failed" >&2
  exit 1
fi

if [[ "$RUN" != true ]]; then
  echo "Built: $JS_FILE"
  echo "Run: npm run engine:lpc:run"
  exit 0
fi

BODY_TYPE="${1:-male}"
OUTPUT_PNG="${2:-gallery/game_engine/lpc/output/compose.png}"

if [[ -n "${3:-}" ]]; then
  LPC_ROOT_ARG="$3"
elif [[ -n "${LPC_ROOT:-}" ]]; then
  LPC_ROOT_ARG="$LPC_ROOT"
elif [[ -d "$DEFAULT_LPC_ROOT/spritesheets" ]]; then
  LPC_ROOT_ARG="$DEFAULT_LPC_ROOT"
elif [[ -d "$EMBEDDED_PACK/spritesheets" ]]; then
  LPC_ROOT_ARG="$EMBEDDED_PACK"
  echo "==> Using embedded LPC pack: demo-male-walk"
else
  echo "error: no LPC assets found." >&2
  echo "  Clone Universal-LPC-Spritesheet-Character-Generator as sibling, or" >&2
  echo "  set LPC_ROOT / use embedded pack at $EMBEDDED_PACK" >&2
  exit 1
fi

if [[ ! -d "$LPC_ROOT_ARG/spritesheets" ]]; then
  echo "error: spritesheets/ missing under: $LPC_ROOT_ARG" >&2
  exit 1
fi

mkdir -p "$(dirname "$ROOT/$OUTPUT_PNG")"

echo "==> Run compose: body=$BODY_TYPE assets=$LPC_ROOT_ARG -> $OUTPUT_PNG"
cd "$ROOT"
node "$JS_FILE" "$BODY_TYPE" "$OUTPUT_PNG" "$LPC_ROOT_ARG"
