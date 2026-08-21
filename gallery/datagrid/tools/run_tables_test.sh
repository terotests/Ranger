#!/usr/bin/env bash
# The same test, compiled twice.
#
# A structured reference matches a COLUMN BY NAME, and names are where the two
# string models disagree: `to_lowercase` is Unicode-aware on the JavaScript
# target and byte-wise on the C++ one, and the escape reader walks a name a
# character at a time. Neither has to behave identically for the feature to
# work, but they do have to behave the SAME, and only running both can say so.
#
#   npm run datagrid:tables:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/datagrid/tests/TableRefTest.rgr
OUT=tmp/table-ref
mkdir -p "$OUT" tmp gallery/datagrid/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/datagrid/bin -o=TableRefTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/datagrid/bin/TableRefTest.js | tee "$OUT/js.out"
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
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=TableRefTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/tableref" "$OUT/TableRefTest.cpp"
"$OUT/tableref" | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "structured references resolve to the same cells in both string models"
