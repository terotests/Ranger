#!/usr/bin/env bash
# ==============================================================================
# v2/tests/run.sh — compile every v2 unit/contract suite to ES6 and run it.
# ==============================================================================
# Each suite prints "  PASS <name>" / "  FAIL <name>" and a grep-able summary
# line ("ALL PASS" / "SOME FAILED"). This driver compiles every registered
# suite, runs it under Node, and prints a final ALL-GREEN / FAILURES banner with
# an aggregate pass/fail count. Run from anywhere.
#
#   bash gallery/game_engine/v2/tests/run.sh
#
# Exit code is non-zero if any suite fails to compile or reports SOME FAILED,
# or if the post-suite boundary gate fails (out-of-v2 Imports / game-name leaks).
# ==============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"
OUT=".v2_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT
RGRC="node bin/output.js -es6"
V2="gallery/game_engine/v2"

TOTAL_SUITES=0
FAILED_SUITES=0
BOUNDARY_FAIL=0

# run_suite <relative-path-under-v2 without .rgr>
run_suite() {
  local rel="$1"
  local name
  name="$(basename "$rel")"
  TOTAL_SUITES=$((TOTAL_SUITES + 1))
  echo "### ${rel}"
  if ! $RGRC "${V2}/${rel}.rgr" -d="$OUT" -o="${name}.js" >"$OUT/${name}.compile.log" 2>&1; then
    echo "  COMPILE FAIL ${rel}"
    grep -A3 'FAIL\]' "$OUT/${name}.compile.log" | head -12
    FAILED_SUITES=$((FAILED_SUITES + 1))
    echo
    return
  fi
  local run_out
  run_out="$(node "$OUT/${name}.js" 2>&1)"
  echo "$run_out" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed="
  if ! echo "$run_out" | grep -q "ALL PASS"; then
    FAILED_SUITES=$((FAILED_SUITES + 1))
  fi
  echo
}

# ---- Phase 1 — D-IDENTITY ----------------------------------------------------
run_suite interp/values/tests/rg_value_test
run_suite interp/semantics/tests/rg_semantics_test
run_suite tests/contract/d_identity/d_identity_contract_test

# ---- Phase 2 — host handles / arenas / ownership (D-HANDLE / D-TYPE / D-OWN) --
run_suite host/handles/tests/rg_handle_test
run_suite host/tests/create_release/create_release_test
run_suite host/tests/ownership/ownership_test
run_suite host/tests/stale_cross_realm/stale_cross_realm_test
run_suite tests/contract/d_own/d_own_contract_test

# ---- Phase 3 — registry schema + codegen + golden ids (D-REGISTRY) -----------
run_suite registry/schema/tests/schema_validation_test
run_suite registry/codegen/tests/codegen_parity_test
run_suite registry/codegen/tests/golden_id_test

# ---- Phase 4 — native adapter (D-ADAPTER / D-PROP / hybrid invariants) --------
run_suite interp/adapter/tests/adapter_construct_test
run_suite interp/adapter/tests/adapter_overlay_test
run_suite interp/adapter/tests/adapter_hybrid_test
run_suite tests/unit/interp/adapter_churn_test

# ---- Phase 5 — WASM bridge (D-WASM / D-WASM-MEM / D-ASYNC) --------------------
run_suite bridge/wasm/tests/create_free/create_free_test
run_suite bridge/wasm/tests/retain_release/retain_release_test
run_suite bridge/wasm/tests/async_poll/async_poll_test
run_suite bridge/wasm/tests/span_bounds/span_bounds_test
run_suite bridge/parity/tests/parity_test

# ---- Phase 6 — lifetimes (D-LIFE) --------------------------------------------
run_suite host/tests/membership/membership_test
run_suite host/tests/dispose_backend/dispose_backend_test
run_suite tests/contract/d_life/d_life_contract_test

# ---- Phase 7 — geometry upload / aliasing (D-GEO / D-WASM-MEM) ---------------
run_suite tests/contract/d_geo/d_geo_contract_test

# ---- Phase 8a — module isolation + runtime root (D-MODULES) ------------------
run_suite interp/module_isolation/tests/module_isolation_test
run_suite tests/contract/d_modules/d_modules_contract_test
# engine-level scope isolation: the real ComponentEngine enforces the rules the
# RgModuleSystem model pins (per-module scopes, import-clause-only visibility)
run_suite tests/unit/interp/module_scope_isolation_test

# ---- Phase 8b — frame pipeline + runtime.time (D-MODULES) --------------------
run_suite runtime/frame/tests/frame_pipeline_test
run_suite runtime/tests/clock_test

# ---- Phase 9 — physics (headless) --------------------------------------------
run_suite physics/tests/physics_step_test
run_suite physics/tests/pose_sync_test
# Cannon.js port kernel — all 23 rigid-body suites via one aggregating entry
run_suite physics/cannon/tests/cannon_suite_test

# ---- Phase 10b — D-2D ranger:2d (P1) -----------------------------------------
run_suite tests/contract/d_2d/d_2d_contract_test

# ---- Phase 11 — render (software 2D present, D-SYNC) -------------------------
run_suite render/tests/software_present2d_test
# texture pixel store + sampling backend (real texels, sprite size/z/flip)
run_suite modules/ranger_2d/tests/texture_store_test
run_suite tests/render/textured_render_test
# native SDL host — testable seams (framebuffer->RGBA pack, input map); the
# import also compile-checks the whole native driver against the gfx_* stubs
run_suite tests/sdl/sdl_host_test

# ---- PLAN_2D_EMBED_3D — H1–H4 path A (SW 3D → CPU Texture2D → SW 2D) ---------
run_suite tests/contract/d_graphics/rtt_sprite_test
run_suite tests/contract/d_graphics/embed3d_correctness_test

# ---- Phase 10 — audio / input / surface devices (fakes) ---------------------
run_suite modules/ranger_core/tests/devices_test
# headless music: score parse -> beat schedule -> equal-tempered PCM synth
# (self-contained under v2/audio; the SDL gfx_audio_* sink consumes this PCM)
run_suite audio/tests/audio_score_test

# ---- BRIDGES.md steps 1–2 — schema rows + generic registry bridge ------------
run_suite registry/schema/tests/bridge_schema_test
run_suite tests/unit/bridge/registry_bridge_coverage_test

# ---- menu / EVG launcher UI (self-contained ui/ + evg + fonts + framebuffer) -
run_suite menu/tests/launcher_ui_test
# EVG layout/color/text/path primitives that back the launcher UI
run_suite evg/evg_test

# ---- lpc — LPC sprite pipeline (PNG decode → RGBA parity, P0) ----------------
run_suite lpc/tests/png_decoder_test

# ---- BRIDGES.md step 3 — real TSX guests on the ONE generic host -------------
# Games are TSX-only folders (no per-game .rgr); RgGameHost is the single
# generic host (v1 GameRunner analog). These are thin test drivers.
run_suite tests/e2e/ylos2_e2e_test
run_suite tests/e2e/ylos3d_e2e_test
run_suite tests/e2e/launcher_e2e_test

# ---- Boundary gate (static) — after suites; cheap Import / title scan --------
# Unit/contract suites prove behaviour; this proves the *tree* did not grow
# game-specific core or new out-of-v2 Imports. Known staged debt is allowlisted
# in tests/boundary_import_allowlist.txt (shrink only). See TODO.md.
echo
if ! python3 "${V2}/tests/check_boundaries.py"; then
  BOUNDARY_FAIL=1
fi
echo

echo "=============================================================="
if [ "$FAILED_SUITES" -eq 0 ] && [ "$BOUNDARY_FAIL" -eq 0 ]; then
  echo "v2 ALL GREEN — ${TOTAL_SUITES}/${TOTAL_SUITES} suites passed (+ boundary gate)"
  exit 0
fi
if [ "$FAILED_SUITES" -ne 0 ]; then
  echo "v2 FAILURES — ${FAILED_SUITES}/${TOTAL_SUITES} suites failed"
fi
if [ "$BOUNDARY_FAIL" -ne 0 ]; then
  echo "v2 BOUNDARY FAIL — see check_boundaries.py output above"
fi
exit 1
