#!/usr/bin/env bash
# Ranger Game Engine: tsx3d_sdl_runner.rgr -> C++ -> native SDL2 + OpenGL binary.
#
# Runs a .tsx *3D* game (first CLI arg) in a native SDL2/GL window through the
# TSX interpreter + Model3dScriptBridge — real GLB loading and GL-mesh creation
# driven from the script, no WASM. Counterpart to wasm3d_runner.rgr.
#
# Requirements:
#   * a C++17 compiler (clang++ or g++)
#   * SDL2 development libraries + OpenGL (libgl / GLESv2 on ARM)
#
# Usage:
#   ./gallery/game_engine/scripts/build-tsx3d-sdl.sh [--run [tsx] [frames]]
#   ./tmp/tsx3d-sdl/tsx3d_sdl                                          # default demo
#   ./tmp/tsx3d-sdl/tsx3d_sdl gallery/game_engine/games/model_viewer_tsx/index.tsx
#   SDL_VIDEODRIVER=dummy ./tmp/tsx3d-sdl/tsx3d_sdl <index.tsx> 120    # headless N frames

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/scripting/tsx3d_sdl_runner.rgr"
OUT_DIR="$ROOT/tmp/tsx3d-sdl"
CPP_FILE="$OUT_DIR/tsx3d_sdl.cpp"
BIN_FILE="$OUT_DIR/tsx3d_sdl"
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

if [[ "$(uname -s)" == "Darwin" ]]; then
  PREFERRED=(clang++ g++)
else
  PREFERRED=(g++ clang++)
fi
CXX=""
for cc in "${PREFERRED[@]}"; do
  if command -v "$cc" >/dev/null 2>&1; then
    CXX="$cc"
    break
  fi
done
if [[ -z "$CXX" ]]; then
  echo "error: no C++ compiler (clang++ / g++) found" >&2
  exit 1
fi

if command -v pkg-config >/dev/null 2>&1 && pkg-config --exists sdl2; then
  SDL_FLAGS="$(pkg-config --cflags --libs sdl2)"
elif command -v sdl2-config >/dev/null 2>&1; then
  SDL_FLAGS="$(sdl2-config --cflags --libs)"
else
  echo "error: SDL2 not found. Install libsdl2-dev (or brew install sdl2 on macOS)" >&2
  exit 1
fi

echo "==> 1/3 Ranger -> C++"
cd "$ROOT"
RANGER_OUT="$(RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" \
  -nodecli \
  -d="tmp/tsx3d-sdl" \
  -o="tsx3d_sdl.cpp" 2>&1)" || true
echo "$RANGER_OUT" | tail -20
if echo "$RANGER_OUT" | grep -q '\[FAIL\]'; then
  echo "error: Ranger compilation failed (see output above)" >&2
  exit 1
fi

cp "$ROOT/gallery/invaders/variant.hpp" "$OUT_DIR/variant.hpp"

echo "==> 2/3 $CXX -> native binary (SDL2 + OpenGL)"
GL_FLAGS=""
if [[ "$(uname -s)" == "Darwin" ]]; then
  GL_FLAGS="-framework OpenGL"
else
  ARCH="$(uname -m)"
  if [[ "$ARCH" == "aarch64" || "$ARCH" == arm* ]]; then
    # gfx_sdl.rgr uses GLES2/gl2.h on ARM (Raspberry Pi).
    if command -v pkg-config >/dev/null 2>&1 && pkg-config --exists glesv2; then
      GL_FLAGS="$(pkg-config --libs glesv2)"
    else
      GL_FLAGS="-lGLESv2"
    fi
  elif ldconfig -p 2>/dev/null | grep -q 'libGL\.so'; then
    GL_FLAGS="-lGL"
  fi
fi
if [[ -z "$GL_FLAGS" ]]; then
  echo "error: OpenGL not found. On Raspberry Pi: sudo apt-get install libgles2-mesa-dev" >&2
  exit 1
fi
# Optimize: the software renderer (SoftCanvas fills/blits) and interpreter are
# hot per-frame paths — building without -O left them ~5-6x slower and could
# push frame time past the 16.6ms vsync boundary (60 -> 30fps). -O3 inlines the
# buffer accessors, lowers span copies to memmove/memset and vectorizes the
# pixel loops (the car game "ar" then loads almost instantly). Override via
# CXX_OPT (e.g. CXX_OPT=-O2 or -g for debugging).
CXX_OPT="${CXX_OPT:--O3}"
WASM3_CFLAGS=(-I"$ROOT/runtime" -I"$WASM3_DIR" -Wno-unused-parameter -Wno-unused-variable)
WASM3_OBJS=()
OBJ_DIR="$OUT_DIR/wasm3-obj"
mkdir -p "$OBJ_DIR"
CC="${CXX%++}"
if command -v gcc >/dev/null 2>&1; then
  CC=gcc
fi
for src in "$WASM_BRIDGE" "${WASM3_SOURCES[@]}"; do
  base="$(basename "$src" .c)"
  obj="$OBJ_DIR/${base}.o"
  "$CC" -std=c11 -c "${WASM3_CFLAGS[@]}" "$src" -o "$obj"
  WASM3_OBJS+=("$obj")
done
# shellcheck disable=SC2086
"$CXX" $CXX_OPT -std=c++17 "${WASM3_CFLAGS[@]}" "$CPP_FILE" "${WASM3_OBJS[@]}" -o "$BIN_FILE" $SDL_FLAGS $GL_FLAGS -lm

echo "==> 3/3 Ready: $BIN_FILE"

if [[ "${1:-}" == "--run" ]]; then
  TSX="${2:-}"
  FRAMES="${3:-}"
  if [[ -z "$TSX" ]]; then
    echo "==> Running game launcher menu (arrows/space, F11 fullscreen, Q/Esc quit)"
    if [[ -n "$FRAMES" ]]; then
      SDL_VIDEODRIVER=dummy "$BIN_FILE" "$FRAMES"
    else
      "$BIN_FILE"
    fi
  else
    echo "==> Running $TSX (W/S move, F11 fullscreen, Q/Esc quit)"
    if [[ -n "$FRAMES" ]]; then
      SDL_VIDEODRIVER=dummy "$BIN_FILE" "$TSX" "$FRAMES"
    else
      "$BIN_FILE" "$TSX"
    fi
  fi
else
  echo "Launcher:       npm run engine:game-sdl:launcher"
  echo "Run:            npm run engine:game-sdl:run:pacman"
  echo "                npm run engine:game-sdl:run:invaders"
  echo "                npm run engine:game-sdl:run:breakout"
  echo "                npm run engine:game-sdl:run:pong"
  echo "Dev watch:        npm run engine:game:watch:pacman  (in-process hot reload)"
  echo "Headless smoke: npm run engine:game-sdl:smoke:pacman"
fi
