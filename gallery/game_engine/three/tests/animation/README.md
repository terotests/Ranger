# animation — keyframe sampling + mixer through the interpreter

## What is tested

Keyframe animation with **no rendering**, by seeking a mixer and reading the target
object's TRS back. `animation_scene.tsx` builds a clip with three tracks on a mesh:

- **position** — `VectorKeyframeTrack('.position', [0,1,2], …)` — linear
- **quaternion** — `QuaternionKeyframeTrack('.quaternion', …)` — identity → 90° → 180°
  about Y, interpolated with **slerp**
- **scale** — `VectorKeyframeTrack('.scale', [0,2], …)` — linear

The test seeks the mixer to `t ∈ {0, 0.5, 1, 1.5, 1.9}`, reconciles, and checks the
animated entity's `position` / `quaternion` / `scale` against real three.js
(`../../reference/animation_goldens.json`). The slerp is three.js-exact: at t=0.5 the
quaternion is 45° about Y `(0, 0.38268, 0, 0.92388)`, at t=1.5 it is 135°.

## How it works — args from the interpreter, math in Ranger

```
animation_scene.tsx   new THREE.QuaternionKeyframeTrack(…)  (times + values only)
   →  ComponentEngine interprets; seek(t) sets mixer.time
   →  ThreeTsxBridge.syncAnimation builds the host clip once from the interpreted
      tracks, resolves the mixer's TARGET by __uid, and applies at mixer.time
   →  ThreeAnimationMixer.applyAt samples each track (ThreeKeyframeTrack) and writes
      .position / .quaternion / .scale onto the target ThreeObject3D
   →  three_animation_test.rgr reads the entity's TRS back and diffs vs goldens
```

Interpolation matches three.js: `LinearInterpolant` (component lerp) for
number/vector, `Quaternion.slerp` (dot-flip, `acos`/`sin`, lerp+normalise near
parallel) for quaternion.

### Target binding

The scene adds a **static** mesh first, so the animated mesh is host **handle 2**,
not 1. The mixer's `target` is resolved by a `__uid` the façade stamps on each mesh
(the interpreter's `===` on objects is unreliable), so the test proves real target
binding — not "animate the first mesh".

## What was added to close this gap

- **object model** (`../../src/three_animation.rgr`, new): `ThreeKeyframeTrack`
  (`sample(t)` — linear + slerp), `ThreeAnimationClip`, `ThreeAnimationMixer`
  (`applyAt(t, target)`). Pure Ranger — compiles to ES6 + C++.
- **façade** (`../../tsx/three.tsx`): `VectorKeyframeTrack` / `NumberKeyframeTrack` /
  `QuaternionKeyframeTrack` / `AnimationClip` / `AnimationAction` / `AnimationMixer`
  arg-holders, plus a `__uid` on meshes.
- **bridge** (`../../tsx/three_tsx_bridge.rgr`): `syncAnimation` builds the host clip
  once, resolves the target by uid, and applies at the mixer's time each reconcile
  (after `syncScene`, so it overrides the static transform). Scenes with no `mixer`
  global are unaffected.

## Result

**15/15 PASS** (position / quaternion / scale at 5 times).

## Crossfade (blended actions)

`crossfade_scene.tsx` + `three_crossfade_test.rgr` cover **two clips playing at
once**, blended by per-action `setEffectiveWeight` — three.js
`NormalAnimationBlendMode`: **weighted lerp** for position/scale, **incremental
slerp** for quaternion (ratio = wᵢ / cumulative-weight, in action order). The test
checks three weight splits at a fixed time against real three.js
(`../../reference/crossfade_goldens.json`): `1/0` (pure A), `0.5/0.5` (→ the two
±90° rotations cancel to identity), `0.25/0.75` (→ −45° about Y). **6/6 PASS.**

The mixer holds N weighted layers (`ThreeAnimationLayer`); a single action is just
the 1-layer case, so the plain animation test runs the same blended path.

## Not yet covered (next steps in this area)

- **looping / clamping** past the clip duration (`LoopRepeat` wrap), and
  `InterpolateDiscrete` / `InterpolateSmooth` (cubic) interpolation modes;
- **morph-target** animation;
- driving the mixer from a real per-frame `update(dt)` loop rather than absolute
  `setTime` seeks (the façade supports `update(dt)`; the test uses `setTime`).
- crossfade weights that **animate over time** (`crossFadeTo` ramps) — the weights
  are re-read each frame, so a time-varying ramp already works; only a test is missing.

## Files

| File | Role |
|---|---|
| `animation_scene.tsx` | The JS scene the interpreter runs (clip + mixer on a mesh). |
| `three_animation_test.rgr` | Seek + reconcile + read the entity TRS vs goldens. |
| `../../reference/gen-animation-goldens.mjs` → `animation_goldens.json` | Sampled TRS from the real three.js mixer. |
