#!/usr/bin/env bash
# Compile the physics/tsx façade+bridge suites to ES6 and run under Node.
# Grep-able: prints "ALL PASS" per suite on success. Run from anywhere.
#
# Proves a canonical cannon-es script runs 1:1 in the TSX interpreter against the
# cannon.tsx façade, reconciled + stepped through the Ranger Cannon core by
# CannonTsxBridge (the physics analogue of ThreeTsxBridge).
set -e

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"
OUT=".physics_tsx_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT
RGRC="node bin/output.js -es6"

run_tsx() {
  local name="$1"
  echo "### ${name}"
  RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" \
    $RGRC "gallery/game_engine/physics/tsx/${name}.rgr" -d="$OUT" -o="${name}.js" >/dev/null 2>&1
  node "$OUT/${name}.js" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed="
  echo
}

# The 1:1 cannon-es box example, interpreted on the cannon.tsx façade and stepped
# through the Ranger Cannon core — proves the façade scene actually simulates.
run_tsx cannon_tsx_bridge_test
