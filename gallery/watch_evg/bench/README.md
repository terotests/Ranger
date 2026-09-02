# `gallery/watch_evg/bench` — is EVG too heavy for a watch?

The question, made falsifiable. Three watch-shaped screens on a 454×454 panel,
run through EVG's whole CPU pipeline on **four** targets, with the phases split
out so an answer points somewhere.

Read the finding in **[WATCH_PERFORMANCE.md](../WATCH_PERFORMANCE.md)**. This
file is how to reproduce it.

```bash
# the Wear OS number — Ranger → Kotlin, painted through gallery/evg/android
bash gallery/watch_evg/bench/scripts/run-jvm.sh --png     # writes tmp/watch-bench/*.png
bash gallery/watch_evg/bench/scripts/run-jvm.sh --c1      # C1 only: the ART-quality bracket

# the watchOS proxy — Ranger → C++, ahead-of-time, refcounted
bash gallery/watch_evg/bench/scripts/run-native.sh

# the JavaScript build, which is what the watch dev emulator runs today
bash gallery/watch_evg/bench/scripts/build-ranger.sh
node gallery/watch_evg/bench/watch-bench.mjs
```

`--json` on any of them prints the same numbers as JSON. The same four under
short names, from the repository root:

```bash
npm run watchevg:bench          # Kotlin on a JVM
npm run watchevg:bench:c1       # …with C2 off, the ART-quality bracket
npm run watchevg:bench:native   # C++, ahead of time
npm run watchevg:bench:js       # JavaScript on Node
```

`run-jvm.sh` needs `kotlinc` on PATH and a JDK; `run-native.sh` needs a C++17
compiler. Neither needs an Android SDK.

## The scenes

| Scene | Elements | Commands | What it is |
| --- | ---: | ---: | --- |
| `face` | 82 | 83 | A dial: 60 minute ticks placed on the circle and rotated, four numerals, a goal arc as a real cubic path, a digital time, a date, three complications |
| `list` | 62 | 52 | A Wear list of chips — icon, title, subtitle — clipped to the panel |
| `workout` | 18 | 21 | One enormous number, four stat tiles, a progress bar |

The tick ring is the point of `face`: sixty absolutely-positioned elements that
no layout pass can skip, which is what a watch face really is and what a
1600-row table benchmark never tells you.

## The phases

`build` `style` `layout` `list` are the pipeline, split the way
[`gallery/ui/bench`](../../ui/bench) splits it — a total that says a frame
costs 4 ms gives you nowhere to start.

Then the two mutations a watch actually performs, which are what the answer
turns on:

* **`tick`** — the clock's seconds change. One text run, on a tree that stands.
  This runs once a second, forever, and on an always-on face it is the *only*
  thing that ever runs.
* **`scroll`** — the crown turned. Layout must run; nothing about the tree
  changed. This is the 60 fps path.

And `cold`, measured once per process before anything is warm, because a watch
app is launched, draws, and is killed — the frame a person waits for is not the
steady-state one.

## Why four targets

| Target | Stands for | Runs |
| --- | --- | --- |
| Kotlin on a JVM, C2 | Wear OS, optimistic | `run-jvm.sh` |
| Kotlin on a JVM, C1 only | Wear OS on an ART-quality JIT | `run-jvm.sh --c1` |
| C++, `-O2`, `shared_ptr` | watchOS: AOT, native, refcounted like ARC | `run-native.sh` |
| JavaScript on Node | the watch dev emulator's own build | `watch-bench.mjs` |

There is no Android device or emulator in this repository's CI (an emulator
needs KVM) and no Swift toolchain, so none of these is the hardware. What makes
them useful anyway is **`calibrate`**: a fixed scalar loop in the same generated
code, reported by every harness. Run any of these on a real device and the ratio
of the two calibration figures scales every other number — no clock-speed
arithmetic required.

## What is here

| Path | What it is |
| --- | --- |
| `WatchBench.rgr` | The three scenes and the phase entry points |
| `watch.css` | The stylesheet they lay out against |
| `desktop/…/WatchBenchMain.kt` | The Kotlin harness — and the paint pass, through `gallery/evg/android` |
| `native/watch_bench_main.cpp` | The C++ harness |
| `watch-bench.mjs` | The Node harness |
| `scripts/` | Ranger→JS/Kotlin/C++, and the two runners |

Nothing generated is checked in: `bin/`, `generated/` and `tmp/watch-native/`
are compiler artefacts of `WatchBench.rgr` and the `gallery/evg` tree, and a
stale copy is how a benchmark starts measuring last month's layout engine.

**License: AGPL-3.0-or-later** (Gallery).
