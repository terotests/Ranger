#!/usr/bin/env bash
# Ranger Three clone: sponza_sdl_runner.rgr -> C++ -> native SDL2 + OpenGL binary.
#
# Runs the light-probe-volume (Sponza) scene in a native SDL2/GL window: the TSX
# interpreter runs sponza.tsx against the three.tsx façade, the ONE generic
# ThreeTsxBridge reconciles it into the Ranger core AND bakes the diffuse-GI probe
# volume (the capture bake — no model-named recipe), and ThreeGLBackend draws it
# through the shared three_gl operators. Editing gallery/game_engine/three/tsx/
# sponza.tsx while it runs HOT-RELOADS the scene. No WASM.
#
# Requirements: a C++17 compiler (clang++/g++) + SDL2 dev libs + OpenGL + libcurl
# (the model is fetched over HTTPS at load time). On macOS: brew install sdl2 curl.
# On Raspberry Pi / Debian: sudo apt-get install libsdl2-dev libcurl4-openssl-dev.
#
# Usage:
#   ./gallery/game_engine/scripts/build-sponza-sdl.sh            # build only
#   ./gallery/game_engine/scripts/build-sponza-sdl.sh --run      # build + run
#   ./gallery/game_engine/scripts/build-sponza-sdl.sh --run 300  # headless N frames
# Controls: WASD / arrows move, A/B fly up/down, quit button or window close.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/three/sponza_sdl_runner.rgr"
OUT_DIR="$ROOT/tmp/sponza-sdl"
CPP_FILE="$OUT_DIR/sponza_sdl.cpp"
BIN_FILE="$OUT_DIR/sponza_sdl"
TSX_DIR="$ROOT/gallery/game_engine/three/tsx"

mkdir -p "$OUT_DIR"

if [[ "$(uname -s)" == "Darwin" ]]; then
  PREFERRED=(clang++ g++)
else
  PREFERRED=(g++ clang++)
fi
CXX=""
for cc in "${PREFERRED[@]}"; do
  if command -v "$cc" >/dev/null 2>&1; then CXX="$cc"; break; fi
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

# libcurl (the model is fetched over HTTPS at load time).
if command -v pkg-config >/dev/null 2>&1 && pkg-config --exists libcurl; then
  CURL_FLAGS="$(pkg-config --cflags --libs libcurl)"
elif command -v curl-config >/dev/null 2>&1; then
  CURL_FLAGS="$(curl-config --cflags --libs)"
else
  CURL_FLAGS="-lcurl"
fi

echo "==> 1/2 Ranger -> C++"
cd "$ROOT"
RANGER_OUT="$(node "$ROOT/bin/output.js" -l=cpp "$SOURCE" -nodecli -d="tmp/sponza-sdl" -o="sponza_sdl.cpp" 2>&1)" || true
echo "$RANGER_OUT" | tail -20
if echo "$RANGER_OUT" | grep -q '\[FAIL\]'; then
  echo "error: Ranger compilation failed (see output above)" >&2
  exit 1
fi

echo "==> 2/2 $CXX -> native binary (SDL2 + OpenGL)"
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
CXX_OPT="${CXX_OPT:--O2}"
# shellcheck disable=SC2086
"$CXX" $CXX_OPT -std=c++17 -Wno-unused-parameter -Wno-unused-variable "$CPP_FILE" -o "$BIN_FILE" $SDL_FLAGS $GL_FLAGS $CURL_FLAGS -lm

echo "==> Ready: $BIN_FILE"

if [[ "${1:-}" == "--run" ]]; then
  FRAMES="${2:-}"
  echo "==> Running (edit $TSX_DIR/sponza.tsx to hot-reload)"
  if [[ -n "$FRAMES" ]]; then
    SDL_VIDEODRIVER=dummy "$BIN_FILE" "$TSX_DIR" "$FRAMES"
  else
    "$BIN_FILE" "$TSX_DIR"
  fi
fi
