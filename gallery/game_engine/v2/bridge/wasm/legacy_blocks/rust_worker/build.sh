#!/usr/bin/env bash
# Build the Ranger2D streaming worker WASM module (culling + asset load policy).
#
# Usage:
#   ./gallery/game_engine/wasm/rust_worker/build.sh
#   npm run engine:wasm:build:worker

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
CRATE="$ROOT/gallery/game_engine/wasm/rust_worker"
OUT="$ROOT/gallery/game_engine/games/streaming_worker/worker.wasm"

cd "$CRATE"

if ! rustup target list --installed | grep -q 'wasm32-unknown-unknown'; then
  echo "==> Installing wasm32-unknown-unknown target"
  rustup target add wasm32-unknown-unknown
fi

echo "==> cargo build --release (wasm32-unknown-unknown)"
cargo build --release --target wasm32-unknown-unknown

mkdir -p "$(dirname "$OUT")"
cp "$CRATE/target/wasm32-unknown-unknown/release/rust_worker.wasm" "$OUT"
echo "==> wrote $OUT ($(wc -c < "$OUT") bytes)"
