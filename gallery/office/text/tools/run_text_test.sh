#!/usr/bin/env bash
# The seam between the codepoint algorithms and the strings that get painted.
#
# OfficeBidi knows the order, OfficeArabic knows the shapes, and both work on
# integers because that is the only way to write an algorithm that means the
# same thing on both targets. Nothing that paints holds an integer array — the
# display list, the canvas and the measurer all take a string. OfficeText is
# that seam, and this checks it where it is genuinely different on the two
# targets: a string is UTF-16 code units on JavaScript and bytes in C++, so
# "the same text" is a different array of numbers in the two, and a decode
# that is wrong on one of them yields a string of the right length and the
# wrong characters.
#
# The properties that matter to the callers, checked on both:
#   * text with no right-to-left character comes back IDENTICAL
#   * text with Arabic comes back shaped and then reordered, in that order
#   * a combining mark stays on the letter it was typed on
#
#   npm run office:text:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/office/text/tests/OfficeTextTest.rgr
OUT=tmp/office-text
mkdir -p "$OUT" tmp gallery/office/text/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/office/text/bin -o=OfficeTextTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/office/text/bin/OfficeTextTest.js 2>&1 | grep -v '^FontManager:' | tee "$OUT/js.out"
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
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=OfficeTextTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/officetext" "$OUT/OfficeTextTest.cpp"
"$OUT/officetext" 2>&1 | grep -v '^FontManager:' | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "stored text in, drawable text out, the same on both targets"
