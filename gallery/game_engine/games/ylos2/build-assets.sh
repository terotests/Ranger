#!/usr/bin/env bash
# Bake LPC walk strips into games/ylos2/assets/ (committed PNGs for Pi deploy).
#
# Requires Universal-LPC checkout (sibling or LPC_ROOT). From Ranger repo root:
#   bash gallery/game_engine/games/ylos2/build-assets.sh
#   npm run engine:ylos2:assets
#
# Output:
#   assets/p1_walk.png      — girl (P1, left)
#   assets/p2_walk.png      — boy (P2, right)
#   assets/p1_super.png     — girl super (wings + tiara + plate + shield)
#   assets/p2_super.png     — boy super (plate + shield + horned helm)
#   assets/enemy_walk.png   — skeleton enemy (LPC walk strip)

set -euo pipefail

GAME_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$GAME_DIR/../../../.." && pwd)"
ASSETS="$GAME_DIR/assets"
BUILD="$ROOT/gallery/game_engine/scripts/build-lpc.sh"

mkdir -p "$ASSETS"

echo "==> Ylos 2 LPC assets -> $ASSETS"
bash "$BUILD" --run female "$ASSETS/p1_walk.png"
bash "$BUILD" --run male "$ASSETS/p2_walk.png"
bash "$BUILD" --run super_female "$ASSETS/p1_super.png"
bash "$BUILD" --run super "$ASSETS/p2_super.png"
bash "$BUILD" --run skeleton "$ASSETS/enemy_walk.png"
echo "Done."
