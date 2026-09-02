# Watch EVG — shared watch face pipeline

Ranger module for **Watch Dev Emulator** and future Wear Android POC.

## Build

```bash
cd gallery/watch_evg
npm run build:ranger
npm test
```

Output: `generated/watch_evg.js` (+ Kotlin when `-l=kotlin` is added).

## Is it too heavy for a watch?

No for watch-sized scenes. Measured on the Android painter path @ 390×390:
**~2–4 ms** build+paint for a bezel face or short list; WatchOS estimate **~9–21 ms**
full rebuild (4–8×). Details: [`WATCH_PERF.md`](WATCH_PERF.md).

```bash
npm run watch:evg:bench            # from repo root — Node CPU pipeline
npm run watch:evg:bench:android    # EvgPainter + AWT (Android off-device path)
```

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
| `bench/` | Watch-sized CPU bench |
| `android/` | Android painter timing harness |
| `WATCH_PERF.md` | Smartwatch feasibility numbers |

Plan: [realtrainer/ai/WATCH_EVG_POC_PLAN.md](../../../realtrainer/ai/WATCH_EVG_POC_PLAN.md)
