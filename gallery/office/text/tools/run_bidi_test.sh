#!/usr/bin/env bash
# Arabic and Hebrew are stored in the order they are spoken and displayed in
# the opposite one.
#
# Nothing in this gallery did that conversion, so every Arabic word in all
# three editors was drawn backwards — not degraded, reversed, which is
# unreadable. This is UAX #9: which way a paragraph runs, where the numbers
# beside a script belong, which side a space takes, and the reordering itself.
#
# Compiled twice, like everything else here. A codepoint is an int on both
# targets, but the text around it is UTF-16 on JavaScript and bytes in C++, so
# the cheapest way to keep the callers honest is for the core to be checked on
# both.
#
#   npm run office:bidi:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/office/text/tests/OfficeBidiTest.rgr
OUT=tmp/office-bidi
mkdir -p "$OUT" tmp gallery/office/text/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/office/text/bin -o=OfficeBidiTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/office/text/bin/OfficeBidiTest.js 2>&1 | grep -v '^FontManager:' | tee "$OUT/js.out"
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
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=OfficeBidiTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/officebidi" "$OUT/OfficeBidiTest.cpp"
"$OUT/officebidi" 2>&1 | grep -v '^FontManager:' | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "logical order in, visual order out, on both targets"
