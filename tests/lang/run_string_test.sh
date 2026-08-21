#!/usr/bin/env bash
# The same assertions, compiled twice.
#
# `indexOf`, `indexOfFrom`, `lastIndexOf`, `strsplit`, `to_lowercase`,
# `to_uppercase` and the file operators all lowered to C++ polyfills taking
# `std::string` BY VALUE. That is not a wrong answer — it is the same answer,
# arrived at after copying the argument — so nothing in the repository could
# have caught it, and nothing would catch putting it back. This pins the
# behaviour on both targets so the signatures can be trusted.
set -euo pipefail
cd "$(cd "$(dirname "$0")/../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=tests/lang/StringOpsTest.rgr
OUT=tmp/lang-string
mkdir -p "$OUT" tmp

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d="$OUT" -o=StringOpsTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node "$OUT/StringOpsTest.js" | tee "$OUT/js.out"
grep -q "ALL PASS" "$OUT/js.out" || { echo "JavaScript run failed" >&2; exit 1; }

CXX=""
for cc in g++ clang++; do
  if command -v "$cc" >/dev/null 2>&1; then CXX="$cc"; break; fi
done
if [ -z "$CXX" ]; then
  echo
  echo "==> C++  SKIPPED — no g++ or clang++ on PATH."
  echo "    The half of this test that exercises the polyfills did not run."
  exit 0
fi

echo
echo "==> C++ ($CXX)"
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=StringOpsTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
"$CXX" -std=c++17 -O2 -o "$OUT/stringops" "$OUT/StringOpsTest.cpp"
"$OUT/stringops" | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo "the string operators agree on both targets"
