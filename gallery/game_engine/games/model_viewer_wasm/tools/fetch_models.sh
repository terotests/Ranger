#!/usr/bin/env bash
# (Re)download the committed Khronos sample models this viewer cycles through.
# The GLBs are already committed; this just reproduces them from the upstream
# glTF-Sample-Assets repo. See models/CREDITS.md for licenses/attribution.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
DEST="$HERE/../models"
BASE="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models"
for m in Box BoxTextured BoxVertexColors Duck; do
  echo "fetching $m.glb"
  curl -sS -L -o "$DEST/$m.glb" "$BASE/$m/glTF-Binary/$m.glb"
done
echo "done -> $DEST"
