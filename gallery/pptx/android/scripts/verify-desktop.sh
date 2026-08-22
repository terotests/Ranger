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
#   * `EvgPainter` walks that list and every command reaches a surface;
#   * the pixels that come out are a slide rather than an empty page.
#
# What it does not prove is the last file: `AndroidEvgSurface` delegating to
# `android.graphics.Canvas`. That needs a device or an emulator.
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
  "$AND/common/src/main/kotlin/fi/ranger/pptx/evg/EvgSurface.kt" \
  "$AND/common/src/main/kotlin/fi/ranger/pptx/evg/EvgPainter.kt" \
  "$AND/desktop/src/main/kotlin/fi/ranger/pptx/desktop/AwtEvgSurface.kt" \
  "$AND/desktop/src/main/kotlin/fi/ranger/pptx/desktop/RenderDeck.kt" \
  -d "$CLASSES"

STDLIB=$(dirname "$(readlink -f "$(command -v kotlinc)")")/../lib/kotlin-stdlib.jar

for deck in "${DECKS[@]}"; do
  name=$(basename "$deck" .pptx)
  echo "--- $name"
  java -Djava.awt.headless=true -cp "$CLASSES:$STDLIB" \
    fi.ranger.pptx.desktop.RenderDeckKt "$ROOT" "$deck" "$OUT/$name" 1280 800
done

echo "PNGs in $OUT/"
