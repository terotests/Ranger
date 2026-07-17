#!/usr/bin/env bash
# Compile the three/ (Three.js Ranger port) test suites to ES6 and run under Node.
# Grep-able: prints "ALL PASS" per suite on success. Run from anywhere.
set -e

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"
OUT=".three_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT
RGRC="node bin/output.js -es6"

run_suite() {
  local name="$1"
  echo "### ${name}"
  $RGRC "gallery/game_engine/three/src/${name}.rgr" -d="$OUT" -o="${name}.js" >/dev/null 2>&1
  node "$OUT/${name}.js" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed="
  echo
}

# One suite per ported class (grows piece by piece).
run_suite three_vector3_test
run_suite three_euler_test
run_suite three_quaternion_test
run_suite three_matrix4_test
run_suite three_object3d_test
run_suite three_perspective_camera_test
run_suite three_box_geometry_test
run_suite three_mesh_test

echo "done."
