#!/usr/bin/env bash
# Bake the ready character set into lpc/pack/characters/<slug>/walk.png.
#
# With the full Universal-LPC art available (LPC_ROOT, or a sibling checkout of
# Universal-LPC-Spritesheet-Character-Generator) each character is composed from
# its own rich layer stack (lpc_compose.rgr buildFullCharCalls); with only the
# embedded demo-male-walk pack they are recolours of the shared male-walk stack
# (lpc_char_catalog.rgr applyProfile). Re-run after editing a character's layers
# or colours, or adding a new catalog id — then copy the sheets + credits into
# games/sprite_char/assets/ (the game ships its own copies).
#
# Usage:
#   ./gallery/game_engine/scripts/bake-characters.sh
#   npm run engine:chars:bake
#   LPC_ROOT=/path/to/Universal-LPC-Spritesheet-Character-Generator \
#     npm run engine:chars:bake                      # rich full-art bake

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

GAME_ASSETS="$ROOT/gallery/game_engine/games/sprite_char/assets"
echo "==> sync game copies -> $GAME_ASSETS"
for slug in hero knight mage rogue; do
  cp "$PACK/$slug/walk.png" "$GAME_ASSETS/$slug.png"
  cp "$PACK/$slug/credits.json" "$GAME_ASSETS/$slug.credits.json"
done

echo "==> characters baked into $PACK"
