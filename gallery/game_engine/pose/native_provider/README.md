# native_provider — host-side pose threading contract (pure C++)

The shipping-side glue for native pose on the SDL host (see `../NATIVE_EMBED.md`).
No TFLite dependency — it's the threading/ABI contract around whatever runs the
inference, so it builds and is **unit-tested anywhere** (including CI / a laptop).

- `rg_pose.h/.cc`
  - `PoseFrame` / `Landmark` — one complete pose sample.
  - `WriteRgp1()` — serialize a frame into the shared RGP1 v2 block the wasm3 guest
    reads (the canonical `wasm/wasm_pose_abi.h` layout: 64 B header + 24 B landmark
    records, 856 B total, positions NORMALIZED `[0,1]×256`). **Only the game thread
    calls it**, into guest linear memory.
  - `PoseChannel` — lock-free single-producer/single-consumer latest-value channel
    (triple buffer): the inference thread `Publish()`es, the game thread
    `Latest()`s, no tearing, no locks. The robust form of the A/B-swap sketch.
  - `OneEuroFilter` / `PoseSmoother` — temporal landmark smoothing (video mode).
  - `RoiFromLandmarks()` — derive the next-frame ROI (tracking, so the detector is
    skipped while tracking holds).
  - `PoseWorker` — runs an `infer(ts)->PoseFrame` callback on its own thread at a
    target FPS, smooths, and publishes. The TFLite pipeline (`../native_bench`)
    plugs in as `infer`; here it's any callable, so it's testable with a mock.

## Build & test (no deps beyond g++)

```bash
g++ -std=c++17 -O2 -pthread rg_pose.cc rg_pose_test.cc -o rg_pose_test && ./rg_pose_test
```

`rg_pose_test.cc` verifies the RGP1 byte layout, gesture classification, the
channel under real thread contention (200k frames: no torn frames, no backward
sequence), the 1€ filter (variance reduction), the ROI math, and the worker. All
pass on x86; run it on the Pi (the provider path is where correctness matters) via
`../build-pose-native-pi.sh`.

## How it wires into game_sdl

```
camera → PoseWorker(infer = native_bench TFLite pipeline) → PoseChannel
                                                                │ Latest()
game loop (game thread): PoseChannel.Latest(&frame)
                         → WriteRgp1(frame, wasm3_mem + rgp1_off)
                         → guest update()   // reads rg_pose_*
```

The inference thread never touches wasm3 memory; the game thread copies one
complete RGP1 snapshot per frame. This is the threading model from
`../NATIVE_EMBED.md`.
