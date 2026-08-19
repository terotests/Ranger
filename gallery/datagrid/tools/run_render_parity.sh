#!/usr/bin/env bash
# The same spreadsheet, drawn by both builds, compared pixel for pixel.
#
# Ranger's `string` is UTF-16 code units on the JavaScript target and BYTES on
# the C++ one. Text handling can therefore be right in the browser and wrong in
# the native window without either complaining — a `.xlsx` full of Finnish place
# names once loaded as "HÃ¤meenlinna" only in the C++ build. Nothing short of
# drawing the sheet with both and comparing the pictures catches that.
#
#   npm run datagrid:render:parity
#
# The fixture is deliberately not ASCII: one-, two-, three- and four-byte
# characters, so every branch of a UTF-8 walk is exercised by drawing it.
set -euo pipefail
cd "$(cd "$(dirname "$0")/../../.." && pwd)"

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
SRC=gallery/datagrid/src/render_probe.rgr
BOOK=${1:-gallery/datagrid/fixtures/accented-text.xlsx}
OUT=tmp/render-parity
mkdir -p "$OUT"

fail_on_compile() {
  if grep -q '\[FAIL\]' "$1"; then
    grep -A2 '\[FAIL\]' "$1" | head -20
    echo "$2" >&2
    exit 1
  fi
}

echo "==> JavaScript"
node bin/output.js -es6 "$SRC" -d="$OUT" -o=render_js.js -nodecli > "$OUT/js.log" 2>&1 || true
fail_on_compile "$OUT/js.log" "Ranger -> JS failed"
node "$OUT/render_js.js" "$BOOK" js.png "$OUT" > /dev/null

CXX=""
for cc in g++ clang++; do
  if command -v "$cc" >/dev/null 2>&1; then CXX="$cc"; break; fi
done
if [ -z "$CXX" ]; then
  echo "==> C++  SKIPPED — no g++ or clang++ on PATH."
  echo "    The comparison that catches byte-vs-character bugs did not run."
  exit 0
fi

echo "==> C++ ($CXX)"
node bin/output.js -l=cpp "$SRC" -nodecli -d="$OUT" -o=render.cpp > "$OUT/cpp.log" 2>&1 || true
fail_on_compile "$OUT/cpp.log" "Ranger -> C++ failed"
cp gallery/invaders/variant.hpp "$OUT/variant.hpp"
"$CXX" -std=c++17 -O1 -I "$OUT" -o "$OUT/render" "$OUT/render.cpp"
"$OUT/render" "$BOOK" cpp.png "$OUT" > /dev/null

echo
if cmp -s "$OUT/js.png" "$OUT/cpp.png"; then
  echo "both builds drew $(basename "$BOOK") the same, pixel for pixel"
else
  echo "THE TWO BUILDS DREW DIFFERENT PICTURES" >&2
  echo "  $OUT/js.png   (JavaScript)" >&2
  echo "  $OUT/cpp.png  (C++)" >&2
  exit 1
fi
