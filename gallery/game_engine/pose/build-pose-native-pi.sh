#!/usr/bin/env bash
# Build + verify the native pose stack on the Pi. IDEMPOTENT — re-run cheaply:
# CMake only rebuilds changed files, TFLite compiles once and is cached in build/.
# deploy-pi.sh runs this when RANGER_POSE_BENCH=1.
#
#   1) native_provider threading test  — pure C++ contract (fast, no TFLite)
#   2) models                          — download + extract the .tflite
#   3) tensorflow checkout             — for TFLite's CMake
#   4) wasm3 smoke                     — build+run pose_wasm_smoke (the compiled
#      game guest driven by a fabricated pose). No TFLite compile — instant proof.
#   5) full build + bench              — pose_bench/pose_game/pose_wasm_game
#      (TFLite compiled once, cached); run pose_bench perf + accuracy-vs-reference.
#
# The live camera games are PRINTED, not auto-run (they need a webcam + display).
#
# Env: TENSORFLOW_SOURCE_DIR (~/tensorflow), POSE_THREADS (2), POSE_MODEL_URL,
#      POSE_BUILD_DIR (default <pose>/build; deploy-pi.sh excludes it from rsync).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"          # .../gallery/game_engine/pose
TF="${TENSORFLOW_SOURCE_DIR:-$HOME/tensorflow}"
THREADS="${POSE_THREADS:-2}"
BUILD="${POSE_BUILD_DIR:-$HERE/build}"
MODEL_URL="${POSE_MODEL_URL:-https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task}"
MODELS="$HERE/mediapipe_poc/assets/models"
DET="$MODELS/tflite/pose_detector.tflite"
LM="$MODELS/tflite/pose_landmarks_detector.tflite"

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing dependency: $1 (apt-get install it)" >&2; exit 1; }; }
for c in g++ cmake git node unzip curl; do need "$c"; done

echo "==> [1/5] native_provider threading test (pure C++, ARM)"
( cd "$HERE/native_provider"
  g++ -std=c++17 -O2 -pthread rg_pose.cc rg_pose_test.cc -o /tmp/rg_pose_test
  /tmp/rg_pose_test )

echo "==> [2/5] models: download (if needed) + extract .tflite"
mkdir -p "$MODELS"
[ -f "$MODELS/pose_landmarker_lite.task" ] || curl -fsSL -o "$MODELS/pose_landmarker_lite.task" "$MODEL_URL"
bash "$HERE/mediapipe_poc/extract-tflite.sh" "$MODELS/pose_landmarker_lite.task"

echo "==> [3/5] tensorflow checkout for TFLite CMake ($TF)"
if [ ! -d "$TF/tensorflow/lite" ]; then
  echo "    cloning tensorflow (shallow) — one-time, large"
  git clone --depth 1 https://github.com/tensorflow/tensorflow "$TF"
fi

echo "==> [4/5] configure + wasm3 smoke (compiled guest, no TFLite compile)"
# cmake -B is idempotent: reconfigures only if needed. pose_wasm_smoke does NOT
# link TFLite, so building it never triggers the ~1h TFLite compile.
cmake -S "$HERE" -B "$BUILD" -DTENSORFLOW_SOURCE_DIR="$TF" -DCMAKE_BUILD_TYPE=Release
cmake --build "$BUILD" --target pose_wasm_smoke -j"$(nproc)"
echo "--- wasm3 guest smoke ---"
"$BUILD/pose_wasm_smoke" "$HERE/wasm_guest/pose_guest.wasm"

echo "==> [5/5] full build (TFLite once, cached in $BUILD) + bench"
cmake --build "$BUILD" -j"$(nproc)"
echo ""
echo "--- perf + landmarks (human) ---"
"$BUILD/pose_bench" "$DET" "$LM" "$HERE/native_bench/pose.ppm" --threads "$THREADS"
echo ""
echo "--- accuracy vs browser reference (compare.mjs) ---"
"$BUILD/pose_bench" "$DET" "$LM" "$HERE/native_bench/pose.ppm" --threads "$THREADS" --json \
  | node "$HERE/native_bench/compare.mjs" "$HERE/mediapipe_poc/reference/landmarks.json" -

echo ""
echo "Live games (need a webcam + display) — pass your camera node:"
echo "  $BUILD/pose_wasm_game $DET $LM $HERE/wasm_guest/pose_guest.wasm --device /dev/videoN --threads $THREADS"
echo "  $BUILD/pose_game      $DET $LM --device /dev/videoN --threads $THREADS   # non-wasm variant"
echo "Thread sweep (fast — build is cached): POSE_THREADS=1|2|3|4 bash $(basename "$0")"
