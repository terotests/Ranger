#!/usr/bin/env bash
# Build + run the worker-spawn capability demo: a guest loading ONE resource
# worker via env.rg_spawn_worker, with the limit-one / no-recursion checks.
#
# Usage:
#   ./gallery/game_engine/scripts/build-spawn-demo.sh          # build wasm + harness, run
#   ./gallery/game_engine/scripts/build-spawn-demo.sh --no-run # build only

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
CRATE="$ROOT/gallery/game_engine/wasm/rust_worker"
WASM="$ROOT/gallery/game_engine/games/streaming_worker/worker.wasm"
HARNESS="$CRATE/spawn_demo.c"
OUT_DIR="$ROOT/tmp/worker-demo"
BIN="$OUT_DIR/spawn_demo"
WASM3_DIR="$ROOT/runtime/wasm3"
WASM_BRIDGE="$ROOT/runtime/rg_wasm_bridge.c"
WASM3_SOURCES=(
  "$WASM3_DIR/m3_bind.c" "$WASM3_DIR/m3_code.c" "$WASM3_DIR/m3_compile.c"
  "$WASM3_DIR/m3_core.c" "$WASM3_DIR/m3_env.c" "$WASM3_DIR/m3_exec.c"
  "$WASM3_DIR/m3_function.c" "$WASM3_DIR/m3_info.c" "$WASM3_DIR/m3_module.c"
  "$WASM3_DIR/m3_parse.c"
)

mkdir -p "$OUT_DIR"

echo "==> 1/2 build worker.wasm"
bash "$CRATE/build.sh"

echo "==> 2/2 build spawn harness (wasm3 bridge)"
CC="${CC:-gcc}"
CFLAGS=(-std=c11 -O2 -I"$ROOT/runtime" -I"$WASM3_DIR"
        -Wno-unused-parameter -Wno-unused-variable)
"$CC" "${CFLAGS[@]}" "$HARNESS" "$WASM_BRIDGE" "${WASM3_SOURCES[@]}" -o "$BIN" -lm
echo "==> built $BIN"

if [[ "${1:-}" != "--no-run" ]]; then
  echo "==> run"
  "$BIN" "$WASM"
fi
