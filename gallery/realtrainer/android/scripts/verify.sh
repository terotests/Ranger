#!/usr/bin/env bash
# The RealTrainer Android port's rules, driven on Node — no SDK needed.
#
#   bash gallery/realtrainer/android/scripts/verify.sh
set -e
cd "$(dirname "$0")/../../../.."

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr:./lib
mkdir -p tmp/rt-android

log=$(node --max-old-space-size=8192 bin/output.js -es6 \
  gallery/realtrainer/android/ranger/check_rt_android.rgr -nodecli \
  -d=tmp/rt-android -o=check_rt_android.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A4 "\[FAIL\]" | head -40
  exit 1
fi
exec node tmp/rt-android/check_rt_android.js
