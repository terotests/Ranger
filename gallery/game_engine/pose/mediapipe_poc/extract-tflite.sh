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

# Emit a manifest so the shipping runtime accepts only a known/tested model
# layout (a new .task can't silently change tensor order). Input shapes are the
# documented BlazePose defaults; native_bench reads and confirms them at runtime.
det_sha=$(sha256sum "$OUT/pose_detector.tflite" | cut -d' ' -f1)
lm_sha=$(sha256sum "$OUT/pose_landmarks_detector.tflite" | cut -d' ' -f1)
cat > "$OUT/pose_manifest.json" <<JSON
{
  "pipeline": "ranger-pose-v1",
  "detectorSha256": "$det_sha",
  "landmarkerSha256": "$lm_sha",
  "detectorInput":  [1, 224, 224, 3],
  "landmarkerInput": [1, 256, 256, 3],
  "landmarkCount": 39,
  "publicLandmarkCount": 33
}
JSON

echo "Extracted to $OUT:"
ls -lh "$OUT"/*.tflite
echo "Manifest: $OUT/pose_manifest.json"
