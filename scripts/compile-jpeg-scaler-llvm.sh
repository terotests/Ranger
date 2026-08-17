#!/usr/bin/env bash
# Ranger jpeg_scaler -> LLVM IR -> native executable
#
# The binary decodes, scales and re-encodes real JPEGs, and its output is
# byte-identical to the JavaScript build. See
# gallery/pdf_writer/docs/JPEG_SCALER_LLVM.md
#
# Usage: ./scripts/compile-jpeg-scaler-llvm.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/gallery/pdf_writer/src/tools/jpeg_scaler.rgr"
OUT_DIR="$ROOT/tmp/jpeg-native"
LL_FILE="$OUT_DIR/jpeg_scaler.ll"
BIN_FILE="$OUT_DIR/jpeg_scaler"
DOC="$ROOT/gallery/pdf_writer/docs/JPEG_SCALER_LLVM.md"

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

if ! command -v clang >/dev/null 2>&1; then
  echo "error: clang not found" >&2
  exit 1
fi

if [[ ! -f "$ROOT/bin/output.js" ]]; then
  echo "error: compiler not built — run: npm run compile" >&2
  exit 1
fi

echo "==> Target: $TARGET"
echo "==> 1/3 Ranger -> LLVM IR"
cd "$ROOT"
RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=llvm "$SOURCE" \
  -nodecli \
  -d="tmp/jpeg-native" \
  -o="jpeg_scaler.ll" \
  -target="$TARGET"

echo "==> 2/3 clang -> executable"
clang -O2 "$LL_FILE" \
  "$ROOT/runtime/ranger_rt.c" \
  "$ROOT/runtime/ranger_buffer.c" \
  "$ROOT/runtime/ranger_mem.c" \
  "$ROOT/runtime/ranger_json.c" \
  -lm \
  -o "$BIN_FILE" \
  -Wno-override-module

echo "==> 3/3 Built: $BIN_FILE"
echo ""
echo "Try it:"
echo "  cp gallery/pdf_writer/assets/images/Example.jpg tmp/jpeg-native/"
echo "  (cd tmp/jpeg-native && ./jpeg_scaler -width 200 Example.jpg out.jpg)"
echo ""
echo "Status doc: $DOC"
