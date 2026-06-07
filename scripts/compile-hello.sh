#!/usr/bin/env bash
# Ranger hello world with libc printf (target-based I/O)
#
# Usage:
#   ./scripts/compile-hello.sh [target] [output-binary]
#
# Targets:
#   native-linux-gnu     (default on Linux x86_64)
#   arm64-apple-macos    (default on Apple Silicon)
#   x86_64-apple-macos   (Intel Mac)
#   native-macos         (alias -> arm64-apple-macos in Ranger; script picks arch)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/tests/fixtures/llvm_hello.rgr"
OUT_DIR_REL="tmp/hello-demo"
OUT_DIR="$ROOT/$OUT_DIR_REL"
LL_FILE="$OUT_DIR/llvm_hello.ll"

macos_ranger_target() {
  if [[ "$(uname -m)" == "arm64" ]]; then
    echo "arm64-apple-macos"
  else
    echo "x86_64-apple-macos"
  fi
}

DEFAULT_TARGET="native-linux-gnu"
if [[ "$(uname -s)" == "Darwin" ]]; then
  DEFAULT_TARGET="$(macos_ranger_target)"
fi

TARGET="${1:-$DEFAULT_TARGET}"
if [[ "$TARGET" == "native-macos" ]]; then
  TARGET="$(macos_ranger_target)"
fi
OUT_BIN="${2:-$OUT_DIR/hello}"

mkdir -p "$OUT_DIR"

RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr"
COMPILER="$ROOT/bin/output.js"

if [[ ! -f "$COMPILER" ]]; then
  echo "error: run npm run compile first" >&2
  exit 1
fi

if ! command -v clang >/dev/null 2>&1; then
  echo "error: clang not found" >&2
  exit 1
fi

echo "==> 1/3 Ranger -> LLVM IR (-target=$TARGET)"
cd "$ROOT"
RANGER_LIB="$RANGER_LIB" node "$COMPILER" \
  -l=llvm \
  -target="$TARGET" \
  "$SOURCE" \
  -nodecli \
  -d="$OUT_DIR_REL" \
  -o="llvm_hello.ll"

echo "==> 2/3 clang -> native binary"
CLANG_TARGET="$(grep '^target triple' "$LL_FILE" | sed -n 's/.*"\([^"]*\)".*/\1/p')"
if [[ -n "$CLANG_TARGET" ]]; then
  clang -Wno-override-module -target "$CLANG_TARGET" "$LL_FILE" -o "$OUT_BIN"
else
  clang "$LL_FILE" -o "$OUT_BIN"
fi

echo "==> 3/3 Run"
"$OUT_BIN"
echo ""
echo "binary: $OUT_BIN"
echo "IR:     $LL_FILE (target=$TARGET)"
