#!/usr/bin/env bash
# EVG's watch frame, timed on the JVM through the Android port's own painter.
#
#   bash gallery/watch_evg/bench/scripts/run-jvm.sh [--png] [--json] [--c1]
#
# `--c1` re-runs with `-XX:TieredStopAtLevel=1`, which is C1 only and no C2. It
# is here because ART is not HotSpot: the two numbers bracket what a Wear OS
# device's JIT would produce, and quoting a C2 number alone would flatter the
# result.
#
# Needs `kotlinc` on PATH and a JDK. No Android SDK, because nothing here is
# Android-specific: the painter is shared source and Java2D is in every JDK.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"

BENCH=gallery/watch_evg/bench
OUT=tmp/watch-bench
CLASSES="$OUT/classes"

if ! command -v kotlinc >/dev/null 2>&1; then
  echo "kotlinc is not on PATH — see https://kotlinlang.org/docs/command-line.html" >&2
  exit 1
fi

bash "$BENCH/scripts/build-ranger.sh"

if [ ! -f "$CLASSES/fi/ranger/watch/bench/WatchBenchMain.class" ] \
   || [ "$BENCH/generated/watch_bench.kt" -nt "$CLASSES/fi/ranger/watch/bench/WatchBenchMain.class" ] \
   || [ "$BENCH/desktop/src/main/kotlin/fi/ranger/watch/bench/WatchBenchMain.kt" -nt "$CLASSES/fi/ranger/watch/bench/WatchBenchMain.class" ]; then
  mkdir -p "$CLASSES"
  echo "compiling the Kotlin (14k generated lines — a couple of minutes)"
  kotlinc -J-Xmx6g -nowarn \
    "$BENCH/generated/watch_bench.kt" \
    gallery/evg/android/src/main/kotlin \
    gallery/evg/android/src/awt/kotlin \
    "$BENCH/desktop/src/main/kotlin" \
    -d "$CLASSES"
fi

KOTLIN_HOME="$(dirname "$(dirname "$(command -v kotlinc)")")"
STDLIB="$KOTLIN_HOME/lib/kotlin-stdlib.jar"
if [ ! -f "$STDLIB" ]; then
  STDLIB="$(find "$KOTLIN_HOME" -name 'kotlin-stdlib*.jar' | head -1)"
fi

ARGS=()
C1=0
for a in "$@"; do
  if [ "$a" = "--c1" ]; then C1=1; else ARGS+=("$a"); fi
done

# One core. A watch has four small ones and runs a UI on a single thread; a
# four-way desktop scheduler moving the benchmark between cores measures the
# scheduler.
RUN=(java -Xmx1g -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Djava.awt.headless=true -cp "$CLASSES:$STDLIB")
if [ "$C1" = "1" ]; then RUN+=(-XX:TieredStopAtLevel=1); fi
if command -v taskset >/dev/null 2>&1; then
  taskset -c 0 "${RUN[@]}" fi.ranger.watch.bench.WatchBenchMain "$ROOT" "${ARGS[@]}"
else
  "${RUN[@]}" fi.ranger.watch.bench.WatchBenchMain "$ROOT" "${ARGS[@]}"
fi
