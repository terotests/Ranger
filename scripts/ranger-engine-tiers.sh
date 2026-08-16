#!/usr/bin/env bash
# The whole ladder, on one program: the same Ranger source run five ways.
#
#   npm run engine:tiers
#
# Every row times itself from inside the program (`wall_clock_ms` around each
# case, best of five), so the numbers are the work and not the host's startup.
#
#   1 bytecode, Node        RgVM interpreting, JavaScript host
#   2 bytecode, native      RgVM interpreting, C++ host (rangercli)
#   3 tier 3, native        rangercli -jit: hot call groups through `cc -O3`
#   4 compiled JavaScript   the ordinary compiler's -es6 output, on Node
#   5 compiled C++          the ordinary compiler's -l=cpp output, at -O2
#
# Row 4 is the one to beat: it is what a Ranger program normally is on Node.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROGRAM="${1:-gallery/ranger_engine/examples/bench_cli.rgr}"
OUT="gallery/ranger_engine/bin"
TMP="tmp/engine-tiers"
BASE="$(basename "${PROGRAM%.*}")"
mkdir -p "$TMP"

if [ ! -f "$OUT/rg_build.js" ] || [ ! -f "$OUT/rg_cli.js" ] || [ ! -f "$OUT/rangercli" ]; then
  bash scripts/ranger-engine-build.sh build cli native
fi

echo "building $BASE.rgb, $BASE.js and $BASE (native) …"
RANGER_LIB="./compiler/;./lib/" node "$OUT/rg_build.js" "$PROGRAM" -o="$TMP/$BASE.rgb" -quiet > /dev/null
RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" node bin/output.js -es6 "$PROGRAM" -d="./$TMP" -o="$BASE.js" > /dev/null
RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" node bin/output.js -l=cpp "$PROGRAM" -d="./$TMP" -o="$BASE.cpp" > /dev/null
g++ -std=c++17 -O2 -o "$TMP/$BASE" "$TMP/$BASE.cpp"

run() {
  echo ""
  echo "── $1 ──────────────────────────────────────────────"
  shift
  "$@"
}

run "1  bytecode, Node host"        node "$OUT/rg_cli.js" "$TMP/$BASE.rgb"
run "2  bytecode, native host"      "./$OUT/rangercli" "$TMP/$BASE.rgb"
run "3  tier 3: cc -O3 JIT, native" "./$OUT/rangercli" -steps -jit=2 "$TMP/$BASE.rgb"
run "4  compiled JavaScript (V8)"   node "$TMP/$BASE.js"
run "5  compiled C++ -O2"           "./$TMP/$BASE"
