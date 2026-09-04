#!/usr/bin/env bash
# Paint the RealTrainer demo through the Android port's own painter, without
# Android.
#
#   bash gallery/realtrainer/android/scripts/verify-desktop.sh
#
# What this proves, and it is most of the port:
#
#   * `ranger/rt_android.rgr` and the `gallery/realtrainer` + `gallery/evg`
#     trees behind it compile to Kotlin and `kotlinc` accepts the result;
#   * the compiled demo BUILDS the page on a JVM — the cascade, the layout,
#     the diary, the Vela charts — and answers with a display list;
#   * `EvgPainter` walks that list and every kind of command the page uses
#     reaches a surface: text, boxes, clips, the icons' stroked paths, the
#     charts' filled areas;
#   * and a press at a VIEW coordinate reaches the control drawn there, the
#     keyboard's text lands in the focused field, and the clock stops.
#
# What it does not prove is the platform delegation: `AndroidEvgSurface`
# calling `android.graphics.Canvas`, and `RealTrainerView` unpacking a
# `MotionEvent`. Those need a device or an emulator; `scripts/typecheck-host.sh`
# at least says they compile. The facade's own rules are checked faster on Node
# by `scripts/verify.sh`.
#
# Needs `kotlinc` on PATH (https://kotlinlang.org/docs/command-line.html) and a
# JDK. Everything else is in this repository.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"

AND=gallery/realtrainer/android
OUT=tmp/rt-android
CLASSES="$OUT/classes"

if ! command -v kotlinc >/dev/null 2>&1; then
  echo "kotlinc is not on PATH — see https://kotlinlang.org/docs/command-line.html" >&2
  exit 1
fi

bash "$AND/scripts/build-ranger.sh"

mkdir -p "$CLASSES"
echo "compiling the Kotlin (this takes a few minutes — it is 87k generated lines)"
kotlinc -J-Xmx8g -nowarn \
  "$AND/generated/rt_android.kt" \
  gallery/evg/android/src/main/kotlin \
  gallery/evg/android/src/awt/kotlin \
  "$AND/desktop/src/main/kotlin" \
  -d "$CLASSES"

KOTLIN_HOME="$(dirname "$(dirname "$(command -v kotlinc)")")"
STDLIB="$KOTLIN_HOME/lib/kotlin-stdlib.jar"
if [ ! -f "$STDLIB" ]; then
  STDLIB="$(find "$KOTLIN_HOME" -name 'kotlin-stdlib*.jar' | head -1)"
fi

java -Xmx4g -Djava.awt.headless=true \
  -cp "$CLASSES:$STDLIB" fi.ranger.realtrainer.desktop.CheckRealTrainer "$ROOT"
