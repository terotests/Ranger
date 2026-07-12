#!/usr/bin/env bash
# Build Rust Pong WASM module for the game engine PoC.
#
# Usage:
#   ./gallery/game_engine/wasm/rust_pong/build.sh
#   npm run engine:wasm:build:rust-pong

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
CRATE="$ROOT/gallery/game_engine/wasm/rust_pong"
OUT="$ROOT/gallery/game_engine/games/rust_pong/logic.wasm"

cd "$CRATE"

if ! rustup target list --installed | grep -q 'wasm32-unknown-unknown'; then
  echo "==> Installing wasm32-unknown-unknown target"
  rustup target add wasm32-unknown-unknown
fi

echo "==> cargo build --release (wasm32-unknown-unknown)"
cargo build --release --target wasm32-unknown-unknown

mkdir -p "$(dirname "$OUT")"
cp "$CRATE/target/wasm32-unknown-unknown/release/rust_pong.wasm" "$OUT"
echo "==> wrote $OUT ($(wc -c < "$OUT") bytes)"
