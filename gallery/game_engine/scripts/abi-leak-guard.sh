#!/usr/bin/env bash
# abi-leak-guard.sh — catch the two IDEAL.md leaks mechanically (§7, IDEAL_TODO 0.2).
#
#   1. A GAME NAME in a file that is supposed to be generic engine core.
#   2. A GAME TAXONOMY constant frozen into a shared ABI header.
#
# Exit non-zero on any hit. Run from anywhere; paths are resolved relative to
# this script's game_engine root.
set -u

ENGINE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ENGINE_DIR" || exit 2

fail=0

# Game names that must never appear in a GENERIC core file. A game's own module
# (games/<name>/, *_autopeli_*, rust_autopeli/, etc.) is allowed to name itself;
# only files meant to be reused by a *second* game are checked here.
GAME_NAMES='autopeli|\bpong\b|pacman|invaders|breakout'

# Files that are supposed to be generic engine core (a second game must reuse
# them unchanged). Extend this list as the seam work (Phase 4) lands.
CORE_FILES=(
  scripting/wasm_physics_runner.rgr
  scripting/game_runtime.rgr
)

echo "== leak-guard: game names in generic core =="
for f in "${CORE_FILES[@]}"; do
  [ -f "$f" ] || continue
  if grep -niE "$GAME_NAMES" "$f" >/dev/null 2>&1; then
    echo "LEAK: game name in generic core file: $f"
    grep -niE "$GAME_NAMES" "$f" | sed 's/^/    /'
    fail=1
  fi
done

# Taxonomy constants that must not live in a shared transport header.
HEADER_TAXONOMY='RG_WASM_GRIP_SCALE|RG_WASM_STEER_SCALE|RG_WASM_ID_CONE0|RG_WASM_ID_BAR0|RG_WASM_BODY_TRAFFIC0|RG_WASM_TRAFFIC_COUNT|RG_WASM_SOUND_(WALL|BOUNCE|WIN)|RG_WASM_BODY_P1|RG_WASM_BODY_P2|RG_SPR_CHAR_(HERO|KNIGHT|MAGE|ROGUE)|Standard body indices'

echo "== leak-guard: game taxonomy in shared headers =="
for f in wasm/wasm_game_abi.h wasm/wasm_sprite_abi.h wasm/wasm_pose_abi.h wasm/wasm_input_abi.h wasm/wasm_ui_abi.h; do
  [ -f "$f" ] || continue
  if grep -nE "$HEADER_TAXONOMY" "$f" >/dev/null 2>&1; then
    echo "LEAK: game taxonomy in shared header: $f"
    grep -nE "$HEADER_TAXONOMY" "$f" | sed 's/^/    /'
    fail=1
  fi
done

if [ "$fail" -eq 0 ]; then
  echo "OK: no ABI leaks detected."
else
  echo "FAIL: ABI leaks above must be routed through the guest / a provider."
fi
exit "$fail"
