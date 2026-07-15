#!/usr/bin/env bash
# Build the RGSP1 + RGP1 + RGU1 pose guest to WASM.
#
# Usage:
#   ./gallery/game_engine/games/pose_arena/src/build.sh
#   npm run engine:pose:guest
#
# Requires the wasm32-unknown-unknown target (installed on demand below). The
# host bridge lives in scripting/sprite_wasm_runner.rgr (it streams RGP1 pose,
# ticks the guest, draws the catalog sprite + the RGU1 HUD text, and MAY overlay
# the skeleton). The character catalog it draws from is
# gallery/game_engine/games/pose_arena/assets/ (shared with sprite_char).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
CRATE="$ROOT/gallery/game_engine/games/pose_arena/src"
OUT="$ROOT/gallery/game_engine/games/pose_arena/pose_arena.wasm"

cd "$CRATE"

if ! rustup target list --installed | grep -q 'wasm32-unknown-unknown'; then
  echo "==> Installing wasm32-unknown-unknown target"
  rustup target add wasm32-unknown-unknown
fi

echo "==> cargo build --release (wasm32-unknown-unknown)"
cargo build --release --target wasm32-unknown-unknown

mkdir -p "$(dirname "$OUT")"
cp "$CRATE/target/wasm32-unknown-unknown/release/rust_pose_arena.wasm" "$OUT"
echo "==> wrote $OUT ($(wc -c < "$OUT") bytes)"
