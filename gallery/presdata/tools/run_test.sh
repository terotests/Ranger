#!/usr/bin/env bash
# An .xlsx read into CSV, on both string models.
#
# Compiled to JavaScript and to C++: the CSV quoting walks a string one unit at
# a time, and the two targets disagree about what a unit is.
#
#   npm run presdata:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/presdata/tests/PresDataTest.rgr
OUT=tmp/presdata
mkdir -p "$OUT" tmp gallery/presdata/bin

echo "==> JavaScript"
node dist/rgrc.js -es6 "$SRC" -d=gallery/presdata/bin -o=PresDataTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/presdata/bin/PresDataTest.js | tee "$OUT/js.out"
grep -q "ALL PASS" "$OUT/js.out" || { echo "JavaScript run failed" >&2; exit 1; }

CXX=""
for cc in g++ clang++; do
  if command -v "$cc" >/dev/null 2>&1; then CXX="$cc"; break; fi
done
if [ -z "$CXX" ]; then
  echo
  echo "==> C++  SKIPPED — no g++ or clang++ on PATH."
  echo "    The half of this test that can see a byte-versus-character bug did not run."
  exit 0
fi

echo
echo "==> C++ ($CXX)"
node dist/rgrc.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=PresDataTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/presdata" "$OUT/PresDataTest.cpp"
"$OUT/presdata" | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "sales.xlsx read into the same CSV on both targets"
