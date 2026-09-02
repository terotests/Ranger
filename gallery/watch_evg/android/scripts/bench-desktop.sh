#!/usr/bin/env bash
# Measure watch-sized EVG through the Android port's EvgPainter (AWT stand-in).
#
#   bash gallery/watch_evg/android/scripts/bench-desktop.sh
#
# Needs kotlinc + JDK. No Android SDK.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"

AND=gallery/watch_evg/android
OUT=tmp/watch-evg
CLASSES="$OUT/classes"

if ! command -v kotlinc >/dev/null 2>&1; then
  echo "kotlinc is not on PATH — see https://kotlinlang.org/docs/command-line.html" >&2
  exit 1
fi

bash "$AND/scripts/build-ranger.sh"

mkdir -p "$CLASSES"
echo "compiling the Kotlin (generated Ranger + EvgPainter + bench harness)"
kotlinc -J-Xmx4g -nowarn \
  "$AND/generated/watch_evg_android.kt" \
  gallery/evg/android/src/main/kotlin \
  gallery/evg/android/src/awt/kotlin \
  "$AND/desktop/src/main/kotlin" \
  -d "$CLASSES"

KOTLINC_BIN="$(command -v kotlinc)"
KOTLIN_HOME="$(dirname "$(dirname "$(readlink -f "$KOTLINC_BIN" 2>/dev/null || realpath "$KOTLINC_BIN")")")"
STDLIB="$KOTLIN_HOME/lib/kotlin-stdlib.jar"
if [ ! -f "$STDLIB" ]; then
  STDLIB="$(find "$KOTLIN_HOME" -name 'kotlin-stdlib.jar' | head -1)"
fi
if [ ! -f "$STDLIB" ]; then
  echo "kotlin-stdlib.jar not found near $KOTLINC_BIN" >&2
  exit 1
fi

java -Xmx2g -Djava.awt.headless=true \
  -cp "$CLASSES:$STDLIB" fi.ranger.watch.desktop.BenchWatchKt "$ROOT"
