#!/usr/bin/env bash
# ==============================================================================
# pdf_writer/test/run_vector.sh — vector geometry means the same thing everywhere
# ==============================================================================
# PLAN_VECTOR_IR.md Stages 0-3. Five gates:
#
#   path_parser     the SVG 1.1 §8.3 path grammar: every command letter,
#                   implicit repetition, S/T reflection, arcs, and the spec's
#                   own error-handling rule
#   vector_viewbox  the viewBox transform against the SVG rule worked out by
#                   hand, AND against Chromium's own implementation recorded in
#                   fixtures/viewbox.snapshot
#   vector_shapes   rect/circle/ellipse/line/polyline/polygon as paths, checked
#                   geometrically and round-tripped through the parser
#   vector_raster   contours and the shared scanline rasterizer: fill rules,
#                   holes, and glyph rendering unchanged by the extraction
#   svg_parser      a whole SVG document read into the vector layer: shapes,
#                   groups, inherited paint, baked transforms, <use>, and — half
#                   the gate — that everything outside the profile is REPORTED
#   renderer parity the PDF and HTML renderers actually USE that transform, on
#                   the same document, end to end, for a hand-written <Path> and
#                   for an imported document alike
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

echo "### pdf_writer/path_parser (SVG 1.1 §8.3 grammar)"
if ! node bin/output.js -es6 gallery/pdf_writer/test/path_parser_test.rgr \
      -d="$OUT" -o=path_parser_test.js >"$OUT/parser.log" 2>&1; then
  echo "  COMPILE FAIL path_parser_test"
  tail -25 "$OUT/parser.log"
  exit 1
fi

pp_out="$(node "$OUT/path_parser_test.js" 2>&1)"
echo "$pp_out" | grep -E "FAIL |passed="
if ! echo "$pp_out" | grep -q "ALL PASS"; then
  status=1
fi

echo
echo "### pdf_writer/path_builder (building a path from data)"
if ! node bin/output.js -es6 gallery/pdf_writer/test/path_builder_test.rgr \
      -d="$OUT" -o=path_builder_test.js >"$OUT/builder.log" 2>&1; then
  echo "  COMPILE FAIL path_builder_test"
  tail -25 "$OUT/builder.log"
  exit 1
fi

pb_out="$(node "$OUT/path_builder_test.js" 2>&1)"
echo "$pb_out" | grep -E "FAIL |passed="
if ! echo "$pb_out" | grep -q "ALL PASS"; then
  status=1
fi

echo
echo "### pdf_writer/vector_shapes (basic shapes as paths)"
if ! node bin/output.js -es6 gallery/pdf_writer/test/vector_shapes_test.rgr \
      -d="$OUT" -o=vector_shapes_test.js >"$OUT/shapes.log" 2>&1; then
  echo "  COMPILE FAIL vector_shapes_test"
  tail -25 "$OUT/shapes.log"
  exit 1
fi

vs_out="$(node "$OUT/vector_shapes_test.js" 2>&1)"
echo "$vs_out" | grep -E "FAIL |passed="
if ! echo "$vs_out" | grep -q "ALL PASS"; then
  status=1
fi

echo
echo "### pdf_writer/vector_raster (contours, fill rules, holes)"
if ! node bin/output.js -es6 gallery/pdf_writer/test/vector_raster_test.rgr \
      -d="$OUT" -o=vector_raster_test.js >"$OUT/raster.log" 2>&1; then
  echo "  COMPILE FAIL vector_raster_test"
  tail -25 "$OUT/raster.log"
  exit 1
fi

vr_out="$(node "$OUT/vector_raster_test.js" 2>&1)"
echo "$vr_out" | grep -E "FAIL |passed="
if ! echo "$vr_out" | grep -q "ALL PASS"; then
  status=1
fi

echo
echo "### pdf_writer/svg_parser (a document, read into the vector layer)"
if ! node bin/output.js -es6 gallery/pdf_writer/test/svg_parser_test.rgr \
      -d="$OUT" -o=svg_parser_test.js >"$OUT/svgparser.log" 2>&1; then
  echo "  COMPILE FAIL svg_parser_test"
  tail -25 "$OUT/svgparser.log"
  exit 1
fi

sp_out="$(node "$OUT/svg_parser_test.js" 2>&1)"
echo "$sp_out" | grep -E "FAIL |passed="
if ! echo "$sp_out" | grep -q "ALL PASS"; then
  status=1
fi

echo
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

for tool in pdf html png; do
  if ! node bin/output.js -es6 -nodecli "gallery/pdf_writer/src/tools/evg_${tool}_tool.rgr" \
        -d="$OUT" -o="${tool}_tool.js" >"$OUT/${tool}.log" 2>&1; then
    echo "  COMPILE FAIL evg_${tool}_tool"
    tail -25 "$OUT/${tool}.log"
    exit 1
  fi
done

node "$OUT/pdf_tool.js" "$FIXTURE" "$OUT/vector.pdf" >"$OUT/pdf_run.log" 2>&1
node "$OUT/html_tool.js" "$FIXTURE" "$OUT/vector.html" >"$OUT/html_run.log" 2>&1
# -debug because the check below reads the per-element render trace out of the
# log; it used to be printed unconditionally, which made the tool unusable from
# anywhere that is not a terminal.
node "$OUT/png_tool.js" "$FIXTURE" "$OUT/vector.png" -debug >"$OUT/png_run.log" 2>&1

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
  # A dash pattern goes through PDF's own dash operator.
  check "PDF: the dash pattern reaches the dash operator" "$OUT/vector.pdf" "[6 3] 0 d"
  # A quarter turn: cos 90 is zero to within a float, sin 90 is one, so the
  # matrix reads 0 1 -1 0 with the translation that keeps the centre fixed.
  check "PDF: rotation emits a rotation matrix" "$OUT/vector.pdf" "0 1 -1 0 "
  # PDF real numbers have no exponential form, and cos 90 degrees is exactly
  # where to_string reaches for one. A viewer may reject the whole stream.
  if grep -qE "[0-9]e-?[0-9]+ " "$OUT/vector.pdf"; then
    echo "  FAIL PDF: exponential notation reached the content stream"
    status=1
  else
    echo "  PASS PDF: no exponential notation in the content stream"
  fi
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
  check "HTML: the dash pattern reaches the attribute" "$OUT/vector.html" 'stroke-dasharray="6 3"'
  # The rotated check mark. PDF emitted a matrix and the raster target turned
  # the shape on the rasterizer, while this renderer left it upright: it builds
  # the <svg> style itself rather than going through the builder that carries
  # `transform`, so the rotation never reached it.
  check "HTML: a rotated path is turned" "$OUT/vector.html" 'transform: rotate(90deg);'
  # A path with no fill is not filled. The fallback used to be `currentColor`,
  # the inherited TEXT colour, so a stroked-only path — a gridline, an axis, an
  # outlined check mark — came out as a solid block, while PDF and PNG, which
  # emit no fill operator without a fill colour, drew the outline asked for.
  check "HTML: a stroked path is not filled" "$OUT/vector.html" 'fill="none"'
  # Both children of the absolutely positioned card carry ITS offset off their
  # page coordinates: the path at page (210, 420) inside a card at (200, 400)
  # is emitted at (10, 20), not at (210, 420) inside an already-shifted box.
  check "HTML: a path inside an absolute parent is parent-relative" "$OUT/vector.html" 'left: 10px; top: 20px;'
  check "HTML: a label inside an absolute parent is parent-relative" "$OUT/vector.html" 'left: 10px; top: 50px;'
  if grep -qF 'left: 210px; top: 420px;' "$OUT/vector.html"; then
    echo "  FAIL HTML: a nested child kept its page coordinates"
    status=1
  else
    echo "  PASS HTML: no nested child kept its page coordinates"
  fi
fi

# The raster target used to have no path support at all: a <Path> that
# appeared in PDF and HTML was simply absent from the PNG (TODO_EVG "PNG 0.9").
if [ ! -s "$OUT/vector.png" ]; then
  echo "  FAIL the PNG was not produced"
  tail -15 "$OUT/png_run.log"
  status=1
else
  if grep -q "Render: path" "$OUT/png_run.log"; then
    echo "  PASS PNG: paths reach the raster renderer"
  else
    echo "  FAIL PNG: no path was rendered"
    status=1
  fi
fi

# ------------------------------------------------------------------------------
# End-to-end: an imported SVG document, in all three targets
# ------------------------------------------------------------------------------
# fixtures/imported.svg declares viewBox="0 0 24 24" and is drawn into a 48x48
# box and again into a 96x96 one, so the transforms are a clean 2 and a clean 4.
# The interesting assertions are the ones about geometry that had to be resolved
# on the way in: a fill inherited from a group, a circle inside translate(6,6),
# and a <use> of a definition that is drawn nowhere itself.

echo
echo "### pdf_writer/imported_svg (end to end)"

SVG_FIXTURE="gallery/pdf_writer/test/fixtures/imported_svg.tsx"

node "$OUT/pdf_tool.js" "$SVG_FIXTURE" "$OUT/imported.pdf" >"$OUT/imported_pdf.log" 2>&1
node "$OUT/html_tool.js" "$SVG_FIXTURE" "$OUT/imported.html" >"$OUT/imported_html.log" 2>&1
node "$OUT/png_tool.js" "$SVG_FIXTURE" "$OUT/imported.png" -debug >"$OUT/imported_png.log" 2>&1

if [ ! -s "$OUT/imported.pdf" ]; then
  echo "  FAIL the imported-SVG PDF was not produced"
  tail -15 "$OUT/imported_pdf.log"
  status=1
else
  check "PDF: the document's own viewBox fits its element box" "$OUT/imported.pdf" "2 0 0 2 0 0 cm"
  check "PDF: the same file at another size is just another scale" "$OUT/imported.pdf" "4 0 0 4 0 0 cm"
  # The frame path has no fill of its own and must inherit the group's blue.
  # Black here would mean inheritance was not resolved.
  check "PDF: a path inherits its group's fill" "$OUT/imported.pdf" "0 0 1 rg"
  # r=3 about the origin, inside translate(6,6): the outline starts at (9,6).
  # An unbaked transform would put it at (3,0).
  check "PDF: a group transform is baked into the geometry" "$OUT/imported.pdf" "9 6 m"
  # <use href="#pip" x="16" y="16"> — a definition drawn only where referenced.
  check "PDF: a <use> is drawn at its own offset" "$OUT/imported.pdf" "16 16 m"
  check "PDF: the <use> keeps its own fill" "$OUT/imported.pdf" "0 1 0 rg"
fi

if [ ! -s "$OUT/imported.html" ]; then
  echo "  FAIL the imported-SVG HTML was not produced"
  tail -15 "$OUT/imported_html.log"
  status=1
else
  check "HTML: the document's viewBox is emitted" "$OUT/imported.html" 'viewBox="0 0 24 24"'
  check "HTML: the inherited fill is resolved, not inherited again" "$OUT/imported.html" 'fill="rgb(0,0,255)"'
  check "HTML: the transformed circle is emitted already translated" "$OUT/imported.html" 'd="M9,6'
  check "HTML: the <use> is emitted at its offset" "$OUT/imported.html" 'd="M16,16'
  # The markup is NOT passed through: out of profile has to mean out of profile
  # in the browser too, or the HTML stops being a preview of what will print.
  if grep -qF '<text' "$OUT/imported.html"; then
    echo "  FAIL HTML: out-of-profile markup was passed through to the browser"
    status=1
  else
    echo "  PASS HTML: out-of-profile markup did not reach the browser"
  fi
fi

if [ ! -s "$OUT/imported.png" ]; then
  echo "  FAIL the imported-SVG PNG was not produced"
  tail -15 "$OUT/imported_png.log"
  status=1
else
  if grep -q "Render: path" "$OUT/imported_png.log"; then
    echo "  PASS PNG: the imported document reaches the raster renderer"
  else
    echo "  FAIL PNG: the imported document was not rendered"
    status=1
  fi
fi

# The half of the profile that is not geometry: a construct outside it must be
# nameable from the build log. A logo that loses its wordmark to an unsupported
# <text> should be diagnosable without opening the output.
for target in pdf html png; do
  if grep -q "SVG import: <text> is not supported" "$OUT/imported_${target}.log"; then
    echo "  PASS ${target}: the unsupported <text> is reported"
  else
    echo "  FAIL ${target}: the unsupported <text> was dropped in silence"
    status=1
  fi
done

echo "=============================================================="
if [ "$status" -eq 0 ]; then
  echo "vector ALL GREEN"
else
  echo "vector FAILURES"
fi
exit "$status"
