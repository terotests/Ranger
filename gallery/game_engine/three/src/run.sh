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
run_suite three_teapot_test
run_suite three_orbit_controls_test
run_suite three_first_person_controls_test
run_suite three_cube_texture_test
run_suite three_sky_test
run_suite three_mesh_test
run_suite three_cube_demo_test
run_suite three_gl_backend_test
# The single-truth host registry (THREE_BRIDGE.md): every front-end commands this
# one registry by integer handle; no front-end owns Three objects privately.
run_suite three_scene_host_test

# The interpreter transport for the command ABI: bare `three_*(...)` calls
# routed through ThreeNativeBridge into the one shared ThreeSceneHost.
run_tsx_poc three_native_bridge_test
# The 1:1 Three.js cube example, run through the TSX interpreter on the façade.
run_tsx_poc three_facade_poc
# The render bridge: the interpreted cube.tsx reconciled into the Ranger core and
# rasterised (software backend) — proves the façade scene actually renders.
run_tsx_poc three_tsx_bridge_test
run_tsx_poc three_tsx_bridge_lit_test
run_tsx_poc three_tsx_bridge_texture_test
run_tsx_poc three_tsx_bridge_driven_test
run_tsx_poc three_tsx_bridge_features_test
run_tsx_poc three_teapot_tsx_test
# The Sponza light-probe scene (demo/host layer): the composition recipe, and
# sponza.tsx interpreted + reconciled into the core with hot-reload (editing the
# scene's params drives the Ranger scene live).
run_tsx_poc three_sponza_scene_test
run_tsx_poc three_sponza_tsx_test
# The teapot's lil-gui panel (demo/host layer): EVG panel rasterise + hit-testing.
run_tsx_poc three_gui_overlay_test

echo "done."
