#!/usr/bin/env bash
# Ranger Game Engine: pong_sdl.rgr -> C++ -> native SDL2 window binary.
#
# This is the "real" desktop PoC: the pure Pong logic (pong_core.rgr) is drawn
# into an RGBA software framebuffer (framebuffer.rgr / pong_render.rgr) and that
# buffer is blitted to a native SDL2 window each frame (gfx_sdl.rgr). The same
# code drives the HDMI framebuffer on a Raspberry Pi.
#
# Requirements:
#   * a C++17 compiler (clang++ or g++)
#   * SDL2 development libraries
#       macOS:         brew install sdl2
#       Debian/Ubuntu: sudo apt-get install libsdl2-dev
#       Raspberry Pi:  sudo apt-get install libsdl2-dev
#
# Usage: ./gallery/game_engine/scripts/build-sdl.sh [--run]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/ranger_games/pong_sdl.rgr"
OUT_DIR="$ROOT/tmp/pong-sdl"
CPP_FILE="$OUT_DIR/pong_sdl.cpp"
BIN_FILE="$OUT_DIR/pong_sdl"

mkdir -p "$OUT_DIR"

# Pick a C++ compiler: clang++ is the natural choice on macOS; g++ is the
# reliable default on Linux / Raspberry Pi (where a bare clang++ often can't
# find the libstdc++ headers).
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

# Resolve SDL2 build flags (pkg-config, then sdl2-config).
if command -v pkg-config >/dev/null 2>&1 && pkg-config --exists sdl2; then
  SDL_FLAGS="$(pkg-config --cflags --libs sdl2)"
elif command -v sdl2-config >/dev/null 2>&1; then
  SDL_FLAGS="$(sdl2-config --cflags --libs)"
else
  echo "error: SDL2 not found. Install it:" >&2
  echo "  macOS:         brew install sdl2" >&2
  echo "  Debian/Ubuntu: sudo apt-get install libsdl2-dev" >&2
  exit 1
fi

echo "==> 1/3 Ranger -> C++"
cd "$ROOT"
RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" \
  -nodecli \
  -d="tmp/pong-sdl" \
  -o="pong_sdl.cpp"

# The generated C++ includes "variant.hpp" (Ranger's tagged-union helper).
cp "$ROOT/gallery/invaders/variant.hpp" "$OUT_DIR/variant.hpp"

echo "==> 2/3 $CXX -> native binary (SDL2)"
# Optimize the render/game hot paths; unoptimized builds ran ~5-6x slower per
# frame. Override via CXX_OPT.
CXX_OPT="${CXX_OPT:--O3}"
# shellcheck disable=SC2086
"$CXX" $CXX_OPT -std=c++17 "$CPP_FILE" -o "$BIN_FILE" $SDL_FLAGS

echo "==> 3/3 Ready: $BIN_FILE"

if [[ "${1:-}" == "--run" ]]; then
  echo "==> Running (W/S move, Q/Esc quit)"
  "$BIN_FILE"
else
  echo "Run:            $BIN_FILE"
  echo "Headless smoke: SDL_VIDEODRIVER=dummy $BIN_FILE 120"
fi
