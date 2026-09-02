#!/usr/bin/env bash
# Paint the dashboard through the Android port's own painter, without Android.
#
#   bash gallery/ui/android/scripts/verify-desktop.sh
#
# What this proves, and it is most of the port:
#
#   * `ranger/ui_android.rgr` and the `gallery/ui` + `gallery/evg` trees behind
#     it compile to Kotlin and `kotlinc` accepts the result;
#   * the compiled demo BUILDS the page on a JVM — the cascade, the layout, the
#     virtualised table, the Vela chart — and answers with a display list;
#   * `EvgPainter` walks that list and every kind of command the page uses
#     reaches a surface: text, borders, rounded boxes, clips, vector paths;
#   * the viewport arithmetic this port adds holds — the fit scale, the page
#     height a screen is worth, a pinch that holds its focus point, a pan that
#     stops at the edge;
#   * and a press at a SCREEN coordinate reaches the control that is drawn
#     there.
#
# What it does not prove is the platform delegation: `AndroidEvgSurface` calling
# `android.graphics.Canvas`, and `DashboardView` unpacking a `MotionEvent`.
# Those need a device or an emulator; `scripts/typecheck-host.sh` at least says
# they compile.
#
# Needs `kotlinc` on PATH (https://kotlinlang.org/docs/command-line.html) and a
# JDK. Everything else is in this repository.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"

AND=gallery/ui/android
OUT=tmp/ui-android
CLASSES="$OUT/classes"

if ! command -v kotlinc >/dev/null 2>&1; then
  echo "kotlinc is not on PATH — see https://kotlinlang.org/docs/command-line.html" >&2
  exit 1
fi

bash "$AND/scripts/build-ranger.sh"

mkdir -p "$CLASSES"
echo "compiling the Kotlin (this takes a couple of minutes — it is 46k generated lines)"
kotlinc -J-Xmx8g -nowarn \
  "$AND/generated/ui_android.kt" \
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
  -cp "$CLASSES:$STDLIB" fi.ranger.ui.desktop.CheckDashboard "$ROOT"
