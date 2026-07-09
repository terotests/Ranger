#!/usr/bin/env bash
# Ranger Game Engine base: pong.rgr -> LLVM IR -> native executable.
#
# Uses the LLVM backend + the C runtime (runtime/ranger_rt.c), which is the
# recommended path for the Raspberry Pi on-device build (smallest binary, no
# external dependencies). See gallery/game_engine/README.md.
#
# Usage: ./gallery/game_engine/scripts/build-native.sh [--run]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/pong.rgr"
OUT_DIR="$ROOT/tmp/pong-native"
LL_FILE="$OUT_DIR/pong.ll"
BIN_FILE="$OUT_DIR/pong"
RT_C="$ROOT/runtime/ranger_rt.c"
MEM_C="$ROOT/runtime/ranger_mem.c"

mkdir -p "$OUT_DIR"

if [[ "$(uname -s)" == "Darwin" ]]; then
  if [[ "$(uname -m)" == "arm64" ]]; then
    TARGET="arm64-apple-macos"
  else
    TARGET="x86_64-apple-macos"
  fi
else
  TARGET="native-linux-gnu"
fi

echo "==> Target: $TARGET"
echo "==> 1/3 Ranger -> LLVM IR"
cd "$ROOT"
RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=llvm "$SOURCE" \
  -nodecli \
  -d="tmp/pong-native" \
  -o="pong.ll" \
  -target="$TARGET"

echo "==> 2/3 clang -> executable"
clang "$LL_FILE" "$RT_C" "$MEM_C" -o "$BIN_FILE" -Wno-override-module

echo "==> 3/3 Ready: $BIN_FILE"

if [[ "${1:-}" == "--run" ]]; then
  echo "==> Running (W/S move, Q quit)"
  "$BIN_FILE"
else
  echo "Run: $BIN_FILE"
fi
