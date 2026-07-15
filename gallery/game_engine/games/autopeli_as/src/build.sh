#!/usr/bin/env bash
# Build the AssemblyScript autopeli guest to games/autopeli_as/logic.wasm.
#
# Usage:  bash gallery/game_engine/games/autopeli_as/src/build.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
CRATE="$ROOT/gallery/game_engine/games/autopeli_as/src"
OUT="$ROOT/gallery/game_engine/games/autopeli_as/logic.wasm"

cd "$CRATE"
if [[ ! -d node_modules/assemblyscript ]]; then
  echo "==> npm install (assemblyscript)"
  npm install --no-audit --no-fund
fi

echo "==> asc build (optimize, minimal runtime, no abort import)"
./node_modules/.bin/asc assembly/index.ts \
  --outFile build/logic.wasm --runtime minimal --use abort= --optimize

mkdir -p "$(dirname "$OUT")"
# Reuse the same art the Rust autopeli uses.
SRC="$ROOT/gallery/game_engine/games/autopeli_physics/assets"
DST="$ROOT/gallery/game_engine/games/autopeli_as/assets"
mkdir -p "$DST"
for f in car1.png car2.png othercar.png cone.png oil.png; do
  [[ -f "$SRC/$f" ]] && cp "$SRC/$f" "$DST/$f" || true
done
cp "$CRATE/build/logic.wasm" "$OUT"
echo "==> wrote $OUT ($(wc -c < "$OUT") bytes)"
