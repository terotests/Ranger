#!/usr/bin/env bash
# CodeGraph → C++ → native SDL2 + OpenGL binary (macOS / Linux).
#
# The same CodeGraphApp the browser page drives, in a window. Chrome is Full
# EVG (gallery/ui); the graph is RangerFlow; VirtualCompiler runs against an
# in-memory filesystem the host fills from disk.
#
# Requirements:
#   * C++17 compiler (clang++ on macOS, g++ or clang++ on Linux)
#   * SDL2 development libraries
#       macOS:         brew install sdl2
#       Debian/Ubuntu: sudo apt-get install libsdl2-dev
#   * OpenGL — system OpenGL.framework on macOS, libGL (mesa) on Linux
#
# Usage:
#   ./gallery/codegraph/platform/sdl/build.sh [--run [file.rgr] [--frames N]]
#   ./tmp/codegraph-sdl/codegraph_sdl gallery/codegraph/fixtures/calls.rgr
#   SDL_VIDEODRIVER=dummy ./tmp/codegraph-sdl/codegraph_sdl --frames 20

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SOURCE="$ROOT/gallery/codegraph/platform/sdl/codegraph_sdl.rgr"
OUT_DIR="$ROOT/tmp/codegraph-sdl"
CPP_FILE="$OUT_DIR/codegraph_sdl.cpp"
BIN_FILE="$OUT_DIR/codegraph_sdl"
SDL_DIR="$ROOT/gallery/datagrid/platform/sdl"

mkdir -p "$OUT_DIR"

echo "==> 1/3 Ranger -> C++"
cd "$ROOT"
RANGER_OUT="$(RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" -nodecli -d="tmp/codegraph-sdl" -o="codegraph_sdl.cpp" 2>&1)" || true
echo "$RANGER_OUT" | tail -30
if echo "$RANGER_OUT" | grep -q '\[FAIL\]'; then
  echo "error: Ranger compilation failed (see output above)" >&2
  exit 1
fi
if [[ ! -f "$CPP_FILE" ]]; then
  echo "error: expected $CPP_FILE was not written" >&2
  exit 1
fi

cp "$ROOT/gallery/invaders/variant.hpp" "$OUT_DIR/variant.hpp"

if [[ "${1:-}" == "--ranger" ]]; then
  echo "==> stopped after the C++: $CPP_FILE"
  exit 0
fi

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
  echo "error: SDL2 not found. Install it:" >&2
  echo "  macOS:         brew install sdl2" >&2
  echo "  Debian/Ubuntu: sudo apt-get install libsdl2-dev" >&2
  exit 1
fi

echo "==> 2/3 $CXX -> native binary (SDL2 + OpenGL + EVG GL)"
GL_FLAGS=""
if [[ "$(uname -s)" == "Darwin" ]]; then
  GL_FLAGS="-framework OpenGL -DGL_SILENCE_DEPRECATION -Wno-deprecated-declarations"
else
  if command -v pkg-config >/dev/null 2>&1 && pkg-config --exists gl; then
    GL_FLAGS="$(pkg-config --cflags --libs gl)"
  elif ldconfig -p 2>/dev/null | grep -q 'libGL\.so'; then
    GL_FLAGS="-lGL"
  else
    echo "error: OpenGL not found (libGL / mesa)" >&2
    exit 1
  fi
fi

CXX_OPT="${CXX_OPT:--O2}"
MENU_SRC="$SDL_DIR/dgfx_menu_stub.cpp"
MENU_FLAGS=""
if [[ "$(uname -s)" == "Darwin" ]]; then
  MENU_SRC="$SDL_DIR/dgfx_menu.mm"
  MENU_FLAGS="-framework AppKit"
fi
# shellcheck disable=SC2086
"$CXX" $CXX_OPT -std=c++17 \
  -I"$SDL_DIR" -include "$SDL_DIR/evg_gl_native.h" \
  "$CPP_FILE" "$SDL_DIR/evg_gl_native.cpp" $MENU_SRC "$SDL_DIR/dgfx_a11y_stub.cpp" \
  -o "$BIN_FILE" $SDL_FLAGS $GL_FLAGS $MENU_FLAGS

echo "==> 3/3 Ready: $BIN_FILE"

if [[ "${1:-}" == "--run" ]]; then
  shift
  echo "==> Running $BIN_FILE $*"
  "$BIN_FILE" "$@"
else
  echo "Run:            $BIN_FILE [file.rgr]"
  echo "Headless smoke: SDL_VIDEODRIVER=dummy $BIN_FILE --frames 20"
fi
