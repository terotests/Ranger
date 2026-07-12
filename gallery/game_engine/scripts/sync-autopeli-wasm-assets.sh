#!/usr/bin/env bash
# Prefer real autopeli_physics art; fall back to generated placeholders.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SRC="$ROOT/gallery/game_engine/games/autopeli_physics/assets"
DST="$ROOT/gallery/game_engine/games/autopeli_wasm/assets"

mkdir -p "$DST"
NEED_GEN=0
for f in car1.png car2.png othercar.png cone.png oil.png; do
  if [[ -f "$SRC/$f" ]]; then
    cp "$SRC/$f" "$DST/$f"
  elif [[ ! -f "$DST/$f" ]]; then
    NEED_GEN=1
  fi
done

if [[ "$NEED_GEN" == "1" ]]; then
  python3 "$ROOT/gallery/game_engine/scripts/generate-autopeli-wasm-assets.py"
fi

echo "==> autopeli_wasm assets ready in $DST"
