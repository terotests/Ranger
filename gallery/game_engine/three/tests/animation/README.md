# animation — PLANNED (not runnable yet)

> Status: **blocked on object-model + façade wiring.** This folder documents what
> the test should check; there is no runner here yet. Animation sampling is pure
> math, so it is fully testable **without rendering** once the object model exists.

## What should be tested

Keyframe sampling and clip playback, by reading the sampled value at a given time
and comparing to real three.js:

- **scalar linear interpolation** — a `KeyframeTrack` with times `[0, 1, 2]` and
  values `[0, 10, 0]`; sample at `t = 0.5` → `5`, `t = 1.5` → `5`, `t = 2` → `0`.
- **vector track** — `VectorKeyframeTrack` (position x/y/z) sampled mid-segment.
- **quaternion track** — `QuaternionKeyframeTrack` sampled with **slerp** (not
  lerp) between two orientations; check the interpolated quaternion is unit-length
  and matches three.js at `t`.
- **clamping / looping** — sampling before the first / after the last key, and
  `LoopRepeat` wrap-around time.
- **mixer applies to an object** — an `AnimationMixer` bound to an `Object3D`
  advanced by `dt` sets the object's `position` / `quaternion` to the sampled
  value (read the internal `ThreeObject3D` back).

Internal objects to read back: the sampled track value, and after a mixer update,
`ThreeObject3D.position` / `.quaternion`.

## Why it can't run yet

There is **no animation object model and no façade**: no `AnimationMixer`,
`AnimationClip`, `KeyframeTrack`, or interpolants exist in `three/src`, and nothing
in `three.tsx`. So there is nothing to construct or sample.

## Plan to unblock

1. Add a minimal object model in `../../src/`:
   - `ThreeKeyframeTrack` — times + values + component width; `sample(t)` doing
     linear interpolation (scalar/vector) and **slerp** for quaternion tracks.
     This alone is unit-testable with no façade.
   - `ThreeAnimationClip` — a named bag of tracks with a duration.
   - `ThreeAnimationMixer` — binds a clip to a `ThreeObject3D`, `update(dt)`
     advances time and writes sampled values onto the target's TRS.
2. Add façade `AnimationMixer` / `AnimationClip` / `*KeyframeTrack` arg-holders and
   the bridge/host wiring so an interpreted scene can drive a mixer.
3. Add `gen-animation-goldens.mjs` (sample the same tracks in real three.js at the
   same times), an `animation_scene.tsx`, and a runner.

Start with step 1 (the `KeyframeTrack` sampler): it is the highest-value, purely
no-render piece and can be validated against three.js immediately.

## Files (planned)

| File | Role |
|---|---|
| `animation_scene.tsx` | JS scene building a clip + mixer on an object. |
| `three_animation_test.rgr` | Sample tracks / advance the mixer, read values vs goldens. |
| `../../reference/gen-animation-goldens.mjs` → `animation_goldens.json` | Sampled values from real three.js at the test times. |
