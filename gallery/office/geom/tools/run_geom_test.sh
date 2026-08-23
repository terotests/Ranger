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
OUT=tmp/office-geom
mkdir -p "$OUT" tmp gallery/office/geom/bin

# Two suites: the evaluator on its own, then all 187 shapes through it.
SUITES="OfficeGeomFormulaTest OfficePresetShapesTest"

echo "==> JavaScript"
for T in $SUITES; do
  node bin/output.js -es6 "gallery/office/geom/tests/$T.rgr" -d=gallery/office/geom/bin -o="$T.js" -nodecli > "$OUT/js-$T.log" 2>&1 || {
    tail -20 "$OUT/js-$T.log"; echo "Ranger -> JS failed ($T)" >&2; exit 1; }
  # The compiler can report [FAIL] and still exit 0, and the stale build from
  # the last run would then be what gets tested.
  if grep -q '\[FAIL\]' "$OUT/js-$T.log"; then
    grep -A2 '\[FAIL\]' "$OUT/js-$T.log" | head -20
    echo "Ranger -> JS failed ($T)" >&2
    exit 1
  fi
  node "gallery/office/geom/bin/$T.js" 2>&1 | tee "$OUT/js-$T.out"
  grep -q "ALL PASS" "$OUT/js-$T.out" || { echo "JavaScript run failed ($T)" >&2; exit 1; }
done

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
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
for T in $SUITES; do
  node bin/output.js -l=cpp "gallery/office/geom/tests/$T.rgr" -nodecli -d="$OUT" -o="$T.cpp" > "$OUT/cpp-$T.log" 2>&1 || {
    tail -20 "$OUT/cpp-$T.log"; echo "Ranger -> C++ failed ($T)" >&2; exit 1; }
  if grep -q '\[FAIL\]' "$OUT/cpp-$T.log"; then
    grep -A2 '\[FAIL\]' "$OUT/cpp-$T.log" | head -20
    echo "Ranger -> C++ failed ($T)" >&2
    exit 1
  fi
  "$CXX" -std=c++17 -I "$OUT" -o "$OUT/$T" "$OUT/$T.cpp"
  "$OUT/$T" 2>&1 | tee "$OUT/cpp-$T.out"
  grep -q "ALL PASS" "$OUT/cpp-$T.out" || { echo "C++ run failed ($T)" >&2; exit 1; }
done

echo
echo "guides in, geometry out, the same on both targets"
