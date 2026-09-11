#!/usr/bin/env bash
# The same string, the same width, on every target.
#
# A run's x on a slide is the sum of the widths of the runs before it, so a
# width that differs by a character's worth moves a whole line — and moves it
# only on the target where the difference is. The .pptx WebAssembly parity
# check finds that, at the cost of an emscripten toolchain and a two-minute
# build. This finds it in a second, and names the string.
#
# The check is not against constants: it compiles the SAME probe twice and
# diffs the two outputs. An assertion against a number would be an assertion
# about a particular font file.
#
#   npm run office:measure:targets
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/office/text/tests/OfficeMeasureTargetsTest.rgr
OUT=tmp/office-measure-targets
mkdir -p "$OUT" gallery/office/text/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/office/text/bin -o=OfficeMeasureTargetsTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/office/text/bin/OfficeMeasureTargetsTest.js 2>&1 | grep -v '^FontManager:' | tee "$OUT/js.out"
grep -q "ALL PASS" "$OUT/js.out" || { echo "JavaScript run failed" >&2; exit 1; }

CXX=""
for cc in g++ clang++; do
  if command -v "$cc" >/dev/null 2>&1; then CXX="$cc"; break; fi
done
if [ -z "$CXX" ]; then
  echo
  echo "==> C++  SKIPPED — no g++ or clang++ on PATH."
  echo "ALL PASS"
  exit 0
fi

echo
echo "==> C++ ($CXX)"
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=OfficeMeasureTargetsTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/measuretargets" "$OUT/OfficeMeasureTargetsTest.cpp"
"$OUT/measuretargets" 2>&1 | grep -v '^FontManager:' | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
if diff -u "$OUT/js.out" "$OUT/cpp.out" > "$OUT/diff.txt"; then
  echo "one width per string, on both targets"
else
  echo "THE TWO TARGETS MEASURE DIFFERENTLY:"
  cat "$OUT/diff.txt"
  echo
  echo "A run's x is the sum of the widths before it, so this moves whole lines"
  echo "on one target and not the other. gallery/pptx/web/wasm/parity.mjs is"
  echo "what sees it downstream, forty-seven commands at a time."
  exit 1
fi
