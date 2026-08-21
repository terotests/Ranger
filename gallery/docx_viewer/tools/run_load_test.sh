#!/usr/bin/env bash
# The same test, compiled twice, because opening a long document was slow for
# two separate reasons and each target could only see one of them.
#
# The body walk re-searched the whole document for `w:tbl` once per paragraph,
# which is slow everywhere. And `indexOfFrom` lowered to a C++ polyfill taking
# `std::string` BY VALUE, so every search copied the whole part first — a cost
# that does not exist on the JavaScript target at all. 20,000 paragraphs took
# 58 s in JavaScript and 49 s natively; they now take 0.9 s and 0.14 s.
#
#   npm run docx_viewer:load:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/docx_viewer/tests/DocxLoadSpeedTest.rgr
OUT=tmp/docx-load
mkdir -p "$OUT" tmp gallery/docx_viewer/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/docx_viewer/bin -o=DocxLoadSpeedTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/docx_viewer/bin/DocxLoadSpeedTest.js | tee "$OUT/js.out"
grep -q "ALL PASS" "$OUT/js.out" || { echo "JavaScript run failed" >&2; exit 1; }

CXX=""
for cc in g++ clang++; do
  if command -v "$cc" >/dev/null 2>&1; then CXX="$cc"; break; fi
done
if [ -z "$CXX" ]; then
  echo
  echo "==> C++  SKIPPED — no g++ or clang++ on PATH."
  echo "    The half of this test that can see a by-value string copy did not run."
  exit 0
fi

echo
echo "==> C++ ($CXX)"
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=DocxLoadSpeedTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/docxload" "$OUT/DocxLoadSpeedTest.cpp"
"$OUT/docxload" | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "a long document opened in time proportional to its length, in both builds"
