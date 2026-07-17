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

# The façade PoC lives under three/tsx/ (it runs the canonical Three.js cube
# code 1:1 through the TSX interpreter against the three.tsx façade).
run_tsx_poc() {
  local name="$1"
  echo "### ${name}"
  $RGRC "gallery/game_engine/three/tsx/${name}.rgr" -d="$OUT" -o="${name}.js" >/dev/null 2>&1
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
run_suite three_cube_demo_test
run_suite three_gl_backend_test

# The 1:1 Three.js cube example, run through the TSX interpreter on the façade.
run_tsx_poc three_facade_poc
# The render bridge: the interpreted cube.tsx reconciled into the Ranger core and
# rasterised (software backend) — proves the façade scene actually renders.
run_tsx_poc three_tsx_bridge_test

echo "done."
