#!/usr/bin/env bash
# Deploy Ranger game-engine launcher to a Raspberry Pi over SSH.
#
# Usage:
#   bash gallery/game_engine/scripts/deploy-pi.sh pelit
#   bash gallery/game_engine/scripts/deploy-pi.sh 192.168.1.3
#   bash gallery/game_engine/scripts/deploy-pi.sh tero@192.168.1.3
#   RANGER_AUDIO_DEVICE=plughw:0,0 bash gallery/game_engine/scripts/deploy-pi.sh pelit
#
# Autostart on boot (pelit host — enabled by default):
#   ~/initservice.sh  — wires lxsession / labwc / crontab -> ~/start.sh
#   ~/start.sh        — launch game (manual or from autostart)
#
# Copies the local repo (excl. node_modules/tmp), installs deps on the Pi,
# runs npm install + compile + engine:game-sdl build (-O3).

set -euo pipefail

TARGET="${1:?usage: deploy-pi.sh [user@]host}"
if [[ "$TARGET" != *@* ]]; then
  TARGET="tero@${TARGET}"
fi

REMOTE_USER="${TARGET%%@*}"
HOST_SHORT="${TARGET#*@}"

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
REMOTE_DIR="ranger"
AUDIO_DEV="${RANGER_AUDIO_DEVICE:-plughw:1,0}"
CXX_OPT="${CXX_OPT:--O3}"

if [[ -z "${RANGER_PI_AUTOSTART:-}" ]]; then
  if [[ "$HOST_SHORT" == "pelit" ]]; then
    RANGER_PI_AUTOSTART=1
  else
    RANGER_PI_AUTOSTART=0
  fi
fi

if [[ "$RANGER_PI_AUTOSTART" == "1" ]]; then
  TOTAL_STEPS=5
else
  TOTAL_STEPS=4
fi

echo "==> 1/$TOTAL_STEPS Test SSH: $TARGET"
ssh -o ConnectTimeout=10 -o BatchMode=yes "$TARGET" 'echo ok; uname -m'

echo "==> 2/$TOTAL_STEPS Install Pi packages (clang, SDL2, GLES2, alsa-utils, x11-utils, node, npm)"
ssh "$TARGET" 'sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git clang pkg-config libsdl2-dev libgles2-mesa-dev alsa-utils x11-utils nodejs npm'

echo "==> 3/$TOTAL_STEPS Rsync repo -> ~/$REMOTE_DIR"
ssh "$TARGET" "mkdir -p ~/$REMOTE_DIR"
rsync -az --delete \
  --exclude node_modules \
  --exclude tmp \
  --exclude dist \
  --exclude .git/objects \
  "$ROOT/" "$TARGET:~/$REMOTE_DIR/"

echo "==> 4/$TOTAL_STEPS Build game launcher on Pi (CXX_OPT=$CXX_OPT)"
ssh "$TARGET" "cd ~/$REMOTE_DIR && npm install && npm run compile && CXX_OPT=$CXX_OPT npm run engine:game-sdl"

echo "==> Write ~/start.sh + ~/initservice.sh (RANGER_AUDIO_DEVICE=$AUDIO_DEV)"
ssh "$TARGET" "cat > ~/start.sh" <<'STARTEOF'
#!/usr/bin/env bash
set -euo pipefail

LOG="$HOME/ranger-game.log"
if [[ ! -t 1 ]]; then
  exec 9>"$HOME/.ranger-game.lock"
  if ! flock -n 9; then
    exit 0
  fi
  exec >>"$LOG" 2>&1
  echo "=== $(date -Is) start.sh ==="
fi

cd "$HOME/ranger"

export DISPLAY="${DISPLAY:-:0}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export RANGER_AUDIO_DEVICE="${RANGER_AUDIO_DEVICE:-AUDIO_PLACEHOLDER}"

wait_x() {
  if xdpyinfo >/dev/null 2>&1; then
    return 0
  fi
  local i=0
  while [[ $i -lt 120 ]]; do
    if [[ -S /tmp/.X11-unix/X0 ]]; then
      export DISPLAY=:0
      if xdpyinfo -display :0 >/dev/null 2>&1; then
        return 0
      fi
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "start.sh: X display :0 not ready after ${i}s" >&2
  return 1
}

wait_x || export DISPLAY=:0

wait_audio() {
  local dev="$1"
  local i=0
  while [[ $i -lt 20 ]]; do
    if aplay -D "$dev" --dump-hw-params /dev/null 2>/dev/null; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "start.sh: audio $dev not ready yet, starting anyway" >&2
}

wait_audio "$RANGER_AUDIO_DEVICE"

BIN="$HOME/ranger/tmp/game-sdl/game_sdl"
if [[ ! -x "$BIN" ]]; then
  echo "start.sh: missing $BIN — run deploy or: cd ~/ranger && npm run engine:game-sdl" >&2
  exit 1
fi

exec "$BIN" --fullscreen "$@"
STARTEOF
ssh "$TARGET" "cat > ~/initservice.sh" <<'INITEOF'
#!/usr/bin/env bash
# One-shot setup: wire Pi autostart hooks -> ~/start.sh
# Re-run after deploy or when autostart breaks: ~/initservice.sh
set -euo pipefail

START="$HOME/start.sh"
BOOT_DELAY="sleep 8 && $START"
CRON_BOOT="@reboot sleep 12 && $START"

echo "==> Ranger autostart setup"
echo "    game launcher: $START"

if [[ ! -x "$START" ]]; then
  echo "error: $START missing — run deploy-pi.sh first" >&2
  exit 1
fi

mkdir -p "$HOME/.config/autostart" "$HOME/.config/lxsession/LXDE-pi" "$HOME/.config/labwc"

cat > "$HOME/.config/autostart/ranger-game.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Ranger Game
Comment=Ranger SDL game launcher
Exec=/bin/bash -c "$BOOT_DELAY"
Terminal=false
X-GNOME-Autostart-enabled=true
EOF

grep -v 'ranger-game\|start\.sh' "$HOME/.config/lxsession/LXDE-pi/autostart" 2>/dev/null > /tmp/lxas.tmp || true
echo "@/bin/bash -c \"$BOOT_DELAY\"" >> /tmp/lxas.tmp
mv /tmp/lxas.tmp "$HOME/.config/lxsession/LXDE-pi/autostart"

grep -v 'ranger-game\|start\.sh' "$HOME/.config/labwc/autostart" 2>/dev/null > /tmp/labas.tmp || true
echo "/bin/bash -c \"$BOOT_DELAY\" &" >> /tmp/labas.tmp
mv /tmp/labas.tmp "$HOME/.config/labwc/autostart"

( crontab -l 2>/dev/null | grep -v 'start\.sh\|ranger-game' || true
  echo "$CRON_BOOT"
) | crontab -

rm -f "$HOME/ranger-autostart.sh"
systemctl --user disable --now ranger-game.service 2>/dev/null || true
rm -f "$HOME/.config/systemd/user/ranger-game.service"
systemctl --user daemon-reload 2>/dev/null || true
sudo systemctl disable --now ranger-game.service 2>/dev/null || true
sudo rm -f /etc/systemd/system/ranger-game.service
sudo systemctl daemon-reload 2>/dev/null || true

echo "==> Done"
echo "    desktop:  ~/.config/autostart/ranger-game.desktop"
echo "    lxsession: ~/.config/lxsession/LXDE-pi/autostart"
echo "    labwc:    ~/.config/labwc/autostart"
echo "    crontab:  crontab -l"
echo "    log:      ~/ranger-game.log"
echo ""
echo "Reboot to test autostart, or launch manually: $START"
INITEOF
ssh "$TARGET" "sed -i 's|AUDIO_PLACEHOLDER|$AUDIO_DEV|g' ~/start.sh && chmod +x ~/start.sh ~/initservice.sh && ln -sf ../start.sh ~/$REMOTE_DIR/start.sh"

if [[ "$RANGER_PI_AUTOSTART" == "1" ]]; then
  echo "==> 5/$TOTAL_STEPS Run ~/initservice.sh (configure autostart)"
  ssh "$TARGET" '~/initservice.sh'
fi

echo ""
echo "Done. On the Pi:"
echo "  ~/start.sh       — launch game"
echo "  ~/initservice.sh — (re)configure boot autostart"
echo ""
if [[ "$RANGER_PI_AUTOSTART" == "1" ]]; then
  echo "Autostart configured. Log: tail -f ~/ranger-game.log"
fi
echo ""
echo "Audio device: RANGER_AUDIO_DEVICE=$AUDIO_DEV"
echo "  aplay -l && speaker-test -D plughw:N,0 -c 2 -t wav"
echo "  RANGER_AUDIO_DEVICE=plughw:0,0 bash gallery/game_engine/scripts/deploy-pi.sh pelit"
