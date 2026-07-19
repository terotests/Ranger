#!/usr/bin/env bash
# ==============================================================================
# sprites/tests/run.sh — compile + run the sprites module unit suites.
# ==============================================================================
# Mirrors the central v2 driver: compile each suite to ES6, run under Node, and
# require a grep-able "ALL PASS" banner. Exits non-zero if any suite fails to
# compile or reports SOME FAILED. Run from anywhere.
#
#   bash gallery/game_engine/v2/sprites/tests/run.sh
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
cd "$ROOT"
OUT=".sprites_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT
RGRC="node bin/output.js -es6"
V2="gallery/game_engine/v2"

TOTAL=0
FAILED=0

run_suite() {
  local rel="$1"
  local name
  name="$(basename "$rel")"
  TOTAL=$((TOTAL + 1))
  echo "### ${rel}"
  if ! $RGRC "${V2}/${rel}.rgr" -d="$OUT" -o="${name}.js" >"$OUT/${name}.compile.log" 2>&1; then
    echo "  COMPILE FAIL ${rel}"
    grep -A3 'FAIL\]' "$OUT/${name}.compile.log" | head -12
    FAILED=$((FAILED + 1))
    echo
    return
  fi
  local run_out
  run_out="$(node "$OUT/${name}.js" 2>&1)"
  echo "$run_out" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed="
  if ! echo "$run_out" | grep -q "ALL PASS"; then
    FAILED=$((FAILED + 1))
  fi
  echo
}

# ---- sprite compositing (headless SoftCanvas + RgbaFastBlit + ImageBuffer) ---
run_suite sprites/tests/sprite_blit_test

echo "=============================================================="
if [ "$FAILED" -eq 0 ]; then
  echo "sprites ALL GREEN — ${TOTAL}/${TOTAL} suites passed"
  exit 0
fi
echo "sprites FAILURES — ${FAILED}/${TOTAL} suites failed"
exit 1
