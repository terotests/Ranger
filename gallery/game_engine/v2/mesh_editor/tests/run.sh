#!/usr/bin/env bash
# ==============================================================================
# v2/mesh_editor/tests/run.sh — mesh editor gates (module smokes + browser e2e).
# ==============================================================================
# Mirrors the central v2/tests/run.sh grep convention: prints "  PASS/FAIL
# <name>" lines, then "passed=X failed=Y" and "ALL PASS" / "SOME FAILED".
#
#   bash gallery/game_engine/v2/mesh_editor/tests/run.sh
#
# Two layers:
#   1. module smokes  — app/scripts/smoke-*.mjs, pure Node, no browser needed
#   2. browser e2e    — tests/e2e/mesh_editor_e2e.mjs, real Vite + Chromium
#
# Exit codes: 0 = ALL PASS, 1 = failures, 3 = SKIPPED (prerequisites absent).
# Exit 3 lets the central driver report an honest SKIP instead of a fake pass on
# a machine with no `npm install` / no Chromium.
# ==============================================================================
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
MESH_EDITOR="$(cd "$HERE/.." && pwd)"
APP="$MESH_EDITOR/app"
ROOT="$(cd "$MESH_EDITOR/../../../.." && pwd)"
cd "$ROOT"

PASSED=0
FAILED=0

# ---- layer 1: module smokes (no browser) -------------------------------------
# Every smoke-*.mjs under app/scripts is discovered, so a new one cannot be
# added and silently left out of the gate (three were orphaned before this).
echo "### mesh_editor/app module smokes"
SMOKES="$(find "$APP/scripts" -maxdepth 1 -name 'smoke-*.mjs' | sort)"
if [ -z "$SMOKES" ]; then
  echo "  FAIL no smoke-*.mjs found under app/scripts"
  FAILED=$((FAILED + 1))
fi
for s in $SMOKES; do
  name="$(basename "$s" .mjs)"
  if out="$(node "$s" 2>&1)"; then
    echo "  PASS $name"
    PASSED=$((PASSED + 1))
  else
    echo "  FAIL $name"
    echo "$out" | tail -6 | sed 's/^/       /'
    FAILED=$((FAILED + 1))
  fi
done
echo

# ---- layer 2: JS-vs-Ranger port parity ---------------------------------------
# Rendering logic is being moved out of browser-only JS into Ranger (so it can
# also run native / wasm32). Each ported kernel keeps its JS reference until a
# parity suite proves the two agree on real inputs.
echo "### mesh_editor/tests/diff (JS reference vs Ranger port)"
for d in "$HERE"/diff/*.mjs; do
  [ -e "$d" ] || continue
  dname="$(basename "$d" .mjs)"
  if out="$(node "$d" 2>&1)"; then
    echo "$out" | grep -E "^  PASS |^  FAIL " | sed 's/^/  /' | head -0
    dp="$(echo "$out" | sed -n 's/^passed=\([0-9]*\).*/\1/p' | tail -1)"
    echo "  PASS $dname (${dp:-0} checks)"
    PASSED=$((PASSED + 1))
  else
    echo "  FAIL $dname"
    echo "$out" | grep -E "FAIL" | head -6 | sed 's/^/     /'
    FAILED=$((FAILED + 1))
  fi
done
echo

# ---- layer 3: browser e2e ----------------------------------------------------
echo "### mesh_editor/tests/e2e/mesh_editor_e2e"
E2E_OUT="$(node "$HERE/e2e/mesh_editor_e2e.mjs" 2>&1)"
E2E_CODE=$?
echo "$E2E_OUT" | grep -E "PASS |FAIL |SKIP |passed=" || true
if [ "$E2E_CODE" -eq 3 ]; then
  # Prerequisites absent — report SKIP upward without inventing a pass.
  echo
  echo "passed=$PASSED failed=$FAILED"
  if [ "$FAILED" -eq 0 ]; then
    echo "SKIPPED e2e (module smokes ALL PASS)"
    exit 3
  fi
  echo "SOME FAILED"
  exit 1
fi
E2E_PASSED="$(echo "$E2E_OUT" | sed -n 's/^passed=\([0-9]*\).*/\1/p' | tail -1)"
E2E_FAILED="$(echo "$E2E_OUT" | sed -n 's/^passed=[0-9]* failed=\([0-9]*\).*/\1/p' | tail -1)"
PASSED=$((PASSED + ${E2E_PASSED:-0}))
if [ "$E2E_CODE" -ne 0 ]; then
  FAILED=$((FAILED + ${E2E_FAILED:-1}))
fi
echo

echo "passed=$PASSED failed=$FAILED"
if [ "$FAILED" -eq 0 ]; then
  echo "ALL PASS"
  exit 0
fi
echo "SOME FAILED"
exit 1
