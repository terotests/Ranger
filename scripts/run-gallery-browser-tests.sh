#!/usr/bin/env bash
# ==============================================================================
# run-gallery-browser-tests.sh — the suites that need a real browser
# ==============================================================================
#
# `run-gallery-editor-tests.sh` runs everything that is pure computation: the
# compiler, the layout, the controllers, the oracles. None of it opens a
# browser, which is what makes it fast enough to run on every change.
#
# These four do open one, and until this script existed they were run by hand —
# which is how `mod.EVGReconcile is not a constructor` survived on the demo page
# from the day it was written. The bundle BUILT, so the editor gate was happy;
# nothing loaded it.
#
#   bash scripts/run-gallery-browser-tests.sh
#
# Needs `npm run ui:conformance:install` once, for playwright and the Radix
# reference host.
set -u
cd "$(dirname "$0")/.."

SUITES=(
  # The page itself: does it load, and does every demo draw?
  ui:demo:page
  # One frame, looked at as pixels: a surface effect must draw OVER the page
  # and not instead of it. The page check cannot see this — the frame it would
  # have to catch is the first rippling one, and it is gone before a live page
  # can be photographed.
  ui:demo:frame
  # The two sides of the conformance harness, and axe over both trees.
  ui:conformance
  ui:a11y
  ui:demo:a11y
)

failed=()
for suite in "${SUITES[@]}"; do
  printf '==> %s\n' "$suite"
  out="$(npm run --silent "$suite" 2>&1)"
  status=$?
  bad=""
  if [ $status -ne 0 ]; then
    bad="exit $status"
  elif grep -qE 'RESULT FAIL|FAILURES|\[FAIL\]' <<<"$out"; then
    bad="reported a failure"
  fi
  if [ -n "$bad" ]; then
    failed+=("$suite")
    printf '    %s FAILED (%s)\n' "$suite" "$bad"
    tail -n 25 <<<"$out" | sed 's/^/      /'
  else
    printf '    %s ok\n' "$suite"
  fi
done

echo
if [ ${#failed[@]} -ne 0 ]; then
  echo "FAILED suites:"
  for f in "${failed[@]}"; do echo "  - $f"; done
  exit 1
fi
echo "all ${#SUITES[@]} gallery browser suites passed"
