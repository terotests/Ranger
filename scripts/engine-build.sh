#!/usr/bin/env bash
# Build the ComponentEngine interpreter for every target the machine can build.
#
#   npm run jsengine:build            # es6 + cpp + rust, whatever is installed
#   TARGETS="cpp" npm run jsengine:build
#   npm run jsengine:check            # C++ / Rust toolchain report only
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

# shellcheck source=scripts/cpp-toolchain.sh
. "$ROOT/scripts/cpp-toolchain.sh"

TARGETS="${TARGETS:-cpp rust}"
BENCH_BUILD=gallery/game_engine/v2/interp/bench/native/build.sh
OCTANE_BUILD=gallery/game_engine/v2/interp/bench/zoo_octane/build-native.sh

say() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

have() { command -v "$1" >/dev/null 2>&1; }

# The toolchain each target needs, and whether we have it.
# For cpp, "g++ on PATH" is not enough on macOS (Apple clang + libc++ cannot
# build -cpp-single-thread). We still accept any C++ compiler and let the
# native build fall back to atomic shared_ptr when needed.
toolchain_for() {
  case "$1" in
    cpp)  echo g++ ;;
    rust) echo rustc ;;
    go)   echo go ;;
    *)    echo "" ;;
  esac
}

cpp_ready() {
  cpp_toolchain_resolve
}

say "toolchain check"
if printf '%s\n' " $TARGETS " | grep -q ' cpp '; then
  cpp_toolchain_report 0 || true
  echo
fi
if printf '%s\n' " $TARGETS " | grep -q ' rust '; then
  if have rustc; then
    echo "Rust:      $(command -v rustc)"
    echo "version:   $(rustc --version 2>/dev/null | head -n 1)"
  else
    echo "Rust:      no 'rustc' on PATH (cpp/es6 still build)"
  fi
  echo
fi

say "es6 engine (Node module)"
bash scripts/build-engine-module.sh
echo "built: gallery/game_engine/v2/interp/bin/engine_module.cjs"

BUILT=""
SKIPPED=""
NOTES=""
for T in $TARGETS; do
  if [ "$T" = "cpp" ]; then
    if ! cpp_ready; then
      echo
      echo "-- skipping cpp: no C++ compiler on PATH"
      echo "   macOS: brew install gcc   (Apple's g++ is clang/libc++ and is not enough for the fast path)"
      echo "   Linux: sudo apt install g++   /   sudo dnf install gcc-c++"
      SKIPPED="$SKIPPED $T"
      continue
    fi
    export CXX
    export CXX_SUPPORTS_SINGLE_THREAD
    if [ "$CXX_SUPPORTS_SINGLE_THREAD" != "1" ]; then
      NOTES="$NOTES cpp:built-without-cpp-single-thread"
    fi
  else
    TOOL="$(toolchain_for "$T")"
    if [ -n "$TOOL" ] && ! have "$TOOL"; then
      echo
      echo "-- skipping $T: no '$TOOL' on PATH"
      SKIPPED="$SKIPPED $T"
      continue
    fi
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
if [ -n "$NOTES" ]; then
  echo "notes:  $NOTES"
  echo "        (install Homebrew GCC for non-atomic rg_ptr — see scripts/cpp-toolchain.sh)"
fi
echo
echo "next:  npm run jsengine:bench        # this engine against Node (and qjs)"
echo "       npm run jsengine:conformance  # 1303 JS probes against Node's answers"
echo "-------------------------------------------------------------"
