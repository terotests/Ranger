#!/usr/bin/env bash
# ==============================================================================
# v2/evg/run.sh — compile+run the EVG layout-engine suite standalone.
# ==============================================================================
# Mirrors the central v2/tests/run.sh grep convention: the suite prints
# "  PASS/FAIL <name>" and a grep-able "ALL PASS" / "SOME FAILED" summary.
# Exits non-zero if the suite fails to compile or does not print "ALL PASS".
#
#   bash gallery/game_engine/v2/evg/run.sh
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"
OUT=".evg_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT
RGRC="node bin/output.js -es6"
SUITE="gallery/game_engine/v2/evg/evg_test"

echo "### evg/evg_test"
if ! $RGRC "${SUITE}.rgr" -d="$OUT" -o="evg_test.js" >"$OUT/evg_test.compile.log" 2>&1; then
  echo "  COMPILE FAIL evg/evg_test"
  tail -20 "$OUT/evg_test.compile.log"
  exit 1
fi

run_out="$(node "$OUT/evg_test.js" 2>&1)"
echo "$run_out" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed="

if ! echo "$run_out" | grep -q "ALL PASS"; then
  echo "=============================================================="
  echo "evg FAILURES — suite did not report ALL PASS"
  exit 1
fi

echo "=============================================================="
echo "evg ALL GREEN — evg_test passed"
exit 0
