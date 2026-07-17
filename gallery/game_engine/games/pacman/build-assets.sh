#!/usr/bin/env bash
# Bake Pac-Man character spritesheets into games/pacman/assets/.
#
# From Ranger repo root:
#   bash gallery/game_engine/games/pacman/build-assets.sh
#   npm run engine:pacman:assets

set -euo pipefail

GAME_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Pac-Man sprites -> $GAME_DIR/assets"
python3 "$GAME_DIR/tools/gen_sprites.py"
echo "Done."
