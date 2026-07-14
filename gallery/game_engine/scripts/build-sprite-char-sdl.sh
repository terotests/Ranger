#!/usr/bin/env bash
# Build + run the sprite test game in the engine's SDL renderer.
# sprite_char_sdl.rgr -> C++ -> SDL2 binary. Character-select menu + gamepad
# walk/turn/jump for the ready character set (lpc/pack/characters/). No wasm3:
# the PoC core drives the RGSP1 host bridge directly.
#
# Usage:
#   ./gallery/game_engine/scripts/build-sprite-char-sdl.sh [frames]
#   ./gallery/game_engine/scripts/build-sprite-char-sdl.sh --no-run

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/sprite_char_sdl.rgr"
OUT_DIR="$ROOT/tmp/sprite-char"
CPP_FILE="$OUT_DIR/sprite_char_sdl.cpp"
BIN_FILE="$OUT_DIR/sprite_char_sdl"
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

echo "==> 1/2 Ranger -> C++"
cd "$ROOT"
RANGER_OUT="$(RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" -nodecli -d="tmp/sprite-char" -o="sprite_char_sdl.cpp" 2>&1)" || true
echo "$RANGER_OUT" | tail -20
if echo "$RANGER_OUT" | grep -q '\[FAIL\]'; then
  echo "error: Ranger compilation failed" >&2; exit 1
fi
cp "$ROOT/gallery/invaders/variant.hpp" "$OUT_DIR/variant.hpp"

echo "==> 2/2 $CXX -> native binary (SDL2 + OpenGL)"
GL_FLAGS="-lGL"
if [[ "$(uname -s)" == "Darwin" ]]; then GL_FLAGS="-framework OpenGL"; fi
# shellcheck disable=SC2086
"$CXX" -O2 -std=c++17 "$CPP_FILE" -o "$BIN_FILE" $SDL_FLAGS $GL_FLAGS -lm
echo "==> Ready: $BIN_FILE"

if [[ "${1:-}" != "--no-run" ]]; then
  FRAMES="${1:-300}"
  echo "==> run ($FRAMES frames, dummy driver)"
  SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy "$BIN_FILE" "$FRAMES"
fi
