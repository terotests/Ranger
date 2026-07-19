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
# Exit code is non-zero if any suite fails to compile or reports SOME FAILED.
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

echo "=============================================================="
if [ "$FAILED_SUITES" -eq 0 ]; then
  echo "v2 ALL GREEN — ${TOTAL_SUITES}/${TOTAL_SUITES} suites passed"
  exit 0
else
  echo "v2 FAILURES — ${FAILED_SUITES}/${TOTAL_SUITES} suites failed"
  exit 1
fi
