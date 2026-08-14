#!/usr/bin/env bash
# ==============================================================================
# pdf_writer/test/run_print.sh — front-end gates
# ==============================================================================
#   print_test  encoding honesty (UTF-8 decoding, WinAnsi) + print page boxes
#   attrs_test  the JSX attribute surface matches EVGElement's, so a property
#               cannot work on one path and be silently dropped on the other
#
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

status=0

run_out="$(node "$OUT/print_test.js" 2>&1)"
echo "$run_out" | grep -E "PASS |FAIL |passed="
if ! echo "$run_out" | grep -q "ALL PASS"; then
  status=1
fi

echo
echo "### pdf_writer/attrs"
if ! node bin/output.js -es6 gallery/pdf_writer/test/attrs_test.rgr \
      -d="$OUT" -o=attrs_test.js >"$OUT/attrs.log" 2>&1; then
  echo "  COMPILE FAIL attrs_test"
  tail -25 "$OUT/attrs.log"
  exit 1
fi
attrs_out="$(node "$OUT/attrs_test.js" 2>&1 | grep -v '^  Attr:')"
echo "$attrs_out" | grep -E "PASS |FAIL |passed="
if ! echo "$attrs_out" | grep -q "ALL PASS"; then
  status=1
fi

echo "=============================================================="
if [ "$status" -eq 0 ]; then
  echo "front-end ALL GREEN"
else
  echo "front-end FAILURES"
fi
exit "$status"
