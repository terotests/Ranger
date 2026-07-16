#!/usr/bin/env bash
# Build the model_viewer_wasm guest to WASM.
#   ./gallery/game_engine/games/model_viewer_wasm/src/build.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
CRATE="$ROOT/gallery/game_engine/games/model_viewer_wasm/src"
OUT="$ROOT/gallery/game_engine/games/model_viewer_wasm/logic.wasm"
cd "$CRATE"
if ! rustup target list --installed 2>/dev/null | grep -q 'wasm32-unknown-unknown'; then
  echo "==> Installing wasm32-unknown-unknown target"
  rustup target add wasm32-unknown-unknown
fi
echo "==> cargo build --release (wasm32-unknown-unknown)"
cargo build --release --target wasm32-unknown-unknown
mkdir -p "$(dirname "$OUT")"
cp "$CRATE/target/wasm32-unknown-unknown/release/model_viewer_wasm.wasm" "$OUT"
echo "==> wrote $OUT ($(wc -c < "$OUT") bytes)"
