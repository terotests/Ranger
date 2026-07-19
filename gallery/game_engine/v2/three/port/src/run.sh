#!/usr/bin/env bash
# Compile the v2 three/port (Three.js Ranger port) test suites to ES6 and run
# under Node. Grep-able: prints "ALL PASS" per suite, plus a single aggregate
# "ALL PASS" / "passed=N failed=M" banner at the end. Exits non-zero on any
# failure. Run from anywhere.
#
# This is the v2 copy: sources + tests live under
#   gallery/game_engine/v2/three/port/{src,tests}
# (the v1 script targeted gallery/game_engine/three/{src,tsx,tests}).
set -u

ROOT="$(cd "$(dirname "$0")/../../../../../.." && pwd)"
cd "$ROOT"
PORT="gallery/game_engine/v2/three/port"
OUT=".three_port_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT
RGRC="node bin/output.js -es6"

TOTAL=0
FAILED=0

# run_suite <name> — a self-contained src/*_test.rgr (asset-free, pure logic).
run_suite() {
  local name="$1"
  TOTAL=$((TOTAL + 1))
  echo "### ${name}"
  if ! $RGRC "${PORT}/src/${name}.rgr" -d="$OUT" -o="${name}.js" >"$OUT/${name}.compile.log" 2>&1; then
    echo "  COMPILE FAIL ${name}"
    grep -A3 'FAIL\]' "$OUT/${name}.compile.log" | head -12
    FAILED=$((FAILED + 1))
    echo
    return
  fi
  local run_out
  run_out="$(node "$OUT/${name}.js" 2>&1)"
  echo "$run_out" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed="
  if ! echo "$run_out" | grep -q "ALL PASS"; then
    FAILED=$((FAILED + 1))
  fi
  echo
}

# run_feature <rel-under-tests> — an interpreter-driven feature suite.
run_feature() {
  local rel="$1"
  local name
  name="$(basename "$rel")"
  TOTAL=$((TOTAL + 1))
  echo "### ${name}"
  if ! $RGRC "${PORT}/tests/${rel}.rgr" -d="$OUT" -o="${name}.js" >"$OUT/${name}.compile.log" 2>&1; then
    echo "  COMPILE FAIL ${rel}"
    grep -A3 'FAIL\]' "$OUT/${name}.compile.log" | head -12
    FAILED=$((FAILED + 1))
    echo
    return
  fi
  local run_out
  run_out="$(node "$OUT/${name}.js" 2>&1)"
  echo "$run_out" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed=|value parity:"
  if ! echo "$run_out" | grep -q "ALL PASS"; then
    FAILED=$((FAILED + 1))
  fi
  echo
}

# ---- Curated green subset — pure-logic / asset-free ported classes -----------
run_suite three_vector3_test
run_suite three_math_utils_test
run_suite three_timer_test
run_suite three_box3_test
run_suite three_euler_test
run_suite three_quaternion_test
run_suite three_matrix4_test
run_suite three_object3d_test
run_suite three_light_test
run_suite three_directional_light_shadow_test
run_suite three_tone_mapping_test
run_suite three_perspective_camera_test
run_suite three_box_geometry_test
run_suite three_gltf_loader_test
run_suite three_gltf_file_test
run_suite three_json_test
run_suite three_http_test
run_suite three_light_probe_grid_test
run_suite three_light_probe_grid_helper_test
run_suite three_light_probe_generator_test
run_suite three_cube_camera_test
run_suite three_teapot_test
run_suite three_orbit_controls_test
run_suite three_first_person_controls_test
run_suite three_sun_shadow_rig_test
run_suite three_light_probe_volume_test
run_suite three_cube_texture_test
run_suite three_sky_test
run_suite three_mesh_test
run_suite three_cube_demo_test
run_suite three_gl_backend_test
run_suite three_scene_host_test

# ---- Value-parity conformance gate (interpreter-driven, asset-free) ----------
# Baseline idioms hard-asserted + measured "implemented=X/Y" parity %. GAPs are
# the backlog (failed=0 => ALL PASS). Uses the v2 migrate ComponentEngine/EvalValue.
run_feature value_parity/three_value_parity_test

# ---- EXCLUDED (staged; not in the green subset) ------------------------------
# The following feature suites import ../../tsx/three_tsx_bridge.rgr (the TSX
# render/host bridge), which has NOT been ported into v2/three/port yet. They
# need the interpreter render-bridge + scene reconciliation, so they are staged
# out of the reliable gate until the tsx bridge lands in v2:
#   tests/object_hierarchy/three_hierarchy_test
#   tests/spec/three_spec_runner
#   tests/geometry/three_geometry_parity_test
#   tests/animation/three_animation_test
#   tests/animation/three_crossfade_test

echo "== three/port summary =="
echo "passed=$((TOTAL - FAILED)) failed=${FAILED}"
if [ "$FAILED" -eq 0 ]; then
  echo "ALL PASS"
else
  echo "SOME FAILED"
  exit 1
fi
