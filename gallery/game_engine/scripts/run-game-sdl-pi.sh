#!/usr/bin/env bash
# Launch game_sdl on Raspberry Pi (HDMI display + ALSA audio).
#
# Set RANGER_AUDIO_DEVICE once per Pi/TV wiring. Find N with:
#   aplay -l
#   speaker-test -D plughw:N,0 -c 2 -t wav
#
# Usage (from repo root on Pi):
#   ./gallery/game_engine/scripts/run-game-sdl-pi.sh
#   RANGER_AUDIO_DEVICE=plughw:0,0 ./gallery/game_engine/scripts/run-game-sdl-pi.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
BIN="$ROOT/tmp/game-sdl/game_sdl"

if [[ ! -x "$BIN" ]]; then
  echo "error: build first: cd $ROOT && npm run engine:game-sdl" >&2
  exit 1
fi

export DISPLAY="${DISPLAY:-:0}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"

# HDMI ALSA device — change N if TV is on the other port (default: 1).
export RANGER_AUDIO_DEVICE="${RANGER_AUDIO_DEVICE:-plughw:1,0}"

exec "$BIN" --fullscreen "$@"
