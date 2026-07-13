# Native pose embed for the SDL host — plan

The Pi ships the **native SDL host** (`game_sdl`: C++ + SDL2 + GLES2, **wasm3**
embedded), not a browser. So the pose provider is **native C++ inside/beside
`game_sdl`** that runs inference and gets RGP1 into the wasm3 guest's linear
memory. This realignment is correct — the browser is the wrong shipping host for
Ranger's Pi build. The browser PoC in `mediapipe_poc/` is kept as the
**behavioral reference** (an oracle to validate the native output against), not
the shipping path.

## What the model actually is (corrected)

The `.task` bundle contains **two TFLite models** — but that is a fact about the
*file format*, not about functionality:

| model | size (lite) | role |
| --- | --- | --- |
| `pose_detector.tflite` | ~3 MB | find the person + initial pose region |
| `pose_landmarks_detector.tflite` | ~3 MB | 33 landmarks (+aux) from the cropped ROI |

`detector.Invoke(); landmarker.Invoke();` does **not** reproduce the MediaPipe
Pose Landmarker result. MediaPipe wraps those two calls in a graph. The shipping
host must implement a **narrowly-scoped equivalent of that graph**:

1. camera-frame color conversion + normalization
2. detector-input scaling + letterbox
3. detector output decoding
4. SSD anchor handling + non-max suppression
5. rotated person ROI derivation
6. ROI scale + rotate + crop for the landmark model
7. decode the landmark model's **five** output tensors (landmarks, presence,
   segmentation, heatmap, world-landmarks)
8. presence + visibility sigmoids
9. **heatmap-based landmark refinement**
10. transform landmarks back to original image coordinates
11. world-landmark handling
12. derive the **next frame's ROI** from the landmarks
13. **tracking** — reuse the previous ROI and skip the detector while tracking
    holds; re-run the detector when tracking is lost
14. landmark + visibility **filtering / smoothing** (single-person mode)

This is a fully doable project — but it is a small computer-vision pipeline, not
"a couple of `Invoke()` calls." Honest one-line summary for the rest of the docs:

> The task bundle contains two TFLite models. The shipping host uses
> LiteRT/XNNPACK directly and implements a narrowly-scoped Pose Landmarker
> pipeline (preprocessing, detector decoding, rotated ROI, landmark decoding,
> tracking, smoothing, coordinate transforms). The browser MediaPipe
> implementation is the behavioral reference.

## How big is MediaPipe C++ — two different answers

- **Runtime binary:** not necessarily huge. A CPU-only Pose Landmarker (no GPU,
  audio, OpenCV widgets, other tasks) links down to tens of MB of core runtime
  (for scale: Android `tasks-core` ≈ 20.4 MB, the `tasks-vision` wrapper ≈ 221 KB
  — not directly a stripped ARM64 figure, but the order of magnitude). Plus models
  (lite ~3 MB / full ~6 MB / heavy ~26 MB). **Tens of MB is fine on a Pi 5.**
- **Build system:** this is the heavy part. Official MediaPipe C++ assumes the
  MediaPipe repo + Bazel/Bazelisk + the graph/calculator framework: Bazel
  alongside Ranger's CMake, many transitive C++ deps, ARM64 build upkeep, long
  clean builds, version-bump churn, and a harder-to-debug monolith.

## Three realistic options

**A. Full MediaPipe C++ as a bounded, separately-built `.so`.** Do **not** pull
MediaPipe's source into Ranger's CMake. Build a narrow library with Bazel that
exposes a tiny C ABI, and have `game_sdl` link only to it:

```c
typedef struct RgPoseContext RgPoseContext;
RgPoseContext* rg_pose_create(const char* task_path, int thread_count);
int  rg_pose_process_rgb(RgPoseContext* ctx, const uint8_t* pixels,
                         int width, int height, int stride,
                         int64_t timestamp_us, RgPoseResult* result);
void rg_pose_destroy(RgPoseContext* ctx);
```

→ `libranger_pose_mediapipe.so`; MediaPipe's build world stays isolated from
Ranger. Pros: most likely to match the web demo; tracking/ROI/smoothing already
implemented; easy model-version swaps. Cons: Bazel build dependency; cross-compile
upkeep.

**B. Raw TFLite + a small `RangerPosePipeline`** (what `native_bench/` starts).
LiteRT builds cleanly for ARM/aarch64 with CMake + a C++ API + XNNPACK, so the
inference runtime fits Ranger's CMake world; you implement steps 1–14 yourself.
Pros: no MediaPipe framework, one CMake build, small/manageable, exactly the
needed feature set. Cons: you own the CV pipeline; small ROI/decode errors
degrade recognition a lot; web and native won't automatically match; a new `.task`
can change tensors/metadata. Viable **because the requirements are narrow**: one
person, no segmentation mask, 33 landmarks, CPU, one known model bundle.

**C. Reference-first, then replace (safest).** Stand up the full MediaPipe
reference, record detector outputs / ROIs / landmarks / next-frame ROI, build the
raw-TFLite pipeline, and compare frame-by-frame until they match closely enough —
then drop the MediaPipe dependency from the shipping build.

**Recommendation: B, executed with C's safety net — and the safety net already
exists.** The browser MediaPipe PoC is the reference oracle. Build the native
raw-TFLite pipeline and diff its landmarks against the browser output on the same
images before trusting it. That reuses what's built and keeps a single CMake
shipping runtime. Reach for A only if matching MediaPipe exactly proves too costly
to reproduce.

## Threading — the inference thread must NOT touch wasm3 memory

Pose inference runs off the game loop, so it cannot write RGP1 straight into
wasm3 linear memory — that races the guest's read and yields half-written
snapshots. Use a host-owned double buffer with an atomic publish; **only the game
thread ever touches wasm3 memory**:

```
camera/inference thread → PoseSnapshot slot A/B → atomic index swap
game thread → copies the whole latest RGP1 into wasm3 memory → guest update()
```

```cpp
struct PoseSlot { uint32_t sequence; RgPoseFrame frame; };
PoseSlot slots[2];
std::atomic<int> publishedSlot;   // inference writes the inactive slot, publishes with one swap
```

The game thread reads `publishedSlot`, copies that complete snapshot into RGP1 in
wasm3 memory just before `update()`, and the guest reads it via `rg_pose_*`. RGP1
in the guest is written by one thread only.

## CPU/thread budget — likely the real constraint, not binary size

The Pi 5 has 4 cores. If pose inference pins 4 XNNPACK threads while `game_sdl`
also runs game logic, physics, EVG, rendering and frame decode, inference can grab
every core exactly when a frame is due. Don't chase max inference FPS. Start:

```
XNNPACK threads = 2
camera        = 30 FPS
inference     = 10–15 FPS   (tracking amortizes the detector)
game          = 60 FPS
```

Then measure 1/2/3/4 threads on a real Pi 5 — best inference FPS ≠ best overall
game feel. `native_bench/` takes `--threads N` for exactly this sweep.

## Unpack the `.task` at build time (+ a validated manifest)

The shipping runtime shouldn't parse MediaPipe's ZIP bundle. A build tool extracts
the models and emits a manifest so a model swap can't silently change the tensor
layout the pipeline assumes:

```
pose_landmarker_lite.task → pose_detector.tflite
                            pose_landmarks_detector.tflite
                            pose_manifest.json
```

```json
{
  "pipeline": "ranger-pose-v1",
  "detectorSha256": "…",
  "landmarkerSha256": "…",
  "detectorInput":  [1, 224, 224, 3],
  "landmarkerInput":[1, 256, 256, 3],
  "landmarkCount": 39,
  "publicLandmarkCount": 33
}
```

The runtime accepts only a manifest whose output layout it knows and has tested.
(`mediapipe_poc/extract-tflite.sh` does the unpack + sha; shapes are read/confirmed
from the models by `native_bench`.)

## Integration point in `game_sdl`

The native `PoseProvider` (however inference is hosted — A or B) owns the camera +
the inference thread + the A/B snapshot buffer. The **game thread** copies the
published snapshot into RGP1 in wasm3 linear memory just before the guest's
`update()` — the same slot input is written today
(`scripting/wasm_physics_runner.rgr:652`). The guest (`pose_demo`, unchanged)
reads `rg_pose_*`.

## Milestones (built/measured ON THE PI — the only meaningful numbers)

1. **`native_bench` perf + first-order correctness** (Option B skeleton) — time
   both models with XNNPACK on a still image; sweep thread counts. Landmark
   accuracy is *partial* here (see its README: heatmap refinement, smoothing,
   tracking, world-landmarks not yet implemented).
2. **Validate against the browser reference** — diff native landmarks vs the
   `mediapipe_poc` output on the same images; close the gaps (heatmap refine, ROI,
   normalization) until they match.
3. **Tracking + smoothing + next-frame ROI** — video-mode behavior; detector runs
   only on acquisition/loss.
4. **Threaded PoseProvider + A/B snapshot** into `game_sdl`; game thread writes
   RGP1 into wasm3 memory before update.
5. **`pose_demo` reacts on the native host.**

## Honest status

- I **cannot build/measure TFLite in this x86 sandbox** (heavy CMake build +
  allowlist-restricted dep fetches). Real numbers come from building on the Pi.
- `native_bench/` is a **first-order Option-B prototype**: correct TFLite API
  usage, preprocessing, anchor gen, a *simplified* detector decode (top-1, no
  weighted NMS), rotated ROI, landmark back-projection, and timing. It does **not
  yet** do heatmap refinement, smoothing, tracking, or world-landmarks — so its
  landmark accuracy is provisional; its **timing** is representative. Validate
  against the browser reference before trusting the landmarks.
