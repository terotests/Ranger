#!/usr/bin/env bash
# ==============================================================================
# pdf_writer/test/run_vector.sh — vector geometry means the same thing everywhere
# ==============================================================================
# PLAN_VECTOR_IR.md Stage 0. Two gates:
#
#   vector_viewbox  the viewBox transform against the SVG rule worked out by
#                   hand, AND against Chromium's own implementation recorded in
#                   fixtures/viewbox.snapshot
#   renderer parity the PDF and HTML renderers actually USE that transform, on
#                   the same document, end to end
#
# The second gate is the one that would have caught the original defect: the
# unit tests can be perfectly green while a renderer quietly keeps its own
# geometry, which is exactly the state this work started from.
#
# Browser-only, opt-in:
#   --verify-snapshot  recompute the transforms in Chromium and confirm the
#                      snapshot still matches
#   --update-snapshot  re-record it
#
#   bash gallery/pdf_writer/test/run_vector.sh
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
OUT=".vector_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT

SNAPSHOT_JS="gallery/pdf_writer/test/browser_viewbox_snapshot.js"

if [ "${1:-}" = "--update-snapshot" ]; then
  exec node "$SNAPSHOT_JS" --write
fi
if [ "${1:-}" = "--verify-snapshot" ]; then
  exec node "$SNAPSHOT_JS"
fi

status=0

echo "### pdf_writer/vector_viewbox (offline, spec + browser snapshot)"
if ! node bin/output.js -es6 gallery/pdf_writer/test/vector_viewbox_test.rgr \
      -d="$OUT" -o=vector_viewbox_test.js >"$OUT/viewbox.log" 2>&1; then
  echo "  COMPILE FAIL vector_viewbox_test"
  tail -25 "$OUT/viewbox.log"
  exit 1
fi

vb_out="$(node "$OUT/vector_viewbox_test.js" 2>&1)"
echo "$vb_out" | grep -E "FAIL |passed=|checked against"
if ! echo "$vb_out" | grep -q "ALL PASS"; then
  status=1
fi

# ------------------------------------------------------------------------------
# End-to-end: the renderers agree with the shared transform, and with each other
# ------------------------------------------------------------------------------
# Every expected number below is derived from the SVG rule in the fixture's own
# comments, not read off the output. If a renderer goes back to fitting the ink
# bounding box, or to its own idea of a quadratic curve, these stop matching.

echo
echo "### pdf_writer/vector_renderers (end to end)"

FIXTURE="gallery/pdf_writer/test/fixtures/vector_paths.tsx"

for tool in pdf html; do
  if ! node bin/output.js -es6 -nodecli "gallery/pdf_writer/src/tools/evg_${tool}_tool.rgr" \
        -d="$OUT" -o="${tool}_tool.js" >"$OUT/${tool}.log" 2>&1; then
    echo "  COMPILE FAIL evg_${tool}_tool"
    tail -25 "$OUT/${tool}.log"
    exit 1
  fi
done

node "$OUT/pdf_tool.js" "$FIXTURE" "$OUT/vector.pdf" >"$OUT/pdf_run.log" 2>&1
node "$OUT/html_tool.js" "$FIXTURE" "$OUT/vector.html" >"$OUT/html_run.log" 2>&1

check() {
  local label="$1" file="$2" needle="$3"
  if grep -qF -- "$needle" "$file"; then
    echo "  PASS $label"
  else
    echo "  FAIL $label"
    echo "       expected to find: $needle"
    status=1
  fi
}

if [ ! -s "$OUT/vector.pdf" ]; then
  echo "  FAIL the PDF was not produced"
  tail -15 "$OUT/pdf_run.log"
  status=1
else
  # Synthesised viewBox "10 10 30 30" into 60x60: uniform scale 2, and the
  # origin shift -minX*2 = -20 on both axes.
  check "PDF: star uses the synthesised viewBox transform" "$OUT/vector.pdf" "2 0 0 2 -20 -20 cm"
  # Non-square box: meet picks 0.6, and centres the 30pt of horizontal slack.
  # A stretched fit would emit "1.2 0 0 0.6".
  check "PDF: quad letterboxes instead of stretching" "$OUT/vector.pdf" "0.6 0 0 0.6 15 0 cm"
  # Explicit viewBox 0 0 24 24 into 48x48.
  check "PDF: explicit viewBox scales cleanly" "$OUT/vector.pdf" "2 0 0 2 0 0 cm"
  # Q 50,0 50,50 from (0,0), elevated exactly:
  #   C1 = P0 + 2/3(C - P0) = (33.333, 0)
  #   C2 = P3 + 2/3(C - P3) = (50, 16.667)
  # The old code emitted the control point twice, i.e. "50 0 50 0 50 50 c".
  check "PDF: quadratic is elevated, not duplicated" "$OUT/vector.pdf" "33.33333333333333 0 50 16.66666666666667 50 50 c"
fi

if [ ! -s "$OUT/vector.html" ]; then
  echo "  FAIL the HTML was not produced"
  tail -15 "$OUT/html_run.log"
  status=1
else
  # The browser must be handed the SAME viewBox the PDF resolved against —
  # including the synthesised one, which HTML used to omit entirely and so drew
  # at 1:1 while PDF fitted.
  check "HTML: star carries the synthesised viewBox" "$OUT/vector.html" 'viewBox="10 10 30 30"'
  check "HTML: quad carries the synthesised viewBox" "$OUT/vector.html" 'viewBox="0 0 50 50"'
  check "HTML: explicit viewBox is passed through" "$OUT/vector.html" 'viewBox="0 0 24 24"'
fi

echo "=============================================================="
if [ "$status" -eq 0 ]; then
  echo "vector ALL GREEN"
else
  echo "vector FAILURES"
fi
exit "$status"
