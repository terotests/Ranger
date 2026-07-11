#!/usr/bin/env bash
# Deploy Ranger game-engine launcher to a Raspberry Pi over SSH.
#
# Usage:
#   bash gallery/game_engine/scripts/deploy-pi.sh pelit
#   bash gallery/game_engine/scripts/deploy-pi.sh 192.168.1.3
#   bash gallery/game_engine/scripts/deploy-pi.sh tero@192.168.1.3
#   RANGER_AUDIO_DEVICE=plughw:0,0 bash gallery/game_engine/scripts/deploy-pi.sh pelit
#
# Copies the local repo (excl. node_modules/tmp), installs deps on the Pi,
# runs npm install + compile + engine:game-sdl build (-O3), writes ~/ranger/start.sh.

set -euo pipefail

TARGET="${1:?usage: deploy-pi.sh [user@]host}"
if [[ "$TARGET" != *@* ]]; then
  TARGET="tero@${TARGET}"
fi

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
REMOTE_DIR="ranger"
AUDIO_DEV="${RANGER_AUDIO_DEVICE:-plughw:1,0}"
CXX_OPT="${CXX_OPT:--O3}"

echo "==> 1/4 Test SSH: $TARGET"
ssh -o ConnectTimeout=10 -o BatchMode=yes "$TARGET" 'echo ok; uname -m'

echo "==> 2/4 Install Pi packages (clang, SDL2, GLES2, node, npm)"
ssh "$TARGET" 'sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git clang pkg-config libsdl2-dev libgles2-mesa-dev nodejs npm'

echo "==> 3/4 Rsync repo -> ~/$REMOTE_DIR"
ssh "$TARGET" "mkdir -p ~/$REMOTE_DIR"
rsync -az --delete \
  --exclude node_modules \
  --exclude tmp \
  --exclude dist \
  --exclude .git/objects \
  "$ROOT/" "$TARGET:~/$REMOTE_DIR/"

echo "==> 4/4 Build game launcher on Pi (CXX_OPT=$CXX_OPT)"
ssh "$TARGET" "cd ~/$REMOTE_DIR && npm install && npm run compile && CXX_OPT=$CXX_OPT npm run engine:game-sdl"

echo "==> Write ~/ranger/start.sh (RANGER_AUDIO_DEVICE=$AUDIO_DEV)"
ssh "$TARGET" "cat > ~/$REMOTE_DIR/start.sh" <<EOF
#!/usr/bin/env bash
cd "\$(dirname "\$0")"
export DISPLAY="\${DISPLAY:-:0}"
export XDG_RUNTIME_DIR="\${XDG_RUNTIME_DIR:-/run/user/\$(id -u)}"
export RANGER_AUDIO_DEVICE="\${RANGER_AUDIO_DEVICE:-$AUDIO_DEV}"
exec ./tmp/game-sdl/game_sdl --fullscreen "\$@"
EOF
ssh "$TARGET" "chmod +x ~/$REMOTE_DIR/start.sh"

echo ""
echo "Done. Run on the Pi (with display connected):"
echo "  ssh $TARGET"
echo "  cd ~/$REMOTE_DIR && ./start.sh"
echo ""
echo "Audio device (change if wrong HDMI port): RANGER_AUDIO_DEVICE=$AUDIO_DEV"
echo "  aplay -l && speaker-test -D plughw:N,0 -c 2 -t wav"
echo "  RANGER_AUDIO_DEVICE=plughw:0,0 ./start.sh"
