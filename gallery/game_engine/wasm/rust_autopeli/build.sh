#!/usr/bin/env bash
# Build Rust Autopeli WASM module (linear ABI) for the game engine.
#
# Usage:
#   ./gallery/game_engine/wasm/rust_autopeli/build.sh
#   npm run engine:wasm:build:rust-autopeli

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
CRATE="$ROOT/gallery/game_engine/wasm/rust_autopeli"
OUT="$ROOT/gallery/game_engine/games/autopeli_wasm/logic.wasm"

cd "$CRATE"

if ! rustup target list --installed | grep -q 'wasm32-unknown-unknown'; then
  echo "==> Installing wasm32-unknown-unknown target"
  rustup target add wasm32-unknown-unknown
fi

echo "==> cargo build --release (wasm32-unknown-unknown)"
cargo build --release --target wasm32-unknown-unknown

mkdir -p "$(dirname "$OUT")"
bash "$ROOT/gallery/game_engine/scripts/sync-autopeli-wasm-assets.sh"
cp "$CRATE/target/wasm32-unknown-unknown/release/rust_autopeli.wasm" "$OUT"
echo "==> wrote $OUT ($(wc -c < "$OUT") bytes)"
