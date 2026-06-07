#!/usr/bin/env bash
# Ranger Space Invaders -> LLVM IR -> native executable
#
# Usage: ./scripts/compile-invaders.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/gallery/invaders/invaders.rgr"
OUT_DIR="$ROOT/tmp/invaders-native"
LL_FILE="$OUT_DIR/invaders.ll"
BIN_FILE="$OUT_DIR/invaders"
RT_C="$ROOT/runtime/ranger_rt.c"

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
  -d="tmp/invaders-native" \
  -o="invaders.ll" \
  -target="$TARGET"

echo "==> 2/3 clang -> executable"
clang "$LL_FILE" "$RT_C" -o "$BIN_FILE" -Wno-override-module

echo "==> 3/3 Ready: $BIN_FILE"
echo "Run: $BIN_FILE"
