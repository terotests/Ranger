# Is EVG too heavy to run on a smartwatch?

**No — with three conditions, and after two fixes this measurement found.**

Measured on the language a Wear OS app is written in, estimated for watchOS, and
every number reproducible from [`bench/`](bench/README.md).

---

## The short answer

On a 454×454 Wear OS panel, the busiest of three real watch screens — a dial
with sixty minute ticks, four numerals, a goal arc, a clock and three
complications — costs EVG **0.91 ms** of CPU for a full declarative rebuild and
**0.12 ms** to re-run style, layout and the display list on a tree that stands.
That is on this benchmark host with the JIT held to C1, which is the pessimistic
bracket for ART.

Scaled to a Cortex-A53/A55 Wear OS core at ~1.5 GHz — the little cores in a
Snapdragon W5 or an Exynos W930, and the slowest thing EVG would meet — that is
roughly **9 ms** for a full rebuild and **1.2 ms** for a retained frame, against
a 16.7 ms budget at 60 fps.

So the pipeline fits. The three conditions are what the numbers say about *how*:

1. **Don't rebuild declaratively at 60 fps on the little-core parts.** A full
   rebuild is half to four-fifths of a frame there. Animate on the retained
   path, which is 7–10% of one.
2. **Paint through the platform's canvas, not a software rasteriser.** The CPU
   pipeline is not what would kill this; a CPU rasteriser at 454² would be.
3. **Watch the cold frame, not the warm one.** Time-to-first-frame is where a
   watch app is judged, and on a JIT target it is three orders of magnitude
   above the steady state.

---

## What was measured, and what was not

There is no Android device or emulator here — an emulator needs KVM, and this
repository's CI has no Android SDK. There is no Swift toolchain either. So this
is not a device measurement and does not claim to be. What it is:

| Target | Stands for | Honest about |
| --- | --- | --- |
| **Kotlin on a JVM (C2)** | Wear OS, optimistic | HotSpot's C2 is a better compiler than ART's |
| **Kotlin on a JVM (C1 only)** | Wear OS on an ART-quality JIT | The pessimistic bracket. ART sits between the two |
| **C++ `-O2`, `shared_ptr`** | watchOS | AOT, native, and refcounted per object — the same class of cost Swift's ARC charges, which is the one thing a JVM number cannot show |
| **JavaScript on Node** | the watch dev emulator's own build | The real deployment shape of `gallery/watch_evg` today |

Every one of them is the **same generated code** from the same
`WatchBench.rgr`, and the Kotlin one paints through
[`gallery/evg/android`](../evg/android/README.md) — the identical painter and
surface interface the `gallery/ui` and `gallery/pptx` Android ports compile into
their APKs.

What bridges the gap to real silicon is **`calibrate`**: a fixed scalar loop, no
allocation, no library calls, in the same generated code, reported by every
harness. Run any harness on a watch and the ratio of the two calibration figures
rescales every row. The estimates below are estimates; the method for replacing
them with measurements ships with the benchmark.

Host: one core of an Intel Xeon @ 2.80 GHz, `taskset`-pinned, `-Xmx1g`.
`calibrate(2e6)` = 5.7 ms (Kotlin/C2), 8.4 ms (Kotlin/C1), 5.9 ms (C++),
6.0 ms (Node) — so C1 is 1.5× off C2 on scalar arithmetic alone, before any of
EVG runs.

---

## The measurements

Milliseconds per frame, median of 51 after 300 warm-up runs. `cold` is one
sample, taken before anything in the process is warm.

### Kotlin — the Wear OS language

**C2 (optimistic):**

| scene | elems | cmds | build | style | layout | list | paint¹ | tick | scroll | retained | rebuild | cold | heap |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| face | 82 | 83 | 0.073 | 0.001 | 0.025 | 0.044 | 1.271 | 0.104 | 0.083 | 0.080 | 0.406 | 66.8 | 422 K |
| list | 62 | 52 | 0.042 | 0.001 | 0.042 | 0.013 | 0.572 | 0.057 | 0.052 | 0.055 | 0.247 | 26.4 | 305 K |
| workout | 18 | 21 | 0.014 | 0.000 | 0.008 | 0.004 | 0.438 | 0.016 | 0.011 | 0.012 | 0.076 | 9.9 | 112 K |

**C1 only — the ART-quality bracket:**

| scene | build | style | layout | list | paint¹ | tick | scroll | retained | rebuild | cold |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| face | 0.127 | 0.003 | 0.055 | 0.103 | 1.093 | 0.155 | 0.122 | 0.122 | 0.913 | 63.0 |
| list | 0.072 | 0.002 | 0.121 | 0.039 | 0.716 | 0.120 | 0.161 | 0.163 | 0.683 | 27.4 |
| workout | 0.022 | 0.001 | 0.027 | 0.011 | 0.611 | 0.039 | 0.041 | 0.042 | 0.229 | 3.6 |

¹ `paint` is Java2D, in **software**, on a CPU. It is an upper bound on a stage
a watch runs on its GPU, and it is the one column that does not transfer. See
the second condition below.

### C++ — the watchOS proxy

| scene | build | style | layout | list | tick | scroll | retained | rebuild | cold |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| face | 0.159 | 0.002 | 0.028 | 0.038 | 0.176 | 0.086 | 0.079 | 0.426 | **1.19** |
| list | 0.127 | 0.001 | 0.067 | 0.023 | 0.122 | 0.087 | 0.087 | 0.331 | 0.40 |
| workout | 0.032 | 0.000 | 0.014 | 0.007 | 0.035 | 0.020 | 0.021 | 0.095 | 0.20 |

### JavaScript on Node

| scene | build | style | layout | list | tick | scroll | retained | rebuild | cold |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| face | 0.198 | 0.002 | 0.059 | 0.053 | 0.215 | 0.124 | 0.149 | 0.680 | 28.9 |
| list | 0.143 | 0.003 | 0.177 | 0.034 | 0.182 | 0.131 | 0.127 | 0.464 | 11.4 |
| workout | 0.040 | 0.000 | 0.024 | 0.011 | 0.052 | 0.035 | 0.036 | 0.134 | 2.8 |

Stylesheet parse, once at startup: 1.20 ms (Kotlin/C2), 0.37 ms (Kotlin/C1),
0.06 ms (C++), 0.20 ms (Node).

---

## Scaling to real watches

The scaling factors below are **estimates from published silicon**, not
measurements, and they are the weakest link in this document. They are stated as
bands, and the verdict is taken at the pessimistic end of each.

| Class | Parts | Cores | Estimated factor vs this host | Basis |
| --- | --- | --- | ---: | --- |
| Wear OS, little | Snapdragon W5 / W5+ Gen 1 (Pixel Watch 2–3), Wear 4100+, Exynos W920/W930 (Galaxy Watch 4–6) | 2–4 × Cortex-A53/A55 @ 1.18–1.7 GHz | **×10** (8–15) | In-order, dual-issue, small caches, against an out-of-order server core at 2.8 GHz, on branchy pointer-chasing allocation-heavy code |
| Wear OS, big | Exynos W1000 (Galaxy Watch 7 / Ultra) | 1 × Cortex-A78 @ 1.6 GHz | **×3** (2–4) | Out-of-order, 4-wide, a real cache |
| watchOS | Apple S9 / S10 SiP | 2 × 64-bit A-series-derived @ ~1.5–2.0 GHz | **×3** (2–3.5) | A-series-derived big cores, well ahead of A55 |

### Wear OS, on the slowest parts in the field

The C1 column × 10:

| | face | list | workout | share of a 60 fps frame |
| --- | ---: | ---: | ---: | --- |
| rebuild (declarative, from nothing) | 9.1 ms | 6.8 ms | 2.3 ms | 55%, 41%, 14% |
| retained (the tree stands) | 1.2 ms | 1.6 ms | 0.4 ms | 7%, 10%, 3% |
| scroll (crown turning) | 1.2 ms | 1.6 ms | 0.4 ms | 7%, 10%, 2% |
| tick (one text run, once a second) | 1.6 ms | 1.2 ms | 0.4 ms | a 0.16% duty cycle |

At the pessimistic ×15 the face's rebuild is 13.7 ms — 82% of a frame, still
inside it, with nothing to spare. On the W1000's big core (×3) the same rebuild
is 2.7 ms.

The always-on face is the case people worry about for battery, and it is the
least interesting one here: 1.6 ms of CPU once a second on one small core is a
duty cycle of 0.16%, and Wear OS's ambient mode updates once a *minute*. The
panel costs incomparably more than the frame.

### watchOS

The C++ column × 3, then doubled for Swift:

| | face | list | workout |
| --- | ---: | ---: | ---: |
| rebuild | 1.3 → **2.6 ms** | 1.0 → 2.0 ms | 0.3 → 0.6 ms |
| retained | 0.24 → 0.47 ms | 0.26 → 0.52 ms | 0.06 → 0.13 ms |
| scroll | 0.26 → 0.52 ms | 0.26 → 0.52 ms | 0.06 → 0.12 ms |
| cold frame | 3.6 → **7.1 ms** | 1.2 → 2.4 ms | 0.6 → 1.2 ms |

The doubling is the Swift tax: ARC retain/release traffic, exclusivity checks
and cross-module calls that do not inline typically put Swift at 1.0–2.0× C++ on
object-graph code. At the far end, a full rebuild of the busiest screen is 16%
of a 60 fps frame.

**watchOS is the comfortable target**, and the reason is not the CPU. It is that
the target is ahead-of-time compiled, so the cold frame is single-digit
milliseconds instead of tens of them.

---

## The three conditions

### 1. Rebuilding every frame is the only thing that gets close

On the little-core Wear parts a full declarative rebuild of the face is 55–82%
of a 60 fps frame. The retained path is 7%. The gap is a factor of **7.5** and
it is `build` plus a style pass over a tree that was just discarded.

The good news is that the invalidation work already landed: on all three scenes
a `tick` re-styles **0 elements**, skips all 82, and skips layout entirely — the
stylesheet knows nothing it wrote can have moved a box. What is left in a tick
is rebuilding the display list, and that is where the next watch-sized
optimisation goes.

### 2. Paint has to be the platform's

`paint` above is Java2D in software: 0.44–1.27 ms for 21–83 commands at 454² on
a 2.8 GHz server core. Scale that by ten and a software rasteriser costs
**4–13 ms a frame** on a watch — most of the budget on its own, before EVG has
done anything.

This is not a problem, because it is not what a port does: `AndroidEvgSurface`
hands the display list to `android.graphics.Canvas`, which is
hardware-accelerated, and a watchOS port would hand it to Core Graphics. 83
commands is nothing for either. But it is the one place where "EVG is fine on a
watch" would stop being true, so it is worth writing down: **the display list
has to reach a GPU.**

### 3. The cold frame is the number a person feels

| first face frame, cold | Kotlin/C2 | Kotlin/C1 | C++ | Node |
| --- | ---: | ---: | ---: | ---: |
| | 66.8 ms | 63.0 ms | **1.19 ms** | 28.9 ms |

A watch app is launched, draws once, and is killed. On a JIT target the first
frame runs interpreted on classes that are still loading — 63 ms against a
steady state of 0.12 ms, a factor of five hundred. Scaled to a watch core that
is a few hundred milliseconds, and it is the whole of a user's impression. On
the AOT target it is 1.19 ms.

Three things follow. Wear OS's `dex2oat` removes the interpretation but neither
the class loading nor the cold caches, so a Wear number will land below the
JVM's 63 ms and well above the C++ one. A watchOS port, being AOT, gets the good
column for free. And on any target the first screen a watch app draws should be
the cheap one: `workout`'s cold frame is a seventh of `face`'s.

---

## Two fixes this benchmark found

Both were nearly invisible on the JavaScript build, which is how they survived.
Neither is a watch-specific optimisation; both make every target faster. The
before/after below is one controlled sitting: the same host, the same scenes,
the two changes stashed and unstashed between runs.

### `EVGLayout` built a debug string for every element of every layout pass

`log(msg)` takes an already-built string and throws it away unless `debug` is
on. One of the eleven call sites is in `layoutElement`, so **every element of
every layout pass** formatted four doubles into a message nobody read.

On the C++ target this was catastrophic, because `r_double_to_string` goes
through `ostringstream` — a locale, an `ios_base` init and a `printf_fp` per
call. `callgrind` put **47% of all instructions in the layout phase** inside
`vsnprintf`: 2,654 double→string conversions and 4,549 `strtod` calls for a
single layout of an 82-element tree.

Seven sites now build their string inside `if debug`.

| face scene | before | after | |
| --- | ---: | ---: | ---: |
| C++, layout | 2.107 ms | 0.028 ms | **75×** |
| C++, retained frame | 2.158 ms | 0.079 ms | 27× |
| C++, scroll | 2.262 ms | 0.086 ms | 26× |
| C++, rebuild | 2.507 ms | 0.426 ms | 5.9× |
| Kotlin/C2, layout | 0.059 ms | 0.025 ms | 2.4× |
| Node, layout | 0.078 ms | 0.059 ms | 1.3× |

### `EVGStyleSheet.stripComments` was quadratic on every immutable-string target

`out = out + (substring css i (i + 1))`, once per character of the stylesheet.
Where a string is immutable — Kotlin, Swift, C#, Java — that copies the whole
accumulator on every character, so stripping an *n*-byte sheet cost O(n²). V8
hid it completely by concatenating with a rope.

It now appends whole slices between comments. The output is byte-identical on 19
cases, including both real stylesheets in the repository.

| stylesheet parse, 6 KB | before | after | |
| --- | ---: | ---: | ---: |
| Kotlin | 14.18 ms | 1.20 ms | **12×** |
| C++ | 0.41 ms | 0.06 ms | 6.8× |
| Node | 0.33 ms | 0.20 ms | 1.7× |

14 ms of a Wear OS app's startup — of order 140 ms after scaling — for 290 lines
of CSS. Together the two fixes roughly halve the cold first frame on Kotlin
(135.7 ms → 66.8 ms for `face`, 83.6 → 26.4 for `list`) and cut it by nearly
five on C++ (5.73 ms → 1.19 ms).

`npm run test:evg:layout` (1079 assertions) and `npm run ui:test` (165) are
green before and after both fixes. The pre-existing failures in
`test:evg:fonts`, `test:evg:vector` and `gallery/game_engine/v2/evg/run.sh` are
present on `master` unchanged and are unrelated.

---

## Footprint

Neither of the other two things a watch is short of is a problem.

| retained heap: tree + display list | face | list | workout |
| --- | ---: | ---: | ---: |
| | 422 KB | 305 KB | 112 KB |

Wear OS gives an app a per-process heap in the tens to hundreds of megabytes. A
watch screen's worth of EVG is under half a megabyte.

| | |
| --- | ---: |
| Generated Kotlin — the whole engine plus the benchmark | 13,966 lines |
| Compiled to JVM classes | 431 KB in 72 classes |
| The shared painter and both surfaces | 45 KB |
| Native binary, whole engine, `-O2` | 744 KB |

431 KB of class files is roughly 250–350 KB of dex. A Wear OS APK has room for
that several times over.

---

## What would move the numbers next

In the order the measurements suggest:

1. **A display list that survives a tick.** With style and layout already
   skipped, rebuilding all 83 commands is the entire cost of a per-second face
   update. The display list is the last un-invalidated stage.
2. **Reuse the tree across a rebuild.** The 7.5× gap between `rebuild` and
   `retained` is the only thing that comes near a 60 fps budget on the little
   cores.
3. **Grep for the other eager `log`.** `EVGLayout` had eleven sites and seven of
   them built a string. Nothing structural stops the pattern existing elsewhere,
   and JavaScript will keep hiding it.
4. **Run `calibrate` on a real watch** and replace the estimate table above with
   a measurement. That is the whole reason it is in the benchmark.

---

## Re-run (2026-09-02, this cloud agent)

Same harnesses on a 4× Intel Xeon cloud host after #797 landed. `calibrate(2e6)`
≈ **4.2 ms** across Kotlin C1/C2, C++, and Node on this machine (the published
tables above came from a different host where calibrate was ~5.7–8.4 ms). Verdict
unchanged — numbers here are **faster** than the tables above, so the Wear ×10 /
watchOS ×3×2 estimates remain conservative.

**Kotlin C2** — face rebuild **0.17 ms**, retained **0.038 ms**, paint **0.51 ms**, cold **40 ms**

**Kotlin C1 (ART bracket)** — face rebuild **0.45 ms**, retained **0.079 ms**, paint **0.52 ms**, cold **34 ms**

**C++ AOT** — face rebuild **0.24 ms**, retained **0.041 ms**, cold **0.66 ms**

**Node** — face rebuild **0.21 ms**, retained **0.055 ms**, cold **17 ms**

Scaled at the same factors as above: Wear little-core face rebuild ≈ **4.5 ms**
(C1×10), watchOS ≈ **1.4 ms** (C++×3×2 Swift). Still well inside 16.7 ms.

Also fixed `run-jvm.sh` so a symlinked `kotlinc` on PATH still finds
`kotlin-stdlib.jar` (otherwise the harness dies with `NoClassDefFoundError:
kotlin/jvm/internal/Intrinsics`).

---

**License: AGPL-3.0-or-later** (Gallery).
