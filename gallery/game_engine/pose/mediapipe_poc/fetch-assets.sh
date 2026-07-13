#!/usr/bin/env bash
# Fetch the large binaries the PoC needs but that are NOT committed to git:
#   - the MediaPipe WASM fileset (copied out of node_modules after `npm install`)
#   - the pose model .task bundles (downloaded from Google's model host)
#
# Run from this directory, after `npm install`:
#   bash fetch-assets.sh
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "==> copy MediaPipe WASM fileset from node_modules"
if [ ! -d node_modules/@mediapipe/tasks-vision/wasm ]; then
  echo "   node_modules missing — run 'npm install' first" >&2; exit 1
fi
mkdir -p wasm
cp node_modules/@mediapipe/tasks-vision/wasm/* wasm/
cp node_modules/@mediapipe/tasks-vision/vision_bundle.mjs ./vision_bundle.mjs

echo "==> download pose models"
mkdir -p assets/models
base="https://storage.googleapis.com/mediapipe-models/pose_landmarker"
curl -fsSL -o assets/models/pose_landmarker_lite.task  "$base/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
curl -fsSL -o assets/models/pose_landmarker_full.task  "$base/pose_landmarker_full/float16/1/pose_landmarker_full.task"
# heavy is ~30 MB; uncomment to compare the top-accuracy variant too:
# curl -fsSL -o assets/models/pose_landmarker_heavy.task "$base/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"

echo "==> sample images (already committed, re-fetch if missing)"
mkdir -p assets/images
[ -f assets/images/pose.jpg ]     || curl -fsSL -o assets/images/pose.jpg     "https://storage.googleapis.com/mediapipe-assets/pose.jpg"
[ -f assets/images/portrait.jpg ] || curl -fsSL -o assets/images/portrait.jpg "https://storage.googleapis.com/mediapipe-assets/portrait.jpg"

echo "Done. Now: node bench.mjs"
