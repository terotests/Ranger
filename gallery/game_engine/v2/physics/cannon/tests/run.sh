#!/usr/bin/env bash
# ==============================================================================
# physics/cannon/tests/run.sh — compile+run the aggregating Cannon parity suite.
# ==============================================================================
# Runs the single entry point (cannon_suite_test) that drives all 23 Cannon.js
# parity suites and prints the grep-able "ALL PASS" / "passed=N failed=0"
# banner. Modeled on v2/tests/run.sh. Exits non-zero if the suite fails to
# compile or does not report ALL PASS. Run from anywhere.
#
#   bash gallery/game_engine/v2/physics/cannon/tests/run.sh
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../../../../.." && pwd)"
cd "$ROOT"
OUT=".cannon_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT
RGRC="node bin/output.js -es6"
SUITE="gallery/game_engine/v2/physics/cannon/tests/cannon_suite_test"

echo "### ${SUITE}"
if ! $RGRC "${SUITE}.rgr" -d="$OUT" -o="cannon_suite_test.js" >"$OUT/compile.log" 2>&1; then
  echo "  COMPILE FAIL"
  grep -A3 'FAIL\]' "$OUT/compile.log" | head -12
  exit 1
fi

run_out="$(node "$OUT/cannon_suite_test.js" 2>&1)"
echo "$run_out" | grep -E "ALL PASS|SOME FAILED|passed=|^FAIL "
echo
if echo "$run_out" | grep -q "ALL PASS"; then
  echo "cannon ALL GREEN"
  exit 0
fi
echo "cannon FAILURES"
exit 1
