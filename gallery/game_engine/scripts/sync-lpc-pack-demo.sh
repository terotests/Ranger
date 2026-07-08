#!/usr/bin/env bash
# Copy demo-male-walk layers from full LPC checkout into embedded pack.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SRC="${LPC_ROOT:-$ROOT/../Universal-LPC-Spritesheet-Character-Generator}/spritesheets"
PACK="$ROOT/gallery/game_engine/lpc/pack/demo-male-walk"

if [[ ! -d "$SRC" ]]; then
  echo "error: LPC spritesheets not found: $SRC" >&2
  echo "Set LPC_ROOT to Universal-LPC-Spritesheet-Character-Generator" >&2
  exit 1
fi

LAYERS=(
  body/bodies/male/walk.png
  legs/pants/male/walk.png
  feet/boots/basic/male/walk.png
  head/heads/human/male/walk.png
  hair/natural/adult/walk.png
)

for rel in "${LAYERS[@]}"; do
  mkdir -p "$PACK/spritesheets/$(dirname "$rel")"
  cp "$SRC/$rel" "$PACK/spritesheets/$rel"
  echo "  $rel"
done

echo "Synced $(du -sh "$PACK" | awk '{print $1}') -> $PACK"
