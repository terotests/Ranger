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

## Files

| File | Role |
|------|------|
| `ranger/WatchEvgLib.rgr` | Entry |
| `ranger/WatchEVGSceneBuilder.rgr` | DTO → EVG tree |
| `ranger/EVGSVGRenderer.rgr` | EVG → SVG |
| `ranger/WatchBezelSegmentMath.rgr` | Segment arc angles |
| `watch_evg_test.rgr` | CLI tests |

Plan: [realtrainer/ai/WATCH_EVG_POC_PLAN.md](../../../realtrainer/ai/WATCH_EVG_POC_PLAN.md)
