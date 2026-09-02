#!/usr/bin/env bash
# The iOS port, checked without a Mac.
#
#   bash gallery/ui/ios/scripts/verify.sh
#
# Compiles `ranger/check_ios.rgr` — which imports `ranger/ui_ios.rgr` and the
# whole `gallery/ui` + `gallery/evg` + `gallery/vela` tree behind it — to
# JavaScript and runs it. What it proves is in the file's own header; the short
# version is that the page builds, every command kind the Swift surface has to
# implement is reached, the viewport arithmetic and the safe area hold, a press
# at a window coordinate lands on the control drawn there, the watch fit and the
# crown do what they claim, and the ripple's clock cannot get stuck.
#
# No Xcode, no simulator, no Swift. Everything it needs is in this repository.
set -e
cd "$(dirname "$0")/../../../.."

if [ ! -f bin/output.js ]; then
  echo "bin/output.js is missing — build the compiler first (npm run compile)" >&2
  exit 1
fi

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p tmp/ui-ios

log=$(node --max-old-space-size=8192 bin/output.js -es6 gallery/ui/ios/ranger/check_ios.rgr \
  -nodecli -d=tmp/ui-ios -o=check_ios.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A4 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/ui/ios/ranger/check_ios.rgr" >&2
  exit 1
fi

exec node tmp/ui-ios/check_ios.js
