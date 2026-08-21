#!/usr/bin/env bash
# The same test, compiled twice.
#
# `[int]` is a reference on the JavaScript target and a by-value
# `std::vector<int>` parameter on the C++ one, so a function that answered by
# writing into an array argument worked in the browser and did nothing in the
# native build. That is what SoftPainter's clip did: the C++ build drew every
# rectangle and every border unclipped, and nothing noticed for as long as
# nothing was drawn outside a clip.
#
#   npm run datagrid:softclip:test
#
# The C++ half needs only a C++17 compiler; where there is none it says so and
# the JavaScript half still runs.
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/datagrid/tests/SoftClipTest.rgr
OUT=tmp/soft-clip
mkdir -p "$OUT" tmp

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/datagrid/bin -o=SoftClipTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested. That is worse than no test at all.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/datagrid/bin/SoftClipTest.js | tee "$OUT/js.out"
grep -q "ALL PASS" "$OUT/js.out" || { echo "JavaScript run failed" >&2; exit 1; }

CXX=""
for cc in g++ clang++; do
  if command -v "$cc" >/dev/null 2>&1; then CXX="$cc"; break; fi
done
if [ -z "$CXX" ]; then
  echo
  echo "==> C++  SKIPPED — no g++ or clang++ on PATH."
  echo "    The half of this test that catches by-value array bugs did not run."
  exit 0
fi

echo
echo "==> C++ ($CXX)"
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=SoftClipTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/softclip" "$OUT/SoftClipTest.cpp"
"$OUT/softclip" | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "both builds clip the same"
