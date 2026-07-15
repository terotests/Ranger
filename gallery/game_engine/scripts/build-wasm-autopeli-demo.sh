#!/usr/bin/env bash
# Compile and run wasm_autopeli_runner_demo (headless, no SDL window).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/scripting/wasm_autopeli_runner_demo.rgr"
OUT_DIR="$ROOT/tmp/wasm-autopeli-demo"
CPP_FILE="$OUT_DIR/wasm_autopeli_demo.cpp"
BIN_FILE="$OUT_DIR/wasm_autopeli_demo"
WASM3_DIR="$ROOT/runtime/wasm3"
WASM3_SOURCES=(
  "$WASM3_DIR/m3_bind.c"
  "$WASM3_DIR/m3_code.c"
  "$WASM3_DIR/m3_compile.c"
  "$WASM3_DIR/m3_core.c"
  "$WASM3_DIR/m3_env.c"
  "$WASM3_DIR/m3_exec.c"
  "$WASM3_DIR/m3_function.c"
  "$WASM3_DIR/m3_info.c"
  "$WASM3_DIR/m3_module.c"
  "$WASM3_DIR/m3_parse.c"
)
WASM_BRIDGE="$ROOT/runtime/rg_wasm_bridge.c"
WASM3_OBJS=()

mkdir -p "$OUT_DIR"

if [[ ! -f "$ROOT/gallery/game_engine/games/autopeli_wasm/logic.wasm" ]]; then
  bash "$ROOT/gallery/game_engine/games/autopeli_wasm/src/build.sh"
fi

echo "==> Ranger -> C++"
RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" -nodecli -d="tmp/wasm-autopeli-demo" -o="wasm_autopeli_demo.cpp"

cp "$ROOT/gallery/invaders/variant.hpp" "$OUT_DIR/variant.hpp"

WASM3_CFLAGS=(-I"$ROOT/runtime" -I"$WASM3_DIR" -Wno-unused-parameter -Wno-unused-variable)
OBJ_DIR="$OUT_DIR/wasm3-obj"
mkdir -p "$OBJ_DIR"
for src in "$WASM_BRIDGE" "${WASM3_SOURCES[@]}"; do
  base="$(basename "$src" .c)"
  obj="$OBJ_DIR/${base}.o"
  gcc -std=c11 -c "${WASM3_CFLAGS[@]}" "$src" -o "$obj"
  WASM3_OBJS+=("$obj")
done

echo "==> g++ -> demo binary"
g++ -O2 -std=c++17 "${WASM3_CFLAGS[@]}" "$CPP_FILE" "${WASM3_OBJS[@]}" -o "$BIN_FILE" -lm

echo "==> run"
cd "$ROOT"
"$BIN_FILE"
