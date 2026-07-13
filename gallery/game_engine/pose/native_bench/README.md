# native_bench — native TFLite pose probe (perf + first-order correctness)

Standalone, **discardable** C++ probe for the native SDL path (see
`../NATIVE_EMBED.md`, Option B). It runs the two TFLite models from the `.task`
bundle natively with **XNNPACK** on a still image and prints landmarks, the RGP1
mapping, and per-stage timing. Its job is a **real Pi/ARM latency number** and a
first-order sanity check — not full MediaPipe parity.

> **Scope:** this is a *partial* Pose Landmarker pipeline. It does the TFLite calls
> + preprocessing + SSD anchor gen + a **simplified** detector decode (top-1, no
> weighted NMS) + rotated ROI + landmark back-projection. It does **not yet** do
> heatmap-based landmark refinement, temporal smoothing, tracking, or
> world-landmarks (see `../NATIVE_EMBED.md` steps 9, 11, 13, 14). So the **timing
> is representative but the landmark accuracy is provisional** — validate it
> against the browser MediaPipe reference (`../mediapipe_poc/`) before trusting it.

> Throwaway by design: this whole directory touches nothing else in the repo.
> If it misbehaves, `rm -rf gallery/game_engine/pose/native_bench` and it's gone.

## Prerequisites (on the Pi, or an aarch64 build host)

```bash
# 1) extract the two .tflite models from the .task bundle
cd ../mediapipe_poc && npm install && bash fetch-assets.sh && bash extract-tflite.sh && cd -
#    -> ../mediapipe_poc/assets/models/tflite/{pose_detector,pose_landmarks_detector}.tflite

# 2) a tensorflow checkout, only for TFLite's CMake (nothing is run from it)
git clone --depth 1 https://github.com/tensorflow/tensorflow ~/tensorflow

# 3) a test image as binary PPM (P6). pose.ppm is committed; make your own with:
#    ImageMagick:  convert yourphoto.jpg -resize 640x pose.ppm
#    ffmpeg:       ffmpeg -i yourphoto.jpg -vf scale=640:-1 -pix_fmt rgb24 pose.ppm
```

## Build & run

```bash
cmake -B build -DTENSORFLOW_SOURCE_DIR=~/tensorflow -DCMAKE_BUILD_TYPE=Release
cmake --build build -j4

./build/pose_bench \
  ../mediapipe_poc/assets/models/tflite/pose_detector.tflite \
  ../mediapipe_poc/assets/models/tflite/pose_landmarks_detector.tflite \
  pose.ppm --threads 4 --iters 30
```

Output: detector/landmark/total latency (min/median/mean/p95 + fps), the key
landmarks (nose, shoulders, wrists) in image pixels, and the RGP1 fields
(`present`, `gesture`, `nose` in world fixed-point) — the exact bytes the native
provider will write into wasm3 memory.

`--no-detector` skips stage 1 and treats the whole (square-cropped) image as the
ROI. Use it to (a) isolate the **landmark model's** cost and output from the
detector-decode logic, and (b) as a fallback if the detector ROI looks wrong.

## Reading the results honestly

- **The timing is trustworthy regardless of landmark accuracy** — it's just two
  `Invoke()` calls with XNNPACK. That's the number that decides the webcam.
- **Landmark accuracy** depends on a handful of MediaPipe constants that could not
  be verified without the device; they are tagged `// VERIFY` in `pose_bench.cc`
  (detector input normalization range, SSD anchor options, keypoint→ROI mapping,
  landmark output scale). If the printed landmarks don't land on the body:
  1. try `--no-detector` — if those landmarks are sane, the issue is in the
     detector decode / ROI (the `// VERIFY` block in `DetectionToRoi` + anchors);
  2. otherwise it's the landmark input normalization or output-scale `// VERIFY`.
- **This was not compiled in the authoring sandbox** (no TFLite there). Treat the
  first build as a first draft to iterate on-device; the pipeline structure and
  TFLite API usage are the parts to trust, the numeric constants are the parts to
  check.

## Where this goes next

The same three functions (preprocess → detect → landmarks → classify → RGP1)
become the native `PoseProvider` inside `game_sdl`: instead of a PPM it reads a
V4L2 camera frame, and instead of printing it writes the RGP1 bytes into the
wasm3 guest's linear memory before `update()` (`../NATIVE_EMBED.md`).

## Files

- `pose_bench.cc` — the whole probe (image load, 2-stage pipeline, RGP1, timing).
- `CMakeLists.txt` — pulls TFLite from a tensorflow checkout; XNNPACK on by default.
- `pose.ppm` — committed sample (a person with arms raised → expect `ARMS_UP`).
