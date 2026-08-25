#!/usr/bin/env bash
# One container reader, three ODF formats — compiled twice.
#
# The invariant is the OPC one restated for a container that has no
# relationships: every `xlink:href` in `content.xml` and `styles.xml` has to
# name a member the ZIP actually contains. A relative path left unresolved
# becomes a member name no ZIP has, and the picture silently does not appear.
#
# The C++ half is not redundant. Package paths are split and rejoined, and
# `sniffKind` builds a media type one BYTE at a time out of the archive's first
# hundred — which is the identity where a string is bytes and a re-encode where
# it is UTF-16 code units. A format sniff that works on one target and not the
# other is exactly the bug this run can see and the JavaScript one cannot.
#
#   npm run odf:package:test
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/odf/tests/OdfPackageTest.rgr
OUT=tmp/odf-package
mkdir -p "$OUT" tmp gallery/odf/bin

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d=gallery/odf/bin -o=OdfPackageTest.js -nodecli > "$OUT/js.log" 2>&1 || {
  tail -20 "$OUT/js.log"; echo "Ranger -> JS failed" >&2; exit 1; }
# The compiler can report [FAIL] and still exit 0, and the stale build from the
# last run would then be what gets tested.
if grep -q '\[FAIL\]' "$OUT/js.log"; then
  grep -A2 '\[FAIL\]' "$OUT/js.log" | head -20
  echo "Ranger -> JS failed" >&2
  exit 1
fi
node gallery/odf/bin/OdfPackageTest.js | tee "$OUT/js.out"
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
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=OdfPackageTest.cpp > "$OUT/cpp.log" 2>&1 || {
  tail -20 "$OUT/cpp.log"; echo "Ranger -> C++ failed" >&2; exit 1; }
if grep -q '\[FAIL\]' "$OUT/cpp.log"; then
  grep -A2 '\[FAIL\]' "$OUT/cpp.log" | head -20
  echo "Ranger -> C++ failed" >&2
  exit 1
fi
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -I "$OUT" -o "$OUT/odfpackage" "$OUT/OdfPackageTest.cpp"
"$OUT/odfpackage" | tee "$OUT/cpp.out"
grep -q "ALL PASS" "$OUT/cpp.out" || { echo "C++ run failed" >&2; exit 1; }

echo
echo ".odp, .odt and .ods opened by one package reader, on both targets"
