#!/usr/bin/env bash
# ==============================================================================
# v2/ui/tests/run.sh — compile+run the UI layer suite standalone.
# ==============================================================================
# Mirrors the central v2/tests/run.sh grep convention: the suite prints
# "  PASS/FAIL <name>" and a grep-able "passed=X failed=Y" + "ALL PASS" /
# "SOME FAILED" summary. Exits non-zero if the suite fails to compile or does
# not print "ALL PASS".
#
#   bash gallery/game_engine/v2/ui/tests/run.sh
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
cd "$ROOT"
OUT=".ui_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT
RGRC="node bin/output.js -es6"
SUITE="gallery/game_engine/v2/ui/tests/UITest"

echo "### ui/tests/UITest"
if ! $RGRC "${SUITE}.rgr" -d="$OUT" -o="UITest.js" >"$OUT/UITest.compile.log" 2>&1; then
  echo "  COMPILE FAIL ui/tests/UITest"
  tail -20 "$OUT/UITest.compile.log"
  exit 1
fi

run_out="$(node "$OUT/UITest.js" 2>&1)"
echo "$run_out" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed="

if ! echo "$run_out" | grep -q "ALL PASS"; then
  echo "=============================================================="
  echo "ui FAILURES — suite did not report ALL PASS"
  exit 1
fi

echo "=============================================================="
echo "ui ALL GREEN — UITest passed"
exit 0
