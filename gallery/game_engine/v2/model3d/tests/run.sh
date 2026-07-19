#!/usr/bin/env bash
# ==============================================================================
# v2/model3d/tests/run.sh — compile the model3d suites to ES6 and run them.
# ==============================================================================
# Runs the single aggregating entry point (model3d_suite_test), which invokes
# every model3d suite and prints the grep-able banner CI expects:
#
#   == model3d suite summary ==
#   passed=N failed=0
#   ALL PASS            (or SOME FAILED)
#
# Each suite also runs standalone (its own main prints ALL PASS). Run from
# anywhere. Exit code is non-zero if compilation fails or any check fails.
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
cd "$ROOT"
OUT=".model3d_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT
RGRC="node bin/output.js -es6"
SUITE_DIR="gallery/game_engine/v2/model3d/tests"

FAILED=0

# run_suite <basename-without-.rgr>
run_suite() {
  local name="$1"
  echo "### ${name}"
  if ! $RGRC "${SUITE_DIR}/${name}.rgr" -d="$OUT" -o="${name}.js" >"$OUT/${name}.compile.log" 2>&1; then
    echo "  COMPILE FAIL ${name}"
    grep -A3 'FAIL\]' "$OUT/${name}.compile.log" | head -12
    FAILED=1
    echo
    return
  fi
  local run_out
  run_out="$(node "$OUT/${name}.js" 2>&1)"
  echo "$run_out" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed="
  if ! echo "$run_out" | grep -q "ALL PASS"; then
    FAILED=1
  fi
  if echo "$run_out" | grep -q "SOME FAILED"; then
    FAILED=1
  fi
  echo
}

# Single aggregating entry point — runs all five model3d suites.
run_suite model3d_suite_test

if [ "$FAILED" -eq 0 ]; then
  echo "model3d ALL GREEN"
  exit 0
fi
echo "model3d FAILURES"
exit 1
