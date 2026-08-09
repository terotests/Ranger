#!/usr/bin/env bash
# Build the ComponentEngine interpreter for every target the machine can build.
#
#   npm run jsengine:build            # es6 + cpp + rust, whatever is installed
#   TARGETS="cpp" npm run jsengine:build
#
# Each native target is skipped with a message when its toolchain is absent —
# the run is still a success, so this is safe in CI and on a laptop with only
# Node installed. The generated source is written either way.
#
# Produces:
#   gallery/game_engine/v2/interp/bin/engine_module.cjs   the es6 engine (Node module)
#   gallery/game_engine/v2/interp/bin/<t>/engine_bench    the benchmark binary
#   gallery/game_engine/v2/interp/bin/<t>/octane_runner   the conformance binary
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

TARGETS="${TARGETS:-cpp rust}"
BENCH_BUILD=gallery/game_engine/v2/interp/bench/native/build.sh
OCTANE_BUILD=gallery/game_engine/v2/interp/bench/zoo_octane/build-native.sh

say() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

have() { command -v "$1" >/dev/null 2>&1; }

# The toolchain each target needs, and whether we have it.
toolchain_for() {
  case "$1" in
    cpp)  echo g++ ;;
    rust) echo rustc ;;
    go)   echo go ;;
    *)    echo "" ;;
  esac
}

say "es6 engine (Node module)"
bash scripts/build-engine-module.sh
echo "built: gallery/game_engine/v2/interp/bin/engine_module.cjs"

BUILT=""
SKIPPED=""
for T in $TARGETS; do
  TOOL="$(toolchain_for "$T")"
  if [ -n "$TOOL" ] && ! have "$TOOL"; then
    echo
    echo "-- skipping $T: no '$TOOL' on PATH"
    SKIPPED="$SKIPPED $T"
    continue
  fi
  say "$T engine (benchmark binary)"
  TARGET="$T" bash "$BENCH_BUILD"
  say "$T engine (conformance binary)"
  TARGET="$T" bash "$OCTANE_BUILD"
  BUILT="$BUILT $T"
done

echo
echo "-------------------------------------------------------------"
echo "built:   es6$BUILT"
[ -n "$SKIPPED" ] && echo "skipped:$SKIPPED (toolchain not installed)"
echo
echo "next:  npm run jsengine:bench        # this engine against Node (and qjs)"
echo "       npm run jsengine:conformance  # 1303 JS probes against Node's answers"
echo "-------------------------------------------------------------"
