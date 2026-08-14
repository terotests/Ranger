#!/usr/bin/env bash
# ==============================================================================
# pdf_writer/test/run_print.sh — encoding honesty + print page boxes
# ==============================================================================
#   bash gallery/pdf_writer/test/run_print.sh
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
OUT=".print_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT

echo "### pdf_writer/print"
if ! node bin/output.js -es6 gallery/pdf_writer/test/print_test.rgr \
      -d="$OUT" -o=print_test.js >"$OUT/compile.log" 2>&1; then
  echo "  COMPILE FAIL print_test"
  tail -25 "$OUT/compile.log"
  exit 1
fi

run_out="$(node "$OUT/print_test.js" 2>&1)"
echo "$run_out" | grep -E "PASS |FAIL |passed="

if ! echo "$run_out" | grep -q "ALL PASS"; then
  echo "=============================================================="
  echo "print FAILURES"
  exit 1
fi

echo "=============================================================="
echo "print ALL GREEN"
exit 0
