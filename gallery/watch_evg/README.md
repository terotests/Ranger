# Watch EVG — shared watch face pipeline

Ranger module for **Watch Dev Emulator** and future Wear Android POC.

## Build

```bash
cd gallery/watch_evg
npm run build:ranger
npm test
```

Output: `generated/watch_evg.js` (+ Kotlin when `-l=kotlin` is added).

## Architecture

```
WatchExerciseRowInput (+ host strokePathD / textPathD)
        ↓
WatchEVGSceneBuilder → EVGElement tree
        ↓
EVGSVGRenderer → SVG string + WatchEVGHitMap
```

**P0 note:** Arc `d` paths are computed in the host (TS/Kotlin) via `bezelSegmentModel` until Ranger `watchCos`/`watchSin` typecheck is fixed. Ranger owns layout angles (`calculateSegmentArcs`), scene tree, SVG output, and hit regions.

## Web consumer

```bash
cd realtrainer/app-ranger/demo/watch-dev-emulator
npm run build:watch-evg   # copies generated/watch_evg.js
npm run dev               # face: EVG bezel (default)
```

## Is this fast enough for a watch?

Measured, not assumed: **[WATCH_PERFORMANCE.md](WATCH_PERFORMANCE.md)** — three
watch screens through EVG's whole pipeline on four targets, with a Wear OS
number, a watchOS estimate, and the two EVG fixes the measurement turned up.
The benchmark is [`bench/`](bench/README.md).

## The face the bench measures with

The JVM harness installs `AwtTextMeasurer` (`gallery/evg/android`) before
the scenes are built, so every layout in the numbers is measured with the
Java2D face the surface paints with — the same thing a Wear OS host gets from
`AndroidTextMeasurer` through Skia — rather than with EVG's advance table.
The `layout` column therefore includes real text measurement, which is what
a watch pays. A Wear OS host on top of this module is the phone's
`RealTrainerView` with a rotary event in place of a drag: `AndroidTextMeasurer`
and `EvgEngineThread` are not phone-specific — see
`gallery/evg/PLAN_NATIVE_HOSTS.md`, the section on watches.

## Files

| File | Role |
|------|------|
| `ranger/WatchEvgLib.rgr` | Entry |
| `ranger/WatchEVGSceneBuilder.rgr` | DTO → EVG tree |
| `ranger/EVGSVGRenderer.rgr` | EVG → SVG |
| `ranger/WatchBezelSegmentMath.rgr` | Segment arc angles |
| `watch_evg_test.rgr` | CLI tests |

Plan: [realtrainer/ai/WATCH_EVG_POC_PLAN.md](../../../realtrainer/ai/WATCH_EVG_POC_PLAN.md)
