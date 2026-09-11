#!/usr/bin/env bash
# RealTrainer → C++ → native SDL2 + OpenGL binary (macOS / Linux).
#
# The same `RtHost` the iOS and Android ports are, with an event loop around
# it. EvgGlPainter draws the display list through evg_gl_native.cpp; the
# window, the input and the GL present path are the DataGrid's dgfx_* layer,
# which is why that directory is on the include path.
#
# Requirements:
#   * C++17 compiler (clang++ on macOS, g++ or clang++ on Linux)
#   * SDL2 development libraries
#       macOS:         brew install sdl2
#       Debian/Ubuntu: sudo apt-get install libsdl2-dev
#   * OpenGL
#       macOS:         system OpenGL.framework
#       Linux:         libGL (mesa)
#
# Usage:
#   ./gallery/realtrainer/platform/sdl/build.sh [--run [args…]]
#   ./gallery/realtrainer/platform/sdl/build.sh --ranger      # stop after C++
#   ./tmp/rt-sdl/rt_sdl --size 390x844
#   SDL_VIDEODRIVER=dummy ./tmp/rt-sdl/rt_sdl --frames 30

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SOURCE="$ROOT/gallery/realtrainer/platform/sdl/rt_sdl.rgr"
OUT_DIR="$ROOT/tmp/rt-sdl"
CPP_FILE="$OUT_DIR/rt_sdl.cpp"
BIN_FILE="$OUT_DIR/rt_sdl"

mkdir -p "$OUT_DIR"

echo "==> 1/3 Ranger -> C++"
cd "$ROOT"
RANGER_OUT="$(RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" \
  -nodecli \
  -d="tmp/rt-sdl" \
  -o="rt_sdl.cpp" 2>&1)" || true
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

SDL_DIR="$ROOT/gallery/datagrid/platform/sdl"
CXX_OPT="${CXX_OPT:--O2}"
# The native File menu and the accessibility bridge are the DataGrid's, and
# this host wires up neither yet — the stubs are what the symbols resolve to.
# shellcheck disable=SC2086
"$CXX" $CXX_OPT -std=c++17 \
  -I"$SDL_DIR" \
  "$CPP_FILE" "$SDL_DIR/evg_gl_native.cpp" \
  "$SDL_DIR/dgfx_menu_stub.cpp" "$SDL_DIR/dgfx_a11y_stub.cpp" \
  -o "$BIN_FILE" $SDL_FLAGS $GL_FLAGS

echo "==> 3/3 Ready: $BIN_FILE"

if [[ "${1:-}" == "--run" ]]; then
  shift
  echo "==> Running $BIN_FILE $*"
  "$BIN_FILE" "$@"
else
  echo "Run:            $BIN_FILE [--size WxH] [--route /path] [--today YYYY-MM-DD]"
  echo "Headless smoke: SDL_VIDEODRIVER=dummy $BIN_FILE --frames 30"
fi
