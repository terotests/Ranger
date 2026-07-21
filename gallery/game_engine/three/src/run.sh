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

# Feature test folders (three/tests/<feature>/): each is a self-contained,
# interpreter-driven suite — a JS .tsx scene + its .rgr driver + a README. Pass the
# path under three/tests (e.g. "value_parity/three_value_parity_test"). The broad
# grep also surfaces the "value parity: implemented=X/Y" measurement line.
run_feature() {
  local rel="$1"
  local name="$(basename "$rel")"
  echo "### ${name}"
  $RGRC "gallery/game_engine/three/tests/${rel}.rgr" -d="$OUT" -o="${name}.js" >/dev/null 2>&1
  node "$OUT/${name}.js" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed=|value parity:"
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
run_suite three_tube_geometry_test
run_suite three_gltf_loader_test
run_suite three_gltf_file_test
run_suite three_json_test
run_suite three_http_test
run_suite three_light_probe_grid_test
run_suite three_light_probe_grid_helper_test
# Three.js cube→SH projection (LightProbeGenerator): the generic, scene-capturing
# diffuse-GI bake that replaces the analytic sun/sky/ground stand-in.
run_suite three_light_probe_generator_test
# CubeCamera capture → LightProbeGenerator projection, end-to-end: a bright box on
# one side of a probe drives the probe's irradiance that way (capture the real scene).
run_suite three_cube_camera_test
run_suite three_teapot_test
run_suite three_orbit_controls_test
run_suite three_first_person_controls_test
# Reusable GPU-technique rigs (composed by the Sponza recipe; usable by any scene).
run_suite three_sun_shadow_rig_test
run_suite three_light_probe_volume_test
run_suite three_cube_texture_test
run_suite three_sky_test
run_suite three_mesh_test
run_suite three_cube_demo_test
run_suite three_gl_backend_test
# The single-truth host registry (THREE_BRIDGE.md): every front-end commands this
# one registry by integer handle; no front-end owns Three objects privately.
run_suite three_scene_host_test

# The value-parity conformance gate (three/tests/value_parity/, THREE.md §9):
# baseline idioms hard-asserted (regression gate), plus the measured
# "implemented=X/Y" parity % against real-three.js goldens. GAPs are the backlog.
run_feature value_parity/three_value_parity_test

# The interpreter transport for the command ABI: bare `three_*(...)` calls
# routed through ThreeNativeBridge into the one shared ThreeSceneHost.
run_tsx_poc three_native_bridge_test
# Convergence: the interpreter front-end and a direct-command guest land on
# identical host-registry state, and both drive ONE shared registry.
run_tsx_poc three_convergence_test
# Primitive + complex geometries (three/tests/geometry/): Plane/Circle/Ring/Sphere/
# Cylinder/Cone/Torus/TorusKnot driven THROUGH THE INTERPRETER — the JS scene
# supplies args, the real geometry is built in the Ranger host, validated vs goldens.
run_feature geometry/three_geometry_parity_test
# Multi-feature spec runner (three/tests/spec/): ONE compiled runner, data-driven
# from spec_goldens.json — camera + projection matrix, transformed-mesh world
# matrix, colour families, and view-frustum culling, all validated vs real three.js
# with no rendering. Compiled once instead of one .rgr per feature (the speedup).
run_feature spec/three_spec_runner
# Object hierarchy (three/tests/object_hierarchy/): a nested Group/mesh tree driven
# through the interpreter, reconciled into the host with real parenting; each
# node's composed world matrix validated vs real three.js. No rendering.
run_feature object_hierarchy/three_hierarchy_test
# Animation (three/tests/animation/): keyframe sampling (linear + quaternion slerp)
# + an AnimationMixer, driven through the interpreter — the host samples the clip
# and writes the target entity's TRS; validated vs real three.js. No rendering.
run_feature animation/three_animation_test
# Crossfade (three/tests/animation/): two clips blended by per-action weight —
# weighted lerp (position) + incremental slerp (quaternion), matching three.js's
# NormalAnimationBlendMode. Driven through the interpreter, no rendering.
run_feature animation/three_crossfade_test
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
# The Sponza light-probe scene: sponza.tsx (a faithful port of the upstream three.js
# example — bounds, bounds-derived sun+shadow, probes.bake capture bake) interpreted
# + reconciled through the ONE generic bridge, with hot-reload. No model-named recipe.
run_tsx_poc three_sponza_tsx_test
# Sponza game-controller navigation (value-parity path): the scene reads the
# STANDARD navigator.getGamepads() from its update() loop and returns a movement/
# look intent the host applies to the first-person camera — no engine-specific name.
run_tsx_poc three_gamepad_nav_test
# The teapot's lil-gui panel (demo/host layer): EVG panel rasterise + hit-testing.
run_tsx_poc three_gui_overlay_test

echo "done."
