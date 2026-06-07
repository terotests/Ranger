#!/usr/bin/env bash
# Ranger collections demo -> WAT -> .wasm + browser HTML

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/tests/fixtures/llvm_collections.rgr"
OUT_DIR="$ROOT/tmp/wasm-collections"
OUT_WASM="$OUT_DIR/collections.wasm"
WAT_FILE="$OUT_DIR/llvm_collections.wat"
TEMPLATE="$ROOT/scripts/wasm-demo/collections.template.html"
HTML_OUT="$OUT_DIR/index.html"

mkdir -p "$OUT_DIR"

"$ROOT/scripts/compile-wasm.sh" "$SOURCE" "$OUT_WASM"

echo ""
echo "collections demo: $HTML_OUT"
