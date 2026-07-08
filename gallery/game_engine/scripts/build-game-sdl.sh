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
#   ./tmp/game-sdl/game_sdl gallery/game_engine/scripting/pong.game.tsx
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
RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" \
  -nodecli \
  -d="tmp/game-sdl" \
  -o="game_sdl.cpp"

cp "$ROOT/gallery/invaders/variant.hpp" "$OUT_DIR/variant.hpp"

echo "==> 2/3 $CXX -> native binary (SDL2)"
# shellcheck disable=SC2086
"$CXX" -std=c++17 "$CPP_FILE" -o "$BIN_FILE" $SDL_FLAGS

echo "==> 3/3 Ready: $BIN_FILE"

if [[ "${1:-}" == "--run" ]]; then
  TSX="${2:-gallery/game_engine/scripting/pong.game.tsx}"
  FRAMES="${3:-}"
  echo "==> Running $TSX (W/S move, Q/Esc quit)"
  if [[ -n "$FRAMES" ]]; then
    SDL_VIDEODRIVER=dummy "$BIN_FILE" "$TSX" "$FRAMES"
  else
    "$BIN_FILE" "$TSX"
  fi
else
  echo "Run:            npm run engine:game-sdl:run:pacman"
  echo "                npm run engine:game-sdl:run:invaders"
  echo "                npm run engine:game-sdl:run:breakout"
  echo "                npm run engine:game-sdl:run:pong"
  echo "Dev watch:        npm run engine:game:watch:pacman  (in-process hot reload)"
  echo "Headless smoke: npm run engine:game-sdl:smoke:pacman"
fi
