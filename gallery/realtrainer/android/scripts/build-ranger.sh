#!/usr/bin/env bash
# The RealTrainer demo, compiled from Ranger to Kotlin for the Android host.
#
#   bash gallery/realtrainer/android/scripts/build-ranger.sh
#
# Output: gallery/realtrainer/android/generated/rt_android.kt — one file,
# holding the EVG controllers, the stylesheet cascade, the layout engine, the
# display list, the COMPACT parser, the state machines, the Vela runtime that
# draws the statistics and the demo itself. The same Ranger the browser page
# runs; only the target is different.
#
# The generated file is NOT checked in. It is a compiler artefact of
# `ranger/rt_android.rgr` and the trees behind it, and a stale copy of it is
# the one way this port can silently drift from the demo everything else runs.
#
# The package is `fi.ranger.rgr`, which is what `gallery/evg/android` imports:
# the painter names `fi.ranger.rgr.EVGDisplayList`, every port compiles its own
# generated file into that package, and the shared backend is then shared
# rather than copied. See gallery/ui/android/scripts/build-ranger.sh.
set -e
cd "$(dirname "$0")/../../../.."

OUT="gallery/realtrainer/android/generated"
PKG="fi.ranger.rgr"

if [ ! -f bin/output.js ]; then
  echo "bin/output.js is missing — build the compiler first (npm run compile)" >&2
  exit 1
fi

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr:./lib
mkdir -p "$OUT"
rm -f "$OUT/rt_android.kt"

log=$(node --max-old-space-size=8192 bin/output.js -l=kotlin \
  gallery/realtrainer/android/ranger/rt_android.rgr -nodecli -d="$OUT" -o=rt_android.kt 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A4 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/realtrainer/android/ranger/rt_android.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/rt_android.kt" ]; then
  echo "the compiler reported no failure but wrote no $OUT/rt_android.kt" >&2
  exit 1
fi

# Ranger writes Kotlin into the default package, and Kotlin cannot import from
# the default package at all. One line at the top fixes that; the generated
# code is internally consistent either way because every reference in it is
# unqualified.
if ! head -1 "$OUT/rt_android.kt" | grep -q "^package "; then
  printf 'package %s\n\n' "$PKG" | cat - "$OUT/rt_android.kt" > "$OUT/.rt_android.kt.tmp"
  mv "$OUT/.rt_android.kt.tmp" "$OUT/rt_android.kt"
fi

lines=$(wc -l < "$OUT/rt_android.kt")
echo "  $OUT/rt_android.kt  ($lines lines, package $PKG)"
