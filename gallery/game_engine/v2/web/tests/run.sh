#!/usr/bin/env bash
# ==============================================================================
# v2/web/tests/run.sh — compile+run the web soft-render smoke suite standalone.
# ==============================================================================
# Mirrors the central v2/tests/run.sh grep convention: the suite prints
# "  PASS/FAIL <name>" and a grep-able "passed=X failed=Y" + "ALL PASS" /
# "SOME FAILED" summary. Exits non-zero if the suite fails to compile or does
# not print "ALL PASS".
#
#   bash gallery/game_engine/v2/web/tests/run.sh
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
cd "$ROOT"
OUT=".web_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT
RGRC="node bin/output.js -es6"
SUITE="gallery/game_engine/v2/web/tests/web_smoke_test"

echo "### web/tests/web_smoke_test"
if ! $RGRC "${SUITE}.rgr" -d="$OUT" -o="web_smoke_test.js" >"$OUT/web_smoke_test.compile.log" 2>&1; then
  echo "  COMPILE FAIL web/tests/web_smoke_test"
  tail -20 "$OUT/web_smoke_test.compile.log"
  exit 1
fi
if ! grep -q "\[OK\]" "$OUT/web_smoke_test.compile.log"; then
  echo "  COMPILE FAIL web/tests/web_smoke_test"
  tail -20 "$OUT/web_smoke_test.compile.log"
  exit 1
fi

run_out="$(node "$OUT/web_smoke_test.js" 2>&1)"
echo "$run_out" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed="

if ! echo "$run_out" | grep -q "ALL PASS"; then
  echo "=============================================================="
  echo "web FAILURES — suite did not report ALL PASS"
  exit 1
fi

echo "=============================================================="
echo "web ALL GREEN — web_smoke_test passed"
exit 0
