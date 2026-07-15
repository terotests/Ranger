#!/usr/bin/env bash
# Build the fps_wasm guest to WASM.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
CRATE="$ROOT/gallery/game_engine/games/fps_wasm/src"
OUT="$ROOT/gallery/game_engine/games/fps_wasm/logic.wasm"
cd "$CRATE"
if ! rustup target list --installed 2>/dev/null | grep -q 'wasm32-unknown-unknown'; then
  rustup target add wasm32-unknown-unknown
fi
cargo build --release --target wasm32-unknown-unknown
mkdir -p "$(dirname "$OUT")"
cp "$CRATE/target/wasm32-unknown-unknown/release/fps_wasm.wasm" "$OUT"
echo "==> wrote $OUT ($(wc -c < "$OUT") bytes)"
