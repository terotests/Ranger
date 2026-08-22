#!/usr/bin/env bash
# Render fixture decks through the Android port's own painter, without Android.
#
#   bash gallery/pptx/android/scripts/verify-desktop.sh [deck.pptx …]
#
# What this proves, and it is most of the port:
#
#   * `ranger/pptx_android.rgr` and the whole `gallery/pptx/src` tree compile to
#     Kotlin and `kotlinc` accepts the result;
#   * the compiled viewer OPENS a real .pptx on a JVM — ZIP, OOXML, theme
#     resolution, JPEG/PNG decoding, TrueType metrics, EVG layout — and answers
#     with a display list per slide;
#   * `EvgPainter` walks that list and every KIND of command reaches a surface
#     -- text, borders, pictures, clips, vector paths, gradients, shadows;
#   * the pixels that come out are a slide rather than an empty page;
#   * and `TouchRouter` -- every rule about what a finger means -- does what it
#     should: a tap on a thumbnail, a tap on a toolbar button, flicks over the
#     page and over the panel, and the show's tap / pinch / pan / double-tap.
#
# What it does not prove is the platform delegation: `AndroidEvgSurface` calling
# `android.graphics.Canvas`, and `SlideView` unpacking a `MotionEvent`. Those
# need a device or an emulator; `scripts/typecheck-host.sh` at least says they
# compile.
#
# Needs `kotlinc` on PATH (https://kotlinlang.org/docs/command-line.html) and a
# JDK. Everything else is in this repository.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"

AND=gallery/pptx/android
OUT=tmp/pptx-android
CLASSES="$OUT/classes"

if ! command -v kotlinc >/dev/null 2>&1; then
  echo "kotlinc is not on PATH — see https://kotlinlang.org/docs/command-line.html" >&2
  exit 1
fi

DECKS=("$@")
if [ ${#DECKS[@]} -eq 0 ]; then
  DECKS=(
    gallery/pptx/fixtures/20-business-deck.pptx
    gallery/pptx/fixtures/09-kitchen.pptx
    gallery/pptx/fixtures/21-gradient.pptx
    gallery/pptx/fixtures/25-table.pptx
    gallery/pptx/fixtures/28-transitions.pptx
  )
fi

bash "$AND/scripts/build-ranger.sh"

mkdir -p "$CLASSES"
echo "compiling the Kotlin (this takes a couple of minutes — it is 66k generated lines)"
kotlinc -J-Xmx8g -nowarn \
  "$AND/generated/pptx_android.kt" \
  "$AND/common/src/main/kotlin" \
  "$AND/desktop/src/main/kotlin" \
  -d "$CLASSES"

STDLIB=$(dirname "$(readlink -f "$(command -v kotlinc)")")/../lib/kotlin-stdlib.jar

# The whole corpus through the painter, and every touch rule driven against a
# real deck. This is the part that fails a build; the per-deck renders below are
# for looking at.
java -Djava.awt.headless=true -cp "$CLASSES:$STDLIB" \
  fi.ranger.pptx.desktop.CheckPortKt "$ROOT" "$OUT/coverage"

echo
for deck in "${DECKS[@]}"; do
  name=$(basename "$deck" .pptx)
  echo "--- $name"
  java -Djava.awt.headless=true -cp "$CLASSES:$STDLIB" \
    fi.ranger.pptx.desktop.RenderDeckKt "$ROOT" "$deck" "$OUT/$name" 1280 800
done

echo "PNGs in $OUT/"
