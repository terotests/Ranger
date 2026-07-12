#!/usr/bin/env bash
# Fast Pi sync: game folders only — no npm compile, no C++ rebuild.
#
# Usage:
#   bash gallery/game_engine/scripts/sync-pi-games.sh pelit
#   bash gallery/game_engine/scripts/sync-pi-games.sh 192.168.1.3
#   bash gallery/game_engine/scripts/sync-pi-games.sh tero@192.168.1.3
#
# Copies (from this repo):
#   gallery/game_engine/games/   — TSX (index.tsx) and WASM (logic.wasm + assets/)
#   gallery/game_engine/lib/     — shared game_helpers.tsx, game.d.ts
#
# WASM logic changes: build locally before sync (or set SYNC_WASM_BUILD=1):
#   npm run engine:wasm:build:rust-autopeli
#   bash gallery/game_engine/scripts/sync-pi-games.sh pelit
#
# Optional: LPC compose.png and other sheet assets:
#   SYNC_LPC_OUTPUT=1 bash gallery/game_engine/scripts/sync-pi-games.sh pelit
#
# Full deploy (repo + game_sdl rebuild + autostart): deploy-pi.sh
# Engine / host fixes (.rgr → game_sdl): CXX_OPT=-O3 npm run engine:game-sdl on the Pi.
#
# game_sdl hot-reloads TSX when files change (default). If a game is already
# running, exit to menu and re-launch, or restart ./start.sh.

set -euo pipefail

TARGET="${1:?usage: sync-pi-games.sh [user@]host}"
if [[ "$TARGET" != *@* ]]; then
  TARGET="tero@${TARGET}"
fi

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
REMOTE_DIR="${RANGER_PI_REMOTE_DIR:-ranger}"
GE="$ROOT/gallery/game_engine"
REMOTE_BASE="~/$REMOTE_DIR/gallery/game_engine"

if [[ "${SYNC_WASM_BUILD:-0}" == "1" ]]; then
  if command -v rustup >/dev/null 2>&1 \
    && rustup target list --installed 2>/dev/null | grep -q '^wasm32-unknown-unknown'; then
    echo "==> Build WASM modules (SYNC_WASM_BUILD=1)"
    (cd "$ROOT" && npm run engine:wasm:build:rust-autopeli)
    (cd "$ROOT" && npm run engine:wasm:build:rust-pong)
  else
    echo "==> SYNC_WASM_BUILD=1 but wasm32-unknown-unknown missing — syncing committed logic.wasm"
    echo "    rustup target add wasm32-unknown-unknown  # then retry"
  fi
fi

echo "==> Test SSH: $TARGET"
ssh -o ConnectTimeout=10 -o BatchMode=yes "$TARGET" 'echo ok'

echo "==> Sync games -> $TARGET:$REMOTE_BASE/games/"
ssh "$TARGET" "mkdir -p $REMOTE_BASE/games $REMOTE_BASE/lib"
rsync -az --delete \
  "$GE/games/" \
  "$TARGET:$REMOTE_BASE/games/"

echo "==> Sync lib -> $TARGET:$REMOTE_BASE/lib/"
rsync -az --delete \
  "$GE/lib/" \
  "$TARGET:$REMOTE_BASE/lib/"

if [[ "${SYNC_LPC_OUTPUT:-0}" == "1" ]]; then
  echo "==> Sync LPC sheets -> $TARGET:$REMOTE_BASE/lpc/output/"
  ssh "$TARGET" "mkdir -p $REMOTE_BASE/lpc/output"
  rsync -az \
    "$GE/lpc/output/" \
    "$TARGET:$REMOTE_BASE/lpc/output/"
fi

if [[ "${SYNC_RANGER_STD_LIB:-0}" == "1" ]]; then
  echo "==> Sync Ranger stdlib -> $TARGET:~/$REMOTE_DIR/lib/"
  ssh "$TARGET" "mkdir -p ~/$REMOTE_DIR/lib"
  rsync -az --delete \
    --exclude '.DS_Store' \
    "$ROOT/lib/" \
    "$TARGET:~/$REMOTE_DIR/lib/"
fi

echo ""
echo "Done. Games synced to ~/$REMOTE_DIR on $TARGET"
echo "  games/  $(find "$GE/games" -name 'index.tsx' -o -name 'logic.wasm' | wc -l | tr -d ' ') entries (tsx + wasm)"
if [[ -f "$GE/games/autopeli_wasm/logic.wasm" ]]; then
  echo "  wasm    autopeli_wasm/logic.wasm ($(wc -c < "$GE/games/autopeli_wasm/logic.wasm" | tr -d ' ') bytes)"
fi
echo "  lib/    game_helpers.tsx, game.d.ts"
if [[ "${SYNC_LPC_OUTPUT:-0}" == "1" ]]; then
  echo "  lpc/output/  compose.png, compose_super.png, …"
fi
if [[ "${SYNC_RANGER_STD_LIB:-0}" == "1" ]]; then
  echo "  ~/ranger/lib/  Ranger stdlib (.rgr)"
fi
echo ""
echo "On the Pi (if game_sdl is already running): exit to menu and re-launch the game."
