#!/usr/bin/env bash
# The same test, compiled twice — because the defect it guards exists in only
# one of the two targets.
#
# Building a string with `out = (out + x)` is a rope on the JavaScript target
# and a full copy of everything so far on the C++ one. A writer that does it
# per row is linear in JavaScript and quadratic in C++: 20,000 rows took 76 ms
# after the fix and 13,552 ms before it, and 500,000 rows never finished at
# all. Only the C++ half of this run can see that, so only running the
# JavaScript half is the same as not running it.
#
#   npm run datagrid:save:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/datagrid/tests/SaveSpeedTest.rgr
OUT=tmp/save-speed
mkdir -p "$OUT" tmp

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/datagrid/bin -o=SaveSpeedTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/datagrid/bin/SaveSpeedTest.js | tee "$OUT/js.out"
grep -q "ALL PASS" "$OUT/js.out" || { echo "JavaScript run failed" >&2; exit 1; }

CXX=""
for cc in g++ clang++; do
  if command -v "$cc" >/dev/null 2>&1; then CXX="$cc"; break; fi
done
if [ -z "$CXX" ]; then
  echo
  echo "==> C++  SKIPPED — no g++ or clang++ on PATH."
  echo "    The half of this test that can see a quadratic writer did not run."
  exit 0
fi

echo
echo "==> C++ ($CXX)"
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=SaveSpeedTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
# -O2: the budget is about the shape of the algorithm, and an unoptimised
# build is slow for reasons that have nothing to do with it.
"$CXX" -std=c++17 -O2 -I "$OUT" -o "$OUT/savespeed" "$OUT/SaveSpeedTest.cpp"
"$OUT/savespeed" | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "the sheet was written in time proportional to its size, in both string models"
