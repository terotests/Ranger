# MediaPipe Pose PoC — headless performance probe (no camera)

Goal: **before buying a webcam for the Raspberry Pi**, prove the MediaPipe pose
integration works and get a feel for inference cost — running the real
`PoseLandmarker` (MediaPipe Tasks Vision, WASM) over **static sample images**,
then mapping the landmarks into the exact **RGP1** pose shape the Ranger game
reads (see `../../PLAN_PROVIDERS.md`). This is the concrete realization of the
`MediaPipeWorkerSource` from that plan's §6.1.

It is the source side of the chain, exercised in isolation:

```
[ MediaPipe PoseLandmarker ] → landmarks → [ map to RGP1 ] → present, gesture, nose x/y
        (this PoC)                            (poc.mjs)          (what the game reads)
```

## What it does

- Loads `PoseLandmarker` from the **local** WASM fileset (`./wasm`, no CDN).
- Runs `detect()` over each sample image, warmup + 20 timed iterations.
- Classifies a gesture from the landmarks (arms-up / lean) and writes
  `present, gesture, count, nose(x,y)` into an RGP1-shaped `Int32Array` — the
  same bytes a real worker would publish into the `SharedPoseBuffer`.
- Reports latency (min / median / mean / p95) per model variant.

## Run it

```bash
cd gallery/game_engine/pose/mediapipe_poc
npm install                 # @mediapipe/tasks-vision + playwright (npm only, no CDN)
bash fetch-assets.sh        # copies the WASM fileset + downloads the .task models
node bench.mjs              # headless Chromium via Playwright
```

Uses the pre-installed Chromium. In this environment point Playwright at the
headless-shell binary and pick a delegate:

```bash
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export POC_CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
POC_DELEGATE=CPU node bench.mjs      # or GPU
```

## Results so far (x86 dev container — NOT a Pi)

CPU delegate, 20 iterations, pure `detect()` time (ms):

| model | image | median | fps | p95 | detected | RGP1 gesture |
|---|---|---:|---:|---:|:--:|:--|
| lite | pose.jpg (1000×667) | **56.5** | 17.7 | 65.5 | 1 pose | `ARMS_UP` ✓ |
| lite | portrait.jpg (820×1024) | **69.7** | 14.4 | 89.5 | 1 pose | `NONE` ✓ |
| full | pose.jpg | **74.9** | 13.4 | 78.1 | 1 pose | `ARMS_UP` ✓ |
| full | portrait.jpg | **88.7** | 11.3 | 104 | 1 pose | `NONE` ✓ |

Model init (one-time): ~0.3–0.6 s. The RGP1 mapping is real — `pose.jpg` (arms
raised) classifies as `ARMS_UP`, `portrait.jpg` as `NONE`, with the nose landmark
carried through to world-unit fixed-point coordinates the game consumes.

### Read these numbers carefully

- **This is x86, not the Pi 5.** Absolute ms will differ on ARM. Treat this as
  "integration works + relative model cost (lite ≈ 0.75× full)", not a Pi figure.
- **The GPU delegate here is meaningless.** This container has no real GPU;
  Chromium falls back to SwiftShader (software GL), so `GPU` delegate measured
  ~10× *slower* (~615 ms). On the Pi 5 the GPU delegate would use the real
  VideoCore GPU and could beat CPU — which is exactly why the Pi result can't be
  extrapolated from here and must be measured on the device.
- Timings are inference only. A live pipeline adds camera capture + frame decode;
  the landmark→RGP1 copy is negligible (a few hundred bytes).

## Getting the real Pi number

The harness is device-agnostic — run the *same page* in the Pi's Chromium:

1. `npm install && bash fetch-assets.sh` on the Pi.
2. Serve this dir with COOP/COEP (as `bench.mjs` does) and open it in Chromium,
   or run `node bench.mjs` if Playwright's Chromium is available on the Pi.
3. Compare `CPU` vs `GPU` delegate — on the Pi the GPU path is the one that
   matters, and `lite` is the variant to start from for real-time.

That gives an apples-to-apples Pi latency to decide the webcam/target before any
hardware purchase.

## Files

- `poc.mjs` — browser side: load model, run inference, map landmarks → RGP1.
- `bench.mjs` — Node driver: local COOP/COEP server + Playwright + report.
- `index.html` — tiny host page.
- `fetch-assets.sh` — pulls the non-committed WASM fileset + models.
- `assets/images/` — MediaPipe public test images (committed; small).
