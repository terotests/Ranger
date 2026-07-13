# native_game — live pose-controlled game (SDL2 + TFLite + V4L2 camera)

A simple game driven by the **validated** native pose pipeline on a real USB
camera. It reuses `../native_bench/pose_pipeline.h` (the exact code that matched
MediaPipe to ~0.7%) and the `../native_provider/` threading contract: the camera +
inference run on a `PoseWorker` thread and publish to a lock-free `PoseChannel`;
the SDL render thread reads the latest pose. Discardable — deleting this dir
affects nothing else.

> This demo draws with SDL directly (not through wasm3/RGP1). Writing the pose
> into a wasm3 guest so `pose_demo.game.as` reacts on the native launcher is the
> next step; this proves the detector → game loop on the Pi first.

**Game:** a circle follows your head; reach either hand (wrist) into the glowing
target to score, and a new target appears. The border tints with the gesture
(arms-up / lean). Title bar shows score / fps / inference ms.

## Camera notes (important)

Capture at a **modest resolution** — the models only see 224/256 px, and 640×480
**YUYV** fits USB 2.0 (~18 MB/s) with a trivial convert and no JPEG decoder. Do
**not** request 1080p (wasted detail, overruns USB-2 uncompressed). 640×480 (4:3)
also frames a standing body better than 16:9. This demo decodes **YUYV only**;
confirm your cam offers it: `v4l2-ctl -d /dev/videoN --list-formats-ext`.

Find the USB camera's node (not the Pi's codec/ISP nodes): `deploy-pi.sh`'s camera
check prints it, or `v4l2-ctl --list-devices` (look for the `uvcvideo` entry).

## Build (on the Pi)

```bash
# deps: SDL2 + the same tensorflow checkout native_bench uses
sudo apt-get install -y libsdl2-dev
# models already extracted by ../build-pose-native-pi.sh into
#   ../mediapipe_poc/assets/models/tflite/

cmake -B build -DTENSORFLOW_SOURCE_DIR=~/tensorflow -DCMAKE_BUILD_TYPE=Release
cmake --build build -j"$(nproc)"
```

(First build compiles TFLite — reuse `~/tensorflow`; it's the slow one-time step
shared with native_bench.)

## Run

```bash
./build/pose_game \
  ../mediapipe_poc/assets/models/tflite/pose_detector.tflite \
  ../mediapipe_poc/assets/models/tflite/pose_landmarks_detector.tflite \
  --device /dev/video0 --threads 2 --cam-w 640 --cam-h 480
```

Replace `/dev/video0` with your webcam's node. Esc/Q to quit. Stand back so your
upper body is in frame; move your head to move the hero, swat the yellow target
with a hand to score, raise both arms to see the border turn green.

## Files

- `camera_v4l2.h/.cc` — minimal V4L2 YUYV→RGB capture.
- `pose_game.cc` — SDL2 game: camera → PoseWorker(pipeline) → PoseChannel → render.
- `CMakeLists.txt` — links TFLite + SDL2 + the shared pipeline/provider.
