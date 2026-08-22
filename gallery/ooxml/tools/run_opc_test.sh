#!/usr/bin/env bash
# One container reader, three formats — compiled twice.
#
# The check that matters is that every internal relationship in a package names
# a part the package actually contains. Word's own reader could not hold that:
# it forced every target under `word/`, so `../media/image1.png` resolved to a
# path no ZIP has. The spreadsheet had no relationship layer at all.
#
# The C++ half is not redundant. Package paths are split and rejoined, and
# rebuilding a string character by character is the identity where a string is
# code units and a second UTF-8 encoding pass where it is bytes — so a package
# path with anything outside ASCII in it can resolve on one target and not the
# other, which is a difference only this run can see.
#
#   npm run ooxml:opc:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/ooxml/tests/OpcPackageTest.rgr
OUT=tmp/ooxml-opc
mkdir -p "$OUT" tmp gallery/ooxml/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/ooxml/bin -o=OpcPackageTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/ooxml/bin/OpcPackageTest.js | tee "$OUT/js.out"
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
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=OpcPackageTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/ooxmlopc" "$OUT/OpcPackageTest.cpp"
"$OUT/ooxmlopc" | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo ".docx, .xlsx and .pptx opened by one package reader, on both targets"
