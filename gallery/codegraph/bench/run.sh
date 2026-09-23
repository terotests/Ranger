#!/usr/bin/env bash
# Compile and run the CodeGraph analyzer bench as JavaScript or C++.
#
#   bash gallery/codegraph/bench/run.sh js  [path.rgr]
#   bash gallery/codegraph/bench/run.sh cpp [path.rgr]
#
# Default target is fixtures/calls.rgr (CI-sized). Pass RealTrainerDemo.rgr
# to profile the slow gallery open. CXX_OPT defaults to -O1 (the generated
# C++ includes VirtualCompiler and is several megabytes).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

HOST="${1:-js}"
if [[ $# -ge 1 ]]; then
  shift
fi
TARGET="${1:-gallery/codegraph/fixtures/calls.rgr}"

export RANGER_LIB="${RANGER_LIB:-$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr}"
SRC="./gallery/codegraph/bench/CodeGraphBench.rgr"

if [[ "$HOST" == "js" ]]; then
  echo "BENCH host=js"
  echo "BENCH target=$TARGET"
  bash scripts/rgr-suite.sh "$SRC" ./gallery/codegraph/bin CodeGraphBench.js "$TARGET"
  exit 0
fi

if [[ "$HOST" != "cpp" ]]; then
  echo "usage: run.sh js|cpp [file.rgr]" >&2
  exit 2
fi

# Ranger's -d joins onto cwd and drops a leading /, so this must be relative.
OUT_DIR="tmp/codegraph-bench"
CPP_FILE="$OUT_DIR/CodeGraphBench.cpp"
BIN_FILE="$OUT_DIR/codegraph_bench"
CXX_OPT="${CXX_OPT:--O1}"

mkdir -p "$OUT_DIR"

echo "BENCH host=cpp"
echo "BENCH target=$TARGET"
echo "==> Ranger -> C++"
# The compiler exits 0 on [FAIL]; rgr-suite is JS-only, so check the log.
rm -f "$CPP_FILE"
log=$(node --max-old-space-size=8192 dist/rgrc.js -l=cpp "$SRC" -nodecli \
  -d="$OUT_DIR" -o="CodeGraphBench.cpp" 2>&1) || true
echo "$log" | tail -20
if echo "$log" | grep -q 'Compilation FAILED'; then
  echo "$log" | grep -B1 -A3 "\[FAIL\]" | head -60
  echo "FAILED to compile $SRC to C++" >&2
  exit 1
fi
if [[ ! -f "$CPP_FILE" ]]; then
  echo "error: expected $CPP_FILE was not written" >&2
  exit 1
fi

cp "$ROOT/gallery/invaders/variant.hpp" "$OUT_DIR/variant.hpp"

CXX=""
if command -v g++ >/dev/null 2>&1; then
  CXX=g++
elif command -v clang++ >/dev/null 2>&1; then
  CXX=clang++
else
  echo "error: no C++ compiler (g++ / clang++)" >&2
  exit 1
fi

echo "==> $CXX $CXX_OPT -> $BIN_FILE"
# shellcheck disable=SC2086
"$CXX" $CXX_OPT -std=c++17 -pthread -I"$OUT_DIR" "$CPP_FILE" -o "$BIN_FILE"

echo "==> run $BIN_FILE $TARGET"
"$BIN_FILE" "$TARGET"
