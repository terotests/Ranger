#!/usr/bin/env bash
# Extract the two TFLite models from a MediaPipe .task bundle (a plain zip) for
# the native C++ embed (see ../NATIVE_EMBED.md). Run after fetch-assets.sh.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
TASK="${1:-$DIR/assets/models/pose_landmarker_lite.task}"
OUT="$DIR/assets/models/tflite"

if [[ ! -f "$TASK" ]]; then
  echo "missing $TASK — run fetch-assets.sh first" >&2; exit 1
fi
mkdir -p "$OUT"
unzip -o "$TASK" -d "$OUT"
echo "Extracted to $OUT:"
ls -lh "$OUT"/*.tflite
