#!/usr/bin/env bash
# ==============================================================================
# pdf_writer/test/run_fonts.sh — font metric goldens + browser parity
# ==============================================================================
# Two gates, both about the same requirement: the same text, in the same font
# file, must measure to the same box everywhere.
#
#   1. font_metrics_test.rgr  locks advance widths / line breaks against the
#      real TTF files, so a change in the font path shows up as a number.
#   2. font_parity.js         renders a page in Chromium with the same faces
#      loaded via @font-face and checks EVG's boxes against the browser's.
#
#   bash gallery/pdf_writer/test/run_fonts.sh
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
OUT=".font_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT" gallery/pdf_writer/examples/_parity_check.html' EXIT

RGRC="node bin/output.js -es6"
status=0

echo "### pdf_writer/font_metrics"
if ! $RGRC gallery/pdf_writer/test/font_metrics_test.rgr -d="$OUT" -o=font_metrics.js \
      >"$OUT/compile.log" 2>&1; then
  echo "  COMPILE FAIL font_metrics_test"
  tail -25 "$OUT/compile.log"
  exit 1
fi

run_out="$(node "$OUT/font_metrics.js" 2>&1)"
echo "$run_out" | grep -E "PASS |FAIL |passed="
if ! echo "$run_out" | grep -q "ALL PASS"; then
  echo "=============================================================="
  echo "font metric goldens FAILED"
  status=1
fi

echo
echo "### pdf_writer/font_parity (EVG boxes vs Chromium)"
if [ ! -d node_modules/playwright-core ]; then
  echo "  SKIP: playwright-core not installed (npm i --no-save playwright-core)"
else
  if ! $RGRC -nodecli gallery/pdf_writer/src/tools/evg_html_tool.rgr \
        -d="$OUT" -o=evg_html_tool.js >"$OUT/html.log" 2>&1; then
    echo "  COMPILE FAIL evg_html_tool"
    tail -20 "$OUT/html.log"
    exit 1
  fi
  # Rendered next to the example so the @font-face relative URLs resolve.
  ( cd gallery/pdf_writer/examples \
    && node "$ROOT/$OUT/evg_html_tool.js" test_theme.tsx ./_parity_check.html \
         -css themes/classic.css -theme classic >/dev/null 2>&1 )
  if ! node gallery/pdf_writer/test/font_parity.js \
        gallery/pdf_writer/examples/_parity_check.html 1.0; then
    status=1
  fi
fi

echo "=============================================================="
if [ "$status" -eq 0 ]; then
  echo "fonts ALL GREEN"
else
  echo "fonts FAILURES"
fi
exit "$status"
