#!/usr/bin/env bash
# A property that knows it was not stated.
#
# "Not specified" is not "specified as false", and a boolean cannot hold both.
# A chain built on one turns into "whoever set it to true last wins" — which is
# what the .docx reader did, so a word explicitly un-bolded inside a bold
# heading drew bold.
#
# Compiled twice, like everything else here: a rule that holds on one target
# and not the other is a rule that holds nowhere.
#
#   npm run office:style:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/office/text/tests/OfficeStyleTest.rgr
OUT=tmp/office-style
mkdir -p "$OUT" tmp gallery/office/text/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/office/text/bin -o=OfficeStyleTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/office/text/bin/OfficeStyleTest.js 2>&1 | grep -v '^FontManager:' | tee "$OUT/js.out"
grep -q "ALL PASS" "$OUT/js.out" || { echo "JavaScript run failed" >&2; exit 1; }

CXX=""
for cc in g++ clang++; do
  if command -v "$cc" >/dev/null 2>&1; then CXX="$cc"; break; fi
done
if [ -z "$CXX" ]; then
  echo
  echo "==> C++  SKIPPED — no g++ or clang++ on PATH."
  exit 0
fi

echo
echo "==> C++ ($CXX)"
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=OfficeStyleTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/officestyle" "$OUT/OfficeStyleTest.cpp"
"$OUT/officestyle" 2>&1 | grep -v '^FontManager:' | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "not specified is not specified-as-false, on both targets"
