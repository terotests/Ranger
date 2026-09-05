#!/usr/bin/env bash
# Compile the PPTX viewer to Kotlin for the Android host.
#
#   bash gallery/pptx/android/scripts/build-ranger.sh
#
# Output: gallery/pptx/android/generated/pptx_android.kt — one file, ~91k lines,
# holding the ZIP reader, the OOXML parser, the theme resolver, the JPEG and PNG
# decoders, the TrueType reader, the EVG layout engine and the display list.
# All of it is Ranger; none of it is written twice for Android.
#
# The generated file is NOT checked in. It is a compiler artefact of
# `ranger/pptx_android.rgr` and the `gallery/pptx/src` tree, it is two megabytes,
# and a stale copy of it is the one way this port can silently drift from the
# viewer everything else runs.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"

OUT="gallery/pptx/android/generated"
PKG="fi.ranger.rgr"

if [ ! -f bin/output.js ]; then
  echo "bin/output.js is missing — build the compiler first (npm run compile)" >&2
  exit 1
fi

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p "$OUT"
rm -f "$OUT/pptx_android.kt"

log=$(node --max-old-space-size=8192 bin/output.js -l=kotlin \
  gallery/pptx/android/ranger/pptx_android.rgr -nodecli -d="$OUT" -o=pptx_android.kt 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A4 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/pptx/android/ranger/pptx_android.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/pptx_android.kt" ]; then
  echo "the compiler reported no failure but wrote no $OUT/pptx_android.kt" >&2
  exit 1
fi

# Ranger writes Kotlin into the default package, and Kotlin cannot import from
# the default package at all — a host in `fi.ranger.pptx` could not name a
# single generated class. One line at the top fixes that; the generated code is
# internally consistent either way because every reference in it is unqualified.
#
# The name says what the code IS rather than which app it is for, and that is
# what lets `gallery/evg/android` be shared: the painter imports
# `fi.ranger.rgr.EVGDisplayList`, and every port compiles its own generated file
# into that package. Two apps, two compilations, one import line.
if ! head -1 "$OUT/pptx_android.kt" | grep -q "^package "; then
  printf 'package %s\n\n' "$PKG" | cat - "$OUT/pptx_android.kt" > "$OUT/.pptx_android.kt.tmp"
  mv "$OUT/.pptx_android.kt.tmp" "$OUT/pptx_android.kt"
fi

lines=$(wc -l < "$OUT/pptx_android.kt")
echo "  $OUT/pptx_android.kt  ($lines lines, package $PKG)"
