#!/usr/bin/env bash
# The same test, compiled twice, over all three OOXML readers.
#
# Two kinds of drift live here and only one of them is visible on the
# JavaScript target. That .docx and .pptx did not decode `&#228;` shows up
# anywhere. That PowerPoint's decoder rebuilt characters from `charAt` — the
# identity where a string is code units, a second UTF-8 encoding pass where it
# is bytes — shows up only in the C++ build, and only for text that also
# contains an entity. So running the JavaScript half alone is close enough to
# not running it.
#
#   npm run ooxml:text:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/ooxml/tests/OoxmlTextTest.rgr
OUT=tmp/ooxml-text
mkdir -p "$OUT" tmp gallery/ooxml/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/ooxml/bin -o=OoxmlTextTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/ooxml/bin/OoxmlTextTest.js | tee "$OUT/js.out"
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
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=OoxmlTextTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/ooxmltext" "$OUT/OoxmlTextTest.cpp"
"$OUT/ooxmltext" | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "the spreadsheet, the document and the slide read the same text"
