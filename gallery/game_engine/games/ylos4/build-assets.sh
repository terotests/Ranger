#!/usr/bin/env bash
# Bake LPC walk strips into games/ylos4/assets/ (committed PNGs for Pi deploy).
#
# From Ranger repo root:
#   bash gallery/game_engine/games/ylos4/build-assets.sh
#   npm run engine:ylos4:assets

set -euo pipefail

GAME_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$GAME_DIR/../../../.." && pwd)"
ASSETS="$GAME_DIR/assets"
BUILD="$ROOT/gallery/game_engine/scripts/build-lpc.sh"

mkdir -p "$ASSETS"

echo "==> Ylos 4 LPC assets -> $ASSETS"
bash "$BUILD" --run female "$ASSETS/p1_walk.png"
bash "$BUILD" --run male "$ASSETS/p2_walk.png"
bash "$BUILD" --run super_female "$ASSETS/p1_super.png"
bash "$BUILD" --run super "$ASSETS/p2_super.png"
bash "$BUILD" --run skeleton "$ASSETS/enemy_walk.png"
echo "Done."
