#!/usr/bin/env bash
# Ranger jpeg_scaler -> LLVM IR -> native executable (EXPERIMENTAL)
#
# WARNING: The resulting binary is NOT safe to run on real JPEGs. It may hang
# and allocate excessive memory (>1 GB). See gallery/pdf_writer/docs/JPEG_SCALER_LLVM.md
#
# Usage: ./scripts/compile-jpeg-scaler-llvm.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/gallery/pdf_writer/src/tools/jpeg_scaler.rgr"
OUT_DIR="$ROOT/tmp/jpeg-native"
LL_FILE="$OUT_DIR/jpeg_scaler.ll"
BIN_FILE="$OUT_DIR/jpeg_scaler"
WARNING_FILE="$OUT_DIR/WARNING.txt"
DOC="$ROOT/gallery/pdf_writer/docs/JPEG_SCALER_LLVM.md"

mkdir -p "$OUT_DIR"

cat <<'EOF'
================================================================================
  WARNING — jpeg_scaler LLVM build is EXPERIMENTAL and NOT WORKING
================================================================================

  The native binary may HANG during JPEG decode and allocate >1 GB memory.
  Do NOT use for production. Use Go or JavaScript builds instead.

  Details: gallery/pdf_writer/docs/JPEG_SCALER_LLVM.md
================================================================================

EOF

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
clang "$LL_FILE" \
  "$ROOT/runtime/ranger_rt.c" \
  "$ROOT/runtime/ranger_buffer.c" \
  "$ROOT/runtime/ranger_mem.c" \
  -o "$BIN_FILE" \
  -Wno-override-module

cat > "$WARNING_FILE" <<EOF
jpeg_scaler LLVM native build — NOT FOR USE

This binary is experimental. Running it on JPEG files may:
  - hang indefinitely during decode
  - allocate over 1 gigabyte of memory

Use Go or JavaScript builds. See:
  $DOC
EOF

echo "==> 3/3 Built (not run): $BIN_FILE"
echo "    Wrote: $WARNING_FILE"
echo ""
echo "Do NOT run: $BIN_FILE <args>"
echo "Status doc: $DOC"
