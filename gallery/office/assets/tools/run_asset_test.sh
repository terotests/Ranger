#!/usr/bin/env bash
# A picture is its bytes, not the name someone gave the file.
#
# Compiled twice because almost everything here is byte arithmetic. The header
# reads are the reason: an `int` is a double on JavaScript and a signed 32-bit
# integer in C++, so a four-byte size field with its top bit set is exactly the
# input that would otherwise come back as two different numbers — and the
# digest is written from a CRC that is very often negative as a signed int.
#
#   npm run office:asset:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/office/assets/tests/OfficeAssetTest.rgr
OUT=tmp/office-asset
mkdir -p "$OUT" tmp gallery/office/assets/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/office/assets/bin -o=OfficeAssetTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/office/assets/bin/OfficeAssetTest.js | tee "$OUT/js.out"
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
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=OfficeAssetTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/officeasset" "$OUT/OfficeAssetTest.cpp"
"$OUT/officeasset" | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

# The digests have to be the same number on both targets, not merely valid on
# each. If they ever diverge, the same picture would be a different asset
# depending on which build wrote the file.
if ! diff -q "$OUT/js.out" "$OUT/cpp.out" > /dev/null; then
  echo
  echo "the two targets disagree:" >&2
  diff "$OUT/js.out" "$OUT/cpp.out" | head -20 >&2
  exit 1
fi

echo
echo "same bytes, same id, on both targets"
