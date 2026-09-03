#!/usr/bin/env bash
# The RealTrainer iOS port's rules, driven on Node — no Mac needed.
#
#   bash gallery/realtrainer/ios/scripts/verify.sh
set -e
cd "$(dirname "$0")/../../../.."

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p tmp/rt-ios

log=$(node --max-old-space-size=8192 bin/output.js -es6 \
  gallery/realtrainer/ios/ranger/check_rt_ios.rgr -nodecli \
  -d=tmp/rt-ios -o=check_rt_ios.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A4 "\[FAIL\]" | head -40
  exit 1
fi
exec node tmp/rt-ios/check_rt_ios.js
