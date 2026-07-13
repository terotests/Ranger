#!/usr/bin/env bash
# Build + run the separate-resource-loader PoC: a game guest spawns an
# AssemblyScript loader (resource_loader.wasm) via env.rg_spawn_worker and drives
# it to produce resources.
#
# Usage:
#   ./gallery/game_engine/scripts/build-loader-poc.sh          # build wasm + harness, run
#   ./gallery/game_engine/scripts/build-loader-poc.sh --no-run # build only

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
RWORKER="$ROOT/gallery/game_engine/wasm/rust_worker"
ASLOADER="$ROOT/gallery/game_engine/wasm/as_resource_loader"
GAME_WASM="$ROOT/gallery/game_engine/games/streaming_worker/worker.wasm"
LOADER_WASM="$ROOT/gallery/game_engine/games/streaming_worker/resource_loader.wasm"
HARNESS="$RWORKER/loader_poc.c"
OUT_DIR="$ROOT/tmp/worker-demo"
BIN="$OUT_DIR/loader_poc"
WASM3_DIR="$ROOT/runtime/wasm3"
WASM_BRIDGE="$ROOT/runtime/rg_wasm_bridge.c"
WASM3_SOURCES=(
  "$WASM3_DIR/m3_bind.c" "$WASM3_DIR/m3_code.c" "$WASM3_DIR/m3_compile.c"
  "$WASM3_DIR/m3_core.c" "$WASM3_DIR/m3_env.c" "$WASM3_DIR/m3_exec.c"
  "$WASM3_DIR/m3_function.c" "$WASM3_DIR/m3_info.c" "$WASM3_DIR/m3_module.c"
  "$WASM3_DIR/m3_parse.c"
)

mkdir -p "$OUT_DIR"

echo "==> 1/3 build game guest (Rust) worker.wasm"
bash "$RWORKER/build.sh"

echo "==> 2/3 build resource loader (AssemblyScript) resource_loader.wasm"
bash "$ASLOADER/build.sh"

echo "==> 3/3 build PoC host harness (wasm3 bridge)"
CC="${CC:-gcc}"
CFLAGS=(-std=c11 -O2 -I"$ROOT/runtime" -I"$WASM3_DIR"
        -Wno-unused-parameter -Wno-unused-variable)
"$CC" "${CFLAGS[@]}" "$HARNESS" "$WASM_BRIDGE" "${WASM3_SOURCES[@]}" -o "$BIN" -lm
echo "==> built $BIN"

if [[ "${1:-}" != "--no-run" ]]; then
  echo "==> run"
  "$BIN" "$GAME_WASM" "$LOADER_WASM"
fi
