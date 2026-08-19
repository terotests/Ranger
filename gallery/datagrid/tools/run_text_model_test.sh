#!/usr/bin/env bash
# The same test, compiled twice.
#
# Ranger's `string` is UTF-16 code units on the JavaScript target and BYTES on
# the C++ one. Text handling that is correct in one can be silently wrong in the
# other — `(strfromcode (charAt s i))` is the identity in JavaScript and encodes
# every byte a second time in C++ — and no amount of testing in one target can
# see it. So this runs TextModelTest in both.
#
#   npm run datagrid:text:test
#
# The C++ half needs only a C++17 compiler; where there is none it says so and
# the JavaScript half still runs.
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/datagrid/tests/TextModelTest.rgr
OUT=tmp/text-model
mkdir -p "$OUT" tmp

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/datagrid/bin -o=TextModelTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested. That is worse than no test at all.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/datagrid/bin/TextModelTest.js | tee "$OUT/js.out"
grep -q "ALL PASS" "$OUT/js.out" || { echo "JavaScript run failed" >&2; exit 1; }

CXX=""
for cc in g++ clang++; do
  if command -v "$cc" >/dev/null 2>&1; then CXX="$cc"; break; fi
done
if [ -z "$CXX" ]; then
  echo
  echo "==> C++  SKIPPED — no g++ or clang++ on PATH."
  echo "    The half of this test that catches byte-vs-character bugs did not run."
  exit 0
fi

echo
echo "==> C++ ($CXX)"
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=TextModelTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/textmodel" "$OUT/TextModelTest.cpp"
"$OUT/textmodel" | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "the same text survived both string models"
