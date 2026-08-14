#!/usr/bin/env bash
# ==============================================================================
# pdf_writer/test/run_fonts.sh — print-correctness gates for text
# ==============================================================================
# All of these answer the same question: does the same text, in the same font
# file, measure to the same box everywhere?
#
# Default run needs NO browser:
#   font_metrics_test.rgr    advance widths, vertical metrics and wrap positions
#                            locked against the real TTFs
#   browser_parity_test.rgr  EVG checked against widths a browser recorded into
#                            a committed snapshot
#
# Browser-only, opt-in:
#   --verify-snapshot  re-measure in Chromium and confirm the snapshot still
#                      matches (catches the browser or the fonts changing)
#   --update-snapshot  re-record the snapshot
#   --page-parity      measure a fully rendered example page in Chromium
#
#   bash gallery/pdf_writer/test/run_fonts.sh
#   bash gallery/pdf_writer/test/run_fonts.sh --update-snapshot
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
OUT=".font_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT" gallery/pdf_writer/examples/_parity_check.html' EXIT

RGRC="node bin/output.js -es6"
SNAPSHOT_JS="gallery/pdf_writer/test/browser_parity_snapshot.js"
status=0

# --- browser-only modes -------------------------------------------------------

if [ "${1:-}" = "--update-snapshot" ]; then
  exec node "$SNAPSHOT_JS" --write
fi

if [ "${1:-}" = "--verify-snapshot" ]; then
  exec node "$SNAPSHOT_JS"
fi

# --- offline gates ------------------------------------------------------------

run_suite() {
  local name="$1" src="$2" out="$3"
  echo "### $name"
  if ! $RGRC "$src" -d="$OUT" -o="$out" >"$OUT/$out.log" 2>&1; then
    echo "  COMPILE FAIL $name"
    tail -25 "$OUT/$out.log"
    exit 1
  fi
  local run_out
  run_out="$(node "$OUT/$out" 2>&1 | grep -v '^FontManager:')"
  echo "$run_out" | grep -E "FAIL |passed=|checked against|worst delta|known gap|no kerning"
  if ! echo "$run_out" | grep -q "ALL PASS"; then
    status=1
  fi
}

run_suite "pdf_writer/font_metrics" \
  gallery/pdf_writer/test/font_metrics_test.rgr font_metrics.js
echo
run_suite "pdf_writer/browser_parity (offline, from snapshot)" \
  gallery/pdf_writer/test/browser_parity_test.rgr browser_parity.js

# --- optional live page check -------------------------------------------------

if [ "${1:-}" = "--page-parity" ]; then
  echo
  echo "### pdf_writer/page_parity (live Chromium)"
  if [ ! -d node_modules/playwright-core ]; then
    echo "  SKIP: playwright-core not installed"
  else
    if ! $RGRC -nodecli gallery/pdf_writer/src/tools/evg_html_tool.rgr \
          -d="$OUT" -o=evg_html_tool.js >"$OUT/html.log" 2>&1; then
      echo "  COMPILE FAIL evg_html_tool"
      tail -20 "$OUT/html.log"
      exit 1
    fi
    ( cd gallery/pdf_writer/examples \
      && node "$ROOT/$OUT/evg_html_tool.js" test_theme.tsx ./_parity_check.html \
           -css themes/classic.css -theme classic >/dev/null 2>&1 )
    # Page-level tolerance is looser than the fixture gate on purpose: the
    # browser kerns and EVG does not, so a rendered paragraph legitimately
    # differs by a fraction of a percent. See browser_parity_test.rgr.
    if ! node gallery/pdf_writer/test/font_parity.js \
          gallery/pdf_writer/examples/_parity_check.html 1.0; then
      status=1
    fi
  fi
fi

echo "=============================================================="
if [ "$status" -eq 0 ]; then
  echo "fonts ALL GREEN"
else
  echo "fonts FAILURES"
fi
exit "$status"
