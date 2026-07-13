# Native pose embed for the SDL host — plan

The Pi ships the **native SDL host** (`game_sdl`: C++ + SDL2 + GLES2, **wasm3**
embedded), not a browser. So the pose provider is **native C++ inside `game_sdl`**
that runs inference and writes RGP1 straight into the wasm3 guest's linear memory
— the same place input flags are written today
(`scripting/wasm_physics_runner.rgr:652`). No browser, no SharedArrayBuffer, no
Python. The browser PoC in `mediapipe_poc/` stays only as a **web-host reference
and model/mapping cross-check**; it is not the shipping path.

## What the model actually is

`pose_landmarker_lite.task` is a **zip of two TFLite models** (extract with
`bash mediapipe_poc/extract-tflite.sh`):

| model | size | stage |
| --- | --- | --- |
| `pose_detector.tflite` | 2.9 MB | find the person ROI (SSD-style, anchor decode) |
| `pose_landmarks_detector.tflite` | 2.7 MB | 33 landmarks + presence from the cropped ROI |

That's the entire pipeline — two TFLite `Invoke()` calls plus the BlazePose glue
between them. **No MediaPipe C++ framework, no Bazel.** (Exact input/output tensor
shapes are read at runtime from the interpreter; typical BlazePose is detector
224×224×3, landmarks 256×256×3, landmark output 195 = 39×5.)

## Native stack (no Python, no Bazel)

- **TFLite C++** (`libtensorflow-lite`) built with **CMake**, cross-compiled for
  **aarch64** (Pi 5). Link the **XNNPACK** delegate — the fast multi-threaded ARM
  CPU path — and set `SetNumThreads(4)` for the A76 cores.
- Everything is a normal C++ static/shared lib linked into `game_sdl`; no runtime
  interpreter version to drift (the objection to a Python sidecar disappears).

## Per-frame pipeline (the glue to write)

1. **Capture** a frame from the USB camera via **V4L2** (`/dev/video*`, gated by
   the `deploy-pi.sh` camera check). MJPEG/YUYV → RGB.
2. **Letterbox** to the detector input; `Invoke()` `pose_detector`; decode anchors
   → best ROI box + rotation.
3. **Crop + rotate** the ROI; `Invoke()` `pose_landmarks_detector`; decode 33
   landmarks (normalized) + a presence score.
4. **Track:** while presence stays high, reuse the previous ROI and skip the
   detector (MediaPipe's own optimization) — the detector is the expensive stage,
   so this roughly halves steady-state cost.
5. **Classify** a gesture from the landmarks (same logic as `rgp1.mjs`:
   arms-up / lean) and **write RGP1** into the wasm3 guest's linear memory:
   present, gesture, count, nose x/y in world-unit fixed-point.

## Integration point in `game_sdl`

A `PoseProvider` C++ module, called once per frame **before** the guest's
`update()` — the exact slot RGP1/input is written today. It owns the two
`tflite::Interpreter`s, the V4L2 handle, and the ROI-tracking state; it writes the
RGP1 bytes into `abi_base + RGP1_off` in wasm3 linear memory. The guest
(`pose_demo`, unchanged) reads them via `rg_pose_*`.

## Milestones (built/measured ON THE PI — that's the only meaningful number)

1. **`pose_bench` (standalone C++)** — load both tflite models with XNNPACK, run
   on a sample image, time each stage. This is the honest ARM perf probe; it
   decides the webcam purchase. Build on the Pi (or an aarch64 cross toolchain).
2. **V4L2 capture** — real frames into stage 1; measure end-to-end incl. capture.
3. **`PoseProvider` in `game_sdl`** — write RGP1 into wasm3 memory before update.
4. **Gesture + game** — `pose_demo` reacts on the native host.

## Honest status / what I can't do from here

- I **cannot build/measure TFLite in this x86 container** reliably (heavy CMake
  build + allowlist-restricted dep fetches). The real number comes from building
  `pose_bench` on the Pi. I can write that harness + its CMake so it's ready to
  build there — but I won't be able to compile-verify it here, so treat the first
  C++ drop as a first draft to iterate on-device.
- Rough expectation to set before the webcam arrives: native TFLite+XNNPACK is
  usually **faster** than the browser-WASM numbers we measured (~30 ms VIDEO /
  ~56 ms IMAGE for lite on x86). On a Pi 5 the `lite` landmark stage with 4-thread
  XNNPACK is plausibly ~15–40 ms, with the detector amortized by tracking — i.e.
  real-time-ish (≈15–30 fps) looks feasible, but this is an estimate until
  `pose_bench` runs on the device.
