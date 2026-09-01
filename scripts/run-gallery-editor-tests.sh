#!/usr/bin/env bash
# Every visual editor's own suite, in one command.
#
# Why a script rather than `npm run a && npm run b && …`: the compiler prints
# `[FAIL]` and still exits 0. A chain of npm scripts therefore runs the STALE
# build from the previous compile and reports a pass — which is the one way a
# CI job can be worse than no CI job. Each suite here fails on `[FAIL]` in the
# output, on a missing pass marker, and on a non-zero exit.
#
#   npm run gallery:editors:test
set -uo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"

SUITES=(
  book:test
  book:editor:test
  book:slides:test
  pptx:test
  pptx:editor:test
  pptx:text:test
  pptx:scene:check
  # The editor's shell and the strip that sits on top of it. These five ran
  # only when somebody remembered to run them, which meant the 84 assertions
  # holding the chrome's layout to the arithmetic it replaced were never a
  # gate at all — and `pptx:chrome:test` was added by the same work it was
  # meant to protect. Wired in here rather than anywhere else precisely
  # because of the note at the top of this file: run by hand through npm, a
  # `[FAIL]` from the compiler exits 0 and the stale build passes. That is not
  # hypothetical either; it happened while the icons were being converted, and
  # a suite reported ALL PASS against a build that had not compiled.
  pptx:chrome:test
  # A shape and its own outline must touch. The rasteriser used to put a
  # rectangle on the grid by truncating its position and its size separately,
  # which loses up to two pixels off the right and the bottom and none off the
  # left — a hairline of desk between a box and its border.
  pptx:seam:test
  pptx:seam:scan
  pptx:frame:test
  pptx:css:test
  pptx:a11y:test
  pptx:editor:host:test
  docx_viewer:test
  docx_viewer:app:test
  datagrid:test
  datagrid:edit:test
  office:history:test
  office:text:test
  office:metrics:test
  office:font:test
  office:style:test
  office:bidi:test
  office:geom:test
  office:shapes:test
  office:shapes:native
  office:color:test
  office:asset:test
  office:rtl:editors:test
  ui:test
  evg:trace:test
  # The toolbar's model, its metrics, and every outline in the icon catalogue.
  # The catalogue check is the one that earns its place: it walks all four
  # layers of all eighty icons and asserts each parses and stays on the
  # 24-grid, and it failed the first time it was run.
  evg:toolbar:test
  evg:overlay:test
  evg:style:test
  evg:timing:test
  evg:box:test
  evg:reconcile:test
  evg:component:test
  evg:stylecache:test
  evg:invalidate:test
  evg:adopt:check
  evg:scroll:check
  evg:tags:check
  evg:textbox:check
  evg:radius:check
  # How far a flex item may be shrunk: `min-width: auto` on a flex item is its
  # min-content size, not zero — and `overflow` puts it back to zero.
  evg:flexmin:check
  # The colour maths, against what the browser makes of hex and hsl().
  evg:color:check
  ui:sortable:motion
  ui:table:check
  ui:virtual:check
  ui:tree:dnd:check
  ui:tree:checkbox
  ui:timeline:check
  ui:resize:check
  ui:form:check
  ui:profile:check
  ui:dashboard:check
)

failed=()
for suite in "${SUITES[@]}"; do
  printf '==> %s\n' "$suite"
  out="$(npm run --silent "$suite" 2>&1)"
  status=$?
  bad=""
  if [ $status -ne 0 ]; then
    bad="exit $status"
  elif grep -q '\[FAIL\]' <<<"$out"; then
    bad="compiler reported [FAIL]"
  elif ! grep -qE 'ALL PASS|failed=0' <<<"$out"; then
    bad="no pass marker in output"
  fi
  if [ -n "$bad" ]; then
    failed+=("$suite ($bad)")
    printf '%s\n' "$out" | tail -30
    printf '    %s FAILED — %s\n' "$suite" "$bad"
  else
    printf '    %s ok\n' "$suite"
  fi
done

echo
if [ ${#failed[@]} -ne 0 ]; then
  echo "FAILED suites:"
  for f in "${failed[@]}"; do
    echo "  - $f"
  done
  exit 1
fi
echo "all ${#SUITES[@]} gallery editor suites passed"
