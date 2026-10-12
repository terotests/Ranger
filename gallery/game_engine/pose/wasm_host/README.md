# wasm3 pose game — the game runs as a compiled wasm guest

This is the step that makes it a **real Ranger game**: the game logic runs as a
compiled **wasm3 guest** (like the shipping autopeli_wasm), driven live by the
camera. The host only moves bytes and draws.

```
V4L2 camera → TFLite pipeline (PoseWorker thread) → PoseChannel
   → game thread: WriteRgp1 into the guest's wasm3 memory → guest update()
      → read RGW1 (hero + score the GUEST computed) → SDL render
```

## Pieces
- `../wasm_guest/` — the game as AssemblyScript → `pose_guest.wasm` (committed).
  It reads RGP1 (pose) and writes RGW1 (world). Rebuild: `bash build.sh`
  (needs `--disable bulk-memory` so the embedded wasm3 accepts it).
- `pose_wasm_host.h` — loads the wasm via the `rg_wasm_bridge` (wasm3) API,
  `WriteRgp1`s a `PoseFrame` into guest memory, runs `update()`, reads RGW1 back.
- `pose_wasm_smoke.cc` — **headless proof** (no camera/SDL/TFLite): fabricated
  pose → guest → RGW1. Verifies the wasm3 + RGP1 path anywhere.
- `pose_wasm_game.cc` — the live SDL game: camera + TFLite + the wasm guest.

## Build & run (on the Pi)

Everything builds from the top-level `../CMakeLists.txt` (one TFLite compile):

```bash
cd ..                                   # gallery/game_engine/pose
cmake -B build -DTENSORFLOW_SOURCE_DIR=~/tensorflow -DCMAKE_BUILD_TYPE=Release
cmake --build build -j"$(nproc)"        # -> pose_wasm_smoke, pose_wasm_game (+ bench/game)

# headless sanity (no camera needed):
./build/pose_wasm_smoke wasm_guest/pose_guest.wasm

# live game (webcam in):
./build/pose_wasm_game \
  mediapipe_poc/assets/models/tflite/pose_detector.tflite \
  mediapipe_poc/assets/models/tflite/pose_landmarks_detector.tflite \
  wasm_guest/pose_guest.wasm \
  --device /dev/videoN --threads 2 --cam-w 640 --cam-h 480
```

The title bar's "guest score" is computed **inside the wasm guest** — proof the
compiled game logic is running, not the host.

## Note on RGP1 layout
The guest, `WriteRgp1` (native), and `rgp1.mjs` (browser) agree:
`present@0 gesture@4 count@8 revision@12 noseX@16 noseY@20` (i32, nose world×256).
The interpreted `.as` bridge (`as_abi_bridge.rgr`) currently uses a different
offset set — reconciling those into one canonical `wasm_pose_abi.h` is a
follow-up so a single `.as` can run interpreted, compiled, and native identically.
