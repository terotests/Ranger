#!/usr/bin/env bash
# The OpenDocument presentation reader — compiled twice.
#
# The load-bearing section is the last one: the same document is opened as a
# .odp and as the .pptx it was converted from, by two readers that share
# nothing above the XML layer, and the two have to agree — same page count,
# same sentence, same box to a tenth of a point.
#
# The C++ half is not redundant. ODF states a length as a STRING and the
# reader takes it apart a character at a time; a string is code units on one
# target and bytes on the other, so a unit parser can be right on one and
# wrong on the other. The .pptx side reads integers and cannot see that.
#
#   npm run odp:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/odp/tests/OdpTest.rgr
OUT=tmp/odp
mkdir -p "$OUT" tmp gallery/odp/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/odp/bin -o=OdpTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/odp/bin/OdpTest.js | tee "$OUT/js.out"
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
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=OdpTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/odptest" "$OUT/OdpTest.cpp"
"$OUT/odptest" | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "the .odp reader agrees with the .pptx reader about the same document, on both targets"
