#!/usr/bin/env bash
# Type-check the files that need an Android SDK, without one.
#
#   bash gallery/pptx/android/scripts/typecheck-host.sh
#
# `SlideView.kt`, `MainActivity.kt` and the shared `AndroidEvgSurface.kt` are the
# only part of this port that cannot be run here, and an unchecked file is where
# a typo lives for a month. `gallery/evg/android/androidstubs/` declares the
# platform members the host calls — with the signatures the SDK gives them —
# which is enough for `kotlinc` to say whether the host is well-formed, whether
# its overrides match, and whether it calls anything that does not exist.
#
# It is NOT evidence that the app draws correctly: a stub cannot draw. Read a
# green run as "it will compile".
#
# Needs `kotlinc` and the generated viewer (scripts/build-ranger.sh).
set -e
cd "$(dirname "$0")/../../../.."

AND=gallery/pptx/android
OUT=tmp/pptx-android/typecheck

if ! command -v kotlinc >/dev/null 2>&1; then
  echo "kotlinc is not on PATH — see https://kotlinlang.org/docs/command-line.html" >&2
  exit 1
fi
if [ ! -f "$AND/generated/pptx_android.kt" ]; then
  echo "generated/pptx_android.kt is missing — run scripts/build-ranger.sh first" >&2
  exit 1
fi

mkdir -p "$OUT"
kotlinc -J-Xmx8g -nowarn \
  gallery/evg/android/androidstubs \
  "$AND/generated/pptx_android.kt" \
  gallery/evg/android/src/main/kotlin \
  gallery/evg/android/src/android/kotlin \
  "$AND/common/src/main/kotlin" \
  "$AND/app/src/main/kotlin" \
  -d "$OUT"

echo "the Android host type-checks against the platform stubs"
