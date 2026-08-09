#!/usr/bin/env bash
# Run the 1303 runtime-conformance probes through every native engine that was
# built, comparing each answer against the one Node gives for the same source.
#
#   npm run engine:conformance
#
# Expectations are DERIVED, not written down: Node runs the same script, so a
# probe that is wrong about JavaScript fails here instead of quietly encoding a
# misunderstanding. The probes themselves live in tests/runtime-conformance.test.ts,
# which drives the es6 build in-process (that path is covered by `npm test`).
set -e
cd "$(dirname "$0")/.."

RUNNER=gallery/game_engine/v2/interp/bench/zoo_octane/conformance-native.cjs
TARGETS="${TARGETS:-cpp rust}"

FOUND=0
STATUS=0
for T in $TARGETS; do
  BIN="gallery/game_engine/v2/interp/bin/$T/octane_runner"
  if [ ! -x "$BIN" ]; then
    echo "-- skipping $T: no $BIN (run 'npm run engine:build')"
    continue
  fi
  FOUND=1
  printf '\n\033[1m== %s\033[0m\n' "$T conformance"
  node "$RUNNER" "$BIN" || STATUS=1
done

if [ "$FOUND" = "0" ]; then
  echo
  echo "no native engine built. Run:  npm run engine:build"
  exit 1
fi
exit $STATUS
