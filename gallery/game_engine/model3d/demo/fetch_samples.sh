#!/usr/bin/env bash
# Fetch a couple of Khronos glTF Sample Assets (GLB) into ./assets.
# These files are NOT committed to the repo — they are downloaded on demand.
# Source + licenses: https://github.com/KhronosGroup/glTF-Sample-Assets
set -e

HERE="$(cd "$(dirname "$0")" && pwd)"
DEST="$HERE/assets"
mkdir -p "$DEST"
BASE="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models"

fetch() {
  local name="$1" rel="$2"
  if [ -f "$DEST/$name" ]; then
    echo "have $name"
  else
    echo "fetching $name"
    curl -sS -L -o "$DEST/$name" "$BASE/$rel"
  fi
}

fetch Duck.glb        "Duck/glTF-Binary/Duck.glb"
fetch BoxTextured.glb "BoxTextured/glTF-Binary/BoxTextured.glb"

echo "done -> $DEST"
