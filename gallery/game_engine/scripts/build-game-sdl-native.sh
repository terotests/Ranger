#!/usr/bin/env bash
# Ranger Game Engine: native compiled game -> C++ -> SDL2 binary.
#
# Compiles a *native* runner (emitter output baked in) — no .tsx load at runtime.
#
# Usage:
#   ./gallery/game_engine/scripts/build-game-sdl-native.sh invaders
#   ./gallery/game_engine/scripts/build-game-sdl-native.sh --run invaders
#   ./gallery/game_engine/scripts/build-game-sdl-native.sh --run pong 300
#
# Games: invaders | pong | pacman

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT_DIR="$ROOT/tmp/game-sdl-native"
CPP_FILE="$OUT_DIR/game_sdl_native.cpp"
BIN_FILE="$OUT_DIR/game_sdl_native"

RUN_MODE=""
GAME="invaders"
EXTRA_FRAMES=""

if [[ "${1:-}" == "--run" ]]; then
  RUN_MODE=1
  GAME="${2:-invaders}"
  EXTRA_FRAMES="${3:-}"
else
  GAME="${1:-invaders}"
fi

case "$GAME" in
  invaders)
    SOURCE="$ROOT/gallery/game_engine/scripting/invaders_native_sdl_runner.rgr"
    PROBE="ship"
    ;;
  pong)
    SOURCE="$ROOT/gallery/game_engine/scripting/pong_native_sdl_runner.rgr"
    PROBE="ball"
    ;;
  pacman)
    SOURCE="$ROOT/gallery/game_engine/scripting/pacman_native_sdl_runner.rgr"
    PROBE="pac"
    ;;
  *)
    echo "error: unknown game '$GAME' (use invaders, pong, or pacman)" >&2
    exit 1
    ;;
esac

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

echo "==> 0/3 Emit Ranger from .tsx (if emitter present)"
if [[ -f "$ROOT/gallery/ts_to_ranger/bin/ts_emitter_main.js" ]]; then
  case "$GAME" in
    invaders)
      node "$ROOT/gallery/ts_to_ranger/bin/ts_emitter_main.js" \
        -i "$ROOT/gallery/game_engine/scripting/invaders.game.tsx" \
        -o invaders_generated.rgr
      ;;
    pong)
      node "$ROOT/gallery/ts_to_ranger/bin/ts_emitter_main.js" \
        -i "$ROOT/gallery/game_engine/scripting/pong.game.tsx" \
        -o pong_generated.rgr
      ;;
    pacman)
      node "$ROOT/gallery/ts_to_ranger/bin/ts_emitter_main.js" \
        -i "$ROOT/gallery/game_engine/scripting/pacman_native.game.tsx" \
        -o pacman_native_generated.rgr
      ;;
  esac
else
  echo "    (skip: run npm run ts2ranger:compile first to refresh generated/*.rgr)"
fi

echo "==> 1/3 Ranger -> C++ ($GAME)"
cd "$ROOT"
RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=cpp "$SOURCE" \
  -nodecli \
  -d="tmp/game-sdl-native" \
  -o="game_sdl_native.cpp"

cp "$ROOT/gallery/invaders/variant.hpp" "$OUT_DIR/variant.hpp"

echo "==> 2/3 $CXX -> native binary (SDL2)"
# shellcheck disable=SC2086
"$CXX" -std=c++17 "$CPP_FILE" -o "$BIN_FILE" $SDL_FLAGS

echo "==> 3/3 Ready: $BIN_FILE ($GAME)"

if [[ -n "$RUN_MODE" ]]; then
  echo "==> Running native $GAME (Left/Right or A/D, Space, Q/Esc quit)"
  if [[ -n "$EXTRA_FRAMES" ]]; then
    SDL_VIDEODRIVER=dummy "$BIN_FILE" "$EXTRA_FRAMES"
  else
    "$BIN_FILE"
  fi
else
  echo "Run: npm run engine:game-sdl-native:run:invaders"
  echo "     npm run engine:game-sdl-native:run:pong"
  echo "     npm run engine:game-sdl-native:run:pacman"
fi
