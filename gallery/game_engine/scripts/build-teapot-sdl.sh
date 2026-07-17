#!/usr/bin/env bash
# Ranger: web_teapot_sdl_runner.rgr -> C++ -> native SDL2 + OpenGL/GLES2 binary.
#
# The Three.js teapot (WebTeapotProbe: lighting, TeapotGeometry, OrbitControls,
# the EVG GUI panel, cube-map reflections) drawn natively through ThreeGLBackend's
# GLES2/desktop-GL templates + gfx_sdl (window, GL context, mouse). No WASM.
#
# Requirements: a C++17 compiler + SDL2 dev libs + OpenGL (libGL desktop / GLESv2
# on ARM/Raspberry Pi).
#
# Usage:
#   ./gallery/game_engine/scripts/build-teapot-sdl.sh [--run]
#   ./tmp/teapot-sdl/teapot_sdl                 # windowed: drag orbit, wheel zoom
#   ./tmp/teapot-sdl/teapot_sdl 120 out.ppm     # headless: N frames, capture PPM
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/web/web_teapot_sdl_runner.rgr"
OUT_DIR="$ROOT/tmp/teapot-sdl"
CPP_FILE="$OUT_DIR/teapot_sdl.cpp"
BIN_FILE="$OUT_DIR/teapot_sdl"
mkdir -p "$OUT_DIR"

if [[ "$(uname -s)" == "Darwin" ]]; then PREFERRED=(clang++ g++); else PREFERRED=(g++ clang++); fi
CXX=""
for cc in "${PREFERRED[@]}"; do if command -v "$cc" >/dev/null 2>&1; then CXX="$cc"; break; fi; done
[[ -z "$CXX" ]] && { echo "error: no C++ compiler found" >&2; exit 1; }

if command -v pkg-config >/dev/null 2>&1 && pkg-config --exists sdl2; then
  SDL_FLAGS="$(pkg-config --cflags --libs sdl2)"
elif command -v sdl2-config >/dev/null 2>&1; then
  SDL_FLAGS="$(sdl2-config --cflags --libs)"
else echo "error: SDL2 not found (install libsdl2-dev)" >&2; exit 1; fi

echo "==> 1/2 Ranger -> C++"
cd "$ROOT"
RANGER_OUT="$(RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" -nodecli -d="tmp/teapot-sdl" -o="teapot_sdl.cpp" 2>&1)" || true
echo "$RANGER_OUT" | grep -E '\[FAIL\]' && { echo "error: Ranger compile failed" >&2; exit 1; } || true
cp "$ROOT/gallery/invaders/variant.hpp" "$OUT_DIR/variant.hpp"

echo "==> 2/2 $CXX -> native binary"
GL_FLAGS=""
if [[ "$(uname -s)" == "Darwin" ]]; then GL_FLAGS="-framework OpenGL -DGL_SILENCE_DEPRECATION -Wno-deprecated-declarations"
else
  ARCH="$(uname -m)"
  if [[ "$ARCH" == "aarch64" || "$ARCH" == arm* ]]; then
    if command -v pkg-config >/dev/null 2>&1 && pkg-config --exists glesv2; then GL_FLAGS="$(pkg-config --libs glesv2)"; else GL_FLAGS="-lGLESv2"; fi
  elif ldconfig -p 2>/dev/null | grep -q 'libGL\.so'; then GL_FLAGS="-lGL"; fi
fi
[[ -z "$GL_FLAGS" ]] && { echo "error: OpenGL not found (Pi: apt install libgles2-mesa-dev)" >&2; exit 1; }
# shellcheck disable=SC2086
"$CXX" -O2 -std=c++17 "$CPP_FILE" -o "$BIN_FILE" $SDL_FLAGS $GL_FLAGS -lm
echo "==> Ready: $BIN_FILE"
if [[ "${1:-}" == "--run" ]]; then echo "==> Running (drag orbit, wheel zoom, click panel, Q/Esc quit)"; "$BIN_FILE"; fi
