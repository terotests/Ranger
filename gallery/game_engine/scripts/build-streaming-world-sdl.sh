#!/usr/bin/env bash
# Build + run the streaming world in the engine's SDL renderer.
# streaming_world_sdl.rgr -> C++ -> SDL2 binary that drives worker.wasm + the
# spawned resource_loader.wasm through StreamingWorldRunner and presents via
# gfx_present.
#
# Usage:
#   ./gallery/game_engine/scripts/build-streaming-world-sdl.sh [frames]
#   ./gallery/game_engine/scripts/build-streaming-world-sdl.sh --no-run

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/ranger_games/streaming_world_sdl.rgr"
OUT_DIR="$ROOT/tmp/streaming-world"
CPP_FILE="$OUT_DIR/streaming_world_sdl.cpp"
BIN_FILE="$OUT_DIR/streaming_world_sdl"
WASM3_DIR="$ROOT/runtime/wasm3"
WASM_BRIDGE="$ROOT/runtime/rg_wasm_bridge.c"
WASM3_SOURCES=(
  "$WASM3_DIR/m3_bind.c" "$WASM3_DIR/m3_code.c" "$WASM3_DIR/m3_compile.c"
  "$WASM3_DIR/m3_core.c" "$WASM3_DIR/m3_env.c" "$WASM3_DIR/m3_exec.c"
  "$WASM3_DIR/m3_function.c" "$WASM3_DIR/m3_info.c" "$WASM3_DIR/m3_module.c"
  "$WASM3_DIR/m3_parse.c"
)
mkdir -p "$OUT_DIR"

if [[ "$(uname -s)" == "Darwin" ]]; then PREFERRED=(clang++ g++); else PREFERRED=(g++ clang++); fi
CXX=""
for cc in "${PREFERRED[@]}"; do command -v "$cc" >/dev/null 2>&1 && { CXX="$cc"; break; }; done
[[ -z "$CXX" ]] && { echo "error: no C++ compiler" >&2; exit 1; }

if command -v pkg-config >/dev/null 2>&1 && pkg-config --exists sdl2; then
  SDL_FLAGS="$(pkg-config --cflags --libs sdl2)"
elif command -v sdl2-config >/dev/null 2>&1; then
  SDL_FLAGS="$(sdl2-config --cflags --libs)"
else
  echo "error: SDL2 not found (install libsdl2-dev)" >&2; exit 1
fi

echo "==> 0/3 build worker.wasm + resource_loader.wasm"
bash "$ROOT/gallery/game_engine/wasm/rust_worker/build.sh"
bash "$ROOT/gallery/game_engine/wasm/as_resource_loader/build.sh"
# Keep the SDL-menu game folder's copies in sync (games/streaming_world/).
GAME_DIR="$ROOT/gallery/game_engine/games/streaming_world"
mkdir -p "$GAME_DIR"
cp "$ROOT/gallery/game_engine/games/streaming_worker/worker.wasm" "$GAME_DIR/worker.wasm"
cp "$ROOT/gallery/game_engine/games/streaming_worker/resource_loader.wasm" "$GAME_DIR/resource_loader.wasm"

echo "==> 1/3 Ranger -> C++"
cd "$ROOT"
RANGER_OUT="$(RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" -nodecli -d="tmp/streaming-world" -o="streaming_world_sdl.cpp" 2>&1)" || true
echo "$RANGER_OUT" | tail -25
if echo "$RANGER_OUT" | grep -q '\[FAIL\]'; then
  echo "error: Ranger compilation failed" >&2; exit 1
fi
cp "$ROOT/gallery/invaders/variant.hpp" "$OUT_DIR/variant.hpp"

echo "==> 2/3 $CXX -> native binary (SDL2 + OpenGL + wasm3)"
GL_FLAGS="-lGL"
if [[ "$(uname -s)" == "Darwin" ]]; then GL_FLAGS="-framework OpenGL"; fi
WASM3_CFLAGS=(-I"$ROOT/runtime" -I"$WASM3_DIR" -Wno-unused-parameter -Wno-unused-variable)
OBJ_DIR="$OUT_DIR/wasm3-obj"; mkdir -p "$OBJ_DIR"
CC="gcc"; command -v gcc >/dev/null 2>&1 || CC="${CXX%++}"
WASM3_OBJS=()
for src in "$WASM_BRIDGE" "${WASM3_SOURCES[@]}"; do
  obj="$OBJ_DIR/$(basename "$src" .c).o"
  "$CC" -std=c11 -c "${WASM3_CFLAGS[@]}" "$src" -o "$obj"
  WASM3_OBJS+=("$obj")
done
# shellcheck disable=SC2086
"$CXX" -O2 -std=c++17 "${WASM3_CFLAGS[@]}" "$CPP_FILE" "${WASM3_OBJS[@]}" -o "$BIN_FILE" $SDL_FLAGS $GL_FLAGS -lm
echo "==> 3/3 Ready: $BIN_FILE"

if [[ "${1:-}" != "--no-run" ]]; then
  FRAMES="${1:-300}"
  echo "==> run ($FRAMES frames, dummy driver)"
  SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy "$BIN_FILE" "$FRAMES"
fi
