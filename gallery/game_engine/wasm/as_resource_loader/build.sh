#!/usr/bin/env bash
# Build the AssemblyScript resource loader to games/streaming_worker/resource_loader.wasm.
#
# Usage:  bash gallery/game_engine/wasm/as_resource_loader/build.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
CRATE="$ROOT/gallery/game_engine/wasm/as_resource_loader"
OUT="$ROOT/gallery/game_engine/games/streaming_worker/resource_loader.wasm"

cd "$CRATE"
if [[ ! -d node_modules/assemblyscript ]]; then
  echo "==> npm install (assemblyscript)"
  npm install --no-audit --no-fund
fi

echo "==> asc build (optimize, minimal runtime)"
./node_modules/.bin/asc assembly/index.ts \
  --outFile build/resource_loader.wasm --runtime minimal --use abort= --optimize

mkdir -p "$(dirname "$OUT")"
cp "$CRATE/build/resource_loader.wasm" "$OUT"
echo "==> wrote $OUT ($(wc -c < "$OUT") bytes)"
