#!/usr/bin/env bash
# Arabic is cursive: every letter has up to four shapes depending on what is
# beside it, and a renderer that draws the stored codepoints draws every one
# of them in its isolated shape.
#
# That is not a degraded rendering, it is the wrong text — the equivalent of
# writing English with a space between every letter. All three editors did it,
# and this is the shaper that stops them: joining forms out of the Arabic
# Presentation Forms-B block, plus the two mandatory lam-alef ligatures.
#
# Compiled twice, like everything else here. The shaping is integer arithmetic
# and identical on both targets; the text the callers decode into those ints
# is UTF-16 on JavaScript and bytes in C++, so the core is checked on both to
# keep that boundary honest.
#
#   npm run office:arabic:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/office/text/tests/OfficeArabicTest.rgr
OUT=tmp/office-arabic
mkdir -p "$OUT" tmp gallery/office/text/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/office/text/bin -o=OfficeArabicTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/office/text/bin/OfficeArabicTest.js 2>&1 | grep -v '^FontManager:' | tee "$OUT/js.out"
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
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=OfficeArabicTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/officearabic" "$OUT/OfficeArabicTest.cpp"
"$OUT/officearabic" 2>&1 | grep -v '^FontManager:' | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "stored letters in, joined shapes out, on both targets"
