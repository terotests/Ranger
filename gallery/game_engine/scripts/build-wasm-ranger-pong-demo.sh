#!/usr/bin/env bash
# Compile and run ranger_pong_runner_demo (headless, no SDL window).
#
# This drives games/ranger_pong/logic.wasm — a Pong compiled from the RANGER
# language — through the SAME host path (wasm3 + WasmGameRunner) that runs the
# Rust module in build-wasm-pong-demo.sh. If it prints "ranger-pong-runner done"
# the engine ran a Ranger-authored WASM game.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/scripting/ranger_pong_runner_demo.rgr"
OUT_DIR="$ROOT/tmp/ranger-pong-demo"
CPP_FILE="$OUT_DIR/ranger_pong_demo.cpp"
BIN_FILE="$OUT_DIR/ranger_pong_demo"
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

mkdir -p "$OUT_DIR"

# Build the Ranger-language guest module if it is missing.
if [[ ! -f "$ROOT/gallery/game_engine/games/ranger_pong/logic.wasm" ]]; then
  bash "$ROOT/gallery/game_engine/games/ranger_pong/src/build.sh"
fi

echo "==> Ranger -> C++ (host demo)"
RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" -nodecli -d="tmp/ranger-pong-demo" -o="ranger_pong_demo.cpp"

cp "$ROOT/gallery/invaders/variant.hpp" "$OUT_DIR/variant.hpp"

WASM3_CFLAGS=(-I"$ROOT/runtime" -I"$WASM3_DIR" -Wno-unused-parameter -Wno-unused-variable)
OBJ_DIR="$OUT_DIR/wasm3-obj"
mkdir -p "$OBJ_DIR"
WASM3_OBJS=()
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
