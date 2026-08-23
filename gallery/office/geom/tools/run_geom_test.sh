#!/usr/bin/env bash
# The guide evaluator DrawingML geometry is written in, on both targets.
#
# A preset shape is a list of named guides computed from the shape's box and
# its adjustment handles, then a path expressed in those guides. Everything
# the 187 preset geometries are made of goes through `evalFormula`, so a wrong
# operator is not one wrong shape — it is a plausible-looking slide with the
# wrong shapes on it, which is the hardest kind of wrong to notice.
#
# Both targets because the arithmetic is doubles and the parsing is strings,
# and a string is UTF-16 code units on JavaScript and bytes in C++. The two
# things most worth checking are not arithmetic at all: angles stated in
# sixtythousandths of a degree, and `at2` returning one.
#
#   npm run office:geom:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/office/geom/tests/OfficeGeomFormulaTest.rgr
OUT=tmp/office-geom
mkdir -p "$OUT" tmp gallery/office/geom/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/office/geom/bin -o=OfficeGeomFormulaTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/office/geom/bin/OfficeGeomFormulaTest.js 2>&1 | tee "$OUT/js.out"
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
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=OfficeGeomFormulaTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/officegeom" "$OUT/OfficeGeomFormulaTest.cpp"
"$OUT/officegeom" 2>&1 | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "guides in, geometry out, the same on both targets"
