# Is EVG too heavy for smart watches?

**Verdict: no — not for watch-sized scenes.** A typical bezel face or short workout list stays
well under a 30 Hz / 60 Hz frame budget on the Android painter path, and scales into a
comfortable WatchOS estimate. What *is* too heavy is phone-dashboard EVG (hundreds of
commands, thousands of table rows) — do not ship that tree to a watch.

## What was measured

Two 390×390 scenes (Apple Watch / Wear face size used by `WatchEVGSceneBuilder`):

| Scene | What it exercises |
| --- | --- |
| **bezel** | Existing watch face: arc strokes + centre labels → display list → paint |
| **list** | CSS flex workout list: style → layout → display list → paint |

Hosts:

1. **Node ES6** — CPU pipeline only (`npm run watch:evg:bench`)
2. **Android painter on JVM** — same generated Kotlin + `EvgPainter` the phone ports use,
   with `AwtEvgSurface` as the off-device stand-in for `android.graphics.Canvas`
   (`npm run watch:evg:bench:android`). This is the repository's established Android
   measurement path (`ui:android:verify`, `pptx:android:verify`). No device SDK required.

Machine for the numbers below: 4× Intel Xeon (cloud agent), OpenJDK 21, Kotlin 2.1.10,
Node 22. Medians of 9 timed runs after warmup.

## Android painter results (authoritative for paint)

`EvgPainter` + `AwtEvgSurface` @ 390×390:

| scene | n | els | cmds | build ms | paint ms | **total ms** |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| bezel | 4 | 8 | 7 | 0.29 | 2.11 | **2.40** |
| bezel | 8 | 12 | 11 | 0.35 | 2.27 | **2.61** |
| bezel | 12 | 16 | 15 | 0.37 | 3.34 | **3.71** |
| list | 4 | 20 | 21 | 2.10 | 1.23 | **3.33** |
| list | 8 | 32 | 33 | 1.05 | 1.15 | **2.20** |
| list | 12 | 44 | 45 | 1.79 | 0.91 | **2.70** |

Re-run anytime:

```bash
npm run watch:evg:bench:android
```

PNGs land in `tmp/watch-evg/`. Generated watch facade is ~14k Kotlin lines / ~400 KB source
(layout + stylesheet + display list + scenes) — far smaller than the UI dashboard port (~46k).

## Node CPU pipeline (sanity)

Same scenes, no paint (`npm run watch:evg:bench`):

- Bezel build+list: **~0.2 ms**
- List full rebuild (style+layout+list): **~0.5–0.7 ms**

Node is faster at tree work than the Kotlin port here; paint dominates on the Android path
for the bezel (path stroke flattening), while list cost is split between build and paint.

## Frame budgets

| Mode | Budget | Watch EVG headroom (Android measure) |
| --- | --- | --- |
| Interactive 30 Hz | 33 ms | measured totals ~2–4 ms → large margin |
| Smooth 60 Hz | 16.7 ms | measured totals fit; leave room for sensors / host |
| Always-on ~1 Hz | 1000 ms | trivial |

## WatchOS estimate

There is no WatchOS / Core Graphics port in-tree yet. Estimate from the Android painter
numbers and typical SoC ratios:

| Step | Factor | Notes |
| --- | --- | --- |
| Xeon JVM → mid phone | ~2–3× | single-thread UI / managed code |
| Phone → Wear OS / Apple Watch | ~2–3× | lower clocks, thermal limit |
| **Stack → watch (conservative)** | **~4–8×** | applied to *total* build+paint |
| Paint backend | ~1× | Core Graphics / Skia both handle short vector lists well |

Applying **4–8×** to the measured Android totals:

| scene (n=8) | Android total | WatchOS estimate (full rebuild) | WatchOS estimate (paint-only) |
| --- | --- | --- | --- |
| bezel ×8 | ~2.6 ms | **~10–21 ms** | **~9–18 ms** |
| list ×8 | ~2.2 ms | **~9–18 ms** | **~5–9 ms** |

**WatchOS reading:** a full rebuild of a realistic face or short list is usually inside a
30 Hz interactive budget, and paint-only updates (timer tick, highlight) should clear 60 Hz
if the display list is retained. Always-on / complication-rate updates are not CPU-bound.

Risks that *would* make EVG too heavy on watch:

- Porting phone dashboards (hundreds of cmds; `ui:android:verify` paints **352** on a tablet)
- Rebuilding large CSS trees every tick instead of retaining the display list
- Bitmap-tracer / heavy gradients / full-screen ripple-style post-process every frame
- Shipping the whole Office/UI stack binary when only the face modules are needed

## Recommendations

1. **Ship watch UI as small EVG scenes** (bezel + short lists), not scaled-down phone pages.
2. **Retain the display list** across ticks; rebuild on data change only.
3. Prefer the existing SVG host for the web emulator; use `EvgPainter` + Canvas/CoreGraphics
   on device — the display list is the shared seam.
4. Re-measure on a real Wear device / WatchOS once a host exists; treat the 4–8× band as a
   planning range, not a substitute for on-device sampling.

## Files

| Path | Role |
| --- | --- |
| `bench/WatchEvgBench.rgr` | Scenes + phase helpers |
| `bench/watch-evg-bench.mjs` | Node timing harness |
| `android/ranger/watch_evg_android.rgr` | Kotlin facade → `EVGDisplayList` |
| `android/desktop/.../BenchWatch.kt` | Android painter timing |
| `android/scripts/bench-desktop.sh` | Build + run |
