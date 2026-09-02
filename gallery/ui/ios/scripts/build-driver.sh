#!/usr/bin/env bash
# Compile the build driver itself: Ranger -> JavaScript.
#
#   bash gallery/ui/ios/scripts/build-driver.sh
#
# `ranger/build_ios.rgr` is the program that builds the app — it calls the
# Ranger compiler, xcrun, swiftc, plutil, codesign and simctl. It is Ranger, so
# it has to be compiled before it can be run, and this is that step. Node is the
# host because the driver only ever runs on a development machine; the same
# source compiles to Swift, Python or Go if a machine would rather run it that
# way.
set -e
cd "$(dirname "$0")/../../../.."

if [ ! -f bin/output.js ]; then
  echo "bin/output.js is missing — build the compiler first (npm run compile)" >&2
  exit 1
fi

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p tmp/ui-ios

log=$(node bin/output.js -es6 gallery/ui/ios/ranger/build_ios.rgr -nodecli -d=tmp/ui-ios -o=build_ios.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A4 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/ui/ios/ranger/build_ios.rgr" >&2
  exit 1
fi
if [ ! -f tmp/ui-ios/build_ios.js ]; then
  echo "the compiler reported no failure but wrote no tmp/ui-ios/build_ios.js" >&2
  exit 1
fi
