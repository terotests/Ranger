#!/usr/bin/env bash
# Ranger Game Engine v2: RgSdlMain.rgr -> C++ -> native SDL2 launcher binary.
#
# Boots the v2 rich launcher screen (title / subtitle / category cards / footer)
# in a native SDL2 window via the GENERIC RgSdlGameHost + registry bridge. The
# launcher navigates categories -> games and hands off to a chosen game folder
# through the same RgGameHost the headless tests use — no game logic, and no
# additions to ranger:core. See gallery/game_engine/v2/runtime/sdl/README.md.
#
# The v2 host imports only gfx_sdl.rgr (SDL2 + GL); unlike the v1 game runner it
# needs NO wasm3 and NO libcurl.
#
# Requirements:
#   * a C++17 compiler (clang++ or g++)
#   * SDL2 development libraries (brew install sdl2 / apt-get install libsdl2-dev)
#   * OpenGL (macOS: system framework; Linux: libGL; Pi: libgles2-mesa-dev)
#
# Usage:
#   ./gallery/game_engine/scripts/build-sdl-v2.sh          # build only
#   ./gallery/game_engine/scripts/build-sdl-v2.sh --run    # build + launch

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/v2/runtime/sdl/RgSdlMain.rgr"
OUT_DIR="$ROOT/tmp/sdl-v2"
CPP_FILE="$OUT_DIR/RgSdlMain.cpp"
BIN_FILE="$OUT_DIR/ranger-v2"

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

echo "==> 1/2 Ranger -> C++"
cd "$ROOT"
RANGER_OUT="$(RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" \
  -nodecli \
  -d="tmp/sdl-v2" \
  -o="RgSdlMain.cpp" 2>&1)" || true
echo "$RANGER_OUT" | tail -20
if echo "$RANGER_OUT" | grep -q '\[FAIL\]'; then
  echo "error: Ranger compilation failed (see output above)" >&2
  exit 1
fi

echo "==> 2/2 $CXX -> native binary (SDL2 + OpenGL)"
# gfx_sdl.rgr's shared C++ prelude includes the (unused-by-the-launcher) 3D GL
# path, so the link still needs a GL library even though the launcher only 2D-
# blits. Same detection as build-game-sdl.sh.
GL_FLAGS=""
if [[ "$(uname -s)" == "Darwin" ]]; then
  GL_FLAGS="-framework OpenGL -DGL_SILENCE_DEPRECATION -Wno-deprecated-declarations"
else
  ARCH="$(uname -m)"
  if [[ "$ARCH" == "aarch64" || "$ARCH" == arm* ]]; then
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
CXX_OPT="${CXX_OPT:--O3}"
# shellcheck disable=SC2086
"$CXX" $CXX_OPT -std=c++17 "$CPP_FILE" -o "$BIN_FILE" $SDL_FLAGS $GL_FLAGS -lm

echo "==> Ready: $BIN_FILE"

if [[ "${1:-}" == "--run" ]]; then
  echo "==> Launching v2 launcher (arrows move, Space/A select, S back, Q/Esc quit)"
  "$BIN_FILE"
else
  echo "Launch: npm run engine:game-sdl:launcher:v2"
fi
