#!/usr/bin/env bash
# ==============================================================================
# v2/lpc/tests/run.sh — compile & run the lpc module's unit suites (Track A P0).
# ==============================================================================
# Mirrors the central v2/tests/run.sh compile+run+grep pattern: compile each
# suite to ES6, run it under Node, and require a grep-able "ALL PASS" line.
# Exits non-zero if any suite fails to compile or reports SOME FAILED.
#
#   bash gallery/game_engine/v2/lpc/tests/run.sh
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
cd "$ROOT"
OUT=".lpc_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT
RGRC="node bin/output.js -es6"
V2="gallery/game_engine/v2"

TOTAL_SUITES=0
FAILED_SUITES=0

# run_suite <relative-path-under-v2 without .rgr>
run_suite() {
  local rel="$1"
  local name
  name="$(basename "$rel")"
  TOTAL_SUITES=$((TOTAL_SUITES + 1))
  echo "### ${rel}"
  if ! $RGRC "${V2}/${rel}.rgr" -d="$OUT" -o="${name}.js" >"$OUT/${name}.compile.log" 2>&1; then
    echo "  COMPILE FAIL ${rel}"
    grep -A3 'FAIL\]' "$OUT/${name}.compile.log" | head -12
    FAILED_SUITES=$((FAILED_SUITES + 1))
    echo
    return
  fi
  local run_out
  run_out="$(node "$OUT/${name}.js" 2>&1)"
  echo "$run_out" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed="
  if ! echo "$run_out" | grep -q "ALL PASS"; then
    FAILED_SUITES=$((FAILED_SUITES + 1))
  fi
  echo
}

# ---- lpc suites --------------------------------------------------------------
run_suite lpc/tests/png_decoder_test

echo "=============================================================="
if [ "$FAILED_SUITES" -eq 0 ]; then
  echo "lpc ALL GREEN — ${TOTAL_SUITES}/${TOTAL_SUITES} suites passed"
  exit 0
fi
echo "lpc FAILURES — ${FAILED_SUITES}/${TOTAL_SUITES} suites failed"
exit 1
