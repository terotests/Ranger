#!/usr/bin/env bash
# Code editor → C++ → native SDL2 + OpenGL binary (macOS / Linux).
#
# The same CodeEditorPage the browser page runs, drawn through EvgGlPainter
# instead of evg-webgl.js. Requirements are the DataGrid host's:
#   * C++17 compiler, SDL2 development libraries, OpenGL
#       macOS:         brew install sdl2
#       Debian/Ubuntu: sudo apt-get install libsdl2-dev
#
# Usage:
#   ./gallery/datagrid/platform/sdl/build_editor.sh [--run [file.tsx] [frames]]
#   ./tmp/code-editor-sdl/code_editor_sdl gallery/datagrid/src/script/JsTokens.rgr
#   SDL_VIDEODRIVER=dummy ./tmp/code-editor-sdl/code_editor_sdl 20
#
# --cpp-only stops after the Ranger → C++ step, which is what CI can check on
# a machine with no SDL2 on it.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SOURCE="$ROOT/gallery/datagrid/platform/sdl/code_editor_sdl.rgr"
OUT_DIR="$ROOT/tmp/code-editor-sdl"
CPP_FILE="$OUT_DIR/code_editor_sdl.cpp"
BIN_FILE="$OUT_DIR/code_editor_sdl"
CPP_ONLY=0
if [[ "${1:-}" == "--cpp-only" ]]; then
  CPP_ONLY=1
  shift
fi

mkdir -p "$OUT_DIR"

echo "==> 1/3 Ranger -> C++"
cd "$ROOT"
RANGER_OUT="$(RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" \
  -nodecli \
  -d="tmp/code-editor-sdl" \
  -o="code_editor_sdl.cpp" 2>&1)" || true
echo "$RANGER_OUT" | tail -12
if echo "$RANGER_OUT" | grep -q '\[FAIL\]'; then
  echo "error: Ranger compilation failed (see output above)" >&2
  exit 1
fi
if [[ ! -f "$CPP_FILE" ]]; then
  echo "error: expected $CPP_FILE was not written" >&2
  exit 1
fi
cp "$ROOT/gallery/invaders/variant.hpp" "$OUT_DIR/variant.hpp"

if [[ "$CPP_ONLY" == "1" ]]; then
  echo "==> stopped after codegen: $CPP_FILE"
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
  echo "(the Ranger → C++ step above succeeded; only the link needs SDL2)" >&2
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
EVG_GL_NATIVE="$ROOT/gallery/datagrid/platform/sdl/evg_gl_native.cpp"
MENU_SRC="$ROOT/gallery/datagrid/platform/sdl/dgfx_menu_stub.cpp"
MENU_FLAGS=""
if [[ "$(uname -s)" == "Darwin" ]]; then
  MENU_SRC="$ROOT/gallery/datagrid/platform/sdl/dgfx_menu.mm"
  MENU_FLAGS="-framework AppKit"
fi
# shellcheck disable=SC2086
"$CXX" $CXX_OPT -std=c++17 \
  -I"$ROOT/gallery/datagrid/platform/sdl" \
  "$CPP_FILE" "$EVG_GL_NATIVE" $MENU_SRC \
  -o "$BIN_FILE" $SDL_FLAGS $GL_FLAGS $MENU_FLAGS

echo "==> 3/3 Ready: $BIN_FILE"

if [[ "${1:-}" == "--run" ]]; then
  shift
  echo "==> Running $BIN_FILE $*"
  "$BIN_FILE" "$@"
else
  echo "Run:            $BIN_FILE [file.tsx] [frames]"
  echo "Headless smoke: SDL_VIDEODRIVER=dummy $BIN_FILE 20"
fi
