#!/usr/bin/env bash
# The RealTrainer demo, compiled from Ranger to Swift.
#
#   bash gallery/realtrainer/ios/scripts/build-ranger.sh
#
# Output: gallery/realtrainer/ios/generated/rt_ios.swift — one file, holding
# the EVG controllers, the stylesheet cascade, the layout engine, the display
# list and the demo itself. The same Ranger the browser page runs; only the
# target is different.
#
# `build-app.sh` runs this step itself, from inside the Ranger driver. This
# script is for looking at the Swift on its own.
set -e
cd "$(dirname "$0")/../../../.."

OUT=gallery/realtrainer/ios/generated

if [ ! -f bin/output.js ]; then
  echo "bin/output.js is missing — build the compiler first (npm run compile)" >&2
  exit 1
fi

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p "$OUT"
rm -f "$OUT/rt_ios.swift"

log=$(node --max-old-space-size=8192 bin/output.js -l=swift6 \
  gallery/realtrainer/ios/ranger/rt_ios.rgr -nodecli -d="$OUT" -o=rt_ios.swift 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A4 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/realtrainer/ios/ranger/rt_ios.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/rt_ios.swift" ]; then
  echo "the compiler reported no failure but wrote no $OUT/rt_ios.swift" >&2
  exit 1
fi

lines=$(wc -l < "$OUT/rt_ios.swift")
echo "  $OUT/rt_ios.swift  ($lines lines)"
