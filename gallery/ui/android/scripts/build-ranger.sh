#!/usr/bin/env bash
# Compile the dashboard demo to Kotlin for the Android host.
#
#   bash gallery/ui/android/scripts/build-ranger.sh
#
# Output: gallery/ui/android/generated/ui_android.kt — one file, holding the EVG
# controllers, the stylesheet cascade, the layout engine, the display list, the
# Vela runtime that draws the chart and the demo page itself. All of it is
# Ranger; none of it is written twice for Android.
#
# The generated file is NOT checked in. It is a compiler artefact of
# `ranger/ui_android.rgr` and the `gallery/ui` + `gallery/evg` trees, and a
# stale copy of it is the one way this port can silently drift from the demo
# everything else runs.
#
# The package is `fi.ranger.rgr`, which is what `gallery/evg/android` imports:
# the painter names `fi.ranger.rgr.EVGDisplayList`, every port compiles its own
# generated file into that package, and the shared backend is then shared
# rather than copied. See gallery/pptx/android/scripts/build-ranger.sh, which
# says the same thing about the deck.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"

OUT="gallery/ui/android/generated"
PKG="fi.ranger.rgr"

if [ ! -f bin/output.js ]; then
  echo "bin/output.js is missing — build the compiler first (npm run compile)" >&2
  exit 1
fi

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p "$OUT"
rm -f "$OUT/ui_android.kt"

log=$(node --max-old-space-size=8192 bin/output.js -l=kotlin \
  gallery/ui/android/ranger/ui_android.rgr -nodecli -d="$OUT" -o=ui_android.kt 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A4 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/ui/android/ranger/ui_android.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/ui_android.kt" ]; then
  echo "the compiler reported no failure but wrote no $OUT/ui_android.kt" >&2
  exit 1
fi

# Ranger writes Kotlin into the default package, and Kotlin cannot import from
# the default package at all. One line at the top fixes that; the generated
# code is internally consistent either way because every reference in it is
# unqualified.
if ! head -1 "$OUT/ui_android.kt" | grep -q "^package "; then
  printf 'package %s\n\n' "$PKG" | cat - "$OUT/ui_android.kt" > "$OUT/.ui_android.kt.tmp"
  mv "$OUT/.ui_android.kt.tmp" "$OUT/ui_android.kt"
fi

lines=$(wc -l < "$OUT/ui_android.kt")
echo "  $OUT/ui_android.kt  ($lines lines, package $PKG)"
