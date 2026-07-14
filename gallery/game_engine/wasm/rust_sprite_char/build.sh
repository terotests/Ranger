#!/usr/bin/env bash
# Build the RGSP1 sprite-character guest to WASM.
#
# Usage:
#   ./gallery/game_engine/wasm/rust_sprite_char/build.sh
#   npm run engine:chars:guest
#
# Requires the wasm32-unknown-unknown target (installed on demand below). The
# host bridge lives in scripting/wasm_sprite_runner.rgr; the ready character
# catalog it draws from is gallery/game_engine/lpc/pack/characters/.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
CRATE="$ROOT/gallery/game_engine/wasm/rust_sprite_char"
OUT="$ROOT/gallery/game_engine/games/sprite_char/sprite_char.wasm"

cd "$CRATE"

if ! rustup target list --installed | grep -q 'wasm32-unknown-unknown'; then
  echo "==> Installing wasm32-unknown-unknown target"
  rustup target add wasm32-unknown-unknown
fi

echo "==> cargo build --release (wasm32-unknown-unknown)"
cargo build --release --target wasm32-unknown-unknown

mkdir -p "$(dirname "$OUT")"
cp "$CRATE/target/wasm32-unknown-unknown/release/rust_sprite_char.wasm" "$OUT"
echo "==> wrote $OUT ($(wc -c < "$OUT") bytes)"
