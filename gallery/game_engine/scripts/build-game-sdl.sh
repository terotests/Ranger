#!/usr/bin/env bash
# Ranger Game Engine: game_sdl_runner.rgr -> C++ -> native SDL2 scripted-game binary.
#
# Loads a .tsx game script (first CLI arg) and runs it in a native SDL2 window via
# GameRunner + gfx_sdl. Same stack as pong_sdl.rgr but script-driven.
#
# Requirements:
#   * a C++17 compiler (clang++ or g++)
#   * SDL2 development libraries
#
# Usage:
#   ./gallery/game_engine/scripts/build-game-sdl.sh [--run [tsx] [frames]]
#   ./tmp/game-sdl/game_sdl                                    # launcher menu
#   ./tmp/game-sdl/game_sdl --games-dir=./mygames
#   ./tmp/game-sdl/game_sdl gallery/game_engine/games/pong/index.tsx
#   SDL_VIDEODRIVER=dummy ./tmp/game-sdl/game_sdl gallery/game_engine/scripting/pong.game.tsx 300

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/scripting/game_sdl_runner.rgr"
OUT_DIR="$ROOT/tmp/game-sdl"
CPP_FILE="$OUT_DIR/game_sdl.cpp"
BIN_FILE="$OUT_DIR/game_sdl"

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
  -d="tmp/game-sdl" \
  -o="game_sdl.cpp" 2>&1)" || true
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
# push frame time past the 16.6ms vsync boundary (60 -> 30fps). -O2 lets the
# compiler inline the buffer accessors and lower span copies to memmove/memset.
CXX_OPT="${CXX_OPT:--O2}"
# shellcheck disable=SC2086
"$CXX" $CXX_OPT -std=c++17 "$CPP_FILE" -o "$BIN_FILE" $SDL_FLAGS $GL_FLAGS

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
