#!/usr/bin/env bash
# Bake the ready character set into lpc/pack/characters/<slug>/walk.png.
#
# Each character is composed from the embedded demo-male-walk pack and recoloured
# per its catalog profile (gallery/game_engine/lpc/src/lpc_char_catalog.rgr).
# Re-run after editing a character's colours or adding a new catalog id.
#
# Usage:
#   ./gallery/game_engine/scripts/bake-characters.sh
#   npm run engine:chars:bake

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PACK="$ROOT/gallery/game_engine/lpc/pack/characters"
BUILD="$ROOT/gallery/game_engine/scripts/build-lpc.sh"

for slug in hero knight mage rogue; do
  mkdir -p "$PACK/$slug"
  echo "==> bake $slug"
  bash "$BUILD" --run "$slug" "$PACK/$slug/walk.png"
done

echo "==> regenerate per-character credits.json"
node "$PACK/build-credits.mjs"

echo "==> characters baked into $PACK"
