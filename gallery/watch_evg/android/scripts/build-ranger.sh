#!/usr/bin/env bash
# Compile watch EVG bench facade to Kotlin for the Android painter harness.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"

OUT="gallery/watch_evg/android/generated"
PKG="fi.ranger.rgr"

if [ ! -f bin/output.js ]; then
  echo "bin/output.js is missing — build the compiler first (npm run compile)" >&2
  exit 1
fi

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p "$OUT"
rm -f "$OUT/watch_evg_android.kt"

log=$(node --max-old-space-size=4096 bin/output.js -l=kotlin \
  gallery/watch_evg/android/ranger/watch_evg_android.rgr -nodecli \
  -d="$OUT" -o=watch_evg_android.kt 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A4 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/watch_evg/android/ranger/watch_evg_android.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/watch_evg_android.kt" ]; then
  echo "the compiler reported no failure but wrote no $OUT/watch_evg_android.kt" >&2
  echo "$log" | tail -40
  exit 1
fi

if ! head -1 "$OUT/watch_evg_android.kt" | grep -q "^package "; then
  printf 'package %s\n\n' "$PKG" | cat - "$OUT/watch_evg_android.kt" > "$OUT/.watch_evg_android.kt.tmp"
  mv "$OUT/.watch_evg_android.kt.tmp" "$OUT/watch_evg_android.kt"
fi

lines=$(wc -l < "$OUT/watch_evg_android.kt")
echo "  $OUT/watch_evg_android.kt  ($lines lines, package $PKG)"
