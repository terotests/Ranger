#!/usr/bin/env bash
# Build + run the native pose probes on this machine (intended: the Raspberry Pi).
#
#   1) native_provider unit test  — pure C++ threading contract (PoseChannel,
#      1€ filter, ROI, RGP1 bytes, PoseWorker). Fast, no deps beyond g++.
#   2) native_bench (TFLite)       — 2-stage BlazePose perf + landmark diff vs the
#      browser MediaPipe reference (compare.mjs).
#
# Run directly on the Pi (deploy-pi.sh runs it for you when RANGER_POSE_BENCH=1):
#   bash gallery/game_engine/pose/build-pose-native-pi.sh
#
# Deps: g++, cmake, git, node, unzip, curl (deploy-pi.sh installs these under
# RANGER_POSE_BENCH=1). Env:
#   TENSORFLOW_SOURCE_DIR  tensorflow checkout for TFLite's CMake (default ~/tensorflow)
#   POSE_THREADS           XNNPACK threads (default 2 — see NATIVE_EMBED.md)
#   POSE_MODEL_URL         .task model (default: pose_landmarker_lite)
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"          # .../gallery/game_engine/pose
TF="${TENSORFLOW_SOURCE_DIR:-$HOME/tensorflow}"
THREADS="${POSE_THREADS:-2}"
MODEL_URL="${POSE_MODEL_URL:-https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing dependency: $1 (apt-get install it)" >&2; exit 1; }; }
for c in g++ cmake git node unzip curl; do need "$c"; done

echo "==> [1/4] native_provider threading test (pure C++, ARM)"
( cd "$HERE/native_provider"
  g++ -std=c++17 -O2 -pthread rg_pose.cc rg_pose_test.cc -o /tmp/rg_pose_test
  /tmp/rg_pose_test )

echo "==> [2/4] models: download (if needed) + extract .tflite"
MODELS="$HERE/mediapipe_poc/assets/models"
mkdir -p "$MODELS"
[ -f "$MODELS/pose_landmarker_lite.task" ] || curl -fsSL -o "$MODELS/pose_landmarker_lite.task" "$MODEL_URL"
bash "$HERE/mediapipe_poc/extract-tflite.sh" "$MODELS/pose_landmarker_lite.task"

echo "==> [3/4] tensorflow checkout for TFLite CMake ($TF)"
if [ ! -d "$TF/tensorflow/lite" ]; then
  echo "    cloning tensorflow (shallow) — one-time, large"
  git clone --depth 1 https://github.com/tensorflow/tensorflow "$TF"
fi

echo "==> [4/4] build + run native_bench (threads=$THREADS)"
BENCH="$HERE/native_bench"
# REUSE an existing build wherever it already is — a full TFLite/XNNPACK/kleidiai
# compile is ~1h, and we never want to repeat it. Never move a CMake build dir
# (it bakes absolute paths and would reconfigure); build in place. Precedence:
#   POSE_BUILD_DIR  ->  existing in-repo build/  ->  existing ~/.cache build  ->  in-repo (fresh)
# The in-repo build/ is kept across deploys by deploy-pi.sh's rsync exclude, so
# it survives --delete. Incremental after the first build: only pose_bench.cc
# relinks (seconds). rm -rf the dir to force a clean rebuild.
if [ -n "${POSE_BUILD_DIR:-}" ]; then
  BUILD_DIR="$POSE_BUILD_DIR"
elif [ -f "$BENCH/build/pose_bench" ]; then
  BUILD_DIR="$BENCH/build"
elif [ -f "$HOME/.cache/ranger-pose-bench/pose_bench" ]; then
  BUILD_DIR="$HOME/.cache/ranger-pose-bench"
else
  BUILD_DIR="$BENCH/build"
fi
mkdir -p "$BUILD_DIR"
if [ -f "$BUILD_DIR/pose_bench" ]; then
  echo "    (incremental — reusing existing build in $BUILD_DIR; no TFLite rebuild)"
else
  echo "    (first build — compiles TFLite once, ~slow; cached in $BUILD_DIR after)"
fi
cmake -S "$BENCH" -B "$BUILD_DIR" -DTENSORFLOW_SOURCE_DIR="$TF" -DCMAKE_BUILD_TYPE=Release
cmake --build "$BUILD_DIR" -j"$(nproc)"

BIN="$BUILD_DIR/pose_bench"
DET="$MODELS/tflite/pose_detector.tflite"
LM="$MODELS/tflite/pose_landmarks_detector.tflite"
echo ""
echo "--- perf + landmarks (human) ---"
"$BIN" "$DET" "$LM" "$BENCH/pose.ppm" --threads "$THREADS"
echo ""
echo "--- accuracy vs browser reference (compare.mjs) ---"
"$BIN" "$DET" "$LM" "$BENCH/pose.ppm" --threads "$THREADS" --json \
  | node "$BENCH/compare.mjs" "$HERE/mediapipe_poc/reference/landmarks.json" -
echo ""
echo "Thread sweep for the game budget (see NATIVE_EMBED.md): re-run with"
echo "  POSE_THREADS=1|2|3|4 bash $(basename "$0")   (fast — build is cached in $BUILD_DIR)"
