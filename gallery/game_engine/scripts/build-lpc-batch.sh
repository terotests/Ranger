#!/usr/bin/env bash
# Compose walk-strip PNGs for every fixtures/*.json (Ranger runner; bodyType from filename only for now).
#
# Usage: ./gallery/game_engine/scripts/build-lpc-batch.sh
#
# TODO: pass selections JSON into lpc_compose_runner when catalog + JSON import exist.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
FIXTURES="$ROOT/gallery/game_engine/lpc/fixtures"
BUILD="$ROOT/gallery/game_engine/scripts/build-lpc.sh"

for preset in minimal:male female:female teen:teen; do
  name="${preset%%:*}"
  body="${preset##*:}"
  out="gallery/game_engine/lpc/output/${name}-walk.png"
  echo ""
  echo "=== $name (bodyType=$body) ==="
  bash "$BUILD" --run "$body" "$out"
done
