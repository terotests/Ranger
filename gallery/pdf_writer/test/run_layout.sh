#!/usr/bin/env bash
# ==============================================================================
# pdf_writer/test/run_layout.sh — box-model parity against a browser
# ==============================================================================
# Padding, margins, gaps, nesting and background colour, checked against
# geometry Chromium recorded into fixtures/box_model.snapshot. Needs NO browser.
#
# Both sides build their tree from the same fixtures/box_model.fixtures, so the
# thing under test cannot drift between them.
#
# Browser-only, opt-in:
#   --verify-snapshot  re-measure in Chromium and confirm the snapshot still matches
#   --update-snapshot  re-record it
#
#   bash gallery/pdf_writer/test/run_layout.sh
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
OUT=".layout_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT

SNAPSHOT_JS="gallery/pdf_writer/test/browser_box_snapshot.js"

if [ "${1:-}" = "--update-snapshot" ]; then
  exec node "$SNAPSHOT_JS" --write
fi
if [ "${1:-}" = "--verify-snapshot" ]; then
  exec node "$SNAPSHOT_JS"
fi

echo "### pdf_writer/box_model (offline, from snapshot)"
if ! node bin/output.js -es6 gallery/pdf_writer/test/box_model_test.rgr \
      -d="$OUT" -o=box_model.js >"$OUT/compile.log" 2>&1; then
  echo "  COMPILE FAIL box_model_test"
  tail -25 "$OUT/compile.log"
  exit 1
fi

run_out="$(node "$OUT/box_model.js" 2>&1)"
echo "$run_out" | grep -E "FAIL |passed=|checked against"

if ! echo "$run_out" | grep -q "ALL PASS"; then
  echo "=============================================================="
  echo "box model FAILURES"
  exit 1
fi

echo "=============================================================="
echo "box model ALL GREEN"
exit 0
