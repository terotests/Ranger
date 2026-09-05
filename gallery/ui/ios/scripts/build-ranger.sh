#!/usr/bin/env bash
# The page, compiled from Ranger to Swift.
#
#   bash gallery/ui/ios/scripts/build-ranger.sh
#
# Output: gallery/ui/ios/generated/ui_ios.swift — one file, holding the EVG
# controllers, the stylesheet cascade, the layout engine, the display list, the
# Vela runtime that draws the chart and the demo page itself. All of it is
# Ranger; none of it is written twice for Apple.
#
# The generated file is NOT checked in. It is a compiler artefact of
# `ranger/ui_ios.rgr` and the `gallery/ui` + `gallery/evg` trees, and a stale
# copy of it is the one way this port can silently drift from the demo
# everything else runs.
#
# `build-app.sh` runs this step itself, from inside the Ranger driver. This
# script is for looking at the Swift on its own.
set -e
cd "$(dirname "$0")/../../../.."

OUT=gallery/ui/ios/generated

if [ ! -f bin/output.js ]; then
  echo "bin/output.js is missing — build the compiler first (npm run compile)" >&2
  exit 1
fi

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p "$OUT"
rm -f "$OUT/ui_ios.swift"

log=$(node --max-old-space-size=8192 bin/output.js -l=swift6 \
  gallery/ui/ios/ranger/ui_ios.rgr -nodecli -d="$OUT" -o=ui_ios.swift 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A4 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/ui/ios/ranger/ui_ios.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/ui_ios.swift" ]; then
  echo "the compiler reported no failure but wrote no $OUT/ui_ios.swift" >&2
  exit 1
fi

lines=$(wc -l < "$OUT/ui_ios.swift")
echo "  $OUT/ui_ios.swift  ($lines lines)"
