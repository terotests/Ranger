#!/usr/bin/env bash
# The shape catalogue, on JavaScript and on C++.
#
# The full suite (`npm run office:shapes:test`) imports both editors and is a
# JavaScript test for that reason. This is the small half that has to run
# natively, because the defect it exists for only appears there: a constructor
# that hands `this` to anything compiles clean on every target and aborts on
# C++ with `std::bad_weak_ptr`. See the file's own header.
#
#   npm run office:shapes:native
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
OUT=tmp/office-shapes
T=OfficeShapeNativeTest
mkdir -p "$OUT" gallery/office/bin

echo "==> JavaScript"
node bin/output.js -es6 "gallery/office/geom/tests/$T.rgr" -d=gallery/office/bin -o="$T.js" -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node "gallery/office/bin/$T.js" 2>&1 | tee "$OUT/js.out"
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
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
node bin/output.js -l=cpp "gallery/office/geom/tests/$T.rgr" -nodecli -d="$OUT" -o="$T.cpp" > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/$T" "$OUT/$T.cpp"
"$OUT/$T" 2>&1 | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "the catalogue builds and draws on both targets"
